import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  loadTM,
  saveTM,
  lookupTM,
  storeTM,
  partitionByTM,
  tmSize,
  cacheKey,
  TM_VERSION,
  TM_DIR,
  TM_FILENAME,
} from '../lib/tm.js';

// -----------------------------------------------------------------
// Helper — create a temp directory for each test
// -----------------------------------------------------------------

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'rosetta-tm-test-'));
}

function cleanupTempDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

// -----------------------------------------------------------------
// cacheKey — deterministic hash generation
// -----------------------------------------------------------------

test('cacheKey: produces consistent hash for same input', () => {
  const k1 = cacheKey('Hello', 'fr', 'llm');
  const k2 = cacheKey('Hello', 'fr', 'llm');
  assert.equal(k1, k2);
});

test('cacheKey: different source values produce different hashes', () => {
  const k1 = cacheKey('Hello', 'fr', 'llm');
  const k2 = cacheKey('Goodbye', 'fr', 'llm');
  assert.notEqual(k1, k2);
});

test('cacheKey: different locales produce different hashes', () => {
  const k1 = cacheKey('Hello', 'fr', 'llm');
  const k2 = cacheKey('Hello', 'de', 'llm');
  assert.notEqual(k1, k2);
});

test('cacheKey: different methods produce different hashes', () => {
  const k1 = cacheKey('Hello', 'fr', 'llm');
  const k2 = cacheKey('Hello', 'fr', 'google-translate');
  assert.notEqual(k1, k2);
});

test('cacheKey: returns 16-character hex string', () => {
  const k = cacheKey('test', 'fr', 'llm');
  assert.equal(k.length, 16);
  assert.ok(/^[0-9a-f]{16}$/.test(k));
});

// -----------------------------------------------------------------
// loadTM / saveTM — file lifecycle
// -----------------------------------------------------------------

test('loadTM: returns empty TM for non-existent directory', () => {
  const tm = loadTM('/tmp/nonexistent-rosetta-test-dir-xyz');
  assert.ok(tm._meta);
  assert.equal(tm._meta.version, TM_VERSION);
  assert.equal(tmSize(tm), 0);
});

test('loadTM + saveTM: round-trips TM to disk', () => {
  const dir = createTempDir();
  try {
    const tm = loadTM(dir);
    storeTM(tm, 'Hello', 'fr', 'llm', 'Bonjour');
    saveTM(dir, tm);

    // Reload from disk
    const tm2 = loadTM(dir);
    assert.equal(lookupTM(tm2, 'Hello', 'fr', 'llm'), 'Bonjour');
  } finally {
    cleanupTempDir(dir);
  }
});

test('saveTM: creates .rosetta/ directory if missing', () => {
  const dir = createTempDir();
  try {
    const tm = loadTM(dir);
    storeTM(tm, 'Test', 'de', 'llm', 'Test');
    saveTM(dir, tm);

    assert.ok(fs.existsSync(path.join(dir, TM_DIR)));
    assert.ok(fs.existsSync(path.join(dir, TM_DIR, TM_FILENAME)));
  } finally {
    cleanupTempDir(dir);
  }
});

test('loadTM: handles corrupt JSON gracefully', () => {
  const dir = createTempDir();
  try {
    const tmDir = path.join(dir, TM_DIR);
    fs.mkdirSync(tmDir, { recursive: true });
    fs.writeFileSync(path.join(tmDir, TM_FILENAME), '{ invalid json!!!', 'utf-8');

    const tm = loadTM(dir);
    assert.ok(tm._meta, 'Should return empty TM on corrupt file');
    assert.equal(tmSize(tm), 0);
  } finally {
    cleanupTempDir(dir);
  }
});

test('loadTM: handles version mismatch by starting fresh', () => {
  const dir = createTempDir();
  try {
    const tmDir = path.join(dir, TM_DIR);
    fs.mkdirSync(tmDir, { recursive: true });
    fs.writeFileSync(
      path.join(tmDir, TM_FILENAME),
      JSON.stringify({ _meta: { version: 9999 }, old: 'data' }),
      'utf-8'
    );

    const tm = loadTM(dir);
    assert.equal(tm._meta.version, TM_VERSION);
    assert.equal(tmSize(tm), 0, 'Old entries should be discarded');
  } finally {
    cleanupTempDir(dir);
  }
});

// -----------------------------------------------------------------
// lookupTM / storeTM — cache operations
// -----------------------------------------------------------------

test('lookupTM: returns null for cache miss', () => {
  const tm = loadTM('/tmp/nonexistent');
  assert.equal(lookupTM(tm, 'Hello', 'fr', 'llm'), null);
});

test('storeTM + lookupTM: stores and retrieves translation', () => {
  const tm = loadTM('/tmp/nonexistent');
  storeTM(tm, 'Hello', 'fr', 'llm', 'Bonjour');
  assert.equal(lookupTM(tm, 'Hello', 'fr', 'llm'), 'Bonjour');
});

test('storeTM: overwrites existing entry for same key', () => {
  const tm = loadTM('/tmp/nonexistent');
  storeTM(tm, 'Hello', 'fr', 'llm', 'Bonjour');
  storeTM(tm, 'Hello', 'fr', 'llm', 'Salut');
  assert.equal(lookupTM(tm, 'Hello', 'fr', 'llm'), 'Salut');
});

test('lookupTM: different method = cache miss', () => {
  const tm = loadTM('/tmp/nonexistent');
  storeTM(tm, 'Hello', 'fr', 'llm', 'Bonjour');
  assert.equal(lookupTM(tm, 'Hello', 'fr', 'google-translate'), null);
});

// -----------------------------------------------------------------
// partitionByTM — bulk partition
// -----------------------------------------------------------------

test('partitionByTM: separates hits and misses', () => {
  const tm = loadTM('/tmp/nonexistent');
  storeTM(tm, 'Hello', 'fr', 'llm', 'Bonjour');
  storeTM(tm, 'Goodbye', 'fr', 'llm', 'Au revoir');

  const sourceFlat = {
    'key1': 'Hello',
    'key2': 'World',
    'key3': 'Goodbye',
  };

  const { hits, misses } = partitionByTM(
    tm, sourceFlat, ['key1', 'key2', 'key3'], 'fr', 'llm'
  );

  assert.equal(Object.keys(hits).length, 2);
  assert.equal(hits['key1'], 'Bonjour');
  assert.equal(hits['key3'], 'Au revoir');
  assert.deepEqual(misses, ['key2']);
});

test('partitionByTM: all misses when TM is empty', () => {
  const tm = loadTM('/tmp/nonexistent');
  const sourceFlat = { 'k1': 'A', 'k2': 'B' };

  const { hits, misses } = partitionByTM(tm, sourceFlat, ['k1', 'k2'], 'fr', 'llm');

  assert.equal(Object.keys(hits).length, 0);
  assert.deepEqual(misses, ['k1', 'k2']);
});

test('partitionByTM: handles non-string source values', () => {
  const tm = loadTM('/tmp/nonexistent');
  const sourceFlat = { 'k1': 42 };

  const { hits, misses } = partitionByTM(tm, sourceFlat, ['k1'], 'fr', 'llm');

  assert.equal(Object.keys(hits).length, 0);
  assert.deepEqual(misses, ['k1']);
});

// -----------------------------------------------------------------
// tmSize — entry counting
// -----------------------------------------------------------------

test('tmSize: returns 0 for empty TM', () => {
  const tm = loadTM('/tmp/nonexistent');
  assert.equal(tmSize(tm), 0);
});

test('tmSize: counts entries excluding metadata', () => {
  const tm = loadTM('/tmp/nonexistent');
  storeTM(tm, 'A', 'fr', 'llm', 'A_fr');
  storeTM(tm, 'B', 'de', 'llm', 'B_de');
  assert.equal(tmSize(tm), 2);
});
