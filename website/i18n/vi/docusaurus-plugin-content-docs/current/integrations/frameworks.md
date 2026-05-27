# Hướng dẫn tích hợp

Thiết lập từng bước cho i18n-rosetta với các framework phổ biến.

---

## Thiết lập API Key

Trước khi tích hợp với bất kỳ framework nào, bạn cần có API key dịch thuật. Rosetta hỗ trợ hai nhà cung cấp:

### Lựa chọn A: OpenRouter (khuyên dùng)

[OpenRouter](https://openrouter.ai) cung cấp một API hợp nhất cho hơn 200 mô hình LLM. Có sẵn gói miễn phí.

```bash
# Sign up at https://openrouter.ai, then:
export OPENROUTER_API_KEY=sk-or-v1-...

# Or add to .env.local:
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Tốt nhất cho: các dự án nhiều nội dung, dịch Markdown và các dự án cần bảo vệ nội dung theo ngữ cảnh (khối mã, shortcode, biến nội suy).

### Lựa chọn B: Google Translate

```bash
export GOOGLE_TRANSLATE_API_KEY=...
```

Tốt nhất cho: các cặp chuỗi key-value số lượng lớn (hơn 130 ngôn ngữ). **Không khuyên dùng** cho nội dung Markdown — Google Translate không nhận biết được các khối mã, shortcode hoặc biến nội suy.

Để sử dụng Google Translate một cách rõ ràng:

```bash
i18n-rosetta sync --method google-translate
```

> **Mẹo**: Nếu chỉ thiết lập `GOOGLE_TRANSLATE_API_KEY` (không có key OpenRouter), rosetta sẽ tự động chuyển sang Google Translate.

---

## Hugo (TOML / YAML / Markdown)

### Cấu trúc dự án

Hugo sử dụng `i18n/` để dịch chuỗi và `content/` cho nội dung trang:

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

### Thiết lập

```bash
npm install --save-dev i18n-rosetta
```

```bash
# .env.local
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Tạo `i18n-rosetta.config.json`:

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

### Chi tiết dịch nội dung

**Front matter**: Hỗ trợ cả dấu phân cách YAML (`---`) và TOML (`+++`). Dịch `title`, `description`, `summary`, `subtitle`, `caption`, và `linkTitle` theo mặc định. Tất cả các trường khác (date, draft, tags, weight, slug, v.v.) đều được giữ nguyên. Tùy chỉnh bằng `translatableFields` trong cấu hình của bạn.

**Bảo vệ khối (Block protection)**: Các khối mã, shortcode của Hugo (`{{< >}}`, `{{% %}}`), mã nội tuyến (inline code) và HTML thô được tự động bảo vệ bằng các placeholder Unicode sentinel. Chúng sẽ được giữ nguyên không bị thay đổi.

**Quy ước đặt tên tệp**: Tuân theo mẫu dịch-theo-tên-tệp của Hugo:
- `my-post.md` → `my-post.fr.md`
- `my-post.en.md` → `my-post.fr.md` (loại bỏ hậu tố nguồn)

**Bỏ qua tệp đã tồn tại**: Các tệp đã được dịch sẽ không bao giờ bị ghi đè. Xóa tệp đích để buộc dịch lại.

### Dạng số nhiều

Các locale TOML và YAML hỗ trợ các dạng số nhiều CLDR:

```toml
[items]
one = "{{ .Count }} item"
other = "{{ .Count }} items"
```

Được biểu diễn nội bộ dưới dạng `items.one` và `items.other` để so sánh (diffing), sau đó được tuần tự hóa lại (re-serialized) thành định dạng phân mục chính xác khi ghi.

---

## next-intl (JSON)

### Cấu trúc dự án

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

### Thiết lập

```bash
npm install --save-dev i18n-rosetta
```

Tạo `i18n-rosetta.config.json`:

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

Tạo ra `messages/fr.json`, `messages/ja.json`, v.v. — được dịch hoàn toàn, giữ nguyên cấu trúc khóa lồng nhau của bạn. next-intl sẽ tự động nhận diện chúng.

### Quy trình phát triển

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

### Cấu trúc tệp phẳng (khuyên dùng)

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

### Cấu trúc thư mục lồng nhau

Nếu bạn sử dụng cấu trúc `{locale}/{namespace}.json`, hãy tạo một tập lệnh đồng bộ để làm phẳng (flatten) → dịch → hủy làm phẳng (unflatten). Xem [tài liệu react-i18next](https://react.i18next.com/) để biết thêm chi tiết.