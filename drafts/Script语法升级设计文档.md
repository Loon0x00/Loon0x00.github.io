# Script 语法升级设计文档

## 1. 文档状态

- 状态：已完成共享 Parser、模型、Generator、匹配与执行接入；持续同步实现细节
- 日期：2026-08-13
- 最近同步：2026-08-28
- 范围：本地、远程和插件中的 Request、Response、Cron、Network Changed、Generic Script
- 目标：统一全部 Script 配置语法，并为 HTTP Script 增加多条件匹配
- 不涉及：JavaScript API、脚本返回结果、执行顺序、并发模型和 Rewrite Action 重构
- 本次同步：补充插件参数缺值、动态 option 默认回退和 Warn 日志规则

`looncore` 是 iOS、macOS、tvOS 共用代码。共享 Parser 和运行时接入的改动必须同时
分析并验证三个平台。

## 2. 已确认的设计原则

1. HTTP Script 只升级配置语法和条件匹配能力，原有执行时机保持不变。
2. Request Script 和 Response Script 继续按最终配置顺序选择第一条完整命中的规则。
3. Response Script 在请求阶段通过强制 URL Guard 提前筛选候选，在 Response Header 阶段使用原始 Status/Header 完成最终匹配。
4. 删除 OPTIONS 不执行 Script 的硬编码限制，是否匹配由配置条件决定。
5. Rewrite 对 Script 的禁用关系保持现有逻辑。
6. 本地、远程和插件 Script 使用同一套语法、Parser、默认值和校验规则。
7. 加载配置时不自动改写原文件，只有用户编辑并保存时输出标准新语法。
8. 所有类型统一使用 `script(...)`，其中只保存脚本路径和传给 `$argument` 的参数。
9. `enable`、`tag`、`img_url`、`timeout`、`requires_body` 等指令属性统一放在 `with` 中。
10. Cron、Network Changed 和 Generic Script 也升级为相同的 Action 与 `with` 结构，但各自触发方式保持不变。
11. 插件参数必须先完成声明和类型校验；已声明但没有实际值时，条件和 Cron 拒绝当前 Script，`enable`、`timeout`、`debug` 使用 Script 默认值并输出 Warn。

## 3. 统一语法总览

### 3.1 HTTP Script

```text
<request|response> if <condition> then script(<path> [, <argument>]) [with <options>]
```

是否等待 Body 由 `with requires_body=true` 控制；省略或设置为 `false` 时不等待 Body。

示例：

```ini
request if ${url} ~= /^https:\/\/api\.example\.com/i && ${request.method} == "POST" then script("request.js", "source=profile") with enable=${enabled}, tag="Request Script", img_url="request.system", timeout=20, requires_body=true
```

```ini
response if ${url} ~= /^https:\/\/api\.example\.com/i && ${request.header['Accept']} ~= /application\/json/i && ${response.status} == 200 && ${response.header['Content-Type']} ~= /application\/json/i then script("https://example.com/response.js", {${region}, ${level}}) with enable=${enabled}, tag="Response Script", timeout=20, requires_body=true
```

### 3.2 Cron Script

```text
cron <cron-expression> then script(<path> [, <argument>]) [with <options>]
```

固定 Cron：

```ini
cron "0 8 * * *" then script("cron.js") with enable=true, tag="Daily Task", timeout=300
```

插件动态 Cron：

```ini
cron ${cron} then script("cron.js", {${region}, ${level}}) with enable=${enabled}, tag="Plugin Cron", timeout=300
```

### 3.3 Network Changed Script

```text
network-changed then script(<path> [, <argument>]) [with <options>]
```

```ini
network-changed then script("network-changed.js", {${region}}) with enable=${enabled}, tag="Network Changed", timeout=30
```

### 3.4 Generic Script

```text
generic then script(<path> [, <argument>]) [with <options>]
```

```ini
generic then script("switch-node.js", {${region}, ${level}}) with enable=${enabled}, tag="Switch Node", img_url="arrow.triangle.swap.system", timeout=30
```

### 3.5 统一结构

五类 Script 最终都由三部分组成：

| 部分 | 职责 | 示例 |
|---|---|---|
| Trigger/Condition | 何时触发或是否命中 | `request if ...`、`cron "..."`、`generic` |
| Script Action | 脚本路径和 `$argument` | `script("a.js", {${region}})` |
| `with` | 这条 Script 指令自身的属性和执行配置 | `with enable=true, timeout=20, requires_body=true` |

## 4. Script Action

### 4.1 `script`

```text
script(<path> [, <argument>])
```

语义：

- 对 Request/Response Script，执行时机由 `with requires_body` 决定。
- 对 Cron、Network Changed、Generic Script，表示执行普通脚本。
- 第一个参数是本地文件名或远程 URL。
- 第二个参数可省略，或者是字符串参数、插件对象参数之一。

示例：

```ini
script("request.js")
script("request.js", "hello")
script("request.js", {${region}, ${level}})
```

### 4.2 Body 执行方式

所有脚本都使用 `script(...)`。Request/Response 是否等待 Body 由 `with` 配置：

```ini
request if <condition> then script("request.js") with requires_body=true
response if <condition> then script("response.js") with requires_body=true, binary_body_mode=true
```

- `requires_body=false` 或省略：保持现有 Header 时机执行。
- Request 的 `requires_body=true`：等待完整 Request Body 后执行。
- Response 的 `requires_body=true`：等待完整 Response Body 后执行。
- `binary_body_mode=true`：在 Body 可用时，按现有二进制模式提供给脚本。
- `binary_body_mode` 不隐式开启 `requires_body`，也不改变脚本执行时机。
- Cron、Network Changed 和 Generic 没有 HTTP Body，不能配置这两个字段。

旧 `requires-body=true` 和 `binary-body-mode=true` 分别映射到新 `with` 中对应的
snake_case 字段。

### 4.3 脚本路径

路径必须是非空固定字符串：

```ini
script("local.js")
script("folder/local.js")
script("https://example.com/script.js")
```

第一版不允许使用变量或模板动态改变脚本路径：

```ini
# 非法
script(${scriptPath})
script("${region}.js")
```

本地/远程识别、下载、缓存、文件编码转换和路径查找继续使用现有逻辑。

## 5. `$argument` 参数模型

### 5.1 基本原则

当前 JavaScript Bridge 有两种不同参数模型：

1. 直接参数保存为 `argumentStr`，运行时 `$argument` 是 String。
2. 插件参数保存为 `pluginArguments`，运行时 `$argument` 是 Object。

新语法必须保留该区别，不把字符串转换为对象，也不把插件对象参数当成
JavaScript 字面量在配置解析阶段求值。

### 5.2 不传参数

配置：

```ini
request if ${url} ~= /api/ then script("request.js")
```

脚本中：

```javascript
console.log($argument); // null
```

### 5.3 字符串参数

配置：

```ini
request if ${url} ~= /api/ then script("request.js", "hello")
```

运行时等价于：

```javascript
$argument = "hello";
```

脚本直接使用：

```javascript
console.log($argument);        // hello
console.log(typeof $argument); // string
```

多个业务值仍由字符串自身表达，例如查询字符串：

```ini
generic then script("tool.js", "region=CN&level=2")
```

```javascript
const params = Object.fromEntries(
  $argument.split("&").map(item => item.split("="))
);

console.log(params.region); // CN
console.log(params.level);  // 2
```

也可以使用 Raw String 传递 JSON 文本：

```ini
generic then script("tool.js", `{"region":"CN","level":2}`)
```

```javascript
const params = JSON.parse($argument);
```

字符串和 Raw String 都生成现有的 `argumentStr`。第一版不对字符串内容做 JSON、
URL Query 或其他业务解析。

### 5.4 插件对象参数

配置：

```ini
script("plugin.js", {${region}, ${level}, ${enabled}})
```

外层花括号明确表示最终生成 Object；其中每一项 `${name}` 表示选择并绑定一个插件
参数。Parser 根据变量名生成 Object Key，加载器使用插件当前绑定值生成 Object Value。

这里不是通用的 Object 字面量语法：配置中只写变量列表，不写 `key: value`，Object
的 Key 固定取插件变量名。

假设插件定义：

```ini
[Argument]
region = select,"CN","US",tag=地区
level = select,1,2,3,type=number,tag=等级
enabled = switch,true,tag=启用
```

运行时等价于：

```javascript
$argument = {
  region: "CN",
  level: 2,
  enabled: true
};
```

脚本中使用：

```javascript
console.log($argument.region);  // CN
console.log($argument.level);   // 2
console.log($argument.enabled); // true
```

参数值保持插件声明类型：

- `input` / `select` 默认是 String。
- `type=number` 是 Number。
- `switch` 是 Boolean。

### 5.5 插件对象参数规则

1. Object 中每一项必须是 `${name}` 形式的插件变量。
2. 变量必须在当前插件 `[Argument]` 中声明。
3. 同一个变量不能重复。
4. Object 不能为空；无参数时省略第二个参数。
5. Object 参数只允许用于插件 Script。
6. 本地 Script 和普通 Remote Script 没有插件参数作用域，不能使用该形式。
7. 不允许其中出现字符串、数字、Boolean、嵌套 Object 或请求变量。
8. 不允许将 `${url}`、`${request.method}` 或 Header 变量放入 Object 参数。
9. 变量的配置顺序用于标准输出；Object 字段的业务语义不依赖顺序。
10. `[Argument] name=input,tag=...` 和无默认选项的 `select` 是合法声明；若该参数只用于 Object 且没有实际值，对应字段使用 `null`。

合法：

```ini
script("plugin.js", {${region}, ${level}})
```

非法：

```ini
script("plugin.js", {})
script("plugin.js", {"CN", 2})
script("plugin.js", {${url}})
script("plugin.js", {${region}, ${region}})
```

### 5.6 两种参数互斥

第二个参数只能采用一种完整形式：

```ini
# String
script("a.js", "hello")

# Object
script("a.js", {${region}, ${level}})
```

不能在一次调用中同时指定字符串和插件对象，也不支持第三个参数：

```ini
# 非法
script("a.js", "hello", {${region}})
```

### 5.7 旧参数映射

| 旧语法 | 新语法 | `$argument` 类型 |
|---|---|---|
| 未填写 `argument` | `script("a.js")` | Null |
| `argument="hello"` | `script("a.js", "hello")` | String |
| `argument={region,level}` | `script("a.js", {${region}, ${level}})` | Object |

## 6. `with` 指令属性

### 6.1 语法

```text
with <name>=<value> [, <name>=<value> ...]
```

空格不影响解析：

```ini
with enable=${enabled}, tag="Script", timeout=20
with enable = ${enabled},tag = "Script",timeout = 20
```

标准输出统一不在 `=` 两侧添加空格，并在逗号后添加一个空格：

```ini
with enable=${enabled}, tag="Script", timeout=20
```

### 6.2 支持字段

| 字段 | 类型 | 默认值 | 旧字段 | 适用范围 |
|---|---|---:|---|---|
| `enable` | Boolean / 插件 Boolean | `true` | `enable`、`enabled` | 全部 Script |
| `tag` | String | 从路径派生 | `tag` | 全部 Script |
| `img_url` | String | 无 | `img-url` | 全部 Script |
| `timeout` | Number / 插件 Number 或数字 String | Request/Response 为 `20`，其他为 `300` | `timeout` | 全部 Script |
| `debug` | Boolean / 插件 Boolean | `false` | `debug` | 全部 Script |
| `requires_body` | Boolean | `false` | `requires-body` | 仅 Request/Response |
| `binary_body_mode` | Boolean | `false` | `binary-body-mode` | 仅 Request/Response |

示例：

```ini
request if ${url} ~= /api/ then script("request.js", {${region}}) with enable=${enabled}, tag="API Script", img_url="api.system", timeout=20, debug=true, requires_body=true, binary_body_mode=false
```

插件动态配置示例：

```ini
[Argument]
script_timeout = input, "20", tag=超时时间
script_debug = switch, false, true, tag=调试日志

[Script]
generic then script("tool.js") with timeout=${script_timeout}, debug=${script_debug}
```

### 6.3 字段约束

1. `with` 没有字段时整体省略。
2. 字段名称区分大小写，标准名称使用小写 snake_case。
3. 同一字段不能重复。
4. 未知字段必须报错，不能静默忽略。
5. `enable`、`debug`、`requires_body`、`binary_body_mode` 使用 Boolean；`enable` 和 `debug` 可引用插件 Boolean。
6. `timeout` 必须是大于 0 的有限 Number，也可引用插件 Number 或可严格解析为有限正数的 String。数字 String 只在 `timeout` 消费点转换，不改变 `$argument` 的值类型。
7. `tag` 和 `img_url` 使用双引号 String。
8. `requires_body` 和 `binary_body_mode` 只允许用于 Request/Response Script。
9. `requires_body` 只控制是否等待 Body，`binary_body_mode` 只控制 Body 的现有表示方式；两者互不隐式开启。
10. `enable`、`timeout`、`debug` 可以使用当前插件中符合要求的参数，例如 `${enabled}`、`${timeout}`、`${debug}`；`enable` 和 `debug` 仍必须是 Boolean/switch。
11. `tag`、`img_url`、`requires_body`、`binary_body_mode` 不接受变量或模板。

### 6.4 动态 option 缺值回退

以下规则只处理“插件参数已经在 `[Argument]` 中声明、类型符合字段要求，但当前没有
用户值或声明默认值”的情况。参数未声明或声明类型错误仍属于 Parser 错误，不能回退：

| 动态字段 | 缺少实际值时的结果 |
|---|---|
| `enable=${name}` | 使用 `true` |
| `timeout=${name}` | Request/Response 使用 `20`；Cron/Network Changed/Generic 使用 `300` |
| `debug=${name}` | 使用 `false` |

条件表达式和动态 Cron 必须有实际值，缺值时当前 Script 绑定失败。若同一参数同时用于
条件或 Cron 以及上述 option，则按必需参数处理，不能使用 option 默认值。插件 Object
`$argument` 中缺值的字段继续以 `null` 传入。

每个发生默认回退的 option 输出一条 Warn，包含插件 tag/URL、Script 名称、option、
插件参数名和最终默认值，例如：

```text
Use default plugin script option [tag=Example, url=https://example.com/example.plugin] script=Task, option=timeout, parameter=TIMEOUT, default=300
```

缺失的条件或 Cron 参数继续使用“跳过无效插件 Script 绑定”的 Warn，不影响同一插件中
后续合法 Script。新旧 Script 语法在解析后共用以上绑定规则。

### 6.5 标准输出顺序

用户保存后，`with` 字段按以下固定顺序输出：

```text
enable, tag, img_url, timeout, debug, requires_body, binary_body_mode
```

默认值允许省略：

```text
enable=true
debug=false
requires_body=false
binary_body_mode=false
```

`tag`、`img_url`、非默认 `timeout` 按用户配置保留。

## 7. HTTP 条件表达式

### 7.1 操作符

条件语法与新 Rewrite 的第一阶段条件保持一致：

```text
==    类型一致的精确相等
~=    正则查找匹配
&&    逻辑与
||    逻辑或
()    显式分组
```

优先级：

```text
比较 > && > ||
```

逻辑表达式使用短路求值。

### 7.2 可用变量

| 变量 | 类型 | Request | Response |
|---|---|---:|---:|
| `${url}` | String | 支持 | 支持 |
| `${request.method}` | String | 支持 | 支持 |
| `${request.header['name']}` | String 或缺失 | 支持 | 支持 |
| `${response.status}` | Number | 不支持 | 支持，Response Header 阶段求值 |
| `${response.header['name']}` | String 或缺失 | 不支持 | 支持，Response Header 阶段求值 |
| `${插件参数}` | String、Number、Boolean | 插件支持 | 插件支持 |

Header 名称查找不区分大小写。

### 7.2.1 Header 缺失和值类型

Request/Response Header 在存在时是 String，不存在时可以使用 `null` 判断：

```ini
request if ${request.header['X-Optional']} == null then script("missing-request.js")
response if ${url} ~= /\/api\// && null == ${response.header['X-Optional']} then script("missing-response.js")
```

存在但值为空的 Header 是空 String，不等于 `null`。Header 的 `==` 比较可以使用
String、Null、String 类型 Variable、Template 或 Raw String；`~=` 的右值使用 Regex。
Number、Boolean 不能直接与 Header 比较。

条件编辑 UI 中的名称含义：

- Variable：整个比较值来自 `${...}` 变量；
- Template：双引号字符串中包含固定文本和 `${...}` 变量替换；
- Raw String：反引号字符串，内容按字面量处理，不执行转义或变量替换；
- Raw Syntax：仅为 UI 的直接语法输入入口，不是核心 Parser 的正式值类型，保存时仍需
  通过正式 Parser 校验。

完整值类型和 UI 输入规则见《LNRewrite当前实现技术文档与代码审查》3.3 节。

### 7.3 Response Script 两阶段匹配

Response Script 支持 Response Status/Header 后，匹配拆分为两个阶段：

```text
Request 阶段       -> 使用 URL Guard 和已知请求变量筛选候选
Response Header 阶段 -> 使用原始 Response Status/Header 完整求值并选择第一条命中
```

Request 阶段对整个表达式进行三态求值：`true`、`false`、`unknown`。尚未产生的
Response 变量值为 `unknown`；只有结果为 `false` 的规则可以排除，`unknown` 规则保留
为候选。

为避免没有 URL 范围的规则使所有请求都保存 Request Body，每条 Response Script
必须具有强制 URL Guard。标准结构是：

```text
response if <url-guard> [&& <other-condition>] then script(...)
```

URL Guard 必须是整个条件成立的必要条件，而不只是表达式中出现过 `${url}`。允许：

```ini
response if ${url} ~= /\/api\// && ${response.status} == 200 then script("success.js")
response if (${url} ~= /\/v1\// || ${url} ~= /\/v2\//) && (${response.status} == 200 || ${response.header['X-Cache']} == "HIT") then script("api.js")
```

不允许：

```ini
# 没有 URL Guard
response if ${response.status} == 500 then script("error.js")

# URL 不是必要条件；URL 不匹配时仍可能因为 Status 成立
response if ${url} ~= /\/api\// || ${response.status} == 500 then script("error.js")
```

Request 阶段只有 URL Guard 成立的规则才可能进入候选集合。只要候选集合非空，就按
现有能力保存 Request Body，保证最终脚本仍可访问 `$request.body`。

如果按配置顺序已经能证明某条规则为 `true`，且它之前不存在 `unknown` 候选，可以在
Request 阶段直接确定并按现有流程预加载；否则推迟到 Response Header 阶段选择。

Response Header 到达后，使用原始响应快照完整计算候选条件：

```text
${response.status}       -> 原始 Response Status
${response.header[...]}  -> 原始 Response Header
```

Response Rewrite Action 对 Status/Header 的修改不反向影响 Script 条件结果。最终仍按
原配置顺序选择第一条完整结果为 `true` 的 Response Script。

### 7.4 正则

```ini
request if ${url} ~= /^https:\/\/api\.example\.com/i then script("request.js")
```

支持 flags：

```text
i    忽略大小写
m    多行模式
s    点号匹配换行
```

`~=` 是查找匹配。需要匹配完整字符串时必须显式使用 `^` 和 `$`。

旧 Script URL 正则默认忽略大小写，旧语法转换到统一模型时必须保留等价的 `i`
选项。新语法只使用正则字面量显式声明的 flags。

### 7.5 本次不支持

- Request/Response Body 内容条件。
- 正则 `as` 命名捕获及捕获结果参数。
- `!=`、`!~`、逻辑非、大小比较和集合操作符。
- 多条 HTTP Script 同时执行。

## 8. 各类型触发与执行语义

### 8.1 Request Script

```ini
request if ${url} ~= /api/ then script("request.js")
```

- 在现有 Request Script 匹配位置求值。
- 按最终配置顺序返回第一条完整命中的 Request Script。
- `requires_body=false` 或省略时，在现有 Request Header 时机执行。
- `requires_body=true` 时，在现有 Request Body 完整时机执行。

### 8.2 Response Script

```ini
response if ${url} ~= /api/ && ${response.status} == 200 then script("response.js") with requires_body=true
```

- Request 阶段先通过强制 URL Guard 和请求侧条件筛选候选，以便按需保存 Request Body。
- 条件不依赖 Response 字段且不存在更早的 `unknown` 候选时，可以提前确定并继续使用现有预加载流程。
- 其余候选在 Response Header 到达后，使用原始 Status/Header 完整求值。
- 最终按原配置顺序选择第一条完整命中的 Response Script。
- `requires_body=false` 或省略时，在现有 Response Header 时机执行。
- `requires_body=true` 时，在现有 Response Body 完整时机执行。
- Response Rewrite 对 Script 的禁用和覆盖关系保持不变。

Request Script 修改 URL 时，尽量保持现有逻辑：

1. Request 阶段已经提前确定 Response Script，或已有 Response 候选时，保留原结果，不使用新 URL 重建。
2. Request 阶段没有提前结果也没有候选，且 Request Script 确实修改了 URL，使用新 URL补做一次候选筛选。
3. 补匹配只替换匹配上下文中的 URL；Method、Request Header 和插件参数继续使用首次 Script 匹配快照。
4. 初次候选后即使 Request Script 修改 URL，最终求值仍使用该候选对应的初次 URL 快照。

### 8.3 Cron Script

```ini
cron "0 8 * * *" then script("cron.js")
```

- 继续使用现有五段或六段 Cron 表达式。
- 五段表达式继续在内部补秒字段。
- 到期的所有 Cron Script 按现有队列和并发逻辑执行。
- `cron ${cron}` 只允许引用插件中的 String 类型 Cron 参数。
- 插件动态 Cron 继续在参数绑定后校验。

### 8.4 Network Changed Script

```ini
network-changed then script("network.js")
```

- 继续在当前网络变化判定成立时触发。
- 同一次事件中，所有启用的 Network Changed Script 继续按现有循环执行。
- 不应用 HTTP Script 的“第一条命中”规则。

### 8.5 Generic Script

```ini
generic then script("tool.js")
```

- 继续作为用户从界面或既有调用入口主动执行的脚本。
- 每条 Generic Script 仍是独立的可选操作。
- 不自动执行，也不应用 HTTP Script 的“第一条命中”规则。

## 9. 第一条命中语义

第一条命中只适用于 HTTP Request/Response Script。Request Script 在 Request 阶段直接
完整求值：

```text
按最终配置顺序遍历当前阶段规则
  -> 求值完整条件
  -> 第一条为 true 的规则立即返回
  -> 后续同阶段规则不再求值
```

示例：

```ini
request if ${url} ~= /api/ && ${request.method} == "POST" then script("post.js")
request if ${url} ~= /api/ then script("fallback.js")
```

- POST `/api` 执行 `post.js`。
- GET `/api` 执行 `fallback.js`。

Request 和 Response 分别最多选择一条，两者互不占用对方的命中位置。

Response Script 即使分成候选筛选和最终求值，也必须保持原配置顺序。Request 阶段
遇到 `unknown` 时不能选择其后的 `true` 规则；可以将前面的 `unknown` 候选和第一条
确定为 `true` 的规则一并保留，并停止收集更后面的规则。Response Header 到达后从
候选列表头部开始完整求值，第一条为 `true` 的规则生效。

例如：

```ini
response if ${url} ~= /api/ && ${response.status} == 500 then script("error.js")
response if ${url} ~= /api/ then script("fallback.js")
```

Request 阶段第一条为 `unknown`，不能因为第二条已经为 `true` 就提前选择
`fallback.js`；最终必须根据原始 Response Status 决定。

Cron 和 Network Changed 按触发事件执行所有符合现有启用条件的脚本；Generic 由用户
选择某一条执行。

## 10. OPTIONS 请求

删除 HTTP/1、HTTPS、HTTP/2 中“OPTIONS 不参与 Script 匹配”的硬编码判断。

OPTIONS 与其他 Method 一样进入条件匹配：

```ini
request if ${request.method} == "OPTIONS" && ${url} ~= /api/ then script("options.js")
```

如果需要排除 OPTIONS，应显式限定允许的 Method：

```ini
request if ${request.method} ~= /^(GET|POST)$/ && ${url} ~= /api/ then script("request.js")
```

旧 URL-only Script 转换后不自动增加 Method 条件，因此升级后会匹配 OPTIONS。
这是删除硬编码限制后的预期兼容性变化。

## 11. Rewrite 与 Script 的关系

保持现有禁用逻辑：

1. Request 阶段出现终止响应 Action 时，禁用全部 Request/Response Script。
2. Request Body Rewrite 或 Request Body Mock 命中时，禁用 Request Script。
3. Response Body Rewrite 命中时，禁用 Response Script。
4. 仅修改 Request Header 的 Rewrite 不因为本次升级新增禁用行为。
5. Response Script 已提前确定或形成候选后，如果 Response Body Rewrite 按现有逻辑禁用它，继续清空提前结果和候选，不再最终执行。
6. Script 条件不能绕过 Rewrite 已经确定的禁用结果。

Rewrite 与 Script 的现有执行先后顺序不变。Request 条件和 Response 候选筛选读取
Request Rewrite 处理后的 URL、Method 和 Request Header；Response 最终条件读取原始
Response Status/Header。

## 12. 本地、远程和插件一致性

### 12.1 统一 Parser

以下来源进入同一个 Script Parser：

- 主配置 `[Script]`。
- `[Remote Script]` 下载的 Script 资源。
- 插件 `[Script]`。

来源差异只包括：

- 插件是否提供 `[Argument]` 类型和值。
- 来源标识和远程资源标识。
- Main App 是否保留原始配置行对象。

语法、字段名称、默认值、条件优先级和错误模型必须一致。

### 12.2 插件参数绑定

插件分两阶段处理：

1. Parser 使用参数类型表校验条件、插件对象参数、动态 Cron、动态 `enable`、动态 `timeout` 和动态 `debug`。
2. 加载器使用实际参数值生成不可变绑定快照。

Parser 阶段不使用默认值求值、不提前过滤动态 `enable`。加载器优先使用用户已保存值，
无保存值时才使用默认值；Tunnel 在绑定后过滤 `enable=false` 的 Script。旧插件未声明
`type` 的 `input` / `select` 值保持 String，仅当用于 `timeout` 时按数字 String 校验和转换。

`input` / `select` 允许不提供声明默认值。绑定时，条件和动态 Cron 引用的参数缺值会
拒绝当前 Script；动态 `enable`、`timeout`、`debug` 缺值分别回退到 `true`、当前
Script 类型的默认超时、`false`，并记录带插件来源的 Warn。纯 `$argument` Object
字段缺值保存为 `NSNull`。同一个参数被必需位置与 option 同时引用时，必需位置优先。

Tunnel 运行期间不访问插件 UI 参数对象。插件参数变化后通过现有配置重载发布新的
Script 配置快照。

Request、Response、Cron、Network Changed、Generic 和 iOS 手动执行都使用绑定后的
`pluginArguments` 快照；VPN 未运行时的手动执行也不能丢弃该参数。String `$argument`
与 Object `$argument` 按 `argumentKind` 区分，空 Object 不得覆盖 String 参数。

插件和 Remote Script 的解析/绑定 Warn 必须包含各自资源的 tag 或 URL、配置行及具体
原因；动态 option 回退日志还包含 Script、option、参数名和默认值。

### 12.3 Remote Script 限制

普通 Remote Script 资源可以使用统一的新语法和字符串 `$argument`，但没有插件
`[Argument]` 作用域，因此不能使用：

```text
{${region}, ${level}}
${enabled}
${timeout}
${debug}
cron ${cron}
```

当 Remote Script 作为插件内容的一部分解析并拥有插件参数作用域时，可以使用以上
插件变量能力。

## 13. 新语法形式化定义

以下 EBNF 用于定义结构，不限定具体 Lexer 类名：

```text
http-rule          = http-phase, "if", expression, "then",
                     script-action, [with-clause] ;
http-phase         = "request" | "response" ;

cron-rule          = "cron", cron-value, "then",
                     script-action, [with-clause] ;
network-rule       = "network-changed", "then",
                     script-action, [with-clause] ;
generic-rule       = "generic", "then",
                     script-action, [with-clause] ;

script-action      = "script", "(", path, [",", argument], ")" ;

path               = string ;
argument           = string | raw-string | plugin-object ;
plugin-object      = "{", plugin-variable,
                     {",", plugin-variable}, "}" ;
plugin-variable    = "${", identifier, "}" ;

cron-value         = string | plugin-variable ;
with-clause        = "with", option, {",", option} ;
option             = identifier, "=", option-value ;
option-value       = string | number | boolean | plugin-variable ;
```

`expression` 复用 Rewrite 条件表达式语法。Script 顶层不支持 Rewrite 的 `|` Action
管道，一条规则只能包含一个 `script`。

Response Script 另有语义约束：`expression` 必须能提取出强制 URL Guard。标准化后
URL Guard 位于最外层 `&&` 的左侧；URL Guard 可以是一个 URL 比较，也可以是仅由
URL 比较组成的 `||` 分组。

## 14. 旧语法兼容

### 14.1 双语法识别

```text
request if ...       -> 新 HTTP 语法
response if ...      -> 新 HTTP 语法
cron ... then ...    -> 新 Cron 语法
network-changed then -> 新 Network Changed 语法
generic then ...     -> 新 Generic 语法

http-request ...     -> 旧 HTTP 语法
http-response ...    -> 旧 HTTP 语法
cron ... script-path -> 旧 Cron 语法
network-changed script-path -> 旧 Network Changed 语法
generic script-path  -> 旧 Generic 语法
```

Cron 新旧语法都以 `cron` 开头，因此不能只判断首个单词。可以使用 `then` 和完整
Token 结构区分；解析失败时错误必须来自实际选择的语法，不能无条件回退掩盖错误。

### 14.2 HTTP 转换

旧配置：

```ini
http-request ^https?:\/\/api\.example\.com script-path=request.js, requires-body=true, argument="hello", timeout=20, tag=Request
```

统一模型等价于：

```ini
request if ${url} ~= /^https?:\/\/api\.example\.com/i then script("request.js", "hello") with tag="Request", timeout=20, requires_body=true
```

### 14.3 插件参数转换

旧配置：

```ini
http-response ^https?:\/\/api\.example\.com script-path=response.js, argument={region,level}, enabled={enabled}
```

统一模型等价于：

```ini
response if ${url} ~= /^https?:\/\/api\.example\.com/i then script("response.js", {${region}, ${level}}) with enable=${enabled}
```

### 14.4 Cron 转换

旧配置：

```ini
cron "0 8 * * *" script-path=cron.js, argument="daily", timeout=300, tag=Daily
```

统一模型等价于：

```ini
cron "0 8 * * *" then script("cron.js", "daily") with tag="Daily", timeout=300
```

插件动态 Cron：

```ini
cron {cron} script-path=cron.js, argument={region}, enabled={enabled}
```

等价于：

```ini
cron ${cron} then script("cron.js", {${region}}) with enable=${enabled}
```

### 14.5 Network Changed 转换

```ini
network-changed script-path=network.js, argument={region}, tag=Network
```

等价于：

```ini
network-changed then script("network.js", {${region}}) with tag="Network"
```

### 14.6 Generic 转换

```ini
generic script-path=tool.js, argument="manual", img-url=tool.system, tag=Tool
```

等价于：

```ini
generic then script("tool.js", "manual") with tag="Tool", img_url="tool.system"
```

### 14.7 兼容语义

旧语法转换必须保留：

- Script Type 和触发方式。
- HTTP URL 正则默认忽略大小写。
- `requires-body` 到 `with requires_body` 的映射。
- 脚本路径及本地/远程识别。
- 字符串 `$argument` 和插件参数 Object。
- Cron 表达式及插件动态 Cron。
- `enable/enabled`、`tag`、`img-url`、`timeout`、`debug`、`binary-body-mode`。
- HTTP 第一条命中、Response 请求阶段 URL 预筛选和原始响应最终匹配。
- Cron、Network Changed、Generic 的现有执行行为。

唯一明确改变的旧行为是 HTTP OPTIONS 不再被框架层无条件排除。

## 15. 配置保存和标准化

### 15.1 模型需要保留的文本

| 字段 | 说明 |
|---|---|
| `sourceSyntax` | 新语法或旧兼容语法 |
| `sourceText` | 加载时读到的原始配置行 |
| `configurationText` | 标准化的新语法文本 |
| `configPlayload` | Main App 关联的原始配置行 |

### 15.2 只有用户保存才写回

只有用户在 Script 编辑界面明确保存时，才使用 `configurationText` 更新对应配置行。

以下操作不得自动改写文件或资源内容：

- App 启动和配置加载。
- Tunnel 加载或重载。
- 打开 Script 列表或详情。
- 配置合法性检查。
- Remote Script 下载或刷新。
- 插件加载、更新或参数切换。

旧规则进入编辑器时可以转换为统一模型展示；用户未保存时原始行必须保持不变。

### 15.3 标准输出

1. 关键字和字段名使用标准小写形式。
2. Script Action 统一输出为 `script`，`network-changed` 保留连字符。
3. Path、`tag`、`img_url` 和字符串 `$argument` 使用双引号及统一转义。
4. JSON 等不希望转义的参数可输出 Raw String。
5. 插件对象参数输出为 `{${name1}, ${name2}}`。
6. Boolean 输出 `true` / `false`，Number 不加引号。
7. `=` 两侧不加空格，逗号后添加一个空格。
8. 条件输出必要括号并保留有效用户分组。
9. `with` 字段按固定顺序输出，无字段时整体省略。
10. 默认字段允许省略。

## 16. Parser 校验规则

### 16.1 通用校验

1. 顶层 Trigger 必须是五种已知类型之一。
2. 必须包含对应 Trigger 所需内容、`then` 和一个 Script Action。
3. 一条规则只能包含一个 Script Action。
4. Path 必须是非空固定 String。
5. 第二个参数只能是 String、Raw String 或插件对象参数。
6. 不允许第三个位置参数。
7. `with` 字段必须已知、类型正确、不能重复。
8. 行尾不能存在未消费内容。

### 16.2 HTTP 校验

1. `request` / `response` 必须包含 `if` 和合法条件。
2. Request Script 只能使用 Request 阶段可获得的变量。
3. Response Script 可以额外使用 `${response.status}` 和 `${response.header[...]}`。
4. 每条 Response Script 必须包含可提取的强制 URL Guard；仅出现 `${url}` 但 URL 不是条件成立的必要条件时仍然非法。
5. `==` 两侧类型一致。
6. `~=` 左侧为 String，右侧为 Regex 或 String 类型插件参数。
7. 只允许 `i/m/s` Regex flags，且不能重复。
8. `requires_body` 和 `binary_body_mode` 只允许用于 HTTP。
9. `binary_body_mode` 不得隐式改变 `requires_body` 或脚本执行时机。

### 16.3 插件校验

1. 插件对象参数、动态 Cron、动态 `enable` 只能在插件参数作用域使用。
2. Object 中引用的变量必须存在且不能重复。
3. 动态 Cron 参数必须是 String。
4. 动态 `enable` 参数必须是 Boolean。
5. 动态 `debug` 参数必须是 Boolean/switch，字符串 `"true"` / `"false"` 不做隐式转换。
6. 动态 `timeout` 参数可以是 Number 或数字 String，求值后必须是大于 0 的有限数。
7. Object Value 保持各插件值的 String、Number、Boolean 类型；只用于 Object 且未赋值的旧参数使用 `null`。
8. 条件和动态 Cron 参数必须有实际值；缺值时当前 Script 不进入有效集合。
9. 动态 `enable`、`timeout`、`debug` 缺值时使用字段默认值并输出 Warn；参数未声明或类型不符合要求时仍报错。

### 16.4 错误处理

无效规则不加入 Tunnel 有效集合，但不阻断后续有效规则加载。错误需要包含：

- 稳定错误 code。
- 中文 message。
- location 和 length。
- 配置行号和原始行。

## 17. 建议的数据模型

统一 Script 模型建议包含：

```text
sourceSyntax
sourceText
configurationText
scriptType
condition
responseURLGuard
cronValue
scriptPath
argumentKind               // none / string / pluginObject
argumentString
pluginArgumentKeys
pluginArguments
enableValue
tag
imageURL
timeoutValue              // 固定 Number 或插件变量
debugValue                // 固定 Boolean 或插件变量
timeout                   // 绑定后的运行时有效值
debugEnabled              // 绑定后的运行时有效值
needBody
binaryBodyMode
order
sourceIdentifier
configPlayload
```

旧 `regularExpression`、`argumentStr` 等字段可作为兼容入口继续存在；现有
`needBody` 和 `binaryBodyMode` 可直接承载新 `with` 字段，但标准新语法应由统一
模型生成。

HTTP 条件建议复用 Rewrite 中不依赖 Action 的 Lexer、AST、类型校验、运行时求值、
Host 索引和正则缓存能力。Script 不应伪装成 Rewrite Action，因为两者的命中数量、
执行状态、资源管理和 Session 语义不同。

## 18. 加载和运行流程

```text
本地 / Remote / Plugin Script 原始行
  -> 统一 Script Parser
       -> 新语法解析或旧语法转换
       -> Trigger / Action / with 校验
       -> HTTP 条件校验
       -> 插件参数类型校验
  -> 保留 sourceText
  -> 绑定插件参数值和来源
  -> 按 Script Type 放入现有数组
  -> HTTP Script 构建条件 Matcher
  -> Cron / Network Changed / Generic 继续现有执行入口
```

HTTP Matcher：

```text
matchRequest(requestContext)
  -> 第一条 Request Script 或 nil

prematchResponse(requestContext)
  -> 已提前确定的 Response Script
  -> 或按原配置顺序排列的 Response 候选
  -> 或空

finalMatchResponse(candidates, originalResponseContext)
  -> 第一条完整命中的 Response Script 或 nil
```

`prematchResponse` 在请求阶段调用，强制先通过 URL Guard。候选非空时按现有能力保存
Request Body。`finalMatchResponse` 在原始 Response Header 可用后调用；它不读取
Response Rewrite Action 修改后的 Status/Header。

Request Script 修改 URL 后，只有预匹配结果完全为空时才使用新 URL补做一次
`prematchResponse`；已有提前结果或候选均保留，保持现有行为。

## 19. UI 编辑要求

编辑界面建议按以下内容组织：

1. Script Type：Request、Response、Cron、Network Changed、Generic。
2. Trigger：HTTP 条件或 Cron 表达式。
3. Action：`script`、路径、参数类型和参数内容。
4. Options：enable、tag、img_url、timeout、debug、requires_body、binary_body_mode。

参数编辑器必须明确显示：

- “字符串参数”：脚本中 `$argument` 为 String。
- “插件参数”：脚本中 `$argument` 为 Object，可选择多个插件变量。
- “无参数”：脚本中 `$argument` 为 Null。

旧规则打开时只转换成编辑模型；只有点击保存才输出新语法。

## 20. 实施范围

### 20.1 第一阶段

1. 实现五类 Script 的统一新旧 Parser。
2. 抽取或复用 Rewrite 条件组件。
3. 实现 HTTP 第一条命中的条件 Matcher。
4. 实现 Response 强制 URL Guard、Request 阶段三态候选筛选和 Response Header 阶段最终匹配。
5. 接入本地、远程、插件统一参数校验和绑定。
6. 将旧 `requires-body`、`binary-body-mode` 转换为 `with` 中对应的 snake_case 字段。
7. 删除 H1、HTTPS、HTTP/2 的 OPTIONS 硬编码跳过。
8. 保持 Rewrite 禁用逻辑和脚本执行器不变。
9. 修改编辑器保存输出，加载路径保持只读。
10. 更新示例配置和公开语法文档。

### 20.2 不在第一阶段处理

- Response Body 内容条件。
- 多条 HTTP Script 同时执行。
- Script Action 管道。
- 条件捕获结果传入 `$argument`。
- 改变 JavaScript Bridge 的 `$argument` 数据模型。
- 改变 Cron、Network Changed、Generic 的触发和执行逻辑。
- 改变 Rewrite 与 Script 优先级。

## 21. 测试范围

后续测试源码放在 `AI_Home/TestCase/<测试名>`，构建产物和运行数据放在
`AI_Home/Test/<测试名>`。

### 21.1 Parser

- 五类新语法及所有 `with` 字段。
- `script` Action、Body 字段的阶段合法性以及两个 Body 字段相互独立。
- 无参数、字符串参数、Raw String 和插件 Object 参数。
- 插件对象参数的非法元素、未定义变量和重复变量。
- HTTP `&&`、`||`、括号、Method、Header 和 Regex。
- Response Status/Header、强制 URL Guard 及非法宽泛 `||`。
- 固定/动态 Cron。
- 新旧五类 Script 的转换。
- parse/serialize/parse 等价性。

### 21.2 `$argument`

- 无参数为 Null。
- 字符串保持 String，不自动解析内容。
- 插件对象参数生成 Object。
- Object Key 来自变量名，Value 保持插件类型。
- 旧插件 Object 参数未赋值时使用 Null，不影响其他已赋值字段。
- iOS、macOS、tvOS Bridge 结果一致。

### 21.3 插件绑定

- 未声明、重复或声明类型错误的变量报错。
- 条件和动态 Cron 参数缺值时拒绝当前 Script，且不影响后续 Script。
- 动态 `enable`、`timeout`、`debug` 缺值分别回退 `true`、类型默认超时、`false`。
- option 回退 Warn 包含插件 tag/URL、Script、option、参数名和默认值。
- 新旧语法采用相同的缺值和回退规则。

### 21.4 运行语义

- HTTP 第一条命中后停止。
- Request 和 Response 分别最多选择一条。
- Response 在 Request 阶段筛选候选，并仅在候选非空时要求保存 Request Body。
- Response 使用原始 Status/Header 完成最终匹配，Rewrite 修改结果不反向影响条件。
- Response 多候选保持原配置顺序及第一条命中语义。
- Request Script 修改 URL 时，有候选则保留、无候选才按新 URL补匹配。
- OPTIONS 正常进入匹配。
- Cron 到期脚本全部按现有队列执行。
- Network Changed 事件执行所有启用脚本。
- Generic 继续由用户选择执行。
- Rewrite 禁用逻辑无回归。

### 21.5 文件保护

- 加载旧配置不改写文件。
- 打开编辑器但不保存不改写文件。
- Tunnel 重载不改写配置。
- Remote Script 刷新不自动标准化缓存。
- 插件参数切换不改写插件内容。
- 用户保存后只更新目标行并输出标准新语法。

## 22. 最终示例

### 22.1 Request，无 Body，字符串参数

```ini
request if ${url} ~= /\/api\// && ${request.method} == "GET" then script("request.js", "mode=preview") with tag="API Request", timeout=20
```

### 22.2 Request，需要 Body，插件 Object

```ini
request if ${enabled} == true && ${url} ~= /\/order/ && ${request.method} == "POST" then script("order.js", {${region}, ${level}}) with enable=${enabled}, tag="Order", timeout=20, requires_body=true
```

### 22.3 Response，URL 提前筛选并使用原始 Response 完整匹配

```ini
response if ${url} ~= /\/account/ && ${request.header['Accept']} ~= /application\/json/i && ${response.status} == 200 && ${response.header['Content-Type']} ~= /application\/json/i then script("response.js", {${region}}) with enable=${enabled}, tag="Account Response", timeout=20, requires_body=true, binary_body_mode=true
```

### 22.4 Cron

```ini
cron ${cron} then script("cron.js", {${region}, ${level}}) with enable=${enabled}, tag="Scheduled Task", timeout=300
```

### 22.5 Network Changed

```ini
network-changed then script("network.js", {${region}}) with enable=${enabled}, tag="Network Changed", timeout=30
```

### 22.6 Generic

```ini
generic then script("tool.js", `{"action":"switch"}`) with enable=${enabled}, tag="Switch Tool", img_url="arrow.triangle.swap.system", timeout=30
```

## 23. 结论

统一后的 Script 语法是：

```text
Trigger / Condition
  + script("path" [, argument])
  + with 指令属性
```

第二个参数的配置形态直接决定 `$argument` 类型：

```text
省略                     -> Null
"字符串" / `Raw String` -> String
{${a}, ${b}}             -> Object {a: valueA, b: valueB}
```

该设计统一五类 Script 的书写方式，同时保持 HTTP 第一条命中、Response 请求阶段
URL 预筛选、Cron 调度、Network Changed 全部执行、Generic 手动执行、Rewrite 禁用
优先级以及现有 JavaScript Bridge 参数模型不变；Response Status/Header 使用原始响应
快照完成最终匹配。
