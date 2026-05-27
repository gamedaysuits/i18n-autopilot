---
sidebar_position: 2
title: "เริ่มต้นใช้งานด่วน"
---
# เริ่มต้นใช้งานอย่างรวดเร็ว

แปลไฟล์ locale แรกของคุณภายใน 60 วินาที

## 1. ตั้งค่าไฟล์ Locale ของคุณ

สร้างไฟล์ locale ต้นทาง Rosetta รองรับ JSON, TOML และ YAML:

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

## 2. ตั้งค่า API Key ของคุณ

เลือกผู้ให้บริการและตั้งค่าคีย์:

```bash
# Option A: OpenRouter (200+ models, recommended)
export OPENROUTER_API_KEY=sk-or-v1-...

# Option B: Gemini (free tier — zero cost to start)
export GEMINI_API_KEY=AI...
```

รับคีย์ Gemini ฟรีได้ที่ [aistudio.google.com/apikey](https://aistudio.google.com/apikey) รับคีย์ OpenRouter ได้ที่ [openrouter.ai](https://openrouter.ai)

## 3. รัน Sync

```bash
npx i18n-rosetta sync
```

:::tip ใช้ Gemini ใช่ไหม?
หากคุณเลือกตัวเลือก B (Gemini) ให้เพิ่ม `--method gemini`:
```bash
npx i18n-rosetta sync --method gemini
```
:::

Rosetta จะทำสิ่งต่อไปนี้:
1. ตรวจหา `locales/en.json` ว่าเป็นไฟล์ต้นทางโดยอัตโนมัติ
2. ค้นหา (หรือแจ้งให้ระบุ) ภาษาปลายทาง
3. แปลคีย์ทั้งหมด
4. เขียนไฟล์ `locales/fr.json`, `locales/ja.json` ฯลฯ
5. สร้าง `.i18n-rosetta.lock` เพื่อติดตามสิ่งที่ได้รับการแปลแล้ว

## 4. ตรวจสอบผลลัพธ์

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

## จะเกิดอะไรขึ้นต่อไป?

เมื่อคุณเปลี่ยนข้อความต้นทาง Rosetta จะตรวจจับการเปลี่ยนแปลงผ่านการติดตามแฮช SHA-256 และทำการแปลใหม่เฉพาะคีย์นั้นในการซิงค์ครั้งถัดไป:

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

คีย์ที่ไม่มีการเปลี่ยนแปลง (`hero.subtitle`) จะถูกดึงมาจากแคช **Translation Memory** ของ Rosetta — ไม่มีการเรียกใช้ API และไม่มีค่าใช้จ่าย แคชนี้จะถูกสร้างขึ้นโดยอัตโนมัติในระหว่างการซิงค์ทุกครั้งและจัดเก็บไว้ที่ `.rosetta/tm.json`

## ทางเลือก: สร้างไฟล์ Config

สำหรับการควบคุมที่มากขึ้น ให้สร้างไฟล์ config:

```bash
npx i18n-rosetta init                         # guided wizard
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific targets
```

วิซาร์ดแนะนำการใช้งานจะพาคุณไปดู **register presets** ของแต่ละภาษา — ซึ่งเป็นคำสั่งกำหนดน้ำเสียง/ระดับความเป็นทางการที่สร้างไว้ล่วงหน้าและปรับแต่งให้เข้ากับระบบภาษาของภาษานั้นๆ ภาษาฝรั่งเศสมีพรีเซ็ต T-V (vouvoiement เทียบกับ tutoiement), ภาษาเกาหลีมีระดับการพูด (해요체 เทียบกับ 합쇼체 เทียบกับ 해체), ภาษาญี่ปุ่นมีตัวเลือก keigo (です/ます เทียบกับ 丁寧語)

หรือสร้าง config ด้วยตนเองโดยใช้คีย์พรีเซ็ต:

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

รัน `npx i18n-rosetta init` เพื่อเรียกดูพรีเซ็ตที่มีให้ใช้งานสำหรับแต่ละภาษา

## ทางเลือก: Watch Mode

แปลอัตโนมัติเมื่อไฟล์ต้นทางของคุณมีการเปลี่ยนแปลง:

```bash
npx i18n-rosetta watch
```

## ขั้นตอนต่อไป

- **[การตั้งค่า](/docs/getting-started/configuration)** — ข้อมูลอ้างอิง config ฉบับเต็ม
- **[วิธีการแปล](/docs/guides/translation-methods)** — เลือกวิธีการที่เหมาะสมสำหรับแต่ละคู่ภาษา
- **[Translation Memory](/docs/concepts/translation-memory)** — วิธีที่แคชช่วยคุณประหยัดเงินในการรันซ้ำ
- **[การทำงานร่วมกับนักแปลมืออาชีพ](/docs/guides/professional-translators)** — ส่งออก XLIFF สำหรับการตรวจสอบโดยมนุษย์
- **[การทำงานร่วมกับ Framework](/docs/guides/framework-integration)** — Hugo, next-intl, react-i18next
- **[CI/CD](/docs/guides/ci-cd)** — ทำให้การแปลในไปป์ไลน์ของคุณเป็นแบบอัตโนมัติ
- **[การแก้ไขปัญหา](/docs/guides/troubleshooting)** — ปัญหาทั่วไปและวิธีแก้ไข