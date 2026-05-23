# i18n-rosetta

[![npm version](https://img.shields.io/npm/v/i18n-rosetta.svg)](https://www.npmjs.com/package/i18n-rosetta)
[![CI](https://github.com/gamedaysuits/i18n-rosetta/actions/workflows/ci.yml/badge.svg)](https://github.com/gamedaysuits/i18n-rosetta/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

🌐 **README 번역** — *물론 rosetta로 번역되었습니다:*
[Français](docs/README.fr.md) · [Deutsch](docs/README.de.md) · [Español](docs/README.es.md) · [Português](docs/README.pt.md) · [Nederlands](docs/README.nl.md) · [日本語](docs/README.ja.md) · [한국어](docs/README.ko.md) · [简体中文](docs/README.zh.md) · [ไทย](docs/README.th.md) · [Tiếng Việt](docs/README.vi.md) · [Filipino](docs/README.fil.md) · [العربية](docs/README.ar.md)

하나의 명령으로 로케일 파일을 번역합니다:

```bash
npx i18n-rosetta sync
```

Rosetta는 로케일 파일, 해당 형식 및 대상 언어를 자동으로 감지합니다. 누락된 키를 번역하고, 이미 완료된 것은 건너뛰며, 결과를 작성합니다. 이것이 전부입니다.

## 직접 스크립트를 작성하지 않는 이유

영어 키를 반복하고 Google 번역을 호출하는 간단한 스크립트를 작성할 수 있습니다. 대부분의 개발자가 그렇게 합니다. 약 30줄 정도 걸립니다. 다음은 스크립트가 실패하는 이유입니다:

- **변경 감지 없음.** 영어 문자열을 업데이트하면 번역은 영원히 오래된 상태로 유지됩니다. Rosetta는 모든 소스 값을 SHA-256 해시로 추적하고 변경된 내용만 다시 번역합니다.
- **배치 처리 없음.** 키당 하나의 API 호출은 200개의 키 = 200번의 왕복을 의미합니다. Rosetta는 지능적으로 배치 처리합니다(LLM의 경우 기본 30개 키/배치, Google의 경우 128개로 구성 가능).
- **품질 게이트(Quality Gate) 없음.** 기계 번역은 환각을 일으키거나, 소스를 다시 에코하거나, 잘못된 스크립트로 출력합니다. Rosetta는 모든 번역을 작성하기 전에 유효성을 검사합니다. 잘못된 스크립트, 길이 팽창 및 소스 에코는 감지되어 거부됩니다.
- **형식 인식 없음.** JSON으로 하드코딩되어 있습니까? Rosetta는 JSON, TOML, YAML 및 Hugo Markdown(프론트매터 + 본문)을 자동 감지하여 처리합니다.
- **안전성 없음.** Rosetta는 프로토타입 오염, 조작된 로케일 코드를 통한 경로 탐색, Markdown 번역 중 코드 블록 손상을 방지합니다.

Rosetta는 해당 스크립트의 프로덕션 버전입니다.

## 빠른 시작

```bash
npm install --save-dev i18n-rosetta
```

### API 키 받기

Rosetta는 번역 백엔드가 필요합니다. 하나를 선택하십시오:

| 제공업체 | 키 | 가장 적합한 용도 |
|----------|-----|----------|
| **OpenRouter** (권장) | `OPENROUTER_API_KEY` | 콘텐츠 중심 프로젝트, Markdown, 200개 이상의 모델 |
| **OpenAI** | `OPENAI_API_KEY` | GPT-4o 직접 액세스 |
| **Anthropic** | `ANTHROPIC_API_KEY` | Claude 직접 액세스 |
| **Gemini** | `GEMINI_API_KEY` | 무료 등급 사용 가능 |
| **DeepL** | `DEEPL_API_KEY` | 유럽 언어, 용어집 지원 |
| **Google Translate** | `GOOGLE_TRANSLATE_API_KEY` | 130개 이상의 언어, 대량 |

**가장 빠른 시작** (무료): [aistudio.google.com](https://aistudio.google.com/apikey)에서 무료 Gemini 키를 신청하십시오:

```bash
export GEMINI_API_KEY=AI...
npx i18n-rosetta sync --method gemini
```

**OpenRouter** (200개 이상의 모델): [openrouter.ai](https://openrouter.ai)에서 가입한 다음:

```bash
export OPENROUTER_API_KEY=sk-or-v1-...
npx i18n-rosetta sync
```

**Google Translate** 대안 (키-값 쌍만 해당 — Markdown 인식 없음):

```bash
export GOOGLE_TRANSLATE_API_KEY=...
npx i18n-rosetta sync --method google-translate
```

> **참고**: `GOOGLE_TRANSLATE_API_KEY`만 설정된 경우, rosetta는 자동으로 Google 번역으로 전환됩니다. 구성 변경이 필요 없습니다. REST API를 직접 사용합니다. SDK, 서비스 계정, `pip install`가 필요 없습니다. 키만 있으면 됩니다.

그것이 전부입니다. 더 많은 제어를 위해 구성 파일을 생성하십시오:

```bash
npx i18n-rosetta init                        # guided wizard — walks you through registers, methods, and content
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific languages and default registers
```

각 언어에는 **레지스터 프리셋**이 함께 제공됩니다. 이는 언어 시스템에 맞춰 조정된 미리 빌드된 톤/정중함 지침입니다(프랑스어의 vouvoiement, 독일어의 Siezen, 일본어의 です/ます, 한국어의 해요체). 초기화 마법사를 통해 프리셋을 탐색하고 선택하거나 `--yes`를 전달하여 기본값을 수락할 수 있습니다.

### 비영어 소스

소스 언어가 영어가 아닌 경우:

```bash
i18n-rosetta sync --source fr                      # CLI flag
```

또는 구성에 영구적으로 설정하십시오:

```json
{ "inputLocale": "fr" }
```

## 기능

i18n 프레임워크(next-intl, i18next, Hugo)는 귀하가 처리합니다. Rosetta는 번역 파일을 처리합니다.

- **다중 형식** — JSON, TOML, YAML 및 Hugo Markdown(프론트 매터 + 본문)
- **점진적** — 변경된 내용만 번역합니다(SHA-256 해시 추적)
- **품질 게이트(Quality-gated)** — 모든 번역의 유효성을 검사합니다: 환각, 잘못된 스크립트 출력, 소스 에코 및 길이 팽창을 감지합니다.
- **콘텐츠 인식** — LLM 메서드는 Markdown 번역 중 코드 블록, 쇼트코드, 링크 및 보간 변수를 보호합니다.
- **파이프라인 도구** — CI 게이트를 위한 `lint`, `audit`, `integrity`, `seo`
- **제로 종속성** — Node.js 내장 기능만 사용합니다. SDK, 네이티브 모듈이 없습니다. Node 20+가 필요합니다.

## Google 번역 이상

빠른 시작은 LLM 또는 Google 번역으로 시작할 수 있도록 합니다. 그러나 Google 번역은 약 130개 언어를 지원합니다. 7,000개 이상의 언어가 있습니다.

**Rosetta의 핵심 아이디어: 번역 방법은 언어 쌍별로 구성 가능합니다.** 프랑스어에는 Google 번역을 사용하고, 평원 크리어(Plains Cree)에는 형태학적 코칭이 포함된 LLM을 사용하며, 케추아어(Quechua)에는 커뮤니티 호스팅 API를 사용합니다. 이 모든 것이 동일한 프로젝트에서 동일한 CLI로 이루어집니다.

```json
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "google-translate" },
    "en:ja": { "method": "llm" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

프롬프트 엔지니어링, 커뮤니티 사전, FST 파이프라인 또는 미세 조정된 모델을 통해 언어 쌍을 번역하는 방법을 알아낼 수 있다면, rosetta를 통해 해당 방법을 플러그인으로 패키징하고 다른 모든 것과 함께 배포할 수 있습니다.

> 상용 API가 없는 평원 크리어(Plains Cree)로 프로덕션 웹사이트를 번역하는 과정에서 탄생했습니다. 쌍별 아키텍처는 이론적인 것이 아닙니다. 한 프로젝트에서 프랑스어에 Google 번역이 필요하고 원주민 언어에 코칭된 FST 파이프라인이 필요하여 동일한 동기화 명령에서 나란히 실행되었기 때문에 존재합니다.

동반되는 [MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness)를 통해 번역 접근 방식을 벤치마킹하고 비교한 다음, 작동하는 방법을 rosetta 플러그인으로 내보낼 수 있습니다. 두 언어를 모두 구사하는 사람이라면 누구나 번역 방법을 개발, 테스트 및 공유할 수 있습니다. 독점 플랫폼이 필요 없습니다.

### 방법 선택

Rosetta는 10가지 번역 방법을 지원합니다. 각 언어 쌍은 다른 방법을 사용할 수 있습니다.

**LLM 제공업체** — 품질, Markdown 인식, 코칭 호환성에 가장 적합합니다:

| 방법 | 키 | 기능 |
|--------|-----|-------------|
| `llm` (기본값) | `OPENROUTER_API_KEY` | OpenRouter를 통한 LLM — 200개 이상의 모델, 자동 라우팅 |
| `llm-coached` | `OPENROUTER_API_KEY` | LLM + 문법 규칙, 사전, 스타일 노트 |
| `openai` | `OPENAI_API_KEY` | 직접 OpenAI API (gpt-4o, gpt-4o-mini) |
| `anthropic` | `ANTHROPIC_API_KEY` | 직접 Anthropic API (Claude Sonnet, Haiku, Opus) |
| `gemini` | `GEMINI_API_KEY` | 직접 Google Gemini API (Flash, Pro) — 무료 등급 사용 가능 |

**기존 MT** — 속도, 비용 및 대량 키-값 쌍에 가장 적합합니다:

| 방법 | 키 | 기능 |
|--------|-----|-------------|
| `google-translate` | `GOOGLE_TRANSLATE_API_KEY` | Google Cloud Translation API v2 (130개 이상의 언어) |
| `deepl` | `DEEPL_API_KEY` | 용어집 지원 DeepL API (30개 이상의 언어) |
| `microsoft-translator` | `MICROSOFT_TRANSLATOR_API_KEY` | Azure Cognitive Services Translator (100개 이상의 언어) |
| `libretranslate` | *(자체 호스팅)* | 자체 호스팅 LibreTranslate (AGPL, 무료) |

**인프라** — 사용자 지정 또는 커뮤니티 호스팅 엔드포인트용:

| 방법 | 키 | 기능 |
|--------|-----|-------------|
| `api` | *(제공업체별)* | 모든 REST 엔드포인트를 위한 씬 HTTP 클라이언트 |

```bash
# Force a specific method for one run
i18n-rosetta sync --method deepl

# Or configure per pair
```

```json
{
  "pairs": {
    "en:fr": { "method": "deepl" },
    "en:ja": { "method": "openai", "model": "gpt-4o" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

> **참고**: 기존 MT 방법(Google 번역, DeepL, Microsoft Translator, LibreTranslate)은 키-값 쌍을 잘 처리하지만 Markdown 콘텐츠를 안전하게 번역할 수 없습니다. 콘텐츠 중심 프로젝트의 경우 LLM 방법을 권장합니다. LLM 방법은 코드 블록, 쇼트코드 및 보간 변수를 명시적으로 보호합니다.

## 플러그인

플러그인은 특정 언어 쌍을 위한 미리 패키징된 번역 레시피입니다. 코드가 아닌 JSON 매니페스트로, rosetta에 어떤 방법을 어떤 설정으로 사용할지, 어떤 품질이 벤치마킹되었는지 알려줍니다.

```bash
i18n-rosetta plugin install ./french-formal-v1/    # install from directory
i18n-rosetta plugin list                           # see installed plugins
i18n-rosetta plugin remove french-formal-v1        # uninstall
i18n-rosetta status                                # shows quality tiers + benchmarks
```

매니페스트 형식은 [docs/METHOD_PLUGIN_SPEC.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/METHOD_PLUGIN_SPEC.md)를 참조하십시오.

## 명령

| 명령 | 목적 |
|---------|---------|
| `init` | 대화형 설정 마법사 (또는 빠른 기본값을 위한 `--yes`) |
| `sync` | 모든 로케일 파일 번역 및 동기화 |
| `watch` | 파일 변경 시 자동 동기화 |
| `audit` | 불완전한 로케일 플래그 지정 (CI 게이트) |
| `lint` | 소스 코드에서 하드코딩된 문자열 찾기 |
| `wrap` | `t()` 호출에서 하드코딩된 문자열 자동 래핑 (실행 취소 포함) |
| `seo` | hreflang, sitemap.xml 또는 JSON-LD 스키마 생성 |
| `integrity` | 플레이스홀더 손상 및 인코딩 문제 확인 |
| `status` | 쌍 구성, 메서드, 레지스터 및 품질 계층 표시 |
| `provenance` | 번역 리소스 라이선스 감사 |
| `plugin` | 메서드 플러그인 설치, 제거 또는 나열 |

모든 명령에 대한 자세한 도움말은 `i18n-rosetta <command> --help`를 실행하십시오.

전체 참조: [docs/CLI_REFERENCE.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/CLI_REFERENCE.md)

## 구성

`i18n-rosetta.config.json`를 생성하거나 `i18n-rosetta init`를 실행하십시오:

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "model": "google/gemini-3.5-flash",
  "pairs": {
    "en:fr": { "qualityTier": "high" },
    "en:ja": { "method": "google-translate" }
  }
}
```

| 옵션 | 기본값 | 설명 |
|--------|---------|-------------|
| `inputLocale` | `"en"` | 소스 언어 코드 |
| `localesDir` | `"./locales"` | 로케일 파일 경로 |
| `contentDir` | `null` | Hugo 콘텐츠 디렉토리 (Markdown 번역 활성화) |
| `format` | `"auto"` | 파일 형식: `json`, `toml`, `yaml` 또는 `auto` |
| `model` | `"google/gemini-3.5-flash"` | 기본 OpenRouter 모델 |
| `defaultMethod` | `"llm"` | 기본 번역 방법 (`--method` 플래그로 재정의됨) |
| `batchSize` | `30` | 번역 배치당 키 수 |
| `pairs` | `{}` | 쌍별 방법, 모델 및 품질 재정의 |

**언어별 재정의**: 각 언어에는 정중함 시스템에 맞춰 조정된 미리 설정된 레지스터가 포함된 [언어 카드](docs/planning/LANGUAGE_CARD_SPEC.md)가 있습니다. 미리 설정된 키를 약어로 사용하거나 사용자 지정 레지스터 텍스트를 작성하십시오:

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "crk": {
      "name": "Plains Cree",
      "register": "SRO syllabics with grammatical precision.",
      "model": "google/gemini-2.5-pro",
      "batchSize": 5,
      "maxRetries": 5,
      "script": "cans"
    }
  }
}
```

**제로 구성 모드**: 구성 파일이 없습니까? Rosetta는 프로젝트에서 로케일 파일, 형식 및 대상 언어를 자동으로 감지합니다.

언어 값은 미리 설정된 키(예: `"casual-tu"`), 사용자 지정 레지스터 텍스트 또는 객체(완전 제어)일 수 있습니다. `pairs`의 쌍 수준 재정의는 언어 수준 설정보다 우선합니다. 각 언어에 사용 가능한 미리 설정된 값을 탐색하려면 `npx i18n-rosetta init`를 실행하십시오.

프레임워크 설정 가이드: [docs/INTEGRATION_GUIDES.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/INTEGRATION_GUIDES.md)

## 강화

- **지수 백오프** — 429/5xx 오류 시 지터가 있는 3회 재시도
- **30초 요청 시간 초과** — AbortController는 중단을 방지합니다.
- **응답 유효성 검사** — 번역을 위해 전송된 키만 허용합니다.
- **품질 게이트(Quality gate)** — 환각 루프, 잘못된 스크립트 출력, 길이 팽창 및 소스 에코를 감지합니다.
- **재시도 캐스케이드** — JSON 구문 분석 실패 시 배치 → 절반 배치 → 개별 키를 재시도합니다(`maxRetries`를 통해 예산 제한).
- **프롬프트 캐싱** — 시스템/사용자 메시지 분할은 제공업체 수준 캐싱을 가능하게 하여 배치 전반에 걸쳐 토큰 비용을 줄입니다.
- **프로토타입 오염 방지** — `__proto__`, `constructor`, `prototype` 차단
- **경로 포함** — 구성된 디렉토리 내에 파일 쓰기 유효성 검사
- **블록 보호** — 콘텐츠 번역 중 코드 블록, 쇼트코드, HTML 보호
- **명시적 폴백** — `--fallback`는 API를 사용할 수 없을 때 `[EN]` 접두사가 붙은 플레이스홀더를 작성합니다(실제 번역을 위해 키로 다시 동기화).
- **부분 성공** — 하나의 실패한 배치가 나머지를 차단하지 않습니다.

## 테스트

```bash
npm test                         # all tests
npm run test:unit                # core sync pipeline
npm run test:redteam             # adversarial edge cases
npm run test:format              # TOML/YAML adapters
npm run test:content             # Markdown content parser
npm run test:hugo                # full Hugo E2E
npm run test:lint                # hardcoded string detection
npm run test:pairs               # pair graph resolution
npm run test:methods             # translation method suite
```

**제로 종속성.**

## 라이선스

MIT