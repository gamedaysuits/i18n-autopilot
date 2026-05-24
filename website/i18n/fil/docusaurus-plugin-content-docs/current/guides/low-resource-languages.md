---
sidebar_position: 5
title: "Suportahan ang isang Low-Resource Language"
---
# Suportahan ang isang Low-Resource Language

:::info Status: Kasalukuyang Dine-develop
Ang support para sa Plains Cree (nêhiyawêwin) ay kasalukuyang dine-develop. Ang mga tools, evaluation harness, at leaderboard na inilalarawan dito ay totoo at magagamit na ngayon, pero ang Cree translation pipeline ay hindi pa nare-release. Kapag na-release na ito, magsisilbi itong blueprint para sa iba pang mga polysynthetic at low-resource languages na may FST infrastructure.
:::

## Ang Hindi Pa Nareresolbang Problema

Ang Google Translate ay nagsu-support ng ~130 languages. Mayroong higit sa 7,000 na sinasalita sa buong mundo. Para sa libu-libong languages — kabilang ang maraming Indigenous languages na may active speaker communities — walang commercial translation API na nag-e-exist, walang malaking parallel corpus na nabuo, at walang pretrained model na nagpo-produce ng reliable na output.

Hindi ito isang gap na magsasara nang kusa. Ang mga low-resource languages ay low-resource *dahil* hindi sila abot ng economics ng commercial MT. Ang mga speakers na pinakanangangailangan ng mga tools na ito ay ang mismong mga communities na may pinakamababang tsansa na igawa sila nito.

**Binuo ang rosetta para baguhin iyon.**

Ang [Method Leaderboard](/leaderboard) ay isang open challenge: i-build ang pinakamagandang translation method para sa isang underserved language, patunayan ito gamit ang reproducible evaluation, at kunin ang top score. Kahit sino sa mundo ay pwedeng mag-contribute — linguists, ML researchers, community language workers, students, o hobbyists. Ang problema ay hindi pa nareresolba. Nandito na ang infrastructure. Naghihintay na ang leaderboard.

---

## Bakit Ito Mahirap: Polysynthetic Morphology

Karamihan sa mga commercial MT systems ay na-design para sa mga languages tulad ng English, French, at Chinese — mga languages kung saan medyo maiikli ang mga salita at ang mga sentences ay binubuo mula sa discrete tokens. Pero maraming Indigenous languages, kabilang ang Plains Cree, ay **polysynthetic**: ang isang salita ay kayang i-encode ang katumbas ng isang buong sentence sa English.

### Ang halimbawa sa Cree

Tingnan ang Plains Cree word na ito:

> **ê-kî-nitawi-kîskinwahamâkosiyân**
> *"when I went to school"*

**Isang salita** lang 'yan. Naka-encode dito ang tense (past), direction (going to), ang root (learn), voice (passive/reflexive), at person (first singular). Ang isang LLM na na-train predominantly sa English ay walang intuition para sa ganitong klase ng morphological density.

Nadadagdagan pa ang mga challenges:

| Challenge | Ano ang Ibig Sabihin Nito |
|-----------|--------------|
| **Morphological complexity** | Ang isang verb root ay pwedeng mag-generate ng libu-libong valid inflected forms sa pamamagitan ng prefixation, suffixation, at circumfixation |
| **Animate/inanimate distinction** | Ang mga nouns ay grammatically animate o inanimate — nakakaapekto ito sa verb conjugation, demonstratives, at pluralization. Ang classification ay hindi palaging sumusunod sa biological animacy (ang *askiy* "earth" ay animate; ang *maskisin* "shoe" ay animate din) |
| **Obviation** | Ang mga third-person references ay naka-rank base sa proximity/salience. Ang "proximate" at "obviative" distinction ay walang katumbas sa English |
| **Sparse training data** | Napakakaunti pa lang ng Plains Cree text na nakita ng mga LLMs. Ang mga nakita nila ay maaaring may halong dialects (Y-dialect, TH-dialect) o orthographies (SRO vs. syllabics) |
| **No commercial baseline** | Walang useful na binabalik ang Google Translate. Walang off-the-shelf API na pwedeng pagkumparahan |

Ito ang dahilan kung bakit ang translation ng mga polysynthetic languages ay nananatiling isang **open research problem** — at kung bakit mahalaga ang isang scored at reproducible na leaderboard.

---

## Prior Art: Paano Ito In-approach ng mga Tao

### Ang ALTLab FST

Ang pinaka-significant na computational resource para sa Plains Cree ay ang **finite-state transducer (FST)** na dinevelop ng [Alberta Language Technology Lab (ALTLab)](https://altlab.artsrn.ualberta.ca/) sa University of Alberta, in collaboration sa [Giellatekno](https://giellatekno.uit.no/) sa UiT The Arctic University of Norway.

Ang ALTLab FST ay isang **morphological analyzer at generator**: kapag binigyan ng isang inflected Cree word, kaya nitong i-decompose ito sa kanyang root at grammatical tags, at kapag binigyan ng root plus tags, kaya nitong mag-generate ng tamang inflected form. Deterministic ito — walang neural network, walang hallucination, walang probability. Kung i-accept ng FST ang isang salita, ang salitang iyon ay morphologically valid.

Ito ang dahilan kung bakit tina-track ng rosetta leaderboard ang **FST Acceptance Rate** bilang isang metric. Ang isang translation method na nagpo-produce ng mga salitang nire-reject ng FST ay nagpo-produce ng morphologically invalid na Cree — anuman ang sabihin ng chrF++ score.

**Mga key ALTLab resources:**
- [itwêwina](https://itwewina.altlab.app/) — isang intelligent Plains Cree–English dictionary na powered ng FST
- [Morphodict](https://github.com/UAlbertaALTLab/morphodict) — open-source at morphologically-aware na dictionary platform
- [crk-db](https://github.com/UAlbertaALTLab/crk-db) — Plains Cree lexical database
- [21st Century Tools for Indigenous Languages](https://21c.tools/) — ang mas malawak na project context

### Global FST & Morphological Registries

Hindi lang Plains Cree ang language na may high-quality na FST infrastructure. Kung gusto niyo pong mag-develop ng translation pipelines para sa iba pang low-resource o morphologically complex languages, pwede niyo pong i-tap ang mga established global hubs na ito:

* **[GiellaLT / Giellatekno](https://giellalt.github.io/) (UiT The Arctic University of Norway):** Ang pinakamalaking repository ng open-source FST morphological analyzers at generators, na nagco-cover ng higit sa 100 languages. Kasama sa mga focus areas ang mga Sámi languages (`sme`, `smj`, `sma`, etc.), Uralic languages (Komi, Erzya, Udmurt, etc.), at iba pang minority/indigenous languages. Naka-host ang kanilang public processed text corpora (`corpus-xxx`) sa kanilang [GitHub Organization](https://github.com/giellalt/).
* **[The Apertium Project](https://www.apertium.org/):** Isang open-source rule-based machine translation platform. Ang Apertium ay nagme-maintain ng highly optimized FST morphological analyzers (gamit ang `lttoolbox` at `hfst`) at bilingual dictionaries para sa dose-dosenang languages, kabilang ang malaking suite ng mga Turkic languages (Kazakh, Tatar, Kyrgyz, etc.) at minority European languages. Public ang lahat ng resources sa [GitHub ng Apertium](https://github.com/apertium).
* **[UniMorph (Universal Morphology)](https://unimorph.github.io/):** Isang collaborative project na nagpo-provide ng standardized morphological paradigms para sa higit sa 150 languages. Naka-host ang dataset sa Hugging Face sa [unimorph/universal_morphologies](https://huggingface.co/datasets/unimorph/universal_morphologies). Kung walang available na compiled FST binary para sa isang language, pwedeng gamitin ang UniMorph tables bilang isang static database lookup gate.
* **[National Research Council Canada (NRC)](https://nrc-digital-repository.canada.ca/):** Nag-o-offer ng mga tools para sa Canadian Indigenous languages, kabilang ang **Uqailaut** Inuktitut FST morphological analyzer at ang malaking **Nunavut Hansard Parallel Corpus** (1.3M aligned English-Inuktitut sentence pairs).

### Ang EdTeKLA Corpus

Ang [EdTeKLA research group](https://spaces.facsci.ualberta.ca/edtekla/) (sa UAlberta rin) ay bumuo ng isang Plains Cree language corpus mula sa mga educational materials, audio transcriptions, at community sources. Ang rosetta evaluation dataset na [EDTeKLA Dev v1](/docs/eval/datasets) ay derived mula sa trabahong ito, at naka-license sa ilalim ng [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).

### Iba pang approaches na na-try na o pwedeng i-try ng mga tao

Method-agnostic ang leaderboard. Narito ang mga strategies na na-explore o na-propose na para sa low-resource MT, na kahit alin dito ay pwedeng i-submit:

| Approach | Paano Ito Gumagana | Pros | Cons |
|----------|-------------|------|------|
| **Coached LLM prompting** | I-inject ang grammar rules, dictionaries, at example pairs sa system prompt | Mabilis i-iterate, hindi kailangan ng training | Ang quality ceiling ay limited ng base knowledge ng LLM |
| **Few-shot prompting** | Isama ang mga verified translations bilang in-context examples | Maganda para sa consistent na style | Maliit ang context window; HINDI dapat galing sa eval data ang mga examples |
| **FST-gated pipeline** | Magge-generate ang LLM → iva-validate ng FST → ire-reject at ire-retry ang invalid morphology | Siguardong morphologically valid | Kailangan ng FST infrastructure; nagdadagdag ng latency at cost ang retry loops |
| **Dictionary lookup + LLM** | I-force ang mga known terms mula sa isang bilingual dictionary, hayaan ang LLM na mag-handle sa iba | Nare-reduce ang hallucination para sa mga known terms | Palaging incomplete ang dictionary coverage |
| **Fine-tuned model** | Mag-fine-tune ng open model (Llama, Mistral) sa parallel text — huwag lang sa eval data | Potentially highest quality | Kailangan ng parallel corpus (scarce); magastos; may risk ng overfitting |
| **Chained models** | Magge-generate ng rough translation ang Model A → magpo-post-edit ang Model B → magso-score ang Model C | Pwedeng i-combine ang mga specialist strengths | Complex; mabagal; magastos |
| **Rule-based + LLM hybrid** | Gumamit ng linguistic rules para sa mga known patterns, LLM para sa lahat ng iba pa | Precise kung saan nag-a-apply ang rules | Kailangan ng malalim na linguistic expertise |
| **Back-translation augmentation** | Mag-generate ng synthetic parallel data sa pamamagitan ng pag-translate ng Cree→English, tapos mag-train sa reverse | Mura nitong nae-expand ang training data | Ina-amplify ang mga existing model errors |
| **Evolutionary approach** | Mag-generate ng candidate translations, i-score ang mga ito, i-mutate ang mga best performers, ulitin | Pwedeng maka-discover ng novel solutions; parallelizable | Computationally expensive; kailangan ng magandang fitness function |
| **Partial translation** | I-manually translate ang isang representative sample, patunayan na nagma-match ang method mo sa style mo rito, tapos i-auto-translate ang natitirang bulk | Kino-combine ang human quality sa machine scale | Kailangan ng initial human effort |
| **Manual JSON / exam grading** | Mag-hand-craft ng dataset JSON file para i-test ang mga sagot ng estudyante sa isang language exam, o i-grade ang isang batch ng human translations laban sa isang gold standard | Walang ML na kailangan; gumagana para sa education at QA | Hindi nag-i-scale para sa ongoing translation needs |

### JSON lang ito

Tumatanggap ang harness ng JSON at naglalabas ng scored JSON. Simple lang ang [dataset format](/docs/eval/datasets):

```json
{
  "entries": [
    { "index": 0, "source_text": "Hello", "target_expected": "tânisi" },
    { "index": 1, "source_text": "Thank you", "target_expected": "kinanâskomitin" }
  ]
}
```

Pwede niyo po itong i-construct manually. Pwede itong i-export mula sa isang spreadsheet. Pwede itong i-generate mula sa isang corpus. Pwede itong gamitin ng isang language teacher para i-score ang mga translations ng estudyante. Pwede itong gamitin ng isang translation agency para i-benchmark ang mga freelancers. Pwede itong gamitin ng isang research lab para i-compare ang mga model architectures. Walang pakialam ang harness kung saan galing ang JSON — ini-score lang nito iyon.

At dahil parehong plugin interface ang ginagamit ng production deployment framework, ang isang method na may magandang score sa harness ay pwedeng i-deploy sa inyong website gamit lang ang isang config change. **Patunayan ito at gamitin.**

Talagang endless ang mga possibilities. **Kung may idea po kayo, i-build ito, i-run ang harness, at i-submit ang inyong mga scores.**

---

## Paano Pumapasok ang rosetta Dito

Ang rosetta ang nagpo-provide ng infrastructure layer — kayo ang magdadala ng method.

### Ang coaching system

Hinahayaan kayo ng `llm-coached` method ng rosetta na mag-inject ng linguistic knowledge nang direkta sa LLM prompt:

```json title=".rosetta/coaching/crk.json"
{
  "grammar_rules": [
    "Plains Cree is polysynthetic — a single word can express what English needs a full sentence for",
    "Animate/inanimate noun distinction affects verb conjugation, demonstratives, and pluralization",
    "Use SRO (Standard Roman Orthography) as the working script — syllabic conversion is handled by the deterministic converter",
    "Obviation: when two third-person referents appear, the less salient one takes obviative marking (-a suffix on nouns, -iyiwa on verbs)"
  ],
  "dictionary": {
    "home": "kīwēwin",
    "settings": "isi-nākatohkēwin",
    "search": "nānātawāpahtam",
    "welcome": "tānisi",
    "dashboard": "kīskinwahamākēwin-māsinahikan"
  },
  "style_notes": "Use formal register appropriate for educational and community contexts. Preserve English technical terms in parentheses when no Cree equivalent exists or is widely accepted."
}
```

Ang coaching data ay ini-inject sa bawat LLM prompt para sa `en:crk` pair, na nagbibigay sa model ng structured linguistic context na wala sana ito. Tingnan ang [Coaching Data](/docs/concepts/coaching-data) para sa full specification.

### Registers

Ang register ay bahagi ng system prompt na nagko-control sa tone, formality, at orthographic conventions. May kasamang isang Plains Cree register ang rosetta:

```
nêhiyawêwin (Plains Cree). Use SRO (Standard Roman Orthography) as the working
script. Output will be converted to Syllabics via deterministic converter.
Professional register appropriate for educational and community contexts.
```

Pwede niyo po itong i-override sa inyong config para mag-experiment sa iba't ibang prompting strategies:

```json title="i18n-rosetta.config.json"
{
  "languages": {
    "crk": {
      "register": "Casual Plains Cree (Y-dialect). Use SRO. Prefer everyday vocabulary over formal or archaic terms. Address the reader directly."
    }
  }
}
```

Ang iba't ibang registers ay nagpo-produce ng iba't ibang translation styles — at iba't ibang scores sa leaderboard. Nire-record ng bawat submission ang eksaktong register at system prompt na ginamit (bilang isang SHA-256 hash sa [run card](/docs/eval/run-card)), kaya reproducible ang mga experiments.

### Script conversion

Ang Plains Cree ay isinusulat sa dalawang scripts: **Standard Roman Orthography (SRO)** at **Canadian Aboriginal Syllabics**. Ang pipeline ng rosetta:

1. Magta-translate ang LLM sa SRO (Latin-based, na mas madaling i-handle ng mga LLMs)
2. Iva-validate ng quality gate ang SRO output
3. Ita-transform ng deterministic converter ang SRO → Syllabics
4. Isusulat ang converted text sa disk

Hina-handle ng converter ang lahat ng SRO diacritics (ê, î, ô, â para sa long vowels) at minamap ang mga ito sa tamang syllabic characters. Tingnan ang [Script Converters](/docs/concepts/script-converters) para sa technical details.

### Ang evaluation loop

Nira-run ng [eval harness](/docs/eval/harness) ang inyong method laban sa evaluation dataset at nagpo-produce ng scored na [run card](/docs/eval/run-card):

```bash
# Clone the harness
git clone https://github.com/gamedaysuits/gds-mt-eval-harness.git
cd gds-mt-eval-harness
pip install -e .

# Run a baseline experiment
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --model google/gemini-2.5-pro \
  --condition coached-v7

# Run with FST validation (if you have an FST binary)
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --fst-analyzer ./bin/crk-analyzer \
  --condition fst-gated-v1
```

Ang `--condition` flag ay isang label na kayo ang pipili. Lalabas ito sa leaderboard para makita ng mga tao kung anong prompt strategy ang ginamit niyo. Nire-record ng harness ang buong system prompt sa run card, kaya reproducible ang eksaktong approach niyo.

:::tip Mag-experiment nang malaya, i-submit ang inyong best
Naka-design ang harness para sa rapid iteration. Mag-run ng dose-dosenang experiments gamit ang iba't ibang models, coaching data, registers, at conditions. I-submit lang sa leaderboard kapag mayroon na kayong ipinagmamalaki.
:::

---

## OCAP Principles

Naka-design ang rosetta para i-support ang Indigenous data sovereignty. Ang mga [OCAP principles](https://fnigc.ca/ocap-training/) (Ownership, Control, Access, Possession) ang nagga-guide kung paano namin ina-approach ang language technology para sa mga Indigenous communities:

| Principle | Paano ito sinusuportahan ng rosetta |
|-----------|------------------------|
| **Ownership** | Pagmamay-ari ng mga language communities ang kanilang linguistic data. Hindi kailanman nagfo-phone home o nagta-transmit ng data ang rosetta sa aming mga servers |
| **Control** | Pinapayagan ng [API method](/docs/guides/serving-a-method) ang mga communities na i-host ang sarili nilang translation pipeline — kami ang nagpo-provide ng interface, sila ang kumokontrol sa implementation |
| **Access** | Ang mga communities ang nagde-decide kung sino ang pwedeng gumamit ng kanilang method. Pwedeng i-gate ang API sa likod ng authentication |
| **Possession** | Nananatili ang lahat ng translation data sa file system ng inyong project. Tina-track ng [provenance system](/docs/concepts/security) kung saan nanggaling ang bawat translation |

Ibig sabihin ng plugin architecture, pwedeng mag-build ang isang community ng method na nag-i-incorporate ng sacred o restricted knowledge internally, i-expose lang ang translation API, at i-maintain ang full control sa kanilang mga linguistic resources.

---

## Ang Vision: Ano ang Susunod

Plains Cree ang unang target. Kapag na-validate na ang pipeline at satisfied na ang community sa quality, ie-extend ang parehong architecture sa iba pang polysynthetic languages na may FST infrastructure:

- **Iba pang Algonquian languages**: Woods Cree, Swampy Cree, Ojibwe, Blackfoot
- **Mga Inuit languages**: Inuktitut, Inuinnaqtun (na gumagamit din ng syllabic scripts)
- **Iba pang language families**: anumang language na may FST analyzer ay pwedeng gumamit ng FST-gated pipeline

Language-pair-scoped ang leaderboard. Habang may mga bagong evaluation datasets na kino-contribute ang mga language communities, awtomatikong magbubukas ang mga bagong leaderboard tracks.

**Isa itong open invitation.** Kung nagtatrabaho po kayo gamit ang isang low-resource language — bilang isang researcher, community member, estudyante, o kahit sino lang na may pakialam — binibigyan kayo ng rosetta ng mga tools para mag-build ng isang totoong bagay, i-measure ito nang tapat, at i-share ito sa buong mundo. Naghihintay ang [Method Leaderboard](/leaderboard) para sa inyong submission.

---

## Tingnan Din

- **[Method Leaderboard](/leaderboard)** — i-submit ang inyong mga scores at tingnan kung paano nagkukumpara ang mga methods
- **[MT Evaluation](/docs/eval/)** — ano ang nagpapaganda sa isang method, ano ang nadi-disqualify
- **[Eval Harness](/docs/eval/harness)** — kung paano mag-run ng mga experiments
- **[Evaluation Datasets](/docs/eval/datasets)** — EDTeKLA Dev v1 at FLORES+
- **[Coaching Data](/docs/concepts/coaching-data)** — kung paano i-structure ang linguistic knowledge para sa LLM
- **[Script Converters](/docs/concepts/script-converters)** — ang SRO→Syllabics pipeline
- **[Serving a Method via API](/docs/guides/serving-a-method)** — pag-host ng community-controlled na translation
- **[ALTLab](https://altlab.artsrn.ualberta.ca/)** — ang Alberta Language Technology Lab
- **[EdTeKLA](https://spaces.facsci.ualberta.ca/edtekla/)** — ang Educational Technology, Knowledge & Language research group
- **[itwêwina dictionary](https://itwewina.altlab.app/)** — FST-powered na Plains Cree–English dictionary