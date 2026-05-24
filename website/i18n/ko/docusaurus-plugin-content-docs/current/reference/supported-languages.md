---
sidebar_position: 4
title: "지원 언어"
---
# 지원 언어

rosetta는 42개 이상의 언어를 위한 구조화된 참조 파일인 **Language Cards**와 함께 제공돼요. 각 카드에는 register(어조) preset, 격식 체계 메타데이터, method 지원 플래그 및 script 정보가 포함되어 있어요. LLM이 알고 있는 모든 언어는 config 한 줄로 추가할 수 있으며, 아래 목록은 프로덕션 환경에 바로 사용할 수 있도록 엄선된 register가 준비된 언어들이에요.

---

## 번역 방식

각 언어는 다음 번역 방식 중 하나 이상을 사용할 수 있어요.

| 아이콘 | 방식 (Method) | 작동 원리 | 비용 |
|------|--------|-------------|------|
| 🟢 | **Google Translate** | Neural MT 베이스라인. 130개 이상의 언어. Key-value 문자열 전용 — Markdown 콘텐츠는 안전하게 번역할 수 없어요. | 100만 자당 약 $20 |
| 🔵 | **LLM (OpenRouter)** | 모델이 알고 있는 모든 언어. Register 기반 프롬프트. Key-value 및 Markdown 콘텐츠를 모두 처리해요. | 모델에 따라 다름 |
| 🟣 | **LLM-Coached** | LLM + 문법 사전 + 프롬프트에 주입되는 코칭 데이터. 형태론적으로 복잡한 언어에 가장 적합해요. | 모델에 따라 다름 |
| 🟠 | **API (Plugin)** | HTTP를 통해 제공되는 커뮤니티 호스팅 번역 파이프라인. [OCAP 호환](/docs/guides/low-resource-languages). | 제공자에 따라 다름 |

Google Translate의 경우 `GOOGLE_TRANSLATE_API_KEY`을 설정하고, LLM 방식의 경우 `OPENROUTER_API_KEY`를 설정하세요. 자세한 내용은 [번역 방식](/docs/guides/translation-methods)을 참고해 주세요.

---

## 우선순위 언어

웹 및 모바일 애플리케이션에서 가장 많이 요청되는 locale이며, rosetta가 권장하는 접근성 우선 순위로 나열되어 있어요.

| 국기 | 언어 | Code | Google | LLM | Coached | Script | 참고 |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇸🇦 | 아랍어 | `ar` | ✅ | ✅ | ✅ | — | RTL. 현대 표준 아랍어 (فصحى). |
| 🇵🇭 | 필리핀어 (Taglish) | `tl` | ✅ | ✅ | ✅ | — | 코드 스위칭: 타갈로그어 기본, 기술 용어는 영어 사용. |
| 🇫🇷 | 프랑스어 | `fr` | ✅ | ✅ | ✅ | — | Vous 형태. 성 포용적 표현 (Connecté·e). |
| 🇪🇸 | 스페인어 | `es` | ✅ | ✅ | ✅ | — | 중립적인 라틴 아메리카 스페인어. |
| 🇩🇪 | 독일어 | `de` | ✅ | ✅ | ✅ | — | Sie 형태. 성 포용적 표현 (Benutzer:innen). |
| 🇯🇵 | 일본어 | `ja` | ✅ | ✅ | ✅ | — | 본문은 です/ます, UI 레이블은 する 형태. |
| 🇨🇳 | 중국어 (간체) | `zh` | ✅ | ✅ | ✅ | — | 简体中文. |
| 🇮🇹 | 이탈리아어 | `it` | ✅ | ✅ | ✅ | — | Lei 형태. |
| 🇧🇷 | 포르투갈어 (브라질) | `pt` | ✅ | ✅ | ✅ | — | 브라질 포르투갈어. |
| 🇰🇷 | 한국어 | `ko` | ✅ | ✅ | ✅ | — | 해요체 (Polite register). |

## 주요 세계 언어

| 국기 | 언어 | Code | Google | LLM | Coached | Script | 참고 |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇧🇩 | 벵골어 | `bn` | ✅ | ✅ | ✅ | — | শুদ্ধ ভাষা 선호. |
| 🇧🇬 | 불가리아어 | `bg` | ✅ | ✅ | ✅ | — | |
| 🇨🇿 | 체코어 | `cs` | ✅ | ✅ | ✅ | — | Vykání (vy 형태). |
| 🇩🇰 | 덴마크어 | `da` | ✅ | ✅ | ✅ | — | |
| 🇬🇷 | 그리스어 | `el` | ✅ | ✅ | ✅ | — | 현대 Δημοτική. |
| 🇮🇷 | 페르시아어 | `fa` | ✅ | ✅ | ✅ | — | RTL. |
| 🇫🇮 | 핀란드어 | `fi` | ✅ | ✅ | ✅ | — | 문법적 성별 없음. |
| 🇮🇱 | 히브리어 | `he` | ✅ | ✅ | ✅ | — | RTL. |
| 🇮🇳 | 힌디어 | `hi` | ✅ | ✅ | ✅ | — | शुद्ध हिन्दी. 영어 외래어 최소화. |
| 🇭🇺 | 헝가리어 | `hu` | ✅ | ✅ | ✅ | — | Ön 형태. |
| 🇮🇩 | 인도네시아어 | `id` | ✅ | ✅ | ✅ | — | |
| 🇲🇾 | 말레이어 | `ms` | ✅ | ✅ | ✅ | — | |
| 🇳🇱 | 네덜란드어 | `nl` | ✅ | ✅ | ✅ | — | U 형태. |
| 🇳🇴 | 노르웨이어 | `nb` | ✅ | ✅ | ✅ | — | Bokmål (보크몰). |
| 🇵🇱 | 폴란드어 | `pl` | ✅ | ✅ | ✅ | — | Pan/Pani 형태. |
| 🇵🇹 | 포르투갈어 (유럽) | `pt-PT` | ✅ | ✅ | ✅ | — | 유럽 포르투갈어. |
| 🇷🇴 | 루마니아어 | `ro` | ✅ | ✅ | ✅ | — | |
| 🇷🇺 | 러시아어 | `ru` | ✅ | ✅ | ✅ | — | Вы 형태. |
| 🇸🇰 | 슬로바키아어 | `sk` | ✅ | ✅ | ✅ | — | Vykanie (vy 형태). |
| 🇷🇸 | 세르비아어 | `sr` | ✅ | ✅ | ✅ | 🔤 Latin→Cyrillic | 결정론적(Deterministic) script 변환기. |
| 🇸🇪 | 스웨덴어 | `sv` | ✅ | ✅ | ✅ | — | |
| 🇰🇪 | 스와힐리어 | `sw` | ✅ | ✅ | ✅ | — | |
| 🇹🇭 | 태국어 | `th` | ✅ | ✅ | ✅ | — | ครับ/ค่ะ 존댓말 입자. |
| 🇹🇷 | 튀르키예어 | `tr` | ✅ | ✅ | ✅ | — | Siz 형태. |
| 🇺🇦 | 우크라이나어 | `uk` | ✅ | ✅ | ✅ | — | Ви 형태. |
| 🇵🇰 | 우르두어 | `ur` | ✅ | ✅ | ✅ | — | RTL. آپ 형태. |
| 🇻🇳 | 베트남어 | `vi` | ✅ | ✅ | ✅ | — | |
| 🇹🇼 | 중국어 (번체) | `zh-TW` | ✅ | ✅ | ✅ | — | 繁體中文. |

## 지역별 변형 언어

| 국기 | 언어 | Code | Google | LLM | Coached | Script | 참고 |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇲🇽 | 멕시코 스페인어 | `es-MX` | ✅ | ✅ | ✅ | — | Tú 형태. 따뜻한 어조(Warm register). |
| 🇨🇦 | 캐나다 프랑스어 | `fr-CA` | ✅ | ✅ | ✅ | — | 퀘벡(Québécois) 관용구. |

---

## 토착어 및 Low-Resource 언어

이 언어들은 상용 MT 서비스에서 지원하지 않아요. rosetta는 언어 커뮤니티가 [OCAP 원칙](/docs/guides/low-resource-languages)에 따라 자체적인 method를 구축할 수 있도록 도구를 제공해요.

| | 언어 | Code | Google | LLM | Coached | Script | 상태 |
|---|----------|------|:------:|:---:|:-------:|--------|--------|
| 🪶 | Plains Cree | `crk` | ❌ | ✅ | ✅ | 🔤 SRO→Syllabics | 🚧 개발 중 |

:::info Plains Cree는 활발히 개발 중이에요
Plains Cree의 register, 코칭 인프라, script 변환기 및 평가 하네스(evaluation harness)는 모두 작동하지만, 번역 파이프라인은 **아직 출시되지 않았어요**. 출시 전 품질을 보장하기 위해 [OCAP 원칙](/docs/guides/low-resource-languages)에 따라 언어 커뮤니티와 협력하고 있어요. 전체 내용과 기여 방법은 [Low-Resource 언어 지원하기](/docs/guides/low-resource-languages)를 확인해 주세요.
:::

:::tip 더 많은 Low-Resource 언어 추가하기
rosetta의 method 플러그인 시스템은 이를 위해 설계되었어요. 언어 커뮤니티는 맞춤형 번역 method를 구축하고, 자체적으로 호스팅하며, [API method](/docs/guides/serving-a-method)를 통해 제공할 수 있어요. [Method 리더보드](/leaderboard)는 모든 언어 쌍의 점수를 추적해요. method를 구축하고, 하네스를 실행하여 최고 점수를 차지해 보세요.
:::

---

## 인공어 (Constructed Languages)

인공어(Conlangs)는 LLM register와 선택적 script 변환기를 통해 지원돼요. 실제 언어와 동일한 인프라를 사용하며, 품질 게이트, 코칭 시스템 및 script 변환 파이프라인이 동일하게 작동해요.

| | 언어 | Code | Google | LLM | Script | 참고 |
|---|----------|------|:------:|:---:|--------|-------|
| 🖖 | 클링온어 | `tlh` | ❌ | ✅ | 🔤 Romanization→pIqaD | PUA 폰트 필요. Marc Okrand 어휘. |
| 🧝 | 신다린 (톨킨 엘프어) | `x-elvish-s` | ❌ | ✅ | 🔤 Latin→Tengwar | CSUR PUA 폰트 필요. |
| 🏴‍☠️ | 해적 영어 | `x-pirate` | ❌ | ✅ | — | Register 전용. 해양 은유 표현. |
| 🦸 | 크립톤어 | `x-kryptonian` | ❌ | ✅ | 🔤 Latin→Kryptonian | PUA 폰트 필요. |
| 🎭 | 셰익스피어 영어 | `x-shakespeare` | ❌ | ✅ | — | Register 전용. Thee/thou, -eth/-est 형태. |
| 🐸 | 요다어 | `x-yoda` | ❌ | ✅ | — | Register 전용. OSV 어순. |

PUA 폰트 요구 사항, Unicode 제한 사항 및 직접 추가하는 방법은 [인공어, Script 및 정서법](/docs/guides/conlangs-scripts-orthography)을 참고해 주세요.

---

## 언어 Preset

`init` 마법사는 빠른 설정을 위해 preset 이름을 지원해요. preset과 개별 code를 혼합해서 사용할 수 있어요.

| Preset | 확장 결과 |
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

rosetta는 **LLM이 알고 있는 모든 언어**로 번역할 수 있어요. 위 표는 내장된 register preset이 있는 언어만 나열한 것이에요. 목록에 없는 언어를 추가하려면 config에 해당 언어의 BCP-47 code를 포함하세요.

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

LLM은 해당 언어에 대해 학습한 지식을 사용하여 번역해요. `register`을 설정하면 어조, 격식 및 정서법 규칙을 제어할 수 있어요. 자세한 내용은 [Configuration](/docs/getting-started/configuration)을 참고해 주세요.

---

## Language Cards

기본 제공되는 각 언어에는 **Language Card**가 있어요. 이는 `lib/data/language-cards/`에 있는 JSON 파일이며 다음 내용을 포함해요.

| 필드 (Field) | 포함 내용 |
|-------|------------------|
| **격식 체계 (Formality system)** | T-V 구분, 높임말(speech levels), 경어(keigo), 조사(particles) 등. |
| **Register preset** | 해당 언어의 특성에 맞춘 이름이 지정된 preset. |
| **Method 지원** | 이 언어를 지원하는 번역 API. |
| **성별 가이드 (Gender guidance)** | 문법적 성별 규칙 및 포용적 글쓰기 팁. |
| **Script/방향** | ISO 15924 script code 및 RTL/LTR. |
| **평가 데이터셋 (Eval datasets)** | 이 언어를 다루는 벤치마크. |

### Preset Key 사용하기

전체 register 텍스트를 작성하는 대신 preset key 이름을 사용할 수 있어요.

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "polite"
  }
}
```

Rosetta는 해당 key를 전체 register 프롬프트로 변환해요. 각 언어에서 사용 가능한 preset을 확인하려면 `npx i18n-rosetta init`를 실행하세요.

### Preset 예시

| 언어 | Preset | 기본값 (Default) |
|----------|---------|--------|
| 프랑스어 | `formal-vous`, `casual-tu` | `formal-vous` |
| 한국어 | `polite-haeyo`, `formal-hapsyo`, `casual-hae` | `polite-haeyo` |
| 일본어 | `polite`, `formal-keigo`, `casual` | `polite` |
| 독일어 | `formal-Sie`, `casual-du` | `formal-Sie` |
| 태국어 | `neutral-professional`, `polite-male`, `polite-female` | `neutral-professional` |
| 스페인어 | `neutral-professional`, `formal-usted`, `casual-tuteo` | `neutral-professional` |

preset을 추가하거나 개선하는 방법은 [Language Card 기여하기](https://github.com/nicholasgriffintn/i18n-rosetta/blob/main/docs/planning/LANGUAGE_CARD_SPEC.md)를 참고해 주세요.

---

## 참고 자료

- [Configuration](/docs/getting-started/configuration) — 언어 설정을 포함한 전체 config 참조
- [번역 방식](/docs/guides/translation-methods) — 각 method의 작동 원리
- [Script 변환기](/docs/concepts/script-converters) — 결정론적(deterministic) script 변환 파이프라인
- [인공어, Script 및 정서법](/docs/guides/conlangs-scripts-orthography) — PUA 폰트, Unicode, 인공어 추가 방법
- [Low-Resource 언어 지원하기](/docs/guides/low-resource-languages) — 지원이 부족한 언어를 위한 method 구축 방법