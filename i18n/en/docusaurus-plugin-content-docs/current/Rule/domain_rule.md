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

## `DOMAIN-WILDCARD`

Matches a complete domain using glob wildcards. Matching is case-insensitive and supports three wildcard forms: `*`, `?`, and `[...]`. **Build 1008+**

```ini
DOMAIN-WILDCARD,*.example.com,proxy
DOMAIN-WILDCARD,api?.example.com,proxy
DOMAIN-WILDCARD,node[0-9].example.com,proxy
```

#### `*`

Matches zero or more characters and can match across `.`.

```ini
DOMAIN-WILDCARD,*.example.com,proxy
```

This rule matches `a.example.com` and `a.b.example.com`. Since `.` in the expression remains a literal character, it does not match `example.com`.

#### `?`

Matches exactly one character.

```ini
DOMAIN-WILDCARD,api?.example.com,proxy
```

This rule matches `api1.example.com` and `apia.example.com`, but not `api12.example.com`.

#### `[...]`

Matches a character set or range:

```ini
DOMAIN-WILDCARD,node[abc].example.com,proxy
DOMAIN-WILDCARD,node[0-9].example.com,proxy
DOMAIN-WILDCARD,node[!abc].example.com,proxy
DOMAIN-WILDCARD,node[^abc].example.com,proxy
```

- `[abc]` matches `a`, `b`, or `c`.
- `[0-9]` matches one character from `0` to `9`.
- `[!abc]` and `[^abc]` match one character other than `a`, `b`, or `c`.
