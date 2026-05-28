---
sidebar_position: 2
title: "Como funciona a sincronização"
---
# Como o Sync Funciona

O comando `sync` é a operação principal do rosetta. Aqui está o que acontece quando você executa `npx i18n-rosetta sync`.

## Visão Geral do Pipeline

```mermaid
flowchart TD
    A["Load config\n+ resolve pairs"] --> B["Scan source locale\n(flatten nested keys)"]
    B --> C["Load lock file\n(.i18n-rosetta.lock)"]
    C --> D["Diff: find missing\nand stale keys"]
    D --> TM{"TM lookup"}
    TM -->|Hits| TC["Serve from cache"]
    TM -->|Misses| E{"Keys to translate?"}
    E -->|No| F["Done ✓"]
    E -->|Yes| G["Batch keys\n(default 80/batch)"]
    G --> H["Translate batch\n(method-specific)"]
    H --> I["Quality gate\n(validate each key)"]
    I --> TERM["Terminology check\n(coached pairs)"]
    TERM --> J{"All pass?"}
    J -->|Yes| K["Write to locale file"]
    J -->|Failures| L["Retry cascade:\nfull → half → individual"]
    L --> H
    TC --> I
    K --> TMS["Store new entries\nin TM"]
    TMS --> M["Update lock file\n(SHA-256 hashes)"]
    M --> N["Next pair"]
```

## Passo a Passo

### 1. Resolução de Configuração

O rosetta carrega o `i18n-rosetta.config.json` (ou detecta as configurações automaticamente). Ele resolve:
- O locale de origem e os locales de destino
- O grafo de pares (quais combinações origem→destino processar)
- Configurações de método, modelo e qualidade por par

Antes de escanear os arquivos, o rosetta imprime um cabeçalho de inicialização:

```
i18n-rosetta v3.3.1

[INFO] Detected format: json (auto)
[INFO] Detected framework: Hugo
```

- **Banner de versão**: Mostra a versão instalada para depuração e relato de problemas.
- **Detecção de formato**: Informa o formato do arquivo e se ele foi detectado automaticamente `(auto)` ou configurado explicitamente `(config)`. Suporta `json`, `toml` e `yaml`.
- **Detecção de framework**: Quando `contentDir` está definido, identifica o framework (`Hugo`) para confirmar que o sync de conteúdo está ativo.

### 2. Escaneamento da Origem

O arquivo de locale de origem é carregado e planificado em um mapa chave→valor:

```json
// Input (nested)
{ "hero": { "title": "Welcome", "subtitle": "Build" } }

// Flattened
{ "hero.title": "Welcome", "hero.subtitle": "Build" }
```

### 3. Detecção de Alterações

O rosetta lê o `.i18n-rosetta.lock`, que armazena os hashes SHA-256 dos valores de origem traduzidos anteriormente. Para cada chave, ele verifica:

| Condição | Ação |
|-----------|--------|
| Chave ausente no destino | **Traduzir** |
| Hash de origem alterado desde o último sync | **Retraduzir** (desatualizado) |
| Valor de destino começa com `[EN]` | **Retraduzir** (marcador de fallback legado) |
| Hash de origem inalterado, chave existe | **Ignorar** |

É por isso que o rosetta traduz apenas o que mudou — ele não retraduz o arquivo inteiro a cada sync.

### 4. Agrupamento em Lotes (Batching)

As chaves são agrupadas em lotes (padrão: 80 chaves/lote para LLM, 128 para Google Translate). O agrupamento em lotes reduz as idas e vindas da API enquanto mantém os prompts gerenciáveis.

Durante a tradução, o rosetta exibe uma barra de progresso em linha que é atualizada após a conclusão de cada lote:

```
[INFO] fr.json — 2,847 missing
     ████████████████░░░░░░░░░░░░░░░░ 1,440/2,847 keys
```

A barra é renderizada usando o retorno de carro `\r` para atualizações no mesmo lugar — sem rolagem de tela. Suprimida nos modos `--quiet` e `--json`.

### 4b. Memória de Tradução

Antes do agrupamento em lotes, o rosetta verifica o cache da Memória de Tradução (`.rosetta/tm.json`). Chaves cujo texto de origem + locale + método correspondem a uma tradução anterior são servidas instantaneamente do cache — nenhuma chamada de API é necessária.

```
  [TM] 142 key(s) served from cache
  Translating 3 key(s) to French (llm)... [OK]
```

A TM (Memória de Tradução) é o principal mecanismo de economia de custos. Executar o sync novamente após a alteração de uma única chave traduz apenas essa chave, não o arquivo inteiro. Veja [Memória de Tradução](/docs/concepts/translation-memory) para mais detalhes.

Para ignorar o cache em uma única execução: `i18n-rosetta sync --no-tm`

### 5. Tradução

Cada lote é enviado para o método de tradução configurado:

- **`llm`**: Prompt estruturado para o OpenRouter com instruções de registro e orientação de gênero
- **`llm-coached`**: O mesmo, mas com regras gramaticais, dicionário e notas de estilo injetados
- **`google-translate`**: Requisição em lote para a Google Cloud Translation API v2
- **`api`**: HTTP POST para um endpoint remoto

A mensagem do sistema (registro, orientação de gênero, regras) é idêntica em todos os lotes para um determinado locale, permitindo o **cache de prompt** — provedores como Anthropic e Google armazenam em cache mensagens de sistema repetidas, reduzindo os custos de tokens.

### 6. Quality Gate

Cada tradução é validada antes de ser gravada no disco. Cinco verificações são executadas:

| Verificação | O que ela detecta | Exemplo |
|-------|----------------|---------|
| **Vazio/em branco** | O modelo não retornou nada | `""` |
| **Eco da origem** | O modelo retornou a entrada em inglês | `"Welcome"` para japonês |
| **Loop de alucinação** | Trigramas repetidos | `"Qo' Qo' Qo' Qo'"` |
| **Inflação de tamanho** | A saída é 4x+ maior que a origem | Origem de 10 caracteres → Saída de 50 caracteres |
| **Conformidade de script** | Script incorreto para o locale | Texto latino para locale em árabe |

As falhas são registradas com um prefixo `[GATE]`. Não há fallbacks silenciosos.

Veja [Quality Gate](/docs/concepts/quality-gate) para mais detalhes.

### 6b. Verificação de Terminologia

Para pares com coaching (coached) que possuem um dicionário, o rosetta verifica se o LLM realmente usou a terminologia exigida após a tradução. As violações são registradas como avisos `[TERM]`:

```
[TERM] en→fr: 2 term violation(s)
  • "dashboard" → expected "tableau de bord" but got "panneau"
```

Estes são avisos, não erros de bloqueio — a tradução ainda é gravada.

### 7. Cascata de Retentativas

Em caso de falha na análise (parse) do JSON ou erros no nível do lote, o rosetta tenta novamente com lotes progressivamente menores:

```
Full batch (80 keys) → Failed
  └→ Half batch (40 keys) → 1 failure
      └→ Individual keys (1 each) → Isolates the problem key
```

O orçamento de retentativas é limitado por `maxRetries` (padrão: 3) para evitar gastos descontrolados com tokens.

### 8. Gravação e Lock

As traduções aprovadas são gravadas no arquivo de locale de destino, preservando a estrutura de aninhamento original. O arquivo de lock é atualizado com os novos hashes SHA-256.

### 9. Verificação

Após todos os pares serem processados, o rosetta relê os arquivos de locale gravados no disco e executa uma etapa de verificação (a menos que `--no-verify` esteja definido). Isso detecta a lacuna entre o sync relatar sucesso e as chaves estarem de fato incorretas:

- **Paridade de chaves** — todas as chaves de origem presentes em cada destino
- **Marcadores de fallback `[EN]`** — marcadores legados de execuções anteriores
- **Traduções vazias** — valores em branco que passaram despercebidos
- **Conformidade de script** — locales não latinos com traduções apenas em ASCII
- **Preservação de placeholders** — placeholders ICU correspondem à origem
- **Problemas de codificação** — marcadores BOM, caracteres invisíveis

Isso também está disponível como um comando `i18n-rosetta verify` independente para gates de CI.

## Tradução de Conteúdo (Fase 2)

Para projetos Docusaurus e Hugo, o `sync` executa uma segunda fase após a tradução das chaves JSON. Esta fase traduz arquivos Markdown e MDX (documentação, posts de blog, tutoriais) usando os mesmos métodos e o Quality Gate.

### Como funciona

1. O rosetta descobre todos os arquivos de conteúdo de origem (`.md`, `.mdx`) percorrendo o diretório content/docs
2. Para cada par arquivo × locale, ele verifica um arquivo de lock de conteúdo separado (`.i18n-rosetta-content.lock`) em busca de alterações no hash SHA-256
3. Arquivos alterados ou ausentes são coletados em um pool plano de itens de trabalho
4. O pool é processado com **concorrência paralela** (padrão: 12 chamadas de API simultâneas)

```
Phase 2: content (79 translations to process, 341 skipped, concurrency: 12)

    [1/79] (1%)  docs/concepts/security.md → ja [RE-TRANSLATE] (~3328s left)
    [2/79] (3%)  docs/concepts/security.md → th [RE-TRANSLATE] (~1821s left)
    ...
    [79/79] (100%) blog/v3-2-quality.md → de [OK]

  [OK] Created 79 content file(s), 341 unchanged
```

### Paralelismo

Tanto a Fase 1 (chaves JSON) quanto a Fase 2 (conteúdo) agora são executadas em paralelo:

- **Fase 1**: Todas as traduções de locale são disparadas simultaneamente (padrão: 50 locales simultâneos). Dentro de cada locale, os lotes da API também são executados em paralelo (4 lotes simultâneos). Um sync de 12 locales com 120 chaves é concluído em ~1 minuto em vez de ~15 minutos.
- **Fase 2**: Todas as combinações arquivo×locale são traduzidas como um pool plano (padrão: 12 chamadas de API simultâneas). Arquivos diferentes e locales diferentes são traduzidos simultaneamente.

Controle o paralelismo com `--json-concurrency`, `--content-concurrency` ou `--concurrency` (define ambos):

```bash
# Faster JSON sync (more parallel locale translations)
npx i18n-rosetta sync --json-concurrency 30

# Faster content sync (more parallel API calls)
npx i18n-rosetta sync --content-concurrency 20

# Slower (gentler on rate limits)
npx i18n-rosetta sync --concurrency 4
```

### Proteção de conteúdo

Durante a tradução, o rosetta protege o conteúdo não traduzível:

- **Blocos de código** (delimitados e recuados) são substituídos por placeholders
- Campos de **Frontmatter** que não estão na lista `translatableFields` são preservados como estão
- **Links**, caminhos de imagens e tags HTML são protegidos
- **Shortcodes** e variáveis de interpolação (ex: `{count}`, `{{.Params.title}}`) são protegidos

Após a tradução, todos os placeholders são restaurados e validados. Se algum estiver ausente ou corrompido, a tradução é rejeitada e tentada novamente.

## Sucesso Parcial

Um lote que falhou não bloqueia o restante. Se 9 de 10 lotes forem bem-sucedidos, esses 9 serão gravados. O lote que falhou é registrado, e você pode executar `sync` novamente para tentar de novo.

## Dry Run

Visualize o que mudaria sem gravar nenhum arquivo:

```bash
npx i18n-rosetta sync --dry-run
```

## Forçar Retradução

Force a retradução de chaves específicas mesmo se não tiverem sido alteradas:

```bash
npx i18n-rosetta sync --force-keys "hero.title,nav.about"
```

## Estimativa de Custos

Antes de traduzir, o rosetta gera um **relatório de custos pré-sync** mostrando os custos estimados por par. Isso é executado automaticamente durante cada `sync` — você o vê antes que qualquer chamada de API seja feita.

```
╔══════════════════════════════════════════════════════════╗
║  Cost Estimate                                          ║
╠════════════╦═══════╦════════════╦════════════════════════╣
║ Pair       ║ Keys  ║ Est. Cost  ║ Method                 ║
╠════════════╬═══════╬════════════╬════════════════════════╣
║ en → fr    ║   142 ║ $0.07      ║ google-translate       ║
║ en → ja    ║    38 ║   —        ║ llm (model-dependent)  ║
║ en → crk   ║    38 ║   —        ║ llm-coached            ║
╚════════════╩═══════╩════════════╩════════════════════════╝
```

### O Que É Estimado

Cada método de tradução fornece sua própria estimativa de custo:

| Método | Base de Custo | Precisão |
|--------|-----------|-----------|
| `google-translate` | Taxa publicada pelo Google (US$ 20/milhão de caracteres) | Precisa |
| `llm` | Varia de acordo com o modelo do OpenRouter | Depende do modelo — verifique os [preços do OpenRouter](https://openrouter.ai/models) |
| `llm-coached` | O mesmo que `llm` mais tokens de contexto de coaching | Depende do modelo |
| `api` | Determinado pelo servidor | Desconhecida — não é possível estimar sem consultar o endpoint |

Quando um método não consegue determinar o custo (métodos LLM, APIs remotas), o rosetta relata `—` em vez de adivinhar. Use `--dry` para ver as estimativas de custo sem realmente traduzir.

---

## Veja Também

- [Referência da CLI — sync](/docs/reference/cli#sync) — flags e opções do comando
- [Memória de Tradução](/docs/concepts/translation-memory) — cache e economia de custos
- [Quality Gate](/docs/concepts/quality-gate) — como as traduções são validadas
- [Métodos de Tradução](/docs/guides/translation-methods) — como cada método funciona
- [Trabalhando com Tradutores Profissionais](/docs/guides/professional-translators) — fluxo de trabalho XLIFF
- [Configuração](/docs/getting-started/configuration) — referência de configuração
- [Guia de CI/CD](/docs/guides/ci-cd) — automatizando syncs no seu pipeline