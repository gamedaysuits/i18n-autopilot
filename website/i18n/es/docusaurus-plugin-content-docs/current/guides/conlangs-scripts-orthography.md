---
sidebar_position: 3
title: "Lenguas construidas, sistemas de escritura y ortografía"
---
# Conlangs, sistemas de escritura y ortografía

rosetta tiene soporte de primera clase para lenguajes construidos (conlangs) a través de registros de LLM y convertidores deterministas de sistemas de escritura. Esta guía cubre cómo funciona el soporte para conlangs, qué fuentes necesita y cómo agregar los suyos propios.

:::tip Por qué son importantes los conlangs
Los conlangs no son solo una novedad: utilizan exactamente la misma infraestructura que se usa para los idiomas reales con escasa representación. El quality gate, el sistema de coaching y el flujo de conversión de sistemas de escritura funcionan de manera idéntica para el klingon y el cree de las llanuras. Si su flujo de trabajo para conlangs funciona, su flujo para idiomas de bajos recursos también lo hará.
:::

---

## Lenguajes construidos compatibles

| Idioma | Código | Convertidor de sistema de escritura | Fuente requerida |
|----------|------|:----------------:|:-------------:|
| Klingon | `tlh` | ✅ Romanización → pIqaD | Fuente PUA (ej., pIqaD qolqoS) |
| Sindarin (élfico de Tolkien) | `x-elvish-s` | ✅ Latino → Tengwar | Fuente PUA CSUR |
| Kriptoniano | `x-kryptonian` | ✅ Latino → Kriptoniano | Fuente PUA |
| Inglés pirata | `x-pirate` | ❌ solo registro | Ninguna |
| Inglés shakesperiano | `x-shakespeare` | ❌ solo registro | Ninguna |
| Habla de Yoda | `x-yoda` | ❌ solo registro | Ninguna |

Los códigos de conlangs usan el prefijo `x-` según la convención de uso privado BCP-47, excepto el klingon (`tlh`) que tiene un código [ISO 639-3](https://iso639-3.sil.org/code/tlh) asignado por SIL International.

---

## Requisitos de Unicode, PUA y fuentes

### El Área de Uso Privado (PUA)

El klingon (pIqaD), el sindarin (Tengwar) y el kriptoniano usan caracteres del **Área de Uso Privado (PUA)** de Unicode. PUA es el rango U+E000–U+F8FF; estos puntos de código **no tienen una asignación estándar**. El [ConScript Unicode Registry (CSUR)](https://www.evertype.com/standards/csur/) mantiene asignaciones acordadas por la comunidad para sistemas de escritura ficticios, pero estas no forman parte del estándar Unicode.

Lo que esto significa en la práctica:

- El texto PUA se muestra como **cajas vacías** (□□□) si no se carga la fuente correcta
- Diferentes fuentes pueden asignar diferentes glifos a los mismos puntos de código PUA
- rosetta NO incluye fuentes PUA; usted debe cargarlas por su cuenta
- Las fuentes del sistema nunca mostrarán estos caracteres

### Rangos PUA por sistema de escritura

| Sistema de escritura | Rango PUA | Referencia CSUR |
|--------|-----------|---------------|
| Klingon (pIqaD) | U+F8D0–U+F8FF | [CSUR Klingon](https://www.evertype.com/standards/csur/klingon.html) |
| Tengwar (élfico) | U+E000–U+E07F | [CSUR Tengwar](https://www.evertype.com/standards/csur/tengwar.html) |
| Kriptoniano | Varía según la fuente | Sin estándar CSUR |

### Carga de fuentes web PUA

rosetta incluye un comando integrado para descargar y administrar fuentes web PUA:

```bash
# See which fonts are needed for your configured languages
i18n-rosetta fonts list

# Download all needed fonts (auto-detects project type for output directory)
i18n-rosetta fonts install

# Also generate a CSS snippet with @font-face declarations
i18n-rosetta fonts install --css
```

El comando `fonts install` descarga desde repositorios de código abierto verificados:

| Fuente | Sistema de escritura | Licencia | Origen |
|------|--------|---------|--------|
| pIqaD qolqoS | Klingon | SIL Open Font License 1.1 | [GitHub](https://github.com/dadap/pIqaD-fonts) |
| FreeMonoTengwar | Tengwar | GNU GPL v3 (con excepción de fuente) | [SourceForge](https://sourceforge.net/projects/freetengwar/) |
| *(provisto por el usuario)* | Kriptoniano | Varía | No hay fuente PUA de código abierto disponible |

El directorio de salida se detecta automáticamente a partir de la estructura de su proyecto (Docusaurus → `static/fonts/`, Hugo → `static/fonts/`, predeterminado → `public/fonts/`). Puede anularlo con `--dir`.

Si prefiere administrar las fuentes manualmente, agregue reglas `@font-face` en su CSS:

```css
@font-face {
  font-family: 'pIqaD';
  src: url('/fonts/pIqaDqolqoS.ttf') format('truetype');
  font-display: swap;
  unicode-range: U+F8D0-F8FF;
}

/* Apply to Klingon text elements */
[lang="tlh"], [data-script="piqad"] {
  font-family: 'pIqaD', sans-serif;
}
```

:::warning El soporte de Unicode NO está garantizado
El Consorcio Unicode ha [rechazado explícitamente](https://www.unicode.org/faq/private_use.html) codificar sistemas de escritura ficticios en el estándar. Las asignaciones PUA son mantenidas por la comunidad y pueden entrar en conflicto entre las implementaciones de fuentes. Especifique siempre la fuente exacta que usa su proyecto y pruebe la visualización en diferentes navegadores.
:::

---

## Convertidores de sistemas de escritura

### Cómo funcionan

La conversión de sistemas de escritura de rosetta es un **hook posterior a la traducción**:

1. El LLM traduce el texto a un **sistema de escritura de trabajo** (generalmente latino o SRO)
2. El [quality gate](/docs/concepts/quality-gate) valida el resultado
3. El convertidor determinista transforma el texto validado al **sistema de escritura de visualización**
4. El texto convertido se escribe en el disco

Este enfoque de dos pasos funciona porque los LLM producen mejores resultados cuando trabajan con sistemas de escritura basados en el alfabeto latino. El convertidor determinista garantiza un resultado correcto del sistema de escritura sin depender del conocimiento (a menudo poco confiable) que el modelo tiene sobre el mismo.

### Los cinco convertidores

rosetta incluye cinco convertidores de sistemas de escritura integrados:

#### Cree de las llanuras: SRO → Silábico (`crk`)

De la ortografía romana estándar (SRO) a los silabarios aborígenes canadienses.

```
Input:  "tawâw"
Output: "ᑕᐚᐤ"
```

Las vocales largas usan macrón/circunflejo: ê, î, ô, â. El convertidor maneja todos los diacríticos SRO y los asigna a los caracteres silábicos correctos. Consulte [Apoyar un idioma de bajos recursos](https://mtevalarena.org/docs/community/low-resource-languages) para ver el flujo completo del cree.

#### Serbio: Latino → Cirílico (`sr`)

Conversión determinista de latino a cirílico para el serbio.

```
Input:  "zdravo"
Output: "здраво"
```

Esto maneja la asignación completa del alfabeto serbio, incluidos los dígrafos (lj → љ, nj → њ, dž → џ).

#### Klingon: Romanización → pIqaD (`tlh`)

Sistema de romanización de Marc Okrand a caracteres PUA pIqaD.

```
Input:  "Qapla'"    (romanized Klingon)
Output: [pIqaD PUA] (requires pIqaD font to render)
```

#### Sindarin: Latino → Tengwar (`x-elvish-s`)

Asignación Tengwar del modo sindarin de Tolkien.

```
Input:  "elen síla"  (Latin Sindarin)
Output: [Tengwar PUA] (requires Tengwar font to render)
```

#### Kriptoniano: Latino → Kriptoniano (`x-kryptonian`)

Asignación del sistema de escritura kriptoniano del léxico de los fans.

```
Input:  "Kal-El"
Output: [Kryptonian PUA] (requires Kryptonian font to render)
```

### Activación de un convertidor

Configure el campo `scripts` en su configuración de idioma. Para los convertidores integrados, esto se detecta automáticamente a partir del código de idioma:

```json
{
  "languages": {
    "sr": { "scripts": "sr" },
    "crk": {}
  }
}
```

El cree de las llanuras (`crk`) se detecta automáticamente; no es necesario configurar `scripts` explícitamente.

---

## Idiomas con múltiples sistemas de escritura

Algunos idiomas reales usan múltiples sistemas de escritura activos:

| Idioma | Sistemas de escritura | Enfoque de rosetta |
|----------|---------|-----------------|
| Serbio | Latino + Cirílico | Convertidor de sistema de escritura (`sr`): traduce en latino, convierte a cirílico |
| Chino | Simplificado + Tradicional | Códigos de configuración regional separados (`zh` vs `zh-TW`) con registros distintos |

Para los idiomas donde ambos sistemas de escritura sirven a la misma audiencia (serbio), use un convertidor de sistema de escritura. Para los idiomas donde los sistemas de escritura sirven a diferentes audiencias (chino simplificado para China continental, tradicional para Taiwán/Hong Kong), use códigos de configuración regional separados.

---

## Notas de ortografía

Los registros no son solo el tono: contienen **instrucciones ortográficas** que guían al LLM hacia las convenciones de escritura correctas.

### Formas de trato formal

Los registros integrados de rosetta incluyen el trato formal culturalmente apropiado para cada idioma:

| Idioma | Forma formal | Instrucción de registro |
|----------|------------|---------------------|
| Alemán | Sie | `Use Sie-form for formal address` |
| Francés | vous | `Use vous-form` |
| Ruso | вы | `Professional register with вы-form` |
| Turco | siz | `Professional register with siz-form` |
| Coreano | 합쇼체 | `Formal Korean (합쇼체)` |
| Japonés | です/ます | `Polite professional register (です/ます form)` |
| Polaco | Pan/Pani | `Professional register with Pan/Pani form` |

### Escritura inclusiva en cuanto al género

Cada tarjeta de idioma tiene un campo `gender.inclusiveGuidance` con consejos específicos del idioma. Esto se inyecta en el prompt de traducción del LLM por separado del ajuste preestablecido del registro, por lo que se aplica de manera consistente independientemente del ajuste preestablecido de formalidad que elija el usuario:

- **Francés**: Écriture inclusive con notación de punto medio (ej., "Connecté·e")
- **Alemán**: Notación Doppelpunkt (ej., "Benutzer:innen")
- **Español**: Se prefiere la reestructuración neutral en cuanto al género; notación de barra (ej., "usuario/a") como alternativa

Para los idiomas sin orientación específica en su tarjeta (ej., coreano, conlangs), el sistema recurre a una regla genérica: *"prefiera formas neutrales en cuanto al género o la opción más inclusiva disponible".*

### Requisitos de sistemas de escritura RTL

Los registros de árabe, hebreo, persa y urdu indican los requisitos de derecha a izquierda: `Ensure text reads naturally in RTL layout contexts.`

### Anulación de cualquier registro

Cada registro es un valor de configuración; anúlelo para que coincida con la voz de su proyecto:

```json
{
  "languages": {
    "fr": {
      "register": "Casual French. Use tu-form. Conversational blog tone. Gender-neutral when possible."
    },
    "de": {
      "register": "Informal German. Use du-form. Tech startup voice."
    }
  }
}
```

Consulte [Configuración](/docs/getting-started/configuration) para ver la referencia de configuración completa.

---

## Agregar un nuevo conlang

### Paso a paso

1. **Elija un código de uso privado BCP-47**: Use el prefijo `x-` (ej., `x-dothraki`, `x-valyrian`).

2. **Agréguelo a su configuración**:

```json
{
  "languages": {
    "x-dothraki": {
      "register": "Dothraki language. Use David J. Peterson's vocabulary from the Living Language Dothraki textbook. Harsh, direct tone. No articles, no verb 'to be'."
    }
  }
}
```

3. **(Opcional) Agregue un convertidor de sistema de escritura**: Si su conlang usa un sistema de escritura de visualización no latino, agregue un convertidor en `lib/scripts.js` y regístrelo en `SCRIPT_CONVERTERS`.

4. **Pruebe**: Ejecute `i18n-rosetta sync --dry` para obtener una vista previa de las traducciones sin escribir archivos.

5. **Revise el quality gate**: Es posible que el [quality gate](/docs/concepts/quality-gate) necesite ajustes para su conlang, particularmente la verificación `requireNonLatin` si su conlang usa caracteres PUA.

:::note La calidad del conlang depende del conocimiento del LLM
El LLM solo puede traducir a un conlang que haya visto en los datos de entrenamiento. Los conlangs bien documentados (klingon, sindarin, dothraki) funcionan bien. Los conlangs poco conocidos o recién inventados pueden producir resultados inconsistentes. Use [datos de coaching](/docs/concepts/coaching-data) para mejorar la calidad.
:::

---

## Consulte también

- [Idiomas compatibles](/docs/reference/supported-languages): tabla completa de idiomas con la disponibilidad de métodos
- [Convertidores de sistemas de escritura](/docs/concepts/script-converters): detalles técnicos del flujo de conversión
- [Métodos de traducción](/docs/guides/translation-methods): cómo funciona cada método de traducción
- [Configuración](/docs/getting-started/configuration): referencia de configuración que incluye la configuración de idiomas y registros
- [Apoyar un idioma de bajos recursos](https://mtevalarena.org/docs/community/low-resource-languages): la misma infraestructura aplicada a idiomas reales con escasa representación