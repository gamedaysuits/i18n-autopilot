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

O rosetta detecta automaticamente seus arquivos de locale, formato e idiomas de destino. Ele traduz o que está faltando, ignora o que já foi feito, valida cada resultado e gera uma saída limpa. Esse é apenas o ponto de partida.

---

## Por que não criar um script você mesmo?

Você poderia escrever um loop rápido que chama o Google Translate para cada chave. A maioria dos desenvolvedores faz isso — leva cerca de 30 linhas. Aqui é onde isso falha:

- **Sem detecção de mudanças.** Atualize uma string em inglês — a tradução continuará desatualizada para sempre. O rosetta rastreia cada valor de origem com hashes SHA-256 e retraduz apenas o que mudou.
- **Sem batching (processamento em lote).** Uma chamada de API por chave significa que 200 chaves = 200 idas e vindas. O rosetta agrupa as requisições de forma inteligente (configurável, padrão de 80 chaves/lote para LLM, 128 para Google).
- **Sem cache.** Cada sync retraduz tudo. A Translation Memory do rosetta faz o cache das traduções por texto de origem + locale + método — executar o sync novamente após a mudança de uma única chave traduz apenas essa chave, não o arquivo inteiro.
- **Sem controle de qualidade (quality gate).** A tradução automática alucina, repete o texto de origem ou gera a saída no script errado. O rosetta valida cada tradução antes de gravá-la — script incorreto, aumento excessivo de tamanho e repetições da origem são detectados e rejeitados.
- **Sem reconhecimento de formato.** Hardcoded para JSON? O rosetta lida com JSON, TOML, YAML e Hugo Markdown (frontmatter + corpo) com detecção automática.
- **Sem controle de método.** Todo par recebe o mesmo método. O rosetta permite que você use o Google Translate para francês, um LLM para japonês e um pipeline customizado hospedado pela comunidade para Cree — no mesmo arquivo de configuração.

O rosetta é a versão de produção desse script.

---

## O que o torna diferente

### Todo método é um plugin

O método de tradução é **configurável por par de idiomas**. Misture Google Translate, LLMs, prompts orientados e APIs customizadas no mesmo projeto:

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

O francês usa o Google Translate (rápido, barato). O japonês usa um LLM premium (cheio de nuances). O Plains Cree usa um plugin orientado com regras gramaticais, dicionários e validação morfológica. O mesmo comando `sync`. O mesmo controle de qualidade. A mesma CLI.

### Prove

Acha que seu método consegue traduzir do inglês para o espanhol? Do turco para o azerbaijano? Do inglês para o Cree?

**Prove.** O [eval harness](https://mtevalarena.org/docs/specifications/harness) complementar avalia qualquer método de tradução com pontuações reproduzíveis e com fingerprint. O [leaderboard](/leaderboard) rastreia cada submissão.

O eval harness e a CLI de produção compartilham a mesma interface de plugin. Um método que pontua bem no harness pode ser usado em produção — se a comunidade cujo idioma ele atende der consentimento. Para idiomas indígenas e de poucos recursos, esse consentimento é importante. Veja [Data Sovereignty](https://mtevalarena.org/docs/sovereignty/data-sovereignty).

```bash
# Benchmark your method (in the eval harness repo)
cd gds-mt-eval-harness
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json --submit

# Use it locally
npx i18n-rosetta sync
```

Mesmo plugin. Conecte e teste.

### O toolkit completo

O rosetta não é apenas `sync`. É um pipeline completo de i18n:

| Comando | O que faz |
|---------|-------------|
| `sync` | Traduz chaves ausentes e desatualizadas (com verificação pós-sync) |
| `watch` | Sincronização automática quando seu arquivo de origem muda |
| `lint` | Escaneia o código-fonte em busca de strings hardcoded |
| `wrap` | Envolve automaticamente strings hardcoded em chamadas `t()` |
| `audit` | Lista todos os marcadores de fallback `[EN]` de execuções anteriores |
| `verify` | Verifica se as traduções estão presentes e corretas (CI gate) |
| `integrity` | Detecta corrupção de placeholders, problemas de codificação e integridade de plurais ICU |
| `seo` | Gera tags hreflang, sitemaps e schema JSON-LD |
| `status` | Mostra a configuração do par, plugins e pontuações de benchmark |
| `provenance` | Audita o licenciamento dos recursos de tradução |
| `plugin` | Instala, remove e lista plugins de método |
| `fonts` | Baixa web fonts para conversores de script PUA |
| `tm` | Gerencia o cache da Translation Memory (estatísticas, limpeza, por locale) |
| `xliff` | Exporta/importa XLIFF 1.2 para revisão por tradutores profissionais |

Quatro deles — `lint`, `sync`, `verify`, `audit` — formam um pipeline de CI que captura strings hardcoded, as traduz, verifica a exatidão e falha a build se algum locale estiver incompleto.

---

## A Arena

O [Method Leaderboard](/leaderboard) é o placar. Cada submissão recebe um fingerprint vinculado a um commit do Git, é versionada para um dataset específico e pontuada pelo mesmo harness. Qualquer pessoa pode enviar.

**O que você consegue provar?** O harness aceita JSON. Os plugins aceitam JSON. Qualquer método que produza JSON pode ser testado:

| Abordagem | Exemplo |
|----------|---------|
| **Coached LLM** | Injeta regras gramaticais e dicionários no prompt de um modelo de fronteira |
| **Modelo fine-tuned** | Treina um modelo aberto em textos paralelos — só não nos dados de avaliação |
| **Pipeline com FST** | LLM gera → transdutor de estados finitos (FST) valida a morfologia → tenta novamente |
| **Modelos encadeados** | Modelo A rascunha → Modelo B pós-edita → Modelo C pontua |
| **Dicionário + LLM** | Força termos conhecidos de um dicionário, deixa o LLM lidar com o resto |
| **Evolutivo** | Gera candidatos, pontua-os, aplica mutação no melhor, repete |
| **Tradução parcial** | Traduz uma amostra à mão, prova que seu LLM corresponde, traduz automaticamente o resto |

Faça fine-tuning de modelos. Faça o deploy de algoritmos evolutivos. Teste respostas de alunos em exames de idiomas. Crie tabelas de pesquisa (lookup tables). Encadeie três modelos. Desde que seu método produza JSON, o harness o pontua e o framework o executa.

:::danger A única regra
**Não treine com os dados de avaliação.** Métodos expostos ao dataset de benchmark serão desqualificados. Faça fine-tuning no que você quiser. Só não no conjunto de testes.
:::

Este é um convite aberto. Se você trabalha com um idioma de poucos recursos — como pesquisador, membro da comunidade, estudante ou apenas alguém que se importa —, crie um método, execute o harness e conquiste a pontuação máxima. O problema não está resolvido. A infraestrutura está aqui.

**[→ Ver o leaderboard](/leaderboard)**

---

## Próximos Passos

**Começando:**
- [Instalação](/docs/getting-started/installation) — Configure em 2 minutos
- [Início Rápido](/docs/getting-started/quick-start) — Execute seu primeiro sync
- [Idiomas Suportados](/docs/reference/supported-languages) — O que está disponível nativamente

**Personalizando sua configuração:**
- [Métodos de Tradução](/docs/guides/translation-methods) — Escolha o método certo por par
- [Translation Memory](/docs/concepts/translation-memory) — Como o cache economiza seu dinheiro
- [Configuração](/docs/getting-started/configuration) — Referência completa de configuração
- [Site Multilíngue no Hugo](/docs/tutorials/hugo-multilingual-site) — Tradução de conteúdo em Markdown

**Indo mais fundo:**
- [Trabalhando com Tradutores Profissionais](/docs/guides/professional-translators) — Fluxo de trabalho de exportação/importação XLIFF
- [Data Sovereignty](https://mtevalarena.org/docs/sovereignty/data-sovereignty) — Princípios OCAP, CARE e de Soberania de Dados Māori
- [Apoie um Idioma de Poucos Recursos](https://mtevalarena.org/docs/community/low-resource-languages) — O desafio que começou tudo
- [Cookbook: Pipeline com FST](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — Crie um pipeline de decomposição
- [Avaliação de MT](https://mtevalarena.org/docs/leaderboard/rules) — Como o harness e o leaderboard funcionam
- [Method Leaderboard](/leaderboard) — Pontuações e submissões ao vivo