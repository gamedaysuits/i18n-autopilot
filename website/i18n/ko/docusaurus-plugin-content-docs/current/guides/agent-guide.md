---
sidebar_position: 9
title: "에이전트 가이드: i18n-rosetta 사용하기"
description: "AI 에이전트가 로케일 파일을 번역하기 위해 i18n-rosetta를 설치, 설정 및 실행하는 방법이에요."
---
# 에이전트 가이드: i18n-rosetta 사용하기

i18n-rosetta는 명령어 하나로 앱의 로케일(locale) 파일을 번역해 주는 CLI 도구예요. 이 가이드는 번역된 로케일 파일을 처음부터 빠르게 구축하려는 AI 에이전트(또는 AI 에이전트와 함께 작업하는 개발자)를 위해 작성되었어요.

:::tip 이미 익숙하신가요?
명령어만 필요하다면 [CLI 레퍼런스](/docs/reference/cli)로 바로 이동해 보세요. 번역 메서드를 구축하고 벤치마크하고 싶다면 [Arena 에이전트 가이드](https://mtevalarena.org/docs/getting-started/agent-guide)를 확인해 보세요.
:::

---

## 환경 설정

```bash
# No global install needed — npx runs it directly
npx i18n-rosetta sync
```

**요구 사항:**
- Node.js 18 이상
- 번역 제공업체의 API 키

**API 키 설정** — 사용하는 메서드에 따라 rosetta에는 최소 하나 이상의 키가 필요해요:

```bash
# Option 1: export (session only)
export OPENROUTER_API_KEY="sk-or-..."        # for llm / llm-coached methods
export GOOGLE_TRANSLATE_API_KEY="AIza..."    # for google-translate method

# Option 2: .env file in your project root (persistent, gitignored)
echo 'OPENROUTER_API_KEY=sk-or-...' > .env
```

Rosetta는 `.env`를 자동으로 읽어와요. OpenRouter 키는 [openrouter.ai/keys](https://openrouter.ai/keys)에서 발급받을 수 있어요.

---

## 첫 동기화

Rosetta는 로케일 파일, 파일 형식(JSON, TOML, YAML, PO) 및 타겟 언어를 자동으로 감지해요:

```bash
npx i18n-rosetta sync
```

**진행 과정:**
1. `i18n-rosetta.config.json`를 불러와요(또는 설정을 자동 감지해요).
2. 소스 로케일 파일을 스캔하고 중첩된 키를 평탄화(flatten)해요.
3. `.i18n-rosetta.lock`(이전에 번역된 값의 SHA-256 해시)와 비교해요.
4. `.rosetta/tm.json`에서 캐시된 번역(Translation Memory)을 확인해요.
5. 설정된 메서드를 통해 **변경되거나, 누락되거나, 오래된 키**만 번역해요.
6. 모든 번역에 대해 Quality Gate(5가지 검사)를 실행해요.
7. 검사를 통과한 번역을 타겟 로케일 파일에 기록해요.
8. 잠금 파일(lock file)과 TM 캐시를 업데이트해요.

키 하나를 변경한 후 다시 실행하는 일반적인 경우, 4단계에서 142개의 키를 캐시에서 가져오고 5단계에서 1개의 키만 번역해요. 이것이 바로 이후의 동기화 작업이 빠르고 저렴한 이유예요.

---

## 설정

프로젝트 루트에 `i18n-rosetta.config.json`를 생성해 주세요:

```json
{
  "inputLocale": "en",
  "pairs": {
    "en-fr": { "method": "llm-coached" },
    "en-ja": { "method": "google-translate" },
    "en-crk": { "method": "api", "endpoint": "http://localhost:3000/translate" }
  }
}
```

주요 필드:

| 필드 | 목적 | 기본값 |
|-------|---------|---------|
| `inputLocale` | 소스 언어 | `en` |
| `pairs` | 메서드 설정이 포함된 소스→타겟 매핑 | (필수) |
| `localesDir` | 로케일 파일 위치 | (자동 감지됨) |
| `model` | `llm`/`llm-coached` 메서드용 LLM 모델 | `google/gemini-2.5-flash` |
| `batchSize` | API 호출당 키 개수 | 30 (LLM), 128 (Google) |
| `concurrency` | 콘텐츠 번역을 위한 병렬 API 호출 수 | 12 |

전체 레퍼런스: [설정](/docs/getting-started/configuration)

---

## 번역 메서드

| 메서드 | 사용 시기 | 비용 | 필요 API 키 |
|--------|------------|------|---------------|
| **`llm`** | 범용적이며 리소스가 풍부한 언어에 적합해요 | 토큰당 (모델에 따라 다름) | `OPENROUTER_API_KEY` |
| **`llm-coached`** | 타겟 언어에 대한 문법 규칙/사전이 있을 때 사용해요 | 토큰당 + 코칭 컨텍스트 | `OPENROUTER_API_KEY` |
| **`google-translate`** | GT가 잘 작동하는 리소스가 풍부한 언어에 적합해요 | 100만 자당 $20 | `GOOGLE_TRANSLATE_API_KEY` |
| **`api`** | HTTP 엔드포인트 뒤에 호스팅된 맞춤형 파이프라인이에요 | 서버에서 결정 | 없음 (엔드포인트에서 인증 처리) |
| **`plugin`** | 로컬에 설치된 사전 패키징된 메서드예요 | 다양함 | 다양함 |

자세한 내용: [번역 메서드](/docs/guides/translation-methods)

---

## 코칭 데이터

`llm-coached` 쌍의 경우, 코칭 데이터가 명시적인 언어 지식을 통해 LLM을 유도해요. 코칭 파일을 생성해 주세요:

```json title="coaching/fr.json"
{
  "grammar_rules": [
    "Use formal register (vous) for all UI text",
    "Adjectives agree in gender and number with the noun"
  ],
  "dictionary": {
    "dashboard": "tableau de bord",
    "settings": "paramètres"
  },
  "style_notes": "Prefer active voice. Avoid anglicisms."
}
```

페어(pair) 설정에서 이를 참조해 주세요:

```json
"en-fr": { "method": "llm-coached", "coachingFile": "coaching/fr.json" }
```

Quality Gate는 사전 용어가 실제 출력 결과에 포함되었는지 검증해요. 위반 사항은 `[TERM]` 경고로 기록돼요.

자세한 내용: [코칭 데이터](/docs/concepts/coaching-data)

---

## Quality Gate

모든 번역은 디스크에 기록되기 전에 5가지 자동화된 검사를 거쳐요:

| 검사 항목 | 감지 내용 | 예시 |
|-------|----------------|---------|
| **Empty/blank** | 모델이 아무것도 반환하지 않음 | `""` |
| **Source echo** | 모델이 영어 입력을 변경 없이 그대로 반환함 | 일본어에 대해 `"Welcome"` 반환 |
| **Hallucination loop** | 반복되는 트라이그램(trigram) | `"Qo' Qo' Qo' Qo'"` |
| **Length inflation** | 출력 길이가 소스보다 4배 이상 김 | 10자 소스 → 50자 출력 |
| **Script compliance** | 로케일에 맞지 않는 잘못된 문자 체계 | 아랍어 로케일에 라틴 문자 텍스트 반환 |

실패한 항목은 `[GATE]` 접두사와 함께 기록돼요. 조용히 넘어가는 대체(fallback)는 없어요. 번역이 실패하면 조용히 수용되지 않고 반드시 보고돼요.

자세한 내용: [Quality Gate](/docs/concepts/quality-gate)

---

## Translation Memory

Rosetta는 소스 텍스트 + 로케일 + 메서드를 키로 사용하여 `.rosetta/tm.json`에 번역을 캐시해요. 이후 동기화 시 변경되지 않은 키는 캐시에서 제공되므로 API 호출이 발생하지 않고 비용도 들지 않아요.

```
[TM] 142 key(s) served from cache
Translating 3 key(s) to French (llm)... [OK]
```

한 번의 실행에서 캐시를 우회하려면 `npx i18n-rosetta sync --no-tm`를 사용해 주세요.

자세한 내용: [Translation Memory](/docs/concepts/translation-memory)

---

## 생성된 파일

Rosetta는 프로젝트에 여러 파일을 생성해요. 실수로 잘못된 파일을 삭제하거나 커밋하지 않도록 각 파일의 용도를 알아두세요:

| 파일 | 목적 | Git 커밋 여부 |
|------|---------|------|
| `.i18n-rosetta.lock` | 번역된 소스 값의 SHA-256 해시 (변경 감지용) | **예** — 커밋해 주세요 |
| `.i18n-rosetta-content.lock` | 위와 동일하지만 Markdown/MDX 콘텐츠 파일용 | **예** — 커밋해 주세요 |
| `.rosetta/tm.json` | Translation Memory 캐시 | **예** — 커밋해 주세요 (팀의 API 비용 절감) |
| `.rosetta/coaching/` | 코칭 데이터 디렉터리 | **예** — 언어 지식이 담긴 곳이에요 |
| `i18n-rosetta.config.json` | 프로젝트 설정 | **예** — 커밋해 주세요 |

---

## 일반적인 패턴

**단일 언어 쌍 번역하기:**
```bash
npx i18n-rosetta sync --pair en-fr
```

**설정된 모든 언어 쌍 번역하기:**
```bash
npx i18n-rosetta sync
```
Rosetta는 언어 쌍을 순차적으로 처리해요. TM 캐싱 덕분에 변경된 키만 API를 호출해요.

**콘텐츠 모드 (Docusaurus, Hugo 등을 위한 Markdown/MDX):**
```bash
npx i18n-rosetta sync --content
```
로케일 JSON과 함께 문서, 블로그 게시물 및 콘텐츠 파일을 번역해요. 병렬 동시성(기본값: 12개의 동시 API 호출)을 사용해요.

**Dry run (기록하지 않고 미리 보기):**
```bash
npx i18n-rosetta sync --dry-run
```

**특정 키 강제 재번역하기:**
```bash
npx i18n-rosetta sync --force-keys "hero.title,nav.about"
```

**모든 콘텐츠 파일 강제 재번역하기:**
```bash
npx i18n-rosetta sync --force-content
```

**번역 상태 확인하기:**
```bash
npx i18n-rosetta status
```
각 언어 쌍에 대한 커버리지, 품질 등급 및 플러그인 정보를 보여줘요.

**번역되지 않은 대체(fallback) 값 감사하기:**
```bash
npx i18n-rosetta audit
```
번역이 필요한 모든 `[EN]` 대체 값을 나열해요.

---

## 문제 해결

| 문제 | 해결 방법 |
|---------|-----|
| `OPENROUTER_API_KEY not set` | 키를 내보내거나(export) 프로젝트 루트의 `.env`에 추가해 주세요 |
| `No locale files found` | 설정에서 `localesDir`를 지정하거나, 로케일 파일이 표준 명명 규칙(`en.json`, `fr.json`)과 일치하는지 확인해 주세요 |
| `[GATE] Script compliance failed` | 타겟 로케일에 예상된 문자 체계 대신 라틴 텍스트가 반환되었어요 — 다른 모델을 시도하거나 코칭 데이터를 추가해 보세요 |
| `[GATE] Source echo` | 모델이 영어를 변경 없이 그대로 반환했어요 — 보통 코칭 데이터를 추가하거나 다른 모델을 사용하면 해결돼요 |
| 모든 번역이 캐시됨 | 캐시를 우회하려면 `--no-tm` 옵션으로 실행하거나, 특정 키에 대해 `--force-keys` 옵션을 사용해 보세요 |
| 잠금 파일(Lock file) 충돌 | `.i18n-rosetta.lock`는 SHA-256 해시를 사용해요 — 병합 충돌 시 어느 쪽 버전을 유지하든 안전하게 해결할 수 있으며, 이후 동기화를 다시 실행해 주세요 |

---

## 다음 단계

- [빠른 시작](/docs/getting-started/quick-start) — 시작하기 위한 전체 가이드
- [CLI 레퍼런스](/docs/reference/cli) — 모든 명령어 및 플래그
- [작동 방식](/docs/how-it-works) — 동기화 파이프라인 설명
- [Eval Harness 브릿지](/docs/guides/bridge) — rosetta가 Arena에 연결되는 방식
- **나만의 번역 메서드를 구축하고 싶으신가요?** [Arena 에이전트 가이드](https://mtevalarena.org/docs/getting-started/agent-guide)를 확인해 보세요 — 메서드를 구축하고, 성능을 증명하고, 상금을 획득해 보세요.