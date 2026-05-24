---
sidebar_position: 5
title: "Apoyar un idioma de bajos recursos"
---
# Apoyo a un idioma de bajos recursos

:::info Estado: En desarrollo activo
El soporte para el cree de las llanuras (nêhiyawêwin) se encuentra actualmente en desarrollo. Las herramientas, el entorno de evaluación y la tabla de clasificación descritos aquí son reales y utilizables hoy en día, pero el pipeline de traducción del cree aún no se ha lanzado. Cuando se lance, esto servirá como modelo para otros idiomas polisintéticos y de bajos recursos con infraestructura FST.
:::

## El problema sin resolver

Google Translate soporta aproximadamente 130 idiomas. Se hablan más de 7,000 en la Tierra. Para miles de idiomas —incluyendo muchos idiomas indígenas con comunidades activas de hablantes— no existe una API de traducción comercial, no se ha reunido un corpus paralelo grande y ningún modelo preentrenado produce resultados confiables.

Esta no es una brecha que se cerrará por sí sola. Los idiomas de bajos recursos son de bajos recursos *porque* la economía de la traducción automática (MT) comercial no los alcanza. Los hablantes que más necesitan estas herramientas son las mismas comunidades que tienen menos probabilidades de que se las construyan.

**rosetta fue construida para cambiar eso.**

La [Tabla de clasificación de métodos](/leaderboard) es un desafío abierto: construya el mejor método de traducción para un idioma desatendido, compruébelo con una evaluación reproducible y reclame la puntuación más alta. Cualquier persona en el mundo puede contribuir: lingüistas, investigadores de ML, trabajadores comunitarios de idiomas, estudiantes, aficionados. El problema está sin resolver. La infraestructura está aquí. La tabla de clasificación lo está esperando.

---

## Por qué esto es difícil: Morfología polisintética

La mayoría de los sistemas comerciales de MT fueron diseñados para idiomas como el inglés, el francés y el chino, idiomas donde las palabras son relativamente cortas y las oraciones se construyen a partir de tokens discretos. Pero muchos idiomas indígenas, incluido el cree de las llanuras, son **polisintéticos**: una sola palabra puede codificar lo que el inglés expresa como una oración completa.

### El ejemplo del cree

Considere la palabra en cree de las llanuras:

> **ê-kî-nitawi-kîskinwahamâkosiyân**
> *"cuando fui a la escuela"*

Esa es **una sola palabra**. Codifica el tiempo (pasado), la dirección (ir a), la raíz (aprender), la voz (pasiva/reflexiva) y la persona (primera del singular). Un LLM entrenado predominantemente en inglés no tiene intuición para este tipo de densidad morfológica.

Los desafíos se multiplican:

| Desafío | Qué significa |
|-----------|--------------|
| **Complejidad morfológica** | Una sola raíz verbal puede generar miles de formas flexionadas válidas mediante prefijación, sufijación y circunfijación |
| **Distinción animado/inanimado** | Los sustantivos son gramaticalmente animados o inanimados; esto afecta la conjugación de los verbos, los demostrativos y la pluralización. La clasificación no siempre sigue la animacidad biológica (*askiy* "tierra" es animado; *maskisin* "zapato" también es animado) |
| **Obviación** | Las referencias en tercera persona se clasifican por proximidad/relevancia. La distinción entre "próximo" y "obviativo" no tiene equivalente en inglés |
| **Datos de entrenamiento escasos** | Los LLM han visto muy poco texto en cree de las llanuras. Lo que han visto puede mezclar dialectos (dialecto Y, dialecto TH) u ortografías (SRO vs. silábica) |
| **Sin línea base comercial** | Google Translate no devuelve nada útil. No hay una API lista para usar con la cual comparar |

Es por esto que la traducción de idiomas polisintéticos sigue siendo un **problema de investigación abierto**, y por lo que es importante contar con una tabla de clasificación puntuada y reproducible.

---

## Antecedentes: Cómo se ha abordado esto

### El FST de ALTLab

El recurso computacional más significativo para el cree de las llanuras es el **transductor de estados finitos (FST)** desarrollado por el [Alberta Language Technology Lab (ALTLab)](https://altlab.artsrn.ualberta.ca/) en la Universidad de Alberta, en colaboración con [Giellatekno](https://giellatekno.uit.no/) en la UiT Universidad Ártica de Noruega.

El FST de ALTLab es un **analizador y generador morfológico**: dada una palabra flexionada en cree, puede descomponerla en su raíz y etiquetas gramaticales, y dada una raíz más etiquetas, puede generar la forma flexionada correcta. Esto es determinista: sin redes neuronales, sin alucinaciones, sin probabilidad. Si el FST acepta una palabra, esa palabra es morfológicamente válida.

Es por esto que la tabla de clasificación de rosetta rastrea la **Tasa de aceptación del FST** (FST Acceptance Rate) como una métrica. Un método de traducción que produce palabras que el FST rechaza está produciendo un cree morfológicamente inválido, independientemente de lo que diga la puntuación chrF++.

**Recursos clave de ALTLab:**
- [itwêwina](https://itwewina.altlab.app/): un diccionario inteligente cree de las llanuras–inglés impulsado por el FST
- [Morphodict](https://github.com/UAlbertaALTLab/morphodict): plataforma de diccionario de código abierto con reconocimiento morfológico
- [crk-db](https://github.com/UAlbertaALTLab/crk-db): base de datos léxica del cree de las llanuras
- [21st Century Tools for Indigenous Languages](https://21c.tools/): el contexto más amplio del proyecto

### Registros morfológicos y FST globales

El cree de las llanuras no es el único idioma con infraestructura FST de alta calidad. Si usted desea desarrollar pipelines de traducción para otros idiomas de bajos recursos o morfológicamente complejos, puede aprovechar estos centros globales establecidos:

* **[GiellaLT / Giellatekno](https://giellalt.github.io/) (UiT Universidad Ártica de Noruega):** El mayor repositorio de analizadores y generadores morfológicos FST de código abierto, que cubre más de 100 idiomas. Las áreas de enfoque incluyen los idiomas sami (`sme`, `smj`, `sma`, etc.), idiomas urálicos (komi, erzya, udmurto, etc.) y otros idiomas minoritarios/indígenas. Alojan corpus de texto procesado públicos (`corpus-xxx`) en su [Organización de GitHub](https://github.com/giellalt/).
* **[The Apertium Project](https://www.apertium.org/):** Una plataforma de traducción automática basada en reglas de código abierto. Apertium mantiene analizadores morfológicos FST altamente optimizados (usando `lttoolbox` y `hfst`) y diccionarios bilingües para docenas de idiomas, incluyendo un gran conjunto de idiomas túrquicos (kazajo, tártaro, kirguís, etc.) e idiomas europeos minoritarios. Todos los recursos son públicos en el [GitHub de Apertium](https://github.com/apertium).
* **[UniMorph (Universal Morphology)](https://unimorph.github.io/):** Un proyecto colaborativo que proporciona paradigmas morfológicos estandarizados para más de 150 idiomas. El conjunto de datos está alojado en Hugging Face en [unimorph/universal_morphologies](https://huggingface.co/datasets/unimorph/universal_morphologies). Si un binario FST compilado no está disponible para un idioma, las tablas de UniMorph se pueden usar como una puerta de búsqueda de base de datos estática.
* **[National Research Council Canada (NRC)](https://nrc-digital-repository.canada.ca/):** Ofrece herramientas para idiomas indígenas canadienses, incluido el analizador morfológico FST de inuktitut **Uqailaut** y el masivo **Nunavut Hansard Parallel Corpus** (1.3 millones de pares de oraciones alineadas en inglés-inuktitut).

### El corpus de EdTeKLA

El [grupo de investigación EdTeKLA](https://spaces.facsci.ualberta.ca/edtekla/) (también en la UAlberta) ha reunido un corpus del idioma cree de las llanuras a partir de materiales educativos, transcripciones de audio y fuentes comunitarias. El conjunto de datos de evaluación de rosetta [EDTeKLA Dev v1](/docs/eval/datasets) se deriva de este trabajo, bajo licencia [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).

### Otros enfoques que la gente ha intentado o podría intentar

La tabla de clasificación es agnóstica al método. Aquí hay estrategias que se han explorado o propuesto para la MT de bajos recursos, cualquiera de las cuales podría enviarse:

| Enfoque | Cómo funciona | Pros | Contras |
|----------|-------------|------|------|
| **Prompting de LLM asistido** | Inyectar reglas gramaticales, diccionarios y pares de ejemplos en el prompt del sistema | Rápido para iterar, no requiere entrenamiento | Límite de calidad restringido por el conocimiento base del LLM |
| **Prompting few-shot** | Incluir traducciones verificadas como ejemplos en contexto | Bueno para un estilo consistente | Ventana de contexto pequeña; los ejemplos NO deben provenir de los datos de evaluación |
| **Pipeline con validación FST** | El LLM genera → el FST valida → rechaza y reintenta la morfología inválida | Garantiza la validez morfológica | Requiere infraestructura FST; los bucles de reintento añaden latencia y costo |
| **Búsqueda en diccionario + LLM** | Forzar términos conocidos de un diccionario bilingüe, dejar que el LLM maneje el resto | Reduce la alucinación para términos conocidos | La cobertura del diccionario siempre es incompleta |
| **Modelo fine-tuned (ajustado)** | Ajustar (fine-tune) un modelo abierto (Llama, Mistral) en texto paralelo, pero no en los datos de evaluación | Potencialmente la mejor calidad | Requiere un corpus paralelo (escaso); costoso; riesgo de sobreajuste (overfitting) |
| **Modelos encadenados** | El Modelo A genera una traducción preliminar → el Modelo B posedita → el Modelo C puntúa | Puede combinar las fortalezas de los especialistas | Complejo; lento; costoso |
| **Híbrido basado en reglas + LLM** | Usar reglas lingüísticas para patrones conocidos, el LLM para todo lo demás | Preciso donde se aplican las reglas | Requiere profunda experiencia lingüística |
| **Aumento por retrotraducción (back-translation)** | Generar datos paralelos sintéticos traduciendo de cree a inglés, y luego entrenar a la inversa | Expande los datos de entrenamiento de forma económica | Amplifica los errores existentes del modelo |
| **Enfoque evolutivo** | Generar traducciones candidatas, puntuarlas, mutar las de mejor rendimiento, repetir | Puede descubrir soluciones novedosas; paralelizable | Computacionalmente costoso; necesita una buena función de aptitud (fitness) |
| **Traducción parcial** | Traducir manualmente una muestra representativa, demostrar que su método coincide con su estilo en ella, luego autotraducir el resto | Combina la calidad humana con la escala de la máquina | Requiere esfuerzo humano inicial |
| **JSON manual / calificación de exámenes** | Crear a mano un archivo JSON de conjunto de datos para probar las respuestas de los estudiantes en un examen de idiomas, o calificar un lote de traducciones humanas frente a un estándar de oro | No requiere ML; funciona para educación y control de calidad (QA) | No escala para necesidades de traducción continuas |

### Es solo JSON

El entorno de evaluación (harness) recibe JSON y devuelve puntuaciones en JSON. El [formato del conjunto de datos](/docs/eval/datasets) es simple:

```json
{
  "entries": [
    { "index": 0, "source_text": "Hello", "target_expected": "tânisi" },
    { "index": 1, "source_text": "Thank you", "target_expected": "kinanâskomitin" }
  ]
}
```

Usted puede construir esto a mano. Puede exportarlo desde una hoja de cálculo. Puede generarlo a partir de un corpus. Un profesor de idiomas podría usarlo para calificar las traducciones de los estudiantes. Una agencia de traducción podría usarlo para evaluar a los trabajadores independientes (freelancers). Un laboratorio de investigación podría usarlo para comparar arquitecturas de modelos. Al entorno de evaluación no le importa de dónde provino el JSON, simplemente lo puntúa.

Y debido a que el framework de despliegue en producción toma la misma interfaz de plugin, un método que obtiene una buena puntuación en el entorno de evaluación se despliega en su sitio web con un solo cambio de configuración. **Compruébelo y úselo.**

Las posibilidades son genuinamente infinitas. **Si usted tiene una idea, constrúyala, ejecute el entorno de evaluación y envíe sus puntuaciones.**

---

## Cómo encaja rosetta

rosetta proporciona la capa de infraestructura; usted aporta el método.

### El sistema de asistencia (coaching)

El método `llm-coached` de rosetta le permite inyectar conocimiento lingüístico directamente en el prompt del LLM:

```json title=".rosetta/coaching/crk.json"
{
  "grammar_rules": [
    "Plains Cree is polysynthetic — a single word can express what English needs a full sentence for",
    "Animate/inanimate noun distinction affects verb conjugation, demonstratives, and pluralization",
    "Use SRO (Standard Roman Orthography) as the working script — syllabic conversion is handled by the deterministic converter",
    "Obviation: when two third-person referents appear, the less salient one takes obviative marking (-a suffix on nouns, -iyiwa on verbs)"
  ],
  "dictionary": {
    "home": "kīwēwin",
    "settings": "isi-nākatohkēwin",
    "search": "nānātawāpahtam",
    "welcome": "tānisi",
    "dashboard": "kīskinwahamākēwin-māsinahikan"
  },
  "style_notes": "Use formal register appropriate for educational and community contexts. Preserve English technical terms in parentheses when no Cree equivalent exists or is widely accepted."
}
```

Los datos de asistencia se inyectan en cada prompt del LLM para el par `en:crk`, dándole al modelo un contexto lingüístico estructurado que de otro modo no tendría. Consulte [Datos de asistencia](/docs/concepts/coaching-data) para ver la especificación completa.

### Registros

El registro es parte del prompt del sistema que dirige el tono, la formalidad y las convenciones ortográficas. rosetta incluye un registro para el cree de las llanuras:

```
nêhiyawêwin (Plains Cree). Use SRO (Standard Roman Orthography) as the working
script. Output will be converted to Syllabics via deterministic converter.
Professional register appropriate for educational and community contexts.
```

Usted puede anular esto en su configuración para experimentar con diferentes estrategias de prompting:

```json title="i18n-rosetta.config.json"
{
  "languages": {
    "crk": {
      "register": "Casual Plains Cree (Y-dialect). Use SRO. Prefer everyday vocabulary over formal or archaic terms. Address the reader directly."
    }
  }
}
```

Diferentes registros producen diferentes estilos de traducción, y diferentes puntuaciones en la tabla de clasificación. Cada envío registra el registro exacto y el prompt del sistema utilizado (como un hash SHA-256 en la [tarjeta de ejecución](/docs/eval/run-card)), por lo que los experimentos son reproducibles.

### Conversión de escritura

El cree de las llanuras se escribe en dos sistemas de escritura: **Ortografía Romana Estándar (SRO)** y **Silábica Aborigen Canadiense**. El pipeline de rosetta:

1. El LLM traduce al SRO (basado en latín, que los LLM manejan mejor)
2. La puerta de calidad (quality gate) valida la salida en SRO
3. Un convertidor determinista transforma de SRO → Silábica
4. El texto convertido se escribe en el disco

El convertidor maneja todos los diacríticos del SRO (ê, î, ô, â para vocales largas) y los mapea a los caracteres silábicos correctos. Consulte [Convertidores de escritura](/docs/concepts/script-converters) para obtener detalles técnicos.

### El bucle de evaluación

El [entorno de evaluación](/docs/eval/harness) ejecuta su método frente al conjunto de datos de evaluación y produce una [tarjeta de ejecución](/docs/eval/run-card) puntuada:

```bash
# Clone the harness
git clone https://github.com/gamedaysuits/gds-mt-eval-harness.git
cd gds-mt-eval-harness
pip install -e .

# Run a baseline experiment
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --model google/gemini-2.5-pro \
  --condition coached-v7

# Run with FST validation (if you have an FST binary)
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --fst-analyzer ./bin/crk-analyzer \
  --condition fst-gated-v1
```

La bandera `--condition` es una etiqueta que usted elige. Aparece en la tabla de clasificación para que las personas puedan ver qué estrategia de prompt utilizó. El entorno de evaluación registra el prompt del sistema completo en la tarjeta de ejecución, por lo que su enfoque exacto es reproducible.

:::tip Experimente libremente, envíe lo mejor
El entorno de evaluación está diseñado para una iteración rápida. Ejecute docenas de experimentos con diferentes modelos, datos de asistencia, registros y condiciones. Solo envíe a la tabla de clasificación cuando tenga algo de lo que se sienta orgulloso.
:::

---

## Principios OCAP

rosetta está diseñada para apoyar la soberanía de los datos indígenas. Los [principios OCAP](https://fnigc.ca/ocap-training/) (Propiedad, Control, Acceso, Posesión) guían cómo abordamos la tecnología lingüística para las comunidades indígenas:

| Principio | Cómo lo apoya rosetta |
|-----------|------------------------|
| **Propiedad (Ownership)** | Las comunidades lingüísticas son dueñas de sus datos lingüísticos. rosetta nunca se comunica con el exterior ni transmite datos a nuestros servidores |
| **Control** | El [método de API](/docs/guides/serving-a-method) permite a las comunidades alojar su propio pipeline de traducción; nosotros proporcionamos la interfaz, ellos controlan la implementación |
| **Acceso (Access)** | Las comunidades deciden quién puede usar su método. La API puede estar restringida tras una autenticación |
| **Posesión (Possession)** | Todos los datos de traducción permanecen en el sistema de archivos de su proyecto. El [sistema de procedencia](/docs/concepts/security) rastrea de dónde provino cada traducción |

La arquitectura de plugins significa que una comunidad puede construir un método que incorpore conocimiento sagrado o restringido internamente, exponer solo la API de traducción y mantener un control total sobre sus recursos lingüísticos.

---

## La visión: Qué sigue

El cree de las llanuras es el primer objetivo. Una vez que el pipeline esté validado y la comunidad esté satisfecha con la calidad, la misma arquitectura se extenderá a otros idiomas polisintéticos con infraestructura FST:

- **Otros idiomas algonquinos**: cree de los bosques, cree de los pantanos, ojibwe, pies negros
- **Idiomas inuit**: inuktitut, inuinnaqtun (que también usan escrituras silábicas)
- **Otras familias de idiomas**: cualquier idioma con un analizador FST puede usar el pipeline con validación FST

La tabla de clasificación tiene un alcance por par de idiomas. A medida que las comunidades lingüísticas aportan nuevos conjuntos de datos de evaluación, se abren automáticamente nuevas pistas en la tabla de clasificación.

**Esta es una invitación abierta.** Si usted trabaja con un idioma de bajos recursos —como investigador, miembro de la comunidad, estudiante o simplemente alguien a quien le importa— rosetta le brinda las herramientas para construir algo real, medirlo honestamente y compartirlo con el mundo. La [Tabla de clasificación de métodos](/leaderboard) está esperando su envío.

---

## Consulte también

- **[Tabla de clasificación de métodos](/leaderboard)**: envíe sus puntuaciones y vea cómo se comparan los métodos
- **[Evaluación de MT](/docs/eval/)**: qué hace que un método sea bueno, qué se descalifica
- **[Entorno de evaluación](/docs/eval/harness)**: cómo ejecutar experimentos
- **[Conjuntos de datos de evaluación](/docs/eval/datasets)**: EDTeKLA Dev v1 y FLORES+
- **[Datos de asistencia](/docs/concepts/coaching-data)**: cómo estructurar el conocimiento lingüístico para el LLM
- **[Convertidores de escritura](/docs/concepts/script-converters)**: el pipeline de SRO→Silábica
- **[Servir un método a través de API](/docs/guides/serving-a-method)**: alojamiento de traducción controlada por la comunidad
- **[ALTLab](https://altlab.artsrn.ualberta.ca/)**: el Alberta Language Technology Lab
- **[EdTeKLA](https://spaces.facsci.ualberta.ca/edtekla/)**: el grupo de investigación Educational Technology, Knowledge & Language
- **[Diccionario itwêwina](https://itwewina.altlab.app/)**: diccionario cree de las llanuras–inglés impulsado por FST