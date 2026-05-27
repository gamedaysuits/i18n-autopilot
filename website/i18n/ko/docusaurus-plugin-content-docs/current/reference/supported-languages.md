---
sidebar_position: 4
title: "지원 언어"
---
# 지원하는 언어

rosetta는 50개 언어를 위한 구조화된 구성 파일인 **Language Cards**와 함께 제공돼요. 각 카드에는 어조(register) 프리셋, 격식 체계 메타데이터, 메서드 지원 플래그, 타이포그래피 규칙 및 문자 정보가 포함되어 있어요. LLM이 알고 있는 언어라면 구성 파일에 한 줄만 추가하여 어떤 언어든 추가할 수 있어요. 여기에 나열된 언어들은 프로덕션 환경에서 바로 사용할 수 있도록 엄선된 어조가 준비된 언어들이에요.

---

## 번역 메서드

각 언어는 다음 번역 메서드 중 하나 이상을 사용할 수 있어요.

| 아이콘 | 메서드 | 작동 방식 | 비용 |
|------|--------|-------------|------|
| 🟢 | **Google Translate** | 신경망 기계 번역(Neural MT) 베이스라인. 130개 이상 언어 지원. 키-값 문자열 전용 — Markdown 콘텐츠는 안전하게 번역할 수 없어요. | 100만 자당 약 $20 |
| 🔵 | **LLM (OpenRouter)** | 모델이 알고 있는 모든 언어 지원. 어조(register) 제어 프롬프트. 키-값 및 Markdown 콘텐츠 처리 가능. | 모델에 따라 다름 |
| 🟣 | **LLM-Coached** | LLM + 문법 사전 + 프롬프트에 주입되는 코칭 데이터. 형태론적으로 복잡한 언어에 가장 적합해요. | 모델에 따라 다름 |
| 🟠 | **API (Plugin)** | HTTP를 통해 제공되는 커뮤니티 호스팅 번역 파이프라인. [OCAP 호환](https://mtevalarena.org/docs/community/low-resource-languages). | 제공자에 따라 다름 |

Google Translate의 경우 `GOOGLE_TRANSLATE_API_KEY`를 설정하고, LLM 메서드의 경우 `OPENROUTER_API_KEY`를 설정하세요. 자세한 내용은 [번역 메서드](/docs/guides/translation-methods)를 참조하세요.

---

## 우선순위 언어

웹 및 모바일 애플리케이션에서 가장 많이 요청되는 로캘(locale)들이며, rosetta에서 권장하는 접근성 우선 순서대로 나열되어 있어요.

| 국기 | 언어 | 코드 | Google | LLM | Coached | 문자 | 참고 |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇸🇦 | 아랍어 | `ar` | ✅ | ✅ | ✅ | — | RTL. 현대 표준 아랍어(فصحى). |
| 🇵🇭 | 필리핀어(Taglish) | `tl` | ✅ | ✅ | ✅ | — | 코드 스위칭: 타갈로그어 중심, 기술 용어는 영어 사용. |
| 🇫🇷 | 프랑스어 | `fr` | ✅ | ✅ | ✅ | — | Vous 형태. 성 포용적 표기(Connecté·e). |
| 🇪🇸 | 스페인어 | `es` | ✅ | ✅ | ✅ | — | 중립적인 라틴 아메리카 스페인어. |
| 🇩🇪 | 독일어 | `de` | ✅ | ✅ | ✅ | — | Sie 형태. 성 포용적 표기(Benutzer:innen). |
| 🇯🇵 | 일본어 | `ja` | ✅ | ✅ | ✅ | — | 본문은 です/ます, UI 레이블은 する 형태. |
| 🇨🇳 | 중국어(간체) | `zh` | ✅ | ✅ | ✅ | — | 简体中文. |
| 🇮🇹 | 이탈리아어 | `it` | ✅ | ✅ | ✅ | — | Lei 형태. |
| 🇧🇷 | 포르투갈어(브라질) | `pt` | ✅ | ✅ | ✅ | — | 브라질 포르투갈어. |
| 🇰🇷 | 한국어 | `ko` | ✅ | ✅ | ✅ | — | 해요체(존댓말). |

## 주요 세계 언어

| 국기 | 언어 | 코드 | Google | LLM | Coached | 문자 | 참고 |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇧🇩 | 벵골어 | `bn` | ✅ | ✅ | ✅ | — | শুদ্ধ ভাষা(표준어) 선호. |
| 🇧🇬 | 불가리아어 | `bg` | ✅ | ✅ | ✅ | — | |
| 🇨🇿 | 체코어 | `cs` | ✅ | ✅ | ✅ | — | Vykání(vy 형태). |
| 🇩🇰 | 덴마크어 | `da` | ✅ | ✅ | ✅ | — | |
| 🇬🇷 | 그리스어 | `el` | ✅ | ✅ | ✅ | — | 현대 Δημοτική(민중어). |
| 🇮🇷 | 페르시아어 | `fa` | ✅ | ✅ | ✅ | — | RTL. |
| 🇫🇮 | 핀란드어 | `fi` | ✅ | ✅ | ✅ | — | 문법적 성별 없음. |
| 🇮🇱 | 히브리어 | `he` | ✅ | ✅ | ✅ | — | RTL. |
| 🇮🇳 | 힌디어 | `hi` | ✅ | ✅ | ✅ | — | शुद्ध हिन्दी(순수 힌디어). 영어 외래어 최소화. |
| 🇭🇺 | 헝가리어 | `hu` | ✅ | ✅ | ✅ | — | Ön 형태. |
| 🇮🇩 | 인도네시아어 | `id` | ✅ | ✅ | ✅ | — | |
| 🇲🇾 | 말레이어 | `ms` | ✅ | ✅ | ✅ | — | |
| 🇳🇱 | 네덜란드어 | `nl` | ✅ | ✅ | ✅ | — | U 형태. |
| 🇳🇴 | 노르웨이어 | `nb` | ✅ | ✅ | ✅ | — | 보크몰(Bokmål). |
| 🇵🇱 | 폴란드어 | `pl` | ✅ | ✅ | ✅ | — | Pan/Pani 형태. |
| 🇵🇹 | 포르투갈어(유럽) | `pt-PT` | ✅ | ✅ | ✅ | — | 유럽 포르투갈어. |
| 🇷🇴 | 루마니아어 | `ro` | ✅ | ✅ | ✅ | — | |
| 🇷🇺 | 러시아어 | `ru` | ✅ | ✅ | ✅ | — | Вы 형태. |
| 🇸🇰 | 슬로바키아어 | `sk` | ✅ | ✅ | ✅ | — | Vykanie(vy 형태). |
| 🇷🇸 | 세르비아어 | `sr` | ✅ | ✅ | ✅ | 🔤 라틴→키릴 | 결정론적 문자 변환기. |
| 🇸🇪 | 스웨덴어 | `sv` | ✅ | ✅ | ✅ | — | |
| 🇰🇪 | 스와힐리어 | `sw` | ✅ | ✅ | ✅ | — | |
| 🇹🇭 | 태국어 | `th` | ✅ | ✅ | ✅ | — | ครับ/ค่ะ 존댓말 조사. |
| 🇹🇷 | 튀르키예어 | `tr` | ✅ | ✅ | ✅ | — | Siz 형태. |
| 🇺🇦 | 우크라이나어 | `uk` | ✅ | ✅ | ✅ | — | Ви 형태. |
| 🇵🇰 | 우르두어 | `ur` | ✅ | ✅ | ✅ | — | RTL. آپ 형태. |
| 🇻🇳 | 베트남어 | `vi` | ✅ | ✅ | ✅ | — | |
| 🇹🇼 | 중국어(번체) | `zh-TW` | ✅ | ✅ | ✅ | — | 繁體中文. |
| 🇬🇪 | 조지아어 | `ka` | ✅ | ✅ | — | — | ქართული. 카르트벨리어족. |
| 🇳🇬 | 요루바어 | `yo` | ✅ | ✅ | — | — | Èdè Yorùbá. 성조 언어(3성). |

## 지역 변형 언어

| 국기 | 언어 | 코드 | Google | LLM | Coached | 문자 | 참고 |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇲🇽 | 멕시코 스페인어 | `es-MX` | ✅ | ✅ | ✅ | — | Tú 형태. 따뜻한 어조. |
| 🇨🇦 | 캐나다 프랑스어 | `fr-CA` | ✅ | ✅ | ✅ | — | 퀘벡어(Québécois) 관용구. |

---

## 토착어 및 자원이 부족한 언어

이 언어들은 상업용 기계 번역 서비스에서 지원하지 않아요. rosetta는 언어 커뮤니티가 [OCAP 원칙](https://mtevalarena.org/docs/community/low-resource-languages)에 따라 자체 메서드를 구축할 수 있도록 도구를 제공해요.

| | 언어 | 코드 | Google | LLM | Coached | 문자 | 상태 |
|---|----------|------|:------:|:---:|:-------:|--------|--------|
| 🪶 | 평원 크리어(Plains Cree) | `crk` | ❌ | ✅ | ✅ | 🔤 SRO→음절 문자 | 🚧 개발 중 |
| 🌄 | 케추아어 | `qu` | ✅ | ✅ | — | — | Runasimi. 증거성 접미사. |

:::info 평원 크리어(Plains Cree)는 활발히 개발 중이에요
평원 크리어의 어조, 코칭 인프라, 문자 변환기 및 평가 하네스는 모두 작동하지만, 번역 파이프라인은 **아직 출시되지 않았어요**. 출시 전 품질을 보장하기 위해 [OCAP 원칙](https://mtevalarena.org/docs/community/low-resource-languages)에 따라 언어 커뮤니티와 협력하고 있어요. 전체 내용과 기여 방법은 [자원이 부족한 언어 지원하기](https://mtevalarena.org/docs/community/low-resource-languages)를 참조하세요.
:::

:::tip 자원이 부족한 언어 추가하기
rosetta의 메서드 플러그인 시스템은 이를 위해 설계되었어요. 언어 커뮤니티는 맞춤형 번역 메서드를 구축하고, 자체적으로 호스팅하며, [API 메서드](/docs/guides/serving-a-method)를 통해 제공할 수 있어요. [메서드 리더보드](/leaderboard)는 모든 언어 쌍에 대한 점수를 추적해요. 메서드를 구축하고, 하네스를 실행하여 최고 점수를 차지해 보세요.
:::

---

## 인공어 (Constructed Languages)

인공어(Conlangs)는 LLM 어조와 선택적 문자 변환기를 통해 지원돼요. 실제 언어와 동일한 인프라를 사용하며, 품질 게이트, 코칭 시스템, 문자 변환 파이프라인이 동일하게 작동해요.

| | 언어 | 코드 | Google | LLM | 문자 | 참고 |
|---|----------|------|:------:|:---:|--------|-------|
| 🖖 | 클링온어 | `tlh` | ❌ | ✅ | 🔤 로마자 표기→pIqaD | PUA 글꼴 필요. Marc Okrand 어휘. |
| 🧝 | 신다린(톨킨 엘프어) | `x-elvish-s` | ❌ | ✅ | 🔤 라틴→텡과르 | CSUR PUA 글꼴 필요. |
| 🏴‍☠️ | 해적 영어 | `x-pirate` | ❌ | ✅ | — | 어조(Register) 전용. 해상 은유. |
| 🦸 | 크립톤어 | `x-kryptonian` | ❌ | ✅ | 🔤 라틴→크립톤 문자 | PUA 글꼴 필요. |
| 🎭 | 셰익스피어 영어 | `x-shakespeare` | ❌ | ✅ | — | 어조(Register) 전용. Thee/thou, -eth/-est 형태. |
| 🐸 | 요다어 | `x-yoda` | ❌ | ✅ | — | 어조(Register) 전용. OSV 어순. |

PUA 글꼴 요구 사항, 유니코드 제한 사항 및 직접 추가하는 방법은 [인공어, 문자 및 정서법](/docs/guides/conlangs-scripts-orthography)을 참조하세요.

---

## 언어 프리셋

`init` 마법사는 빠른 설정을 위해 프리셋 이름을 지원해요. 프리셋과 개별 코드를 혼합해서 사용할 수 있어요.

| 프리셋 | 확장 결과 |
|--------|-----------|
| `european` | fr, de, es, it, pt, nl |
| `asian` | ja, zh, ko |
| `global` | fr, es, de, ja, zh, ko, pt, ar |
| `nordic` | da, fi, nb, sv |

```bash
# Mix presets with individual codes
i18n-rosetta init
# → Target languages: european, ja
# → Resolves to: fr, de, es, it, pt, nl, ja
```

---

## 모든 언어 추가하기

rosetta는 **LLM이 알고 있는 모든 언어**로 번역할 수 있어요. 위 표는 내장된 어조 프리셋이 있는 언어만 나열한 거예요. 목록에 없는 언어를 추가하려면 구성 파일에 해당 언어의 BCP-47 코드를 포함하세요.

```json
{
  "languages": {
    "sw": {},
    "am": {
      "register": "Formal Amharic. Professional register with Geʽez script."
    }
  }
}
```

LLM은 해당 언어에 대해 학습된 지식을 사용하여 번역할 거예요. `register`을 설정하면 어조, 격식 및 정서법 관례를 제어할 수 있어요. 자세한 내용은 [구성](/docs/getting-started/configuration)을 참조하세요.

---

## Language Cards

기본 제공되는 각 언어에는 성능을 위해 두 계층으로 나뉜 구조화된 JSON 구성인 **Language Card**가 있어요.

### 2계층 아키텍처

| 계층 | 디렉터리 | 로드 방식 | 목적 |
|------|-----------|--------|--------|
| **런타임 (Runtime)** | `lib/data/language-cards/` | `import`에서 즉시 로드 (Eagerly) | 번역 엔진: 어조, 격식, 규칙, 메서드 지원 |
| **참조 (Reference)** | `lib/data/language-reference/` | 필요할 때 지연 로드 (Lazily) | 개발자 문서: 언어적 과제, 백과사전 데이터, NLP 리소스 |

런타임 계층은 작게 유지되므로(카드당 약 2KB) rosetta를 가져올 때 수 메가바이트의 문서 데이터를 로드하지 않아요. 참조 계층은 도구, 웹사이트 및 평가 하네스를 위해 `getLanguageReference(code)`를 통해 사용할 수 있어요.

### 런타임 카드 필드

| 필드 | 포함 내용 |
|-------|------------------|
| **`nativeName`** | 내명(Endonym) — 해당 언어의 고유 문자로 표기한 언어 이름 (예: ქართული, Runasimi) |
| **격식 체계 (Formality system)** | T-V 구분, 높임말 체계, 경어(keigo), 조사 등 |
| **어조 프리셋 (Register presets)** | 해당 언어의 특성에 맞춘 명명된 LLM 프롬프트 프리셋 |
| **메서드 지원 (Method support)** | 이 언어를 지원하는 번역 API |
| **성별 지침 (Gender guidance)** | 문법적 성별 규칙 및 포용적 글쓰기 팁 |
| **문자/방향 (Script/direction)** | ISO 15924 문자 코드 및 RTL/LTR |
| **규칙 (Rules)** | 타이포그래피(따옴표, 띄어쓰기), 대문자 표기, 복수형 범주 |
| **평가 데이터셋 (Eval datasets)** | 이 언어를 다루는 벤치마크 |
| **`glottocode`** | 상호 참조를 위한 표준 Glottolog 식별자 |
| **`humanReviewed`** | 해당 언어 구사자의 카드 검토 여부 |

### 참조 카드 필드

| 필드 | 포함 내용 |
|-------|------------------|
| **언어적 과제 (Linguistic challenges)** | 기계 번역(MT) 특유의 함정 (예: 증거성, 성조 발음 구별 기호, 교착어 특성) |
| **백과사전 정보 (Encyclopedic)** | 어족, 분류, 화자 수, 지역 |
| **리소스 (Resources)** | NLP 도구, 병렬 말뭉치, 사전 학습된 모델 |

### 새 Language Card 스캐폴딩

생성기를 사용하여 신뢰할 수 있는 데이터 소스(IANA, CLDR, Glottolog)에서 두 계층을 모두 스캐폴딩하세요.

```bash
# Preview what would be generated
node scripts/generate-language-card.mjs sw --dry-run

# Generate both runtime + reference cards
node scripts/generate-language-card.mjs sw
```

생성기는 메타데이터(코드, 문자, 방향, 복수형, 따옴표, 메서드 지원, 어족)를 자동으로 채우고, 언어적 판단이 필요한 필드는 사람이 큐레이션할 수 있도록 TODO로 표시해요.

### 프리셋 키 사용하기

전체 어조 텍스트를 작성하는 대신 프리셋 키 이름을 사용할 수 있어요.

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "polite"
  }
}
```

Rosetta는 키를 전체 어조 프롬프트로 변환해요. 각 언어에서 사용할 수 있는 프리셋을 보려면 `npx i18n-rosetta init`를 실행하세요.

### 프리셋 예시

| 언어 | 프리셋 | 기본값 |
|----------|---------|--------|
| 프랑스어 | `formal-vous`, `casual-tu` | `formal-vous` |
| 한국어 | `polite-haeyo`, `formal-hapsyo`, `casual-hae` | `polite-haeyo` |
| 일본어 | `polite`, `formal-keigo`, `casual` | `polite` |
| 독일어 | `formal-Sie`, `casual-du` | `formal-Sie` |
| 태국어 | `neutral-professional`, `polite-male`, `polite-female` | `neutral-professional` |
| 스페인어 | `neutral-professional`, `formal-usted`, `casual-tuteo` | `neutral-professional` |

필드 유효성 검사 및 PR 체크리스트를 포함한 전체 사양은 [Language Card 기여하기](https://github.com/gamedaysuits/i18n-rosetta)를 참조하세요.

---

## 참고 항목

- [구성](/docs/getting-started/configuration) — 언어 설정을 포함한 전체 구성 참조
- [번역 메서드](/docs/guides/translation-methods) — 각 메서드의 작동 방식
- [문자 변환기](/docs/concepts/script-converters) — 결정론적 문자 변환 파이프라인
- [인공어, 문자 및 정서법](/docs/guides/conlangs-scripts-orthography) — PUA 글꼴, 유니코드, 인공어 추가 방법
- [자원이 부족한 언어 지원하기](https://mtevalarena.org/docs/community/low-resource-languages) — 소외된 언어를 위한 메서드 구축