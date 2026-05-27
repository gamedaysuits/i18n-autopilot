/**
 * Tests for the Language Card architecture and registers accessor layer.
 *
 * Covers:
 *   - Language card schema validation (all cards match required structure)
 *   - Preset resolution (preset keys → prompt text, custom passthrough)
 *   - Alias resolution (no→nb, iw→he, fil→tl)
 *   - Formality extraction for DeepL integration
 *   - Backward-compatible DEFAULT_REGISTERS proxy
 *   - Gender guidance retrieval
 *   - Method support flags
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  getLanguageCard,
  getRegister,
  getRegisterPresets,
  getFormality,
  getGenderGuidance,
  getAllLanguageCodes,
  getMethodSupport,
  resolveCode,
  DEFAULT_REGISTERS,
  CARDS_DIR,
} from '../lib/registers.js';

// --------------------------------------------------------------------------
// Schema validation — every card file must have required fields
// --------------------------------------------------------------------------

describe('Language card schema validation', () => {
  const cardFiles = fs.readdirSync(CARDS_DIR).filter(f => f.endsWith('.json'));

  // Guard: make sure we actually have cards to test
  it('has at least 40 language cards loaded', () => {
    assert.ok(cardFiles.length >= 40, `Expected 40+ card files, got ${cardFiles.length}`);
  });

  for (const filename of cardFiles) {
    it(`${filename} has all required fields`, () => {
      const raw = fs.readFileSync(path.join(CARDS_DIR, filename), 'utf-8');
      const rawCard = JSON.parse(raw);
      const card = getLanguageCard(rawCard.code);

      // Required top-level string fields
      assert.ok(card.code, `${filename}: missing 'code'`);
      assert.ok(card.name, `${filename}: missing 'name'`);
      assert.ok(card.nativeName, `${filename}: missing 'nativeName'`);
      assert.ok(card.bcp47, `${filename}: missing 'bcp47'`);
      assert.ok(card.script, `${filename}: missing 'script'`);
      assert.ok(card.dir, `${filename}: missing 'dir'`);
      assert.ok(
        card.dir === 'ltr' || card.dir === 'rtl',
        `${filename}: dir must be 'ltr' or 'rtl', got '${card.dir}'`
      );

      // Code must match filename (minus extension)
      const expectedCode = path.basename(filename, '.json');
      assert.equal(card.code, expectedCode,
        `${filename}: code '${card.code}' doesn't match filename`);

      // Registers must be an object with at least one entry
      assert.ok(card.registers && typeof card.registers === 'object',
        `${filename}: missing or invalid 'registers'`);
      assert.ok(Object.keys(card.registers).length > 0,
        `${filename}: registers must have at least one entry`);

      // Each register must have label, description, prompt
      for (const [key, preset] of Object.entries(card.registers)) {
        assert.ok(preset.label, `${filename}: register '${key}' missing 'label'`);
        assert.ok(preset.description, `${filename}: register '${key}' missing 'description'`);
        assert.ok(preset.prompt, `${filename}: register '${key}' missing 'prompt'`);
      }

      // Formality is REQUIRED on all cards — even conlangs get system: "none"
      assert.ok(card.formality && typeof card.formality === 'object',
        `${filename}: formality must be a non-null object`);
      assert.ok(card.formality.system,
        `${filename}: formality missing 'system'`);
      assert.ok(card.formality.default,
        `${filename}: formality missing 'default'`);
      // Default must reference an existing register key
      assert.ok(card.registers[card.formality.default],
        `${filename}: formality default '${card.formality.default}' not found in registers`);

      // methodSupport must be an object if present
      if (card.methodSupport) {
        assert.ok(typeof card.methodSupport === 'object',
          `${filename}: methodSupport must be an object`);
      }

      // aliases must be an array if present
      if (card.aliases) {
        assert.ok(Array.isArray(card.aliases),
          `${filename}: aliases must be an array`);
      }
    });
  }
});

// --------------------------------------------------------------------------
// Preset resolution — getRegister()
// --------------------------------------------------------------------------

describe('Preset resolution', () => {
  it('returns default preset when no override given', () => {
    // French default is 'professional-vous' per the card
    const register = getRegister('fr');
    assert.ok(register.length > 10, 'Default register should be substantial text');
    assert.ok(register.includes('vous') || register.includes('Vous'),
      'French default should reference vouvoiement');
  });

  it('resolves a named preset key to its prompt text', () => {
    const casual = getRegister('fr', 'casual-tu');
    assert.ok(casual.includes('tu') || casual.includes('Tu'),
      'casual-tu preset should reference tutoiement');
    // Should be different from the default
    const defaultReg = getRegister('fr');
    assert.notEqual(casual, defaultReg);
  });

  it('passes through custom text that does not match a preset key', () => {
    const custom = 'My very custom register text for testing.';
    const result = getRegister('fr', custom);
    assert.equal(result, custom, 'Custom text should pass through unchanged');
  });

  it('returns generic fallback for unknown language codes', () => {
    const result = getRegister('xx-unknown');
    assert.equal(result, 'Professional register.');
  });

  it('returns custom text for unknown codes when provided', () => {
    const result = getRegister('xx-unknown', 'Custom for unknown.');
    assert.equal(result, 'Custom for unknown.');
  });

  it('returns correct presets for Korean speech levels', () => {
    const polite = getRegister('ko', 'polite-haeyo');
    assert.ok(polite.includes('해요'), 'polite-haeyo should reference 해요체');

    const formal = getRegister('ko', 'formal-hapsyo');
    assert.ok(formal.includes('합쇼'), 'formal-hapsyo should reference 합쇼체');
  });

  it('returns correct presets for Japanese keigo', () => {
    const polite = getRegister('ja', 'polite');
    // Japanese polite preset may reference です/ます or describe polite register
    assert.ok(polite.length > 20, 'polite preset should be substantial');
  });
});

// --------------------------------------------------------------------------
// Alias resolution — resolveCode()
// --------------------------------------------------------------------------

describe('Alias resolution', () => {
  it('resolves no → nb (Norwegian Bokmål)', () => {
    assert.equal(resolveCode('no'), 'nb');
  });

  it('resolves iw → he (Hebrew legacy code)', () => {
    assert.equal(resolveCode('iw'), 'he');
  });

  it('resolves fil → tl (Filipino)', () => {
    assert.equal(resolveCode('fil'), 'tl');
  });

  it('returns the same code for primary codes', () => {
    assert.equal(resolveCode('fr'), 'fr');
    assert.equal(resolveCode('ko'), 'ko');
    assert.equal(resolveCode('ja'), 'ja');
  });

  it('falls back to base locale for unknown regional variants', () => {
    // de-AT doesn't have its own card, should fall back to 'de'
    assert.equal(resolveCode('de-AT'), 'de');
  });

  it('returns the original code when no match is found', () => {
    assert.equal(resolveCode('xx-zz'), 'xx-zz');
  });
});

// --------------------------------------------------------------------------
// Formality extraction — getFormality()
// --------------------------------------------------------------------------

describe('Formality extraction', () => {
  it('returns T-V system for French', () => {
    const formality = getFormality('fr');
    assert.ok(formality, 'French should have formality');
    assert.equal(formality.system, 'T-V');
    assert.equal(formality.level, 'formal-vous');
  });

  it('returns speech-levels system for Korean', () => {
    const formality = getFormality('ko');
    assert.ok(formality, 'Korean should have formality');
    assert.equal(formality.system, 'speech-levels');
    assert.equal(formality.level, 'polite-haeyo');
  });

  it('returns keigo system for Japanese', () => {
    const formality = getFormality('ja');
    assert.ok(formality, 'Japanese should have formality');
    assert.equal(formality.system, 'keigo');
  });

  it('reflects the active preset when specified', () => {
    const formality = getFormality('fr', 'casual-tu');
    assert.equal(formality.level, 'casual-tu');
  });

  it('falls back to default when preset does not match', () => {
    const formality = getFormality('fr', 'some-custom-text');
    assert.equal(formality.level, 'formal-vous');
  });

  it('returns null for languages without formality', () => {
    // Check that a language card with null formality returns null
    // (if any exist — otherwise we test an unknown code)
    const result = getFormality('xx-unknown');
    assert.equal(result, null);
  });
});

// --------------------------------------------------------------------------
// Gender guidance — getGenderGuidance()
// --------------------------------------------------------------------------

describe('Gender guidance', () => {
  it('returns inclusive guidance for French', () => {
    const guidance = getGenderGuidance('fr');
    assert.ok(guidance, 'French should have gender guidance');
    assert.ok(guidance.length > 20, 'Guidance should be substantial');
  });

  it('returns inclusive guidance for German', () => {
    const guidance = getGenderGuidance('de');
    assert.ok(guidance, 'German should have gender guidance');
  });

  it('returns null for languages without gender guidance', () => {
    const guidance = getGenderGuidance('xx-unknown');
    assert.equal(guidance, null);
  });
});

// --------------------------------------------------------------------------
// Method support — getMethodSupport()
// --------------------------------------------------------------------------

describe('Method support', () => {
  it('returns support flags for French', () => {
    const support = getMethodSupport('fr');
    assert.ok(support, 'French should have method support');
    assert.equal(support.googleTranslate, true);
    assert.equal(support.deepl, true);
    assert.equal(support.llm, true);
  });

  it('shows DeepL as unsupported for Swahili', () => {
    const support = getMethodSupport('sw');
    assert.ok(support, 'Swahili should have method support');
    assert.equal(support.deepl, false);
  });

  it('returns null for unknown codes', () => {
    const support = getMethodSupport('xx-unknown');
    assert.equal(support, null);
  });

  it('has deeplFormality=true for French (T-V)', () => {
    const support = getMethodSupport('fr');
    assert.equal(support.deeplFormality, true);
  });

  it('has deeplFormality=true for Japanese (keigo — bug fix)', () => {
    // WHY: DeepL supports formality for Japanese even though its system
    // is 'keigo', not T-V. This was a bug — the old code gated on T-V only.
    const support = getMethodSupport('ja');
    assert.equal(support.deeplFormality, true);
  });

  it('has deeplFormality=false for Swahili', () => {
    const support = getMethodSupport('sw');
    assert.equal(support.deeplFormality, false);
  });

  it('all deepl-supported cards have a boolean deeplFormality field', () => {
    const codes = getAllLanguageCodes();
    for (const code of codes) {
      const support = getMethodSupport(code);
      if (support?.deepl === true) {
        assert.equal(typeof support.deeplFormality, 'boolean',
          `${code}: has deepl=true but deeplFormality is not a boolean`);
      }
    }
  });
});

// --------------------------------------------------------------------------
// getRegisterPresets()
// --------------------------------------------------------------------------

describe('Register presets listing', () => {
  it('returns multiple presets for French', () => {
    const presets = getRegisterPresets('fr');
    assert.ok(presets.length >= 2, 'French should have at least 2 presets');
    // Exactly one should be marked as default
    const defaults = presets.filter(p => p.isDefault);
    assert.equal(defaults.length, 1, 'Exactly one preset should be default');
  });

  it('returns multiple presets for Korean', () => {
    const presets = getRegisterPresets('ko');
    assert.ok(presets.length >= 3, 'Korean should have at least 3 presets (speech levels)');
  });

  it('returns empty array for unknown codes', () => {
    const presets = getRegisterPresets('xx-unknown');
    assert.deepEqual(presets, []);
  });

  it('all presets have required fields', () => {
    const codes = getAllLanguageCodes();
    for (const code of codes) {
      const presets = getRegisterPresets(code);
      for (const p of presets) {
        assert.ok(p.key, `${code}: preset missing key`);
        assert.ok(p.label, `${code}: preset ${p.key} missing label`);
        assert.ok(p.prompt, `${code}: preset ${p.key} missing prompt`);
        assert.equal(typeof p.isDefault, 'boolean', `${code}: preset ${p.key} isDefault should be boolean`);
      }
    }
  });
});

// --------------------------------------------------------------------------
// getAllLanguageCodes()
// --------------------------------------------------------------------------

describe('getAllLanguageCodes', () => {
  it('returns at least 40 codes', () => {
    const codes = getAllLanguageCodes();
    assert.ok(codes.length >= 40, `Expected 40+ codes, got ${codes.length}`);
  });

  it('includes expected priority languages', () => {
    const codes = getAllLanguageCodes();
    const expected = ['fr', 'de', 'ja', 'ko', 'es', 'ar', 'zh', 'pt'];
    for (const code of expected) {
      assert.ok(codes.includes(code), `Missing expected code: ${code}`);
    }
  });
});

// --------------------------------------------------------------------------
// Backward-compatible DEFAULT_REGISTERS proxy
// --------------------------------------------------------------------------

describe('DEFAULT_REGISTERS backward compatibility', () => {
  it('returns { name, register } for known codes', () => {
    const fr = DEFAULT_REGISTERS['fr'];
    assert.ok(fr, 'fr should be defined');
    assert.ok(fr.name, 'fr should have name');
    assert.ok(fr.register, 'fr should have register');
    assert.equal(typeof fr.name, 'string');
    assert.equal(typeof fr.register, 'string');
  });

  it('returns undefined for unknown codes', () => {
    assert.equal(DEFAULT_REGISTERS['xx-unknown'], undefined);
  });

  it('includes dir for RTL languages', () => {
    const ar = DEFAULT_REGISTERS['ar'];
    assert.ok(ar, 'ar should be defined');
    assert.equal(ar.dir, 'rtl');
  });

  it('resolves aliases in property access', () => {
    const no = DEFAULT_REGISTERS['no'];
    assert.ok(no, '"no" should resolve via alias');
    assert.equal(no.name, 'Norwegian Bokmål');
  });

  it('supports Object.keys() via ownKeys trap', () => {
    const keys = Object.keys(DEFAULT_REGISTERS);
    assert.ok(keys.length >= 40, `Expected 40+ keys, got ${keys.length}`);
    assert.ok(keys.includes('fr'));
    assert.ok(keys.includes('ko'));
  });

  it('supports "in" operator via has trap', () => {
    assert.ok('fr' in DEFAULT_REGISTERS);
    assert.ok(!('xx-unknown' in DEFAULT_REGISTERS));
  });
});

// ==========================================================================
//
// CROSS-CUTTING INVARIANTS
//
// These tests enforce architectural rules across ALL language cards.
// They are the guardrails that prevent category errors (like gender
// guidance leaking back into register prompts) from ever recurring.
//
// ==========================================================================

// --------------------------------------------------------------------------
// INVARIANT 1: Separation of concerns — register vs gender guidance
//
// Register presets define TONE (formality, pronouns, vocabulary level).
// Gender guidance defines INCLUSIVITY CONVENTIONS (écriture inclusive,
// Doppelpunkt, hen pronoun, etc.).
//
// These are separate concerns: a user choosing casual-tu should still get
// French gender guidance. Therefore gender guidance lives in
// card.gender.inclusiveGuidance and is injected by buildSystemMessage()
// independently of which preset is active.
//
// This test ensures no preset prompt ever duplicates what the card-level
// gender.inclusiveGuidance field provides.
// --------------------------------------------------------------------------

describe('INVARIANT: register presets must NOT contain gender guidance', () => {
  // Pattern matches text that belongs in card.gender.inclusiveGuidance,
  // not in the register preset prompt. We match:
  //   - "gender-inclusive" / "Gender-inclusive" / "gender inclusive"
  //   - "gender-neutral" / "Gender-neutral" / "gender neutral"
  //   - "gendered" (as in "gendered particles", "gendered forms")
  //   - "masculine ... default" (as in "use masculine plural as default")
  //   - "inclusive ... phrasing" / "inclusive ... where"
  //   - "Gender:" prefix (the exact pattern buildSystemMessage uses)
  //
  // We deliberately do NOT match:
  //   - "Neutral" alone (used for vocabulary scope, e.g., "Neutral Latin American")
  //   - "masculine/feminine" as grammatical concepts in descriptions
  const GENDER_GUIDANCE_PATTERN = /gender.inclu|gender.neutral|mascul.*default|inclusiv.*(?:phrasing|where)|gendered|Gender-/i;

  const codes = getAllLanguageCodes();
  for (const code of codes) {
    it(`${code}: no preset prompt contains gender guidance text`, () => {
      const presets = getRegisterPresets(code);
      for (const p of presets) {
        assert.ok(
          !GENDER_GUIDANCE_PATTERN.test(p.prompt),
          `${code}/${p.key}: preset prompt contains gender guidance that belongs in card.gender.inclusiveGuidance instead.\n` +
          `  Prompt: "${p.prompt.substring(0, 100)}..."`
        );
      }
    });
  }
});

// --------------------------------------------------------------------------
// INVARIANT 2: Gender guidance consistency
//
// If a language has grammatical gender (card.gender.grammatical === true),
// it MUST provide inclusiveGuidance — otherwise the LLM gets no language-
// specific advice and falls back to a vague generic rule.
//
// Languages WITHOUT grammatical gender (grammatical === false) MAY still
// have inclusiveGuidance — many languages have gendered conventions that
// aren't "grammatical gender" in the linguistics sense (Thai's ครับ/ค่ะ
// particles, Japanese's boku/watashi pronouns, Vietnamese's pronoun
// hierarchy, Chinese's written 他/她). This guidance is still valuable.
//
// The hard invariant is the first direction only:
//   grammatical=true → inclusiveGuidance REQUIRED
// --------------------------------------------------------------------------

describe('INVARIANT: gender.grammatical ↔ inclusiveGuidance consistency', () => {
  const codes = getAllLanguageCodes();
  for (const code of codes) {
    const card = getLanguageCard(code);
    if (!card.gender) continue; // null gender block is fine (conlangs)

    if (card.gender.grammatical) {
      it(`${code}: grammatical=true → has substantive inclusiveGuidance`, () => {
        assert.ok(
          card.gender.inclusiveGuidance && card.gender.inclusiveGuidance.length > 20,
          `${code}: gender.grammatical is true but inclusiveGuidance is missing or too short`
        );
      });
    }

    // No inverse test: grammatical=false does NOT mean guidance must be absent.
    // Languages like Thai, Japanese, Vietnamese, and Chinese have gendered
    // conventions worth documenting even without noun/adjective agreement.
  }
});

// --------------------------------------------------------------------------
// INVARIANT 3: DeepL formality mapping completeness
//
// If a card declares methodSupport.deeplFormality === true, EVERY register
// preset must have a deeplFormality field ('prefer_more', 'prefer_less',
// or 'default'). Otherwise the DeepL method has no signal for that preset.
//
// If deeplFormality === false, NO preset should have the field (dead config
// is misleading).
// --------------------------------------------------------------------------

describe('INVARIANT: DeepL formality ↔ preset mapping', () => {
  const codes = getAllLanguageCodes();
  for (const code of codes) {
    const card = getLanguageCard(code);
    const support = card.methodSupport;
    if (!support) continue;

    if (support.deeplFormality === true) {
      it(`${code}: deeplFormality=true → every preset has deeplFormality field`, () => {
        for (const [key, preset] of Object.entries(card.registers)) {
          assert.ok(
            preset.deeplFormality && ['prefer_more', 'prefer_less', 'default'].includes(preset.deeplFormality),
            `${code}/${key}: deeplFormality is true at card level but preset missing valid deeplFormality (got: ${preset.deeplFormality})`
          );
        }
      });
    }
  }
});

// --------------------------------------------------------------------------
// INVARIANT 4: Accessor functions handle every card without throwing
//
// Every accessor in registers.js must handle every card code gracefully.
// If any card has an unusual shape (null fields, missing sections), the
// accessors must not throw — they should return null or a sensible default.
// --------------------------------------------------------------------------

describe('INVARIANT: all accessors handle every card code', () => {
  const codes = getAllLanguageCodes();
  for (const code of codes) {
    it(`${code}: all 8 accessor functions succeed`, () => {
      // These should all return without throwing
      const card = getLanguageCard(code);
      assert.ok(card, `getLanguageCard('${code}') returned falsy`);

      const register = getRegister(code);
      assert.ok(typeof register === 'string' && register.length > 0,
        `getRegister('${code}') should return non-empty string`);

      const presets = getRegisterPresets(code);
      assert.ok(Array.isArray(presets), `getRegisterPresets('${code}') should return array`);

      // getFormality can return null for 'none' system cards — that's OK
      const formality = getFormality(code);

      // getGenderGuidance can return null — that's OK
      const guidance = getGenderGuidance(code);

      const support = getMethodSupport(code);
      // support can be null for conlangs without methodSupport

      const resolved = resolveCode(code);
      assert.equal(resolved, code,
        `resolveCode('${code}') should return the same code (not an alias)`);
    });
  }
});

// --------------------------------------------------------------------------
// INVARIANT 5: Harness/production prompt parity
//
// The benchmark harness buildRegisterPrompt must follow the same gender-
// rule injection pattern as production buildSystemMessage in llm.js.
// buildSystemMessage IS exported (llm.js:430), but we test the structural
// contract here via file content matching to guard against accidental
// removal of the genderGuidance wiring in any of the pipeline files.
// --------------------------------------------------------------------------

describe('INVARIANT: production prompt pipeline genderGuidance wiring', () => {
  // NOTE: Tests that verified the JS benchmark harness (run-benchmark.js)
  // have been removed — that harness is deprecated. Prompt parity is now
  // enforced by the Python eval harness's RosettaPromptProvider, which
  // reads language cards directly and has its own parity test.
  //
  // The tests below verify the PRODUCTION pipeline still wires
  // genderGuidance correctly from card → pairs.js → llm.js.

  it('production llm.js uses genderGuidance field', async () => {
    const llm = fs.readFileSync(
      path.join(import.meta.dirname, '..', 'lib', 'methods', 'llm.js'),
      'utf-8'
    );
    assert.ok(
      llm.includes('langConfig.genderGuidance'),
      'Production buildSystemMessage must read langConfig.genderGuidance'
    );
    assert.ok(
      llm.includes('genderGuidance: pairConfig.genderGuidance'),
      'Production translate() must pass genderGuidance from pairConfig to langConfig'
    );
  });

  it('pairs.js injects genderGuidance from card', async () => {
    const pairs = fs.readFileSync(
      path.join(import.meta.dirname, '..', 'lib', 'pairs.js'),
      'utf-8'
    );
    assert.ok(
      pairs.includes('genderGuidance'),
      'pairs.js must include genderGuidance in pair config'
    );
    assert.ok(
      pairs.includes('card?.gender?.inclusiveGuidance'),
      'pairs.js must read genderGuidance from card.gender.inclusiveGuidance'
    );
  });
});

describe('Language card taxonomic inheritance', () => {
  it('resolves extends chain for crk (Plains Cree)', () => {
    const card = getLanguageCard('crk');
    assert.ok(card, 'crk card should load');
    assert.equal(card.extends, 'subfamily-cree');

    // Overridden by child card (crk) — Syllabics is the display script,
    // even though the working orthography (SRO) is Latin-based
    assert.equal(card.script, 'Cans');
    assert.equal(card.dir, 'ltr');
    assert.equal(card.name, 'Plains Cree');
    assert.ok(card.nativeName.includes('ᓀᐦᐃᔭᐍᐏᐣ'),
      'nativeName should include Syllabics form');
    assert.ok(card.formality.description.includes('Plains Cree does not have'));

    // Inherited from subfamily-cree
    assert.equal(card.rules?.variables?.syntax, 'SRO-style attachment');

    // Inherited from family-algonquian (parent of subfamily-cree)
    assert.equal(card.gender?.grammatical, false);
  });
});
