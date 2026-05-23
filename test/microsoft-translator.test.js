#!/usr/bin/env node
/**
 * Microsoft Translator method test suite.
 *
 * Tests cover:
 *   - Constructor and naming
 *   - Cost estimation
 *   - Quality tier and provenance
 *   - No-key early return
 *   - Registry lookup
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { MicrosoftTranslatorMethod } from '../lib/methods/microsoft-translator.js';
import { getMethod } from '../lib/translate.js';

// =================================================================
// MicrosoftTranslatorMethod
// =================================================================
describe('MicrosoftTranslatorMethod', () => {
  it('has the correct name', () => {
    const method = new MicrosoftTranslatorMethod();
    assert.equal(method.name, 'microsoft-translator');
  });

  it('returns standard quality tier', () => {
    const method = new MicrosoftTranslatorMethod();
    assert.equal(method.getQualityTier(), 'standard');
  });

  it('returns correct provenance', () => {
    const method = new MicrosoftTranslatorMethod();
    const prov = method.getProvenance();
    assert.equal(prov.commercialReady, true);
    assert.ok(prov.resources[0].name.includes('Microsoft'));
    assert.equal(prov.flags.length, 0);
  });

  it('returns cost estimate', () => {
    const method = new MicrosoftTranslatorMethod();
    const cost = method.estimateCost(100);
    assert.equal(cost.currency, 'USD');
    assert.ok(typeof cost.source === 'string' && cost.source.length > 0);
  });

  it('returns null when no API key is provided', async (t) => {
    // Skip if a real key is discoverable — can't test the null path
    const { getEnvOrFileVar } = await import('../lib/api-key.js');
    if (getEnvOrFileVar('MICROSOFT_TRANSLATOR_API_KEY')) return t.skip('MICROSOFT_TRANSLATOR_API_KEY is set');

    const method = new MicrosoftTranslatorMethod();
    const origErr = console.error;
    console.error = () => {};
    try {
      const result = await method.translate(
        ['test.key'],
        { 'test.key': 'Hello' },
        { name: 'French', register: 'Standard.', target: 'fr', source: 'en' },
        { apiKey: null },
      );
      assert.equal(result, null);
    } finally {
      console.error = origErr;
    }
  });

  it('returns null for translateContent (unsupported)', async () => {
    const method = new MicrosoftTranslatorMethod();
    const result = await method.translateContent(
      'Translate this.',
      { name: 'French', register: 'Standard.', target: 'fr' },
      {},
    );
    assert.equal(result, null);
  });
});

// =================================================================
// Registry integration
// =================================================================
describe('METHOD_REGISTRY — microsoft-translator', () => {
  it('getMethod returns MicrosoftTranslatorMethod for "microsoft-translator"', () => {
    const method = getMethod('microsoft-translator');
    assert.equal(method.name, 'microsoft-translator');
    assert.ok(method instanceof MicrosoftTranslatorMethod);
  });
});
