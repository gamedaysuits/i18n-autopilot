---
sidebar_position: 1
slug: /
title: "소개"
---
# i18n-rosetta

완전히 커스터마이징 가능한 국제화(internationalization) 프레임워크입니다. 명령어 하나로 locale 파일을 번역해요. 설정 파일 하나로 모든 메서드, 모델, 언어 쌍(language pair)을 제어할 수 있어요. 내장된 메서드로 충분하지 않다면 직접 만들고, 제대로 작동하는지 증명한 다음 배포해 보세요.

```bash
npx i18n-rosetta sync
```

rosetta는 locale 파일, 포맷, 대상 언어를 자동으로 감지해요. 누락된 부분을 번역하고, 이미 완료된 부분은 건너뛰며, 모든 결과를 검증하고 깔끔한 결과물을 작성합니다. 이것은 단지 시작에 불과해요.

---

## 왜 직접 스크립트를 작성하지 않을까요?

각 키마다 Google Translate를 호출하는 간단한 루프를 작성할 수도 있어요. 대부분의 개발자가 그렇게 하며, 약 30줄이면 충분하죠. 하지만 다음과 같은 문제가 발생해요.

- **변경 사항 감지 불가.** 영어 문자열을 업데이트해도 번역은 영원히 과거 상태로 남아있게 돼요. rosetta는 SHA-256 해시로 모든 소스 값을 추적하고 변경된 내용만 다시 번역해요.
- **일괄 처리(Batching) 불가.** 키당 한 번의 API 호출은 200개의 키 = 200번의 왕복을 의미해요. rosetta는 지능적으로 일괄 처리합니다(설정 가능, 기본값은 LLM의 경우 배치당 80개 키, Google의 경우 128개).
- **캐싱 불가.** 동기화할 때마다 모든 것을 다시 번역해요. rosetta의 Translation Memory는 소스 텍스트 + locale + 메서드별로 번역을 캐시합니다. 키 하나를 변경한 후 동기화를 다시 실행하면 전체 파일이 아닌 해당 키 하나만 번역해요.
- **품질 검증(Quality gate) 부재.** 기계 번역은 환각(hallucination)을 일으키거나, 소스를 그대로 반환하거나, 잘못된 문자로 출력할 수 있어요. rosetta는 번역을 작성하기 전에 모든 번역을 검증합니다. 잘못된 문자, 길이 팽창, 소스 반복 등을 잡아내고 거부해요.
- **포맷 인식 불가.** JSON으로 하드코딩되어 있나요? rosetta는 자동 감지 기능을 통해 JSON, TOML, YAML 및 Hugo Markdown(frontmatter + body)을 처리해요.
- **메서드 제어 불가.** 모든 언어 쌍에 동일한 메서드가 적용돼요. rosetta를 사용하면 동일한 설정 파일 내에서 프랑스어에는 Google Translate를, 일본어에는 LLM을, Cree어에는 커뮤니티에서 호스팅하는 커스텀 파이프라인을 사용할 수 있어요.

rosetta는 바로 그 스크립트의 프로덕션 버전이에요.

---

## 무엇이 다를까요?

### 모든 메서드는 플러그인입니다

번역 메서드는 **언어 쌍마다 설정 가능**해요. 동일한 프로젝트에서 Google Translate, LLM, 코칭된 프롬프트(coached prompts), 커스텀 API를 혼합해서 사용해 보세요.

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "google-translate" },
    "en:ja": { "method": "llm", "model": "google/gemini-2.5-pro" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

프랑스어에는 Google Translate(빠르고 저렴함)를 사용해요. 일본어에는 프리미엄 LLM(뉘앙스 파악)을 사용하죠. Plains Cree어에는 문법 규칙, 사전, 형태소 검증이 포함된 코칭된 플러그인을 사용해요. 모두 동일한 `sync` 명령어를 사용합니다. 동일한 품질 검증과 동일한 CLI를 제공해요.

### 증명해 보세요

여러분의 메서드가 영어를 스페인어로, 튀르키예어를 아제르바이잔어로, 영어를 Cree어로 번역할 수 있다고 생각하시나요?

**증명해 보세요.** 함께 제공되는 [eval harness](https://mtevalarena.org/docs/specifications/harness)는 재현 가능하고 핑거프린트가 적용된 점수 산정 방식으로 모든 번역 메서드를 벤치마킹해요. [leaderboard](/leaderboard)는 모든 제출 항목을 추적합니다.

eval harness와 프로덕션 CLI는 동일한 플러그인 인터페이스를 공유해요. harness에서 좋은 점수를 받은 메서드는 프로덕션 환경에서 사용할 수 있어요. 단, 해당 언어를 사용하는 커뮤니티의 동의가 있어야 합니다. 원주민 언어와 자원이 부족한 언어(low-resource languages)의 경우 이러한 동의가 매우 중요해요. [데이터 주권](https://mtevalarena.org/docs/sovereignty/data-sovereignty)을 참고해 주세요.

```bash
# Benchmark your method (in the eval harness repo)
cd gds-mt-eval-harness
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json --submit

# Use it locally
npx i18n-rosetta sync
```

동일한 플러그인입니다. 연결하고 테스트해 보세요.

### 완벽한 툴킷

rosetta는 단순한 `sync`가 아니에요. 완전한 i18n 파이프라인입니다.

| Command | What It Does |
|---------|-------------|
| `sync` | 누락되거나 오래된 키 번역 (동기화 후 검증 포함) |
| `watch` | 소스 파일 변경 시 자동 동기화 |
| `lint` | 소스 코드에서 하드코딩된 문자열 스캔 |
| `wrap` | 하드코딩된 문자열을 `t()` 호출로 자동 래핑 |
| `audit` | 이전 실행의 모든 `[EN]` 폴백(fallback) 마커 목록 표시 |
| `verify` | 번역이 존재하고 올바른지 확인 (CI 게이트) |
| `integrity` | 자리 표시자(placeholder) 손상, 인코딩 문제, ICU 복수형 완전성 감지 |
| `seo` | hreflang 태그, 사이트맵, JSON-LD 스키마 생성 |
| `status` | 언어 쌍 설정, 플러그인, 벤치마크 점수 표시 |
| `provenance` | 번역 리소스 라이선스 감사 |
| `plugin` | 메서드 플러그인 설치, 제거 및 목록 표시 |
| `fonts` | PUA 스크립트 변환기용 웹 폰트 다운로드 |
| `tm` | Translation Memory 캐시 관리 (통계, 지우기, locale별) |
| `xliff` | 전문 번역가 검토를 위한 XLIFF 1.2 내보내기/가져오기 |

이 중 `lint`, `sync`, `verify`, `audit` 네 가지는 하드코딩된 문자열을 찾아내어 번역하고, 정확성을 검증하며, 불완전한 locale이 있을 경우 빌드를 실패하게 만드는 CI 파이프라인을 구성해요.

---

## The Arena

[Method Leaderboard](/leaderboard)는 점수판 역할을 해요. 모든 제출 항목은 Git 커밋으로 핑거프린트가 생성되고, 특정 데이터셋으로 버전이 지정되며, 동일한 harness에 의해 점수가 매겨집니다. 누구나 제출할 수 있어요.

**무엇을 증명할 수 있을까요?** harness는 JSON을 사용해요. 플러그인도 JSON을 사용하죠. JSON을 생성하는 모든 메서드를 테스트할 수 있어요.

| Approach | Example |
|----------|---------|
| **Coached LLM** | 최신 모델(frontier model)의 프롬프트에 문법 규칙과 사전을 주입해요 |
| **Fine-tuned model** | 병렬 텍스트로 오픈 모델을 훈련해요 (단, 평가 데이터는 제외) |
| **FST-gated pipeline** | LLM 생성 → 유한 상태 트랜스듀서(FST)가 형태소 검증 → 재시도 |
| **Chained models** | 모델 A가 초안 작성 → 모델 B가 사후 편집 → 모델 C가 점수 산정 |
| **Dictionary + LLM** | 사전에서 알려진 용어를 강제 적용하고, 나머지는 LLM이 처리하게 해요 |
| **Evolutionary** | 후보를 생성하고, 점수를 매기고, 가장 좋은 것을 변형하는 과정을 반복해요 |
| **Partial translation** | 샘플을 수동으로 번역하고, LLM이 일치하는지 증명한 후, 나머지를 자동 번역해요 |

모델을 파인튜닝(fine-tune)해 보세요. 진화 알고리즘을 배포하거나, 어학 시험에서 학생들의 답안을 테스트해 보세요. 룩업 테이블을 구축하거나 세 개의 모델을 연결할 수도 있어요. 메서드가 JSON을 생성하기만 한다면, harness가 점수를 매기고 프레임워크가 이를 실행합니다.

:::danger 단 하나의 규칙
**평가 데이터로 훈련하지 마세요.** 벤치마크 데이터셋에 노출된 메서드는 실격 처리됩니다. 원하는 데이터로 파인튜닝하는 것은 괜찮지만, 테스트 세트는 절대 안 돼요.
:::

이것은 공개적인 초대장이에요. 연구자, 커뮤니티 구성원, 학생 또는 단순히 관심을 가진 사람으로서 자원이 부족한 언어(low-resource language)를 다루고 있다면, 메서드를 구축하고 harness를 실행하여 최고 점수를 차지해 보세요. 문제는 아직 해결되지 않았고, 인프라는 여기에 준비되어 있습니다.

**[→ Leaderboard 보기](/leaderboard)**

---

## 다음 단계

**시작하기:**
- [설치](/docs/getting-started/installation) — 2분 만에 설정하기
- [빠른 시작](/docs/getting-started/quick-start) — 첫 동기화 실행하기
- [지원되는 언어](/docs/reference/supported-languages) — 기본적으로 제공되는 언어 확인하기

**설정 커스터마이징:**
- [번역 메서드](/docs/guides/translation-methods) — 언어 쌍에 맞는 적절한 메서드 선택하기
- [Translation Memory](/docs/concepts/translation-memory) — 캐싱으로 비용을 절감하는 방법
- [설정](/docs/getting-started/configuration) — 전체 설정 레퍼런스
- [Hugo 다국어 사이트](/docs/tutorials/hugo-multilingual-site) — Markdown 콘텐츠 번역하기

**더 깊이 알아보기:**
- [전문 번역가와 협업하기](/docs/guides/professional-translators) — XLIFF 내보내기/가져오기 워크플로우
- [데이터 주권](https://mtevalarena.org/docs/sovereignty/data-sovereignty) — OCAP, CARE 및 마오리(Māori) 데이터 주권 원칙
- [자원이 부족한 언어 지원하기](https://mtevalarena.org/docs/community/low-resource-languages) — 이 모든 것을 시작하게 한 도전 과제
- [쿡북: FST-Gated 파이프라인](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — 분해(decomposition) 파이프라인 구축하기
- [MT 평가](https://mtevalarena.org/docs/leaderboard/rules) — harness와 leaderboard의 작동 방식
- [Method Leaderboard](/leaderboard) — 실시간 점수 및 제출 항목