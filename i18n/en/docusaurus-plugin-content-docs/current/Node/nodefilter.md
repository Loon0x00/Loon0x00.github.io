---
sidebar_position: 2
---

# Node Filters

Node filters quickly create groups from local and subscription nodes, such as a group of Hong Kong nodes or a manually selected set.

## Filter types

- `NodeSelect`: Select nodes manually.
- `NameKeyword`: Filter by keywords in node names.
- `NameRegex`: Filter node names with a regular expression.

## Configuration

Open the configuration page in Loon, select **Node Filter**, and tap the add button in the upper-right corner. New filters include all nodes by default and can be adjusted as needed.

## Common regular expressions

```text
^.*(A|B)      Contains A or B
(A.*B|B.*A)  Contains both A and B
^(?!.*A)     Does not contain A
^(?!.*?B).*A Contains A but not B
```
