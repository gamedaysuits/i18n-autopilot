---
sidebar_position: 7
title: "Para Empresas"
description: "Como organizações podem padronizar a tradução com métodos comprovados em leaderboards, plugins personalizados e deploy com um único comando."
---
# i18n-rosetta para Empresas

Sua equipe traduz conteúdo regularmente. Você tem uma pilha de arquivos de locale, um pipeline de CI e um processo que provavelmente envolve alguém executando o Google Translate manualmente, copiando os resultados para um JSON e torcendo para dar certo. Ou você está pagando por uma plataforma TMS onde fica preso ao motor de tradução de um único fornecedor.

Existe uma maneira melhor.

## A Proposta

1. **Escolha o melhor método para cada idioma** — não o que o seu fornecedor define como padrão
2. **Faça o deploy com um comando** — `npx i18n-rosetta sync` traduz cada locale, cada formato, todas as vezes
3. **Troque de métodos sem alterar o código** — uma mudança de configuração, não uma migração
4. **Seja dono do seu pipeline** — sem vendor lock-in, sem dashboards mensais, sem contas

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "deepl" },
    "en:ja": { "method": "llm", "model": "google/gemini-2.5-pro" },
    "en:de": { "method": "google-translate" },
    "en:ko": { "method": "llm", "register": "polite-haeyo" },
    "en:crk": { "methodPlugin": "crk-coached-v3" }
  }
}
```

O francês usa o DeepL (sua equipe prefere sua fluência europeia). O japonês usa um LLM de ponta. O alemão usa o Google Translate (rápido, barato, bom o suficiente). O coreano usa um LLM com um registro formal. O cree das planícies usa um plugin treinado pela comunidade que obteve a maior pontuação no leaderboard.

**Mesmo comando. Mesmo pipeline de CI. Métodos diferentes por par. Um único arquivo de configuração.**

## O Fluxo de Trabalho Leaderboard → Deploy

:::tip Em breve: CLI do `rosetta leaderboard`
O fluxo de trabalho descrito abaixo é a integração planejada entre o leaderboard do [MT Eval Arena](https://mtevalarena.org) e a CLI do i18n-rosetta. A infraestrutura existe em ambos os lados — a ponte está em desenvolvimento.
:::

O [MT Eval Arena](https://mtevalarena.org) é onde os métodos de tradução passam por benchmark com pontuações reproduzíveis e com fingerprint. Cada método recebe uma pontuação composta em várias métricas (chrF++, correspondência exata, aceitação FST, pontuação semântica). O leaderboard rastreia cada submissão.

O fluxo de trabalho planejado:

```bash
# Browse the leaderboard from your terminal
npx i18n-rosetta leaderboard --pair en:crk

# Output:
# ┌──────┬───────────────────────┬────────────┬──────────┬───────────┐
# │ Rank │ Method                │ Model      │ chrF++   │ Composite │
# ├──────┼───────────────────────┼────────────┼──────────┼───────────┤
# │  1   │ crk-coached-v3        │ gemini-2.5 │ 43.2     │ 0.67      │
# │  2   │ fst-gated-pipeline    │ gpt-4o     │ 41.8     │ 0.63      │
# │  3   │ prompt-baseline       │ claude-4   │ 38.1     │ 0.55      │
# └──────┴───────────────────────┴────────────┴──────────┴───────────┘

# Install the top-scoring method as a plugin
npx i18n-rosetta plugin install crk-coached-v3

# Use it
npx i18n-rosetta sync
```

**Você não constrói o método. Você não treina o modelo. Você escolhe o vencedor e faz o deploy.** Se um método melhor aparecer no leaderboard no mês que vem, você o substitui com um comando.

## O Que Está Disponível Hoje

A ponte entre o leaderboard e a CLI está em desenvolvimento. Aqui está o que funciona agora:

### Métodos integrados (sem necessidade de plugins)

| Método | Melhor Para | Custo |
|--------|----------|------|
| `llm` (padrão) | Foco em qualidade, qualquer idioma | Por token via OpenRouter |
| `gemini` | Qualidade + plano gratuito | Gratuito (limitado), depois por token |
| `google-translate` | Velocidade + volume | $20/M caracteres |
| `deepl` | Idiomas europeus | $25/M caracteres |
| `llm-coached` | Idiomas com dados de coaching | Por token via OpenRouter |
| `api` | Métodos personalizados/hospedados pela comunidade | Self-hosted |

### Métodos via plugin (instalação separada)

Plugins personalizados podem encapsular qualquer lógica de tradução — um modelo fine-tuned, um pipeline com FST-gated, uma API da comunidade ou qualquer outra coisa que produza JSON. Veja [Criar um Plugin](/docs/tutorials/build-a-plugin).

## Fluxo de Trabalho Enterprise

### 1. Avalie sua qualidade atual

```bash
# See what you're getting today
npx i18n-rosetta status

# Output shows: method per pair, cache hit rate, quality gate stats
```

### 2. Execute o eval harness nos candidatos

O [eval harness](https://mtevalarena.org/docs/specifications/harness) permite que você faça o benchmark de vários métodos em relação ao mesmo conjunto de dados. Execute uma varredura (sweep), compare as pontuações e escolha os vencedores:

```bash
# In the eval harness repo
python -m mt_eval_harness.run \
  --methods coached-v3 baseline prompt-tuned \
  --dataset data/your-corpus.json
```

### 3. Configure os vencedores por par

Atualize sua configuração para usar o melhor método por par de idiomas. Idiomas diferentes têm métodos melhores diferentes — esse é o objetivo.

### 4. Integre ao CI/CD

```bash
# In your CI pipeline
npx i18n-rosetta lint        # Catch hardcoded strings
npx i18n-rosetta sync        # Translate what changed
npx i18n-rosetta audit       # Fail if any locale is incomplete
npx i18n-rosetta integrity   # Validate placeholder consistency
```

Três comandos. Zero tradução manual. O pipeline captura strings hardcoded, traduz com os métodos escolhidos e falha a build se algo estiver faltando ou corrompido.

### 5. Revisão profissional (opcional)

Para conteúdos críticos, exporte para XLIFF para revisão humana:

```bash
npx i18n-rosetta xliff export --locale ja --output translations.xliff
# → Send to your translation agency
# → Import corrections back:
npx i18n-rosetta xliff import translations.xliff
```

Traduza o volume principal por máquina. Revise os caminhos críticos com humanos. Pague pelo tempo humano apenas onde importa.

## Modelo de Custos

O rosetta **não tem taxa de licença, nem assinatura mensal, nem preço por usuário (per-seat)**. É uma ferramenta CLI de código aberto (open-source). Você paga apenas pelas chamadas de API de tradução:

| Volume | Google Translate | LLM (Gemini Flash) | LLM (GPT-4o) |
|--------|-----------------|---------------------|---------------|
| 1.000 chaves × 5 locales | ~$0.50 | ~$0.30 (plano gratuito) | ~$2.00 |
| 10.000 chaves × 15 locales | ~$15 | ~$8 | ~$60 |
| 50.000 chaves × 30 locales | ~$75 | ~$40 | ~$300 |

A Memória de Tradução (Translation Memory) significa que você só paga pelas **chaves alteradas** nas sincronizações subsequentes. Se você atualizar 10 strings de 10.000, você paga por 10 traduções, não 10.000.

## vs. Plataformas TMS

| | rosetta | Crowdin / Phrase / Locize |
|---|---|---|
| **Preço** | Gratuito (open source) + custos de API | $50–$500/mês + por usuário |
| **Vendor lock-in** | Nenhum — troque de provedor na configuração | Alto — dados na nuvem deles |
| **Escolha de método** | Qualquer provedor, qualquer modelo, por par | O que eles oferecerem |
| **CI/CD** | Primeira classe (`lint → sync → audit`) | Plugin/webhook |
| **Métodos personalizados** | Sistema de plugins, plugins da comunidade | Não suportado |
| **Quality gate** | Integrado (wrong-script, echo, length) | Varia |
| **Self-hosted** | Sim (LibreTranslate, API personalizada) | Não |

Veja a [comparação completa](/docs/guides/comparison) para mais detalhes.

## Leitura Adicional

- **[Início Rápido](/docs/getting-started/quick-start)** — execute sua primeira sincronização em 60 segundos
- **[Métodos de Tradução](/docs/guides/translation-methods)** — o menu completo de métodos com árvore de decisão
- **[Integração CI/CD](/docs/guides/ci-cd)** — automatize no seu pipeline
- **[Trabalhando com Tradutores Profissionais](/docs/guides/professional-translators)** — exportação/importação de XLIFF
- **[MT Eval Arena](https://mtevalarena.org)** — benchmark e leaderboard
- **[Referência de Configuração](/docs/getting-started/configuration)** — todas as opções de configuração