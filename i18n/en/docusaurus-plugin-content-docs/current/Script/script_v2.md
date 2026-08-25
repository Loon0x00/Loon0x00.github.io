---
sidebar_position: 1
title: Script
description: Unified Script configuration syntax and usage guide for Loon 3.5.1 (983) and later
---

# Script

The new Script syntax available in Loon **3.5.1 (983)** and later provides one configuration format for Request, Response, Cron, Network Changed, and Generic scripts. It also adds compound conditions to HTTP scripts.

The JavaScript objects and methods available inside a script are unchanged. See the [Script API](./script_api.md).

:::info Supported sources

The main `[Script]` section, `[Remote Script]` resources, and plugin `[Script]` sections use the same syntax, defaults, and validation rules. Plugin scripts can additionally reference parameters from the current plugin's `[Argument]` section.

:::

:::tip Visual tools

Use the [Script Configuration Editor](/en/script-builder) to generate new syntax, or the [Script Syntax Converter](/en/script-converter) to migrate legacy configuration.

:::

## Quick start

Every script type uses the same `script(...)` action:

```text
HTTP              <request|response> if <condition> then script(<path> [, <argument>]) [with <options>]
Cron              cron <cron-expression> then script(<path> [, <argument>]) [with <options>]
Network Changed   network-changed then script(<path> [, <argument>]) [with <options>]
Generic           generic then script(<path> [, <argument>]) [with <options>]
```

A complete HTTP example:

```ini
request if ${url} ~= /^https:\/\/api\.example\.com/i && ${request.method} == "POST" then script("request.js", "source=profile") with tag="Request Script", timeout=20, requires_body=true
```

Each entry has three parts:

| Part | Purpose | Example |
|---|---|---|
| Trigger / Condition | Determines when the entry triggers or matches | `request if ...`, `cron "..."` |
| Script action | Specifies the script path and `$argument` | `script("request.js", "debug=true")` |
| `with` | Configures properties of the entry | `with tag="Request", timeout=20` |

## Script types

### Request Script

Matches and runs before the request is sent:

```ini
request if ${url} ~= /\/api\// && ${request.method} == "POST" then script("request.js") with requires_body=true
```

- When `requires_body` is omitted or `false`, the script runs at the Request Header stage.
- With `requires_body=true`, it waits for the complete Request Body.
- At most one Request Script is selected for a request: the first complete match in final configuration order.

### Response Script

Matches against request data and the original response:

```ini
response if ${url} ~= /\/api\// && ${response.status} == 200 && ${response.header['Content-Type']} ~= /application\/json/i then script("response.js") with requires_body=true
```

- Every Response Script must contain a mandatory URL guard. See [Response URL guard](#response-url-guard).
- When `requires_body` is omitted or `false`, the script runs at the Response Header stage.
- With `requires_body=true`, it waits for the complete Response Body.
- At most one Response Script is selected, while preserving original configuration order.

### Cron Script

Runs on a Cron schedule:

```ini
cron "0 8 * * *" then script("cron.js") with tag="Daily Task", timeout=300
```

Five- and six-field expressions are supported:

```text
* * * * *      minute hour day month weekday
* * * * * *    second minute hour day month weekday
```

A plugin can supply a dynamic Cron expression through a String parameter:

```ini
cron ${cron} then script("cron.js", {${region}}) with enable=${enabled}, tag="Plugin Cron"
```

Due Cron scripts continue to use the existing scheduler and concurrency behavior. They do not use HTTP's first-match rule.

### Network Changed Script

Runs when Loon detects a network change:

```ini
network-changed then script("network.js") with tag="Network Changed", timeout=30
```

All enabled Network Changed scripts run for the same network-change event.

### Generic Script

Defines a script that can be run manually from the app or an existing entry point:

```ini
generic then script("switch-node.js", "region=CN") with tag="Switch Node", img_url="arrow.triangle.swap.system", timeout=30
```

Each Generic Script is an independent action and does not run automatically.

## The `script(...)` action

### Method declaration

```text
script(String[, String|RawString|PluginObject])
```

The first argument is the script path. The optional second argument becomes `$argument` inside the script.

```ini
script("request.js")
script("request.js", "hello")
script("request.js", {${region}, ${level}})
```

An entry can contain only one `script(...)` action. Rewrite-style `|` action pipelines are not supported.

### Script path

The path must be a non-empty fixed string. It may identify a local file, relative path, or remote URL:

```ini
script("local.js")
script("folder/local.js")
script("https://example.com/script.js")
```

Variables and templates are not allowed in the path:

```ini
# Invalid
script(${scriptPath})
script("${region}.js")
```

Local/remote detection, downloading, caching, and path lookup continue to use the existing behavior.

## `$argument`

The form of the second argument directly determines the type of `$argument` in JavaScript.

| Configuration | `$argument` type |
|---|---|
| Second argument omitted | `null` |
| String or Raw String | String |
| Plugin object argument | Object |

### No argument

```ini
request if ${url} ~= /api/ then script("request.js")
```

```javascript
console.log($argument); // null
```

### String argument

```ini
generic then script("tool.js", "region=CN&level=2")
```

The script receives the original String. Loon does not automatically parse JSON, query strings, or another application-specific format:

```javascript
console.log(typeof $argument); // string
```

Use a Raw String for text containing many quotes or line breaks:

```ini
generic then script("tool.js", `{"region":"CN","level":2}`)
```

```javascript
const params = JSON.parse($argument);
```

### Plugin object argument

A plugin script can select multiple `[Argument]` parameters and receive an Object as `$argument`:

```ini
[Argument]
region = select,"CN","US",tag=Region
level = select,1,2,3,type=number,tag=Level
enabled = switch,true,tag=Enabled

[Script]
generic then script("plugin.js", {${region}, ${level}, ${enabled}})
```

The script receives:

```javascript
$argument = {
  region: "CN",
  level: 2,
  enabled: true
};
```

The object argument is not a general JavaScript object literal. Its braces can contain only `${name}` references declared by the current plugin:

```ini
# Valid
script("plugin.js", {${region}, ${level}})

# Invalid
script("plugin.js", {})
script("plugin.js", {"CN", 2})
script("plugin.js", {${url}})
script("plugin.js", {${region}, ${region}})
```

Rules:

1. The object cannot be empty, and a variable cannot occur more than once.
2. Every variable must be declared in the current plugin's `[Argument]` section.
3. Object keys come from parameter names; values preserve the String, Number, or Boolean plugin parameter type.
4. Local scripts and ordinary Remote Script resources have no plugin parameter scope and cannot use object arguments.
5. String and plugin object forms are mutually exclusive. A third argument is not supported.

## The `with` clause

The `with` clause configures the Script entry itself:

```text
with <name>=<value> [, <name>=<value> ...]
```

```ini
request if ${url} ~= /api/ then script("request.js") with enable=true, tag="API Script", img_url="api.system", timeout=20, debug=true, requires_body=true, binary_body_mode=false
```

### Supported fields

| Field | Type | Default | Applies to |
|---|---|---:|---|
| `enable` | Boolean / plugin Boolean | `true` | All scripts |
| `tag` | String | Derived from the script path | All scripts |
| `img_url` | String | None | All scripts |
| `timeout` | Number | Existing default for each type | All scripts |
| `debug` | Boolean | `false` | All scripts |
| `requires_body` | Boolean | `false` | Request / Response |
| `binary_body_mode` | Boolean | `false` | Request / Response |

`requires_body` controls whether Loon waits for the complete body. `binary_body_mode` controls only the existing binary representation of an available body and does not enable `requires_body` automatically.

Cron, Network Changed, and Generic scripts have no HTTP body and cannot use `requires_body` or `binary_body_mode`.

### Field rules

1. Omit the complete `with` clause when it has no fields.
2. Field names are case-sensitive and use lowercase snake_case.
3. A field cannot be repeated. An unknown field makes the entry invalid.
4. `enable`, `debug`, `requires_body`, and `binary_body_mode` must be Boolean.
5. `timeout` must be a finite Number greater than `0`.
6. `tag` and `img_url` must be String values.
7. In a plugin, `enable` may reference a Boolean parameter such as `${enabled}`.
8. Other fields do not accept variables or string templates.

## HTTP conditions

HTTP Script conditions use the same expression syntax as the new Rewrite syntax, except that named captures are not supported.

### Comparison and logical operators

| Operator | Meaning |
|---|---|
| `==` | Exact equality with matching operand types |
| `~=` | Regular-expression search |
| `&&` | Logical AND |
| `\|\|` | Logical OR |
| `()` | Explicit grouping |

Precedence is:

```text
comparison > && > ||
```

```ini
request if ${request.method} == "POST" && (${request.header['X-Region']} == "CN" || ${request.header['X-Region']} == "HK") then script("request.js")
```

Logical expressions use short-circuit evaluation. Parentheses are recommended when `&&` and `||` appear together.

### Available variables

| Variable | Type | Request | Response |
|---|---|---:|---:|
| `${url}` | String | ✓ | ✓ |
| `${request.method}` | String | ✓ | ✓ |
| `${request.header['name']}` | String or missing | ✓ | ✓ |
| `${response.status}` | Number | — | ✓ |
| `${response.header['name']}` | String or missing | — | ✓ |
| `${pluginParameter}` | String, Number, Boolean | Plugin | Plugin |

Header lookup is case-insensitive. A Request Script cannot reference response data that does not yet exist.

A plugin parameter must have the type required by its expression position. For example, a String URL pattern can be used with `~=`, while a Boolean parameter can be used as `enable=${enabled}`.

### Regular expressions

Regular expressions use `/pattern/flags`:

```ini
request if ${url} ~= /^https:\/\/api\.example\.com/i then script("request.js")
```

Supported flags:

```text
i    case-insensitive
m    multiline
s    dot matches newline
```

`~=` performs a search. Use explicit `^` and `$` anchors when the complete value must match.

### Response URL guard

Every Response Script must contain a URL guard, and that guard must be necessary for the complete condition to be true.

Valid:

```ini
response if ${url} ~= /\/api\// && ${response.status} == 200 then script("success.js")
response if (${url} ~= /\/v1\// || ${url} ~= /\/v2\//) && (${response.status} == 200 || ${response.header['X-Cache']} == "HIT") then script("api.js")
```

Invalid:

```ini
# No URL guard
response if ${response.status} == 500 then script("error.js")

# URL is not necessary for the expression to be true
response if ${url} ~= /\/api\// || ${response.status} == 500 then script("error.js")
```

At the request stage, Loon filters candidates using the URL guard and known request data. When Response Headers arrive, it evaluates the complete condition against the original Response Status/Headers. Changes made by Response Rewrite do not alter Script condition results retroactively.

### Conditions not currently supported

- Request or Response Body content conditions.
- Regex `as` named captures and captured values as arguments.
- `!=`, `!~`, logical NOT, ordering comparisons, or set operators.

## Matching and execution

### First HTTP match

First-match behavior applies only to Request and Response scripts:

```ini
request if ${url} ~= /api/ && ${request.method} == "POST" then script("post.js")
request if ${url} ~= /api/ then script("fallback.js")
```

- POST `/api` runs `post.js`.
- GET `/api` runs `fallback.js`.
- Request and Response each select at most one entry and do not consume each other's match position.

Even when Response Scripts go through request-stage candidate filtering, Loon selects the first entry whose final condition is `true` in original configuration order. If an earlier entry is waiting for response data, a later entry already known to be `true` cannot be selected early.

### Rewrite and Script

The execution order and existing disable relationship between Rewrite and Script remain unchanged:

- A terminal response produced at the Request stage disables both Request and Response scripts.
- A matching Request Body Rewrite or Request Body Mock disables the Request Script.
- A matching Response Body Rewrite disables the Response Script.
- A Rewrite that only modifies Request Headers does not gain new disabling behavior.
- A Script condition cannot bypass a disabling decision already made by Rewrite.

Request conditions and Response candidate filtering read the URL, method, and headers after Request Rewrite processing. Final Response conditions read the original Response Status/Headers.

## Local, remote, and plugin sources

All three sources use the same parser and execution model:

| Capability | Local | Ordinary remote | Plugin |
|---|---:|---:|---:|
| New syntax | ✓ | ✓ | ✓ |
| String `$argument` | ✓ | ✓ | ✓ |
| Plugin object `$argument` | — | — | ✓ |
| Plugin parameter in a condition | — | — | ✓ |
| Dynamic `enable` | — | — | ✓ |
| Dynamic Cron | — | — | ✓ |

A Remote Script parsed as part of plugin content can use plugin parameter features when it has that plugin's parameter scope.

Plugin parameters are type-checked and bound during configuration loading. Runtime code uses an immutable parameter snapshot; changing a parameter publishes a new snapshot through configuration reload.

## Legacy and new syntax

Legacy syntax remains accepted for input compatibility, but newly created or edited entries are saved in the new form. Loading legacy configuration alone does not rewrite the file.

### HTTP

Legacy:

```ini
http-request ^https?:\/\/api\.example\.com script-path=request.js, requires-body=true, argument="hello", timeout=20, tag=Request
```

New:

```ini
request if ${url} ~= /^https?:\/\/api\.example\.com/i then script("request.js", "hello") with tag="Request", timeout=20, requires_body=true
```

### Plugin arguments

```ini
# Legacy
http-response ^https?:\/\/api\.example\.com script-path=response.js, argument={region,level}, enabled={enabled}

# New
response if ${url} ~= /^https?:\/\/api\.example\.com/i then script("response.js", {${region}, ${level}}) with enable=${enabled}
```

### Cron

```ini
# Legacy
cron "0 8 * * *" script-path=cron.js, argument="daily", timeout=300, tag=Daily

# New
cron "0 8 * * *" then script("cron.js", "daily") with tag="Daily", timeout=300
```

### Network Changed and Generic

```ini
# Legacy
network-changed script-path=network.js, argument={region}, tag=Network
generic script-path=tool.js, argument="manual", img-url=tool.system, tag=Tool

# New
network-changed then script("network.js", {${region}}) with tag="Network"
generic then script("tool.js", "manual") with tag="Tool", img_url="tool.system"
```

Legacy HTTP URL regular expressions are case-insensitive. Conversion preserves this behavior with the `i` flag. Legacy `requires-body`, `binary-body-mode`, and `img-url` become `requires_body`, `binary_body_mode`, and `img_url`.

## Complete example

```ini
[Argument]
enabled = switch,true,tag=Enabled
region = select,"CN","US","JP",tag=Region
level = select,1,2,3,type=number,tag=Level
cron = input,"0 8 * * *",tag=Schedule

[Script]
request if ${enabled} == true && ${url} ~= /\/order/ && ${request.method} == "POST" then script("order.js", {${region}, ${level}}) with enable=${enabled}, tag="Order", timeout=20, requires_body=true

response if ${url} ~= /\/account/ && ${request.header['Accept']} ~= /application\/json/i && ${response.status} == 200 && ${response.header['Content-Type']} ~= /application\/json/i then script("response.js", {${region}}) with enable=${enabled}, tag="Account Response", timeout=20, requires_body=true, binary_body_mode=true

cron ${cron} then script("cron.js", {${region}, ${level}}) with enable=${enabled}, tag="Scheduled Task", timeout=300

network-changed then script("network.js", {${region}}) with enable=${enabled}, tag="Network Changed", timeout=30

generic then script("tool.js", `{"action":"switch"}`) with enable=${enabled}, tag="Switch Tool", img_url="arrow.triangle.swap.system", timeout=30
```
