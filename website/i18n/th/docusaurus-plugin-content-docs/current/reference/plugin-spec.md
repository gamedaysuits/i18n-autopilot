---
sidebar_position: 2
title: "ข้อมูลจำเพาะของ Plugin"
---
# ข้อกำหนดของปลั๊กอิน Method

> **เวอร์ชัน**: 1.1  
> **กลุ่มเป้าหมาย**: นักพัฒนาปลั๊กอิน  
> **Canonical Schema**: [`schemas/rosetta-plugin.schema.json`](https://github.com/gamedaysuits/i18n-rosetta/blob/main/schemas/rosetta-plugin.schema.json)

## ภาพรวม

i18n-rosetta ใช้ **ระบบ method แบบปลั๊กอิน (pluggable method system)** แต่ละคู่ภาษาสามารถใช้วิธีการแปล (translation method) ที่แตกต่างกันได้ (เช่น LLM, coached, script-converter เป็นต้น) Method ต่างๆ จะถูกลงทะเบียนไว้ใน `lib/translate.js` และถูกเรียกใช้ตามแต่ละคู่ภาษาผ่าน `lib/pairs.js`

หน้าที่ของ eval harness คือการ **พัฒนา ทดสอบ และส่งออก (export)** translation method ส่วนหน้าที่ของ i18n-rosetta คือการ **นำมาใช้งานและประมวลผล (consume and execute)** method เหล่านั้น harness จะไม่ทำงานอยู่ภายใน rosetta เด็ดขาด

### การไหลของข้อมูล (Data Flow)

```mermaid
flowchart LR
    A["Evaluation Harness\n(Python / standalone)"] -->|"method.json\n+ coaching data"| B["i18n-rosetta\n(Node.js / npm)"]
```

---

## รูปแบบของปลั๊กอิน Method

ปลั๊กอิน method คือไฟล์ JSON เดี่ยวๆ (`method.json`) ซึ่งอาจมีไฟล์ข้อมูล coaching รวมอยู่ด้วย (ไม่บังคับ)

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

### ข้อมูลอ้างอิงฟิลด์ (Field Reference)

| ฟิลด์ | ประเภท | จำเป็น | คำอธิบาย |
|-------|------|----------|-------------|
| `name` | string | ✅ | ตัวระบุ method ที่ไม่ซ้ำกัน (รูปแบบ kebab-case) |
| `type` | string | ✅ | ประเภท method ของ Rosetta: `llm`, `llm-coached`, `api`, `google-translate`, `deepl`, `microsoft-translator`, `libretranslate`, `openai`, `anthropic`, `gemini` |
| `version` | string | ✅ | เวอร์ชันแบบ Semver (เช่น `1.0.0`) |
| `locales` | string[] | ✅ | รหัส locale ที่ method นี้รองรับ (อย่างน้อย 1) |
| `description` | string | — | คำอธิบายที่มนุษย์อ่านเข้าใจได้ |
| `author` | string | — | ผู้พัฒนา/ทดสอบ method นี้ |
| `config.model` | string | — | ตัวระบุโมเดลของ OpenRouter |
| `config.register` | string | — | ระดับภาษา/น้ำเสียง (register/tone) ของภาษาปลายทาง |
| `config.batchSize` | number | — | จำนวนคีย์ต่อ API batch (1–200, ค่าเริ่มต้น: 30) |
| `config.temperature` | number | — | ค่า temperature ของ LLM (0.0–2.0, ค่าเริ่มต้น: 0.3) |
| `benchmarks` | object | — | ผลลัพธ์ benchmark ของแต่ละ locale |
| `provenance` | object | — | การอนุญาตให้ใช้สิทธิ์ (Licensing) และ resource dependencies |
| `coaching.dir` | string | — | Relative path ไปยังไดเรกทอรีข้อมูล coaching |

### ออบเจ็กต์ Benchmark (ต่อ locale)

| ฟิลด์ | ประเภท | จำเป็น | คำอธิบาย |
|-------|------|----------|-------------|
| `date` | string | ✅ | Timestamp รูปแบบ ISO 8601 ของการรัน benchmark |
| `corpus_size` | number | ✅ | จำนวนรายการที่ได้รับการประเมิน |
| `exact_match_rate` | number | ✅ | 0.0–1.0, สัดส่วนของการจับคู่ที่ตรงกันทุกประการ (exact match) |
| `corpus_chrf` | number | — | คะแนน chrF++ (0–100) |
| `corpus_bleu` | number | — | คะแนน BLEU (0–100) |
| `model` | string | ✅ | โมเดลที่ใช้ระหว่างการประเมิน (eval) |
| `harness_version` | string | ✅ | เวอร์ชันของ evaluation harness ที่ใช้ |

:::info เมตริกใดบ้างที่ถูกแสดงผล?
คำสั่ง `rosetta status` จะแสดง **chrF++** และ **exact match rate** จากบล็อก benchmark `corpus_bleu` สามารถระบุใน manifest ได้ แต่ปัจจุบันยังไม่มีการแสดงผลหรือถูกใช้งานโดยคำสั่งใดๆ ของ rosetta [Method Leaderboard](/leaderboard) จะติดตามคะแนน chrF++, exact match และ FST acceptance rate
:::

---

### ออบเจ็กต์ Provenance

บล็อก provenance ใช้สำหรับสื่อสารสถานะการอนุญาตให้ใช้สิทธิ์ (licensing) ของทรัพยากรที่รวมมากับปลั๊กอิน

| ฟิลด์ | ประเภท | ค่าเริ่มต้น | คำอธิบาย |
|-------|------|---------|-------------|
| `resources` | object[] | `[]` | รายการทรัพยากรที่รวมมาด้วย พร้อมระบุ `name`, `license` และ `type` |
| `commercialReady` | boolean | `false` | ระบุว่าปลั๊กอินนี้ได้รับการอนุมัติให้แจกจ่ายในเชิงพาณิชย์หรือไม่ |
| `flags` | string[] | `["license-unclear"]` | แฟล็กสถานะที่เครื่องสามารถอ่านได้ (Machine-readable) |

**สถานะเริ่มต้น (Default state)** — ปลั๊กอินที่ส่งออก (exported) จะมาพร้อมกับ `commercialReady: false` และ `flags: ["license-unclear"]`

**สถานะที่ผ่านการอนุมัติ (Cleared state)** — เมื่อตรวจสอบ licensing เรียบร้อยแล้ว: ให้ตั้งค่า `commercialReady: true` และล้างค่าแฟล็กต่างๆ

---

## รูปแบบข้อมูล Coaching

หาก `type` เป็น `llm-coached` ปลั๊กอินควรรวมไฟล์ข้อมูล coaching ไว้ในไดเรกทอรีย่อย `coaching/`

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

| ฟิลด์ | ประเภท | จำเป็น | คำอธิบาย |
|-------|------|----------|-------------|
| `grammar_rules` | string[] | — | กฎที่จะถูกแทรกลงในทุก LLM prompt สำหรับ locale นี้ |
| `dictionary` | object | — | การจับคู่คำศัพท์ (Term) → คำแปล คำศัพท์ที่ตรงกันจะถูกแทรกเป็นคำศัพท์ที่บังคับใช้ (required terminology) |
| `style_notes` | string | — | คำแนะนำสไตล์แบบอิสระ (Freeform) ที่จะถูกต่อท้ายใน prompt |

---

## โครงสร้างไดเรกทอรี

```
french-formal-v1/
  method.json                 # Method manifest with benchmarks
  coaching/
    fr.json                   # Coaching data for French
```

สำหรับ method ที่รองรับหลาย locale (multi-locale):

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

## วิธีที่ Rosetta ใช้งานปลั๊กอิน

### การติดตั้ง

```bash
i18n-rosetta plugin install ./french-formal-v1/
```

บันทึกลงใน `.rosetta/methods/french-formal-v1/`

### การกำหนดค่า (Configuration)

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
ปลั๊กอินจะกำหนดว่าต้องใช้ method *อะไร* (`type`) การกำหนดค่าของคู่ภาษา (pair config) จะปรับแต่งว่าต้องรัน *อย่างไร* (`model`, `register`, `batchSize`) หากคู่ภาษามีการตั้งค่า `model` ค่านี้จะเขียนทับ (override) ค่าเริ่มต้นของปลั๊กอิน
:::

### รันไทม์ (Runtime)

1. Rosetta จะอ่าน `method.json` จาก `.rosetta/methods/french-formal-v1/`
2. ฟิลด์ `type` ของปลั๊กอินจะกำหนด translation method (เช่น `llm-coached`)
3. โหลดข้อมูล coaching จากไดเรกทอรี `coaching/` ของปลั๊กอิน
4. ใช้บล็อก `config` เพื่อเติมเต็มข้อมูลที่ขาดหายไปในโมเดล/ระดับภาษา/temperature
5. บล็อก `benchmarks` จะแสดงในเอาต์พุตของ `rosetta status`
6. บล็อก `provenance` จะถูกตรวจสอบโดย `rosetta provenance` เพื่อหาแฟล็ก licensing

---

## การตรวจสอบความถูกต้องของ Schema (Schema Validation)

Manifest ของปลั๊กอินจะถูกตรวจสอบความถูกต้องในขณะติดตั้งโดยอ้างอิงจาก [`schemas/rosetta-plugin.schema.json`](https://github.com/gamedaysuits/i18n-rosetta/blob/main/schemas/rosetta-plugin.schema.json)

อ้างอิง schema ใน `method.json` ของคุณเพื่อให้ IDE สามารถเติมโค้ดอัตโนมัติ (autocompletion) ได้:

```json
{
  "$schema": "./node_modules/i18n-rosetta/schemas/rosetta-plugin.schema.json",
  "name": "my-method-v1"
}
```

---

## สิ่งที่ห้ามรวมไว้ในปลั๊กอิน

- ❌ ห้ามมีโค้ด Python หรือ dependency ของ harness
- ❌ ห้ามมีข้อมูล corpus ดิบ หรือบันทึกการรัน (run logs)
- ❌ ห้ามมี API key หรือข้อมูลรับรอง (credentials)
- ❌ ห้ามมีการกำหนดค่า (configuration) ของ harness
- ❌ ห้ามมีเทมเพลต prompt ภายใน (สิ่งเหล่านี้จะอยู่ใน method implementation ของ rosetta)

ปลั๊กอินนี้เป็น **ข้อมูลเท่านั้น (data only)**: ประกอบด้วยการกำหนดค่า เนื้อหา coaching และผลลัพธ์ benchmark

---

## ดูเพิ่มเติม

- [Translation Methods](/docs/guides/translation-methods) — วิธีการทำงานของแต่ละ method ที่มีมาให้ในตัว (built-in)
- [Configuration](/docs/getting-started/configuration) — การกำหนดค่าตามคู่ภาษาและตามภาษา
- [Serving a Method via API](/docs/guides/serving-a-method) — การโฮสต์ method เป็นบริการ HTTP
- [Cookbook: FST-Gated Pipeline](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — การสร้างและแพ็กเกจ pipeline
- [MT Evaluation](https://mtevalarena.org/docs/leaderboard/rules) — การทำ benchmark ให้กับ method เพื่อส่งขึ้นกระดานผู้นำ (leaderboard)
- [Support a Low-Resource Language](https://mtevalarena.org/docs/community/low-resource-languages) — กรณีการใช้งานสำหรับปลั๊กอินจากชุมชน (community plugins)