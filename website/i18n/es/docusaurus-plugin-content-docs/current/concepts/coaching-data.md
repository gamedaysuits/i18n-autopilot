---
sidebar_position: 5
title: "Datos de Coaching"
---
# Datos de coaching

Los datos de coaching son el mecanismo de rosetta para enseñar a los LLM sobre idiomas en los que no fueron entrenados. Al proporcionar reglas gramaticales, diccionarios y notas de estilo junto con cada solicitud de traducción, se transforma un LLM de propósito general en un traductor consciente del contexto para cualquier idioma, incluidos aquellos sin soporte de MT existente.

## Cómo funciona

Cuando se configura el método de un par en `llm-coached`, rosetta carga un archivo de coaching desde `.rosetta/coaching/<locale>.json` e inyecta su contenido en cada prompt del LLM como parte del mensaje del sistema. El LLM ve sus reglas lingüísticas junto con la solicitud de traducción, produciendo un resultado que sigue su gramática y terminología en lugar de adivinar.

```
┌──────────────────────────────────────────────────────┐
│ System Message (cached across batches)               │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Base translation rules                           │ │
│ │ + Register instructions                          │ │
│ │ + Grammar rules (from coaching data)             │ │
│ │ + Dictionary entries (from coaching data)         │ │
│ │ + Style notes (from coaching data)               │ │
│ └──────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────┤
│ User Message (per batch)                             │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Keys to translate (JSON)                         │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

Debido a que los datos de coaching son parte del mensaje del sistema, se benefician del **prompt caching** (caché de prompts): proveedores como Anthropic y Google almacenan en caché los prefijos repetidos del sistema, por lo que solo se paga por el contexto de coaching una vez por sesión, no una vez por lote.

## Formato del archivo de coaching

Cree un archivo JSON por configuración regional (locale) en `.rosetta/coaching/`:

```json title=".rosetta/coaching/crk.json"
{
  "grammar_rules": [
    "Plains Cree is polysynthetic — a single word can express what English needs a full sentence for",
    "Animate/inanimate noun distinction affects verb conjugation",
    "Use SRO (Standard Roman Orthography) unless script converter handles conversion",
    "Verb stems are modified by prefixes and suffixes to indicate person, number, tense, and evidentiality"
  ],
  "dictionary": {
    "home": "kīwēwin",
    "settings": "isi-nākatohkēwin",
    "search": "nānātawāpahtam",
    "welcome": "tānisi",
    "submit": "ispīhci",
    "cancel": "pōni"
  },
  "style_notes": "Use formal register. Preserve English technical terms in parentheses when no Cree equivalent exists. Avoid loanwords when a descriptive Cree expression exists."
}
```

### Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|----------|-------------|
| `grammar_rules` | `string[]` | No | Arreglo de reglas gramaticales inyectadas en el prompt del sistema. Cada regla debe ser una instrucción concisa y procesable que el LLM pueda seguir. |
| `dictionary` | `object` | No | Mapa de clave-valor de término en inglés → término en el idioma de destino. Se utiliza para vocabulario específico del dominio que el LLM no conocería. |
| `style_notes` | `string` | No | Instrucciones de estilo de formato libre (registro, tono, convenciones de formalidad). |

Todos los campos son opcionales: puede comenzar solo con un diccionario y agregar reglas gramaticales a medida que lo perfecciona.

## Comportamiento de respaldo

Si un par está configurado para `llm-coached` pero no existe un archivo de coaching para esa configuración regional, rosetta **recurre al método estándar `llm`** con una advertencia en la consola:

```
[INFO] No coaching data for "crk" at .rosetta/coaching/crk.json
       Falling back to standard LLM method. Create coaching data for better results.
```

Esto significa que puede configurar `"defaultMethod": "llm-coached"` globalmente de forma segura: los idiomas con datos de coaching lo usarán y el resto obtendrá la traducción estándar del LLM sin errores.

## Cuándo usar el coaching

| Escenario | Método recomendado |
|----------|-------------------|
| Idiomas de nivel 1 (francés, español, alemán) | `llm` o `google-translate`: los LLM ya los conocen bien |
| Idiomas de nivel 2 (coreano, turco, tailandés) | `llm` con un registro: los LLM los manejan adecuadamente con pautas de estilo |
| Idiomas de nivel 3 (cree de las llanuras, yoruba, quechua) | `llm-coached`: los LLM necesitan reglas gramaticales y diccionarios |
| Idiomas construidos (klingon, sindarin, kryptoniano) | `llm-coached`: los LLM tienen algunos datos de entrenamiento pero necesitan correcciones |

## Creación de buenos datos de coaching

### Reglas gramaticales

Escriba las reglas como **instrucciones**, no como descripciones. El LLM sigue las instrucciones mejor de lo que interpreta la teoría lingüística.

```json
// ❌ Descriptive (the LLM learns nothing actionable)
"Plains Cree has animate and inanimate noun classes"

// ✅ Instructive (the LLM knows what to do)
"When translating nouns, check whether the Cree equivalent is animate (NA) or inanimate (NI) — this affects which verb conjugation to use"
```

### Diccionarios

Concéntrese en los **términos específicos del dominio** que el LLM podría equivocar o inventar. No se preocupe por las palabras comunes que el LLM ya maneja; concéntrese en los términos específicos de la interfaz de usuario de su aplicación.

### Notas de estilo

Sea específico sobre el registro, la formalidad y las convenciones:

```json
"style_notes": "Use formal register (vous-form in French). Preserve brand names untranslated. UI labels should be imperative mood ('Save', not 'Saves'). Maximum 40 characters for button text."
```

## Prueba de traducciones con coaching

Utilice el [MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness) para evaluar sus traducciones con coaching frente a un corpus de referencia:

```bash
# Install the harness
pip install mt-eval-harness

# Run coached translations against your test corpus
mt-eval run --corpus data/crk-corpus.json --model google/gemini-2.5-pro

# Score the results
mt-eval test eval/logs/run_*.json
```

Esto le proporciona puntuaciones de chrF++, BLEU y coincidencias exactas. Cree varias versiones de archivos de coaching y compárelas: las métricas objetivas superan a la revisión subjetiva.

## Consulte también

- [Idiomas de bajos recursos](/docs/guides/low-resource-languages): guía completa para crear un flujo de trabajo de traducción desde cero
- [Métodos de traducción](/docs/guides/translation-methods): comparación de todos los métodos disponibles
- [Crear un plugin](/docs/tutorials/build-a-plugin): empaquete un método con coaching como un plugin reutilizable