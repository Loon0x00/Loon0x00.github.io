---
sidebar_position: 1
sidebar_label: MitM Guide
title: MitM Guide
---

# MitM Guide

Add the following options to the `[MitM]` section of your configuration file:

| Option | Description |
| --- | --- |
| `hostname` | Domains to decrypt, separated by commas. Supports `*` and `?` wildcards. Prefix a domain with `-` to exclude it. |
| `ca-p12` | The full, single-line standard Base64 encoding of the P12 file containing the CA certificate and private key. |
| `ca-passphrase` | The password used when exporting the P12 file. |

## Example

```ini
[MitM]
hostname = example.com, *.example.org, -private.example.org
ca-p12 = <full Base64 content of the P12 file>
ca-passphrase = <P12 password>
```

Replace the placeholders in angle brackets with your own values. `ca-p12` contains a private key, so do not share your configuration file publicly.
