import React, {useMemo, useState} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import {
  convertLegacyRewrite,
  LEGACY_REWRITE_EXAMPLE,
} from '../utils/rewriteConverter.mjs';
import styles from './rewrite-converter.module.css';

const EN_TEXT = {
  'Rewrite 语法转换器': 'Rewrite Syntax Converter',
  '将旧版 Rewrite 配置转换为 Loon 3.5.1 (978) 起使用的新语法':
    'Convert legacy Rewrite configuration to the new syntax used since Loon 3.5.1 (978)',
  '粘贴旧版配置，转换器会逐行迁移 Action、URL 正则和捕获引用，并保留注释与无法识别的内容。':
    'Paste legacy configuration to migrate actions, URL regexes, and capture references line by line while preserving comments and unrecognized content.',
  '旧版语法文档': 'Legacy syntax guide',
  '新版语法文档': 'New syntax guide',
  '打开配置生成器': 'Open Rewrite Builder',
  '所有转换都在浏览器本地完成，不会上传配置':
    'All conversion happens locally in your browser; no configuration is uploaded',
  '加载示例': 'Load example',
  '清空输入': 'Clear input',
  '未识别的行会保留原文，并在下方显示原因。':
    'Unrecognized lines are kept unchanged, with the reason shown below.',
  '无 `[Rewrite]` 段落时自动添加标题':
    'Add `[Rewrite]` when the input has no section heading',
  '旧版配置': 'Legacy configuration',
  '在这里粘贴旧 Rewrite 配置': 'Paste legacy Rewrite configuration here',
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
  '转换器只负责语法迁移，不会执行 Rewrite。复制后请在 Loon 中加载配置并检查日志。':
    'The converter migrates syntax only; it does not run Rewrite. Load the result in Loon and check the logs.',
  '行': 'Line',
};

function translate(text, isEnglish) {
  return isEnglish ? EN_TEXT[text] || text : text;
}

function translateIssue(message, isEnglish) {
  if (!isEnglish) {
    return message;
  }

  const exact = {
    '引号没有闭合': 'A quote is not closed',
    '无法识别旧 Rewrite 的 URL 正则和 Action，已保留原文':
      'Could not identify the legacy URL regex and action; the original line was kept',
    'Mock 缺少 data-type，已保留原文':
      'The mock is missing data-type; the original line was kept',
    'Mock 的 data 和 data-path 不能同时存在，已保留原文':
      'The mock cannot contain both data and data-path; the original line was kept',
    'Mock 缺少 data 或 data-path，已保留原文':
      'The mock is missing data or data-path; the original line was kept',
    'mock-data-is-base64 只能是 true 或 false，已保留原文':
      'mock-data-is-base64 must be true or false; the original line was kept',
    'mock-request-body 不支持 status-code，已保留原文':
      'mock-request-body does not support status-code; the original line was kept',
    'Mock 响应状态码必须是 100 到 599 的整数，已保留原文':
      'The mock response status must be an integer from 100 through 599; the original line was kept',
  };
  if (exact[message]) {
    return exact[message];
  }

  let match = message.match(/^无法识别旧 Action：(.+)，已保留原文$/);
  if (match) {
    return `Unrecognized legacy action: ${match[1]}; the original line was kept`;
  }
  match = message.match(/^无法识别 Mock 参数 (.+)，已保留原文$/);
  if (match) {
    return `Unrecognized mock argument ${match[1]}; the original line was kept`;
  }
  match = message.match(/^(.+) 参数不足，已保留原文$/);
  if (match) {
    return `${match[1]} does not have enough arguments; the original line was kept`;
  }
  match = message.match(/^(.+) 不接受参数，已保留原文$/);
  if (match) {
    return `${match[1]} does not accept arguments; the original line was kept`;
  }
  match = message.match(
    /^(.+) 需要按每 (\d+) 个参数一组填写，已保留原文$/,
  );
  if (match) {
    return `${match[1]} expects argument groups of ${match[2]}; the original line was kept`;
  }
  match = message.match(
    /^URL 正则只有 (\d+) 个捕获组，不能引用 \$(\d+)$/,
  );
  if (match) {
    return `The URL regex has ${match[1]} capture groups and cannot reference $${match[2]}`;
  }
  match = message.match(/^暂不支持旧 Action：(.+)，已保留原文$/);
  if (match) {
    return `Unsupported legacy action: ${match[1]}; the original line was kept`;
  }
  return message;
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

export default function RewriteConverter() {
  const {i18n} = useDocusaurusContext();
  const isEnglish = i18n.currentLocale === 'en';
  const t = (text) => translate(text, isEnglish);
  const [source, setSource] = useState(LEGACY_REWRITE_EXAMPLE);
  const [includeSection, setIncludeSection] = useState(true);
  const [copyState, setCopyState] = useState('idle');

  const result = useMemo(
    () => convertLegacyRewrite(source, {includeSection}),
    [source, includeSection],
  );

  const updateSource = (value) => {
    setSource(value);
    setCopyState('idle');
  };

  const copyOutput = async () => {
    if (!result.output) {
      return;
    }
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
      document.body.removeChild(textarea);
    }
    setCopyState('copied');
    window.setTimeout(() => setCopyState('idle'), 1800);
  };

  return (
    <Layout
      title={t('Rewrite 语法转换器')}
      description={t(
        '将旧版 Rewrite 配置转换为 Loon 3.5.1 (978) 起使用的新语法',
      )}>
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroGlow} />
          <div className={styles.heroInner}>
            <div className={styles.eyebrow}>
              <span>LOON TOOL</span>
              <span className={styles.versionBadge}>LEGACY → NEW</span>
            </div>
            <Heading as="h1">{t('Rewrite 语法转换器')}</Heading>
            <p>
              {t(
                '粘贴旧版配置，转换器会逐行迁移 Action、URL 正则和捕获引用，并保留注释与无法识别的内容。',
              )}
            </p>
            <div className={styles.heroLinks}>
              <Link to="/docs/Rewrite/">
                {t('旧版语法文档')}
              </Link>
              <Link to="/docs/Rewrite/rewrite_v2">
                {t('新版语法文档')}
              </Link>
              <Link to="/rewrite-builder">
                {t('打开配置生成器')}
              </Link>
              <span>
                {t('所有转换都在浏览器本地完成，不会上传配置')}
              </span>
            </div>
          </div>
        </section>

        <section className={styles.workspace}>
          <div className={styles.toolbar}>
            <div className={styles.toolbarActions}>
              <button
                type="button"
                onClick={() => updateSource(LEGACY_REWRITE_EXAMPLE)}>
                {t('加载示例')}
              </button>
              <button
                type="button"
                className={styles.clearButton}
                onClick={() => updateSource('')}>
                {t('清空输入')}
              </button>
            </div>
            <label className={styles.sectionOption}>
              <input
                type="checkbox"
                checked={includeSection}
                onChange={(event) =>
                  setIncludeSection(event.target.checked)
                }
              />
              {t('无 `[Rewrite]` 段落时自动添加标题')}
            </label>
          </div>

          <p className={styles.helperText}>
            {t('未识别的行会保留原文，并在下方显示原因。')}
          </p>

          <div className={styles.editorGrid}>
            <section className={styles.editorPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <span>INPUT</span>
                  <Heading as="h2">{t('旧版配置')}</Heading>
                </div>
                <strong>{source ? source.split(/\r?\n/).length : 0}</strong>
              </div>
              <textarea
                className={styles.inputArea}
                value={source}
                spellCheck="false"
                aria-label={t('旧版配置')}
                placeholder={t('在这里粘贴旧 Rewrite 配置')}
                onChange={(event) => updateSource(event.target.value)}
              />
            </section>

            <div className={styles.convertArrow} aria-hidden="true">
              <ArrowIcon />
            </div>

            <section className={styles.editorPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <span>OUTPUT</span>
                  <Heading as="h2">{t('新版配置')}</Heading>
                </div>
                <span
                  className={
                    result.stats.failed
                      ? styles.statusWarning
                      : styles.statusReady
                  }>
                  {result.stats.failed
                    ? t('存在需要检查的配置行')
                    : t('转换完成')}
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
              <div>
                <strong>{result.stats.converted}</strong>
                <span>{t('已转换')}</span>
              </div>
              <div>
                <strong>{result.stats.unchanged}</strong>
                <span>{t('未修改')}</span>
              </div>
              <div>
                <strong>{result.stats.failed}</strong>
                <span>{t('需检查')}</span>
              </div>
            </div>
            <button
              type="button"
              className={styles.copyButton}
              disabled={!result.output}
              onClick={copyOutput}>
              <CopyIcon />
              {copyState === 'copied'
                ? t('已复制到剪贴板')
                : t('复制新配置')}
            </button>
          </div>

          <section className={styles.issuePanel}>
            <div className={styles.issueHeading}>
              <span>CHECK</span>
              <Heading as="h2">{t('转换提示')}</Heading>
            </div>
            {result.issues.length ? (
              <ul>
                {result.issues.map((issue, index) => (
                  <li
                    key={`${issue.line}-${index}`}
                    className={
                      issue.level === 'error'
                        ? styles.issueError
                        : styles.issueWarning
                    }>
                    <span>
                      {t('行')} {issue.line}
                    </span>
                    {translateIssue(issue.message, isEnglish)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.noIssues}>
                {t('没有需要处理的问题')}
              </p>
            )}
          </section>

          <p className={styles.footnote}>
            {t(
              '转换器只负责语法迁移，不会执行 Rewrite。复制后请在 Loon 中加载配置并检查日志。',
            )}
          </p>
        </section>
      </main>
    </Layout>
  );
}
