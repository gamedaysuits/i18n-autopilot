/**
 * Command: init
 *
 * Interactive setup wizard that creates a v3 config file.
 * Uses Node.js built-in readline — zero external dependencies.
 *
 * When run non-interactively (piped stdin, CI, or --yes flag),
 * falls back to generating a sensible default config silently.
 *
 * Wizard flow (6 steps):
 *   1. Languages — source locale + target languages (with presets)
 *   2. Registers — guided tone/formality selection per language
 *   3. Translation Method — accept defaults, pick one, or configure per language
 *   4. Temperature — sampling temperature for LLM determinism control
 *   5. Content Translation — Hugo, Docusaurus, or none
 *   6. Confirm — review summary, write config, show next steps
 *
 * WHY registers before method: After choosing languages, the user should
 * immediately learn about each language's formality system. This is the core
 * value proposition. Method selection then follows — the user can make an
 * informed choice knowing that LLM methods respect register prompts while
 * API methods (except DeepL) ignore them.
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { CONFIG_FILENAMES, DEFAULT_MODEL, DEFAULT_BATCH_SIZE, DEFAULT_TEMPERATURE, DEFAULT_COACHED_TEMPERATURE, detectDocusaurus } from '../config.js';
import { DEFAULT_REGISTERS, getLanguageCard, getRegisterPresets, getMethodSupport } from '../registers.js';
import { output } from '../output.js';

const DEFAULT_CONFIG_FILENAME = CONFIG_FILENAMES[0]; // i18n-rosetta.config.json

// Popular language groups for quick selection
const LANGUAGE_PRESETS = {
  european: ['fr', 'de', 'es', 'it', 'pt', 'nl'],
  asian: ['ja', 'zh', 'ko'],
  global: ['fr', 'es', 'de', 'ja', 'zh', 'ko', 'pt', 'ar'],
  nordic: ['da', 'fi', 'nb', 'sv'],
};

/**
 * Available translation methods — presented in the wizard as numbered options.
 * Order matters: OpenRouter first (default), then GT, then direct LLM APIs,
 * then other API services.
 *
 * Each entry contains the method name (matching METHOD_REGISTRY in translate.js),
 * a display label, a short description, the env var needed, and whether it's
 * an LLM method (which means we should ask about the model).
 */
const METHOD_OPTIONS = [
  {
    method: 'llm',
    label: 'OpenRouter',
    desc: '200+ models via one API. Most flexible.',
    envVar: 'OPENROUTER_API_KEY',
    isLLM: true,
    category: 'llm',
    defaultModel: DEFAULT_MODEL,
  },
  {
    method: 'openai',
    label: 'OpenAI (GPT-4o)',
    desc: 'Direct OpenAI API. Strong for European languages.',
    envVar: 'OPENAI_API_KEY',
    isLLM: true,
    category: 'llm',
    defaultModel: 'gpt-4o',
  },
  {
    method: 'anthropic',
    label: 'Anthropic (Claude)',
    desc: 'Direct Anthropic API. Strong for nuanced text.',
    envVar: 'ANTHROPIC_API_KEY',
    isLLM: true,
    category: 'llm',
    defaultModel: 'claude-sonnet-4-20250514',
  },
  {
    method: 'gemini',
    label: 'Google Gemini',
    desc: 'Free tier available. Good quality.',
    envVar: 'GEMINI_API_KEY',
    isLLM: true,
    category: 'llm',
    defaultModel: 'gemini-2.5-flash',
  },
  {
    method: 'deepl',
    label: 'DeepL',
    desc: 'Built-in formality for some languages. 30+ languages.',
    envVar: 'DEEPL_API_KEY',
    isLLM: false,
    category: 'api',
    defaultModel: null,
  },
  {
    method: 'microsoft-translator',
    label: 'Microsoft Translator',
    desc: 'Azure Cognitive Services. 100+ languages.',
    envVar: 'MICROSOFT_TRANSLATOR_API_KEY',
    isLLM: false,
    category: 'api',
    defaultModel: null,
  },
  {
    method: 'libretranslate',
    label: 'LibreTranslate',
    desc: 'Open source, self-hosted. Privacy-first.',
    envVar: 'LIBRETRANSLATE_API_URL',
    isLLM: false,
    category: 'api',
    defaultModel: null,
  },
  {
    method: 'google-translate',
    label: 'Google Translate',
    desc: 'Cheapest at scale. 130+ languages.',
    envVar: 'GOOGLE_TRANSLATE_API_KEY',
    isLLM: false,
    category: 'api',
    defaultModel: null,
  },
];

/**
 * Checks whether stdin is interactive (attached to a TTY).
 * If piped or in CI, we skip the interactive wizard.
 */
function isInteractive() {
  return process.stdin.isTTY === true;
}

/**
 * Prompt the user for a single line of input.
 * Returns the trimmed response, or the default if empty.
 */
function ask(rl, question, defaultValue) {
  return new Promise((resolve) => {
    const suffix = defaultValue ? ` (${defaultValue})` : '';
    rl.question(`  ${question}${suffix}: `, (answer) => {
      resolve(answer.trim() || defaultValue || '');
    });
  });
}

/**
 * Parse a comma-separated language input string.
 * Supports preset names (e.g., "european") and individual codes.
 *
 * @param {string} input - Raw user input
 * @returns {string[]} Deduplicated array of locale codes
 */
function parseLanguageInput(input) {
  if (!input) return [];

  const codes = new Set();
  const parts = input.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

  for (const part of parts) {
    if (LANGUAGE_PRESETS[part]) {
      // Expand preset into individual codes
      for (const code of LANGUAGE_PRESETS[part]) {
        codes.add(code);
      }
    } else {
      codes.add(part);
    }
  }

  return [...codes];
}

/**
 * Get the METHOD_OPTIONS entry by its 1-based index or method name.
 * Returns null if not found.
 */
function getMethodOption(input) {
  const num = parseInt(input, 10);
  if (num >= 1 && num <= METHOD_OPTIONS.length) {
    return METHOD_OPTIONS[num - 1];
  }
  // Also accept method name directly (e.g., "google-translate")
  return METHOD_OPTIONS.find(m => m.method === input) || null;
}

/**
 * Collect the set of unique env vars needed for the chosen methods.
 * Used in the "Next steps" output.
 *
 * @param {string} defaultMethod - The default method name
 * @param {object|null} languageOverrides - languages object with per-lang method overrides
 * @returns {Array<{envVar: string, label: string}>} Unique env vars needed
 */
function collectRequiredEnvVars(defaultMethod, languageOverrides) {
  const needed = new Map();

  // Add the default method's env var
  const defaultOpt = METHOD_OPTIONS.find(m => m.method === defaultMethod);
  if (defaultOpt) {
    needed.set(defaultOpt.envVar, defaultOpt.label);
  }

  // Add per-language method env vars
  if (languageOverrides && typeof languageOverrides === 'object') {
    for (const langConfig of Object.values(languageOverrides)) {
      if (typeof langConfig === 'object' && langConfig.method) {
        const opt = METHOD_OPTIONS.find(m => m.method === langConfig.method);
        if (opt && !needed.has(opt.envVar)) {
          needed.set(opt.envVar, opt.label);
        }
      }
    }
  }

  return [...needed.entries()].map(([envVar, label]) => ({ envVar, label }));
}

// ── Wizard Steps ──────────────────────────────────────────────

/**
 * Step 1: Languages — source locale and target languages.
 */
async function stepLanguages(rl) {
  console.log('');
  console.log('  Step 1/6 — Languages');
  console.log('  ────────────────────────────────────────────────');
  console.log('');

  const source = await ask(rl, 'Source locale', 'en');

  console.log('');
  console.log('  Target languages — enter codes separated by commas.');
  console.log('  Presets: european (fr,de,es,it,pt,nl) | asian (ja,zh,ko)');
  console.log('           global (fr,es,de,ja,zh,ko,pt,ar) | nordic (da,fi,nb,sv)');
  console.log('  Example: fr, de, ja  or  european, ja');
  console.log('  Leave blank to auto-detect from your locales directory.');
  const langInput = await ask(rl, 'Target languages', '');
  const languages = parseLanguageInput(langInput);

  if (languages.length > 0) {
    console.log('');
    console.log('  Selected:');
    for (const code of languages) {
      const card = getLanguageCard(code);
      const name = card ? card.name : (DEFAULT_REGISTERS[code]?.name || code);
      const system = card?.formality?.system;
      const systemLabel = system ? ` (${system})` : '';
      console.log(`    ${code} — ${name}${systemLabel}`);
    }
  }

  return { source, languages };
}

/**
 * Step 3: Translation method — accept defaults, pick one, or per-language.
 *
 * Returns:
 *   { defaultMethod, defaultModel, perLanguage: null }       — options 1 or 2
 *   { defaultMethod, defaultModel, perLanguage: { ... } }    — option 3
 */
async function stepMethod(rl, languages) {
  console.log('');
  console.log('  Step 3/6 — Translation Method');
  console.log('  ────────────────────────────────────────────────');
  console.log('');
  console.log(`  Default: OpenRouter → ${DEFAULT_MODEL}`);
  console.log('');
  console.log('    1. Accept defaults');
  console.log('    2. Choose a different method for all languages');
  console.log('    3. Configure each language individually');
  console.log('');

  const choice = await ask(rl, 'Choose', '1');

  // ── Option 1: Accept defaults ──
  if (choice === '1') {
    return {
      defaultMethod: 'llm',
      defaultModel: DEFAULT_MODEL,
      perLanguage: null,
    };
  }

  // ── Option 2: Single method for all ──
  if (choice === '2') {
    return await pickSingleMethod(rl);
  }

  // ── Option 3: Per-language configuration ──
  if (choice === '3') {
    return await pickPerLanguageMethod(rl, languages);
  }

  // Default fallback
  return {
    defaultMethod: 'llm',
    defaultModel: DEFAULT_MODEL,
    perLanguage: null,
  };
}

/**
 * Show the method picker with categorized display and guidance.
 *
 * LLM methods are shown first (register-aware, best quality), then
 * API methods (fast/cheap, no register control except DeepL).
 */
async function pickSingleMethod(rl) {
  const llmMethods = METHOD_OPTIONS.filter(m => m.category === 'llm');
  const apiMethods = METHOD_OPTIONS.filter(m => m.category === 'api');

  console.log('');
  console.log('  LLM methods — context-aware, uses your register presets:');
  console.log('');
  let idx = 1;
  for (const m of llmMethods) {
    const num = String(idx).padStart(4, ' ');
    console.log(`  ${num}. ${m.label.padEnd(24)} ${m.desc}`);
    idx++;
  }

  console.log('');
  console.log('  API methods — fast and affordable, no register control:');
  console.log('');
  for (const m of apiMethods) {
    const num = String(idx).padStart(4, ' ');
    console.log(`  ${num}. ${m.label.padEnd(24)} ${m.desc}`);
    idx++;
  }

  console.log('');
  console.log('  Tip: LLM methods use your register presets to control tone.');
  console.log('  API methods translate without tone guidance (except DeepL).');
  console.log('');

  const methodChoice = await ask(rl, 'Choose', '1');
  const num = parseInt(methodChoice, 10);
  const selected = (num >= 1 && num <= METHOD_OPTIONS.length)
    ? METHOD_OPTIONS[num - 1]
    : METHOD_OPTIONS.find(m => m.method === methodChoice) || null;

  if (!selected) {
    console.log('  Invalid choice — using default (OpenRouter).');
    return { defaultMethod: 'llm', defaultModel: DEFAULT_MODEL, perLanguage: null };
  }

  let model = selected.defaultModel;
  if (selected.isLLM) {
    model = await ask(rl, 'Model', selected.defaultModel);
  }

  // Warn if an API method was chosen — registers won't have full effect
  if (selected.category === 'api' && selected.method !== 'deepl') {
    console.log('');
    console.log(`  Note: ${selected.label} doesn't use register presets — your formality`);
    console.log('  choices from Step 2 will only apply if you switch to an LLM method later.');
  }

  console.log(`  → ${selected.label}${model ? ' / ' + model : ''}`);

  return {
    defaultMethod: selected.method,
    defaultModel: model,
    perLanguage: null,
  };
}

/**
 * Walk through each target language and let the user pick a method.
 */
async function pickPerLanguageMethod(rl, languages) {
  if (languages.length === 0) {
    console.log('  No target languages specified — using defaults.');
    return { defaultMethod: 'llm', defaultModel: DEFAULT_MODEL, perLanguage: null };
  }

  console.log('');
  console.log('  Configure method for each language:');
  console.log('  (Enter a number 1-8, or press Enter for default)');
  console.log('');

  // Show a compact method reference
  for (let i = 0; i < METHOD_OPTIONS.length; i++) {
    const m = METHOD_OPTIONS[i];
    console.log(`    ${i + 1}. ${m.label}`);
  }
  console.log('');

  const perLanguage = {};

  for (const code of languages) {
    const card = getLanguageCard(code);
    const name = card?.name || DEFAULT_REGISTERS[code]?.name || code;

    const methodChoice = await ask(rl, `  ${code} (${name}) — method`, '1');
    const selected = getMethodOption(methodChoice);

    if (!selected || selected.method === 'llm') {
      // Default — no per-language override needed
      console.log(`    → OpenRouter / ${DEFAULT_MODEL}`);
      continue;
    }

    // Check if this method supports the language via card metadata.
    // WHY: A user picking DeepL for Swahili should know it's not supported.
    const support = getMethodSupport(code);
    if (support) {
      const methodKey = selected.method === 'google-translate' ? 'googleTranslate'
        : selected.method === 'microsoft-translator' ? 'microsoftTranslator'
        : selected.method;
      if (support[methodKey] === false) {
        console.log(`    ⚠  ${selected.label} may not support ${name}. Consider LLM instead.`);
      }
    }

    // Build per-language config entry
    const langEntry = { method: selected.method };

    if (selected.isLLM) {
      const model = await ask(rl, `    Model`, selected.defaultModel);
      langEntry.model = model;
      console.log(`    → ${selected.label} / ${model}`);
    } else {
      console.log(`    → ${selected.label}`);
    }

    perLanguage[code] = langEntry;
  }

  return {
    defaultMethod: 'llm',
    defaultModel: DEFAULT_MODEL,
    perLanguage: Object.keys(perLanguage).length > 0 ? perLanguage : null,
  };
}

/**
 * Step 2: Registers — guided tone/formality selection per language.
 *
 * Compact view: shows each language's formality system and default preset.
 * Expand-on-demand: type a language code to see all available presets
 * with descriptions and pick one.
 *
 * Returns an object mapping language codes to preset keys (explicit, even
 * for defaults) so the config file is self-documenting.
 *
 * WHY proactive display: Registers are the core value proposition —
 * the init wizard should SHOW the user what formality systems exist
 * and explain the defaults, not hide them behind a y/N gate.
 *
 * @param {object} rl - Readline interface
 * @param {string[]} languages - Target language codes
 * @returns {object|null} Map of code → preset key, or null if no languages
 */
async function stepRegisters(rl, languages) {
  if (languages.length === 0) return null;

  console.log('');
  console.log('  Step 2/6 — Registers');
  console.log('  ────────────────────────────────────────────────');
  console.log('');
  console.log('  Registers tell the translator how your app should sound.');
  console.log('  Each language has a formality system — rosetta picks a');
  console.log('  sensible default for software UI.');
  console.log('');

  // Build the per-language summary and track default preset keys.
  // selectedPresets stores the explicitly chosen (or default) key for each language.
  const selectedPresets = {};

  for (const code of languages) {
    const card = getLanguageCard(code);
    const presets = getRegisterPresets(code);
    const name = card?.name || DEFAULT_REGISTERS[code]?.name || code;
    const system = card?.formality?.system || null;
    const systemLabel = system ? `  [${system}]` : '';

    if (presets.length > 0) {
      const defaultPreset = presets.find(p => p.isDefault) || presets[0];
      // Explicitly store the default preset key — makes config self-documenting
      selectedPresets[code] = defaultPreset.key;

      // Compact display: code, name, system, default preset label
      const altCount = presets.length - 1;
      const altText = altCount > 0 ? `  (${altCount} alternative${altCount > 1 ? 's' : ''})` : '';
      console.log(`    ${code.padEnd(6)} ${name}${systemLabel}`);
      console.log(`           → ${defaultPreset.label} ★${altText}`);
    } else {
      // No card / no presets — use generic fallback
      selectedPresets[code] = null;
      console.log(`    ${code.padEnd(6)} ${name}`);
      console.log(`           → Professional register (default)`);
    }
  }

  console.log('');
  console.log('  ────────────────────────────────────────────────');
  console.log('  Press Enter to accept all defaults (★).');
  console.log('  Type a language code to see options and change it.');

  // Interactive loop: user can adjust one language at a time, or Enter to finish
  let adjusting = true;
  while (adjusting) {
    console.log('');
    const input = await ask(rl, 'Adjust a language (or Enter to continue)', '');

    if (!input) {
      adjusting = false;
      break;
    }

    // Find the matching language code
    const code = input.toLowerCase();
    if (!languages.includes(code)) {
      console.log(`  "${code}" is not in your target languages.`);
      continue;
    }

    const presets = getRegisterPresets(code);
    const card = getLanguageCard(code);
    const name = card?.name || DEFAULT_REGISTERS[code]?.name || code;

    if (presets.length === 0) {
      // No presets — offer custom text only
      const custom = await ask(rl, `  ${name} — custom register text`, '');
      if (custom) {
        selectedPresets[code] = custom;
        console.log(`  → Custom: "${custom.substring(0, 50)}${custom.length > 50 ? '...' : ''}"`);
      }
      continue;
    }

    // Expanded view: show all presets with descriptions
    console.log('');
    console.log(`  ${code} — ${name}${card?.formality?.system ? `  [${card.formality.system}]` : ''}`);

    // Show the formality system description from the card — this is the
    // "why this matters" context that makes the wizard prescriptive.
    if (card?.formality?.description) {
      // Wrap the description to ~64 chars for terminal readability
      const desc = card.formality.description;
      const words = desc.split(' ');
      let line = '  ';
      for (const word of words) {
        if (line.length + word.length > 68 && line.length > 4) {
          console.log(line);
          line = '  ' + word;
        } else {
          line += (line.length > 2 ? ' ' : '') + word;
        }
      }
      if (line.length > 2) console.log(line);
    }

    console.log('');
    for (let i = 0; i < presets.length; i++) {
      const p = presets[i];
      const marker = p.isDefault ? ' ★' : '  ';
      const current = selectedPresets[code] === p.key ? ' (current)' : '';
      console.log(`    ${i + 1}.${marker} ${p.label}`);
      console.log(`         ${p.description}${current}`);
    }
    console.log(`    c.   Custom text`);
    console.log('');

    const defaultIdx = presets.findIndex(p => p.key === selectedPresets[code]) + 1 || 1;
    const choice = await ask(rl, `  Choose`, String(defaultIdx));

    if (choice.toLowerCase() === 'c') {
      const custom = await ask(rl, `  Custom register text`, '');
      if (custom) {
        selectedPresets[code] = custom;
        console.log(`  → Custom register set.`);
      }
    } else {
      const num = parseInt(choice, 10);
      if (num >= 1 && num <= presets.length) {
        const selected = presets[num - 1];
        selectedPresets[code] = selected.key;
        console.log(`  → ${selected.label}`);
      }
    }
  }

  return Object.keys(selectedPresets).length > 0 ? selectedPresets : null;
}

/**
 * Step 4: Temperature — sampling temperature for LLM determinism control.
 *
 * Explains temperature in plain language and lets the user accept the default
 * or enter a custom value. Returns null if default is accepted (so config
 * only includes temperature when explicitly set).
 *
 * @param {readline.Interface} rl - Readline interface
 * @param {string} defaultMethod - Selected method name (e.g., 'llm', 'llm-coached', 'deepl')
 * @returns {number|null} Custom temperature, or null for default
 */
async function stepTemperature(rl, defaultMethod) {
  // Temperature only applies to LLM methods — skip for API-only methods
  const isLLM = !defaultMethod || ['llm', 'llm-coached', 'openai', 'anthropic', 'gemini'].includes(defaultMethod);
  if (!isLLM) return null;

  const isCoached = defaultMethod === 'llm-coached';
  const methodDefault = isCoached ? DEFAULT_COACHED_TEMPERATURE : DEFAULT_TEMPERATURE;

  console.log('');
  console.log('  Step 4/6 — Temperature');
  console.log('  ────────────────────────────────────────────────');
  console.log('');
  console.log('  Temperature controls how deterministic the translations are.');
  console.log('  Lower values (0.1–0.3) produce more consistent, predictable output.');
  console.log('  Higher values (0.5–0.8) allow more variation and creativity.');
  console.log('');
  console.log('  For software UI translation, lower is almost always better.');
  if (isCoached) {
    console.log('  The coached method uses 0.2 by default for extra consistency.');
  }
  console.log('');

  const answer = await ask(rl, `Temperature (0.0–1.0)`, String(methodDefault));

  const parsed = parseFloat(answer);
  if (isNaN(parsed) || parsed < 0 || parsed > 1) {
    console.log(`  Invalid temperature "${answer}" — using default ${methodDefault}.`);
    return null;
  }

  // Return null if the user accepted the default (no need to clutter config)
  if (parsed === methodDefault) return null;

  return parsed;
}

/**
 * Step 5: Content translation — Hugo, Docusaurus, or none.
 */
async function stepContent(rl, cwd) {
  console.log('');
  console.log('  Step 5/6 — Content Translation');
  console.log('  ────────────────────────────────────────────────');
  console.log('');
  console.log('  Do you have Markdown content to translate?');
  console.log('');
  console.log('    1. No — key-value locale files only');
  console.log('    2. Yes — Hugo content directory');

  // Auto-detect Docusaurus
  const hasDocusaurus = detectDocusaurus(cwd);
  if (hasDocusaurus) {
    console.log('    3. Yes — Docusaurus (auto-detected ✓)');
  } else {
    console.log('    3. Yes — Docusaurus');
  }
  console.log('');

  const choice = await ask(rl, 'Choose', '1');

  if (choice === '2') {
    const contentDir = await ask(rl, 'Hugo content directory', './content');
    return { contentDir, format: null };
  }

  if (choice === '3') {
    console.log('  → Docusaurus mode enabled. Locale files in ./i18n/');
    return { contentDir: null, format: 'docusaurus' };
  }

  return { contentDir: null, format: null };
}

/**
 * Step 6: Confirm — show summary, write config, display next steps.
 */
async function stepConfirm(rl, config, envVars) {
  console.log('');
  console.log('  Step 6/6 — Confirm');
  console.log('  ────────────────────────────────────────────────');
  console.log('');
  console.log('  Config Summary:');
  console.log('  ──────────────────────────────────────');

  console.log(`    Source locale:   ${config.inputLocale}`);

  // Display languages — handle both array and object forms
  if (Array.isArray(config.languages)) {
    const display = config.languages.length > 0
      ? config.languages.join(', ')
      : '(auto-detect from directory)';
    console.log(`    Target locales:  ${display}`);
  } else {
    const codes = Object.keys(config.languages);
    console.log(`    Target locales:  ${codes.join(', ')}`);
    // Show per-language method overrides
    for (const [code, langConfig] of Object.entries(config.languages)) {
      if (typeof langConfig === 'object' && langConfig.method) {
        const opt = METHOD_OPTIONS.find(m => m.method === langConfig.method);
        const label = opt ? opt.label : langConfig.method;
        const modelStr = langConfig.model ? ` / ${langConfig.model}` : '';
        console.log(`      ${code}: ${label}${modelStr}`);
      }
    }
  }

  console.log(`    Locales dir:     ${config.localesDir}`);
  console.log(`    Format:          ${config.format}`);

  // Show default method if not the default 'llm'
  if (config.defaultMethod && config.defaultMethod !== 'llm') {
    const opt = METHOD_OPTIONS.find(m => m.method === config.defaultMethod);
    console.log(`    Method:          ${opt ? opt.label : config.defaultMethod}`);
  } else {
    console.log(`    Method:          OpenRouter`);
  }

  if (config.model) {
    console.log(`    Model:           ${config.model}`);
  }

  if (config.contentDir) {
    console.log(`    Content dir:     ${config.contentDir}`);
  }

  console.log('  ──────────────────────────────────────');

  // Show required env vars
  if (envVars.length > 0) {
    console.log('');
    console.log('  Required API key(s):');
    for (const { envVar, label } of envVars) {
      console.log(`    ${envVar}  (${label})`);
    }
  }

  console.log('');
  const confirm = await ask(rl, 'Write this config?', 'yes');
  return confirm.toLowerCase().startsWith('y');
}

/**
 * Build the config object from wizard answers.
 *
 * The new register step stores explicit preset keys for every language
 * (including defaults), so customRegisters is always populated when
 * languages were selected. Per-language method overrides are merged in.
 *
 * Config languages format:
 *   - Object with preset keys: { "fr": "formal-vous", "ja": "polite" }
 *   - Object with full config: { "fr": { "register": "casual-tu", "method": "deepl" } }
 *   - Array: ["fr", "de", "ja"] — only when no registers or overrides
 */
function buildConfig(answers) {
  const {
    source, languages, defaultMethod, defaultModel,
    perLanguage, customRegisters,
    localesDir, format, contentDir,
  } = answers;

  const hasPerLanguage = perLanguage && Object.keys(perLanguage).length > 0;
  const hasRegisters = customRegisters && Object.keys(customRegisters).length > 0;
  const needsObjectForm = hasPerLanguage || hasRegisters;

  let languagesConfig;
  if (needsObjectForm) {
    // Object form — stores preset keys and/or method overrides per language.
    // When a language has both a register preset and a method override,
    // it gets the full object form { register, method, model }.
    // When it only has a register preset, it's stored as a bare string.
    languagesConfig = {};
    for (const code of languages) {
      const methodOverride = perLanguage ? perLanguage[code] : null;
      const registerValue = customRegisters ? customRegisters[code] : null;

      if (methodOverride) {
        // Has method override — needs full object form
        const entry = {};
        if (methodOverride.method) entry.method = methodOverride.method;
        if (methodOverride.model) entry.model = methodOverride.model;
        // Include register preset key if present
        if (registerValue) entry.register = registerValue;
        languagesConfig[code] = entry;
      } else if (registerValue) {
        // Register only — store as bare preset key string
        languagesConfig[code] = registerValue;
      } else {
        // No overrides at all — store empty object to keep in object form
        languagesConfig[code] = {};
      }
    }
  } else {
    // Simple array form — no registers, no overrides
    languagesConfig = languages;
  }

  const config = {
    version: 3,
    inputLocale: source,
    localesDir,
    languages: languagesConfig,
    model: defaultMethod && defaultModel ? defaultModel : (defaultModel || DEFAULT_MODEL),
    batchSize: DEFAULT_BATCH_SIZE,
    format,
  };

  // Only include defaultMethod if it's not the default 'llm'
  if (defaultMethod && defaultMethod !== 'llm') {
    config.defaultMethod = defaultMethod;
  }

  // Only include contentDir if the user specified one
  if (contentDir) {
    config.contentDir = contentDir;
  }

  // Only include temperature if the user set a non-default value
  if (temperature != null) {
    config.temperature = temperature;
  }

  return config;
}

/**
 * Run the interactive init wizard.
 */
async function runInteractive(cwd) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log('');
    console.log('  i18n-rosetta — Project Setup');
    console.log('  ════════════════════════════════════════════════');

    // Step 1: Languages
    const { source, languages } = await stepLanguages(rl);

    // Step 2: Registers — guided tone/formality per language.
    // Comes before method because register choice informs method selection.
    const customRegisters = await stepRegisters(rl, languages);

    // Step 3: Translation Method
    const { defaultMethod, defaultModel, perLanguage } = await stepMethod(rl, languages);

    // Step 4: Temperature
    const temperature = await stepTemperature(rl, defaultMethod);

    // Step 5: Content Translation
    const { contentDir, format: contentFormat } = await stepContent(rl, cwd);

    // Step 6: Locales directory and format
    // These are simpler questions — asked inline before confirmation
    console.log('');
    const localesDir = await ask(rl, 'Locales directory', contentFormat === 'docusaurus' ? './i18n' : './locales');
    const format = contentFormat || await ask(rl, 'File format (auto/json/toml/yaml)', 'auto');

    // Build config
    const config = buildConfig({
      source, languages, defaultMethod, defaultModel,
      perLanguage, customRegisters, temperature,
      localesDir, format, contentDir,
    });

    // Collect env vars needed
    const envVars = collectRequiredEnvVars(defaultMethod, config.languages);

    // Confirm
    const confirmed = await stepConfirm(rl, config, envVars);
    if (!confirmed) {
      console.log('  Cancelled. No files written.');
      return null;
    }

    // Return config + envVars for the caller to write and show next steps
    return { config, envVars };
  } finally {
    rl.close();
  }
}

/**
 * Generate a default config for non-interactive mode.
 *
 * Supports --langs to specify target languages in quick mode:
 *   npx i18n-rosetta init --yes --langs fr,de,ja
 *
 * WHY --langs in quick mode: The user said "define your targets, state
 * the locales, click sync to use defaults." This flag enables that
 * one-liner workflow without the interactive wizard.
 */
function buildDefaultConfig(args) {
  // Parse --langs flag: comma-separated list of language codes
  const languages = args.langs
    ? parseLanguageInput(args.langs)
    : [];

  return {
    version: 3,
    inputLocale: args.source || 'en',
    localesDir: args.dir || './locales',
    languages,
    model: args.model || DEFAULT_MODEL,
    batchSize: DEFAULT_BATCH_SIZE,
    format: args.format || 'auto',
    ...(args.temperature != null && { temperature: parseFloat(args.temperature) }),
  };
}

async function run(args, cwd) {
  const configPath = path.join(cwd, DEFAULT_CONFIG_FILENAME);

  // ── Help ──
  if (args.help) {
    showHelp();
    return 0;
  }

  // ── Guard: config already exists ──
  if (fs.existsSync(configPath)) {
    output.warn(`Config file already exists: ${DEFAULT_CONFIG_FILENAME}`);
    output.raw('   Delete it first if you want to regenerate.');
    return 0;
  }

  // ── Choose mode: interactive wizard or silent defaults ──
  let config;
  let envVars = [];

  if (!args.yes && isInteractive()) {
    const result = await runInteractive(cwd);
    if (!result) return 0; // User cancelled
    config = result.config;
    envVars = result.envVars;
  } else {
    config = buildDefaultConfig(args);
    envVars = collectRequiredEnvVars('llm', null);
  }

  // ── Write config ──
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  output.ok(`Created ${DEFAULT_CONFIG_FILENAME}`);
  output.raw('');

  // ── Show register summary when languages are configured ──
  const langCount = Array.isArray(config.languages) ? config.languages.length : Object.keys(config.languages).length;
  if (langCount > 0) {
    output.raw('  Registers:');
    if (typeof config.languages === 'object' && !Array.isArray(config.languages)) {
      // Object form — show preset keys
      for (const [code, value] of Object.entries(config.languages)) {
        const card = getLanguageCard(code);
        const name = card?.name || code;
        if (typeof value === 'string') {
          // Bare preset key
          output.raw(`    ${code.padEnd(6)} ${name} → ${value}`);
        } else if (typeof value === 'object' && value.register) {
          output.raw(`    ${code.padEnd(6)} ${name} → ${value.register}`);
        } else {
          output.raw(`    ${code.padEnd(6)} ${name} → (default)`);
        }
      }
    } else {
      // Array form — all defaults
      for (const code of config.languages) {
        const card = getLanguageCard(code);
        const name = card?.name || code;
        const defaultKey = card?.formality?.default || 'default';
        output.raw(`    ${code.padEnd(6)} ${name} → ${defaultKey}`);
      }
    }
    output.raw('');
  }

  // ── Next steps — skip env var instruction if already set ──
  output.raw('  Next steps:');
  output.raw('');
  let step = 1;

  // Only show env var setup if any required key is missing from the environment
  const missingEnvVars = envVars.filter(({ envVar }) => !process.env[envVar]);
  if (missingEnvVars.length === 1) {
    output.raw(`  ${step}. Set your API key:`);
    output.raw(`     export ${missingEnvVars[0].envVar}=...`);
    step++;
  } else if (missingEnvVars.length > 1) {
    output.raw(`  ${step}. Set your API key(s):`);
    for (const { envVar, label } of missingEnvVars) {
      output.raw(`     export ${envVar}=...    # ${label}`);
    }
    step++;
  }

  output.raw('');
  if (langCount === 0) {
    output.raw(`  ${step}. Add target locale files to your locales directory (e.g., fr.json)`);
    output.raw(`  ${step + 1}. Run: i18n-rosetta status    # verify your setup`);
    output.raw(`  ${step + 2}. Run: i18n-rosetta sync      # translate!`);
  } else {
    output.raw(`  ${step}. Run: i18n-rosetta status    # verify your setup`);
    output.raw(`  ${step + 1}. Run: i18n-rosetta sync      # translate!`);
  }
  return 0;
}

function showHelp() {
  console.log(`
  i18n-rosetta init — Create a new project config

  USAGE
    i18n-rosetta init [options]

  DESCRIPTION
    Runs an interactive setup wizard that guides you through configuring
    your project's target languages, registers (tone/formality), translation
    method, and content directory. Writes i18n-rosetta.config.json.

    In non-interactive environments (CI, piped stdin), or when --yes is
    set, generates a sensible default config without prompting.

  OPTIONS
    --yes             Skip interactive wizard, use defaults
    --langs <codes>   Target languages, comma-separated (e.g., fr,de,ja)
    --source <code>   Source locale (default: en)
    --dir <path>      Locales directory (default: ./locales)
    --model <model>   Translation model (default: ${DEFAULT_MODEL})
    --temperature <n> Sampling temperature for LLM methods (default: ${DEFAULT_TEMPERATURE})
    --format <fmt>    File format: auto, json, toml, yaml (default: auto)

  EXAMPLES
    i18n-rosetta init                        # Interactive wizard
    i18n-rosetta init --yes --langs fr,de,ja # Quick setup with targets
    i18n-rosetta init --yes                  # Minimal config, auto-detect
    i18n-rosetta init --source en --dir ./i18n
  `);
}

export { run, parseLanguageInput, buildDefaultConfig };
