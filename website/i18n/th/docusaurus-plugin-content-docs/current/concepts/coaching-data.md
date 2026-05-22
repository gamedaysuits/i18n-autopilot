---
sidebar_position: 5
title: "ข้อมูลการโค้ช"
---
# Coaching Data

Coaching data คือกลไกของ rosetta สำหรับสอน LLM เกี่ยวกับภาษาที่ไม่ได้ถูกฝึกฝนมาครับ ด้วยการให้กฎไวยากรณ์ พจนานุกรม และบันทึกรูปแบบภาษา (style notes) ควบคู่ไปกับคำขอแปลแต่ละครั้ง คุณจะสามารถเปลี่ยน LLM อเนกประสงค์ให้กลายเป็นนักแปลที่เข้าใจบริบทสำหรับภาษาใดก็ได้ รวมถึงภาษาที่ไม่มีการรองรับ MT (Machine Translation) อยู่เลยครับ

## วิธีการทำงาน

เมื่อคุณตั้งค่า method ของคู่ภาษาเป็น `llm-coached` rosetta จะโหลดไฟล์ coaching จาก `.rosetta/coaching/<locale>.json` และแทรกเนื้อหาลงใน prompt ของ LLM ทุกครั้งในฐานะส่วนหนึ่งของ system message ครับ LLM จะเห็นกฎทางภาษาของคุณควบคู่ไปกับคำขอแปล ทำให้สามารถสร้างผลลัพธ์ที่ปฏิบัติตามไวยากรณ์และคำศัพท์ของคุณแทนที่จะเป็นการคาดเดาครับ

```
┌──────────────────────────────────────────────────────┐
│ System Message (cached across batches)               │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Base translation rules                           │ │
│ │ + Register instructions                          │ │
│ │ + Grammar rules (from coaching data)             │ │
│ │ + Dictionary entries (from coaching data)         │ │
│ │ + Style notes (from coaching data)               │ │
│ └──────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────┤
│ User Message (per batch)                             │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Keys to translate (JSON)                         │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

เนื่องจาก coaching data เป็นส่วนหนึ่งของ system message จึงได้รับประโยชน์จาก **prompt caching** ครับ ผู้ให้บริการอย่าง Anthropic และ Google จะทำการแคช system prefixes ที่ซ้ำกัน ดังนั้นคุณจึงจ่ายค่า coaching context เพียงครั้งเดียวต่อเซสชัน ไม่ใช่ต่อแบทช์ (batch) ครับ

## รูปแบบไฟล์ Coaching

สร้างไฟล์ JSON หนึ่งไฟล์ต่อ locale ใน `.rosetta/coaching/` ครับ:

```json title=".rosetta/coaching/crk.json"
{
  "grammar_rules": [
    "Plains Cree is polysynthetic — a single word can express what English needs a full sentence for",
    "Animate/inanimate noun distinction affects verb conjugation",
    "Use SRO (Standard Roman Orthography) unless script converter handles conversion",
    "Verb stems are modified by prefixes and suffixes to indicate person, number, tense, and evidentiality"
  ],
  "dictionary": {
    "home": "kīwēwin",
    "settings": "isi-nākatohkēwin",
    "search": "nānātawāpahtam",
    "welcome": "tānisi",
    "submit": "ispīhci",
    "cancel": "pōni"
  },
  "style_notes": "Use formal register. Preserve English technical terms in parentheses when no Cree equivalent exists. Avoid loanwords when a descriptive Cree expression exists."
}
```

### ฟิลด์ (Fields)

| ฟิลด์ | ประเภท | จำเป็นต้องมี | คำอธิบาย |
|-------|------|----------|-------------|
| `grammar_rules` | `string[]` | ไม่ | Array ของกฎไวยากรณ์ที่จะถูกแทรกลงใน system prompt ครับ แต่ละกฎควรเป็นคำสั่งที่กระชับและนำไปปฏิบัติได้จริงซึ่ง LLM สามารถทำตามได้ |
| `dictionary` | `object` | ไม่ | Key-value map ของคำศัพท์ภาษาอังกฤษ → คำศัพท์ภาษาเป้าหมาย ใช้สำหรับคำศัพท์เฉพาะทาง (domain-specific) ที่ LLM อาจไม่รู้จักครับ |
| `style_notes` | `string` | ไม่ | คำสั่งเกี่ยวกับรูปแบบภาษาแบบอิสระ (ระดับภาษา, น้ำเสียง, ธรรมเนียมความสุภาพ) ครับ |

ทุกฟิลด์เป็นตัวเลือกเสริม (optional) ครับ — คุณสามารถเริ่มต้นด้วยพจนานุกรมเพียงอย่างเดียว และเพิ่มกฎไวยากรณ์ในภายหลังเมื่อคุณต้องการปรับปรุงให้ดีขึ้นครับ

## พฤติกรรม Fallback

หากคู่ภาษาถูกกำหนดค่าเป็น `llm-coached` แต่ไม่มีไฟล์ coaching สำหรับ locale นั้น rosetta **จะเปลี่ยนกลับไปใช้ method `llm` มาตรฐาน (fallback)** พร้อมกับแสดงคำเตือนในคอนโซลครับ:

```
[INFO] No coaching data for "crk" at .rosetta/coaching/crk.json
       Falling back to standard LLM method. Create coaching data for better results.
```

ซึ่งหมายความว่าคุณสามารถตั้งค่า `"defaultMethod": "llm-coached"` แบบโกลบอล (globally) ได้อย่างปลอดภัยครับ — ภาษาที่มี coaching data จะใช้งานข้อมูลนั้น ส่วนภาษาที่เหลือจะได้รับการแปลผ่าน LLM มาตรฐานโดยไม่มีข้อผิดพลาดครับ

## เมื่อใดควรใช้ Coaching

| สถานการณ์ | Method ที่แนะนำ |
|----------|-------------------|
| ภาษา Tier 1 (ฝรั่งเศส, สเปน, เยอรมัน) | `llm` หรือ `google-translate` — LLM รู้จักภาษาเหล่านี้ดีอยู่แล้วครับ |
| ภาษา Tier 2 (เกาหลี, ตุรกี, ไทย) | `llm` พร้อมระบุระดับภาษา (register) — LLM จัดการภาษาเหล่านี้ได้ดีเพียงพอเมื่อมีคำแนะนำด้านรูปแบบครับ |
| ภาษา Tier 3 (Plains Cree, Yoruba, Quechua) | `llm-coached` — LLM จำเป็นต้องใช้กฎไวยากรณ์และพจนานุกรมครับ |
| ภาษาประดิษฐ์ (Conlangs) (Klingon, Sindarin, Kryptonian) | `llm-coached` — LLM มีข้อมูลการฝึกฝนอยู่บ้างแต่ยังต้องการการแก้ไขครับ |

## การสร้าง Coaching Data ที่ดี

### กฎไวยากรณ์ (Grammar Rules)

เขียนกฎในรูปแบบของ **คำสั่ง (instructions)** ไม่ใช่คำอธิบายครับ LLM สามารถทำตามคำสั่งได้ดีกว่าการตีความทฤษฎีทางภาษาศาสตร์ครับ

```json
// ❌ Descriptive (the LLM learns nothing actionable)
"Plains Cree has animate and inanimate noun classes"

// ✅ Instructive (the LLM knows what to do)
"When translating nouns, check whether the Cree equivalent is animate (NA) or inanimate (NI) — this affects which verb conjugation to use"
```

### พจนานุกรม (Dictionaries)

มุ่งเน้นไปที่ **คำศัพท์เฉพาะทาง (domain-specific terms)** ที่ LLM อาจแปลผิดหรือคิดค้นขึ้นมาเองครับ ไม่จำเป็นต้องใส่คำศัพท์ทั่วไปที่ LLM สามารถจัดการได้อยู่แล้ว — ให้เน้นไปที่คำศัพท์เฉพาะสำหรับ UI ของแอปพลิเคชันของคุณครับ

### บันทึกรูปแบบภาษา (Style Notes)

ระบุรายละเอียดให้ชัดเจนเกี่ยวกับระดับภาษา (register) ความเป็นทางการ และธรรมเนียมปฏิบัติต่าง ๆ ครับ:

```json
"style_notes": "Use formal register (vous-form in French). Preserve brand names untranslated. UI labels should be imperative mood ('Save', not 'Saves'). Maximum 40 characters for button text."
```

## การทดสอบการแปลแบบ Coached

ใช้ [MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness) เพื่อวัดประสิทธิภาพ (benchmark) การแปลแบบ coached ของคุณเทียบกับคลังข้อมูลอ้างอิง (reference corpus) ครับ:

```bash
# Install the harness
pip install mt-eval-harness

# Run coached translations against your test corpus
mt-eval run --corpus data/crk-corpus.json --model google/gemini-2.5-pro

# Score the results
mt-eval test eval/logs/run_*.json
```

สิ่งนี้จะให้คะแนน chrF++, BLEU และ exact match แก่คุณครับ คุณสามารถสร้างไฟล์ coaching หลาย ๆ เวอร์ชันแล้วนำมาเปรียบเทียบกัน — การวัดผลด้วยตัวชี้วัดเชิงวัตถุวิสัย (objective metrics) นั้นดีกว่าการตรวจสอบด้วยความรู้สึกส่วนตัว (subjective review) ครับ

## ดูเพิ่มเติม

- [Low-Resource Languages](/docs/guides/low-resource-languages) — คำแนะนำแบบละเอียดสำหรับการสร้างไปป์ไลน์การแปล (translation pipeline) ตั้งแต่เริ่มต้นครับ
- [Translation Methods](/docs/guides/translation-methods) — การเปรียบเทียบ method ทั้งหมดที่มีให้ใช้งานครับ
- [Build a Plugin](/docs/tutorials/build-a-plugin) — การแพ็กเกจ coached method ให้เป็นปลั๊กอินที่สามารถนำกลับมาใช้ใหม่ได้ครับ