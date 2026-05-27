---
sidebar_position: 6
title: "스크립트 변환기"
---
# Script Converters

Script converter는 텍스트를 한 문자 체계에서 다른 문자 체계로 변환하는 결정론적(deterministic)이고 LLM을 사용하지 않는 번역 후처리 훅(post-translation hooks)이에요. 이를 통해 "한 번 번역하고, 여러 스크립트로 렌더링"하는 워크플로우를 사용할 수 있어요. 즉, 작업용 스크립트(일반적으로 Latin)로 번역한 다음, 표시용 스크립트로 자동 변환해요.

## 왜 Script Converters를 사용하나요?

일부 언어는 동일한 구어에 대해 여러 스크립트를 사용해요.

- **Plains Cree**: 편집용 SRO (Latin) → 표시용 Syllabics (ᓀᐦᐃᔭᐍᐏᐣ)
- **Serbian**: 국제용 Latin → 국내용 Cyrillic
- **Klingon**: 입력용 Romanization → 표시용 pIqaD (  )

비라틴(non-Latin) 스크립트로 직접 번역하면 문제가 발생해요. LLM이 문자를 환각(hallucinate)하고, JSON 파일의 버전 관리가 어려워지며, diff 도구로 변경 사항을 비교할 수 없게 돼요. Script converter는 번역을 버전 관리에 적합한 스크립트로 유지하고 동기화(sync) 시점에 결정론적으로 변환하여 이 문제를 해결해요.

## 사용 가능한 Converters

Rosetta에는 5개의 내장 Script converter가 포함되어 있어요.

| 로케일 | 원본 | 대상 | 유형 | 폰트 필요 여부 |
|--------|------|----|------|----------------|
| `crk` | SRO (Standard Roman Orthography) | Cree Syllabics | 결정론적(Deterministic) | 아니요 — 네이티브 Unicode |
| `sr` | Latin | Cyrillic | 결정론적(Deterministic) | 아니요 — 네이티브 Unicode |
| `tlh` | Romanization | pIqaD | 결정론적(Deterministic) | 예 — PUA U+F8D0–F8FF |
| `x-elvish-s` | Latin | Tengwar (Mode of Beleriand) | 결정론적(Deterministic) | 예 — PUA U+E000–E07F |
| `x-kryptonian` | Latin | Kryptonian | 폰트 기반 암호 | 예 — PUA U+E100–E119 |

### 결정론적(Deterministic) vs. 폰트 기반(Font-Based)

- **결정론적 변환기(Deterministic converters)** (Cree, Serbian, Klingon, Tengwar)는 언어적 규칙을 사용하여 실제 문자 대 문자 매핑을 수행해요. 출력 결과에는 실제 Unicode 문자가 포함돼요.
- **폰트 기반 변환기(Font-based converters)** (Kryptonian)는 1:1 치환 암호(substitution ciphers)로, 특정 폰트가 로드되었을 때만 올바르게 렌더링되는 Unicode PUA 문자를 출력해요.

## 작동 방식

Script converter는 번역 **이후** 후처리 단계로 실행돼요. 파이프라인은 다음과 같아요.

```
Source (English) → LLM Translation → Working Script → Script Converter → Display Script
```

예를 들어, Plains Cree의 경우:
```
"Welcome" → LLM → "tānisi" (SRO) → Converter → "ᑖᓂᓯ" (Syllabics)
```

### 탐욕적 좌측에서 우측으로의 매칭 (Greedy Left-to-Right Matching)

모든 변환기는 동일한 알고리즘을 사용해요. 각 문자 위치에서 가능한 가장 긴 일치 항목을 먼저 시도한 다음, 점진적으로 더 짧은 일치 항목을 시도해요. 어떤 패턴과도 일치하지 않는 문자(공백, 문장 부호, 숫자)는 변경되지 않고 그대로 통과돼요.

이를 통해 이중음자(digraphs)와 삼중음자(trigraphs)를 올바르게 처리할 수 있어요.
- Klingon: `tlh` → 단일 pIqaD 문자 (`t` + `l` + `h`가 아님)
- Serbian: `nj` → `њ` (`н` + `ј`가 아님)
- Cree: `twê` → 단일 음절 문자(syllabic) (`t` + `w` + `ê`가 아님)

## Script Converters 사용하기

로케일 코드가 등록된 변환기와 일치하면 Script converter가 자동으로 활성화돼요. 별도의 구성이 필요하지 않아요. 대상 로케일만 설정해 주세요:

```json title="i18n-rosetta.config.json"
{
  "pairs": {
    "en:crk": {
      "method": "llm-coached",
      "model": "google/gemini-2.5-pro"
    }
  }
}
```

rosetta가 `en:crk` 쌍을 동기화할 때, 번역은 먼저 SRO로 생성된 다음 `crk.json`에 쓰기 전에 자동으로 Syllabics로 변환돼요.

### 변환기 상태 확인하기

```bash
npx i18n-rosetta status
```

상태 출력에는 활성화된 Script converter가 있는 쌍과 수행하는 변환 작업이 표시돼요.

## 웹 폰트 요구 사항

세 개의 변환기는 사용자 지정 웹 폰트가 필요한 Unicode 사용자 정의 영역(PUA) 문자를 출력해요.

### Klingon (pIqaD)

CSUR 호환 pIqaD 폰트(예: "pIqaD qolqoS" 또는 "Klingon pIqaD HaSta")를 설치해 주세요:

```css
@font-face {
  font-family: 'pIqaD';
  src: url('/fonts/pIqaD.woff2') format('woff2');
  unicode-range: U+F8D0-F8FF;
}

:lang(tlh) {
  font-family: 'pIqaD', sans-serif;
}
```

### Tengwar (Sindarin)

CSUR 호환 Tengwar 폰트(예: "Tengwar Formal CSUR", "Tengwar Annatar")를 설치해 주세요:

```css
@font-face {
  font-family: 'Tengwar';
  src: url('/fonts/tengwar-formal-csur.woff2') format('woff2');
  unicode-range: U+E000-E07F;
}

:lang(x-elvish-s) {
  font-family: 'Tengwar', serif;
}
```

### Kryptonian

PUA 코드 포인트 U+E100–E119에 매핑된 Kryptonian 폰트를 설치해 주세요:

```css
@font-face {
  font-family: 'Kryptonian';
  src: url('/fonts/kryptonian.woff2') format('woff2');
  unicode-range: U+E100-E119;
}

:lang(x-kryptonian) {
  font-family: 'Kryptonian', sans-serif;
}
```

:::tip Kryptonian을 위한 대안적인 접근 방식
Kryptonian은 순수한 A-Z 암호이므로, Script converter를 완전히 건너뛰고 CSS를 통해 Latin 텍스트에 폰트를 적용할 수 있어요. 이는 웹 배포 시 더 간단한 경우가 많아요. Kryptonian 폰트를 제공하고 관련 요소에 `font-family`를 설정하기만 하면 돼요.
:::

## 사용자 지정 Converter 추가하기

새로운 언어를 위한 변환기를 추가하려면 `lib/scripts.js`을 편집해 주세요:

1. **변환 맵 생성** — 가장 긴 시퀀스를 먼저 배치한 `[from, to]` 쌍의 정렬된 배열을 생성해 주세요.
2. **변환기 함수 생성** — 탐욕적(greedy)으로 좌측에서 우측으로 스캔하는 스캐너를 생성해 주세요 (`sroToSyllabics`을 템플릿으로 사용해 주세요).
3. **등록하기** — 로케일 코드를 키로 사용하여 `SCRIPT_CONVERTERS` 객체에 등록해 주세요.
4. **`script` 필드 추가** — `registers.js`의 해당 언어 등록 항목에 추가해 주세요.

```javascript
// Example: adding a converter for Cherokee (chr)
const LATIN_TO_CHEROKEE_MAP = [
  ['ga', 'Ꭶ'], ['ka', 'Ꭷ'], ['ge', 'Ꭸ'], // ...
];

function latinToCherokee(text) {
  // Same greedy left-to-right pattern as other converters
}

SCRIPT_CONVERTERS['chr'] = {
  from: 'Latin',
  to: 'Cherokee Syllabary',
  type: 'deterministic',
  converter: latinToCherokee,
};
```

---

## 함께 보기

- [인공어, 스크립트 및 정서법](/docs/guides/conlangs-scripts-orthography) — PUA 폰트, Unicode, 새로운 변환기 추가
- [Quality Gate](/docs/concepts/quality-gate) — 스크립트 변환 전에 실행되는 유효성 검사
- [지원되는 언어](/docs/reference/supported-languages) — Script converter가 지원되는 언어
- [자원이 부족한 언어 지원하기](https://mtevalarena.org/docs/community/low-resource-languages) — 컨텍스트 내 SRO→Syllabics 변환
- [쿡북: FST-Gated 파이프라인](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — 다단계 파이프라인에서의 스크립트 변환