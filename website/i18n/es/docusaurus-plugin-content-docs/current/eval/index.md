---
sidebar_position: 1
title: "Evaluación de MT"
---
# Evaluación de MT

rosetta incluye un marco de evaluación de traducción automática diseñado para la **evaluación comparativa reproducible** de métodos de traducción, especialmente para lenguas indígenas y de bajos recursos donde no existen puntos de referencia estándar de MT y las afirmaciones de calidad son difíciles de verificar.

---

## La Tabla de Clasificación

La pieza central es la **[Tabla de Clasificación de Métodos](/leaderboard)**: un marcador en vivo respaldado por Supabase donde los investigadores y miembros de la comunidad envían y comparan métodos de traducción con una evaluación reproducible y con huella digital.

Cada envío incluye:

- **Pipeline con huella digital**: vinculado a un commit de Git específico y a un hash de configuración, de modo que los resultados se remontan al código exacto que los produjo.
- **Conjunto de datos versionado**: con hash de contenido y versionado; las puntuaciones solo son comparables dentro de la misma versión del conjunto de datos.
- **Métricas estandarizadas**: todas las puntuaciones son calculadas por el entorno de evaluación compartido (harness), eliminando las diferencias de implementación.
- **Niveles de confianza**: autoevaluado (self-benchmarked), verificado por GDS (GDS Verified) o validado por la comunidad (Community Validated).
- **Seguimiento de costos**: costo de API por envío, para que las compensaciones entre costo y calidad sean transparentes.

Actualmente, la tabla de clasificación rastrea tres métricas:

| Métrica | Tipo | Qué mide |
|--------|------|------------------|
| **chrF++** | F-score de n-gramas de caracteres | Métrica de calidad principal: se correlaciona bien con el juicio humano, especialmente para lenguas morfológicamente ricas. |
| **Exact Match** | Proporción de coincidencias perfectas | Precisión estricta: ¿con qué frecuencia la traducción es exactamente igual al estándar de oro (gold standard)? |
| **FST Acceptance** | Tasa de aprobación de puerta morfológica | Para métodos con verificación de transductor de estado finito: ¿qué proporción de los resultados son morfológicamente válidos? |

**[→ Ver la tabla de clasificación](/leaderboard)**

---

## Conjuntos de datos disponibles

### EDTeKLA Development Set v1

El primer conjunto de datos de evaluación, creado para la traducción del inglés al cree de las llanuras (SRO). Creado por el [grupo de investigación EdTeKLA](https://spaces.facsci.ualberta.ca/edtekla/) en la Universidad de Alberta.

| Propiedad | Valor |
|----------|-------|
| **ID** | `edtekla-dev-v1` |
| **Par de idiomas** | EN → CRK (Cree de las llanuras, ortografía SRO) |
| **Cantidad de entradas** | 124 |
| **Licencia** | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) |
| **Procedencia** | `gold_standard` (verificado por hablantes), `textbook` (materiales educativos publicados) |

### FLORES+ Devtest

Un punto de referencia multilingüe de amplia cobertura mantenido por la [Open Language Data Initiative (OLDI)](https://huggingface.co/datasets/openlanguagedata/flores_plus).

| Propiedad | Valor |
|----------|-------|
| **Pares de idiomas** | EN → 39 idiomas (todos los idiomas registrados en rosetta) |
| **Cantidad de entradas** | 1,012 oraciones por idioma |
| **Licencia** | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| **Fuente** | Originalmente Meta FLORES-200, ahora mantenido por OLDI |
| **Ubicación** | Fixtures preextraídos en `test/benchmark/fixtures/` dentro del repositorio principal de rosetta |

Consulte [Conjuntos de datos de evaluación](/docs/eval/datasets) para ver el esquema completo del conjunto de datos, los niveles de dificultad y cómo crear el suyo propio.

:::danger NO ENTRENAR con datos de evaluación

**Estos conjuntos de datos son solo para evaluación.** Los métodos entrenados, ajustados (fine-tuned), estimulados con pocos ejemplos (few-shot-prompted) o expuestos de otra manera a los datos de evaluación producirán puntuaciones infladas artificialmente y serán **descalificados de la tabla de clasificación.**

Esto no es una sugerencia: es la regla más importante de la integridad de la evaluación. Utilice corpus separados para el entrenamiento. Los conjuntos de evaluación deben permanecer invisibles para su modelo durante el desarrollo.

Si usted está utilizando datos de entrenamiento (coaching data) o ejemplos de pocos intentos (few-shot), estos deben provenir de **fuentes completamente separadas**. En caso de duda, no los incluya.
:::

:::warning No determinismo de los LLM

Los resultados de los LLM no son deterministas. Las puntuaciones representan mediciones en un momento específico bajo versiones de modelos y configuraciones de API concretas. Los proveedores de modelos pueden actualizar los pesos, las estrategias de decodificación o los filtros de seguridad en cualquier momento, lo que puede causar una variación (drift) en las puntuaciones entre ejecuciones. La tabla de clasificación registra el identificador exacto del modelo (slug) y la marca de tiempo para cada envío.
:::

---

## Qué hace que un método sea bueno

No todos los métodos son iguales. Esto es lo que separa el trabajo riguroso de las puntuaciones infladas.

### Características de un método sólido

- **Separación clara entre datos de entrenamiento y evaluación**: su método nunca ha visto el conjunto de evaluación durante el desarrollo, el ajuste, la ingeniería de prompts o la selección de ejemplos few-shot.
- **Reproducible**: alguien más puede clonar su repositorio, ejecutar el entorno de evaluación (harness) y obtener las mismas puntuaciones (dentro de los límites del no determinismo de los LLM).
- **Documentado**: su [tarjeta de método](/docs/eval/methods) describe qué hace su método, qué herramientas utiliza y cuáles son sus limitaciones.
- **Honesto sobre el alcance**: si su método solo funciona para un par de idiomas, dígalo; si se degrada en ciertos patrones morfológicos, documéntelo.
- **Consciente de la comunidad**: para las lenguas indígenas, su método respeta la soberanía de los datos. Usted ha consultado con las comunidades lingüísticas o ha utilizado únicamente datos con licencia abierta.

### Señales de alerta (lo que se descalifica)

| Señal de alerta | Por qué es un problema |
|----------|--------------------|
| Entrenar con datos de evaluación | Anula por completo el propósito de la evaluación. Las puntuaciones infladas engañan a todos. |
| Selección a conveniencia (cherry-picking) de resultados | Ejecutar 10 veces y enviar la mejor ejecución sin revelar las demás. |
| Pospocesamiento no revelado | Corregir manualmente los resultados antes de la puntuación. |
| Datos de entrenamiento contaminados | Usar ejemplos del conjunto de evaluación como prompts few-shot o entradas de diccionario. |
| Afirmar preparación comercial sin procedencia | Si su método utiliza datos CC BY-NC-SA, no está listo para uso comercial. |

### Niveles de calidad en la tabla de clasificación

La tabla de clasificación admite tres niveles de confianza:

| Nivel | Significado | Cómo obtenerlo |
|------|---------|---------------|
| **Autoevaluado (Self-benchmarked)** | Usted mismo ejecutó el entorno de evaluación y envió los resultados | Abra un PR con su tarjeta de ejecución (run card) |
| **Verificado por GDS (GDS Verified)** | Los mantenedores de rosetta reprodujeron sus resultados | Envíe su método como un plugin instalable |
| **Validado por la comunidad (Community Validated)** | Miembros independientes de la comunidad reprodujeron los resultados | Próximamente |

---

## Cómo enviar

1. **Construya su método**: consulte [Construcción de un método](/docs/eval/methods) para ver la interfaz del método.
2. **Ejecute el entorno de evaluación (harness)**: consulte [Entorno de evaluación](/docs/eval/harness) para la configuración y el uso.
3. **Genere una tarjeta de ejecución (run card)**: el entorno de evaluación produce una tarjeta de ejecución en JSON con sus puntuaciones, huella digital y metadatos.
4. **Abra un PR**: envíe su tarjeta de ejecución al [repositorio del entorno de evaluación](https://github.com/gamedaysuits/gds-mt-eval-harness).
5. **Aparezca en la tabla de clasificación**: una vez fusionado (merged), sus resultados aparecerán en la [Tabla de Clasificación de Métodos](/leaderboard).

---

## Direcciones futuras

- **Ejecuciones de comparación de modelos FLORES+**: evaluación sistemática de modelos de frontera (GPT-5.5, Claude Opus 4.7, Gemini 3.1 Pro, etc.) en los 39 idiomas de rosetta.
- **Más pares de idiomas**: quechua, inuktitut y otras lenguas de bajos recursos a medida que estén disponibles conjuntos de datos verificados por la comunidad.
- **Importación de conjuntos de datos**: herramientas para convertir conjuntos de datos de evaluación externos (WMT, Tatoeba, etc.) al formato de evaluación de rosetta.
- **Reejecuciones automatizadas**: detección de cambios en la versión del modelo y reejecución de evaluaciones comparativas para rastrear la variación de las puntuaciones.

---

## Consulte también

- **[Tabla de Clasificación de Métodos](/leaderboard)**: puntuaciones en vivo y envíos.
- **[Entorno de evaluación](/docs/eval/harness)**: cómo ejecutar evaluaciones.
- **[Conjuntos de datos de evaluación](/docs/eval/datasets)**: formato del conjunto de datos y conjuntos de datos disponibles.
- **[Construcción de un método](/docs/eval/methods)**: la especificación de la interfaz del método.
- **[Especificación de la tarjeta de ejecución](/docs/eval/run-card)**: el esquema JSON de la tarjeta de ejecución.
- **[Apoyar una lengua de bajos recursos](/docs/guides/low-resource-languages)**: el contexto más amplio de por qué existe este marco.