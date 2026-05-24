---
sidebar_position: 3
title: "Conjuntos de datos de evaluación"
---
# Conjuntos de datos de evaluación

Los conjuntos de datos son los objetivos fijos contra los que se ejecuta el harness. Cada conjunto de datos es un archivo JSON que contiene pares de origen→destino con referencias gold-standard. El harness califica las salidas del modelo frente a estas referencias; nunca las modifica.

:::danger NO ENTRENE con datos de evaluación

⚠️ **Estos conjuntos de datos son solo para evaluación.** Los métodos entrenados, fine-tuned, few-shot-prompted, o expuestos de otra manera a los datos de evaluación producirán puntajes inflados artificialmente y serán **descalificados del leaderboard.**

Utilice corpus separados para el entrenamiento. Los conjuntos de evaluación deben permanecer invisibles para su modelo durante el desarrollo.
:::

---

## Formato del conjunto de datos

Cada conjunto de datos sigue el mismo esquema JSON:

```json
{
  "dataset": {
    "id": "dataset-slug",
    "version": "1.0",
    "language_pair": "EN→CRK",
    "description": "Human-readable description of the dataset",
    "source_language": "en",
    "target_language": "crk",
    "created": "2025-05-01",
    "license": "CC-BY-NC-4.0",
    "provenance": ["gold_standard", "textbook"]
  },
  "entries": [
    {
      "index": 0,
      "source_text": "Hello",
      "target_expected": "tânisi",
      "difficulty": "easy",
      "provenance": "gold_standard",
      "notes": "Common greeting, SRO orthography"
    }
  ]
}
```

### Bloque `dataset` de nivel superior

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `string` | Identificador único del conjunto de datos (utilizado en las run cards y el leaderboard) |
| `version` | `string` | Versión semántica. Incrementar esto invalida las comparaciones de run cards anteriores |
| `language_pair` | `string` | Etiqueta de visualización (por ejemplo, `EN→CRK`) |
| `description` | `string` | Resumen legible para humanos |
| `source_language` | `string` | Código de idioma de origen BCP 47 |
| `target_language` | `string` | Código de idioma de destino BCP 47 |
| `created` | `string` | Fecha de creación ISO 8601 |
| `license` | `string` | Identificador de licencia SPDX |
| `provenance` | `string[]` | Lista de etiquetas de procedencia utilizadas en las entradas |

### Campos de entrada

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `index` | `number` | Índice de entrada basado en cero. Debe ser único y secuencial |
| `source_text` | `string` | El texto de origen a traducir |
| `target_expected` | `string` | La traducción de referencia gold-standard |
| `difficulty` | `string` | Nivel de dificultad: `easy`, `medium`, `hard` |
| `provenance` | `string` | Origen de esta entrada (por ejemplo, `gold_standard`, `textbook`, `elicited`) |
| `notes` | `string` | Contexto opcional para revisores humanos |

---

## Conjuntos de datos disponibles

### EDTeKLA Development Set v1

El primer conjunto de datos de evaluación, creado para la traducción de inglés→cree de las llanuras (SRO). Creado por el [grupo de investigación EdTeKLA](https://spaces.facsci.ualberta.ca/edtekla/) en la Universidad de Alberta.

| Propiedad | Valor |
|----------|-------|
| **ID** | `edtekla-dev-v1` |
| **Versión** | `1.0` |
| **Par de idiomas** | EN → CRK (cree de las llanuras, ortografía SRO) |
| **Cantidad de entradas** | 124 |
| **Distribución de dificultad** | Fácil, Medio, Difícil |
| **Procedencia** | `gold_standard` (verificado por hablantes), `textbook` (materiales educativos publicados) |
| **Licencia** | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) |

**Qué evalúa:**

- Saludos básicos y frases comunes
- Animacidad de sustantivos y obviación
- Conjugación de verbos en diferentes personas y tiempos
- Construcciones locativas
- Paradigmas posesivos
- Estructuras de oraciones complejas

:::tip ¿Por qué 124 entradas?
El conjunto de datos es deliberadamente pequeño y curado. Cada entrada fue verificada por hablantes fluidos o extraída de libros de texto publicados en idioma cree. Un conjunto de datos pequeño y de alta calidad con gold standards verificados es más útil que uno grande y ruidoso, especialmente para un idioma de bajos recursos donde las traducciones "suficientemente buenas" a menudo son morfológicamente inválidas.
:::

---

## Creación de un nuevo conjunto de datos

Para crear un conjunto de datos para un nuevo par de idiomas o dominio:

### 1. Estructurar el JSON

Siga el esquema de [Formato del conjunto de datos](#dataset-format). Cada entrada debe tener `source_text`, `target_expected`, `difficulty` y `provenance`.

### 2. Asignar un ID único

Utilice un slug descriptivo: `{project}-{split}-v{version}` (por ejemplo, `edtekla-dev-v1`, `quechua-test-v1`).

### 3. Verificar los gold standards

Cada valor `target_expected` debe ser verificado por un hablante fluido o provenir de un recurso publicado y revisado por pares. Las referencias generadas por máquinas anulan el propósito de la evaluación.

### 4. Establecer niveles de dificultad

Asigne a cada entrada un nivel de dificultad:

| Nivel | Criterios |
|------|----------|
| `easy` | Frases cortas, vocabulario común, morfología simple |
| `medium` | Oraciones completas, complejidad morfológica moderada |
| `hard` | Gramática compleja, construcciones raras, contenido culturalmente específico |

### 5. Etiquetar la procedencia

Cada entrada debe indicar de dónde proviene. Etiquetas comunes:

- `gold_standard` — Verificado por hablantes fluidos
- `textbook` — De materiales educativos publicados
- `elicited` — Producido a través de sesiones de elicitación estructuradas
- `corpus` — Extraído de un corpus paralelo

### 6. Validar el archivo

Ejecute el harness contra su conjunto de datos con cualquier modelo para verificar que el JSON esté bien formado y que todos los campos requeridos estén presentes:

```bash
python eval/baseline_experiment.py --dataset path/to/your-dataset.json
```

El harness arrojará un error si faltan campos, hay índices duplicados o violaciones del esquema.

### 7. Enviar para su inclusión

Abra un pull request en el [repositorio del eval harness](https://github.com/gamedaysuits/gds-mt-eval-harness) con su archivo de conjunto de datos en el directorio `data/`. Incluya documentación de su metodología de verificación y fuentes de procedencia.

---

## FLORES+ Devtest

Un benchmark multilingüe de amplia cobertura mantenido por la [Open Language Data Initiative (OLDI)](https://huggingface.co/datasets/openlanguagedata/flores_plus). Utilizado para el benchmark de frontera multimodelo de rosetta.

| Propiedad | Valor |
|----------|-------|
| **ID** | `flores-plus-devtest` |
| **Pares de idiomas** | EN → 39 idiomas (todos los idiomas naturales registrados en rosetta) |
| **Cantidad de entradas** | 1012 oraciones por idioma |
| **Licencia** | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| **Fuente** | Originalmente Meta FLORES-200, ahora mantenido por OLDI |
| **Ubicación** | Fixtures preextraídos en `test/benchmark/fixtures/` dentro del repositorio principal de rosetta |

:::danger Solo para evaluación
FLORES+ está destinado únicamente para evaluación. Los curadores solicitan explícitamente que **no se utilice como datos de entrenamiento**. Asegúrese de que su contenido esté excluido de cualquier corpus de entrenamiento.
:::

---

## Consulte también

- [Evaluación de MT](/docs/eval/) — descripción general del marco de evaluación y el leaderboard
- [Eval Harness](/docs/eval/harness) — cómo ejecutar evaluaciones contra estos conjuntos de datos
- [Especificación de Run Card](/docs/eval/run-card) — el esquema JSON para registrar resultados
- [Leaderboard de métodos](/leaderboard) — puntajes de benchmark en vivo
- [Proyecto EdTeKLA](https://spaces.facsci.ualberta.ca/edtekla/) — el grupo de investigación de la Universidad de Alberta detrás del conjunto de datos en cree