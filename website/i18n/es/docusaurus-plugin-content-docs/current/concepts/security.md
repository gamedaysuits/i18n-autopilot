---
sidebar_position: 4
title: "Seguridad"
---
# Seguridad y protección

Rosetta está diseñado para ser seguro en entornos adversos — donde los datos de locale pueden provenir de fuentes no confiables, donde los nombres de archivo manipulados podrían escapar de los límites del directorio y donde la salida del LLM puede contener cualquier cosa.

## Modelo de amenazas

| Amenaza | Vector de ataque | Mitigación |
|--------|--------------|-----------|
| **Prototype pollution** | Claves JSON manipuladas (`__proto__`, `constructor`) | Rechazado durante el análisis |
| **Path traversal** | Códigos de locale como `../../etc/passwd` | Escrituras de archivos validadas en los directorios configurados |
| **Corrupción de bloques de código** | El LLM traduce dentro de los bloques de código | Protección mediante centinelas Unicode |
| **Claves alucinadas** | El LLM devuelve claves que no se enviaron | Validación de respuesta — solo se escriben las claves aceptadas |
| **Gasto descontrolado de tokens** | Bucles de reintento infinitos | Límite de presupuesto mediante `maxRetries` |

## Protección contra Prototype Pollution

Todas las claves de locale se validan contra una lista de bloqueo antes de su procesamiento:

- `__proto__`
- `constructor`
- `prototype`

Cualquier clave que coincida con estos patrones es rechazada con un error. Esto evita que los atacantes utilicen archivos de locale manipulados para modificar los prototipos de objetos de JavaScript.

## Contención de rutas

Al escribir archivos de locale, rosetta valida que la ruta de salida se mantenga dentro de los directorios configurados (`localesDir`, `contentDir`). Los códigos de locale se sanitizan — un código como `../../secrets` no puede escribir fuera del directorio esperado.

## Protección de bloques

Durante la traducción de contenido Markdown, los elementos estructurados se reemplazan con marcadores de posición centinelas Unicode antes de enviar el texto al LLM:

1. **Bloques de código** (delimitados y en línea) → centinela
2. **Shortcodes de Hugo** (`{{< >}}`, `{{% %}}`) → centinela  
3. **HTML sin procesar** → centinela
4. **Variables de interpolación** (`{{ .Count }}`) → centinela

Después de la traducción, los centinelas se reemplazan con el contenido original. El LLM nunca ve los bloques de código, los shortcodes ni el HTML — no puede corromperlos.

## Validación de respuestas

Cuando el LLM devuelve una respuesta JSON, rosetta valida que:
- Solo las claves que se enviaron en el lote aparezcan en la respuesta
- No se inyecten claves adicionales
- La respuesta se analice como un JSON válido

Las claves alucinadas se descartan silenciosamente. Esto evita que la salida del LLM inyecte traducciones inesperadas en sus archivos de locale.

## Quality Gate

Cada traducción se valida mediante cinco comprobaciones deterministas antes de escribirse en el disco. Consulte [Quality Gate](/docs/concepts/quality-gate) para obtener más detalles.

## Retroceso exponencial

Las llamadas a la API utilizan un retroceso exponencial con fluctuación (jitter) en las respuestas 429 (límite de tasa) y 5xx (error del servidor). Tres reintentos con un retraso creciente evitan sobrecargar la API durante las interrupciones.

## Tiempo de espera de la solicitud

Cada solicitud a la API tiene un tiempo de espera de 30 segundos mediante `AbortController`. Esto evita que el proceso de sincronización se cuelgue indefinidamente en una conexión muerta.

## Modo de respaldo

Cuando la API no está disponible, `--fallback` escribe marcadores de posición con el prefijo `[EN]` en lugar de traducciones reales:

```bash
npx i18n-rosetta sync --fallback
```

```json
{
  "hero.title": "[EN] Welcome to our platform"
}
```

Estos marcadores de posición se detectan automáticamente y se vuelven a traducir en la siguiente sincronización con una clave de API válida. Nunca se tratan como "traducidos" — `audit` los marcará.

## Pruebas

Las propiedades de seguridad se verifican mediante la suite de pruebas adversarias:

```bash
npm run test:redteam    # prototype pollution, path traversal, encoding attacks
```

---

## Consulte también

- [Arquitectura](/docs/concepts/architecture) — cómo se conecta el ecosistema de tres piezas
- [Referencia de la CLI — integrity](/docs/reference/cli#integrity) — comando de comprobación de integridad
- [Referencia de la CLI — provenance](/docs/reference/cli#provenance) — comando de auditoría de procedencia
- [Especificación de plugins](/docs/reference/plugin-spec) — campos de procedencia en los manifiestos de plugins
- [Quality Gate](/docs/concepts/quality-gate) — comprobaciones de seguridad a nivel de traducción