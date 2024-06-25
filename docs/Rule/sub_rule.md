---
sidebar_position: 9
---

# 订阅规则
订阅规则是一系列规则的集合，只要是满足Loon类型的规则都可以放入规则集中。
```
https://raw.githubusercontent.com/Loon0x00/LoonExampleConfig/master/Rule/ExampleRule.list, PROXY
```

## 查询性能
Loon目前可以承载数十万级别数量的规则，无须担心性能和耗时问题。同时也会采用LRU算法缓存近期的结果，命中结果的时间损耗接近为0ms。

下表为iPhone15 Pro Loon 3.2.0 build 712 上的测试情况，在app运行中的查询耗时可能受多线程等因素影响稍微有些波动，具体可以在请求记录的详情页面查看（build 712+）

| 规则类型     | 耗时 | 测试规则数量 |测试订阅规则链接|
| ----------- | ----------- | ----------- | ----------- |
| DOMAIN,DOMAIN-SUFFIX|  1ms内   | 20万 | [去广告(7.7万+)](https://raw.githubusercontent.com/GMOogway/shadowrocket-rules/master/sr_reject_list.module) [去广告(12万+)](https://adrules.top/adrules.list)|
| IP-CIDR   |    1ms内     | 10万 | [ChainIP(10万IPV4，4千IPV6)](https://raw.githubusercontent.com/Loon0x00/LoonLiteRules/main/direct/chinaIPTest.list) |
| IP-CIDR6| 1-2ms  | 4千| [ChainIP(10万IPV4，4千IPV6)](https://raw.githubusercontent.com/Loon0x00/LoonLiteRules/main/direct/chinaIPTest.list)|
|IPANS|1ms内|5千|[中国大陆 ASN](https://raw.githubusercontent.com/VirgilClyne/GetSomeFries/main/ruleset/ASN.China.list)|