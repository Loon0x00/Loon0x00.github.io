---
slug: loon4mac-tcp-performance
title: Loon4Mac build 1007：M1 Max 本地 TCP 性能与测试方法
description: 在 Apple M1 Max 上测试 Loon4Mac 的本地 NE TCP 转发，记录单流与四流上传下载吞吐、网络扩展 RSS，并提供配置、自动脚本和手动测试步骤。
authors: [loon]
tags: [Loon4Mac, 性能测试, macOS]
---

即将发布的 **Loon4Mac build 1007** 带来了 TCP 转发性能优化。在 Apple M1 Max 上的发布前本地验证中，单流上传达到 **12.25 Gbps**、单流下载达到 **13.97 Gbps**；四流下载合计达到 **20.61 Gbps**，网络扩展进程的 RSS 采样峰值约 **90.23 MiB**。

本文先说明测试环境、配置和结果，再给出可以自行复现的测试方法。这里测量的是经过 Loon 网络扩展与 TCP 栈的本地转发能力，不是互联网测速，也不是绕过 Loon 的原生回环速度。

<!-- truncate -->

## 一、测试环境、配置与结果

### 版本与测试范围

本文对应即将发布的 **build 1007**，记录该版本 TCP 优化实现的发布前验证结果。发布版本号与测试构建标识分开记录：本轮内部验证构建的网络扩展仍自报 `0.4.0 (991)`；这些数据不是对最终 build 1007 发布包重新安装后的独立复测。

本轮只测试 IPv4 TCP，上传和下载分别执行，不是同时双向传输。每个场景只测一次，用于开发验证，不是多轮平均值或长时间稳定性认证。

### 测试环境

| 项目 | 本轮环境 |
| --- | --- |
| 测试日期 | 2026 年 10 月 20 日 |
| 对应发布版本 | Loon4Mac build 1007（即将发布） |
| 实测内部构建标识 | 网络扩展 `0.4.0 (991)`；发布前验证构建 |
| 设备 | 搭载 Apple M1 Max 的 MacBook Pro |
| CPU / 内存 | 10 核 CPU / 32 GiB 统一内存 |
| 系统 | macOS 27.2，系统构建号 `26B5101f` |
| 电源与温控 | 接通电源；测试开始时系统未记录温控或性能警告 |
| 测试工具 | `/usr/bin/iperf3-darwin`，iperf 3.8.1，Apple 版本 `iperf3-135` |
| 执行架构 | 通过 `arch -arm64` 运行 |
| 网络扩展 | Loon system extension；用户重启后测试，测试期间实例未变化 |
| TUN | 本轮为 `utun9`，MTU 4000 |
| 资源采集 | 约每秒采集一次 NE 进程 RSS / CPU；未测 physical footprint |

接口编号、Fake-IP 和进程 PID 都可能在重启后改变，不应照抄为固定值。测试期间系统仍可能有后台活动，结果不是完全隔离环境下的硬件极限。

### 测试配置与流量路径

本轮保留 Loon NE、Fake-IP DNS 和规则模式，通过 Host 映射把测试域名的实际出口指向本机：

```ini
[Host]
bench.loon.test = 127.0.0.1

[Rule]
DOMAIN,bench.loon.test,DIRECT
```

客户端访问 `bench.loon.test`，系统得到的是 Loon 分配的 Fake-IP；Loon 接管连接后，再按 Host 映射连接 `127.0.0.1` 上的 iperf 服务端。`DIRECT` 表示 Loon 的出口直连，**不是绕过 Loon TCP 栈**。

```text
iperf 客户端
    ↕ 系统 TCP / Fake-IP / utun
Loon NE 与 lwIP TCP 栈
    ↕ Loon DIRECT socket
本机 127.0.0.1 上的 iperf 服务端
```

本轮 Fake-IP 为 `198.0.5.95`，本机 TUN IPv4 为 `198.19.0.1`。每个场景前后都检查了路由和扩展身份，并将端口与 Loon 的 TUN 连接日志、DIRECT 规则记录、TCP 栈收发计数关联，确认流量经过 Loon。

网关和 DHCP 在此次环境中保持开启，但压力流量由 Mac 本机发起，不是局域网设备经网关发起；复现本地测试不需要开启网关或 DHCP。没有使用远程代理节点，也没有对这条连接做 TLS 解密。结果不包含远程节点加密、广域网 RTT 或物理网卡带宽的限制。

测试顺序与参数：

- 单流上传 → 单流下载 → 四流上传 → 四流下载，每项一次。
- 每项先预热 2 秒，再测量 10 秒，场景之间间隔约 2 秒。
- 测试前空载观察约 10 秒，全部吞吐测试结束后继续观察约 30 秒。
- 速度使用接收端吞吐；四流使用四条连接合计值。
- 没有额外设置 iperf 的 TCP 窗口、应用写块大小或零拷贝选项。
- 本轮启用了开发诊断计数；报告数值并非“关闭所有诊断后的峰值”。

### 吞吐与内存

| 测试场景 | 接收吞吐 | NE RSS 中位数 | NE RSS 采样峰值 |
| --- | ---: | ---: | ---: |
| 单流上传 | **12.25 Gbps** | 55.36 MiB | 55.70 MiB |
| 单流下载 | **13.97 Gbps** | 59.06 MiB | 59.28 MiB |
| 四流上传合计 | **10.67 Gbps** | 58.81 MiB | 60.55 MiB |
| 四流下载合计 | **20.61 Gbps** | 87.43 MiB | 90.23 MiB |

`Gbps` 是十进制每秒十亿比特，不是 GB/s；`MiB` 是 1,048,576 字节。四流的 20.61 Gbps 是总吞吐，不能写成单条连接达到 20 Gbps。

内存是**整个 Loon 网络扩展进程的 RSS**，不是某条 TCP 连接的独占内存，不包含宿主 App 和两个 iperf 进程。约 1 Hz 采样可能遗漏更短暂的峰值；RSS 也不等同于系统内存压力、堆中存活对象大小或 physical footprint。

| 观察阶段 | NE RSS 中位数 |
| --- | ---: |
| 测试前空载 | 46.45 MiB |
| 停流后 0–5 秒 | 89.98 MiB |
| 停流后 5–15 秒 | 90.03 MiB |
| 停流后 15–30 秒 | 90.00 MiB |

停流后没有立即回到初始 RSS，末段仍高出约 43.55 MiB。这可能涉及分配器保留内存、尚存活对象或其他业务；仅凭这段 RSS 曲线不能判定内存泄漏，也不能宣称内存已全部释放。

同一实现此前一次独立四流测试得到下载合计 19.95 Gbps、RSS 峰值 89.05 MiB；本轮重启后连续测单流和四流，结果处在相近范围。但两轮顺序和初始状态不同，不作为严格重复统计。

### 如何理解这些数字

这轮结果说明，在当前环境与配置下，Loon 的本地 NE 路径可以持续完成约 12–14 Gbps 的单流 TCP 传输，并在四流下载时提供约 20.6 Gbps 的总吞吐。

它不意味着 Wi-Fi、以太网或互联网下载也能达到同样速度，更不能直接换算为其他芯片上的成绩。四流上传没有高于单流上传，也说明增加连接数并不必然增加总吞吐。比较不同软件或版本时，需要统一设备、系统、MTU、iperf 版本、流数、预热和统计口径。

## 二、如何自行测试

### 1. 准备 Loon 配置

将以下内容**合并到现有配置的对应段落**，不要覆盖整份配置：

```ini
[Host]
bench.loon.test = 127.0.0.1

[Rule]
# 放在可能提前命中的规则和 FINAL 之前
DOMAIN,bench.loon.test,DIRECT
```

同时确认：

1. Loon VPN 已连接，使用规则模式，其他 VPN 已关闭。
2. `bench.loon.test` 没有被 `real-ip` 列表及通配符覆盖。
3. 不要把该域名写入系统 `/etc/hosts`，否则可能直接解析到回环地址。
4. 检查插件规则是否提前匹配了该域名；本测试不需要 MITM。
5. 接通电源，暂停大文件下载和高负载任务，测试期间不切换配置、不重启 NE。

如需比较重启后的内存，先自行重启 NE，再执行整组测试，不要只在某个场景前重启。

### 2. 确认工具和路径

本文使用系统提供的 Apple 版 iperf：

```bash
/usr/bin/arch -arm64 /usr/bin/iperf3-darwin --version
dscacheutil -q host -a name bench.loon.test
route -n get bench.loon.test
```

应看到域名解析为 Fake-IP，路由接口为 `utunN`。再用实际接口名查看 MTU，例如：

```bash
ifconfig utun9
```

**如果目标变成 `127.0.0.1`，或路由接口是 `lo0`，请停止测试并检查配置。** 那样测到的是原生回环，而不是 Loon NE。若目标走物理网卡，也不符合本测试路径。

本轮使用 MTU 4000，复测时应记录自己的实际 MTU；不要为了“对齐数字”在测试期间临时修改接口。若系统没有 `/usr/bin/iperf3-darwin`，可以使用自己安装的 iperf3，但需要记录版本，不能假设不同实现和版本完全同口径。

### 3. 一次执行四项的测试脚本

下面是面向读者的简化 Bash 脚本，**不是生成上文历史数据的内部执行器**。它沿用四项顺序、预热和测量时间，自动启动仅监听回环的服务端，并记录 NE RSS / CPU。它不会修改 Loon 配置或启动、关闭 NE。

将代码保存为 `loon-ne-tcp.sh`，在希望保存结果的目录执行：

```bash
bash loon-ne-tcp.sh
```

需要系统自带的 Bash、Apple 版 iperf，以及运行中的 Loon system extension；无需 sudo。端口 5201 必须空闲。输出保存在当前目录下新建的 `loon-ne-tcp.XXXXXX` 文件夹，不会覆盖已有报告。

```bash
#!/bin/bash
set -euo pipefail

domain=bench.loon.test
port=5201
bundle=com.loon.Loon.LoonTunnelExtension
server_pid=
sampler_pid=
out=

# 只清理本脚本创建的服务端和采样进程，不操作 NE。
cleanup() {
  for child in "$sampler_pid" "$server_pid"; do
    if [ -n "$child" ]; then
      kill "$child" 2>/dev/null || true
      wait "$child" 2>/dev/null || true
    fi
  done
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

iperf() {
  /usr/bin/arch -arm64 /usr/bin/iperf3-darwin "$@"
}

iperf --version
target=$(dscacheutil -q host -a name "$domain" |
  awk '/^ip_address: / {print $2; exit}')
if [ -z "$target" ]; then
  echo "无法取得域名的 IPv4 地址，请检查 Loon DNS。" >&2
  exit 1
fi
ne_pid=$(pgrep -f '/com[.]loon[.]Loon[.]LoonTunnelExtension$' || true)
if ! [[ "$ne_pid" =~ ^[0-9]+$ ]]; then
  echo "没有找到唯一的 Loon NE 进程，请先确认 VPN 已连接。" >&2
  exit 1
fi
ne_start=$(ps -p "$ne_pid" -o lstart=)

# 每项前后确认还是同一个 NE，并且目标仍走 TUN。
check_path() {
  test "$(ps -p "$ne_pid" -o lstart=)" = "$ne_start"
  test "$(ps -p "$ne_pid" -o comm= | awk -F/ '{print $NF}')" = "$bundle"
  route -n get "$target" |
    awk '$1 == "interface:" && $2 ~ /^utun[0-9]+$/ {ok=1}
         END {exit !ok}'
}
check_path

out=$(mktemp -d "$PWD/loon-ne-tcp.XXXXXX")
printf '%s\n' "$target" > "$out/target.txt"
route -n get "$target" > "$out/route.txt"
sw_vers > "$out/system.txt"
iperf --version > "$out/iperf-version.txt"
ps -p "$ne_pid" -o pid= -o lstart= -o comm= > "$out/ne-process.txt"
printf 'idle\n' > "$out/phase.txt"
printf 'epoch,phase,rss_kib,cpu_percent\n' > "$out/rss.csv"

# RSS 单位为 KiB；仅代表 NE，不含 iperf 和宿主 App。
sample_rss() {
  while true; do
    values=$(ps -p "$ne_pid" -o rss= -o %cpu=) || break
    read -r rss cpu <<< "$values"
    if ! [[ "$rss" =~ ^[0-9]+$ ]]; then break; fi
    printf '%s,%s,%s,%s\n' "$(date +%s)" "$(cat "$out/phase.txt")" \
      "$rss" "$cpu" >> "$out/rss.csv"
    sleep 1
  done
  printf 'NE RSS 采样中断\n' > "$out/sampling-error.txt"
}
sample_rss &
sampler_pid=$!

/usr/bin/arch -arm64 /usr/bin/iperf3-darwin -s -B 127.0.0.1 -p "$port" > "$out/server.txt" 2>&1 &
server_pid=$!
sleep 1
if ! kill -0 "$server_pid" 2>/dev/null; then
  echo "服务端未启动，请查看 $out/server.txt（可能端口被占用）。" >&2
  exit 1
fi
echo "结果目录：$out"
echo "空载观察 10 秒，请暂停其他业务。"
sleep 10

run_case() {
  local name=$1
  shift
  check_path
  printf '%s\n' "$name" > "$out/phase.txt"
  iperf -c "$target" -4 -p "$port" -O 2 -t 10 -i 1 \
    --connect-timeout 3000 --get-server-output "$@" |
    tee "$out/$name.txt"
  check_path
  printf 'between_cases\n' > "$out/phase.txt"
  sleep 2
}

run_case tcp_up_p1
run_case tcp_down_p1 -R
run_case tcp_up_p4 -P 4
run_case tcp_down_p4 -P 4 -R

echo "吞吐结束，继续观察 RSS 30 秒。"
printf 'recovery_0_5s\n' > "$out/phase.txt"
sleep 5
printf 'recovery_5_15s\n' > "$out/phase.txt"
sleep 10
printf 'recovery_15_30s\n' > "$out/phase.txt"
sleep 15
check_path
kill -0 "$sampler_pid"
test ! -f "$out/sampling-error.txt"
kill "$sampler_pid"
wait "$sampler_pid" 2>/dev/null || true
sampler_pid=

# 将采样 RSS 换算为 MiB，输出每个阶段的采样峰值。
awk -F, 'NR>1 {if ($3>peak[$2]) peak[$2]=$3}
  END {for (phase in peak) printf "%-20s %.2f MiB\n",phase,peak[phase]/1024}' \
  "$out/rss.csv" | sort
echo "完成。吞吐看各 txt 的 receiver；原始 RSS/CPU 在 $out/rss.csv。"
```

脚本中的 `target` 来自当前系统 DNS，不是写死的历史 Fake-IP。脚本检查 `utun` 和进程身份，但不能代替 Loon 自身的连接日志核对；若失败退出，本次结果不应标记为完整有效。它不依赖开发版的 TCP-PERF 日志。

`rss.csv` 的阶段按连续四项划分，后一个场景会继承前一个场景留下的驻留内存。默认保留结果目录便于检查；确认不再需要后可自行删除该目录。不要同时运行自动脚本和下面的手动服务端，以免端口冲突。

### 4. 手动逐项测试

终端一启动服务端，仅监听本机回环：

```bash
/usr/bin/arch -arm64 /usr/bin/iperf3-darwin -s -B 127.0.0.1 -p 5201
```

终端二依次执行以下命令，每项完成后间隔约 2 秒：

```bash
# 单流上传
/usr/bin/arch -arm64 /usr/bin/iperf3-darwin -c bench.loon.test -4 -p 5201 -O 2 -t 10 -i 1

# 单流下载
/usr/bin/arch -arm64 /usr/bin/iperf3-darwin -c bench.loon.test -4 -p 5201 -O 2 -t 10 -i 1 -R

# 四流上传
/usr/bin/arch -arm64 /usr/bin/iperf3-darwin -c bench.loon.test -4 -p 5201 -O 2 -t 10 -i 1 -P 4

# 四流下载
/usr/bin/arch -arm64 /usr/bin/iperf3-darwin -c bench.loon.test -4 -p 5201 -O 2 -t 10 -i 1 -P 4 -R
```

- `-O 2`：先进行 2 秒预热，预热不计入最终吞吐。
- `-t 10`：正式测量 10 秒。
- `-R`：反向传输，即服务端发送、客户端接收，对应下载。
- `-P 4`：并发四条数据连接，结果看 `[SUM] receiver`。
- 单流看最终 `receiver`，不要拿某一秒的峰值代替整段结果；若输出缺少接收端汇总，查看对应服务端结果。

客户端不要改用 `localhost` 或 `127.0.0.1`。服务端绑定 `127.0.0.1` 是正确的，因为它是 Loon 出口连接的目标；客户端直接连接这个地址则会绕过 TUN。

测试结束后，在服务端终端按 `Ctrl+C`。如需持续观察内存，优先使用上面的自动脚本；临时查看 NE RSS / CPU 可以执行：

```bash
pgrep -fl 'com[.]loon[.]Loon[.]LoonTunnelExtension'
# 将 12345 替换为上面实际找到的 NE PID
ps -p 12345 -o pid= -o rss= -o %cpu= -o comm=
```

这里 `rss` 的单位为 KiB，除以 1024 得到 MiB。活动监视器的“内存”列不一定与 `ps` 的 RSS 同口径，不能直接混在同一张对比表中。

### 5. 确认流量经过 Loon

除测试前的 DNS 和路由检查外，还应在 Loon 请求记录中找到本次 `bench.loon.test:5201` 的 TCP 连接，确认策略为 DIRECT。单流测试通常还会出现额外的 iperf 控制连接，四流也不是只出现四条总连接。

开发诊断版可以进一步关联 TCP 栈的实际收发字节、写入和 ACK 计数。本轮采用了这一步来验证路径；普通用户版本没有这些计数时，不应把“没有诊断日志”当作没有经过 TCP 栈。

保存对比结果时，建议同时记录：Loon 与扩展版本、芯片和内存、系统版本、iperf 版本、MTU、流数、是否重启 NE、测试顺序、接收吞吐、NE RSS 空载/峰值/停流值。只有测试条件一致，版本之间的速度与内存差异才有解释价值。
