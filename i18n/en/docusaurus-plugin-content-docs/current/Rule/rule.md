---
sidebar_position: 1
---

# Rules

Rules determine which policy a request uses. The selected policy then determines the final node.

## Match priority

Loon 3.0.3 and later use the following order:

1. If the destination is a domain, match domain rules first.
2. If no domain rule matches, resolve DNS and match IP rules.
3. Match other rules in configuration order; earlier rules have higher priority.
4. Rule source priority is **local rules > plugin rules > subscription rules**.
5. If no rule matches, use the policy specified by `FINAL`.
