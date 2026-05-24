---
sidebar_position: 4
title: "Interfaz de método"
---
# Interfaz de método compartido

El eval harness y i18n-rosetta comparten un concepto común de **método de traducción**. Un método es cualquier procedimiento que toma un texto de origen y produce un texto traducido, ya sea una llamada directa a un LLM, un pipeline de múltiples etapas, una API de terceros o un traductor humano.

## Arquitectura

```
Method Plugin (v2 Spec)
├── manifest.json         ← Shared metadata (name, version, supported pairs)
├── method_card.json      ← Leaderboard description (what, not how)
├── translate.py          ← Python entry point (for eval harness)
└── translate.js          ← Node.js entry point (for i18n-rosetta CLI)
```

## Dos sistemas, una interfaz

| | Eval Harness | i18n-rosetta |
|---|---|---|
| **Lenguaje** | Python | Node.js |
| **Punto de entrada** | `translate.py` | `translate.js` |
| **Interfaz** | Protocolo `TranslationProcess` | Configuración `methodPlugin` |
| **Propósito** | Evaluación por lotes con puntuación | Localización en vivo en dev/CI |
| **Salida** | Run card con métricas | Archivos de locale traducidos |

Un método que es compatible con ambos sistemas proporciona dos puntos de entrada, uno para el runtime de cada lenguaje. La **method card** es el puente: describe el método en un formato que ambos sistemas entienden.

## Method Card

Una method card describe *qué* es un método de traducción sin revelar detalles propietarios, como el prompt completo del sistema. Responde a lo siguiente:

- ¿Qué clase de método es este? (LLM puro, LLM guiado, pipeline, API, etc.)
- ¿Qué herramientas utiliza? (Analizador FST, diccionario, etc.)
- ¿La implementación es de código abierto (open source)?
- ¿Qué pares de idiomas admite?

Consulte la [Especificación de la Method Card](https://github.com/gamedaysuits/gds-mt-eval-harness/blob/main/docs/method-card-spec.md) para ver el JSON schema completo.

### Ejemplo

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

### Clases de métodos

| Clase | Descripción |
|-------|-------------|
| `raw-llm` | Llamada directa a un LLM con instrucciones mínimas |
| `coached-llm` | LLM con prompt estructurado, ejemplos y restricciones |
| `pipeline` | Pipeline de múltiples etapas con componentes deterministas |
| `custom-plugin` | Proceso externo que implementa el protocolo `TranslationProcess` |
| `api` | API de traducción de terceros (Google Translate, DeepL, etc.) |
| `human` | Traducción humana (para establecer líneas base) |

## Eval Harness: Protocolo TranslationProcess

El eval harness utiliza el tipado estructural de Python (`Protocol`) para los plugins. Cualquier clase con la firma de método correcta funciona, sin necesidad de herencia:

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

Consulte el [Protocolo de plugins](https://github.com/gamedaysuits/gds-mt-eval-harness/blob/main/docs/plugin-protocol.md) para obtener la documentación completa, incluidos ejemplos de wrappers para métodos que no son de Python.

## i18n-rosetta: Configuración de methodPlugin

En rosetta, los métodos se registran por par de idiomas en `i18n-rosetta.config.json`:

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

Consulte la [Especificación de plugins](/docs/reference/plugin-spec) para ver la interfaz del lado de rosetta.

## Integración con el Leaderboard

Cuando se adjunta una method card a una ejecución (a través de `--method-card`), se incrusta en la run card y se muestra en el leaderboard:

```bash
# Run with method card attached
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --method-card method_card.json \
  --submit
```

El leaderboard muestra:
- **Insignia de clase** — indicador visual (por ejemplo, "pipeline", "coached-llm")
- **Nombre del método** — de la method card
- **Herramientas utilizadas** — enumeradas desde la method card
- **Indicador de código abierto**

Cuando no se adjunta ninguna method card, el leaderboard muestra la configuración nativa del harness (modelo, condición, temperatura, herramientas habilitadas).

:::danger NO ENTRENAR con datos de evaluación
Los métodos cuyo proceso de desarrollo incluyó exposición al conjunto de datos de evaluación (ya sea como datos de entrenamiento, ejemplos few-shot, entradas de diccionario o material de ajuste de prompts) serán **descalificados** del leaderboard. Consulte [Evaluación de MT](/docs/eval/) para saber qué distingue a un buen método de uno malo.
:::

---

## Véase también

- [Evaluación de MT](/docs/eval/) — descripción general, valor del leaderboard y guía sobre métodos buenos/malos
- [Eval Harness](/docs/eval/harness) — cómo ejecutar evaluaciones
- [Conjuntos de datos de evaluación](/docs/eval/datasets) — conjuntos de datos disponibles (EDTeKLA, FLORES+)
- [Especificación de la Run Card](/docs/eval/run-card) — el JSON schema de la run card
- [Especificación de plugins](/docs/reference/plugin-spec) — interfaz de plugins del lado de rosetta
- [Leaderboard de métodos](/leaderboard) — puntuaciones de benchmark en vivo