import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'MITM Over HTTPS/HTTP2',
    Svg: require('@site/static/img/mitm.png').default,
    description: (
      <>
        Loon can use man-in-the-middle attacks to decrypt HTTPS and HTTP2 requests and responses.
      </>
    ),
  },
  {
    title: 'Reviewing and archiving request records',
    Svg: require('@site/static/img/capture.png').default,
    description: (
      <>
        Capture and save specific HTTP and HTTPS request and response contents, facilitating network analysis and debugging.
      </>
    ),
  },
  {
    title: 'Using JavaScript to modify requests',
    Svg: require('@site/static/img/script.png').default,
    description: (
      <>
        Utilizing Loon's robust scripting engine, debug and modify ongoing requests by programming with JavaScript.
      </>
    ),
  },
  {
    title: 'An abundance of open-source plugins',
    Svg: require('@site/static/img/plugin.png').default,
    description: (
      <>
        An active community has produced many interesting and powerful plugins that can be installed with just one click, allowing ordinary users to enjoy the expanded capabilities these plugins bring.
      </>
    ),
  },
  {
    title: 'Powerful and efficient traffic routing',
    Svg: require('@site/static/img/policy.png').default,
    description: (
      <>
        Loon's powerful kernel can match rule sets of up to one hundred thousand rules within milliseconds, ensuring efficient and clear network routing.
      </>
    ),
  },
  {
    title: 'More secure DNS',
    Svg: require('@site/static/img/dns.png').default,
    description: (
      <>
        DNS Over HTTPS, DNS Over QUIC, DNS Over H3 - multiple encrypted DNS options protect your privacy and security.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <img src={Svg} className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
