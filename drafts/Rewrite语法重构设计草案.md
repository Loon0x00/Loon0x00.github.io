# Rewrite 语法重构设计草案

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
request
response
```

示例：

```ini
request if ${url} ~= /^https:\/\/api\.example\.com/ then request.header.set("X-Loon", "matched")
```

多个动作使用 `|` 连接，并按照从左到右的顺序执行：

```ini
request if ${url} ~= /^https:\/\/api\.example\.com/ then request.header.set("X-Loon", "matched") | request.header.del("Cookie")
```

## 4. 条件表达式

### 4.1 比较操作符

```text
==     精确相等
~=     正则匹配
```

精确匹配：

```ini
request if ${request.method} == "POST" then request.header.set("X-Method", "POST")
```

正则匹配：

```ini
response if ${response.header['Content-Type']} ~= /^application\/json(?:;|$)/i then response.header.set("X-JSON", "true")
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
request if ${request.method} == "POST" && (${request.header['X-Region']} == "CN" || ${request.header['X-Region']} == "HK") then request.header.set("X-Matched", "true")
```

优先级规定为：

```text
比较操作符 > && > ||
```

包含两个及以上直接条件的显式条件组会保留括号，保证配置再次进入 UI
编辑时仍恢复成用户原来的分组。只包含一个条件的冗余括号会自动省略：

```text
A || (B && C)  → 保持 A || (B && C)
A && (B)       → 输出 A && B
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

除 Action 自带正则的 `RegexReplacement` 参数允许局部 `$n` 外，
Rewrite 的通用动态值不再引入其他写法，例如：

```text
${argument.price}
arg.price
match.item.1
{price}
```

现有插件 Script 中的 `{price}` 继续按旧语法处理；新的 `if/then` Rewrite
通用变量只识别 `${price}`。
`$1` 不是通用动态值，只能在 Header/Body Replace 的替换参数中引用该
Action 自带正则的捕获组。

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
request if ${url} ~= /^https:\/\/api\.example\.com/ then request.header.set("X-Matched", "true")
```

### 6.2 请求 Header

```ini
request if ${request.header['X-Region']} == "CN" then request.header.set("X-Country", "China")
```

Header 名称查找不区分大小写：

```text
${request.header['content-type']}
${request.header['Content-Type']}
```

以上两个表达式引用同一个 Header。

### 6.3 响应 Header 和状态码

```ini
response if ${response.status} == 200 && ${response.header['Content-Type']} ~= /^application\/json/i then response.header.set("X-Matched", "true")
```

请求阶段不能引用尚未产生的响应字段：

```ini
# 非法
request if ${response.status} == 200 then request.header.set("X-Test", "true")
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
response if ${enabled} == true && ${level} == 2 && ${request.header['X-Region']} == ${region} then response.json.replace("data.price", ${price})
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

旧版插件未声明 `type` 时保持原有行为：`input`、`select` 按 String
解析，`switch` 按 Boolean 解析。`number`、`string` 不能作为独立位置参数，
值类型必须通过 `type=number` 或 `type=string` 声明。

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
request if ${url} ~= /^https:\/\/api\.shop\.com\/item\/(\d+)\?price=([^&]+)/ as item then request.header.set("X-Item-ID", "${item.1}")
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
request if ${request.header['X-Product']} ~= /^([A-Z]+)-(\d+)$/ as product then request.header.set("X-Product-Type", "${product.1}") | request.header.set("X-Product-ID", "${product.2}")
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
request if (${request.method} == "GET" || ${request.method} == "POST") && ${url} ~= /item\/(\d+)/ as item then request.header.set("X-Item", "${item.1}")
```

禁止：

```ini
request if ${url} ~= /item\/(\d+)/ as item || ${request.header['X-Debug']} == "true" then request.header.set("X-Item", "${item.1}")
```

禁止示例可能仅通过 `X-Debug == "true"` 使条件成立，此时正则没有匹配，`${item.1}` 不存在。第一阶段不允许将未定义的捕获结果按 null 或空字符串处理。

### 8.4 条件捕获与 Action 捕获

条件正则和 Action 自带正则使用两套边界明确的捕获语法：

1. `if` 中正则匹配的结果必须通过 `as` 命名，使用 `${名称.序号}` 引用。
2. Action 参数中自带的正则不使用 `as`，仅在该 Action 的替换参数中使用 `$0`、`$1` 至 `$n`。
3. `$n` 不是 Rewrite 变量，不能跨 Action 使用，也不能用于没有自带正则的 Action。
4. `${名称.0}` 和 `$0` 都表示完整匹配，但前者属于命名的条件正则，后者属于当前 Action 自带的正则。

例如：

```ini
request if ${url} ~= /^https:\/\/old\.example\.com(\/.*)$/ as item then url.replace("https://new.example.com${item.1}")
```

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.body.replace(/price=(\d+)/, "amount=$1")
```

第一条配置中的 `${item.1}` 来自 `if` 条件；第二条配置中的 `$1` 来自
`request.body.replace` 的第一个参数。`url.replace("$1")` 是非法配置。

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
request if ${enabled} == true && ${url} ~= /^https:\/\/api\.shop\.com\/item\/(\d+)/ as item && ${request.header['X-Region']} == ${region} then redirect(302, "https://m.shop.com/item/${item.1}?price=${price}&region=${region}")
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
data.price
hello world
```

必须写成：

```text
"data.price"
"hello world"
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
9.99      数字
"9.99"    字符串
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
request if ${url} ~= ${urlPattern} then request.header.set("X-Matched", "true")
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
request if ${url} ~= /^https:\/\/example\.com/ then request.header.set("X-Info", "price=\"${price}\", region=\"${region}\"")
```

假设插件参数为：

```ini
[Argument]
price = input,9.99,type=number
region = select,"CN","US"
```

其中：

1. `"..."` 外层双引号用于界定整个配置字符串。
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
request.header.set("X-Template", "literal \${price}")
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
request.header.set("X-Origin", "UA=${request.header['User-Agent']}")
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
response if ${url} ~= /^https:\/\/api\.example\.com/ then response.body.mock("json", `{"code":0,"message":"a,b=c","data":{"price":9.99}}`, 200)
```

需要动态变量时使用普通双引号模板字符串：

```ini
response if ${url} ~= /^https:\/\/api\.example\.com\/item\/(\d+)/ as item then response.body.mock("json", "{\"code\":0,\"price\":${price},\"item\":\"${item.1}\"}", 200)
```

## 14. 动作参数

动作参数统一使用位置参数：

```text
action(value, value)
```

参数按照 Action 方法声明中的顺序填写，不允许填写参数名称：

```text
# 合法
redirect(302, "https://example.com")

# 非法
redirect(status=302, location="https://example.com")
```

可选参数只能从最右侧开始省略。已经发布的方法参数顺序不得调整；
新增可选参数只能追加在方法末尾。

### Action 方法声明

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

声明中的 `[...]` 表示尾部可选参数，不是配置中需要填写的字符。
`RegexReplacement` 在配置中仍然使用字符串形式，但其中的 `$0` 至 `$n`
会引用同一个 Action 的正则匹配结果。

### 批量数组参数

Header 修改、Body 正则替换和 JSON 修改 Action 支持使用数组一次声明多组操作。
数组参数会保留在配置和可视化编辑器中；运行时保存为单条批量指令，执行阶段按照
数组下标逐项处理，并严格保持原顺序。例如：

```ini
request if ${url} ~= /api/ then request.json.replace(["key1", "key2"], ["value1", "value2"])
```

等价于：

```ini
request if ${url} ~= /api/ then request.json.replace("key1", "value1") | request.json.replace("key2", "value2")
```

这里的“等价”指执行结果和错误隔离语义一致。实现不会持久化展开后的多条 Action；
同一个 JSON 批量 Action 会共享一次外层 Handler 回调和同一棵可变 JSON 容器。
旧语法一行中连续声明的同类型操作也会在运行时自动合并，因此无需为了获得执行
优化而修改旧插件的保存格式。

支持数组参数的 Action：

```text
request.header.add
request.header.set
request.header.del
request.header.replace
response.header.add
response.header.set
response.header.del
response.header.replace
request.body.replace
response.body.replace
request.json.add
request.json.delete
request.json.replace
response.json.add
response.json.delete
response.json.replace
```

使用规则：

1. 原有单值写法继续有效。
2. 同一个 Action 使用批量语法时，所有参数都必须写成数组。
3. 同一个 Action 的所有数组长度必须一致，并按相同下标配对。
4. 数组不能为空，不支持嵌套数组。
5. 每个数组元素仍需满足对应参数的 String、Regex、RegexReplacement 或 Any 类型。
6. JSON Path 数组中的每个元素都会分别进行路径合法性校验。

示例：

```ini
request if ${url} ~= /api/ then request.header.del(["Cookie", "Referer"])
request if ${url} ~= /api/ then request.header.set(["X-A", "X-B"], ["1", "2"])
request if ${url} ~= /api/ then request.header.replace(["X-A", "X-B"], [/old-a/, /old-b/i], ["new-a", "new-b"])
response if ${url} ~= /api/ then response.body.replace([/false/, /disabled/], ["true", "enabled"])
response if ${url} ~= /api/ then response.json.add(["data.a", "data.b"], [1, true])
response if ${url} ~= /api/ then response.json.delete(["data.ad", "data.tracking"])
```

以下写法非法：

```ini
# 单值和数组混用
request.json.replace(["key1", "key2"], "value")

# 数组长度不同
request.header.set(["X-A", "X-B"], ["1"])

# 空数组或嵌套数组
request.header.del([])
request.json.replace(["key"], [[1, 2]])
```

### 14.1 URL 修改

#### `url.replace`

对应当前 `header`：

```ini
request if ${url} ~= /^http:\/\/example\.com(\/.*)$/ as item then url.replace("https://example.com${item.1}")
```

参数：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `replacement` | String | 是 | 替换内容，允许使用 `${...}`，不允许使用 `$n` |

`url.replace` 不再重复配置正则。IF 中必须且只能有一个不在 OR
分支中的 `${url} ~= /.../` 条件，并使用它作为 URL 替换范围：

1. 必须存在一个所有成功路径都会经过的 URL 正则条件。
2. 该条件不能位于 `||` 的可选分支中。
3. 不能同时存在多个必选 URL 正则。
4. 需要使用捕获结果时，必须在条件后声明 `as`，并使用
   `${名称.0}`、`${名称.1}` 至 `${名称.n}`。
5. `url.replace` 的参数中出现 `$0` 至 `$n` 时直接校验失败。

例如：

```ini
request if ${url} ~= /^https:\/\/old\.example\.com(\/.*)$/ as urlMatch then url.replace("https://new.example.com${urlMatch.1}")
```

输入：

```text
https://old.example.com/api/user
```

最终 URL：

```text
https://new.example.com/api/user
```

### 14.2 重定向

#### `redirect`

对应当前 `302`、`307`：

```ini
request if ${url} ~= /^https:\/\/old\.example\.com\/item\/(\d+)/ as item then redirect(302, "https://new.example.com/item/${item.1}")
```

```ini
request if ${url} ~= /^https:\/\/old\.example\.com/ then redirect(307, "https://new.example.com")
```

参数：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `status` | Number | 是 | 当前只允许 `302`、`307` |
| `location` | String | 是 | URL 正则命中范围的替换内容，允许使用 `${...}`，不允许使用 `$n` |

为保持当前 `302`、`307` 的行为，`redirect(...)` 使用规则中唯一的必选 `${url} ~= /.../` 条件作为替换正则，在完整 URL 上只替换该正则命中的范围，未命中的部分继续保留。
需要引用该条件的捕获结果时，同样必须声明 `as` 并使用 `${名称.n}`。

因此使用 `redirect(...)` 时：

1. 必须存在一个所有成功路径都会经过的 `${url} ~= /.../` 条件。
2. 该条件不能位于 `||` 的可选分支中。
3. 如果存在多个必选 URL 正则而无法确定替换依据，则配置无效。

例如：

```ini
request if ${url} ~= /^http:\/\/example\.com/ then redirect(302, "https://api.example.com")
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

自定义 Reject 与四种固定内容 Reject 使用不同方法，方法名直接表达响应类型：

| 当前 action | 新 action | 响应内容 |
|---|---|---|
| `reject` | `reject(404)` | 404、空 Body |
| `reject-200` | `reject(200)` | 200、空 Body |
| `reject-img` | `reject_img(200)` | 200、1×1 GIF |
| `reject-dict` | `reject_dict(200)` | 200、`{}` |
| `reject-array` | `reject_array(200)` | 200、`[]` |
| `reject-video` | `reject_video(200)` | 200、空白视频 |

示例：

```ini
request if ${url} ~= /^https:\/\/example\.com\/ads/ then reject_dict(200)
request if ${url} ~= /^https:\/\/example\.com\/blocked/ then reject(451, "Unavailable for legal reasons")
```

参数：

| 参数 | 类型 | 必填 | 允许值 |
|---|---|---|---|
| `status` | Number | 是 | `100...599` 范围内的整数 |
| `body` | String | 否 | 仅 `reject` 支持；自定义 UTF-8 响应文本，省略表示空 Body |

`reject_img`、`reject_dict`、`reject_array`、`reject_video` 只接收状态码，
分别固定返回 GIF、JSON 对象、JSON 数组和空白视频，并设置对应的 Content-Type。
`reject` 的第二个参数是普通自定义文本；例如 `reject(200, "{}")` 返回的是
`text/plain`，若需要 JSON Content-Type，应使用 `reject_dict(200)`。

### 14.4 请求 Header

#### `request.header.add`

对应当前 `header-add`：

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.header.add("X-Loon", "true")
```

#### `request.header.set`

对应当前 `header-replace`：

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.header.set("User-Agent", "Loon")
```

#### `request.header.del`

对应当前 `header-del`：

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.header.del("Cookie")
```

#### `request.header.replace`

对应当前 `header-replace-regex`：

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.header.replace("User-Agent", /iPhone OS (\d+)/, "iPhone OS $1")
```

参数：

| action | 参数 |
|---|---|
| `request.header.add` | `String, String` |
| `request.header.set` | `String, String` |
| `request.header.del` | `String` |
| `request.header.replace` | `String, Regex, RegexReplacement` |

当前实现中 `header-add` 和 `header-replace` 最终都会设置对应 Header；新语法暂时保留 `add`、`set` 两个名称，以保持配置意图。

### 14.5 响应 Header

#### `response.header.add`

对应当前 `response-header-add`：

```ini
response if ${url} ~= /^https:\/\/example\.com/ then response.header.add("X-Loon", "true")
```

#### `response.header.set`

对应当前 `response-header-replace`：

```ini
response if ${url} ~= /^https:\/\/example\.com/ then response.header.set("Cache-Control", "no-cache")
```

#### `response.header.del`

对应当前 `response-header-del`：

```ini
response if ${url} ~= /^https:\/\/example\.com/ then response.header.del("Set-Cookie")
```

#### `response.header.replace`

对应当前 `response-header-replace-regex`：

```ini
response if ${url} ~= /^https:\/\/example\.com/ then response.header.replace("Content-Type", /^(.+); charset=.+$/i, "$1")
```

参数：

| action | 参数 |
|---|---|
| `response.header.add` | `String, String` |
| `response.header.set` | `String, String` |
| `response.header.del` | `String` |
| `response.header.replace` | `String, Regex, RegexReplacement` |

### 14.6 Body 正则替换

#### `request.body.replace`

对应当前 `request-body-replace-regex`：

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.body.replace(/"price":\s*([0-9.]+)/, "\"originalPrice\":$1")
```

#### `response.body.replace`

对应当前 `response-body-replace-regex`：

```ini
response if ${url} ~= /^https:\/\/example\.com/ then response.body.replace(/"enabled":\s*(false)/, "\"enabled\":$1")
```

参数：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `pattern` | Regex | 是 | Body 匹配正则 |
| `replacement` | RegexReplacement | 是 | 替换内容；`$0` 表示完整匹配，`$1` 至 `$n` 表示当前 Action 正则的捕获组，同时允许使用 `${...}` |

`$n` 只在 Header/Body Replace 的 `RegexReplacement` 参数中具有捕获含义。
其他 String 参数中的 `$n` 不会引用 Action 正则。

### 14.7 请求 JSON

#### `request.json.add`

对应当前 `request-body-json-add`：

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.json.add("data.price", ${price})
```

#### `request.json.delete`

对应当前 `request-body-json-del`：

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.json.delete("data.ads")
```

#### `request.json.replace`

对应当前 `request-body-json-replace`：

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.json.replace("data.price", ${price})
```

#### `request.json.jq`

对应当前 `request-body-json-jq`：

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.json.jq(".data.ads = []")
```

#### `request.json.jq_file`

从插件资源文件读取 JQ：

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.json.jq_file("request-filter.jq")
```

参数：

| action | 参数 |
|---|---|
| `request.json.add` | `String, Any` |
| `request.json.delete` | `String` |
| `request.json.replace` | `String, Any` |
| `request.json.jq` | `String`，内联 JQ |
| `request.json.jq_file` | `String`，插件资源文件 |

### 14.8 响应 JSON

#### `response.json.add`

对应当前 `response-body-json-add`：

```ini
response if ${url} ~= /^https:\/\/example\.com/ then response.json.add("data.price", ${price})
```

#### `response.json.delete`

对应当前 `response-body-json-del`：

```ini
response if ${url} ~= /^https:\/\/example\.com/ then response.json.delete("data.ads")
```

#### `response.json.replace`

对应当前 `response-body-json-replace`：

```ini
response if ${url} ~= /^https:\/\/example\.com/ then response.json.replace("data.price", ${price})
```

#### `response.json.jq`

对应当前 `response-body-json-jq`：

```ini
response if ${url} ~= /^https:\/\/example\.com/ then response.json.jq(".data.ads = []")
```

#### `response.json.jq_file`

从插件资源文件读取 JQ：

```ini
response if ${url} ~= /^https:\/\/example\.com/ then response.json.jq_file("response-filter.jq")
```

参数：

| action | 参数 |
|---|---|
| `response.json.add` | `String, Any` |
| `response.json.delete` | `String` |
| `response.json.replace` | `String, Any` |
| `response.json.jq` | `String`，内联 JQ |
| `response.json.jq_file` | `String`，插件资源文件 |

### 14.9 Mock 请求 Body

#### `request.body.mock`

对应当前 `mock-request-body`：

直接提供数据：

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.body.mock("json", "{\"price\":${price}}")
```

#### `request.body.mock_file`

从文件读取：

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.body.mock_file("json", "request_body.json")
```

Base64 数据：

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.body.mock("png", "iVBORw0KGgo...", true)
```

### 14.10 Mock 响应 Body

#### `response.body.mock`

对应当前 `mock-response-body`：

该 Action 配置为 `response`。Matcher 编译时检测到 Mock Action 后，只把这条
Response Rewrite 放入 Request 索引，使其在请求发往上游前直接返回模拟响应。
该 Rewrite 不再进入 Response 索引，因此模拟响应不会重复匹配同一条配置。

直接提供数据：

```ini
response if ${url} ~= /^https:\/\/example\.com/ then response.body.mock("json", "{\"price\":${price}}", 200)
```

#### `response.body.mock_file`

从文件读取：

```ini
response if ${url} ~= /^https:\/\/example\.com/ then response.body.mock_file("json", "response_body.json", 200)
```

Base64 数据：

```ini
response if ${url} ~= /^https:\/\/example\.com/ then response.body.mock("png", "iVBORw0KGgo...", 200, true)
```

Mock Body 方法参数顺序：

| 方法 | 参数顺序 |
|---|---|
| `request.body.mock` | 内容类型、内联 Body、可选 Base64 |
| `request.body.mock_file` | 内容类型、资源文件、可选 Base64 |
| `response.body.mock` | 内容类型、内联 Body、可选状态码、可选 Base64 |
| `response.body.mock_file` | 内容类型、资源文件、可选状态码、可选 Base64 |

Response 状态码默认 `200`，Base64 默认 `false`。需要填写 Base64 时必须先填写状态码，例如：

```ini
response.body.mock("png", "iVBORw0KGgo...", 200, true)
```

一条 Rewrite 只能包含一个 `response.body.mock` 或
`response.body.mock_file`，并且只能与 `response.header.*` 组合。Header
Action 可以位于 Mock 前后；执行时先生成 Mock 响应，再按配置顺序执行全部
Header Action。

由于包含 Mock 的规则在 Request 索引中提前匹配，其 `if` 不能使用
`${response.status}` 或 `${response.header['name']}`。Mock Action 自身的参数
同样不能引用这些尚未生成的 Response 变量。

所有 Header Action 完成后，运行时会删除 `Transfer-Encoding`，并按照最终
Body 字节数重新写入唯一且正确的 `Content-Length`。

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
| 1 | `header` | `if` 保留旧 URL 正则，Action 转为 `url.replace("value")` |
| 2 | `302` | `redirect(302, "url")` |
| 3 | `reject` | `reject(404)` |
| 4 | `307` | `redirect(307, "url")` |
| 5 | `reject-200` | `reject(200)` |
| 6 | `reject-img` | `reject_img(200)` |
| 7 | `reject-dict` | `reject_dict(200)` |
| 8 | `reject-array` | `reject_array(200)` |
| 9 | `reject-video` | `reject_video(200)` |
| 10 | `header-del` | `request.header.del("name")` |
| 11 | `header-replace` | `request.header.set("name", "value")` |
| 12 | `header-add` | `request.header.add("name", "value")` |
| 13 | `header-replace-regex` | `request.header.replace("name", /regex/, "value")` |
| 14 | `request-body-replace-regex` | `request.body.replace(/regex/, "value")` |
| 15 | `mock-request-body` | `request.body.mock("type", "value")` |
| 16 | `response-header-del` | `response.header.del("name")` |
| 17 | `response-header-replace` | `response.header.set("name", "value")` |
| 18 | `response-header-add` | `response.header.add("name", "value")` |
| 19 | `response-header-replace-regex` | `response.header.replace("name", /regex/, "value")` |
| 20 | `response-body-replace-regex` | `response.body.replace(/regex/, "value")` |
| 21 | `mock-response-body` | `response.body.mock("type", "value", 200)` |
| 22 | `request-body-json-add` | `request.json.add("path", "value")` |
| 23 | `request-body-json-del` | `request.json.delete("path")` |
| 24 | `request-body-json-replace` | `request.json.replace("path", "value")` |
| 25 | `response-body-json-add` | `response.json.add("path", "value")` |
| 26 | `response-body-json-del` | `response.json.delete("path")` |
| 27 | `response-body-json-replace` | `response.json.replace("path", "value")` |
| 28 | `request-body-json-jq` | `request.json.jq("jq")` |
| 29 | `response-body-json-jq` | `response.json.jq("jq")` |

旧 `header` 语法需要额外处理隐式捕获。例如：

```ini
^https:\/\/old\.example\.com\/(.*)$ header https://new.example.com/$1
```

旧语法中的 `$1` 来自行首 URL 正则。解析为 `LNRewrite` 时必须生成稳定的
捕获名称，并把 `$n` 转换为条件捕获变量：

```ini
request if ${url} ~= /^https:\/\/old\.example\.com\/(.*)$/i as urlMatch then url.replace("https://new.example.com/${urlMatch.1}")
```

转换规则如下：

1. 旧替换内容没有 `$n` 时不强制生成 `as`。
2. 出现 `$0` 至 `$n` 时，条件自动生成不与插件参数冲突的捕获名称。
3. `$0` 转为 `${名称.0}`，`$1` 至 `$n` 转为对应的 `${名称.n}`。
4. 捕获下标超过旧 URL 正则的捕获组数量时，旧配置解析失败。
5. `LNRewrite.newSyntaxText`、配置保存和插件详情展示统一输出转换后的新语法。
6. 旧语法只负责输入兼容；标准输出中不能重新出现旧式隐式 `$n`。

这里的转换只适用于旧 `header`、`302`、`307` 中由行首 URL 正则产生的
隐式捕获。旧 `header-replace-regex`、`request-body-replace-regex`、
`response-header-replace-regex` 和 `response-body-replace-regex` 自己携带
Action 正则，其中的 `$n` 继续按 Action 局部捕获输出，不转换为 `as` 变量。

动作名称不允许使用变量替换，位置参数不能重新填写参数名称：

```text
# 非法
${actionName}("data.price")
response.json.replace(path="data.price", value=9.99)
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
数组边界     [、]
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
[
]
```

这些字符出现在以下区域时只是普通内容：

1. 双引号字符串。
2. 反引号原始字符串。
3. 正则字面量。
4. Header 名称。
5. 变量表达式内部。

例如：

```ini
request.header.set("X-Test", "a,b=c | if then")
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
9.99), reject("dict"
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

插件配置编辑器允许用户直接填写插件参数名称，不在添加条件或 Action 时查询
`[Argument]` 是否已经存在；编辑期间只校验名称格式和使用类型。第 5 项的
存在性校验仍在插件正式加载和参数绑定阶段执行。

iOS 的本地 Rewrite 新增、编辑页面不提供“插件参数”变量来源，也不会使用临时
参数类型放宽 Parser 校验。本地配置没有 `[Argument]` 声明和值来源，因此条件和
Action 只能引用内置变量以及当前 Rewrite 的正则捕获变量。

配置错误时应给出具体位置，例如：

```text
Rewrite 第 18 行：未定义的参数 ${price2}
Rewrite 第 21 行：正则 item 只有 2 个捕获组，不能引用 ${item.3}
Rewrite 第 25 行：request 阶段不能引用 ${response.status}
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
request if ${url} ~= /^https:\/\/example\.com/ then reject_dict(200)
```

旧语法和新语法可以同时存在，由解析器分别处理。旧语法只作为输入兼容；
Rewrite 的生成、保存和完整配置展示全部使用本文件定义的新语法。

开发阶段曾使用过的 `http-request`、`http-response`、`"empty"`、
`"image"`、`"json-object"` 和 `"json-array"` 尚未发布，
不纳入兼容范围。

## 20. 已确认事项

### 20.1 已确认

#### 1. 不支持 `||` 分支中的 `as` 捕获

`as` 只能声明在整条表达式所有成功路径都必须经过的匹配条件上。

允许：

```ini
request if ${url} ~= /^https:\/\/example\.com\/item\/(\d+)/ as item && ${request.method} == "GET" then request.header.set("X-Item", "${item.1}")
```

不允许：

```ini
request if ${url} ~= /^https:\/\/a\.example\.com\/(\d+)/ as item || ${url} ~= /^https:\/\/b\.example\.com/ then request.header.set("X-Item", "${item.1}")
```

原因是第二个分支成功时没有产生 `item`，`${item.1}` 将没有确定值。

#### 4. 所有匹配的 Rewrite 按配置顺序执行

不再采用“只执行第一条匹配规则”的方式。处于同一阶段、条件匹配成功的 Rewrite 全部按照它们在配置文件中的先后顺序执行。

例如：

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.header.set("X-Value", "first")
request if ${url} ~= /\/api\// then request.header.set("X-Value", "second")
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
request if ${url} ~= /^https:\/\/example\.com/ then request.header.set("X-A", "1") | request.body.mock_file("json", "missing.json") | request.header.set("X-B", "2")
```

如果 `missing.json` 不存在，`request.body.mock(...)` 执行失败，但 `X-A` 和 `X-B` 仍然都会被设置。

参数名错误、参数类型错误、正则无法编译等配置错误应在加载配置时拒绝整条 Rewrite，不能作为运行时失败继续执行。

#### 6. 新旧 Rewrite 不区分优先级

新旧 Rewrite 只是语法不同，解析后进入同一个规则序列。所有匹配的规则统一按照配置文件中的先后顺序执行。

例如：

```ini
^https://example\.com header-add X-Order old
request if ${url} ~= /^https:\/\/example\.com/ then request.header.set("X-Order", "new")
```

两条规则都会执行。因为新语法规则在后面，最终 `X-Order` 为：

```text
new
```

如果交换两条规则的位置，最终值就是 `old`。解析器不能因为语法新旧而改变规则顺序。

#### 7. URL rewrite 保持当前正则范围替换行为

`url.replace(...)`、`redirect(...)` 保持当前 `header`、`302`、`307` 的 URL 替换行为。
两者都使用 `if` 中唯一的必选 URL 正则，不在 Action 中重复填写正则：

1. 将完整 URL 作为正则替换的输入。
2. 只替换正则实际命中的范围。
3. 保留未命中的 URL 内容。

例如：

```ini
request if ${url} ~= /^http:\/\/example\.com/ then url.replace("https://api.example.com")
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

`request` 只能执行请求阶段 action，`response` 只能执行响应阶段 action。

以下写法非法：

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.header.set("X-Test", "1") | response.header.set("X-Test", "1")
```

需要分别写成两条 Rewrite：

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.header.set("X-Test", "1")
response if ${url} ~= /^https:\/\/example\.com/ then response.header.set("X-Test", "1")
```

`response.body.mock(...)` 配置为 `response`，可以和
`response.header.*` 写在同一条 Rewrite。编译时该规则只进入 Request 索引，
运行时仍沿用 RejectRemote 提前短路并返回 Mock 响应。

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
request if ${url} ~= /^https:\/\/example\.com\/item(?:\/(\d+))?/ as item then request.header.set("X-Item", "${item.1}")
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
request if ${url} ~= /^https:\/\/example\.com\/item(?:\/(\d+))?/ as item then request.header.set("X-Item", "${item.1}") | request.header.set("X-Matched", "true")
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
response.body.mock("json", "{\"code\":0,\"message\":\"a,b=c\"}", 200)
```

使用反引号原始字符串时，可以直接照原内容书写：

```ini
response.body.mock("json", `{"code":0,"message":"a,b=c"}`, 200)
```

两种写法最终生成的 Body 完全相同：

```json
{"code":0,"message":"a,b=c"}
```

原始字符串中的所有内容都按字面量处理，不执行 `${...}` 变量替换。假设插件参数 `${price}` 的值是 `9.99`：

```ini
`{"text":"${price}"}`
```

最终内容仍然是：

```text
{"text":"${price}"}
```

如果需要变量替换，必须使用普通双引号字符串：

```ini
"{\"text\":\"${price}\"}"
```

最终内容为：

```json
{"text":"9.99"}
```

因此反引号原始字符串只解决“固定复杂字符串难以转义”的问题，不用于动态模板。第一阶段正式支持这种字符串类型。
