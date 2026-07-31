---
sidebar_position: 1
---

# DNS

Loon supports the following DNS transports:

- Standard UDP
- DNS over HTTPS (DoH)
- DNS over QUIC (DoQ)
- DNS over HTTP/3 (DoH3)

## Example

```ini
[General]
# Standard DNS; system uses the system DNS resolver
dns-server = system,119.29.29.29,223.5.5.5
# Separate multiple servers with commas
doh-server = https://example.com/dns-query
# The default DoQ port is 784
doq-server = quic://example.com:784
doh3-server = h3://example.com/dns-query
```

## Resolution behavior

When standard and encrypted DNS servers (DoH, DoQ, or DoH3) are both configured, Loon prefers encrypted DNS. It queries all valid servers concurrently and uses the first response.

## Cache

Loon uses an in-memory LRU cache and checks it before resolving a domain:

- A valid cached result is used immediately.
- An expired entry is resolved again and updated.
- When no entry exists, Loon queries the configured DNS servers concurrently.

The cache exists only while Loon is running and is cleared when the app closes.

## Fallback

By default, Loon falls back to standard DNS if encrypted DNS fails. You can disable this behavior on the DNS Servers page in the app.
