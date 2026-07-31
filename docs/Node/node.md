---
sidebar_position: 1
---

# 节点

节点代表代理服务器。可以手动添加节点，也可以通过订阅链接导入。

:::note

Loon 不提供代理节点。

:::

## 订阅节点

订阅节点由服务提供商维护。Loon 负责下载和解析，不能直接在 App 中修改订阅内容。

Loon 会读取订阅响应 Header 中的 `Subscription-Userinfo`，用于显示流量和到期时间：

```http
Subscription-Userinfo: upload=1111; download=111; total=123456; expire=1614527045
```

## 支持的协议

- Shadowsocks（stream、AEAD、2022）
  - Shadow TLS 2/3
  - Simple Obfs
- ShadowsocksR
- VMess
  - TCP、WebSocket、HTTP
  - TLS
- VLESS
  - TCP、WebSocket、HTTP
  - XTLS Vision + Reality
- Trojan
  - TCP、WebSocket、HTTP
- HTTP、HTTPS
- SOCKS5
- WireGuard
- Hysteria 2
- AnyTLS（Build 945+）
- Custom by JavaScript

Loon 也支持用 JavaScript 实现自定义代理协议，示例见 [使用 JavaScript 自定义 HTTP 代理](https://github.com/Loon0x00/LoonExampleConfig/blob/master/Script/http.js)。

## 常用参数

| 参数 | 说明 |
|---|---|
| `fast-open` | 启用 TCP Fast Open，需要服务端支持 |
| `udp` | 允许该节点转发 UDP，需要协议和服务端支持 |
| `transport` | 传输方式，如 `tcp`、`ws`、`http` |
| `over-tls` | 启用 TLS |
| `sni` | TLS 握手使用的 SNI |
| `skip-cert-verify` | 跳过证书验证，不建议在不可信环境中开启 |

## 节点格式

### Shadowsocks

```ini
ss1 = Shadowsocks,example.com,443,aes-128-gcm,"password",fast-open=false,udp=true
ss2 = Shadowsocks,example.com,443,chacha20,"password",fast-open=true,udp=true
ss2022 = Shadowsocks,example.com,443,2022-blake3-aes-128-gcm,"MjdlZmY4YWIyZDU0OGNkNw==:YmY2N2QzZjctMjYxMi00MA==",fast-open=true,udp=true
```

使用 Shadow TLS：

```ini
ssShadowTLS = Shadowsocks,example.com,443,2022-blake3-aes-128-gcm,"password",shadow-tls-password="shadow-password",shadow-tls-sni=douyin.com,shadow-tls-version=3,udp-port=8396,udp=true
```

使用 Simple Obfs：

```ini
ssObfsHttp = Shadowsocks,example.com,80,aes-128-gcm,"password",obfs-name=http,obfs-host=www.microsoft.com,obfs-uri=/,fast-open=true,udp=true
ssObfsTLS = Shadowsocks,example.com,443,aes-128-gcm,"password",obfs-name=tls,obfs-host=www.microsoft.com,obfs-uri=/,fast-open=true,udp=true
```

### ShadowsocksR

```ini
ssr1 = ShadowsocksR,example.com,443,aes-256-cfb,"password",protocol=origin,obfs=http_simple,obfs-param=download.windows.com,fast-open=false,udp=true
ssr2 = ShadowsocksR,example.com,10076,chacha20,"password",protocol=auth_aes128_md5,protocol-param=9555:loon,obfs=tls1.2_ticket_auth,obfs-param=download.windows.com,udp=true
```

### HTTP 与 HTTPS

无认证：

```ini
http1 = http,example.com,80
https1 = https,example.com,443
```

使用用户名和密码：

```ini
http2 = http,example.com,80,username,"password"
https2 = https,example.com,443,username,"password",sni=example.com,skip-cert-verify=false
```

用户名包含英文逗号时必须使用双引号：

```ini
https3 = https,example.com,443,"user,name","password"
```

### SOCKS5

```ini
socks1 = socks5,example.com,443,username,"password",sni=example.com,skip-cert-verify=true,udp=true
socks2 = socks5,example.com,8080,"user,name","password"
```

### VMess

TCP：

```ini
vmessTcp = vmess,example.com,10086,aes-128-gcm,"52396e06-041a-4cc2-be5c-8525eb457809",transport=tcp,alterId=0,over-tls=false,udp=true
```

WebSocket：

```ini
vmessWs = vmess,example.com,10086,aes-128-gcm,"52396e06-041a-4cc2-be5c-8525eb457809",transport=ws,alterId=0,path=/,host=www.example.com,over-tls=false,udp=true
```

WebSocket + TLS：

```ini
vmessWss = vmess,example.com,443,aes-128-gcm,"52396e06-041a-4cc2-be5c-8525eb457809",transport=ws,alterId=0,path=/,host=www.example.com,over-tls=true,sni=example.com,skip-cert-verify=false,udp=true
```

HTTP + TLS：

```ini
vmessHttp = vmess,example.com,443,aes-128-gcm,"52396e06-041a-4cc2-be5c-8525eb457809",transport=http,alterId=0,path=/,host=www.example.com,over-tls=true,sni=example.com,udp=true
```

### VLESS

TCP：

```ini
vlessTcp = VLESS,example.com,10086,"52396e06-041a-4cc2-be5c-8525eb457809",transport=tcp,over-tls=false,udp=true
```

WebSocket + TLS：

```ini
vlessWss = VLESS,example.com,443,"52396e06-041a-4cc2-be5c-8525eb457809",transport=ws,path=/,host=www.example.com,over-tls=true,sni=example.com,skip-cert-verify=false,udp=true
```

HTTP + TLS：

```ini
vlessHttp = VLESS,example.com,443,"52396e06-041a-4cc2-be5c-8525eb457809",transport=http,path=/,host=www.example.com,over-tls=true,sni=example.com,udp=true
```

XTLS Vision + Reality：

```ini
vlessReality = VLESS,example.com,443,"ae521383-9375-2e0d-c347-48cf3d98eb6e",transport=tcp,flow=xtls-rprx-vision,public-key="LgJ9bNTyUqBLFkDA12-QgEL7c1yQ1ztk-V1Q-3OLXSk",short-id=164168844958a16d,over-tls=true,sni=douyin.com,udp=true
```

### Trojan

TCP：

```ini
trojanTcp = trojan,example.com,443,"password",alpn=http1.1,sni=example.com,skip-cert-verify=false,udp=true
```

WebSocket：

```ini
trojanWs = trojan,example.com,443,"password",transport=ws,path=/,host=www.example.com,alpn=http1.1,sni=example.com,udp=true
```

HTTP：

```ini
trojanHttp = trojan,example.com,443,"password",transport=http,path=/,host=www.example.com,alpn=http1.1,sni=example.com,udp=true
```

### WireGuard

```ini
wireguardNode = wireguard,interface-ip=192.168.2.2,interface-ipV6=2402:4e00:1200:ed00:0:9089:6dac:96b6,private-key="qF22B3ezOhWGJA4SHwQSsgMa9d6mPGHyFdZMaDTae2E=",mtu=1280,dns=192.168.2.1,dnsV6=2402:4e00:1200:ed00:0:9089:6dac:96b6,keepalive=45,peers=[{public-key="JFuTIJEcFnt8R04UnAE5o2WfIPJUsumSxsD2ayXzoWY=",preshared-key="yVNv5K05AwVnWaR4OB8BlMX3jJlkS74aKlYC3PD95IE=",reserved=[1,2,3],allowed-ips="0.0.0.0/0",endpoint=192.168.3.17:51820}],udp=true
```

### Hysteria 2

```ini
hysteria2Node = Hysteria2,example.com,9898,"password",sni=example.com,skip-cert-verify=true,fast-open=true,salamander-password="obfs-password",udp=true
```

### AnyTLS

```ini
anytlsNode = AnyTLS,example.com,8449,"password",sni=example.com,skip-cert-verify=true,udp=true,block-quic=false
```

### Custom by JavaScript

`script-path` 可以是本地文件名或远程 URL：

```ini
jsHTTP = custom,192.168.1.139,6152,script-path=http.js
```

## 订阅解析器

如果订阅格式无法直接解析，可以在 `[General]` 中配置资源解析器：

```ini
resource-parser = https://github.com/sub-store-org/Sub-Store/releases/latest/download/sub-store-parser.loon.min.js
```

添加订阅时，再开启解析器选项。

## TLS 参数

| 参数 | 说明 |
|---|---|
| `skip-cert-verify` | 是否跳过证书验证，默认 `false` |
| `sni` | TLS 握手发送的 SNI；未填写时使用服务器主机名 |
| `tls-cert-sha256` | 服务器证书 SHA-256 指纹 |
| `tls-pubkey-sha256` | 服务器证书公钥 SHA-256 指纹；配置后优先使用 |
| `tls-profile` | TLS 指纹，如 `safari`、`chrome`，适用于 Build 964+ |

`skip-cert-verify=false` 时，Loon 会检查证书信任链、有效期和主机名。使用自签名证书时，建议将证书安装并信任，而不是关闭验证。

生成证书指纹：

```bash
openssl x509 -noout -fingerprint -sha256 -inform pem -in your-cert.pem
```

生成公钥指纹：

```bash
openssl x509 -pubkey -noout -in your-cert.pem > server_pubkey.pem
openssl pkey -pubin -in server_pubkey.pem -outform DER | openssl dgst -sha256
```
