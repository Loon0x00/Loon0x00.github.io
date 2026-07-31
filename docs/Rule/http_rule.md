---
sidebar_position: 4
---

# HTTP 规则

HTTP 规则仅匹配 HTTP 和 HTTPS 请求。

## `URL-REGEX`

使用正则表达式匹配请求 URL：

```ini
URL-REGEX,^http://google\.com,PROXY
```

## `USER-AGENT`

匹配请求 Header 中的 User-Agent，支持通配符：

```ini
USER-AGENT,Apple*,DIRECT
```
