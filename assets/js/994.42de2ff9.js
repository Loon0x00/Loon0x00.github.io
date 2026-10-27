/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 10820:
/***/ (function(module) {

/* Loon 旧 Rewrite / Script 转换器。无第三方依赖；支持 Node.js、浏览器和 JSCore。 */(function(root,factory){const api=factory();if( true&&module.exports)module.exports=api;else root.LoonLegacyConverter=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);const numberPattern=/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;const names=new Set('header 302 307 reject reject-200 reject-img reject-dict reject-array reject-video header-del header-replace header-add header-replace-regex request-body-replace-regex mock-request-body response-header-del response-header-replace response-header-add response-header-replace-regex response-body-replace-regex mock-response-body request-body-json-add request-body-json-del request-body-json-replace response-body-json-add response-body-json-del response-body-json-replace request-body-json-jq response-body-json-jq'.split(' '));/** 抛出可报告的转换错误；code 为稳定标识，message 为中文说明。 */function fail(code,message){const e=new Error(message);e.code=code;throw e;}/** 将文本编码为新语法字符串，阻止原文中的 ${...} 被意外插值。 */function quote(text){return'"'+String(text).replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,'\\n').replace(/\r/g,'\\r').replace(/\t/g,'\\t').replace(/\$\{/g,'\\${')+'"';}/** 只识别已声明的旧插件引用；保留转义、JSON 花括号和已有 ${...} 字面量。 */function rewriteReferences(text,types){const refs=[];for(const match of text.matchAll(/\{([^{}\r\n]+)\}/g)){const key=match[1];if(!own(types,key)||text[match.index-1]==='$')continue;let slashes=0;for(let i=match.index-1;i>=0&&text[i]==='\\';i--)slashes++;if(slashes%2===0)refs.push({index:match.index,text:match[0],key});}return refs;}function rewriteVariable(text,types,expected){const refs=rewriteReferences(text,types);return refs.length===1&&refs[0].text===text?variable(refs[0].key,types,expected):'';}/** 逐段编码字面量，只有已声明的旧参数转换成模板插值。 */function rewriteString(text,types){let body='',start=0;for(const ref of rewriteReferences(text,types)){body+=quote(text.slice(start,ref.index)).slice(1,-1)+variable(ref.key,types);start=ref.index+ref.text.length;}return'"'+body+quote(text.slice(start)).slice(1,-1)+'"';}function rewriteRegex(text,types,flags=''){const ref=rewriteVariable(text,types,['string']);if(ref)return ref;if(rewriteReferences(text,types).length){fail('embedded-plugin-regex','正则中嵌入的插件参数无法直接转换，请使用参数提供完整正则');}return regex(text,flags);}/** 保留 ICU 正则，只转义新语法的斜杠分隔符；flags 为匹配选项。 */function regex(text,flags=''){let result='',slashes=0;for(const c of text){result+=c==='/'&&slashes%2===0?'\\/':c;slashes=c==='\\'?slashes+1:0;}if(!text||slashes%2)fail('invalid-regex','正则为空或以未配对的反斜杠结束');return'/'+result+'/'+flags;}/** 解码旧 Rewrite 专用的空格占位符；不解码其他正则转义。 */function spaces(s){return s.replace(/\\x20/g,' ');}/** 输出位置参数动作；args 中的值已经编码为新语法。 */function action(name,args){return name+'('+args.join(', ')+')';}/** 合并同一旧动作的多组参数，使其对应新语法数组参数。 */function batch(name,rows){return action(name,rows[0].map((_,i)=>rows.length===1?rows[0][i]:'['+rows.map(row=>row[i]).join(', ')+']'));}/** 按旧解析器规则读取 Mock 命名参数，保留 data 内嵌的 JSON 双引号。 */function mockOptions(text){const out=Object.create(null);let i=0;while(i<text.length){while(/\s/.test(text[i]||'')&&i<text.length)i++;const start=i;while(i<text.length&&text[i]!=='='&&!/\s/.test(text[i]))i++;if(i>=text.length)break;if(text[i]!=='=')continue;const key=text.slice(start,i++);let value='';if(text[i]==='"'){i++;while(i<text.length){if(text[i]==='"'&&(i+1===text.length||/\s/.test(text[i+1]))){i++;break;}value+=text[i++];}}else{const begin=i;while(i<text.length&&!/\s/.test(text[i]))i++;value=text.slice(begin,i);}if(key)out[key]=value;}return out;}/** 保留旧 JSON 标量类型；未加引号的数组、对象仍按旧模型的字符串处理。 */function jsonValue(text,types){const ref=rewriteVariable(text,types);if(ref)return ref;const lower=text.toLowerCase();if(['true','yes'].includes(lower))return'true';if(['false','no'].includes(lower))return'false';if(['null','nil','<null>'].includes(lower))return'null';if(text.startsWith('"')&&text.endsWith('"'))return rewriteString(text.slice(1,-1),types);if(numberPattern.test(text))return text;return rewriteString(spaces(text),types);}/** 校验旧 JSON path 的点、数组索引和带引号键语法。 */function jsonPath(text,types){if(rewriteReferences(text,types).length)return rewriteString(text,types);let i=0;while(i<text.length){if(text[i]==='['){const match=/^(?:\[(\d+)\]|\[("(?:[^"\\]|\\.)*")\])/.exec(text.slice(i));if(!match)fail('invalid-json-path','无效的 JSON path：'+text);if(match[2]){try{if(!JSON.parse(match[2]))throw Error();}catch(_){fail('invalid-json-path','无效的 JSON 键：'+text);}}i+=match[0].length;}else{const match=/^[^.\[\]]+/.exec(text.slice(i));if(!match)fail('invalid-json-path','无效的 JSON path：'+text);i+=match[0].length;}if(i===text.length)return quote(text);if(text[i]==='[')continue;if(text[i++]!=='.'||i===text.length||/[.\]]/.test(text[i]))break;}fail('invalid-json-path','无效的 JSON path：'+text);}/** 生成 URL 替换模板；返回捕获条件后缀及替换参数，types 用于避开插件变量重名。 */function urlTemplate(text,types){let capture='urlMatch',n=0;while(own(types,capture))capture='urlMatch'+ ++n;let body='',literal='',used=false;const flush=()=>{if(/\$[0-9]/.test(literal))fail('literal-url-capture','URL 替换含字面量 $n，当前新语法禁止该形式，保留原行');body+=rewriteString(literal,types).slice(1,-1);literal='';};for(let i=0;i<text.length;){if(text[i]==='\\'&&/[$\\]/.test(text[i+1]||'')){literal+=text[i+1];i+=2;continue;}const match=/^\$(\d+)/.exec(text.slice(i));if(match){flush();body+='${'+capture+'.'+Number(match[1])+'}';used=true;i+=match[0].length;}else literal+=text[i++];}flush();return{suffix:used?' as '+capture:'',value:'"'+body+'"'};}/** 转换一条旧 Rewrite；types 为插件参数名到类型的映射。 */function rewrite(source,types){const words=source.split(/\s+/);if(words.length<2)fail('legacy-format','Rewrite 缺少 URL 正则或动作');let name=words[1].toLowerCase(),rest=source.replace(/^\S+\s+\S+\s*/,'');if(!names.has(name)){if(words.length>=3&&names.has(words[2].toLowerCase())){name=words[2].toLowerCase();rest=words[1];}else fail('unknown-legacy-action','不支持的旧 Rewrite 动作：'+words[1]);}let phase='request',condition='${url} ~= '+rewriteRegex(words[0],types,'i'),actions=[];const parts=rest?rest.split(/\s+/):[];const rows=(size,convert)=>{if(!parts.length||parts.length%size)fail('legacy-parameters','动作 '+name+' 的参数必须每 '+size+' 项成组');const out=[];for(let i=0;i<parts.length;i+=size)out.push(convert(parts.slice(i,i+size)));return out;};if(['header','302','307'].includes(name)){if(!rest)fail('legacy-parameters','URL 替换缺少替换内容');const template=urlTemplate(spaces(rest),types);condition+=template.suffix;actions=[action(name==='header'?'url.replace':'redirect',name==='header'?[template.value]:[name,template.value])];}else if(name.startsWith('reject')){actions=[action(name==='reject-200'?'reject':name.replace('-','_'),[name==='reject'?'404':'200'])];}else if(name.startsWith('mock-')){const opts=mockOptions(rest),response=name==='mock-response-body';// 与当前原生模型一致，response.body.mock 归入响应阶段。
phase=response?'response':'request';if(!opts['data-type'])fail('legacy-parameters','Mock 缺少 data-type');if(!rewriteVariable(opts['data-type'],types,['string'])&&!['json','text','css','html','javascript','plain','png','gif','jpeg','tiff','svg','mp4','form-data'].includes(opts['data-type']))fail('invalid-mock-type','当前新语法不支持该 Mock 类型：'+opts['data-type']);const fromFile=!own(opts,'data')&&own(opts,'data-path');const args=[rewriteString(opts['data-type'],types),rewriteString(fromFile?opts['data-path']:opts.data||'',types)];const encoding=opts['data-is-base64']||opts['mock-data-is-base64']||'';const base64=rewriteVariable(encoding,types,['boolean'])||(encoding.toLowerCase()==='true'?'true':'');if(response&&opts['status-code']){const status=rewriteVariable(opts['status-code'],types,['number']);if(!status&&!/^[+-]?\d+$/.test(opts['status-code']))fail('legacy-parameters','Mock status-code 必须是整数');args.push(status||String(Number(opts['status-code'])));}else if(response&&base64)args.push('200');if(base64)args.push(base64);actions=[action((response?'response':'request')+'.body.mock'+(fromFile?'_file':''),args)];}else{phase=name.startsWith('response-')?'response':'request';const short=name.replace(/^(?:response-|request-)/,'');if(short==='header-del')actions=[batch(phase+'.header.del',rows(1,p=>[rewriteString(p[0],types)]))];else if(['header-add','header-replace'].includes(short))actions=[batch(phase+'.header.'+(short.endsWith('add')?'add':'set'),rows(2,p=>[rewriteString(p[0],types),rewriteString(spaces(p[1]),types)]))];else if(short==='header-replace-regex')actions=[batch(phase+'.header.replace',rows(3,p=>[rewriteString(p[0],types),rewriteRegex(p[1],types),rewriteString(spaces(p[2]),types)]))];else if(short==='body-replace-regex')actions=[batch(phase+'.body.replace',rows(2,p=>[rewriteRegex(p[0],types),rewriteString(spaces(p[1]),types)]))];else if(short==='body-json-del')actions=[batch(phase+'.json.delete',rows(1,p=>[jsonPath(p[0],types)]))];else if(['body-json-add','body-json-replace'].includes(short))actions=[batch(phase+'.json.'+(short.endsWith('add')?'add':'replace'),rows(2,p=>[jsonPath(p[0],types),jsonValue(p[1],types)]))];else if(short==='body-json-jq'){let remaining=rest.trim();while(remaining){const match=/^(?:'([^']*)'|jq-path="([^"]*)")/.exec(remaining);if(!match)fail('legacy-parameters','JQ 需要单引号表达式或 jq-path="文件"');actions.push(action(phase+'.json.'+(match[1]!==undefined?'jq':'jq_file'),[rewriteString(match[1]!==undefined?match[1]:match[2],types)]));remaining=remaining.slice(match[0].length).trimStart();}if(!actions.length)fail('legacy-parameters','JQ 缺少表达式');}}if(!actions.length)fail('unknown-legacy-action','无法转换 Rewrite 动作');return phase+' if '+condition+' then '+actions.join(' | ');}/** 读取旧 Script 命名参数，严格跟随原生解析器的逗号、引号及括号边界。 */function scriptValue(source,key){const match=new RegExp('(?:^|[\\s,])'+key+'\\s*=\\s*','i').exec(source);if(!match)return undefined;let i=match.index+match[0].length,start=i;if(source[i]==='"'){i++;let escaped=false;while(i<source.length){const c=source[i++];if(!escaped&&c==='"')break;escaped=!escaped&&c==='\\';}}else if(source[i]==='['||source[i]==='{'){const open=source[i],close=open==='['?']':'}';let depth=0;while(i<source.length){const c=source[i++];if(c===open)depth++;else if(c===close&&--depth===0)break;}while(i<source.length&&source[i]!==',')i++;}else while(i<source.length&&source[i]!==',')i++;return source.slice(start,i).trim();}/**
   * 按旧 DCUtils.parserArguments: 的规则读取字符串参数，不执行反斜杠解码或模板插值。
   * @param {string} source 完整旧 Script 行，用于提取原始参数区。
   * @param {string} value 已识别的 argument 参数；Object 参数由其他分支处理。
   * @returns {string} 脚本在旧实现中实际接收到的字符串。
   */function legacyArgumentString(source,value){if(!value.startsWith('"'))return value;const pathStart=source.search(/script-path/i);const params=source.slice(pathStart<0?0:pathStart).trim();const match=/(^|, *)arguments?=+"(.*)"(,|$)/i.exec(params);if(!match)fail('legacy-argument-format','无法按旧字符串参数规则确定 argument 边界');return match[2];}/** 解码 Script 的路径、标签等字段；argument 单独保留旧版原始字符串语义。 */function decode(text){if(text===undefined)return undefined;if(!text.startsWith('"')||!text.endsWith('"'))return text;let out='';for(let i=1;i<text.length-1;i++){const c=text[i];if(c==='\\'){const next=text[++i],map={'"':'"','\\':'\\',n:'\n',r:'\r',t:'\t'};if(own(map,next))out+=map[next];else if(next==='$'&&text[i+1]==='{'){out+='${';i++;}else fail('invalid-escape','旧 Script 字符串包含不支持的转义');}else if(c==='$'&&text[i+1]==='{')fail('legacy-string-template','旧 Script 字符串含模板引用，请人工确认');else out+=c;}return out;}/** 从旧 Script 行首读取 HTTP 正则或 Cron 表达式。 */function triggerValue(source,trigger){const rest=source.slice(trigger.length).trimStart();if(rest.startsWith('"')){const match=/^"(?:[^"\\]|\\.)*"/.exec(rest);return match?match[0]:undefined;}if(rest.startsWith('{')){const end=rest.indexOf('}');return end<0?undefined:rest.slice(0,end+1);}return rest.split(/\s/)[0];}/** 解析旧 Boolean，fallback 用于原生会回退为 false 的 body 选项。 */function boolean(text,fallback){if(/^(true|1)$/i.test(text))return'true';if(/^(false|0)$/i.test(text))return'false';if(fallback!==undefined)return fallback;fail('invalid-boolean','Boolean 参数必须为 true/false/1/0');}/** 生成插件变量引用；expected 指定所需类型，strict 控制是否必须已声明。 */function variable(key,types,expected,strict=true){key=key.trim();if(!key||/[{}\r\n]/.test(key))fail('invalid-plugin-variable','插件变量名称不合法');if(strict&&!own(types,key))fail('undefined-plugin-argument','未声明插件参数：'+key);if(expected&&own(types,key)&&!expected.includes(types[key]))fail('plugin-type','插件参数类型不匹配：'+key);return'${'+key+'}';}/** 将旧 Object/数组形式的 argument 转为新语法插件参数集合。 */function pluginObject(text,types){let keys=[];if(text.startsWith('[')&&text.endsWith(']')){for(let i=1;i<text.length-1;i++){if(text[i]!=='{')continue;const start=i+1;let depth=1;while(++i<text.length-1){if(text[i]==='{')depth++;if(text[i]==='}'&&--depth===0)break;}if(depth===0)keys.push(text.slice(start,i).trim());}}else if(text.startsWith('{')&&text.endsWith('}'))keys=text.slice(1,-1).split(',').map(s=>s.trim()).filter(Boolean);keys=keys.map(s=>s.startsWith('${')&&s.endsWith('}')?s.slice(2,-1).trim():s);if(!keys.length)fail('empty-plugin-object','插件参数集合不能为空');if(new Set(keys).size!==keys.length)fail('duplicate-plugin-argument','插件参数集合含重复名称');return'{'+keys.map(k=>variable(k,types)).join(', ')+'}';}/** 转换一条旧 Script；保持默认值及插件变量，不将当前插件值写死到结果中。 */function script(source,types){const trigger=source.split(/\s/)[0].toLowerCase();if(!['http-request','http-response','cron','network-changed','generic'].includes(trigger))fail('unknown-script-trigger','不支持的 Script 类型');const get=key=>scriptValue(source,key),path=decode(get('script-path'));if(!path)fail('script-path-required','Script 缺少 script-path');let prefix=trigger+' then ';const http=trigger.startsWith('http-');if(http)prefix=trigger.slice(5)+' if ${url} ~= '+regex(triggerValue(source,trigger)||'','i')+' then ';if(trigger==='cron'){const value=triggerValue(source,trigger);if(!value)fail('invalid-cron','Cron 缺少表达式');if(value.startsWith('{')&&value.endsWith('}'))prefix='cron '+variable(value.slice(1,-1),types,['string'])+' then ';else{const cron=decode(value);if(![5,6].includes(cron.trim().split(/\s+/).length))fail('invalid-cron','Cron 必须为五段或六段表达式');prefix='cron '+quote(cron)+' then ';}}const args=[quote(path)],argument=get('argument');if(argument)args.push(/^[\[{]/.test(argument)?pluginObject(argument,types):quote(legacyArgumentString(source,argument)));const options=[];let enable=get('enable');if(enable===undefined)enable=get('enabled');if(enable){if(enable.startsWith('{')&&enable.endsWith('}'))options.push('enable='+variable(enable.slice(1,-1),types,null,false));else if(boolean(enable)==='false')options.push('enable=false');}// 默认 tag 留给新解析器按路径生成，显式 tag 保持原值。
const tag=decode(get('tag'));if(tag)options.push('tag='+quote(tag));const image=decode(get('img-url'));if(image)options.push('img_url='+quote(image));const timeout=get('timeout');if(timeout){if(timeout.startsWith('{')&&timeout.endsWith('}'))options.push('timeout='+variable(timeout.slice(1,-1),types,['number','string']));else{if(!numberPattern.test(timeout)||!Number.isFinite(Number(timeout))||Number(timeout)<=0)fail('invalid-timeout','timeout 必须为正的有限数值');options.push('timeout='+timeout);}}const debug=get('debug');if(debug!==undefined){if(debug.startsWith('{')&&debug.endsWith('}'))options.push('debug='+variable(debug.slice(1,-1),types,null,false));else if(boolean(debug)==='true')options.push('debug=true');}if(http)for(const key of['requires-body','binary-body-mode'])if(boolean(get(key),'false')==='true')options.push(key.replace(/-/g,'_')+'=true');return prefix+action('script',args)+(options.length?' with '+options.join(', '):'');}/** 判断明确的新语法行；新语法原样返回，不声称完成全量语法验证。 */function isNew(source,kind){if(kind==='rewrite')return /^(request|response)(?:\s|$)/i.test(source);const first=source.split(/\s/)[0].toLowerCase();if(['request','response'].includes(first))return true;return['cron','network-changed','generic'].includes(first)&&!/(?:^|[\s,])script-path\s*=/i.test(source);}/** 转换单行；options.kind 为 rewrite/script/auto，argumentTypes 为插件静态类型表。返回 text/status/diagnostics。 */function convertLine(line,options={}){const source=line.trim(),types=options.argumentTypes||Object.create(null);if(!source||/^[#;]/.test(source))return{text:line,status:'unchanged',diagnostics:[]};let kind=options.kind||'auto';if(kind==='auto'){if(/^(http-request|http-response|cron|network-changed|generic)(?:\s|$)/i.test(source))kind='script';else if(/^(request|response)(?:\s|$)/i.test(source))return{text:line,status:'unchanged',diagnostics:[]};else kind='rewrite';}try{if(!['rewrite','script'].includes(kind))fail('invalid-kind','kind 必须为 rewrite/script/auto');if(isNew(source,kind))return{text:line,status:'unchanged',diagnostics:[]};const converted=kind==='rewrite'?rewrite(source,types):script(source,types);return{text:line.slice(0,line.indexOf(source))+converted+line.slice(line.indexOf(source)+source.length),status:'converted',kind,diagnostics:[]};}catch(error){if(!error.code)throw error;return{text:line,status:'error',kind,diagnostics:[{severity:'error',code:error.code,message:error.message}]};}}/** 从完整插件读取 [Argument] 静态类型；不读取或求值用户参数。 */function argumentTypes(text){const types=Object.create(null);let section='';for(const line of text.split(/\r\n|\n|\r/)){const source=line.trim(),heading=/^\[([^\]]+)\]\s*(?:[#;].*)?$/.exec(source);if(heading){section=heading[1].toLowerCase();continue;}if(section!=='argument'||!source||/^[#;]/.test(source))continue;const match=/^([^=]+)=\s*(switch|input|select)\s*,(.*)$/i.exec(source);if(!match)continue;const type=/(?:^|,)\s*type\s*=\s*(number|string)\s*(?:,|$)/i.exec(match[3]);types[match[1].trim()]=match[2].toLowerCase()==='switch'?'boolean':type?type[1].toLowerCase():'string';}return types;}/** 转换完整插件/配置或纯规则文本，保留其他分区、注释、空行、BOM 与换行格式。 */function convertText(text,options={}){const types=Object.assign(Object.create(null),argumentTypes(text),options.argumentTypes||{});const chunks=text.split(/(\r\n|\n|\r)/),diagnostics=[],records=[];const sectioned=chunks.some((s,i)=>i%2===0&&/^\s*\[[^\]]+\]\s*(?:[#;].*)?$/.test(s));let section='',converted=0,errors=0;for(let i=0;i<chunks.length;i+=2){const source=chunks[i].trim(),heading=/^\[([^\]]+)\]\s*(?:[#;].*)?$/.exec(source);if(heading){section=heading[1].toLowerCase();continue;}if(sectioned&&!['rewrite','script'].includes(section))continue;const result=convertLine(chunks[i],{kind:sectioned?section:options.kind||'auto',argumentTypes:types});if(result.status==='converted')converted++;if(result.status==='error')errors++;if(result.status!=='unchanged')records.push({line:i/2+1,kind:result.kind,source:chunks[i],output:result.text,status:result.status});diagnostics.push(...result.diagnostics.map(d=>Object.assign({line:i/2+1},d)));chunks[i]=result.text;}return{text:chunks.join(''),converted,errors,diagnostics,records,argumentTypes:types};}return{convertLine,convertText,argumentTypes};});

/***/ }),

/***/ 74610:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  JG: () => (/* binding */ ENCRYPTION_LIMITS),
  Up: () => (/* binding */ analyzePlugin),
  X8: () => (/* binding */ encryptPluginPackage),
  kz: () => (/* binding */ extractResourceReferences),
  oc: () => (/* binding */ readPluginInput),
  NU: () => (/* binding */ rewriteResourceReferences)
});

// UNUSED EXPORTS: LPXE_VERSION, normalizePackagePath

;// CONCATENATED MODULE: external "module"
const external_module_namespaceObject = require("module");
;// CONCATENATED MODULE: ./node_modules/fflate/esm/index.mjs

var esm_require = (0,external_module_namespaceObject.createRequire)('/');
// DEFLATE is a complex format; to read this code, you should probably check the RFC first:
// https://tools.ietf.org/html/rfc1951
// You may also wish to take a look at the guide I made about this program:
// https://gist.github.com/101arrowz/253f31eb5abc3d9275ab943003ffecad
// Some of the following code is similar to that of UZIP.js:
// https://github.com/photopea/UZIP.js
// However, the vast majority of the codebase has diverged from UZIP.js to increase performance and reduce bundle size.
// Sometimes 0 will appear where -1 would be more appropriate. This is because using a uint
// is better for memory in most engines (I *think*).
var _a;
// Mediocre shim
var Worker;
var isMarkedAsUntransferable;
var workerAdd = ";var __w=require('worker_threads');__w.parentPort.on('message',function(m){onmessage({data:m})}),postMessage=function(m,t){__w.parentPort.postMessage(m,t)},close=process.exit;self=global";
try {
    (_a = esm_require('worker_threads'), Worker = _a.Worker, isMarkedAsUntransferable = _a.isMarkedAsUntransferable);
}
catch (e) {
}
var wk = (/* unused pure expression or super */ null && (Worker ? function (c, _, msg, transfer, cb) {
    var done = false;
    var w = new Worker(c + workerAdd, { eval: true })
        .on('error', function (e) { return cb(e, null); })
        .on('message', function (m) { return cb(null, m); })
        .on('exit', function (c) {
        if (c && !done)
            cb(new Error('exited with code ' + c), null);
    });
    if (isMarkedAsUntransferable)
        transfer = transfer.filter(function (t) { return !isMarkedAsUntransferable(t); });
    w.postMessage(msg, transfer);
    w.terminate = function () {
        done = true;
        return Worker.prototype.terminate.call(w);
    };
    return w;
} : function (_, __, ___, ____, cb) {
    setImmediate(function () { return cb(new Error('async operations unsupported - update to Node 12+ (or Node 10-11 with the --experimental-worker CLI flag)'), null); });
    var NOP = function () { };
    return {
        terminate: NOP,
        postMessage: NOP
    };
}));

// aliases for shorter compressed code (most minifers don't do this)
var u8 = Uint8Array, u16 = Uint16Array, i32 = Int32Array;
// fixed length extra bits
var fleb = new u8([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, /* unused */ 0, 0, /* impossible */ 0]);
// fixed distance extra bits
var fdeb = new u8([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, /* unused */ 0, 0]);
// code length index map
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
// get base, reverse index map from extra bits
var freb = function (eb, start) {
    var b = new u16(31);
    for (var i = 0; i < 31; ++i) {
        b[i] = start += 1 << eb[i - 1];
    }
    // numbers here are at max 18 bits
    var r = new i32(b[30]);
    for (var i = 1; i < 30; ++i) {
        for (var j = b[i]; j < b[i + 1]; ++j) {
            r[j] = ((j - b[i]) << 5) | i;
        }
    }
    return { b: b, r: r };
};
var _a = freb(fleb, 2), fl = _a.b, revfl = _a.r;
// we can ignore the fact that the other numbers are wrong; they never happen anyway
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0), fd = _b.b, revfd = _b.r;
// map of value to reverse (assuming 16 bits)
var rev = new u16(32768);
for (var i = 0; i < 32768; ++i) {
    // reverse table algorithm from SO
    var x = ((i & 0xAAAA) >> 1) | ((i & 0x5555) << 1);
    x = ((x & 0xCCCC) >> 2) | ((x & 0x3333) << 2);
    x = ((x & 0xF0F0) >> 4) | ((x & 0x0F0F) << 4);
    rev[i] = (((x & 0xFF00) >> 8) | ((x & 0x00FF) << 8)) >> 1;
}
// create huffman tree from u8 "map": index -> code length for code index
// mb (max bits) must be at most 15
// TODO: optimize/split up?
var hMap = (function (cd, mb, r) {
    var s = cd.length;
    // index
    var i = 0;
    // u16 "map": index -> # of codes with bit length = index
    var l = new u16(mb);
    // length of cd must be 288 (total # of codes)
    for (; i < s; ++i) {
        if (cd[i])
            ++l[cd[i] - 1];
    }
    // u16 "map": index -> minimum code for bit length = index
    var le = new u16(mb);
    for (i = 1; i < mb; ++i) {
        le[i] = (le[i - 1] + l[i - 1]) << 1;
    }
    var co;
    if (r) {
        // u16 "map": index -> number of actual bits, symbol for code
        co = new u16(1 << mb);
        // bits to remove for reverser
        var rvb = 15 - mb;
        for (i = 0; i < s; ++i) {
            // ignore 0 lengths
            if (cd[i]) {
                // num encoding both symbol and bits read
                var sv = (i << 4) | cd[i];
                // free bits
                var r_1 = mb - cd[i];
                // start value
                var v = le[cd[i] - 1]++ << r_1;
                // m is end value
                for (var m = v | ((1 << r_1) - 1); v <= m; ++v) {
                    // every 16 bit value starting with the code yields the same result
                    co[rev[v] >> rvb] = sv;
                }
            }
        }
    }
    else {
        co = new u16(s);
        for (i = 0; i < s; ++i) {
            if (cd[i]) {
                co[i] = rev[le[cd[i] - 1]++] >> (15 - cd[i]);
            }
        }
    }
    return co;
});
// fixed length tree
var flt = new u8(288);
for (var i = 0; i < 144; ++i)
    flt[i] = 8;
for (var i = 144; i < 256; ++i)
    flt[i] = 9;
for (var i = 256; i < 280; ++i)
    flt[i] = 7;
for (var i = 280; i < 288; ++i)
    flt[i] = 8;
// fixed distance tree
var fdt = new u8(32);
for (var i = 0; i < 32; ++i)
    fdt[i] = 5;
// fixed length map
var flm = /*#__PURE__*/ hMap(flt, 9, 0), flrm = /*#__PURE__*/ (/* unused pure expression or super */ null && (hMap(flt, 9, 1)));
// fixed distance map
var fdm = /*#__PURE__*/ hMap(fdt, 5, 0), fdrm = /*#__PURE__*/ (/* unused pure expression or super */ null && (hMap(fdt, 5, 1)));
// find max of array
var max = function (a) {
    var m = a[0];
    for (var i = 1; i < a.length; ++i) {
        if (a[i] > m)
            m = a[i];
    }
    return m;
};
// read d, starting at bit p and mask with m
var bits = function (d, p, m) {
    var o = (p / 8) | 0;
    return ((d[o] | (d[o + 1] << 8)) >> (p & 7)) & m;
};
// read d, starting at bit p continuing for at least 16 bits
var bits16 = function (d, p) {
    var o = (p / 8) | 0;
    return ((d[o] | (d[o + 1] << 8) | (d[o + 2] << 16)) >> (p & 7));
};
// get end of byte
var shft = function (p) { return ((p + 7) / 8) | 0; };
// typed array slice - allows garbage collector to free original reference,
// while being more compatible than .slice
var slc = function (v, s, e) {
    if (s == null || s < 0)
        s = 0;
    if (e == null || e > v.length)
        e = v.length;
    // can't use .constructor in case user-supplied
    return new u8(v.subarray(s, e));
};
/**
 * Codes for errors generated within this library
 */
var FlateErrorCode = {
    UnexpectedEOF: 0,
    InvalidBlockType: 1,
    InvalidLengthLiteral: 2,
    InvalidDistance: 3,
    StreamFinished: 4,
    NoStreamHandler: 5,
    InvalidHeader: 6,
    NoCallback: 7,
    InvalidUTF8: 8,
    ExtraFieldTooLong: 9,
    InvalidDate: 10,
    FilenameTooLong: 11,
    StreamFinishing: 12,
    InvalidZipData: 13,
    UnknownCompressionMethod: 14
};
// error codes
var ec = [
    'unexpected EOF',
    'invalid block type',
    'invalid length/literal',
    'invalid distance',
    'stream finished',
    'no stream handler',
    , // determined by compression function
    'no callback',
    'invalid UTF-8 data',
    'extra field too long',
    'date not in range 1980-2099',
    'filename too long',
    'stream finishing',
    'invalid zip data'
    // determined by unknown compression method
];
;
var err = function (ind, msg, nt) {
    var e = new Error(msg || ec[ind]);
    e.code = ind;
    if (Error.captureStackTrace)
        Error.captureStackTrace(e, err);
    if (!nt)
        throw e;
    return e;
};
// expands raw DEFLATE data
var inflt = function (dat, st, buf, dict) {
    // source length       dict length
    var sl = dat.length, dl = dict ? dict.length : 0;
    if (!sl || st.f && !st.l)
        return buf || new u8(0);
    var noBuf = !buf;
    // have to estimate size
    var resize = noBuf || st.i != 2;
    // no state
    var noSt = st.i;
    // Assumes roughly 33% compression ratio average
    if (noBuf)
        buf = new u8(sl * 3);
    // ensure buffer can fit at least l elements
    var cbuf = function (l) {
        var bl = buf.length;
        // need to increase size to fit
        if (l > bl) {
            // Double or set to necessary, whichever is greater
            var nbuf = new u8(Math.max(bl * 2, l));
            nbuf.set(buf);
            buf = nbuf;
        }
    };
    //  last chunk         bitpos           bytes
    var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
    // total bits
    var tbts = sl * 8;
    do {
        if (!lm) {
            // BFINAL - this is only 1 when last chunk is next
            final = bits(dat, pos, 1);
            // type: 0 = no compression, 1 = fixed huffman, 2 = dynamic huffman
            var type = bits(dat, pos + 1, 3);
            pos += 3;
            if (!type) {
                // go to end of byte boundary
                var s = shft(pos) + 4, l = dat[s - 4] | (dat[s - 3] << 8), t = s + l;
                if (t > sl) {
                    if (noSt)
                        err(0);
                    break;
                }
                // ensure size
                if (resize)
                    cbuf(bt + l);
                // Copy over uncompressed data
                buf.set(dat.subarray(s, t), bt);
                // Get new bitpos, update byte count
                st.b = bt += l, st.p = pos = t * 8, st.f = final;
                continue;
            }
            else if (type == 1)
                lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
            else if (type == 2) {
                //  literal                            lengths
                var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
                var tl = hLit + bits(dat, pos + 5, 31) + 1;
                pos += 14;
                // length+distance tree
                var ldt = new u8(tl);
                // code length tree
                var clt = new u8(19);
                for (var i = 0; i < hcLen; ++i) {
                    // use index map to get real code
                    clt[clim[i]] = bits(dat, pos + i * 3, 7);
                }
                pos += hcLen * 3;
                // code lengths bits
                var clb = max(clt), clbmsk = (1 << clb) - 1;
                // code lengths map
                var clm = hMap(clt, clb, 1);
                for (var i = 0; i < tl;) {
                    var r = clm[bits(dat, pos, clbmsk)];
                    // bits read
                    pos += r & 15;
                    // symbol
                    var s = r >> 4;
                    // code length to copy
                    if (s < 16) {
                        ldt[i++] = s;
                    }
                    else {
                        //  copy   count
                        var c = 0, n = 0;
                        if (s == 16)
                            n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
                        else if (s == 17)
                            n = 3 + bits(dat, pos, 7), pos += 3;
                        else if (s == 18)
                            n = 11 + bits(dat, pos, 127), pos += 7;
                        while (n--)
                            ldt[i++] = c;
                    }
                }
                //    length tree                 distance tree
                var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
                // max length bits
                lbt = max(lt);
                // max dist bits
                dbt = max(dt);
                lm = hMap(lt, lbt, 1);
                dm = hMap(dt, dbt, 1);
            }
            else
                err(1);
            if (pos > tbts) {
                if (noSt)
                    err(0);
                break;
            }
        }
        // Make sure the buffer can hold this + the largest possible addition
        // Maximum chunk size (practically, theoretically infinite) is 2^17
        if (resize)
            cbuf(bt + 131072);
        var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
        var lpos = pos;
        for (;; lpos = pos) {
            // bits read, code
            var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
            pos += c & 15;
            if (pos > tbts) {
                if (noSt)
                    err(0);
                break;
            }
            if (!c)
                err(2);
            if (sym < 256)
                buf[bt++] = sym;
            else if (sym == 256) {
                lpos = pos, lm = null;
                break;
            }
            else {
                var add = sym - 254;
                // no extra bits needed if less
                if (sym > 264) {
                    // index
                    var i = sym - 257, b = fleb[i];
                    add = bits(dat, pos, (1 << b) - 1) + fl[i];
                    pos += b;
                }
                // dist
                var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
                if (!d)
                    err(3);
                pos += d & 15;
                var dt = fd[dsym];
                if (dsym > 3) {
                    var b = fdeb[dsym];
                    dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
                }
                if (pos > tbts) {
                    if (noSt)
                        err(0);
                    break;
                }
                if (resize)
                    cbuf(bt + 131072);
                var end = bt + add;
                if (bt < dt) {
                    var shift = dl - dt, dend = Math.min(dt, end);
                    if (shift + bt < 0)
                        err(3);
                    for (; bt < dend; ++bt)
                        buf[bt] = dict[shift + bt];
                }
                for (; bt < end; ++bt)
                    buf[bt] = buf[bt - dt];
            }
        }
        st.l = lm, st.p = lpos, st.b = bt, st.f = final;
        if (lm)
            final = 1, st.m = lbt, st.d = dm, st.n = dbt;
    } while (!final);
    // don't reallocate for streams or user buffers
    return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
};
// starting at p, write the minimum number of bits that can hold v to d
var wbits = function (d, p, v) {
    v <<= p & 7;
    var o = (p / 8) | 0;
    d[o] |= v;
    d[o + 1] |= v >> 8;
};
// starting at p, write the minimum number of bits (>8) that can hold v to d
var wbits16 = function (d, p, v) {
    v <<= p & 7;
    var o = (p / 8) | 0;
    d[o] |= v;
    d[o + 1] |= v >> 8;
    d[o + 2] |= v >> 16;
};
// creates code lengths from a frequency table
var hTree = function (d, mb) {
    // Need extra info to make a tree
    var t = [];
    for (var i = 0; i < d.length; ++i) {
        if (d[i])
            t.push({ s: i, f: d[i] });
    }
    var s = t.length;
    var t2 = t.slice();
    if (!s)
        return { t: et, l: 0 };
    if (s == 1) {
        var v = new u8(t[0].s + 1);
        v[t[0].s] = 1;
        return { t: v, l: 1 };
    }
    t.sort(function (a, b) { return a.f - b.f; });
    // after i2 reaches last ind, will be stopped
    // freq must be greater than largest possible number of symbols
    t.push({ s: -1, f: 25001 });
    var l = t[0], r = t[1], i0 = 0, i1 = 1, i2 = 2;
    t[0] = { s: -1, f: l.f + r.f, l: l, r: r };
    // efficient algorithm from UZIP.js
    // i0 is lookbehind, i2 is lookahead - after processing two low-freq
    // symbols that combined have high freq, will start processing i2 (high-freq,
    // non-composite) symbols instead
    // see https://reddit.com/r/photopea/comments/ikekht/uzipjs_questions/
    while (i1 != s - 1) {
        l = t[t[i0].f < t[i2].f ? i0++ : i2++];
        r = t[i0 != i1 && t[i0].f < t[i2].f ? i0++ : i2++];
        t[i1++] = { s: -1, f: l.f + r.f, l: l, r: r };
    }
    var maxSym = t2[0].s;
    for (var i = 1; i < s; ++i) {
        if (t2[i].s > maxSym)
            maxSym = t2[i].s;
    }
    // code lengths
    var tr = new u16(maxSym + 1);
    // max bits in tree
    var mbt = ln(t[i1 - 1], tr, 0);
    if (mbt > mb) {
        // more algorithms from UZIP.js
        // TODO: find out how this code works (debt)
        //  ind    debt
        var i = 0, dt = 0;
        //    left            cost
        var lft = mbt - mb, cst = 1 << lft;
        t2.sort(function (a, b) { return tr[b.s] - tr[a.s] || a.f - b.f; });
        for (; i < s; ++i) {
            var i2_1 = t2[i].s;
            if (tr[i2_1] > mb) {
                dt += cst - (1 << (mbt - tr[i2_1]));
                tr[i2_1] = mb;
            }
            else
                break;
        }
        dt >>= lft;
        while (dt > 0) {
            var i2_2 = t2[i].s;
            if (tr[i2_2] < mb)
                dt -= 1 << (mb - tr[i2_2]++ - 1);
            else
                ++i;
        }
        for (; i >= 0 && dt; --i) {
            var i2_3 = t2[i].s;
            if (tr[i2_3] == mb) {
                --tr[i2_3];
                ++dt;
            }
        }
        mbt = mb;
    }
    return { t: new u8(tr), l: mbt };
};
// get the max length and assign length codes
var ln = function (n, l, d) {
    return n.s == -1
        ? Math.max(ln(n.l, l, d + 1), ln(n.r, l, d + 1))
        : (l[n.s] = d);
};
// length codes generation
var lc = function (c) {
    var s = c.length;
    // Note that the semicolon was intentional
    while (s && !c[--s])
        ;
    var cl = new u16(++s);
    //  ind      num         streak
    var cli = 0, cln = c[0], cls = 1;
    var w = function (v) { cl[cli++] = v; };
    for (var i = 1; i <= s; ++i) {
        if (c[i] == cln && i != s)
            ++cls;
        else {
            if (!cln && cls > 2) {
                for (; cls > 138; cls -= 138)
                    w(32754);
                if (cls > 2) {
                    w(cls > 10 ? ((cls - 11) << 5) | 28690 : ((cls - 3) << 5) | 12305);
                    cls = 0;
                }
            }
            else if (cls > 3) {
                w(cln), --cls;
                for (; cls > 6; cls -= 6)
                    w(8304);
                if (cls > 2)
                    w(((cls - 3) << 5) | 8208), cls = 0;
            }
            while (cls--)
                w(cln);
            cls = 1;
            cln = c[i];
        }
    }
    return { c: cl.subarray(0, cli), n: s };
};
// calculate the length of output from tree, code lengths
var clen = function (cf, cl) {
    var l = 0;
    for (var i = 0; i < cl.length; ++i)
        l += cf[i] * cl[i];
    return l;
};
// writes a fixed block
// returns the new bit pos
var wfblk = function (out, pos, dat) {
    // no need to write 00 as type: TypedArray defaults to 0
    var s = dat.length;
    var o = shft(pos + 2);
    out[o] = s & 255;
    out[o + 1] = s >> 8;
    out[o + 2] = out[o] ^ 255;
    out[o + 3] = out[o + 1] ^ 255;
    for (var i = 0; i < s; ++i)
        out[o + i + 4] = dat[i];
    return (o + 4 + s) * 8;
};
// writes a block
var wblk = function (dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
    wbits(out, p++, final);
    ++lf[256];
    var _a = hTree(lf, 15), dlt = _a.t, mlb = _a.l;
    var _b = hTree(df, 15), ddt = _b.t, mdb = _b.l;
    var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
    var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
    var lcfreq = new u16(19);
    for (var i = 0; i < lclt.length; ++i)
        ++lcfreq[lclt[i] & 31];
    for (var i = 0; i < lcdt.length; ++i)
        ++lcfreq[lcdt[i] & 31];
    var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
    var nlcc = 19;
    for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
        ;
    var flen = (bl + 5) << 3;
    var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
    var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
    if (bs >= 0 && flen <= ftlen && flen <= dtlen)
        return wfblk(out, p, dat.subarray(bs, bs + bl));
    var lm, ll, dm, dl;
    wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
    if (dtlen < ftlen) {
        lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
        var llm = hMap(lct, mlcb, 0);
        wbits(out, p, nlc - 257);
        wbits(out, p + 5, ndc - 1);
        wbits(out, p + 10, nlcc - 4);
        p += 14;
        for (var i = 0; i < nlcc; ++i)
            wbits(out, p + 3 * i, lct[clim[i]]);
        p += 3 * nlcc;
        var lcts = [lclt, lcdt];
        for (var it = 0; it < 2; ++it) {
            var clct = lcts[it];
            for (var i = 0; i < clct.length; ++i) {
                var len = clct[i] & 31;
                wbits(out, p, llm[len]), p += lct[len];
                if (len > 15)
                    wbits(out, p, (clct[i] >> 5) & 127), p += clct[i] >> 12;
            }
        }
    }
    else {
        lm = flm, ll = flt, dm = fdm, dl = fdt;
    }
    for (var i = 0; i < li; ++i) {
        var sym = syms[i];
        if (sym > 255) {
            var len = (sym >> 18) & 31;
            wbits16(out, p, lm[len + 257]), p += ll[len + 257];
            if (len > 7)
                wbits(out, p, (sym >> 23) & 31), p += fleb[len];
            var dst = sym & 31;
            wbits16(out, p, dm[dst]), p += dl[dst];
            if (dst > 3)
                wbits16(out, p, (sym >> 5) & 8191), p += fdeb[dst];
        }
        else {
            wbits16(out, p, lm[sym]), p += ll[sym];
        }
    }
    wbits16(out, p, lm[256]);
    return p + ll[256];
};
// deflate options (nice << 13) | chain
var deo = /*#__PURE__*/ new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
// empty
var et = /*#__PURE__*/ new u8(0);
// compresses data into a raw DEFLATE buffer
var dflt = function (dat, lvl, plvl, pre, post, st) {
    var s = st.z || dat.length;
    var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7000)) + post);
    // writing to this writes to the output buffer
    var w = o.subarray(pre, o.length - post);
    var lst = st.l;
    var pos = (st.r || 0) & 7;
    if (lvl) {
        if (pos)
            w[0] = st.r >> 3;
        var opt = deo[lvl - 1];
        var n = opt >> 13, c = opt & 8191;
        var msk_1 = (1 << plvl) - 1;
        //    prev 2-byte val map    curr 2-byte val map
        var prev = st.p || new u16(32768), head = st.h || new u16(msk_1 + 1);
        var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
        var hsh = function (i) { return (dat[i] ^ (dat[i + 1] << bs1_1) ^ (dat[i + 2] << bs2_1)) & msk_1; };
        // 24576 is an arbitrary number of maximum symbols per block
        // 424 buffer for last block
        var syms = new i32(25000);
        // length/literal freq   distance freq
        var lf = new u16(288), df = new u16(32);
        //  l/lcnt  exbits  index          l/lind  waitdx          blkpos
        var lc_1 = 0, eb = 0, i = st.i || 0, li = 0, wi = st.w || 0, bs = 0;
        for (; i + 2 < s; ++i) {
            // hash value
            var hv = hsh(i);
            // index mod 32768    previous index mod
            var imod = i & 32767, pimod = head[hv];
            prev[imod] = pimod;
            head[hv] = imod;
            // We always should modify head and prev, but only add symbols if
            // this data is not yet processed ("wait" for wait index)
            if (wi <= i) {
                // bytes remaining
                var rem = s - i;
                if ((lc_1 > 7000 || li > 24576) && (rem > 423 || !lst)) {
                    pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i - bs, pos);
                    li = lc_1 = eb = 0, bs = i;
                    for (var j = 0; j < 286; ++j)
                        lf[j] = 0;
                    for (var j = 0; j < 30; ++j)
                        df[j] = 0;
                }
                //  len    dist   chain
                var l = 2, d = 0, ch_1 = c, dif = imod - pimod & 32767;
                if (rem > 2 && hv == hsh(i - dif)) {
                    var maxn = Math.min(n, rem) - 1;
                    var maxd = Math.min(32767, i);
                    // max possible length
                    // not capped at dif because decompressors implement "rolling" index population
                    var ml = Math.min(258, rem);
                    while (dif <= maxd && --ch_1 && imod != pimod) {
                        if (dat[i + l] == dat[i + l - dif]) {
                            var nl = 0;
                            for (; nl < ml && dat[i + nl] == dat[i + nl - dif]; ++nl)
                                ;
                            if (nl > l) {
                                l = nl, d = dif;
                                // break out early when we reach "nice" (we are satisfied enough)
                                if (nl > maxn)
                                    break;
                                // now, find the rarest 2-byte sequence within this
                                // length of literals and search for that instead.
                                // Much faster than just using the start
                                var mmd = Math.min(dif, nl - 2);
                                var md = 0;
                                for (var j = 0; j < mmd; ++j) {
                                    var ti = i - dif + j & 32767;
                                    var pti = prev[ti];
                                    var cd = ti - pti & 32767;
                                    if (cd > md)
                                        md = cd, pimod = ti;
                                }
                            }
                        }
                        // check the previous match
                        imod = pimod, pimod = prev[imod];
                        dif += imod - pimod & 32767;
                    }
                }
                // d will be nonzero only when a match was found
                if (d) {
                    // store both dist and len data in one int32
                    // Make sure this is recognized as a len/dist with 28th bit (2^28)
                    syms[li++] = 268435456 | (revfl[l] << 18) | revfd[d];
                    var lin = revfl[l] & 31, din = revfd[d] & 31;
                    eb += fleb[lin] + fdeb[din];
                    ++lf[257 + lin];
                    ++df[din];
                    wi = i + l;
                    ++lc_1;
                }
                else {
                    syms[li++] = dat[i];
                    ++lf[dat[i]];
                }
            }
        }
        for (i = Math.max(i, wi); i < s; ++i) {
            syms[li++] = dat[i];
            ++lf[dat[i]];
        }
        pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i - bs, pos);
        if (!lst) {
            st.r = (pos & 7) | w[(pos / 8) | 0] << 3;
            // shft(pos) now 1 less if pos & 7 != 0
            pos -= 7;
            st.h = head, st.p = prev, st.i = i, st.w = wi;
        }
    }
    else {
        for (var i = st.w || 0; i < s + lst; i += 65535) {
            // end
            var e = i + 65535;
            if (e >= s) {
                // write final block
                w[(pos / 8) | 0] = lst;
                e = s;
            }
            pos = wfblk(w, pos + 1, dat.subarray(i, e));
        }
        st.i = s;
    }
    return slc(o, 0, pre + shft(pos) + post);
};
// CRC32 table
var crct = /*#__PURE__*/ (function () {
    var t = new Int32Array(256);
    for (var i = 0; i < 256; ++i) {
        var c = i, k = 9;
        while (--k)
            c = ((c & 1) && -306674912) ^ (c >>> 1);
        t[i] = c;
    }
    return t;
})();
// CRC32
var crc = function () {
    var c = -1;
    return {
        p: function (d) {
            // closures have awful performance
            var cr = c;
            for (var i = 0; i < d.length; ++i)
                cr = crct[(cr & 255) ^ d[i]] ^ (cr >>> 8);
            c = cr;
        },
        d: function () { return ~c; }
    };
};
// Adler32
var adler = function () {
    var a = 1, b = 0;
    return {
        p: function (d) {
            // closures have awful performance
            var n = a, m = b;
            var l = d.length | 0;
            for (var i = 0; i != l;) {
                var e = Math.min(i + 2655, l);
                for (; i < e; ++i)
                    m += n += d[i];
                n = (n & 65535) + 15 * (n >> 16), m = (m & 65535) + 15 * (m >> 16);
            }
            a = n, b = m;
        },
        d: function () {
            a %= 65521, b %= 65521;
            return (a & 255) << 24 | (a & 0xFF00) << 8 | (b & 255) << 8 | (b >> 8);
        }
    };
};
;
// deflate with opts
var dopt = function (dat, opt, pre, post, st) {
    if (!st) {
        st = { l: 1 };
        if (opt.dictionary) {
            var dict = opt.dictionary.subarray(-32768);
            var newDat = new u8(dict.length + dat.length);
            newDat.set(dict);
            newDat.set(dat, dict.length);
            dat = newDat;
            st.w = dict.length;
        }
    }
    return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? (st.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20) : (12 + opt.mem), pre, post, st);
};
// Walmart object spread
var mrg = function (a, b) {
    var o = {};
    for (var k in a)
        o[k] = a[k];
    for (var k in b)
        o[k] = b[k];
    return o;
};
// worker clone
// This is possibly the craziest part of the entire codebase, despite how simple it may seem.
// The only parameter to this function is a closure that returns an array of variables outside of the function scope.
// We're going to try to figure out the variable names used in the closure as strings because that is crucial for workerization.
// We will return an object mapping of true variable name to value (basically, the current scope as a JS object).
// The reason we can't just use the original variable names is minifiers mangling the toplevel scope.
// This took me three weeks to figure out how to do.
var wcln = function (fn, fnStr, td) {
    var dt = fn();
    var st = fn.toString();
    var ks = st.slice(st.indexOf('[') + 1, st.lastIndexOf(']')).replace(/\s+/g, '').split(',');
    for (var i = 0; i < dt.length; ++i) {
        var v = dt[i], k = ks[i];
        if (typeof v == 'function') {
            fnStr += ';' + k + '=';
            var st_1 = v.toString();
            if (v.prototype) {
                // for global objects
                if (st_1.indexOf('[native code]') != -1) {
                    var spInd = st_1.indexOf(' ', 8) + 1;
                    fnStr += st_1.slice(spInd, st_1.indexOf('(', spInd));
                }
                else {
                    fnStr += st_1;
                    for (var t in v.prototype)
                        fnStr += ';' + k + '.prototype.' + t + '=' + v.prototype[t].toString();
                }
            }
            else
                fnStr += st_1;
        }
        else
            td[k] = v;
    }
    return fnStr;
};
var ch = (/* unused pure expression or super */ null && ([]));
// clone bufs
var cbfs = function (v) {
    var tl = [];
    for (var k in v) {
        if (v[k].buffer) {
            tl.push((v[k] = new v[k].constructor(v[k])).buffer);
        }
    }
    return tl;
};
// use a worker to execute code
var wrkr = function (fns, init, id, cb) {
    if (!ch[id]) {
        var fnStr = '', td_1 = {}, m = fns.length - 1;
        for (var i = 0; i < m; ++i)
            fnStr = wcln(fns[i], fnStr, td_1);
        ch[id] = { c: wcln(fns[m], fnStr, td_1), e: td_1 };
    }
    var td = mrg({}, ch[id].e);
    return wk(ch[id].c + ';onmessage=function(e){for(var k in e.data)self[k]=e.data[k];onmessage=' + init.toString() + '}', id, td, cbfs(td), cb);
};
// base async inflate fn
var bInflt = function () { return [u8, u16, i32, fleb, fdeb, clim, fl, fd, flrm, fdrm, rev, ec, hMap, max, bits, bits16, shft, slc, err, inflt, inflateSync, pbf, gopt]; };
var bDflt = function () { return [u8, u16, i32, fleb, fdeb, clim, revfl, revfd, flm, flt, fdm, fdt, rev, deo, et, hMap, wbits, wbits16, hTree, ln, lc, clen, wfblk, wblk, shft, slc, dflt, dopt, deflateSync, pbf]; };
// gzip extra
var gze = function () { return [gzh, gzhl, wbytes, crc, crct]; };
// gunzip extra
var guze = function () { return [gzs, gzl]; };
// zlib extra
var zle = function () { return [zlh, wbytes, adler]; };
// unzlib extra
var zule = function () { return [zls]; };
// post buf
var pbf = function (msg) { return postMessage(msg, [msg.buffer]); };
// get opts
var gopt = function (o) { return o && {
    out: o.size && new u8(o.size),
    dictionary: o.dictionary
}; };
// async helper
var cbify = function (dat, opts, fns, init, id, cb) {
    var w = wrkr(fns, init, id, function (err, dat) {
        w.terminate();
        cb(err, dat);
    });
    w.postMessage([dat, opts], opts.consume ? [dat.buffer] : []);
    return function () { w.terminate(); };
};
// auto stream
var astrm = function (strm) {
    strm.ondata = function (dat, final) { return postMessage([dat, final], [dat.buffer]); };
    return function (ev) {
        if (ev.data[0]) {
            strm.push(ev.data[0], ev.data[1]);
            postMessage([ev.data[0].length]);
        }
        else
            strm.flush(ev.data[1]);
    };
};
// async stream attach
var astrmify = function (fns, strm, opts, init, id, flush, ext) {
    var t;
    var w = wrkr(fns, init, id, function (err, dat) {
        if (err)
            w.terminate(), strm.ondata.call(strm, err);
        else if (!Array.isArray(dat))
            ext(dat);
        else if (dat.length == 1) {
            strm.queuedSize -= dat[0];
            if (strm.ondrain)
                strm.ondrain(dat[0]);
        }
        else {
            if (dat[1])
                w.terminate();
            strm.ondata.call(strm, err, dat[0], dat[1]);
        }
    });
    w.postMessage(opts);
    strm.queuedSize = 0;
    strm.push = function (d, f) {
        if (!strm.ondata)
            err(5);
        if (t)
            strm.ondata(err(4, 0, 1), null, !!f);
        strm.queuedSize += d.length;
        // can fail for cross-realm Uint8Array, but ok - only a small performance penalty
        w.postMessage([d, t = f], d.buffer instanceof ArrayBuffer ? [d.buffer] : []);
    };
    strm.terminate = function () { w.terminate(); };
    if (flush) {
        strm.flush = function (sync) { w.postMessage([0, sync]); };
    }
};
// read 2 bytes
var b2 = function (d, b) { return d[b] | (d[b + 1] << 8); };
// read 4 bytes
var b4 = function (d, b) { return (d[b] | (d[b + 1] << 8) | (d[b + 2] << 16) | (d[b + 3] << 24)) >>> 0; };
// read 8 bytes
var b8 = function (d, b) { return b4(d, b) + (b4(d, b + 4) * 4294967296); };
// write bytes
var wbytes = function (d, b, v) {
    for (; v; ++b)
        d[b] = v, v >>>= 8;
};
// gzip header
var gzh = function (c, o) {
    var fn = o.filename;
    c[0] = 31, c[1] = 139, c[2] = 8, c[8] = o.level < 2 ? 4 : o.level == 9 ? 2 : 0, c[9] = 3; // assume Unix
    if (o.mtime != 0)
        wbytes(c, 4, Math.floor(new Date(o.mtime || Date.now()) / 1000));
    if (fn) {
        c[3] = 8;
        for (var i = 0; i <= fn.length; ++i)
            c[i + 10] = fn.charCodeAt(i);
    }
};
// gzip footer: -8 to -4 = CRC, -4 to -0 is length
// gzip start
var gzs = function (d) {
    if (d[0] != 31 || d[1] != 139 || d[2] != 8)
        err(6, 'invalid gzip data');
    var flg = d[3];
    var st = 10;
    if (flg & 4)
        st += (d[10] | d[11] << 8) + 2;
    for (var zs = (flg >> 3 & 1) + (flg >> 4 & 1); zs > 0; zs -= !d[st++])
        ;
    return st + (flg & 2);
};
// gzip length
var gzl = function (d) {
    var l = d.length;
    return (d[l - 4] | d[l - 3] << 8 | d[l - 2] << 16 | d[l - 1] << 24) >>> 0;
};
// gzip header length
var gzhl = function (o) { return 10 + (o.filename ? o.filename.length + 1 : 0); };
// zlib header
var zlh = function (c, o) {
    var lv = o.level, fl = lv == 0 ? 0 : lv < 6 ? 1 : lv == 9 ? 3 : 2;
    c[0] = 120, c[1] = (fl << 6) | (o.dictionary && 32);
    c[1] |= 31 - ((c[0] << 8) | c[1]) % 31;
    if (o.dictionary) {
        var h = adler();
        h.p(o.dictionary);
        wbytes(c, 2, h.d());
    }
};
// zlib start
var zls = function (d, dict) {
    if ((d[0] & 15) != 8 || (d[0] >> 4) > 7 || ((d[0] << 8 | d[1]) % 31))
        err(6, 'invalid zlib data');
    if ((d[1] >> 5 & 1) == +!dict)
        err(6, 'invalid zlib data: ' + (d[1] & 32 ? 'need' : 'unexpected') + ' dictionary');
    return (d[1] >> 3 & 4) + 2;
};
function StrmOpt(opts, cb) {
    if (typeof opts == 'function')
        cb = opts, opts = {};
    this.ondata = cb;
    return opts;
}
/**
 * Streaming DEFLATE compression
 */
var Deflate = /*#__PURE__*/ ((/* unused pure expression or super */ null && (function () {
    function Deflate(opts, cb) {
        if (typeof opts == 'function')
            cb = opts, opts = {};
        this.ondata = cb;
        this.o = opts || {};
        this.s = { l: 0, i: 32768, w: 32768, z: 32768 };
        // Buffer length must always be 0 mod 32768 for index calculations to be correct when modifying head and prev
        // 98304 = 32768 (lookback) + 65536 (common chunk size)
        this.b = new u8(98304);
        if (this.o.dictionary) {
            var dict = this.o.dictionary.subarray(-32768);
            this.b.set(dict, 32768 - dict.length);
            this.s.i = 32768 - dict.length;
        }
    }
    Deflate.prototype.p = function (c, f) {
        this.ondata(dopt(c, this.o, 0, 0, this.s), f);
    };
    /**
     * Pushes a chunk to be deflated
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    Deflate.prototype.push = function (chunk, final) {
        if (!this.ondata)
            err(5);
        if (this.s.l)
            err(4);
        var endLen = chunk.length + this.s.z;
        if (endLen > this.b.length) {
            if (endLen > 2 * this.b.length - 32768) {
                var newBuf = new u8(endLen & -32768);
                newBuf.set(this.b.subarray(0, this.s.z));
                this.b = newBuf;
            }
            var split = this.b.length - this.s.z;
            this.b.set(chunk.subarray(0, split), this.s.z);
            this.s.z = this.b.length;
            this.p(this.b, false);
            this.b.set(this.b.subarray(-32768));
            this.b.set(chunk.subarray(split), 32768);
            this.s.z = chunk.length - split + 32768;
            this.s.i = 32766, this.s.w = 32768;
        }
        else {
            this.b.set(chunk, this.s.z);
            this.s.z += chunk.length;
        }
        this.s.l = final & 1;
        if (this.s.z > this.s.w + 8191 || final) {
            this.p(this.b, final || false);
            this.s.w = this.s.i, this.s.i -= 2;
        }
        if (final) {
            // cleanup unneeded buffers/state to reduce memory usage
            this.s = this.o = {};
            this.b = et;
        }
    };
    /**
     * Flushes buffered uncompressed data. Useful to immediately retrieve the
     * deflated output for small inputs.
     * @param sync Whether to flush to a byte boundary. A sync flush takes 4-5
     *             extra bytes, but guarantees all pushed data is immediately
     *             decompressible. A separate DEFLATE stream may be concatenated
     *             with the current output after a sync flush.
     */
    Deflate.prototype.flush = function (sync) {
        if (!this.ondata)
            err(5);
        if (this.s.l)
            err(4);
        this.p(this.b, false);
        this.s.w = this.s.i, this.s.i -= 2;
        // could technically skip writing the type-0 block for (this.s.r & 7) == 0,
        // but the deterministic trailer (00 00 FF FF) is useful in some situations
        if (sync) {
            var c = new u8(6);
            c[0] = this.s.r >> 3;
            // write empty, non-final type-0 block
            var ep = wfblk(c, this.s.r, et);
            this.s.r = 0;
            this.ondata(c.subarray(0, ep >> 3), false);
        }
    };
    return Deflate;
}())));

/**
 * Asynchronous streaming DEFLATE compression
 */
var AsyncDeflate = /*#__PURE__*/ ((/* unused pure expression or super */ null && (function () {
    function AsyncDeflate(opts, cb) {
        astrmify([
            bDflt,
            function () { return [astrm, Deflate]; }
        ], this, StrmOpt.call(this, opts, cb), function (ev) {
            var strm = new Deflate(ev.data);
            onmessage = astrm(strm);
        }, 6, 1);
    }
    return AsyncDeflate;
}())));

function deflate(data, opts, cb) {
    if (!cb)
        cb = opts, opts = {};
    if (typeof cb != 'function')
        err(7);
    return cbify(data, opts, [
        bDflt,
    ], function (ev) { return pbf(deflateSync(ev.data[0], ev.data[1])); }, 0, cb);
}
/**
 * Compresses data with DEFLATE without any wrapper
 * @param data The data to compress
 * @param opts The compression options
 * @returns The deflated version of the data
 */
function deflateSync(data, opts) {
    return dopt(data, opts || {}, 0, 0);
}
/**
 * Streaming DEFLATE decompression
 */
var Inflate = /*#__PURE__*/ ((/* unused pure expression or super */ null && (function () {
    function Inflate(opts, cb) {
        // no StrmOpt here to avoid adding to workerizer
        if (typeof opts == 'function')
            cb = opts, opts = {};
        this.ondata = cb;
        var dict = opts && opts.dictionary && opts.dictionary.subarray(-32768);
        this.s = { i: 0, b: dict ? dict.length : 0 };
        this.o = new u8(32768);
        this.p = new u8(0);
        if (dict)
            this.o.set(dict);
    }
    Inflate.prototype.e = function (c) {
        if (!this.ondata)
            err(5);
        if (this.d)
            err(4);
        if (!this.p.length)
            this.p = c;
        else if (c.length) {
            var n = new u8(this.p.length + c.length);
            n.set(this.p), n.set(c, this.p.length), this.p = n;
        }
    };
    Inflate.prototype.c = function (final) {
        this.s.i = +(this.d = final || false);
        var bts = this.s.b;
        var dt = inflt(this.p, this.s, this.o);
        this.ondata(slc(dt, bts, this.s.b), this.d);
        this.o = slc(dt, this.s.b - 32768), this.s.b = this.o.length;
        this.p = slc(this.p, (this.s.p / 8) | 0), this.s.p &= 7;
    };
    /**
     * Pushes a chunk to be inflated
     * @param chunk The chunk to push
     * @param final Whether this is the final chunk
     */
    Inflate.prototype.push = function (chunk, final) {
        this.e(chunk), this.c(final);
    };
    return Inflate;
}())));

/**
 * Asynchronous streaming DEFLATE decompression
 */
var AsyncInflate = /*#__PURE__*/ ((/* unused pure expression or super */ null && (function () {
    function AsyncInflate(opts, cb) {
        astrmify([
            bInflt,
            function () { return [astrm, Inflate]; }
        ], this, StrmOpt.call(this, opts, cb), function (ev) {
            var strm = new Inflate(ev.data);
            onmessage = astrm(strm);
        }, 7, 0);
    }
    return AsyncInflate;
}())));

function inflate(data, opts, cb) {
    if (!cb)
        cb = opts, opts = {};
    if (typeof cb != 'function')
        err(7);
    return cbify(data, opts, [
        bInflt
    ], function (ev) { return pbf(inflateSync(ev.data[0], gopt(ev.data[1]))); }, 1, cb);
}
function inflateSync(data, opts) {
    return inflt(data, { i: 2 }, opts && opts.out, opts && opts.dictionary);
}
// before you yell at me for not just using extends, my reason is that TS inheritance is hard to workerize.
/**
 * Streaming GZIP compression
 */
var Gzip = /*#__PURE__*/ ((/* unused pure expression or super */ null && (function () {
    function Gzip(opts, cb) {
        this.c = crc();
        this.l = 0;
        this.v = 1;
        Deflate.call(this, opts, cb);
    }
    /**
     * Pushes a chunk to be GZIPped
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    Gzip.prototype.push = function (chunk, final) {
        this.c.p(chunk);
        this.l += chunk.length;
        Deflate.prototype.push.call(this, chunk, final);
    };
    Gzip.prototype.p = function (c, f) {
        var raw = dopt(c, this.o, this.v && gzhl(this.o), f && 8, this.s);
        if (this.v)
            gzh(raw, this.o), this.v = 0;
        if (f)
            wbytes(raw, raw.length - 8, this.c.d()), wbytes(raw, raw.length - 4, this.l);
        this.ondata(raw, f);
    };
    /**
     * Flushes buffered uncompressed data. Useful to immediately retrieve the
     * GZIPped output for small inputs.
     * @param sync Whether to flush to a byte boundary. A sync flush takes 4-5
     *             extra bytes, but guarantees all pushed data is immediately
     *             decompressible.
     */
    Gzip.prototype.flush = function (sync) {
        Deflate.prototype.flush.call(this, sync);
    };
    return Gzip;
}())));

/**
 * Asynchronous streaming GZIP compression
 */
var AsyncGzip = /*#__PURE__*/ ((/* unused pure expression or super */ null && (function () {
    function AsyncGzip(opts, cb) {
        astrmify([
            bDflt,
            gze,
            function () { return [astrm, Deflate, Gzip]; }
        ], this, StrmOpt.call(this, opts, cb), function (ev) {
            var strm = new Gzip(ev.data);
            onmessage = astrm(strm);
        }, 8, 1);
    }
    return AsyncGzip;
}())));

function gzip(data, opts, cb) {
    if (!cb)
        cb = opts, opts = {};
    if (typeof cb != 'function')
        err(7);
    return cbify(data, opts, [
        bDflt,
        gze,
        function () { return [gzipSync]; }
    ], function (ev) { return pbf(gzipSync(ev.data[0], ev.data[1])); }, 2, cb);
}
/**
 * Compresses data with GZIP
 * @param data The data to compress
 * @param opts The compression options
 * @returns The gzipped version of the data
 */
function gzipSync(data, opts) {
    if (!opts)
        opts = {};
    var c = crc(), l = data.length;
    c.p(data);
    var d = dopt(data, opts, gzhl(opts), 8), s = d.length;
    return gzh(d, opts), wbytes(d, s - 8, c.d()), wbytes(d, s - 4, l), d;
}
/**
 * Streaming single or multi-member GZIP decompression
 */
var Gunzip = /*#__PURE__*/ ((/* unused pure expression or super */ null && (function () {
    function Gunzip(opts, cb) {
        this.v = 1;
        this.r = 0;
        Inflate.call(this, opts, cb);
    }
    /**
     * Pushes a chunk to be GUNZIPped
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    Gunzip.prototype.push = function (chunk, final) {
        Inflate.prototype.e.call(this, chunk);
        this.r += chunk.length;
        if (this.v) {
            var p = this.p.subarray(this.v - 1);
            var s = p.length > 3 ? gzs(p) : 4;
            if (s > p.length) {
                if (!final)
                    return;
            }
            else if (this.v > 1 && this.onmember) {
                this.onmember(this.r - p.length);
            }
            this.p = p.subarray(s), this.v = 0;
        }
        // necessary to prevent TS from using the closure value
        // This allows for workerization to function correctly
        Inflate.prototype.c.call(this, 0);
        // process concatenated GZIP
        if (this.s.f && !this.s.l) {
            this.v = shft(this.s.p) + 9;
            this.s = { i: 0 };
            this.o = new u8(0);
            this.push(new u8(0), final);
        }
        else if (final) {
            Inflate.prototype.c.call(this, final);
        }
    };
    return Gunzip;
}())));

/**
 * Asynchronous streaming single or multi-member GZIP decompression
 */
var AsyncGunzip = /*#__PURE__*/ ((/* unused pure expression or super */ null && (function () {
    function AsyncGunzip(opts, cb) {
        var _this = this;
        astrmify([
            bInflt,
            guze,
            function () { return [astrm, Inflate, Gunzip]; }
        ], this, StrmOpt.call(this, opts, cb), function (ev) {
            var strm = new Gunzip(ev.data);
            strm.onmember = function (offset) { return postMessage(offset); };
            onmessage = astrm(strm);
        }, 9, 0, function (offset) { return _this.onmember && _this.onmember(offset); });
    }
    return AsyncGunzip;
}())));

function gunzip(data, opts, cb) {
    if (!cb)
        cb = opts, opts = {};
    if (typeof cb != 'function')
        err(7);
    return cbify(data, opts, [
        bInflt,
        guze,
        function () { return [gunzipSync]; }
    ], function (ev) { return pbf(gunzipSync(ev.data[0], ev.data[1])); }, 3, cb);
}
function gunzipSync(data, opts) {
    var st = gzs(data);
    if (st + 8 > data.length)
        err(6, 'invalid gzip data');
    return inflt(data.subarray(st, -8), { i: 2 }, opts && opts.out || new u8(gzl(data)), opts && opts.dictionary);
}
/**
 * Streaming Zlib compression
 */
var Zlib = /*#__PURE__*/ ((/* unused pure expression or super */ null && (function () {
    function Zlib(opts, cb) {
        this.c = adler();
        this.v = 1;
        Deflate.call(this, opts, cb);
    }
    /**
     * Pushes a chunk to be zlibbed
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    Zlib.prototype.push = function (chunk, final) {
        this.c.p(chunk);
        Deflate.prototype.push.call(this, chunk, final);
    };
    Zlib.prototype.p = function (c, f) {
        var raw = dopt(c, this.o, this.v && (this.o.dictionary ? 6 : 2), f && 4, this.s);
        if (this.v)
            zlh(raw, this.o), this.v = 0;
        if (f)
            wbytes(raw, raw.length - 4, this.c.d());
        this.ondata(raw, f);
    };
    /**
     * Flushes buffered uncompressed data. Useful to immediately retrieve the
     * zlibbed output for small inputs.
     * @param sync Whether to flush to a byte boundary. A sync flush takes 4-5
     *             extra bytes, but guarantees all pushed data is immediately
     *             decompressible.
     */
    Zlib.prototype.flush = function (sync) {
        Deflate.prototype.flush.call(this, sync);
    };
    return Zlib;
}())));

/**
 * Asynchronous streaming Zlib compression
 */
var AsyncZlib = /*#__PURE__*/ ((/* unused pure expression or super */ null && (function () {
    function AsyncZlib(opts, cb) {
        astrmify([
            bDflt,
            zle,
            function () { return [astrm, Deflate, Zlib]; }
        ], this, StrmOpt.call(this, opts, cb), function (ev) {
            var strm = new Zlib(ev.data);
            onmessage = astrm(strm);
        }, 10, 1);
    }
    return AsyncZlib;
}())));

function zlib(data, opts, cb) {
    if (!cb)
        cb = opts, opts = {};
    if (typeof cb != 'function')
        err(7);
    return cbify(data, opts, [
        bDflt,
        zle,
        function () { return [zlibSync]; }
    ], function (ev) { return pbf(zlibSync(ev.data[0], ev.data[1])); }, 4, cb);
}
/**
 * Compress data with Zlib
 * @param data The data to compress
 * @param opts The compression options
 * @returns The zlib-compressed version of the data
 */
function zlibSync(data, opts) {
    if (!opts)
        opts = {};
    var a = adler();
    a.p(data);
    var d = dopt(data, opts, opts.dictionary ? 6 : 2, 4);
    return zlh(d, opts), wbytes(d, d.length - 4, a.d()), d;
}
/**
 * Streaming Zlib decompression
 */
var Unzlib = /*#__PURE__*/ ((/* unused pure expression or super */ null && (function () {
    function Unzlib(opts, cb) {
        Inflate.call(this, opts, cb);
        this.v = opts && opts.dictionary ? 2 : 1;
    }
    /**
     * Pushes a chunk to be unzlibbed
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    Unzlib.prototype.push = function (chunk, final) {
        Inflate.prototype.e.call(this, chunk);
        if (this.v) {
            if (this.p.length < 6 && !final)
                return;
            this.p = this.p.subarray(zls(this.p, this.v - 1)), this.v = 0;
        }
        if (final) {
            if (this.p.length < 4)
                err(6, 'invalid zlib data');
            this.p = this.p.subarray(0, -4);
        }
        // necessary to prevent TS from using the closure value
        // This allows for workerization to function correctly
        Inflate.prototype.c.call(this, final);
    };
    return Unzlib;
}())));

/**
 * Asynchronous streaming Zlib decompression
 */
var AsyncUnzlib = /*#__PURE__*/ ((/* unused pure expression or super */ null && (function () {
    function AsyncUnzlib(opts, cb) {
        astrmify([
            bInflt,
            zule,
            function () { return [astrm, Inflate, Unzlib]; }
        ], this, StrmOpt.call(this, opts, cb), function (ev) {
            var strm = new Unzlib(ev.data);
            onmessage = astrm(strm);
        }, 11, 0);
    }
    return AsyncUnzlib;
}())));

function unzlib(data, opts, cb) {
    if (!cb)
        cb = opts, opts = {};
    if (typeof cb != 'function')
        err(7);
    return cbify(data, opts, [
        bInflt,
        zule,
        function () { return [unzlibSync]; }
    ], function (ev) { return pbf(unzlibSync(ev.data[0], gopt(ev.data[1]))); }, 5, cb);
}
function unzlibSync(data, opts) {
    return inflt(data.subarray(zls(data, opts && opts.dictionary), -4), { i: 2 }, opts && opts.out, opts && opts.dictionary);
}
// Default algorithm for compression (used because having a known output size allows faster decompression)


/**
 * Streaming GZIP, Zlib, or raw DEFLATE decompression
 */
var Decompress = /*#__PURE__*/ ((/* unused pure expression or super */ null && (function () {
    function Decompress(opts, cb) {
        this.o = StrmOpt.call(this, opts, cb) || {};
        this.G = Gunzip;
        this.I = Inflate;
        this.Z = Unzlib;
    }
    // init substream
    // overriden by AsyncDecompress
    Decompress.prototype.i = function () {
        var _this = this;
        this.s.ondata = function (dat, final) {
            _this.ondata(dat, final);
        };
    };
    /**
     * Pushes a chunk to be decompressed
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    Decompress.prototype.push = function (chunk, final) {
        if (!this.ondata)
            err(5);
        if (!this.s) {
            if (this.p && this.p.length) {
                var n = new u8(this.p.length + chunk.length);
                n.set(this.p), n.set(chunk, this.p.length);
            }
            else
                this.p = chunk;
            if (this.p.length > 2) {
                this.s = (this.p[0] == 31 && this.p[1] == 139 && this.p[2] == 8)
                    ? new this.G(this.o)
                    : ((this.p[0] & 15) != 8 || (this.p[0] >> 4) > 7 || ((this.p[0] << 8 | this.p[1]) % 31))
                        ? new this.I(this.o)
                        : new this.Z(this.o);
                this.i();
                this.s.push(this.p, final);
                this.p = null;
            }
        }
        else
            this.s.push(chunk, final);
    };
    return Decompress;
}())));

/**
 * Asynchronous streaming GZIP, Zlib, or raw DEFLATE decompression
 */
var AsyncDecompress = /*#__PURE__*/ ((/* unused pure expression or super */ null && (function () {
    function AsyncDecompress(opts, cb) {
        Decompress.call(this, opts, cb);
        this.queuedSize = 0;
        this.G = AsyncGunzip;
        this.I = AsyncInflate;
        this.Z = AsyncUnzlib;
    }
    AsyncDecompress.prototype.i = function () {
        var _this = this;
        this.s.ondata = function (err, dat, final) {
            _this.ondata(err, dat, final);
        };
        this.s.ondrain = function (size) {
            _this.queuedSize -= size;
            if (_this.ondrain)
                _this.ondrain(size);
        };
    };
    /**
     * Pushes a chunk to be decompressed
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    AsyncDecompress.prototype.push = function (chunk, final) {
        this.queuedSize += chunk.length;
        Decompress.prototype.push.call(this, chunk, final);
    };
    return AsyncDecompress;
}())));

function decompress(data, opts, cb) {
    if (!cb)
        cb = opts, opts = {};
    if (typeof cb != 'function')
        err(7);
    return (data[0] == 31 && data[1] == 139 && data[2] == 8)
        ? gunzip(data, opts, cb)
        : ((data[0] & 15) != 8 || (data[0] >> 4) > 7 || ((data[0] << 8 | data[1]) % 31))
            ? inflate(data, opts, cb)
            : unzlib(data, opts, cb);
}
/**
 * Expands compressed GZIP, Zlib, or raw DEFLATE data, automatically detecting the format
 * @param data The data to decompress
 * @param opts The decompression options
 * @returns The decompressed version of the data
 */
function decompressSync(data, opts) {
    return (data[0] == 31 && data[1] == 139 && data[2] == 8)
        ? gunzipSync(data, opts)
        : ((data[0] & 15) != 8 || (data[0] >> 4) > 7 || ((data[0] << 8 | data[1]) % 31))
            ? inflateSync(data, opts)
            : unzlibSync(data, opts);
}
// flatten a directory structure
var fltn = function (d, p, t, o) {
    for (var k in d) {
        var val = d[k], n = p + k, op = o;
        if (Array.isArray(val))
            op = mrg(o, val[1]), val = val[0];
        if (ArrayBuffer.isView(val))
            t[n] = [val, op];
        else {
            t[n += '/'] = [new u8(0), op];
            fltn(val, n, t, o);
        }
    }
};
// text encoder
var te = typeof TextEncoder != 'undefined' && /*#__PURE__*/ new TextEncoder();
// text decoder
var td = typeof TextDecoder != 'undefined' && /*#__PURE__*/ new TextDecoder();
// text decoder stream
var tds = 0;
try {
    td.decode(et, { stream: true });
    tds = 1;
}
catch (e) { }
// decode UTF8
var dutf8 = function (d) {
    for (var r = '', i = 0;;) {
        var c = d[i++];
        var eb = (c > 127) + (c > 223) + (c > 239);
        if (i + eb > d.length)
            return { s: r, r: slc(d, i - 1) };
        if (!eb)
            r += String.fromCharCode(c);
        else if (eb == 3) {
            c = ((c & 15) << 18 | (d[i++] & 63) << 12 | (d[i++] & 63) << 6 | (d[i++] & 63)) - 65536,
                r += String.fromCharCode(55296 | (c >> 10), 56320 | (c & 1023));
        }
        else if (eb & 1)
            r += String.fromCharCode((c & 31) << 6 | (d[i++] & 63));
        else
            r += String.fromCharCode((c & 15) << 12 | (d[i++] & 63) << 6 | (d[i++] & 63));
    }
};
/**
 * Streaming UTF-8 decoding
 */
var DecodeUTF8 = /*#__PURE__*/ ((/* unused pure expression or super */ null && (function () {
    /**
     * Creates a UTF-8 decoding stream
     * @param cb The callback to call whenever data is decoded
     */
    function DecodeUTF8(cb) {
        this.ondata = cb;
        if (tds)
            this.t = new TextDecoder();
        else
            this.p = et;
    }
    /**
     * Pushes a chunk to be decoded from UTF-8 binary
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    DecodeUTF8.prototype.push = function (chunk, final) {
        if (!this.ondata)
            err(5);
        final = !!final;
        if (this.t) {
            this.ondata(this.t.decode(chunk, { stream: true }), final);
            if (final) {
                if (this.t.decode().length)
                    err(8);
                this.t = null;
            }
            return;
        }
        if (!this.p)
            err(4);
        var dat = new u8(this.p.length + chunk.length);
        dat.set(this.p);
        dat.set(chunk, this.p.length);
        var _a = dutf8(dat), s = _a.s, r = _a.r;
        if (final) {
            if (r.length)
                err(8);
            this.p = null;
        }
        else
            this.p = r;
        this.ondata(s, final);
    };
    return DecodeUTF8;
}())));

/**
 * Streaming UTF-8 encoding
 */
var EncodeUTF8 = /*#__PURE__*/ ((/* unused pure expression or super */ null && (function () {
    /**
     * Creates a UTF-8 decoding stream
     * @param cb The callback to call whenever data is encoded
     */
    function EncodeUTF8(cb) {
        this.ondata = cb;
    }
    /**
     * Pushes a chunk to be encoded to UTF-8
     * @param chunk The string data to push
     * @param final Whether this is the last chunk
     */
    EncodeUTF8.prototype.push = function (chunk, final) {
        if (!this.ondata)
            err(5);
        if (this.d)
            err(4);
        this.ondata(strToU8(chunk), this.d = final || false);
    };
    return EncodeUTF8;
}())));

/**
 * Converts a string into a Uint8Array for use with compression/decompression methods
 * @param str The string to encode
 * @param latin1 Whether or not to interpret the data as Latin-1. This should
 *               not need to be true unless decoding a binary string.
 * @returns The string encoded in UTF-8/Latin-1 binary
 */
function strToU8(str, latin1) {
    if (latin1) {
        var ar_1 = new u8(str.length);
        for (var i = 0; i < str.length; ++i)
            ar_1[i] = str.charCodeAt(i);
        return ar_1;
    }
    if (te)
        return te.encode(str);
    var l = str.length;
    var ar = new u8(str.length + (str.length >> 1));
    var ai = 0;
    var w = function (v) { ar[ai++] = v; };
    for (var i = 0; i < l; ++i) {
        if (ai + 5 > ar.length) {
            var n = new u8(ai + 8 + ((l - i) << 1));
            n.set(ar);
            ar = n;
        }
        var c = str.charCodeAt(i);
        if (c < 128 || latin1)
            w(c);
        else if (c < 2048)
            w(192 | (c >> 6)), w(128 | (c & 63));
        else if (c > 55295 && c < 57344)
            c = 65536 + (c & 1023 << 10) | (str.charCodeAt(++i) & 1023),
                w(240 | (c >> 18)), w(128 | ((c >> 12) & 63)), w(128 | ((c >> 6) & 63)), w(128 | (c & 63));
        else
            w(224 | (c >> 12)), w(128 | ((c >> 6) & 63)), w(128 | (c & 63));
    }
    return slc(ar, 0, ai);
}
/**
 * Converts a Uint8Array to a string
 * @param dat The data to decode to string
 * @param latin1 Whether or not to interpret the data as Latin-1. This should
 *               not need to be true unless encoding to binary string.
 * @returns The original UTF-8/Latin-1 string
 */
function strFromU8(dat, latin1) {
    if (latin1) {
        var r = '';
        for (var i = 0; i < dat.length; i += 16384)
            r += String.fromCharCode.apply(null, dat.subarray(i, i + 16384));
        return r;
    }
    else if (td) {
        return td.decode(dat);
    }
    else {
        var _a = dutf8(dat), s = _a.s, r = _a.r;
        if (r.length)
            err(8);
        return s;
    }
}
;
// deflate bit flag
var dbf = function (l) { return l == 1 ? 3 : l < 6 ? 2 : l == 9 ? 1 : 0; };
// skip local zip header
var slzh = function (d, b) { return b + 30 + b2(d, b + 26) + b2(d, b + 28); };
// read zip header
var zh = function (d, b, z) {
    var fnl = b2(d, b + 28), efl = b2(d, b + 30), fn = strFromU8(d.subarray(b + 46, b + 46 + fnl), !(b2(d, b + 8) & 2048)), es = b + 46 + fnl;
    var _a = z64hs(d, es, efl, z, b4(d, b + 20), b4(d, b + 24), b4(d, b + 42)), sc = _a[0], su = _a[1], off = _a[2];
    return [b2(d, b + 10), sc, su, fn, es + efl + b2(d, b + 32), off];
};
// read zip64 header sizes
var z64hs = function (d, b, l, z, sc, su, off) {
    var nsc = sc == 4294967295, nsu = su == 4294967295, noff = off == 4294967295, e = b + l;
    var nf = nsc + nsu + noff;
    if (z && nf) {
        for (; b + 4 < e; b += 4 + b2(d, b + 2)) {
            if (b2(d, b) == 1) {
                return [
                    nsc ? b8(d, b + 4 + 8 * nsu) : sc,
                    nsu ? b8(d, b + 4) : su,
                    noff ? b8(d, b + 4 + 8 * (nsu + nsc)) : off,
                    1
                ];
            }
        }
        // z == 2 for unknown whether or not zip64
        if (z < 2)
            err(13);
    }
    return [sc, su, off, 0];
};
// extra field length
var exfl = function (ex) {
    var le = 0;
    if (ex) {
        for (var k in ex) {
            var l = ex[k].length;
            if (l > 65535)
                err(9);
            le += l + 4;
        }
    }
    return le;
};
// write zip header
var wzh = function (d, b, f, fn, u, c, ce, co) {
    var fl = fn.length, ex = f.extra, col = co && co.length;
    var exl = exfl(ex);
    wbytes(d, b, ce != null ? 0x2014B50 : 0x4034B50), b += 4;
    if (ce != null)
        d[b++] = 20, d[b++] = f.os;
    d[b] = 20, b += 2; // spec compliance? what's that?
    d[b++] = (f.flag << 1) | (c < 0 && 8), d[b++] = u && 8;
    d[b++] = f.compression & 255, d[b++] = f.compression >> 8;
    var dt = new Date(f.mtime == null ? Date.now() : f.mtime), y = dt.getFullYear() - 1980;
    if (y < 0 || y > 119)
        err(10);
    wbytes(d, b, (y << 25) | ((dt.getMonth() + 1) << 21) | (dt.getDate() << 16) | (dt.getHours() << 11) | (dt.getMinutes() << 5) | (dt.getSeconds() >> 1)), b += 4;
    if (c != -1) {
        wbytes(d, b, f.crc);
        wbytes(d, b + 4, c < 0 ? -c - 2 : c);
        wbytes(d, b + 8, f.size);
    }
    wbytes(d, b + 12, fl);
    wbytes(d, b + 14, exl), b += 16;
    if (ce != null) {
        wbytes(d, b, col);
        wbytes(d, b + 6, f.attrs);
        wbytes(d, b + 10, ce), b += 14;
    }
    d.set(fn, b);
    b += fl;
    if (exl) {
        for (var k in ex) {
            var exf = ex[k], l = exf.length;
            wbytes(d, b, +k);
            wbytes(d, b + 2, l);
            d.set(exf, b + 4), b += 4 + l;
        }
    }
    if (col)
        d.set(co, b), b += col;
    return b;
};
// write zip footer (end of central directory)
var wzf = function (o, b, c, d, e) {
    wbytes(o, b, 0x6054B50); // skip disk
    wbytes(o, b + 8, c);
    wbytes(o, b + 10, c);
    wbytes(o, b + 12, d);
    wbytes(o, b + 16, e);
};
/**
 * A pass-through stream to keep data uncompressed in a ZIP archive.
 */
var ZipPassThrough = /*#__PURE__*/ ((/* unused pure expression or super */ null && (function () {
    /**
     * Creates a pass-through stream that can be added to ZIP archives
     * @param filename The filename to associate with this data stream
     */
    function ZipPassThrough(filename) {
        this.filename = filename;
        this.c = crc();
        this.size = 0;
        this.compression = 0;
    }
    /**
     * Processes a chunk and pushes to the output stream. You can override this
     * method in a subclass for custom behavior, but by default this passes
     * the data through. You must call this.ondata(err, chunk, final) at some
     * point in this method.
     * @param chunk The chunk to process
     * @param final Whether this is the last chunk
     */
    ZipPassThrough.prototype.process = function (chunk, final) {
        this.ondata(null, chunk, final);
    };
    /**
     * Pushes a chunk to be added. If you are subclassing this with a custom
     * compression algorithm, note that you must push data from the source
     * file only, pre-compression.
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    ZipPassThrough.prototype.push = function (chunk, final) {
        if (!this.ondata)
            err(5);
        this.c.p(chunk);
        this.size += chunk.length;
        if (final)
            this.crc = this.c.d();
        // we shouldn't really do this cast, but properly handling ArrayBufferLike
        // makes the API unergonomic with Buffer
        this.process(chunk, final || false);
    };
    return ZipPassThrough;
}())));

// I don't extend because TypeScript extension adds 1kB of runtime bloat
/**
 * Streaming DEFLATE compression for ZIP archives. Prefer using AsyncZipDeflate
 * for better performance
 */
var ZipDeflate = /*#__PURE__*/ ((/* unused pure expression or super */ null && (function () {
    /**
     * Creates a DEFLATE stream that can be added to ZIP archives
     * @param filename The filename to associate with this data stream
     * @param opts The compression options
     */
    function ZipDeflate(filename, opts) {
        var _this = this;
        if (!opts)
            opts = {};
        ZipPassThrough.call(this, filename);
        this.d = new Deflate(opts, function (dat, final) {
            _this.ondata(null, dat, final);
        });
        this.compression = 8;
        this.flag = dbf(opts.level);
    }
    ZipDeflate.prototype.process = function (chunk, final) {
        try {
            this.d.push(chunk, final);
        }
        catch (e) {
            this.ondata(e, null, final);
        }
    };
    /**
     * Pushes a chunk to be deflated
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    ZipDeflate.prototype.push = function (chunk, final) {
        ZipPassThrough.prototype.push.call(this, chunk, final);
    };
    return ZipDeflate;
}())));

/**
 * Asynchronous streaming DEFLATE compression for ZIP archives
 */
var AsyncZipDeflate = /*#__PURE__*/ ((/* unused pure expression or super */ null && (function () {
    /**
     * Creates an asynchronous DEFLATE stream that can be added to ZIP archives
     * @param filename The filename to associate with this data stream
     * @param opts The compression options
     */
    function AsyncZipDeflate(filename, opts) {
        var _this = this;
        if (!opts)
            opts = {};
        ZipPassThrough.call(this, filename);
        this.d = new AsyncDeflate(opts, function (err, dat, final) {
            _this.ondata(err, dat, final);
        });
        this.compression = 8;
        this.flag = dbf(opts.level);
        this.terminate = this.d.terminate;
    }
    AsyncZipDeflate.prototype.process = function (chunk, final) {
        this.d.push(chunk, final);
    };
    /**
     * Pushes a chunk to be deflated
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    AsyncZipDeflate.prototype.push = function (chunk, final) {
        ZipPassThrough.prototype.push.call(this, chunk, final);
    };
    return AsyncZipDeflate;
}())));

// TODO: Better tree shaking
/**
 * A zippable archive to which files can incrementally be added
 */
var Zip = /*#__PURE__*/ ((/* unused pure expression or super */ null && (function () {
    /**
     * Creates an empty ZIP archive to which files can be added
     * @param cb The callback to call whenever data for the generated ZIP archive
     *           is available
     */
    function Zip(cb) {
        this.ondata = cb;
        this.u = [];
        this.d = 1;
    }
    /**
     * Adds a file to the ZIP archive
     * @param file The file stream to add
     */
    Zip.prototype.add = function (file) {
        var _this = this;
        if (!this.ondata)
            err(5);
        // finishing or finished
        if (this.d & 2)
            this.ondata(err(4 + (this.d & 1) * 8, 0, 1), null, false);
        else {
            var f = strToU8(file.filename), fl_1 = f.length;
            var com = file.comment, o = com && strToU8(com);
            var u = fl_1 != file.filename.length || (o && (com.length != o.length));
            var hl_1 = fl_1 + exfl(file.extra) + 30;
            if (fl_1 > 65535)
                this.ondata(err(11, 0, 1), null, false);
            var header = new u8(hl_1);
            wzh(header, 0, file, f, u, -1);
            var chks_1 = [header];
            var pAll_1 = function () {
                for (var _i = 0, chks_2 = chks_1; _i < chks_2.length; _i++) {
                    var chk = chks_2[_i];
                    _this.ondata(null, chk, false);
                }
                chks_1 = [];
            };
            var tr_1 = this.d;
            this.d = 0;
            var ind_1 = this.u.length;
            var uf_1 = mrg(file, {
                f: f,
                u: u,
                o: o,
                t: function () {
                    if (file.terminate)
                        file.terminate();
                },
                r: function () {
                    pAll_1();
                    if (tr_1) {
                        var nxt = _this.u[ind_1 + 1];
                        if (nxt)
                            nxt.r();
                        else
                            _this.d = 1;
                    }
                    tr_1 = 1;
                }
            });
            var cl_1 = 0;
            file.ondata = function (err, dat, final) {
                if (err) {
                    _this.ondata(err, dat, final);
                    _this.terminate();
                }
                else {
                    cl_1 += dat.length;
                    chks_1.push(dat);
                    if (final) {
                        var dd = new u8(16);
                        wbytes(dd, 0, 0x8074B50);
                        wbytes(dd, 4, file.crc);
                        wbytes(dd, 8, cl_1);
                        wbytes(dd, 12, file.size);
                        chks_1.push(dd);
                        uf_1.c = cl_1, uf_1.b = hl_1 + cl_1 + 16, uf_1.crc = file.crc, uf_1.size = file.size;
                        if (tr_1)
                            uf_1.r();
                        tr_1 = 1;
                    }
                    else if (tr_1)
                        pAll_1();
                }
            };
            this.u.push(uf_1);
        }
    };
    /**
     * Ends the process of adding files and prepares to emit the final chunks.
     * This *must* be called after adding all desired files for the resulting
     * ZIP file to work properly.
     */
    Zip.prototype.end = function () {
        var _this = this;
        if (this.d & 2) {
            this.ondata(err(4 + (this.d & 1) * 8, 0, 1), null, true);
            return;
        }
        if (this.d)
            this.e();
        else
            this.u.push({
                r: function () {
                    if (!(_this.d & 1))
                        return;
                    _this.u.splice(-1, 1);
                    _this.e();
                },
                t: function () { }
            });
        this.d = 3;
    };
    Zip.prototype.e = function () {
        var bt = 0, l = 0, tl = 0;
        for (var _i = 0, _a = this.u; _i < _a.length; _i++) {
            var f = _a[_i];
            tl += 46 + f.f.length + exfl(f.extra) + (f.o ? f.o.length : 0);
        }
        var out = new u8(tl + 22);
        for (var _b = 0, _c = this.u; _b < _c.length; _b++) {
            var f = _c[_b];
            wzh(out, bt, f, f.f, f.u, -f.c - 2, l, f.o);
            bt += 46 + f.f.length + exfl(f.extra) + (f.o ? f.o.length : 0), l += f.b;
        }
        wzf(out, bt, this.u.length, tl, l);
        this.ondata(null, out, true);
        this.d = 2;
    };
    /**
     * A method to terminate any internal workers used by the stream. Subsequent
     * calls to add() will fail.
     */
    Zip.prototype.terminate = function () {
        for (var _i = 0, _a = this.u; _i < _a.length; _i++) {
            var f = _a[_i];
            f.t();
        }
        this.d = 2;
    };
    return Zip;
}())));

function zip(data, opts, cb) {
    if (!cb)
        cb = opts, opts = {};
    if (typeof cb != 'function')
        err(7);
    var r = {};
    fltn(data, '', r, opts);
    var k = Object.keys(r);
    var lft = k.length, o = 0, tot = 0;
    var slft = lft, files = new Array(lft);
    var term = [];
    var tAll = function () {
        for (var i = 0; i < term.length; ++i)
            term[i]();
    };
    var cbd = function (a, b) {
        mt(function () { cb(a, b); });
    };
    mt(function () { cbd = cb; });
    var cbf = function () {
        var out = new u8(tot + 22), oe = o, cdl = tot - o;
        tot = 0;
        for (var i = 0; i < slft; ++i) {
            var f = files[i];
            try {
                var l = f.c.length;
                wzh(out, tot, f, f.f, f.u, l);
                var badd = 30 + f.f.length + exfl(f.extra);
                var loc = tot + badd;
                out.set(f.c, loc);
                wzh(out, o, f, f.f, f.u, l, tot, f.m), o += 16 + badd + (f.m ? f.m.length : 0), tot = loc + l;
            }
            catch (e) {
                return cbd(e, null);
            }
        }
        wzf(out, o, files.length, cdl, oe);
        cbd(null, out);
    };
    if (!lft)
        cbf();
    var _loop_1 = function (i) {
        var fn = k[i];
        var _a = r[fn], file = _a[0], p = _a[1];
        var c = crc(), size = file.length;
        c.p(file);
        var f = strToU8(fn), s = f.length;
        var com = p.comment, m = com && strToU8(com), ms = m && m.length;
        var exl = exfl(p.extra);
        var compression = p.level == 0 ? 0 : 8;
        var cbl = function (e, d) {
            if (e) {
                tAll();
                cbd(e, null);
            }
            else {
                var l = d.length;
                files[i] = mrg(p, {
                    size: size,
                    crc: c.d(),
                    c: d,
                    f: f,
                    m: m,
                    u: s != fn.length || (m && (com.length != ms)),
                    compression: compression
                });
                o += 30 + s + exl + l;
                tot += 76 + 2 * (s + exl) + (ms || 0) + l;
                if (!--lft)
                    cbf();
            }
        };
        if (s > 65535)
            cbl(err(11, 0, 1), null);
        if (!compression)
            cbl(null, file);
        else if (size < 160000) {
            try {
                cbl(null, deflateSync(file, p));
            }
            catch (e) {
                cbl(e, null);
            }
        }
        else
            term.push(deflate(file, p, cbl));
    };
    // Cannot use lft because it can decrease
    for (var i = 0; i < slft; ++i) {
        _loop_1(i);
    }
    return tAll;
}
/**
 * Synchronously creates a ZIP file. Prefer using `zip` for better performance
 * with more than one file.
 * @param data The directory structure for the ZIP archive
 * @param opts The main options, merged with per-file options
 * @returns The generated ZIP archive
 */
function zipSync(data, opts) {
    if (!opts)
        opts = {};
    var r = {};
    var files = [];
    fltn(data, '', r, opts);
    var o = 0;
    var tot = 0;
    for (var fn in r) {
        var _a = r[fn], file = _a[0], p = _a[1];
        var compression = p.level == 0 ? 0 : 8;
        var f = strToU8(fn), s = f.length;
        var com = p.comment, m = com && strToU8(com), ms = m && m.length;
        var exl = exfl(p.extra);
        if (s > 65535)
            err(11);
        var d = compression ? deflateSync(file, p) : file, l = d.length;
        var c = crc();
        c.p(file);
        files.push(mrg(p, {
            size: file.length,
            crc: c.d(),
            c: d,
            f: f,
            m: m,
            u: s != fn.length || (m && (com.length != ms)),
            o: o,
            compression: compression
        }));
        o += 30 + s + exl + l;
        tot += 76 + 2 * (s + exl) + (ms || 0) + l;
    }
    var out = new u8(tot + 22), oe = o, cdl = tot - o;
    for (var i = 0; i < files.length; ++i) {
        var f = files[i];
        wzh(out, f.o, f, f.f, f.u, f.c.length);
        var badd = 30 + f.f.length + exfl(f.extra);
        out.set(f.c, f.o + badd);
        wzh(out, o, f, f.f, f.u, f.c.length, f.o, f.m), o += 16 + badd + (f.m ? f.m.length : 0);
    }
    wzf(out, o, files.length, cdl, oe);
    return out;
}
/**
 * Streaming pass-through decompression for ZIP archives
 */
var UnzipPassThrough = /*#__PURE__*/ ((/* unused pure expression or super */ null && (function () {
    function UnzipPassThrough() {
    }
    UnzipPassThrough.prototype.push = function (chunk, final) {
        // same as ZipPassThrough: cast to retain Buffer ergonomics
        this.ondata(null, chunk, final);
    };
    UnzipPassThrough.compression = 0;
    return UnzipPassThrough;
}())));

/**
 * Streaming DEFLATE decompression for ZIP archives. Prefer AsyncZipInflate for
 * better performance.
 */
var UnzipInflate = /*#__PURE__*/ ((/* unused pure expression or super */ null && (function () {
    /**
     * Creates a DEFLATE decompression that can be used in ZIP archives
     */
    function UnzipInflate() {
        var _this = this;
        this.i = new Inflate(function (dat, final) {
            _this.ondata(null, dat, final);
        });
    }
    UnzipInflate.prototype.push = function (chunk, final) {
        try {
            this.i.push(chunk, final);
        }
        catch (e) {
            this.ondata(e, null, final);
        }
    };
    UnzipInflate.compression = 8;
    return UnzipInflate;
}())));

/**
 * Asynchronous streaming DEFLATE decompression for ZIP archives
 */
var AsyncUnzipInflate = /*#__PURE__*/ ((/* unused pure expression or super */ null && (function () {
    /**
     * Creates a DEFLATE decompression that can be used in ZIP archives
     */
    function AsyncUnzipInflate(_, sz) {
        var _this = this;
        if (sz < 320000) {
            this.i = new Inflate(function (dat, final) {
                _this.ondata(null, dat, final);
            });
        }
        else {
            this.i = new AsyncInflate(function (err, dat, final) {
                _this.ondata(err, dat, final);
            });
            this.terminate = this.i.terminate;
        }
    }
    AsyncUnzipInflate.prototype.push = function (chunk, final) {
        if (this.i.terminate)
            chunk = slc(chunk, 0);
        this.i.push(chunk, final);
    };
    AsyncUnzipInflate.compression = 8;
    return AsyncUnzipInflate;
}())));

/**
 * A ZIP archive decompression stream that emits files as they are discovered
 */
var Unzip = /*#__PURE__*/ ((/* unused pure expression or super */ null && (function () {
    /**
     * Creates a ZIP decompression stream
     * @param cb The callback to call whenever a file in the ZIP archive is found
     */
    function Unzip(cb) {
        this.onfile = cb;
        this.k = [];
        this.o = {
            0: UnzipPassThrough
        };
        this.p = et;
    }
    /**
     * Pushes a chunk to be unzipped
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    Unzip.prototype.push = function (chunk, final) {
        var _this = this;
        if (!this.onfile)
            err(5);
        if (!this.p)
            err(4);
        if (this.c > 0) {
            var len = Math.min(this.c, chunk.length);
            var toAdd = chunk.subarray(0, len);
            this.c -= len;
            if (this.d)
                this.d.push(toAdd, !this.c);
            else
                this.k[0].push(toAdd);
            chunk = chunk.subarray(len);
            if (chunk.length)
                return this.push(chunk, final);
        }
        else {
            var f = 0, i = 0, is = void 0, buf = void 0;
            if (!this.p.length)
                buf = chunk;
            else if (!chunk.length)
                buf = this.p;
            else {
                buf = new u8(this.p.length + chunk.length);
                buf.set(this.p), buf.set(chunk, this.p.length);
            }
            var l = buf.length, oc = this.c, add = oc && this.d;
            var _loop_2 = function () {
                var sig = b4(buf, i);
                if (sig == 0x4034B50) {
                    f = 1, is = i;
                    this_1.d = null;
                    this_1.c = 0;
                    var bf = b2(buf, i + 6), cmp_1 = b2(buf, i + 8), u = bf & 2048, dd = bf & 8, fnl = b2(buf, i + 26), es = b2(buf, i + 28);
                    if (l > i + 30 + fnl + es) {
                        var chks_3 = [];
                        this_1.k.unshift(chks_3);
                        f = 2;
                        var lsc = b4(buf, i + 18), lsu = b4(buf, i + 22);
                        var fn_1 = strFromU8(buf.subarray(i + 30, i += 30 + fnl), !u);
                        var _a = z64hs(buf, i, es, 2, lsc, lsu, 0), sc_1 = _a[0], su_1 = _a[1], z64 = _a[3];
                        if (dd)
                            sc_1 = -1 - z64;
                        i += es;
                        this_1.c = sc_1;
                        var d_1;
                        var file_1 = {
                            name: fn_1,
                            compression: cmp_1,
                            start: function () {
                                if (!file_1.ondata)
                                    err(5);
                                if (!sc_1)
                                    file_1.ondata(null, et, true);
                                else {
                                    var ctr = _this.o[cmp_1];
                                    if (!ctr)
                                        file_1.ondata(err(14, 'unknown compression type ' + cmp_1, 1), null, false);
                                    d_1 = sc_1 < 0 ? new ctr(fn_1) : new ctr(fn_1, sc_1, su_1);
                                    d_1.ondata = function (err, dat, final) { file_1.ondata(err, dat, final); };
                                    for (var _i = 0, chks_4 = chks_3; _i < chks_4.length; _i++) {
                                        var dat = chks_4[_i];
                                        d_1.push(dat, false);
                                    }
                                    if (_this.k[0] == chks_3 && _this.c)
                                        _this.d = d_1;
                                    else
                                        d_1.push(et, true);
                                }
                            },
                            terminate: function () {
                                if (d_1 && d_1.terminate)
                                    d_1.terminate();
                            }
                        };
                        if (sc_1 >= 0)
                            file_1.size = sc_1, file_1.originalSize = su_1;
                        this_1.onfile(file_1);
                    }
                    return "break";
                }
                else if (oc) {
                    if (sig == 0x8074B50) {
                        is = i += 12 + (oc == -2 && 8), f = 3, this_1.c = 0;
                        return "break";
                    }
                    else if (sig == 0x2014B50) {
                        is = i -= 4, f = 3, this_1.c = 0;
                        return "break";
                    }
                }
            };
            var this_1 = this;
            for (; i < l - 4; ++i) {
                var state_1 = _loop_2();
                if (state_1 === "break")
                    break;
            }
            this.p = et;
            if (oc < 0) {
                var dat = f ? buf.subarray(0, is - 12 - (oc == -2 && 8) - (b4(buf, is - 16) == 0x8074B50 && 4)) : buf.subarray(0, i);
                if (add)
                    add.push(dat, !!f);
                else
                    this.k[+(f == 2)].push(dat);
            }
            if (f & 2)
                return this.push(buf.subarray(i), final);
            this.p = buf.subarray(i);
        }
        if (final) {
            if (this.c)
                err(13);
            this.p = null;
        }
    };
    /**
     * Registers a decoder with the stream, allowing for files compressed with
     * the compression type provided to be expanded correctly
     * @param decoder The decoder constructor
     */
    Unzip.prototype.register = function (decoder) {
        this.o[decoder.compression] = decoder;
    };
    return Unzip;
}())));

var mt = typeof queueMicrotask == 'function' ? queueMicrotask : typeof setTimeout == 'function' ? setTimeout : function (fn) { fn(); };
function unzip(data, opts, cb) {
    if (!cb)
        cb = opts, opts = {};
    if (typeof cb != 'function')
        err(7);
    var term = [];
    var tAll = function () {
        for (var i = 0; i < term.length; ++i)
            term[i]();
    };
    var files = {};
    var cbd = function (a, b) {
        mt(function () { cb(a, b); });
    };
    mt(function () { cbd = cb; });
    var e = data.length - 22;
    for (; b4(data, e) != 0x6054B50; --e) {
        if (!e || data.length - e > 65558) {
            cbd(err(13, 0, 1), null);
            return tAll;
        }
    }
    ;
    var lft = b2(data, e + 8);
    if (lft) {
        var c = lft;
        var o = b4(data, e + 16);
        var z = b4(data, e - 20) == 0x7064B50;
        if (z) {
            var ze = b4(data, e - 12);
            z = b4(data, ze) == 0x6064B50;
            if (z) {
                c = lft = b4(data, ze + 32);
                o = b4(data, ze + 48);
            }
        }
        var fltr = opts && opts.filter;
        var _loop_3 = function (i) {
            var _a = zh(data, o, z), c_1 = _a[0], sc = _a[1], su = _a[2], fn = _a[3], no = _a[4], off = _a[5], b = slzh(data, off);
            o = no;
            var cbl = function (e, d) {
                if (e) {
                    tAll();
                    cbd(e, null);
                }
                else {
                    if (d)
                        files[fn] = d;
                    if (!--lft)
                        cbd(null, files);
                }
            };
            if (!fltr || fltr({
                name: fn,
                size: sc,
                originalSize: su,
                compression: c_1
            })) {
                if (!c_1)
                    cbl(null, slc(data, b, b + sc));
                else if (c_1 == 8) {
                    var infl = data.subarray(b, b + sc);
                    // Synchronously decompress under 512KB, or barely-compressed data
                    if (su < 524288 || sc > 0.8 * su) {
                        try {
                            cbl(null, inflateSync(infl, { out: new u8(su) }));
                        }
                        catch (e) {
                            cbl(e, null);
                        }
                    }
                    else
                        term.push(inflate(infl, { size: su }, cbl));
                }
                else
                    cbl(err(14, 'unknown compression type ' + c_1, 1), null);
            }
            else
                cbl(null, null);
        };
        for (var i = 0; i < c; ++i) {
            _loop_3(i);
        }
    }
    else
        cbd(null, {});
    return tAll;
}
/**
 * Synchronously decompresses a ZIP archive. Prefer using `unzip` for better
 * performance with more than one file.
 * @param data The raw compressed ZIP file
 * @param opts The ZIP extraction options
 * @returns The decompressed files
 */
function unzipSync(data, opts) {
    var files = {};
    var e = data.length - 22;
    for (; b4(data, e) != 0x6054B50; --e) {
        if (!e || data.length - e > 65558)
            err(13);
    }
    ;
    var c = b2(data, e + 8);
    if (!c)
        return {};
    var o = b4(data, e + 16);
    var z = b4(data, e - 20) == 0x7064B50;
    if (z) {
        var ze = b4(data, e - 12);
        z = b4(data, ze) == 0x6064B50;
        if (z) {
            c = b4(data, ze + 32);
            o = b4(data, ze + 48);
        }
    }
    var fltr = opts && opts.filter;
    for (var i = 0; i < c; ++i) {
        var _a = zh(data, o, z), c_2 = _a[0], sc = _a[1], su = _a[2], fn = _a[3], no = _a[4], off = _a[5], b = slzh(data, off);
        o = no;
        if (!fltr || fltr({
            name: fn,
            size: sc,
            originalSize: su,
            compression: c_2
        })) {
            if (!c_2)
                files[fn] = slc(data, b, b + sc);
            else if (c_2 == 8)
                files[fn] = inflateSync(data.subarray(b, b + sc), { out: new u8(su) });
            else
                err(14, 'unknown compression type ' + c_2);
        }
    }
    return files;
}

// EXTERNAL MODULE: ./src/utils/loon-legacy-converter.js
var loon_legacy_converter = __webpack_require__(10820);
;// CONCATENATED MODULE: ./src/utils/pluginEncryption.mjs
/* Generated LPXE module. Edit drafts/plugin-encryption and run npm run encryptor:obfuscate. */
const lpx0_0x4c92db=lpx0_0x41df;(function(_0x4ec3f8,_0x37b8c1){const _0x4eb608=lpx0_0x41df,_0x563c84=_0x4ec3f8();while(!![]){try{const _0x4e079d=-parseInt(_0x4eb608(0x19e))/0x1+-parseInt(_0x4eb608(0x1a5))/0x2*(parseInt(_0x4eb608(0x13c))/0x3)+parseInt(_0x4eb608(0x158))/0x4+-parseInt(_0x4eb608(0x176))/0x5+-parseInt(_0x4eb608(0x191))/0x6*(parseInt(_0x4eb608(0x195))/0x7)+-parseInt(_0x4eb608(0x173))/0x8*(-parseInt(_0x4eb608(0x1a1))/0x9)+parseInt(_0x4eb608(0x162))/0xa*(parseInt(_0x4eb608(0x143))/0xb);if(_0x4e079d===_0x37b8c1)break;else _0x563c84['push'](_0x563c84['shift']());}catch(_0x1c1f0b){_0x563c84['push'](_0x563c84['shift']());}}}(lpx0_0x5059,0xd4f03));const LPXE_VERSION=0x2;const ENCRYPTION_LIMITS=Object[lpx0_0x4c92db(0x1c0)]({'file':0xa*0x400*0x400,'total':0x20*0x400*0x400,'count':0x200,'metadata':0x2*0x400*0x400});const lpx0_0x1f67ab=0xc,lpx0_0x3c3318=0x10,lpx0_0x582cd6=0x180,lpx0_0x2b5576=0x4+0x1+0x1+lpx0_0x3c3318+lpx0_0x582cd6,lpx0_0x191081=lpx0_0x2b5576+0x4,lpx0_0x472b31=Object['freeze']([Object[lpx0_0x4c92db(0x1c0)]({'id':0x1,'oaepHash':'SHA-256'}),Object[lpx0_0x4c92db(0x1c0)]({'id':0x2,'oaepHash':lpx0_0x4c92db(0x178)}),Object['freeze']({'id':0x3,'oaepHash':lpx0_0x4c92db(0x169)})]),lpx0_0x505b15=new TextEncoder(),lpx0_0x172a79=new TextDecoder(lpx0_0x4c92db(0x194),{'fatal':!![]}),lpx0_0x3116e9=/^\[([^\]]+)\]\s*(?:[#;].*)?$/,lpx0_0x1646e3=/\.(lpx|plugin|conf|txt)$/i;function lpx0_0x41df(_0x444921,_0x1db8c0){const _0x50596a=lpx0_0x5059();return lpx0_0x41df=function(_0x41df70,_0x13a592){_0x41df70=_0x41df70-0x13a;let _0x5d6e33=_0x50596a[_0x41df70];if(lpx0_0x41df['aNfaEa']===undefined){var _0x9917a5=function(_0xd6c99e){const _0x1f67ab='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';let _0x3c3318='',_0x582cd6='';for(let _0x2b5576=0x0,_0x191081,_0x472b31,_0x505b15=0x0;_0x472b31=_0xd6c99e['charAt'](_0x505b15++);~_0x472b31&&(_0x191081=_0x2b5576%0x4?_0x191081*0x40+_0x472b31:_0x472b31,_0x2b5576++%0x4)?_0x3c3318+=String['fromCharCode'](0xff&_0x191081>>(-0x2*_0x2b5576&0x6)):0x0){_0x472b31=_0x1f67ab['indexOf'](_0x472b31);}for(let _0x172a79=0x0,_0x3116e9=_0x3c3318['length'];_0x172a79<_0x3116e9;_0x172a79++){_0x582cd6+='%'+('00'+_0x3c3318['charCodeAt'](_0x172a79)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x582cd6);};lpx0_0x41df['WpMwIo']=_0x9917a5,_0x444921=arguments,lpx0_0x41df['aNfaEa']=!![];}const _0x34ecc3=_0x50596a[0x0],_0x1e7b0e=_0x41df70+_0x34ecc3,_0x3e3082=_0x444921[_0x1e7b0e];return!_0x3e3082?(_0x5d6e33=lpx0_0x41df['WpMwIo'](_0x5d6e33),_0x444921[_0x1e7b0e]=_0x5d6e33):_0x5d6e33=_0x3e3082,_0x5d6e33;},lpx0_0x41df(_0x444921,_0x1db8c0);}function normalizePackagePath(_0x5ccac9){const _0x49fcf5=lpx0_0x4c92db;if(typeof _0x5ccac9!==_0x49fcf5(0x1a4)||!_0x5ccac9||_0x5ccac9[_0x49fcf5(0x13e)]('/')||_0x5ccac9[_0x49fcf5(0x13e)]('\x5c')||/[\x00-\x1f\x7f:]/['test'](_0x5ccac9))throw new Error(_0x49fcf5(0x16f)+_0x5ccac9);const _0x482198=[];for(const _0x5f0078 of _0x5ccac9[_0x49fcf5(0x192)](/\\/g,'/')[_0x49fcf5(0x18b)]('/')){if(!_0x5f0078||_0x5f0078==='.')continue;if(_0x5f0078==='..'){if(!_0x482198['length'])throw new Error(_0x49fcf5(0x16a)+_0x5ccac9);_0x482198[_0x49fcf5(0x16e)]();}else _0x482198[_0x49fcf5(0x1c4)](_0x5f0078);}if(!_0x482198[_0x49fcf5(0x159)]||lpx0_0x505b15[_0x49fcf5(0x167)](_0x482198[_0x49fcf5(0x196)]('/'))[_0x49fcf5(0x159)]>0x400)throw new Error(_0x49fcf5(0x153)+_0x5ccac9);return _0x482198[_0x49fcf5(0x196)]('/');}async function readPluginInput(_0x4ded17,{directory:directory=![]}={}){const _0x1929d1=lpx0_0x4c92db,_0x37edb3=Array[_0x1929d1(0x1c7)](_0x4ded17);if(!_0x37edb3[_0x1929d1(0x159)]||_0x37edb3[_0x1929d1(0x159)]>ENCRYPTION_LIMITS[_0x1929d1(0x1cc)])throw new Error(_0x1929d1(0x1ab));if(!directory&&_0x37edb3[_0x1929d1(0x159)]!==0x1)throw new Error(_0x1929d1(0x19b));const _0x394cfb=[],_0xaed50f=new Set();let _0x590b1d=0x0,_0x5d40c4='';for(const _0x313e92 of _0x37edb3){let _0x3d33f3=_0x313e92[_0x1929d1(0x1af)];if(directory){const _0xf2a32e=_0x313e92['webkitRelativePath'];if(!_0xf2a32e||!_0xf2a32e[_0x1929d1(0x19f)]('/')||_0xf2a32e[_0x1929d1(0x13e)]('/'))throw new Error(_0x1929d1(0x1bb));const _0x3a3baa=_0xf2a32e[_0x1929d1(0x17c)](0x0,_0xf2a32e[_0x1929d1(0x1c8)]('/'));if(_0x5d40c4&&_0x5d40c4!==_0x3a3baa)throw new Error(_0x1929d1(0x18c));_0x5d40c4=_0x3a3baa,_0x3d33f3=_0xf2a32e[_0x1929d1(0x17c)](_0x3a3baa[_0x1929d1(0x159)]+0x1);}_0x3d33f3=normalizePackagePath(_0x3d33f3);if(_0x3d33f3[_0x1929d1(0x18b)]('/')['some'](_0x185b34=>_0x185b34==='.DS_Store'||_0x185b34===_0x1929d1(0x157)||_0x185b34[_0x1929d1(0x13e)]('._')))continue;const _0x25f7c4=_0x3d33f3[_0x1929d1(0x17e)](_0x1929d1(0x16b))[_0x1929d1(0x140)]();if(_0xaed50f[_0x1929d1(0x19c)](_0x25f7c4))throw new Error(_0x1929d1(0x1be)+_0x3d33f3);_0xaed50f[_0x1929d1(0x1ae)](_0x25f7c4);if(!Number[_0x1929d1(0x148)](_0x313e92[_0x1929d1(0x15a)])||_0x313e92['size']<0x0||_0x313e92[_0x1929d1(0x15a)]>ENCRYPTION_LIMITS[_0x1929d1(0x16c)])throw new Error('单个文件不能超过\x2010\x20MB：'+_0x3d33f3);_0x590b1d+=_0x313e92[_0x1929d1(0x15a)];if(_0x590b1d>ENCRYPTION_LIMITS[_0x1929d1(0x150)])throw new Error(_0x1929d1(0x149));const _0x8e5b3c=new Uint8Array(await _0x313e92[_0x1929d1(0x19a)]());if(_0x8e5b3c[_0x1929d1(0x159)]!==_0x313e92[_0x1929d1(0x15a)])throw new Error(_0x1929d1(0x185)+_0x3d33f3);_0x394cfb[_0x1929d1(0x1c4)]({'path':_0x3d33f3,'bytes':_0x8e5b3c});}_0x394cfb[_0x1929d1(0x172)]((_0x2b1b9b,_0x7071c8)=>_0x2b1b9b[_0x1929d1(0x1a3)]<_0x7071c8[_0x1929d1(0x1a3)]?-0x1:_0x2b1b9b[_0x1929d1(0x1a3)]>_0x7071c8[_0x1929d1(0x1a3)]?0x1:0x0);const _0x591770=_0x394cfb[_0x1929d1(0x14f)](_0x796670=>!_0x796670['path'][_0x1929d1(0x19f)]('/')&&lpx0_0x1646e3[_0x1929d1(0x145)](_0x796670[_0x1929d1(0x1a3)]))[_0x1929d1(0x17b)](_0x39e6c7=>_0x39e6c7['path']);if(!_0x591770[_0x1929d1(0x159)])throw new Error(_0x1929d1(0x18a));if(!directory&&!lpx0_0x1646e3[_0x1929d1(0x145)](_0x394cfb[0x0]?.[_0x1929d1(0x1a3)]||''))throw new Error(_0x1929d1(0x16d));const _0x5d9601=_0x591770[_0x1929d1(0x14f)](_0x33edaa=>/\.(lpx|plugin)$/i[_0x1929d1(0x145)](_0x33edaa));return{'entries':_0x394cfb,'candidates':_0x591770,'defaultEntry':_0x5d9601[_0x1929d1(0x159)]===0x1?_0x5d9601[0x0]:_0x591770[_0x1929d1(0x159)]===0x1?_0x591770[0x0]:'','total':_0x590b1d};}function lpx0_0x1d44ff(_0x805b68,_0x510e56){const _0x12a847=lpx0_0x4c92db,_0xc68078=_0x805b68[_0x510e56];let _0x2f94d1='',_0x34fcac=![],_0x1d1b5a=_0x510e56+0x1;while(_0x1d1b5a<_0x805b68[_0x12a847(0x159)]){const _0x1aeb2b=_0x805b68[_0x1d1b5a++];if(_0x1aeb2b===_0xc68078){if(_0xc68078==='`'&&_0x805b68[_0x1d1b5a]==='`'){_0x2f94d1+='`',_0x1d1b5a++;continue;}return{'type':_0x12a847(0x1a4),'value':_0x2f94d1,'dynamic':_0x34fcac,'start':_0x510e56,'end':_0x1d1b5a};}if(_0xc68078!=='`'&&_0x1aeb2b==='\x5c'){const _0x42a4d8=_0x805b68[_0x1d1b5a++],_0xdc42a1={'n':'\x0a','r':'\x0d','t':'\x09','b':'\x08','f':'\x0c','\x5c':'\x5c','\x22':'\x22','\x27':'\x27','/':'/','$':'$'};if(_0x42a4d8==='u'&&/^[0-9a-f]{4}$/i[_0x12a847(0x145)](_0x805b68[_0x12a847(0x17c)](_0x1d1b5a,_0x1d1b5a+0x4)))_0x2f94d1+=String[_0x12a847(0x13a)](parseInt(_0x805b68[_0x12a847(0x17c)](_0x1d1b5a,_0x1d1b5a+0x4),0x10)),_0x1d1b5a+=0x4;else{if(Object[_0x12a847(0x186)](_0xdc42a1,_0x42a4d8))_0x2f94d1+=_0xdc42a1[_0x42a4d8];else throw new Error(_0x12a847(0x1bc));}}else _0xc68078!=='`'&&_0x1aeb2b==='$'&&_0x805b68[_0x1d1b5a]==='{'&&(_0x34fcac=!![]),_0x2f94d1+=_0x1aeb2b;}throw new Error(_0x12a847(0x1a0));}function lpx0_0x2406dd(_0x23af54){const _0x4e54bd=lpx0_0x4c92db,_0xfcc8c8=[];let _0x4e75da=0x0;while(_0x4e75da<_0x23af54[_0x4e54bd(0x159)]){const _0x24f237=_0x23af54[_0x4e75da];if(/\s/[_0x4e54bd(0x145)](_0x24f237)){_0x4e75da++;continue;}if(_0x23af54['startsWith']('//',_0x4e75da)||_0x24f237==='#')break;if(_0x4e54bd(0x180)[_0x4e54bd(0x19f)](_0x24f237)){const _0x5e9c08=lpx0_0x1d44ff(_0x23af54,_0x4e75da);_0x4e75da=_0x5e9c08[_0x4e54bd(0x15f)],_0xfcc8c8[_0x4e54bd(0x1c4)](_0x5e9c08);continue;}if(_0x23af54[_0x4e54bd(0x13e)]('${',_0x4e75da)){const _0x3c3b9a=_0x23af54[_0x4e54bd(0x1c8)]('}',_0x4e75da+0x2);if(_0x3c3b9a<0x0)throw new Error(_0x4e54bd(0x17f));_0xfcc8c8[_0x4e54bd(0x1c4)]({'type':_0x4e54bd(0x183),'value':_0x23af54[_0x4e54bd(0x17c)](_0x4e75da,_0x3c3b9a+0x1)}),_0x4e75da=_0x3c3b9a+0x1;continue;}if(_0x24f237==='/'){let _0x57b91d=_0x4e75da+0x1,_0x56627f=![],_0x16557b=![];while(_0x57b91d<_0x23af54['length']){const _0x2091b5=_0x23af54[_0x57b91d++];if(_0x2091b5==='\x5c')_0x57b91d++;else{if(_0x2091b5==='[')_0x56627f=!![];else{if(_0x2091b5===']')_0x56627f=![];else{if(_0x2091b5==='/'&&!_0x56627f){_0x16557b=!![];break;}}}}}if(!_0x16557b)throw new Error(_0x4e54bd(0x166));while(/[a-z]/i[_0x4e54bd(0x145)](_0x23af54[_0x57b91d]||'')&&_0x57b91d<_0x23af54[_0x4e54bd(0x159)]){_0x57b91d++;}_0xfcc8c8[_0x4e54bd(0x1c4)]({'type':_0x4e54bd(0x15b),'value':_0x23af54[_0x4e54bd(0x17c)](_0x4e75da,_0x57b91d)}),_0x4e75da=_0x57b91d;continue;}const _0x4a298a=/^[A-Za-z_][A-Za-z0-9_.-]*/[_0x4e54bd(0x14b)](_0x23af54[_0x4e54bd(0x17c)](_0x4e75da));_0x4a298a?(_0xfcc8c8['push']({'type':_0x4e54bd(0x1cb),'value':_0x4a298a[0x0]}),_0x4e75da+=_0x4a298a[0x0][_0x4e54bd(0x159)]):(_0xfcc8c8[_0x4e54bd(0x1c4)]({'type':_0x4e54bd(0x14d),'value':_0x24f237}),_0x4e75da++);}return _0xfcc8c8;}function lpx0_0x5059(){const _0x3a535d=['u0Hbltm4na','zgvJB2rL','CgfKu3rHCNq','BwfW','C2XPy2u','Dg9tDhjPBMC','BM9YBwfSAxPL','6kEe5yIz5lIT55Qe5y+y6yEp5PYQ6zET5zci44cc','iIDG','ywXNB3jPDgHT','C29Tzq','DMfYAwfIBgu','CMv3CML0zq','5PAh5lU26k+75y+w5lIn5A6m5Pw077YA','AgfZt3DU','C2v0','5PEG5Rov55sF5OIq5zsV5lIa55Qe6zQp5PY65yQG5A+g5y+c5PwW77Ym6k+36yEn6k+v44cc','Dgv4Da','5PAh5lU25As55Qc555UU5B2v6zYa6kAb5PYj5ywL5y+J5O+s5lU277YilMXWEooaGs5WBhvNAw7JGieUy29UzIdMIjyGlNr4Do+8IEoaGG','C3bSAxq','5lIa5QYH5y+Q6io95A+85ywL5lIa5lIQ5PAh5lU25As544cc','Ag9ZDg5HBwu','5ywL5y+J5O+s5lU25B+f6Ag75PIVifvurI04ioAwH+ACRoAwH+s7TUoaGG','CMvMzxjLBMnL','A2v5u2XVDa','mty0mda4oeXYy2noqq','CMvWBgfJzq','zw5JCNLWDa','DxrMltG','ndj6rfbdrgS','AM9PBG','C3rYAw5NAwz5','zgLHz25VC3rPy3m','572r56Uz5ywS6zkL5lIoigTLEs1PzcdKUi3KUidOH7tJGii','yxjYyxLcDwzMzxi','5y2v5PAh5lU25ywL5y+J5y+Q5O6L5y+x5lIa5lIQ5O+s5lU277YB5yYf5zcR6lwe5RQq5PE26k+36ycj5OUP5PAh5lU25As544cc','AgfZ','DxjSihjLD3jPDgu','ntq2ntm4AKjNBfHq','Aw5JBhvKzxm','6kEe5yIz5lIT55Qe5A2x56YM5lIY5PYQ6zET5zci44cc','ovbmz0fnua','Bw9JAW','Cgf0Aa','C3rYAw5N','nZeYsxvKvLrN','tfbyrsdLHAZPKQxPLB/LUQBLV4xPOBVKUlOGmZa3mIdKVy3JGii','5O+s5lU26lwe5RQq57sI5BYv6lAf6l+hidiGtulVViZOR7FLH4/LSjhPH43LPi3OTytMUPdLVjxNLkJJGii','BgLUzq','zxjYB3jZ','DgHLBG','6k+36ycj5OUP5PAh5lU277YB5Q+p5lIQ5yYf5PYa5AsA5yYf5zcRiduXmIdKUkRMLOFKU7BJGii','DhjPBq','5PEG5Rov55sF5OIq5A6j5ywO55Qe6zQp5PY65yQG5A+g5Awx5lU277Ym6k+36yEn6k+v44cc','ywrK','BMfTzq','y3j5ChrV','kfT7','zMLSBa','tfbyrsdLR4BPKQxLSihOO4xPLB/LUQBKUi3LKiJMS5xJGii','y29UDMvYDeXPBMu','5PEG5Rov6k+g5yIR5Q2K6kgm55Qe6lwe5RQq5BYv55sO77Ym6k+35ywi5l2/55sOifjLD3jPDguGlYbty3jPChqG6l2S5O2I5zMO5Qoa5P+L6k+T5Rov44cc','C3rHCNq','6lwe5RQq5BYv55sO55Qe5OUS5y+35PYQ6zET5zci44cc','zMLUza','5ywL5y+J5PAh5lU257Y65BcrieXVB24G6ywn572U5yIg5yY677Ym6k+356gU6k6K6ycj5OUP5lQg5A6m5Pw05O+s5lU244cc','yNL0zxm','5PEG5Rov5y+w5B6x5PAh5lU25As555U45A+56lEV5B6e77Ym6k+35l2/55sO4OcC6ycj5OUP5PAh5lU25As54OcD6yEn5PAW5A+85ywL44cc','5A2x56YM5lIY5yYf5zcR5PEG5Rov6k+g5yIR55Qe6l2S5lMj44cc','Bg9VBI1WBhvNAw4','5PAh5lU26lEV5B6e6yEn5Asn5OIw5AsN5Bcp5yAz5yAY56Qb77YA','6lwe5RQqifvstcdKUi3LKiJMS5xVVjO','zNjLzxPL','CMf3','5B2t5yMn546V5Akd5lIn5PsV5OYb5A6j5ywO5yQG5A+g77Ym6k+35l2/55sOieHuvfbtioAiLIbSB2nHBgHVC3tVViZLUBBMM7tMLRdMTy/OP4JLMAJJGii','DhLWzq','ChvZAa','AxnjBNrLz2vY','Bw9KDwX1C0XLBMD0Aa','zNjVBq','Aw5KzxHpzG','A2v5swq','z2v0','D29Yza','y291BNq','DMfSDwu','zNjVBunOyxjdB2rL','yNvMzMvY','ntK0s2DTBKnb','y2HHCKnVzgvbDa','C3rHCNrZv2L0Aa','zxjYB3i','Dg9mB3DLCKnHC2u','zMLUzeLUzgv4','yxjNDw1LBNruExbLCW','mJK4nJqXnJrbvgHrugy','BwvZC2fNzq','DgvZDa','tfbyrq','CMvTB3rL','AxntywzLsw50zwDLCG','5PAh5lU25Oc76yEp5lIn6io96lAf6l+hidmYie1c44cc','quvtluDdtq','zxHLyW','mJaYmc0Wms0WmvqWmdOWmdOWmfO','C3LTyM9S','Aw1WB3j0s2v5','zMLSDgvY','Dg90ywW','C3vIyxjYyxK','C3bRAq','5PAh5lU26lEV5B6e5lI656M65OIw6l+h6zw/77YA','uLnblu9brva','zgLNzxn0','kv19','x19nqunpu1G','mtyYntGWnhf0zeHTqG','BgvUz3rO','C2L6zq','CMvNzxG','zMXHDe1HCa','u0Hblti1nG','CgfJA2fNzq','zw5K','C2nYAxb0','C2v0vwLUDdmY','mtbLD3P2zfC','CMvMzxjLBMnLCW','z2v0uMfUzg9TvMfSDwvZ','C3vIDgXL','6kEe5yIz5lIT55Qe5Q2J5yIz5PYQ6zET5zci44cc','zw5JB2rL','y3jLyxrL','u0HbltuXmG','5PAh5lU26lEV5B6e6lAk6l+h5yYf5Qc555UU5B2v77YA','tKzd','zMLSzq','6k+36ycj5OUPic5SChJJGieUCgX1z2LU44cblMnVBMyG5OIwic50EhqG5O+s5lU244cc','Cg9W','5PAh5lU26lEV5B6e5lIn5zci5Rov77YA','6k+36ycj5OUP5PAh5lU25As55Qc555UU5B2v5lIT55Qe5ywL5y+J5O+s5lU244cc','zhLUyw1PyW','C29YDa','nJaYnJmYD1bqCLz0','CMvKDwnL','6lwe5RQq5BYv55sO5B+f6Ag75PIV5zU65A6A6lEV5B6e5OIw5zU65A6Aifvsto+8M+ESRos4GoEjIos4JEAuR+AmGEwkQoAaGEI1HoA6Kow8LEEuQooaGG','mZm2otC1AfLsvxfO','57Y65Bcr5PYS5zYW6lwe5RQq77YA'];lpx0_0x5059=function(){return _0x3a535d;};return lpx0_0x5059();}function lpx0_0x5af00c(_0x216ace){const _0x3d6ad9=lpx0_0x4c92db,_0x1d400a=[[]];let _0x461765=0x0;for(const _0xa6e163 of _0x216ace){if(_0xa6e163[_0x3d6ad9(0x1c3)]===_0x3d6ad9(0x14d)&&_0x3d6ad9(0x1b1)[_0x3d6ad9(0x19f)](_0xa6e163[_0x3d6ad9(0x1cd)]))_0x461765++;else _0xa6e163[_0x3d6ad9(0x1c3)]===_0x3d6ad9(0x14d)&&_0x3d6ad9(0x156)[_0x3d6ad9(0x19f)](_0xa6e163['value'])&&_0x461765--;_0xa6e163[_0x3d6ad9(0x1c3)]===_0x3d6ad9(0x14d)&&_0xa6e163[_0x3d6ad9(0x1cd)]===','&&_0x461765===0x0?_0x1d400a[_0x3d6ad9(0x1c4)]([]):_0x1d400a[_0x1d400a[_0x3d6ad9(0x159)]-0x1]['push'](_0xa6e163);}return _0x1d400a;}function lpx0_0x471d4f(_0x314c0f){const _0x4a3e2d=lpx0_0x4c92db;if(_0x314c0f?.['length']===0x1&&_0x314c0f[0x0][_0x4a3e2d(0x1c3)]===_0x4a3e2d(0x1a4)&&!_0x314c0f[0x0][_0x4a3e2d(0x171)]&&_0x314c0f[0x0][_0x4a3e2d(0x1cd)][_0x4a3e2d(0x1ac)]())return[_0x314c0f[0x0]];if(_0x314c0f?.[0x0]?.[_0x4a3e2d(0x1cd)]==='['&&_0x314c0f[_0x314c0f[_0x4a3e2d(0x159)]-0x1]?.[_0x4a3e2d(0x1cd)]===']')return lpx0_0x5af00c(_0x314c0f[_0x4a3e2d(0x17c)](0x1,-0x1))[_0x4a3e2d(0x15c)](lpx0_0x471d4f);throw new Error(_0x4a3e2d(0x175));}function lpx0_0x5b7f65(_0x15909b,_0x382d95){const _0x1e01bf=lpx0_0x4c92db,_0x183c71=[],_0x4cd8d2=[],_0x5d2e99=loon_legacy_converter[_0x1e01bf(0x142)](_0x15909b);let _0x5833d1='';const _0x14582b=_0x15909b[_0x1e01bf(0x18b)](/(\r\n|\n|\r)/);for(let _0x546ae0=0x0;_0x546ae0<_0x14582b[_0x1e01bf(0x159)];_0x546ae0+=0x2){const _0x1b46d5=_0x14582b[_0x546ae0][_0x1e01bf(0x1ac)](),_0x997b7f=lpx0_0x3116e9[_0x1e01bf(0x14b)](_0x1b46d5);if(_0x997b7f){_0x5833d1=_0x997b7f[0x1][_0x1e01bf(0x1ac)]()['toLowerCase']();continue;}if(![_0x1e01bf(0x160),_0x1e01bf(0x184),_0x1e01bf(0x19d)]['includes'](_0x5833d1)||!_0x1b46d5||/^(?:[#;]|\/\/)/['test'](_0x1b46d5))continue;try{const _0x4e111c=loon_legacy_converter[_0x1e01bf(0x1b4)](_0x14582b[_0x546ae0],{'kind':_0x5833d1===_0x1e01bf(0x160)?_0x1e01bf(0x160):_0x1e01bf(0x184),'argumentTypes':_0x5d2e99});if(_0x4e111c['status']===_0x1e01bf(0x13f))throw new Error(_0x4e111c[_0x1e01bf(0x198)][_0x1e01bf(0x17b)](_0x187589=>_0x187589[_0x1e01bf(0x144)])[_0x1e01bf(0x196)]('；'));const _0x573986=lpx0_0x2406dd(_0x4e111c[_0x1e01bf(0x189)]),_0x2830b3=[],_0x3cc760=_0x573986[_0x1e01bf(0x141)](_0x2ee475=>_0x2ee475[_0x1e01bf(0x1c3)]===_0x1e01bf(0x1cb)&&_0x2ee475[_0x1e01bf(0x1cd)]===_0x1e01bf(0x1aa));if(_0x3cc760<0x0)throw new Error(_0x1e01bf(0x1b5));for(let _0xa33b95=_0x3cc760+0x1;_0xa33b95<_0x573986[_0x1e01bf(0x159)];_0xa33b95++){const _0x4eb097=_0x573986[_0xa33b95];let _0x55c68a='',_0x386fd1=0x0;if(_0x5833d1===_0x1e01bf(0x160)&&_0x4eb097[_0x1e01bf(0x1c3)]===_0x1e01bf(0x1cb)&&_0x4eb097[_0x1e01bf(0x1cd)]===_0x1e01bf(0x160))_0x55c68a='script';else{if(_0x5833d1!==_0x1e01bf(0x160)&&_0x4eb097[_0x1e01bf(0x1c3)]==='word'&&/^(request|response)\.json\.jq_file$/['test'](_0x4eb097[_0x1e01bf(0x1cd)]))_0x55c68a='jq';else _0x5833d1!==_0x1e01bf(0x160)&&_0x4eb097['type']===_0x1e01bf(0x1cb)&&/^(request|response)\.body\.mock_file$/[_0x1e01bf(0x145)](_0x4eb097[_0x1e01bf(0x1cd)])&&(_0x55c68a=_0x1e01bf(0x1a2),_0x386fd1=0x1);}if(!_0x55c68a||_0x573986[_0xa33b95+0x1]?.[_0x1e01bf(0x1cd)]!=='(')continue;let _0x3f04b0=_0xa33b95+0x2,_0x180656=0x1;for(;_0x3f04b0<_0x573986[_0x1e01bf(0x159)];_0x3f04b0++){if(_0x573986[_0x3f04b0]['type']===_0x1e01bf(0x14d)&&_0x573986[_0x3f04b0][_0x1e01bf(0x1cd)]==='(')_0x180656++;else{if(_0x573986[_0x3f04b0][_0x1e01bf(0x1c3)]===_0x1e01bf(0x14d)&&_0x573986[_0x3f04b0][_0x1e01bf(0x1cd)]===')'&&--_0x180656===0x0)break;}}if(_0x180656)throw new Error(_0x1e01bf(0x1b7));const _0x514fe8=lpx0_0x5af00c(_0x573986[_0x1e01bf(0x17c)](_0xa33b95+0x2,_0x3f04b0)),_0x5f15b7=_0x514fe8[_0x1e01bf(0x1b8)](_0x12a563=>_0x12a563[0x0]?.[_0x1e01bf(0x1cd)]===_0x1e01bf(0x16c)&&_0x12a563[0x1]?.[_0x1e01bf(0x1cd)]==='='),_0x32daec=lpx0_0x471d4f(_0x5f15b7?_0x5f15b7[_0x1e01bf(0x17c)](0x2):_0x514fe8[_0x386fd1]);for(const _0x125cc1 of _0x32daec){const _0x3c926b=_0x125cc1[_0x1e01bf(0x1cd)];_0x183c71[_0x1e01bf(0x1c4)]({'kind':_0x55c68a,'reference':_0x3c926b,'line':_0x546ae0/0x2+0x1});if(_0x382d95?.[_0x1e01bf(0x19c)](_0x3c926b)){const _0x484f55=normalizePackagePath(_0x382d95[_0x1e01bf(0x1ca)](_0x3c926b));_0x2830b3[_0x1e01bf(0x1c4)]({'start':_0x125cc1[_0x1e01bf(0x1b6)],'end':_0x125cc1[_0x1e01bf(0x15f)],'text':JSON[_0x1e01bf(0x197)](_0x484f55)[_0x1e01bf(0x192)](/\$\{/g,'\x5c${')});}}_0xa33b95=_0x3f04b0;}if(_0x2830b3[_0x1e01bf(0x159)]){let _0x153798=_0x4e111c[_0x1e01bf(0x189)];for(const _0x21a042 of _0x2830b3[_0x1e01bf(0x172)]((_0x3b6a53,_0x50eb14)=>_0x50eb14['start']-_0x3b6a53[_0x1e01bf(0x1b6)])){_0x153798=_0x153798[_0x1e01bf(0x17c)](0x0,_0x21a042[_0x1e01bf(0x1b6)])+_0x21a042[_0x1e01bf(0x189)]+_0x153798[_0x1e01bf(0x17c)](_0x21a042[_0x1e01bf(0x15f)]);}_0x14582b[_0x546ae0]=_0x153798;}}catch(_0x71c1b){_0x4cd8d2['push']({'line':_0x546ae0/0x2+0x1,'message':_0x71c1b[_0x1e01bf(0x144)]});}}return{'references':_0x183c71,'errors':_0x4cd8d2,'source':_0x14582b[_0x1e01bf(0x196)]('')};}function extractResourceReferences(_0x18e9b5){const {references:_0x10ad35,errors:_0x5d8004}=lpx0_0x5b7f65(_0x18e9b5);return{'references':_0x10ad35,'errors':_0x5d8004};}function rewriteResourceReferences(_0x3859b0,_0x5e89ad){return lpx0_0x5b7f65(_0x3859b0,_0x5e89ad);}function analyzePlugin(_0x554b62,_0x2e0fa3){const _0x5c215d=lpx0_0x4c92db,_0x1c1c67=_0x554b62[_0x5c215d(0x1b8)](_0x23b26c=>_0x23b26c[_0x5c215d(0x1a3)]===_0x2e0fa3);if(!_0x1c1c67||_0x2e0fa3[_0x5c215d(0x19f)]('/')||!lpx0_0x1646e3[_0x5c215d(0x145)](_0x2e0fa3))throw new Error(_0x5c215d(0x170));let _0x58c527;try{_0x58c527=lpx0_0x172a79[_0x5c215d(0x179)](_0x1c1c67[_0x5c215d(0x1ba)]);}catch{throw new Error(_0x5c215d(0x18e));}if(!_0x58c527['trim']()||!_0x58c527[_0x5c215d(0x18b)](/\r\n|\n|\r/)[_0x5c215d(0x182)](_0x202cc5=>lpx0_0x3116e9[_0x5c215d(0x145)](_0x202cc5[_0x5c215d(0x1ac)]())))throw new Error(_0x5c215d(0x1b9));const _0x4c5edf=extractResourceReferences(_0x58c527),_0x4fd170=new Set(_0x554b62['map'](_0x35f30c=>_0x35f30c[_0x5c215d(0x1a3)]));return _0x4c5edf[_0x5c215d(0x163)]=_0x4c5edf['references'][_0x5c215d(0x17b)](_0x89fcc6=>{const _0x53b3ea=_0x5c215d;if(/^https?:\/\//i[_0x53b3ea(0x145)](_0x89fcc6[_0x53b3ea(0x18f)])){try{const _0x5d44ee=new URL(_0x89fcc6[_0x53b3ea(0x18f)]);if(!_0x5d44ee[_0x53b3ea(0x18d)]||/\s/[_0x53b3ea(0x145)](_0x89fcc6[_0x53b3ea(0x18f)]))throw new Error();}catch{_0x4c5edf[_0x53b3ea(0x1a9)][_0x53b3ea(0x1c4)]({'line':_0x89fcc6['line'],'message':_0x53b3ea(0x1bf)+_0x89fcc6[_0x53b3ea(0x18f)]});}return{..._0x89fcc6,'source':_0x53b3ea(0x147)};}try{const _0x5f4d22=normalizePackagePath(_0x89fcc6[_0x53b3ea(0x18f)]);return!_0x4fd170[_0x53b3ea(0x19c)](_0x5f4d22)&&_0x4c5edf[_0x53b3ea(0x1a9)][_0x53b3ea(0x1c4)]({'line':_0x89fcc6[_0x53b3ea(0x1a8)],'message':_0x53b3ea(0x177)+_0x89fcc6[_0x53b3ea(0x18f)]}),{..._0x89fcc6,'source':_0x53b3ea(0x15e),'path':_0x5f4d22};}catch(_0x33f8a5){return _0x4c5edf[_0x53b3ea(0x1a9)][_0x53b3ea(0x1c4)]({'line':_0x89fcc6[_0x53b3ea(0x1a8)],'message':_0x33f8a5[_0x53b3ea(0x144)]}),{..._0x89fcc6,'source':_0x53b3ea(0x15e)};}}),{..._0x4c5edf,'entry':_0x2e0fa3,'total':_0x554b62[_0x5c215d(0x174)]((_0x21aff3,_0x2ca0a5)=>_0x21aff3+_0x2ca0a5[_0x5c215d(0x1ba)][_0x5c215d(0x159)],0x0)};}function lpx0_0x23661a(_0x2ff496){const _0xd42823=lpx0_0x4c92db;for(let _0x2cab22=0x0;_0x2cab22<0x20;_0x2cab22++){const _0x340d14=_0x2ff496['getRandomValues'](new Uint8Array(0x1))[0x0];if(_0x340d14<0xff)return lpx0_0x472b31[_0x340d14%lpx0_0x472b31[_0xd42823(0x159)]];}throw new Error(_0xd42823(0x1ad));}function lpx0_0x7646a6(_0x4a4a83){const _0x4431dc=lpx0_0x4c92db;return Array[_0x4431dc(0x1c7)](_0x4a4a83,_0x99c18a=>_0x99c18a[_0x4431dc(0x17d)](0x10)[_0x4431dc(0x17a)](0x2,'0'))[_0x4431dc(0x196)]('');}function lpx0_0x507c8f(_0xa7dd74,_0x18ef02,_0x294c5e){const _0x55ef1d=lpx0_0x4c92db;for(let _0xec024b=0x0;_0xec024b<0x20;_0xec024b++){const _0x17d7f7=_0x294c5e[_0x55ef1d(0x164)](new Uint8Array(_0xa7dd74)),_0x5204d8=lpx0_0x7646a6(_0x17d7f7);if(!_0x18ef02[_0x55ef1d(0x19c)](_0x5204d8))return _0x18ef02['add'](_0x5204d8),_0x17d7f7;}throw new Error(_0x55ef1d(0x188));}async function lpx0_0x10bee9(_0x5673cb,_0x4c2baa,_0x5b0adf,_0x595d25,_0x38cbc4,_0xf50d63,_0x1f63b4){const _0x1e6563=lpx0_0x4c92db,_0x15bba2=lpx0_0x507c8f(lpx0_0x1f67ab,_0xf50d63,_0x1f63b4),_0x3d6467=new Uint8Array(_0x5b0adf[_0x1e6563(0x159)]+0x1+lpx0_0x3c3318);_0x3d6467[_0x1e6563(0x187)](_0x5b0adf),_0x3d6467[_0x5b0adf[_0x1e6563(0x159)]]=_0x595d25,_0x3d6467[_0x1e6563(0x187)](_0x38cbc4,_0x5b0adf['length']+0x1);const _0x8d9d9=new Uint8Array(await _0x1f63b4[_0x1e6563(0x165)][_0x1e6563(0x193)]({'name':_0x1e6563(0x14a),'iv':_0x15bba2,'additionalData':_0x3d6467,'tagLength':0x80},_0x4c2baa,_0x5673cb)),_0xc14d39=new Uint8Array(_0x15bba2['length']+_0x8d9d9[_0x1e6563(0x159)]);return _0xc14d39['set'](_0x15bba2),_0xc14d39[_0x1e6563(0x187)](_0x8d9d9,_0x15bba2[_0x1e6563(0x159)]),_0xc14d39;}async function lpx0_0x49e60a(_0x2dbd95,_0x4bc3e7,_0x238e97){const _0x203934=lpx0_0x4c92db;if(_0x2dbd95[_0x203934(0x181)]!==_0x203934(0x154)||!/^[a-f0-9]{64}$/[_0x203934(0x145)](_0x2dbd95[_0x203934(0x1c9)])||!Number[_0x203934(0x1c5)](_0x2dbd95[_0x203934(0x190)])||_0x2dbd95['keySlot']<0x1||_0x2dbd95[_0x203934(0x190)]>0xf)throw new Error('网站加密公钥配置不合法。');const _0x185969=_0x2dbd95['publicKeyPem'];if(!/^-----BEGIN PUBLIC KEY-----[\s\S]+-----END PUBLIC KEY-----\s*$/[_0x203934(0x145)](_0x185969||''))throw new Error('网站缺少有效的\x20SPKI\x20公钥。');const _0x2b0f7b=Uint8Array[_0x203934(0x1c7)](atob(_0x185969[_0x203934(0x192)](/-----[^-]+-----|\s/g,'')),_0x464941=>_0x464941[_0x203934(0x13d)](0x0)),_0x12d7e6=Array[_0x203934(0x1c7)](new Uint8Array(await _0x4bc3e7[_0x203934(0x165)][_0x203934(0x155)](_0x203934(0x15d),_0x2b0f7b)),_0x47e987=>_0x47e987[_0x203934(0x17d)](0x10)['padStart'](0x2,'0'))['join']('');if(_0x12d7e6!==_0x2dbd95[_0x203934(0x1c9)])throw new Error(_0x203934(0x199));const _0x53a19c=await _0x4bc3e7[_0x203934(0x165)][_0x203934(0x14e)](_0x203934(0x152),_0x2b0f7b,{'name':_0x203934(0x154),'hash':_0x238e97},![],[_0x203934(0x193)]);if(_0x53a19c[_0x203934(0x181)][_0x203934(0x1c6)]!==0xc00)throw new Error(_0x203934(0x1a6));return _0x53a19c;}async function encryptPluginPackage(_0x120d55,_0x169a76,_0x28f148,_0x5d0985=globalThis[lpx0_0x4c92db(0x1b0)]){const _0x13958c=lpx0_0x4c92db;if(!_0x5d0985?.[_0x13958c(0x165)]||!_0x5d0985?.[_0x13958c(0x164)])throw new Error(_0x13958c(0x1c2));const _0x4d446d=analyzePlugin(_0x120d55,_0x169a76);if(_0x4d446d[_0x13958c(0x1a9)][_0x13958c(0x159)])throw new Error(_0x4d446d[_0x13958c(0x1a9)][_0x13958c(0x17b)](_0x532e61=>'第\x20'+_0x532e61['line']+'\x20行：'+_0x532e61[_0x13958c(0x144)])[_0x13958c(0x196)]('\x0a'));const _0x4d5f7d=lpx0_0x23661a(_0x5d0985),_0x134c26=await lpx0_0x49e60a(_0x28f148,_0x5d0985,_0x4d5f7d['oaepHash']),_0x5bfe03=_0x120d55[_0x13958c(0x1b8)](_0x4ed6a2=>_0x4ed6a2[_0x13958c(0x1a3)]===_0x169a76),_0x2abc5a=_0x5d0985[_0x13958c(0x164)](new Uint8Array(0x20));let _0x9b9134=null;try{const _0x12d170=await _0x5d0985['subtle'][_0x13958c(0x14e)](_0x13958c(0x1c1),_0x2abc5a,{'name':_0x13958c(0x14a)},![],[_0x13958c(0x193)]),_0x4c16b0=new Uint8Array(await _0x5d0985[_0x13958c(0x165)][_0x13958c(0x193)]({'name':_0x13958c(0x154)},_0x134c26,_0x2abc5a));if(_0x4c16b0[_0x13958c(0x159)]!==lpx0_0x582cd6)throw new Error(_0x13958c(0x1b3));const _0x303242=new Uint8Array(lpx0_0x191081);_0x303242['set'](lpx0_0x505b15[_0x13958c(0x167)](_0x13958c(0x146))),_0x303242[0x4]=LPXE_VERSION,_0x303242[0x5]=_0x28f148[_0x13958c(0x190)]<<0x4|_0x4d5f7d['id'],_0x303242['set'](_0x5d0985[_0x13958c(0x164)](new Uint8Array(lpx0_0x3c3318)),0x6),_0x303242[_0x13958c(0x187)](_0x4c16b0,0x6+lpx0_0x3c3318);const _0x2079f0=new Uint8Array(lpx0_0x3c3318),_0x35ee31=new Set([lpx0_0x7646a6(_0x2079f0)]),_0x45be6f=new Set(),_0x1ec89f=Object[_0x13958c(0x168)](null),_0x32e7f3=[];for(const _0x3469fd of _0x120d55){if(_0x3469fd[_0x13958c(0x1a3)]===_0x169a76){_0x32e7f3[_0x13958c(0x1c4)]({'path':_0x3469fd[_0x13958c(0x1a3)],'size':_0x3469fd[_0x13958c(0x1ba)]['length'],'id':lpx0_0x7646a6(_0x2079f0)});continue;}const _0x42866a=lpx0_0x507c8f(lpx0_0x3c3318,_0x35ee31,_0x5d0985),_0x35e4a8=await lpx0_0x10bee9(_0x3469fd[_0x13958c(0x1ba)],_0x12d170,_0x303242[_0x13958c(0x151)](0x0,lpx0_0x2b5576),0x1,_0x42866a,_0x45be6f,_0x5d0985),_0xee73b7=lpx0_0x7646a6(_0x42866a);_0x1ec89f[_0xee73b7]=_0x35e4a8;const _0x141f88=lpx0_0x7646a6(new Uint8Array(await _0x5d0985[_0x13958c(0x165)][_0x13958c(0x155)](_0x13958c(0x15d),_0x35e4a8)));_0x32e7f3[_0x13958c(0x1c4)]({'path':_0x3469fd[_0x13958c(0x1a3)],'size':_0x3469fd[_0x13958c(0x1ba)][_0x13958c(0x159)],'id':_0xee73b7,'encryptedSize':_0x35e4a8[_0x13958c(0x159)],'sha256':_0x141f88});}const _0x438b6f={'format':_0x13958c(0x1bd),'version':LPXE_VERSION,'entry':_0x169a76,'files':_0x32e7f3,'resources':_0x4d446d['references']},_0x12b7ec=strToU8(JSON[_0x13958c(0x197)](_0x438b6f));if(_0x12b7ec[_0x13958c(0x159)]>ENCRYPTION_LIMITS['metadata'])throw new Error(_0x13958c(0x1a7));_0x9b9134=new Uint8Array(0x4+_0x12b7ec[_0x13958c(0x159)]+_0x5bfe03[_0x13958c(0x1ba)][_0x13958c(0x159)]),new DataView(_0x9b9134[_0x13958c(0x13b)])[_0x13958c(0x161)](0x0,_0x12b7ec['length'],![]),_0x9b9134['set'](_0x12b7ec,0x4),_0x9b9134[_0x13958c(0x187)](_0x5bfe03[_0x13958c(0x1ba)],0x4+_0x12b7ec[_0x13958c(0x159)]),new DataView(_0x303242[_0x13958c(0x13b)])[_0x13958c(0x161)](lpx0_0x2b5576,lpx0_0x1f67ab+_0x9b9134[_0x13958c(0x159)]+0x10,![]);const _0x45f4b1=await lpx0_0x10bee9(_0x9b9134,_0x12d170,_0x303242,0x0,_0x2079f0,_0x45be6f,_0x5d0985),_0x332eca=zipSync(_0x1ec89f,{'level':0x0,'mtime':new Date(_0x13958c(0x14c))}),_0x38b211=new Uint8Array(_0x303242[_0x13958c(0x159)]+_0x45f4b1[_0x13958c(0x159)]+_0x332eca[_0x13958c(0x159)]);return _0x38b211[_0x13958c(0x187)](_0x303242),_0x38b211[_0x13958c(0x187)](_0x45f4b1,_0x303242[_0x13958c(0x159)]),_0x38b211[_0x13958c(0x187)](_0x332eca,_0x303242[_0x13958c(0x159)]+_0x45f4b1[_0x13958c(0x159)]),_0x38b211;}finally{_0x2abc5a[_0x13958c(0x1b2)](0x0),_0x9b9134?.[_0x13958c(0x1b2)](0x0);}}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "assets/js/" + chunkId + "." + "a2f77b4d" + ".js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get mini-css chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.miniCssF = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return undefined;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		__webpack_require__.p = "/";
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/require chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded chunks
/******/ 		// "1" means "loaded", otherwise not loaded yet
/******/ 		var installedChunks = {
/******/ 			994: 1
/******/ 		};
/******/ 		
/******/ 		// no on chunks loaded
/******/ 		
/******/ 		var installChunk = (chunk) => {
/******/ 			var moreModules = chunk.modules, chunkIds = chunk.ids, runtime = chunk.runtime;
/******/ 			for(var moduleId in moreModules) {
/******/ 				if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 					__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 			}
/******/ 			if(runtime) runtime(__webpack_require__);
/******/ 			for(var i = 0; i < chunkIds.length; i++)
/******/ 				installedChunks[chunkIds[i]] = 1;
/******/ 		
/******/ 		};
/******/ 		
/******/ 		// require() chunk loading for javascript
/******/ 		__webpack_require__.f.require = (chunkId, promises) => {
/******/ 			// "1" is the signal for "already loaded"
/******/ 			if(!installedChunks[chunkId]) {
/******/ 				if(true) { // all chunks have JS
/******/ 					installChunk(require("../../" + __webpack_require__.u(chunkId)));
/******/ 				} else installedChunks[chunkId] = 1;
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		// no external install chunk
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";

;// CONCATENATED MODULE: ./src/config/pluginEncryptionPublicKey.json
const pluginEncryptionPublicKey_namespaceObject = /*#__PURE__*/JSON.parse('{"keySlot":1,"keyId":"c6a1bc916f666cab9139aec547e9db40c6721282dc948e3422471ffa4e902a46","algorithm":"RSA-OAEP","publicKeyPem":"-----BEGIN PUBLIC KEY-----\\nMIIBojANBgkqhkiG9w0BAQEFAAOCAY8AMIIBigKCAYEAuAq7o42layShk7e+8i+t\\nuIVMjgVHfUTCiQkpwftMKkEdAYfwf+rgeVnJCFflRokS2fXO1Tp/b6VrxCZHVl5w\\ng4Lpenl+B1xInin2J2nIXH1pXNhgV+Ko63U3gp9kjTx4/fhIJ51E8VCQyjdZJxIA\\nroT20fROTAoA3DSZt16EA5jafjKJur2NYgdG70On8gimdFeTOtBvE+vlSbjZi08/\\nGz4dYbgsnGhVJldXHAyfZHYT0ZhYE5SxAyNono7xTeh5ydtxk6zztWSAHN1QD6er\\nexFLdjqTWawDerhBh7mkFxf8sL+PGsCFwDc41S0dmqNLqtVHM2whstcS5k8ZYENQ\\numWjCtsu0T+qZYi8t1TuWjqSG5Zd2XSSHWXP/0oZdu70HSKNRsLDXUUnS7QZr1q7\\nT/KVZ4AciT3oYeY5+QE73t7REgehTxBLlxArFL8T57PdiwuzaVAbrpsLFUp3PKl4\\n3GrfmmmUdvy2URVAIRIoksjAIGP2mj1bubQZriNEsOejAgMBAAE=\\n-----END PUBLIC KEY-----\\n"}');
// EXTERNAL MODULE: ./src/utils/pluginEncryption.mjs + 2 modules
var pluginEncryption = __webpack_require__(74610);
;// CONCATENATED MODULE: ./src/utils/pluginEncryptionWorker.mjs
/* Generated LPXE module. Edit drafts/plugin-encryption and run npm run encryptor:obfuscate. */
(function(_0x192e33,_0x268940){const _0x5744ca=lpx2_0x439a,_0x206034=_0x192e33();while(!![]){try{const _0x4a28a2=parseInt(_0x5744ca(0xd4))/0x1+-parseInt(_0x5744ca(0xe0))/0x2+-parseInt(_0x5744ca(0xcf))/0x3+parseInt(_0x5744ca(0xc6))/0x4+-parseInt(_0x5744ca(0xcd))/0x5+parseInt(_0x5744ca(0xcc))/0x6+parseInt(_0x5744ca(0xde))/0x7;if(_0x4a28a2===_0x268940)break;else _0x206034['push'](_0x206034['shift']());}catch(_0x16474b){_0x206034['push'](_0x206034['shift']());}}}(lpx2_0x146d,0x1ba82));function lpx2_0x146d(){const _0x3e4064=['zw5JCNLWDgvK','mtm3mtC4q25VAhvz','ndi4mty1Bvn5AwP1','yNvMzMvY','ntyWmdy3C0XID0v5','zw5JCNLWDa','C291CMnLvvjm','zgf0yq','Aw1WB3j0','mtaXmdaZBgvhqLzW','yw5HBhL6zq','Cg9ZDe1LC3nHz2u','yxjYyxLcDwzMzxi','BMfTzq','Dg90ywW','C2L6zq','yw5HBhL6zwq','zgvMyxvSDevUDhj5','Aw1WB3j0vvjm','mteZnZGZnNDuvNzLsq','BwfW','otu4mtHTu1jMs28','6k+35ywi6ycj5OUP5O+s5lU25PAh5lU25OIw5PAh5lU25As544cc','zxjYB3i','lMXWEgu','ChjVz3jLC3m','5PEG5Rov6k+g5yIR5B2t5yMn5lU75yQH77Ym6k+36yEn5PAW6ycj5OUP5O+s5lU244cc','BgvUz3rO','ntG4mZK2vwDdzufO','BwvZC2fNzq','zw50CMLLCW','Aw1WB3j0zwq','y2fUzgLKyxrLCW'];lpx2_0x146d=function(){return _0x3e4064;};return lpx2_0x146d();}let lpx2_0x2cd419=null;function lpx2_0x439a(_0x5cef89,_0x43ebaf){const _0x146d2c=lpx2_0x146d();return lpx2_0x439a=function(_0x439abc,_0x3661dd){_0x439abc=_0x439abc-0xc4;let _0x198c5c=_0x146d2c[_0x439abc];if(lpx2_0x439a['beNTcK']===undefined){var _0x1464da=function(_0x4defb0){const _0x2cd419='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';let _0x409ec4='',_0x1c7ec4='';for(let _0x4be628=0x0,_0x15b222,_0x50d11b,_0xa76bf6=0x0;_0x50d11b=_0x4defb0['charAt'](_0xa76bf6++);~_0x50d11b&&(_0x15b222=_0x4be628%0x4?_0x15b222*0x40+_0x50d11b:_0x50d11b,_0x4be628++%0x4)?_0x409ec4+=String['fromCharCode'](0xff&_0x15b222>>(-0x2*_0x4be628&0x6)):0x0){_0x50d11b=_0x2cd419['indexOf'](_0x50d11b);}for(let _0x34bbd2=0x0,_0x2d5d5b=_0x409ec4['length'];_0x34bbd2<_0x2d5d5b;_0x34bbd2++){_0x1c7ec4+='%'+('00'+_0x409ec4['charCodeAt'](_0x34bbd2)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x1c7ec4);};lpx2_0x439a['QWqVQJ']=_0x1464da,_0x5cef89=arguments,lpx2_0x439a['beNTcK']=!![];}const _0x3184d5=_0x146d2c[0x0],_0x37230c=_0x439abc+_0x3184d5,_0x377011=_0x5cef89[_0x37230c];return!_0x377011?(_0x198c5c=lpx2_0x439a['QWqVQJ'](_0x198c5c),_0x5cef89[_0x37230c]=_0x198c5c):_0x198c5c=_0x377011,_0x198c5c;},lpx2_0x439a(_0x5cef89,_0x43ebaf);}async function handlePluginEncryptionMessage(_0x409ec4){const _0x125ba5=lpx2_0x439a,{id:_0x1c7ec4,type:_0x4be628,files:_0x15b222,directory:_0x50d11b,entry:_0xa76bf6,url:_0x34bbd2}=_0x409ec4[_0x125ba5(0xd2)];try{if(_0x4be628===_0x125ba5(0xd3)){lpx2_0x2cd419=null;const _0x2d5d5b=_0x15b222[_0x125ba5(0xdf)](({file:_0xa3c826,relativePath:_0x18217e})=>({'name':_0xa3c826[_0x125ba5(0xd8)],'size':_0xa3c826[_0x125ba5(0xda)],'webkitRelativePath':_0x18217e,'arrayBuffer':()=>_0xa3c826[_0x125ba5(0xd7)]()}));lpx2_0x2cd419=await (0,pluginEncryption/* readPluginInput */.oc)(_0x2d5d5b,{'directory':_0x50d11b}),self[_0x125ba5(0xd6)]({'id':_0x1c7ec4,'type':'imported','files':lpx2_0x2cd419['entries'][_0x125ba5(0xdf)](({path:_0x36bcab,bytes:_0xeff5d1})=>({'path':_0x36bcab,'size':_0xeff5d1[_0x125ba5(0xc5)]})),'candidates':lpx2_0x2cd419[_0x125ba5(0xca)],'entry':lpx2_0x2cd419[_0x125ba5(0xdc)],'total':lpx2_0x2cd419[_0x125ba5(0xd9)]});}else{if(_0x4be628===_0x125ba5(0xdd)){lpx2_0x2cd419=null;const {importPluginFromURL:_0x4a0d0d}=await __webpack_require__.e(/* import() */ 389).then(__webpack_require__.bind(__webpack_require__, 55389));lpx2_0x2cd419=await _0x4a0d0d(_0x34bbd2,{'onProgress':_0x1cf85a=>self[_0x125ba5(0xd6)]({'id':_0x1c7ec4,'type':_0x125ba5(0xe4),'progress':_0x1cf85a})}),self[_0x125ba5(0xd6)]({'id':_0x1c7ec4,'type':_0x125ba5(0xc9),'files':lpx2_0x2cd419[_0x125ba5(0xc8)][_0x125ba5(0xdf)](({path:_0x1ce728,bytes:_0x3bb1ea,sourceURL:_0x565148})=>({'path':_0x1ce728,'size':_0x3bb1ea[_0x125ba5(0xc5)],'sourceURL':_0x565148})),'candidates':lpx2_0x2cd419['candidates'],'entry':lpx2_0x2cd419[_0x125ba5(0xdc)],'total':lpx2_0x2cd419['total'],'sourceURL':lpx2_0x2cd419[_0x125ba5(0xd1)]});}else{if(_0x4be628===_0x125ba5(0xd5)){if(!lpx2_0x2cd419)throw new Error(_0x125ba5(0xe1));self[_0x125ba5(0xd6)]({'id':_0x1c7ec4,'type':_0x125ba5(0xdb),'analysis':(0,pluginEncryption/* analyzePlugin */.Up)(lpx2_0x2cd419[_0x125ba5(0xc8)],_0xa76bf6)});}else{if(_0x4be628===_0x125ba5(0xd0)){if(!lpx2_0x2cd419)throw new Error(_0x125ba5(0xe1));const _0x1e7123=await (0,pluginEncryption/* encryptPluginPackage */.X8)(lpx2_0x2cd419['entries'],_0xa76bf6,pluginEncryptionPublicKey_namespaceObject);self[_0x125ba5(0xd6)]({'id':_0x1c7ec4,'type':_0x125ba5(0xcb),'bytes':_0x1e7123,'filename':_0xa76bf6['replace'](/\.[^.]+$/,'')+_0x125ba5(0xe3)},[_0x1e7123[_0x125ba5(0xce)]]);}else throw new Error(_0x125ba5(0xc4));}}}}catch(_0x4f232c){self[_0x125ba5(0xd6)]({'id':_0x1c7ec4,'type':_0x125ba5(0xe2),'message':_0x4f232c[_0x125ba5(0xc7)]||'处理失败，请重试。'});}}

;// CONCATENATED MODULE: ./src/utils/pluginEncryption.worker.js
// Worker 协议入口；实际处理逻辑仅发布混淆产物。
self.onmessage=handlePluginEncryptionMessage;
})();

module.exports = __webpack_exports__;
/******/ })()
;