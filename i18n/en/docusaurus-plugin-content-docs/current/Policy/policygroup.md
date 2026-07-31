---
sidebar_position: 2
---

# Policy Groups

A policy group contains nodes or other policy groups and selects one either manually or automatically. Policy groups are declared in `[Proxy Group]` and may be nested.

## `select`

Select a policy manually.

## `url-test`

Tests all nodes periodically and selects the one with the lowest latency.

| Parameter | Description |
|---|---|
| `url` | Test URL; Loon sends a header request |
| `interval` | Test interval in seconds |
| `tolerance` | Do not switch if the latency difference between the current and new best node is below this value, in milliseconds |

## `fallback`

Tests nodes periodically and selects the first available node in the list.

| Parameter | Description |
|---|---|
| `url` | Test URL |
| `interval` | Test interval in seconds |
| `max-timeout` | A node is unavailable if it exceeds this time, in milliseconds |

## `load-balance`

Distributes requests among child policies using the selected algorithm.

| Parameter | Description |
|---|---|
| `url` | Test URL |
| `interval` | Test interval in seconds |
| `max-timeout` | A node is unavailable if it exceeds this time, in milliseconds |
| `algorithm` | Load-balancing algorithm |

Supported algorithms:

- `Random`: Select randomly.
- `PCC`: Keep the same hostname on the same node.
- `Round-Robin`: Select nodes in sequence.
