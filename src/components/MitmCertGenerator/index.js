import React, {useEffect, useState} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {createMitmCertificate} from '../../utils/createMitmCertificate.mjs';
import {importMitmCertificate} from '../../utils/importMitmCertificate.mjs';
import {createLoonCaImportUrl} from '../../utils/createLoonCaImportUrl.mjs';
import styles from './styles.module.css';

const importErrors = {
  'duplicate-option': ['配置中有重复的 ca-p12 或 ca-passphrase。', 'The configuration contains a duplicate ca-p12 or ca-passphrase option.'],
  'missing-option': ['请粘贴完整的 ca-passphrase 和 ca-p12 配置。', 'Paste the complete ca-passphrase and ca-p12 configuration.'],
  'invalid-base64': ['ca-p12 不是有效的 Base64 内容。', 'ca-p12 is not valid Base64 data.'],
  'invalid-p12-or-password': ['P12 文件无法解密，请检查 ca-p12 内容和 ca-passphrase。', 'The P12 file could not be decrypted. Check ca-p12 and ca-passphrase.'],
  'missing-ca-key': ['P12 中没有找到与私钥匹配的 CA 证书。', 'No CA certificate matching a private key was found in the P12 file.'],
};

function download(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], {type}));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function StepList({items}) {
  const numbers = ['1️⃣', '2️⃣', '3️⃣'];
  return <ol className={styles.stepList}>
    {items.map((item, index) => <li key={index}>
      <span className={styles.stepNumber} aria-hidden="true">{numbers[index]}</span>
      <span>{item}</span>
    </li>)}
  </ol>;
}

export default function MitmCertGenerator() {
  const {i18n} = useDocusaurusContext();
  const en = i18n.currentLocale === 'en';
  const [mode, setMode] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [pastedConfig, setPastedConfig] = useState('');

  async function selectGenerate() {
    setMode('generate');
    setResult(null);
    setError('');
    setCopied(false);
    setBusy(true);
    try {
      setResult(await createMitmCertificate());
    } catch (cause) {
      setError(en ? 'Certificate generation failed. Open this page over HTTPS or localhost and try again.' : (cause?.message || '证书生成失败，请重试。'));
    } finally {
      setBusy(false);
    }
  }

  function selectImport() {
    setMode('import');
    setResult(null);
    setError('');
    setCopied(false);
    setBusy(false);
  }

  useEffect(() => {
    if (mode !== 'import' || !pastedConfig.trim()) {
      if (mode === 'import') {
        setResult(null);
        setError('');
        setBusy(false);
      }
      return undefined;
    }

    let cancelled = false;
    setResult(null);
    setError('');
    const timer = window.setTimeout(async () => {
      setBusy(true);
      try {
        const imported = await importMitmCertificate(pastedConfig);
        if (!cancelled) setResult(imported);
      } catch (cause) {
        if (!cancelled) {
          setError(importErrors[cause?.code]?.[en ? 1 : 0] || (en ? 'Could not parse this CA configuration.' : '无法解析这段 CA 配置。'));
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [en, mode, pastedConfig]);

  const config = result && `ca-passphrase = ${result.password}\nca-p12 = ${result.p12Base64}`;

  async function copyConfig() {
    try {
      await navigator.clipboard.writeText(config);
      setCopied(true);
    } catch {
      setError(en ? 'Copy failed. Select and copy the configuration below manually.' : '复制失败，请手动选中下方配置内容复制。');
    }
  }

  function installOnIos() {
    download(result.certificatePem, 'loon-ca.crt', 'application/x-x509-ca-cert');
  }

  return <section className={styles.generator} aria-label={en ? 'MitM certificate tool' : 'MitM 证书工具'}>
    <div className={styles.modeActions}>
      <button type="button" onClick={selectGenerate} disabled={busy} className={mode === 'import' ? styles.inactive : styles.primary}>
        {mode === 'generate' && busy ? (en ? 'Generating certificate…' : '正在生成证书…') : (en ? 'Generate MitM CA Certificate' : '生成 MitM CA 证书')}
      </button>
      <button type="button" onClick={selectImport} disabled={busy} className={mode === 'generate' ? styles.inactive : ''}>
        {en ? 'Install Certificate from Existing Configuration' : '安装现有配置中的证书'}
      </button>
    </div>

    {mode === 'generate' && <div className={styles.flow}>
      <p className={styles.intro}>{en ? <><strong>Generated once per click:</strong> Each click creates a new certificate and private key <strong>locally in this browser</strong>. They are <strong>never uploaded to a server</strong>. You cannot recover the certificate, P12 file, or password after refreshing or leaving this page. Import or save them now.</> : <><strong>一次性生成：</strong>每次点击都会生成一套全新的证书和私钥。生成过程仅在<strong>当前浏览器本地</strong>完成，<strong>不会上传服务器</strong>。刷新或离开页面后无法找回本次生成的证书、P12 和密码，请及时导入或备份。</>}</p>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {result && <>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={() => { window.location.href = createLoonCaImportUrl(result); }}>{en ? 'Import into Loon' : '一键导入 Loon'}</button>
          <button type="button" onClick={installOnIos}>{en ? 'Install on iOS Device' : '安装到 iOS 设备'}</button>
        </div>
        <div className={styles.steps}>
          <h2>📋 {en ? 'How to use' : '使用步骤'}</h2>
          <StepList items={en ? [
            <>Tap <strong>“Import into Loon”</strong> to add the certificate to the Loon configuration. <strong className={styles.caution}>On iOS 17 and earlier, Loon may report a parsing failure; you can ignore it.</strong></>,
            <>Return to this page and tap <strong>“Install on iOS Device”</strong> to download the <strong>root certificate</strong> directly, then follow the iOS installation prompts.</>,
            <>Open <strong>Settings → General → About → Certificate Trust Settings</strong> and enable <strong>full trust</strong> for the root certificate.</>,
          ] : [
            <>点<strong>「一键导入 Loon」</strong>将证书导入 Loon 的配置文件。<strong className={styles.caution}>iOS 17 及以下系统可能显示解析失败，不用理会。</strong></>,
            <>回到该页面，点<strong>「安装到 iOS 设备」</strong>直接下载<strong>根证书</strong>，并按 iOS 提示完成安装。</>,
            <>前往<strong>「设置 → 通用 → 关于本机 → 证书信任设置」</strong>，为该根证书开启<strong>完全信任</strong>。</>,
          ]} />
        </div>
        <div className={styles.configHeader}>
          <label htmlFor="mitm-ca-config">{en ? 'Configuration snippet (paste into your existing [MitM] section)' : '配置片段（粘贴到现有的 [MitM] 分区）'}</label>
          <button type="button" className={styles.copyButton} onClick={copyConfig} aria-label={en ? (copied ? 'Configuration copied' : 'Copy configuration') : (copied ? '已复制配置片段' : '复制配置片段')} title={en ? (copied ? 'Copied' : 'Copy configuration') : (copied ? '已复制' : '复制配置')}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              {copied ? <path d="M4 12l5 5L20 6" /> : <><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>}
            </svg>
          </button>
        </div>
        <textarea className={styles.configOutput} id="mitm-ca-config" readOnly value={config} rows={4} onFocus={event => event.target.select()} />
        <div className={styles.backup}>
          <span>{en ? 'Need backup files?' : '需要备份文件？'}</span>
          <button type="button" className={styles.textAction} onClick={() => download(result.certificatePem, 'loon-ca.crt', 'application/x-x509-ca-cert')}>{en ? 'Download CA Certificate' : '下载 CA 证书'}</button>
          <span aria-hidden="true">·</span>
          <button type="button" className={styles.textAction} onClick={() => download(result.p12Bytes, 'loon-ca.p12', 'application/x-pkcs12')}>{en ? 'Download P12' : '下载 P12'}</button>
        </div>
        <p className={styles.warning}>{en ? <><code>ca-p12</code> contains the private key. Do not share your configuration, P12 file, or import link.</> : <><code>ca-p12</code> 含私钥，请勿公开分享配置、P12 文件或导入链接。</>}</p>
      </>}
    </div>}

    {mode === 'import' && <div className={styles.flow}>
      <p className={styles.importNotice}>{en ? <>Open the Loon configuration file, copy the <code>ca-passphrase =</code> and <code>ca-p12 =</code> lines under the <code>[MitM]</code> section, then paste them below.</> : <>请到 Loon 的配置文件中，复制 <code>[MitM]</code> 片段下的 <code>ca-passphrase =</code> 和 <code>ca-p12 =</code> 两行并粘贴到此处。</>}</p>
      <label className={styles.importLabel} htmlFor="mitm-import-config">{en ? 'Loon CA configuration' : 'Loon CA 配置'}</label>
      <textarea className={styles.importInput} id="mitm-import-config" value={pastedConfig} onChange={event => setPastedConfig(event.target.value)} placeholder={'ca-passphrase = ...\nca-p12 = ...'} rows={5} autoComplete="off" spellCheck={false} />
      {busy && <p className={styles.parsing}>{en ? 'Parsing certificate…' : '正在解析证书…'}</p>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {result && !busy && <>
        <div className={styles.importInstall}>
          <button type="button" className={styles.primary} onClick={installOnIos}>{en ? 'Install on iOS Device' : '安装到 iOS 设备'}</button>
        </div>
        <div className={styles.steps}>
          <h2>📋 {en ? 'How to use' : '使用方式'}</h2>
          <StepList items={en ? [
            <>Tap <strong>“Install on iOS Device”</strong> to download the <strong>root certificate</strong> directly, then follow the iOS installation prompts.</>,
            <>Open <strong>Settings → General → About → Certificate Trust Settings</strong> and enable <strong>full trust</strong> for the root certificate.</>,
          ] : [
            <>点<strong>「安装到 iOS 设备」</strong>直接下载<strong>根证书</strong>，并按 iOS 提示完成安装。</>,
            <>前往<strong>「设置 → 通用 → 关于本机 → 证书信任设置」</strong>，为该根证书开启<strong>完全信任</strong>。</>,
          ]} />
        </div>
      </>}
    </div>}
  </section>;
}
