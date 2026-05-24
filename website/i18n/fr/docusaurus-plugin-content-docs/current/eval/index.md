---
sidebar_position: 1
title: "Évaluation MT"
---
# Évaluation de la MT

rosetta comprend un cadre d'évaluation de la traduction automatique conçu pour l'**évaluation comparative reproductible** des méthodes de traduction — en particulier pour les langues peu dotées et autochtones, pour lesquelles les bancs d'essai standards de MT n'existent pas et où les affirmations de qualité sont difficiles à vérifier.

---

## Le Classement

La pièce maîtresse est le **[Classement des méthodes](/leaderboard)** — un tableau de bord en temps réel, propulsé par Supabase, où les chercheurs et les membres de la communauté soumettent et comparent des méthodes de traduction avec une évaluation reproductible et identifiée par empreinte numérique.

Chaque soumission comprend :

- **Pipeline avec empreinte numérique** — lié à un commit Git spécifique et à un hash de configuration, afin que les résultats remontent au code exact qui les a produits
- **Jeu de données versionné** — haché par contenu et versionné ; les scores ne sont comparables qu'au sein de la même version du jeu de données
- **Métriques standardisées** — toute la notation est calculée par le harnais d'évaluation partagé, éliminant les différences d'implémentation
- **Niveaux de confiance** — auto-évalué (Self-benchmarked), vérifié par GDS (GDS Verified), ou validé par la communauté (Community Validated)
- **Suivi des coûts** — coût de l'API par soumission, afin que les compromis coût-qualité soient transparents

Le classement suit actuellement trois métriques :

| Métrique | Type | Ce qu'elle mesure |
|--------|------|------------------|
| **chrF++** | Score F des n-grammes de caractères | Métrique de qualité principale — présente une bonne corrélation avec le jugement humain, en particulier pour les langues morphologiquement riches |
| **Exact Match** | Proportion de correspondances parfaites | Précision stricte — à quelle fréquence la traduction correspond-elle exactement à la référence (gold standard) ? |
| **FST Acceptance** | Taux de passage de la validation morphologique | Pour les méthodes avec vérification par transducteur à états finis — quelle proportion des sorties est morphologiquement valide ? |

**[→ Voir le classement](/leaderboard)**

---

## Jeux de données disponibles

### Ensemble de développement EDTeKLA v1

Le premier jeu de données d'évaluation, conçu pour la traduction de l'anglais vers le cri des plaines (SRO). Créé par le [groupe de recherche EdTeKLA](https://spaces.facsci.ualberta.ca/edtekla/) de l'Université de l'Alberta.

| Propriété | Valeur |
|----------|-------|
| **ID** | `edtekla-dev-v1` |
| **Paire de langues** | EN → CRK (Cri des plaines, orthographe SRO) |
| **Nombre d'entrées** | 124 |
| **Licence** | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) |
| **Provenance** | `gold_standard` (vérifié par des locuteurs), `textbook` (matériel pédagogique publié) |

### FLORES+ Devtest

Un banc d'essai multilingue à large couverture maintenu par l'[Open Language Data Initiative (OLDI)](https://huggingface.co/datasets/openlanguagedata/flores_plus).

| Propriété | Valeur |
|----------|-------|
| **Paires de langues** | EN → 39 langues (toutes les langues enregistrées dans rosetta) |
| **Nombre d'entrées** | 1 012 phrases par langue |
| **Licence** | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| **Source** | Initialement Meta FLORES-200, désormais maintenu par OLDI |
| **Emplacement** | Fichiers de test (fixtures) pré-extraits à `test/benchmark/fixtures/` dans le dépôt principal de rosetta |

Veuillez consulter [Jeux de données d'évaluation](/docs/eval/datasets) pour connaître le schéma complet des jeux de données, les niveaux de difficulté et la marche à suivre pour créer le vôtre.

:::danger NE PAS ENTRAÎNER sur les données d'évaluation

**Ces jeux de données sont exclusivement destinés à l'évaluation.** Les méthodes entraînées, affinées (fine-tuned), sollicitées par des exemples (few-shot-prompted) ou autrement exposées aux données d'évaluation produiront des scores artificiellement gonflés et seront **disqualifiées du classement.**

Il ne s'agit pas d'une suggestion — c'est la règle la plus importante pour l'intégrité de l'évaluation. Veuillez utiliser des corpus distincts pour l'entraînement. Les ensembles d'évaluation ne doivent jamais être vus par votre modèle pendant son développement.

Si vous utilisez des données d'accompagnement (coaching data) ou des exemples d'apprentissage en quelques essais (few-shot), ceux-ci doivent provenir de **sources complètement distinctes**. En cas de doute, ne les incluez pas.
:::

:::warning Non-déterminisme des LLM

Les sorties des LLM sont non déterministes. Les scores représentent des mesures ponctuelles sous des versions de modèles et des configurations d'API spécifiques. Les fournisseurs de modèles peuvent mettre à jour les poids, les stratégies de décodage ou les filtres de sécurité à tout moment, ce qui peut entraîner une dérive des scores entre les exécutions. Le classement enregistre l'identifiant exact du modèle (model slug) et l'horodatage pour chaque soumission.
:::

---

## Ce qui fait une bonne méthode

Toutes les méthodes ne se valent pas. Voici ce qui distingue un travail rigoureux des scores artificiellement gonflés.

### Caractéristiques d'une méthode solide

- **Séparation stricte des données d'entraînement et d'évaluation** — votre méthode n'a jamais vu l'ensemble d'évaluation au cours du développement, de l'ajustement (tuning), de l'ingénierie des invites (prompt engineering) ou de la sélection d'exemples en quelques essais (few-shot)
- **Reproductible** — une autre personne peut cloner votre dépôt, exécuter le harnais d'évaluation et obtenir les mêmes scores (dans les limites du non-déterminisme des LLM)
- **Documentée** — votre [fiche de méthode](/docs/eval/methods) décrit ce que fait votre méthode, les outils qu'elle utilise et quelles sont ses limites
- **Honnête quant à sa portée** — si votre méthode ne fonctionne que pour une seule paire de langues, précisez-le ; si elle se dégrade sur certains modèles morphologiques, documentez-le
- **Consciente de la communauté** — pour les langues autochtones, votre méthode respecte la souveraineté des données. Vous avez consulté les communautés linguistiques ou utilisé uniquement des données sous licence ouverte

### Signaux d'alarme (ce qui entraîne une disqualification)

| Signal d'alarme | Pourquoi c'est un problème |
|----------|--------------------|
| Entraînement sur les données d'évaluation | Annule complètement l'objectif de l'évaluation. Les scores gonflés induisent tout le monde en erreur. |
| Sélection sélective des résultats (Cherry-picking) | Exécuter 10 fois et soumettre la meilleure exécution sans divulguer les autres |
| Post-traitement non divulgué | Corriger manuellement les sorties avant la notation |
| Données d'accompagnement contaminées | Utiliser des exemples de l'ensemble d'évaluation comme invites few-shot ou entrées de dictionnaire |
| Revendiquer une préparation commerciale sans provenance | Si votre méthode utilise des données CC BY-NC-SA, elle n'est pas prête pour un usage commercial |

### Niveaux de qualité dans le classement

Le classement prend en charge trois niveaux de confiance :

| Niveau | Signification | Comment l'obtenir |
|------|---------|---------------|
| **Auto-évalué (Self-benchmarked)** | Vous avez exécuté le harnais vous-même et soumis les résultats | Ouvrez une PR avec votre fiche d'exécution (run card) |
| **Vérifié par GDS (GDS Verified)** | Les mainteneurs de rosetta ont reproduit vos résultats | Soumettez votre méthode sous forme de plugin installable |
| **Validé par la communauté (Community Validated)** | Des membres indépendants de la communauté ont reproduit les résultats | À venir |

---

## Comment soumettre

1. **Construisez votre méthode** — consultez [Construire une méthode](/docs/eval/methods) pour l'interface de la méthode
2. **Exécutez le harnais** — consultez [Harnais d'évaluation](/docs/eval/harness) pour la configuration et l'utilisation
3. **Générez une fiche d'exécution** — le harnais produit une fiche d'exécution (run card) JSON avec vos scores, votre empreinte numérique et vos métadonnées
4. **Ouvrez une PR** — soumettez votre fiche d'exécution au [dépôt du harnais d'évaluation](https://github.com/gamedaysuits/gds-mt-eval-harness)
5. **Apparaissez dans le classement** — une fois fusionnés, vos résultats s'affichent dans le [Classement des méthodes](/leaderboard)

---

## Orientations futures

- **Exécutions de comparaison de modèles FLORES+** — évaluation systématique des modèles de pointe (GPT-5.5, Claude Opus 4.7, Gemini 3.1 Pro, etc.) sur l'ensemble des 39 langues de rosetta
- **Plus de paires de langues** — quechua, inuktitut et autres langues peu dotées à mesure que des jeux de données vérifiés par la communauté deviennent disponibles
- **Importation de jeux de données** — outils pour convertir des jeux de données d'évaluation externes (WMT, Tatoeba, etc.) vers le format d'évaluation de rosetta
- **Réexécutions automatisées** — détection des changements de version des modèles et réexécution des bancs d'essai pour suivre la dérive des scores

---

## Voir aussi

- **[Classement des méthodes](/leaderboard)** — scores en direct et soumissions
- **[Harnais d'évaluation](/docs/eval/harness)** — comment exécuter les évaluations
- **[Jeux de données d'évaluation](/docs/eval/datasets)** — format des jeux de données et jeux de données disponibles
- **[Construire une méthode](/docs/eval/methods)** — spécification de l'interface de la méthode
- **[Spécification de la fiche d'exécution](/docs/eval/run-card)** — schéma JSON de la fiche d'exécution (run card)
- **[Soutenir une langue peu dotée](/docs/guides/low-resource-languages)** — le contexte plus large expliquant la raison d'être de ce cadre