# Guías de integración

Configuración paso a paso para i18n-rosetta con frameworks populares.

---

## Configuración de la clave de API

Antes de integrarse con cualquier framework, necesita una clave de API de traducción. Rosetta es compatible con dos proveedores:

### Opción A: OpenRouter (recomendado)

[OpenRouter](https://openrouter.ai) proporciona una API unificada para más de 200 modelos LLM. Nivel gratuito disponible.

```bash
# Sign up at https://openrouter.ai, then:
export OPENROUTER_API_KEY=sk-or-v1-...

# Or add to .env.local:
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Ideal para: proyectos con mucho contenido, traducción de Markdown y proyectos que necesitan protección sensible al contenido (bloques de código, shortcodes, variables de interpolación).

### Opción B: Google Translate

```bash
export GOOGLE_TRANSLATE_API_KEY=...
```

Ideal para: pares de cadenas clave-valor de alto volumen (más de 130 idiomas). **No recomendado** para contenido en Markdown — Google Translate no tiene conocimiento de bloques de código, shortcodes ni variables de interpolación.

Para usar Google Translate de forma explícita:

```bash
i18n-rosetta sync --method google-translate
```

> **Consejo**: Si solo se configura `GOOGLE_TRANSLATE_API_KEY` (sin clave de OpenRouter), rosetta cambia a Google Translate automáticamente.

---

## Hugo (TOML / YAML / Markdown)

### Estructura del proyecto

Hugo usa `i18n/` para las traducciones de cadenas y `content/` para el contenido de la página:

```
my-hugo-site/
├── i18n/
│   ├── en.toml             ← source of truth
│   ├── fr.toml
│   └── ja.toml
├── content/
│   ├── posts/
│   │   ├── hello.md        ← source (English)
│   │   ├── hello.fr.md
│   │   └── hello.ja.md
│   └── about.md
└── .env.local
```

### Configuración

```bash
npm install --save-dev i18n-rosetta
```

```bash
# .env.local
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Cree `i18n-rosetta.config.json`:

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./i18n",
  "contentDir": "./content",
  "format": "auto",
  "languages": ["fr", "de", "ja", "es", "ko", "zh"]
}
```

```bash
i18n-rosetta sync           # sync i18n string files + content files
i18n-rosetta sync --dry     # preview changes without writing
```

### Detalles de la traducción de contenido

**Front matter**: Admite delimitadores tanto de YAML (`---`) como de TOML (`+++`). Traduce `title`, `description`, `summary`, `subtitle`, `caption` y `linkTitle` por defecto. Todos los demás campos (date, draft, tags, weight, slug, etc.) se conservan. Personalícelo con `translatableFields` en su configuración.

**Protección de bloques**: Los bloques de código, los shortcodes de Hugo (`{{< >}}`, `{{% %}}`), el código en línea y el HTML sin procesar se protegen automáticamente mediante marcadores de posición centinela Unicode. Pasan intactos.

**Convención de nombres de archivo**: Sigue el patrón de traducción por nombre de archivo de Hugo:
- `my-post.md` → `my-post.fr.md`
- `my-post.en.md` → `my-post.fr.md` (elimina el sufijo de origen)

**Omitir existentes**: Los archivos traducidos existentes nunca se sobrescriben. Elimine un archivo de destino para forzar su retraducción.

### Formas plurales

Las configuraciones regionales de TOML y YAML admiten formas plurales CLDR:

```toml
[items]
one = "{{ .Count }} item"
other = "{{ .Count }} items"
```

Representadas internamente como `items.one` y `items.other` para la comparación (diffing), y luego reserializadas al formato seccionado correcto al escribir.

---

## next-intl (JSON)

### Estructura del proyecto

```
my-app/
├── messages/
│   └── en.json        ← source of truth
├── src/
│   ├── i18n/
│   │   ├── routing.ts
│   │   └── request.ts
│   └── middleware.ts
└── .env.local
```

### Configuración

```bash
npm install --save-dev i18n-rosetta
```

Cree `i18n-rosetta.config.json`:

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./messages",
  "languages": ["fr", "de", "ja", "es", "ko", "zh", "pt", "ar"]
}
```

```bash
npx i18n-rosetta sync
```

Crea `messages/fr.json`, `messages/ja.json`, etc. — completamente traducidos, conservando su estructura de claves anidadas. next-intl los detecta automáticamente.

### Flujo de trabajo de desarrollo

```json
{
  "scripts": {
    "dev": "i18n-rosetta watch & next dev",
    "i18n:sync": "i18n-rosetta sync",
    "i18n:audit": "i18n-rosetta audit"
  }
}
```

---

## react-i18next (JSON)

### Estructura de archivos plana (recomendado)

```
locales/
├── en.json
├── fr.json
└── ja.json
```

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "languages": ["fr", "de", "ja"]
}
```

### Estructura de directorios anidada

Si usa la estructura `{locale}/{namespace}.json`, cree un script de sincronización para aplanar → traducir → desaplanar. Consulte la [documentación de react-i18next](https://react.i18next.com/) para obtener más detalles.