---
sidebar_position: 1
---

# Single-Node Configuration

Single nodes are defined in the `[Proxy]` section of the main configuration, one node per line:

```ini
[Proxy]
Node name = protocol,server,port,required protocol arguments,optional arguments
```

Arguments are separated by ASCII commas. Enclose a password, path, or argument value in double quotes if it contains an ASCII comma.

:::note

Loon does not provide proxy nodes. Server addresses, ports, passwords, keys, and other connection details must be provided by your service provider.

:::

## Common Arguments

The following arguments are available to node protocols that support them. Each protocol's full example includes its applicable arguments.

| Argument | Description |
|---|---|
| `server-dns` | DNS servers used to resolve the node server's domain name. Separate multiple servers with ASCII commas and enclose the entire value in double quotes. Requires Loon 3.5.2 (Build 996) or later |
| `ip-mode` | IP stack policy used when resolving the node server's domain name: `v4-only`, `dual`, `prefer-v4`, `prefer-v6`, or `v6-only` |
| `fast-open` | Whether to enable TCP Fast Open |
| `udp` | Whether the node can forward UDP |
| `block-quic` | Whether to block QUIC; set this to `false` when the node needs to forward QUIC |
| `skip-cert-verify` | Whether to skip TLS certificate verification |
| `sni` | Server name used in the TLS handshake |
| `tls-profile` | TLS ClientHello fingerprint: `global`, `default`, `safari-ios18`, `safari-ios-26`, `chrome`, or `chrome147` |
| `tls-cert-sha256` | SHA-256 fingerprint of the server certificate |
| `tls-pubkey-sha256` | SHA-256 fingerprint of the server certificate's public key; takes priority when both fingerprint types are configured |

### Node DNS

`server-dns` requires Loon 3.5.2 (Build 996) or later.

`server-dns` is used only to resolve the node server's domain name. It does not replace the global DNS used for ordinary domain requests. The following server formats are supported:

- Plain DNS (DoU): `system`, `223.5.5.5`, `223.5.5.5:53`, `2001:4860:4860::8888`, or `[2001:4860:4860::8888]:53`
- DNS over HTTPS (DoH): `https://dns.example.com/dns-query`
- DNS over QUIC (DoQ): `quic://dns.example.com`
- DNS over HTTP/3 (DoH3): `h3://dns.example.com/dns-query`

When multiple servers are configured, Loon queries them concurrently and uses the first valid result returned:

```ini
server-dns="223.5.5.5,https://dns.example.com/dns-query,quic://dns.example.com,h3://dns.example.com/dns-query"
```

Double quotes are recommended even when only one server is configured. An unquoted single-server value can still be parsed; Loon adds double quotes when saving the configuration.

The resolution order for a node server domain is: matching Host Map, the node's `server-dns`, SSID DNS, and global DNS. After the node's `server-dns` is selected, a failed query does not fall back to SSID DNS or global DNS. Subsequent CNAME lookups continue to use the same node DNS servers.

## Shadowsocks

Format:

```ini
Node name = Shadowsocks,server,port,encryption method,"password",optional arguments
```

Full argument example (Simple Obfs):

```ini
SS = Shadowsocks,ss.example.com,443,aes-128-gcm,"password",obfs-name=http,obfs-host=www.example.com,obfs-uri=/?ed=2048,fast-open=true,udp=true,udp-over-tcp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,https://dns.example.com/dns-query"
```

ShadowTLS and Simple Obfs are different transport methods. For ShadowTLS, use:

```ini
SS-ShadowTLS = Shadowsocks,ss.example.com,443,2022-blake3-aes-128-gcm,"base64-password",shadow-tls-password="shadow-password",shadow-tls-sni=www.example.com,shadow-tls-version=3,udp-port=8443,fast-open=true,udp=true,udp-over-tcp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,quic://dns.example.com"
```

Protocol arguments:

| Argument | Description |
|---|---|
| `obfs-name` | Simple Obfs type: `none`, `http`, or `tls` |
| `obfs-host` | Host used by Simple Obfs |
| `obfs-uri` | Request path used by Simple Obfs |
| `udp-over-tcp` | Carry UDP over TCP |
| `shadow-tls-password` | ShadowTLS password |
| `shadow-tls-sni` | ShadowTLS SNI |
| `shadow-tls-version` | ShadowTLS version: `2` or `3` |
| `udp-port` | ShadowTLS UDP port |

Supported encryption methods:

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

Format:

```ini
Node name = ShadowsocksR,server,port,encryption method,"password",protocol=protocol,protocol-param=protocol arguments,obfs=obfuscation,obfs-param=obfuscation arguments,optional arguments
```

Full argument example:

```ini
SSR = ShadowsocksR,ssr.example.com,443,aes-256-cfb,"password",protocol=auth_aes128_md5,protocol-param=9555:loon,obfs=tls1.2_ticket_auth,obfs-param=download.example.com,fast-open=true,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,https://dns.example.com/dns-query"
```

The following arguments are also available when using ShadowTLS:

```ini
SSR-ShadowTLS = ShadowsocksR,ssr.example.com,443,aes-256-cfb,"password",protocol=origin,protocol-param=,obfs=plain,obfs-param=,shadow-tls-password=shadow-password,shadow-tls-sni=www.example.com,shadow-tls-version=3,udp-port=8443,fast-open=true,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,quic://dns.example.com"
```

Supported protocols: `origin`, `auth_chain_a`, `auth_chain_b`, `auth_aes128_md5`, `auth_aes128_sha1`, `auth_sha1_v4`, `auth_sha1_v2`, and `auth_sha1`.

Supported obfuscation methods: `plain`, `tls1.2_ticket_auth`, `http_simple`, and `http_post`.

Supported encryption methods: `none`, `rc4`, `rc4-md5-6`, `rc4-md5`, `aes-128-cfb`, `aes-192-cfb`, `aes-256-cfb`, `aes-128-ctr`, `aes-192-ctr`, `aes-256-ctr`, `bf-cfb`, `camellia-128-cfb`, `camellia-192-cfb`, `camellia-256-cfb`, `salsa20`, `chacha20`, and `chacha20-ietf`.

## HTTP and HTTPS

Format:

```ini
Node name = http,server,port,username,"password",optional arguments
Node name = https,server,port,username,"password",optional arguments
```

The username and password can be omitted. A username or password containing an ASCII comma must be enclosed in double quotes.

Full HTTPS argument example:

```ini
HTTPS = https,proxy.example.com,443,"user,name","password",sni=proxy.example.com,skip-cert-verify=false,tls-profile=safari-ios18,tls-cert-sha256=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef,tls-pubkey-sha256=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789,always-use-connect=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,https://dns.example.com/dns-query"
```

HTTP supports ShadowTLS:

```ini
HTTP-ShadowTLS = http,proxy.example.com,80,username,"password",shadow-tls-password=shadow-password,shadow-tls-sni=www.example.com,shadow-tls-version=3,always-use-connect=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,quic://dns.example.com"
```

`always-use-connect=true` makes Loon always forward connections through HTTP CONNECT.

## SOCKS5

Format:

```ini
Node name = socks5,server,port,username,"password",optional arguments
```

The username and password can be omitted. Full TLS argument example:

```ini
SOCKS5-TLS = socks5,socks.example.com,443,"user,name","password",over-tls=true,sni=socks.example.com,skip-cert-verify=false,tls-profile=chrome,tls-cert-sha256=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef,tls-pubkey-sha256=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,https://dns.example.com/dns-query"
```

Do not use ShadowTLS and `over-tls=true` together:

```ini
SOCKS5-ShadowTLS = socks5,socks.example.com,443,username,"password",over-tls=false,shadow-tls-password=shadow-password,shadow-tls-sni=www.example.com,shadow-tls-version=3,udp-port=8443,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,quic://dns.example.com"
```

## VMess

Format:

```ini
Node name = VMess,server,port,encryption method,"UUID",transport=transport type,optional arguments
```

Full WebSocket + TLS argument example:

```ini
VMess = VMess,vmess.example.com,443,aes-128-gcm,"52396e06-041a-4cc2-be5c-8525eb457809",transport=ws,alterId=0,path=/websocket,host=cdn.example.com,over-tls=true,sni=vmess.example.com,skip-cert-verify=false,tls-profile=chrome,tls-cert-sha256=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef,tls-pubkey-sha256=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,https://dns.example.com/dns-query"
```

ShadowTLS example:

```ini
VMess-ShadowTLS = VMess,vmess.example.com,443,auto,"52396e06-041a-4cc2-be5c-8525eb457809",transport=tcp,alterId=0,over-tls=false,shadow-tls-password=shadow-password,shadow-tls-sni=www.example.com,shadow-tls-version=3,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,quic://dns.example.com"
```

With Reality arguments:

```ini
VMess-Reality = VMess,vmess.example.com,443,auto,"52396e06-041a-4cc2-be5c-8525eb457809",transport=tcp,alterId=0,public-key="LgJ9bNTyUqBLFkDA12-QgEL7c1yQ1ztk-V1Q-3OLXSk",short-id=164168844958a16d,over-tls=true,sni=www.example.com,tls-profile=chrome,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,h3://dns.example.com/dns-query"
```

`transport` supports `tcp`, `ws`, and `http`. `host` and `path` apply to WebSocket or HTTP transports. Supported encryption methods are `none`, `auto`, `aes-128-cfb`, `aes-128-gcm`, and `chacha20-ietf-poly1305`.

## VLESS

Format:

```ini
Node name = VLESS,server,port,"UUID",transport=transport type,optional arguments
```

Full WebSocket + TLS argument example:

```ini
VLESS = VLESS,vless.example.com,443,"52396e06-041a-4cc2-be5c-8525eb457809",transport=ws,path=/websocket,host=cdn.example.com,over-tls=true,sni=vless.example.com,skip-cert-verify=false,tls-profile=safari-ios18,tls-cert-sha256=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef,tls-pubkey-sha256=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,https://dns.example.com/dns-query"
```

XTLS Vision + Reality example:

```ini
VLESS-Reality = VLESS,vless.example.com,443,"ae521383-9375-2e0d-c347-48cf3d98eb6e",transport=tcp,flow=xtls-rprx-vision,public-key="LgJ9bNTyUqBLFkDA12-QgEL7c1yQ1ztk-V1Q-3OLXSk",short-id=164168844958a16d,over-tls=true,sni=www.example.com,tls-profile=chrome,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,h3://dns.example.com/dns-query"
```

ShadowTLS example:

```ini
VLESS-ShadowTLS = VLESS,vless.example.com,443,"52396e06-041a-4cc2-be5c-8525eb457809",transport=tcp,over-tls=false,shadow-tls-password=shadow-password,shadow-tls-sni=www.example.com,shadow-tls-version=3,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,quic://dns.example.com"
```

`transport` supports `tcp`, `ws`, and `http`. `flow` currently supports `xtls-rprx-vision`.

## Trojan

Format:

```ini
Node name = Trojan,server,port,"password",transport=transport type,optional arguments
```

Full WebSocket argument example:

```ini
Trojan = Trojan,trojan.example.com,443,"password",transport=ws,path=/websocket,host=cdn.example.com,alpn="h2,http/1.1",sni=trojan.example.com,skip-cert-verify=false,tls-profile=chrome,tls-cert-sha256=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef,tls-pubkey-sha256=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789,fast-open=true,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,https://dns.example.com/dns-query"
```

Reality argument example:

```ini
Trojan-Reality = Trojan,trojan.example.com,443,"password",transport=tcp,public-key="LgJ9bNTyUqBLFkDA12-QgEL7c1yQ1ztk-V1Q-3OLXSk",short-id=164168844958a16d,sni=www.example.com,tls-profile=chrome,alpn=h2,fast-open=true,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,h3://dns.example.com/dns-query"
```

`transport` supports `tcp` and `ws`. For compatibility, `transport=http` is handled as WebSocket. The legacy arguments `ws=true`, `ws-path`, and `ws-headers=Host:domain` correspond to `transport=ws`, `path`, and `host`, respectively.

## WireGuard

A WireGuard node consists of interface arguments and one or more peers:

```ini
WireGuard = WireGuard,interface-ip=192.168.2.2,interface-ipv6=2001:db8:1::2,private-key="qF22B3ezOhWGJA4SHwQSsgMa9d6mPGHyFdZMaDTae2E=",mtu=1280,dns=192.168.2.1,dnsv6=2001:db8:1::1,keepalive=45,peers=[{public-key="JFuTIJEcFnt8R04UnAE5o2WfIPJUsumSxsD2ayXzoWY=",preshared-key="yVNv5K05AwVnWaR4OB8BlMX3jJlkS74aKlYC3PD95IE=",reserved=[1,2,3],allowed-ips="0.0.0.0/0,::/0",endpoint=wg.example.com:51820}],udp=true,server-dns="223.5.5.5,https://dns.example.com/dns-query"
```

| Argument | Description |
|---|---|
| `interface-ip` | WireGuard interface IPv4 address |
| `interface-ipv6` | WireGuard interface IPv6 address |
| `private-key` | Local private key |
| `mtu` | Interface MTU; defaults to `1280` when omitted |
| `dns` | IPv4 DNS used inside the tunnel |
| `dnsv6` | IPv6 DNS used inside the tunnel |
| `keepalive` | Persistent Keepalive interval in seconds; defaults to `45` when omitted |
| `peers` | Peer array; each peer supports `public-key`, `preshared-key`, `reserved`, `allowed-ips`, and `endpoint` |
| `udp` | Whether to enable UDP; defaults to `true` |
| `server-dns` | DNS used to resolve a peer `endpoint` domain name; distinct from the in-tunnel `dns` and `dnsv6`. Requires Loon 3.5.2 (Build 996) or later |

An IPv6 endpoint must use the format `[IPv6 address]:port`.

## Tailscale

A Tailscale node joins your Tailscale network (tailnet) and forwards TCP and UDP through devices in that network. Device addresses and peer connection information are provided by the control server, so you do not need to configure a server address, port, or WireGuard peer manually.

Format:

```ini
Node name = tailscale,optional arguments
```

Browser authorization example:

```ini
Tailscale = tailscale,hostname=loon-iphone
```

When `auth-key` is omitted, the node obtains a browser authorization URL the first time it is used. After enabling the VPN, send a request through this node. iOS or macOS displays an authorization notification; tap it to open the browser and sign in. Make sure notifications are enabled for Loon. While the VPN is connected, you can also use the **Log In** action on the node page. Loon saves the identity after authorization and reuses it for subsequent connections.

Using an Auth Key and specifying an exit node:

```ini
Tailscale-Exit = tailscale,auth-key="tskey-auth-replace-with-your-key",hostname=loon-iphone,exit-node=100.101.102.103
```

Set `exit-node` to `auto` to randomly select from the available exit nodes. When device information is refreshed, Loon keeps the current selection as long as it remains available.

Full argument example:

```ini
Tailscale = tailscale,control-url="https://controlplane.tailscale.com",auth-key="tskey-auth-replace-with-your-key",hostname=loon-iphone,exit-node=auto,accept-routes=true,accept-dns=true,magic-dns=true,path-mode=auto,mtu=1280,idle-session-timeout=300,ip-mode=prefer-v4,server-dns="223.5.5.5,https://dns.example.com/dns-query",udp=true,block-quic=true
```

| Argument | Default | Description |
|---|---|---|
| `auth-key` | Omitted | Auth Key used to register the device. A valid key normally avoids browser sign-in; omit this argument to use browser authorization. Enter the key itself here, not a browser authorization URL |
| `control-url` | `https://controlplane.tailscale.com` | Control server URL. This argument can be omitted; specify the corresponding HTTP or HTTPS URL when using a custom control server |
| `hostname` | Automatically generated | Device name used after this device joins the Tailscale network; this is distinct from the node name in Loon |
| `exit-node` | `none` | Device used as the Internet exit. `none` disables exit-node routing; `auto` selects one automatically. You can also specify a device name, full MagicDNS name, or Tailscale IP address |
| `accept-routes` | `true` | Use subnet routes advertised by devices. This allows access to other devices on their local networks, such as reaching a NAS through a Mac at home |
| `accept-dns` | `true` | Accept DNS servers, split-DNS rules, and search domains provided by Tailscale. When using an exit node, Loon selects DNS according to the provided settings or sends queries through the exit node. When disabled, ordinary public domains use Loon's existing DNS flow, while device MagicDNS names can still be resolved from downloaded device information |
| `magic-dns` | `true` | Automatically add routing rules for full MagicDNS names and device IP addresses from device information. When MagicDNS is enabled for the tailnet, Loon also adds a rule for its domain suffix. Matching requests use this node independently of `accept-dns` |
| `path-mode` | `auto` | `auto` selects the path automatically, attempting a direct P2P connection and using a DERP relay when necessary; `derp` uses DERP relays only |
| `mtu` | `1280` | MTU of the inner IP packet. Values from `576` through `1280` are allowed; values below `1280` require `ip-mode=v4-only` |
| `idle-session-timeout` | `300` | Session idle timeout, in seconds, after all traffic connections have closed. Enter a non-negative integer; `0` disables idle shutdown. The node reconnects the next time it is used, while the saved identity is retained |
| `ip-mode` | Unspecified | Address-family policy: `v4-only`, `dual`, `prefer-v4`, `prefer-v6`, or `v6-only`. This affects the IPv4 or IPv6 addresses used for domain resolution and destination connections |
| `server-dns` | Not set | DNS used to resolve domain names in control-server, relay-server, and similar connection addresses. See [Node DNS](#node-dns) for the format. This does not replace DNS settings provided by Tailscale |
| `udp` | `true` | Whether to forward application UDP traffic. This is not a P2P switch; set `path-mode=derp` to use relays only |
| `block-quic` | `true` | Whether to block QUIC. Set this to `false` and keep `udp=true` when QUIC must be forwarded through the node |

`accept-dns` determines how domain names are resolved, while `magic-dns` determines which node forwards traffic for device names and IP addresses. For example, automatically routing `nas.example.ts.net` through this Tailscale node does not mean that all public-domain DNS queries are sent through the node.

Automatic rules are saved after the device first joins the tailnet and refreshed on subsequent connections. Saved rules can also be loaded after the VPN restarts. Automatic `magic-dns` routing applies in rule mode.

:::note

- `exit-node` identifies the device that receives and forwards traffic; it does not advertise the current Loon device as an exit node. The selected device must have exit-node functionality enabled and be approved for use in the control panel.
- The default, `exit-node=none`, provides access to Tailscale devices and accepted subnets. To reach ordinary Internet addresses through this node, specify an available exit node.
- Loon's rules or global mode still determine whether ordinary requests use this node. `accept-routes=true` only permits the use of subnet routes; it does not automatically add the entire remote LAN to Loon's routing rules.

:::

## Hysteria 2

Format:

```ini
Node name = Hysteria2,server,port,"password",optional arguments
```

Full argument example:

```ini
Hysteria2 = Hysteria2,hy2.example.com,443,"password",sni=hy2.example.com,skip-cert-verify=false,tls-cert-sha256=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef,tls-pubkey-sha256=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789,alpn="h3",salamander-password=obfs-password,server-ports="20000:20100",hop-interval=30,download-bandwidth=100,fast-open=true,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,quic://dns.example.com"
```

`download-bandwidth` is measured in Mbps. `server-ports` configures port hopping, and `hop-interval` is the number of seconds between port changes.

## AnyTLS

Format:

```ini
Node name = AnyTLS,server,port,"password",optional arguments
```

Full argument example:

```ini
AnyTLS = AnyTLS,anytls.example.com,443,"password",sni=anytls.example.com,skip-cert-verify=false,tls-profile=chrome,tls-cert-sha256=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef,tls-pubkey-sha256=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789,public-key="LgJ9bNTyUqBLFkDA12-QgEL7c1yQ1ztk-V1Q-3OLXSk",short-id=164168844958a16d,idle-session-timeout=30,max-stream-count=8,udp=true,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,h3://dns.example.com/dns-query"
```

`idle-session-timeout` is the idle session timeout in seconds. `max-stream-count` is the maximum number of concurrent streams allowed in one session. `public-key` and `short-id` are used for Reality.

## Custom by JavaScript

`script-path` can be a local script filename or a remote URL. Full argument example:

```ini
Custom = Custom,custom.example.com,443,aes-128-gcm,"password",script-path=https://example.com/custom-proxy.js,sni=custom.example.com,skip-cert-verify=false,tls-profile=chrome,tls-cert-sha256=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef,tls-pubkey-sha256=abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789,block-quic=false,ip-mode=prefer-v4,server-dns="223.5.5.5,https://dns.example.com/dns-query"
```

Whether the script protocol uses the encryption method, password, and TLS arguments depends on its implementation. See [Custom HTTP Proxy with JavaScript](https://github.com/Loon0x00/LoonExampleConfig/blob/master/Script/http.js) for an example script.

## TLS Certificate Fingerprints

When `skip-cert-verify=false`, Loon validates the certificate's trust chain, expiration, and hostname. For a self-signed certificate, install and trust the certificate or configure a certificate fingerprint.

Generate a certificate fingerprint:

```bash
openssl x509 -noout -fingerprint -sha256 -inform pem -in your-cert.pem
```

Generate a public-key fingerprint:

```bash
openssl x509 -pubkey -noout -in your-cert.pem > server_pubkey.pem
openssl pkey -pubin -in server_pubkey.pem -outform DER | openssl dgst -sha256
```
