---
sidebar_position: 1
---

# Script Types

Every script type can use the [Script API](./script_api.md).

## `http-request`

Runs before a request is sent.

```ini
http-request ^https?:\/\/example\.com script-path=request.js,tag=Request script,requires-body=true,binary-body-mode=false,timeout=10,argument="name=loon",enable=true
```

Common options:

| Option | Description |
|---|---|
| `requires-body` | Whether to read the request body |
| `binary-body-mode` | Whether to read the body as `Uint8Array` |
| `argument` | Value passed to the script; double quotes are recommended |
| `timeout` | Timeout in seconds; defaults to 10 |

Available objects:

| Object | Description |
|---|---|
| `$request.url` | Request URL |
| `$request.method` | Request method |
| `$request.headers` | Request header object |
| `$request.body` | String or Uint8Array; requires `requires-body=true` |
| `$request.h2_trailers` | HTTP/2 trailers; Build 927+ |
| `$response` | `undefined` |

Finish the script with:

```javascript
// Abort the request
$done();

// Keep the request unchanged
$done({});

// Modify the request
$done({
  url: "https://new.example.com/",
  headers: {"X-Loon": "true"},
  h2_trailers: {},
  node: "HK"
});

// Return a response immediately
$done({
  response: {
    status: 200,
    headers: {"Content-Type": "application/json"},
    body: "{}"
  }
});
```

If `headers` or `body` is omitted, the original value is preserved. Use `headers: {}` or `body: ""` to clear it.

## `http-response`

Runs after a response is received.

```ini
http-response ^https?:\/\/example\.com script-path=response.js,tag=Response script,requires-body=true,binary-body-mode=false,timeout=10,argument="name=loon",enable=true
```

The options are the same as `http-request`. Available objects:

| Object | Description |
|---|---|
| `$request` | Original request information |
| `$response.status` | Response status code |
| `$response.headers` | Response header object |
| `$response.body` | String or Uint8Array; requires `requires-body=true` |
| `$response.h2_trailers` | HTTP/2 trailers; Build 927+ |

```javascript
// Keep the response unchanged
$done({});

// Modify the response
$done({
  status: 200,
  headers: {"Content-Type": "application/json"},
  h2_trailers: {},
  body: "{}"
});
```

If `headers`, `body`, or `h2_trailers` is omitted, the original value is preserved. Pass an empty value to clear it.

## `cron`

Runs on a Cron schedule.

```ini
cron "0 8 * * *" script-path=cron.js,tag=Scheduled task,timeout=300,argument="1234",enable=true
```

Two formats are supported:

```text
* * * * *      minute hour day month weekday
* * * * * *    second minute hour day month weekday
```

## `network-changed`

Runs when the network changes. If multiple entries are configured, only the first one runs.

```ini
network-changed script-path=network-changed.js,tag=Network changed,timeout=300,argument="1234",enable=true
```

## `generic`

Runs manually from the app and can receive a node, policy group, or rule as context.

```ini
generic script-path=generic.js,tag=Generic script,img-url=location.fill.viewfinder.system,timeout=300,argument="1234",enable=true
```
