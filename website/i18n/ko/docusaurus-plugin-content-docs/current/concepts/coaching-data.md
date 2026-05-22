---
sidebar_position: 5
title: "코칭 데이터"
---
# Coaching Data

Coaching Data는 학습되지 않은 언어에 대해 LLM을 교육하기 위한 rosetta의 메커니즘입니다. 각 번역 요청과 함께 문법 규칙, 사전 및 스타일 노트를 제공함으로써, 기존 MT 지원이 전혀 없는 언어를 포함하여 모든 언어에 대해 범용 LLM을 문맥을 인식하는 번역기로 변환할 수 있습니다.

## 작동 방식

페어의 메서드를 `llm-coached`(으)로 설정하면, rosetta는 `.rosetta/coaching/<locale>.json`에서 코칭 파일을 로드하고 그 내용을 시스템 메시지의 일부로서 모든 LLM 프롬프트에 주입합니다. LLM은 번역 요청과 함께 사용자의 언어적 규칙을 확인하며, 추측하는 대신 사용자의 문법과 용어를 따르는 출력을 생성합니다.

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

Coaching Data는 시스템 메시지의 일부이므로 **프롬프트 캐싱(prompt caching)**의 이점을 얻습니다. Anthropic 및 Google과 같은 제공업체는 반복되는 시스템 접두사를 캐시하므로, 배치당 한 번이 아니라 세션당 한 번만 코칭 컨텍스트에 대한 비용을 지불하면 됩니다.

## 코칭 파일 형식

`.rosetta/coaching/`에 로케일당 하나의 JSON 파일을 생성하십시오.

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

| 필드 | 유형 | 필수 여부 | 설명 |
|-------|------|----------|-------------|
| `grammar_rules` | `string[]` | 아니요 | 시스템 프롬프트에 주입되는 문법 규칙의 배열입니다. 각 규칙은 LLM이 따를 수 있는 간결하고 실행 가능한 지침이어야 합니다. |
| `dictionary` | `object` | 아니요 | 영어 용어 → 대상 언어 용어의 키-값 맵입니다. LLM이 알지 못하는 도메인별 어휘에 사용됩니다. |
| `style_notes` | `string` | 아니요 | 자유 형식의 스타일 지침입니다(어조, 톤, 격식 규칙). |

모든 필드는 선택 사항입니다. 사전만으로 시작하여 다듬어 가면서 문법 규칙을 추가할 수 있습니다.

## 대체(Fallback) 동작

페어가 `llm-coached`(으)로 구성되어 있지만 해당 로케일에 대한 코칭 파일이 존재하지 않는 경우, rosetta는 콘솔 경고와 함께 **표준 `llm` 메서드로 대체(fallback)**됩니다.

```
[INFO] No coaching data for "crk" at .rosetta/coaching/crk.json
       Falling back to standard LLM method. Create coaching data for better results.
```

이는 전역적으로 `"defaultMethod": "llm-coached"`을(를) 안전하게 설정할 수 있음을 의미합니다. Coaching Data가 있는 언어는 이를 사용하고, 나머지 언어는 오류 없이 표준 LLM 번역을 받게 됩니다.

## 코칭 사용 시기

| 시나리오 | 권장 메서드 |
|----------|-------------------|
| Tier 1 언어 (프랑스어, 스페인어, 독일어) | `llm` 또는 `google-translate` — LLM이 이미 이 언어들을 잘 알고 있습니다. |
| Tier 2 언어 (한국어, 튀르키예어, 태국어) | 어조가 포함된 `llm` — LLM이 스타일 가이드를 통해 이를 적절하게 처리합니다. |
| Tier 3 언어 (평원 크리어, 요루바어, 케추아어) | `llm-coached` — LLM에 문법 규칙과 사전이 필요합니다. |
| 인공어(Conlangs) (클링온어, 신다린어, 크립톤어) | `llm-coached` — LLM에 일부 학습 데이터가 있지만 교정이 필요합니다. |

## 훌륭한 Coaching Data 구축하기

### 문법 규칙

규칙은 설명이 아닌 **지침**으로 작성하십시오. LLM은 언어학적 이론을 해석하는 것보다 지침을 따르는 것을 더 잘 수행합니다.

```json
// ❌ Descriptive (the LLM learns nothing actionable)
"Plains Cree has animate and inanimate noun classes"

// ✅ Instructive (the LLM knows what to do)
"When translating nouns, check whether the Cree equivalent is animate (NA) or inanimate (NI) — this affects which verb conjugation to use"
```

### 사전

LLM이 틀리거나 지어낼 수 있는 **도메인별 용어**에 집중하십시오. LLM이 이미 처리할 수 있는 일반적인 단어에는 신경 쓰지 마시고, 애플리케이션의 UI에 특화된 용어에 집중하십시오.

### 스타일 노트

어조, 격식 및 규칙에 대해 구체적으로 명시하십시오.

```json
"style_notes": "Use formal register (vous-form in French). Preserve brand names untranslated. UI labels should be imperative mood ('Save', not 'Saves'). Maximum 40 characters for button text."
```

## 코칭된 번역 테스트하기

[MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness)를 사용하여 참조 코퍼스와 비교하여 코칭된 번역을 벤치마킹하십시오.

```bash
# Install the harness
pip install mt-eval-harness

# Run coached translations against your test corpus
mt-eval run --corpus data/crk-corpus.json --model google/gemini-2.5-pro

# Score the results
mt-eval test eval/logs/run_*.json
```

이를 통해 chrF++, BLEU 및 정확한 일치(exact match) 점수를 얻을 수 있습니다. 여러 버전의 코칭 파일을 생성하고 비교해 보십시오. 객관적인 지표가 주관적인 검토보다 낫습니다.

## 참고 항목

- [로우 리소스 언어](/docs/guides/low-resource-languages) — 처음부터 번역 파이프라인을 구축하기 위한 전체 연습 가이드
- [번역 메서드](/docs/guides/translation-methods) — 사용 가능한 모든 메서드 비교
- [플러그인 빌드](/docs/tutorials/build-a-plugin) — 코칭된 메서드를 재사용 가능한 플러그인으로 패키징