---
sidebar_position: 1
---

# 插件

插件是一份可复用的子配置，可以包含规则、Rewrite、脚本、Host 和 MitM 等模块。

## 完整示例

```ini
#!name = 示例插件
#!desc = 展示插件信息和用户参数
#!author = Loon
#!homepage = https://example.com
#!icon = https://example.com/icon.png
#!system = iOS,iPadOS,tvOS,macOS
#!system_version = 15
#!loon_version = 3.5.1(978)
#!tag = 示例,工具
#!type = normal

[Argument]
name = input,"Loon",tag=名称,desc=输入一个名称
region = select,"CN","US","JP",tag=地区
enabled = switch,true,tag=启用

[General]
bypass-tun =
skip-proxy =
real-ip =
dns-server =

[Rule]

[Rewrite]

[Host]

[Script]
http-response ^https?:\/\/example\.com\/conf\/server-mapping script-path=remove_ads.js,requires-body=true,tag=移除广告,argument=[{name},{region},{enabled}]

[Mitm]
hostname = example.com
```

## 插件信息

以 `#!` 开头的字段用于描述插件：

| 字段 | 说明 |
|---|---|
| `#!name` | 插件名称 |
| `#!desc` | 功能说明 |
| `#!author` | 作者 |
| `#!homepage` | 主页地址 |
| `#!icon` | 图标地址 |
| `#!system` | 支持的系统，不区分大小写；未填写表示全部支持 |
| `#!system_version` | 最低系统版本，如 `15.0` |
| `#!loon_version` | 最低 Loon 版本，如 `3.5.1(978)` |
| `#!tag` | 分类标签 |
| `#!type` | 插件类型 |

Loon 3.5.0 (969) 支持以下插件类型：

- `normal`：普通插件。
- `parser`：资源解析器，可在节点、规则和配置订阅页面中选择。

## `[Argument]`

适用于 Build 733 及以上版本。该模块声明需要用户填写或选择的参数，Loon 会自动生成对应界面。

基本格式：

```text
参数名 = 控件类型,默认值或可选值,tag=标题,desc=说明
```

支持的控件：

| 类型 | 说明 |
|---|---|
| `input` | 文本输入；默认值可省略 |
| `select` | 单选列表；第一个值为默认值 |
| `switch` | 开关；默认值为 `false` |

```ini
[Argument]
name = input,"Loon",tag=名称
region = select,"CN","US","JP",tag=地区
enabled = switch,true,tag=启用
```

### 在脚本中使用

通过 `argument` 传入参数：

```ini
http-request ^https:\/\/example\.com script-path=request.js,argument=[{name},{region},{enabled}]
```

脚本中通过 `$argument.name`、`$argument.region` 和 `$argument.enabled` 读取。

参数也可以用于 Cron 表达式：

```ini
cron {cronExpression} script-path=task.js,timeout=300,tag=自动运行
```

如果表达式格式无效，Cron 脚本不会执行。

`switch` 参数可以控制脚本是否启用：

```ini
http-request ^https:\/\/example\.com script-path=request.js,enable={enabled}
```

### 在 Rewrite 中使用

新版 Rewrite 使用 `${参数名}`，具体规则见 [Rewrite 变量](../Rewrite/rewrite_v2.md#插件参数)。

## 插件规则可用策略

插件中的规则只能使用以下策略：

- `DIRECT`
- `REJECT` 系列
- `PROXY`

规则未指定策略时默认使用 `DIRECT`。`PROXY` 表示由用户选择策略组；如果未配置，则按找不到策略组的默认逻辑处理。

## 插件资源

[Loon Gallery](https://github.com/Peng-YM/Loon-Gallery) 收录了社区维护的插件。
