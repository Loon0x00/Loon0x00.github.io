---
sidebar_position: 1
---

# 通用配置

本页介绍配置文件 `[General]` 模块中的常用参数。

## 流量绕过

### `include-tun`

适用于 **Build 1007 及以上版本**，支持主配置和插件。

与 `bypass-tun` 作用相反：让指定 IPv4 网段进入 Loon 的 TUN。多个网段使用英文逗号分隔：

```ini
include-tun = 10.7.0.1/32,10.8.0.0/24
```

- 必须填写 IPv4 CIDR 和明确的前缀长度；`/32` 表示单个 IP。
- 不接受域名、裸 IP 或 IPv6，不支持 `${参数名}`、`{参数名}` 或 `%INSERT%` 参数绑定。
- 网络地址会规范化，例如 `10.8.0.9/24` 按 `10.8.0.0/24` 处理。
- 在 Loon 原有包含路由上追加，不替换原有路由；主配置与所有启用插件的条目合并去重。
- 这里只控制是否进入 TUN。需要本机回环时，还需在插件中声明 [IP Rewrite](../Plugin/plugin.md#ip-rewrite)。

### `bypass-tun`

让指定 IP 段或域名绕过 Loon 的 TUN，由系统直接处理：

```ini
bypass-tun = 192.168.0.0/16,localhost,*.local
```

### 包含路由与绕过路由的优先级

当 `include-tun` 与 `bypass-tun` 同时包含某个目的地址：**网络地址和掩码完全相同，include-tun 优先；掩码不同，范围更小的路由优先。** 配置来自主配置还是插件，不影响这一优先级。

| include-tun | bypass-tun | 访问 10.7.0.1 的结果 |
|---|---|---|
| `10.7.0.1/32` | `10.7.0.1/32` | 进入 TUN，移除本次系统设置中冲突的 bypass 项 |
| `10.7.0.1/32` | `10.0.0.0/8` | 进入 TUN，`/32` 比 `/8` 更具体 |
| `10.7.0.0/24` | `10.7.0.1/32` | 绕过 TUN，bypass 的 `/32` 更具体 |

例如：

```ini
[General]
bypass-tun = 10.0.0.0/8
include-tun = 10.7.0.1/32
```

`10.7.0.1` 进入 TUN，`10.7.0.2` 绕过 TUN。主配置原文不会因路由冲突被改写。插件的合并和启停示例见 [插件 General](../Plugin/plugin.md#general)。

### `skip-proxy`

让指定 IP 段或域名绕过 HTTP Proxy：

```ini
skip-proxy = 192.168.0.0/16
```

## DNS

多个 DNS 服务器使用英文逗号分隔。

### `dns-server`

普通 UDP DNS。`system` 表示系统 DNS：

```ini
dns-server = system,1.1.1.1
```

### `doh-server`

DNS over HTTPS：

```ini
doh-server = https://doh.dns.apple.com/dns-query
```

### `doq-server`

DNS over QUIC，默认端口为 784：

```ini
doq-server = quic://example.com,quic://example2.com
```

### `doh3-server`

DNS over HTTP/3：

```ini
doh3-server = h3://223.6.6.6/dns-query
```

### `hijack-dns`

劫持指定目标的 UDP DNS 查询，并返回 Fake IP。适用于 Loon 3.2.5 (789) 及以上版本。

```ini
# *:53 表示所有目标的 53 端口
# *:0 表示所有目标和端口
# 8.8.8.8 表示该 IP 的所有查询
hijack-dns = *:53,8.8.8.8
```

## IP 模式

### `ip-mode`

适用于 Loon 3.2.3 (754) 及以上版本。

| 值 | 行为 |
|---|---|
| `ipv4-only` | 仅使用 IPv4，不查询 AAAA，并拒绝 IPv6 连接 |
| `dual` | 并发查询 A 和 AAAA，使用最先返回的结果 |
| `ipv4-preferred` | 优先使用 IPv4，没有 A 记录时使用 IPv6 |
| `ipv6-preferred` | 优先使用 IPv6，没有 AAAA 记录时使用 IPv4 |

```ini
ip-mode = dual
```

### `ipv6-vif`

控制 TUN 是否配置 IPv6 地址：

| 值 | 行为 |
|---|---|
| `off` | 关闭 IPv6 VIF |
| `auto` | 按当前网络环境自动决定 |
| `always` | 始终启用 IPv6 VIF |

```ini
ipv6-vif = off
```

从 **Build 1007+** 起，插件可以通过此参数关闭 IPv6 VIF：任一启用插件显式声明 `off`，最终采用 `off`；插件声明 `auto`、`always` 或未声明时，沿用主配置。关闭该插件后，若其余启用插件没有声明 `off`，恢复主配置中的模式。

## 局域网访问

### `allow-wifi-access`

允许局域网设备使用 Loon 的代理：

```ini
allow-wifi-access = true
```

### `wifi-access-http-port`

局域网 HTTP 代理端口：

```ini
wifi-access-http-port = 8899
```

### `wifi-access-socks5-port`

局域网 SOCKS5 代理端口：

```ini
wifi-access-socks5-port = 8898
```

## 测试

### `proxy-test-url`

节点测速地址。策略组未单独指定地址时使用此项：

```ini
proxy-test-url = http://cp.cloudflare.com/generate_204
```

### `internet-test-url`

网络可用性检测地址，建议使用可直连访问的 URL：

```ini
internet-test-url = http://wifi.vivo.com.cn/generate_204
```

### `test-timeout`

节点测速超时时间，单位为秒：

```ini
test-timeout = 5
```

## 资源解析

### `resource-parser`

指定订阅资源解析脚本：

```ini
resource-parser = https://github.com/sub-store-org/Sub-Store/releases/latest/download/sub-store-parser.loon.min.js
```

## 网络切换

### `ssid-trigger`

根据 Wi-Fi 或蜂窝网络切换 Loon 模式：

```ini
ssid-trigger = "loon-wifi5g":DIRECT,"cellular":PROXY,"default":RULE
```

- `cellular`：蜂窝网络。
- `default`：其他网络。

### `interface-mode`

指定流量使用的网络接口：

| 值 | 行为 |
|---|---|
| `Auto` | 由系统自动选择 |
| `Cellular` | Wi-Fi 和蜂窝网络同时可用时使用蜂窝网络 |
| `Performace` | 使用当前表现最好的网络接口 |
| `Balance` | 均衡使用可用网络接口 |

```ini
interface-mode = Performace
```

## Fake IP

### `real-ip`

让指定域名返回真实 IP，不使用 Fake IP。适用于系统服务或会缓存 Fake IP 的域名：

```ini
real-ip = *.apple.com,*.icloud.com
```

## UDP 与 STUN

### `disable-udp-ports`

禁止指定端口使用 UDP：

```ini
disable-udp-ports = 443,80
```

### `disable-stun`

禁止 STUN UDP 流量，可用于减少 WebRTC IP 泄漏：

```ini
disable-stun = true
```

### `udp-fallback-mode`

节点不支持 UDP 或未启用 UDP 转发时使用的策略。支持 `DIRECT` 和 `REJECT`，适用于 Loon 3.2.0 (702) 及以上版本。

```ini
udp-fallback-mode = REJECT
```

## 数据库

### `geoip-url`

自定义 GeoIP 数据库下载地址。

### `ipasn-url`

自定义 ASN 数据库下载地址，适用于 Loon 3.2.3 (754) 及以上版本。

## 域名拒绝

### `domain-reject-mode`

设置域名拒绝规则的执行阶段，适用于 Loon 3.2.0 (702) 及以上版本。

| 值 | 行为 |
|---|---|
| `DNS` | 在 DNS 阶段使用 Loopback IP、No Answer 或 NXDomain 拒绝 |
| `Request` | 在请求转发阶段拒绝 |

```ini
domain-reject-mode = DNS
```

:::note

在 HTTP Proxy 与 TUN 模式下，Loon 能拦截的系统 DNS 较少，因此部分请求仍会在转发阶段被拒绝。

:::

### `dns-reject-mode`

设置 DNS 阶段的拒绝方式：

| 值 | 行为 |
|---|---|
| `LOOPBACKIP` | 返回回环 IP |
| `NOANSWER` | 返回空 DNS 响应 |
| `NXDOMAIN` | 返回错误码 3 |

```ini
dns-reject-mode = LOOPBACKIP
```

## 已弃用参数

以下参数仅用于识别旧配置，新配置不应继续使用：

| 参数 | 说明 |
|---|---|
| `ipv6` | 从 Loon 3.2.3 (754) 起由 `ip-mode` 替代 |
| `switch-node-after-failure-times` | Loon 现已自动检测节点可用性 |
| `force-http-engine-hosts` | 从 Loon 3.2.3 (787) 起弃用 |
| `skip-first-packet` | 从 Loon 3.5.0 (968) 起由 Loon 自动识别相关服务 |
