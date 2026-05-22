---
sidebar_position: 3
title: "Quality Gate"
---
# Quality Gate

Ang bawat pagsasalin ay dumadaan sa isang deterministic validation gate bago ito isulat sa disk. Sinasalo ng quality gate ang mga karaniwang failure mode ng machine translation — walang mga tahimik na fallback, walang basurang isusulat sa iyong mga locale file.

## Mga Validation Check

| Check | Ano ang Sinasalo Nito | Gate Label |
|-------|----------------|-----------|
| **Empty/blank** | Nagbalik ang model ng empty string o whitespace | `[GATE] empty` |
| **Source echo** | Nagbalik ang model ng orihinal na English input | `[GATE] source-echo` |
| **Hallucination loop** | Mga naulit na trigram pattern (hal., `"Qo' Qo' Qo'"`) | `[GATE] hallucination` |
| **Length inflation** | Ang output ay mas mahaba nang malaki kaysa sa source | `[GATE] length` |
| **Script compliance** | Maling script para sa target na locale | `[GATE] script` |

### Empty/Blank

Nire-reject ang mga pagsasalin na empty string, whitespace lamang, o `null`. Sinasalo nito ang mga model na walang ibinabalik para sa mga mahihirap na key.

### Source Echo

Nade-detect kung kailan ibinabalik ng model ang English source text sa halip na isalin ito. Karaniwan ito sa mga maiikling string at mga under-specified na prompt.

### Hallucination Loop

Sinusuri ang mga trigram (3-character) pattern sa output. Kung ang anumang trigram ay maulit nang higit sa isang threshold na bilang ng beses kaugnay ng haba ng output, ire-reject ang pagsasalin. Sinasalo nito ang mga degenerate na output tulad ng `"Qo' Qo' Qo' Qo' Qo'"`.

### Length Inflation

Nire-reject ang mga pagsasalin kung saan ang haba ng output ay lumampas sa `maxLengthRatio × source length` (default: 4×). Sinasalo nito ang mga model hallucination na gumagawa ng napakahabang teksto para sa isang maikling input.

Maaaring i-configure sa pamamagitan ng `maxLengthRatio` sa iyong config.

### Script Compliance

Para sa mga locale na may naka-configure na `script` field (hal., `"script": "cans"` para sa Plains Cree Syllabics), bina-validate na ang output ay naglalaman ng mga non-ASCII na character na angkop para sa target na script. Ang Latin-only na output para sa isang Arabic, CJK, o Syllabics na locale ay ire-reject.

## Ano ang Mangyayari Kapag Nag-fail

1. Ang nag-fail na pagsasalin ay ila-log sa stderr na may `[GATE]` prefix, ang pangalan ng key, ang dahilan, at isang preview ng value
2. Ang key ay **hindi** isusulat sa locale file
3. Magsisimula ang retry cascade (tingnan sa ibaba)

```
[GATE] hero.title: source-echo — "Welcome to our platform"
[GATE] nav.about: hallucination — "À À À À À À À À"
```

## Retry Cascade

Kapag nag-fail ang isang batch (JSON parse error o mga quality gate rejection), magre-retry ang rosetta gamit ang mga unti-unting lumiliit na batch:

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the 2 problem keys
```

Ang retry budget ay nililimitahan ng `maxRetries` (default: 3, maaaring i-configure bawat wika). Pinipigilan nito ang labis na paggastos ng token sa mga key na patuloy na nagfe-fail.

Matapos maubos ang mga retry, ang mga problemang key ay ila-log at lalampasan. Ire-retry ang mga ito sa susunod na pagtakbo ng `sync`.

## Prompt Caching

Ang system message (register, mga panuntunan sa grammar, mga style note) ay hinihiwalay mula sa user message (ang mga key na isasalin). Sinasadya ang paghihiwalay na ito:

- Ang system message ay **magkapareho sa lahat ng batch** para sa isang partikular na locale
- Kina-cache ng mga provider tulad ng Anthropic at Google ang mga inuulit na system message
- Resulta: ang unang batch ay magbabayad ng buong halaga ng token, ang mga susunod na batch ay magbabayad lamang para sa user message

Maaari nitong mapababa nang malaki ang mga gastos sa token para sa mga project na may maraming batch.