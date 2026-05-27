---
sidebar_position: 7
title: "비교"
---
# Rosetta 비교

i18n-rosetta는 대부분의 localization 도구와는 다른 범주에 속해요. 솔직한 비교를 준비했어요.

## 업계 현황

대부분의 localization 도구는 다음 세 가지 범주 중 하나에 속해요:

| 범주 | 예시 | 모델 |
|----------|----------|-------|
| **클라우드 TMS 플랫폼** | Crowdin, Phrase, Locize, Tolgee | SaaS 대시보드 + 전문 번역가 + 월간 구독 |
| **키 추출 도구** | i18next-scanner, FormatJS CLI | 소스 코드를 스캔하여 번역 함수 호출 찾기 |
| **CLI 번역 엔진** | **i18n-rosetta** | 프로젝트 내에서 실행, 파일을 직접 번역, 클라우드 계정 불필요 |

Rosetta는 **CLI 번역 엔진**이에요. 구성 가능한 백엔드(LLM, Google Translate, 커스텀 플러그인)를 사용하여 locale 파일을 직접 번역해요. 클라우드 대시보드나 전문 번역가 워크플로우, 월간 구독료가 없어요.

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
| **번역 메모리** | ✅ | ✅ | ✅ | ✅ |
| **XLIFF 내보내기/가져오기** | ✅ | ✅ | ✅ | ❌ |
| **ICU 복수형 유효성 검사** | ✅ | ✅ | ✅ | ❌ |
| **용어집 강제 적용** | ✅ | ✅ | ✅ | ❌ |
| **전문 번역가 워크플로우** | XLIFF 기반 | ✅ | ✅ | ✅ |
| **인컨텍스트 편집 (시각적)** | ❌ | ✅ | ✅ | ✅ |
| **팀 협업** | ❌ | ✅ | ✅ | ✅ |
| **파일 형식 지원** | JSON, TOML, YAML, MD, XLIFF | 50+ | 40+ | JSON |
| **가격** | 무료 (LLM 비용만 지불) | 월 $0부터 | 월 $0부터 | 월 $0부터 |

---

## Rosetta를 사용하기 좋은 경우

**다음과 같은 경우에 Rosetta가 적합해요:**

- 기계 번역을 별도의 워크플로우가 아닌 빌드 파이프라인에 통합하고 싶을 때
- 언어별로 메서드를 제어해야 할 때 (일부는 LLM, 일부는 Google Translate, 나머지는 커스텀 플러그인 사용)
- API가 지원되지 않는 언어(토착어, 소멸 위기 언어, 인공어)로 번역할 때
- 결정론적인(deterministic) 문자 출력이 필요할 때 (Cree Syllabics, Klingon pIqaD, Tengwar)
- 벤더 종속성(vendor lock-in)과 클라우드 의존성을 완전히 없애고 싶을 때
- 완전한 TMS 대시보드가 필요 없는 1인 개발자나 소규모 팀일 때
- 클라우드 구독 없이 XLIFF 기반으로 전문 번역가에게 작업을 전달하고 싶을 때

**다음과 같은 경우에는 클라우드 TMS가 더 적합해요:**

- 전문 번역가가 모든 문자열을 검토하는 경우 (Rosetta의 XLIFF 워크플로우는 완전한 TMS보다 단순해요)
- 프로젝트 간 번역 메모리 및 용어집 관리가 필요할 때
- 인컨텍스트 시각적 편집이 필요할 때 (UI 내에서 번역 미리보기)
- 역할 기반 접근 제어(RBAC)가 필요한 대규모 팀일 때
- 50개 이상의 파일 형식 지원이 필요할 때

---

## 다른 도구에는 없는 Rosetta의 기능

### 1. 커스텀 레지스터

모든 언어 쌍에는 LLM을 위한 문화적으로 적절한 어조(tone) 지침이 제공돼요:

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

사전 구성된 47개의 언어 레지스터를 제공하거나 프로젝트별로 커스텀 레지스터를 정의할 수 있는 도구는 Rosetta뿐이에요.

### 2. 결정론적 문자 변환기

Rosetta는 번역 후 훅(post-translation hooks)으로 실행되는 5개의 내장 문자 변환기를 제공하며, 여기에는 LLM이 필요하지 않아요:

| 로케일 | 변환 | 예시 |
|--------|-----------|---------|
| `crk` | SRO → Cree Syllabics | `nêhiyawêwin` → `ᓀᐦᐃᔭᐍᐏᐣ` |
| `sr` | Latin → Cyrillic | `Beograd` → `Београд` |
| `tlh` | Romanization → pIqaD | `tlhIngan Hol` → (pIqaD 글리프) |
| `x-elvish-s` | Latin → Tengwar | Sindarin → Tengwar (Mode of Beleriand) |
| `x-kryptonian` | Latin → Kryptonian | 암호 치환 (글꼴 필요) |

이들은 순수한 룩업 테이블(lookup-table) 변환기예요. 결정론적이고 감사 가능하며 LLM의 환각(hallucination) 위험이 전혀 없어요.

### 3. 콘텐츠 인식 보호

Markdown이나 리치 콘텐츠를 번역할 때 Rosetta는 다음 요소를 보호해요:

- 펜스 코드 블록 (` ``` `)
- 인라인 코드 (`` ` ` ``)
- Hugo 숏코드 (`{{</* */>}}`, `{{%/* */%}}`)
- 보간 변수 (`{{ .Count }}`, `{name}`, `{{t('key')}}`)
- 원시 HTML 블록

이러한 요소들은 번역 전에 유니코드 센티널(sentinel) 토큰으로 대체되었다가 번역 후에 복원돼요. LLM은 여러분의 코드, 숏코드 또는 변수를 전혀 보지 못해요.

### 4. 코칭된 메서드 플러그인

API가 지원되지 않는 언어의 경우, 코칭된 번역 메서드를 구축할 수 있어요:

1. 언어적 코칭 데이터 작성 (문법 규칙, 어휘, 예문)
2. 플러그인으로 번들링
3. [평가 하네스](https://github.com/gamedaysuits/gds-mt-eval-harness)를 사용하여 참조 번역과 벤치마크 테스트
4. `i18n-rosetta plugin install` 명령어로 프로젝트에 설치

이것이 Rosetta가 Plains Cree어를 처리하는 방식이며, 아직 존재하지 않는 언어를 포함해 어떤 언어든 처리할 수 있는 방법이에요.

---

## 결론

Rosetta는 Crowdin을 대체하는 도구가 아니에요. 다른 워크플로우를 위한 다른 도구랍니다. 전문 번역가가 필요하다면 TMS를 사용하세요. 단일 명령어로 파일을 번역하고 언어별로 메서드, 모델, 레지스터를 제어할 수 있는 CLI가 필요하다면 Rosetta를 사용해 보세요.