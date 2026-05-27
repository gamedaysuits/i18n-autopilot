---
sidebar_position: 3
title: "Quality Gate"
---
# Quality Gate

Cada traducción pasa por una puerta de validación determinista antes de ser escrita en el disco. El Quality Gate detecta los modos de falla comunes de la traducción automática: sin alternativas silenciosas, sin escribir basura en sus archivos de configuración regional.

## Comprobaciones de validación

| Comprobación | Qué detecta | Etiqueta de la puerta |
|-------|----------------|-----------|
| **Vacío/en blanco** | El modelo devolvió una cadena vacía o espacios en blanco | `[GATE] empty` |
| **Eco del origen** | El modelo devolvió la entrada original en inglés | `[GATE] source-echo` |
| **Bucle de alucinación** | Patrones de trigramas repetidos (por ejemplo, `"Qo' Qo' Qo'"`) | `[GATE] hallucination` |
| **Inflación de longitud** | La salida es significativamente más larga que el origen | `[GATE] length` |
| **Cumplimiento de la escritura** | Escritura incorrecta para la configuración regional de destino | `[GATE] script` |
| **Categorías de plurales de ICU** | Faltan las formas plurales requeridas para la configuración regional | `[GATE] icu-plural` |

### Vacío/En blanco

Rechaza las traducciones que son cadenas vacías, solo espacios en blanco o `null`. Esto detecta los modelos que no devuelven nada para las claves difíciles.

### Eco del origen

Detecta cuando el modelo devuelve el texto de origen en inglés en lugar de traducirlo. Es común con cadenas cortas y prompts poco especificados.

### Bucle de alucinación

Analiza los patrones de trigramas (3 caracteres) en la salida. Si algún trigrama se repite más de un número umbral de veces en relación con la longitud de la salida, la traducción es rechazada. Esto detecta salidas degeneradas como `"Qo' Qo' Qo' Qo' Qo'"`.

### Inflación de longitud

Rechaza las traducciones donde la longitud de la salida excede `maxLengthRatio × source length` (predeterminado: 4×). Esto detecta las alucinaciones del modelo que producen muros de texto para una entrada corta.

Configurable a través de `maxLengthRatio` en su configuración.

### Cumplimiento de la escritura

Para las configuraciones regionales con un campo `script` configurado (por ejemplo, `"script": "cans"` para los silabarios del cree de las llanuras), valida que la salida contenga caracteres no ASCII apropiados para la escritura de destino. Se rechaza la salida únicamente en alfabeto latino para una configuración regional en árabe, CJK o silabarios.

## Qué sucede en caso de falla

1. La traducción fallida se registra en stderr con un prefijo `[GATE]`, el nombre de la clave, el motivo y una vista previa del valor
2. La clave **no** se escribe en el archivo de configuración regional
3. Se activa la cascada de reintentos (consulte a continuación)

```
[GATE] hero.title: source-echo — "Welcome to our platform"
[GATE] nav.about: hallucination — "À À À À À À À À"
```

## Cascada de reintentos

Cuando un lote falla (error de análisis de JSON o rechazos del Quality Gate), rosetta vuelve a intentarlo con lotes progresivamente más pequeños:

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the 2 problem keys
```

El presupuesto de reintentos está limitado por `maxRetries` (predeterminado: 3, configurable por idioma). Esto evita el gasto descontrolado de tokens en claves que fallan constantemente.

Después de agotar los reintentos, las claves problemáticas se registran y se omiten. Se volverán a intentar en la próxima ejecución de `sync`.

## Caché de prompts

El mensaje del sistema (registro, reglas gramaticales, notas de estilo) se separa del mensaje del usuario (las claves a traducir). Esta separación es intencional:

- El mensaje del sistema es **idéntico en todos los lotes** para una configuración regional determinada
- Proveedores como Anthropic y Google almacenan en caché los mensajes del sistema repetidos
- Resultado: el primer lote paga el costo total de los tokens, los lotes posteriores pagan solo por el mensaje del usuario

Esto puede reducir significativamente los costos de tokens para proyectos con muchos lotes.

## Validación de ICU MessageFormat

El comando `integrity` valida los patrones de plurales de ICU MessageFormat frente a las reglas de plurales de CLDR. Si su archivo de origen utiliza la sintaxis de ICU como:

```json
"items": "{count, plural, one {# item} other {# items}}"
```

Rosetta verifica que las versiones traducidas incluyan todas las categorías de plurales requeridas para la configuración regional de destino. Por ejemplo, el árabe requiere seis categorías (`zero`, `one`, `two`, `few`, `many`, `other`), no solo `one` y `other`.

Ejecute `i18n-rosetta integrity` para comprobar la integridad de los plurales en todas las configuraciones regionales.

## Aplicación de terminología

Para los pares entrenados con un diccionario, rosetta ejecuta una comprobación de terminología posterior a la traducción. Después de pasar el Quality Gate, verifica si el LLM realmente utilizó los términos requeridos del diccionario.

```
[TERM] en→fr: 2 term violation(s)
  • hero.title: "dashboard" → expected "tableau de bord" but got "panneau de contrôle"
```

Las violaciones de terminología son **advertencias, no errores de bloqueo**. La traducción aún se escribe en el disco. Esto es intencional: el LLM puede tener razones válidas para elegir una alternativa (contexto, gramática), y bloquear por discrepancias de términos causaría más daño que beneficio.

Para solucionar las violaciones, actualice el diccionario de entrenamiento o edite manualmente el archivo de configuración regional.

---

## Consulte también

- [Cómo funciona la sincronización](/docs/concepts/how-sync-works) — dónde encaja el Quality Gate en el pipeline
- [Métodos de traducción](/docs/guides/translation-methods) — métodos que alimentan la puerta
- [Convertidores de escritura](/docs/concepts/script-converters) — conversión de escritura posterior a la puerta
- [Datos de entrenamiento](/docs/concepts/coaching-data) — mejora de la calidad de la traducción en etapas previas
- [Memoria de traducción](/docs/concepts/translation-memory) — almacenamiento en caché de traducciones validadas
- [Referencia de la CLI — sync](/docs/reference/cli#sync) — opciones de sincronización, incluido el comportamiento de reintento
- [Referencia de la CLI — integrity](/docs/reference/cli#integrity) — auditoría de plurales de ICU