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

`transport` 支持 `tcp`、`ws`、`http` 和 `xhttp`。`host` 和 `path` 用于 WebSocket、HTTP 和 XHTTP。加密方式支持 `none`、`auto`、`aes-128-cfb`、`aes-128-gcm`、`chacha20-ietf-poly1305`。XHTTP 的配置见 [XHTTP](#xhttp)。

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

`transport` 支持 `tcp`、`ws`、`http` 和 `xhttp`。`flow` 当前支持 `xtls-rprx-vision`。XHTTP 的配置见 [XHTTP](#xhttp)。

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

`transport` 支持 `tcp`、`ws` 和 `xhttp`。兼容配置中的 `transport=http` 会按 WebSocket 处理。旧参数 `ws=true`、`ws-path`、`ws-headers=Host:域名` 分别对应 `transport=ws`、`path`、`host`。XHTTP 的配置见 [XHTTP](#xhttp)。

## XHTTP

XHTTP 是 VLESS、VMess 和 Trojan 的传输方式。三个协议均支持通过 HTTP/1.1 或 HTTP/2 转发 TCP，开启 `udp=true` 后也可在同一传输中承载 UDP 数据报。VLESS 节点省略 `flow`，VMess 使用 AEAD 和 `alterId=0`，Trojan 使用 TLS 或 REALITY。

```ini
[Proxy]
VLESS-XHTTP = VLESS,vless.example.com,443,"52396e06-041a-4cc2-be5c-8525eb457809",transport=xhttp,path=/xhttp,host=vless.example.com,over-tls=true,sni=vless.example.com,alpn=h2,xhttp-mode=packet-up,udp=true
VMess-XHTTP = VMess,vmess.example.com,443,aes-128-gcm,"52396e06-041a-4cc2-be5c-8525eb457809",alterId=0,transport=xhttp,path=/xhttp,host=vmess.example.com,over-tls=true,sni=vmess.example.com,alpn=http/1.1,xhttp-mode=stream-up,udp=true
Trojan-XHTTP = Trojan,trojan.example.com,443,"password",transport=xhttp,path=/xhttp,host=trojan.example.com,sni=trojan.example.com,alpn=h2,xhttp-mode=stream-one,udp=true
```

### 基础参数

| 参数 | 说明 |
|---|---|
| `transport=xhttp` | 使用 XHTTP，协议的服务器地址、端口和认证参数沿用各协议原来的写法 |
| `path` | XHTTP 请求的基础路径，默认 `/`，可包含查询参数。请与服务端设置一致 |
| `host` | HTTP 请求的 Host，HTTP/2 中对应 `:authority`。省略时优先使用 `sni`，再使用节点服务器地址 |
| `over-tls` | VLESS、VMess 可用 `true` 开启普通 TLS，或用 `false` 使用明文 HTTP/1.1。Trojan 默认使用 TLS |
| `alpn` | 使用 `http/1.1` 或 `h2` 指定 HTTP 版本。省略时，普通 TLS 和 REALITY 使用 `h2`，明文使用 `http/1.1`。HTTP/2 需要普通 TLS 或 REALITY |
| `xhttp-mode` | 支持 `auto`、`packet-up`、`stream-up`、`stream-one`，默认 `auto` |
| `public-key`、`short-id`、`sni` | 使用 REALITY 时，分别填写服务端公钥、Short ID 和服务器名称，`alpn` 可省略或设为 `h2` |
| `udp` | 设为 `true` 后允许 XHTTP 节点转发 UDP |

普通 TLS 的证书校验、证书或公钥指纹及 `tls-profile` 见 [通用参数](#通用参数)。

### 传输模式

HTTP/1.1 和 HTTP/2 都支持三种显式模式。模式应与服务端配置一致。

| 模式 | 上下行组织 |
|---|---|
| `packet-up` | 下行使用持续的 GET。上行数据拆成若干带序号的 HTTP 请求 |
| `stream-up` | 下行使用持续的 GET，上行使用一个持续请求。两个请求使用同一会话 ID |
| `stream-one` | 一个持续请求的请求体和响应体分别承载上传和下载 |
| `auto` | 普通 TLS 或明文选 `packet-up`，REALITY 选 `stream-one` |

### 高级参数

下表列出 HTTP/1.1 和 HTTP/2 上生效的高级参数。生效范围按节点实际使用的模式判断。参数保持 `key=value` 写法，可在节点行中按需组合。

#### 上传与分包

| 参数 | 生效范围 | 用法与默认值 |
|---|---|---|
| `xhttp-uplink-method` | 三种模式的上传请求。`GET` 仅适用于 `packet-up` | 默认 `POST`，也可用 `PUT` 等 HTTP 方法。独立下行请求仍用 `GET` |
| `xhttp-min-post-interval-ms` | 仅 `packet-up` 的相邻上传请求 | 单位为毫秒，默认 `30`。可填单值或闭区间，如 `30-60`。`0` 表示不额外等待 |
| `xhttp-max-post-bytes` | 仅 `packet-up` 的单个上传请求 | 限制单包原始数据字节数，默认 `524288`。可填单值或闭区间，`0` 使用默认上限。放入请求头或 Cookie 时，还受头部容量限制 |
| `xhttp-uplink-data-placement` | 上传请求。`header`、`cookie` 仅适用于 `packet-up` | 默认 `body`。`auto` 和 `body` 都用 HTTP 正文。`header` 或 `cookie` 将编码后的上传数据放进请求头或 Cookie |
| `xhttp-uplink-data-key` | 仅 `packet-up`，且数据放入 `header` 或 `cookie` | 数据字段名前缀。请求头默认 `X-Data`，Cookie 默认 `x_data` |
| `xhttp-uplink-chunk-size` | 仅 `packet-up`，且数据放入 `header` 或 `cookie` | Base64URL 编码后每片的字符数，可填单值或闭区间。请求头默认 `3000-4000`，Cookie 默认 `2048-3072`。设定值最低按 `64` 处理，最后一片可更短 |

#### 填充

三种模式都会为每个 HTTP 请求添加填充。默认把重复的 `X` 放进 `Referer` 所含 URL 的 `x_padding` 查询参数。开启自定义填充后，位置、字段名和生成方式需与服务端一致。

| 参数 | 生效范围 | 用法与默认值 |
|---|---|---|
| `xhttp-padding-bytes` | 三种模式的每个请求 | 默认 `100-1000`，可填单值或闭区间，每个请求独立取值。`0` 使用默认区间 |
| `xhttp-padding-obfs-mode` | 三种模式的每个请求 | 默认 `false`。设为 `true` 后启用下列自定义填充参数 |
| `xhttp-padding-placement` | 开启自定义填充后，三种模式的每个请求 | `queryInHeader` 把填充放到指定请求头所含 URL 的查询参数中，为默认值。`query` 写入实际请求 URL，`header` 直接写入请求头值，`cookie` 写入 Cookie |
| `xhttp-padding-key` | 开启自定义填充，位置为 `queryInHeader`、`query` 或 `cookie` | 填充查询参数或 Cookie 名，默认 `x_padding` |
| `xhttp-padding-header` | 开启自定义填充，位置为 `queryInHeader` 或 `header` | 承载填充的请求头名称，默认 `X-Padding` |
| `xhttp-padding-method` | 开启自定义填充后，三种模式的每个请求 | 默认 `repeat-x`，按字符数生成重复的 `X`。`tokenish` 生成随机字母和数字，填充长度按 HPACK Huffman 编码后的字节数计算 |

#### 请求头

| 参数 | 生效范围 | 用法与默认值 |
|---|---|---|
| `xhttp-header` | 三种模式的每个请求 | 格式为 `xhttp-header="名称: 值"`，每个请求头写一项，可重复填写。`Host` 通过 `host` 设置。填充和 HTTP 分帧所需的请求头由 Loon 生成 |
| `xhttp-no-grpc-header` | 仅 `stream-up` 的持续上传请求和 `stream-one` 的双向请求 | 默认 `false`。设为 `true` 后省略自动添加的 `Content-Type: application/grpc` |

#### 会话 ID 与序号

会话 ID 用来让服务端配对独立的上行和下行请求。序号从 `0` 开始，仅随 `packet-up` 的上传请求发送。自定义位置和字段名需与服务端一致，同一位置的会话 ID、序号和填充字段应使用不同的名称。

| 参数 | 生效范围 | 用法与默认值 |
|---|---|---|
| `xhttp-session-id-placement` | `packet-up`、`stream-up` 的上下行请求 | 支持 `path`、`query`、`header`、`cookie`，默认 `path` |
| `xhttp-session-id-key` | `packet-up`、`stream-up`，且会话 ID 放在查询参数、请求头或 Cookie 中 | 默认查询参数和 Cookie 名为 `x_session`，请求头名为 `X-Session` |
| `xhttp-session-id-table` | `packet-up`、`stream-up`，与会话 ID 长度配合使用 | 自定义字符表或使用区分大小写的预设，如 `Base62`、`hex`、`number`。设置缺省或无效时使用 UUID |
| `xhttp-session-id-length` | `packet-up`、`stream-up`，与会话 ID 字符表配合使用 | 可填正整数或闭区间。自定义设置有效时生效，默认使用 36 字符的 UUID |
| `xhttp-seq-placement` | 仅 `packet-up` 的上传请求 | 支持 `path`、`query`、`header`、`cookie`，默认 `path` |
| `xhttp-seq-key` | 仅 `packet-up` 的上传请求，且序号放在查询参数、请求头或 Cookie 中 | 默认查询参数和 Cookie 名为 `x_seq`，请求头名为 `X-Seq` |

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

## Tailscale

从 3.5.4 (1016) 开始支持。

Tailscale 节点加入你的 Tailscale 网络（tailnet），通过其中的设备转发 TCP、UDP。设备地址和对端连接资料由控制服务器下发，不需要手动填写服务器地址、端口或 WireGuard Peer。

格式：

```ini
节点名称 = tailscale,可选参数
```

网页授权示例：

```ini
Tailscale = tailscale,hostname=loon-iphone
```

不填写 `auth-key` 时，首次使用节点会获取网页授权地址。启用 VPN 后，让请求使用该节点，iOS／macOS 会通过通知提示授权；点击通知进入浏览器完成登录，请确保已允许 Loon 发送通知。也可以在 VPN 已连接时，使用节点页面的“登录”入口进行授权。授权成功后会保存身份，后续连接继续使用。

使用 Auth Key 并指定出口设备：

```ini
Tailscale-Exit = tailscale,auth-key="tskey-auth-替换为你的密钥",hostname=loon-iphone,exit-node=100.101.102.103
```

将 `exit-node` 改为 `auto`，会从可用的出口设备中随机选择一个；当前选择仍可用时，刷新设备资料会继续使用它。

允许组网设备访问本机服务，并将本机发布为出口的示例

```ini
Tailscale-Home = tailscale,hostname=loon-home,allow-inbound=true,advertise-exit-node=true,exit-fake-ip=true
```

开启 `allow-inbound` 或 `advertise-exit-node` 后，Loon 会在 VPN 启动后主动连接这个节点，并保持它在线。作为出口需要在控制后台批准。只想访问本机服务时，开启 `allow-inbound` 即可。

完整参数示例：

```ini
Tailscale = tailscale,control-url="https://controlplane.tailscale.com",auth-key="tskey-auth-替换为你的密钥",hostname=loon-iphone,exit-node=auto,accept-routes=true,accept-dns=true,magic-dns=true,allow-inbound=false,advertise-exit-node=false,exit-fake-ip=true,path-mode=auto,mtu=1280,idle-session-timeout=300,ip-mode=prefer-v4,server-dns="223.5.5.5,https://dns.example.com/dns-query",udp=true,block-quic=true
```

| 参数 | 默认值 | 说明 |
|---|---|---|
| `auth-key` | 不填写 | 用于注册设备的 Auth Key。使用有效密钥时通常不需要网页登录；省略此项使用网页授权。这里填写密钥，不填写网页授权 URL |
| `control-url` | `https://controlplane.tailscale.com` | 控制服务器地址，可省略；使用自定义控制服务器时填写对应的 HTTP／HTTPS URL |
| `hostname` | 自动生成 | 本机加入 Tailscale 网络后的设备名称，与 Loon 中的节点名称不同 |
| `exit-node` | `none` | 互联网出口设备。`none` 表示不使用出口；`auto` 自动选择；也可填写设备名称、完整 MagicDNS 名称或 Tailscale IP |
| `accept-routes` | `true` | 使用设备提供的子网路由，通过 Tailscale 设备访问它所在局域网的其他设备，例如通过家里的 Mac 访问 NAS |
| `accept-dns` | `true` | 接受 Tailscale 下发的 DNS 服务器、域名分流和搜索域设置。使用出口时，按下发设置选择 DNS 或通过出口设备查询；关闭后，普通公网域名使用 Loon 原有 DNS 流程，设备 MagicDNS 仍可根据已下发资料解析 |
| `magic-dns` | `true` | 根据设备资料自动添加完整 MagicDNS 域名和设备 IP 的分流规则；tailnet 启用 MagicDNS 时，也添加所属域名后缀规则。匹配的请求使用此节点，与 `accept-dns` 独立 |
| `allow-inbound` | `false` | 允许有访问权限的组网设备通过本机的 Tailscale 地址连接本机 TCP 或 UDP 服务，例如 SSH 或 HTTP |
| `advertise-exit-node` | `false` | 将本机发布为出口节点。经控制后台批准后，其他组网设备可选本机作为出口，互联网流量由本机的 Loon 规则决定如何转发 |
| `exit-fake-ip` | `true` | 本机作为出口并处理客户端 DNS 查询时，对符合条件的 A 或 AAAA 查询返回 Fake IP。转发时用该地址找回域名，再按本机的域名规则分流。设为 `false` 时返回真实 IP |
| `path-mode` | `auto` | `auto` 自动选择通路，尝试 P2P 直连并在需要时使用 DERP 中继；`derp` 仅使用 DERP 中继 |
| `mtu` | `1280` | 内层 IP 包的 MTU。允许 `576`～`1280`；小于 `1280` 时必须同时设置 `ip-mode=v4-only` |
| `idle-session-timeout` | `300` | 没有业务连接后的会话空闲关闭时间，填写非负整数，单位为秒；`0` 表示不因空闲关闭。关闭后，下次使用节点会重新连接，已保存的身份保留。开启 `allow-inbound` 或 `advertise-exit-node` 时，此值固定为 `0` |
| `ip-mode` | 未指定 | 地址族策略，支持 `v4-only`、`dual`、`prefer-v4`、`prefer-v6`、`v6-only`；影响域名解析及目标连接使用的 IPv4／IPv6 地址 |
| `server-dns` | 未设置 | 解析控制服务器、中继服务器等连接地址中的域名时使用的 DNS，格式见上方“节点 DNS”；不会替换 Tailscale 下发的 DNS 设置 |
| `udp` | `true` | 是否允许业务 UDP 转发；此项不是 P2P 开关，仅使用中继请设置 `path-mode=derp` |
| `block-quic` | `true` | 是否拦截 QUIC；需要通过节点转发 QUIC 时设置为 `false`，并保持 `udp=true` |

`accept-dns` 决定如何解析域名，`magic-dns` 决定设备域名和 IP 使用哪个节点转发。例如，自动匹配 `nas.example.ts.net` 到此 Tailscale 节点，并不等于将所有公网域名的 DNS 查询都交给该节点。

首次入网后会保存自动规则，后续连接时刷新；VPN 重启后也可加载已保存的规则。`magic-dns` 的自动分流在规则模式下生效。

:::note

- `exit-node` 指定的是接收转发流量的设备，不是将当前 Loon 设备发布为出口。该设备需要已开启出口功能，并在控制后台获准使用。
- 默认 `exit-node=none`，用于访问 Tailscale 设备和已接受的子网。要通过节点访问普通互联网地址，需要指定可用出口。
- 普通请求仍由 Loon 的规则或全局模式决定是否使用此节点；`accept-routes=true` 只是允许使用子网路由，不会自动把整个远端局域网加入 Loon 分流规则。

:::

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

## Snell

从 3.5.4 (1017) 开始支持。

支持 Snell v4 和 v5 的 TCP 转发及普通 UDP 转发。普通 UDP 数据报通过 Snell 的 TCP 连接传输。

**配置格式**

```ini
节点名称 = Snell,服务器,端口,"PSK",version=4,可选参数
```

将 `"PSK"` 替换为服务端配置的预共享密钥。也可以在同一位置写成 `psk="PSK"`。

**配置示例**

```ini
[Proxy]
Snell-v4 = Snell,snell.example.com,6160,"your-psk",version=4
Snell-v5 = Snell,snell.example.com,6161,"your-psk",version=5,udp=true
Snell-HTTP = Snell,snell.example.com,6162,"your-psk",version=4,obfs=http,obfs-host=www.example.com,obfs-uri=/,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,https://dns.example.com/dns-query"
```

仅在服务端使用 HTTP 混淆时配置 `obfs=http`。

| 参数 | 说明 |
|---|---|
| `version` | 支持 `4` 和 `5`，默认 `4` |
| `udp` | 设置为 `true` 后允许转发 UDP，默认 `false`。服务端也需要支持 UDP 转发 |
| `block-quic` | 是否阻止 QUIC 流量，默认 `true`。设为 `false` 后，允许的 QUIC 流量走普通 UDP 转发 |
| `obfs` | 混淆类型，可用 `none` 或 `http`，默认 `none`。也可使用参数名 `obfs-name` |
| `obfs-host` | HTTP 混淆的 Host，仅在 `obfs=http` 时使用，默认取节点服务器地址 |
| `obfs-uri` | HTTP 混淆的请求路径，仅在 `obfs=http` 时使用，必须以 `/` 开头，默认为 `/` |
| `ip-mode`、`server-dns` | 节点服务器域名解析选项，见 [通用参数](#通用参数) |

手动添加 Snell 节点时使用 v4。需要指定 v5 时，可在配置文件的 `[Proxy]` 段填写 `version=5`。

尚未接入 [Snell v5 的 QUIC Proxy Mode](https://kb.nssurge.com/surge-knowledge-base/release-notes/snell#quic-proxy-mode)。

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
