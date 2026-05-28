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
| **Path traversal** | Mga locale codes tulad ng `../../etc/passwd` | Ang mga file writes ay vina-validate sa mga configured directories |
| **Code block corruption** | Nagta-translate ang LLM sa loob ng code fences | Unicode sentinel shielding |
| **Hallucinated keys** | Nagre-return ang LLM ng keys na hindi naman na-send | Response validation — tanging mga accepted keys lang ang isinusulat |
| **Runaway token spend** | Infinite retry loops | Naka-budget-cap via `maxRetries` |

## Prototype Pollution Guard

Lahat ng locale keys ay vina-validate laban sa isang blocklist bago i-process:

- `__proto__`
- `constructor`
- `prototype`

Anumang key na nagma-match sa mga patterns na ito ay nire-reject at nagbibigay ng error. Pinipigilan nito ang mga attackers na gumamit ng mga crafted locale files para i-modify ang mga JavaScript object prototypes.

## Path Containment

Kapag nagsusulat ng locale files, vina-validate ng rosetta na ang output path ay nananatili sa loob ng mga configured directories (`localesDir`, `contentDir`). Sinasanitize ang mga locale codes — ang isang code tulad ng `../../secrets` ay hindi makakapagsulat sa labas ng expected directory.

## Block Protection

Habang nagta-translate ng Markdown content, ang mga structured elements ay pinapalitan ng mga Unicode sentinel placeholders bago i-send ang text sa LLM:

1. **Code blocks** (fenced at inline) → sentinel
2. **Hugo shortcodes** (`{{< >}}`, `{{% %}}`) → sentinel  
3. **Raw HTML** → sentinel
4. **Interpolation variables** (`{{ .Count }}`) → sentinel

Pagkatapos ng translation, ibinabalik ang original content sa mga sentinels. Hindi kailanman nakikita ng LLM ang mga code blocks, shortcodes, o HTML — kaya hindi nito mako-corrupt ang mga ito.

## Response Validation

Kapag nag-return ang LLM ng JSON response, vina-validate ng rosetta na:
- Tanging ang mga keys lang na na-send sa batch ang lalabas sa response
- Walang extra keys na nai-inject
- Naka-parse ang response bilang valid JSON

Ang mga hallucinated keys ay tahimik na dina-drop. Pinipigilan nito ang LLM output na mag-inject ng mga unexpected translations sa inyong mga locale files.

## Quality Gate

Bawat translation ay vina-validate gamit ang limang deterministic checks bago ito isulat sa disk. Tingnan po ang [Quality Gate](/docs/concepts/quality-gate) para sa mga detalye.

## Exponential Backoff

Gumagamit ang mga API calls ng exponential backoff na may jitter sa mga 429 (rate limit) at 5xx (server error) na responses. Ang tatlong retries na may increasing delay ay pumipigil sa pag-hammer sa API kapag may mga outages.

## Request Timeout

Bawat API request ay may 30-second timeout via `AbortController`. Pinipigilan nito ang sync process na mag-hang nang walang katapusan sa isang dead connection.

## Fail-Loud Translation Failures

Kapag unavailable ang API o nag-fail ang translation, nag-tthrow ang rosetta ng loud error na may actionable guidance sa halip na tahimik na magsulat ng garbage data. Walang `[EN]`-prefixed placeholders ang isinusulat during sync.

```
[ERR] Content sync for fr: no API key available.
  Set OPENROUTER_API_KEY in .env.local to translate content.
```

Hindi pinipigilan ng failure ng isang file ang buong sync — nalo-log ang error at nagpapatuloy ang pipeline sa susunod na file, kaya makukuha niyo po ang maximum progress per run.

## Post-Sync Verification

Pagkatapos makumpleto ng lahat ng translations, muling binabasa ng rosetta ang mga isinulat na locale files mula sa disk at nagra-run ng verification pass. Sinasalo nito ang gap sa pagitan ng pag-report ng success ng sync at ng mga translations na mali pala in reality:

- **Key parity** — lahat ng source keys ay present sa bawat target
- **`[EN]` markers** — mga legacy fallback markers mula sa mga nakaraang runs
- **Empty translations** — mga blank values na nakalusot
- **Script compliance** — mga non-Latin locales na may ASCII-only translations
- **Placeholder preservation** — nagma-match ang mga ICU placeholders sa source

I-skip ito gamit ang `--no-verify` o i-run nang standalone gamit ang `npx i18n-rosetta verify`.

## Testing

Ang mga security properties ay vina-validate ng adversarial test suite:

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