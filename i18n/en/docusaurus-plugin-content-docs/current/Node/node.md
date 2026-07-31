---
sidebar_position: 1
---

# Nodes

A node represents a proxy server. Nodes can be added manually or imported from a subscription URL.

:::note

Loon does not provide proxy nodes.

:::

## Subscription nodes

Subscription nodes are maintained by the service provider. Loon downloads and parses them, but their contents cannot be edited directly in the app.

Loon reads the `Subscription-Userinfo` response header to display traffic usage and expiration:

```http
Subscription-Userinfo: upload=1111; download=111; total=123456; expire=1614527045
```

## Supported protocols

- Shadowsocks (stream, AEAD, and 2022)
  - Shadow TLS 2/3
  - Simple Obfs
- ShadowsocksR
- VMess
  - TCP, WebSocket, and HTTP
  - TLS
- VLESS
  - TCP, WebSocket, and HTTP
  - XTLS Vision + Reality
- Trojan
  - TCP, WebSocket, and HTTP
- HTTP and HTTPS
- SOCKS5
- WireGuard
- Hysteria 2
- AnyTLS (Build 945+)
- Custom by JavaScript

Loon also supports custom proxy protocols implemented in JavaScript. See [Custom HTTP Proxy with JavaScript](https://github.com/Loon0x00/LoonExampleConfig/blob/master/Script/http.js).

## Common options

| Option | Description |
|---|---|
| `fast-open` | Enable TCP Fast Open; server support is required |
| `udp` | Allow the node to forward UDP; protocol and server support are required |
| `transport` | Transport type, such as `tcp`, `ws`, or `http` |
| `over-tls` | Enable TLS |
| `sni` | SNI used during the TLS handshake |
| `skip-cert-verify` | Skip certificate verification; not recommended on untrusted networks |

## Node formats

### Shadowsocks

```ini
ss1 = Shadowsocks,example.com,443,aes-128-gcm,"password",fast-open=false,udp=true
ss2 = Shadowsocks,example.com,443,chacha20,"password",fast-open=true,udp=true
ss2022 = Shadowsocks,example.com,443,2022-blake3-aes-128-gcm,"MjdlZmY4YWIyZDU0OGNkNw==:YmY2N2QzZjctMjYxMi00MA==",fast-open=true,udp=true
```

With Shadow TLS:

```ini
ssShadowTLS = Shadowsocks,example.com,443,2022-blake3-aes-128-gcm,"password",shadow-tls-password="shadow-password",shadow-tls-sni=douyin.com,shadow-tls-version=3,udp-port=8396,udp=true
```

With Simple Obfs:

```ini
ssObfsHttp = Shadowsocks,example.com,80,aes-128-gcm,"password",obfs-name=http,obfs-host=www.microsoft.com,obfs-uri=/,fast-open=true,udp=true
ssObfsTLS = Shadowsocks,example.com,443,aes-128-gcm,"password",obfs-name=tls,obfs-host=www.microsoft.com,obfs-uri=/,fast-open=true,udp=true
```

### ShadowsocksR

```ini
ssr1 = ShadowsocksR,example.com,443,aes-256-cfb,"password",protocol=origin,obfs=http_simple,obfs-param=download.windows.com,fast-open=false,udp=true
ssr2 = ShadowsocksR,example.com,10076,chacha20,"password",protocol=auth_aes128_md5,protocol-param=9555:loon,obfs=tls1.2_ticket_auth,obfs-param=download.windows.com,udp=true
```

### HTTP and HTTPS

Without authentication:

```ini
http1 = http,example.com,80
https1 = https,example.com,443
```

With a username and password:

```ini
http2 = http,example.com,80,username,"password"
https2 = https,example.com,443,username,"password",sni=example.com,skip-cert-verify=false
```

A username containing a comma must be enclosed in double quotes:

```ini
https3 = https,example.com,443,"user,name","password"
```

### SOCKS5

```ini
socks1 = socks5,example.com,443,username,"password",sni=example.com,skip-cert-verify=true,udp=true
socks2 = socks5,example.com,8080,"user,name","password"
```

### VMess

TCP:

```ini
vmessTcp = vmess,example.com,10086,aes-128-gcm,"52396e06-041a-4cc2-be5c-8525eb457809",transport=tcp,alterId=0,over-tls=false,udp=true
```

WebSocket:

```ini
vmessWs = vmess,example.com,10086,aes-128-gcm,"52396e06-041a-4cc2-be5c-8525eb457809",transport=ws,alterId=0,path=/,host=www.example.com,over-tls=false,udp=true
```

WebSocket + TLS:

```ini
vmessWss = vmess,example.com,443,aes-128-gcm,"52396e06-041a-4cc2-be5c-8525eb457809",transport=ws,alterId=0,path=/,host=www.example.com,over-tls=true,sni=example.com,skip-cert-verify=false,udp=true
```

HTTP + TLS:

```ini
vmessHttp = vmess,example.com,443,aes-128-gcm,"52396e06-041a-4cc2-be5c-8525eb457809",transport=http,alterId=0,path=/,host=www.example.com,over-tls=true,sni=example.com,udp=true
```

### VLESS

TCP:

```ini
vlessTcp = VLESS,example.com,10086,"52396e06-041a-4cc2-be5c-8525eb457809",transport=tcp,over-tls=false,udp=true
```

WebSocket + TLS:

```ini
vlessWss = VLESS,example.com,443,"52396e06-041a-4cc2-be5c-8525eb457809",transport=ws,path=/,host=www.example.com,over-tls=true,sni=example.com,skip-cert-verify=false,udp=true
```

HTTP + TLS:

```ini
vlessHttp = VLESS,example.com,443,"52396e06-041a-4cc2-be5c-8525eb457809",transport=http,path=/,host=www.example.com,over-tls=true,sni=example.com,udp=true
```

XTLS Vision + Reality:

```ini
vlessReality = VLESS,example.com,443,"ae521383-9375-2e0d-c347-48cf3d98eb6e",transport=tcp,flow=xtls-rprx-vision,public-key="LgJ9bNTyUqBLFkDA12-QgEL7c1yQ1ztk-V1Q-3OLXSk",short-id=164168844958a16d,over-tls=true,sni=douyin.com,udp=true
```

### Trojan

TCP:

```ini
trojanTcp = trojan,example.com,443,"password",alpn=http1.1,sni=example.com,skip-cert-verify=false,udp=true
```

WebSocket:

```ini
trojanWs = trojan,example.com,443,"password",transport=ws,path=/,host=www.example.com,alpn=http1.1,sni=example.com,udp=true
```

HTTP:

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

`script-path` can be a local filename or a remote URL:

```ini
jsHTTP = custom,192.168.1.139,6152,script-path=http.js
```

## Subscription parser

If Loon cannot parse a subscription format directly, configure a resource parser in `[General]`:

```ini
resource-parser = https://github.com/sub-store-org/Sub-Store/releases/latest/download/sub-store-parser.loon.min.js
```

Then enable the parser option when adding the subscription.

## TLS options

| Option | Description |
|---|---|
| `skip-cert-verify` | Whether to skip certificate verification; defaults to `false` |
| `sni` | SNI sent during the TLS handshake; defaults to the server hostname |
| `tls-cert-sha256` | SHA-256 fingerprint of the server certificate |
| `tls-pubkey-sha256` | SHA-256 fingerprint of the server certificate's public key; takes priority when set |
| `tls-profile` | TLS fingerprint, such as `safari` or `chrome`; requires Build 964+ |

When `skip-cert-verify=false`, Loon checks the certificate trust chain, expiration, and hostname. For a self-signed certificate, install and trust the certificate instead of disabling verification.

Generate a certificate fingerprint:

```bash
openssl x509 -noout -fingerprint -sha256 -inform pem -in your-cert.pem
```

Generate a public-key fingerprint:

```bash
openssl x509 -pubkey -noout -in your-cert.pem > server_pubkey.pem
openssl pkey -pubin -in server_pubkey.pem -outform DER | openssl dgst -sha256
```
