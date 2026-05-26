---
sidebar_position: 2
title: "แปล 30 ภาษา"
description: "Cookbook: ขยายโปรเจกต์จาก 3 ภาษาเป็น 30 ภาษา ด้วยการผสมผสานวิธีการแบบจับคู่ภาษา, batching และ CI integration"
---
# Cookbook: การแปล 30 ภาษา

ขยายโปรเจกต์จากไม่กี่ภาษาให้ครอบคลุมทั่วโลก Cookbook นี้จะแนะนำขั้นตอนการเลือกวิธีการ การเพิ่มประสิทธิภาพต้นทุน และการผสานการทำงานกับ CI สำหรับการใช้งานหลายภาษาในสถานการณ์จริง

**สถานการณ์สมมติ:** คุณมีแอปพลิเคชัน SaaS ที่มี `en`, `fr`, `es` คุณต้องการเพิ่มอีก 27 ภาษาโดยแบ่งตามข้อกำหนดด้านคุณภาพสามระดับ

---

## ขั้นตอนที่ 1: จัดหมวดหมู่ภาษาของคุณ

ไม่ใช่ทั้ง 30 ภาษาที่ต้องการวิธีการเดียวกัน จัดกลุ่มภาษาเหล่านี้ตามคุณภาพของวิธีการที่มีให้ใช้งาน:

| ระดับ | ภาษา | วิธีการ | เหตุผล |
|------|-----------|--------|-----|
| **Tier 1 — Premium** | `ja`, `ko`, `zh`, `de`, `pt` | `llm` (GPT-4o) | ตลาดที่มีมูลค่าสูง, ไวยากรณ์มีความซับซ้อน |
| **Tier 2 — Standard** | `it`, `nl`, `pl`, `sv`, `da`, `fi`, `no`, `cs`, `ro`, `hu`, `el`, `tr`, `id`, `ms`, `th`, `vi`, `uk`, `bg` | `google-translate` | ปริมาณมาก, รองรับได้ดีโดย Google |
| **Tier 3 — Coached** | `crk`, `oj`, `mi`, `haw` | `llm-coached` + plugins | ทรัพยากรน้อย, ต้องการการบังคับใช้คำศัพท์เฉพาะ |

## ขั้นตอนที่ 2: กำหนดค่าตามคู่ภาษา

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "defaultMethod": "google-translate",
  "model": "google/gemini-3.5-flash",
  "languages": {
    "ja": { "name": "Japanese", "register": "Polite/formal" },
    "ko": { "name": "Korean", "register": "Formal" },
    "zh": { "name": "Simplified Chinese", "register": "Neutral" },
    "de": { "name": "German", "register": "Formal (Sie)" },
    "pt": { "name": "Brazilian Portuguese", "register": "Informal" },
    "crk": { "name": "Plains Cree (SRO)", "register": "Neutral" }
  },
  "pairs": {
    "en:ja": { "method": "llm", "model": "openai/gpt-4o" },
    "en:ko": { "method": "llm", "model": "openai/gpt-4o" },
    "en:zh": { "method": "llm", "model": "openai/gpt-4o" },
    "en:de": { "method": "llm", "model": "openai/gpt-4o" },
    "en:pt": { "method": "llm", "model": "openai/gpt-4o" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

**หมายเหตุ:** ภาษาที่ไม่ได้ระบุไว้ใน `pairs` จะสืบทอดค่าจาก `defaultMethod: "google-translate"` คุณไม่จำเป็นต้องระบุทั้ง 30 ภาษา

:::info
การรองรับ `crk` กำลังอยู่ระหว่างการพัฒนา — ดูสถานะและแนวทางการมีส่วนร่วมได้ที่ [Support a Low-Resource Language](https://mtevalarena.org/docs/community/low-resource-languages)
:::

## ขั้นตอนที่ 3: ตั้งค่า API Keys

คุณจะต้องใช้ API keys ทั้งสองสำหรับการกำหนดค่านี้:

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
export GOOGLE_TRANSLATE_API_KEY="AIza..."
```

## ขั้นตอนที่ 4: ทดสอบการทำงาน (Dry Run) ก่อน

ควรดูตัวอย่างก่อนทำการแปลทั้ง 30 ภาษาเสมอ:

```bash
npx i18n-rosetta sync --dry
```

ตรวจสอบผลลัพธ์ ซึ่งจะแสดง:
- คู่ภาษาใดใช้วิธีการใด
- จำนวนคีย์ใหม่/คีย์ที่มีการเปลี่ยนแปลงในแต่ละภาษา
- จำนวนการเรียกใช้ API โดยประมาณในแต่ละระดับ

## ขั้นตอนที่ 5: รันการซิงค์

```bash
npx i18n-rosetta sync
```

Rosetta จะประมวลผลแต่ละคู่ภาษาแยกกัน คู่ภาษาใน Tier 2 ที่ใช้ Google Translate จะทำงานได้เร็ว คู่ภาษาที่ใช้ LLM ใน Tier 1 จะช้ากว่าแต่มีคุณภาพสูงกว่า คู่ภาษาที่ได้รับการโค้ชใน Tier 3 จะใช้ข้อมูลการโค้ชของปลั๊กอิน

### การอัปเดตส่วนเพิ่ม (Incremental Updates)

หลังจากการซิงค์ครั้งแรก การรันครั้งต่อๆ ไปจะแปลเฉพาะคีย์ที่ **มีการเปลี่ยนแปลงหรือคีย์ใหม่** เท่านั้น:

```bash
# Only keys that changed since last sync
npx i18n-rosetta sync
```

ไฟล์ Lock (`.i18n-rosetta.lock`) จะติดตามสิ่งที่ได้รับการแปลไปแล้ว ดังนั้นคุณจะไม่ต้องแปลเนื้อหาที่คงที่ซ้ำอีก

## ขั้นตอนที่ 6: ตรวจสอบคุณภาพ

ตรวจสอบสถานะของคู่ภาษาทั้งหมด:

```bash
npx i18n-rosetta status
```

คำสั่งนี้จะแสดงตารางที่ระบุวิธีการ โมเดล ระดับคุณภาพของแต่ละคู่ภาษา และแสดงว่ามีข้อมูลการโค้ชหรือคะแนนเกณฑ์มาตรฐาน (Benchmark) ให้ใช้งานหรือไม่

## ขั้นตอนที่ 7: การผสานการทำงานกับ CI

เพิ่มลงในเวิร์กโฟลว์ GitHub Actions ของคุณเพื่อให้คำแปลเป็นปัจจุบันเสมอในทุกๆ การ Push:

```yaml title=".github/workflows/i18n-sync.yml"
name: Sync Translations
on:
  push:
    paths:
      - 'locales/en/**'

jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - name: Sync translations
        run: npx i18n-rosetta sync
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
          GOOGLE_TRANSLATE_API_KEY: ${{ secrets.GOOGLE_TRANSLATE_API_KEY }}

      - name: Commit updated translations
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add locales/
          git diff --staged --quiet || git commit -m "chore(i18n): sync translations"
          git push
```

## การประมาณการต้นทุน

สำหรับโปรเจกต์ที่มีคีย์ต้นทาง 500 คีย์ใน 30 ภาษา:

| ระดับ | ภาษา | วิธีการ | ต้นทุนโดยประมาณ |
|------|-----------|--------|-----------------|
| Tier 1 (5 ภาษา) | ja, ko, zh, de, pt | GPT-4o | ~$2.50/การซิงค์เต็มรูปแบบ |
| Tier 2 (18 ภาษา) | it, nl, pl, ฯลฯ | Google Translate | ~$0.90/การซิงค์เต็มรูปแบบ |
| Tier 3 (4 ภาษา) | crk, oj, mi, haw | GPT-4o-mini coached | ~$0.40/การซิงค์เต็มรูปแบบ |
| **รวม** | **30 ภาษา** | **ผสม** | **~$3.80/การซิงค์เต็มรูปแบบ** |

การซิงค์ส่วนเพิ่ม (คีย์ที่มีการเปลี่ยนแปลง 5–20 คีย์) จะมีค่าใช้จ่ายเพียงเศษเสี้ยวของการซิงค์เต็มรูปแบบ

## ดูเพิ่มเติม

- [Translation Methods](/docs/guides/translation-methods) — วิธีการแปลแต่ละแบบทำงานอย่างไรและควรใช้เมื่อใด
- [Plugin Specification](/docs/reference/plugin-spec) — สร้างข้อมูลการโค้ชสำหรับภาษาใน Tier 3 ของคุณ
- [CI/CD Guide](/docs/guides/ci-cd) — รูปแบบ CI ขั้นสูง รวมถึงการสร้างพรีวิวสำหรับ PR
- [Quality Gate](/docs/concepts/quality-gate) — วิธีที่ Rosetta ตรวจสอบความถูกต้องของทุกคำแปลก่อนที่จะเขียนลงไป
- [Supported Languages](/docs/reference/supported-languages) — รายการรหัสภาษาทั้งหมดและความเข้ากันได้ของวิธีการ
- [Support a Low-Resource Language](https://mtevalarena.org/docs/community/low-resource-languages) — เพิ่มข้อมูลการโค้ชสำหรับภาษาที่ไม่มีการรองรับ MT อย่างครอบคลุม