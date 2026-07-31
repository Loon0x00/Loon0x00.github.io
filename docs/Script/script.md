---
sidebar_position: 1
---

# 脚本类型

所有脚本都可以使用 [Script API](./script_api.md)。

## `http-request`

在请求发出前执行。

```ini
http-request ^https?:\/\/example\.com script-path=request.js,tag=请求脚本,requires-body=true,binary-body-mode=false,timeout=10,argument="name=loon",enable=true
```

常用参数：

| 参数 | 说明 |
|---|---|
| `requires-body` | 是否读取请求 Body |
| `binary-body-mode` | 是否以 `Uint8Array` 读取 Body |
| `argument` | 传给脚本的参数，建议使用双引号 |
| `timeout` | 超时时间，默认 10 秒 |

可用对象：

| 对象 | 说明 |
|---|---|
| `$request.url` | 请求 URL |
| `$request.method` | 请求方法 |
| `$request.headers` | 请求 Header 对象 |
| `$request.body` | String 或 Uint8Array；需要 `requires-body=true` |
| `$request.h2_trailers` | HTTP/2 Trailers；Build 927+ |
| `$response` | `undefined` |

结束脚本：

```javascript
// 中断请求
$done();

// 不修改请求
$done({});

// 修改请求
$done({
  url: "https://new.example.com/",
  headers: {"X-Loon": "true"},
  h2_trailers: {},
  node: "HK"
});

// 直接返回响应
$done({
  response: {
    status: 200,
    headers: {"Content-Type": "application/json"},
    body: "{}"
  }
});
```

未提供 `headers` 或 `body` 时保留原值。使用 `headers: {}` 或 `body: ""` 可以清空对应内容。

## `http-response`

收到响应后执行。

```ini
http-response ^https?:\/\/example\.com script-path=response.js,tag=响应脚本,requires-body=true,binary-body-mode=false,timeout=10,argument="name=loon",enable=true
```

参数与 `http-request` 相同。可用对象：

| 对象 | 说明 |
|---|---|
| `$request` | 原请求信息 |
| `$response.status` | 响应状态码 |
| `$response.headers` | 响应 Header 对象 |
| `$response.body` | String 或 Uint8Array；需要 `requires-body=true` |
| `$response.h2_trailers` | HTTP/2 Trailers；Build 927+ |

```javascript
// 不修改响应
$done({});

// 修改响应
$done({
  status: 200,
  headers: {"Content-Type": "application/json"},
  h2_trailers: {},
  body: "{}"
});
```

未提供 `headers`、`body` 或 `h2_trailers` 时保留原值；传入空值可以清除。

## `cron`

按照 Cron 表达式定时执行。

```ini
cron "0 8 * * *" script-path=cron.js,tag=定时任务,timeout=300,argument="1234",enable=true
```

支持两种格式：

```text
* * * * *      分 时 日 月 周
* * * * * *    秒 分 时 日 月 周
```

## `network-changed`

网络环境变化时执行。如果配置了多条，只执行第一条。

```ini
network-changed script-path=network-changed.js,tag=网络变化,timeout=300,argument="1234",enable=true
```

## `generic`

在 App 中手动触发，可将节点、策略组或规则作为上下文传给脚本。

```ini
generic script-path=generic.js,tag=通用脚本,img-url=location.fill.viewfinder.system,timeout=300,argument="1234",enable=true
```
