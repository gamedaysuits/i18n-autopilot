---
sidebar_position: 7
title: "Comparaison"
---
# Comparaison de Rosetta

i18n-rosetta occupe une catégorie différente de la plupart des outils de localisation. Voici une comparaison impartiale.

## Le panorama

La plupart des outils de localisation se classent dans l'une des trois catégories suivantes :

| Catégorie | Exemples | Modèle |
|----------|----------|-------|
| **Plateformes TMS cloud** | Crowdin, Phrase, Locize, Tolgee | Tableau de bord SaaS + traducteurs humains + abonnement mensuel |
| **Outils d'extraction de clés** | i18next-scanner, FormatJS CLI | Analyse du code source pour les appels de fonctions de traduction |
| **Moteurs de traduction CLI** | **i18n-rosetta** | Exécution dans votre projet, traduction directe des fichiers, aucun compte cloud |

Rosetta est un **moteur de traduction CLI** — il traduit vos fichiers de paramètres régionaux directement à l'aide de backends configurables (LLMs, Google Translate, plugins personnalisés). Aucun tableau de bord cloud, aucun flux de travail pour traducteurs humains, aucuns frais mensuels.

---

## Comparaison des fonctionnalités

| Fonctionnalité | i18n-rosetta | Crowdin | Phrase | Locize |
|---------|:------------:|:-------:|:------:|:------:|
| **Exécution locale (sans compte cloud)** | ✅ | ❌ | ❌ | ❌ |
| **Zéro dépendance** | ✅ | ❌ | ❌ | ❌ |
| **Configuration de la méthode par paire** | ✅ | ❌ | ❌ | ❌ |
| **Registres de langue personnalisés** | ✅ | ❌ | ❌ | ❌ |
| **Sensible au contenu (protège les blocs de code)** | ✅ | ❌ | ❌ | ❌ |
| **Conversion de langues construites et de scripts** | ✅ | ❌ | ❌ | ❌ |
| **Architecture de plugins** | ✅ | ❌ | ❌ | ❌ |
| **Traduction de Markdown / contenu** | ✅ | ✅ | ✅ | ❌ |
| **Mémoire de traduction** | ✅ | ✅ | ✅ | ✅ |
| **Exportation/importation XLIFF** | ✅ | ✅ | ✅ | ❌ |
| **Validation des pluriels ICU** | ✅ | ✅ | ✅ | ❌ |
| **Application de la terminologie** | ✅ | ✅ | ✅ | ❌ |
| **Flux de travail pour traducteurs humains** | Basé sur XLIFF | ✅ | ✅ | ✅ |
| **Édition en contexte (visuelle)** | ❌ | ✅ | ✅ | ✅ |
| **Collaboration en équipe** | ❌ | ✅ | ✅ | ✅ |
| **Prise en charge des formats de fichiers** | JSON, TOML, YAML, MD, XLIFF | 50+ | 40+ | JSON |
| **Tarification** | Gratuit (paiement de votre LLM) | À partir de 0 $/mois | À partir de 0 $/mois | À partir de 0 $/mois |

---

## Quand utiliser Rosetta

**Rosetta est une solution adaptée lorsque :**

- Vous souhaitez intégrer la traduction automatique dans votre pipeline de compilation — et non comme un flux de travail séparé
- Vous avez besoin d'un contrôle de méthode par langue (LLM pour certaines, Google Translate pour d'autres, plugins personnalisés pour le reste)
- Vous traduisez vers des langues ne disposant d'aucune couverture API (langues autochtones, menacées, construites)
- Vous souhaitez une production de script déterministe (Cree Syllabics, Klingon pIqaD, Tengwar)
- Vous souhaitez éviter tout enfermement propriétaire et toute dépendance au cloud
- Vous êtes un développeur indépendant ou une petite équipe n'ayant pas besoin d'un tableau de bord TMS complet
- Vous souhaitez un transfert basé sur XLIFF vers des traducteurs professionnels sans abonnement cloud

**Un TMS cloud est une solution plus adaptée lorsque :**

- Vous disposez de traducteurs humains professionnels révisant chaque chaîne (le flux de travail XLIFF de rosetta est plus simple qu'un TMS complet)
- Vous avez besoin d'une mémoire de traduction inter-projets et d'une gestion de glossaire
- Vous avez besoin d'une édition visuelle en contexte (prévisualisation des traductions dans votre interface utilisateur)
- Vous avez une grande équipe avec des besoins de contrôle d'accès basé sur les rôles
- Vous avez besoin de la prise en charge de plus de 50 formats de fichiers

---

## Ce que Rosetta fait et que personne d'autre ne fait

### 1. Registres personnalisés

Chaque paire de langues reçoit des instructions de ton culturellement appropriées pour le LLM :

```json
{
  "de": {
    "register": "Standard professional register. Use Sie-form for formal address."
  },
  "tl": {
    "register": "Educated Manila Taglish. Use Tagalog as the primary language but keep technical terms in English."
  },
  "tlh": {
    "register": "Warrior's honor. OVS grammar. Use Marc Okrand vocabulary."
  }
}
```

Aucun autre outil n'est fourni avec 47 registres de langue préconfigurés, ni ne vous permet d'en définir des personnalisés par projet.

### 2. Convertisseurs de scripts déterministes

Rosetta intègre cinq convertisseurs de scripts qui s'exécutent en tant que crochets (hooks) post-traduction — aucun LLM n'est requis :

| Paramètre régional | Conversion | Exemple |
|--------|-----------|---------|
| `crk` | SRO → Cree Syllabics | `nêhiyawêwin` → `ᓀᐦᐃᔭᐍᐏᐣ` |
| `sr` | Latin → Cyrillique | `Beograd` → `Београд` |
| `tlh` | Romanisation → pIqaD | `tlhIngan Hol` → (glyphes pIqaD) |
| `x-elvish-s` | Latin → Tengwar | Sindarin → Tengwar (Mode de Beleriand) |
| `x-kryptonian` | Latin → Kryptonian | Substitution par chiffrement (nécessite une police) |

Il s'agit de convertisseurs basés sur de pures tables de correspondance — déterministes, auditables, avec un risque nul d'hallucination du LLM.

### 3. Protection sensible au contenu

Lors de la traduction de Markdown ou de contenu riche, Rosetta protège :

- Les blocs de code délimités (` ``` `)
- Le code en ligne (`` ` ` ``)
- Les codes courts Hugo (`{{</* */>}}`, `{{%/* */%}}`)
- Les variables d'interpolation (`{{ .Count }}`, `{name}`, `{{t('key')}}`)
- Les blocs HTML bruts

Ceux-ci sont remplacés par des jetons sentinelles Unicode avant la traduction et restaurés par la suite. Le LLM ne voit jamais votre code, vos codes courts ou vos variables.

### 4. Plugins de méthode encadrée

Pour les langues ne disposant d'aucune couverture API, vous pouvez concevoir une méthode de traduction encadrée :

1. Rédiger des données d'encadrement linguistique (règles de grammaire, vocabulaire, exemples)
2. Les regrouper sous forme de plugin
3. L'évaluer par rapport à des traductions de référence à l'aide de l'[outil d'évaluation](https://github.com/gamedaysuits/gds-mt-eval-harness)
4. L'installer dans votre projet avec `i18n-rosetta plugin install`

C'est ainsi que rosetta gère le Plains Cree — et c'est ainsi que vous pouvez gérer n'importe quelle langue, y compris celles qui n'existent pas encore.

---

## En conclusion

Rosetta ne remplace pas Crowdin. Il s'agit d'un outil différent pour un flux de travail différent. Si vous avez besoin de traducteurs humains, utilisez un TMS. Si vous avez besoin d'une CLI qui traduit vos fichiers en une seule commande et vous offre un contrôle par langue sur les méthodes, les modèles et les registres — utilisez rosetta.