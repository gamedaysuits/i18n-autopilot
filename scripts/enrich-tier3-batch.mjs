#!/usr/bin/env node
/**
 * enrich-tier3-batch.mjs
 * 
 * Batch enrichment for Tier 3 language cards.
 * Adds linguisticChallenges, encyclopedic, and resources sections
 * to all remaining cards that don't have them yet.
 * 
 * Each language's data is curated from linguistic knowledge,
 * not auto-generated. Run with --dry-run to preview changes.
 */

import fs from 'fs';
import path from 'path';

const DRY_RUN = process.argv.includes('--dry-run');
const CARDS_DIR = path.resolve('lib/data/language-cards');

// ─── Enrichment data keyed by card code ─────────────────────────────────────

const ENRICHMENTS = {

  // ── Turkish ────────────────────────────────────────────────────────────────
  tr: {
    linguisticChallenges: {
      agglutination: "Turkish is heavily agglutinative — a single word can contain the root, tense, mood, person, negation, and question markers: 'yapabilecekmiydik' (were we going to be able to do). MT systems struggle with complex agglutinated forms and sometimes break words at incorrect morpheme boundaries.",
      vowelHarmony: "Turkish has strict vowel harmony — suffixes change their vowels to match the preceding syllable (front/back, rounded/unrounded). Breaking vowel harmony ('geliyorlar' is correct, not 'geliyorler') is immediately noticeable and marks output as non-native.",
      softeningAndBufferConsonants: "Consonant mutations (k→ğ, t→d, p→b, ç→c) and buffer consonants (y, n, s) apply when adding suffixes to stems. Getting these wrong produces misspellings — 'kitabı' (his book) not 'kitapı'. MT models frequently miss these mutations.",
      definiteAccusative: "Turkish marks definite direct objects with the accusative suffix -(y)ı/-(y)i: 'Dosyayı sil' (delete THE file) vs 'Dosya sil' (delete A file). English doesn't distinguish these, so MT from English often omits the accusative when it's required.",
      noGrammaticalGender: "Turkish has no grammatical gender at all — 'o' means he/she/it. This is an advantage for gender-neutral UI, but translating FROM Turkish to gendered languages requires context-based gender inference.",
      wordOrderSOV: "Turkish is SOV with the verb at the end. Variables in translation strings must account for this — English '{user} deleted {file}' → '{user} {file} dosyasını sildi'. The verb always comes last."
    },
    encyclopedic: {
      family: "Turkic (disputed: Altaic hypothesis)",
      demographics: { speakers: "~88 million", regions: ["Turkey", "Cyprus", "Germany", "Bulgaria"] },
      dialects: { split: false, classification: "Standard Turkish based on Istanbul dialect. Relatively uniform; Azerbaijani and Turkmen are separate languages.", variants: [] },
      history: "Modern Turkish was reformed by Atatürk in 1928 when the Arabic script was replaced with a modified Latin alphabet. The Turkish Language Association (TDK) was founded in 1932 to purify the language of Arabic and Persian loanwords.",
      resources: { wikipedia: "https://en.wikipedia.org/wiki/Turkish_language", foundations: [{ name: "Türk Dil Kurumu (TDK)", url: "https://www.tdk.gov.tr/" }], dictionaries: [{ name: "TDK Sözlük", url: "https://sozluk.gov.tr/" }] }
    },
    resources: {
      fsts: [{ name: "Zemberek (Turkish NLP)", url: "https://github.com/ahmetaa/zemberek-nlp", type: "morphological-analyzer" }],
      corpora: [{ name: "OPUS (multiple EN-TR parallel corpora)", url: "https://opus.nlpl.eu/results/en&tr/corpus-result-table", type: "parallel", pairs: ["en-tr"] }, { name: "FLORES+ devtest", url: "https://github.com/openlanguagedata/flores", type: "parallel", pairs: ["en-tr"] }],
      models: [{ name: "NLLB-200 (tur_Latn)", url: "https://huggingface.co/facebook/nllb-200-distilled-600M", type: "nmt" }]
    }
  },

  // ── Finnish ────────────────────────────────────────────────────────────────
  fi: {
    linguisticChallenges: {
      fifteenCases: "Finnish has 15 grammatical cases that modify noun endings. Placeholder variables create severe challenges — the case of the interpolated noun depends on its role in the sentence. '{file} has been deleted' requires the nominative, but 'in {folder}' requires the inessive (-ssa/-ssä).",
      agglutination: "Finnish is heavily agglutinative — 'talossanikin' (in my house too) is one word with four morphemes. MT systems struggle to produce correct multi-suffix forms and sometimes over-generate or under-generate suffixes.",
      consonantGradation: "Consonant gradation changes consonants in stem syllables when suffixes are added (pp→p, tt→t, kk→k, and more complex patterns). Incorrect gradation produces misspellings immediately noticeable to native speakers.",
      noArticles: "Finnish has no articles (no 'the' or 'a'). MT from English sometimes introduces unnecessary demonstratives ('tämä', 'se') to compensate, which sounds unnatural.",
      possessiveSuffixes: "Finnish can express possession through suffixes (-ni my, -si your, -nsa their) instead of separate words. The suffix form is more natural in many contexts — 'taloni' (my house) rather than 'minun talo'. MT tends to use the separate pronoun form, which sounds formal.",
      longWords: "Agglutination produces very long words — 'epäjärjestelmällisyydellisyydestä' (about the quality of being unsystematic) is grammatically valid. While UI text won't hit this extreme, compound words regularly exceed 20 characters, creating layout challenges."
    },
    encyclopedic: {
      family: "Uralic (Finnic)",
      demographics: { speakers: "~5.8 million", regions: ["Finland", "Sweden", "Estonia"] },
      dialects: { split: false, classification: "Standard Finnish based on western dialects. Eastern and western dialect groups differ but are mutually intelligible.", variants: [] },
      history: "Finnish gained official status alongside Swedish in 1863. Despite geographic proximity, Finnish is not related to Swedish, Norwegian, or any other Indo-European language — its closest major relative is Estonian.",
      resources: { wikipedia: "https://en.wikipedia.org/wiki/Finnish_language", foundations: [{ name: "Kotimaisten kielten keskus (Institute for the Languages of Finland)", url: "https://www.kotus.fi/" }], dictionaries: [{ name: "Kielitoimiston sanakirja", url: "https://www.kielitoimistonsanakirja.fi/" }] }
    },
    resources: {
      fsts: [{ name: "Omorfi (Finnish morphological analyzer)", url: "https://github.com/flammie/omorfi", type: "morphological-analyzer" }],
      corpora: [{ name: "OPUS (multiple EN-FI parallel corpora)", url: "https://opus.nlpl.eu/results/en&fi/corpus-result-table", type: "parallel", pairs: ["en-fi"] }, { name: "FLORES+ devtest", url: "https://github.com/openlanguagedata/flores", type: "parallel", pairs: ["en-fi"] }],
      models: [{ name: "NLLB-200 (fin_Latn)", url: "https://huggingface.co/facebook/nllb-200-distilled-600M", type: "nmt" }]
    }
  },

  // ── Hungarian ──────────────────────────────────────────────────────────────
  hu: {
    linguisticChallenges: {
      agglutination: "Hungarian is heavily agglutinative with 18 grammatical cases. A single noun can accumulate case suffix, possessive suffix, and plural marker: 'házaimban' (in my houses). MT must correctly sequence and combine these suffixes.",
      definiteConjugation: "Hungarian has two complete verb conjugation paradigms — definite and indefinite — based on whether the direct object is definite. 'Látom a fájlt' (I see THE file, definite) vs 'Látok egy fájlt' (I see A file, indefinite). Choosing the wrong conjugation is a glaring error. MT systems frequently confuse these.",
      vowelHarmony: "Like Turkish, Hungarian has strict vowel harmony (front/back). Suffixes change vowels to match their stem — '-ban/-ben' (in), '-nak/-nek' (for). Breaking vowel harmony is immediately wrong.",
      nameOrderReversed: "Hungarian uses Eastern name order (family name first): 'Kovács János' not 'János Kovács'. This affects placeholder strings — '{firstName} {lastName}' must be reversed. MT from English often preserves Western name order.",
      postpositions: "Hungarian uses postpositions instead of prepositions — 'az asztal alatt' (the table under = under the table). Variable positioning in strings must account for this.",
      noGrammaticalGender: "Like Turkish and Finnish, Hungarian has no grammatical gender — 'ő' is gender-neutral he/she. This simplifies inclusive writing but complicates translation to gendered languages."
    },
    encyclopedic: {
      family: "Uralic (Ugric)",
      demographics: { speakers: "~13 million", regions: ["Hungary", "Romania", "Slovakia", "Serbia", "Ukraine"] },
      dialects: { split: false, classification: "Standard Hungarian based on the central (Budapest) dialect. Dialects differ slightly in vocabulary and pronunciation but are mutually intelligible.", variants: [] },
      history: "Hungarian is a Uralic language, unrelated to its Slavic and Germanic neighbors. The closest relatives are the Ob-Ugric languages (Khanty and Mansi) spoken in western Siberia. Written records date to 1055 CE.",
      resources: { wikipedia: "https://en.wikipedia.org/wiki/Hungarian_language", foundations: [], dictionaries: [{ name: "Magyar Értelmező Kéziszótár", url: "https://www.szotar.net/" }] }
    },
    resources: {
      fsts: [{ name: "Magyarlánc (Hungarian NLP chain)", url: "https://github.com/ppke-nlpg/magyarlanc", type: "morphological-analyzer" }],
      corpora: [{ name: "OPUS (multiple EN-HU parallel corpora)", url: "https://opus.nlpl.eu/results/en&hu/corpus-result-table", type: "parallel", pairs: ["en-hu"] }, { name: "FLORES+ devtest", url: "https://github.com/openlanguagedata/flores", type: "parallel", pairs: ["en-hu"] }],
      models: [{ name: "NLLB-200 (hun_Latn)", url: "https://huggingface.co/facebook/nllb-200-distilled-600M", type: "nmt" }]
    }
  },

  // ── Hebrew ─────────────────────────────────────────────────────────────────
  he: {
    linguisticChallenges: {
      bidirectionalText: "Hebrew is RTL like Arabic, creating the same bidi challenges with embedded LTR content (variables, URLs, numbers, code). Placeholder strings like '{count} קבצות' require careful bidi handling to prevent visual reordering.",
      genderedVerbs: "Hebrew verbs conjugate for gender in second and third person — there is no gender-neutral 'you did'. 'עשית' (you did, masculine) vs 'עשית' (you did, feminine — same consonants but different pronunciation). For written UI, this is a real challenge. The slash form (עשית/עשית) or infinitive constructions ('לעשות') are common workarounds.",
      rootPatternMorphology: "Like Arabic, Hebrew uses root-pattern morphology where three-consonant roots generate word families through vowel patterns. K-T-B → כתב (wrote), כתיבה (writing), מכתב (letter), כתובת (address).",
      definiteness: "Hebrew marks definiteness with the prefix ה- (ha-). When a noun is definite, its adjective must also take the definite prefix: 'הקובץ הגדול' (the big file) not 'הקובץ גדול'. MT sometimes misses adjective definiteness agreement.",
      nikkud: "Hebrew vowels (nikkud/ניקוד) are usually omitted in modern text, creating ambiguity — 'דבר' could be 'davar' (thing), 'diber' (spoke), or 'dever' (plague). MT must disambiguate from context without producing unnecessary nikkud (which looks pedagogical in modern text).",
      dualNumber: "Hebrew has a dual number (-ayim suffix) used primarily for paired body parts and time units: 'שעתיים' (two hours), 'עיניים' (two eyes). This is less productive than Arabic's dual but must be handled correctly."
    },
    encyclopedic: {
      family: "Semitic (Afro-Asiatic)",
      demographics: { speakers: "~9 million (native), ~5 million L2", regions: ["Israel"] },
      dialects: { split: false, classification: "Modern Hebrew (Ivrit) is remarkably uniform due to its revival as a spoken language in the 20th century. No significant dialectal variation in software contexts.", variants: [] },
      history: "Hebrew was revived as a spoken language in the late 19th century by Eliezer Ben-Yehuda after centuries of use primarily as a liturgical and literary language. It is the only successfully revived dead language in history.",
      resources: { wikipedia: "https://en.wikipedia.org/wiki/Hebrew_language", foundations: [{ name: "Academy of the Hebrew Language (האקדמיה ללשון העברית)", url: "https://hebrew-academy.org.il/" }], dictionaries: [{ name: "Morfix (Hebrew-English dictionary)", url: "https://www.morfix.co.il/" }] }
    },
    resources: {
      fsts: [{ name: "YAP (Yet Another Parser for Hebrew)", url: "https://github.com/OnlpLab/yap", type: "morphological-analyzer" }],
      corpora: [{ name: "OPUS (multiple EN-HE parallel corpora)", url: "https://opus.nlpl.eu/results/en&he/corpus-result-table", type: "parallel", pairs: ["en-he"] }, { name: "FLORES+ devtest", url: "https://github.com/openlanguagedata/flores", type: "parallel", pairs: ["en-he"] }],
      models: [{ name: "NLLB-200 (heb_Hebr)", url: "https://huggingface.co/facebook/nllb-200-distilled-600M", type: "nmt" }]
    }
  },

  // ── Bengali ────────────────────────────────────────────────────────────────
  bn: {
    linguisticChallenges: {
      scriptComplexity: "Bengali script (বাংলা) uses conjunct consonants where multiple consonants merge into single glyphs. Incorrect rendering or font issues can make text illegible. MT output must produce valid Unicode sequences that render correctly across platforms.",
      formalPronounSystem: "Bengali has three register levels via pronouns: তুই (tui, very intimate/rude), তুমি (tumi, familiar), আপনি (apni, formal). Software UI must use আপনি consistently. Using তুই in a professional context is offensive.",
      verbInflection: "Bengali verbs inflect for tense, person, and formality level, creating complex paradigms. The same verb has different forms for আপনি vs তুমি vs তুই address levels, and MT must maintain consistency.",
      postpositions: "Like Hindi, Bengali uses postpositions. Variable-containing strings must account for postpositional placement after nouns.",
      banglaVsBangladeshi: "Standard Bengali (based on the Nadia dialect) is used in both West Bengal (India) and Bangladesh, but vocabulary and usage differ — particularly for technical terms. Software typically targets the larger Bangladeshi audience unless specifically for India."
    },
    encyclopedic: {
      family: "Indo-Aryan (Indo-European)",
      demographics: { speakers: "~270 million", regions: ["Bangladesh", "India (West Bengal, Tripura)"] },
      dialects: { split: true, classification: "Standard Bengali (চলিত ভাষা) based on Nadia dialect. Regional variation between Bangladesh and West Bengal in vocabulary and some pronunciation.", variants: ["bn-BD", "bn-IN"] },
      history: "Bengali is the 7th most spoken language in the world. It was central to the Language Movement of 1952 in East Pakistan (now Bangladesh), which is commemorated as International Mother Language Day by UNESCO.",
      resources: { wikipedia: "https://en.wikipedia.org/wiki/Bengali_language", foundations: [], dictionaries: [{ name: "Bangla Academy Dictionary", url: "https://www.banglaacademy.gov.bd/" }] }
    },
    resources: {
      fsts: [{ name: "IndicNLP Library (includes Bengali)", url: "https://github.com/anoopkunchukuttan/indic_nlp_library", type: "tokenizer" }],
      corpora: [{ name: "OPUS (multiple EN-BN parallel corpora)", url: "https://opus.nlpl.eu/results/bn&en/corpus-result-table", type: "parallel", pairs: ["en-bn"] }, { name: "FLORES+ devtest", url: "https://github.com/openlanguagedata/flores", type: "parallel", pairs: ["en-bn"] }],
      models: [{ name: "NLLB-200 (ben_Beng)", url: "https://huggingface.co/facebook/nllb-200-distilled-600M", type: "nmt" }, { name: "IndicTrans2 (AI4Bharat)", url: "https://github.com/AI4Bharat/IndicTrans2", type: "nmt" }]
    }
  },

  // ── Persian ────────────────────────────────────────────────────────────────
  fa: {
    linguisticChallenges: {
      rtlWithArabicScript: "Persian uses a modified Arabic script (with 4 additional letters: پ چ ژ گ) and is RTL. Bidi handling challenges are identical to Arabic. MT must produce correct Persian characters, not Arabic equivalents.",
      ezafe: "Persian uses the ezafe construction (a short unstressed -e/-ye linking nouns to their modifiers) that is usually not written: 'کتاب ِ بزرگ' (ketāb-e bozorg, big book). MT must understand this implicit link even though it's invisible in text.",
      formalVsColloquial: "Written Persian (فارسی نوشتاری) differs significantly from spoken Persian (فارسی محاوره‌ای). Written uses 'است' (is), spoken uses '-ه'. MT should produce written register for software but spoken register for conversational UI.",
      persianVsArabicLoanwords: "Persian borrows extensively from Arabic but modifies pronunciation and sometimes meaning. MT models sometimes produce Arabic-style morphology instead of the Persianized forms.",
      zwnj: "Persian uses the Zero-Width Non-Joiner (ZWNJ, U+200C) extensively to prevent letters from connecting in compound words: 'می‌خواهم' (I want) — the می and خواهم should be visually separate but connected to the word. Missing ZWNJs make text look wrong."
    },
    encyclopedic: {
      family: "Iranian (Indo-European)",
      demographics: { speakers: "~110 million (all varieties)", regions: ["Iran", "Afghanistan (Dari)", "Tajikistan (Tajik)"] },
      dialects: { split: true, classification: "Western Persian (Farsi, Iran), Dari (Afghanistan), and Tajik (Tajikistan, Cyrillic script) are the three standard varieties. Farsi and Dari are mutually intelligible; Tajik uses Cyrillic.", variants: ["fa-AF", "tg"] },
      history: "Persian is one of the oldest continuously spoken languages, with literary records dating to 500 BCE (Old Persian inscriptions at Persepolis). Modern Persian adopted the Arabic script after the Islamic conquest of the 7th century.",
      resources: { wikipedia: "https://en.wikipedia.org/wiki/Persian_language", foundations: [{ name: "Academy of Persian Language and Literature", url: "https://apll.ir/" }], dictionaries: [{ name: "Dehkhoda Dictionary", url: "https://dehkhoda.ut.ac.ir/" }] }
    },
    resources: {
      fsts: [{ name: "Hazm (Persian NLP toolkit)", url: "https://github.com/roshan-research/hazm", type: "tokenizer" }],
      corpora: [{ name: "OPUS (multiple EN-FA parallel corpora)", url: "https://opus.nlpl.eu/results/en&fa/corpus-result-table", type: "parallel", pairs: ["en-fa"] }, { name: "FLORES+ devtest", url: "https://github.com/openlanguagedata/flores", type: "parallel", pairs: ["en-fa"] }],
      models: [{ name: "NLLB-200 (pes_Arab)", url: "https://huggingface.co/facebook/nllb-200-distilled-600M", type: "nmt" }]
    }
  },

  // ── Bulgarian ──────────────────────────────────────────────────────────────
  bg: {
    linguisticChallenges: {
      definiteSuffix: "Bulgarian marks definiteness with a suffix (-ът/-ат, -та, -то, -те) attached to the first nominal element. This is unique among Slavic languages. MT must correctly place the definite article suffix rather than producing a separate article word.",
      noCaseSystem: "Bulgarian is the only major Slavic language that has lost its case system (except for pronouns). This simplifies some aspects but means word order carries more semantic weight than in Russian or Polish.",
      cliticDoubling: "Bulgarian uses clitic pronoun doubling where both a clitic and full pronoun appear: 'На мен ми хареса' (To me, it-to-me pleased = I liked it). MT from English often produces only one or the other, sounding unnatural.",
      renarration: "Bulgarian has a unique renarrative mood (преизказно наклонение) used for hearsay or unwitnessed events. There is no equivalent in English or most other languages, making it a distinctive translation challenge."
    },
    encyclopedic: {
      family: "Slavic (Indo-European)",
      demographics: { speakers: "~8 million", regions: ["Bulgaria"] },
      dialects: { split: false, classification: "Standard Bulgarian based on eastern dialects. Western dialects are transitional toward Macedonian.", variants: [] },
      history: "Bulgarian is the oldest documented Slavic language. The Cyrillic alphabet was developed in the First Bulgarian Empire in the 9th century and later spread to Russia, Serbia, and other Slavic peoples.",
      resources: { wikipedia: "https://en.wikipedia.org/wiki/Bulgarian_language", foundations: [], dictionaries: [{ name: "Rechnik.info (Bulgarian dictionary)", url: "https://rechnik.info/" }] }
    },
    resources: {
      fsts: [{ name: "spaCy (no dedicated Bulgarian model; use multilingual)", url: "https://spacy.io/models", type: "tokenizer" }],
      corpora: [{ name: "OPUS (multiple EN-BG parallel corpora)", url: "https://opus.nlpl.eu/results/bg&en/corpus-result-table", type: "parallel", pairs: ["en-bg"] }, { name: "FLORES+ devtest", url: "https://github.com/openlanguagedata/flores", type: "parallel", pairs: ["en-bg"] }],
      models: [{ name: "NLLB-200 (bul_Cyrl)", url: "https://huggingface.co/facebook/nllb-200-distilled-600M", type: "nmt" }]
    }
  },

  // ── Czech ──────────────────────────────────────────────────────────────────
  cs: {
    linguisticChallenges: {
      sevenCases: "Like Polish, Czech has seven grammatical cases. Case endings affect nouns, adjectives, pronouns, and numerals. Placeholder variables in translation strings face the same challenges as in other case-heavy Slavic languages.",
      háčkyAndČárky: "Czech diacritics (háčky: š, č, ř, ž, ň, ď, ť and čárky: á, é, í, ó, ú, ů, ý) are essential and meaning-distinguishing. The letter ř (a raised alveolar trill) is unique to Czech and is notoriously difficult for non-native speakers.",
      aspectAndMotion: "Czech shares the Slavic aspect system (perfective/imperfective) and complex motion verb system with Russian and Polish, creating the same translation challenges.",
      formalAddress: "Czech uses Pan/Paní (similar to Polish) for formal address and vy/ty for formal/informal pronouns. The formal system is fully gendered."
    },
    encyclopedic: {
      family: "Slavic (Indo-European)",
      demographics: { speakers: "~10.7 million", regions: ["Czech Republic", "Slovakia"] },
      dialects: { split: false, classification: "Standard Czech (spisovná čeština) based on central Bohemian dialect. Common Czech (obecná čeština) is a widely spoken informal koiné.", variants: [] },
      history: "Czech has a rich literary tradition dating to the 14th century. Jan Hus introduced diacritical marks in the 15th century that were later adopted by other Slavic languages using Latin script.",
      resources: { wikipedia: "https://en.wikipedia.org/wiki/Czech_language", foundations: [], dictionaries: [{ name: "Internetová jazyková příručka (Czech language guide)", url: "https://prirucka.ujc.cas.cz/" }] }
    },
    resources: {
      fsts: [{ name: "MorphoDiTa (Czech morphological analyzer)", url: "https://ufal.mff.cuni.cz/morphodita", type: "morphological-analyzer" }],
      corpora: [{ name: "OPUS (multiple EN-CS parallel corpora)", url: "https://opus.nlpl.eu/results/cs&en/corpus-result-table", type: "parallel", pairs: ["en-cs"] }, { name: "FLORES+ devtest", url: "https://github.com/openlanguagedata/flores", type: "parallel", pairs: ["en-cs"] }],
      models: [{ name: "NLLB-200 (ces_Latn)", url: "https://huggingface.co/facebook/nllb-200-distilled-600M", type: "nmt" }]
    }
  },

  // ── Danish ─────────────────────────────────────────────────────────────────
  da: {
    linguisticChallenges: {
      enEtGender: "Danish has two grammatical genders: common (en-words) and neuter (et-words). Choosing the wrong article is conspicuous — 'en fil' (a file, common) vs 'et program' (a program, neuter).",
      compoundNouns: "Like German and Dutch, Danish forms compound nouns by concatenation: 'speciallægepraksisplanlægningsstabiliseringsperiode' is a valid (if extreme) word. Linking '-s-' and '-e-' rules are complex.",
      stød: "Danish has stød (glottal constriction) that distinguishes otherwise identical words. While invisible in writing, it affects how native speakers perceive written text and can influence MT pronunciation models.",
      scandinavianMutualIntelligibility: "Danish, Swedish, and Norwegian (Bokmål) are mutually intelligible to varying degrees. MT models sometimes produce Scandinavian mixing — using Norwegian vocabulary in Danish output or vice versa."
    },
    encyclopedic: {
      family: "Germanic (Indo-European)",
      demographics: { speakers: "~6 million", regions: ["Denmark", "Greenland", "Faroe Islands"] },
      dialects: { split: false, classification: "Standard Danish (rigsdansk) based on the Copenhagen dialect. Regional dialects exist but are declining.", variants: [] },
      history: "Danish was historically the prestige language of Scandinavia and was the written language of Norway until the 19th century. Modern Norwegian Bokmål is essentially Norwegianized Danish.",
      resources: { wikipedia: "https://en.wikipedia.org/wiki/Danish_language", foundations: [{ name: "Dansk Sprognævn (Danish Language Council)", url: "https://dsn.dk/" }], dictionaries: [{ name: "Den Danske Ordbog", url: "https://ordnet.dk/ddo" }] }
    },
    resources: {
      fsts: [{ name: "spaCy Danish model (da_core_news_sm)", url: "https://spacy.io/models/da", type: "tokenizer" }],
      corpora: [{ name: "OPUS (multiple EN-DA parallel corpora)", url: "https://opus.nlpl.eu/results/da&en/corpus-result-table", type: "parallel", pairs: ["en-da"] }, { name: "FLORES+ devtest", url: "https://github.com/openlanguagedata/flores", type: "parallel", pairs: ["en-da"] }],
      models: [{ name: "NLLB-200 (dan_Latn)", url: "https://huggingface.co/facebook/nllb-200-distilled-600M", type: "nmt" }]
    }
  },

  // ── Greek ──────────────────────────────────────────────────────────────────
  el: {
    linguisticChallenges: {
      polytonic: "Modern Greek uses a monotonic accentuation system (single accent mark), but some scholarly and religious texts use polytonic. MT should always produce monotonic unless specifically instructed otherwise.",
      caseSystem: "Greek has four grammatical cases (nominative, genitive, accusative, vocative) that affect articles, nouns, and adjectives. Less complex than Slavic languages but still creates placeholder challenges.",
      formalAddress: "Greek uses εσείς (eseis, formal/plural) vs εσύ (esy, informal). The formal εσείς is standard in software UI.",
      greeklish: "Greeks sometimes write in Latin characters (Greeklish) informally. MT should never produce Greeklish — output must always be in Greek script."
    },
    encyclopedic: {
      family: "Hellenic (Indo-European)",
      demographics: { speakers: "~13 million", regions: ["Greece", "Cyprus", "diaspora"] },
      dialects: { split: false, classification: "Standard Modern Greek (Νέα Ελληνικά) based on Demotic Greek. The katharevousa/demotic language question was resolved in favor of Demotic in 1976.", variants: ["el-CY"] },
      history: "Greek has the longest documented history of any Indo-European language, with records spanning 3,400 years. Modern Greek descends from Koine Greek, the lingua franca of the Hellenistic period.",
      resources: { wikipedia: "https://en.wikipedia.org/wiki/Greek_language", foundations: [], dictionaries: [{ name: "Lexigram (Greek dictionary)", url: "https://www.lexigram.gr/" }] }
    },
    resources: {
      fsts: [{ name: "spaCy Greek model (el_core_news_sm)", url: "https://spacy.io/models/el", type: "tokenizer" }],
      corpora: [{ name: "OPUS (multiple EN-EL parallel corpora)", url: "https://opus.nlpl.eu/results/el&en/corpus-result-table", type: "parallel", pairs: ["en-el"] }, { name: "FLORES+ devtest", url: "https://github.com/openlanguagedata/flores", type: "parallel", pairs: ["en-el"] }],
      models: [{ name: "NLLB-200 (ell_Grek)", url: "https://huggingface.co/facebook/nllb-200-distilled-600M", type: "nmt" }]
    }
  },

  // ── Swedish ────────────────────────────────────────────────────────────────
  sv: {
    linguisticChallenges: {
      enEttGender: "Swedish has two grammatical genders: common (en-words) and neuter (ett-words). Like Danish, wrong article choice is conspicuous — 'en dator' (a computer) vs 'ett program' (a program).",
      compoundNouns: "Swedish forms compounds by concatenation. 'Sjukhus' (hospital = sick + house), 'datorprogram' (computer program). Linking rules (-s-, -e-) must be correct.",
      duVsNi: "Swedish underwent a pronoun reform in the 1960s-70s where the informal 'du' largely replaced the formal 'ni'. Modern Swedish software uses 'du' universally — using 'ni' sounds old-fashioned or ironically formal.",
      scandinavianMixing: "MT models sometimes produce Norwegian or Danish words in Swedish output due to the high mutual intelligibility. 'Ikke' (NO/DA) instead of 'inte' (SV), for example."
    },
    encyclopedic: {
      family: "Germanic (Indo-European)",
      demographics: { speakers: "~13 million (including L2)", regions: ["Sweden", "Finland"] },
      dialects: { split: false, classification: "Standard Swedish (rikssvenska) based on Central Swedish dialects. Finland Swedish is a recognized variety with some vocabulary differences.", variants: ["sv-FI"] },
      history: "Swedish is an official language in both Sweden and Finland. The 'du-reform' of the late 1960s democratized address forms, making Swedish one of the most egalitarian European languages in terms of formality.",
      resources: { wikipedia: "https://en.wikipedia.org/wiki/Swedish_language", foundations: [{ name: "Svenska Akademien (Swedish Academy)", url: "https://www.svenskaakademien.se/" }], dictionaries: [{ name: "SAOL (Swedish Academy Dictionary)", url: "https://svenska.se/" }] }
    },
    resources: {
      fsts: [{ name: "spaCy Swedish model (sv_core_news_sm)", url: "https://spacy.io/models/sv", type: "tokenizer" }],
      corpora: [{ name: "OPUS (multiple EN-SV parallel corpora)", url: "https://opus.nlpl.eu/results/en&sv/corpus-result-table", type: "parallel", pairs: ["en-sv"] }, { name: "FLORES+ devtest", url: "https://github.com/openlanguagedata/flores", type: "parallel", pairs: ["en-sv"] }],
      models: [{ name: "NLLB-200 (swe_Latn)", url: "https://huggingface.co/facebook/nllb-200-distilled-600M", type: "nmt" }]
    }
  },

  // ── Norwegian Bokmål ──────────────────────────────────────────────────────
  nb: {
    linguisticChallenges: {
      bokmålVsNynorsk: "Norway has two official written standards: Bokmål (based on Dano-Norwegian) and Nynorsk (based on rural dialects). MT must target the correct one — they are different enough that mixing them is immediately noticeable. 'nb' targets Bokmål.",
      threeGenders: "Norwegian Bokmål can use either two genders (common/neuter like Danish) or three genders (masculine/feminine/neuter). The three-gender system is more colloquial and increasingly common. MT should be consistent about which system it uses.",
      compoundNouns: "Like other Scandinavian languages, Norwegian forms compounds by concatenation with linking elements.",
      scandinavianMixing: "MT models have particular difficulty distinguishing Norwegian from Danish due to their extreme similarity in written form. Vocabulary differences (e.g., 'snakke' NO vs 'tale' DA for 'speak') must be correct."
    },
    encyclopedic: {
      family: "Germanic (Indo-European)",
      demographics: { speakers: "~5.3 million", regions: ["Norway"] },
      dialects: { split: true, classification: "Bokmål and Nynorsk are both official written standards. Bokmål is used by ~85-90% of the population. Spoken dialects vary enormously and have high social prestige.", variants: ["nn"] },
      history: "Bokmål evolved from Dano-Norwegian, the written language used during Norway's union with Denmark (1380–1814). Nynorsk was created by Ivar Aasen in the 19th century as a 'purer' Norwegian based on rural dialects.",
      resources: { wikipedia: "https://en.wikipedia.org/wiki/Norwegian_language", foundations: [{ name: "Språkrådet (Language Council of Norway)", url: "https://www.sprakradet.no/" }], dictionaries: [{ name: "Bokmålsordboka", url: "https://ordbokene.no/" }] }
    },
    resources: {
      fsts: [{ name: "spaCy Norwegian model (nb_core_news_sm)", url: "https://spacy.io/models/nb", type: "tokenizer" }],
      corpora: [{ name: "OPUS (multiple EN-NO parallel corpora)", url: "https://opus.nlpl.eu/results/en&no/corpus-result-table", type: "parallel", pairs: ["en-nb"] }, { name: "FLORES+ devtest", url: "https://github.com/openlanguagedata/flores", type: "parallel", pairs: ["en-nb"] }],
      models: [{ name: "NLLB-200 (nob_Latn)", url: "https://huggingface.co/facebook/nllb-200-distilled-600M", type: "nmt" }]
    }
  },

  // ── Shorter entries for remaining languages ──────────────────────────────
  ro: {
    linguisticChallenges: {
      definiteSuffix: "Romanian marks definiteness with a suffix (-ul/-le, -a, -lui) attached to the noun, similar to Bulgarian. MT must produce suffixed articles, not separate words.",
      caseSystem: "Romanian retains a case system (unique among Romance languages) with nominative-accusative and genitive-dative distinctions.",
      diacritics: "Romanian uses ș, ț, â, î, ă. Missing diacritics change meaning — 'tara' vs 'țara' (country). Old cedilla forms (ş, ţ) vs comma-below forms (ș, ț) create font/encoding issues."
    },
    encyclopedic: { family: "Romance (Indo-European)", demographics: { speakers: "~26 million", regions: ["Romania", "Moldova"] }, dialects: { split: true, classification: "Standard Romanian based on Wallachian dialect. Moldovan is politically distinct but linguistically identical.", variants: ["mo"] }, history: "Romanian is the only Romance language in Eastern Europe, surrounded by Slavic and Hungarian languages. It retained Latin grammar structure despite heavy Slavic vocabulary influence.", resources: { wikipedia: "https://en.wikipedia.org/wiki/Romanian_language", foundations: [], dictionaries: [{ name: "DEX Online (Romanian dictionary)", url: "https://dexonline.ro/" }] } },
    resources: { fsts: [{ name: "spaCy Romanian model (ro_core_news_sm)", url: "https://spacy.io/models/ro", type: "tokenizer" }], corpora: [{ name: "OPUS (EN-RO corpora)", url: "https://opus.nlpl.eu/results/en&ro/corpus-result-table", type: "parallel", pairs: ["en-ro"] }], models: [{ name: "NLLB-200 (ron_Latn)", url: "https://huggingface.co/facebook/nllb-200-distilled-600M", type: "nmt" }] }
  },

  sk: {
    linguisticChallenges: {
      closeToCzech: "Slovak and Czech are closely related and partially mutually intelligible. MT models sometimes produce Czech words in Slovak output or vice versa. Key vocabulary differences exist — 'vlak' (SK, train) vs 'vlak' (CS, same but different compounds).",
      sevenCases: "Like Czech and Polish, Slovak has seven grammatical cases with complex declension patterns.",
      rhythmicRule: "Slovak has a unique 'rhythmic law' (rytmický zákon) where two consecutive long syllables are prohibited. This affects suffix forms and can trip up MT models that don't encode this phonological rule."
    },
    encyclopedic: { family: "Slavic (Indo-European)", demographics: { speakers: "~5.2 million", regions: ["Slovakia", "Czech Republic", "Serbia"] }, dialects: { split: false, classification: "Standard Slovak based on Central Slovak dialects. Western dialects are transitional toward Czech.", variants: [] }, history: "Slovak was standardized in the 19th century by Ľudovít Štúr based on Central Slovak dialects, distinguishing it from the earlier Czech-based literary tradition.", resources: { wikipedia: "https://en.wikipedia.org/wiki/Slovak_language", foundations: [], dictionaries: [{ name: "Slovník slovenského jazyka", url: "https://slovnik.juls.savba.sk/" }] } },
    resources: { fsts: [], corpora: [{ name: "OPUS (EN-SK corpora)", url: "https://opus.nlpl.eu/results/en&sk/corpus-result-table", type: "parallel", pairs: ["en-sk"] }], models: [{ name: "NLLB-200 (slk_Latn)", url: "https://huggingface.co/facebook/nllb-200-distilled-600M", type: "nmt" }] }
  },

  sr: {
    linguisticChallenges: {
      dualScript: "Serbian uses both Cyrillic (official) and Latin script interchangeably. Software must support both or clearly target one. MT output must be in the correct script — producing Cyrillic when Latin is expected (or vice versa) is a critical error.",
      sevenCases: "Serbian has seven grammatical cases like other South Slavic languages, with complex noun and adjective declension.",
      ekavianVsIjekavian: "Serbian has two pronunciation/spelling standards: Ekavian (Belgrade, used in Serbia) and Ijekavian (used in Bosnia, Montenegro). 'Mleko' vs 'Mlijeko' (milk). Software typically targets Ekavian."
    },
    encyclopedic: { family: "Slavic (Indo-European)", demographics: { speakers: "~12 million", regions: ["Serbia", "Bosnia and Herzegovina", "Montenegro", "Kosovo"] }, dialects: { split: true, classification: "Standard Serbian uses Ekavian pronunciation (Belgrade dialect). Ijekavian is used in western regions. Bosnian and Croatian are near-identical but politically distinct.", variants: ["sr-Latn", "sr-Cyrl"] }, history: "Serbian, Croatian, Bosnian, and Montenegrin were historically considered one language (Serbo-Croatian). Political separation after Yugoslavia's dissolution led to distinct standardization, though mutual intelligibility remains near-total.", resources: { wikipedia: "https://en.wikipedia.org/wiki/Serbian_language", foundations: [], dictionaries: [] } },
    resources: { fsts: [], corpora: [{ name: "OPUS (EN-SR corpora)", url: "https://opus.nlpl.eu/results/en&sr/corpus-result-table", type: "parallel", pairs: ["en-sr"] }], models: [{ name: "NLLB-200 (srp_Cyrl)", url: "https://huggingface.co/facebook/nllb-200-distilled-600M", type: "nmt" }] }
  },

  uk: {
    linguisticChallenges: {
      ukrainianVsRussian: "Ukrainian and Russian are distinct languages despite superficial similarity. MT models sometimes produce Russian words in Ukrainian output (especially for technical terms). Key differences: 'и' (UA) vs 'и' (RU) are different sounds; 'ґ' exists only in Ukrainian.",
      sevenCases: "Ukrainian has seven grammatical cases like other East Slavic languages. The vocative case is actively used in modern Ukrainian, unlike in Russian.",
      apostrophe: "Ukrainian uses the apostrophe (') as a letter to indicate non-palatalization before iotated vowels: 'м'який' (soft). This is a meaningful orthographic element, not punctuation."
    },
    encyclopedic: { family: "Slavic (Indo-European)", demographics: { speakers: "~45 million", regions: ["Ukraine", "diaspora"] }, dialects: { split: false, classification: "Standard Ukrainian based on the southeastern dialect. Northern, southwestern, and southeastern dialect groups exist.", variants: [] }, history: "Ukrainian is the second most spoken Slavic language. Its use was restricted during both Russian Imperial and Soviet periods. Since 2019, Ukrainian is the sole state language of Ukraine.", resources: { wikipedia: "https://en.wikipedia.org/wiki/Ukrainian_language", foundations: [], dictionaries: [{ name: "SUM (Ukrainian language dictionary)", url: "https://sum.in.ua/" }] } },
    resources: { fsts: [{ name: "pymorphy2 (supports Ukrainian)", url: "https://github.com/pymorphy2/pymorphy2", type: "morphological-analyzer" }], corpora: [{ name: "OPUS (EN-UK corpora)", url: "https://opus.nlpl.eu/results/en&uk/corpus-result-table", type: "parallel", pairs: ["en-uk"] }], models: [{ name: "NLLB-200 (ukr_Cyrl)", url: "https://huggingface.co/facebook/nllb-200-distilled-600M", type: "nmt" }] }
  },

  ur: {
    linguisticChallenges: {
      nastaliqScript: "Urdu uses the Nastaliq calligraphic style of the Perso-Arabic script, which is more complex to render than Naskh (used for Arabic). Many digital fonts default to Naskh, producing readable but aesthetically wrong Urdu.",
      hindiUrduContinuum: "Urdu and Hindi are mutually intelligible in spoken form but use different scripts and draw vocabulary from different sources (Persian/Arabic for Urdu vs Sanskrit for Hindi). MT models sometimes produce Hindi-influenced vocabulary.",
      rtlWithMixedScript: "Like Arabic and Persian, Urdu faces bidi challenges with embedded LTR content."
    },
    encyclopedic: { family: "Indo-Aryan (Indo-European)", demographics: { speakers: "~230 million (including L2)", regions: ["Pakistan", "India"] }, dialects: { split: false, classification: "Standard Urdu based on the Khariboli dialect (same base as Hindi). Register differences come from vocabulary source (Persian/Arabic vs Sanskrit).", variants: [] }, history: "Urdu developed as a literary register of Hindustani during the Mughal period, drawing heavily on Persian and Arabic vocabulary. It became the national language of Pakistan at independence in 1947.", resources: { wikipedia: "https://en.wikipedia.org/wiki/Urdu", foundations: [], dictionaries: [{ name: "Urdu Lughat (Urdu dictionary)", url: "https://urdulughat.info/" }] } },
    resources: { fsts: [{ name: "IndicNLP Library (includes Urdu)", url: "https://github.com/anoopkunchukuttan/indic_nlp_library", type: "tokenizer" }], corpora: [{ name: "OPUS (EN-UR corpora)", url: "https://opus.nlpl.eu/results/en&ur/corpus-result-table", type: "parallel", pairs: ["en-ur"] }], models: [{ name: "NLLB-200 (urd_Arab)", url: "https://huggingface.co/facebook/nllb-200-distilled-600M", type: "nmt" }] }
  },

  sw: {
    linguisticChallenges: {
      nounClassSystem: "Swahili has 15-18 noun classes (similar to grammatical gender but far more complex). Each class takes different prefixes on nouns, adjectives, verbs, and demonstratives. MT must maintain agreement across all these elements.",
      agglutination: "Swahili verbs encode subject, tense, object, and other information in prefixes and suffixes: 'nitakupenda' = ni-ta-ku-penda (I-will-you-love). MT must correctly sequence these morphemes.",
      loanwordLayers: "Swahili has substantial Arabic and English loanword layers. Technical terms often come from English — the balance between native Swahili and English terms varies by register."
    },
    encyclopedic: { family: "Bantu (Niger-Congo)", demographics: { speakers: "~200 million (mostly L2)", regions: ["Tanzania", "Kenya", "Uganda", "DR Congo", "East Africa"] }, dialects: { split: false, classification: "Standard Swahili based on the Zanzibar (Unguja) dialect. Used as a lingua franca across East Africa.", variants: [] }, history: "Swahili is the most widely spoken Bantu language and serves as a lingua franca across East Africa. It was adopted by the African Union as an official language in 2004.", resources: { wikipedia: "https://en.wikipedia.org/wiki/Swahili_language", foundations: [], dictionaries: [{ name: "TUKI Kamusi (Swahili dictionary)", url: "https://kamusi.org/" }] } },
    resources: { fsts: [], corpora: [{ name: "OPUS (EN-SW corpora)", url: "https://opus.nlpl.eu/results/en&sw/corpus-result-table", type: "parallel", pairs: ["en-sw"] }], models: [{ name: "NLLB-200 (swh_Latn)", url: "https://huggingface.co/facebook/nllb-200-distilled-600M", type: "nmt" }] }
  },

  id: {
    linguisticChallenges: {
      noConjugation: "Indonesian has no verb conjugation, no tense markers, and no noun declension. Time is expressed through context and adverbs. MT from heavily inflected languages sometimes produces redundant temporal markers.",
      affixSystem: "Indonesian uses a complex prefix/suffix system (me-/ber-/pe-/ke-/-kan/-an/-i) to modify word meaning and grammatical role. The base word 'tulis' (write) → menulis (to write), penulis (writer), tulisan (writing), ditulis (was written).",
      indonesianVsMalay: "Indonesian and Malay are closely related but differ in vocabulary and some spelling conventions. MT must not mix them."
    },
    encyclopedic: { family: "Austronesian (Malayo-Polynesian)", demographics: { speakers: "~270 million (including L2)", regions: ["Indonesia"] }, dialects: { split: false, classification: "Standard Indonesian (Bahasa Indonesia) based on Riau Malay. Despite Indonesia's enormous linguistic diversity (700+ languages), Indonesian is relatively uniform.", variants: [] }, history: "Indonesian was chosen as the national language at independence (1945) despite being the native language of only ~7% of the population, because of its role as a trade lingua franca and its perceived neutrality among ethnic groups.", resources: { wikipedia: "https://en.wikipedia.org/wiki/Indonesian_language", foundations: [], dictionaries: [{ name: "KBBI (official Indonesian dictionary)", url: "https://kbbi.kemdikbud.go.id/" }] } },
    resources: { fsts: [], corpora: [{ name: "OPUS (EN-ID corpora)", url: "https://opus.nlpl.eu/results/en&id/corpus-result-table", type: "parallel", pairs: ["en-id"] }], models: [{ name: "NLLB-200 (ind_Latn)", url: "https://huggingface.co/facebook/nllb-200-distilled-600M", type: "nmt" }] }
  },

  ms: {
    linguisticChallenges: {
      malayVsIndonesian: "Malay and Indonesian are closely related but differ in vocabulary — 'kereta' (MY, car) vs 'mobil' (ID, car), 'telefon bimbit' (MY, mobile) vs 'telepon genggam' (ID, mobile). MT must target the correct variety.",
      noConjugation: "Like Indonesian, Malay has no verb conjugation or grammatical gender. This simplifies some aspects of translation but means context carries more weight.",
      affixSystem: "Malay shares the same affix system as Indonesian but some prefix forms differ in usage and productivity."
    },
    encyclopedic: { family: "Austronesian (Malayo-Polynesian)", demographics: { speakers: "~33 million (native)", regions: ["Malaysia", "Singapore", "Brunei"] }, dialects: { split: false, classification: "Standard Malay (Bahasa Melayu) based on the Johor-Riau dialect. Identical to Indonesian at the structural level but divergent in vocabulary.", variants: ["ms-SG", "ms-BN"] }, history: "Malay has been a lingua franca of maritime Southeast Asia for centuries. It became the national language of Malaysia (as Bahasa Melayu/Bahasa Malaysia) at independence in 1957.", resources: { wikipedia: "https://en.wikipedia.org/wiki/Malay_language", foundations: [{ name: "Dewan Bahasa dan Pustaka (Institute of Language and Literature)", url: "https://www.dbp.gov.my/" }], dictionaries: [] } },
    resources: { fsts: [], corpora: [{ name: "OPUS (EN-MS corpora)", url: "https://opus.nlpl.eu/results/en&ms/corpus-result-table", type: "parallel", pairs: ["en-ms"] }], models: [{ name: "NLLB-200 (zsm_Latn)", url: "https://huggingface.co/facebook/nllb-200-distilled-600M", type: "nmt" }] }
  },

  tl: {
    linguisticChallenges: {
      taglish: "Filipino (Tagalog) in modern tech contexts heavily code-switches with English (Taglish). The balance varies by formality — pure Filipino reads as government/academic, heavy English reads as pretentious. Software UI typically uses moderate Taglish.",
      focusSystem: "Tagalog has a focus/voice system where verb affixes indicate the semantic role of the topic (actor, object, location, etc.). This is fundamentally different from active/passive voice in European languages and is notoriously difficult for MT.",
      affixComplexity: "Tagalog uses extensive affixation (prefixes, infixes, suffixes) to derive words. The same root can produce dozens of derived forms through different affix combinations."
    },
    encyclopedic: { family: "Austronesian (Malayo-Polynesian)", demographics: { speakers: "~82 million (Filipino/Tagalog)", regions: ["Philippines", "United States"] }, dialects: { split: false, classification: "Filipino is the standardized form of Tagalog. Other Philippine languages (Cebuano, Ilocano, Hiligaynon) are separate languages, not dialects.", variants: [] }, history: "Filipino (based on Tagalog) was established as the national language in 1937 and became an official language alongside English in 1987. The Philippines is one of the most English-proficient countries in Asia.", resources: { wikipedia: "https://en.wikipedia.org/wiki/Filipino_language", foundations: [{ name: "Komisyon sa Wikang Filipino (Commission on the Filipino Language)", url: "https://kwf.gov.ph/" }], dictionaries: [] } },
    resources: { fsts: [], corpora: [{ name: "OPUS (EN-TL corpora)", url: "https://opus.nlpl.eu/results/en&tl/corpus-result-table", type: "parallel", pairs: ["en-tl"] }], models: [{ name: "NLLB-200 (tgl_Latn)", url: "https://huggingface.co/facebook/nllb-200-distilled-600M", type: "nmt" }] }
  },

  // ── Regional variants (inherit most challenges from parent) ────────────
  "es-MX": {
    linguisticChallenges: {
      mexicanVocabulary: "Mexican Spanish has distinct vocabulary from both Peninsular and neutral Latin American Spanish — 'computadora' (computer), 'platicar' (to chat, vs 'hablar/conversar'), 'chido' (cool, casual). MT must produce Mexican-specific terms, not generic LatAm or Peninsular vocabulary.",
      nahuatlLoanwords: "Mexican Spanish includes Nahuatl-origin words not found in other varieties — 'chocolate', 'tomate', 'aguacate' (avocado) are universal, but 'chamaco' (kid), 'mitote' (commotion) are specifically Mexican.",
      ustedUsage: "Mexico uses 'usted' more broadly than many other Latin American countries — it can indicate respect rather than social distance. The tú/usted threshold is different from Argentine or Chilean Spanish."
    },
    encyclopedic: { family: "Romance (Indo-European)", demographics: { speakers: "~130 million", regions: ["Mexico", "United States"] }, dialects: { split: false, classification: "Mexican Spanish is relatively uniform in its standard form. Regional differences exist (norteño, costeño, yucateco) but are not relevant for software.", variants: [] }, history: "Mexico has the largest Spanish-speaking population in the world. Mexican Spanish has been influenced by Nahuatl and other indigenous languages, creating unique vocabulary and expressions.", resources: { wikipedia: "https://en.wikipedia.org/wiki/Mexican_Spanish", foundations: [], dictionaries: [{ name: "Diccionario del Español de México", url: "https://dem.colmex.mx/" }] } },
    resources: { fsts: [], corpora: [{ name: "OPUS (EN-ES corpora)", url: "https://opus.nlpl.eu/results/en&es/corpus-result-table", type: "parallel", pairs: ["en-es"] }], models: [{ name: "NLLB-200 (spa_Latn)", url: "https://huggingface.co/facebook/nllb-200-distilled-600M", type: "nmt" }] }
  },

  "fr-CA": {
    linguisticChallenges: {
      quebecVocabulary: "Quebec French has distinct vocabulary from France French — 'char' (car, vs 'voiture'), 'magasinage' (shopping, vs 'shopping'), 'courriel' (email, vs 'email/e-mail'). Quebec French often creates French neologisms for English terms that France French borrows directly.",
      tuVsVous: "Quebec French uses 'tu' more broadly than France French — 'tu' is standard in most consumer contexts. The vous/tu threshold is lower.",
      sacres: "Quebec French has a unique set of profanity derived from Catholic liturgical terms (tabernac, câlice, ostie). While not relevant for professional UI, MT models trained on informal Quebec text sometimes produce these inappropriately.",
      officeDeLaLangue: "The Office québécois de la langue française (OQLF) actively promotes French terminology over English loanwords, which affects technical vocabulary choices."
    },
    encyclopedic: { family: "Romance (Indo-European)", demographics: { speakers: "~7.3 million", regions: ["Canada (Quebec, New Brunswick, Ontario)"] }, dialects: { split: false, classification: "Quebec French (français québécois) is the standard for Canadian French. Acadian French is a distinct variety spoken in New Brunswick.", variants: [] }, history: "Canadian French developed largely independently from European French after British conquest in 1763. The Quiet Revolution (1960s) and Quebec's language laws (notably Bill 101, 1977) strengthened French in public life.", resources: { wikipedia: "https://en.wikipedia.org/wiki/Quebec_French", foundations: [{ name: "Office québécois de la langue française", url: "https://www.oqlf.gouv.qc.ca/" }], dictionaries: [{ name: "Usito (Quebec French dictionary)", url: "https://usito.usherbrooke.ca/" }] } },
    resources: { fsts: [], corpora: [{ name: "OPUS (EN-FR corpora)", url: "https://opus.nlpl.eu/results/en&fr/corpus-result-table", type: "parallel", pairs: ["en-fr"] }], models: [{ name: "NLLB-200 (fra_Latn)", url: "https://huggingface.co/facebook/nllb-200-distilled-600M", type: "nmt" }] }
  },

  "pt-PT": {
    linguisticChallenges: {
      europeanVsBrazilian: "European Portuguese differs substantially from Brazilian in vocabulary, grammar, and pronunciation. See pt.json for the full BR/PT divergence description.",
      enclisis: "European Portuguese strongly prefers enclisis (pronoun after verb: 'diga-me') while Brazilian prefers proclisis ('me diga'). This is the most visible grammatical difference.",
      mesoclisis: "European Portuguese still uses mesoclisis (pronoun inserted into future/conditional verbs: 'dir-lhe-ei' = I will tell him) in formal writing. This form is extinct in Brazilian Portuguese.",
      orthographicAgreement: "The 1990 Orthographic Agreement eliminated some spelling differences between BR and PT, but remains controversial in Portugal. Some words lost accents or consonants: 'acção' → 'ação', 'óptimo' → 'ótimo'."
    },
    encyclopedic: { family: "Romance (Indo-European)", demographics: { speakers: "~10 million (European Portuguese)", regions: ["Portugal", "Angola (partly)", "Mozambique (partly)"] }, dialects: { split: false, classification: "Standard European Portuguese based on the Lisbon-Coimbra dialect. Northern dialects differ in pronunciation.", variants: [] }, history: "Portugal was the source of the language that spread globally during the Age of Exploration. European Portuguese retains more conservative features than Brazilian Portuguese, particularly in phonology.", resources: { wikipedia: "https://en.wikipedia.org/wiki/European_Portuguese", foundations: [], dictionaries: [{ name: "Priberam (Portuguese dictionary)", url: "https://dicionario.priberam.org/" }] } },
    resources: { fsts: [], corpora: [{ name: "OPUS (EN-PT corpora)", url: "https://opus.nlpl.eu/results/en&pt/corpus-result-table", type: "parallel", pairs: ["en-pt"] }], models: [{ name: "NLLB-200 (por_Latn)", url: "https://huggingface.co/facebook/nllb-200-distilled-600M", type: "nmt" }] }
  },

  "zh-TW": {
    linguisticChallenges: {
      traditionalVsSimplified: "Traditional Chinese uses more complex character forms than Simplified. Some characters differ substantially (e.g., 國 vs 国, 學 vs 学). MT must consistently produce Traditional characters — even a single Simplified character is immediately visible.",
      taiwanVocabulary: "Taiwan has distinct vocabulary from mainland China — '程式' (program, TW) vs '程序' (program, CN), '軟體' (software, TW) vs '軟件' (software, CN), '資料夾' (folder, TW) vs '文件夹' (folder, CN). These are not interchangeable.",
      bopomofo: "Taiwan uses Bopomofo (注音符號) for phonetic annotation rather than Pinyin. This affects input methods and user expectations around phonetic aids.",
      verticalText: "Traditional Chinese can be written vertically (top-to-bottom, right-to-left). While software UI uses horizontal text, some contexts (poetry, formal invitations) expect vertical layout support."
    },
    encyclopedic: { family: "Sino-Tibetan", demographics: { speakers: "~23 million (Taiwan)", regions: ["Taiwan", "Hong Kong", "Macau", "overseas Chinese communities"] }, dialects: { split: false, classification: "Standard Mandarin as spoken in Taiwan, with Traditional Chinese characters. Taiwan Mandarin differs from mainland Mandarin in some vocabulary and usage.", variants: ["zh-HK"] }, history: "Traditional Chinese characters have been in continuous use for thousands of years. When the PRC introduced Simplified characters in the 1950s, Taiwan, Hong Kong, and Macau retained the traditional forms.", resources: { wikipedia: "https://en.wikipedia.org/wiki/Traditional_Chinese_characters", foundations: [], dictionaries: [{ name: "MOE Dictionary (教育部國語辭典)", url: "https://dict.revised.moe.edu.tw/" }] } },
    resources: { fsts: [{ name: "jieba (Chinese text segmentation)", url: "https://github.com/fxsjy/jieba", type: "tokenizer" }], corpora: [{ name: "OPUS (EN-ZH corpora)", url: "https://opus.nlpl.eu/results/en&zh/corpus-result-table", type: "parallel", pairs: ["en-zh"] }], models: [{ name: "NLLB-200 (zho_Hant)", url: "https://huggingface.co/facebook/nllb-200-distilled-600M", type: "nmt" }] }
  }
};


// ─── Apply enrichments ──────────────────────────────────────────────────────

let enriched = 0;
let skipped = 0;

function applyToDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) { applyToDir(filePath); continue; }
    if (!entry.name.endsWith('.json')) continue;

    const card = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const data = ENRICHMENTS[card.code];
    if (!data) { continue; }

    // Skip if already enriched
    if (card.linguisticChallenges) {
      console.log(`  ⏭  ${card.code} — already enriched`);
      skipped++;
      continue;
    }

    // Merge new data
    const merged = { ...card, ...data };

    if (DRY_RUN) {
      console.log(`  📋 ${card.code} — ${card.name} (dry run)`);
      console.log(`     └─ linguisticChallenges: ${Object.keys(data.linguisticChallenges || {}).length} challenges`);
      console.log(`     └─ encyclopedic.family: ${data.encyclopedic?.family || 'n/a'}`);
      console.log(`     └─ resources: ${(data.resources?.fsts?.length || 0)} FSTs, ${(data.resources?.corpora?.length || 0)} corpora, ${(data.resources?.models?.length || 0)} models`);
    } else {
      fs.writeFileSync(filePath, JSON.stringify(merged, null, 2) + '\n');
      console.log(`  ✅ ${card.code} — ${card.name}`);
    }
    enriched++;
  }
}

console.log(DRY_RUN ? '\n  [DRY RUN] Previewing enrichment:\n' : '\n  Applying enrichment:\n');
applyToDir(CARDS_DIR);
console.log(`\n  Summary: ${enriched} enriched, ${skipped} skipped\n`);
