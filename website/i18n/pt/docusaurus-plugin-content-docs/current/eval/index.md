---
sidebar_position: 1
title: "Avaliação de MT"
---
# Avaliação de MT

O rosetta inclui um framework de avaliação de tradução automática projetado para **benchmarking reprodutível** de métodos de tradução — especialmente para idiomas indígenas e de poucos recursos, onde não existem benchmarks de MT padrão e as alegações de qualidade são difíceis de verificar.

---

## O Leaderboard

A peça central é o **[Leaderboard de Métodos](/leaderboard)** — um placar ao vivo, com suporte do Supabase, onde pesquisadores e membros da comunidade enviam e comparam métodos de tradução com avaliação reprodutível e com fingerprint.

Cada envio inclui:

- **Pipeline com fingerprint** — vinculado a um commit específico do Git e hash de configuração, para que os resultados possam ser rastreados até o código exato que os produziu
- **Dataset versionado** — com hash de conteúdo e versionado; as pontuações só são comparáveis dentro da mesma versão do dataset
- **Métricas padronizadas** — toda a pontuação é calculada pelo harness de avaliação compartilhado, eliminando diferenças de implementação
- **Níveis de confiança** — Self-benchmarked, GDS Verified ou Community Validated
- **Rastreamento de custos** — custo de API por envio, para que os trade-offs entre custo e qualidade sejam transparentes

O leaderboard atualmente rastreia três métricas:

| Métrica | Tipo | O que mede |
|--------|------|------------------|
| **chrF++** | F-score de n-grama de caracteres | Métrica de qualidade principal — correlaciona-se bem com o julgamento humano, especialmente para idiomas morfologicamente ricos |
| **Exact Match** | Proporção de correspondências perfeitas | Precisão estrita — com que frequência a tradução é exatamente igual ao padrão-ouro (gold standard)? |
| **FST Acceptance** | Taxa de aprovação morfológica | Para métodos com verificação por transdutor de estados finitos — qual proporção das saídas é morfologicamente válida? |

**[→ Ver o leaderboard](/leaderboard)**

---

## Datasets Disponíveis

### EDTeKLA Development Set v1

O primeiro dataset de avaliação, construído para tradução de Inglês→Plains Cree (SRO). Criado pelo [grupo de pesquisa EdTeKLA](https://spaces.facsci.ualberta.ca/edtekla/) da Universidade de Alberta.

| Propriedade | Valor |
|----------|-------|
| **ID** | `edtekla-dev-v1` |
| **Par de idiomas** | EN → CRK (Plains Cree, ortografia SRO) |
| **Contagem de entradas** | 124 |
| **Licença** | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) |
| **Proveniência** | `gold_standard` (verificado por falantes), `textbook` (materiais educacionais publicados) |

### FLORES+ Devtest

Um benchmark multilíngue de ampla cobertura mantido pela [Open Language Data Initiative (OLDI)](https://huggingface.co/datasets/openlanguagedata/flores_plus).

| Propriedade | Valor |
|----------|-------|
| **Pares de idiomas** | EN → 39 idiomas (todos os idiomas registrados no rosetta) |
| **Contagem de entradas** | 1.012 frases por idioma |
| **Licença** | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| **Fonte** | Originalmente Meta FLORES-200, agora mantido pela OLDI |
| **Localização** | Fixtures pré-extraídas em `test/benchmark/fixtures/` no repositório principal do rosetta |

Consulte [Datasets de Avaliação](/docs/eval/datasets) para ver o esquema completo do dataset, níveis de dificuldade e como criar o seu próprio.

:::danger NÃO TREINE com dados de avaliação

**Estes datasets são apenas para avaliação.** Métodos treinados, com fine-tuning, com prompts few-shot ou de outra forma expostos a dados de avaliação produzirão pontuações artificialmente infladas e serão **desqualificados do leaderboard.**

Isso não é uma sugestão — é a regra mais importante da integridade da avaliação. Use corpora separados para treinamento. Os conjuntos de avaliação devem permanecer invisíveis para o seu modelo durante o desenvolvimento.

Se você estiver usando dados de coaching ou exemplos few-shot, eles devem vir de **fontes completamente separadas**. Em caso de dúvida, não os inclua.
:::

:::warning Não determinismo de LLMs

As saídas de LLMs são não determinísticas. As pontuações representam medições pontuais no tempo sob versões de modelo e configurações de API específicas. Os provedores de modelos podem atualizar pesos, estratégias de decodificação ou filtros de segurança a qualquer momento, o que pode causar desvios nas pontuações (score drift) entre as execuções. O leaderboard registra o slug exato do modelo e o timestamp de cada envio.
:::

---

## O Que Faz um Bom Método

Nem todos os métodos são criados iguais. Aqui está o que separa um trabalho rigoroso de pontuações infladas.

### Características de um método forte

- **Separação clara entre dados de treino e avaliação** — seu método nunca viu o conjunto de avaliação durante o desenvolvimento, tuning, engenharia de prompt ou seleção de exemplos few-shot
- **Reprodutível** — outra pessoa pode clonar seu repositório, executar o harness e obter as mesmas pontuações (dentro dos limites do não determinismo do LLM)
- **Documentado** — seu [method card](/docs/eval/methods) descreve o que seu método faz, quais ferramentas ele usa e quais são suas limitações
- **Honesto sobre o escopo** — se o seu método funciona apenas para um par de idiomas, diga isso; se ele se degrada em certos padrões morfológicos, documente isso
- **Consciente da comunidade** — para idiomas indígenas, seu método respeita a soberania dos dados. Você consultou as comunidades linguísticas ou usou apenas dados com licença aberta

### Sinais de alerta (o que causa desqualificação)

| Sinal de Alerta | Por que é um problema |
|----------|--------------------|
| Treinar com dados de avaliação | Anula completamente o propósito da avaliação. Pontuações infladas enganam a todos. |
| Cherry-picking de resultados | Executar 10 vezes e enviar a melhor execução sem divulgar as outras |
| Pós-processamento não divulgado | Corrigir saídas manualmente antes da pontuação |
| Dados de coaching contaminados | Usar exemplos do conjunto de avaliação como prompts few-shot ou entradas de dicionário |
| Alegar prontidão comercial sem proveniência | Se o seu método usa dados CC BY-NC-SA, ele não está pronto para uso comercial |

### Níveis de qualidade no leaderboard

O leaderboard suporta três níveis de confiança:

| Nível | Significado | Como obter |
|------|---------|---------------|
| **Self-benchmarked** | Você mesmo executou o harness e enviou os resultados | Abra um PR com seu run card |
| **GDS Verified** | Os mantenedores do rosetta reproduziram seus resultados | Envie seu método como um plugin instalável |
| **Community Validated** | Membros independentes da comunidade reproduziram os resultados | Em breve |

---

## Como Enviar

1. **Construa seu método** — veja [Construindo um Método](/docs/eval/methods) para a interface do método
2. **Execute o harness** — veja [Eval Harness](/docs/eval/harness) para configuração e uso
3. **Gere um run card** — o harness produz um run card em JSON com suas pontuações, fingerprint e metadados
4. **Abra um PR** — envie seu run card para o [repositório do eval harness](https://github.com/gamedaysuits/gds-mt-eval-harness)
5. **Apareça no leaderboard** — após o merge, seus resultados aparecerão no [Leaderboard de Métodos](/leaderboard)

---

## Direções Futuras

- **Execuções de comparação de modelos FLORES+** — avaliação sistemática de modelos de fronteira (GPT-5.5, Claude Opus 4.7, Gemini 3.1 Pro, etc.) em todos os 39 idiomas do rosetta
- **Mais pares de idiomas** — Quechua, Inuktitut e outros idiomas de poucos recursos à medida que datasets verificados pela comunidade se tornarem disponíveis
- **Importação de datasets** — ferramentas para converter datasets de avaliação externos (WMT, Tatoeba, etc.) para o formato de avaliação do rosetta
- **Reexecuções automatizadas** — detecção de mudanças de versão de modelos e reexecução de benchmarks para rastrear desvios de pontuação (score drift)

---

## Veja Também

- **[Leaderboard de Métodos](/leaderboard)** — pontuações ao vivo e envios
- **[Eval Harness](/docs/eval/harness)** — como executar avaliações
- **[Datasets de Avaliação](/docs/eval/datasets)** — formato do dataset e datasets disponíveis
- **[Construindo um Método](/docs/eval/methods)** — a especificação da interface do método
- **[Especificação do Run Card](/docs/eval/run-card)** — o schema JSON do run card
- **[Apoie um Idioma de Poucos Recursos](/docs/guides/low-resource-languages)** — o contexto mais amplo de por que este framework existe