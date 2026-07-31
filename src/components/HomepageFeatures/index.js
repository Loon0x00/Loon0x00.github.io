import clsx from 'clsx';
import Heading from '@theme/Heading';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: {
      zh: 'HTTPS 与 HTTP/2 流量解密',
      en: 'HTTPS and HTTP/2 Traffic Decryption',
    },
    Svg: require('@site/static/img/mitm.png').default,
    description: {
      zh: '通过 MitM 解密 HTTPS 和 HTTP/2 请求与响应，清晰查看加密流量，快速定位接口与网络问题。',
      en: 'Decrypt HTTPS and HTTP/2 requests and responses through MitM to inspect encrypted traffic and troubleshoot network issues.',
    },
  },
  {
    title: {
      zh: '捕获并保存网络请求',
      en: 'Capture and Archive Network Requests',
    },
    Svg: require('@site/static/img/capture.png').default,
    description: {
      zh: '记录指定的 HTTP 与 HTTPS 请求、响应和 Header，为接口分析、问题排查与调试提供完整依据。',
      en: 'Record selected HTTP and HTTPS requests, responses, and headers for reliable API analysis, troubleshooting, and debugging.',
    },
  },
  {
    title: {
      zh: '使用 JavaScript 灵活改写',
      en: 'Flexible Rewriting with JavaScript',
    },
    Svg: require('@site/static/img/script.png').default,
    description: {
      zh: '借助 Loon 脚本引擎处理请求与响应，用 JavaScript 实现数据修改、自动化任务和更复杂的网络逻辑。',
      en: "Use Loon's scripting engine to modify requests and responses, automate tasks, and implement advanced network logic in JavaScript.",
    },
  },
  {
    title: {
      zh: '丰富的开源插件生态',
      en: 'A Rich Open-source Plugin Ecosystem',
    },
    Svg: require('@site/static/img/plugin.png').default,
    description: {
      zh: '从活跃社区中发现实用插件，一键安装即可扩展 Loon，无需编写代码也能使用更多高级功能。',
      en: 'Discover useful plugins from an active community and extend Loon with one-click installation—no coding required.',
    },
  },
  {
    title: {
      zh: '高效灵活的流量分流',
      en: 'Fast and Flexible Traffic Routing',
    },
    Svg: require('@site/static/img/policy.png').default,
    description: {
      zh: '通过规则、策略组与节点精确控制流量走向；面对十万级规则集，也能保持毫秒级匹配效率。',
      en: 'Route traffic precisely with rules, policy groups, and nodes while maintaining millisecond-level matching across large rule sets.',
    },
  },
  {
    title: {
      zh: '更私密的加密 DNS',
      en: 'Private and Encrypted DNS',
    },
    Svg: require('@site/static/img/dns.png').default,
    description: {
      zh: '支持 DoH、DoQ 与 DoH3 等加密查询方式，减少 DNS 泄漏和劫持风险，更好地保护访问隐私。',
      en: 'Use DoH, DoQ, or DoH3 to reduce the risk of DNS leaks and hijacking while keeping your browsing activity more private.',
    },
  },
];

function Feature({Svg, title, description, locale}) {
  const language = locale === 'en' ? 'en' : 'zh';
  return (
    <div className={clsx('col col--4', styles.featureColumn)}>
      <article className={styles.featureCard}>
        <div className={styles.iconWrap}>
          <img src={Svg} className={styles.featureIcon} alt="" />
        </div>
        <div className={styles.featureContent}>
          <Heading as="h3">{title[language]}</Heading>
          <p>{description[language]}</p>
        </div>
      </article>
    </div>
  );
}

export default function HomepageFeatures() {
  const {i18n} = useDocusaurusContext();
  const isEnglish = i18n.currentLocale === 'en';
  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.sectionHeading}>
          <span>{isEnglish ? 'BUILT FOR CONTROL' : '为掌控网络而生'}</span>
          <Heading as="h2">
            {isEnglish
              ? 'Everything you need, in one toolbox'
              : '一套工具，覆盖完整网络体验'}
          </Heading>
          <p>
            {isEnglish
              ? 'From everyday routing to advanced traffic debugging, Loon keeps powerful network tools clear and approachable.'
              : '从日常分流到进阶流量调试，Loon 将强大的网络能力整理得清晰、易用。'}
          </p>
        </div>
        <div className={clsx('row', styles.featureGrid)}>
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} locale={i18n.currentLocale} />
          ))}
        </div>
      </div>
    </section>
  );
}
