"use strict";(self.webpackChunkmy_website=self.webpackChunkmy_website||[]).push([[7056],{7077:(e,n,r)=>{r.r(n),r.d(n,{assets:()=>l,contentTitle:()=>c,default:()=>x,frontMatter:()=>d,metadata:()=>t,toc:()=>o});var s=r(4848),i=r(8453);const d={sidebar_position:1},c="\u811a\u672c\u7c7b\u578b",t={id:"Script/script",title:"\u811a\u672c\u7c7b\u578b",description:"http-request",source:"@site/docs/Script/script.md",sourceDirName:"Script",slug:"/Script/",permalink:"/docs/Script/",draft:!1,unlisted:!1,tags:[],version:"current",sidebarPosition:1,frontMatter:{sidebar_position:1},sidebar:"tutorialSidebar",previous:{title:"\u811a\u672c",permalink:"/docs/category/\u811a\u672c"},next:{title:"Script API",permalink:"/docs/Script/script_api"}},l={},o=[{value:"http-request",id:"http-request",level:2},{value:"\u914d\u7f6e\u8bed\u6cd5",id:"\u914d\u7f6e\u8bed\u6cd5",level:3},{value:"http-response",id:"http-response",level:2},{value:"\u914d\u7f6e\u8bed\u6cd5",id:"\u914d\u7f6e\u8bed\u6cd5-1",level:3},{value:"cron",id:"cron",level:2},{value:"\u914d\u7f6e\u8bed\u6cd5",id:"\u914d\u7f6e\u8bed\u6cd5-2",level:3},{value:"network-changed",id:"network-changed",level:2},{value:"\u914d\u7f6e\u8bed\u6cd5",id:"\u914d\u7f6e\u8bed\u6cd5-3",level:3},{value:"generic",id:"generic",level:2},{value:"\u914d\u7f6e\u8bed\u6cd5",id:"\u914d\u7f6e\u8bed\u6cd5-4",level:3}];function h(e){const n={a:"a",code:"code",h1:"h1",h2:"h2",h3:"h3",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,i.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(n.h1,{id:"\u811a\u672c\u7c7b\u578b",children:"\u811a\u672c\u7c7b\u578b"}),"\n",(0,s.jsx)(n.h2,{id:"http-request",children:"http-request"}),"\n",(0,s.jsx)(n.p,{children:"\u5728\u83b7\u5f97\u4e00\u4e2ahttp\u8bf7\u6c42\u65f6\u89e6\u53d1\uff0c\u53ef\u914d\u7f6e\u7684\u53c2\u6570\uff1a"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"requires-body = true"}),"\u4ee3\u8868\u662f\u5426\u83b7\u53d6http\u8bf7\u6c42\u7684body"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"binary-body-mode = true"}),"\u4ee3\u8868\u83b7\u53d6http\u8bf7\u6c42\u7684body\u7c7b\u578b\u4e3aUint8Array"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:'argument = "name=loon&version=2.1.0"'}),"\u811a\u672c\u4e2d\u53ef\u4ee5\u901a\u8fc7\u53d8\u91cf",(0,s.jsx)(n.code,{children:"$argument"}),"\u83b7\u53d6\uff0c",(0,s.jsx)(n.strong,{children:"\u4e3a\u4e86\u80fd\u591f\u51c6\u786e\u89e3\u6790\u5230\u53c2\u6570\uff0c\u8bf7\u5c06\u53c2\u6570\u7528\u53cc\u5f15\u53f7\u5305\u88f9"})]}),"\n"]}),"\n",(0,s.jsx)(n.h3,{id:"\u914d\u7f6e\u8bed\u6cd5",children:"\u914d\u7f6e\u8bed\u6cd5"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{children:'http-request ^https?:\\/\\/(www.)?(example)\\.com script-path=localscript.js,tag = requestScript,requires-body = true,timeout = 10,binary-body-mode = false,argument = "1234",enable=true\n'})}),"\n",(0,s.jsx)(n.p,{children:"\u811a\u672c\u9ed8\u8ba4\u6267\u884c\u8d85\u65f6\u65f6\u95f410s\uff0c\u6b64\u7c7b\u811a\u672c\u4e2d\u53ef\u4ee5\u4f7f\u7528\u5982\u4e0b\u53d8\u91cf\uff0c"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:["\u6240\u6709",(0,s.jsx)(n.a,{href:"/docs/Script/script_api",children:"Script API"})]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"$request"}),": \u4e00\u4e2ahttp\u8bf7\u6c42\u4fe1\u606f","\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"$request.url"}),": String\u7c7b\u578b\uff0c\u8bf7\u6c42URL"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"$request.method"}),": String\u7c7b\u578b\uff0c\u8bf7\u6c42\u65b9\u6cd5"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"$request.headers"}),": js\u5bf9\u8c61\uff0c\u8bf7\u6c42\u5934"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"$request.body"}),": String\u6216\u8005Uint8Array\u7c7b\u578b\uff0c\u5f53",(0,s.jsx)(n.code,{children:"requires-body = true"}),"\u65f6\u624d\u6709\u503c\uff0c\u8bf7\u6c42\u7684body"]}),"\n"]}),"\n"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"$response"}),": undefined"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"$done()"}),"\u65b9\u6cd5\u53c2\u6570\u8bf4\u660e\uff1a","\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"$done()"}),": \u4e0d\u4f20\u4efb\u4f55\u53c2\u6570\uff0c\u8868\u793a\u653e\u5f03\u8be5\u8bf7\u6c42\uff0c\u8bf7\u6c42\u8fde\u63a5\u4f1a\u76f4\u63a5\u65ad\u5f00"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"$done({})"}),": \u7a7ajs\u5bf9\u8c61\uff0c\u8bf7\u6c42\u7ee7\u7eed\uff0c\u4efb\u4f55\u8bf7\u6c42\u53c2\u6570\u4e0d\u4f1a\u6709\u4efb\u4f55\u53d8\u5316"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:'$done({url:"https://new.example.com/",headers:{},node:"HK"})'}),": url\u53c2\u6570\u66ff\u6362\u539f\u6765\u7684url\uff0cheaders\u66ff\u6362\u539f\u6765\u7684request headers\uff0cnode\u53c2\u6570\u8868\u793a\u8be5\u8bf7\u6c42\u540e\u7eed\u7528\u6307\u5b9a\u7684\u7b56\u7565\u7ec4\uff08\u4e5f\u53ef\u4ee5\u662f\u8282\u70b9\u540d\u79f0\uff09\u8fdb\u884c\u8bf7\u6c42\uff08build 534\u7248\u672c\u5f00\u59cb\u9002\u7528\uff09"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:'$done({response:{   status:200,   headers:{},   body:""   }})'}),": \u76f4\u63a5\u5411\u8be5\u8bf7\u6c42\u8fd4\u56de\u4e00\u4e2a\u5047\u7684\u54cd\u5e94\uff0cbody\u7c7b\u578b\u53ef\u4ee5\u662fString\u6216\u8005Uint8Array\uff0c",(0,s.jsx)(n.strong,{children:"\u5982\u679cbody\u7684\u957f\u5ea6\u5927\u4e8e0\uff0c\u4f1a\u81ea\u52a8\u8ba1\u7b97headers\u4e2d\u7684content-length\uff0ccontent-encoding\u4e5f\u4f1a\u6839\u636ebody\u7c7b\u578b\u81ea\u52a8\u751f\u6210"}),"\n",(0,s.jsx)(n.strong,{children:"\u6ce8\u610f"})," \u5f53$done()\u53c2\u6570\u7684\u5bf9\u8c61\u4e2d\u7684request\u4e0d\u5305\u542bheaders\u6216\u8005body\u65f6\uff0c\u8868\u793a\u4f7f\u7528\u539f\u8bf7\u6c42\u7684headers\u548cbody\uff0c\u5982\u679c\u8981\u6e05\u9664\u539f\u8bf7\u6c42\u7684body\u65f6\uff0c\u53c2\u6570\u7684",(0,s.jsx)(n.code,{children:'body=""'}),"\u5373\u53ef\uff0c\u6e05\u9664\u539fheaders\u7684\u8bdd",(0,s.jsx)(n.code,{children:"headers={}"})]}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,s.jsx)(n.h2,{id:"http-response",children:"http-response"}),"\n",(0,s.jsxs)(n.p,{children:["\u5728\u83b7\u5f97\u4e00\u4e2ahttp\u54cd\u5e94\u65f6\u89e6\u53d1\uff0c\u53c2\u6570",(0,s.jsx)(n.code,{children:"requires-body = true"}),"\u4ee3\u8868\u662f\u5426\u83b7\u53d6http\u54cd\u5e94\u7684body"]}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"requires-body = true"}),"\u4ee3\u8868\u662f\u5426\u83b7\u53d6http\u8bf7\u6c42\u7684body"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"binary-body-mode = true"}),"\u4ee3\u8868\u83b7\u53d6http\u8bf7\u6c42\u7684body\u7c7b\u578b\u4e3aUint8Array"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:'argument = "name=loon&version=2.1.0"'}),"\u811a\u672c\u4e2d\u53ef\u4ee5\u901a\u8fc7\u53d8\u91cf",(0,s.jsx)(n.code,{children:"$argument"}),"\u83b7\u53d6\uff0c",(0,s.jsx)(n.strong,{children:"\u4e3a\u4e86\u80fd\u591f\u51c6\u786e\u89e3\u6790\u5230\u53c2\u6570\uff0c\u8bf7\u5c06\u53c2\u6570\u7528\u53cc\u5f15\u53f7\u5305\u88f9"})]}),"\n"]}),"\n",(0,s.jsx)(n.h3,{id:"\u914d\u7f6e\u8bed\u6cd5-1",children:"\u914d\u7f6e\u8bed\u6cd5"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{children:'http-response ^https?:\\/\\/(www.)?(example)\\.com script-path=https://example.com/loon.js,timeout=10,requires-body = true,tag = responseScript,enable=true,timeout = 10,binary-body-mode = false,argument = "1234",enable=true\n'})}),"\n",(0,s.jsx)(n.p,{children:"\u811a\u672c\u9ed8\u8ba4\u6267\u884c\u8d85\u65f6\u65f6\u95f410s\uff0c\u6b64\u7c7b\u811a\u672c\u4e2d\u53ef\u4ee5\u4f7f\u7528\u5982\u4e0b\u53d8\u91cf\uff1a"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:["\u6240\u6709",(0,s.jsx)(n.a,{href:"/docs/Script/script_api",children:"Script API"})]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"$request"}),": http\u8bf7\u6c42\u4fe1\u606f","\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"$request.url"}),": String\u7c7b\u578b\uff0c\u8bf7\u6c42URL"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"$request.method"}),": String\u7c7b\u578b\uff0c\u8bf7\u6c42\u65b9\u6cd5"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"$request.headers"}),": js\u5bf9\u8c61\uff0c\u8bf7\u6c42\u5934"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"$request.body"}),": String\u6216\u8005Uint8Array\u7c7b\u578b\uff0c\u5982\u679c\u8bf7\u6c42\u5e26\u6709body\uff0c\u6b64\u53c2\u6570\u624d\u6709\u503c"]}),"\n"]}),"\n"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"$response"}),": http\u54cd\u5e94\u4fe1\u606f","\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"$response.status"}),": \u54cd\u5e94\u72b6\u6001"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"$response.headers"}),": \u54cd\u5e94\u5934"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"$response.body"}),": String\u6216\u8005Uint8Array\u7c7b\u578b\uff0c\u5982\u679c\u54cd\u5e94\u5e26\u6709body\uff0c\u5e76\u4e14requires-body = true\u65f6\u6b64\u53c2\u6570\u624d\u6709\u503c"]}),"\n"]}),"\n"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"$done()"}),"\u65b9\u6cd5\u53c2\u6570\u8bf4\u660e\uff1a","\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"$done()"}),": \u4e0d\u4f20\u4efb\u4f55\u53c2\u6570\uff0c\u8868\u793a\u653e\u5f03\u8be5\u8bf7\u6c42\uff0c\u8bf7\u6c42\u8fde\u63a5\u4f1a\u76f4\u63a5\u65ad\u5f00"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"$done({})"}),": \u7a7ajs\u5bf9\u8c61\uff0c\u8bf7\u6c42\u7ee7\u7eed\uff0c\u4efb\u4f55\u8bf7\u6c42\u53c2\u6570\u4e0d\u4f1a\u6709\u4efb\u4f55\u53d8\u5316"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:'$done({   status:200,   headers:{},   body:""   })'}),": \u76f4\u63a5\u5411\u8be5\u8bf7\u6c42\u8fd4\u56de\u4e00\u4e2a\u5047\u7684\u54cd\u5e94\uff0cbody\u7c7b\u578b\u53ef\u4ee5\u662fString\u6216\u8005Uint8Array\uff0c",(0,s.jsx)(n.strong,{children:"\u5982\u679cbody\u7684\u957f\u5ea6\u5927\u4e8e0\uff0c\u4f1a\u81ea\u52a8\u8ba1\u7b97headers\u4e2d\u7684content-length\uff0ccontent-encoding\u4e5f\u4f1a\u6839\u636ebody\u7c7b\u578b\u81ea\u52a8\u751f\u6210"}),"\n",(0,s.jsx)(n.strong,{children:"\u6ce8\u610f"})," \u5f53$done()\u53c2\u6570\u7684\u5bf9\u8c61\u4e2d\u7684response\u4e0d\u5305\u542bheaders\u6216\u8005body\u65f6\uff0c\u8868\u793a\u4f7f\u7528\u539f\u54cd\u5e94\u7684headers\u548cbody\uff0c\u5982\u679c\u8981\u6e05\u9664\u539f\u8bf7\u6c42\u7684body\u65f6\uff0c\u53c2\u6570\u7684",(0,s.jsx)(n.code,{children:'body=""'}),"\u5373\u53ef\uff0c\u6e05\u9664\u539fheaders\u7684\u8bdd",(0,s.jsx)(n.code,{children:"headers={}"})]}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,s.jsx)(n.h2,{id:"cron",children:"cron"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"\u6839\u636e\u8bbe\u5b9a\u7684cron\u8868\u8fbe\u5f0f\u5b9a\u65f6\u89e6\u53d1\u811a\u672c"}),"\n",(0,s.jsx)(n.li,{children:'"* * * * *" : \u5206 \u65f6 \u65e5 \u6708 \u5468'}),"\n",(0,s.jsx)(n.li,{children:'"* * * * * *" :\u79d2 \u5206 \u65f6 \u65e5 \u6708 \u5468'}),"\n"]}),"\n",(0,s.jsx)(n.h3,{id:"\u914d\u7f6e\u8bed\u6cd5-2",children:"\u914d\u7f6e\u8bed\u6cd5"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{children:'cron "0 8 * * *" script-path=cron.js,tag = cronScript,timeout = 300,argument = "1234",enable=true\n'})}),"\n",(0,s.jsx)(n.p,{children:"\u811a\u672c\u9ed8\u8ba4\u6267\u884c\u8d85\u65f6\u65f6\u95f4200s\uff0c\u6b64\u7c7b\u811a\u672c\u4e2d\u53ef\u4ee5\u4f7f\u7528\u5982\u4e0b\u53d8\u91cf\uff1a"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:["\u6240\u6709",(0,s.jsx)(n.a,{href:"/docs/Script/script_api",children:"Script API"})]}),"\n"]}),"\n",(0,s.jsx)(n.h2,{id:"network-changed",children:"network-changed"}),"\n",(0,s.jsx)(n.p,{children:"\u5f53\u7f51\u7edc\u73af\u5883\u53d1\u751f\u53d8\u5316\u65f6\u4f1a\u8c03\u7528\u6b64\u7c7b\u578b\u811a\u672c\uff0c\u5982\u679c\u6709\u591a\u4e2a\u8fd9\u79cd\u7c7b\u578b\u7684\u811a\u672c\uff0c\u53ea\u4f1a\u8c03\u7528\u914d\u7f6e\u6587\u4ef6\u4e2d\u7684\u7b2c\u4e00\u4e2a"}),"\n",(0,s.jsx)(n.h3,{id:"\u914d\u7f6e\u8bed\u6cd5-3",children:"\u914d\u7f6e\u8bed\u6cd5"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{children:'network-changed script-path=https://raw.githubusercontent.com/Loon0x00/LoonExampleConfig/master/Script/netChanged.js,tag=changeModel,timeout = 300,argument = "1234",enable=true\n'})}),"\n",(0,s.jsx)(n.p,{children:"\u811a\u672c\u9ed8\u8ba4\u6267\u884c\u8d85\u65f6\u65f6\u95f4200s\uff0c\u6b64\u7c7b\u811a\u672c\u4e2d\u53ef\u4ee5\u4f7f\u7528\u5982\u4e0b\u53d8\u91cf\uff1a"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:["\u6240\u6709",(0,s.jsx)(n.a,{href:"/docs/Script/script_api",children:"Script API"})]}),"\n"]}),"\n",(0,s.jsx)(n.h2,{id:"generic",children:"generic"}),"\n",(0,s.jsx)(n.p,{children:"\u4ee5\u8282\u70b9\u3001\u7b56\u7565\u7ec4\u3001\u89c4\u5219\u7b49\u914d\u7f6e\u4e3a\u53c2\u6570\u7684\u811a\u672c\uff0c\u9700\u8981\u5728app\u5185\u90e8\u9875\u9762\u624b\u52a8\u8fdb\u884c\u89e6\u53d1\uff0c\u4e0d\u4f1a\u4e3b\u52a8\u89e6\u53d1"}),"\n",(0,s.jsx)(n.h3,{id:"\u914d\u7f6e\u8bed\u6cd5-4",children:"\u914d\u7f6e\u8bed\u6cd5"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{children:'generic script-path=https://raw.githubusercontent.com/Loon0x00/LoonExampleConfig/master/Script/generic_example.js,tag=GeoLocation,timeout=10,img-url=location.fill.viewfinder.system,timeout = 300,argument = "1234",enable=true\n'})}),"\n",(0,s.jsx)(n.p,{children:"\u6b64\u7c7b\u811a\u672c\u4e2d\u53ef\u4ee5\u4f7f\u7528\u5982\u4e0b\u53d8\u91cf"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:["\u6240\u6709",(0,s.jsx)(n.a,{href:"/docs/Script/script_api",children:"Script API"})]}),"\n"]})]})}function x(e={}){const{wrapper:n}={...(0,i.R)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(h,{...e})}):h(e)}},8453:(e,n,r)=>{r.d(n,{R:()=>c,x:()=>t});var s=r(6540);const i={},d=s.createContext(i);function c(e){const n=s.useContext(d);return s.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function t(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:c(e.components),s.createElement(d.Provider,{value:n},e.children)}}}]);