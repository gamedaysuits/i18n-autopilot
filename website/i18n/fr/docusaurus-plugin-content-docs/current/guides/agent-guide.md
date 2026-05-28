---
sidebar_position: 9
title: "Guide de l'agent : Utilisation de i18n-rosetta"
description: "Comment les agents IA peuvent installer, configurer et exécuter i18n-rosetta pour traduire les fichiers de localisation."
---
# Guide de l'agent : Utilisation de i18n-rosetta

i18n-rosetta est un outil en ligne de commande (CLI) qui traduit les fichiers de localisation de votre application en une seule commande. Ce guide s'adresse aux agents d'IA (ou aux développeurs travaillant avec des agents d'IA) qui souhaitent obtenir rapidement des fichiers de localisation traduits en partant de zéro.

:::tip Déjà familier avec l'outil ?
Si vous avez uniquement besoin des commandes, passez directement à la [Référence de la CLI](/docs/reference/cli). Si vous souhaitez concevoir et évaluer une méthode de traduction, consultez le [Guide de l'agent Arena](https://mtevalarena.org/docs/getting-started/agent-guide).
:::

---

## Configuration de l'environnement

```bash
# No global install needed — npx runs it directly
npx i18n-rosetta sync
```

**Prérequis :**
- Node.js 18+
- Une clé d'API pour votre fournisseur de traduction

**Configuration de la clé d'API** — rosetta nécessite au moins une clé selon les méthodes que vous utilisez :

```bash
# Option 1: export (session only)
export OPENROUTER_API_KEY="sk-or-..."        # for llm / llm-coached methods
export GOOGLE_TRANSLATE_API_KEY="AIza..."    # for google-translate method

# Option 2: .env file in your project root (persistent, gitignored)
echo 'OPENROUTER_API_KEY=sk-or-...' > .env
```

Rosetta lit `.env` automatiquement. Obtenez une clé OpenRouter sur [openrouter.ai/keys](https://openrouter.ai/keys).

---

## Première synchronisation

Rosetta détecte automatiquement vos fichiers de localisation, leur format (JSON, TOML, YAML, PO) et vos langues cibles :

```bash
npx i18n-rosetta sync
```

**Ce qui se produit :**
1. Charge `i18n-rosetta.config.json` (ou détecte automatiquement les paramètres)
2. Analyse votre fichier de localisation source, aplatit les clés imbriquées
3. Compare avec `.i18n-rosetta.lock` (hachages SHA-256 des valeurs précédemment traduites)
4. Vérifie `.rosetta/tm.json` pour les traductions en cache (Mémoire de traduction)
5. Traduit uniquement les **clés modifiées, manquantes ou obsolètes** via la méthode configurée
6. Exécute la barrière de qualité (5 vérifications) sur chaque traduction
7. Écrit les traductions validées dans le fichier de localisation cible
8. Met à jour le fichier de verrouillage (lock file) et le cache de la mémoire de traduction (TM)

Lors d'une réexécution typique après la modification d'une clé, l'étape 4 fournit 142 clés à partir du cache et l'étape 5 traduit 1 clé. C'est pourquoi les synchronisations ultérieures sont rapides et peu coûteuses.

---

## Configuration

Créez `i18n-rosetta.config.json` à la racine de votre projet :

```json
{
  "inputLocale": "en",
  "pairs": {
    "en-fr": { "method": "llm-coached" },
    "en-ja": { "method": "google-translate" },
    "en-crk": { "method": "api", "endpoint": "http://localhost:3000/translate" }
  }
}
```

Champs clés :

| Champ | Objectif | Valeur par défaut |
|-------|----------|-------------------|
| `inputLocale` | Langue source | `en` |
| `pairs` | Mappage source→cible avec la configuration de la méthode | (requis) |
| `localesDir` | Emplacement des fichiers de localisation | (détecté automatiquement) |
| `model` | Modèle LLM pour les méthodes `llm`/`llm-coached` | `google/gemini-2.5-flash` |
| `batchSize` | Clés par appel d'API | 80 (LLM), 128 (Google) |
| `jsonConcurrency` | Traductions de localisation parallèles pour les clés JSON | 200 |
| `contentConcurrency` | Appels d'API parallèles pour la traduction de contenu | 48 |

Référence complète : [Configuration](/docs/getting-started/configuration)

---

## Méthodes de traduction

| Méthode | Quand l'utiliser | Coût | Clé d'API requise |
|---------|------------------|------|-------------------|
| **`llm`** | Usage général, adapté aux langues bien dotées en ressources | Par jeton (selon le modèle) | `OPENROUTER_API_KEY` |
| **`llm-coached`** | Lorsque vous disposez de règles de grammaire/dictionnaire pour la langue cible | Par jeton + contexte d'encadrement (coaching) | `OPENROUTER_API_KEY` |
| **`google-translate`** | Langues à fortes ressources où GT fonctionne bien | 20 $/million de caractères | `GOOGLE_TRANSLATE_API_KEY` |
| **`api`** | Pipeline personnalisé hébergé derrière un point de terminaison HTTP | Déterminé par le serveur | Aucune (le point de terminaison gère l'authentification) |
| **`plugin`** | Méthode pré-emballée installée localement | Variable | Variable |

Détails : [Méthodes de traduction](/docs/guides/translation-methods)

---

## Données d'encadrement

Pour les paires `llm-coached`, les données d'encadrement orientent le LLM avec des connaissances linguistiques explicites. Créez un fichier d'encadrement :

```json title="coaching/fr.json"
{
  "grammar_rules": [
    "Use formal register (vous) for all UI text",
    "Adjectives agree in gender and number with the noun"
  ],
  "dictionary": {
    "dashboard": "tableau de bord",
    "settings": "paramètres"
  },
  "style_notes": "Prefer active voice. Avoid anglicisms."
}
```

Référencez-le dans la configuration de votre paire :

```json
"en-fr": { "method": "llm-coached", "coachingFile": "coaching/fr.json" }
```

La barrière de qualité vérifie que les termes du dictionnaire apparaissent effectivement dans la sortie — les violations sont consignées sous forme d'avertissements `[TERM]`.

Détails : [Données d'encadrement](/docs/concepts/coaching-data)

---

## Barrière de qualité

Chaque traduction passe par cinq vérifications automatisées avant d'être écrite sur le disque :

| Vérification | Ce qu'elle détecte | Exemple |
|--------------|--------------------|---------|
| **Vide/blanc (Empty/blank)** | Le modèle n'a rien renvoyé | `""` |
| **Écho de la source (Source echo)** | Le modèle a renvoyé l'entrée en anglais sans modification | `"Welcome"` pour le japonais |
| **Boucle d'hallucination (Hallucination loop)** | Trigrammes répétés | `"Qo' Qo' Qo' Qo'"` |
| **Inflation de la longueur (Length inflation)** | La sortie est 4 fois plus longue (ou plus) que la source | Source de 10 caractères → sortie de 50 caractères |
| **Conformité de l'écriture (Script compliance)** | Écriture incorrecte pour la localisation | Texte latin pour une localisation arabe |

Les échecs sont consignés avec le préfixe `[GATE]`. Aucun repli silencieux n'est effectué — si une traduction échoue, elle est signalée et non acceptée discrètement.

Détails : [Barrière de qualité](/docs/concepts/quality-gate)

---

## Mémoire de traduction

Rosetta met en cache les traductions dans `.rosetta/tm.json`, indexées par le texte source + la localisation + la méthode. Lors des synchronisations ultérieures, les clés inchangées sont fournies à partir du cache — aucun appel d'API, aucun coût.

```
[TM] 142 key(s) served from cache
Translating 3 key(s) to French (llm)... [OK]
```

Pour contourner le cache lors d'une exécution : `npx i18n-rosetta sync --no-tm`

Détails : [Mémoire de traduction](/docs/concepts/translation-memory)

---

## Fichiers générés

Rosetta crée plusieurs fichiers dans votre projet. Prenez connaissance de leur nature afin de ne pas supprimer ou valider (commit) accidentellement les mauvais fichiers :

| Fichier | Objectif | Git ? |
|---------|----------|-------|
| `.i18n-rosetta.lock` | Hachages SHA-256 des valeurs sources traduites (détection des modifications) | **Oui** — à valider (commit) |
| `.i18n-rosetta-content.lock` | Identique, mais pour les fichiers de contenu Markdown/MDX | **Oui** — à valider (commit) |
| `.rosetta/tm.json` | Cache de la mémoire de traduction | **Oui** — à valider (permet à l'équipe d'économiser les coûts d'API) |
| `.rosetta/coaching/` | Répertoire des données d'encadrement | **Oui** — il s'agit de vos connaissances linguistiques |
| `i18n-rosetta.config.json` | Configuration du projet | **Oui** — à valider (commit) |

---

## Modèles d'utilisation courants

**Traduire une paire de langues :**
```bash
npx i18n-rosetta sync --pair en-fr
```

**Traduire toutes les paires configurées :**
```bash
npx i18n-rosetta sync
```
Rosetta traduit toutes les localisations en parallèle. Grâce à la mise en cache de la mémoire de traduction (TM), seules les clés modifiées sollicitent l'API.

**Mode contenu (Markdown/MDX pour Docusaurus, Hugo, etc.) :**
```bash
npx i18n-rosetta sync --content
```
Traduit la documentation, les articles de blog et les fichiers de contenu en plus des fichiers JSON de localisation. Utilise la concurrence parallèle (par défaut : 48 appels d'API simultanés). Ajustez avec `--content-concurrency`.

**Exécution à blanc (aperçu sans écriture) :**
```bash
npx i18n-rosetta sync --dry-run
```

**Forcer la retraduction de clés spécifiques :**
```bash
npx i18n-rosetta sync --force-keys "hero.title,nav.about"
```

**Forcer la retraduction de tous les fichiers de contenu :**
```bash
npx i18n-rosetta sync --force-content
```

**Vérifier l'état de la traduction :**
```bash
npx i18n-rosetta status
```
Affiche la couverture, les niveaux de qualité et les informations sur les plugins pour chaque paire.

**Auditer les valeurs de repli non traduites :**
```bash
npx i18n-rosetta audit
```
Liste toutes les valeurs de repli `[EN]` qui nécessitent une traduction.

---

## Dépannage

| Problème | Solution |
|----------|----------|
| `OPENROUTER_API_KEY not set` | Exportez la clé ou ajoutez-la à `.env` à la racine de votre projet |
| `No locale files found` | Définissez `localesDir` dans la configuration, ou assurez-vous que vos fichiers de localisation respectent le nommage standard (`en.json`, `fr.json`) |
| `[GATE] Script compliance failed` | Votre localisation cible a reçu du texte latin au lieu de l'écriture attendue — essayez un autre modèle ou ajoutez des données d'encadrement |
| `[GATE] Source echo` | Le modèle a renvoyé l'anglais sans modification — des données d'encadrement ou un modèle différent résolvent généralement ce problème |
| Toutes les traductions sont en cache | Exécutez avec `--no-tm` pour contourner le cache, ou `--force-keys` pour des clés spécifiques |
| Conflits de fichiers de verrouillage (Lock file) | `.i18n-rosetta.lock` utilise des hachages SHA-256 — les conflits de fusion peuvent être résolus en toute sécurité en conservant l'une ou l'autre version, puis en relançant la synchronisation |

---

## Prochaines étapes

- [Démarrage rapide](/docs/getting-started/quick-start) — guide complet pour bien démarrer
- [Référence de la CLI](/docs/reference/cli) — toutes les commandes et tous les indicateurs (flags)
- [Fonctionnement](/docs/how-it-works) — explication du pipeline de synchronisation
- [The Eval Harness Bridge](/docs/guides/bridge) — comment rosetta se connecte à l'Arena
- **Vous souhaitez concevoir votre propre méthode de traduction ?** Consultez le [Guide de l'agent Arena](https://mtevalarena.org/docs/getting-started/agent-guide) — concevez une méthode, prouvez son efficacité et gagnez des prix.