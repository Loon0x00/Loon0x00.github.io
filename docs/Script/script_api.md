---
sidebar_position: 3
---

# Script API

本文档说明 Loon 脚本运行时提供的全局变量和方法。示例使用 JavaScript，可以直接放入
对应类型的脚本中测试。异步 API 完成后再调用 `$done()`，同步 API 可以在得到结果后立即
调用 `$done()`。

## 1. 基本约定

### 1.1 脚本完成

每次脚本执行只应调用一次 `$done()`。调用后，Loon 会提交脚本结果并释放本次执行使用的
资源。HTTP、DNS、定时器等异步任务尚未回调时，不要提前调用 `$done()`。

### 1.2 二进制数据

需要传递二进制内容的 API 使用 `Uint8Array`：

```javascript
var bytes = new Uint8Array([0x4c, 0x6f, 0x6f, 0x6e]); // Loon
console.log(bytes);
$done();
```

字符串、Base64、十六进制和密码不会自动转换成 `Uint8Array`，脚本需要先自行编码或解码。

### 1.3 错误处理

- `$httpClient` 和 `$dns.query` 的运行错误通过 callback 返回。
- gzip 和 AES 是同步 API，参数或运算失败时会抛出异常，应使用 `try/catch`。
- 部分参数错误在不同脚本运行时中可能表现为 `TypeError`，也可能带有 `error.code`。

### 1.4 新增 API 的版本要求

本次新增的压缩、AES 和 DNS API 要求 **Loon Build ≥ 988**。低于该 Build 的运行时不保证
存在这些方法。

| API | 最低 Loon Build |
|---|---:|
| `$utils.gzip` | 988 |
| `$crypto.aes.encrypt` | 988 |
| `$crypto.aes.decrypt` | 988 |
| `$dns.query` | 988 |

## 2. 基础 API

### 2.1 `console.log(value)`

向当前脚本日志写入一条记录。对象和 `Error` 会被序列化后记录。当前接口按一次调用的一
个主参数处理，需要输出多个值时，建议先组成对象或字符串。

```javascript
console.log({
  message: "Hello Loon",
  time: new Date().toISOString()
});
$done();
```

### 2.2 `setTimeout(callback, delay, ...args)`

延迟指定毫秒后执行一次 callback。`args` 会原样传入 callback。

| 参数 | 类型 | 说明 |
|---|---|---|
| `callback` | `Function` | 延迟执行的函数 |
| `delay` | `Number` | 延迟时间，单位为毫秒 |
| `...args` | 任意 | 传给 callback 的附加参数 |

```javascript
setTimeout(function (text, count) {
  console.log(text + ": " + count);
  $done();
}, 1000, "timer finished", 1);
```

### 2.3 `setInterval(callback, delay, ...args)`

当前 Loon 运行时中的 `setInterval` 与 `setTimeout` 行为相同，只执行一次，不会自动重复。
需要周期执行时，可以在 callback 中再次调用 `setTimeout`。运行时没有提供可靠的
`clearTimeout` 或 `clearInterval` 配套接口。

```javascript
var count = 0;

function runNext() {
  count += 1;
  console.log("run: " + count);
  if (count < 3) {
    setTimeout(runNext, 500);
  } else {
    $done();
  }
}

setInterval(runNext, 500); // 首次只调度一次，后续由 runNext 自己继续调度。
```

## 3. 运行上下文

### 3.1 `$loon`

`$loon` 是描述当前设备和 Loon 版本的字符串，不是字段对象。不同平台的格式可能不同。

```javascript
console.log("runtime: " + $loon);
$done();
```

可能的格式：

```text
iPhone15,2 18.0 3.2.0(1000)
Mac 3.2.0(1000)
```

### 3.2 `$script`

`$script` 描述本次脚本执行。

| 属性 | 类型 | 说明 |
|---|---|---|
| `$script.name` | `String` | 当前脚本名称或 Tag |
| `$script.startTime` | `Date` | 当前脚本开始执行的时间 |

```javascript
console.log({
  name: $script.name,
  startedAt: $script.startTime.toISOString(),
  elapsedMs: Date.now() - $script.startTime.getTime()
});
$done();
```

### 3.3 `$argument`

`$argument` 是配置在 Script 规则中的参数：

- 未配置参数时可能为 `undefined` 或 `null`；
- 普通参数是 `String`；
- 插件参数列表是 `Object`，字段值保留 String、Number 或 Boolean 类型。

```javascript
var argument = typeof $argument === "undefined" ? null : $argument;

if (argument && typeof argument === "object") {
  console.log("region: " + argument.region);
} else {
  console.log("argument: " + String(argument));
}

$done();
```

### 3.4 `$environment`

手动或 Generic 脚本从节点、策略等入口运行时，Loon 会把入口参数放在
`$environment.params`。没有运行参数时，`$environment` 可能不存在。

常见字段包括：

| 属性 | 说明 |
|---|---|
| `$environment.params.node` | 节点名称；旧版本字段 |
| `$environment.params.nodeInfo` | 节点简要信息，不包含密码等敏感字段 |
| `$environment.params.policyGroup` | 相关策略组名称 |
| `$environment.params.proxyChainInfo` | 代理链信息，存在时提供 |

```javascript
var environment = typeof $environment === "undefined" ? {} : $environment;
var params = environment.params || {};

console.log({
  node: params.node || null,
  nodeInfo: params.nodeInfo || null,
  policyGroup: params.policyGroup || null
});
$done();
```

### 3.5 `$request`

Request Script 和 Response Script 可以读取 `$request`。

| 属性 | 类型 | 说明 |
|---|---|---|
| `$request.url` | `String` | 完整请求 URL |
| `$request.method` | `String` | HTTP 方法 |
| `$request.headers` | `Object` | 请求 Header |
| `$request.h2_trailers` | `Object` | HTTP/2 Trailers，没有时通常为空 |
| `$request.body` | `String` / `Uint8Array` | 配置要求读取 Body 时提供 |

要读取完整 Body，Script 规则需要设置 `requires_body=true`。同时设置
`binary_body_mode=true` 时，Body 使用 `Uint8Array`；否则使用字符串。

```javascript
console.log({
  method: $request.method,
  url: $request.url,
  headers: $request.headers,
  bodyType: typeof $request.body,
  bodyLength: $request.body ? $request.body.length : 0
});
$done({});
```

### 3.6 `$response`

Response Script 可以同时读取 `$request` 和 `$response`。

| 属性 | 类型 | 说明 |
|---|---|---|
| `$response.status` | `Number` | HTTP 状态码 |
| `$response.headers` | `Object` | 响应 Header |
| `$response.h2_trailers` | `Object` | HTTP/2 Trailers，没有时通常为空 |
| `$response.body` | `String` / `Uint8Array` | 配置要求读取 Body 时提供 |

```javascript
console.log({
  requestURL: $request.url,
  status: $response.status,
  contentType: $response.headers["Content-Type"] || $response.headers["content-type"],
  bodyLength: $response.body ? $response.body.length : 0
});
$done({});
```

## 4. 配置 API

### 4.1 `$config.getConfig()`

同步返回当前配置摘要的 JSON 字符串。字段会随平台和版本调整，使用前应先
`JSON.parse()`，并为可选字段提供默认值。

```javascript
var config = JSON.parse($config.getConfig() || "{}");
console.log({
  runningModel: config.running_model,
  globalProxy: config.global_proxy,
  finalPolicy: config.final,
  policyGroups: config.all_policy_groups || []
});
$done();
```

`running_model` 的取值：

| 值 | 模式 |
|---:|---|
| `0` | 全局直连 |
| `1` | 分流 |
| `2` | 全局代理 |

### 4.2 `$config.setSelectPolicy(policyName, selectName)`

同步切换策略组的当前选择。参数可以是两个字符串，也可以是长度相同的两个字符串数组。
返回 `true` 表示调用被接受，返回 `false` 表示策略组、目标策略或参数无效。切换会修改
当前配置状态。

```javascript
var changed = $config.setSelectPolicy("节点选择", "HK");
console.log("changed: " + changed);
console.log("selected: " + $config.getSelectedPolicy("节点选择"));
$done();
```

批量形式：

```javascript
var changed = $config.setSelectPolicy(
  ["节点选择", "媒体策略"],
  ["HK", "US"]
);
console.log("batch changed: " + changed);
$done();
```

### 4.3 `$config.getSubPolicies(policyName, callback)`

异步读取策略组中的可选策略。callback 收到的是 JSON 字符串，需要使用
`JSON.parse()` 转换为数组。传入不存在的策略组时可能返回空字符串；调用方应同时依赖
脚本自身的 timeout，避免一直等待错误名称的策略组。

```javascript
$config.getSubPolicies("节点选择", function (text) {
  var policies = text ? JSON.parse(text) : [];
  console.log(policies);
  $done();
});
```

### 4.4 `$config.getSelectedPolicy(policyName)`

同步返回策略组当前选择的子策略名称；找不到时返回空值。

```javascript
var selected = $config.getSelectedPolicy("节点选择");
console.log("selected: " + String(selected));
$done();
```

### 4.5 `$config.setRunningModel(model)`

同步设置 Loon 运行模式。`model` 必须是 `0`、`1`、`2` 之一。成功返回 `true`，参数无效
或设置失败时返回 `false`。该方法会修改全局运行状态。

```javascript
var changed = $config.setRunningModel(1); // 切换为分流模式。
console.log("running model changed: " + changed);
$done();
```

### 4.6 兼容别名

`getPolicy` 是 `getSelectedPolicy` 的旧名称，`getSubPolicys` 是
`getSubPolicies` 的旧拼写。已有脚本可以继续使用，新脚本建议使用正确名称。

```javascript
var selected = $config.getPolicy("节点选择");
console.log("legacy selected: " + String(selected));

$config.getSubPolicys("节点选择", function (text) {
  console.log(text ? JSON.parse(text) : []);
  $done();
});
```

## 5. 本地存储

存储值以字符串形式保存。省略 Key 时使用 `$script.name` 作为默认 Key。

### 5.1 `$persistentStore.write(value, [key])`

同步写入字符串，成功返回 `true`，失败返回 `false`。使用 `undefined` 或 `null` 作为 value
可以删除指定 Key。不同运行时对空字符串、`0` 和 `false` 的处理不完全一致，不要用它们
代替删除操作。

```javascript
var saved = $persistentStore.write("dark", "theme");
console.log("saved: " + saved);
$done();
```

删除单个 Key：

```javascript
var deleted = $persistentStore.write(undefined, "theme");
console.log("deleted: " + deleted);
$done();
```

### 5.2 `$persistentStore.read([key])`

同步读取字符串。Key 不存在时返回空值。

```javascript
var value = $persistentStore.read("theme");
console.log("theme: " + String(value));
$done();
```

### 5.3 `$persistentStore.remove()`

清空通过脚本存储 API 保存的全部数据。该操作不是删除当前脚本的默认 Key；只需删除一项
时，应使用 `$persistentStore.write(undefined, key)`。`remove()` 的返回值不应作为执行
是否成功的判断依据。

```javascript
// 会清空全部脚本持久化数据，请确认确实需要全量清理。
$persistentStore.remove();
console.log("persistent store cleared");
$done();
```

## 6. 通知

### 6.1 `$notification.post(title, subtitle, content, [attach], [delay])`

提交一条系统通知。

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `title` | `String` | 空 | 标题 |
| `subtitle` | `String` | 空 | 副标题 |
| `content` | `String` | 空 | 正文 |
| `attach` | `String` / `Object` | `null` | 字符串表示点击链接；对象见下表 |
| `delay` | `Number` | `0` | 延迟时间，单位为毫秒 |

`attach` 对象支持：

| 字段 | 说明 |
|---|---|
| `openUrl` | 点击通知后打开的 URL，例如 `loon://` 或 HTTPS URL |
| `mediaUrl` | 通知图片或媒体附件 URL |
| `clipboard` | 点击通知时写入剪贴板的文字 |

```javascript
$notification.post(
  "Loon",
  "脚本执行完成",
  "点击打开策略页面",
  {
    openUrl: "loon://switch",
    mediaUrl: "https://example.com/image.png",
    clipboard: "copied by Loon"
  },
  300
);
$done();
```

通知是否最终展示还会受到系统通知权限和 Loon 通知设置影响。

## 7. HTTP Client

### 7.1 请求方法

```text
$httpClient.get(urlOrOptions, callback)
$httpClient.post(urlOrOptions, callback)
$httpClient.head(urlOrOptions, callback)
$httpClient.delete(urlOrOptions, callback)
$httpClient.put(urlOrOptions, callback)
$httpClient.options(urlOrOptions, callback)
$httpClient.patch(urlOrOptions, callback)
```

所有方法使用相同的 callback：

```javascript
function handleResponse(error, response, data) {
  if (error) {
    console.log("request failed: " + error);
  } else {
    console.log({status: response.status, data: data});
  }
  $done();
}
```

以下每一行都是对应方法的独立调用示例；实际脚本应选择需要的方法执行，不要让多行共用上
面的、会调用 `$done()` 的 callback。

```javascript
$httpClient.get("https://example.com/data", handleResponse);
$httpClient.post({url:"https://example.com/data", body:"created"}, handleResponse);
$httpClient.head("https://example.com/data", handleResponse);
$httpClient.delete("https://example.com/data/1", handleResponse);
$httpClient.put({url:"https://example.com/data/1", body:"updated"}, handleResponse);
$httpClient.options("https://example.com/data", handleResponse);
$httpClient.patch({url:"https://example.com/data/1", body:"patched"}, handleResponse);
```

### 7.2 请求参数

参数可以直接使用 URL 字符串，也可以使用对象：

```javascript
var options = {
  url: "https://example.com/api",
  timeout: 5000,
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({name:"Loon"}),
  "body-base64": false,
  node: "节点选择",
  "binary-mode": false,
  "auto-redirect": true,
  "auto-cookie": true,
  insecure: true,
  alpn: "h2"
};

$httpClient.post(options, handleResponse);
```

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `url` | `String` | 无 | 请求 URL，必填 |
| `timeout` | `Number` | `5000` | 连接/请求超时，单位为毫秒 |
| `headers` | `Object` | 空 | 请求 Header |
| `body` | `String` / `Uint8Array` | 空 | 请求 Body；`Uint8Array` 主要用于 POST/PUT |
| `body-base64` | `Boolean` | `false` | Body 为 Base64 字符串时，将其解码成二进制发送；Build 612+ |
| `node` | `String` | 当前路由 | 指定 `DIRECT`、节点描述、节点名称或策略组 |
| `binary-mode` | `Boolean` | `false` | 强制以 `Uint8Array` 返回响应 Body |
| `auto-redirect` | `Boolean` | `true` | 自动跟随重定向；Build 660+ |
| `auto-cookie` | `Boolean` | `true` | 在同一次脚本执行中保存并复用 Cookie；Build 662+ |
| `insecure` | `Boolean` | `true` | 是否允许不受信任的 TLS 证书 |
| `alpn` | `String` | `h1` | `h1` 或 `h2`；Build 715+ |

发送二进制 POST：

```javascript
var body = new Uint8Array([0x00, 0x01, 0x02, 0xff]);

$httpClient.post({
  url:"https://example.com/upload",
  headers:{"Content-Type":"application/octet-stream"},
  body:body,
  "binary-mode":true
}, function (error, response, data) {
  console.log(error || {status:response.status, responseBytes:data.length});
  $done();
});
```

### 7.3 回调参数

```javascript
function callback(error, response, data) {
  // error：成功时为空，失败时通常为错误字符串。
  // response：成功时包含 status、headers 和可选 h2_trailers。
  // data：字符串或 Uint8Array。
  console.log({error:error, response:response, data:data});
  $done();
}

$httpClient.get("https://example.com/", callback);
```

`response` 的结构：

```text
{
  status: 200,
  headers: {
    "content-type": "application/json"
  },
  h2_trailers: {
    "grpc-status": "0"
  }
}
```

启用 `binary-mode` 或响应无法转换为 UTF-8 时，`data` 返回 `Uint8Array`；其他情况下返回
字符串。`h2_trailers` 仅在服务器实际返回 HTTP/2 Trailers 时存在，适用于 Build 931+。

## 8. 工具 API

### 8.1 `$utils.geoip(ip)`

使用 Loon 本地 GeoIP 数据库同步查询 IPv4 或 IPv6 的 ISO 3166 国家/地区代码。没有匹配
结果时返回空字符串或空值。

```javascript
var country = $utils.geoip("1.1.1.1");
console.log("country: " + String(country));
$done();
```

### 8.2 `$utils.ipasn(ip)`

使用本地 ASN 数据库同步查询 IP 对应的 ASN。

```javascript
var asn = $utils.ipasn("1.1.1.1");
console.log("asn: " + String(asn));
$done();
```

### 8.3 `$utils.ipaso(ip)`

使用本地 ASN 数据库同步查询 IP 对应的自治系统组织名称。

```javascript
var organization = $utils.ipaso("1.1.1.1");
console.log("organization: " + String(organization));
$done();
```

### 8.4 `$utils.gzip(data)`（Loon Build ≥ 988）

同步把 `Uint8Array` 压缩成带完整 gzip Header 和 Trailer 的 `Uint8Array`。

```javascript
var source = new Uint8Array([76, 111, 111, 110, 32, 103, 122, 105, 112]);

try {
  var compressed = $utils.gzip(source);
  console.log({sourceBytes:source.length, gzipBytes:compressed.length});
} catch (error) {
  console.log((error.code || "UNKNOWN") + ": " + error.message);
}
$done();
```

| 参数 | 类型 | 说明 |
|---|---|---|
| `data` | `Uint8Array` | 原始数据，允许长度为 0 |

成功时返回 `Uint8Array`。参数类型错误或压缩失败时会抛出异常；压缩失败的错误码为
`COMPRESSION_FAILED`。

### 8.5 `$utils.ungzip(data)`

同步解压 gzip 格式的 `Uint8Array`，返回原始 `Uint8Array`。

```javascript
try {
  var source = new Uint8Array([1, 2, 3, 4, 5]);
  var compressed = $utils.gzip(source);
  var restored = $utils.ungzip(compressed);
  console.log({restoredBytes:restored.length, firstByte:restored[0]});
} catch (error) {
  console.log((error.code || "UNKNOWN") + ": " + error.message);
}
$done();
```

输入不是有效 gzip 数据时会抛出异常；支持错误码的运行时会使用
`DECOMPRESSION_FAILED`。

## 9. AES API

AES API 只处理原始字节。`key` 是 16、24 或 32 字节 AES Key，不是密码字符串。

### 9.1 模式参数

| 模式 | IV/Nonce | Padding | AAD | Tag |
|---|---|---|---|---|
| `ecb` | 必须省略 | `pkcs7` / `none` | 不使用 | 无 |
| `cbc` | 16 字节 | `pkcs7` / `none` | 不使用 | 无 |
| `ctr` | 16 字节 | 不使用 | 不使用 | 无 |
| `gcm` | 12 字节 | 不使用 | 可选 | 加密返回、解密必填，固定 16 字节 |

`mode` 和 `padding` 不区分大小写。ECB/CBC 的 `padding` 默认是 `pkcs7`；使用 `none` 时，
数据长度必须是 16 字节的整数倍。

### 9.2 `$crypto.aes.encrypt(data, options)`（Loon Build ≥ 988）

同步加密数据，返回 `{ciphertext, tag?}`。所有模式都返回 `ciphertext: Uint8Array`，GCM
额外返回独立的 `tag: Uint8Array`，Tag 不会拼接到密文尾部。

| 参数 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `data` | `Uint8Array` | 是 | 原始明文 |
| `options.mode` | `String` | 是 | `ecb`、`cbc`、`ctr` 或 `gcm` |
| `options.key` | `Uint8Array` | 是 | 16、24 或 32 字节 |
| `options.iv` | `Uint8Array` | 取决于模式 | CBC/CTR 为 16 字节，GCM 为 12 字节，ECB 省略 |
| `options.padding` | `String` | 否 | ECB/CBC 支持 `pkcs7`、`none` |
| `options.aad` | `Uint8Array` | 否 | GCM 附加认证数据 |

```javascript
var key = new Uint8Array(32);
var nonce = new Uint8Array(12);
var plaintext = new Uint8Array([1, 2, 3, 4, 5]);

try {
  var encrypted = $crypto.aes.encrypt(plaintext, {
    mode:"gcm",
    key:key,
    iv:nonce
  });
  console.log({ciphertext:encrypted.ciphertext, tag:encrypted.tag});
} catch (error) {
  console.log((error.code || "UNKNOWN") + ": " + error.message);
}
$done();
```

### 9.3 `$crypto.aes.decrypt(data, options)`（Loon Build ≥ 988）

同步解密密文，成功时返回明文 `Uint8Array`。GCM 解密需要传入加密返回的 Tag；如果 Key、
Nonce、AAD、Tag 或密文不一致，会抛出认证错误，不返回未认证明文。

| 参数 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| `data` | `Uint8Array` | 是 | 密文，不包含 GCM Tag |
| `options.mode` | `String` | 是 | 必须与加密时一致 |
| `options.key` | `Uint8Array` | 是 | 必须与加密时一致 |
| `options.iv` | `Uint8Array` | 取决于模式 | 必须与加密时一致 |
| `options.padding` | `String` | 否 | ECB/CBC 必须与加密时一致 |
| `options.aad` | `Uint8Array` | 否 | GCM 使用，必须与加密时逐字节一致 |
| `options.tag` | `Uint8Array` | GCM 必填 | 16 字节认证 Tag |

```javascript
var key = new Uint8Array(16);
var iv = new Uint8Array(16);
var plaintext = new Uint8Array([76, 111, 111, 110]);

try {
  var encrypted = $crypto.aes.encrypt(plaintext, {
    mode:"cbc",
    key:key,
    iv:iv,
    padding:"pkcs7"
  });
  var decrypted = $crypto.aes.decrypt(encrypted.ciphertext, {
    mode:"cbc",
    key:key,
    iv:iv,
    padding:"pkcs7"
  });
  console.log(decrypted);
} catch (error) {
  console.log((error.code || "UNKNOWN") + ": " + error.message);
}
$done();
```

AES 参数或运算失败时，通常使用 `AES_FAILED`。生产脚本必须为 CBC、CTR 和 GCM 正确生成
IV/Nonce；同一个 Key 下不能重复使用 CTR 的 IV 或 GCM 的 Nonce。ECB 不适合保护一般
业务数据。

## 10. DNS API

### 10.1 `$dns.query(options, callback)`（Loon Build ≥ 988）

通过 Loon DNS 栈异步查询域名。API 没有 `type` 参数，每次固定同时查询 A 和 AAAA；
结果中还可能包含 CNAME。

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---:|---|---|
| `options.domain` | `String` | 是 | 无 | 有效域名 |
| `options.protocol` | `String` | 否 | `auto` | `auto`、`udp`、`doh`、`doh3` 或 `quic` |
| `options.server` | `String` | 条件必填 | 当前 Loon DNS | 显式指定 DNS 服务器；非 `auto` 协议必须提供 |
| `options.timeout` | `Number` | 否 | `3000` | 每轮 DNS 查询的超时时间，单位为毫秒，必须是大于 0 的有限数值 |
| `callback` | `Function` | 是 | 无 | `(error, result)`，查询结束后调用一次 |

```javascript
$dns.query({domain:"example.com"}, function (error, result) {
  if (error) {
    console.log(error.code + ": " + error.message);
  } else {
    console.log({
      protocol:result.protocol,
      server:result.server,
      fromCache:result.fromCache,
      answers:result.answers
    });
  }
  $done();
});
```

### 10.2 DNS 服务器格式

| 协议 | `server` 示例 |
|---|---|
| UDP | `1.1.1.1:53`、`[2001:4860:4860::8888]:53`、`system` |
| DoH | `https://cloudflare-dns.com/dns-query` |
| DoH3 | `h3://dns.example/dns-query`；显式指定 `doh3` 时也可使用 HTTPS URL |
| QUIC/DoQ | `quic://dns.adguard-dns.com:853` |

显式指定协议：

```javascript
$dns.query({
  domain:"example.com",
  protocol:"doh3",
  server:"https://cloudflare-dns.com/dns-query",
  timeout:2000
}, function (error, result) {
  console.log(error || result);
  $done();
});
```

使用 `auto` 或省略 `protocol` 时，服务器格式的识别规则是：

- IP、`IP:Port` 或 `system`：UDP；
- `http://`、`https://`：DoH；
- `h3://`：DoH3；
- `quic://`：QUIC/DoQ。

`auto + https://` 会识别为 DoH。使用 HTTPS URL 执行 DoH3 时，需要显式设置
`protocol:"doh3"`。

`timeout` 同时覆盖 A 和 AAAA 查询。发生 CNAME 续查、UDP 重试或加密 DNS 回落时，后续
查询继续使用同一个超时值。超时后 callback 收到 `TIMEOUT` 错误，
`result` 为 `null`。默认超时时间为 3000ms；DoH、DoH3 或 QUIC 首次连接在较慢网络下可能需要
更长时间，脚本可以根据网络环境显式增大该值。这个参数只控制本次 `$dns.query` 使用的
DNS 查询，不会修改脚本本身的执行超时。

### 10.3 DNS 返回值

成功时 `error` 为 `null`，`result` 的结构如下：

```text
{
  domain: "example.com",
  protocol: "udp",
  server: "1.1.1.1:53",
  fromCache: false,
  answers: [
    {name:"example.com", type:"A", value:"93.184.216.34", ttl:300},
    {name:"example.com", type:"AAAA", value:"2606:2800:220:1::1", ttl:300}
  ]
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `domain` | `String` | 查询域名 |
| `protocol` | `String` | 请求协议，或 `auto` 根据 server 识别后的协议 |
| `server` | `String` | 显式服务器，或实际使用的默认服务器描述 |
| `fromCache` | `Boolean` | 是否来自 DNS 缓存 |
| `answers` | `Array` | A、AAAA 和可能的 CNAME 记录 |
| `answers[].name` | `String` | 记录所属域名 |
| `answers[].type` | `String` | `A`、`AAAA` 或 `CNAME` |
| `answers[].value` | `String` | IP 地址或 CNAME 目标 |
| `answers[].ttl` | `Number` | TTL 秒数；合成的 CNAME 可能为 0 |

域名没有某种记录或当前网络不支持对应地址族时，结果不保证 A 和 AAAA 都非空。

### 10.4 DNS 错误

失败时 `result` 为 `null`，`error` 是 `{code, message}` 普通对象。

| 错误码 | 说明 |
|---|---|
| `INVALID_ARGUMENT` | options 或 domain 无效，protocol/server 类型错误，或 timeout 不是大于 0 的有限数字 |
| `UNSUPPORTED_PROTOCOL` | 不支持的 protocol |
| `INVALID_SERVER` | 缺少服务器，或服务器格式与协议不匹配 |
| `TIMEOUT` | 查询超时 |
| `NO_ANSWER` | 没有可用 A 或 AAAA 记录 |
| `QUERY_FAILED` | 查询或解析失败 |
| `UNAVAILABLE` / `TUNNEL_UNAVAILABLE` | 当前运行环境或 Tunnel 无法执行查询 |

`options` 不是对象或 callback 不是函数时，方法可能同步抛出参数异常。`options.timeout`
控制本次 DNS 查询；如果 Script 规则自身的执行超时更短，脚本可能先被整体终止。

## 11. `$done()`

### 11.1 结束普通、Cron 或 Generic 脚本

```javascript
console.log("task finished");
$done();
```

Generic 脚本可以返回一个结果对象，供调用入口展示或消费：

```javascript
$done({
  title:"查询完成",
  content:"当前任务已经执行完成"
});
```

### 11.2 放行原请求或响应

`$done({})` 表示不修改当前请求或响应。

```javascript
$done({});
```

### 11.3 修改请求

Request Script 可以返回 `url`、`headers`、`body`、`h2_trailers`、`node` 或 `policy`。
提供 `headers` 时应先复制原 Header，避免无意删除其他字段。

```javascript
var headers = Object.assign({}, $request.headers || {});
headers["X-Loon-Script"] = "request";

$done({
  url:$request.url,
  headers:headers,
  body:$request.body
});
```

### 11.4 Request Script 直接返回响应

Request Script 可以用 `response` 跳过上游请求，直接生成 HTTP 响应。

```javascript
$done({
  response:{
    status:200,
    headers:{"Content-Type":"application/json; charset=utf-8"},
    body:JSON.stringify({ok:true, source:"request-script"})
  }
});
```

### 11.5 修改响应

Response Script 可以返回 `status` 或 `statusCode`、`headers`、`body` 和 `h2_trailers`。

```javascript
var headers = Object.assign({}, $response.headers || {});
headers["X-Loon-Script"] = "response";

$done({
  status:200,
  headers:headers,
  body:$response.body
});
```

`body` 可以是字符串或 `Uint8Array`。修改响应 Body 后，Loon 会根据传输协议处理
Content-Length、Transfer-Encoding 和 Content-Encoding 等相关 Header。

## 12. 公开 API 清单

| 分类 | API |
|---|---|
| 基础 | `console.log`、`setTimeout`、`setInterval` |
| 上下文 | `$loon`、`$script`、`$argument`、`$environment`、`$request`、`$response` |
| 配置 | `$config.getConfig`、`$config.setSelectPolicy`、`$config.getSubPolicies`、`$config.getSelectedPolicy`、`$config.setRunningModel` |
| 配置兼容 | `$config.getPolicy`、`$config.getSubPolicys` |
| 存储 | `$persistentStore.write`、`$persistentStore.read`、`$persistentStore.remove` |
| 通知 | `$notification.post` |
| HTTP | `$httpClient.get`、`$httpClient.post`、`$httpClient.head`、`$httpClient.delete`、`$httpClient.put`、`$httpClient.options`、`$httpClient.patch` |
| 工具 | `$utils.geoip`、`$utils.ipasn`、`$utils.ipaso`、`$utils.gzip`（Build 988+）、`$utils.ungzip` |
| 加密 | `$crypto.aes.encrypt`、`$crypto.aes.decrypt`（Build 988+） |
| DNS | `$dns.query`（Build 988+） |
| 完成 | `$done` |
