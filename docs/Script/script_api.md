---
sidebar_position: 2
---

# Script API

## 基础 API

### `console.log()`

在脚本日志中输出内容：

```javascript
console.log("Hello Loon");
```

### `setTimeout()`

延迟指定毫秒后执行回调：

```javascript
setTimeout(() => {
  console.log("Hello Loon");
  $done();
}, 1000);
```

`setTimeout()` 不会阻塞后续代码。请在回调任务完成后调用 `$done()`，否则脚本资源可能提前释放。

## 运行信息

### `$loon`

包含设备名称、系统版本、Loon 版本和 Build 版本。

### `$script`

| 属性 | 说明 |
|---|---|
| `$script.name` | 当前脚本名称 |
| `$script.startTime` | 脚本开始执行的时间 |

## 配置

### `$config.getConfig()`

返回当前配置的 JSON 字符串，主要字段包括：

```javascript
{
  "running_model": 1,
  "all_buildin_nodes": ["DIRECT", "REJECT"],
  "global_proxy": "节点选择",
  "all_policy_groups": ["节点选择", "全球直连"],
  "ssid": "loon-wifi-5g",
  "final": "节点选择",
  "policy_select": {
    "节点选择": "HK",
    "全球直连": "DIRECT"
  }
}
```

`running_model` 的值：

| 值 | 模式 |
|---:|---|
| `0` | 全局直连 |
| `1` | 分流 |
| `2` | 全局代理 |

### `$config.getConfig(policyName, selectName)`

将策略组 `policyName` 切换到 `selectName`。成功返回 `true`，失败返回 `false`。

### `$config.getSubPolicies(policyName, callback)`

获取策略组的子策略，并通过回调返回字符串数组：

```javascript
$config.getSubPolicies("节点选择", (subPolicies) => {
  console.log(subPolicies);
});
```

### `$config.getSelectedPolicy(policyName)`

返回策略组当前选择的子策略名称。

### `$config.setRunningModel(model)`

设置运行模式，`model` 使用上表中的数字。

## 本地存储

### `$persistentStore.write(value, [key])`

保存字符串。成功返回 `true`，失败返回 `false`。未提供 `key` 时，使用当前脚本名称的哈希值。

```javascript
$persistentStore.write("value", "key");
```

### `$persistentStore.read([key])`

读取字符串。未提供 `key` 时，使用当前脚本名称的哈希值。

```javascript
const value = $persistentStore.read("key");
```

### `$persistentStore.remove()`

清除脚本 API 保存的全部本地数据。

## 通知

### `$notification.post()`

```text
$notification.post(title, subtitle, content, attach = null, delay = 0)
```

- `title`：标题。
- `subtitle`：副标题。
- `content`：正文。
- `attach`：跳转链接或附件配置。
- `delay`：延迟时间，单位为毫秒。

点击通知后打开链接：

```javascript
$notification.post(
  "标题",
  "副标题",
  "正文",
  "loon://switch"
);
```

同时设置跳转、媒体和剪贴板内容：

```javascript
const attach = {
  openUrl: "loon://switch",
  mediaUrl: "https://example.com/image.png",
  clipboard: "点击后复制"
};

$notification.post("标题", "副标题", "正文", attach);
```

## 网络请求

### 请求方法

支持以下方法：

```text
$httpClient.get()
$httpClient.post()
$httpClient.head()
$httpClient.delete()
$httpClient.put()
$httpClient.options()
$httpClient.patch()
```

所有方法使用相同的参数和回调格式：

```javascript
$httpClient.get(params, (error, response, data) => {
  if (error) {
    console.log(error);
    $done();
    return;
  }

  console.log(response.status);
  console.log(data);
  $done();
});
```

### 请求参数

```javascript
const params = {
  url: "https://example.com/",
  timeout: 5000,
  headers: {
    "Content-Type": "application/json"
  },
  body: "{}",
  "body-base64": false,
  node: "HK",
  "binary-mode": false,
  "auto-redirect": true,
  "auto-cookie": true,
  alpn: "h2"
};
```

| 参数 | 说明 |
|---|---|
| `url` | 请求 URL |
| `timeout` | 超时时间，单位为毫秒，默认 5000 |
| `headers` | 请求 Header |
| `body` | 请求 Body |
| `body-base64` | 将 Body 作为 Base64 二进制解析；Build 612+ |
| `node` | 指定节点、策略组或 Loon 节点描述 |
| `binary-mode` | 以二进制返回响应 |
| `auto-redirect` | 自动处理重定向，默认 `true`；Build 660+ |
| `auto-cookie` | 自动保存并使用 Cookie，默认 `true`；Build 662+ |
| `alpn` | `h1` 或 `h2`，默认 `h1`；Build 715+ |

同一脚本并发请求相同 Host 时，可以使用 `h2` 提高并发效率。

### 回调参数

```javascript
{
  status: 200,
  headers: {
    "content-length": "200"
  },
  h2_trailers: {
    "grpc-status": "0"
  }
}
```

- `error`：失败原因；成功时为 `null`。
- `response`：状态码、Header 和 HTTP/2 Trailers。
- `data`：响应 Body。启用 `binary-mode` 或内容无法转换为 UTF-8 时返回二进制，否则返回字符串。
- `h2_trailers`：适用于 Build 931 及以上版本。

## 工具

| API | 说明 |
|---|---|
| `$utils.geoip(ip)` | 查询 ISO 3166 国家或地区代码 |
| `$utils.ipasn(ip)` | 查询 ASN |
| `$utils.ipaso(ip)` | 查询 ASO |
| `$utils.ungzip(binary)` | 解压 Gzip 格式的 `Uint8Array` |

## `$done()`

脚本完成后应调用 `$done()`，让 Loon 释放脚本资源。HTTP 请求和响应脚本的返回格式见 [脚本类型](./script.md)。

## `$environment`

仅用于 `generic` 脚本：

| 属性 | 说明 |
|---|---|
| `$environment.params.node` | 节点名称；Build 410 后建议使用 `nodeInfo` |
| `$environment.params.nodeInfo` | 节点的简要信息，不包含敏感字段 |
