---
sidebar_position: 2
title: "빠른 시작"
---
# 빠른 시작

60초 만에 첫 번째 locale 파일을 번역해 보세요.

## 1. Locale 파일 설정하기

소스 locale 파일을 생성하세요. Rosetta는 JSON, TOML, YAML을 지원해요:

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

제공자(provider)를 선택하고 키를 설정하세요:

```bash
# Option A: OpenRouter (200+ models, recommended)
export OPENROUTER_API_KEY=sk-or-v1-...

# Option B: Gemini (free tier — zero cost to start)
export GEMINI_API_KEY=AI...
```

[aistudio.google.com/apikey](https://aistudio.google.com/apikey)에서 무료 Gemini 키를 받으세요. [openrouter.ai](https://openrouter.ai)에서 OpenRouter 키를 받을 수 있어요.

## 3. 동기화(Sync) 실행하기

```bash
npx i18n-rosetta sync
```

:::tip Gemini를 사용하시나요?
옵션 B(Gemini)를 선택했다면, `--method gemini`을 추가하세요:
```bash
npx i18n-rosetta sync --method gemini
```
:::

Rosetta는 다음과 같이 작동해요:
1. `locales/en.json`를 소스로 자동 감지해요
2. 대상 언어를 찾거나 입력하도록 요청해요
3. 모든 키를 번역해요
4. `locales/fr.json`, `locales/ja.json` 등을 작성해요
5. 번역된 내용을 추적하기 위해 `.i18n-rosetta.lock`를 생성해요

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

소스 문자열을 변경하면, Rosetta는 SHA-256 해시 추적을 통해 변경 사항을 감지하고 다음 동기화 시 해당 키만 다시 번역해요:

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

## 선택 사항: Config 파일 생성하기

더 세밀하게 제어하려면 config 파일을 생성하세요:

```bash
npx i18n-rosetta init                         # guided wizard
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific targets
```

안내 마법사가 각 언어의 언어 체계에 맞춰 미리 구성된 어조/격식 지침인 **register presets(어체 프리셋)**을 설정하도록 도와줘요. 프랑스어에는 T-V 프리셋(vouvoiement vs tutoiement), 한국어에는 높임말 수준(해요체 vs 합쇼체 vs 해체), 일본어에는 경어 옵션(です/ます vs 丁寧語)이 있어요.

또는 프리셋 키를 사용하여 수동으로 config를 생성할 수도 있어요:

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

각 언어에서 사용할 수 있는 프리셋을 확인하려면 `npx i18n-rosetta init`을 실행하세요.

## 선택 사항: Watch 모드

소스 파일이 변경될 때 자동으로 번역해요:

```bash
npx i18n-rosetta watch
```

## 다음 단계

- **[Configuration](/docs/getting-started/configuration)** — 전체 config 레퍼런스
- **[Translation Methods](/docs/guides/translation-methods)** — 알맞은 번역 방법 선택하기
- **[Framework Integration](/docs/guides/framework-integration)** — Hugo, next-intl, react-i18next 연동
- **[CI/CD](/docs/guides/ci-cd)** — 파이프라인에서 번역 자동화하기