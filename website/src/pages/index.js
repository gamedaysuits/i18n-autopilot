import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import CodeBlock from '@theme/CodeBlock';
import Heading from '@theme/Heading';
import { useState, useEffect } from 'react';

import leaderboardData from '../data/leaderboard.json';
import styles from './index.module.css';

/* ------------------------------------------------------------------ */
/*  Hero — leads with the i18n framework, not the research angle      */
/* ------------------------------------------------------------------ */

function HeroBanner() {
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className={styles.heroTitle}>
          Fully customizable<br />internationalization
        </Heading>
        <p className={styles.heroSubtitle}>
          One command translates your locale files. Every translation method —
          Google Translate, LLMs, custom APIs, coached pipelines — is a config option.
          Use what works for each language.
        </p>
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
            to="/docs/guides/translation-methods">
            See Methods
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Stats Bar                                                          */
/* ------------------------------------------------------------------ */

function StatsBar() {
  return (
    <section className={styles.statsBar}>
      <div className="container">
        <div className="row">
          <div className="col col--3 text--center">
            <Heading as="h3" className={styles.stat}>752</Heading>
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
            <Heading as="h3" className={styles.stat}>47</Heading>
            <p>Language registers</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature cards — framework capabilities                             */
/* ------------------------------------------------------------------ */

const features = [
  {
    icon: '⚡',
    title: 'One Command',
    description: "Auto-detect your locale files, format, and target languages. Translate what changed. Skip what didn't.",
    link: '/docs/getting-started/quick-start',
  },
  {
    icon: '🔀',
    title: 'Per-Pair Methods',
    description: 'Google Translate for French, an LLM for Japanese, a coached plugin for Plains Cree — all in the same config.',
    link: '/docs/guides/translation-methods',
  },
  {
    icon: '🎭',
    title: 'Registers & Coaching',
    description: "Steer the LLM with per-language tone instructions. Formal Sie-form for German, Taglish code-switching for Filipino, warrior's honor for Klingon.",
    link: '/docs/concepts/coaching-data',
  },
  {
    icon: '🧱',
    title: 'Content Aware',
    description: 'Code blocks, shortcodes, interpolation variables, and raw HTML are shielded during translation. The LLM never sees your code.',
    link: '/docs/concepts/how-sync-works',
  },
  {
    icon: '📦',
    title: 'Zero Dependencies',
    description: 'Node.js built-ins only. No SDKs, no native modules, no build step. Works anywhere Node 20+ runs.',
    link: '/docs/concepts/architecture',
  },
  {
    icon: '🛡️',
    title: 'Quality Gate',
    description: 'Every translation is validated before writing. Wrong-script output, source echoes, length inflation, and placeholder corruption are caught and rejected.',
    link: '/docs/concepts/quality-gate',
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

/* ------------------------------------------------------------------ */
/*  Quick config example                                               */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Use cases — primary workflows                                      */
/* ------------------------------------------------------------------ */

const useCases = [
  {
    title: 'SaaS Internationalization',
    description: 'Translate your Next.js, Hugo, or React app to 30+ languages with per-pair quality control.',
    link: '/docs/tutorials/translate-30-languages',
    linkText: 'Translate 30 Languages →',
  },
  {
    title: 'Build a Custom Pipeline',
    description: 'Chain LLMs with FST validators, dictionaries, and post-processors. Package it as a plugin.',
    link: '/docs/tutorials/fst-gated-pipeline',
    linkText: 'FST Pipeline Cookbook →',
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

/* ------------------------------------------------------------------ */
/*  Comparison teaser                                                  */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  The Arena — secondary section, the differentiator                  */
/*  Positioned after the framework pitch, visually distinct            */
/* ------------------------------------------------------------------ */

/**
 * Two independent language lists, cycling in opposite directions
 * at different speeds. The desync creates a combinatorial feel —
 * every refresh shows a different pairing.
 *
 * Source: cycles forward  every 2.1s (slower, steady)
 * Target: cycles backward every 1.4s (faster, restless)
 */
const SOURCE_LANGS = [
  'English', 'Spanish', 'French', 'Turkish', 'Russian',
  'Portuguese', 'Mandarin', 'Japanese', 'Arabic', 'German',
];

const TARGET_LANGS = [
  'Plains Cree', 'Quechua', 'Inuktitut', 'Navajo', 'Wolof',
  'Māori', 'Sakha', 'Yoruba', 'Guarani', 'Welsh',
  'Ojibwe', 'Ainu', 'Azerbaijani', 'Cantonese', 'Basque',
];

function ArenaSection() {
  const [srcIndex, setSrcIndex] = useState(0);
  const [tgtIndex, setTgtIndex] = useState(0);
  const [srcVisible, setSrcVisible] = useState(true);
  const [tgtVisible, setTgtVisible] = useState(true);

  // Source cycles forward, slower
  useEffect(() => {
    const interval = setInterval(() => {
      setSrcVisible(false);
      setTimeout(() => {
        setSrcIndex((prev) => (prev + 1) % SOURCE_LANGS.length);
        setSrcVisible(true);
      }, 200);
    }, 2100);
    return () => clearInterval(interval);
  }, []);

  // Target cycles backward, faster
  useEffect(() => {
    const interval = setInterval(() => {
      setTgtVisible(false);
      setTimeout(() => {
        setTgtIndex((prev) => (prev - 1 + TARGET_LANGS.length) % TARGET_LANGS.length);
        setTgtVisible(true);
      }, 200);
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className={styles.arena}>
      <div className="container text--center">
        <p className={styles.arenaEyebrow}>THE ARENA</p>
        <Heading as="h2" className={styles.arenaTitle}>
          Think you have the best method<br />
          for translating{' '}
          <span className={clsx(styles.arenaPair, srcVisible && styles.arenaPairVisible)}>
            {SOURCE_LANGS[srcIndex]}
          </span>
          {' → '}
          <span className={clsx(styles.arenaPair, styles.arenaPairTarget, tgtVisible && styles.arenaPairVisible)}>
            {TARGET_LANGS[tgtIndex]}
          </span>
          ?
        </Heading>
        <p className={styles.arenaTagline}>
          <strong>Prove it.</strong>
        </p>
        <p className={styles.arenaDescription}>
          7,000+ languages. ~130 have machine translation. The rest are an unsolved problem —
          and an open invitation. rosetta's evaluation harness benchmarks any method with
          fingerprinted, reproducible scoring. The leaderboard tracks every submission.
        </p>
        <div className={styles.arenaCards}>
          <div className={styles.arenaCard}>
            <div className={styles.arenaCardIcon}>🧪</div>
            <Heading as="h3">Plug and Test</Heading>
            <p>Run your method against standardized benchmarks. chrF++, exact match, FST acceptance — all computed by the same harness.</p>
            <Link to="/docs/eval/harness" className={styles.arenaLink}>Eval Harness →</Link>
          </div>
          <div className={styles.arenaCard}>
            <div className={styles.arenaCardIcon}>🏆</div>
            <Heading as="h3">Claim Your Score</Heading>
            <p>Every submission is fingerprinted to a Git commit and scored against the same dataset. Open a PR to submit.</p>
            <Link to="/leaderboard" className={styles.arenaLink}>Leaderboard →</Link>
          </div>
          <div className={styles.arenaCard}>
            <div className={styles.arenaCardIcon}>🤝</div>
            <Heading as="h3">Respect the Data</Heading>
            <p>Indigenous languages belong to their communities. rosetta supports OCAP, CARE, and Māori Data Sovereignty principles.</p>
            <Link to="/docs/guides/data-sovereignty" className={styles.arenaLink}>Data Sovereignty →</Link>
          </div>
        </div>
        <p className={styles.arenaCallout}>
          This is an unsolved problem that everyone in the world can contribute to.<br/>
          <strong>Build a method. Score it. Give it back.</strong>
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Leaderboard mini-widget                                            */
/* ------------------------------------------------------------------ */

function formatPair(pair) {
  const [src, tgt] = pair.split('>');
  return `${src.toUpperCase()} → ${tgt.toUpperCase()}`;
}

function LeaderboardWidget() {
  const sorted = [...leaderboardData.entries]
    .sort((a, b) => b.metrics.chrF - a.metrics.chrF)
    .slice(0, 5);

  if (sorted.length === 0) return null;

  return (
    <section className={styles.leaderboardWidget}>
      <div className="container">
        <div className={styles.leaderboardWidgetInner}>
          <div className={styles.leaderboardWidgetHeader}>
            <div>
              <Heading as="h2" className={styles.sectionTitle} style={{marginBottom: '0.5rem', textAlign: 'left'}}>
                🏆 Method Leaderboard
              </Heading>
              <p className={styles.leaderboardWidgetSubtitle}>
                Top translation methods ranked by chrF++ score.
                Think you can beat them? <Link to="/docs/eval/harness">Run the harness</Link>.
              </p>
            </div>
            <Link to="/leaderboard" className="button button--primary button--sm">
              Full Leaderboard →
            </Link>
          </div>
          <div className={styles.leaderboardWidgetTable}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Method</th>
                  <th>Model</th>
                  <th>Pair</th>
                  <th>chrF++</th>
                  <th>EM%</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((entry, idx) => (
                  <tr key={idx}>
                    <td className={styles.leaderboardRank}>{idx + 1}</td>
                    <td className={styles.leaderboardMethod}>{entry.method}</td>
                    <td className={styles.leaderboardModel}>{entry.model}</td>
                    <td>{formatPair(entry.pair)}</td>
                    <td className={styles.leaderboardScore}>{entry.metrics.chrF}</td>
                    <td className={styles.leaderboardScore}>{entry.metrics.exactMatch}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Page layout — framework first, arena second                        */
/* ------------------------------------------------------------------ */

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} — Fully customizable internationalization`}
      description="An i18n framework where every translation method is a config option. Google Translate, LLMs, custom pipelines — one command, per-pair control, quality-gated.">
      <HeroBanner />
      <main>
        <StatsBar />
        <FeaturesSection />
        <QuickExample />
        <UseCasesSection />
        <ComparisonTeaser />
        <ArenaSection />
        <LeaderboardWidget />
      </main>
    </Layout>
  );
}
