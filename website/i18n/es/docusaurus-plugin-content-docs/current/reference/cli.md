---
sidebar_position: 1
title: "Referencia de la CLI"
---
# Referencia de la CLI

## Comandos

```
i18n-rosetta init              Interactive setup wizard (--yes for quick defaults)
i18n-rosetta sync              Translate & sync all locale files
i18n-rosetta watch             Auto-sync when the source file changes
i18n-rosetta audit             List all untranslated [EN] fallback values
i18n-rosetta lint              Scan source code for hardcoded strings
i18n-rosetta wrap              Auto-wrap hardcoded strings in t() calls (with undo)
i18n-rosetta seo <sub>         Generate hreflang, sitemap.xml, or JSON-LD schema
i18n-rosetta integrity         Audit locale files for format/encoding issues
i18n-rosetta status            Show pair configuration, plugins, and quality tiers
i18n-rosetta provenance        Audit translation resource licensing
i18n-rosetta plugin <sub>      Manage method plugins (install, remove, list)
```

Ejecute `i18n-rosetta <command> --help` para obtener ayuda detallada sobre cualquier comando.

## Opciones globales

```
--help, -h              Show help (global or per-command)
--version, -v           Print version and exit
--yes, -y               Skip interactive prompts, use defaults
--config <path>         Custom config file path
--dir <path>            Override locales directory
--content-dir <path>    Hugo/Docusaurus content directory for Markdown translation
--source <code>         Override source locale (default: en)
--model <model>         Override translation model
--method <method>       Translation method: llm, google-translate (default: from config)
--format <fmt>          Locale file format: json, toml, yaml, or auto
--dry                   Preview changes without writing files
```

---

## init

Asistente de configuración interactivo que crea `i18n-rosetta.config.json`. Le guía a través de la configuración regional de origen, los idiomas de destino, el formato de archivo y el modelo de traducción.

```bash
i18n-rosetta init                          # interactive wizard
i18n-rosetta init --yes                    # skip wizard, use defaults
i18n-rosetta init --yes --langs fr,de,ja   # quick setup with specific languages
i18n-rosetta init --source en --dir ./i18n # overrides with defaults
```

**Opción `--langs`**: Lista de códigos de idiomas de destino separados por comas. Omite la solicitud de idioma y aplica los ajustes preestablecidos de registro predeterminados para cada idioma. Combínelo con `--yes` para una configuración completamente no interactiva.

**Ajustes preestablecidos de idioma**: Cuando se le soliciten los idiomas de destino, puede escribir los nombres de los ajustes preestablecidos:
- `european` → fr, de, es, it, pt, nl
- `asian` → ja, zh, ko
- `global` → fr, es, de, ja, zh, ko, pt, ar
- `nordic` → da, fi, nb, sv

Mezcle ajustes preestablecidos y códigos individuales: `european, ja` → fr, de, es, it, pt, nl, ja

---

## sync

Traduce las claves faltantes, obsoletas y de respaldo en todos los archivos de configuración regional.

```bash
i18n-rosetta sync                                   # translate everything
i18n-rosetta sync --dry                             # preview only
i18n-rosetta sync --force-keys "hero.title"         # force re-translate
i18n-rosetta sync --force-keys "a.title,a.subtitle" # multiple keys
i18n-rosetta sync --content-dir ./content           # include Hugo Markdown
i18n-rosetta sync --method google-translate          # force Google Translate
i18n-rosetta sync --fallback                         # write [EN] prefixes on failure
```

**Detección de cambios**: rosetta almacena hashes SHA-256 en `.i18n-rosetta.lock`. Cuando los valores de origen cambian, la siguiente sincronización vuelve a traducir automáticamente esas claves. Confirme (commit) el archivo de bloqueo para que todos los desarrolladores compartan la línea base.

---

## watch

Sincronización automática cuando cambia el archivo de configuración regional de origen. Se ejecuta hasta que se interrumpe con `Ctrl+C`.

```bash
i18n-rosetta watch
```

---

## audit

Enumera todos los valores de respaldo sin traducir con el prefijo `[EN]`. Sale con el código 1 si se encuentra alguno; utilícelo como una puerta de CI para hacer fallar las compilaciones (builds) con traducciones incompletas.

```bash
i18n-rosetta audit
```

---

## lint

Escanea el código fuente en busca de cadenas de texto codificadas (hardcoded) orientadas al usuario que deberían usar llamadas de traducción i18n. Detecta automáticamente su framework (next-intl, react-i18next, vue-i18n, Hugo).

```bash
i18n-rosetta lint                    # exits 1 if issues found
i18n-rosetta lint --warn-only        # always exits 0
i18n-rosetta lint --src ./app        # custom source directory
i18n-rosetta lint --min-length 4     # minimum string length to flag
```

**Qué detecta:**
- Cadenas de texto codificadas (hardcoded) en texto JSX, `placeholder`, `alt`, `aria-label`, `title`
- Archivos con contenido orientado al usuario pero sin importación del framework i18n
- Claves muertas: claves de configuración regional a las que ningún archivo fuente hace referencia
- Puntuación de cobertura: porcentaje de cadenas de texto que pasan por i18n

**Exclusiones**: Cree `.rosettaignore` en la raíz de su proyecto (patrones glob, como `.gitignore`).

---

## wrap

Envuelve automáticamente las cadenas de texto codificadas (hardcoded) detectadas por `lint` en llamadas `t()`. Crea copias de seguridad automáticas antes de modificar los archivos.

```bash
i18n-rosetta wrap                    # auto-wrap with backup
i18n-rosetta wrap --dry              # preview wrapping changes
i18n-rosetta wrap --undo             # restore from .rosetta-backup/
```

**Puertas de seguridad:**
1. Verificación de Git limpio (se omite en ejecuciones de prueba o dry-run)
2. Copia de seguridad automática en `.rosetta-backup/`
3. Vista previa de diferencias (diff) antes de escribir en cada archivo
4. Soporte de `--undo` para restaurar desde la copia de seguridad

---

## seo

Genera artefactos de SEO para sitios multilingües.

```bash
i18n-rosetta seo hreflang                                        # print hreflang tags
i18n-rosetta seo sitemap --base-url https://example.com --out sitemap.xml
i18n-rosetta seo jsonld --base-url https://example.com           # JSON-LD schema
```

| Subcomando | Salida |
|------------|--------|
| `hreflang` | Etiquetas `<link rel="alternate" hreflang>` |
| `sitemap` | `sitemap.xml` multilingüe |
| `jsonld` | Esquema de idioma JSON-LD WebSite |

---

## integrity

Detecta corrupción y desviaciones en los archivos de configuración regional traducidos.

```bash
i18n-rosetta integrity               # exits 1 if issues found
i18n-rosetta integrity --warn-only   # non-blocking
```

**Qué verifica:**
- Corrupción de marcadores de posición (por ejemplo, `{name}` presente en el origen pero ausente en el destino)
- Problemas de codificación (mojibake, Unicode inválido)
- Copias sin traducir (valor de destino idéntico al de origen)
- Claves huérfanas (claves en el destino que no existen en el origen)

---

## status

Muestra la configuración de pares, los plugins instalados, los niveles de calidad y las puntuaciones de referencia (benchmarks).

```bash
i18n-rosetta status
```

---

## provenance

Audita las licencias de los recursos de traducción para todos los plugins instalados.

```bash
i18n-rosetta provenance
```

---

## plugin

Gestiona los plugins de métodos de traducción. Los plugins son recetas de traducción preempaquetadas que se instalan en `.rosetta/methods/`.

```bash
i18n-rosetta plugin list                      # show installed plugins
i18n-rosetta plugin install ./my-method/      # install from local directory
i18n-rosetta plugin remove crk-coached-v1     # remove a plugin
```

Consulte la [Especificación de plugins](/docs/reference/plugin-spec) para conocer el formato del manifiesto del plugin.

---

## Pipeline de tres capas

Utilice `lint`, `sync` y `audit` juntos para una i18n a prueba de fallos:

```json title="package.json"
{
  "scripts": {
    "i18n:lint": "i18n-rosetta lint",
    "i18n:sync": "i18n-rosetta sync",
    "i18n:audit": "i18n-rosetta audit"
  }
}
```

| Capa | Comando | Cuándo | Propósito |
|-------|---------|------|---------|
| **Lint** | `lint` | Pre-commit | Bloquear commits con cadenas de texto codificadas (hardcoded) |
| **Sync** | `sync` | Post-commit / CI | Traducir claves faltantes y modificadas |
| **Audit** | `audit` | Paso de compilación (Build) | Hacer fallar el despliegue si alguna configuración regional está incompleta |

---

## Consulte también

- [Configuración](/docs/getting-started/configuration) — referencia del archivo de configuración
- [Métodos de traducción](/docs/guides/translation-methods) — selección de métodos por par
- [Especificación de plugins](/docs/reference/plugin-spec) — formato del manifiesto del plugin
- [Guía de CI/CD](/docs/guides/ci-cd) — automatización de comandos de la CLI en su pipeline
- [Cómo funciona la sincronización](/docs/concepts/how-sync-works) — comprensión del pipeline de sincronización
- [Puerta de calidad](/docs/concepts/quality-gate) — cómo se validan las traducciones