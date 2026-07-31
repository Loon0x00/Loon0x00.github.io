---
sidebar_position: 2
---

# DNS映射

DNS 映射用于为指定域名或 SSID 设置固定 IP、别名或 DNS 服务器。

支持以下方式：

- 域名映射到另一个域名。
- 域名映射到固定 IP。
- 为域名指定 DNS 服务器。
- 为特定 SSID 指定 DNS 服务器。
- 为域名指定 IP 模式。

## 配置示例

```ini
example.com = 192.168.1.20
example.com = example.com.cn
*.testflight.apple.com = server:8.8.4.4
# system 表示系统 DNS
*.apple.com = server:system
ssid:LOON's WIFI = server:system
ssid:LOON WIFI = server:https://example.com/dns-query
example.com = ip-mode:ipv4-only
```

`ip-mode` 支持 `ipv4-only`、`dual`、`ipv4-preferred` 和 `ipv6-preferred`，详见 [通用配置](../General/general.md)。
