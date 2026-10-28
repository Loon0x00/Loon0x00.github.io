---
sidebar_position: 2
---

# DNS Mapping

DNS mappings assign a fixed IP address, alias, DNS server, or IP mode to a domain or SSID.

Supported mappings:

- Map a domain to another domain.
- Map a domain to a fixed IP address.
- Assign a DNS server to a domain.
- Assign a DNS server to a specific SSID.
- Assign an IP mode to a domain.

## Examples

```ini
example.com = 192.168.1.20
example.com = example.com.cn
*.testflight.apple.com = server:8.8.4.4
# system uses the system DNS resolver
*.apple.com = server:system
ssid:LOON's WIFI = server:system
ssid:LOON WIFI = server:https://example.com/dns-query
example.com = ip-mode:v4-only
```

`ip-mode` supports `v4-only`, `dual`, `prefer-v4`, `prefer-v6`, and `v6-only`. See [General Configuration](../General/general.md).
