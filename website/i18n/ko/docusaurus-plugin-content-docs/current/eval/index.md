---
sidebar_position: 1
title: "MT 평가"
---
# MT 평가

rosetta에는 번역 방식의 **재현 가능한 벤치마킹(reproducible benchmarking)**을 위해 설계된 기계 번역 평가 프레임워크가 포함되어 있어요. 이는 특히 표준 MT 벤치마크가 존재하지 않고 품질에 대한 주장을 검증하기 어려운 저자원 및 토착 언어에 유용해요.

---

## 리더보드

가장 핵심적인 요소는 **[Method Leaderboard](/leaderboard)**예요. 이는 연구자와 커뮤니티 구성원이 핑거프린트가 적용된 재현 가능한 평가를 통해 번역 방식을 제출하고 비교할 수 있는, Supabase 기반의 실시간 스코어보드예요.

모든 제출물에는 다음이 포함돼요:

- **핑거프린트가 적용된 파이프라인(Fingerprinted pipeline)** — 특정 Git 커밋 및 설정 해시와 연결되어 있어, 결과를 생성한 정확한 코드로 추적할 수 있어요.
- **버전 관리되는 데이터셋(Versioned dataset)** — 콘텐츠 해시가 적용되고 버전이 관리돼요. 점수는 동일한 데이터셋 버전 내에서만 비교할 수 있어요.
- **표준화된 지표(Standardised metrics)** — 모든 점수는 공유된 evaluation harness에 의해 계산되므로 구현에 따른 차이가 없어요.
- **신뢰도 등급(Trust tiers)** — 자체 벤치마크(self-benchmarked), GDS Verified 또는 Community Validated로 나뉘어요.
- **비용 추적(Cost tracking)** — 제출당 API 비용을 추적하여 비용과 품질 간의 균형(tradeoff)을 투명하게 보여줘요.

리더보드는 현재 세 가지 지표를 추적해요:

| 지표(Metric) | 유형(Type) | 측정 내용(What It Measures) |
|--------|------|------------------|
| **chrF++** | Character n-gram F-score | 주요 품질 지표 — 특히 형태론적으로 복잡한 언어에서 인간의 판단과 높은 상관관계를 보여요. |
| **Exact Match** | 완벽하게 일치하는 비율 | 엄격한 정확도 — 번역이 골드 스탠다드(gold standard)와 얼마나 정확히 일치하는지 측정해요. |
| **FST Acceptance** | 형태론적 게이트 통과율 | finite-state transducer 검증을 사용하는 방식의 경우 — 출력 결과 중 형태론적으로 유효한 비율이 얼마나 되는지 측정해요. |

**[→ 리더보드 보기](/leaderboard)**

---

## 사용 가능한 데이터셋

### EDTeKLA Development Set v1

English→Plains Cree (SRO) 번역을 위해 구축된 첫 번째 평가 데이터셋이에요. University of Alberta의 [EdTeKLA research group](https://spaces.facsci.ualberta.ca/edtekla/)에서 제작했어요.

| 속성 | 값 |
|----------|-------|
| **ID** | `edtekla-dev-v1` |
| **언어 쌍** | EN → CRK (Plains Cree, SRO orthography) |
| **항목 수** | 124 |
| **라이선스** | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) |
| **출처** | `gold_standard` (화자 검증 완료), `textbook` (출판된 교육 자료) |

### FLORES+ Devtest

[Open Language Data Initiative (OLDI)](https://huggingface.co/datasets/openlanguagedata/flores_plus)에서 유지 관리하는 광범위한 다국어 벤치마크예요.

| 속성 | 값 |
|----------|-------|
| **언어 쌍** | EN → 39개 언어 (rosetta에 등록된 모든 언어) |
| **항목 수** | 언어당 1,012개 문장 |
| **라이선스** | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| **출처** | 원래 Meta FLORES-200이었으나, 현재는 OLDI에서 유지 관리 |
| **위치** | 메인 rosetta 저장소의 `test/benchmark/fixtures/`에 사전 추출된 fixture로 존재 |

전체 데이터셋 스키마, 난이도 등급 및 자체 데이터셋 생성 방법에 대한 자세한 내용은 [Evaluation Datasets](/docs/eval/datasets)를 참고해 주세요.

:::danger 평가 데이터로 학습하지 마세요

**이 데이터셋은 평가 전용이에요.** 평가 데이터에 학습, 파인튜닝, 퓨샷 프롬프팅(few-shot-prompted)되거나 어떤 방식으로든 노출된 방식은 인위적으로 부풀려진 점수를 생성하게 되며 **리더보드에서 실격 처리돼요.**

이것은 단순한 권장 사항이 아니며, 평가의 무결성을 위한 가장 중요한 단일 규칙이에요. 학습에는 별도의 말뭉치(corpora)를 사용하세요. 평가 세트는 개발 과정에서 모델에 노출되지 않아야 해요.

코칭 데이터나 퓨샷 예제를 사용하는 경우, **완전히 분리된 출처**에서 가져와야 해요. 확실하지 않다면 포함하지 마세요.
:::

:::warning LLM의 비결정성(non-determinism)

LLM 출력은 비결정적이에요. 점수는 특정 모델 버전 및 API 구성 하에서의 특정 시점 측정값을 나타내요. 모델 제공업체는 언제든지 가중치, 디코딩 전략 또는 안전 필터를 업데이트할 수 있으며, 이로 인해 실행 간에 점수 변동(score drift)이 발생할 수 있어요. 리더보드는 모든 제출물에 대해 정확한 모델 슬러그(slug)와 타임스탬프를 기록해요.
:::

---

## 좋은 방식(Method)의 기준

모든 방식이 동일하게 만들어지는 것은 아니에요. 엄격한 작업과 부풀려진 점수를 구분하는 기준은 다음과 같아요.

### 강력한 방식의 특징

- **학습 및 평가 데이터의 명확한 분리** — 개발, 튜닝, 프롬프트 엔지니어링 또는 퓨샷 예제 선택 과정에서 평가 세트가 방식에 전혀 노출되지 않아야 해요.
- **재현 가능성(Reproducible)** — 다른 사람이 저장소를 클론하고 harness를 실행했을 때 (LLM 비결정성 범위 내에서) 동일한 점수를 얻을 수 있어야 해요.
- **문서화(Documented)** — [method card](/docs/eval/methods)에 해당 방식이 수행하는 작업, 사용하는 도구 및 한계점이 설명되어 있어야 해요.
- **범위에 대한 정직성** — 특정 언어 쌍에만 작동한다면 그렇게 명시하고, 특정 형태론적 패턴에서 성능이 저하된다면 이를 문서화해야 해요.
- **커뮤니티 존중(Community-aware)** — 토착 언어의 경우, 데이터 주권을 존중해야 해요. 언어 커뮤니티와 협의했거나 공개적으로 라이선스가 부여된 데이터만 사용해야 해요.

### 주의 사항 (실격 사유)

| 주의 사항 (Red Flag) | 문제인 이유 |
|----------|--------------------|
| 평가 데이터로 학습 | 평가의 목적 자체를 무너뜨려요. 부풀려진 점수는 모두를 오도하게 돼요. |
| 결과 체리피킹(Cherry-picking) | 10번 실행한 후 다른 결과를 공개하지 않고 가장 좋은 결과만 제출하는 행위예요. |
| 공개되지 않은 후처리 | 점수를 매기기 전에 수동으로 출력 결과를 수정하는 행위예요. |
| 오염된 코칭 데이터 | 평가 세트 예제를 퓨샷 프롬프트나 사전 항목으로 사용하는 행위예요. |
| 출처 없이 상업적 준비 완료 주장 | CC BY-NC-SA 데이터를 사용하는 방식이라면 상업적으로 사용할 수 없어요. |

### 리더보드의 품질 등급

리더보드는 세 가지 신뢰도 수준을 지원해요:

| 등급(Tier) | 의미 | 획득 방법 |
|------|---------|---------------|
| **Self-benchmarked** | 직접 harness를 실행하고 결과를 제출했어요. | run card와 함께 PR을 열어주세요. |
| **GDS Verified** | rosetta 메인테이너가 결과를 재현했어요. | 설치 가능한 플러그인으로 방식을 제출해 주세요. |
| **Community Validated** | 독립적인 커뮤니티 구성원이 결과를 재현했어요. | 곧 지원될 예정이에요. |

---

## 제출 방법

1. **방식(Method) 구축** — 방식 인터페이스에 대한 내용은 [Building a Method](/docs/eval/methods)를 참고해 주세요.
2. **harness 실행** — 설정 및 사용법은 [Eval Harness](/docs/eval/harness)를 참고해 주세요.
3. **run card 생성** — harness는 점수, 핑거프린트 및 메타데이터가 포함된 JSON run card를 생성해요.
4. **PR 열기** — [eval harness repository](https://github.com/gamedaysuits/gds-mt-eval-harness)에 run card를 제출해 주세요.
5. **리더보드에 표시** — 병합(merge)되면 결과가 [Method Leaderboard](/leaderboard)에 표시돼요.

---

## 향후 방향

- **FLORES+ 모델 비교 실행** — 39개 rosetta 언어 전체에 걸쳐 최신 모델(GPT-5.5, Claude Opus 4.7, Gemini 3.1 Pro 등)에 대한 체계적인 평가를 진행할 예정이에요.
- **더 많은 언어 쌍 지원** — 커뮤니티에서 검증된 데이터셋이 제공됨에 따라 Quechua, Inuktitut 및 기타 저자원 언어를 추가할 예정이에요.
- **데이터셋 가져오기(Dataset import)** — 외부 평가 데이터셋(WMT, Tatoeba 등)을 rosetta 평가 형식으로 변환하는 도구를 제공할 예정이에요.
- **자동 재실행(Automated re-runs)** — 모델 버전 변경을 감지하고 벤치마크를 다시 실행하여 점수 변동(score drift)을 추적할 예정이에요.

---

## 참고 자료

- **[Method Leaderboard](/leaderboard)** — 실시간 점수 및 제출물
- **[Eval Harness](/docs/eval/harness)** — 평가 실행 방법
- **[Evaluation Datasets](/docs/eval/datasets)** — 데이터셋 형식 및 사용 가능한 데이터셋
- **[Building a Method](/docs/eval/methods)** — 방식(method) 인터페이스 사양
- **[Run Card Specification](/docs/eval/run-card)** — run card JSON 스키마
- **[Support a Low-Resource Language](/docs/guides/low-resource-languages)** — 이 프레임워크가 존재하는 더 넓은 맥락