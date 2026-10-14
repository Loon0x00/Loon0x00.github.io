---
sidebar_position: 6.5
---

# Process Rules

Process rules select a policy based on the name or path of the executable making the request. **They take effect only on macOS.** iOS and tvOS ignore process rules, including any entire logical rule that contains a process condition.

## Syntax

```ini
PROCESS-NAME,expression,policy
```

The `policy` can be `DIRECT`, `REJECT`, or the name of a node or policy group in the configuration.

The expression's form determines which of three matching modes is used:

| Expression form | Matching mode | Example |
| --- | --- | --- |
| Does not start with `/` | Executable name, with exact and wildcard matching | `curl`, `*Helper*` |
| Starts with `/` and does not end with `/` | Full executable path, with exact and wildcard matching | `/usr/bin/curl`, `/Applications/*.app/Contents/MacOS/*` |
| Starts and ends with `/` | Literal directory prefix | `/Applications/Google Chrome.app/` |

Enclose an expression in double quotes if it contains a comma. All paths below are examples; use the actual executable paths on your system.

## Match by name

Name matching uses the executable name of the process actually making the request and is **case-insensitive**:

```ini
PROCESS-NAME,curl,DIRECT
PROCESS-NAME,Google Chrome,PROXY
PROCESS-NAME,*Helper*,PROXY
PROCESS-NAME,Worker?,DIRECT
```

`curl` matches either `curl` or `Curl`. `*Helper*` matches processes whose names contain `Helper`; `Worker?` matches names such as `Worker1`.

An application's main process and helper processes may have different names. Matching uses the actual executable name, not the application's display name, parent process name, PID, or Bundle Identifier.

## Match by full path

Full path matching is **case-sensitive** and matches the entire executable path:

```ini
PROCESS-NAME,/usr/bin/curl,DIRECT
PROCESS-NAME,/Applications/Google Chrome.app/Contents/MacOS/Google Chrome,PROXY
PROCESS-NAME,/Applications/*.app/Contents/MacOS/*,PROXY
PROCESS-NAME,/*/Worker[0-9],DIRECT
```

An exact path matches only the executable at that path. In wildcard paths, `*` can match across `/`, so it may cover multiple directory levels.

Matching uses the executable path returned by the system directly, without additional symbolic link resolution or Unicode normalization.

## Match by directory prefix

A directory expression must end with `/`. Matching is **case-sensitive** and uses a literal prefix:

```ini
PROCESS-NAME,/Applications/Google Chrome.app/,PROXY
PROCESS-NAME,/opt/homebrew/bin/,DIRECT
```

The first rule matches the main executable and helper executables within that application's directory. The second matches processes whose full executable paths are under `/opt/homebrew/bin/`.

In directory mode, `*`, `?`, and `[]` are treated as ordinary characters, not wildcards. For directory wildcard matching, use a full path pattern that does not end with `/`, for example:

```ini
PROCESS-NAME,/Applications/*.app/*,PROXY
```

## Wildcard matching

Names and full paths use `fnmatch` wildcard semantics to match the entire name or path, rather than regular expressions:

| Pattern | Meaning |
| --- | --- |
| `*` | Matches zero or more characters; can match across `/` in path patterns |
| `?` | Matches one character |
| `[abc]` | Matches one character from the set |
| `[0-9]` | Matches one character from the range |

A backslash `\` is treated as an ordinary character and does not escape wildcards. Name matching remains case-insensitive, while path matching remains case-sensitive.

## Combine with logical rules

Process conditions can be sub-rules of `AND`, `OR`, and `NOT`:

```ini
AND,((PROCESS-NAME,curl),(DOMAIN-SUFFIX,example.com)),DIRECT
OR,((PROCESS-NAME,curl),(PROCESS-NAME,*Helper*)),PROXY
NOT,((PROCESS-NAME,curl)),PROXY
AND,((PROCESS-NAME,/Applications/Google Chrome.app/),(DEST-PORT,443)),PROXY
```

`AND` requires all conditions to match, `OR` requires at least one condition to match, and `NOT` negates its only sub-rule. Nested logical rules are also supported:

```ini
NOT,((AND,((PROCESS-NAME,curl),(DOMAIN-SUFFIX,example.com)))),PROXY
```

If the process name cannot be identified, name conditions do not match. If the path cannot be obtained, path and directory conditions do not match. A `NOT` condition that depends on unknown process information does not become a match through negation. When the name is known but the path is unknown, name rules can still match.

## Match priority

Process rules follow Loon's existing rule evaluation: local rules take priority over plugin rules, and plugin rules take priority over subscription rules. Within the same source, rules are evaluated in their existing configuration order.

Process rules do not receive extra priority for having a more specific expression or a longer directory prefix. Place rules that should run first earlier in the corresponding configuration.
