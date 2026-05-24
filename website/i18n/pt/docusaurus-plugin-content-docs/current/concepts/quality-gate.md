---
sidebar_position: 3
title: "Quality Gate"
---
# Quality Gate

Cada tradução passa por um filtro de validação determinístico antes de ser gravada no disco. O quality gate captura falhas comuns de tradução automática — sem fallbacks silenciosos, sem lixo gravado nos seus arquivos de locale.

## Verificações de Validação

| Verificação | O que captura | Rótulo do Filtro |
|-------|----------------|-----------|
| **Vazio/em branco** | O modelo retornou uma string vazia ou espaços em branco | `[GATE] empty` |
| **Eco da origem** | O modelo retornou a entrada original em inglês | `[GATE] source-echo` |
| **Loop de alucinação** | Padrões de trigramas repetidos (ex., `"Qo' Qo' Qo'"`) | `[GATE] hallucination` |
| **Inflação de tamanho** | A saída é significativamente maior que a origem | `[GATE] length` |
| **Conformidade de script** | Script errado para o locale de destino | `[GATE] script` |

### Vazio/Em branco

Rejeita traduções que são strings vazias, contêm apenas espaços em branco ou `null`. Isso captura modelos que não retornam nada para chaves difíceis.

### Eco da Origem

Detecta quando o modelo retorna o texto de origem em inglês em vez de traduzi-lo. Comum em strings curtas e prompts subespecificados.

### Loop de Alucinação

Analisa padrões de trigramas (3 caracteres) na saída. Se algum trigrama se repetir mais do que um número limite de vezes em relação ao tamanho da saída, a tradução é rejeitada. Isso captura saídas degeneradas como `"Qo' Qo' Qo' Qo' Qo'"`.

### Inflação de Tamanho

Rejeita traduções onde o tamanho da saída excede `maxLengthRatio × source length` (padrão: 4×). Isso captura alucinações do modelo que produzem paredes de texto para uma entrada curta.

Configurável via `maxLengthRatio` na sua configuração.

### Conformidade de Script

Para locales com um campo `script` configurado (ex., `"script": "cans"` para Silabários Cree das Planícies), valida se a saída contém caracteres não-ASCII apropriados para o script de destino. Saídas apenas em latim para um locale em árabe, CJK ou silabários são rejeitadas.

## O que Acontece em Caso de Falha

1. A tradução que falhou é registrada no stderr com um prefixo `[GATE]`, o nome da chave, o motivo e uma prévia do valor
2. A chave **não** é gravada no arquivo de locale
3. A cascata de novas tentativas entra em ação (veja abaixo)

```
[GATE] hero.title: source-echo — "Welcome to our platform"
[GATE] nav.about: hallucination — "À À À À À À À À"
```

## Cascata de Novas Tentativas

Quando um lote falha (erro de análise de JSON ou rejeições no quality gate), o rosetta tenta novamente com lotes progressivamente menores:

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the 2 problem keys
```

O orçamento de novas tentativas é limitado por `maxRetries` (padrão: 3, configurável por idioma). Isso evita gastos descontrolados de tokens em chaves que falham consistentemente.

Após esgotar as novas tentativas, as chaves problemáticas são registradas e ignoradas. Elas serão tentadas novamente na próxima execução do `sync`.

## Cache de Prompt

A mensagem do sistema (registro, regras gramaticais, notas de estilo) é separada da mensagem do usuário (as chaves a serem traduzidas). Essa divisão é intencional:

- A mensagem do sistema é **idêntica entre os lotes** para um determinado locale
- Provedores como Anthropic e Google fazem cache de mensagens do sistema repetidas
- Resultado: o primeiro lote paga o custo total de tokens, os lotes subsequentes pagam apenas pela mensagem do usuário

Isso pode reduzir significativamente os custos de tokens para projetos com muitos lotes.

---

## Veja Também

- [Como o Sync Funciona](/docs/concepts/how-sync-works) — onde o quality gate se encaixa no pipeline
- [Métodos de Tradução](/docs/guides/translation-methods) — métodos que alimentam o filtro
- [Conversores de Script](/docs/concepts/script-converters) — conversão de script pós-filtro
- [Dados de Treinamento](/docs/concepts/coaching-data) — melhorando a qualidade da tradução na origem
- [Referência da CLI — sync](/docs/reference/cli#sync) — flags do sync, incluindo o comportamento de novas tentativas