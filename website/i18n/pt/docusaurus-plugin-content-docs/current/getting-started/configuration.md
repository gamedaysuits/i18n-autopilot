---
sidebar_position: 3
title: "Configuração"
---
# Configuração

O Rosetta funciona sem configuração (zero-config) — ele detecta automaticamente os arquivos de localização, o formato e os idiomas de destino do seu projeto. Para mais controle, crie `i18n-rosetta.config.json` na raiz do seu projeto, ou execute:

```bash
npx i18n-rosetta init
```

## Referência Completa de Configuração

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "contentDir": null,
  "translatableFields": null,
  "format": "auto",
  "model": "google/gemini-3.5-flash",
  "defaultMethod": "llm",
  "batchSize": 30,
  "concurrency": 12,
  "fallbackPrefix": "[EN] ",
  "apiKeyEnvVar": "OPENROUTER_API_KEY",
  "baseUrl": "",
  "pairs": {},
  "languages": {},
  "lint": {
    "srcDir": null,
    "ignore": ["node_modules", ".next", "dist"],
    "minLength": 2
  },
  "seo": {
    "urlPattern": "/:locale/:path",
    "pages": null
  },
  "typegen": {
    "output": null,
    "autoGenerate": false
  }
}
```

:::note typegen ainda não está implementado
O bloco de configuração `typegen` é reconhecido e preservado pelo carregador de configurações, mas a geração de tipos TypeScript ainda não está implementada. Este é um espaço reservado para um recurso planejado. Definir esses valores não tem efeito.
:::

### Campos

| Campo | Tipo | Padrão | Descrição |
|-------|------|---------|-------------|
| `version` | `number` | `3` | Versão do schema de configuração. Sempre `3`. |
| `inputLocale` | `string` | `"en"` | Código do idioma de origem (BCP 47). |
| `localesDir` | `string` | `"./locales"` | Caminho para os arquivos de localização. O Rosetta escaneia este diretório. |
| `contentDir` | `string` | `null` | Diretório de conteúdo do Hugo. Habilita a tradução do corpo em Markdown. |
| `translatableFields` | `string[]` | `null` | Substitui os campos traduzíveis padrão do frontmatter para a tradução de conteúdo. `null` usa os padrões integrados (`title`, `description`, `summary`). |
| `format` | `string` | `"auto"` | Formato do arquivo: `json`, `toml`, `yaml` ou `auto` (detecta pela extensão). |
| `model` | `string` | `"google/gemini-3.5-flash"` | Modelo padrão para métodos LLM. O formato depende do método: o OpenRouter usa `provider/model` (ex.: `google/gemini-3.5-flash`); provedores diretos usam nomes simples (ex.: `gpt-4o`, `gemini-2.5-flash`). |
| `defaultMethod` | `string` | `"llm"` | Método de tradução padrão: `llm`, `llm-coached`, `google-translate`, `deepl`, `microsoft-translator`, `libretranslate`, `openai`, `anthropic`, `gemini`, `api`. Substituído pela flag de CLI `--method`. |
| `batchSize` | `number` | `30` | Chaves por lote de tradução. Maior = menos chamadas de API, mas prompts maiores. |
| `concurrency` | `number` | `12` | Máximo de chamadas de API paralelas para tradução de conteúdo (Markdown/MDX). Substituído pela flag de CLI `--concurrency`. |
| `fallbackPrefix` | `string` | `"[EN] "` | Prefixo adicionado aos valores de fallback não traduzidos. Usado por `audit` para detectar traduções incompletas. |
| `apiKeyEnvVar` | `string` | `"OPENROUTER_API_KEY"` | Nome da variável de ambiente para a chave de API. Substitua para nomes de variáveis de ambiente personalizados. |
| `baseUrl` | `string` | `""` | URL base para geração de artefatos de SEO (hreflang, sitemaps, JSON-LD). |
| `pairs` | `object` | `{}` | Substituições de método, modelo e qualidade por par. Veja [Configuração de Par](#pair-configuration). |
| `languages` | `object` | `{}` | Substituições por idioma. Veja [Configuração de Idioma](#language-configuration). |
| `lint.srcDir` | `string` | `null` | Diretório de origem para verificação do lint. `null` = detecção automática pelo framework. |
| `lint.ignore` | `string[]` | `["node_modules", ...]` | Padrões glob para excluir do lint. |
| `lint.minLength` | `number` | `2` | Comprimento mínimo da string para ser sinalizada como hardcoded. |
| `seo.urlPattern` | `string` | `"/:locale/:path"` | Modelo de padrão de URL para geração de tags hreflang. |
| `seo.pages` | `string[]` | `null` | Lista explícita de páginas para SEO. `null` = detecção automática pelas chaves de localização. |
| `typegen.output` | `string` | `null` | Caminho de saída para os tipos TypeScript gerados. `null` = desativado. |
| `typegen.autoGenerate` | `boolean` | `false` | Gerar tipos automaticamente após cada sincronização. |

## Configuração de Par

Cada par origem→destino pode ser configurado de forma independente:

```json
{
  "pairs": {
    "en:fr": {
      "method": "google-translate",
      "qualityTier": "high"
    },
    "en:ja": {
      "method": "llm",
      "model": "google/gemini-2.5-pro"
    },
    "en:crk": {
      "methodPlugin": "crk-coached-v1"
    }
  }
}
```

### Campos do Par

| Campo | Tipo | Descrição |
|-------|------|-------------|
| `method` | `string` | Método de tradução: `llm`, `llm-coached`, `google-translate`, `deepl`, `microsoft-translator`, `libretranslate`, `openai`, `anthropic`, `gemini`, `api` |
| `methodPlugin` | `string` | Nome de um plugin instalado (a partir de `.rosetta/methods/`) |
| `model` | `string` | Substitui o modelo padrão para este par |
| `endpoint` | `string` | URL do endpoint da API remota. Obrigatório quando `method` for `api`. |
| `qualityTier` | `string` | Nível de exibição (tier): `standard`, `high`, `research`, `verified` |

## Configuração de Idioma

Os idiomas aceitam três formatos:

### Array de códigos (mais simples)

```json
{
  "languages": ["fr", "de", "ja"]
}
```

Cada idioma obtém seu registro padrão a partir da tabela de registros integrada. Idiomas sem um padrão recebem `"Professional register."`.

### Objeto com strings de registro

O valor pode ser uma **chave predefinida** (preset key) do card do idioma, ou um texto de registro personalizado:

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "Custom: Polite Japanese for a gaming app."
  }
}
```

O Rosetta verifica se a string corresponde a uma chave predefinida no card do idioma. Se corresponder, o prompt de registro completo do card é usado. Caso contrário, a string é usada como está. Veja [Idiomas Suportados](/docs/reference/supported-languages#language-cards) para os presets disponíveis.

### Objeto com configuração completa

```json
{
  "languages": {
    "crk": {
      "name": "Plains Cree",
      "register": "SRO syllabics with grammatical precision.",
      "model": "google/gemini-2.5-pro",
      "batchSize": 5,
      "maxRetries": 5,
      "script": "cans"
    }
  }
}
```

Você pode misturar objetos abreviados (shorthand) e completos no mesmo bloco.

### Campos do Idioma

| Campo | Tipo | Descrição |
|-------|------|-------------|
| `register` | `string` | Instruções de estilo/tom. Pode ser uma **chave predefinida** (ex.: `casual-tu`, `formal-hapsyo`) ou um texto personalizado. Veja [Cards de Idiomas](/docs/reference/supported-languages#language-cards). |
| `name` | `string` | Nome do idioma legível por humanos (para exibição de status) |
| `model` | `string` | Substitui o modelo padrão |
| `batchSize` | `number` | Substitui o tamanho do lote padrão |
| `maxRetries` | `number` | Orçamento máximo de tentativas para lotes com falha (padrão: 3) |
| `script` | `string` | Código de script ISO 15924. Aciona a validação de script no quality gate. |

:::info Cadeia de herança
As configurações são resolvidas nesta ordem (a primeira vence):

**nível do par** → **nível do idioma** → **configuração global** → **padrões**

Por exemplo, se `pairs["en:fr"]` definir `model`, ele substitui os valores de `model` tanto no nível do idioma quanto no global.
:::

## Origem Não-Inglesa

Se o seu idioma de origem não for o inglês:

```bash
# CLI flag (one-time)
npx i18n-rosetta sync --source fr
```

```json title="i18n-rosetta.config.json (permanent)"
{
  "inputLocale": "fr"
}
```

## Arquivo de Lock

O Rosetta cria `.i18n-rosetta.lock` para rastrear os hashes SHA-256 dos valores de origem traduzidos. **Faça o commit deste arquivo** para que todos os desenvolvedores compartilhem a mesma base de tradução.

Quando um valor de origem muda, o hash não corresponde mais, e o Rosetta retraduz essa chave na próxima sincronização.

## `.rosettaignore`

Crie `.rosettaignore` na raiz do seu projeto para excluir arquivos da varredura do `lint`. Usa padrões glob, como `.gitignore`:

```text title=".rosettaignore"
src/components/legacy/**
src/utils/constants.js
**/*.test.js
```

## Diretório `.rosetta/`

O Rosetta cria um diretório `.rosetta/` na raiz do seu projeto para o estado interno. Geralmente, você deve **adicioná-lo ao `.gitignore`** — é uma otimização local, não o código-fonte do projeto:

```gitignore
.rosetta/
```

| Arquivo | Propósito | Commit? |
|------|---------|--------|
| `tm.json` | Cache da Memória de Tradução — armazena traduções anteriores indexadas por texto de origem + localização + método | Não (cache local) |
| `xliff/*.xliff` | Arquivos de exportação XLIFF para revisão de tradutores profissionais | Não (transitório) |
| `methods/` | Manifestos de plugins de métodos instalados | Sim (configuração compartilhada) |
| `backups/` | Backups pré-wrap (criados por `wrap --undo`) | Não (rede de segurança) |

Veja [Memória de Tradução](/docs/concepts/translation-memory) para detalhes sobre `tm.json` e como ele economiza custos de API.

---

## API Programática

Para scripts de build e integrações personalizadas, importe diretamente do pacote:

```javascript
import { GeminiMethod, runSync, resolveConfig } from 'i18n-rosetta';

// Use a method class directly
const gemini = new GeminiMethod();
const result = await gemini.translate(
  ['greeting', 'farewell'],
  { greeting: 'Hello', farewell: 'Goodbye' },
  { target: 'fr', name: 'French', register: 'formal', model: 'gemini-2.5-flash' },
  { cwd: process.cwd() }
);
// result = { greeting: 'Bonjour', farewell: 'Au revoir' }
```

### Exportações Disponíveis

| Exportação | O que faz |
|--------|-------------|
| `TranslationMethod` | Classe base para todos os métodos |
| `LLMMethod` | Classe base para métodos LLM (OpenRouter) |
| `DirectLLMMethod` | Classe base para provedores LLM diretos (OpenAI, Anthropic, Gemini) |
| `OpenAIMethod`, `AnthropicMethod`, `GeminiMethod` | Classes de provedores LLM diretos |
| `DeepLMethod`, `MicrosoftTranslatorMethod`, `LibreTranslateMethod` | Classes de MT (Tradução de Máquina) tradicionais |
| `GoogleTranslateMethod` | Google Cloud Translation |
| `LLMCoachedMethod` | LLM Treinado (OpenRouter + dados de coaching) |
| `APIMethod` | Cliente de API remota |
| `runSync`, `runContentSync` | Pipeline de sincronização completo |
| `resolveConfig`, `resolvePairs` | Resolução de configuração |
| `validateTranslations` | Quality gate |
| `loadCoachingData`, `findDictionaryMatches` | Utilitários de coaching |

### Extensão de Provedor Personalizado

Estenda `DirectLLMMethod` para adicionar um novo provedor LLM em cerca de 40 linhas:

```javascript
import { DirectLLMMethod } from 'i18n-rosetta';

class MistralMethod extends DirectLLMMethod {
  constructor(options) {
    super(options);
    this.name = 'mistral';
  }
  _getApiKeyEnvVar()     { return 'MISTRAL_API_KEY'; }
  _getApiKeyOptionsKey() { return 'mistralApiKey'; }
  _getDefaultModel()     { return 'mistral-large-latest'; }
  _getProviderLabel()    { return 'Mistral'; }

  _buildApiRequest({ prompt, systemMessage, apiKey, model, temperature }) {
    return {
      url: 'https://api.mistral.ai/v1/chat/completions',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: {
        model,
        messages: [
          ...(systemMessage ? [{ role: 'system', content: systemMessage }] : []),
          { role: 'user', content: prompt },
        ],
        temperature,
      },
    };
  }

  _extractResponseText(json) {
    return json.choices?.[0]?.message?.content;
  }

  // Optional but recommended: provider-specific setup help when translation fails
  getSetupHelp() {
    if (!process.env.MISTRAL_API_KEY) {
      return [
        '',
        '  ┌─ Missing API Key ─────────────────────────────────────────────┐',
        '  │ Mistral requires an API key from https://console.mistral.ai   │',
        '  │ Run: export MISTRAL_API_KEY=...                               │',
        '  └────────────────────────────────────────────────────────────────┘',
      ];
    }
    return ['        API key is set but translation failed. Check your Mistral dashboard.'];
  }
}
```

Você ganha tradução, coaching, loops de repetição, validação de modelo, níveis de qualidade e ajuda de configuração de graça. Apenas o formato da requisição HTTP é específico do provedor. Para adaptadores não-LLM que usam `fetch()` bruto, use o auxiliar compartilhado `fetchWithRetry()` de `lib/methods/fetch-with-retry.js` em vez de escrever seu próprio loop de repetição.

---

## Veja Também

- [Referência da CLI](/docs/reference/cli) — todos os comandos e flags
- [Métodos de Tradução](/docs/guides/translation-methods) — escolhendo e misturando métodos
- [Memória de Tradução](/docs/concepts/translation-memory) — cache e economia de custos
- [Trabalhando com Tradutores Profissionais](/docs/guides/professional-translators) — fluxo de trabalho com XLIFF
- [Especificação de Plugin](/docs/reference/plugin-spec) — formato do manifesto de plugin de método
- [Arquitetura](/docs/concepts/architecture) — como as peças se conectam
- [Idiomas Suportados](/docs/reference/supported-languages) — suporte a idiomas integrado
- [Como Funciona a Sincronização](/docs/concepts/how-sync-works) — o pipeline de tradução