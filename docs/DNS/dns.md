---
sidebar_position: 1
---

# DNS

Loon 支持以下 DNS 查询方式：

- 标准 UDP
- DNS over HTTPS（DoH）
- DNS over QUIC（DoQ）
- DNS over HTTP/3（DoH3）

## 配置示例

```ini
[General]
# 普通 DNS；system 表示系统 DNS
dns-server = system,119.29.29.29,223.5.5.5
# 多个服务器使用英文逗号分隔
doh-server = https://example.com/dns-query
# DoQ 默认端口为 784
doq-server = quic://example.com:784
doh3-server = h3://example.com/dns-query
```

## 查询逻辑

普通 DNS 与加密 DNS（DoH、DoQ、DoH3）同时配置时，Loon 优先使用加密 DNS。Loon 会并发查询所有有效服务器，并采用最先返回的结果。

## 缓存

Loon 使用 LRU 内存缓存。查询域名前会先检查缓存：

- 缓存有效时直接使用。
- TTL 过期时重新查询并更新缓存。
- 没有缓存时并发查询已配置的 DNS 服务器。

缓存仅在 Loon 运行期间有效，关闭 Loon 后会清除。

## 查询回落

加密 DNS 查询失败时，Loon 默认回落到普通 DNS。可以在 App 的 DNS 服务器页面关闭此行为。
