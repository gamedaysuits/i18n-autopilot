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
--dry                   Preview changes without writing files
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

Traduit les clés manquantes, obsolètes et de repli dans tous les fichiers de localisation.

```bash
i18n-rosetta sync                                   # translate everything
i18n-rosetta sync --dry                             # preview only
i18n-rosetta sync --force-keys "hero.title"         # force re-translate
i18n-rosetta sync --force-keys "a.title,a.subtitle" # multiple keys
i18n-rosetta sync --content-dir ./content           # include Hugo Markdown
i18n-rosetta sync --method google-translate          # force Google Translate
i18n-rosetta sync --fallback                         # write [EN] prefixes on failure
```

**Détection des modifications** : rosetta stocke les hachages SHA-256 dans `.i18n-rosetta.lock`. Lorsque les valeurs sources changent, la synchronisation suivante retraduit automatiquement ces clés. Validez (commit) le fichier de verrouillage afin que tous les développeurs partagent la même base de référence.

---

## watch

Synchronisation automatique lorsque le fichier de localisation source est modifié. S'exécute jusqu'à ce qu'il soit interrompu par `Ctrl+C`.

```bash
i18n-rosetta watch
```

---

## audit

Répertorie toutes les valeurs de repli non traduites préfixées par `[EN]`. Se termine avec le code 1 si de telles valeurs sont trouvées — à utiliser comme point de contrôle d'intégration continue (CI) pour faire échouer les compilations dont les traductions sont incomplètes.

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

**Ce qu'il détecte :**
- Les chaînes codées en dur dans le texte JSX, `placeholder`, `alt`, `aria-label`, `title`
- Les fichiers contenant du contenu destiné aux utilisateurs mais sans importation de framework i18n
- Les clés mortes — les clés de localisation qu'aucun fichier source ne référence
- Le score de couverture — le pourcentage de chaînes passant par i18n

**Exclusions** : Créez `.rosettaignore` à la racine de votre projet (motifs glob, tels que `.gitignore`).

---

## wrap

Enveloppe automatiquement les chaînes codées en dur détectées par `lint` dans des appels `t()`. Crée des sauvegardes automatiques avant de modifier les fichiers.

```bash
i18n-rosetta wrap                    # auto-wrap with backup
i18n-rosetta wrap --dry              # preview wrapping changes
i18n-rosetta wrap --undo             # restore from .rosetta-backup/
```

**Mesures de sécurité :**
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
| `jsonld` | Schéma de langue WebSite JSON-LD |

---

## integrity

Détecte la corruption et les dérives dans les fichiers de localisation traduits.

```bash
i18n-rosetta integrity               # exits 1 if issues found
i18n-rosetta integrity --warn-only   # non-blocking
```

**Ce qu'il vérifie :**
- La corruption des espaces réservés (par exemple, `{name}` présent dans la source mais manquant dans la cible)
- Les problèmes d'encodage (mojibake, Unicode invalide)
- Les copies non traduites (valeur cible identique à la source)
- Les clés orphelines (clés présentes dans la cible qui n'existent pas dans la source)

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

Consultez la [Spécification des plugins](/docs/reference/plugin-spec) pour connaître le format du manifeste de plugin.

---

## Pipeline à trois couches

Utilisez `lint`, `sync` et `audit` conjointement pour une i18n infaillible :

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
| **Lint** | `lint` | Pré-validation (Pre-commit) | Bloquer les validations contenant des chaînes codées en dur |
| **Sync** | `sync` | Post-validation / CI | Traduire les clés manquantes et modifiées |
| **Audit** | `audit` | Étape de compilation (Build) | Faire échouer le déploiement si une localisation est incomplète |

---

## Voir aussi

- [Configuration](/docs/getting-started/configuration) — référence du fichier de configuration
- [Méthodes de traduction](/docs/guides/translation-methods) — sélection de la méthode par paire
- [Spécification des plugins](/docs/reference/plugin-spec) — format du manifeste de plugin
- [Guide CI/CD](/docs/guides/ci-cd) — automatisation des commandes de la CLI dans votre pipeline
- [Fonctionnement de la synchronisation](/docs/concepts/how-sync-works) — comprendre le pipeline de synchronisation
- [Porte de qualité](/docs/concepts/quality-gate) — comment les traductions sont validées