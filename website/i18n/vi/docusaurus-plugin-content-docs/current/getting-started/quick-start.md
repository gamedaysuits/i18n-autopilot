---
sidebar_position: 2
title: "Bắt đầu nhanh"
---
# Bắt đầu nhanh

Dịch tệp locale đầu tiên của bạn trong 60 giây.

## 1. Thiết lập các tệp locale của bạn

Tạo một tệp locale nguồn. Rosetta hỗ trợ JSON, TOML và YAML:

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

## 2. Thiết lập API Key của bạn

Chọn một nhà cung cấp và thiết lập key:

```bash
# Option A: OpenRouter (200+ models, recommended)
export OPENROUTER_API_KEY=sk-or-v1-...

# Option B: Gemini (free tier — zero cost to start)
export GEMINI_API_KEY=AI...
```

Nhận Gemini key miễn phí tại [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Nhận OpenRouter key tại [openrouter.ai](https://openrouter.ai).

## 3. Chạy Sync

```bash
npx i18n-rosetta sync
```

:::tip Bạn đang sử dụng Gemini?
Nếu bạn đã chọn Tùy chọn B (Gemini), hãy thêm `--method gemini`:
```bash
npx i18n-rosetta sync --method gemini
```
:::

Rosetta sẽ:
1. Tự động phát hiện `locales/en.json` là tệp nguồn
2. Tìm (hoặc nhắc bạn nhập) các ngôn ngữ đích
3. Dịch tất cả các key
4. Ghi các tệp `locales/fr.json`, `locales/ja.json`, v.v.
5. Tạo `.i18n-rosetta.lock` để theo dõi những gì đã được dịch

## 4. Kiểm tra kết quả

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

## Điều gì xảy ra tiếp theo?

Khi bạn thay đổi một chuỗi nguồn, rosetta sẽ phát hiện sự thay đổi thông qua việc theo dõi mã băm SHA-256 và chỉ dịch lại key đó trong lần sync tiếp theo:

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

Key không thay đổi (`hero.subtitle`) được lấy từ bộ nhớ đệm **Translation Memory** của rosetta — không cần gọi API, không tốn phí. Bộ nhớ đệm được tự động xây dựng trong mỗi lần sync và được lưu trữ tại `.rosetta/tm.json`.

## Tùy chọn: Tạo tệp cấu hình

Để kiểm soát nhiều hơn, hãy tạo một tệp cấu hình:

```bash
npx i18n-rosetta init                         # guided wizard
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific targets
```

Trình hướng dẫn sẽ dẫn dắt bạn qua các **register presets** (cài đặt sẵn về ngữ khí) của từng ngôn ngữ — đây là các hướng dẫn về giọng điệu/độ trang trọng được xây dựng sẵn và tinh chỉnh cho hệ thống ngôn ngữ đó. Tiếng Pháp có các T-V presets (vouvoiement vs tutoiement), tiếng Hàn có các cấp độ nói (해요체 vs 합쇼체 vs 해체), tiếng Nhật có các tùy chọn keigo (です/ます vs 丁寧語).

Hoặc tạo cấu hình thủ công với các preset key:

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

Chạy `npx i18n-rosetta init` để duyệt các preset có sẵn cho từng ngôn ngữ.

## Tùy chọn: Chế độ Watch

Tự động dịch khi tệp nguồn của bạn thay đổi:

```bash
npx i18n-rosetta watch
```

## Các bước tiếp theo

- **[Cấu hình](/docs/getting-started/configuration)** — Tài liệu tham khảo đầy đủ về cấu hình
- **[Phương pháp dịch](/docs/guides/translation-methods)** — Chọn phương pháp phù hợp cho từng cặp ngôn ngữ
- **[Translation Memory](/docs/concepts/translation-memory)** — Cách bộ nhớ đệm giúp bạn tiết kiệm tiền khi chạy lại
- **[Làm việc với dịch giả chuyên nghiệp](/docs/guides/professional-translators)** — Xuất XLIFF để người thật đánh giá
- **[Tích hợp Framework](/docs/guides/framework-integration)** — Hugo, next-intl, react-i18next
- **[CI/CD](/docs/guides/ci-cd)** — Tự động hóa quá trình dịch trong pipeline của bạn
- **[Khắc phục sự cố](/docs/guides/troubleshooting)** — Các vấn đề thường gặp và giải pháp