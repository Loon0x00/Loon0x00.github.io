---
sidebar_position: 5
---

# Port Rules

Port rules match the source or destination port of a request and require Loon 3.1.7 or later.

They support a single port, a closed range, or a comparison:

```text
443
80-443
>=443
```

## `SRC-PORT`

```ini
SRC-PORT,443,DIRECT
SRC-PORT,80-443,DIRECT
SRC-PORT,>=443,DIRECT
```

## `DEST-PORT`

```ini
DEST-PORT,443,DIRECT
DEST-PORT,80-443,DIRECT
DEST-PORT,>=443,DIRECT
```
