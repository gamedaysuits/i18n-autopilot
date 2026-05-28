---
sidebar_position: 4
title: "보안"
---
# 보안 및 안전

Rosetta는 적대적인 환경에서도 안전하게 작동하도록 설계되었어요. 로케일 데이터가 신뢰할 수 없는 출처에서 제공되거나, 조작된 파일 이름이 디렉터리 경계를 벗어나거나, LLM 출력에 어떤 내용이든 포함될 수 있는 상황을 대비합니다.

## 위협 모델

| 위협 | 공격 벡터 | 완화 방법 |
|--------|--------------|-----------|
| **프로토타입 오염 (Prototype pollution)** | 조작된 JSON 키 (`__proto__`, `constructor`) | 파싱 시 거부 |
| **경로 탐색 (Path traversal)** | `../../etc/passwd`와 같은 로케일 코드 | 구성된 디렉터리로만 파일 쓰기 검증 |
| **코드 블록 손상** | LLM이 코드 펜스 내부를 번역함 | 유니코드 센티널(sentinel) 보호 |
| **환각(Hallucinated) 키** | 전송하지 않은 키를 LLM이 반환함 | 응답 검증 — 허용된 키만 기록 |
| **토큰 비용 폭주** | 무한 재시도 루프 | `maxRetries`을(를) 통한 예산 제한 |

## 프로토타입 오염 방지

모든 로케일 키는 처리 전에 차단 목록(blocklist)을 기준으로 검증해요.

- `__proto__`
- `constructor`
- `prototype`

이 패턴과 일치하는 모든 키는 오류와 함께 거부돼요. 이를 통해 공격자가 조작된 로케일 파일을 사용하여 JavaScript 객체 프로토타입을 수정하는 것을 방지해요.

## 경로 제한

로케일 파일을 쓸 때, rosetta는 출력 경로가 구성된 디렉터리(`localesDir`, `contentDir`) 내에 유지되는지 검증해요. 로케일 코드는 무해화(sanitize)되므로, `../../secrets`와 같은 코드는 예상되는 디렉터리 외부에 파일을 쓸 수 없어요.

## 블록 보호

Markdown 콘텐츠를 번역하는 동안, 텍스트를 LLM으로 보내기 전에 구조화된 요소는 유니코드 센티널(sentinel) 자리 표시자로 대체돼요.

1. **코드 블록** (펜스 및 인라인) → 센티널
2. **Hugo 숏코드** (`{{< >}}`, `{{% %}}`) → 센티널  
3. **원시(Raw) HTML** → 센티널
4. **보간(Interpolation) 변수** (`{{ .Count }}`) → 센티널

번역이 완료되면 센티널은 다시 원본 콘텐츠로 교체돼요. LLM은 코드 블록, 숏코드 또는 HTML을 전혀 볼 수 없으므로 이를 손상시킬 수 없어요.

## 응답 검증

LLM이 JSON 응답을 반환할 때, rosetta는 다음 사항을 검증해요.
- 일괄 처리(batch)로 전송된 키만 응답에 포함되었는지
- 추가 키가 주입되지 않았는지
- 응답이 유효한 JSON으로 파싱되는지

환각(Hallucinated) 키는 조용히 무시돼요. 이를 통해 LLM 출력이 로케일 파일에 예상치 못한 번역을 주입하는 것을 방지해요.

## 품질 게이트 (Quality Gate)

모든 번역은 디스크에 기록되기 전에 5가지 결정론적 검사를 통해 검증돼요. 자세한 내용은 [품질 게이트](/docs/concepts/quality-gate)를 참조하세요.

## 지수 백오프 (Exponential Backoff)

API 호출은 429(속도 제한) 및 5xx(서버 오류) 응답에 대해 지터(jitter)가 포함된 지수 백오프를 사용해요. 지연 시간을 늘리면서 3번 재시도하여, 장애 발생 시 API에 과도한 요청이 쏟아지는 것을 방지해요.

## 요청 시간 초과 (Request Timeout)

모든 API 요청에는 `AbortController`을(를) 통한 30초의 시간 초과가 설정되어 있어요. 이는 끊어진 연결에서 동기화 프로세스가 무한정 멈춰 있는 것을 방지해요.

## 명시적인 번역 실패 알림 (Fail-Loud Translation Failures)

API를 사용할 수 없거나 번역이 실패할 경우, rosetta는 조용히 쓰레기 값을 기록하는 대신 실행 가능한 지침과 함께 명확한 오류를 발생시켜요. 동기화 중에는 `[EN]` 접두사가 붙은 자리 표시자가 절대 기록되지 않아요.

```
[ERR] Content sync for fr: no API key available.
  Set OPENROUTER_API_KEY in .env.local to translate content.
```

하나의 파일에서 실패하더라도 전체 동기화가 중단되지는 않아요. 오류가 기록되고 파이프라인은 다음 파일로 계속 진행되므로, 실행할 때마다 최대한의 진행률을 얻을 수 있어요.

## 동기화 후 검증 (Post-Sync Verification)

모든 번역이 완료된 후, rosetta는 디스크에 기록된 로케일 파일을 다시 읽어와 검증 단계를 실행해요. 이를 통해 동기화 성공 보고와 실제 번역 오류 사이의 간극을 잡아내요.

- **키 패리티(Key parity)** — 각 대상에 모든 소스 키가 존재함
- **`[EN]` 마커** — 이전 실행에서 남은 레거시 대체(fallback) 마커
- **빈 번역** — 누락되어 비어 있는 값
- **문자 스크립트 준수** — ASCII로만 번역된 비 라틴(non-Latin) 로케일
- **자리 표시자 보존** — ICU 자리 표시자가 소스와 일치함

`--no-verify`을(를) 사용하여 건너뛰거나 `npx i18n-rosetta verify`을(를) 사용하여 독립적으로 실행할 수 있어요.

## 테스트

보안 속성은 적대적 테스트 제품군(adversarial test suite)을 통해 검증돼요.

```bash
npm run test:redteam    # prototype pollution, path traversal, encoding attacks
```

---

## 참고 항목

- [아키텍처 (Architecture)](/docs/concepts/architecture) — 세 부분으로 구성된 생태계가 연결되는 방식
- [CLI 참조 — integrity](/docs/reference/cli#integrity) — 무결성 검사 명령어
- [CLI 참조 — provenance](/docs/reference/cli#provenance) — 출처(provenance) 감사 명령어
- [플러그인 사양 (Plugin Specification)](/docs/reference/plugin-spec) — 플러그인 매니페스트의 출처 필드
- [품질 게이트 (Quality Gate)](/docs/concepts/quality-gate) — 번역 수준의 안전 검사