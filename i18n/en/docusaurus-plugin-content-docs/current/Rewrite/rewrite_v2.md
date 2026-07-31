---
sidebar_position: 1
title: Rewrite
description: Rewrite configuration syntax supported since Loon 3.5.1 (978)
---

# Rewrite

Rewrite modifies HTTP requests or responses when specified conditions match. It can also return a redirect, reject response, or mock data immediately.

This page describes the new syntax supported since Loon **3.5.1 (978)**.

:::info Scope

Rewrite applies only to HTTP traffic and HTTPS traffic decrypted through MitM. It runs before rule matching.

:::

:::tip Visual builder

Use the [Rewrite Builder](/rewrite-builder) to combine conditions and actions, then copy the generated configuration.

:::

## Quick start

Basic format:

```text
<phase> if <condition> then <action> [| <action> ...]
```

Add a request header:

```ini
http-request if ${url} ~= /^https:\/\/api\.example\.com/ then request.header.set(name="X-Loon", value="true")
```

Modify a JSON response:

```ini
http-response if ${url} ~= /^https:\/\/api\.example\.com\/profile$/ && ${response.status} == 200 then response.json.replace(path="data.vip", value=true)
```

Join multiple actions with `|`. They run from left to right:

```ini
http-request if ${url} ~= /^https:\/\/api\.example\.com/ then request.header.set(name="X-Loon", value="true") | request.header.delete(name="Cookie")
```

Each Rewrite entry must be written on one line.

## Phases

| Phase | Timing | Available data |
|---|---|---|
| `http-request` | Before the request is sent | URL, request method, request headers |
| `http-response` | After response headers are received | Request data, response status, response headers |

Request and response changes must be configured separately:

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.header.set(name="X-Test", value="request")
http-response if ${url} ~= /^https:\/\/example\.com/ then response.header.set(name="X-Test", value="response")
```

Although `response.body.mock(...)` creates a response, it returns that response during the request phase and can therefore be used only with `http-request`.

## Conditions

### Comparison operators

| Operator | Description |
|---|---|
| `==` | Exact equality |
| `~=` | Regular-expression match |

```ini
http-request if ${request.method} == "POST" then request.header.set(name="X-Method", value="POST")
```

```ini
http-response if ${response.header['Content-Type']} ~= /^application\/json(?:;|$)/i then response.header.set(name="X-JSON", value="true")
```

`~=` searches for a matching substring by default. Use `^` and `$` to match the complete value.

### Logical operators

| Operator | Description |
|---|---|
| `&&` | AND |
| `\|\|` | OR |
| `()` | Change precedence |

```ini
http-request if ${request.method} == "POST" && (${request.header['X-Region']} == "CN" || ${request.header['X-Region']} == "HK") then request.header.set(name="X-Matched", value="true")
```

Precedence:

```text
comparison operators > && > ||
```

Add parentheses when an expression uses both `&&` and `||`.

## Variables

Every dynamic value uses `${...}`:

| Source | Example |
|---|---|
| Built-in variable | `${url}` |
| Plugin argument | `${region}` |
| Regular-expression capture | `${item.1}` |

### Built-in variables

| Variable | Type | Request phase | Response phase |
|---|---|---:|---:|
| `${url}` | String | ✓ | ✓ |
| `${request.method}` | String | ✓ | ✓ |
| `${request.header['name']}` | String or null | ✓ | ✓ |
| `${response.status}` | Number | — | ✓ |
| `${response.header['name']}` | String or null | — | ✓ |

Header names are case-insensitive:

```text
${request.header['content-type']}
${request.header['Content-Type']}
```

Response variables cannot be used during the request phase. The current version also does not support reading request or response bodies in a condition.

### Plugin arguments

Declare arguments in the plugin's `[Argument]` section:

```ini
[Argument]
enabled = switch,true,tag=Enabled
price = input,9.99,type=number,tag=Price
region = select,"CN","US","JP",tag=Region
```

Reference them directly in Rewrite:

```ini
[Rewrite]
http-response if ${enabled} == true && ${request.header['X-Region']} == ${region} then response.json.replace(path="data.price", value=${price})
```

| Control | Supported types | Default type |
|---|---|---|
| `input` | String, Number | String |
| `select` | String, Number | String |
| `switch` | Boolean | Boolean |

Use `type=number` when an `input` or `select` must return a number:

```ini
price = input,9.99,type=number
level = select,1,2,3,type=number
```

Arguments are data only. They cannot create new conditions or actions, and their values are not expanded a second time.

### Regular-expression captures

Save a match with `as <name>`:

```ini
http-request if ${url} ~= /^https:\/\/api\.shop\.com\/item\/(\d+)/ as item then request.header.set(name="X-Item-ID", value="${item.1}")
```

| Variable | Content |
|---|---|
| `${item.0}` | Complete match |
| `${item.1}` | First capture group |
| `${item.2}` | Second capture group |

Restrictions:

1. `as` can be used only with `~=`.
2. Each capture name must be unique within one Rewrite entry.
3. A capture name cannot be the same as a plugin argument.
4. A capture index cannot exceed the number of capture groups in the regular expression.
5. The capture condition must run on every successful path and cannot be placed in an optional branch of `||`.

Valid:

```ini
http-request if (${request.method} == "GET" || ${request.method} == "POST") && ${url} ~= /item\/(\d+)/ as item then request.header.set(name="X-Item", value="${item.1}")
```

Invalid:

```ini
http-request if ${url} ~= /item\/(\d+)/ as item || ${request.header['X-Debug']} == "true" then request.header.set(name="X-Item", value="${item.1}")
```

If an optional capture group does not match, an action that references it fails and is skipped. Later actions continue to run.

## Values and strings

### Literals

| Type | Example |
|---|---|
| String | `"hello world"` |
| Number | `200`, `9.99` |
| Boolean | `true`, `false` |
| Null | `null` |
| Regex | `/^https:\/\/example\.com/i` |

Fixed strings must use double quotes. These two values have different types:

```text
value=9.99      # Number
value="9.99"    # String
```

### Regular expressions

Format:

```text
/pattern/flags
```

Supported flags:

| Flag | Description |
|---|---|
| `i` | Ignore case |
| `m` | Multiline mode |
| `s` | Let `.` match line breaks |

`${...}` is not expanded inside a regular-expression literal. To supply a pattern through a plugin argument, place the variable on the right side of `~=`:

```ini
http-request if ${url} ~= ${urlPattern} then request.header.set(name="X-Matched", value="true")
```

### Double-quoted strings

Double-quoted strings support variables:

```ini
request.header.set(name="X-Info", value="price=${price}, region=${region}")
```

Supported escapes:

| Syntax | Result |
|---|---|
| `\"` | Double quote |
| `\\` | Backslash |
| `\n` | Line feed |
| `\r` | Carriage return |
| `\t` | Tab |
| `\${` | Literal `${` |

### Raw strings

Use backticks for fixed JSON or HTML to reduce escaping:

```ini
http-request if ${url} ~= /^https:\/\/api\.example\.com/ then response.body.mock(type="json", data=`{"code":0,"message":"ok"}`, status=200)
```

Raw strings do not process escapes or expand `${...}`. Two consecutive backticks represent one literal backtick.

Use a double-quoted string when variables are needed:

```ini
http-request if ${url} ~= /^https:\/\/api\.example\.com\/item\/(\d+)/ as item then response.body.mock(type="json", data="{\"item\":\"${item.1}\"}", status=200)
```

The new syntax does not split a line at spaces, so `\x20` is unnecessary.

## Actions

Every action uses named arguments:

```text
action(name=value, name=value)
```

Action names and argument names cannot use variables.

### URL

#### `url.replace`

Run a regular-expression replacement on the complete URL:

```ini
http-request if ${url} ~= /^http:\/\/example\.com/ then url.replace(pattern=/^http:\/\/example\.com/, replacement="https://api.example.com")
```

| Argument | Type | Description |
|---|---|---|
| `pattern` | Regex | Replacement pattern |
| `replacement` | String | Replacement text |

Only the matched range is replaced; the rest of the URL is preserved.

#### `redirect`

```ini
http-request if ${url} ~= /^http:\/\/example\.com/ then redirect(status=302, location="https://new.example.com")
```

| Argument | Type | Description |
|---|---|---|
| `status` | Number | `302` or `307` |
| `location` | String | Text that replaces the URL pattern's matched range |

When `redirect` is used, the condition must contain exactly one required URL regular expression.

### Reject

```ini
http-request if ${url} ~= /^https:\/\/example\.com\/ads/ then reject(status=200, body="json-object")
```

Supported combinations:

| `status` | `body` | Response |
|---:|---|---|
| `404` | `"empty"` | Empty body |
| `200` | `"empty"` | Empty body |
| `200` | `"image"` | 1×1 GIF |
| `200` | `"json-object"` | `{}` |
| `200` | `"json-array"` | `[]` |
| `200` | `"video"` | Blank video |

### Headers

Request headers:

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.header.add(name="X-Loon", value="true")
http-request if ${url} ~= /^https:\/\/example\.com/ then request.header.set(name="User-Agent", value="Loon")
http-request if ${url} ~= /^https:\/\/example\.com/ then request.header.delete(name="Cookie")
http-request if ${url} ~= /^https:\/\/example\.com/ then request.header.replace(name="User-Agent", pattern=/iPhone OS \d+/, replacement="iPhone OS 18")
```

Response headers:

```ini
http-response if ${url} ~= /^https:\/\/example\.com/ then response.header.add(name="X-Loon", value="true")
http-response if ${url} ~= /^https:\/\/example\.com/ then response.header.set(name="Cache-Control", value="no-cache")
http-response if ${url} ~= /^https:\/\/example\.com/ then response.header.delete(name="Set-Cookie")
http-response if ${url} ~= /^https:\/\/example\.com/ then response.header.replace(name="Content-Type", pattern=/; charset=.+$/i, replacement="")
```

| Action | Arguments |
|---|---|
| `*.header.add` | `name=String, value=String` |
| `*.header.set` | `name=String, value=String` |
| `*.header.delete` | `name=String` |
| `*.header.replace` | `name=String, pattern=Regex, replacement=String` |

### Body regular-expression replacement

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.body.replace(pattern=/"price":\s*[0-9.]+/, replacement="\"price\":9.99")
http-response if ${url} ~= /^https:\/\/example\.com/ then response.body.replace(pattern=/"enabled":\s*false/, replacement="\"enabled\":true")
```

Arguments:

```text
pattern=Regex, replacement=String
```

### JSON

Request JSON:

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.json.add(path="data.price", value=9.99)
http-request if ${url} ~= /^https:\/\/example\.com/ then request.json.delete(path="data.ads")
http-request if ${url} ~= /^https:\/\/example\.com/ then request.json.replace(path="data.price", value=${price})
http-request if ${url} ~= /^https:\/\/example\.com/ then request.json.jq(filter=".data.ads = []")
```

Response JSON:

```ini
http-response if ${url} ~= /^https:\/\/example\.com/ then response.json.add(path="data.price", value=9.99)
http-response if ${url} ~= /^https:\/\/example\.com/ then response.json.delete(path="data.ads")
http-response if ${url} ~= /^https:\/\/example\.com/ then response.json.replace(path="data.price", value=${price})
http-response if ${url} ~= /^https:\/\/example\.com/ then response.json.jq(file="response-filter.jq")
```

| Action | Arguments |
|---|---|
| `*.json.add` | `path=String, value=Any` |
| `*.json.delete` | `path=String` |
| `*.json.replace` | `path=String, value=Any` |
| `*.json.jq` | `filter=String` or `file=String` |

JSON actions run only when the body is valid JSON. Key paths use dot notation and `[n]` for array indexes:

```text
data.apps[0].appName
```

`value` can be a String, Number, Boolean, null, or variable.

### Mock body

Mock a request body:

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.body.mock(type="json", data=`{"price":9.99}`)
http-request if ${url} ~= /^https:\/\/example\.com/ then request.body.mock(type="json", file="request_body.json")
```

Mock a response body:

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then response.body.mock(type="json", data=`{"code":0}`, status=200)
http-request if ${url} ~= /^https:\/\/example\.com/ then response.body.mock(type="json", file="response_body.json", status=200)
```

| Argument | Description |
|---|---|
| `type` | Body type |
| `data` | Data written directly |
| `file` | Read from a plugin file; mutually exclusive with `data` |
| `base64` | Whether the data is Base64 encoded; defaults to `false` |
| `status` | Response status code; defaults to `200`; response only |

Supported `type` values:

```text
json, text, css, html, javascript, plain,
png, gif, jpeg, tiff, svg, mp4, form-data
```

Use `file` for medium or large data.

## Execution rules

### Multiple Rewrite entries

Within one phase, every matching Rewrite entry runs in configuration order:

```ini
http-request if ${url} ~= /^https:\/\/example\.com/ then request.header.set(name="X-Value", value="first")
http-request if ${url} ~= /\/api\// then request.header.set(name="X-Value", value="second")
```

For a request to `https://example.com/api/user`, the final value is:

```http
X-Value: second
```

Source priority is **local configuration > plugins**. Entries in the same file run from top to bottom.

### Multiple actions

Actions in one Rewrite entry run from left to right in `|` order.

If an action fails at runtime:

1. Keep changes made by earlier actions.
2. Skip the current action and record the error.
3. Continue with later actions.

Invalid argument names, argument types, or regular expressions are configuration errors and cause the complete Rewrite entry to be rejected during loading.

## New and legacy syntax

The legacy syntax remains compatible and can be mixed with the new syntax:

```ini
[Rewrite]
^https://example\.com header-add X-Order old
http-request if ${url} ~= /^https:\/\/example\.com/ then request.header.set(name="X-Order", value="new")
```

Both syntaxes enter the same execution sequence and run in configuration order. Loon does not rewrite old configurations automatically.

Common migration mappings:

| Legacy action | New action |
|---|---|
| `header` | `url.replace(...)` |
| `302`, `307` | `redirect(...)` |
| `reject-*` | `reject(...)` |
| `header-*` | `request.header.*` |
| `response-header-*` | `response.header.*` |
| `request-body-replace-regex` | `request.body.replace(...)` |
| `response-body-replace-regex` | `response.body.replace(...)` |
| `request-body-json-*` | `request.json.*` |
| `response-body-json-*` | `response.json.*` |
| `mock-request-body` | `request.body.mock(...)` |
| `mock-response-body` | `response.body.mock(...)` |

## Complete example

```ini
[Argument]
enabled = switch,true,tag=Enabled
price = input,9.99,type=number,tag=Price
region = select,"CN","US","JP",tag=Region

[Rewrite]
http-request if ${enabled} == true && ${request.method} == "GET" && ${url} ~= /^https:\/\/api\.shop\.com\/item\/(\d+)/ as item && ${request.header['X-Region']} == ${region} then request.header.set(name="X-Item-ID", value="${item.1}") | request.header.set(name="X-Region", value="${region}")

http-response if ${enabled} == true && ${url} ~= /^https:\/\/api\.shop\.com\/item\/(\d+)/ as item && ${response.status} == 200 then response.json.replace(path="data.price", value=${price}) | response.header.set(name="X-Rewritten-Item", value="${item.1}")
```

## Configuration validation

When loading the configuration, Loon checks:

- Whether referenced arguments and captures exist.
- Whether capture names are duplicated or conflict.
- Whether a capture index is out of range.
- Whether variables and actions are available in the current phase.
- Whether action argument names and types are valid.
- Whether regular expressions compile.

An error includes the line number and reason:

```text
Rewrite line 18: undefined argument ${price2}
Rewrite line 21: capture item has only 2 groups; ${item.3} is invalid
Rewrite line 25: ${response.status} is unavailable during http-request
```
