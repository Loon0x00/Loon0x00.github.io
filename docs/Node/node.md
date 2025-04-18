---
sidebar_position: 1
---

# 节点（代理服务器）

一个节点表示一个代理服务器，你可以手动添加单个节点，也可以通过链接下载订阅节点。**Loon 本身不提供任何的节点**

## 订阅节点

订阅节点是你的服务提供商提供的节点的集合，Loon只负责下载、解析这些节点，在Loon App中是无法修改这些节点的，如需修改请联系您的订阅提供商

### 关于订阅节点的流量明细
目前Loon会读取订阅响应header中的Subscription-Userinfo信息，具体格式如下：
```
Subscription-Userinfo:upload=1111;download=111;total=123456;expire=1614527045
```

## 代理服务协议
代理服务协议指的是在进行网络传输的过程中客户端和服务端需要遵循的一种数据组装格式，只有服务端和客户端使用相同的协议，两者才能进行正常的数据交互，我们每天在网络中接触到的协议有HTTP，HTTPS等

### Loon支持以下协议
- ShadowSocks (stream/aead/2022)
    - ShadowSocks + shadow-tls2/3
    - ShadowSocks + simpleObfs
    - ShadowSocks + simpleObfs + shadow-tls2/3
- ShadowSocksR
    - ShadowSocksR + shadow-tls2/3
- VMESS
    - VMESS + TLS
    - VMESS + WebSocket
    - VMESS + WebSocket + TLS
    - VMESS + HTTP
    - VMESS + HTTP + TLS
- VLESS
    - VLESS + WebSocket
    - VLESS + HTTP
    - VLESS + xtls-rprx-vision + reality
- Trojan
    - Trojan + WebSocket
    - Trojan + HTTP
- HTTP
- HTTPS
- Socks5
- Wireguard
- Hysteria2
- Custom by JS

**截止 3.2.1（727）Loon所支持的协议中仅 HTTP/S 和 Custom by JS 协议不支持UDP中继**

同时，Loon也支持使用JavaScript进行自定义代理协议，可参考[使用JS自定义HTTP代理](https://github.com/Loon0x00/LoonExampleConfig/blob/master/Script/http.js)

## 节点格式
如果要在配置文件中手动添加、修改单个节点，请遵从下面的格式
```
#ss
# 节点名称 = 协议，服务器地址，端口，加密方式，密码，fast-open=是否开启fast open（需要节点支持），udp=是否在UDP中使用（需要节点支持）,udp-port=shadow-tls由于暂时不支持udp转发，这里填写原ss 端口用作UDP转发
ss1 = Shadowsocks,example.com,443,aes-128-gcm,"password",fast-open=false,udp=true
ss2 = Shadowsocks,example2.com,443,chacha20,"password",fast-open=true,udp=true
ss3 = Shadowsocks,example2.com,443,2022-blake3-aes-128-gcm,"MjdlZmY4YWIyZDU0OGNkNw==:YmY2N2QzZjctMjYxMi00MA==",fast-open=true,udp=true,shadow-tls-password=1,shadow-tls-sni=douyin.com,shadow-tls-version=3,udp-port=8396

#ss+simple obfs
# 节点名称 = 协议，服务器地址，端口，加密方式，密码，混淆方式=http|tls，obfs-host=混淆host，obfs-uri=混淆路径，fast-open=是否开启fast open（需要节点支持），udp=是否在UDP中使用（需要节点支持）
ssObfs1 = Shadowsocks,example.com,80,aes-128-gcm,"password",obfs-name=http,obfs-host=www.micsoft.com,obfs-uri=/,fast-open=true,udp=true
ssObfs2 = Shadowsocks,example.com,443,aes-128-gcm,"password",obfs-name=tls,obfs-host=www.micsoft.com,obfs-uri=/,fast-open=true,udp=true

#ssr
# 节点名称 = 协议，服务器地址，端口，加密方式，密码，protocol = 协议，protocol-param = 协议参数，obfs=混淆，obfs-param=混淆参数，fast-open=是否开启fast open（需要节点支持），udp=是否在UDP中使用（需要节点支持）
ssr1 = ShadowsocksR,example.com,443,aes-256-cfb,"password",protocol=origin,obfs=http_simple,obfs-param=download.windows.com,fast-open=false,udp=true
ssr2 = ShadowsocksR,example.com,10076,aes-128-cfb,"password",protocol=auth_chain_a,protocol-param=9555:loon,obfs=http_post,obfs-param=download.windows.com,fast-open=false,udp=true
ssr3 = ShadowsocksR,example.com,10076,chacha20,"password",protocol=auth_aes128_md5,protocol-param=9555:loon,obfs=tls1.2_ticket_auth,obfs-param=download.windows.com,fast-open=false,udp=true
ssr4 = ShadowsocksR,example.com,10076,chacha20-ietf,"password",protocol=auth_aes128_sha1,protocol-param=9555:loon,obfs=plain,fast-open=false,udp=true

#http
# 节点名称 = 协议，服务器地址，端口，加密方式，密码
http1 = http,example.com,80
http2 = http,example.com,80,username,"password"

#https
# 节点名称 = 协议，服务器地址，端口，加密方式，密码，skip-cert-verify=是否跳过证书校验（默认否），sni=SNI，tls-pubkey-sha256=服务器证书公钥的SHA256指纹，tls-cert-sha256=服务器证书的SHA256指纹
https1 = https,example.com,8080
# 如果username中包含英文逗号，请使用双引号包裹username
https2 = https,example.com,8080,"user,name","password"
https3 = https,example.com,443,username,"password",skip-cert-verify=true,sni=example.com,tls-pubkey-sha256=	
a1eab144ec9186933ef4ffd56fab7e3681dcd94a1ab7a0ca522a38f9ed8ebe1b,tls-cert-sha256=377A27032578E64BF5F8CA5E90192E0DB2DCD53B275D4E53BAA50307C51C189E

#socks5
# 节点名称 = 协议，服务器地址，端口，加密方式，密码，skip-cert-verify=是否跳过证书校验（默认否），sni=SNI，tls-pubkey-sha256=服务器证书公钥的SHA256指纹，tls-cert-sha256=服务器证书的SHA256指纹，udp=是否在UDP中使用（需要节点支持）
socks5 = socks5,example.com,443,username,"password",skip-cert-verify=true,sni=example.com,udp=true
# 如果username中包含英文逗号，请使用双引号包裹username
socks5 = socks5,example.com,8080,"user,name","password"

#vmess+tcp
# 节点名称 = 协议，服务器地址，端口，加密方式，UUID，transport(传输方式)=tcp，alterId=alterId（默认0，表示开启aead），udp=是否在UDP中使用（需要节点支持）
vmess1 = vmess,example.com,10086,aes-128-gcm,"52396e06-041a-4cc2-be5c-8525eb457809",transport=tcp,alterId=0,over-tls=false,udp=true

#vmess+tcp+tls
# 节点名称 = 协议，服务器地址，端口，加密方式，UUID，transport(传输方式)=tcp，alterId=alterId（默认0，表示开启aead），over-tls=是否启用TLS，sni=SNI，skip-cert-verify=是否跳过证书校验（默认否），tls-pubkey-sha256=服务器证书公钥的SHA256指纹，tls-cert-sha256=服务器证书的SHA256指纹，udp=是否在UDP中使用（需要节点支持）
vmess2 = vmess,example.com,10086,aes-128-gcm,"52396e06-041a-4cc2-be5c-8525eb457809",transport=tcp,alterId=0,path=/,host=v3-dy-y.ixigua.com,over-tls=true,sni=example.com,skip-cert-verify=true,udp=true

#vmess+ws
# 节点名称 = 协议，服务器地址，端口，加密方式，UUID，transport(传输方式)=ws，alterId=alterId（默认0，表示开启aead），path=websocket握手header中的path，host=websocket握手header中的host，udp=是否在UDP中使用（需要节点支持）
vmess3 = vmess,example.com,10086,aes-128-gcm,"52396e06-041a-4cc2-be5c-8525eb457809",transport=ws,alterId=0,path=/,host=v3-dy-y.ixigua.com,over-tls=false,udp=true

#vmess+wss
# 节点名称 = 协议，服务器地址，端口，加密方式，UUID，transport(传输方式)=ws，alterId=alterId（默认0，表示开启aead），path=websocket握手header中的path，host=websocket握手header中的host，over-tls=是否启用TLS，sni=SNI，skip-cert-verify=是否跳过证书校验（默认否），tls-pubkey-sha256=服务器证书公钥的SHA256指纹，tls-cert-sha256=服务器证书的SHA256指纹，udp=是否在UDP中使用（需要节点支持）
vmess4 = vmess,example.com,10086,aes-128-gcm,"52396e06-041a-4cc2-be5c-8525eb457809",transport=ws,alterId=0,path=/,host=v3-dy-y.ixigua.com,over-tls=true,sni=example.com,skip-cert-verify=true,udp=true

#vmess+http
# 节点名称 = 协议，服务器地址，端口，加密方式，UUID，transport(传输方式)=http，alterId=alterId（默认0，表示开启aead），path=httpheader中的path，host=httpheader的host，udp=是否在UDP中使用（需要节点支持）
vmess5 = vmess,example.com,10086,aes-128-gcm,"52396e06-041a-4cc2-be5c-8525eb457809",transport=http,alterId=0,path=/,host=v3-dy-y.ixigua.com,over-tls=false,udp=true

#vmess+http+tls
# 节点名称 = 协议，服务器地址，端口，加密方式，UUID，transport(传输方式)=http，alterId=alterId（默认0，表示开启aead），path=httpheader中的path，host=httpheader的host，over-tls=是否启用TLS，sni=SNI，skip-cert-verify=是否跳过证书校验（默认否），tls-pubkey-sha256=服务器证书公钥的SHA256指纹，tls-cert-sha256=服务器证书的SHA256指纹，udp=是否在UDP中使用（需要节点支持）
vmess6 = vmess,example.com,10086,aes-128-gcm,"52396e06-041a-4cc2-be5c-8525eb457809",transport=http,alterId=0,path=/,host=v3-dy-y.ixigua.com,over-tls=true,sni=example.com,skip-cert-verify=true,udp=true

#VLESS+tcp
# 节点名称 = 协议，服务器地址，端口，UUID，transport(传输方式)=tcp，udp=是否在UDP中使用（需要节点支持）
VLESS1 = VLESS,example.com,10086,"52396e06-041a-4cc2-be5c-8525eb457809",transport=tcp,over-tls=false,udp=true

#VLESS+tcp+tls
# 节点名称 = 协议，服务器地址，端口，UUID，transport(传输方式)=tcp，over-tls=是否启用TLS，sni=SNI，skip-cert-verify=是否跳过证书校验（默认否），tls-pubkey-sha256=服务器证书公钥的SHA256指纹，tls-cert-sha256=服务器证书的SHA256指纹，udp=是否在UDP中使用（需要节点支持）
VLESS2 = VLESS,example.com,10086,"52396e06-041a-4cc2-be5c-8525eb457809",transport=tcp,path=/,host=v3-dy-y.ixigua.com,over-tls=true,sni=example.com,skip-cert-verify=true,udp=true

#VLESS+ws
# 节点名称 = 协议，服务器地址，端口，UUID，transport(传输方式)=ws，path=websocket握手header中的path，host=websocket握手header中的host，udp=是否在UDP中使用（需要节点支持）
VLESS3 = VLESS,example.com,10086,"52396e06-041a-4cc2-be5c-8525eb457809",transport=ws,path=/,host=v3-dy-y.ixigua.com,over-tls=false,udp=true

#VLESS+wss
# 节点名称 = 协议，服务器地址，端口，UUID，transport(传输方式)=ws，path=websocket握手header中的path，host=websocket握手header中的host，over-tls=是否启用TLS，sni=SNI，skip-cert-verify=是否跳过证书校验（默认否），tls-pubkey-sha256=服务器证书公钥的SHA256指纹，tls-cert-sha256=服务器证书的SHA256指纹，udp=是否在UDP中使用（需要节点支持）
VLESS4 = VLESS,example.com,10086,"52396e06-041a-4cc2-be5c-8525eb457809",transport=ws,path=/,host=v3-dy-y.ixigua.com,over-tls=true,sni=example.com,skip-cert-verify=true

#VLESS+http
# 节点名称 = 协议，服务器地址，端口，UUID，transport(传输方式)=http，path=httpheader中的path，host=httpheader的host，udp=是否在UDP中使用（需要节点支持）
VLESS5 = VLESS,example.com,10086,"52396e06-041a-4cc2-be5c-8525eb457809",transport=http,path=/,host=v3-dy-y.ixigua.com,over-tls=false,udp=true

#VLESS+http+tls
# 节点名称 = 协议，服务器地址，端口，UUID，transport(传输方式)=http，path=httpheader中的path，host=httpheader的host，over-tls=是否启用TLS，sni=SNI，skip-cert-verify=是否跳过证书校验（默认否），tls-pubkey-sha256=服务器证书公钥的SHA256指纹，tls-cert-sha256=服务器证书的SHA256指纹，udp=是否在UDP中使用（需要节点支持）
VLESS6 = VLESS,example.com,10086,"52396e06-041a-4cc2-be5c-8525eb457809",transport=http,path=/,host=v3-dy-y.ixigua.com,over-tls=true,sni=example.com,skip-cert-verify=true,udp=true

#VLESS + xtls-rprx-vision + reality
# 节点名称 = 协议，服务器地址，端口，UUID，transport(传输方式)=tcp，flow=目前固定是xtls-rprx-vision，public-key=reality的服务器公钥，sni=对应服务端的serverName
VLESS6 = VLESS,192.168.2.11,2345,"ae521383-9375-2e0d-c347-48cf3d98eb6e",transport=tcp,flow=xtls-rprx-vision,public-key="LgJ9bNTyUqBLFkDA12-QgEL7c1yQ1ztk-V1Q-3OLXSk",short-id=164168844958a16d,udp=true,over-tls=true,sni=douyin.com,skip-cert-verify=true

#trojan
# 节点名称 = 协议，服务器地址，端口，alpn=tls扩展，skip-cert-verify=是否跳过证书校验（默认否），sni=SNI，udp=是否在UDP中使用（需要节点支持），tls-pubkey-sha256=服务器证书公钥的SHA256指纹，tls-cert-sha256=服务器证书的SHA256指纹
trojan1 = trojan,example.com,443,"password",alpn=http1.1,skip-cert-verify=false,sni=example.com,udp=true

#trojan+ws
# 节点名称 = 协议，服务器地址，端口，alpn=tls扩展，transport(传输方式)=ws，path=websocket握手header中的path，host=websocket握手header中的host，skip-cert-verify=是否跳过证书校验（默认否），sni=SNI，udp=是否在UDP中使用（需要节点支持），tls-pubkey-sha256=服务器证书公钥的SHA256指纹，tls-cert-sha256=服务器证书的SHA256指纹
trojan2 = trojan,example.com,443,"password",transport=ws,path=/,host=micsoft.com,alpn=http1.1,skip-cert-verify=true,sni=example.com,udp=true

#trojan+http
# 节点名称 = 协议，服务器地址，端口，alpn=tls扩展，transport(传输方式)=http，path=httpheader中的path，host=httpheader的host，skip-cert-verify=是否跳过证书校验（默认否），sni=SNI，udp=是否在UDP中使用（需要节点支持）
trojan2 = trojan,example.com,443,"password",transport=ws,path=/,host=micsoft.com,alpn=http1.1,skip-cert-verify=true,sni=example.com,udp=true

#Wireguard
wireguardNode = wireguard,interface-ip=192.168.2.2,interface-ipV6=2402:4e00:1200:ed00:0:9089:6dac:96b6,private-key="qF22B3ezOhWGJA4SHwQSsgMa9d6mPGHyFdZMaDTae2E=",mtu=1280,dns=192.168.2.1,dnsV6=2402:4e00:1200:ed00:0:9089:6dac:96b6,keeyalive=45,peers=[{public-key="JFuTIJEcFnt8R04UnAE5o2WfIPJUsumSxsD2ayXzoWY=",preshared-key="yVNv5K05AwVnWaR4OB8BlMX3jJlkS74aKlYC3PD95IE=",reserved=[1,2,3],allowed-ips="0.0.0.0/0",endpoint=192.168.3.17:51820}],udp=true

#Hysteria2
# 节点名称 = 协议，服务器地址，端口，密码，skip-cert-verify=是否跳过证书校验（默认否），sni=SNI，tls-pubkey-sha256=服务器证书公钥的SHA256指纹，tls-cert-sha256=服务器证书的SHA256指纹，udp=是否在UDP中使用（需要节点支持），fast-open=是否开启fast open，salamander-password=salamander obfs的密码
hysteria2Node = Hysteria2,example.com,9898,"password",skip-cert-verify=true,sni=example.com,udp=true,fast-open=true，salamander-password=password,udp=true

#js custom
# 节点名称 = 协议，服务器地址，端口，script-path=脚本路径（本地脚本直接为文件名，远端脚本为url）
jsHTTP = custom,192.168.1.139,6152,script-path=http.js
```

除了可以解析官方定义的节点格式，Loon也可以解析大部分服务提供商所提供的订阅节点，如遇到不支持的情况可以使用节点订阅解析脚本进行解析，目前常用的解析脚本由[SubStore](https://github.com/sub-store-org)提供，可在配置文件的general模块下进行如下配置，在之后的添加订阅节点页面开启解析器即可。
```
resource-parser = https://raw.githubusercontent.com/Peng-YM/Sub-Store/master/backend/dist/sub-store-parser.loon.min.js
```

## 节点的TLS各参数说明
- skip-cert-verify: 是否跳过证书验证，默认验证证书，Loon会验证服务端证书的以下几项 1.证书颁发机构是否来自系统默认信任的机构 2.证书是否过期 3.证书中的SNI是否与设定的相同；如果节点服务用的是自建证书，关闭此项或者将证书安装到iOS系统中，并进行信任
- sni: TLS握手时会传递给服务端，不填写时使用代理服务器主机名作为SNI
- tls-cert-sha256: 用于SSL pinning，可使用openssl生成，skip-cert-verify = false时有效，tls-pubkey-sha256有值时，此项无效
- tls-pubkey-sha256: 用于SSL pinning，可使用openssl生成，skip-cert-verify = false时有效
```
//生成证书your-cert.pem的tls-cert-sha256
openssl x509 -noout -fingerprint -sha256 -inform pem -in your-cert.pem

/*
生成证书your-cert.pem的tls-pubkey-sha256
1. 从your-cert.pem中获取公钥server_pubkey.pem
2. 生成公钥的sha256指纹
*/
openssl x509 -pubkey -noout -in your-cert.pem > server_pubkey.pem

openssl pkey -pubin -in server_pubkey.pem -outform DER | openssl dgst -sha256
```