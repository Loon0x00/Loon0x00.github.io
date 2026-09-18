---
sidebar_position: 2
---

# Subscription Node Configuration

Subscription nodes are delivered by a service provider through a URL. Loon supports standard Loon nodes, common node URIs, fully Base64-encoded content, and subscription files containing `[General]`, `[Host]`, and `[Proxy]` sections.

## Add a Subscription

Subscriptions are defined in the `[Remote Proxy]` section of the main configuration:

```ini
[Remote Proxy]
Provider Subscription = https://example.com/subscription,parser-enabled=true,udp=default,block-quic=default,fast-open=default,vmess-aead=true,skip-cert-verify=default,flexible-sni=false,enabled=true,img-url=https://example.com/icon.png,parser-plugin=subscription-parser,argument="key=value",server-dns="223.5.5.5,https://dns.example.com/dns-query"
```

| Argument | Description |
|---|---|
| `parser-enabled` | Whether to use a resource parser; `parser-enable` is accepted as a compatibility alias |
| `udp` | Override the UDP setting of nodes in the subscription: `true`, `false`, or `default` |
| `block-quic` | Override the QUIC setting of nodes in the subscription: `true`, `false`, or `default` |
| `fast-open` | Override the TCP Fast Open setting of nodes that support it: `true`, `false`, or `default` |
| `vmess-aead` | Whether to require VMess AEAD: `true`, `false`, or `default` |
| `skip-cert-verify` | Override certificate verification for TLS nodes: `true`, `false`, or `default` |
| `flexible-sni` | When a node does not specify an SNI, its server is an IP address, and its transport has a Host configured, whether to use that Host as the SNI |
| `enabled` | Whether to enable this subscription |
| `img-url` | Subscription icon URL |
| `parser-plugin` | Name, tag, or URL of the plugin used to parse the subscription |
| `argument` | Arguments passed to the resource parser; `arguments` is accepted as a compatibility alias |
| `server-dns` | Manually specify the DNS used to resolve server domain names for all nodes in the subscription. Multiple servers must be enclosed in the same pair of double quotes. Requires Loon 3.5.2 (Build 996) or later |

`default` preserves the node's own setting. `server-dns` supports plain DNS (DoU), DoH, DoQ, and DoH3 in the same formats described in [Single-Node Configuration](./node.md#node-dns).

## Subscription Response Content

The server can return any of the following:

- UTF-8 text;
- a Base64 encoding of the entire UTF-8 text;
- standard Loon nodes, one per line;
- `ss://`, `ssr://`, `vmess://`, `vless://`, `trojan://`, `hysteria2://`, `hy2://`, or `anytls://` URIs, one per line;
- a subscription file with sections.

Legacy subscriptions without sections are still supported. New subscriptions should use the section format so that node DNS and Host Maps can be delivered together. Blank lines and comment lines beginning with `#` are ignored.

## Section Format

### `[General]`

`[General]` configures the DNS used to resolve server domain names for nodes in this subscription:

| Argument | Description |
|---|---|
| `dns-server` | Plain DNS (DoU); supports `system`, IPv4, IPv6, and custom ports |
| `doh-server` | DNS over HTTPS (DoH) |
| `doq-server` | DNS over QUIC (DoQ) |
| `doh3-server` | DNS over HTTP/3 (DoH3) |

Each argument can contain multiple servers separated by ASCII commas. Multiple DNS servers at the same priority are queried concurrently, and the first valid result returned is used.

These settings are used only to resolve the server domain names of subscription nodes. They do not replace the global DNS used for ordinary domain requests.

### `[Host]`

`[Host]` supports all the Host Map types available in the main configuration:

| Type | Format |
|---|---|
| Domain to IPv4 or IPv6 | `example.com = 192.0.2.10` |
| Domain alias | `example.com = origin.example.com` |
| Domain-specific DNS | `*.example.com = server:https://dns.example.com/dns-query` |
| SSID-specific DNS | `ssid:Office-WiFi = server:system` |
| Domain-specific IP stack | `example.com = ip-mode:prefer-v4` |
| IP to IP | `198.51.100.10 = 192.0.2.20` |
| Continue using a mapping inside a proxy | `example.com = 192.0.2.10,use-in-proxy=true` |

Domain keys support `*` and `?` wildcards. After a subscription Host Map is loaded, it is merged into the current Host Map and takes priority over the Host Map in the main configuration.

### `[Proxy]`

Place one node on each line in `[Proxy]`. You can use the standard Loon formats from [Single-Node Configuration](./node.md) or a supported node URI.

A node line can use `server-dns` to specify its own DNS. This argument requires Loon 3.5.2 (Build 996) or later. Multiple servers must be enclosed in double quotes:

```ini
Node = Shadowsocks,node.example.com,443,aes-128-gcm,"password",server-dns="223.5.5.5,https://dns.example.com/dns-query"
```

## DNS and Host Map Precedence

When resolving the server domain name of a subscription node, Loon selects its configuration in the following order:

1. A fixed IP, alias, specified DNS, or IP stack setting matched in the subscription file's `[Host]` section;
2. a matching Host Map in the main configuration;
3. `server-dns` manually configured for the subscription in `[Remote Proxy]` in the main configuration;
4. `server-dns` on the node line in the subscription;
5. DNS configured in the subscription file's `[General]` section;
6. the current SSID DNS and global DNS.

After a specified node DNS is selected, a failed query does not fall back to the next configuration layer. CNAME resolution also continues to use the same DNS servers.

## Traffic Usage and Expiration

The server can return a `Subscription-Userinfo` HTTP response header:

```http
Subscription-Userinfo: upload=1073741824; download=2147483648; total=107374182400; expire=1798761600
```

| Field | Description |
|---|---|
| `upload` | Uploaded traffic in bytes |
| `download` | Downloaded traffic in bytes |
| `total` | Total traffic quota in bytes |
| `expire` | Expiration time as a Unix timestamp in seconds |

Loon uses `upload + download` as the consumed traffic. Field names are case-insensitive, and fields are separated by ASCII semicolons. Fields that are not provided are not displayed. Traffic values can use integers or scientific notation.

## Complete Delivery Example

The following example delivers subscription DNS, every Host Map type, and nodes together:

```ini
# Loon subscription

[General]
# Plain DNS (DoU)
dns-server = system,223.5.5.5,[2001:4860:4860::8888]:53
# DNS over HTTPS (DoH)
doh-server = https://dns.alidns.com/dns-query,https://cloudflare-dns.com/dns-query
# DNS over QUIC (DoQ)
doq-server = quic://dns.adguard-dns.com
# DNS over HTTP/3 (DoH3)
doh3-server = h3://dns.example.com/dns-query

[Host]
# Domain to IPv4
hk-node.example.com = 192.0.2.10
# Domain to IPv6
us-node.example.com = 2001:db8::10
# Domain alias
sg-node.example.com = edge-node.example.com
# Assign DNS to a domain or wildcard domain
*.jp-node.example.com = server:https://dns.alidns.com/dns-query
*.eu-node.example.com = server:quic://dns.adguard-dns.com
*.h3-node.example.com = server:h3://dns.example.com/dns-query
# Assign an IP stack to a domain
dual-node.example.com = ip-mode:prefer-v4
# Assign DNS to an SSID
ssid:Office-WiFi = server:system
# IP to IP
198.51.100.10 = 192.0.2.20
# Continue using the mapping inside a proxy
proxy-origin.example.com = 192.0.2.30,use-in-proxy=true

[Proxy]
# Use the subscription's [General] DNS
HK-SS = Shadowsocks,hk-node.example.com,443,aes-128-gcm,"password",udp=true
US-Trojan = Trojan,us-node.example.com,443,"password",transport=tcp,sni=us-node.example.com,udp=true

# Use the alias and domain-specific DNS from the subscription's [Host] section
SG-VMess = VMess,sg-node.example.com,443,auto,"52396e06-041a-4cc2-be5c-8525eb457809",transport=ws,path=/websocket,host=cdn.example.com,over-tls=true,sni=sg-node.example.com,udp=true
JP-Hysteria2 = Hysteria2,tokyo.jp-node.example.com,443,"password",sni=tokyo.jp-node.example.com,udp=true

# Specify multiple DNS servers on a node line
Dual-VLESS = VLESS,dual-node.example.com,443,"ae521383-9375-2e0d-c347-48cf3d98eb6e",transport=tcp,over-tls=true,sni=dual-node.example.com,udp=true,server-dns="223.5.5.5,https://dns.google/dns-query"

# URI nodes can also be placed in [Proxy]
ss://BASE64-OR-SIP002-URI#URI-Node
```

If a subscription format needs conversion, set `resource-parser` in the main configuration's `[General]` section and enable `parser-enabled=true` on the subscription entry in `[Remote Proxy]`.
