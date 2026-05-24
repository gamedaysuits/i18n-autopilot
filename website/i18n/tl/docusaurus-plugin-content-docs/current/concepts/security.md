---
sidebar_position: 4
title: "Security"
---
# Security & Safety

Ang Rosetta ay naka-design para maging safe sa mga adversarial environment — kung saan ang locale data ay maaaring manggaling sa mga untrusted sources, kung saan ang mga crafted file names ay pwedeng mag-escape sa directory boundaries, at kung saan ang LLM output ay pwedeng maglaman ng kahit ano.

## Threat Model

| Threat | Attack Vector | Mitigation |
|--------|--------------|-----------|
| **Prototype pollution** | Crafted JSON keys (`__proto__`, `constructor`) | Nire-reject at parse time |
| **Path traversal** | Mga locale code tulad ng `../../etc/passwd` | Vina-validate ang file writes sa mga configured directory |
| **Code block corruption** | Nagta-translate ang LLM sa loob ng code fences | Unicode sentinel shielding |
| **Hallucinated keys** | Nagre-return ang LLM ng keys na hindi naman na-send | Response validation — tanging mga accepted keys lang ang isinusulat |
| **Runaway token spend** | Infinite retry loops | Naka-budget cap via `maxRetries` |

## Prototype Pollution Guard

Lahat ng locale keys ay vina-validate laban sa isang blocklist bago i-process:

- `__proto__`
- `constructor`
- `prototype`

Anumang key na nagma-match sa mga pattern na ito ay nire-reject at nagbabalik ng error. Pinipigilan nito ang mga attacker na gumamit ng mga crafted locale files para i-modify ang mga JavaScript object prototype.

## Path Containment

Kapag nagsusulat ng mga locale file, vina-validate ng rosetta na ang output path ay nananatili sa loob ng mga configured directory (`localesDir`, `contentDir`). Sinasanitize ang mga locale code — ang isang code na tulad ng `../../secrets` ay hindi makakapagsulat sa labas ng expected directory.

## Block Protection

Habang nagta-translate ng Markdown content, pinapalitan ng mga Unicode sentinel placeholder ang mga structured element bago i-send ang text sa LLM:

1. **Code blocks** (fenced at inline) → sentinel
2. **Hugo shortcodes** (`{{< >}}`, `{{% %}}`) → sentinel  
3. **Raw HTML** → sentinel
4. **Interpolation variables** (`{{ .Count }}`) → sentinel

Pagkatapos ng translation, ibinabalik ang original content kapalit ng mga sentinel. Hindi nakikita ng LLM ang mga code block, shortcode, o HTML — kaya hindi nito mako-corrupt ang mga ito.

## Response Validation

Kapag nag-return ang LLM ng JSON response, vina-validate ng rosetta na:
- Tanging ang mga keys lang na na-send sa batch ang lalabas sa response
- Walang extra keys na nai-inject
- Naka-parse bilang valid JSON ang response

Ang mga hallucinated keys ay tahimik na dina-drop. Pinipigilan nito ang LLM output na mag-inject ng mga unexpected translation sa inyong mga locale file.

## Quality Gate

Bawat translation ay vina-validate gamit ang limang deterministic checks bago ito isulat sa disk. Tingnan ang [Quality Gate](/docs/concepts/quality-gate) para sa mga detalye.

## Exponential Backoff

Ang mga API call ay gumagamit ng exponential backoff na may jitter sa mga 429 (rate limit) at 5xx (server error) na response. Ang tatlong retry na may pataas na delay ay pumipigil sa pag-hammer sa API kapag may mga outage.

## Request Timeout

Bawat API request ay may 30-second timeout via `AbortController`. Pinipigilan nito ang sync process na mag-hang indefinitely sa isang dead connection.

## Fallback Mode

Kapag unavailable ang API, nagsusulat ang `--fallback` ng mga `[EN]`-prefixed placeholder sa halip na mga totoong translation:

```bash
npx i18n-rosetta sync --fallback
```

```json
{
  "hero.title": "[EN] Welcome to our platform"
}
```

Ang mga placeholder na ito ay awtomatikong nade-detect at nire-retranslate sa susunod na sync gamit ang isang valid na API key. Hindi kailanman ituturing ang mga ito bilang "translated" — ifa-flag sila ng `audit`.

## Testing

Ang mga security property ay vine-verify ng adversarial test suite:

```bash
npm run test:redteam    # prototype pollution, path traversal, encoding attacks
```

---

## See Also

- [Architecture](/docs/concepts/architecture) — kung paano nagko-connect ang three-piece ecosystem
- [CLI Reference — integrity](/docs/reference/cli#integrity) — command para sa integrity checking
- [CLI Reference — provenance](/docs/reference/cli#provenance) — command para sa provenance auditing
- [Plugin Specification](/docs/reference/plugin-spec) — mga provenance field sa mga plugin manifest
- [Quality Gate](/docs/concepts/quality-gate) — mga translation-level safety check