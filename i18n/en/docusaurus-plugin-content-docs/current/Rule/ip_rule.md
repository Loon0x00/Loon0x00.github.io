---
sidebar_position: 3
---

# IP Rules

## IPv4

```ini
IP-CIDR,118.89.204.198/32,no-resolve
```

## IPv6

```ini
IP-CIDR6,2402:4e00:1200:ed00:0:9089:6dac:96b6/128
```

## `GEOIP`

Matches an IP by country or region information in the MMDB:

```ini
geoip,cn,DIRECT
```

## `IP-ASN`

Matches an IP by its ASN:

```ini
IP-ASN,4134,DIRECT,no-resolve
```

### `no-resolve`

With `no-resolve`, a rule only matches requests whose destination is already an IP address. Loon will not perform a DNS lookup for a domain. Add this option to IP-only rules to reduce unnecessary DNS requests.
