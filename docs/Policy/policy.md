---
sidebar_position: 1
---

# 策略

Loon 按以下流程处理流量：

```text
收到请求 → 匹配规则 → 选择策略 → 确定节点
```

规则指定策略，策略决定最终使用的节点。策略可以是节点、内置策略或策略组。

## 节点类型策略

规则可以直接指定节点：

```ini
# 节点名称为“香港 01”
DOMAIN,google.com,香港01
```

## 内置策略

### `DIRECT`

不经过代理，直接连接目标地址：

```ini
DOMAIN,apple.com,DIRECT
```

### 拒绝策略

拒绝策略通常用于拦截广告或无效请求：

| 策略 | 行为 |
|---|---|
| `REJECT` | 返回 404 和空响应体 |
| `REJECT-IMG` | 返回 200 和 1×1 GIF |
| `REJECT-DICT` | 返回 200 和空 JSON 对象 |
| `REJECT-ARRAY` | 返回 200 和空 JSON 数组 |
| `REJECT-DROP` | 直接丢弃请求，不返回响应 |

部分应用会在连接失败后立即重试。遇到请求风暴时，请谨慎使用 `REJECT-DROP`。
