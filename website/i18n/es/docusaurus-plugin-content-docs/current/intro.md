---
sidebar_position: 1
slug: /
title: "Introducción"
---
# i18n-rosetta

Un framework de internacionalización totalmente personalizable. Un comando traduce sus archivos de configuración regional (locale). Una configuración controla cada método, modelo y par de idiomas. Y si los métodos integrados no son suficientes, construya el suyo propio, demuestre que funciona y despliéguelo.

```bash
npx i18n-rosetta sync
```

rosetta detecta automáticamente sus archivos de configuración regional, formato e idiomas de destino. Traduce lo que falta, omite lo que ya está hecho, valida cada resultado y escribe una salida limpia. Esa es la línea de partida.

---

## ¿Por qué no programarlo usted mismo?

Podría escribir un bucle rápido que llame a Google Translate en cada clave. La mayoría de los desarrolladores lo hacen; toma alrededor de 30 líneas de código. Aquí es donde falla:

- **Sin detección de cambios.** Actualice una cadena en inglés y la traducción quedará obsoleta para siempre. rosetta rastrea cada valor de origen con hashes SHA-256 y vuelve a traducir solo lo que cambió.
- **Sin procesamiento por lotes.** Una llamada a la API por clave significa que 200 claves = 200 viajes de ida y vuelta. rosetta agrupa en lotes de manera inteligente (configurable, por defecto 30 claves/lote para LLM, 128 para Google).
- **Sin control de calidad.** La traducción automática alucina, repite el texto de origen o genera resultados en el sistema de escritura incorrecto. rosetta valida cada traducción antes de escribirla: los sistemas de escritura incorrectos, la inflación de longitud y las repeticiones del texto de origen se detectan y rechazan.
- **Sin reconocimiento de formato.** ¿Programado de forma rígida (hardcoded) para JSON? rosetta maneja JSON, TOML, YAML y Hugo Markdown (frontmatter + cuerpo) con detección automática.
- **Sin control de métodos.** Cada par de idiomas obtiene el mismo método. rosetta le permite usar Google Translate para francés, un LLM para japonés y un pipeline personalizado alojado por la comunidad para cree, todo en el mismo archivo de configuración.

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

El francés obtiene Google Translate (rápido, económico). El japonés obtiene un LLM premium (con matices). El cree de las llanuras (Plains Cree) obtiene un plugin guiado con reglas gramaticales, diccionarios y validación morfológica. El mismo comando `sync`. El mismo control de calidad. La misma CLI.

### Demuéstrelo

¿Cree que su método puede traducir del inglés al español? ¿Del turco al azerbaiyano? ¿Del inglés al cree?

**Demuéstrelo.** El [entorno de evaluación (eval harness)](https://mtevalarena.org/docs/specifications/harness) complementario evalúa cualquier método de traducción con una puntuación reproducible y con huella digital (fingerprinted). La [tabla de clasificación (leaderboard)](/leaderboard) rastrea cada envío.

El entorno de evaluación y la CLI de producción comparten la misma interfaz de plugins. Un método que obtiene una buena puntuación en la evaluación puede usarse en producción, siempre que la comunidad cuyo idioma atiende dé su consentimiento. Para los idiomas indígenas y de bajos recursos, ese consentimiento es importante. Consulte [Soberanía de datos](https://mtevalarena.org/docs/sovereignty/data-sovereignty).

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
| `watch` | Sincroniza automáticamente cuando su archivo de origen cambia |
| `lint` | Escanea el código fuente en busca de cadenas programadas de forma rígida (hardcoded) |
| `wrap` | Envuelve automáticamente las cadenas hardcoded en llamadas `t()` |
| `audit` | Enumera todos los valores de respaldo `[EN]` no traducidos |
| `integrity` | Detecta corrupción de marcadores de posición (placeholders) y problemas de codificación |
| `seo` | Genera etiquetas hreflang, mapas del sitio (sitemaps) y JSON-LD |
| `status` | Muestra la configuración de pares, plugins y puntuaciones de referencia (benchmark) |
| `provenance` | Audita las licencias de los recursos de traducción |
| `plugin` | Instala, elimina y enumera los plugins de métodos |

Tres de estos (`lint`, `sync`, `audit`) forman un pipeline de CI que detecta cadenas hardcoded, las traduce y hace fallar la compilación (build) si alguna configuración regional está incompleta.

---

## La Arena

La [Tabla de clasificación de métodos](/leaderboard) es el marcador. Cada envío tiene una huella digital vinculada a un commit de Git, está versionado para un conjunto de datos específico y es calificado por el mismo entorno de evaluación. Cualquiera puede enviar una propuesta.

**¿Qué puede demostrar?** El entorno de evaluación acepta JSON. Los plugins aceptan JSON. Cualquier método que produzca JSON puede ser probado:

| Enfoque | Ejemplo |
|----------|---------|
| **LLM guiado** | Inyectar reglas gramaticales y diccionarios en el prompt de un modelo de frontera |
| **Modelo ajustado (Fine-tuned)** | Entrenar un modelo abierto con texto paralelo, pero no con los datos de evaluación |
| **Pipeline controlado por FST** | El LLM genera → el transductor de estado finito (FST) valida la morfología → reintenta |
| **Modelos encadenados** | El Modelo A redacta → el Modelo B posedita → el Modelo C califica |
| **Diccionario + LLM** | Forzar términos conocidos de un diccionario, dejar que el LLM maneje el resto |
| **Evolutivo** | Generar candidatos, calificarlos, mutar los mejores, repetir |
| **Traducción parcial** | Traducir una muestra a mano, demostrar que su LLM coincide, traducir automáticamente el resto |

Ajuste modelos (fine-tune). Despliegue algoritmos evolutivos. Pruebe las respuestas de estudiantes en exámenes de idiomas. Construya tablas de búsqueda (lookup tables). Encadene tres modelos. Siempre que su método produzca JSON, el entorno de evaluación lo calificará y el framework lo ejecutará.

:::danger La única regla
**No entrene con los datos de evaluación.** Los métodos expuestos al conjunto de datos de referencia (benchmark) serán descalificados. Ajuste (fine-tune) con lo que desee. Simplemente no lo haga con el conjunto de pruebas.
:::

Esta es una invitación abierta. Si trabaja con un idioma de bajos recursos (ya sea como investigador, miembro de la comunidad, estudiante o simplemente alguien a quien le importa), construya un método, ejecute el entorno de evaluación y reclame la puntuación más alta. El problema no está resuelto. La infraestructura está aquí.

**[→ Ver la tabla de clasificación](/leaderboard)**

---

## Próximos pasos

**Para empezar:**
- [Instalación](/docs/getting-started/installation) — Configure en 2 minutos
- [Inicio rápido](/docs/getting-started/quick-start) — Ejecute su primera sincronización
- [Idiomas compatibles](/docs/reference/supported-languages) — Lo que está disponible listo para usar

**Personalización de su configuración:**
- [Métodos de traducción](/docs/guides/translation-methods) — Elija el método correcto por par de idiomas
- [Configuración](/docs/getting-started/configuration) — Referencia de configuración completa
- [Sitio multilingüe en Hugo](/docs/tutorials/hugo-multilingual-site) — Traducción de contenido Markdown

**Para profundizar:**
- [Soberanía de datos](https://mtevalarena.org/docs/sovereignty/data-sovereignty) — Principios OCAP, CARE y de Soberanía de Datos Maorí
- [Apoyar un idioma de bajos recursos](https://mtevalarena.org/docs/community/low-resource-languages) — El desafío que lo inició todo
- [Recetario: Pipeline controlado por FST](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — Construya un pipeline de descomposición
- [Evaluación de MT](https://mtevalarena.org/docs/leaderboard/rules) — Cómo funcionan el entorno de evaluación y la tabla de clasificación
- [Tabla de clasificación de métodos](/leaderboard) — Puntuaciones en vivo y envíos