---
slug: v3-2-quality-infrastructure
title: "v3.2.0: โครงสร้างพื้นฐานด้านคุณภาพระดับอุตสาหกรรม"
authors: [curtisforbes]
tags: [release]
date: 2026-05-14
---
v3.2.0 คือรุ่นที่เน้นด้านคุณภาพ มีการทดสอบ 702 รายการ, ชุดการทดสอบ 163 ชุด และไม่อนุญาตให้เกิดข้อผิดพลาดที่ซ่อนเร้น (silent failures) อย่างเด็ดขาด

<!-- truncate -->

## สิ่งที่เปลี่ยนแปลง

### Quality Gate (การตรวจสอบ 5 ขั้นตอน)

ขณะนี้การแปลทุกครั้งจะผ่านการตรวจสอบความถูกต้องที่กำหนดไว้ 5 ขั้นตอนก่อนที่จะถูกบันทึกลงดิสก์:

1. **Empty/blank** — โมเดลไม่ส่งค่าใดๆ กลับมา
2. **Source echo** — โมเดลส่งคืนข้อมูลภาษาอังกฤษที่เป็นต้นฉบับ
3. **Hallucination loop** — รูปแบบ trigram ที่ซ้ำซ้อนกัน
4. **Length inflation** — ผลลัพธ์มีความยาวมากกว่าต้นฉบับ 4 เท่าขึ้นไป
5. **Script compliance** — สคริปต์ไม่ถูกต้องสำหรับ locale นั้นๆ

จะไม่มีการบันทึกคำแปลใดๆ หากไม่ผ่านการตรวจสอบทั้ง 5 ขั้นตอนนี้ คำแปลที่ไม่ผ่านจะถูกบันทึกใน log และทำการลองใหม่ (retry)

### Retry Cascade

เมื่อ batch เกิดข้อผิดพลาด rosetta จะทำการลองใหม่โดยลดขนาด batch ลงเรื่อยๆ:

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the problem keys
```

### การยกระดับความปลอดภัย

- **Prototype pollution guard** — คีย์ `__proto__`, `constructor` จะถูกปฏิเสธในขั้นตอนการ parse
- **Path traversal guard** — รหัส locale ที่ถูกสร้างขึ้นมาเพื่อโจมตีจะไม่สามารถเขียนข้อมูลออกนอกไดเรกทอรีที่กำหนดไว้ได้
- **Response validation** — ยอมรับเฉพาะคีย์ที่ถูกส่งไปเท่านั้นเมื่อได้รับข้อมูลกลับมา

### โครงสร้างพื้นฐานการทดสอบ

| ชุดการทดสอบ | จำนวนการทดสอบ | สิ่งที่ครอบคลุม |
|-------|-------|---------------|
| Core (8 ชุด) | 280+ | Config, sync, CLI, watch, audit, pairs, format, init |
| Red team | 89 | Adversarial inputs, encoding attacks |
| Contract | 120 | API integration contracts |
| Performance | 36 | Batch optimization, throughput regression |
| Coverage | รวม 702 | Full pipeline |

### Prompt Caching

ขณะนี้ข้อความระบบ (System messages) ถูกแยกออกจากข้อความผู้ใช้ (User messages) แล้ว ซึ่งช่วยให้สามารถใช้งาน prompt cache hits บนผู้ให้บริการอย่าง Anthropic และ Google ได้ สิ่งนี้ช่วยลดต้นทุน token สำหรับการซิงค์แบบหลาย batch (multi-batch syncs) ได้อย่างมาก

ดูรายละเอียดทางเทคนิคฉบับเต็มได้ที่ [เอกสาร Quality Gate](/docs/concepts/quality-gate) และ [เอกสาร Security](/docs/concepts/security)