#!/usr/bin/env node
/**
 * Docusaurus integration test suite.
 *
 * Tests the end-to-end Docusaurus sync path: auto-detection, JSON
 * sync with {message, description} format, and content discovery.
 *
 * Run: node test/docusaurus.test.js
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { resolveConfig, detectDocusaurus } from '../lib/config.js';
import {
  extractDocusaurusMessages,
  injectDocusaurusMessages,
} from '../lib/format.js';
import {
  discoverDocusaurusContentFiles,
  getDocusaurusTargetPath,
} from '../lib/content.js';
import { runSync } from '../lib/sync.js';

// Temp directory for test fixtures
const TMP_BASE = path.join(import.meta.dirname, 'fixtures', '_tmp_docusaurus');

// -----------------------------------------------------------------
// Auto-detection tests
// -----------------------------------------------------------------
describe('detectDocusaurus', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = path.join(TMP_BASE, `detect-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns true when docusaurus.config.js exists', () => {
    fs.writeFileSync(path.join(tmpDir, 'docusaurus.config.js'), 'module.exports = {};');
    assert.equal(detectDocusaurus(tmpDir), true);
  });

  it('returns true when docusaurus.config.ts exists', () => {
    fs.writeFileSync(path.join(tmpDir, 'docusaurus.config.ts'), 'export default {};');
    assert.equal(detectDocusaurus(tmpDir), true);
  });

  it('returns false when no Docusaurus config exists', () => {
    assert.equal(detectDocusaurus(tmpDir), false);
  });

  it('auto-sets format to docusaurus in resolveConfig', () => {
    fs.writeFileSync(path.join(tmpDir, 'docusaurus.config.js'), 'module.exports = {};');
    const config = resolveConfig({}, tmpDir);
    assert.equal(config.format, 'docusaurus');
  });

  it('auto-sets localesDir to ./i18n when format is auto-detected', () => {
    fs.writeFileSync(path.join(tmpDir, 'docusaurus.config.js'), 'module.exports = {};');
    const config = resolveConfig({}, tmpDir);
    assert.equal(config.localesDir, path.join(tmpDir, 'i18n'));
  });

  it('does not override explicit format setting', () => {
    fs.writeFileSync(path.join(tmpDir, 'docusaurus.config.js'), 'module.exports = {};');
    // User explicitly sets format to 'json' via CLI
    const config = resolveConfig({ format: 'json' }, tmpDir);
    assert.equal(config.format, 'json');
  });

  it('respects custom localesDir even in Docusaurus project', () => {
    fs.writeFileSync(path.join(tmpDir, 'docusaurus.config.js'), 'module.exports = {};');
    // Write a config file with custom localesDir
    fs.writeFileSync(
      path.join(tmpDir, 'i18n-rosetta.config.json'),
      JSON.stringify({ version: 3, localesDir: './custom-i18n' })
    );
    const config = resolveConfig({}, tmpDir);
    assert.equal(config.format, 'docusaurus');
    assert.equal(config.localesDir, path.join(tmpDir, 'custom-i18n'));
  });
});

// -----------------------------------------------------------------
// Content discovery tests
// -----------------------------------------------------------------
describe('discoverDocusaurusContentFiles', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = path.join(TMP_BASE, `content-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('discovers .md files recursively', () => {
    const docsDir = path.join(tmpDir, 'docs');
    fs.mkdirSync(path.join(docsDir, 'guides'), { recursive: true });
    fs.writeFileSync(path.join(docsDir, 'intro.md'), '# Intro');
    fs.writeFileSync(path.join(docsDir, 'guides', 'quickstart.md'), '# Quick Start');

    const files = discoverDocusaurusContentFiles(docsDir);
    assert.equal(files.length, 2);
    assert.ok(files[1].endsWith('intro.md'));
    assert.ok(files[0].endsWith('quickstart.md'));
  });

  it('discovers .mdx files', () => {
    const docsDir = path.join(tmpDir, 'docs');
    fs.mkdirSync(docsDir, { recursive: true });
    fs.writeFileSync(path.join(docsDir, 'page.mdx'), '# MDX Page');

    const files = discoverDocusaurusContentFiles(docsDir);
    assert.equal(files.length, 1);
    assert.ok(files[0].endsWith('.mdx'));
  });

  it('skips hidden directories', () => {
    const docsDir = path.join(tmpDir, 'docs');
    fs.mkdirSync(path.join(docsDir, '.hidden'), { recursive: true });
    fs.writeFileSync(path.join(docsDir, 'visible.md'), '# Visible');
    fs.writeFileSync(path.join(docsDir, '.hidden', 'secret.md'), '# Hidden');

    const files = discoverDocusaurusContentFiles(docsDir);
    assert.equal(files.length, 1);
    assert.ok(files[0].endsWith('visible.md'));
  });

  it('returns empty for nonexistent directory', () => {
    const files = discoverDocusaurusContentFiles(path.join(tmpDir, 'nope'));
    assert.equal(files.length, 0);
  });
});

// -----------------------------------------------------------------
// Target path mapping tests
// -----------------------------------------------------------------
describe('getDocusaurusTargetPath', () => {
  it('maps docs to versioned path', () => {
    const result = getDocusaurusTargetPath(
      '/project/docs/guides/foo.md',
      '/project/docs',
      'fr',
      '/project/i18n',
      'docusaurus-plugin-content-docs'
    );
    assert.equal(result, '/project/i18n/fr/docusaurus-plugin-content-docs/current/guides/foo.md');
  });

  it('maps blog without version directory', () => {
    const result = getDocusaurusTargetPath(
      '/project/blog/2026-01-01-hello.md',
      '/project/blog',
      'ja',
      '/project/i18n',
      'docusaurus-plugin-content-blog'
    );
    assert.equal(result, '/project/i18n/ja/docusaurus-plugin-content-blog/2026-01-01-hello.md');
  });

  it('handles nested docs', () => {
    const result = getDocusaurusTargetPath(
      '/project/docs/api/reference/methods.md',
      '/project/docs',
      'de',
      '/project/i18n',
      'docusaurus-plugin-content-docs'
    );
    assert.equal(result, '/project/i18n/de/docusaurus-plugin-content-docs/current/api/reference/methods.md');
  });

  it('supports custom version directory', () => {
    const result = getDocusaurusTargetPath(
      '/project/docs/intro.md',
      '/project/docs',
      'es',
      '/project/i18n',
      'docusaurus-plugin-content-docs',
      'version-2.0'
    );
    assert.equal(result, '/project/i18n/es/docusaurus-plugin-content-docs/version-2.0/intro.md');
  });
});

// -----------------------------------------------------------------
// End-to-end sync test (no-fallback — verifies failure behavior)
// -----------------------------------------------------------------
describe('Docusaurus sync integration (no-fallback)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = path.join(TMP_BASE, `sync-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    // Create a Docusaurus project structure
    fs.writeFileSync(path.join(tmpDir, 'docusaurus.config.js'), 'module.exports = {};');

    // Rosetta config with one target language
    fs.writeFileSync(path.join(tmpDir, 'i18n-rosetta.config.json'), JSON.stringify({
      version: 3,
      sourceLocale: 'en',
      localesDir: './i18n',
      pairs: {
        'en:fr': { method: 'llm', model: 'test/model' },
      },
    }));

    // Source locale JSON files
    const enDir = path.join(tmpDir, 'i18n', 'en', 'docusaurus-theme-classic');
    fs.mkdirSync(enDir, { recursive: true });

    fs.writeFileSync(
      path.join(tmpDir, 'i18n', 'en', 'code.json'),
      JSON.stringify({
        'theme.title': { message: 'My Site', description: 'The site title' },
        'theme.tagline': { message: 'Cool tagline', description: 'The site tagline' },
      }, null, 2)
    );

    fs.writeFileSync(
      path.join(enDir, 'navbar.json'),
      JSON.stringify({
        'item.label.Docs': { message: 'Docs', description: 'Navbar docs link' },
        'item.label.Blog': { message: 'Blog', description: 'Navbar blog link' },
      }, null, 2)
    );

    const docsDir = path.join(tmpDir, 'docs');
    fs.mkdirSync(docsDir, { recursive: true });
    fs.writeFileSync(path.join(docsDir, 'intro.md'), '---\ntitle: Introduction\n---\n# Welcome\n\nThis is the intro.\n');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('dry-run mode previews without writing files', async () => {
    const saved = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;

    const origLog = console.log;
    const origWarn = console.warn;
    const origWrite = process.stdout.write;
    console.log = () => {};
    console.warn = () => {};
    process.stdout.write = () => true;

    try {
      await runSync({
        cwd: tmpDir,
        dryRun: true,
        cliArgs: { dry: true, 'no-verify': true },
      });

      const frCodePath = path.join(tmpDir, 'i18n', 'fr', 'code.json');
      assert.ok(!fs.existsSync(frCodePath), 'fr/code.json should NOT exist in dry run');

    } finally {
      console.log = origLog;
      console.warn = origWarn;
      process.stdout.write = origWrite;
      if (saved) process.env.OPENROUTER_API_KEY = saved;
    }
  });

  it('does not overwrite existing translated content files', async () => {
    const saved = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;

    const origLog = console.log;
    const origWarn = console.warn;
    const origWrite = process.stdout.write;
    const origErr = console.error;
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};
    process.stdout.write = () => true;

    try {
      const targetDoc = path.join(
        tmpDir, 'i18n', 'fr', 'docusaurus-plugin-content-docs', 'current', 'intro.md'
      );
      fs.mkdirSync(path.dirname(targetDoc), { recursive: true });
      fs.writeFileSync(targetDoc, '# Bienvenue\n\nCeci est la traduction.');

      try {
        await runSync({
          cwd: tmpDir,
          cliArgs: { 'no-verify': true },
        });
      } catch {
        // Expected — no API key
      }

      const content = fs.readFileSync(targetDoc, 'utf-8');
      assert.ok(content.includes('Bienvenue'), 'Existing translation should be preserved');
      assert.ok(!content.includes('[EN]'), 'Should not have been overwritten');

    } finally {
      console.log = origLog;
      console.warn = origWarn;
      console.error = origErr;
      process.stdout.write = origWrite;
      if (saved) process.env.OPENROUTER_API_KEY = saved;
    }
  });
});

