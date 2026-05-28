---
sidebar_position: 1
slug: /
title: "บทนำ"
---
# i18n-rosetta

เฟรมเวิร์ก internationalization ที่ปรับแต่งได้อย่างเต็มรูปแบบ เพียงคำสั่งเดียวก็สามารถแปลไฟล์ locale ของคุณได้ การตั้งค่าเพียงครั้งเดียวควบคุมได้ทุก method, model และคู่ภาษา และหาก method ที่มีมาให้ยังไม่เพียงพอ — คุณสามารถสร้างขึ้นเอง พิสูจน์ว่ามันใช้งานได้จริง และนำไปใช้งาน (deploy) ได้เลย

```bash
npx i18n-rosetta sync
```

rosetta จะตรวจหาไฟล์ locale, รูปแบบ และภาษาปลายทางของคุณโดยอัตโนมัติ มันจะแปลส่วนที่ขาดหายไป ข้ามส่วนที่ทำเสร็จแล้ว ตรวจสอบความถูกต้องของทุกผลลัพธ์ และเขียนผลลัพธ์ออกมาอย่างเป็นระเบียบ นั่นเป็นเพียงแค่จุดเริ่มต้นเท่านั้น

---

## ทำไมไม่เขียนสคริปต์เองล่ะ?

คุณอาจจะเขียนลูปง่ายๆ เพื่อเรียกใช้ Google Translate ในแต่ละคีย์ นักพัฒนาส่วนใหญ่ก็ทำแบบนั้น — ใช้โค้ดประมาณ 30 บรรทัด แต่จุดที่มันจะพังมีดังนี้:

- **ไม่มีการตรวจจับการเปลี่ยนแปลง (No change detection)** หากคุณอัปเดตข้อความภาษาอังกฤษ — คำแปลเดิมก็จะค้างอยู่อย่างนั้นตลอดไป rosetta จะติดตามทุกค่าต้นทางด้วยแฮช SHA-256 และแปลใหม่เฉพาะส่วนที่มีการเปลี่ยนแปลงเท่านั้น
- **ไม่มีการจัดกลุ่ม (No batching)** การเรียก API หนึ่งครั้งต่อหนึ่งคีย์ หมายความว่า 200 คีย์ = 200 รอบ rosetta มีการจัดกลุ่มอย่างชาญฉลาด (สามารถตั้งค่าได้ ค่าเริ่มต้นคือ 80 คีย์/กลุ่มสำหรับ LLM และ 128 สำหรับ Google)
- **ไม่มีการแคช (No caching)** ทุกครั้งที่ซิงค์จะแปลใหม่ทั้งหมด Translation Memory ของ rosetta จะแคชคำแปลตามข้อความต้นทาง + locale + method — การรันซิงค์ใหม่หลังจากเปลี่ยนแค่คีย์เดียว จะแปลใหม่เฉพาะคีย์นั้น ไม่ใช่ทั้งไฟล์
- **ไม่มีการควบคุมคุณภาพ (No quality gate)** การแปลด้วยเครื่องอาจเกิดการหลอน (hallucinate) คืนค่าข้อความต้นทางกลับมา หรือแสดงผลผิดสคริปต์ rosetta จะตรวจสอบความถูกต้องของทุกคำแปลก่อนเขียนลงไฟล์ — การใช้สคริปต์ผิด ความยาวที่มากเกินไป และการคืนค่าข้อความต้นทางจะถูกตรวจจับและปฏิเสธ
- **ไม่รองรับหลายรูปแบบ (No format awareness)** ฮาร์ดโค้ดไว้แค่ JSON ใช่ไหม? rosetta จัดการได้ทั้ง JSON, TOML, YAML และ Hugo Markdown (frontmatter + body) พร้อมระบบตรวจจับอัตโนมัติ
- **ไม่มีการควบคุม method (No method control)** ทุกคู่ภาษาใช้ method เดียวกันหมด แต่ rosetta ให้คุณใช้ Google Translate สำหรับภาษาฝรั่งเศส ใช้ LLM สำหรับภาษาญี่ปุ่น และใช้ไปป์ไลน์แบบกำหนดเองที่โฮสต์โดยชุมชนสำหรับภาษา Cree ได้ — ทั้งหมดนี้อยู่ในไฟล์ config เดียวกัน

rosetta คือเวอร์ชัน production ของสคริปต์นั้น

---

## สิ่งที่ทำให้แตกต่าง

### ทุก method คือปลั๊กอิน

method การแปลสามารถ **ตั้งค่าแยกตามคู่ภาษาได้** คุณสามารถผสมผสาน Google Translate, LLM, coached prompt และ API แบบกำหนดเองไว้ในโปรเจกต์เดียวกันได้:

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

ภาษาฝรั่งเศสใช้ Google Translate (รวดเร็ว ราคาถูก) ภาษาญี่ปุ่นใช้ LLM ระดับพรีเมียม (เก็บรายละเอียดได้ดี) ภาษา Plains Cree ใช้ปลั๊กอินแบบ coached ที่มีกฎไวยากรณ์ พจนานุกรม และการตรวจสอบทางสัณฐานวิทยา (morphological validation) ทั้งหมดนี้ใช้คำสั่ง `sync` เดียวกัน มีการควบคุมคุณภาพเหมือนกัน และใช้ CLI เดียวกัน

### พิสูจน์สิ

คิดว่า method ของคุณสามารถแปลภาษาอังกฤษเป็นภาษาสเปนได้ไหม? ภาษาตุรกีเป็นภาษาอาเซอร์ไบจานล่ะ? หรือภาษาอังกฤษเป็นภาษา Cree?

**พิสูจน์สิ** เครื่องมือ [eval harness](https://mtevalarena.org/docs/specifications/harness) ที่มาคู่กันจะทำการวัดประสิทธิภาพ (benchmark) ของ method การแปลใดๆ ด้วยการให้คะแนนที่สามารถทำซ้ำได้และมีการทำลายนิ้วมือ (fingerprinted scoring) ส่วน [leaderboard](/leaderboard) จะติดตามทุกการส่งผลงาน

eval harness และ production CLI ใช้ปลั๊กอินอินเทอร์เฟซเดียวกัน method ที่ได้คะแนนดีใน harness สามารถนำไปใช้ใน production ได้ — หากชุมชนเจ้าของภาษานั้นให้ความยินยอม สำหรับภาษาพื้นเมืองและภาษาที่มีทรัพยากรน้อย (low-resource languages) ความยินยอมนั้นเป็นสิ่งสำคัญ ดูเพิ่มเติมที่ [Data Sovereignty](https://mtevalarena.org/docs/sovereignty/data-sovereignty)

```bash
# Benchmark your method (in the eval harness repo)
cd gds-mt-eval-harness
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json --submit

# Use it locally
npx i18n-rosetta sync
```

ปลั๊กอินเดียวกัน เสียบแล้วทดสอบได้เลย

### ชุดเครื่องมือที่ครบครัน

rosetta ไม่ใช่แค่ `sync` แต่มันคือไปป์ไลน์ i18n ที่สมบูรณ์แบบ:

| คำสั่ง | หน้าที่ |
|---------|-------------|
| `sync` | แปลคีย์ที่ขาดหายและคีย์ที่เก่าแล้ว (พร้อมการตรวจสอบหลังการซิงค์) |
| `watch` | ซิงค์อัตโนมัติเมื่อไฟล์ต้นทางของคุณมีการเปลี่ยนแปลง |
| `lint` | สแกนซอร์สโค้ดเพื่อหาข้อความที่ถูกฮาร์ดโค้ดไว้ |
| `wrap` | ห่อหุ้ม (wrap) ข้อความที่ถูกฮาร์ดโค้ดไว้ในคำสั่ง `t()` โดยอัตโนมัติ |
| `audit` | แสดงรายการเครื่องหมาย fallback `[EN]` ทั้งหมดจากการรันครั้งก่อนหน้า |
| `verify` | ตรวจสอบว่ามีคำแปลอยู่และถูกต้อง (CI gate) |
| `integrity` | ตรวจจับความเสียหายของ placeholder, ปัญหาการเข้ารหัส (encoding) และความสมบูรณ์ของ ICU plural |
| `seo` | สร้างแท็ก hreflang, sitemaps และ JSON-LD schema |
| `status` | แสดงการตั้งค่าคู่ภาษา, ปลั๊กอิน และคะแนน benchmark |
| `provenance` | ตรวจสอบไลเซนส์ของทรัพยากรการแปล |
| `plugin` | ติดตั้ง, ลบ และแสดงรายการปลั๊กอิน method |
| `fonts` | ดาวน์โหลดเว็บฟอนต์สำหรับตัวแปลงสคริปต์ PUA |
| `tm` | จัดการแคช Translation Memory (สถิติ, ล้างแคช, แยกตาม locale) |
| `xliff` | ส่งออก/นำเข้า XLIFF 1.2 สำหรับการตรวจสอบโดยนักแปลมืออาชีพ |

สี่คำสั่งในนี้ — `lint`, `sync`, `verify`, `audit` — จะรวมกันเป็นไปป์ไลน์ CI ที่คอยตรวจจับข้อความที่ถูกฮาร์ดโค้ดไว้ ทำการแปล ตรวจสอบความถูกต้อง และสั่งให้บิลด์ล้มเหลว (fail the build) หากมี locale ใดที่ไม่สมบูรณ์

---

## The Arena

[Method Leaderboard](/leaderboard) คือกระดานคะแนน ทุกการส่งผลงานจะถูกทำลายนิ้วมือ (fingerprinted) ผูกกับ Git commit, ระบุเวอร์ชันกับชุดข้อมูลเฉพาะ และให้คะแนนโดยใช้ harness เดียวกัน ใครๆ ก็สามารถส่งผลงานได้

**คุณสามารถพิสูจน์อะไรได้บ้าง?** harness รับค่าเป็น JSON ปลั๊กอินรับค่าเป็น JSON ดังนั้น method ใดก็ตามที่สร้างผลลัพธ์เป็น JSON สามารถนำมาทดสอบได้:

| แนวทาง | ตัวอย่าง |
|----------|---------|
| **Coached LLM** | แทรกกฎไวยากรณ์และพจนานุกรมลงใน prompt ของ frontier model |
| **Fine-tuned model** | เทรน open model ด้วย parallel text — แค่ต้องไม่ใช่ข้อมูลที่ใช้ประเมิน (eval data) |
| **FST-gated pipeline** | LLM สร้างข้อความ → finite-state transducer ตรวจสอบทางสัณฐานวิทยา → ลองใหม่ |
| **Chained models** | โมเดล A ร่างคำแปล → โมเดล B ปรับแก้ (post-edit) → โมเดล C ให้คะแนน |
| **Dictionary + LLM** | บังคับใช้คำศัพท์ที่รู้จากพจนานุกรม แล้วปล่อยให้ LLM จัดการส่วนที่เหลือ |
| **Evolutionary** | สร้างตัวเลือก (candidates), ให้คะแนน, กลายพันธุ์ (mutate) ตัวที่ดีที่สุด, ทำซ้ำ |
| **Partial translation** | แปลตัวอย่างด้วยมือ, พิสูจน์ว่า LLM ของคุณทำได้ตรงกัน, แล้วแปลส่วนที่เหลืออัตโนมัติ |

จะ Fine-tune โมเดล, นำอัลกอริทึม evolutionary มาใช้, ทดสอบคำตอบของนักเรียนในข้อสอบภาษา, สร้าง lookup tables หรือเชื่อมโยงสามโมเดลเข้าด้วยกัน ตราบใดที่ method ของคุณสร้างผลลัพธ์เป็น JSON ตัว harness ก็จะให้คะแนน และเฟรมเวิร์กก็จะรันมันได้

:::danger กฎเพียงข้อเดียว
**ห้ามเทรนด้วยข้อมูลที่ใช้ประเมิน (evaluation data)** method ใดที่เคยสัมผัสกับชุดข้อมูล benchmark จะถูกตัดสิทธิ์ คุณสามารถ fine-tune ด้วยอะไรก็ได้ที่คุณต้องการ แค่ต้องไม่ใช่ชุดข้อมูลทดสอบ (test set)
:::

นี่คือคำเชิญแบบเปิดกว้าง หากคุณทำงานกับภาษาที่มีทรัพยากรน้อย (low-resource language) — ไม่ว่าจะเป็นในฐานะนักวิจัย สมาชิกในชุมชน นักเรียน หรือแค่คนที่ใส่ใจ — ลองสร้าง method ขึ้นมา รัน harness และคว้าคะแนนสูงสุดไปเลย ปัญหานี้ยังไม่มีใครแก้ได้สำเร็จ และโครงสร้างพื้นฐานก็พร้อมอยู่ที่นี่แล้ว

**[→ ดู leaderboard](/leaderboard)**

---

## ขั้นตอนต่อไป

**เริ่มต้นใช้งาน:**
- [การติดตั้ง (Installation)](/docs/getting-started/installation) — ตั้งค่าเสร็จใน 2 นาที
- [เริ่มต้นอย่างรวดเร็ว (Quick Start)](/docs/getting-started/quick-start) — รันการซิงค์ครั้งแรกของคุณ
- [ภาษาที่รองรับ (Supported Languages)](/docs/reference/supported-languages) — สิ่งที่มีให้พร้อมใช้งานทันที

**การปรับแต่งการตั้งค่าของคุณ:**
- [Method การแปล (Translation Methods)](/docs/guides/translation-methods) — เลือก method ที่เหมาะสมสำหรับแต่ละคู่ภาษา
- [Translation Memory](/docs/concepts/translation-memory) — การแคชช่วยคุณประหยัดเงินได้อย่างไร
- [การตั้งค่า (Configuration)](/docs/getting-started/configuration) — ข้อมูลอ้างอิง config ฉบับเต็ม
- [เว็บไซต์หลายภาษาด้วย Hugo (Hugo Multilingual Site)](/docs/tutorials/hugo-multilingual-site) — การแปลเนื้อหา Markdown

**เจาะลึกเพิ่มเติม:**
- [การทำงานร่วมกับนักแปลมืออาชีพ (Working with Professional Translators)](/docs/guides/professional-translators) — เวิร์กโฟลว์การส่งออก/นำเข้า XLIFF
- [อธิปไตยของข้อมูล (Data Sovereignty)](https://mtevalarena.org/docs/sovereignty/data-sovereignty) — หลักการ OCAP, CARE และ Māori Data Sovereignty
- [สนับสนุนภาษาที่มีทรัพยากรน้อย (Support a Low-Resource Language)](https://mtevalarena.org/docs/community/low-resource-languages) — ความท้าทายที่เป็นจุดเริ่มต้นของทั้งหมด
- [Cookbook: FST-Gated Pipeline](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — สร้างไปป์ไลน์แบบ decomposition
- [การประเมิน MT (MT Evaluation)](https://mtevalarena.org/docs/leaderboard/rules) — วิธีการทำงานของ harness และ leaderboard
- [Method Leaderboard](/leaderboard) — คะแนนและการส่งผลงานแบบเรียลไทม์