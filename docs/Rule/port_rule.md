---
sidebar_position: 5
---

# 端口规则

端口规则按请求的源端口或目标端口匹配，适用于 Loon 3.1.7 及以上版本。

支持单个端口、闭区间和比较表达式：

```text
443
80-443
>=443
```

## `SRC-PORT`

```ini
SRC-PORT,443,DIRECT
SRC-PORT,80-443,DIRECT
SRC-PORT,>=443,DIRECT
```

## `DEST-PORT`

```ini
DEST-PORT,443,DIRECT
DEST-PORT,80-443,DIRECT
DEST-PORT,>=443,DIRECT
```
