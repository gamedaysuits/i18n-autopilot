---
sidebar_position: 3
title: "Quality Gate"
---
# Quality Gate

ทุกการแปลจะผ่านด่านการตรวจสอบ (validation gate) ที่กำหนดไว้ล่วงหน้าก่อนที่จะถูกเขียนลงดิสก์ Quality Gate จะช่วยดักจับข้อผิดพลาดทั่วไปที่เกิดจากการแปลด้วยเครื่อง (machine translation) — จะไม่มีการข้ามข้อผิดพลาดไปเงียบๆ และจะไม่มีข้อมูลขยะถูกเขียนลงในไฟล์ locale ของคุณ

## การตรวจสอบความถูกต้อง

| การตรวจสอบ | สิ่งที่ดักจับได้ | ป้ายกำกับ (Gate Label) |
|-------|----------------|-----------|
| **Empty/blank** | โมเดลส่งคืนค่าสตริงว่างหรือช่องว่าง | `[GATE] empty` |
| **Source echo** | โมเดลส่งคืนข้อความภาษาอังกฤษต้นฉบับ | `[GATE] source-echo` |
| **Hallucination loop** | รูปแบบ trigram ที่ซ้ำกัน (เช่น `"Qo' Qo' Qo'"`) | `[GATE] hallucination` |
| **Length inflation** | ผลลัพธ์ยาวกว่าต้นฉบับอย่างมีนัยสำคัญ | `[GATE] length` |
| **Script compliance** | ตัวอักษร (script) ไม่ถูกต้องสำหรับ locale ปลายทาง | `[GATE] script` |

### Empty/Blank

ปฏิเสธการแปลที่เป็นสตริงว่าง มีเพียงช่องว่าง หรือ `null` การตรวจสอบนี้จะดักจับโมเดลที่ไม่ส่งคืนค่าใดๆ สำหรับคีย์ (keys) ที่ยาก

### Source Echo

ตรวจจับเมื่อโมเดลส่งคืนข้อความต้นฉบับภาษาอังกฤษแทนที่จะแปล มักพบได้บ่อยในสตริงสั้นๆ และ prompt ที่ระบุรายละเอียดไม่เพียงพอ

### Hallucination Loop

วิเคราะห์รูปแบบ trigram (3 ตัวอักษร) ในผลลัพธ์ หากมี trigram ใดซ้ำกันมากกว่าจำนวนเกณฑ์ที่กำหนดเมื่อเทียบกับความยาวของผลลัพธ์ การแปลนั้นจะถูกปฏิเสธ การตรวจสอบนี้จะดักจับผลลัพธ์ที่เสื่อมคุณภาพ (degenerate outputs) เช่น `"Qo' Qo' Qo' Qo' Qo'"`

### Length Inflation

ปฏิเสธการแปลที่ความยาวของผลลัพธ์เกิน `maxLengthRatio × source length` (ค่าเริ่มต้น: 4 เท่า) การตรวจสอบนี้จะดักจับอาการหลอน (hallucinations) ของโมเดลที่สร้างข้อความยาวเหยียดสำหรับข้อมูลนำเข้าที่สั้น

สามารถกำหนดค่าได้ผ่าน `maxLengthRatio` ใน config ของคุณ

### Script Compliance

สำหรับ locale ที่มีการกำหนดค่าฟิลด์ `script` (เช่น `"script": "cans"` สำหรับ Plains Cree Syllabics) จะตรวจสอบว่าผลลัพธ์มีตัวอักษรที่ไม่ใช่ ASCII ซึ่งเหมาะสมกับตัวอักษร (script) ปลายทาง ผลลัพธ์ที่มีเฉพาะอักษรละตินสำหรับ locale ภาษาอาหรับ, CJK หรือ Syllabics จะถูกปฏิเสธ

## จะเกิดอะไรขึ้นเมื่อเกิดข้อผิดพลาด

1. การแปลที่ล้มเหลวจะถูกบันทึกลงใน stderr พร้อมกับคำนำหน้า `[GATE]`, ชื่อคีย์, สาเหตุ และตัวอย่างของค่าที่ได้
2. คีย์ดังกล่าวจะ **ไม่** ถูกเขียนลงในไฟล์ locale
3. กระบวนการ Retry Cascade จะเริ่มทำงาน (ดูด้านล่าง)

```
[GATE] hero.title: source-echo — "Welcome to our platform"
[GATE] nav.about: hallucination — "À À À À À À À À"
```

## Retry Cascade

เมื่อ batch ล้มเหลว (ข้อผิดพลาดในการแยกวิเคราะห์ JSON หรือถูกปฏิเสธโดย Quality Gate) rosetta จะลองใหม่ด้วยขนาด batch ที่เล็กลงเรื่อยๆ:

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the 2 problem keys
```

จำนวนครั้งสูงสุดในการลองใหม่ (retry budget) ถูกจำกัดโดย `maxRetries` (ค่าเริ่มต้น: 3, สามารถกำหนดค่าได้ตามภาษา) สิ่งนี้ช่วยป้องกันการใช้ token อย่างควบคุมไม่ได้กับคีย์ที่ล้มเหลวอย่างต่อเนื่อง

หลังจากลองใหม่จนครบกำหนด คีย์ที่มีปัญหาจะถูกบันทึกและข้ามไป โดยจะถูกนำมาลองใหม่อีกครั้งในการรัน `sync` ครั้งถัดไป

## Prompt Caching

ข้อความระบบ (system message) (ระดับภาษา, กฎไวยากรณ์, บันทึกรูปแบบ) จะถูกแยกออกจากข้อความผู้ใช้ (user message) (คีย์ที่ต้องการแปล) การแยกส่วนนี้เป็นความตั้งใจ:

- ข้อความระบบจะ **เหมือนกันในทุก batch** สำหรับ locale ที่กำหนด
- ผู้ให้บริการอย่าง Anthropic และ Google จะแคชข้อความระบบที่ซ้ำกัน
- ผลลัพธ์: batch แรกจะจ่ายค่า token เต็มจำนวน ส่วน batch ถัดๆ ไปจะจ่ายเฉพาะส่วนของข้อความผู้ใช้เท่านั้น

สิ่งนี้สามารถลดต้นทุน token ได้อย่างมากสำหรับโปรเจกต์ที่มีหลาย batch

---

## ดูเพิ่มเติม

- [How Sync Works](/docs/concepts/how-sync-works) — ตำแหน่งของ Quality Gate ในไปป์ไลน์
- [Translation Methods](/docs/guides/translation-methods) — วิธีการต่างๆ ที่ส่งข้อมูลเข้าสู่ Gate
- [Script Converters](/docs/concepts/script-converters) — การแปลงตัวอักษร (script) หลังผ่าน Gate
- [Coaching Data](/docs/concepts/coaching-data) — การปรับปรุงคุณภาพการแปลตั้งแต่ต้นทาง
- [CLI Reference — sync](/docs/reference/cli#sync) — แฟล็ก sync รวมถึงพฤติกรรมการลองใหม่ (retry)