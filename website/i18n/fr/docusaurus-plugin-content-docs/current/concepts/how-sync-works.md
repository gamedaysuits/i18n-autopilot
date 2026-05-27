---
sidebar_position: 2
title: "Comment fonctionne la synchronisation"
---
# Fonctionnement de la synchronisation

La commande `sync` est l'opération principale de rosetta. Voici ce qui se produit lorsque vous exécutez `npx i18n-rosetta sync`.

## Aperçu du pipeline

```mermaid
flowchart TD
    A["Load config\n+ resolve pairs"] --> B["Scan source locale\n(flatten nested keys)"]
    B --> C["Load lock file\n(.i18n-rosetta.lock)"]
    C --> D["Diff: find missing,\nstale, and fallback keys"]
    D --> TM{"TM lookup"}
    TM -->|Hits| TC["Serve from cache"]
    TM -->|Misses| E{"Keys to translate?"}
    E -->|No| F["Done ✓"]
    E -->|Yes| G["Batch keys\n(default 30/batch)"]
    G --> H["Translate batch\n(method-specific)"]
    H --> I["Quality gate\n(validate each key)"]
    I --> TERM["Terminology check\n(coached pairs)"]
    TERM --> J{"All pass?"}
    J -->|Yes| K["Write to locale file"]
    J -->|Failures| L["Retry cascade:\nfull → half → individual"]
    L --> H
    TC --> I
    K --> TMS["Store new entries\nin TM"]
    TMS --> M["Update lock file\n(SHA-256 hashes)"]
    M --> N["Next pair"]
```

## Étape par étape

### 1. Résolution de la configuration

Rosetta charge `i18n-rosetta.config.json` (ou détecte automatiquement les paramètres). Il résout :
- La locale source et les locales cibles
- Le graphe des paires (quelles combinaisons source→cible traiter)
- Les paramètres de méthode, de modèle et de qualité par paire

### 2. Analyse de la source

Le fichier de la locale source est chargé et mis à plat dans une table d'association clé→valeur :

```json
// Input (nested)
{ "hero": { "title": "Welcome", "subtitle": "Build" } }

// Flattened
{ "hero.title": "Welcome", "hero.subtitle": "Build" }
```

### 3. Détection des modifications

Rosetta lit `.i18n-rosetta.lock`, qui stocke les hachages SHA-256 des valeurs sources précédemment traduites. Pour chaque clé, il vérifie :

| Condition | Action |
|-----------|--------|
| Clé absente de la cible | **Traduire** |
| Le hachage source a changé depuis la dernière synchronisation | **Retraduire** (obsolète) |
| La valeur cible commence par `[EN]` | **Retraduire** (espace réservé de repli) |
| Hachage source inchangé, la clé existe | **Ignorer** |

C'est pourquoi rosetta ne traduit que ce qui a changé — il ne retraduit pas l'intégralité de votre fichier à chaque synchronisation.

### 4. Mise en lots

Les clés sont regroupées en lots (par défaut : 30 clés/lot pour les LLM, 128 pour Google Translate). La mise en lots réduit les allers-retours avec l'API tout en gardant des prompts gérables.

### 4b. Mémoire de traduction

Avant la mise en lots, rosetta vérifie le cache de la mémoire de traduction (`.rosetta/tm.json`). Les clés dont le texte source + la locale + la méthode correspondent à une traduction précédente sont servies instantanément depuis le cache — aucun appel d'API n'est nécessaire.

```
  [TM] 142 key(s) served from cache
  Translating 3 key(s) to French (llm)... [OK]
```

La mémoire de traduction (TM) est le principal mécanisme de réduction des coûts. Relancer la synchronisation après la modification d'une seule clé ne traduit que cette clé, et non le fichier entier. Consultez [Mémoire de traduction](/docs/concepts/translation-memory) pour plus de détails.

Pour contourner le cache lors d'une exécution unique : `i18n-rosetta sync --no-tm`

### 5. Traduction

Chaque lot est envoyé à la méthode de traduction configurée :

- **`llm`** : Prompt structuré vers OpenRouter avec des instructions sur le registre et des directives de genre
- **`llm-coached`** : Identique, mais avec l'injection de règles de grammaire, d'un dictionnaire et de notes de style
- **`google-translate`** : Requête par lots vers l'API Google Cloud Translation v2
- **`api`** : Requête HTTP POST vers un point de terminaison distant

Le message système (registre, directives de genre, règles) est identique d'un lot à l'autre pour une locale donnée, ce qui permet la **mise en cache des prompts** (prompt caching) — les fournisseurs tels qu'Anthropic et Google mettent en cache les messages systèmes répétés, réduisant ainsi les coûts en tokens.

### 6. Contrôle de qualité

Chaque traduction est validée avant d'être écrite sur le disque. Cinq vérifications sont effectuées :

| Vérification | Ce qu'elle détecte | Exemple |
|-------|----------------|---------|
| **Vide/blanc** | Le modèle n'a rien renvoyé | `""` |
| **Écho de la source** | Le modèle a renvoyé l'entrée en anglais | `"Welcome"` pour le japonais |
| **Boucle d'hallucination** | Trigrammes répétés | `"Qo' Qo' Qo' Qo'"` |
| **Inflation de la longueur** | La sortie est plus de 4 fois plus longue que la source | Source de 10 caractères → sortie de 50 caractères |
| **Conformité du système d'écriture** | Alphabet incorrect pour la locale | Texte latin pour une locale arabe |

Les échecs sont consignés avec un préfixe `[GATE]`. Il n'y a pas de solution de repli silencieuse.

Consultez [Contrôle de qualité](/docs/concepts/quality-gate) pour plus de détails.

### 6b. Vérification de la terminologie

Pour les paires encadrées (coached) disposant d'un dictionnaire, rosetta vérifie si le LLM a effectivement utilisé la terminologie requise après la traduction. Les violations sont consignées sous forme d'avertissements `[TERM]` :

```
[TERM] en→fr: 2 term violation(s)
  • "dashboard" → expected "tableau de bord" but got "panneau"
```

Il s'agit d'avertissements et non d'erreurs bloquantes — la traduction est tout de même écrite.

### 7. Cascade de nouvelles tentatives

En cas d'échec de l'analyse JSON ou d'erreurs au niveau du lot, rosetta effectue de nouvelles tentatives avec des lots de plus en plus petits :

```
Full batch (30 keys) → Failed
Half batch (15 keys) → Failed
Individual keys (1 each) → Isolates the problem key
```

Le budget de nouvelles tentatives est plafonné par `maxRetries` (par défaut : 3) afin d'éviter des dépenses incontrôlées en tokens.

### 8. Écriture et verrouillage

Les traductions validées sont écrites dans le fichier de la locale cible, en préservant la structure d'imbrication d'origine. Le fichier de verrouillage (lock file) est mis à jour avec les nouveaux hachages SHA-256.

## Traduction de contenu (Phase 2)

Pour les projets Docusaurus et Hugo, `sync` exécute une seconde phase après la traduction des clés JSON. Cette phase traduit les fichiers Markdown et MDX (documentation, articles de blog, tutoriels) en utilisant les mêmes méthodes et le même contrôle de qualité.

### Comment cela fonctionne

1. Rosetta découvre tous les fichiers de contenu sources (`.md`, `.mdx`) en parcourant le répertoire content/docs
2. Pour chaque paire fichier × locale, il vérifie les modifications de hachage SHA-256 dans un fichier de verrouillage de contenu distinct (`.i18n-rosetta-content.lock`)
3. Les fichiers modifiés ou manquants sont rassemblés dans un pool d'éléments de travail plat
4. Le pool est traité avec une **concurrence parallèle** (par défaut : 12 appels d'API simultanés)

```
Phase 2: content (79 translations to process, 341 skipped, concurrency: 12)

    [1/79] (1%)  docs/concepts/security.md → ja [RE-TRANSLATE] (~3328s left)
    [2/79] (3%)  docs/concepts/security.md → th [RE-TRANSLATE] (~1821s left)
    ...
    [79/79] (100%) blog/v3-2-quality.md → de [OK]

  [OK] Created 79 content file(s), 341 unchanged
```

### Parallélisme par pool plat

Contrairement à la Phase 1 (clés JSON, séquentielles par locale), la Phase 2 traite toutes les combinaisons fichier × locale sous forme de liste plate. Cela signifie que différents fichiers et différentes locales sont traduits simultanément :

- `docs/configuration.md → fr` et `docs/cli.md → ja` s'exécutent en même temps
- Un corpus de 420 traductions se termine en environ 11 minutes avec une concurrence de 12
- Des écritures incrémentielles du manifeste toutes les 10 complétions évitent la perte de progression si le processus est interrompu

Contrôlez le parallélisme avec `--concurrency` ou le champ de configuration `concurrency` :

```bash
# Faster (more parallel calls, higher API load)
npx i18n-rosetta sync --concurrency 20

# Slower (gentler on rate limits)
npx i18n-rosetta sync --concurrency 4
```

### Protection du contenu

Pendant la traduction, rosetta protège le contenu non traduisible :

- **Les blocs de code** (délimités et indentés) sont remplacés par des espaces réservés
- **Les champs du frontmatter** qui ne figurent pas dans la liste `translatableFields` sont préservés tels quels
- **Les liens**, les chemins d'images et les balises HTML sont protégés
- **Les shortcodes** et les variables d'interpolation (par ex., `{count}`, `{{.Params.title}}`) sont protégés

Après la traduction, tous les espaces réservés sont restaurés et validés. S'il en manque ou s'ils sont corrompus, la traduction est rejetée et une nouvelle tentative est effectuée.

## Succès partiel

L'échec d'un lot ne bloque pas le reste. Si 9 lots sur 10 réussissent, ces 9 lots sont écrits. Le lot ayant échoué est consigné, et vous pouvez réexécuter `sync` pour réessayer.

## Exécution à blanc

Prévisualisez ce qui changerait sans écrire aucun fichier :

```bash
npx i18n-rosetta sync --dry-run
```

## Forcer la retraduction

Forcez la retraduction de clés spécifiques même si elles sont inchangées :

```bash
npx i18n-rosetta sync --force-keys "hero.title,nav.about"
```

## Estimation des coûts

Avant de traduire, rosetta génère un **rapport de coûts de pré-synchronisation** indiquant les coûts estimés par paire. Cela s'exécute automatiquement lors de chaque `sync` — vous le voyez avant que tout appel d'API ne soit effectué.

```
╔══════════════════════════════════════════════════════════╗
║  Cost Estimate                                          ║
╠════════════╦═══════╦════════════╦════════════════════════╣
║ Pair       ║ Keys  ║ Est. Cost  ║ Method                 ║
╠════════════╬═══════╬════════════╬════════════════════════╣
║ en → fr    ║   142 ║ $0.07      ║ google-translate       ║
║ en → ja    ║    38 ║   —        ║ llm (model-dependent)  ║
║ en → crk   ║    38 ║   —        ║ llm-coached            ║
╚════════════╩═══════╩════════════╩════════════════════════╝
```

### Ce qui est estimé

Chaque méthode de traduction fournit sa propre estimation des coûts :

| Méthode | Base de coût | Précision |
|--------|-----------|-----------|
| `google-translate` | Tarif publié par Google (20 $/million de caractères) | Précise |
| `llm` | Varie selon le modèle OpenRouter | Dépend du modèle — consultez la [tarification d'OpenRouter](https://openrouter.ai/models) |
| `llm-coached` | Identique à `llm` plus les tokens de contexte d'encadrement (coaching) | Dépend du modèle |
| `api` | Déterminé par le serveur | Inconnue — impossible à estimer sans interroger le point de terminaison |

Lorsqu'une méthode ne peut pas déterminer le coût (méthodes LLM, API distantes), rosetta indique `—` plutôt que de deviner. Utilisez `--dry` pour voir les estimations de coûts sans effectuer de traduction réelle.

---

## Voir aussi

- [Référence de la CLI — sync](/docs/reference/cli#sync) — indicateurs et options de commande
- [Mémoire de traduction](/docs/concepts/translation-memory) — mise en cache et réduction des coûts
- [Contrôle de qualité](/docs/concepts/quality-gate) — comment les traductions sont validées
- [Méthodes de traduction](/docs/guides/translation-methods) — comment fonctionne chaque méthode
- [Travailler avec des traducteurs professionnels](/docs/guides/professional-translators) — flux de travail XLIFF
- [Configuration](/docs/getting-started/configuration) — référence de la configuration
- [Guide CI/CD](/docs/guides/ci-cd) — automatisation des synchronisations dans votre pipeline