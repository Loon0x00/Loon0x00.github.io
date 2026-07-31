---
sidebar_position: 9
---

# Rule Subscriptions

A rule subscription is a remote set of rules. Each line in the file must use a rule syntax supported by Loon.

```ini
https://raw.githubusercontent.com/Loon0x00/LoonExampleConfig/master/Rule/ExampleRule.list,PROXY
```

## Performance

Loon supports hundreds of thousands of rules and caches recent results with an LRU cache. A cache hit takes close to 0 ms.

The results below were measured on an iPhone 15 Pro with Loon 3.2.0 (712). Actual times vary with device state and concurrent requests and can be viewed in the request details.

| Rule type | Time | Count | Test rules |
|---|---:|---:|---|
| `DOMAIN`, `DOMAIN-SUFFIX` | Under 1 ms | 200,000 | [Rules 1](https://raw.githubusercontent.com/GMOogway/shadowrocket-rules/master/sr_reject_list.module), [Rules 2](https://adrules.top/adrules.list) |
| `IP-CIDR` | Under 1 ms | 100,000 | [China IP](https://raw.githubusercontent.com/Loon0x00/LoonLiteRules/main/direct/chinaIPTest.list) |
| `IP-CIDR6` | 1–2 ms | 4,000 | [China IP](https://raw.githubusercontent.com/Loon0x00/LoonLiteRules/main/direct/chinaIPTest.list) |
| `IP-ASN` | Under 1 ms | 5,000 | [Mainland China ASN](https://raw.githubusercontent.com/VirgilClyne/GetSomeFries/main/ruleset/ASN.China.list) |

The performance of `DOMAIN`, `DOMAIN-SUFFIX`, `IP-CIDR`, `IP-CIDR6`, `GEOIP`, `IP-ASN`, port rules, and protocol rules changes little with rule count. `DOMAIN-KEYWORD`, `USER-AGENT`, and `URL-REGEX` take longer as the number and complexity of expressions increase, so prefer the first group when possible.
