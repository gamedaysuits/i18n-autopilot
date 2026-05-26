---
sidebar_position: 6
title: "Convertidores de scripts"
---
# Script Converters

Los Script Converters son *hooks* de post-traducción deterministas y sin LLM que convierten texto de un sistema de escritura a otro. Permiten un flujo de trabajo de "traducir una vez, renderizar en múltiples escrituras": usted traduce a una escritura de trabajo (generalmente latina) y luego se convierte automáticamente a la escritura de visualización.

## ¿Por qué usar Script Converters?

Algunos idiomas utilizan múltiples sistemas de escritura para el mismo idioma hablado:

- **Plains Cree**: SRO (latino) para edición → Silábico (ᓀᐦᐃᔭᐍᐏᐣ) para visualización
- **Serbio**: Latino para uso internacional → Cirílico para uso nacional
- **Klingon**: Romanización para escritura → pIqaD (  ) para visualización

Traducir directamente a escrituras no latinas crea problemas: los LLM alucinan caracteres, los archivos JSON se vuelven difíciles de controlar en versiones y las herramientas de *diff* no pueden comparar los cambios. Los Script Converters solucionan esto manteniendo las traducciones en una escritura compatible con el control de versiones y convirtiéndolas de forma determinista en el momento de la sincronización.

## Convertidores disponibles

Rosetta incluye cinco Script Converters integrados:

| Locale | De | A | Tipo | ¿Requiere fuente? |
|--------|------|----|------|----------------|
| `crk` | SRO (Standard Roman Orthography) | Silábico Cree | Determinista | No — Unicode nativo |
| `sr` | Latino | Cirílico | Determinista | No — Unicode nativo |
| `tlh` | Romanización | pIqaD | Determinista | Sí — PUA U+F8D0–F8FF |
| `x-elvish-s` | Latino | Tengwar (Modo de Beleriand) | Determinista | Sí — PUA U+E000–E07F |
| `x-kryptonian` | Latino | Kryptonian | Cifrado basado en fuente | Sí — PUA U+E100–E119 |

### Determinista vs. Basado en fuentes

- **Convertidores deterministas** (Cree, Serbio, Klingon, Tengwar) realizan un mapeo real de carácter a carácter utilizando reglas lingüísticas. La salida contiene caracteres Unicode reales.
- **Convertidores basados en fuentes** (Kryptonian) son cifrados de sustitución 1:1 donde la salida son caracteres Unicode PUA que solo se renderizan correctamente si se carga una fuente específica.

## Cómo funcionan

Los Script Converters se ejecutan **después** de la traducción como un paso de posprocesamiento. El *pipeline* es:

```
Source (English) → LLM Translation → Working Script → Script Converter → Display Script
```

Por ejemplo, Plains Cree:
```
"Welcome" → LLM → "tānisi" (SRO) → Converter → "ᑖᓂᓯ" (Syllabics)
```

### Coincidencia codiciosa de izquierda a derecha

Todos los convertidores utilizan el mismo algoritmo: en cada posición de carácter, intentan primero la coincidencia más larga posible, y luego coincidencias progresivamente más cortas. Los caracteres que no coinciden con ningún patrón (espacios, puntuación, números) pasan sin cambios.

Esto maneja los dígrafos y trígrafos correctamente:
- Klingon: `tlh` → un solo carácter pIqaD (no `t` + `l` + `h`)
- Serbio: `nj` → `њ` (no `н` + `ј`)
- Cree: `twê` → un solo silábico (no `t` + `w` + `ê`)

## Uso de los Script Converters

Los Script Converters se activan automáticamente cuando el código de *locale* coincide con un convertidor registrado. No se necesita configuración; simplemente configure su *locale* de destino:

```json title="i18n-rosetta.config.json"
{
  "pairs": {
    "en:crk": {
      "method": "llm-coached",
      "model": "google/gemini-2.5-pro"
    }
  }
}
```

Cuando rosetta sincroniza el par `en:crk`, las traducciones se producen primero en SRO y luego se convierten automáticamente a silábico antes de escribirse en `crk.json`.

### Comprobación del estado del convertidor

```bash
npx i18n-rosetta status
```

La salida de estado muestra qué pares tienen Script Converters activos y qué conversión realizan.

## Requisitos de fuentes web

Tres convertidores generan caracteres del Área de Uso Privado (PUA) de Unicode que requieren fuentes web personalizadas:

### Klingon (pIqaD)

Instale una fuente pIqaD compatible con CSUR (por ejemplo, "pIqaD qolqoS" o "Klingon pIqaD HaSta"):

```css
@font-face {
  font-family: 'pIqaD';
  src: url('/fonts/pIqaD.woff2') format('woff2');
  unicode-range: U+F8D0-F8FF;
}

:lang(tlh) {
  font-family: 'pIqaD', sans-serif;
}
```

### Tengwar (Sindarin)

Instale una fuente Tengwar compatible con CSUR (por ejemplo, "Tengwar Formal CSUR", "Tengwar Annatar"):

```css
@font-face {
  font-family: 'Tengwar';
  src: url('/fonts/tengwar-formal-csur.woff2') format('woff2');
  unicode-range: U+E000-E07F;
}

:lang(x-elvish-s) {
  font-family: 'Tengwar', serif;
}
```

### Kryptonian

Instale una fuente Kryptonian mapeada a los puntos de código PUA U+E100–E119:

```css
@font-face {
  font-family: 'Kryptonian';
  src: url('/fonts/kryptonian.woff2') format('woff2');
  unicode-range: U+E100-E119;
}

:lang(x-kryptonian) {
  font-family: 'Kryptonian', sans-serif;
}
```

:::tip Enfoque alternativo para Kryptonian
Dado que Kryptonian es un cifrado puro de la A a la Z, usted puede omitir el Script Converter por completo y aplicar la fuente al texto latino mediante CSS. Esto suele ser más sencillo para implementaciones web: simplemente sirva la fuente Kryptonian y configure `font-family` en los elementos relevantes.
:::

## Agregar un convertidor personalizado

Para agregar un convertidor para un nuevo idioma, edite `lib/scripts.js`:

1. **Cree el mapa de conversión**: un arreglo ordenado de pares `[from, to]`, con las secuencias más largas primero.
2. **Cree la función del convertidor**: un escáner codicioso de izquierda a derecha (use `sroToSyllabics` como plantilla).
3. **Regístrelo** en el objeto `SCRIPT_CONVERTERS` con el código de *locale* como clave.
4. **Agregue el campo `script`** a la entrada de registro del idioma en `registers.js`.

```javascript
// Example: adding a converter for Cherokee (chr)
const LATIN_TO_CHEROKEE_MAP = [
  ['ga', 'Ꭶ'], ['ka', 'Ꭷ'], ['ge', 'Ꭸ'], // ...
];

function latinToCherokee(text) {
  // Same greedy left-to-right pattern as other converters
}

SCRIPT_CONVERTERS['chr'] = {
  from: 'Latin',
  to: 'Cherokee Syllabary',
  type: 'deterministic',
  converter: latinToCherokee,
};
```

---

## Consulte también

- [Conlangs, escrituras y ortografía](/docs/guides/conlangs-scripts-orthography) — Fuentes PUA, Unicode, agregar nuevos convertidores
- [Quality Gate](/docs/concepts/quality-gate) — Validación que se ejecuta antes de la conversión de escritura
- [Idiomas compatibles](/docs/reference/supported-languages) — Qué idiomas tienen Script Converters
- [Soporte para un idioma de bajos recursos](https://mtevalarena.org/docs/community/low-resource-languages) — SRO→Silábico en contexto
- [Libro de recetas: Pipeline con FST](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — Conversión de escritura en un *pipeline* de múltiples etapas