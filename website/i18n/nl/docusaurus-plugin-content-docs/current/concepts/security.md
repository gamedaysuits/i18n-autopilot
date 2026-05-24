---
sidebar_position: 4
title: "Beveiliging"
---
# Beveiliging & Veiligheid

Rosetta is ontworpen om veilig te zijn in vijandige omgevingen — waar locale-gegevens afkomstig kunnen zijn van onbetrouwbare bronnen, waar gemanipuleerde bestandsnamen buiten de mapgrenzen kunnen treden, en waar LLM-uitvoer van alles kan bevatten.

## Dreigingsmodel

| Dreiging | Aanvalsvector | Mitigatie |
|--------|--------------|-----------|
| **Prototype pollution** | Gemanipuleerde JSON-sleutels (`__proto__`, `constructor`) | Geweigerd tijdens het parseren |
| **Path traversal** | Locale-codes zoals `../../etc/passwd` | Bestandsschrijfacties gevalideerd naar geconfigureerde mappen |
| **Code block corruption** | LLM vertaalt binnen code fences | Unicode sentinel-afscherming |
| **Hallucinated keys** | LLM retourneert sleutels die niet zijn verzonden | Responsvalidatie — alleen geaccepteerde sleutels worden weggeschreven |
| **Runaway token spend** | Oneindige retry-loops | Budgetlimiet via `maxRetries` |

## Prototype Pollution-beveiliging

Alle locale-sleutels worden voor verwerking gevalideerd tegen een blokkeerlijst:

- `__proto__`
- `constructor`
- `prototype`

Elke sleutel die overeenkomt met deze patronen wordt met een foutmelding geweigerd. Dit voorkomt dat aanvallers gemanipuleerde locale-bestanden gebruiken om JavaScript-objectprototypes te wijzigen.

## Path Containment

Bij het wegschrijven van locale-bestanden valideert rosetta dat het uitvoerpad binnen de geconfigureerde mappen blijft (`localesDir`, `contentDir`). Locale-codes worden opgeschoond — een code zoals `../../secrets` kan niet buiten de verwachte map schrijven.

## Blokbeveiliging

Tijdens de vertaling van Markdown-content worden gestructureerde elementen vervangen door Unicode sentinel-placeholders voordat de tekst naar de LLM wordt verzonden:

1. **Code blocks** (fenced en inline) → sentinel
2. **Hugo shortcodes** (`{{< >}}`, `{{% %}}`) → sentinel  
3. **Raw HTML** → sentinel
4. **Interpolation variables** (`{{ .Count }}`) → sentinel

Na de vertaling worden sentinels vervangen door de originele content. De LLM ziet nooit code blocks, shortcodes of HTML — deze kunnen dus niet worden gecorrumpeerd.

## Responsvalidatie

Wanneer de LLM een JSON-respons retourneert, valideert rosetta dat:
- Alleen sleutels die in de batch zijn verzonden, in de respons verschijnen
- Er geen extra sleutels worden geïnjecteerd
- De respons als geldige JSON wordt geparseerd

Gehallucineerde sleutels worden stilzwijgend genegeerd. Dit voorkomt dat LLM-uitvoer onverwachte vertalingen in uw locale-bestanden injecteert.

## Quality Gate

Elke vertaling wordt via vijf deterministische controles gevalideerd voordat deze naar de schijf wordt weggeschreven. Zie [Quality Gate](/docs/concepts/quality-gate) voor meer informatie.

## Exponential Backoff

API-aanroepen gebruiken exponential backoff met jitter bij 429 (rate limit) en 5xx (serverfout) responsen. Drie retries met toenemende vertraging voorkomen overbelasting van de API tijdens storingen.

## Request Timeout

Elke API-aanvraag heeft een time-out van 30 seconden via `AbortController`. Dit voorkomt dat het synchronisatieproces voor onbepaalde tijd blijft hangen bij een verbroken verbinding.

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

- [Architecture](/docs/concepts/architecture) — hoe het driedelige ecosysteem met elkaar verbonden is
- [CLI Reference — integrity](/docs/reference/cli#integrity) — commando voor integriteitscontrole
- [CLI Reference — provenance](/docs/reference/cli#provenance) — commando voor provenance-auditing
- [Plugin Specification](/docs/reference/plugin-spec) — provenance-velden in plugin-manifests
- [Quality Gate](/docs/concepts/quality-gate) — veiligheidscontroles op vertalingsniveau