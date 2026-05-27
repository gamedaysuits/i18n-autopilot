---
sidebar_position: 3
title: "CI/CD"
---
# Tích hợp CI/CD

Tự động hóa các bản dịch trong build pipeline của bạn.

## GitHub Actions: Đồng bộ khi Push

Thêm đồng bộ bản dịch vào build pipeline hiện tại của bạn:

```yaml title=".github/workflows/deploy.yml"
jobs:
  build:
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - name: Sync translations
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
        run: npx i18n-rosetta sync
      - run: npm run build
```

## GitHub Actions: Đồng bộ theo lịch trình

Chạy các bản dịch theo lịch trình và tự động commit:

```yaml title=".github/workflows/i18n-sync.yml"
name: Sync translations
on:
  schedule:
    - cron: '0 6 * * *'
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - name: Sync translations
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
        run: npx i18n-rosetta sync
      - name: Commit updated translations
        run: |
          git config user.name "i18n-rosetta"
          git config user.email "bot@example.com"
          git add i18n/ content/ locales/ messages/
          git diff --staged --quiet || git commit -m "chore: sync translations"
          git push
```

## Phương thức Google Translate

Nếu sử dụng phương thức Google Translate tích hợp sẵn thay vì OpenRouter:

```yaml
- name: Sync translations
  env:
    GOOGLE_TRANSLATE_API_KEY: ${{ secrets.GOOGLE_TRANSLATE_API_KEY }}
  run: npx i18n-rosetta sync
```

## Các nhà cung cấp LLM trực tiếp

Nếu sử dụng trực tiếp các phương thức `openai`, `anthropic`, hoặc `gemini`:

```yaml
# OpenAI
- name: Sync translations
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  run: npx i18n-rosetta sync --method openai

# Anthropic
- name: Sync translations
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  run: npx i18n-rosetta sync --method anthropic

# Gemini (free tier available)
- name: Sync translations
  env:
    GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
  run: npx i18n-rosetta sync --method gemini
```

## DeepL

```yaml
- name: Sync translations
  env:
    DEEPL_API_KEY: ${{ secrets.DEEPL_API_KEY }}
  run: npx i18n-rosetta sync --method deepl
```

## Remote Translation API

Nếu sử dụng một endpoint dịch thuật từ xa (ví dụ: một dịch vụ dịch thuật được host):

```yaml
- name: Sync translations
  env:
    ROSETTA_API_KEY: ${{ secrets.ROSETTA_API_KEY }}
  run: npx i18n-rosetta sync
```

## CI Pipeline 3 Lớp

Để có độ phủ i18n tối đa, hãy kiểm soát pipeline của bạn bằng cả ba công cụ:

```yaml
jobs:
  i18n:
    steps:
      - uses: actions/checkout@v4
      - run: npm ci

      # 1. Catch hardcoded strings before they ship
      - run: npx i18n-rosetta lint

      # 2. Translate missing keys
      - run: npx i18n-rosetta sync
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}

      # 3. Fail if any locale is incomplete
      - run: npx i18n-rosetta audit
```

| Lớp | Lệnh | Khi nào | Mục đích |
|-------|---------|------|---------|
| **Lint** | `lint` | Pre-commit | Chặn các commit có chứa chuỗi hardcode |
| **Sync** | `sync` | Post-commit / CI | Dịch các key bị thiếu và đã thay đổi |
| **Audit** | `audit` | Build step | Báo lỗi deployment nếu có bất kỳ locale nào chưa hoàn chỉnh |

:::tip Translation Memory trong CI
Nếu CI runner của bạn có một workspace cố định (hoặc cache `.rosetta/`), Translation Memory sẽ tự động được kích hoạt — các lần đồng bộ tiếp theo chỉ dịch những key có văn bản nguồn thực sự thay đổi. Đối với các runner tạm thời, hãy cân nhắc việc cache `.rosetta/tm.json` giữa các lần chạy:

```yaml
- uses: actions/cache@v4
  with:
    path: .rosetta/tm.json
    key: rosetta-tm-${{ hashFiles('locales/en.json') }}
    restore-keys: rosetta-tm-
```
:::

---

## Xem thêm

- [Tham khảo CLI](/docs/reference/cli) — tham khảo toàn bộ các lệnh
- [Cách Sync hoạt động](/docs/concepts/how-sync-works) — hiểu về đồng bộ tăng dần
- [Translation Memory](/docs/concepts/translation-memory) — caching và tiết kiệm chi phí
- [Các phương thức dịch thuật](/docs/guides/translation-methods) — lựa chọn phương thức cho từng cặp ngôn ngữ
- [Quality Gate](/docs/concepts/quality-gate) — điều gì xảy ra khi bản dịch bị lỗi
- [Cấu hình](/docs/getting-started/configuration) — tham khảo cấu hình