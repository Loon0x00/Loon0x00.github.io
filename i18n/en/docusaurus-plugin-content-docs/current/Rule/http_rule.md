---
sidebar_position: 4
---

# HTTP Rules

HTTP rules only match HTTP and HTTPS requests.

## `URL-REGEX`

Matches a request URL with a regular expression:

```ini
URL-REGEX,^http://google\.com,PROXY
```

## `USER-AGENT`

Matches the User-Agent request header and supports wildcards:

```ini
USER-AGENT,Apple*,DIRECT
```
