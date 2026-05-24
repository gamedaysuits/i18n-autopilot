---
sidebar_position: 5
title: "Soutenir une langue peu dotée"
---
# Soutenir une langue peu dotée

:::info Statut : En cours de développement actif
La prise en charge du cri des plaines (nêhiyawêwin) est actuellement en cours de développement. Les outils, le harnais d'évaluation et le classement décrits ici sont réels et utilisables dès aujourd'hui, mais le pipeline de traduction pour le cri n'a pas encore été publié. Lorsqu'il le sera, cela servira de modèle pour d'autres langues polysynthétiques et peu dotées disposant d'une infrastructure FST.
:::

## Le problème non résolu

Google Translate prend en charge environ 130 langues. Il en existe plus de 7 000 parlées sur Terre. Pour des milliers de langues — y compris de nombreuses langues autochtones ayant des communautés de locuteurs actives — il n'existe aucune API de traduction commerciale, aucun grand corpus parallèle n'a été assemblé et aucun modèle pré-entraîné ne produit de résultats fiables.

Il ne s'agit pas d'une lacune qui se comblera d'elle-même. Les langues peu dotées le sont *parce que* l'économie de la traduction automatique (TA) commerciale ne les atteint pas. Les locuteurs qui ont le plus besoin de ces outils sont les mêmes communautés pour lesquelles il est le moins probable qu'on les développe.

**rosetta a été conçu pour changer cela.**

Le [Classement des méthodes](/leaderboard) (Method Leaderboard) est un défi ouvert : concevez la meilleure méthode de traduction pour une langue mal desservie, prouvez-le par une évaluation reproductible et obtenez le meilleur score. N'importe qui dans le monde peut y contribuer — linguistes, chercheurs en apprentissage automatique (ML), travailleurs linguistiques communautaires, étudiants, passionnés. Le problème n'est pas résolu. L'infrastructure est en place. Le classement vous attend.

---

## Pourquoi cela est difficile : La morphologie polysynthétique

La plupart des systèmes de TA commerciaux ont été conçus pour des langues telles que l'anglais, le français et le chinois — des langues où les mots sont relativement courts et où les phrases sont construites à partir de jetons (tokens) distincts. Cependant, de nombreuses langues autochtones, dont le cri des plaines, sont **polysynthétiques** : un seul mot peut encoder ce que l'anglais ou le français exprime par une phrase entière.

### L'exemple du cri

Considérez le mot en cri des plaines :

> **ê-kî-nitawi-kîskinwahamâkosiyân**
> *"quand je suis allé à l'école"*

Il s'agit d'**un seul mot**. Il encode le temps (passé), la direction (aller vers), la racine (apprendre), la voix (passive/réfléchie) et la personne (première du singulier). Un grand modèle de langage (LLM) entraîné principalement sur l'anglais n'a aucune intuition pour ce type de densité morphologique.

Les défis s'accumulent :

| Défi | Ce que cela signifie |
|-----------|--------------|
| **Complexité morphologique** | Une seule racine verbale peut générer des milliers de formes fléchies valides par préfixation, suffixation et circonfixation |
| **Distinction animé/inanimé** | Les noms sont grammaticalement animés ou inanimés — cela affecte la conjugaison des verbes, les démonstratifs et la pluralisation. La classification ne suit pas toujours l'animation biologique (*askiy* "terre" est animé ; *maskisin* "chaussure" est également animé) |
| **Obviation** | Les références à la troisième personne sont classées par proximité/saillance. La distinction entre "proximatif" et "obviatif" n'a pas d'équivalent en anglais (ni en français) |
| **Données d'entraînement clairsemées** | Les LLM ont vu très peu de textes en cri des plaines. Ce qu'ils ont vu peut mélanger des dialectes (dialecte en Y, dialecte en TH) ou des orthographes (SRO contre syllabaire) |
| **Aucune référence commerciale** | Google Translate ne renvoie rien d'utile. Il n'existe aucune API prête à l'emploi à laquelle se comparer |

C'est pourquoi la traduction des langues polysynthétiques demeure un **problème de recherche ouvert** — et pourquoi un classement noté et reproductible est important.

---

## État de l'art : Comment ce problème a été abordé

### Le FST d'ALTLab

La ressource informatique la plus importante pour le cri des plaines est le **transducteur à états finis (FST)** développé par l'[Alberta Language Technology Lab (ALTLab)](https://altlab.artsrn.ualberta.ca/) de l'Université de l'Alberta, en collaboration avec [Giellatekno](https://giellatekno.uit.no/) de l'UiT, l'Université arctique de Norvège.

Le FST d'ALTLab est un **analyseur et générateur morphologique** : à partir d'un mot cri fléchi, il peut le décomposer en sa racine et ses étiquettes grammaticales, et à partir d'une racine accompagnée d'étiquettes, il peut générer la forme fléchie correcte. Ce processus est déterministe — pas de réseau de neurones, pas d'hallucination, pas de probabilité. Si le FST accepte un mot, ce mot est morphologiquement valide.

C'est pourquoi le classement de rosetta suit le **Taux d'acceptation FST** (FST Acceptance Rate) en tant que métrique. Une méthode de traduction qui produit des mots rejetés par le FST génère un cri morphologiquement invalide — indépendamment de ce qu'indique le score chrF++.

**Ressources clés d'ALTLab :**
- [itwêwina](https://itwewina.altlab.app/) — un dictionnaire intelligent cri des plaines–anglais propulsé par le FST
- [Morphodict](https://github.com/UAlbertaALTLab/morphodict) — plateforme de dictionnaire open-source sensible à la morphologie
- [crk-db](https://github.com/UAlbertaALTLab/crk-db) — base de données lexicale du cri des plaines
- [Outils du 21e siècle pour les langues autochtones](https://21c.tools/) (21st Century Tools for Indigenous Languages) — le contexte plus large du projet

### Registres mondiaux de FST et de morphologie

Le cri des plaines n'est pas la seule langue à disposer d'une infrastructure FST de haute qualité. Si vous souhaitez développer des pipelines de traduction pour d'autres langues peu dotées ou morphologiquement complexes, vous pouvez exploiter ces pôles mondiaux établis :

* **[GiellaLT / Giellatekno](https://giellalt.github.io/) (UiT, l'Université arctique de Norvège) :** Le plus grand dépôt d'analyseurs et de générateurs morphologiques FST open-source, couvrant plus de 100 langues. Les domaines d'intérêt incluent les langues sames (`sme`, `smj`, `sma`, etc.), les langues ouraliennes (komi, erzya, oudmourte, etc.) et d'autres langues minoritaires/autochtones. Ils hébergent des corpus de textes publics traités (`corpus-xxx`) dans leur [organisation GitHub](https://github.com/giellalt/).
* **[Le projet Apertium](https://www.apertium.org/) :** Une plateforme open-source de traduction automatique basée sur des règles. Apertium maintient des analyseurs morphologiques FST hautement optimisés (utilisant `lttoolbox` et `hfst`) ainsi que des dictionnaires bilingues pour des dizaines de langues, y compris un vaste ensemble de langues turciques (kazakh, tatar, kirghize, etc.) et de langues européennes minoritaires. Toutes les ressources sont publiques sur le [GitHub d'Apertium](https://github.com/apertium).
* **[UniMorph (Morphologie Universelle)](https://unimorph.github.io/) :** Un projet collaboratif fournissant des paradigmes morphologiques standardisés pour plus de 150 langues. Le jeu de données est hébergé sur Hugging Face à l'adresse [unimorph/universal_morphologies](https://huggingface.co/datasets/unimorph/universal_morphologies). Si un binaire FST compilé n'est pas disponible pour une langue, les tables UniMorph peuvent être utilisées comme une porte de validation par recherche dans une base de données statique.
* **[Conseil national de recherches Canada (CNRC)](https://nrc-digital-repository.canada.ca/) :** Propose des outils pour les langues autochtones canadiennes, notamment l'analyseur morphologique FST pour l'inuktitut **Uqailaut** et le vaste **Corpus parallèle du Hansard du Nunavut** (1,3 million de paires de phrases alignées anglais-inuktitut).

### Le corpus EdTeKLA

Le [groupe de recherche EdTeKLA](https://spaces.facsci.ualberta.ca/edtekla/) (également à l'Université de l'Alberta) a assemblé un corpus linguistique du cri des plaines à partir de supports éducatifs, de transcriptions audio et de sources communautaires. Le jeu de données d'évaluation de rosetta [EDTeKLA Dev v1](/docs/eval/datasets) est dérivé de ce travail, sous licence [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).

### Autres approches testées ou envisageables

Le classement est agnostique quant à la méthode. Voici des stratégies qui ont été explorées ou proposées pour la TA à faibles ressources, et qui pourraient toutes être soumises :

| Approche | Fonctionnement | Avantages | Inconvénients |
|----------|-------------|------|------|
| **Prompting LLM encadré (Coached)** | Injecter des règles de grammaire, des dictionnaires et des paires d'exemples dans le prompt système | Itération rapide, aucun entraînement requis | Plafond de qualité limité par les connaissances de base du LLM |
| **Prompting few-shot** | Inclure des traductions vérifiées comme exemples en contexte | Bon pour un style cohérent | Fenêtre de contexte restreinte ; les exemples ne doivent PAS provenir des données d'évaluation |
| **Pipeline validé par FST** | Le LLM génère → le FST valide → rejette et réessaie en cas de morphologie invalide | Garantit la validité morphologique | Nécessite une infrastructure FST ; les boucles de réessai ajoutent de la latence et des coûts |
| **Recherche dans un dictionnaire + LLM** | Forcer l'utilisation de termes connus issus d'un dictionnaire bilingue, laisser le LLM gérer le reste | Réduit les hallucinations pour les termes connus | La couverture du dictionnaire est toujours incomplète |
| **Modèle affiné (Fine-tuned)** | Affiner un modèle ouvert (Llama, Mistral) sur des textes parallèles — mais pas sur les données d'évaluation | Qualité potentiellement la plus élevée | Nécessite un corpus parallèle (rare) ; coûteux ; risque de surapprentissage (overfitting) |
| **Modèles enchaînés** | Le modèle A génère une traduction brute → le modèle B effectue une post-édition → le modèle C évalue | Peut combiner les forces de spécialistes | Complexe ; lent ; coûteux |
| **Hybride basé sur des règles + LLM** | Utiliser des règles linguistiques pour les modèles connus, le LLM pour tout le reste | Précis là où les règles s'appliquent | Nécessite une expertise linguistique approfondie |
| **Augmentation par rétro-traduction** | Générer des données parallèles synthétiques en traduisant du cri vers l'anglais, puis s'entraîner sur l'inverse | Élargit les données d'entraînement à moindre coût | Amplifie les erreurs existantes du modèle |
| **Approche évolutionniste** | Générer des traductions candidates, les évaluer, muter les plus performantes, répéter | Peut découvrir des solutions inédites ; parallélisable | Coûteux en calcul ; nécessite une bonne fonction d'aptitude (fitness function) |
| **Traduction partielle** | Traduire manuellement un échantillon représentatif, prouver que votre méthode correspond à votre style sur celui-ci, puis traduire automatiquement le reste | Combine la qualité humaine et l'échelle de la machine | Nécessite un effort humain initial |
| **JSON manuel / notation d'examen** | Créer manuellement un fichier JSON de jeu de données pour tester les réponses des étudiants à un examen de langue, ou évaluer un lot de traductions humaines par rapport à une référence (gold standard) | Aucun ML requis ; fonctionne pour l'éducation et l'assurance qualité (QA) | Ne passe pas à l'échelle pour des besoins de traduction continus |

### Ce n'est que du JSON

Le harnais prend du JSON en entrée et renvoie des scores en JSON. Le [format du jeu de données](/docs/eval/datasets) est simple :

```json
{
  "entries": [
    { "index": 0, "source_text": "Hello", "target_expected": "tânisi" },
    { "index": 1, "source_text": "Thank you", "target_expected": "kinanâskomitin" }
  ]
}
```

Vous pouvez le construire à la main. Vous pouvez l'exporter depuis une feuille de calcul. Vous pouvez le générer à partir d'un corpus. Un professeur de langue pourrait l'utiliser pour évaluer les traductions de ses étudiants. Une agence de traduction pourrait l'utiliser pour évaluer des pigistes. Un laboratoire de recherche pourrait l'utiliser pour comparer des architectures de modèles. Le harnais ne se soucie pas de la provenance du JSON — il se contente de l'évaluer.

Et parce que le framework de déploiement en production utilise la même interface de plugin, une méthode qui obtient un bon score dans le harnais se déploie sur votre site web avec une seule modification de configuration. **Prouvez-le et utilisez-le.**

Les possibilités sont véritablement infinies. **Si vous avez une idée, développez-la, exécutez le harnais et soumettez vos scores.**

---

## La place de rosetta

rosetta fournit la couche d'infrastructure — vous apportez la méthode.

### Le système d'encadrement (coaching)

La méthode `llm-coached` de rosetta vous permet d'injecter des connaissances linguistiques directement dans le prompt du LLM :

```json title=".rosetta/coaching/crk.json"
{
  "grammar_rules": [
    "Plains Cree is polysynthetic — a single word can express what English needs a full sentence for",
    "Animate/inanimate noun distinction affects verb conjugation, demonstratives, and pluralization",
    "Use SRO (Standard Roman Orthography) as the working script — syllabic conversion is handled by the deterministic converter",
    "Obviation: when two third-person referents appear, the less salient one takes obviative marking (-a suffix on nouns, -iyiwa on verbs)"
  ],
  "dictionary": {
    "home": "kīwēwin",
    "settings": "isi-nākatohkēwin",
    "search": "nānātawāpahtam",
    "welcome": "tānisi",
    "dashboard": "kīskinwahamākēwin-māsinahikan"
  },
  "style_notes": "Use formal register appropriate for educational and community contexts. Preserve English technical terms in parentheses when no Cree equivalent exists or is widely accepted."
}
```

Les données d'encadrement sont injectées dans chaque prompt de LLM pour la paire `en:crk`, fournissant au modèle un contexte linguistique structuré qu'il n'aurait pas autrement. Consultez [Données d'encadrement](/docs/concepts/coaching-data) (Coaching Data) pour les spécifications complètes.

### Registres

Le registre fait partie du prompt système qui oriente le ton, le niveau de formalité et les conventions orthographiques. rosetta est fourni avec un registre pour le cri des plaines :

```
nêhiyawêwin (Plains Cree). Use SRO (Standard Roman Orthography) as the working
script. Output will be converted to Syllabics via deterministic converter.
Professional register appropriate for educational and community contexts.
```

Vous pouvez remplacer cela dans votre configuration pour expérimenter différentes stratégies de prompting :

```json title="i18n-rosetta.config.json"
{
  "languages": {
    "crk": {
      "register": "Casual Plains Cree (Y-dialect). Use SRO. Prefer everyday vocabulary over formal or archaic terms. Address the reader directly."
    }
  }
}
```

Différents registres produisent différents styles de traduction — et différents scores dans le classement. Chaque soumission enregistre le registre exact et le prompt système utilisés (sous forme de hachage SHA-256 dans la [fiche d'exécution](/docs/eval/run-card) ou run card), de sorte que les expériences sont reproductibles.

### Conversion d'écriture

Le cri des plaines s'écrit dans deux systèmes d'écriture : l'**Orthographe romaine standard (SRO)** et le **Syllabaire autochtone canadien**. Le pipeline de rosetta :

1. Le LLM traduit en SRO (basé sur l'alphabet latin, que les LLM gèrent mieux)
2. La porte de qualité (quality gate) valide la sortie en SRO
3. Un convertisseur déterministe transforme le SRO → Syllabaire
4. Le texte converti est écrit sur le disque

Le convertisseur gère tous les signes diacritiques du SRO (ê, î, ô, â pour les voyelles longues) et les associe aux caractères syllabiques corrects. Consultez [Convertisseurs d'écriture](/docs/concepts/script-converters) (Script Converters) pour les détails techniques.

### La boucle d'évaluation

Le [harnais d'évaluation](/docs/eval/harness) exécute votre méthode par rapport au jeu de données d'évaluation et produit une [fiche d'exécution](/docs/eval/run-card) notée :

```bash
# Clone the harness
git clone https://github.com/gamedaysuits/gds-mt-eval-harness.git
cd gds-mt-eval-harness
pip install -e .

# Run a baseline experiment
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --model google/gemini-2.5-pro \
  --condition coached-v7

# Run with FST validation (if you have an FST binary)
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --fst-analyzer ./bin/crk-analyzer \
  --condition fst-gated-v1
```

L'indicateur `--condition` est une étiquette que vous choisissez. Il apparaît dans le classement afin que les utilisateurs puissent voir quelle stratégie de prompt vous avez utilisée. Le harnais enregistre le prompt système complet dans la fiche d'exécution, de sorte que votre approche exacte est reproductible.

:::tip Expérimentez librement, soumettez votre meilleur résultat
Le harnais est conçu pour une itération rapide. Exécutez des dizaines d'expériences avec différents modèles, données d'encadrement, registres et conditions. Ne soumettez au classement que lorsque vous avez un résultat dont vous êtes fier.
:::

---

## Principes PCAP (OCAP)

rosetta est conçu pour soutenir la souveraineté des données autochtones. Les [principes PCAP](https://fnigc.ca/ocap-training/) (Propriété, Contrôle, Accès, Possession - OCAP en anglais) guident notre approche des technologies linguistiques pour les communautés autochtones :

| Principe | Comment rosetta le soutient |
|-----------|------------------------|
| **Propriété** | Les communautés linguistiques sont propriétaires de leurs données linguistiques. rosetta ne communique jamais avec l'extérieur et ne transmet aucune donnée à nos serveurs |
| **Contrôle** | La [méthode API](/docs/guides/serving-a-method) permet aux communautés d'héberger leur propre pipeline de traduction — nous fournissons l'interface, elles contrôlent l'implémentation |
| **Accès** | Les communautés décident qui peut utiliser leur méthode. L'API peut être restreinte par une authentification |
| **Possession** | Toutes les données de traduction restent dans le système de fichiers de votre projet. Le [système de provenance](/docs/concepts/security) retrace l'origine de chaque traduction |

L'architecture par plugins signifie qu'une communauté peut concevoir une méthode qui intègre des connaissances sacrées ou restreintes en interne, n'exposer que l'API de traduction et conserver un contrôle total sur ses ressources linguistiques.

---

## La vision : Ce qui vient ensuite

Le cri des plaines est la première cible. Une fois le pipeline validé et la communauté satisfaite de la qualité, la même architecture s'étendra à d'autres langues polysynthétiques disposant d'une infrastructure FST :

- **Autres langues algonquiennes** : cri des bois, cri des marais, ojibwé, pied-noir
- **Langues inuites** : inuktitut, inuinnaqtun (qui utilisent également des écritures syllabiques)
- **Autres familles de langues** : toute langue dotée d'un analyseur FST peut utiliser le pipeline validé par FST

Le classement est défini par paire de langues. À mesure que de nouveaux jeux de données d'évaluation sont fournis par les communautés linguistiques, de nouvelles catégories de classement s'ouvrent automatiquement.

**Il s'agit d'une invitation ouverte.** Si vous travaillez avec une langue peu dotée — en tant que chercheur, membre de la communauté, étudiant ou simplement en tant que personne concernée — rosetta vous donne les outils pour construire quelque chose de concret, le mesurer honnêtement et le partager avec le monde. Le [Classement des méthodes](/leaderboard) attend votre soumission.

---

## Voir aussi

- **[Classement des méthodes](/leaderboard)** — soumettez vos scores et comparez les méthodes
- **[Évaluation de la TA](/docs/eval/)** — ce qui fait une bonne méthode, ce qui entraîne une disqualification
- **[Harnais d'évaluation](/docs/eval/harness)** — comment exécuter des expériences
- **[Jeux de données d'évaluation](/docs/eval/datasets)** — EDTeKLA Dev v1 et FLORES+
- **[Données d'encadrement](/docs/concepts/coaching-data)** — comment structurer les connaissances linguistiques pour le LLM
- **[Convertisseurs d'écriture](/docs/concepts/script-converters)** — le pipeline SRO→Syllabaire
- **[Servir une méthode via API](/docs/guides/serving-a-method)** — héberger une traduction contrôlée par la communauté
- **[ALTLab](https://altlab.artsrn.ualberta.ca/)** — l'Alberta Language Technology Lab
- **[EdTeKLA](https://spaces.facsci.ualberta.ca/edtekla/)** — le groupe de recherche Educational Technology, Knowledge & Language
- **[Dictionnaire itwêwina](https://itwewina.altlab.app/)** — dictionnaire cri des plaines–anglais propulsé par FST