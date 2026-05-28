---
sidebar_position: 9
title: "คู่มือสำหรับ Agent: การใช้งาน i18n-rosetta"
description: "วิธีที่ AI Agent สามารถติดตั้ง ตั้งค่า และเรียกใช้งาน i18n-rosetta เพื่อแปลไฟล์ Locale"
---
# คู่มือสำหรับ Agent: การใช้งาน i18n-rosetta

i18n-rosetta เป็นเครื่องมือ CLI ที่ช่วยแปลไฟล์ locale ของแอปพลิเคชันคุณด้วยคำสั่งเดียว คู่มือนี้จัดทำขึ้นสำหรับ AI agent (หรือนักพัฒนาที่ทำงานร่วมกับ AI agent) ที่ต้องการเริ่มต้นจากศูนย์จนได้ไฟล์ locale ที่แปลเสร็จสมบูรณ์อย่างรวดเร็ว

:::tip คุ้นเคยอยู่แล้วใช่ไหม?
หากคุณต้องการแค่คำสั่ง สามารถข้ามไปที่ [CLI Reference](/docs/reference/cli) ได้เลย หากคุณต้องการสร้างและวัดประสิทธิภาพ (benchmark) ของวิธีการแปล โปรดดูที่ [Arena Agent Guide](https://mtevalarena.org/docs/getting-started/agent-guide)
:::

---

## การตั้งค่าสภาพแวดล้อม

```bash
# No global install needed — npx runs it directly
npx i18n-rosetta sync
```

**ข้อกำหนดเบื้องต้น:**
- Node.js 18+
- API key สำหรับผู้ให้บริการการแปลของคุณ

**การตั้งค่า API key** — rosetta ต้องการ key อย่างน้อยหนึ่งรายการ ขึ้นอยู่กับวิธีการที่คุณเลือกใช้:

```bash
# Option 1: export (session only)
export OPENROUTER_API_KEY="sk-or-..."        # for llm / llm-coached methods
export GOOGLE_TRANSLATE_API_KEY="AIza..."    # for google-translate method

# Option 2: .env file in your project root (persistent, gitignored)
echo 'OPENROUTER_API_KEY=sk-or-...' > .env
```

Rosetta จะอ่าน `.env` โดยอัตโนมัติ คุณสามารถรับ OpenRouter key ได้ที่ [openrouter.ai/keys](https://openrouter.ai/keys)

---

## การซิงค์ครั้งแรก

Rosetta จะตรวจหาไฟล์ locale, รูปแบบไฟล์ (JSON, TOML, YAML, PO) และภาษาปลายทางของคุณโดยอัตโนมัติ:

```bash
npx i18n-rosetta sync
```

**สิ่งที่เกิดขึ้น:**
1. โหลด `i18n-rosetta.config.json` (หรือตรวจหาการตั้งค่าอัตโนมัติ)
2. สแกนไฟล์ locale ต้นทางของคุณ และแปลง nested keys ให้อยู่ในระดับเดียวกัน (flatten)
3. เปรียบเทียบกับ `.i18n-rosetta.lock` (SHA-256 hashes ของค่าที่เคยแปลไปแล้ว)
4. ตรวจสอบ `.rosetta/tm.json` เพื่อหาคำแปลที่แคชไว้ (Translation Memory)
5. แปลเฉพาะ **keys ที่มีการเปลี่ยนแปลง, ขาดหายไป หรือล้าสมัย** ผ่านวิธีการที่กำหนดไว้
6. รัน Quality Gate (การตรวจสอบ 5 ขั้นตอน) ในทุกๆ คำแปล
7. เขียนคำแปลที่ผ่านการตรวจสอบลงในไฟล์ locale ปลายทาง
8. อัปเดต lock file และ TM cache

ในการรันซ้ำตามปกติหลังจากเปลี่ยน key หนึ่งตัว ขั้นตอนที่ 4 จะดึง 142 keys จากแคช และขั้นตอนที่ 5 จะแปลเพียง 1 key นี่คือเหตุผลที่การซิงค์ในครั้งต่อๆ ไปจึงรวดเร็วและมีราคาถูก

---

## การตั้งค่า

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
| `pairs` | การจับคู่ ต้นทาง→ปลายทาง พร้อมการตั้งค่า method | (จำเป็น) |
| `localesDir` | ตำแหน่งที่เก็บไฟล์ locale | (ตรวจหาอัตโนมัติ) |
| `model` | โมเดล LLM สำหรับ method `llm`/`llm-coached` | `google/gemini-2.5-flash` |
| `batchSize` | จำนวน keys ต่อการเรียก API หนึ่งครั้ง | 80 (LLM), 128 (Google) |
| `jsonConcurrency` | การแปล locale แบบขนานสำหรับ JSON keys | 200 |
| `contentConcurrency` | การเรียก API แบบขนานสำหรับการแปลเนื้อหา | 48 |

อ้างอิงฉบับเต็ม: [Configuration](/docs/getting-started/configuration)

---

## วิธีการแปล

| วิธีการ | เมื่อใดที่ควรใช้ | ค่าใช้จ่าย | API key ที่ต้องการ |
|--------|------------|------|---------------|
| **`llm`** | ใช้งานทั่วไป เหมาะสำหรับภาษาที่มีข้อมูลอ้างอิงเยอะ | ตามจำนวน token (ขึ้นอยู่กับโมเดล) | `OPENROUTER_API_KEY` |
| **`llm-coached`** | เมื่อคุณมีกฎไวยากรณ์/พจนานุกรมสำหรับภาษาปลายทาง | ตามจำนวน token + บริบทการโค้ช (coaching context) | `OPENROUTER_API_KEY` |
| **`google-translate`** | ภาษาที่มีข้อมูลอ้างอิงเยอะซึ่ง GT ทำงานได้ดี | $20/ล้านตัวอักษร | `GOOGLE_TRANSLATE_API_KEY` |
| **`api`** | ไปป์ไลน์แบบกำหนดเองที่โฮสต์อยู่หลัง HTTP endpoint | กำหนดโดยเซิร์ฟเวอร์ | ไม่มี (endpoint จัดการการยืนยันตัวตนเอง) |
| **`plugin`** | วิธีการแบบสำเร็จรูปที่ติดตั้งในเครื่อง (locally) | แตกต่างกันไป | แตกต่างกันไป |

รายละเอียด: [Translation Methods](/docs/guides/translation-methods)

---

## ข้อมูลการโค้ช

สำหรับคู่ภาษา `llm-coached` ข้อมูลการโค้ชจะช่วยนำทาง LLM ด้วยความรู้ทางภาษาศาสตร์ที่ชัดเจน สร้างไฟล์การโค้ช:

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

อ้างอิงไฟล์นี้ในการตั้งค่าคู่ภาษาของคุณ:

```json
"en-fr": { "method": "llm-coached", "coachingFile": "coaching/fr.json" }
```

Quality Gate จะตรวจสอบว่าคำศัพท์ในพจนานุกรมปรากฏอยู่ในผลลัพธ์จริงๆ — หากมีการละเมิดจะถูกบันทึกเป็นคำเตือน `[TERM]`

รายละเอียด: [Coaching Data](/docs/concepts/coaching-data)

---

## Quality Gate

ทุกๆ คำแปลจะผ่านการตรวจสอบอัตโนมัติ 5 ขั้นตอนก่อนที่จะถูกเขียนลงดิสก์:

| การตรวจสอบ | สิ่งที่ตรวจจับได้ | ตัวอย่าง |
|-------|----------------|---------|
| **ว่างเปล่า (Empty/blank)** | โมเดลไม่ส่งค่าใดๆ กลับมา | `""` |
| **สะท้อนต้นทาง (Source echo)** | โมเดลส่งคืนอินพุตภาษาอังกฤษโดยไม่มีการเปลี่ยนแปลง | `"Welcome"` สำหรับภาษาญี่ปุ่น |
| **ลูปการหลอน (Hallucination loop)** | การทำซ้ำ trigrams | `"Qo' Qo' Qo' Qo'"` |
| **ความยาวเกินจริง (Length inflation)** | ผลลัพธ์ยาวกว่าต้นทาง 4 เท่าขึ้นไป | ต้นทาง 10 ตัวอักษร → ผลลัพธ์ 50 ตัวอักษร |
| **ความถูกต้องของตัวอักษร (Script compliance)** | ใช้ชุดตัวอักษรผิดสำหรับ locale นั้น | ข้อความละตินสำหรับ locale ภาษาอาหรับ |

ข้อผิดพลาดจะถูกบันทึกด้วยคำนำหน้า `[GATE]` จะไม่มีการ fallback แบบเงียบๆ — หากการแปลล้มเหลว ระบบจะรายงานให้ทราบ และไม่ยอมรับผลลัพธ์นั้นอย่างเงียบๆ

รายละเอียด: [Quality Gate](/docs/concepts/quality-gate)

---

## Translation Memory

Rosetta จะแคชคำแปลไว้ใน `.rosetta/tm.json` โดยใช้ข้อความต้นทาง + locale + method เป็น key ในการซิงค์ครั้งต่อๆ ไป keys ที่ไม่มีการเปลี่ยนแปลงจะถูกดึงมาจากแคช — ไม่มีการเรียก API และไม่มีค่าใช้จ่าย

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
| `.i18n-rosetta.lock` | SHA-256 hashes ของค่าต้นทางที่ถูกแปลแล้ว (สำหรับตรวจจับการเปลี่ยนแปลง) | **ใช่** — ให้ commit ไฟล์นี้ |
| `.i18n-rosetta-content.lock` | เหมือนกัน แต่สำหรับไฟล์เนื้อหา Markdown/MDX | **ใช่** — ให้ commit ไฟล์นี้ |
| `.rosetta/tm.json` | แคชของ Translation Memory | **ใช่** — ให้ commit ไฟล์นี้ (ช่วยประหยัดค่า API ให้กับทีม) |
| `.rosetta/coaching/` | ไดเรกทอรีข้อมูลการโค้ช | **ใช่** — นี่คือความรู้ทางภาษาศาสตร์ของคุณ |
| `i18n-rosetta.config.json` | การตั้งค่าโปรเจกต์ | **ใช่** — ให้ commit ไฟล์นี้ |

---

## รูปแบบการใช้งานทั่วไป

**แปลภาษาหนึ่งคู่:**
```bash
npx i18n-rosetta sync --pair en-fr
```

**แปลทุกคู่ภาษาที่ตั้งค่าไว้:**
```bash
npx i18n-rosetta sync
```
Rosetta จะแปลทุก locales แบบขนานกัน ด้วยการแคชของ TM จะมีเพียง keys ที่เปลี่ยนแปลงเท่านั้นที่จะถูกเรียกผ่าน API

**โหมดเนื้อหา (Markdown/MDX สำหรับ Docusaurus, Hugo ฯลฯ):**
```bash
npx i18n-rosetta sync --content
```
แปลเอกสาร, โพสต์บล็อก และไฟล์เนื้อหาควบคู่ไปกับ locale JSON ใช้การทำงานแบบขนาน (ค่าเริ่มต้น: เรียก API พร้อมกัน 48 รายการ) สามารถปรับแต่งได้ด้วย `--content-concurrency`

**Dry run (ดูตัวอย่างโดยไม่เขียนลงไฟล์):**
```bash
npx i18n-rosetta sync --dry-run
```

**บังคับแปลใหม่เฉพาะบาง keys:**
```bash
npx i18n-rosetta sync --force-keys "hero.title,nav.about"
```

**บังคับแปลใหม่สำหรับไฟล์เนื้อหาทั้งหมด:**
```bash
npx i18n-rosetta sync --force-content
```

**ตรวจสอบสถานะการแปล:**
```bash
npx i18n-rosetta status
```
แสดงความครอบคลุม, ระดับคุณภาพ และข้อมูลปลั๊กอินสำหรับแต่ละคู่ภาษา

**ตรวจสอบ fallbacks ที่ยังไม่ได้แปล:**
```bash
npx i18n-rosetta audit
```
แสดงรายการค่า fallback `[EN]` ทั้งหมดที่ต้องได้รับการแปล

---

## การแก้ไขปัญหา

| ปัญหา | วิธีแก้ไข |
|---------|-----|
| `OPENROUTER_API_KEY not set` | Export key หรือเพิ่มลงใน `.env` ที่ root ของโปรเจกต์คุณ |
| `No locale files found` | กำหนด `localesDir` ในการตั้งค่า หรือตรวจสอบให้แน่ใจว่าไฟล์ locale ของคุณตั้งชื่อตามมาตรฐาน (`en.json`, `fr.json`) |
| `[GATE] Script compliance failed` | locale ปลายทางของคุณได้ข้อความละตินแทนที่จะเป็นชุดตัวอักษรที่คาดหวัง — ลองเปลี่ยนโมเดล หรือเพิ่มข้อมูลการโค้ช |
| `[GATE] Source echo` | โมเดลส่งคืนภาษาอังกฤษโดยไม่มีการเปลี่ยนแปลง — ข้อมูลการโค้ชหรือการเปลี่ยนโมเดลมักจะช่วยแก้ปัญหานี้ได้ |
| คำแปลทั้งหมดถูกแคชไว้ | รันด้วย `--no-tm` เพื่อข้ามการใช้แคช หรือใช้ `--force-keys` สำหรับเฉพาะบาง keys |
| Lock file ขัดแย้งกัน (conflicts) | `.i18n-rosetta.lock` ใช้ SHA-256 hashes — การแก้ปัญหา merge conflicts สามารถทำได้อย่างปลอดภัยโดยเลือกเก็บเวอร์ชันใดเวอร์ชันหนึ่งไว้ จากนั้นรันการซิงค์ใหม่อีกครั้ง |

---

## ขั้นตอนต่อไป

- [Quick Start](/docs/getting-started/quick-start) — คำแนะนำการเริ่มต้นใช้งานฉบับสมบูรณ์
- [CLI Reference](/docs/reference/cli) — คำสั่งและ flag ทั้งหมด
- [How It Works](/docs/how-it-works) — คำอธิบายไปป์ไลน์การซิงค์
- [The Eval Harness Bridge](/docs/guides/bridge) — วิธีที่ rosetta เชื่อมต่อกับ Arena
- **ต้องการสร้างวิธีการแปลของคุณเองใช่ไหม?** ดูที่ [Arena Agent Guide](https://mtevalarena.org/docs/getting-started/agent-guide) — สร้างวิธีการ พิสูจน์ว่าใช้งานได้จริง และลุ้นรับรางวัล