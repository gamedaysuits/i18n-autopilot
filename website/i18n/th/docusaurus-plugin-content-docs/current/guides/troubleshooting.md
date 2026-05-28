---
sidebar_position: 6
title: "การแก้ไขปัญหา"
---
# การแก้ไขปัญหา

ปัญหาที่พบบ่อยและวิธีแก้ไขสำหรับ i18n-rosetta

## API และการยืนยันตัวตน

### ไม่พบ "OPENROUTER_API_KEY"

Rosetta จำเป็นต้องใช้ API key สำหรับการแปลภาษาด้วย LLM คุณสามารถตั้งค่าเป็น environment variable ได้ดังนี้:

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
```

หรือในไฟล์ `.env` (หากโปรเจกต์ของคุณโหลดไฟล์ `.env`):

```
OPENROUTER_API_KEY=sk-or-v1-...
```

:::tip
หากคุณมีเพียง Google Translate API key ระบบ rosetta จะตรวจจับอัตโนมัติและใช้ Google Translate เป็นวิธีเริ่มต้น โดยที่คุณไม่ต้องเปลี่ยนการตั้งค่าใดๆ
:::

### "401 Unauthorized" จาก OpenRouter

API key ของคุณไม่ถูกต้องหรือหมดอายุ โปรดตรวจสอบได้ที่ [openrouter.ai/keys](https://openrouter.ai/keys)

### "429 Too Many Requests" / การจำกัดอัตราการใช้งาน (Rate Limiting)

Rosetta จัดการการจำกัดอัตราการใช้งานภายในระบบด้วยวิธี exponential backoff หากคุณพบปัญหาการจำกัดอัตราการใช้งานอย่างต่อเนื่อง:

1. **ลดขนาด batch (batch size)** ในการตั้งค่าของคุณ:
   ```json
   { "batchSize": 15 }
   ```
2. **ใช้โมเดลที่มีขีดจำกัดอัตราการใช้งานสูงกว่า** (เช่น `google/gemini-3.5-flash` มีขีดจำกัดที่ค่อนข้างสูง)
3. **ใช้วิธีที่ถูกกว่า/เร็วกว่า** สำหรับคู่ภาษาที่มีปริมาณมาก — Google Translate ไม่มีการจำกัดอัตราการใช้งาน:
   ```json
   { "pairs": { "en:it": { "method": "google-translate" } } }
   ```

### ไม่พบโมเดล (Model Not Found) / ข้อผิดพลาด 404

ผู้ให้บริการ LLM โดยตรง (`openai`, `anthropic`, `gemini`) จะตรวจสอบสตริงโมเดลของคุณในการใช้งานครั้งแรก หากคุณเห็นคำเตือน:

**"looks like an OpenRouter path"** — คุณกำลังใช้โมเดลในรูปแบบ OpenRouter (`google/gemini-3.5-flash`) กับผู้ให้บริการโดยตรง ผู้ให้บริการโดยตรงจะใช้เพียงชื่อโมเดลเปล่าๆ เท่านั้น:

```diff
- { "method": "gemini", "model": "google/gemini-3.5-flash" }
+ { "method": "gemini", "model": "gemini-2.5-flash" }
```

หรือเปลี่ยนไปใช้วิธี `llm` เพื่อใช้งาน OpenRouter:
```json
{ "method": "llm", "model": "google/gemini-3.5-flash" }
```

**"is an Anthropic/OpenAI/Gemini model"** — คุณกำลังส่งโมเดลไปยังผู้ให้บริการที่ผิด:

```diff
- { "method": "gemini", "model": "claude-sonnet-4-6" }
+ { "method": "anthropic", "model": "claude-sonnet-4-6" }
```

**"not found in available models"** — โมเดลอาจถูกยกเลิกการใช้งานหรือสะกดผิด Rosetta จะดึงรายชื่อโมเดลล่าสุดของผู้ให้บริการและแนะนำทางเลือกอื่น โปรดตรวจสอบเอกสารของผู้ให้บริการสำหรับชื่อโมเดลปัจจุบัน

:::tip การยกเลิกการใช้งานโมเดลสามารถเกิดขึ้นได้
ผู้ให้บริการมักจะยกเลิกชื่อโมเดลอยู่เป็นประจำ หากการแปลล้มเหลวอย่างกะทันหันหลังจากการอัปเดตของผู้ให้บริการ ให้ตรวจสอบผลลัพธ์ของ `[WARN]` — ระบบจะแสดงทางเลือกปัจจุบันให้คุณเห็น
:::

## คุณภาพการแปล

### คำแปลเหมือนกับภาษาต้นทาง

ระบบตรวจสอบคุณภาพ (quality gate) จะดักจับปัญหานี้ หากคำแปลเหมือนกับภาษาอังกฤษต้นทางทุกประการ ระบบจะปฏิเสธและลองแปลใหม่ หากยังคงพบปัญหาอยู่:

1. **ตรวจสอบโมเดล** — บางโมเดลอาจทำงานได้ไม่ดีสำหรับคู่ภาษาเฉพาะบางคู่
2. **เพิ่มคำแนะนำเกี่ยวกับระดับภาษา (register instructions)** — บอกโมเดลว่าต้องการให้สร้างภาษาอะไร:
   ```json
   {
     "languages": {
       "ja": { "name": "Japanese", "register": "Polite/formal Japanese" }
     }
   }
   ```
3. **ลองใช้โมเดลอื่น** — เปลี่ยนจาก `gpt-4o-mini` เป็น `gpt-4o` หรือ `google/gemini-2.5-pro`

### ผลลัพธ์ใช้ตัวอักษรผิด (เช่น ข้อความภาษาละตินสำหรับภาษาญี่ปุ่น)

การตรวจสอบความถูกต้องของตัวอักษรในระบบตรวจสอบคุณภาพจะดักจับปัญหานี้ได้เป็นส่วนใหญ่ หากยังคงพบปัญหาอยู่:

- ตรวจสอบว่ารหัสภาษา (locale code) ถูกต้อง (`ja` ไม่ใช่ `jp`)
- เพิ่มคำแนะนำเกี่ยวกับตัวอักษรอย่างชัดเจนในฟิลด์ `register`:
  ```json
  { "register": "Japanese using hiragana, katakana, and kanji" }
  ```

### รูปแบบการหลอน (Hallucination) ในผลลัพธ์

รูปแบบ trigram ที่ซ้ำกัน (เช่น "hello hello hello") จะถูกดักจับโดยตัวตรวจจับการหลอนแบบวนลูป (hallucination loop detector) หากผลลัพธ์ผิดเพี้ยนแต่ผ่านตัวตรวจจับมาได้:

1. **ลดขนาด batch** — batch ที่เล็กลงจะให้ผลลัพธ์ที่ตรงจุดมากขึ้น
2. **ใช้โมเดลที่มีประสิทธิภาพสูงขึ้น** — โมเดลขนาดใหญ่จะมีอาการหลอนน้อยกว่าในตัวอักษรที่ไม่ใช่ภาษาละติน
3. **เพิ่มข้อมูลแนะนำ (coaching data)** — คำศัพท์ในพจนานุกรมจะช่วยยึดโยงการแปลให้ถูกต้อง

## ปัญหาเกี่ยวกับไฟล์และรูปแบบ

### ไม่พบไฟล์ภาษา ("No locale files found")

Rosetta จะตรวจจับไฟล์ภาษาโดยอัตโนมัติ หากระบบไม่พบไฟล์เหล่านั้น:

1. **ตรวจสอบ `localesDir`** — ต้องชี้ไปยังไดเรกทอรีที่มีไฟล์ภาษาอยู่:
   ```json
   { "localesDir": "./locales" }
   ```
2. **ตรวจสอบการตั้งชื่อไฟล์** — ไฟล์ต้องตั้งชื่อตามรหัสภาษา: `en.json`, `fr.json` เป็นต้น
3. **ตรวจสอบรูปแบบไฟล์** — รูปแบบที่รองรับ: JSON, nested JSON, YAML, TOML

### ปัญหาความขัดแย้งของ Lock file

หาก `.i18n-rosetta.lock` อยู่ในสถานะที่ไม่ถูกต้อง:

```bash
# Reset the lock file (next sync will retranslate everything)
rm .i18n-rosetta.lock
npx i18n-rosetta sync
```

:::warning
การลบ lock file หมายความว่าการซิงค์ครั้งต่อไปจะแปลคีย์ทั้งหมดใหม่ ไม่ใช่เฉพาะคีย์ที่มีการเปลี่ยนแปลง ซึ่งจะส่งผลต่อค่าใช้จ่าย API สำหรับโปรเจกต์ขนาดใหญ่
:::

### การแปลเฉพาะบางคีย์ใหม่

หากคำแปลบางรายการไม่ถูกต้องและคุณต้องการบังคับให้แปลใหม่โดยไม่ต้องลบ lock file:

```bash
# Re-translate a single key
npx i18n-rosetta sync --force-keys "hero.title"

# Re-translate multiple keys
npx i18n-rosetta sync --force-keys "nav.home,nav.about,footer.copyright"
```

แฟล็ก `--force-keys` จะข้ามการตรวจสอบแฮชของ lock file สำหรับคีย์เฉพาะเหล่านั้น เพื่อบังคับให้แปลใหม่โดยไม่ส่งผลกระทบต่อคีย์อื่นๆ

### การแปลเนื้อหาทำให้ code blocks เสียหาย

ปัญหานี้ไม่ควรเกิดขึ้น — code blocks จะถูกป้องกันไว้ก่อนการแปล หากเกิดปัญหานี้ขึ้น:

1. ตรวจสอบว่า code block ใช้รูปแบบมาตรฐาน (backticks สามตัว)
2. ตรวจสอบหา code blocks ที่ไม่ได้ปิดใน Markdown ต้นทาง
3. แจ้งปัญหา (File an issue) — นี่คือบั๊กในระบบป้องกัน (sentinel shielding system)

## ปัญหาเกี่ยวกับ CLI

### `--watch` ไม่ตรวจจับการเปลี่ยนแปลง

การเฝ้าดูไฟล์ (File watching) ใช้ `fs.watch` ซึ่งเป็นระบบดั้งเดิมของ Node.js ปัญหาที่พบได้ทั่วไป:

- **Network drives** — `fs.watch` ทำงานได้ไม่เสถียรบน NFS/SMB mounts
- **Docker volumes** — ให้ใช้โหมด polling หรือรัน rosetta ภายในคอนเทนเนอร์
- **ไดเรกทอรีขนาดใหญ่** — ระบบเฝ้าดูจะตรวจสอบ `localesDir` แบบเรียกซ้ำ (recursively); โครงสร้างที่ลึกมากอาจเกินขีดจำกัดของระบบปฏิบัติการ

### `npx` รันเวอร์ชันเก่า

```bash
# Clear the npx cache
npx --yes i18n-rosetta@latest sync
```

หรือติดตั้งแบบ global:

```bash
npm install -g i18n-rosetta
i18n-rosetta sync
```

## ประสิทธิภาพ

### การซิงค์ล่าช้าสำหรับหลายภาษา

ตามค่าเริ่มต้น Rosetta จะแปลทุกภาษาแบบขนาน (parallel) หากการซิงค์ยังคงล่าช้า:

1. **ใช้ Google Translate สำหรับคู่ภาษาที่มีปริมาณมาก** — ซึ่งเร็วกว่าการแปลด้วย LLM ถึง 10–50 เท่า
2. **เพิ่มขนาด batch** (ค่าเริ่มต้นคือ 80):
   ```json
   { "batchSize": 120 }
   ```
3. **ปรับจูนการทำงานพร้อมกัน (concurrency)** — การทำงานแบบขนานสำหรับไฟล์ภาษา JSON มีค่าเริ่มต้นที่ 50 และเนื้อหาที่ 12 หากผู้ให้บริการ API ของคุณรองรับขีดจำกัดอัตราการใช้งานที่สูงกว่า:
   ```bash
   npx i18n-rosetta sync --json-concurrency 80 --content-concurrency 20
   ```
4. **ใช้โมเดลที่รวดเร็ว** — `gpt-4o-mini` เร็วกว่า `gpt-4o` อย่างเห็นได้ชัด

### ค่าใช้จ่าย API สูง

- **ตรวจสอบขนาด batch** — batch ที่ใหญ่ขึ้น = จำนวนการเรียก API น้อยลง = ค่าใช้จ่ายลดลง
- **ใช้ Translation Memory (TM)** — TM เปิดใช้งานเป็นค่าเริ่มต้น รัน `i18n-rosetta tm stats` เพื่อตรวจสอบว่าทำงานอยู่หรือไม่ หากคุณพบว่ามี 0 รายการหลังจากการซิงค์หลายครั้ง อาจมีบางอย่างผิดปกติกับสิทธิ์การเข้าถึงไดเรกทอรี `.rosetta/` ของคุณ
- **ใช้ prompt caching** — Rosetta จะแยกข้อความระบบ/ผู้ใช้ (system/user messages) เพื่อให้เกิด cache hits บนโมเดลของ Anthropic และ Google
- **ใช้ Google Translate สำหรับภาษา Tier 2** — ดูคู่มือ [Translate 30 Languages](/docs/tutorials/translate-30-languages)

### คำแปลเก่าค้างอยู่หลังจากเปลี่ยนผู้ให้บริการ

หากคุณเปลี่ยนจากวิธีการแปลหนึ่งไปสู่อีกวิธีหนึ่ง (เช่น `llm` เป็น `deepl`) แคช TM อาจยังคงแสดงคำแปลเก่าจากวิธีก่อนหน้าสำหรับคีย์ที่ข้อความต้นทางไม่มีการเปลี่ยนแปลง คีย์แคชจะรวมชื่อวิธีไว้ด้วย ดังนั้นกรณีส่วนใหญ่จะได้รับการจัดการโดยอัตโนมัติ แต่หากคุณเปลี่ยน `model` ภายในวิธีเดียวกัน:

```bash
# Force fresh translations for all keys
i18n-rosetta sync --no-tm

# Or clear the cache entirely and re-sync
i18n-rosetta tm clear --yes
i18n-rosetta sync
```

ดู [Translation Memory](/docs/concepts/translation-memory) สำหรับรายละเอียดเกี่ยวกับการออกแบบคีย์แคช

## ยังคงมีปัญหาอยู่ใช่ไหม?

- **[GitHub Issues](https://github.com/gamedaysuits/i18n-rosetta/issues)** — ค้นหาปัญหาที่มีอยู่หรือแจ้งปัญหาใหม่
- **[Architecture Docs](/docs/concepts/architecture)** — ทำความเข้าใจการออกแบบระบบ
- **[Quality Gate](/docs/concepts/quality-gate)** — วิธีการทำงานของการตรวจสอบความถูกต้องเบื้องหลัง