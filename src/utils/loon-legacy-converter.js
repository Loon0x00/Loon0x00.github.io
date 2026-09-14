/* Loon 旧 Rewrite / Script 转换器。无第三方依赖；支持 Node.js、浏览器和 JSCore。 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LoonLegacyConverter = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const numberPattern = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;
  const names = new Set(('header 302 307 reject reject-200 reject-img reject-dict reject-array reject-video header-del header-replace header-add header-replace-regex request-body-replace-regex mock-request-body response-header-del response-header-replace response-header-add response-header-replace-regex response-body-replace-regex mock-response-body request-body-json-add request-body-json-del request-body-json-replace response-body-json-add response-body-json-del response-body-json-replace request-body-json-jq response-body-json-jq').split(' '));
  /** 抛出可报告的转换错误；code 为稳定标识，message 为中文说明。 */
  function fail(
    code,
    message
  ) { const e = new Error(message); e.code = code; throw e; }
  /** 将文本编码为新语法字符串，阻止原文中的 ${...} 被意外插值。 */
  function quote(text) {
    return '"' + String(text).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t').replace(/\$\{/g, '\\${') + '"';
  }
  /** 只识别已声明的旧插件引用；保留转义、JSON 花括号和已有 ${...} 字面量。 */
  function rewriteReferences(text, types) {
    const refs = [];
    for (const match of text.matchAll(/\{([^{}\r\n]+)\}/g)) {
      const key = match[1];
      if (!own(types, key) || text[match.index - 1] === '$') continue;
      let slashes = 0;
      for (let i = match.index - 1; i >= 0 && text[i] === '\\'; i--) slashes++;
      if (slashes % 2 === 0) refs.push({index: match.index, text: match[0], key});
    }
    return refs;
  }
  function rewriteVariable(text, types, expected) {
    const refs = rewriteReferences(text, types);
    return refs.length === 1 && refs[0].text === text
      ? variable(refs[0].key, types, expected) : '';
  }
  /** 逐段编码字面量，只有已声明的旧参数转换成模板插值。 */
  function rewriteString(text, types) {
    let body = '', start = 0;
    for (const ref of rewriteReferences(text, types)) {
      body += quote(text.slice(start, ref.index)).slice(1, -1) + variable(ref.key, types);
      start = ref.index + ref.text.length;
    }
    return '"' + body + quote(text.slice(start)).slice(1, -1) + '"';
  }
  function rewriteRegex(text, types, flags = '') {
    const ref = rewriteVariable(text, types, ['string']);
    if (ref) return ref;
    if (rewriteReferences(text, types).length) {
      fail('embedded-plugin-regex', '正则中嵌入的插件参数无法直接转换，请使用参数提供完整正则');
    }
    return regex(text, flags);
  }
  /** 保留 ICU 正则，只转义新语法的斜杠分隔符；flags 为匹配选项。 */
  function regex(
    text,
    flags = ''
  ) {
    let result = '', slashes = 0;
    for (const c of text) {
      result += c === '/' && slashes % 2 === 0 ? '\\/' : c;
      slashes = c === '\\' ? slashes + 1 : 0;
    }
    if (!text || slashes % 2) fail('invalid-regex', '正则为空或以未配对的反斜杠结束');
    return '/' + result + '/' + flags;
  }
  /** 解码旧 Rewrite 专用的空格占位符；不解码其他正则转义。 */
  function spaces(s) { return s.replace(/\\x20/g, ' '); }
  /** 输出位置参数动作；args 中的值已经编码为新语法。 */
  function action(
    name,
    args
  ) { return name + '(' + args.join(', ') + ')'; }
  /** 合并同一旧动作的多组参数，使其对应新语法数组参数。 */
  function batch(
    name,
    rows
  ) {
    return action(name, rows[0].map((_, i) => rows.length === 1 ? rows[0][i] : '[' + rows.map(row => row[i]).join(', ') + ']'));
  }
  /** 按旧解析器规则读取 Mock 命名参数，保留 data 内嵌的 JSON 双引号。 */
  function mockOptions(text) {
    const out = Object.create(null); let i = 0;
    while (i < text.length) {
      while (/\s/.test(text[i] || '') && i < text.length) i++;
      const start = i;
      while (i < text.length && text[i] !== '=' && !/\s/.test(text[i])) i++;
      if (i >= text.length) break;
      if (text[i] !== '=') continue;
      const key = text.slice(start, i++); let value = '';
      if (text[i] === '"') {
        i++;
        while (i < text.length) {
          if (text[i] === '"' && (i + 1 === text.length || /\s/.test(text[i + 1]))) { i++; break; }
          value += text[i++];
        }
      } else {
        const begin = i;
        while (i < text.length && !/\s/.test(text[i])) i++;
        value = text.slice(begin, i);
      }
      if (key) out[key] = value;
    }
    return out;
  }
  /** 保留旧 JSON 标量类型；未加引号的数组、对象仍按旧模型的字符串处理。 */
  function jsonValue(text, types) {
    const ref = rewriteVariable(text, types);
    if (ref) return ref;
    const lower = text.toLowerCase();
    if (['true', 'yes'].includes(lower)) return 'true';
    if (['false', 'no'].includes(lower)) return 'false';
    if (['null', 'nil', '<null>'].includes(lower)) return 'null';
    if (text.startsWith('"') && text.endsWith('"')) return rewriteString(text.slice(1, -1), types);
    if (numberPattern.test(text)) return text;
    return rewriteString(spaces(text), types);
  }
  /** 校验旧 JSON path 的点、数组索引和带引号键语法。 */
  function jsonPath(text, types) {
    if (rewriteReferences(text, types).length) return rewriteString(text, types);
    let i = 0;
    while (i < text.length) {
      if (text[i] === '[') {
        const match = /^(?:\[(\d+)\]|\[("(?:[^"\\]|\\.)*")\])/.exec(text.slice(i));
        if (!match) fail('invalid-json-path', '无效的 JSON path：' + text);
        if (match[2]) { try { if (!JSON.parse(match[2])) throw Error(); } catch (_) { fail('invalid-json-path', '无效的 JSON 键：' + text); } }
        i += match[0].length;
      } else {
        const match = /^[^.\[\]]+/.exec(text.slice(i));
        if (!match) fail('invalid-json-path', '无效的 JSON path：' + text);
        i += match[0].length;
      }
      if (i === text.length) return quote(text);
      if (text[i] === '[') continue;
      if (text[i++] !== '.' || i === text.length || /[.\]]/.test(text[i])) break;
    }
    fail('invalid-json-path', '无效的 JSON path：' + text);
  }
  /** 生成 URL 替换模板；返回捕获条件后缀及替换参数，types 用于避开插件变量重名。 */
  function urlTemplate(
    text,
    types
  ) {
    let capture = 'urlMatch', n = 0;
    while (own(types, capture)) capture = 'urlMatch' + (++n);
    let body = '', literal = '', used = false;
    const flush = () => {
      if (/\$[0-9]/.test(literal)) fail('literal-url-capture', 'URL 替换含字面量 $n，当前新语法禁止该形式，保留原行');
      body += rewriteString(literal, types).slice(1, -1); literal = '';
    };
    for (let i = 0; i < text.length;) {
      if (text[i] === '\\' && /[$\\]/.test(text[i + 1] || '')) { literal += text[i + 1]; i += 2; continue; }
      const match = /^\$(\d+)/.exec(text.slice(i));
      if (match) { flush(); body += '${' + capture + '.' + Number(match[1]) + '}'; used = true; i += match[0].length; }
      else literal += text[i++];
    }
    flush();
    return { suffix: used ? ' as ' + capture : '', value: '"' + body + '"' };
  }
  /** 转换一条旧 Rewrite；types 为插件参数名到类型的映射。 */
  function rewrite(
    source,
    types
  ) {
    const words = source.split(/\s+/);
    if (words.length < 2) fail('legacy-format', 'Rewrite 缺少 URL 正则或动作');
    let name = words[1].toLowerCase(), rest = source.replace(/^\S+\s+\S+\s*/, '');
    if (!names.has(name)) {
      if (words.length >= 3 && names.has(words[2].toLowerCase())) { name = words[2].toLowerCase(); rest = words[1]; }
      else fail('unknown-legacy-action', '不支持的旧 Rewrite 动作：' + words[1]);
    }
    let phase = 'request', condition = '${url} ~= ' + rewriteRegex(words[0], types, 'i'), actions = [];
    const parts = rest ? rest.split(/\s+/) : [];
    const rows = (size, convert) => {
      if (!parts.length || parts.length % size) fail('legacy-parameters', '动作 ' + name + ' 的参数必须每 ' + size + ' 项成组');
      const out = [];
      for (let i = 0; i < parts.length; i += size) out.push(convert(parts.slice(i, i + size)));
      return out;
    };
    if (['header', '302', '307'].includes(name)) {
      if (!rest) fail('legacy-parameters', 'URL 替换缺少替换内容');
      const template = urlTemplate(spaces(rest), types); condition += template.suffix;
      actions = [action(name === 'header' ? 'url.replace' : 'redirect', name === 'header' ? [template.value] : [name, template.value])];
    } else if (name.startsWith('reject')) {
      actions = [action(name === 'reject-200' ? 'reject' : name.replace('-', '_'), [name === 'reject' ? '404' : '200'])];
    } else if (name.startsWith('mock-')) {
      const opts = mockOptions(rest), response = name === 'mock-response-body';
      // 与当前原生模型一致，response.body.mock 归入响应阶段。
      phase = response ? 'response' : 'request';
      if (!opts['data-type']) fail('legacy-parameters', 'Mock 缺少 data-type');
      if (!rewriteVariable(opts['data-type'], types, ['string']) && !['json', 'text', 'css', 'html', 'javascript', 'plain', 'png', 'gif', 'jpeg', 'tiff', 'svg', 'mp4', 'form-data'].includes(opts['data-type'])) fail('invalid-mock-type', '当前新语法不支持该 Mock 类型：' + opts['data-type']);
      const fromFile = !own(opts, 'data') && own(opts, 'data-path');
      const args = [rewriteString(opts['data-type'], types), rewriteString(fromFile ? opts['data-path'] : opts.data || '', types)];
      const encoding = opts['data-is-base64'] || opts['mock-data-is-base64'] || '';
      const base64 = rewriteVariable(encoding, types, ['boolean']) || (encoding.toLowerCase() === 'true' ? 'true' : '');
      if (response && opts['status-code']) {
        const status = rewriteVariable(opts['status-code'], types, ['number']);
        if (!status && !/^[+-]?\d+$/.test(opts['status-code'])) fail('legacy-parameters', 'Mock status-code 必须是整数');
        args.push(status || String(Number(opts['status-code'])));
      } else if (response && base64) args.push('200');
      if (base64) args.push(base64);
      actions = [action((response ? 'response' : 'request') + '.body.mock' + (fromFile ? '_file' : ''), args)];
    } else {
      phase = name.startsWith('response-') ? 'response' : 'request';
      const short = name.replace(/^(?:response-|request-)/, '');
      if (short === 'header-del') actions = [batch(phase + '.header.del', rows(1, p => [rewriteString(p[0], types)]))];
      else if (['header-add', 'header-replace'].includes(short)) actions = [batch(phase + '.header.' + (short.endsWith('add') ? 'add' : 'set'), rows(2, p => [rewriteString(p[0], types), rewriteString(spaces(p[1]), types)]))];
      else if (short === 'header-replace-regex') actions = [batch(phase + '.header.replace', rows(3, p => [rewriteString(p[0], types), rewriteRegex(p[1], types), rewriteString(spaces(p[2]), types)]))];
      else if (short === 'body-replace-regex') actions = [batch(phase + '.body.replace', rows(2, p => [rewriteRegex(p[0], types), rewriteString(spaces(p[1]), types)]))];
      else if (short === 'body-json-del') actions = [batch(phase + '.json.delete', rows(1, p => [jsonPath(p[0], types)]))];
      else if (['body-json-add', 'body-json-replace'].includes(short)) actions = [batch(phase + '.json.' + (short.endsWith('add') ? 'add' : 'replace'), rows(2, p => [jsonPath(p[0], types), jsonValue(p[1], types)]))];
      else if (short === 'body-json-jq') {
        let remaining = rest.trim();
        while (remaining) {
          const match = /^(?:'([^']*)'|jq-path="([^"]*)")/.exec(remaining);
          if (!match) fail('legacy-parameters', 'JQ 需要单引号表达式或 jq-path="文件"');
          actions.push(action(phase + '.json.' + (match[1] !== undefined ? 'jq' : 'jq_file'), [rewriteString(match[1] !== undefined ? match[1] : match[2], types)]));
          remaining = remaining.slice(match[0].length).trimStart();
        }
        if (!actions.length) fail('legacy-parameters', 'JQ 缺少表达式');
      }
    }
    if (!actions.length) fail('unknown-legacy-action', '无法转换 Rewrite 动作');
    return phase + ' if ' + condition + ' then ' + actions.join(' | ');
  }
  /** 读取旧 Script 命名参数，严格跟随原生解析器的逗号、引号及括号边界。 */
  function scriptValue(
    source,
    key
  ) {
    const match = new RegExp('(?:^|[\\s,])' + key + '\\s*=\\s*', 'i').exec(source);
    if (!match) return undefined;
    let i = match.index + match[0].length, start = i;
    if (source[i] === '"') {
      i++; let escaped = false;
      while (i < source.length) { const c = source[i++]; if (!escaped && c === '"') break; escaped = !escaped && c === '\\'; }
    } else if (source[i] === '[' || source[i] === '{') {
      const open = source[i], close = open === '[' ? ']' : '}'; let depth = 0;
      while (i < source.length) { const c = source[i++]; if (c === open) depth++; else if (c === close && --depth === 0) break; }
      while (i < source.length && source[i] !== ',') i++;
    } else while (i < source.length && source[i] !== ',') i++;
    return source.slice(start, i).trim();
  }
  /**
   * 按旧 DCUtils.parserArguments: 的规则读取字符串参数，不执行反斜杠解码或模板插值。
   * @param {string} source 完整旧 Script 行，用于提取原始参数区。
   * @param {string} value 已识别的 argument 参数；Object 参数由其他分支处理。
   * @returns {string} 脚本在旧实现中实际接收到的字符串。
   */
  function legacyArgumentString(
    source,
    value
  ) {
    if (!value.startsWith('"')) return value;
    const pathStart = source.search(/script-path/i);
    const params = source.slice(pathStart < 0 ? 0 : pathStart).trim();
    const match = /(^|, *)arguments?=+"(.*)"(,|$)/i.exec(params);
    if (!match) fail('legacy-argument-format', '无法按旧字符串参数规则确定 argument 边界');
    return match[2];
  }
  /** 解码 Script 的路径、标签等字段；argument 单独保留旧版原始字符串语义。 */
  function decode(text) {
    if (text === undefined) return undefined;
    if (!text.startsWith('"') || !text.endsWith('"')) return text;
    let out = '';
    for (let i = 1; i < text.length - 1; i++) {
      const c = text[i];
      if (c === '\\') {
        const next = text[++i], map = { '"': '"', '\\': '\\', n: '\n', r: '\r', t: '\t' };
        if (own(map, next)) out += map[next];
        else if (next === '$' && text[i + 1] === '{') { out += '${'; i++; }
        else fail('invalid-escape', '旧 Script 字符串包含不支持的转义');
      } else if (c === '$' && text[i + 1] === '{') fail('legacy-string-template', '旧 Script 字符串含模板引用，请人工确认');
      else out += c;
    }
    return out;
  }
  /** 从旧 Script 行首读取 HTTP 正则或 Cron 表达式。 */
  function triggerValue(
    source,
    trigger
  ) {
    const rest = source.slice(trigger.length).trimStart();
    if (rest.startsWith('"')) {
      const match = /^"(?:[^"\\]|\\.)*"/.exec(rest);
      return match ? match[0] : undefined;
    }
    if (rest.startsWith('{')) { const end = rest.indexOf('}'); return end < 0 ? undefined : rest.slice(0, end + 1); }
    return rest.split(/\s/)[0];
  }
  /** 解析旧 Boolean，fallback 用于原生会回退为 false 的 body 选项。 */
  function boolean(
    text,
    fallback
  ) {
    if (/^(true|1)$/i.test(text)) return 'true';
    if (/^(false|0)$/i.test(text)) return 'false';
    if (fallback !== undefined) return fallback;
    fail('invalid-boolean', 'Boolean 参数必须为 true/false/1/0');
  }
  /** 生成插件变量引用；expected 指定所需类型，strict 控制是否必须已声明。 */
  function variable(
    key,
    types,
    expected,
    strict = true
  ) {
    key = key.trim();
    if (!key || /[{}\r\n]/.test(key)) fail('invalid-plugin-variable', '插件变量名称不合法');
    if (strict && !own(types, key)) fail('undefined-plugin-argument', '未声明插件参数：' + key);
    if (expected && own(types, key) && !expected.includes(types[key])) fail('plugin-type', '插件参数类型不匹配：' + key);
    return '${' + key + '}';
  }
  /** 将旧 Object/数组形式的 argument 转为新语法插件参数集合。 */
  function pluginObject(
    text,
    types
  ) {
    let keys = [];
    if (text.startsWith('[') && text.endsWith(']')) {
      for (let i = 1; i < text.length - 1; i++) {
        if (text[i] !== '{') continue;
        const start = i + 1; let depth = 1;
        while (++i < text.length - 1) { if (text[i] === '{') depth++; if (text[i] === '}' && --depth === 0) break; }
        if (depth === 0) keys.push(text.slice(start, i).trim());
      }
    } else if (text.startsWith('{') && text.endsWith('}')) keys = text.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    keys = keys.map(s => s.startsWith('${') && s.endsWith('}') ? s.slice(2, -1).trim() : s);
    if (!keys.length) fail('empty-plugin-object', '插件参数集合不能为空');
    if (new Set(keys).size !== keys.length) fail('duplicate-plugin-argument', '插件参数集合含重复名称');
    return '{' + keys.map(k => variable(k, types)).join(', ') + '}';
  }
  /** 转换一条旧 Script；保持默认值及插件变量，不将当前插件值写死到结果中。 */
  function script(
    source,
    types
  ) {
    const trigger = source.split(/\s/)[0].toLowerCase();
    if (!['http-request', 'http-response', 'cron', 'network-changed', 'generic'].includes(trigger)) fail('unknown-script-trigger', '不支持的 Script 类型');
    const get = key => scriptValue(source, key), path = decode(get('script-path'));
    if (!path) fail('script-path-required', 'Script 缺少 script-path');
    let prefix = trigger + ' then ';
    const http = trigger.startsWith('http-');
    if (http) prefix = trigger.slice(5) + ' if ${url} ~= ' + regex(triggerValue(source, trigger) || '', 'i') + ' then ';
    if (trigger === 'cron') {
      const value = triggerValue(source, trigger);
      if (!value) fail('invalid-cron', 'Cron 缺少表达式');
      if (value.startsWith('{') && value.endsWith('}')) prefix = 'cron ' + variable(value.slice(1, -1), types, ['string']) + ' then ';
      else {
        const cron = decode(value);
        if (![5, 6].includes(cron.trim().split(/\s+/).length)) fail('invalid-cron', 'Cron 必须为五段或六段表达式');
        prefix = 'cron ' + quote(cron) + ' then ';
      }
    }
    const args = [quote(path)], argument = get('argument');
    if (argument) args.push(/^[\[{]/.test(argument) ? pluginObject(argument, types) : quote(legacyArgumentString(source, argument)));
    const options = [];
    let enable = get('enable'); if (enable === undefined) enable = get('enabled');
    if (enable) {
      if (enable.startsWith('{') && enable.endsWith('}')) options.push('enable=' + variable(enable.slice(1, -1), types, null, false));
      else if (boolean(enable) === 'false') options.push('enable=false');
    }
    // 默认 tag 留给新解析器按路径生成，显式 tag 保持原值。
    const tag = decode(get('tag')); if (tag) options.push('tag=' + quote(tag));
    const image = decode(get('img-url')); if (image) options.push('img_url=' + quote(image));
    const timeout = get('timeout');
    if (timeout) {
      if (timeout.startsWith('{') && timeout.endsWith('}')) options.push('timeout=' + variable(timeout.slice(1, -1), types, ['number', 'string']));
      else {
        if (!numberPattern.test(timeout) || !Number.isFinite(Number(timeout)) || Number(timeout) <= 0) fail('invalid-timeout', 'timeout 必须为正的有限数值');
        options.push('timeout=' + timeout);
      }
    }
    const debug = get('debug');
    if (debug !== undefined) {
      if (debug.startsWith('{') && debug.endsWith('}')) options.push('debug=' + variable(debug.slice(1, -1), types, null, false));
      else if (boolean(debug) === 'true') options.push('debug=true');
    }
    if (http) for (const key of ['requires-body', 'binary-body-mode']) if (boolean(get(key), 'false') === 'true') options.push(key.replace(/-/g, '_') + '=true');
    return prefix + action('script', args) + (options.length ? ' with ' + options.join(', ') : '');
  }
  /** 判断明确的新语法行；新语法原样返回，不声称完成全量语法验证。 */
  function isNew(
    source,
    kind
  ) {
    if (kind === 'rewrite') return /^(request|response)(?:\s|$)/i.test(source);
    const first = source.split(/\s/)[0].toLowerCase();
    if (['request', 'response'].includes(first)) return true;
    return ['cron', 'network-changed', 'generic'].includes(first) && !/(?:^|[\s,])script-path\s*=/i.test(source);
  }
  /** 转换单行；options.kind 为 rewrite/script/auto，argumentTypes 为插件静态类型表。返回 text/status/diagnostics。 */
  function convertLine(
    line,
    options = {}
  ) {
    const source = line.trim(), types = options.argumentTypes || Object.create(null);
    if (!source || /^[#;]/.test(source)) return { text: line, status: 'unchanged', diagnostics: [] };
    let kind = options.kind || 'auto';
    if (kind === 'auto') {
      if (/^(http-request|http-response|cron|network-changed|generic)(?:\s|$)/i.test(source)) kind = 'script';
      else if (/^(request|response)(?:\s|$)/i.test(source)) return { text: line, status: 'unchanged', diagnostics: [] };
      else kind = 'rewrite';
    }
    try {
      if (!['rewrite', 'script'].includes(kind)) fail('invalid-kind', 'kind 必须为 rewrite/script/auto');
      if (isNew(source, kind)) return { text: line, status: 'unchanged', diagnostics: [] };
      const converted = kind === 'rewrite' ? rewrite(source, types) : script(source, types);
      return { text: line.slice(0, line.indexOf(source)) + converted + line.slice(line.indexOf(source) + source.length), status: 'converted', kind, diagnostics: [] };
    } catch (error) {
      if (!error.code) throw error;
      return { text: line, status: 'error', kind, diagnostics: [{ severity: 'error', code: error.code, message: error.message }] };
    }
  }
  /** 从完整插件读取 [Argument] 静态类型；不读取或求值用户参数。 */
  function argumentTypes(text) {
    const types = Object.create(null); let section = '';
    for (const line of text.split(/\r\n|\n|\r/)) {
      const source = line.trim(), heading = /^\[([^\]]+)\]\s*(?:[#;].*)?$/.exec(source);
      if (heading) { section = heading[1].toLowerCase(); continue; }
      if (section !== 'argument' || !source || /^[#;]/.test(source)) continue;
      const match = /^([^=]+)=\s*(switch|input|select)\s*,(.*)$/i.exec(source);
      if (!match) continue;
      const type = /(?:^|,)\s*type\s*=\s*(number|string)\s*(?:,|$)/i.exec(match[3]);
      types[match[1].trim()] = match[2].toLowerCase() === 'switch' ? 'boolean' : type ? type[1].toLowerCase() : 'string';
    }
    return types;
  }
  /** 转换完整插件/配置或纯规则文本，保留其他分区、注释、空行、BOM 与换行格式。 */
  function convertText(
    text,
    options = {}
  ) {
    const types = Object.assign(Object.create(null), argumentTypes(text), options.argumentTypes || {});
    const chunks = text.split(/(\r\n|\n|\r)/), diagnostics = [], records = [];
    const sectioned = chunks.some((s, i) => i % 2 === 0 && /^\s*\[[^\]]+\]\s*(?:[#;].*)?$/.test(s));
    let section = '', converted = 0, errors = 0;
    for (let i = 0; i < chunks.length; i += 2) {
      const source = chunks[i].trim(), heading = /^\[([^\]]+)\]\s*(?:[#;].*)?$/.exec(source);
      if (heading) { section = heading[1].toLowerCase(); continue; }
      if (sectioned && !['rewrite', 'script'].includes(section)) continue;
      const result = convertLine(chunks[i], { kind: sectioned ? section : options.kind || 'auto', argumentTypes: types });
      if (result.status === 'converted') converted++;
      if (result.status === 'error') errors++;
      if (result.status !== 'unchanged') records.push({ line: i / 2 + 1, kind: result.kind, source: chunks[i], output: result.text, status: result.status });
      diagnostics.push(...result.diagnostics.map(d => Object.assign({ line: i / 2 + 1 }, d)));
      chunks[i] = result.text;
    }
    return { text: chunks.join(''), converted, errors, diagnostics, records, argumentTypes: types };
  }
  return { convertLine, convertText, argumentTypes };
});

