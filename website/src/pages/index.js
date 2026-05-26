import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import CodeBlock from '@theme/CodeBlock';
import Heading from '@theme/Heading';
import { useState, useEffect } from 'react';

import styles from './index.module.css';
import WordFlipper from '../components/WordFlipper';
import { loadLanguages } from '../utils/languageLoader';
import { convertScript, hasScriptConverter, getConverterInfo } from '../../../lib/scripts';

/**
 * Map converter locale codes to CSS data-script attribute values.
 * These must match the [data-script="..."] selectors in custom.css.
 * Only PUA-based converters (those with a fontNote) need this mapping —
 * native Unicode converters (crk, sr) render without any special font.
 */
const SCRIPT_ATTR_MAP = {
  tlh: 'piqad',
  'x-elvish-s': 'tengwar',
  // x-kryptonian omitted: no PUA font available, falls back to Latin
};

/**
 * Build a word entry for the WordFlipper from a language card.
 * Returns either a plain string or a { text, script } object.
 *
 * Logic:
 *   1. If the language has a script converter with no fontNote → native
 *      Unicode (Cree, Serbian). Convert and return as a plain string.
 *   2. If the language has a script converter with a fontNote AND we have
 *      a CSS data-script mapping → convert and return as { text, script }
 *      so the WordFlipper wraps it in <span data-script="...">.
 *   3. If fontNote but no mapping (Kryptonian) → return the Latin name.
 *   4. No converter → return the native name as-is.
 */
function buildFlipperWord(lang) {
  const native = lang.nativeName || lang.name;
  if (!hasScriptConverter(lang.code)) return native;

  const info = getConverterInfo(lang.code);
  const { converted } = convertScript(native, lang.code);

  if (!info.fontNote) {
    // Native Unicode converter (Cree syllabics, Serbian Cyrillic)
    return converted;
  }

  const scriptAttr = SCRIPT_ATTR_MAP[lang.code];
  if (scriptAttr) {
    // PUA converter with a font we can render
    return { text: converted, script: scriptAttr };
  }

  // PUA converter without a font (Kryptonian) — show Latin name
  return native;
}

/* ------------------------------------------------------------------ */
/*  Hero — leads with the i18n framework, not the research angle      */
/*  All text wrapped in <Translate> so rosetta sync picks it up       */
/*  via code.json keys.                                                */
/* ------------------------------------------------------------------ */

function HeroBanner() {
  const [languages, setLanguages] = useState([]);
  const [flipperWords, setFlipperWords] = useState([]);
  const [currentWord, setCurrentWord] = useState('5');

  useEffect(() => {
    const data = loadLanguages();
    setLanguages(data);
    const dynamicWords = [
      '5',
      '17',
      '210',
      String(data.length),
      ...[...data]
        .map(lang => buildFlipperWord(lang))
        .filter(word => {
          // Filter out empty strings and objects with empty text
          if (typeof word === 'object') return word.text && word.text.trim();
          return word && word.trim();
        })
        .sort(() => 0.5 - Math.random())
    ];
    setFlipperWords(dynamicWords);
  }, []);

  const wordsToUse = flipperWords.length > 0 ? flipperWords : ['5', '17', '210', '47'];
  // currentWord can be a string or { text, script } object from WordFlipper
  const displayText = typeof currentWord === 'object' ? currentWord.text : currentWord;
  const isNumber = /^\d+$/.test(displayText);
  const suffix = isNumber
    ? ` ${translate({id: 'homepage.hero.languagesSuffix', message: 'languages', description: 'Suffix after the language count number in the hero'})}`
    : '';

  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className={styles.heroTitle}>
          <Translate id="homepage.hero.titlePrefix" description="Hero title text before the animated language flipper">Build your entire website in</Translate>{' '}
          <WordFlipper
            words={wordsToUse}
            onChange={(word) => setCurrentWord(word)}
            className={styles.heroFlipper}
            wordClassName={styles.heroFlipperWord}
          />
          {suffix}
          <br />
          <Translate id="homepage.hero.titleSuffix" description="Hero title text after the animated language flipper">with one command, or with infinite customization</Translate>
        </Heading>
        <p className={styles.heroSubtitle}>
          <Translate id="homepage.hero.subtitle" description="Hero subtitle explaining the product">
            One command translates your locale files. Every translation method — Google Translate, LLMs, custom APIs, coached pipelines — is a config option. Use what works for each language.
          </Translate>
        </p>
        <div className={styles.heroCode}>
          <CodeBlock language="bash">
            npx i18n-rosetta sync
          </CodeBlock>
        </div>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/getting-started/quick-start">
            <Translate id="homepage.hero.ctaPrimary" description="Primary call-to-action button">Get Started →</Translate>
          </Link>
          <Link
            className={clsx('button button--lg', styles.buttonOutline)}
            to="/docs/guides/translation-methods">
            <Translate id="homepage.hero.ctaSecondary" description="Secondary call-to-action button">See Methods</Translate>
          </Link>
          <Link
            className={clsx('button button--lg', styles.buttonLanguages)}
            to="/languages">
            {languages.length > 0 ? languages.length : '47'}{' '}
            <Translate id="homepage.hero.languagesSupported" description="Languages supported button label">languages supported</Translate>
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Stats Bar                                                          */
/*  Numbers are data (not translated). Labels are translated.          */
/* ------------------------------------------------------------------ */

function StatsBar() {
  return (
    <section className={styles.statsBar}>
      <div className="container">
        <div className="row">
          <div className="col col--3 text--center">
            <Heading as="h3" className={styles.stat}>752</Heading>
            <p><Translate id="homepage.stats.tests" description="Stats bar label for test count">Tests</Translate></p>
          </div>
          <div className="col col--3 text--center">
            <Heading as="h3" className={styles.stat}>0</Heading>
            <p><Translate id="homepage.stats.dependencies" description="Stats bar label for dependency count">Dependencies</Translate></p>
          </div>
          <div className="col col--3 text--center">
            <Heading as="h3" className={styles.stat}>5</Heading>
            <p><Translate id="homepage.stats.scriptConverters" description="Stats bar label for script converter count">Script converters</Translate></p>
          </div>
          <div className="col col--3 text--center">
            <Heading as="h3" className={styles.stat}>47</Heading>
            <p><Translate id="homepage.stats.languageRegisters" description="Stats bar label for language register count">Language registers</Translate></p>
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

// Feature data uses translate() for non-JSX contexts so keys land in code.json
const featureData = [
  {
    icon: '⚡',
    titleId: 'homepage.features.oneCommand.title',
    titleDefault: 'One Command',
    descId: 'homepage.features.oneCommand.description',
    descDefault: "Auto-detect your locale files, format, and target languages. Translate what changed. Skip what didn't.",
  },
  {
    icon: '🔀',
    titleId: 'homepage.features.perPairMethods.title',
    titleDefault: 'Per-Pair Methods',
    descId: 'homepage.features.perPairMethods.description',
    descDefault: 'Google Translate for French, an LLM for Japanese, a coached plugin for Plains Cree — all in the same config.',
  },
  {
    icon: '🎭',
    titleId: 'homepage.features.registersCoaching.title',
    titleDefault: 'Registers & Coaching',
    descId: 'homepage.features.registersCoaching.description',
    descDefault: "Steer the LLM with per-language tone instructions. Formal Sie-form for German, Taglish code-switching for Filipino, warrior's honor for Klingon.",
  },
  {
    icon: '🧱',
    titleId: 'homepage.features.contentAware.title',
    titleDefault: 'Content Aware',
    descId: 'homepage.features.contentAware.description',
    descDefault: 'Code blocks, shortcodes, interpolation variables, and raw HTML are shielded during translation. The LLM never sees your code.',
  },
  {
    icon: '📦',
    titleId: 'homepage.features.zeroDependencies.title',
    titleDefault: 'Zero Dependencies',
    descId: 'homepage.features.zeroDependencies.description',
    descDefault: 'Node.js built-ins only. No SDKs, no native modules, no build step. Works anywhere Node 20+ runs.',
  },
  {
    icon: '🛡️',
    titleId: 'homepage.features.qualityGate.title',
    titleDefault: 'Quality Gate',
    descId: 'homepage.features.qualityGate.description',
    descDefault: 'Every translation is validated before writing. Wrong-script output, source echoes, length inflation, and placeholder corruption are caught and rejected.',
  },
];

function Feature({icon, titleId, titleDefault, descId, descDefault, link}) {
  return (
    <div className={clsx('col col--4', styles.feature)}>
      <Link to={link} className={styles.featureCardLink}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>{icon}</div>
          <Heading as="h3">
            <Translate id={titleId} description={`Feature card title: ${titleDefault}`}>{titleDefault}</Translate>
          </Heading>
          <p>
            <Translate id={descId} description={`Feature card description: ${titleDefault}`}>{descDefault}</Translate>
          </p>
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
          {featureData.map((feat, idx) => (
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
            <Heading as="h2">
              <Translate id="homepage.quickExample.title" description="Quick example section heading">
                Mix methods per language pair
              </Translate>
            </Heading>
            <p>
              <Translate id="homepage.quickExample.description" description="Quick example section description">
                Each source→target pair gets its own translation method, model, and quality configuration. Use what works for each language — not a one-size-fits-all.
              </Translate>
            </p>
            <Link to="/docs/guides/translation-methods" className="button button--primary button--md">
              <Translate id="homepage.quickExample.cta" description="Quick example CTA button">
                Learn about methods →
              </Translate>
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
  'https://mtevalarena.org/docs/tutorials/fst-gated-pipeline',
  'https://mtevalarena.org/docs/community/low-resource-languages',
];

const useCaseData = [
  {
    titleId: 'homepage.useCases.saas.title',
    titleDefault: 'SaaS Internationalization',
    descId: 'homepage.useCases.saas.description',
    descDefault: 'Translate your Next.js, Hugo, or React app to 30+ languages with per-pair quality control.',
    linkId: 'homepage.useCases.saas.linkText',
    linkDefault: 'Translate 30 Languages →',
  },
  {
    titleId: 'homepage.useCases.pipeline.title',
    titleDefault: 'Build a Custom Pipeline',
    descId: 'homepage.useCases.pipeline.description',
    descDefault: 'Chain LLMs with FST validators, dictionaries, and post-processors. Package it as a plugin.',
    linkId: 'homepage.useCases.pipeline.linkText',
    linkDefault: 'FST Pipeline Cookbook →',
  },
  {
    titleId: 'homepage.useCases.preservation.title',
    titleDefault: 'Language Preservation',
    descId: 'homepage.useCases.preservation.description',
    descDefault: 'Coached LLM translation for languages with no API coverage — Indigenous, endangered, constructed.',
    linkId: 'homepage.useCases.preservation.linkText',
    linkDefault: 'Low-Resource Guide →',
  },
];

function UseCasesSection() {
  return (
    <section className={styles.useCases}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          <Translate id="homepage.useCases.sectionTitle" description="Use cases section heading">
            Built For
          </Translate>
        </Heading>
        <div className="row">
          {useCaseData.map((uc, idx) => (
            <div key={idx} className="col col--4">
              <div className={styles.useCaseCard}>
                <Heading as="h3">
                  <Translate id={uc.titleId} description={`Use case title: ${uc.titleDefault}`}>{uc.titleDefault}</Translate>
                </Heading>
                <p>
                  <Translate id={uc.descId} description={`Use case description: ${uc.titleDefault}`}>{uc.descDefault}</Translate>
                </p>
                <Link to={useCaseLinks[idx]} className={styles.useCaseLink}>
                  <Translate id={uc.linkId} description={`Use case link: ${uc.titleDefault}`}>{uc.linkDefault}</Translate>
                </Link>
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
          <Translate id="homepage.comparison.title" description="Comparison section title">
            Not another TMS platform
          </Translate>
        </Heading>
        <p className={styles.comparisonSubtitle}>
          <Translate id="homepage.comparison.description" description="Comparison section description">
            Crowdin, Phrase, and Locize are cloud platforms that require accounts, dashboards, and monthly fees. Rosetta is a CLI tool that runs in your project — no accounts, no dashboards, no vendor lock-in.
          </Translate>
        </p>
        <Link to="/docs/guides/comparison" className="button button--primary button--md">
          <Translate id="homepage.comparison.cta" description="Comparison section CTA">
            See the full comparison →
          </Translate>
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

const arenaCardData = [
  {
    icon: '🧪',
    titleId: 'homepage.arena.cards.plugTest.title',
    titleDefault: 'Plug and Test',
    descId: 'homepage.arena.cards.plugTest.description',
    descDefault: 'Run your method against standardized benchmarks. chrF++, exact match, FST acceptance — all computed by the same harness.',
    linkId: 'homepage.arena.cards.plugTest.linkText',
    linkDefault: 'Eval Harness →',
    link: 'https://mtevalarena.org/docs/specifications/harness',
  },
  {
    icon: '🏆',
    titleId: 'homepage.arena.cards.claimScore.title',
    titleDefault: 'Claim Your Score',
    descId: 'homepage.arena.cards.claimScore.description',
    descDefault: 'Every submission is fingerprinted to a Git commit and scored against the same dataset. Open a PR to submit.',
    linkId: 'homepage.arena.cards.claimScore.linkText',
    linkDefault: 'Leaderboard →',
    link: '/leaderboard',
  },
  {
    icon: '🤝',
    titleId: 'homepage.arena.cards.respectData.title',
    titleDefault: 'Respect the Data',
    descId: 'homepage.arena.cards.respectData.description',
    descDefault: 'Indigenous languages belong to their communities. rosetta supports OCAP, CARE, and Māori Data Sovereignty principles.',
    linkId: 'homepage.arena.cards.respectData.linkText',
    linkDefault: 'Data Sovereignty →',
    link: 'https://mtevalarena.org/docs/sovereignty/data-sovereignty',
  },
];

function ArenaSection() {
  const [sources, setSources] = useState([
    'English', 'Spanish', 'French', 'Turkish', 'Russian',
    'Portuguese', 'Mandarin', 'Japanese', 'Arabic', 'German',
  ]);
  const [targets, setTargets] = useState([
    'Plains Cree', 'Quechua', 'Inuktitut', 'Navajo', 'Wolof',
    'Māori', 'Sakha', 'Yoruba', 'Guarani', 'Welsh',
    'Ojibwe', 'Ainu', 'Azerbaijani', 'Cantonese', 'Basque',
  ]);

  useEffect(() => {
    const data = loadLanguages();
    if (data.length > 0) {
      // Sources: major world languages (exclude conlangs and Cree for this flipper)
      const majorLangs = data
        .filter(lang => !lang.code.startsWith('x-') && lang.code !== 'crk')
        .map(lang => buildFlipperWord(lang))
        .filter(word => {
          if (typeof word === 'object') return word.text && word.text.trim();
          return word && word.trim();
        })
        .sort(() => 0.5 - Math.random());
      
      // Targets: all languages
      const allLangs = data
        .map(lang => buildFlipperWord(lang))
        .filter(word => {
          if (typeof word === 'object') return word.text && word.text.trim();
          return word && word.trim();
        })
        .sort(() => 0.5 - Math.random());

      setSources(majorLangs);
      setTargets(allLangs);
    }
  }, []);

  return (
    <section className={styles.arena}>
      <div className="container text--center">
        <p className={styles.arenaEyebrow}>
          <Translate id="homepage.arena.eyebrow" description="Arena section eyebrow label">THE ARENA</Translate>
        </p>
        <Heading as="h2" className={styles.arenaTitle}>
          <Translate id="homepage.arena.titleLine1" description="Arena title line 1">Think you have the best method</Translate>
          <br />
          <Translate id="homepage.arena.titleLine2" description="Arena title line 2">for translating</Translate>
          {' '}
          <WordFlipper
            words={sources}
            interval={2100}
            className={styles.arenaFlipperContainer}
          />
          {' → '}
          <WordFlipper
            words={targets}
            interval={1400}
            className={styles.arenaFlipperContainerTarget}
            wordClassName={styles.arenaFlipperWordTarget}
          />
          ?
        </Heading>
        <p className={styles.arenaTagline}>
          <strong>
            <Translate id="homepage.arena.tagline" description="Arena section tagline">Prove it.</Translate>
          </strong>
        </p>
        <p className={styles.arenaDescription}>
          <Translate id="homepage.arena.description" description="Arena section description paragraph">
            7,000+ languages. ~130 have machine translation. The rest are an unsolved problem — and an open invitation. rosetta's evaluation harness benchmarks any method with fingerprinted, reproducible scoring. The leaderboard tracks every submission.
          </Translate>
        </p>
        <div className={styles.arenaCards}>
          {arenaCardData.map((card, idx) => (
            <div key={idx} className={styles.arenaCard}>
              <div className={styles.arenaCardIcon}>{card.icon}</div>
              <Heading as="h3">
                <Translate id={card.titleId} description={`Arena card title: ${card.titleDefault}`}>{card.titleDefault}</Translate>
              </Heading>
              <p>
                <Translate id={card.descId} description={`Arena card description: ${card.titleDefault}`}>{card.descDefault}</Translate>
              </p>
              <Link to={card.link} className={styles.arenaLink}>
                <Translate id={card.linkId} description={`Arena card link: ${card.titleDefault}`}>{card.linkDefault}</Translate>
              </Link>
            </div>
          ))}
        </div>
        <p className={styles.arenaCallout}>
          <Translate id="homepage.arena.calloutLine1" description="Arena callout line 1">
            This is an unsolved problem that everyone in the world can contribute to.
          </Translate>
          <br/>
          <strong>
            <Translate id="homepage.arena.calloutLine2" description="Arena callout line 2">
              Build a method. Score it. Give it back.
            </Translate>
          </strong>
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

  return (
    <section className={styles.leaderboardWidget}>
      <div className="container">
        <div className={styles.leaderboardWidgetInner}>
          <div className={styles.leaderboardWidgetHeader}>
            <div>
              <Heading as="h2" className={styles.sectionTitle} style={{marginBottom: '0.5rem', textAlign: 'left'}}>
                <Translate id="homepage.leaderboard.title" description="Leaderboard widget title">🏆 Method Leaderboard</Translate>
              </Heading>
              <p className={styles.leaderboardWidgetSubtitle}>
                <Translate id="homepage.leaderboard.subtitle" description="Leaderboard widget subtitle">
                  Top translation methods ranked by chrF++ score.
                </Translate>
                {' '}
                <Translate id="homepage.leaderboard.cta" description="Leaderboard widget call to action">
                  Think you can beat them?
                </Translate>
                {' '}
                <Link to="https://mtevalarena.org/docs/specifications/harness">
                  <Translate id="homepage.leaderboard.runHarness" description="Leaderboard run harness link">Run the harness</Translate>
                </Link>.
              </p>
            </div>
            <Link to="/leaderboard" className="button button--primary button--sm">
              <Translate id="homepage.leaderboard.fullLeaderboard" description="Full leaderboard link button">Full Leaderboard →</Translate>
            </Link>
          </div>
          <div className={styles.leaderboardWidgetTable}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th><Translate id="homepage.leaderboard.colMethod" description="Leaderboard table header: Method">Method</Translate></th>
                  <th><Translate id="homepage.leaderboard.colModel" description="Leaderboard table header: Model">Model</Translate></th>
                  <th><Translate id="homepage.leaderboard.colPair" description="Leaderboard table header: Pair">Pair</Translate></th>
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
      title={translate({
        id: 'homepage.seo.titleSuffix',
        message: 'Fully customizable internationalization',
        description: 'SEO title suffix for the homepage',
      })}
      description={translate({
        id: 'homepage.seo.description',
        message: 'An i18n framework where every translation method is a config option. Google Translate, LLMs, custom pipelines — one command, per-pair control, quality-gated.',
        description: 'SEO meta description for the homepage',
      })}>
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
