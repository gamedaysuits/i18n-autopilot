---
sidebar_position: 2
title: "การทำงานของ Sync"
---
# การทำงานของ Sync

คำสั่ง `sync` คือการทำงานหลักของ rosetta และนี่คือสิ่งที่จะเกิดขึ้นเมื่อคุณรัน `npx i18n-rosetta sync`

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

### 1. การอ่านค่า Config

Rosetta จะโหลด `i18n-rosetta.config.json` (หรือตรวจจับการตั้งค่าโดยอัตโนมัติ) โดยจะจัดการสิ่งต่อไปนี้:
- Locale ต้นทางและ locale ปลายทาง
- กราฟการจับคู่ (การจับคู่ต้นทาง→ปลายทางใดบ้างที่ต้องประมวลผล)
- การตั้งค่า method, model และคุณภาพสำหรับแต่ละคู่

ก่อนที่จะสแกนไฟล์ rosetta จะแสดงส่วนหัวตอนเริ่มต้นทำงาน:

```
i18n-rosetta v3.3.2

[INFO] Detected format: json (auto)
[INFO] Detected framework: Hugo
```

- **ป้ายแสดงเวอร์ชัน**: แสดงเวอร์ชันที่ติดตั้งไว้สำหรับการดีบักและการรายงานปัญหา
- **การตรวจจับรูปแบบไฟล์**: รายงานรูปแบบไฟล์และระบุว่าเป็นการตรวจจับอัตโนมัติ `(auto)` หรือมีการตั้งค่าไว้อย่างชัดเจน `(config)` รองรับ `json`, `toml` และ `yaml`
- **การตรวจจับ Framework**: เมื่อมีการตั้งค่า `contentDir` จะทำการระบุ framework (`Hugo`) เพื่อยืนยันว่าการซิงค์เนื้อหา (content sync) ทำงานอยู่

### 2. การสแกนไฟล์ต้นทาง

ไฟล์ locale ต้นทางจะถูกโหลดและแปลงให้อยู่ในรูปแบบ key→value map แบบแบนราบ (flattened):

```json
// Input (nested)
{ "hero": { "title": "Welcome", "subtitle": "Build" } }

// Flattened
{ "hero.title": "Welcome", "hero.subtitle": "Build" }
```

### 3. การตรวจจับการเปลี่ยนแปลง

Rosetta จะอ่าน `.i18n-rosetta.lock` ซึ่งเก็บค่า SHA-256 hashes ของค่าต้นทางที่เคยแปลไปแล้ว สำหรับแต่ละ key ระบบจะตรวจสอบดังนี้:

| เงื่อนไข | การดำเนินการ |
|-----------|--------|
| ไม่มี Key ในไฟล์ปลายทาง | **แปล** |
| Hash ต้นทางเปลี่ยนไปจากการซิงค์ครั้งล่าสุด | **แปลใหม่** (ข้อมูลเก่า) |
| ค่าปลายทางขึ้นต้นด้วย `[EN]` | **แปลใหม่** (เครื่องหมาย fallback แบบเก่า) |
| Hash ต้นทางไม่เปลี่ยนแปลง และมี key อยู่แล้ว | **ข้าม** |

นี่คือเหตุผลที่ rosetta แปลเฉพาะส่วนที่มีการเปลี่ยนแปลงเท่านั้น — ระบบไม่ได้แปลไฟล์ของคุณใหม่ทั้งหมดในทุกๆ การซิงค์

### 4. การจัดกลุ่ม (Batching)

Key ต่างๆ จะถูกจัดกลุ่มเป็น batch (ค่าเริ่มต้น: 80 keys/batch สำหรับ LLM, 128 สำหรับ Google Translate) การจัดกลุ่มช่วยลดจำนวนครั้งในการเรียก API ในขณะที่ยังคงรักษาขนาดของ prompt ให้อยู่ในระดับที่จัดการได้

ในระหว่างการแปล rosetta จะแสดงแถบความคืบหน้าแบบอินไลน์ที่จะอัปเดตหลังจากแต่ละ batch เสร็จสมบูรณ์:

```
[INFO] fr.json — 2,847 missing
     ████████████████░░░░░░░░░░░░░░░░ 1,440/2,847 keys
```

แถบความคืบหน้าจะแสดงผลโดยใช้ `\r` carriage return เพื่ออัปเดตในบรรทัดเดิม — ไม่มีการเลื่อนหน้าจอ จะถูกระงับการแสดงผลในโหมด `--quiet` และ `--json`

### 4b. Translation Memory

ก่อนการจัดกลุ่ม rosetta จะตรวจสอบแคชของ Translation Memory (`.rosetta/tm.json`) Key ที่มีข้อความต้นทาง + locale + method ตรงกับที่เคยแปลไปแล้ว จะถูกดึงมาจากแคชทันที — โดยไม่ต้องเรียก API

```
  [TM] 142 key(s) served from cache
  Translating 3 key(s) to French (llm)... [OK]
```

TM คือกลไกหลักในการประหยัดค่าใช้จ่าย การรัน sync ใหม่หลังจากมีการเปลี่ยนแปลงเพียง key เดียว จะแปลเฉพาะ key นั้น ไม่ใช่ทั้งไฟล์ ดูรายละเอียดเพิ่มเติมได้ที่ [Translation Memory](/docs/concepts/translation-memory)

หากต้องการข้ามการใช้แคชสำหรับการรันเพียงครั้งเดียว: `i18n-rosetta sync --no-tm`

### 5. การแปล

แต่ละ batch จะถูกส่งไปยัง translation method ที่ตั้งค่าไว้:

- **`llm`**: ส่ง prompt แบบมีโครงสร้างไปยัง OpenRouter พร้อมคำแนะนำเรื่องระดับภาษา (register) และเพศ
- **`llm-coached`**: เหมือนกัน แต่มีการแทรกกฎไวยากรณ์ พจนานุกรม และบันทึกรูปแบบการเขียน (style notes) เข้าไปด้วย
- **`google-translate`**: การส่ง request แบบ batch ไปยัง Google Cloud Translation API v2
- **`api`**: ส่ง HTTP POST ไปยัง remote endpoint

ข้อความระบบ (ระดับภาษา, คำแนะนำเรื่องเพศ, กฎต่างๆ) จะเหมือนกันในทุกๆ batch สำหรับ locale นั้นๆ ซึ่งช่วยให้เกิด **prompt caching** — ผู้ให้บริการอย่าง Anthropic และ Google จะแคชข้อความระบบที่ซ้ำกัน ช่วยลดค่าใช้จ่ายของ token ได้

### 6. Quality Gate

ทุกการแปลจะถูกตรวจสอบความถูกต้องก่อนที่จะเขียนลงดิสก์ โดยจะมีการตรวจสอบ 5 รายการ:

| การตรวจสอบ | สิ่งที่ตรวจจับได้ | ตัวอย่าง |
|-------|----------------|---------|
| **ว่างเปล่า/ไม่มีข้อมูล** | Model ไม่ส่งค่าใดๆ กลับมา | `""` |
| **คืนค่าต้นทาง** | Model ส่งคืนข้อความภาษาอังกฤษที่รับเข้าไป | `"Welcome"` สำหรับภาษาญี่ปุ่น |
| **การวนลูปแบบ Hallucination** | มีการทำซ้ำ trigrams | `"Qo' Qo' Qo' Qo'"` |
| **ความยาวเกินจริง** | ผลลัพธ์ยาวกว่าต้นทาง 4 เท่าขึ้นไป | ต้นทาง 10 ตัวอักษร → ผลลัพธ์ 50 ตัวอักษร |
| **ความถูกต้องของตัวอักษร** | ใช้ตัวอักษรผิดสำหรับ locale นั้น | ข้อความละตินสำหรับ locale ภาษาอาหรับ |

ข้อผิดพลาดจะถูกบันทึกไว้พร้อมกับคำนำหน้า `[GATE]` จะไม่มีการ fallback แบบเงียบๆ

ดูรายละเอียดเพิ่มเติมได้ที่ [Quality Gate](/docs/concepts/quality-gate)

### 6b. การตรวจสอบคำศัพท์ (Terminology Verification)

สำหรับการจับคู่แบบ coached ที่มีพจนานุกรม rosetta จะตรวจสอบว่า LLM ได้ใช้คำศัพท์ที่กำหนดไว้หลังจากการแปลหรือไม่ การละเมิดจะถูกบันทึกเป็นคำเตือน `[TERM]`:

```
[TERM] en→fr: 2 term violation(s)
  • "dashboard" → expected "tableau de bord" but got "panneau"
```

สิ่งเหล่านี้เป็นเพียงคำเตือน ไม่ใช่ข้อผิดพลาดที่บล็อกการทำงาน — การแปลจะยังคงถูกเขียนลงไฟล์

### 7. การลองใหม่แบบลดหลั่น (Retry Cascade)

เมื่อเกิดความล้มเหลวในการแยกวิเคราะห์ JSON หรือเกิดข้อผิดพลาดระดับ batch rosetta จะลองใหม่โดยลดขนาด batch ลงเรื่อยๆ:

```
Full batch (80 keys) → Failed
  └→ Half batch (40 keys) → 1 failure
      └→ Individual keys (1 each) → Isolates the problem key
```

จำนวนครั้งในการลองใหม่จะถูกจำกัดโดย `maxRetries` (ค่าเริ่มต้น: 3) เพื่อป้องกันการใช้ token มากเกินไป

### 8. การเขียนและการล็อก (Write & Lock)

การแปลที่ผ่านการตรวจสอบจะถูกเขียนลงในไฟล์ locale ปลายทาง โดยยังคงโครงสร้างการซ้อนทับ (nesting structure) แบบเดิมไว้ ไฟล์ล็อกจะถูกอัปเดตด้วยค่า SHA-256 hashes ใหม่

### 9. การตรวจสอบความถูกต้อง (Verification)

หลังจากประมวลผลทุกคู่เสร็จสิ้น rosetta จะอ่านไฟล์ locale ที่เขียนลงดิสก์อีกครั้งและทำการตรวจสอบความถูกต้อง (ยกเว้นจะมีการตั้งค่า `--no-verify`) ขั้นตอนนี้ช่วยตรวจจับช่องโหว่ระหว่างการรายงานผลการซิงค์ว่าสำเร็จกับความผิดพลาดของ key ที่เกิดขึ้นจริง:

- **ความเท่าเทียมกันของ Key** — key ต้นทางทั้งหมดต้องมีอยู่ในแต่ละไฟล์ปลายทาง
- **เครื่องหมาย fallback `[EN]`** — เครื่องหมายแบบเก่าจากการรันครั้งก่อนๆ
- **การแปลที่ว่างเปล่า** — ค่าว่างที่หลุดรอดไปได้
- **ความถูกต้องของตัวอักษร** — locale ที่ไม่ใช่ภาษาละตินแต่มีการแปลเป็น ASCII เท่านั้น
- **การรักษา Placeholder** — ICU placeholders ต้องตรงกับต้นทาง
- **ปัญหาการเข้ารหัส** — เครื่องหมาย BOM, ตัวอักษรที่มองไม่เห็น

นอกจากนี้ยังสามารถใช้เป็นคำสั่ง `i18n-rosetta verify` แบบสแตนด์อโลนสำหรับ CI gates ได้อีกด้วย

## การแปลเนื้อหา (Phase 2)

สำหรับโปรเจกต์ Docusaurus และ Hugo `sync` จะรันเฟสที่สองหลังจากการแปล JSON key เฟสนี้จะแปลไฟล์ Markdown และ MDX (เอกสาร, บล็อกโพสต์, บทช่วยสอน) โดยใช้วิธีการและ quality gate เดียวกัน

### วิธีการทำงาน

1. Rosetta จะค้นหาไฟล์เนื้อหาต้นทางทั้งหมด (`.md`, `.mdx`) โดยการไล่ดูในไดเรกทอรี content/docs
2. สำหรับแต่ละคู่ของไฟล์ × locale ระบบจะตรวจสอบไฟล์ล็อกเนื้อหาที่แยกต่างหาก (`.i18n-rosetta-content.lock`) เพื่อหาการเปลี่ยนแปลงของค่า SHA-256 hash
3. ไฟล์ที่มีการเปลี่ยนแปลงหรือสูญหายจะถูกรวบรวมไว้ในพูลรายการงานแบบแบนราบ (flat work-item pool)
4. พูลดังกล่าวจะถูกประมวลผลด้วย **การทำงานพร้อมกันแบบขนาน (parallel concurrency)** (ค่าเริ่มต้น: เรียก API พร้อมกัน 12 รายการ)

```
Phase 2: content (79 translations to process, 341 skipped, concurrency: 48)

    [1/79] (1%)  docs/concepts/security.md → ja [RE-TRANSLATE] (~3328s left)
    [2/79] (3%)  docs/concepts/security.md → th [RE-TRANSLATE] (~1821s left)
    ...
    [79/79] (100%) blog/v3-2-quality.md → de [OK]

  [OK] Created 79 content file(s), 341 unchanged
```

### การทำงานแบบขนาน (Parallelism)

ขณะนี้ทั้ง Phase 1 (JSON keys) และ Phase 2 (เนื้อหา) ทำงานแบบขนานกัน:

- **Phase 1**: การแปล locale ทั้งหมดจะทำงานพร้อมกัน (ค่าเริ่มต้น: 50 locales พร้อมกัน) ภายในแต่ละ locale การทำงานแบบ API batches ก็จะรันแบบขนานเช่นกัน (4 batches พร้อมกัน) การซิงค์ 12-locale ที่มี 120 keys จะเสร็จสิ้นในเวลาประมาณ 1 นาทีแทนที่จะเป็น 15 นาที
- **Phase 2**: การรวมกันของไฟล์×locale ทั้งหมดจะถูกแปลเป็นพูลแบบแบนราบ (ค่าเริ่มต้น: เรียก API พร้อมกัน 12 รายการ) ไฟล์ที่แตกต่างกันและ locale ที่แตกต่างกันจะถูกแปลไปพร้อมๆ กัน

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

- **บล็อกโค้ด** (แบบมีกรอบและแบบย่อหน้า) จะถูกแทนที่ด้วย placeholders
- ฟิลด์ **Frontmatter** ที่ไม่อยู่ในรายการ `translatableFields` จะถูกเก็บไว้ตามเดิม
- **ลิงก์**, พาธของรูปภาพ และแท็ก HTML จะถูกปกป้องไว้
- **Shortcodes** และตัวแปรแทรก (เช่น `{count}`, `{{.Params.title}}`) จะถูกป้องกันไว้

หลังจากการแปล placeholders ทั้งหมดจะถูกกู้คืนและตรวจสอบความถูกต้อง หากมีส่วนใดขาดหายไปหรือเสียหาย การแปลนั้นจะถูกปฏิเสธและทำการลองใหม่

## ความสำเร็จบางส่วน (Partial Success)

batch ที่ล้มเหลวเพียงหนึ่งรายการจะไม่บล็อกการทำงานส่วนที่เหลือ หาก 9 จาก 10 batches สำเร็จ ทั้ง 9 รายการนั้นจะถูกเขียนลงไฟล์ batch ที่ล้มเหลวจะถูกบันทึกไว้ และคุณสามารถรัน `sync` อีกครั้งเพื่อลองใหม่ได้

## การทดสอบรัน (Dry Run)

ดูตัวอย่างสิ่งที่จะเปลี่ยนแปลงโดยไม่มีการเขียนไฟล์ใดๆ:

```bash
npx i18n-rosetta sync --dry-run
```

## บังคับแปลใหม่ (Force Re-translate)

บังคับให้แปล key ที่ระบุใหม่แม้ว่าจะไม่มีการเปลี่ยนแปลงก็ตาม:

```bash
npx i18n-rosetta sync --force-keys "hero.title,nav.about"
```

## การประเมินค่าใช้จ่าย

ก่อนทำการแปล rosetta จะสร้าง **รายงานค่าใช้จ่ายก่อนการซิงค์ (pre-sync cost report)** ซึ่งแสดงค่าใช้จ่ายโดยประมาณต่อคู่ การทำงานนี้จะรันโดยอัตโนมัติในทุกๆ `sync` — คุณจะเห็นรายงานนี้ก่อนที่จะมีการเรียก API ใดๆ

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

แต่ละ translation method จะมีการประเมินค่าใช้จ่ายของตัวเอง:

| Method | เกณฑ์ค่าใช้จ่าย | ความแม่นยำ |
|--------|-----------|-----------|
| `google-translate` | อัตราที่เผยแพร่โดย Google ($20/ล้านตัวอักษร) | แม่นยำ |
| `llm` | แตกต่างกันไปตามโมเดลของ OpenRouter | ขึ้นอยู่กับโมเดล — ตรวจสอบ [ราคาของ OpenRouter](https://openrouter.ai/models) |
| `llm-coached` | เหมือนกับ `llm` บวกกับ token ของบริบทการโค้ช | ขึ้นอยู่กับโมเดล |
| `api` | กำหนดโดยเซิร์ฟเวอร์ | ไม่ทราบ — ไม่สามารถประเมินได้หากไม่สอบถามไปยัง endpoint |

เมื่อ method ใดไม่สามารถกำหนดค่าใช้จ่ายได้ (LLM methods, remote APIs) rosetta จะรายงานเป็น `—` แทนที่จะคาดเดา ใช้ `--dry` เพื่อดูการประเมินค่าใช้จ่ายโดยไม่ต้องทำการแปลจริง

---

## ดูเพิ่มเติม

- [CLI Reference — sync](/docs/reference/cli#sync) — แฟล็กคำสั่งและตัวเลือกต่างๆ
- [Translation Memory](/docs/concepts/translation-memory) — การแคชและการประหยัดค่าใช้จ่าย
- [Quality Gate](/docs/concepts/quality-gate) — วิธีการตรวจสอบความถูกต้องของการแปล
- [Translation Methods](/docs/guides/translation-methods) — วิธีการทำงานของแต่ละ method
- [Working with Professional Translators](/docs/guides/professional-translators) — เวิร์กโฟลว์ XLIFF
- [Configuration](/docs/getting-started/configuration) — ข้อมูลอ้างอิงการตั้งค่า config
- [CI/CD Guide](/docs/guides/ci-cd) — การทำ sync อัตโนมัติใน pipeline ของคุณ