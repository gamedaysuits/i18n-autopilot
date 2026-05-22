---
sidebar_position: 4
title: Security
---

# Security & Safety

Rosetta is designed to be safe in adversarial environments — where locale data might come from untrusted sources, where crafted file names could escape directory boundaries, and where LLM output can contain anything.

## Threat Model

| Threat | Attack Vector | Mitigation |
|--------|--------------|-----------|
| **Prototype pollution** | Crafted JSON keys (`__proto__`, `constructor`) | Rejected at parse time |
| **Path traversal** | Locale codes like `../../etc/passwd` | File writes validated to configured directories |
| **Code block corruption** | LLM translates inside code fences | Unicode sentinel shielding |
| **Hallucinated keys** | LLM returns keys that weren't sent | Response validation — only accepted keys are written |
| **Runaway token spend** | Infinite retry loops | Budget-capped via `maxRetries` |

## Prototype Pollution Guard

All locale keys are validated against a blocklist before processing:

- `__proto__`
- `constructor`
- `prototype`

Any key matching these patterns is rejected with an error. This prevents attackers from using crafted locale files to modify JavaScript object prototypes.

## Path Containment

When writing locale files, rosetta validates that the output path stays within the configured directories (`localesDir`, `contentDir`). Locale codes are sanitized — a code like `../../secrets` cannot write outside the expected directory.

## Block Protection

During Markdown content translation, structured elements are replaced with Unicode sentinel placeholders before the text is sent to the LLM:

1. **Code blocks** (fenced and inline) → sentinel
2. **Hugo shortcodes** (`{{< >}}`, `{{% %}}`) → sentinel  
3. **Raw HTML** → sentinel
4. **Interpolation variables** (`{{ .Count }}`) → sentinel

After translation, sentinels are replaced with the original content. The LLM never sees code blocks, shortcodes, or HTML — it can't corrupt them.

## Response Validation

When the LLM returns a JSON response, rosetta validates that:
- Only keys that were sent in the batch appear in the response
- No extra keys are injected
- The response parses as valid JSON

Hallucinated keys are silently dropped. This prevents LLM output from injecting unexpected translations into your locale files.

## Quality Gate

Every translation is validated through five deterministic checks before it's written to disk. See [Quality Gate](/docs/concepts/quality-gate) for details.

## Exponential Backoff

API calls use exponential backoff with jitter on 429 (rate limit) and 5xx (server error) responses. Three retries with increasing delay prevent hammering the API during outages.

## Request Timeout

Every API request has a 30-second timeout via `AbortController`. This prevents the sync process from hanging indefinitely on a dead connection.

## Fallback Mode

When the API is unavailable, `--fallback` writes `[EN]`-prefixed placeholders instead of real translations:

```bash
npx i18n-rosetta sync --fallback
```

```json
{
  "hero.title": "[EN] Welcome to our platform"
}
```

These placeholders are automatically detected and re-translated on the next sync with a valid API key. They're never treated as "translated" — `audit` will flag them.

## Testing

Security properties are verified by the adversarial test suite:

```bash
npm run test:redteam    # prototype pollution, path traversal, encoding attacks
```

---

## See Also

- [Architecture](/docs/concepts/architecture) — how the three-piece ecosystem connects
- [CLI Reference — integrity](/docs/reference/cli#integrity) — integrity checking command
- [CLI Reference — provenance](/docs/reference/cli#provenance) — provenance auditing command
- [Plugin Specification](/docs/reference/plugin-spec) — provenance fields in plugin manifests
- [Quality Gate](/docs/concepts/quality-gate) — translation-level safety checks
