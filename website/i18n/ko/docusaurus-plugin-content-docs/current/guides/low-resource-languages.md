---
sidebar_position: 5
title: "자원이 부족한 언어 지원하기"
---
# 저자원 언어 지원

:::info 상태: 활발히 개발 중
Plains Cree (nêhiyawêwin) 지원은 현재 개발 중이에요. 여기에 설명된 도구, 평가 하네스(evaluation harness), 리더보드는 실제이며 오늘 바로 사용할 수 있지만, Cree 번역 파이프라인은 아직 출시되지 않았어요. 출시가 되면, 이는 FST 인프라를 갖춘 다른 포합어(polysynthetic language) 및 저자원 언어의 청사진 역할을 할 거예요.
:::

## 미해결 문제

Google Translate는 약 130개의 언어를 지원해요. 지구상에는 7,000개가 넘는 언어가 사용되고 있죠. 활발한 화자 커뮤니티를 가진 많은 원주민 언어를 포함하여 수천 개의 언어에는 상용 번역 API가 존재하지 않고, 대규모 병렬 말뭉치(parallel corpus)가 구축되지 않았으며, 신뢰할 수 있는 결과를 생성하는 사전 학습된 모델(pretrained model)도 없어요.

이러한 격차는 저절로 좁혀지지 않아요. 저자원 언어가 저자원인 *이유는* 상용 기계 번역(MT)의 경제성이 미치지 않기 때문이에요. 이러한 도구가 가장 필요한 화자들은 역설적으로 자신들을 위한 도구가 만들어질 가능성이 가장 낮은 커뮤니티이기도 해요.

**rosetta는 이를 바꾸기 위해 만들어졌어요.**

[Method Leaderboard](/leaderboard)는 공개적인 도전 과제예요. 소외된 언어를 위한 최고의 번역 메서드를 구축하고, 재현 가능한 평가로 이를 증명하여 최고 점수를 차지해 보세요. 언어학자, ML 연구자, 커뮤니티 언어 작업자, 학생, 취미 활동가 등 전 세계 누구나 기여할 수 있어요. 문제는 아직 해결되지 않았어요. 인프라는 준비되어 있어요. 리더보드가 여러분을 기다리고 있어요.

---

## 이것이 어려운 이유: 포합어 형태론(Polysynthetic Morphology)

대부분의 상용 MT 시스템은 영어, 프랑스어, 중국어와 같은 언어를 위해 설계되었어요. 이런 언어들은 단어가 비교적 짧고 문장이 개별 토큰으로 구성되죠. 하지만 Plains Cree를 포함한 많은 원주민 언어는 **포합어(polysynthetic)**예요. 영어가 문장 전체로 표현하는 내용을 단 하나의 단어로 인코딩할 수 있어요.

### Cree 언어의 예시

다음 Plains Cree 단어를 살펴보세요.

> **ê-kî-nitawi-kîskinwahamâkosiyân**
> *"내가 학교에 갔을 때"*

이것은 **단 하나의 단어**예요. 여기에는 시제(과거), 방향(~로 가는), 어근(배우다), 태(수동/재귀), 인칭(1인칭 단수)이 모두 포함되어 있어요. 주로 영어로 학습된 LLM은 이러한 형태론적 밀도에 대한 직관이 없어요.

어려움은 여기서 끝이 아니에요.

| 과제 | 의미 |
|-----------|--------------|
| **형태론적 복잡성(Morphological complexity)** | 단일 동사 어근이 접두사, 접미사, 양분 접사(circumfixation)를 통해 수천 개의 유효한 굴절형을 생성할 수 있어요. |
| **유정/무정(Animate/inanimate) 구분** | 명사는 문법적으로 유정물 또는 무정물로 나뉘며, 이는 동사 활용, 지시 대명사, 복수형에 영향을 미쳐요. 이 분류가 항상 생물학적 유정성을 따르는 것은 아니에요(*askiy* "지구"는 유정물이고, *maskisin* "신발"도 유정물이에요). |
| **제4인칭(Obviation)** | 3인칭 지칭은 근접성/현저성에 따라 순위가 매겨져요. "근접(proximate)"과 "소외(obviative)"의 구분은 영어에 상응하는 개념이 없어요. |
| **부족한 학습 데이터(Sparse training data)** | LLM은 Plains Cree 텍스트를 거의 접하지 못했어요. 접한 데이터조차도 방언(Y-방언, TH-방언)이나 표기법(SRO 대 음절 문자)이 섞여 있을 수 있어요. |
| **상용 베이스라인 부재** | Google Translate는 유용한 결과를 반환하지 않아요. 비교할 만한 기성 API가 없어요. |

이것이 포합어 번역이 여전히 **미해결 연구 과제**로 남아 있는 이유이며, 점수가 매겨지고 재현 가능한 리더보드가 중요한 이유예요.

---

## 선행 기술: 사람들이 이 문제에 접근한 방법

### ALTLab FST

Plains Cree를 위한 가장 중요한 컴퓨팅 리소스는 노르웨이 북극 대학교(UiT)의 [Giellatekno](https://giellatekno.uit.no/)와 협력하여 앨버타 대학교의 [Alberta Language Technology Lab (ALTLab)](https://altlab.artsrn.ualberta.ca/)에서 개발한 **유한 상태 변환기(FST, finite-state transducer)**예요.

ALTLab FST는 **형태소 분석기 및 생성기**예요. 굴절된 Cree 단어가 주어지면 이를 어근과 문법 태그로 분해할 수 있고, 어근과 태그가 주어지면 올바른 굴절형을 생성할 수 있어요. 이는 결정론적(deterministic)이며, 신경망이나 환각(hallucination), 확률이 개입되지 않아요. FST가 단어를 수용한다면, 그 단어는 형태론적으로 유효한 거예요.

이것이 rosetta 리더보드에서 **FST 수용률(FST Acceptance Rate)**을 지표로 추적하는 이유예요. FST가 거부하는 단어를 생성하는 번역 메서드는 chrF++ 점수와 관계없이 형태론적으로 유효하지 않은 Cree를 생성하고 있는 거예요.

**주요 ALTLab 리소스:**
- [itwêwina](https://itwewina.altlab.app/) — FST로 구동되는 지능형 Plains Cree–영어 사전
- [Morphodict](https://github.com/UAlbertaALTLab/morphodict) — 오픈 소스 형태소 인식 사전 플랫폼
- [crk-db](https://github.com/UAlbertaALTLab/crk-db) — Plains Cree 어휘 데이터베이스
- [21st Century Tools for Indigenous Languages](https://21c.tools/) — 더 넓은 프로젝트 컨텍스트

### 글로벌 FST 및 형태소 레지스트리

고품질 FST 인프라를 갖춘 언어는 Plains Cree뿐만이 아니에요. 다른 저자원 언어나 형태론적으로 복잡한 언어를 위한 번역 파이프라인을 개발하고 싶다면, 다음과 같이 확립된 글로벌 허브를 활용할 수 있어요.

* **[GiellaLT / Giellatekno](https://giellalt.github.io/) (노르웨이 북극 대학교 UiT):** 100개 이상의 언어를 다루는 오픈 소스 FST 형태소 분석기 및 생성기의 가장 큰 저장소예요. 주요 대상은 사미어(Sámi languages)(`sme`, `smj`, `sma` 등), 우랄어(Komi, Erzya, Udmurt 등) 및 기타 소수/원주민 언어예요. [GitHub Organization](https://github.com/giellalt/)에서 공개 처리된 텍스트 말뭉치(`corpus-xxx`)를 호스팅하고 있어요.
* **[The Apertium Project](https://www.apertium.org/):** 오픈 소스 규칙 기반 기계 번역 플랫폼이에요. Apertium은 수십 개의 언어(카자흐어, 타타르어, 키르기스어 등 다양한 튀르크어 및 소수 유럽 언어 포함)에 대해 고도로 최적화된 FST 형태소 분석기(`lttoolbox` 및 `hfst` 사용)와 이중 언어 사전을 유지 관리해요. 모든 리소스는 [Apertium의 GitHub](https://github.com/apertium)에 공개되어 있어요.
* **[UniMorph (Universal Morphology)](https://unimorph.github.io/):** 150개 이상의 언어에 대한 표준화된 형태론적 패러다임을 제공하는 공동 프로젝트예요. 데이터셋은 Hugging Face의 [unimorph/universal_morphologies](https://huggingface.co/datasets/unimorph/universal_morphologies)에서 호스팅돼요. 특정 언어에 대해 컴파일된 FST 바이너리를 사용할 수 없는 경우, UniMorph 테이블을 정적 데이터베이스 조회 게이트로 사용할 수 있어요.
* **[캐나다 국립 연구 위원회 (NRC)](https://nrc-digital-repository.canada.ca/):** **Uqailaut** Inuktitut FST 형태소 분석기와 방대한 **Nunavut Hansard Parallel Corpus**(130만 개의 정렬된 영어-Inuktitut 문장 쌍)를 포함하여 캐나다 원주민 언어를 위한 도구를 제공해요.

### EdTeKLA 말뭉치

(마찬가지로 앨버타 대학교의) [EdTeKLA 연구 그룹](https://spaces.facsci.ualberta.ca/edtekla/)은 교육 자료, 오디오 전사본, 커뮤니티 출처에서 Plains Cree 언어 말뭉치를 수집했어요. rosetta 평가 데이터셋인 [EDTeKLA Dev v1](/docs/eval/datasets)은 이 작업에서 파생되었으며, [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 라이선스를 따라요.

### 사람들이 시도했거나 시도할 수 있는 다른 접근 방식

리더보드는 특정 메서드에 얽매이지 않아요(method-agnostic). 다음은 저자원 MT를 위해 탐구되었거나 제안된 전략들이며, 이 중 어떤 것이든 제출할 수 있어요.

| 접근 방식 | 작동 방식 | 장점 | 단점 |
|----------|-------------|------|------|
| **코칭된 LLM 프롬프팅(Coached LLM prompting)** | 시스템 프롬프트에 문법 규칙, 사전, 예문 쌍을 주입해요. | 빠른 반복이 가능하고 학습이 필요 없어요. | LLM의 기본 지식에 의해 품질의 한계가 정해져요. |
| **퓨샷 프롬프팅(Few-shot prompting)** | 검증된 번역을 컨텍스트 내 예시로 포함해요. | 일관된 스타일을 유지하는 데 좋아요. | 컨텍스트 창이 작고, 예시가 평가 데이터에서 오면 안 돼요. |
| **FST 게이트 파이프라인(FST-gated pipeline)** | LLM이 생성 → FST가 검증 → 유효하지 않은 형태소는 거부하고 재시도해요. | 형태론적 유효성을 보장해요. | FST 인프라가 필요하며, 재시도 루프로 인해 지연 시간과 비용이 추가돼요. |
| **사전 조회 + LLM** | 이중 언어 사전의 알려진 용어를 강제하고, 나머지는 LLM이 처리하게 해요. | 알려진 용어에 대한 환각을 줄여줘요. | 사전의 커버리지는 항상 불완전해요. |
| **파인튜닝된 모델(Fine-tuned model)** | 병렬 텍스트로 오픈 모델(Llama, Mistral)을 파인튜닝해요(단, 평가 데이터는 제외). | 잠재적으로 가장 높은 품질을 제공해요. | 병렬 말뭉치가 필요하고(희귀함), 비용이 많이 들며, 과적합 위험이 있어요. |
| **연결된 모델(Chained models)** | 모델 A가 대략적인 번역 생성 → 모델 B가 사후 편집 → 모델 C가 점수를 매겨요. | 전문가의 강점을 결합할 수 있어요. | 복잡하고, 느리며, 비용이 많이 들어요. |
| **규칙 기반 + LLM 하이브리드** | 알려진 패턴에는 언어학적 규칙을 사용하고, 나머지는 LLM을 사용해요. | 규칙이 적용되는 곳에서는 정확해요. | 깊은 언어학적 전문 지식이 필요해요. |
| **역번역 증강(Back-translation augmentation)** | Cree→영어로 번역하여 합성 병렬 데이터를 생성한 다음, 그 반대로 학습해요. | 저렴하게 학습 데이터를 확장할 수 있어요. | 기존 모델의 오류를 증폭시킬 수 있어요. |
| **진화적 접근(Evolutionary approach)** | 후보 번역을 생성하고, 점수를 매기고, 가장 성능이 좋은 것을 변형(mutate)하는 과정을 반복해요. | 새로운 해결책을 발견할 수 있고, 병렬화가 가능해요. | 계산 비용이 많이 들고, 좋은 적합도 함수(fitness function)가 필요해요. |
| **부분 번역(Partial translation)** | 대표 샘플을 수동으로 번역하고, 해당 샘플에서 메서드가 스타일에 맞는지 증명한 다음, 나머지 대량의 데이터를 자동 번역해요. | 인간의 품질과 기계의 확장성을 결합해요. | 초기 인간의 노력이 필요해요. |
| **수동 JSON / 시험 채점** | 언어 시험에서 학생의 답안을 테스트하기 위해 데이터셋 JSON 파일을 수작업으로 만들거나, 골드 스탠다드(gold standard)를 기준으로 인간 번역 배치를 채점해요. | ML이 전혀 필요하지 않으며, 교육 및 QA에 유용해요. | 지속적인 번역 요구 사항으로 확장하기 어려워요. |

### 단순한 JSON일 뿐이에요

하네스는 JSON을 입력받아 JSON으로 점수를 출력해요. [데이터셋 형식](/docs/eval/datasets)은 간단해요.

```json
{
  "entries": [
    { "index": 0, "source_text": "Hello", "target_expected": "tânisi" },
    { "index": 1, "source_text": "Thank you", "target_expected": "kinanâskomitin" }
  ]
}
```

이것을 수작업으로 구성할 수도 있고, 스프레드시트에서 내보낼 수도 있으며, 말뭉치에서 생성할 수도 있어요. 언어 교사는 학생의 번역을 채점하는 데 사용할 수 있고, 번역 에이전시는 프리랜서를 벤치마킹하는 데 사용할 수 있으며, 연구소는 모델 아키텍처를 비교하는 데 사용할 수 있어요. 하네스는 JSON이 어디서 왔는지 신경 쓰지 않아요. 그저 점수를 매길 뿐이죠.

또한 프로덕션 배포 프레임워크가 동일한 플러그인 인터페이스를 사용하기 때문에, 하네스에서 좋은 점수를 받은 메서드는 구성(config)을 한 번만 변경하면 웹사이트에 배포할 수 있어요. **증명하고 사용해 보세요.**

가능성은 정말 무궁무진해요. **아이디어가 있다면 구축하고, 하네스를 실행하고, 점수를 제출해 보세요.**

---

## rosetta의 역할

rosetta는 인프라 계층을 제공하며, 여러분은 메서드를 가져오면 돼요.

### 코칭 시스템

rosetta의 `llm-coached` 메서드를 사용하면 언어학적 지식을 LLM 프롬프트에 직접 주입할 수 있어요.

```json title=".rosetta/coaching/crk.json"
{
  "grammar_rules": [
    "Plains Cree is polysynthetic — a single word can express what English needs a full sentence for",
    "Animate/inanimate noun distinction affects verb conjugation, demonstratives, and pluralization",
    "Use SRO (Standard Roman Orthography) as the working script — syllabic conversion is handled by the deterministic converter",
    "Obviation: when two third-person referents appear, the less salient one takes obviative marking (-a suffix on nouns, -iyiwa on verbs)"
  ],
  "dictionary": {
    "home": "kīwēwin",
    "settings": "isi-nākatohkēwin",
    "search": "nānātawāpahtam",
    "welcome": "tānisi",
    "dashboard": "kīskinwahamākēwin-māsinahikan"
  },
  "style_notes": "Use formal register appropriate for educational and community contexts. Preserve English technical terms in parentheses when no Cree equivalent exists or is widely accepted."
}
```

코칭 데이터는 `en:crk` 쌍에 대한 모든 LLM 프롬프트에 주입되어, 모델이 다른 방법으로는 얻을 수 없는 구조화된 언어학적 컨텍스트를 제공해요. 전체 사양은 [코칭 데이터](/docs/concepts/coaching-data)를 참조하세요.

### 레지스터(Registers)

레지스터는 어조, 격식, 정서법(orthographic conventions)을 조정하는 시스템 프롬프트의 일부예요. rosetta는 하나의 Plains Cree 레지스터와 함께 제공돼요.

```
nêhiyawêwin (Plains Cree). Use SRO (Standard Roman Orthography) as the working
script. Output will be converted to Syllabics via deterministic converter.
Professional register appropriate for educational and community contexts.
```

구성을 재정의하여 다양한 프롬프팅 전략을 실험해 볼 수 있어요.

```json title="i18n-rosetta.config.json"
{
  "languages": {
    "crk": {
      "register": "Casual Plains Cree (Y-dialect). Use SRO. Prefer everyday vocabulary over formal or archaic terms. Address the reader directly."
    }
  }
}
```

레지스터가 다르면 번역 스타일이 달라지고, 리더보드의 점수도 달라져요. 각 제출물은 사용된 정확한 레지스터와 시스템 프롬프트를 ([실행 카드(run card)](/docs/eval/run-card)에 SHA-256 해시로) 기록하므로 실험을 재현할 수 있어요.

### 문자 변환(Script conversion)

Plains Cree는 두 가지 문자로 작성돼요. **표준 로마자 표기법(SRO, Standard Roman Orthography)**과 **캐나다 원주민 음절 문자(Canadian Aboriginal Syllabics)**예요. rosetta의 파이프라인은 다음과 같아요.

1. LLM이 SRO로 번역해요 (라틴 문자 기반이라 LLM이 더 잘 처리해요).
2. 품질 게이트가 SRO 출력을 검증해요.
3. 결정론적 변환기가 SRO를 음절 문자로 변환해요.
4. 변환된 텍스트가 디스크에 기록돼요.

변환기는 모든 SRO 발음 구별 기호(장모음의 경우 ê, î, ô, â)를 처리하고 이를 올바른 음절 문자에 매핑해요. 기술적인 세부 사항은 [문자 변환기(Script Converters)](/docs/concepts/script-converters)를 참조하세요.

### 평가 루프

[평가 하네스](/docs/eval/harness)는 평가 데이터셋에 대해 메서드를 실행하고 점수가 매겨진 [실행 카드](/docs/eval/run-card)를 생성해요.

```bash
# Clone the harness
git clone https://github.com/gamedaysuits/gds-mt-eval-harness.git
cd gds-mt-eval-harness
pip install -e .

# Run a baseline experiment
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --model google/gemini-2.5-pro \
  --condition coached-v7

# Run with FST validation (if you have an FST binary)
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --fst-analyzer ./bin/crk-analyzer \
  --condition fst-gated-v1
```

`--condition` 플래그는 여러분이 선택하는 레이블이에요. 사람들이 어떤 프롬프트 전략을 사용했는지 볼 수 있도록 리더보드에 표시돼요. 하네스는 실행 카드에 전체 시스템 프롬프트를 기록하므로 정확한 접근 방식을 재현할 수 있어요.

:::tip 자유롭게 실험하고, 최고의 결과를 제출하세요
하네스는 빠른 반복을 위해 설계되었어요. 다양한 모델, 코칭 데이터, 레지스터, 조건으로 수십 번의 실험을 실행해 보세요. 자랑스러운 결과가 나왔을 때만 리더보드에 제출하세요.
:::

---

## OCAP 원칙

rosetta는 원주민 데이터 주권(Indigenous data sovereignty)을 지원하도록 설계되었어요. [OCAP 원칙](https://fnigc.ca/ocap-training/)(소유권, 통제권, 접근권, 점유권)은 우리가 원주민 커뮤니티를 위한 언어 기술에 접근하는 방식을 안내해요.

| 원칙 | rosetta의 지원 방식 |
|-----------|------------------------|
| **소유권(Ownership)** | 언어 커뮤니티가 언어 데이터의 소유권을 가져요. rosetta는 절대 데이터를 외부로 유출하거나 당사 서버로 전송하지 않아요. |
| **통제권(Control)** | [API 메서드](/docs/guides/serving-a-method)를 통해 커뮤니티가 자체 번역 파이프라인을 호스팅할 수 있어요. 우리는 인터페이스를 제공하고, 커뮤니티가 구현을 통제해요. |
| **접근권(Access)** | 커뮤니티가 메서드를 사용할 수 있는 사람을 결정해요. API는 인증을 통해 접근을 제한할 수 있어요. |
| **점유권(Possession)** | 모든 번역 데이터는 프로젝트의 파일 시스템에 유지돼요. [출처(provenance) 시스템](/docs/concepts/security)은 모든 번역이 어디서 왔는지 추적해요. |

플러그인 아키텍처를 통해 커뮤니티는 신성하거나 제한된 지식을 내부적으로 통합하는 메서드를 구축하고, 번역 API만 노출하며, 언어 리소스에 대한 완전한 통제권을 유지할 수 있어요.

---

## 비전: 다음 단계

Plains Cree가 첫 번째 목표예요. 파이프라인이 검증되고 커뮤니티가 품질에 만족하면, 동일한 아키텍처가 FST 인프라를 갖춘 다른 포합어로 확장될 거예요.

- **기타 알곤킨어족(Algonquian languages)**: Woods Cree, Swampy Cree, Ojibwe, Blackfoot
- **이누이트어(Inuit languages)**: Inuktitut, Inuinnaqtun (이 언어들도 음절 문자를 사용해요)
- **기타 어족(Other language families)**: FST 분석기가 있는 모든 언어는 FST 게이트 파이프라인을 사용할 수 있어요.

리더보드는 언어 쌍(language-pair) 단위로 범위가 지정돼요. 언어 커뮤니티에서 새로운 평가 데이터셋을 기여하면, 새로운 리더보드 트랙이 자동으로 열려요.

**이것은 공개적인 초대장이에요.** 연구자, 커뮤니티 구성원, 학생 또는 단순히 관심 있는 사람으로서 저자원 언어를 다루고 있다면, rosetta는 실제적인 것을 구축하고, 정직하게 측정하며, 세상과 공유할 수 있는 도구를 제공해요. [Method Leaderboard](/leaderboard)가 여러분의 제출을 기다리고 있어요.

---

## 함께 보기

- **[Method Leaderboard](/leaderboard)** — 점수를 제출하고 메서드들이 어떻게 비교되는지 확인해 보세요.
- **[MT 평가(MT Evaluation)](/docs/eval/)** — 좋은 메서드의 조건과 실격 기준
- **[평가 하네스(Eval Harness)](/docs/eval/harness)** — 실험 실행 방법
- **[평가 데이터셋(Evaluation Datasets)](/docs/eval/datasets)** — EDTeKLA Dev v1 및 FLORES+
- **[코칭 데이터(Coaching Data)](/docs/concepts/coaching-data)** — LLM을 위한 언어학적 지식 구조화 방법
- **[문자 변환기(Script Converters)](/docs/concepts/script-converters)** — SRO→음절 문자 파이프라인
- **[API를 통한 메서드 제공(Serving a Method via API)](/docs/guides/serving-a-method)** — 커뮤니티가 통제하는 번역 호스팅
- **[ALTLab](https://altlab.artsrn.ualberta.ca/)** — 앨버타 언어 기술 연구소(Alberta Language Technology Lab)
- **[EdTeKLA](https://spaces.facsci.ualberta.ca/edtekla/)** — 교육 기술, 지식 및 언어 연구 그룹(Educational Technology, Knowledge & Language research group)
- **[itwêwina 사전](https://itwewina.altlab.app/)** — FST로 구동되는 Plains Cree–영어 사전