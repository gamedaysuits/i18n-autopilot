---
sidebar_position: 3
title: "เว็บไซต์หลายภาษาของ Hugo"
description: "คู่มือ: การตั้งค่าเว็บไซต์หลายภาษาของ Hugo แบบเต็มรูปแบบด้วย i18n-rosetta สำหรับจัดการแปลทั้ง string files และเนื้อหา Markdown"
---
# Cookbook: เว็บไซต์หลายภาษาด้วย Hugo

ตั้งค่าระบบหลายภาษาของ Hugo ด้วย i18n-rosetta ซึ่งจัดการทั้งไฟล์สตริง JSON และการแปลเนื้อหา Markdown โดยครอบคลุมเวิร์กโฟลว์ทั้งหมดตั้งแต่การตั้งค่าโปรเจกต์ไปจนถึงการนำไปใช้งานจริงบนโปรดักชัน

**สิ่งที่คุณจะสร้าง:** เว็บไซต์ Hugo ที่มีภาษาอังกฤษ ฝรั่งเศส และญี่ปุ่น — การแปลสตริงผ่านไฟล์ locale และการแปลเนื้อหาผ่านการประมวลผล Markdown

---

## โครงสร้างโปรเจกต์

Rosetta ใช้โหมดการแปลแบบ **filename-based** (อิงตามชื่อไฟล์) ของ Hugo ไฟล์ที่แปลแล้วจะถูกวางไว้ในไดเรกทอรีเดียวกับไฟล์ต้นฉบับ โดยมีการเพิ่มคำต่อท้ายภาษาในชื่อไฟล์ (เช่น `about.fr.md`):

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

:::note โหมด i18n ของ Hugo
Hugo รองรับกลยุทธ์การแปลสองแบบ: **filename-based** (อิงตามชื่อไฟล์ เช่น `about.fr.md` อยู่ถัดจาก `about.md`) และ **directory-based** (อิงตามไดเรกทอรี โดยแยกโครงสร้าง `content/fr/about.md`) Rosetta ใช้การแปลแบบ filename-based เนื่องจากฟังก์ชัน `getTargetContentPath()` จะสร้างพาธเป้าหมายโดยการต่อท้ายรหัสภาษาเข้ากับชื่อไฟล์ต้นฉบับ โปรดตรวจสอบให้แน่ใจว่า `hugo.toml` ของคุณได้รับการตั้งค่าสำหรับการแปลแบบ filename-based เมื่อใช้งาน rosetta
:::

## ขั้นตอนที่ 1: กำหนดค่า Hugo

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

## ขั้นตอนที่ 2: กำหนดค่า Rosetta

Rosetta จำเป็นต้องมีการกำหนดค่าสองส่วน: พาธของไฟล์ locale (สำหรับสตริง JSON) และไดเรกทอรีเนื้อหา (สำหรับ Markdown)

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

## ขั้นตอนที่ 3: สร้างเนื้อหาต้นฉบับ

### การแปลสตริง (i18n/)

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

### เนื้อหา Markdown (content/en/)

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

## ขั้นตอนที่ 4: รันการซิงค์

```bash
npx i18n-rosetta sync
```

Rosetta จะประมวลผลทั้งสองประเภท:

1. **ไฟล์สตริง** (`i18n/en.json` → `i18n/fr.json`, `i18n/ja.json`)
2. **ไฟล์เนื้อหา** (`content/en/about.md` → `content/en/about.fr.md`, `content/en/about.ja.md`)

### รายละเอียดการแปลเนื้อหา

เมื่อแปล Markdown rosetta จะดำเนินการสิ่งเหล่านี้โดยอัตโนมัติ:

- **ปกป้อง (Shields)** บล็อกโค้ด, shortcodes (`{{< ... >}}`), โค้ดอินไลน์ และ HTML
- **แปล** ฟิลด์ front matter (`title`, `description`, `summary`)
- **คงไว้ซึ่ง** ฟิลด์ front matter อื่นๆ ทั้งหมด (`date`, `draft`, `weight`, `tags`)
- **กู้คืน** บล็อกที่ได้รับการปกป้องหลังจากแปลเสร็จสิ้น

shortcode ของ Hugo `{{< team-grid >}}` จะถูกส่งผ่านโดยไม่มีการแปล

## ขั้นตอนที่ 5: ตรวจสอบ

```bash
# Preview the site
hugo server

# Check translation status
npx i18n-rosetta status
```

ไปที่ `localhost:1313/fr/` และ `localhost:1313/ja/` เพื่อตรวจสอบเนื้อหาที่แปลแล้ว

## ขั้นตอนที่ 6: ตัวสลับภาษาของ Hugo

เพิ่มตัวสลับภาษาในเลย์เอาต์ Hugo ของคุณ:

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

## การรักษาเนื้อหาให้ซิงค์กัน

เมื่อคุณอัปเดตเนื้อหาภาษาอังกฤษ ให้รันการซิงค์อีกครั้ง Rosetta จะแปลเฉพาะไฟล์ที่มีการเปลี่ยนแปลงเท่านั้น:

```bash
# Edit content/en/about.md, then:
npx i18n-rosetta sync
```

ไฟล์ lock จะติดตามแฮชเนื้อหาของแต่ละไฟล์ ดังนั้นหน้าเพจที่ไม่มีการเปลี่ยนแปลงจะไม่ถูกนำมาแปลใหม่

## ดูเพิ่มเติม

- **[คู่มือการแปลเนื้อหา](/docs/guides/content-translation)** — เจาะลึกเกี่ยวกับการปกป้องโค้ด (shielding), front matter และกรณีเฉพาะต่างๆ
- **[การรวมเข้ากับเฟรมเวิร์ก](/docs/guides/framework-integration)** — การตั้งค่า Next.js และ React
- **[คู่มือ CI/CD](/docs/guides/ci-cd)** — ซิงค์อัตโนมัติเมื่อพุชไปยัง `content/en/`
- **[วิธีการแปล](/docs/guides/translation-methods)** — เปรียบเทียบกลยุทธ์การแปลแบบ LLM, TM และแบบไฮบริด
- **[ภาษาที่รองรับ](/docs/reference/supported-languages)** — รายการ locale และรหัสภาษาที่รองรับทั้งหมด