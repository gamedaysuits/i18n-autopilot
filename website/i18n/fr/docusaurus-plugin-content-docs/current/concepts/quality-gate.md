---
sidebar_position: 3
title: "Quality Gate"
---
# Quality Gate

Chaque traduction est soumise à un filtre de validation déterministe avant d'être enregistrée sur le disque. Le Quality Gate intercepte les modes de défaillance fréquents de la traduction automatique — aucune solution de repli silencieuse, aucune donnée corrompue n'est inscrite dans vos fichiers de localisation.

## Vérifications de validation

| Vérification | Ce qu'elle détecte | Étiquette du filtre |
|-------|----------------|-----------|
| **Vide/blanc** | Le modèle a renvoyé une chaîne vide ou des espaces | `[GATE] empty` |
| **Écho de la source** | Le modèle a renvoyé l'entrée originale en anglais | `[GATE] source-echo` |
| **Boucle d'hallucination** | Motifs de trigrammes répétés (par ex., `"Qo' Qo' Qo'"`) | `[GATE] hallucination` |
| **Inflation de la longueur** | La sortie est significativement plus longue que la source | `[GATE] length` |
| **Conformité du script** | Script incorrect pour les paramètres régionaux cibles | `[GATE] script` |

### Vide/Blanc

Rejette les traductions qui sont des chaînes vides, composées uniquement d'espaces, ou `null`. Cela permet de détecter les modèles qui ne renvoient rien pour les clés complexes.

### Écho de la source

Détecte lorsque le modèle renvoie le texte source en anglais au lieu de le traduire. Ce phénomène est courant avec les chaînes courtes et les prompts sous-spécifiés.

### Boucle d'hallucination

Analyse les motifs de trigrammes (3 caractères) dans la sortie. Si un trigramme se répète un nombre de fois supérieur à un seuil défini par rapport à la longueur de la sortie, la traduction est rejetée. Cela permet de détecter les sorties dégénérées telles que `"Qo' Qo' Qo' Qo' Qo'"`.

### Inflation de la longueur

Rejette les traductions dont la longueur de sortie dépasse `maxLengthRatio × source length` (par défaut : 4×). Cela permet de détecter les hallucinations du modèle qui produisent des murs de texte pour une entrée courte.

Configurable via `maxLengthRatio` dans votre configuration.

### Conformité du script

Pour les paramètres régionaux dotés d'un champ `script` configuré (par ex., `"script": "cans"` pour les syllabaires du cri des plaines), valide que la sortie contient des caractères non-ASCII appropriés pour le script cible. Une sortie exclusivement latine pour des paramètres régionaux arabes, CJK ou syllabiques est rejetée.

## Ce qui se passe en cas d'échec

1. La traduction défaillante est journalisée dans stderr avec un préfixe `[GATE]`, le nom de la clé, la raison et un aperçu de la valeur
2. La clé n'est **pas** écrite dans le fichier de localisation
3. La cascade de nouvelles tentatives se déclenche (voir ci-dessous)

```
[GATE] hero.title: source-echo — "Welcome to our platform"
[GATE] nav.about: hallucination — "À À À À À À À À"
```

## Cascade de nouvelles tentatives

Lorsqu'un lot échoue (erreur d'analyse JSON ou rejets par le Quality Gate), rosetta effectue de nouvelles tentatives avec des lots de plus en plus petits :

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the 2 problem keys
```

Le budget de nouvelles tentatives est plafonné par `maxRetries` (par défaut : 3, configurable par langue). Cela empêche une dépense incontrôlée de tokens sur des clés qui échouent systématiquement.

Après épuisement des nouvelles tentatives, les clés problématiques sont journalisées et ignorées. Elles feront l'objet d'une nouvelle tentative lors de la prochaine exécution de `sync`.

## Mise en cache des prompts

Le message système (registre, règles de grammaire, notes de style) est séparé du message utilisateur (les clés à traduire). Cette séparation est intentionnelle :

- Le message système est **identique d'un lot à l'autre** pour un paramètre régional donné
- Les fournisseurs tels qu'Anthropic et Google mettent en cache les messages systèmes répétés
- Résultat : le premier lot paie le coût total en tokens, les lots suivants ne paient que pour le message utilisateur

Cela peut réduire considérablement les coûts en tokens pour les projets comportant de nombreux lots.