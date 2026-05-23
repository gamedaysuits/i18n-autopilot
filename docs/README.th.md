# i18n-rosetta

[![npm version](https://img.shields.io/npm/v/i18n-rosetta.svg)](https://www.npmjs.com/package/i18n-rosetta)
[![CI](https://github.com/gamedaysuits/i18n-rosetta/actions/workflows/ci.yml/badge.svg)](https://github.com/gamedaysuits/i18n-rosetta/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

🌐 **README translations** — *แปลโดย rosetta, แน่นอน:*
[Français](docs/README.fr.md) · [Deutsch](docs/README.de.md) · [Español](docs/README.es.md) · [Português](docs/README.pt.md) · [Nederlands](docs/README.nl.md) · [日本語](docs/README.ja.md) · [한국어](docs/README.ko.md) · [简体中文](docs/README.zh.md) · [ไทย](docs/README.th.md) · [Tiếng Việt](docs/README.vi.md) · [Filipino](docs/README.fil.md) · [العربية](docs/README.ar.md)

แปลไฟล์ locale ของคุณด้วยคำสั่งเดียว:

```bash
npx i18n-rosetta sync
```

Rosetta จะตรวจจับไฟล์ locale, รูปแบบ และภาษาเป้าหมายของคุณโดยอัตโนมัติ มันจะแปลคีย์ที่ขาดหายไป ข้ามส่วนที่แปลแล้ว และเขียนผลลัพธ์ แค่นั้นเอง

## ทำไมไม่เขียนสคริปต์เอง?

คุณสามารถเขียนสคริปต์สั้นๆ ที่วนลูปคีย์ภาษาอังกฤษของคุณและเรียกใช้ Google Translate นักพัฒนาส่วนใหญ่ทำเช่นนั้น — ใช้เวลาประมาณ 30 บรรทัด นี่คือเหตุผลที่มันพัง:

- **ไม่มีการตรวจจับการเปลี่ยนแปลง** เมื่อคุณอัปเดตสตริงภาษาอังกฤษ การแปลจะค้างอยู่ตลอดไป Rosetta ติดตามค่าต้นฉบับทุกค่าด้วยแฮช SHA-256 และแปลซ้ำเฉพาะส่วนที่เปลี่ยนแปลงเท่านั้น
- **ไม่มีการจัดกลุ่ม** การเรียก API หนึ่งครั้งต่อคีย์หมายถึง 200 คีย์ = 200 รอบ Rosetta จัดกลุ่มอย่างชาญฉลาด (กำหนดค่าได้, ค่าเริ่มต้น 30 คีย์/กลุ่มสำหรับ LLM, 128 สำหรับ Google)
- **ไม่มีการตรวจสอบคุณภาพ** การแปลด้วยเครื่องอาจสร้างข้อมูลที่ไม่ถูกต้อง, สะท้อนแหล่งที่มากลับมา, หรือส่งออกในสคริปต์ที่ไม่ถูกต้อง Rosetta ตรวจสอบทุกการแปลก่อนที่จะเขียน — สคริปต์ที่ไม่ถูกต้อง, ความยาวที่เพิ่มขึ้น, และการสะท้อนแหล่งที่มาจะถูกตรวจจับและปฏิเสธ
- **ไม่มีการรับรู้รูปแบบ** กำหนดค่าตายตัวเป็น JSON? Rosetta รองรับ JSON, TOML, YAML และ Hugo Markdown (ส่วนหน้า + เนื้อหา) พร้อมการตรวจจับอัตโนมัติ
- **ไม่มีความปลอดภัย** Rosetta ป้องกันการปนเปื้อนโปรโตไทป์, การเดินทางผ่านพาธผ่านรหัส locale ที่สร้างขึ้น, และความเสียหายของบล็อกโค้ดระหว่างการแปล Markdown

Rosetta คือเวอร์ชันที่ใช้งานจริงของสคริปต์นั้น

## เริ่มต้นอย่างรวดเร็ว

```bash
npm install --save-dev i18n-rosetta
```

### รับ API Key

Rosetta ต้องการแบ็กเอนด์การแปล เลือกหนึ่งตัว:

| ผู้ให้บริการ | คีย์ | เหมาะที่สุดสำหรับ |
|----------|-----|----------|
| **OpenRouter** (แนะนำ) | `OPENROUTER_API_KEY` | โปรเจกต์ที่มีเนื้อหามาก, Markdown, 200+ โมเดล |
| **OpenAI** | `OPENAI_API_KEY` | การเข้าถึง GPT-4o โดยตรง |
| **Anthropic** | `ANTHROPIC_API_KEY` | การเข้าถึง Claude โดยตรง |
| **Gemini** | `GEMINI_API_KEY` | มี Free tier ให้บริการ |
| **DeepL** | `DEEPL_API_KEY` | ภาษาในยุโรป, รองรับอภิธานศัพท์ |
| **Google Translate** | `GOOGLE_TRANSLATE_API_KEY` | 130+ ภาษา, ปริมาณมาก |

**เริ่มต้นได้เร็วที่สุด** (ฟรี): สมัครที่ [aistudio.google.com](https://aistudio.google.com/apikey) เพื่อรับคีย์ Gemini ฟรี:

```bash
export GEMINI_API_KEY=AI...
npx i18n-rosetta sync --method gemini
```

**OpenRouter** (200+ โมเดล): สมัครที่ [openrouter.ai](https://openrouter.ai) จากนั้น:

```bash
export OPENROUTER_API_KEY=sk-or-v1-...
npx i18n-rosetta sync
```

ทางเลือก **Google Translate** (เฉพาะคู่คีย์-ค่า — ไม่รับรู้ Markdown):

```bash
export GOOGLE_TRANSLATE_API_KEY=...
npx i18n-rosetta sync --method google-translate
```

> **หมายเหตุ**: หากตั้งค่าเฉพาะ `GOOGLE_TRANSLATE_API_KEY`, rosetta จะสลับไปใช้ Google Translate โดยอัตโนมัติ ไม่จำเป็นต้องเปลี่ยนการกำหนดค่า ใช้ REST API โดยตรง — ไม่มี SDK, ไม่มีบัญชีบริการ, ไม่มี `pip install` แค่คีย์เท่านั้น

แค่นั้นเอง สำหรับการควบคุมที่มากขึ้น ให้สร้างไฟล์การกำหนดค่า:

```bash
npx i18n-rosetta init                        # guided wizard — walks you through registers, methods, and content
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific languages and default registers
```

แต่ละภาษามี **register presets** — คำแนะนำโทน/ความเป็นทางการที่สร้างไว้ล่วงหน้าซึ่งปรับให้เข้ากับระบบภาษาของมัน (vouvoiement สำหรับภาษาฝรั่งเศส, Siezen สำหรับภาษาเยอรมัน, です/ます สำหรับภาษาญี่ปุ่น, 해요체 สำหรับภาษาเกาหลี) วิซาร์ดเริ่มต้นช่วยให้คุณสามารถเรียกดูและเลือก presets หรือส่ง `--yes` เพื่อยอมรับค่าเริ่มต้น

### แหล่งที่มาที่ไม่ใช่ภาษาอังกฤษ

หากภาษาต้นฉบับของคุณไม่ใช่ภาษาอังกฤษ:

```bash
i18n-rosetta sync --source fr                      # CLI flag
```

หรือตั้งค่าถาวรในไฟล์กำหนดค่าของคุณ:

```json
{ "inputLocale": "fr" }
```

## สิ่งที่มันทำ

คุณจัดการเฟรมเวิร์ก i18n (next-intl, i18next, Hugo) Rosetta จัดการไฟล์การแปล

- **หลายรูปแบบ** — JSON, TOML, YAML และ Hugo Markdown (ส่วนหน้า + เนื้อหา)
- **เพิ่มขึ้น** — แปลเฉพาะส่วนที่เปลี่ยนแปลงเท่านั้น (การติดตามแฮช SHA-256)
- **มีการตรวจสอบคุณภาพ** — ตรวจสอบทุกการแปล: ตรวจจับการสร้างข้อมูลที่ไม่ถูกต้อง, ผลลัพธ์สคริปต์ที่ไม่ถูกต้อง, การสะท้อนแหล่งที่มา และความยาวที่เพิ่มขึ้น
- **รับรู้เนื้อหา** — วิธีการ LLM ป้องกันบล็อกโค้ด, ชอร์ตโค้ด, ลิงก์ และตัวแปรการแทรกระหว่างการแปล Markdown
- **เครื่องมือ Pipeline** — `lint`, `audit`, `integrity`, `seo` สำหรับ CI gates
- **ไม่มีการพึ่งพา** — เฉพาะ Node.js built-ins ไม่มี SDKs, ไม่มีโมดูลเนทีฟ ต้องใช้ Node 20+

## นอกเหนือจาก Google Translate

การเริ่มต้นอย่างรวดเร็วจะช่วยให้คุณใช้งาน LLM หรือ Google Translate ได้ แต่ Google Translate รองรับประมาณ 130 ภาษา มีมากกว่า 7,000 ภาษา

**แนวคิดหลักของ Rosetta: วิธีการแปลสามารถกำหนดค่าได้สำหรับแต่ละคู่ภาษา** ใช้ Google Translate สำหรับภาษาฝรั่งเศส, LLM พร้อมการฝึกสอนทางสัณฐานวิทยาสำหรับภาษา Plains Cree, และ API ที่โฮสต์โดยชุมชนสำหรับภาษา Quechua — ทั้งหมดในโปรเจกต์เดียวกัน ทั้งหมดด้วย CLI เดียวกัน

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

หากคุณสามารถหาวิธีแปลคู่ภาษาได้ — ไม่ว่าจะผ่าน prompt engineering, พจนานุกรมชุมชน, FST pipelines หรือโมเดลที่ปรับแต่งแล้ว — rosetta จะช่วยให้คุณสามารถบรรจุวิธีการนั้นเป็นปลั๊กอินและปรับใช้พร้อมกับทุกสิ่งทุกอย่าง

> เกิดจากการแปลเว็บไซต์ที่ใช้งานจริงเป็นภาษา Plains Cree ซึ่งไม่มี API สำเร็จรูป สถาปัตยกรรมแบบคู่ไม่ใช่เชิงทฤษฎี — มันมีอยู่เพราะโปรเจกต์หนึ่งต้องการ Google Translate สำหรับภาษาฝรั่งเศสและ FST pipeline ที่ได้รับการฝึกสอนสำหรับภาษาพื้นเมือง โดยทำงานควบคู่กันในคำสั่งซิงค์เดียวกัน

[MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness) ที่มาพร้อมกันช่วยให้คุณสามารถเปรียบเทียบและประเมินวิธีการแปล จากนั้นส่งออกวิธีการที่ใช้งานได้เป็นปลั๊กอิน rosetta ใครก็ตามที่พูดได้ทั้งสองภาษาสามารถพัฒนา ทดสอบ และแบ่งปันวิธีการแปลได้ — ไม่จำเป็นต้องมีแพลตฟอร์มที่เป็นกรรมสิทธิ์

### เลือกวิธีการของคุณ

Rosetta รองรับ 10 วิธีการแปล แต่ละคู่ภาษาสามารถใช้วิธีการที่แตกต่างกันได้

**ผู้ให้บริการ LLM** — ดีที่สุดสำหรับคุณภาพ, รับรู้ Markdown, เข้ากันได้กับการฝึกสอน:

| วิธีการ | คีย์ | สิ่งที่มันทำ |
|--------|-----|-------------|
| `llm` (ค่าเริ่มต้น) | `OPENROUTER_API_KEY` | LLM ผ่าน OpenRouter — 200+ โมเดล, การกำหนดเส้นทางอัตโนมัติ |
| `llm-coached` | `OPENROUTER_API_KEY` | LLM + กฎไวยากรณ์, พจนานุกรม, บันทึกสไตล์ |
| `openai` | `OPENAI_API_KEY` | OpenAI API โดยตรง (gpt-4o, gpt-4o-mini) |
| `anthropic` | `ANTHROPIC_API_KEY` | Anthropic API โดยตรง (Claude Sonnet, Haiku, Opus) |
| `gemini` | `GEMINI_API_KEY` | Google Gemini API โดยตรง (Flash, Pro) — มี Free tier ให้บริการ |

**MT แบบดั้งเดิม** — ดีที่สุดสำหรับความเร็ว, ต้นทุน, และคู่คีย์-ค่าปริมาณมาก:

| วิธีการ | คีย์ | สิ่งที่มันทำ |
|--------|-----|-------------|
| `google-translate` | `GOOGLE_TRANSLATE_API_KEY` | Google Cloud Translation API v2 (130+ ภาษา) |
| `deepl` | `DEEPL_API_KEY` | DeepL API พร้อมรองรับอภิธานศัพท์ (30+ ภาษา) |
| `microsoft-translator` | `MICROSOFT_TRANSLATOR_API_KEY` | Azure Cognitive Services Translator (100+ ภาษา) |
| `libretranslate` | *(โฮสต์เอง)* | LibreTranslate ที่โฮสต์เอง (AGPL, ฟรี) |

**โครงสร้างพื้นฐาน** — สำหรับปลายทางที่กำหนดเองหรือโฮสต์โดยชุมชน:

| วิธีการ | คีย์ | สิ่งที่มันทำ |
|--------|-----|-------------|
| `api` | *(ต่อผู้ให้บริการ)* | ไคลเอนต์ HTTP แบบบางสำหรับปลายทาง REST ใดๆ |

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

> **หมายเหตุ**: วิธีการ MT แบบดั้งเดิม (Google Translate, DeepL, Microsoft Translator, LibreTranslate) จัดการคู่คีย์-ค่าได้ดี แต่ไม่สามารถแปลเนื้อหา Markdown ได้อย่างปลอดภัย สำหรับโปรเจกต์ที่มีเนื้อหามาก แนะนำวิธีการ LLM — พวกมันป้องกันบล็อกโค้ด, ชอร์ตโค้ด และตัวแปรการแทรกอย่างชัดเจน

## ปลั๊กอิน

ปลั๊กอินคือสูตรการแปลที่บรรจุไว้ล่วงหน้าสำหรับคู่ภาษาเฉพาะ พวกมันคือ JSON manifests — ไม่ใช่โค้ด — ที่บอก rosetta ว่าจะใช้วิธีการใด ด้วยการตั้งค่าใด และคุณภาพใดที่ได้รับการเปรียบเทียบ

```bash
i18n-rosetta plugin install ./french-formal-v1/    # install from directory
i18n-rosetta plugin list                           # see installed plugins
i18n-rosetta plugin remove french-formal-v1        # uninstall
i18n-rosetta status                                # shows quality tiers + benchmarks
```

ดู [docs/METHOD_PLUGIN_SPEC.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/METHOD_PLUGIN_SPEC.md) สำหรับรูปแบบ manifest

## คำสั่ง

| คำสั่ง | วัตถุประสงค์ |
|---------|---------|
| `init` | วิซาร์ดการตั้งค่าแบบโต้ตอบ (หรือ `--yes` สำหรับค่าเริ่มต้นอย่างรวดเร็ว) |
| `sync` | แปลและซิงค์ไฟล์ locale ทั้งหมด |
| `watch` | ซิงค์อัตโนมัติเมื่อไฟล์มีการเปลี่ยนแปลง |
| `audit` | ตั้งค่าสถานะ locale ที่ไม่สมบูรณ์ (CI gate) |
| `lint` | ค้นหาสตริงที่ฮาร์ดโค้ดในซอร์สโค้ด |
| `wrap` | ห่อสตริงที่ฮาร์ดโค้ดโดยอัตโนมัติใน `t()` calls (พร้อมเลิกทำ) |
| `seo` | สร้าง hreflang, sitemap.xml หรือ JSON-LD schema |
| `integrity` | ตรวจสอบความเสียหายของ placeholder และปัญหาการเข้ารหัส |
| `status` | แสดงการกำหนดค่าคู่, วิธีการ, registers และระดับคุณภาพ |
| `provenance` | ตรวจสอบการอนุญาตทรัพยากรการแปล |
| `plugin` | ติดตั้ง, ลบ หรือแสดงรายการปลั๊กอินวิธีการ |

เรียกใช้ `i18n-rosetta <command> --help` เพื่อดูความช่วยเหลือโดยละเอียดเกี่ยวกับคำสั่งใดๆ

ข้อมูลอ้างอิงฉบับเต็ม: [docs/CLI_REFERENCE.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/CLI_REFERENCE.md)

## การกำหนดค่า

สร้าง `i18n-rosetta.config.json` หรือเรียกใช้ `i18n-rosetta init`:

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

| ตัวเลือก | ค่าเริ่มต้น | คำอธิบาย |
|--------|---------|-------------|
| `inputLocale` | `"en"` | รหัสภาษาต้นฉบับ |
| `localesDir` | `"./locales"` | พาธไปยังไฟล์ locale |
| `contentDir` | `null` | ไดเรกทอรีเนื้อหา Hugo (เปิดใช้งานการแปล Markdown) |
| `format` | `"auto"` | รูปแบบไฟล์: `json`, `toml`, `yaml`, หรือ `auto` |
| `model` | `"google/gemini-3.5-flash"` | โมเดล OpenRouter เริ่มต้น |
| `defaultMethod` | `"llm"` | วิธีการแปลเริ่มต้น (ถูกแทนที่ด้วยแฟล็ก `--method`) |
| `batchSize` | `30` | คีย์ต่อชุดการแปล |
| `pairs` | `{}` | การแทนที่วิธีการ, โมเดล และคุณภาพต่อคู่ |

**การแทนที่ต่อภาษา**: แต่ละภาษามี [Language Card](docs/planning/LANGUAGE_CARD_SPEC.md) พร้อม registers ที่ตั้งค่าไว้ล่วงหน้าซึ่งปรับให้เข้ากับระบบความเป็นทางการของภาษานั้น ใช้คีย์ preset เป็นคำย่อ หรือเขียนข้อความ register ที่กำหนดเอง:

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

**โหมด Zero-config**: ไม่มีไฟล์กำหนดค่า? Rosetta จะตรวจจับไฟล์ locale, รูปแบบ และภาษาเป้าหมายจากโปรเจกต์ของคุณโดยอัตโนมัติ

ค่าภาษาอาจเป็นคีย์ preset (เช่น `"casual-tu"`), ข้อความ register ที่กำหนดเอง หรือออบเจกต์ (ควบคุมได้เต็มที่) การแทนที่ระดับคู่ใน `pairs` จะมีความสำคัญเหนือกว่าการตั้งค่าระดับภาษา เรียกใช้ `npx i18n-rosetta init` เพื่อเรียกดู presets ที่มีอยู่สำหรับแต่ละภาษา

คู่มือการตั้งค่าเฟรมเวิร์ก: [docs/INTEGRATION_GUIDES.md](https://github.com/gamedaysuits/i18n-rosetta/blob/main/docs/INTEGRATION_GUIDES.md)

## การเสริมความแข็งแกร่ง

- **Exponential backoff** — 3 ครั้งที่ลองใหม่พร้อม jitter สำหรับข้อผิดพลาด 429/5xx
- **หมดเวลาคำขอ 30 วินาที** — AbortController ป้องกันการค้าง
- **การตรวจสอบการตอบกลับ** — ยอมรับเฉพาะคีย์ที่ถูกส่งเพื่อการแปลเท่านั้น
- **Quality gate** — ตรวจจับลูปการสร้างข้อมูลที่ไม่ถูกต้อง, ผลลัพธ์สคริปต์ที่ไม่ถูกต้อง, ความยาวที่เพิ่มขึ้น และการสะท้อนแหล่งที่มา
- **Retry cascade** — เมื่อการแยกวิเคราะห์ JSON ล้มเหลว, ลองใหม่ชุด → ครึ่งชุด → คีย์แต่ละรายการ (จำกัดงบประมาณผ่าน `maxRetries`)
- **Prompt caching** — การแยกข้อความระบบ/ผู้ใช้ช่วยให้สามารถแคชระดับผู้ให้บริการได้ ลดต้นทุนโทเค็นในหลายชุด
- **Prototype pollution guard** — บล็อก `__proto__`, `constructor`, `prototype`
- **Path containment** — การเขียนไฟล์ได้รับการตรวจสอบให้อยู่ในไดเรกทอรีที่กำหนดค่าไว้
- **Block protection** — บล็อกโค้ด, ชอร์ตโค้ด, HTML ได้รับการป้องกันระหว่างการแปลเนื้อหา
- **Explicit fallback** — `--fallback` เขียน placeholder ที่มีคำนำหน้า `[EN]` เมื่อ API ไม่พร้อมใช้งาน (ซิงค์ใหม่ด้วยคีย์สำหรับการแปลจริง)
- **Partial success** — ชุดที่ล้มเหลวหนึ่งชุดไม่ขัดขวางส่วนที่เหลือ

## การทดสอบ

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

**ไม่มีการพึ่งพา**

## ใบอนุญาต

MIT