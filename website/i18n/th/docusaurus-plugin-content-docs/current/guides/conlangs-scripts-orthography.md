---
sidebar_position: 3
title: "ภาษาประดิษฐ์ อักษร และอักขรวิธี"
---
# ภาษาประดิษฐ์ (Conlangs) สคริปต์ และอักขรวิธี

rosetta รองรับภาษาประดิษฐ์ (Constructed languages หรือ Conlangs) อย่างเต็มรูปแบบผ่าน LLM registers และ deterministic script converters คู่มือนี้จะครอบคลุมถึงวิธีการทำงานของการรองรับภาษาประดิษฐ์ ฟอนต์ที่คุณต้องใช้ และวิธีเพิ่มภาษาของคุณเอง

:::tip ทำไมภาษาประดิษฐ์ถึงสำคัญ
ภาษาประดิษฐ์ไม่ใช่แค่เรื่องแปลกใหม่ — แต่ยังใช้โครงสร้างพื้นฐานเดียวกันกับที่ใช้ในภาษาจริงที่ขาดแคลนทรัพยากร (Underserved languages) ระบบ quality gate, coaching system และ script conversion pipeline ทำงานเหมือนกันทุกประการสำหรับภาษา Klingon และ Plains Cree หากไปป์ไลน์ภาษาประดิษฐ์ของคุณทำงานได้ ไปป์ไลน์สำหรับภาษาที่มีทรัพยากรน้อย (Low-resource language) ของคุณก็จะทำงานได้เช่นกัน
:::

---

## ภาษาประดิษฐ์ที่รองรับ

| ภาษา | รหัส | ตัวแปลงสคริปต์ | ฟอนต์ที่ต้องการ |
|----------|------|:----------------:|:-------------:|
| Klingon | `tlh` | ✅ Romanization → pIqaD | ฟอนต์ PUA (เช่น pIqaD qolqoS) |
| Sindarin (Tolkien Elvish) | `x-elvish-s` | ✅ Latin → Tengwar | ฟอนต์ CSUR PUA |
| Kryptonian | `x-kryptonian` | ✅ Latin → Kryptonian | ฟอนต์ PUA |
| Pirate English | `x-pirate` | ❌ register เท่านั้น | ไม่มี |
| Shakespearean English | `x-shakespeare` | ❌ register เท่านั้น | ไม่มี |
| Yoda-speak | `x-yoda` | ❌ register เท่านั้น | ไม่มี |

รหัสภาษาประดิษฐ์ใช้คำนำหน้า `x-` ตามธรรมเนียม private-use ของ BCP-47 ยกเว้นภาษา Klingon (`tlh`) ซึ่งมีรหัส [ISO 639-3](https://iso639-3.sil.org/code/tlh) ที่กำหนดโดย SIL International

---

## ข้อกำหนดด้าน Unicode, PUA และฟอนต์

### พื้นที่ใช้งานส่วนตัว (Private Use Area)

Klingon (pIqaD), Sindarin (Tengwar) และ Kryptonian ใช้ตัวอักษร Unicode **Private Use Area (PUA)** PUA คือช่วง U+E000–U+F8FF — โค้ดพอยต์เหล่านี้**ไม่มีการกำหนดมาตรฐาน** [ConScript Unicode Registry (CSUR)](https://www.evertype.com/standards/csur/) จะดูแลรักษาการจับคู่สคริปต์สมมติที่ชุมชนตกลงร่วมกัน แต่สิ่งเหล่านี้ไม่ได้เป็นส่วนหนึ่งของมาตรฐาน Unicode

สิ่งนี้หมายความว่าในทางปฏิบัติ:

- ข้อความ PUA จะแสดงผลเป็น**กล่องสี่เหลี่ยมว่างเปล่า** (□□□) หากไม่ได้โหลดฟอนต์ที่ถูกต้อง
- ฟอนต์ที่แตกต่างกันอาจจับคู่ glyphs ที่แตกต่างกันไปยังโค้ดพอยต์ PUA เดียวกัน
- rosetta ไม่ได้รวมฟอนต์ PUA มาให้ — คุณต้องโหลดด้วยตัวเอง
- ฟอนต์ระบบจะไม่สามารถแสดงผลตัวอักษรเหล่านี้ได้เลย

### ช่วง PUA ตามสคริปต์

| สคริปต์ | ช่วง PUA | อ้างอิง CSUR |
|--------|-----------|---------------|
| Klingon (pIqaD) | U+F8D0–U+F8FF | [CSUR Klingon](https://www.evertype.com/standards/csur/klingon.html) |
| Tengwar (Elvish) | U+E000–U+E07F | [CSUR Tengwar](https://www.evertype.com/standards/csur/tengwar.html) |
| Kryptonian | แตกต่างกันไปตามฟอนต์ | ไม่มีมาตรฐาน CSUR |

### การโหลดฟอนต์ PUA บนเว็บ

หากต้องการแสดงผลข้อความภาษาประดิษฐ์ที่ใช้ PUA ในเว็บแอปพลิเคชันของคุณ ให้โหลดฟอนต์ที่เหมาะสมผ่าน CSS:

```css
/* Load a Klingon PUA font */
@font-face {
  font-family: 'pIqaD';
  src: url('/fonts/piqad.woff2') format('woff2');
  unicode-range: U+F8D0-U+F8FF;
}

/* Apply to Klingon text elements */
[lang="tlh"] {
  font-family: 'pIqaD', sans-serif;
}
```

:::warning ไม่รับประกันการรองรับ Unicode
Unicode Consortium ได้[ปฏิเสธอย่างชัดเจน](https://www.unicode.org/faq/private_use.html)ที่จะเข้ารหัสสคริปต์สมมติในมาตรฐาน การกำหนด PUA ได้รับการดูแลโดยชุมชนและอาจขัดแย้งกันระหว่างการใช้งานฟอนต์ต่างๆ คุณควรระบุฟอนต์ที่โปรเจกต์ของคุณใช้อย่างชัดเจนเสมอ และทดสอบการแสดงผลข้ามเบราว์เซอร์
:::

---

## ตัวแปลงสคริปต์ (Script Converters)

### วิธีการทำงาน

การแปลงสคริปต์ของ rosetta เป็น **post-translation hook** (ฮุกหลังการแปล):

1. LLM จะแปลข้อความเป็น **working script** (มักจะเป็นอักษรละตินหรือ SRO)
2. [quality gate](/docs/concepts/quality-gate) จะตรวจสอบความถูกต้องของผลลัพธ์
3. Deterministic converter จะแปลงข้อความที่ผ่านการตรวจสอบแล้วให้เป็น **display script** (สคริปต์สำหรับแสดงผล)
4. ข้อความที่แปลงแล้วจะถูกเขียนลงดิสก์

แนวทางแบบสองขั้นตอนนี้ได้ผลดีเนื่องจาก LLM จะสร้างผลลัพธ์ได้ดีกว่าเมื่อทำงานกับสคริปต์ที่ใช้ตัวอักษรละตินเป็นหลัก Deterministic converter จะรับประกันผลลัพธ์ของสคริปต์ที่ถูกต้องโดยไม่ต้องพึ่งพาความรู้ด้านสคริปต์ของโมเดล (ซึ่งมักจะไม่น่าเชื่อถือ)

### ตัวแปลงทั้งห้า

rosetta มาพร้อมกับตัวแปลงสคริปต์ในตัว 5 ตัว:

#### Plains Cree: SRO → Syllabics (`crk`)

จาก Standard Roman Orthography (SRO) เป็น Canadian Aboriginal Syllabics

```
Input:  "tawâw"
Output: "ᑕᐚᐤ"
```

สระเสียงยาวใช้ macron/circumflex: ê, î, ô, â ตัวแปลงจะจัดการกับเครื่องหมายกำกับการออกเสียง (diacritics) ของ SRO ทั้งหมดและจับคู่ไปยังตัวอักษรพยางค์ (syllabic characters) ที่ถูกต้อง ดู [การรองรับภาษาที่มีทรัพยากรน้อย](/docs/guides/low-resource-languages) สำหรับไปป์ไลน์ภาษา Cree ฉบับเต็ม

#### Serbian: Latin → Cyrillic (`sr`)

การแปลงจากอักษรละตินเป็นซีริลลิกแบบ Deterministic สำหรับภาษาเซอร์เบีย

```
Input:  "zdravo"
Output: "здраво"
```

ตัวแปลงนี้จัดการการจับคู่ตัวอักษรภาษาเซอร์เบียทั้งหมด รวมถึงทวิอักษร (digraphs) (lj → љ, nj → њ, dž → џ)

#### Klingon: Romanization → pIqaD (`tlh`)

ระบบ Romanization ของ Marc Okrand เป็นตัวอักษร pIqaD PUA

```
Input:  "Qapla'"    (romanized Klingon)
Output: [pIqaD PUA] (requires pIqaD font to render)
```

#### Sindarin: Latin → Tengwar (`x-elvish-s`)

การจับคู่ Tengwar ในโหมด Sindarin ของ Tolkien

```
Input:  "elen síla"  (Latin Sindarin)
Output: [Tengwar PUA] (requires Tengwar font to render)
```

#### Kryptonian: Latin → Kryptonian (`x-kryptonian`)

การจับคู่สคริปต์ Kryptonian จากพจนานุกรมของแฟนคลับ

```
Input:  "Kal-El"
Output: [Kryptonian PUA] (requires Kryptonian font to render)
```

### การเรียกใช้ตัวแปลง

ตั้งค่าฟิลด์ `scripts` ในคอนฟิกภาษาของคุณ สำหรับตัวแปลงที่มีมาให้ในตัว ระบบจะตรวจจับอัตโนมัติจากรหัสภาษา:

```json
{
  "languages": {
    "sr": { "scripts": "sr" },
    "crk": {}
  }
}
```

Plains Cree (`crk`) จะตรวจจับอัตโนมัติ — คุณไม่จำเป็นต้องตั้งค่า `scripts` อย่างชัดเจน

---

## ภาษาที่มีหลายสคริปต์

ภาษาจริงบางภาษาใช้หลายสคริปต์ที่ใช้งานอยู่:

| ภาษา | สคริปต์ | แนวทางของ rosetta |
|----------|---------|-----------------|
| Serbian | Latin + Cyrillic | ตัวแปลงสคริปต์ (`sr`) — แปลเป็นอักษรละติน แล้วแปลงเป็นซีริลลิก |
| Chinese | Simplified + Traditional | แยกโค้ด locale (`zh` กับ `zh-TW`) พร้อม registers ที่แตกต่างกัน |

สำหรับภาษาที่ทั้งสองสคริปต์ให้บริการกลุ่มเป้าหมายเดียวกัน (ภาษาเซอร์เบีย) ให้ใช้ตัวแปลงสคริปต์ สำหรับภาษาที่สคริปต์ให้บริการกลุ่มเป้าหมายต่างกัน (ภาษาจีนตัวย่อสำหรับจีนแผ่นดินใหญ่ ตัวเต็มสำหรับไต้หวัน/ฮ่องกง) ให้ใช้โค้ด locale แยกกัน

---

## หมายเหตุด้านอักขรวิธี

Registers ไม่ใช่แค่น้ำเสียง — แต่ยังมี **คำแนะนำด้านอักขรวิธี (orthographic instructions)** ที่ช่วยนำทาง LLM ไปสู่ธรรมเนียมการเขียนที่ถูกต้อง

### รูปแบบการเรียกขานแบบเป็นทางการ

registers ในตัวของ rosetta จะรวมถึงการเรียกขานแบบเป็นทางการที่เหมาะสมกับวัฒนธรรมสำหรับแต่ละภาษา:

| ภาษา | รูปแบบทางการ | คำสั่ง Register |
|----------|------------|---------------------|
| German | Sie | `Use Sie-form for formal address` |
| French | vous | `Use vous-form` |
| Russian | вы | `Professional register with вы-form` |
| Turkish | siz | `Professional register with siz-form` |
| Korean | 합쇼체 | `Formal Korean (합쇼체)` |
| Japanese | です/ます | `Polite professional register (です/ます form)` |
| Polish | Pan/Pani | `Professional register with Pan/Pani form` |

### การเขียนแบบครอบคลุมทางเพศ (Gender-Inclusive Writing)

การ์ดภาษาแต่ละใบจะมีฟิลด์ `gender.inclusiveGuidance` พร้อมคำแนะนำเฉพาะสำหรับภาษานั้นๆ สิ่งนี้จะถูกแทรกเข้าไปในพรอมต์การแปลของ LLM แยกต่างหากจากพรีเซ็ต register เพื่อให้มีผลบังคับใช้อย่างสม่ำเสมอไม่ว่าผู้ใช้จะเลือกพรีเซ็ตความเป็นทางการแบบใดก็ตาม:

- **French**: Écriture inclusive พร้อมการใช้เครื่องหมาย interpunct (เช่น "Connecté·e")
- **German**: การใช้เครื่องหมาย Doppelpunkt (เช่น "Benutzer:innen")
- **Spanish**: แนะนำให้ปรับโครงสร้างให้เป็นกลางทางเพศ; ใช้เครื่องหมายทับ (เช่น "usuario/a") เป็นทางเลือกสำรอง

สำหรับภาษาที่ไม่มีคำแนะนำเฉพาะในการ์ด (เช่น ภาษาเกาหลี, ภาษาประดิษฐ์) ระบบจะใช้กฎทั่วไปเป็นทางเลือกสำรอง: *"เลือกใช้รูปแบบที่เป็นกลางทางเพศหรือตัวเลือกที่ครอบคลุมที่สุดเท่าที่มี"*

### ข้อกำหนดสำหรับสคริปต์ RTL (ขวาไปซ้าย)

registers ของภาษาอารบิก, ฮีบรู, เปอร์เซีย และอูรดู ล้วนระบุข้อกำหนดการเขียนจากขวาไปซ้าย: `Ensure text reads naturally in RTL layout contexts.`

### การแทนที่ Register ใดๆ

ทุก register เป็นค่าคอนฟิก — คุณสามารถแทนที่ได้เพื่อให้ตรงกับน้ำเสียงของโปรเจกต์คุณ:

```json
{
  "languages": {
    "fr": {
      "register": "Casual French. Use tu-form. Conversational blog tone. Gender-neutral when possible."
    },
    "de": {
      "register": "Informal German. Use du-form. Tech startup voice."
    }
  }
}
```

ดู [การกำหนดค่า](/docs/getting-started/configuration) สำหรับข้อมูลอ้างอิงคอนฟิกฉบับเต็ม

---

## การเพิ่มภาษาประดิษฐ์ใหม่

### ขั้นตอน

1. **เลือกรหัส private-use ของ BCP-47**: ใช้คำนำหน้า `x-` (เช่น `x-dothraki`, `x-valyrian`)

2. **เพิ่มลงในคอนฟิกของคุณ**:

```json
{
  "languages": {
    "x-dothraki": {
      "register": "Dothraki language. Use David J. Peterson's vocabulary from the Living Language Dothraki textbook. Harsh, direct tone. No articles, no verb 'to be'."
    }
  }
}
```

3. **(ไม่บังคับ) เพิ่มตัวแปลงสคริปต์**: หากภาษาประดิษฐ์ของคุณใช้สคริปต์แสดงผลที่ไม่ใช่อักษรละติน ให้เพิ่มตัวแปลงใน `lib/scripts.js` และลงทะเบียนใน `SCRIPT_CONVERTERS`

4. **ทดสอบ**: รัน `i18n-rosetta sync --dry` เพื่อดูตัวอย่างการแปลโดยไม่ต้องเขียนไฟล์

5. **ตรวจสอบ quality gate**: [quality gate](/docs/concepts/quality-gate) อาจต้องมีการปรับแต่งสำหรับภาษาประดิษฐ์ของคุณ — โดยเฉพาะการตรวจสอบ `requireNonLatin` หากภาษาประดิษฐ์ของคุณใช้ตัวอักษร PUA

:::note คุณภาพของภาษาประดิษฐ์ขึ้นอยู่กับความรู้ของ LLM
LLM สามารถแปลเป็นภาษาประดิษฐ์ที่เคยเห็นในข้อมูลการฝึกอบรมเท่านั้น ภาษาประดิษฐ์ที่มีการบันทึกไว้เป็นอย่างดี (Klingon, Sindarin, Dothraki) จะทำงานได้ดี ภาษาประดิษฐ์ที่ไม่ค่อยมีใครรู้จักหรือเพิ่งคิดค้นขึ้นใหม่อาจให้ผลลัพธ์ที่ไม่สม่ำเสมอ ใช้ [ข้อมูลการโค้ช (coaching data)](/docs/concepts/coaching-data) เพื่อปรับปรุงคุณภาพ
:::

---

## ดูเพิ่มเติม

- [ภาษาที่รองรับ](/docs/reference/supported-languages) — ตารางภาษาฉบับเต็มพร้อมความพร้อมใช้งานของแต่ละวิธี
- [ตัวแปลงสคริปต์](/docs/concepts/script-converters) — รายละเอียดทางเทคนิคของไปป์ไลน์การแปลง
- [วิธีการแปล](/docs/guides/translation-methods) — วิธีการทำงานของแต่ละวิธีการแปล
- [การกำหนดค่า](/docs/getting-started/configuration) — ข้อมูลอ้างอิงคอนฟิกรวมถึงการตั้งค่าภาษาและ register
- [การรองรับภาษาที่มีทรัพยากรน้อย](/docs/guides/low-resource-languages) — โครงสร้างพื้นฐานเดียวกันที่นำไปใช้กับภาษาจริงที่ขาดแคลนทรัพยากร