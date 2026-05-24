---
sidebar_position: 7
title: "Data Sovereignty"
description: "Mga OCAP, CARE, at Māori Data Sovereignty principles para sa Indigenous language translation. Bakit kailangan muna ng community consent bago ang deployment."
---
# Data Sovereignty

Ang machine translation para sa mga Indigenous languages ay naglalabas ng mga katanungan na hindi nag-eexist para sa French o Japanese. Sino ang nagmamay-ari ng training data? Sino ang kumokontrol kung paano magsalita ang isang language model? Sino ang nagdedesisyon kung ang isang translation ay good enough na para i-publish?

**Ang sagot po palagi ay ang community.**

Binuo ang rosetta para i-support ito. Ang `api` method ay pinapanatili ang lahat ng linguistic resources server-side sa ilalim ng control ng community. Hinihiwalay ng plugin system ang method mula sa tool. Pero hindi kayang i-enforce ng tool ang ethics — ipinapaliwanag ng page na ito ang mga principles na dapat ninyong sundin.

---

## OCAP® Principles

Ang **OCAP** (Ownership, Control, Access, Possession) ay isang set ng principles na na-develop ng [First Nations Information Governance Centre](https://fnigc.ca/ocap-training/) (FNIGC) na nag-eestablish kung paano dapat i-collect, i-protect, gamitin, at i-share ang First Nations data.

| Principle | Ano ang Ibig Sabihin Nito para sa Translation |
|-----------|------------------------------|
| **Ownership** | Ang community ang nagmamay-ari ng kanilang linguistic data — dictionaries, grammars, parallel texts, coaching files, at anumang translations na na-produce mula sa mga ito. |
| **Control** | Ang community ang kumokontrol kung paano ginagamit ang kanilang language data, kung sino ang may access, at kung anong translation methods ang acceptable. |
| **Access** | May karapatan ang mga community members na i-access at i-manage ang kanilang sariling language resources kahit saan pa man naka-store ang mga ito. |
| **Possession** | Ang physical data (coaching files, dictionaries, model weights) ay dapat naka-reside sa infrastructure na kontrolado ng community — hindi sa isang third-party cloud. |

### Ano ang ibig sabihin ng OCAP in practice

- **Huwag mag-publish ng translations** ng isang Indigenous language nang walang explicit na authorization mula sa community.
- **Huwag mag-train ng models** gamit ang community-provided linguistic data nang walang data-sharing agreement.
- **Huwag mag-scrape** ng community language resources mula sa mga websites, social media, o educational materials.
- **Gamitin ang `api` method** para manatili ang mga prompts, coaching data, at dictionaries sa mga community-controlled servers. Ang rosetta `api` method ay isang "dumb pipe" — nagse-send ito ng keys palabas at kumukuha ng translations pabalik. Lahat ng linguistic IP ay nananatiling server-side.
- **I-document ang provenance** — ang `provenance` field sa [plugin manifest](/docs/reference/plugin-spec) ay dapat mag-list ng bawat resource na ginamit, ang license nito, at ang origin nito.

:::warning Ang OCAP® ay isang registered trademark
Ang OCAP® ay isang registered trademark ng First Nations Information Governance Centre. Nag-aapply ito specifically sa First Nations sa Canada. Ang mga principles ay may broader relevance, pero ang trademark at governance authority ay pagmamay-ari ng FNIGC.
:::

---

## CARE Principles

Ang **CARE Principles for Indigenous Data Governance** ay na-develop ng [Global Indigenous Data Alliance](https://www.gida-global.org/care) (GIDA) bilang complement sa FAIR data principles. Sinasabi ng FAIR na ang data ay dapat Findable, Accessible, Interoperable, at Reusable. Sinasabi naman ng CARE na hindi iyon sapat — dapat ding i-center ng data governance ang Indigenous rights.

| Principle | Application |
|-----------|------------|
| **Collective Benefit** | Ang mga translation tools ay dapat mag-benefit muna sa language community. Ang mga leaderboard scores ay paraan para ma-improve ang methods, hindi para mag-extract ng commercial value mula sa mga community languages. |
| **Authority to Control** | May authority ang mga communities na i-govern kung paano kinokolekta, ginagamit, at shini-share ang kanilang language data. Ang mataas na leaderboard score ay hindi nagbibigay ng permission para mag-publish ng translations. |
| **Responsibility** | Ang mga researchers at developers na nagtatrabaho gamit ang Indigenous language data ay may responsibility na mag-build ng relationships, kumuha ng consent, at mag-share ng benefits. |
| **Ethics** | Ang karapatan at wellbeing ng mga Indigenous peoples ang dapat maging primary concern. Ang mga translation methods ay dapat i-develop *kasama* ang mga communities, hindi *tungkol* sa kanila. |

---

## Te Mana Raraunga — Māori Data Sovereignty

Ang **Te Mana Raraunga** ay ang [Māori Data Sovereignty Network](https://www.temanararaunga.maori.nz/). Ina-assert nito na ang Māori data — kabilang ang language data — ay isang taonga (treasure) na subject sa mga principles ng Treaty of Waitangi at tikanga Māori (Māori customary law).

Key principles:

| Principle | Meaning |
|-----------|---------|
| **Rangatiratanga** (Authority) | May inherent right ang mga Māori na mag-exercise ng authority sa kanilang data, kabilang ang language data. |
| **Whakapapa** (Relationships) | Ang data ay may origins at connections. Dala ng language data ang relationships at knowledge ng mga taong nag-create nito. |
| **Whanaungatanga** (Obligations) | Ang mga nagho-hold o nagpo-process ng Māori data ay may reciprocal obligations sa mga communities kung saan ito nagmula. |
| **Kotahitanga** (Collective benefit) | Ang Māori data ay dapat gamitin para sa collective benefit ng mga Māori. |
| **Manaakitanga** (Reciprocity) | Ang paggamit ng Māori data ay dapat mag-involve ng care, respect, at reciprocity. |
| **Kaitiakitanga** (Guardianship) | May duty ang mga data guardians na i-protect ang data at siguraduhing ginagamit ito nang tama. |

Nag-aapply ang mga principles na ito sa te reo Māori (ang Māori language) at sa anumang computational work na nag-iinvolve ng Māori language data.

---

## Ano ang Ibig Sabihin Nito para sa mga rosetta Users

### Para sa mga standard languages (French, Japanese, Spanish...)

Gamitin po ang rosetta nang normal. Ang mga languages na ito ay may malalaking, publicly available corpora, established translation APIs, at walang sovereignty concerns. Mag-translate, mag-sync, at mag-publish as you wish.

### Para sa mga Indigenous at low-resource languages

Ang sitwasyon po ay fundamentally different:

1. **Kumuha muna ng consent.** Bago mag-build ng translation method para sa isang Indigenous language, mag-establish po ng relationship sa community. Ang isang method na na-build nang walang community involvement — kahit gaano pa ito ka-technically impressive — ay hindi dapat i-publish o i-distribute.

2. **Gamitin ang `api` method.** I-host ang translation pipeline sa community-controlled infrastructure. Ang `api` method sa rosetta ay naka-design para dito: nagse-send ito ng keys at kumukuha ng translations pabalik nang hindi ini-expose ang mga prompts, dictionaries, o coaching data na nagpapagana sa method.

    ```json title="Community-controlled setup"
    {
      "pairs": {
        "en:crk": {
          "method": "api",
          "endpoint": "https://api.community-server.example/translate"
        }
      }
    }
    ```

3. **I-document ang lahat.** Gamitin ang `provenance` field sa inyong plugin manifest para i-list ang bawat resource, ang license nito, at kung na-provide ba ito nang may community consent.

4. **Ang scores ay hindi licenses.** Ang mataas na score sa leaderboard ay nagpapatunay na gumagana nang maayos ang method technically. Hindi ito nagbibigay ng permission para mag-publish ng translations, mag-distribute ng plugin, o i-commercialize ang method. Ang community po ang nagdedesisyon.

5. **I-share ang method, hindi ang data.** Kung makaka-develop kayo ng technique na gumagana nang maayos (e.g., "FST-gated LLM with coached prompts"), i-share ang *architecture* at *approach* sa leaderboard. Nananatili sa community ang control sa linguistic data na nagpapagana rito para sa kanilang specific language.

---

## Ang `api` Method at Sovereignty

Ang `api` [translation method](/docs/guides/translation-methods) ay nag-eexist specifically para i-support ang data sovereignty. Narito kung bakit:

| Aspect | Other Methods | `api` Method |
|--------|--------------|-------------|
| **Where prompts live** | Sa config files ng rosetta (visible sa lahat ng developers) | Sa server ng community (private) |
| **Where coaching data lives** | Sa `.rosetta/coaching/` directory (naka-commit sa git) | Sa server ng community (private) |
| **Where dictionaries live** | Sa plugin directory (naka-distribute kasama ng plugin) | Sa server ng community (private) |
| **Who controls the pipeline** | Kung sino ang nagra-run ng `rosetta sync` | Ang community na nag-ooperate ng API |
| **What rosetta sees** | Lahat | Keys papasok, translations palabas |

Ang `api` method ay isang deliberate na architectural choice. Isa itong "dumb pipe" dahil ang IP — ang linguistic knowledge, ang grammar rules, ang carefully curated na coaching examples — ay pagmamay-ari ng community, hindi ng tool.

Tingnan ang [Serving a Method via API](/docs/guides/serving-a-method) para sa implementation details.

---

## Further Reading

- [First Nations Information Governance Centre — OCAP®](https://fnigc.ca/ocap-training/)
- [Global Indigenous Data Alliance — CARE Principles](https://www.gida-global.org/care)
- [Te Mana Raraunga — Māori Data Sovereignty Network](https://www.temanararaunga.maori.nz/)
- [USIDSN — United States Indigenous Data Sovereignty Network](https://usindigenousdata.org/)

---

## See Also

- [Support a Low-Resource Language](/docs/guides/low-resource-languages) — ang technical guide na may OCAP context
- [Translation Methods](/docs/guides/translation-methods) — ang `api` method at kung paano nito pino-protect ang IP
- [Serving a Method via API](/docs/guides/serving-a-method) — pag-host ng isang community-controlled pipeline
- [Plugin Specification](/docs/reference/plugin-spec) — ang `provenance` field para sa resource attribution
- [Cookbook: FST-Gated Pipeline](/docs/tutorials/fst-gated-pipeline) — pag-build ng pipeline na kayang i-self-host ng community