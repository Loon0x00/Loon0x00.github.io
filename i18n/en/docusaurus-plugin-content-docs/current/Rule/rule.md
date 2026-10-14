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

## Performance

Loon supports millions of rules and caches recent results with an LRU cache. A cache hit takes close to 0 ms.

The `DOMAIN`, `DOMAIN-SUFFIX`, and IP rule results in the table were measured on an iPhone 15 Pro with Loon 3.2.0 (712). The `DOMAIN-WILDCARD` results were measured on a physical iPhone Air running iOS 27.0.1 and Loon 3.5.3 (1008). Actual times vary with device state and concurrent requests and can be viewed in the request details.

| Rule type | Time | Count | Test rules |
|---|---:|---:|---|
| `DOMAIN`, `DOMAIN-SUFFIX` | Under 1 ms | 200,000 | [Rules 1](https://raw.githubusercontent.com/GMOogway/shadowrocket-rules/master/sr_reject_list.module), [Rules 2](https://adrules.top/adrules.list) |
| `DOMAIN-WILDCARD` (Build 1008+) | Average 0.031 ms; P95 0.061 ms; P99 0.110 ms | 50,000 | Mixed rules using `*`, `?`, and `[...]` |
| `IP-CIDR` | Under 1 ms | 100,000 | [China IP](https://raw.githubusercontent.com/Loon0x00/LoonLiteRules/main/direct/chinaIPTest.list) |
| `IP-CIDR6` | 1–2 ms | 4,000 | [China IP](https://raw.githubusercontent.com/Loon0x00/LoonLiteRules/main/direct/chinaIPTest.list) |
| `IP-ASN` | Under 1 ms | 5,000 | [Mainland China ASN](https://raw.githubusercontent.com/VirgilClyne/GetSomeFries/main/ruleset/ASN.China.list) |

The `DOMAIN-WILDCARD` test on a physical device used 50,000 rules and 543 queries. Average query time was 0.031 ms, P95 was 0.061 ms, P99 was 0.110 ms, and the maximum was 0.860 ms. Each query performed an average of 2.41 full wildcard comparisons, with a P99 of 9 and a maximum of 58.

The performance of `DOMAIN`, `DOMAIN-SUFFIX`, `IP-CIDR`, `IP-CIDR6`, `GEOIP`, `IP-ASN`, port rules, and protocol rules changes little with rule count. Query times for `DOMAIN-WILDCARD` depend on expression complexity and the number of rules that must be compared for each query. `DOMAIN-KEYWORD`, `USER-AGENT`, and `URL-REGEX` take longer as the number and complexity of expressions increase, so prefer the first group when possible.
