---
sidebar_position: 3
title: "Quality Gate"
---
# Quality Gate

Cada traducción pasa por un filtro de validación determinista antes de escribirse en el disco. El Quality Gate detecta los modos de fallo comunes de la traducción automática: sin alternativas silenciosas, sin basura escrita en sus archivos de configuración regional.

## Controles de validación

| Control | Qué detecta | Etiqueta del filtro |
|-------|----------------|-----------|
| **Vacío/en blanco** | El modelo devolvió una cadena vacía o espacios en blanco | `[GATE] empty` |
| **Eco del origen** | El modelo devolvió la entrada original en inglés | `[GATE] source-echo` |
| **Bucle de alucinación** | Patrones de trigramas repetidos (por ejemplo, `"Qo' Qo' Qo'"`) | `[GATE] hallucination` |
| **Inflación de longitud** | El resultado es significativamente más largo que el origen | `[GATE] length` |
| **Cumplimiento de escritura** | Sistema de escritura incorrecto para la configuración regional de destino | `[GATE] script` |
| **Categorías de plurales de ICU** | Faltan las formas plurales requeridas para la configuración regional | `[GATE] icu-plural` |

### Vacío/En blanco

Rechaza las traducciones que son cadenas vacías, que solo contienen espacios en blanco o `null`. Esto detecta a los modelos que no devuelven nada para las claves difíciles.

### Eco del origen

Detecta cuando el modelo devuelve el texto de origen en inglés en lugar de traducirlo. Es común con cadenas cortas y prompts poco especificados.

### Bucle de alucinación

Analiza los patrones de trigramas (3 caracteres) en el resultado. Si algún trigrama se repite más de un número límite de veces en relación con la longitud del resultado, la traducción es rechazada. Esto detecta resultados degenerados como `"Qo' Qo' Qo' Qo' Qo'"`.

### Inflación de longitud

Rechaza las traducciones donde la longitud del resultado excede `maxLengthRatio × source length` (predeterminado: 4×). Esto detecta alucinaciones del modelo que producen muros de texto para una entrada corta.

Configurable a través de `maxLengthRatio` en su configuración.

### Cumplimiento de escritura

Para las configuraciones regionales con un campo `script` configurado (por ejemplo, `"script": "cans"` para los silabarios del cree de las llanuras), valida que el resultado contenga caracteres no ASCII apropiados para el sistema de escritura de destino. Se rechazan los resultados que solo contienen caracteres latinos para una configuración regional en árabe, CJK o silábica.

## Qué sucede en caso de fallo

1. La traducción fallida se registra en stderr con un prefijo `[GATE]`, el nombre de la clave, el motivo y una vista previa del valor
2. La clave **no** se escribe en el archivo de configuración regional
3. Se inicia la cascada de reintentos (consulte a continuación)

```
[GATE] hero.title: source-echo — "Welcome to our platform"
[GATE] nav.about: hallucination — "À À À À À À À À"
```

## Cascada de reintentos

Cuando un lote falla (error de análisis de JSON o rechazos del Quality Gate), rosetta vuelve a intentarlo con lotes progresivamente más pequeños:

```
Full batch (80 keys) → parse error
  └→ Half batch (40 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the 2 problem keys
```

El presupuesto de reintentos está limitado por `maxRetries` (predeterminado: 3, configurable por idioma). Esto evita el gasto descontrolado de tokens en claves que fallan constantemente.

Después de agotar los reintentos, las claves problemáticas se registran y se omiten. Se volverán a intentar en la próxima ejecución de `sync`.

## Caché de prompts

El mensaje del sistema (registro, reglas gramaticales, notas de estilo) se separa del mensaje del usuario (las claves a traducir). Esta separación es intencional:

- El mensaje del sistema es **idéntico en todos los lotes** para una configuración regional determinada
- Proveedores como Anthropic y Google almacenan en caché los mensajes del sistema repetidos
- Resultado: el primer lote paga el costo total de tokens, los lotes posteriores pagan solo por el mensaje del usuario

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

Las infracciones de terminología son **advertencias, no errores de bloqueo**. La traducción se sigue escribiendo en el disco. Esto es intencional: el LLM puede tener razones válidas para elegir una alternativa (contexto, gramática), y bloquear por discrepancias de términos causaría más daño que beneficio.

Para solucionar las infracciones, actualice el diccionario de entrenamiento o edite manualmente el archivo de configuración regional.

---

## Consulte también

- [Cómo funciona la sincronización](/docs/concepts/how-sync-works): dónde encaja el Quality Gate en el proceso
- [Métodos de traducción](/docs/guides/translation-methods): métodos que alimentan el filtro
- [Conversores de escritura](/docs/concepts/script-converters): conversión de escritura posterior al filtro
- [Datos de entrenamiento](/docs/concepts/coaching-data): mejora de la calidad de traducción en las fases previas
- [Memoria de traducción](/docs/concepts/translation-memory): almacenamiento en caché de traducciones validadas
- [Referencia de la CLI: sync](/docs/reference/cli#sync): indicadores de sincronización, incluido el comportamiento de reintento
- [Referencia de la CLI: integrity](/docs/reference/cli#integrity): auditoría de plurales de ICU