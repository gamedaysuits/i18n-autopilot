/**
 * language-reference.test.js
 * ──────────────────────────────────────────────────────────────────
 * Tests for the two-tier card architecture:
 *
 *   1. Runtime cards (language-cards/) must NOT contain reference fields
 *   2. Reference files (language-reference/) must have valid structure
 *   3. getLanguageReference() must return merged runtime + reference data
 *   4. getLanguageCard() must NOT return reference fields (no leaking)
 *   5. Reference files must have matching runtime cards (no orphans)
 * ──────────────────────────────────────────────────────────────────
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  getLanguageCard,
  getLanguageReference,
  CARDS_DIR,
  REFERENCE_DIR,
} from '../lib/registers.js';

// Fields that belong ONLY in the reference tier
const REFERENCE_ONLY_FIELDS = ['linguisticChallenges', 'encyclopedic', 'resources'];

// ─── Collect file lists ──────────────────────────────────────────

function collectJsonFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  function scan(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) scan(full);
      else if (entry.name.endsWith('.json')) files.push(full);
    }
  }
  scan(dir);
  return files;
}

const runtimeFiles = collectJsonFiles(CARDS_DIR);
const referenceFiles = collectJsonFiles(REFERENCE_DIR);

// ─── Test: Runtime cards are clean ───────────────────────────────

describe('Runtime card tier (language-cards/)', () => {
  for (const filePath of runtimeFiles) {
    const card = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const label = card.code || path.basename(filePath);

    it(`${label}: must NOT contain reference-only fields`, () => {
      for (const field of REFERENCE_ONLY_FIELDS) {
        assert.equal(
          card[field],
          undefined,
          `Runtime card '${label}' contains '${field}' — this field belongs in language-reference/`
        );
      }
    });
  }
});

// ─── Test: Reference files are valid ─────────────────────────────

describe('Reference card tier (language-reference/)', () => {
  for (const filePath of referenceFiles) {
    const ref = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const label = ref.code || path.basename(filePath);

    it(`${label}: must have code and name`, () => {
      assert.ok(ref.code, `Reference file missing 'code'`);
      assert.ok(ref.name, `Reference file missing 'name'`);
    });

    it(`${label}: must have at least one reference field`, () => {
      const hasAny = REFERENCE_ONLY_FIELDS.some(f => ref[f] != null);
      assert.ok(hasAny, `Reference file '${label}' has no reference data — should not exist`);
    });

    it(`${label}: must have a matching runtime card`, () => {
      const runtimeCard = getLanguageCard(ref.code);
      assert.ok(
        runtimeCard,
        `Reference file '${label}' has no matching runtime card in language-cards/`
      );
    });
  }
});

// ─── Test: getLanguageReference() merges correctly ───────────────

describe('getLanguageReference() — lazy merge', () => {
  it('returns null for nonexistent language', () => {
    assert.equal(getLanguageReference('xx-nonexistent'), null);
  });

  // Pick a language we know has reference data (French)
  it('returns merged data for enriched language (fr)', () => {
    const ref = getLanguageReference('fr');
    assert.ok(ref, 'getLanguageReference("fr") returned null');

    // Runtime fields present
    assert.ok(ref.code, 'Missing code');
    assert.ok(ref.registers, 'Missing registers');
    assert.ok(ref.formality, 'Missing formality');

    // Reference fields present
    assert.ok(ref.linguisticChallenges, 'Missing linguisticChallenges in merged result');
    assert.ok(ref.encyclopedic, 'Missing encyclopedic in merged result');
  });

  it('returns runtime-only data for unenriched language', () => {
    // x-pirate has no reference file — should return runtime card
    const ref = getLanguageReference('x-pirate');
    assert.ok(ref, 'getLanguageReference("x-pirate") returned null');
    assert.ok(ref.code, 'Missing code');
    assert.equal(ref.linguisticChallenges, undefined, 'Should not have linguisticChallenges');
  });
});

// ─── Test: getLanguageCard() does NOT leak reference data ────────

describe('getLanguageCard() — no reference leaking', () => {
  it('fr runtime card must not include linguisticChallenges', () => {
    const card = getLanguageCard('fr');
    assert.ok(card, 'getLanguageCard("fr") returned null');
    for (const field of REFERENCE_ONLY_FIELDS) {
      assert.equal(
        card[field],
        undefined,
        `getLanguageCard("fr") leaked reference field '${field}'`
      );
    }
  });
});
