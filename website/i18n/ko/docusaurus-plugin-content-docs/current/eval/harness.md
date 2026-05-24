---
sidebar_position: 2
title: "Eval Harness v2.0"
---
# Eval Harness v2.0

harness는 번역 실험을 실행하고 run card를 생성해요. 프롬프트 구성, API 호출, 점수 계산, 결과 직렬화를 처리하며, 사용자는 데이터셋과 모델만 제공하면 돼요.

## 설치

**요구 사항:** Python 3.10+

```bash
pip install sacrebleu aiohttp
```

harness 리포지토리를 클론하세요:

```bash
git clone https://github.com/gamedaysuits/gds-mt-eval-harness.git
cd gds-mt-eval-harness
```

## 사용법

```bash
python eval/baseline_experiment.py --dataset path/to/dataset.json
```

설정된 모델을 통해 데이터셋의 모든 항목을 실행하고, 출력 결과를 채점한 뒤, `results/` 디렉터리에 run card JSON 파일을 작성해요.

## CLI 플래그

| 플래그 | 필수 여부 | 기본값 | 설명 |
|------|----------|---------|-------------|
| `--dataset` | ✅ | — | 평가 데이터셋 JSON 파일의 경로 |
| `--model` | — | `openai/gpt-4o` | OpenRouter 모델 슬러그 (예: `google/gemini-2.5-pro`) |
| `--condition` | — | `baseline` | 실험 레이블. 프롬프트 전략을 구분할 때 사용해요 (예: `coached`, `few-shot`, `dictionary-augmented`) |
| `--temperature` | — | `0.3` | 샘플링 temperature. 낮을수록 결과가 더 결정적이에요 |
| `--batch-size` | — | `5` | 동시 API 배치당 항목 수 |
| `--fst-analyzer` | — | `null` | FST 분석기 바이너리 경로. 제공될 경우, 각 출력의 형태론적 수용성을 테스트해요 |
| `--submit` | — | `false` | 실행이 완료된 후 리더보드 API에 run card를 제출해요 |

### 예시

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

## Run Card 스키마

모든 실험은 독립적인 JSON 문서인 **run card**를 생성해요. 최상위 구조는 다음과 같아요:

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

모든 필드가 문서화된 전체 스키마는 [Run Card 사양](/docs/eval/run-card)을 참조하세요.

### 주요 블록

**`dataset`** — 결과가 특정 버전에 연결되도록 콘텐츠 해시를 포함하여 어떤 데이터셋이 사용되었는지 식별해요:

```json
{
  "id": "edtekla-dev-v1",
  "version": "1.0",
  "language_pair": "EN→CRK",
  "sha256": "...",
  "entry_count": 124
}
```

**`scores`** — 실행에 대한 집계 지표예요:

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

**`totals`** — 토큰 사용량 및 비용 추적 정보예요:

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

## Fingerprint와 Run Card 해시 비교

harness는 두 가지 고유한 해시를 생성해요. 각각 다른 목적을 가지고 있어요:

### Fingerprint

**fingerprint**는 *"이 실행을 재현할 수 있는가?"*라는 질문에 답을 제공해요.

출력이 아닌, 실험 구성을 정의하는 입력 조합을 해시화해요:

- 데이터셋 SHA-256
- 모델 슬러그
- 조건 레이블
- 시스템 프롬프트 SHA-256
- Temperature
- Harness 버전

fingerprint가 동일한 두 실행은 같은 설정을 사용한 것이에요. 따라서 두 결과는 비교할 수 있어야 해요(API의 비결정적 요소 제외).

### Run Card 해시

**run card 해시**는 *"이 특정 결과 파일이 변조되었는가?"*라는 질문에 답을 제공해요.

전체 run card JSON(`run_card_hash` 필드 자체는 제외)의 SHA-256 값이에요. 점수, 타임스탬프, 단일 출력 등 어떤 필드라도 변경되면 해시가 깨져요.

:::info 어떤 것을 사용해야 할까요?
비교 가능한 실행(동일한 실험, 다른 실행)을 그룹화하려면 **fingerprint**를 사용하세요. 특정 결과 파일의 무결성을 확인하려면 **run card 해시**를 사용하세요.
:::

---

## 리더보드에 제출하기

### 자동 제출

실행이 완료될 때 run card를 업로드하려면 `--submit`를 전달하세요:

```bash
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --submit
```

### 수동 제출

run card는 `results/`에 JSON 파일로 저장돼요. [/leaderboard](/leaderboard)의 리더보드 UI를 통하거나 API를 통해 모든 run card 파일을 제출할 수 있어요:

```bash
curl -X POST https://i18n-rosetta.com/api/leaderboard/submit \
  -H "Content-Type: application/json" \
  -d @results/your-run-card.json
```

:::warning 리더보드 유효성 검사
리더보드는 제출된 run card를 데이터셋 레지스트리와 대조하여 유효성을 검사해요. 알 수 없는 데이터셋을 참조하거나 `run_card_hash`가 깨진 제출물은 거부돼요.
:::

:::danger 평가 데이터로 학습하지 마세요
개발 과정에서 학습 데이터, 퓨샷(few-shot) 예제, 사전 항목 또는 프롬프트 엔지니어링 자료 등으로 평가 데이터셋이 사용되었다면 제출물은 **실격 처리**돼요. 좋은 방법론과 나쁜 방법론의 기준은 [MT 평가](/docs/eval/)를 참조하세요.
:::

---

## 참고 항목

- [MT 평가](/docs/eval/) — 개요, 리더보드 가치 제안, 좋은/나쁜 방법론 가이드
- [평가 데이터셋](/docs/eval/datasets) — 데이터셋 형식, EDTeKLA, FLORES+
- [Run Card 사양](/docs/eval/run-card) — 전체 JSON 스키마
- [방법론 구축하기](/docs/eval/methods) — 평가 가능한 방법론을 만들기 위한 방법론 인터페이스
- [방법론 리더보드](/leaderboard) — 실시간 벤치마크 점수