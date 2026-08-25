---
sidebar_position: 1
title: 脚本（Script）
description: Loon 3.5.1 (983) 起支持的 Script 统一配置语法与使用说明
---

# 脚本（Script）

Loon **3.5.1 (983)** 起支持的新版 Script 语法统一了 Request、Response、Cron、Network Changed 和 Generic Script 的配置格式，并为 HTTP Script 增加了多条件匹配。

脚本内可用的 JavaScript 对象和方法没有改变，参见 [Script API](./script_api.md)。

:::info 适用来源

主配置 `[Script]`、`[Remote Script]` 和插件 `[Script]` 使用相同的语法、默认值与校验规则。插件 Script 还可以引用当前插件的 `[Argument]` 参数。

:::

:::tip 可视化工具

可以使用 [Script 配置编辑器](/script-builder) 生成新语法，或使用 [Script 语法转换器](/script-converter) 迁移旧版配置。

:::

## 快速开始

所有类型都使用统一的 `script(...)` Action：

```text
HTTP              <request|response> if <condition> then script(<path> [, <argument>]) [with <options>]
Cron              cron <cron-expression> then script(<path> [, <argument>]) [with <options>]
Network Changed   network-changed then script(<path> [, <argument>]) [with <options>]
Generic           generic then script(<path> [, <argument>]) [with <options>]
```

一个完整的 HTTP 示例：

```ini
request if ${url} ~= /^https:\/\/api\.example\.com/i && ${request.method} == "POST" then script("request.js", "source=profile") with tag="Request Script", timeout=20, requires_body=true
```

每条配置由三部分组成：

| 部分 | 作用 | 示例 |
|---|---|---|
| Trigger / Condition | 决定何时触发或是否命中 | `request if ...`、`cron "..."` |
| Script Action | 指定脚本路径和 `$argument` | `script("request.js", "debug=true")` |
| `with` | 设置该条指令的属性 | `with tag="Request", timeout=20` |

## Script 类型

### Request Script

在请求发出前匹配并执行：

```ini
request if ${url} ~= /\/api\// && ${request.method} == "POST" then script("request.js") with requires_body=true
```

- 省略 `requires_body` 或设为 `false` 时，在 Request Header 阶段执行。
- `requires_body=true` 时，等待完整 Request Body 后执行。
- 同一请求最多选择一条 Request Script，按最终配置顺序使用第一条完整命中的规则。

### Response Script

根据请求和原始响应信息匹配：

```ini
response if ${url} ~= /\/api\// && ${response.status} == 200 && ${response.header['Content-Type']} ~= /application\/json/i then script("response.js") with requires_body=true
```

- 每条 Response Script 必须包含强制 URL Guard，详见 [Response URL Guard](#response-url-guard)。
- 省略 `requires_body` 或设为 `false` 时，在 Response Header 阶段执行。
- `requires_body=true` 时，等待完整 Response Body 后执行。
- 同一响应最多选择一条 Response Script，并保持原配置顺序。

### Cron Script

按 Cron 表达式定时执行：

```ini
cron "0 8 * * *" then script("cron.js") with tag="Daily Task", timeout=300
```

支持五段或六段格式：

```text
* * * * *      分 时 日 月 周
* * * * * *    秒 分 时 日 月 周
```

插件可以使用 String 类型参数提供动态 Cron：

```ini
cron ${cron} then script("cron.js", {${region}}) with enable=${enabled}, tag="Plugin Cron"
```

到期的 Cron Script 继续按照现有调度与并发规则执行，不使用 HTTP Script 的“第一条命中”规则。

### Network Changed Script

在网络变化判定成立时触发：

```ini
network-changed then script("network.js") with tag="Network Changed", timeout=30
```

同一次网络变化事件会执行所有已启用的 Network Changed Script。

### Generic Script

作为可从 App 或现有入口手动执行的脚本：

```ini
generic then script("switch-node.js", "region=CN") with tag="Switch Node", img_url="arrow.triangle.swap.system", timeout=30
```

每条 Generic Script 都是独立操作，不会自动执行。

## `script(...)` Action

### 方法声明

```text
script(String[, String|RawString|PluginObject])
```

第一个参数是脚本路径，第二个参数可选并作为 `$argument` 传入脚本。

```ini
script("request.js")
script("request.js", "hello")
script("request.js", {${region}, ${level}})
```

一条规则只能包含一个 `script(...)`，不支持 Rewrite 的 `|` Action 管道。

### 脚本路径

路径必须是非空的固定字符串，可以是本地文件、相对路径或远程 URL：

```ini
script("local.js")
script("folder/local.js")
script("https://example.com/script.js")
```

路径不能使用变量或模板：

```ini
# 无效
script(${scriptPath})
script("${region}.js")
```

本地与远程识别、下载、缓存和路径查找继续使用现有逻辑。

## `$argument` 参数

第二个参数的写法直接决定脚本中 `$argument` 的类型。

| 配置 | `$argument` 类型 |
|---|---|
| 省略第二个参数 | `null` |
| String 或 Raw String | String |
| 插件对象参数 | Object |

### 无参数

```ini
request if ${url} ~= /api/ then script("request.js")
```

```javascript
console.log($argument); // null
```

### 字符串参数

```ini
generic then script("tool.js", "region=CN&level=2")
```

脚本收到原始 String；Loon 不会自动解析 JSON、查询字符串或其他业务格式：

```javascript
console.log(typeof $argument); // string
```

需要传递包含大量引号或换行的文本时，可以使用 Raw String：

```ini
generic then script("tool.js", `{"region":"CN","level":2}`)
```

```javascript
const params = JSON.parse($argument);
```

### 插件对象参数

插件 Script 可以选择多个 `[Argument]` 参数，并让 `$argument` 成为 Object：

```ini
[Argument]
region = select,"CN","US",tag=地区
level = select,1,2,3,type=number,tag=等级
enabled = switch,true,tag=启用

[Script]
generic then script("plugin.js", {${region}, ${level}, ${enabled}})
```

脚本中得到：

```javascript
$argument = {
  region: "CN",
  level: 2,
  enabled: true
};
```

对象参数不是通用 JavaScript Object 字面量。花括号中只能填写当前插件已声明的 `${name}`：

```ini
# 有效
script("plugin.js", {${region}, ${level}})

# 无效
script("plugin.js", {})
script("plugin.js", {"CN", 2})
script("plugin.js", {${url}})
script("plugin.js", {${region}, ${region}})
```

规则如下：

1. Object 不能为空，同一个变量不能重复。
2. 只能引用当前插件 `[Argument]` 中声明的参数。
3. Object Key 使用参数名，Value 保留插件参数的 String、Number 或 Boolean 类型。
4. 本地 Script 和普通 Remote Script 没有插件参数作用域，不能使用对象参数。
5. 字符串参数与插件对象参数互斥，不支持第三个参数。

## `with` 指令属性

`with` 用于配置 Script 指令本身：

```text
with <name>=<value> [, <name>=<value> ...]
```

```ini
request if ${url} ~= /api/ then script("request.js") with enable=true, tag="API Script", img_url="api.system", timeout=20, debug=true, requires_body=true, binary_body_mode=false
```

### 支持字段

| 字段 | 类型 | 默认值 | 适用范围 |
|---|---|---:|---|
| `enable` | Boolean / 插件 Boolean | `true` | 全部 Script |
| `tag` | String | 从脚本路径派生 | 全部 Script |
| `img_url` | String | 无 | 全部 Script |
| `timeout` | Number | 保持各类型现有默认值 | 全部 Script |
| `debug` | Boolean | `false` | 全部 Script |
| `requires_body` | Boolean | `false` | Request / Response |
| `binary_body_mode` | Boolean | `false` | Request / Response |

`requires_body` 决定是否等待完整 Body；`binary_body_mode` 只决定 Body 使用现有二进制表示方式，不会自动开启 `requires_body`。

Cron、Network Changed 和 Generic 没有 HTTP Body，不能设置 `requires_body` 或 `binary_body_mode`。

### 字段规则

1. 没有字段时省略整个 `with`。
2. 字段名区分大小写，并统一使用小写 snake_case。
3. 字段不能重复，未知字段会导致当前规则无效。
4. `enable`、`debug`、`requires_body` 和 `binary_body_mode` 必须是 Boolean。
5. `timeout` 必须是大于 `0` 的有限 Number。
6. `tag` 和 `img_url` 必须是 String。
7. 插件中的 `enable` 可以引用 Boolean 类型参数，如 `${enabled}`。
8. 除动态 `enable` 外，其他字段不接受变量或字符串模板。

## HTTP 条件表达式

HTTP Script 的条件语法与新版 Rewrite 的条件表达式一致，但不支持命名捕获。

### 比较与逻辑操作符

| 操作符 | 说明 |
|---|---|
| `==` | 类型一致的精确比较 |
| `~=` | 正则查找匹配 |
| `&&` | 并且 |
| `\|\|` | 或者 |
| `()` | 显式分组 |

优先级为：

```text
比较 > && > ||
```

```ini
request if ${request.method} == "POST" && (${request.header['X-Region']} == "CN" || ${request.header['X-Region']} == "HK") then script("request.js")
```

逻辑表达式使用短路求值。建议在同时使用 `&&` 和 `||` 时用括号明确业务意图。

### 可用变量

| 变量 | 类型 | Request | Response |
|---|---|---:|---:|
| `${url}` | String | ✓ | ✓ |
| `${request.method}` | String | ✓ | ✓ |
| `${request.header['name']}` | String 或缺失 | ✓ | ✓ |
| `${response.status}` | Number | — | ✓ |
| `${response.header['name']}` | String 或缺失 | — | ✓ |
| `${插件参数}` | String、Number、Boolean | 插件 | 插件 |

Header 名称查找不区分大小写。Request Script 不能引用尚未生成的 Response 数据。

插件参数必须与比较位置的类型一致。例如，String 类型 URL Pattern 可以用于 `~=`，Boolean 参数可以用于 `enable=${enabled}`。

### 正则

正则使用 `/pattern/flags`：

```ini
request if ${url} ~= /^https:\/\/api\.example\.com/i then script("request.js")
```

支持以下 flags：

```text
i    忽略大小写
m    多行模式
s    点号匹配换行
```

`~=` 是查找匹配。需要匹配完整字符串时，请显式使用 `^` 和 `$`。

### Response URL Guard

每条 Response Script 都必须包含 URL Guard，且这个 Guard 必须是整个条件成立的必要条件。

有效：

```ini
response if ${url} ~= /\/api\// && ${response.status} == 200 then script("success.js")
response if (${url} ~= /\/v1\// || ${url} ~= /\/v2\//) && (${response.status} == 200 || ${response.header['X-Cache']} == "HIT") then script("api.js")
```

无效：

```ini
# 没有 URL Guard
response if ${response.status} == 500 then script("error.js")

# URL 不是必要条件
response if ${url} ~= /\/api\// || ${response.status} == 500 then script("error.js")
```

Loon 在请求阶段先使用 URL Guard 和已知的请求数据筛选候选；Response Header 到达后，再使用原始 Response Status/Header 完整求值。Response Rewrite 对 Status/Header 的修改不会反向改变 Script 条件结果。

### 暂不支持的条件

- Request / Response Body 内容条件。
- 正则 `as` 命名捕获和捕获结果参数。
- `!=`、`!~`、逻辑非、大小比较和集合操作符。

## 匹配与执行规则

### HTTP 第一条命中

第一条命中只适用于 Request / Response Script：

```ini
request if ${url} ~= /api/ && ${request.method} == "POST" then script("post.js")
request if ${url} ~= /api/ then script("fallback.js")
```

- POST `/api` 执行 `post.js`。
- GET `/api` 执行 `fallback.js`。
- Request 和 Response 分别最多选择一条，互不占用对方的命中位置。

Response Script 即使经过请求阶段候选筛选，也始终按照原配置顺序选择第一条最终条件为 `true` 的规则。较早规则需要等待 Response 数据时，不能提前选择它后面已经确定为 `true` 的规则。

### Rewrite 与 Script

Rewrite 与 Script 的执行顺序和现有禁用关系保持不变：

- Request 阶段产生终止响应时，Request / Response Script 均不执行。
- Request Body Rewrite 或 Request Body Mock 命中时，Request Script 不执行。
- Response Body Rewrite 命中时，Response Script 不执行。
- 只修改 Request Header 的 Rewrite 不会因此新增禁用行为。
- Script 条件不能绕过 Rewrite 已经确定的禁用结果。

Request 条件和 Response 候选筛选读取 Request Rewrite 处理后的 URL、Method 和 Header；Response 最终条件读取原始 Response Status/Header。

## 本地、远程与插件

三种来源使用同一个 Parser 和执行模型：

| 能力 | 本地 | 普通 Remote | 插件 |
|---|---:|---:|---:|
| 新语法 | ✓ | ✓ | ✓ |
| 字符串 `$argument` | ✓ | ✓ | ✓ |
| 插件对象 `$argument` | — | — | ✓ |
| 条件引用插件参数 | — | — | ✓ |
| 动态 `enable` | — | — | ✓ |
| 动态 Cron | — | — | ✓ |

当 Remote Script 作为插件内容解析并拥有插件参数作用域时，可以使用插件参数能力。

插件参数在配置加载时完成类型校验和绑定。运行期间使用不可变参数快照，参数改变后通过配置重载发布新快照。

## 新旧语法

旧语法继续作为输入兼容，但新建、编辑并保存的配置统一输出新语法。仅加载旧配置不会自动改写文件。

### HTTP

旧语法：

```ini
http-request ^https?:\/\/api\.example\.com script-path=request.js, requires-body=true, argument="hello", timeout=20, tag=Request
```

新语法：

```ini
request if ${url} ~= /^https?:\/\/api\.example\.com/i then script("request.js", "hello") with tag="Request", timeout=20, requires_body=true
```

### 插件参数

```ini
# 旧语法
http-response ^https?:\/\/api\.example\.com script-path=response.js, argument={region,level}, enabled={enabled}

# 新语法
response if ${url} ~= /^https?:\/\/api\.example\.com/i then script("response.js", {${region}, ${level}}) with enable=${enabled}
```

### Cron

```ini
# 旧语法
cron "0 8 * * *" script-path=cron.js, argument="daily", timeout=300, tag=Daily

# 新语法
cron "0 8 * * *" then script("cron.js", "daily") with tag="Daily", timeout=300
```

### Network Changed 与 Generic

```ini
# 旧语法
network-changed script-path=network.js, argument={region}, tag=Network
generic script-path=tool.js, argument="manual", img-url=tool.system, tag=Tool

# 新语法
network-changed then script("network.js", {${region}}) with tag="Network"
generic then script("tool.js", "manual") with tag="Tool", img_url="tool.system"
```

旧 HTTP URL 正则默认忽略大小写，转换为新语法时会保留 `i` flag。旧 `requires-body`、`binary-body-mode` 和 `img-url` 分别转换为 `requires_body`、`binary_body_mode` 和 `img_url`。

## 完整示例

```ini
[Argument]
enabled = switch,true,tag=启用
region = select,"CN","US","JP",tag=地区
level = select,1,2,3,type=number,tag=等级
cron = input,"0 8 * * *",tag=执行时间

[Script]
request if ${enabled} == true && ${url} ~= /\/order/ && ${request.method} == "POST" then script("order.js", {${region}, ${level}}) with enable=${enabled}, tag="Order", timeout=20, requires_body=true

response if ${url} ~= /\/account/ && ${request.header['Accept']} ~= /application\/json/i && ${response.status} == 200 && ${response.header['Content-Type']} ~= /application\/json/i then script("response.js", {${region}}) with enable=${enabled}, tag="Account Response", timeout=20, requires_body=true, binary_body_mode=true

cron ${cron} then script("cron.js", {${region}, ${level}}) with enable=${enabled}, tag="Scheduled Task", timeout=300

network-changed then script("network.js", {${region}}) with enable=${enabled}, tag="Network Changed", timeout=30

generic then script("tool.js", `{"action":"switch"}`) with enable=${enabled}, tag="Switch Tool", img_url="arrow.triangle.swap.system", timeout=30
```
