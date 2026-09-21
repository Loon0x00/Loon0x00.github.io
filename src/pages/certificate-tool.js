import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import MitmCertGenerator from '../components/MitmCertGenerator';
import styles from './certificate-tool.module.css';

export default function CertificateTool() {
  const {i18n} = useDocusaurusContext();
  const en = i18n.currentLocale === 'en';

  return <Layout
    title={en ? 'Certificate Tool' : '证书工具'}
    description={en ? 'Create or import a Loon MitM CA certificate locally in your browser.' : '在浏览器本地创建或导入 Loon MitM CA 证书。'}>
    <main className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>LOON / {en ? 'TOOLS' : '工具'}</span>
        <Heading as="h1">{en ? 'Certificate Tool' : '证书工具'}</Heading>
        <p>{en ? 'Create a MitM CA certificate or use an existing Loon CA configuration, all in your browser.' : '在浏览器本地创建 MitM CA 证书，或使用已有的 Loon CA 配置。'}</p>
      </header>
      <MitmCertGenerator />
      <p className={styles.guide}>
        <Link to="/docs/MitM/">{en ? 'MitM Configuration' : 'MitM 配置说明'}</Link>
      </p>
    </main>
  </Layout>;
}
