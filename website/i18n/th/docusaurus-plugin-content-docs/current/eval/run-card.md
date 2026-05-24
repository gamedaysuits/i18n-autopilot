---
sidebar_position: 4
title: "ข้อกำหนด Run Card"
---
# ข้อกำหนดของ Run Card

Run card คือบันทึกฉบับสมบูรณ์ของการรันการประเมินผลหนึ่งครั้ง โดยประกอบด้วยทุกสิ่งที่จำเป็นในการทำความเข้าใจ ทำซ้ำ และตรวจสอบการทดลอง ได้แก่ การกำหนดค่า คะแนน ผลลัพธ์แต่ละรายการ การใช้โทเค็น และข้อมูลเมตาของสภาพแวดล้อม

**เวอร์ชันของสคีมา:** 2.0

---

## ฟิลด์ระดับบนสุด

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|------|-------------|
| `run_id` | `string` | UUID v4 ที่สร้างขึ้นเมื่อเริ่มการรัน |
| `harness_version` | `string` | Semantic version ของ harness ที่สร้างการ์ดนี้ (เช่น `2.0`) |
| `model_slug` | `string` | OpenRouter model slug ที่ใช้สำหรับการรัน (เช่น `openai/gpt-4o`) |
| `model_id` | `string` | ตัวระบุโมเดลที่ได้รับการแก้ไขซึ่งส่งคืนโดย API (เช่น `gpt-4o-2024-08-06`) |
| `condition` | `string` | ป้ายกำกับการทดลอง (เช่น `baseline`, `coached-v3`, `few-shot`) |
| `timestamp` | `string` | การประทับเวลา ISO 8601 UTC เมื่อเริ่มการรัน |
| `elapsed_seconds` | `number` | ระยะเวลาตามเวลาจริง (Wall-clock duration) ของการรันทั้งหมด |

```json
{
  "run_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "harness_version": "2.0",
  "model_slug": "openai/gpt-4o",
  "model_id": "gpt-4o-2024-08-06",
  "condition": "baseline",
  "timestamp": "2025-05-20T03:22:41Z",
  "elapsed_seconds": 142.7
}
```

---

## `dataset`

ระบุชุดข้อมูลการประเมินและปักหมุดไว้ที่เวอร์ชันเนื้อหาเฉพาะผ่าน SHA-256

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|------|-------------|
| `id` | `string` | ตัวระบุชุดข้อมูล (เช่น `edtekla-dev-v1`) |
| `version` | `string` | สตริงเวอร์ชันของชุดข้อมูล |
| `language_pair` | `string` | ป้ายกำกับที่แสดงผล (เช่น `EN→CRK`) |
| `sha256` | `string` | ค่าแฮช SHA-256 ของเนื้อหาไฟล์ชุดข้อมูล รับประกันความถูกต้องของข้อมูลที่ใช้ |
| `entry_count` | `number` | จำนวนรายการในชุดข้อมูล |

```json
{
  "dataset": {
    "id": "edtekla-dev-v1",
    "version": "1.0",
    "language_pair": "EN→CRK",
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "entry_count": 124
  }
}
```

---

## `config`

การกำหนดค่า API และการจัดชุด (batching) ที่ใช้สำหรับการรันนี้

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|------|-------------|
| `api_provider` | `string` | ชื่อผู้ให้บริการ API (เช่น `openrouter`) |
| `temperature` | `number` | อุณหภูมิการสุ่ม (Sampling temperature) |
| `max_tokens` | `number` | จำนวนโทเค็นสูงสุดต่อการเติมเต็ม (completion) |
| `batch_size` | `number` | จำนวนรายการต่อชุดที่ทำงานพร้อมกัน |
| `concurrency` | `number` | จำนวนคำขอ API แบบขนานสูงสุด |

```json
{
  "config": {
    "api_provider": "openrouter",
    "temperature": 0.3,
    "max_tokens": 1024,
    "batch_size": 5,
    "concurrency": 3
  }
}
```

---

## `system_prompt_sha256` / `system_prompt_used`

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|------|-------------|
| `system_prompt_sha256` | `string` | ค่าแฮช SHA-256 ของ system prompt รวมอยู่ในลายนิ้วมือ (fingerprint) |
| `system_prompt_used` | `string` | ข้อความ system prompt แบบเต็มที่ส่งไปยังโมเดล |

ค่าแฮชของ prompt เป็นส่วนหนึ่งของ [ลายนิ้วมือ](#fingerprint) — การรันสองครั้งที่มี prompt ต่างกันจะมีลายนิ้วมือต่างกัน แม้ว่าการตั้งค่าอื่นๆ ทั้งหมดจะตรงกันก็ตาม

---

## `fingerprint`

ตัวระบุความสามารถในการทำซ้ำ การรันสองครั้งที่มีลายนิ้วมือเหมือนกันแสดงว่าใช้การตั้งค่าการทดลองเดียวกัน

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|------|-------------|
| `hash` | `string` | ค่าแฮช SHA-256 ขององค์ประกอบที่จัดเรียงแล้ว |
| `components` | `object` | ค่าอินพุตที่ถูกแฮช |

### องค์ประกอบของลายนิ้วมือ

| องค์ประกอบ | คำอธิบาย |
|-----------|-------------|
| `dataset_sha256` | ค่าแฮชของไฟล์ชุดข้อมูล |
| `model_slug` | โมเดลที่ใช้ |
| `condition` | ป้ายกำกับเงื่อนไขการทดลอง |
| `system_prompt_sha256` | ค่าแฮชของ system prompt |
| `temperature` | อุณหภูมิการสุ่ม (Sampling temperature) |
| `harness_version` | เวอร์ชันของ harness |

```json
{
  "fingerprint": {
    "hash": "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    "components": {
      "dataset_sha256": "e3b0c44298fc1c14...",
      "model_slug": "openai/gpt-4o",
      "condition": "baseline",
      "system_prompt_sha256": "abc123...",
      "temperature": 0.3,
      "harness_version": "2.0"
    }
  }
}
```

:::info ลายนิ้วมือ ≠ ค่าแฮชของ Run Card
ลายนิ้วมือระบุ *การกำหนดค่าการทดลอง* ส่วน `run_card_hash` จะตรวจสอบ *ความสมบูรณ์ของไฟล์ผลลัพธ์* ดูรายละเอียดเพิ่มเติมที่ [ลายนิ้วมือเทียบกับค่าแฮชของ Run Card](/docs/eval/harness#fingerprint-vs-run-card-hash)
:::

---

## `scores`

เมตริกแบบรวมสำหรับการรันทั้งหมด

### คะแนนระดับบนสุด

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|------|-------------|
| `total` | `number` | จำนวนรายการทั้งหมดที่ได้รับการประเมิน |
| `exact_matches` | `number` | จำนวนรายการที่ผลลัพธ์ตรงกับมาตรฐานทองคำ (gold standard) ทุกประการ |
| `exact_match_rate` | `number` | `exact_matches / total` (0.0–1.0) |
| `fst_accepted` | `number` | จำนวนรายการที่เครื่องมือวิเคราะห์ FST ยอมรับผลลัพธ์ |
| `fst_acceptance_rate` | `number` | `fst_accepted / total` (0.0–1.0) จะเป็น `null` หากไม่ได้ใช้เครื่องมือวิเคราะห์ FST |
| `chrf_plus_plus` | `number` | คะแนน chrF++ ระดับคลังข้อมูล (0–100) |
| `errors` | `number` | จำนวนรายการที่ล้มเหลว (ข้อผิดพลาดของ API, หมดเวลา ฯลฯ) |
| `avg_latency_seconds` | `number` | เวลาตอบสนองเฉลี่ยของทุกรายการ |
| `median_latency_seconds` | `number` | เวลาตอบสนองมัธยฐาน |
| `p95_latency_seconds` | `number` | เวลาตอบสนองเปอร์เซ็นไทล์ที่ 95 |

### `by_difficulty`

คะแนนแจกแจงตามระดับความยาก แต่ละคีย์ (`easy`, `medium`, `hard`) จะมีฟิลด์เมตริกเหมือนกับคะแนนระดับบนสุด

```json
{
  "by_difficulty": {
    "easy": {
      "total": 42,
      "exact_matches": 8,
      "exact_match_rate": 0.1905,
      "chrf_plus_plus": 51.2,
      "fst_accepted": 35,
      "fst_acceptance_rate": 0.8333
    },
    "medium": { ... },
    "hard": { ... }
  }
}
```

### `by_provenance`

คะแนนแจกแจงตามแหล่งที่มาของรายการ แต่ละคีย์ (เช่น `gold_standard`, `textbook`) จะมีฟิลด์เมตริกเหมือนกัน

```json
{
  "by_provenance": {
    "gold_standard": {
      "total": 80,
      "exact_matches": 10,
      "exact_match_rate": 0.125,
      "chrf_plus_plus": 44.8
    },
    "textbook": { ... }
  }
}
```

---

## `totals`

การติดตามการใช้โทเค็นและค่าใช้จ่ายสำหรับการรันทั้งหมด

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|------|-------------|
| `prompt_tokens` | `number` | โทเค็นอินพุตทั้งหมดจากการเรียก API ทุกครั้ง |
| `completion_tokens` | `number` | โทเค็นเอาต์พุตทั้งหมด |
| `reasoning_tokens` | `number` | โทเค็นที่ใช้สำหรับการให้เหตุผลแบบ chain-of-thought (ขึ้นอยู่กับโมเดล โดยส่วนใหญ่จะเป็น 0) |
| `cached_tokens` | `number` | โทเค็นที่ให้บริการจาก prompt cache ของผู้ให้บริการ |
| `total_cost_usd` | `number` | ค่าใช้จ่ายรวมในสกุลเงิน USD (ตามที่รายงานโดย API) |
| `cost_per_entry_usd` | `number` | `total_cost_usd / entry_count` |
| `reasoning_ratio` | `number` | `reasoning_tokens / completion_tokens` (0.0–1.0) |

```json
{
  "totals": {
    "prompt_tokens": 48200,
    "completion_tokens": 3100,
    "reasoning_tokens": 0,
    "cached_tokens": 12000,
    "total_cost_usd": 0.42,
    "cost_per_entry_usd": 0.0034,
    "reasoning_ratio": 0.0
  }
}
```

---

## `environment`

ข้อมูลเมตาของสภาพแวดล้อมรันไทม์เพื่อความสามารถในการทำซ้ำ

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|------|-------------|
| `harness_version` | `string` | เวอร์ชันของ harness (สะท้อนจาก `harness_version` ระดับบนสุด) |
| `harness_git_commit` | `string` | Git commit SHA ของ harness ในขณะรัน |
| `python_version` | `string` | เวอร์ชันของ Python interpreter |
| `sacrebleu_version` | `string` | เวอร์ชันของไลบรารี sacrebleu (ใช้สำหรับการให้คะแนน chrF++) |
| `os` | `string` | ตัวระบุระบบปฏิบัติการ |

```json
{
  "environment": {
    "harness_version": "2.0",
    "harness_git_commit": "a1b2c3d",
    "python_version": "3.11.9",
    "sacrebleu_version": "2.4.0",
    "os": "macOS-14.5-arm64"
  }
}
```

---

## `results[]`

อาร์เรย์ผลลัพธ์ต่อรายการ หนึ่งออบเจ็กต์ต่อหนึ่งรายการในชุดข้อมูล ตามลำดับดัชนี

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|------|-------------|
| `entry_index` | `number` | ดัชนีของรายการนี้ในชุดข้อมูล (ตรงกับ `entries[].index`) |
| `source_text` | `string` | ข้อความต้นฉบับที่ถูกแปล |
| `target_expected` | `string` | ข้อมูลอ้างอิงมาตรฐานทองคำ (gold-standard reference) จากชุดข้อมูล |
| `target_output` | `string` | ผลลัพธ์จริงของโมเดล |
| `exact_match` | `boolean` | ระบุว่า `target_output === target_expected` หรือไม่ |
| `entry_chrf` | `number` | คะแนน chrF++ ระดับประโยคสำหรับรายการนี้ (0–100) |
| `fst_accepted` | `boolean \| null` | ระบุว่าเครื่องมือวิเคราะห์ FST ยอมรับผลลัพธ์หรือไม่ จะเป็น `null` หากไม่ได้กำหนดค่าเครื่องมือวิเคราะห์ไว้ |
| `fst_analysis` | `string[]` | สตริงการวิเคราะห์ FST สำหรับผลลัพธ์ (อาร์เรย์ว่างหากไม่ได้วิเคราะห์หรือถูกปฏิเสธ) |
| `difficulty` | `string` | ระดับความยากจากชุดข้อมูล (`easy`, `medium`, `hard`) |
| `provenance` | `string` | แท็กแหล่งที่มาจากชุดข้อมูล |
| `latency_seconds` | `number` | เวลาตอบสนองสำหรับรายการนี้ |
| `usage` | `object` | การใช้โทเค็นต่อรายการ: `{ prompt_tokens, completion_tokens, reasoning_tokens }` |
| `error` | `string \| null` | ข้อความแสดงข้อผิดพลาดหากรายการนี้ล้มเหลว จะเป็น `null` เมื่อสำเร็จ |

```json
{
  "results": [
    {
      "entry_index": 0,
      "source_text": "Hello",
      "target_expected": "tânisi",
      "target_output": "tânisi",
      "exact_match": true,
      "entry_chrf": 100.0,
      "fst_accepted": true,
      "fst_analysis": ["tânisi+V+AI+Ind+2Sg"],
      "difficulty": "easy",
      "provenance": "gold_standard",
      "latency_seconds": 0.82,
      "usage": {
        "prompt_tokens": 385,
        "completion_tokens": 12,
        "reasoning_tokens": 0
      },
      "error": null
    }
  ]
}
```

---

## `run_card_hash`

| ฟิลด์ | ประเภท | คำอธิบาย |
|-------|------|-------------|
| `run_card_hash` | `string` | ค่าแฮช SHA-256 ของ run card JSON ทั้งหมด โดยที่ฟิลด์ `run_card_hash` จะถูกตั้งค่าเป็น `""` ในระหว่างการแฮช |

นี่คือตราประทับตรวจจับการปลอมแปลง ลีดเดอร์บอร์ดจะคำนวณค่าแฮชนี้ใหม่เมื่อมีการส่ง และจะปฏิเสธการ์ดที่ค่าแฮชไม่ตรงกัน

**การคำนวณค่าแฮช:**

1. แปลง (Serialize) run card เป็น JSON โดยตั้งค่า `run_card_hash` เป็น `""`
2. คำนวณ SHA-256 ของสตริงที่แปลงแล้ว
3. ตั้งค่า `run_card_hash` เป็น hex digest ที่ได้จากผลลัพธ์

```python
import hashlib, json

card["run_card_hash"] = ""
card_json = json.dumps(card, sort_keys=True, ensure_ascii=False)
card["run_card_hash"] = hashlib.sha256(card_json.encode()).hexdigest()
```

---

## ดูเพิ่มเติม

- [การประเมิน MT](/docs/eval/) — ภาพรวม คุณค่าของลีดเดอร์บอร์ด และคำแนะนำเกี่ยวกับวิธีการที่ดี/ไม่ดี
- [Eval Harness](/docs/eval/harness) — วิธีรันการประเมินและสร้าง run card
- [ชุดข้อมูลการประเมิน](/docs/eval/datasets) — รูปแบบชุดข้อมูล, EDTeKLA, FLORES+
- [การสร้างวิธีการ](/docs/eval/methods) — อินเทอร์เฟซของวิธีการและข้อกำหนดของ method card
- [ลีดเดอร์บอร์ดวิธีการ](/leaderboard) — คะแนนเกณฑ์มาตรฐานแบบเรียลไทม์