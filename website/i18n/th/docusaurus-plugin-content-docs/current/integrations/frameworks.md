# คู่มือการผสานการทำงาน

การตั้งค่าทีละขั้นตอนสำหรับ i18n-rosetta ร่วมกับเฟรมเวิร์กยอดนิยม

---

## การตั้งค่า API Key

ก่อนที่จะผสานการทำงานกับเฟรมเวิร์กใดๆ คุณต้องมี API Key สำหรับการแปลภาษา Rosetta รองรับผู้ให้บริการสองราย:

### ตัวเลือก A: OpenRouter (แนะนำ)

[OpenRouter](https://openrouter.ai) ให้บริการ API แบบรวมศูนย์สำหรับโมเดล LLM มากกว่า 200 โมเดล มีแพ็กเกจใช้งานฟรี

```bash
# Sign up at https://openrouter.ai, then:
export OPENROUTER_API_KEY=sk-or-v1-...

# Or add to .env.local:
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

เหมาะที่สุดสำหรับ: โปรเจกต์ที่มีเนื้อหาจำนวนมาก, การแปล Markdown และโปรเจกต์ที่ต้องการการปกป้องเนื้อหาแบบรับรู้บริบท (code blocks, shortcodes, ตัวแปร interpolation)

### ตัวเลือก B: Google Translate

```bash
export GOOGLE_TRANSLATE_API_KEY=...
```

เหมาะที่สุดสำหรับ: คู่สตริง key-value ปริมาณมาก (รองรับกว่า 130 ภาษา) **ไม่แนะนำ** สำหรับเนื้อหา Markdown — Google Translate ไม่สามารถรับรู้ถึง code blocks, shortcodes หรือตัวแปร interpolation ได้

หากต้องการระบุให้ใช้ Google Translate โดยเฉพาะ:

```bash
i18n-rosetta sync --method google-translate
```

> **เคล็ดลับ**: หากมีการตั้งค่าเพียง `GOOGLE_TRANSLATE_API_KEY` (ไม่มี OpenRouter key) rosetta จะสลับไปใช้ Google Translate โดยอัตโนมัติ

---

## Hugo (TOML / YAML / Markdown)

### โครงสร้างโปรเจกต์

Hugo ใช้ `i18n/` สำหรับการแปลสตริง และ `content/` สำหรับเนื้อหาของหน้า:

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

### การตั้งค่า

```bash
npm install --save-dev i18n-rosetta
```

```bash
# .env.local
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

สร้าง `i18n-rosetta.config.json`:

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

### รายละเอียดการแปลเนื้อหา

**Front matter**: รองรับตัวคั่นทั้งแบบ YAML (`---`) และ TOML (`+++`) โดยจะแปล `title`, `description`, `summary`, `subtitle`, `caption` และ `linkTitle` เป็นค่าเริ่มต้น ฟิลด์อื่นๆ ทั้งหมด (date, draft, tags, weight, slug ฯลฯ) จะถูกคงไว้ตามเดิม คุณสามารถปรับแต่งได้ด้วย `translatableFields` ในไฟล์คอนฟิกของคุณ

**การปกป้องบล็อก**: Code blocks, Hugo shortcodes (`{{< >}}`, `{{% %}}`), inline code และ raw HTML จะถูกปกป้องโดยอัตโนมัติโดยใช้ Unicode sentinel placeholders ซึ่งจะถูกส่งผ่านโดยไม่มีการเปลี่ยนแปลงใดๆ

**รูปแบบการตั้งชื่อไฟล์**: เป็นไปตามรูปแบบการแปลด้วยชื่อไฟล์ของ Hugo:
- `my-post.md` → `my-post.fr.md`
- `my-post.en.md` → `my-post.fr.md` (ตัดคำต่อท้ายของไฟล์ต้นฉบับออก)

**ข้ามไฟล์ที่มีอยู่**: ไฟล์ที่แปลแล้วและมีอยู่เดิมจะไม่มีการเขียนทับ หากต้องการบังคับให้แปลใหม่ ให้ลบไฟล์เป้าหมายนั้นทิ้ง

### รูปพหูพจน์

ไฟล์ locale แบบ TOML และ YAML รองรับรูปพหูพจน์ตามมาตรฐาน CLDR:

```toml
[items]
one = "{{ .Count }} item"
other = "{{ .Count }} items"
```

ในระบบภายในจะแสดงผลเป็น `items.one` และ `items.other` สำหรับการเปรียบเทียบความแตกต่าง (diffing) จากนั้นจะถูกแปลงกลับ (re-serialized) ให้อยู่ในรูปแบบส่วนที่ถูกต้องเมื่อทำการเขียนไฟล์

---

## next-intl (JSON)

### โครงสร้างโปรเจกต์

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

### การตั้งค่า

```bash
npm install --save-dev i18n-rosetta
```

สร้าง `i18n-rosetta.config.json`:

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

ระบบจะสร้าง `messages/fr.json`, `messages/ja.json` ฯลฯ — ซึ่งแปลเสร็จสมบูรณ์ โดยยังคงโครงสร้างคีย์ที่ซ้อนกัน (nested key) ของคุณไว้ next-intl จะนำไปใช้งานโดยอัตโนมัติ

### ขั้นตอนการพัฒนา

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

### โครงสร้างไฟล์แบบแบน (แนะนำ)

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

### โครงสร้างไดเรกทอรีแบบซ้อนกัน

หากคุณใช้โครงสร้างแบบ `{locale}/{namespace}.json` ให้สร้างสคริปต์ซิงก์เพื่อทำ flatten → แปลภาษา → unflatten ดูรายละเอียดเพิ่มเติมได้ที่ [เอกสารประกอบของ react-i18next](https://react.i18next.com/)