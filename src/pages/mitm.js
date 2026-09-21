import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import GuideZh from '../../docs/MitM/mitm.md';
import GuideEn from '../../i18n/en/docusaurus-plugin-content-docs/current/MitM/mitm.md';
import CertificateTool from './certificate-tool';

export default function MitmPage() {
  const {siteConfig, i18n} = useDocusaurusContext();
  if (siteConfig.customFields.mitmLinkTarget === 'tool') {
    return <CertificateTool />;
  }

  const en = i18n.currentLocale === 'en';
  const Guide = en ? GuideEn : GuideZh;
  return <Layout title={en ? 'MitM Guide' : 'MitM 使用指南'}>
    <main className="container margin-vert--lg">
      <article className="theme-doc-markdown markdown"><Guide /></article>
    </main>
  </Layout>;
}
