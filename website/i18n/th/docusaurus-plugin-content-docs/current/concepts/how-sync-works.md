---
sidebar_position: 2
title: "Sync ทำงานอย่างไร"
---
# วิธีการทำงานของ Sync

คำสั่ง `sync` คือการทำงานหลักของ rosetta นี่คือสิ่งที่จะเกิดขึ้นเมื่อคุณรัน `npx i18n-rosetta sync`

## ภาพรวมของ Pipeline

```mermaid
flowchart TD
    A["Load config\n+ resolve pairs"] --> B["Scan source locale\n(flatten nested keys)"]
    B --> C["Load lock file\n(.i18n-rosetta.lock)"]
    C --> D["Diff: find missing\nand stale keys"]
    D --> TM{"TM lookup"}
    TM -->|Hits| TC["Serve from cache"]
    TM -->|Misses| E{"Keys to translate?"}
    E -->|No| F["Done ✓"]
    E -->|Yes| G["Batch keys\n(default 80/batch)"]
    G --> H["Translate batch\n(method-specific)"]
    H --> I["Quality gate\n(validate each key)"]
    I --> TERM["Terminology check\n(coached pairs)"]
    TERM --> J{"All pass?"}
    J -->|Yes| K["Write to locale file"]
    J -->|Failures| L["Retry cascade:\nfull → half → individual"]
    L --> H
    TC --> I
    K --> TMS["Store new entries\nin TM"]
    TMS --> M["Update lock file\n(SHA-256 hashes)"]
    M --> N["Next pair"]
```

## ขั้นตอนการทำงาน

### 1. การตรวจสอบ Config

Rosetta จะโหลด `i18n-rosetta.config.json` (หรือตรวจจับการตั้งค่าโดยอัตโนมัติ) โดยจะตรวจสอบ:
- Locale ต้นทางและ Locale ปลายทาง
- กราฟการจับคู่ (การจับคู่ต้นทาง→ปลายทางใดบ้างที่ต้องประมวลผล)
- การตั้งค่า Method, Model และคุณภาพสำหรับการจับคู่แต่ละคู่

ก่อนที่จะสแกนไฟล์ rosetta จะแสดงส่วนหัวตอนเริ่มต้นทำงาน:

```
i18n-rosetta v3.3.1

[INFO] Detected format: json (auto)
[INFO] Detected framework: Hugo
```

- **แบนเนอร์เวอร์ชัน**: แสดงเวอร์ชันที่ติดตั้งไว้สำหรับการดีบักและการรายงานปัญหา
- **การตรวจจับรูปแบบไฟล์**: รายงานรูปแบบไฟล์และระบุว่าเป็นการตรวจจับอัตโนมัติ `(auto)` หรือมีการกำหนดค่าไว้อย่างชัดเจน `(config)` รองรับ `json`, `toml` และ `yaml`
- **การตรวจจับ Framework**: เมื่อตั้งค่า `contentDir` จะระบุ Framework (`Hugo`) เพื่อยืนยันว่าการซิงค์เนื้อหาเปิดใช้งานอยู่

### 2. การสแกนต้นทาง

ไฟล์ Locale ต้นทางจะถูกโหลดและแปลงให้อยู่ในรูปแบบ Key→Value map:

```json
// Input (nested)
{ "hero": { "title": "Welcome", "subtitle": "Build" } }

// Flattened
{ "hero.title": "Welcome", "hero.subtitle": "Build" }
```

### 3. การตรวจจับการเปลี่ยนแปลง

Rosetta จะอ่าน `.i18n-rosetta.lock` ซึ่งเก็บค่า SHA-256 hashes ของข้อมูลต้นทางที่เคยแปลไปแล้ว สำหรับแต่ละ Key ระบบจะตรวจสอบดังนี้:

| เงื่อนไข | การดำเนินการ |
|-----------|--------|
| ไม่มี Key ในปลายทาง | **แปล (Translate)** |
| Hash ต้นทางเปลี่ยนไปจากการซิงค์ครั้งล่าสุด | **แปลใหม่ (Re-translate)** (ข้อมูลเก่า) |
| ค่าปลายทางขึ้นต้นด้วย `[EN]` | **แปลใหม่ (Re-translate)** (เครื่องหมาย Fallback แบบเก่า) |
| Hash ต้นทางไม่เปลี่ยนแปลง และมี Key อยู่แล้ว | **ข้าม (Skip)** |

นี่คือเหตุผลที่ rosetta แปลเฉพาะส่วนที่มีการเปลี่ยนแปลงเท่านั้น — ระบบจะไม่แปลไฟล์ของคุณใหม่ทั้งหมดในการซิงค์แต่ละครั้ง

### 4. การแบ่งกลุ่ม (Batching)

Key จะถูกจัดกลุ่มเป็น Batch (ค่าเริ่มต้น: 80 Key/Batch สำหรับ LLM, 128 สำหรับ Google Translate) การแบ่ง Batch จะช่วยลดจำนวนรอบการเรียก API ในขณะที่ยังคงจัดการ Prompt ได้อย่างเหมาะสม

ในระหว่างการแปล rosetta จะแสดงแถบความคืบหน้าแบบอินไลน์ที่จะอัปเดตหลังจากแต่ละ Batch เสร็จสมบูรณ์:

```
[INFO] fr.json — 2,847 missing
     ████████████████░░░░░░░░░░░░░░░░ 1,440/2,847 keys
```

แถบความคืบหน้าจะแสดงผลโดยใช้ Carriage return `\r` สำหรับการอัปเดตในตำแหน่งเดิม — ไม่มีการเลื่อนหน้าจอ จะถูกระงับในโหมด `--quiet` และ `--json`

### 4b. Translation Memory

ก่อนการแบ่ง Batch rosetta จะตรวจสอบแคชของ Translation Memory (`.rosetta/tm.json`) Key ที่มีข้อความต้นทาง + Locale + Method ตรงกับการแปลก่อนหน้านี้ จะถูกดึงมาจากแคชทันที — โดยไม่ต้องเรียก API

```
  [TM] 142 key(s) served from cache
  Translating 3 key(s) to French (llm)... [OK]
```

TM เป็นกลไกหลักในการประหยัดค่าใช้จ่าย การรัน Sync ใหม่หลังจากมีการเปลี่ยนแปลงเพียง Key เดียว จะแปลเฉพาะ Key นั้น ไม่ใช่ทั้งไฟล์ ดูรายละเอียดเพิ่มเติมได้ที่ [Translation Memory](/docs/concepts/translation-memory)

หากต้องการข้ามการใช้แคชสำหรับการรันครั้งเดียว: `i18n-rosetta sync --no-tm`

### 5. การแปล

แต่ละ Batch จะถูกส่งไปยัง Method การแปลที่กำหนดไว้:

- **`llm`**: Prompt แบบมีโครงสร้างไปยัง OpenRouter พร้อมคำแนะนำเกี่ยวกับระดับภาษา (Register) และเพศ
- **`llm-coached`**: เหมือนข้อบน แต่มีการแทรกกฎไวยากรณ์ พจนานุกรม และหมายเหตุเกี่ยวกับสไตล์เข้าไปด้วย
- **`google-translate`**: การเรียก Google Cloud Translation API v2 แบบ Batch
- **`api`**: HTTP POST ไปยัง Endpoint ปลายทาง

ข้อความระบบ (ระดับภาษา, คำแนะนำเรื่องเพศ, กฎเกณฑ์) จะเหมือนกันในทุก Batch สำหรับ Locale นั้นๆ ซึ่งช่วยให้สามารถทำ **Prompt caching** ได้ — ผู้ให้บริการอย่าง Anthropic และ Google จะแคชข้อความระบบที่ซ้ำกัน ช่วยลดค่าใช้จ่ายของ Token ได้

### 6. Quality Gate

ทุกการแปลจะถูกตรวจสอบความถูกต้องก่อนที่จะเขียนลงดิสก์ โดยจะมีการตรวจสอบ 5 รายการ:

| การตรวจสอบ | สิ่งที่ตรวจจับ | ตัวอย่าง |
|-------|----------------|---------|
| **ว่างเปล่า (Empty/blank)** | Model ไม่ส่งค่าใดๆ กลับมา | `""` |
| **สะท้อนต้นทาง (Source echo)** | Model ส่งคืนข้อความภาษาอังกฤษที่ป้อนเข้าไป | `"Welcome"` สำหรับภาษาญี่ปุ่น |
| **การวนซ้ำ (Hallucination loop)** | Trigram ที่ซ้ำกัน | `"Qo' Qo' Qo' Qo'"` |
| **ความยาวเกินจริง (Length inflation)** | ผลลัพธ์ยาวกว่าต้นทาง 4 เท่าขึ้นไป | ต้นทาง 10 ตัวอักษร → ผลลัพธ์ 50 ตัวอักษร |
| **ความถูกต้องของตัวอักษร (Script compliance)** | ใช้ตัวอักษรผิดสำหรับ Locale นั้น | ข้อความอักษรละตินสำหรับ Locale ภาษาอาหรับ |

ข้อผิดพลาดจะถูกบันทึกโดยมีคำนำหน้า `[GATE]` จะไม่มีการทำ Fallback แบบเงียบๆ

ดูรายละเอียดเพิ่มเติมได้ที่ [Quality Gate](/docs/concepts/quality-gate)

### 6b. การตรวจสอบคำศัพท์ (Terminology Verification)

สำหรับการจับคู่แบบ Coached ที่มีพจนานุกรม rosetta จะตรวจสอบว่า LLM ได้ใช้คำศัพท์ที่กำหนดไว้หลังจากการแปลหรือไม่ การละเมิดจะถูกบันทึกเป็นคำเตือน `[TERM]`:

```
[TERM] en→fr: 2 term violation(s)
  • "dashboard" → expected "tableau de bord" but got "panneau"
```

สิ่งเหล่านี้คือคำเตือน ไม่ใช่ข้อผิดพลาดที่บล็อกการทำงาน — การแปลจะยังคงถูกเขียนลงไป

### 7. การลองใหม่แบบลดหลั่น (Retry Cascade)

เมื่อเกิดข้อผิดพลาดในการแยกวิเคราะห์ JSON หรือข้อผิดพลาดระดับ Batch rosetta จะลองใหม่โดยลดขนาด Batch ลงเรื่อยๆ:

```
Full batch (80 keys) → Failed
  └→ Half batch (40 keys) → 1 failure
      └→ Individual keys (1 each) → Isolates the problem key
```

จำนวนครั้งในการลองใหม่จะถูกจำกัดด้วย `maxRetries` (ค่าเริ่มต้น: 3) เพื่อป้องกันการใช้ Token มากเกินไป

### 8. การเขียนและล็อก (Write & Lock)

การแปลที่ผ่านการตรวจสอบจะถูกเขียนลงในไฟล์ Locale ปลายทาง โดยยังคงโครงสร้าง Nesting เดิมไว้ ไฟล์ล็อกจะถูกอัปเดตด้วยค่า SHA-256 hashes ใหม่

### 9. การตรวจสอบยืนยัน (Verification)

หลังจากประมวลผลการจับคู่ทั้งหมดแล้ว rosetta จะอ่านไฟล์ Locale ที่เขียนลงดิสก์อีกครั้งและรันการตรวจสอบยืนยัน (เว้นแต่จะตั้งค่า `--no-verify`) ขั้นตอนนี้จะช่วยจับข้อผิดพลาดระหว่างที่การซิงค์รายงานว่าสำเร็จแต่ Key กลับผิดพลาดในความเป็นจริง:

- **ความเท่าเทียมกันของ Key (Key parity)** — Key ต้นทางทั้งหมดต้องมีอยู่ในแต่ละปลายทาง
- **เครื่องหมาย Fallback `[EN]`** — เครื่องหมายแบบเก่าจากการรันครั้งก่อนๆ
- **การแปลที่ว่างเปล่า** — ค่าว่างที่หลุดรอดมาได้
- **ความถูกต้องของตัวอักษร** — Locale ที่ไม่ใช่อักษรละตินแต่มีการแปลเป็น ASCII เท่านั้น
- **การคง Placeholder ไว้** — ICU placeholders ต้องตรงกับต้นทาง
- **ปัญหาการเข้ารหัส (Encoding)** — เครื่องหมาย BOM, ตัวอักษรที่มองไม่เห็น

นอกจากนี้ยังสามารถใช้เป็นคำสั่ง `i18n-rosetta verify` แบบ Standalone สำหรับ CI gates ได้อีกด้วย

## การแปลเนื้อหา (ระยะที่ 2)

สำหรับโปรเจกต์ Docusaurus และ Hugo `sync` จะรันระยะที่สองหลังจากการแปล JSON key ระยะนี้จะแปลไฟล์ Markdown และ MDX (เอกสาร, โพสต์บล็อก, บทช่วยสอน) โดยใช้วิธีการและ Quality Gate เดียวกัน

### วิธีการทำงาน

1. Rosetta จะค้นหาไฟล์เนื้อหาต้นทางทั้งหมด (`.md`, `.mdx`) โดยการไล่ดูในไดเรกทอรี content/docs
2. สำหรับแต่ละคู่ของไฟล์ × Locale ระบบจะตรวจสอบไฟล์ล็อกเนื้อหาที่แยกต่างหาก (`.i18n-rosetta-content.lock`) เพื่อหาการเปลี่ยนแปลงของค่า SHA-256 hash
3. ไฟล์ที่มีการเปลี่ยนแปลงหรือสูญหายจะถูกรวบรวมไว้ใน Work-item pool แบบ Flat
4. Pool จะถูกประมวลผลด้วย **Parallel concurrency** (ค่าเริ่มต้น: เรียก API พร้อมกัน 12 รายการ)

```
Phase 2: content (79 translations to process, 341 skipped, concurrency: 12)

    [1/79] (1%)  docs/concepts/security.md → ja [RE-TRANSLATE] (~3328s left)
    [2/79] (3%)  docs/concepts/security.md → th [RE-TRANSLATE] (~1821s left)
    ...
    [79/79] (100%) blog/v3-2-quality.md → de [OK]

  [OK] Created 79 content file(s), 341 unchanged
```

### การทำงานแบบขนาน (Parallelism)

ขณะนี้ทั้งระยะที่ 1 (JSON keys) และระยะที่ 2 (เนื้อหา) จะทำงานแบบขนานกัน:

- **ระยะที่ 1**: การแปล Locale ทั้งหมดจะทำงานพร้อมกัน (ค่าเริ่มต้น: 50 Locale พร้อมกัน) ภายในแต่ละ Locale API batch ก็จะทำงานแบบขนานเช่นกัน (4 Batch พร้อมกัน) การซิงค์ 12 Locale ที่มี 120 Key จะเสร็จสมบูรณ์ในเวลาประมาณ 1 นาทีแทนที่จะเป็น 15 นาที
- **ระยะที่ 2**: การรวมกันของไฟล์×Locale ทั้งหมดจะถูกแปลเป็น Flat pool (ค่าเริ่มต้น: เรียก API พร้อมกัน 12 รายการ) ไฟล์และ Locale ที่แตกต่างกันจะถูกแปลพร้อมๆ กัน

ควบคุมการทำงานแบบขนานด้วย `--json-concurrency`, `--content-concurrency` หรือ `--concurrency` (ตั้งค่าทั้งสองอย่าง):

```bash
# Faster JSON sync (more parallel locale translations)
npx i18n-rosetta sync --json-concurrency 30

# Faster content sync (more parallel API calls)
npx i18n-rosetta sync --content-concurrency 20

# Slower (gentler on rate limits)
npx i18n-rosetta sync --concurrency 4
```

### การปกป้องเนื้อหา

ในระหว่างการแปล rosetta จะปกป้องเนื้อหาที่ไม่สามารถแปลได้:

- **Code blocks** (แบบ Fenced และ Indented) จะถูกแทนที่ด้วย Placeholder
- ฟิลด์ **Frontmatter** ที่ไม่อยู่ในรายการ `translatableFields` จะถูกคงไว้ตามเดิม
- **ลิงก์ (Links)**, พาธรูปภาพ และแท็ก HTML จะถูกปกป้องไว้
- **Shortcodes** และตัวแปร Interpolation (เช่น `{count}`, `{{.Params.title}}`) จะถูกปกป้องไว้

หลังจากการแปล Placeholder ทั้งหมดจะถูกกู้คืนและตรวจสอบความถูกต้อง หากมีส่วนใดสูญหายหรือเสียหาย การแปลนั้นจะถูกปฏิเสธและลองใหม่อีกครั้ง

## ความสำเร็จบางส่วน (Partial Success)

Batch ที่ล้มเหลวหนึ่งรายการจะไม่บล็อกการทำงานส่วนที่เหลือ หาก 9 ใน 10 Batch สำเร็จ ทั้ง 9 Batch นั้นจะถูกเขียนลงไป Batch ที่ล้มเหลวจะถูกบันทึกไว้ และคุณสามารถรัน `sync` ใหม่เพื่อลองอีกครั้งได้

## Dry Run

ดูตัวอย่างสิ่งที่จะเปลี่ยนแปลงโดยไม่มีการเขียนไฟล์ใดๆ:

```bash
npx i18n-rosetta sync --dry-run
```

## บังคับแปลใหม่ (Force Re-translate)

บังคับให้แปล Key ที่ระบุใหม่แม้ว่าจะไม่มีการเปลี่ยนแปลงก็ตาม:

```bash
npx i18n-rosetta sync --force-keys "hero.title,nav.about"
```

## การประเมินค่าใช้จ่าย

ก่อนทำการแปล rosetta จะสร้าง **รายงานค่าใช้จ่ายก่อนการซิงค์ (Pre-sync cost report)** ที่แสดงค่าใช้จ่ายโดยประมาณต่อคู่ ซึ่งจะทำงานโดยอัตโนมัติในทุกๆ `sync` — คุณจะเห็นรายงานนี้ก่อนที่จะมีการเรียก API ใดๆ

```
╔══════════════════════════════════════════════════════════╗
║  Cost Estimate                                          ║
╠════════════╦═══════╦════════════╦════════════════════════╣
║ Pair       ║ Keys  ║ Est. Cost  ║ Method                 ║
╠════════════╬═══════╬════════════╬════════════════════════╣
║ en → fr    ║   142 ║ $0.07      ║ google-translate       ║
║ en → ja    ║    38 ║   —        ║ llm (model-dependent)  ║
║ en → crk   ║    38 ║   —        ║ llm-coached            ║
╚════════════╩═══════╩════════════╩════════════════════════╝
```

### สิ่งที่ได้รับการประเมิน

Method การแปลแต่ละวิธีจะมีการประเมินค่าใช้จ่ายของตัวเอง:

| Method | เกณฑ์ค่าใช้จ่าย | ความแม่นยำ |
|--------|-----------|-----------|
| `google-translate` | อัตราที่เผยแพร่ของ Google ($20/ล้านตัวอักษร) | แม่นยำ |
| `llm` | แตกต่างกันไปตาม Model ของ OpenRouter | ขึ้นอยู่กับ Model — ตรวจสอบ [ราคา OpenRouter](https://openrouter.ai/models) |
| `llm-coached` | เหมือนกับ `llm` บวกกับ Token ของบริบทการโค้ช | ขึ้นอยู่กับ Model |
| `api` | กำหนดโดยเซิร์ฟเวอร์ | ไม่ทราบ — ไม่สามารถประเมินได้หากไม่สอบถามไปยัง Endpoint |

เมื่อ Method ไม่สามารถระบุค่าใช้จ่ายได้ (LLM methods, remote APIs) rosetta จะรายงาน `—` แทนที่จะคาดเดา ใช้ `--dry` เพื่อดูการประเมินค่าใช้จ่ายโดยไม่ต้องทำการแปลจริง

---

## ดูเพิ่มเติม

- [CLI Reference — sync](/docs/reference/cli#sync) — แฟล็กคำสั่งและตัวเลือกต่างๆ
- [Translation Memory](/docs/concepts/translation-memory) — การแคชและการประหยัดค่าใช้จ่าย
- [Quality Gate](/docs/concepts/quality-gate) — วิธีการตรวจสอบความถูกต้องของการแปล
- [Translation Methods](/docs/guides/translation-methods) — วิธีการทำงานของแต่ละ Method
- [Working with Professional Translators](/docs/guides/professional-translators) — เวิร์กโฟลว์ XLIFF
- [Configuration](/docs/getting-started/configuration) — ข้อมูลอ้างอิง Config
- [CI/CD Guide](/docs/guides/ci-cd) — การทำระบบอัตโนมัติสำหรับการซิงค์ใน Pipeline ของคุณ