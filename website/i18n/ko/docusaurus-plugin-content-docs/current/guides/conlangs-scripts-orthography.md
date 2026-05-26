---
sidebar_position: 3
title: "인공어, 문자 및 정서법"
---
# 인공어, 문자 및 정서법

rosetta는 LLM 레지스터와 결정론적 문자 변환기를 통해 인공어(constructed languages)를 최고 수준으로 지원해요. 이 가이드에서는 인공어 지원이 어떻게 작동하는지, 어떤 폰트가 필요한지, 그리고 나만의 인공어를 추가하는 방법을 설명해요.

:::tip 인공어가 중요한 이유
인공어는 단순한 흥미거리가 아니에요. 실제 소외된 언어에 사용되는 것과 정확히 동일한 인프라를 활용하거든요. 품질 게이트, 코칭 시스템, 문자 변환 파이프라인은 클링온어(Klingon)와 평원 크리어(Plains Cree)에서 동일하게 작동해요. 인공어 파이프라인이 잘 작동한다면, 자원이 부족한 언어의 파이프라인도 잘 작동할 거예요.
:::

---

## 지원되는 인공어

| 언어 | 코드 | 문자 변환기 | 필요 폰트 |
|----------|------|:----------------:|:-------------:|
| 클링온어 (Klingon) | `tlh` | ✅ 로마자 표기법 → pIqaD | PUA 폰트 (예: pIqaD qolqoS) |
| 신다린 (톨킨 엘프어) | `x-elvish-s` | ✅ 라틴 문자 → 텡과르(Tengwar) | CSUR PUA 폰트 |
| 크립톤어 (Kryptonian) | `x-kryptonian` | ✅ 라틴 문자 → 크립톤 문자 | PUA 폰트 |
| 해적 영어 (Pirate English) | `x-pirate` | ❌ 레지스터 전용 | 없음 |
| 셰익스피어 영어 | `x-shakespeare` | ❌ 레지스터 전용 | 없음 |
| 요다어 (Yoda-speak) | `x-yoda` | ❌ 레지스터 전용 | 없음 |

인공어 코드는 BCP-47 사용자 정의(private-use) 규칙에 따라 `x-` 접두사를 사용해요. 단, SIL 인터내셔널에서 할당한 [ISO 639-3](https://iso639-3.sil.org/code/tlh) 코드를 가진 클링온어(`tlh`)는 예외예요.

---

## 유니코드, PUA 및 폰트 요구 사항

### 사용자 정의 영역 (PUA)

클링온어(pIqaD), 신다린(텡과르), 크립톤어는 유니코드 **사용자 정의 영역(PUA)** 문자를 사용해요. PUA는 U+E000–U+F8FF 범위이며, 이 코드포인트들에는 **표준 할당이 없어요**. [CSUR(ConScript Unicode Registry)](https://www.evertype.com/standards/csur/)에서 가상 문자에 대해 커뮤니티가 합의한 매핑을 유지 관리하지만, 이는 유니코드 표준의 일부가 아니에요.

실제로는 다음을 의미해요.

- 올바른 폰트를 로드하지 않으면 PUA 텍스트가 **빈 상자**(□□□)로 렌더링돼요.
- 폰트마다 동일한 PUA 코드포인트에 다른 글리프를 매핑할 수 있어요.
- rosetta는 PUA 폰트를 번들로 제공하지 않으므로 직접 로드해야 해요.
- 시스템 폰트는 이러한 문자를 절대 렌더링하지 않아요.

### 문자별 PUA 범위

| 문자 | PUA 범위 | CSUR 참조 |
|--------|-----------|---------------|
| 클링온어 (pIqaD) | U+F8D0–U+F8FF | [CSUR 클링온어](https://www.evertype.com/standards/csur/klingon.html) |
| 텡과르 (엘프어) | U+E000–U+E07F | [CSUR 텡과르](https://www.evertype.com/standards/csur/tengwar.html) |
| 크립톤어 | 폰트마다 다름 | CSUR 표준 없음 |

### PUA 웹 폰트 로드하기

웹 애플리케이션에서 PUA 기반 인공어 텍스트를 표시하려면 CSS를 통해 적절한 폰트를 로드하세요.

```css
/* Load a Klingon PUA font */
@font-face {
  font-family: 'pIqaD';
  src: url('/fonts/piqad.woff2') format('woff2');
  unicode-range: U+F8D0-U+F8FF;
}

/* Apply to Klingon text elements */
[lang="tlh"] {
  font-family: 'pIqaD', sans-serif;
}
```

:::warning 유니코드 지원은 보장되지 않아요
유니코드 컨소시엄은 가상 문자를 표준으로 인코딩하는 것을 [명시적으로 거부](https://www.unicode.org/faq/private_use.html)했어요. PUA 할당은 커뮤니티에서 유지 관리하며 폰트 구현 간에 충돌이 발생할 수 있어요. 항상 프로젝트에서 사용하는 정확한 폰트를 지정하고, 여러 브라우저에서 렌더링을 테스트하세요.
:::

---

## 문자 변환기

### 작동 방식

rosetta의 문자 변환은 **번역 후 훅(post-translation hook)**이에요.

1. LLM이 텍스트를 **작업용 문자**(주로 라틴 문자 또는 SRO)로 번역해요.
2. [품질 게이트](/docs/concepts/quality-gate)가 출력 결과를 검증해요.
3. 결정론적 변환기가 검증된 텍스트를 **표시용 문자**로 변환해요.
4. 변환된 텍스트가 디스크에 기록돼요.

이 2단계 접근 방식이 효과적인 이유는 LLM이 라틴 기반 문자로 작업할 때 더 나은 결과를 생성하기 때문이에요. 결정론적 변환기는 모델의 (종종 신뢰할 수 없는) 문자 지식에 의존하지 않고 올바른 문자 출력을 보장해요.

### 5가지 변환기 모두 보기

rosetta에는 5개의 내장 문자 변환기가 포함되어 있어요.

#### 평원 크리어: SRO → 음절 문자 (`crk`)

표준 로마자 표기법(SRO)을 캐나다 원주민 음절 문자로 변환해요.

```
Input:  "tawâw"
Output: "ᑕᐚᐤ"
```

장모음은 매크론/서컴플렉스(ê, î, ô, â)를 사용해요. 변환기는 모든 SRO 발음 구별 기호를 처리하고 올바른 음절 문자에 매핑해요. 전체 크리어 파이프라인은 [자원이 부족한 언어 지원](https://mtevalarena.org/docs/community/low-resource-languages)을 참조하세요.

#### 세르비아어: 라틴 문자 → 키릴 문자 (`sr`)

세르비아어를 위한 결정론적 라틴-키릴 문자 변환이에요.

```
Input:  "zdravo"
Output: "здраво"
```

이중음자(lj → љ, nj → њ, dž → џ)를 포함한 전체 세르비아어 알파벳 매핑을 처리해요.

#### 클링온어: 로마자 표기법 → pIqaD (`tlh`)

마크 오크랜드(Marc Okrand)의 로마자 표기법 시스템을 pIqaD PUA 문자로 변환해요.

```
Input:  "Qapla'"    (romanized Klingon)
Output: [pIqaD PUA] (requires pIqaD font to render)
```

#### 신다린: 라틴 문자 → 텡과르 (`x-elvish-s`)

톨킨의 신다린 모드 텡과르 매핑이에요.

```
Input:  "elen síla"  (Latin Sindarin)
Output: [Tengwar PUA] (requires Tengwar font to render)
```

#### 크립톤어: 라틴 문자 → 크립톤 문자 (`x-kryptonian`)

팬덤 사전의 크립톤 문자 매핑이에요.

```
Input:  "Kal-El"
Output: [Kryptonian PUA] (requires Kryptonian font to render)
```

### 변환기 트리거하기

언어 설정에서 `scripts` 필드를 설정하세요. 내장 변환기의 경우 언어 코드에서 자동으로 감지돼요.

```json
{
  "languages": {
    "sr": { "scripts": "sr" },
    "crk": {}
  }
}
```

평원 크리어(`crk`)는 자동 감지되므로 `scripts`를 명시적으로 설정할 필요가 없어요.

---

## 다중 문자 언어

일부 실제 언어는 여러 문자를 활발하게 사용해요.

| 언어 | 문자 | rosetta 접근 방식 |
|----------|---------|-----------------|
| 세르비아어 | 라틴 문자 + 키릴 문자 | 문자 변환기 (`sr`) — 라틴 문자로 번역 후 키릴 문자로 변환 |
| 중국어 | 간체 + 번체 | 별도의 로캘 코드 (`zh` 및 `zh-TW`)와 고유한 레지스터 사용 |

두 문자가 동일한 대상을 위한 언어(세르비아어)의 경우 문자 변환기를 사용하세요. 문자가 서로 다른 대상을 위한 언어(중국 본토의 중국어 간체, 대만/홍콩의 번체)의 경우 별도의 로캘 코드를 사용하세요.

---

## 정서법 참고 사항

레지스터는 단순한 어조가 아니에요. LLM이 올바른 쓰기 규칙을 따르도록 유도하는 **정서법 지침**을 포함하고 있어요.

### 격식 있는 호칭

rosetta의 내장 레지스터에는 각 언어에 문화적으로 적합한 격식 있는 호칭이 포함되어 있어요.

| 언어 | 격식 형태 | 레지스터 지침 |
|----------|------------|---------------------|
| 독일어 | Sie | `Use Sie-form for formal address` |
| 프랑스어 | vous | `Use vous-form` |
| 러시아어 | вы | `Professional register with вы-form` |
| 튀르키예어 | siz | `Professional register with siz-form` |
| 한국어 | 합쇼체 | `Formal Korean (합쇼체)` |
| 일본어 | です/ます | `Polite professional register (です/ます form)` |
| 폴란드어 | Pan/Pani | `Professional register with Pan/Pani form` |

### 성 포용적 글쓰기

각 언어 카드에는 언어별 조언이 담긴 `gender.inclusiveGuidance` 필드가 있어요. 이는 레지스터 사전 설정과 별개로 LLM 번역 프롬프트에 주입되므로, 사용자가 어떤 격식 사전 설정을 선택하든 일관되게 적용돼요.

- **프랑스어**: 가운뎃점 표기법을 사용한 포용적 글쓰기(Écriture inclusive) (예: "Connecté·e")
- **독일어**: 콜론 표기법(Doppelpunkt) (예: "Benutzer:innen")
- **스페인어**: 성 중립적인 문장 구조 재구성을 선호하며, 대안으로 슬래시 표기법(예: "usuario/a") 사용

카드에 특정 지침이 없는 언어(예: 한국어, 인공어)의 경우 시스템은 *"성 중립적인 형태나 가능한 가장 포용적인 옵션을 선호합니다."*라는 일반 규칙을 기본으로 사용해요.

### RTL 문자 요구 사항

아랍어, 히브리어, 페르시아어, 우르두어 레지스터는 모두 우측에서 좌측으로 쓰는(RTL) 요구 사항을 명시해요. `Ensure text reads naturally in RTL layout contexts.`

### 레지스터 재정의하기

모든 레지스터는 설정 값이므로 프로젝트의 어조에 맞게 재정의할 수 있어요.

```json
{
  "languages": {
    "fr": {
      "register": "Casual French. Use tu-form. Conversational blog tone. Gender-neutral when possible."
    },
    "de": {
      "register": "Informal German. Use du-form. Tech startup voice."
    }
  }
}
```

전체 설정 참조는 [설정](/docs/getting-started/configuration)을 확인하세요.

---

## 새로운 인공어 추가하기

### 단계별 가이드

1. **BCP-47 사용자 정의 코드 선택**: `x-` 접두사를 사용하세요(예: `x-dothraki`, `x-valyrian`).

2. **설정에 추가**:

```json
{
  "languages": {
    "x-dothraki": {
      "register": "Dothraki language. Use David J. Peterson's vocabulary from the Living Language Dothraki textbook. Harsh, direct tone. No articles, no verb 'to be'."
    }
  }
}
```

3. **(선택 사항) 문자 변환기 추가**: 인공어가 라틴 문자가 아닌 표시용 문자를 사용하는 경우 `lib/scripts.js`에 변환기를 추가하고 `SCRIPT_CONVERTERS`에 등록하세요.

4. **테스트**: `i18n-rosetta sync --dry`를 실행하여 파일을 기록하지 않고 번역을 미리 확인하세요.

5. **품질 게이트 확인**: 인공어에 맞게 [품질 게이트](/docs/concepts/quality-gate)를 조정해야 할 수 있어요. 특히 인공어가 PUA 문자를 사용하는 경우 `requireNonLatin` 검사를 확인하세요.

:::note 인공어 품질은 LLM의 지식에 따라 달라져요
LLM은 학습 데이터에서 본 적이 있는 인공어로만 번역할 수 있어요. 문서화가 잘 된 인공어(클링온어, 신다린, 도스라키어)는 잘 작동해요. 잘 알려지지 않았거나 새로 발명된 인공어는 일관성 없는 결과를 생성할 수 있어요. 품질을 개선하려면 [코칭 데이터](/docs/concepts/coaching-data)를 사용하세요.
:::

---

## 참고 자료

- [지원되는 언어](/docs/reference/supported-languages) — 메서드 가용성이 포함된 전체 언어 표
- [문자 변환기](/docs/concepts/script-converters) — 변환 파이프라인의 기술적 세부 정보
- [번역 메서드](/docs/guides/translation-methods) — 각 번역 메서드의 작동 방식
- [설정](/docs/getting-started/configuration) — 언어 및 레지스터 설정을 포함한 설정 참조
- [자원이 부족한 언어 지원](https://mtevalarena.org/docs/community/low-resource-languages) — 실제 소외된 언어에 적용된 동일한 인프라