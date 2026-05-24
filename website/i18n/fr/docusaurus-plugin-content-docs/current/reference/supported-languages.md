---
sidebar_position: 4
title: "Langues prises en charge"
---
# Langues prises en charge

rosetta est fourni avec des **Language Cards** — des fichiers de référence structurés pour plus de 42 langues. Chaque carte contient des préréglages de registre, des métadonnées sur le système de formalité, des indicateurs de prise en charge des méthodes et des informations sur les scripts. Toute langue connue par votre LLM peut être ajoutée avec une seule ligne de configuration — celles-ci sont celles dotées de registres soigneusement sélectionnés et prêts pour la production.

---

## Méthodes de traduction

Chaque langue peut utiliser une ou plusieurs de ces méthodes de traduction :

| Icône | Méthode | Fonctionnement | Coût |
|------|--------|-------------|------|
| 🟢 | **Google Translate** | Référence en traduction automatique neuronale (Neural MT). Plus de 130 langues. Chaînes de type clé-valeur uniquement — ne peut pas traduire le contenu Markdown de manière fiable. | ~20 $/1M de caractères |
| 🔵 | **LLM (OpenRouter)** | Toute langue connue par le modèle. Prompts orientés par le registre. Gère les clés-valeurs et le contenu Markdown. | Varie selon le modèle |
| 🟣 | **LLM-Coached** | LLM + dictionnaires de grammaire + données d'entraînement (coaching) injectées dans les prompts. Idéal pour les langues morphologiquement complexes. | Varie selon le modèle |
| 🟠 | **API (Plugin)** | Pipelines de traduction hébergés par la communauté et servis via HTTP. [Compatible OCAP](/docs/guides/low-resource-languages). | Varie selon le fournisseur |

Définissez `GOOGLE_TRANSLATE_API_KEY` pour Google Translate, ou `OPENROUTER_API_KEY` pour les méthodes LLM. Consultez [Méthodes de traduction](/docs/guides/translation-methods) pour plus de détails.

---

## Langues prioritaires

Il s'agit des paramètres régionaux (locales) les plus fréquemment demandés pour les applications web et mobiles, répertoriés dans l'ordre recommandé par rosetta, qui privilégie l'accessibilité.

| Drapeau | Langue | Code | Google | LLM | Coached | Script | Notes |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇸🇦 | Arabe | `ar` | ✅ | ✅ | ✅ | — | RTL. Arabe standard moderne (فصحى). |
| 🇵🇭 | Philippin (Taglish) | `tl` | ✅ | ✅ | ✅ | — | Alternance codique : Tagalog principal, termes techniques en anglais. |
| 🇫🇷 | Français | `fr` | ✅ | ✅ | ✅ | — | Vouvoiement. Écriture inclusive (Connecté·e). |
| 🇪🇸 | Espagnol | `es` | ✅ | ✅ | ✅ | — | Amérique latine neutre. |
| 🇩🇪 | Allemand | `de` | ✅ | ✅ | ✅ | — | Forme de politesse (Sie). Écriture inclusive (Benutzer:innen). |
| 🇯🇵 | Japonais | `ja` | ✅ | ✅ | ✅ | — | です/ます pour le corps du texte, する pour les étiquettes de l'interface utilisateur. |
| 🇨🇳 | Chinois (Simplifié) | `zh` | ✅ | ✅ | ✅ | — | 简体中文. |
| 🇮🇹 | Italien | `it` | ✅ | ✅ | ✅ | — | Forme de politesse (Lei). |
| 🇧🇷 | Portugais (BR) | `pt` | ✅ | ✅ | ✅ | — | Portugais brésilien. |
| 🇰🇷 | Coréen | `ko` | ✅ | ✅ | ✅ | — | Registre poli 해요체. |

## Principales langues mondiales

| Drapeau | Langue | Code | Google | LLM | Coached | Script | Notes |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇧🇩 | Bengali | `bn` | ✅ | ✅ | ✅ | — | Préférence pour শুদ্ধ ভাষা. |
| 🇧🇬 | Bulgare | `bg` | ✅ | ✅ | ✅ | — | |
| 🇨🇿 | Tchèque | `cs` | ✅ | ✅ | ✅ | — | Vouvoiement (Vykání). |
| 🇩🇰 | Danois | `da` | ✅ | ✅ | ✅ | — | |
| 🇬🇷 | Grec | `el` | ✅ | ✅ | ✅ | — | Δημοτική moderne. |
| 🇮🇷 | Persan | `fa` | ✅ | ✅ | ✅ | — | RTL. |
| 🇫🇮 | Finnois | `fi` | ✅ | ✅ | ✅ | — | Pas de genre grammatical. |
| 🇮🇱 | Hébreu | `he` | ✅ | ✅ | ✅ | — | RTL. |
| 🇮🇳 | Hindi | `hi` | ✅ | ✅ | ✅ | — | शुद्ध हिन्दी. Emprunts minimaux à l'anglais. |
| 🇭🇺 | Hongrois | `hu` | ✅ | ✅ | ✅ | — | Forme de politesse (Ön). |
| 🇮🇩 | Indonésien | `id` | ✅ | ✅ | ✅ | — | |
| 🇲🇾 | Malais | `ms` | ✅ | ✅ | ✅ | — | |
| 🇳🇱 | Néerlandais | `nl` | ✅ | ✅ | ✅ | — | Forme de politesse (U). |
| 🇳🇴 | Norvégien | `nb` | ✅ | ✅ | ✅ | — | Bokmål. |
| 🇵🇱 | Polonais | `pl` | ✅ | ✅ | ✅ | — | Forme de politesse (Pan/Pani). |
| 🇵🇹 | Portugais (EU) | `pt-PT` | ✅ | ✅ | ✅ | — | Portugais européen. |
| 🇷🇴 | Roumain | `ro` | ✅ | ✅ | ✅ | — | |
| 🇷🇺 | Russe | `ru` | ✅ | ✅ | ✅ | — | Vouvoiement (Вы). |
| 🇸🇰 | Slovaque | `sk` | ✅ | ✅ | ✅ | — | Vouvoiement (Vykanie). |
| 🇷🇸 | Serbe | `sr` | ✅ | ✅ | ✅ | 🔤 Latin→Cyrillique | Convertisseur de script déterministe. |
| 🇸🇪 | Suédois | `sv` | ✅ | ✅ | ✅ | — | |
| 🇰🇪 | Swahili | `sw` | ✅ | ✅ | ✅ | — | |
| 🇹🇭 | Thaï | `th` | ✅ | ✅ | ✅ | — | Particules de politesse ครับ/ค่ะ. |
| 🇹🇷 | Turc | `tr` | ✅ | ✅ | ✅ | — | Vouvoiement (Siz). |
| 🇺🇦 | Ukrainien | `uk` | ✅ | ✅ | ✅ | — | Vouvoiement (Ви). |
| 🇵🇰 | Ourdou | `ur` | ✅ | ✅ | ✅ | — | RTL. Forme de politesse آپ. |
| 🇻🇳 | Vietnamien | `vi` | ✅ | ✅ | ✅ | — | |
| 🇹🇼 | Chinois (Traditionnel) | `zh-TW` | ✅ | ✅ | ✅ | — | 繁體中文. |

## Variantes régionales

| Drapeau | Langue | Code | Google | LLM | Coached | Script | Notes |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇲🇽 | Espagnol mexicain | `es-MX` | ✅ | ✅ | ✅ | — | Tutoiement (Tú). Registre chaleureux. |
| 🇨🇦 | Français canadien | `fr-CA` | ✅ | ✅ | ✅ | — | Idiomes québécois. |

---

## Langues autochtones et à faibles ressources

Ces langues ne sont pas prises en charge par les services commerciaux de traduction automatique (MT). rosetta fournit les outils nécessaires aux communautés linguistiques pour concevoir leurs propres méthodes selon les [principes OCAP](/docs/guides/low-resource-languages).

| | Langue | Code | Google | LLM | Coached | Script | Statut |
|---|----------|------|:------:|:---:|:-------:|--------|--------|
| 🪶 | Cri des plaines | `crk` | ❌ | ✅ | ✅ | 🔤 SRO→Syllabique | 🚧 En cours de développement |

:::info Le cri des plaines est en cours de développement actif
Le registre, l'infrastructure d'entraînement (coaching), le convertisseur de script et le dispositif d'évaluation pour le cri des plaines sont tous fonctionnels, mais le pipeline de traduction n'a **pas encore été publié**. Nous collaborons avec les communautés linguistiques selon les [principes OCAP](/docs/guides/low-resource-languages) afin de garantir la qualité avant la publication. Consultez [Soutenir une langue à faibles ressources](/docs/guides/low-resource-languages) pour connaître l'histoire complète — et savoir comment vous pouvez y contribuer.
:::

:::tip Ajouter d'autres langues à faibles ressources
Le système de plugins de méthodes de rosetta est conçu à cet effet. Une communauté linguistique peut créer une méthode de traduction personnalisée, l'héberger sous son propre contrôle et la servir via la [méthode API](/docs/guides/serving-a-method). Le [Classement des méthodes (Method Leaderboard)](/leaderboard) suit les scores pour n'importe quelle paire de langues — concevez une méthode, exécutez le dispositif d'évaluation et visez le meilleur score.
:::

---

## Langues construites

Les langues construites (conlangs) sont prises en charge via les registres LLM et des convertisseurs de script optionnels. Elles utilisent la même infrastructure que les langues réelles — le contrôle qualité, le système d'entraînement (coaching) et le pipeline de conversion de script fonctionnent de manière identique.

| | Langue | Code | Google | LLM | Script | Notes |
|---|----------|------|:------:|:---:|--------|-------|
| 🖖 | Klingon | `tlh` | ❌ | ✅ | 🔤 Romanisation→pIqaD | Police PUA requise. Vocabulaire de Marc Okrand. |
| 🧝 | Sindarin (Elfique de Tolkien) | `x-elvish-s` | ❌ | ✅ | 🔤 Latin→Tengwar | Police CSUR PUA requise. |
| 🏴‍☠️ | Anglais pirate | `x-pirate` | ❌ | ✅ | — | Registre uniquement. Métaphores nautiques. |
| 🦸 | Kryptonien | `x-kryptonian` | ❌ | ✅ | 🔤 Latin→Kryptonien | Police PUA requise. |
| 🎭 | Anglais shakespearien | `x-shakespeare` | ❌ | ✅ | — | Registre uniquement. Formes Thee/thou, -eth/-est. |
| 🐸 | Parler Yoda | `x-yoda` | ❌ | ✅ | — | Registre uniquement. Ordre des mots OSV (Objet-Sujet-Verbe). |

Consultez [Langues construites, scripts et orthographe](/docs/guides/conlangs-scripts-orthography) pour connaître les exigences relatives aux polices PUA, les limites d'Unicode et la procédure pour ajouter les vôtres.

---

## Préréglages de langue

L'assistant `init` prend en charge des noms de préréglages pour une configuration rapide. Vous pouvez combiner des préréglages avec des codes individuels.

| Préréglage | Se développe en |
|--------|-----------|
| `european` | fr, de, es, it, pt, nl |
| `asian` | ja, zh, ko |
| `global` | fr, es, de, ja, zh, ko, pt, ar |
| `nordic` | da, fi, nb, sv |

```bash
# Mix presets with individual codes
i18n-rosetta init
# → Target languages: european, ja
# → Resolves to: fr, de, es, it, pt, nl, ja
```

---

## Ajouter n'importe quelle langue

rosetta peut traduire vers **n'importe quelle langue connue par votre LLM** — le tableau ci-dessus répertorie uniquement les langues dotées de préréglages de registre intégrés. Pour ajouter une langue non répertoriée, incluez son code BCP-47 dans votre configuration :

```json
{
  "languages": {
    "sw": {},
    "am": {
      "register": "Formal Amharic. Professional register with Geʽez script."
    }
  }
}
```

Le LLM traduira en utilisant ses connaissances d'entraînement de la langue. La définition d'un `register` vous donne le contrôle sur le ton, la formalité et les conventions orthographiques. Consultez [Configuration](/docs/getting-started/configuration) pour plus de détails.

---

## Language Cards

Chaque langue intégrée possède une **Language Card** — un fichier JSON dans `lib/data/language-cards/` contenant :

| Champ | Contenu |
|-------|------------------|
| **Système de formalité** | Distinction T-V (tutoiement/vouvoiement), niveaux de discours, keigo, particules, etc. |
| **Préréglages de registre** | Préréglages nommés spécifiques au caractère de la langue |
| **Prise en charge des méthodes** | Les API de traduction qui prennent en charge cette langue |
| **Directives de genre** | Règles de genre grammatical et conseils d'écriture inclusive |
| **Script/direction** | Code de script ISO 15924 et RTL/LTR |
| **Jeux de données d'évaluation** | Les benchmarks qui couvrent cette langue |

### Utilisation des clés de préréglage

Au lieu de rédiger le texte complet du registre, vous pouvez utiliser un nom de clé de préréglage :

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "polite"
  }
}
```

Rosetta résout la clé vers le prompt de registre complet. Exécutez `npx i18n-rosetta init` pour voir les préréglages disponibles pour chaque langue.

### Exemples de préréglages

| Langue | Préréglages | Par défaut |
|----------|---------|--------|
| Français | `formal-vous`, `casual-tu` | `formal-vous` |
| Coréen | `polite-haeyo`, `formal-hapsyo`, `casual-hae` | `polite-haeyo` |
| Japonais | `polite`, `formal-keigo`, `casual` | `polite` |
| Allemand | `formal-Sie`, `casual-du` | `formal-Sie` |
| Thaï | `neutral-professional`, `polite-male`, `polite-female` | `neutral-professional` |
| Espagnol | `neutral-professional`, `formal-usted`, `casual-tuteo` | `neutral-professional` |

Consultez [Contribuer à une Language Card](https://github.com/nicholasgriffintn/i18n-rosetta/blob/main/docs/planning/LANGUAGE_CARD_SPEC.md) pour savoir comment ajouter ou améliorer des préréglages.

---

## Voir aussi

- [Configuration](/docs/getting-started/configuration) — référence complète de la configuration, y compris la configuration des langues
- [Méthodes de traduction](/docs/guides/translation-methods) — fonctionnement de chaque méthode
- [Convertisseurs de script](/docs/concepts/script-converters) — pipeline de conversion de script déterministe
- [Langues construites, scripts et orthographe](/docs/guides/conlangs-scripts-orthography) — polices PUA, Unicode, ajout de langues construites
- [Soutenir une langue à faibles ressources](/docs/guides/low-resource-languages) — conception de méthodes pour les langues sous-représentées