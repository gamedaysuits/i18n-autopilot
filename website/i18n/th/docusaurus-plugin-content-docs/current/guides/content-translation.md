---
sidebar_position: 5
title: "การแปลเนื้อหา"
---
# การแปลเนื้อหา (Hugo Markdown)

Rosetta แปลไฟล์ Hugo Markdown — ทั้งฟิลด์ front matter และเนื้อหาหลัก — พร้อมการปกป้อง code blocks, shortcodes และองค์ประกอบที่มีโครงสร้างอย่างเต็มรูปแบบ

## การตั้งค่า

กำหนดค่า `contentDir` ใน config ของคุณเพื่อเปิดใช้งานการแปลเนื้อหา Markdown:

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./i18n",
  "contentDir": "./content"
}
```

```bash
npx i18n-rosetta sync    # translates both string files and content files
```

## สิ่งที่ได้รับการแปล

### Front Matter

รองรับตัวคั่นทั้งแบบ YAML (`---`) และ TOML (`+++`) โดยค่าเริ่มต้น ฟิลด์เหล่านี้จะได้รับการแปล:

- `title`
- `description`
- `summary`
- `subtitle`
- `caption`
- `linkTitle`

ฟิลด์อื่นๆ ทั้งหมด (`date`, `draft`, `tags`, `weight`, `slug` ฯลฯ) จะถูกคงไว้ตามเดิม คุณสามารถปรับแต่งได้ด้วย `translatableFields` ใน config ของคุณ

### เนื้อหาหลัก

เนื้อหา Markdown ทั้งหมดจะได้รับการแปลพร้อมการปกป้องบล็อก — องค์ประกอบที่มีโครงสร้างจะถูกปกป้องโดยใช้ Unicode sentinel placeholders ก่อนการแปลและจะถูกกู้คืนกลับมาหลังจากนั้น

## การปกป้องบล็อก

องค์ประกอบเหล่านี้จะผ่านกระบวนการแปลโดยไม่ถูกเปลี่ยนแปลง:

| องค์ประกอบ | ตัวอย่าง | การปกป้อง |
|---------|---------|-----------|
| Code blocks | ``````` ```js ... ``` ``````` | ปกป้องทั้งบล็อก |
| Inline code | `` `variable` `` | ได้รับการปกป้อง |
| Hugo shortcodes | `{{< figure >}}`, `{{% note %}}` | ปกป้องทั้งบล็อก |
| Raw HTML | `<div>`, `<table>` | ได้รับการปกป้อง |
| Links (URLs) | `[text](https://...)` | คง URL ไว้, แปลเฉพาะข้อความ |
| Interpolation | `{{ .Count }}` | ได้รับการปกป้อง |

## รูปแบบการตั้งชื่อไฟล์

เป็นไปตามรูปแบบการแปลด้วยชื่อไฟล์ของ Hugo:

```
my-post.md      → my-post.fr.md
my-post.en.md   → my-post.fr.md  (strips source suffix)
```

## พฤติกรรมการข้าม

ไฟล์ที่แปลแล้วซึ่งมีอยู่เดิมจะ **ไม่ถูกเขียนทับ** หากมี `my-post.fr.md` อยู่แล้ว ระบบจะข้ามไป ให้ลบไฟล์เป้าหมายหากคุณต้องการบังคับให้แปลใหม่

## วิธีการสำหรับ Markdown เท่านั้น

:::warning Google Translate และ Markdown
Google Translate **ไม่รู้จัก** code blocks, shortcodes หรือตัวแปร interpolation ซึ่งจะทำให้เนื้อหา Markdown ที่มีโครงสร้างเสียหายได้ โปรดใช้วิธีการแบบ LLM (`llm` หรือ `llm-coached`) สำหรับการแปลเนื้อหา — เนื่องจากวิธีการเหล่านี้จะปกป้ององค์ประกอบที่มีโครงสร้างอย่างชัดเจน
:::

เมื่อการแปลเนื้อหาเปลี่ยนกลับ (fall back) จาก Google Translate ไปใช้วิธีการแบบ LLM ระบบของ rosetta จะบันทึกคำเตือนเพื่ออธิบายเหตุผล