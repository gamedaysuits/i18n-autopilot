---
sidebar_position: 2
title: "แปล 30 ภาษา"
description: "Cookbook: ขยายโปรเจกต์จาก 3 ภาษาเป็น 30 ภาษาด้วยการใช้ per-pair method mixing, batching และ CI integration"
---
# Cookbook: การแปล 30 ภาษา

ขยายโปรเจกต์จากไม่กี่ภาษาให้ครอบคลุมทั่วโลก Cookbook นี้จะพาคุณไปดูการเลือกวิธีการ การเพิ่มประสิทธิภาพต้นทุน และการผสานการทำงานกับ CI สำหรับการปรับใช้หลายภาษาในสถานการณ์จริง

**สถานการณ์จำลอง:** คุณมีแอป SaaS ที่มี `en`, `fr`, `es` คุณต้องการเพิ่มอีก 27 ภาษาโดยแบ่งตามข้อกำหนดด้านคุณภาพสามระดับ

---

## ขั้นตอนที่ 1: จัดหมวดหมู่ภาษาของคุณ

ไม่ใช่ทั้ง 30 ภาษาที่ต้องการวิธีการเดียวกัน จัดกลุ่มภาษาเหล่านี้ตามคุณภาพของวิธีการที่มีให้ใช้งาน:

| ระดับ | ภาษา | วิธีการ | เหตุผล |
|------|-----------|--------|-----|
| **ระดับ 1 — พรีเมียม** | `ja`, `ko`, `zh`, `de`, `pt` | `llm` (GPT-4o) | ตลาดที่มีมูลค่าสูง, ไวยากรณ์มีความซับซ้อน |
| **ระดับ 2 — มาตรฐาน** | `it`, `nl`, `pl`, `sv`, `da`, `fi`, `no`, `cs`, `ro`, `hu`, `el`, `tr`, `id`, `ms`, `th`, `vi`, `uk`, `bg` | `google-translate` | ปริมาณมาก, รองรับโดย Google เป็นอย่างดี |
| **ระดับ 3 — มีการฝึกสอน (Coached)** | `crk`, `oj`, `mi`, `haw` | `llm-coached` + plugins | ทรัพยากรน้อย, ต้องการการบังคับใช้คำศัพท์ |

## ขั้นตอนที่ 2: กำหนดค่าแบบรายคู่ (Per-Pair)

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

**หมายเหตุ:** ภาษาที่ไม่ได้ระบุไว้ใน `pairs` จะสืบทอดค่าจาก `defaultMethod: "google-translate"` คุณไม่จำเป็นต้องระบุให้ครบทั้ง 30 ภาษา

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

ควรดูตัวอย่างก่อนทำการแปล 30 ภาษาเสมอ:

```bash
npx i18n-rosetta sync --dry
```

ตรวจสอบผลลัพธ์ ซึ่งจะแสดง:
- คู่ภาษาใดใช้วิธีการใด
- จำนวนคีย์ใหม่/ที่เปลี่ยนแปลงในแต่ละภาษา
- จำนวนการเรียกใช้ API โดยประมาณในแต่ละระดับ

## ขั้นตอนที่ 5: รันการซิงค์ (Sync)

```bash
npx i18n-rosetta sync
```

Rosetta จะประมวลผลแต่ละคู่ภาษาแยกกัน คู่ภาษาในระดับ 2 ที่ใช้ Google Translate จะมีความรวดเร็ว คู่ภาษาที่ใช้ LLM ในระดับ 1 จะช้ากว่าแต่มีคุณภาพสูงกว่า ส่วนคู่ภาษาที่มีการฝึกสอนในระดับ 3 จะใช้ข้อมูลการฝึกสอนของปลั๊กอิน

### การอัปเดตส่วนเพิ่ม (Incremental Updates)

หลังจากการซิงค์ครั้งแรก การรันครั้งต่อๆ ไปจะแปลเฉพาะคีย์ที่ **เปลี่ยนแปลงหรือมาใหม่** เท่านั้น:

```bash
# Only keys that changed since last sync
npx i18n-rosetta sync
```

ไฟล์ล็อก (`.i18n-rosetta.lock`) จะติดตามสิ่งที่ได้รับการแปลไปแล้ว ดังนั้นคุณจะไม่ต้องแปลเนื้อหาที่คงที่ซ้ำอีก

## ขั้นตอนที่ 6: ตรวจสอบคุณภาพ

ตรวจสอบสถานะของคู่ภาษาทั้งหมด:

```bash
npx i18n-rosetta status
```

คำสั่งนี้จะแสดงตารางที่ระบุวิธีการ โมเดล ระดับคุณภาพของแต่ละคู่ภาษา และแสดงว่ามีข้อมูลการฝึกสอนหรือคะแนนเกณฑ์มาตรฐาน (benchmark scores) ให้ใช้งานหรือไม่

## ขั้นตอนที่ 7: การผสานการทำงานกับ CI

เพิ่มลงในเวิร์กโฟลว์ GitHub Actions ของคุณเพื่อให้คำแปลเป็นปัจจุบันอยู่เสมอในทุกๆ การ push:

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
| ระดับ 1 (5 ภาษา) | ja, ko, zh, de, pt | GPT-4o | ~$2.50/การซิงค์เต็มรูปแบบ |
| ระดับ 2 (18 ภาษา) | it, nl, pl, ฯลฯ | Google Translate | ~$0.90/การซิงค์เต็มรูปแบบ |
| ระดับ 3 (4 ภาษา) | crk, oj, mi, haw | GPT-4o-mini coached | ~$0.40/การซิงค์เต็มรูปแบบ |
| **รวม** | **30 ภาษา** | **ผสม** | **~$3.80/การซิงค์เต็มรูปแบบ** |

การซิงค์ส่วนเพิ่ม (คีย์ที่เปลี่ยนแปลง 5–20 คีย์) จะมีต้นทุนเพียงเศษเสี้ยวของการซิงค์เต็มรูปแบบ

## ดูเพิ่มเติม

- [Translation Methods](/docs/guides/translation-methods) — วิธีการแปลแต่ละแบบทำงานอย่างไรและควรใช้เมื่อใด
- [Plugin Specification](/docs/reference/plugin-spec) — สร้างข้อมูลการฝึกสอนสำหรับภาษาในระดับ 3 ของคุณ
- [CI/CD Guide](/docs/guides/ci-cd) — รูปแบบ CI ขั้นสูง รวมถึงการสร้างพรีวิวสำหรับ PR
- [Quality Gate](/docs/concepts/quality-gate) — วิธีที่ Rosetta ตรวจสอบความถูกต้องของทุกคำแปลก่อนทำการเขียน
- [Supported Languages](/docs/reference/supported-languages) — รายการรหัสภาษาทั้งหมดและความเข้ากันได้ของวิธีการ
- [Support a Low-Resource Language](https://mtevalarena.org/docs/community/low-resource-languages) — เพิ่มข้อมูลการฝึกสอนสำหรับภาษาที่ยังไม่ครอบคลุมในระบบ MT ทั่วไป