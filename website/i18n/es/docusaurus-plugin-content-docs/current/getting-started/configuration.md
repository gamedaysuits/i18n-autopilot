---
sidebar_position: 3
title: "Configuración"
---
# Configuración

Rosetta funciona sin configuración (zero-config): detecta automáticamente los archivos de configuración regional (locale), el formato y los idiomas de destino de su proyecto. Para tener más control, cree `i18n-rosetta.config.json` en la raíz de su proyecto, o ejecute:

```bash
npx i18n-rosetta init
```

## Referencia completa de configuración

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "contentDir": null,
  "translatableFields": null,
  "format": "auto",
  "model": "google/gemini-3.5-flash",
  "defaultMethod": "llm",
  "batchSize": 80,
  "jsonConcurrency": 200,
  "contentConcurrency": 48,
  "fallbackPrefix": "[EN] ",
  "apiKeyEnvVar": "OPENROUTER_API_KEY",
  "baseUrl": "",
  "pairs": {},
  "languages": {},
  "lint": {
    "srcDir": null,
    "ignore": ["node_modules", ".next", "dist"],
    "minLength": 2
  },
  "seo": {
    "urlPattern": "/:locale/:path",
    "pages": null
  },
  "typegen": {
    "output": null,
    "autoGenerate": false
  }
}
```

:::note typegen aún no está implementado
El bloque de configuración `typegen` es reconocido y preservado por el cargador de configuración, pero la generación de tipos de TypeScript aún no está implementada. Este es un marcador de posición para una función planeada. Configurar estos valores no tiene ningún efecto.
:::


### Campos

| Campo | Tipo | Predeterminado | Descripción |
|-------|------|---------|-------------|
| `version` | `number` | `3` | Versión del esquema de configuración. Siempre `3`. |
| `inputLocale` | `string` | `"en"` | Código del idioma de origen (BCP 47). |
| `localesDir` | `string` | `"./locales"` | Ruta a los archivos de configuración regional (locale). Rosetta escanea este directorio. |
| `contentDir` | `string` | `null` | Directorio de contenido de Hugo. Habilita la traducción del cuerpo de Markdown. |
| `translatableFields` | `string[]` | `null` | Anula los campos predeterminados del frontmatter traducibles para la traducción de contenido. `null` utiliza los valores predeterminados integrados (`title`, `description`, `summary`). |
| `format` | `string` | `"auto"` | Formato de archivo: `json`, `toml`, `yaml` o `auto` (detectar desde la extensión). |
| `model` | `string` | `"google/gemini-3.5-flash"` | Modelo predeterminado para los métodos LLM. El formato depende del método: OpenRouter utiliza `provider/model` (por ejemplo, `google/gemini-3.5-flash`); los proveedores directos utilizan nombres simples (por ejemplo, `gpt-4o`, `gemini-2.5-flash`). |
| `defaultMethod` | `string` | `"llm"` | Método de traducción predeterminado: `llm`, `llm-coached`, `google-translate`, `deepl`, `microsoft-translator`, `libretranslate`, `openai`, `anthropic`, `gemini`, `api`. Es anulado por la bandera de la CLI `--method`. |
| `batchSize` | `number` | `80` | Claves por lote de traducción. Mayor = menos llamadas a la API, pero prompts más grandes. |
| `jsonConcurrency` | `number` | `200` | Máximo de traducciones de locale en paralelo para la sincronización de claves JSON. Es anulado por la bandera de la CLI `--json-concurrency`. |
| `contentConcurrency` | `number` | `48` | Máximo de llamadas a la API en paralelo para la traducción de contenido (Markdown/MDX). Es anulado por la bandera de la CLI `--content-concurrency`. |
| `fallbackPrefix` | `string` | `"[EN] "` | Prefijo de marcador utilizado por `audit` y `verify` para detectar valores heredados no traducidos de ejecuciones anteriores. Rosetta no escribe este prefijo, solo lo lee para su detección. |
| `apiKeyEnvVar` | `string` | `"OPENROUTER_API_KEY"` | Nombre de la variable de entorno para la clave de la API. Anúlelo para nombres de variables de entorno personalizados. |
| `baseUrl` | `string` | `""` | URL base para la generación de artefactos SEO (hreflang, sitemaps, JSON-LD). |
| `pairs` | `object` | `{}` | Anulaciones de método, modelo y calidad por par. Consulte [Configuración de pares](#pair-configuration). |
| `languages` | `object` | `{}` | Anulaciones por idioma. Consulte [Configuración de idiomas](#language-configuration). |
| `lint.srcDir` | `string` | `null` | Directorio de origen para el escaneo de lint. `null` = detección automática desde el framework. |
| `lint.ignore` | `string[]` | `["node_modules", ...]` | Patrones glob para excluir del lint. |
| `lint.minLength` | `number` | `2` | Longitud mínima de la cadena para marcarla como codificada de forma rígida (hardcoded). |
| `seo.urlPattern` | `string` | `"/:locale/:path"` | Plantilla de patrón de URL para la generación de etiquetas hreflang. |
| `seo.pages` | `string[]` | `null` | Lista explícita de páginas para SEO. `null` = detección automática desde las claves de locale. |
| `typegen.output` | `string` | `null` | Ruta de salida para los tipos de TypeScript generados. `null` = deshabilitado. |
| `typegen.autoGenerate` | `boolean` | `false` | Regenerar tipos automáticamente después de cada sincronización. |

## Configuración de pares

Cada par de origen→destino se puede configurar de forma independiente:

```json
{
  "pairs": {
    "en:fr": {
      "method": "google-translate",
      "qualityTier": "high"
    },
    "en:ja": {
      "method": "llm",
      "model": "google/gemini-2.5-pro"
    },
    "en:crk": {
      "methodPlugin": "crk-coached-v1"
    }
  }
}
```

### Campos de pares

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `method` | `string` | Método de traducción: `llm`, `llm-coached`, `google-translate`, `deepl`, `microsoft-translator`, `libretranslate`, `openai`, `anthropic`, `gemini`, `api` |
| `methodPlugin` | `string` | Nombre de un plugin instalado (desde `.rosetta/methods/`) |
| `model` | `string` | Anula el modelo predeterminado para este par |
| `endpoint` | `string` | URL del endpoint de la API remota. Requerido cuando `method` es `api`. |
| `qualityTier` | `string` | Nivel de visualización: `standard`, `high`, `research`, `verified` |

## Configuración de idiomas

Los idiomas aceptan tres formatos:

### Arreglo de códigos (el más simple)

```json
{
  "languages": ["fr", "de", "ja"]
}
```

Cada idioma obtiene su registro predeterminado de la tabla de registros integrada. Los idiomas sin un valor predeterminado obtienen `"Professional register."`.

### Objeto con cadenas de registro

El valor puede ser una **clave preestablecida** de la tarjeta del idioma, o texto de registro personalizado:

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "Custom: Polite Japanese for a gaming app."
  }
}
```

Rosetta verifica si la cadena coincide con una clave preestablecida en la tarjeta del idioma. Si es así, se utiliza el prompt de registro completo de la tarjeta. Si no, la cadena se utiliza tal cual. Consulte [Idiomas compatibles](/docs/reference/supported-languages#language-cards) para ver los ajustes preestablecidos disponibles.

### Objeto con configuración completa

```json
{
  "languages": {
    "crk": {
      "name": "Plains Cree",
      "register": "SRO syllabics with grammatical precision.",
      "model": "google/gemini-2.5-pro",
      "batchSize": 5,
      "maxRetries": 5,
      "script": "cans"
    }
  }
}
```

Puede mezclar objetos abreviados y completos en el mismo bloque.


### Campos de idiomas

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `register` | `string` | Instrucciones de estilo/tono. Puede ser una **clave preestablecida** (por ejemplo, `casual-tu`, `formal-hapsyo`) o texto personalizado. Consulte [Tarjetas de idiomas](/docs/reference/supported-languages#language-cards). |
| `name` | `string` | Nombre del idioma legible por humanos (para la visualización del estado) |
| `model` | `string` | Anula el modelo predeterminado |
| `batchSize` | `number` | Anula el tamaño de lote predeterminado |
| `maxRetries` | `number` | Presupuesto máximo de reintentos para lotes fallidos (predeterminado: 3) |
| `script` | `string` | Código de escritura ISO 15924. Activa la validación de escritura en el control de calidad (quality gate). |

:::info Cadena de herencia
Las configuraciones se resuelven en este orden (la primera gana):

**nivel de par** → **nivel de idioma** → **configuración global** → **valores predeterminados**

Por ejemplo, si `pairs["en:fr"]` establece `model`, anula tanto los valores de `model` a nivel de idioma como a nivel global.
:::

## Origen distinto al inglés

Si su idioma de origen no es el inglés:

```bash
# CLI flag (one-time)
npx i18n-rosetta sync --source fr
```

```json title="i18n-rosetta.config.json (permanent)"
{
  "inputLocale": "fr"
}
```

## Archivo de bloqueo (Lock File)

Rosetta crea `.i18n-rosetta.lock` para rastrear los hashes SHA-256 de los valores de origen traducidos. **Haga commit de este archivo** para que todos los desarrolladores compartan la misma base de traducción.

Cuando un valor de origen cambia, el hash ya no coincide y Rosetta vuelve a traducir esa clave en la siguiente sincronización.

## `.rosettaignore`

Cree `.rosettaignore` en la raíz de su proyecto para excluir archivos del escaneo de `lint`. Utiliza patrones glob, como `.gitignore`:

```text title=".rosettaignore"
src/components/legacy/**
src/utils/constants.js
**/*.test.js
```

## Directorio `.rosetta/`

Rosetta crea un directorio `.rosetta/` en la raíz de su proyecto para el estado interno. Por lo general, **debería agregar esto a `.gitignore`**, ya que es una optimización local, no código fuente del proyecto:

```gitignore
.rosetta/
```

| Archivo | Propósito | ¿Hacer commit? |
|------|---------|--------|
| `tm.json` | Caché de la memoria de traducción: almacena traducciones anteriores indexadas por texto de origen + locale + método | No (caché local) |
| `xliff/*.xliff` | Archivos de exportación XLIFF para revisión por traductores profesionales | No (transitorio) |
| `methods/` | Manifiestos de plugins de métodos instalados | Sí (configuración compartida) |
| `backups/` | Copias de seguridad previas al ajuste (creadas por `wrap --undo`) | No (red de seguridad) |

Consulte [Memoria de traducción](/docs/concepts/translation-memory) para obtener detalles sobre `tm.json` y cómo ahorra costos de API.

---

## API programática

Para scripts de compilación e integraciones personalizadas, importe directamente desde el paquete:

```javascript
import { GeminiMethod, runSync, resolveConfig } from 'i18n-rosetta';

// Use a method class directly
const gemini = new GeminiMethod();
const result = await gemini.translate(
  ['greeting', 'farewell'],
  { greeting: 'Hello', farewell: 'Goodbye' },
  { target: 'fr', name: 'French', register: 'formal', model: 'gemini-2.5-flash' },
  { cwd: process.cwd() }
);
// result = { greeting: 'Bonjour', farewell: 'Au revoir' }
```

### Exportaciones disponibles

| Exportación | Qué hace |
|--------|-------------|
| `TranslationMethod` | Clase base para todos los métodos |
| `LLMMethod` | Clase base para métodos LLM (OpenRouter) |
| `DirectLLMMethod` | Clase base para proveedores directos de LLM (OpenAI, Anthropic, Gemini) |
| `OpenAIMethod`, `AnthropicMethod`, `GeminiMethod` | Clases de proveedores directos de LLM |
| `DeepLMethod`, `MicrosoftTranslatorMethod`, `LibreTranslateMethod` | Clases de traducción automática (MT) tradicional |
| `GoogleTranslateMethod` | Google Cloud Translation |
| `LLMCoachedMethod` | LLM entrenado (OpenRouter + datos de entrenamiento) |
| `APIMethod` | Cliente de API remota |
| `runSync`, `runContentSync` | Pipeline de sincronización completa |
| `resolveConfig`, `resolvePairs` | Resolución de configuración |
| `validateTranslations` | Control de calidad (Quality gate) |
| `loadCoachingData`, `findDictionaryMatches` | Utilidades de entrenamiento (coaching) |

### Extensión de proveedor personalizado

Extienda `DirectLLMMethod` para agregar un nuevo proveedor de LLM en ~40 líneas:

```javascript
import { DirectLLMMethod } from 'i18n-rosetta';

class MistralMethod extends DirectLLMMethod {
  constructor(options) {
    super(options);
    this.name = 'mistral';
  }
  _getApiKeyEnvVar()     { return 'MISTRAL_API_KEY'; }
  _getApiKeyOptionsKey() { return 'mistralApiKey'; }
  _getDefaultModel()     { return 'mistral-large-latest'; }
  _getProviderLabel()    { return 'Mistral'; }

  _buildApiRequest({ prompt, systemMessage, apiKey, model, temperature }) {
    return {
      url: 'https://api.mistral.ai/v1/chat/completions',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: {
        model,
        messages: [
          ...(systemMessage ? [{ role: 'system', content: systemMessage }] : []),
          { role: 'user', content: prompt },
        ],
        temperature,
      },
    };
  }

  _extractResponseText(json) {
    return json.choices?.[0]?.message?.content;
  }

  // Optional but recommended: provider-specific setup help when translation fails
  getSetupHelp() {
    if (!process.env.MISTRAL_API_KEY) {
      return [
        '',
        '  ┌─ Missing API Key ─────────────────────────────────────────────┐',
        '  │ Mistral requires an API key from https://console.mistral.ai   │',
        '  │ Run: export MISTRAL_API_KEY=...                               │',
        '  └────────────────────────────────────────────────────────────────┘',
      ];
    }
    return ['        API key is set but translation failed. Check your Mistral dashboard.'];
  }
}
```

Obtiene traducción, entrenamiento (coaching), bucles de reintento, validación de modelos, niveles de calidad y ayuda de configuración de forma gratuita. Solo la forma de la solicitud HTTP es específica del proveedor. Para los adaptadores que no son LLM y que utilizan `fetch()` sin procesar, utilice el ayudante compartido `fetchWithRetry()` de `lib/methods/fetch-with-retry.js` en lugar de escribir su propio bucle de reintento.

---

## Consulte también

- [Referencia de la CLI](/docs/reference/cli): todos los comandos y banderas
- [Métodos de traducción](/docs/guides/translation-methods): cómo elegir y mezclar métodos
- [Memoria de traducción](/docs/concepts/translation-memory): almacenamiento en caché y ahorro de costos
- [Trabajar con traductores profesionales](/docs/guides/professional-translators): flujo de trabajo con XLIFF
- [Especificación de plugins](/docs/reference/plugin-spec): formato del manifiesto del plugin de métodos
- [Arquitectura](/docs/concepts/architecture): cómo se conectan las piezas
- [Idiomas compatibles](/docs/reference/supported-languages): soporte de idiomas integrado
- [Cómo funciona la sincronización](/docs/concepts/how-sync-works): el pipeline de traducción