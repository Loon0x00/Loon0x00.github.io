import React, {useMemo, useRef, useState} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './rewrite-builder.module.css';

const EN_TEXT = {
  '请求阶段': 'Request',
  '请求发出前': 'Before the request is sent',
  '响应阶段': 'Response',
  '收到响应 Header 后': 'After response headers arrive',
  '请求方法': 'Request method',
  '请求 Header': 'Request headers',
  '响应状态码': 'Response status',
  '响应 Header': 'Response headers',
  '插件参数': 'Plugin argument',
  '请求控制': 'Request control',
  '请求 Body / JSON': 'Request body / JSON',
  '响应 Body / JSON': 'Response body / JSON',
  '替换 URL': 'Replace URL',
  '返回重定向': 'Return redirect',
  '拒绝请求': 'Reject request',
  '添加请求 Header': 'Add request header',
  '设置请求 Header': 'Set request header',
  '删除请求 Header': 'Delete request header',
  '正则替换请求 Header': 'Replace request header with regex',
  '添加响应 Header': 'Add response header',
  '设置响应 Header': 'Set response header',
  '删除响应 Header': 'Delete response header',
  '正则替换响应 Header': 'Replace response header with regex',
  '正则替换请求 Body': 'Replace request body with regex',
  '正则替换响应 Body': 'Replace response body with regex',
  '添加请求 JSON 字段': 'Add request JSON field',
  '删除请求 JSON 字段': 'Delete request JSON field',
  '替换请求 JSON 字段': 'Replace request JSON field',
  '添加响应 JSON 字段': 'Add response JSON field',
  '删除响应 JSON 字段': 'Delete response JSON field',
  '替换响应 JSON 字段': 'Replace response JSON field',
  '使用 jq 修改请求 JSON': 'Modify request JSON with jq',
  '使用 jq 修改响应 JSON': 'Modify response JSON with jq',
  'Mock 请求 Body': 'Mock request body',
  'Mock 响应 Body': 'Mock response body',
  '404 · 空 Body': '404 · Empty body',
  '200 · 空 Body': '200 · Empty body',
  '200 · JSON 对象 {}': '200 · JSON object {}',
  '200 · JSON 数组 []': '200 · JSON array []',
  '200 · 空白视频': '200 · Blank video',
  '请求 Header 清理': 'Clean request headers',
  '修改 JSON 响应': 'Modify a JSON response',
  'Mock JSON 响应': 'Mock a JSON response',
  '条件关系': 'Condition relationship',
  '正则 flags': 'Regular expression flags',
  '匹配值': 'Match value',
  '正则': 'Regular expression',
  '正则内容': 'Regular expression',
  '参数名': 'Argument name',
  '值类型': 'Value type',
  '字符串': 'String',
  '数字': 'Number',
  '布尔值': 'Boolean',
  '比较值': 'Comparison value',
  '输入比较值': 'Enter a comparison value',
  '字段': 'Field',
  'Header 名称': 'Header name',
  '操作符': 'Operator',
  '等于 ==': 'Equals ==',
  '正则匹配 ~=': 'Regex match ~=',
  '保存捕获（可选）': 'Save capture (optional)',
  '例如 item': 'For example, item',
  '删除条件': 'Delete condition',
  '匹配逻辑': 'Match logic',
  '所有条件都满足时执行': 'Run when all conditions match',
  '任一条件满足时执行': 'Run when any condition matches',
  '删除条件组': 'Delete condition group',
  '添加条件': 'Add condition',
  '添加条件组': 'Add condition group',
  '已达到 4 层嵌套上限': 'Maximum nesting depth of 4 reached',
  '输入正则，不含两侧 /': 'Enter the pattern without surrounding /',
  '插件参数 / 捕获': 'Plugin argument / capture',
  '原始字符串': 'Raw string',
  '变量名': 'Variable name',
  '原始内容': 'Raw content',
  '值': 'Value',
  '输入值': 'Enter a value',
  'price 或 item.1': 'price or item.1',
  'URL 替换正则': 'URL replacement pattern',
  '替换内容': 'Replacement',
  '状态码': 'Status code',
  '响应类型': 'Response type',
  'Header 值': 'Header value',
  '支持 ${...}': 'Supports ${...}',
  '允许留空': 'May be empty',
  '来源': 'Source',
  'jq 表达式': 'jq expression',
  '插件文件': 'Plugin file',
  '文件名': 'Filename',
  'Body 类型': 'Body type',
  '数据来源': 'Data source',
  '直接填写': 'Inline data',
  'Body 内容': 'Body content',
  '使用反引号原始字符串': 'Use a backtick-delimited raw string',
  '数据为 Base64': 'Data is Base64 encoded',
  '删除 Action': 'Delete action',
  '至少需要一个 Action': 'At least one action is required',
  'redirect 需要一个必选的 URL 正则条件':
    'redirect requires one mandatory URL regex condition',
  'redirect 只能对应一个必选的 URL 正则条件':
    'redirect can use only one mandatory URL regex condition',
  'Header 名称不能为空': 'Header name cannot be empty',
  '插件参数名格式不正确': 'Plugin argument name is invalid',
  '正则内容不能为空': 'Regular expression cannot be empty',
  '右侧变量名格式不正确': 'The variable name on the right is invalid',
  '数字值格式不正确': 'Number format is invalid',
  '捕获名称格式不正确': 'Capture name is invalid',
  '条件组不能为空': 'A condition group cannot be empty',
  'JSON 数字值格式不正确': 'JSON number format is invalid',
  'JSON 变量名格式不正确': 'JSON variable name is invalid',
  'URL 替换正则不能为空': 'URL replacement pattern cannot be empty',
  'URL 替换内容不能为空': 'URL replacement cannot be empty',
  '重定向地址不能为空': 'Redirect location cannot be empty',
  'Header 值不能为空': 'Header value cannot be empty',
  '替换正则不能为空': 'Replacement pattern cannot be empty',
  'JSON Key Path 不能为空': 'JSON key path cannot be empty',
  'jq 文件名不能为空': 'jq filename cannot be empty',
  'jq 表达式不能为空': 'jq expression cannot be empty',
  'Mock 文件名不能为空': 'Mock filename cannot be empty',
  'Mock 响应状态码格式不正确': 'Mock response status is invalid',
  'Rewrite 配置生成器': 'Rewrite Builder',
  '通过可视化条件与 Action 组合生成 Loon Rewrite 新语法配置':
    'Build Loon Rewrite configurations by combining visual conditions and actions',
  '像搭积木一样组合匹配条件与 Action，实时生成可复制的新 Rewrite 语法。':
    'Combine conditions and actions visually, then copy the generated Rewrite syntax.',
  '查看语法文档 →': 'Read the syntax guide →',
  '仅在浏览器本地生成，不会上传配置':
    'Generated locally in your browser; no configuration is uploaded',
  '加载示例': 'Load example',
  '设置匹配条件': 'Set match conditions',
  '选择 Loon 内置变量或插件参数，并组合 AND / OR。':
    'Choose built-in variables or plugin arguments and combine them with AND / OR.',
  '添加执行动作': 'Add actions',
  '多个 Action 会按从上到下的顺序依次执行。':
    'Multiple actions run from top to bottom.',
  '添加 Action': 'Add action',
  '生成结果': 'Generated configuration',
  '语法就绪': 'Syntax ready',
  '条件': 'Conditions',
  '条件组': 'Groups',
  '包含 `[Rewrite]` 段落标题': 'Include the `[Rewrite]` section heading',
  '请完善以下内容': 'Complete the following items',
  '已复制到剪贴板': 'Copied to clipboard',
  '复制配置': 'Copy configuration',
  '生成器不会执行 Rewrite；复制后请在 Loon 中加载配置并检查运行日志。':
    'The builder does not run Rewrite. Load the copied configuration in Loon and check the runtime log.',
};

function translateBuilderText(text, isEnglish) {
  if (!isEnglish || typeof text !== 'string') {
    return text;
  }
  if (EN_TEXT[text]) {
    return EN_TEXT[text];
  }

  let match = text.match(/^条件组 · (\d+) 项$/);
  if (match) {
    return `Condition group · ${match[1]} items`;
  }
  match = text.match(/^捕获 (.+) 位于 OR 的可选分支中$/);
  if (match) {
    return `Capture ${match[1].replaceAll('、', ', ')} is inside an optional OR branch`;
  }
  match = text.match(/^捕获名称不能重复：(.+)$/);
  if (match) {
    return `Capture names must be unique: ${match[1].replaceAll('、', ', ')}`;
  }
  match = text.match(/^捕获名称不能与插件参数重名：(.+)$/);
  if (match) {
    return `Capture names cannot match plugin arguments: ${match[1].replaceAll('、', ', ')}`;
  }
  return text;
}

const BuilderLocaleContext = React.createContext(false);
const MAX_GROUP_DEPTH = 4;

function useBuilderText() {
  const isEnglish = React.useContext(BuilderLocaleContext);
  return (text) => translateBuilderText(text, isEnglish);
}

const PHASES = [
  {
    value: 'http-request',
    label: '请求阶段',
    hint: '请求发出前',
  },
  {
    value: 'http-response',
    label: '响应阶段',
    hint: '收到响应 Header 后',
  },
];

const CONDITION_FIELDS = [
  {value: 'url', label: 'URL', phases: ['http-request', 'http-response']},
  {
    value: 'request.method',
    label: '请求方法',
    phases: ['http-request', 'http-response'],
  },
  {
    value: 'request.header',
    label: '请求 Header',
    phases: ['http-request', 'http-response'],
  },
  {
    value: 'response.status',
    label: '响应状态码',
    phases: ['http-response'],
  },
  {
    value: 'response.header',
    label: '响应 Header',
    phases: ['http-response'],
  },
  {
    value: 'plugin',
    label: '插件参数',
    phases: ['http-request', 'http-response'],
  },
];

const ACTION_GROUPS = [
  {
    label: '请求控制',
    actions: [
      'url.replace',
      'redirect',
      'reject',
      'response.body.mock',
    ],
  },
  {
    label: '请求 Header',
    actions: [
      'request.header.add',
      'request.header.set',
      'request.header.delete',
      'request.header.replace',
    ],
  },
  {
    label: '请求 Body / JSON',
    actions: [
      'request.body.replace',
      'request.json.add',
      'request.json.delete',
      'request.json.replace',
      'request.json.jq',
      'request.body.mock',
    ],
  },
  {
    label: '响应 Header',
    actions: [
      'response.header.add',
      'response.header.set',
      'response.header.delete',
      'response.header.replace',
    ],
  },
  {
    label: '响应 Body / JSON',
    actions: [
      'response.body.replace',
      'response.json.add',
      'response.json.delete',
      'response.json.replace',
      'response.json.jq',
    ],
  },
];

const ACTION_DEFINITIONS = {
  'url.replace': {
    label: '替换 URL',
    phase: 'http-request',
    defaults: {
      pattern: '^http:\\/\\/example[.]com',
      flags: '',
      replacement: 'https://example.com',
    },
  },
  redirect: {
    label: '返回重定向',
    phase: 'http-request',
    defaults: {
      status: '302',
      location: 'https://new.example.com',
    },
  },
  reject: {
    label: '拒绝请求',
    phase: 'http-request',
    defaults: {
      preset: '200|json-object',
    },
  },
  'request.header.add': {
    label: '添加请求 Header',
    phase: 'http-request',
    defaults: {name: 'X-Loon', value: 'true'},
  },
  'request.header.set': {
    label: '设置请求 Header',
    phase: 'http-request',
    defaults: {name: 'X-Loon', value: 'true'},
  },
  'request.header.delete': {
    label: '删除请求 Header',
    phase: 'http-request',
    defaults: {name: 'Cookie'},
  },
  'request.header.replace': {
    label: '正则替换请求 Header',
    phase: 'http-request',
    defaults: {
      name: 'User-Agent',
      pattern: 'iPhone OS \\d+',
      flags: '',
      replacement: 'iPhone OS 18',
    },
  },
  'response.header.add': {
    label: '添加响应 Header',
    phase: 'http-response',
    defaults: {name: 'X-Loon', value: 'true'},
  },
  'response.header.set': {
    label: '设置响应 Header',
    phase: 'http-response',
    defaults: {name: 'Cache-Control', value: 'no-cache'},
  },
  'response.header.delete': {
    label: '删除响应 Header',
    phase: 'http-response',
    defaults: {name: 'Set-Cookie'},
  },
  'response.header.replace': {
    label: '正则替换响应 Header',
    phase: 'http-response',
    defaults: {
      name: 'Content-Type',
      pattern: '; charset=.+$',
      flags: 'i',
      replacement: '',
    },
  },
  'request.body.replace': {
    label: '正则替换请求 Body',
    phase: 'http-request',
    defaults: {
      pattern: '"price":\\s*[0-9.]+',
      flags: '',
      replacement: '"price":9.99',
    },
  },
  'response.body.replace': {
    label: '正则替换响应 Body',
    phase: 'http-response',
    defaults: {
      pattern: '"enabled":\\s*false',
      flags: '',
      replacement: '"enabled":true',
    },
  },
  'request.json.add': {
    label: '添加请求 JSON 字段',
    phase: 'http-request',
    defaults: {
      path: 'data.price',
      valueType: 'number',
      value: '9.99',
    },
  },
  'request.json.delete': {
    label: '删除请求 JSON 字段',
    phase: 'http-request',
    defaults: {path: 'data.ads'},
  },
  'request.json.replace': {
    label: '替换请求 JSON 字段',
    phase: 'http-request',
    defaults: {
      path: 'data.price',
      valueType: 'variable',
      value: 'price',
    },
  },
  'response.json.add': {
    label: '添加响应 JSON 字段',
    phase: 'http-response',
    defaults: {
      path: 'data.rewritten',
      valueType: 'boolean',
      value: 'true',
    },
  },
  'response.json.delete': {
    label: '删除响应 JSON 字段',
    phase: 'http-response',
    defaults: {path: 'data.ads'},
  },
  'response.json.replace': {
    label: '替换响应 JSON 字段',
    phase: 'http-response',
    defaults: {
      path: 'data.vip',
      valueType: 'boolean',
      value: 'true',
    },
  },
  'request.json.jq': {
    label: '使用 jq 修改请求 JSON',
    phase: 'http-request',
    defaults: {
      source: 'filter',
      filter: '.data.ads = []',
      file: 'request-filter.jq',
    },
  },
  'response.json.jq': {
    label: '使用 jq 修改响应 JSON',
    phase: 'http-response',
    defaults: {
      source: 'filter',
      filter: '.data.ads = []',
      file: 'response-filter.jq',
    },
  },
  'request.body.mock': {
    label: 'Mock 请求 Body',
    phase: 'http-request',
    defaults: {
      type: 'json',
      source: 'data',
      data: '{"price":9.99}',
      file: 'request_body.json',
      raw: true,
      base64: false,
    },
  },
  'response.body.mock': {
    label: 'Mock 响应 Body',
    phase: 'http-request',
    defaults: {
      type: 'json',
      source: 'data',
      data: '{"code":0,"message":"ok"}',
      file: 'response_body.json',
      raw: true,
      base64: false,
      status: '200',
    },
  },
};

const BODY_TYPES = [
  'json',
  'text',
  'css',
  'html',
  'javascript',
  'plain',
  'png',
  'gif',
  'jpeg',
  'tiff',
  'svg',
  'mp4',
  'form-data',
];

const REJECT_PRESETS = [
  {value: '404|empty', label: '404 · 空 Body'},
  {value: '200|empty', label: '200 · 空 Body'},
  {value: '200|image', label: '200 · 1×1 GIF'},
  {value: '200|json-object', label: '200 · JSON 对象 {}'},
  {value: '200|json-array', label: '200 · JSON 数组 []'},
  {value: '200|video', label: '200 · 空白视频'},
];

const EXAMPLES = {
  request: {
    label: '请求 Header 清理',
    phase: 'http-request',
    conditions: {
      id: 'group-example-request',
      kind: 'group',
      logic: '&&',
      items: [
        {
          id: 'condition-example-request-1',
          kind: 'condition',
          field: 'url',
          operator: '~=',
          valueType: 'regex',
          value: '^https:\\/\\/api[.]example[.]com',
          flags: '',
          headerName: '',
          variableName: '',
          captureName: '',
        },
        {
          id: 'condition-example-request-2',
          kind: 'condition',
          field: 'request.method',
          operator: '==',
          valueType: 'string',
          value: 'POST',
          flags: '',
          headerName: '',
          variableName: '',
          captureName: '',
        },
      ],
    },
    actions: [
      {
        id: 'action-example-request-1',
        type: 'request.header.set',
        fields: {name: 'X-Loon', value: 'true'},
      },
      {
        id: 'action-example-request-2',
        type: 'request.header.delete',
        fields: {name: 'Cookie'},
      },
    ],
  },
  response: {
    label: '修改 JSON 响应',
    phase: 'http-response',
    conditions: {
      id: 'group-example-response',
      kind: 'group',
      logic: '&&',
      items: [
        {
          id: 'condition-example-response-1',
          kind: 'condition',
          field: 'url',
          operator: '~=',
          valueType: 'regex',
          value: '^https:\\/\\/api[.]example[.]com\\/profile$',
          flags: '',
          headerName: '',
          variableName: '',
          captureName: '',
        },
        {
          id: 'condition-example-response-2',
          kind: 'condition',
          field: 'response.status',
          operator: '==',
          valueType: 'number',
          value: '200',
          flags: '',
          headerName: '',
          variableName: '',
          captureName: '',
        },
        {
          id: 'condition-example-response-3',
          kind: 'condition',
          field: 'response.header',
          operator: '~=',
          valueType: 'regex',
          value: '^application\\/json(?:;|$)',
          flags: 'i',
          headerName: 'Content-Type',
          variableName: '',
          captureName: '',
        },
      ],
    },
    actions: [
      {
        id: 'action-example-response-1',
        type: 'response.json.replace',
        fields: {path: 'data.vip', valueType: 'boolean', value: 'true'},
      },
      {
        id: 'action-example-response-2',
        type: 'response.header.set',
        fields: {name: 'X-Rewritten', value: 'true'},
      },
    ],
  },
  mock: {
    label: 'Mock JSON 响应',
    phase: 'http-request',
    conditions: {
      id: 'group-example-mock',
      kind: 'group',
      logic: '&&',
      items: [
        {
          id: 'condition-example-mock-1',
          kind: 'condition',
          field: 'url',
          operator: '~=',
          valueType: 'regex',
          value: '^https:\\/\\/api[.]example[.]com\\/mock$',
          flags: '',
          headerName: '',
          variableName: '',
          captureName: '',
        },
      ],
    },
    actions: [
      {
        id: 'action-example-mock-1',
        type: 'response.body.mock',
        fields: {
          type: 'json',
          source: 'data',
          data: '{"code":0,"message":"ok"}',
          file: 'response_body.json',
          raw: true,
          base64: false,
          status: '200',
        },
      },
    ],
  },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createCondition(id, overrides = {}) {
  return {
    id,
    kind: 'condition',
    field: 'url',
    operator: '~=',
    valueType: 'regex',
    value: '^https:\\/\\/example[.]com',
    flags: '',
    headerName: '',
    variableName: '',
    captureName: '',
    ...overrides,
  };
}

function createGroup(id, conditionId) {
  return {
    id,
    kind: 'group',
    logic: '&&',
    items: [createCondition(conditionId)],
  };
}

function createAction(id, type) {
  return {
    id,
    type,
    fields: clone(ACTION_DEFINITIONS[type].defaults),
  };
}

function updateTree(node, id, updater) {
  if (node.id === id) {
    return updater(node);
  }
  if (node.kind !== 'group') {
    return node;
  }
  return {
    ...node,
    items: node.items.map((item) => updateTree(item, id, updater)),
  };
}

function removeFromTree(node, id) {
  if (node.kind !== 'group') {
    return node;
  }
  return {
    ...node,
    items: node.items
      .filter((item) => item.id !== id)
      .map((item) => removeFromTree(item, id)),
  };
}

function normalizeRequestTree(node) {
  if (node.kind === 'condition') {
    if (node.field.startsWith('response.')) {
      return createCondition(node.id);
    }
    return node;
  }
  return {
    ...node,
    items: node.items.map(normalizeRequestTree),
  };
}

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

function regexLiteral(value, flags = '') {
  const escaped = String(value).replace(/(^|[^\\])\//g, '$1\\/');
  const safeFlags = [...new Set(String(flags).split(''))]
    .filter((flag) => ['i', 'm', 's'].includes(flag))
    .join('');
  return `/${escaped}/${safeFlags}`;
}

function headerKey(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function variableRef(value) {
  return `\${${String(value).trim()}}`;
}

function conditionLeft(condition) {
  switch (condition.field) {
    case 'request.header':
      return `\${request.header['${headerKey(condition.headerName)}']}`;
    case 'response.header':
      return `\${response.header['${headerKey(condition.headerName)}']}`;
    case 'plugin':
      return variableRef(condition.variableName);
    default:
      return `\${${condition.field}}`;
  }
}

function typedValue(type, value, raw = false) {
  switch (type) {
    case 'number':
      return String(value).trim() || '0';
    case 'boolean':
      return value === 'false' ? 'false' : 'true';
    case 'null':
      return 'null';
    case 'variable':
      return variableRef(value);
    case 'raw':
      return rawString(value);
    case 'string':
    default:
      return raw ? rawString(value) : quoteString(value);
  }
}

function conditionText(condition) {
  const left = conditionLeft(condition);
  const right =
    condition.operator === '~='
      ? condition.valueType === 'variable'
        ? variableRef(condition.value)
        : regexLiteral(condition.value, condition.flags)
      : typedValue(condition.valueType, condition.value);
  const capture =
    condition.operator === '~=' && condition.captureName.trim()
      ? ` as ${condition.captureName.trim()}`
      : '';
  return `${left} ${condition.operator} ${right}${capture}`;
}

function groupText(group, nested = false) {
  const content = group.items
    .map((item) =>
      item.kind === 'group' ? groupText(item, true) : conditionText(item),
    )
    .join(` ${group.logic} `);
  if (!content) {
    return '';
  }
  return nested ? `(${content})` : content;
}

function actionText(action) {
  const {type, fields} = action;

  if (type === 'url.replace') {
    return `${type}(pattern=${regexLiteral(fields.pattern, fields.flags)}, replacement=${quoteString(fields.replacement)})`;
  }

  if (type === 'redirect') {
    return `${type}(status=${fields.status}, location=${quoteString(fields.location)})`;
  }

  if (type === 'reject') {
    const [status, body] = fields.preset.split('|');
    return `${type}(status=${status}, body=${quoteString(body)})`;
  }

  if (type.endsWith('.header.add') || type.endsWith('.header.set')) {
    return `${type}(name=${quoteString(fields.name)}, value=${quoteString(fields.value)})`;
  }

  if (type.endsWith('.header.delete')) {
    return `${type}(name=${quoteString(fields.name)})`;
  }

  if (type.endsWith('.header.replace')) {
    return `${type}(name=${quoteString(fields.name)}, pattern=${regexLiteral(fields.pattern, fields.flags)}, replacement=${quoteString(fields.replacement)})`;
  }

  if (type.endsWith('.body.replace')) {
    return `${type}(pattern=${regexLiteral(fields.pattern, fields.flags)}, replacement=${quoteString(fields.replacement)})`;
  }

  if (type.endsWith('.json.delete')) {
    return `${type}(path=${quoteString(fields.path)})`;
  }

  if (type.endsWith('.json.add') || type.endsWith('.json.replace')) {
    return `${type}(path=${quoteString(fields.path)}, value=${typedValue(fields.valueType, fields.value)})`;
  }

  if (type.endsWith('.json.jq')) {
    const key = fields.source === 'file' ? 'file' : 'filter';
    return `${type}(${key}=${quoteString(fields[key])})`;
  }

  if (type.endsWith('.body.mock')) {
    const sourceKey = fields.source === 'file' ? 'file' : 'data';
    const sourceValue =
      sourceKey === 'data' && fields.raw
        ? rawString(fields.data)
        : quoteString(fields[sourceKey]);
    const params = [
      `type=${quoteString(fields.type)}`,
      `${sourceKey}=${sourceValue}`,
    ];
    if (fields.base64) {
      params.push('base64=true');
    }
    if (type === 'response.body.mock') {
      params.push(`status=${fields.status || '200'}`);
    }
    return `${type}(${params.join(', ')})`;
  }

  return `${type}()`;
}

function isIdentifier(value) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(String(value).trim());
}

function isVariableExpression(value) {
  return /^[A-Za-z_][A-Za-z0-9_]*(?:\.\d+)?$/.test(
    String(value).trim(),
  );
}

function validateCondition(condition) {
  const issues = [];

  if (
    (condition.field === 'request.header' ||
      condition.field === 'response.header') &&
    !condition.headerName.trim()
  ) {
    issues.push('Header 名称不能为空');
  }

  if (
    condition.field === 'plugin' &&
    !isIdentifier(condition.variableName)
  ) {
    issues.push('插件参数名格式不正确');
  }

  if (
    condition.operator === '~=' &&
    condition.valueType === 'regex' &&
    !condition.value
  ) {
    issues.push('正则内容不能为空');
  }

  if (
    condition.valueType === 'variable' &&
    !isIdentifier(condition.value)
  ) {
    issues.push('右侧变量名格式不正确');
  }

  if (
    condition.operator === '==' &&
    condition.valueType === 'number' &&
    (String(condition.value).trim() === '' ||
      !Number.isFinite(Number(condition.value)))
  ) {
    issues.push('数字值格式不正确');
  }

  if (
    condition.captureName.trim() &&
    !isIdentifier(condition.captureName)
  ) {
    issues.push('捕获名称格式不正确');
  }

  return issues;
}

function validateGroup(group) {
  if (!group.items.length) {
    return ['条件组不能为空'];
  }
  return group.items.flatMap((item) =>
    item.kind === 'group' ? validateGroup(item) : validateCondition(item),
  );
}

function validateTypedValue(fields) {
  if (
    fields.valueType === 'number' &&
    (String(fields.value).trim() === '' ||
      !Number.isFinite(Number(fields.value)))
  ) {
    return ['JSON 数字值格式不正确'];
  }
  if (
    fields.valueType === 'variable' &&
    !isVariableExpression(fields.value)
  ) {
    return ['JSON 变量名格式不正确'];
  }
  return [];
}

function analyzeConditions(group, mandatory = true, result) {
  const analysis = result || {
    captures: [],
    pluginParameters: [],
    optionalCaptures: [],
    mandatoryUrlRegexCount: 0,
  };
  const childrenMandatory = mandatory && group.logic === '&&';

  group.items.forEach((item) => {
    if (item.kind === 'group') {
      analyzeConditions(item, childrenMandatory, analysis);
      return;
    }

    if (item.field === 'plugin' && item.variableName.trim()) {
      analysis.pluginParameters.push(item.variableName.trim());
    }

    if (item.captureName.trim()) {
      const captureName = item.captureName.trim();
      analysis.captures.push(captureName);
      if (!childrenMandatory) {
        analysis.optionalCaptures.push(captureName);
      }
    }

    if (
      childrenMandatory &&
      item.field === 'url' &&
      item.operator === '~='
    ) {
      analysis.mandatoryUrlRegexCount += 1;
    }
  });

  return analysis;
}

function validateAction(action) {
  const {type, fields} = action;
  const issues = [];

  if (type === 'url.replace' && !fields.pattern) {
    issues.push('URL 替换正则不能为空');
  }
  if (type === 'url.replace' && !fields.replacement) {
    issues.push('URL 替换内容不能为空');
  }
  if (type === 'redirect' && !fields.location) {
    issues.push('重定向地址不能为空');
  }

  if (type.includes('.header.') && !fields.name?.trim()) {
    issues.push('Header 名称不能为空');
  }
  if (
    (type.endsWith('.header.add') || type.endsWith('.header.set')) &&
    fields.value === undefined
  ) {
    issues.push('Header 值不能为空');
  }
  if (
    (type.endsWith('.header.replace') ||
      type.endsWith('.body.replace')) &&
    !fields.pattern
  ) {
    issues.push('替换正则不能为空');
  }

  if (type.includes('.json.') && !type.endsWith('.json.jq')) {
    if (!fields.path?.trim()) {
      issues.push('JSON Key Path 不能为空');
    }
    if (type.endsWith('.json.add') || type.endsWith('.json.replace')) {
      issues.push(...validateTypedValue(fields));
    }
  }

  if (type.endsWith('.json.jq')) {
    const value = fields.source === 'file' ? fields.file : fields.filter;
    if (!value?.trim()) {
      issues.push(
        fields.source === 'file' ? 'jq 文件名不能为空' : 'jq 表达式不能为空',
      );
    }
  }

  if (type.endsWith('.body.mock')) {
    const value = fields.source === 'file' ? fields.file : fields.data;
    if (fields.source === 'file' && !value?.trim()) {
      issues.push('Mock 文件名不能为空');
    }
    if (
      type === 'response.body.mock' &&
      (String(fields.status).trim() === '' ||
        !Number.isInteger(Number(fields.status)))
    ) {
      issues.push('Mock 响应状态码格式不正确');
    }
  }

  return issues;
}

function collectCounts(group) {
  return group.items.reduce(
    (counts, item) => {
      if (item.kind === 'condition') {
        counts.conditions += 1;
      } else {
        const nested = collectCounts(item);
        counts.conditions += nested.conditions;
        counts.groups += nested.groups + 1;
      }
      return counts;
    },
    {conditions: 0, groups: 0},
  );
}

function Icon({name}) {
  if (name === 'trash') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" />
      </svg>
    );
  }
  if (name === 'copy') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="8" y="8" width="11" height="11" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
      </svg>
    );
  }
  if (name === 'plus') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }
  if (name === 'folder') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      </svg>
    );
  }
  if (name === 'rule') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="6" cy="6" r="2" />
        <circle cx="18" cy="18" r="2" />
        <path d="M8 6h3a3 3 0 0 1 3 3v6a3 3 0 0 0 3 3M6 8v10h10" />
      </svg>
    );
  }
  return null;
}

function FieldShell({label, wide = false, children}) {
  const t = useBuilderText();
  return (
    <label className={wide ? styles.fieldWide : styles.field}>
      <span className={styles.fieldLabel}>{t(label)}</span>
      {children}
    </label>
  );
}

function LogicToggle({value, onChange, compact = false}) {
  const t = useBuilderText();
  return (
    <div
      className={compact ? styles.logicToggleCompact : styles.logicToggle}
      aria-label={t('条件关系')}>
      <button
        type="button"
        className={value === '&&' ? styles.logicActive : ''}
        onClick={() => onChange('&&')}>
        AND
      </button>
      <button
        type="button"
        className={value === '||' ? styles.logicActive : ''}
        onClick={() => onChange('||')}>
        OR
      </button>
    </div>
  );
}

function RegexFlags({value, onChange}) {
  const t = useBuilderText();
  const toggle = (flag) => {
    const next = value.includes(flag)
      ? value.replace(flag, '')
      : `${value}${flag}`;
    onChange(next);
  };

  return (
    <div className={styles.flagGroup} aria-label={t('正则 flags')}>
      {['i', 'm', 's'].map((flag) => (
        <button
          type="button"
          key={flag}
          className={value.includes(flag) ? styles.flagActive : ''}
          onClick={() => toggle(flag)}>
          {flag}
        </button>
      ))}
    </div>
  );
}

function ConditionValueEditor({condition, update}) {
  const t = useBuilderText();
  if (condition.operator === '~=') {
    return (
      <>
        <FieldShell label="匹配值">
          <select
            value={condition.valueType}
            onChange={(event) =>
              update({
                valueType: event.target.value,
                value:
                  event.target.value === 'variable'
                    ? 'urlPattern'
                    : condition.valueType === 'variable'
                      ? '^https:\\/\\/'
                      : condition.value,
              })
            }>
            <option value="regex">{t('正则')}</option>
            <option value="variable">{t('插件参数')}</option>
          </select>
        </FieldShell>
        <FieldShell label={condition.valueType === 'regex' ? '正则内容' : '参数名'} wide>
          <div className={styles.compositeInput}>
            {condition.valueType === 'regex' && (
              <span className={styles.inputAffix}>/</span>
            )}
            <input
              value={condition.value}
              placeholder={
                condition.valueType === 'regex'
                  ? '^https:\\/\\/example[.]com'
                  : 'urlPattern'
              }
              onChange={(event) => update({value: event.target.value})}
            />
            {condition.valueType === 'regex' && (
              <>
                <span className={styles.inputAffix}>/</span>
                <RegexFlags
                  value={condition.flags}
                  onChange={(flags) => update({flags})}
                />
              </>
            )}
          </div>
        </FieldShell>
      </>
    );
  }

  return (
    <>
      <FieldShell label="值类型">
        <select
          value={condition.valueType}
          onChange={(event) => {
            const nextType = event.target.value;
            const defaults = {
              string: '',
              number: '200',
              boolean: 'true',
              null: '',
              variable: 'region',
            };
            update({valueType: nextType, value: defaults[nextType]});
          }}>
          <option value="string">{t('字符串')}</option>
          <option value="number">{t('数字')}</option>
          <option value="boolean">{t('布尔值')}</option>
          <option value="null">null</option>
          <option value="variable">{t('插件参数')}</option>
        </select>
      </FieldShell>
      {condition.valueType !== 'null' && (
        <FieldShell
          label={condition.valueType === 'variable' ? '参数名' : '比较值'}
          wide>
          {condition.valueType === 'boolean' ? (
            <select
              value={condition.value}
              onChange={(event) => update({value: event.target.value})}>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          ) : (
            <input
              type={condition.valueType === 'number' ? 'number' : 'text'}
              value={condition.value}
              placeholder={
                condition.valueType === 'variable' ? 'region' : t('输入比较值')
              }
              onChange={(event) => update({value: event.target.value})}
            />
          )}
        </FieldShell>
      )}
    </>
  );
}

function ConditionRow({
  condition,
  phase,
  index,
  onUpdate,
  onRemove,
  canRemove,
}) {
  const t = useBuilderText();
  const fields = CONDITION_FIELDS.filter((field) =>
    field.phases.includes(phase),
  );

  const update = (patch) => onUpdate({...condition, ...patch});

  const changeField = (field) => {
    if (field === 'request.method') {
      update({
        field,
        operator: '==',
        valueType: 'string',
        value: 'GET',
        captureName: '',
      });
      return;
    }
    if (field === 'response.status') {
      update({
        field,
        operator: '==',
        valueType: 'number',
        value: '200',
        captureName: '',
      });
      return;
    }
    if (field === 'plugin') {
      update({
        field,
        operator: '==',
        valueType: 'boolean',
        value: 'true',
        variableName: 'enabled',
        captureName: '',
      });
      return;
    }
    if (field === 'request.header' || field === 'response.header') {
      update({
        field,
        operator: '==',
        valueType: 'string',
        value: field === 'response.header' ? 'application/json' : '',
        headerName:
          field === 'response.header' ? 'Content-Type' : 'X-Region',
        captureName: '',
      });
      return;
    }
    update({
      field,
      operator: '~=',
      valueType: 'regex',
      value: '^https:\\/\\/example[.]com',
      captureName: '',
    });
  };

  const changeOperator = (operator) => {
    if (operator === '~=') {
      update({
        operator,
        valueType: 'regex',
        value: condition.field === 'url' ? '^https:\\/\\/' : '.+',
      });
    } else {
      update({
        operator,
        valueType:
          condition.field === 'response.status' ? 'number' : 'string',
        value: condition.field === 'response.status' ? '200' : '',
        captureName: '',
      });
    }
  };

  return (
    <div className={styles.conditionRow}>
      <div className={styles.rowNumber}>{index + 1}</div>
      <div className={styles.conditionFields}>
        <FieldShell label="字段">
          <select
            value={condition.field}
            onChange={(event) => changeField(event.target.value)}>
            {fields.map((field) => (
              <option key={field.value} value={field.value}>
                {t(field.label)}
              </option>
            ))}
          </select>
        </FieldShell>

        {(condition.field === 'request.header' ||
          condition.field === 'response.header') && (
          <FieldShell label="Header 名称" wide>
            <input
              value={condition.headerName}
              placeholder="Content-Type"
              onChange={(event) => update({headerName: event.target.value})}
            />
          </FieldShell>
        )}

        {condition.field === 'plugin' && (
          <FieldShell label="参数名" wide>
            <div className={styles.variableInput}>
              <span>{'${'}</span>
              <input
                value={condition.variableName}
                placeholder="enabled"
                onChange={(event) =>
                  update({variableName: event.target.value})
                }
              />
              <span>{'}'}</span>
            </div>
          </FieldShell>
        )}

        <FieldShell label="操作符">
          <select
            value={condition.operator}
            onChange={(event) => changeOperator(event.target.value)}>
            <option value="==">{t('等于 ==')}</option>
            <option value="~=">{t('正则匹配 ~=')}</option>
          </select>
        </FieldShell>

        <ConditionValueEditor condition={condition} update={update} />

        {condition.operator === '~=' && (
          <FieldShell label="保存捕获（可选）">
            <input
              value={condition.captureName}
              placeholder={t('例如 item')}
              onChange={(event) =>
                update({captureName: event.target.value})
              }
            />
          </FieldShell>
        )}
      </div>
      <button
        type="button"
        className={styles.iconButton}
        onClick={onRemove}
        disabled={!canRemove}
        aria-label={t('删除条件')}>
        <Icon name="trash" />
      </button>
    </div>
  );
}

function ConditionGroup({
  group,
  phase,
  depth,
  onUpdateNode,
  onRemoveNode,
  onAddCondition,
  onAddGroup,
}) {
  const t = useBuilderText();
  return (
    <div
      className={
        depth === 0 ? styles.rootConditionGroup : styles.nestedConditionGroup
      }>
      <div className={styles.groupHeader}>
        <div>
          <span className={styles.groupEyebrow}>
            {t(depth === 0 ? '匹配逻辑' : `条件组 · ${group.items.length} 项`)}
          </span>
          <p>
            {group.logic === '&&'
              ? t('所有条件都满足时执行')
              : t('任一条件满足时执行')}
          </p>
        </div>
        <LogicToggle
          value={group.logic}
          onChange={(logic) =>
            onUpdateNode(group.id, (node) => ({...node, logic}))
          }
          compact={depth > 0}
        />
      </div>

      <div className={styles.groupItems}>
        {group.items.map((item, index) => (
          <div className={styles.groupItem} key={item.id}>
            {index > 0 && (
              <span className={styles.connector}>
                {group.logic === '&&' ? 'AND' : 'OR'}
              </span>
            )}
            {item.kind === 'group' ? (
              <div className={styles.nestedWrap}>
                <ConditionGroup
                  group={item}
                  phase={phase}
                  depth={depth + 1}
                  onUpdateNode={onUpdateNode}
                  onRemoveNode={onRemoveNode}
                  onAddCondition={onAddCondition}
                  onAddGroup={onAddGroup}
                />
                <button
                  type="button"
                  className={styles.removeGroupButton}
                  onClick={() => onRemoveNode(item.id)}>
                  <Icon name="trash" />
                  {t('删除条件组')}
                </button>
              </div>
            ) : (
              <ConditionRow
                condition={item}
                phase={phase}
                index={index}
                onUpdate={(next) =>
                  onUpdateNode(item.id, () => next)
                }
                onRemove={() => onRemoveNode(item.id)}
                canRemove={group.items.length > 1}
              />
            )}
          </div>
        ))}
      </div>

      <div className={styles.groupActions}>
        <button type="button" onClick={() => onAddCondition(group.id)}>
          <Icon name="plus" />
          {t('添加条件')}
        </button>
        {depth < MAX_GROUP_DEPTH && (
          <button type="button" onClick={() => onAddGroup(group.id)}>
            <Icon name="folder" />
            {t('添加条件组')}
          </button>
        )}
        {depth >= MAX_GROUP_DEPTH && (
          <span className={styles.groupLimit}>
            {t('已达到 4 层嵌套上限')}
          </span>
        )}
      </div>
    </div>
  );
}

function ActionSelect({value, phase, onChange}) {
  const t = useBuilderText();
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      {ACTION_GROUPS.map((group) => {
        const actions = group.actions.filter(
          (type) => ACTION_DEFINITIONS[type].phase === phase,
        );
        if (!actions.length) {
          return null;
        }
        return (
          <optgroup key={group.label} label={t(group.label)}>
            {actions.map((type) => (
              <option key={type} value={type}>
                {t(ACTION_DEFINITIONS[type].label)}
              </option>
            ))}
          </optgroup>
        );
      })}
    </select>
  );
}

function TextField({label, value, onChange, placeholder, wide = false}) {
  const t = useBuilderText();
  return (
    <FieldShell label={label} wide={wide}>
      <input
        value={value}
        placeholder={t(placeholder)}
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldShell>
  );
}

function RegexEditor({fields, update, label = '正则内容'}) {
  const t = useBuilderText();
  return (
    <FieldShell label={label} wide>
      <div className={styles.compositeInput}>
        <span className={styles.inputAffix}>/</span>
        <input
          value={fields.pattern}
          placeholder={t('输入正则，不含两侧 /')}
          onChange={(event) => update({pattern: event.target.value})}
        />
        <span className={styles.inputAffix}>/</span>
        <RegexFlags
          value={fields.flags}
          onChange={(flags) => update({flags})}
        />
      </div>
    </FieldShell>
  );
}

function AnyValueEditor({fields, update}) {
  const t = useBuilderText();
  const defaults = {
    string: '',
    number: '0',
    boolean: 'true',
    null: '',
    variable: 'value',
    raw: '{"key":"value"}',
  };

  return (
    <>
      <FieldShell label="值类型">
        <select
          value={fields.valueType}
          onChange={(event) => {
            const valueType = event.target.value;
            update({valueType, value: defaults[valueType]});
          }}>
          <option value="string">{t('字符串')}</option>
          <option value="number">{t('数字')}</option>
          <option value="boolean">{t('布尔值')}</option>
          <option value="null">null</option>
          <option value="variable">{t('插件参数 / 捕获')}</option>
          <option value="raw">{t('原始字符串')}</option>
        </select>
      </FieldShell>
      {fields.valueType !== 'null' && (
        <FieldShell
          label={
            fields.valueType === 'variable'
              ? '变量名'
              : fields.valueType === 'raw'
                ? '原始内容'
                : '值'
          }
          wide>
          {fields.valueType === 'boolean' ? (
            <select
              value={fields.value}
              onChange={(event) => update({value: event.target.value})}>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          ) : (
            <input
              type={fields.valueType === 'number' ? 'number' : 'text'}
              value={fields.value}
              placeholder={
                fields.valueType === 'variable'
                  ? t('price 或 item.1')
                  : t('输入值')
              }
              onChange={(event) => update({value: event.target.value})}
            />
          )}
        </FieldShell>
      )}
    </>
  );
}

function ActionFields({action, onChange}) {
  const t = useBuilderText();
  const {type, fields} = action;
  const update = (patch) => onChange({...fields, ...patch});

  if (type === 'url.replace') {
    return (
      <>
        <RegexEditor fields={fields} update={update} label="URL 替换正则" />
        <TextField
          label="替换内容"
          value={fields.replacement}
          onChange={(replacement) => update({replacement})}
          placeholder="https://example.com"
          wide
        />
      </>
    );
  }

  if (type === 'redirect') {
    return (
      <>
        <FieldShell label="状态码">
          <select
            value={fields.status}
            onChange={(event) => update({status: event.target.value})}>
            <option value="302">302</option>
            <option value="307">307</option>
          </select>
        </FieldShell>
        <TextField
          label="Location"
          value={fields.location}
          onChange={(location) => update({location})}
          placeholder="https://new.example.com"
          wide
        />
      </>
    );
  }

  if (type === 'reject') {
    return (
      <FieldShell label="响应类型" wide>
        <select
          value={fields.preset}
          onChange={(event) => update({preset: event.target.value})}>
          {REJECT_PRESETS.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {t(preset.label)}
            </option>
          ))}
        </select>
      </FieldShell>
    );
  }

  if (type.endsWith('.header.add') || type.endsWith('.header.set')) {
    return (
      <>
        <TextField
          label="Header 名称"
          value={fields.name}
          onChange={(name) => update({name})}
          placeholder="X-Loon"
        />
        <TextField
          label="Header 值"
          value={fields.value}
          onChange={(value) => update({value})}
          placeholder="支持 ${...}"
          wide
        />
      </>
    );
  }

  if (type.endsWith('.header.delete')) {
    return (
      <TextField
        label="Header 名称"
        value={fields.name}
        onChange={(name) => update({name})}
        placeholder="Cookie"
        wide
      />
    );
  }

  if (type.endsWith('.header.replace')) {
    return (
      <>
        <TextField
          label="Header 名称"
          value={fields.name}
          onChange={(name) => update({name})}
          placeholder="User-Agent"
        />
        <RegexEditor fields={fields} update={update} />
        <TextField
          label="替换内容"
          value={fields.replacement}
          onChange={(replacement) => update({replacement})}
          placeholder="允许留空"
          wide
        />
      </>
    );
  }

  if (type.endsWith('.body.replace')) {
    return (
      <>
        <RegexEditor fields={fields} update={update} />
        <TextField
          label="替换内容"
          value={fields.replacement}
          onChange={(replacement) => update({replacement})}
          placeholder="支持 ${...}"
          wide
        />
      </>
    );
  }

  if (type.endsWith('.json.delete')) {
    return (
      <TextField
        label="JSON Key Path"
        value={fields.path}
        onChange={(path) => update({path})}
        placeholder="data.ads"
        wide
      />
    );
  }

  if (type.endsWith('.json.add') || type.endsWith('.json.replace')) {
    return (
      <>
        <TextField
          label="JSON Key Path"
          value={fields.path}
          onChange={(path) => update({path})}
          placeholder="data.price"
          wide
        />
        <AnyValueEditor fields={fields} update={update} />
      </>
    );
  }

  if (type.endsWith('.json.jq')) {
    const key = fields.source === 'file' ? 'file' : 'filter';
    return (
      <>
        <FieldShell label="来源">
          <select
            value={fields.source}
            onChange={(event) => update({source: event.target.value})}>
            <option value="filter">{t('jq 表达式')}</option>
            <option value="file">{t('插件文件')}</option>
          </select>
        </FieldShell>
        <TextField
          label={fields.source === 'file' ? '文件名' : 'jq 表达式'}
          value={fields[key]}
          onChange={(value) => update({[key]: value})}
          placeholder={
            fields.source === 'file'
              ? 'response-filter.jq'
              : '.data.ads = []'
          }
          wide
        />
      </>
    );
  }

  if (type.endsWith('.body.mock')) {
    const sourceKey = fields.source === 'file' ? 'file' : 'data';
    return (
      <>
        <FieldShell label="Body 类型">
          <select
            value={fields.type}
            onChange={(event) => update({type: event.target.value})}>
            {BODY_TYPES.map((bodyType) => (
              <option key={bodyType} value={bodyType}>
                {bodyType}
              </option>
            ))}
          </select>
        </FieldShell>
        <FieldShell label="数据来源">
          <select
            value={fields.source}
            onChange={(event) => update({source: event.target.value})}>
            <option value="data">{t('直接填写')}</option>
            <option value="file">{t('插件文件')}</option>
          </select>
        </FieldShell>
        <TextField
          label={fields.source === 'file' ? '文件名' : 'Body 内容'}
          value={fields[sourceKey]}
          onChange={(value) => update({[sourceKey]: value})}
          placeholder={
            fields.source === 'file'
              ? 'response_body.json'
              : '{"code":0}'
          }
          wide
        />
        {fields.source === 'data' && (
          <label className={styles.checkField}>
            <input
              type="checkbox"
              checked={fields.raw}
              onChange={(event) => update({raw: event.target.checked})}
            />
            {t('使用反引号原始字符串')}
          </label>
        )}
        <label className={styles.checkField}>
          <input
            type="checkbox"
            checked={fields.base64}
            onChange={(event) => update({base64: event.target.checked})}
          />
          {t('数据为 Base64')}
        </label>
        {type === 'response.body.mock' && (
          <TextField
            label="响应状态码"
            value={fields.status}
            onChange={(status) => update({status})}
            placeholder="200"
          />
        )}
      </>
    );
  }

  return null;
}

function ActionCard({
  action,
  phase,
  index,
  onUpdate,
  onRemove,
  canRemove,
}) {
  const t = useBuilderText();
  return (
    <div className={styles.actionCard}>
      <div className={styles.actionIndex}>{index + 1}</div>
      <div className={styles.actionMain}>
        <div className={styles.actionTitleRow}>
          <FieldShell label="Action">
            <ActionSelect
              value={action.type}
              phase={phase}
              onChange={(type) =>
                onUpdate({
                  ...action,
                  type,
                  fields: clone(ACTION_DEFINITIONS[type].defaults),
                })
              }
            />
          </FieldShell>
          <code>{action.type}</code>
        </div>
        <div className={styles.actionFields}>
          <ActionFields
            action={action}
            onChange={(fields) => onUpdate({...action, fields})}
          />
        </div>
      </div>
      <button
        type="button"
        className={styles.iconButton}
        onClick={onRemove}
        disabled={!canRemove}
        aria-label={t('删除 Action')}>
        <Icon name="trash" />
      </button>
    </div>
  );
}

export default function RewriteBuilder() {
  const {i18n} = useDocusaurusContext();
  const isEnglish = i18n.currentLocale === 'en';
  const t = (text) => translateBuilderText(text, isEnglish);
  const idCounter = useRef(100);
  const nextId = (prefix) => {
    idCounter.current += 1;
    return `${prefix}-${idCounter.current}`;
  };

  const [phase, setPhase] = useState('http-request');
  const [conditions, setConditions] = useState(() =>
    clone(EXAMPLES.request.conditions),
  );
  const [actions, setActions] = useState(() =>
    clone(EXAMPLES.request.actions),
  );
  const [includeSection, setIncludeSection] = useState(false);
  const [copyState, setCopyState] = useState('idle');
  const [example, setExample] = useState('request');

  const generatedLine = useMemo(() => {
    const expression = groupText(conditions);
    const actionList = actions.map(actionText).join(' | ');
    return `${phase} if ${expression} then ${actionList}`;
  }, [phase, conditions, actions]);

  const output = includeSection
    ? `[Rewrite]\n${generatedLine}`
    : generatedLine;

  const errors = useMemo(() => {
    const issues = validateGroup(conditions);
    const analysis = analyzeConditions(conditions);
    const duplicateCaptures = analysis.captures.filter(
      (name, index) => analysis.captures.indexOf(name) !== index,
    );

    if (analysis.optionalCaptures.length) {
      issues.push(
        `捕获 ${[...new Set(analysis.optionalCaptures)].join('、')} 位于 OR 的可选分支中`,
      );
    }
    if (duplicateCaptures.length) {
      issues.push(
        `捕获名称不能重复：${[...new Set(duplicateCaptures)].join('、')}`,
      );
    }
    const captureParameterConflicts = analysis.captures.filter((name) =>
      analysis.pluginParameters.includes(name),
    );
    if (captureParameterConflicts.length) {
      issues.push(
        `捕获名称不能与插件参数重名：${[...new Set(captureParameterConflicts)].join('、')}`,
      );
    }

    if (!actions.length) {
      issues.push('至少需要一个 Action');
    }
    actions.forEach((action) => issues.push(...validateAction(action)));
    if (actions.some((action) => action.type === 'redirect')) {
      if (analysis.mandatoryUrlRegexCount === 0) {
        issues.push('redirect 需要一个必选的 URL 正则条件');
      } else if (analysis.mandatoryUrlRegexCount > 1) {
        issues.push('redirect 只能对应一个必选的 URL 正则条件');
      }
    }
    return [...new Set(issues)];
  }, [conditions, actions]);

  const counts = useMemo(() => collectCounts(conditions), [conditions]);

  const updateConditionNode = (id, updater) => {
    setConditions((current) => updateTree(current, id, updater));
  };

  const removeConditionNode = (id) => {
    setConditions((current) => removeFromTree(current, id));
  };

  const addCondition = (groupId) => {
    const condition = createCondition(nextId('condition'));
    setConditions((current) =>
      updateTree(current, groupId, (group) => ({
        ...group,
        items: [...group.items, condition],
      })),
    );
  };

  const addGroup = (groupId) => {
    const group = createGroup(
      nextId('group'),
      nextId('condition'),
    );
    setConditions((current) =>
      updateTree(current, groupId, (currentGroup) => ({
        ...currentGroup,
        items: [...currentGroup.items, group],
      })),
    );
  };

  const changePhase = (nextPhase) => {
    if (nextPhase === phase) {
      return;
    }
    setPhase(nextPhase);
    setCopyState('idle');
    if (nextPhase === 'http-request') {
      setConditions((current) => normalizeRequestTree(current));
      setActions((current) => {
        const compatible = current.filter(
          (action) => ACTION_DEFINITIONS[action.type].phase === nextPhase,
        );
        return compatible.length
          ? compatible
          : [createAction(nextId('action'), 'request.header.set')];
      });
    } else {
      setActions([
        createAction(nextId('action'), 'response.header.set'),
      ]);
    }
  };

  const addAction = () => {
    const type =
      phase === 'http-request'
        ? 'request.header.set'
        : 'response.header.set';
    setActions((current) => [
      ...current,
      createAction(nextId('action'), type),
    ]);
  };

  const updateAction = (id, next) => {
    setActions((current) =>
      current.map((action) => (action.id === id ? next : action)),
    );
    setCopyState('idle');
  };

  const removeAction = (id) => {
    setActions((current) =>
      current.filter((action) => action.id !== id),
    );
  };

  const loadExample = (key) => {
    const preset = clone(EXAMPLES[key]);
    setExample(key);
    setPhase(preset.phase);
    setConditions(preset.conditions);
    setActions(preset.actions);
    setCopyState('idle');
  };

  const copyOutput = async () => {
    if (errors.length) {
      return;
    }
    try {
      await navigator.clipboard.writeText(output);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1800);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = output;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1800);
    }
  };

  return (
    <BuilderLocaleContext.Provider value={isEnglish}>
    <Layout
      title={t('Rewrite 配置生成器')}
      description={t('通过可视化条件与 Action 组合生成 Loon Rewrite 新语法配置')}>
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroGlow} />
          <div className={styles.heroInner}>
            <div className={styles.eyebrow}>
              <span>LOON TOOL</span>
              <span className={styles.versionBadge}>3.5.1 (978)+</span>
            </div>
            <Heading as="h1">{t('Rewrite 配置生成器')}</Heading>
            <p>{t('像搭积木一样组合匹配条件与 Action，实时生成可复制的新 Rewrite 语法。')}</p>
            <div className={styles.heroLinks}>
              <Link to="/docs/Rewrite/rewrite_v2">{t('查看语法文档 →')}</Link>
              <span>{t('仅在浏览器本地生成，不会上传配置')}</span>
            </div>
          </div>
        </section>

        <section className={styles.workspace}>
          <div className={styles.builderColumn}>
            <div className={styles.topToolbar}>
              <div className={styles.phaseSelector}>
                {PHASES.map((item) => (
                  <button
                    type="button"
                    key={item.value}
                    className={
                      phase === item.value ? styles.phaseActive : ''
                    }
                    onClick={() => changePhase(item.value)}>
                    <span>{t(item.label)}</span>
                    <small>{t(item.hint)}</small>
                  </button>
                ))}
              </div>
              <label className={styles.examplePicker}>
                <span>{t('加载示例')}</span>
                <select
                  value={example}
                  onChange={(event) => loadExample(event.target.value)}>
                  {Object.entries(EXAMPLES).map(([key, item]) => (
                    <option key={key} value={key}>
                      {t(item.label)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <section className={styles.builderSection}>
              <div className={styles.sectionHeading}>
                <div className={styles.sectionNumber}>01</div>
                <div>
                  <span>IF</span>
                  <Heading as="h2">{t('设置匹配条件')}</Heading>
                  <p>{t('选择 Loon 内置变量或插件参数，并组合 AND / OR。')}</p>
                </div>
              </div>
              <ConditionGroup
                group={conditions}
                phase={phase}
                depth={0}
                onUpdateNode={updateConditionNode}
                onRemoveNode={removeConditionNode}
                onAddCondition={addCondition}
                onAddGroup={addGroup}
              />
            </section>

            <section className={styles.builderSection}>
              <div className={styles.sectionHeading}>
                <div className={styles.sectionNumber}>02</div>
                <div>
                  <span>THEN</span>
                  <Heading as="h2">{t('添加执行动作')}</Heading>
                  <p>{t('多个 Action 会按从上到下的顺序依次执行。')}</p>
                </div>
              </div>
              <div className={styles.actionList}>
                {actions.map((action, index) => (
                  <React.Fragment key={action.id}>
                    {index > 0 && (
                      <span className={styles.actionConnector}>THEN</span>
                    )}
                    <ActionCard
                      action={action}
                      phase={phase}
                      index={index}
                      onUpdate={(next) =>
                        updateAction(action.id, next)
                      }
                      onRemove={() => removeAction(action.id)}
                      canRemove={actions.length > 1}
                    />
                  </React.Fragment>
                ))}
              </div>
              <button
                type="button"
                className={styles.addActionButton}
                onClick={addAction}>
                <Icon name="rule" />
                {t('添加 Action')}
              </button>
            </section>
          </div>

          <aside className={styles.previewColumn}>
            <div className={styles.previewCard}>
              <div className={styles.previewHeader}>
                <div>
                  <span>OUTPUT</span>
                  <Heading as="h2">{t('生成结果')}</Heading>
                </div>
                <span
                  className={
                    errors.length
                      ? styles.statusInvalid
                      : styles.statusReady
                  }>
                  {errors.length
                    ? isEnglish
                      ? `${errors.length} items need attention`
                      : `${errors.length} 项待完善`
                    : t('语法就绪')}
                </span>
              </div>

              <div className={styles.metrics}>
                <div>
                  <strong>{counts.conditions}</strong>
                  <span>{t('条件')}</span>
                </div>
                <div>
                  <strong>{counts.groups}</strong>
                  <span>{t('条件组')}</span>
                </div>
                <div>
                  <strong>{actions.length}</strong>
                  <span>Action</span>
                </div>
              </div>

              <div className={styles.codeBlock}>
                <div className={styles.codeToolbar}>
                  <span>rewrite.conf</span>
                  <span>{phase}</span>
                </div>
                <pre>
                  <code>{output}</code>
                </pre>
              </div>

              <label className={styles.includeSection}>
                <input
                  type="checkbox"
                  checked={includeSection}
                  onChange={(event) =>
                    setIncludeSection(event.target.checked)
                  }
                />
                {t('包含 `[Rewrite]` 段落标题')}
              </label>

              {errors.length > 0 && (
                <div className={styles.errorPanel}>
                  <strong>{t('请完善以下内容')}</strong>
                  <ul>
                    {errors.map((error) => (
                      <li key={error}>{t(error)}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                type="button"
                className={styles.copyButton}
                onClick={copyOutput}
                disabled={errors.length > 0}>
                <Icon name="copy" />
                {copyState === 'copied'
                  ? t('已复制到剪贴板')
                  : t('复制配置')}
              </button>
              <p className={styles.previewFootnote}>
                {t('生成器不会执行 Rewrite；复制后请在 Loon 中加载配置并检查运行日志。')}
              </p>
            </div>
          </aside>
        </section>
      </main>
    </Layout>
    </BuilderLocaleContext.Provider>
  );
}
