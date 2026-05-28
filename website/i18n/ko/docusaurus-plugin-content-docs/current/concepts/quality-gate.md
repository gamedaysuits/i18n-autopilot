---
sidebar_position: 3
title: "Quality Gate"
---
# Quality Gate

모든 번역은 디스크에 기록되기 전에 결정론적 유효성 검사 게이트를 거쳐요. Quality Gate는 일반적인 기계 번역의 실패 유형을 잡아내어, 조용히 대체(fallback)되거나 로케일 파일에 쓰레기 데이터가 기록되는 일을 방지해요.

## 유효성 검사

| 검사 항목 | 탐지 내용 | 게이트 라벨 |
|-------|----------------|-----------|
| **빈 값/공백 (Empty/blank)** | 모델이 빈 문자열이나 공백을 반환함 | `[GATE] empty` |
| **원본 에코 (Source echo)** | 모델이 원본 영어 입력을 그대로 반환함 | `[GATE] source-echo` |
| **환각 루프 (Hallucination loop)** | 반복되는 트라이그램(trigram) 패턴 (예: `"Qo' Qo' Qo'"`) | `[GATE] hallucination` |
| **길이 팽창 (Length inflation)** | 출력 결과가 원본보다 지나치게 긺 | `[GATE] length` |
| **문자 체계 준수 (Script compliance)** | 대상 로케일에 맞지 않는 문자 체계 | `[GATE] script` |
| **ICU 복수형 범주 (ICU plural categories)** | 해당 로케일에 필요한 복수형 형태가 누락됨 | `[GATE] icu-plural` |

### 빈 값/공백 (Empty/Blank)

빈 문자열, 공백으로만 이루어진 값, 또는 `null`인 번역을 거부해요. 이는 번역하기 까다로운 키에 대해 모델이 아무것도 반환하지 않는 경우를 잡아내요.

### 원본 에코 (Source Echo)

모델이 번역을 수행하지 않고 영어 원문을 그대로 반환하는 경우를 감지해요. 짧은 문자열이나 프롬프트가 불충분할 때 흔히 발생해요.

### 환각 루프 (Hallucination Loop)

출력 결과에서 트라이그램(3글자) 패턴을 분석해요. 출력 길이에 비해 특정 트라이그램이 임계값 이상 반복되면 해당 번역을 거부해요. 이를 통해 `"Qo' Qo' Qo' Qo' Qo'"`와 같이 비정상적으로 생성된 출력값을 잡아내요.

### 길이 팽창 (Length Inflation)

출력 길이가 `maxLengthRatio × source length`(기본값: 4배)를 초과하는 번역을 거부해요. 이는 짧은 입력에 대해 모델이 환각(hallucination)을 일으켜 장문의 텍스트를 생성하는 경우를 잡아내요.

설정 파일의 `maxLengthRatio`를 통해 구성할 수 있어요.

### 문자 체계 준수 (Script Compliance)

`script` 필드가 구성된 로케일(예: 평원 크리족 음절 문자의 경우 `"script": "cans"`)에 대해, 출력 결과에 대상 문자 체계에 적합한 비 ASCII 문자가 포함되어 있는지 검증해요. 아랍어, CJK(한중일) 또는 음절 문자 로케일에 대해 라틴 문자로만 이루어진 출력이 반환되면 거부돼요.

## 실패 시 발생하는 일

1. 실패한 번역은 `[GATE]` 접두사, 키 이름, 실패 사유, 그리고 값의 미리보기와 함께 stderr에 기록돼요.
2. 해당 키는 로케일 파일에 기록되지 **않아요**.
3. 재시도 캐스케이드(retry cascade)가 시작돼요(아래 내용 참고).

```
[GATE] hero.title: source-echo — "Welcome to our platform"
[GATE] nav.about: hallucination — "À À À À À À À À"
```

## 재시도 캐스케이드 (Retry Cascade)

배치 처리가 실패하면(JSON 파싱 오류 또는 Quality Gate 거부), rosetta는 점진적으로 더 작은 배치로 재시도를 수행해요.

```
Full batch (80 keys) → parse error
  └→ Half batch (40 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the 2 problem keys
```

재시도 예산은 `maxRetries`에 의해 제한돼요(기본값: 3, 언어별로 구성 가능). 이를 통해 지속적으로 실패하는 키에 대해 토큰이 과도하게 소비되는 것을 방지해요.

재시도 횟수를 모두 소진하면 문제가 발생한 키는 로그에 기록되고 건너뛰게 돼요. 이 키들은 다음 `sync` 실행 시 다시 시도될 거예요.

## 프롬프트 캐싱 (Prompt Caching)

시스템 메시지(어조, 문법 규칙, 스타일 참고 사항)는 사용자 메시지(번역할 키)와 분리돼요. 이러한 분리는 의도적인 설계예요.

- 특정 로케일에 대해 시스템 메시지는 **모든 배치에서 동일**해요.
- Anthropic 및 Google과 같은 제공업체는 반복되는 시스템 메시지를 캐시해요.
- 결과: 첫 번째 배치에서는 전체 토큰 비용을 지불하지만, 이후 배치부터는 사용자 메시지에 대한 비용만 지불하게 돼요.

이를 통해 배치가 많은 프로젝트의 토큰 비용을 크게 절감할 수 있어요.

## ICU MessageFormat 유효성 검사

`integrity` 명령은 CLDR 복수형 규칙을 기준으로 ICU MessageFormat 복수형 패턴의 유효성을 검사해요. 원본 파일에서 다음과 같은 ICU 구문을 사용하는 경우:

```json
"items": "{count, plural, one {# item} other {# items}}"
```

Rosetta는 번역된 버전에 대상 로케일에 필요한 모든 복수형 범주가 포함되어 있는지 확인해요. 예를 들어, 아랍어는 `one` 및 `other`뿐만 아니라 6개의 범주(`zero`, `one`, `two`, `few`, `many`, `other`)가 모두 필요해요.

모든 로케일에서 복수형이 완전하게 갖추어졌는지 확인하려면 `i18n-rosetta integrity`를 실행하세요.

## 용어 강제 적용 (Terminology Enforcement)

사전이 포함된 코칭 페어(coached pairs)의 경우, rosetta는 번역 후 용어 검사를 실행해요. Quality Gate를 통과한 후, LLM이 필수 사전 용어를 실제로 사용했는지 확인해요.

```
[TERM] en→fr: 2 term violation(s)
  • hero.title: "dashboard" → expected "tableau de bord" but got "panneau de contrôle"
```

용어 위반은 **경고일 뿐, 차단 오류가 아니에요**. 번역은 여전히 디스크에 기록돼요. 이는 의도된 동작으로, LLM이 문맥이나 문법 등 타당한 이유로 대체어를 선택했을 수 있으며, 용어 불일치로 인해 차단할 경우 득보다 실이 더 많을 수 있기 때문이에요.

위반 사항을 수정하려면 코칭 사전을 업데이트하거나 로케일 파일을 수동으로 편집하세요.

---

## 참고 자료

- [동기화 작동 방식 (How Sync Works)](/docs/concepts/how-sync-works) — 파이프라인에서 Quality Gate가 적용되는 위치
- [번역 방법 (Translation Methods)](/docs/guides/translation-methods) — 게이트로 전달되는 방법들
- [문자 체계 변환기 (Script Converters)](/docs/concepts/script-converters) — 게이트 통과 후 문자 체계 변환
- [코칭 데이터 (Coaching Data)](/docs/concepts/coaching-data) — 업스트림에서 번역 품질 향상
- [번역 메모리 (Translation Memory)](/docs/concepts/translation-memory) — 검증된 번역 캐싱
- [CLI 참조 — sync](/docs/reference/cli#sync) — 재시도 동작을 포함한 sync 플래그
- [CLI 참조 — integrity](/docs/reference/cli#integrity) — ICU 복수형 감사(auditing)