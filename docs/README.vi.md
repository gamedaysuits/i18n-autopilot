# i18n-rosetta

[![npm version](https://img.shields.io/npm/v/i18n-rosetta.svg)](https://www.npmjs.com/package/i18n-rosetta)
[![CI](https://github.com/gamedaysuits/i18n-rosetta/actions/workflows/ci.yml/badge.svg)](https://github.com/gamedaysuits/i18n-rosetta/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

🌐 **Bản dịch README** — *được dịch bởi rosetta, tất nhiên rồi:*
[Français](docs/README.fr.md) · [Deutsch](docs/README.de.md) · [Español](docs/README.es.md) · [Português](docs/README.pt.md) · [Nederlands](docs/README.nl.md) · [日本語](docs/README.ja.md) · [한국어](docs/README.ko.md) · [简体中文](docs/README.zh.md) · [ไทย](docs/README.th.md) · [Tiếng Việt](docs/README.vi.md) · [Filipino](docs/README.fil.md) · [العربية](docs/README.ar.md)

Dịch các tệp locale của bạn chỉ với một lệnh:

```bash
npx i18n-rosetta sync
```

Rosetta tự động phát hiện các tệp locale, định dạng và ngôn ngữ đích của bạn. Nó dịch các khóa bị thiếu, bỏ qua những gì đã được dịch và ghi kết quả. Chỉ vậy thôi.

## Tại Sao Không Tự Viết Script?

Bạn có thể viết một script nhanh để lặp qua các khóa tiếng Anh của mình và gọi Google Translate. Hầu hết các nhà phát triển đều làm vậy — chỉ mất khoảng 30 dòng. Đây là lý do tại sao nó gặp vấn đề:

- **Không phát hiện thay đổi.** Khi bạn cập nhật một chuỗi tiếng Anh, bản dịch sẽ lỗi thời mãi mãi. Rosetta theo dõi mọi giá trị nguồn bằng hàm băm SHA-256 và chỉ dịch lại những gì đã thay đổi.
- **Không gom nhóm.** Một lệnh gọi API cho mỗi khóa có nghĩa là 200 khóa = 200 lượt đi và về. Rosetta gom nhóm một cách thông minh (có thể cấu hình, mặc định 30 khóa/nhóm cho LLM, 128 cho Google).
- **Không có cổng chất lượng.** Dịch máy có thể bị ảo giác, lặp lại nguồn hoặc xuất ra sai script. Rosetta xác thực mọi bản dịch trước khi ghi — các lỗi sai script, độ dài bị thổi phồng và lặp lại nguồn đều bị phát hiện và từ chối.
- **Không nhận biết định dạng.** Mã hóa cứng sang JSON? Rosetta xử lý JSON, TOML, YAML và Hugo Markdown (frontmatter + body) với tính năng tự động phát hiện.
- **Không an toàn.** Rosetta bảo vệ chống lại ô nhiễm prototype, tấn công path traversal thông qua các mã locale được tạo thủ công và hỏng khối mã trong quá trình dịch Markdown.

Rosetta là phiên bản sản xuất của script đó.

## Bắt Đầu Nhanh

```bash
npm install --save-dev i18n-rosetta
```

### Lấy API Key

Rosetta cần một backend dịch thuật. Chọn một:

| Nhà cung cấp | Khóa | Tốt nhất cho |
|----------|-----|----------|
| **OpenRouter** (khuyên dùng) | `OPENROUTER_API_KEY` | Các dự án nhiều nội dung, Markdown, hơn 200 mô hình |
| **OpenAI** | `OPENAI_API_KEY` | Truy cập trực tiếp GPT-4o |
| **Anthropic** | `ANTHROPIC_API_KEY` | Truy cập trực tiếp Claude |
| **Gemini** | `GEMINI_API_KEY` | Có gói miễn phí |
| **DeepL** | `DEEPL_API_KEY` | Các ngôn ngữ châu Âu, hỗ trợ thuật ngữ |
| **Google Translate** | `GOOGLE_TRANSLATE_API_KEY` | Hơn 130 ngôn ngữ, khối lượng lớn |

**Bắt đầu nhanh nhất** (miễn phí): Đăng ký tại [aistudio.google.com](https://aistudio.google.com/apikey) để lấy khóa Gemini miễn phí:

```bash
export GEMINI_API_KEY=AI...
npx i18n-rosetta sync --method gemini
```

**OpenRouter** (hơn 200 mô hình): Đăng ký tại [openrouter.ai](https://openrouter.ai), sau đó:

```bash
export OPENROUTER_API_KEY=sk-or-v1-...
npx i18n-rosetta sync
```

**Google Translate** thay thế (chỉ các cặp khóa-giá trị — không nhận biết Markdown):

```bash
export GOOGLE_TRANSLATE_API_KEY=...
npx i18n-rosetta sync --method google-translate
```

> **Lưu ý**: Nếu chỉ `GOOGLE_TRANSLATE_API_KEY` được đặt, rosetta sẽ tự động chuyển sang Google Translate. Không cần thay đổi cấu hình. Sử dụng trực tiếp REST API — không SDK, không tài khoản dịch vụ, không `pip install`. Chỉ cần khóa.

Vậy là xong. Để kiểm soát nhiều hơn, hãy tạo một tệp cấu hình:

```bash
npx i18n-rosetta init                        # guided wizard — walks you through registers, methods, and content
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific languages and default registers
```

Mỗi ngôn ngữ đi kèm với **register presets** — các hướng dẫn về giọng điệu/mức độ trang trọng được tạo sẵn, điều chỉnh theo hệ thống ngôn ngữ của nó (vouvoiement cho tiếng Pháp, Siezen cho tiếng Đức, です/ます cho tiếng Nhật, 해요체 cho tiếng Hàn). Trình hướng dẫn khởi tạo cho phép bạn duyệt và chọn các preset, hoặc truyền `--yes` để chấp nhận các giá trị mặc định.

### Nguồn không phải tiếng Anh

Nếu ngôn ngữ nguồn của bạn không phải tiếng Anh:

```bash
i18n-rosetta sync --source fr                      # CLI flag
```

Hoặc đặt vĩnh viễn trong cấu hình của bạn:

```json
{ "inputLocale": "fr" }
```

## Chức năng

Bạn xử lý framework i18n (next-intl, i18next, Hugo). Rosetta xử lý các tệp dịch thuật.

- **Đa định dạng** — JSON, TOML, YAML và Hugo Markdown (front matter + body)
- **Tăng dần** — Chỉ dịch những gì đã thay đổi (theo dõi hàm băm SHA-256)
- **Kiểm soát chất lượng** — Xác thực mọi bản dịch: phát hiện ảo giác, đầu ra sai script, lặp lại nguồn và độ dài bị thổi phồng
- **Nhận biết nội dung** — Các phương pháp LLM bảo vệ các khối mã, shortcode, liên kết và biến nội suy trong quá trình dịch Markdown
- **Công cụ pipeline** — `lint`, `audit`, `integrity`, `seo` cho các cổng CI
- **Không phụ thuộc** — Chỉ các thành phần tích hợp sẵn của Node.js. Không SDK, không module gốc. Yêu cầu Node 20+

## Vượt Ra Ngoài Google Translate

Phần bắt đầu nhanh giúp bạn chạy với LLM hoặc Google Translate. Nhưng Google Translate hỗ trợ khoảng 130 ngôn ngữ. Có hơn 7.000 ngôn ngữ.

**Ý tưởng cốt lõi của Rosetta: phương pháp dịch có thể cấu hình cho từng cặp ngôn ngữ.** Sử dụng Google Translate cho tiếng Pháp, LLM với hướng dẫn hình thái cho tiếng Cree Đồng bằng, và API do cộng đồng lưu trữ cho tiếng Quechua — tất cả trong cùng một dự án, tất cả với cùng một CLI.

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

Nếu bạn có thể tìm ra cách dịch một cặp ngôn ngữ — thông qua kỹ thuật prompt, từ điển cộng đồng, pipeline FST hoặc các mô hình được tinh chỉnh — rosetta cho phép bạn đóng gói phương pháp đó dưới dạng plugin và triển khai nó cùng với mọi thứ khác.

> Ra đời từ việc dịch một trang web sản xuất sang tiếng Cree Đồng bằng, nơi không có API sẵn có. Kiến trúc theo cặp không phải là lý thuyết — nó tồn tại vì một dự án cần Google Translate cho tiếng Pháp và một pipeline FST được hướng dẫn cho một ngôn ngữ bản địa, chạy song song trong cùng một lệnh đồng bộ hóa.

[MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness) đi kèm cho phép bạn đánh giá và so sánh các phương pháp dịch, sau đó xuất các phương pháp hoạt động dưới dạng plugin rosetta. Bất kỳ ai nói cả hai ngôn ngữ đều có thể phát triển, kiểm tra và chia sẻ một phương pháp dịch — không yêu cầu nền tảng độc quyền.

### Chọn Phương Pháp Của Bạn

Rosetta hỗ trợ 10 phương pháp dịch. Mỗi cặp ngôn ngữ có thể sử dụng một phương pháp khác nhau.

**Nhà cung cấp LLM** — tốt nhất cho chất lượng, nhận biết Markdown, tương thích với hướng dẫn:

| Phương pháp | Khóa | Chức năng |
|--------|-----|-------------|
| `llm` (mặc định) | `OPENROUTER_API_KEY` | LLM qua OpenRouter — hơn 200 mô hình, định tuyến tự động |
| `llm-coached` | `OPENROUTER_API_KEY` | LLM + quy tắc ngữ pháp, từ điển, ghi chú phong cách |
| `openai` | `OPENAI_API_KEY` | API OpenAI trực tiếp (gpt-4o, gpt-4o-mini) |
| `anthropic` | `ANTHROPIC_API_KEY` | API Anthropic trực tiếp (Claude Sonnet, Haiku, Opus) |
| `gemini` | `GEMINI_API_KEY` | API Google Gemini trực tiếp (Flash, Pro) — có gói miễn phí |

**MT truyền thống** — tốt nhất cho tốc độ, chi phí và các cặp khóa-giá trị khối lượng lớn:

| Phương pháp | Khóa | Chức năng |
|--------|-----|-------------|
| `google-translate` | `GOOGLE_TRANSLATE_API_KEY` | Google Cloud Translation API v2 (hơn 130 ngôn ngữ) |
| `deepl` | `DEEPL_API_KEY` | DeepL API với hỗ trợ thuật ngữ (hơn 30 ngôn ngữ) |
| `microsoft-translator` | `MICROSOFT_TRANSLATOR_API_KEY` | Azure Cognitive Services Translator (hơn 100 ngôn ngữ) |
| `libretranslate` | *(tự lưu trữ)* | LibreTranslate tự lưu trữ (AGPL, miễn phí) |

**Cơ sở hạ tầng** — cho các điểm cuối tùy chỉnh hoặc do cộng đồng lưu trữ:

| Phương pháp | Khóa | Chức năng |
|--------|-----|-------------|
| `api` | *(theo nhà cung cấp)* | HTTP client nhỏ gọn cho bất kỳ điểm cuối REST nào |

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

> **Lưu ý**: Các phương pháp MT truyền thống (Google Translate, DeepL, Microsoft Translator, LibreTranslate) xử lý tốt các cặp khóa-giá trị nhưng không thể dịch an toàn nội dung Markdown. Đối với các dự án nhiều nội dung, nên dùng các phương pháp LLM — chúng bảo vệ rõ ràng các khối mã, shortcode và biến nội suy.

## Plugin

Plugin là các công thức dịch được đóng gói sẵn cho các cặp ngôn ngữ cụ thể. Chúng là các tệp kê khai JSON — không phải mã — cho rosetta biết nên sử dụng phương pháp nào, với cài đặt nào và chất lượng đã được đánh giá ra sao.

```bash
i18n-rosetta plugin install ./french-formal-v1/    # install from directory
i18n-rosetta plugin list                           # see installed plugins
i18n-rosetta plugin remove french-formal-v1        # uninstall
i18n-rosetta status                                # shows quality tiers + benchmarks
```

Xem [docs/METHOD_PLUGIN_SPEC.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/METHOD_PLUGIN_SPEC.md) để biết định dạng tệp kê khai.

## Lệnh

| Lệnh | Mục đích |
|---------|---------|
| `init` | Trình hướng dẫn thiết lập tương tác (hoặc `--yes` cho các giá trị mặc định nhanh) |
| `sync` | Dịch & đồng bộ hóa tất cả các tệp locale |
| `watch` | Tự động đồng bộ hóa khi tệp thay đổi |
| `audit` | Đánh dấu các locale chưa hoàn chỉnh (cổng CI) |
| `lint` | Tìm các chuỗi mã hóa cứng trong mã nguồn |
| `wrap` | Tự động bao bọc các chuỗi mã hóa cứng trong các lệnh gọi `t()` (có hoàn tác) |
| `seo` | Tạo hreflang, sitemap.xml hoặc lược đồ JSON-LD |
| `integrity` | Kiểm tra lỗi hỏng placeholder và mã hóa |
| `status` | Hiển thị cấu hình cặp, phương pháp, register và các cấp chất lượng |
| `provenance` | Kiểm tra cấp phép tài nguyên dịch thuật |
| `plugin` | Cài đặt, gỡ bỏ hoặc liệt kê các plugin phương pháp |

Chạy `i18n-rosetta <command> --help` để được trợ giúp chi tiết về bất kỳ lệnh nào.

Tham khảo đầy đủ: [docs/CLI_REFERENCE.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/CLI_REFERENCE.md)

## Cấu hình

Tạo `i18n-rosetta.config.json` hoặc chạy `i18n-rosetta init`:

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

| Tùy chọn | Mặc định | Mô tả |
|--------|---------|-------------|
| `inputLocale` | `"en"` | Mã ngôn ngữ nguồn |
| `localesDir` | `"./locales"` | Đường dẫn đến các tệp locale |
| `contentDir` | `null` | Thư mục nội dung Hugo (cho phép dịch Markdown) |
| `format` | `"auto"` | Định dạng tệp: `json`, `toml`, `yaml`, hoặc `auto` |
| `model` | `"google/gemini-3.5-flash"` | Mô hình OpenRouter mặc định |
| `defaultMethod` | `"llm"` | Phương pháp dịch mặc định (bị ghi đè bởi cờ `--method`) |
| `batchSize` | `30` | Số khóa mỗi nhóm dịch |
| `pairs` | `{}` | Ghi đè phương pháp, mô hình và chất lượng theo cặp |

**Ghi đè theo ngôn ngữ**: Mỗi ngôn ngữ có một [Thẻ Ngôn ngữ](docs/planning/LANGUAGE_CARD_SPEC.md) với các register cài đặt sẵn được điều chỉnh theo hệ thống trang trọng của nó. Sử dụng các khóa cài đặt sẵn làm viết tắt, hoặc viết văn bản register tùy chỉnh:

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

**Chế độ không cấu hình**: Không có tệp cấu hình? Rosetta tự động phát hiện các tệp locale, định dạng và ngôn ngữ đích từ dự án của bạn.

Các giá trị ngôn ngữ có thể là một khóa cài đặt sẵn (ví dụ: `"casual-tu"`), văn bản register tùy chỉnh hoặc một đối tượng (kiểm soát hoàn toàn). Các ghi đè cấp cặp trong `pairs` có ưu tiên cao hơn các cài đặt cấp ngôn ngữ. Chạy `npx i18n-rosetta init` để duyệt các cài đặt sẵn có sẵn cho mỗi ngôn ngữ.

Hướng dẫn thiết lập framework: [docs/INTEGRATION_GUIDES.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/INTEGRATION_GUIDES.md)

## Tăng cường bảo mật

- **Exponential backoff** — 3 lần thử lại với jitter trên các lỗi 429/5xx
- **Thời gian chờ yêu cầu 30s** — AbortController ngăn chặn treo
- **Xác thực phản hồi** — chỉ chấp nhận các khóa đã được gửi để dịch
- **Cổng chất lượng** — phát hiện các vòng lặp ảo giác, đầu ra sai script, độ dài bị thổi phồng và lặp lại nguồn
- **Retry cascade** — khi phân tích JSON thất bại, thử lại nhóm → nửa nhóm → các khóa riêng lẻ (giới hạn ngân sách qua `maxRetries`)
- **Lưu trữ prompt** — tách tin nhắn hệ thống/người dùng cho phép lưu trữ cấp nhà cung cấp, giảm chi phí token trên các nhóm
- **Bảo vệ chống ô nhiễm prototype** — chặn `__proto__`, `constructor`, `prototype`
- **Giới hạn đường dẫn** — các thao tác ghi tệp được xác thực để nằm trong các thư mục đã cấu hình
- **Bảo vệ khối** — các khối mã, shortcode, HTML được bảo vệ trong quá trình dịch nội dung
- **Fallback rõ ràng** — `--fallback` ghi các placeholder có tiền tố `[EN]` khi API không khả dụng (đồng bộ lại với một khóa để có bản dịch thực)
- **Thành công một phần** — một nhóm thất bại không chặn phần còn lại

## Kiểm thử

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

**Không phụ thuộc.**

## Giấy phép

MIT