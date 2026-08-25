import React, {useMemo, useState} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import {
  convertLegacyScript,
  LEGACY_SCRIPT_EXAMPLE,
} from '../utils/scriptConverter.mjs';
import styles from './rewrite-converter.module.css';

const EN_TEXT = {
  'Script 语法转换器': 'Script Syntax Converter',
  '将旧版 Script 配置转换为 Loon 3.5.1 (983) 起使用的新语法':
    'Convert legacy Script configuration to the new syntax used since Loon 3.5.1 (983)',
  '粘贴旧版配置，转换器会迁移 Trigger、脚本路径、$argument 和指令属性，并保留注释与无法识别的内容。':
    'Paste legacy configuration to migrate triggers, script paths, $argument, and entry options while preserving comments and unrecognized content.',
  '旧版语法文档': 'Legacy syntax guide',
  '新版语法文档': 'New syntax guide',
  '打开 Script 编辑器': 'Open Script Editor',
  '所有转换都在浏览器本地完成，不会上传配置':
    'All conversion happens locally in your browser; no configuration is uploaded',
  '加载示例': 'Load example',
  '清空输入': 'Clear input',
  '无 `[Script]` 段落时自动添加标题':
    'Add `[Script]` when the input has no section heading',
  '未识别或无法安全迁移的行会保留原文，并在下方显示原因。':
    'Unrecognized or unsafe entries are kept unchanged, with the reason shown below.',
  '旧版配置': 'Legacy configuration',
  '在这里粘贴旧 Script 配置': 'Paste legacy Script configuration here',
  '新版配置': 'New configuration',
  '转换结果会显示在这里': 'Converted configuration appears here',
  '已转换': 'Converted',
  '未修改': 'Unchanged',
  '需检查': 'Needs review',
  '转换完成': 'Conversion complete',
  '存在需要检查的配置行': 'Some configuration lines need review',
  '转换提示': 'Conversion notes',
  '没有需要处理的问题': 'No issues to review',
  '复制新配置': 'Copy new configuration',
  '已复制到剪贴板': 'Copied to clipboard',
  '转换器只负责语法迁移，不会执行 Script。复制后请在 Loon 中加载配置并检查日志。':
    'The converter migrates syntax only; it does not run scripts. Load the result in Loon and check the logs.',
  '行': 'Line',
};

function translate(text, isEnglish) {
  return isEnglish ? EN_TEXT[text] || text : text;
}

function translateIssue(message, isEnglish) {
  if (!isEnglish) {
    return message;
  }
  const replacements = [
    [/，已保留原文$/, '; the original line was kept'],
    [/无法识别旧 Script 类型/, 'Unrecognized legacy Script type'],
    [/缺少 URL 正则/, 'is missing a URL regular expression'],
    [/缺少 script-path/, 'Missing script-path'],
    [/script-path 不能为空/, 'script-path cannot be empty'],
    [/引号或花括号没有闭合/, 'A quote or brace is not closed'],
    [/Cron 表达式的引号没有闭合/, 'The Cron expression quote is not closed'],
    [/Cron 表达式必须使用字符串或插件参数/, 'A Cron expression must be a string or plugin parameter'],
    [/argument 插件参数对象不能为空/, 'The argument plugin object cannot be empty'],
    [/argument 包含无效的插件参数名/, 'The argument contains an invalid plugin parameter name'],
    [/argument 中的插件参数不能重复/, 'Plugin parameters in argument cannot be repeated'],
    [/只能用于 HTTP Script/, 'can be used only by HTTP scripts'],
    [/不支持插件变量/, 'does not support plugin variables'],
    [/必须是 true 或 false/, 'must be true or false'],
    [/timeout 必须是大于 0 的数字/, 'timeout must be a number greater than 0'],
    [/无法识别旧参数：/, 'Unrecognized legacy option: '],
    [/无法识别参数：/, 'Unrecognized option: '],
    [/参数 (.+) 缺少值/, 'Option $1 is missing a value'],
    [/参数 (.+) 重复/, 'Option $1 is repeated'],
  ];
  return replacements.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    message,
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

export default function ScriptConverter() {
  const {i18n} = useDocusaurusContext();
  const isEnglish = i18n.currentLocale === 'en';
  const t = (text) => translate(text, isEnglish);
  const [source, setSource] = useState(LEGACY_SCRIPT_EXAMPLE);
  const [includeSection, setIncludeSection] = useState(true);
  const [copyState, setCopyState] = useState('idle');
  const result = useMemo(
    () => convertLegacyScript(source, {includeSection}),
    [source, includeSection],
  );

  const updateSource = (value) => {
    setSource(value);
    setCopyState('idle');
  };

  const copyOutput = async () => {
    if (!result.output) return;
    try {
      await navigator.clipboard.writeText(result.output);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = result.output;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    setCopyState('copied');
    window.setTimeout(() => setCopyState('idle'), 1800);
  };

  return (
    <Layout
      title={t('Script 语法转换器')}
      description={t(
        '将旧版 Script 配置转换为 Loon 3.5.1 (983) 起使用的新语法',
      )}>
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroGlow} />
          <div className={styles.heroInner}>
            <div className={styles.eyebrow}>
              <span>LOON TOOL</span>
              <span className={styles.versionBadge}>LEGACY → NEW</span>
            </div>
            <Heading as="h1">{t('Script 语法转换器')}</Heading>
            <p>
              {t(
                '粘贴旧版配置，转换器会迁移 Trigger、脚本路径、$argument 和指令属性，并保留注释与无法识别的内容。',
              )}
            </p>
            <div className={styles.heroLinks}>
              <Link to="/docs/Script/">{t('旧版语法文档')}</Link>
              <Link to="/docs/Script/script_v2">{t('新版语法文档')}</Link>
              <Link to="/script-builder">{t('打开 Script 编辑器')}</Link>
              <span>{t('所有转换都在浏览器本地完成，不会上传配置')}</span>
            </div>
          </div>
        </section>

        <section className={styles.workspace}>
          <div className={styles.toolbar}>
            <div className={styles.toolbarActions}>
              <button type="button" onClick={() => updateSource(LEGACY_SCRIPT_EXAMPLE)}>
                {t('加载示例')}
              </button>
              <button type="button" className={styles.clearButton} onClick={() => updateSource('')}>
                {t('清空输入')}
              </button>
            </div>
            <label className={styles.sectionOption}>
              <input
                type="checkbox"
                checked={includeSection}
                onChange={(event) => setIncludeSection(event.target.checked)}
              />
              {t('无 `[Script]` 段落时自动添加标题')}
            </label>
          </div>
          <p className={styles.helperText}>
            {t('未识别或无法安全迁移的行会保留原文，并在下方显示原因。')}
          </p>

          <div className={styles.editorGrid}>
            <section className={styles.editorPanel}>
              <div className={styles.panelHeader}>
                <div><span>INPUT</span><Heading as="h2">{t('旧版配置')}</Heading></div>
                <strong>{source ? source.split(/\r?\n/).length : 0}</strong>
              </div>
              <textarea
                className={styles.inputArea}
                value={source}
                spellCheck="false"
                aria-label={t('旧版配置')}
                placeholder={t('在这里粘贴旧 Script 配置')}
                onChange={(event) => updateSource(event.target.value)}
              />
            </section>

            <div className={styles.convertArrow} aria-hidden="true"><ArrowIcon /></div>

            <section className={styles.editorPanel}>
              <div className={styles.panelHeader}>
                <div><span>OUTPUT</span><Heading as="h2">{t('新版配置')}</Heading></div>
                <span className={result.stats.failed ? styles.statusWarning : styles.statusReady}>
                  {result.stats.failed ? t('存在需要检查的配置行') : t('转换完成')}
                </span>
              </div>
              <textarea
                className={styles.outputArea}
                value={result.output}
                readOnly
                spellCheck="false"
                aria-label={t('新版配置')}
                placeholder={t('转换结果会显示在这里')}
              />
            </section>
          </div>

          <div className={styles.resultBar}>
            <div className={styles.metrics}>
              <div><strong>{result.stats.converted}</strong><span>{t('已转换')}</span></div>
              <div><strong>{result.stats.unchanged}</strong><span>{t('未修改')}</span></div>
              <div><strong>{result.stats.failed}</strong><span>{t('需检查')}</span></div>
            </div>
            <button type="button" className={styles.copyButton} onClick={copyOutput} disabled={!result.output}>
              <CopyIcon />
              {copyState === 'copied' ? t('已复制到剪贴板') : t('复制新配置')}
            </button>
          </div>

          <section className={styles.issuePanel}>
            <div className={styles.issueHeading}>
              <span>CHECK</span>
              <Heading as="h2">{t('转换提示')}</Heading>
            </div>
            {result.issues.length > 0 ? (
              <ul>
                {result.issues.map((issue, index) => (
                  <li
                    key={`${issue.line}-${index}`}
                    className={issue.level === 'error' ? styles.issueError : styles.issueWarning}>
                    <span>{t('行')} {issue.line}</span>
                    {translateIssue(issue.message, isEnglish)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.noIssues}>{t('没有需要处理的问题')}</p>
            )}
          </section>

          <p className={styles.footnote}>
            {t('转换器只负责语法迁移，不会执行 Script。复制后请在 Loon 中加载配置并检查日志。')}
          </p>
        </section>
      </main>
    </Layout>
  );
}
