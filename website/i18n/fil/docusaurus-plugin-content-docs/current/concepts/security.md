---
sidebar_position: 4
title: "Security"
---
# Security & Safety

Ang Rosetta ay naka-design para maging safe sa mga adversarial environments — kung saan ang locale data ay maaaring manggaling sa mga untrusted sources, kung saan ang mga crafted file names ay pwedeng mag-escape sa directory boundaries, at kung saan ang LLM output ay pwedeng maglaman ng kahit ano.

## Threat Model

| Threat | Attack Vector | Mitigation |
|--------|--------------|-----------|
| **Prototype pollution** | Crafted JSON keys (`__proto__`, `constructor`) | Nire-reject at parse time |
| **Path traversal** | Locale codes tulad ng `../../etc/passwd` | Ang mga file write ay vina-validate sa mga configured directories |
| **Code block corruption** | Nagta-translate ang LLM sa loob ng code fences | Unicode sentinel shielding |
| **Hallucinated keys** | Nagre-return ang LLM ng keys na hindi naman sinend | Response validation — tanging mga accepted keys lang ang isinusulat |
| **Runaway token spend** | Infinite retry loops | Naka-budget-cap via `maxRetries` |

## Prototype Pollution Guard

Lahat ng locale keys ay vina-validate laban sa isang blocklist bago i-process:

- `__proto__`
- `constructor`
- `prototype`

Anumang key na nagma-match sa mga patterns na ito ay nire-reject at nagbabalik ng error. Pinipigilan nito ang mga attackers na gumamit ng crafted locale files para i-modify ang mga JavaScript object prototypes.

## Path Containment

Kapag nagsusulat ng locale files, vina-validate ng rosetta na ang output path ay mananatili sa loob ng mga configured directories (`localesDir`, `contentDir`). Sinasanitize ang mga locale codes — ang isang code tulad ng `../../secrets` ay hindi makakapagsulat sa labas ng expected directory.

## Block Protection

Habang ginagawa ang Markdown content translation, ang mga structured elements ay pinapalitan ng Unicode sentinel placeholders bago i-send ang text sa LLM:

1. **Code blocks** (fenced at inline) → sentinel
2. **Hugo shortcodes** (`{{< >}}`, `{{% %}}`) → sentinel  
3. **Raw HTML** → sentinel
4. **Interpolation variables** (`{{ .Count }}`) → sentinel

Pagkatapos ng translation, ang mga sentinels ay pinapalitan pabalik ng original content. Hindi nakikita ng LLM ang mga code blocks, shortcodes, o HTML — kaya hindi niya ito mako-corrupt.

## Response Validation

Kapag nag-return ang LLM ng JSON response, vina-validate ng rosetta na:
- Tanging ang mga keys lang na sinend sa batch ang lilitaw sa response
- Walang extra keys na na-inject
- Ang response ay napa-parse bilang valid JSON

Ang mga hallucinated keys ay silently na dina-drop. Pinipigilan nito ang LLM output na mag-inject ng mga unexpected translations sa inyong mga locale files.

## Quality Gate

Bawat translation ay vina-validate gamit ang limang deterministic checks bago ito isulat sa disk. Tingnan ang [Quality Gate](/docs/concepts/quality-gate) para sa mga detalye.

## Exponential Backoff

Ang mga API calls ay gumagamit ng exponential backoff with jitter sa mga 429 (rate limit) at 5xx (server error) na responses. Ang tatlong retries na may increasing delay ay pumipigil sa pag-hammer sa API kapag may outages.

## Request Timeout

Bawat API request ay may 30-second timeout via `AbortController`. Pinipigilan nito ang sync process na mag-hang nang walang katapusan sa isang dead connection.

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

Ang mga placeholders na ito ay automatically na nade-detect at nire-retranslate sa susunod na sync gamit ang isang valid API key. Hindi po sila kailanman ituturing na "translated" — ifa-flag sila ng `audit`.

## Testing

Ang mga security properties ay vine-verify ng adversarial test suite:

```bash
npm run test:redteam    # prototype pollution, path traversal, encoding attacks
```

---

## See Also

- [Architecture](/docs/concepts/architecture) — kung paano nagko-connect ang three-piece ecosystem
- [CLI Reference — integrity](/docs/reference/cli#integrity) — command para sa integrity checking
- [CLI Reference — provenance](/docs/reference/cli#provenance) — command para sa provenance auditing
- [Plugin Specification](/docs/reference/plugin-spec) — mga provenance fields sa mga plugin manifests
- [Quality Gate](/docs/concepts/quality-gate) — mga translation-level safety checks