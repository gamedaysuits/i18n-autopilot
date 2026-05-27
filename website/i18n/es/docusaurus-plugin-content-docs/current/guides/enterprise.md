---
sidebar_position: 7
title: "Para empresas"
description: "Cómo las organizaciones pueden estandarizar la traducción con métodos probados en leaderboards, plugins personalizados y despliegue de un solo comando."
---
# i18n-rosetta para Empresas

Su equipo traduce contenido regularmente. Usted tiene una pila de archivos de locales, un pipeline de CI y un proceso que probablemente involucra a alguien ejecutando manualmente Google Translate, copiando los resultados en JSON y esperando que todo salga bien. O está pagando por una plataforma TMS donde está atado al motor de traducción de un solo proveedor.

Existe una mejor manera.

## La propuesta

1. **Elija el mejor método para cada idioma** — no lo que su proveedor ofrezca por defecto
2. **Implemente con un solo comando** — `npx i18n-rosetta sync` traduce cada locale, cada formato, cada vez
3. **Intercambie métodos sin cambiar el código** — un cambio de configuración, no una migración
4. **Sea dueño de su pipeline** — sin ataduras a proveedores (vendor lock-in), sin paneles de control mensuales, sin cuentas

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "deepl" },
    "en:ja": { "method": "llm", "model": "google/gemini-2.5-pro" },
    "en:de": { "method": "google-translate" },
    "en:ko": { "method": "llm", "register": "polite-haeyo" },
    "en:crk": { "methodPlugin": "crk-coached-v3" }
  }
}
```

El francés usa DeepL (su equipo prefiere su fluidez europea). El japonés usa un LLM de vanguardia. El alemán usa Google Translate (rápido, económico, suficientemente bueno). El coreano usa un LLM con un registro formal. El cree de las llanuras usa un plugin guiado (coached) creado por la comunidad que obtuvo la puntuación más alta en la tabla de clasificación.

**El mismo comando. El mismo pipeline de CI. Diferentes métodos por par. Un solo archivo de configuración.**

## Flujo de trabajo: Tabla de clasificación → Implementación

:::tip Próximamente: CLI de `rosetta leaderboard`
El flujo de trabajo descrito a continuación es la integración planificada entre la tabla de clasificación de [MT Eval Arena](https://mtevalarena.org) y la CLI de i18n-rosetta. La infraestructura existe en ambos lados — el puente está en desarrollo.
:::

[MT Eval Arena](https://mtevalarena.org) es donde los métodos de traducción se evalúan (benchmarked) con puntuaciones reproducibles y con huella digital. Cada método obtiene una puntuación compuesta a través de múltiples métricas (chrF++, coincidencia exacta, aceptación FST, puntuación semántica). La tabla de clasificación rastrea cada envío.

El flujo de trabajo planificado:

```bash
# Browse the leaderboard from your terminal
npx i18n-rosetta leaderboard --pair en:crk

# Output:
# ┌──────┬───────────────────────┬────────────┬──────────┬───────────┐
# │ Rank │ Method                │ Model      │ chrF++   │ Composite │
# ├──────┼───────────────────────┼────────────┼──────────┼───────────┤
# │  1   │ crk-coached-v3        │ gemini-2.5 │ 43.2     │ 0.67      │
# │  2   │ fst-gated-pipeline    │ gpt-4o     │ 41.8     │ 0.63      │
# │  3   │ prompt-baseline       │ claude-4   │ 38.1     │ 0.55      │
# └──────┴───────────────────────┴────────────┴──────────┴───────────┘

# Install the top-scoring method as a plugin
npx i18n-rosetta plugin install crk-coached-v3

# Use it
npx i18n-rosetta sync
```

**Usted no construye el método. Usted no entrena el modelo. Usted elige al ganador y lo implementa.** Si el próximo mes aparece un método mejor en la tabla de clasificación, lo intercambia con un solo comando.

## Lo que está disponible hoy

El puente entre la tabla de clasificación y la CLI está en desarrollo. Esto es lo que funciona en este momento:

### Métodos integrados (no requieren plugins)

| Método | Mejor para | Costo |
|--------|----------|------|
| `llm` (predeterminado) | Enfocado en calidad, cualquier idioma | Por token a través de OpenRouter |
| `gemini` | Calidad + nivel gratuito | Gratuito (limitado), luego por token |
| `google-translate` | Velocidad + volumen | $20/M de caracteres |
| `deepl` | Idiomas europeos | $25/M de caracteres |
| `llm-coached` | Idiomas con datos de coaching | Por token a través de OpenRouter |
| `api` | Métodos personalizados/alojados por la comunidad | Autoalojado |

### Métodos de plugin (se instalan por separado)

Los plugins personalizados pueden envolver cualquier lógica de traducción: un modelo ajustado (fine-tuned), un pipeline controlado por FST, una API de la comunidad o cualquier otra cosa que produzca JSON. Consulte [Construir un plugin](/docs/tutorials/build-a-plugin).

## Flujo de trabajo para empresas

### 1. Evalúe su calidad actual

```bash
# See what you're getting today
npx i18n-rosetta status

# Output shows: method per pair, cache hit rate, quality gate stats
```

### 2. Ejecute el entorno de evaluación (eval harness) en los candidatos

El [entorno de evaluación](https://mtevalarena.org/docs/specifications/harness) le permite evaluar (benchmark) múltiples métodos frente al mismo conjunto de datos. Ejecute un barrido (sweep), compare las puntuaciones y elija a los ganadores:

```bash
# In the eval harness repo
python -m mt_eval_harness.run \
  --methods coached-v3 baseline prompt-tuned \
  --dataset data/your-corpus.json
```

### 3. Configure los ganadores por par

Actualice su configuración para usar el mejor método por par de idiomas. Diferentes idiomas tienen diferentes métodos óptimos; ese es el punto.

### 4. Intégrelo en CI/CD

```bash
# In your CI pipeline
npx i18n-rosetta lint        # Catch hardcoded strings
npx i18n-rosetta sync        # Translate what changed
npx i18n-rosetta audit       # Fail if any locale is incomplete
npx i18n-rosetta integrity   # Validate placeholder consistency
```

Tres comandos. Cero traducción manual. El pipeline detecta las cadenas codificadas (hardcoded), las traduce con los métodos elegidos y hace fallar la compilación (build) si falta algo o está corrupto.

### 5. Revisión profesional (opcional)

Para contenido de alto riesgo o importancia, exporte a XLIFF para revisión humana:

```bash
npx i18n-rosetta xliff export --locale ja --output translations.xliff
# → Send to your translation agency
# → Import corrections back:
npx i18n-rosetta xliff import translations.xliff
```

Traduzca automáticamente la mayor parte. Revise humanamente las rutas críticas. Pague por el tiempo humano solo donde importa.

## Modelo de costos

rosetta **no tiene tarifa de licencia, ni suscripción mensual, ni precios por usuario (per-seat)**. Es una herramienta CLI de código abierto. Usted paga solo por las llamadas a la API de traducción:

| Volumen | Google Translate | LLM (Gemini Flash) | LLM (GPT-4o) |
|--------|-----------------|---------------------|---------------|
| 1,000 claves × 5 locales | ~$0.50 | ~$0.30 (nivel gratuito) | ~$2.00 |
| 10,000 claves × 15 locales | ~$15 | ~$8 | ~$60 |
| 50,000 claves × 30 locales | ~$75 | ~$40 | ~$300 |

La Memoria de Traducción significa que usted solo paga por las **claves modificadas** en sincronizaciones posteriores. Si actualiza 10 cadenas de 10,000, paga por 10 traducciones, no por 10,000.

## vs. Plataformas TMS

| | rosetta | Crowdin / Phrase / Locize |
|---|---|---|
| **Precios** | Gratuito (código abierto) + costos de API | $50–$500/mes + por usuario |
| **Dependencia del proveedor** | Ninguna — cambie de proveedor en la configuración | Alta — datos en su nube |
| **Elección de método** | Cualquier proveedor, cualquier modelo, por par | Lo que ellos ofrezcan |
| **CI/CD** | De primer nivel (`lint → sync → audit`) | Plugin/webhook |
| **Métodos personalizados** | Sistema de plugins, plugins de la comunidad | No compatible |
| **Control de calidad (Quality gate)** | Integrado (script incorrecto, eco, longitud) | Varía |
| **Autoalojado** | Sí (LibreTranslate, API personalizada) | No |

Consulte la [comparación completa](/docs/guides/comparison) para más detalles.

## Lecturas adicionales

- **[Inicio rápido](/docs/getting-started/quick-start)** — ejecute su primera sincronización en 60 segundos
- **[Métodos de traducción](/docs/guides/translation-methods)** — el menú completo de métodos con árbol de decisiones
- **[Integración CI/CD](/docs/guides/ci-cd)** — automatice en su pipeline
- **[Trabajar con traductores profesionales](/docs/guides/professional-translators)** — exportación/importación de XLIFF
- **[MT Eval Arena](https://mtevalarena.org)** — evaluación (benchmark) y tabla de clasificación
- **[Referencia de configuración](/docs/getting-started/configuration)** — todas las opciones de configuración