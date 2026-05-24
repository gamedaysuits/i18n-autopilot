import React, { useState, useMemo, useEffect } from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';

import styles from './languages.module.css';
import { loadLanguages } from '../utils/languageLoader';
import { convertScript, hasScriptConverter } from '../../../lib/scripts';

// Helper to render name in script if a converter exists
function getDisplayName(card) {
  const native = card.nativeName || card.name;
  if (hasScriptConverter(card.code)) {
    const { converted } = convertScript(native, card.code);
    return converted;
  }
  return native;
}

// Category Definitions
const CATEGORIES = [
  { key: 'all', label: 'All Languages' },
  { key: 'major', label: 'Major World' },
  { key: 'variant', label: 'Regional Variants' },
  { key: 'low-resource', label: 'Indigenous & Low-Resource' },
  { key: 'constructed', label: 'Constructed (Conlangs)' }
];

function getLanguageCategory(card) {
  const conlangCodes = ['tlh', 'x-pirate', 'x-shakespeare', 'x-yoda', 'x-elvish-s', 'x-kryptonian'];
  if (conlangCodes.includes(card.code) || card.code.startsWith('x-')) {
    return 'constructed';
  }
  // Low-resource check: doesn't have Google Translate support and is not conlang
  if (card.methodSupport && card.methodSupport.googleTranslate === false) {
    return 'low-resource';
  }
  // Regional/variants check: has hyphen or region specific variants
  if (card.code.includes('-') || card.code === 'zh-TW' || card.code === 'pt-PT') {
    return 'variant';
  }
  return 'major';
}

function MethodBadge({ label, supported, colorClass }) {
  return (
    <span className={`${styles.methodBadge} ${supported ? colorClass : styles.methodUnsupported}`}>
      <span className={styles.methodIndicator}>{supported ? '✓' : '✗'}</span>
      {label}
    </span>
  );
}

function LanguageDetailsModal({ card, onClose }) {
  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    // Lock scrolling on background
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  if (!card) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderTitleGroup}>
            <span className={styles.modalCodeBadge}>{card.code.toUpperCase()}</span>
            <Heading as="h2" id="modal-title" className={styles.modalTitle}>
              {getDisplayName(card)}
            </Heading>
            {hasScriptConverter(card.code) ? (
              <span className={styles.modalNativeName}>
                {card.nativeName || card.name} ({card.name})
              </span>
            ) : (
              card.nativeName && card.nativeName !== card.name && (
                <span className={styles.modalNativeName}>{card.name}</span>
              )
            )}
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.modalBody}>
          <div className={styles.modalGrid}>
            {/* Column 1: Core Details & Methods */}
            <div className={styles.modalColMain}>
              {/* Formality System */}
              {card.formality && (
                <div className={styles.detailSection}>
                  <Heading as="h3" className={styles.sectionTitle}>Formality System</Heading>
                  <div className={styles.infoRow}>
                    <strong>Type:</strong> <span className={styles.pill}>{card.formality.system || 'N/A'}</span>
                  </div>
                  <p className={styles.sectionText}>{card.formality.description}</p>
                </div>
              )}

              {/* Register Presets */}
              {card.registers && Object.keys(card.registers).length > 0 && (
                <div className={styles.detailSection}>
                  <Heading as="h3" className={styles.sectionTitle}>Register Presets</Heading>
                  <p className={styles.sectionTextIntro}>
                    Rosetta steers the LLM using these named preset instructions:
                  </p>
                  <div className={styles.registersList}>
                    {Object.entries(card.registers).map(([key, value]) => (
                      <div key={key} className={styles.registerItem}>
                        <div className={styles.registerHeader}>
                          <span className={styles.registerLabel}>{value.label}</span>
                          <code className={styles.registerKey}>{key}</code>
                          {card.formality?.default === key && (
                            <span className={styles.defaultBadge}>Default</span>
                          )}
                        </div>
                        {value.description && <p className={styles.registerDesc}>{value.description}</p>}
                        <div className={styles.promptBox}>
                          <strong>Prompt:</strong> <code>{value.prompt}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gender Inclusive Guidance */}
              {card.gender && card.gender.inclusiveGuidance && (
                <div className={styles.detailSection}>
                  <Heading as="h3" className={styles.sectionTitle}>Gender Inclusive Guidance</Heading>
                  <p className={styles.sectionText}>{card.gender.inclusiveGuidance}</p>
                </div>
              )}

              {/* Linguistic Challenges */}
              {card.linguisticChallenges && Object.keys(card.linguisticChallenges).length > 0 && (
                <div className={styles.detailSection}>
                  <Heading as="h3" className={styles.sectionTitle}>Linguistic & Translation Challenges</Heading>
                  <div className={styles.challengesList}>
                    {Object.entries(card.linguisticChallenges).map(([key, challenge]) => (
                      <div key={key} className={styles.challengeItem}>
                        <strong className={styles.challengeLabel}>
                          {key.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, (c) => c.toUpperCase())}
                        </strong>
                        <p className={styles.challengeText}>{challenge}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Column 2: Meta Sidebar */}
            <div className={styles.modalColSidebar}>
              {/* Method Support */}
              <div className={styles.sidebarSection}>
                <Heading as="h3" className={styles.sidebarSectionTitle}>Translation Support</Heading>
                <div className={styles.badgeColumn}>
                  <MethodBadge label="Google Translate" supported={card.methodSupport?.googleTranslate} colorClass={styles.methodGoogle} />
                  <MethodBadge label="LLM (OpenRouter)" supported={card.methodSupport?.llm} colorClass={styles.methodLlm} />
                  <MethodBadge label="LLM-Coached" supported={card.methodSupport?.llmCoached || card.methodSupport?.coached} colorClass={styles.methodCoached} />
                  <MethodBadge label="API (Plugin)" supported={card.methodSupport?.api} colorClass={styles.methodApi} />
                </div>
              </div>

              {/* Encyclopedic Metadata */}
              {card.encyclopedic && (
                <div className={styles.sidebarSection}>
                  <Heading as="h3" className={styles.sidebarSectionTitle}>Encyclopedic info</Heading>
                  <div className={styles.metaList}>
                    {card.encyclopedic.family && (
                      <div className={styles.metaItem}>
                        <strong>Family:</strong>
                        <span>{card.encyclopedic.family}</span>
                      </div>
                    )}
                    {card.encyclopedic.demographics?.speakers && (
                      <div className={styles.metaItem}>
                        <strong>Speakers:</strong>
                        <span>{card.encyclopedic.demographics.speakers}</span>
                      </div>
                    )}
                    {card.encyclopedic.demographics?.regions && (
                      <div className={styles.metaItem}>
                        <strong>Regions:</strong>
                        <span className={styles.regionsList}>
                          {card.encyclopedic.demographics.regions.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Resource Links */}
              {(card.encyclopedic?.resources || card.resources) && (
                <div className={styles.sidebarSection}>
                  <Heading as="h3" className={styles.sidebarSectionTitle}>External Resources</Heading>
                  <ul className={styles.resourceLinks}>
                    {card.encyclopedic?.resources?.wikipedia && (
                      <li>
                        <Link href={card.encyclopedic.resources.wikipedia} target="_blank">
                          Wikipedia Article ↗
                        </Link>
                      </li>
                    )}
                    {card.encyclopedic?.resources?.dictionaries?.map((dict, i) => (
                      <li key={i}>
                        <Link href={dict.url} target="_blank">
                          {dict.name} ↗
                        </Link>
                      </li>
                    ))}
                    {card.resources?.corpora?.map((corp, i) => (
                      <li key={i}>
                        <Link href={corp.url} target="_blank">
                          Corpus: {corp.name} ↗
                        </Link>
                      </li>
                    ))}
                    {card.resources?.models?.map((model, i) => (
                      <li key={i}>
                        <Link href={model.url} target="_blank">
                          Model: {model.name} ↗
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Script Info */}
              <div className={styles.sidebarSection}>
                <Heading as="h3" className={styles.sidebarSectionTitle}>Script Details</Heading>
                <div className={styles.metaList}>
                  <div className={styles.metaItem}>
                    <strong>Writing System:</strong>
                    <span>{card.script || 'Latin'}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <strong>Direction:</strong>
                    <span className={styles.uppercase}>{(card.dir || 'ltr')}</span>
                  </div>
                  {card.scriptConverter && (
                    <div className={styles.metaItem}>
                      <strong>Converter:</strong>
                      <span className={styles.codeText}>{card.scriptConverter}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LanguagesPage() {
  const [languages, setLanguages] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState(null);

  // Load languages dynamically at runtime
  useEffect(() => {
    setLanguages(loadLanguages());
  }, []);

  // Filter languages based on category and search query
  const filteredLanguages = useMemo(() => {
    return languages.filter((card) => {
      // 1. Category filter
      if (activeCategory !== 'all') {
        const cat = getLanguageCategory(card);
        if (cat !== activeCategory) return false;
      }

      // 2. Search query filter
      if (search.trim() !== '') {
        const query = search.toLowerCase();
        const nameMatch = card.name?.toLowerCase().includes(query);
        const nativeMatch = card.nativeName?.toLowerCase().includes(query);
        const codeMatch = card.code?.toLowerCase().includes(query);
        return nameMatch || nativeMatch || codeMatch;
      }

      return true;
    });
  }, [languages, search, activeCategory]);

  return (
    <Layout
      title="Supported Languages"
      description="Interactive registry of language cards, registers, formality presets, and translation pipeline details."
    >
      {/* Header section */}
      <header className={styles.pageHeader}>
        <div className="container">
          <Heading as="h1" className={styles.pageTitle}>
            Supported Languages
          </Heading>
          <p className={styles.pageSubtitle}>
            Browse translation registers, formality presets, and method compatibility across {languages.length > 0 ? languages.length : '47'} languages.
          </p>
          <div className={styles.statsBar}>
            <span className={styles.statPill}>
              <strong>{languages.length > 0 ? languages.length : '47'}</strong> Total Cards
            </span>
            <span className={styles.statPill}>
              <strong>{languages.length > 0 ? languages.filter(c => c.methodSupport?.googleTranslate).length : '42'}</strong> Google Translate
            </span>
            <span className={styles.statPill}>
              <strong>{languages.length > 0 ? languages.filter(c => c.methodSupport?.llm).length : '47'}</strong> LLM Steered
            </span>
            <span className={styles.statPill}>
              <strong>{languages.length > 0 ? languages.filter(c => getLanguageCategory(c) === 'low-resource').length : '1'}</strong> Indigenous
            </span>
          </div>
        </div>
      </header>

      {/* Filter and grid container */}
      <main className={styles.contentWrapper}>
        <div className="container">
          {/* Filters Row */}
          <div className={styles.filtersBar}>
            <div className={styles.categoryPills}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  className={`${styles.categoryPill} ${activeCategory === cat.key ? styles.categoryPillActive : ''}`}
                  onClick={() => setActiveCategory(cat.key)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className={styles.searchWrapper}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search languages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className={styles.clearSearch} onClick={() => setSearch('')}>
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* Cards Grid */}
          {filteredLanguages.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔍</div>
              <p>No languages matched your filters.</p>
              <button
                type="button"
                className="button button--primary button--sm"
                onClick={() => {
                  setSearch('');
                  setActiveCategory('all');
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className={styles.cardsGrid}>
              {filteredLanguages.map((card) => {
                const category = getLanguageCategory(card);
                return (
                  <div
                    key={card.code}
                    className={`${styles.langCard} ${styles[`card-${category}`]}`}
                    onClick={() => setSelectedLanguage(card)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedLanguage(card);
                      }
                    }}
                  >
                    {/* Top border highlight line based on category */}
                    <div className={styles.cardHeaderAccent} />
                    
                    <div className={styles.cardHeader}>
                      <span className={styles.codeBadge}>{card.code.toUpperCase()}</span>
                      {card.dir === 'rtl' && <span className={styles.rtlBadge}>RTL</span>}
                    </div>

                    <Heading as="h3" className={styles.langName}>
                      {getDisplayName(card)}
                    </Heading>
                    {hasScriptConverter(card.code) ? (
                      <p className={styles.nativeName}>
                        {card.nativeName || card.name} ({card.name})
                      </p>
                    ) : (
                      card.nativeName && card.nativeName !== card.name && (
                        <p className={styles.nativeName}>{card.name}</p>
                      )
                    )}

                    <div className={styles.cardDetails}>
                      {card.script && (
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Script:</span>
                          <span className={styles.detailVal}>{card.script}</span>
                        </div>
                      )}
                      {card.encyclopedic?.family && (
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Family:</span>
                          <span className={styles.detailVal} title={card.encyclopedic.family}>
                            {card.encyclopedic.family.split(' ')[0]}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Method Indicators row */}
                    <div className={styles.methodIndicatorGrid}>
                      {card.methodSupport?.googleTranslate && <span className={styles.dotGoogle} title="Google Translate supported">G</span>}
                      {card.methodSupport?.llm && <span className={styles.dotLlm} title="LLM supported">L</span>}
                      {(card.methodSupport?.llmCoached || card.methodSupport?.coached) && <span className={styles.dotCoached} title="Coached pipeline supported">C</span>}
                      {card.methodSupport?.api && <span className={styles.dotApi} title="API supported">A</span>}
                    </div>

                    <div className={styles.cardFooter}>
                      <span className={styles.viewDetailsText}>View Card Details →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal View */}
      {selectedLanguage && (
        <LanguageDetailsModal
          card={selectedLanguage}
          onClose={() => setSelectedLanguage(null)}
        />
      )}
    </Layout>
  );
}
