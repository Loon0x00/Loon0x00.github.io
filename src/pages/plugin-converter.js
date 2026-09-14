import React, {useEffect, useRef, useState} from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {uniquePath} from '../utils/pluginBatch.mjs';
import styles from './plugin-converter.module.css';

function saveFile(content, name, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], {type}));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function PluginConverter() {
  const {i18n} = useDocusaurusContext();
  const en = i18n.currentLocale === 'en';
  const t = (zh, english) => en ? english : zh;
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [active, setActive] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const input = useRef(null);
  const worker = useRef(null);
  const working = useRef(false);
  const nextId = useRef(0);
  const paths = useRef(new Set());
  useEffect(() => () => worker.current?.terminate(), []);
  const finish = () => { working.current = false; setBusy(false); setProgress(''); };
  const getWorker = () => {
    if (worker.current) return worker.current;
    const instance = new Worker(new URL('../utils/pluginConverter.worker.js', import.meta.url));
    instance.onmessage = ({data}) => {
      if (data.type === 'result') {
        const result = {...data.result, id: ++nextId.current, path: uniquePath(data.result.path, paths.current)};
        setResults(previous => [...previous, result]);
        setActive(previous => previous ?? result.id);
        if (typeof result.text === 'string') setSelected(previous => new Set([...previous, result.id]));
      } else if (data.type === 'progress') {
        setProgress(`${data.progress.current} / ${data.progress.total} · ${data.progress.file}`);
      } else if (data.type === 'done') finish();
      else if (data.type === 'zip') {
        saveFile(data.bytes, 'converted-plugins.zip', 'application/zip');
        finish();
      } else if (data.type === 'error') { setError(data.message); finish(); }
    };
    instance.onerror = () => {
      setError(t('转换进程加载或运行失败，请重试。', 'The conversion worker failed. Please try again.'));
      instance.terminate(); worker.current = null; finish();
    };
    worker.current = instance;
    return instance;
  };
  const importFiles = (files) => {
    if (!files.length || working.current) return;
    setError(''); working.current = true; setBusy(true);
    setProgress(t('正在读取文件…', 'Reading files…'));
    try { getWorker().postMessage({type: 'import', files: Array.from(files)}); }
    catch (err) { setError(err.message); finish(); }
  };
  const downloadBatch = () => {
    if (working.current) return;
    const chosen = results.filter(result => selected.has(result.id) && typeof result.text === 'string');
    if (!chosen.length) return;
    working.current = true; setBusy(true); setError('');
    setProgress(t('正在打包…', 'Preparing ZIP…'));
    try { getWorker().postMessage({type: 'zip', results: chosen.map(({original, ...result}) => result)}); }
    catch (err) { setError(err.message); finish(); }
  };
  const cancel = () => { worker.current?.terminate(); worker.current = null; finish(); };
  const clear = () => { setResults([]); setSelected(new Set()); setActive(null); paths.current.clear(); setError(''); };
  const available = results.filter(result => typeof result.text === 'string');
  const current = results.find(result => result.id === active);
  const status = (value) => ({
    converted: t('已转换', 'Converted'), unchanged: t('无需转换', 'Unchanged'),
    partial: t('需检查', 'Needs review'), failed: t('导入失败', 'Import failed'),
  }[value]);

  return <Layout title={t('插件转换器', 'Plugin Converter')} description={t('将旧版 Loon 插件转换为 Loon 3.5.1 及后续版本使用的新版 Script、Rewrite 语法，支持单个、批量及 ZIP/RAR 导入。', 'Convert legacy Loon plugins to the new Script and Rewrite syntax used in Loon 3.5.1 and later, with individual, batch, ZIP and RAR imports.')}>
    <main className={styles.page}>
      <header className={styles.header}>
        <div><span className={styles.eyebrow}>LOON / {t('工具', 'TOOLS')}</span>
          <Heading as="h1">{t('插件转换器', 'Plugin Converter')}</Heading>
          <p>{t('将旧版插件转换为 Loon 3.5.1 及后续版本使用的新版 Script、Rewrite 语法。', 'Convert legacy plugins to the new Script and Rewrite syntax used in Loon 3.5.1 and later.')}</p>
        </div>
        <div className={styles.links}><Link to="/rewrite-converter">Rewrite</Link><Link to="/script-converter">Script</Link></div>
      </header>
      <p className={styles.privacy}>{t('转换范围包括 [Rewrite]、[URL Rewrite] 和 [Script] 分区；插件信息、[Argument] 参数声明、注释及其他分区原样保留。已有的新语法无需重复转换，无法转换的规则会保留原文并提示原因。下载后请在支持新版语法的 Loon 中加载并检查运行日志。', 'Conversion covers [Rewrite], [URL Rewrite] and [Script]. Plugin metadata, [Argument] declarations, comments and other sections are preserved. Existing new syntax is left unchanged; rules that cannot be converted are retained with an explanation. After downloading, load the plugin in a Loon version that supports the new syntax and check its logs.')}</p>
      <section className={`${styles.dropzone} ${dragging ? styles.dragging : ''}`} aria-label={t('导入插件', 'Import plugins')}
        onDragOver={event => { event.preventDefault(); if (!busy) setDragging(true); }}
        onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }}
        onDrop={event => { event.preventDefault(); setDragging(false); importFiles(event.dataTransfer.files); }}>
        <svg className={styles.uploadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M12 16V3m-5 5 5-5 5 5M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/></svg>
        <Heading as="h2">{t('拖入插件或压缩包', 'Drop plugins or archives here')}</Heading>
        <p>{t('单个文件、多个文件、ZIP 或 RAR，导入后自动转换。', 'One file, multiple files, ZIP or RAR. Conversion starts on import.')}</p>
        <input ref={input} type="file" multiple hidden accept=".lpx,.plugin,.conf,.txt,.zip,.rar" onChange={event => { importFiles(event.target.files); event.target.value = ''; }}/>
        <button className={styles.primary} disabled={busy} onClick={() => input.current.click()}>{t('选择文件', 'Choose files')}</button>
        <span className={styles.hint}>.lpx · .plugin · .conf · .txt · .zip · .rar</span>
      </section>
      <p className={styles.privacy}>{t('全部处理在浏览器本地完成，不上传文件。原插件不会被覆盖。压缩包仅提取插件文件。', 'Files are processed locally in your browser and are never uploaded. Originals are preserved. Only plugin files are extracted.')}</p>
      <div className={styles.toolbar}>
        <div aria-live="polite">{busy ? progress : `${results.length} ${t('个文件', 'files')} · ${results.reduce((sum, result) => sum + result.converted, 0)} ${t('条规则已转换', 'rules converted')}`}</div>
        <div className={styles.actions}>
          {busy && <button onClick={cancel}>{t('停止', 'Stop')}</button>}
          <button disabled={!results.length || busy} onClick={clear}>{t('清空', 'Clear')}</button>
          <button className={styles.primary} disabled={!selected.size || busy} onClick={downloadBatch}>{t('下载所选 ZIP', 'Download selected ZIP')} ({selected.size})</button>
        </div>
      </div>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <div className={styles.workspace}>
        <section className={styles.files} aria-label={t('转换结果', 'Conversion results')}>
          <div className={styles.listHeader}><label><input type="checkbox" checked={available.length > 0 && selected.size === available.length} disabled={!available.length} onChange={event => setSelected(event.target.checked ? new Set(available.map(result => result.id)) : new Set())}/>{t('全选', 'Select all')}</label><span>{t('文件 / 状态', 'File / status')}</span></div>
          {!results.length && <div className={styles.empty}>{t('导入插件后，在这里查看转换结果。', 'Import plugins to see their conversion results here.')}</div>}
          {results.map(result => <div className={`${styles.file} ${active === result.id ? styles.active : ''}`} key={result.id}>
            <input type="checkbox" aria-label={`${t('选择', 'Select')} ${result.path}`} disabled={typeof result.text !== 'string'} checked={selected.has(result.id)} onChange={event => setSelected(previous => { const next = new Set(previous); event.target.checked ? next.add(result.id) : next.delete(result.id); return next; })}/>
            <button className={styles.fileButton} onClick={() => setActive(result.id)}><strong>{result.name || result.path.split('/').pop()}</strong><span>{result.path}</span><small className={result.status === 'partial' || result.status === 'failed' ? styles.warning : styles.success}>{status(result.status)}{result.converted ? ` · ${result.converted} ${t('条', 'rules')}` : ''}</small></button>
          </div>)}
        </section>
        <section className={styles.detail} aria-label={t('插件详情', 'Plugin details')}>
          {!current ? <div className={styles.empty}><Heading as="h2">{t('查看插件转换详情', 'Inspect converted plugins')}</Heading><p>{t('保留元信息、参数、注释和其他分区，逐条列出无法转换的规则。', 'Metadata, arguments, comments and other sections are preserved. Rules that need review are listed individually.')}</p></div> : <>
            <div className={styles.detailHeader}><div><Heading as="h2">{current.name || current.path.split('/').pop()}</Heading><p>{current.path}</p></div>
              {typeof current.text === 'string' && <button onClick={() => saveFile(current.text, current.path.split('/').pop())}>{t('下载插件', 'Download plugin')}</button>}
            </div>
            {current.error && <p role="alert" className={styles.error}>{current.error}</p>}
            {current.counts && <p className={styles.counts}>Rewrite: {current.counts.rewrite.converted} / {current.counts.rewrite.total} · Script: {current.counts.script.converted} / {current.counts.script.total} {t('已转换', 'converted')}</p>}
            {!!current.diagnostics?.length && <div className={styles.diagnostics}><strong>{t('以下规则保留原文，请检查后使用', 'These rules were kept unchanged and need review')}</strong><ul>{current.diagnostics.map((issue, index) => <li key={index}>{t('行', 'Line')} {issue.line} · {issue.kind}: {issue.message}</li>)}</ul></div>}
            {typeof current.text === 'string' && <div className={styles.editors}><label>{t('原插件', 'Original')}<textarea readOnly spellCheck={false} value={current.original} /></label><label>{t('转换结果', 'Converted')}<textarea readOnly spellCheck={false} value={current.text}/></label></div>}
          </>}
        </section>
      </div>
      <p className={styles.footnote}>{t('每个导入文件 ≤ 50 MB，每个插件 ≤ 10 MB；单批解压总量 ≤ 100 MB、最多 1000 个插件。加密或分卷压缩包请先解压再导入。批量 ZIP 包含转换报告。', 'Up to 50 MB per upload, 10 MB per plugin, and 100 MB / 1,000 extracted plugins per batch. Extract encrypted or multipart archives before importing. Batch ZIP downloads include a conversion report.')}</p>
    </main>
  </Layout>;
}
