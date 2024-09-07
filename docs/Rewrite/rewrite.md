---
sidebar_position: 1
---

# 复写
复写是专门用来处理HTTP/S类型的请求，在请求未发出前和获取响应后，根据所设定的复写类型来修改请求数据，可修改请求的URL、Header、Body以及响应的Header、Body，**所有的复写仅在http请求或者经过解密后的https请求中有效**

**复写的处理会在规则匹配之前**

## 匹配优先级
和规则的优先级一样，**本地配置文件中的复写 > 插件中的复写**，相同文件中的复写，优先级**自上而下越来越低**。

## 多次匹配
Loon的复写对一个HTTP/S的两侧进行作用，请求侧和响应侧，两侧复写会分别进行匹配，请求侧和响应侧复写可以作用于同一个HTTP/S中。从3.2.3（749）开始多个同一侧的复写可以作用于一个HTTP/S中，前提是多个同侧复写的正则表达式要一致，如果使用不同的正则表达式却可以匹配同一个url，那优先级高的那个复写才会起作用，所以**如果要多个同侧复写作用于一个HTTP/S，请使用相同的正则表达式进行匹配**。

### 多次匹配注意事项
- 不同侧的复写可以同时匹配一个HTTP/S
- 多个同侧复写匹配时，采用的修改方式是叠加修改，即**第一个复写修改的输出作为第二个修改的输入**，所以如果修改的内容相同，后面的会覆盖前面的修改

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

**注意：由于在解析配置是用空格分割各个参数，如果配置的参数中有空格，请使用`\x20`代替**

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
^http://example.com request-body-json-add data.apps[0] {"appName":"loon","appVersion":"3.2.1"} data.category tool
^http://example.com request-body-json-replace data.ad {}
^http://example.com request-body-json-del data.ad
```
request-body-json-xxx 类型的复写只有当请求体是Json格式时才会有效，提供一个定位到要处理的json对象的keypath即可添加、删除、替换相关json对象，keypath采用点分式，如 `data.apps[0].appname`,`[0]`表示数组第一个对象，如果keypath无法定位到json对象的子对象，或者数组越界，keypath无效。

## Mock Request Body
此类复写使用一个假数据模拟 Http request body
```
^http://example.com mock-request-body data-type=text data="" 
^http://example.com mock-request-body data-type=json data-path=request_body.json
^http://example.com mock-request-body data-type=png data-path=request_body.raw mock-data-is-base64=true
```
- data-type: body的类型，`json`,`text`,`css`,`html`,`javascript`,`plain`,`png`,`gif`,`jpeg`,`tiff`,`svg`,`mp4`,`form-data`
- data: body的值，用双引号包裹，**由于data会加载到内存中，建议采用data-path的方式配置中大型的Mock Data**
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
^http://example.com response-body-json-add data.apps[0] {"appName":"loon","appVersion":"3.2.1"} data.category tool
^http://example.com response-body-json-replace data.ad {}
^http://example.com response-body-json-del data.ad
```
response-body-json-xxx 类型的复写只有当响应体是Json格式时才会有效，提供一个定位到需要处理的json对象的keypath即可添加、删除、替换相关json对象，keypath采用点分式，如 `data.apps[0].appname`,`[0]`表示数组第一个对象，如果keypath无法定位到json对象的子对象，或者数组越界，keypath无效。

## Mock Request Body
此类复写立即返回一个 Http request body
```
^http://example.com mock-response-body data-type=text data="" status-code=200
^http://example.com mock-response-body data-type=json data-path=response_body.json status-code=200
^http://example.com mock-response-body data-type=svg data-path=response_body.raw mock-data-is-base64=true status-code=200
```

- data-type: body的类型，`json`,`text`,`css`,`html`,`javascript`,`plain`,`png`,`gif`,`jpeg`,`tiff`,`svg`,`mp4`,`form-data`
- data: body的值，用双引号包裹，**由于data会加载到内存中，建议采用data-path的方式配置中大型的Mock Data**
- data-path: body的文件路径，用双引号包裹，可以是url，也可以是iClcoud/Mock路径下的文件全名
- status-code: Http response status code
- mock-data-is-base64：如果data或者data-path提供的数据是二进制的base64字符串，设置此配置为true
- status-code: Http response status code

**⚠️⚠️⚠️注意⚠️⚠️⚠️**

**如果正则表达式或者替换的内容包含空格，请使用`\x20`表示，否则rewrite配置会解析异常**

**如果正则表达式或者替换的内容包含空格，请使用`\x20`表示，否则rewrite配置会解析异常**

**如果正则表达式或者替换的内容包含空格，请使用`\x20`表示，否则rewrite配置会解析异常**

