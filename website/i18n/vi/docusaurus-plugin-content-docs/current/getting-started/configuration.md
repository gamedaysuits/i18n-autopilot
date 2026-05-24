---
sidebar_position: 3
title: "Cấu hình"
---
# Cấu hình

Rosetta hoạt động không cần cấu hình (zero-config) — nó tự động phát hiện các tệp ngôn ngữ (locale), định dạng và ngôn ngữ đích từ dự án của bạn. Để kiểm soát nhiều hơn, hãy tạo `i18n-rosetta.config.json` trong thư mục gốc của dự án, hoặc chạy:

```bash
npx i18n-rosetta init
```

## Tham chiếu cấu hình đầy đủ

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

:::note typegen chưa được triển khai
Khối cấu hình `typegen` được nhận diện và giữ lại bởi trình tải cấu hình, nhưng tính năng tạo kiểu (type generation) TypeScript vẫn chưa được triển khai. Đây là phần giữ chỗ cho một tính năng đã được lên kế hoạch. Việc thiết lập các giá trị này sẽ không có tác dụng gì.
:::


### Các trường (Fields)

| Trường | Kiểu dữ liệu | Mặc định | Mô tả |
|-------|------|---------|-------------|
| `version` | `number` | `3` | Phiên bản schema cấu hình. Luôn là `3`. |
| `inputLocale` | `string` | `"en"` | Mã ngôn ngữ nguồn (BCP 47). |
| `localesDir` | `string` | `"./locales"` | Đường dẫn đến các tệp locale. Rosetta sẽ quét thư mục này. |
| `contentDir` | `string` | `null` | Thư mục nội dung Hugo. Kích hoạt tính năng dịch phần thân (body) Markdown. |
| `translatableFields` | `string[]` | `null` | Ghi đè các trường frontmatter có thể dịch mặc định cho việc dịch nội dung. `null` sử dụng các giá trị mặc định tích hợp sẵn (`title`, `description`, `summary`). |
| `format` | `string` | `"auto"` | Định dạng tệp: `json`, `toml`, `yaml`, hoặc `auto` (phát hiện từ phần mở rộng). |
| `model` | `string` | `"google/gemini-3.5-flash"` | Model mặc định cho các phương thức LLM. Định dạng phụ thuộc vào phương thức: OpenRouter sử dụng `provider/model` (ví dụ: `google/gemini-3.5-flash`); các nhà cung cấp trực tiếp sử dụng tên trần (ví dụ: `gpt-4o`, `gemini-2.5-flash`). |
| `defaultMethod` | `string` | `"llm"` | Phương thức dịch mặc định: `llm`, `llm-coached`, `google-translate`, `deepl`, `microsoft-translator`, `libretranslate`, `openai`, `anthropic`, `gemini`, `api`. Bị ghi đè bởi cờ CLI `--method`. |
| `batchSize` | `number` | `30` | Số lượng key trên mỗi batch dịch. Cao hơn = ít lệnh gọi API hơn, nhưng prompt lớn hơn. |
| `fallbackPrefix` | `string` | `"[EN] "` | Tiền tố được thêm vào các giá trị dự phòng (fallback) chưa được dịch. Được sử dụng bởi `audit` để phát hiện các bản dịch chưa hoàn chỉnh. |
| `apiKeyEnvVar` | `string` | `"OPENROUTER_API_KEY"` | Tên biến môi trường cho API key. Ghi đè cho các tên biến môi trường tùy chỉnh. |
| `baseUrl` | `string` | `""` | Base URL để tạo các artifact SEO (hreflang, sitemaps, JSON-LD). |
| `pairs` | `object` | `{}` | Ghi đè phương thức, model và chất lượng cho từng cặp ngôn ngữ. Xem [Cấu hình cặp ngôn ngữ](#pair-configuration). |
| `languages` | `object` | `{}` | Ghi đè cho từng ngôn ngữ. Xem [Cấu hình ngôn ngữ](#language-configuration). |
| `lint.srcDir` | `string` | `null` | Thư mục nguồn để quét lint. `null` = tự động phát hiện từ framework. |
| `lint.ignore` | `string[]` | `["node_modules", ...]` | Các mẫu glob để loại trừ khỏi lint. |
| `lint.minLength` | `number` | `2` | Độ dài chuỗi tối thiểu để gắn cờ là hardcode. |
| `seo.urlPattern` | `string` | `"/:locale/:path"` | Mẫu URL (URL pattern template) để tạo thẻ hreflang. |
| `seo.pages` | `string[]` | `null` | Danh sách trang rõ ràng cho SEO. `null` = tự động phát hiện từ các key locale. |
| `typegen.output` | `string` | `null` | Đường dẫn đầu ra cho các type TypeScript được tạo. `null` = vô hiệu hóa. |
| `typegen.autoGenerate` | `boolean` | `false` | Tự động tạo lại các type sau mỗi lần đồng bộ (sync). |

## Cấu hình cặp ngôn ngữ

Mỗi cặp nguồn→đích có thể được cấu hình độc lập:

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

### Các trường của cặp ngôn ngữ

| Trường | Kiểu dữ liệu | Mô tả |
|-------|------|-------------|
| `method` | `string` | Phương thức dịch: `llm`, `llm-coached`, `google-translate`, `deepl`, `microsoft-translator`, `libretranslate`, `openai`, `anthropic`, `gemini`, `api` |
| `methodPlugin` | `string` | Tên của một plugin đã cài đặt (từ `.rosetta/methods/`) |
| `model` | `string` | Ghi đè model mặc định cho cặp này |
| `endpoint` | `string` | URL endpoint của API từ xa. Bắt buộc khi `method` là `api`. |
| `qualityTier` | `string` | Cấp độ hiển thị (Display tier): `standard`, `high`, `research`, `verified` |

## Cấu hình ngôn ngữ

Ngôn ngữ chấp nhận ba định dạng:

### Mảng các mã (đơn giản nhất)

```json
{
  "languages": ["fr", "de", "ja"]
}
```

Mỗi ngôn ngữ lấy văn phong (register) mặc định từ bảng văn phong được tích hợp sẵn. Các ngôn ngữ không có mặc định sẽ nhận `"Professional register."`.

### Object với các chuỗi văn phong

Giá trị có thể là một **preset key** từ thẻ ngôn ngữ (language card), hoặc văn bản văn phong tùy chỉnh:

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "Custom: Polite Japanese for a gaming app."
  }
}
```

Rosetta sẽ kiểm tra xem chuỗi có khớp với một preset key trong thẻ ngôn ngữ hay không. Nếu có, toàn bộ prompt văn phong từ thẻ sẽ được sử dụng. Nếu không, chuỗi sẽ được sử dụng nguyên bản. Xem [Ngôn ngữ được hỗ trợ](/docs/reference/supported-languages#language-cards) để biết các preset có sẵn.

### Object với cấu hình đầy đủ

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

Bạn có thể kết hợp dạng viết tắt và object đầy đủ trong cùng một khối.


### Các trường của ngôn ngữ

| Trường | Kiểu dữ liệu | Mô tả |
|-------|------|-------------|
| `register` | `string` | Hướng dẫn về phong cách/giọng điệu. Có thể là một **preset key** (ví dụ: `casual-tu`, `formal-hapsyo`) hoặc văn bản tùy chỉnh. Xem [Thẻ ngôn ngữ](/docs/reference/supported-languages#language-cards). |
| `name` | `string` | Tên ngôn ngữ dễ đọc cho con người (để hiển thị trạng thái) |
| `model` | `string` | Ghi đè model mặc định |
| `batchSize` | `number` | Ghi đè kích thước batch mặc định |
| `maxRetries` | `number` | Số lần thử lại (retry) tối đa cho các batch bị lỗi (mặc định: 3) |
| `script` | `string` | Mã chữ viết (script code) ISO 15924. Kích hoạt tính năng xác thực chữ viết trong cổng chất lượng (quality gate). |

:::info Chuỗi kế thừa
Các cài đặt được phân giải theo thứ tự sau (ưu tiên cái đầu tiên):

**cấp độ cặp ngôn ngữ (pair-level)** → **cấp độ ngôn ngữ (language-level)** → **cấu hình toàn cục (global config)** → **mặc định (defaults)**

Ví dụ: nếu `pairs["en:fr"]` thiết lập `model`, nó sẽ ghi đè cả giá trị `model` ở cấp độ ngôn ngữ và toàn cục.
:::

## Nguồn không phải tiếng Anh

Nếu ngôn ngữ nguồn của bạn không phải là tiếng Anh:

```bash
# CLI flag (one-time)
npx i18n-rosetta sync --source fr
```

```json title="i18n-rosetta.config.json (permanent)"
{
  "inputLocale": "fr"
}
```

## Tệp khóa (Lock File)

Rosetta tạo `.i18n-rosetta.lock` để theo dõi mã băm SHA-256 của các giá trị nguồn đã được dịch. **Hãy commit tệp này** để tất cả các nhà phát triển cùng chia sẻ chung một cơ sở (baseline) bản dịch.

Khi một giá trị nguồn thay đổi, mã băm sẽ không còn khớp nữa và rosetta sẽ dịch lại key đó trong lần đồng bộ tiếp theo.

## `.rosettaignore`

Tạo `.rosettaignore` trong thư mục gốc của dự án để loại trừ các tệp khỏi quá trình quét `lint`. Sử dụng các mẫu glob, giống như `.gitignore`:

```text title=".rosettaignore"
src/components/legacy/**
src/utils/constants.js
**/*.test.js
```

---

## API lập trình

Đối với các tập lệnh build và tích hợp tùy chỉnh, hãy import trực tiếp từ package:

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

### Các Export có sẵn

| Export | Chức năng |
|--------|-------------|
| `TranslationMethod` | Lớp cơ sở (Base class) cho tất cả các phương thức |
| `LLMMethod` | Lớp cơ sở cho các phương thức LLM (OpenRouter) |
| `DirectLLMMethod` | Lớp cơ sở cho các nhà cung cấp LLM trực tiếp (OpenAI, Anthropic, Gemini) |
| `OpenAIMethod`, `AnthropicMethod`, `GeminiMethod` | Các lớp nhà cung cấp LLM trực tiếp |
| `DeepLMethod`, `MicrosoftTranslatorMethod`, `LibreTranslateMethod` | Các lớp MT (Dịch máy) truyền thống |
| `GoogleTranslateMethod` | Google Cloud Translation |
| `LLMCoachedMethod` | Coached LLM (OpenRouter + dữ liệu huấn luyện) |
| `APIMethod` | Remote API client |
| `runSync`, `runContentSync` | Pipeline đồng bộ đầy đủ |
| `resolveConfig`, `resolvePairs` | Phân giải cấu hình |
| `validateTranslations` | Cổng chất lượng (Quality gate) |
| `loadCoachingData`, `findDictionaryMatches` | Các tiện ích huấn luyện (Coaching utilities) |

### Tiện ích mở rộng nhà cung cấp tùy chỉnh

Kế thừa `DirectLLMMethod` để thêm một nhà cung cấp LLM mới trong khoảng 40 dòng:

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

Bạn sẽ được cung cấp miễn phí các tính năng dịch, huấn luyện (coaching), vòng lặp thử lại (retry loops), xác thực model, cấp độ chất lượng và hỗ trợ thiết lập. Chỉ có cấu trúc yêu cầu HTTP là đặc thù của từng nhà cung cấp. Đối với các adapter không phải LLM sử dụng `fetch()` thô, hãy sử dụng helper `fetchWithRetry()` dùng chung từ `lib/methods/fetch-with-retry.js` thay vì tự viết vòng lặp thử lại của riêng bạn.

---

## Xem thêm

- [Tham chiếu CLI](/docs/reference/cli) — tất cả các lệnh và cờ
- [Các phương thức dịch](/docs/guides/translation-methods) — lựa chọn và kết hợp các phương thức
- [Đặc tả Plugin](/docs/reference/plugin-spec) — định dạng manifest của plugin phương thức
- [Kiến trúc](/docs/concepts/architecture) — cách các thành phần kết nối với nhau
- [Ngôn ngữ được hỗ trợ](/docs/reference/supported-languages) — hỗ trợ ngôn ngữ tích hợp sẵn
- [Cách thức hoạt động của Sync](/docs/concepts/how-sync-works) — pipeline dịch thuật