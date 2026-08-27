import React, {useMemo, useRef, useState} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './script-builder.module.css';

const EN_TEXT = {
  'Script 配置编辑器': 'Script Configuration Editor',
  '通过可视化 Trigger、条件、参数与 Options 生成 Loon 3.5.1 (983) 起使用的新 Script 语法':
    'Generate the new Script syntax used since Loon 3.5.1 (983) with visual triggers, conditions, arguments, and options',
  '选择脚本类型并填写配置，右侧会实时生成可复制的新语法。':
    'Choose a script type and complete its settings. Copy the generated new syntax from the preview.',
  '查看语法文档 →': 'Read the syntax guide →',
  '转换旧版配置 →': 'Convert legacy configuration →',
  '仅在浏览器本地生成，不会上传配置': 'Generated locally in your browser; no configuration is uploaded',
  '脚本类型': 'Script type',
  '请求发出前执行': 'Runs before the request is sent',
  '收到响应后执行': 'Runs after a response is received',
  '按 Cron 表达式执行': 'Runs on a Cron schedule',
  '网络变化时执行': 'Runs when the network changes',
  '从 App 中手动执行': 'Runs manually from the app',
  '匹配条件': 'Match conditions',
  '配置 HTTP Script 的 URL、Method、Header 或插件参数条件。':
    'Configure URL, method, header, or plugin parameter conditions for an HTTP script.',
  '全部满足': 'Match all',
  '任一满足': 'Match any',
  '字段': 'Field',
  '请求方法': 'Request method',
  '请求 Header': 'Request header',
  '响应状态码': 'Response status',
  '响应 Header': 'Response header',
  '插件参数': 'Plugin parameter',
  '参数名': 'Parameter name',
  'Header 名称': 'Header name',
  '操作符': 'Operator',
  '精确匹配 ==': 'Exact match ==',
  '正则匹配 ~=': 'Regex match ~=',
  '值类型': 'Value type',
  '字符串': 'String',
  '固定字符串': 'Fixed string',
  '数字': 'Number',
  '布尔值': 'Boolean',
  'Header 不存在（null）': 'Header is absent (null)',
  '变量': 'Variable',
  '字符串模板': 'String template',
  'Raw String': 'Raw String',
  'Raw Syntax': 'Raw Syntax',
  '模板内容': 'Template content',
  '原始内容': 'Raw content',
  '原始语法': 'Raw syntax',
  '用于匹配固定 Header 值。': 'Matches a fixed header value.',
  '用于判断 Header 不存在；空值 Header 请使用空字符串。':
    'Checks whether the header is absent; use an empty string for a present header with no value.',
  '整个比较值来自 String 类型插件变量。':
    'Uses an entire String value supplied by a plugin variable.',
  '组合固定文本与 ${...} 插件变量。':
    'Combines fixed text with ${...} plugin variables.',
  '按字面量比较，不处理转义或变量替换。':
    'Compares literal text without escapes or variable expansion.',
  '直接填写完整右值语法，生成后仍需通过语法校验。':
    'Enter the complete right-hand expression; the generated syntax must still be valid.',
  '使用正则查找 Header 内容。': 'Searches the header value with a regular expression.',
  'Script URL 正则仅用于匹配，不支持 as 捕获变量；需要捕获内容时可在 JavaScript 中读取 Request/Response 数据并再次执行正则。':
    'A Script URL regex only matches the entry and does not support as capture variables. Read Request/Response data and run the regex again in JavaScript when captured content is needed.',
  '正则内容': 'Regular expression',
  '比较值': 'Comparison value',
  '删除条件': 'Delete condition',
  '添加条件': 'Add condition',
  'Cron 设置': 'Cron settings',
  '固定表达式': 'Fixed expression',
  '插件参数表达式': 'Plugin parameter expression',
  'Cron 表达式': 'Cron expression',
  'Script Action': 'Script action',
  '脚本路径': 'Script path',
  '参数形式': 'Argument form',
  '无参数（$argument 为 null）': 'No argument ($argument is null)',
  '字符串（$argument 为 String）': 'String ($argument is a String)',
  'Raw String（$argument 为 String）': 'Raw String ($argument is a String)',
  '插件参数（$argument 为 Object）': 'Plugin parameters ($argument is an Object)',
  '字符串参数': 'String argument',
  'Raw String 内容': 'Raw String content',
  '插件参数名称': 'Plugin parameter names',
  '多个参数使用逗号分隔，例如 region, level': 'Separate names with commas, for example: region, level',
  'Options': 'Options',
  '只选择需要设置的选项。': 'Select only the options you want to configure.',
  'enable': 'enable',
  '固定布尔值': 'Fixed Boolean',
  '插件 Boolean 参数': 'Plugin Boolean parameter',
  'tag': 'tag',
  '显示名称': 'Display name',
  'img_url': 'img_url',
  '图标名称或 URL': 'Icon name or URL',
  'timeout': 'timeout',
  '超时秒数': 'Timeout in seconds',
  'debug': 'debug',
  '等待完整 Body': 'Wait for the complete body',
  '使用二进制 Body 模式': 'Use binary body mode',
  '生成结果': 'Generated configuration',
  '语法就绪': 'Syntax ready',
  '包含 `[Script]` 段落标题': 'Include the `[Script]` section heading',
  '请完善以下内容': 'Complete the following items',
  '复制配置': 'Copy configuration',
  '已复制到剪贴板': 'Copied to clipboard',
  '编辑器只生成配置，不会执行 Script。复制后请在 Loon 中加载并检查日志。':
    'The editor generates configuration only; it does not run scripts. Load the result in Loon and check the logs.',
  '脚本路径不能为空': 'Script path cannot be empty',
  '脚本路径必须是固定字符串，不能包含变量模板': 'The script path must be fixed and cannot contain a variable template',
  '至少需要一个 HTTP 条件': 'At least one HTTP condition is required',
  'Response Script 必须包含强制 URL Guard': 'A Response Script must contain a mandatory URL guard',
  'Header 名称不能为空': 'Header name cannot be empty',
  '插件参数名格式不正确': 'The plugin parameter name is invalid',
  'Raw Syntax 不能为空': 'Raw Syntax cannot be empty',
  '正则内容不能为空': 'The regular expression cannot be empty',
  '数字格式不正确': 'The number format is invalid',
  'Cron 表达式不能为空': 'Cron expression cannot be empty',
  'Cron 插件参数名格式不正确': 'The Cron plugin parameter name is invalid',
  '字符串参数不能为空': 'The String argument cannot be empty',
  '插件参数列表不能为空': 'The plugin parameter list cannot be empty',
  '插件参数名称格式不正确': 'A plugin parameter name is invalid',
  '插件参数名称不能重复': 'Plugin parameter names cannot be repeated',
  'enable 插件参数名格式不正确': 'The enable plugin parameter name is invalid',
  'tag 不能为空': 'tag cannot be empty',
  'img_url 不能为空': 'img_url cannot be empty',
  'timeout 必须是大于 0 的数字': 'timeout must be a number greater than 0',
};

const TYPES = [
  {value: 'request', label: 'Request', hint: '请求发出前执行'},
  {value: 'response', label: 'Response', hint: '收到响应后执行'},
  {value: 'cron', label: 'Cron', hint: '按 Cron 表达式执行'},
  {value: 'network-changed', label: 'Network Changed', hint: '网络变化时执行'},
  {value: 'generic', label: 'Generic', hint: '从 App 中手动执行'},
];

const FIELD_OPTIONS = [
  {value: 'url', label: 'URL', phases: ['request', 'response']},
  {value: 'request.method', label: '请求方法', phases: ['request', 'response']},
  {value: 'request.header', label: '请求 Header', phases: ['request', 'response']},
  {value: 'response.status', label: '响应状态码', phases: ['response']},
  {value: 'response.header', label: '响应 Header', phases: ['response']},
  {value: 'plugin', label: '插件参数', phases: ['request', 'response']},
];

function tFor(text, english) { return english ? EN_TEXT[text] || text : text; }
function quote(value) { return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`; }
function raw(value) { return `\`${String(value).replace(/`/g, '``')}\``; }
function variable(name) { return `\${${String(name).trim()}}`; }
function regex(pattern, flags) { return `/${String(pattern).replace(/(^|[^\\])\//g, '$1\\/')}/${flags}`; }
function isIdentifier(value) { return /^[A-Za-z_][A-Za-z0-9_]*$/.test(String(value).trim()); }

function defaultCondition(id, phase = 'request') {
  return {
    id,
    field: 'url',
    operator: '~=',
    valueType: 'regex',
    value: phase === 'response' ? '^https:\\/\\/api\\.example\\.com' : '^https:\\/\\/example\\.com',
    flags: 'i',
    headerName: '',
    variableName: '',
  };
}

function conditionLeft(item) {
  if (item.field === 'request.header') return `\${request.header['${item.headerName.replaceAll("'", "\\'")}']}`;
  if (item.field === 'response.header') return `\${response.header['${item.headerName.replaceAll("'", "\\'")}']}`;
  if (item.field === 'plugin') return variable(item.variableName);
  return variable(item.field);
}

function conditionRight(item) {
  if (item.operator === '~=') {
    return item.valueType === 'variable' ? variable(item.value) : regex(item.value, item.flags);
  }
  if (item.valueType === 'number' || item.valueType === 'boolean') return item.value;
  if (item.valueType === 'null') return 'null';
  if (item.valueType === 'variable') return variable(item.value);
  if (item.valueType === 'raw') return raw(item.value);
  if (item.valueType === 'syntax') return String(item.value).trim();
  return quote(item.value);
}

function conditionText(item) { return `${conditionLeft(item)} ${item.operator} ${conditionRight(item)}`; }

function validateCondition(item) {
  const issues = [];
  if ((item.field === 'request.header' || item.field === 'response.header') && !item.headerName.trim()) issues.push('Header 名称不能为空');
  if (item.field === 'plugin' && !isIdentifier(item.variableName)) issues.push('插件参数名格式不正确');
  if (item.operator === '~=' && item.valueType === 'regex' && !item.value) issues.push('正则内容不能为空');
  if (item.operator === '~=' && item.valueType === 'variable' && !isIdentifier(item.value)) issues.push('插件参数名格式不正确');
  if (item.operator === '==' && item.valueType === 'number' && (!item.value || !Number.isFinite(Number(item.value)))) issues.push('数字格式不正确');
  if (item.operator === '==' && item.valueType === 'variable' && !isIdentifier(item.value)) issues.push('插件参数名格式不正确');
  if (item.valueType === 'syntax' && !String(item.value).trim()) issues.push('Raw Syntax 不能为空');
  return issues;
}

function Field({label, children, wide = false}) {
  return <label className={wide ? styles.fieldWide : styles.field}><span>{label}</span>{children}</label>;
}

function headerValueHint(valueType, operator, t) {
  if (operator === '~=') return t('使用正则查找 Header 内容。');
  const hints = {
    string: '用于匹配固定 Header 值。',
    null: '用于判断 Header 不存在；空值 Header 请使用空字符串。',
    variable: '整个比较值来自 String 类型插件变量。',
    template: '组合固定文本与 ${...} 插件变量。',
    raw: '按字面量比较，不处理转义或变量替换。',
    syntax: '直接填写完整右值语法，生成后仍需通过语法校验。',
  };
  return t(hints[valueType] || hints.string);
}

function ConditionEditor({item, phase, t, onChange, onRemove, removable}) {
  const fields = FIELD_OPTIONS.filter((field) => field.phases.includes(phase));
  const isHeader = item.field === 'request.header' || item.field === 'response.header';
  const changeField = (field) => {
    const next = {...item, field, headerName: '', variableName: ''};
    if (field === 'url') Object.assign(next, {operator: '~=', valueType: 'regex', value: '^https:\\/\\/api\\.example\\.com', flags: 'i'});
    if (field === 'request.method') Object.assign(next, {operator: '==', valueType: 'string', value: 'GET'});
    if (field === 'request.header' || field === 'response.header') Object.assign(next, {operator: '~=', valueType: 'regex', value: 'application\\/json', flags: 'i', headerName: field === 'response.header' ? 'Content-Type' : 'Accept'});
    if (field === 'response.status') Object.assign(next, {operator: '==', valueType: 'number', value: '200'});
    if (field === 'plugin') Object.assign(next, {operator: '==', valueType: 'boolean', value: 'true', variableName: 'enabled'});
    onChange(next);
  };
  const update = (patch) => onChange({...item, ...patch});
  const changeOperator = (operator) => update(operator === '~=' ? {operator, valueType: 'regex', value: '.+', flags: ''} : {operator, valueType: item.field === 'response.status' ? 'number' : 'string', value: item.field === 'response.status' ? '200' : ''});
  return (
    <div className={styles.conditionCard}>
      <div className={styles.conditionFields}>
        <Field label={t('字段')}><select value={item.field} onChange={(e) => changeField(e.target.value)}>{fields.map((field) => <option key={field.value} value={field.value}>{t(field.label)}</option>)}</select></Field>
        {(item.field === 'request.header' || item.field === 'response.header') && <Field label={t('Header 名称')} wide><input value={item.headerName} onChange={(e) => update({headerName: e.target.value})} /></Field>}
        {item.field === 'plugin' && <Field label={t('参数名')} wide><input value={item.variableName} onChange={(e) => update({variableName: e.target.value})} /></Field>}
        <Field label={t('操作符')}><select value={item.operator} onChange={(e) => changeOperator(e.target.value)}><option value="==">{t('精确匹配 ==')}</option><option value="~=">{t('正则匹配 ~=')}</option></select></Field>
        {item.operator === '~=' ? <>
          <Field label={t('值类型')}><select value={item.valueType} onChange={(e) => update({valueType: e.target.value, value: e.target.value === 'variable' ? 'urlPattern' : '.+'})}><option value="regex">Regex</option>{!isHeader && <option value="variable">{t('插件参数')}</option>}</select></Field>
          <Field label={item.valueType === 'regex' ? t('正则内容') : t('参数名')} wide><input value={item.value} onChange={(e) => update({value: e.target.value})} /></Field>
          {item.valueType === 'regex' && <Field label="Flags"><div className={styles.flags}>{['i','m','s'].map((flag) => <button type="button" key={flag} className={item.flags.includes(flag) ? styles.activeFlag : ''} onClick={() => update({flags: item.flags.includes(flag) ? item.flags.replace(flag, '') : item.flags + flag})}>{flag}</button>)}</div></Field>}
          {isHeader && <p className={styles.valueHint}>{headerValueHint(item.valueType, item.operator, t)}</p>}
          {item.field === 'url' && <p className={styles.valueHint}>{t('Script URL 正则仅用于匹配，不支持 as 捕获变量；需要捕获内容时可在 JavaScript 中读取 Request/Response 数据并再次执行正则。')}</p>}
        </> : <>
          <Field label={t('值类型')}><select value={item.valueType} onChange={(e) => {const nextType = e.target.value; const defaults = {string: '', number: '200', boolean: 'true', null: '', variable: 'region', template: 'Bearer ${token}', raw: 'literal ${region}', syntax: '"CN"'}; update({valueType: nextType, value: defaults[nextType]});}}><option value="string">{t(isHeader ? '固定字符串' : '字符串')}</option>{!isHeader && <option value="number">{t('数字')}</option>}{!isHeader && <option value="boolean">{t('布尔值')}</option>}{isHeader && <option value="null">{t('Header 不存在（null）')}</option>}<option value="variable">{t(isHeader ? '变量' : '插件参数')}</option>{isHeader && <option value="template">{t('字符串模板')}</option>}{isHeader && <option value="raw">{t('Raw String')}</option>}{isHeader && <option value="syntax">{t('Raw Syntax')}</option>}</select></Field>
          {item.valueType !== 'null' && <Field label={t(item.valueType === 'variable' ? '参数名' : item.valueType === 'template' ? '模板内容' : item.valueType === 'raw' ? '原始内容' : item.valueType === 'syntax' ? '原始语法' : '比较值')} wide>{item.valueType === 'boolean' ? <select value={item.value} onChange={(e) => update({value: e.target.value})}><option>true</option><option>false</option></select> : <input type={item.valueType === 'number' ? 'number' : 'text'} value={item.value} placeholder={item.valueType === 'variable' ? 'region' : item.valueType === 'template' ? 'Bearer ${token}' : item.valueType === 'raw' ? 'literal ${region}' : item.valueType === 'syntax' ? '"CN"' : ''} onChange={(e) => update({value: e.target.value})} />}</Field>}
          {isHeader && <p className={styles.valueHint}>{headerValueHint(item.valueType, item.operator, t)}</p>}
        </>}
      </div>
      <button type="button" className={styles.removeButton} disabled={!removable} onClick={onRemove} aria-label={t('删除条件')}>×</button>
    </div>
  );
}

export default function ScriptBuilder() {
  const {i18n} = useDocusaurusContext();
  const english = i18n.currentLocale === 'en';
  const t = (text) => tFor(text, english);
  const counter = useRef(10);
  const nextId = () => `condition-${++counter.current}`;
  const [type, setType] = useState('request');
  const [logic, setLogic] = useState('&&');
  const [conditions, setConditions] = useState([defaultCondition('condition-1')]);
  const [cronKind, setCronKind] = useState('fixed');
  const [cronValue, setCronValue] = useState('0 8 * * *');
  const [path, setPath] = useState('request.js');
  const [argumentKind, setArgumentKind] = useState('none');
  const [argument, setArgument] = useState('mode=preview');
  const [pluginArguments, setPluginArguments] = useState('region, level');
  const [options, setOptions] = useState({includeEnable: false, enableKind: 'boolean', enable: 'true', includeTag: true, tag: 'Request Script', includeImage: false, image: 'bolt.system', includeTimeout: true, timeout: '20', debug: false, requiresBody: false, binaryBody: false});
  const [includeSection, setIncludeSection] = useState(false);
  const [copyState, setCopyState] = useState('idle');

  const changeType = (next) => {
    setType(next);
    const http = next === 'request' || next === 'response';
    if (http) setConditions([defaultCondition(nextId(), next)]);
    setPath(next === 'network-changed' ? 'network.js' : next === 'generic' ? 'tool.js' : `${next}.js`);
    setOptions((current) => ({...current, tag: next === 'network-changed' ? 'Network Changed' : `${next[0].toUpperCase()}${next.slice(1)} Script`, timeout: next === 'cron' ? '300' : '20', requiresBody: false, binaryBody: false}));
    setCopyState('idle');
  };
  const setOption = (patch) => setOptions((current) => ({...current, ...patch}));

  const issues = useMemo(() => {
    const result = [];
    if (!path.trim()) result.push('脚本路径不能为空');
    else if (path.includes('${')) result.push('脚本路径必须是固定字符串，不能包含变量模板');
    const http = type === 'request' || type === 'response';
    if (http) {
      if (!conditions.length) result.push('至少需要一个 HTTP 条件');
      conditions.forEach((item) => result.push(...validateCondition(item)));
      if (type === 'response') {
        const urlConditions = conditions.filter((item) => item.field === 'url' && item.operator === '~=');
        const guardValid = logic === '&&' ? urlConditions.length > 0 : urlConditions.length === conditions.length;
        if (!guardValid) result.push('Response Script 必须包含强制 URL Guard');
      }
    }
    if (type === 'cron') {
      if (!cronValue.trim()) result.push('Cron 表达式不能为空');
      if (cronKind === 'plugin' && !isIdentifier(cronValue)) result.push('Cron 插件参数名格式不正确');
    }
    if ((argumentKind === 'string' || argumentKind === 'raw') && !argument) result.push('字符串参数不能为空');
    if (argumentKind === 'plugin') {
      const names = pluginArguments.split(',').map((name) => name.trim()).filter(Boolean);
      if (!names.length) result.push('插件参数列表不能为空');
      else if (names.some((name) => !isIdentifier(name))) result.push('插件参数名称格式不正确');
      else if (new Set(names).size !== names.length) result.push('插件参数名称不能重复');
    }
    if (options.includeEnable && options.enableKind === 'plugin' && !isIdentifier(options.enable)) result.push('enable 插件参数名格式不正确');
    if (options.includeTag && !options.tag.trim()) result.push('tag 不能为空');
    if (options.includeImage && !options.image.trim()) result.push('img_url 不能为空');
    if (options.includeTimeout && (!Number.isFinite(Number(options.timeout)) || Number(options.timeout) <= 0)) result.push('timeout 必须是大于 0 的数字');
    return [...new Set(result)];
  }, [type, conditions, logic, cronKind, cronValue, path, argumentKind, argument, pluginArguments, options]);

  const generated = useMemo(() => {
    let trigger;
    if (type === 'request' || type === 'response') trigger = `${type} if ${conditions.map(conditionText).join(` ${logic} `)}`;
    else if (type === 'cron') trigger = `cron ${cronKind === 'plugin' ? variable(cronValue) : quote(cronValue)}`;
    else trigger = type;
    let argumentText = '';
    if (argumentKind === 'string') argumentText = `, ${quote(argument)}`;
    if (argumentKind === 'raw') argumentText = `, ${raw(argument)}`;
    if (argumentKind === 'plugin') argumentText = `, {${pluginArguments.split(',').map((name) => name.trim()).filter(Boolean).map(variable).join(', ')}}`;
    const values = [];
    if (options.includeEnable) values.push(`enable=${options.enableKind === 'plugin' ? variable(options.enable) : options.enable}`);
    if (options.includeTag) values.push(`tag=${quote(options.tag)}`);
    if (options.includeImage) values.push(`img_url=${quote(options.image)}`);
    if (options.includeTimeout) values.push(`timeout=${options.timeout}`);
    if (options.debug) values.push('debug=true');
    if ((type === 'request' || type === 'response') && options.requiresBody) values.push('requires_body=true');
    if ((type === 'request' || type === 'response') && options.binaryBody) values.push('binary_body_mode=true');
    const line = `${trigger} then script(${quote(path)}${argumentText})${values.length ? ` with ${values.join(', ')}` : ''}`;
    return includeSection ? `[Script]\n${line}` : line;
  }, [type, conditions, logic, cronKind, cronValue, path, argumentKind, argument, pluginArguments, options, includeSection]);

  const copy = async () => {
    if (issues.length) return;
    await navigator.clipboard.writeText(generated);
    setCopyState('copied');
    window.setTimeout(() => setCopyState('idle'), 1800);
  };

  const http = type === 'request' || type === 'response';
  return (
    <Layout title={t('Script 配置编辑器')} description={t('通过可视化 Trigger、条件、参数与 Options 生成 Loon 3.5.1 (983) 起使用的新 Script 语法')}>
      <main className={styles.page}>
        <section className={styles.hero}><div className={styles.heroInner}><div className={styles.eyebrow}><span>LOON TOOL</span><span>3.5.1 (983)+</span></div><Heading as="h1">{t('Script 配置编辑器')}</Heading><p>{t('选择脚本类型并填写配置，右侧会实时生成可复制的新语法。')}</p><div className={styles.heroLinks}><Link to="/docs/Script/script_v2">{t('查看语法文档 →')}</Link><Link to="/script-converter">{t('转换旧版配置 →')}</Link><span>{t('仅在浏览器本地生成，不会上传配置')}</span></div></div></section>
        <div className={styles.workspace}>
          <div className={styles.editorColumn}>
            <section className={styles.panel}><div className={styles.panelTitle}><span>01</span><div><Heading as="h2">{t('脚本类型')}</Heading></div></div><div className={styles.typeGrid}>{TYPES.map((entry) => <button type="button" key={entry.value} className={type === entry.value ? styles.activeType : ''} onClick={() => changeType(entry.value)}><strong>{entry.label}</strong><small>{t(entry.hint)}</small></button>)}</div></section>

            {http && <section className={styles.panel}><div className={styles.panelTitle}><span>02</span><div><Heading as="h2">{t('匹配条件')}</Heading><p>{t('配置 HTTP Script 的 URL、Method、Header 或插件参数条件。')}</p></div><div className={styles.logic}><button type="button" className={logic === '&&' ? styles.activeLogic : ''} onClick={() => setLogic('&&')}>AND</button><button type="button" className={logic === '||' ? styles.activeLogic : ''} onClick={() => setLogic('||')}>OR</button></div></div><div className={styles.conditionList}>{conditions.map((item, index) => <React.Fragment key={item.id}>{index > 0 && <span className={styles.connector}>{logic === '&&' ? 'AND' : 'OR'}</span>}<ConditionEditor item={item} phase={type} t={t} removable={conditions.length > 1} onChange={(next) => setConditions((current) => current.map((value) => value.id === item.id ? next : value))} onRemove={() => setConditions((current) => current.filter((value) => value.id !== item.id))} /></React.Fragment>)}</div><button type="button" className={styles.addButton} onClick={() => setConditions((current) => [...current, defaultCondition(nextId(), type)])}>＋ {t('添加条件')}</button></section>}

            {type === 'cron' && <section className={styles.panel}><div className={styles.panelTitle}><span>02</span><div><Heading as="h2">{t('Cron 设置')}</Heading></div></div><div className={styles.formGrid}><Field label={t('值类型')}><select value={cronKind} onChange={(e) => {setCronKind(e.target.value); setCronValue(e.target.value === 'plugin' ? 'cron' : '0 8 * * *');}}><option value="fixed">{t('固定表达式')}</option><option value="plugin">{t('插件参数表达式')}</option></select></Field><Field label={cronKind === 'plugin' ? t('参数名') : t('Cron 表达式')} wide><input value={cronValue} onChange={(e) => setCronValue(e.target.value)} /></Field></div></section>}

            <section className={styles.panel}><div className={styles.panelTitle}><span>{http || type === 'cron' ? '03' : '02'}</span><div><Heading as="h2">{t('Script Action')}</Heading></div></div><div className={styles.formGrid}><Field label={t('脚本路径')} wide><input value={path} onChange={(e) => setPath(e.target.value)} placeholder="request.js" /></Field><Field label={t('参数形式')} wide><select value={argumentKind} onChange={(e) => setArgumentKind(e.target.value)}><option value="none">{t('无参数（$argument 为 null）')}</option><option value="string">{t('字符串（$argument 为 String）')}</option><option value="raw">{t('Raw String（$argument 为 String）')}</option><option value="plugin">{t('插件参数（$argument 为 Object）')}</option></select></Field>{argumentKind === 'string' && <Field label={t('字符串参数')} wide><input value={argument} onChange={(e) => setArgument(e.target.value)} /></Field>}{argumentKind === 'raw' && <Field label={t('Raw String 内容')} wide><textarea value={argument} onChange={(e) => setArgument(e.target.value)} /></Field>}{argumentKind === 'plugin' && <Field label={t('插件参数名称')} wide><input value={pluginArguments} onChange={(e) => setPluginArguments(e.target.value)} placeholder={t('多个参数使用逗号分隔，例如 region, level')} /></Field>}</div></section>

            <section className={styles.panel}><div className={styles.panelTitle}><span>{http || type === 'cron' ? '04' : '03'}</span><div><Heading as="h2">{t('Options')}</Heading><p>{t('只选择需要设置的选项。')}</p></div></div><div className={styles.optionGrid}>
              <div className={styles.optionCard}><label><input type="checkbox" checked={options.includeEnable} onChange={(e) => setOption({includeEnable: e.target.checked})} />{t('enable')}</label>{options.includeEnable && <div className={styles.optionInputs}><select value={options.enableKind} onChange={(e) => setOption({enableKind: e.target.value, enable: e.target.value === 'plugin' ? 'enabled' : 'true'})}><option value="boolean">{t('固定布尔值')}</option><option value="plugin">{t('插件 Boolean 参数')}</option></select>{options.enableKind === 'boolean' ? <select value={options.enable} onChange={(e) => setOption({enable: e.target.value})}><option>true</option><option>false</option></select> : <input value={options.enable} onChange={(e) => setOption({enable: e.target.value})} />}</div>}</div>
              <div className={styles.optionCard}><label><input type="checkbox" checked={options.includeTag} onChange={(e) => setOption({includeTag: e.target.checked})} />{t('tag')}</label>{options.includeTag && <input value={options.tag} placeholder={t('显示名称')} onChange={(e) => setOption({tag: e.target.value})} />}</div>
              <div className={styles.optionCard}><label><input type="checkbox" checked={options.includeImage} onChange={(e) => setOption({includeImage: e.target.checked})} />{t('img_url')}</label>{options.includeImage && <input value={options.image} placeholder={t('图标名称或 URL')} onChange={(e) => setOption({image: e.target.value})} />}</div>
              <div className={styles.optionCard}><label><input type="checkbox" checked={options.includeTimeout} onChange={(e) => setOption({includeTimeout: e.target.checked})} />{t('timeout')}</label>{options.includeTimeout && <input type="number" min="1" value={options.timeout} placeholder={t('超时秒数')} onChange={(e) => setOption({timeout: e.target.value})} />}</div>
              <label className={styles.toggleCard}><input type="checkbox" checked={options.debug} onChange={(e) => setOption({debug: e.target.checked})} /><span>{t('debug')}</span></label>
              {http && <><label className={styles.toggleCard}><input type="checkbox" checked={options.requiresBody} onChange={(e) => setOption({requiresBody: e.target.checked})} /><span>{t('等待完整 Body')}</span></label><label className={styles.toggleCard}><input type="checkbox" checked={options.binaryBody} onChange={(e) => setOption({binaryBody: e.target.checked})} /><span>{t('使用二进制 Body 模式')}</span></label></>}
            </div></section>
          </div>

          <aside className={styles.preview}><div className={styles.previewHeader}><div><span>OUTPUT</span><Heading as="h2">{t('生成结果')}</Heading></div><strong className={issues.length ? styles.invalid : styles.ready}>{issues.length ? `${issues.length}` : t('语法就绪')}</strong></div><pre><code>{generated}</code></pre><label className={styles.sectionToggle}><input type="checkbox" checked={includeSection} onChange={(e) => setIncludeSection(e.target.checked)} />{t('包含 `[Script]` 段落标题')}</label>{issues.length > 0 && <div className={styles.issues}><strong>{t('请完善以下内容')}</strong><ul>{issues.map((issue) => <li key={issue}>{t(issue)}</li>)}</ul></div>}<button type="button" className={styles.copyButton} disabled={issues.length > 0} onClick={copy}>{copyState === 'copied' ? t('已复制到剪贴板') : t('复制配置')}</button><p>{t('编辑器只生成配置，不会执行 Script。复制后请在 Loon 中加载并检查日志。')}</p></aside>
        </div>
      </main>
    </Layout>
  );
}
