---
sidebar_position: 3
title: "Quality Gate"
---
# Quality Gate

Toda tradução passa por um portão de validação determinístico antes de ser gravada em disco. O quality gate captura modos de falha comuns em traduções automáticas — sem fallbacks silenciosos, sem lixo gravado nos seus arquivos de localidade.

## Verificações de Validação

| Verificação | O que captura | Rótulo do Gate |
|-------|----------------|-----------|
| **Vazio/em branco** | O modelo retornou uma string vazia ou espaços em branco | `[GATE] empty` |
| **Eco da origem** | O modelo retornou a entrada original em inglês | `[GATE] source-echo` |
| **Loop de alucinação** | Padrões de trigramas repetidos (ex., `"Qo' Qo' Qo'"`) | `[GATE] hallucination` |
| **Inflação de tamanho** | A saída é significativamente mais longa que a origem | `[GATE] length` |
| **Conformidade de script** | Script incorreto para a localidade de destino | `[GATE] script` |
| **Categorias de plural ICU** | Faltam formas de plural obrigatórias para a localidade | `[GATE] icu-plural` |

### Vazio/Em branco

Rejeita traduções que são strings vazias, contêm apenas espaços em branco ou `null`. Isso captura modelos que não retornam nada para chaves difíceis.

### Eco da Origem

Detecta quando o modelo retorna o texto de origem em inglês em vez de traduzi-lo. Comum em strings curtas e prompts mal especificados.

### Loop de Alucinação

Analisa padrões de trigramas (3 caracteres) na saída. Se algum trigrama se repetir mais do que um número limite de vezes em relação ao tamanho da saída, a tradução é rejeitada. Isso captura saídas degeneradas como `"Qo' Qo' Qo' Qo' Qo'"`.

### Inflação de Tamanho

Rejeita traduções onde o tamanho da saída excede `maxLengthRatio × source length` (padrão: 4×). Isso captura alucinações do modelo que produzem paredes de texto para uma entrada curta.

Configurável via `maxLengthRatio` na sua configuração.

### Conformidade de Script

Para localidades com um campo `script` configurado (ex., `"script": "cans"` para Plains Cree Syllabics), valida se a saída contém caracteres não-ASCII apropriados para o script de destino. Uma saída apenas em latim para uma localidade em árabe, CJK ou silábica é rejeitada.

## O Que Acontece em Caso de Falha

1. A tradução que falhou é registrada no stderr com um prefixo `[GATE]`, o nome da chave, o motivo e uma prévia do valor
2. A chave **não** é gravada no arquivo de localidade
3. A cascata de novas tentativas (retry cascade) entra em ação (veja abaixo)

```
[GATE] hero.title: source-echo — "Welcome to our platform"
[GATE] nav.about: hallucination — "À À À À À À À À"
```

## Cascata de Novas Tentativas

Quando um lote falha (erro de análise JSON ou rejeições do quality gate), o rosetta tenta novamente com lotes progressivamente menores:

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the 2 problem keys
```

O orçamento de novas tentativas é limitado por `maxRetries` (padrão: 3, configurável por idioma). Isso evita o gasto descontrolado de tokens em chaves que falham consistentemente.

Após esgotar as novas tentativas, as chaves com problema são registradas e ignoradas. Elas serão tentadas novamente na próxima execução do `sync`.

## Cache de Prompt

A mensagem do sistema (registro, regras gramaticais, notas de estilo) é separada da mensagem do usuário (as chaves a serem traduzidas). Essa separação é intencional:

- A mensagem do sistema é **idêntica em todos os lotes** para uma determinada localidade
- Provedores como Anthropic e Google fazem cache de mensagens do sistema repetidas
- Resultado: o primeiro lote paga o custo total de tokens, os lotes subsequentes pagam apenas pela mensagem do usuário

Isso pode reduzir significativamente os custos de tokens para projetos com muitos lotes.

## Validação do ICU MessageFormat

O comando `integrity` valida os padrões de plural do ICU MessageFormat em relação às regras de plural do CLDR. Se o seu arquivo de origem usar a sintaxe ICU como:

```json
"items": "{count, plural, one {# item} other {# items}}"
```

O Rosetta verifica se as versões traduzidas incluem todas as categorias de plural obrigatórias para a localidade de destino. Por exemplo, o árabe exige seis categorias (`zero`, `one`, `two`, `few`, `many`, `other`) — não apenas `one` e `other`.

Execute `i18n-rosetta integrity` para verificar a integridade dos plurais em todas as localidades.

## Aplicação de Terminologia

Para pares treinados (coached pairs) com um dicionário, o rosetta executa uma verificação de terminologia pós-tradução. Após a aprovação no quality gate, ele verifica se o LLM realmente usou os termos obrigatórios do dicionário.

```
[TERM] en→fr: 2 term violation(s)
  • hero.title: "dashboard" → expected "tableau de bord" but got "panneau de contrôle"
```

Violações de terminologia são **avisos, não erros de bloqueio**. A tradução ainda é gravada em disco. Isso é intencional — o LLM pode ter motivos válidos para escolher uma alternativa (contexto, gramática), e bloquear por incompatibilidades de termos causaria mais danos do que benefícios.

Para corrigir violações, atualize o dicionário de treinamento ou edite manualmente o arquivo de localidade.

---

## Veja Também

- [Como o Sync Funciona](/docs/concepts/how-sync-works) — onde o quality gate se encaixa no pipeline
- [Métodos de Tradução](/docs/guides/translation-methods) — métodos que alimentam o gate
- [Conversores de Script](/docs/concepts/script-converters) — conversão de script pós-gate
- [Dados de Treinamento](/docs/concepts/coaching-data) — melhorando a qualidade da tradução no início do processo (upstream)
- [Memória de Tradução](/docs/concepts/translation-memory) — cache de traduções validadas
- [Referência da CLI — sync](/docs/reference/cli#sync) — flags de sincronização, incluindo comportamento de novas tentativas
- [Referência da CLI — integrity](/docs/reference/cli#integrity) — auditoria de plurais ICU