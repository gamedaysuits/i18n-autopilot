---
sidebar_position: 9
title: "Guia para Agentes: Usando o i18n-rosetta"
description: "Como agentes de IA podem instalar, configurar e executar o i18n-rosetta para traduzir arquivos de localização."
---
# Guia do Agente: Usando o i18n-rosetta

O i18n-rosetta é uma ferramenta de CLI que traduz os arquivos de localização (locale) do seu aplicativo com um único comando. Este guia é para agentes de IA (ou desenvolvedores trabalhando com agentes de IA) que desejam ir do zero aos arquivos de localização traduzidos rapidamente.

:::tip Já conhece?
Se você precisa apenas dos comandos, pule para a [Referência da CLI](/docs/reference/cli). Se você deseja criar e testar (benchmark) um método de tradução, consulte o [Guia do Agente da Arena](https://mtevalarena.org/docs/getting-started/agent-guide).
:::

---

## Configuração do Ambiente

```bash
# No global install needed — npx runs it directly
npx i18n-rosetta sync
```

**Requisitos:**
- Node.js 18+
- Uma chave de API para o seu provedor de tradução

**Configuração da chave de API** — o rosetta precisa de pelo menos uma chave, dependendo de quais métodos você usa:

```bash
# Option 1: export (session only)
export OPENROUTER_API_KEY="sk-or-..."        # for llm / llm-coached methods
export GOOGLE_TRANSLATE_API_KEY="AIza..."    # for google-translate method

# Option 2: .env file in your project root (persistent, gitignored)
echo 'OPENROUTER_API_KEY=sk-or-...' > .env
```

O Rosetta lê o `.env` automaticamente. Obtenha uma chave do OpenRouter em [openrouter.ai/keys](https://openrouter.ai/keys).

---

## Primeira Sincronização

O Rosetta detecta automaticamente seus arquivos de localização, o formato deles (JSON, TOML, YAML, PO) e seus idiomas de destino:

```bash
npx i18n-rosetta sync
```

**O que acontece:**
1. Carrega o `i18n-rosetta.config.json` (ou detecta as configurações automaticamente)
2. Verifica seu arquivo de localização de origem, nivelando (flatten) as chaves aninhadas
3. Compara com o `.i18n-rosetta.lock` (hashes SHA-256 de valores traduzidos anteriormente)
4. Verifica o `.rosetta/tm.json` em busca de traduções em cache (Translation Memory)
5. Traduz apenas **chaves alteradas, ausentes ou desatualizadas** por meio do método configurado
6. Executa o Quality Gate (5 verificações) em cada tradução
7. Grava as traduções aprovadas no arquivo de localização de destino
8. Atualiza o lock file e o cache da TM

Em uma reexecução típica após alterar uma chave, a etapa 4 fornece 142 chaves do cache e a etapa 5 traduz 1 chave. É por isso que as sincronizações subsequentes são rápidas e baratas.

---

## Configuração

Crie o `i18n-rosetta.config.json` na raiz do seu projeto:

```json
{
  "inputLocale": "en",
  "pairs": {
    "en-fr": { "method": "llm-coached" },
    "en-ja": { "method": "google-translate" },
    "en-crk": { "method": "api", "endpoint": "http://localhost:3000/translate" }
  }
}
```

Campos principais:

| Campo | Propósito | Padrão |
|-------|---------|---------|
| `inputLocale` | Idioma de origem | `en` |
| `pairs` | Mapa de origem→destino com a configuração do método | (obrigatório) |
| `localesDir` | Onde os arquivos de localização ficam | (detectado automaticamente) |
| `model` | Modelo LLM para os métodos `llm`/`llm-coached` | `google/gemini-2.5-flash` |
| `batchSize` | Chaves por chamada de API | 80 (LLM), 128 (Google) |
| `jsonConcurrency` | Traduções de localização paralelas para chaves JSON | 200 |
| `contentConcurrency` | Chamadas de API paralelas para tradução de conteúdo | 48 |

Referência completa: [Configuração](/docs/getting-started/configuration)

---

## Métodos de Tradução

| Método | Quando usar | Custo | Chave de API necessária |
|--------|------------|------|---------------|
| **`llm`** | Uso geral, bom para idiomas com muitos recursos | Por token (depende do modelo) | `OPENROUTER_API_KEY` |
| **`llm-coached`** | Quando você tem regras gramaticais/dicionário para o idioma de destino | Por token + contexto de coaching | `OPENROUTER_API_KEY` |
| **`google-translate`** | Idiomas com muitos recursos onde o GT funciona bem | US$ 20/milhão de caracteres | `GOOGLE_TRANSLATE_API_KEY` |
| **`api`** | Pipeline personalizado hospedado atrás de um endpoint HTTP | Determinado pelo servidor | Nenhuma (o endpoint lida com a autenticação) |
| **`plugin`** | Método pré-empacotado instalado localmente | Varia | Varia |

Detalhes: [Métodos de Tradução](/docs/guides/translation-methods)

---

## Dados de Coaching

Para pares `llm-coached`, os dados de coaching orientam o LLM com conhecimento linguístico explícito. Crie um arquivo de coaching:

```json title="coaching/fr.json"
{
  "grammar_rules": [
    "Use formal register (vous) for all UI text",
    "Adjectives agree in gender and number with the noun"
  ],
  "dictionary": {
    "dashboard": "tableau de bord",
    "settings": "paramètres"
  },
  "style_notes": "Prefer active voice. Avoid anglicisms."
}
```

Referencie-o na configuração do seu par:

```json
"en-fr": { "method": "llm-coached", "coachingFile": "coaching/fr.json" }
```

O Quality Gate verifica se os termos do dicionário realmente aparecem na saída — as violações são registradas como avisos `[TERM]`.

Detalhes: [Dados de Coaching](/docs/concepts/coaching-data)

---

## Quality Gate

Cada tradução passa por cinco verificações automatizadas antes de ser gravada no disco:

| Verificação | O que ela captura | Exemplo |
|-------|----------------|---------|
| **Vazio/em branco** | O modelo não retornou nada | `""` |
| **Eco da origem** | O modelo retornou a entrada em inglês inalterada | `"Welcome"` para japonês |
| **Loop de alucinação** | Trigramas repetidos | `"Qo' Qo' Qo' Qo'"` |
| **Inflação de tamanho** | A saída é 4x+ maior que a origem | Origem de 10 caracteres → saída de 50 caracteres |
| **Conformidade de script** | Script incorreto para a localização | Texto latino para localização em árabe |

As falhas são registradas com o prefixo `[GATE]`. Sem fallbacks silenciosos — se uma tradução falhar, ela será relatada, não aceita silenciosamente.

Detalhes: [Quality Gate](/docs/concepts/quality-gate)

---

## Translation Memory

O Rosetta armazena as traduções em cache no `.rosetta/tm.json`, indexadas por texto de origem + localização + método. Nas sincronizações subsequentes, as chaves inalteradas são fornecidas pelo cache — sem chamadas de API, sem custo.

```
[TM] 142 key(s) served from cache
Translating 3 key(s) to French (llm)... [OK]
```

Para ignorar o cache em uma execução: `npx i18n-rosetta sync --no-tm`

Detalhes: [Translation Memory](/docs/concepts/translation-memory)

---

## Arquivos Gerados

O Rosetta cria vários arquivos no seu projeto. Saiba o que eles são para não excluir ou fazer commit dos arquivos errados acidentalmente:

| Arquivo | Propósito | Git? |
|------|---------|------|
| `.i18n-rosetta.lock` | Hashes SHA-256 dos valores de origem traduzidos (detecção de alterações) | **Sim** — faça commit disso |
| `.i18n-rosetta-content.lock` | O mesmo, mas para arquivos de conteúdo Markdown/MDX | **Sim** — faça commit disso |
| `.rosetta/tm.json` | Cache da Translation Memory | **Sim** — faça commit disso (economiza custos de API para a equipe) |
| `.rosetta/coaching/` | Diretório de dados de coaching | **Sim** — este é o seu conhecimento linguístico |
| `i18n-rosetta.config.json` | Configuração do projeto | **Sim** — faça commit disso |

---

## Padrões Comuns

**Traduzir um par de idiomas:**
```bash
npx i18n-rosetta sync --pair en-fr
```

**Traduzir todos os pares configurados:**
```bash
npx i18n-rosetta sync
```
O Rosetta traduz todas as localizações em paralelo. Com o cache da TM, apenas as chaves alteradas atingem a API.

**Modo de conteúdo (Markdown/MDX para Docusaurus, Hugo, etc.):**
```bash
npx i18n-rosetta sync --content
```
Traduz documentos, postagens de blog e arquivos de conteúdo junto com o JSON de localização. Usa simultaneidade paralela (padrão: 48 chamadas de API simultâneas). Ajuste com `--content-concurrency`.

**Dry run (visualização sem gravar):**
```bash
npx i18n-rosetta sync --dry-run
```

**Forçar a retradução de chaves específicas:**
```bash
npx i18n-rosetta sync --force-keys "hero.title,nav.about"
```

**Forçar a retradução de todos os arquivos de conteúdo:**
```bash
npx i18n-rosetta sync --force-content
```

**Verificar o status da tradução:**
```bash
npx i18n-rosetta status
```
Mostra a cobertura, os níveis de qualidade e as informações do plugin para cada par.

**Auditoria para fallbacks não traduzidos:**
```bash
npx i18n-rosetta audit
```
Lista todos os valores de fallback `[EN]` que precisam de tradução.

---

## Solução de Problemas

| Problema | Solução |
|---------|-----|
| `OPENROUTER_API_KEY not set` | Exporte a chave ou adicione-a ao `.env` na raiz do seu projeto |
| `No locale files found` | Defina `localesDir` na configuração ou certifique-se de que seus arquivos de localização correspondam à nomenclatura padrão (`en.json`, `fr.json`) |
| `[GATE] Script compliance failed` | Sua localização de destino recebeu texto latino em vez do script esperado — tente um modelo diferente ou adicione dados de coaching |
| `[GATE] Source echo` | O modelo retornou o inglês inalterado — dados de coaching ou um modelo diferente geralmente resolvem isso |
| Todas as traduções em cache | Execute com `--no-tm` para ignorar o cache, ou `--force-keys` para chaves específicas |
| Conflitos no lock file | O `.i18n-rosetta.lock` usa hashes SHA-256 — conflitos de mesclagem (merge) são seguros de resolver mantendo qualquer uma das versões e, em seguida, executando a sincronização novamente |

---

## Próximos Passos

- [Início Rápido](/docs/getting-started/quick-start) — passo a passo completo para começar
- [Referência da CLI](/docs/reference/cli) — todos os comandos e flags
- [Como Funciona](/docs/how-it-works) — explicação do pipeline de sincronização
- [A Ponte Eval Harness](/docs/guides/bridge) — como o rosetta se conecta à Arena
- **Quer criar seu próprio método de tradução?** Consulte o [Guia do Agente da Arena](https://mtevalarena.org/docs/getting-started/agent-guide) — crie um método, prove que ele funciona e ganhe prêmios.