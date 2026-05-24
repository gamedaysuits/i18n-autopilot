---
sidebar_position: 6
title: "การแก้ไขปัญหา"
---
# การแก้ไขปัญหา

ปัญหาที่พบบ่อยและวิธีแก้ไขสำหรับ i18n-rosetta

## API และการยืนยันตัวตน

### "OPENROUTER_API_KEY not found"

Rosetta จำเป็นต้องใช้ API key สำหรับการแปลภาษาด้วย LLM คุณสามารถตั้งค่าเป็น environment variable ได้ดังนี้:

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
```

หรือในไฟล์ `.env` (หากโปรเจกต์ของคุณโหลดไฟล์ `.env`):

```
OPENROUTER_API_KEY=sk-or-v1-...
```

:::tip
หากคุณมีเพียง Google Translate API key ระบบ rosetta จะตรวจจับอัตโนมัติและใช้ Google Translate เป็นวิธีการเริ่มต้น โดยไม่จำเป็นต้องเปลี่ยนการตั้งค่าใดๆ
:::

### "401 Unauthorized" จาก OpenRouter

API key ของคุณไม่ถูกต้องหรือหมดอายุ โปรดตรวจสอบที่ [openrouter.ai/keys](https://openrouter.ai/keys)

### "429 Too Many Requests" / การจำกัดอัตราการเรียกใช้งาน (Rate Limiting)

Rosetta จัดการการจำกัดอัตราการเรียกใช้งานภายในระบบด้วย exponential backoff หากคุณพบปัญหาการจำกัดอัตราการเรียกใช้งานอย่างต่อเนื่อง:

1. **ลดขนาด batch** ในการตั้งค่าของคุณ:
   ```json
   { "batchSize": 15 }
   ```
2. **ใช้โมเดลที่มีขีดจำกัดสูงกว่า** (เช่น `google/gemini-3.5-flash` มีขีดจำกัดที่ค่อนข้างสูง)
3. **ใช้วิธีที่ถูกกว่า/เร็วกว่า** สำหรับคู่ภาษาที่มีปริมาณมาก — Google Translate ไม่มีการจำกัดอัตราการเรียกใช้งาน:
   ```json
   { "pairs": { "en:it": { "method": "google-translate" } } }
   ```

### ไม่พบโมเดล / ข้อผิดพลาด 404

ผู้ให้บริการ LLM โดยตรง (`openai`, `anthropic`, `gemini`) จะตรวจสอบสตริงโมเดลของคุณในการใช้งานครั้งแรก หากคุณเห็นคำเตือน:

**"looks like an OpenRouter path"** — คุณกำลังใช้โมเดลรูปแบบ OpenRouter (`google/gemini-3.5-flash`) กับผู้ให้บริการโดยตรง ผู้ให้บริการโดยตรงจะใช้ชื่อโมเดลแบบปกติ:

```diff
- { "method": "gemini", "model": "google/gemini-3.5-flash" }
+ { "method": "gemini", "model": "gemini-2.5-flash" }
```

หรือเปลี่ยนไปใช้วิธี `llm` เพื่อใช้งาน OpenRouter:
```json
{ "method": "llm", "model": "google/gemini-3.5-flash" }
```

**"is an Anthropic/OpenAI/Gemini model"** — คุณกำลังส่งโมเดลไปยังผู้ให้บริการที่ไม่ถูกต้อง:

```diff
- { "method": "gemini", "model": "claude-sonnet-4-6" }
+ { "method": "anthropic", "model": "claude-sonnet-4-6" }
```

**"not found in available models"** — โมเดลอาจถูกยกเลิกการใช้งานหรือสะกดผิด Rosetta จะดึงรายการโมเดลล่าสุดของผู้ให้บริการและแนะนำทางเลือกอื่น โปรดตรวจสอบเอกสารประกอบของผู้ให้บริการสำหรับชื่อโมเดลปัจจุบัน

:::tip การยกเลิกการใช้งานโมเดลสามารถเกิดขึ้นได้
ผู้ให้บริการมักจะยกเลิกชื่อโมเดลอยู่เป็นประจำ หากการแปลล้มเหลวกะทันหันหลังจากการอัปเดตของผู้ให้บริการ โปรดตรวจสอบผลลัพธ์ `[WARN]` — ระบบจะแสดงทางเลือกปัจจุบันให้คุณทราบ
:::

## คุณภาพการแปล

### คำแปลเหมือนกับภาษาต้นทาง

Quality gate จะดักจับปัญหานี้ หากคำแปลเหมือนกับภาษาอังกฤษต้นทางทุกประการ ระบบจะปฏิเสธและลองใหม่อีกครั้ง หากยังคงพบปัญหา:

1. **ตรวจสอบโมเดล** — บางโมเดลอาจทำงานได้ไม่ดีสำหรับคู่ภาษาเฉพาะ
2. **เพิ่มคำแนะนำระดับภาษา (register instructions)** — บอกโมเดลว่าต้องการให้สร้างภาษาอะไร:
   ```json
   {
     "languages": {
       "ja": { "name": "Japanese", "register": "Polite/formal Japanese" }
     }
   }
   ```
3. **ลองใช้โมเดลอื่น** — เปลี่ยนจาก `gpt-4o-mini` เป็น `gpt-4o` หรือ `google/gemini-2.5-pro`

### ผลลัพธ์ตัวอักษรผิด (เช่น ข้อความละตินสำหรับภาษาญี่ปุ่น)

การตรวจสอบความสอดคล้องของตัวอักษร (script compliance) ของ quality gate จะดักจับกรณีส่วนใหญ่ได้ หากยังคงพบปัญหา:

- ตรวจสอบว่ารหัส locale ถูกต้อง (`ja` ไม่ใช่ `jp`)
- เพิ่มคำแนะนำตัวอักษรที่ชัดเจนในฟิลด์ `register`:
  ```json
  { "register": "Japanese using hiragana, katakana, and kanji" }
  ```

### รูปแบบการหลอน (Hallucination) ในผลลัพธ์

รูปแบบ trigram ที่ซ้ำกัน (เช่น "hello hello hello") จะถูกดักจับโดยตัวตรวจจับลูปการหลอน (hallucination loop detector) หากผลลัพธ์อ่านไม่รู้เรื่องแต่ผ่านตัวตรวจจับมาได้:

1. **ลดขนาด batch** — batch ที่เล็กลงจะให้ผลลัพธ์ที่ตรงจุดมากขึ้น
2. **ใช้โมเดลที่มีประสิทธิภาพสูงขึ้น** — โมเดลขนาดใหญ่จะเกิดการหลอนน้อยกว่าในตัวอักษรที่ไม่ใช่ภาษาละติน
3. **เพิ่มข้อมูลการสอน (coaching data)** — คำศัพท์ในพจนานุกรมจะช่วยยึดโยงการแปลให้ถูกต้อง

## ปัญหาเกี่ยวกับไฟล์และรูปแบบ

### "No locale files found"

Rosetta จะตรวจจับไฟล์ locale โดยอัตโนมัติ หากไม่พบไฟล์:

1. **ตรวจสอบ `localesDir`** — ต้องชี้ไปยังไดเรกทอรีที่มีไฟล์ locale:
   ```json
   { "localesDir": "./locales" }
   ```
2. **ตรวจสอบการตั้งชื่อไฟล์** — ไฟล์ต้องตั้งชื่อตามรหัส locale: `en.json`, `fr.json` เป็นต้น
3. **ตรวจสอบรูปแบบ** — รูปแบบที่รองรับ: JSON, nested JSON, YAML, TOML

### ข้อขัดแย้งของไฟล์ Lock

หาก `.i18n-rosetta.lock` อยู่ในสถานะที่ไม่ถูกต้อง:

```bash
# Reset the lock file (next sync will retranslate everything)
rm .i18n-rosetta.lock
npx i18n-rosetta sync
```

:::warning
การลบไฟล์ lock หมายความว่าการซิงค์ครั้งต่อไปจะแปลคีย์ทั้งหมดใหม่ ไม่ใช่เฉพาะคีย์ที่มีการเปลี่ยนแปลง ซึ่งจะส่งผลต่อค่าใช้จ่าย API สำหรับโปรเจกต์ขนาดใหญ่
:::

### การแปลเฉพาะบางคีย์ใหม่

หากการแปลบางรายการไม่ถูกต้องและคุณต้องการบังคับให้แปลใหม่โดยไม่ต้องลบไฟล์ lock:

```bash
# Re-translate a single key
npx i18n-rosetta sync --force-keys "hero.title"

# Re-translate multiple keys
npx i18n-rosetta sync --force-keys "nav.home,nav.about,footer.copyright"
```

แฟล็ก `--force-keys` จะข้ามการตรวจสอบแฮชของไฟล์ lock สำหรับคีย์เฉพาะเหล่านั้น เพื่อบังคับให้แปลใหม่โดยไม่ส่งผลกระทบต่อคีย์อื่นๆ

### การแปลเนื้อหาทำให้บล็อกโค้ดเสียหาย

ปัญหานี้ไม่ควรเกิดขึ้น — บล็อกโค้ดจะถูกป้องกันไว้ก่อนการแปล หากเกิดขึ้น:

1. ตรวจสอบว่าบล็อกโค้ดใช้รูปแบบมาตรฐาน (backticks สามตัว)
2. ตรวจสอบหาบล็อกโค้ดที่ไม่ได้ปิดใน Markdown ต้นทาง
3. แจ้งปัญหา — นี่คือบั๊กในระบบป้องกัน sentinel

## ปัญหาเกี่ยวกับ CLI

### `--watch` ไม่ตรวจจับการเปลี่ยนแปลง

การเฝ้าดูไฟล์ใช้ `fs.watch` แบบเนทีฟของ Node.js ปัญหาที่ทราบ:

- **Network drives** — `fs.watch` ทำงานได้ไม่เสถียรบนการเมานท์ NFS/SMB
- **Docker volumes** — ให้ใช้โหมด polling หรือรัน rosetta ภายในคอนเทนเนอร์
- **ไดเรกทอรีขนาดใหญ่** — ตัวเฝ้าดูจะตรวจสอบ `localesDir` แบบเรียกซ้ำ (recursively); โครงสร้างที่ลึกมากอาจเกินขีดจำกัดของระบบปฏิบัติการ

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

### การซิงค์ช้าสำหรับหลายภาษา

โดยค่าเริ่มต้น Rosetta จะแปลคู่ภาษาตามลำดับ หากต้องการเร่งความเร็วการซิงค์หลายภาษา:

1. **ใช้ Google Translate สำหรับคู่ภาษาที่มีปริมาณมาก** — เร็วกว่าการแปลด้วย LLM 10–50 เท่า
2. **เพิ่มขนาด batch** (สูงสุด 50, ค่าเริ่มต้นคือ 30):
   ```json
   { "batchSize": 50 }
   ```
3. **ใช้โมเดลที่รวดเร็ว** — `gpt-4o-mini` เร็วกว่า `gpt-4o` อย่างเห็นได้ชัด

### ค่าใช้จ่าย API สูง

- **ตรวจสอบขนาด batch** — batch ที่ใหญ่ขึ้น = การเรียก API น้อยลง = ค่าใช้จ่ายลดลง
- **ใช้ prompt caching** — Rosetta จะแยกข้อความระบบ/ผู้ใช้เพื่อให้เกิด cache hits บนโมเดลของ Anthropic และ Google
- **ใช้ Google Translate สำหรับภาษา Tier 2** — ดูคู่มือ [Translate 30 Languages](/docs/tutorials/translate-30-languages)

## ยังคงติดปัญหาอยู่ใช่ไหม?

- **[GitHub Issues](https://github.com/gamedaysuits/i18n-rosetta/issues)** — ค้นหาปัญหาที่มีอยู่หรือแจ้งปัญหาใหม่
- **[Architecture Docs](/docs/concepts/architecture)** — ทำความเข้าใจการออกแบบระบบ
- **[Quality Gate](/docs/concepts/quality-gate)** — การตรวจสอบความถูกต้องทำงานอย่างไรในเบื้องหลัง