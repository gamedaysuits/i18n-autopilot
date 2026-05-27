---
sidebar_position: 1
slug: /
title: "Introducción"
---
# i18n-rosetta

Un framework de internacionalización totalmente personalizable. Un comando traduce sus archivos de localización. Una configuración controla cada método, modelo y par de idiomas. Y si los métodos integrados no son suficientes: cree el suyo, demuestre que funciona y despliéguelo.

```bash
npx i18n-rosetta sync
```

rosetta detecta automáticamente sus archivos de localización, el formato y los idiomas de destino. Traduce lo que falta, omite lo que ya está hecho, valida cada resultado y escribe una salida limpia. Ese es el punto de partida.

---

## ¿Por qué no escribir el script usted mismo?

Podría escribir un bucle rápido que llame a Google Translate para cada clave. La mayoría de los desarrolladores lo hacen: toma unas 30 líneas. Aquí es donde falla:

- **Sin detección de cambios.** Actualice una cadena en inglés y la traducción quedará obsoleta para siempre. rosetta rastrea cada valor de origen con hashes SHA-256 y vuelve a traducir solo lo que cambió.
- **Sin procesamiento por lotes.** Una llamada a la API por clave significa que 200 claves = 200 viajes de ida y vuelta. rosetta agrupa de forma inteligente (configurable, por defecto 30 claves/lote para LLM, 128 para Google).
- **Sin almacenamiento en caché.** Cada sincronización vuelve a traducir todo. La Translation Memory de rosetta almacena en caché las traducciones por texto de origen + locale + método: volver a ejecutar la sincronización después del cambio de una clave solo traduce esa clave, no todo el archivo.
- **Sin control de calidad.** La traducción automática alucina, repite el origen o genera resultados en el sistema de escritura incorrecto. rosetta valida cada traducción antes de escribirla: los errores de sistema de escritura, la inflación de longitud y las repeticiones del origen se detectan y rechazan.
- **Sin reconocimiento de formato.** ¿Codificado de forma rígida (hardcoded) para JSON? rosetta maneja JSON, TOML, YAML y Hugo Markdown (frontmatter + cuerpo) con detección automática.
- **Sin control de método.** Cada par obtiene el mismo método. rosetta le permite usar Google Translate para francés, un LLM para japonés y un pipeline personalizado alojado por la comunidad para cree, todo en el mismo archivo de configuración.

rosetta es la versión de producción de ese script.

---

## Qué lo hace diferente

### Cada método es un plugin

El método de traducción es **configurable por par de idiomas**. Combine Google Translate, LLMs, prompts guiados y APIs personalizadas en el mismo proyecto:

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

¿Cree que su método puede traducir del inglés al español? ¿Del turco al azerbaiyano? ¿Del inglés al cree?

**Demuéstrelo.** El [eval harness](https://mtevalarena.org/docs/specifications/harness) complementario evalúa el rendimiento de cualquier método de traducción con una puntuación reproducible y con huella digital. La [tabla de clasificación](/leaderboard) rastrea cada envío.

El eval harness y la CLI de producción comparten la misma interfaz de plugin. Un método que obtiene una buena puntuación en el harness se puede usar en producción, si la comunidad a cuyo idioma sirve da su consentimiento. Para los idiomas indígenas y de bajos recursos, ese consentimiento es importante. Consulte [Soberanía de datos](https://mtevalarena.org/docs/sovereignty/data-sovereignty).

```bash
# Benchmark your method (in the eval harness repo)
cd gds-mt-eval-harness
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json --submit

# Use it locally
npx i18n-rosetta sync
```

El mismo plugin. Conecte y pruebe.

### El conjunto de herramientas completo

rosetta no es solo `sync`. Es un pipeline de i18n completo:

| Comando | Qué hace |
|---------|-------------|
| `sync` | Traduce claves faltantes, obsoletas y de respaldo (fallback) |
| `watch` | Sincronización automática cuando su archivo de origen cambia |
| `lint` | Escanea el código fuente en busca de cadenas codificadas de forma rígida (hardcoded) |
| `wrap` | Envuelve automáticamente las cadenas hardcoded en llamadas `t()` |
| `audit` | Enumera todos los valores de respaldo `[EN]` sin traducir |
| `integrity` | Detecta corrupción de marcadores de posición (placeholders), problemas de codificación y la integridad de plurales ICU |
| `seo` | Genera etiquetas hreflang, sitemaps y esquemas JSON-LD |
| `status` | Muestra la configuración de pares, plugins y puntuaciones de benchmark |
| `provenance` | Audita las licencias de los recursos de traducción |
| `plugin` | Instala, elimina y enumera los plugins de métodos |
| `fonts` | Descarga fuentes web para convertidores de sistemas de escritura PUA |
| `tm` | Administra la caché de la Translation Memory (estadísticas, limpieza, por locale) |
| `xliff` | Exporta/importa XLIFF 1.2 para la revisión de traductores profesionales |

Tres de estos — `lint`, `sync`, `audit` — forman un pipeline de CI que detecta cadenas hardcoded, las traduce y hace fallar la compilación (build) si algún locale está incompleto.

---

## La Arena

La [Tabla de clasificación de métodos](/leaderboard) es el marcador. Cada envío tiene una huella digital vinculada a un commit de Git, está versionado para un conjunto de datos específico y es puntuado por el mismo harness. Cualquiera puede enviar.

**¿Qué puede demostrar?** El harness acepta JSON. Los plugins aceptan JSON. Cualquier método que produzca JSON puede ser probado:

| Enfoque | Ejemplo |
|----------|---------|
| **LLM guiado** | Inyecte reglas gramaticales y diccionarios en el prompt de un modelo de frontera |
| **Modelo ajustado (fine-tuned)** | Entrene un modelo abierto con texto paralelo, pero no con los datos de evaluación |
| **Pipeline controlado por FST** | El LLM genera → el transductor de estados finitos (FST) valida la morfología → reintenta |
| **Modelos encadenados** | El Modelo A redacta → el Modelo B posedita → el Modelo C puntúa |
| **Diccionario + LLM** | Fuerce términos conocidos de un diccionario, deje que el LLM maneje el resto |
| **Evolutivo** | Genere candidatos, puntúelos, mute el mejor, repita |
| **Traducción parcial** | Traduzca una muestra a mano, demuestre que su LLM coincide, traduzca automáticamente el resto |

Ajuste (fine-tune) modelos. Despliegue algoritmos evolutivos. Pruebe las respuestas de los estudiantes en exámenes de idiomas. Construya tablas de búsqueda. Encadene tres modelos juntos. Siempre que su método produzca JSON, el harness lo puntúa y el framework lo ejecuta.

:::danger La única regla
**No entrene con los datos de evaluación.** Los métodos expuestos al conjunto de datos de benchmark serán descalificados. Ajuste (fine-tune) con lo que quiera. Simplemente no con el conjunto de pruebas (test set).
:::

Esta es una invitación abierta. Si trabaja con un idioma de bajos recursos (ya sea como investigador, miembro de la comunidad, estudiante o simplemente alguien a quien le importa), construya un método, ejecute el harness y reclame la puntuación más alta. El problema no está resuelto. La infraestructura está aquí.

**[→ Ver la tabla de clasificación](/leaderboard)**

---

## Próximos pasos

**Para empezar:**
- [Instalación](/docs/getting-started/installation) — Configúrelo en 2 minutos
- [Inicio rápido](/docs/getting-started/quick-start) — Ejecute su primera sincronización
- [Idiomas compatibles](/docs/reference/supported-languages) — Lo que está disponible de forma predeterminada

**Personalización de su configuración:**
- [Métodos de traducción](/docs/guides/translation-methods) — Elija el método correcto por par
- [Translation Memory](/docs/concepts/translation-memory) — Cómo el almacenamiento en caché le ahorra dinero
- [Configuración](/docs/getting-started/configuration) — Referencia completa de configuración
- [Sitio multilingüe en Hugo](/docs/tutorials/hugo-multilingual-site) — Traducción de contenido Markdown

**Para profundizar:**
- [Trabajar con traductores profesionales](/docs/guides/professional-translators) — Flujo de trabajo de exportación/importación de XLIFF
- [Soberanía de datos](https://mtevalarena.org/docs/sovereignty/data-sovereignty) — Principios OCAP, CARE y Soberanía de Datos Maorí
- [Apoyar un idioma de bajos recursos](https://mtevalarena.org/docs/community/low-resource-languages) — El desafío que lo inició todo
- [Libro de recetas: Pipeline controlado por FST](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — Construya un pipeline de descomposición
- [Evaluación de MT](https://mtevalarena.org/docs/leaderboard/rules) — Cómo funcionan el harness y la tabla de clasificación
- [Tabla de clasificación de métodos](/leaderboard) — Puntuaciones y envíos en vivo