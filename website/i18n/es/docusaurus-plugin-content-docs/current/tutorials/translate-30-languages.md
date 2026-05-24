---
sidebar_position: 2
title: "Traducir 30 idiomas"
description: "Guía práctica: escale un proyecto de 3 a 30 idiomas mediante la combinación de métodos por par, el procesamiento por lotes y la integración de CI."
---
# Cookbook: Traducir 30 idiomas

Escale un proyecto desde unas pocas configuraciones regionales hasta una cobertura global. Este cookbook le guía a través de la selección de métodos, la optimización de costos y la integración de CI para una implementación multilingüe real.

**Escenario:** Usted tiene una aplicación SaaS con `en`, `fr`, `es`. Necesita agregar 27 idiomas más a través de tres niveles de requisitos de calidad.

---

## Paso 1: Categorice sus idiomas

No todos los 30 idiomas necesitan el mismo enfoque. Agrúpelos según la calidad del método disponible:

| Nivel | Idiomas | Método | Por qué |
|------|-----------|--------|-----|
| **Nivel 1 — Premium** | `ja`, `ko`, `zh`, `de`, `pt` | `llm` (GPT-4o) | Mercados de alto valor, gramática con matices |
| **Nivel 2 — Estándar** | `it`, `nl`, `pl`, `sv`, `da`, `fi`, `no`, `cs`, `ro`, `hu`, `el`, `tr`, `id`, `ms`, `th`, `vi`, `uk`, `bg` | `google-translate` | Alto volumen, buen soporte por parte de Google |
| **Nivel 3 — Entrenado** | `crk`, `oj`, `mi`, `haw` | `llm-coached` + plugins | Bajos recursos, requieren cumplimiento de terminología |

## Paso 2: Configure por par

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "defaultMethod": "google-translate",
  "model": "google/gemini-3.5-flash",
  "languages": {
    "ja": { "name": "Japanese", "register": "Polite/formal" },
    "ko": { "name": "Korean", "register": "Formal" },
    "zh": { "name": "Simplified Chinese", "register": "Neutral" },
    "de": { "name": "German", "register": "Formal (Sie)" },
    "pt": { "name": "Brazilian Portuguese", "register": "Informal" },
    "crk": { "name": "Plains Cree (SRO)", "register": "Neutral" }
  },
  "pairs": {
    "en:ja": { "method": "llm", "model": "openai/gpt-4o" },
    "en:ko": { "method": "llm", "model": "openai/gpt-4o" },
    "en:zh": { "method": "llm", "model": "openai/gpt-4o" },
    "en:de": { "method": "llm", "model": "openai/gpt-4o" },
    "en:pt": { "method": "llm", "model": "openai/gpt-4o" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

**Nota:** Los idiomas que no aparecen en `pairs` heredan `defaultMethod: "google-translate"`. No es necesario que enumere los 30.

:::info
El soporte para `crk` está en desarrollo; consulte [Apoyar un idioma de bajos recursos](/docs/guides/low-resource-languages) para conocer el estado y las pautas de contribución.
:::

## Paso 3: Configure las claves de API

Necesitará ambas claves de API para esta configuración:

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
export GOOGLE_TRANSLATE_API_KEY="AIza..."
```

## Paso 4: Realice una ejecución de prueba primero

Siempre obtenga una vista previa antes de traducir 30 idiomas:

```bash
npx i18n-rosetta sync --dry
```

Revise el resultado. Este mostrará:
- Qué pares usan qué método
- Cuántas claves son nuevas o han cambiado por configuración regional
- Llamadas a la API estimadas por nivel

## Paso 5: Ejecute la sincronización

```bash
npx i18n-rosetta sync
```

Rosetta procesa cada par de forma independiente. Los pares de Nivel 2 que usan Google Translate serán rápidos. Los pares LLM de Nivel 1 serán más lentos pero de mayor calidad. Los pares entrenados de Nivel 3 utilizan los datos de entrenamiento del plugin.

### Actualizaciones incrementales

Después de la sincronización inicial, las ejecuciones posteriores solo traducen las claves **cambiadas o nuevas**:

```bash
# Only keys that changed since last sync
npx i18n-rosetta sync
```

El archivo de bloqueo (`.i18n-rosetta.lock`) rastrea lo que se ha traducido, por lo que nunca volverá a traducir contenido estable.

## Paso 6: Audite la calidad

Compruebe el estado de todos los pares de idiomas:

```bash
npx i18n-rosetta status
```

Esto genera una tabla que muestra el método, el modelo, el nivel de calidad de cada par y si hay datos de entrenamiento o puntuaciones de referencia disponibles.

## Paso 7: Integración de CI

Agréguelo a su flujo de trabajo de GitHub Actions para que las traducciones se mantengan actualizadas en cada push:

```yaml title=".github/workflows/i18n-sync.yml"
name: Sync Translations
on:
  push:
    paths:
      - 'locales/en/**'

jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - name: Sync translations
        run: npx i18n-rosetta sync
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
          GOOGLE_TRANSLATE_API_KEY: ${{ secrets.GOOGLE_TRANSLATE_API_KEY }}

      - name: Commit updated translations
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add locales/
          git diff --staged --quiet || git commit -m "chore(i18n): sync translations"
          git push
```

## Estimación de costos

Para un proyecto con 500 claves de origen en 30 idiomas:

| Nivel | Idiomas | Método | Costo aproximado |
|------|-----------|--------|-----------------|
| Nivel 1 (5 idiomas) | ja, ko, zh, de, pt | GPT-4o | ~$2.50/sincronización completa |
| Nivel 2 (18 idiomas) | it, nl, pl, etc. | Google Translate | ~$0.90/sincronización completa |
| Nivel 3 (4 idiomas) | crk, oj, mi, haw | GPT-4o-mini entrenado | ~$0.40/sincronización completa |
| **Total** | **30 idiomas** | **Mixto** | **~$3.80/sincronización completa** |

Las sincronizaciones incrementales (de 5 a 20 claves cambiadas) cuestan una fracción de una sincronización completa.

## Consulte también

- [Métodos de traducción](/docs/guides/translation-methods) — Cómo funciona cada método de traducción y cuándo usarlo
- [Especificación de plugins](/docs/reference/plugin-spec) — Cree datos de entrenamiento para cualquiera de sus idiomas de Nivel 3
- [Guía de CI/CD](/docs/guides/ci-cd) — Patrones de CI avanzados, incluidas las compilaciones de vista previa de PR
- [Puerta de calidad](/docs/concepts/quality-gate) — Cómo Rosetta valida cada traducción antes de escribirla
- [Idiomas compatibles](/docs/reference/supported-languages) — Lista completa de códigos de idioma y compatibilidad de métodos
- [Apoyar un idioma de bajos recursos](/docs/guides/low-resource-languages) — Agregue datos de entrenamiento para idiomas sin una amplia cobertura de MT