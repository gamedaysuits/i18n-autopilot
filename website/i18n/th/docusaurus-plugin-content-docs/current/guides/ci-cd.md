---
sidebar_position: 3
title: "CI/CD"
---
# การทำงานร่วมกับ CI/CD

ทำให้การแปลภาษาใน build pipeline ของคุณเป็นแบบอัตโนมัติ

## GitHub Actions: ซิงค์เมื่อมีการ Push

เพิ่มการซิงค์การแปลภาษาลงใน build pipeline เดิมของคุณ:

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

## GitHub Actions: ซิงค์ตามกำหนดเวลา

รันการแปลภาษาตามกำหนดเวลาและ auto-commit:

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

## วิธีการใช้ Google Translate

หากใช้วิธีการ Google Translate ที่มีมาให้ในตัวแทนการใช้ OpenRouter:

```yaml
- name: Sync translations
  env:
    GOOGLE_TRANSLATE_API_KEY: ${{ secrets.GOOGLE_TRANSLATE_API_KEY }}
  run: npx i18n-rosetta sync
```

## ผู้ให้บริการ LLM โดยตรง

หากใช้วิธีการ `openai`, `anthropic` หรือ `gemini` โดยตรง:

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

หากใช้ remote translation endpoint (เช่น บริการแปลภาษาที่โฮสต์ไว้):

```yaml
- name: Sync translations
  env:
    ROSETTA_API_KEY: ${{ secrets.ROSETTA_API_KEY }}
  run: npx i18n-rosetta sync
```

## CI Pipeline แบบสามชั้น

เพื่อให้ครอบคลุม i18n มากที่สุด ให้ควบคุม pipeline ของคุณด้วยเครื่องมือทั้งสามนี้:

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

| ชั้น | คำสั่ง | เมื่อใด | วัตถุประสงค์ |
|-------|---------|------|---------|
| **Lint** | `lint` | Pre-commit | บล็อกการ commit ที่มี hardcoded strings |
| **Sync** | `sync` | Post-commit / CI | แปลคีย์ที่ขาดหายไปและมีการเปลี่ยนแปลง |
| **Audit** | `audit` | Build step | ทำให้การ deploy ล้มเหลวหากมี locale ใดไม่สมบูรณ์ |

---

## ดูเพิ่มเติม

- [ข้อมูลอ้างอิง CLI](/docs/reference/cli) — ข้อมูลอ้างอิงคำสั่งแบบเต็ม
- [วิธีการทำงานของการซิงค์](/docs/concepts/how-sync-works) — ทำความเข้าใจการซิงค์แบบ incremental
- [วิธีการแปลภาษา](/docs/guides/translation-methods) — การเลือกวิธีการสำหรับแต่ละคู่ภาษา
- [Quality Gate](/docs/concepts/quality-gate) — จะเกิดอะไรขึ้นเมื่อการแปลล้มเหลว
- [การตั้งค่า](/docs/getting-started/configuration) — ข้อมูลอ้างอิงการตั้งค่า (config)