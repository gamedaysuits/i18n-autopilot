# i18n-rosetta

[![npm version](https://img.shields.io/npm/v/i18n-rosetta.svg)](https://www.npmjs.com/package/i18n-rosetta)
[![CI](https://github.com/gamedaysuits/i18n-rosetta/actions/workflows/ci.yml/badge.svg)](https://github.com/gamedaysuits/i18n-rosetta/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

🌐 **Traductions du README** — *traduites par rosetta, bien sûr :*
[Français](docs/README.fr.md) · [Deutsch](docs/README.de.md) · [Español](docs/README.es.md) · [Português](docs/README.pt.md) · [Nederlands](docs/README.nl.md) · [日本語](docs/README.ja.md) · [한국어](docs/README.ko.md) · [简体中文](docs/README.zh.md) · [ไทย](docs/README.th.md) · [Tiếng Việt](docs/README.vi.md) · [Filipino](docs/README.fil.md) · [العربية](docs/README.ar.md)

Traduisez vos fichiers de localisation avec une seule commande :

```bash
npx i18n-rosetta sync
```

Rosetta détecte automatiquement vos fichiers de localisation, leur format et les langues cibles. Il traduit les clés manquantes, ignore ce qui est déjà fait et écrit les résultats. C'est tout.

## Pourquoi ne pas simplement le scripter vous-même ?

Vous pourriez écrire un script rapide qui parcourt vos clés anglaises et appelle Google Translate. La plupart des développeurs le font — cela prend environ 30 lignes. Voici pourquoi cela échoue :

- **Pas de détection de changement.** Lorsque vous mettez à jour une chaîne anglaise, la traduction reste obsolète pour toujours. Rosetta suit chaque valeur source avec des hachages SHA-256 et ne retraduit que ce qui a changé.
- **Pas de batching.** Un appel API par clé signifie 200 clés = 200 allers-retours. Rosetta effectue un batching intelligent (configurable, par défaut 30 clés/batch pour LLM, 128 pour Google).
- **Pas de porte qualité.** La traduction automatique hallucine, renvoie la source ou produit un résultat dans le mauvais script. Rosetta valide chaque traduction avant de l'écrire — les scripts incorrects, l'inflation de longueur et les échos de source sont détectés et rejetés.
- **Pas de connaissance du format.** Codé en dur pour JSON ? Rosetta gère JSON, TOML, YAML et Hugo Markdown (frontmatter + corps) avec détection automatique.
- **Pas de sécurité.** Rosetta protège contre la pollution de prototype, la traversée de chemin via des codes de localisation malveillants et la corruption de blocs de code lors de la traduction Markdown.

Rosetta est la version de production de ce script.

## Démarrage rapide

```bash
npm install --save-dev i18n-rosetta
```

### Obtenir une clé API

Rosetta a besoin d'un backend de traduction. Choisissez-en un :

| Fournisseur | Clé | Idéal pour |
|----------|-----|----------|
| **OpenRouter** (recommandé) | `OPENROUTER_API_KEY` | Projets à fort contenu, Markdown, plus de 200 modèles |
| **OpenAI** | `OPENAI_API_KEY` | Accès direct à GPT-4o |
| **Anthropic** | `ANTHROPIC_API_KEY` | Accès direct à Claude |
| **Gemini** | `GEMINI_API_KEY` | Tier gratuit disponible |
| **DeepL** | `DEEPL_API_KEY` | Langues européennes, support de glossaire |
| **Google Translate** | `GOOGLE_TRANSLATE_API_KEY` | Plus de 130 langues, gros volumes |

**Démarrage le plus rapide** (gratuit) : Inscrivez-vous sur [aistudio.google.com](https://aistudio.google.com/apikey) pour une clé Gemini gratuite :

```bash
export GEMINI_API_KEY=AI...
npx i18n-rosetta sync --method gemini
```

**OpenRouter** (plus de 200 modèles) : Inscrivez-vous sur [openrouter.ai](https://openrouter.ai), puis :

```bash
export OPENROUTER_API_KEY=sk-or-v1-...
npx i18n-rosetta sync
```

Alternative à **Google Translate** (paires clé-valeur uniquement — pas de connaissance Markdown) :

```bash
export GOOGLE_TRANSLATE_API_KEY=...
npx i18n-rosetta sync --method google-translate
```

> **Note** : Si seule `GOOGLE_TRANSLATE_API_KEY` est définie, rosetta bascule automatiquement sur Google Translate. Aucun changement de configuration n'est nécessaire. Utilise directement l'API REST — pas de SDK, pas de compte de service, pas de `pip install`. Juste la clé.

C'est tout. Pour plus de contrôle, créez un fichier de configuration :

```bash
npx i18n-rosetta init                        # guided wizard — walks you through registers, methods, and content
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific languages and default registers
```

Chaque langue est livrée avec des **préréglages de registre** — des instructions de ton/formalité pré-construites et adaptées à son système linguistique (vouvoiement pour le français, Siezen pour l'allemand, です/ます pour le japonais, 해요체 pour le coréen). L'assistant d'initialisation vous permet de parcourir et de choisir des préréglages, ou de passer `--yes` pour accepter les valeurs par défaut.

### Source non anglaise

Si votre langue source n'est pas l'anglais :

```bash
i18n-rosetta sync --source fr                      # CLI flag
```

Ou définissez-le de manière permanente dans votre configuration :

```json
{ "inputLocale": "fr" }
```

## Ce qu'il fait

Vous gérez le framework i18n (next-intl, i18next, Hugo). Rosetta gère les fichiers de traduction.

- **Multi-format** — JSON, TOML, YAML, Hugo Markdown (front matter + corps), et XLIFF 1.2
- **Incrémentiel** — Ne traduit que ce qui a changé (suivi des hachages SHA-256)
- **Mis en cache** — La mémoire de traduction stocke les résultats précédents ; la resynchronisation ne coûte rien pour les clés inchangées
- **Porte qualité** — Valide chaque traduction : détecte les hallucinations, les sorties de script incorrectes, les échos de source et l'inflation de longueur
- **Conscient du contenu** — Les méthodes LLM protègent les blocs de code, les shortcodes, les liens et les variables d'interpolation lors de la traduction Markdown
- **Outils de pipeline** — `lint`, `audit`, `integrity`, `seo` pour les portes CI
- **Interopérabilité XLIFF** — Exportez les traductions pour une révision professionnelle dans des outils TAO (memoQ, SDL Trados, Phrase), importez-les
- **Zéro dépendances** — Uniquement les modules intégrés de Node.js. Pas de SDK, pas de modules natifs. Nécessite Node 20+

## Au-delà de Google Translate

Le démarrage rapide vous permet de fonctionner avec un LLM ou Google Translate. Mais Google Translate prend en charge environ 130 langues. Il y en a plus de 7 000.

**L'idée centrale de Rosetta : la méthode de traduction est configurable par paire de langues.** Utilisez Google Translate pour le français, un LLM avec un coaching morphologique pour le cri des Plaines, et une API hébergée par la communauté pour le quechua — le tout dans le même projet, le tout avec la même CLI.

```json
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "google-translate" },
    "en:ja": { "method": "llm" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

Si vous pouvez trouver comment traduire une paire de langues — par l'ingénierie de prompt, des dictionnaires communautaires, des pipelines FST ou des modèles affinés — rosetta vous permet d'empaqueter cette méthode en tant que plugin et de la déployer avec tout le reste.

> Né de la traduction d'un site web de production en cri des Plaines, où aucune API prête à l'emploi n'existe. L'architecture par paire n'est pas théorique — elle existe parce qu'un projet avait besoin de Google Translate pour le français et d'un pipeline FST coaché pour une langue autochtone, fonctionnant côte à côte dans la même commande de synchronisation.

Le [MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness) compagnon vous permet de comparer et d'évaluer les approches de traduction, puis d'exporter les méthodes de travail en tant que plugins rosetta. Toute personne parlant les deux langues peut développer, tester et partager une méthode de traduction — aucune plateforme propriétaire n'est requise.

### Choisissez votre méthode

Rosetta prend en charge 10 méthodes de traduction. Chaque paire de langues peut utiliser une méthode différente.

**Fournisseurs LLM** — idéal pour la qualité, compatible Markdown, compatible coaching :

| Méthode | Clé | Ce qu'elle fait |
|--------|-----|-------------|
| `llm` (par défaut) | `OPENROUTER_API_KEY` | LLM via OpenRouter — plus de 200 modèles, routage automatique |
| `llm-coached` | `OPENROUTER_API_KEY` | LLM + règles de grammaire, dictionnaires, notes de style |
| `openai` | `OPENAI_API_KEY` | API OpenAI directe (gpt-4o, gpt-4o-mini) |
| `anthropic` | `ANTHROPIC_API_KEY` | API Anthropic directe (Claude Sonnet, Haiku, Opus) |
| `gemini` | `GEMINI_API_KEY` | API Google Gemini directe (Flash, Pro) — tier gratuit disponible |

**TA traditionnelle** — idéal pour la vitesse, le coût et les paires clé-valeur à grand volume :

| Méthode | Clé | Ce qu'elle fait |
|--------|-----|-------------|
| `google-translate` | `GOOGLE_TRANSLATE_API_KEY` | API Google Cloud Translation v2 (plus de 130 langues) |
| `deepl` | `DEEPL_API_KEY` | API DeepL avec support de glossaire (plus de 30 langues) |
| `microsoft-translator` | `MICROSOFT_TRANSLATOR_API_KEY` | Azure Cognitive Services Translator (plus de 100 langues) |
| `libretranslate` | *(auto-hébergé)* | LibreTranslate auto-hébergé (AGPL, gratuit) |

**Infrastructure** — pour les points de terminaison personnalisés ou hébergés par la communauté :

| Méthode | Clé | Ce qu'elle fait |
|--------|-----|-------------|
| `api` | *(par fournisseur)* | Client HTTP léger pour tout point de terminaison REST |

```bash
# Force a specific method for one run
i18n-rosetta sync --method deepl

# Or configure per pair
```

```json
{
  "pairs": {
    "en:fr": { "method": "deepl" },
    "en:ja": { "method": "openai", "model": "gpt-4o" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

> **Note** : Les méthodes de TA traditionnelles (Google Translate, DeepL, Microsoft Translator, LibreTranslate) gèrent bien les paires clé-valeur mais ne peuvent pas traduire en toute sécurité le contenu Markdown. Pour les projets à fort contenu, les méthodes LLM sont recommandées — elles protègent explicitement les blocs de code, les shortcodes et les variables d'interpolation.

## Plugins

Les plugins sont des recettes de traduction pré-packagées pour des paires de langues spécifiques. Ce sont des manifestes JSON — pas du code — qui indiquent à rosetta quelle méthode utiliser, avec quels paramètres, et quelle qualité a été évaluée.

```bash
i18n-rosetta plugin install ./french-formal-v1/    # install from directory
i18n-rosetta plugin list                           # see installed plugins
i18n-rosetta plugin remove french-formal-v1        # uninstall
i18n-rosetta status                                # shows quality tiers + benchmarks
```

Voir [docs/METHOD_PLUGIN_SPEC.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/METHOD_PLUGIN_SPEC.md) pour le format du manifeste.

## Commandes

| Commande | Objectif |
|---------|---------|
| `init` | Assistant de configuration interactif (ou `--yes` pour les valeurs par défaut rapides) |
| `sync` | Traduire et synchroniser tous les fichiers de localisation |
| `watch` | Synchronisation automatique lors des modifications de fichiers |
| `audit` | Signaler les localisations incomplètes (porte CI) |
| `lint` | Trouver les chaînes codées en dur dans le code source |
| `wrap` | Envelopper automatiquement les chaînes codées en dur dans les appels `t()` (avec annulation) |
| `seo` | Générer hreflang, sitemap.xml ou schéma JSON-LD |
| `integrity` | Vérifier la corruption des placeholders, l'encodage et l'exhaustivité des pluriels ICU |
| `status` | Afficher la configuration des paires, les méthodes, les registres et les niveaux de qualité |
| `provenance` | Auditer la licence des ressources de traduction |
| `plugin` | Installer, supprimer ou lister les plugins de méthode |
| `fonts` | Télécharger des polices web pour les convertisseurs de scripts PUA |
| `tm` | Gérer le cache de la mémoire de traduction (statistiques, effacer, par locale) |
| `xliff` | Exporter/importer XLIFF 1.2 pour la révision par un traducteur professionnel |

Exécutez `i18n-rosetta <command> --help` pour une aide détaillée sur n'importe quelle commande.

Référence complète : [docs/CLI_REFERENCE.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/CLI_REFERENCE.md)

## Configuration

Créez `i18n-rosetta.config.json` ou exécutez `i18n-rosetta init` :

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "model": "google/gemini-3.5-flash",
  "pairs": {
    "en:fr": { "qualityTier": "high" },
    "en:ja": { "method": "google-translate" }
  }
}
```

| Option | Par défaut | Description |
|--------|---------|-------------|
| `inputLocale` | `"en"` | Code de la langue source |
| `localesDir` | `"./locales"` | Chemin vers les fichiers de localisation |
| `contentDir` | `null` | Répertoire de contenu Hugo (active la traduction Markdown) |
| `format` | `"auto"` | Format de fichier : `json`, `toml`, `yaml` ou `auto` |
| `model` | `"google/gemini-3.5-flash"` | Modèle OpenRouter par défaut |
| `defaultMethod` | `"llm"` | Méthode de traduction par défaut (remplacée par le drapeau `--method`) |
| `batchSize` | `30` | Clés par lot de traduction |
| `pairs` | `{}` | Remplacements de méthode, de modèle et de qualité par paire |

**Remplacements par langue** : Chaque langue possède une [Fiche linguistique](docs/planning/LANGUAGE_CARD_SPEC.md) — l'une des 50 fiches sélectionnées contenant des préréglages de registre, des systèmes de formalité, des règles typographiques et des indicateurs de prise en charge des méthodes. Les fiches utilisent une [architecture à deux niveaux](website/docs/concepts/architecture.md) (exécution + référence) pour des performances à grande échelle. Créez une nouvelle fiche avec `node scripts/generate-language-card.mjs <code>`. Utilisez les clés de préréglage comme raccourci, ou écrivez un texte de registre personnalisé :

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
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

**Mode zéro-config** : Pas de fichier de configuration ? Rosetta détecte automatiquement les fichiers de localisation, le format et les langues cibles de votre projet.

Les valeurs de langue peuvent être une clé de préréglage (par exemple, `"casual-tu"`), un texte de registre personnalisé ou un objet (contrôle total). Les remplacements au niveau de la paire dans `pairs` ont priorité sur les paramètres au niveau de la langue. Exécutez `npx i18n-rosetta init` pour parcourir les préréglages disponibles pour chaque langue.

Guides de configuration du framework : [docs/INTEGRATION_GUIDES.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/INTEGRATION_GUIDES.md)

## Durcissement

- **Retrait exponentiel** — 3 tentatives avec jitter sur les erreurs 429/5xx
- **Délai d'attente de 30s** — AbortController empêche le blocage
- **Validation de la réponse** — n'accepte que les clés qui ont été envoyées pour traduction
- **Porte qualité** — détecte les boucles d'hallucination, les sorties de script incorrectes, l'inflation de longueur et les échos de source
- **Cascade de réessais** — en cas d'échec d'analyse JSON, réessaie le lot → demi-lot → clés individuelles (plafonnées par budget via `maxRetries`)
- **Mémoire de traduction** — `.rosetta/tm.json` met en cache les traductions indexées par texte source + locale + méthode ; les clés inchangées sont servies à partir du cache lors des synchronisations ultérieures, éliminant les appels API redondants
- **Mise en cache des prompts** — la séparation des messages système/utilisateur permet la mise en cache au niveau du fournisseur, réduisant le coût des jetons sur les lots
- **Application de la terminologie** — les traductions coachées sont vérifiées par rapport aux termes du dictionnaire après la réponse du LLM
- **Protection contre la pollution de prototype** — bloque `__proto__`, `constructor`, `prototype`
- **Confinement du chemin** — les écritures de fichiers sont validées pour rester dans les répertoires configurés
- **Protection des blocs** — les blocs de code, les shortcodes, le HTML sont protégés pendant la traduction de contenu
- **Fallback explicite** — `--fallback` écrit des placeholders préfixés par `[EN]` lorsque l'API est indisponible (resynchronisez avec une clé pour de vraies traductions)
- **Succès partiel** — un lot échoué ne bloque pas le reste

## Tests

```bash
npm test                         # all tests
npm run test:unit                # core sync pipeline
npm run test:redteam             # adversarial edge cases
npm run test:format              # TOML/YAML adapters
npm run test:content             # Markdown content parser
npm run test:hugo                # full Hugo E2E
npm run test:lint                # hardcoded string detection
npm run test:pairs               # pair graph resolution
npm run test:methods             # translation method suite
```

**Zéro dépendances.**

## Licence

MIT