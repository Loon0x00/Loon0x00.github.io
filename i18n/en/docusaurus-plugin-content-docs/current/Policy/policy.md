---
sidebar_position: 1
---

# Policies

Loon processes traffic in the following order:

```text
Receive request → Match rule → Select policy → Choose node
```

A rule specifies a policy, and the policy determines the final node. A policy can be a node, a built-in policy, or a policy group.

## Node policies

A rule can specify a node directly:

```ini
# The node name is "Hong Kong 01"
DOMAIN,google.com,Hong Kong 01
```

## Built-in policies

### `DIRECT`

Connect to the destination directly without a proxy:

```ini
DOMAIN,apple.com,DIRECT
```

### Reject policies

Reject policies are commonly used to block ads or unwanted requests:

| Policy | Behavior |
|---|---|
| `REJECT` | Returns 404 with an empty response body |
| `REJECT-IMG` | Returns 200 with a 1×1 GIF |
| `REJECT-DICT` | Returns 200 with an empty JSON object |
| `REJECT-ARRAY` | Returns 200 with an empty JSON array |
| `REJECT-DROP` | Drops the request without returning a response |

Some apps retry immediately after a connection failure. Use `REJECT-DROP` with care if this causes a request storm.
