---
sidebar_position: 2
---

# 域名规则

## `DOMAIN`

精确匹配完整域名：

```ini
DOMAIN,google.com,proxy
```

## `DOMAIN-SUFFIX`

匹配域名后缀。`apple.com` 可以匹配 `icloud.apple.com` 和 `www.apple.com`，但不能匹配 `app-apple.com`。

```ini
DOMAIN-SUFFIX,apple.com,proxy
```

## `DOMAIN-KEYWORD`

匹配域名中包含的关键词：

```ini
DOMAIN-KEYWORD,apple,proxy
```
