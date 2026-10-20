#!/bin/bash
# Loon4Mac TCP 性能测试：下载本文件后直接运行。
set -u
set -o pipefail

test_host="${LOON_TEST_HOST:-bench.loon.test}"
test_seconds="${LOON_TEST_SECONDS:-10}"
omit_seconds="${LOON_TEST_OMIT:-2}"
run_id="$(date '+%Y%m%d-%H%M%S')"
output_dir="${LOON_TEST_OUTPUT_DIR:-$PWD/Loon4Mac-TCP-Test-$run_id}"
phase_file=""
monitor_pid=""
server_pid=""
client_pid=""
failed=0
version_file=""

say_error() {
    echo "错误：$*" >&2
}

cleanup() {
    trap - EXIT INT TERM
    if [[ -n "$client_pid" ]] && kill -0 "$client_pid" 2>/dev/null; then
        kill "$client_pid" 2>/dev/null || true
        wait "$client_pid" 2>/dev/null || true
    fi
    if [[ -n "$server_pid" ]] && kill -0 "$server_pid" 2>/dev/null; then
        kill "$server_pid" 2>/dev/null || true
        wait "$server_pid" 2>/dev/null || true
    fi
    if [[ -n "$monitor_pid" ]] && kill -0 "$monitor_pid" 2>/dev/null; then
        kill "$monitor_pid" 2>/dev/null || true
        wait "$monitor_pid" 2>/dev/null || true
    fi
    if [[ -n "$phase_file" ]]; then
        rm -f "$phase_file"
    fi
    if [[ -n "$version_file" ]]; then
        rm -f "$version_file"
    fi
}
trap cleanup EXIT INT TERM

if [[ "$(uname -s)" != "Darwin" ]]; then
    say_error "本脚本仅支持 macOS。"
    exit 2
fi
if [[ $# -ne 0 ]]; then
    say_error "无需参数，直接运行：/bin/bash $(basename "$0")"
    exit 2
fi
case "$test_seconds" in
    ''|*[!0-9]*) say_error "LOON_TEST_SECONDS 必须是整数。"; exit 2 ;;
esac
case "$omit_seconds" in
    ''|*[!0-9]*) say_error "LOON_TEST_OMIT 必须是整数。"; exit 2 ;;
esac
if [[ "$test_seconds" -lt 1 || "$omit_seconds" -lt 0 ]]; then
    say_error "测量时长至少 1 秒，预热时长不能为负数。"
    exit 2
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -n "${IPERF3_BIN:-}" && -x "${IPERF3_BIN}" ]]; then
    iperf_bin="$IPERF3_BIN"
elif [[ -x "$script_dir/iperf3-darwin" ]]; then
    iperf_bin="$script_dir/iperf3-darwin"
elif [[ -x /usr/bin/iperf3-darwin ]]; then
    iperf_bin=/usr/bin/iperf3-darwin
elif command -v iperf3 >/dev/null 2>&1; then
    iperf_bin="$(command -v iperf3)"
else
    say_error "未找到 iperf3。请先执行 brew install iperf3，或通过 IPERF3_BIN 指定可执行文件。"
    exit 2
fi

iperf_command=("$iperf_bin")
if [[ "$(uname -m)" == "arm64" && -x /usr/bin/arch ]]; then
    iperf_command=(/usr/bin/arch -arm64 "$iperf_bin")
fi
version_file="$(mktemp "${TMPDIR:-/tmp}/loon-iperf-version.XXXXXX")" || exit 2
if ! "${iperf_command[@]}" --version > "$version_file" 2>&1; then
    say_error "iperf3 无法运行：$iperf_bin"
    exit 2
fi
iperf_version="$(head -n 1 "$version_file")"
rm -f "$version_file"
version_file=""

find_ne_process() {
    local line pid executable extension bundle_id
    ne_pid=""
    ne_executable=""
    ne_count=0
    while IFS= read -r line; do
        line="${line#${line%%[![:space:]]*}}"
        pid="${line%%[[:space:]]*}"
        executable="${line#*[[:space:]]}"
        executable="${executable#${executable%%[![:space:]]*}}"
        extension=""
        if [[ "$executable" == *'.appex/Contents/MacOS/'* ]]; then
            extension="${executable%%.appex/Contents/MacOS/*}.appex"
        elif [[ "$executable" == *'.systemextension/Contents/MacOS/'* ]]; then
            extension="${executable%%.systemextension/Contents/MacOS/*}.systemextension"
        else
            continue
        fi
        bundle_id="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$extension/Contents/Info.plist" 2>/dev/null)"
        if [[ "$bundle_id" == "com.loon.Loon.LoonTunnelExtension" ]]; then
            ne_pid="$pid"
            ne_executable="$executable"
            ne_count=$((ne_count + 1))
        fi
    done < <(ps -ww -axo pid=,comm= | grep -i loon || true)
    [[ "$ne_count" -eq 1 ]]
}

if ! find_ne_process; then
    say_error "未找到唯一的 Loon Tunnel Extension。请先启动 Loon，并确认其他 Loon NE 实例已退出。"
    exit 2
fi

target_ip="$(dscacheutil -q host -a name "$test_host" 2>/dev/null | awk '/ip_address:/ && $2 ~ /^[0-9]+\./ { print $2; exit }')"
if [[ -z "$target_ip" ]]; then
    say_error "$test_host 无法解析。请先在 Loon 配置中加入 Host 与 Rule，并重载配置。"
    exit 2
fi
case "$target_ip" in
    127.*|0.0.0.0)
        say_error "${test_host} 解析为 ${target_ip}，流量会绕过 Loon；请检查 Fake-IP 与 real-ip 配置。"
        exit 2
        ;;
esac
route_output="$(route -n get "$target_ip" 2>&1)"
route_interface="$(printf '%s\n' "$route_output" | awk '/interface:/ { print $2; exit }')"
case "$route_interface" in
    utun*) ;;
    *) say_error "$target_ip 当前不经 utun（实际：${route_interface:-未知}），停止测试。"; exit 2 ;;
esac

if ! mkdir -p "$output_dir"; then
    say_error "无法创建结果目录：$output_dir"
    exit 2
fi
phase_file="$output_dir/.phase"
memory_csv="$output_dir/ne-rss.csv"
report_file="$output_dir/RESULT.txt"
results_tsv="$output_dir/results.tsv"
printf 'phase,timestamp,rss_kib,cpu_percent\n' > "$memory_csv"
printf 'case\tstatus\treceiver_gbps\tport\n' > "$results_tsv"
printf 'idle\n' > "$phase_file"

sample_memory() {
    local phase sample rss cpu timestamp
    trap - EXIT INT TERM
    while true; do
        phase="$(head -n 1 "$phase_file" 2>/dev/null)"
        sample="$(ps -p "$ne_pid" -o rss=,pcpu= 2>/dev/null)"
        if [[ -z "$sample" ]]; then
            printf 'monitor_error,%s,0,0\n' "$(date '+%s')" >> "$memory_csv"
            return
        fi
        rss="$(printf '%s\n' "$sample" | awk '{ print $1 }')"
        cpu="$(printf '%s\n' "$sample" | awk '{ print $2 }')"
        timestamp="$(date '+%s')"
        printf '%s,%s,%s,%s\n' "$phase" "$timestamp" "$rss" "$cpu" >> "$memory_csv"
        sleep 1
    done
}
sample_memory &
monitor_pid=$!

next_port=$((52000 + $$ % 1000))
allocate_port() {
    while /usr/sbin/lsof -nP -iTCP:"$next_port" -sTCP:LISTEN >/dev/null 2>&1; do
        next_port=$((next_port + 1))
        if [[ "$next_port" -gt 65000 ]]; then
            next_port=52000
        fi
    done
    allocated_port="$next_port"
    next_port=$((next_port + 1))
}

rate_to_gbps() {
    local value="$1" unit="$2" factor
    case "$unit" in
        Kbits/sec) factor=0.000001 ;;
        Mbits/sec) factor=0.001 ;;
        Gbits/sec) factor=1 ;;
        Tbits/sec) factor=1000 ;;
        *) return 1 ;;
    esac
    awk -v value="$value" -v factor="$factor" 'BEGIN { printf "%.3f", value * factor }'
}

run_case() {
    local case_name="$1" streams="$2" reverse="$3"
    local port server_log client_log ready result_line value unit gbps
    local client_args
    allocate_port
    port="$allocated_port"
    server_log="$output_dir/$case_name-server.log"
    client_log="$output_dir/$case_name-client.log"
    client_args=( -c "$target_ip" -4 -p "$port" -O "$omit_seconds" -t "$test_seconds" -i 1 --connect-timeout 3000 --get-server-output )
    if [[ "$streams" -gt 1 ]]; then
        client_args+=( -P "$streams" )
    fi
    if [[ "$reverse" == "yes" ]]; then
        client_args+=( -R )
    fi

    printf '%s\n' "$case_name" > "$phase_file"
    echo "开始：${case_name}（端口 ${port}）"
    "${iperf_command[@]}" -s -1 -B 127.0.0.1 -p "$port" > "$server_log" 2>&1 &
    server_pid=$!
    ready=no
    for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
        if ! kill -0 "$server_pid" 2>/dev/null; then
            break
        fi
        if /usr/sbin/lsof -nP -a -p "$server_pid" -iTCP:"$port" -sTCP:LISTEN 2>/dev/null | grep -q "127.0.0.1:$port"; then
            ready=yes
            break
        fi
        sleep 0.1
    done
    if [[ "$ready" != "yes" ]]; then
        echo "  失败：iperf3 服务端未能监听 127.0.0.1:$port"
        printf '%s\tFAILED\t-\t%s\n' "$case_name" "$port" >> "$results_tsv"
        failed=1
        wait "$server_pid" 2>/dev/null || true
        server_pid=""
        return
    fi

    "${iperf_command[@]}" "${client_args[@]}" > "$client_log" 2>&1 &
    client_pid=$!
    wait "$client_pid"
    client_status=$?
    client_pid=""
    wait "$server_pid" 2>/dev/null
    server_pid=""
    if [[ "$client_status" -ne 0 ]]; then
        echo "  失败：iperf3 退出码 ${client_status}，详见 ${client_log}"
        printf '%s\tFAILED\t-\t%s\n' "$case_name" "$port" >> "$results_tsv"
        failed=1
        return
    fi

    result_line="$(awk '$NF == "receiver" && $(NF-1) ~ /bits\/sec$/ { line=$0 } END { print line }' "$client_log")"
    value="$(printf '%s\n' "$result_line" | awk '{ print $(NF-2) }')"
    unit="$(printf '%s\n' "$result_line" | awk '{ print $(NF-1) }')"
    gbps="$(rate_to_gbps "$value" "$unit")"
    if [[ -z "$result_line" || -z "$gbps" ]]; then
        echo "  失败：无法从 iperf3 输出读取接收吞吐，详见 $client_log"
        printf '%s\tFAILED\t-\t%s\n' "$case_name" "$port" >> "$results_tsv"
        failed=1
        return
    fi
    printf '%s\tMEASURED\t%s\t%s\n' "$case_name" "$gbps" "$port" >> "$results_tsv"
    echo "  接收吞吐：$gbps Gbps"
}

echo "Loon4Mac TCP 性能测试"
echo "目标路径：$test_host → $target_ip → $route_interface → Loon → 127.0.0.1"
echo "NE PID：$ne_pid"
echo "iperf3：$iperf_version"
echo "结果目录：$output_dir"
echo "先采集 5 秒空载 RSS……"
sleep 5

run_case tcp_up_p1 1 no
printf 'between_cases\n' > "$phase_file"; sleep 2
run_case tcp_down_p1 1 yes
printf 'between_cases\n' > "$phase_file"; sleep 2
run_case tcp_up_p4 4 no
printf 'between_cases\n' > "$phase_file"; sleep 2
run_case tcp_down_p4 4 yes

echo "吞吐测试完成，继续采集 10 秒停流 RSS……"
printf 'recovery\n' > "$phase_file"
sleep 10
kill "$monitor_pid" 2>/dev/null || true
wait "$monitor_pid" 2>/dev/null || true
monitor_pid=""

memory_row() {
    local phase="$1"
    awk -F, -v phase="$phase" '
        NR > 1 && $1 == phase && $3 > 0 { count++; sum += $3; if ($3 > peak) peak = $3 }
        END {
            if (count) printf "%d\t%.1f\t%.1f", count, sum / count / 1024, peak / 1024;
            else printf "0\t-\t-";
        }
    ' "$memory_csv"
}

{
    echo "Loon4Mac TCP 性能测试结果"
    echo "时间：$(date '+%Y-%m-%d %H:%M:%S %z')"
    echo "目标：$test_host ($target_ip)，接口：$route_interface"
    echo "NE PID：$ne_pid"
    echo "NE 路径：$ne_executable"
    echo "iperf3：$iperf_version"
    echo "参数：预热 ${omit_seconds}s，测量 ${test_seconds}s，每项 1 次"
    echo
    printf '场景\t状态\t接收吞吐(Gbps)\t端口\n'
    tail -n +2 "$results_tsv"
    echo
    printf 'RSS阶段\t样本数\t平均(MiB)\t峰值(MiB)\n'
    printf '空载\t%s\n' "$(memory_row idle)"
    printf '单流上传\t%s\n' "$(memory_row tcp_up_p1)"
    printf '单流下载\t%s\n' "$(memory_row tcp_down_p1)"
    printf '四流上传\t%s\n' "$(memory_row tcp_up_p4)"
    printf '四流下载\t%s\n' "$(memory_row tcp_down_p4)"
    printf '停流后\t%s\n' "$(memory_row recovery)"
    echo
    echo "说明：RSS 来自 ps，是 Loon Tunnel Extension 的驻留内存，不等于 physical footprint。"
    echo "路径最终确认：请在 Loon 连接记录中核对以上端口均命中 bench.loon.test / DIRECT / 127.0.0.1。"
} > "$report_file"

echo
cat "$report_file"
echo
echo "结果已保存：$report_file"
exit "$failed"
