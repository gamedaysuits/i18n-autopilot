---
sidebar_position: 4
title: "Sécurité"
---
# Sécurité et Sûreté

Rosetta est conçu pour être sécurisé dans des environnements hostiles — où les données de localisation peuvent provenir de sources non fiables, où des noms de fichiers manipulés pourraient outrepasser les limites des répertoires, et où les résultats du LLM peuvent contenir des éléments imprévisibles.

## Modèle de menace

| Menace | Vecteur d'attaque | Atténuation |
|--------|--------------|-----------|
| **Pollution de prototype** | Clés JSON manipulées (`__proto__`, `constructor`) | Rejetées lors de l'analyse |
| **Traversée de répertoire** | Codes de localisation tels que `../../etc/passwd` | Écritures de fichiers validées vers les répertoires configurés |
| **Corruption de bloc de code** | Le LLM traduit à l'intérieur des blocs de code | Protection par sentinelle Unicode |
| **Clés hallucinées** | Le LLM renvoie des clés qui n'ont pas été envoyées | Validation de la réponse — seules les clés acceptées sont écrites |
| **Dépense incontrôlée de jetons** | Boucles de réessai infinies | Budget plafonné via `maxRetries` |

## Protection contre la pollution de prototype

Toutes les clés de localisation sont validées par rapport à une liste de blocage avant traitement :

- `__proto__`
- `constructor`
- `prototype`

Toute clé correspondant à ces modèles est rejetée avec une erreur. Cela empêche les attaquants d'utiliser des fichiers de localisation manipulés pour modifier les prototypes d'objets JavaScript.

## Confinement des chemins

Lors de l'écriture des fichiers de localisation, rosetta valide que le chemin de sortie reste dans les limites des répertoires configurés (`localesDir`, `contentDir`). Les codes de localisation sont assainis — un code tel que `../../secrets` ne peut pas écrire en dehors du répertoire attendu.

## Protection des blocs

Lors de la traduction du contenu Markdown, les éléments structurés sont remplacés par des espaces réservés de sentinelles Unicode avant que le texte ne soit envoyé au LLM :

1. **Blocs de code** (délimités et en ligne) → sentinelle
2. **Shortcodes Hugo** (`{{< >}}`, `{{% %}}`) → sentinelle  
3. **HTML brut** → sentinelle
4. **Variables d'interpolation** (`{{ .Count }}`) → sentinelle

Après la traduction, les sentinelles sont remplacées par le contenu d'origine. Le LLM ne voit jamais les blocs de code, les shortcodes ou le HTML — il ne peut donc pas les corrompre.

## Validation des réponses

Lorsque le LLM renvoie une réponse JSON, rosetta valide que :
- Seules les clés qui ont été envoyées dans le lot apparaissent dans la réponse
- Aucune clé supplémentaire n'est injectée
- La réponse peut être analysée comme un JSON valide

Les clés hallucinées sont ignorées silencieusement. Cela empêche les sorties du LLM d'injecter des traductions inattendues dans vos fichiers de localisation.

## Porte de qualité

Chaque traduction est validée par cinq vérifications déterministes avant d'être écrite sur le disque. Consultez [Porte de qualité](/docs/concepts/quality-gate) pour plus de détails.

## Temporisation exponentielle

Les appels d'API utilisent une temporisation exponentielle avec gigue sur les réponses 429 (limite de débit) et 5xx (erreur serveur). Trois tentatives avec un délai croissant évitent de saturer l'API pendant les pannes.

## Délai d'attente de la requête

Chaque requête d'API a un délai d'attente de 30 secondes via `AbortController`. Cela empêche le processus de synchronisation de se bloquer indéfiniment sur une connexion morte.

## Mode de repli

Lorsque l'API est indisponible, `--fallback` écrit des espaces réservés préfixés par `[EN]` au lieu de véritables traductions :

```bash
npx i18n-rosetta sync --fallback
```

```json
{
  "hero.title": "[EN] Welcome to our platform"
}
```

Ces espaces réservés sont automatiquement détectés et retraduits lors de la prochaine synchronisation avec une clé d'API valide. Ils ne sont jamais considérés comme « traduits » — `audit` les signalera.

## Tests

Les propriétés de sécurité sont vérifiées par la suite de tests hostiles :

```bash
npm run test:redteam    # prototype pollution, path traversal, encoding attacks
```

---

## Voir aussi

- [Architecture](/docs/concepts/architecture) — comment l'écosystème à trois composants se connecte
- [Référence CLI — integrity](/docs/reference/cli#integrity) — commande de vérification d'intégrité
- [Référence CLI — provenance](/docs/reference/cli#provenance) — commande d'audit de provenance
- [Spécification des plugins](/docs/reference/plugin-spec) — champs de provenance dans les manifestes de plugins
- [Porte de qualité](/docs/concepts/quality-gate) — vérifications de sécurité au niveau de la traduction