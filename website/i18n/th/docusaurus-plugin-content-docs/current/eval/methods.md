---
sidebar_position: 4
title: "Method Interface"
---
# อินเทอร์เฟซ Method ที่ใช้ร่วมกัน

Eval harness และ i18n-rosetta มีแนวคิดร่วมกันเกี่ยวกับ **translation method** (วิธีการแปล) method คือกระบวนการใดๆ ที่รับข้อความต้นทางและสร้างข้อความที่แปลแล้วออกมา — ไม่ว่าจะเป็นการเรียกใช้ LLM โดยตรง, multi-stage pipeline, API ของบุคคลที่สาม หรือนักแปลที่เป็นมนุษย์

## สถาปัตยกรรม

```
Method Plugin (v2 Spec)
├── manifest.json         ← Shared metadata (name, version, supported pairs)
├── method_card.json      ← Leaderboard description (what, not how)
├── translate.py          ← Python entry point (for eval harness)
└── translate.js          ← Node.js entry point (for i18n-rosetta CLI)
```

## สองระบบ หนึ่งอินเทอร์เฟซ

| | Eval Harness | i18n-rosetta |
|---|---|---|
| **ภาษา** | Python | Node.js |
| **จุดเริ่มต้น (Entry point)** | `translate.py` | `translate.js` |
| **อินเทอร์เฟซ** | โปรโตคอล `TranslationProcess` | คอนฟิก `methodPlugin` |
| **วัตถุประสงค์** | การประเมินแบบชุด (Batch evaluation) พร้อมการให้คะแนน | การทำ Localization แบบเรียลไทม์ใน dev/CI |
| **ผลลัพธ์** | Run card พร้อมเมตริก | ไฟล์ locale ที่แปลแล้ว |

method ที่รองรับทั้งสองระบบจะมีจุดเริ่มต้น (entry point) สองจุด — หนึ่งจุดสำหรับแต่ละ language runtime โดย **method card** จะทำหน้าที่เป็นสะพานเชื่อม: ซึ่งจะอธิบาย method ในรูปแบบที่ทั้งสองระบบสามารถเข้าใจได้

## Method Card

method card จะอธิบายว่า translation method นั้นคือ *อะไร* โดยไม่เปิดเผยรายละเอียดที่เป็นกรรมสิทธิ์ เช่น system prompt แบบเต็ม โดยจะตอบคำถามต่อไปนี้:

- method นี้จัดอยู่ในคลาสใด? (raw LLM, coached LLM, pipeline, API ฯลฯ)
- ใช้เครื่องมืออะไรบ้าง? (FST analyzer, พจนานุกรม ฯลฯ)
- การนำไปใช้งาน (implementation) เป็นโอเพนซอร์สหรือไม่?
- รองรับคู่ภาษาใดบ้าง?

ดู [Method Card Spec](https://github.com/gamedaysuits/gds-mt-eval-harness/blob/main/docs/method-card-spec.md) สำหรับ JSON schema ฉบับเต็ม

### ตัวอย่าง

```json
{
  "method_id": "fst-gated-v8",
  "name": "FST-Gated Coached Translation v8",
  "class": "pipeline",
  "description": "LLM translation with morphological validation. Failed words are retried with FST feedback.",
  "author": "Curtis Forbes",
  "tools_used": ["HFST morphological analyzer", "Wolvengrey dictionary"],
  "open_source": false,
  "supported_pairs": ["eng>crk"]
}
```

### คลาสของ Method

| คลาส | คำอธิบาย |
|-------|-------------|
| `raw-llm` | การเรียกใช้ LLM โดยตรงพร้อมคำสั่งขั้นต่ำ |
| `coached-llm` | LLM พร้อม prompt ที่มีโครงสร้าง, ตัวอย่าง, และข้อจำกัด |
| `pipeline` | Multi-stage pipeline ที่มีองค์ประกอบแบบกำหนดได้ (deterministic) |
| `custom-plugin` | โปรเซสภายนอกที่ใช้งานโปรโตคอล `TranslationProcess` |
| `api` | API การแปลของบุคคลที่สาม (Google Translate, DeepL ฯลฯ) |
| `human` | การแปลโดยมนุษย์ (สำหรับการกำหนด baseline) |

## Eval Harness: โปรโตคอล TranslationProcess

Eval harness ใช้ structural typing ของ Python (`Protocol`) สำหรับปลั๊กอิน คลาสใดก็ตามที่มี method signature ถูกต้องก็สามารถทำงานได้ — โดยไม่จำเป็นต้องมีการสืบทอด (inheritance):

```python
class MyMethod:
    async def translate(self, entries: list[dict], config: RunConfig) -> list[dict]:
        results = []
        for entry in entries:
            translation = await self.do_translation(entry["source"])
            results.append({
                "id": entry["id"],
                "predicted": translation,
                "latency_s": 0.5,
                "usage": {"prompt_tokens": 0, "completion_tokens": 0},
                "error": None,
                "tool_calls": [],
                "tool_call_count": 0,
                "metadata": {},
            })
        return results
```

ดู [Plugin Protocol](https://github.com/gamedaysuits/gds-mt-eval-harness/blob/main/docs/plugin-protocol.md) สำหรับเอกสารประกอบฉบับสมบูรณ์ รวมถึงตัวอย่าง wrapper สำหรับ method ที่ไม่ใช่ Python

## i18n-rosetta: คอนฟิก methodPlugin

ใน rosetta จะมีการลงทะเบียน method ตามคู่ภาษาใน `i18n-rosetta.config.json`:

```json
{
  "version": 3,
  "pairs": {
    "en:crk": {
      "methodPlugin": "crk-coached-v1"
    }
  }
}
```

ดู [Plugin Spec](/docs/reference/plugin-spec) สำหรับอินเทอร์เฟซฝั่ง rosetta

## การทำงานร่วมกับ Leaderboard

เมื่อมีการแนบ method card เข้ากับการรัน (ผ่าน `--method-card`) มันจะถูกฝังอยู่ใน run card และแสดงบน leaderboard:

```bash
# Run with method card attached
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --method-card method_card.json \
  --submit
```

Leaderboard จะแสดง:
- **ป้ายกำกับคลาส (Class badge)** — ตัวบ่งชี้ทางภาพ (เช่น "pipeline", "coached-llm")
- **ชื่อ Method** — จาก method card
- **เครื่องมือที่ใช้** — รายการจาก method card
- **ตัวบ่งชี้ความเป็นโอเพนซอร์ส**

เมื่อไม่มีการแนบ method card ตัว leaderboard จะแสดงการกำหนดค่าดั้งเดิมของ harness (โมเดล, เงื่อนไข, temperature, เครื่องมือที่เปิดใช้งาน)

:::danger ห้ามฝึกสอน (TRAIN) ด้วยข้อมูลการประเมิน
Method ที่มีกระบวนการพัฒนาซึ่งเกี่ยวข้องกับการสัมผัสกับชุดข้อมูลการประเมิน — ไม่ว่าจะเป็นข้อมูลการฝึกสอน (training data), ตัวอย่างแบบ few-shot, รายการพจนานุกรม, หรือเนื้อหาสำหรับการปรับแต่ง prompt — จะถูก **ตัดสิทธิ์** จาก leaderboard ดู [MT Evaluation](/docs/eval/) สำหรับสิ่งที่แยกแยะระหว่าง method ที่ดีและไม่ดี
:::

---

## ดูเพิ่มเติม

- [MT Evaluation](/docs/eval/) — ภาพรวม, คุณค่าของ leaderboard, และคำแนะนำเกี่ยวกับ method ที่ดี/ไม่ดี
- [Eval Harness](/docs/eval/harness) — วิธีการรันการประเมิน
- [Evaluation Datasets](/docs/eval/datasets) — ชุดข้อมูลที่มีให้ใช้งาน (EDTeKLA, FLORES+)
- [Run Card Specification](/docs/eval/run-card) — JSON schema ของ run card
- [Plugin Spec](/docs/reference/plugin-spec) — อินเทอร์เฟซปลั๊กอินฝั่ง rosetta
- [Method Leaderboard](/leaderboard) — คะแนนเบนช์มาร์กแบบเรียลไทม์