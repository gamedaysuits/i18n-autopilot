# i18n-rosetta

[![npm version](https://img.shields.io/npm/v/i18n-rosetta.svg)](https://www.npmjs.com/package/i18n-rosetta)
[![CI](https://github.com/gamedaysuits/i18n-rosetta/actions/workflows/ci.yml/badge.svg)](https://github.com/gamedaysuits/i18n-rosetta/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

🌐 **Traduções do README** — *traduzido por rosetta, é claro:*
[Français](docs/README.fr.md) · [Deutsch](docs/README.de.md) · [Español](docs/README.es.md) · [Português](docs/README.pt.md) · [Nederlands](docs/README.nl.md) · [日本語](docs/README.ja.md) · [한국어](docs/README.ko.md) · [简体中文](docs/README.zh.md) · [ไทย](docs/README.th.md) · [Tiếng Việt](docs/README.vi.md) · [Filipino](docs/README.fil.md) · [العربية](docs/README.ar.md)

Traduza seus arquivos de localidade com um único comando:

```bash
npx i18n-rosetta sync
```

Rosetta detecta automaticamente seus arquivos de localidade, seu formato e os idiomas de destino. Ele traduz chaves ausentes, ignora o que já foi feito e escreve os resultados. É isso.

## Por Que Não Apenas Criar um Script Você Mesmo?

Você poderia escrever um script rápido que percorre suas chaves em inglês e chama o Google Translate. A maioria dos desenvolvedores faz isso — leva cerca de 30 linhas. Veja por que isso falha:

- **Sem detecção de mudanças.** Quando você atualiza uma string em inglês, a tradução permanece desatualizada para sempre. Rosetta rastreia cada valor de origem com hashes SHA-256 e retraduz apenas o que mudou.
- **Sem agrupamento.** Uma chamada de API por chave significa 200 chaves = 200 viagens de ida e volta. Rosetta agrupa de forma inteligente (configurável, padrão de 30 chaves/lote para LLM, 128 para Google).
- **Sem portão de qualidade.** A tradução automática alucina, ecoa a fonte de volta ou produz na escrita errada. Rosetta valida cada tradução antes de escrevê-la — escrita errada, inflação de comprimento e ecos de fonte são capturados e rejeitados.
- **Sem reconhecimento de formato.** Hardcoded para JSON? Rosetta lida com JSON, TOML, YAML e Hugo Markdown (frontmatter + corpo) com detecção automática.
- **Sem segurança.** Rosetta protege contra poluição de protótipo, travessia de caminho via códigos de localidade criados e corrupção de bloco de código durante a tradução de Markdown.

Rosetta é a versão de produção desse script.

## Início Rápido

```bash
npm install --save-dev i18n-rosetta
```

### Obtenha uma Chave de API

Rosetta precisa de um backend de tradução. Escolha um:

| Provedor | Chave | Melhor para |
|----------|-----|----------|
| **OpenRouter** (recomendado) | `OPENROUTER_API_KEY` | Projetos com muito conteúdo, Markdown, mais de 200 modelos |
| **OpenAI** | `OPENAI_API_KEY` | Acesso direto ao GPT-4o |
| **Anthropic** | `ANTHROPIC_API_KEY` | Acesso direto ao Claude |
| **Gemini** | `GEMINI_API_KEY` | Camada gratuita disponível |
| **DeepL** | `DEEPL_API_KEY` | Idiomas europeus, suporte a glossário |
| **Google Translate** | `GOOGLE_TRANSLATE_API_KEY` | Mais de 130 idiomas, alto volume |

**Início mais rápido** (gratuito): Inscreva-se em [aistudio.google.com](https://aistudio.google.com/apikey) para uma chave Gemini gratuita:

```bash
export GEMINI_API_KEY=AI...
npx i18n-rosetta sync --method gemini
```

**OpenRouter** (mais de 200 modelos): Inscreva-se em [openrouter.ai](https://openrouter.ai), então:

```bash
export OPENROUTER_API_KEY=sk-or-v1-...
npx i18n-rosetta sync
```

Alternativa **Google Translate** (apenas pares chave-valor — sem reconhecimento de Markdown):

```bash
export GOOGLE_TRANSLATE_API_KEY=...
npx i18n-rosetta sync --method google-translate
```

> **Nota**: Se apenas `GOOGLE_TRANSLATE_API_KEY` estiver definido, rosetta muda automaticamente para o Google Translate. Nenhuma alteração de configuração é necessária. Usa a API REST diretamente — sem SDK, sem conta de serviço, sem `pip install`. Apenas a chave.

É isso. Para mais controle, crie um arquivo de configuração:

```bash
npx i18n-rosetta init                        # guided wizard — walks you through registers, methods, and content
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific languages and default registers
```

Cada idioma vem com **predefinições de registro** — instruções de tom/formalidade pré-construídas e ajustadas ao seu sistema linguístico (vouvoiement para francês, Siezen para alemão, です/ます para japonês, 해요체 para coreano). O assistente de inicialização permite que você navegue e escolha predefinições, ou passe `--yes` para aceitar os padrões.

### Fonte Não Inglesa

Se o seu idioma de origem não for inglês:

```bash
i18n-rosetta sync --source fr                      # CLI flag
```

Ou defina-o permanentemente em sua configuração:

```json
{ "inputLocale": "fr" }
```

## O Que Ele Faz

Você lida com o framework i18n (next-intl, i18next, Hugo). Rosetta lida com os arquivos de tradução.

- **Multi-formato** — JSON, TOML, YAML, Hugo Markdown (front matter + corpo) e XLIFF 1.2
- **Incremental** — Traduz apenas o que mudou (rastreamento de hash SHA-256)
- **Armazenado em cache** — A Memória de Tradução armazena resultados anteriores; reexecutar a sincronização não custa nada para chaves inalteradas
- **Portão de qualidade** — Valida cada tradução: captura alucinações, saída de escrita errada, ecos de fonte e inflação de comprimento
- **Sensível ao conteúdo** — Métodos LLM protegem blocos de código, shortcodes, links e variáveis de interpolação durante a tradução de Markdown
- **Ferramentas de pipeline** — `lint`, `audit`, `integrity`, `seo` para portões de CI
- **Interoperabilidade XLIFF** — Exporta traduções para revisão profissional em ferramentas CAT (memoQ, SDL Trados, Phrase), importa-as de volta
- **Zero dependências** — Apenas built-ins do Node.js. Sem SDKs, sem módulos nativos. Requer Node 20+

## Além do Google Translate

O início rápido faz você começar a usar um LLM ou o Google Translate. Mas o Google Translate suporta cerca de 130 idiomas. Existem mais de 7.000.

**A ideia central de Rosetta: o método de tradução é configurável por par de idiomas.** Use o Google Translate para francês, um LLM com coaching morfológico para Cree das Planícies e uma API hospedada pela comunidade para Quechua — tudo no mesmo projeto, tudo com o mesmo CLI.

```json
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "google-translate" },
    "en:ja": { "method": "llm" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

Se você conseguir descobrir como traduzir um par de idiomas — por meio de engenharia de prompt, dicionários da comunidade, pipelines FST ou modelos ajustados — rosetta permite que você empacote esse método como um plugin e o implante junto com todo o resto.

> Nascido da tradução de um site de produção para o Cree das Planícies, onde não existe uma API pronta para uso. A arquitetura por par não é teórica — ela existe porque um projeto precisava do Google Translate para francês e de um pipeline FST treinado para um idioma indígena, rodando lado a lado no mesmo comando de sincronização.

O [MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness) que o acompanha permite que você compare e avalie abordagens de tradução, e então exporte métodos de trabalho como plugins rosetta. Qualquer pessoa que fale ambos os idiomas pode desenvolver, testar e compartilhar um método de tradução — nenhuma plataforma proprietária é necessária.

### Escolha Seu Método

Rosetta suporta 10 métodos de tradução. Cada par de idiomas pode usar um método diferente.

**Provedores LLM** — melhores para qualidade, reconhecimento de Markdown, compatíveis com coaching:

| Método | Chave | O Que Ele Faz |
|--------|-----|-------------|
| `llm` (padrão) | `OPENROUTER_API_KEY` | LLM via OpenRouter — mais de 200 modelos, roteamento automático |
| `llm-coached` | `OPENROUTER_API_KEY` | LLM + regras gramaticais, dicionários, notas de estilo |
| `openai` | `OPENAI_API_KEY` | API direta do OpenAI (gpt-4o, gpt-4o-mini) |
| `anthropic` | `ANTHROPIC_API_KEY` | API direta do Anthropic (Claude Sonnet, Haiku, Opus) |
| `gemini` | `GEMINI_API_KEY` | API direta do Google Gemini (Flash, Pro) — camada gratuita disponível |

**MT Tradicional** — melhor para velocidade, custo e pares chave-valor de alto volume:

| Método | Chave | O Que Ele Faz |
|--------|-----|-------------|
| `google-translate` | `GOOGLE_TRANSLATE_API_KEY` | Google Cloud Translation API v2 (mais de 130 idiomas) |
| `deepl` | `DEEPL_API_KEY` | DeepL API com suporte a glossário (mais de 30 idiomas) |
| `microsoft-translator` | `MICROSOFT_TRANSLATOR_API_KEY` | Azure Cognitive Services Translator (mais de 100 idiomas) |
| `libretranslate` | *(auto-hospedado)* | LibreTranslate auto-hospedado (AGPL, gratuito) |

**Infraestrutura** — para endpoints personalizados ou hospedados pela comunidade:

| Método | Chave | O Que Ele Faz |
|--------|-----|-------------|
| `api` | *(por provedor)* | Cliente HTTP leve para qualquer endpoint REST |

```bash
# Force a specific method for one run
i18n-rosetta sync --method deepl

# Or configure per pair
```

```json
{
  "pairs": {
    "en:fr": { "method": "deepl" },
    "en:ja": { "method": "openai", "model": "gpt-4o" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

> **Nota**: Métodos de MT tradicionais (Google Translate, DeepL, Microsoft Translator, LibreTranslate) lidam bem com pares chave-valor, mas não podem traduzir conteúdo Markdown com segurança. Para projetos com muito conteúdo, métodos LLM são recomendados — eles protegem explicitamente blocos de código, shortcodes e variáveis de interpolação.

## Plugins

Plugins são receitas de tradução pré-empacotadas para pares de idiomas específicos. Eles são manifestos JSON — não código — que informam ao rosetta qual método usar, com quais configurações e qual qualidade foi avaliada.

```bash
i18n-rosetta plugin install ./french-formal-v1/    # install from directory
i18n-rosetta plugin list                           # see installed plugins
i18n-rosetta plugin remove french-formal-v1        # uninstall
i18n-rosetta status                                # shows quality tiers + benchmarks
```

Consulte [docs/METHOD_PLUGIN_SPEC.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/METHOD_PLUGIN_SPEC.md) para o formato do manifesto.

## Comandos

| Comando | Propósito |
|---------|---------|
| `init` | Assistente de configuração interativo (ou `--yes` para padrões rápidos) |
| `sync` | Traduzir e sincronizar todos os arquivos de localidade |
| `watch` | Sincronização automática em mudanças de arquivo |
| `audit` | Sinalizar localidades incompletas (portão de CI) |
| `lint` | Encontrar strings hardcoded no código-fonte |
| `wrap` | Envolver automaticamente strings hardcoded em chamadas `t()` (com desfazer) |
| `seo` | Gerar hreflang, sitemap.xml ou esquema JSON-LD |
| `integrity` | Verificar corrupção de placeholder, codificação e completude plural ICU |
| `status` | Mostrar configuração de par, métodos, registros e níveis de qualidade |
| `provenance` | Auditoria de licenciamento de recursos de tradução |
| `plugin` | Instalar, remover ou listar plugins de método |
| `fonts` | Baixar fontes da web para conversores de script PUA |
| `tm` | Gerenciar cache de Memória de Tradução (estatísticas, limpar, por localidade) |
| `xliff` | Exportar/importar XLIFF 1.2 para revisão de tradutor profissional |

Execute `i18n-rosetta <command> --help` para obter ajuda detalhada sobre qualquer comando.

Referência completa: [docs/CLI_REFERENCE.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/CLI_REFERENCE.md)

## Configuração

Crie `i18n-rosetta.config.json` ou execute `i18n-rosetta init`:

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "model": "google/gemini-3.5-flash",
  "pairs": {
    "en:fr": { "qualityTier": "high" },
    "en:ja": { "method": "google-translate" }
  }
}
```

| Opção | Padrão | Descrição |
|--------|---------|-------------|
| `inputLocale` | `"en"` | Código do idioma de origem |
| `localesDir` | `"./locales"` | Caminho para os arquivos de localidade |
| `contentDir` | `null` | Diretório de conteúdo do Hugo (habilita a tradução de Markdown) |
| `format` | `"auto"` | Formato do arquivo: `json`, `toml`, `yaml` ou `auto` |
| `model` | `"google/gemini-3.5-flash"` | Modelo padrão do OpenRouter |
| `defaultMethod` | `"llm"` | Método de tradução padrão (substituído pela flag `--method`) |
| `batchSize` | `30` | Chaves por lote de tradução |
| `pairs` | `{}` | Substituições de método, modelo e qualidade por par |

**Substituições por idioma**: Cada idioma possui um [Cartão de Idioma](docs/planning/LANGUAGE_CARD_SPEC.md) — um dos 50 cartões selecionados contendo predefinições de registro, sistemas de formalidade, regras de tipografia e flags de suporte a métodos. Os cartões usam uma [arquitetura de dois níveis](website/docs/concepts/architecture.md) (tempo de execução + referência) para desempenho em escala. Crie um novo cartão com `node scripts/generate-language-card.mjs <code>`. Use chaves de predefinição como atalho, ou escreva texto de registro personalizado:

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
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

**Modo sem configuração**: Sem arquivo de configuração? Rosetta detecta automaticamente os arquivos de localidade, formato e idiomas de destino do seu projeto.

Os valores de idioma podem ser uma chave de predefinição (por exemplo, `"casual-tu"`), texto de registro personalizado ou um objeto (controle total). As substituições de nível de par em `pairs` têm prioridade sobre as configurações de nível de idioma. Execute `npx i18n-rosetta init` para navegar pelas predefinições disponíveis para cada idioma.

Guias de configuração de framework: [docs/INTEGRATION_GUIDES.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/INTEGRATION_GUIDES.md)

## Reforço

- **Backoff exponencial** — 3 tentativas com jitter em erros 429/5xx
- **Tempo limite de requisição de 30s** — AbortController evita travamentos
- **Validação de resposta** — aceita apenas chaves que foram enviadas para tradução
- **Portão de qualidade** — captura loops de alucinação, saída de escrita errada, inflação de comprimento e ecos de fonte
- **Cascata de repetição** — em caso de falha de análise JSON, repete lote → meio lote → chaves individuais (com limite de orçamento via `maxRetries`)
- **Memória de Tradução** — `.rosetta/tm.json` armazena em cache traduções indexadas por texto de origem + localidade + método; chaves inalteradas são servidas do cache em sincronizações subsequentes, eliminando chamadas de API redundantes
- **Cache de prompt** — divisão de mensagem de sistema/usuário permite cache em nível de provedor, reduzindo o custo de token em lotes
- **Aplicação de terminologia** — traduções treinadas são verificadas em relação a termos de dicionário após a resposta do LLM
- **Proteção contra poluição de protótipo** — bloqueia `__proto__`, `constructor`, `prototype`
- **Contenção de caminho** — escritas de arquivo validadas para permanecer dentro dos diretórios configurados
- **Proteção de bloco** — blocos de código, shortcodes, HTML protegidos durante a tradução de conteúdo
- **Fallback explícito** — `--fallback` escreve placeholders prefixados com `[EN]` quando a API está indisponível (ressincronize com uma chave para traduções reais)
- **Sucesso parcial** — um lote falho não bloqueia o restante

## Testes

```bash
npm test                         # all tests
npm run test:unit                # core sync pipeline
npm run test:redteam             # adversarial edge cases
npm run test:format              # TOML/YAML adapters
npm run test:content             # Markdown content parser
npm run test:hugo                # full Hugo E2E
npm run test:lint                # hardcoded string detection
npm run test:pairs               # pair graph resolution
npm run test:methods             # translation method suite
```

**Zero dependências.**

## Licença

MIT