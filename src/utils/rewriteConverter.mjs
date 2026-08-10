const LEGACY_ACTIONS = new Set([
  'header',
  '302',
  '307',
  'reject',
  'reject-200',
  'reject-img',
  'reject-dict',
  'reject-array',
  'reject-video',
  'header-add',
  'header-del',
  'header-replace',
  'header-replace-regex',
  'request-body-replace-regex',
  'mock-request-body',
  'response-header-add',
  'response-header-del',
  'response-header-replace',
  'response-header-replace-regex',
  'response-body-replace-regex',
  'mock-response-body',
  'request-body-json-add',
  'request-body-json-del',
  'request-body-json-replace',
  'request-body-json-jq',
  'response-body-json-add',
  'response-body-json-del',
  'response-body-json-replace',
  'response-body-json-jq',
]);

function quoteString(value) {
  const escaped = String(value)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
  return `"${escaped}"`;
}

function rawString(value) {
  return `\`${String(value).replace(/`/g, '``')}\``;
}

function decodeLegacyText(value) {
  return String(value).replace(/\\x20/gi, ' ');
}

function regexLiteral(pattern, flags = '') {
  const escaped = String(pattern).replace(/(^|[^\\])\//g, '$1\\/');
  const safeFlags = [...new Set(String(flags).split(''))]
    .filter((flag) => ['i', 'm', 's'].includes(flag))
    .join('');
  return `/${escaped}/${safeFlags}`;
}

function tokenizeLegacyLine(line) {
  const tokens = [];
  let value = '';
  let quote = '';
  let quoteMode = '';
  let delimited = false;

  const isDataClosingQuote = (index) => {
    const remainder = line.slice(index + 1);
    if (!remainder) {
      return true;
    }
    if (!/^\s/.test(remainder)) {
      return false;
    }
    const nextToken = remainder.trimStart();
    return (
      !nextToken || /^[A-Za-z][A-Za-z0-9-]*=/.test(nextToken)
    );
  };

  const push = () => {
    if (value || delimited) {
      tokens.push({value, quoted: delimited});
      value = '';
      delimited = false;
    }
  };

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (quote) {
      if (char === '\\' && index + 1 < line.length) {
        const next = line[index + 1];
        if (next === quote || next === '\\') {
          value += next;
          index += 1;
          continue;
        }
        value += char;
        continue;
      }
      if (
        char === quote &&
        (quoteMode !== 'data' || isDataClosingQuote(index))
      ) {
        quote = '';
        quoteMode = '';
        continue;
      }
      value += char;
      continue;
    }

    if (char === '"' || char === "'") {
      if (!value || /^[A-Za-z][A-Za-z0-9-]*=$/.test(value)) {
        quote = char;
        quoteMode = value === 'data=' ? 'data' : 'delimiter';
        delimited = true;
      } else {
        value += char;
      }
      continue;
    }

    if (/\s/.test(char)) {
      push();
      continue;
    }

    value += char;
  }

  if (quote) {
    return {tokens, error: '引号没有闭合'};
  }

  push();
  return {tokens, error: ''};
}

function countCaptureGroups(pattern) {
  let count = 0;
  let escaped = false;
  let inCharacterClass = false;

  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '[') {
      inCharacterClass = true;
      continue;
    }
    if (char === ']' && inCharacterClass) {
      inCharacterClass = false;
      continue;
    }
    if (char !== '(' || inCharacterClass) {
      continue;
    }

    if (pattern[index + 1] !== '?') {
      count += 1;
      continue;
    }

    if (
      pattern[index + 2] === '<' &&
      pattern[index + 3] !== '=' &&
      pattern[index + 3] !== '!'
    ) {
      count += 1;
    }
  }

  return count;
}

function replaceUrlCaptures(value, captureName, captureCount) {
  const references = [...String(value).matchAll(/\$(\d+)/g)].map(
    (match) => Number(match[1]),
  );
  const invalid = references.find((index) => index > captureCount);
  if (invalid !== undefined) {
    return {
      value,
      error: `URL 正则只有 ${captureCount} 个捕获组，不能引用 $${invalid}`,
    };
  }
  return {
    value: String(value).replace(
      /\$(\d+)/g,
      (_, index) => `\${${captureName}.${index}}`,
    ),
    error: '',
  };
}

function formatJsonValue(token) {
  const value = decodeLegacyText(token.value);
  if (token.quoted) {
    return quoteString(value);
  }
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) {
    return value;
  }
  if (value === 'true' || value === 'false' || value === 'null') {
    return value;
  }
  if (/^\$\{[A-Za-z_][A-Za-z0-9_]*(?:\.\d+)?\}$/.test(value)) {
    return value;
  }
  if (
    (value.startsWith('{') && value.endsWith('}')) ||
    (value.startsWith('[') && value.endsWith(']'))
  ) {
    try {
      JSON.parse(value);
      return rawString(value);
    } catch {
      return quoteString(value);
    }
  }
  return quoteString(value);
}

function requireArguments(args, count, action) {
  if (args.length < count) {
    return `${action} 参数不足`;
  }
  return '';
}

function requireMultiple(args, size, action) {
  if (!args.length || args.length % size !== 0) {
    return `${action} 需要按每 ${size} 个参数一组填写`;
  }
  return '';
}

function batchAction(method, columns) {
  const params =
    columns[0].length === 1
      ? columns.map((column) => column[0])
      : columns.map((column) => `[${column.join(', ')}]`);
  return [`${method}(${params.join(', ')})`];
}

function pairActions(args, method, valueFormatter = (token) =>
  quoteString(decodeLegacyText(token.value))) {
  const names = [];
  const values = [];
  for (let index = 0; index < args.length; index += 2) {
    names.push(quoteString(decodeLegacyText(args[index].value)));
    values.push(valueFormatter(args[index + 1]));
  }
  return batchAction(method, [names, values]);
}

function tripleActions(args, method) {
  const names = [];
  const patterns = [];
  const replacements = [];
  for (let index = 0; index < args.length; index += 3) {
    names.push(quoteString(decodeLegacyText(args[index].value)));
    patterns.push(regexLiteral(args[index + 1].value));
    replacements.push(
      quoteString(decodeLegacyText(args[index + 2].value)),
    );
  }
  return batchAction(method, [names, patterns, replacements]);
}

function parseMockArguments(args) {
  const values = {};
  const allowedKeys = new Set([
    'data-type',
    'data',
    'data-path',
    'mock-data-is-base64',
    'status-code',
  ]);
  for (const token of args) {
    const separator = token.value.indexOf('=');
    if (separator <= 0) {
      return {values, error: `无法识别 Mock 参数 ${token.value}`};
    }
    const key = token.value.slice(0, separator);
    const value = token.value.slice(separator + 1);
    if (!allowedKeys.has(key)) {
      return {values, error: `无法识别 Mock 参数 ${key}`};
    }
    values[key] = decodeLegacyText(value);
  }

  if (!values['data-type']) {
    return {values, error: 'Mock 缺少 data-type'};
  }
  if (values.data !== undefined && values['data-path'] !== undefined) {
    return {values, error: 'Mock 的 data 和 data-path 不能同时存在'};
  }
  if (values.data === undefined && values['data-path'] === undefined) {
    return {values, error: 'Mock 缺少 data 或 data-path'};
  }
  if (
    values['mock-data-is-base64'] !== undefined &&
    values['mock-data-is-base64'] !== 'true' &&
    values['mock-data-is-base64'] !== 'false'
  ) {
    return {
      values,
      error: 'mock-data-is-base64 只能是 true 或 false',
    };
  }

  return {values, error: ''};
}

function convertLegacyAction(action, args) {
  if (
    [
      'reject',
      'reject-200',
      'reject-img',
      'reject-dict',
      'reject-array',
      'reject-video',
    ].includes(action) &&
    args.length
  ) {
    return {error: `${action} 不接受参数`};
  }
  if (action === 'reject') {
    return {phase: 'request', actions: ['reject(404)']};
  }
  if (action === 'reject-200') {
    return {phase: 'request', actions: ['reject(200)']};
  }
  if (action === 'reject-img') {
    return {phase: 'request', actions: ['reject_img(200)']};
  }
  if (action === 'reject-dict') {
    return {phase: 'request', actions: ['reject_dict(200)']};
  }
  if (action === 'reject-array') {
    return {phase: 'request', actions: ['reject_array(200)']};
  }
  if (action === 'reject-video') {
    return {phase: 'request', actions: ['reject_video(200)']};
  }

  const headerMethods = {
    'header-add': ['request', 'request.header.add'],
    'header-replace': ['request', 'request.header.set'],
    'response-header-add': ['response', 'response.header.add'],
    'response-header-replace': ['response', 'response.header.set'],
  };
  if (headerMethods[action]) {
    const error = requireMultiple(args, 2, action);
    if (error) {
      return {error};
    }
    const [phase, method] = headerMethods[action];
    return {phase, actions: pairActions(args, method)};
  }

  const headerDeleteMethods = {
    'header-del': ['request', 'request.header.del'],
    'response-header-del': ['response', 'response.header.del'],
  };
  if (headerDeleteMethods[action]) {
    const error = requireArguments(args, 1, action);
    if (error) {
      return {error};
    }
    const [phase, method] = headerDeleteMethods[action];
    return {
      phase,
      actions: batchAction(method, [
        args.map((token) =>
          quoteString(decodeLegacyText(token.value)),
        ),
      ]),
    };
  }

  const headerRegexMethods = {
    'header-replace-regex': ['request', 'request.header.replace'],
    'response-header-replace-regex': [
      'response',
      'response.header.replace',
    ],
  };
  if (headerRegexMethods[action]) {
    const error = requireMultiple(args, 3, action);
    if (error) {
      return {error};
    }
    const [phase, method] = headerRegexMethods[action];
    return {phase, actions: tripleActions(args, method)};
  }

  const bodyRegexMethods = {
    'request-body-replace-regex': ['request', 'request.body.replace'],
    'response-body-replace-regex': [
      'response',
      'response.body.replace',
    ],
  };
  if (bodyRegexMethods[action]) {
    const error = requireMultiple(args, 2, action);
    if (error) {
      return {error};
    }
    const [phase, method] = bodyRegexMethods[action];
    const patterns = [];
    const replacements = [];
    for (let index = 0; index < args.length; index += 2) {
      patterns.push(regexLiteral(args[index].value));
      replacements.push(
        quoteString(decodeLegacyText(args[index + 1].value)),
      );
    }
    return {phase, actions: batchAction(method, [patterns, replacements])};
  }

  const jsonPairMethods = {
    'request-body-json-add': ['request', 'request.json.add'],
    'request-body-json-replace': ['request', 'request.json.replace'],
    'response-body-json-add': ['response', 'response.json.add'],
    'response-body-json-replace': ['response', 'response.json.replace'],
  };
  if (jsonPairMethods[action]) {
    const error = requireMultiple(args, 2, action);
    if (error) {
      return {error};
    }
    const [phase, method] = jsonPairMethods[action];
    return {
      phase,
      actions: pairActions(args, method, formatJsonValue),
    };
  }

  const jsonDeleteMethods = {
    'request-body-json-del': ['request', 'request.json.delete'],
    'response-body-json-del': ['response', 'response.json.delete'],
  };
  if (jsonDeleteMethods[action]) {
    const error = requireArguments(args, 1, action);
    if (error) {
      return {error};
    }
    const [phase, method] = jsonDeleteMethods[action];
    return {
      phase,
      actions: batchAction(method, [
        args.map((token) =>
          quoteString(decodeLegacyText(token.value)),
        ),
      ]),
    };
  }

  const jqMethods = {
    'request-body-json-jq': ['request', 'request.json.jq'],
    'response-body-json-jq': ['response', 'response.json.jq'],
  };
  if (jqMethods[action]) {
    const error = requireArguments(args, 1, action);
    if (error) {
      return {error};
    }
    const [phase, method] = jqMethods[action];
    const expression = args
      .map((token) => decodeLegacyText(token.value))
      .join(' ');
    return {phase, actions: [`${method}(${quoteString(expression)})`]};
  }

  if (action === 'mock-request-body' || action === 'mock-response-body') {
    const parsed = parseMockArguments(args);
    if (parsed.error) {
      return {error: parsed.error};
    }
    const values = parsed.values;
    const isResponse = action === 'mock-response-body';
    if (!isResponse && values['status-code'] !== undefined) {
      return {error: 'mock-request-body 不支持 status-code'};
    }
    const sourceIsFile = values['data-path'] !== undefined;
    const method = `${isResponse ? 'response' : 'request'}.body.mock${
      sourceIsFile ? '_file' : ''
    }`;
    const source = sourceIsFile ? values['data-path'] : values.data;
    const params = [
      quoteString(values['data-type']),
      quoteString(source),
    ];
    if (isResponse) {
      const status = values['status-code'] || '200';
      if (
        !/^\d+$/.test(status) ||
        Number(status) < 100 ||
        Number(status) > 599
      ) {
        return {error: 'Mock 响应状态码必须是 100 到 599 的整数'};
      }
      params.push(status);
    }
    if (values['mock-data-is-base64'] === 'true') {
      params.push('true');
    }
    return {
      phase: isResponse ? 'response' : 'request',
      actions: [`${method}(${params.join(', ')})`],
    };
  }

  return {error: `暂不支持旧 Action：${action}`};
}

function chooseCaptureName(argumentNames) {
  let suffix = 1;
  let name = 'urlMatch';
  while (argumentNames.has(name)) {
    suffix += 1;
    name = `urlMatch${suffix}`;
  }
  return name;
}

function convertLegacyLine(line, lineNumber, captureName) {
  const leading = line.match(/^\s*/)?.[0] || '';
  const trimmed = line.trim();
  const tokenized = tokenizeLegacyLine(trimmed);
  if (tokenized.error) {
    return {
      line,
      issue: {line: lineNumber, level: 'error', message: tokenized.error},
    };
  }

  const tokens = tokenized.tokens;
  if (tokens.length < 2) {
    return {
      line,
      issue: {
        line: lineNumber,
        level: 'warning',
        message: '无法识别旧 Rewrite 的 URL 正则和 Action，已保留原文',
      },
    };
  }

  const pattern = tokens[0].value;
  const action = tokens[1].value;
  const args = tokens.slice(2);
  if (!LEGACY_ACTIONS.has(action)) {
    return {
      line,
      issue: {
        line: lineNumber,
        level: 'warning',
        message: `无法识别旧 Action：${action}，已保留原文`,
      },
    };
  }

  if (action === 'header' || action === '302' || action === '307') {
    const error = requireArguments(args, 1, action);
    if (error) {
      return {
        line,
        issue: {line: lineNumber, level: 'error', message: error},
      };
    }
    const replacement = decodeLegacyText(
      args.map((token) => token.value).join(' '),
    );
    const convertedCapture = replaceUrlCaptures(
      replacement,
      captureName,
      countCaptureGroups(pattern),
    );
    if (convertedCapture.error) {
      return {
        line,
        issue: {
          line: lineNumber,
          level: 'error',
          message: convertedCapture.error,
        },
      };
    }
    const hasCapture = convertedCapture.value !== replacement;
    const condition = `\${url} ~= ${regexLiteral(pattern, 'i')}${
      hasCapture ? ` as ${captureName}` : ''
    }`;
    const method =
      action === 'header'
        ? 'url.replace'
        : `redirect(${action}, ${quoteString(convertedCapture.value)})`;
    const actionText =
      action === 'header'
        ? `url.replace(${quoteString(convertedCapture.value)})`
        : method;
    return {
      line: `${leading}request if ${condition} then ${actionText}`,
      converted: true,
    };
  }

  const converted = convertLegacyAction(action, args);
  if (converted.error) {
    return {
      line,
      issue: {
        line: lineNumber,
        level: 'error',
        message: `${converted.error}，已保留原文`,
      },
    };
  }

  return {
    line: `${leading}${converted.phase} if \${url} ~= ${regexLiteral(
      pattern,
      'i',
    )} then ${converted.actions.join(' | ')}`,
    converted: true,
  };
}

function collectArgumentNames(lines) {
  const names = new Set();
  let inArgumentSection = false;
  for (const line of lines) {
    const section = line.match(/^\s*\[([^\]]+)\]\s*$/);
    if (section) {
      inArgumentSection = section[1].toLowerCase() === 'argument';
      continue;
    }
    if (!inArgumentSection) {
      continue;
    }
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (match) {
      names.add(match[1]);
    }
  }
  return names;
}

export function convertLegacyRewrite(
  source,
  {includeSection = true} = {},
) {
  const input = String(source ?? '');
  if (!input.trim()) {
    return {
      output: '',
      issues: [],
      stats: {converted: 0, unchanged: 0, failed: 0},
    };
  }

  const lines = input.split(/\r?\n/);
  const hasSections = lines.some((line) =>
    /^\s*\[[^\]]+\]\s*$/.test(line),
  );
  const argumentNames = collectArgumentNames(lines);
  const captureName = chooseCaptureName(argumentNames);
  const issues = [];
  const outputLines = [];
  const stats = {converted: 0, unchanged: 0, failed: 0};
  let inRewriteSection = !hasSections;

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();
    const section = trimmed.match(/^\[([^\]]+)\]$/);
    if (section) {
      inRewriteSection = section[1].toLowerCase() === 'rewrite';
      outputLines.push(line);
      return;
    }

    if (
      !inRewriteSection ||
      !trimmed ||
      trimmed.startsWith('#') ||
      trimmed.startsWith(';')
    ) {
      outputLines.push(line);
      return;
    }

    if (/^(request|response)\s+if\s+/.test(trimmed)) {
      outputLines.push(line);
      stats.unchanged += 1;
      return;
    }

    const converted = convertLegacyLine(line, lineNumber, captureName);
    outputLines.push(converted.line);
    if (converted.converted) {
      stats.converted += 1;
    } else {
      stats.failed += 1;
    }
    if (converted.issue) {
      issues.push(converted.issue);
    }
  });

  if (!hasSections && includeSection) {
    outputLines.unshift('[Rewrite]');
  }

  return {
    output: outputLines.join('\n'),
    issues,
    stats,
  };
}

export const LEGACY_REWRITE_EXAMPLE = `[Rewrite]
# URL 替换与重定向
^https:\\/\\/old\\.example\\.com\\/(.*)$ header https://new.example.com/$1
^http:\\/\\/example\\.com 302 https://example.com

# 请求 Header
^https:\\/\\/api\\.example\\.com header-add X-Loon true
^https:\\/\\/api\\.example\\.com header-del Cookie
^https:\\/\\/api\\.example\\.com header-replace-regex User-Agent iPhone\\x20OS\\x20(\\d+) iPhone\\x20OS\\x20$1

# JSON 与 Mock
^https:\\/\\/api\\.example\\.com request-body-json-add data.enabled true
^https:\\/\\/api\\.example\\.com response-body-json-del data.ads
^https:\\/\\/api\\.example\\.com mock-response-body data-type=json data-path=response_body.json status-code=200`;
