---
sidebar_position: 2
---

# Script API

## Basic APIs

### `console.log()`

Write a message to the script log:

```javascript
console.log("Hello Loon");
```

### `setTimeout()`

Run a callback after a delay in milliseconds:

```javascript
setTimeout(() => {
  console.log("Hello Loon");
  $done();
}, 1000);
```

`setTimeout()` does not block the code that follows it. Call `$done()` after the callback finishes, or script resources may be released too early.

## Runtime information

### `$loon`

Contains the device name, system version, Loon version, and build number.

### `$script`

| Property | Description |
|---|---|
| `$script.name` | Current script name |
| `$script.startTime` | Time when the script started |

## Configuration

### `$config.getConfig()`

Returns the current configuration as a JSON string. Main fields include:

```javascript
{
  "running_model": 1,
  "all_buildin_nodes": ["DIRECT", "REJECT"],
  "global_proxy": "Node Select",
  "all_policy_groups": ["Node Select", "Global Direct"],
  "ssid": "loon-wifi-5g",
  "final": "Node Select",
  "policy_select": {
    "Node Select": "HK",
    "Global Direct": "DIRECT"
  }
}
```

Values of `running_model`:

| Value | Mode |
|---:|---|
| `0` | Global direct |
| `1` | Rule-based |
| `2` | Global proxy |

### `$config.getConfig(policyName, selectName)`

Switch policy group `policyName` to `selectName`. Returns `true` on success and `false` on failure.

### `$config.getSubPolicies(policyName, callback)`

Gets the child policies of a policy group and passes a string array to the callback:

```javascript
$config.getSubPolicies("Node Select", (subPolicies) => {
  console.log(subPolicies);
});
```

### `$config.getSelectedPolicy(policyName)`

Returns the name of the currently selected child policy.

### `$config.setRunningModel(model)`

Sets the running mode. Use one of the numeric values in the table above.

## Persistent storage

### `$persistentStore.write(value, [key])`

Stores a string. Returns `true` on success and `false` on failure. If `key` is omitted, Loon uses a hash of the current script name.

```javascript
$persistentStore.write("value", "key");
```

### `$persistentStore.read([key])`

Reads a string. If `key` is omitted, Loon uses a hash of the current script name.

```javascript
const value = $persistentStore.read("key");
```

### `$persistentStore.remove()`

Removes all local data saved through the script API.

## Notifications

### `$notification.post()`

```text
$notification.post(title, subtitle, content, attach = null, delay = 0)
```

- `title`: Title.
- `subtitle`: Subtitle.
- `content`: Body text.
- `attach`: Link or attachment settings.
- `delay`: Delay in milliseconds.

Open a URL when the notification is tapped:

```javascript
$notification.post(
  "Title",
  "Subtitle",
  "Content",
  "loon://switch"
);
```

Set a URL, media, and clipboard text together:

```javascript
const attach = {
  openUrl: "loon://switch",
  mediaUrl: "https://example.com/image.png",
  clipboard: "Copy after tapping"
};

$notification.post("Title", "Subtitle", "Content", attach);
```

## Network requests

### Methods

Supported methods:

```text
$httpClient.get()
$httpClient.post()
$httpClient.head()
$httpClient.delete()
$httpClient.put()
$httpClient.options()
$httpClient.patch()
```

Every method uses the same parameters and callback format:

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

### Request parameters

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

| Parameter | Description |
|---|---|
| `url` | Request URL |
| `timeout` | Timeout in milliseconds; defaults to 5000 |
| `headers` | Request headers |
| `body` | Request body |
| `body-base64` | Parse the body as Base64-encoded binary data; Build 612+ |
| `node` | Node, policy group, or Loon node description to use |
| `binary-mode` | Return the response as binary data |
| `auto-redirect` | Follow redirects automatically; defaults to `true`; Build 660+ |
| `auto-cookie` | Save and send cookies automatically; defaults to `true`; Build 662+ |
| `alpn` | `h1` or `h2`; defaults to `h1`; Build 715+ |

When a script sends concurrent requests to the same host, `h2` can improve concurrency.

### Callback values

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

- `error`: Failure reason; `null` on success.
- `response`: Status code, headers, and HTTP/2 trailers.
- `data`: Response body. Returns binary data when `binary-mode` is enabled or the body cannot be decoded as UTF-8; otherwise returns a string.
- `h2_trailers`: Requires Build 931 or later.

## Utilities

| API | Description |
|---|---|
| `$utils.geoip(ip)` | Look up an ISO 3166 country or region code |
| `$utils.ipasn(ip)` | Look up an ASN |
| `$utils.ipaso(ip)` | Look up an ASO |
| `$utils.ungzip(binary)` | Decompress a Gzip `Uint8Array` |

## `$done()`

Call `$done()` when a script finishes so Loon can release its resources. See [Script Types](./script.md) for return formats used by HTTP request and response scripts.

## `$environment`

Available only to `generic` scripts:

| Property | Description |
|---|---|
| `$environment.params.node` | Node name; use `nodeInfo` after Build 410 |
| `$environment.params.nodeInfo` | Brief node information without sensitive fields |
