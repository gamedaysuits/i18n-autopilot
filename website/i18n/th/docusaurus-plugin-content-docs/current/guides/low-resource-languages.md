---
sidebar_position: 5
title: "สนับสนุนภาษาที่มีทรัพยากรน้อย"
---
# การสนับสนุนภาษาที่มีทรัพยากรน้อย

:::info สถานะ: กำลังอยู่ระหว่างการพัฒนา
การรองรับภาษา Plains Cree (nêhiyawêwin) กำลังอยู่ระหว่างการพัฒนา เครื่องมือ, evaluation harness และ leaderboard ที่อธิบายไว้ที่นี่เป็นของจริงและสามารถใช้งานได้แล้วในปัจจุบัน แต่ pipeline การแปลภาษา Cree ยังไม่ได้เปิดตัว เมื่อเปิดตัวแล้ว สิ่งนี้จะเป็นต้นแบบสำหรับภาษา polysynthetic และภาษาที่มีทรัพยากรน้อยอื่นๆ ที่มีโครงสร้างพื้นฐาน FST
:::

## ปัญหาที่ยังไม่ได้รับการแก้ไข

Google Translate รองรับประมาณ 130 ภาษา แต่มีภาษาที่ใช้พูดกันบนโลกมากกว่า 7,000 ภาษา สำหรับภาษาหลายพันภาษา — รวมถึงภาษาพื้นเมือง (Indigenous languages) หลายภาษาที่มีชุมชนผู้พูดใช้งานอยู่ — ไม่มี API การแปลเชิงพาณิชย์, ไม่มีการรวบรวม parallel corpus ขนาดใหญ่ และไม่มี pretrained model ใดที่ให้ผลลัพธ์ที่เชื่อถือได้

นี่ไม่ใช่ช่องโหว่ที่จะปิดลงได้เอง ภาษาที่มีทรัพยากรน้อยมีทรัพยากรน้อย *เพราะ* ระบบเศรษฐกิจของ MT เชิงพาณิชย์เข้าไม่ถึง ผู้พูดที่ต้องการเครื่องมือเหล่านี้มากที่สุดคือชุมชนกลุ่มเดียวกันที่มีโอกาสน้อยที่สุดที่จะมีคนสร้างเครื่องมือเหล่านี้ให้

**rosetta ถูกสร้างขึ้นมาเพื่อเปลี่ยนแปลงสิ่งนั้น**

[Method Leaderboard](/leaderboard) คือความท้าทายแบบเปิด: สร้าง method การแปลที่ดีที่สุดสำหรับภาษาที่ขาดแคลนทรัพยากร พิสูจน์ด้วยการประเมินที่ทำซ้ำได้ (reproducible evaluation) และคว้าคะแนนสูงสุด ทุกคนบนโลกสามารถมีส่วนร่วมได้ — นักภาษาศาสตร์, นักวิจัย ML, ผู้ทำงานด้านภาษาในชุมชน, นักเรียนนักศึกษา, ผู้ที่ทำเป็นงานอดิเรก ปัญหานี้ยังไม่ได้รับการแก้ไข โครงสร้างพื้นฐานพร้อมแล้ว และ leaderboard กำลังรอคุณอยู่

---

## ทำไมเรื่องนี้ถึงยาก: Polysynthetic Morphology

ระบบ MT เชิงพาณิชย์ส่วนใหญ่ถูกออกแบบมาสำหรับภาษาอย่างภาษาอังกฤษ, ฝรั่งเศส และจีน — ซึ่งเป็นภาษาที่คำค่อนข้างสั้นและประโยคถูกสร้างขึ้นจาก token ที่แยกจากกัน แต่ภาษาพื้นเมืองหลายภาษา รวมถึง Plains Cree เป็นภาษาแบบ **polysynthetic**: คำเพียงคำเดียวสามารถเข้ารหัสความหมายที่ภาษาอังกฤษต้องใช้ทั้งประโยคในการอธิบาย

### ตัวอย่างภาษา Cree

ลองพิจารณาคำในภาษา Plains Cree:

> **ê-kî-nitawi-kîskinwahamâkosiyân**
> *"เมื่อฉันไปโรงเรียน"*

นั่นคือ **คำเพียงคำเดียว** มันเข้ารหัส tense (อดีต), ทิศทาง (กำลังไป), รากศัพท์ (เรียน), voice (passive/reflexive) และบุรุษ (บุรุษที่หนึ่งเอกพจน์) LLM ที่ถูกฝึกด้วยภาษาอังกฤษเป็นหลักจะไม่มีสัญชาตญาณสำหรับความหนาแน่นทางสัณฐานวิทยา (morphological density) ในลักษณะนี้

ความท้าทายที่เพิ่มขึ้น:

| ความท้าทาย | ความหมาย |
|-----------|--------------|
| **Morphological complexity** | รากศัพท์คำกริยาเพียงคำเดียวสามารถสร้างรูปคำที่ผันได้อย่างถูกต้องนับพันรูปแบบผ่านการเติม prefix, suffix และ circumfix |
| **Animate/inanimate distinction** | คำนามมีสถานะเป็นสิ่งมีชีวิต (animate) หรือไม่มีชีวิต (inanimate) ตามหลักไวยากรณ์ — ซึ่งส่งผลต่อการผันคำกริยา, คำสรรพนามชี้เฉพาะ (demonstratives) และการทำเป็นพหูพจน์ การจัดประเภทนี้ไม่ได้เป็นไปตามความเป็นสิ่งมีชีวิตทางชีววิทยาเสมอไป (*askiy* "โลก" เป็น animate; *maskisin* "รองเท้า" ก็เป็น animate เช่นกัน) |
| **Obviation** | การอ้างอิงถึงบุรุษที่สามจะถูกจัดลำดับตามความใกล้ชิด/ความโดดเด่น ความแตกต่างระหว่าง "proximate" และ "obviative" ไม่มีสิ่งที่เทียบเท่าได้ในภาษาอังกฤษ |
| **Sparse training data** | LLM เคยเห็นข้อความภาษา Plains Cree น้อยมาก สิ่งที่พวกมันเคยเห็นอาจผสมผสานระหว่างภาษาถิ่น (Y-dialect, TH-dialect) หรือระบบการเขียน (SRO กับ syllabics) |
| **No commercial baseline** | Google Translate ไม่สามารถให้ผลลัพธ์ที่เป็นประโยชน์ได้ ไม่มี API สำเร็จรูปให้เปรียบเทียบ |

นี่คือเหตุผลที่การแปลภาษา polysynthetic ยังคงเป็น **ปัญหาการวิจัยที่เปิดกว้าง (open research problem)** — และเป็นเหตุผลว่าทำไม leaderboard ที่มีการให้คะแนนและทำซ้ำได้จึงมีความสำคัญ

---

## Prior Art: วิธีที่ผู้คนใช้จัดการกับปัญหานี้

### ALTLab FST

ทรัพยากรทางคอมพิวเตอร์ที่สำคัญที่สุดสำหรับภาษา Plains Cree คือ **finite-state transducer (FST)** ที่พัฒนาโดย [Alberta Language Technology Lab (ALTLab)](https://altlab.artsrn.ualberta.ca/) แห่ง University of Alberta โดยความร่วมมือกับ [Giellatekno](https://giellatekno.uit.no/) แห่ง UiT The Arctic University of Norway

ALTLab FST เป็น **morphological analyzer และ generator**: เมื่อได้รับคำภาษา Cree ที่ผันแล้ว มันสามารถแยกองค์ประกอบออกเป็นรากศัพท์และแท็กไวยากรณ์ได้ และเมื่อได้รับรากศัพท์พร้อมแท็ก มันสามารถสร้างรูปคำที่ผันได้อย่างถูกต้อง สิ่งนี้ทำงานแบบ deterministic — ไม่มี neural network, ไม่มี hallucination, ไม่มีความน่าจะเป็น หาก FST ยอมรับคำใด คำนั้นจะมีความถูกต้องตามหลักสัณฐานวิทยา

นี่คือเหตุผลที่ rosetta leaderboard ติดตาม **FST Acceptance Rate** เป็นตัวชี้วัด (metric) method การแปลที่สร้างคำที่ FST ปฏิเสธ ถือว่ากำลังสร้างภาษา Cree ที่ไม่ถูกต้องตามหลักสัณฐานวิทยา — ไม่ว่าคะแนน chrF++ จะเป็นอย่างไรก็ตาม

**ทรัพยากรสำคัญของ ALTLab:**
- [itwêwina](https://itwewina.altlab.app/) — พจนานุกรมอัจฉริยะ Plains Cree–English ที่ขับเคลื่อนด้วย FST
- [Morphodict](https://github.com/UAlbertaALTLab/morphodict) — แพลตฟอร์มพจนานุกรม open-source ที่รองรับหลักสัณฐานวิทยา
- [crk-db](https://github.com/UAlbertaALTLab/crk-db) — ฐานข้อมูลคำศัพท์ภาษา Plains Cree
- [21st Century Tools for Indigenous Languages](https://21c.tools/) — บริบทของโครงการในภาพกว้าง

### Global FST & Morphological Registries

Plains Cree ไม่ใช่ภาษาเดียวที่มีโครงสร้างพื้นฐาน FST คุณภาพสูง หากคุณต้องการพัฒนา pipeline การแปลสำหรับภาษาที่มีทรัพยากรน้อยหรือมีความซับซ้อนทางสัณฐานวิทยาอื่นๆ คุณสามารถใช้ประโยชน์จากศูนย์กลางระดับโลกที่จัดตั้งขึ้นเหล่านี้ได้:

* **[GiellaLT / Giellatekno](https://giellalt.github.io/) (UiT The Arctic University of Norway):** คลังเก็บ open-source FST morphological analyzers และ generators ที่ใหญ่ที่สุด ครอบคลุมกว่า 100 ภาษา พื้นที่โฟกัสได้แก่ กลุ่มภาษา Sámi (`sme`, `smj`, `sma` ฯลฯ), กลุ่มภาษา Uralic (Komi, Erzya, Udmurt ฯลฯ) และภาษาชนกลุ่มน้อย/ภาษาพื้นเมืองอื่นๆ พวกเขาโฮสต์ public processed text corpora (`corpus-xxx`) ไว้ใน [GitHub Organization](https://github.com/giellalt/) ของพวกเขา
* **[The Apertium Project](https://www.apertium.org/):** แพลตฟอร์ม rule-based machine translation แบบ open-source Apertium ดูแลรักษา FST morphological analyzers ที่ได้รับการปรับแต่งมาอย่างดี (ใช้ `lttoolbox` และ `hfst`) และพจนานุกรมสองภาษาสำหรับหลายสิบภาษา รวมถึงกลุ่มภาษา Turkic ชุดใหญ่ (Kazakh, Tatar, Kyrgyz ฯลฯ) และภาษาชนกลุ่มน้อยในยุโรป ทรัพยากรทั้งหมดเป็นสาธารณะบน [Apertium's GitHub](https://github.com/apertium)
* **[UniMorph (Universal Morphology)](https://unimorph.github.io/):** โครงการความร่วมมือที่จัดเตรียม morphological paradigms มาตรฐานสำหรับกว่า 150 ภาษา ชุดข้อมูลถูกโฮสต์บน Hugging Face ที่ [unimorph/universal_morphologies](https://huggingface.co/datasets/unimorph/universal_morphologies) หากไม่มี compiled FST binary สำหรับภาษาใดภาษาหนึ่ง สามารถใช้ตาราง UniMorph เป็น static database lookup gate ได้
* **[National Research Council Canada (NRC)](https://nrc-digital-repository.canada.ca/):** นำเสนอเครื่องมือสำหรับภาษาพื้นเมืองของแคนาดา รวมถึง **Uqailaut** Inuktitut FST morphological analyzer และ **Nunavut Hansard Parallel Corpus** ขนาดใหญ่ (คู่ประโยคภาษาอังกฤษ-Inuktitut ที่จัดตำแหน่งแล้ว 1.3 ล้านคู่)

### EdTeKLA Corpus

[กลุ่มวิจัย EdTeKLA](https://spaces.facsci.ualberta.ca/edtekla/) (ที่ UAlberta เช่นกัน) ได้รวบรวม corpus ภาษา Plains Cree จากสื่อการสอน, การถอดเสียงออดิโอ และแหล่งข้อมูลในชุมชน ชุดข้อมูลการประเมินของ rosetta [EDTeKLA Dev v1](/docs/eval/datasets) ได้มาจากผลงานนี้ ภายใต้ใบอนุญาต [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)

### แนวทางอื่นๆ ที่ผู้คนเคยลองหรือสามารถลองทำได้

Leaderboard นี้ไม่จำกัด method (method-agnostic) นี่คือกลยุทธ์ที่มีการสำรวจหรือเสนอสำหรับ MT ที่มีทรัพยากรน้อย ซึ่งคุณสามารถส่งกลยุทธ์ใดก็ได้เข้าร่วม:

| แนวทาง | วิธีการทำงาน | ข้อดี | ข้อเสีย |
|----------|-------------|------|------|
| **Coached LLM prompting** | แทรกกฎไวยากรณ์, พจนานุกรม และคู่ตัวอย่างลงใน system prompt | ทำซ้ำได้เร็ว, ไม่ต้องเทรน | ขีดจำกัดคุณภาพถูกจำกัดด้วยความรู้พื้นฐานของ LLM |
| **Few-shot prompting** | รวมคำแปลที่ตรวจสอบแล้วเป็น in-context examples | ดีสำหรับสไตล์ที่สม่ำเสมอ | context window มีขนาดเล็ก; ตัวอย่างต้องไม่มาจากข้อมูล eval |
| **FST-gated pipeline** | LLM สร้างคำแปล → FST ตรวจสอบ → ปฏิเสธและลองใหม่หากสัณฐานวิทยาไม่ถูกต้อง | รับประกันความถูกต้องทางสัณฐานวิทยา | ต้องใช้โครงสร้างพื้นฐาน FST; การวนลูป retry เพิ่ม latency และค่าใช้จ่าย |
| **Dictionary lookup + LLM** | บังคับใช้คำศัพท์ที่รู้จักจากพจนานุกรมสองภาษา, ปล่อยให้ LLM จัดการส่วนที่เหลือ | ลด hallucination สำหรับคำศัพท์ที่รู้จัก | ความครอบคลุมของพจนานุกรมมักจะไม่สมบูรณ์เสมอ |
| **Fine-tuned model** | Fine-tune open model (Llama, Mistral) บน parallel text — เพียงแต่ต้องไม่ใช่บนข้อมูล eval | มีศักยภาพที่จะได้คุณภาพสูงสุด | ต้องใช้ parallel corpus (ซึ่งหายาก); มีราคาแพง; เสี่ยงต่อการ overfitting |
| **Chained models** | Model A สร้างคำแปลคร่าวๆ → Model B ทำ post-edits → Model C ให้คะแนน | สามารถรวมจุดแข็งของผู้เชี่ยวชาญเข้าด้วยกันได้ | ซับซ้อน; ช้า; มีราคาแพง |
| **Rule-based + LLM hybrid** | ใช้กฎทางภาษาศาสตร์สำหรับรูปแบบที่รู้จัก, ใช้ LLM สำหรับทุกสิ่งที่เหลือ | แม่นยำในจุดที่ใช้กฎได้ | ต้องใช้ความเชี่ยวชาญทางภาษาศาสตร์อย่างลึกซึ้ง |
| **Back-translation augmentation** | สร้าง synthetic parallel data โดยแปล Cree→English จากนั้นเทรนในทิศทางกลับกัน | ขยายข้อมูลการเทรนได้ในราคาถูก | ขยายข้อผิดพลาดที่มีอยู่ของโมเดลให้ใหญ่ขึ้น |
| **Evolutionary approach** | สร้าง candidate translations, ให้คะแนน, mutate ตัวที่ทำผลงานได้ดีที่สุด, ทำซ้ำ | สามารถค้นพบโซลูชันใหม่ๆ ได้; ทำงานแบบขนาน (parallelizable) ได้ | ใช้ทรัพยากรคอมพิวเตอร์สูง; ต้องการ fitness function ที่ดี |
| **Partial translation** | แปลกลุ่มตัวอย่างที่เป็นตัวแทนด้วยตนเอง, พิสูจน์ว่า method ของคุณตรงกับสไตล์ของคุณบนกลุ่มตัวอย่างนั้น, จากนั้นแปลส่วนที่เหลือทั้งหมดโดยอัตโนมัติ | รวมคุณภาพของมนุษย์เข้ากับสเกลของเครื่องจักร | ต้องใช้ความพยายามของมนุษย์ในตอนเริ่มต้น |
| **Manual JSON / exam grading** | สร้างไฟล์ JSON ของชุดข้อมูลด้วยตนเองเพื่อทดสอบคำตอบของนักเรียนในการสอบภาษา, หรือให้คะแนนชุดการแปลของมนุษย์เทียบกับ gold standard | ไม่ต้องใช้ ML เลย; ใช้ได้กับการศึกษาและ QA | ไม่สามารถสเกลเพื่อรองรับความต้องการในการแปลอย่างต่อเนื่องได้ |

### มันก็แค่ JSON

Harness รับ JSON เข้ามาและให้คะแนนออกมาเป็น JSON [รูปแบบชุดข้อมูล](/docs/eval/datasets) นั้นเรียบง่าย:

```json
{
  "entries": [
    { "index": 0, "source_text": "Hello", "target_expected": "tânisi" },
    { "index": 1, "source_text": "Thank you", "target_expected": "kinanâskomitin" }
  ]
}
```

คุณสามารถสร้างสิ่งนี้ด้วยตนเอง คุณสามารถ export จากสเปรดชีต คุณสามารถสร้างจาก corpus ครูสอนภาษาสามารถใช้เพื่อให้คะแนนการแปลของนักเรียน เอเจนซี่แปลภาษาสามารถใช้เพื่อวัดผลฟรีแลนซ์ ห้องปฏิบัติการวิจัยสามารถใช้เพื่อเปรียบเทียบสถาปัตยกรรมโมเดล Harness ไม่สนใจว่า JSON มาจากไหน — มันแค่ให้คะแนนเท่านั้น

และเนื่องจาก production deployment framework ใช้ plugin interface เดียวกัน method ที่ได้คะแนนดีใน harness จึงสามารถ deploy ไปยังเว็บไซต์ของคุณได้ด้วยการเปลี่ยน config เพียงครั้งเดียว **พิสูจน์และใช้งานมัน**

ความเป็นไปได้นั้นไม่มีที่สิ้นสุดอย่างแท้จริง **หากคุณมีไอเดีย ให้สร้างมันขึ้นมา, รัน harness และส่งคะแนนของคุณ**

---

## rosetta เข้ามามีบทบาทอย่างไร

rosetta จัดเตรียมเลเยอร์โครงสร้างพื้นฐาน — คุณเป็นผู้นำ method มา

### ระบบ Coaching

method `llm-coached` ของ rosetta ช่วยให้คุณสามารถแทรกความรู้ทางภาษาศาสตร์เข้าไปใน LLM prompt ได้โดยตรง:

```json title=".rosetta/coaching/crk.json"
{
  "grammar_rules": [
    "Plains Cree is polysynthetic — a single word can express what English needs a full sentence for",
    "Animate/inanimate noun distinction affects verb conjugation, demonstratives, and pluralization",
    "Use SRO (Standard Roman Orthography) as the working script — syllabic conversion is handled by the deterministic converter",
    "Obviation: when two third-person referents appear, the less salient one takes obviative marking (-a suffix on nouns, -iyiwa on verbs)"
  ],
  "dictionary": {
    "home": "kīwēwin",
    "settings": "isi-nākatohkēwin",
    "search": "nānātawāpahtam",
    "welcome": "tānisi",
    "dashboard": "kīskinwahamākēwin-māsinahikan"
  },
  "style_notes": "Use formal register appropriate for educational and community contexts. Preserve English technical terms in parentheses when no Cree equivalent exists or is widely accepted."
}
```

ข้อมูล coaching จะถูกแทรกเข้าไปใน LLM prompt ทุกตัวสำหรับคู่ `en:crk` ทำให้โมเดลได้รับบริบททางภาษาศาสตร์ที่มีโครงสร้างซึ่งปกติจะไม่มี ดู [Coaching Data](/docs/concepts/coaching-data) สำหรับข้อกำหนดฉบับเต็ม

### Registers

Register เป็นส่วนหนึ่งของ system prompt ที่คอยควบคุมน้ำเสียง, ความเป็นทางการ และธรรมเนียมการสะกดคำ rosetta มาพร้อมกับ register ของภาษา Plains Cree หนึ่งรายการ:

```
nêhiyawêwin (Plains Cree). Use SRO (Standard Roman Orthography) as the working
script. Output will be converted to Syllabics via deterministic converter.
Professional register appropriate for educational and community contexts.
```

คุณสามารถ override สิ่งนี้ใน config ของคุณเพื่อทดลองใช้กลยุทธ์การ prompt ที่แตกต่างกัน:

```json title="i18n-rosetta.config.json"
{
  "languages": {
    "crk": {
      "register": "Casual Plains Cree (Y-dialect). Use SRO. Prefer everyday vocabulary over formal or archaic terms. Address the reader directly."
    }
  }
}
```

Register ที่แตกต่างกันจะสร้างสไตล์การแปลที่แตกต่างกัน — และได้คะแนนบน leaderboard ที่แตกต่างกัน การส่งแต่ละครั้งจะบันทึก register และ system prompt ที่ใช้จริง (ในรูปแบบ SHA-256 hash ใน [run card](/docs/eval/run-card)) ดังนั้นการทดลองจึงสามารถทำซ้ำได้

### การแปลงสคริปต์ (Script conversion)

ภาษา Plains Cree เขียนด้วยสองสคริปต์: **Standard Roman Orthography (SRO)** และ **Canadian Aboriginal Syllabics** pipeline ของ rosetta คือ:

1. LLM แปลเป็น SRO (อิงตามอักษรละติน ซึ่ง LLM จัดการได้ดีกว่า)
2. Quality gate ตรวจสอบความถูกต้องของผลลัพธ์ SRO
3. Deterministic converter แปลง SRO → Syllabics
4. ข้อความที่แปลงแล้วจะถูกเขียนลงดิสก์

Converter จะจัดการกับ SRO diacritics ทั้งหมด (ê, î, ô, â สำหรับสระเสียงยาว) และจับคู่กับตัวอักษร syllabic ที่ถูกต้อง ดู [Script Converters](/docs/concepts/script-converters) สำหรับรายละเอียดทางเทคนิค

### ลูปการประเมิน (The evaluation loop)

[eval harness](/docs/eval/harness) จะรัน method ของคุณกับชุดข้อมูลการประเมินและสร้าง [run card](/docs/eval/run-card) ที่มีคะแนน:

```bash
# Clone the harness
git clone https://github.com/gamedaysuits/gds-mt-eval-harness.git
cd gds-mt-eval-harness
pip install -e .

# Run a baseline experiment
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --model google/gemini-2.5-pro \
  --condition coached-v7

# Run with FST validation (if you have an FST binary)
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --fst-analyzer ./bin/crk-analyzer \
  --condition fst-gated-v1
```

แฟล็ก `--condition` คือป้ายกำกับที่คุณเลือก มันจะปรากฏบน leaderboard เพื่อให้ผู้คนเห็นว่าคุณใช้กลยุทธ์ prompt แบบใด Harness จะบันทึก system prompt แบบเต็มไว้ใน run card ดังนั้นแนวทางที่แน่นอนของคุณจึงสามารถทำซ้ำได้

:::tip ทดลองได้อย่างอิสระ, ส่งผลงานที่ดีที่สุดของคุณ
Harness ถูกออกแบบมาเพื่อการทำซ้ำอย่างรวดเร็ว คุณสามารถรันการทดลองหลายสิบครั้งด้วยโมเดล, ข้อมูล coaching, registers และเงื่อนไขที่แตกต่างกัน ส่งไปยัง leaderboard เฉพาะเมื่อคุณมีสิ่งที่คุณภูมิใจเท่านั้น
:::

---

## หลักการ OCAP

rosetta ถูกออกแบบมาเพื่อสนับสนุนอธิปไตยของข้อมูลพื้นเมือง (Indigenous data sovereignty) [หลักการ OCAP](https://fnigc.ca/ocap-training/) (Ownership, Control, Access, Possession) เป็นแนวทางในการเข้าถึงเทคโนโลยีภาษาสำหรับชุมชนพื้นเมืองของเรา:

| หลักการ | วิธีที่ rosetta สนับสนุน |
|-----------|------------------------|
| **Ownership (ความเป็นเจ้าของ)** | ชุมชนภาษาเป็นเจ้าของข้อมูลทางภาษาของตนเอง rosetta จะไม่ส่งข้อมูลกลับหรือส่งข้อมูลไปยังเซิร์ฟเวอร์ของเรา |
| **Control (การควบคุม)** | [API method](/docs/guides/serving-a-method) ช่วยให้ชุมชนสามารถโฮสต์ pipeline การแปลของตนเองได้ — เราจัดเตรียมอินเทอร์เฟซให้ พวกเขาควบคุมการนำไปใช้งาน |
| **Access (การเข้าถึง)** | ชุมชนเป็นผู้ตัดสินใจว่าใครสามารถใช้ method ของตนได้ API สามารถถูกจำกัดการเข้าถึงผ่านการยืนยันตัวตน (authentication) ได้ |
| **Possession (การครอบครอง)** | ข้อมูลการแปลทั้งหมดจะอยู่ในระบบไฟล์ของโปรเจกต์คุณ [provenance system](/docs/concepts/security) จะติดตามว่าการแปลแต่ละครั้งมาจากไหน |

สถาปัตยกรรมปลั๊กอินหมายความว่าชุมชนสามารถสร้าง method ที่รวมเอาความรู้ศักดิ์สิทธิ์หรือความรู้ที่ถูกจำกัดไว้ภายใน เปิดเผยเฉพาะ API การแปล และรักษาการควบคุมทรัพยากรทางภาษาของตนได้อย่างเต็มที่

---

## วิสัยทัศน์: สิ่งที่จะเกิดขึ้นต่อไป

Plains Cree คือเป้าหมายแรก เมื่อ pipeline ได้รับการตรวจสอบและชุมชนพอใจกับคุณภาพแล้ว สถาปัตยกรรมเดียวกันนี้จะขยายไปยังภาษา polysynthetic อื่นๆ ที่มีโครงสร้างพื้นฐาน FST:

- **กลุ่มภาษา Algonquian อื่นๆ**: Woods Cree, Swampy Cree, Ojibwe, Blackfoot
- **กลุ่มภาษา Inuit**: Inuktitut, Inuinnaqtun (ซึ่งใช้สคริปต์ syllabic เช่นกัน)
- **ตระกูลภาษาอื่นๆ**: ภาษาใดก็ตามที่มี FST analyzer สามารถใช้ FST-gated pipeline ได้

Leaderboard ถูกกำหนดขอบเขตตามคู่ภาษา (language-pair-scoped) เมื่อชุมชนภาษามีส่วนร่วมในการส่งชุดข้อมูลการประเมินใหม่ๆ แทร็ก leaderboard ใหม่ก็จะเปิดขึ้นโดยอัตโนมัติ

**นี่คือคำเชิญแบบเปิด** หากคุณทำงานกับภาษาที่มีทรัพยากรน้อย — ในฐานะนักวิจัย, สมาชิกชุมชน, นักเรียนนักศึกษา หรือแค่คนที่ใส่ใจ — rosetta มอบเครื่องมือให้คุณสร้างสิ่งที่เป็นจริง, วัดผลอย่างซื่อตรง และแบ่งปันกับโลก [Method Leaderboard](/leaderboard) กำลังรอการส่งผลงานของคุณอยู่

---

## ดูเพิ่มเติม

- **[Method Leaderboard](/leaderboard)** — ส่งคะแนนของคุณและดูการเปรียบเทียบ method ต่างๆ
- **[MT Evaluation](/docs/eval/)** — อะไรทำให้ method ออกมาดี, อะไรทำให้ถูกตัดสิทธิ์
- **[Eval Harness](/docs/eval/harness)** — วิธีการรันการทดลอง
- **[Evaluation Datasets](/docs/eval/datasets)** — EDTeKLA Dev v1 และ FLORES+
- **[Coaching Data](/docs/concepts/coaching-data)** — วิธีจัดโครงสร้างความรู้ทางภาษาศาสตร์สำหรับ LLM
- **[Script Converters](/docs/concepts/script-converters)** — pipeline การแปลง SRO→Syllabics
- **[Serving a Method via API](/docs/guides/serving-a-method)** — การโฮสต์การแปลที่ควบคุมโดยชุมชน
- **[ALTLab](https://altlab.artsrn.ualberta.ca/)** — Alberta Language Technology Lab
- **[EdTeKLA](https://spaces.facsci.ualberta.ca/edtekla/)** — กลุ่มวิจัย Educational Technology, Knowledge & Language
- **[itwêwina dictionary](https://itwewina.altlab.app/)** — พจนานุกรม Plains Cree–English ที่ขับเคลื่อนด้วย FST