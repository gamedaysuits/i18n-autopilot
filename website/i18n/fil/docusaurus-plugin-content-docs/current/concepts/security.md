---
sidebar_position: 4
title: "Security"
---
# Security & Safety

Ang Rosetta ay naka-design para maging safe sa mga adversarial environments — kung saan ang locale data ay maaaring manggaling sa mga untrusted sources, kung saan ang mga crafted file names ay pwedeng mag-escape sa directory boundaries, at kung saan ang LLM output ay pwedeng maglaman ng kahit ano.

## Threat Model

| Threat | Attack Vector | Mitigation |
|--------|--------------|-----------|
| **Prototype pollution** | Mga crafted JSON keys (`__proto__`, `constructor`) | Nire-reject at parse time |
| **Path traversal** | Mga locale codes tulad ng `../../etc/passwd` | Ang mga file writes ay vina-validate sa mga configured directories |
| **Code block corruption** | Nagta-translate ang LLM sa loob ng mga code fences | Unicode sentinel shielding |
| **Hallucinated keys** | Nagre-return ang LLM ng mga keys na hindi naman na-send | Response validation — tanging mga accepted keys lang ang isinusulat |
| **Runaway token spend** | Mga infinite retry loops | Naka-budget-cap via `maxRetries` |

## Prototype Pollution Guard

Ang lahat ng locale keys ay vina-validate laban sa isang blocklist bago i-process:

- `__proto__`
- `constructor`
- `prototype`

Anumang key na mag-match sa mga patterns na ito ay ire-reject na may error. Pinipigilan po nito ang mga attackers na gumamit ng mga crafted locale files para i-modify ang mga JavaScript object prototypes.

## Path Containment

Kapag nagsusulat ng mga locale files, vina-validate ng rosetta na ang output path ay nananatili sa loob ng mga configured directories (`localesDir`, `contentDir`). Sinasanitize po ang mga locale codes — ang isang code tulad ng `../../secrets` ay hindi makakapagsulat sa labas ng expected directory.

## Block Protection

Habang nagta-translate ng Markdown content, ang mga structured elements ay pinapalitan ng mga Unicode sentinel placeholders bago i-send ang text sa LLM:

1. **Code blocks** (fenced at inline) → sentinel
2. **Hugo shortcodes** (`{{< >}}`, `{{% %}}`) → sentinel  
3. **Raw HTML** → sentinel
4. **Interpolation variables** (`{{ .Count }}`) → sentinel

Pagkatapos ng translation, ibinabalik po ang original content kapalit ng mga sentinels. Hindi nakikita ng LLM ang mga code blocks, shortcodes, o HTML — kaya hindi po nito mako-corrupt ang mga ito.

## Response Validation

Kapag nag-return ang LLM ng JSON response, vina-validate ng rosetta na:
- Tanging ang mga keys lang na na-send sa batch ang lalabas sa response
- Walang extra keys na mai-inject
- Ang response ay nagpa-parse bilang valid JSON

Ang mga hallucinated keys ay tahimik na dina-drop. Pinipigilan po nito ang LLM output na mag-inject ng mga unexpected translations sa inyong mga locale files.

## Quality Gate

Bawat translation ay vina-validate gamit ang five deterministic checks bago ito isulat sa disk. Tingnan po ang [Quality Gate](/docs/concepts/quality-gate) para sa mga detalye.

## Exponential Backoff

Gumagamit po ang mga API calls ng exponential backoff na may jitter sa mga 429 (rate limit) at 5xx (server error) responses. Ang three retries na may increasing delay ay pumipigil sa pag-hammer sa API kapag may mga outages.

## Request Timeout

Bawat API request ay may 30-second timeout via `AbortController`. Pinipigilan po nito ang sync process na mag-hang indefinitely sa isang dead connection.

## Fallback Mode

Kapag unavailable ang API, nagsusulat ang `--fallback` ng mga `[EN]`-prefixed placeholders imbes na mga totoong translations:

```bash
npx i18n-rosetta sync --fallback
```

```json
{
  "hero.title": "[EN] Welcome to our platform"
}
```

Ang mga placeholders na ito ay automatically na nade-detect at nire-re-translate sa susunod na sync gamit ang isang valid API key. Hindi po sila kailanman ituturing na "translated" — ifa-flag sila ng `audit`.

## Testing

Ang mga security properties ay vine-verify ng adversarial test suite:

```bash
npm run test:redteam    # prototype pollution, path traversal, encoding attacks
```

---

## See Also

- [Architecture](/docs/concepts/architecture) — kung paano nagko-connect ang three-piece ecosystem
- [CLI Reference — integrity](/docs/reference/cli#integrity) — integrity checking command
- [CLI Reference — provenance](/docs/reference/cli#provenance) — provenance auditing command
- [Plugin Specification](/docs/reference/plugin-spec) — mga provenance fields sa mga plugin manifests
- [Quality Gate](/docs/concepts/quality-gate) — mga translation-level safety checks