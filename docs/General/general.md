---
sidebar_position: 1
---

# 其他配置
#### 该部分主要包含配置文件中 [general]模块下的参数解释

## bypass-tun
目前iOS设备上的流量有两种方式传递给Loon，分别是HTTP Proxy和TUN（可以简单理解为虚拟网卡），bypass-tun则和TUN有关，如果配置了该参数，那么所配置的这些IP段、域名就会不交给Loon来处理，系统直接处理
```
bypass-tun = 192.168.0.0/16,localhost,*.local
```
## skip-proxy
和上面类似，skip-proxy则和HTTP Proxy有关，如果配置了该参数，那么所配置的这些IP段、域名将不会转发到Loon，而是由系统处理
```
skip-proxy = 192.168.0.0/16
```
## dns-server
udp类的dns服务器，用,隔开多个服务器，system表示系统dns
```
dns-server = system,1.1.1.1
```
## doh-server
DNS over HTTPS服务器，用,隔开多个服务器
```
doh-server = https://doh.dns.apple.com/dns-query
```
## doq-server
DNS over QUIC服务器，用,隔开多个服务器，默认端口784
```
doh-server = quic://example.com, quic://example2.com
```
## doh3-server
DNS over HTTPS服务器，用,隔开多个服务器
```
doh3-server = h3://223.6.6.6/dns-query
```
## ipv6 
**3.2.3+ build(754) 开始弃用**

~~是否允许IPV6的请求，开启后会进行DNS AAAA记录查询，并且优先使用IPV6的IP~~

## ip-mode
**3.2.3+ build(754)**

目前支持以下类型
- ipv4-only: 只使用 IPv4 进行请求，不发起 AAAA 的 DNS 查询，拒绝所有 IPv6 连接
- dual: 并发发起 A 和 AAAA 的 DNS 查询，优先使用响应速度更快的结果，不判断是否是IPv4或者IPv6
- ipv4-preferred: 并发发起 A 和 AAAA 的 DNS 查询，优先使用 IPv6 结果，如无 IPv6 记录则切换到 IPv4 结果
- ipv6-Preferred: 并发发起 A 和 AAAA 的 DNS 查询，优先使用 IPv4 结果，如无 IPv4 记录则切换到 IPv6 结果

```
ip-mode = dual
```

## allow-wifi-access
是否开启局域网代理访问
```
allow-wifi-access = true
```
## wifi-access-http-port
开启局域网访问后的http代理端口
```
wifi-access-http-port = 8899
```
## wifi-access-socks5-port
开启局域网访问后的socks5代理端口
```
wifi-access-socks5-port = 8898
```
## proxy-test-url
测速所用的测试链接，如果策略组没有自定义测试链接就会使用这里配置的
```
proxy-test-url = http://cp.cloudflare.com/generate_204
```
## internet-test-url
检测网络可用性时的链接，一般填写可以直连访问的链接
```
internet-test-url = http://wifi.vivo.com.cn/generate_204
```
## test-timeout
节点测速时的超时秒数
```
test-timeout = 5
```
## switch-node-after-failure-times
一个节点连接失败几次后会进行节点切换，默认3次
```
switch-node-after-failure-times = 2
```
## resource-parser
订阅资源解析器链接，推荐Peng大的sub-store订阅节点解析器
```
resource-parser = https://github.com/sub-store-org/Sub-Store/releases/latest/download/sub-store-parser.loon.min.js
```
## ssid-trigger
当切换到某一特定的WiFi下时改变Loon的流量模式，如"loon-wifi5g":DIRECT，表示在loon-wifi5g这个wifi网络下使用直连模式，"cellular":PROXY，表示在蜂窝网络下使用代理模式，"default":RULE，默认使用分流模式
```
ssid-trigger = "loon-wifi5g":DIRECT,"cellular":PROXY,"default":RULE
```
## real-ip
有些app会自己去请求DNS获取IP，这样导致有些域名类型的规则无法进行匹配，所以Loon是用了FakeIP来解决这个问题，原理是截取这些DNS请求，返回一个假的IP响应，然后在获取到这个假的IP的请求时将相关域名映射到请求中；但是有时候系统的一些域名会缓存这些假IP，导致关闭Loon后会用这个假的IP直接发起请求，这就会导致一些问题，针对这种情况可以配置real-ip来使这些域名返回真实的ip
```
real-ip = *.apple.com,*.icloud.com
```

## hijack-dns 
**3.2.5 (build 789+)**

有些app会自己使用自定义的DNS over UDP来解析IP，可以配置相关IP:端口来劫持这些查询，并返回fakeip的响应
```
// *:53 表示所有53端口
// *:0 所有
// 8.8.8.8 所有8.8.8.8的查询
hijack-dns = *:53,8.8.8.8
```

## interface-mode
指定流量使用哪个网络接口进行转发，目前包含三种模式:
- Auto: 系统自动分配
- Cellular: 在WiFi和蜂窝数据都开启的情况下指定使用蜂窝网络
- Performace: 在WiFi和蜂窝数据都开启的情况下使用最优的网络接口
- Balance: 在WiFi和蜂窝数据都开启的情况下，均衡使用网络接口
```
interface-mode = Performace
```

## force-http-engine-hosts
**3.2.3+ build(787) 开始弃用**

~~有些app使用原始的tcp来进行HTTP请求，此参数会强制Loon将原始TCP请求视为HTTP请求处理，以使所有高级功能可用，例如抓包、复写和脚本处理等。为了性能考虑，Loon默认只会处理80端口的这些原始TCP请求。其他端口需要在这里指定相关的域名或者端口。~~
```
# :8080，表示解析所有8080端口，0表示解析所有端口
# 通配符域名，解析所有端口下的相关域名
force-http-engine-hosts = *.baid.com,:8080
```
## disable-udp-ports
禁用udp协议的一些端口
```
disable-udp-ports = 443,80
```
## disable-stun
禁用stun是否禁用stun协议的udp数据，禁用后可以有效解决webrtc的ip泄露
```
disable-stun = true
```
## geoip-url
自定义geoip数据库的下载地址

## ipasn-url
**3.2.3+ build(754)**
自定义asn数据库的下载地址

## udp-fallback-mode
**3.2.0+ build(702)**

当UDP的流量规则匹配到相关节点，但该节点不支持UDP或未未开启UDP转发时使用的策略，可选`DIRECT`、`REJECT`

```
udp-fallback-mode = REJECT
```

## domain-reject-mode
**3.2.0+ build(702)**

域名拒绝规则执行的阶段
- DNS：使用 LoopbackIP、No Answer 或 NXDomain 的方式阻止 DNS 查询以达到拦截请求的目的
- Request：在请求转发阶段拦截请求

⚠️ 在 HTTP Proxy & TUN 模式下由于拦截到的系统 DNS 较少，大部分的拦截都会在转发请求阶段进行。
```
domain-reject-mode = DNS
```

## dns-reject-mode
**3.2.0+ build(702)**

在DNS阶段拒绝域名时采用的方式
- LOOPBACKIP：回环IP
- NOANSWER：DNS响应为空
- NXDOMAIN：错误码为3的DNS响应

```
dns-reject-mode = LOOPBACKIP
```
