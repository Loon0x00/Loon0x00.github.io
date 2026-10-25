import React, {useEffect, useRef, useState} from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './plugin-encryptor.module.css';

/** 格式化文件大小；size 为字节数。 */
function fileSize(size) {
  if (size < 1024) {
    return `${size} B`;
  }
  return size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * 启动加密包下载，保留 Blob URL 供页面下方的下载项重复使用。
 * @param {string} url 当前加密包的 Blob URL。
 * @param {string} filename 下载文件名，包含 .lpxe 后缀。
 */
function startDownload(url,
                       filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.hidden = true;
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
  }
}

/** 插件加密工具页面；文件读取、资源检查和加密全部交给浏览器本地 Worker。 */
export default function PluginEncryptor() {
  const {i18n} = useDocusaurusContext();
  const en = i18n.currentLocale === 'en';
  const t = (zh, english) => en ? english : zh;
  const [step, setStep] = useState(1);
  const [selection, setSelection] = useState(null);
  const [entry, setEntry] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [download, setDownload] = useState(null);
  const [urlDialogOpen, setURLDialogOpen] = useState(false);
  const [sourceURL, setSourceURL] = useState('');
  const [urlProgress, setURLProgress] = useState(null);
  const urlDialog = useRef(null);
  const fileInput = useRef(null);
  const folderInput = useRef(null);
  const worker = useRef(null);
  const working = useRef(false);
  const job = useRef(0);
  const downloadURL = useRef(null);

  useEffect(() => () => {
    worker.current?.terminate();
    if (downloadURL.current) {
      URL.revokeObjectURL(downloadURL.current);
    }
  }, []);

  useEffect(() => {
    if (urlDialogOpen && !urlDialog.current.open) {
      urlDialog.current.showModal();
    }
  }, [urlDialogOpen]);

  /** 丢弃上次生成的下载，避免更换文件或入口后误下载旧包。 */
  const clearDownload = () => {
    if (downloadURL.current) {
      URL.revokeObjectURL(downloadURL.current);
      downloadURL.current = null;
    }
    setDownload(null);
  };

  /** 完成本次任务，释放按钮的互斥状态。 */
  const finish = () => {
    working.current = false;
    setBusy('');
  };

  /** 向本地 Worker 提交任务；type 为命令，payload 为文件、目录模式或入口路径。 */
  const send = (type, payload = {}) => {
    working.current = true;
    setBusy(type);
    setError('');
    try {
      if (!worker.current) {
        const instance = new Worker(new URL('../utils/pluginEncryption.worker.js', import.meta.url));
        instance.onmessage = ({data}) => {
          if (data.id !== job.current) {
            return;
          }
          if (data.type === 'imported') {
            if (urlDialog.current?.open) {
              urlDialog.current.close();
            }
            setSelection(data);
            setEntry(data.entry);
            setStep(2);
            if (data.entry) {
              instance.postMessage({id: ++job.current, type: 'analyze', entry: data.entry});
              setBusy('analyze');
            } else {
              finish();
            }
          } else if (data.type === 'progress') {
            setURLProgress(data.progress);
          } else if (data.type === 'analyzed') {
            setAnalysis(data.analysis);
            finish();
          } else if (data.type === 'encrypted') {
            clearDownload();
            const url = URL.createObjectURL(new Blob([data.bytes], {type: 'application/octet-stream'}));
            downloadURL.current = url;
            setDownload({url, filename: data.filename, size: data.bytes.length});
            setStep(3);
            finish();
            startDownload(url, data.filename);
          } else if (data.type === 'error') {
            setError(data.message);
            finish();
          }
        };
        instance.onerror = () => {
          if (worker.current !== instance) {
            return;
          }
          setError(t('本地处理进程运行失败，请重新选择文件。', 'Local processing failed. Please select your files again.'));
          instance.terminate();
          worker.current = null;
          setAnalysis(null);
          finish();
        };
        worker.current = instance;
      }
      worker.current.postMessage({id: ++job.current, type, ...payload});
    } catch (err) {
      setError(err.message);
      finish();
    }
  };

  /** 清理当前导入和 Worker，取消任务时也可调用，不保留插件内容。 */
  const reset = () => {
    worker.current?.terminate();
    worker.current = null;
    job.current++;
    finish();
    clearDownload();
    setSelection(null);
    setEntry('');
    setAnalysis(null);
    setURLProgress(null);
    setError('');
    setStep(1);
  };

  /** 导入本地文件；files 为用户选择的 FileList，directory 表示按文件夹导入。 */
  const importFiles = (files, directory) => {
    if (!files.length || working.current) {
      return;
    }
    const chosen = Array.from(files);
    reset();
    send('import', {files: chosen.map(file => ({file, relativePath: directory ? file.webkitRelativePath : ''})), directory});
  };

  /** 更换入口并重新检查引用；value 为根目录入口路径。 */
  const selectEntry = (value) => {
    clearDownload();
    setEntry(value);
    setAnalysis(null);
    if (value) {
      send('analyze', {entry: value});
    }
  };

  /** 提交 URL 导入；event 为弹窗表单提交事件，成功后直接进入第二步。 */
  const importURL = event => {
    event.preventDefault();
    if (working.current) {
      return;
    }
    reset();
    send('importURL', {url: sourceURL.trim()});
  };

  /** 关闭 URL 弹窗；下载期间终止 Worker，以取消所有尚未结束的资源请求。 */
  const closeURLDialog = () => {
    if (working.current) {
      reset();
    }
    urlDialog.current.close();
  };

  const local = analysis?.references.filter(reference => reference.source === 'package') || [];
  const remote = analysis?.references.filter(reference => reference.source === 'remote') || [];
  const ready = analysis && analysis.entry === entry && !analysis.errors.length;
  const progress = {
    import: t('正在读取文件…', 'Reading files…'),
    analyze: t('正在检查资源引用…', 'Checking resource references…'),
    encrypt: t('正在打包加密…', 'Packing and encrypting…'),
    importURL: urlProgress?.stage === 'resources' ? t(`正在下载资源 ${urlProgress.completed}/${urlProgress.total}…`, `Downloading resources ${urlProgress.completed}/${urlProgress.total}…`) : t('正在下载插件…', 'Downloading plugin…'),
  }[busy];

  return <Layout title={t('插件加密工具', 'Plugin Encryptor')} description={t('在浏览器本地加密 Loon 插件和随包资源，生成 .lpxe 文件。', 'Encrypt Loon plugins and bundled resources locally in your browser to create .lpxe files.')}>
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>LOON / {t('工具', 'TOOLS')}</span>
          <Heading as="h1">{t('插件加密工具', 'Plugin Encryptor')}</Heading>
          <p>{t('将插件与脚本、jq、Mock 资源一起加密，生成一个 .lpxe 文件。', 'Encrypt your plugin and its scripts, jq and Mock resources into a single .lpxe file.')}</p>
        </div>
        <nav className={styles.links} aria-label={t('相关工具', 'Related tools')}><Link to="/rewrite-builder">Rewrite</Link><Link to="/script-builder">Script</Link><Link to="/plugin-converter">{t('插件转换器', 'Plugin Converter')}</Link></nav>
      </header>

      <p className={styles.privacy}><span aria-hidden="true">●</span>{t('内容处理与加密在浏览器本地完成，不上传插件。URL 一键转换会下载所填链接及其引用资源。', 'Processing and encryption stay in your browser. Plugins are not uploaded. URL conversion downloads the supplied plugin and its referenced resources.')}</p>

      <nav aria-label={t('加密步骤', 'Encryption steps')}>
        <ol className={styles.steps}>
          {[t('选择文件', 'Choose files'), t('确认资源', 'Review resources'), t('加密下载', 'Encrypt and download')].map((label, index) => {
            const number = index + 1;
            return <li key={number} className={step === number ? styles.currentStep : ''}>
              <button aria-current={step === number ? 'step' : undefined} disabled={!!busy || (number === 2 && !selection) || (number === 3 && !download)} onClick={() => setStep(number)}><span>{number}</span>{label}</button>
            </li>;
          })}
        </ol>
      </nav>

      {step === 1 && <section className={styles.importPanel} aria-labelledby="import-title">
        <Heading as="h2" id="import-title">{t('选择插件文件或文件夹', 'Choose a plugin or folder')}</Heading>
        <p>{t('插件引用了本地资源时，请选择包含入口插件及所有资源的文件夹。入口插件应位于文件夹根目录。', 'For local resources, choose a folder containing the plugin and all its resources. The entry plugin must be at the folder root.')}</p>
        <aside className={styles.folderExample} aria-labelledby="folder-example-title">
          <Heading as="h3" id="folder-example-title">{t('文件夹示例', 'Example folder')}</Heading>
          <pre><code>{`my-plugin/
├── main.lpx
├── scripts/
│   └── main.js
└── jq/
    └── filter.jq`}</code></pre>
          <p>{t('选择整个', 'Select the entire')} <code>my-plugin</code> {t('文件夹，入口插件为', 'folder. The entry plugin is')} <code>main.lpx</code>{t('。插件中的资源引用填写', '. Reference the resources as')} <code>scripts/main.js</code> {t('和', 'and')} <code>jq/filter.jq</code>{t('。', '.')}</p>
        </aside>
        <input ref={fileInput} type="file" hidden accept=".lpx,.plugin,.conf,.txt" onChange={event => { importFiles(event.target.files, false); event.target.value = ''; }}/>
        <input ref={folderInput} type="file" hidden multiple webkitdirectory="" directory="" onChange={event => { importFiles(event.target.files, true); event.target.value = ''; }}/>
        <div className={styles.actions}>
          <button className={styles.primary} disabled={!!busy} onClick={() => fileInput.current.click()}>{t('选择插件文件', 'Choose plugin')}</button>
          <button disabled={!!busy} onClick={() => folderInput.current.click()}>{t('选择文件夹', 'Choose folder')}</button>
          <button className={styles.textButton} disabled={!!busy} onClick={() => { setError(''); setURLDialogOpen(true); }}>{t('URL 一键转换', 'Convert from URL')}</button>
          {selection && <button disabled={!!busy} onClick={() => setStep(2)}>{t('继续确认资源 →', 'Continue to resources →')}</button>}
        </div>
        <p className={styles.hint}>.lpx · .plugin · .conf · .txt · {t('单文件 ≤ 10 MB，总量 ≤ 32 MB，最多 512 个文件', '10 MB per file, 32 MB total, up to 512 files')}</p>
      </section>}

      <div className={styles.statusBar} aria-live="polite">
        <span>{busy ? progress : selection ? `${selection.files.length} ${t('个文件', 'files')} · ${fileSize(selection.total)}` : t('选择文件后检查资源，再生成加密包。', 'Choose files, review resources, then generate your encrypted package.')}</span>
        {(selection || busy || error) && <button onClick={reset}>{busy ? t('取消', 'Cancel') : t('清空', 'Clear')}</button>}
      </div>
      {error && !urlDialogOpen && <div className={styles.error} role="alert"><strong>{t('无法完成处理', 'Unable to complete processing')}</strong><p>{error}</p>{en && <p>Check the selected plugin, paths and referenced files. Only fixed paths and fixed HTTP/HTTPS URLs are supported in this version.</p>}</div>}

      <div className={styles.workspace} aria-busy={!!busy}>
        {step === 2 && <section className={styles.panel} aria-labelledby="review-title">
          <Heading as="h2" id="review-title">{t('确认入口与资源', 'Review entry and resources')}</Heading>
          {!selection ? <p className={styles.empty}>{t('导入后将在这里显示文件清单和资源引用。', 'The file list and resource references will appear here after import.')}</p> : <>
            <label className={styles.entryLabel} htmlFor="plugin-entry">{t('入口插件', 'Entry plugin')}</label>
            <select id="plugin-entry" value={entry} disabled={!!busy} onChange={event => selectEntry(event.target.value)}>
              <option value="">{t('请选择入口插件', 'Select an entry plugin')}</option>
              {selection.candidates.map(path => <option key={path} value={path}>{path}</option>)}
            </select>
            <div className={styles.fileList} aria-label={t('随包文件', 'Bundled files')}>{selection.files.map(file => <div key={file.path}><div className={styles.fileInfo}><code>{file.path}</code>{file.sourceURL && <small>{file.sourceURL}</small>}</div><span>{fileSize(file.size)}</span></div>)}</div>
            {analysis && <>
              <div className={styles.counts}><span>{local.length} {t('个包内资源引用', 'bundled references')}</span><span>{remote.length} {t('个 URL 引用保持不变', 'URL references kept')}</span></div>
              {analysis.references.length > 0 && <div className={styles.references}>{analysis.references.map((reference, index) => <div key={index}>
                <span className={reference.source === 'remote' ? styles.remote : styles.local}>{reference.source === 'remote' ? 'URL' : t('包内', 'BUNDLED')}</span>
                <code>{reference.reference}</code><small>{reference.kind} · {t('行', 'line')} {reference.line}</small>
              </div>)}</div>}
              {analysis.errors.length > 0 ? <div className={styles.error} role="alert"><strong>{t('请处理以下问题', 'Resolve these issues')}</strong><ul>{analysis.errors.map((issue, index) => <li key={index}>{t('行', 'Line')} {issue.line}：{issue.message}</li>)}</ul></div> : <p className={styles.success}>{t('本地资源检查通过，可以生成加密包。', 'Local resource checks passed. Your package is ready to encrypt.')}</p>}
            </>}
          </>}
          <div className={styles.stepActions}>
            <button disabled={!!busy} onClick={() => setStep(1)}>{t('← 上一步', '← Back')}</button>
            <button className={styles.primary} disabled={!ready || !!busy} onClick={() => { if (!working.current) { clearDownload(); send('encrypt', {entry}); } }}>{busy === 'encrypt' ? progress : t('加密并下载 →', 'Encrypt and download →')}</button>
          </div>
        </section>}

        {step === 3 && <section className={styles.panel} aria-labelledby="export-title">
          <Heading as="h2" id="export-title">{t('加密包已生成', 'Encrypted package ready')}</Heading>
          {download && <div className={styles.result} role="status">
            <strong>{download.filename}</strong><span>{fileSize(download.size)}</span>
            <a className={styles.download} href={download.url} download={download.filename}>{t('下载加密插件', 'Download encrypted plugin')}</a>
          </div>}
        </section>}
      </div>
      <dialog ref={urlDialog} className={styles.urlDialog} aria-labelledby="url-import-title" onClose={() => setURLDialogOpen(false)} onCancel={event => { event.preventDefault(); closeURLDialog(); }} onClick={event => { if (event.target === event.currentTarget) { closeURLDialog(); } }}>
        <form onSubmit={importURL}>
          <Heading as="h2" id="url-import-title">{t('URL 一键转换', 'Convert from URL')}</Heading>
          <p>{t('下载插件及其中引用的脚本、jq、Mock 文件，并将资源引用改为包内路径。', 'Download the plugin and its referenced scripts, jq and Mock files, then replace resource references with bundled paths.')}</p>
          <label htmlFor="plugin-source-url">{t('插件链接', 'Plugin URL')}</label>
          <input id="plugin-source-url" type="url" required autoFocus placeholder="https://example.com/plugin.lpx" value={sourceURL} onChange={event => setSourceURL(event.target.value)} disabled={!!busy}/>
          <p className={styles.hint}>{t('请填写可直接访问插件文本的 HTTP/HTTPS 链接。', 'Enter an HTTP/HTTPS URL that directly returns the plugin text.')}</p>
          {busy && <p className={styles.urlProgress} role="status">{progress}</p>}
          {error && <div className={styles.error} role="alert"><p>{error}</p>{en && <p>Make sure the plugin and resource URLs are accessible and allow cross-origin requests (CORS).</p>}</div>}
          <div className={styles.stepActions}>
            <button type="button" onClick={closeURLDialog}>{t('取消', 'Cancel')}</button>
            <button type="submit" className={styles.primary} disabled={!!busy}>{busy ? t('正在转换…', 'Converting…') : t('下载并转换', 'Download and convert')}</button>
          </div>
        </form>
      </dialog>
    </main>
  </Layout>;
}
