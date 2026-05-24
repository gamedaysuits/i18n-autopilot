---
sidebar_position: 2
title: "Eval Harness v2.0"
---
# Eval Harness v2.0

O harness executa experimentos de tradução e produz run cards. Ele lida com a construção de prompts, chamadas de API, pontuação e serialização de resultados — você fornece o dataset e o modelo.

## Instalação

**Requisitos:** Python 3.10+

```bash
pip install sacrebleu aiohttp
```

Clone o repositório do harness:

```bash
git clone https://github.com/gamedaysuits/gds-mt-eval-harness.git
cd gds-mt-eval-harness
```

## Uso

```bash
python eval/baseline_experiment.py --dataset path/to/dataset.json
```

Isso executa cada entrada no dataset através do modelo configurado, pontua as saídas e grava um arquivo JSON de run card no diretório `results/`.

## Flags da CLI

| Flag | Obrigatório | Padrão | Descrição |
|------|----------|---------|-------------|
| `--dataset` | ✅ | — | Caminho para o arquivo JSON do dataset de avaliação |
| `--model` | — | `openai/gpt-4o` | Slug do modelo no OpenRouter (ex., `google/gemini-2.5-pro`) |
| `--condition` | — | `baseline` | Rótulo do experimento. Use para distinguir estratégias de prompt (ex., `coached`, `few-shot`, `dictionary-augmented`) |
| `--temperature` | — | `0.3` | Temperatura de amostragem. Mais baixa = mais determinística |
| `--batch-size` | — | `5` | Número de entradas por lote simultâneo da API |
| `--fst-analyzer` | — | `null` | Caminho para um binário do FST analyzer. Quando fornecido, cada saída é testada quanto à aceitação morfológica |
| `--submit` | — | `false` | Envia o run card para a API do leaderboard após a conclusão da execução |

### Exemplos

```bash
# Run with defaults (GPT-4o, baseline condition)
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json

# Coached experiment with Gemini, lower temperature
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --model google/gemini-2.5-pro \
  --condition coached-v3 \
  --temperature 0.1

# Run with FST validation and auto-submit
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --fst-analyzer ./bin/crk-analyzer \
  --submit
```

---

## Esquema do Run Card

Cada experimento produz um **run card** — um documento JSON autossuficiente. A estrutura de nível superior:

```json
{
  "run_id": "uuid-v4",
  "harness_version": "2.0",
  "model_slug": "openai/gpt-4o",
  "model_id": "gpt-4o-2024-08-06",
  "condition": "baseline",
  "timestamp": "2025-05-20T03:22:41Z",
  "elapsed_seconds": 142.7,
  "dataset": { ... },
  "config": { ... },
  "system_prompt_sha256": "abc123...",
  "system_prompt_used": "You are a translator...",
  "fingerprint": { ... },
  "scores": { ... },
  "totals": { ... },
  "environment": { ... },
  "results": [ ... ],
  "run_card_hash": "sha256-of-entire-card"
}
```

Consulte a [Especificação do Run Card](/docs/eval/run-card) para ver o esquema completo com todos os campos documentados.

### Blocos Principais

**`dataset`** — Identifica qual dataset foi usado, incluindo o hash do seu conteúdo para que os resultados fiquem vinculados a uma versão específica:

```json
{
  "id": "edtekla-dev-v1",
  "version": "1.0",
  "language_pair": "EN→CRK",
  "sha256": "...",
  "entry_count": 124
}
```

**`scores`** — Métricas agregadas para a execução:

```json
{
  "total": 124,
  "exact_matches": 12,
  "exact_match_rate": 0.0968,
  "fst_accepted": 87,
  "fst_acceptance_rate": 0.7016,
  "chrf_plus_plus": 42.31,
  "errors": 0,
  "avg_latency_seconds": 1.15,
  "median_latency_seconds": 1.02,
  "p95_latency_seconds": 2.34,
  "by_difficulty": { ... },
  "by_provenance": { ... }
}
```

**`totals`** — Uso de tokens e rastreamento de custos:

```json
{
  "prompt_tokens": 48200,
  "completion_tokens": 3100,
  "reasoning_tokens": 0,
  "cached_tokens": 12000,
  "total_cost_usd": 0.42,
  "cost_per_entry_usd": 0.0034,
  "reasoning_ratio": 0.0
}
```

---

## Fingerprint vs Hash do Run Card

O harness produz dois hashes distintos. Eles servem a propósitos diferentes:

### Fingerprint

O **fingerprint** responde: *"Esta execução poderia ser reproduzida?"*

Ele faz o hash da combinação de entradas que definem a configuração do experimento — não das saídas:

- SHA-256 do dataset
- Slug do modelo
- Rótulo da condição
- SHA-256 do system prompt
- Temperatura
- Versão do harness

Duas execuções com fingerprints idênticos usaram a mesma configuração. Seus resultados devem ser comparáveis (exceto pelo não determinismo da API).

### Hash do Run Card

O **hash do run card** responde: *"Este arquivo de resultado específico foi adulterado?"*

É o SHA-256 de todo o JSON do run card (excluindo o próprio campo `run_card_hash`). Se qualquer campo mudar — uma pontuação, um timestamp, uma única saída — o hash é quebrado.

:::info Quando usar qual
Use o **fingerprint** para agrupar execuções comparáveis (mesmo experimento, execuções diferentes). Use o **hash do run card** para verificar a integridade de um arquivo de resultado específico.
:::

---

## Enviando para o Leaderboard

### Envio automático

Passe `--submit` para fazer o upload do run card na conclusão:

```bash
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --submit
```

### Envio manual

Os run cards são salvos como arquivos JSON em `results/`. Você pode enviar qualquer arquivo de run card através da interface do leaderboard em [/leaderboard](/leaderboard), ou pela API:

```bash
curl -X POST https://i18n-rosetta.com/api/leaderboard/submit \
  -H "Content-Type: application/json" \
  -d @results/your-run-card.json
```

:::warning Validação do leaderboard
O leaderboard valida os run cards enviados em relação ao registro do dataset. Envios que referenciam datasets desconhecidos, ou com um `run_card_hash` quebrado, são rejeitados.
:::

:::danger NÃO TREINE com dados de avaliação
Se o seu método viu o dataset de avaliação durante o desenvolvimento — como dados de treinamento, exemplos few-shot, entradas de dicionário ou material de engenharia de prompt — seu envio será **desqualificado**. Consulte [Avaliação de MT](/docs/eval/) para saber o que torna um método bom ou ruim.
:::

---

## Veja Também

- [Avaliação de MT](/docs/eval/) — visão geral, proposta de valor do leaderboard e orientação sobre métodos bons/ruins
- [Datasets de Avaliação](/docs/eval/datasets) — formato do dataset, EDTeKLA, FLORES+
- [Especificação do Run Card](/docs/eval/run-card) — o esquema JSON completo
- [Construindo um Método](/docs/eval/methods) — a interface do método para criar métodos avaliáveis
- [Leaderboard de Métodos](/leaderboard) — pontuações de benchmark ao vivo