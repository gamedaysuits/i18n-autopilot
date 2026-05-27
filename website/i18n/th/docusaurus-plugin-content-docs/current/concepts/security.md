---
sidebar_position: 4
title: "ความปลอดภัย"
---
# ความปลอดภัย

Rosetta ได้รับการออกแบบมาให้มีความปลอดภัยในสภาพแวดล้อมที่อาจเกิดการโจมตี — ซึ่งข้อมูล locale อาจมาจากแหล่งที่ไม่น่าเชื่อถือ ชื่อไฟล์ที่ถูกดัดแปลงอาจหลุดออกจากขอบเขตของไดเรกทอรี และผลลัพธ์จาก LLM ที่อาจมีเนื้อหาใดๆ ก็ได้

## รูปแบบภัยคุกคาม

| ภัยคุกคาม | ช่องทางการโจมตี | การบรรเทาผลกระทบ |
|--------|--------------|-----------|
| **Prototype pollution** | คีย์ JSON ที่ถูกดัดแปลง (`__proto__`, `constructor`) | ปฏิเสธตั้งแต่ขั้นตอนการแยกวิเคราะห์ (Parse) |
| **Path traversal** | รหัส Locale เช่น `../../etc/passwd` | ตรวจสอบการเขียนไฟล์ให้อยู่ในไดเรกทอรีที่กำหนดค่าไว้ |
| **Code block corruption** | LLM แปลเนื้อหาภายใน code fences | ป้องกันด้วย Unicode sentinel |
| **Hallucinated keys** | LLM ส่งคืนคีย์ที่ไม่ได้ส่งไป | การตรวจสอบการตอบกลับ — เขียนเฉพาะคีย์ที่ยอมรับเท่านั้น |
| **Runaway token spend** | การวนลูปลองใหม่ (Retry) ไม่สิ้นสุด | จำกัดงบประมาณผ่าน `maxRetries` |

## การป้องกัน Prototype Pollution

คีย์ locale ทั้งหมดจะถูกตรวจสอบกับ blocklist ก่อนการประมวลผล:

- `__proto__`
- `constructor`
- `prototype`

คีย์ใดๆ ที่ตรงกับรูปแบบเหล่านี้จะถูกปฏิเสธและแสดงข้อผิดพลาด สิ่งนี้ช่วยป้องกันไม่ให้ผู้โจมตีใช้ไฟล์ locale ที่ถูกดัดแปลงเพื่อแก้ไข JavaScript object prototypes

## การควบคุม Path

เมื่อเขียนไฟล์ locale rosetta จะตรวจสอบว่า path ผลลัพธ์ยังคงอยู่ภายในไดเรกทอรีที่กำหนดค่าไว้ (`localesDir`, `contentDir`) รหัส locale จะถูกทำความสะอาด (Sanitize) — รหัสเช่น `../../secrets` จะไม่สามารถเขียนออกไปนอกไดเรกทอรีที่คาดหวังได้

## การป้องกัน Block

ในระหว่างการแปลเนื้อหา Markdown องค์ประกอบที่มีโครงสร้างจะถูกแทนที่ด้วย Unicode sentinel placeholders ก่อนที่ข้อความจะถูกส่งไปยัง LLM:

1. **Code blocks** (แบบ fenced และ inline) → sentinel
2. **Hugo shortcodes** (`{{< >}}`, `{{% %}}`) → sentinel  
3. **Raw HTML** → sentinel
4. **Interpolation variables** (`{{ .Count }}`) → sentinel

หลังจากการแปล sentinels จะถูกแทนที่กลับด้วยเนื้อหาต้นฉบับ LLM จะไม่เห็น code blocks, shortcodes หรือ HTML เลย — จึงไม่สามารถทำให้ข้อมูลเหล่านี้เสียหายได้

## การตรวจสอบการตอบกลับ

เมื่อ LLM ส่งคืนการตอบกลับเป็น JSON rosetta จะตรวจสอบว่า:
- มีเฉพาะคีย์ที่ถูกส่งไปในชุดข้อมูล (Batch) เท่านั้นที่ปรากฏในการตอบกลับ
- ไม่มีการแทรกคีย์ส่วนเกินเข้ามา
- การตอบกลับสามารถแยกวิเคราะห์เป็น JSON ที่ถูกต้องได้

คีย์ที่เกิดจากอาการหลอน (Hallucinated keys) จะถูกละทิ้งโดยไม่แสดงข้อผิดพลาด สิ่งนี้ช่วยป้องกันไม่ให้ผลลัพธ์จาก LLM แทรกการแปลที่ไม่คาดคิดลงในไฟล์ locale ของคุณ

## Quality Gate

ทุกการแปลจะถูกตรวจสอบผ่านการตรวจสอบที่กำหนดไว้ 5 ขั้นตอนก่อนที่จะถูกเขียนลงดิสก์ ดูรายละเอียดได้ที่ [Quality Gate](/docs/concepts/quality-gate)

## Exponential Backoff

การเรียกใช้ API จะใช้ exponential backoff พร้อม jitter เมื่อได้รับการตอบกลับแบบ 429 (rate limit) และ 5xx (server error) การลองใหม่ 3 ครั้งพร้อมกับการเพิ่มระยะเวลาหน่วงจะช่วยป้องกันการกระหน่ำเรียก API ในช่วงที่ระบบขัดข้อง

## Request Timeout

ทุกคำขอ API จะมีระยะเวลาหมดเวลา (Timeout) ที่ 30 วินาทีผ่าน `AbortController` สิ่งนี้ช่วยป้องกันไม่ให้กระบวนการซิงค์ค้างอย่างไม่มีกำหนดเมื่อการเชื่อมต่อขาดหาย

## โหมด Fallback

เมื่อ API ไม่พร้อมใช้งาน `--fallback` จะเขียน placeholders ที่นำหน้าด้วย `[EN]` แทนการแปลจริง:

```bash
npx i18n-rosetta sync --fallback
```

```json
{
  "hero.title": "[EN] Welcome to our platform"
}
```

placeholders เหล่านี้จะถูกตรวจจับและแปลใหม่อัตโนมัติในการซิงค์ครั้งถัดไปด้วยคีย์ API ที่ถูกต้อง โดยจะไม่ถูกมองว่าเป็น "การแปลแล้ว" — `audit` จะตั้งค่าสถานะ (Flag) แจ้งเตือนสิ่งเหล่านี้

## การทดสอบ

คุณสมบัติด้านความปลอดภัยจะถูกตรวจสอบโดยชุดการทดสอบการโจมตี (Adversarial test suite):

```bash
npm run test:redteam    # prototype pollution, path traversal, encoding attacks
```

---

## ดูเพิ่มเติม

- [Architecture](/docs/concepts/architecture) — วิธีที่ระบบนิเวศทั้งสามส่วนเชื่อมต่อกัน
- [CLI Reference — integrity](/docs/reference/cli#integrity) — คำสั่งตรวจสอบความสมบูรณ์ (Integrity)
- [CLI Reference — provenance](/docs/reference/cli#provenance) — คำสั่งตรวจสอบแหล่งที่มา (Provenance)
- [Plugin Specification](/docs/reference/plugin-spec) — ฟิลด์แหล่งที่มา (Provenance) ใน plugin manifests
- [Quality Gate](/docs/concepts/quality-gate) — การตรวจสอบความปลอดภัยระดับการแปล