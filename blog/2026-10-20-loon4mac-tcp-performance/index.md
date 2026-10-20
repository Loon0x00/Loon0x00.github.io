---
slug: loon4mac-tcp-performance
title: Loon4Mac build 1007：M1 Max TCP 性能测试
description: Loon4Mac build 1007 在 Apple M1 Max 上的本地 TCP 性能，以及自动和手动测试方法。
authors: [loon]
tags: [Loon4Mac, 性能测试, macOS]
---

即将发布的 Loon4Mac build 1007 对 TCP 转发性能进行了优化。在 Apple M1 Max 上，单流上传达到 **12.25 Gbps**，单流下载达到 **13.97 Gbps**，四流下载合计达到 **20.61 Gbps**。

<!-- truncate -->

## 测试结果

### 测试环境

| 项目 | 配置 |
| --- | --- |
| 设备 | Apple M1 Max，32 GB 内存 |
| 系统 | macOS 27.2 |
| Loon | Loon4Mac build 1007 |
| 测试工具 | Apple iperf3-darwin 3.8.1 |
| TUN MTU | 4000 |

测试流量从本机发出，经 Loon 的 TUN 和 TCP 栈转发到本机 iperf3 服务端。每项预热 2 秒、测试 10 秒，各执行一次。

| 测试项目 | TCP 速度 | Loon NE RSS 峰值 |
| --- | ---: | ---: |
| 单流上传 | **12.25 Gbps** | 55.70 MiB |
| 单流下载 | **13.97 Gbps** | 59.28 MiB |
| 四流上传（合计） | **10.67 Gbps** | 60.55 MiB |
| 四流下载（合计） | **20.61 Gbps** | 90.23 MiB |

测试前 Loon NE 的空载 RSS 约为 46.45 MiB。四流结果是四条 TCP 连接的合计速度；RSS 是整个 Loon 网络扩展进程的内存，不是单条连接占用。

## 测试方法

### Loon 配置

将以下内容合并到现有配置，`DOMAIN` 规则需要放在 `FINAL` 之前：

```ini
[Host]
bench.loon.test = 127.0.0.1

[Rule]
DOMAIN,bench.loon.test,DIRECT
```

保存配置并连接 Loon。`bench.loon.test` 不要加入 `real-ip`，也不要写入系统 `/etc/hosts`。

### 自动测试脚本

[下载 Loon4Mac TCP 测试脚本（占位链接）](https://example.com/loon4mac-tcp-test.sh)

脚本会依次测试单流上传、单流下载、四流上传和四流下载，并记录 Loon NE 的 RSS。

### 手动测试

先在一个终端启动服务端：

```bash
/usr/bin/arch -arm64 /usr/bin/iperf3-darwin -s -B 127.0.0.1 -p 5201
```

在另一个终端依次执行：

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

单流查看最终的 `receiver`，四流查看 `[SUM] receiver`。客户端必须连接 `bench.loon.test`，如果直接连接 `127.0.0.1`，流量不会经过 Loon。
