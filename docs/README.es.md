# i18n-rosetta

[![npm version](https://img.shields.io/npm/v/i18n-rosetta.svg)](https://www.npmjs.com/package/i18n-rosetta)
[![CI](https://github.com/gamedaysuits/i18n-rosetta/actions/workflows/ci.yml/badge.svg)](https://github.com/gamedaysuits/i18n-rosetta/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

🌐 **Traducciones del README** — *traducido por rosetta, por supuesto:*
[Français](docs/README.fr.md) · [Deutsch](docs/README.de.md) · [Español](docs/README.es.md) · [Português](docs/README.pt.md) · [Nederlands](docs/README.nl.md) · [日本語](docs/README.ja.md) · [한국어](docs/README.ko.md) · [简体中文](docs/README.zh.md) · [ไทย](docs/README.th.md) · [Tiếng Việt](docs/README.vi.md) · [Filipino](docs/README.fil.md) · [العربية](docs/README.ar.md)

Traduzca sus archivos de configuración regional con un solo comando:

```bash
npx i18n-rosetta sync
```

Rosetta detecta automáticamente sus archivos de configuración regional, su formato y los idiomas de destino. Traduce las claves faltantes, omite lo que ya está hecho y escribe los resultados. Eso es todo.

## ¿Por qué no simplemente programarlo usted mismo?

Podría escribir un script rápido que recorra sus claves en inglés y llame a Google Translate. La mayoría de los desarrolladores lo hacen, toma alrededor de 30 líneas. Aquí le explicamos por qué falla:

- **Sin detección de cambios.** Cuando actualiza una cadena en inglés, la traducción permanece obsoleta para siempre. Rosetta rastrea cada valor de origen con hashes SHA-256 y vuelve a traducir solo lo que cambió.
- **Sin procesamiento por lotes.** Una llamada a la API por clave significa 200 claves = 200 viajes de ida y vuelta. Rosetta procesa por lotes de forma inteligente (configurable, por defecto 30 claves/lote para LLM, 128 para Google).
- **Sin puerta de calidad.** La traducción automática alucina, repite el origen o produce resultados en el script incorrecto. Rosetta valida cada traducción antes de escribirla: los scripts incorrectos, la inflación de longitud y las repeticiones de origen se detectan y rechazan.
- **Sin conocimiento del formato.** ¿Codificado para JSON? Rosetta maneja JSON, TOML, YAML y Hugo Markdown (frontmatter + cuerpo) con detección automática.
- **Sin seguridad.** Rosetta protege contra la contaminación de prototipos, la transversalidad de rutas a través de códigos de configuración regional manipulados y la corrupción de bloques de código durante la traducción de Markdown.

Rosetta es la versión de producción de ese script.

## Inicio rápido

```bash
npm install --save-dev i18n-rosetta
```

### Obtener una clave API

Rosetta necesita un backend de traducción. Elija uno:

| Proveedor | Clave | Mejor para |
|----------|-----|----------|
| **OpenRouter** (recomendado) | `OPENROUTER_API_KEY` | Proyectos con mucho contenido, Markdown, más de 200 modelos |
| **OpenAI** | `OPENAI_API_KEY` | Acceso directo a GPT-4o |
| **Anthropic** | `ANTHROPIC_API_KEY` | Acceso directo a Claude |
| **Gemini** | `GEMINI_API_KEY` | Nivel gratuito disponible |
| **DeepL** | `DEEPL_API_KEY` | Idiomas europeos, soporte de glosario |
| **Google Translate** | `GOOGLE_TRANSLATE_API_KEY` | Más de 130 idiomas, alto volumen |

**Inicio más rápido** (gratuito): Regístrese en [aistudio.google.com](https://aistudio.google.com/apikey) para obtener una clave Gemini gratuita:

```bash
export GEMINI_API_KEY=AI...
npx i18n-rosetta sync --method gemini
```

**OpenRouter** (más de 200 modelos): Regístrese en [openrouter.ai](https://openrouter.ai), luego:

```bash
export OPENROUTER_API_KEY=sk-or-v1-...
npx i18n-rosetta sync
```

Alternativa de **Google Translate** (solo pares clave-valor, sin conocimiento de Markdown):

```bash
export GOOGLE_TRANSLATE_API_KEY=...
npx i18n-rosetta sync --method google-translate
```

> **Nota**: Si solo se configura `GOOGLE_TRANSLATE_API_KEY`, rosetta cambia automáticamente a Google Translate. No se necesita cambiar la configuración. Utiliza la API REST directamente, sin SDK, sin cuenta de servicio, sin `pip install`. Solo la clave.

Eso es todo. Para un mayor control, cree un archivo de configuración:

```bash
npx i18n-rosetta init                        # guided wizard — walks you through registers, methods, and content
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific languages and default registers
```

Cada idioma viene con **preajustes de registro**, instrucciones de tono/formalidad preestablecidas y ajustadas a su sistema lingüístico (vouvoiement para francés, Siezen para alemán, です/ます para japonés, 해요체 para coreano). El asistente de inicio le permite explorar y elegir preajustes, o pasar `--yes` para aceptar los valores predeterminados.

### Origen no inglés

Si su idioma de origen no es inglés:

```bash
i18n-rosetta sync --source fr                      # CLI flag
```

O configúrelo permanentemente en su archivo de configuración:

```json
{ "inputLocale": "fr" }
```

## Qué hace

Usted se encarga del framework i18n (next-intl, i18next, Hugo). Rosetta se encarga de los archivos de traducción.

- **Multiformato** — JSON, TOML, YAML, Hugo Markdown (metadatos + cuerpo) y XLIFF 1.2
- **Incremental** — Solo traduce lo que cambió (seguimiento de hash SHA-256)
- **Almacenado en caché** — La Memoria de Traducción almacena resultados anteriores; volver a ejecutar la sincronización no cuesta nada para las claves sin cambios
- **Con puerta de calidad** — Valida cada traducción: detecta alucinaciones, salida de script incorrecta, repeticiones de origen e inflación de longitud
- **Consciente del contenido** — Los métodos LLM protegen los bloques de código, los shortcodes, los enlaces y las variables de interpolación durante la traducción de Markdown
- **Herramientas de pipeline** — `lint`, `audit`, `integrity`, `seo` para puertas de CI
- **Interoperabilidad XLIFF** — Exporta traducciones para revisión profesional en herramientas CAT (memoQ, SDL Trados, Phrase), las importa de nuevo
- **Cero dependencias** — Solo funciones integradas de Node.js. Sin SDKs, sin módulos nativos. Requiere Node 20+

## Más allá de Google Translate

El inicio rápido le permite empezar a trabajar con un LLM o Google Translate. Pero Google Translate admite unos 130 idiomas. Hay más de 7.000.

**La idea central de Rosetta: el método de traducción es configurable por par de idiomas.** Use Google Translate para francés, un LLM con entrenamiento morfológico para Cree de las Llanuras y una API alojada por la comunidad para quechua, todo en el mismo proyecto, todo con la misma CLI.

```json
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "google-translate" },
    "en:ja": { "method": "llm" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

Si puede averiguar cómo traducir un par de idiomas (mediante ingeniería de prompts, diccionarios comunitarios, pipelines FST o modelos ajustados), rosetta le permite empaquetar ese método como un plugin y desplegarlo junto con todo lo demás.

> Nació de la traducción de un sitio web de producción al Cree de las Llanuras, donde no existe una API lista para usar. La arquitectura por pares no es teórica, existe porque un proyecto necesitaba Google Translate para francés y un pipeline FST entrenado para un idioma indígena, funcionando lado a lado en el mismo comando de sincronización.

El [MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness) complementario le permite comparar y evaluar enfoques de traducción, y luego exportar métodos de trabajo como plugins de rosetta. Cualquier persona que hable ambos idiomas puede desarrollar, probar y compartir un método de traducción, sin necesidad de una plataforma propietaria.

### Elija su método

Rosetta admite 10 métodos de traducción. Cada par de idiomas puede usar un método diferente.

**Proveedores de LLM** — lo mejor para calidad, compatible con Markdown, compatible con entrenamiento:

| Método | Clave | Qué hace |
|--------|-----|-------------|
| `llm` (predeterminado) | `OPENROUTER_API_KEY` | LLM a través de OpenRouter — más de 200 modelos, enrutamiento automático |
| `llm-coached` | `OPENROUTER_API_KEY` | LLM + reglas gramaticales, diccionarios, notas de estilo |
| `openai` | `OPENAI_API_KEY` | API directa de OpenAI (gpt-4o, gpt-4o-mini) |
| `anthropic` | `ANTHROPIC_API_KEY` | API directa de Anthropic (Claude Sonnet, Haiku, Opus) |
| `gemini` | `GEMINI_API_KEY` | API directa de Google Gemini (Flash, Pro) — nivel gratuito disponible |

**MT tradicional** — lo mejor para velocidad, costo y pares clave-valor de alto volumen:

| Método | Clave | Qué hace |
|--------|-----|-------------|
| `google-translate` | `GOOGLE_TRANSLATE_API_KEY` | API de Google Cloud Translation v2 (más de 130 idiomas) |
| `deepl` | `DEEPL_API_KEY` | API de DeepL con soporte de glosario (más de 30 idiomas) |
| `microsoft-translator` | `MICROSOFT_TRANSLATOR_API_KEY` | Traductor de Azure Cognitive Services (más de 100 idiomas) |
| `libretranslate` | *(autoalojado)* | LibreTranslate autoalojado (AGPL, gratuito) |

**Infraestructura** — para puntos finales personalizados o alojados por la comunidad:

| Método | Clave | Qué hace |
|--------|-----|-------------|
| `api` | *(por proveedor)* | Cliente HTTP ligero para cualquier punto final REST |

```bash
# Force a specific method for one run
i18n-rosetta sync --method deepl

# Or configure per pair
```

```json
{
  "pairs": {
    "en:fr": { "method": "deepl" },
    "en:ja": { "method": "openai", "model": "gpt-4o" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

> **Nota**: Los métodos de MT tradicionales (Google Translate, DeepL, Microsoft Translator, LibreTranslate) manejan bien los pares clave-valor, pero no pueden traducir de forma segura el contenido de Markdown. Para proyectos con mucho contenido, se recomiendan los métodos LLM, ya que protegen explícitamente los bloques de código, los shortcodes y las variables de interpolación.

## Plugins

Los plugins son recetas de traducción preempaquetadas para pares de idiomas específicos. Son manifiestos JSON (no código) que le indican a rosetta qué método usar, con qué configuraciones y qué calidad se ha evaluado.

```bash
i18n-rosetta plugin install ./french-formal-v1/    # install from directory
i18n-rosetta plugin list                           # see installed plugins
i18n-rosetta plugin remove french-formal-v1        # uninstall
i18n-rosetta status                                # shows quality tiers + benchmarks
```

Consulte [docs/METHOD_PLUGIN_SPEC.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/METHOD_PLUGIN_SPEC.md) para ver el formato del manifiesto.

## Comandos

| Comando | Propósito |
|---------|---------|
| `init` | Asistente de configuración interactivo (o `--yes` para valores predeterminados rápidos) |
| `sync` | Traducir y sincronizar todos los archivos de configuración regional |
| `watch` | Sincronización automática en cambios de archivo |
| `audit` | Marcar configuraciones regionales incompletas (puerta de CI) |
| `lint` | Buscar cadenas codificadas en el código fuente |
| `wrap` | Envolver automáticamente cadenas codificadas en llamadas `t()` (con deshacer) |
| `seo` | Generar hreflang, sitemap.xml o esquema JSON-LD |
| `integrity` | Comprobar corrupción de marcadores de posición, codificación y completitud plural de ICU |
| `status` | Mostrar configuración de pares, métodos, registros y niveles de calidad |
| `provenance` | Auditar licencias de recursos de traducción |
| `plugin` | Instalar, eliminar o listar plugins de método |
| `fonts` | Descargar fuentes web para convertidores de scripts PUA |
| `tm` | Administrar la caché de Memoria de Traducción (estadísticas, borrar, por configuración regional) |
| `xliff` | Exportar/importar XLIFF 1.2 para revisión de traductores profesionales |

Ejecute `i18n-rosetta <command> --help` para obtener ayuda detallada sobre cualquier comando.

Referencia completa: [docs/CLI_REFERENCE.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/CLI_REFERENCE.md)

## Configuración

Cree `i18n-rosetta.config.json` o ejecute `i18n-rosetta init`:

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "model": "google/gemini-3.5-flash",
  "pairs": {
    "en:fr": { "qualityTier": "high" },
    "en:ja": { "method": "google-translate" }
  }
}
```

| Opción | Predeterminado | Descripción |
|--------|---------|-------------|
| `inputLocale` | `"en"` | Código de idioma de origen |
| `localesDir` | `"./locales"` | Ruta a los archivos de configuración regional |
| `contentDir` | `null` | Directorio de contenido de Hugo (habilita la traducción de Markdown) |
| `format` | `"auto"` | Formato de archivo: `json`, `toml`, `yaml` o `auto` |
| `model` | `"google/gemini-3.5-flash"` | Modelo predeterminado de OpenRouter |
| `defaultMethod` | `"llm"` | Método de traducción predeterminado (anulado por la bandera `--method`) |
| `batchSize` | `30` | Claves por lote de traducción |
| `pairs` | `{}` | Anulaciones de método, modelo y calidad por par |

**Anulaciones por idioma**: Cada idioma tiene una [Tarjeta de Idioma](docs/planning/LANGUAGE_CARD_SPEC.md), una de las 50 tarjetas seleccionadas que contienen preajustes de registro, sistemas de formalidad, reglas tipográficas y banderas de soporte de métodos. Las tarjetas utilizan una [arquitectura de dos niveles](website/docs/concepts/architecture.md) (tiempo de ejecución + referencia) para un rendimiento a escala. Cree una nueva tarjeta con `node scripts/generate-language-card.mjs <code>`. Use las claves de preajuste como abreviatura, o escriba texto de registro personalizado:

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
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

**Modo sin configuración**: ¿No tiene un archivo de configuración? Rosetta detecta automáticamente los archivos de configuración regional, el formato y los idiomas de destino de su proyecto.

Los valores de idioma pueden ser una clave preestablecida (por ejemplo, `"casual-tu"`), texto de registro personalizado o un objeto (control total). Las anulaciones a nivel de par en `pairs` tienen prioridad sobre la configuración a nivel de idioma. Ejecute `npx i18n-rosetta init` para explorar los preajustes disponibles para cada idioma.

Guías de configuración del framework: [docs/INTEGRATION_GUIDES.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/INTEGRATION_GUIDES.md)

## Reforzamiento

- **Retroceso exponencial** — 3 reintentos con fluctuación en errores 429/5xx
- **Tiempo de espera de solicitud de 30 segundos** — AbortController evita bloqueos
- **Validación de respuesta** — solo acepta claves que fueron enviadas para traducción
- **Puerta de calidad** — detecta bucles de alucinación, salida de script incorrecta, inflación de longitud y repeticiones de origen
- **Cascada de reintentos** — en caso de fallo de análisis JSON, reintenta lote → medio lote → claves individuales (con límite de presupuesto a través de `maxRetries`)
- **Memoria de traducción** — `.rosetta/tm.json` almacena en caché las traducciones indexadas por texto de origen + configuración regional + método; las claves sin cambios se sirven desde la caché en sincronizaciones posteriores, eliminando llamadas a la API redundantes
- **Almacenamiento en caché de prompts** — la división de mensajes del sistema/usuario permite el almacenamiento en caché a nivel de proveedor, reduciendo el costo de tokens en todos los lotes
- **Aplicación de terminología** — las traducciones entrenadas se verifican con los términos del diccionario después de que el LLM responde
- **Protección contra la contaminación de prototipos** — bloquea `__proto__`, `constructor`, `prototype`
- **Contención de rutas** — las escrituras de archivos se validan para permanecer dentro de los directorios configurados
- **Protección de bloques** — bloques de código, shortcodes, HTML protegidos durante la traducción de contenido
- **Respaldo explícito** — `--fallback` escribe marcadores de posición con prefijo `[EN]` cuando la API no está disponible (resincronice con una clave para traducciones reales)
- **Éxito parcial** — un lote fallido no bloquea el resto

## Pruebas

```bash
npm test                         # all tests
npm run test:unit                # core sync pipeline
npm run test:redteam             # adversarial edge cases
npm run test:format              # TOML/YAML adapters
npm run test:content             # Markdown content parser
npm run test:hugo                # full Hugo E2E
npm run test:lint                # hardcoded string detection
npm run test:pairs               # pair graph resolution
npm run test:methods             # translation method suite
```

**Cero dependencias.**

## Licencia

MIT