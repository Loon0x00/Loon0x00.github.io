---
sidebar_position: 2
---

# Domain Rules

## `DOMAIN`

Matches a complete domain exactly:

```ini
DOMAIN,google.com,proxy
```

## `DOMAIN-SUFFIX`

Matches a domain suffix. `apple.com` matches `icloud.apple.com` and `www.apple.com`, but not `app-apple.com`.

```ini
DOMAIN-SUFFIX,apple.com,proxy
```

## `DOMAIN-KEYWORD`

Matches a keyword contained in a domain:

```ini
DOMAIN-KEYWORD,apple,proxy
```
