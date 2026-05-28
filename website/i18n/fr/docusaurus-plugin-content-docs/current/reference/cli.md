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
i18n-rosetta verify            Verify translations are present and correct (CI gate)
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
--concurrency <n>       Max parallel API calls (sets both JSON and content, default: 48)
--json-concurrency <n>  Max parallel locale translations for JSON keys (default: 200)
--content-concurrency <n> Max parallel API calls for content translation (default: 48)
--force-content         Re-translate all content files (clears content lock)
--force-keys <keys>     Comma-separated dot-notation keys to force re-translate
--no-tm                 Skip Translation Memory cache for this sync run
--no-verify             Skip post-sync verification pass
--locale <code>         Target locale (xliff export, tm clear)
--quiet                 Errors and warnings only — suppress banner, progress bar, and info lines
--json                  Machine-readable NDJSON output — one JSON object per event
```

---

## init

Assistant de configuration interactif qui crée `i18n-rosetta.config.json`. Il vous guide à travers le choix de la langue source, des langues cibles, du format de fichier et du modèle de traduction.

```bash
i18n-rosetta init                          # interactive wizard
i18n-rosetta init --yes                    # skip wizard, use defaults
i18n-rosetta init --yes --langs fr,de,ja   # quick setup with specific languages
i18n-rosetta init --source en --dir ./i18n # overrides with defaults
```

**Option `--langs`** : Liste de codes de langues cibles séparés par des virgules. Ignore l'invite de sélection des langues et applique les préréglages de registre par défaut pour chaque langue. À combiner avec `--yes` pour une configuration entièrement non interactive.

**Préréglages de langues** : Lorsqu'on vous invite à sélectionner les langues cibles, vous pouvez saisir les noms des préréglages :
- `european` → fr, de, es, it, pt, nl
- `asian` → ja, zh, ko
- `global` → fr, es, de, ja, zh, ko, pt, ar
- `nordic` → da, fi, nb, sv

Mélangez les préréglages et les codes individuels : `european, ja` → fr, de, es, it, pt, nl, ja

---

## sync

Traduit les clés manquantes et obsolètes dans tous les fichiers de locales. Exécute une vérification post-synchronisation par défaut.

```bash
i18n-rosetta sync                                   # translate everything
i18n-rosetta sync --dry-run                         # preview only
i18n-rosetta sync --force-keys "hero.title"         # force re-translate
i18n-rosetta sync --force-keys "a.title,a.subtitle" # multiple keys
i18n-rosetta sync --force-content                   # re-translate all Markdown/MDX
i18n-rosetta sync --content-dir ./content           # include Hugo Markdown
i18n-rosetta sync --method google-translate          # force Google Translate
i18n-rosetta sync --concurrency 20                  # 20 parallel API calls (both phases)
i18n-rosetta sync --json-concurrency 30              # 30 parallel locale translations (JSON)
i18n-rosetta sync --content-concurrency 8            # 8 parallel content translations
i18n-rosetta sync --no-verify                        # skip post-sync verification
i18n-rosetta sync --no-tm                            # skip cache, fresh API calls
```

**Mémoire de traduction (Translation Memory)** : Par défaut, `sync` charge `.rosetta/tm.json` et fournit les traductions mises en cache pour les valeurs sources inchangées. Utilisez `--no-tm` pour contourner le cache (utile lors du changement de fournisseur de traduction ou pour le débogage de la qualité). Consultez [Mémoire de traduction](/docs/concepts/translation-memory).

**Détection des modifications** : rosetta stocke les hachages SHA-256 dans `.i18n-rosetta.lock`. Lorsque les valeurs sources changent, la synchronisation suivante retraduit automatiquement ces clés. Validez (commit) le fichier de verrouillage afin que tous les développeurs partagent la même base de référence.

**Parallélisme** : La traduction des clés JSON et la traduction du contenu s'exécutent en parallèle. Les locales JSON sont traduites simultanément (par défaut : 200 locales simultanées), les lots au sein de chaque locale étant également parallélisés (4 lots simultanés). La traduction de contenu (Markdown, MDX, articles de blog) s'exécute dans un pool d'éléments de travail plat (par défaut : 48 appels d'API simultanés). Remplacez ces valeurs avec `--json-concurrency`, `--content-concurrency` ou `--concurrency` (définit les deux).

**Sortie** : La synchronisation affiche une bannière de version, la détection du format/framework, une estimation des coûts et des barres de progression par locale :

```
i18n-rosetta v3.3.1

[INFO] Detected format: json (auto)
[INFO] Source: en.json (2,847 keys)
[INFO] Pairs: es-MX:llm, fr:deepl

[INFO] es-MX.json — 2,847 missing
     ████████████████████████████████ 2,847/2,847 keys
[INFO] fr.json — 2,847 missing
     ████████████████████████████████ 2,847/2,847 keys
[OK] Synced 5,694 keys total.
```

Les barres de progression se mettent à jour sur place après chaque lot (environ 80 clés). Utilisez `--quiet` pour n'afficher que les erreurs/avertissements, ou `--json` pour une sortie NDJSON lisible par machine. Les deux options suppriment la barre de progression et la bannière.

---

## watch

Synchronisation automatique lorsque le fichier de locale source est modifié. S'exécute jusqu'à ce qu'il soit interrompu par `Ctrl+C`.

```bash
i18n-rosetta watch
```

---

## audit

Répertorie toutes les valeurs de repli non traduites préfixées par `[EN]` issues des exécutions précédentes. Se termine avec le code 1 si l'une d'entre elles est trouvée — à utiliser comme porte de contrôle CI pour faire échouer les compilations (builds) dont les traductions sont incomplètes.

```bash
i18n-rosetta audit
```

---

## verify

Relit tous les fichiers de locales depuis le disque et vérifie que les traductions sont effectivement présentes et correctes. Il s'agit de la même vérification qui s'exécute automatiquement à la fin de chaque `sync` (à moins que `--no-verify` ne soit transmis).

```bash
i18n-rosetta verify                    # verify all locale files
i18n-rosetta verify --warn-only        # non-blocking
i18n-rosetta verify && echo "All good" # CI gate
```

**Ce qu'elle vérifie :**
- Parité des clés — toutes les clés sources sont présentes dans chaque cible
- Marqueurs de repli `[EN]` des exécutions précédentes
- Traductions vides
- Conformité des scripts — les locales non latines doivent avoir des traductions non ASCII
- Préservation des espaces réservés — les espaces réservés ICU correspondent à la source
- Problèmes d'encodage — marqueurs BOM, caractères invisibles
- Échos de la source — valeurs identiques à la source (avertissement)

---

## lint

Analyse le code source à la recherche de chaînes de caractères codées en dur destinées aux utilisateurs qui devraient utiliser des appels de traduction i18n. Détecte automatiquement votre framework (next-intl, react-i18next, vue-i18n, Hugo).

```bash
i18n-rosetta lint                    # exits 1 if issues found
i18n-rosetta lint --warn-only        # always exits 0
i18n-rosetta lint --src ./app        # custom source directory
i18n-rosetta lint --min-length 4     # minimum string length to flag
```

**Ce qu'elle détecte :**
- Chaînes codées en dur dans le texte JSX, `placeholder`, `alt`, `aria-label`, `title`
- Fichiers avec du contenu destiné aux utilisateurs mais sans importation de framework i18n
- Clés mortes — clés de locale qu'aucun fichier source ne référence
- Score de couverture — pourcentage de chaînes passant par i18n

**Exclusions** : Créez `.rosettaignore` à la racine de votre projet (motifs glob, comme `.gitignore`).

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
4. Prise en charge de `--undo` pour restaurer à partir de la sauvegarde

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

Détecte la corruption et la dérive dans les fichiers de locales traduits.

```bash
i18n-rosetta integrity               # exits 1 if issues found
i18n-rosetta integrity --warn-only   # non-blocking
```

**Ce qu'elle vérifie :**
- Corruption des espaces réservés (par exemple, `{name}` présent dans la source mais manquant dans la cible)
- Problèmes d'encodage (mojibake, Unicode invalide)
- Copies non traduites (valeur cible identique à la source)
- Clés orphelines (clés dans la cible qui n'existent pas dans la source)
- Exhaustivité des catégories de pluriel ICU MessageFormat (par exemple, l'arabe nécessite 6 catégories)

---

## tm

Gère le cache de la mémoire de traduction (`.rosetta/tm.json`). La MT (TM) stocke les traductions précédentes et les fournit lors des synchronisations ultérieures au lieu d'appeler l'API.

```bash
i18n-rosetta tm stats                  # show cache statistics
i18n-rosetta tm clear                  # clear cache (with confirmation)
i18n-rosetta tm clear --yes            # clear without confirmation
i18n-rosetta tm clear --locale fr      # clear only French entries
```

| Sous-commande | Sortie |
|------------|--------|
| `stats` | Nombre d'entrées, taille du fichier, répartition par locale |
| `clear` | Supprimer le fichier cache (complet ou par locale) |

| Option | Effet |
|--------|--------|
| `--locale <code>` | Effacer uniquement les entrées pour une locale |
| `--yes` | Ignorer l'invite de confirmation |

Consultez [Mémoire de traduction](/docs/concepts/translation-memory) pour comprendre le fonctionnement de la MT et savoir quand l'effacer.

---

## xliff

Exporte et importe des fichiers XLIFF 1.2 pour la révision par des traducteurs professionnels. XLIFF est le format d'échange universel pris en charge par les outils de TAO (CAT tools) tels que memoQ, SDL Trados et Phrase.

```bash
i18n-rosetta xliff export --locale fr                   # export French XLIFF
i18n-rosetta xliff export --locale ja --out ./review/   # custom output path
i18n-rosetta xliff import .rosetta/xliff/fr.xliff       # import reviewed file
i18n-rosetta xliff import ./reviewed.xliff --dry        # preview import
```

| Sous-commande | Sortie |
|------------|--------|
| `export` | Générer `.xliff` à partir des fichiers de locales source + cible |
| `import` | Fusionner les traductions `.xliff` révisées dans les fichiers de locales |

| Option | Effet |
|--------|--------|
| `--locale <code>` | Locale cible pour l'exportation (requis) |
| `--out <path>` | Chemin ou répertoire de sortie personnalisé |
| `--dry` | Prévisualiser l'importation sans écrire |

Consultez [Travailler avec des traducteurs professionnels](/docs/guides/professional-translators) pour le flux de travail complet.

---

## status

Affiche la configuration des paires, les plugins installés, les niveaux de qualité et les scores de référence (benchmarks).

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

Télécharge et gère les polices web PUA pour les convertisseurs de scripts de langues construites. Les langues qui utilisent des caractères de la zone à usage privé (Private Use Area - Klingon, Sindarin, Kryptonien) nécessitent des polices web personnalisées pour afficher leurs scripts. Cette commande les télécharge à partir de dépôts open-source vérifiés.

```bash
i18n-rosetta fonts list                           # show needed fonts
i18n-rosetta fonts install                        # download all needed fonts
i18n-rosetta fonts install --css                  # also generate CSS snippet
i18n-rosetta fonts install --dir ./public/fonts   # custom output directory
```

| Sous-commande | Sortie |
|------------|--------|
| `list` | Affiche quelles polices PUA sont nécessaires et leur statut d'installation |
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

Consultez [Langues construites, scripts et orthographe](/docs/guides/conlangs-scripts-orthography) pour tous les détails sur les polices PUA.

## Pipeline à trois couches

Utilisez `lint`, `sync` et `audit` ensemble pour une i18n à toute épreuve :

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
| **Lint** | `lint` | Pre-commit | Bloquer les validations (commits) contenant des chaînes codées en dur |
| **Sync** | `sync` | Post-commit / CI | Traduire les clés manquantes et modifiées |
| **Verify** | `verify` | Post-sync / CI | Confirmer que les traductions sont présentes et correctes |
| **Audit** | `audit` | Étape de compilation (build) | Faire échouer le déploiement si une locale possède des marqueurs `[EN]` |

---

## Voir aussi

- [Configuration](/docs/getting-started/configuration) — référence du fichier de configuration
- [Méthodes de traduction](/docs/guides/translation-methods) — sélection de la méthode par paire
- [Mémoire de traduction](/docs/concepts/translation-memory) — mise en cache et réduction des coûts
- [Travailler avec des traducteurs professionnels](/docs/guides/professional-translators) — flux de travail XLIFF
- [Spécification des plugins](/docs/reference/plugin-spec) — format du manifeste de plugin
- [Guide CI/CD](/docs/guides/ci-cd) — automatisation des commandes CLI dans votre pipeline
- [Comment fonctionne la synchronisation](/docs/concepts/how-sync-works) — comprendre le pipeline de synchronisation
- [Porte de qualité](/docs/concepts/quality-gate) — comment les traductions sont validées