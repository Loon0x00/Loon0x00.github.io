import React, {useState} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {createMitmCertificate} from '../../utils/createMitmCertificate.mjs';
import {importMitmCertificate} from '../../utils/importMitmCertificate.mjs';
import {createLoonCaImportUrl} from '../../utils/createLoonCaImportUrl.mjs';
import {createIosCertificateProfile} from '../../utils/createIosCertificateProfile.mjs';
import styles from './styles.module.css';

const importErrors = {
  'duplicate-option': ['配置中有重复的 ca-p12 或 ca-passphrase。', 'The configuration contains a duplicate ca-p12 or ca-passphrase option.'],
  'missing-option': ['请粘贴包含 ca-p12 和 ca-passphrase 的配置。', 'Paste a configuration containing both ca-p12 and ca-passphrase.'],
  'invalid-base64': ['ca-p12 不是有效的 Base64 内容。', 'ca-p12 is not valid Base64 data.'],
  'invalid-p12-or-password': ['P12 文件无法解密，请检查内容和密码。', 'The P12 file could not be decrypted. Check the data and password.'],
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

export default function MitmCertGenerator() {
  const {i18n} = useDocusaurusContext();
  const en = i18n.currentLocale === 'en';
  const [busy, setBusy] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [pastedConfig, setPastedConfig] = useState('');

  async function generate() {
    setBusy('generate');
    setError('');
    try {
      setResult({...await createMitmCertificate(), source: 'generated'});
      setCopied(false);
    } catch (cause) {
      setError(en ? 'Certificate generation failed. Open this page over HTTPS or localhost and try again.' : (cause?.message || '证书生成失败，请重试。'));
    } finally {
      setBusy(null);
    }
  }

  async function importConfig(event) {
    event.preventDefault();
    setBusy('import');
    setError('');
    try {
      setResult({...await importMitmCertificate(pastedConfig), source: 'imported'});
      setPastedConfig('');
      setCopied(false);
    } catch (cause) {
      setError(importErrors[cause?.code]?.[en ? 1 : 0] || (en ? 'Could not import the P12 configuration.' : '无法导入 P12 配置。'));
    } finally {
      setBusy(null);
    }
  }

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
    try {
      const profile = createIosCertificateProfile(result.certificatePem);
      download(profile, 'loon-ca.mobileconfig', 'application/x-apple-aspen-config');
    } catch {
      setError(en ? 'Could not create the iOS profile in this browser.' : '此浏览器无法创建 iOS 描述文件。');
    }
  }

  return <section className={styles.generator} aria-label={en ? 'MitM certificate tool' : 'MitM 证书工具'}>
    <p className={styles.intro}>{en ? <><strong>Generated once per click:</strong> Each click creates a new certificate and private key <strong>locally in this browser</strong>. They are <strong>never uploaded to a server</strong>. You cannot recover the certificate, P12 file, or password after refreshing or leaving this page. Import or save them now.</> : <><strong>一次性生成：</strong>每次点击都会生成一套全新的证书和私钥。生成过程仅在<strong>当前浏览器本地</strong>完成，<strong>不会上传服务器</strong>。刷新或离开页面后无法找回本次生成的证书、P12 和密码，请及时导入或备份。</>}</p>
    <button type="button" onClick={generate} disabled={busy} className={styles.primary}>
      {busy === 'generate' ? (en ? 'Generating certificate…' : '正在生成证书…') : (en ? 'Generate MitM CA Certificate' : '生成 MitM CA 证书')}
    </button>
    <form className={styles.importPanel} onSubmit={importConfig}>
      <h2>{en ? 'Use an existing Loon CA configuration' : '使用已有的 Loon CA 配置'}</h2>
      <p>{en ? 'Paste the ca-passphrase and ca-p12 lines from Loon. The P12 file is decoded only in this browser and is never uploaded.' : '粘贴 Loon 配置中的 ca-passphrase 和 ca-p12 两行。P12 仅在当前浏览器解析，不会上传。'}</p>
      <label htmlFor="mitm-import-config">{en ? 'Loon CA configuration' : 'Loon CA 配置'}</label>
      <textarea id="mitm-import-config" value={pastedConfig} onChange={event => setPastedConfig(event.target.value)} placeholder={'ca-passphrase = ...\nca-p12 = ...'} rows={4} autoComplete="off" spellCheck={false} />
      <button type="submit" disabled={Boolean(busy) || !pastedConfig.trim()}>{busy === 'import' ? (en ? 'Importing…' : '正在导入…') : (en ? 'Use Pasted Configuration' : '使用粘贴的配置')}</button>
    </form>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {result && <div className={styles.result}>
      <p>{result.source === 'imported'
        ? (en ? 'The CA certificate has been extracted from your P12 file. You can export it, import it into Loon, or install and trust it on iOS.' : '已从粘贴的 P12 中提取 CA 证书。现在可以导出、导入 Loon，或在 iOS 设备上安装并信任。')
        : (en ? 'A 2048-bit RSA CA certificate valid for about five years has been generated. Import it into Loon, then install and trust the CA certificate.' : '已生成有效期约 5 年的 RSA 2048 位 CA 证书。请先导入 Loon，再安装并信任 CA 证书。')}</p>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={() => { window.location.href = createLoonCaImportUrl(result); }}>{en ? 'Import into Loon' : '一键导入 Loon'}</button>
        <button type="button" onClick={installOnIos}>{en ? 'Install on iOS Device' : '安装到 iOS 设备'}</button>
      </div>
      <div className={styles.steps}>
        <h2>{en ? 'Use with Loon and iOS' : '在 Loon 和 iOS 设备上使用'}</h2>
        {en ? <ol>
          <li>{result.source === 'imported' ? 'If this CA is not already in Loon on this device, tap “Import into Loon” and confirm the import.' : 'Generate the certificate in Safari on your iPhone or iPad. Tap “Import into Loon,” open Loon when prompted, and confirm the import.'} You can also copy the configuration below into the [MitM] section of your Loon profile.</li>
          <li>Return to Safari and tap “Install on iOS Device” to download the configuration profile, then open Settings → Profile Downloaded to install it.</li>
          <li>Open Settings → General → About → Certificate Trust Settings and enable full trust for the root certificate. Then enable MitM in Loon.</li>
        </ol> : <ol>
          <li>{result.source === 'imported' ? '如果当前设备的 Loon 尚未导入此 CA，点「一键导入 Loon」并确认导入；' : '在 iPhone 或 iPad 的 Safari 中生成证书，点「一键导入 Loon」，按提示打开 Loon 并确认导入；'}也可以复制下面的配置片段，粘贴到 Loon 配置文件的 [MitM] 部分。</li>
          <li>返回 Safari，点「安装到 iOS 设备」下载描述文件，再到「设置 → 已下载描述文件」完成安装。</li>
          <li>前往「设置 → 通用 → 关于本机 → 证书信任设置」为该根证书开启完全信任，最后在 Loon 中启用 MitM。</li>
        </ol>}
        <p>{en ? <>If the installation prompt does not appear, open <code>loon-ca.mobileconfig</code> from Files. The profile contains only the public CA certificate.</> : <>如果安装提示没有出现，可在“文件”中打开 <code>loon-ca.mobileconfig</code>。描述文件只包含 CA 公钥证书。</>}</p>
      </div>
      <label htmlFor="mitm-ca-password">{en ? 'P12 Password' : 'P12 密码'}</label>
      <input id="mitm-ca-password" readOnly value={result.password} onFocus={event => event.target.select()} />
      <div className={styles.configHeader}>
        <label htmlFor="mitm-ca-config">{en ? 'Configuration snippet (paste into your existing [MitM] section)' : '配置片段（粘贴到现有的 [MitM] 分区）'}</label>
        <button type="button" className={styles.copyButton} onClick={copyConfig} aria-label={en ? (copied ? 'Configuration copied' : 'Copy configuration') : (copied ? '已复制配置片段' : '复制配置片段')} title={en ? (copied ? 'Copied' : 'Copy configuration') : (copied ? '已复制' : '复制配置')}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            {copied ? <path d="M4 12l5 5L20 6" /> : <><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>}
          </svg>
        </button>
      </div>
      <textarea id="mitm-ca-config" readOnly value={config} rows={4} onFocus={event => event.target.select()} />
      <div className={styles.backup}>
        <span>{en ? 'Need backup files?' : '需要备份文件？'}</span>
        <button type="button" className={styles.textAction} onClick={() => download(result.certificatePem, 'loon-ca.crt', 'application/x-x509-ca-cert')}>{en ? 'Download CA Certificate' : '下载 CA 证书'}</button>
        <span aria-hidden="true">·</span>
        <button type="button" className={styles.textAction} onClick={() => download(result.p12Bytes, 'loon-ca.p12', 'application/x-pkcs12')}>{en ? 'Download P12' : '下载 P12'}</button>
      </div>
      <p className={styles.warning}>{en ? <><code>ca-p12</code> contains the private key. Do not share your configuration, P12 file, or import link. Your browser cannot install or trust the root certificate for you.</> : <><code>ca-p12</code> 含私钥，请勿公开分享配置、P12 文件或导入链接。浏览器不能替你安装和信任根证书。</>}</p>
    </div>}
  </section>;
}
