---
sidebar_position: 1
sidebar_label: MitM 使用指南
title: MitM 使用指南
---

# MitM 使用指南

在配置文件的 `[MitM]` 部分填写以下参数：

| 参数 | 说明 |
| --- | --- |
| `hostname` | 需要解密的域名，多个域名用英文逗号分隔。支持 `*`、`?` 通配符；在域名前加 `-` 表示排除。 |
| `ca-p12` | CA 证书和私钥的 P12 文件内容，使用标准 Base64 编码后填入完整的单行字符串。 |
| `ca-passphrase` | 导出该 P12 文件时设置的密码。 |

## 配置示例

```ini
[MitM]
hostname = example.com, *.example.org, -private.example.org
ca-p12 = <P12 文件的完整 Base64 内容>
ca-passphrase = <P12 密码>
```

示例中的尖括号内容需要替换为真实值。`ca-p12` 包含私钥，请勿公开分享配置文件。
