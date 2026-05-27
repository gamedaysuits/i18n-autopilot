---
sidebar_position: 1
title: "Architecture"
---
# Architecture

L'écosystème de traduction Rosetta se compose de trois outils indépendants qui collaborent par le biais de contrats bien définis. Aucun d'entre eux ne dépend des autres au moment de la compilation. Ils communiquent via un **format de plugin de méthode** partagé et un **contrat d'API REST**.

## Les trois composants

```mermaid
graph TB
    subgraph Research["Eval Harness (Research)"]
        H["gds-mt-eval-harness\nPython / standalone"]
    end
    subgraph Production["i18n-rosetta (Developer Tool)"]
        R["i18n-rosetta\nNode.js / npm\nZero dependencies"]
    end
    subgraph Service["Rosetta Translate (Planned)"]
        T["Metered API service\nHosts IP-protected methods"]
    end
    H -->|"method.json\n+ coaching data"| R
    T -->|"REST API\nPOST /v1/translate"| R
    H -->|"Deploy methods"| T
```

### i18n-rosetta (ce projet)

L'outil de développement open-source. Il traduit les fichiers de paramètres régionaux à l'aide de méthodes enfichables. Zéro dépendance, configuration facultative, prêt à l'emploi.

**Méthodes intégrées :**
- `llm` → OpenRouter / tout LLM (plus de 200 modèles)
- `llm-coached` → LLM + guidage grammatical/dictionnaire
- `openai` → API OpenAI directe (GPT-4o, GPT-4o-mini)
- `anthropic` → API Anthropic directe (Claude Sonnet, Haiku, Opus)
- `gemini` → API Google Gemini directe (Flash, Pro — niveau gratuit disponible)
- `google-translate` → Google Cloud Translation API v2
- `deepl` → API DeepL avec prise en charge des glossaires
- `microsoft-translator` → Azure Cognitive Services Translator
- `libretranslate` → LibreTranslate auto-hébergé (AGPL, gratuit)
- `api` → Canal léger vers tout point de terminaison REST distant

### Eval Harness (projet compagnon)

Un outil de recherche pour développer, tester et évaluer les méthodes de traduction. Lorsqu'une méthode atteint une qualité acceptable, le *harness* exporte un **plugin de méthode** — un manifeste `method.json` et des fichiers de données de guidage facultatifs.

Le *harness* ne s'exécute jamais au sein de rosetta. Il s'agit d'un outil distinct qui produit des sorties statiques (fichiers JSON). Rosetta se contente de lire ces fichiers.

[→ Eval Harness sur GitHub](https://github.com/gamedaysuits/gds-mt-eval-harness)

### Rosetta Translate (prévu)

Un service d'API facturé à l'usage qui héberge des méthodes de traduction propriétaires côté serveur — les invites (*prompts*), les données de guidage et les pipelines linguistiques ne quittent jamais le serveur.

## Leurs interconnexions

### Eval Harness → i18n-rosetta (exportation unidirectionnelle)

```mermaid
flowchart LR
    A["Run benchmarks"] --> B["Export method.json"]
    B --> C["rosetta plugin install"]
    C --> D["Plugin saved to\n.rosetta/methods/"]
    D --> E["rosetta sync"]
```

**Contrat** : [Spécification du plugin](/docs/reference/plugin-spec)

### Rosetta Translate → i18n-rosetta (API à l'exécution)

```mermaid
flowchart LR
    A["rosetta sync"] --> B["APIMethod.translate()"]
    B --> C["POST /v1/translate"]
    C --> D["Server loads coaching data"]
    D --> E["Server calls LLM"]
    E --> F["Returns translations"]
```

Le `APIMethod` de Rosetta est un **canal passif** (*dumb pipe*). Il envoie des clés et reçoit des traductions en retour. Il ne contient aucune logique de traduction et aucun contenu propriétaire.

## Ce que chaque composant sait des autres

| Outil | Connaît rosetta ? | Connaît Rosetta Translate ? | Connaît le *harness* ? |
|------|---------------------|-------------------------------|---------------------|
| **i18n-rosetta** | *(est rosetta)* | Oui — la méthode `api` l'appelle | Non — lit uniquement les exportations de plugins |
| **Rosetta Translate** | Oui — traite ses requêtes | *(est Rosetta Translate)* | Non — reçoit les méthodes déployées |
| **Eval Harness** | Oui — exporte le format de plugin | Non — méthodes déployées séparément | *(est le harness)* |

## Scénarios d'utilisation

### Scénario 1 : Gratuit, sans configuration (la plupart des utilisateurs)

```bash
export OPENROUTER_API_KEY=sk-...
npx i18n-rosetta sync
```

Utilise la méthode intégrée `llm`. Aucun plugin, aucun Rosetta Translate, aucun *harness*.

### Scénario 2 : Base de référence Google Translate

```bash
export GOOGLE_TRANSLATE_API_KEY=AIza...
npx i18n-rosetta sync
```

Utilise la méthode intégrée `google-translate`. Aucun plugin nécessaire.

### Scénario 3 : Plugin ouvert avec guidage inclus

```bash
rosetta plugin install ./french-formal-v1/
rosetta sync
```

Le plugin possède `type: "llm-coached"` → rosetta utilise la propre clé OpenRouter de l'utilisateur. Les données de guidage sont locales (aucun appel serveur).

### Scénario 4 : Guidage personnalisé (DIY) (aucun plugin, aucun *harness*)

```json title="i18n-rosetta.config.json"
{
  "pairs": {
    "en:fr": { "method": "llm-coached" }
  }
}
```

L'utilisateur maintient ses propres règles de grammaire et son dictionnaire dans `.rosetta/coaching/fr.json`.

## Fiches de langue

Chaque langue dans rosetta est configurée par le biais d'une **Fiche de langue** (*Language Card*) — un fichier JSON contenant des préréglages de registre, des règles de formalité, des indicateurs de prise en charge des méthodes et des conventions typographiques. Les fiches de langue constituent la configuration propre à chaque langue qui pilote la traduction orientée par le registre.

```mermaid
graph LR
    subgraph Cards["Language Cards (lib/data/)"]
        RT["Runtime Tier<br/>language-cards/*.json<br/>~2 KB each"]
        RF["Reference Tier<br/>language-reference/*.json<br/>~3 KB each"]
    end
    RT -->|"Eager load at import"| R["i18n-rosetta<br/>translate()"]
    RF -->|"Lazy load on demand"| W["Website / Harness<br/>getLanguageReference()"]
```

Les fiches sont divisées en deux niveaux pour des raisons de performances à grande échelle (ciblant plus de 700 langues) :

- **Niveau d'exécution** (`language-cards/`) : Chargé de manière anticipée — les champs dont le moteur de traduction a besoin (registres, formalité, prise en charge des méthodes, règles typographiques).
- **Niveau de référence** (`language-reference/`) : Chargé à la demande — documentation pour les développeurs (défis linguistiques, famille de langues, ressources en traitement du langage naturel).

Les deux niveaux sont générés à partir de sources faisant autorité (IANA, CLDR, Glottolog) à l'aide de `scripts/generate-language-card.mjs`, puis révisés par des humains pour en garantir l'exactitude linguistique.

## Principes de conception

1. **Aucune dépendance circulaire.** Les ponts sont unidirectionnels.
2. **Rosetta est le cœur léger.** Zéro dépendance, configuration facultative. Les plugins et l'API sont additifs.
3. **La protection de la propriété intellectuelle est architecturale.** Les techniques propriétaires restent côté serveur. Le paquet npm ne livre aucun élément propriétaire.
4. **Le format du plugin est le contrat.** Tout transite par `method.json`.
5. **Chaque outil a une fonction unique.** Le *harness* → développer des méthodes. Rosetta Translate → héberger des méthodes. Rosetta → traduire des fichiers.

---

## Voir aussi

- [Méthodes de traduction](/docs/guides/translation-methods) — comment fonctionne chaque méthode intégrée
- [Spécification du plugin](/docs/reference/plugin-spec) — le format du manifeste method.json
- [Eval Harness](https://mtevalarena.org/docs/specifications/harness) — l'outil de recherche compagnon
- [Servir une méthode via API](/docs/guides/serving-a-method) — héberger des pipelines de traduction personnalisés
- [Prendre en charge une langue à faibles ressources](https://mtevalarena.org/docs/community/low-resource-languages) — le cas d'utilisation qui a motivé cette architecture