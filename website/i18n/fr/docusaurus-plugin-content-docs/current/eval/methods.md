---
sidebar_position: 4
title: "Interface de méthode"
---
# Interface de méthode partagée

L'eval harness et i18n-rosetta partagent un concept commun de **méthode de traduction**. Une méthode est toute procédure qui prend un texte source et produit un texte traduit — qu'il s'agisse d'un appel direct à un LLM, d'un pipeline à plusieurs étapes, d'une API tierce ou d'un traducteur humain.

## Architecture

```
Method Plugin (v2 Spec)
├── manifest.json         ← Shared metadata (name, version, supported pairs)
├── method_card.json      ← Leaderboard description (what, not how)
├── translate.py          ← Python entry point (for eval harness)
└── translate.js          ← Node.js entry point (for i18n-rosetta CLI)
```

## Deux systèmes, une interface

| | Eval Harness | i18n-rosetta |
|---|---|---|
| **Langage** | Python | Node.js |
| **Point d'entrée** | `translate.py` | `translate.js` |
| **Interface** | Protocole `TranslationProcess` | Configuration `methodPlugin` |
| **Objectif** | Évaluation par lots avec notation | Localisation en direct en dev/CI |
| **Sortie** | Run card avec métriques | Fichiers de paramètres régionaux traduits |

Une méthode qui prend en charge les deux systèmes fournit deux points d'entrée — un pour chaque environnement d'exécution de langage. La **method card** constitue la passerelle : elle décrit la méthode dans un format que les deux systèmes comprennent.

## Method Card

Une method card décrit *ce qu'est* une méthode de traduction sans révéler de détails propriétaires tels que le prompt système complet. Elle répond aux questions suivantes :

- Quelle est la classe de cette méthode ? (LLM brut, LLM guidé, pipeline, API, etc.)
- Quels outils utilise-t-elle ? (Analyseur FST, dictionnaire, etc.)
- L'implémentation est-elle open source ?
- Quelles paires de langues prend-elle en charge ?

Consultez la [Spécification de la Method Card](https://github.com/gamedaysuits/gds-mt-eval-harness/blob/main/docs/method-card-spec.md) pour obtenir le schéma JSON complet.

### Exemple

```json
{
  "method_id": "fst-gated-v8",
  "name": "FST-Gated Coached Translation v8",
  "class": "pipeline",
  "description": "LLM translation with morphological validation. Failed words are retried with FST feedback.",
  "author": "Curtis Forbes",
  "tools_used": ["HFST morphological analyzer", "Wolvengrey dictionary"],
  "open_source": false,
  "supported_pairs": ["eng>crk"]
}
```

### Classes de méthodes

| Classe | Description |
|-------|-------------|
| `raw-llm` | Appel direct au LLM avec des instructions minimales |
| `coached-llm` | LLM avec prompt structuré, exemples, contraintes |
| `pipeline` | Pipeline à plusieurs étapes avec des composants déterministes |
| `custom-plugin` | Processus externe implémentant le protocole `TranslationProcess` |
| `api` | API de traduction tierce (Google Translate, DeepL, etc.) |
| `human` | Traduction humaine (pour établir des références) |

## Eval Harness : Protocole TranslationProcess

L'eval harness utilise le typage structurel de Python (`Protocol`) pour les plugins. Toute classe possédant la bonne signature de méthode fonctionne — aucun héritage n'est requis :

```python
class MyMethod:
    async def translate(self, entries: list[dict], config: RunConfig) -> list[dict]:
        results = []
        for entry in entries:
            translation = await self.do_translation(entry["source"])
            results.append({
                "id": entry["id"],
                "predicted": translation,
                "latency_s": 0.5,
                "usage": {"prompt_tokens": 0, "completion_tokens": 0},
                "error": None,
                "tool_calls": [],
                "tool_call_count": 0,
                "metadata": {},
            })
        return results
```

Consultez le [Protocole de Plugin](https://github.com/gamedaysuits/gds-mt-eval-harness/blob/main/docs/plugin-protocol.md) pour une documentation complète, y compris des exemples de wrappers pour les méthodes non-Python.

## i18n-rosetta : Configuration methodPlugin

Dans rosetta, les méthodes sont enregistrées par paire de langues dans `i18n-rosetta.config.json` :

```json
{
  "version": 3,
  "pairs": {
    "en:crk": {
      "methodPlugin": "crk-coached-v1"
    }
  }
}
```

Consultez la [Spécification du Plugin](/docs/reference/plugin-spec) pour l'interface côté rosetta.

## Intégration au Leaderboard

Lorsqu'une method card est attachée à une exécution (via `--method-card`), elle est intégrée dans la run card et affichée sur le leaderboard :

```bash
# Run with method card attached
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --method-card method_card.json \
  --submit
```

Le leaderboard affiche :
- **Badge de classe** — indicateur visuel (par ex., "pipeline", "coached-llm")
- **Nom de la méthode** — issu de la method card
- **Outils utilisés** — listés à partir de la method card
- **Indicateur open source**

Lorsqu'aucune method card n'est attachée, le leaderboard affiche la configuration native du harness (modèle, condition, température, outils activés).

:::danger NE PAS ENTRAÎNER sur les données d'évaluation
Les méthodes dont le processus de développement a inclus une exposition au jeu de données d'évaluation — en tant que données d'entraînement, exemples few-shot, entrées de dictionnaire ou matériel de prompt tuning — seront **disqualifiées** du leaderboard. Consultez [Évaluation MT](/docs/eval/) pour comprendre ce qui distingue une bonne méthode d'une mauvaise.
:::

---

## Voir aussi

- [Évaluation MT](/docs/eval/) — aperçu, valeur du leaderboard et conseils sur les bonnes/mauvaises méthodes
- [Eval Harness](/docs/eval/harness) — comment exécuter des évaluations
- [Jeux de données d'évaluation](/docs/eval/datasets) — jeux de données disponibles (EDTeKLA, FLORES+)
- [Spécification de la Run Card](/docs/eval/run-card) — le schéma JSON de la run card
- [Spécification du Plugin](/docs/reference/plugin-spec) — interface du plugin côté rosetta
- [Leaderboard des méthodes](/leaderboard) — scores de référence en direct