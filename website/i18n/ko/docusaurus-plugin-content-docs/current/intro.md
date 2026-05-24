---
sidebar_position: 1
slug: /
title: "소개"
---
# i18n-rosetta

완전히 커스터마이징 가능한 국제화 프레임워크예요. 명령어 하나로 로케일 파일을 번역해요. 설정 파일 하나로 모든 메서드, 모델, 언어 쌍을 제어할 수 있어요. 내장된 메서드로 충분하지 않다면 직접 만들고, 제대로 작동하는지 증명한 다음 배포해 보세요.

```bash
npx i18n-rosetta sync
```

rosetta는 로케일 파일, 포맷, 타겟 언어를 자동으로 감지해요. 누락된 부분을 번역하고, 이미 완료된 부분은 건너뛰며, 모든 결과를 검증하고 깔끔한 결과물을 작성해요. 이건 시작에 불과해요.

---

## 왜 직접 스크립트를 작성하지 않을까요?

각 키마다 Google Translate를 호출하는 간단한 루프를 작성할 수도 있어요. 대부분의 개발자가 그렇게 하며, 약 30줄이면 충분해요. 하지만 다음과 같은 문제가 발생해요:

- **변경 감지 불가.** 영어 문자열을 업데이트해도 번역은 영원히 예전 상태로 남아있어요. rosetta는 SHA-256 해시로 모든 소스 값을 추적하고 변경된 내용만 다시 번역해요.
- **일괄 처리(Batching) 불가.** 키 하나당 한 번의 API 호출은 200개의 키 = 200번의 왕복을 의미해요. rosetta는 지능적으로 일괄 처리해요(설정 가능, LLM은 기본 30키/배치, Google은 128키/배치).
- **품질 게이트 부재.** 기계 번역은 환각(hallucination)을 일으키거나, 소스를 그대로 반환하거나, 잘못된 문자로 출력할 수 있어요. rosetta는 작성하기 전에 모든 번역을 검증해요. 잘못된 문자, 길이 팽창, 소스 그대로 반환되는 문제 등을 잡아내고 거부해요.
- **포맷 인식 불가.** JSON으로 하드코딩되어 있나요? rosetta는 JSON, TOML, YAML, Hugo Markdown(프런트매터 + 본문)을 자동 감지하여 처리해요.
- **메서드 제어 불가.** 모든 언어 쌍에 동일한 메서드가 적용돼요. rosetta를 사용하면 동일한 설정 파일 내에서 프랑스어에는 Google Translate를, 일본어에는 LLM을, 크리어(Cree)에는 커뮤니티 호스팅 커스텀 파이프라인을 사용할 수 있어요.

rosetta는 바로 그 스크립트의 프로덕션 버전이에요.

---

## 무엇이 다를까요?

### 모든 메서드는 플러그인이에요

번역 메서드는 **언어 쌍마다 설정할 수 있어요**. 동일한 프로젝트에서 Google Translate, LLM, 코칭된 프롬프트(coached prompts), 커스텀 API를 혼합해서 사용해 보세요:

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

프랑스어는 Google Translate(빠르고 저렴함)를 사용해요. 일본어는 프리미엄 LLM(뉘앙스 살림)을 사용해요. 평원 크리어(Plains Cree)는 문법 규칙, 사전, 형태소 검증이 포함된 코칭된 플러그인을 사용해요. 동일한 `sync` 명령어, 동일한 품질 게이트, 동일한 CLI를 사용해요.

### 증명해 보세요

여러분의 메서드가 영어를 스페인어로, 튀르키예어를 아제르바이잔어로, 영어를 크리어로 번역할 수 있다고 생각하시나요?

**증명해 보세요.** 함께 제공되는 [평가 하네스(eval harness)](/docs/eval/harness)는 재현 가능하고 핑거프린트가 적용된 채점 방식으로 모든 번역 메서드를 벤치마킹해요. [리더보드](/leaderboard)는 모든 제출 항목을 추적해요.

평가 하네스와 프로덕션 CLI는 동일한 플러그인 인터페이스를 공유해요. 하네스에서 좋은 점수를 받은 메서드는 프로덕션 환경에서도 사용할 수 있어요. 단, 해당 언어를 사용하는 커뮤니티의 동의가 있어야 해요. 원주민 언어와 자원이 부족한 언어의 경우 이러한 동의가 매우 중요해요. [데이터 주권(Data Sovereignty)](/docs/guides/data-sovereignty)을 참고해 주세요.

```bash
# Benchmark your method (in the eval harness repo)
cd gds-mt-eval-harness
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json --submit

# Use it locally
npx i18n-rosetta sync
```

동일한 플러그인이에요. 연결하고 테스트해 보세요.

### 완전한 툴킷

rosetta는 단순한 `sync`가 아니에요. 완전한 i18n 파이프라인이에요:

| 명령어 | 기능 |
|---------|-------------|
| `sync` | 누락되거나 오래된 키, 폴백(fallback) 키 번역 |
| `watch` | 소스 파일 변경 시 자동 동기화 |
| `lint` | 소스 코드에서 하드코딩된 문자열 스캔 |
| `wrap` | 하드코딩된 문자열을 `t()` 호출로 자동 래핑 |
| `audit` | 번역되지 않은 모든 `[EN]` 폴백 값 나열 |
| `integrity` | 플레이스홀더 손상 및 인코딩 문제 감지 |
| `seo` | hreflang 태그, 사이트맵, JSON-LD 생성 |
| `status` | 언어 쌍 설정, 플러그인, 벤치마크 점수 표시 |
| `provenance` | 번역 리소스 라이선스 감사 |
| `plugin` | 메서드 플러그인 설치, 제거 및 목록 표시 |

이 중 세 가지(`lint`, `sync`, `audit`)는 하드코딩된 문자열을 포착하고 번역하며, 불완전한 로케일이 있을 경우 빌드를 실패하게 만드는 CI 파이프라인을 구성해요.

---

## 아레나(The Arena)

[메서드 리더보드](/leaderboard)는 점수판이에요. 모든 제출물은 Git 커밋으로 핑거프린트되고, 특정 데이터셋으로 버전이 관리되며, 동일한 하네스에 의해 채점돼요. 누구나 제출할 수 있어요.

**무엇을 증명할 수 있을까요?** 하네스는 JSON을 사용해요. 플러그인도 JSON을 사용해요. JSON을 생성하는 모든 메서드를 테스트할 수 있어요:

| 접근 방식 | 예시 |
|----------|---------|
| **코칭된 LLM(Coached LLM)** | 최신(frontier) 모델의 프롬프트에 문법 규칙과 사전 주입 |
| **파인튜닝된 모델(Fine-tuned model)** | 병렬 텍스트로 오픈 모델 학습 — 단, 평가 데이터는 제외 |
| **FST 게이트 파이프라인(FST-gated pipeline)** | LLM 생성 → 유한 상태 트랜스듀서(FST)가 형태소 검증 → 재시도 |
| **체인 모델(Chained models)** | 모델 A 초안 작성 → 모델 B 사후 편집 → 모델 C 채점 |
| **사전 + LLM(Dictionary + LLM)** | 사전의 알려진 용어를 강제 적용하고 나머지는 LLM이 처리 |
| **진화형(Evolutionary)** | 후보 생성, 채점, 최상의 결과 변형, 반복 |
| **부분 번역(Partial translation)** | 샘플을 수동으로 번역하고, LLM이 일치하는지 증명한 후, 나머지를 자동 번역 |

모델을 파인튜닝해 보세요. 진화 알고리즘을 배포해 보세요. 어학 시험에서 학생들의 답안을 테스트해 보세요. 룩업 테이블을 구축해 보세요. 세 개의 모델을 체인으로 연결해 보세요. 메서드가 JSON을 생성하기만 한다면, 하네스가 점수를 매기고 프레임워크가 이를 실행해요.

:::danger 단 하나의 규칙
**평가 데이터로 학습하지 마세요.** 벤치마크 데이터셋에 노출된 메서드는 실격 처리돼요. 원하는 데이터로 파인튜닝하는 것은 괜찮지만, 테스트 세트는 절대 안 돼요.
:::

이것은 공개적인 초대장이에요. 연구자, 커뮤니티 구성원, 학생 또는 단순히 관심 있는 사람으로서 자원이 부족한 언어를 다루고 있다면, 메서드를 구축하고 하네스를 실행하여 최고 점수를 차지해 보세요. 문제는 아직 해결되지 않았고, 인프라는 여기에 준비되어 있어요.

**[→ 리더보드 보기](/leaderboard)**

---

## 다음 단계

**시작하기:**
- [설치(Installation)](/docs/getting-started/installation) — 2분 만에 설정하기
- [빠른 시작(Quick Start)](/docs/getting-started/quick-start) — 첫 번째 동기화 실행하기
- [지원되는 언어(Supported Languages)](/docs/reference/supported-languages) — 기본적으로 제공되는 기능 확인하기

**설정 커스터마이징:**
- [번역 메서드(Translation Methods)](/docs/guides/translation-methods) — 언어 쌍에 맞는 적절한 메서드 선택하기
- [설정(Configuration)](/docs/getting-started/configuration) — 전체 설정 레퍼런스
- [Hugo 다국어 사이트(Hugo Multilingual Site)](/docs/tutorials/hugo-multilingual-site) — Markdown 콘텐츠 번역

**더 알아보기:**
- [데이터 주권(Data Sovereignty)](/docs/guides/data-sovereignty) — OCAP, CARE 및 마오리 데이터 주권(Māori Data Sovereignty) 원칙
- [자원이 부족한 언어 지원하기(Support a Low-Resource Language)](/docs/guides/low-resource-languages) — 이 모든 것을 시작하게 한 도전 과제
- [쿡북: FST 게이트 파이프라인(Cookbook: FST-Gated Pipeline)](/docs/tutorials/fst-gated-pipeline) — 분해(decomposition) 파이프라인 구축하기
- [MT 평가(MT Evaluation)](/docs/eval/) — 하네스와 리더보드 작동 방식
- [메서드 리더보드(Method Leaderboard)](/leaderboard) — 실시간 점수 및 제출 항목