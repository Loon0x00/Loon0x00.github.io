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

## `DOMAIN-WILDCARD`

使用 Glob 通配符匹配完整域名。匹配不区分大小写，支持 `*`、`?` 和 `[...]` 三种通配符。**build 1008+**

```ini
DOMAIN-WILDCARD,*.example.com,proxy
DOMAIN-WILDCARD,api?.example.com,proxy
DOMAIN-WILDCARD,node[0-9].example.com,proxy
```

#### `*`

匹配零个或多个字符，并且可以跨越 `.`。

```ini
DOMAIN-WILDCARD,*.example.com,proxy
```

这条规则可以匹配 `a.example.com` 和 `a.b.example.com`。由于表达式中的 `.` 仍是普通字符，因此不能匹配 `example.com`。

#### `?`

匹配恰好一个字符。

```ini
DOMAIN-WILDCARD,api?.example.com,proxy
```

这条规则可以匹配 `api1.example.com` 和 `apia.example.com`，但不能匹配 `api12.example.com`。

#### `[...]`

匹配字符集合或字符范围：

```ini
DOMAIN-WILDCARD,node[abc].example.com,proxy
DOMAIN-WILDCARD,node[0-9].example.com,proxy
DOMAIN-WILDCARD,node[!abc].example.com,proxy
DOMAIN-WILDCARD,node[^abc].example.com,proxy
```

- `[abc]` 匹配 `a`、`b` 或 `c`。
- `[0-9]` 匹配 `0` 到 `9` 中的一个字符。
- `[!abc]` 和 `[^abc]` 匹配除 `a`、`b`、`c` 之外的一个字符。
