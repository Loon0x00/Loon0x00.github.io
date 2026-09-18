---
sidebar_position: 2
---

# 订阅节点配置

订阅节点由服务提供商通过 URL 下发。Loon 支持 Loon 标准节点、常见节点 URI、整份 Base64 编码内容，以及包含 `[General]`、`[Host]`、`[Proxy]` 的订阅文件。

## 添加订阅

订阅写在主配置的 `[Remote Proxy]` 段中：

```ini
[Remote Proxy]
机场订阅 = https://example.com/subscription,parser-enabled=true,udp=default,block-quic=default,fast-open=default,vmess-aead=true,skip-cert-verify=default,flexible-sni=false,enabled=true,img-url=https://example.com/icon.png,parser-plugin=订阅解析器,argument="key=value",server-dns="223.5.5.5,https://dns.example.com/dns-query"
```

| 参数 | 说明 |
|---|---|
| `parser-enabled` | 是否使用资源解析器；兼容参数名 `parser-enable` |
| `udp` | 覆盖订阅内节点的 UDP 设置：`true`、`false`、`default` |
| `block-quic` | 覆盖订阅内节点的 QUIC 设置：`true`、`false`、`default` |
| `fast-open` | 覆盖支持该功能的节点的 TCP Fast Open 设置：`true`、`false`、`default` |
| `vmess-aead` | 是否要求 VMess AEAD；`true`、`false`、`default` |
| `skip-cert-verify` | 覆盖 TLS 节点的证书验证设置：`true`、`false`、`default` |
| `flexible-sni` | 节点未指定 SNI，且服务器为 IP、传输层配置了 Host 时，是否使用 Host 作为 SNI |
| `enabled` | 是否启用此订阅 |
| `img-url` | 订阅图标 URL |
| `parser-plugin` | 用于解析订阅的插件名称、标签或 URL |
| `argument` | 传递给资源解析器的参数；兼容参数名 `arguments` |
| `server-dns` | 手动指定订阅内所有节点解析服务器域名时使用的 DNS。多个服务器必须放在同一对双引号内。适用于 Loon 3.5.2 (996) 及以上版本 |

`default` 表示保留节点自身的设置。`server-dns` 支持普通 DNS（DoU）、DoH、DoQ 和 DoH3，格式与[单节点配置](./node.md#节点-dns)相同。

## 订阅响应内容

服务端可以返回以下内容：

- UTF-8 文本；
- 对整份 UTF-8 文本进行 Base64 编码后的内容；
- Loon 标准节点，每行一个；
- `ss://`、`ssr://`、`vmess://`、`vless://`、`trojan://`、`hysteria2://`、`hy2://`、`anytls://` URI，每行一个；
- 带 Section 的订阅文件。

没有 Section 的旧订阅仍然支持。新订阅建议使用 Section 格式，以便同时下发节点 DNS 和 Host Map。空行和以 `#` 开头的注释行会被忽略。

## Section 格式

### `[General]`

`[General]` 用于设置此订阅内节点解析服务器域名时使用的 DNS：

| 参数 | 说明 |
|---|---|
| `dns-server` | 普通 DNS（DoU），支持 `system`、IPv4、IPv6 和自定义端口 |
| `doh-server` | DNS over HTTPS（DoH） |
| `doq-server` | DNS over QUIC（DoQ） |
| `doh3-server` | DNS over HTTP/3（DoH3） |

每项可以配置多个服务器，使用英文逗号分隔。同一优先级的多个 DNS 会并发查询，并采用最先返回的有效结果。

这些配置只用于解析订阅节点的服务器域名，不会替换普通域名请求使用的全局 DNS。

### `[Host]`

`[Host]` 支持与主配置相同的全部 Host Map 类型：

| 类型 | 格式 |
|---|---|
| 域名到 IPv4 或 IPv6 | `example.com = 192.0.2.10` |
| 域名别名 | `example.com = origin.example.com` |
| 域名指定 DNS | `*.example.com = server:https://dns.example.com/dns-query` |
| SSID 指定 DNS | `ssid:Office-WiFi = server:system` |
| 域名指定 IP 栈 | `example.com = ip-mode:prefer-v4` |
| IP 到 IP | `198.51.100.10 = 192.0.2.20` |
| 代理内继续使用映射 | `example.com = 192.0.2.10,use-in-proxy=true` |

域名键支持 `*` 和 `?` 通配符。订阅 Host Map 加载后会合并到当前 Host Map，并优先于主配置中的 Host Map。

### `[Proxy]`

`[Proxy]` 中每行放置一个节点。可以使用[单节点配置](./node.md)中的 Loon 标准格式，也可以放置受支持的节点 URI。

节点行可以使用 `server-dns` 单独指定 DNS。该参数适用于 Loon 3.5.2 (996) 及以上版本；多个服务器必须使用双引号包裹：

```ini
节点 = Shadowsocks,node.example.com,443,aes-128-gcm,"password",server-dns="223.5.5.5,https://dns.example.com/dns-query"
```

## DNS 与 Host Map 匹配顺序

解析订阅节点的服务器域名时，按以下顺序选择配置：

1. 匹配订阅文件 `[Host]` 的固定 IP、别名、指定 DNS 或 IP 栈配置；
2. 匹配主配置中的 Host Map；
3. 使用主配置 `[Remote Proxy]` 中为该订阅手动设置的 `server-dns`；
4. 使用订阅节点行中的 `server-dns`；
5. 使用订阅文件 `[General]` 中的 DNS；
6. 使用当前 SSID DNS 和全局 DNS。

一旦命中指定的节点 DNS，查询失败时不会继续回落到下一层配置。解析 CNAME 时也会继续使用同一组 DNS。

## 流量与到期时间

服务端可以在 HTTP 响应 Header 中返回 `Subscription-Userinfo`：

```http
Subscription-Userinfo: upload=1073741824; download=2147483648; total=107374182400; expire=1798761600
```

| 字段 | 说明 |
|---|---|
| `upload` | 已上传流量，单位为字节 |
| `download` | 已下载流量，单位为字节 |
| `total` | 套餐总流量，单位为字节 |
| `expire` | 到期时间，Unix 时间戳，单位为秒 |

Loon 将 `upload + download` 作为已使用流量。字段名称不区分大小写，字段之间使用英文分号分隔；未提供的字段不会显示。流量数值支持整数和科学计数法。

## 完整下发示例

以下示例同时下发订阅 DNS、全部 Host Map 类型和节点：

```ini
# Loon subscription

[General]
# 普通 DNS（DoU）
dns-server = system,223.5.5.5,[2001:4860:4860::8888]:53
# DNS over HTTPS（DoH）
doh-server = https://dns.alidns.com/dns-query,https://cloudflare-dns.com/dns-query
# DNS over QUIC（DoQ）
doq-server = quic://dns.adguard-dns.com
# DNS over HTTP/3（DoH3）
doh3-server = h3://dns.example.com/dns-query

[Host]
# 域名到 IPv4
hk-node.example.com = 192.0.2.10
# 域名到 IPv6
us-node.example.com = 2001:db8::10
# 域名别名
sg-node.example.com = edge-node.example.com
# 为域名或通配域名指定 DNS
*.jp-node.example.com = server:https://dns.alidns.com/dns-query
*.eu-node.example.com = server:quic://dns.adguard-dns.com
*.h3-node.example.com = server:h3://dns.example.com/dns-query
# 为域名指定 IP 栈
dual-node.example.com = ip-mode:prefer-v4
# 为 SSID 指定 DNS
ssid:Office-WiFi = server:system
# IP 到 IP
198.51.100.10 = 192.0.2.20
# 在代理内继续使用映射
proxy-origin.example.com = 192.0.2.30,use-in-proxy=true

[Proxy]
# 使用订阅 [General] DNS
HK-SS = Shadowsocks,hk-node.example.com,443,aes-128-gcm,"password",udp=true
US-Trojan = Trojan,us-node.example.com,443,"password",transport=tcp,sni=us-node.example.com,udp=true

# 使用订阅 [Host] 中的别名和域名指定 DNS
SG-VMess = VMess,sg-node.example.com,443,auto,"52396e06-041a-4cc2-be5c-8525eb457809",transport=ws,path=/websocket,host=cdn.example.com,over-tls=true,sni=sg-node.example.com,udp=true
JP-Hysteria2 = Hysteria2,tokyo.jp-node.example.com,443,"password",sni=tokyo.jp-node.example.com,udp=true

# 节点行单独指定多个 DNS
Dual-VLESS = VLESS,dual-node.example.com,443,"ae521383-9375-2e0d-c347-48cf3d98eb6e",transport=tcp,over-tls=true,sni=dual-node.example.com,udp=true,server-dns="223.5.5.5,https://dns.google/dns-query"

# URI 节点也可以放在 [Proxy] 中
ss://BASE64-OR-SIP002-URI#URI-Node
```

如果订阅格式需要转换，请在主配置 `[General]` 中设置 `resource-parser`，并在 `[Remote Proxy]` 的订阅项中启用 `parser-enabled=true`。
