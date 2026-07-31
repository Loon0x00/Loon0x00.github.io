---
sidebar_position: 3
---

# IP 规则

## IPv4

```ini
IP-CIDR,118.89.204.198/32,no-resolve
```

## IPv6

```ini
IP-CIDR6,2402:4e00:1200:ed00:0:9089:6dac:96b6/128
```

## `GEOIP`

根据 MMDB 中的国家或地区信息匹配 IP：

```ini
geoip,cn,DIRECT
```

## `IP-ASN`

根据 IP 所属 ASN 匹配：

```ini
IP-ASN,4134,DIRECT,no-resolve
```

### `no-resolve`

添加 `no-resolve` 后，规则只匹配目标地址已经是 IP 的请求，不会为域名执行 DNS 查询。纯 IP 规则建议添加此参数，以减少不必要的 DNS 请求。
