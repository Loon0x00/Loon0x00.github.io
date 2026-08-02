---
sidebar_position: 1
title: 复写（Rewrite）
description: Loon 3.5.1 (978) 起支持的 Rewrite 配置语法
---

# 复写（Rewrite）

Rewrite 用于按条件修改 HTTP 请求或响应，也可以替换 URL、返回重定向、拒绝请求或生成 Mock 数据。

本文介绍 Loon **3.5.1 (978)** 起支持的新语法。

:::info 生效范围

Rewrite 仅对 HTTP 和经过 MitM 解密的 HTTPS 请求生效，并在规则匹配前执行。

:::

:::tip 可视化生成

可以使用 [Rewrite 配置生成器](/rewrite-builder) 组合条件和 Action，并直接复制生成结果。

:::

## 快速开始

每条 Rewrite 使用一行配置，基本格式为：

```text
<phase> if <condition> then <action> [| <action> ...]
```

为请求设置 Header：

```ini
request if ${url} ~= /^https:\/\/api\.example\.com/ then request.header.set("X-Loon", "true")
```

修改 JSON 响应：

```ini
response if ${url} ~= /^https:\/\/api\.example\.com\/profile$/ && ${response.status} == 200 then response.json.replace("data.vip", true)
```

多个 Action 使用 `|` 连接，并按照从左到右的顺序执行：

```ini
request if ${url} ~= /^https:\/\/api\.example\.com/ then request.header.set("X-Loon", "true") | request.header.del("Cookie")
```

## 执行阶段

| 阶段 | 执行时机 | 可用数据 |
|---|---|---|
| `request` | 请求发出前 | URL、请求方法、请求 Header |
| `response` | 收到响应 Header 后 | 请求数据、响应状态码、响应 Header |

请求和响应 Action 通常需要分开配置：

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.header.set("X-Test", "request")
response if ${url} ~= /^https:\/\/example\.com/ then response.header.set("X-Test", "response")
```

一条普通 Rewrite 不能同时包含请求 Action 和响应 Action。

`response.body.mock(...)` 是特殊情况：配置阶段仍写作 `response`，但 Loon 会在请求发往上游前提前生成响应。具体限制参见 [Mock 响应 Body](#mock-响应-body)。

## 条件表达式

### 比较操作符

| 操作符 | 说明 |
|---|---|
| `==` | 精确比较完整值 |
| `~=` | 使用正则查找匹配 |

精确匹配请求方法：

```ini
request if ${request.method} == "POST" then request.header.set("X-Method", "POST")
```

匹配响应 Header：

```ini
response if ${response.header['Content-Type']} ~= /^application\/json(?:;|$)/i then response.header.set("X-JSON", "true")
```

`~=` 默认查找能够匹配的部分。需要匹配完整值时，请在正则中显式使用 `^` 和 `$`。

### 逻辑操作符

| 操作符 | 说明 |
|---|---|
| `&&` | 并且 |
| `\|\|` | 或者 |
| `()` | 调整或保留条件分组 |

```ini
request if ${request.method} == "POST" && (${request.header['X-Region']} == "CN" || ${request.header['X-Region']} == "HK") then request.header.set("X-Matched", "true")
```

优先级为：

```text
比较操作符 > && > ||
```

同时使用 `&&` 和 `||` 时，建议使用括号明确分组。包含两个及以上直接条件的显式分组会保留，只有一个条件的冗余括号会自动省略。

## 变量

Rewrite 中的通用动态值统一使用 `${...}`：

| 来源 | 示例 |
|---|---|
| Loon 内置变量 | `${url}` |
| 插件参数 | `${region}` |
| 条件正则捕获 | `${item.1}` |

### 内置变量

| 变量 | 类型 | `request` | `response` |
|---|---|---:|---:|
| `${url}` | String | ✓ | ✓ |
| `${request.method}` | String | ✓ | ✓ |
| `${request.header['name']}` | String 或 null | ✓ | ✓ |
| `${response.status}` | Number | — | ✓ |
| `${response.header['name']}` | String 或 null | — | ✓ |

Header 名称查找不区分大小写：

```text
${request.header['content-type']}
${request.header['Content-Type']}
```

以上表达式引用同一个 Header。`request` 阶段不能引用尚未生成的响应变量。

当前版本不支持在 `if` 条件中读取请求或响应 Body，例如 `${request.body}`、`${response.body}` 或 JSON Key Path。

### 插件参数

插件参数继续在 `[Argument]` 中声明：

```ini
[Argument]
enabled = switch,true,tag=启用
price = input,9.99,type=number,tag=价格
region = select,"CN","US","JP",tag=地区
level = select,1,2,3,type=number,tag=等级
```

在 Rewrite 中直接引用参数名：

```ini
[Rewrite]
response if ${enabled} == true && ${level} == 2 && ${request.header['X-Region']} == ${region} then response.json.replace("data.price", ${price})
```

| 控件 | 支持类型 | 默认类型 |
|---|---|---|
| `input` | String、Number | String |
| `select` | String、Number | String |
| `switch` | Boolean | Boolean |

`input` 和 `select` 需要返回数字时，使用 `type=number`：

```ini
price = input,9.99,type=number
level = select,1,2,3,type=number
```

未声明 `type` 的旧插件保持原有行为：`input`、`select` 按 String 解析，`switch` 按 Boolean 解析。参数只作为有类型的数据使用，不会被重新解析为条件或 Action，也不会进行二次变量展开。

本地 Rewrite 没有 `[Argument]` 参数来源，因此本地编辑页面只能使用内置变量和当前 Rewrite 的正则捕获变量。

### 条件正则捕获

在正则条件后使用 `as <name>` 保存匹配结果：

```ini
request if ${url} ~= /^https:\/\/api\.shop\.com\/item\/(\d+)/ as item then request.header.set("X-Item-ID", "${item.1}")
```

| 变量 | 内容 |
|---|---|
| `${item.0}` | 完整匹配内容 |
| `${item.1}` | 第一个捕获组 |
| `${item.2}` | 第二个捕获组 |

使用限制：

1. `as` 只能用于 `~=` 正则条件。
2. 捕获名称在同一条 Rewrite 中必须唯一。
3. 捕获名称不能与插件参数重名。
4. 捕获下标不能超过正则中的捕获组数量。
5. 被 Action 引用的捕获条件必须经过表达式的所有成功路径，不能位于 `||` 的可选分支中。

有效：

```ini
request if (${request.method} == "GET" || ${request.method} == "POST") && ${url} ~= /item\/(\d+)/ as item then request.header.set("X-Item", "${item.1}")
```

无效：

```ini
request if ${url} ~= /item\/(\d+)/ as item || ${request.header['X-Debug']} == "true" then request.header.set("X-Item", "${item.1}")
```

如果正则整体匹配成功，但被引用的可选捕获组没有值，当前 Action 会运行失败并跳过，后续 Action 继续执行。

### 条件捕获与 Action 捕获

条件正则和 Action 自带正则使用两套捕获语法：

| 来源 | 声明方式 | 引用方式 | 使用范围 |
|---|---|---|---|
| `if` 条件正则 | `~= /.../ as item` | `${item.0}`、`${item.1}` | 当前 Rewrite 的 Action |
| Header/Body Replace 正则 | Action 的 Regex 参数 | `$0`、`$1` | 当前 Action 的替换参数 |

例如：

```ini
request if ${url} ~= /^https:\/\/old\.example\.com(\/.*)$/ as item then url.replace("https://new.example.com${item.1}")
```

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.body.replace(/price=(\d+)/, "amount=$1")
```

第一条中的 `${item.1}` 来自 `if` 条件；第二条中的 `$1` 来自 `request.body.replace` 自带的正则。`$n` 不是通用变量，不能跨 Action 使用，`url.replace("$1")` 也是无效配置。

## 值与字符串

### 字面量

| 类型 | 示例 |
|---|---|
| String | `"hello world"` |
| Number | `200`、`9.99` |
| Boolean | `true`、`false` |
| Null | `null` |
| Regex | `/^https:\/\/example\.com/i` |

固定字符串必须使用双引号。以下两个值的类型不同：

```text
9.99      # Number
"9.99"    # String
```

### 正则

正则格式：

```text
/pattern/flags
```

支持的 Flag：

| Flag | 说明 |
|---|---|
| `i` | 忽略大小写 |
| `m` | 多行模式 |
| `s` | `.` 匹配换行 |

正则字面量中不会展开 `${...}`。需要由插件参数提供完整正则时，将变量直接放在 `~=` 右侧：

```ini
request if ${url} ~= ${urlPattern} then request.header.set("X-Matched", "true")
```

### 双引号字符串

双引号字符串支持 `${...}` 变量模板：

```ini
request.header.set("X-Info", "price=${price}, region=${region}")
```

支持以下转义：

| 写法 | 结果 |
|---|---|
| `\"` | 双引号 |
| `\\` | 反斜杠 |
| `\n` | 换行 |
| `\r` | 回车 |
| `\t` | Tab |
| `\${` | 字面量 `${` |

Header 名称在变量表达式中使用单引号：

```ini
request.header.set("X-Origin", "UA=${request.header['User-Agent']}")
```

### 原始字符串

固定 JSON、HTML 或其他包含大量引号的内容可以使用反引号：

```ini
response if ${url} ~= /^https:\/\/api\.example\.com/ then response.body.mock("json", `{"code":0,"message":"ok"}`, 200)
```

原始字符串具有以下特点：

- 不处理反斜杠转义。
- 不展开 `${...}`。
- 逗号、等号、括号和双引号均为普通内容。
- 两个连续反引号表示一个字面量反引号。

需要变量时，请使用普通双引号字符串：

```ini
response if ${url} ~= /^https:\/\/api\.example\.com\/item\/(\d+)/ as item then response.body.mock("json", "{\"item\":\"${item.1}\"}", 200)
```

新版语法不会按空格拆分整行，因此不再需要使用 `\x20` 表示空格。

## Action

所有 Action 统一使用位置参数：

```text
action(value, value)
```

参数必须按照方法声明中的顺序填写，不允许填写参数名称：

```text
# 有效
redirect(302, "https://example.com")

# 无效
redirect(status=302, location="https://example.com")
```

可选参数只能从最右侧开始省略。以下方法声明中的 `[...]` 表示尾部可选参数，不是配置中需要填写的字符。

### Action 方法速查

```text
url.replace(String)
redirect(Number, String)
reject(Number[, String])
reject_img(Number)
reject_dict(Number)
reject_array(Number)
reject_video(Number)

request.header.add(String, String)
request.header.set(String, String)
request.header.del(String)
request.header.replace(String, Regex, RegexReplacement)

response.header.add(String, String)
response.header.set(String, String)
response.header.del(String)
response.header.replace(String, Regex, RegexReplacement)

request.body.replace(Regex, RegexReplacement)
response.body.replace(Regex, RegexReplacement)

request.json.add(String, Any)
request.json.delete(String)
request.json.replace(String, Any)
request.json.jq(String)
request.json.jq_file(String)

response.json.add(String, Any)
response.json.delete(String)
response.json.replace(String, Any)
response.json.jq(String)
response.json.jq_file(String)

request.body.mock(String, String[, Boolean])
request.body.mock_file(String, String[, Boolean])

response.body.mock(String, String[, Number[, Boolean]])
response.body.mock_file(String, String[, Number[, Boolean]])
```

`RegexReplacement` 在配置中仍使用字符串形式，其中的 `$0` 至 `$n` 引用同一个 Action 的正则匹配结果。

### URL 修改

#### `url.replace`

`url.replace` 使用 `if` 中唯一的必选 URL 正则作为替换范围，Action 中不再重复填写正则：

```ini
request if ${url} ~= /^https:\/\/old\.example\.com(\/.*)$/ as urlMatch then url.replace("https://new.example.com${urlMatch.1}")
```

只替换正则实际命中的范围，未命中的 URL 内容会保留。

使用限制：

1. `if` 中必须有且只有一个所有成功路径都会经过的 `${url} ~= /.../` 条件。
2. 该 URL 正则不能位于 `||` 的可选分支中。
3. 需要捕获内容时，使用 `as` 和 `${名称.n}`。
4. `url.replace` 的参数中不能使用 `$n`。

#### `redirect`

```ini
request if ${url} ~= /^http:\/\/example\.com/ then redirect(302, "https://api.example.com")
```

参数：

| 位置 | 类型 | 说明 |
|---:|---|---|
| 1 | Number | 状态码，当前支持 `302`、`307` |
| 2 | String | URL 正则命中范围的替换内容 |

`redirect` 与 `url.replace` 使用相同的必选 URL 正则规则，并保留正则未命中的 URL 内容。

例如输入：

```text
http://example.com/item/123?region=CN
```

上面的配置将生成：

```text
https://api.example.com/item/123?region=CN
```

### Reject

| Action | 响应内容 |
|---|---|
| `reject(status)` | 指定状态码、空 Body |
| `reject(status, body)` | 指定状态码和 UTF-8 文本 |
| `reject_img(status)` | 1×1 GIF |
| `reject_dict(status)` | JSON 对象 `{}` |
| `reject_array(status)` | JSON 数组 `[]` |
| `reject_video(status)` | 空白视频 |

状态码必须是 `100...599` 范围内的整数。

```ini
request if ${url} ~= /^https:\/\/example\.com\/ads/ then reject_dict(200)
request if ${url} ~= /^https:\/\/example\.com\/blocked/ then reject(451, "Unavailable for legal reasons")
```

`reject(200, "{}")` 返回普通文本。需要 JSON Content-Type 时，应使用 `reject_dict(200)` 或 `reject_array(200)`。

### Header

请求 Header：

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.header.add("X-Loon", "true")
request if ${url} ~= /^https:\/\/example\.com/ then request.header.set("User-Agent", "Loon")
request if ${url} ~= /^https:\/\/example\.com/ then request.header.del("Cookie")
request if ${url} ~= /^https:\/\/example\.com/ then request.header.replace("User-Agent", /iPhone OS (\d+)/, "iPhone OS $1")
```

响应 Header：

```ini
response if ${url} ~= /^https:\/\/example\.com/ then response.header.add("X-Loon", "true")
response if ${url} ~= /^https:\/\/example\.com/ then response.header.set("Cache-Control", "no-cache")
response if ${url} ~= /^https:\/\/example\.com/ then response.header.del("Set-Cookie")
response if ${url} ~= /^https:\/\/example\.com/ then response.header.replace("Content-Type", /^(.+); charset=.+$/i, "$1")
```

| Action | 参数顺序 |
|---|---|
| `*.header.add` | Header 名称、Header 值 |
| `*.header.set` | Header 名称、Header 值 |
| `*.header.del` | Header 名称 |
| `*.header.replace` | Header 名称、正则、替换内容 |

`header.replace` 的替换内容支持当前 Action 正则的 `$0`、`$1` 至 `$n`，也支持 `${...}` 通用变量。

### Body 正则替换

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.body.replace(/"price":\s*([0-9.]+)/, "\"originalPrice\":$1")
response if ${url} ~= /^https:\/\/example\.com/ then response.body.replace(/"enabled":\s*(false)/, "\"enabled\":$1")
```

参数顺序：

```text
Regex, RegexReplacement
```

替换内容中的 `$0` 表示完整匹配，`$1` 至 `$n` 表示当前 Action 正则的捕获组；同时允许使用 `${...}` 变量。

### JSON

请求 JSON：

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.json.add("data.price", 9.99)
request if ${url} ~= /^https:\/\/example\.com/ then request.json.delete("data.ads")
request if ${url} ~= /^https:\/\/example\.com/ then request.json.replace("data.price", ${price})
request if ${url} ~= /^https:\/\/example\.com/ then request.json.jq(".data.ads = []")
request if ${url} ~= /^https:\/\/example\.com/ then request.json.jq_file("request-filter.jq")
```

响应 JSON：

```ini
response if ${url} ~= /^https:\/\/example\.com/ then response.json.add("data.price", 9.99)
response if ${url} ~= /^https:\/\/example\.com/ then response.json.delete("data.ads")
response if ${url} ~= /^https:\/\/example\.com/ then response.json.replace("data.price", ${price})
response if ${url} ~= /^https:\/\/example\.com/ then response.json.jq(".data.ads = []")
response if ${url} ~= /^https:\/\/example\.com/ then response.json.jq_file("response-filter.jq")
```

| Action | 参数顺序 |
|---|---|
| `*.json.add` | Key Path、值 |
| `*.json.delete` | Key Path |
| `*.json.replace` | Key Path、值 |
| `*.json.jq` | 内联 JQ |
| `*.json.jq_file` | 插件资源文件 |

JSON Action 只在 Body 是有效 JSON 时生效。Key Path 使用点分格式，数组下标使用 `[n]`：

```text
data.apps[0].appName
```

JSON 值可以是 String、Number、Boolean、null 或变量。

### Mock 请求 Body

直接提供 Body：

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.body.mock("json", `{"price":9.99}`)
```

从插件资源文件读取：

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.body.mock_file("json", "request_body.json")
```

Base64 数据：

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.body.mock("png", "iVBORw0KGgo...", true)
```

| 方法 | 参数顺序 |
|---|---|
| `request.body.mock` | 内容类型、内联 Body、可选 Base64 |
| `request.body.mock_file` | 内容类型、资源文件、可选 Base64 |

Base64 默认为 `false`。

### Mock 响应 Body

直接提供 Body：

```ini
response if ${url} ~= /^https:\/\/example\.com/ then response.body.mock("json", `{"code":0}`, 200)
```

从插件资源文件读取：

```ini
response if ${url} ~= /^https:\/\/example\.com/ then response.body.mock_file("json", "response_body.json", 200)
```

Base64 数据：

```ini
response if ${url} ~= /^https:\/\/example\.com/ then response.body.mock("png", "iVBORw0KGgo...", 200, true)
```

| 方法 | 参数顺序 |
|---|---|
| `response.body.mock` | 内容类型、内联 Body、可选状态码、可选 Base64 |
| `response.body.mock_file` | 内容类型、资源文件、可选状态码、可选 Base64 |

状态码默认 `200`，Base64 默认 `false`。需要设置 Base64 时，必须先填写状态码。

包含响应 Mock 的 Rewrite 具有以下限制：

1. 一条 Rewrite 只能包含一个 `response.body.mock` 或 `response.body.mock_file`。
2. 除 Mock 外，只能组合 `response.header.*` Action。
3. `if` 条件和 Mock 参数不能引用 `${response.status}` 或 `${response.header['name']}`，因为响应此时尚未生成。
4. Loon 会先生成 Mock 响应，再按照配置顺序执行全部 Header Action。
5. 最终会移除 `Transfer-Encoding`，并根据实际 Body 重新设置 `Content-Length`。

Mock Body 支持的内容类型：

```text
json, text, css, html, javascript, plain,
png, gif, jpeg, tiff, svg, mp4, form-data
```

中大型数据建议使用对应的 `*_file` 方法。

## 执行规则

### 多条 Rewrite

同一阶段中，所有匹配成功的 Rewrite 都会按照配置顺序执行：

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.header.set("X-Value", "first")
request if ${url} ~= /\/api\// then request.header.set("X-Value", "second")
```

请求 `https://example.com/api/user` 最终得到：

```http
X-Value: second
```

来源优先级为：**本地配置 > 插件**。同一来源中按照配置从上到下处理。

### 多个 Action

同一条 Rewrite 中，Action 按 `|` 从左到右执行。

某个 Action 运行失败时：

1. 保留此前已经完成的修改。
2. 跳过当前 Action 并记录错误。
3. 继续执行后续 Action。

参数数量、参数类型或正则错误属于配置错误，会在加载时拒绝整条 Rewrite，不会留到运行时处理。

## 新旧语法

旧语法仍然兼容，可以与新语法混用：

```ini
[Rewrite]
^https://example\.com header-add X-Order old
request if ${url} ~= /^https:\/\/example\.com/ then request.header.set("X-Order", "new")
```

新旧语法解析后进入同一个执行序列，并按照配置文件中的顺序处理，不会因为语法新旧改变优先级。

旧语法只用于输入兼容。Rewrite 的生成、保存和完整配置展示统一输出新语法。

常用迁移关系：

| 旧 Action | 新 Action |
|---|---|
| `header` | `url.replace(...)` |
| `302`、`307` | `redirect(...)` |
| `reject`、`reject-200` | `reject(...)` |
| `reject-img` | `reject_img(...)` |
| `reject-dict` | `reject_dict(...)` |
| `reject-array` | `reject_array(...)` |
| `reject-video` | `reject_video(...)` |
| `header-add`、`header-replace`、`header-del` | `request.header.*` |
| `response-header-*` | `response.header.*` |
| `request-body-replace-regex` | `request.body.replace(...)` |
| `response-body-replace-regex` | `response.body.replace(...)` |
| `request-body-json-*` | `request.json.*` |
| `response-body-json-*` | `response.json.*` |
| `mock-request-body` | `request.body.mock(...)` |
| `mock-response-body` | `response.body.mock(...)` |

旧 `header`、`302`、`307` 替换内容中的 `$n` 来自行首 URL 正则。转换为新语法时，Loon 会为该正则生成捕获名称，并把 `$n` 转换为 `${名称.n}`。Header/Body 正则替换 Action 自带的 `$n` 仍保持为 Action 局部捕获。

开发阶段曾使用过但未正式发布的 `http-request`、`http-response` 和命名参数写法不属于兼容范围。

## 完整示例

```ini
[Argument]
enabled = switch,true,tag=启用
price = input,9.99,type=number,tag=价格
region = select,"CN","US","JP",tag=地区

[Rewrite]
request if ${enabled} == true && ${request.method} == "GET" && ${url} ~= /^https:\/\/api\.shop\.com\/item\/(\d+)/ as item && ${request.header['X-Region']} == ${region} then request.header.set("X-Item-ID", "${item.1}") | request.header.set("X-Region", "${region}")

response if ${enabled} == true && ${url} ~= /^https:\/\/api\.shop\.com\/item\/(\d+)/ as item && ${response.status} == 200 then response.json.replace("data.price", ${price}) | response.header.set("X-Rewritten-Item", "${item.1}")
```

## 配置检查

Loon 会在加载配置时检查：

- 插件参数和捕获名称是否合法、存在且没有冲突。
- 捕获下标是否超过正则捕获组数量。
- 捕获是否位于所有成功路径都会经过的条件中。
- 变量和 Action 是否可以用于当前阶段。
- Action 参数数量、顺序和类型是否正确。
- URL 替换和重定向是否具有唯一的必选 URL 正则。
- 正则是否能够成功编译。
- Mock 响应是否符合 Action 组合和变量使用限制。

错误信息会包含行号和原因：

```text
Rewrite 第 18 行：未定义的参数 ${price2}
Rewrite 第 21 行：正则 item 只有 2 个捕获组，不能引用 ${item.3}
Rewrite 第 25 行：request 阶段不能引用 ${response.status}
```

## 开发者注意事项

- Parser 应识别字符串、原始字符串、正则和变量边界，不能直接按空格或逗号拆分整行。
- `if`、`then`、`&&`、`||`、`|`、`,` 和括号只有位于最外层时才具有语法含义。
- 插件参数必须作为语法树中的有类型数据传入，不能先替换文本再重新解析。
- 变量只展开一次；参数值中的 `${...}` 不会触发二次展开。
- 已发布 Action 的位置参数顺序保持稳定，新增可选参数只能追加到末尾。
