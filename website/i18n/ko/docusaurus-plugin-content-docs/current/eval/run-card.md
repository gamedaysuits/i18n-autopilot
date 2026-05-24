---
sidebar_position: 4
title: "Run Card 사양"
---
# Run Card 사양

Run Card는 단일 평가 실행에 대한 완전한 기록이에요. 여기에는 실험을 이해하고, 재현하고, 검증하는 데 필요한 모든 것(구성, 점수, 개별 결과, 토큰 사용량, 환경 메타데이터)이 포함되어 있어요.

**스키마 버전:** 2.0

---

## 최상위 필드

| 필드 | 타입 | 설명 |
|-------|------|-------------|
| `run_id` | `string` | 실행 시작 시 생성되는 UUID v4 |
| `harness_version` | `string` | 이 카드를 생성한 harness의 시맨틱 버전 (예: `2.0`) |
| `model_slug` | `string` | 실행에 사용된 OpenRouter 모델 슬러그 (예: `openai/gpt-4o`) |
| `model_id` | `string` | API가 반환한 확인된 모델 식별자 (예: `gpt-4o-2024-08-06`) |
| `condition` | `string` | 실험 라벨 (예: `baseline`, `coached-v3`, `few-shot`) |
| `timestamp` | `string` | 실행이 시작된 시점의 ISO 8601 UTC 타임스탬프 |
| `elapsed_seconds` | `number` | 전체 실행의 실제 소요 시간(Wall-clock duration) |

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

평가 데이터셋을 식별하고 SHA-256을 통해 특정 콘텐츠 버전에 고정해요.

| 필드 | 타입 | 설명 |
|-------|------|-------------|
| `id` | `string` | 데이터셋 식별자 (예: `edtekla-dev-v1`) |
| `version` | `string` | 데이터셋 버전 문자열 |
| `language_pair` | `string` | 표시 라벨 (예: `EN→CRK`) |
| `sha256` | `string` | 데이터셋 파일 내용의 SHA-256 해시. 사용된 정확한 데이터를 보장해요 |
| `entry_count` | `number` | 데이터셋의 항목 수 |

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

이 실행에 사용된 API 및 일괄 처리(batching) 구성이에요.

| 필드 | 타입 | 설명 |
|-------|------|-------------|
| `api_provider` | `string` | API 제공자 이름 (예: `openrouter`) |
| `temperature` | `number` | 샘플링 온도(Sampling temperature) |
| `max_tokens` | `number` | 완료당 최대 토큰 수 |
| `batch_size` | `number` | 동시 배치당 항목 수 |
| `concurrency` | `number` | 최대 병렬 API 요청 수 |

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

| 필드 | 타입 | 설명 |
|-------|------|-------------|
| `system_prompt_sha256` | `string` | 시스템 프롬프트의 SHA-256 해시. fingerprint에 포함돼요 |
| `system_prompt_used` | `string` | 모델에 전송된 전체 시스템 프롬프트 텍스트 |

프롬프트 해시는 [fingerprint](#fingerprint)의 일부예요. 다른 모든 설정이 일치하더라도 프롬프트가 다르면 두 실행의 fingerprint는 달라져요.

---

## `fingerprint`

재현성 식별자예요. fingerprint가 동일한 두 실행은 같은 실험 설정을 사용한 것이에요.

| 필드 | 타입 | 설명 |
|-------|------|-------------|
| `hash` | `string` | 정렬된 구성 요소의 SHA-256 해시 |
| `components` | `object` | 해시된 입력 값 |

### Fingerprint 구성 요소

| 구성 요소 | 설명 |
|-----------|-------------|
| `dataset_sha256` | 데이터셋 파일의 해시 |
| `model_slug` | 사용된 모델 |
| `condition` | 실험 조건 라벨 |
| `system_prompt_sha256` | 시스템 프롬프트의 해시 |
| `temperature` | 샘플링 온도 |
| `harness_version` | Harness 버전 |

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

:::info Fingerprint ≠ Run Card Hash
fingerprint는 *실험 구성*을 식별해요. `run_card_hash`는 *결과 파일의 무결성*을 검증해요. 자세한 내용은 [Fingerprint vs Run Card Hash](/docs/eval/harness#fingerprint-vs-run-card-hash)를 참고해 주세요.
:::

---

## `scores`

전체 실행에 대한 집계 지표예요.

### 최상위 점수

| 필드 | 타입 | 설명 |
|-------|------|-------------|
| `total` | `number` | 평가된 총 항목 수 |
| `exact_matches` | `number` | 출력이 골드 스탠다드(gold standard)와 정확히 일치하는 항목 수 |
| `exact_match_rate` | `number` | `exact_matches / total` (0.0–1.0) |
| `fst_accepted` | `number` | FST 분석기가 출력을 수락한 항목 수 |
| `fst_acceptance_rate` | `number` | `fst_accepted / total` (0.0–1.0). FST 분석기를 사용하지 않은 경우 `null` |
| `chrf_plus_plus` | `number` | 코퍼스 수준의 chrF++ 점수 (0–100) |
| `errors` | `number` | 실패한 항목 수 (API 오류, 시간 초과 등) |
| `avg_latency_seconds` | `number` | 모든 항목의 평균 응답 시간 |
| `median_latency_seconds` | `number` | 응답 시간 중앙값 |
| `p95_latency_seconds` | `number` | 95백분위수 응답 시간 |

### `by_difficulty`

난이도 등급별로 세분화된 점수예요. 각 키(`easy`, `medium`, `hard`)에는 최상위 점수와 동일한 지표 필드가 포함되어 있어요.

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

항목 출처(provenance)별로 세분화된 점수예요. 각 키(예: `gold_standard`, `textbook`)에는 동일한 지표 필드가 포함되어 있어요.

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

전체 실행에 대한 토큰 사용량 및 비용 추적 정보예요.

| 필드 | 타입 | 설명 |
|-------|------|-------------|
| `prompt_tokens` | `number` | 모든 API 호출에 걸친 총 입력 토큰 수 |
| `completion_tokens` | `number` | 총 출력 토큰 수 |
| `reasoning_tokens` | `number` | 생각의 사슬(chain-of-thought) 추론에 사용된 토큰 수 (모델에 따라 다르며, 대부분의 모델은 0) |
| `cached_tokens` | `number` | 제공자의 프롬프트 캐시에서 제공된 토큰 수 |
| `total_cost_usd` | `number` | 총 비용(USD) (API에서 보고된 기준) |
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

재현성을 위한 런타임 환경 메타데이터예요.

| 필드 | 타입 | 설명 |
|-------|------|-------------|
| `harness_version` | `string` | Harness 버전 (최상위 `harness_version`와 동일) |
| `harness_git_commit` | `string` | 실행 시점의 harness Git 커밋 SHA |
| `python_version` | `string` | Python 인터프리터 버전 |
| `sacrebleu_version` | `string` | sacrebleu 라이브러리 버전 (chrF++ 점수 계산에 사용됨) |
| `os` | `string` | 운영 체제 식별자 |

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

항목별 결과 배열이에요. 데이터셋 항목당 하나의 객체가 인덱스 순서대로 포함돼요.

| 필드 | 타입 | 설명 |
|-------|------|-------------|
| `entry_index` | `number` | 데이터셋 내 이 항목의 인덱스 (`entries[].index`과 일치) |
| `source_text` | `string` | 번역된 원본 텍스트 |
| `target_expected` | `string` | 데이터셋의 골드 스탠다드(gold-standard) 참조 텍스트 |
| `target_output` | `string` | 모델의 실제 출력 |
| `exact_match` | `boolean` | `target_output === target_expected` 여부 |
| `entry_chrf` | `number` | 이 항목에 대한 문장 수준의 chrF++ 점수 (0–100) |
| `fst_accepted` | `boolean \| null` | FST 분석기가 출력을 수락했는지 여부. 분석기가 구성되지 않은 경우 `null` |
| `fst_analysis` | `string[]` | 출력에 대한 FST 분석 문자열 (분석되지 않았거나 거부된 경우 빈 배열) |
| `difficulty` | `string` | 데이터셋의 난이도 등급 (`easy`, `medium`, `hard`) |
| `provenance` | `string` | 데이터셋의 출처(Provenance) 태그 |
| `latency_seconds` | `number` | 이 개별 항목에 대한 응답 시간 |
| `usage` | `object` | 항목별 토큰 사용량: `{ prompt_tokens, completion_tokens, reasoning_tokens }` |
| `error` | `string \| null` | 이 항목이 실패한 경우의 오류 메시지. 성공 시 `null` |

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

| 필드 | 타입 | 설명 |
|-------|------|-------------|
| `run_card_hash` | `string` | 전체 Run Card JSON의 SHA-256 해시. 해싱 중에는 `run_card_hash` 필드 자체가 `""`로 설정돼요 |

이것은 위조 방지(tamper-detection) 씰이에요. 리더보드는 제출 시 이 해시를 다시 계산하며, 일치하지 않는 카드는 거부해요.

**해시 계산 방법:**

1. `run_card_hash`을 `""`로 설정하여 Run Card를 JSON으로 직렬화해요
2. 직렬화된 문자열의 SHA-256을 계산해요
3. `run_card_hash`를 결과 16진수 다이제스트(hex digest)로 설정해요

```python
import hashlib, json

card["run_card_hash"] = ""
card_json = json.dumps(card, sort_keys=True, ensure_ascii=False)
card["run_card_hash"] = hashlib.sha256(card_json.encode()).hexdigest()
```

---

## 참고 항목

- [MT 평가](/docs/eval/) — 개요, 리더보드 가치, 그리고 좋은/나쁜 방법론에 대한 가이드
- [평가 Harness](/docs/eval/harness) — 평가를 실행하고 Run Card를 생성하는 방법
- [평가 데이터셋](/docs/eval/datasets) — 데이터셋 형식, EDTeKLA, FLORES+
- [방법론 구축하기](/docs/eval/methods) — 방법론 인터페이스 및 Method Card 사양
- [방법론 리더보드](/leaderboard) — 실시간 벤치마크 점수