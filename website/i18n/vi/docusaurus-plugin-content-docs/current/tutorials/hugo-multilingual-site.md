---
sidebar_position: 3
title: "Trang web đa ngôn ngữ Hugo"
description: "Cookbook: thiết lập một trang web đa ngôn ngữ Hugo hoàn chỉnh với i18n-rosetta xử lý cả việc dịch string files và nội dung Markdown."
---
# Cookbook: Trang web đa ngôn ngữ Hugo

Thiết lập hệ thống đa ngôn ngữ của Hugo với i18n-rosetta để xử lý cả tệp chuỗi JSON và dịch nội dung Markdown. Hướng dẫn này bao gồm toàn bộ quy trình làm việc từ thiết lập dự án đến triển khai production.

**Những gì bạn sẽ xây dựng:** Một trang web Hugo với tiếng Anh, tiếng Pháp và tiếng Nhật — dịch chuỗi thông qua các tệp locale, dịch nội dung thông qua xử lý Markdown.

---

## Cấu trúc dự án

Rosetta sử dụng chế độ dịch **dựa trên tên tệp** (filename-based) của Hugo. Các tệp đã dịch được đặt trong cùng thư mục với tệp nguồn, với hậu tố ngôn ngữ được thêm vào tên tệp (ví dụ: `about.fr.md`):

```
my-hugo-site/
├── content/
│   └── en/
│       ├── _index.md
│       ├── _index.fr.md           ← rosetta generates
│       ├── _index.ja.md           ← rosetta generates
│       ├── about.md
│       ├── about.fr.md            ← rosetta generates
│       ├── about.ja.md            ← rosetta generates
│       └── blog/
│           ├── first-post.md
│           ├── first-post.fr.md   ← rosetta generates
│           └── first-post.ja.md   ← rosetta generates
├── i18n/
│   ├── en.json
│   ├── fr.json                    ← rosetta generates
│   └── ja.json                    ← rosetta generates
└── hugo.toml
```

:::note Các chế độ i18n của Hugo
Hugo hỗ trợ hai chiến lược dịch: **dựa trên tên tệp** (filename-based) (`about.fr.md` nằm cạnh `about.md`) và **dựa trên thư mục** (directory-based) (các cây `content/fr/about.md` riêng biệt). Rosetta sử dụng dịch dựa trên tên tệp vì hàm `getTargetContentPath()` của nó tạo ra các đường dẫn đích bằng cách thêm hậu tố ngôn ngữ vào tên tệp nguồn. Hãy đảm bảo `hugo.toml` của bạn được cấu hình cho dịch dựa trên tên tệp khi sử dụng rosetta.
:::

## Bước 1: Cấu hình Hugo

```toml title="hugo.toml"
defaultContentLanguage = 'en'

[languages]
  [languages.en]
    languageName = 'English'
    weight = 1
  [languages.fr]
    languageName = 'Français'
    weight = 2
  [languages.ja]
    languageName = '日本語'
    weight = 3
```

## Bước 2: Cấu hình Rosetta

Rosetta cần cấu hình hai thứ: đường dẫn tệp locale (cho chuỗi JSON) và thư mục nội dung (cho Markdown).

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./i18n",
  "contentDir": "./content",
  "model": "google/gemini-3.5-flash",
  "pairs": {
    "en:fr": { "method": "llm" },
    "en:ja": { "method": "llm", "model": "openai/gpt-4o" }
  },
  "languages": {
    "fr": { "name": "French", "register": "Formal (vous-form)" },
    "ja": { "name": "Japanese", "register": "Polite/formal" }
  }
}
```

## Bước 3: Tạo nội dung nguồn

### Dịch chuỗi (i18n/)

```json title="i18n/en.json"
{
  "nav": {
    "home": "Home",
    "about": "About",
    "blog": "Blog",
    "contact": "Contact"
  },
  "footer": {
    "copyright": "© 2026 My Company. All rights reserved.",
    "privacy": "Privacy Policy"
  }
}
```

### Nội dung Markdown (content/en/)

```markdown title="content/en/about.md"
---
title: "About Us"
description: "Learn more about our team and mission"
date: 2026-01-15
---

We build software that helps businesses communicate across languages.

Our platform supports **real-time translation** for over 30 languages,
with specialized support for low-resource languages.

## Our Mission

Language should never be a barrier to understanding.

## The Team

{{< team-grid >}}
```

## Bước 4: Chạy đồng bộ

```bash
npx i18n-rosetta sync
```

Rosetta xử lý cả hai loại:

1. **Tệp chuỗi** (`i18n/en.json` → `i18n/fr.json`, `i18n/ja.json`)
2. **Tệp nội dung** (`content/en/about.md` → `content/en/about.fr.md`, `content/en/about.ja.md`)

### Chi tiết dịch nội dung

Khi dịch Markdown, rosetta sẽ tự động:

- **Bảo vệ** các khối mã (code blocks), shortcodes (`{{< ... >}}`), mã nội tuyến (inline code) và HTML
- **Dịch** các trường front matter (`title`, `description`, `summary`)
- **Giữ nguyên** tất cả các trường front matter khác (`date`, `draft`, `weight`, `tags`)
- **Khôi phục** các khối đã được bảo vệ sau khi dịch

Shortcode của Hugo `{{< team-grid >}}` được giữ nguyên không dịch.

## Bước 5: Xác minh

```bash
# Preview the site
hugo server

# Check translation status
npx i18n-rosetta status
```

Truy cập vào `localhost:1313/fr/` và `localhost:1313/ja/` để xem lại nội dung đã dịch.

## Bước 6: Trình chuyển đổi ngôn ngữ Hugo

Thêm trình chuyển đổi ngôn ngữ vào layout Hugo của bạn:

```html title="layouts/partials/language-switcher.html"
<nav class="language-switcher">
  {{ range $.Site.Home.AllTranslations }}
    <a href="{{ .Permalink }}"
       {{ if eq .Lang $.Site.Language.Lang }}class="active"{{ end }}>
      {{ .Language.LanguageName }}
    </a>
  {{ end }}
</nav>
```

## Giữ nội dung luôn đồng bộ

Khi bạn cập nhật nội dung tiếng Anh, hãy chạy lại đồng bộ. Rosetta chỉ dịch lại các tệp đã thay đổi:

```bash
# Edit content/en/about.md, then:
npx i18n-rosetta sync
```

Tệp lock theo dõi các mã băm (hash) nội dung của từng tệp, vì vậy các trang không có thay đổi sẽ không bị dịch lại.

## Xem thêm

- **[Hướng dẫn dịch nội dung](/docs/guides/content-translation)** — Tìm hiểu sâu về bảo vệ nội dung, front matter và các trường hợp ngoại lệ
- **[Tích hợp Framework](/docs/guides/framework-integration)** — Thiết lập Next.js và React
- **[Hướng dẫn CI/CD](/docs/guides/ci-cd)** — Tự động hóa đồng bộ khi push lên `content/en/`
- **[Các phương pháp dịch](/docs/guides/translation-methods)** — So sánh các chiến lược dịch LLM, TM và kết hợp (hybrid)
- **[Ngôn ngữ được hỗ trợ](/docs/reference/supported-languages)** — Danh sách đầy đủ các locale và mã ngôn ngữ được hỗ trợ