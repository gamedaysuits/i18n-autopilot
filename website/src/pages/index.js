import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import CodeBlock from '@theme/CodeBlock';
import Heading from '@theme/Heading';
import { useState, useEffect } from 'react';

import homepage from '../data/homepage.json';
import styles from './index.module.css';

/* ------------------------------------------------------------------ */
/*  Hero — leads with the i18n framework, not the research angle      */
/*  All text sourced from homepage.json so the CMS can edit it.       */
/* ------------------------------------------------------------------ */

function HeroBanner() {
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className={styles.heroTitle}>
          {homepage.hero.title_line1}<br />{homepage.hero.title_line2}
        </Heading>
        <p className={styles.heroSubtitle}>
          {homepage.hero.subtitle}
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
            {homepage.hero.cta_primary}
          </Link>
          <Link
            className={clsx('button button--lg', styles.buttonOutline)}
            to="/docs/guides/translation-methods">
            {homepage.hero.cta_secondary}
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
  const s = homepage.stats;
  return (
    <section className={styles.statsBar}>
      <div className="container">
        <div className="row">
          <div className="col col--3 text--center">
            <Heading as="h3" className={styles.stat}>{s.tests}</Heading>
            <p>Tests</p>
          </div>
          <div className="col col--3 text--center">
            <Heading as="h3" className={styles.stat}>{s.dependencies}</Heading>
            <p>Dependencies</p>
          </div>
          <div className="col col--3 text--center">
            <Heading as="h3" className={styles.stat}>{s.script_converters}</Heading>
            <p>Script converters</p>
          </div>
          <div className="col col--3 text--center">
            <Heading as="h3" className={styles.stat}>{s.language_registers}</Heading>
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

const featureLinks = [
  '/docs/getting-started/quick-start',
  '/docs/guides/translation-methods',
  '/docs/concepts/coaching-data',
  '/docs/concepts/how-sync-works',
  '/docs/concepts/architecture',
  '/docs/concepts/quality-gate',
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
          {homepage.features.map((feat, idx) => (
            <Feature key={idx} {...feat} link={featureLinks[idx]} />
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

const useCaseLinks = [
  '/docs/tutorials/translate-30-languages',
  '/docs/tutorials/fst-gated-pipeline',
  '/docs/guides/low-resource-languages',
];

function UseCasesSection() {
  return (
    <section className={styles.useCases}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>Built For</Heading>
        <div className="row">
          {homepage.use_cases.map((uc, idx) => (
            <div key={idx} className="col col--4">
              <div className={styles.useCaseCard}>
                <Heading as="h3">{uc.title}</Heading>
                <p>{uc.description}</p>
                <Link to={useCaseLinks[idx]} className={styles.useCaseLink}>{uc.link_text}</Link>
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
          {homepage.comparison.title}
        </Heading>
        <p className={styles.comparisonSubtitle}>
          {homepage.comparison.description}
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

const arenaCardLinks = [
  '/docs/eval/harness',
  '/leaderboard',
  '/docs/guides/data-sovereignty',
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

  const a = homepage.arena;

  return (
    <section className={styles.arena}>
      <div className="container text--center">
        <p className={styles.arenaEyebrow}>{a.eyebrow}</p>
        <Heading as="h2" className={styles.arenaTitle}>
          {a.title_line1}<br />
          {a.title_line2}{' '}
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
          <strong>{a.tagline}</strong>
        </p>
        <p className={styles.arenaDescription}>{a.description}</p>
        <div className={styles.arenaCards}>
          {a.cards.map((card, idx) => (
            <div key={idx} className={styles.arenaCard}>
              <div className={styles.arenaCardIcon}>{card.icon}</div>
              <Heading as="h3">{card.title}</Heading>
              <p>{card.description}</p>
              <Link to={arenaCardLinks[idx]} className={styles.arenaLink}>{card.link_text}</Link>
            </div>
          ))}
        </div>
        <p className={styles.arenaCallout}>
          {a.callout_line1}<br/>
          <strong>{a.callout_line2}</strong>
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

// Supabase config — same as leaderboard page (read-only anon key, RLS-protected)
const SUPABASE_URL = "https://sjdomynysdljkbemupqa.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_bV6CFNFnzxhQI0wlBx2J0A_5Vm5gFBp";

function LeaderboardWidget() {
  const [entries, setEntries] = useState([]);

  // Fetch top 5 from Supabase on mount
  useEffect(() => {
    async function fetchTop() {
      try {
        const resp = await fetch(
          `${SUPABASE_URL}/rest/v1/run_cards?select=model_slug,condition,chrf_plus_plus,exact_match_rate,language_pair&order=chrf_plus_plus.desc.nullslast&limit=5`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );
        if (!resp.ok) return;
        const data = await resp.json();
        setEntries(data.map((row) => ({
          method: `prompt-${row.condition}`,
          model: row.model_slug,
          pair: row.language_pair || "en>crk",
          chrF: row.chrf_plus_plus,
          exactMatch: row.exact_match_rate,
        })));
      } catch { /* silent — widget is non-critical */ }
    }
    fetchTop();
  }, []);

  if (entries.length === 0) return null;

  const lw = homepage.leaderboard_widget;

  return (
    <section className={styles.leaderboardWidget}>
      <div className="container">
        <div className={styles.leaderboardWidgetInner}>
          <div className={styles.leaderboardWidgetHeader}>
            <div>
              <Heading as="h2" className={styles.sectionTitle} style={{marginBottom: '0.5rem', textAlign: 'left'}}>
                {lw.title}
              </Heading>
              <p className={styles.leaderboardWidgetSubtitle}>
                {lw.subtitle}{' '}
                {lw.cta} <Link to="/docs/eval/harness">Run the harness</Link>.
              </p>
            </div>
            <Link to="/leaderboard" className="button button--primary button--sm">
              {lw.full_leaderboard_text}
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
                {entries.map((entry, idx) => (
                  <tr key={idx}>
                    <td className={styles.leaderboardRank}>{idx + 1}</td>
                    <td className={styles.leaderboardMethod}>{entry.method}</td>
                    <td className={styles.leaderboardModel}>{entry.model}</td>
                    <td>{formatPair(entry.pair)}</td>
                    <td className={styles.leaderboardScore}>{entry.chrF}</td>
                    <td className={styles.leaderboardScore}>{entry.exactMatch}%</td>
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
      title={`${siteConfig.title} — ${homepage.seo.title_suffix}`}
      description={homepage.seo.description}>
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
