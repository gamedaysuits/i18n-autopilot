---
sidebar_position: 2
title: "30개 언어 번역"
description: "Cookbook: per-pair method mixing, batching 및 CI integration을 활용하여 프로젝트를 3개 언어에서 30개 언어로 확장해 보세요."
---
# 쿡북: 30개 언어 번역하기

소수의 로케일에서 글로벌 커버리지로 프로젝트를 확장해 보세요. 이 쿡북에서는 실제 다국어 배포를 위한 메서드 선택, 비용 최적화, 그리고 CI 통합 과정을 살펴봐요.

**시나리오:** `en`, `fr`, `es`를 지원하는 SaaS 앱이 있어요. 세 가지 품질 요구 사항 계층에 걸쳐 27개 언어를 추가해야 해요.

---

## 1단계: 언어 분류하기

30개 언어 모두에 동일한 접근 방식이 필요한 것은 아니에요. 사용 가능한 메서드 품질에 따라 언어를 그룹화해 보세요:

| 계층 | 언어 | 메서드 | 이유 |
|------|-----------|--------|-----|
| **Tier 1 — 프리미엄** | `ja`, `ko`, `zh`, `de`, `pt` | `llm` (GPT-4o) | 가치가 높은 시장, 미묘한 문법 차이 |
| **Tier 2 — 표준** | `it`, `nl`, `pl`, `sv`, `da`, `fi`, `no`, `cs`, `ro`, `hu`, `el`, `tr`, `id`, `ms`, `th`, `vi`, `uk`, `bg` | `google-translate` | 대용량, Google에서 잘 지원됨 |
| **Tier 3 — 코칭됨** | `crk`, `oj`, `mi`, `haw` | `llm-coached` + 플러그인 | 리소스가 적음, 용어 적용 필요 |

## 2단계: 페어별 구성하기

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "defaultMethod": "google-translate",
  "model": "google/gemini-3.5-flash",
  "languages": {
    "ja": { "name": "Japanese", "register": "Polite/formal" },
    "ko": { "name": "Korean", "register": "Formal" },
    "zh": { "name": "Simplified Chinese", "register": "Neutral" },
    "de": { "name": "German", "register": "Formal (Sie)" },
    "pt": { "name": "Brazilian Portuguese", "register": "Informal" },
    "crk": { "name": "Plains Cree (SRO)", "register": "Neutral" }
  },
  "pairs": {
    "en:ja": { "method": "llm", "model": "openai/gpt-4o" },
    "en:ko": { "method": "llm", "model": "openai/gpt-4o" },
    "en:zh": { "method": "llm", "model": "openai/gpt-4o" },
    "en:de": { "method": "llm", "model": "openai/gpt-4o" },
    "en:pt": { "method": "llm", "model": "openai/gpt-4o" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

**참고:** `pairs`에 나열되지 않은 언어는 `defaultMethod: "google-translate"`을 상속받아요. 30개 언어를 모두 나열할 필요는 없어요.

:::info
`crk` 지원은 현재 개발 중이에요. 상태 및 기여 가이드라인은 [리소스가 적은 언어 지원하기](/docs/guides/low-resource-languages)를 확인해 주세요.
:::

## 3단계: API 키 설정하기

이 구성을 위해서는 두 API 키가 모두 필요해요:

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
export GOOGLE_TRANSLATE_API_KEY="AIza..."
```

## 4단계: 먼저 Dry Run 실행하기

30개 언어를 번역하기 전에 항상 미리보기를 확인하세요:

```bash
npx i18n-rosetta sync --dry
```

출력 결과를 검토해 보세요. 다음 내용이 표시될 거예요:
- 어떤 페어가 어떤 메서드를 사용하는지
- 로케일당 새롭거나 변경된 키가 몇 개인지
- 계층별 예상 API 호출 수

## 5단계: 동기화 실행하기

```bash
npx i18n-rosetta sync
```

Rosetta는 각 페어를 독립적으로 처리해요. Google Translate를 사용하는 Tier 2 페어는 빠를 거예요. Tier 1 LLM 페어는 더 느리지만 품질이 더 높아요. Tier 3 코칭된 페어는 플러그인의 코칭 데이터를 사용해요.

### 증분 업데이트

초기 동기화 이후, 후속 실행에서는 **변경되거나 새로운** 키만 번역해요:

```bash
# Only keys that changed since last sync
npx i18n-rosetta sync
```

잠금 파일(`.i18n-rosetta.lock`)이 번역된 내용을 추적하므로, 안정적인 콘텐츠를 다시 번역할 일은 없어요.

## 6단계: 품질 감사하기

모든 언어 페어의 상태를 확인해 보세요:

```bash
npx i18n-rosetta status
```

각 페어의 메서드, 모델, 품질 계층, 그리고 코칭 데이터나 벤치마크 점수 사용 가능 여부를 보여주는 표가 출력돼요.

## 7단계: CI 통합하기

푸시할 때마다 번역이 최신 상태로 유지되도록 GitHub Actions 워크플로우에 추가해 보세요:

```yaml title=".github/workflows/i18n-sync.yml"
name: Sync Translations
on:
  push:
    paths:
      - 'locales/en/**'

jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - name: Sync translations
        run: npx i18n-rosetta sync
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
          GOOGLE_TRANSLATE_API_KEY: ${{ secrets.GOOGLE_TRANSLATE_API_KEY }}

      - name: Commit updated translations
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add locales/
          git diff --staged --quiet || git commit -m "chore(i18n): sync translations"
          git push
```

## 비용 예측

30개 언어에 걸쳐 500개의 소스 키가 있는 프로젝트의 경우:

| 계층 | 언어 | 메서드 | 예상 비용 |
|------|-----------|--------|-----------------|
| Tier 1 (5개 언어) | ja, ko, zh, de, pt | GPT-4o | 전체 동기화당 ~$2.50 |
| Tier 2 (18개 언어) | it, nl, pl 등 | Google Translate | 전체 동기화당 ~$0.90 |
| Tier 3 (4개 언어) | crk, oj, mi, haw | GPT-4o-mini 코칭됨 | 전체 동기화당 ~$0.40 |
| **총합** | **30개 언어** | **혼합** | **전체 동기화당 ~$3.80** |

증분 동기화(5~20개의 변경된 키) 비용은 전체 동기화 비용의 일부에 불과해요.

## 참고 항목

- [번역 메서드](/docs/guides/translation-methods) — 각 번역 메서드의 작동 방식과 사용 시기
- [플러그인 사양](/docs/reference/plugin-spec) — Tier 3 언어에 대한 코칭 데이터 생성하기
- [CI/CD 가이드](/docs/guides/ci-cd) — PR 미리보기 빌드를 포함한 고급 CI 패턴
- [품질 게이트](/docs/concepts/quality-gate) — Rosetta가 번역을 작성하기 전에 모든 번역을 검증하는 방법
- [지원되는 언어](/docs/reference/supported-languages) — 언어 코드 및 메서드 호환성 전체 목록
- [리소스가 적은 언어 지원하기](/docs/guides/low-resource-languages) — 광범위한 기계 번역(MT) 커버리지가 없는 언어를 위한 코칭 데이터 추가하기