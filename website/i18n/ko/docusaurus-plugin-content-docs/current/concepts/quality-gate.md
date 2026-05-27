---
sidebar_position: 3
title: "Quality Gate"
---
# Quality Gate

모든 번역은 디스크에 저장되기 전에 결정론적(deterministic) 유효성 검사 게이트를 통과해요. Quality Gate는 기계 번역에서 흔히 발생하는 실패 유형을 잡아내어, 알림 없이 대체되거나 로캘 파일에 불필요한 쓰레기 데이터가 기록되는 것을 막아줘요.

## 유효성 검사

| 검사 항목 | 잡아내는 문제 | 게이트 라벨 |
|-------|----------------|-----------|
| **빈 값/공백** | 모델이 빈 문자열이나 공백을 반환함 | `[GATE] empty` |
| **원본 반복** | 모델이 원본 영어 입력을 그대로 반환함 | `[GATE] source-echo` |
| **환각 루프** | 반복되는 트라이그램(trigram) 패턴 (예: `"Qo' Qo' Qo'"`) | `[GATE] hallucination` |
| **길이 팽창** | 출력 결과가 원본보다 지나치게 긺 | `[GATE] length` |
| **문자 체계 준수** | 대상 로캘에 맞지 않는 문자 체계 | `[GATE] script` |
| **ICU 복수형 범주** | 해당 로캘에 필요한 복수형 형태가 누락됨 | `[GATE] icu-plural` |

### 빈 값/공백

빈 문자열, 공백만 있는 문자열 또는 `null`인 번역을 거부해요. 이는 번역하기 어려운 키에 대해 모델이 아무것도 반환하지 않는 문제를 잡아내요.

### 원본 반복

모델이 번역을 하지 않고 영어 원문을 그대로 반환하는 경우를 감지해요. 짧은 문자열이나 프롬프트가 충분히 구체적이지 않을 때 흔히 발생해요.

### 환각 루프

출력 결과에서 트라이그램(3글자) 패턴을 분석해요. 출력 길이에 비해 특정 트라이그램이 임계값 이상 반복되면 해당 번역을 거부해요. 이는 `"Qo' Qo' Qo' Qo' Qo'"`와 같이 비정상적인 출력 결과를 잡아내요.

### 길이 팽창

출력 길이가 `maxLengthRatio × source length`(기본값: 4배)를 초과하는 번역을 거부해요. 이는 짧은 입력에 대해 모델이 환각을 일으켜 장문의 텍스트를 생성하는 문제를 잡아내요.

설정 파일의 `maxLengthRatio`를 통해 구성할 수 있어요.

### 문자 체계 준수

`script` 필드가 구성된 로캘(예: 평원 크리족 음절 문자의 경우 `"script": "cans"`)에 대해, 출력 결과에 대상 문자 체계에 적합한 비 ASCII 문자가 포함되어 있는지 유효성을 검사해요. 아랍어, CJK(한중일) 또는 음절 문자 로캘에 대해 라틴 문자만 출력되면 거부돼요.

## 실패 시 발생하는 일

1. 실패한 번역은 `[GATE]` 접두사, 키 이름, 실패 원인, 그리고 값의 미리보기와 함께 stderr에 로그로 남아요.
2. 해당 키는 로캘 파일에 기록되지 **않아요**.
3. 재시도 캐스케이드(retry cascade)가 시작돼요(아래 내용 참고).

```
[GATE] hero.title: source-echo — "Welcome to our platform"
[GATE] nav.about: hallucination — "À À À À À À À À"
```

## 재시도 캐스케이드

일괄 처리(batch)가 실패하면(JSON 파싱 오류 또는 Quality Gate 거부), rosetta는 점진적으로 더 작은 단위로 나누어 재시도해요.

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the 2 problem keys
```

재시도 예산은 `maxRetries`(기본값: 3, 언어별로 구성 가능)로 제한돼요. 이를 통해 지속적으로 실패하는 키에 대해 토큰이 과도하게 소비되는 것을 방지해요.

재시도 횟수를 모두 소진하면, 문제가 있는 키는 로그에 남고 건너뛰게 돼요. 이 키들은 다음 `sync` 실행 시 다시 시도돼요.

## 프롬프트 캐싱

시스템 메시지(어조, 문법 규칙, 스타일 참고 사항)는 사용자 메시지(번역할 키)와 분리돼요. 이러한 분리는 의도적인 설계예요.

- 특정 로캘에 대해 시스템 메시지는 **모든 일괄 처리(batch)에서 동일**해요.
- Anthropic 및 Google과 같은 제공업체는 반복되는 시스템 메시지를 캐시해요.
- 결과: 첫 번째 일괄 처리에서는 전체 토큰 비용을 지불하지만, 이후의 일괄 처리에서는 사용자 메시지에 대한 비용만 지불해요.

이를 통해 일괄 처리가 많은 프로젝트의 토큰 비용을 크게 줄일 수 있어요.

## ICU MessageFormat 유효성 검사

`integrity` 명령은 CLDR 복수형 규칙을 기준으로 ICU MessageFormat 복수형 패턴의 유효성을 검사해요. 원본 파일에서 다음과 같은 ICU 구문을 사용하는 경우:

```json
"items": "{count, plural, one {# item} other {# items}}"
```

Rosetta는 번역된 버전에 대상 로캘에 필요한 모든 복수형 범주가 포함되어 있는지 확인해요. 예를 들어, 아랍어는 `one` 및 `other`뿐만 아니라 6개의 범주(`zero`, `one`, `two`, `few`, `many`, `other`)가 모두 필요해요.

모든 로캘에 걸쳐 복수형이 완전하게 갖춰져 있는지 확인하려면 `i18n-rosetta integrity`를 실행하세요.

## 용어 적용

사전이 포함된 코칭 페어(coached pairs)의 경우, rosetta는 번역 후 용어 검사를 실행해요. Quality Gate를 통과한 후, LLM이 필수 사전 용어를 실제로 사용했는지 확인해요.

```
[TERM] en→fr: 2 term violation(s)
  • hero.title: "dashboard" → expected "tableau de bord" but got "panneau de contrôle"
```

용어 위반은 **차단 오류가 아니라 경고**예요. 번역은 여전히 디스크에 기록돼요. 이는 의도된 동작으로, LLM이 문맥이나 문법 등 타당한 이유로 대체어를 선택했을 수 있으며, 용어 불일치로 인해 차단하는 것이 오히려 더 큰 문제를 일으킬 수 있기 때문이에요.

위반 사항을 수정하려면 코칭 사전을 업데이트하거나 로캘 파일을 수동으로 편집하세요.

---

## 참고 항목

- [동기화 작동 방식](/docs/concepts/how-sync-works) — 파이프라인에서 Quality Gate가 적용되는 위치
- [번역 방법](/docs/guides/translation-methods) — 게이트로 입력되는 방법들
- [문자 체계 변환기](/docs/concepts/script-converters) — 게이트 통과 후 문자 체계 변환
- [코칭 데이터](/docs/concepts/coaching-data) — 업스트림에서 번역 품질 향상
- [번역 메모리](/docs/concepts/translation-memory) — 검증된 번역 캐싱
- [CLI 참조 — sync](/docs/reference/cli#sync) — 재시도 동작을 포함한 동기화 플래그
- [CLI 참조 — integrity](/docs/reference/cli#integrity) — ICU 복수형 감사