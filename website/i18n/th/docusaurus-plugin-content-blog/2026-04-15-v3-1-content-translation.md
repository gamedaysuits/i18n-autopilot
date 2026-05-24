---
slug: v3-1-content-translation
title: "v3.1.0: การแปลเนื้อหา Hugo Markdown"
authors: [curtisforbes]
tags: [release]
date: 2026-04-15
---
v3.1.0 เพิ่มการแปลเนื้อหา Hugo Markdown แบบเต็มรูปแบบ — ทั้งฟิลด์ front matter และเนื้อหาหลัก พร้อมการปกป้อง code blocks, shortcodes และ interpolation variables โดยอัตโนมัติ

<!-- truncate -->

## การแปลแบบ Content-Aware

เมื่อแปล Markdown คุณไม่สามารถส่งไฟล์ดิบไปยัง LLM ได้โดยตรง เนื่องจาก code blocks จะถูกแปล shortcodes จะเสียหาย และ Hugo template variables จะผิดเพี้ยนไป

Rosetta v3.1.0 แก้ปัญหานี้ด้วย **Unicode sentinel shielding**:

1. ก่อนการแปล structured blocks (code fences, shortcodes, inline code, HTML) จะถูกแทนที่ด้วย sentinel tokens ที่ไม่ซ้ำกัน
2. LLM จะได้รับเฉพาะข้อความที่สามารถแปลได้เท่านั้น
3. หลังจากการแปล sentinels จะถูกกู้คืนกลับเป็นเนื้อหาต้นฉบับ

LLM จะไม่เห็น code blocks ของคุณเลย จึงไม่สามารถทำให้ข้อมูลเหล่านั้นเสียหายได้

## การรองรับ Front Matter

รองรับ delimiters ของ front matter ทั้งแบบ YAML (`---`) และ TOML (`+++`) โดยค่าเริ่มต้น `title`, `description`, `summary`, `subtitle`, `caption` และ `linkTitle` จะถูกแปล ส่วนฟิลด์อื่นๆ ทั้งหมด (date, draft, tags, weight) จะถูกคงไว้ตามเดิม

## การตั้งค่า

```json title="i18n-rosetta.config.json"
{
  "contentDir": "./content"
}
```

```bash
npx i18n-rosetta sync   # now translates content too
```

ดูรายละเอียดเพิ่มเติมได้ที่ [คู่มือ Content Translation](/docs/guides/content-translation)