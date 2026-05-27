---
sidebar_position: 3
title: "Quality Gate"
---
# Quality Gate

Chaque traduction passe par un filtre de validation déterministe avant d'être écrite sur le disque. Le Quality Gate détecte les modes de défaillance courants de la traduction automatique — aucune solution de repli silencieuse, aucune donnée indésirable n'est écrite dans vos fichiers de localisation.

## Vérifications de validation

| Vérification | Ce qu'elle détecte | Étiquette du filtre |
|-------|----------------|-----------|
| **Vide/blanc** | Le modèle a renvoyé une chaîne vide ou des espaces | `[GATE] empty` |
| **Écho de la source** | Le modèle a renvoyé l'entrée originale en anglais | `[GATE] source-echo` |
| **Boucle d'hallucination** | Motifs de trigrammes répétés (par exemple, `"Qo' Qo' Qo'"`) | `[GATE] hallucination` |
| **Inflation de la longueur** | La sortie est considérablement plus longue que la source | `[GATE] length` |
| **Conformité de l'écriture** | Écriture incorrecte pour les paramètres régionaux cibles | `[GATE] script` |
| **Catégories de pluriel ICU** | Formes plurielles requises manquantes pour les paramètres régionaux | `[GATE] icu-plural` |

### Vide/Blanc

Rejette les traductions qui sont des chaînes vides, composées uniquement d'espaces, ou `null`. Cela permet de détecter les modèles qui ne renvoient rien pour les clés complexes.

### Écho de la source

Détecte lorsque le modèle renvoie le texte source en anglais au lieu de le traduire. Ce phénomène est courant avec les chaînes courtes et les invites sous-spécifiées.

### Boucle d'hallucination

Analyse les motifs de trigrammes (3 caractères) dans la sortie. Si un trigramme se répète un nombre de fois supérieur à un seuil par rapport à la longueur de la sortie, la traduction est rejetée. Cela permet de détecter les sorties dégénérées telles que `"Qo' Qo' Qo' Qo' Qo'"`.

### Inflation de la longueur

Rejette les traductions dont la longueur de sortie dépasse `maxLengthRatio × source length` (par défaut : 4×). Cela permet de détecter les hallucinations du modèle qui produisent des murs de texte pour une entrée courte.

Configurable via `maxLengthRatio` dans votre configuration.

### Conformité de l'écriture

Pour les paramètres régionaux dotés d'un champ `script` configuré (par exemple, `"script": "cans"` pour le syllabaire cri des plaines), valide le fait que la sortie contient des caractères non-ASCII appropriés pour l'écriture cible. Une sortie exclusivement latine pour des paramètres régionaux arabes, CJK ou syllabiques est rejetée.

## Ce qui se produit en cas d'échec

1. La traduction défaillante est consignée dans stderr avec un préfixe `[GATE]`, le nom de la clé, la raison et un aperçu de la valeur.
2. La clé n'est **pas** écrite dans le fichier de localisation.
3. La cascade de nouvelles tentatives se déclenche (voir ci-dessous).

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

Le budget de nouvelles tentatives est plafonné par `maxRetries` (par défaut : 3, configurable par langue). Cela empêche une dépense incontrôlée de jetons pour des clés qui échouent systématiquement.

Après épuisement des nouvelles tentatives, les clés problématiques sont consignées et ignorées. Elles feront l'objet d'une nouvelle tentative lors de la prochaine exécution de `sync`.

## Mise en cache des invites

Le message système (registre, règles de grammaire, notes de style) est séparé du message utilisateur (les clés à traduire). Cette séparation est intentionnelle :

- Le message système est **identique d'un lot à l'autre** pour des paramètres régionaux donnés.
- Les fournisseurs tels qu'Anthropic et Google mettent en cache les messages systèmes répétés.
- Résultat : le premier lot paie le coût total en jetons, les lots suivants ne paient que pour le message utilisateur.

Cela peut réduire considérablement les coûts en jetons pour les projets comportant de nombreux lots.

## Validation ICU MessageFormat

La commande `integrity` valide les modèles de pluriel ICU MessageFormat par rapport aux règles de pluriel CLDR. Si votre fichier source utilise la syntaxe ICU telle que :

```json
"items": "{count, plural, one {# item} other {# items}}"
```

Rosetta vérifie que les versions traduites incluent toutes les catégories de pluriel requises pour les paramètres régionaux cibles. Par exemple, l'arabe nécessite six catégories (`zero`, `one`, `two`, `few`, `many`, `other`) — et non pas seulement `one` et `other`.

Exécutez `i18n-rosetta integrity` pour vérifier l'exhaustivité des pluriels sur l'ensemble des paramètres régionaux.

## Application de la terminologie

Pour les paires encadrées avec un dictionnaire, rosetta exécute une vérification terminologique post-traduction. Une fois le Quality Gate franchi, il vérifie si le LLM a effectivement utilisé les termes requis du dictionnaire.

```
[TERM] en→fr: 2 term violation(s)
  • hero.title: "dashboard" → expected "tableau de bord" but got "panneau de contrôle"
```

Les violations de terminologie sont des **avertissements, et non des erreurs bloquantes**. La traduction est tout de même écrite sur le disque. Ceci est intentionnel — le LLM peut avoir des raisons valables de choisir une alternative (contexte, grammaire), et un blocage dû à des incohérences de termes causerait plus de tort que de bien.

Pour corriger les violations, mettez à jour le dictionnaire d'encadrement ou modifiez manuellement le fichier de localisation.

---

## Voir aussi

- [Comment fonctionne la synchronisation](/docs/concepts/how-sync-works) — la place du Quality Gate dans le pipeline
- [Méthodes de traduction](/docs/guides/translation-methods) — les méthodes qui alimentent le filtre
- [Convertisseurs d'écriture](/docs/concepts/script-converters) — conversion d'écriture après le filtre
- [Données d'encadrement](/docs/concepts/coaching-data) — amélioration de la qualité de traduction en amont
- [Mémoire de traduction](/docs/concepts/translation-memory) — mise en cache des traductions validées
- [Référence CLI — sync](/docs/reference/cli#sync) — indicateurs de synchronisation, y compris le comportement des nouvelles tentatives
- [Référence CLI — integrity](/docs/reference/cli#integrity) — audit des pluriels ICU