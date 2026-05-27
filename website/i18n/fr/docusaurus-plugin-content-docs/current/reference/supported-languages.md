---
sidebar_position: 4
title: "Langues prises en charge"
---
# Langues Prises en Charge

rosetta est fourni avec des **Language Cards** — des fichiers de configuration structurés pour 50 langues. Chaque carte contient des préréglages de registre, des métadonnées sur le système de formalité, des indicateurs de prise en charge des méthodes, des règles typographiques et des informations sur les scripts. Toute langue connue de votre LLM peut être ajoutée avec une seule ligne de configuration — celles-ci sont celles dotées de registres soigneusement sélectionnés et prêts pour la production.

---

## Méthodes de Traduction

Chaque langue peut utiliser une ou plusieurs de ces méthodes de traduction :

| Icône | Méthode | Fonctionnement | Coût |
|------|--------|-------------|------|
| 🟢 | **Google Translate** | Base de référence en traduction automatique neuronale (Neural MT). Plus de 130 langues. Chaînes clé-valeur uniquement — ne peut pas traduire le contenu Markdown de manière fiable. | ~20 $/1M de caractères |
| 🔵 | **LLM (OpenRouter)** | Toute langue connue du modèle. Prompts orientés par le registre. Gère les paires clé-valeur et le contenu Markdown. | Varie selon le modèle |
| 🟣 | **LLM-Coached** | LLM + dictionnaires grammaticaux + données d'encadrement (coaching) injectées dans les prompts. Idéal pour les langues morphologiquement complexes. | Varie selon le modèle |
| 🟠 | **API (Plugin)** | Pipelines de traduction hébergés par la communauté et servis via HTTP. [Compatible OCAP](https://mtevalarena.org/docs/community/low-resource-languages). | Varie selon le fournisseur |

Définissez `GOOGLE_TRANSLATE_API_KEY` pour Google Translate, ou `OPENROUTER_API_KEY` pour les méthodes LLM. Consultez la section [Méthodes de Traduction](/docs/guides/translation-methods) pour obtenir tous les détails.

---

## Langues Prioritaires

Il s'agit des paramètres régionaux les plus fréquemment demandés pour les applications web et mobiles, répertoriés dans l'ordre recommandé par rosetta, en privilégiant l'accessibilité.

| Drapeau | Langue | Code | Google | LLM | Coached | Script | Notes |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇸🇦 | Arabe | `ar` | ✅ | ✅ | ✅ | — | De droite à gauche (RTL). Arabe standard moderne (فصحى). |
| 🇵🇭 | Philippin (Taglish) | `tl` | ✅ | ✅ | ✅ | — | Alternance codique : Tagalog principal, termes techniques en anglais. |
| 🇫🇷 | Français | `fr` | ✅ | ✅ | ✅ | — | Vouvoiement. Écriture inclusive (Connecté·e). |
| 🇪🇸 | Espagnol | `es` | ✅ | ✅ | ✅ | — | Espagnol neutre d'Amérique latine. |
| 🇩🇪 | Allemand | `de` | ✅ | ✅ | ✅ | — | Forme de politesse (Sie). Écriture inclusive (Benutzer:innen). |
| 🇯🇵 | Japonais | `ja` | ✅ | ✅ | ✅ | — | です/ます pour le corps du texte, する pour les étiquettes d'interface utilisateur. |
| 🇨🇳 | Chinois (Simplifié) | `zh` | ✅ | ✅ | ✅ | — | 简体中文. |
| 🇮🇹 | Italien | `it` | ✅ | ✅ | ✅ | — | Forme de politesse (Lei). |
| 🇧🇷 | Portugais (BR) | `pt` | ✅ | ✅ | ✅ | — | Portugais brésilien. |
| 🇰🇷 | Coréen | `ko` | ✅ | ✅ | ✅ | — | Registre poli 해요체. |

## Langues Mondiales Majeures

| Drapeau | Langue | Code | Google | LLM | Coached | Script | Notes |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇧🇩 | Bengali | `bn` | ✅ | ✅ | ✅ | — | Préférence pour শুদ্ধ ভাষা. |
| 🇧🇬 | Bulgare | `bg` | ✅ | ✅ | ✅ | — | |
| 🇨🇿 | Tchèque | `cs` | ✅ | ✅ | ✅ | — | Vykání (vouvoiement). |
| 🇩🇰 | Danois | `da` | ✅ | ✅ | ✅ | — | |
| 🇬🇷 | Grec | `el` | ✅ | ✅ | ✅ | — | Grec moderne (Δημοτική). |
| 🇮🇷 | Persan | `fa` | ✅ | ✅ | ✅ | — | De droite à gauche (RTL). |
| 🇫🇮 | Finnois | `fi` | ✅ | ✅ | ✅ | — | Aucun genre grammatical. |
| 🇮🇱 | Hébreu | `he` | ✅ | ✅ | ✅ | — | De droite à gauche (RTL). |
| 🇮🇳 | Hindi | `hi` | ✅ | ✅ | ✅ | — | शुद्ध हिन्दी. Emprunts minimaux à l'anglais. |
| 🇭🇺 | Hongrois | `hu` | ✅ | ✅ | ✅ | — | Forme de politesse (Ön). |
| 🇮🇩 | Indonésien | `id` | ✅ | ✅ | ✅ | — | |
| 🇲🇾 | Malais | `ms` | ✅ | ✅ | ✅ | — | |
| 🇳🇱 | Néerlandais | `nl` | ✅ | ✅ | ✅ | — | Forme de politesse (U). |
| 🇳🇴 | Norvégien | `nb` | ✅ | ✅ | ✅ | — | Bokmål. |
| 🇵🇱 | Polonais | `pl` | ✅ | ✅ | ✅ | — | Forme Pan/Pani. |
| 🇵🇹 | Portugais (EU) | `pt-PT` | ✅ | ✅ | ✅ | — | Portugais européen. |
| 🇷🇴 | Roumain | `ro` | ✅ | ✅ | ✅ | — | |
| 🇷🇺 | Russe | `ru` | ✅ | ✅ | ✅ | — | Forme Вы (vouvoiement). |
| 🇸🇰 | Slovaque | `sk` | ✅ | ✅ | ✅ | — | Vykanie (vouvoiement). |
| 🇷🇸 | Serbe | `sr` | ✅ | ✅ | ✅ | 🔤 Latin→Cyrillique | Convertisseur de script déterministe. |
| 🇸🇪 | Suédois | `sv` | ✅ | ✅ | ✅ | — | |
| 🇰🇪 | Swahili | `sw` | ✅ | ✅ | ✅ | — | |
| 🇹🇭 | Thaï | `th` | ✅ | ✅ | ✅ | — | Particules de politesse ครับ/ค่ะ. |
| 🇹🇷 | Turc | `tr` | ✅ | ✅ | ✅ | — | Forme Siz (vouvoiement). |
| 🇺🇦 | Ukrainien | `uk` | ✅ | ✅ | ✅ | — | Forme Ви (vouvoiement). |
| 🇵🇰 | Ourdou | `ur` | ✅ | ✅ | ✅ | — | De droite à gauche (RTL). Forme آپ. |
| 🇻🇳 | Vietnamien | `vi` | ✅ | ✅ | ✅ | — | |
| 🇹🇼 | Chinois (Traditionnel) | `zh-TW` | ✅ | ✅ | ✅ | — | 繁體中文. |
| 🇬🇪 | Géorgien | `ka` | ✅ | ✅ | — | — | ქართული. Famille kartvélienne. |
| 🇳🇬 | Yoruba | `yo` | ✅ | ✅ | — | — | Èdè Yorùbá. Langue tonale (3 tons). |

## Variantes Régionales

| Drapeau | Langue | Code | Google | LLM | Coached | Script | Notes |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇲🇽 | Espagnol Mexicain | `es-MX` | ✅ | ✅ | ✅ | — | Tutoiement (Tú). Registre chaleureux. |
| 🇨🇦 | Français Canadien | `fr-CA` | ✅ | ✅ | ✅ | — | Expressions québécoises. |

---

## Langues Autochtones et à Faibles Ressources

Ces langues ne sont pas prises en charge par les services commerciaux de traduction automatique (MT). rosetta fournit les outils nécessaires aux communautés linguistiques pour développer leurs propres méthodes selon les [principes OCAP](https://mtevalarena.org/docs/community/low-resource-languages).

| | Langue | Code | Google | LLM | Coached | Script | Statut |
|---|----------|------|:------:|:---:|:-------:|--------|--------|
| 🪶 | Cri des Plaines | `crk` | ❌ | ✅ | ✅ | 🔤 SRO→Syllabaire | 🚧 En cours de développement |
| 🌄 | Quechua | `qu` | ✅ | ✅ | — | — | Runasimi. Suffixes évidentiels. |

:::info Le cri des plaines est en cours de développement actif
Le registre, l'infrastructure d'encadrement, le convertisseur de script et le dispositif d'évaluation pour le cri des plaines sont tous fonctionnels, mais le pipeline de traduction n'a **pas encore été publié**. Nous collaborons avec les communautés linguistiques selon les [principes OCAP](https://mtevalarena.org/docs/community/low-resource-languages) afin de garantir la qualité avant la publication. Consultez la section [Soutenir une Langue à Faibles Ressources](https://mtevalarena.org/docs/community/low-resource-languages) pour connaître l'histoire complète — et découvrir comment vous pouvez y contribuer.
:::

:::tip Ajouter d'autres langues à faibles ressources
Le système de plugins de méthodes de rosetta est conçu à cet effet. Une communauté linguistique peut créer une méthode de traduction personnalisée, l'héberger sous son propre contrôle et la servir via la [méthode API](/docs/guides/serving-a-method). Le [Classement des Méthodes](/leaderboard) suit les scores pour n'importe quelle paire de langues — créez une méthode, exécutez le dispositif d'évaluation et revendiquez le meilleur score.
:::

---

## Langues Construites

Les langues construites (conlangs) sont prises en charge via les registres LLM et des convertisseurs de script optionnels. Elles utilisent la même infrastructure que les langues naturelles — le contrôle de qualité, le système d'encadrement et le pipeline de conversion de script fonctionnent de manière identique.

| | Langue | Code | Google | LLM | Script | Notes |
|---|----------|------|:------:|:---:|--------|-------|
| 🖖 | Klingon | `tlh` | ❌ | ✅ | 🔤 Romanisation→pIqaD | Police PUA requise. Vocabulaire de Marc Okrand. |
| 🧝 | Sindarin (Elfique de Tolkien) | `x-elvish-s` | ❌ | ✅ | 🔤 Latin→Tengwar | Police CSUR PUA requise. |
| 🏴‍☠️ | Anglais Pirate | `x-pirate` | ❌ | ✅ | — | Registre uniquement. Métaphores nautiques. |
| 🦸 | Kryptonien | `x-kryptonian` | ❌ | ✅ | 🔤 Latin→Kryptonien | Police PUA requise. |
| 🎭 | Anglais Shakespearien | `x-shakespeare` | ❌ | ✅ | — | Registre uniquement. Formes Thee/thou, -eth/-est. |
| 🐸 | Parler Yoda | `x-yoda` | ❌ | ✅ | — | Registre uniquement. Ordre des mots OSV. |

Consultez la section [Langues Construites, Scripts et Orthographe](/docs/guides/conlangs-scripts-orthography) pour connaître les exigences relatives aux polices PUA, les limitations Unicode et la procédure pour ajouter la vôtre.

---

## Préréglages de Langue

L'assistant `init` prend en charge les noms de préréglages pour une configuration rapide. Vous pouvez combiner des préréglages avec des codes individuels.

| Préréglage | Se Développe En |
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

## Ajouter N'importe Quelle Langue

rosetta peut traduire vers **toute langue connue de votre LLM** — le tableau ci-dessus répertorie uniquement les langues disposant de préréglages de registre intégrés. Pour ajouter une langue non répertoriée, incluez son code BCP-47 dans votre configuration :

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

Le LLM effectuera la traduction en utilisant ses connaissances acquises lors de son entraînement sur cette langue. La définition d'un `register` vous donne le contrôle sur le ton, la formalité et les conventions orthographiques. Consultez la section [Configuration](/docs/getting-started/configuration) pour obtenir plus de détails.

---

## Language Cards

Chaque langue intégrée possède une **Language Card** — une configuration JSON structurée et divisée en deux niveaux pour des raisons de performances :

### Architecture à Deux Niveaux

| Niveau | Répertoire | Chargement | Objectif |
|------|-----------|--------|--------|
| **Exécution (Runtime)** | `lib/data/language-cards/` | Anticipé lors de `import` | Moteur de traduction : registres, formalité, règles, prise en charge des méthodes |
| **Référence** | `lib/data/language-reference/` | Paresseux (à la demande) | Documentation pour les développeurs : défis linguistiques, données encyclopédiques, ressources NLP |

Le niveau d'exécution reste de petite taille (~2 Ko/carte) afin que l'importation de rosetta ne charge pas des mégaoctets de données de documentation. Le niveau de référence est disponible via `getLanguageReference(code)` pour les outils, le site web et le dispositif d'évaluation.

### Champs de la Carte d'Exécution

| Champ | Contenu |
|-------|------------------|
| **`nativeName`** | Endonyme — le nom de la langue dans sa propre langue et son propre script (par exemple, ქართული, Runasimi) |
| **Système de formalité** | Distinction T-V (tutoiement/vouvoiement), niveaux de discours, keigo, particules, etc. |
| **Préréglages de registre** | Préréglages de prompts LLM nommés, spécifiques au caractère de la langue |
| **Prise en charge des méthodes** | Quelles API de traduction prennent en charge cette langue |
| **Directives de genre** | Règles de genre grammatical et conseils pour l'écriture inclusive |
| **Script/direction** | Code de script ISO 15924 et sens de lecture (RTL/LTR) |
| **Règles** | Typographie (guillemets, espacement), majuscules, catégories de pluriel |
| **Jeux de données d'évaluation** | Quels benchmarks couvrent cette langue |
| **`glottocode`** | Identifiant Glottolog canonique pour les références croisées |
| **`humanReviewed`** | Indique si la carte a été révisée par un locuteur natif |

### Champs de la Carte de Référence

| Champ | Contenu |
|-------|------------------|
| **Défis linguistiques** | Pièges spécifiques à la traduction automatique (par exemple, l'évidentialité, les diacritiques tonaux, l'agglutination) |
| **Encyclopédique** | Famille de langues, classification, nombre de locuteurs, régions |
| **Ressources** | Outils NLP, corpus parallèles, modèles pré-entraînés |

### Génération d'une Nouvelle Language Card

Utilisez le générateur pour créer la structure des deux niveaux à partir de sources de données faisant autorité (IANA, CLDR, Glottolog) :

```bash
# Preview what would be generated
node scripts/generate-language-card.mjs sw --dry-run

# Generate both runtime + reference cards
node scripts/generate-language-card.mjs sw
```

Le générateur remplit automatiquement les métadonnées (codes, script, direction, pluriels, guillemets, prise en charge des méthodes, famille de langues) et marque les champs nécessitant un jugement linguistique comme TODO (à faire) pour une curation humaine.

### Utilisation des Clés de Préréglage

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

Rosetta résout la clé pour obtenir le prompt de registre complet. Exécutez `npx i18n-rosetta init` pour voir les préréglages disponibles pour chaque langue.

### Exemples de Préréglages

| Langue | Préréglages | Par Défaut |
|----------|---------|--------|
| Français | `formal-vous`, `casual-tu` | `formal-vous` |
| Coréen | `polite-haeyo`, `formal-hapsyo`, `casual-hae` | `polite-haeyo` |
| Japonais | `polite`, `formal-keigo`, `casual` | `polite` |
| Allemand | `formal-Sie`, `casual-du` | `formal-Sie` |
| Thaï | `neutral-professional`, `polite-male`, `polite-female` | `neutral-professional` |
| Espagnol | `neutral-professional`, `formal-usted`, `casual-tuteo` | `neutral-professional` |

Consultez la section [Contribuer à une Language Card](https://github.com/gamedaysuits/i18n-rosetta) pour obtenir les spécifications complètes, y compris la validation des champs et la liste de contrôle pour les requêtes de tirage (PR).

---

## Voir Aussi

- [Configuration](/docs/getting-started/configuration) — référence complète de la configuration, y compris la configuration des langues
- [Méthodes de Traduction](/docs/guides/translation-methods) — fonctionnement de chaque méthode
- [Convertisseurs de Script](/docs/concepts/script-converters) — pipeline de conversion de script déterministe
- [Langues Construites, Scripts et Orthographe](/docs/guides/conlangs-scripts-orthography) — polices PUA, Unicode, ajout de langues construites
- [Soutenir une Langue à Faibles Ressources](https://mtevalarena.org/docs/community/low-resource-languages) — création de méthodes pour les langues sous-représentées