---
sidebar_position: 7
---

# Logical Rules

Logical rules combine child rules with AND, OR, and NOT, and require Loon 3.1.7 or later.

:::tip

When domain and IP child rules are used together, place IP rules later to reduce unnecessary DNS lookups.

:::

## `AND`

Matches when every child rule matches:

```ini
AND,((DOMAIN-SUFFIX,example.com),(DEST-PORT,443),(GEOIP,CN)),DIRECT
```

## `OR`

Matches when any child rule matches:

```ini
OR,((DOMAIN-SUFFIX,example.com),(DEST-PORT,443),(GEOIP,CN,no-resolve)),DIRECT
```

## `NOT`

Matches when its child rule does not match. `NOT` accepts only one child rule:

```ini
NOT,((AND,((DOMAIN-SUFFIX,example.com),(DEST-PORT,443),(GEOIP,CN)))),DIRECT
```
