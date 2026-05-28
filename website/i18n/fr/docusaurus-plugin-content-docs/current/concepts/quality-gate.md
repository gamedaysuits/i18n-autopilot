---
sidebar_position: 3
title: "Quality Gate"
---
# Porte de qualité

Chaque traduction passe par une porte de validation déterministe avant d'être écrite sur le disque. La porte de qualité intercepte les modes de défaillance courants de la traduction automatique — aucun repli silencieux, aucune donnée corrompue n'est écrite dans vos fichiers de paramètres régionaux.

## Vérifications de validation

| Vérification | Ce qu'elle détecte | Étiquette de la porte |
|-------|----------------|-----------|
| **Vide/blanc** | Le modèle a renvoyé une chaîne vide ou des espaces | `[GATE] empty` |
| **Écho de la source** | Le modèle a renvoyé l'entrée originale en anglais | `[GATE] source-echo` |
| **Boucle d'hallucination** | Motifs de trigrammes répétés (par exemple, `"Qo' Qo' Qo'"`) | `[GATE] hallucination` |
| **Inflation de la longueur** | La sortie est considérablement plus longue que la source | `[GATE] length` |
| **Conformité du script** | Script incorrect pour le paramètre régional cible | `[GATE] script` |
| **Catégories de pluriel ICU** | Formes plurielles requises manquantes pour le paramètre régional | `[GATE] icu-plural` |

### Vide/Blanc

Rejette les traductions qui sont des chaînes vides, composées uniquement d'espaces, ou `null`. Cela permet de détecter les modèles qui ne renvoient rien pour les clés difficiles.

### Écho de la source

Détecte lorsque le modèle renvoie le texte source en anglais au lieu de le traduire. Courant avec les chaînes courtes et les prompts sous-spécifiés.

### Boucle d'hallucination

Analyse les motifs de trigrammes (3 caractères) dans la sortie. Si un trigramme se répète un nombre de fois supérieur à un seuil par rapport à la longueur de la sortie, la traduction est rejetée. Cela permet de détecter les sorties dégénérées telles que `"Qo' Qo' Qo' Qo' Qo'"`.

### Inflation de la longueur

Rejette les traductions dont la longueur de sortie dépasse `maxLengthRatio × source length` (par défaut : 4×). Cela permet de détecter les hallucinations du modèle qui produisent des murs de texte pour une entrée courte.

Configurable via `maxLengthRatio` dans votre configuration.

### Conformité du script

Pour les paramètres régionaux dotés d'un champ `script` configuré (par exemple, `"script": "cans"` pour les syllabaires du cri des plaines), valide que la sortie contient des caractères non-ASCII appropriés pour le script cible. Une sortie uniquement en caractères latins pour un paramètre régional arabe, CJK ou syllabique est rejetée.

## Ce qui se passe en cas d'échec

1. La traduction défaillante est journalisée dans stderr avec un préfixe `[GATE]`, le nom de la clé, la raison et un aperçu de la valeur
2. La clé n'est **pas** écrite dans le fichier de paramètres régionaux
3. La cascade de nouvelles tentatives se déclenche (voir ci-dessous)

```
[GATE] hero.title: source-echo — "Welcome to our platform"
[GATE] nav.about: hallucination — "À À À À À À À À"
```

## Cascade de nouvelles tentatives

Lorsqu'un lot échoue (erreur d'analyse JSON ou rejets de la porte de qualité), rosetta effectue de nouvelles tentatives avec des lots de plus en plus petits :

```
Full batch (80 keys) → parse error
  └→ Half batch (40 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the 2 problem keys
```

Le budget de nouvelles tentatives est plafonné par `maxRetries` (par défaut : 3, configurable par langue). Cela empêche les dépenses incontrôlées de tokens sur les clés qui échouent systématiquement.

Après épuisement des nouvelles tentatives, les clés problématiques sont journalisées et ignorées. Elles feront l'objet d'une nouvelle tentative lors de la prochaine exécution de `sync`.

## Mise en cache des prompts

Le message système (registre, règles de grammaire, notes de style) est séparé du message utilisateur (les clés à traduire). Cette séparation est intentionnelle :

- Le message système est **identique d'un lot à l'autre** pour un paramètre régional donné
- Les fournisseurs tels qu'Anthropic et Google mettent en cache les messages systèmes répétés
- Résultat : le premier lot paie le coût total en tokens, les lots suivants ne paient que pour le message utilisateur

Cela peut réduire considérablement les coûts en tokens pour les projets comportant de nombreux lots.

## Validation ICU MessageFormat

La commande `integrity` valide les modèles de pluriel ICU MessageFormat par rapport aux règles de pluriel CLDR. Si votre fichier source utilise la syntaxe ICU telle que :

```json
"items": "{count, plural, one {# item} other {# items}}"
```

Rosetta vérifie que les versions traduites incluent toutes les catégories de pluriel requises pour le paramètre régional cible. Par exemple, l'arabe nécessite six catégories (`zero`, `one`, `two`, `few`, `many`, `other`) — et non pas seulement `one` et `other`.

Exécutez `i18n-rosetta integrity` pour vérifier l'exhaustivité des pluriels sur l'ensemble des paramètres régionaux.

## Application de la terminologie

Pour les paires encadrées avec un dictionnaire, rosetta exécute une vérification terminologique post-traduction. Une fois la porte de qualité franchie, le système vérifie si le LLM a effectivement utilisé les termes requis du dictionnaire.

```
[TERM] en→fr: 2 term violation(s)
  • hero.title: "dashboard" → expected "tableau de bord" but got "panneau de contrôle"
```

Les violations de terminologie sont des **avertissements, et non des erreurs bloquantes**. La traduction est tout de même écrite sur le disque. Ceci est intentionnel — le LLM peut avoir des raisons valables de choisir une alternative (contexte, grammaire), et un blocage dû à des incohérences de termes causerait plus de tort que de bien.

Pour corriger les violations, mettez à jour le dictionnaire d'encadrement ou modifiez manuellement le fichier de paramètres régionaux.

---

## Voir aussi

- [Comment fonctionne la synchronisation](/docs/concepts/how-sync-works) — la place de la porte de qualité dans le pipeline
- [Méthodes de traduction](/docs/guides/translation-methods) — les méthodes qui alimentent la porte
- [Convertisseurs de script](/docs/concepts/script-converters) — la conversion de script après la porte
- [Données d'encadrement](/docs/concepts/coaching-data) — l'amélioration de la qualité de traduction en amont
- [Mémoire de traduction](/docs/concepts/translation-memory) — la mise en cache des traductions validées
- [Référence CLI — sync](/docs/reference/cli#sync) — options de synchronisation, y compris le comportement des nouvelles tentatives
- [Référence CLI — integrity](/docs/reference/cli#integrity) — audit des pluriels ICU