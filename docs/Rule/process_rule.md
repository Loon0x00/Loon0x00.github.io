---
sidebar_position: 6.5
---

# 进程规则

进程规则按发起请求的可执行文件名称或路径选择策略，**仅在 macOS 上生效**。iOS 和 tvOS 忽略进程规则；包含进程条件的整条逻辑规则也会被忽略。

## 语法

```ini
PROCESS-NAME,表达式,策略
```

`策略`可以是 `DIRECT`、`REJECT`，也可以是配置中的节点或策略组名称。

根据表达式的形式，使用以下三种匹配方式：

| 表达式形式 | 匹配方式 | 示例 |
| --- | --- | --- |
| 不以 `/` 开头 | 可执行文件名称，支持精确和通配匹配 | `curl`、`*Helper*` |
| 以 `/` 开头，不以 `/` 结尾 | 完整可执行文件路径，支持精确和通配匹配 | `/usr/bin/curl`、`/Applications/*.app/Contents/MacOS/*` |
| 以 `/` 开头，并以 `/` 结尾 | 字面目录前缀 | `/Applications/Google Chrome.app/` |

表达式包含逗号时使用双引号包围。以下路径均为示例，应按实际可执行文件路径填写。

## 按名称匹配

名称匹配使用实际发起请求的可执行文件名，**不区分大小写**：

```ini
PROCESS-NAME,curl,DIRECT
PROCESS-NAME,Google Chrome,PROXY
PROCESS-NAME,*Helper*,PROXY
PROCESS-NAME,Worker?,DIRECT
```

`curl` 可以匹配 `curl` 或 `Curl`。`*Helper*` 可以匹配名称中包含 `Helper` 的进程；`Worker?` 可以匹配 `Worker1` 等名称。

应用的主进程和辅助进程可能具有不同名称。名称依据实际可执行文件，不使用应用显示名称、父进程名称、PID 或 Bundle Identifier。

## 按完整路径匹配

完整路径匹配**区分大小写**，匹配整个可执行文件路径：

```ini
PROCESS-NAME,/usr/bin/curl,DIRECT
PROCESS-NAME,/Applications/Google Chrome.app/Contents/MacOS/Google Chrome,PROXY
PROCESS-NAME,/Applications/*.app/Contents/MacOS/*,PROXY
PROCESS-NAME,/*/Worker[0-9],DIRECT
```

精确路径只匹配该路径对应的可执行文件。通配路径中的 `*` 可以跨越 `/`，因此可能覆盖多层目录。

路径直接使用系统返回的可执行文件路径，不额外解析符号链接，也不进行 Unicode 归一化。

## 按目录前缀匹配

目录表达式必须以 `/` 结尾，**区分大小写**，按字面前缀匹配：

```ini
PROCESS-NAME,/Applications/Google Chrome.app/,PROXY
PROCESS-NAME,/opt/homebrew/bin/,DIRECT
```

第一条可以匹配该应用目录下的主程序和辅助程序；第二条匹配完整可执行文件路径位于 `/opt/homebrew/bin/` 下的进程。

目录模式中的 `*`、`?`、`[]` 都作为普通字符，不进行通配。若需要目录通配，应使用不以 `/` 结尾的完整路径模式，例如：

```ini
PROCESS-NAME,/Applications/*.app/*,PROXY
```

## 通配匹配

名称和完整路径使用 `fnmatch` 的通配语义，匹配整个名称或路径，不是正则表达式：

| 写法 | 含义 |
| --- | --- |
| `*` | 匹配零个或多个字符；路径模式中可以跨 `/` |
| `?` | 匹配一个字符 |
| `[abc]` | 匹配字符集合中的一个字符 |
| `[0-9]` | 匹配范围中的一个字符 |

反斜杠 `\` 作为普通字符，不用于转义通配符。名称仍按不区分大小写处理，路径仍区分大小写。

## 与逻辑规则组合

进程条件可以作为 `AND`、`OR`、`NOT` 的子规则：

```ini
AND,((PROCESS-NAME,curl),(DOMAIN-SUFFIX,example.com)),DIRECT
OR,((PROCESS-NAME,curl),(PROCESS-NAME,*Helper*)),PROXY
NOT,((PROCESS-NAME,curl)),PROXY
AND,((PROCESS-NAME,/Applications/Google Chrome.app/),(DEST-PORT,443)),PROXY
```

`AND` 要求所有条件满足，`OR` 要求任一条件满足，`NOT` 对其唯一子规则取反。也可以使用嵌套逻辑规则：

```ini
NOT,((AND,((PROCESS-NAME,curl),(DOMAIN-SUFFIX,example.com)))),PROXY
```

无法识别进程名称时，名称条件不命中；无法取得路径时，路径和目录条件不命中。依赖未知进程信息的 `NOT` 不会因此反向命中。名称已知而路径未知时，名称规则仍可以匹配。

## 匹配优先级

进程规则参与 Loon 现有规则比较：本地规则优先于插件规则，插件规则优先于订阅规则；同一来源内按现有配置顺序比较。

进程规则不会因为表达式更精确或目录更长而获得额外优先级。需要优先执行的规则应放在相应配置的前面。
