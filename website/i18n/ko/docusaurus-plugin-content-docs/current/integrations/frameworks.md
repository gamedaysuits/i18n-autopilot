# 연동 가이드

인기 있는 프레임워크와 i18n-rosetta를 연동하기 위한 단계별 설정 방법이에요.

---

## API 키 설정

프레임워크와 연동하기 전에 번역 API 키가 필요해요. Rosetta는 두 가지 프로바이더를 지원해요:

### 옵션 A: OpenRouter (권장)

[OpenRouter](https://openrouter.ai)는 200개 이상의 LLM 모델을 위한 통합 API를 제공해요. 무료 티어도 이용할 수 있어요.

```bash
# Sign up at https://openrouter.ai, then:
export OPENROUTER_API_KEY=sk-or-v1-...

# Or add to .env.local:
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

추천 대상: 콘텐츠가 많은 프로젝트, Markdown 번역, 그리고 콘텐츠 인식 보호(코드 블록, 숏코드, 보간 변수)가 필요한 프로젝트에 적합해요.

### 옵션 B: Google Translate

```bash
export GOOGLE_TRANSLATE_API_KEY=...
```

추천 대상: 대량의 키-값 문자열 쌍(130개 이상의 언어)에 적합해요. Markdown 콘텐츠에는 **권장하지 않아요** — Google Translate는 코드 블록, 숏코드 또는 보간 변수를 인식하지 못해요.

Google Translate를 명시적으로 사용하려면 다음과 같이 설정해 주세요:

```bash
i18n-rosetta sync --method google-translate
```

> **팁**: `GOOGLE_TRANSLATE_API_KEY`만 설정되어 있고 OpenRouter 키가 없다면, rosetta는 자동으로 Google Translate로 전환해요.

---

## Hugo (TOML / YAML / Markdown)

### 프로젝트 구조

Hugo는 문자열 번역에 `i18n/`를 사용하고 페이지 콘텐츠에 `content/`을 사용해요:

```
my-hugo-site/
├── i18n/
│   ├── en.toml             ← source of truth
│   ├── fr.toml
│   └── ja.toml
├── content/
│   ├── posts/
│   │   ├── hello.md        ← source (English)
│   │   ├── hello.fr.md
│   │   └── hello.ja.md
│   └── about.md
└── .env.local
```

### 설정

```bash
npm install --save-dev i18n-rosetta
```

```bash
# .env.local
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

`i18n-rosetta.config.json` 파일을 생성해 주세요:

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./i18n",
  "contentDir": "./content",
  "format": "auto",
  "languages": ["fr", "de", "ja", "es", "ko", "zh"]
}
```

```bash
i18n-rosetta sync           # sync i18n string files + content files
i18n-rosetta sync --dry     # preview changes without writing
```

### 콘텐츠 번역 상세 정보

**Front matter**: YAML(`---`) 및 TOML(`+++`) 구분자를 모두 지원해요. 기본적으로 `title`, `description`, `summary`, `subtitle`, `caption`, `linkTitle`를 번역해요. 다른 모든 필드(date, draft, tags, weight, slug 등)는 그대로 유지돼요. 설정 파일의 `translatableFields`을 통해 커스터마이징할 수 있어요.

**블록 보호**: 코드 블록, Hugo 숏코드(`{{< >}}`, `{{% %}}`), 인라인 코드 및 원시 HTML은 유니코드 센티널(sentinel) 자리 표시자를 사용하여 자동으로 보호돼요. 이 부분들은 변경되지 않고 그대로 통과돼요.

**파일 이름 규칙**: Hugo의 파일 이름 기반 번역 패턴을 따라요:
- `my-post.md` → `my-post.fr.md`
- `my-post.en.md` → `my-post.fr.md` (소스 접미사 제거)

**기존 파일 건너뛰기**: 이미 번역된 파일은 덮어쓰지 않아요. 강제로 다시 번역하려면 대상 파일을 삭제해 주세요.

### 복수형

TOML 및 YAML 로캘은 CLDR 복수형을 지원해요:

```toml
[items]
one = "{{ .Count }} item"
other = "{{ .Count }} items"
```

변경 사항 비교(diffing)를 위해 내부적으로 `items.one` 및 `items.other`로 표현되며, 저장할 때 올바른 섹션 형식으로 다시 직렬화(re-serialized)돼요.

---

## next-intl (JSON)

### 프로젝트 구조

```
my-app/
├── messages/
│   └── en.json        ← source of truth
├── src/
│   ├── i18n/
│   │   ├── routing.ts
│   │   └── request.ts
│   └── middleware.ts
└── .env.local
```

### 설정

```bash
npm install --save-dev i18n-rosetta
```

`i18n-rosetta.config.json` 파일을 생성해 주세요:

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./messages",
  "languages": ["fr", "de", "ja", "es", "ko", "zh", "pt", "ar"]
}
```

```bash
npx i18n-rosetta sync
```

중첩된 키 구조를 유지하면서 완전히 번역된 `messages/fr.json`, `messages/ja.json` 등을 생성해요. next-intl이 이를 자동으로 인식해요.

### 개발 워크플로우

```json
{
  "scripts": {
    "dev": "i18n-rosetta watch & next dev",
    "i18n:sync": "i18n-rosetta sync",
    "i18n:audit": "i18n-rosetta audit"
  }
}
```

---

## react-i18next (JSON)

### 평면(Flat) 파일 구조 (권장)

```
locales/
├── en.json
├── fr.json
└── ja.json
```

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "languages": ["fr", "de", "ja"]
}
```

### 중첩 디렉터리 구조

`{locale}/{namespace}.json` 구조를 사용하는 경우, 평면화(flatten) → 번역 → 평면화 해제(unflatten)를 수행하는 동기화 스크립트를 만들어 주세요. 자세한 내용은 [react-i18next 문서](https://react.i18next.com/)를 참고해 주세요.