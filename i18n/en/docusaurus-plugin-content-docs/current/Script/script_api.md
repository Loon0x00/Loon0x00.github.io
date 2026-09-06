---
sidebar_position: 3
---

# Script API

This document describes the global variables and methods available in the Loon script runtime. The
examples use JavaScript and can be tested directly in the corresponding script type. Call `$done()`
after an asynchronous API completes. For synchronous APIs, call `$done()` as soon as the result is
available.

## 1. Basic Conventions

### 1.1 Completing a Script

Each script execution should call `$done()` only once. After it is called, Loon submits the script
result and releases the resources used by that execution. Do not call `$done()` before pending HTTP,
DNS, timer, or other asynchronous operations have invoked their callbacks.

### 1.2 Binary Data

APIs that accept binary data use `Uint8Array`:

```javascript
var bytes = new Uint8Array([0x4c, 0x6f, 0x6f, 0x6e]); // Loon
console.log(bytes);
$done();
```

Strings, Base64, hexadecimal values, and passwords are not converted to `Uint8Array` automatically.
The script must encode or decode them first.

### 1.3 Error Handling

- Runtime errors from `$httpClient` and `$dns.query` are returned through callbacks.
- gzip and AES are synchronous APIs. Invalid arguments or operation failures throw exceptions, so
  use `try/catch`.
- Depending on the script runtime, some invalid arguments may produce a `TypeError` or an error with
  an `error.code` property.

### 1.4 Version Requirements for New APIs

The compression, AES, and DNS APIs added in this update require **Loon Build 988 or later**. These
methods are not guaranteed to exist in earlier builds.

| API | Minimum Loon Build |
|---|---:|
| `$utils.gzip` | 988 |
| `$crypto.aes.encrypt` | 988 |
| `$crypto.aes.decrypt` | 988 |
| `$dns.query` | 988 |

## 2. Basic APIs

### 2.1 `console.log(value)`

Writes one entry to the current script log. Objects and `Error` instances are serialized before
being logged. The current interface handles one primary argument per call. To log multiple values,
combine them into an object or string first.

```javascript
console.log({
  message: "Hello Loon",
  time: new Date().toISOString()
});
$done();
```

### 2.2 `setTimeout(callback, delay, ...args)`

Runs the callback once after the specified delay in milliseconds. Any `args` are passed to the
callback unchanged.

| Parameter | Type | Description |
|---|---|---|
| `callback` | `Function` | Function to run after the delay |
| `delay` | `Number` | Delay in milliseconds |
| `...args` | Any | Additional arguments passed to the callback |

```javascript
setTimeout(function (text, count) {
  console.log(text + ": " + count);
  $done();
}, 1000, "timer finished", 1);
```

### 2.3 `setInterval(callback, delay, ...args)`

In the current Loon runtime, `setInterval` behaves like `setTimeout`: it runs only once and does not
repeat automatically. To run something repeatedly, call `setTimeout` again from the callback. The
runtime does not provide reliable companion `clearTimeout` or `clearInterval` APIs.

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

setInterval(runNext, 500); // Schedules the first run only; runNext schedules subsequent runs.
```

## 3. Runtime Context

### 3.1 `$loon`

`$loon` is a string that describes the current device and Loon version, not an object with fields.
Its format may differ between platforms.

```javascript
console.log("runtime: " + $loon);
$done();
```

Possible formats:

```text
iPhone15,2 18.0 3.2.0(1000)
Mac 3.2.0(1000)
```

### 3.2 `$script`

`$script` describes the current script execution.

| Property | Type | Description |
|---|---|---|
| `$script.name` | `String` | Current script name or tag |
| `$script.startTime` | `Date` | Time when the current script started |

```javascript
console.log({
  name: $script.name,
  startedAt: $script.startTime.toISOString(),
  elapsedMs: Date.now() - $script.startTime.getTime()
});
$done();
```

### 3.3 `$argument`

`$argument` contains the argument configured in the Script rule:

- It may be `undefined` or `null` when no argument is configured.
- A regular argument is a `String`.
- A plugin argument list is an `Object` whose field values retain their String, Number, or Boolean
  types.

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

When a manual or Generic script is run from an entry point such as a node or policy,
`$environment.params` contains the entry-point arguments. `$environment` may not exist when no
runtime arguments are available.

Common fields include:

| Property | Description |
|---|---|
| `$environment.params.node` | Node name; legacy field |
| `$environment.params.nodeInfo` | Basic node information without passwords or other sensitive fields |
| `$environment.params.policyGroup` | Name of the related policy group |
| `$environment.params.proxyChainInfo` | Proxy chain information, when available |

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

Request Scripts and Response Scripts can read `$request`.

| Property | Type | Description |
|---|---|---|
| `$request.url` | `String` | Full request URL |
| `$request.method` | `String` | HTTP method |
| `$request.headers` | `Object` | Request headers |
| `$request.h2_trailers` | `Object` | HTTP/2 trailers; usually empty when absent |
| `$request.body` | `String` / `Uint8Array` | Available when the configuration requests the body |

To read the complete body, set `requires_body=true` in the Script rule. If
`binary_body_mode=true` is also set, the body is a `Uint8Array`; otherwise, it is a string.

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

Response Scripts can read both `$request` and `$response`.

| Property | Type | Description |
|---|---|---|
| `$response.status` | `Number` | HTTP status code |
| `$response.headers` | `Object` | Response headers |
| `$response.h2_trailers` | `Object` | HTTP/2 trailers; usually empty when absent |
| `$response.body` | `String` / `Uint8Array` | Available when the configuration requests the body |

```javascript
console.log({
  requestURL: $request.url,
  status: $response.status,
  contentType: $response.headers["Content-Type"] || $response.headers["content-type"],
  bodyLength: $response.body ? $response.body.length : 0
});
$done({});
```

## 4. Configuration APIs

### 4.1 `$config.getConfig()`

Synchronously returns a JSON string containing a summary of the current configuration. Fields may
change between platforms and versions. Call `JSON.parse()` before using the result, and provide
defaults for optional fields.

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

Values of `running_model`:

| Value | Mode |
|---:|---|
| `0` | Global direct |
| `1` | Rule-based |
| `2` | Global proxy |

### 4.2 `$config.setSelectPolicy(policyName, selectName)`

Synchronously changes the current selection of a policy group. The arguments can be two strings or
two string arrays of the same length. A return value of `true` means the call was accepted. `false`
means the policy group, target policy, or arguments are invalid. This operation modifies the current
configuration state.

```javascript
var changed = $config.setSelectPolicy("Node Select", "HK");
console.log("changed: " + changed);
console.log("selected: " + $config.getSelectedPolicy("Node Select"));
$done();
```

Batch form:

```javascript
var changed = $config.setSelectPolicy(
  ["Node Select", "Media Policy"],
  ["HK", "US"]
);
console.log("batch changed: " + changed);
$done();
```

### 4.3 `$config.getSubPolicies(policyName, callback)`

Asynchronously reads the policies available in a policy group. The callback receives a JSON string,
which must be converted to an array with `JSON.parse()`. A nonexistent policy group may return an
empty string. The caller should also rely on the script's own timeout to avoid waiting indefinitely
for an incorrectly named policy group.

```javascript
$config.getSubPolicies("Node Select", function (text) {
  var policies = text ? JSON.parse(text) : [];
  console.log(policies);
  $done();
});
```

### 4.4 `$config.getSelectedPolicy(policyName)`

Synchronously returns the name of the currently selected child policy. It returns an empty value if
the policy group is not found.

```javascript
var selected = $config.getSelectedPolicy("Node Select");
console.log("selected: " + String(selected));
$done();
```

### 4.5 `$config.setRunningModel(model)`

Synchronously sets the Loon running mode. `model` must be `0`, `1`, or `2`. It returns `true` on
success and `false` if the argument is invalid or the setting could not be changed. This method
modifies the global running state.

```javascript
var changed = $config.setRunningModel(1); // Switch to rule-based mode.
console.log("running model changed: " + changed);
$done();
```

### 4.6 Compatibility Aliases

`getPolicy` is the former name of `getSelectedPolicy`, and `getSubPolicys` is the former spelling of
`getSubPolicies`. Existing scripts can continue to use these aliases. New scripts should use the
current names.

```javascript
var selected = $config.getPolicy("Node Select");
console.log("legacy selected: " + String(selected));

$config.getSubPolicys("Node Select", function (text) {
  console.log(text ? JSON.parse(text) : []);
  $done();
});
```

## 5. Persistent Storage

Values are stored as strings. When the key is omitted, `$script.name` is used as the default key.

### 5.1 `$persistentStore.write(value, [key])`

Synchronously writes a string. It returns `true` on success and `false` on failure. Pass `undefined`
or `null` as the value to delete the specified key. Empty strings, `0`, and `false` are handled
differently by different runtimes, so do not use them as a substitute for deletion.

```javascript
var saved = $persistentStore.write("dark", "theme");
console.log("saved: " + saved);
$done();
```

Delete one key:

```javascript
var deleted = $persistentStore.write(undefined, "theme");
console.log("deleted: " + deleted);
$done();
```

### 5.2 `$persistentStore.read([key])`

Synchronously reads a string. It returns an empty value if the key does not exist.

```javascript
var value = $persistentStore.read("theme");
console.log("theme: " + String(value));
$done();
```

### 5.3 `$persistentStore.remove()`

Clears all data saved through the script storage API. This operation does not only delete the
current script's default key. To delete a single item, use `$persistentStore.write(undefined, key)`.
Do not use the return value of `remove()` to determine whether the operation succeeded.

```javascript
// Clears all persistent data saved by scripts. Make sure a complete reset is intended.
$persistentStore.remove();
console.log("persistent store cleared");
$done();
```

## 6. Notifications

### 6.1 `$notification.post(title, subtitle, content, [attach], [delay])`

Submits a system notification.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `title` | `String` | Empty | Title |
| `subtitle` | `String` | Empty | Subtitle |
| `content` | `String` | Empty | Body text |
| `attach` | `String` / `Object` | `null` | A string is a URL opened on tap; see the table below for objects |
| `delay` | `Number` | `0` | Delay in milliseconds |

The `attach` object supports:

| Field | Description |
|---|---|
| `openUrl` | URL to open when the notification is tapped, such as a `loon://` or HTTPS URL |
| `mediaUrl` | URL of an image or media attachment for the notification |
| `clipboard` | Text to write to the clipboard when the notification is tapped |

```javascript
$notification.post(
  "Loon",
  "Script completed",
  "Tap to open the policy page",
  {
    openUrl: "loon://switch",
    mediaUrl: "https://example.com/image.png",
    clipboard: "copied by Loon"
  },
  300
);
$done();
```

Whether the notification is ultimately displayed also depends on system notification permissions
and the notification settings in Loon.

## 7. HTTP Client

### 7.1 Request Methods

```text
$httpClient.get(urlOrOptions, callback)
$httpClient.post(urlOrOptions, callback)
$httpClient.head(urlOrOptions, callback)
$httpClient.delete(urlOrOptions, callback)
$httpClient.put(urlOrOptions, callback)
$httpClient.options(urlOrOptions, callback)
$httpClient.patch(urlOrOptions, callback)
```

All methods use the same callback format:

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

Each line below is a separate example for the corresponding method. An actual script should call
only the method it needs; do not have multiple lines share the callback above, which calls
`$done()`.

```javascript
$httpClient.get("https://example.com/data", handleResponse);
$httpClient.post({url:"https://example.com/data", body:"created"}, handleResponse);
$httpClient.head("https://example.com/data", handleResponse);
$httpClient.delete("https://example.com/data/1", handleResponse);
$httpClient.put({url:"https://example.com/data/1", body:"updated"}, handleResponse);
$httpClient.options("https://example.com/data", handleResponse);
$httpClient.patch({url:"https://example.com/data/1", body:"patched"}, handleResponse);
```

### 7.2 Request Options

The argument can be either a URL string or an object:

```javascript
var options = {
  url: "https://example.com/api",
  timeout: 5000,
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({name:"Loon"}),
  "body-base64": false,
  node: "Node Select",
  "binary-mode": false,
  "auto-redirect": true,
  "auto-cookie": true,
  insecure: true,
  alpn: "h2"
};

$httpClient.post(options, handleResponse);
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `url` | `String` | None | Request URL; required |
| `timeout` | `Number` | `5000` | Connection/request timeout in milliseconds |
| `headers` | `Object` | Empty | Request headers |
| `body` | `String` / `Uint8Array` | Empty | Request body; `Uint8Array` is mainly used with POST/PUT |
| `body-base64` | `Boolean` | `false` | Decode the Base64 body string and send it as binary data; Build 612+ |
| `node` | `String` | Current route | Specify `DIRECT`, a node description, a node name, or a policy group |
| `binary-mode` | `Boolean` | `false` | Force the response body to be returned as `Uint8Array` |
| `auto-redirect` | `Boolean` | `true` | Follow redirects automatically; Build 660+ |
| `auto-cookie` | `Boolean` | `true` | Store and reuse cookies during the same script execution; Build 662+ |
| `insecure` | `Boolean` | `true` | Whether to allow untrusted TLS certificates |
| `alpn` | `String` | `h1` | `h1` or `h2`; Build 715+ |

Send a binary POST request:

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

### 7.3 Callback Arguments

```javascript
function callback(error, response, data) {
  // error: empty on success; usually an error string on failure.
  // response: contains status, headers, and optional h2_trailers on success.
  // data: a string or Uint8Array.
  console.log({error:error, response:response, data:data});
  $done();
}

$httpClient.get("https://example.com/", callback);
```

The structure of `response`:

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

When `binary-mode` is enabled or the response cannot be converted to UTF-8, `data` is returned as a
`Uint8Array`. Otherwise, it is returned as a string. `h2_trailers` is present only when the server
actually returns HTTP/2 trailers and is supported in Build 931 and later.

## 8. Utility APIs

### 8.1 `$utils.geoip(ip)`

Synchronously queries Loon's local GeoIP database for the ISO 3166 country or region code of an
IPv4 or IPv6 address. It returns an empty string or empty value when no match is found.

```javascript
var country = $utils.geoip("1.1.1.1");
console.log("country: " + String(country));
$done();
```

### 8.2 `$utils.ipasn(ip)`

Synchronously queries the local ASN database for the ASN associated with an IP address.

```javascript
var asn = $utils.ipasn("1.1.1.1");
console.log("asn: " + String(asn));
$done();
```

### 8.3 `$utils.ipaso(ip)`

Synchronously queries the local ASN database for the name of the autonomous system organization
associated with an IP address.

```javascript
var organization = $utils.ipaso("1.1.1.1");
console.log("organization: " + String(organization));
$done();
```

### 8.4 `$utils.gzip(data)` (Loon Build 988 or later)

Synchronously compresses a `Uint8Array` into a `Uint8Array` containing a complete gzip header and
trailer.

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

| Parameter | Type | Description |
|---|---|---|
| `data` | `Uint8Array` | Source data; may have a length of 0 |

Returns a `Uint8Array` on success. An invalid argument type or native compression failure throws an
exception. The error code for a native compression failure is `COMPRESSION_FAILED`.

### 8.5 `$utils.ungzip(data)`

Synchronously decompresses a gzip-formatted `Uint8Array` and returns the original `Uint8Array`.

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

Invalid gzip data throws an exception. Runtimes that support error codes use
`DECOMPRESSION_FAILED`.

## 9. AES API

The AES API operates on raw bytes only. `key` must be a 16-, 24-, or 32-byte AES key, not a password
string.

### 9.1 Mode Options

| Mode | IV/Nonce | Padding | AAD | Tag |
|---|---|---|---|---|
| `ecb` | Must be omitted | `pkcs7` / `none` | Not used | None |
| `cbc` | 16 bytes | `pkcs7` / `none` | Not used | None |
| `ctr` | 16 bytes | Not used | Not used | None |
| `gcm` | 12 bytes | Not used | Optional | Returned by encryption and required for decryption; fixed at 16 bytes |

`mode` and `padding` are case-insensitive. The default `padding` for ECB/CBC is `pkcs7`. When
`none` is used, the data length must be a multiple of 16 bytes.

### 9.2 `$crypto.aes.encrypt(data, options)` (Loon Build 988 or later)

Synchronously encrypts data and returns `{ciphertext, tag?}`. Every mode returns
`ciphertext: Uint8Array`. GCM also returns a separate `tag: Uint8Array`; the tag is not appended to
the ciphertext.

| Parameter | Type | Required | Description |
|---|---|---:|---|
| `data` | `Uint8Array` | Yes | Raw plaintext |
| `options.mode` | `String` | Yes | `ecb`, `cbc`, `ctr`, or `gcm` |
| `options.key` | `Uint8Array` | Yes | 16, 24, or 32 bytes |
| `options.iv` | `Uint8Array` | Depends on mode | 16 bytes for CBC/CTR, 12 bytes for GCM, omitted for ECB |
| `options.padding` | `String` | No | `pkcs7` or `none` for ECB/CBC |
| `options.aad` | `Uint8Array` | No | Additional authenticated data for GCM |

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

### 9.3 `$crypto.aes.decrypt(data, options)` (Loon Build 988 or later)

Synchronously decrypts ciphertext and returns the plaintext as a `Uint8Array`. GCM decryption
requires the tag returned by encryption. If the key, nonce, AAD, tag, or ciphertext does not match,
an authentication error is thrown and no unauthenticated plaintext is returned.

| Parameter | Type | Required | Description |
|---|---|---:|---|
| `data` | `Uint8Array` | Yes | Ciphertext without the GCM tag |
| `options.mode` | `String` | Yes | Must match the mode used for encryption |
| `options.key` | `Uint8Array` | Yes | Must match the key used for encryption |
| `options.iv` | `Uint8Array` | Depends on mode | Must match the IV used for encryption |
| `options.padding` | `String` | No | Must match the ECB/CBC padding used for encryption |
| `options.aad` | `Uint8Array` | No | For GCM; must match the encryption AAD byte for byte |
| `options.tag` | `Uint8Array` | Required for GCM | 16-byte authentication tag |

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

AES argument or operation failures generally use `AES_FAILED`. Production scripts must generate
IVs/nonces correctly for CBC, CTR, and GCM. Never reuse a CTR IV or GCM nonce with the same key. ECB
is not suitable for protecting general application data.

## 10. DNS API

### 10.1 `$dns.query(options, callback)` (Loon Build 988 or later)

Asynchronously queries a domain through the Loon DNS stack. The API has no `type` option: each call
always queries both A and AAAA records. The result may also contain CNAME records.

| Parameter | Type | Required | Default | Description |
|---|---|---:|---|---|
| `options.domain` | `String` | Yes | None | A valid domain name |
| `options.protocol` | `String` | No | `auto` | `auto`, `udp`, `doh`, `doh3`, or `quic` |
| `options.server` | `String` | Conditional | Current Loon DNS | Explicit DNS server; required for any protocol other than `auto` |
| `options.timeout` | `Number` | No | `3000` | Timeout for each DNS query round in milliseconds; must be a finite number greater than 0 |
| `callback` | `Function` | Yes | None | `(error, result)`, called once after the query completes |

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

### 10.2 DNS Server Formats

| Protocol | Example `server` |
|---|---|
| UDP | `1.1.1.1:53`, `[2001:4860:4860::8888]:53`, `system` |
| DoH | `https://cloudflare-dns.com/dns-query` |
| DoH3 | `h3://dns.example/dns-query`; an HTTPS URL is also allowed when `doh3` is explicitly specified |
| QUIC/DoQ | `quic://dns.adguard-dns.com:853` |

Specify a protocol explicitly:

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

When `auto` is used or `protocol` is omitted, the server format is detected as follows:

- An IP address, `IP:Port`, or `system`: UDP.
- `http://` or `https://`: DoH.
- `h3://`: DoH3.
- `quic://`: QUIC/DoQ.

`auto + https://` is detected as DoH. To use an HTTPS URL for DoH3, set `protocol:"doh3"`
explicitly.

`timeout` is enforced by Loon's existing DNS state machine and covers both A and AAAA queries.
When a CNAME follow-up, UDP retry, or encrypted DNS fallback occurs, subsequent queries continue to
use the same timeout value. After a timeout, the callback receives a `TIMEOUT` error and `result` is
`null`. The default timeout is 3000 ms. The first DoH, DoH3, or QUIC connection may need more time
on a slower network, so a script can increase the value for its network environment. This option
controls only the DNS query made by the current `$dns.query` call; it does not change the script's
own execution timeout.

### 10.3 DNS Result

On success, `error` is `null` and `result` has the following structure:

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

| Field | Type | Description |
|---|---|---|
| `domain` | `String` | Queried domain |
| `protocol` | `String` | Requested protocol, or the protocol inferred from the server when `auto` is used |
| `server` | `String` | Explicit server, or a description of the default server actually used |
| `fromCache` | `Boolean` | Whether the result came from the DNS cache |
| `answers` | `Array` | A, AAAA, and possible CNAME records |
| `answers[].name` | `String` | Domain name to which the record belongs |
| `answers[].type` | `String` | `A`, `AAAA`, or `CNAME` |
| `answers[].value` | `String` | IP address or CNAME target |
| `answers[].ttl` | `Number` | TTL in seconds; a synthesized CNAME may have a value of 0 |

If the domain does not have one record type or the current network does not support an address
family, the result is not guaranteed to contain both nonempty A and AAAA records.

### 10.4 DNS Errors

On failure, `result` is `null` and `error` is a plain `{code, message}` object.

| Error Code | Description |
|---|---|
| `INVALID_ARGUMENT` | Invalid options or domain, an invalid protocol/server type, or a timeout that is not a finite number greater than 0 |
| `UNSUPPORTED_PROTOCOL` | Unsupported protocol |
| `INVALID_SERVER` | Missing server or a server format that does not match the protocol |
| `TIMEOUT` | Query timed out |
| `NO_ANSWER` | No usable A or AAAA records |
| `QUERY_FAILED` | Query or parsing failed |
| `UNAVAILABLE` / `TUNNEL_UNAVAILABLE` | The current runtime or tunnel cannot perform the query |

If `options` is not an object or `callback` is not a function, the method may synchronously throw an
invalid-argument exception. `options.timeout` controls this DNS query. If the Script rule's own
execution timeout is shorter, the entire script may terminate first.

## 11. `$done()`

### 11.1 Completing a Regular, Cron, or Generic Script

```javascript
console.log("task finished");
$done();
```

A Generic script can return a result object for its caller to display or consume:

```javascript
$done({
  title:"Query completed",
  content:"The current task has finished"
});
```

### 11.2 Passing Through the Original Request or Response

`$done({})` leaves the current request or response unchanged.

```javascript
$done({});
```

### 11.3 Modifying a Request

A Request Script can return `url`, `headers`, `body`, `h2_trailers`, `node`, or `policy`. When
providing `headers`, copy the original headers first to avoid unintentionally deleting other fields.

```javascript
var headers = Object.assign({}, $request.headers || {});
headers["X-Loon-Script"] = "request";

$done({
  url:$request.url,
  headers:headers,
  body:$request.body
});
```

### 11.4 Returning a Response Directly from a Request Script

A Request Script can use `response` to skip the upstream request and generate an HTTP response
directly.

```javascript
$done({
  response:{
    status:200,
    headers:{"Content-Type":"application/json; charset=utf-8"},
    body:JSON.stringify({ok:true, source:"request-script"})
  }
});
```

### 11.5 Modifying a Response

A Response Script can return `status` or `statusCode`, `headers`, `body`, and `h2_trailers`.

```javascript
var headers = Object.assign({}, $response.headers || {});
headers["X-Loon-Script"] = "response";

$done({
  status:200,
  headers:headers,
  body:$response.body
});
```

`body` can be a string or `Uint8Array`. After the response body is changed, Loon handles related
headers such as Content-Length, Transfer-Encoding, and Content-Encoding according to the transport
protocol.

## 12. Public API List

| Category | API |
|---|---|
| Basic | `console.log`, `setTimeout`, `setInterval` |
| Context | `$loon`, `$script`, `$argument`, `$environment`, `$request`, `$response` |
| Configuration | `$config.getConfig`, `$config.setSelectPolicy`, `$config.getSubPolicies`, `$config.getSelectedPolicy`, `$config.setRunningModel` |
| Configuration compatibility | `$config.getPolicy`, `$config.getSubPolicys` |
| Storage | `$persistentStore.write`, `$persistentStore.read`, `$persistentStore.remove` |
| Notifications | `$notification.post` |
| HTTP | `$httpClient.get`, `$httpClient.post`, `$httpClient.head`, `$httpClient.delete`, `$httpClient.put`, `$httpClient.options`, `$httpClient.patch` |
| Utilities | `$utils.geoip`, `$utils.ipasn`, `$utils.ipaso`, `$utils.gzip` (Build 988+), `$utils.ungzip` |
| Encryption | `$crypto.aes.encrypt`, `$crypto.aes.decrypt` (Build 988+) |
| DNS | `$dns.query` (Build 988+) |
| Completion | `$done` |

The full acceptance test for the new data, AES, and DNS APIs is located at:

```text
AI_Home/TestCase/LNScriptDataDNSCryptoAPIs/loon-script-api-test.js
```

The bridge source also contains a small number of debugging methods and compatibility placeholders
that do not yet modify state. They are not part of the public API contract documented here. Scripts
should not rely on these methods being present or returning the same values across platforms.
