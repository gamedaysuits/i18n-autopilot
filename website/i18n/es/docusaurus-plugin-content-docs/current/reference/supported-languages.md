---
sidebar_position: 4
title: "Idiomas admitidos"
---
# Idiomas compatibles

rosetta incluye **Language Cards** — archivos de configuración estructurados para 50 idiomas. Cada tarjeta contiene preajustes de registro, metadatos del sistema de formalidad, indicadores de soporte de métodos, reglas de tipografía e información del sistema de escritura. Cualquier idioma que su LLM conozca puede agregarse con una sola línea de configuración; estos son los que cuentan con registros seleccionados y listos para producción.

---

## Métodos de traducción

Cada idioma puede utilizar uno o más de estos métodos de traducción:

| Icono | Método | Cómo funciona | Costo |
|------|--------|-------------|------|
| 🟢 | **Google Translate** | Base de traducción automática neuronal (Neural MT). Más de 130 idiomas. Solo cadenas de clave-valor; no puede traducir contenido Markdown de forma segura. | ~$20/1M de caracteres |
| 🔵 | **LLM (OpenRouter)** | Cualquier idioma que el modelo conozca. Prompts guiados por registro. Maneja contenido de clave-valor + Markdown. | Varía según el modelo |
| 🟣 | **LLM-Coached** | LLM + diccionarios de gramática + datos de entrenamiento (coaching) inyectados en los prompts. Ideal para idiomas morfológicamente complejos. | Varía según el modelo |
| 🟠 | **API (Plugin)** | Pipelines de traducción alojados por la comunidad y servidos a través de HTTP. [Compatible con OCAP](https://mtevalarena.org/docs/community/low-resource-languages). | Varía según el proveedor |

Establezca `GOOGLE_TRANSLATE_API_KEY` para Google Translate, o `OPENROUTER_API_KEY` para los métodos LLM. Consulte [Métodos de traducción](/docs/guides/translation-methods) para obtener todos los detalles.

---

## Idiomas prioritarios

Estas son las configuraciones regionales (locales) más solicitadas para aplicaciones web y móviles, enumeradas en el orden recomendado por rosetta, priorizando la accesibilidad.

| Bandera | Idioma | Código | Google | LLM | Coached | Escritura | Notas |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇸🇦 | Árabe | `ar` | ✅ | ✅ | ✅ | — | RTL. Árabe estándar moderno (فصحى). |
| 🇵🇭 | Filipino (Taglish) | `tl` / `fil` | ✅ | ✅ | ✅ | — | Use `fil` en las configuraciones de Docusaurus. rosetta resuelve ambos. |
| 🇫🇷 | Francés | `fr` | ✅ | ✅ | ✅ | — | Forma "Vous". Inclusivo en cuanto al género (Connecté·e). |
| 🇪🇸 | Español | `es` | ✅ | ✅ | ✅ | — | Latinoamericano neutral. |
| 🇩🇪 | Alemán | `de` | ✅ | ✅ | ✅ | — | Forma "Sie". Inclusivo en cuanto al género (Benutzer:innen). |
| 🇯🇵 | Japonés | `ja` | ✅ | ✅ | ✅ | — | です/ます para el texto del cuerpo, する para las etiquetas de la interfaz de usuario (UI). |
| 🇨🇳 | Chino (Simplificado) | `zh` | ✅ | ✅ | ✅ | — | 简体中文. |
| 🇮🇹 | Italiano | `it` | ✅ | ✅ | ✅ | — | Forma "Lei". |
| 🇧🇷 | Portugués (BR) | `pt` | ✅ | ✅ | ✅ | — | Portugués brasileño. |
| 🇰🇷 | Coreano | `ko` | ✅ | ✅ | ✅ | — | Registro formal 해요체. |

## Principales idiomas del mundo

| Bandera | Idioma | Código | Google | LLM | Coached | Escritura | Notas |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇧🇩 | Bengalí | `bn` | ✅ | ✅ | ✅ | — | Preferencia por শুদ্ধ ভাষা. |
| 🇧🇬 | Búlgaro | `bg` | ✅ | ✅ | ✅ | — | |
| 🇨🇿 | Checo | `cs` | ✅ | ✅ | ✅ | — | Vykání (forma "vy"). |
| 🇩🇰 | Danés | `da` | ✅ | ✅ | ✅ | — | |
| 🇬🇷 | Griego | `el` | ✅ | ✅ | ✅ | — | Δημοτική moderno. |
| 🇮🇷 | Persa | `fa` | ✅ | ✅ | ✅ | — | RTL. |
| 🇫🇮 | Finlandés | `fi` | ✅ | ✅ | ✅ | — | Sin género gramatical. |
| 🇮🇱 | Hebreo | `he` | ✅ | ✅ | ✅ | — | RTL. |
| 🇮🇳 | Hindi | `hi` | ✅ | ✅ | ✅ | — | शुद्ध हिन्दी. Mínimos préstamos del inglés. |
| 🇭🇺 | Húngaro | `hu` | ✅ | ✅ | ✅ | — | Forma "Ön". |
| 🇮🇩 | Indonesio | `id` | ✅ | ✅ | ✅ | — | |
| 🇲🇾 | Malayo | `ms` | ✅ | ✅ | ✅ | — | |
| 🇳🇱 | Neerlandés | `nl` | ✅ | ✅ | ✅ | — | Forma "U". |
| 🇳🇴 | Noruego | `nb` | ✅ | ✅ | ✅ | — | Bokmål. |
| 🇵🇱 | Polaco | `pl` | ✅ | ✅ | ✅ | — | Forma "Pan/Pani". |
| 🇵🇹 | Portugués (EU) | `pt-PT` | ✅ | ✅ | ✅ | — | Portugués europeo. |
| 🇷🇴 | Rumano | `ro` | ✅ | ✅ | ✅ | — | |
| 🇷🇺 | Ruso | `ru` | ✅ | ✅ | ✅ | — | Forma "Вы". |
| 🇸🇰 | Eslovaco | `sk` | ✅ | ✅ | ✅ | — | Vykanie (forma "vy"). |
| 🇷🇸 | Serbio | `sr` | ✅ | ✅ | ✅ | 🔤 Latino→Cirílico | Convertidor de escritura determinista. |
| 🇸🇪 | Sueco | `sv` | ✅ | ✅ | ✅ | — | |
| 🇰🇪 | Suajili | `sw` | ✅ | ✅ | ✅ | — | |
| 🇹🇭 | Tailandés | `th` | ✅ | ✅ | ✅ | — | Partículas de cortesía ครับ/ค่ะ. |
| 🇹🇷 | Turco | `tr` | ✅ | ✅ | ✅ | — | Forma "Siz". |
| 🇺🇦 | Ucraniano | `uk` | ✅ | ✅ | ✅ | — | Forma "Ви". |
| 🇵🇰 | Urdu | `ur` | ✅ | ✅ | ✅ | — | RTL. Forma آپ. |
| 🇻🇳 | Vietnamita | `vi` | ✅ | ✅ | ✅ | — | |
| 🇹🇼 | Chino (Tradicional) | `zh-TW` | ✅ | ✅ | ✅ | — | 繁體中文. |
| 🇬🇪 | Georgiano | `ka` | ✅ | ✅ | — | — | ქართული. Familia kartveliana. |
| 🇳🇬 | Yoruba | `yo` | ✅ | ✅ | — | — | Èdè Yorùbá. Tonal (3 tonos). |

## Variantes regionales

| Bandera | Idioma | Código | Google | LLM | Coached | Escritura | Notas |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇲🇽 | Español de México | `es-MX` | ✅ | ✅ | ✅ | — | Forma "Tú". Registro cálido. |
| 🇨🇦 | Francés de Canadá | `fr-CA` | ✅ | ✅ | ✅ | — | Modismos quebequenses. |

---

## Idiomas indígenas y de bajos recursos

Estos idiomas no son compatibles con los servicios comerciales de traducción automática (MT). rosetta proporciona las herramientas para que las comunidades lingüísticas construyan sus propios métodos bajo los [principios OCAP](https://mtevalarena.org/docs/community/low-resource-languages).

| | Idioma | Código | Google | LLM | Coached | Escritura | Estado |
|---|----------|------|:------:|:---:|:-------:|--------|--------|
| 🪶 | Cree de las llanuras | `crk` | ❌ | ✅ | ✅ | 🔤 SRO→Silábico | 🚧 En desarrollo |
| 🌄 | Quechua | `qu` | ✅ | ✅ | — | — | Runasimi. Sufijos evidenciales. |

:::info El cree de las llanuras está en desarrollo activo
El registro, la infraestructura de entrenamiento (coaching), el convertidor de escritura y el entorno de evaluación para el cree de las llanuras son completamente funcionales, pero el pipeline de traducción **aún no se ha lanzado**. Estamos trabajando con las comunidades lingüísticas bajo los [principios OCAP](https://mtevalarena.org/docs/community/low-resource-languages) para garantizar la calidad antes del lanzamiento. Consulte [Apoyar un idioma de bajos recursos](https://mtevalarena.org/docs/community/low-resource-languages) para conocer la historia completa, y cómo puede contribuir.
:::

:::tip Agregar más idiomas de bajos recursos
El sistema de plugins de métodos de rosetta está diseñado para esto. Una comunidad lingüística puede construir un método de traducción personalizado, alojarlo bajo su propio control y servirlo a través del [método API](/docs/guides/serving-a-method). La [Tabla de clasificación de métodos](/leaderboard) rastrea las puntuaciones para cualquier par de idiomas: construya un método, ejecute el entorno de evaluación y reclame la puntuación más alta.
:::

---

## Idiomas construidos

Los idiomas construidos (conlangs) son compatibles a través de registros LLM y convertidores de escritura opcionales. Utilizan la misma infraestructura que los idiomas reales: el control de calidad, el sistema de entrenamiento y el pipeline de conversión de escritura funcionan de manera idéntica.

| | Idioma | Código | Google | LLM | Escritura | Notas |
|---|----------|------|:------:|:---:|--------|-------|
| 🖖 | Klingon | `tlh` | ❌ | ✅ | 🔤 Romanización→pIqaD | Requiere fuente PUA. Vocabulario de Marc Okrand. |
| 🧝 | Sindarin (Élfico de Tolkien) | `x-elvish-s` | ❌ | ✅ | 🔤 Latino→Tengwar | Requiere fuente CSUR PUA. |
| 🏴‍☠️ | Inglés pirata | `x-pirate` | ❌ | ✅ | — | Solo registro. Metáforas náuticas. |
| 🦸 | Kriptoniano | `x-kryptonian` | ❌ | ✅ | 🔤 Latino→Kriptoniano | Requiere fuente PUA. |
| 🎭 | Inglés shakesperiano | `x-shakespeare` | ❌ | ✅ | — | Solo registro. Formas "Thee/thou", "-eth/-est". |
| 🐸 | Habla de Yoda | `x-yoda` | ❌ | ✅ | — | Solo registro. Orden de palabras OSV. |

Consulte [Idiomas construidos, escrituras y ortografía](/docs/guides/conlangs-scripts-orthography) para conocer los requisitos de fuentes PUA, las limitaciones de Unicode y cómo agregar el suyo propio.

---

## Preajustes de idioma

El asistente `init` admite nombres preestablecidos para una configuración rápida. Puede mezclar preajustes con códigos individuales.

| Preajuste | Se expande a |
|--------|-----------|
| `european` | fr, de, es, it, pt, nl |
| `asian` | ja, zh, ko |
| `global` | fr, es, de, ja, zh, ko, pt, ar |
| `nordic` | da, fi, nb, sv |

```bash
# Mix presets with individual codes
i18n-rosetta init
# → Target languages: european, ja
# → Resolves to: fr, de, es, it, pt, nl, ja
```

---

## Agregar cualquier idioma

rosetta puede traducir a **cualquier idioma que su LLM conozca**; la tabla anterior solo enumera los idiomas con preajustes de registro incorporados. Para agregar un idioma que no esté en la lista, incluya su código BCP-47 en su configuración:

```json
{
  "languages": {
    "sw": {},
    "am": {
      "register": "Formal Amharic. Professional register with Geʽez script."
    }
  }
}
```

El LLM traducirá utilizando su conocimiento de entrenamiento del idioma. Establecer un `register` le brinda control sobre el tono, la formalidad y las convenciones ortográficas. Consulte [Configuración](/docs/getting-started/configuration) para obtener más detalles.

---

## Language Cards

Cada idioma incorporado tiene una **Language Card** (tarjeta de idioma): una configuración JSON estructurada dividida en dos niveles para mejorar el rendimiento:

### Arquitectura de dos niveles

| Nivel | Directorio | Carga | Propósito |
|------|-----------|--------|--------|
| **Tiempo de ejecución (Runtime)** | `lib/data/language-cards/` | Anticipada en `import` | Motor de traducción: registros, formalidad, reglas, soporte de métodos |
| **Referencia** | `lib/data/language-reference/` | Diferida bajo demanda | Documentación para desarrolladores: desafíos lingüísticos, datos enciclopédicos, recursos de PNL |

El nivel de tiempo de ejecución se mantiene pequeño (~2 KB/tarjeta) para que al importar rosetta no se carguen megabytes de datos de documentación. El nivel de referencia está disponible a través de `getLanguageReference(code)` para las herramientas, el sitio web y el entorno de evaluación.

### Campos de la tarjeta de tiempo de ejecución

| Campo | Qué contiene |
|-------|------------------|
| **`nativeName`** | Endónimo: el nombre del idioma para sí mismo, en su propia escritura (por ejemplo, ქართული, Runasimi) |
| **Sistema de formalidad** | Distinción T-V, niveles de habla, keigo, partículas, etc. |
| **Preajustes de registro** | Preajustes de prompts de LLM con nombre, específicos para el carácter del idioma |
| **Soporte de métodos** | Qué API de traducción son compatibles con este idioma |
| **Guía de género** | Reglas de género gramatical y consejos de escritura inclusiva |
| **Escritura/dirección** | Código de escritura ISO 15924 y RTL/LTR |
| **Reglas** | Tipografía (comillas, espaciado), uso de mayúsculas, categorías de plurales |
| **Conjuntos de datos de evaluación** | Qué benchmarks cubren este idioma |
| **`glottocode`** | Identificador canónico de Glottolog para referencias cruzadas |
| **`humanReviewed`** | Indica si la tarjeta ha sido revisada por un hablante |

### Campos de la tarjeta de referencia

| Campo | Qué contiene |
|-------|------------------|
| **Desafíos lingüísticos** | Dificultades específicas de la traducción automática (por ejemplo, evidencialidad, diacríticos tonales, aglutinación) |
| **Enciclopédico** | Familia de idiomas, clasificación, número de hablantes, regiones |
| **Recursos** | Herramientas de PNL, corpus paralelos, modelos preentrenados |

### Generar la estructura de una nueva Language Card

Utilice el generador para crear la estructura de ambos niveles a partir de fuentes de datos autorizadas (IANA, CLDR, Glottolog):

```bash
# Preview what would be generated
node scripts/generate-language-card.mjs sw --dry-run

# Generate both runtime + reference cards
node scripts/generate-language-card.mjs sw
```

El generador completa automáticamente los metadatos (códigos, escritura, dirección, plurales, comillas, soporte de métodos, familia de idiomas) y marca los campos de juicio lingüístico como TODO (por hacer) para la curaduría humana.

### Uso de claves preestablecidas

En lugar de escribir el texto completo del registro, puede usar el nombre de una clave preestablecida:

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "polite"
  }
}
```

Rosetta resuelve la clave al prompt de registro completo. Ejecute `npx i18n-rosetta init` para ver los preajustes disponibles para cada idioma.

### Ejemplos de preajustes

| Idioma | Preajustes | Predeterminado |
|----------|---------|--------|
| Francés | `formal-vous`, `casual-tu` | `formal-vous` |
| Coreano | `polite-haeyo`, `formal-hapsyo`, `casual-hae` | `polite-haeyo` |
| Japonés | `polite`, `formal-keigo`, `casual` | `polite` |
| Alemán | `formal-Sie`, `casual-du` | `formal-Sie` |
| Tailandés | `neutral-professional`, `polite-male`, `polite-female` | `neutral-professional` |
| Español | `neutral-professional`, `formal-usted`, `casual-tuteo` | `neutral-professional` |

Consulte [Contribuir con una Language Card](https://github.com/gamedaysuits/i18n-rosetta) para ver la especificación completa, incluida la validación de campos y la lista de verificación para PR (Pull Requests).

---

## Consulte también

- [Configuración](/docs/getting-started/configuration): referencia de configuración completa, incluida la configuración de idiomas
- [Métodos de traducción](/docs/guides/translation-methods): cómo funciona cada método
- [Convertidores de escritura](/docs/concepts/script-converters): pipeline de conversión de escritura determinista
- [Idiomas construidos, escrituras y ortografía](/docs/guides/conlangs-scripts-orthography): fuentes PUA, Unicode, cómo agregar conlangs
- [Apoyar un idioma de bajos recursos](https://mtevalarena.org/docs/community/low-resource-languages): creación de métodos para idiomas desatendidos