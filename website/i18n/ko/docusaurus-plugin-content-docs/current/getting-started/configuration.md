---
sidebar_position: 3
title: "설정"
---
# 설정

Rosetta는 설정 없이(zero-config) 작동해요. 프로젝트에서 로케일 파일, 형식, 대상 언어를 자동으로 감지하거든요. 더 세밀하게 제어하려면 프로젝트 루트에 `i18n-rosetta.config.json`을 생성하거나 다음 명령어를 실행하세요.

```bash
npx i18n-rosetta init
```

## 전체 설정 참조

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "contentDir": null,
  "translatableFields": null,
  "format": "auto",
  "model": "google/gemini-3.5-flash",
  "defaultMethod": "llm",
  "batchSize": 30,
  "fallbackPrefix": "[EN] ",
  "apiKeyEnvVar": "OPENROUTER_API_KEY",
  "baseUrl": "",
  "pairs": {},
  "languages": {},
  "lint": {
    "srcDir": null,
    "ignore": ["node_modules", ".next", "dist"],
    "minLength": 2
  },
  "seo": {
    "urlPattern": "/:locale/:path",
    "pages": null
  },
  "typegen": {
    "output": null,
    "autoGenerate": false
  }
}
```

:::note typegen은 아직 구현되지 않았어요
설정 로더가 `typegen` 설정 블록을 인식하고 유지하지만, TypeScript 타입 생성은 아직 구현되지 않았어요. 이는 향후 계획된 기능을 위한 자리 표시자(placeholder)예요. 이 값을 설정해도 아무런 효과가 없어요.
:::


### 필드

| 필드 | 타입 | 기본값 | 설명 |
|-------|------|---------|-------------|
| `version` | `number` | `3` | 설정 스키마 버전이에요. 항상 `3`이어야 해요. |
| `inputLocale` | `string` | `"en"` | 소스 언어 코드예요 (BCP 47). |
| `localesDir` | `string` | `"./locales"` | 로케일 파일 경로예요. Rosetta가 이 디렉터리를 스캔해요. |
| `contentDir` | `string` | `null` | Hugo 콘텐츠 디렉터리예요. Markdown 본문 번역을 활성화해요. |
| `translatableFields` | `string[]` | `null` | 콘텐츠 번역 시 번역 가능한 기본 frontmatter 필드를 재정의해요. `null`은 내장된 기본값(`title`, `description`, `summary`)을 사용해요. |
| `format` | `string` | `"auto"` | 파일 형식이에요. `json`, `toml`, `yaml`, 또는 `auto` (확장자에서 감지) 중 하나를 사용해요. |
| `model` | `string` | `"google/gemini-3.5-flash"` | LLM 방식의 기본 모델이에요. 형식은 방식에 따라 달라요. OpenRouter는 `provider/model` 형식을 사용하고(예: `google/gemini-3.5-flash`), 직접 제공자는 기본 이름만 사용해요(예: `gpt-4o`, `gemini-2.5-flash`). |
| `defaultMethod` | `string` | `"llm"` | 기본 번역 방식이에요. `llm`, `llm-coached`, `google-translate`, `deepl`, `microsoft-translator`, `libretranslate`, `openai`, `anthropic`, `gemini`, `api` 중 하나를 선택해요. `--method` CLI 플래그로 재정의할 수 있어요. |
| `batchSize` | `number` | `30` | 번역 배치당 키 개수예요. 높을수록 API 호출은 줄어들지만 프롬프트 크기는 커져요. |
| `fallbackPrefix` | `string` | `"[EN] "` | 번역되지 않은 대체(fallback) 값에 추가되는 접두사예요. `audit`에서 불완전한 번역을 감지하는 데 사용해요. |
| `apiKeyEnvVar` | `string` | `"OPENROUTER_API_KEY"` | API 키의 환경 변수 이름이에요. 사용자 지정 환경 변수 이름을 사용할 때 재정의해요. |
| `baseUrl` | `string` | `""` | SEO 아티팩트(hreflang, 사이트맵, JSON-LD) 생성을 위한 기본 URL이에요. |
| `pairs` | `object` | `{}` | 언어 쌍별 방식, 모델, 품질 재정의 설정이에요. [언어 쌍 설정](#pair-configuration)을 참고하세요. |
| `languages` | `object` | `{}` | 언어별 재정의 설정이에요. [언어 설정](#language-configuration)을 참고하세요. |
| `lint.srcDir` | `string` | `null` | 린트(lint) 스캔을 위한 소스 디렉터리예요. `null`은 프레임워크에서 자동 감지함을 의미해요. |
| `lint.ignore` | `string[]` | `["node_modules", ...]` | 린트에서 제외할 Glob 패턴이에요. |
| `lint.minLength` | `number` | `2` | 하드코딩된 것으로 표시할 최소 문자열 길이예요. |
| `seo.urlPattern` | `string` | `"/:locale/:path"` | hreflang 태그 생성을 위한 URL 패턴 템플릿이에요. |
| `seo.pages` | `string[]` | `null` | SEO를 위한 명시적 페이지 목록이에요. `null`은 로케일 키에서 자동 감지함을 의미해요. |
| `typegen.output` | `string` | `null` | 생성된 TypeScript 타입의 출력 경로예요. `null`은 비활성화를 의미해요. |
| `typegen.autoGenerate` | `boolean` | `false` | 동기화할 때마다 타입을 자동으로 다시 생성해요. |

## 언어 쌍 설정

각 소스→대상 언어 쌍을 독립적으로 설정할 수 있어요.

```json
{
  "pairs": {
    "en:fr": {
      "method": "google-translate",
      "qualityTier": "high"
    },
    "en:ja": {
      "method": "llm",
      "model": "google/gemini-2.5-pro"
    },
    "en:crk": {
      "methodPlugin": "crk-coached-v1"
    }
  }
}
```

### 언어 쌍 필드

| 필드 | 타입 | 설명 |
|-------|------|-------------|
| `method` | `string` | 번역 방식이에요. `llm`, `llm-coached`, `google-translate`, `deepl`, `microsoft-translator`, `libretranslate`, `openai`, `anthropic`, `gemini`, `api` 중 하나를 사용해요. |
| `methodPlugin` | `string` | 설치된 플러그인 이름이에요 (`.rosetta/methods/`에서 가져옴). |
| `model` | `string` | 이 언어 쌍의 기본 모델을 재정의해요. |
| `endpoint` | `string` | 원격 API 엔드포인트 URL이에요. `method`이 `api`일 때 필수예요. |
| `qualityTier` | `string` | 표시 등급(tier)이에요. `standard`, `high`, `research`, `verified` 중 하나를 사용해요. |

## 언어 설정

언어 설정은 세 가지 형식을 지원해요.

### 코드 배열 (가장 간단한 방식)

```json
{
  "languages": ["fr", "de", "ja"]
}
```

각 언어는 내장된 어조(register) 테이블에서 기본 어조를 가져와요. 기본값이 없는 언어는 `"Professional register."`을 사용해요.

### 어조 문자열이 포함된 객체

값은 언어 카드의 **프리셋 키**이거나 사용자 지정 어조 텍스트일 수 있어요.

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "Custom: Polite Japanese for a gaming app."
  }
}
```

Rosetta는 문자열이 언어 카드의 프리셋 키와 일치하는지 확인해요. 일치하면 카드의 전체 어조 프롬프트를 사용하고, 그렇지 않으면 문자열을 그대로 사용해요. 사용 가능한 프리셋은 [지원 언어](/docs/reference/supported-languages#language-cards)를 참고하세요.

### 전체 설정이 포함된 객체

```json
{
  "languages": {
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

같은 블록 내에서 약식과 전체 객체를 섞어서 사용할 수 있어요.


### 언어 필드

| 필드 | 타입 | 설명 |
|-------|------|-------------|
| `register` | `string` | 스타일/어조 지침이에요. **프리셋 키**(예: `casual-tu`, `formal-hapsyo`) 또는 사용자 지정 텍스트일 수 있어요. [언어 카드](/docs/reference/supported-languages#language-cards)를 참고하세요. |
| `name` | `string` | 사람이 읽을 수 있는 언어 이름이에요 (상태 표시용). |
| `model` | `string` | 기본 모델을 재정의해요. |
| `batchSize` | `number` | 기본 배치 크기를 재정의해요. |
| `maxRetries` | `number` | 실패한 배치에 대한 최대 재시도 횟수예요 (기본값: 3). |
| `script` | `string` | ISO 15924 문자(script) 코드예요. 품질 게이트(quality gate)에서 문자 유효성 검사를 트리거해요. |

:::info 상속 체인
설정은 다음 순서로 적용돼요 (먼저 설정된 값이 우선해요).

**언어 쌍 수준** → **언어 수준** → **전역 설정** → **기본값**

예를 들어 `pairs["en:fr"]`에서 `model`을 설정하면, 언어 수준과 전역 `model` 값을 모두 덮어써요.
:::

## 영어가 아닌 소스 언어

소스 언어가 영어가 아닌 경우:

```bash
# CLI flag (one-time)
npx i18n-rosetta sync --source fr
```

```json title="i18n-rosetta.config.json (permanent)"
{
  "inputLocale": "fr"
}
```

## 잠금 파일 (Lock File)

Rosetta는 번역된 소스 값의 SHA-256 해시를 추적하기 위해 `.i18n-rosetta.lock` 파일을 생성해요. 모든 개발자가 동일한 번역 기준선을 공유할 수 있도록 **이 파일을 커밋해 주세요**.

소스 값이 변경되면 해시가 더 이상 일치하지 않게 되고, Rosetta는 다음 동기화 때 해당 키를 다시 번역해요.

## `.rosettaignore`

`lint` 스캔에서 파일을 제외하려면 프로젝트 루트에 `.rosettaignore` 파일을 생성하세요. `.gitignore`처럼 glob 패턴을 사용해요.

```text title=".rosettaignore"
src/components/legacy/**
src/utils/constants.js
**/*.test.js
```

---

## 프로그래밍 방식 API

빌드 스크립트나 사용자 지정 연동을 위해 패키지에서 직접 가져올 수 있어요.

```javascript
import { GeminiMethod, runSync, resolveConfig } from 'i18n-rosetta';

// Use a method class directly
const gemini = new GeminiMethod();
const result = await gemini.translate(
  ['greeting', 'farewell'],
  { greeting: 'Hello', farewell: 'Goodbye' },
  { target: 'fr', name: 'French', register: 'formal', model: 'gemini-2.5-flash' },
  { cwd: process.cwd() }
);
// result = { greeting: 'Bonjour', farewell: 'Au revoir' }
```

### 사용 가능한 내보내기(Exports)

| 내보내기 | 기능 |
|--------|-------------|
| `TranslationMethod` | 모든 방식의 기본 클래스예요. |
| `LLMMethod` | LLM 방식(OpenRouter)의 기본 클래스예요. |
| `DirectLLMMethod` | 직접 LLM 제공자(OpenAI, Anthropic, Gemini)의 기본 클래스예요. |
| `OpenAIMethod`, `AnthropicMethod`, `GeminiMethod` | 직접 LLM 제공자 클래스예요. |
| `DeepLMethod`, `MicrosoftTranslatorMethod`, `LibreTranslateMethod` | 전통적인 기계 번역(MT) 클래스예요. |
| `GoogleTranslateMethod` | Google Cloud Translation이에요. |
| `LLMCoachedMethod` | 코칭된 LLM(OpenRouter + 코칭 데이터)이에요. |
| `APIMethod` | 원격 API 클라이언트예요. |
| `runSync`, `runContentSync` | 전체 동기화 파이프라인이에요. |
| `resolveConfig`, `resolvePairs` | 설정 해석(resolution)이에요. |
| `validateTranslations` | 품질 게이트예요. |
| `loadCoachingData`, `findDictionaryMatches` | 코칭 유틸리티예요. |

### 사용자 지정 제공자 확장

`DirectLLMMethod`을 확장하면 약 40줄의 코드로 새로운 LLM 제공자를 추가할 수 있어요.

```javascript
import { DirectLLMMethod } from 'i18n-rosetta';

class MistralMethod extends DirectLLMMethod {
  constructor(options) {
    super(options);
    this.name = 'mistral';
  }
  _getApiKeyEnvVar()     { return 'MISTRAL_API_KEY'; }
  _getApiKeyOptionsKey() { return 'mistralApiKey'; }
  _getDefaultModel()     { return 'mistral-large-latest'; }
  _getProviderLabel()    { return 'Mistral'; }

  _buildApiRequest({ prompt, systemMessage, apiKey, model, temperature }) {
    return {
      url: 'https://api.mistral.ai/v1/chat/completions',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: {
        model,
        messages: [
          ...(systemMessage ? [{ role: 'system', content: systemMessage }] : []),
          { role: 'user', content: prompt },
        ],
        temperature,
      },
    };
  }

  _extractResponseText(json) {
    return json.choices?.[0]?.message?.content;
  }

  // Optional but recommended: provider-specific setup help when translation fails
  getSetupHelp() {
    if (!process.env.MISTRAL_API_KEY) {
      return [
        '',
        '  ┌─ Missing API Key ─────────────────────────────────────────────┐',
        '  │ Mistral requires an API key from https://console.mistral.ai   │',
        '  │ Run: export MISTRAL_API_KEY=...                               │',
        '  └────────────────────────────────────────────────────────────────┘',
      ];
    }
    return ['        API key is set but translation failed. Check your Mistral dashboard.'];
  }
}
```

번역, 코칭, 재시도 루프, 모델 유효성 검사, 품질 등급, 설정 도움말 기능을 기본으로 제공받을 수 있어요. HTTP 요청 형태만 제공자별로 다르게 구현하면 돼요. 원시 `fetch()`를 사용하는 비 LLM 어댑터의 경우, 자체 재시도 루프를 작성하는 대신 `lib/methods/fetch-with-retry.js`의 공유 `fetchWithRetry()` 헬퍼를 사용하세요.

---

## 참고 자료

- [CLI 참조](/docs/reference/cli) — 모든 명령어와 플래그
- [번역 방식](/docs/guides/translation-methods) — 방식 선택 및 혼합
- [플러그인 사양](/docs/reference/plugin-spec) — 방식 플러그인 매니페스트 형식
- [아키텍처](/docs/concepts/architecture) — 구성 요소 연결 방식
- [지원 언어](/docs/reference/supported-languages) — 내장된 언어 지원
- [동기화 작동 방식](/docs/concepts/how-sync-works) — 번역 파이프라인