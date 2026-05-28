---
sidebar_position: 4
title: "Sécurité"
---
# Sécurité et sûreté

Rosetta est conçu pour garantir la sécurité au sein d'environnements hostiles — où les données de localisation pourraient provenir de sources non fiables, où des noms de fichiers falsifiés pourraient outrepasser les limites des répertoires, et où les résultats générés par le LLM peuvent contenir des éléments imprévisibles.

## Modèle de menace

| Menace | Vecteur d'attaque | Mesure d'atténuation |
|--------|--------------|-----------|
| **Pollution de prototype** | Clés JSON falsifiées (`__proto__`, `constructor`) | Rejetées lors de l'analyse syntaxique |
| **Traversée de répertoire** | Codes de localisation tels que `../../etc/passwd` | Écritures de fichiers validées vers les répertoires configurés |
| **Corruption des blocs de code** | Le LLM traduit à l'intérieur des blocs de code | Protection par sentinelles Unicode |
| **Clés hallucinées** | Le LLM renvoie des clés qui n'ont pas été envoyées | Validation de la réponse — seules les clés acceptées sont écrites |
| **Dépense incontrôlée de jetons** | Boucles de réessais infinies | Budget plafonné via `maxRetries` |

## Protection contre la pollution de prototype

Toutes les clés de localisation sont validées par rapport à une liste de blocage avant traitement :

- `__proto__`
- `constructor`
- `prototype`

Toute clé correspondant à ces modèles est rejetée avec une erreur. Cela empêche les attaquants d'utiliser des fichiers de localisation falsifiés pour modifier les prototypes d'objets JavaScript.

## Confinement des chemins d'accès

Lors de l'écriture des fichiers de localisation, rosetta valide que le chemin de sortie reste dans les limites des répertoires configurés (`localesDir`, `contentDir`). Les codes de localisation sont assainis — un code tel que `../../secrets` ne peut pas écrire en dehors du répertoire attendu.

## Protection des blocs

Lors de la traduction du contenu Markdown, les éléments structurés sont remplacés par des espaces réservés (sentinelles Unicode) avant que le texte ne soit envoyé au LLM :

1. **Blocs de code** (délimités et en ligne) → sentinelle
2. **Shortcodes Hugo** (`{{< >}}`, `{{% %}}`) → sentinelle  
3. **HTML brut** → sentinelle
4. **Variables d'interpolation** (`{{ .Count }}`) → sentinelle

Après la traduction, les sentinelles sont remplacées par le contenu d'origine. Le LLM ne voit jamais les blocs de code, les shortcodes ou le HTML — il ne peut donc pas les corrompre.

## Validation des réponses

Lorsque le LLM renvoie une réponse JSON, rosetta valide que :
- Seules les clés qui ont été envoyées dans le lot apparaissent dans la réponse
- Aucune clé supplémentaire n'est injectée
- La réponse est analysée comme un JSON valide

Les clés hallucinées sont ignorées silencieusement. Cela empêche les sorties du LLM d'injecter des traductions inattendues dans vos fichiers de localisation.

## Quality Gate

Chaque traduction est validée par cinq vérifications déterministes avant d'être écrite sur le disque. Consultez la section [Quality Gate](/docs/concepts/quality-gate) pour plus de détails.

## Temporisation exponentielle

Les appels d'API utilisent une temporisation exponentielle avec gigue (jitter) lors des réponses 429 (limite de débit) et 5xx (erreur de serveur). Trois tentatives avec un délai croissant évitent de saturer l'API pendant les pannes.

## Délai d'attente des requêtes

Chaque requête d'API dispose d'un délai d'attente de 30 secondes via `AbortController`. Cela empêche le processus de synchronisation de se bloquer indéfiniment sur une connexion inactive.

## Signalement explicite des échecs de traduction

Lorsque l'API est indisponible ou qu'une traduction échoue, rosetta génère une erreur explicite accompagnée de conseils pratiques au lieu d'écrire silencieusement des données corrompues. Aucun espace réservé préfixé par `[EN]` n'est jamais écrit pendant la synchronisation.

```
[ERR] Content sync for fr: no API key available.
  Set OPENROUTER_API_KEY in .env.local to translate content.
```

L'échec d'un fichier n'interrompt pas l'ensemble de la synchronisation — l'erreur est consignée et le pipeline passe au fichier suivant, de sorte que vous obtenez une progression maximale à chaque exécution.

## Vérification post-synchronisation

Une fois toutes les traductions terminées, rosetta relit les fichiers de localisation écrits sur le disque et effectue une passe de vérification. Cela permet de détecter l'écart entre une synchronisation signalée comme réussie et des traductions qui s'avèrent en réalité incorrectes :

- **Parité des clés** — toutes les clés sources sont présentes dans chaque cible
- **Marqueurs `[EN]`** — marqueurs de repli hérités des exécutions précédentes
- **Traductions vides** — valeurs vierges qui sont passées inaperçues
- **Conformité des scripts** — paramètres régionaux non latins avec des traductions uniquement en ASCII
- **Préservation des espaces réservés** — les espaces réservés ICU correspondent à la source

Ignorez cette étape avec `--no-verify` ou exécutez-la de manière autonome avec `npx i18n-rosetta verify`.

## Tests

Les propriétés de sécurité sont vérifiées par la suite de tests en environnement hostile :

```bash
npm run test:redteam    # prototype pollution, path traversal, encoding attacks
```

---

## Voir aussi

- [Architecture](/docs/concepts/architecture) — comment l'écosystème en trois parties s'articule
- [Référence CLI — intégrité](/docs/reference/cli#integrity) — commande de vérification d'intégrité
- [Référence CLI — provenance](/docs/reference/cli#provenance) — commande d'audit de provenance
- [Spécification des plugins](/docs/reference/plugin-spec) — champs de provenance dans les manifestes de plugins
- [Quality Gate](/docs/concepts/quality-gate) — vérifications de sécurité au niveau de la traduction