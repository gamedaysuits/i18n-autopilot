---
sidebar_position: 2
title: "Eval Harness v2.0"
---
# Eval Harness v2.0

El harness ejecuta experimentos de traducción y produce run cards. Se encarga de la construcción de prompts, las llamadas a la API, la puntuación y la serialización de resultados — usted proporciona el conjunto de datos y el modelo.

## Instalación

**Requisitos:** Python 3.10+

```bash
pip install sacrebleu aiohttp
```

Clone el repositorio del harness:

```bash
git clone https://github.com/gamedaysuits/gds-mt-eval-harness.git
cd gds-mt-eval-harness
```

## Uso

```bash
python eval/baseline_experiment.py --dataset path/to/dataset.json
```

Esto ejecuta cada entrada del conjunto de datos a través del modelo configurado, califica los resultados y escribe un archivo JSON de run card en el directorio `results/`.

## Banderas de la CLI

| Bandera | Requerido | Predeterminado | Descripción |
|------|----------|---------|-------------|
| `--dataset` | ✅ | — | Ruta al archivo JSON del conjunto de datos de evaluación |
| `--model` | — | `openai/gpt-4o` | Slug del modelo de OpenRouter (por ejemplo, `google/gemini-2.5-pro`) |
| `--condition` | — | `baseline` | Etiqueta del experimento. Úsela para distinguir estrategias de prompts (por ejemplo, `coached`, `few-shot`, `dictionary-augmented`) |
| `--temperature` | — | `0.3` | Temperatura de muestreo. Más baja = más determinista |
| `--batch-size` | — | `5` | Número de entradas por lote concurrente de la API |
| `--fst-analyzer` | — | `null` | Ruta a un binario analizador FST. Cuando se proporciona, se prueba la aceptación morfológica de cada resultado |
| `--submit` | — | `false` | Enviar la run card a la API del leaderboard después de que se complete la ejecución |

### Ejemplos

```bash
# Run with defaults (GPT-4o, baseline condition)
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json

# Coached experiment with Gemini, lower temperature
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --model google/gemini-2.5-pro \
  --condition coached-v3 \
  --temperature 0.1

# Run with FST validation and auto-submit
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --fst-analyzer ./bin/crk-analyzer \
  --submit
```

---

## Esquema de la Run Card

Cada experimento produce una **run card** — un documento JSON independiente. La estructura de nivel superior:

```json
{
  "run_id": "uuid-v4",
  "harness_version": "2.0",
  "model_slug": "openai/gpt-4o",
  "model_id": "gpt-4o-2024-08-06",
  "condition": "baseline",
  "timestamp": "2025-05-20T03:22:41Z",
  "elapsed_seconds": 142.7,
  "dataset": { ... },
  "config": { ... },
  "system_prompt_sha256": "abc123...",
  "system_prompt_used": "You are a translator...",
  "fingerprint": { ... },
  "scores": { ... },
  "totals": { ... },
  "environment": { ... },
  "results": [ ... ],
  "run_card_hash": "sha256-of-entire-card"
}
```

Consulte la [Especificación de la Run Card](/docs/eval/run-card) para ver el esquema completo con cada campo documentado.

### Bloques clave

**`dataset`** — Identifica qué conjunto de datos se utilizó, incluyendo el hash de su contenido para que los resultados estén vinculados a una versión específica:

```json
{
  "id": "edtekla-dev-v1",
  "version": "1.0",
  "language_pair": "EN→CRK",
  "sha256": "...",
  "entry_count": 124
}
```

**`scores`** — Métricas agregadas para la ejecución:

```json
{
  "total": 124,
  "exact_matches": 12,
  "exact_match_rate": 0.0968,
  "fst_accepted": 87,
  "fst_acceptance_rate": 0.7016,
  "chrf_plus_plus": 42.31,
  "errors": 0,
  "avg_latency_seconds": 1.15,
  "median_latency_seconds": 1.02,
  "p95_latency_seconds": 2.34,
  "by_difficulty": { ... },
  "by_provenance": { ... }
}
```

**`totals`** — Uso de tokens y seguimiento de costos:

```json
{
  "prompt_tokens": 48200,
  "completion_tokens": 3100,
  "reasoning_tokens": 0,
  "cached_tokens": 12000,
  "total_cost_usd": 0.42,
  "cost_per_entry_usd": 0.0034,
  "reasoning_ratio": 0.0
}
```

---

## Fingerprint vs. Hash de la Run Card

El harness produce dos hashes distintos. Sirven para diferentes propósitos:

### Fingerprint

El **fingerprint** responde: *"¿Se podría reproducir esta ejecución?"*

Calcula el hash de la combinación de entradas que definen la configuración del experimento — no los resultados:

- SHA-256 del conjunto de datos
- Slug del modelo
- Etiqueta de condición
- SHA-256 del prompt del sistema
- Temperatura
- Versión del harness

Dos ejecuciones con fingerprints idénticos utilizaron la misma configuración. Sus resultados deberían ser comparables (salvo por el no determinismo de la API).

### Hash de la Run Card

El **hash de la run card** responde: *"¿Ha sido alterado este archivo de resultados específico?"*

Es el SHA-256 de todo el JSON de la run card (excluyendo el propio campo `run_card_hash`). Si algún campo cambia — una puntuación, una marca de tiempo, un solo resultado — el hash se rompe.

:::info Cuándo usar cuál
Use el **fingerprint** para agrupar ejecuciones comparables (mismo experimento, diferentes ejecuciones). Use el **hash de la run card** para verificar la integridad de un archivo de resultados específico.
:::

---

## Envío al Leaderboard

### Envío automático

Pase `--submit` para cargar la run card al finalizar:

```bash
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --submit
```

### Envío manual

Las run cards se guardan como archivos JSON en `results/`. Puede enviar cualquier archivo de run card a través de la interfaz de usuario del leaderboard en [/leaderboard](/leaderboard), o a través de la API:

```bash
curl -X POST https://i18n-rosetta.com/api/leaderboard/submit \
  -H "Content-Type: application/json" \
  -d @results/your-run-card.json
```

:::warning Validación del leaderboard
El leaderboard valida las run cards enviadas contra el registro de conjuntos de datos. Los envíos que hacen referencia a conjuntos de datos desconocidos, o con un `run_card_hash` roto, son rechazados.
:::

:::danger NO ENTRENAR con datos de evaluación
Si su método ha visto el conjunto de datos de evaluación durante el desarrollo — como datos de entrenamiento, ejemplos few-shot, entradas de diccionario o material de ingeniería de prompts — su envío será **descalificado**. Consulte [Evaluación de MT](/docs/eval/) para saber qué hace que un método sea bueno o malo.
:::

---

## Consulte también

- [Evaluación de MT](/docs/eval/) — descripción general, propuesta de valor del leaderboard y guía de métodos buenos/malos
- [Conjuntos de datos de evaluación](/docs/eval/datasets) — formato del conjunto de datos, EDTeKLA, FLORES+
- [Especificación de la Run Card](/docs/eval/run-card) — el esquema JSON completo
- [Construcción de un método](/docs/eval/methods) — la interfaz del método para crear métodos evaluables
- [Leaderboard de métodos](/leaderboard) — puntuaciones de referencia en vivo