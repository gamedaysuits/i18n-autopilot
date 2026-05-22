---
sidebar_position: 3
title: "Quality Gate"
---
# Quality Gate

Cada tradução passa por um portão de validação determinístico antes de ser gravada em disco. O Quality Gate captura modos de falha comuns de tradução automática — sem fallbacks silenciosos, sem lixo gravado em seus arquivos de localidade.

## Verificações de Validação

| Verificação | O Que Captura | Rótulo do Portão |
|-------|----------------|-----------|
| **Vazio/em branco** | O modelo retornou uma string vazia ou espaço em branco | `[GATE] empty` |
| **Eco da origem** | O modelo retornou a entrada original em inglês | `[GATE] source-echo` |
| **Loop de alucinação** | Padrões de trigramas repetidos (ex., `"Qo' Qo' Qo'"`) | `[GATE] hallucination` |
| **Inflação de comprimento** | A saída é significativamente mais longa que a origem | `[GATE] length` |
| **Conformidade de script** | Script incorreto para a localidade de destino | `[GATE] script` |

### Vazio/Em Branco

Rejeita traduções que são strings vazias, apenas espaços em branco ou `null`. Isso captura modelos que não retornam nada para chaves difíceis.

### Eco da Origem

Detecta quando o modelo retorna o texto de origem em inglês em vez de traduzi-lo. Comum em strings curtas e prompts subespecificados.

### Loop de Alucinação

Analisa padrões de trigramas (3 caracteres) na saída. Se algum trigrama se repetir mais do que um número limite de vezes em relação ao comprimento da saída, a tradução será rejeitada. Isso captura saídas degeneradas como `"Qo' Qo' Qo' Qo' Qo'"`.

### Inflação de Comprimento

Rejeita traduções onde o comprimento da saída excede `maxLengthRatio × source length` (padrão: 4×). Isso captura alucinações do modelo que produzem paredes de texto para uma entrada curta.

Configurável via `maxLengthRatio` em sua configuração.

### Conformidade de Script

Para localidades com um campo `script` configurado (ex., `"script": "cans"` para Plains Cree Syllabics), valida se a saída contém caracteres não ASCII apropriados para o script de destino. Uma saída apenas em latim para uma localidade em árabe, CJK ou silábica é rejeitada.

## O Que Acontece em Caso de Falha

1. A tradução com falha é registrada no stderr com um prefixo `[GATE]`, o nome da chave, o motivo e uma visualização do valor
2. A chave **não** é gravada no arquivo de localidade
3. A cascata de novas tentativas é iniciada (veja abaixo)

```
[GATE] hero.title: source-echo — "Welcome to our platform"
[GATE] nav.about: hallucination — "À À À À À À À À"
```

## Cascata de Novas Tentativas

Quando um lote falha (erro de análise JSON ou rejeições do Quality Gate), o rosetta tenta novamente com lotes progressivamente menores:

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the 2 problem keys
```

O orçamento de novas tentativas é limitado por `maxRetries` (padrão: 3, configurável por idioma). Isso evita o gasto descontrolado de tokens em chaves que falham consistentemente.

Após esgotar as novas tentativas, as chaves com problema são registradas e ignoradas. Elas serão tentadas novamente na próxima execução do `sync`.

## Cache de Prompt

A mensagem do sistema (registro, regras gramaticais, notas de estilo) é separada da mensagem do usuário (as chaves a serem traduzidas). Essa separação é intencional:

- A mensagem do sistema é **idêntica entre os lotes** para uma determinada localidade
- Provedores como Anthropic e Google armazenam em cache mensagens de sistema repetidas
- Resultado: o primeiro lote paga o custo total de tokens, os lotes subsequentes pagam apenas pela mensagem do usuário

Isso pode reduzir significativamente os custos de tokens para projetos com muitos lotes.