---
sidebar_position: 1
slug: /
title: "บทนำ"
---
# i18n-rosetta

เฟรมเวิร์ก internationalization ที่ปรับแต่งได้อย่างเต็มรูปแบบ เพียงคำสั่งเดียวก็สามารถแปลไฟล์ locale ของคุณได้ การตั้งค่าเพียงครั้งเดียวควบคุมได้ทุก method, model และคู่ภาษา และหาก method ที่มีมาให้ยังไม่เพียงพอ — คุณสามารถสร้างขึ้นเอง พิสูจน์ว่ามันใช้งานได้จริง และนำไป deploy ได้เลย

```bash
npx i18n-rosetta sync
```

rosetta จะตรวจจับไฟล์ locale, รูปแบบไฟล์ และภาษาเป้าหมายของคุณโดยอัตโนมัติ ระบบจะแปลส่วนที่ขาดหายไป ข้ามส่วนที่ทำเสร็จแล้ว ตรวจสอบความถูกต้องของทุกผลลัพธ์ และเขียน output ออกมาอย่างเป็นระเบียบ นั่นเป็นเพียงแค่จุดเริ่มต้นเท่านั้น

---

## ทำไมไม่เขียนสคริปต์เองล่ะ?

คุณอาจจะเขียนลูปง่ายๆ เพื่อเรียกใช้ Google Translate ในแต่ละ key นักพัฒนาส่วนใหญ่ก็ทำแบบนั้น — ใช้โค้ดประมาณ 30 บรรทัด แต่จุดที่มักจะเกิดปัญหามีดังนี้:

- **ไม่มีการตรวจจับการเปลี่ยนแปลง (No change detection)** หากคุณอัปเดตข้อความภาษาอังกฤษ — คำแปลเดิมก็จะค้างอยู่อย่างนั้นตลอดไป rosetta จะติดตามทุกค่าต้นทางด้วย SHA-256 hashes และแปลใหม่เฉพาะส่วนที่มีการเปลี่ยนแปลงเท่านั้น
- **ไม่มีการจัดกลุ่ม (No batching)** การเรียก API หนึ่งครั้งต่อหนึ่ง key หมายความว่า 200 keys = 200 round trips แต่ rosetta มีการจัดกลุ่มอย่างชาญฉลาด (สามารถตั้งค่าได้ ค่าเริ่มต้นคือ 30 keys/batch สำหรับ LLM และ 128 สำหรับ Google)
- **ไม่มีการแคช (No caching)** ทุกครั้งที่ซิงค์ ระบบจะแปลใหม่ทั้งหมด แต่ Translation Memory ของ rosetta จะแคชคำแปลตามข้อความต้นทาง + locale + method — การรันซิงค์ใหม่หลังจากมีการเปลี่ยนแปลงเพียงหนึ่ง key จะแปลแค่ key นั้นเพียงอย่างเดียว ไม่ใช่ทั้งไฟล์
- **ไม่มีการควบคุมคุณภาพ (No quality gate)** Machine translation อาจเกิดอาการหลอน (hallucinates) คืนค่าข้อความต้นทางกลับมา หรือแสดงผลลัพธ์ผิดสคริปต์ภาษา rosetta จะตรวจสอบความถูกต้องของทุกคำแปลก่อนที่จะเขียนลงไป — การใช้สคริปต์ผิด ความยาวที่มากเกินไป และการคืนค่าข้อความต้นทางจะถูกดักจับและปฏิเสธ
- **ไม่รองรับหลากหลายรูปแบบ (No format awareness)** ถูกฮาร์ดโค้ดไว้แค่ JSON ใช่ไหม? rosetta สามารถจัดการได้ทั้ง JSON, TOML, YAML และ Hugo Markdown (frontmatter + body) พร้อมระบบตรวจจับอัตโนมัติ
- **ไม่มีการควบคุม method (No method control)** ทุกคู่ภาษาใช้ method เดียวกันหมด แต่ rosetta ช่วยให้คุณใช้ Google Translate สำหรับภาษาฝรั่งเศส ใช้ LLM สำหรับภาษาญี่ปุ่น และใช้ custom community-hosted pipeline สำหรับภาษา Cree ได้ — ทั้งหมดนี้อยู่ในไฟล์ config เดียวกัน

rosetta คือเวอร์ชัน production ของสคริปต์เหล่านั้น

---

## สิ่งที่ทำให้แตกต่าง

### ทุก method คือ plugin

translation method สามารถ **ตั้งค่าแยกตามคู่ภาษาได้** คุณสามารถผสมผสานการใช้ Google Translate, LLMs, coached prompts และ custom APIs เข้าด้วยกันในโปรเจกต์เดียว:

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

ภาษาฝรั่งเศสใช้ Google Translate (รวดเร็ว ราคาถูก) ภาษาญี่ปุ่นใช้ premium LLM (เก็บรายละเอียดได้ดี) ภาษา Plains Cree ใช้ coached plugin ที่มีกฎไวยากรณ์ พจนานุกรม และ morphological validation ทั้งหมดนี้ใช้คำสั่ง `sync` เดียวกัน ใช้ quality gate เดียวกัน และใช้ CLI เดียวกัน

### พิสูจน์ให้เห็น

คุณคิดว่า method ของคุณสามารถแปลภาษาอังกฤษเป็นภาษาสเปนได้ไหม? ภาษาตุรกีเป็นภาษาอาเซอร์ไบจานล่ะ? หรือภาษาอังกฤษเป็นภาษา Cree?

**พิสูจน์สิ** เครื่องมือ [eval harness](https://mtevalarena.org/docs/specifications/harness) ที่มาคู่กันจะทำการ benchmark ทุก translation method ด้วยการให้คะแนนที่สามารถทำซ้ำได้และมีลายนิ้วมือดิจิทัล (fingerprinted scoring) ส่วน [leaderboard](/leaderboard) จะติดตามทุกการส่งผลงาน

eval harness และ production CLI ใช้ plugin interface เดียวกัน method ที่ทำคะแนนได้ดีใน harness สามารถนำไปใช้ในระดับ production ได้ — หากชุมชนเจ้าของภาษานั้นๆ ให้ความยินยอม สำหรับภาษาพื้นเมืองและภาษาที่มีทรัพยากรน้อย (low-resource languages) ความยินยอมนั้นเป็นสิ่งสำคัญ ดูเพิ่มเติมที่ [Data Sovereignty](https://mtevalarena.org/docs/sovereignty/data-sovereignty)

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

| คำสั่ง | หน้าที่การทำงาน |
|---------|-------------|
| `sync` | แปล key ที่ขาดหายไป ล้าสมัย และ fallback keys |
| `watch` | ซิงค์อัตโนมัติเมื่อไฟล์ต้นทางของคุณมีการเปลี่ยนแปลง |
| `lint` | สแกนซอร์สโค้ดเพื่อค้นหา hardcoded strings |
| `wrap` | ครอบ hardcoded strings อัตโนมัติด้วยการเรียกใช้ `t()` |
| `audit` | แสดงรายการค่า fallback ของ `[EN]` ที่ยังไม่ได้แปลทั้งหมด |
| `integrity` | ตรวจจับความเสียหายของ placeholder ปัญหาการเข้ารหัส (encoding) และความสมบูรณ์ของ ICU plural |
| `seo` | สร้าง hreflang tags, sitemaps และ JSON-LD schema |
| `status` | แสดงการตั้งค่าคู่ภาษา plugins และคะแนน benchmark |
| `provenance` | ตรวจสอบไลเซนส์ของทรัพยากรการแปล |
| `plugin` | ติดตั้ง ลบ และแสดงรายการ method plugins |
| `fonts` | ดาวน์โหลดเว็บฟอนต์สำหรับ PUA script converters |
| `tm` | จัดการแคชของ Translation Memory (สถิติ ล้างข้อมูล แยกตาม locale) |
| `xliff` | ส่งออก/นำเข้า XLIFF 1.2 สำหรับให้นักแปลมืออาชีพตรวจสอบ |

สามคำสั่งจากรายการนี้ — `lint`, `sync`, `audit` — จะสร้าง CI pipeline ที่ช่วยดักจับ hardcoded strings ทำการแปล และสั่ง fail build หากมี locale ใดที่ไม่สมบูรณ์

---

## The Arena

[Method Leaderboard](/leaderboard) คือกระดานคะแนน ทุกการส่งผลงานจะถูกบันทึกลายนิ้วมือดิจิทัลผูกกับ Git commit มีการระบุเวอร์ชันตามชุดข้อมูลเฉพาะ และให้คะแนนด้วย harness เดียวกัน ใครๆ ก็สามารถส่งผลงานได้

**คุณสามารถพิสูจน์อะไรได้บ้าง?** harness รับข้อมูลเป็น JSON ส่วน Plugins ก็รับข้อมูลเป็น JSON ดังนั้น method ใดก็ตามที่สร้างผลลัพธ์เป็น JSON สามารถนำมาทดสอบได้:

| แนวทาง (Approach) | ตัวอย่าง |
|----------|---------|
| **Coached LLM** | แทรกกฎไวยากรณ์และพจนานุกรมลงใน prompt ของ frontier model |
| **Fine-tuned model** | เทรน open model ด้วย parallel text — แค่ต้องไม่ใช่ข้อมูลที่ใช้ประเมินผล (eval data) |
| **FST-gated pipeline** | LLM สร้างข้อความ → finite-state transducer ตรวจสอบ morphology → ลองใหม่ |
| **Chained models** | Model A ร่างคำแปล → Model B ปรับแก้ (post-edits) → Model C ให้คะแนน |
| **Dictionary + LLM** | บังคับใช้คำศัพท์ที่รู้จากพจนานุกรม แล้วปล่อยให้ LLM จัดการส่วนที่เหลือ |
| **Evolutionary** | สร้างตัวเลือก ให้คะแนน กลายพันธุ์ (mutate) ตัวที่ดีที่สุด แล้วทำซ้ำ |
| **Partial translation** | แปลตัวอย่างด้วยมือ พิสูจน์ว่า LLM ของคุณทำได้ตรงกัน แล้วแปลส่วนที่เหลืออัตโนมัติ |

ไม่ว่าจะเป็นการ Fine-tune models, deploy evolutionary algorithms, ทดสอบคำตอบของนักเรียนในข้อสอบภาษา, สร้าง lookup tables หรือเชื่อมต่อสามโมเดลเข้าด้วยกัน ตราบใดที่ method ของคุณสร้างผลลัพธ์เป็น JSON ตัว harness ก็สามารถให้คะแนนได้ และเฟรมเวิร์กก็สามารถรันมันได้

:::danger กฎเพียงข้อเดียว
**ห้ามเทรนด้วยข้อมูลประเมินผล (evaluation data) เด็ดขาด** method ใดที่เคยสัมผัสกับชุดข้อมูล benchmark จะถูกตัดสิทธิ์ คุณสามารถ fine-tune ด้วยอะไรก็ได้ที่คุณต้องการ เพียงแต่ต้องไม่ใช่ชุดข้อมูลทดสอบ (test set)
:::

นี่คือคำเชิญแบบเปิดกว้าง หากคุณทำงานกับภาษาที่มีทรัพยากรน้อย (low-resource language) — ไม่ว่าจะเป็นในฐานะนักวิจัย สมาชิกในชุมชน นักเรียน หรือแค่คนที่ใส่ใจ — ลองสร้าง method รัน harness และคว้าคะแนนสูงสุดไปเลย ปัญหานี้ยังไม่มีใครแก้ได้สมบูรณ์ และโครงสร้างพื้นฐานก็พร้อมอยู่ที่นี่แล้ว

**[→ ดู leaderboard](/leaderboard)**

---

## ขั้นตอนต่อไป

**เริ่มต้นใช้งาน:**
- [การติดตั้ง (Installation)](/docs/getting-started/installation) — ตั้งค่าเสร็จใน 2 นาที
- [เริ่มต้นอย่างรวดเร็ว (Quick Start)](/docs/getting-started/quick-start) — รันการซิงค์ครั้งแรกของคุณ
- [ภาษาที่รองรับ (Supported Languages)](/docs/reference/supported-languages) — สิ่งที่มีให้ใช้งานตั้งแต่เริ่มต้น

**การปรับแต่งการตั้งค่าของคุณ:**
- [วิธีการแปล (Translation Methods)](/docs/guides/translation-methods) — เลือก method ที่เหมาะสมสำหรับแต่ละคู่ภาษา
- [หน่วยความจำการแปล (Translation Memory)](/docs/concepts/translation-memory) — การแคชช่วยคุณประหยัดเงินได้อย่างไร
- [การตั้งค่า (Configuration)](/docs/getting-started/configuration) — ข้อมูลอ้างอิงการตั้งค่าแบบเต็ม
- [เว็บไซต์หลายภาษาด้วย Hugo (Hugo Multilingual Site)](/docs/tutorials/hugo-multilingual-site) — การแปลเนื้อหา Markdown

**เจาะลึกยิ่งขึ้น:**
- [การทำงานร่วมกับนักแปลมืออาชีพ (Working with Professional Translators)](/docs/guides/professional-translators) — เวิร์กโฟลว์การส่งออก/นำเข้า XLIFF
- [อธิปไตยของข้อมูล (Data Sovereignty)](https://mtevalarena.org/docs/sovereignty/data-sovereignty) — หลักการ OCAP, CARE และ Māori Data Sovereignty
- [สนับสนุนภาษาที่มีทรัพยากรน้อย (Support a Low-Resource Language)](https://mtevalarena.org/docs/community/low-resource-languages) — ความท้าทายที่เป็นจุดเริ่มต้นของทั้งหมด
- [Cookbook: FST-Gated Pipeline](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — สร้าง decomposition pipeline
- [การประเมิน MT (MT Evaluation)](https://mtevalarena.org/docs/leaderboard/rules) — วิธีการทำงานของ harness และ leaderboard
- [Method Leaderboard](/leaderboard) — คะแนนสดและการส่งผลงาน