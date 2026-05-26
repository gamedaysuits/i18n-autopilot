---
sidebar_position: 1
slug: /
title: "Introduction"
---
# i18n-rosetta

Un framework d'internationalisation entièrement personnalisable. Une seule commande traduit vos fichiers de paramètres régionaux (locale files). Une seule configuration contrôle chaque méthode, modèle et paire de langues. Et si les méthodes intégrées ne suffisent pas, concevez la vôtre, démontrez son efficacité et déployez-la.

```bash
npx i18n-rosetta sync
```

rosetta détecte automatiquement vos fichiers de paramètres régionaux, leur format et les langues cibles. Il traduit les éléments manquants, ignore ceux déjà traités, valide chaque résultat et génère un résultat propre. Ceci n'est que le point de départ.

---

## Pourquoi ne pas simplement écrire un script vous-même ?

Vous pourriez rédiger une boucle rapide faisant appel à Google Translate pour chaque clé. La plupart des développeurs procèdent ainsi ; cela nécessite environ 30 lignes de code. Voici cependant les limites de cette approche :

- **Aucune détection des modifications.** Mettez à jour une chaîne de caractères en anglais : la traduction demeurera obsolète indéfiniment. rosetta assure le suivi de chaque valeur source au moyen de hachages SHA-256 et ne retraduit que les éléments modifiés.
- **Aucun traitement par lots (batching).** Un appel d'API par clé implique que 200 clés équivalent à 200 allers-retours. rosetta regroupe les requêtes de manière intelligente (paramétrable, par défaut 30 clés par lot pour un LLM, 128 pour Google).
- **Aucun contrôle qualité.** La traduction automatique produit des hallucinations, répète la source ou génère un résultat dans le mauvais système d'écriture. rosetta valide chaque traduction avant son écriture : les erreurs d'écriture, l'inflation de la longueur et les répétitions de la source sont détectées et rejetées.
- **Aucune reconnaissance des formats.** Limité au format JSON ? rosetta prend en charge JSON, TOML, YAML et Hugo Markdown (frontmatter et corps du texte) grâce à une détection automatique.
- **Aucun contrôle des méthodes.** Chaque paire de langues se voit attribuer la même méthode. rosetta vous permet d'utiliser Google Translate pour le français, un LLM pour le japonais et un pipeline personnalisé hébergé par la communauté pour le cri (Cree), le tout au sein du même fichier de configuration.

rosetta constitue la version de production de ce script.

---

## Ce qui fait la différence

### Chaque méthode est un plugin

La méthode de traduction est **configurable par paire de langues**. Vous pouvez combiner Google Translate, des LLM, des invites guidées (coached prompts) et des API personnalisées au sein d'un même projet :

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

Le français bénéficie de Google Translate (rapide, économique). Le japonais utilise un LLM de premier plan (nuancé). Le cri des plaines (Plains Cree) dispose d'un plugin guidé intégrant des règles grammaticales, des dictionnaires et une validation morphologique. La même commande `sync` est utilisée. Le même contrôle qualité est appliqué. La même interface en ligne de commande (CLI) est exploitée.

### Démontrez-le

Pensez-vous que votre méthode soit capable de traduire de l'anglais vers l'espagnol ? Du turc vers l'azerbaïdjanais ? De l'anglais vers le cri ?

**Démontrez-le.** L'outil d'évaluation associé ([eval harness](https://mtevalarena.org/docs/specifications/harness)) évalue toute méthode de traduction au moyen d'une notation reproductible et dotée d'une empreinte numérique (fingerprinted). Le [classement](/leaderboard) assure le suivi de chaque soumission.

L'outil d'évaluation et la CLI de production partagent la même interface de plugin. Une méthode obtenant d'excellents résultats lors de l'évaluation peut être déployée en production, à condition que la communauté dont elle traite la langue y consente. Pour les langues autochtones et celles disposant de peu de ressources, ce consentement revêt une importance capitale. Veuillez consulter la section [Souveraineté des données](https://mtevalarena.org/docs/sovereignty/data-sovereignty).

```bash
# Benchmark your method (in the eval harness repo)
cd gds-mt-eval-harness
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json --submit

# Use it locally
npx i18n-rosetta sync
```

Il s'agit du même plugin. Intégrez-le et testez-le.

### La boîte à outils complète

rosetta ne se limite pas à `sync`. Il s'agit d'un pipeline d'internationalisation (i18n) complet :

| Commande | Fonction |
|---------|-------------|
| `sync` | Traduire les clés manquantes, obsolètes et de repli (fallback) |
| `watch` | Synchroniser automatiquement lors de la modification de votre fichier source |
| `lint` | Analyser le code source pour détecter les chaînes de caractères codées en dur |
| `wrap` | Envelopper automatiquement les chaînes codées en dur dans des appels `t()` |
| `audit` | Répertorier toutes les valeurs de repli `[EN]` non traduites |
| `integrity` | Détecter la corruption des espaces réservés (placeholders) et les problèmes d'encodage |
| `seo` | Générer des balises hreflang, des plans de site (sitemaps) et du JSON-LD |
| `status` | Afficher la configuration des paires, les plugins et les scores d'évaluation |
| `provenance` | Auditer les licences des ressources de traduction |
| `plugin` | Installer, supprimer et répertorier les plugins de méthode |

Trois de ces commandes — `lint`, `sync` et `audit` — constituent un pipeline d'intégration continue (CI) qui détecte les chaînes de caractères codées en dur, les traduit et provoque l'échec de la compilation si un paramètre régional s'avère incomplet.

---

## L'Arène

Le [Classement des méthodes](/leaderboard) fait office de tableau des scores. Chaque soumission est associée à l'empreinte d'un commit Git, versionnée selon un jeu de données spécifique et évaluée par le même outil d'évaluation. Toute personne est libre de soumettre une proposition.

**Que pouvez-vous démontrer ?** L'outil d'évaluation accepte le format JSON. Les plugins acceptent le format JSON. Toute méthode générant du JSON peut être testée :

| Approche | Exemple |
|----------|---------|
| **LLM guidé (Coached LLM)** | Injecter des règles grammaticales et des dictionnaires dans l'invite (prompt) d'un modèle de pointe |
| **Modèle affiné (Fine-tuned)** | Entraîner un modèle ouvert sur des textes parallèles, à l'exclusion des données d'évaluation |
| **Pipeline contrôlé par FST** | Le LLM génère → le transducteur à états finis (FST) valide la morphologie → nouvel essai |
| **Modèles enchaînés** | Le modèle A rédige → le modèle B post-édite → le modèle C évalue |
| **Dictionnaire + LLM** | Imposer des termes connus issus d'un dictionnaire, laisser le LLM gérer le reste |
| **Évolutionniste** | Générer des candidats, les évaluer, faire muter les meilleurs, répéter le processus |
| **Traduction partielle** | Traduire un échantillon manuellement, prouver la correspondance de votre LLM, traduire automatiquement le reste |

Affinez des modèles. Déployez des algorithmes évolutionnistes. Testez les réponses d'étudiants lors d'examens linguistiques. Élaborez des tables de correspondance (lookup tables). Enchaînez trois modèles. Dès lors que votre méthode produit du JSON, l'outil d'évaluation lui attribue un score et le framework l'exécute.

:::danger La règle d'or
**N'entraînez pas vos modèles sur les données d'évaluation.** Les méthodes exposées au jeu de données de référence (benchmark) seront disqualifiées. Vous pouvez affiner vos modèles sur n'importe quelles autres données, à l'exception de l'ensemble de test.
:::

Ceci constitue une invitation ouverte. Si vous travaillez sur une langue disposant de peu de ressources — en tant que chercheur, membre d'une communauté, étudiant ou simple passionné —, concevez une méthode, exécutez l'outil d'évaluation et visez le meilleur score. Le problème demeure non résolu. L'infrastructure est désormais à votre disposition.

**[→ Consulter le classement](/leaderboard)**

---

## Prochaines étapes

**Pour commencer :**
- [Installation](/docs/getting-started/installation) — Configuration en 2 minutes
- [Démarrage rapide](/docs/getting-started/quick-start) — Exécuter votre première synchronisation
- [Langues prises en charge](/docs/reference/supported-languages) — Ce qui est disponible nativement

**Personnalisation de votre configuration :**
- [Méthodes de traduction](/docs/guides/translation-methods) — Choisir la méthode appropriée pour chaque paire
- [Configuration](/docs/getting-started/configuration) — Référence complète de la configuration
- [Site multilingue Hugo](/docs/tutorials/hugo-multilingual-site) — Traduction de contenu Markdown

**Pour aller plus loin :**
- [Souveraineté des données](https://mtevalarena.org/docs/sovereignty/data-sovereignty) — Principes OCAP, CARE et de souveraineté des données maories
- [Soutenir une langue à faibles ressources](https://mtevalarena.org/docs/community/low-resource-languages) — Le défi à l'origine du projet
- [Livre de recettes : Pipeline contrôlé par FST](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — Construire un pipeline de décomposition
- [Évaluation de la traduction automatique (MT)](https://mtevalarena.org/docs/leaderboard/rules) — Fonctionnement de l'outil d'évaluation et du classement
- [Classement des méthodes](/leaderboard) — Scores en direct et soumissions