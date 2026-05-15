import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import CodeBlock from '@theme/CodeBlock';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HeroBanner() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className={styles.heroTitle}>
          {siteConfig.title}
        </Heading>
        <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
        <div className={styles.heroCode}>
          <CodeBlock language="bash">
            npx i18n-rosetta sync
          </CodeBlock>
        </div>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/getting-started/installation">
            Get Started →
          </Link>
          <Link
            className={clsx('button button--lg', styles.buttonOutline)}
            to="/docs/tutorials/build-a-plugin">
            Build a Plugin
          </Link>
        </div>
      </div>
    </header>
  );
}

/**
 * Feature cards — each links to a relevant docs page.
 * These are the six core differentiators for rosetta.
 */
const features = [
  {
    icon: '⚡',
    title: 'One Command',
    description: "Auto-detect your locale files, format, and target languages. Translate what changed. Skip what didn't.",
    link: '/docs/getting-started/quick-start',
  },
  {
    icon: '🔀',
    title: 'Per-Pair Architecture',
    description: 'Assign different translation methods per language pair. Google Translate for French, an LLM for Japanese, a coached plugin for Plains Cree.',
    link: '/docs/guides/translation-methods',
  },
  {
    icon: '🎭',
    title: 'Custom Registers & Coaching',
    description: "Steer the LLM with per-language tone instructions. Formal Sie-form for German, Taglish code-switching for Filipino, warrior's honor for Klingon.",
    link: '/docs/guides/low-resource-languages',
  },
  {
    icon: '🧱',
    title: 'Content Aware',
    description: 'Code blocks, shortcodes, interpolation variables, and raw HTML are shielded with Unicode sentinels. The LLM never sees your code.',
    link: '/docs/concepts/how-sync-works',
  },
  {
    icon: '📦',
    title: 'Zero Dependencies',
    description: 'Node.js built-ins only. No SDKs, no native modules, no build step. Works anywhere Node 20+ runs.',
    link: '/docs/concepts/architecture',
  },
  {
    icon: '🔤',
    title: 'Conlang & Script Output',
    description: 'Deterministic script converters ship built-in: Cree Syllabics, Serbian Cyrillic, Klingon pIqaD, Sindarin Tengwar, Kryptonian.',
    link: '/docs/reference/plugin-spec',
  },
];

function Feature({icon, title, description, link}) {
  return (
    <div className={clsx('col col--4', styles.feature)}>
      <Link to={link} className={styles.featureCardLink}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>{icon}</div>
          <Heading as="h3">{title}</Heading>
          <p>{description}</p>
        </div>
      </Link>
    </div>
  );
}

function FeaturesSection() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {features.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickExample() {
  const configExample = `{
  "version": 3,
  "pairs": {
    "en:fr": {
      "method": "google-translate"
    },
    "en:ja": {
      "method": "llm",
      "model": "google/gemini-2.5-pro"
    },
    "en:crk": {
      "methodPlugin": "crk-coached-v1"
    }
  }
}`;

  return (
    <section className={styles.quickExample}>
      <div className="container">
        <div className="row">
          <div className="col col--6">
            <Heading as="h2">Mix methods per language pair</Heading>
            <p>
              Each source→target pair gets its own translation method, model, and quality
              configuration. Use what works for each language — not a one-size-fits-all.
            </p>
            <Link to="/docs/guides/translation-methods" className="button button--primary button--md">
              Learn about methods →
            </Link>
          </div>
          <div className="col col--6">
            <CodeBlock language="json" title="i18n-rosetta.config.json">
              {configExample}
            </CodeBlock>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  return (
    <section className={styles.statsBar}>
      <div className="container">
        <div className="row">
          <div className="col col--3 text--center">
            <Heading as="h3" className={styles.stat}>702</Heading>
            <p>Tests</p>
          </div>
          <div className="col col--3 text--center">
            <Heading as="h3" className={styles.stat}>0</Heading>
            <p>Dependencies</p>
          </div>
          <div className="col col--3 text--center">
            <Heading as="h3" className={styles.stat}>5</Heading>
            <p>Script converters</p>
          </div>
          <div className="col col--3 text--center">
            <Heading as="h3" className={styles.stat}>35+</Heading>
            <p>Language registers</p>
          </div>
        </div>
      </div>
    </section>
  );
}

const useCases = [
  {
    title: 'SaaS Internationalization',
    description: 'Translate your Next.js, Hugo, or React app to 30+ languages with per-pair quality control.',
    link: '/docs/tutorials/translate-30-languages',
    linkText: 'Translate 30 Languages →',
  },
  {
    title: 'Plugin Development',
    description: 'Build, benchmark, and distribute custom translation methods for any language pair.',
    link: '/docs/tutorials/build-a-plugin',
    linkText: 'Build a Plugin →',
  },
  {
    title: 'Language Preservation',
    description: 'Coached LLM translation for languages with no API coverage — Indigenous, endangered, constructed.',
    link: '/docs/guides/low-resource-languages',
    linkText: 'Low-Resource Guide →',
  },
];

function UseCasesSection() {
  return (
    <section className={styles.useCases}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>Built For</Heading>
        <div className="row">
          {useCases.map((uc, idx) => (
            <div key={idx} className="col col--4">
              <div className={styles.useCaseCard}>
                <Heading as="h3">{uc.title}</Heading>
                <p>{uc.description}</p>
                <Link to={uc.link} className={styles.useCaseLink}>{uc.linkText}</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComparisonTeaser() {
  return (
    <section className={styles.comparisonTeaser}>
      <div className="container text--center">
        <Heading as="h2" className={styles.sectionTitle}>
          Not another TMS platform
        </Heading>
        <p className={styles.comparisonSubtitle}>
          Crowdin, Phrase, and Locize are cloud platforms that require accounts, dashboards, and monthly fees.
          Rosetta is a CLI tool that runs in your project — no accounts, no dashboards, no vendor lock-in.
        </p>
        <Link to="/docs/guides/comparison" className="button button--primary button--md">
          See the full comparison →
        </Link>
      </div>
    </section>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} — Translate your locale files`}
      description="Translate your locale files with one command. Multi-format, incremental, quality-gated, content-aware.">
      <HeroBanner />
      <main>
        <StatsBar />
        <FeaturesSection />
        <QuickExample />
        <UseCasesSection />
        <ComparisonTeaser />
      </main>
    </Layout>
  );
}
