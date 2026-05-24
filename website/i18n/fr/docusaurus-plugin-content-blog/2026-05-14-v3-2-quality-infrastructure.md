---
slug: v3-2-quality-infrastructure
title: "v3.2.0 : Infrastructure de qualité de niveau industriel"
authors: [curtisforbes]
tags: [release]
date: 2026-05-14
---
La version v3.2.0 est la version dédiée à la qualité. 702 tests, 163 suites de tests, tolérance zéro pour les défaillances silencieuses.

<!-- truncate -->

## Modifications apportées

### Quality Gate (5 vérifications)

Chaque traduction passe désormais par cinq vérifications de validation déterministes avant d'être écrite sur le disque :

1. **Empty/blank** — Le modèle n'a rien renvoyé
2. **Source echo** — Le modèle a renvoyé l'entrée en anglais
3. **Hallucination loop** — Motifs de trigrammes répétés
4. **Length inflation** — Sortie au moins 4 fois plus longue que la source
5. **Script compliance** — Script incorrect pour les paramètres régionaux

Aucune traduction n'est écrite sans avoir passé avec succès l'ensemble de ces cinq vérifications. Les traductions ayant échoué sont consignées dans les journaux et réessayées.

### Retry Cascade

Lorsqu'un lot échoue, rosetta effectue de nouvelles tentatives avec des lots progressivement plus petits :

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the problem keys
```

### Renforcement de la sécurité

- **Prototype pollution guard** — Les clés `__proto__` et `constructor` sont rejetées lors de l'analyse
- **Path traversal guard** — Les codes de paramètres régionaux manipulés ne peuvent pas écrire en dehors des répertoires configurés
- **Response validation** — Seules les clés ayant été envoyées sont acceptées en retour

### Infrastructure de test

| Suite | Tests | Ce qu'elle couvre |
|-------|-------|---------------|
| Core (8 suites) | 280+ | Config, sync, CLI, watch, audit, pairs, format, init |
| Red team | 89 | Entrées adverses, attaques d'encodage |
| Contract | 120 | Contrats d'intégration d'API |
| Performance | 36 | Optimisation des lots, régression du débit |
| Coverage | 702 au total | Pipeline complet |

### Prompt Caching

Les messages système sont désormais séparés des messages utilisateur, permettant d'exploiter le cache de prompt chez des fournisseurs tels qu'Anthropic et Google. Cela réduit considérablement les coûts en jetons pour les synchronisations multi-lots.

Consultez la [documentation Quality Gate](/docs/concepts/quality-gate) et la [documentation sur la sécurité](/docs/concepts/security) pour connaître tous les détails techniques.