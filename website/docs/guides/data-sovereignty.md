---
sidebar_position: 7
title: Data Sovereignty
description: "OCAP, CARE, and Māori Data Sovereignty principles for Indigenous language translation. Why community consent comes before deployment."
---

# Data Sovereignty

Machine translation for Indigenous languages raises questions that don't exist for French or Japanese. Who owns the training data? Who controls how a language model speaks? Who decides whether a translation is good enough to publish?

**The answer is always the community.**

rosetta is built to support this. The `api` method keeps all linguistic resources server-side under community control. The plugin system separates the method from the tool. But the tool can't enforce ethics — this page explains the principles you should follow.

---

## OCAP® Principles

**OCAP** (Ownership, Control, Access, Possession) is a set of principles developed by the [First Nations Information Governance Centre](https://fnigc.ca/ocap-training/) (FNIGC) that establish how First Nations data should be collected, protected, used, and shared.

| Principle | What It Means for Translation |
|-----------|------------------------------|
| **Ownership** | The community owns its linguistic data — dictionaries, grammars, parallel texts, coaching files, and any translations produced from them. |
| **Control** | The community controls how its language data is used, who has access, and what translation methods are acceptable. |
| **Access** | Community members have the right to access and manage their own language resources regardless of where they are stored. |
| **Possession** | The physical data (coaching files, dictionaries, model weights) must reside on infrastructure the community controls — not on a third-party cloud. |

### What OCAP means in practice

- **Do not publish translations** of an Indigenous language without explicit community authorization.
- **Do not train models** on community-provided linguistic data without a data-sharing agreement.
- **Do not scrape** community language resources from websites, social media, or educational materials.
- **Use the `api` method** so that prompts, coaching data, and dictionaries stay on community-controlled servers. The rosetta `api` method is a "dumb pipe" — it sends keys out and gets translations back. All linguistic IP stays server-side.
- **Document provenance** — the `provenance` field in the [plugin manifest](/docs/reference/plugin-spec) should list every resource used, its license, and its origin.

:::warning OCAP® is a registered trademark
OCAP® is a registered trademark of the First Nations Information Governance Centre. It applies specifically to First Nations in Canada. The principles have broader relevance, but the trademark and governance authority belong to FNIGC.
:::

---

## CARE Principles

The **CARE Principles for Indigenous Data Governance** were developed by the [Global Indigenous Data Alliance](https://www.gida-global.org/care) (GIDA) as a complement to the FAIR data principles. FAIR says data should be Findable, Accessible, Interoperable, and Reusable. CARE says that's not enough — data governance must also center Indigenous rights.

| Principle | Application |
|-----------|------------|
| **Collective Benefit** | Translation tools should benefit the language community first. Leaderboard scores are a means to improve methods, not to extract commercial value from community languages. |
| **Authority to Control** | Communities have the authority to govern how their language data is collected, used, and shared. A high leaderboard score does not grant permission to publish translations. |
| **Responsibility** | Researchers and developers working with Indigenous language data have a responsibility to build relationships, obtain consent, and share benefits. |
| **Ethics** | The rights and wellbeing of Indigenous peoples must be the primary concern. Translation methods should be developed *with* communities, not *about* them. |

---

## Te Mana Raraunga — Māori Data Sovereignty

**Te Mana Raraunga** is the [Māori Data Sovereignty Network](https://www.temanararaunga.maori.nz/). It asserts that Māori data — including language data — is a taonga (treasure) subject to the principles of the Treaty of Waitangi and tikanga Māori (Māori customary law).

Key principles:

| Principle | Meaning |
|-----------|---------|
| **Rangatiratanga** (Authority) | Māori have an inherent right to exercise authority over their data, including language data. |
| **Whakapapa** (Relationships) | Data has origins and connections. Language data carries the relationships and knowledge of the people who created it. |
| **Whanaungatanga** (Obligations) | Those who hold or process Māori data have reciprocal obligations to the communities it comes from. |
| **Kotahitanga** (Collective benefit) | Māori data should be used for the collective benefit of Māori. |
| **Manaakitanga** (Reciprocity) | The use of Māori data should involve care, respect, and reciprocity. |
| **Kaitiakitanga** (Guardianship) | Data guardians have a duty to protect the data and ensure it is used appropriately. |

These principles apply to te reo Māori (the Māori language) and to any computational work involving Māori language data.

---

## What This Means for rosetta Users

### For standard languages (French, Japanese, Spanish...)

Use rosetta normally. These languages have large, publicly available corpora, established translation APIs, and no sovereignty concerns. Translate, sync, and publish as you wish.

### For Indigenous and low-resource languages

The situation is fundamentally different:

1. **Get consent first.** Before building a translation method for an Indigenous language, establish a relationship with the community. A method built without community involvement — no matter how technically impressive — should not be published or distributed.

2. **Use the `api` method.** Host the translation pipeline on community-controlled infrastructure. The `api` method in rosetta is designed for this: it sends keys and gets translations back without exposing the prompts, dictionaries, or coaching data that make the method work.

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

3. **Document everything.** Use the `provenance` field in your plugin manifest to list every resource, its license, and whether it was provided with community consent.

4. **Scores are not licenses.** A high score on the leaderboard proves that a method works well technically. It does not grant permission to publish translations, distribute the plugin, or commercialize the method. The community decides.

5. **Share the method, not the data.** If you develop a technique that works well (e.g., "FST-gated LLM with coached prompts"), share the *architecture* and *approach* on the leaderboard. The community retains control over the linguistic data that makes it work for their specific language.

---

## The `api` Method and Sovereignty

The `api` [translation method](/docs/guides/translation-methods) exists specifically to support data sovereignty. Here's why:

| Aspect | Other Methods | `api` Method |
|--------|--------------|-------------|
| **Where prompts live** | In rosetta's config files (visible to all developers) | On the community's server (private) |
| **Where coaching data lives** | In `.rosetta/coaching/` directory (committed to git) | On the community's server (private) |
| **Where dictionaries live** | In the plugin directory (distributed with the plugin) | On the community's server (private) |
| **Who controls the pipeline** | Whoever runs `rosetta sync` | The community who operates the API |
| **What rosetta sees** | Everything | Keys in, translations out |

The `api` method is a deliberate architectural choice. It's a "dumb pipe" because the IP — the linguistic knowledge, the grammar rules, the carefully curated coaching examples — belongs to the community, not to the tool.

See [Serving a Method via API](/docs/guides/serving-a-method) for implementation details.

---

## Further Reading

- [First Nations Information Governance Centre — OCAP®](https://fnigc.ca/ocap-training/)
- [Global Indigenous Data Alliance — CARE Principles](https://www.gida-global.org/care)
- [Te Mana Raraunga — Māori Data Sovereignty Network](https://www.temanararaunga.maori.nz/)
- [USIDSN — United States Indigenous Data Sovereignty Network](https://usindigenousdata.org/)

---

## See Also

- [Support a Low-Resource Language](/docs/guides/low-resource-languages) — the technical guide with OCAP context
- [Translation Methods](/docs/guides/translation-methods) — the `api` method and how it protects IP
- [Serving a Method via API](/docs/guides/serving-a-method) — hosting a community-controlled pipeline
- [Plugin Specification](/docs/reference/plugin-spec) — the `provenance` field for resource attribution
- [Cookbook: FST-Gated Pipeline](/docs/tutorials/fst-gated-pipeline) — building a pipeline that a community can self-host
