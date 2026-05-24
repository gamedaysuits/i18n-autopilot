---
sidebar_position: 7
title: "데이터 주권"
description: "원주민 언어 번역을 위한 OCAP, CARE 및 Māori 데이터 주권 원칙이에요. 배포 전에 커뮤니티 동의가 우선되어야 하는 이유를 알아보세요."
---
# 데이터 주권

원주민 언어(Indigenous languages)를 위한 기계 번역은 프랑스어나 일본어에서는 발생하지 않는 문제들을 제기해요. 훈련 데이터의 소유자는 누구일까요? 언어 모델이 말하는 방식을 누가 통제할까요? 번역이 배포할 만큼 충분히 좋은지 누가 결정할까요?

**정답은 항상 커뮤니티예요.**

rosetta는 이를 지원하도록 구축되었어요. `api` 메서드는 모든 언어 리소스를 커뮤니티 통제 하에 서버 측에 유지해요. 플러그인 시스템은 도구에서 메서드를 분리해요. 하지만 도구가 윤리를 강제할 수는 없어요 — 이 페이지에서는 여러분이 따라야 할 원칙을 설명해요.

---

## OCAP® 원칙

**OCAP**(Ownership, Control, Access, Possession)은 [First Nations Information Governance Centre](https://fnigc.ca/ocap-training/)(FNIGC)에서 개발한 원칙으로, First Nations 데이터가 어떻게 수집, 보호, 사용 및 공유되어야 하는지를 확립해요.

| 원칙 | 번역에 미치는 의미 |
|-----------|------------------------------|
| **Ownership** (소유) | 커뮤니티는 사전, 문법, 병렬 텍스트, 코칭 파일 및 이를 통해 생성된 모든 번역물 등 자체 언어 데이터를 소유해요. |
| **Control** (통제) | 커뮤니티는 언어 데이터의 사용 방식, 접근 권한을 가진 사람, 허용되는 번역 메서드를 통제해요. |
| **Access** (접근) | 커뮤니티 구성원은 저장 위치와 관계없이 자신의 언어 리소스에 접근하고 관리할 권리가 있어요. |
| **Possession** (점유) | 물리적 데이터(코칭 파일, 사전, 모델 가중치)는 타사 클라우드가 아닌 커뮤니티가 통제하는 인프라에 상주해야 해요. |

### OCAP의 실제 적용 의미

- 커뮤니티의 명시적인 승인 없이 원주민 언어의 **번역을 배포하지 마세요**.
- 데이터 공유 계약 없이 커뮤니티가 제공한 언어 데이터로 **모델을 훈련하지 마세요**.
- 웹사이트, 소셜 미디어 또는 교육 자료에서 커뮤니티 언어 리소스를 **스크랩하지 마세요**.
- 프롬프트, 코칭 데이터 및 사전이 커뮤니티가 통제하는 서버에 유지되도록 **`api` 메서드를 사용하세요**. rosetta `api` 메서드는 "단순한 파이프(dumb pipe)" 역할을 해요 — 키를 내보내고 번역을 받아올 뿐이에요. 모든 언어적 IP는 서버 측에 유지돼요.
- **출처를 문서화하세요** — [플러그인 매니페스트](/docs/reference/plugin-spec)의 `provenance` 필드에는 사용된 모든 리소스, 해당 라이선스 및 출처가 나열되어야 해요.

:::warning OCAP®은 등록 상표예요
OCAP®은 First Nations Information Governance Centre의 등록 상표예요. 이는 특히 캐나다의 First Nations에 적용돼요. 이 원칙은 더 광범위한 연관성을 가지지만, 상표 및 거버넌스 권한은 FNIGC에 속해요.
:::

---

## CARE 원칙

**CARE Principles for Indigenous Data Governance**(원주민 데이터 거버넌스를 위한 CARE 원칙)는 FAIR 데이터 원칙을 보완하기 위해 [Global Indigenous Data Alliance](https://www.gida-global.org/care)(GIDA)에서 개발했어요. FAIR는 데이터가 Findable(찾을 수 있고), Accessible(접근 가능하며), Interoperable(상호 운용 가능하고), Reusable(재사용 가능)해야 한다고 말해요. CARE는 그것만으로는 충분하지 않으며, 데이터 거버넌스 또한 원주민의 권리를 중심에 두어야 한다고 말해요.

| 원칙 | 적용 |
|-----------|------------|
| **Collective Benefit** (공동의 이익) | 번역 도구는 언어 커뮤니티에 가장 먼저 혜택을 주어야 해요. 리더보드 점수는 메서드를 개선하기 위한 수단이지, 커뮤니티 언어에서 상업적 가치를 추출하기 위한 것이 아니에요. |
| **Authority to Control** (통제 권한) | 커뮤니티는 언어 데이터가 수집, 사용 및 공유되는 방식을 관리할 권한이 있어요. 높은 리더보드 점수가 번역을 배포할 권한을 부여하지는 않아요. |
| **Responsibility** (책임) | 원주민 언어 데이터를 다루는 연구원과 개발자는 관계를 구축하고, 동의를 얻고, 혜택을 공유할 책임이 있어요. |
| **Ethics** (윤리) | 원주민의 권리와 안녕이 최우선 고려 사항이어야 해요. 번역 메서드는 커뮤니티에 *대해* 개발되는 것이 아니라 커뮤니티*와 함께* 개발되어야 해요. |

---

## Te Mana Raraunga — Māori 데이터 주권

**Te Mana Raraunga**는 [Māori Data Sovereignty Network](https://www.temanararaunga.maori.nz/)(마오리 데이터 주권 네트워크)예요. 이 네트워크는 언어 데이터를 포함한 Māori 데이터가 Treaty of Waitangi(와이탕이 조약) 및 tikanga Māori(마오리 관습법)의 원칙이 적용되는 taonga(보물)라고 주장해요.

주요 원칙:

| 원칙 | 의미 |
|-----------|---------|
| **Rangatiratanga** (권한) | Māori는 언어 데이터를 포함한 자신의 데이터에 대해 권한을 행사할 고유한 권리가 있어요. |
| **Whakapapa** (관계) | 데이터에는 기원과 연결성이 있어요. 언어 데이터는 이를 만든 사람들의 관계와 지식을 담고 있어요. |
| **Whanaungatanga** (의무) | Māori 데이터를 보유하거나 처리하는 사람은 해당 데이터가 유래한 커뮤니티에 대한 상호 의무가 있어요. |
| **Kotahitanga** (공동의 이익) | Māori 데이터는 Māori의 공동 이익을 위해 사용되어야 해요. |
| **Manaakitanga** (호혜성) | Māori 데이터의 사용에는 배려, 존중 및 호혜성이 수반되어야 해요. |
| **Kaitiakitanga** (수호) | 데이터 수호자는 데이터를 보호하고 적절하게 사용되도록 보장할 의무가 있어요. |

이러한 원칙은 te reo Māori(마오리어) 및 Māori 언어 데이터가 포함된 모든 컴퓨팅 작업에 적용돼요.

---

## rosetta 사용자에게 미치는 의미

### 표준 언어의 경우 (프랑스어, 일본어, 스페인어 등)

rosetta를 평소처럼 사용하세요. 이러한 언어에는 공개적으로 사용 가능한 대규모 말뭉치와 확립된 번역 API가 있으며 주권 문제가 없어요. 원하는 대로 번역, 동기화 및 배포하세요.

### 원주민 및 자원이 부족한 언어의 경우

상황이 근본적으로 달라요:

1. **먼저 동의를 얻으세요.** 원주민 언어를 위한 번역 메서드를 구축하기 전에 커뮤니티와 관계를 형성하세요. 커뮤니티의 참여 없이 구축된 메서드는 기술적으로 아무리 훌륭하더라도 배포하거나 유통해서는 안 돼요.

2. **`api` 메서드를 사용하세요.** 커뮤니티가 통제하는 인프라에서 번역 파이프라인을 호스팅하세요. rosetta의 `api` 메서드는 이를 위해 설계되었어요. 메서드가 작동하게 만드는 프롬프트, 사전 또는 코칭 데이터를 노출하지 않고 키를 보내고 번역을 받아와요.

    ```json title="Community-controlled setup"
    {
      "pairs": {
        "en:crk": {
          "method": "api",
          "endpoint": "https://api.community-server.example/translate"
        }
      }
    }
    ```

3. **모든 것을 문서화하세요.** 플러그인 매니페스트의 `provenance` 필드를 사용하여 모든 리소스, 해당 라이선스 및 커뮤니티 동의 하에 제공되었는지 여부를 나열하세요.

4. **점수는 라이선스가 아니에요.** 리더보드의 높은 점수는 메서드가 기술적으로 잘 작동함을 증명할 뿐이에요. 번역을 배포하거나, 플러그인을 유통하거나, 메서드를 상업화할 수 있는 권한을 부여하지는 않아요. 결정은 커뮤니티가 해요.

5. **데이터가 아닌 메서드를 공유하세요.** 잘 작동하는 기술(예: "코칭된 프롬프트가 있는 FST-gated LLM")을 개발한 경우 리더보드에서 *아키텍처*와 *접근 방식*을 공유하세요. 커뮤니티는 특정 언어에 대해 해당 기술이 작동하도록 만드는 언어 데이터에 대한 통제권을 유지해요.

---

## `api` 메서드와 주권

`api` [번역 메서드](/docs/guides/translation-methods)는 특별히 데이터 주권을 지원하기 위해 존재해요. 그 이유는 다음과 같아요:

| 측면 | 다른 메서드 | `api` 메서드 |
|--------|--------------|-------------|
| **프롬프트 위치** | rosetta의 구성 파일 내 (모든 개발자에게 표시됨) | 커뮤니티 서버 내 (비공개) |
| **코칭 데이터 위치** | `.rosetta/coaching/` 디렉터리 내 (git에 커밋됨) | 커뮤니티 서버 내 (비공개) |
| **사전 위치** | 플러그인 디렉터리 내 (플러그인과 함께 배포됨) | 커뮤니티 서버 내 (비공개) |
| **파이프라인 통제 주체** | `rosetta sync`를 실행하는 사람 | API를 운영하는 커뮤니티 |
| **rosetta가 볼 수 있는 것** | 모든 것 | 들어오는 키, 나가는 번역 |

`api` 메서드는 의도적인 아키텍처 선택이에요. 이것이 "단순한 파이프"인 이유는 언어 지식, 문법 규칙, 세심하게 선별된 코칭 예제 등의 IP가 도구가 아닌 커뮤니티의 소유이기 때문이에요.

구현 세부 정보는 [API를 통한 메서드 제공](/docs/guides/serving-a-method)을 참조하세요.

---

## 추가 자료

- [First Nations Information Governance Centre — OCAP®](https://fnigc.ca/ocap-training/)
- [Global Indigenous Data Alliance — CARE Principles](https://www.gida-global.org/care)
- [Te Mana Raraunga — Māori Data Sovereignty Network](https://www.temanararaunga.maori.nz/)
- [USIDSN — United States Indigenous Data Sovereignty Network](https://usindigenousdata.org/)

---

## 참고 항목

- [자원이 부족한 언어 지원하기](/docs/guides/low-resource-languages) — OCAP 컨텍스트가 포함된 기술 가이드
- [번역 메서드](/docs/guides/translation-methods) — `api` 메서드 및 IP 보호 방법
- [API를 통한 메서드 제공](/docs/guides/serving-a-method) — 커뮤니티가 통제하는 파이프라인 호스팅
- [플러그인 사양](/docs/reference/plugin-spec) — 리소스 출처 표기를 위한 `provenance` 필드
- [쿡북: FST-Gated 파이프라인](/docs/tutorials/fst-gated-pipeline) — 커뮤니티가 자체 호스팅할 수 있는 파이프라인 구축