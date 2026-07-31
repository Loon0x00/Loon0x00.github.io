# Rewrite 语法重构设计草案

> 本文为内部设计草案，不作为用户文档发布。

## 1. 文档状态

- 状态：当前 LNRewrite 语法实现基线
- 范围：仅讨论 Rewrite 配置语法
- 目标：定义 Parser、Matcher 和 Executor 共同遵循的配置语义
- 不涉及：Script 语法重构和 Socket 接入细节

## 2. 设计目标

新语法需要满足以下要求：

1. 一条 Rewrite 使用一行配置表示。
2. 条件和动作分离，避免继续增加大量固定位置参数。
3. 支持 URL、请求 Header、响应 Header、响应状态码等匹配条件。
4. 支持多个条件组合。
5. 支持引用插件 `[Argument]` 中由用户填写或选择的参数。
6. 支持引用正则匹配结果。
7. 所有动态值使用统一的引用语法。
8. 字符串、正则、JSON、URL 等内容包含特殊字符时不能造成错误分词。
9. UI 参数值只能作为数据使用，不能改变 Rewrite 的语法结构。
10. 为将来增加更多条件和动作保留扩展空间。

## 3. 基本结构

Rewrite 使用以下基本结构：

```text
<phase> if <expression> then <action> [| <action> ...]
```

阶段：

```text
http-request
http-response
```

示例：

```ini
http-request if ${url} ~= /^https:\/\/api\.example\.com/ then request.header.set(name="X-Loon", value="matched")
```

多个动作使用 `|` 连接，并按照从左到右的顺序执行：

```ini
http-request if ${url} ~= /^https:\/\/api\.example\.com/ then request.header.set(name="X-Loon", value="matched") | request.header.delete(name="Cookie")
```

## 4. 条件表达式

### 4.1 比较操作符

```text
==     精确相等
~=     正则匹配
```

精确匹配：

```ini
http-request if ${request.method} == "POST" then request.header.set(name="X-Method", value="POST")
```

正则匹配：

```ini
http-response if ${response.header['Content-Type']} ~= /^application\/json(?:;|$)/i then response.header.set(name="X-JSON", value="true")
```

`==` 比较完整值，`~=` 使用正则查找匹配。需要匹配完整字符串时，应当在正则中显式使用 `^` 和 `$`。

### 4.2 逻辑操作符

```text
&&     并且
||     或者
()     调整优先级
```

示例：

```ini
http-request if ${request.method} == "POST" && (${request.header['X-Region']} == "CN" || ${request.header['X-Region']} == "HK") then request.header.set(name="X-Matched", value="true")
```

优先级规定为：

```text
比较操作符 > && > ||
```

## 5. 动态值统一语法

所有动态值都使用：

```text
${变量表达式}
```

动态值有三个来源：

1. Loon 内置变量。
2. 插件 `[Argument]` 参数。
3. 正则匹配结果。

新 Rewrite 语法中不再引入其他动态值写法，例如：

```text
$1
${argument.price}
arg.price
match.item.1
{price}
```

现有插件 Script 中的 `{price}` 继续按旧语法处理；新的 `if/then` Rewrite 只识别 `${price}`。

## 6. 内置变量

第一阶段建议支持以下内置变量：

| 变量 | 类型 | 可用阶段 |
|---|---|---|
| `${url}` | 字符串 | request、response |
| `${request.method}` | 字符串 | request、response |
| `${request.header['name']}` | 字符串或 null | request、response |
| `${response.status}` | 数字 | response |
| `${response.header['name']}` | 字符串或 null | response |

### 6.1 URL

```ini
http-request if ${url} ~= /^https:\/\/api\.example\.com/ then request.header.set(name="X-Matched", value="true")
```

### 6.2 请求 Header

```ini
http-request if ${request.header['X-Region']} == "CN" then request.header.set(name="X-Country", value="China")
```

Header 名称查找不区分大小写：

```text
${request.header['content-type']}
${request.header['Content-Type']}
```

以上两个表达式引用同一个 Header。

### 6.3 响应 Header 和状态码

```ini
http-response if ${response.status} == 200 && ${response.header['Content-Type']} ~= /^application\/json/i then response.header.set(name="X-Matched", value="true")
```

请求阶段不能引用尚未产生的响应字段：

```ini
# 非法
http-request if ${response.status} == 200 then request.header.set(name="X-Test", value="true")
```

## 7. 插件 `[Argument]` 参数

继续使用插件现有的 `[Argument]` 声明：

```ini
[Argument]
enabled = switch,true,tag=启用
price = input,9.99,type=number,tag=价格
region = select,"CN","US","JP",tag=地区
level = select,1,2,3,type=number,tag=等级
```

Rewrite 直接使用参数名：

```text
${enabled}
${price}
${region}
${level}
```

示例：

```ini
http-response if ${enabled} == true && ${level} == 2 && ${request.header['X-Region']} == ${region} then response.json.replace(path="data.price", value=${price})
```

`[Argument]` 的第一项继续表示 UI 控件类型，参数值类型使用以下规则：

| UI 控件 | 允许的值类型 | 默认值类型 |
|---|---|---|
| `input` | String、Number | String |
| `select` | String、Number | String |
| `switch` | Boolean | Boolean |

`switch` 固定返回 Boolean，不允许设置其他类型：

```ini
enabled = switch,true
```

`input` 和 `select` 默认返回 String：

```ini
name = input,"Loon"
region = select,"CN","US","JP"
```

需要返回 Number 时，使用 `type=number`，数字值不加引号：

```ini
price = input,9.99,type=number
level = select,1,2,3,type=number
```

也可以显式声明 `type=string`，但效果与默认行为相同：

```ini
name = input,"Loon",type=string
region = select,"CN","US",type=string
```

Rewrite 使用参数时保留其声明类型，不再提供运行时类型转换语法。

以下组合非法：

```ini
enabled = switch,true,type=string
price = input,true,type=boolean
level = select,1,2,3,type=boolean
```

## 8. 正则匹配结果

### 8.1 声明匹配结果

使用 `as <name>` 保存前一个正则条件的匹配结果：

```text
${url} ~= /regex/ as item
```

示例：

```ini
http-request if ${url} ~= /^https:\/\/api\.shop\.com\/item\/(\d+)\?price=([^&]+)/ as item then request.header.set(name="X-Item-ID", value="${item.1}")
```

### 8.2 引用匹配结果

```text
${item.0}    正则完整匹配内容
${item.1}    第一个捕获组
${item.2}    第二个捕获组
```

假设 URL 为：

```text
https://api.shop.com/item/123?price=9.99
```

对应结果为：

```text
${item.0} = https://api.shop.com/item/123?price=9.99
${item.1} = 123
${item.2} = 9.99
```

Header 正则也使用相同语法：

```ini
http-request if ${request.header['X-Product']} ~= /^([A-Z]+)-(\d+)$/ as product then request.header.set(name="X-Product-Type", value="${product.1}") | request.header.set(name="X-Product-ID", value="${product.2}")
```

### 8.3 `as` 使用约束

`as` 只能用于正则匹配：

```text
允许：${url} ~= /.../ as item
禁止：${url} == "..." as item
```

第一阶段建议规定：

1. 如果 `then` 动作引用了 `${item.N}`，声明 `as item` 的正则条件必须是整条 `if` 的必选条件，并位于所有成功路径都必须经过的 `&&` 条件中。
2. 捕获名称在同一条 Rewrite 中必须唯一。
3. 捕获名称不能与插件参数名称相同。
4. `${item.N}` 中的下标不能超过正则捕获组数量。
5. 可选捕获组未命中时，不得静默替换为空字符串。

允许：

```ini
http-request if (${request.method} == "GET" || ${request.method} == "POST") && ${url} ~= /item\/(\d+)/ as item then request.header.set(name="X-Item", value="${item.1}")
```

禁止：

```ini
http-request if ${url} ~= /item\/(\d+)/ as item || ${request.header['X-Debug']} == "true" then request.header.set(name="X-Item", value="${item.1}")
```

禁止示例可能仅通过 `X-Debug == "true"` 使条件成立，此时正则没有匹配，`${item.1}` 不存在。第一阶段不允许将未定义的捕获结果按 null 或空字符串处理。

## 9. 三种变量来源汇总

| 来源 | 定义方式 | 使用方式 |
|---|---|---|
| 内置变量 | Loon 内置 | `${url}`、`${request.header['X']}` |
| 插件参数 | `[Argument] price = ...` | `${price}` |
| 正则结果 | `~= /.../ as item` | `${item.0}`、`${item.1}` |

完整示例：

```ini
[Argument]
enabled = switch,true
price = input,9.99,type=number
region = select,"CN","US"

[Rewrite]
http-request if ${enabled} == true && ${url} ~= /^https:\/\/api\.shop\.com\/item\/(\d+)/ as item && ${request.header['X-Region']} == ${region} then redirect(status=302, location="https://m.shop.com/item/${item.1}?price=${price}&region=${region}")
```

## 10. 字面量

### 10.1 字符串

固定字符串必须使用双引号：

```text
"data.price"
"X-Region"
"hello world"
"a,b=c"
```

以下写法非法：

```text
path=data.price
value=hello world
```

必须写成：

```text
path="data.price"
value="hello world"
```

### 10.2 数字、布尔值和 null

```text
200
9.99
true
false
null
```

这些值不使用双引号。

对比：

```text
value=9.99      数字
value="9.99"    字符串
```

### 10.3 正则

正则使用：

```text
/pattern/flags
```

示例：

```text
/^https:\/\/example\.com/i
/^application\/json(?:;|$)/i
/\d{2,4}/
```

建议支持的 flags：

```text
i    忽略大小写
m    多行
s    dot 匹配换行
```

正则中的 `{2}`、`{2,4}` 等内容是正则量词，不进行变量解析。

正则字面量内部不解析 `${...}`。需要由插件参数提供完整正则时，应直接使用变量作为右操作数：

```ini
http-request if ${url} ~= ${urlPattern} then request.header.set(name="X-Matched", value="true")
```

## 11. 字符串转义

双引号字符串建议支持：

```text
\"    双引号
\\    反斜杠
\n    换行
\r    回车
\t    Tab
\${   字面量 ${
```

示例：

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.header.set(name="X-Info", value="price=\"${price}\", region=\"${region}\"")
```

假设插件参数为：

```ini
[Argument]
price = input,9.99,type=number
region = select,"CN","US"
```

其中：

1. `value="..."` 外层双引号用于界定整个配置字符串。
2. `\"` 表示最终字符串中的一个双引号。
3. `${price}` 替换为 `9.99`。
4. `${region}` 替换为 `CN`。
5. Number 类型的 `${price}` 放入模板字符串后按文本输出，不改变参数自身类型。

最终生成的 `value` 内容为：

```text
price="9.99", region="CN"
```

最终写入的 Header 为：

```http
X-Info: price="9.99", region="CN"
```

如果需要输出字面量 `${price}`，而不是引用参数：

```ini
request.header.set(name="X-Template", value="literal \${price}")
```

最终写入的 Header 为：

```http
X-Template: literal ${price}
```

## 12. Header 名称中的特殊字符

Header 名称统一使用单引号：

```text
${request.header['X-Region']}
${response.header['Content-Type']}
```

这样在双引号模板字符串内引用 Header 时不会产生双引号嵌套：

```ini
request.header.set(name="X-Origin", value="UA=${request.header['User-Agent']}")
```

Header 名称内部建议支持：

```text
\'    单引号
\\    反斜杠
```

包含逗号或等号的 Header 名称不会影响外层解析：

```text
${request.header['X-A=B,C']}
```

## 13. 原始字符串

对于 JSON、HTML 或包含大量引号、逗号、括号的内容，支持反引号原始字符串：

```text
`原始内容`
```

原始字符串具有以下语义：

1. 不处理反斜杠转义。
2. 不解析 `${变量}`。
3. 逗号、等号、括号、双引号均为普通字符。
4. 两个连续反引号表示一个字面量反引号。

示例：

```ini
http-request if ${url} ~= /^https:\/\/api\.example\.com/ then response.body.mock(type="json", data=`{"code":0,"message":"a,b=c","data":{"price":9.99}}`, status=200)
```

需要动态变量时使用普通双引号模板字符串：

```ini
http-request if ${url} ~= /^https:\/\/api\.example\.com\/item\/(\d+)/ as item then response.body.mock(type="json", data="{\"code\":0,\"price\":${price},\"item\":\"${item.1}\"}", status=200)
```

## 14. 动作参数

动作参数必须使用命名参数：

```text
action(name=value, name=value)
```

不建议继续使用位置参数：

```text
# 不建议
redirect 302 "https://example.com"

# 建议
redirect(status=302, location="https://example.com")
```

新语法需要覆盖当前全部 29 种 Rewrite action。每个 action 都使用以下调用形式：

```text
action(name=value, name=value)
```

### 14.1 URL 修改

#### `url.replace`

对应当前 `header`：

```ini
http-request if ${url} ~= /^http:\/\/example\.com/ then url.replace(pattern=/^http:\/\/example\.com/, replacement="https://example.com")
```

参数：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `pattern` | Regex | 是 | 在完整 URL 中执行替换的正则 |
| `replacement` | String | 是 | 替换内容，允许使用 `${...}` |

### 14.2 重定向

#### `redirect`

对应当前 `302`、`307`：

```ini
http-request if ${url} ~= /^https:\/\/old\.example\.com\/item\/(\d+)/ as item then redirect(status=302, location="https://new.example.com/item/${item.1}")
```

```ini
http-request if ${url} ~= /^https:\/\/old\.example\.com/ then redirect(status=307, location="https://new.example.com")
```

参数：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `status` | Number | 是 | 当前只允许 `302`、`307` |
| `location` | String | 是 | URL 正则命中范围的替换内容，允许使用 `${...}` |

为保持当前 `302`、`307` 的行为，`redirect(...)` 使用规则中唯一的必选 `${url} ~= /.../` 条件作为替换正则，在完整 URL 上只替换该正则命中的范围，未命中的部分继续保留。

因此使用 `redirect(...)` 时：

1. 必须存在一个所有成功路径都会经过的 `${url} ~= /.../` 条件。
2. 该条件不能位于 `||` 的可选分支中。
3. 如果存在多个必选 URL 正则而无法确定替换依据，则配置无效。

例如：

```ini
http-request if ${url} ~= /^http:\/\/example\.com/ then redirect(status=302, location="https://api.example.com")
```

输入：

```text
http://example.com/item/123?region=CN
```

最终 `Location`：

```text
https://api.example.com/item/123?region=CN
```

### 14.3 拒绝响应

#### `reject`

对应当前全部六种 reject action：

| 当前 action | 新 action | 响应内容 |
|---|---|---|
| `reject` | `reject(status=404, body="empty")` | 404、空 Body |
| `reject-200` | `reject(status=200, body="empty")` | 200、空 Body |
| `reject-img` | `reject(status=200, body="image")` | 200、1×1 GIF |
| `reject-dict` | `reject(status=200, body="json-object")` | 200、`{}` |
| `reject-array` | `reject(status=200, body="json-array")` | 200、`[]` |
| `reject-video` | `reject(status=200, body="video")` | 200、空白视频 |

示例：

```ini
http-request if ${url} ~= /^https:\/\/example\.com\/ads/ then reject(status=200, body="json-object")
```

参数：

| 参数 | 类型 | 必填 | 允许值 |
|---|---|---|---|
| `status` | Number | 是 | `200`、`404` |
| `body` | String | 是 | `"empty"`、`"image"`、`"json-object"`、`"json-array"`、`"video"` |

第一阶段只允许表格中的六种固定组合，不能任意组合 `status` 和 `body`。

### 14.4 请求 Header

#### `request.header.add`

对应当前 `header-add`：

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.header.add(name="X-Loon", value="true")
```

#### `request.header.set`

对应当前 `header-replace`：

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.header.set(name="User-Agent", value="Loon")
```

#### `request.header.delete`

对应当前 `header-del`：

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.header.delete(name="Cookie")
```

#### `request.header.replace`

对应当前 `header-replace-regex`：

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.header.replace(name="User-Agent", pattern=/iPhone OS \d+/, replacement="iPhone OS 18")
```

参数：

| action | 参数 |
|---|---|
| `request.header.add` | `name=String, value=String` |
| `request.header.set` | `name=String, value=String` |
| `request.header.delete` | `name=String` |
| `request.header.replace` | `name=String, pattern=Regex, replacement=String` |

当前实现中 `header-add` 和 `header-replace` 最终都会设置对应 Header；新语法暂时保留 `add`、`set` 两个名称，以保持配置意图。

### 14.5 响应 Header

#### `response.header.add`

对应当前 `response-header-add`：

```ini
http-response if ${url} ~= /^https:\/\/example\.com/ then response.header.add(name="X-Loon", value="true")
```

#### `response.header.set`

对应当前 `response-header-replace`：

```ini
http-response if ${url} ~= /^https:\/\/example\.com/ then response.header.set(name="Cache-Control", value="no-cache")
```

#### `response.header.delete`

对应当前 `response-header-del`：

```ini
http-response if ${url} ~= /^https:\/\/example\.com/ then response.header.delete(name="Set-Cookie")
```

#### `response.header.replace`

对应当前 `response-header-replace-regex`：

```ini
http-response if ${url} ~= /^https:\/\/example\.com/ then response.header.replace(name="Content-Type", pattern=/; charset=.+$/i, replacement="")
```

参数：

| action | 参数 |
|---|---|
| `response.header.add` | `name=String, value=String` |
| `response.header.set` | `name=String, value=String` |
| `response.header.delete` | `name=String` |
| `response.header.replace` | `name=String, pattern=Regex, replacement=String` |

### 14.6 Body 正则替换

#### `request.body.replace`

对应当前 `request-body-replace-regex`：

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.body.replace(pattern=/"price":\s*[0-9.]+/, replacement="\"price\":9.99")
```

#### `response.body.replace`

对应当前 `response-body-replace-regex`：

```ini
http-response if ${url} ~= /^https:\/\/example\.com/ then response.body.replace(pattern=/"enabled":\s*false/, replacement="\"enabled\":true")
```

参数：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `pattern` | Regex | 是 | Body 匹配正则 |
| `replacement` | String | 是 | 替换内容，允许使用 `${...}` |

### 14.7 请求 JSON

#### `request.json.add`

对应当前 `request-body-json-add`：

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.json.add(path="data.price", value=${price})
```

#### `request.json.delete`

对应当前 `request-body-json-del`：

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.json.delete(path="data.ads")
```

#### `request.json.replace`

对应当前 `request-body-json-replace`：

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.json.replace(path="data.price", value=${price})
```

#### `request.json.jq`

对应当前 `request-body-json-jq`：

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.json.jq(filter=".data.ads = []")
```

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.json.jq(file="request-filter.jq")
```

参数：

| action | 参数 |
|---|---|
| `request.json.add` | `path=String, value=Any` |
| `request.json.delete` | `path=String` |
| `request.json.replace` | `path=String, value=Any` |
| `request.json.jq` | `filter=String` 或 `file=String`，二选一 |

### 14.8 响应 JSON

#### `response.json.add`

对应当前 `response-body-json-add`：

```ini
http-response if ${url} ~= /^https:\/\/example\.com/ then response.json.add(path="data.price", value=${price})
```

#### `response.json.delete`

对应当前 `response-body-json-del`：

```ini
http-response if ${url} ~= /^https:\/\/example\.com/ then response.json.delete(path="data.ads")
```

#### `response.json.replace`

对应当前 `response-body-json-replace`：

```ini
http-response if ${url} ~= /^https:\/\/example\.com/ then response.json.replace(path="data.price", value=${price})
```

#### `response.json.jq`

对应当前 `response-body-json-jq`：

```ini
http-response if ${url} ~= /^https:\/\/example\.com/ then response.json.jq(filter=".data.ads = []")
```

```ini
http-response if ${url} ~= /^https:\/\/example\.com/ then response.json.jq(file="response-filter.jq")
```

参数：

| action | 参数 |
|---|---|
| `response.json.add` | `path=String, value=Any` |
| `response.json.delete` | `path=String` |
| `response.json.replace` | `path=String, value=Any` |
| `response.json.jq` | `filter=String` 或 `file=String`，二选一 |

### 14.9 Mock 请求 Body

#### `request.body.mock`

对应当前 `mock-request-body`：

直接提供数据：

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.body.mock(type="json", data="{\"price\":${price}}")
```

从文件读取：

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.body.mock(type="json", file="request_body.json")
```

Base64 数据：

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.body.mock(type="png", data="iVBORw0KGgo...", base64=true)
```

### 14.10 Mock 响应 Body

#### `response.body.mock`

对应当前 `mock-response-body`：

该 action 虽然生成的是响应，但当前实现会在请求阶段命中规则后直接返回 Mock 响应，因此规则阶段使用 `http-request`。

直接提供数据：

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then response.body.mock(type="json", data="{\"price\":${price}}", status=200)
```

从文件读取：

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then response.body.mock(type="json", file="response_body.json", status=200)
```

Base64 数据：

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then response.body.mock(type="png", data="iVBORw0KGgo...", base64=true, status=200)
```

Mock Body 参数：

| 参数 | 类型 | Request 必填 | Response 必填 | 说明 |
|---|---|---|---|---|
| `type` | String | 是 | 是 | Body 对应的内容类型 |
| `data` | String | 与 `file` 二选一 | 与 `file` 二选一 | 直接提供 Body |
| `file` | String | 与 `data` 二选一 | 与 `data` 二选一 | 从插件文件读取 Body |
| `base64` | Boolean | 否 | 否 | 默认 `false` |
| `status` | Number | 不支持 | 否 | Response 默认 `200` |

当前支持的 `type`：

```text
json
text
css
html
javascript
plain
png
gif
jpeg
tiff
svg
mp4
form-data
```

### 14.11 当前 action 完整映射

| 序号 | 当前 action | 新 action |
|---|---|---|
| 1 | `header` | `url.replace(pattern=/regex/, replacement="value")` |
| 2 | `302` | `redirect(status=302, location="url")` |
| 3 | `reject` | `reject(status=404, body="empty")` |
| 4 | `307` | `redirect(status=307, location="url")` |
| 5 | `reject-200` | `reject(status=200, body="empty")` |
| 6 | `reject-img` | `reject(status=200, body="image")` |
| 7 | `reject-dict` | `reject(status=200, body="json-object")` |
| 8 | `reject-array` | `reject(status=200, body="json-array")` |
| 9 | `reject-video` | `reject(status=200, body="video")` |
| 10 | `header-del` | `request.header.delete(name="name")` |
| 11 | `header-replace` | `request.header.set(name="name", value="value")` |
| 12 | `header-add` | `request.header.add(name="name", value="value")` |
| 13 | `header-replace-regex` | `request.header.replace(name="name", pattern=/regex/, replacement="value")` |
| 14 | `request-body-replace-regex` | `request.body.replace(pattern=/regex/, replacement="value")` |
| 15 | `mock-request-body` | `request.body.mock(type="type", data="value")` |
| 16 | `response-header-del` | `response.header.delete(name="name")` |
| 17 | `response-header-replace` | `response.header.set(name="name", value="value")` |
| 18 | `response-header-add` | `response.header.add(name="name", value="value")` |
| 19 | `response-header-replace-regex` | `response.header.replace(name="name", pattern=/regex/, replacement="value")` |
| 20 | `response-body-replace-regex` | `response.body.replace(pattern=/regex/, replacement="value")` |
| 21 | `mock-response-body` | `response.body.mock(type="type", data="value", status=200)` |
| 22 | `request-body-json-add` | `request.json.add(path="path", value="value")` |
| 23 | `request-body-json-del` | `request.json.delete(path="path")` |
| 24 | `request-body-json-replace` | `request.json.replace(path="path", value="value")` |
| 25 | `response-body-json-add` | `response.json.add(path="path", value="value")` |
| 26 | `response-body-json-del` | `response.json.delete(path="path")` |
| 27 | `response-body-json-replace` | `response.json.replace(path="path", value="value")` |
| 28 | `request-body-json-jq` | `request.json.jq(filter="jq")` |
| 29 | `response-body-json-jq` | `response.json.jq(filter="jq")` |

动作名称和参数名称不允许使用变量替换：

```text
# 非法
${actionName}(path="data.price")
response.json.replace(${parameterName}="data.price")
```

变量只能出现在参数值中。

## 15. 特殊字符的分词规则

解析器不能再通过空格或逗号直接拆分整行。

建议至少识别以下 token：

```text
变量         ${price}
字符串       "a,b=c"
原始字符串   `{"a":1}`
正则         /^https:\/\//
数字         9.99
布尔值       true
标识符       response.json.replace
操作符       ==、~=、&&、||
```

只有位于最外层时，以下字符才具有语法含义：

```text
if
then
&&
||
|
,
(
)
```

这些字符出现在以下区域时只是普通内容：

1. 双引号字符串。
2. 反引号原始字符串。
3. 正则字面量。
4. Header 名称。
5. 变量表达式内部。

例如：

```ini
request.header.set(name="X-Test", value="a,b=c | if then")
```

以上内容必须被解析为一个完整的字符串参数。

## 16. UI 参数安全

插件参数不能通过文本替换的方式插入配置行后重新解析。

错误方式：

```text
1. 把 ${price} 替换成用户输入。
2. 对替换后的整行再次进行语法解析。
```

如果用户输入以下内容：

```text
9.99), reject(type="dict"
```

重新解析可能导致 Rewrite 结构被改变。

正确方式：

1. 先把 Rewrite 配置解析成语法树。
2. `${price}` 保存为变量节点。
3. `"price=${price}"` 保存为模板字符串节点。
4. UI 参数作为独立的有类型数据传入。
5. 执行匹配或动作时解析变量值。
6. 参数值永远不能生成新的动作、条件或操作符。
7. 变量只展开一次；插件参数值中即使包含 `${...}`，也必须作为普通数据保留，不能继续解析。

## 17. 名称和错误检查

建议在加载配置时完成以下检查：

1. `[Argument]` 参数名格式合法。
2. 插件参数不能使用 `url`、`request`、`response` 等保留名称。
3. `as` 捕获名称不能与插件参数名称相同。
4. 同一条 Rewrite 中不能重复声明捕获名称。
5. 引用的插件参数必须存在。
6. 引用的捕获名称必须存在。
7. 捕获组下标不能超过正则捕获组数量。
8. request 阶段不能引用 response 变量。
9. 动作必须与阶段兼容。
10. 动作参数数量、名称和类型必须正确。
11. 正则必须能在配置加载时成功编译。
12. `switch` 参数必须使用 Boolean。
13. `input` 和 `select` 参数只能使用 String 或 Number。
14. Number 参数的默认值和所有可选值必须是合法数字。

配置错误时应给出具体位置，例如：

```text
Rewrite 第 18 行：未定义的参数 ${price2}
Rewrite 第 21 行：正则 item 只有 2 个捕获组，不能引用 ${item.3}
Rewrite 第 25 行：http-request 阶段不能引用 ${response.status}
```

## 18. 匹配阶段

### 18.1 Request Rewrite

请求阶段可以直接使用：

```text
${url}
${request.method}
${request.header['name']}
插件参数
请求条件产生的正则捕获结果
```

### 18.2 Response Rewrite

响应阶段可以使用：

```text
${url}
${request.method}
${request.header['name']}
${response.status}
${response.header['name']}
插件参数
URL、请求 Header、响应 Header 条件产生的正则捕获结果
```

Response Rewrite 第一版在收到响应 Header 后完成匹配：

1. 使用原始 Request URL 的 Host 直接取得 response Exact Host 数组。
2. 对原 fallback 派生的 Host Prefix、Host Suffix 分组做字符串预筛，只取得当前 Host 命中的数组。
3. 加入无法安全提取任何 Host 固定片段的 response Pure Fallback 数组。
4. 按配置 `order` 多路合并这些有序数组。
5. 使用完整的 request/response MatchContext 判断条件并产生捕获。

第一版不在 Request 阶段做 Response 条件三态预筛，避免额外保存候选状态和捕获。

## 19. 兼容建议

现有 Rewrite 语法继续保留：

```ini
^https://example.com reject-dict
^https://example.com 302 https://new.example.com
```

新语法通过行首阶段和 `if`、`then` 识别：

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then reject(type="dict")
```

旧语法和新语法可以同时存在，由解析器分别处理。不建议自动改写用户的旧配置。

## 20. 已确认事项

### 20.1 已确认

#### 1. 不支持 `||` 分支中的 `as` 捕获

`as` 只能声明在整条表达式所有成功路径都必须经过的匹配条件上。

允许：

```ini
http-request if ${url} ~= /^https:\/\/example\.com\/item\/(\d+)/ as item && ${request.method} == "GET" then request.header.set(name="X-Item", value="${item.1}")
```

不允许：

```ini
http-request if ${url} ~= /^https:\/\/a\.example\.com\/(\d+)/ as item || ${url} ~= /^https:\/\/b\.example\.com/ then request.header.set(name="X-Item", value="${item.1}")
```

原因是第二个分支成功时没有产生 `item`，`${item.1}` 将没有确定值。

#### 4. 所有匹配的 Rewrite 按配置顺序执行

不再采用“只执行第一条匹配规则”的方式。处于同一阶段、条件匹配成功的 Rewrite 全部按照它们在配置文件中的先后顺序执行。

例如：

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.header.set(name="X-Value", value="first")
http-request if ${url} ~= /\/api\// then request.header.set(name="X-Value", value="second")
```

请求 `https://example.com/api/user` 会依次执行两条 Rewrite，因此最终 `X-Value` 为：

```text
second
```

#### 5. 动作管道中的某一步失败后继续执行

同一条 Rewrite 中的 action 按照 `|` 从左到右执行。某个 action 运行失败时：

1. 保留之前已经完成的修改。
2. 跳过失败的 action。
3. 记录该 action 的运行错误。
4. 继续执行后续 action。

例如：

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.header.set(name="X-A", value="1") | request.body.mock(type="json", file="missing.json") | request.header.set(name="X-B", value="2")
```

如果 `missing.json` 不存在，`request.body.mock(...)` 执行失败，但 `X-A` 和 `X-B` 仍然都会被设置。

参数名错误、参数类型错误、正则无法编译等配置错误应在加载配置时拒绝整条 Rewrite，不能作为运行时失败继续执行。

#### 6. 新旧 Rewrite 不区分优先级

新旧 Rewrite 只是语法不同，解析后进入同一个规则序列。所有匹配的规则统一按照配置文件中的先后顺序执行。

例如：

```ini
^https://example\.com header-add X-Order old
http-request if ${url} ~= /^https:\/\/example\.com/ then request.header.set(name="X-Order", value="new")
```

两条规则都会执行。因为新语法规则在后面，最终 `X-Order` 为：

```text
new
```

如果交换两条规则的位置，最终值就是 `old`。解析器不能因为语法新旧而改变规则顺序。

#### 7. URL rewrite 保持当前正则范围替换行为

`url.replace(...)`、`redirect(...)` 保持当前 `header`、`302`、`307` 的 URL 替换行为：

1. 将完整 URL 作为正则替换的输入。
2. 只替换正则实际命中的范围。
3. 保留未命中的 URL 内容。

例如：

```ini
http-request if ${url} ~= /^http:\/\/example\.com/ then url.replace(pattern=/^http:\/\/example\.com/, replacement="https://api.example.com")
```

输入：

```text
http://example.com/item/123?region=CN
```

最终 URL：

```text
https://api.example.com/item/123?region=CN
```

只有当正则匹配整个 URL 时，才会替换整个 URL。

#### 8. 不允许一条 Rewrite 同时修改请求和响应

`http-request` 只能执行请求阶段 action，`http-response` 只能执行响应阶段 action。

以下写法非法：

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.header.set(name="X-Test", value="1") | response.header.set(name="X-Test", value="1")
```

需要分别写成两条 Rewrite：

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.header.set(name="X-Test", value="1")
http-response if ${url} ~= /^https:\/\/example\.com/ then response.header.set(name="X-Test", value="1")
```

`response.body.mock(...)` 是一个例外：它虽然生成响应，但行为是在请求阶段直接短路并返回 Mock 响应，因此只能用于 `http-request`。

#### 9. 第一阶段不纳入 Body 条件匹配

第一阶段的 `if` 条件不支持读取或匹配 request Body、response Body。

以下变量和条件不纳入：

```text
${request.body}
${response.body}
${request.json['path']}
${response.json['path']}
```

这不影响 Body action。`request.body.replace(...)`、`response.body.replace(...)`、JSON action 和 Mock Body action 仍然保留。

### 20.2 补充确认事项

#### 2. 可选捕获组未命中时的处理

例如：

```ini
http-request if ${url} ~= /^https:\/\/example\.com\/item(?:\/(\d+))?/ as item then request.header.set(name="X-Item", value="${item.1}")
```

正则可以匹配以下两个 URL：

```text
https://example.com/item/123
https://example.com/item
```

第一个 URL 中 `${item.1}` 是 `"123"`；第二个 URL 虽然整体正则匹配成功，但第 1 个可选捕获组没有值。

采用以下规则：

1. `${item.1}` 解析失败，不能静默替换成空字符串。
2. 将引用 `${item.1}` 的 action 视为运行失败。
3. 跳过当前 action 并记录错误。
4. 按照第 5 点的规则继续执行后续 action。
5. 第一阶段不增加默认值表达式语法。

例如：

```ini
http-request if ${url} ~= /^https:\/\/example\.com\/item(?:\/(\d+))?/ as item then request.header.set(name="X-Item", value="${item.1}") | request.header.set(name="X-Matched", value="true")
```

请求 `https://example.com/item` 时，第一个 action 因 `${item.1}` 没有值而跳过，第二个 action 继续执行，最终只会设置：

```text
X-Matched: true
```

这样与已经确定的“单个 action 失败后继续执行”保持一致，也不需要为少数情况增加新的默认值语法。

#### 3. 支持反引号原始字符串

反引号原始字符串用于直接书写 JSON、HTML 等包含大量双引号和反斜杠的内容。

例如需要生成以下固定 JSON：

```json
{"code":0,"message":"a,b=c"}
```

使用普通双引号字符串时，JSON 内部的双引号都必须写成 `\"`：

```ini
response.body.mock(type="json", data="{\"code\":0,\"message\":\"a,b=c\"}", status=200)
```

使用反引号原始字符串时，可以直接照原内容书写：

```ini
response.body.mock(type="json", data=`{"code":0,"message":"a,b=c"}`, status=200)
```

两种写法最终生成的 Body 完全相同：

```json
{"code":0,"message":"a,b=c"}
```

原始字符串中的所有内容都按字面量处理，不执行 `${...}` 变量替换。假设插件参数 `${price}` 的值是 `9.99`：

```ini
data=`{"text":"${price}"}`
```

最终内容仍然是：

```text
{"text":"${price}"}
```

如果需要变量替换，必须使用普通双引号字符串：

```ini
data="{\"text\":\"${price}\"}"
```

最终内容为：

```json
{"text":"9.99"}
```

因此反引号原始字符串只解决“固定复杂字符串难以转义”的问题，不用于动态模板。第一阶段正式支持这种字符串类型。
