---
sidebar_position: 1
---

# General Configuration

This page covers common options in the `[General]` section.

## Traffic bypass

### `bypass-tun`

Let specified IP ranges or domains bypass Loon's TUN and be handled directly by the system:

```ini
bypass-tun = 192.168.0.0/16,localhost,*.local
```

### `skip-proxy`

Let specified IP ranges or domains bypass the HTTP proxy:

```ini
skip-proxy = 192.168.0.0/16
```

## DNS

Separate multiple DNS servers with commas.

### `dns-server`

Standard UDP DNS. `system` uses the system DNS resolver:

```ini
dns-server = system,1.1.1.1
```

### `doh-server`

DNS over HTTPS:

```ini
doh-server = https://doh.dns.apple.com/dns-query
```

### `doq-server`

DNS over QUIC. The default port is 784:

```ini
doq-server = quic://example.com,quic://example2.com
```

### `doh3-server`

DNS over HTTP/3:

```ini
doh3-server = h3://223.6.6.6/dns-query
```

### `hijack-dns`

Intercept UDP DNS queries to the specified destinations and return Fake IP addresses. Requires Loon 3.2.5 (789) or later.

```ini
# *:53 means port 53 on every destination
# *:0 means every destination and port
# 8.8.8.8 means every query to this IP
hijack-dns = *:53,8.8.8.8
```

## IP mode

### `ip-mode`

Requires Loon 3.2.3 (754) or later.

| Value | Behavior |
|---|---|
| `ipv4-only` | Use IPv4 only, do not query AAAA records, and reject IPv6 connections |
| `dual` | Query A and AAAA records concurrently and use the first result |
| `ipv4-preferred` | Prefer IPv4 and use IPv6 when no A record exists |
| `ipv6-preferred` | Prefer IPv6 and use IPv4 when no AAAA record exists |

```ini
ip-mode = dual
```

## LAN access

### `allow-wifi-access`

Allow devices on the local network to use Loon's proxy:

```ini
allow-wifi-access = true
```

### `wifi-access-http-port`

HTTP proxy port for LAN access:

```ini
wifi-access-http-port = 8899
```

### `wifi-access-socks5-port`

SOCKS5 proxy port for LAN access:

```ini
wifi-access-socks5-port = 8898
```

## Connectivity tests

### `proxy-test-url`

URL used to test nodes when a policy group does not specify its own:

```ini
proxy-test-url = http://cp.cloudflare.com/generate_204
```

### `internet-test-url`

URL used to test internet connectivity. Use an address that is directly reachable:

```ini
internet-test-url = http://wifi.vivo.com.cn/generate_204
```

### `test-timeout`

Node test timeout in seconds:

```ini
test-timeout = 5
```

## Resource parsing

### `resource-parser`

Specify a script that parses subscription resources:

```ini
resource-parser = https://github.com/sub-store-org/Sub-Store/releases/latest/download/sub-store-parser.loon.min.js
```

## Network switching

### `ssid-trigger`

Switch Loon's mode according to the current Wi-Fi or cellular network:

```ini
ssid-trigger = "loon-wifi5g":DIRECT,"cellular":PROXY,"default":RULE
```

- `cellular`: Cellular network.
- `default`: Any other network.

### `interface-mode`

Choose the network interface used for traffic:

| Value | Behavior |
|---|---|
| `Auto` | Let the system choose automatically |
| `Cellular` | Use cellular when both Wi-Fi and cellular are available |
| `Performace` | Use the currently best-performing interface |
| `Balance` | Balance traffic across available interfaces |

```ini
interface-mode = Performace
```

## Fake IP

### `real-ip`

Return real IP addresses instead of Fake IP addresses for specified domains. This is useful for system services or domains that cache Fake IP addresses:

```ini
real-ip = *.apple.com,*.icloud.com
```

## UDP and STUN

### `disable-udp-ports`

Disable UDP on specified ports:

```ini
disable-udp-ports = 443,80
```

### `disable-stun`

Block STUN over UDP to help reduce WebRTC IP leaks:

```ini
disable-stun = true
```

### `udp-fallback-mode`

Policy used when a node does not support UDP or UDP forwarding is disabled. Supported values are `DIRECT` and `REJECT`. Requires Loon 3.2.0 (702) or later.

```ini
udp-fallback-mode = REJECT
```

## Databases

### `geoip-url`

Set a custom GeoIP database download URL.

### `ipasn-url`

Set a custom ASN database download URL. Requires Loon 3.2.3 (754) or later.

## Domain rejection

### `domain-reject-mode`

Choose when domain reject rules are applied. Requires Loon 3.2.0 (702) or later.

| Value | Behavior |
|---|---|
| `DNS` | Reject during DNS resolution with a loopback IP, no answer, or NXDOMAIN |
| `Request` | Reject while forwarding the request |

```ini
domain-reject-mode = DNS
```

:::note

In HTTP Proxy & TUN mode, Loon can intercept fewer system DNS queries, so some requests may still be rejected during forwarding.

:::

### `dns-reject-mode`

Choose how requests are rejected during DNS resolution:

| Value | Behavior |
|---|---|
| `LOOPBACKIP` | Return a loopback IP address |
| `NOANSWER` | Return an empty DNS response |
| `NXDOMAIN` | Return error code 3 |

```ini
dns-reject-mode = LOOPBACKIP
```

## Deprecated options

The following options are recognized for compatibility with old configurations and should not be used in new ones:

| Option | Description |
|---|---|
| `ipv6` | Replaced by `ip-mode` in Loon 3.2.3 (754) |
| `switch-node-after-failure-times` | Loon now detects node availability automatically |
| `force-http-engine-hosts` | Deprecated in Loon 3.2.3 (787) |
| `skip-first-packet` | Loon detects the relevant services automatically as of Loon 3.5.0 (968) |
