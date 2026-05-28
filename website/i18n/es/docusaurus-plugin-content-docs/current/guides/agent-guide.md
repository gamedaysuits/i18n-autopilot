---
sidebar_position: 9
title: "Guía para agentes: Uso de i18n-rosetta"
description: "Cómo los agentes de IA pueden instalar, configurar y ejecutar i18n-rosetta para traducir archivos de localización."
---
# Guía para agentes: Uso de i18n-rosetta

i18n-rosetta es una herramienta CLI que traduce los archivos de configuración regional (locale files) de su aplicación con un solo comando. Esta guía es para agentes de IA (o desarrolladores que trabajan con agentes de IA) que desean pasar de cero a tener archivos de configuración regional traducidos rápidamente.

:::tip ¿Ya está familiarizado?
Si solo necesita los comandos, vaya a la [Referencia de la CLI](/docs/reference/cli). Si desea crear y evaluar un método de traducción, consulte la [Guía para agentes de Arena](https://mtevalarena.org/docs/getting-started/agent-guide).
:::

---

## Configuración del entorno

```bash
# No global install needed — npx runs it directly
npx i18n-rosetta sync
```

**Requisitos:**
- Node.js 18+
- Una clave de API para su proveedor de traducción

**Configuración de la clave de API** — rosetta necesita al menos una clave dependiendo de los métodos que usted utilice:

```bash
# Option 1: export (session only)
export OPENROUTER_API_KEY="sk-or-..."        # for llm / llm-coached methods
export GOOGLE_TRANSLATE_API_KEY="AIza..."    # for google-translate method

# Option 2: .env file in your project root (persistent, gitignored)
echo 'OPENROUTER_API_KEY=sk-or-...' > .env
```

Rosetta lee `.env` automáticamente. Obtenga una clave de OpenRouter en [openrouter.ai/keys](https://openrouter.ai/keys).

---

## Primera sincronización

Rosetta detecta automáticamente sus archivos de configuración regional, su formato (JSON, TOML, YAML, PO) y sus idiomas de destino:

```bash
npx i18n-rosetta sync
```

**Qué sucede:**
1. Carga `i18n-rosetta.config.json` (o detecta automáticamente la configuración)
2. Escanea su archivo de configuración regional de origen, aplana las claves anidadas
3. Compara con `.i18n-rosetta.lock` (hashes SHA-256 de valores traducidos previamente)
4. Revisa `.rosetta/tm.json` en busca de traducciones en caché (Memoria de traducción)
5. Traduce solo las **claves modificadas, faltantes o desactualizadas** mediante el método configurado
6. Ejecuta el filtro de calidad (5 verificaciones) en cada traducción
7. Escribe las traducciones aprobadas en el archivo de configuración regional de destino
8. Actualiza el archivo de bloqueo (lock file) y la caché de la memoria de traducción (TM)

En una ejecución típica después de cambiar una clave, el paso 4 sirve 142 claves desde la caché y el paso 5 traduce 1 clave. Es por esto que las sincronizaciones posteriores son rápidas y económicas.

---

## Configuración

Cree `i18n-rosetta.config.json` en la raíz de su proyecto:

```json
{
  "inputLocale": "en",
  "pairs": {
    "en-fr": { "method": "llm-coached" },
    "en-ja": { "method": "google-translate" },
    "en-crk": { "method": "api", "endpoint": "http://localhost:3000/translate" }
  }
}
```

Campos clave:

| Campo | Propósito | Predeterminado |
|-------|---------|---------|
| `inputLocale` | Idioma de origen | `en` |
| `pairs` | Mapa de origen→destino con la configuración del método | (requerido) |
| `localesDir` | Dónde se encuentran los archivos de configuración regional | (detectado automáticamente) |
| `model` | Modelo LLM para los métodos `llm`/`llm-coached` | `google/gemini-2.5-flash` |
| `batchSize` | Claves por llamada a la API | 80 (LLM), 128 (Google) |
| `jsonConcurrency` | Traducciones regionales paralelas para claves JSON | 50 |
| `contentConcurrency` | Llamadas a la API paralelas para traducción de contenido | 12 |

Referencia completa: [Configuración](/docs/getting-started/configuration)

---

## Métodos de traducción

| Método | Cuándo usarlo | Costo | Clave de API necesaria |
|--------|------------|------|---------------|
| **`llm`** | Propósito general, bueno para idiomas con muchos recursos | Por token (depende del modelo) | `OPENROUTER_API_KEY` |
| **`llm-coached`** | Cuando tiene reglas gramaticales/diccionario para el idioma de destino | Por token + contexto de entrenamiento (coaching) | `OPENROUTER_API_KEY` |
| **`google-translate`** | Idiomas con muchos recursos donde GT funciona bien | $20/millón de caracteres | `GOOGLE_TRANSLATE_API_KEY` |
| **`api`** | Pipeline personalizado alojado detrás de un endpoint HTTP | Determinado por el servidor | Ninguna (el endpoint maneja la autenticación) |
| **`plugin`** | Método preempaquetado instalado localmente | Varía | Varía |

Detalles: [Métodos de traducción](/docs/guides/translation-methods)

---

## Datos de entrenamiento

Para los pares `llm-coached`, los datos de entrenamiento guían al LLM con conocimiento lingüístico explícito. Cree un archivo de entrenamiento:

```json title="coaching/fr.json"
{
  "grammar_rules": [
    "Use formal register (vous) for all UI text",
    "Adjectives agree in gender and number with the noun"
  ],
  "dictionary": {
    "dashboard": "tableau de bord",
    "settings": "paramètres"
  },
  "style_notes": "Prefer active voice. Avoid anglicisms."
}
```

Haga referencia a él en la configuración de su par:

```json
"en-fr": { "method": "llm-coached", "coachingFile": "coaching/fr.json" }
```

El filtro de calidad verifica que los términos del diccionario realmente aparezcan en el resultado; las infracciones se registran como advertencias `[TERM]`.

Detalles: [Datos de entrenamiento](/docs/concepts/coaching-data)

---

## Filtro de calidad

Cada traducción pasa por cinco verificaciones automatizadas antes de escribirse en el disco:

| Verificación | Qué detecta | Ejemplo |
|-------|----------------|---------|
| **Vacío/en blanco** | El modelo no devolvió nada | `""` |
| **Eco del origen** | El modelo devolvió la entrada en inglés sin cambios | `"Welcome"` para japonés |
| **Bucle de alucinación** | Trigramas repetidos | `"Qo' Qo' Qo' Qo'"` |
| **Inflación de longitud** | El resultado es 4 veces o más largo que el origen | Origen de 10 caracteres → resultado de 50 caracteres |
| **Cumplimiento de escritura** | Sistema de escritura incorrecto para la configuración regional | Texto latino para configuración regional en árabe |

Las fallas se registran con el prefijo `[GATE]`. No hay alternativas silenciosas (silent fallbacks): si una traducción falla, se reporta, no se acepta en silencio.

Detalles: [Filtro de calidad](/docs/concepts/quality-gate)

---

## Memoria de traducción

Rosetta almacena en caché las traducciones en `.rosetta/tm.json`, indexadas por texto de origen + configuración regional + método. En sincronizaciones posteriores, las claves sin cambios se sirven desde la caché: sin llamadas a la API, sin costo.

```
[TM] 142 key(s) served from cache
Translating 3 key(s) to French (llm)... [OK]
```

Para omitir la caché en una ejecución: `npx i18n-rosetta sync --no-tm`

Detalles: [Memoria de traducción](/docs/concepts/translation-memory)

---

## Archivos generados

Rosetta crea varios archivos en su proyecto. Conozca cuáles son para que no elimine o confirme (commit) accidentalmente los equivocados:

| Archivo | Propósito | ¿Git? |
|------|---------|------|
| `.i18n-rosetta.lock` | Hashes SHA-256 de los valores de origen traducidos (detección de cambios) | **Sí** — confirme esto |
| `.i18n-rosetta-content.lock` | Lo mismo, pero para archivos de contenido Markdown/MDX | **Sí** — confirme esto |
| `.rosetta/tm.json` | Caché de la memoria de traducción | **Sí** — confirme esto (ahorra costos de API para el equipo) |
| `.rosetta/coaching/` | Directorio de datos de entrenamiento | **Sí** — este es su conocimiento lingüístico |
| `i18n-rosetta.config.json` | Configuración del proyecto | **Sí** — confirme esto |

---

## Patrones comunes

**Traducir un par de idiomas:**
```bash
npx i18n-rosetta sync --pair en-fr
```

**Traducir todos los pares configurados:**
```bash
npx i18n-rosetta sync
```
Rosetta traduce todas las configuraciones regionales en paralelo. Con el almacenamiento en caché de la TM, solo las claves modificadas consultan la API.

**Modo de contenido (Markdown/MDX para Docusaurus, Hugo, etc.):**
```bash
npx i18n-rosetta sync --content
```
Traduce documentos, publicaciones de blog y archivos de contenido junto con el JSON de configuración regional. Utiliza concurrencia paralela (predeterminado: 12 llamadas simultáneas a la API). Ajústelo con `--content-concurrency`.

**Ejecución de prueba (vista previa sin escribir):**
```bash
npx i18n-rosetta sync --dry-run
```

**Forzar la retraducción de claves específicas:**
```bash
npx i18n-rosetta sync --force-keys "hero.title,nav.about"
```

**Forzar la retraducción de todos los archivos de contenido:**
```bash
npx i18n-rosetta sync --force-content
```

**Verificar el estado de la traducción:**
```bash
npx i18n-rosetta status
```
Muestra la cobertura, los niveles de calidad y la información de los plugins para cada par.

**Auditar alternativas (fallbacks) no traducidas:**
```bash
npx i18n-rosetta audit
```
Enumera todos los valores de alternativa de `[EN]` que necesitan traducción.

---

## Solución de problemas

| Problema | Solución |
|---------|-----|
| `OPENROUTER_API_KEY not set` | Exporte la clave o agréguela a `.env` en la raíz de su proyecto |
| `No locale files found` | Configure `localesDir` en la configuración, o asegúrese de que sus archivos de configuración regional coincidan con la nomenclatura estándar (`en.json`, `fr.json`) |
| `[GATE] Script compliance failed` | Su configuración regional de destino obtuvo texto latino en lugar del sistema de escritura esperado; pruebe con un modelo diferente o agregue datos de entrenamiento |
| `[GATE] Source echo` | El modelo devolvió el inglés sin cambios; los datos de entrenamiento o un modelo diferente generalmente solucionan esto |
| Todas las traducciones en caché | Ejecute con `--no-tm` para omitir la caché, o `--force-keys` para claves específicas |
| Conflictos en el archivo de bloqueo | `.i18n-rosetta.lock` utiliza hashes SHA-256; los conflictos de fusión (merge conflicts) son seguros de resolver conservando cualquiera de las versiones y luego volviendo a ejecutar la sincronización |

---

## Próximos pasos

- [Inicio rápido](/docs/getting-started/quick-start) — guía completa para empezar
- [Referencia de la CLI](/docs/reference/cli) — todos los comandos y banderas (flags)
- [Cómo funciona](/docs/how-it-works) — explicación del pipeline de sincronización
- [El puente Eval Harness](/docs/guides/bridge) — cómo se conecta rosetta a Arena
- **¿Desea crear su propio método de traducción?** Consulte la [Guía para agentes de Arena](https://mtevalarena.org/docs/getting-started/agent-guide): cree un método, demuestre que funciona y gane premios.