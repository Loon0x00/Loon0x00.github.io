---
sidebar_position: 9
---

# 订阅规则

订阅规则是一组远程规则。规则文件中的每一行都应使用 Loon 支持的规则语法。

```ini
https://raw.githubusercontent.com/Loon0x00/LoonExampleConfig/master/Rule/ExampleRule.list,PROXY
```

## 查询性能

Loon 支持数十万条规则，并使用 LRU 缓存近期结果。缓存命中时，查询耗时接近 0 ms。

以下数据来自 iPhone 15 Pro、Loon 3.2.0 (712)。实际耗时会受设备状态和并发请求影响，可在请求记录详情中查看。

| 规则类型 | 耗时 | 数量 | 测试规则 |
|---|---:|---:|---|
| `DOMAIN`、`DOMAIN-SUFFIX` | 1 ms 内 | 20 万 | [规则 1](https://raw.githubusercontent.com/GMOogway/shadowrocket-rules/master/sr_reject_list.module)、[规则 2](https://adrules.top/adrules.list) |
| `IP-CIDR` | 1 ms 内 | 10 万 | [China IP](https://raw.githubusercontent.com/Loon0x00/LoonLiteRules/main/direct/chinaIPTest.list) |
| `IP-CIDR6` | 1–2 ms | 4 千 | [China IP](https://raw.githubusercontent.com/Loon0x00/LoonLiteRules/main/direct/chinaIPTest.list) |
| `IP-ASN` | 1 ms 内 | 5 千 | [中国大陆 ASN](https://raw.githubusercontent.com/VirgilClyne/GetSomeFries/main/ruleset/ASN.China.list) |

`DOMAIN`、`DOMAIN-SUFFIX`、`IP-CIDR`、`IP-CIDR6`、`GEOIP`、`IP-ASN`、端口和协议规则受数量影响较小。`DOMAIN-KEYWORD`、`USER-AGENT` 和 `URL-REGEX` 会随规则数量和表达式复杂度增加耗时，建议优先使用前一类规则。
