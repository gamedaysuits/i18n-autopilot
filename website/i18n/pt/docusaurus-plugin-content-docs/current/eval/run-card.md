---
sidebar_position: 4
title: "Especificação de Run Card"
---
# Especificação do Run Card

O run card é o registro completo de uma única execução de avaliação. Ele contém tudo o que é necessário para entender, reproduzir e verificar o experimento: configuração, pontuações, resultados individuais, uso de tokens e metadados do ambiente.

**Versão do schema:** 2.0

---

## Campos de Nível Superior

| Campo | Tipo | Descrição |
|-------|------|-------------|
| `run_id` | `string` | UUID v4 gerado no início da execução |
| `harness_version` | `string` | Versão semântica do harness que produziu este card (ex., `2.0`) |
| `model_slug` | `string` | Slug do modelo do OpenRouter usado para a execução (ex., `openai/gpt-4o`) |
| `model_id` | `string` | Identificador resolvido do modelo retornado pela API (ex., `gpt-4o-2024-08-06`) |
| `condition` | `string` | Rótulo do experimento (ex., `baseline`, `coached-v3`, `few-shot`) |
| `timestamp` | `string` | Timestamp UTC em formato ISO 8601 de quando a execução começou |
| `elapsed_seconds` | `number` | Duração total (wall-clock) de toda a execução |

```json
{
  "run_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "harness_version": "2.0",
  "model_slug": "openai/gpt-4o",
  "model_id": "gpt-4o-2024-08-06",
  "condition": "baseline",
  "timestamp": "2025-05-20T03:22:41Z",
  "elapsed_seconds": 142.7
}
```

---

## `dataset`

Identifica o dataset de avaliação e o fixa a uma versão de conteúdo específica via SHA-256.

| Campo | Tipo | Descrição |
|-------|------|-------------|
| `id` | `string` | Identificador do dataset (ex., `edtekla-dev-v1`) |
| `version` | `string` | String de versão do dataset |
| `language_pair` | `string` | Rótulo de exibição (ex., `EN→CRK`) |
| `sha256` | `string` | Hash SHA-256 do conteúdo do arquivo do dataset. Garante os dados exatos usados |
| `entry_count` | `number` | Número de entradas no dataset |

```json
{
  "dataset": {
    "id": "edtekla-dev-v1",
    "version": "1.0",
    "language_pair": "EN→CRK",
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "entry_count": 124
  }
}
```

---

## `config`

A configuração da API e de processamento em lote (batching) usada para esta execução.

| Campo | Tipo | Descrição |
|-------|------|-------------|
| `api_provider` | `string` | Nome do provedor da API (ex., `openrouter`) |
| `temperature` | `number` | Temperatura de amostragem |
| `max_tokens` | `number` | Máximo de tokens por completion |
| `batch_size` | `number` | Entradas por lote concorrente |
| `concurrency` | `number` | Máximo de requisições paralelas à API |

```json
{
  "config": {
    "api_provider": "openrouter",
    "temperature": 0.3,
    "max_tokens": 1024,
    "batch_size": 5,
    "concurrency": 3
  }
}
```

---

## `system_prompt_sha256` / `system_prompt_used`

| Campo | Tipo | Descrição |
|-------|------|-------------|
| `system_prompt_sha256` | `string` | Hash SHA-256 do system prompt. Incluído no fingerprint |
| `system_prompt_used` | `string` | O texto completo do system prompt enviado ao modelo |

O hash do prompt faz parte do [fingerprint](#fingerprint) — duas execuções com prompts diferentes terão fingerprints diferentes, mesmo que todas as outras configurações sejam iguais.

---

## `fingerprint`

Um identificador de reprodutibilidade. Duas execuções com fingerprints idênticos usaram a mesma configuração experimental.

| Campo | Tipo | Descrição |
|-------|------|-------------|
| `hash` | `string` | Hash SHA-256 dos componentes ordenados |
| `components` | `object` | Os valores de entrada que foram transformados em hash |

### Componentes do Fingerprint

| Componente | Descrição |
|-----------|-------------|
| `dataset_sha256` | Hash do arquivo do dataset |
| `model_slug` | Modelo usado |
| `condition` | Rótulo da condição do experimento |
| `system_prompt_sha256` | Hash do system prompt |
| `temperature` | Temperatura de amostragem |
| `harness_version` | Versão do harness |

```json
{
  "fingerprint": {
    "hash": "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    "components": {
      "dataset_sha256": "e3b0c44298fc1c14...",
      "model_slug": "openai/gpt-4o",
      "condition": "baseline",
      "system_prompt_sha256": "abc123...",
      "temperature": 0.3,
      "harness_version": "2.0"
    }
  }
}
```

:::info Fingerprint ≠ Hash do Run Card
O fingerprint identifica a *configuração do experimento*. O `run_card_hash` verifica a *integridade do arquivo de resultados*. Consulte [Fingerprint vs Hash do Run Card](/docs/eval/harness#fingerprint-vs-run-card-hash) para mais detalhes.
:::

---

## `scores`

Métricas agregadas para toda a execução.

### Pontuações de Nível Superior

| Campo | Tipo | Descrição |
|-------|------|-------------|
| `total` | `number` | Total de entradas avaliadas |
| `exact_matches` | `number` | Entradas onde a saída correspondeu exatamente ao padrão-ouro |
| `exact_match_rate` | `number` | `exact_matches / total` (0.0–1.0) |
| `fst_accepted` | `number` | Entradas onde o analisador FST aceitou a saída |
| `fst_acceptance_rate` | `number` | `fst_accepted / total` (0.0–1.0). `null` se nenhum analisador FST foi usado |
| `chrf_plus_plus` | `number` | Pontuação chrF++ em nível de corpus (0–100) |
| `errors` | `number` | Entradas que falharam (erro de API, timeout, etc.) |
| `avg_latency_seconds` | `number` | Tempo médio de resposta em todas as entradas |
| `median_latency_seconds` | `number` | Tempo mediano de resposta |
| `p95_latency_seconds` | `number` | Tempo de resposta no 95º percentil |

### `by_difficulty`

Pontuações detalhadas por nível de dificuldade. Cada chave (`easy`, `medium`, `hard`) contém os mesmos campos de métricas das pontuações de nível superior.

```json
{
  "by_difficulty": {
    "easy": {
      "total": 42,
      "exact_matches": 8,
      "exact_match_rate": 0.1905,
      "chrf_plus_plus": 51.2,
      "fst_accepted": 35,
      "fst_acceptance_rate": 0.8333
    },
    "medium": { ... },
    "hard": { ... }
  }
}
```

### `by_provenance`

Pontuações detalhadas pela proveniência da entrada. Cada chave (ex., `gold_standard`, `textbook`) contém os mesmos campos de métricas.

```json
{
  "by_provenance": {
    "gold_standard": {
      "total": 80,
      "exact_matches": 10,
      "exact_match_rate": 0.125,
      "chrf_plus_plus": 44.8
    },
    "textbook": { ... }
  }
}
```

---

## `totals`

Uso de tokens e rastreamento de custos para toda a execução.

| Campo | Tipo | Descrição |
|-------|------|-------------|
| `prompt_tokens` | `number` | Total de tokens de entrada em todas as chamadas de API |
| `completion_tokens` | `number` | Total de tokens de saída |
| `reasoning_tokens` | `number` | Tokens usados para raciocínio chain-of-thought (dependente do modelo, 0 para a maioria dos modelos) |
| `cached_tokens` | `number` | Tokens servidos a partir do prompt cache do provedor |
| `total_cost_usd` | `number` | Custo total em USD (conforme relatado pela API) |
| `cost_per_entry_usd` | `number` | `total_cost_usd / entry_count` |
| `reasoning_ratio` | `number` | `reasoning_tokens / completion_tokens` (0.0–1.0) |

```json
{
  "totals": {
    "prompt_tokens": 48200,
    "completion_tokens": 3100,
    "reasoning_tokens": 0,
    "cached_tokens": 12000,
    "total_cost_usd": 0.42,
    "cost_per_entry_usd": 0.0034,
    "reasoning_ratio": 0.0
  }
}
```

---

## `environment`

Metadados do ambiente de execução para reprodutibilidade.

| Campo | Tipo | Descrição |
|-------|------|-------------|
| `harness_version` | `string` | Versão do harness (reflete o `harness_version` de nível superior) |
| `harness_git_commit` | `string` | SHA do commit Git do harness no momento da execução |
| `python_version` | `string` | Versão do interpretador Python |
| `sacrebleu_version` | `string` | Versão da biblioteca sacrebleu (usada para a pontuação chrF++) |
| `os` | `string` | Identificador do sistema operacional |

```json
{
  "environment": {
    "harness_version": "2.0",
    "harness_git_commit": "a1b2c3d",
    "python_version": "3.11.9",
    "sacrebleu_version": "2.4.0",
    "os": "macOS-14.5-arm64"
  }
}
```

---

## `results[]`

O array de resultados por entrada. Um objeto por entrada do dataset, na ordem do índice.

| Campo | Tipo | Descrição |
|-------|------|-------------|
| `entry_index` | `number` | Índice desta entrada no dataset (corresponde a `entries[].index`) |
| `source_text` | `string` | O texto de origem que foi traduzido |
| `target_expected` | `string` | A referência padrão-ouro do dataset |
| `target_output` | `string` | A saída real do modelo |
| `exact_match` | `boolean` | Se `target_output === target_expected` |
| `entry_chrf` | `number` | Pontuação chrF++ em nível de frase para esta entrada (0–100) |
| `fst_accepted` | `boolean \| null` | Se o analisador FST aceitou a saída. `null` se nenhum analisador foi configurado |
| `fst_analysis` | `string[]` | Strings de análise FST para a saída (array vazio se não foi analisada ou se foi rejeitada) |
| `difficulty` | `string` | Nível de dificuldade do dataset (`easy`, `medium`, `hard`) |
| `provenance` | `string` | Tag de proveniência do dataset |
| `latency_seconds` | `number` | Tempo de resposta para esta entrada individual |
| `usage` | `object` | Uso de tokens por entrada: `{ prompt_tokens, completion_tokens, reasoning_tokens }` |
| `error` | `string \| null` | Mensagem de erro se esta entrada falhou. `null` em caso de sucesso |

```json
{
  "results": [
    {
      "entry_index": 0,
      "source_text": "Hello",
      "target_expected": "tânisi",
      "target_output": "tânisi",
      "exact_match": true,
      "entry_chrf": 100.0,
      "fst_accepted": true,
      "fst_analysis": ["tânisi+V+AI+Ind+2Sg"],
      "difficulty": "easy",
      "provenance": "gold_standard",
      "latency_seconds": 0.82,
      "usage": {
        "prompt_tokens": 385,
        "completion_tokens": 12,
        "reasoning_tokens": 0
      },
      "error": null
    }
  ]
}
```

---

## `run_card_hash`

| Campo | Tipo | Descrição |
|-------|------|-------------|
| `run_card_hash` | `string` | Hash SHA-256 de todo o JSON do run card, com o próprio campo `run_card_hash` definido como `""` durante a geração do hash |

Este é o selo de detecção de adulteração. O leaderboard recalcula esse hash no envio e rejeita os cards onde ele não corresponde.

**Calculando o hash:**

1. Serialize o run card para JSON com `run_card_hash` definido como `""`
2. Calcule o SHA-256 da string serializada
3. Defina `run_card_hash` com o digest hexadecimal resultante

```python
import hashlib, json

card["run_card_hash"] = ""
card_json = json.dumps(card, sort_keys=True, ensure_ascii=False)
card["run_card_hash"] = hashlib.sha256(card_json.encode()).hexdigest()
```

---

## Veja Também

- [Avaliação de MT](/docs/eval/) — visão geral, valor do leaderboard e orientações sobre métodos bons/ruins
- [Eval Harness](/docs/eval/harness) — como executar avaliações e gerar run cards
- [Datasets de Avaliação](/docs/eval/datasets) — formato do dataset, EDTeKLA, FLORES+
- [Construindo um Método](/docs/eval/methods) — a interface do método e a especificação do method card
- [Leaderboard de Métodos](/leaderboard) — pontuações de benchmark ao vivo