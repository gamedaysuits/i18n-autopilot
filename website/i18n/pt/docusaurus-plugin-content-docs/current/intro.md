---
sidebar_position: 1
slug: /
title: "Introdução"
---
# i18n-rosetta

Um framework de internacionalização totalmente personalizável. Um comando traduz seus arquivos de locale. Uma configuração controla cada método, modelo e par de idiomas. E se os métodos integrados não forem suficientes — crie o seu próprio, prove que funciona e faça o deploy.

```bash
npx i18n-rosetta sync
```

O rosetta detecta automaticamente seus arquivos de locale, formato e idiomas de destino. Ele traduz o que está faltando, ignora o que já foi feito, valida cada resultado e gera uma saída limpa. Essa é apenas a linha de partida.

---

## Por que não criar um script você mesmo?

Você poderia escrever um loop rápido que chama o Google Translate em cada chave. A maioria dos desenvolvedores faz isso — leva cerca de 30 linhas. Aqui é onde isso falha:

- **Sem detecção de mudanças.** Atualize uma string em inglês — a tradução fica desatualizada para sempre. O rosetta rastreia cada valor de origem com hashes SHA-256 e retraduz apenas o que mudou.
- **Sem processamento em lote (batching).** Uma chamada de API por chave significa 200 chaves = 200 idas e vindas. O rosetta agrupa de forma inteligente (configurável, padrão de 30 chaves/lote para LLM, 128 para Google).
- **Sem controle de qualidade.** A tradução automática tem alucinações, repete a origem ou gera a saída no alfabeto errado. O rosetta valida cada tradução antes de gravá-la — alfabeto errado, inflação de tamanho e repetições da origem são detectados e rejeitados.
- **Sem reconhecimento de formato.** Hardcoded para JSON? O rosetta lida com JSON, TOML, YAML e Hugo Markdown (frontmatter + body) com detecção automática.
- **Sem controle de método.** Todo par recebe o mesmo método. O rosetta permite que você use o Google Translate para francês, um LLM para japonês e um pipeline personalizado hospedado pela comunidade para Cree — no mesmo arquivo de configuração.

O rosetta é a versão de produção desse script.

---

## O que o torna diferente

### Cada método é um plugin

O método de tradução é **configurável por par de idiomas**. Misture Google Translate, LLMs, prompts treinados (coached prompts) e APIs personalizadas no mesmo projeto:

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "google-translate" },
    "en:ja": { "method": "llm", "model": "google/gemini-2.5-pro" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

O francês usa o Google Translate (rápido, barato). O japonês usa um LLM premium (cheio de nuances). O Plains Cree usa um plugin treinado com regras gramaticais, dicionários e validação morfológica. O mesmo comando `sync`. O mesmo controle de qualidade. A mesma CLI.

### Prove que funciona

Acha que o seu método consegue traduzir de inglês para espanhol? De turco para azerbaijano? De inglês para Cree?

**Prove.** O [eval harness](/docs/eval/harness) complementar avalia qualquer método de tradução com pontuações reproduzíveis e com fingerprint. O [leaderboard](/leaderboard) rastreia cada envio.

O eval harness e a CLI de produção compartilham a mesma interface de plugin. Um método que pontua bem no harness pode ser usado em produção — se a comunidade cujo idioma ele atende der consentimento. Para idiomas indígenas e de poucos recursos (low-resource languages), esse consentimento é importante. Veja [Data Sovereignty](/docs/guides/data-sovereignty).

```bash
# Benchmark your method (in the eval harness repo)
cd gds-mt-eval-harness
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json --submit

# Use it locally
npx i18n-rosetta sync
```

O mesmo plugin. Conecte e teste.

### O kit de ferramentas completo

O rosetta não é apenas `sync`. É um pipeline completo de i18n:

| Comando | O que ele faz |
|---------|-------------|
| `sync` | Traduz chaves ausentes, desatualizadas e de fallback |
| `watch` | Sincroniza automaticamente quando seu arquivo de origem muda |
| `lint` | Verifica o código-fonte em busca de strings hardcoded |
| `wrap` | Envolve automaticamente strings hardcoded em chamadas `t()` |
| `audit` | Lista todos os valores de fallback `[EN]` não traduzidos |
| `integrity` | Detecta corrupção de placeholders e problemas de codificação |
| `seo` | Gera tags hreflang, sitemaps e JSON-LD |
| `status` | Mostra a configuração do par, plugins e pontuações de benchmark |
| `provenance` | Audita o licenciamento dos recursos de tradução |
| `plugin` | Instala, remove e lista plugins de método |

Três deles — `lint`, `sync`, `audit` — formam um pipeline de CI que captura strings hardcoded, as traduz e falha a build se algum locale estiver incompleto.

---

## A Arena

O [Method Leaderboard](/leaderboard) é o placar. Cada envio recebe um fingerprint vinculado a um commit do Git, é versionado para um dataset específico e pontuado pelo mesmo harness. Qualquer pessoa pode enviar.

**O que você pode provar?** O harness aceita JSON. Os plugins aceitam JSON. Qualquer método que produza JSON pode ser testado:

| Abordagem | Exemplo |
|----------|---------|
| **Coached LLM** | Injeta regras gramaticais e dicionários no prompt de um modelo de fronteira (frontier model) |
| **Fine-tuned model** | Treina um modelo aberto em textos paralelos — apenas não nos dados de avaliação |
| **FST-gated pipeline** | LLM gera → transdutor de estado finito (FST) valida a morfologia → tenta novamente |
| **Chained models** | Modelo A rascunha → Modelo B pós-edita → Modelo C pontua |
| **Dictionary + LLM** | Força termos conhecidos de um dicionário, deixa o LLM lidar com o resto |
| **Evolutionary** | Gera candidatos, os pontua, sofre mutação no melhor, repete |
| **Partial translation** | Traduz uma amostra à mão, prova que seu LLM corresponde, traduz automaticamente o resto |

Faça fine-tuning de modelos. Implante algoritmos evolutivos. Teste respostas de alunos em exames de idiomas. Crie tabelas de pesquisa (lookup tables). Encadeie três modelos juntos. Desde que o seu método produza JSON, o harness o pontua e o framework o executa.

:::danger A única regra
**Não treine com os dados de avaliação.** Métodos expostos ao dataset de benchmark serão desqualificados. Faça fine-tuning no que quiser. Apenas não no conjunto de testes.
:::

Este é um convite aberto. Se você trabalha com um idioma de poucos recursos (low-resource language) — como pesquisador, membro da comunidade, estudante ou apenas alguém que se importa — crie um método, execute o harness e conquiste a pontuação máxima. O problema não está resolvido. A infraestrutura está aqui.

**[→ Ver o leaderboard](/leaderboard)**

---

## Próximos Passos

**Começando:**
- [Instalação](/docs/getting-started/installation) — Configure em 2 minutos
- [Início Rápido](/docs/getting-started/quick-start) — Execute sua primeira sincronização
- [Idiomas Suportados](/docs/reference/supported-languages) — O que está disponível nativamente

**Personalizando sua configuração:**
- [Métodos de Tradução](/docs/guides/translation-methods) — Escolha o método certo por par
- [Configuração](/docs/getting-started/configuration) — Referência completa de configuração
- [Site Multilíngue Hugo](/docs/tutorials/hugo-multilingual-site) — Tradução de conteúdo Markdown

**Indo mais fundo:**
- [Soberania de Dados](/docs/guides/data-sovereignty) — Princípios OCAP, CARE e Soberania de Dados Māori
- [Apoie um Idioma de Poucos Recursos](/docs/guides/low-resource-languages) — O desafio que começou tudo
- [Cookbook: FST-Gated Pipeline](/docs/tutorials/fst-gated-pipeline) — Crie um pipeline de decomposição
- [Avaliação de MT](/docs/eval/) — Como o harness e o leaderboard funcionam
- [Method Leaderboard](/leaderboard) — Pontuações ao vivo e envios