---
sidebar_position: 4
title: "보안"
---
# 보안 및 안전

Rosetta는 적대적인 환경에서도 안전하도록 설계되었어요. 로캘(locale) 데이터가 신뢰할 수 없는 출처에서 오거나, 조작된 파일 이름이 디렉터리 경계를 벗어나거나, LLM 출력이 어떤 내용이든 포함할 수 있는 상황을 모두 고려했어요.

## 위협 모델

| 위협 | 공격 벡터 | 완화 방법 |
|--------|--------------|-----------|
| **프로토타입 오염 (Prototype pollution)** | 조작된 JSON 키 (`__proto__`, `constructor`) | 파싱 시점에 거부됨 |
| **경로 탐색 (Path traversal)** | `../../etc/passwd`와 같은 로캘 코드 | 구성된 디렉터리에만 파일 쓰기가 검증됨 |
| **코드 블록 손상** | LLM이 코드 펜스 내부를 번역함 | 유니코드 센티널(sentinel) 보호 |
| **환각(Hallucinated) 키** | 전송되지 않은 키를 LLM이 반환함 | 응답 검증 — 허용된 키만 기록됨 |
| **과도한 토큰 소비** | 무한 재시도 루프 | `maxRetries`을(를) 통한 예산 제한 |

## 프로토타입 오염 방지

모든 로캘 키는 처리되기 전에 차단 목록(blocklist)을 기준으로 검증돼요.

- `__proto__`
- `constructor`
- `prototype`

이러한 패턴과 일치하는 모든 키는 오류와 함께 거부돼요. 이를 통해 공격자가 조작된 로캘 파일을 사용하여 JavaScript 객체 프로토타입을 수정하는 것을 방지해요.

## 경로 제한

로캘 파일을 작성할 때, rosetta는 출력 경로가 구성된 디렉터리(`localesDir`, `contentDir`) 내에 유지되는지 검증해요. 로캘 코드는 무해화(sanitize)되어, `../../secrets`와 같은 코드는 예상되는 디렉터리 외부에 파일을 쓸 수 없어요.

## 블록 보호

Markdown 콘텐츠를 번역하는 동안, 구조화된 요소는 텍스트가 LLM으로 전송되기 전에 유니코드 센티널 자리 표시자(placeholder)로 대체돼요.

1. **코드 블록** (펜스 및 인라인) → 센티널
2. **Hugo 숏코드** (`{{< >}}`, `{{% %}}`) → 센티널  
3. **원시(Raw) HTML** → 센티널
4. **보간 변수** (`{{ .Count }}`) → 센티널

번역이 완료되면 센티널은 다시 원본 콘텐츠로 교체돼요. LLM은 코드 블록, 숏코드 또는 HTML을 전혀 볼 수 없으므로 이를 손상시킬 수 없어요.

## 응답 검증

LLM이 JSON 응답을 반환할 때, rosetta는 다음 사항을 검증해요.
- 일괄 처리(batch)로 전송된 키만 응답에 포함되었는지 확인해요.
- 추가 키가 주입되지 않았는지 확인해요.
- 응답이 유효한 JSON으로 파싱되는지 확인해요.

환각(Hallucinated) 키는 조용히 무시돼요. 이를 통해 LLM 출력이 로캘 파일에 예상치 못한 번역을 주입하는 것을 방지해요.

## 품질 게이트 (Quality Gate)

모든 번역은 디스크에 기록되기 전에 5가지 결정론적 검사를 통해 검증돼요. 자세한 내용은 [품질 게이트](/docs/concepts/quality-gate)를 참조하세요.

## 지수 백오프 (Exponential Backoff)

API 호출은 429(속도 제한) 및 5xx(서버 오류) 응답에 대해 지터(jitter)가 포함된 지수 백오프를 사용해요. 지연 시간을 늘려가며 3번 재시도하여, 서비스 중단 시 API에 과도한 요청이 가해지는 것을 방지해요.

## 요청 시간 초과 (Request Timeout)

모든 API 요청은 `AbortController`을(를) 통해 30초의 시간 초과가 설정되어 있어요. 이를 통해 끊어진 연결에서 동기화 프로세스가 무한정 멈춰 있는 것을 방지해요.

## 대체(Fallback) 모드

API를 사용할 수 없는 경우, `--fallback`은(는) 실제 번역 대신 `[EN]` 접두사가 붙은 자리 표시자를 작성해요.

```bash
npx i18n-rosetta sync --fallback
```

```json
{
  "hero.title": "[EN] Welcome to our platform"
}
```

이러한 자리 표시자는 유효한 API 키를 사용한 다음 동기화 시 자동으로 감지되어 다시 번역돼요. 이들은 절대 "번역됨"으로 처리되지 않으며, `audit`에서 이를 표시(flag)해요.

## 테스트

보안 속성은 적대적 테스트 제품군(adversarial test suite)에 의해 검증돼요.

```bash
npm run test:redteam    # prototype pollution, path traversal, encoding attacks
```

---

## 참고 항목

- [아키텍처](/docs/concepts/architecture) — 세 부분으로 구성된 생태계가 연결되는 방식
- [CLI 참조 — integrity](/docs/reference/cli#integrity) — 무결성 검사 명령
- [CLI 참조 — provenance](/docs/reference/cli#provenance) — 출처 감사 명령
- [플러그인 사양](/docs/reference/plugin-spec) — 플러그인 매니페스트의 출처 필드
- [품질 게이트](/docs/concepts/quality-gate) — 번역 수준의 안전성 검사