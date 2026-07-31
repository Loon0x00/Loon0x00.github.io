import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import Heading from '@theme/Heading';
import styles from './index.module.css';

import bannerImg from '../../static/img/iPhonex.png';

function HomepageHeader() {
  const {i18n} = useDocusaurusContext();
  const isEnglish = i18n.currentLocale === 'en';
  const heroCopy = isEnglish
    ? {
        title: 'Powerful Network Toolbox for iOS & tvOS',
        subtitle:
          'Take control of your device network with flexible routing, encrypted DNS, traffic inspection, Rewrite, and script automation—all in one powerful toolbox.',
      }
    : {
        title: '适用于 iOS 与 tvOS 的强大网络工具',
        subtitle:
          '通过灵活分流、加密 DNS、流量分析、Rewrite 与脚本自动化，全面掌控设备网络，让访问更高效、更安全。',
      };
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className={styles.container}>
        <div className={styles.appInfo}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            LOON · NETWORK TOOLBOX
          </div>
          <Heading as="h1" className={clsx(styles.heroTitle, 'hero__title')}>
            {heroCopy.title}
          </Heading>
          <p className={clsx(styles.heroSubtitle, 'hero__subtitle')}>
            {heroCopy.subtitle}
          </p>
          <div className={styles.buttons}>
            <Link
              className={clsx(
                'button button--lg',
                styles.storeButton,
              )}
              to="https://itunes.apple.com/in/app/id1373567447">
              <span>iOS & tvOS App Store</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
        <div className={styles.appImg}>
          <div className={styles.phoneGlow} />
          <img
            src={bannerImg}
            alt="Loon app interface on iPhone"
            className={styles.phoneImage}
          />
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig, i18n} = useDocusaurusContext();
  const description =
    i18n.currentLocale === 'en'
      ? 'Manage, inspect, and refine network traffic on iOS and tvOS with Loon.'
      : '使用 Loon 管理、检查和处理 iOS 与 tvOS 设备的网络流量。';
  return (
    <Layout
      title={`${siteConfig.title}`}
      description={description}>
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
