---
sidebar_position: 2
sidebar_label: 复写（旧版语法）
title: 复写（旧版语法）
---

# 复写（旧版语法）

:::warning 旧版文档

本文介绍 Loon 3.5.1 (978) 之前的 Rewrite 语法。该语法仅用于维护旧配置，不再扩展。

新配置请使用 [新版 Rewrite 语法](./rewrite_v2.md)。
也可以使用 [Rewrite 语法转换器](/rewrite-converter) 将旧配置转换为新语法。

:::

Rewrite 可以在 HTTP 请求发出前或响应返回后修改 URL、Header 和 Body，也可以直接返回重定向、拒绝响应或 Mock 数据。

Rewrite 仅对 HTTP 和经过 MitM 解密的 HTTPS 请求生效，并在规则匹配前执行。

## 匹配顺序

- 本地配置中的 Rewrite 优先于插件 Rewrite。
- 同一文件中按从上到下的顺序匹配。
- 请求侧和响应侧 Rewrite 可以作用于同一个请求。
- Loon 3.2.3 (749) 起，同侧且使用相同 URL 正则的 Rewrite 可以依次执行。
- 前一条 Rewrite 的输出会成为后一条的输入，后续修改可能覆盖之前的结果。

## URL 替换

```ini
^http://www\.google\.cn header http://www.google.com
```

## 重定向

```ini
^http://example.com 302 https://example.com
^http://example.com 307 https://example.com
```

## Reject

| Action | 响应 |
|---|---|
| `reject` | 直接断开连接 |
| `reject-200` | 200，空 Body |
| `reject-img` | 200，1×1 图片 |
| `reject-dict` | 200，`{}` |
| `reject-array` | 200，`[]` |

```ini
^http://example.com reject
^http://example.com reject-200
^http://example.com reject-img
^http://example.com reject-dict
^http://example.com reject-array
```

## 请求 Header

```ini
^http://example.com header-add Connection keep-alive
^http://example.com header-del Cookie
^http://example.com header-replace User-Agent Unknown
^http://example.com header-replace-regex User-Agent regex replace-value
```

Loon 3.2.1 (730) 起，一条 Rewrite 可以修改多个 Header：

```ini
^http://example.com header-add Connection keep-alive Proxy-Connection keep-alive
^http://example.com header-del Cookie Connection
^http://example.com header-replace User-Agent Unknown Content-Length 1999
^http://example.com header-replace-regex User-Agent regex replace-value Cookie UUID=123 UUID=456
```

## 请求 Body

适用于 Build 729 及以上版本。

```ini
^http://example.com request-body-replace-regex regex1 replace-value1 regex2 replace-value2
^http://example.com request-body-json-add data.apps[0] {"appName":"loon"} data.category tool
^http://example.com request-body-json-replace data.ad {}
^http://example.com request-body-json-del data.ad
^http://example.com request-body-json-jq 'del(.data.ad)'
```

JSON Action 仅在请求 Body 是有效 JSON 时生效。Key Path 使用点分形式，数组下标使用 `[n]`，例如 `data.apps[0].appName`。

`request-body-json-jq` 使用 [jq](https://jqlang.github.io/jq/tutorial/) 表达式。

## Mock 请求 Body

```ini
^http://example.com mock-request-body data-type=text data=""
^http://example.com mock-request-body data-type=json data-path=request_body.json
^http://example.com mock-request-body data-type=png data-path=request_body.raw mock-data-is-base64=true
```

## 响应 Header

适用于 Build 729 及以上版本。

```ini
^http://example.com response-header-add Connection keep-alive
^http://example.com response-header-del Cookie
^http://example.com response-header-replace Cache-Control no-cache
^http://example.com response-header-replace-regex Content-Type regex replace-value
```

响应 Header 同样支持在一条 Rewrite 中修改多个值。

## 响应 Body

适用于 Build 729 及以上版本。

```ini
^http://example.com response-body-replace-regex regex1 replace-value1 regex2 replace-value2
^http://example.com response-body-json-add data.apps[0] {"appName":"loon"} data.category tool
^http://example.com response-body-json-replace data.ad {}
^http://example.com response-body-json-del data.ad
^http://example.com response-body-json-jq 'del(.data.ad)'
```

JSON Action 仅在响应 Body 是有效 JSON 时生效，Key Path 规则与请求 Body 相同。

## Mock 响应 Body

```ini
^http://example.com mock-response-body data-type=text data="" status-code=200
^http://example.com mock-response-body data-type=json data-path=response_body.json status-code=200
^http://example.com mock-response-body data-type=svg data-path=response_body.raw mock-data-is-base64=true status-code=200
```

Mock Body 参数：

| 参数 | 说明 |
|---|---|
| `data-type` | `json`、`text`、`css`、`html`、`javascript`、`plain`、`png`、`gif`、`jpeg`、`tiff`、`svg`、`mp4` 或 `form-data` |
| `data` | 直接填写 Body，使用双引号 |
| `data-path` | URL 或 iCloud/Mock 目录中的文件 |
| `mock-data-is-base64` | 数据是否为 Base64 |
| `status-code` | Mock 响应状态码，仅用于响应 |

中大型数据建议使用 `data-path`。

:::caution 空格

旧语法按空格分隔参数。正则或替换内容包含空格时，请使用 `\x20`，否则配置可能解析失败。

:::
