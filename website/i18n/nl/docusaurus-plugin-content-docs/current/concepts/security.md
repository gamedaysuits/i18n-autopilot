---
sidebar_position: 4
title: "Beveiliging"
---
# Beveiliging & Veiligheid

Rosetta is ontworpen om veilig te zijn in vijandige omgevingen — waar lokale gegevens afkomstig kunnen zijn van onbetrouwbare bronnen, waar gemanipuleerde bestandsnamen buiten de mapgrenzen zouden kunnen treden, en waar de uitvoer van een LLM van alles kan bevatten.

## Dreigingsmodel

| Dreiging | Aanvalsvector | Mitigatie |
|--------|--------------|-----------|
| **Prototype pollution** | Gemanipuleerde JSON-sleutels (`__proto__`, `constructor`) | Geweigerd tijdens het parseren |
| **Path traversal** | Landcodes zoals `../../etc/passwd` | Bestandsbewerkingen gevalideerd naar geconfigureerde mappen |
| **Code block corruption** | LLM vertaalt binnen code fences | Unicode sentinel-afscherming |
| **Gehallucineerde sleutels** | LLM retourneert sleutels die niet zijn verzonden | Responsvalidatie — alleen geaccepteerde sleutels worden weggeschreven |
| **Ongecontroleerde tokenuitgaven** | Oneindige retry-loops | Budgetlimiet via `maxRetries` |

## Prototype Pollution-beveiliging

Alle lokale sleutels worden gevalideerd tegen een blokkeerlijst voordat ze worden verwerkt:

- `__proto__`
- `constructor`
- `prototype`

Elke sleutel die overeenkomt met deze patronen wordt met een foutmelding geweigerd. Dit voorkomt dat aanvallers gemanipuleerde lokale bestanden gebruiken om JavaScript-objectprototypes te wijzigen.

## Padbeveiliging

Bij het wegschrijven van lokale bestanden valideert rosetta dat het uitvoerpad binnen de geconfigureerde mappen blijft (`localesDir`, `contentDir`). Landcodes worden opgeschoond — een code zoals `../../secrets` kan niet buiten de verwachte map schrijven.

## Blokbeveiliging

Tijdens de vertaling van Markdown-inhoud worden gestructureerde elementen vervangen door Unicode sentinel-placeholders voordat de tekst naar de LLM wordt verzonden:

1. **Code blocks** (fenced en inline) → sentinel
2. **Hugo shortcodes** (`{{< >}}`, `{{% %}}`) → sentinel  
3. **Raw HTML** → sentinel
4. **Interpolatievariabelen** (`{{ .Count }}`) → sentinel

Na de vertaling worden de sentinels vervangen door de originele inhoud. De LLM ziet nooit code blocks, shortcodes of HTML — en kan deze dus niet beschadigen.

## Responsvalidatie

Wanneer de LLM een JSON-respons retourneert, valideert rosetta dat:
- Alleen sleutels die in de batch zijn verzonden, in de respons voorkomen
- Er geen extra sleutels zijn geïnjecteerd
- De respons als geldige JSON kan worden geparseerd

Gehallucineerde sleutels worden stilzwijgend genegeerd. Dit voorkomt dat LLM-uitvoer onverwachte vertalingen in uw lokale bestanden injecteert.

## Quality Gate

Elke vertaling wordt gevalideerd door middel van vijf deterministische controles voordat deze naar de schijf wordt weggeschreven. Zie [Quality Gate](/docs/concepts/quality-gate) voor meer informatie.

## Exponential Backoff

API-aanroepen gebruiken exponential backoff met jitter bij 429 (rate limit) en 5xx (serverfout) responsen. Drie nieuwe pogingen (retries) met toenemende vertraging voorkomen dat de API wordt overbelast tijdens storingen.

## Verzoek-timeout

Elk API-verzoek heeft een time-out van 30 seconden via `AbortController`. Dit voorkomt dat het synchronisatieproces voor onbepaalde tijd blijft hangen bij een verbroken verbinding.

## Fallback-modus

Wanneer de API niet beschikbaar is, schrijft `--fallback` placeholders met het voorvoegsel `[EN]` in plaats van echte vertalingen:

```bash
npx i18n-rosetta sync --fallback
```

```json
{
  "hero.title": "[EN] Welcome to our platform"
}
```

Deze placeholders worden automatisch gedetecteerd en opnieuw vertaald bij de volgende synchronisatie met een geldige API-sleutel. Ze worden nooit als "vertaald" beschouwd — `audit` zal ze markeren.

## Testen

Beveiligingseigenschappen worden geverifieerd door de adversarial test suite:

```bash
npm run test:redteam    # prototype pollution, path traversal, encoding attacks
```

---

## Zie ook

- [Architectuur](/docs/concepts/architecture) — hoe het driedelige ecosysteem met elkaar verbonden is
- [CLI-referentie — integrity](/docs/reference/cli#integrity) — commando voor integriteitscontrole
- [CLI-referentie — provenance](/docs/reference/cli#provenance) — commando voor provenance-auditing
- [Plugin-specificatie](/docs/reference/plugin-spec) — provenance-velden in plugin-manifesten
- [Quality Gate](/docs/concepts/quality-gate) — veiligheidscontroles op vertalingsniveau