---
sidebar_position: 2
sidebar_label: Rewrite (Legacy Syntax)
title: Rewrite (Legacy Syntax)
---

# Rewrite (Legacy Syntax)

:::warning Legacy documentation

This page describes the Rewrite syntax used before Loon 3.5.1 (978). It remains available for maintaining old configurations but will not receive new features.

Use the [new Rewrite syntax](./rewrite_v2.md) for new configurations.
You can also use the [Rewrite Syntax Converter](/en/rewrite-converter) to migrate legacy configuration.

:::

Rewrite can modify the URL, headers, and body before an HTTP request is sent or after a response is received. It can also return a redirect, reject response, or mock data immediately.

Rewrite applies only to HTTP traffic and HTTPS traffic decrypted through MitM. It runs before rule matching.

## Match order

- Rewrite entries in the local configuration take priority over plugin entries.
- Entries in the same file are matched from top to bottom.
- Request-side and response-side entries can act on the same request.
- Since Loon 3.2.3 (749), entries on the same side using the same URL regular expression can run in sequence.
- The output of one entry becomes the input of the next, so later changes may override earlier ones.

## URL replacement

```ini
^http://www\.google\.cn header http://www.google.com
```

## Redirect

```ini
^http://example.com 302 https://example.com
^http://example.com 307 https://example.com
```

## Reject

| Action | Response |
|---|---|
| `reject` | Close the connection immediately |
| `reject-200` | 200 with an empty body |
| `reject-img` | 200 with a 1×1 image |
| `reject-dict` | 200 with `{}` |
| `reject-array` | 200 with `[]` |

```ini
^http://example.com reject
^http://example.com reject-200
^http://example.com reject-img
^http://example.com reject-dict
^http://example.com reject-array
```

## Request headers

```ini
^http://example.com header-add Connection keep-alive
^http://example.com header-del Cookie
^http://example.com header-replace User-Agent Unknown
^http://example.com header-replace-regex User-Agent regex replace-value
```

Since Loon 3.2.1 (730), one Rewrite entry can modify multiple headers:

```ini
^http://example.com header-add Connection keep-alive Proxy-Connection keep-alive
^http://example.com header-del Cookie Connection
^http://example.com header-replace User-Agent Unknown Content-Length 1999
^http://example.com header-replace-regex User-Agent regex replace-value Cookie UUID=123 UUID=456
```

## Request body

Requires Build 729 or later.

```ini
^http://example.com request-body-replace-regex regex1 replace-value1 regex2 replace-value2
^http://example.com request-body-json-add data.apps[0] {"appName":"loon"} data.category tool
^http://example.com request-body-json-replace data.ad {}
^http://example.com request-body-json-del data.ad
^http://example.com request-body-json-jq 'del(.data.ad)'
```

JSON actions run only when the request body is valid JSON. Key paths use dot notation and `[n]` for array indexes, such as `data.apps[0].appName`.

`request-body-json-jq` uses a [jq](https://jqlang.github.io/jq/tutorial/) expression.

## Mock request body

```ini
^http://example.com mock-request-body data-type=text data=""
^http://example.com mock-request-body data-type=json data-path=request_body.json
^http://example.com mock-request-body data-type=png data-path=request_body.raw mock-data-is-base64=true
```

## Response headers

Requires Build 729 or later.

```ini
^http://example.com response-header-add Connection keep-alive
^http://example.com response-header-del Cookie
^http://example.com response-header-replace Cache-Control no-cache
^http://example.com response-header-replace-regex Content-Type regex replace-value
```

A single Rewrite entry can also modify multiple response headers.

## Response body

Requires Build 729 or later.

```ini
^http://example.com response-body-replace-regex regex1 replace-value1 regex2 replace-value2
^http://example.com response-body-json-add data.apps[0] {"appName":"loon"} data.category tool
^http://example.com response-body-json-replace data.ad {}
^http://example.com response-body-json-del data.ad
^http://example.com response-body-json-jq 'del(.data.ad)'
```

JSON actions run only when the response body is valid JSON. Key paths follow the same rules as request bodies.

## Mock response body

```ini
^http://example.com mock-response-body data-type=text data="" status-code=200
^http://example.com mock-response-body data-type=json data-path=response_body.json status-code=200
^http://example.com mock-response-body data-type=svg data-path=response_body.raw mock-data-is-base64=true status-code=200
```

Mock body options:

| Option | Description |
|---|---|
| `data-type` | `json`, `text`, `css`, `html`, `javascript`, `plain`, `png`, `gif`, `jpeg`, `tiff`, `svg`, `mp4`, or `form-data` |
| `data` | Body written directly in double quotes |
| `data-path` | URL or a file in the iCloud/Mock directory |
| `mock-data-is-base64` | Whether the data is Base64 encoded |
| `status-code` | Mock response status code; response only |

Use `data-path` for medium or large data.

:::caution Spaces

The legacy syntax separates arguments by spaces. Use `\x20` when a regular expression or replacement contains a space, or the configuration may fail to parse.

:::
