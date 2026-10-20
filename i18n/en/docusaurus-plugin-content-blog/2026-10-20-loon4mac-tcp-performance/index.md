---
slug: loon4mac-tcp-performance
date: 2026-10-20T11:00:00+08:00
title: Loon4Mac TCP Performance Test
description: Local TCP performance of Loon4Mac on an Apple M1 Max, with automated and manual test instructions.
authors: [loon]
tags: [Loon4Mac, Performance, macOS]
---

Loon4Mac Build 1007 improves TCP forwarding performance. On an Apple M1 Max, a single upload stream reached **12.25 Gbps**, a single download stream reached **13.97 Gbps**, and four download streams reached a combined **20.61 Gbps**.

<!-- truncate -->

## Results

### Test environment

| Item | Configuration |
| --- | --- |
| Device | Apple M1 Max with 32 GB of memory |
| System | macOS 27.2 |
| Loon | Loon4Mac Build 1007 |
| Test tool | Apple iperf3-darwin 3.8.1 |
| TUN MTU | 4000 |

Test traffic originated on the Mac and passed through Loon's TUN and TCP stack to a local iperf3 server. Each test used a 2-second warm-up and a 10-second measurement period and was run once.

| Test | TCP throughput | Peak Loon NE RSS |
| --- | ---: | ---: |
| Single-stream upload | **12.25 Gbps** | 55.70 MiB |
| Single-stream download | **13.97 Gbps** | 59.28 MiB |
| Four-stream upload (combined) | **10.67 Gbps** | 60.55 MiB |
| Four-stream download (combined) | **20.61 Gbps** | 90.23 MiB |

Before testing, Loon NE used approximately 46.45 MiB of RSS while idle. The four-stream values are the combined throughput of four TCP connections. RSS is the memory used by the entire Loon network extension process, not by a single connection.

## Test procedure

### Loon configuration

Merge the following entries into the current configuration. Place the `DOMAIN` rule before `FINAL`:

```ini
[Host]
bench.loon.test = 127.0.0.1

[Rule]
DOMAIN,bench.loon.test,DIRECT
```

Save the configuration and connect Loon. Do not add `bench.loon.test` to `real-ip` or the system `/etc/hosts` file.

### Automated test script

[Download the Loon4Mac TCP test script](/downloads/loon4mac-tcp-test.sh)

Run it after downloading:

```bash
/bin/bash ~/Downloads/loon4mac-tcp-test.sh
```

The script tests single-stream upload, single-stream download, four-stream upload, and four-stream download in sequence, records Loon NE RSS, and saves the results in the current directory.

### Manual testing

Start the server in one Terminal window:

```bash
/usr/bin/arch -arm64 /usr/bin/iperf3-darwin -s -B 127.0.0.1 -p 5201
```

Run the following commands in another Terminal window:

```bash
# Single-stream upload
/usr/bin/arch -arm64 /usr/bin/iperf3-darwin -c bench.loon.test -4 -p 5201 -O 2 -t 10 -i 1

# Single-stream download
/usr/bin/arch -arm64 /usr/bin/iperf3-darwin -c bench.loon.test -4 -p 5201 -O 2 -t 10 -i 1 -R

# Four-stream upload
/usr/bin/arch -arm64 /usr/bin/iperf3-darwin -c bench.loon.test -4 -p 5201 -O 2 -t 10 -i 1 -P 4

# Four-stream download
/usr/bin/arch -arm64 /usr/bin/iperf3-darwin -c bench.loon.test -4 -p 5201 -O 2 -t 10 -i 1 -P 4 -R
```

For single-stream tests, use the final `receiver` result. For four-stream tests, use `[SUM] receiver`. The client must connect to `bench.loon.test`; traffic sent directly to `127.0.0.1` does not pass through Loon.
