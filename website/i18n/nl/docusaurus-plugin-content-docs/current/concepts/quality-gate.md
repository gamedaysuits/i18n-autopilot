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

### Leeg/Blanco

Weigert vertalingen die lege strings, uitsluitend witruimte of `null` zijn. Dit vangt modellen op die niets retourneren voor moeilijke keys.

### Bron-echo

Detecteert wanneer het model de Engelse brontekst retourneert in plaats van deze te vertalen. Komt vaak voor bij korte strings en onvoldoende gespecificeerde prompts.

### Hallucinatie-loop

Analyseert trigrampatronen (3 tekens) in de uitvoer. Als een trigram zich vaker herhaalt dan een drempelwaarde in verhouding tot de lengte van de uitvoer, wordt de vertaling geweigerd. Dit vangt gedegenereerde uitvoer op zoals `"Qo' Qo' Qo' Qo' Qo'"`.

### Lengte-inflatie

Weigert vertalingen waarbij de lengte van de uitvoer `maxLengthRatio × source length` overschrijdt (standaard: 4×). Dit vangt modelhallucinaties op die enorme lappen tekst produceren voor een korte invoer.

Configureerbaar via `maxLengthRatio` in uw configuratie.

### Script-naleving

Voor locales met een geconfigureerd `script`-veld (bijv. `"script": "cans"` voor Plains Cree Syllabics), wordt gevalideerd of de uitvoer niet-ASCII-tekens bevat die geschikt zijn voor het doelscript. Uitvoer met uitsluitend Latijnse tekens voor een Arabische, CJK- of Syllabics-locale wordt geweigerd.

## Wat er gebeurt bij een fout

1. De falende vertaling wordt gelogd naar stderr met een `[GATE]`-voorvoegsel, de naam van de key, de reden en een voorbeeld van de waarde
2. De key wordt **niet** naar het locale-bestand geschreven
3. De retry cascade treedt in werking (zie hieronder)

```
[GATE] hero.title: source-echo — "Welcome to our platform"
[GATE] nav.about: hallucination — "À À À À À À À À"
```

## Retry Cascade

Wanneer een batch faalt (JSON-parsefout of Quality Gate-weigeringen), probeert rosetta het opnieuw met steeds kleinere batches:

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the 2 problem keys
```

Het retry-budget is gemaximeerd op `maxRetries` (standaard: 3, configureerbaar per taal). Dit voorkomt ongecontroleerde tokenuitgaven aan keys die consequent falen.

Na het uitputten van de retries worden de probleem-keys gelogd en overgeslagen. Ze zullen opnieuw worden geprobeerd bij de volgende `sync`-run.

## Prompt Caching

Het systeembericht (register, grammaticaregels, stijlopmerkingen) wordt gescheiden van het gebruikersbericht (de te vertalen keys). Deze scheiding is opzettelijk:

- Het systeembericht is **identiek over batches heen** voor een bepaalde locale
- Providers zoals Anthropic en Google cachen herhaalde systeemberichten
- Resultaat: de eerste batch betaalt de volledige tokenkosten, daaropvolgende batches betalen alleen voor het gebruikersbericht

Dit kan de tokenkosten aanzienlijk verlagen voor projecten met veel batches.