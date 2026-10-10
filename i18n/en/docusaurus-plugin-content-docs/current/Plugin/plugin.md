---
sidebar_position: 1
---

# Plugins

A plugin is a reusable partial configuration that can contain General options, IP Rewrite entries, rules, Rewrite entries, scripts, Host mappings, MitM settings, and other sections.

## Complete example

```ini
#!name = Example Plugin
#!desc = Demonstrates plugin metadata and user arguments
#!author = Loon
#!homepage = https://example.com
#!icon = https://example.com/icon.png
#!system = iOS,iPadOS,tvOS,macOS
#!system_version = 15
#!loon_version = 3.5.1(983)
#!date = 2026-10-10
#!tag = Example,Tools
#!type = normal

[Argument]
name = input,"Loon",type=string,tag=Name,desc=Enter a name
region = select,"CN","US","JP",type=string,tag=Region
price = input,9.99,type=number,tag=Price
level = select,1,2,3,type=number,tag=Level
enabled = switch,true,type=boolean,tag=Enabled

[General]
bypass-tun =
skip-proxy =
real-ip =
dns-server =

[Rule]

[Rewrite]

[Host]

[Script]
response if ${url} ~= /^https?:\/\/example\.com\/conf\/server-mapping/ then script("remove_ads.js", {${name}, ${region}, ${price}, ${level}, ${enabled}}) with enable=${enabled}, requires_body=true, tag="Remove ads"

[Mitm]
hostname = example.com
```

## Plugin metadata

Fields beginning with `#!` describe the plugin:

| Field | Description |
|---|---|
| `#!name` | Plugin name |
| `#!desc` | Description |
| `#!author` | Author |
| `#!homepage` | Homepage URL |
| `#!icon` | Icon URL |
| `#!system` | Supported systems, case-insensitive; omit to support all systems |
| `#!system_version` | Minimum system version, such as `15.0` |
| `#!loon_version` | Minimum Loon version, such as `3.5.1(978)` |
| `#!date` | Plugin version date, such as `2026-10-09`; the value is displayed as written |
| `#!tag` | Category tags |
| `#!type` | Plugin type: `normal` or `parser`; defaults to `normal` when omitted |

Loon 3.5.0 (969) supports these plugin types:

- `normal`: Standard plugin.
- `parser`: Resource parser selectable from node, rule, and configuration subscription pages.

## `[General]`

Plugins can declare the following options. Separate list entries with commas. Entries from enabled plugins are appended to the main configuration and deduplicated. Main configuration General options not listed here are not applied through plugins.

| Option | Purpose and example values | Behavior in plugins |
|---|---|---|
| `bypass-tun` | Let IP ranges or domains bypass the TUN, such as `192.168.0.0/16,localhost,*.local` | Merged with bypass entries from the main configuration and other enabled plugins |
| `include-tun` | Route specified IPv4 subnets into the TUN, such as `10.7.0.1/32,10.8.0.0/24` | **Build 1007+**; merged with included routes from the main configuration and other enabled plugins |
| `skip-proxy` | Let IP ranges or domains bypass the HTTP proxy, such as `192.168.0.0/16` | Appended to the main configuration's HTTP proxy bypass list; does not control TUN routing |
| `real-ip` (also accepts `always-real-ip`) | Return real IP addresses for domains, such as `*.example.com` | Appended to the main configuration's real IP domain list |
| `dns-server` | Standard UDP DNS, such as `1.1.1.1,8.8.8.8` | Appends DNS servers without replacing those in the main configuration |
| `doh-server` | DNS over HTTPS, such as `https://doh.dns.apple.com/dns-query` | Appends DoH servers |
| `doq-server` | DNS over QUIC, such as `quic://example.com` | Appends DoQ servers |
| `doh3-server` | DNS over HTTP/3, such as `h3://223.6.6.6/dns-query` | Appends DoH3 servers |
| `ipv6-vif` | `off`: disable the TUN's IPv6 address | **Plugin settings take effect as of Build 1007+**; any enabled plugin explicitly declaring `off` disables IPv6 VIF. Plugins that declare `auto`, `always`, or omit this option leave the main configuration's mode in effect |

For example, a plugin can append bypass addresses and DNS servers:

```ini
[General]
bypass-tun = 192.168.0.0/16,*.local
skip-proxy = 192.168.0.0/16
real-ip = *.example.com
dns-server = 1.1.1.1
doh-server = https://doh.dns.apple.com/dns-query
```

The main configuration determines whether `system` is enabled in `dns-server`; plugins append specific servers. See [General Configuration](../General/general.md) for the complete syntax of the other options.

### Merging the main configuration and plugins

`include-tun` and `bypass-tun` are merged separately. They do not override each other based on whether they come from the main configuration or a plugin, and plugin loading order does not determine route priority.

For example, the main configuration contains:

```ini
[General]
include-tun = 10.7.0.1/32
```

The plugin contains:

```ini
[General]
include-tun = 10.7.0.1/32,10.7.0.2/32
```

The result is `10.7.0.1/32,10.7.0.2/32`, with each route included only once. After disabling the plugin, the main configuration's `10.7.0.1/32` remains, while the plugin-only `10.7.0.2/32` is removed.

### Conflicts between `include-tun` and `bypass-tun`

After merging, if both options cover the same destination, these rules apply: **if the network address and mask are identical, include-tun takes priority; if the masks differ, the more specific route takes priority.** `/32` covers a single IP address and is more specific than `/24` or `/8`.

| include-tun | bypass-tun | Result when accessing 10.7.0.1 |
|---|---|---|
| `10.7.0.1/32` | `10.7.0.1/32` | Enters the TUN; the conflicting bypass route is not published to the system |
| `10.7.0.1/32` | `10.0.0.0/8` | Enters the TUN; the included `/32` route is more specific |
| `10.7.0.0/24` | `10.7.0.1/32` | Bypasses the TUN; the bypass `/32` is more specific |

For example, if the main configuration declares `bypass-tun = 10.7.0.1/32` and a plugin declares `include-tun = 10.7.0.1/32`, traffic enters the TUN. Swapping the configuration sources gives the same result. If the plugin is disabled and no other source provides that included route, the main configuration's bypass route takes effect again.

`include-tun` currently accepts only IPv4 CIDR notation with an explicit prefix length. Domains, bare IP addresses, and IPv6 are not accepted. This option does not support argument binding in either the main configuration or plugins; `${argumentName}`, `{argumentName}`, and `%INSERT%` are not accepted.

## `[IP Rewrite]`

Requires **Build 1007 or later**. This section is supported only in plugins, not in the main configuration.

### Fields and actions

Format: `destination IPv4 address = action`.

```ini
[IP Rewrite]
10.7.0.1 = reflect
10.7.0.2 = reject
10.7.0.3 = drop
```

| Field | Purpose |
|---|---|
| Destination IPv4 address | Exact match for the destination address of a packet entering the TUN; accepts only a single IPv4 address, not CIDR subnets, domains, or IPv6 |
| Action | Supports `reflect`, `reject`, and `drop`, with the behavior described below |

| Action | Behavior on a match |
|---|---|
| `reflect` | Swap the packet's source and destination IP addresses, then write it back to the local network stack; ports and payload remain unchanged |
| `reject` | Reply to TCP packets with RST and to other protocols with an ICMP administratively prohibited message (Type 3 / Code 13), immediately notifying the sender of the rejection. Packets that should not receive a reply, such as existing TCP RST packets and ICMP errors, are discarded directly |
| `drop` | Silently discard the packet without a reply |

Addresses and actions must be written directly; `[Argument]` binding is not supported. Invalid entries or duplicate declarations of `[IP Rewrite]` prevent the entire section from publishing any actions. Valid `[General]` settings are parsed independently.

### Processing priority

1. **First determine whether traffic enters the TUN.** System routing decides whether traffic enters the TUN. Conflicts between `include-tun` and `bypass-tun` follow the routing rules above. This section does not add routes automatically or process requests entering through HTTP/SOCKS proxies.
2. **After entering the TUN, IP Rewrite runs before regular processing.** A match executes the action directly, without proceeding to rule matching, policies, HTTP Rewrite, scripts, or MitM. The packet does not use a proxy or get forwarded to the external network. Unmatched packets continue through the existing flow.
3. **Within a plugin, the first entry for an address wins.** Later entries for the same address do not override the earlier action.
4. **Across plugins, the first enabled plugin for an address wins.** Order follows the main configuration's `[Plugin]` list. Entries for different addresses are merged. There is no fixed priority among `reflect`, `reject`, and `drop`.

For example, plugin A declares `10.7.0.2 = reject` and plugin B declares `10.7.0.2 = drop`:

| Plugin order or state | Effective action |
|---|---|
| A before B, both enabled | `reject` |
| B before A, both enabled | `drop` |
| A disabled, B enabled | `drop` |
| Both A and B disabled | No IP Rewrite action for this address; if traffic still enters the TUN, regular processing resumes |

## `[Argument]`

Requires Build 733 or later. This section declares parameters users can enter or select; the control type determines the generated UI.

### Declaration format and types

```text
name = control type,default or available values,type=value type,tag=label,desc=description
```

`type=` specifies the value type passed to Script and Rewrite and is optional. `tag=` specifies the UI label and `desc=` the parameter description; both are optional.

| Control | Purpose and default value | Supported value types | When `type=` is omitted |
|---|---|---|---|
| `input` | Parameter input; the default value is optional | `string`, `number` | `string` |
| `select` | Single-choice list; the first option is the default | `string`, `number` | `string` |
| `switch` | Toggle; specify `true` or `false` as the default | `boolean` | `boolean` |

`string` represents text; `number` supports integers, decimals, negative numbers, and scientific notation; `boolean` accepts only `true` and `false`. Type names are case-insensitive.

`input/select` do not infer a type from their contents: `input,123` still produces a string. Numeric parameters require `type=number`. Defaults and selectable values must match the declared type. Incompatible control/type combinations, unknown types, and aliases such as `integer`, `float`, and `bool` cannot be parsed.

### Declaration example

The Script and Rewrite examples below share these declarations:

```ini
[Argument]
name = input,"Loon",type=string,tag=Name,desc=Enter a name
region = select,"CN","US","JP",type=string,tag=Region
price = input,9.99,type=number,tag=Price
level = select,1,2,3,type=number,tag=Level
enabled = switch,true,type=boolean,tag=Enabled
cronExpression = input,"0 8 * * *",type=string,tag=Schedule
```

Here, `type=string` and `type=boolean` match the corresponding control defaults and may be omitted. Both `type=number` declarations must remain.

### Use in scripts

The following uses the **new Script syntax available in Loon 3.5.1 (983) and later**. Put `{${argumentName}, ...}` in the second argument of `script(...)` to select plugin parameters. Use `enable=${enabled}` in `with` to control activation and `${cronExpression}` as the Cron expression:

```ini
[Script]
request if ${url} ~= /^https:\/\/example\.com/ then script("request.js", {${name}, ${region}, ${price}, ${level}, ${enabled}}) with enable=${enabled}, tag="Request"

cron ${cronExpression} then script("task.js", {${region}, ${level}}) with enable=${enabled}, timeout=300, tag="Scheduled Task"
```

`request.js` reads the parameters from the `$argument` object, preserving their declared types. With the defaults above:

```javascript
console.log($argument.name);    // "Loon" (String)
console.log($argument.region);  // "CN" (String)
console.log($argument.price);   // 9.99 (Number)
console.log($argument.level);   // 1 (Number)
console.log($argument.enabled); // true (Boolean)
```

The object argument can only list parameters declared by the current plugin. An invalid Cron expression prevents that script from running. See [Script Configuration](../Script/script_v2.md) for the complete syntax.

### Use in Rewrite

Rewrite uses `${argumentName}` to reference the same parameters. This example uses a boolean in the condition, a string to match a request header, and a number as the replacement JSON value:

```ini
[Rewrite]
response if ${enabled} == true && ${url} ~= /^https:\/\/example\.com\/price/ && ${request.header['X-Region']} == ${region} then response.json.replace("data.price", ${price})
```

`${price}` writes the number `9.99`, rather than the string `"9.99"`. See [Rewrite Variables](../Rewrite/rewrite_v2.md#plugin-arguments) for the complete syntax.

## Policies available to plugin rules

Rules in a plugin can use only these policies:

- `DIRECT`
- The `REJECT` family
- `PROXY`

A rule without a policy defaults to `DIRECT`. `PROXY` lets the user select a policy group; if none is configured, Loon follows its normal missing-policy behavior.

## Plugin resources

[Loon Gallery](https://github.com/Peng-YM/Loon-Gallery) contains community-maintained plugins.
