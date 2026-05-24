---
sidebar_position: 4
title: "Especificación de Run Card"
---
# Especificación de la Run Card

La run card es el registro completo de una única ejecución de evaluación. Contiene todo lo necesario para comprender, reproducir y verificar el experimento: configuración, puntuaciones, resultados individuales, uso de tokens y metadatos del entorno.

**Versión del esquema:** 2.0

---

## Campos de nivel superior

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `run_id` | `string` | UUID v4 generado al inicio de la ejecución |
| `harness_version` | `string` | Versión semántica del harness que produjo esta tarjeta (por ejemplo, `2.0`) |
| `model_slug` | `string` | Slug del modelo de OpenRouter utilizado para la ejecución (por ejemplo, `openai/gpt-4o`) |
| `model_id` | `string` | Identificador del modelo resuelto devuelto por la API (por ejemplo, `gpt-4o-2024-08-06`) |
| `condition` | `string` | Etiqueta del experimento (por ejemplo, `baseline`, `coached-v3`, `few-shot`) |
| `timestamp` | `string` | Marca de tiempo ISO 8601 UTC de cuando comenzó la ejecución |
| `elapsed_seconds` | `number` | Duración de tiempo real (wall-clock) de toda la ejecución |

```json
{
  "run_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "harness_version": "2.0",
  "model_slug": "openai/gpt-4o",
  "model_id": "gpt-4o-2024-08-06",
  "condition": "baseline",
  "timestamp": "2025-05-20T03:22:41Z",
  "elapsed_seconds": 142.7
}
```

---

## `dataset`

Identifica el dataset de evaluación y lo fija a una versión de contenido específica mediante SHA-256.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `string` | Identificador del dataset (por ejemplo, `edtekla-dev-v1`) |
| `version` | `string` | Cadena de versión del dataset |
| `language_pair` | `string` | Etiqueta de visualización (por ejemplo, `EN→CRK`) |
| `sha256` | `string` | Hash SHA-256 del contenido del archivo del dataset. Garantiza los datos exactos utilizados |
| `entry_count` | `number` | Número de entradas en el dataset |

```json
{
  "dataset": {
    "id": "edtekla-dev-v1",
    "version": "1.0",
    "language_pair": "EN→CRK",
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "entry_count": 124
  }
}
```

---

## `config`

La configuración de la API y del procesamiento por lotes (batching) utilizada para esta ejecución.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `api_provider` | `string` | Nombre del proveedor de la API (por ejemplo, `openrouter`) |
| `temperature` | `number` | Temperatura de muestreo |
| `max_tokens` | `number` | Máximo de tokens por finalización (completion) |
| `batch_size` | `number` | Entradas por lote concurrente |
| `concurrency` | `number` | Máximo de solicitudes paralelas a la API |

```json
{
  "config": {
    "api_provider": "openrouter",
    "temperature": 0.3,
    "max_tokens": 1024,
    "batch_size": 5,
    "concurrency": 3
  }
}
```

---

## `system_prompt_sha256` / `system_prompt_used`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `system_prompt_sha256` | `string` | Hash SHA-256 del prompt del sistema. Incluido en el fingerprint |
| `system_prompt_used` | `string` | El texto completo del prompt del sistema enviado al modelo |

El hash del prompt es parte del [fingerprint](#fingerprint) — dos ejecuciones con prompts diferentes tendrán fingerprints diferentes incluso si todas las demás configuraciones coinciden.

---

## `fingerprint`

Un identificador de reproducibilidad. Dos ejecuciones con fingerprints idénticos utilizaron la misma configuración experimental.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `hash` | `string` | Hash SHA-256 de los componentes ordenados |
| `components` | `object` | Los valores de entrada que fueron procesados con hash |

### Componentes del Fingerprint

| Componente | Descripción |
|-----------|-------------|
| `dataset_sha256` | Hash del archivo del dataset |
| `model_slug` | Modelo utilizado |
| `condition` | Etiqueta de la condición del experimento |
| `system_prompt_sha256` | Hash del prompt del sistema |
| `temperature` | Temperatura de muestreo |
| `harness_version` | Versión del harness |

```json
{
  "fingerprint": {
    "hash": "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    "components": {
      "dataset_sha256": "e3b0c44298fc1c14...",
      "model_slug": "openai/gpt-4o",
      "condition": "baseline",
      "system_prompt_sha256": "abc123...",
      "temperature": 0.3,
      "harness_version": "2.0"
    }
  }
}
```

:::info Fingerprint ≠ Hash de la Run Card
El fingerprint identifica la *configuración del experimento*. El `run_card_hash` verifica la *integridad del archivo de resultados*. Consulte [Fingerprint vs Hash de la Run Card](/docs/eval/harness#fingerprint-vs-run-card-hash) para obtener más detalles.
:::

---

## `scores`

Métricas agregadas para toda la ejecución.

### Puntuaciones de nivel superior

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `total` | `number` | Total de entradas evaluadas |
| `exact_matches` | `number` | Entradas donde la salida coincidió exactamente con el gold standard |
| `exact_match_rate` | `number` | `exact_matches / total` (0.0–1.0) |
| `fst_accepted` | `number` | Entradas donde el analizador FST aceptó la salida |
| `fst_acceptance_rate` | `number` | `fst_accepted / total` (0.0–1.0). `null` si no se utilizó ningún analizador FST |
| `chrf_plus_plus` | `number` | Puntuación chrF++ a nivel de corpus (0–100) |
| `errors` | `number` | Entradas que fallaron (error de API, tiempo de espera agotado, etc.) |
| `avg_latency_seconds` | `number` | Tiempo de respuesta medio en todas las entradas |
| `median_latency_seconds` | `number` | Tiempo de respuesta mediano |
| `p95_latency_seconds` | `number` | Tiempo de respuesta del percentil 95 |

### `by_difficulty`

Puntuaciones desglosadas por nivel de dificultad. Cada clave (`easy`, `medium`, `hard`) contiene los mismos campos de métricas que las puntuaciones de nivel superior.

```json
{
  "by_difficulty": {
    "easy": {
      "total": 42,
      "exact_matches": 8,
      "exact_match_rate": 0.1905,
      "chrf_plus_plus": 51.2,
      "fst_accepted": 35,
      "fst_acceptance_rate": 0.8333
    },
    "medium": { ... },
    "hard": { ... }
  }
}
```

### `by_provenance`

Puntuaciones desglosadas por procedencia de la entrada. Cada clave (por ejemplo, `gold_standard`, `textbook`) contiene los mismos campos de métricas.

```json
{
  "by_provenance": {
    "gold_standard": {
      "total": 80,
      "exact_matches": 10,
      "exact_match_rate": 0.125,
      "chrf_plus_plus": 44.8
    },
    "textbook": { ... }
  }
}
```

---

## `totals`

Uso de tokens y seguimiento de costos para toda la ejecución.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `prompt_tokens` | `number` | Total de tokens de entrada en todas las llamadas a la API |
| `completion_tokens` | `number` | Total de tokens de salida |
| `reasoning_tokens` | `number` | Tokens utilizados para el razonamiento de cadena de pensamiento (chain-of-thought) (depende del modelo, 0 para la mayoría de los modelos) |
| `cached_tokens` | `number` | Tokens servidos desde la caché de prompts del proveedor |
| `total_cost_usd` | `number` | Costo total en USD (según lo reportado por la API) |
| `cost_per_entry_usd` | `number` | `total_cost_usd / entry_count` |
| `reasoning_ratio` | `number` | `reasoning_tokens / completion_tokens` (0.0–1.0) |

```json
{
  "totals": {
    "prompt_tokens": 48200,
    "completion_tokens": 3100,
    "reasoning_tokens": 0,
    "cached_tokens": 12000,
    "total_cost_usd": 0.42,
    "cost_per_entry_usd": 0.0034,
    "reasoning_ratio": 0.0
  }
}
```

---

## `environment`

Metadatos del entorno de ejecución para la reproducibilidad.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `harness_version` | `string` | Versión del harness (refleja el `harness_version` de nivel superior) |
| `harness_git_commit` | `string` | SHA del commit de Git del harness en el momento de la ejecución |
| `python_version` | `string` | Versión del intérprete de Python |
| `sacrebleu_version` | `string` | Versión de la biblioteca sacrebleu (utilizada para la puntuación chrF++) |
| `os` | `string` | Identificador del sistema operativo |

```json
{
  "environment": {
    "harness_version": "2.0",
    "harness_git_commit": "a1b2c3d",
    "python_version": "3.11.9",
    "sacrebleu_version": "2.4.0",
    "os": "macOS-14.5-arm64"
  }
}
```

---

## `results[]`

El arreglo de resultados por entrada. Un objeto por entrada del dataset, en orden de índice.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `entry_index` | `number` | Índice de esta entrada en el dataset (coincide con `entries[].index`) |
| `source_text` | `string` | El texto de origen que fue traducido |
| `target_expected` | `string` | La referencia gold-standard del dataset |
| `target_output` | `string` | La salida real del modelo |
| `exact_match` | `boolean` | Indica si `target_output === target_expected` |
| `entry_chrf` | `number` | Puntuación chrF++ a nivel de oración para esta entrada (0–100) |
| `fst_accepted` | `boolean \| null` | Indica si el analizador FST aceptó la salida. `null` si no se configuró ningún analizador |
| `fst_analysis` | `string[]` | Cadenas de análisis FST para la salida (arreglo vacío si no se analizó o fue rechazada) |
| `difficulty` | `string` | Nivel de dificultad del dataset (`easy`, `medium`, `hard`) |
| `provenance` | `string` | Etiqueta de procedencia del dataset |
| `latency_seconds` | `number` | Tiempo de respuesta para esta entrada individual |
| `usage` | `object` | Uso de tokens por entrada: `{ prompt_tokens, completion_tokens, reasoning_tokens }` |
| `error` | `string \| null` | Mensaje de error si esta entrada falló. `null` en caso de éxito |

```json
{
  "results": [
    {
      "entry_index": 0,
      "source_text": "Hello",
      "target_expected": "tânisi",
      "target_output": "tânisi",
      "exact_match": true,
      "entry_chrf": 100.0,
      "fst_accepted": true,
      "fst_analysis": ["tânisi+V+AI+Ind+2Sg"],
      "difficulty": "easy",
      "provenance": "gold_standard",
      "latency_seconds": 0.82,
      "usage": {
        "prompt_tokens": 385,
        "completion_tokens": 12,
        "reasoning_tokens": 0
      },
      "error": null
    }
  ]
}
```

---

## `run_card_hash`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `run_card_hash` | `string` | Hash SHA-256 de todo el JSON de la run card, con el propio campo `run_card_hash` establecido en `""` durante el hashing |

Este es el sello de detección de manipulaciones. La tabla de clasificación (leaderboard) vuelve a calcular este hash al momento del envío y rechaza las tarjetas donde no coincide.

**Cálculo del hash:**

1. Serialice la run card a JSON con `run_card_hash` establecido en `""`
2. Calcule el SHA-256 de la cadena serializada
3. Establezca `run_card_hash` en el resumen hexadecimal (hex digest) resultante

```python
import hashlib, json

card["run_card_hash"] = ""
card_json = json.dumps(card, sort_keys=True, ensure_ascii=False)
card["run_card_hash"] = hashlib.sha256(card_json.encode()).hexdigest()
```

---

## Consulte también

- [Evaluación de MT](/docs/eval/) — descripción general, valor de la tabla de clasificación y guía de métodos buenos/malos
- [Eval Harness](/docs/eval/harness) — cómo ejecutar evaluaciones y generar run cards
- [Datasets de evaluación](/docs/eval/datasets) — formato del dataset, EDTeKLA, FLORES+
- [Creación de un método](/docs/eval/methods) — la interfaz del método y la especificación de la method card
- [Tabla de clasificación de métodos](/leaderboard) — puntuaciones de referencia (benchmark) en vivo