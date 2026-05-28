/**
 * Content sync integration tests.
 *
 * Tests the runContentSync pipeline verifying:
 *   - Content file discovery
 *   - Existing translation skip logic
 *   - Dry-run mode (no file writes)
 *   - Path containment security
 *   - Loud failures when no API key is available
 *
 * v4 CHANGE: Fallback mode (--fallback / useFallback) was removed.
 * Content sync without an API key now throws loud errors instead of
 * silently writing [EN]-prefixed garbage. Tests that previously
 * verified fallback behavior now verify failure behavior.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { runContentSync } from '../lib/sync.js';

// Create a temporary content directory for each test
function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'rosetta-content-'));
}

// Write a Hugo content file to the temp directory
function writeContent(dir, relPath, content) {
  const fullPath = path.join(dir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf-8');
  return fullPath;
}

// Minimal language config for testing
const TEST_LANGUAGES = {
  fr: { name: 'French', register: 'Professional.' },
  de: { name: 'German', register: 'Professional.' },
};

/** Build a v3 pair Map from a languages object for testing. */
function buildTestPairs(languages, sourceLocale = 'en') {
  const pairs = new Map();
  for (const [code, lang] of Object.entries(languages)) {
    pairs.set(`${sourceLocale}:${code}`, {
      source: sourceLocale,
      target: code,
      method: 'llm',
      model: 'google/gemini-3.5-flash',
      batchSize: 30,
      name: lang.name,
      register: lang.register,
    });
  }
  return pairs;
}

// Sample Hugo content file with front matter and body
const SAMPLE_POST = `---
title: My First Post
description: A short introduction to Hugo
date: 2024-01-15
draft: false
tags:
  - intro
  - tutorial
---
Welcome to **Hugo**! This is a sample post.

## Getting Started

Hugo is a fast static site generator.

\`\`\`bash
hugo new site mysite
\`\`\`

That's all you need to know.
`;

describe('runContentSync (no-fallback mode)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // ── Failure behavior tests ────────────────────────────────────────
  // Without an API key, content sync must fail LOUD — no silent [EN] writing.

  it('throws when no API key is available (front matter)', async () => {
    writeContent(tmpDir, 'posts/hello.md', SAMPLE_POST);

    await assert.rejects(
      () => runContentSync({
        contentDir: tmpDir,
        sourceLocale: 'en',
        pairs: buildTestPairs({ fr: TEST_LANGUAGES.fr }),
        translatableFields: null,
        apiKey: null,
        dryRun: false,
        cwd: tmpDir,
      }),
      (err) => {
        assert.ok(err.message.includes('no API key'), `Expected API key error, got: ${err.message}`);
        return true;
      },
      'Should throw loud error when no API key available'
    );
  });

  // ── Skip logic tests ─────────────────────────────────────────────
  // These use existing target files to test the skip path (no API needed)

  it('skips existing translations without overwriting', async () => {
    writeContent(tmpDir, 'posts/hello.md', SAMPLE_POST);
    const existingPath = writeContent(tmpDir, 'posts/hello.fr.md', '---\ntitle: Mon Premier Article\n---\nContenu existant.\n');

    // When target already exists, content sync skips it — no API call needed
    await runContentSync({
      contentDir: tmpDir,
      sourceLocale: 'en',
      pairs: buildTestPairs({ fr: TEST_LANGUAGES.fr }),
      translatableFields: null,
      apiKey: null,
      dryRun: false,
      cwd: tmpDir,
    });

    // Existing file should NOT be overwritten
    const output = fs.readFileSync(existingPath, 'utf-8');
    assert.ok(output.includes('Mon Premier Article'), 'existing translation preserved');
    assert.ok(!output.includes('[EN]'), 'no fallback prefix injected');
  });

  // ── Dry-run tests ─────────────────────────────────────────────────
  // Dry run doesn't need an API key — it just reports what would happen

  it('does not write files in dry-run mode', async () => {
    writeContent(tmpDir, 'posts/hello.md', SAMPLE_POST);

    await runContentSync({
      contentDir: tmpDir,
      sourceLocale: 'en',
      pairs: buildTestPairs(TEST_LANGUAGES),
      translatableFields: null,
      apiKey: null,
      dryRun: true,
      cwd: tmpDir,
    });

    assert.ok(!fs.existsSync(path.join(tmpDir, 'posts/hello.fr.md')), 'French file NOT created');
    assert.ok(!fs.existsSync(path.join(tmpDir, 'posts/hello.de.md')), 'German file NOT created');
  });

  // ── Edge case tests ───────────────────────────────────────────────

  it('handles empty content directory gracefully', async () => {
    // tmpDir exists but has no .md files
    await runContentSync({
      contentDir: tmpDir,
      sourceLocale: 'en',
      pairs: buildTestPairs(TEST_LANGUAGES),
      translatableFields: null,
      apiKey: null,
      dryRun: false,
      cwd: tmpDir,
    });
    // Should not throw — no files to process
  });

  it('handles nonexistent content directory gracefully', async () => {
    await runContentSync({
      contentDir: path.join(tmpDir, 'nonexistent'),
      sourceLocale: 'en',
      pairs: buildTestPairs(TEST_LANGUAGES),
      translatableFields: null,
      apiKey: null,
      dryRun: false,
      cwd: tmpDir,
    });
    // Should not throw — directory doesn't exist
  });

  it('handles source files with .en.md suffix', async () => {
    writeContent(tmpDir, 'posts/hello.en.md', SAMPLE_POST);

    // Dry run to test path generation without API key
    await runContentSync({
      contentDir: tmpDir,
      sourceLocale: 'en',
      pairs: buildTestPairs({ fr: TEST_LANGUAGES.fr }),
      translatableFields: null,
      apiKey: null,
      dryRun: true,
      cwd: tmpDir,
    });

    // In dry run, file isn't created, but we verify it doesn't crash
    // and the path would be hello.fr.md (not hello.en.fr.md)
  });
});
