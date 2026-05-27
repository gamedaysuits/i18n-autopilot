---
sidebar_position: 2
title: "빠른 시작"
---
# 빠른 시작

60초 만에 첫 번째 로케일 파일을 번역해 보세요.

## 1. 로케일 파일 설정하기

소스 로케일 파일을 생성해 주세요. Rosetta는 JSON, TOML, YAML을 지원해요:

```json title="locales/en.json"
{
  "hero": {
    "title": "Welcome to our platform",
    "subtitle": "Build something amazing"
  },
  "nav": {
    "home": "Home",
    "about": "About",
    "contact": "Contact"
  }
}
```

## 2. API 키 설정하기

제공자(provider)를 선택하고 키를 설정해 주세요:

```bash
# Option A: OpenRouter (200+ models, recommended)
export OPENROUTER_API_KEY=sk-or-v1-...

# Option B: Gemini (free tier — zero cost to start)
export GEMINI_API_KEY=AI...
```

[aistudio.google.com/apikey](https://aistudio.google.com/apikey)에서 무료 Gemini 키를 받아보세요. OpenRouter 키는 [openrouter.ai](https://openrouter.ai)에서 받을 수 있어요.

## 3. 동기화(Sync) 실행하기

```bash
npx i18n-rosetta sync
```

:::tip Gemini를 사용하시나요?
옵션 B(Gemini)를 선택했다면, `--method gemini`를 추가해 주세요:
```bash
npx i18n-rosetta sync --method gemini
```
:::

Rosetta는 다음과 같이 작동해요:
1. `locales/en.json`를 소스로 자동 감지해요.
2. 타겟 언어를 찾거나 입력하도록 요청해요.
3. 모든 키를 번역해요.
4. `locales/fr.json`, `locales/ja.json` 등을 작성해요.
5. 번역된 항목을 추적하기 위해 `.i18n-rosetta.lock`를 생성해요.

## 4. 결과 확인하기

```bash
cat locales/fr.json
```

```json
{
  "hero": {
    "title": "Bienvenue sur notre plateforme",
    "subtitle": "Construisez quelque chose d'incroyable"
  },
  "nav": {
    "home": "Accueil",
    "about": "À propos",
    "contact": "Contact"
  }
}
```

## 다음은 어떻게 되나요?

소스 문자열을 변경하면, rosetta는 SHA-256 해시 추적을 통해 변경 사항을 감지하고 다음 번 동기화 시 해당 키만 다시 번역해요:

```json title="locales/en.json (updated)"
{
  "hero": {
    "title": "Welcome to Acme Platform",  // ← changed
    "subtitle": "Build something amazing"  // ← unchanged, skipped
  }
}
```

```bash
npx i18n-rosetta sync
# Only "hero.title" is re-translated across all locales
```

변경되지 않은 키(`hero.subtitle`)는 rosetta의 **Translation Memory** 캐시에서 제공되므로 API 호출이나 비용이 발생하지 않아요. 캐시는 매 동기화마다 자동으로 생성되며 `.rosetta/tm.json`에 저장돼요.

## 선택 사항: 설정 파일 생성하기

더 세밀하게 제어하려면 설정 파일을 생성해 보세요:

```bash
npx i18n-rosetta init                         # guided wizard
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific targets
```

가이드 마법사가 각 언어의 **register presets**(언어 체계에 맞게 사전 구축된 어조/격식 지침) 설정을 도와드려요. 프랑스어에는 T-V 프리셋(vouvoiement vs tutoiement), 한국어에는 높임말 수준(해요체 vs 합쇼체 vs 해체), 일본어에는 경어 옵션(です/ます vs 丁寧語)이 있어요.

또는 프리셋 키를 사용하여 수동으로 설정을 생성할 수도 있어요:

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "languages": {
    "fr": "casual-tu",
    "ko": "polite-haeyo",
    "ja": "polite"
  },
  "model": "google/gemini-2.5-flash"
}
```

`npx i18n-rosetta init`를 실행하여 각 언어에서 사용할 수 있는 프리셋을 확인해 보세요.

## 선택 사항: Watch 모드

소스 파일이 변경될 때 자동으로 번역해 보세요:

```bash
npx i18n-rosetta watch
```

## 다음 단계

- **[설정](/docs/getting-started/configuration)** — 전체 설정 레퍼런스
- **[번역 방식](/docs/guides/translation-methods)** — 언어 쌍에 맞는 올바른 방식 선택하기
- **[Translation Memory](/docs/concepts/translation-memory)** — 캐싱을 통해 재실행 비용을 절약하는 방법
- **[전문 번역가와 협업하기](/docs/guides/professional-translators)** — 사람의 검토를 위해 XLIFF 내보내기
- **[프레임워크 통합](/docs/guides/framework-integration)** — Hugo, next-intl, react-i18next
- **[CI/CD](/docs/guides/ci-cd)** — 파이프라인에서 번역 자동화하기
- **[문제 해결](/docs/guides/troubleshooting)** — 일반적인 문제 및 해결 방법