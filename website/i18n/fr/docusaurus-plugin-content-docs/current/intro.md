---
sidebar_position: 1
slug: /
title: "Introduction"
---
# i18n-rosetta

Un framework d'internationalisation entièrement personnalisable. Une seule commande traduit vos fichiers de localisation. Une seule configuration contrôle chaque méthode, modèle et paire de langues. Et si les méthodes intégrées ne suffisent pas, concevez la vôtre, démontrez son efficacité et déployez-la.

```bash
npx i18n-rosetta sync
```

rosetta détecte automatiquement vos fichiers de localisation, leur format et les langues cibles. Il traduit ce qui manque, ignore ce qui est déjà fait, valide chaque résultat et produit un résultat propre. Ce n'est que le point de départ.

---

## Pourquoi ne pas simplement créer votre propre script ?

Vous pourriez écrire une boucle rapide qui appelle Google Translate pour chaque clé. La plupart des développeurs le font — cela prend environ 30 lignes. Voici où cela pose problème :

- **Aucune détection des modifications.** Mettez à jour une chaîne en anglais — la traduction reste obsolète pour toujours. rosetta suit chaque valeur source avec des hachages SHA-256 et ne retraduit que ce qui a changé.
- **Aucun traitement par lots (batching).** Un appel API par clé signifie que 200 clés = 200 allers-retours. rosetta regroupe les requêtes intelligemment (configurable, par défaut 80 clés/lot pour un LLM, 128 pour Google).
- **Aucune mise en cache.** Chaque synchronisation retraduit tout. La mémoire de traduction (Translation Memory) de rosetta met en cache les traductions par texte source + paramètre régional (locale) + méthode — relancer la synchronisation après la modification d'une seule clé ne traduit que cette clé, et non le fichier entier.
- **Aucun contrôle de qualité (quality gate).** La traduction automatique hallucine, répète la source ou produit un résultat dans le mauvais système d'écriture (script). rosetta valide chaque traduction avant de l'écrire — les erreurs de système d'écriture, l'inflation de la longueur et les répétitions de la source sont détectées et rejetées.
- **Aucune reconnaissance du format.** Codé en dur pour JSON ? rosetta prend en charge JSON, TOML, YAML et Hugo Markdown (frontmatter + corps du texte) avec une détection automatique.
- **Aucun contrôle de la méthode.** Chaque paire de langues utilise la même méthode. rosetta vous permet d'utiliser Google Translate pour le français, un LLM pour le japonais et un pipeline personnalisé hébergé par la communauté pour le cri — au sein du même fichier de configuration.

rosetta est la version de production de ce script.

---

## Ce qui fait la différence

### Chaque méthode est un plugin

La méthode de traduction est **configurable par paire de langues**. Combinez Google Translate, des LLMs, des invites (prompts) dirigées et des APIs personnalisées au sein du même projet :

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "google-translate" },
    "en:ja": { "method": "llm", "model": "google/gemini-2.5-pro" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

Le français utilise Google Translate (rapide, économique). Le japonais utilise un LLM premium (nuancé). Le cri des plaines utilise un plugin dirigé avec des règles de grammaire, des dictionnaires et une validation morphologique. La même commande `sync`. Le même contrôle de qualité. La même interface en ligne de commande (CLI).

### Prouvez-le

Vous pensez que votre méthode peut traduire de l'anglais vers l'espagnol ? Du turc vers l'azerbaïdjanais ? De l'anglais vers le cri ?

**Prouvez-le.** L'outil d'évaluation associé ([eval harness](https://mtevalarena.org/docs/specifications/harness)) évalue toute méthode de traduction avec une notation reproductible et dotée d'une empreinte numérique. Le classement ([leaderboard](/leaderboard)) suit chaque soumission.

L'outil d'évaluation et la CLI de production partagent la même interface de plugin. Une méthode qui obtient de bons résultats lors de l'évaluation peut être utilisée en production — si la communauté dont elle sert la langue donne son consentement. Pour les langues autochtones et à faibles ressources, ce consentement est essentiel. Voir [Souveraineté des données (Data Sovereignty)](https://mtevalarena.org/docs/sovereignty/data-sovereignty).

```bash
# Benchmark your method (in the eval harness repo)
cd gds-mt-eval-harness
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json --submit

# Use it locally
npx i18n-rosetta sync
```

Le même plugin. Connectez et testez.

### La boîte à outils complète

rosetta n'est pas seulement `sync`. Il s'agit d'un pipeline d'internationalisation (i18n) complet :

| Commande | Ce qu'elle fait |
|---------|-------------|
| `sync` | Traduit les clés manquantes et obsolètes (avec vérification post-synchronisation) |
| `watch` | Synchronise automatiquement lorsque votre fichier source est modifié |
| `lint` | Analyse le code source pour trouver les chaînes codées en dur |
| `wrap` | Enveloppe automatiquement les chaînes codées en dur dans des appels `t()` |
| `audit` | Liste tous les marqueurs de repli `[EN]` des exécutions précédentes |
| `verify` | Vérifie que les traductions sont présentes et correctes (contrôle CI) |
| `integrity` | Détecte la corruption des espaces réservés (placeholders), les problèmes d'encodage et l'exhaustivité des pluriels ICU |
| `seo` | Génère des balises hreflang, des plans de site (sitemaps) et des schémas JSON-LD |
| `status` | Affiche la configuration des paires, les plugins et les scores d'évaluation (benchmarks) |
| `provenance` | Audite les licences des ressources de traduction |
| `plugin` | Installe, supprime et liste les plugins de méthode |
| `fonts` | Télécharge les polices web pour les convertisseurs de scripts PUA |
| `tm` | Gère le cache de la mémoire de traduction (statistiques, effacement, par paramètre régional) |
| `xliff` | Exporte/importe au format XLIFF 1.2 pour une révision par des traducteurs professionnels |

Quatre d'entre elles — `lint`, `sync`, `verify`, `audit` — forment un pipeline d'intégration continue (CI) qui détecte les chaînes codées en dur, les traduit, vérifie leur exactitude et fait échouer la compilation (build) si un paramètre régional est incomplet.

---

## L'Arène

Le classement des méthodes ([Method Leaderboard](/leaderboard)) sert de tableau des scores. Chaque soumission est associée à l'empreinte d'un commit Git, versionnée selon un ensemble de données spécifique et évaluée par le même outil d'évaluation. Tout le monde peut soumettre une proposition.

**Que pouvez-vous prouver ?** L'outil d'évaluation accepte le format JSON. Les plugins acceptent le format JSON. Toute méthode produisant du JSON peut être testée :

| Approche | Exemple |
|----------|---------|
| **LLM dirigé (Coached LLM)** | Injecter des règles de grammaire et des dictionnaires dans l'invite d'un modèle de pointe (frontier model) |
| **Modèle affiné (Fine-tuned model)** | Entraîner un modèle ouvert sur des textes parallèles — mais pas sur les données d'évaluation |
| **Pipeline contrôlé par FST** | Le LLM génère → le transducteur à états finis (FST) valide la morphologie → nouvelle tentative |
| **Modèles enchaînés** | Le modèle A rédige → le modèle B post-édite → le modèle C évalue |
| **Dictionnaire + LLM** | Imposer des termes connus à partir d'un dictionnaire, laisser le LLM gérer le reste |
| **Évolutive** | Générer des candidats, les évaluer, faire muter les meilleurs, répéter |
| **Traduction partielle** | Traduire un échantillon manuellement, prouver que votre LLM correspond, traduire automatiquement le reste |

Affinez des modèles. Déployez des algorithmes évolutionnistes. Testez les réponses d'étudiants à des examens de langue. Construisez des tables de correspondance (lookup tables). Enchaînez trois modèles ensemble. Tant que votre méthode produit du JSON, l'outil d'évaluation la note et le framework l'exécute.

:::danger La règle unique
**Ne vous entraînez pas sur les données d'évaluation.** Les méthodes exposées à l'ensemble de données de référence (benchmark) seront disqualifiées. Affinez vos modèles sur ce que vous souhaitez. Mais pas sur l'ensemble de test.
:::

Il s'agit d'une invitation ouverte. Si vous travaillez avec une langue à faibles ressources — en tant que chercheur, membre d'une communauté, étudiant ou simplement en tant que personne concernée — concevez une méthode, exécutez l'outil d'évaluation et visez le meilleur score. Le problème n'est pas encore résolu. L'infrastructure est prête.

**[→ Voir le classement](/leaderboard)**

---

## Prochaines étapes

**Pour commencer :**
- [Installation](/docs/getting-started/installation) — Configuration en 2 minutes
- [Démarrage rapide (Quick Start)](/docs/getting-started/quick-start) — Exécutez votre première synchronisation
- [Langues prises en charge](/docs/reference/supported-languages) — Ce qui est disponible par défaut

**Personnalisation de votre configuration :**
- [Méthodes de traduction](/docs/guides/translation-methods) — Choisissez la méthode appropriée pour chaque paire
- [Mémoire de traduction](/docs/concepts/translation-memory) — Comment la mise en cache vous fait économiser de l'argent
- [Configuration](/docs/getting-started/configuration) — Référence complète de la configuration
- [Site multilingue Hugo](/docs/tutorials/hugo-multilingual-site) — Traduction de contenu Markdown

**Pour aller plus loin :**
- [Travailler avec des traducteurs professionnels](/docs/guides/professional-translators) — Flux de travail d'exportation/importation XLIFF
- [Souveraineté des données](https://mtevalarena.org/docs/sovereignty/data-sovereignty) — Principes OCAP, CARE et de souveraineté des données maories
- [Soutenir une langue à faibles ressources](https://mtevalarena.org/docs/community/low-resource-languages) — Le défi à l'origine de tout
- [Livre de recettes : Pipeline contrôlé par FST](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — Construire un pipeline de décomposition
- [Évaluation de la traduction automatique (MT Evaluation)](https://mtevalarena.org/docs/leaderboard/rules) — Fonctionnement de l'outil d'évaluation et du classement
- [Classement des méthodes](/leaderboard) — Scores en direct et soumissions