---
sidebar_position: 1
slug: /
title: "Introducción"
---
# i18n-rosetta

Un marco de internacionalización totalmente personalizable. Un solo comando traduce sus archivos de configuración regional (locale). Una sola configuración controla cada método, modelo y par de idiomas. Y si los métodos integrados no son suficientes: construya el suyo, demuestre que funciona y despliéguelo.

```bash
npx i18n-rosetta sync
```

rosetta detecta automáticamente sus archivos de configuración regional, el formato y los idiomas de destino. Traduce lo que falta, omite lo que ya está hecho, valida cada resultado y escribe un resultado limpio. Esa es la línea de partida.

---

## ¿Por qué no programarlo usted mismo?

Usted podría escribir un bucle rápido que llame a Google Translate en cada clave. La mayoría de los desarrolladores lo hacen; toma unas 30 líneas de código. Aquí es donde falla:

- **Sin detección de cambios.** Si actualiza una cadena en inglés, la traducción quedará obsoleta para siempre. rosetta rastrea cada valor de origen con hashes SHA-256 y vuelve a traducir solo lo que cambió.
- **Sin procesamiento por lotes.** Una llamada a la API por clave significa que 200 claves = 200 viajes de ida y vuelta. rosetta agrupa en lotes de manera inteligente (configurable, por defecto 80 claves/lote para LLM, 128 para Google).
- **Sin almacenamiento en caché.** Cada sincronización vuelve a traducir todo. La Memoria de Traducción (Translation Memory) de rosetta almacena en caché las traducciones por texto de origen + configuración regional + método; volver a ejecutar la sincronización después del cambio de una clave solo traduce esa clave, no todo el archivo.
- **Sin control de calidad.** La traducción automática alucina, repite el texto de origen o produce resultados en el sistema de escritura incorrecto. rosetta valida cada traducción antes de escribirla: los sistemas de escritura incorrectos, la inflación de longitud y las repeticiones del origen son detectados y rechazados.
- **Sin reconocimiento de formato.** ¿Codificado de forma rígida (hardcoded) para JSON? rosetta maneja JSON, TOML, YAML y Hugo Markdown (frontmatter + cuerpo) con detección automática.
- **Sin control de método.** Cada par de idiomas obtiene el mismo método. rosetta le permite usar Google Translate para francés, un LLM para japonés y un pipeline personalizado alojado por la comunidad para cree, todo en el mismo archivo de configuración.

rosetta es la versión de producción de ese script.

---

## Qué lo hace diferente

### Cada método es un plugin

El método de traducción es **configurable por par de idiomas**. Combine Google Translate, LLMs, prompts guiados (coached prompts) y APIs personalizadas en el mismo proyecto:

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "google-translate" },
    "en:ja": { "method": "llm", "model": "google/gemini-2.5-pro" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

El francés obtiene Google Translate (rápido, económico). El japonés obtiene un LLM premium (con matices). El cree de las llanuras obtiene un plugin guiado con reglas gramaticales, diccionarios y validación morfológica. El mismo comando `sync`. El mismo control de calidad. La misma CLI.

### Demuéstrelo

¿Cree que su método puede traducir de inglés a español? ¿De turco a azerbaiyano? ¿De inglés a cree?

**Demuéstrelo.** El [entorno de evaluación (eval harness)](https://mtevalarena.org/docs/specifications/harness) complementario evalúa cualquier método de traducción con una puntuación reproducible y con huella digital. La [tabla de clasificación](/leaderboard) rastrea cada envío.

El entorno de evaluación y la CLI de producción comparten la misma interfaz de plugin. Un método que obtiene una buena puntuación en la evaluación puede usarse en producción, siempre y cuando la comunidad a cuyo idioma sirve dé su consentimiento. Para los idiomas indígenas y de bajos recursos, ese consentimiento es importante. Consulte [Soberanía de Datos](https://mtevalarena.org/docs/sovereignty/data-sovereignty).

```bash
# Benchmark your method (in the eval harness repo)
cd gds-mt-eval-harness
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json --submit

# Use it locally
npx i18n-rosetta sync
```

El mismo plugin. Conecte y pruebe.

### El conjunto completo de herramientas

rosetta no es solo `sync`. Es un pipeline de i18n completo:

| Comando | Qué hace |
|---------|-------------|
| `sync` | Traduce claves faltantes y obsoletas (con verificación posterior a la sincronización) |
| `watch` | Sincronización automática cuando su archivo de origen cambia |
| `lint` | Escanea el código fuente en busca de cadenas codificadas de forma rígida (hardcoded) |
| `wrap` | Envuelve automáticamente las cadenas codificadas de forma rígida en llamadas `t()` |
| `audit` | Enumera todos los marcadores de respaldo (fallback) `[EN]` de ejecuciones anteriores |
| `verify` | Verifica que las traducciones estén presentes y sean correctas (control de CI) |
| `integrity` | Detecta corrupción de marcadores de posición, problemas de codificación y la integridad de los plurales ICU |
| `seo` | Genera etiquetas hreflang, mapas del sitio (sitemaps) y esquemas JSON-LD |
| `status` | Muestra la configuración de pares, plugins y puntuaciones de referencia (benchmark) |
| `provenance` | Audita las licencias de los recursos de traducción |
| `plugin` | Instala, elimina y enumera los plugins de métodos |
| `fonts` | Descarga fuentes web para convertidores de sistemas de escritura PUA |
| `tm` | Administra la caché de la Memoria de Traducción (estadísticas, borrar, por configuración regional) |
| `xliff` | Exporta/importa XLIFF 1.2 para revisión por traductores profesionales |

Cuatro de estos (`lint`, `sync`, `verify`, `audit`) forman un pipeline de CI que detecta cadenas codificadas de forma rígida, las traduce, verifica su exactitud y detiene la compilación si alguna configuración regional está incompleta.

---

## La Arena

La [Tabla de clasificación de métodos](/leaderboard) es el marcador. Cada envío tiene una huella digital vinculada a un commit de Git, está versionado para un conjunto de datos específico y es evaluado por el mismo entorno de evaluación. Cualquiera puede enviar.

**¿Qué puede demostrar?** El entorno de evaluación acepta JSON. Los plugins aceptan JSON. Cualquier método que produzca JSON puede ser probado:

| Enfoque | Ejemplo |
|----------|---------|
| **LLM guiado** | Inyecta reglas gramaticales y diccionarios en el prompt de un modelo de frontera |
| **Modelo ajustado (Fine-tuned)** | Entrena un modelo abierto con textos paralelos, pero no con los datos de evaluación |
| **Pipeline controlado por FST** | El LLM genera → un transductor de estado finito valida la morfología → reintenta |
| **Modelos encadenados** | El Modelo A redacta → el Modelo B posedita → el Modelo C califica |
| **Diccionario + LLM** | Fuerza términos conocidos de un diccionario, deja que el LLM maneje el resto |
| **Evolutivo** | Genera candidatos, los califica, muta los mejores, repite |
| **Traducción parcial** | Traduce una muestra a mano, demuestra que su LLM coincide, traduce automáticamente el resto |

Ajuste modelos (fine-tune). Despliegue algoritmos evolutivos. Pruebe las respuestas de los estudiantes en exámenes de idiomas. Construya tablas de búsqueda. Encadene tres modelos juntos. Siempre que su método produzca JSON, el entorno lo califica y el marco de trabajo lo ejecuta.

:::danger La única regla
**No entrene con los datos de evaluación.** Los métodos expuestos al conjunto de datos de referencia (benchmark) serán descalificados. Ajuste (fine-tune) con lo que desee. Simplemente no con el conjunto de pruebas.
:::

Esta es una invitación abierta. Si usted trabaja con un idioma de bajos recursos (ya sea como investigador, miembro de la comunidad, estudiante o simplemente alguien a quien le importa), construya un método, ejecute el entorno de evaluación y reclame la puntuación más alta. El problema no está resuelto. La infraestructura está aquí.

**[→ Ver la tabla de clasificación](/leaderboard)**

---

## Próximos pasos

**Para empezar:**
- [Instalación](/docs/getting-started/installation) — Configure en 2 minutos
- [Inicio rápido](/docs/getting-started/quick-start) — Ejecute su primera sincronización
- [Idiomas compatibles](/docs/reference/supported-languages) — Qué está disponible de forma predeterminada

**Personalización de su configuración:**
- [Métodos de traducción](/docs/guides/translation-methods) — Elija el método correcto por par de idiomas
- [Memoria de Traducción](/docs/concepts/translation-memory) — Cómo el almacenamiento en caché le ahorra dinero
- [Configuración](/docs/getting-started/configuration) — Referencia completa de configuración
- [Sitio multilingüe de Hugo](/docs/tutorials/hugo-multilingual-site) — Traducción de contenido Markdown

**Para profundizar:**
- [Trabajar con traductores profesionales](/docs/guides/professional-translators) — Flujo de trabajo de exportación/importación de XLIFF
- [Soberanía de Datos](https://mtevalarena.org/docs/sovereignty/data-sovereignty) — Principios OCAP, CARE y de Soberanía de Datos Maorí
- [Apoyar un idioma de bajos recursos](https://mtevalarena.org/docs/community/low-resource-languages) — El desafío que lo inició todo
- [Libro de recetas: Pipeline controlado por FST](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — Construya un pipeline de descomposición
- [Evaluación de MT](https://mtevalarena.org/docs/leaderboard/rules) — Cómo funcionan el entorno de evaluación y la tabla de clasificación
- [Tabla de clasificación de métodos](/leaderboard) — Puntuaciones en vivo y envíos