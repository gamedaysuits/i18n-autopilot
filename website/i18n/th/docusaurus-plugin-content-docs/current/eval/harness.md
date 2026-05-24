---
sidebar_position: 2
title: "Eval Harness v2.0"
---
# Eval Harness v2.0

Harness จะรันการทดสอบการแปลและสร้าง run card โดยจะจัดการเรื่องการสร้าง prompt, การเรียกใช้ API, การให้คะแนน และการแปลงผลลัพธ์ให้อยู่ในรูปแบบที่จัดเก็บได้ (serialization) — คุณเพียงแค่จัดเตรียมชุดข้อมูลและโมเดลเท่านั้น

## การติดตั้ง

**ความต้องการของระบบ:** Python 3.10+

```bash
pip install sacrebleu aiohttp
```

โคลน repository ของ harness:

```bash
git clone https://github.com/gamedaysuits/gds-mt-eval-harness.git
cd gds-mt-eval-harness
```

## การใช้งาน

```bash
python eval/baseline_experiment.py --dataset path/to/dataset.json
```

คำสั่งนี้จะรันทุกรายการในชุดข้อมูลผ่านโมเดลที่กำหนดค่าไว้ ให้คะแนนผลลัพธ์ และเขียนไฟล์ JSON ของ run card ลงในไดเรกทอรี `results/`

## แฟล็ก CLI

| แฟล็ก | จำเป็น | ค่าเริ่มต้น | คำอธิบาย |
|------|----------|---------|-------------|
| `--dataset` | ✅ | — | พาธไปยังไฟล์ JSON ของชุดข้อมูลการประเมิน |
| `--model` | — | `openai/gpt-4o` | Slug ของโมเดล OpenRouter (เช่น `google/gemini-2.5-pro`) |
| `--condition` | — | `baseline` | ป้ายกำกับการทดลอง ใช้เพื่อแยกแยะกลยุทธ์ของ prompt (เช่น `coached`, `few-shot`, `dictionary-augmented`) |
| `--temperature` | — | `0.3` | อุณหภูมิการสุ่ม (Sampling temperature) ค่าที่ต่ำกว่า = ผลลัพธ์ที่แน่นอนกว่า |
| `--batch-size` | — | `5` | จำนวนรายการต่อแบทช์ API ที่ทำงานพร้อมกัน |
| `--fst-analyzer` | — | `null` | พาธไปยังไบนารีของ FST analyzer เมื่อระบุไว้ ผลลัพธ์แต่ละรายการจะถูกทดสอบการยอมรับทางสัณฐานวิทยา (morphological acceptance) |
| `--submit` | — | `false` | ส่ง run card ไปยัง API ของ leaderboard หลังจากรันเสร็จสิ้น |

### ตัวอย่าง

```bash
# Run with defaults (GPT-4o, baseline condition)
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json

# Coached experiment with Gemini, lower temperature
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --model google/gemini-2.5-pro \
  --condition coached-v3 \
  --temperature 0.1

# Run with FST validation and auto-submit
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --fst-analyzer ./bin/crk-analyzer \
  --submit
```

---

## โครงสร้าง Run Card

ทุกการทดลองจะสร้าง **run card** ซึ่งเป็นเอกสาร JSON ที่สมบูรณ์ในตัว โครงสร้างระดับบนสุดมีดังนี้:

```json
{
  "run_id": "uuid-v4",
  "harness_version": "2.0",
  "model_slug": "openai/gpt-4o",
  "model_id": "gpt-4o-2024-08-06",
  "condition": "baseline",
  "timestamp": "2025-05-20T03:22:41Z",
  "elapsed_seconds": 142.7,
  "dataset": { ... },
  "config": { ... },
  "system_prompt_sha256": "abc123...",
  "system_prompt_used": "You are a translator...",
  "fingerprint": { ... },
  "scores": { ... },
  "totals": { ... },
  "environment": { ... },
  "results": [ ... ],
  "run_card_hash": "sha256-of-entire-card"
}
```

ดู [ข้อกำหนดของ Run Card](/docs/eval/run-card) สำหรับโครงสร้างแบบเต็มพร้อมเอกสารประกอบของทุกฟิลด์

### บล็อกที่สำคัญ

**`dataset`** — ระบุว่าใช้ชุดข้อมูลใด รวมถึงแฮชเนื้อหาเพื่อให้ผลลัพธ์ผูกกับเวอร์ชันที่เฉพาะเจาะจง:

```json
{
  "id": "edtekla-dev-v1",
  "version": "1.0",
  "language_pair": "EN→CRK",
  "sha256": "...",
  "entry_count": 124
}
```

**`scores`** — เมตริกโดยรวมสำหรับการรัน:

```json
{
  "total": 124,
  "exact_matches": 12,
  "exact_match_rate": 0.0968,
  "fst_accepted": 87,
  "fst_acceptance_rate": 0.7016,
  "chrf_plus_plus": 42.31,
  "errors": 0,
  "avg_latency_seconds": 1.15,
  "median_latency_seconds": 1.02,
  "p95_latency_seconds": 2.34,
  "by_difficulty": { ... },
  "by_provenance": { ... }
}
```

**`totals`** — การติดตามการใช้งานโทเค็นและค่าใช้จ่าย:

```json
{
  "prompt_tokens": 48200,
  "completion_tokens": 3100,
  "reasoning_tokens": 0,
  "cached_tokens": 12000,
  "total_cost_usd": 0.42,
  "cost_per_entry_usd": 0.0034,
  "reasoning_ratio": 0.0
}
```

---

## Fingerprint กับ Run Card Hash

Harness จะสร้างแฮชที่แตกต่างกันสองแบบ ซึ่งมีจุดประสงค์การใช้งานที่ต่างกัน:

### Fingerprint

**fingerprint** จะตอบคำถามที่ว่า: *"การรันครั้งนี้สามารถทำซ้ำได้หรือไม่?"*

โดยจะแฮชการรวมกันของอินพุตที่กำหนดการตั้งค่าการทดลอง — ไม่ใช่ผลลัพธ์:

- SHA-256 ของชุดข้อมูล
- Slug ของโมเดล
- ป้ายกำกับเงื่อนไข (Condition label)
- SHA-256 ของ System prompt
- อุณหภูมิ (Temperature)
- เวอร์ชันของ Harness

การรันสองครั้งที่มี fingerprint เหมือนกันหมายความว่าใช้การตั้งค่าเดียวกัน ผลลัพธ์ที่ได้ควรนำมาเปรียบเทียบกันได้ (ยกเว้นความไม่แน่นอนของ API)

### Run Card Hash

**run card hash** จะตอบคำถามที่ว่า: *"ไฟล์ผลลัพธ์เฉพาะนี้ถูกดัดแปลงแก้ไขหรือไม่?"*

มันคือ SHA-256 ของไฟล์ JSON ของ run card ทั้งหมด (ไม่รวมฟิลด์ `run_card_hash`) หากฟิลด์ใดฟิลด์หนึ่งมีการเปลี่ยนแปลง — เช่น คะแนน, การประทับเวลา (timestamp), หรือผลลัพธ์เพียงรายการเดียว — แฮชนั้นจะไม่ถูกต้องทันที

:::info เมื่อใดควรใช้อะไร
ใช้ **fingerprint** เพื่อจัดกลุ่มการรันที่เปรียบเทียบกันได้ (การทดลองเดียวกัน แต่รันต่างครั้งกัน) ใช้ **run card hash** เพื่อตรวจสอบความสมบูรณ์ของไฟล์ผลลัพธ์เฉพาะ
:::

---

## การส่งไปยัง Leaderboard

### การส่งอัตโนมัติ

ส่ง `--submit` เพื่ออัปโหลด run card เมื่อเสร็จสิ้น:

```bash
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --submit
```

### การส่งด้วยตนเอง

Run card จะถูกบันทึกเป็นไฟล์ JSON ใน `results/` คุณสามารถส่งไฟล์ run card ใดๆ ผ่าน UI ของ leaderboard ได้ที่ [/leaderboard](/leaderboard) หรือผ่าน API:

```bash
curl -X POST https://i18n-rosetta.com/api/leaderboard/submit \
  -H "Content-Type: application/json" \
  -d @results/your-run-card.json
```

:::warning การตรวจสอบของ Leaderboard
Leaderboard จะตรวจสอบ run card ที่ส่งมาเทียบกับ registry ของชุดข้อมูล การส่งที่อ้างอิงถึงชุดข้อมูลที่ไม่รู้จัก หรือมี `run_card_hash` ที่ไม่ถูกต้อง จะถูกปฏิเสธ
:::

:::danger ห้ามฝึกสอน (TRAIN) ด้วยข้อมูลการประเมิน
หากวิธีการของคุณเคยเห็นชุดข้อมูลการประเมินในระหว่างการพัฒนา — ไม่ว่าจะเป็นข้อมูลการฝึกสอน, ตัวอย่าง few-shot, รายการพจนานุกรม, หรือเนื้อหาสำหรับ prompt engineering — การส่งของคุณจะถูก **ตัดสิทธิ์** ดู [การประเมิน MT](/docs/eval/) สำหรับข้อมูลว่าอะไรคือวิธีการที่ดีและไม่ดี
:::

---

## ดูเพิ่มเติม

- [การประเมิน MT](/docs/eval/) — ภาพรวม, คุณค่าของ leaderboard, และคำแนะนำเกี่ยวกับวิธีการที่ดี/ไม่ดี
- [ชุดข้อมูลการประเมิน](/docs/eval/datasets) — รูปแบบชุดข้อมูล, EDTeKLA, FLORES+
- [ข้อกำหนดของ Run Card](/docs/eval/run-card) — โครงสร้าง JSON แบบเต็ม
- [การสร้างวิธีการ](/docs/eval/methods) — อินเทอร์เฟซวิธีการสำหรับสร้างวิธีการที่สามารถประเมินได้
- [Method Leaderboard](/leaderboard) — คะแนน benchmark แบบเรียลไทม์