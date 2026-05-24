---
sidebar_position: 3
title: "평가 데이터셋"
---
# 평가 데이터셋

데이터셋은 harness가 실행되는 고정된 대상이에요. 각 데이터셋은 골드 스탠다드 참조가 포함된 소스→타겟 쌍을 포함하는 JSON 파일이에요. harness는 이러한 참조를 바탕으로 모델 출력의 점수를 매기며, 절대 이를 수정하지 않아요.

:::danger 평가 데이터로 학습하지 마세요

⚠️ **이 데이터셋은 평가 전용이에요.** 평가 데이터로 학습, 파인튜닝, 퓨샷 프롬프팅(few-shot-prompting)을 하거나 다른 방식으로 노출된 방법론은 인위적으로 부풀려진 점수를 생성하게 되며 **리더보드에서 실격 처리돼요.**

학습에는 별도의 말뭉치(corpora)를 사용하세요. 개발 중에는 모델이 평가 세트를 보지 못하도록 해야 해요.
:::

---

## 데이터셋 형식

모든 데이터셋은 동일한 JSON 스키마를 따라요:

```json
{
  "dataset": {
    "id": "dataset-slug",
    "version": "1.0",
    "language_pair": "EN→CRK",
    "description": "Human-readable description of the dataset",
    "source_language": "en",
    "target_language": "crk",
    "created": "2025-05-01",
    "license": "CC-BY-NC-4.0",
    "provenance": ["gold_standard", "textbook"]
  },
  "entries": [
    {
      "index": 0,
      "source_text": "Hello",
      "target_expected": "tânisi",
      "difficulty": "easy",
      "provenance": "gold_standard",
      "notes": "Common greeting, SRO orthography"
    }
  ]
}
```

### 최상위 `dataset` 블록

| 필드 | 유형 | 설명 |
|-------|------|-------------|
| `id` | `string` | 고유 데이터셋 식별자 (run card 및 리더보드에서 사용됨) |
| `version` | `string` | 시맨틱 버전. 이 값을 올리면 이전 run card 비교가 무효화돼요 |
| `language_pair` | `string` | 표시 레이블 (예: `EN→CRK`) |
| `description` | `string` | 사람이 읽을 수 있는 요약 |
| `source_language` | `string` | BCP 47 소스 언어 코드 |
| `target_language` | `string` | BCP 47 타겟 언어 코드 |
| `created` | `string` | ISO 8601 생성 날짜 |
| `license` | `string` | SPDX 라이선스 식별자 |
| `provenance` | `string[]` | 항목 전체에서 사용되는 출처(provenance) 태그 목록 |

### 항목 필드

| 필드 | 유형 | 설명 |
|-------|------|-------------|
| `index` | `number` | 0부터 시작하는 항목 인덱스. 고유하고 순차적이어야 해요 |
| `source_text` | `string` | 번역할 소스 텍스트 |
| `target_expected` | `string` | 골드 스탠다드 참조 번역 |
| `difficulty` | `string` | 난이도 등급: `easy`, `medium`, `hard` |
| `provenance` | `string` | 이 항목의 출처 (예: `gold_standard`, `textbook`, `elicited`) |
| `notes` | `string` | 사람 검토자를 위한 선택적 컨텍스트 |

---

## 사용 가능한 데이터셋

### EDTeKLA Development Set v1

영어→Plains Cree (SRO) 번역을 위해 구축된 첫 번째 평가 데이터셋이에요. 앨버타 대학교(University of Alberta)의 [EdTeKLA 연구 그룹](https://spaces.facsci.ualberta.ca/edtekla/)에서 만들었어요.

| 속성 | 값 |
|----------|-------|
| **ID** | `edtekla-dev-v1` |
| **버전** | `1.0` |
| **언어 쌍** | EN → CRK (Plains Cree, SRO 정서법) |
| **항목 수** | 124 |
| **난이도 분포** | Easy, Medium, Hard |
| **출처** | `gold_standard` (화자 검증 완료), `textbook` (출판된 교육 자료) |
| **라이선스** | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) |

**테스트 항목:**

- 기본 인사말 및 자주 쓰이는 문구
- 명사의 유정성(animacy) 및 우회성(obviation)
- 인칭 및 시제에 따른 동사 활용
- 처소격(locative) 구조
- 소유격 패러다임
- 복잡한 문장 구조

:::tip 왜 항목이 124개인가요?
이 데이터셋은 의도적으로 작게 큐레이션되었어요. 각 항목은 유창한 화자가 검증했거나 출판된 Cree어 교재에서 가져왔어요. 검증된 골드 스탠다드가 있는 작고 고품질인 데이터셋이 크고 노이즈가 많은 데이터셋보다 훨씬 유용해요. 특히 "적당히 비슷한" 번역이 형태론적으로 유효하지 않은 경우가 많은 저자원(low-resource) 언어에서는 더욱 그래요.
:::

---

## 새 데이터셋 만들기

새로운 언어 쌍이나 도메인을 위한 데이터셋을 만들려면 다음을 따르세요:

### 1. JSON 구조화하기

[데이터셋 형식](#dataset-format) 스키마를 따르세요. 모든 항목에는 `source_text`, `target_expected`, `difficulty`, `provenance`이 있어야 해요.

### 2. 고유 ID 할당하기

설명이 포함된 슬러그(slug)를 사용하세요: `{project}-{split}-v{version}` (예: `edtekla-dev-v1`, `quechua-test-v1`).

### 3. 골드 스탠다드 검증하기

모든 `target_expected` 값은 유창한 화자가 검증하거나 동료 평가(peer-review)를 거친 출판된 자료에서 가져와야 해요. 기계가 생성한 참조는 평가의 목적을 훼손해요.

### 4. 난이도 등급 설정하기

각 항목에 난이도를 할당하세요:

| 등급 | 기준 |
|------|----------|
| `easy` | 짧은 문구, 일반적인 어휘, 단순한 형태론 |
| `medium` | 완전한 문장, 중간 수준의 형태론적 복잡성 |
| `hard` | 복잡한 문법, 드문 구조, 문화적으로 특수한 콘텐츠 |

### 5. 출처 태그 지정하기

각 항목은 어디서 왔는지 나타내야 해요. 일반적인 태그는 다음과 같아요:

- `gold_standard` — 유창한 화자가 검증함
- `textbook` — 출판된 교육 자료에서 발췌함
- `elicited` — 체계적인 유도(elicitation) 세션을 통해 생성됨
- `corpus` — 병렬 말뭉치에서 추출됨

### 6. 파일 유효성 검사하기

임의의 모델을 사용해 데이터셋에 대해 harness를 실행하여 JSON 형식이 올바르고 필수 필드가 모두 있는지 확인하세요:

```bash
python eval/baseline_experiment.py --dataset path/to/your-dataset.json
```

누락된 필드, 중복된 인덱스 또는 스키마 위반이 있으면 harness에서 오류가 발생해요.

### 7. 포함을 위해 제출하기

`data/` 디렉터리에 데이터셋 파일을 포함하여 [eval harness 저장소](https://github.com/gamedaysuits/gds-mt-eval-harness)에 풀 리퀘스트(pull request)를 여세요. 검증 방법론 및 출처에 대한 문서도 함께 포함해 주세요.

---

## FLORES+ Devtest

[Open Language Data Initiative (OLDI)](https://huggingface.co/datasets/openlanguagedata/flores_plus)에서 유지 관리하는 광범위한 다국어 벤치마크예요. rosetta의 다중 모델 프런티어 벤치마크에 사용돼요.

| 속성 | 값 |
|----------|-------|
| **ID** | `flores-plus-devtest` |
| **언어 쌍** | EN → 39개 언어 (rosetta에 등록된 모든 자연어) |
| **항목 수** | 언어당 1,012개 문장 |
| **라이선스** | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| **출처** | 원래 Meta FLORES-200이었으나, 현재는 OLDI에서 유지 관리함 |
| **위치** | 메인 rosetta 저장소의 `test/benchmark/fixtures/`에 사전 추출된 픽스처(fixtures)로 존재함 |

:::danger 평가 전용
FLORES+는 오직 평가 목적으로만 사용해야 해요. 큐레이터들은 이를 **학습 데이터로 사용하지 말 것**을 명시적으로 요청하고 있어요. 모든 학습 말뭉치에서 이 콘텐츠가 제외되었는지 확인하세요.
:::

---

## 함께 보기

- [MT 평가](/docs/eval/) — 평가 프레임워크 및 리더보드 개요
- [Eval Harness](/docs/eval/harness) — 이러한 데이터셋에 대해 평가를 실행하는 방법
- [Run Card 사양](/docs/eval/run-card) — 결과를 기록하기 위한 JSON 스키마
- [방법론 리더보드](/leaderboard) — 실시간 벤치마크 점수
- [EdTeKLA 프로젝트](https://spaces.facsci.ualberta.ca/edtekla/) — Cree어 데이터셋을 제작한 앨버타 대학교 연구 그룹