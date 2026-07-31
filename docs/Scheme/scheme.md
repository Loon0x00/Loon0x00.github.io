---
sidebar_position: 1
---

# URL Scheme

URL Scheme 可以从浏览器或其他 App 打开 Loon 并执行指定操作。

## 常用操作

| 操作 | URL |
|---|---|
| 开启 VPN | `loon://on` |
| 关闭 VPN | `loon://off` |
| 编辑配置文件 | `loon://editconfig` |
| 切换为全局直连 | `loon://flowmodel=direct` |
| 切换为分流模式 | `loon://flowmodel=filter` |
| 切换为全局代理 | `loon://flowmodel=proxy` |
| 使用 TUN Only | `loon://proxymode=tun` |
| 使用 HTTP Proxy & TUN | `loon://proxymode=mix` |
| 更新所有订阅资源 | `loon://update?sub=all` |

## 导入资源

导入地址需要先进行 URL 编码，再替换下表中的 `encode(url)`。

| 资源 | URL |
|---|---|
| 远程配置 | `loon://import?sub=encode(url)` |
| 节点订阅 | `loon://import?nodelist=encode(url)` |
| 规则订阅 | `loon://import?rules=encode(url)` |
| 插件 | `loon://import?plugin=encode(url)` |
| 图标集 | `loon://import?iconset=encode(url)` |
| GeoIP 数据库 | `loon://import?geoip=encode(url)` |
| 解析器 | `loon://import?parser=encode(url)` |

## 通用链接

网页无法直接使用自定义 Scheme 时，可以将 `loon://` 替换为：

```text
https://www.nsloon.com/openloon/
```

例如：

```text
loon://on
https://www.nsloon.com/openloon/on
```

两者作用相同。
