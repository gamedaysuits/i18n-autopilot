---
sidebar_position: 1
slug: /
title: "บทนำ"
---
# i18n-rosetta

เฟรมเวิร์ก internationalization ที่ปรับแต่งได้อย่างเต็มรูปแบบ เพียงคำสั่งเดียวก็สามารถแปลไฟล์ locale ของคุณได้ การตั้งค่าเพียงครั้งเดียวควบคุมได้ทุก method, model และคู่ภาษา และหาก method ที่มีให้ยังไม่เพียงพอ — คุณสามารถสร้างขึ้นเอง พิสูจน์ว่ามันใช้งานได้จริง และนำไปใช้งาน (deploy) ได้เลย

```bash
npx i18n-rosetta sync
```

rosetta จะตรวจหาไฟล์ locale, รูปแบบไฟล์ และภาษาปลายทางของคุณโดยอัตโนมัติ มันจะแปลส่วนที่ขาดหายไป ข้ามส่วนที่ทำเสร็จแล้ว ตรวจสอบความถูกต้องของทุกผลลัพธ์ และเขียนผลลัพธ์ออกมาอย่างเป็นระเบียบ นั่นเป็นเพียงแค่จุดเริ่มต้นเท่านั้น

---

## ทำไมไม่เขียนสคริปต์เองล่ะ?

คุณสามารถเขียนลูปง่ายๆ เพื่อเรียกใช้ Google Translate ในแต่ละคีย์ได้ นักพัฒนาส่วนใหญ่ก็ทำเช่นนั้น — ซึ่งใช้โค้ดประมาณ 30 บรรทัด แต่นี่คือจุดที่มันมักจะมีปัญหา:

- **ไม่มีการตรวจจับการเปลี่ยนแปลง (No change detection)** หากคุณอัปเดตข้อความภาษาอังกฤษ — คำแปลเดิมก็จะค้างอยู่อย่างนั้นตลอดไป rosetta จะติดตามทุกค่าต้นทางด้วย SHA-256 hashes และจะแปลใหม่เฉพาะส่วนที่มีการเปลี่ยนแปลงเท่านั้น
- **ไม่มีการจัดกลุ่ม (No batching)** การเรียก API หนึ่งครั้งต่อหนึ่งคีย์ หมายความว่า 200 คีย์ = 200 round trips แต่ rosetta จะจัดกลุ่มอย่างชาญฉลาด (สามารถตั้งค่าได้ ค่าเริ่มต้นคือ 30 คีย์/กลุ่มสำหรับ LLM และ 128 สำหรับ Google)
- **ไม่มีการควบคุมคุณภาพ (No quality gate)** Machine translation อาจเกิดอาการหลอน (hallucinates) ส่งข้อความต้นทางกลับมา หรือแสดงผลลัพธ์ผิดสคริปต์ภาษา rosetta จะตรวจสอบความถูกต้องของทุกคำแปลก่อนทำการเขียน — การใช้สคริปต์ผิด ความยาวที่มากเกินไป และการส่งข้อความต้นทางกลับมา จะถูกตรวจจับและปฏิเสธ
- **ไม่รองรับหลากหลายรูปแบบ (No format awareness)** ถูกฮาร์ดโค้ดไว้แค่ JSON ใช่ไหม? rosetta สามารถจัดการได้ทั้ง JSON, TOML, YAML และ Hugo Markdown (frontmatter + body) พร้อมระบบตรวจจับอัตโนมัติ
- **ไม่มีการควบคุม method (No method control)** ทุกคู่ภาษาใช้ method เดียวกันหมด แต่ rosetta ให้คุณใช้ Google Translate สำหรับภาษาฝรั่งเศส ใช้ LLM สำหรับภาษาญี่ปุ่น และใช้ custom pipeline ที่โฮสต์โดยคอมมูนิตี้สำหรับภาษา Cree ได้ — ทั้งหมดนี้อยู่ในไฟล์ config เดียวกัน

rosetta คือเวอร์ชัน production ของสคริปต์เหล่านั้น

---

## สิ่งที่ทำให้แตกต่าง

### ทุก method คือ plugin

method การแปลสามารถ **ตั้งค่าได้ตามคู่ภาษา** คุณสามารถผสมผสาน Google Translate, LLMs, coached prompts และ custom APIs ไว้ในโปรเจกต์เดียวกันได้:

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "google-translate" },
    "en:ja": { "method": "llm", "model": "google/gemini-2.5-pro" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

ภาษาฝรั่งเศสใช้ Google Translate (รวดเร็ว ราคาถูก) ภาษาญี่ปุ่นใช้ premium LLM (เก็บรายละเอียดได้ดี) ภาษา Plains Cree ใช้ coached plugin ที่มีกฎไวยากรณ์ พจนานุกรม และการตรวจสอบทางสัณฐานวิทยา (morphological validation) ทั้งหมดนี้ใช้คำสั่ง `sync` เดียวกัน ใช้การควบคุมคุณภาพเดียวกัน และใช้ CLI เดียวกัน

### พิสูจน์ให้เห็น

คุณคิดว่า method ของคุณสามารถแปลภาษาอังกฤษเป็นสเปนได้ไหม? ตุรกีเป็นอาเซอร์ไบจาน? หรืออังกฤษเป็น Cree?

**พิสูจน์สิ** เครื่องมือ [eval harness](https://mtevalarena.org/docs/specifications/harness) ที่มาคู่กันจะทำการ benchmark ทุก translation method ด้วยการให้คะแนนที่สามารถทำซ้ำได้และมีการระบุลายนิ้วมือ (fingerprinted) โดย [leaderboard](/leaderboard) จะติดตามทุกการส่งผลงาน

eval harness และ production CLI ใช้ plugin interface เดียวกัน method ที่ทำคะแนนได้ดีใน harness สามารถนำไปใช้ใน production ได้ — หากคอมมูนิตี้เจ้าของภาษานั้นให้ความยินยอม สำหรับภาษาพื้นเมืองและภาษาที่มีทรัพยากรน้อย (low-resource languages) ความยินยอมนั้นเป็นสิ่งสำคัญ ดูเพิ่มเติมที่ [Data Sovereignty](https://mtevalarena.org/docs/sovereignty/data-sovereignty)

```bash
# Benchmark your method (in the eval harness repo)
cd gds-mt-eval-harness
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json --submit

# Use it locally
npx i18n-rosetta sync
```

ใช้ plugin เดียวกัน เสียบปลั๊กแล้วทดสอบได้เลย

### ชุดเครื่องมือแบบครบวงจร

rosetta ไม่ใช่แค่ `sync` แต่มันคือ i18n pipeline ที่สมบูรณ์แบบ:

| คำสั่ง | หน้าที่ |
|---------|-------------|
| `sync` | แปลคีย์ที่ขาดหายไป คีย์ที่เก่า และ fallback keys |
| `watch` | ซิงค์อัตโนมัติเมื่อไฟล์ต้นทางของคุณมีการเปลี่ยนแปลง |
| `lint` | สแกนซอร์สโค้ดเพื่อหา hardcoded strings |
| `wrap` | ห่อหุ้ม hardcoded strings อัตโนมัติด้วยการเรียก `t()` |
| `audit` | แสดงรายการค่า fallback ของ `[EN]` ที่ยังไม่ได้แปลทั้งหมด |
| `integrity` | ตรวจจับ placeholder ที่เสียหายและปัญหาการเข้ารหัส (encoding) |
| `seo` | สร้าง hreflang tags, sitemaps และ JSON-LD |
| `status` | แสดงการตั้งค่าคู่ภาษา plugins และคะแนน benchmark |
| `provenance` | ตรวจสอบไลเซนส์ของทรัพยากรการแปล |
| `plugin` | ติดตั้ง ลบ และแสดงรายการ method plugins |

สามคำสั่งในนี้ — `lint`, `sync`, `audit` — ประกอบกันเป็น CI pipeline ที่คอยดักจับ hardcoded strings ทำการแปล และจะทำให้การบิลด์ล้มเหลวหากมี locale ใดที่ไม่สมบูรณ์

---

## ลานประลอง

[Method Leaderboard](/leaderboard) คือกระดานคะแนน ทุกการส่งผลงานจะถูกระบุลายนิ้วมือผูกกับ Git commit มีการระบุเวอร์ชันตามชุดข้อมูลเฉพาะ และให้คะแนนด้วย harness เดียวกัน ใครๆ ก็สามารถส่งผลงานได้

**คุณสามารถพิสูจน์อะไรได้บ้าง?** harness รับค่าเป็น JSON ส่วน Plugins ก็รับค่าเป็น JSON ดังนั้น method ใดก็ตามที่สร้างผลลัพธ์เป็น JSON สามารถนำมาทดสอบได้:

| แนวทาง | ตัวอย่าง |
|----------|---------|
| **Coached LLM** | แทรกกฎไวยากรณ์และพจนานุกรมเข้าไปใน prompt ของ frontier model |
| **Fine-tuned model** | เทรน open model ด้วย parallel text — เพียงแต่ต้องไม่ใช่ข้อมูล eval |
| **FST-gated pipeline** | LLM สร้างคำแปล → finite-state transducer ตรวจสอบทางสัณฐานวิทยา → ลองใหม่ |
| **Chained models** | Model A ร่างคำแปล → Model B แก้ไขหลังการแปล → Model C ให้คะแนน |
| **Dictionary + LLM** | บังคับใช้คำศัพท์ที่รู้จากพจนานุกรม และปล่อยให้ LLM จัดการส่วนที่เหลือ |
| **Evolutionary** | สร้างตัวเลือก ให้คะแนน กลายพันธุ์ตัวเลือกที่ดีที่สุด แล้วทำซ้ำ |
| **Partial translation** | แปลตัวอย่างด้วยมือ พิสูจน์ว่า LLM ของคุณทำได้ตรงกัน แล้วแปลส่วนที่เหลืออัตโนมัติ |

Fine-tune โมเดล นำ evolutionary algorithms ไปใช้งาน ทดสอบคำตอบของนักเรียนในข้อสอบภาษา สร้าง lookup tables เชื่อมต่อสามโมเดลเข้าด้วยกัน ตราบใดที่ method ของคุณสร้างผลลัพธ์เป็น JSON ตัว harness ก็จะให้คะแนนและเฟรมเวิร์กก็จะรันมันได้

:::danger กฎเพียงข้อเดียว
**ห้ามเทรนด้วยข้อมูลการประเมิน (evaluation data)** method ใดที่ถูกเปิดเผยต่อชุดข้อมูล benchmark จะถูกตัดสิทธิ์ คุณสามารถ fine-tune ด้วยอะไรก็ได้ที่คุณต้องการ เพียงแต่ต้องไม่ใช่ชุดข้อมูลทดสอบ (test set)
:::

นี่คือคำเชิญแบบเปิดกว้าง หากคุณทำงานกับภาษาที่มีทรัพยากรน้อย — ไม่ว่าจะเป็นในฐานะนักวิจัย สมาชิกคอมมูนิตี้ นักเรียน หรือแค่คนที่ใส่ใจ — ลองสร้าง method รัน harness และคว้าคะแนนสูงสุดไปเลย ปัญหานี้ยังไม่ได้รับการแก้ไข และโครงสร้างพื้นฐานก็พร้อมอยู่ที่นี่แล้ว

**[→ ดู leaderboard](/leaderboard)**

---

## ขั้นตอนต่อไป

**เริ่มต้นใช้งาน:**
- [การติดตั้ง (Installation)](/docs/getting-started/installation) — ติดตั้งเสร็จภายใน 2 นาที
- [เริ่มต้นอย่างรวดเร็ว (Quick Start)](/docs/getting-started/quick-start) — รันการซิงค์ครั้งแรกของคุณ
- [ภาษาที่รองรับ (Supported Languages)](/docs/reference/supported-languages) — สิ่งที่มีให้พร้อมใช้งานทันที

**การปรับแต่งการตั้งค่าของคุณ:**
- [Translation Methods](/docs/guides/translation-methods) — เลือก method ที่เหมาะสมสำหรับแต่ละคู่ภาษา
- [การตั้งค่า (Configuration)](/docs/getting-started/configuration) — ข้อมูลอ้างอิงการตั้งค่าแบบเต็ม
- [Hugo Multilingual Site](/docs/tutorials/hugo-multilingual-site) — การแปลเนื้อหา Markdown

**เจาะลึกยิ่งขึ้น:**
- [Data Sovereignty](https://mtevalarena.org/docs/sovereignty/data-sovereignty) — หลักการ OCAP, CARE และ Māori Data Sovereignty
- [สนับสนุนภาษาที่มีทรัพยากรน้อย (Support a Low-Resource Language)](https://mtevalarena.org/docs/community/low-resource-languages) — ความท้าทายที่เป็นจุดเริ่มต้นของทั้งหมด
- [Cookbook: FST-Gated Pipeline](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — สร้าง decomposition pipeline
- [การประเมิน MT (MT Evaluation)](https://mtevalarena.org/docs/leaderboard/rules) — วิธีการทำงานของ harness และ leaderboard
- [Method Leaderboard](/leaderboard) — คะแนนสดและการส่งผลงาน