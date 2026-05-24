---
sidebar_position: 5
title: "ข้อมูลการโค้ช"
---
# ข้อมูล Coaching

ข้อมูล Coaching เป็นกลไกของ rosetta สำหรับสอน LLMs เกี่ยวกับภาษาที่พวกมันไม่ได้รับการฝึกฝนมา ด้วยการให้กฎไวยากรณ์ พจนานุกรม และบันทึกรูปแบบ (style notes) ควบคู่ไปกับคำขอแปลแต่ละครั้ง คุณจะเปลี่ยน LLM อเนกประสงค์ให้กลายเป็นนักแปลที่เข้าใจบริบทสำหรับภาษาใดก็ได้ — รวมถึงภาษาที่ไม่มีการรองรับ MT อยู่เลย

## วิธีการทำงาน

เมื่อคุณตั้งค่า method ของคู่ภาษาเป็น `llm-coached` rosetta จะโหลดไฟล์ coaching จาก `.rosetta/coaching/<locale>.json` และแทรกเนื้อหาเข้าไปใน prompt ของ LLM ทุกครั้งในฐานะส่วนหนึ่งของ system message LLM จะเห็นกฎทางภาษาของคุณควบคู่ไปกับคำขอแปล ทำให้สร้างผลลัพธ์ที่ปฏิบัติตามไวยากรณ์และคำศัพท์ของคุณแทนที่จะเป็นการคาดเดา

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

เนื่องจากข้อมูล Coaching เป็นส่วนหนึ่งของ system message จึงได้รับประโยชน์จาก **prompt caching** — ผู้ให้บริการอย่าง Anthropic และ Google จะแคช system prefixes ที่ซ้ำกัน ดังนั้นคุณจึงจ่ายค่าบริบท coaching เพียงครั้งเดียวต่อเซสชัน ไม่ใช่ครั้งเดียวต่อแบตช์

## รูปแบบไฟล์ Coaching

สร้างไฟล์ JSON หนึ่งไฟล์ต่อ locale ใน `.rosetta/coaching/`:

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

### ฟิลด์

| ฟิลด์ | ประเภท | จำเป็น | คำอธิบาย |
|-------|------|----------|-------------|
| `grammar_rules` | `string[]` | ไม่ | Array ของกฎไวยากรณ์ที่จะถูกแทรกเข้าไปใน system prompt แต่ละกฎควรเป็นคำสั่งที่กระชับและนำไปปฏิบัติได้จริงซึ่ง LLM สามารถทำตามได้ |
| `dictionary` | `object` | ไม่ | Key-value map ของคำศัพท์ภาษาอังกฤษ → คำศัพท์ภาษาเป้าหมาย ใช้สำหรับคำศัพท์เฉพาะทาง (domain-specific) ที่ LLM อาจไม่รู้จัก |
| `style_notes` | `string` | ไม่ | คำสั่งรูปแบบอิสระ (ระดับภาษา, น้ำเสียง, ธรรมเนียมความสุภาพ) |

ทุกฟิลด์เป็นทางเลือก (optional) — คุณสามารถเริ่มต้นด้วยพจนานุกรมเพียงอย่างเดียว และเพิ่มกฎไวยากรณ์ในภายหลังเมื่อคุณปรับปรุงให้ดีขึ้น

## พฤติกรรม Fallback

หากคู่ภาษาถูกกำหนดค่าสำหรับ `llm-coached` แต่ไม่มีไฟล์ coaching สำหรับ locale นั้น rosetta **จะถอยกลับไปใช้วิธี `llm` มาตรฐาน** พร้อมกับแสดงคำเตือนในคอนโซล:

```
[INFO] No coaching data for "crk" at .rosetta/coaching/crk.json
       Falling back to standard LLM method. Create coaching data for better results.
```

ซึ่งหมายความว่าคุณสามารถตั้งค่า `"defaultMethod": "llm-coached"` แบบโกลบอลได้อย่างปลอดภัย — ภาษาที่มีข้อมูล coaching จะใช้งานข้อมูลนั้น และภาษาที่เหลือจะได้รับการแปลจาก LLM มาตรฐานโดยไม่มีข้อผิดพลาด

## เมื่อใดควรใช้ Coaching

| สถานการณ์ | วิธีที่แนะนำ |
|----------|-------------------|
| ภาษา Tier 1 (French, Spanish, German) | `llm` หรือ `google-translate` — LLMs รู้จักภาษาเหล่านี้ดีอยู่แล้ว |
| ภาษา Tier 2 (Korean, Turkish, Thai) | `llm` พร้อมการกำหนดระดับภาษา (register) — LLMs จัดการภาษาเหล่านี้ได้ดีเพียงพอเมื่อมีคำแนะนำด้านรูปแบบ |
| ภาษา Tier 3 (Plains Cree, Yoruba, Quechua) | `llm-coached` — LLMs ต้องการกฎไวยากรณ์และพจนานุกรม |
| ภาษาประดิษฐ์ (Klingon, Sindarin, Kryptonian) | `llm-coached` — LLMs มีข้อมูลการฝึกฝนอยู่บ้างแต่ต้องการการแก้ไข |

## การสร้างข้อมูล Coaching ที่ดี

### กฎไวยากรณ์

เขียนกฎเป็น **คำสั่ง** ไม่ใช่คำอธิบาย LLM ปฏิบัติตามคำสั่งได้ดีกว่าการตีความทฤษฎีทางภาษาศาสตร์

```json
// ❌ Descriptive (the LLM learns nothing actionable)
"Plains Cree has animate and inanimate noun classes"

// ✅ Instructive (the LLM knows what to do)
"When translating nouns, check whether the Cree equivalent is animate (NA) or inanimate (NI) — this affects which verb conjugation to use"
```

### พจนานุกรม

มุ่งเน้นไปที่ **คำศัพท์เฉพาะทาง (domain-specific terms)** ที่ LLM อาจแปลผิดหรือสร้างคำขึ้นมาเอง ไม่ต้องกังวลกับคำศัพท์ทั่วไปที่ LLM จัดการได้อยู่แล้ว — ให้เน้นที่คำศัพท์เฉพาะสำหรับ UI ของแอปพลิเคชันคุณ

### บันทึกรูปแบบ (Style Notes)

ระบุให้ชัดเจนเกี่ยวกับระดับภาษา ความเป็นทางการ และธรรมเนียมปฏิบัติต่างๆ:

```json
"style_notes": "Use formal register (vous-form in French). Preserve brand names untranslated. UI labels should be imperative mood ('Save', not 'Saves'). Maximum 40 characters for button text."
```

## การทดสอบการแปลแบบ Coached

ใช้ [MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness) เพื่อวัดประสิทธิภาพ (benchmark) การแปลแบบ coached ของคุณเทียบกับคลังข้อมูลอ้างอิง (reference corpus):

```bash
# Install the harness
pip install mt-eval-harness

# Run coached translations against your test corpus
mt-eval run --corpus data/crk-corpus.json --model google/gemini-2.5-pro

# Score the results
mt-eval test eval/logs/run_*.json
```

สิ่งนี้จะให้คะแนน chrF++, BLEU และ exact match แก่คุณ สร้างไฟล์ coaching หลายๆ เวอร์ชันแล้วนำมาเปรียบเทียบกัน — ตัวชี้วัดเชิงวัตถุวิสัย (objective metrics) ย่อมดีกว่าการตรวจสอบเชิงอัตวิสัย (subjective review)

---

## ดูเพิ่มเติม

- [วิธีการแปล](/docs/guides/translation-methods) — วิธี llm-coached
- [การรองรับภาษาที่มีทรัพยากรน้อย](/docs/guides/low-resource-languages) — การทำ coaching ในทางปฏิบัติ
- [ข้อกำหนดของปลั๊กอิน](/docs/reference/plugin-spec) — การแพ็กเกจข้อมูล coaching ในปลั๊กอิน
- [Quality Gate](/docs/concepts/quality-gate) — วิธีตรวจสอบความถูกต้องของการแปลแบบ coached
- [การตั้งค่า](/docs/getting-started/configuration) — การตั้งค่า coaching ต่อคู่ภาษา