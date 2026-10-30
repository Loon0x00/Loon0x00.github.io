---
sidebar_position: 1
---

# 插件

插件是一份可复用的子配置，可以包含 General、IP Rewrite、规则、Rewrite、脚本、Host 和 MitM 等模块。

## 完整示例

```ini
#!name = 示例插件
#!desc = 展示插件信息和用户参数
#!author = Loon
#!homepage = https://example.com
#!icon = https://example.com/icon.png
#!source = c092d3b95bc93b6248e5a192fd765884dd80a787ec37a178b57fcd4decc0cc1d
#!system = iOS,iPadOS,tvOS,macOS
#!system_version = 15
#!loon_version = 3.5.1(983)
#!date = 2026-10-10
#!tag = 示例,工具
#!type = normal

[Argument]
name = input,"Loon",type=string,tag=名称,desc=输入一个名称
region = select,"CN","US","JP",type=string,tag=地区
price = input,9.99,type=number,tag=价格
level = select,1,2,3,type=number,tag=等级
enabled = switch,true,type=boolean,tag=启用

[General]
bypass-tun =
skip-proxy =
real-ip =
dns-server =

[Rule]

[Rewrite]

[Host]

[Script]
response if ${url} ~= /^https?:\/\/example\.com\/conf\/server-mapping/ then script("remove_ads.js", {${name}, ${region}, ${price}, ${level}, ${enabled}}) with enable=${enabled}, requires_body=true, tag="移除广告"

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
| `#!source` | 插件作者指定下载地址的 SHA-256；多个值使用英文逗号分隔，任意一个匹配即可 |
| `#!system` | 支持的系统，不区分大小写；未填写表示全部支持 |
| `#!system_version` | 最低系统版本，如 `15.0` |
| `#!loon_version` | 最低 Loon 版本，如 `3.5.1(978)` |
| `#!date` | 插件版本日期，如 `2026-10-09`；该值会按原样显示 |
| `#!tag` | 分类标签 |
| `#!type` | 插件类型，支持 `normal`、`parser`；未填写时默认为 `normal` |

### `#!source` 下载地址校验

`#!source` 用于声明插件作者指定下载地址的 SHA-256。Loon 通过网络首次安装插件时，会对用户实际填写并保存的完整 URL 字符串计算 SHA-256，并与该字段比较。普通插件和加密插件使用相同的校验规则。

例如，插件的指定下载地址是：

```text
https://example.com/plugin.lpx
```

可以在终端中计算 SHA-256。`printf` 不会在 URL 末尾添加换行符：

```bash
printf '%s' 'https://example.com/plugin.lpx' | shasum -a 256
```

得到：

```text
c092d3b95bc93b6248e5a192fd765884dd80a787ec37a178b57fcd4decc0cc1d
```

写入插件：

```ini
#!source = c092d3b95bc93b6248e5a192fd765884dd80a787ec37a178b57fcd4decc0cc1d
```

如果插件还有一个作者指定的下载地址 `https://mirror.example.com/plugin.lpx`，将两个地址分别计算 SHA-256，再使用英文逗号分隔。Loon 会逐项忽略首尾空格，只要任意一项匹配就通过校验：

```ini
#!source = c092d3b95bc93b6248e5a192fd765884dd80a787ec37a178b57fcd4decc0cc1d, 234992c8a27b05d53b55b1459e5bc510e6caeacd643e5ba819238094297ed94a
```

计算时使用用户实际填写的 URL，协议、域名、端口、路径和查询参数都属于 URL 内容。Loon 不使用 HTTP 重定向后的地址进行比较，也不会自动删除或修改查询参数。因此，下面两个地址会得到不同的 SHA-256：

```text
https://example.com/plugin.lpx
https://example.com/plugin.lpx?raw=true
```

`#!source` 用于帮助用户发现当前下载地址是否为插件作者指定地址，不是数字签名，不能单独证明插件作者身份或插件内容未被修改。

Loon 3.5.0 (969) 支持以下插件类型：

- `normal`：普通插件。
- `parser`：资源解析器，可在节点、规则和配置订阅页面中选择。

## `[General]`

插件可以声明以下参数。列表参数使用英文逗号分隔，启用插件中的条目会追加到主配置中，相同条目合并去重。未列出的主配置 General 参数不会通过插件应用。

| 参数 | 功能与示例值 | 插件中的行为 |
|---|---|---|
| `bypass-tun` | 让 IP 段或域名绕过 TUN，如 `192.168.0.0/16,localhost,*.local` | 与主配置和其他启用插件的 bypass 条目合并 |
| `include-tun` | 让指定 IPv4 网段进入 TUN，如 `10.7.0.1/32,10.8.0.0/24` | **Build 1007+**；与主配置和其他启用插件的包含路由合并 |
| `skip-proxy` | 让 IP 段或域名绕过 HTTP Proxy，如 `192.168.0.0/16` | 追加到主配置的 HTTP Proxy 绕过列表；不控制 TUN 路由 |
| `real-ip`（兼容 `always-real-ip`） | 让域名返回真实 IP，如 `*.example.com` | 追加到主配置的真实 IP 域名列表 |
| `dns-server` | 普通 UDP DNS，如 `1.1.1.1,8.8.8.8` | 追加 DNS 服务器，不替换主配置中的服务器 |
| `doh-server` | DNS over HTTPS，如 `https://doh.dns.apple.com/dns-query` | 追加 DoH 服务器 |
| `doq-server` | DNS over QUIC，如 `quic://example.com` | 追加 DoQ 服务器 |
| `doh3-server` | DNS over HTTP/3，如 `h3://223.6.6.6/dns-query` | 追加 DoH3 服务器 |
| `ipv6-vif` | `off`：关闭 TUN 的 IPv6 地址 | **插件设置从 Build 1007+ 生效**；任一启用插件显式声明 `off`，最终关闭 IPv6 VIF；插件声明 `auto`、`always` 或未声明时，沿用主配置 |

例如，插件可以追加绕过地址和 DNS 服务器：

```ini
[General]
bypass-tun = 192.168.0.0/16,*.local
skip-proxy = 192.168.0.0/16
real-ip = *.example.com
dns-server = 1.1.1.1
doh-server = https://doh.dns.apple.com/dns-query
```

`dns-server` 中的 `system` 是否启用由主配置决定；插件用于追加具体服务器。其他字段的完整语法见 [通用配置](../General/general.md)。

### 主配置与插件的合并

`include-tun` 与 `bypass-tun` 分别合并，不因为来自主配置或插件而互相覆盖，也不按插件加载顺序决定路由优先级。

例如主配置包含：

```ini
[General]
include-tun = 10.7.0.1/32
```

插件包含：

```ini
[General]
include-tun = 10.7.0.1/32,10.7.0.2/32
```

结果是 `10.7.0.1/32,10.7.0.2/32`，相同路由只保留一份。关闭插件后，主配置的 `10.7.0.1/32` 保留，插件独有的 `10.7.0.2/32` 撤销。

### `include-tun` 与 `bypass-tun` 的冲突

合并后，如果两个字段同时包含同一个目的地址，按以下规则处理：**网络地址和掩码完全相同时，include-tun 优先；掩码不同时，范围更小的路由优先。** `/32` 只包含一个 IP，比 `/24`、`/8` 更具体。

| include-tun | bypass-tun | 访问 10.7.0.1 的结果 |
|---|---|---|
| `10.7.0.1/32` | `10.7.0.1/32` | 进入 TUN，冲突的 bypass 路由不发布给系统 |
| `10.7.0.1/32` | `10.0.0.0/8` | 进入 TUN，包含路由的 `/32` 更具体 |
| `10.7.0.0/24` | `10.7.0.1/32` | 绕过 TUN，bypass 的 `/32` 更具体 |

例如主配置写 `bypass-tun = 10.7.0.1/32`，插件写 `include-tun = 10.7.0.1/32`，最终进入 TUN。交换两项的配置来源，结果相同。若关闭插件且没有其他来源提供该包含路由，主配置的 bypass 路由恢复生效。

`include-tun` 当前只接受带明确前缀长度的 IPv4 CIDR，不接受域名、裸 IP 或 IPv6。主配置和插件中的该字段均不支持参数绑定，不接受 `${参数名}`、`{参数名}` 或 `%INSERT%`。

## `[IP Rewrite]`

适用于 **Build 1007 及以上版本**。只允许在插件中声明，主配置不支持该模块。

### 字段与动作

格式：`目的 IPv4 地址 = 动作`。

```ini
[IP Rewrite]
10.7.0.1 = reflect
10.7.0.2 = reject
10.7.0.3 = drop
```

| 字段 | 用处 |
|---|---|
| 目的 IPv4 地址 | 精确匹配进入 TUN 的数据包的目的地址；只接受单个 IPv4，不接受 CIDR 网段、域名或 IPv6 |
| 动作 | 支持 `reflect`、`reject`、`drop`，具体行为如下 |

| 动作 | 命中后的行为 |
|---|---|
| `reflect` | 交换源、目的 IP 并回注本机协议栈，端口与载荷保持原样 |
| `reject` | TCP 回复 RST；其他协议回复 ICMP 管理性禁止消息（Type 3 / Code 13），使发送方立即获知拒绝。已有 TCP RST、ICMP 错误等不应回复的报文直接丢弃 |
| `drop` | 静默丢弃数据包，不发送回复 |

地址和动作必须直接填写，不支持 `[Argument]` 参数绑定。存在非法项或重复声明 `[IP Rewrite]` 时，整个模块不发布任何动作；合法的 `[General]` 配置独立解析。

### 优先级

1. **先判断是否进入 TUN。** 系统路由先决定流量是否进入 TUN；`include-tun` 与 `bypass-tun` 的冲突按前述路由规则处理。本模块不会自动添加路由，也不处理 HTTP/SOCKS 代理入口的请求。
2. **进入 TUN 后，IP Rewrite 先于常规处理。** 命中后直接执行动作，不再进入规则匹配、策略、HTTP Rewrite、脚本或 MitM，不走代理、不转发出网。未命中则继续原有处理。
3. **同一插件中，同地址取第一条。** 后面的同地址配置不覆盖前面的动作。
4. **多个插件中，同地址取靠前的启用插件。** 顺序以主配置 `[Plugin]` 列表为准；不同地址的配置合并生效。`reflect`、`reject`、`drop` 之间没有固定优先级。

例如插件 A 配置 `10.7.0.2 = reject`，插件 B 配置 `10.7.0.2 = drop`：

| 插件顺序或状态 | 生效动作 |
|---|---|
| A 在 B 前，均启用 | `reject` |
| B 在 A 前，均启用 | `drop` |
| A 关闭，B 启用 | `drop` |
| A、B 均关闭 | 该地址没有 IP Rewrite 动作；若仍进入 TUN，则恢复常规处理 |

## `[Argument]`

适用于 Build 733 及以上版本。该模块声明用户填写或选择的参数，Loon 根据控件类型生成界面。

### 声明格式与类型

```text
参数名 = 控件类型,默认值或可选值,type=值类型,tag=标题,desc=说明
```

`type=` 指定传给 Script 和 Rewrite 的值类型，可以省略；`tag=` 是界面标题，`desc=` 是参数说明，两者也可以省略。

| 控件 | 用途与默认值 | 支持的值类型 | 省略 `type=` 时 |
|---|---|---|---|
| `input` | 输入参数；默认值可省略 | `string`、`number` | `string` |
| `select` | 单选列表；第一个候选值为默认值 | `string`、`number` | `string` |
| `switch` | 开关；填写 `true` 或 `false` 作为默认值 | `boolean` | `boolean` |

`string` 表示字符串；`number` 支持整数、小数、负数和科学计数法；`boolean` 只接受 `true`、`false`。类型名称不区分大小写。

`input/select` 不会根据内容自动推断类型：例如 `input,123` 的值仍为字符串，数值参数必须声明 `type=number`。默认值及候选值必须符合声明类型；控件与类型不匹配、未知类型或 `integer`、`float`、`bool` 等别名均不能解析。

### 声明示例

以下参数供后面的 Script 和 Rewrite 示例共同使用：

```ini
[Argument]
name = input,"Loon",type=string,tag=名称,desc=输入一个名称
region = select,"CN","US","JP",type=string,tag=地区
price = input,9.99,type=number,tag=价格
level = select,1,2,3,type=number,tag=等级
enabled = switch,true,type=boolean,tag=启用
cronExpression = input,"0 8 * * *",type=string,tag=执行时间
```

这里的 `type=string` 和 `type=boolean` 与对应控件的默认类型相同，可以省略；两个 `type=number` 必须保留。

### 在脚本中使用

以下使用 **Loon 3.5.1 (983) 起支持的新版 Script 语法**。在 `script(...)` 的第二个参数中写 `{${参数名}, ...}`，指定传入脚本的参数；在 `with` 中使用 `enable=${enabled}` 控制启停，Cron 表达式使用 `${cronExpression}`：

```ini
[Script]
request if ${url} ~= /^https:\/\/example\.com/ then script("request.js", {${name}, ${region}, ${price}, ${level}, ${enabled}}) with enable=${enabled}, tag="Request"

cron ${cronExpression} then script("task.js", {${region}, ${level}}) with enable=${enabled}, timeout=300, tag="Scheduled Task"
```

`request.js` 通过 `$argument` 对象读取参数，值保留声明类型。使用上面的默认值时：

```javascript
console.log($argument.name);    // "Loon" (String)
console.log($argument.region);  // "CN" (String)
console.log($argument.price);   // 9.99 (Number)
console.log($argument.level);   // 1 (Number)
console.log($argument.enabled); // true (Boolean)
```

对象参数中只能列出当前插件已声明的参数。Cron 表达式无效时，对应脚本不会执行。完整语法见 [Script 配置](../Script/script_v2.md)。

### 在 Rewrite 中使用

Rewrite 通过 `${参数名}` 引用同一组参数。以下用布尔参数控制条件、字符串参数匹配请求头，将数值参数写入 JSON：

```ini
[Rewrite]
response if ${enabled} == true && ${url} ~= /^https:\/\/example\.com\/price/ && ${request.header['X-Region']} == ${region} then response.json.replace("data.price", ${price})
```

`${price}` 写入数值 `9.99`，而不是字符串 `"9.99"`。完整语法见 [Rewrite 变量](../Rewrite/rewrite_v2.md#插件参数)。

## 插件规则可用策略

插件中的规则只能使用以下策略：

- `DIRECT`
- `REJECT` 系列
- `PROXY`

规则未指定策略时默认使用 `DIRECT`。`PROXY` 表示由用户选择策略组；如果未配置，则按找不到策略组的默认逻辑处理。

## 插件资源

[Loon Gallery](https://github.com/Peng-YM/Loon-Gallery) 收录了社区维护的插件。
