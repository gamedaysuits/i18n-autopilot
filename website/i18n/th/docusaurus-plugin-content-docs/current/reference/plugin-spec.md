---
sidebar_position: 2
title: "ข้อมูลจำเพาะของ Plugin"
---
# ข้อกำหนดของ Method Plugin

> **เวอร์ชัน**: 1.1  
> **กลุ่มเป้าหมาย**: นักพัฒนา Plugin  
> **Canonical Schema**: [`schemas/rosetta-plugin.schema.json`](https://github.com/gamedaysuits/i18n-rosetta/blob/main/schemas/rosetta-plugin.schema.json)

## ภาพรวม

i18n-rosetta ใช้ **ระบบ method แบบ pluggable** แต่ละคู่ภาษาสามารถใช้วิธีการแปล (translation method) ที่แตกต่างกันได้ (LLM, coached, script-converter ฯลฯ) Method ต่างๆ จะถูกลงทะเบียนใน `lib/translate.js` และถูกเรียกใช้ตามแต่ละคู่ภาษาผ่าน `lib/pairs.js`

หน้าที่ของ eval harness คือการ **พัฒนา ทดสอบ และส่งออก** translation method ส่วนหน้าที่ของ i18n-rosetta คือการ **นำไปใช้และประมวลผล** method เหล่านั้น harness จะไม่ทำงานอยู่ภายใน rosetta

### การไหลของข้อมูล (Data Flow)

```mermaid
flowchart LR
    A["Evaluation Harness\n(Python / standalone)"] -->|"method.json\n+ coaching data"| B["i18n-rosetta\n(Node.js / npm)"]
```

---

## รูปแบบของ Method Plugin

method plugin คือไฟล์ JSON เดี่ยว (`method.json`) ซึ่งอาจมีไฟล์ข้อมูล coaching รวมอยู่ด้วยหรือไม่ก็ได้

### `method.json` — จำเป็นต้องมี

```json
{
  "name": "french-formal-v1",
  "type": "llm-coached",
  "version": "1.0.0",
  "description": "Formally-tuned French with terminology enforcement and grammar coaching",
  "author": "Plugin Author",

  "config": {
    "model": "google/gemini-3.5-flash",
    "register": "formal",
    "batchSize": 30,
    "temperature": 0.2
  },

  "locales": ["fr"],

  "benchmarks": {
    "fr": {
      "date": "2026-05-11T00:00:00Z",
      "corpus_size": 500,
      "exact_match_rate": 0.42,
      "corpus_chrf": 72.3,
      "corpus_bleu": 45.1,
      "model": "google/gemini-3.5-flash",
      "harness_version": "1.0.0"
    }
  },

  "provenance": {
    "resources": [],
    "commercialReady": false,
    "flags": ["license-unclear"]
  },

  "coaching": {
    "dir": "coaching"
  }
}
```

### ข้อมูลอ้างอิงของ Field

| Field | ประเภท | จำเป็น | คำอธิบาย |
|-------|------|----------|-------------|
| `name` | string | ✅ | ตัวระบุ method ที่ไม่ซ้ำกัน (kebab-case) |
| `type` | string | ✅ | ประเภท method ของ Rosetta: `llm`, `llm-coached`, `api`, `google-translate`, `deepl`, `microsoft-translator`, `libretranslate`, `openai`, `anthropic`, `gemini` |
| `version` | string | ✅ | เวอร์ชัน Semver (เช่น `1.0.0`) |
| `locales` | string[] | ✅ | รหัส locale ที่ method นี้รองรับ (ขั้นต่ำ 1) |
| `description` | string | — | คำอธิบายที่มนุษย์อ่านเข้าใจได้ |
| `author` | string | — | ผู้พัฒนา/ทดสอบ method นี้ |
| `config.model` | string | — | ตัวระบุโมเดล OpenRouter |
| `config.register` | string | — | ระดับภาษา/น้ำเสียงของภาษาปลายทาง |
| `config.batchSize` | number | — | จำนวน Key ต่อ API batch (1–200, ค่าเริ่มต้น: 30) |
| `config.temperature` | number | — | ค่า temperature ของ LLM (0.0–2.0, ค่าเริ่มต้น: 0.3) |
| `benchmarks` | object | — | ผลลัพธ์ benchmark ของแต่ละ locale |
| `provenance` | object | — | สิทธิ์การใช้งานและ resource dependency |
| `coaching.dir` | string | — | Relative path ไปยังไดเรกทอรีข้อมูล coaching |

### ออบเจ็กต์ Benchmark (ต่อ locale)

| Field | ประเภท | จำเป็น | คำอธิบาย |
|-------|------|----------|-------------|
| `date` | string | ✅ | Timestamp รูปแบบ ISO 8601 ของการรัน benchmark |
| `corpus_size` | number | ✅ | จำนวนรายการที่ได้รับการประเมิน |
| `exact_match_rate` | number | ✅ | 0.0–1.0, สัดส่วนของการจับคู่ที่ตรงกันทุกประการ (exact match) |
| `corpus_chrf` | number | — | คะแนน chrF++ (0–100) |
| `corpus_bleu` | number | — | คะแนน BLEU (0–100) |
| `model` | string | ✅ | โมเดลที่ใช้ระหว่างการประเมิน (eval) |
| `harness_version` | string | ✅ | เวอร์ชันของ evaluation harness ที่ใช้ |

:::info เมตริกใดบ้างที่ถูกแสดงผล?
คำสั่ง `rosetta status` จะแสดง **chrF++** และ **exact match rate** จากบล็อก benchmark `corpus_bleu` ได้รับการยอมรับใน manifest แต่ปัจจุบันยังไม่มีการแสดงผลหรือใช้งานโดยคำสั่งใดๆ ของ rosetta [Method Leaderboard](/leaderboard) จะติดตามค่า chrF++, exact match และ FST acceptance rate
:::

---

### ออบเจ็กต์ Provenance

บล็อก provenance ใช้สำหรับสื่อสารสถานะสิทธิ์การใช้งานของ resource ที่รวมมากับ plugin

| Field | ประเภท | ค่าเริ่มต้น | คำอธิบาย |
|-------|------|---------|-------------|
| `resources` | object[] | `[]` | รายการ resource ที่รวมมาด้วย พร้อมกับ `name`, `license` และ `type` |
| `commercialReady` | boolean | `false` | ระบุว่า plugin นี้ได้รับการอนุมัติสำหรับการแจกจ่ายเชิงพาณิชย์หรือไม่ |
| `flags` | string[] | `["license-unclear"]` | แฟล็กสถานะที่เครื่องสามารถอ่านได้ (Machine-readable) |

**สถานะเริ่มต้น** — plugin ที่ส่งออกจะมาพร้อมกับ `commercialReady: false` และ `flags: ["license-unclear"]`

**สถานะที่ได้รับการอนุมัติ (Cleared state)** — เมื่อสิทธิ์การใช้งานได้รับการตรวจสอบแล้ว: ให้ตั้งค่า `commercialReady: true` และล้างค่าแฟล็ก

---

## รูปแบบข้อมูล Coaching

หาก `type` เป็น `llm-coached` ตัว plugin ควรมีไฟล์ข้อมูล coaching อยู่ในไดเรกทอรีย่อย `coaching/`

### `coaching/<locale>.json`

```json
{
  "grammar_rules": [
    "French adjectives agree in gender and number with the noun they modify",
    "Use 'vous' for formal contexts, 'tu' for informal"
  ],
  "dictionary": {
    "dashboard": "tableau de bord",
    "deployment": "déploiement",
    "settings": "paramètres"
  },
  "style_notes": "Prefer active voice. Avoid anglicisms where a native French term exists."
}
```

| Field | ประเภท | จำเป็น | คำอธิบาย |
|-------|------|----------|-------------|
| `grammar_rules` | string[] | — | กฎที่ถูกแทรกเข้าไปในทุก LLM prompt สำหรับ locale นี้ |
| `dictionary` | object | — | แผนผังคำศัพท์ → คำแปล คำศัพท์ที่ตรงกันจะถูกแทรกเข้าไปในฐานะคำศัพท์ที่จำเป็นต้องใช้ |
| `style_notes` | string | — | คำแนะนำรูปแบบอิสระ (Freeform style) ที่ต่อท้าย prompt |

---

## โครงสร้างไดเรกทอรี

```
french-formal-v1/
  method.json                 # Method manifest with benchmarks
  coaching/
    fr.json                   # Coaching data for French
```

สำหรับ method ที่รองรับหลาย locale:

```
european-formal-v2/
  method.json                 # locales: ["fr", "de", "es", "it"]
  coaching/
    fr.json
    de.json
    es.json
    it.json
```

---

## วิธีที่ Rosetta ใช้งาน Plugin

### การติดตั้ง

```bash
i18n-rosetta plugin install ./french-formal-v1/
```

บันทึกลงใน `.rosetta/methods/french-formal-v1/`

### การกำหนดค่า

```json title="i18n-rosetta.config.json"
{
  "pairs": {
    "en:fr": {
      "methodPlugin": "french-formal-v1"
    }
  }
}
```

:::info ความหมายของการผสานข้อมูล (Merge semantics)
Plugin จะกำหนดว่าต้องใช้ method *อะไร* (`type`) การกำหนดค่าของคู่ภาษาจะปรับแต่ง *วิธีการ* รัน method นั้น (`model`, `register`, `batchSize`) หากคู่ภาษามีการตั้งค่า `model` ค่านี้จะเขียนทับค่าเริ่มต้นของ plugin
:::

### รันไทม์ (Runtime)

1. Rosetta อ่าน `method.json` จาก `.rosetta/methods/french-formal-v1/`
2. Field `type` ของ plugin จะกำหนด translation method (เช่น `llm-coached`)
3. โหลดข้อมูล coaching จากไดเรกทอรี `coaching/` ของ plugin
4. ใช้บล็อก `config` เพื่อเติมเต็มข้อมูลที่ขาดหายไปใน model/register/temperature
5. บล็อก `benchmarks` จะแสดงในผลลัพธ์ของ `rosetta status`
6. บล็อก `provenance` จะถูกตรวจสอบโดย `rosetta provenance` เพื่อหาแฟล็กสิทธิ์การใช้งาน

---

## การตรวจสอบความถูกต้องของ Schema

Manifest ของ Plugin จะได้รับการตรวจสอบความถูกต้องในขณะติดตั้งโดยอ้างอิงกับ [`schemas/rosetta-plugin.schema.json`](https://github.com/gamedaysuits/i18n-rosetta/blob/main/schemas/rosetta-plugin.schema.json)

อ้างอิง schema ใน `method.json` ของคุณเพื่อเปิดใช้งานการเติมโค้ดอัตโนมัติ (autocompletion) ใน IDE:

```json
{
  "$schema": "./node_modules/i18n-rosetta/schemas/rosetta-plugin.schema.json",
  "name": "my-method-v1"
}
```

---

## สิ่งที่ห้ามรวมไว้

- ❌ ไม่มีโค้ด Python หรือ dependency ของ harness
- ❌ ไม่มีข้อมูล corpus ดิบหรือบันทึกการรัน (run logs)
- ❌ ไม่มี API key หรือข้อมูลประจำตัว (credentials)
- ❌ ไม่มีการกำหนดค่าของ harness
- ❌ ไม่มีเทมเพลต prompt ภายใน (สิ่งเหล่านี้จะอยู่ใน method implementation ของ rosetta)

Plugin นี้มีไว้สำหรับ **ข้อมูลเท่านั้น**: การกำหนดค่า, เนื้อหา coaching และผลลัพธ์ benchmark

---

## ดูเพิ่มเติม

- [Translation Methods](/docs/guides/translation-methods) — วิธีการทำงานของแต่ละ method ที่มีมาให้ในตัว
- [Configuration](/docs/getting-started/configuration) — การกำหนดค่าต่อคู่ภาษาและต่อภาษา
- [Serving a Method via API](/docs/guides/serving-a-method) — การโฮสต์ method เป็นบริการ HTTP
- [Cookbook: FST-Gated Pipeline](/docs/tutorials/fst-gated-pipeline) — การสร้างและแพ็กเกจ pipeline
- [MT Evaluation](/docs/eval/) — การทำ benchmark ให้กับ method เพื่อส่งขึ้น leaderboard
- [Support a Low-Resource Language](/docs/guides/low-resource-languages) — กรณีการใช้งานสำหรับ community plugin