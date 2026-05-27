---
sidebar_position: 3
title: "ภาษาประดิษฐ์ ระบบการเขียน และอักขรวิธี"
---
# ภาษาประดิษฐ์ สคริปต์ และอักขรวิธี

rosetta รองรับภาษาประดิษฐ์ (constructed languages หรือ conlangs) อย่างเต็มรูปแบบผ่าน LLM registers และ deterministic script converters คู่มือนี้จะครอบคลุมถึงวิธีการทำงานของการรองรับภาษาประดิษฐ์ ฟอนต์ที่คุณต้องใช้ และวิธีเพิ่มภาษาของคุณเอง

:::tip ทำไมภาษาประดิษฐ์ถึงสำคัญ
ภาษาประดิษฐ์ไม่ใช่แค่เรื่องแปลกใหม่ — แต่เป็นการใช้งานโครงสร้างพื้นฐานเดียวกันกับที่ใช้สำหรับภาษาจริงที่ขาดแคลนทรัพยากร ระบบตรวจสอบคุณภาพ (quality gate) ระบบการสอน (coaching system) และไปป์ไลน์การแปลงสคริปต์ทำงานเหมือนกันทุกประการสำหรับภาษา Klingon และ Plains Cree หากไปป์ไลน์ภาษาประดิษฐ์ของคุณทำงานได้ ไปป์ไลน์สำหรับภาษาที่มีทรัพยากรน้อยของคุณก็จะทำงานได้เช่นกัน
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

รหัสภาษาประดิษฐ์ใช้คำนำหน้า `x-` ตามธรรมเนียม private-use ของ BCP-47 ยกเว้น Klingon (`tlh`) ซึ่งมีรหัส [ISO 639-3](https://iso639-3.sil.org/code/tlh) ที่กำหนดโดย SIL International

---

## ข้อกำหนดด้าน Unicode, PUA และฟอนต์

### พื้นที่ใช้งานส่วนตัว (Private Use Area)

Klingon (pIqaD), Sindarin (Tengwar) และ Kryptonian ใช้อักขระ **Private Use Area (PUA)** ของ Unicode PUA คือช่วง U+E000–U+F8FF — codepoints เหล่านี้**ไม่มีการกำหนดมาตรฐาน** [ConScript Unicode Registry (CSUR)](https://www.evertype.com/standards/csur/) ดูแลรักษาการจับคู่ที่ชุมชนตกลงร่วมกันสำหรับสคริปต์สมมติ แต่สิ่งเหล่านี้ไม่ได้เป็นส่วนหนึ่งของมาตรฐาน Unicode

สิ่งนี้หมายความว่าอย่างไรในทางปฏิบัติ:

- ข้อความ PUA จะแสดงเป็น **กล่องสี่เหลี่ยมว่างเปล่า** (□□□) หากไม่ได้โหลดฟอนต์ที่ถูกต้อง
- ฟอนต์ที่แตกต่างกันอาจจับคู่ glyphs ที่แตกต่างกันไปยัง PUA codepoints เดียวกัน
- rosetta ไม่ได้รวมฟอนต์ PUA มาให้ — คุณต้องโหลดด้วยตัวเอง
- ฟอนต์ของระบบจะไม่สามารถแสดงผลอักขระเหล่านี้ได้เลย

### ช่วง PUA ตามสคริปต์

| สคริปต์ | ช่วง PUA | การอ้างอิง CSUR |
|--------|-----------|---------------|
| Klingon (pIqaD) | U+F8D0–U+F8FF | [CSUR Klingon](https://www.evertype.com/standards/csur/klingon.html) |
| Tengwar (Elvish) | U+E000–U+E07F | [CSUR Tengwar](https://www.evertype.com/standards/csur/tengwar.html) |
| Kryptonian | แตกต่างกันไปตามฟอนต์ | ไม่มีมาตรฐาน CSUR |

### การโหลด PUA Web Fonts

rosetta มีคำสั่งในตัวสำหรับดาวน์โหลดและจัดการ PUA web fonts:

```bash
# See which fonts are needed for your configured languages
i18n-rosetta fonts list

# Download all needed fonts (auto-detects project type for output directory)
i18n-rosetta fonts install

# Also generate a CSS snippet with @font-face declarations
i18n-rosetta fonts install --css
```

คำสั่ง `fonts install` จะดาวน์โหลดจาก open-source repositories ที่ผ่านการตรวจสอบแล้ว:

| ฟอนต์ | สคริปต์ | สิทธิ์การใช้งาน | แหล่งที่มา |
|------|--------|---------|--------|
| pIqaD qolqoS | Klingon | SIL Open Font License 1.1 | [GitHub](https://github.com/dadap/pIqaD-fonts) |
| FreeMonoTengwar | Tengwar | GNU GPL v3 (มีข้อยกเว้นสำหรับฟอนต์) | [SourceForge](https://sourceforge.net/projects/freetengwar/) |
| *(ผู้ใช้จัดหาให้)* | Kryptonian | แตกต่างกันไป | ไม่มีฟอนต์ PUA แบบ open-source ให้ใช้งาน |

ไดเรกทอรีเอาต์พุตจะถูกตรวจจับอัตโนมัติจากโครงสร้างโปรเจกต์ของคุณ (Docusaurus → `static/fonts/`, Hugo → `static/fonts/`, ค่าเริ่มต้น → `public/fonts/`) สามารถเขียนทับได้ด้วย `--dir`

หากคุณต้องการจัดการฟอนต์ด้วยตนเอง ให้เพิ่มกฎ `@font-face` ใน CSS ของคุณ:

```css
@font-face {
  font-family: 'pIqaD';
  src: url('/fonts/pIqaDqolqoS.ttf') format('truetype');
  font-display: swap;
  unicode-range: U+F8D0-F8FF;
}

/* Apply to Klingon text elements */
[lang="tlh"], [data-script="piqad"] {
  font-family: 'pIqaD', sans-serif;
}
```

:::warning ไม่รับประกันการรองรับ Unicode
Unicode Consortium ได้[ปฏิเสธอย่างชัดเจน](https://www.unicode.org/faq/private_use.html)ที่จะเข้ารหัสสคริปต์สมมติในมาตรฐาน การกำหนด PUA ได้รับการดูแลโดยชุมชนและอาจขัดแย้งกันระหว่างการใช้งานฟอนต์ต่างๆ โปรดระบุฟอนต์ที่โปรเจกต์ของคุณใช้อย่างชัดเจนเสมอ และทดสอบการแสดงผลข้ามเบราว์เซอร์
:::

---

## ตัวแปลงสคริปต์ (Script Converters)

### วิธีการทำงาน

การแปลงสคริปต์ของ rosetta เป็น **post-translation hook**:

1. LLM จะแปลข้อความเป็น **สคริปต์สำหรับทำงาน** (มักจะเป็นอักษรละตินหรือ SRO)
2. [ระบบตรวจสอบคุณภาพ](/docs/concepts/quality-gate) จะตรวจสอบความถูกต้องของผลลัพธ์
3. deterministic converter จะแปลงข้อความที่ผ่านการตรวจสอบแล้วให้เป็น **สคริปต์สำหรับแสดงผล**
4. ข้อความที่แปลงแล้วจะถูกเขียนลงดิสก์

แนวทางแบบสองขั้นตอนนี้ได้ผลดีเนื่องจาก LLM จะสร้างผลลัพธ์ได้ดีกว่าเมื่อทำงานกับสคริปต์ที่ใช้ภาษาละตินเป็นหลัก deterministic converter จะรับประกันผลลัพธ์ของสคริปต์ที่ถูกต้องโดยไม่ต้องพึ่งพาความรู้ด้านสคริปต์ของโมเดล (ซึ่งมักจะไม่น่าเชื่อถือ)

### ตัวแปลงทั้งห้า

rosetta มาพร้อมกับตัวแปลงสคริปต์ในตัวห้าตัว:

#### Plains Cree: SRO → Syllabics (`crk`)

จาก Standard Roman Orthography เป็น Canadian Aboriginal Syllabics

```
Input:  "tawâw"
Output: "ᑕᐚᐤ"
```

สระเสียงยาวใช้ macron/circumflex: ê, î, ô, â ตัวแปลงจะจัดการกับเครื่องหมายกำกับเสียง (diacritics) ของ SRO ทั้งหมด และจับคู่ไปยังอักขระ syllabic ที่ถูกต้อง ดู [การรองรับภาษาที่มีทรัพยากรน้อย](https://mtevalarena.org/docs/community/low-resource-languages) สำหรับไปป์ไลน์ Cree ฉบับเต็ม

#### Serbian: Latin → Cyrillic (`sr`)

การแปลงจากละตินเป็นซีริลลิกแบบ deterministic สำหรับภาษาเซอร์เบีย

```
Input:  "zdravo"
Output: "здраво"
```

สิ่งนี้จะจัดการการจับคู่ตัวอักษรภาษาเซอร์เบียทั้งหมด รวมถึง digraphs (lj → љ, nj → њ, dž → џ)

#### Klingon: Romanization → pIqaD (`tlh`)

ระบบ romanization ของ Marc Okrand เป็นอักขระ pIqaD PUA

```
Input:  "Qapla'"    (romanized Klingon)
Output: [pIqaD PUA] (requires pIqaD font to render)
```

#### Sindarin: Latin → Tengwar (`x-elvish-s`)

การจับคู่ Tengwar โหมด Sindarin ของ Tolkien

```
Input:  "elen síla"  (Latin Sindarin)
Output: [Tengwar PUA] (requires Tengwar font to render)
```

#### Kryptonian: Latin → Kryptonian (`x-kryptonian`)

การจับคู่สคริปต์ Kryptonian ตามพจนานุกรมของแฟนคลับ

```
Input:  "Kal-El"
Output: [Kryptonian PUA] (requires Kryptonian font to render)
```

### การเรียกใช้งานตัวแปลง

ตั้งค่าฟิลด์ `scripts` ในคอนฟิกภาษาของคุณ สำหรับตัวแปลงในตัว ระบบจะตรวจจับอัตโนมัติจากรหัสภาษา:

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
| Serbian | Latin + Cyrillic | ตัวแปลงสคริปต์ (`sr`) — แปลเป็นละติน แปลงเป็นซีริลลิก |
| Chinese | Simplified + Traditional | แยกรหัส locale (`zh` กับ `zh-TW`) ด้วย registers ที่แตกต่างกัน |

สำหรับภาษาที่ทั้งสองสคริปต์ให้บริการกลุ่มเป้าหมายเดียวกัน (Serbian) ให้ใช้ตัวแปลงสคริปต์ สำหรับภาษาที่สคริปต์ให้บริการกลุ่มเป้าหมายต่างกัน (Chinese Simplified สำหรับจีนแผ่นดินใหญ่, Traditional สำหรับไต้หวัน/ฮ่องกง) ให้ใช้รหัส locale แยกกัน

---

## หมายเหตุด้านอักขรวิธี

Registers ไม่ใช่แค่น้ำเสียง — แต่ยังมี **คำแนะนำด้านอักขรวิธี** ที่ช่วยนำทาง LLM ไปสู่ธรรมเนียมการเขียนที่ถูกต้อง

### รูปแบบการเรียกขานที่เป็นทางการ

registers ในตัวของ rosetta จะรวมรูปแบบการเรียกขานที่เป็นทางการที่เหมาะสมกับวัฒนธรรมสำหรับแต่ละภาษา:

| ภาษา | รูปแบบทางการ | คำแนะนำ Register |
|----------|------------|---------------------|
| German | Sie | `Use Sie-form for formal address` |
| French | vous | `Use vous-form` |
| Russian | вы | `Professional register with вы-form` |
| Turkish | siz | `Professional register with siz-form` |
| Korean | 합쇼체 | `Formal Korean (합쇼체)` |
| Japanese | です/ます | `Polite professional register (です/ます form)` |
| Polish | Pan/Pani | `Professional register with Pan/Pani form` |

### การเขียนที่ครอบคลุมทางเพศ (Gender-Inclusive Writing)

การ์ดภาษาแต่ละใบจะมีฟิลด์ `gender.inclusiveGuidance` พร้อมคำแนะนำเฉพาะภาษา สิ่งนี้จะถูกแทรกเข้าไปใน prompt การแปลของ LLM แยกต่างหากจากค่าที่ตั้งไว้ล่วงหน้าของ register ดังนั้นจึงมีผลอย่างสม่ำเสมอไม่ว่าผู้ใช้จะเลือกค่าความทางการแบบใดก็ตาม:

- **French**: Écriture inclusive พร้อมสัญลักษณ์ interpunct (เช่น "Connecté·e")
- **German**: สัญลักษณ์ Doppelpunkt (เช่น "Benutzer:innen")
- **Spanish**: แนะนำให้ปรับโครงสร้างให้เป็นกลางทางเพศ; ใช้สัญลักษณ์ทับ (เช่น "usuario/a") เป็นทางเลือกสำรอง

สำหรับภาษาที่ไม่มีคำแนะนำเฉพาะในการ์ด (เช่น Korean, ภาษาประดิษฐ์) ระบบจะกลับไปใช้กฎทั่วไป: *"เลือกใช้รูปแบบที่เป็นกลางทางเพศหรือตัวเลือกที่ครอบคลุมที่สุดเท่าที่มี"*

### ข้อกำหนดของสคริปต์ RTL

registers ของ Arabic, Hebrew, Persian และ Urdu ล้วนระบุข้อกำหนดการเขียนจากขวาไปซ้าย: `Ensure text reads naturally in RTL layout contexts.`

### การเขียนทับ Register ใดๆ

ทุก register เป็นค่าคอนฟิก — คุณสามารถเขียนทับเพื่อให้ตรงกับน้ำเสียงของโปรเจกต์คุณได้:

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

ดู [การกำหนดค่า](/docs/getting-started/configuration) สำหรับการอ้างอิงคอนฟิกฉบับเต็ม

---

## การเพิ่มภาษาประดิษฐ์ใหม่

### ทีละขั้นตอน

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

3. **(ทางเลือก) เพิ่มตัวแปลงสคริปต์**: หากภาษาประดิษฐ์ของคุณใช้สคริปต์แสดงผลที่ไม่ใช่ภาษาละติน ให้เพิ่มตัวแปลงใน `lib/scripts.js` และลงทะเบียนใน `SCRIPT_CONVERTERS`

4. **ทดสอบ**: รัน `i18n-rosetta sync --dry` เพื่อดูตัวอย่างการแปลโดยไม่ต้องเขียนไฟล์

5. **ตรวจสอบระบบตรวจสอบคุณภาพ**: [ระบบตรวจสอบคุณภาพ](/docs/concepts/quality-gate) อาจต้องมีการปรับแต่งสำหรับภาษาประดิษฐ์ของคุณ — โดยเฉพาะการตรวจสอบ `requireNonLatin` หากภาษาประดิษฐ์ของคุณใช้อักขระ PUA

:::note คุณภาพของภาษาประดิษฐ์ขึ้นอยู่กับความรู้ของ LLM
LLM สามารถแปลเป็นภาษาประดิษฐ์ที่เคยเห็นในข้อมูลการฝึกอบรมเท่านั้น ภาษาประดิษฐ์ที่มีการบันทึกไว้เป็นอย่างดี (Klingon, Sindarin, Dothraki) จะทำงานได้ดี ภาษาประดิษฐ์ที่ไม่ค่อยมีใครรู้จักหรือเพิ่งคิดค้นขึ้นใหม่อาจให้ผลลัพธ์ที่ไม่สม่ำเสมอ ใช้ [ข้อมูลการสอน](/docs/concepts/coaching-data) เพื่อปรับปรุงคุณภาพ
:::

---

## ดูเพิ่มเติม

- [ภาษาที่รองรับ](/docs/reference/supported-languages) — ตารางภาษาทั้งหมดพร้อมวิธีการที่ใช้งานได้
- [ตัวแปลงสคริปต์](/docs/concepts/script-converters) — รายละเอียดทางเทคนิคของไปป์ไลน์การแปลง
- [วิธีการแปล](/docs/guides/translation-methods) — วิธีการทำงานของแต่ละวิธีการแปล
- [การกำหนดค่า](/docs/getting-started/configuration) — การอ้างอิงคอนฟิกรวมถึงการตั้งค่าภาษาและ register
- [การรองรับภาษาที่มีทรัพยากรน้อย](https://mtevalarena.org/docs/community/low-resource-languages) — โครงสร้างพื้นฐานเดียวกันที่นำไปใช้กับภาษาจริงที่ขาดแคลนทรัพยากร