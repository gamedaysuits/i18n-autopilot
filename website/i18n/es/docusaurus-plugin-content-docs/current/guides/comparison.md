---
sidebar_position: 7
title: "Comparación"
---
# Cómo se compara Rosetta

i18n-rosetta ocupa una categoría diferente a la de la mayoría de las herramientas de localización. Aquí tiene una comparación honesta.

## El panorama

La mayoría de las herramientas de localización se dividen en una de tres categorías:

| Categoría | Ejemplos | Modelo |
|----------|----------|-------|
| **Plataformas TMS en la nube** | Crowdin, Phrase, Locize, Tolgee | Panel de control SaaS + traductores humanos + suscripción mensual |
| **Herramientas de extracción de claves** | i18next-scanner, FormatJS CLI | Escanean el código fuente en busca de llamadas a funciones de traducción |
| **Motores de traducción CLI** | **i18n-rosetta** | Se ejecutan en su proyecto, traducen archivos directamente, sin cuenta en la nube |

Rosetta es un **motor de traducción CLI**; traduce sus archivos de configuración regional directamente utilizando backends configurables (LLMs, Google Translate, plugins personalizados). Sin panel de control en la nube, sin flujo de trabajo para traductores humanos, sin tarifa mensual.

---

## Comparación de características

| Característica | i18n-rosetta | Crowdin | Phrase | Locize |
|---------|:------------:|:-------:|:------:|:------:|
| **Se ejecuta localmente (sin cuenta en la nube)** | ✅ | ❌ | ❌ | ❌ |
| **Cero dependencias** | ✅ | ❌ | ❌ | ❌ |
| **Configuración de método por par de idiomas** | ✅ | ❌ | ❌ | ❌ |
| **Registros de idioma personalizados** | ✅ | ❌ | ❌ | ❌ |
| **Reconocimiento de contenido (protege bloques de código)** | ✅ | ❌ | ❌ | ❌ |
| **Conversión de idiomas construidos (conlangs) y sistemas de escritura** | ✅ | ❌ | ❌ | ❌ |
| **Arquitectura de plugins** | ✅ | ❌ | ❌ | ❌ |
| **Traducción de Markdown / contenido** | ✅ | ✅ | ✅ | ❌ |
| **Memoria de traducción** | ✅ | ✅ | ✅ | ✅ |
| **Exportación/importación XLIFF** | ✅ | ✅ | ✅ | ❌ |
| **Validación de plurales ICU** | ✅ | ✅ | ✅ | ❌ |
| **Aplicación de terminología** | ✅ | ✅ | ✅ | ❌ |
| **Flujo de trabajo para traductores humanos** | Basado en XLIFF | ✅ | ✅ | ✅ |
| **Edición en contexto (visual)** | ❌ | ✅ | ✅ | ✅ |
| **Colaboración en equipo** | ❌ | ✅ | ✅ | ✅ |
| **Soporte de formatos de archivo** | JSON, TOML, YAML, MD, XLIFF | Más de 50 | Más de 40 | JSON |
| **Precios** | Gratis (paga por su LLM) | Desde $0/mes | Desde $0/mes | Desde $0/mes |

---

## Cuándo usar Rosetta

**Rosetta es una buena opción cuando:**

- Desea que la traducción automática esté integrada en su proceso de compilación (build pipeline), no como un flujo de trabajo separado
- Necesita control del método por idioma (LLM para algunos, Google Translate para otros, plugins personalizados para el resto)
- Está traduciendo a idiomas sin cobertura de API (indígenas, en peligro de extinción, construidos)
- Desea una salida de sistema de escritura determinista (Cree Syllabics, Klingon pIqaD, Tengwar)
- Desea cero dependencia de proveedores (vendor lock-in) y cero dependencias en la nube
- Es un desarrollador independiente o un equipo pequeño que no necesita un panel de control TMS completo
- Desea una entrega basada en XLIFF a traductores profesionales sin una suscripción en la nube

**Un TMS en la nube es una mejor opción cuando:**

- Tiene traductores humanos profesionales revisando cada cadena (el flujo de trabajo XLIFF de rosetta es más simple que un TMS completo)
- Necesita memoria de traducción entre proyectos y gestión de glosarios
- Necesita edición visual en contexto (previsualizar traducciones dentro de su interfaz de usuario)
- Tiene un equipo grande con necesidades de control de acceso basado en roles
- Necesita soporte para más de 50 formatos de archivo

---

## Lo que hace Rosetta que nadie más hace

### 1. Registros personalizados

Cada par de idiomas recibe instrucciones de tono culturalmente apropiadas para el LLM:

```json
{
  "de": {
    "register": "Standard professional register. Use Sie-form for formal address."
  },
  "tl": {
    "register": "Educated Manila Taglish. Use Tagalog as the primary language but keep technical terms in English."
  },
  "tlh": {
    "register": "Warrior's honor. OVS grammar. Use Marc Okrand vocabulary."
  }
}
```

Ninguna otra herramienta incluye 47 registros de idioma preconfigurados, ni le permite definir registros personalizados por proyecto.

### 2. Convertidores de sistemas de escritura deterministas

Rosetta incluye cinco convertidores de sistemas de escritura integrados que se ejecutan como ganchos (hooks) posteriores a la traducción; no se necesita LLM:

| Configuración regional | Conversión | Ejemplo |
|--------|-----------|---------|
| `crk` | SRO → Cree Syllabics | `nêhiyawêwin` → `ᓀᐦᐃᔭᐍᐏᐣ` |
| `sr` | Latín → Cirílico | `Beograd` → `Београд` |
| `tlh` | Romanización → pIqaD | `tlhIngan Hol` → (glifos pIqaD) |
| `x-elvish-s` | Latín → Tengwar | Sindarin → Tengwar (Modo de Beleriand) |
| `x-kryptonian` | Latín → Kryptonian | Sustitución de cifrado (requiere fuente) |

Estos son convertidores puros de tablas de búsqueda: deterministas, auditables y con cero riesgo de alucinaciones del LLM.

### 3. Protección con reconocimiento de contenido

Al traducir Markdown o contenido enriquecido, Rosetta protege:

- Bloques de código delimitados (` ``` `)
- Código en línea (`` ` ` ``)
- Shortcodes de Hugo (`{{</* */>}}`, `{{%/* */%}}`)
- Variables de interpolación (`{{ .Count }}`, `{name}`, `{{t('key')}}`)
- Bloques de HTML sin formato

Estos se reemplazan con tokens centinela Unicode antes de la traducción y se restauran después. El LLM nunca ve su código, sus shortcodes ni sus variables.

### 4. Plugins de métodos guiados

Para idiomas sin cobertura de API, puede crear un método de traducción guiado:

1. Escribir datos de guía lingüística (reglas gramaticales, vocabulario, ejemplos)
2. Empaquetarlo como un plugin
3. Evaluarlo frente a traducciones de referencia utilizando el [entorno de evaluación](https://github.com/gamedaysuits/gds-mt-eval-harness)
4. Instalarlo en su proyecto con `i18n-rosetta plugin install`

Así es como rosetta maneja el Plains Cree, y cómo usted puede manejar cualquier idioma, incluidos los que aún no existen.

---

## En conclusión

Rosetta no es un reemplazo para Crowdin. Es una herramienta diferente para un flujo de trabajo diferente. Si necesita traductores humanos, use un TMS. Si necesita una CLI que traduzca sus archivos con un solo comando y le brinde control por idioma sobre métodos, modelos y registros, use rosetta.