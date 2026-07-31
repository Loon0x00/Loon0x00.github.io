---
sidebar_position: 1
---

# URL Scheme

URL schemes open Loon from a browser or another app and perform a specified action.

## Common actions

| Action | URL |
|---|---|
| Turn VPN on | `loon://on` |
| Turn VPN off | `loon://off` |
| Edit the configuration file | `loon://editconfig` |
| Switch to global direct mode | `loon://flowmodel=direct` |
| Switch to rule-based mode | `loon://flowmodel=filter` |
| Switch to global proxy mode | `loon://flowmodel=proxy` |
| Use TUN Only | `loon://proxymode=tun` |
| Use HTTP Proxy & TUN | `loon://proxymode=mix` |
| Update all subscriptions | `loon://update?sub=all` |

## Import resources

URL-encode the resource URL, then replace `encode(url)` in the table below.

| Resource | URL |
|---|---|
| Remote configuration | `loon://import?sub=encode(url)` |
| Node subscription | `loon://import?nodelist=encode(url)` |
| Rule subscription | `loon://import?rules=encode(url)` |
| Plugin | `loon://import?plugin=encode(url)` |
| Icon set | `loon://import?iconset=encode(url)` |
| GeoIP database | `loon://import?geoip=encode(url)` |
| Parser | `loon://import?parser=encode(url)` |

## Universal links

If a web page cannot use a custom scheme directly, replace `loon://` with:

```text
https://www.nsloon.com/openloon/
```

For example:

```text
loon://on
https://www.nsloon.com/openloon/on
```

Both links perform the same action.
