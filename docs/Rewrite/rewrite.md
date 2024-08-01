---
sidebar_position: 1
---

# 复写
复写是专门用来处理HTTP/HTTPS类型的请求，在请求未发出前，根据所设定的复写类型来修改请求数据，目前可修改URL和Header，**所有的复写仅针对http请求或者经过解密后的https请求有效**

**复写的处理会在规则匹配之前**

## URL 类型复写
此类复写会修改请求的URL
```
^http://www\.google\.cn header http://www.google.com
```
## 直接响应类复写
此类复写直接返回一个code位30x的重定向response
### 302
```
^http://example.com 302 https://example.com
```

### 307
```
^http://example.com 307 https://example.com
```

### reject
1. **reject**: 直接断开连接
2. **reject-200**: 返回一个code为200，body内容为空的response
3. **reject_img**: 返回一个code为200，body内容一像素图片的的response
4. **reject_dict**: 返回一个code为200，body内容为`"{}"`的空json对象字符串
5. **reject_array**: 返回一个code为200，body内容为`"[]"`的空json数组字符串
```
 ^http://example.com reject
 ^http://example.com reject-200
 ^http://example.com reject-img
 ^http://example.com reject-dict
 ^http://example.com reject-array
```

## Request Header 类型复写
此类复写会修改请求的Header
```
 ^http://example.com header-add Connection keep-alive
 ^http://example.com header-del Cookie
 ^http://example.com header-replace User-Agent Unknown
 ^http://example.com header-replace-regex User-Agent regex replace-value //替换User-Agent的值被正则regex匹配到的内容
```

从3.2.1(build 730)开始，可以给一个Request Header类型的Rewrite设置修改多个值，如：
```
 ^http://example.com header-add Connection keep-alive Proxy-Connection keep-alive //header中添加Connection:keep-alive和Proxy-Connection:keep-alive
 ^http://example.com header-del Cookie Connection
 ^http://example.com header-replace User-Agent Unknown Content-Length 1999 Content-Type application/json
 ^http://example.com header-replace-regex User-Agent regex replace-value Cookie UUID=123 UUID=456
```

## Request Body 类型复写 (build 729+)
此类复写会修改请求体
```
^http://example.com request-body-replace-regex regex1 replace-value1 regex2 replace-value2
^http://example.com mock-request-body data-type=text data="" 
^http://example.com mock-request-body data-type=json data-path=request_body.json
^http://example.com mock-request-body data-type=png data-path=request_body.raw mock-data-is-base64=true
```
- data-type: body的类型，`json`,`text`,`css`,`html`,`javascript`,`plain`,`png`,`gif`,`jpeg`,`tiff`,`svg`,`mp4`,`form-data`
- data: body的值，用双引号包裹，data-type为base64时，是一段base64字符串
- data-path: body的文件路径，用双引号包裹，可以是url，也可以是iClcoud/Mock路径下的文件全名
- mock-data-is-base64：如果data或者data-path提供的数据是二进制的base64字符串，设置此配置为true

## Response Header 类型复写 (build 729+)
此类复写会修改响应的Header
```
 ^http://example.com response-header-add Connection keep-alive
 ^http://example.com response-header-del Cookie
 ^http://example.com response-header-replace User-Agent Unknown
 ^http://example.com response-header-replace-regex User-Agent regex replace-value
```
同Reqeust Header，从3.2.1(build 730)开始可以配置多个key-value修改Response Header

## Response Body 类型复写 (build 729+)
此类复写会修改响应体
```
^http://example.com response-body-replace-regex regex1 replace-value1 regex2 replace-value2
^http://example.com mock-response-body data-type=text data="" status-code=200
^http://example.com mock-response-body data-type=json data-path=response_body.json status-code=200
^http://example.com mock-response-body data-type=svg data-path=response_body.raw mock-data-is-base64=true status-code=200
```

- data-type: body的类型，`json`,`text`,`css`,`html`,`javascript`,`plain`,`png`,`gif`,`jpeg`,`tiff`,`svg`,`mp4`,`form-data`
- data: body的值，用双引号包裹，data-type为base64时，是一段base64字符串
- data-path: body的文件路径，用双引号包裹，可以是url，也可以是iClcoud/Mock路径下的文件全名
- mock-data-is-base64：如果data或者data-path提供的数据是二进制的base64字符串，设置此配置为true
- status-code: Http response status code