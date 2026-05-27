---
sidebar_position: 6
title: "ตัวแปลงสคริปต์"
---
# ตัวแปลงสคริปต์

ตัวแปลงสคริปต์เป็น Post-translation hooks แบบ Deterministic ที่ไม่พึ่งพา LLM ซึ่งจะแปลงข้อความจากระบบการเขียนหนึ่งไปยังอีกระบบหนึ่ง ช่วยให้เกิดเวิร์กโฟลว์แบบ "แปลครั้งเดียว แสดงผลได้หลายสคริปต์" — คุณแปลเป็นสคริปต์ที่ใช้ทำงาน (มักจะเป็น Latin) จากนั้นระบบจะแปลงเป็นสคริปต์สำหรับแสดงผลโดยอัตโนมัติ

## ทำไมต้องใช้ตัวแปลงสคริปต์?

บางภาษาใช้หลายสคริปต์สำหรับภาษาพูดเดียวกัน:

- **Plains Cree**: SRO (Latin) สำหรับการแก้ไข → Syllabics (ᓀᐦᐃᔭᐍᐏᐣ) สำหรับการแสดงผล
- **Serbian**: Latin สำหรับการใช้งานระดับสากล → Cyrillic สำหรับการใช้งานภายในประเทศ
- **Klingon**: Romanization สำหรับการพิมพ์ → pIqaD (  ) สำหรับการแสดงผล

การแปลเป็นสคริปต์ที่ไม่ใช่ Latin โดยตรงจะทำให้เกิดปัญหา: LLM อาจสร้างตัวอักษรที่ผิดเพี้ยน (Hallucinate), ไฟล์ JSON ทำ Version-control ได้ยาก และเครื่องมือ Diff ไม่สามารถเปรียบเทียบการเปลี่ยนแปลงได้ ตัวแปลงสคริปต์แก้ปัญหานี้โดยการเก็บคำแปลไว้ในสคริปต์ที่รองรับ Version-control ได้ดี และแปลงอย่างเป็นระบบ (Deterministic) ในเวลาที่ซิงค์

## ตัวแปลงที่รองรับ

Rosetta มาพร้อมกับตัวแปลงสคริปต์ในตัว 5 แบบ:

| Locale | จาก | เป็น | ประเภท | ต้องการฟอนต์หรือไม่? |
|--------|------|----|------|----------------|
| `crk` | SRO (Standard Roman Orthography) | Cree Syllabics | Deterministic | ไม่ — เป็น Unicode มาตรฐาน |
| `sr` | Latin | Cyrillic | Deterministic | ไม่ — เป็น Unicode มาตรฐาน |
| `tlh` | Romanization | pIqaD | Deterministic | ใช่ — PUA U+F8D0–F8FF |
| `x-elvish-s` | Latin | Tengwar (Mode of Beleriand) | Deterministic | ใช่ — PUA U+E000–E07F |
| `x-kryptonian` | Latin | Kryptonian | Font-based cipher | ใช่ — PUA U+E100–E119 |

### Deterministic กับ Font-Based

- **Deterministic converters** (Cree, Serbian, Klingon, Tengwar) ทำการจับคู่ตัวอักษรต่อตัวอักษรจริงโดยใช้กฎทางภาษาศาสตร์ ผลลัพธ์ที่ได้จะเป็นตัวอักษร Unicode จริง
- **Font-based converters** (Kryptonian) เป็นการเข้ารหัสแบบแทนที่ 1:1 ซึ่งผลลัพธ์จะเป็นตัวอักษร Unicode PUA ที่จะแสดงผลได้อย่างถูกต้องเมื่อโหลดฟอนต์เฉพาะเท่านั้น

## วิธีการทำงาน

ตัวแปลงสคริปต์จะทำงาน **หลังจาก** การแปลในฐานะขั้นตอน Post-processing โดยมีไปป์ไลน์ดังนี้:

```
Source (English) → LLM Translation → Working Script → Script Converter → Display Script
```

ตัวอย่างเช่น Plains Cree:
```
"Welcome" → LLM → "tānisi" (SRO) → Converter → "ᑖᓂᓯ" (Syllabics)
```

### การจับคู่แบบ Greedy Left-to-Right

ตัวแปลงทั้งหมดใช้อัลกอริทึมเดียวกัน: ในแต่ละตำแหน่งของตัวอักษร ระบบจะพยายามจับคู่รูปแบบที่ยาวที่สุดก่อน จากนั้นจึงค่อยๆ ลดความยาวลง ตัวอักษรที่ไม่ตรงกับรูปแบบใดเลย (ช่องว่าง, เครื่องหมายวรรคตอน, ตัวเลข) จะถูกส่งผ่านโดยไม่มีการเปลี่ยนแปลง

วิธีนี้ช่วยจัดการกับ Digraphs และ Trigraphs ได้อย่างถูกต้อง:
- Klingon: `tlh` → ตัวอักษร pIqaD ตัวเดียว (ไม่ใช่ `t` + `l` + `h`)
- Serbian: `nj` → `њ` (ไม่ใช่ `н` + `ј`)
- Cree: `twê` → ตัวอักษร Syllabic ตัวเดียว (ไม่ใช่ `t` + `w` + `ê`)

## การใช้งานตัวแปลงสคริปต์

ตัวแปลงสคริปต์จะทำงานโดยอัตโนมัติเมื่อรหัส Locale ตรงกับตัวแปลงที่ลงทะเบียนไว้ ไม่จำเป็นต้องตั้งค่าใดๆ — เพียงแค่กำหนด Target locale ของคุณ:

```json title="i18n-rosetta.config.json"
{
  "pairs": {
    "en:crk": {
      "method": "llm-coached",
      "model": "google/gemini-2.5-pro"
    }
  }
}
```

เมื่อ Rosetta ซิงค์คู่ `en:crk` คำแปลจะถูกสร้างขึ้นในรูปแบบ SRO ก่อน จากนั้นจะถูกแปลงเป็น Syllabics โดยอัตโนมัติก่อนที่จะเขียนลงใน `crk.json`

### การตรวจสอบสถานะตัวแปลง

```bash
npx i18n-rosetta status
```

ผลลัพธ์สถานะจะแสดงให้เห็นว่าคู่ใดมีตัวแปลงสคริปต์ที่ทำงานอยู่ และทำการแปลงในรูปแบบใด

## ข้อกำหนดสำหรับ Web Font

ตัวแปลง 3 ตัวจะให้ผลลัพธ์เป็นตัวอักษร Unicode Private Use Area (PUA) ซึ่งจำเป็นต้องใช้ Web font แบบกำหนดเอง:

### Klingon (pIqaD)

ติดตั้งฟอนต์ pIqaD ที่รองรับ CSUR (เช่น "pIqaD qolqoS" หรือ "Klingon pIqaD HaSta"):

```css
@font-face {
  font-family: 'pIqaD';
  src: url('/fonts/pIqaD.woff2') format('woff2');
  unicode-range: U+F8D0-F8FF;
}

:lang(tlh) {
  font-family: 'pIqaD', sans-serif;
}
```

### Tengwar (Sindarin)

ติดตั้งฟอนต์ Tengwar ที่รองรับ CSUR (เช่น "Tengwar Formal CSUR", "Tengwar Annatar"):

```css
@font-face {
  font-family: 'Tengwar';
  src: url('/fonts/tengwar-formal-csur.woff2') format('woff2');
  unicode-range: U+E000-E07F;
}

:lang(x-elvish-s) {
  font-family: 'Tengwar', serif;
}
```

### Kryptonian

ติดตั้งฟอนต์ Kryptonian ที่แมปกับ PUA codepoints U+E100–E119:

```css
@font-face {
  font-family: 'Kryptonian';
  src: url('/fonts/kryptonian.woff2') format('woff2');
  unicode-range: U+E100-E119;
}

:lang(x-kryptonian) {
  font-family: 'Kryptonian', sans-serif;
}
```

:::tip แนวทางเลือกสำหรับ Kryptonian
เนื่องจาก Kryptonian เป็นการเข้ารหัสแบบ A-Z ล้วน คุณจึงสามารถข้ามการใช้ตัวแปลงสคริปต์ไปได้เลย และใช้ฟอนต์กับข้อความ Latin ผ่าน CSS ได้โดยตรง วิธีนี้มักจะง่ายกว่าสำหรับการนำไปใช้งานบนเว็บ — เพียงแค่ให้บริการฟอนต์ Kryptonian และกำหนด `font-family` บนองค์ประกอบที่เกี่ยวข้อง
:::

## การเพิ่มตัวแปลงแบบกำหนดเอง

หากต้องการเพิ่มตัวแปลงสำหรับภาษาใหม่ ให้แก้ไข `lib/scripts.js`:

1. **สร้าง Conversion map** — อาร์เรย์ที่มีการจัดลำดับของคู่ `[from, to]` โดยให้ลำดับที่ยาวที่สุดขึ้นก่อน
2. **สร้างฟังก์ชันตัวแปลง** — ตัวสแกนแบบ Greedy left-to-right (ใช้ `sroToSyllabics` เป็นเทมเพลต)
3. **ลงทะเบียน** ในออบเจ็กต์ `SCRIPT_CONVERTERS` โดยใช้รหัส Locale เป็นคีย์
4. **เพิ่มฟิลด์ `script`** ลงในรายการลงทะเบียนของภาษาใน `registers.js`

```javascript
// Example: adding a converter for Cherokee (chr)
const LATIN_TO_CHEROKEE_MAP = [
  ['ga', 'Ꭶ'], ['ka', 'Ꭷ'], ['ge', 'Ꭸ'], // ...
];

function latinToCherokee(text) {
  // Same greedy left-to-right pattern as other converters
}

SCRIPT_CONVERTERS['chr'] = {
  from: 'Latin',
  to: 'Cherokee Syllabary',
  type: 'deterministic',
  converter: latinToCherokee,
};
```

---

## ดูเพิ่มเติม

- [Conlangs, Scripts & Orthography](/docs/guides/conlangs-scripts-orthography) — ฟอนต์ PUA, Unicode, การเพิ่มตัวแปลงใหม่
- [Quality Gate](/docs/concepts/quality-gate) — การตรวจสอบความถูกต้องที่ทำงานก่อนการแปลงสคริปต์
- [Supported Languages](/docs/reference/supported-languages) — ภาษาใดบ้างที่มีตัวแปลงสคริปต์
- [Support a Low-Resource Language](https://mtevalarena.org/docs/community/low-resource-languages) — SRO→Syllabics ในบริบท
- [Cookbook: FST-Gated Pipeline](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — การแปลงสคริปต์ในไปป์ไลน์แบบหลายขั้นตอน