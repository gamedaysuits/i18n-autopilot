---
sidebar_position: 4
title: "메서드 인터페이스"
---
# 공유 메서드 인터페이스

eval harness와 i18n-rosetta는 **번역 메서드(translation method)**라는 공통 개념을 공유해요. 메서드란 소스 텍스트를 받아 번역된 텍스트를 생성하는 모든 절차를 의미하며, 직접적인 LLM 호출, 다단계 파이프라인, 서드파티 API 또는 인간 번역가 등이 될 수 있어요.

## 아키텍처

```
Method Plugin (v2 Spec)
├── manifest.json         ← Shared metadata (name, version, supported pairs)
├── method_card.json      ← Leaderboard description (what, not how)
├── translate.py          ← Python entry point (for eval harness)
└── translate.js          ← Node.js entry point (for i18n-rosetta CLI)
```

## 두 개의 시스템, 하나의 인터페이스

| | Eval Harness | i18n-rosetta |
|---|---|---|
| **언어** | Python | Node.js |
| **진입점** | `translate.py` | `translate.js` |
| **인터페이스** | `TranslationProcess` 프로토콜 | `methodPlugin` 설정 |
| **목적** | 점수화가 포함된 일괄 평가 | dev/CI 환경의 실시간 로컬라이제이션 |
| **출력** | 지표가 포함된 런 카드 | 번역된 로케일 파일 |

두 시스템을 모두 지원하는 메서드는 각 언어 런타임에 하나씩, 총 두 개의 진입점을 제공해요. **메서드 카드(method card)**가 그 가교 역할을 하는데, 두 시스템이 모두 이해할 수 있는 형식으로 메서드를 설명해 줘요.

## 메서드 카드

메서드 카드는 전체 시스템 프롬프트와 같은 독점적인 세부 정보를 노출하지 않고 번역 메서드가 *무엇*인지 설명해요. 다음과 같은 질문에 답을 제공해요:

- 이 메서드는 어떤 클래스인가요? (raw LLM, coached LLM, 파이프라인, API 등)
- 어떤 도구를 사용하나요? (FST 분석기, 사전 등)
- 구현체가 오픈 소스인가요?
- 어떤 언어 쌍을 지원하나요?

전체 JSON 스키마는 [Method Card Spec](https://github.com/gamedaysuits/gds-mt-eval-harness/blob/main/docs/method-card-spec.md)을 확인해 보세요.

### 예시

```json
{
  "method_id": "fst-gated-v8",
  "name": "FST-Gated Coached Translation v8",
  "class": "pipeline",
  "description": "LLM translation with morphological validation. Failed words are retried with FST feedback.",
  "author": "Curtis Forbes",
  "tools_used": ["HFST morphological analyzer", "Wolvengrey dictionary"],
  "open_source": false,
  "supported_pairs": ["eng>crk"]
}
```

### 메서드 클래스

| 클래스 | 설명 |
|-------|-------------|
| `raw-llm` | 최소한의 지시만 있는 직접적인 LLM 호출 |
| `coached-llm` | 구조화된 프롬프트, 예제, 제약 조건이 있는 LLM |
| `pipeline` | 결정론적(deterministic) 컴포넌트가 포함된 다단계 파이프라인 |
| `custom-plugin` | `TranslationProcess` 프로토콜을 구현하는 외부 프로세스 |
| `api` | 서드파티 번역 API (Google Translate, DeepL 등) |
| `human` | 인간 번역 (베이스라인 설정용) |

## Eval Harness: TranslationProcess 프로토콜

eval harness는 플러그인을 위해 Python의 구조적 타이핑(`Protocol`)을 사용해요. 올바른 메서드 시그니처를 가진 클래스라면 무엇이든 작동하며, 상속이 필요하지 않아요:

```python
class MyMethod:
    async def translate(self, entries: list[dict], config: RunConfig) -> list[dict]:
        results = []
        for entry in entries:
            translation = await self.do_translation(entry["source"])
            results.append({
                "id": entry["id"],
                "predicted": translation,
                "latency_s": 0.5,
                "usage": {"prompt_tokens": 0, "completion_tokens": 0},
                "error": None,
                "tool_calls": [],
                "tool_call_count": 0,
                "metadata": {},
            })
        return results
```

Python 이외의 메서드에 대한 래퍼(wrapper) 예제를 포함한 전체 문서는 [Plugin Protocol](https://github.com/gamedaysuits/gds-mt-eval-harness/blob/main/docs/plugin-protocol.md)을 확인해 보세요.

## i18n-rosetta: methodPlugin 설정

rosetta에서 메서드는 `i18n-rosetta.config.json`의 언어 쌍마다 등록돼요:

```json
{
  "version": 3,
  "pairs": {
    "en:crk": {
      "methodPlugin": "crk-coached-v1"
    }
  }
}
```

rosetta 측 인터페이스는 [Plugin Spec](/docs/reference/plugin-spec)을 확인해 보세요.

## 리더보드 연동

메서드 카드가 (`--method-card`을 통해) 실행에 첨부되면, 런 카드에 포함되어 리더보드에 표시돼요:

```bash
# Run with method card attached
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --method-card method_card.json \
  --submit
```

리더보드에는 다음 항목이 표시돼요:
- **클래스 배지** — 시각적 표시기 (예: "pipeline", "coached-llm")
- **메서드 이름** — 메서드 카드에서 가져옴
- **사용된 도구** — 메서드 카드에 나열된 항목
- **오픈 소스 표시기**

메서드 카드가 첨부되지 않은 경우, 리더보드에는 harness 기본 설정(모델, 조건, 온도, 활성화된 도구)이 표시돼요.

:::danger 평가 데이터로 학습하지 마세요
학습 데이터, 퓨샷(few-shot) 예제, 사전 항목 또는 프롬프트 튜닝 자료 등 개발 과정에서 평가 데이터셋에 노출된 메서드는 리더보드에서 **실격** 처리돼요. 좋은 메서드와 나쁜 메서드를 구분하는 기준은 [MT Evaluation](/docs/eval/)을 확인해 보세요.
:::

---

## 참고 항목

- [MT Evaluation](/docs/eval/) — 개요, 리더보드 가치, 좋은/나쁜 메서드 가이드
- [Eval Harness](/docs/eval/harness) — 평가 실행 방법
- [Evaluation Datasets](/docs/eval/datasets) — 사용 가능한 데이터셋 (EDTeKLA, FLORES+)
- [Run Card Specification](/docs/eval/run-card) — 런 카드 JSON 스키마
- [Plugin Spec](/docs/reference/plugin-spec) — rosetta 측 플러그인 인터페이스
- [Method Leaderboard](/leaderboard) — 실시간 벤치마크 점수