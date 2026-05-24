---
sidebar_position: 5
title: "코칭 데이터"
---
# 코칭 데이터

코칭 데이터는 학습되지 않은 언어에 대해 LLM을 가르치기 위한 rosetta의 메커니즘이에요. 각 번역 요청과 함께 문법 규칙, 사전, 스타일 노트를 제공함으로써, 범용 LLM을 기존 MT 지원이 전혀 없는 언어를 포함하여 모든 언어에 대한 문맥 인식 번역기로 변환할 수 있어요.

## 작동 방식

페어의 메서드를 `llm-coached`(으)로 설정하면, rosetta는 `.rosetta/coaching/<locale>.json`에서 코칭 파일을 로드하고 그 내용을 시스템 메시지의 일부로 모든 LLM 프롬프트에 주입해요. LLM은 번역 요청과 함께 언어 규칙을 확인하여, 추측하는 대신 여러분의 문법과 용어를 따르는 결과물을 생성해요.

```
┌──────────────────────────────────────────────────────┐
│ System Message (cached across batches)               │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Base translation rules                           │ │
│ │ + Register instructions                          │ │
│ │ + Grammar rules (from coaching data)             │ │
│ │ + Dictionary entries (from coaching data)         │ │
│ │ + Style notes (from coaching data)               │ │
│ └──────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────┤
│ User Message (per batch)                             │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Keys to translate (JSON)                         │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

코칭 데이터는 시스템 메시지의 일부이기 때문에 **prompt caching**의 이점을 얻을 수 있어요. Anthropic이나 Google 같은 제공업체는 반복되는 시스템 접두사를 캐시하므로, 배치당 한 번이 아니라 세션당 한 번만 코칭 컨텍스트 비용을 지불하면 돼요.

## 코칭 파일 형식

`.rosetta/coaching/`에 로케일당 하나의 JSON 파일을 생성하세요:

```json title=".rosetta/coaching/crk.json"
{
  "grammar_rules": [
    "Plains Cree is polysynthetic — a single word can express what English needs a full sentence for",
    "Animate/inanimate noun distinction affects verb conjugation",
    "Use SRO (Standard Roman Orthography) unless script converter handles conversion",
    "Verb stems are modified by prefixes and suffixes to indicate person, number, tense, and evidentiality"
  ],
  "dictionary": {
    "home": "kīwēwin",
    "settings": "isi-nākatohkēwin",
    "search": "nānātawāpahtam",
    "welcome": "tānisi",
    "submit": "ispīhci",
    "cancel": "pōni"
  },
  "style_notes": "Use formal register. Preserve English technical terms in parentheses when no Cree equivalent exists. Avoid loanwords when a descriptive Cree expression exists."
}
```

### 필드

| 필드 | 타입 | 필수 여부 | 설명 |
|-------|------|----------|-------------|
| `grammar_rules` | `string[]` | 아니요 | 시스템 프롬프트에 주입되는 문법 규칙 배열이에요. 각 규칙은 LLM이 따를 수 있는 간결하고 실행 가능한 지침이어야 해요. |
| `dictionary` | `object` | 아니요 | 영어 용어 → 대상 언어 용어의 키-값 맵이에요. LLM이 알지 못하는 도메인 특화 어휘에 사용돼요. |
| `style_notes` | `string` | 아니요 | 자유 형식의 스타일 지침이에요 (어조, 톤, 격식 규칙 등). |

모든 필드는 선택 사항이에요. 사전만으로 시작해서 다듬어 가면서 문법 규칙을 추가할 수 있어요.

## 폴백(Fallback) 동작

페어가 `llm-coached`(으)로 구성되었지만 해당 로케일에 대한 코칭 파일이 존재하지 않는 경우, rosetta는 콘솔 경고와 함께 **표준 `llm` 메서드로 폴백**해요:

```
[INFO] No coaching data for "crk" at .rosetta/coaching/crk.json
       Falling back to standard LLM method. Create coaching data for better results.
```

즉, 전역적으로 `"defaultMethod": "llm-coached"`을(를) 안전하게 설정할 수 있어요. 코칭 데이터가 있는 언어는 이를 사용하고, 나머지 언어는 오류 없이 표준 LLM 번역을 받게 돼요.

## 코칭 사용 시기

| 시나리오 | 권장 메서드 |
|----------|-------------------|
| Tier 1 언어 (프랑스어, 스페인어, 독일어) | `llm` 또는 `google-translate` — LLM이 이미 잘 알고 있어요 |
| Tier 2 언어 (한국어, 튀르키예어, 태국어) | 어조(register)가 포함된 `llm` — LLM이 스타일 가이드를 통해 적절히 처리해요 |
| Tier 3 언어 (평원 크리어, 요루바어, 케추아어) | `llm-coached` — LLM에 문법 규칙과 사전이 필요해요 |
| 인공어 (클링온어, 신다린어, 크립톤어) | `llm-coached` — LLM에 일부 학습 데이터가 있지만 교정이 필요해요 |

## 좋은 코칭 데이터 구축하기

### 문법 규칙

규칙은 설명이 아닌 **지침(instructions)**으로 작성하세요. LLM은 언어학적 이론을 해석하는 것보다 지침을 따르는 것을 더 잘해요.

```json
// ❌ Descriptive (the LLM learns nothing actionable)
"Plains Cree has animate and inanimate noun classes"

// ✅ Instructive (the LLM knows what to do)
"When translating nouns, check whether the Cree equivalent is animate (NA) or inanimate (NI) — this affects which verb conjugation to use"
```

### 사전

LLM이 틀리거나 지어낼 수 있는 **도메인 특화 용어**에 집중하세요. LLM이 이미 처리할 수 있는 흔한 단어에는 신경 쓰지 말고, 애플리케이션 UI에 특화된 용어에 집중하세요.

### 스타일 노트

어조, 격식, 규칙에 대해 구체적으로 작성하세요:

```json
"style_notes": "Use formal register (vous-form in French). Preserve brand names untranslated. UI labels should be imperative mood ('Save', not 'Saves'). Maximum 40 characters for button text."
```

## 코칭된 번역 테스트하기

[MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness)를 사용하여 참조 말뭉치(reference corpus)를 기준으로 코칭된 번역을 벤치마크해 보세요:

```bash
# Install the harness
pip install mt-eval-harness

# Run coached translations against your test corpus
mt-eval run --corpus data/crk-corpus.json --model google/gemini-2.5-pro

# Score the results
mt-eval test eval/logs/run_*.json
```

이를 통해 chrF++, BLEU 및 정확한 일치(exact match) 점수를 얻을 수 있어요. 여러 버전의 코칭 파일을 만들어 비교해 보세요. 객관적인 지표가 주관적인 검토보다 낫답니다.

---

## 참고 항목

- [번역 메서드](/docs/guides/translation-methods) — llm-coached 메서드
- [로우 리소스 언어 지원하기](/docs/guides/low-resource-languages) — 실제 코칭 적용
- [플러그인 사양](/docs/reference/plugin-spec) — 플러그인에 코칭 데이터 패키징하기
- [품질 게이트](/docs/concepts/quality-gate) — 코칭된 번역이 검증되는 방법
- [구성](/docs/getting-started/configuration) — 페어별 코칭 구성