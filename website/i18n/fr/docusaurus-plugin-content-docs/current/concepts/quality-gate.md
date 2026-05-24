---
sidebar_position: 3
title: "Quality Gate"
---
# Quality Gate

Chaque traduction passe par un contrôle de validation déterministe avant d'être écrite sur le disque. Le Quality Gate détecte les modes de défaillance courants de la traduction automatique — aucun repli silencieux, aucune donnée indésirable n'est écrite dans vos fichiers de localisation.

## Vérifications de validation

| Vérification | Ce qu'elle détecte | Étiquette du contrôle |
|-------|----------------|-----------|
| **Vide/blanc** | Le modèle a renvoyé une chaîne vide ou des espaces | `[GATE] empty` |
| **Écho de la source** | Le modèle a renvoyé l'entrée anglaise d'origine | `[GATE] source-echo` |
| **Boucle d'hallucination** | Motifs de trigrammes répétés (par exemple, `"Qo' Qo' Qo'"`) | `[GATE] hallucination` |
| **Inflation de la longueur** | La sortie est considérablement plus longue que la source | `[GATE] length` |
| **Conformité du script** | Script incorrect pour les paramètres régionaux cibles | `[GATE] script` |

### Vide/Blanc

Rejette les traductions qui sont des chaînes vides, composées uniquement d'espaces, ou `null`. Cela permet de détecter les modèles qui ne renvoient rien pour les clés complexes.

### Écho de la source

Détecte lorsque le modèle renvoie le texte source anglais au lieu de le traduire. Courant avec les chaînes courtes et les invites sous-spécifiées.

### Boucle d'hallucination

Analyse les motifs de trigrammes (3 caractères) dans la sortie. Si un trigramme se répète un nombre de fois supérieur à un seuil par rapport à la longueur de la sortie, la traduction est rejetée. Cela permet de détecter les sorties dégénérées telles que `"Qo' Qo' Qo' Qo' Qo'"`.

### Inflation de la longueur

Rejette les traductions dont la longueur de sortie dépasse `maxLengthRatio × source length` (par défaut : 4×). Cela permet de détecter les hallucinations du modèle qui produisent des murs de texte pour une entrée courte.

Configurable via `maxLengthRatio` dans votre configuration.

### Conformité du script

Pour les paramètres régionaux dotés d'un champ `script` configuré (par exemple, `"script": "cans"` pour les caractères syllabiques du cri des plaines), valide que la sortie contient des caractères non-ASCII appropriés pour le script cible. Une sortie exclusivement latine pour des paramètres régionaux arabes, CJK ou syllabiques est rejetée.

## Que se passe-t-il en cas d'échec

1. La traduction défaillante est consignée dans stderr avec un préfixe `[GATE]`, le nom de la clé, la raison et un aperçu de la valeur
2. La clé n'est **pas** écrite dans le fichier de localisation
3. La cascade de nouvelles tentatives se déclenche (voir ci-dessous)

```
[GATE] hero.title: source-echo — "Welcome to our platform"
[GATE] nav.about: hallucination — "À À À À À À À À"
```

## Cascade de nouvelles tentatives

Lorsqu'un lot échoue (erreur d'analyse JSON ou rejets du Quality Gate), rosetta effectue de nouvelles tentatives avec des lots progressivement plus petits :

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the 2 problem keys
```

Le budget de nouvelles tentatives est plafonné par `maxRetries` (par défaut : 3, configurable par langue). Cela empêche les dépenses excessives de jetons pour les clés qui échouent systématiquement.

Après épuisement des nouvelles tentatives, les clés problématiques sont consignées et ignorées. Elles feront l'objet d'une nouvelle tentative lors de la prochaine exécution de `sync`.

## Mise en cache des invites

Le message système (registre, règles de grammaire, notes de style) est séparé du message utilisateur (les clés à traduire). Cette séparation est intentionnelle :

- Le message système est **identique d'un lot à l'autre** pour des paramètres régionaux donnés
- Les fournisseurs tels qu'Anthropic et Google mettent en cache les messages système répétés
- Résultat : le premier lot paie le coût total des jetons, les lots suivants ne paient que pour le message utilisateur

Cela peut réduire considérablement les coûts en jetons pour les projets comportant de nombreux lots.

---

## Voir aussi

- [Comment fonctionne la synchronisation](/docs/concepts/how-sync-works) — où le Quality Gate s'intègre dans le pipeline
- [Méthodes de traduction](/docs/guides/translation-methods) — méthodes qui alimentent le contrôle
- [Convertisseurs de script](/docs/concepts/script-converters) — conversion de script après le contrôle
- [Données d'entraînement](/docs/concepts/coaching-data) — amélioration de la qualité de traduction en amont
- [Référence de la CLI — sync](/docs/reference/cli#sync) — indicateurs de synchronisation, y compris le comportement des nouvelles tentatives