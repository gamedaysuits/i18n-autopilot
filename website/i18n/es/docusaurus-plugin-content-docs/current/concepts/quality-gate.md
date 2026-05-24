---
sidebar_position: 3
title: "Quality Gate"
---
# Quality Gate

Cada traducción pasa por una puerta de validación determinista antes de escribirse en el disco. El Quality Gate detecta los modos de fallo comunes de la traducción automática: sin fallbacks silenciosos, ni basura escrita en sus archivos de configuración regional.

## Comprobaciones de validación

| Comprobación | Qué detecta | Etiqueta del Gate |
|-------|----------------|-----------|
| **Vacío/en blanco** | El modelo devolvió una cadena vacía o espacios en blanco | `[GATE] empty` |
| **Eco del origen** | El modelo devolvió la entrada original en inglés | `[GATE] source-echo` |
| **Bucle de alucinación** | Patrones de trigramas repetidos (por ejemplo, `"Qo' Qo' Qo'"`) | `[GATE] hallucination` |
| **Inflación de longitud** | La salida es significativamente más larga que el origen | `[GATE] length` |
| **Cumplimiento de escritura** | Sistema de escritura incorrecto para la configuración regional de destino | `[GATE] script` |

### Vacío/En blanco

Rechaza las traducciones que son cadenas vacías, solo espacios en blanco o `null`. Esto detecta los modelos que no devuelven nada para las claves difíciles.

### Eco del origen

Detecta cuando el modelo devuelve el texto de origen en inglés en lugar de traducirlo. Es común con cadenas cortas y prompts poco especificados.

### Bucle de alucinación

Analiza patrones de trigramas (3 caracteres) en la salida. Si algún trigrama se repite más de un número umbral de veces en relación con la longitud de la salida, la traducción es rechazada. Esto detecta salidas degeneradas como `"Qo' Qo' Qo' Qo' Qo'"`.

### Inflación de longitud

Rechaza las traducciones donde la longitud de la salida excede `maxLengthRatio × source length` (predeterminado: 4×). Esto detecta las alucinaciones del modelo que producen muros de texto para una entrada corta.

Configurable a través de `maxLengthRatio` en su configuración.

### Cumplimiento de escritura

Para las configuraciones regionales con un campo `script` configurado (por ejemplo, `"script": "cans"` para los silabarios del cree de las llanuras), valida que la salida contenga caracteres no ASCII apropiados para el sistema de escritura de destino. Se rechaza la salida que solo contiene caracteres latinos para una configuración regional en árabe, CJK o silabarios.

## Qué sucede en caso de fallo

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
- Resultado: el primer lote paga el costo total de tokens, los lotes posteriores pagan solo por el mensaje del usuario

Esto puede reducir significativamente los costos de tokens para proyectos con muchos lotes.

---

## Consulte también

- [Cómo funciona la sincronización](/docs/concepts/how-sync-works) — dónde encaja el Quality Gate en el pipeline
- [Métodos de traducción](/docs/guides/translation-methods) — métodos que alimentan el Quality Gate
- [Convertidores de escritura](/docs/concepts/script-converters) — conversión del sistema de escritura posterior al Quality Gate
- [Datos de entrenamiento](/docs/concepts/coaching-data) — mejora de la calidad de traducción en las etapas previas
- [Referencia de la CLI — sync](/docs/reference/cli#sync) — banderas de sincronización, incluido el comportamiento de reintento