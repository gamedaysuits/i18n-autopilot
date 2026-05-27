---
sidebar_position: 1
title: "Référence CLI"
---
# Référence de la CLI

## Commandes

```
i18n-rosetta init              Interactive setup wizard (--yes for quick defaults)
i18n-rosetta sync              Translate & sync all locale files
i18n-rosetta watch             Auto-sync when the source file changes
i18n-rosetta audit             List all untranslated [EN] fallback values
i18n-rosetta lint              Scan source code for hardcoded strings
i18n-rosetta wrap              Auto-wrap hardcoded strings in t() calls (with undo)
i18n-rosetta seo <sub>         Generate hreflang, sitemap.xml, or JSON-LD schema
i18n-rosetta integrity         Audit locale files for format/encoding issues
i18n-rosetta status            Show pair configuration, plugins, and quality tiers
i18n-rosetta provenance        Audit translation resource licensing
i18n-rosetta plugin <sub>      Manage method plugins (install, remove, list)
i18n-rosetta fonts <sub>       Download web fonts for PUA script converters
i18n-rosetta tm <sub>          Manage Translation Memory cache (stats, clear)
i18n-rosetta xliff <sub>       Export/import XLIFF 1.2 for professional review
```

Exécutez `i18n-rosetta <command> --help` pour obtenir une aide détaillée sur n'importe quelle commande.

## Options globales

```
--help, -h              Show help (global or per-command)
--version, -v           Print version and exit
--yes, -y               Skip interactive prompts, use defaults
--config <path>         Custom config file path
--dir <path>            Override locales directory
--content-dir <path>    Hugo/Docusaurus content directory for Markdown translation
--source <code>         Override source locale (default: en)
--model <model>         Override translation model
--method <method>       Translation method: llm, google-translate (default: from config)
--format <fmt>          Locale file format: json, toml, yaml, or auto
--dry, --dry-run        Preview changes without writing files
--concurrency <n>       Max parallel API calls for content translation (default: 12)
--force-content         Re-translate all content files (clears content lock)
--force-keys <keys>     Comma-separated dot-notation keys to force re-translate
--no-tm                 Skip Translation Memory cache for this sync run
--locale <code>         Target locale (xliff export, tm clear)
```

---

## init

Assistant de configuration interactif qui crée `i18n-rosetta.config.json`. Il vous guide dans le choix des paramètres régionaux sources, des langues cibles, du format de fichier et du modèle de traduction.

```bash
i18n-rosetta init                          # interactive wizard
i18n-rosetta init --yes                    # skip wizard, use defaults
i18n-rosetta init --yes --langs fr,de,ja   # quick setup with specific languages
i18n-rosetta init --source en --dir ./i18n # overrides with defaults
```

**Option `--langs`** : Liste de codes de langues cibles séparés par des virgules. Ignore l'invite de sélection de la langue et applique les préréglages de registre par défaut pour chaque langue. À combiner avec `--yes` pour une configuration entièrement non interactive.

**Préréglages de langue** : Lorsque vous êtes invité à sélectionner les langues cibles, vous pouvez saisir les noms des préréglages :
- `european` → fr, de, es, it, pt, nl
- `asian` → ja, zh, ko
- `global` → fr, es, de, ja, zh, ko, pt, ar
- `nordic` → da, fi, nb, sv

Mélangez les préréglages et les codes individuels : `european, ja` → fr, de, es, it, pt, nl, ja

---

## sync

Traduit les clés manquantes, obsolètes et de secours dans tous les fichiers de paramètres régionaux.

```bash
i18n-rosetta sync                                   # translate everything
i18n-rosetta sync --dry-run                         # preview only
i18n-rosetta sync --force-keys "hero.title"         # force re-translate
i18n-rosetta sync --force-keys "a.title,a.subtitle" # multiple keys
i18n-rosetta sync --force-content                   # re-translate all Markdown/MDX
i18n-rosetta sync --content-dir ./content           # include Hugo Markdown
i18n-rosetta sync --method google-translate          # force Google Translate
i18n-rosetta sync --concurrency 20                  # 20 parallel API calls
i18n-rosetta sync --fallback                         # write [EN] prefixes on failure
i18n-rosetta sync --no-tm                            # skip cache, fresh API calls
```

**Mémoire de traduction** : Par défaut, `sync` charge `.rosetta/tm.json` et fournit les traductions mises en cache pour les valeurs sources inchangées. Utilisez `--no-tm` pour contourner le cache (utile lors du changement de fournisseur de traduction ou du débogage de la qualité). Consultez [Mémoire de traduction](/docs/concepts/translation-memory).

**Détection des modifications** : rosetta stocke les hachages SHA-256 dans `.i18n-rosetta.lock`. Lorsque les valeurs sources changent, la synchronisation suivante retraduit automatiquement ces clés. Validez (commit) le fichier de verrouillage afin que tous les développeurs partagent la même base de référence.

**Parallélisme** : La traduction de contenu (Markdown, MDX, articles de blog) s'exécute dans un pool d'éléments de travail plat avec une concurrence configurable. La valeur par défaut est de 12 appels d'API parallèles. Remplacez cette valeur avec `--concurrency` ou le champ de configuration `concurrency`. La traduction des clés JSON s'exécute de manière séquentielle par paramètre régional (suffisamment rapide pour que le parallélisme n'apporte aucun avantage).

---

## watch

Synchronisation automatique lorsque le fichier de paramètres régionaux source est modifié. S'exécute jusqu'à ce qu'elle soit interrompue par `Ctrl+C`.

```bash
i18n-rosetta watch
```

---

## audit

Répertorie toutes les valeurs de secours non traduites préfixées par `[EN]`. Se termine avec le code 1 si des valeurs sont trouvées — à utiliser comme barrière d'intégration continue (CI) pour faire échouer les compilations dont les traductions sont incomplètes.

```bash
i18n-rosetta audit
```

---

## lint

Analyse le code source à la recherche de chaînes de caractères codées en dur destinées aux utilisateurs, qui devraient utiliser des appels de traduction i18n. Détecte automatiquement votre framework (next-intl, react-i18next, vue-i18n, Hugo).

```bash
i18n-rosetta lint                    # exits 1 if issues found
i18n-rosetta lint --warn-only        # always exits 0
i18n-rosetta lint --src ./app        # custom source directory
i18n-rosetta lint --min-length 4     # minimum string length to flag
```

**Ce qu'elle détecte :**
- Les chaînes codées en dur dans le texte JSX, `placeholder`, `alt`, `aria-label`, `title`
- Les fichiers contenant du contenu destiné aux utilisateurs mais sans importation de framework i18n
- Les clés mortes — clés de paramètres régionaux qu'aucun fichier source ne référence
- Le score de couverture — pourcentage de chaînes passant par i18n

**Exclusions** : Créez `.rosettaignore` à la racine de votre projet (modèles glob, comme `.gitignore`).

---

## wrap

Enveloppe automatiquement les chaînes codées en dur détectées par `lint` dans des appels `t()`. Crée des sauvegardes automatiques avant de modifier les fichiers.

```bash
i18n-rosetta wrap                    # auto-wrap with backup
i18n-rosetta wrap --dry              # preview wrapping changes
i18n-rosetta wrap --undo             # restore from .rosetta-backup/
```

**Barrières de sécurité :**
1. Vérification de l'état propre de Git (ignorée lors d'une exécution à blanc)
2. Sauvegarde automatique vers `.rosetta-backup/`
3. Aperçu des différences (diff) avant chaque écriture de fichier
4. Prise en charge de `--undo` pour restaurer à partir d'une sauvegarde

---

## seo

Génère des artefacts SEO pour les sites multilingues.

```bash
i18n-rosetta seo hreflang                                        # print hreflang tags
i18n-rosetta seo sitemap --base-url https://example.com --out sitemap.xml
i18n-rosetta seo jsonld --base-url https://example.com           # JSON-LD schema
```

| Sous-commande | Sortie |
|------------|--------|
| `hreflang` | Balises `<link rel="alternate" hreflang>` |
| `sitemap` | `sitemap.xml` multilingue |
| `jsonld` | Schéma de langue JSON-LD WebSite |

---

## integrity

Détecte la corruption et la dérive dans les fichiers de paramètres régionaux traduits.

```bash
i18n-rosetta integrity               # exits 1 if issues found
i18n-rosetta integrity --warn-only   # non-blocking
```

**Ce qu'elle vérifie :**
- La corruption des espaces réservés (par exemple, `{name}` présent dans la source mais manquant dans la cible)
- Les problèmes d'encodage (mojibake, Unicode non valide)
- Les copies non traduites (valeur cible identique à la source)
- Les clés orphelines (clés dans la cible qui n'existent pas dans la source)
- L'exhaustivité des catégories du pluriel ICU MessageFormat (par exemple, l'arabe nécessite 6 catégories)

---

## tm

Gère le cache de la mémoire de traduction (`.rosetta/tm.json`). La mémoire de traduction (TM) stocke les traductions précédentes et les fournit lors des synchronisations ultérieures au lieu d'appeler l'API.

```bash
i18n-rosetta tm stats                  # show cache statistics
i18n-rosetta tm clear                  # clear cache (with confirmation)
i18n-rosetta tm clear --yes            # clear without confirmation
i18n-rosetta tm clear --locale fr      # clear only French entries
```

| Sous-commande | Sortie |
|------------|--------|
| `stats` | Nombre d'entrées, taille du fichier, répartition par paramètre régional |
| `clear` | Suppression du fichier de cache (complet ou par paramètre régional) |

| Option | Effet |
|--------|--------|
| `--locale <code>` | Effacer uniquement les entrées pour un paramètre régional |
| `--yes` | Ignorer l'invite de confirmation |

Consultez [Mémoire de traduction](/docs/concepts/translation-memory) pour savoir comment fonctionne la mémoire de traduction et quand l'effacer.

---

## xliff

Exporte et importe des fichiers XLIFF 1.2 pour la révision par des traducteurs professionnels. XLIFF est le format d'échange universel pris en charge par les outils de TAO tels que memoQ, SDL Trados et Phrase.

```bash
i18n-rosetta xliff export --locale fr                   # export French XLIFF
i18n-rosetta xliff export --locale ja --out ./review/   # custom output path
i18n-rosetta xliff import .rosetta/xliff/fr.xliff       # import reviewed file
i18n-rosetta xliff import ./reviewed.xliff --dry        # preview import
```

| Sous-commande | Sortie |
|------------|--------|
| `export` | Générer `.xliff` à partir des fichiers de paramètres régionaux sources et cibles |
| `import` | Fusionner les traductions `.xliff` révisées dans les fichiers de paramètres régionaux |

| Option | Effet |
|--------|--------|
| `--locale <code>` | Paramètre régional cible pour l'exportation (requis) |
| `--out <path>` | Chemin ou répertoire de sortie personnalisé |
| `--dry` | Prévisualiser l'importation sans écriture |

Consultez [Travailler avec des traducteurs professionnels](/docs/guides/professional-translators) pour le flux de travail complet.

---

## status

Affiche la configuration des paires, les plugins installés, les niveaux de qualité et les scores de référence.

```bash
i18n-rosetta status
```

---

## provenance

Audite les licences des ressources de traduction pour tous les plugins installés.

```bash
i18n-rosetta provenance
```

---

## plugin

Gère les plugins de méthodes de traduction. Les plugins sont des recettes de traduction pré-emballées installées dans `.rosetta/methods/`.

```bash
i18n-rosetta plugin list                      # show installed plugins
i18n-rosetta plugin install ./my-method/      # install from local directory
i18n-rosetta plugin remove crk-coached-v1     # remove a plugin
```

Consultez [Spécification des plugins](/docs/reference/plugin-spec) pour le format du manifeste de plugin.

---

## fonts

Télécharge et gère les polices Web PUA pour les convertisseurs d'écritures de langues construites. Les langues qui utilisent des caractères de la zone à usage privé (Klingon, Sindarin, Kryptonien) nécessitent des polices Web personnalisées pour afficher leurs écritures. Cette commande les télécharge à partir de dépôts open source vérifiés.

```bash
i18n-rosetta fonts list                           # show needed fonts
i18n-rosetta fonts install                        # download all needed fonts
i18n-rosetta fonts install --css                  # also generate CSS snippet
i18n-rosetta fonts install --dir ./public/fonts   # custom output directory
```

| Sous-commande | Sortie |
|------------|--------|
| `list` | Affiche les polices PUA nécessaires et leur statut d'installation |
| `install` | Télécharge les polices pour les langues configurées |

| Option | Effet |
|--------|--------|
| `--dir <path>` | Remplacer le répertoire de sortie des polices (détecté automatiquement à partir du type de projet) |
| `--css` | Générer un extrait `conlang-fonts.css` à côté des polices |
| `--config <path>` | Chemin vers le fichier de configuration (utilisé pour détecter quelles langues nécessitent des polices) |

**Détection automatique :** Le répertoire de sortie est déduit de la structure de votre projet :
- **Docusaurus** → `static/fonts/` ou `website/static/fonts/`
- **Hugo** → `static/fonts/`
- **Par défaut** → `public/fonts/`

**Les convertisseurs Unicode natifs** (`crk` → Syllabaire cri, `sr` → Cyrillique serbe) ne nécessitent PAS l'installation de polices.

Consultez [Langues construites, écritures et orthographe](/docs/guides/conlangs-scripts-orthography) pour obtenir tous les détails sur les polices PUA.

## Pipeline à trois couches

Utilisez `lint`, `sync` et `audit` ensemble pour une internationalisation (i18n) à toute épreuve :

```json title="package.json"
{
  "scripts": {
    "i18n:lint": "i18n-rosetta lint",
    "i18n:sync": "i18n-rosetta sync",
    "i18n:audit": "i18n-rosetta audit"
  }
}
```

| Couche | Commande | Quand | Objectif |
|-------|---------|------|---------|
| **Analyse (Lint)** | `lint` | Avant la validation (Pre-commit) | Bloquer les validations contenant des chaînes codées en dur |
| **Synchronisation (Sync)** | `sync` | Après la validation / CI | Traduire les clés manquantes et modifiées |
| **Audit** | `audit` | Étape de compilation | Faire échouer le déploiement si un paramètre régional est incomplet |

---

## Voir aussi

- [Configuration](/docs/getting-started/configuration) — référence du fichier de configuration
- [Méthodes de traduction](/docs/guides/translation-methods) — sélection de la méthode par paire
- [Mémoire de traduction](/docs/concepts/translation-memory) — mise en cache et réduction des coûts
- [Travailler avec des traducteurs professionnels](/docs/guides/professional-translators) — flux de travail XLIFF
- [Spécification des plugins](/docs/reference/plugin-spec) — format du manifeste de plugin
- [Guide CI/CD](/docs/guides/ci-cd) — automatisation des commandes de la CLI dans votre pipeline
- [Comment fonctionne la synchronisation](/docs/concepts/how-sync-works) — comprendre le pipeline de synchronisation
- [Barrière de qualité](/docs/concepts/quality-gate) — comment les traductions sont validées