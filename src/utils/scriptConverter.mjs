const LEGACY_TYPES = new Set([
  'http-request',
  'http-response',
  'cron',
  'network-changed',
  'generic',
]);

const OPTION_ALIASES = {
  enable: 'enable',
  enabled: 'enable',
  tag: 'tag',
  'img-url': 'img_url',
  img_url: 'img_url',
  timeout: 'timeout',
  debug: 'debug',
  'requires-body': 'requires_body',
  requires_body: 'requires_body',
  'binary-body-mode': 'binary_body_mode',
  binary_body_mode: 'binary_body_mode',
};

const OPTION_ORDER = [
  'enable',
  'tag',
  'img_url',
  'timeout',
  'debug',
  'requires_body',
  'binary_body_mode',
];

const BOOLEAN_OPTIONS = new Set([
  'enable',
  'debug',
  'requires_body',
  'binary_body_mode',
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

function decodeLegacyText(value) {
  return String(value).replace(/\\x20/gi, ' ');
}

function unwrapQuoted(value) {
  const trimmed = value.trim();
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    const quote = trimmed[0];
    const body = trimmed.slice(1, -1);
    return body.replace(new RegExp(`\\\\${quote}`, 'g'), quote);
  }
  return trimmed;
}

function regexLiteral(pattern) {
  const escaped = String(pattern).replace(/(^|[^\\])\//g, '$1\\/');
  return `/${escaped}/i`;
}

function splitTopLevel(value, separator = ',') {
  const parts = [];
  let start = 0;
  let quote = '';
  let escaped = false;
  let braces = 0;
  let brackets = 0;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (quote) {
      if (char === quote) {
        quote = '';
      }
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') {
      braces += 1;
      continue;
    }
    if (char === '}') {
      braces -= 1;
      continue;
    }
    if (char === '[') {
      brackets += 1;
      continue;
    }
    if (char === ']') {
      brackets -= 1;
      continue;
    }
    if (char === separator && braces === 0 && brackets === 0) {
      parts.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }

  if (quote || braces !== 0 || brackets !== 0) {
    return {parts: [], error: '引号、花括号或方括号没有闭合'};
  }
  parts.push(value.slice(start).trim());
  return {parts: parts.filter(Boolean), error: ''};
}

function takeQuotedPrefix(value) {
  const trimmed = value.trimStart();
  if (!trimmed.startsWith('"') && !trimmed.startsWith("'")) {
    return null;
  }
  const quote = trimmed[0];
  let escaped = false;
  for (let index = 1; index < trimmed.length; index += 1) {
    const char = trimmed[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === quote) {
      return {
        value: trimmed.slice(0, index + 1),
        rest: trimmed.slice(index + 1).trim(),
      };
    }
  }
  return {error: 'Cron 表达式的引号没有闭合'};
}

function takeToken(value) {
  const match = value.trim().match(/^(\S+)(?:\s+([\s\S]*))?$/);
  return match ? {value: match[1], rest: match[2] || ''} : null;
}

function parseOptions(value) {
  const split = splitTopLevel(value);
  if (split.error) {
    return {options: {}, error: split.error};
  }
  const options = {};
  for (const part of split.parts) {
    const separator = part.indexOf('=');
    if (separator <= 0) {
      return {options, error: `无法识别参数：${part}`};
    }
    const key = part.slice(0, separator).trim();
    const valueText = part.slice(separator + 1).trim();
    if (!key || (!valueText && key !== 'argument')) {
      return {options, error: `参数 ${key || part} 缺少值`};
    }
    if (options[key] !== undefined) {
      if (options[key] === valueText) {
        continue;
      }
      return {options, error: `参数 ${key} 重复`};
    }
    options[key] = valueText;
  }
  return {options, error: ''};
}

function pluginVariable(value) {
  const trimmed = value.trim();
  const match = trimmed.match(/^\{([A-Za-z_][A-Za-z0-9_.]*)\}$/);
  return match ? `\${${match[1]}}` : '';
}

function formatArgument(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('`') && trimmed.endsWith('`')) {
    return {value: trimmed, error: ''};
  }
  let names = null;
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const split = splitTopLevel(trimmed.slice(1, -1));
    if (split.error) {
      return {value: '', error: split.error};
    }
    names = split.parts.map((item) => {
      const match = item.match(/^\{\s*([A-Za-z_][A-Za-z0-9_.]*)\s*\}$/);
      return match?.[1] || '';
    });
  } else if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    names = trimmed
      .slice(1, -1)
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
  }
  if (names) {
    if (!names.length) {
      return {value: '', error: 'argument 插件参数对象不能为空'};
    }
    if (names.some((name) => !/^[A-Za-z_][A-Za-z0-9_.]*$/.test(name))) {
      return {value: '', error: 'argument 包含无效的插件参数名'};
    }
    if (new Set(names).size !== names.length) {
      return {value: '', error: 'argument 中的插件参数不能重复'};
    }
    return {
      value: `{${names.map((name) => `\${${name}}`).join(', ')}}`,
      error: '',
    };
  }
  return {
    value: quoteString(decodeLegacyText(unwrapQuoted(trimmed))),
    error: '',
  };
}

function formatOption(name, value, isHttp) {
  if ((name === 'requires_body' || name === 'binary_body_mode') && !isHttp) {
    return {value: '', error: `${name} 只能用于 HTTP Script`};
  }
  if (BOOLEAN_OPTIONS.has(name)) {
    const variable = pluginVariable(value);
    if (variable) {
      if (name !== 'enable') {
        return {value: '', error: `${name} 不支持插件变量`};
      }
      return {value: variable, error: ''};
    }
    if (value !== 'true' && value !== 'false') {
      return {value: '', error: `${name} 必须是 true 或 false`};
    }
    return {value, error: ''};
  }
  if (name === 'timeout') {
    if (!/^\d+(?:\.\d+)?$/.test(value) || Number(value) <= 0) {
      return {value: '', error: 'timeout 必须是大于 0 的数字'};
    }
    return {value, error: ''};
  }
  return {
    value: quoteString(decodeLegacyText(unwrapQuoted(value))),
    error: '',
  };
}

function convertLegacyLine(trimmed) {
  const typeToken = takeToken(trimmed);
  if (!typeToken || !LEGACY_TYPES.has(typeToken.value)) {
    return {error: '无法识别旧 Script 类型'};
  }
  const type = typeToken.value;
  let rest = typeToken.rest;
  let trigger = '';

  if (type === 'http-request' || type === 'http-response') {
    const token = takeToken(rest);
    if (!token) {
      return {error: `${type} 缺少 URL 正则`};
    }
    trigger = `${type === 'http-request' ? 'request' : 'response'} if \${url} ~= ${regexLiteral(token.value)}`;
    rest = token.rest;
  } else if (type === 'cron') {
    const quoted = takeQuotedPrefix(rest);
    if (quoted?.error) {
      return {error: quoted.error};
    }
    if (quoted) {
      trigger = `cron ${quoteString(decodeLegacyText(unwrapQuoted(quoted.value)))}`;
      rest = quoted.rest;
    } else {
      const token = takeToken(rest);
      if (!token) {
        return {error: 'cron 缺少 Cron 表达式'};
      }
      const variable = pluginVariable(token.value);
      if (!variable) {
        return {error: 'Cron 表达式必须使用字符串或插件参数'};
      }
      trigger = `cron ${variable}`;
      rest = token.rest;
    }
  } else {
    trigger = type;
  }

  const parsed = parseOptions(rest);
  if (parsed.error) {
    return {error: parsed.error};
  }
  const options = parsed.options;
  if (!options['script-path']) {
    return {error: '缺少 script-path'};
  }

  const path = decodeLegacyText(unwrapQuoted(options['script-path']));
  if (!path) {
    return {error: 'script-path 不能为空'};
  }
  delete options['script-path'];

  let argument = '';
  if (options.argument !== undefined) {
    if (options.argument) {
      const formatted = formatArgument(options.argument);
      if (formatted.error) {
        return {error: formatted.error};
      }
      argument = `, ${formatted.value}`;
    }
    delete options.argument;
  }

  const normalized = {};
  for (const [legacyName, value] of Object.entries(options)) {
    const name = OPTION_ALIASES[legacyName];
    if (!name) {
      return {error: `无法识别旧参数：${legacyName}`};
    }
    if (normalized[name] !== undefined) {
      return {error: `参数 ${name} 重复`};
    }
    const formatted = formatOption(
      name,
      value,
      type === 'http-request' || type === 'http-response',
    );
    if (formatted.error) {
      return {error: formatted.error};
    }
    normalized[name] = formatted.value;
  }

  const withOptions = OPTION_ORDER.filter(
    (name) => normalized[name] !== undefined,
  ).map((name) => `${name}=${normalized[name]}`);
  return {
    line: `${trigger} then script(${quoteString(path)}${argument})${
      withOptions.length ? ` with ${withOptions.join(', ')}` : ''
    }`,
    error: '',
  };
}

function isNewSyntax(line) {
  return (
    /^(?:request|response)\s+if\b/.test(line) ||
    /^cron\b[\s\S]*\bthen\s+script\s*\(/.test(line) ||
    /^(?:network-changed|generic)\s+then\s+script\s*\(/.test(line)
  );
}

export function convertLegacyScript(source, {includeSection = true} = {}) {
  const lines = String(source).replace(/\r\n?/g, '\n').split('\n');
  const issues = [];
  const stats = {converted: 0, unchanged: 0, failed: 0};
  let hasScriptSection = false;
  let inScriptSection = false;

  const output = lines.map((line, index) => {
    const trimmed = line.trim();
    const section = trimmed.match(/^\[([^\]]+)\]$/);
    if (section) {
      inScriptSection = section[1].toLowerCase() === 'script';
      hasScriptSection ||= inScriptSection;
      stats.unchanged += 1;
      return line;
    }
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) {
      stats.unchanged += 1;
      return line;
    }
    if (hasScriptSection && !inScriptSection) {
      stats.unchanged += 1;
      return line;
    }
    if (isNewSyntax(trimmed)) {
      stats.unchanged += 1;
      return line;
    }
    const first = trimmed.split(/\s+/, 1)[0];
    if (!LEGACY_TYPES.has(first)) {
      stats.unchanged += 1;
      return line;
    }

    const converted = convertLegacyLine(trimmed);
    if (converted.error) {
      stats.failed += 1;
      issues.push({
        line: index + 1,
        level: 'error',
        message: `${converted.error}，已保留原文`,
      });
      return line;
    }
    stats.converted += 1;
    const leading = line.match(/^\s*/)?.[0] || '';
    return `${leading}${converted.line}`;
  });

  if (includeSection && !hasScriptSection && String(source).trim()) {
    output.unshift('[Script]');
  }

  return {output: output.join('\n'), issues, stats};
}

export const LEGACY_SCRIPT_EXAMPLE = `[Script]
# Request Script
http-request ^https?:\\/\\/api\\.example\\.com script-path=request.js, requires-body=true, argument="mode=preview", timeout=20, tag=Request

# Response Script with plugin arguments
http-response ^https?:\\/\\/api\\.example\\.com script-path=response.js, argument={region,level}, enabled={enabled}, requires-body=true, binary-body-mode=true, tag=Response

# Other triggers
cron "0 8 * * *" script-path=cron.js, argument="daily", timeout=300, tag=Daily
network-changed script-path=network.js, argument={region}, tag=Network
generic script-path=tool.js, argument="manual", img-url=tool.system, tag=Tool`;
