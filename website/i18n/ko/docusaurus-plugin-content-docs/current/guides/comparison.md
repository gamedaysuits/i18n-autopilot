---
sidebar_position: 7
title: "비교"
---
# Rosetta 비교

i18n-rosetta는 대부분의 로컬라이제이션 도구와는 다른 카테고리에 속해요. 솔직한 비교를 준비했어요.

## 업계 현황

대부분의 로컬라이제이션 도구는 다음 세 가지 카테고리 중 하나에 속해요:

| 카테고리 | 예시 | 모델 |
|----------|----------|-------|
| **클라우드 TMS 플랫폼** | Crowdin, Phrase, Locize, Tolgee | SaaS 대시보드 + 인간 번역가 + 월간 구독 |
| **키 추출 도구** | i18next-scanner, FormatJS CLI | 소스 코드에서 번역 함수 호출을 스캔 |
| **CLI 번역 엔진** | **i18n-rosetta** | 프로젝트 내에서 실행, 파일을 직접 번역, 클라우드 계정 불필요 |

Rosetta는 **CLI 번역 엔진**이에요. 구성 가능한 백엔드(LLM, Google Translate, 커스텀 플러그인)를 사용해 로케일 파일을 직접 번역해요. 클라우드 대시보드나 인간 번역가 워크플로우, 월별 청구 요금이 없어요.

---

## 기능 비교

| 기능 | i18n-rosetta | Crowdin | Phrase | Locize |
|---------|:------------:|:-------:|:------:|:------:|
| **로컬 실행 (클라우드 계정 불필요)** | ✅ | ❌ | ❌ | ❌ |
| **의존성 없음** | ✅ | ❌ | ❌ | ❌ |
| **언어 쌍별 메서드 구성** | ✅ | ❌ | ❌ | ❌ |
| **커스텀 언어 레지스터** | ✅ | ❌ | ❌ | ❌ |
| **콘텐츠 인식 (코드 블록 보호)** | ✅ | ❌ | ❌ | ❌ |
| **인공어(Conlang) 및 문자 변환** | ✅ | ❌ | ❌ | ❌ |
| **플러그인 아키텍처** | ✅ | ❌ | ❌ | ❌ |
| **Markdown / 콘텐츠 번역** | ✅ | ✅ | ✅ | ❌ |
| **인간 번역가 워크플로우** | ❌ | ✅ | ✅ | ✅ |
| **번역 메모리** | ❌ | ✅ | ✅ | ✅ |
| **인컨텍스트 편집 (시각적)** | ❌ | ✅ | ✅ | ✅ |
| **팀 협업** | ❌ | ✅ | ✅ | ✅ |
| **파일 형식 지원** | JSON, TOML, YAML, MD | 50+ | 40+ | JSON |
| **가격** | 무료 (LLM 비용만 지불) | 월 $0부터 | 월 $0부터 | 월 $0부터 |

---

## Rosetta를 사용하기 좋은 경우

**이럴 때 Rosetta를 추천해요:**

- 기계 번역을 별도의 워크플로우가 아닌 빌드 파이프라인에 통합하고 싶을 때
- 언어별로 번역 메서드를 제어해야 할 때 (일부는 LLM, 일부는 Google Translate, 나머지는 커스텀 플러그인 사용)
- API가 지원되지 않는 언어(토착어, 멸종 위기 언어, 인공어)로 번역할 때
- 결정론적인 문자 출력이 필요할 때 (Cree Syllabics, Klingon pIqaD, Tengwar 등)
- 벤더 종속성(vendor lock-in)과 클라우드 의존성을 완전히 없애고 싶을 때
- 인간 번역가 워크플로우가 필요 없는 1인 개발자나 소규모 팀일 때

**이럴 때는 클라우드 TMS가 더 적합해요:**

- 전문 번역가가 모든 문자열을 검토해야 할 때
- 여러 프로젝트에 걸쳐 번역 메모리와 용어집 관리가 필요할 때
- 인컨텍스트 시각적 편집(UI 내에서 번역 미리보기)이 필요할 때
- 역할 기반 접근 제어(RBAC)가 필요한 대규모 팀일 때
- 50개 이상의 파일 형식 지원이 필요할 때

---

## 다른 도구에는 없는 Rosetta만의 기능

### 1. 커스텀 레지스터

모든 언어 쌍에 대해 LLM이 문화적으로 적절한 어조를 사용할 수 있도록 지침을 제공해요:

```json
{
  "de": {
    "register": "Standard professional register. Use Sie-form for formal address."
  },
  "tl": {
    "register": "Educated Manila Taglish. Use Tagalog as the primary language but keep technical terms in English."
  },
  "tlh": {
    "register": "Warrior's honor. OVS grammar. Use Marc Okrand vocabulary."
  }
}
```

사전 구성된 47개의 언어 레지스터를 제공하거나 프로젝트별로 커스텀 레지스터를 정의할 수 있는 도구는 Rosetta가 유일해요.

### 2. 결정론적 문자 변환기

Rosetta는 번역 후 훅(post-translation hooks)으로 실행되는 5개의 내장 문자 변환기를 제공하며, 여기에는 LLM이 필요하지 않아요:

| 로케일 | 변환 | 예시 |
|--------|-----------|---------|
| `crk` | SRO → Cree Syllabics | `nêhiyawêwin` → `ᓀᐦᐃᔭᐍᐏᐣ` |
| `sr` | Latin → Cyrillic | `Beograd` → `Београд` |
| `tlh` | Romanization → pIqaD | `tlhIngan Hol` → (pIqaD 글리프) |
| `x-elvish-s` | Latin → Tengwar | Sindarin → Tengwar (Mode of Beleriand) |
| `x-kryptonian` | Latin → Kryptonian | 암호 치환 (폰트 필요) |

이들은 순수한 룩업 테이블(lookup-table) 변환기예요. 결정론적이고 감사 가능하며 LLM 환각(hallucination) 위험이 전혀 없어요.

### 3. 콘텐츠 인식 보호

Markdown이나 리치 콘텐츠를 번역할 때 Rosetta는 다음 항목들을 보호해요:

- 펜스 코드 블록 (` ``` `)
- 인라인 코드 (`` ` ` ``)
- Hugo 숏코드 (`{{</* */>}}`, `{{%/* */%}}`)
- 보간 변수 (`{{ .Count }}`, `{name}`, `{{t('key')}}`)
- 원시 HTML 블록

이 항목들은 번역 전에 유니코드 센티널 토큰(sentinel tokens)으로 대체되었다가 번역 후에 다시 복원돼요. 따라서 LLM은 코드, 숏코드, 변수를 전혀 볼 수 없어요.

### 4. 코칭된 메서드 플러그인

API가 지원되지 않는 언어의 경우, 코칭된 번역 메서드를 직접 구축할 수 있어요:

1. 언어적 코칭 데이터(문법 규칙, 어휘, 예문) 작성
2. 플러그인으로 번들링
3. [평가 하네스(eval harness)](https://github.com/gamedaysuits/gds-mt-eval-harness)를 사용해 참조 번역과 벤치마크 테스트 진행
4. `i18n-rosetta plugin install` 명령어로 프로젝트에 설치

이것이 Rosetta가 Plains Cree를 처리하는 방식이며, 아직 존재하지 않는 언어를 포함해 어떤 언어든 처리할 수 있는 방법이에요.

---

## 결론

Rosetta는 Crowdin을 대체하는 도구가 아니에요. 완전히 다른 워크플로우를 위한 다른 도구죠. 인간 번역가가 필요하다면 TMS를 사용하세요. 단일 명령어로 파일을 번역하고 언어별로 메서드, 모델, 레지스터를 제어할 수 있는 CLI가 필요하다면 Rosetta를 사용해 보세요.