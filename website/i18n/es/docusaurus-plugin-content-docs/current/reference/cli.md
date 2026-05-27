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
i18n-rosetta fonts <sub>       Download web fonts for PUA script converters
i18n-rosetta tm <sub>          Manage Translation Memory cache (stats, clear)
i18n-rosetta xliff <sub>       Export/import XLIFF 1.2 for professional review
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
--dry, --dry-run        Preview changes without writing files
--concurrency <n>       Max parallel API calls for content translation (default: 12)
--force-content         Re-translate all content files (clears content lock)
--force-keys <keys>     Comma-separated dot-notation keys to force re-translate
--no-tm                 Skip Translation Memory cache for this sync run
--locale <code>         Target locale (xliff export, tm clear)
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
i18n-rosetta sync --dry-run                         # preview only
i18n-rosetta sync --force-keys "hero.title"         # force re-translate
i18n-rosetta sync --force-keys "a.title,a.subtitle" # multiple keys
i18n-rosetta sync --force-content                   # re-translate all Markdown/MDX
i18n-rosetta sync --content-dir ./content           # include Hugo Markdown
i18n-rosetta sync --method google-translate          # force Google Translate
i18n-rosetta sync --concurrency 20                  # 20 parallel API calls
i18n-rosetta sync --fallback                         # write [EN] prefixes on failure
i18n-rosetta sync --no-tm                            # skip cache, fresh API calls
```

**Memoria de traducción**: De forma predeterminada, `sync` carga `.rosetta/tm.json` y sirve traducciones en caché para los valores de origen que no han cambiado. Use `--no-tm` para omitir la caché (útil al cambiar de proveedor de traducción o depurar la calidad). Consulte [Memoria de traducción](/docs/concepts/translation-memory).

**Detección de cambios**: rosetta almacena hashes SHA-256 en `.i18n-rosetta.lock`. Cuando los valores de origen cambian, la siguiente sincronización vuelve a traducir automáticamente esas claves. Confirme (commit) el archivo de bloqueo para que todos los desarrolladores compartan la línea base.

**Paralelismo**: La traducción de contenido (Markdown, MDX, publicaciones de blog) se ejecuta en un grupo de elementos de trabajo plano con concurrencia configurable. El valor predeterminado es de 12 llamadas a la API en paralelo. Anúlelo con `--concurrency` o el campo de configuración `concurrency`. La traducción de claves JSON se ejecuta secuencialmente por configuración regional (lo suficientemente rápido como para que el paralelismo no añada ningún beneficio).

---

## watch

Sincronización automática cuando cambia el archivo de configuración regional de origen. Se ejecuta hasta que se interrumpe con `Ctrl+C`.

```bash
i18n-rosetta watch
```

---

## audit

Enumera todos los valores de respaldo sin traducir con el prefijo `[EN]`. Sale con el código 1 si se encuentra alguno; úselo como una puerta de CI para hacer fallar las compilaciones con traducciones incompletas.

```bash
i18n-rosetta audit
```

---

## lint

Escanea el código fuente en busca de cadenas codificadas (hardcoded) orientadas al usuario que deberían usar llamadas de traducción i18n. Detecta automáticamente su framework (next-intl, react-i18next, vue-i18n, Hugo).

```bash
i18n-rosetta lint                    # exits 1 if issues found
i18n-rosetta lint --warn-only        # always exits 0
i18n-rosetta lint --src ./app        # custom source directory
i18n-rosetta lint --min-length 4     # minimum string length to flag
```

**Qué detecta:**
- Cadenas codificadas en texto JSX, `placeholder`, `alt`, `aria-label`, `title`
- Archivos con contenido orientado al usuario pero sin importación del framework i18n
- Claves muertas: claves de configuración regional a las que ningún archivo fuente hace referencia
- Puntuación de cobertura: porcentaje de cadenas que pasan por i18n

**Exclusiones**: Cree `.rosettaignore` en la raíz de su proyecto (patrones glob, como `.gitignore`).

---

## wrap

Envuelve automáticamente las cadenas codificadas detectadas por `lint` en llamadas `t()`. Crea copias de seguridad automáticas antes de modificar los archivos.

```bash
i18n-rosetta wrap                    # auto-wrap with backup
i18n-rosetta wrap --dry              # preview wrapping changes
i18n-rosetta wrap --undo             # restore from .rosetta-backup/
```

**Puertas de seguridad:**
1. Verificación de estado limpio en Git (se omite en ejecuciones dry-run)
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
| `jsonld` | Esquema de idioma WebSite en JSON-LD |

---

## integrity

Detecta corrupción y desviaciones en los archivos de configuración regional traducidos.

```bash
i18n-rosetta integrity               # exits 1 if issues found
i18n-rosetta integrity --warn-only   # non-blocking
```

**Qué verifica:**
- Corrupción de marcadores de posición (por ejemplo, `{name}` presente en el origen pero ausente en el destino)
- Problemas de codificación (mojibake, Unicode no válido)
- Copias sin traducir (valor de destino idéntico al de origen)
- Claves huérfanas (claves en el destino que no existen en el origen)
- Integridad de la categoría de plural de ICU MessageFormat (por ejemplo, el árabe necesita 6 categorías)

---

## tm

Administra la caché de la memoria de traducción (`.rosetta/tm.json`). La memoria de traducción (TM) almacena traducciones anteriores y las sirve en sincronizaciones posteriores en lugar de llamar a la API.

```bash
i18n-rosetta tm stats                  # show cache statistics
i18n-rosetta tm clear                  # clear cache (with confirmation)
i18n-rosetta tm clear --yes            # clear without confirmation
i18n-rosetta tm clear --locale fr      # clear only French entries
```

| Subcomando | Salida |
|------------|--------|
| `stats` | Recuento de entradas, tamaño de archivo, desglose por configuración regional |
| `clear` | Eliminar archivo de caché (completo o por configuración regional) |

| Opción | Efecto |
|--------|--------|
| `--locale <code>` | Borrar solo las entradas para una configuración regional |
| `--yes` | Omitir la solicitud de confirmación |

Consulte [Memoria de traducción](/docs/concepts/translation-memory) para saber cómo funciona la TM y cuándo borrarla.

---

## xliff

Exporte e importe archivos XLIFF 1.2 para la revisión de traductores profesionales. XLIFF es el formato de intercambio universal compatible con herramientas TAO (CAT) como memoQ, SDL Trados y Phrase.

```bash
i18n-rosetta xliff export --locale fr                   # export French XLIFF
i18n-rosetta xliff export --locale ja --out ./review/   # custom output path
i18n-rosetta xliff import .rosetta/xliff/fr.xliff       # import reviewed file
i18n-rosetta xliff import ./reviewed.xliff --dry        # preview import
```

| Subcomando | Salida |
|------------|--------|
| `export` | Generar `.xliff` a partir de los archivos de configuración regional de origen y destino |
| `import` | Fusionar las traducciones revisadas de `.xliff` en los archivos de configuración regional |

| Opción | Efecto |
|--------|--------|
| `--locale <code>` | Configuración regional de destino para la exportación (requerido) |
| `--out <path>` | Ruta o directorio de salida personalizado |
| `--dry` | Previsualizar la importación sin escribir |

Consulte [Trabajar con traductores profesionales](/docs/guides/professional-translators) para ver el flujo de trabajo completo.

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

Administra los plugins de métodos de traducción. Los plugins son recetas de traducción preempaquetadas instaladas en `.rosetta/methods/`.

```bash
i18n-rosetta plugin list                      # show installed plugins
i18n-rosetta plugin install ./my-method/      # install from local directory
i18n-rosetta plugin remove crk-coached-v1     # remove a plugin
```

Consulte [Especificación de plugins](/docs/reference/plugin-spec) para conocer el formato del manifiesto del plugin.

---

## fonts

Descarga y administra fuentes web PUA para convertidores de escritura de lenguas construidas. Los idiomas que utilizan caracteres del Área de Uso Privado (Klingon, Sindarin, Kryptoniano) necesitan fuentes web personalizadas para renderizar sus escrituras. Este comando las descarga desde repositorios de código abierto verificados.

```bash
i18n-rosetta fonts list                           # show needed fonts
i18n-rosetta fonts install                        # download all needed fonts
i18n-rosetta fonts install --css                  # also generate CSS snippet
i18n-rosetta fonts install --dir ./public/fonts   # custom output directory
```

| Subcomando | Salida |
|------------|--------|
| `list` | Muestra qué fuentes PUA se necesitan y su estado de instalación |
| `install` | Descarga fuentes para los idiomas configurados |

| Opción | Efecto |
|--------|--------|
| `--dir <path>` | Anular el directorio de salida de fuentes (detectado automáticamente según el tipo de proyecto) |
| `--css` | Generar un fragmento `conlang-fonts.css` junto a las fuentes |
| `--config <path>` | Ruta al archivo de configuración (usado para detectar qué idiomas necesitan fuentes) |

**Detección automática:** El directorio de salida se infiere a partir de la estructura de su proyecto:
- **Docusaurus** → `static/fonts/` o `website/static/fonts/`
- **Hugo** → `static/fonts/`
- **Predeterminado** → `public/fonts/`

**Los convertidores Unicode nativos** (`crk` → Silabario cree, `sr` → Cirílico serbio) NO requieren la instalación de fuentes.

Consulte [Lenguas construidas, escrituras y ortografía](/docs/guides/conlangs-scripts-orthography) para obtener todos los detalles sobre las fuentes PUA.

## Pipeline de tres capas

Use `lint`, `sync` y `audit` juntos para una i18n a prueba de fallos:

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
| **Lint** | `lint` | Pre-commit | Bloquear commits con cadenas codificadas |
| **Sync** | `sync` | Post-commit / CI | Traducir claves faltantes y modificadas |
| **Audit** | `audit` | Paso de compilación (Build) | Hacer fallar el despliegue si alguna configuración regional está incompleta |

---

## Consulte también

- [Configuración](/docs/getting-started/configuration) — referencia del archivo de configuración
- [Métodos de traducción](/docs/guides/translation-methods) — selección de métodos por par
- [Memoria de traducción](/docs/concepts/translation-memory) — almacenamiento en caché y ahorro de costos
- [Trabajar con traductores profesionales](/docs/guides/professional-translators) — flujo de trabajo con XLIFF
- [Especificación de plugins](/docs/reference/plugin-spec) — formato del manifiesto del plugin
- [Guía de CI/CD](/docs/guides/ci-cd) — automatización de comandos de la CLI en su pipeline
- [Cómo funciona Sync](/docs/concepts/how-sync-works) — comprender el pipeline de sincronización
- [Puerta de calidad](/docs/concepts/quality-gate) — cómo se validan las traducciones