---
slug: v3-2-quality-infrastructure
title: "v3.2.0: 산업용 등급 품질 인프라"
authors: [curtisforbes]
tags: [release]
date: 2026-05-14
---
v3.2.0은 품질에 중점을 둔 릴리스예요. 702개의 테스트, 163개의 테스트 스위트를 갖추고 있으며, 조용한 실패(silent failures)에 대해서는 무관용 원칙을 적용했어요.

<!-- truncate -->

## 변경 사항

### Quality Gate (5가지 검사)

이제 모든 번역은 디스크에 기록되기 전에 5가지 결정론적 유효성 검사를 통과해야 해요:

1. **Empty/blank** — 모델이 아무것도 반환하지 않음
2. **Source echo** — 모델이 영어 입력값을 그대로 반환함
3. **Hallucination loop** — 반복되는 트라이그램(trigram) 패턴
4. **Length inflation** — 출력값이 원본보다 4배 이상 김
5. **Script compliance** — 로케일에 맞지 않는 잘못된 문자 체계(script)

이 5가지 검사를 모두 통과하지 못한 번역은 기록되지 않아요. 실패한 번역은 로그에 남고 다시 시도돼요.

### Retry Cascade

배치가 실패하면, rosetta는 점진적으로 더 작은 배치 단위로 다시 시도해요:

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the problem keys
```

### 보안 강화

- **Prototype pollution guard** — 파싱 시점에 `__proto__`, `constructor` 키를 거부해요
- **Path traversal guard** — 조작된 로케일 코드가 설정된 디렉터리 외부에 쓰기 작업을 할 수 없도록 막아요
- **Response validation** — 전송된 키만 응답으로 다시 허용해요

### 테스트 인프라

| 스위트 | 테스트 | 다루는 내용 |
|-------|-------|---------------|
| Core (8개 스위트) | 280+ | Config, sync, CLI, watch, audit, pairs, format, init |
| Red team | 89 | 적대적 입력(Adversarial inputs), 인코딩 공격 |
| Contract | 120 | API 통합 계약 |
| Performance | 36 | 배치 최적화, 처리량 감소(regression) |
| Coverage | 총 702개 | 전체 파이프라인 |

### 프롬프트 캐싱

이제 시스템 메시지가 사용자 메시지와 분리되어, Anthropic 및 Google과 같은 제공업체에서 프롬프트 캐시 적중(cache hits)이 가능해졌어요. 이를 통해 다중 배치 동기화 시 토큰 비용을 크게 줄일 수 있어요.

전체 기술 세부 정보는 [Quality Gate 문서](/docs/concepts/quality-gate)와 [보안 문서](/docs/concepts/security)를 확인해 주세요.