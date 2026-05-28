---
sidebar_position: 9
title: "คู่มือสำหรับ Agent: การใช้งาน i18n-rosetta"
description: "วิธีที่ AI Agent สามารถติดตั้ง กำหนดค่า และรัน i18n-rosetta เพื่อแปลไฟล์ locale"
---
# คู่มือสำหรับ Agent: การใช้งาน i18n-rosetta

i18n-rosetta เป็นเครื่องมือ CLI ที่ช่วยแปลไฟล์ locale ของแอปพลิเคชันคุณด้วยคำสั่งเดียว คู่มือนี้จัดทำขึ้นสำหรับ AI agent (หรือนักพัฒนาที่ทำงานร่วมกับ AI agent) ที่ต้องการเริ่มต้นจากศูนย์ไปจนถึงการได้ไฟล์ locale ที่แปลเสร็จสมบูรณ์อย่างรวดเร็ว

:::tip คุ้นเคยอยู่แล้วใช่ไหม?
หากคุณต้องการแค่คำสั่ง สามารถข้ามไปที่ [ข้อมูลอ้างอิง CLI](/docs/reference/cli) ได้เลย หากคุณต้องการสร้างและวัดประสิทธิภาพวิธีการแปล โปรดดู [คู่มือสำหรับ Agent ของ Arena](https://mtevalarena.org/docs/getting-started/agent-guide)
:::

---

## การตั้งค่าสภาพแวดล้อม

```bash
# No global install needed — npx runs it directly
npx i18n-rosetta sync
```

**ข้อกำหนด:**
- Node.js 18+
- API key สำหรับผู้ให้บริการแปลภาษาของคุณ

**การตั้งค่า API key** — rosetta ต้องการ key อย่างน้อยหนึ่งรายการ ขึ้นอยู่กับวิธีการแปลที่คุณใช้งาน:

```bash
# Option 1: export (session only)
export OPENROUTER_API_KEY="sk-or-..."        # for llm / llm-coached methods
export GOOGLE_TRANSLATE_API_KEY="AIza..."    # for google-translate method

# Option 2: .env file in your project root (persistent, gitignored)
echo 'OPENROUTER_API_KEY=sk-or-...' > .env
```

Rosetta จะอ่าน `.env` โดยอัตโนมัติ คุณสามารถรับ OpenRouter key ได้ที่ [openrouter.ai/keys](https://openrouter.ai/keys)

---

## การซิงก์ครั้งแรก

Rosetta จะตรวจหาไฟล์ locale, รูปแบบไฟล์ (JSON, TOML, YAML, PO) และภาษาเป้าหมายของคุณโดยอัตโนมัติ:

```bash
npx i18n-rosetta sync
```

**สิ่งที่จะเกิดขึ้น:**
1. โหลด `i18n-rosetta.config.json` (หรือตรวจหาการตั้งค่าอัตโนมัติ)
2. สแกนไฟล์ locale ต้นทางของคุณ และแปลง key ที่ซ้อนทับกันให้เป็นระดับเดียว (flatten)
3. เปรียบเทียบกับ `.i18n-rosetta.lock` (ค่าแฮช SHA-256 ของค่าที่เคยแปลไปแล้ว)
4. ตรวจสอบ `.rosetta/tm.json` เพื่อหาคำแปลที่แคชไว้ (Translation Memory)
5. แปลเฉพาะ **key ที่มีการเปลี่ยนแปลง, ขาดหายไป หรือล้าสมัย** ผ่านวิธีการที่กำหนดค่าไว้
6. รัน Quality Gate (การตรวจสอบ 5 ขั้นตอน) ในทุกๆ คำแปล
7. เขียนคำแปลที่ผ่านการตรวจสอบลงในไฟล์ locale เป้าหมาย
8. อัปเดต lock file และแคช TM

ในการรันซ้ำตามปกติหลังจากเปลี่ยน key เพียงหนึ่งรายการ ขั้นตอนที่ 4 จะดึงข้อมูล 142 key จากแคช และขั้นตอนที่ 5 จะแปลเพียง 1 key นี่คือเหตุผลที่การซิงก์ในครั้งต่อๆ ไปจึงรวดเร็วและประหยัดค่าใช้จ่าย

---

## การกำหนดค่า

สร้าง `i18n-rosetta.config.json` ใน root ของโปรเจกต์คุณ:

```json
{
  "inputLocale": "en",
  "pairs": {
    "en-fr": { "method": "llm-coached" },
    "en-ja": { "method": "google-translate" },
    "en-crk": { "method": "api", "endpoint": "http://localhost:3000/translate" }
  }
}
```

ฟิลด์ที่สำคัญ:

| ฟิลด์ | วัตถุประสงค์ | ค่าเริ่มต้น |
|-------|---------|---------|
| `inputLocale` | ภาษาต้นทาง | `en` |
| `pairs` | การจับคู่ภาษาต้นทาง→เป้าหมาย พร้อมการกำหนดค่าวิธีการแปล | (จำเป็นต้องระบุ) |
| `localesDir` | ตำแหน่งที่เก็บไฟล์ locale | (ตรวจหาอัตโนมัติ) |
| `model` | โมเดล LLM สำหรับวิธีการ `llm`/`llm-coached` | `google/gemini-2.5-flash` |
| `batchSize` | จำนวน key ต่อการเรียก API หนึ่งครั้ง | 80 (LLM), 128 (Google) |
| `jsonConcurrency` | การแปล locale แบบขนานสำหรับ key ของ JSON | 50 |
| `contentConcurrency` | การเรียก API แบบขนานสำหรับการแปลเนื้อหา | 12 |

ข้อมูลอ้างอิงฉบับเต็ม: [การกำหนดค่า](/docs/getting-started/configuration)

---

## วิธีการแปล

| วิธีการ | เมื่อใดที่ควรใช้ | ค่าใช้จ่าย | API key ที่ต้องการ |
|--------|------------|------|---------------|
| **`llm`** | ใช้งานทั่วไป เหมาะสำหรับภาษาที่มีทรัพยากรข้อมูลสูง | ตามจำนวน token (ขึ้นอยู่กับโมเดล) | `OPENROUTER_API_KEY` |
| **`llm-coached`** | เมื่อคุณมีกฎไวยากรณ์/พจนานุกรมสำหรับภาษาเป้าหมาย | ตามจำนวน token + บริบทการโค้ช | `OPENROUTER_API_KEY` |
| **`google-translate`** | ภาษาที่มีทรัพยากรข้อมูลสูงซึ่ง GT ทำงานได้ดี | $20/ล้านตัวอักษร | `GOOGLE_TRANSLATE_API_KEY` |
| **`api`** | ไปป์ไลน์แบบกำหนดเองที่โฮสต์อยู่หลัง HTTP endpoint | กำหนดโดยเซิร์ฟเวอร์ | ไม่มี (endpoint จัดการการตรวจสอบสิทธิ์เอง) |
| **`plugin`** | วิธีการแบบสำเร็จรูปที่ติดตั้งในเครื่อง | แตกต่างกันไป | แตกต่างกันไป |

รายละเอียด: [วิธีการแปล](/docs/guides/translation-methods)

---

## ข้อมูลการโค้ช (Coaching Data)

สำหรับคู่ภาษาแบบ `llm-coached` ข้อมูลการโค้ชจะช่วยนำทาง LLM ด้วยความรู้ทางภาษาศาสตร์ที่ชัดเจน สร้างไฟล์การโค้ช:

```json title="coaching/fr.json"
{
  "grammar_rules": [
    "Use formal register (vous) for all UI text",
    "Adjectives agree in gender and number with the noun"
  ],
  "dictionary": {
    "dashboard": "tableau de bord",
    "settings": "paramètres"
  },
  "style_notes": "Prefer active voice. Avoid anglicisms."
}
```

อ้างอิงไฟล์นี้ในการกำหนดค่าคู่ภาษาของคุณ:

```json
"en-fr": { "method": "llm-coached", "coachingFile": "coaching/fr.json" }
```

Quality Gate จะตรวจสอบว่าคำศัพท์ในพจนานุกรมปรากฏอยู่ในผลลัพธ์จริงๆ — หากมีการละเมิดจะถูกบันทึกเป็นคำเตือน `[TERM]`

รายละเอียด: [ข้อมูลการโค้ช](/docs/concepts/coaching-data)

---

## Quality Gate

ทุกๆ คำแปลจะผ่านการตรวจสอบอัตโนมัติ 5 ขั้นตอนก่อนที่จะถูกเขียนลงดิสก์:

| การตรวจสอบ | สิ่งที่ตรวจจับได้ | ตัวอย่าง |
|-------|----------------|---------|
| **Empty/blank** | โมเดลไม่ส่งคืนค่าใดๆ | `""` |
| **Source echo** | โมเดลส่งคืนอินพุตภาษาอังกฤษโดยไม่มีการเปลี่ยนแปลง | `"Welcome"` สำหรับภาษาญี่ปุ่น |
| **Hallucination loop** | การทำซ้ำของ trigram | `"Qo' Qo' Qo' Qo'"` |
| **Length inflation** | ผลลัพธ์ยาวกว่าต้นทาง 4 เท่าขึ้นไป | ต้นทาง 10 ตัวอักษร → ผลลัพธ์ 50 ตัวอักษร |
| **Script compliance** | ใช้ตัวอักษรผิดประเภทสำหรับ locale นั้น | ข้อความอักษรละตินสำหรับ locale ภาษาอาหรับ |

ข้อผิดพลาดจะถูกบันทึกด้วยคำนำหน้า `[GATE]` จะไม่มีการใช้ค่าสำรองแบบเงียบๆ — หากการแปลล้มเหลว ระบบจะรายงานให้ทราบ ไม่ใช่ยอมรับผลลัพธ์นั้นไปเงียบๆ

รายละเอียด: [Quality Gate](/docs/concepts/quality-gate)

---

## Translation Memory

Rosetta จะแคชคำแปลไว้ใน `.rosetta/tm.json` โดยใช้ข้อความต้นทาง + locale + วิธีการแปล เป็น key ในการซิงก์ครั้งต่อๆ ไป key ที่ไม่มีการเปลี่ยนแปลงจะถูกดึงมาจากแคช — ไม่ต้องเรียก API และไม่มีค่าใช้จ่าย

```
[TM] 142 key(s) served from cache
Translating 3 key(s) to French (llm)... [OK]
```

หากต้องการข้ามการใช้แคชสำหรับการรันหนึ่งครั้ง: `npx i18n-rosetta sync --no-tm`

รายละเอียด: [Translation Memory](/docs/concepts/translation-memory)

---

## ไฟล์ที่ถูกสร้างขึ้น

Rosetta จะสร้างไฟล์หลายไฟล์ในโปรเจกต์ของคุณ คุณควรทราบว่าไฟล์เหล่านี้คืออะไร เพื่อไม่ให้เผลอลบหรือ commit ไฟล์ผิด:

| ไฟล์ | วัตถุประสงค์ | Git? |
|------|---------|------|
| `.i18n-rosetta.lock` | ค่าแฮช SHA-256 ของค่าต้นทางที่แปลแล้ว (ใช้ตรวจจับการเปลี่ยนแปลง) | **ใช่** — ให้ commit ไฟล์นี้ |
| `.i18n-rosetta-content.lock` | เหมือนกัน แต่สำหรับไฟล์เนื้อหา Markdown/MDX | **ใช่** — ให้ commit ไฟล์นี้ |
| `.rosetta/tm.json` | แคช Translation Memory | **ใช่** — ให้ commit ไฟล์นี้ (ช่วยประหยัดค่า API ให้กับทีม) |
| `.rosetta/coaching/` | ไดเรกทอรีข้อมูลการโค้ช | **ใช่** — นี่คือความรู้ทางภาษาศาสตร์ของคุณ |
| `i18n-rosetta.config.json` | การกำหนดค่าโปรเจกต์ | **ใช่** — ให้ commit ไฟล์นี้ |

---

## รูปแบบการใช้งานทั่วไป

**แปลภาษาหนึ่งคู่:**
```bash
npx i18n-rosetta sync --pair en-fr
```

**แปลภาษาทุกคู่ที่กำหนดค่าไว้:**
```bash
npx i18n-rosetta sync
```
Rosetta จะแปลทุก locale แบบขนานกัน ด้วยการแคชของ TM จะมีเพียง key ที่เปลี่ยนแปลงเท่านั้นที่เรียกใช้งาน API

**โหมดเนื้อหา (Markdown/MDX สำหรับ Docusaurus, Hugo ฯลฯ):**
```bash
npx i18n-rosetta sync --content
```
แปลเอกสาร โพสต์บล็อก และไฟล์เนื้อหาไปพร้อมกับ JSON ของ locale ใช้การทำงานแบบขนาน (ค่าเริ่มต้น: เรียก API พร้อมกัน 12 รายการ) สามารถปรับแต่งได้ด้วย `--content-concurrency`

**Dry run (ดูตัวอย่างโดยไม่มีการเขียนไฟล์):**
```bash
npx i18n-rosetta sync --dry-run
```

**บังคับแปล key ที่ระบุใหม่:**
```bash
npx i18n-rosetta sync --force-keys "hero.title,nav.about"
```

**บังคับแปลไฟล์เนื้อหาทั้งหมดใหม่:**
```bash
npx i18n-rosetta sync --force-content
```

**ตรวจสอบสถานะการแปล:**
```bash
npx i18n-rosetta status
```
แสดงความครอบคลุม ระดับคุณภาพ และข้อมูลปลั๊กอินสำหรับแต่ละคู่ภาษา

**ตรวจสอบค่าสำรองที่ยังไม่ได้แปล:**
```bash
npx i18n-rosetta audit
```
แสดงรายการค่าสำรอง `[EN]` ทั้งหมดที่ต้องการการแปล

---

## การแก้ไขปัญหา

| ปัญหา | วิธีแก้ไข |
|---------|-----|
| `OPENROUTER_API_KEY not set` | Export key หรือเพิ่มลงใน `.env` ที่ root ของโปรเจกต์คุณ |
| `No locale files found` | ตั้งค่า `localesDir` ในการกำหนดค่า หรือตรวจสอบให้แน่ใจว่าไฟล์ locale ของคุณตรงตามมาตรฐานการตั้งชื่อ (`en.json`, `fr.json`) |
| `[GATE] Script compliance failed` | locale เป้าหมายของคุณได้รับข้อความอักษรละตินแทนที่จะเป็นตัวอักษรที่คาดหวัง — ลองเปลี่ยนโมเดล หรือเพิ่มข้อมูลการโค้ช |
| `[GATE] Source echo` | โมเดลส่งคืนภาษาอังกฤษโดยไม่มีการเปลี่ยนแปลง — ข้อมูลการโค้ชหรือการเปลี่ยนโมเดลมักจะช่วยแก้ปัญหานี้ได้ |
| คำแปลทั้งหมดถูกแคชไว้ | รันด้วย `--no-tm` เพื่อข้ามการใช้แคช หรือใช้ `--force-keys` สำหรับ key ที่ระบุ |
| ข้อขัดแย้งใน Lock file | `.i18n-rosetta.lock` ใช้ค่าแฮช SHA-256 — ข้อขัดแย้งจากการ merge สามารถแก้ไขได้อย่างปลอดภัยโดยเก็บเวอร์ชันใดเวอร์ชันหนึ่งไว้ จากนั้นรันการซิงก์ใหม่อีกครั้ง |

---

## ขั้นตอนต่อไป

- [เริ่มต้นใช้งานด่วน](/docs/getting-started/quick-start) — คำแนะนำการเริ่มต้นใช้งานแบบครบถ้วน
- [ข้อมูลอ้างอิง CLI](/docs/reference/cli) — ทุกคำสั่งและ flag
- [วิธีการทำงาน](/docs/how-it-works) — อธิบายไปป์ไลน์การซิงก์
- [The Eval Harness Bridge](/docs/guides/bridge) — วิธีที่ rosetta เชื่อมต่อกับ Arena
- **ต้องการสร้างวิธีการแปลของคุณเองใช่ไหม?** ดู [คู่มือสำหรับ Agent ของ Arena](https://mtevalarena.org/docs/getting-started/agent-guide) — สร้างวิธีการ พิสูจน์ว่าใช้งานได้จริง และลุ้นรับรางวัล