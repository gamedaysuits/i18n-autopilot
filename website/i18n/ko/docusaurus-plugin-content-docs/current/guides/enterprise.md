---
sidebar_position: 7
title: "엔터프라이즈용"
description: "리더보드에서 검증된 방법, 커스텀 플러그인, 단일 명령어 배포를 통해 조직의 번역을 표준화하는 방법을 알아보세요."
---
# 엔터프라이즈용 i18n-rosetta

팀에서 정기적으로 콘텐츠를 번역하고 계실 거예요. 로케일 파일 더미와 CI 파이프라인이 있고, 누군가 수동으로 Google Translate를 돌려 결과를 JSON에 복사한 뒤 문제가 없기를 바라는 프로세스를 거치고 있을지도 몰라요. 아니면 특정 공급업체의 번역 엔진에 종속되는 TMS 플랫폼에 비용을 지불하고 계실 수도 있죠.

더 나은 방법이 있어요.

## 핵심 제안

1. **각 언어에 가장 적합한 방식 선택** — 공급업체의 기본값이 아닌 최적의 방식을 고르세요.
2. **명령어 하나로 배포** — `npx i18n-rosetta sync` 명령어가 모든 로케일, 모든 형식을 매번 번역해 줘요.
3. **코드 변경 없이 방식 교체** — 마이그레이션이 아닌 설정 변경만으로 충분해요.
4. **파이프라인 소유** — 공급업체 종속, 월간 대시보드, 계정 생성이 필요 없어요.

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

프랑스어는 DeepL을 사용해요(팀에서 유럽어의 유창함을 선호하니까요). 일본어는 최신 LLM을 사용하고요. 독일어는 Google Translate를 사용해요(빠르고, 저렴하며, 충분히 훌륭하니까요). 한국어는 격식을 갖춘 어조(formal register)를 지원하는 LLM을 사용해요. 평원 크리어(Plains Cree)는 리더보드에서 가장 높은 점수를 받은 커뮤니티 제작 코칭 플러그인을 사용해요.

**동일한 명령어. 동일한 CI 파이프라인. 언어 쌍마다 다른 번역 방식. 단 하나의 설정 파일.**

## 리더보드 → 배포 워크플로우

:::tip 출시 예정: `rosetta leaderboard` CLI
아래 설명된 워크플로우는 [MT Eval Arena](https://mtevalarena.org) 리더보드와 i18n-rosetta CLI 간의 통합 계획이에요. 양쪽 모두 인프라는 구축되어 있으며, 현재 연결 작업을 개발 중이에요.
:::

[MT Eval Arena](https://mtevalarena.org)는 재현 가능하고 핑거프린트가 적용된 채점 방식으로 번역 방식을 벤치마킹하는 곳이에요. 모든 방식은 여러 지표(chrF++, 정확한 일치(exact match), FST 수용도, 의미론적 채점)를 바탕으로 종합 점수를 받아요. 리더보드는 모든 제출 항목을 추적해요.

계획된 워크플로우는 다음과 같아요.

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

**직접 번역 방식을 구축하거나 모델을 학습시킬 필요가 없어요. 우승자를 선택하고 배포하기만 하면 돼요.** 다음 달에 리더보드에 더 나은 방식이 등장하면, 명령어 하나로 교체할 수 있어요.

## 현재 사용 가능한 기능

리더보드와 CLI를 연결하는 브리지는 현재 개발 중이에요. 지금 당장 사용할 수 있는 기능은 다음과 같아요.

### 내장된 방식 (플러그인 불필요)

| 방식 | 최적의 용도 | 비용 |
|--------|----------|------|
| `llm` (기본값) | 품질 중심, 모든 언어 | OpenRouter를 통한 토큰당 과금 |
| `gemini` | 품질 + 무료 티어 | 무료(제한적), 이후 토큰당 과금 |
| `google-translate` | 속도 + 대용량 | 100만 자당 $20 |
| `deepl` | 유럽어 | 100만 자당 $25 |
| `llm-coached` | 코칭 데이터가 있는 언어 | OpenRouter를 통한 토큰당 과금 |
| `api` | 커스텀/커뮤니티 호스팅 방식 | 셀프 호스팅 |

### 플러그인 방식 (별도 설치)

커스텀 플러그인은 파인튜닝된 모델, FST 기반 파이프라인, 커뮤니티 API 등 JSON을 생성하는 모든 번역 로직을 래핑할 수 있어요. [플러그인 만들기](/docs/tutorials/build-a-plugin)를 참고해 보세요.

## 엔터프라이즈 워크플로우

### 1. 현재 품질 평가하기

```bash
# See what you're getting today
npx i18n-rosetta status

# Output shows: method per pair, cache hit rate, quality gate stats
```

### 2. 후보군에 평가 하네스(eval harness) 실행하기

[평가 하네스](https://mtevalarena.org/docs/specifications/harness)를 사용하면 동일한 데이터셋에 대해 여러 방식을 벤치마킹할 수 있어요. 스윕(sweep)을 실행하고, 점수를 비교하여, 가장 좋은 방식을 선택해 보세요.

```bash
# In the eval harness repo
python -m mt_eval_harness.run \
  --methods coached-v3 baseline prompt-tuned \
  --dataset data/your-corpus.json
```

### 3. 언어 쌍별 최적의 방식 설정하기

언어 쌍별로 가장 좋은 방식을 사용하도록 설정을 업데이트하세요. 언어마다 최적의 방식이 다르다는 점이 바로 핵심이에요.

### 4. CI/CD에 통합하기

```bash
# In your CI pipeline
npx i18n-rosetta lint        # Catch hardcoded strings
npx i18n-rosetta sync        # Translate what changed
npx i18n-rosetta audit       # Fail if any locale is incomplete
npx i18n-rosetta integrity   # Validate placeholder consistency
```

명령어 세 개면 충분해요. 수동 번역은 전혀 필요 없어요. 파이프라인이 하드코딩된 문자열을 포착하고, 선택한 방식으로 번역하며, 누락되거나 손상된 항목이 있으면 빌드를 실패 처리해요.

### 5. 전문가 검토 (선택 사항)

중요한 콘텐츠의 경우, 사람이 검토할 수 있도록 XLIFF로 내보내세요.

```bash
npx i18n-rosetta xliff export --locale ja --output translations.xliff
# → Send to your translation agency
# → Import corrections back:
npx i18n-rosetta xliff import translations.xliff
```

대부분의 분량은 기계 번역으로 처리하고, 중요한 부분만 사람이 검토하세요. 정말 필요한 곳에만 인건비를 지불하면 돼요.

## 비용 모델

rosetta는 **라이선스 비용, 월간 구독료, 사용자당 과금이 없어요**. 오픈 소스 CLI 도구니까요. 번역 API 호출 비용만 지불하시면 돼요.

| 분량 | Google Translate | LLM (Gemini Flash) | LLM (GPT-4o) |
|--------|-----------------|---------------------|---------------|
| 1,000개 키 × 5개 로케일 | ~$0.50 | ~$0.30 (무료 티어) | ~$2.00 |
| 10,000개 키 × 15개 로케일 | ~$15 | ~$8 | ~$60 |
| 50,000개 키 × 30개 로케일 | ~$75 | ~$40 | ~$300 |

번역 메모리(Translation Memory)를 지원하므로 이후 동기화 시에는 **변경된 키**에 대해서만 비용을 지불하면 돼요. 10,000개의 문자열 중 10개를 업데이트했다면, 10,000개가 아닌 10개에 대한 번역 비용만 청구돼요.

## TMS 플랫폼과의 비교

| | rosetta | Crowdin / Phrase / Locize |
|---|---|---|
| **가격** | 무료(오픈 소스) + API 비용 | 월 $50–$500 + 사용자당 과금 |
| **공급업체 종속성** | 없음 — 설정에서 제공업체 변경 가능 | 높음 — 데이터가 해당 클라우드에 저장됨 |
| **방식 선택** | 언어 쌍별로 모든 제공업체, 모든 모델 사용 가능 | 해당 업체가 제공하는 방식만 가능 |
| **CI/CD** | 기본 지원 (`lint → sync → audit`) | 플러그인/웹훅 |
| **커스텀 방식** | 플러그인 시스템, 커뮤니티 플러그인 | 지원하지 않음 |
| **품질 게이트** | 내장됨 (잘못된 스크립트, 에코, 길이) | 다양함 |
| **셀프 호스팅** | 가능 (LibreTranslate, 커스텀 API) | 불가능 |

자세한 내용은 [전체 비교](/docs/guides/comparison)를 확인해 보세요.

## 더 읽어보기

- **[빠른 시작](/docs/getting-started/quick-start)** — 60초 만에 첫 동기화를 실행해 보세요.
- **[번역 방식](/docs/guides/translation-methods)** — 의사 결정 트리가 포함된 전체 방식 메뉴예요.
- **[CI/CD 통합](/docs/guides/ci-cd)** — 파이프라인에서 자동화해 보세요.
- **[전문 번역가와 협업하기](/docs/guides/professional-translators)** — XLIFF 내보내기/가져오기 기능이에요.
- **[MT Eval Arena](https://mtevalarena.org)** — 벤치마크 및 리더보드예요.
- **[설정 참조](/docs/getting-started/configuration)** — 모든 설정 옵션을 확인해 보세요.