---
sidebar_position: 1
---

# Plugins

A plugin is a reusable partial configuration that can contain rules, Rewrite entries, scripts, Host mappings, MitM settings, and other sections.

## Complete example

```ini
#!name = Example Plugin
#!desc = Demonstrates plugin metadata and user arguments
#!author = Loon
#!homepage = https://example.com
#!icon = https://example.com/icon.png
#!system = iOS,iPadOS,tvOS,macOS
#!system_version = 15
#!loon_version = 3.5.1(978)
#!tag = Example,Tools
#!type = normal

[Argument]
name = input,"Loon",tag=Name,desc=Enter a name
region = select,"CN","US","JP",tag=Region
enabled = switch,true,tag=Enabled

[General]
bypass-tun =
skip-proxy =
real-ip =
dns-server =

[Rule]

[Rewrite]

[Host]

[Script]
http-response ^https?:\/\/example\.com\/conf\/server-mapping script-path=remove_ads.js,requires-body=true,tag=Remove ads,argument=[{name},{region},{enabled}]

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
| `#!tag` | Category tags |
| `#!type` | Plugin type |

Loon 3.5.0 (969) supports these plugin types:

- `normal`: Standard plugin.
- `parser`: Resource parser selectable from node, rule, and configuration subscription pages.

## `[Argument]`

Requires Build 733 or later. This section declares values that the user must enter or select, and Loon generates the corresponding interface automatically.

Basic format:

```text
name = control type,default or available values,tag=label,desc=description
```

Supported controls:

| Type | Description |
|---|---|
| `input` | Text input; the default value is optional |
| `select` | Single-choice list; the first value is the default |
| `switch` | Toggle; defaults to `false` |

```ini
[Argument]
name = input,"Loon",tag=Name
region = select,"CN","US","JP",tag=Region
enabled = switch,true,tag=Enabled
```

### Use in scripts

Pass arguments with `argument`:

```ini
http-request ^https:\/\/example\.com script-path=request.js,argument=[{name},{region},{enabled}]
```

Read them in a script with `$argument.name`, `$argument.region`, and `$argument.enabled`.

Arguments can also be used in Cron expressions:

```ini
cron {cronExpression} script-path=task.js,timeout=300,tag=Run automatically
```

The Cron script will not run if the expression is invalid.

A `switch` argument can control whether a script is enabled:

```ini
http-request ^https:\/\/example\.com script-path=request.js,enable={enabled}
```

### Use in Rewrite

The new Rewrite syntax refers to plugin arguments as `${argumentName}`. See [Rewrite Variables](../Rewrite/rewrite_v2.md#plugin-arguments).

## Policies available to plugin rules

Rules in a plugin can use only these policies:

- `DIRECT`
- The `REJECT` family
- `PROXY`

A rule without a policy defaults to `DIRECT`. `PROXY` lets the user select a policy group; if none is configured, Loon follows its normal missing-policy behavior.

## Plugin resources

[Loon Gallery](https://github.com/Peng-YM/Loon-Gallery) contains community-maintained plugins.
