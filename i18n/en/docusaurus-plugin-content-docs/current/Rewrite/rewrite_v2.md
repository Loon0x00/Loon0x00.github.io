---
sidebar_position: 1
title: Rewrite
description: Rewrite configuration syntax supported since Loon 3.5.1 (978)
---

# Rewrite

Rewrite modifies HTTP requests or responses when specified conditions match. It can also replace a URL, return a redirect, reject a request, or generate mock data.

This page describes the new syntax supported since Loon **3.5.1 (978)**.

:::info Scope

Rewrite applies only to HTTP traffic and HTTPS traffic decrypted through MitM. It runs before rule matching.

:::

:::tip Visual builder

Use the [Rewrite Builder](/en/rewrite-builder) to combine conditions and actions, then copy the generated configuration.

:::

## Quick start

Each Rewrite entry is written on one line:

```text
<phase> if <condition> then <action> [| <action> ...]
```

Set a request header:

```ini
request if ${url} ~= /^https:\/\/api\.example\.com/ then request.header.set("X-Loon", "true")
```

Modify a JSON response:

```ini
response if ${url} ~= /^https:\/\/api\.example\.com\/profile$/ && ${response.status} == 200 then response.json.replace("data.vip", true)
```

Join multiple actions with `|`. They run from left to right:

```ini
request if ${url} ~= /^https:\/\/api\.example\.com/ then request.header.set("X-Loon", "true") | request.header.del("Cookie")
```

## Phases

| Phase | Timing | Available data |
|---|---|---|
| `request` | Before the request is sent | URL, request method, request headers |
| `response` | After response headers are received | Request data, response status, response headers |

Request and response actions normally need separate entries:

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.header.set("X-Test", "request")
response if ${url} ~= /^https:\/\/example\.com/ then response.header.set("X-Test", "response")
```

A regular Rewrite entry cannot mix request actions with response actions.

`response.body.mock(...)` is a special case. Its configured phase is still `response`, but Loon generates the response before sending the request upstream. See [Mock response body](#mock-response-body) for its restrictions.

## Conditions

### Comparison operators

| Operator | Description |
|---|---|
| `==` | Compare the complete value for equality |
| `~=` | Search for a regular-expression match |

Match a request method:

```ini
request if ${request.method} == "POST" then request.header.set("X-Method", "POST")
```

Match a response header:

```ini
response if ${response.header['Content-Type']} ~= /^application\/json(?:;|$)/i then response.header.set("X-JSON", "true")
```

`~=` searches for a matching substring by default. Use `^` and `$` when you need to match the complete value.

### Logical operators

| Operator | Description |
|---|---|
| `&&` | AND |
| `\|\|` | OR |
| `()` | Change or preserve condition grouping |

```ini
request if ${request.method} == "POST" && (${request.header['X-Region']} == "CN" || ${request.header['X-Region']} == "HK") then request.header.set("X-Matched", "true")
```

Precedence:

```text
comparison operators > && > ||
```

Use parentheses to make grouping explicit when combining `&&` and `||`. An explicit group with two or more direct conditions is preserved. Redundant parentheses around a single condition are omitted.

## Variables

General dynamic values use `${...}`:

| Source | Example |
|---|---|
| Loon built-in variable | `${url}` |
| Plugin argument | `${region}` |
| Condition regex capture | `${item.1}` |

### Built-in variables

| Variable | Type | `request` | `response` |
|---|---|---:|---:|
| `${url}` | String | ✓ | ✓ |
| `${request.method}` | String | ✓ | ✓ |
| `${request.header['name']}` | String or null | ✓ | ✓ |
| `${response.status}` | Number | — | ✓ |
| `${response.header['name']}` | String or null | — | ✓ |

Header name lookup is case-insensitive:

```text
${request.header['content-type']}
${request.header['Content-Type']}
```

Both expressions refer to the same header. The `request` phase cannot reference response variables that do not exist yet.

The current version does not support reading a request or response body in an `if` condition, including `${request.body}`, `${response.body}`, and JSON key paths.

### Plugin arguments

Continue to declare plugin arguments in `[Argument]`:

```ini
[Argument]
enabled = switch,true,tag=Enabled
price = input,9.99,type=number,tag=Price
region = select,"CN","US","JP",tag=Region
level = select,1,2,3,type=number,tag=Level
```

Reference the argument name directly:

```ini
[Rewrite]
response if ${enabled} == true && ${level} == 2 && ${request.header['X-Region']} == ${region} then response.json.replace("data.price", ${price})
```

| Control | Supported types | Default type |
|---|---|---|
| `input` | String, Number | String |
| `select` | String, Number | String |
| `switch` | Boolean | Boolean |

Use `type=number` when an `input` or `select` should return a number:

```ini
price = input,9.99,type=number
level = select,1,2,3,type=number
```

Older plugins without `type` keep their existing behavior: `input` and `select` are parsed as String, while `switch` is parsed as Boolean. An argument is typed data only. It is not reparsed into a condition or action, and variable expansion does not run a second time.

A local Rewrite has no `[Argument]` source, so the local editor can use only built-in variables and regex captures declared by the current Rewrite entry.

### Condition regex captures

Add `as <name>` after a regex condition to save its match:

```ini
request if ${url} ~= /^https:\/\/api\.shop\.com\/item\/(\d+)/ as item then request.header.set("X-Item-ID", "${item.1}")
```

| Variable | Value |
|---|---|
| `${item.0}` | Complete match |
| `${item.1}` | First capture group |
| `${item.2}` | Second capture group |

Restrictions:

1. `as` can be used only with a `~=` regex condition.
2. Capture names must be unique within one Rewrite entry.
3. A capture name cannot duplicate a plugin argument name.
4. A capture index cannot exceed the regex capture-group count.
5. A capture referenced by an action must exist on every successful expression path. It cannot be in an optional `||` branch.

Valid:

```ini
request if (${request.method} == "GET" || ${request.method} == "POST") && ${url} ~= /item\/(\d+)/ as item then request.header.set("X-Item", "${item.1}")
```

Invalid:

```ini
request if ${url} ~= /item\/(\d+)/ as item || ${request.header['X-Debug']} == "true" then request.header.set("X-Item", "${item.1}")
```

If the regex matches but a referenced optional capture group has no value, the current action fails and is skipped. Later actions continue to run.

### Condition captures and action captures

Condition regexes and action-owned regexes use separate capture syntax:

| Source | Declaration | Reference | Scope |
|---|---|---|---|
| Regex in `if` | `~= /.../ as item` | `${item.0}`, `${item.1}` | Actions in the current Rewrite |
| Regex in Header/Body Replace | Action Regex argument | `$0`, `$1` | Replacement argument of that action |

For example:

```ini
request if ${url} ~= /^https:\/\/old\.example\.com(\/.*)$/ as item then url.replace("https://new.example.com${item.1}")
```

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.body.replace(/price=(\d+)/, "amount=$1")
```

`${item.1}` in the first entry comes from the `if` condition. `$1` in the second comes from the regex owned by `request.body.replace`. `$n` is not a general Rewrite variable, cannot cross action boundaries, and is invalid in `url.replace("$1")`.

## Values and strings

### Literals

| Type | Example |
|---|---|
| String | `"hello world"` |
| Number | `200`, `9.99` |
| Boolean | `true`, `false` |
| Null | `null` |
| Regex | `/^https:\/\/example\.com/i` |

Fixed strings require double quotes. These values have different types:

```text
9.99      # Number
"9.99"    # String
```

### Regular expressions

Format:

```text
/pattern/flags
```

Supported flags:

| Flag | Description |
|---|---|
| `i` | Case-insensitive |
| `m` | Multiline mode |
| `s` | Let `.` match line breaks |

`${...}` is not expanded inside a regex literal. To provide the complete regex through a plugin argument, place the variable directly on the right side of `~=`:

```ini
request if ${url} ~= ${urlPattern} then request.header.set("X-Matched", "true")
```

### Double-quoted strings

Double-quoted strings support `${...}` templates:

```ini
request.header.set("X-Info", "price=${price}, region=${region}")
```

Supported escapes:

| Syntax | Result |
|---|---|
| `\"` | Double quote |
| `\\` | Backslash |
| `\n` | Line break |
| `\r` | Carriage return |
| `\t` | Tab |
| `\${` | Literal `${` |

Use single quotes around a header name in a variable expression:

```ini
request.header.set("X-Origin", "UA=${request.header['User-Agent']}")
```

### Raw strings

Use backticks for fixed JSON, HTML, or other text containing many quotes:

```ini
response if ${url} ~= /^https:\/\/api\.example\.com/ then response.body.mock("json", `{"code":0,"message":"ok"}`, 200)
```

A raw string:

- Does not process backslash escapes.
- Does not expand `${...}`.
- Treats commas, equals signs, parentheses, and double quotes as content.
- Uses two consecutive backticks for one literal backtick.

Use a regular double-quoted string when variables are required:

```ini
response if ${url} ~= /^https:\/\/api\.example\.com\/item\/(\d+)/ as item then response.body.mock("json", "{\"item\":\"${item.1}\"}", 200)
```

The new syntax does not split an entry on spaces, so `\x20` is no longer needed to represent a space.

## Actions

All actions use positional arguments:

```text
action(value, value)
```

Arguments must follow the order in the method declaration. Argument names are not allowed:

```text
# Valid
redirect(302, "https://example.com")

# Invalid
redirect(status=302, location="https://example.com")
```

Optional arguments can be omitted only from the right. In the declarations below, `[...]` marks optional trailing arguments and is not part of the configuration syntax.

### Action reference

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

A `RegexReplacement` is still written as a string. `$0` through `$n` refer to matches from the regex owned by the same action.

### Batch array arguments

Header changes, body regex replacement, and JSON changes can contain multiple parameter groups in one action:

```ini
request if ${url} ~= /api/ then request.header.set(["X-A", "X-B"], ["1", "2"])
response if ${url} ~= /api/ then response.body.replace([/false/, /disabled/], ["true", "enabled"])
response if ${url} ~= /api/ then response.json.add(["data.a", "data.b"], [1, true])
```

Actions that support batch arguments:

- `request.header.add/set/del/replace`
- `response.header.add/set/del/replace`
- `request.body.replace` and `response.body.replace`
- `request.json.add/delete/replace`
- `response.json.add/delete/replace`

The existing scalar form remains valid. Array arguments follow these rules:

1. Every argument of the same action must be an array; scalar and array arguments cannot be mixed.
2. All argument arrays must have the same length. Elements with the same index are paired and run in order.
3. Arrays cannot be empty or nested.
4. Every element must still match the String, Regex, RegexReplacement, or Any type required at that position.
5. Every JSON key path is validated separately.

For example:

```ini
request.header.del(["Cookie", "Referer"])
request.header.replace(["X-A", "X-B"], [/old-a/, /old-b/i], ["new-a", "new-b"])
response.json.delete(["data.ads", "data.tracking"])
```

Batch syntax has the same execution result as listing the corresponding actions in the same order, but it remains stored as one batch instruction.

### URL changes

#### `url.replace`

`url.replace` uses the single mandatory URL regex in `if` as its replacement range. The action does not repeat that regex:

```ini
request if ${url} ~= /^https:\/\/old\.example\.com(\/.*)$/ as urlMatch then url.replace("https://new.example.com${urlMatch.1}")
```

Only the matched range is replaced. Unmatched URL content is preserved.

Restrictions:

1. `if` must contain exactly one `${url} ~= /.../` condition that every successful path passes through.
2. The URL regex cannot be in an optional `||` branch.
3. Use `as` and `${name.n}` when capture groups are needed.
4. `$n` is not allowed in the `url.replace` argument.

#### `redirect`

```ini
request if ${url} ~= /^http:\/\/example\.com/ then redirect(302, "https://api.example.com")
```

Arguments:

| Position | Type | Description |
|---:|---|---|
| 1 | Number | Status code; currently `302` or `307` |
| 2 | String | Replacement for the URL regex match |

`redirect` follows the same mandatory URL regex rules as `url.replace` and preserves unmatched URL content.

For this input:

```text
http://example.com/item/123?region=CN
```

The example produces:

```text
https://api.example.com/item/123?region=CN
```

### Reject

| Action | Response |
|---|---|
| `reject(status)` | Specified status, empty body |
| `reject(status, body)` | Specified status and UTF-8 text |
| `reject_img(status)` | 1×1 GIF |
| `reject_dict(status)` | JSON object `{}` |
| `reject_array(status)` | JSON array `[]` |
| `reject_video(status)` | Blank video |

The status must be an integer from `100` through `599`.

```ini
request if ${url} ~= /^https:\/\/example\.com\/ads/ then reject_dict(200)
request if ${url} ~= /^https:\/\/example\.com\/blocked/ then reject(451, "Unavailable for legal reasons")
```

`reject(200, "{}")` returns plain text. Use `reject_dict(200)` or `reject_array(200)` when a JSON Content-Type is required.

### Headers

Request headers:

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.header.add("X-Loon", "true")
request if ${url} ~= /^https:\/\/example\.com/ then request.header.set("User-Agent", "Loon")
request if ${url} ~= /^https:\/\/example\.com/ then request.header.del("Cookie")
request if ${url} ~= /^https:\/\/example\.com/ then request.header.replace("User-Agent", /iPhone OS (\d+)/, "iPhone OS $1")
```

Response headers:

```ini
response if ${url} ~= /^https:\/\/example\.com/ then response.header.add("X-Loon", "true")
response if ${url} ~= /^https:\/\/example\.com/ then response.header.set("Cache-Control", "no-cache")
response if ${url} ~= /^https:\/\/example\.com/ then response.header.del("Set-Cookie")
response if ${url} ~= /^https:\/\/example\.com/ then response.header.replace("Content-Type", /^(.+); charset=.+$/i, "$1")
```

| Action | Argument order |
|---|---|
| `*.header.add` | Header name, header value |
| `*.header.set` | Header name, header value |
| `*.header.del` | Header name |
| `*.header.replace` | Header name, regex, replacement |

The replacement in `header.replace` supports `$0` and `$1` through `$n` from the action's regex, as well as general `${...}` variables.

### Body regex replacement

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.body.replace(/"price":\s*([0-9.]+)/, "\"originalPrice\":$1")
response if ${url} ~= /^https:\/\/example\.com/ then response.body.replace(/"enabled":\s*(false)/, "\"enabled\":$1")
```

Argument order:

```text
Regex, RegexReplacement
```

In the replacement, `$0` is the complete match and `$1` through `$n` are capture groups from the current action's regex. General `${...}` variables are also supported.

### JSON

Request JSON:

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.json.add("data.price", 9.99)
request if ${url} ~= /^https:\/\/example\.com/ then request.json.delete("data.ads")
request if ${url} ~= /^https:\/\/example\.com/ then request.json.replace("data.price", ${price})
request if ${url} ~= /^https:\/\/example\.com/ then request.json.jq(".data.ads = []")
request if ${url} ~= /^https:\/\/example\.com/ then request.json.jq_file("request-filter.jq")
```

Response JSON:

```ini
response if ${url} ~= /^https:\/\/example\.com/ then response.json.add("data.price", 9.99)
response if ${url} ~= /^https:\/\/example\.com/ then response.json.delete("data.ads")
response if ${url} ~= /^https:\/\/example\.com/ then response.json.replace("data.price", ${price})
response if ${url} ~= /^https:\/\/example\.com/ then response.json.jq(".data.ads = []")
response if ${url} ~= /^https:\/\/example\.com/ then response.json.jq_file("response-filter.jq")
```

| Action | Argument order |
|---|---|
| `*.json.add` | Key path, value |
| `*.json.delete` | Key path |
| `*.json.replace` | Key path, value |
| `*.json.jq` | Inline JQ |
| `*.json.jq_file` | Plugin resource file |

JSON actions apply only when the body is valid JSON. Key paths use dot notation and `[n]` for an array index:

```text
data.apps[0].appName
```

A JSON value can be a String, Number, Boolean, null, or variable.

### Mock request body

Inline body:

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.body.mock("json", `{"price":9.99}`)
```

Plugin resource file:

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.body.mock_file("json", "request_body.json")
```

Base64 data:

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.body.mock("png", "iVBORw0KGgo...", true)
```

| Method | Argument order |
|---|---|
| `request.body.mock` | Content type, inline body, optional Base64 |
| `request.body.mock_file` | Content type, resource file, optional Base64 |

Base64 defaults to `false`.

### Mock response body

Inline body:

```ini
response if ${url} ~= /^https:\/\/example\.com/ then response.body.mock("json", `{"code":0}`, 200)
```

Plugin resource file:

```ini
response if ${url} ~= /^https:\/\/example\.com/ then response.body.mock_file("json", "response_body.json", 200)
```

Base64 data:

```ini
response if ${url} ~= /^https:\/\/example\.com/ then response.body.mock("png", "iVBORw0KGgo...", 200, true)
```

| Method | Argument order |
|---|---|
| `response.body.mock` | Content type, inline body, optional status, optional Base64 |
| `response.body.mock_file` | Content type, resource file, optional status, optional Base64 |

The status defaults to `200`, and Base64 defaults to `false`. To provide Base64, the status argument must be present first.

A Rewrite containing a response mock has these restrictions:

1. It can contain only one `response.body.mock` or `response.body.mock_file`.
2. Apart from the mock, it can contain only `response.header.*` actions.
3. Its `if` condition and mock arguments cannot reference `${response.status}` or `${response.header['name']}`, because no response exists yet.
4. Loon creates the mock response first, then runs all header actions in configuration order.
5. Loon removes `Transfer-Encoding` and recalculates `Content-Length` from the final body.

Supported content types:

```text
json, text, css, html, javascript, plain,
png, gif, jpeg, tiff, svg, mp4, form-data
```

Use the corresponding `*_file` method for medium or large data.

## Execution rules

### Multiple Rewrite entries

All matching Rewrite entries in the same phase run in configuration order:

```ini
request if ${url} ~= /^https:\/\/example\.com/ then request.header.set("X-Value", "first")
request if ${url} ~= /\/api\// then request.header.set("X-Value", "second")
```

A request to `https://example.com/api/user` ends with:

```http
X-Value: second
```

Source priority is **local configuration > plugins**. Entries from the same source run from top to bottom.

### Multiple actions

Actions in one Rewrite entry run from left to right in `|` order.

If an action fails at runtime:

1. Earlier completed changes are kept.
2. The failing action is skipped and an error is recorded.
3. Later actions continue to run.

An invalid argument count, argument type, or regular expression is a configuration error. Loon rejects the complete Rewrite entry when loading it instead of handling the issue at runtime.

## Old and new syntax

Legacy and new syntax can be used together:

```ini
[Rewrite]
^https://example\.com header-add X-Order old
request if ${url} ~= /^https:\/\/example\.com/ then request.header.set("X-Order", "new")
```

After parsing, both forms enter the same execution sequence and run in configuration order. Syntax type does not change priority.

Legacy syntax is accepted only as input compatibility. Generated, saved, and fully displayed Rewrite configuration uses the new syntax.

Common mappings:

| Legacy action | New action |
|---|---|
| `header` | `url.replace(...)` |
| `302`, `307` | `redirect(...)` |
| `reject`, `reject-200` | `reject(...)` |
| `reject-img` | `reject_img(...)` |
| `reject-dict` | `reject_dict(...)` |
| `reject-array` | `reject_array(...)` |
| `reject-video` | `reject_video(...)` |
| `header-add`, `header-replace`, `header-del` | `request.header.*` |
| `response-header-*` | `response.header.*` |
| `request-body-replace-regex` | `request.body.replace(...)` |
| `response-body-replace-regex` | `response.body.replace(...)` |
| `request-body-json-*` | `request.json.*` |
| `response-body-json-*` | `response.json.*` |
| `mock-request-body` | `request.body.mock(...)` |
| `mock-response-body` | `response.body.mock(...)` |

In legacy `header`, `302`, and `307` entries, `$n` in the replacement refers to the leading URL regex. During conversion, Loon assigns a capture name and converts `$n` to `${name.n}`. `$n` belonging to the regex in a Header/Body Replace action remains action-local.

Multiple operations of the same type on one legacy line are merged into batch array arguments during conversion. A single parameter group remains in scalar form.

The development-only `http-request`, `http-response`, and named-argument forms were never released and are not compatibility syntax.

## Complete example

```ini
[Argument]
enabled = switch,true,tag=Enabled
price = input,9.99,type=number,tag=Price
region = select,"CN","US","JP",tag=Region

[Rewrite]
request if ${enabled} == true && ${request.method} == "GET" && ${url} ~= /^https:\/\/api\.shop\.com\/item\/(\d+)/ as item && ${request.header['X-Region']} == ${region} then request.header.set("X-Item-ID", "${item.1}") | request.header.set("X-Region", "${region}")

response if ${enabled} == true && ${url} ~= /^https:\/\/api\.shop\.com\/item\/(\d+)/ as item && ${response.status} == 200 then response.json.replace("data.price", ${price}) | response.header.set("X-Rewritten-Item", "${item.1}")
```

## Configuration validation

When loading configuration, Loon validates:

- Plugin arguments and capture names are valid, defined, and conflict-free.
- Capture indexes do not exceed regex capture-group counts.
- A referenced capture exists on every successful expression path.
- Variables and actions are available in the selected phase.
- Action argument counts, order, and types are correct.
- Batch arrays are non-empty, have matching lengths, and are not mixed with scalar arguments.
- URL replacement and redirect actions have one mandatory URL regex.
- Regular expressions compile successfully.
- Response mock actions follow their action-combination and variable restrictions.

Errors include a line number and reason:

```text
Rewrite line 18: undefined argument ${price2}
Rewrite line 21: regex item has 2 capture groups; ${item.3} is invalid
Rewrite line 25: the request phase cannot reference ${response.status}
```

## Developer notes

- The parser must recognize string, raw-string, regex, and variable boundaries. It must not split a line directly on spaces or commas.
- `if`, `then`, `&&`, `||`, `|`, `,`, parentheses, and array boundaries `[]` have syntax meaning only at the outermost level.
- Plugin arguments must enter the syntax tree as typed data. Do not substitute their text and parse the line again.
- Variables expand once. `${...}` inside an argument value does not trigger a second expansion.
- Positional argument order for a released action remains stable. New optional arguments can be appended only at the end.
