---
sidebar_position: 7
---

# 逻辑规则

逻辑规则使用与、或、非组合多个子规则，适用于 Loon 3.1.7 及以上版本。

:::tip

同时包含域名和 IP 子规则时，建议把 IP 规则放在后面，减少不必要的 DNS 查询。

:::

## `AND`

所有子规则都满足时匹配：

```ini
AND,((DOMAIN-SUFFIX,example.com),(DEST-PORT,443),(GEOIP,CN)),DIRECT
```

## `OR`

任一子规则满足时匹配：

```ini
OR,((DOMAIN-SUFFIX,example.com),(DEST-PORT,443),(GEOIP,CN,no-resolve)),DIRECT
```

## `NOT`

子规则不满足时匹配。`NOT` 只能包含一个子规则：

```ini
NOT,((AND,((DOMAIN-SUFFIX,example.com),(DEST-PORT,443),(GEOIP,CN)))),DIRECT
```
