---
sidebar_position: 1
---

# 单节点配置

单节点写在主配置的 `[Proxy]` 段中，每行定义一个节点：

```ini
[Proxy]
节点名称 = 协议,服务器,端口,协议必填参数,可选参数
```

参数使用英文逗号分隔。密码、路径或参数值中含有英文逗号时，请使用双引号包裹。

:::note

Loon 不提供代理节点。服务器地址、端口、密码、密钥等信息需要由服务提供商提供。

:::

## 通用参数

以下参数可用于支持它们的节点协议。各协议的完整示例中已经列出对应参数。

| 参数 | 说明 |
|---|---|
| `server-dns` | 解析节点服务器域名时使用的 DNS 服务器。多个服务器使用英文逗号分隔，并用双引号包裹整个值。适用于 Loon 3.5.2 (996) 及以上版本 |
| `ip-mode` | 解析节点服务器域名时使用的 IP 栈策略：`v4-only`、`dual`、`prefer-v4`、`prefer-v6`、`v6-only` |
| `fast-open` | 是否启用 TCP Fast Open |
| `udp` | 是否允许节点转发 UDP |
| `block-quic` | 是否阻止 QUIC；需要节点转发 QUIC 时设置为 `false` |
| `skip-cert-verify` | 是否跳过 TLS 证书验证 |
| `sni` | TLS 握手使用的服务器名称 |
| `tls-profile` | TLS ClientHello 指纹，可使用 `global`、`default`、`safari-ios18`、`safari-ios-26`、`chrome`、`chrome147` |
| `tls-cert-sha256` | 服务器证书的 SHA-256 指纹 |
| `tls-pubkey-sha256` | 服务器证书公钥的 SHA-256 指纹；同时配置两种指纹时优先使用此项 |

### 节点 DNS

`server-dns` 适用于 Loon 3.5.2 (996) 及以上版本。

`server-dns` 只用于解析节点的服务器域名，不会替换普通域名请求使用的全局 DNS。支持以下服务器格式：

- 普通 DNS（DoU）：`system`、`223.5.5.5`、`223.5.5.5:53`、`2001:4860:4860::8888`、`[2001:4860:4860::8888]:53`
- DNS over HTTPS（DoH）：`https://dns.example.com/dns-query`
- DNS over QUIC（DoQ）：`quic://dns.example.com`
- DNS over HTTP/3（DoH3）：`h3://dns.example.com/dns-query`

配置多个服务器时，Loon 会并发查询，并采用最先返回的有效结果：

```ini
server-dns="223.5.5.5,https://dns.example.com/dns-query,quic://dns.example.com,h3://dns.example.com/dns-query"
```

即使只配置一个服务器，也建议使用双引号。未加双引号的单服务器写法仍可解析；Loon 保存配置时会统一补上双引号。

节点服务器域名的解析顺序为：匹配到的 Host Map、节点的 `server-dns`、SSID DNS、全局 DNS。使用节点 `server-dns` 后，查询失败不会回落到 SSID DNS 或全局 DNS；CNAME 后续查询继续使用同一组节点 DNS。

## Shadowsocks

格式：

```ini
节点名称 = Shadowsocks,服务器,端口,加密方式,"密码",可选参数
```

完整参数示例（Simple Obfs）：

```ini
SS = Shadowsocks,ss.example.com,443,aes-128-gcm,"password",obfs-name=http,obfs-host=www.example.com,obfs-uri=/?ed=2048,fast-open=true,udp=true,udp-over-tcp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,https://dns.example.com/dns-query"
```

ShadowTLS 与 Simple Obfs 是不同的传输方式。使用 ShadowTLS 时可写为：

```ini
SS-ShadowTLS = Shadowsocks,ss.example.com,443,2022-blake3-aes-128-gcm,"base64-password",shadow-tls-password="shadow-password",shadow-tls-sni=www.example.com,shadow-tls-version=3,udp-port=8443,fast-open=true,udp=true,udp-over-tcp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,quic://dns.example.com"
```

协议参数：

| 参数 | 说明 |
|---|---|
| `obfs-name` | Simple Obfs 类型：`none`、`http`、`tls` |
| `obfs-host` | Simple Obfs 的 Host |
| `obfs-uri` | Simple Obfs 的请求路径 |
| `udp-over-tcp` | 通过 TCP 承载 UDP |
| `shadow-tls-password` | ShadowTLS 密码 |
| `shadow-tls-sni` | ShadowTLS SNI |
| `shadow-tls-version` | ShadowTLS 版本：`2` 或 `3` |
| `udp-port` | ShadowTLS UDP 端口 |

支持的加密方式：

```text
2022-blake3-aes-128-gcm, 2022-blake3-aes-256-gcm,
aes-128-gcm, aes-192-gcm, aes-256-gcm,
chacha20-ietf-poly1305, xchacha20-ietf-poly1305,
rc4, rc4-md5, aes-128-cfb, aes-192-cfb, aes-256-cfb,
aes-128-ctr, aes-192-ctr, aes-256-ctr, bf-cfb,
camellia-128-cfb, camellia-192-cfb, camellia-256-cfb,
cast5-cfb, des-cfb, idea-cfb, rc2-cfb, seed-cfb,
salsa20, chacha20, chacha20-ietf
```

## ShadowsocksR

格式：

```ini
节点名称 = ShadowsocksR,服务器,端口,加密方式,"密码",protocol=协议,protocol-param=协议参数,obfs=混淆,obfs-param=混淆参数,可选参数
```

完整参数示例：

```ini
SSR = ShadowsocksR,ssr.example.com,443,aes-256-cfb,"password",protocol=auth_aes128_md5,protocol-param=9555:loon,obfs=tls1.2_ticket_auth,obfs-param=download.example.com,fast-open=true,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,https://dns.example.com/dns-query"
```

使用 ShadowTLS 时还支持以下参数：

```ini
SSR-ShadowTLS = ShadowsocksR,ssr.example.com,443,aes-256-cfb,"password",protocol=origin,protocol-param=,obfs=plain,obfs-param=,shadow-tls-password=shadow-password,shadow-tls-sni=www.example.com,shadow-tls-version=3,udp-port=8443,fast-open=true,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,quic://dns.example.com"
```

支持的协议：`origin`、`auth_chain_a`、`auth_chain_b`、`auth_aes128_md5`、`auth_aes128_sha1`、`auth_sha1_v4`、`auth_sha1_v2`、`auth_sha1`。

支持的混淆：`plain`、`tls1.2_ticket_auth`、`http_simple`、`http_post`。

支持的加密方式：`none`、`rc4`、`rc4-md5-6`、`rc4-md5`、`aes-128-cfb`、`aes-192-cfb`、`aes-256-cfb`、`aes-128-ctr`、`aes-192-ctr`、`aes-256-ctr`、`bf-cfb`、`camellia-128-cfb`、`camellia-192-cfb`、`camellia-256-cfb`、`salsa20`、`chacha20`、`chacha20-ietf`。

## HTTP 与 HTTPS

格式：

```ini
节点名称 = http,服务器,端口,用户名,"密码",可选参数
节点名称 = https,服务器,端口,用户名,"密码",可选参数
```

用户名和密码可以省略。用户名、密码中含有英文逗号时必须使用双引号。

HTTPS 完整参数示例：

```ini
HTTPS = https,proxy.example.com,443,"user,name","password",sni=proxy.example.com,skip-cert-verify=false,tls-profile=safari-ios18,tls-cert-sha256=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef,tls-pubkey-sha256=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789,always-use-connect=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,https://dns.example.com/dns-query"
```

HTTP 支持 ShadowTLS：

```ini
HTTP-ShadowTLS = http,proxy.example.com,80,username,"password",shadow-tls-password=shadow-password,shadow-tls-sni=www.example.com,shadow-tls-version=3,always-use-connect=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,quic://dns.example.com"
```

`always-use-connect=true` 表示始终使用 HTTP CONNECT 转发连接。

## SOCKS5

格式：

```ini
节点名称 = socks5,服务器,端口,用户名,"密码",可选参数
```

用户名和密码可以省略。TLS 完整参数示例：

```ini
SOCKS5-TLS = socks5,socks.example.com,443,"user,name","password",over-tls=true,sni=socks.example.com,skip-cert-verify=false,tls-profile=chrome,tls-cert-sha256=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef,tls-pubkey-sha256=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,https://dns.example.com/dns-query"
```

ShadowTLS 与 `over-tls=true` 不同时使用：

```ini
SOCKS5-ShadowTLS = socks5,socks.example.com,443,username,"password",over-tls=false,shadow-tls-password=shadow-password,shadow-tls-sni=www.example.com,shadow-tls-version=3,udp-port=8443,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,quic://dns.example.com"
```

## VMess

格式：

```ini
节点名称 = VMess,服务器,端口,加密方式,"UUID",transport=传输方式,可选参数
```

WebSocket + TLS 完整参数示例：

```ini
VMess = VMess,vmess.example.com,443,aes-128-gcm,"52396e06-041a-4cc2-be5c-8525eb457809",transport=ws,alterId=0,path=/websocket,host=cdn.example.com,over-tls=true,sni=vmess.example.com,skip-cert-verify=false,tls-profile=chrome,tls-cert-sha256=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef,tls-pubkey-sha256=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,https://dns.example.com/dns-query"
```

ShadowTLS 示例：

```ini
VMess-ShadowTLS = VMess,vmess.example.com,443,auto,"52396e06-041a-4cc2-be5c-8525eb457809",transport=tcp,alterId=0,over-tls=false,shadow-tls-password=shadow-password,shadow-tls-sni=www.example.com,shadow-tls-version=3,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,quic://dns.example.com"
```

使用 Reality 参数时：

```ini
VMess-Reality = VMess,vmess.example.com,443,auto,"52396e06-041a-4cc2-be5c-8525eb457809",transport=tcp,alterId=0,public-key="LgJ9bNTyUqBLFkDA12-QgEL7c1yQ1ztk-V1Q-3OLXSk",short-id=164168844958a16d,over-tls=true,sni=www.example.com,tls-profile=chrome,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,h3://dns.example.com/dns-query"
```

`transport` 支持 `tcp`、`ws`、`http`；`host` 和 `path` 用于 WebSocket 或 HTTP 传输。加密方式支持 `none`、`auto`、`aes-128-cfb`、`aes-128-gcm`、`chacha20-ietf-poly1305`。

## VLESS

格式：

```ini
节点名称 = VLESS,服务器,端口,"UUID",transport=传输方式,可选参数
```

WebSocket + TLS 完整参数示例：

```ini
VLESS = VLESS,vless.example.com,443,"52396e06-041a-4cc2-be5c-8525eb457809",transport=ws,path=/websocket,host=cdn.example.com,over-tls=true,sni=vless.example.com,skip-cert-verify=false,tls-profile=safari-ios18,tls-cert-sha256=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef,tls-pubkey-sha256=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,https://dns.example.com/dns-query"
```

XTLS Vision + Reality 示例：

```ini
VLESS-Reality = VLESS,vless.example.com,443,"ae521383-9375-2e0d-c347-48cf3d98eb6e",transport=tcp,flow=xtls-rprx-vision,public-key="LgJ9bNTyUqBLFkDA12-QgEL7c1yQ1ztk-V1Q-3OLXSk",short-id=164168844958a16d,over-tls=true,sni=www.example.com,tls-profile=chrome,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,h3://dns.example.com/dns-query"
```

ShadowTLS 示例：

```ini
VLESS-ShadowTLS = VLESS,vless.example.com,443,"52396e06-041a-4cc2-be5c-8525eb457809",transport=tcp,over-tls=false,shadow-tls-password=shadow-password,shadow-tls-sni=www.example.com,shadow-tls-version=3,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,quic://dns.example.com"
```

`transport` 支持 `tcp`、`ws`、`http`；`flow` 当前支持 `xtls-rprx-vision`。

## Trojan

格式：

```ini
节点名称 = Trojan,服务器,端口,"密码",transport=传输方式,可选参数
```

WebSocket 完整参数示例：

```ini
Trojan = Trojan,trojan.example.com,443,"password",transport=ws,path=/websocket,host=cdn.example.com,alpn="h2,http/1.1",sni=trojan.example.com,skip-cert-verify=false,tls-profile=chrome,tls-cert-sha256=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef,tls-pubkey-sha256=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789,fast-open=true,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,https://dns.example.com/dns-query"
```

Reality 参数示例：

```ini
Trojan-Reality = Trojan,trojan.example.com,443,"password",transport=tcp,public-key="LgJ9bNTyUqBLFkDA12-QgEL7c1yQ1ztk-V1Q-3OLXSk",short-id=164168844958a16d,sni=www.example.com,tls-profile=chrome,alpn=h2,fast-open=true,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,h3://dns.example.com/dns-query"
```

`transport` 支持 `tcp`、`ws`。兼容配置中的 `transport=http` 会按 WebSocket 处理；旧参数 `ws=true`、`ws-path`、`ws-headers=Host:域名` 分别对应 `transport=ws`、`path`、`host`。

## WireGuard

WireGuard 节点由接口参数和一个或多个 Peer 组成：

```ini
WireGuard = WireGuard,interface-ip=192.168.2.2,interface-ipv6=2001:db8:1::2,private-key="qF22B3ezOhWGJA4SHwQSsgMa9d6mPGHyFdZMaDTae2E=",mtu=1280,dns=192.168.2.1,dnsv6=2001:db8:1::1,keepalive=45,peers=[{public-key="JFuTIJEcFnt8R04UnAE5o2WfIPJUsumSxsD2ayXzoWY=",preshared-key="yVNv5K05AwVnWaR4OB8BlMX3jJlkS74aKlYC3PD95IE=",reserved=[1,2,3],allowed-ips="0.0.0.0/0,::/0",endpoint=wg.example.com:51820}],udp=true,server-dns="223.5.5.5,https://dns.example.com/dns-query"
```

| 参数 | 说明 |
|---|---|
| `interface-ip` | WireGuard 接口 IPv4 地址 |
| `interface-ipv6` | WireGuard 接口 IPv6 地址 |
| `private-key` | 本地私钥 |
| `mtu` | 接口 MTU，未配置时为 `1280` |
| `dns` | 隧道内使用的 IPv4 DNS |
| `dnsv6` | 隧道内使用的 IPv6 DNS |
| `keepalive` | Persistent Keepalive 秒数，未配置时为 `45` |
| `peers` | Peer 数组；每个 Peer 支持 `public-key`、`preshared-key`、`reserved`、`allowed-ips`、`endpoint` |
| `udp` | 是否启用 UDP，默认为 `true` |
| `server-dns` | 解析 Peer `endpoint` 域名时使用的 DNS；与隧道内的 `dns`、`dnsv6` 含义不同。适用于 Loon 3.5.2 (996) 及以上版本 |

IPv6 Endpoint 需要写成 `[IPv6地址]:端口`。

## Hysteria 2

格式：

```ini
节点名称 = Hysteria2,服务器,端口,"密码",可选参数
```

完整参数示例：

```ini
Hysteria2 = Hysteria2,hy2.example.com,443,"password",sni=hy2.example.com,skip-cert-verify=false,tls-cert-sha256=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef,tls-pubkey-sha256=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789,alpn="h3",salamander-password=obfs-password,server-ports="20000:20100",hop-interval=30,download-bandwidth=100,fast-open=true,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,quic://dns.example.com"
```

`download-bandwidth` 的单位为 Mbps。`server-ports` 用于端口跳跃，`hop-interval` 是切换端口的间隔秒数。

## AnyTLS

格式：

```ini
节点名称 = AnyTLS,服务器,端口,"密码",可选参数
```

完整参数示例：

```ini
AnyTLS = AnyTLS,anytls.example.com,443,"password",sni=anytls.example.com,skip-cert-verify=false,tls-profile=chrome,tls-cert-sha256=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef,tls-pubkey-sha256=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789,public-key="LgJ9bNTyUqBLFkDA12-QgEL7c1yQ1ztk-V1Q-3OLXSk",short-id=164168844958a16d,idle-session-timeout=30,max-stream-count=8,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,h3://dns.example.com/dns-query"
```

`idle-session-timeout` 是空闲会话超时秒数，`max-stream-count` 是单个会话允许的并发 Stream 数量。`public-key` 和 `short-id` 用于 Reality。

## Custom by JavaScript

`script-path` 可以是本地脚本文件名或远程 URL。完整参数示例：

```ini
Custom = Custom,custom.example.com,443,aes-128-gcm,"password",script-path=https://example.com/custom-proxy.js,sni=custom.example.com,skip-cert-verify=false,tls-profile=chrome,tls-cert-sha256=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef,tls-pubkey-sha256=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,https://dns.example.com/dns-query"
```

脚本协议是否使用加密方式、密码和 TLS 参数，由脚本实现决定。示例脚本见 [使用 JavaScript 自定义 HTTP 代理](https://github.com/Loon0x00/LoonExampleConfig/blob/master/Script/http.js)。

## TLS 证书指纹

`skip-cert-verify=false` 时，Loon 会检查证书信任链、有效期和主机名。使用自签名证书时，建议安装并信任证书，或配置证书指纹。

生成证书指纹：

```bash
openssl x509 -noout -fingerprint -sha256 -inform pem -in your-cert.pem
```

生成公钥指纹：

```bash
openssl x509 -pubkey -noout -in your-cert.pem > server_pubkey.pem
openssl pkey -pubin -in server_pubkey.pem -outform DER | openssl dgst -sha256
```
