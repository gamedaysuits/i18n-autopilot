---
sidebar_position: 3
title: "Quality Gate"
---
# Quality Gate

Elke vertaling gaat door een deterministische validatiepoort voordat deze naar de schijf wordt geschreven. De Quality Gate vangt veelvoorkomende faalmodi van automatische vertalingen op — geen stille fallbacks, geen rommel die naar uw locale-bestanden wordt geschreven.

## Validatiecontroles

| Controle | Wat het opvangt | Gate Label |
|-------|----------------|-----------|
| **Leeg/blanco** | Model retourneerde een lege string of witruimte | `[GATE] empty` |
| **Bron-echo** | Model retourneerde de originele Engelse invoer | `[GATE] source-echo` |
| **Hallucinatie-loop** | Herhaalde trigrampatronen (bijv. `"Qo' Qo' Qo'"`) | `[GATE] hallucination` |
| **Lengte-inflatie** | Uitvoer is aanzienlijk langer dan de bron | `[GATE] length` |
| **Script-naleving** | Verkeerd script voor de doellocale | `[GATE] script` |
| **ICU-meervoudscategorieën** | Ontbrekende vereiste meervoudsvormen voor de locale | `[GATE] icu-plural` |

### Leeg/Blanco

Weigert vertalingen die lege strings, uitsluitend witruimte of `null` zijn. Dit vangt modellen op die niets retourneren voor moeilijke keys.

### Bron-echo

Detecteert wanneer het model de Engelse brontekst retourneert in plaats van deze te vertalen. Komt vaak voor bij korte strings en onvoldoende gespecificeerde prompts.

### Hallucinatie-loop

Analyseert trigrampatronen (3 tekens) in de uitvoer. Als een trigram zich vaker herhaalt dan een drempelwaarde ten opzichte van de uitvoerlengte, wordt de vertaling geweigerd. Dit vangt gedegenereerde uitvoer op zoals `"Qo' Qo' Qo' Qo' Qo'"`.

### Lengte-inflatie

Weigert vertalingen waarbij de uitvoerlengte `maxLengthRatio × source length` overschrijdt (standaard: 4×). Dit vangt modelhallucinaties op die lappen tekst produceren voor een korte invoer.

Configureerbaar via `maxLengthRatio` in uw configuratie.

### Script-naleving

Voor locales met een geconfigureerd `script`-veld (bijv. `"script": "cans"` voor Plains Cree Syllabics), wordt gevalideerd dat de uitvoer niet-ASCII-tekens bevat die geschikt zijn voor het doelscript. Uitsluitend Latijnse uitvoer voor een Arabische, CJK- of Syllabics-locale wordt geweigerd.

## Wat er gebeurt bij een fout

1. De falende vertaling wordt gelogd naar stderr met een `[GATE]`-voorvoegsel, de key-naam, de reden en een voorbeeld van de waarde
2. De key wordt **niet** naar het locale-bestand geschreven
3. De retry cascade treedt in werking (zie hieronder)

```
[GATE] hero.title: source-echo — "Welcome to our platform"
[GATE] nav.about: hallucination — "À À À À À À À À"
```

## Retry Cascade

Wanneer een batch faalt (JSON-parsefout of Quality Gate-weigeringen), probeert rosetta het opnieuw met steeds kleinere batches:

```
Full batch (80 keys) → parse error
  └→ Half batch (40 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the 2 problem keys
```

Het retry-budget wordt begrensd door `maxRetries` (standaard: 3, configureerbaar per taal). Dit voorkomt ongecontroleerde token-uitgaven aan keys die consequent falen.

Na het uitputten van de retries worden de probleem-keys gelogd en overgeslagen. Ze worden opnieuw geprobeerd bij de volgende `sync`-run.

## Prompt Caching

Het systeembericht (register, grammaticaregels, stijlopmerkingen) wordt gescheiden van het gebruikersbericht (de te vertalen keys). Deze scheiding is opzettelijk:

- Het systeembericht is **identiek over batches heen** voor een bepaalde locale
- Providers zoals Anthropic en Google cachen herhaalde systeemberichten
- Resultaat: de eerste batch betaalt de volledige token-kosten, daaropvolgende batches betalen alleen voor het gebruikersbericht

Dit kan de token-kosten aanzienlijk verlagen voor projecten met veel batches.

## ICU MessageFormat-validatie

Het `integrity`-commando valideert ICU MessageFormat-meervoudspatronen tegen CLDR-meervoudsregels. Als uw bronbestand ICU-syntaxis gebruikt zoals:

```json
"items": "{count, plural, one {# item} other {# items}}"
```

Rosetta verifieert dat vertaalde versies alle vereiste meervoudscategorieën voor de doellocale bevatten. Arabisch vereist bijvoorbeeld zes categorieën (`zero`, `one`, `two`, `few`, `many`, `other`) — niet alleen `one` en `other`.

Voer `i18n-rosetta integrity` uit om de volledigheid van meervouden in alle locales te controleren.

## Handhaving van terminologie

Voor gecoachte paren met een woordenboek voert rosetta een terminologiecontrole uit na de vertaling. Nadat de Quality Gate is gepasseerd, wordt geverifieerd of de LLM daadwerkelijk de vereiste woordenboektermen heeft gebruikt.

```
[TERM] en→fr: 2 term violation(s)
  • hero.title: "dashboard" → expected "tableau de bord" but got "panneau de contrôle"
```

Terminologie-overtredingen zijn **waarschuwingen, geen blokkerende fouten**. De vertaling wordt nog steeds naar de schijf geschreven. Dit is opzettelijk — de LLM kan geldige redenen hebben om een alternatief te kiezen (context, grammatica), en blokkeren op term-mismatches zou meer kwaad dan goed doen.

Om overtredingen op te lossen, werkt u het coaching-woordenboek bij of bewerkt u het locale-bestand handmatig.

---

## Zie ook

- [Hoe Sync werkt](/docs/concepts/how-sync-works) — waar de Quality Gate in de pijplijn past
- [Vertaalmethoden](/docs/guides/translation-methods) — methoden die de poort voeden
- [Script Converters](/docs/concepts/script-converters) — scriptconversie na de poort
- [Coaching Data](/docs/concepts/coaching-data) — verbeteren van vertaalkwaliteit stroomopwaarts
- [Translation Memory](/docs/concepts/translation-memory) — cachen van gevalideerde vertalingen
- [CLI-referentie — sync](/docs/reference/cli#sync) — sync-flags inclusief retry-gedrag
- [CLI-referentie — integrity](/docs/reference/cli#integrity) — ICU-meervoudsauditing