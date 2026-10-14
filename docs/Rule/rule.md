---
sidebar_position: 1
---

# 规则

规则用于判断请求应使用哪个策略，策略再决定最终节点。

## 匹配优先级

Loon 3.0.3 及以上版本使用以下匹配顺序：

1. 目标地址为域名时，先匹配域名规则。
2. 域名规则未命中时，再解析 DNS 并匹配 IP 规则。
3. 其他规则按配置顺序匹配，越靠前优先级越高。
4. 规则来源优先级为：**本地规则 > 插件规则 > 订阅规则**。
5. 所有规则均未命中时，使用 `FINAL` 指定的策略。

## 查询性能

Loon 支持百万级规则，并使用 LRU 缓存近期结果。缓存命中时，查询耗时接近 0 ms。

表中 `DOMAIN`、`DOMAIN-SUFFIX` 和 IP 规则的数据来自 iPhone 15 Pro、Loon 3.2.0 (712)。`DOMAIN-WILDCARD` 数据来自 iPhone Air、iOS 27.0.1、Loon 3.5.3 (1008) 的真机测试。实际耗时会受设备状态和并发请求影响，可在请求记录详情中查看。

| 规则类型 | 耗时 | 数量 | 测试规则 |
|---|---:|---:|---|
| `DOMAIN`、`DOMAIN-SUFFIX` | 1 ms 内 | 20 万 | [规则 1](https://raw.githubusercontent.com/GMOogway/shadowrocket-rules/master/sr_reject_list.module)、[规则 2](https://adrules.top/adrules.list) |
| `DOMAIN-WILDCARD`（build 1008+） | 平均 0.031 ms；P95 0.061 ms；P99 0.110 ms | 5 万 | `*`、`?`、`[...]` 混合规则 |
| `IP-CIDR` | 1 ms 内 | 10 万 | [China IP](https://raw.githubusercontent.com/Loon0x00/LoonLiteRules/main/direct/chinaIPTest.list) |
| `IP-CIDR6` | 1–2 ms | 4 千 | [China IP](https://raw.githubusercontent.com/Loon0x00/LoonLiteRules/main/direct/chinaIPTest.list) |
| `IP-ASN` | 1 ms 内 | 5 千 | [中国大陆 ASN](https://raw.githubusercontent.com/VirgilClyne/GetSomeFries/main/ruleset/ASN.China.list) |

`DOMAIN-WILDCARD` 真机测试共包含 5 万条规则和 543 次查询，平均耗时为 0.031 ms，P95 为 0.061 ms，P99 为 0.110 ms，最大耗时为 0.860 ms。每次查询平均执行 2.41 次完整通配符比较，P99 为 9 次，最大为 58 次。

`DOMAIN`、`DOMAIN-SUFFIX`、`IP-CIDR`、`IP-CIDR6`、`GEOIP`、`IP-ASN`、端口和协议规则受数量影响较小。`DOMAIN-WILDCARD` 的查询耗时会受表达式复杂度和一次查询需要比较的规则数量影响。`DOMAIN-KEYWORD`、`USER-AGENT` 和 `URL-REGEX` 会随规则数量和表达式复杂度增加耗时，建议优先使用前一类规则。
