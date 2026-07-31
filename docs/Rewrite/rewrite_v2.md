---
sidebar_position: 1
title: 复写（Rewrite）
description: Loon 3.5.1 (978) 起支持的 Rewrite 配置语法
---

# 复写（Rewrite）

Rewrite 用于按条件修改 HTTP 请求或响应，也可以直接返回重定向、拒绝响应或 Mock 数据。

本文介绍 Loon **3.5.1 (978)** 起支持的新语法。

:::info 生效范围

Rewrite 仅对 HTTP 和经过 MitM 解密的 HTTPS 请求生效，并在规则匹配前执行。

:::

:::tip 可视化生成

可以使用 [Rewrite 配置生成器](/rewrite-builder) 组合条件和 Action，并直接复制结果。

:::

## 快速开始

基本格式：

```text
<phase> if <condition> then <action> [| <action> ...]
```

为请求添加 Header：

```ini
http-request if ${url} ~= /^https:\/\/api\.example\.com/ then request.header.set(name="X-Loon", value="true")
```

修改 JSON 响应：

```ini
http-response if ${url} ~= /^https:\/\/api\.example\.com\/profile$/ && ${response.status} == 200 then response.json.replace(path="data.vip", value=true)
```

多个 Action 使用 `|` 连接，并从左到右执行：

```ini
http-request if ${url} ~= /^https:\/\/api\.example\.com/ then request.header.set(name="X-Loon", value="true") | request.header.delete(name="Cookie")
```

每条 Rewrite 必须写在一行中。

## 执行阶段

| 阶段 | 时机 | 可用数据 |
|---|---|---|
| `http-request` | 请求发出前 | URL、请求方法、请求 Header |
| `http-response` | 收到响应 Header 后 | 请求数据、响应状态码、响应 Header |

请求和响应必须分开配置：

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.header.set(name="X-Test", value="request")
http-response if ${url} ~= /^https:\/\/example\.com/ then response.header.set(name="X-Test", value="response")
```

`response.body.mock(...)` 虽然生成响应，但会在请求阶段直接返回，因此只能用于 `http-request`。

## 条件

### 比较操作符

| 操作符 | 说明 |
|---|---|
| `==` | 精确相等 |
| `~=` | 正则匹配 |

```ini
http-request if ${request.method} == "POST" then request.header.set(name="X-Method", value="POST")
```

```ini
http-response if ${response.header['Content-Type']} ~= /^application\/json(?:;|$)/i then response.header.set(name="X-JSON", value="true")
```

`~=` 默认查找能够匹配的部分。需要匹配完整值时，请使用 `^` 和 `$`。

### 逻辑操作符

| 操作符 | 说明 |
|---|---|
| `&&` | 并且 |
| `\|\|` | 或者 |
| `()` | 调整优先级 |

```ini
http-request if ${request.method} == "POST" && (${request.header['X-Region']} == "CN" || ${request.header['X-Region']} == "HK") then request.header.set(name="X-Matched", value="true")
```

优先级为：

```text
比较操作符 > && > ||
```

同时使用 `&&` 和 `||` 时，建议添加括号。

## 变量

所有动态值都使用 `${...}`：

| 来源 | 示例 |
|---|---|
| 内置变量 | `${url}` |
| 插件参数 | `${region}` |
| 正则捕获 | `${item.1}` |

### 内置变量

| 变量 | 类型 | 请求阶段 | 响应阶段 |
|---|---|---:|---:|
| `${url}` | String | ✓ | ✓ |
| `${request.method}` | String | ✓ | ✓ |
| `${request.header['name']}` | String 或 null | ✓ | ✓ |
| `${response.status}` | Number | — | ✓ |
| `${response.header['name']}` | String 或 null | — | ✓ |

Header 名称不区分大小写：

```text
${request.header['content-type']}
${request.header['Content-Type']}
```

请求阶段不能引用响应变量。当前版本也不支持在条件中读取请求或响应 Body。

### 插件参数

在插件 `[Argument]` 中声明参数：

```ini
[Argument]
enabled = switch,true,tag=启用
price = input,9.99,type=number,tag=价格
region = select,"CN","US","JP",tag=地区
```

在 Rewrite 中直接引用：

```ini
[Rewrite]
http-response if ${enabled} == true && ${request.header['X-Region']} == ${region} then response.json.replace(path="data.price", value=${price})
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

参数只作为数据使用，不能生成新的条件或 Action，也不会进行二次变量展开。

### 正则捕获

使用 `as <name>` 保存匹配结果：

```ini
http-request if ${url} ~= /^https:\/\/api\.shop\.com\/item\/(\d+)/ as item then request.header.set(name="X-Item-ID", value="${item.1}")
```

| 变量 | 内容 |
|---|---|
| `${item.0}` | 完整匹配内容 |
| `${item.1}` | 第一个捕获组 |
| `${item.2}` | 第二个捕获组 |

使用限制：

1. `as` 只能用于 `~=`。
2. 捕获名称在同一条 Rewrite 中必须唯一。
3. 捕获名称不能与插件参数重名。
4. 捕获下标不能超过正则中的捕获组数量。
5. 捕获条件必须经过所有成功路径，不能放在 `||` 的可选分支中。

有效：

```ini
http-request if (${request.method} == "GET" || ${request.method} == "POST") && ${url} ~= /item\/(\d+)/ as item then request.header.set(name="X-Item", value="${item.1}")
```

无效：

```ini
http-request if ${url} ~= /item\/(\d+)/ as item || ${request.header['X-Debug']} == "true" then request.header.set(name="X-Item", value="${item.1}")
```

如果可选捕获组未命中，引用它的 Action 会失败并跳过，后续 Action 继续执行。

## 值与字符串

### 字面量

| 类型 | 示例 |
|---|---|
| String | `"hello world"` |
| Number | `200`、`9.99` |
| Boolean | `true`、`false` |
| Null | `null` |
| Regex | `/^https:\/\/example\.com/i` |

固定字符串必须使用双引号。以下两个值类型不同：

```text
value=9.99      # Number
value="9.99"    # String
```

### 正则

格式：

```text
/pattern/flags
```

支持的 Flag：

| Flag | 说明 |
|---|---|
| `i` | 忽略大小写 |
| `m` | 多行模式 |
| `s` | `.` 匹配换行 |

正则字面量中不会展开 `${...}`。需要由插件参数提供正则时，将变量放在 `~=` 右侧：

```ini
http-request if ${url} ~= ${urlPattern} then request.header.set(name="X-Matched", value="true")
```

### 双引号字符串

双引号字符串支持变量：

```ini
request.header.set(name="X-Info", value="price=${price}, region=${region}")
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

### 原始字符串

固定 JSON 或 HTML 可以使用反引号，减少转义：

```ini
http-request if ${url} ~= /^https:\/\/api\.example\.com/ then response.body.mock(type="json", data=`{"code":0,"message":"ok"}`, status=200)
```

原始字符串不会处理转义，也不会展开 `${...}`。两个连续反引号表示一个字面量反引号。

需要变量时，请改用双引号字符串：

```ini
http-request if ${url} ~= /^https:\/\/api\.example\.com\/item\/(\d+)/ as item then response.body.mock(type="json", data="{\"item\":\"${item.1}\"}", status=200)
```

新版语法不会按空格拆分整行，因此不需要使用 `\x20`。

## Action

所有 Action 都使用命名参数：

```text
action(name=value, name=value)
```

Action 名称和参数名不能使用变量。

### URL

#### `url.replace`

在完整 URL 中执行正则替换：

```ini
http-request if ${url} ~= /^http:\/\/example\.com/ then url.replace(pattern=/^http:\/\/example\.com/, replacement="https://api.example.com")
```

| 参数 | 类型 | 说明 |
|---|---|---|
| `pattern` | Regex | 替换正则 |
| `replacement` | String | 替换内容 |

只替换正则命中的范围，其余 URL 保留。

#### `redirect`

```ini
http-request if ${url} ~= /^http:\/\/example\.com/ then redirect(status=302, location="https://new.example.com")
```

| 参数 | 类型 | 说明 |
|---|---|---|
| `status` | Number | `302` 或 `307` |
| `location` | String | 替换 URL 正则命中范围的内容 |

使用 `redirect` 时，条件中必须有且只有一个必选的 URL 正则。

### Reject

```ini
http-request if ${url} ~= /^https:\/\/example\.com\/ads/ then reject(status=200, body="json-object")
```

支持以下固定组合：

| `status` | `body` | 响应 |
|---:|---|---|
| `404` | `"empty"` | 空 Body |
| `200` | `"empty"` | 空 Body |
| `200` | `"image"` | 1×1 GIF |
| `200` | `"json-object"` | `{}` |
| `200` | `"json-array"` | `[]` |
| `200` | `"video"` | 空白视频 |

### Header

请求 Header：

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.header.add(name="X-Loon", value="true")
http-request if ${url} ~= /^https:\/\/example\.com/ then request.header.set(name="User-Agent", value="Loon")
http-request if ${url} ~= /^https:\/\/example\.com/ then request.header.delete(name="Cookie")
http-request if ${url} ~= /^https:\/\/example\.com/ then request.header.replace(name="User-Agent", pattern=/iPhone OS \d+/, replacement="iPhone OS 18")
```

响应 Header：

```ini
http-response if ${url} ~= /^https:\/\/example\.com/ then response.header.add(name="X-Loon", value="true")
http-response if ${url} ~= /^https:\/\/example\.com/ then response.header.set(name="Cache-Control", value="no-cache")
http-response if ${url} ~= /^https:\/\/example\.com/ then response.header.delete(name="Set-Cookie")
http-response if ${url} ~= /^https:\/\/example\.com/ then response.header.replace(name="Content-Type", pattern=/; charset=.+$/i, replacement="")
```

| Action | 参数 |
|---|---|
| `*.header.add` | `name=String, value=String` |
| `*.header.set` | `name=String, value=String` |
| `*.header.delete` | `name=String` |
| `*.header.replace` | `name=String, pattern=Regex, replacement=String` |

### Body 正则替换

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.body.replace(pattern=/"price":\s*[0-9.]+/, replacement="\"price\":9.99")
http-response if ${url} ~= /^https:\/\/example\.com/ then response.body.replace(pattern=/"enabled":\s*false/, replacement="\"enabled\":true")
```

参数：

```text
pattern=Regex, replacement=String
```

### JSON

请求 JSON：

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.json.add(path="data.price", value=9.99)
http-request if ${url} ~= /^https:\/\/example\.com/ then request.json.delete(path="data.ads")
http-request if ${url} ~= /^https:\/\/example\.com/ then request.json.replace(path="data.price", value=${price})
http-request if ${url} ~= /^https:\/\/example\.com/ then request.json.jq(filter=".data.ads = []")
```

响应 JSON：

```ini
http-response if ${url} ~= /^https:\/\/example\.com/ then response.json.add(path="data.price", value=9.99)
http-response if ${url} ~= /^https:\/\/example\.com/ then response.json.delete(path="data.ads")
http-response if ${url} ~= /^https:\/\/example\.com/ then response.json.replace(path="data.price", value=${price})
http-response if ${url} ~= /^https:\/\/example\.com/ then response.json.jq(file="response-filter.jq")
```

| Action | 参数 |
|---|---|
| `*.json.add` | `path=String, value=Any` |
| `*.json.delete` | `path=String` |
| `*.json.replace` | `path=String, value=Any` |
| `*.json.jq` | `filter=String` 或 `file=String` |

JSON Action 只在 Body 是有效 JSON 时生效。Key Path 使用点分格式，数组下标使用 `[n]`：

```text
data.apps[0].appName
```

`value` 可以是 String、Number、Boolean、null 或变量。

### Mock Body

Mock 请求 Body：

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.body.mock(type="json", data=`{"price":9.99}`)
http-request if ${url} ~= /^https:\/\/example\.com/ then request.body.mock(type="json", file="request_body.json")
```

Mock 响应 Body：

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then response.body.mock(type="json", data=`{"code":0}`, status=200)
http-request if ${url} ~= /^https:\/\/example\.com/ then response.body.mock(type="json", file="response_body.json", status=200)
```

| 参数 | 说明 |
|---|---|
| `type` | Body 类型 |
| `data` | 直接填写数据 |
| `file` | 从插件文件读取；与 `data` 二选一 |
| `base64` | 数据是否为 Base64，默认 `false` |
| `status` | 响应状态码，默认 `200`；仅用于响应 |

支持的 `type`：

```text
json, text, css, html, javascript, plain,
png, gif, jpeg, tiff, svg, mp4, form-data
```

中大型数据建议使用 `file`。

## 执行规则

### 多条 Rewrite

同一阶段中，所有匹配成功的 Rewrite 都会按配置顺序执行：

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.header.set(name="X-Value", value="first")
http-request if ${url} ~= /\/api\// then request.header.set(name="X-Value", value="second")
```

请求 `https://example.com/api/user` 最终得到：

```http
X-Value: second
```

来源优先级为：**本地配置 > 插件**。同一文件中按从上到下的顺序处理。

### 多个 Action

同一条 Rewrite 中，Action 按 `|` 从左到右执行。

某个 Action 运行失败时：

1. 保留之前已完成的修改。
2. 跳过当前 Action 并记录错误。
3. 继续执行后续 Action。

参数名、参数类型或正则错误属于配置错误，会在加载时拒绝整条 Rewrite。

## 新旧语法

旧语法仍然兼容，可以与新语法混用：

```ini
[Rewrite]
^https://example\.com header-add X-Order old
http-request if ${url} ~= /^https:\/\/example\.com/ then request.header.set(name="X-Order", value="new")
```

新旧语法进入同一执行序列，按配置顺序处理。Loon 不会自动改写旧配置。

常用迁移关系：

| 旧 Action | 新 Action |
|---|---|
| `header` | `url.replace(...)` |
| `302`、`307` | `redirect(...)` |
| `reject-*` | `reject(...)` |
| `header-*` | `request.header.*` |
| `response-header-*` | `response.header.*` |
| `request-body-replace-regex` | `request.body.replace(...)` |
| `response-body-replace-regex` | `response.body.replace(...)` |
| `request-body-json-*` | `request.json.*` |
| `response-body-json-*` | `response.json.*` |
| `mock-request-body` | `request.body.mock(...)` |
| `mock-response-body` | `response.body.mock(...)` |

## 完整示例

```ini
[Argument]
enabled = switch,true,tag=启用
price = input,9.99,type=number,tag=价格
region = select,"CN","US","JP",tag=地区

[Rewrite]
http-request if ${enabled} == true && ${request.method} == "GET" && ${url} ~= /^https:\/\/api\.shop\.com\/item\/(\d+)/ as item && ${request.header['X-Region']} == ${region} then request.header.set(name="X-Item-ID", value="${item.1}") | request.header.set(name="X-Region", value="${region}")

http-response if ${enabled} == true && ${url} ~= /^https:\/\/api\.shop\.com\/item\/(\d+)/ as item && ${response.status} == 200 then response.json.replace(path="data.price", value=${price}) | response.header.set(name="X-Rewritten-Item", value="${item.1}")
```

## 配置检查

Loon 会在加载时检查：

- 参数和捕获名称是否存在。
- 捕获名称是否重复或冲突。
- 捕获下标是否超出范围。
- 变量和 Action 是否可用于当前阶段。
- Action 参数名称和类型是否正确。
- 正则是否能够编译。

错误信息会包含行号和原因：

```text
Rewrite 第 18 行：未定义的参数 ${price2}
Rewrite 第 21 行：正则 item 只有 2 个捕获组，不能引用 ${item.3}
Rewrite 第 25 行：http-request 阶段不能引用 ${response.status}
```
