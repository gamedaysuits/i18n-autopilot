---
sidebar_position: 2
title: "Início Rápido"
---
# Início Rápido

Traduza seu primeiro arquivo de localização em 60 segundos.

## 1. Configure Seus Arquivos de Localização

Crie um arquivo de localização de origem. O Rosetta suporta JSON, TOML e YAML:

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

## 2. Configure Sua Chave de API

Escolha um provedor e configure a chave:

```bash
# Option A: OpenRouter (200+ models, recommended)
export OPENROUTER_API_KEY=sk-or-v1-...

# Option B: Gemini (free tier — zero cost to start)
export GEMINI_API_KEY=AI...
```

Obtenha uma chave gratuita do Gemini em [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Obtenha uma chave do OpenRouter em [openrouter.ai](https://openrouter.ai).

## 3. Execute a Sincronização

```bash
npx i18n-rosetta sync
```

:::tip Usando o Gemini?
Se você escolheu a Opção B (Gemini), adicione `--method gemini`:
```bash
npx i18n-rosetta sync --method gemini
```
:::

O Rosetta irá:
1. Detectar automaticamente `locales/en.json` como a origem
2. Encontrar (ou solicitar) os idiomas de destino
3. Traduzir todas as chaves
4. Escrever `locales/fr.json`, `locales/ja.json`, etc.
5. Criar `.i18n-rosetta.lock` para rastrear o que foi traduzido

## 4. Verifique os Resultados

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

## O Que Acontece a Seguir?

Quando você altera uma string de origem, o rosetta detecta a alteração através do rastreamento de hash SHA-256 e traduz novamente apenas essa chave na próxima sincronização:

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

## Opcional: Crie um Arquivo de Configuração

Para mais controle, gere um arquivo de configuração:

```bash
npx i18n-rosetta init                         # guided wizard
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific targets
```

O assistente guiado orienta você por cada um dos **register presets** do idioma — instruções pré-construídas de tom/formalidade ajustadas ao seu sistema linguístico. O francês possui predefinições T-V (vouvoiement vs tutoiement), o coreano possui níveis de fala (해요체 vs 합쇼체 vs 해체), o japonês possui opções de keigo (です/ます vs 丁寧語).

Ou crie uma configuração manualmente com chaves predefinidas:

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

Execute `npx i18n-rosetta init` para navegar pelos presets disponíveis para cada idioma.

## Opcional: Watch Mode

Traduza automaticamente quando seu arquivo de origem for alterado:

```bash
npx i18n-rosetta watch
```

## Próximos Passos

- **[Configuração](/docs/getting-started/configuration)** — Referência completa de configuração
- **[Métodos de Tradução](/docs/guides/translation-methods)** — Escolha o método certo
- **[Integração com Frameworks](/docs/guides/framework-integration)** — Hugo, next-intl, react-i18next
- **[CI/CD](/docs/guides/ci-cd)** — Automatize traduções no seu pipeline