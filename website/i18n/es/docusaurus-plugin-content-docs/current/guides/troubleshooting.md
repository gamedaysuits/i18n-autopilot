---
sidebar_position: 6
title: "Solución de problemas"
---
# Solución de problemas

Problemas comunes y soluciones para i18n-rosetta.

## API y autenticación

### "OPENROUTER_API_KEY not found"

Rosetta requiere una clave de API para la traducción con LLM. Configúrela como una variable de entorno:

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
```

O en un archivo `.env` (si su proyecto carga archivos `.env`):

```
OPENROUTER_API_KEY=sk-or-v1-...
```

:::tip
Si solo tiene una clave de API de Google Translate, rosetta la detecta automáticamente y usa Google Translate como el método predeterminado. No se necesitan cambios en la configuración.
:::

### "401 Unauthorized" de OpenRouter

Su clave de API es inválida o ha expirado. Verifíquela en [openrouter.ai/keys](https://openrouter.ai/keys).

### "429 Too Many Requests" / Límite de tasa (Rate Limiting)

Rosetta maneja los límites de tasa internamente con un retroceso exponencial (exponential backoff). Si alcanza los límites de tasa constantemente:

1. **Reduzca el tamaño del lote (batch size)** en su configuración:
   ```json
   { "batchSize": 15 }
   ```
2. **Use un modelo con límites de tasa más altos** (por ejemplo, `google/gemini-3.5-flash` tiene límites generosos)
3. **Use un método más económico/rápido** para pares de alto volumen — Google Translate no tiene límites de tasa:
   ```json
   { "pairs": { "en:it": { "method": "google-translate" } } }
   ```

### Modelo no encontrado / Errores 404

Los proveedores directos de LLM (`openai`, `anthropic`, `gemini`) validan su cadena de modelo en el primer uso. Si ve una advertencia:

**"looks like an OpenRouter path"** — Está utilizando un modelo en formato OpenRouter (`google/gemini-3.5-flash`) con un proveedor directo. Los proveedores directos usan nombres de modelo simples:

```diff
- { "method": "gemini", "model": "google/gemini-3.5-flash" }
+ { "method": "gemini", "model": "gemini-2.5-flash" }
```

O cambie al método `llm` para usar OpenRouter:
```json
{ "method": "llm", "model": "google/gemini-3.5-flash" }
```

**"is an Anthropic/OpenAI/Gemini model"** — Está enviando un modelo al proveedor equivocado:

```diff
- { "method": "gemini", "model": "claude-sonnet-4-6" }
+ { "method": "anthropic", "model": "claude-sonnet-4-6" }
```

**"not found in available models"** — El modelo puede estar obsoleto o mal escrito. Rosetta obtiene la lista de modelos en vivo del proveedor y sugiere alternativas. Consulte la documentación del proveedor para ver los nombres de modelos actuales.

:::tip La obsolescencia de modelos ocurre
Los proveedores retiran nombres de modelos regularmente. Si las traducciones fallan repentinamente después de una actualización del proveedor, revise la salida de `[WARN]` — le mostrará las alternativas actuales.
:::

## Calidad de la traducción

### Las traducciones repiten el idioma de origen

El control de calidad (quality gate) detecta esto. Si una traducción es idéntica al origen en inglés, se rechaza y se vuelve a intentar. Si el problema persiste:

1. **Revise el modelo** — Algunos modelos tienen un rendimiento deficiente para pares de idiomas específicos
2. **Agregue instrucciones de registro** — Indíquele al modelo qué idioma debe producir:
   ```json
   {
     "languages": {
       "ja": { "name": "Japanese", "register": "Polite/formal Japanese" }
     }
   }
   ```
3. **Pruebe un modelo diferente** — Cambie de `gpt-4o-mini` a `gpt-4o` o `google/gemini-2.5-pro`

### Salida de escritura incorrecta (por ejemplo, texto latino para japonés)

La verificación de cumplimiento de escritura del control de calidad detecta la mayoría de los casos. Si el problema persiste:

- Verifique que el código de configuración regional (locale) sea correcto (`ja`, no `jp`)
- Agregue instrucciones de escritura explícitas en el campo `register`:
  ```json
  { "register": "Japanese using hiragana, katakana, and kanji" }
  ```

### Patrones de alucinación en la salida

Los patrones de trigramas repetidos (por ejemplo, "hola hola hola") son detectados por el detector de bucles de alucinación. Si la salida es incomprensible pero pasa el detector:

1. **Reduzca el tamaño del lote** — Los lotes más pequeños producen una salida más enfocada
2. **Use un modelo más potente** — Los modelos más grandes alucinan menos en escrituras no latinas
3. **Agregue datos de entrenamiento (coaching data)** — Los términos del diccionario anclan la traducción

## Problemas de archivos y formatos

### "No locale files found"

Rosetta detecta automáticamente los archivos de configuración regional. Si no puede encontrarlos:

1. **Revise `localesDir`** — Debe apuntar al directorio que contiene los archivos de configuración regional:
   ```json
   { "localesDir": "./locales" }
   ```
2. **Revise los nombres de los archivos** — Los archivos deben nombrarse según el código de configuración regional: `en.json`, `fr.json`, etc.
3. **Revise el formato** — Formatos compatibles: JSON, JSON anidado, YAML, TOML

### Conflictos con el archivo de bloqueo (lock file)

Si `.i18n-rosetta.lock` entra en un estado defectuoso:

```bash
# Reset the lock file (next sync will retranslate everything)
rm .i18n-rosetta.lock
npx i18n-rosetta sync
```

:::warning
Eliminar el archivo de bloqueo significa que la próxima sincronización volverá a traducir todas las claves, no solo las modificadas. Esto tiene implicaciones de costos de API para proyectos grandes.
:::

### Volver a traducir claves específicas

Si hay traducciones individuales incorrectas y desea forzar que se vuelvan a traducir sin eliminar el archivo de bloqueo:

```bash
# Re-translate a single key
npx i18n-rosetta sync --force-keys "hero.title"

# Re-translate multiple keys
npx i18n-rosetta sync --force-keys "nav.home,nav.about,footer.copyright"
```

La bandera `--force-keys` anula la verificación del hash del archivo de bloqueo para esas claves específicas, forzando la retraducción sin afectar a ninguna otra clave.

### La traducción de contenido corrompe los bloques de código

Esto no debería suceder — los bloques de código se protegen antes de la traducción. Si ocurre:

1. Verifique que el bloque de código use el delimitador estándar (tres comillas invertidas)
2. Busque bloques de código sin cerrar en el Markdown de origen
3. Abra un problema (issue) — esto es un error en el sistema de protección de centinelas

## Problemas de la CLI

### `--watch` no detecta los cambios

La observación de archivos utiliza `fs.watch` nativo de Node.js. Problemas conocidos:

- **Unidades de red** — `fs.watch` no funciona de manera confiable en montajes NFS/SMB
- **Volúmenes de Docker** — Use el modo de sondeo (polling) o ejecute rosetta dentro del contenedor
- **Directorios grandes** — El observador monitorea `localesDir` de forma recursiva; los árboles muy profundos pueden exceder los límites del sistema operativo

### `npx` ejecuta una versión antigua

```bash
# Clear the npx cache
npx --yes i18n-rosetta@latest sync
```

O instálelo globalmente:

```bash
npm install -g i18n-rosetta
i18n-rosetta sync
```

## Rendimiento

### La sincronización es lenta para muchos idiomas

Rosetta traduce los pares de forma secuencial de manera predeterminada. Para acelerar las sincronizaciones en múltiples idiomas:

1. **Use Google Translate para pares de alto volumen** — Es de 10 a 50 veces más rápido que la traducción con LLM
2. **Aumente el tamaño del lote** (hasta 50, el valor predeterminado es 30):
   ```json
   { "batchSize": 50 }
   ```
3. **Use un modelo rápido** — `gpt-4o-mini` es significativamente más rápido que `gpt-4o`

### Altos costos de API

- **Revise los tamaños de los lotes** — Lotes más grandes = menos llamadas a la API = menor costo
- **Use la memoria de traducción (TM)** — La TM está activada de manera predeterminada. Ejecute `i18n-rosetta tm stats` para verificar que esté funcionando. Si ve 0 entradas después de múltiples sincronizaciones, es posible que haya algo mal con los permisos de su directorio `.rosetta/`
- **Use el almacenamiento en caché de prompts** — Rosetta divide los mensajes del sistema/usuario para obtener aciertos de caché en los modelos de Anthropic y Google
- **Use Google Translate para idiomas de Nivel 2** — Consulte la guía [Traducir 30 idiomas](/docs/tutorials/translate-30-languages)

### Traducciones obsoletas después de cambiar de proveedor

Si cambia de un método de traducción a otro (por ejemplo, de `llm` a `deepl`), la caché de la TM aún podría servir traducciones antiguas del método anterior para las claves cuyo texto de origen no ha cambiado. La clave de la caché incluye el nombre del método, por lo que la mayoría de los casos se manejan automáticamente. Pero si cambió `model` dentro del mismo método:

```bash
# Force fresh translations for all keys
i18n-rosetta sync --no-tm

# Or clear the cache entirely and re-sync
i18n-rosetta tm clear --yes
i18n-rosetta sync
```

Consulte [Memoria de traducción](/docs/concepts/translation-memory) para obtener detalles sobre el diseño de las claves de caché.

## ¿Aún tiene problemas?

- **[Problemas en GitHub](https://github.com/gamedaysuits/i18n-rosetta/issues)** — Busque problemas existentes o abra uno nuevo
- **[Documentación de arquitectura](/docs/concepts/architecture)** — Comprenda el diseño del sistema
- **[Control de calidad](/docs/concepts/quality-gate)** — Cómo funciona la validación a nivel interno