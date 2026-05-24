---
sidebar_position: 2
title: "Inicio rápido"
---
# Inicio rápido

Traduzca su primer archivo de localización en 60 segundos.

## 1. Configure sus archivos de localización

Cree un archivo de localización de origen. Rosetta es compatible con JSON, TOML y YAML:

```json title="locales/en.json"
{
  "hero": {
    "title": "Welcome to our platform",
    "subtitle": "Build something amazing"
  },
  "nav": {
    "home": "Home",
    "about": "About",
    "contact": "Contact"
  }
}
```

## 2. Configure su clave de API

Elija un proveedor y configure la clave:

```bash
# Option A: OpenRouter (200+ models, recommended)
export OPENROUTER_API_KEY=sk-or-v1-...

# Option B: Gemini (free tier — zero cost to start)
export GEMINI_API_KEY=AI...
```

Obtenga una clave gratuita de Gemini en [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Obtenga una clave de OpenRouter en [openrouter.ai](https://openrouter.ai).

## 3. Ejecute la sincronización

```bash
npx i18n-rosetta sync
```

:::tip ¿Usa Gemini?
Si eligió la Opción B (Gemini), agregue `--method gemini`:
```bash
npx i18n-rosetta sync --method gemini
```
:::

Rosetta hará lo siguiente:
1. Detectar automáticamente `locales/en.json` como el origen
2. Encontrar (o solicitar) los idiomas de destino
3. Traducir todas las claves
4. Escribir `locales/fr.json`, `locales/ja.json`, etc.
5. Crear `.i18n-rosetta.lock` para hacer un seguimiento de lo que se ha traducido

## 4. Verifique los resultados

```bash
cat locales/fr.json
```

```json
{
  "hero": {
    "title": "Bienvenue sur notre plateforme",
    "subtitle": "Construisez quelque chose d'incroyable"
  },
  "nav": {
    "home": "Accueil",
    "about": "À propos",
    "contact": "Contact"
  }
}
```

## ¿Qué sucede después?

Cuando cambia una cadena de origen, rosetta detecta el cambio mediante el seguimiento de hash SHA-256 y vuelve a traducir solo esa clave en la siguiente sincronización:

```json title="locales/en.json (updated)"
{
  "hero": {
    "title": "Welcome to Acme Platform",  // ← changed
    "subtitle": "Build something amazing"  // ← unchanged, skipped
  }
}
```

```bash
npx i18n-rosetta sync
# Only "hero.title" is re-translated across all locales
```

## Opcional: Cree un archivo de configuración

Para tener más control, genere un archivo de configuración:

```bash
npx i18n-rosetta init                         # guided wizard
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific targets
```

El asistente guiado lo lleva paso a paso por los **ajustes preestablecidos de registro** de cada idioma — instrucciones predefinidas de tono y formalidad adaptadas a su sistema lingüístico. El francés tiene ajustes preestablecidos T-V (vouvoiement vs tutoiement), el coreano tiene niveles de habla (해요체 vs 합쇼체 vs 해체) y el japonés tiene opciones de keigo (です/ます vs 丁寧語).

O cree una configuración manualmente con claves preestablecidas:

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "languages": {
    "fr": "casual-tu",
    "ko": "polite-haeyo",
    "ja": "polite"
  },
  "model": "google/gemini-2.5-flash"
}
```

Ejecute `npx i18n-rosetta init` para explorar los ajustes preestablecidos disponibles para cada idioma.

## Opcional: Modo Watch

Traduzca automáticamente cuando cambie su archivo de origen:

```bash
npx i18n-rosetta watch
```

## Próximos pasos

- **[Configuración](/docs/getting-started/configuration)** — Referencia completa de configuración
- **[Métodos de traducción](/docs/guides/translation-methods)** — Elija el método adecuado
- **[Integración de frameworks](/docs/guides/framework-integration)** — Hugo, next-intl, react-i18next
- **[CI/CD](/docs/guides/ci-cd)** — Automatice las traducciones en su pipeline