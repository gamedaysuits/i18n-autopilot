---
sidebar_position: 4
title: "Beveiliging"
---
# Beveiliging & Veiligheid

Rosetta is ontworpen om veilig te zijn in vijandige omgevingen — waar lokale gegevens afkomstig kunnen zijn van onbetrouwbare bronnen, waar gemanipuleerde bestandsnamen buiten de mapgrenzen kunnen treden en waar de uitvoer van een LLM van alles kan bevatten.

## Dreigingsmodel

| Dreiging | Aanvalsvector | Mitigatie |
|--------|--------------|-----------|
| **Prototype pollution** | Gemanipuleerde JSON-sleutels (`__proto__`, `constructor`) | Geweigerd tijdens het parsen |
| **Path traversal** | Landcodes zoals `../../etc/passwd` | Bestandsbewerkingen gevalideerd naar geconfigureerde mappen |
| **Code block corruption** | LLM vertaalt binnen codeblokken | Afscherming via Unicode-sentinels |
| **Gehallucineerde sleutels** | LLM retourneert sleutels die niet zijn verzonden | Responsvalidatie — alleen geaccepteerde sleutels worden weggeschreven |
| **Ongecontroleerde tokenuitgaven** | Oneindige herhalingslussen | Budgetlimiet via `maxRetries` |

## Bescherming tegen Prototype Pollution

Alle lokale sleutels worden vóór verwerking gevalideerd aan de hand van een blokkeerlijst:

- `__proto__`
- `constructor`
- `prototype`

Elke sleutel die overeenkomt met deze patronen wordt met een foutmelding geweigerd. Dit voorkomt dat aanvallers gemanipuleerde lokale bestanden gebruiken om JavaScript-objectprototypes te wijzigen.

## Pad-isolatie

Bij het wegschrijven van lokale bestanden valideert rosetta of het uitvoerpad binnen de geconfigureerde mappen blijft (`localesDir`, `contentDir`). Landcodes worden opgeschoond — een code zoals `../../secrets` kan niet buiten de verwachte map schrijven.

## Blokbeveiliging

Tijdens de vertaling van Markdown-content worden gestructureerde elementen vervangen door Unicode-sentinel tijdelijke aanduidingen voordat de tekst naar de LLM wordt verzonden:

1. **Codeblokken** (omkaderd en inline) → sentinel
2. **Hugo shortcodes** (`{{< >}}`, `{{% %}}`) → sentinel  
3. **Ruwe HTML** → sentinel
4. **Interpolatievariabelen** (`{{ .Count }}`) → sentinel

Na de vertaling worden de sentinels vervangen door de originele content. De LLM ziet nooit codeblokken, shortcodes of HTML — en kan deze dus niet beschadigen.

## Responsvalidatie

Wanneer de LLM een JSON-respons retourneert, valideert rosetta dat:
- Alleen sleutels die in de batch zijn verzonden, in de respons voorkomen
- Er geen extra sleutels worden geïnjecteerd
- De respons als geldige JSON kan worden geparset

Gehallucineerde sleutels worden stilzwijgend genegeerd. Dit voorkomt dat de LLM-uitvoer onverwachte vertalingen in uw lokale bestanden injecteert.

## Quality Gate

Elke vertaling wordt gevalideerd via vijf deterministische controles voordat deze naar de schijf wordt weggeschreven. Zie [Quality Gate](/docs/concepts/quality-gate) voor meer informatie.

## Exponentiële back-off

API-aanroepen maken gebruik van exponentiële back-off met jitter bij 429- (snelheidslimiet) en 5xx- (serverfout) responsen. Drie herhaalpogingen met een toenemende vertraging voorkomen dat de API tijdens storingen wordt overbelast.

## Verzoek-timeout

Elk API-verzoek heeft een time-out van 30 seconden via `AbortController`. Dit voorkomt dat het synchronisatieproces voor onbepaalde tijd blijft hangen op een dode verbinding.

## Fail-Loud vertaalfouten

Wanneer de API niet beschikbaar is of een vertaling mislukt, genereert rosetta een duidelijke foutmelding met bruikbare instructies in plaats van stilzwijgend onzin weg te schrijven. Er worden tijdens de synchronisatie nooit tijdelijke aanduidingen met het voorvoegsel `[EN]` weggeschreven.

```
[ERR] Content sync for fr: no API key available.
  Set OPENROUTER_API_KEY in .env.local to translate content.
```

De fout in één bestand stopt niet de gehele synchronisatie — de fout wordt gelogd en de pijplijn gaat verder met het volgende bestand, zodat u maximale voortgang per uitvoering behaalt.

## Post-Sync verificatie

Nadat alle vertalingen zijn voltooid, leest rosetta de weggeschreven lokale bestanden opnieuw van de schijf en voert een verificatieronde uit. Dit ondervangt de kloof tussen een synchronisatie die als succesvol wordt gerapporteerd en vertalingen die in werkelijkheid onjuist zijn:

- **Sleutelpariteit** — alle bronsleutels zijn aanwezig in elk doelbestand
- **`[EN]` markeringen** — verouderde fallback-markeringen van eerdere uitvoeringen
- **Lege vertalingen** — blanco waarden die erdoorheen zijn geglipt
- **Scriptnaleving** — niet-Latijnse landinstellingen met uitsluitend ASCII-vertalingen
- **Behoud van tijdelijke aanduidingen** — ICU-placeholders komen overeen met de bron

Sla over met `--no-verify` of voer zelfstandig uit met `npx i18n-rosetta verify`.

## Testen

Beveiligingseigenschappen worden geverifieerd door de adversarial testsuite:

```bash
npm run test:redteam    # prototype pollution, path traversal, encoding attacks
```

---

## Zie ook

- [Architectuur](/docs/concepts/architecture) — hoe het driedelige ecosysteem met elkaar in verbinding staat
- [CLI-referentie — integrity](/docs/reference/cli#integrity) — commando voor integriteitscontrole
- [CLI-referentie — provenance](/docs/reference/cli#provenance) — commando voor herkomstcontrole
- [Plugin-specificatie](/docs/reference/plugin-spec) — herkomstvelden in plugin-manifesten
- [Quality Gate](/docs/concepts/quality-gate) — veiligheidscontroles op vertaalniveau