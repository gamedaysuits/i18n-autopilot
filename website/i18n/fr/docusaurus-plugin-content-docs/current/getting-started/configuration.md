---
sidebar_position: 3
title: "Configuration"
---
# Configuration

Rosetta fonctionne sans configuration (zero-config) — il détecte automatiquement les fichiers de paramètres régionaux (locale files), le format et les langues cibles de votre projet. Pour plus de contrôle, créez `i18n-rosetta.config.json` à la racine de votre projet, ou exécutez :

```bash
npx i18n-rosetta init
```

## Référence complète de la configuration

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "contentDir": null,
  "translatableFields": null,
  "format": "auto",
  "model": "google/gemini-3.5-flash",
  "defaultMethod": "llm",
  "batchSize": 80,
  "jsonConcurrency": 200,
  "contentConcurrency": 48,
  "fallbackPrefix": "[EN] ",
  "apiKeyEnvVar": "OPENROUTER_API_KEY",
  "baseUrl": "",
  "pairs": {},
  "languages": {},
  "lint": {
    "srcDir": null,
    "ignore": ["node_modules", ".next", "dist"],
    "minLength": 2
  },
  "seo": {
    "urlPattern": "/:locale/:path",
    "pages": null
  },
  "typegen": {
    "output": null,
    "autoGenerate": false
  }
}
```

:::note typegen n'est pas encore implémenté
Le bloc de configuration `typegen` est reconnu et conservé par le chargeur de configuration, mais la génération de types TypeScript n'est pas encore implémentée. Il s'agit d'un espace réservé pour une fonctionnalité prévue. La définition de ces valeurs n'a aucun effet.
:::

### Champs

| Champ | Type | Par défaut | Description |
|-------|------|---------|-------------|
| `version` | `number` | `3` | Version du schéma de configuration. Toujours `3`. |
| `inputLocale` | `string` | `"en"` | Code de la langue source (BCP 47). |
| `localesDir` | `string` | `"./locales"` | Chemin vers les fichiers de paramètres régionaux. Rosetta analyse ce répertoire. |
| `contentDir` | `string` | `null` | Répertoire de contenu Hugo. Active la traduction du corps des fichiers Markdown. |
| `translatableFields` | `string[]` | `null` | Remplace les champs frontmatter traduisibles par défaut pour la traduction de contenu. `null` utilise les valeurs par défaut intégrées (`title`, `description`, `summary`). |
| `format` | `string` | `"auto"` | Format de fichier : `json`, `toml`, `yaml`, ou `auto` (détecté à partir de l'extension). |
| `model` | `string` | `"google/gemini-3.5-flash"` | Modèle par défaut pour les méthodes LLM. Le format dépend de la méthode : OpenRouter utilise `provider/model` (par ex., `google/gemini-3.5-flash`) ; les fournisseurs directs utilisent des noms simples (par ex., `gpt-4o`, `gemini-2.5-flash`). |
| `defaultMethod` | `string` | `"llm"` | Méthode de traduction par défaut : `llm`, `llm-coached`, `google-translate`, `deepl`, `microsoft-translator`, `libretranslate`, `openai`, `anthropic`, `gemini`, `api`. Remplacée par l'indicateur CLI `--method`. |
| `batchSize` | `number` | `80` | Clés par lot de traduction. Plus élevé = moins d'appels API, mais des invites (prompts) plus volumineuses. |
| `jsonConcurrency` | `number` | `200` | Nombre maximal de traductions parallèles de paramètres régionaux pour la synchronisation des clés JSON. Remplacé par l'indicateur CLI `--json-concurrency`. |
| `contentConcurrency` | `number` | `48` | Nombre maximal d'appels API parallèles pour la traduction de contenu (Markdown/MDX). Remplacé par l'indicateur CLI `--content-concurrency`. |
| `fallbackPrefix` | `string` | `"[EN] "` | Préfixe de marqueur utilisé par `audit` et `verify` pour détecter les anciennes valeurs non traduites des exécutions précédentes. Rosetta n'écrit pas ce préfixe — il le lit uniquement à des fins de détection. |
| `apiKeyEnvVar` | `string` | `"OPENROUTER_API_KEY"` | Nom de la variable d'environnement pour la clé API. Remplacement pour les noms de variables d'environnement personnalisés. |
| `baseUrl` | `string` | `""` | URL de base pour la génération d'artefacts SEO (hreflang, sitemaps, JSON-LD). |
| `pairs` | `object` | `{}` | Remplacements de méthode, de modèle et de qualité par paire. Voir [Configuration des paires](#pair-configuration). |
| `languages` | `object` | `{}` | Remplacements par langue. Voir [Configuration des langues](#language-configuration). |
| `lint.srcDir` | `string` | `null` | Répertoire source pour l'analyse lint. `null` = détection automatique à partir du framework. |
| `lint.ignore` | `string[]` | `["node_modules", ...]` | Modèles glob à exclure de l'analyse lint. |
| `lint.minLength` | `number` | `2` | Longueur minimale de la chaîne pour être signalée comme codée en dur. |
| `seo.urlPattern` | `string` | `"/:locale/:path"` | Modèle de motif d'URL pour la génération de balises hreflang. |
| `seo.pages` | `string[]` | `null` | Liste explicite de pages pour le SEO. `null` = détection automatique à partir des clés de paramètres régionaux. |
| `typegen.output` | `string` | `null` | Chemin de sortie pour les types TypeScript générés. `null` = désactivé. |
| `typegen.autoGenerate` | `boolean` | `false` | Régénération automatique des types après chaque synchronisation. |

## Configuration des paires

Chaque paire source→cible peut être configurée indépendamment :

```json
{
  "pairs": {
    "en:fr": {
      "method": "google-translate",
      "qualityTier": "high"
    },
    "en:ja": {
      "method": "llm",
      "model": "google/gemini-2.5-pro"
    },
    "en:crk": {
      "methodPlugin": "crk-coached-v1"
    }
  }
}
```

### Champs de paire

| Champ | Type | Description |
|-------|------|-------------|
| `method` | `string` | Méthode de traduction : `llm`, `llm-coached`, `google-translate`, `deepl`, `microsoft-translator`, `libretranslate`, `openai`, `anthropic`, `gemini`, `api` |
| `methodPlugin` | `string` | Nom d'un plugin installé (à partir de `.rosetta/methods/`) |
| `model` | `string` | Remplace le modèle par défaut pour cette paire |
| `endpoint` | `string` | URL du point de terminaison de l'API distante. Requis lorsque `method` est `api`. |
| `qualityTier` | `string` | Niveau d'affichage : `standard`, `high`, `research`, `verified` |

## Configuration des langues

Les langues acceptent trois formats :

### Tableau de codes (le plus simple)

```json
{
  "languages": ["fr", "de", "ja"]
}
```

Chaque langue obtient son registre par défaut à partir de la table des registres intégrée. Les langues sans valeur par défaut obtiennent `"Professional register."`.

### Objet avec chaînes de registre

La valeur peut être une **clé prédéfinie** (preset key) de la fiche de la langue, ou un texte de registre personnalisé :

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "Custom: Polite Japanese for a gaming app."
  }
}
```

Rosetta vérifie si la chaîne correspond à une clé prédéfinie dans la fiche de la langue. Si c'est le cas, l'invite de registre complète de la fiche est utilisée. Sinon, la chaîne est utilisée telle quelle. Consultez les [Langues prises en charge](/docs/reference/supported-languages#language-cards) pour connaître les préréglages disponibles.

### Objet avec configuration complète

```json
{
  "languages": {
    "crk": {
      "name": "Plains Cree",
      "register": "SRO syllabics with grammatical precision.",
      "model": "google/gemini-2.5-pro",
      "batchSize": 5,
      "maxRetries": 5,
      "script": "cans"
    }
  }
}
```

Vous pouvez mélanger des objets abrégés et complets dans le même bloc.

### Champs de langue

| Champ | Type | Description |
|-------|------|-------------|
| `register` | `string` | Instructions de style/ton. Peut être une **clé prédéfinie** (par ex., `casual-tu`, `formal-hapsyo`) ou un texte personnalisé. Voir les [Fiches de langues](/docs/reference/supported-languages#language-cards). |
| `name` | `string` | Nom de la langue lisible par l'homme (pour l'affichage du statut) |
| `model` | `string` | Remplace le modèle par défaut |
| `batchSize` | `number` | Remplace la taille de lot par défaut |
| `maxRetries` | `number` | Budget de tentatives maximal pour les lots échoués (par défaut : 3) |
| `script` | `string` | Code d'écriture ISO 15924. Déclenche la validation de l'écriture dans la barrière de qualité (quality gate). |

:::info Chaîne d'héritage
Les paramètres sont résolus dans cet ordre (le premier l'emporte) :

**niveau de la paire** → **niveau de la langue** → **configuration globale** → **valeurs par défaut**

Par exemple, si `pairs["en:fr"]` définit `model`, cela remplace à la fois les valeurs `model` au niveau de la langue et au niveau global.
:::

## Source non anglophone

Si votre langue source n'est pas l'anglais :

```bash
# CLI flag (one-time)
npx i18n-rosetta sync --source fr
```

```json title="i18n-rosetta.config.json (permanent)"
{
  "inputLocale": "fr"
}
```

## Fichier de verrouillage (Lock File)

Rosetta crée `.i18n-rosetta.lock` pour suivre les hachages SHA-256 des valeurs sources traduites. **Validez (commit) ce fichier** afin que tous les développeurs partagent la même base de traduction.

Lorsqu'une valeur source change, le hachage ne correspond plus, et Rosetta retraduit cette clé lors de la prochaine synchronisation.

## `.rosettaignore`

Créez `.rosettaignore` à la racine de votre projet pour exclure des fichiers de l'analyse `lint`. Utilise des modèles glob, comme `.gitignore` :

```text title=".rosettaignore"
src/components/legacy/**
src/utils/constants.js
**/*.test.js
```

## Répertoire `.rosetta/`

Rosetta crée un répertoire `.rosetta/` à la racine de votre projet pour l'état interne. Vous devriez généralement **l'ajouter à `.gitignore`** — il s'agit d'une optimisation locale, et non de la source du projet :

```gitignore
.rosetta/
```

| Fichier | Objectif | Valider (Commit) ? |
|------|---------|--------|
| `tm.json` | Cache de la mémoire de traduction — stocke les traductions précédentes indexées par texte source + paramètres régionaux + méthode | Non (cache local) |
| `xliff/*.xliff` | Fichiers d'exportation XLIFF pour la révision par des traducteurs professionnels | Non (éphémère) |
| `methods/` | Manifestes des plugins de méthode installés | Oui (configuration partagée) |
| `backups/` | Sauvegardes de pré-encapsulation (créées par `wrap --undo`) | Non (filet de sécurité) |

Consultez la [Mémoire de traduction](/docs/concepts/translation-memory) pour plus de détails sur `tm.json` et la manière dont elle permet de réduire les coûts d'API.

---

## API programmatique

Pour les scripts de compilation et les intégrations personnalisées, importez directement depuis le paquet :

```javascript
import { GeminiMethod, runSync, resolveConfig } from 'i18n-rosetta';

// Use a method class directly
const gemini = new GeminiMethod();
const result = await gemini.translate(
  ['greeting', 'farewell'],
  { greeting: 'Hello', farewell: 'Goodbye' },
  { target: 'fr', name: 'French', register: 'formal', model: 'gemini-2.5-flash' },
  { cwd: process.cwd() }
);
// result = { greeting: 'Bonjour', farewell: 'Au revoir' }
```

### Exportations disponibles

| Exportation | Ce qu'elle fait |
|--------|-------------|
| `TranslationMethod` | Classe de base pour toutes les méthodes |
| `LLMMethod` | Classe de base pour les méthodes LLM (OpenRouter) |
| `DirectLLMMethod` | Classe de base pour les fournisseurs LLM directs (OpenAI, Anthropic, Gemini) |
| `OpenAIMethod`, `AnthropicMethod`, `GeminiMethod` | Classes de fournisseurs LLM directs |
| `DeepLMethod`, `MicrosoftTranslatorMethod`, `LibreTranslateMethod` | Classes de traduction automatique (MT) traditionnelles |
| `GoogleTranslateMethod` | Google Cloud Translation |
| `LLMCoachedMethod` | LLM encadré (OpenRouter + données d'encadrement) |
| `APIMethod` | Client API distant |
| `runSync`, `runContentSync` | Pipeline de synchronisation complet |
| `resolveConfig`, `resolvePairs` | Résolution de la configuration |
| `validateTranslations` | Barrière de qualité (Quality gate) |
| `loadCoachingData`, `findDictionaryMatches` | Utilitaires d'encadrement (coaching) |

### Extension de fournisseur personnalisé

Étendez `DirectLLMMethod` pour ajouter un nouveau fournisseur LLM en environ 40 lignes :

```javascript
import { DirectLLMMethod } from 'i18n-rosetta';

class MistralMethod extends DirectLLMMethod {
  constructor(options) {
    super(options);
    this.name = 'mistral';
  }
  _getApiKeyEnvVar()     { return 'MISTRAL_API_KEY'; }
  _getApiKeyOptionsKey() { return 'mistralApiKey'; }
  _getDefaultModel()     { return 'mistral-large-latest'; }
  _getProviderLabel()    { return 'Mistral'; }

  _buildApiRequest({ prompt, systemMessage, apiKey, model, temperature }) {
    return {
      url: 'https://api.mistral.ai/v1/chat/completions',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: {
        model,
        messages: [
          ...(systemMessage ? [{ role: 'system', content: systemMessage }] : []),
          { role: 'user', content: prompt },
        ],
        temperature,
      },
    };
  }

  _extractResponseText(json) {
    return json.choices?.[0]?.message?.content;
  }

  // Optional but recommended: provider-specific setup help when translation fails
  getSetupHelp() {
    if (!process.env.MISTRAL_API_KEY) {
      return [
        '',
        '  ┌─ Missing API Key ─────────────────────────────────────────────┐',
        '  │ Mistral requires an API key from https://console.mistral.ai   │',
        '  │ Run: export MISTRAL_API_KEY=...                               │',
        '  └────────────────────────────────────────────────────────────────┘',
      ];
    }
    return ['        API key is set but translation failed. Check your Mistral dashboard.'];
  }
}
```

Vous bénéficiez gratuitement de la traduction, de l'encadrement (coaching), des boucles de nouvelles tentatives, de la validation des modèles, des niveaux de qualité et de l'aide à la configuration. Seule la forme de la requête HTTP est spécifique au fournisseur. Pour les adaptateurs non-LLM qui utilisent `fetch()` brut, utilisez l'assistant partagé `fetchWithRetry()` de `lib/methods/fetch-with-retry.js` au lieu d'écrire votre propre boucle de nouvelles tentatives.

---

## Voir aussi

- [Référence de la CLI](/docs/reference/cli) — toutes les commandes et tous les indicateurs
- [Méthodes de traduction](/docs/guides/translation-methods) — choisir et combiner les méthodes
- [Mémoire de traduction](/docs/concepts/translation-memory) — mise en cache et réduction des coûts
- [Travailler avec des traducteurs professionnels](/docs/guides/professional-translators) — flux de travail XLIFF
- [Spécification des plugins](/docs/reference/plugin-spec) — format du manifeste des plugins de méthode
- [Architecture](/docs/concepts/architecture) — comment les éléments s'articulent
- [Langues prises en charge](/docs/reference/supported-languages) — prise en charge linguistique intégrée
- [Fonctionnement de la synchronisation](/docs/concepts/how-sync-works) — le pipeline de traduction