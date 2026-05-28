---
sidebar_position: 4
title: "ภาษาที่รองรับ"
---
# ภาษาที่รองรับ

rosetta มาพร้อมกับ **Language Cards** — ไฟล์การกำหนดค่าแบบมีโครงสร้างสำหรับ 50 ภาษา แต่ละการ์ดประกอบด้วยพรีเซ็ตระดับภาษา (register presets), ข้อมูลเมตาของระบบความสุภาพ (formality system metadata), แฟล็กการรองรับวิธีการแปล, กฎการจัดรูปแบบตัวอักษร (typography rules) และข้อมูลสคริปต์ คุณสามารถเพิ่มภาษาใดๆ ที่ LLM ของคุณรู้จักได้ด้วยการกำหนดค่าเพียงบรรทัดเดียว — ภาษาเหล่านี้คือภาษาที่ได้รับการคัดสรรและมีระดับภาษาที่พร้อมใช้งานจริง (production-ready)

---

## วิธีการแปล

แต่ละภาษาสามารถใช้วิธีการแปลเหล่านี้ได้อย่างน้อยหนึ่งวิธี:

| ไอคอน | วิธีการ | วิธีการทำงาน | ค่าใช้จ่าย |
|------|--------|-------------|------|
| 🟢 | **Google Translate** | พื้นฐาน Neural MT รองรับ 130+ ภาษา เฉพาะสตริงแบบ Key-value เท่านั้น — ไม่สามารถแปลเนื้อหา Markdown ได้อย่างปลอดภัย | ~$20/1M ตัวอักษร |
| 🔵 | **LLM (OpenRouter)** | ภาษาใดๆ ที่โมเดลรู้จัก ใช้ Prompt ควบคุมระดับภาษา รองรับทั้ง Key-value และเนื้อหา Markdown | แตกต่างกันไปตามโมเดล |
| 🟣 | **LLM-Coached** | LLM + พจนานุกรมไวยากรณ์ + ข้อมูลการสอน (coaching data) ที่แทรกใน Prompt เหมาะที่สุดสำหรับภาษาที่มีความซับซ้อนทางสัณฐานวิทยา | แตกต่างกันไปตามโมเดล |
| 🟠 | **API (Plugin)** | ไปป์ไลน์การแปลที่โฮสต์โดยชุมชน ให้บริการผ่าน HTTP [รองรับ OCAP](https://mtevalarena.org/docs/community/low-resource-languages) | แตกต่างกันไปตามผู้ให้บริการ |

กำหนด `GOOGLE_TRANSLATE_API_KEY` สำหรับ Google Translate หรือ `OPENROUTER_API_KEY` สำหรับวิธี LLM ดูรายละเอียดทั้งหมดได้ที่ [วิธีการแปล](/docs/guides/translation-methods)

---

## ภาษาหลัก

นี่คือภาษา (locales) ที่ได้รับการร้องขอมากที่สุดสำหรับแอปพลิเคชันบนเว็บและมือถือ โดยเรียงลำดับตามคำแนะนำของ rosetta ที่ให้ความสำคัญกับการเข้าถึง (accessibility-first) เป็นอันดับแรก

| ธง | ภาษา | รหัส | Google | LLM | Coached | สคริปต์ | หมายเหตุ |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇸🇦 | Arabic | `ar` | ✅ | ✅ | ✅ | — | RTL. Modern Standard Arabic (فصحى) |
| 🇵🇭 | Filipino (Taglish) | `tl` / `fil` | ✅ | ✅ | ✅ | — | ใช้ `fil` ในการกำหนดค่า Docusaurus โดย rosetta จะจัดการให้ทั้งสองแบบ |
| 🇫🇷 | French | `fr` | ✅ | ✅ | ✅ | — | รูปแบบ Vous รองรับความหลากหลายทางเพศ (Connecté·e) |
| 🇪🇸 | Spanish | `es` | ✅ | ✅ | ✅ | — | ละตินอเมริกากลาง (Neutral Latin American) |
| 🇩🇪 | German | `de` | ✅ | ✅ | ✅ | — | รูปแบบ Sie รองรับความหลากหลายทางเพศ (Benutzer:innen) |
| 🇯🇵 | Japanese | `ja` | ✅ | ✅ | ✅ | — | です/ます สำหรับเนื้อหาหลัก, する สำหรับป้ายกำกับ UI |
| 🇨🇳 | Chinese (Simplified) | `zh` | ✅ | ✅ | ✅ | — | 简体中文 |
| 🇮🇹 | Italian | `it` | ✅ | ✅ | ✅ | — | รูปแบบ Lei |
| 🇧🇷 | Portuguese (BR) | `pt` | ✅ | ✅ | ✅ | — | ภาษาโปรตุเกสแบบบราซิล |
| 🇰🇷 | Korean | `ko` | ✅ | ✅ | ✅ | — | ระดับภาษาสุภาพ 해요체 |

## ภาษาหลักของโลก

| ธง | ภาษา | รหัส | Google | LLM | Coached | สคริปต์ | หมายเหตุ |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇧🇩 | Bengali | `bn` | ✅ | ✅ | ✅ | — | นิยมใช้ শুদ্ধ ভাষা |
| 🇧🇬 | Bulgarian | `bg` | ✅ | ✅ | ✅ | — | |
| 🇨🇿 | Czech | `cs` | ✅ | ✅ | ✅ | — | Vykání (รูปแบบ vy) |
| 🇩🇰 | Danish | `da` | ✅ | ✅ | ✅ | — | |
| 🇬🇷 | Greek | `el` | ✅ | ✅ | ✅ | — | Modern Δημοτική |
| 🇮🇷 | Persian | `fa` | ✅ | ✅ | ✅ | — | RTL |
| 🇫🇮 | Finnish | `fi` | ✅ | ✅ | ✅ | — | ไม่มีเพศทางไวยากรณ์ |
| 🇮🇱 | Hebrew | `he` | ✅ | ✅ | ✅ | — | RTL |
| 🇮🇳 | Hindi | `hi` | ✅ | ✅ | ✅ | — | शुद्ध हिन्दी ใช้คำยืมภาษาอังกฤษน้อยที่สุด |
| 🇭🇺 | Hungarian | `hu` | ✅ | ✅ | ✅ | — | รูปแบบ Ön |
| 🇮🇩 | Indonesian | `id` | ✅ | ✅ | ✅ | — | |
| 🇲🇾 | Malay | `ms` | ✅ | ✅ | ✅ | — | |
| 🇳🇱 | Dutch | `nl` | ✅ | ✅ | ✅ | — | รูปแบบ U |
| 🇳🇴 | Norwegian | `nb` | ✅ | ✅ | ✅ | — | Bokmål |
| 🇵🇱 | Polish | `pl` | ✅ | ✅ | ✅ | — | รูปแบบ Pan/Pani |
| 🇵🇹 | Portuguese (EU) | `pt-PT` | ✅ | ✅ | ✅ | — | ภาษาโปรตุเกสแบบยุโรป |
| 🇷🇴 | Romanian | `ro` | ✅ | ✅ | ✅ | — | |
| 🇷🇺 | Russian | `ru` | ✅ | ✅ | ✅ | — | รูปแบบ Вы |
| 🇸🇰 | Slovak | `sk` | ✅ | ✅ | ✅ | — | Vykanie (รูปแบบ vy) |
| 🇷🇸 | Serbian | `sr` | ✅ | ✅ | ✅ | 🔤 Latin→Cyrillic | ตัวแปลงสคริปต์แบบ Deterministic |
| 🇸🇪 | Swedish | `sv` | ✅ | ✅ | ✅ | — | |
| 🇰🇪 | Swahili | `sw` | ✅ | ✅ | ✅ | — | |
| 🇹🇭 | Thai | `th` | ✅ | ✅ | ✅ | — | คำลงท้ายสุภาพ ครับ/ค่ะ |
| 🇹🇷 | Turkish | `tr` | ✅ | ✅ | ✅ | — | รูปแบบ Siz |
| 🇺🇦 | Ukrainian | `uk` | ✅ | ✅ | ✅ | — | รูปแบบ Ви |
| 🇵🇰 | Urdu | `ur` | ✅ | ✅ | ✅ | — | RTL รูปแบบ آپ |
| 🇻🇳 | Vietnamese | `vi` | ✅ | ✅ | ✅ | — | |
| 🇹🇼 | Chinese (Traditional) | `zh-TW` | ✅ | ✅ | ✅ | — | 繁體中文 |
| 🇬🇪 | Georgian | `ka` | ✅ | ✅ | — | — | ქართული ตระกูลภาษา Kartvelian |
| 🇳🇬 | Yoruba | `yo` | ✅ | ✅ | — | — | Èdè Yorùbá ภาษาวรรณยุกต์ (3 เสียง) |

## ภาษาถิ่น

| ธง | ภาษา | รหัส | Google | LLM | Coached | สคริปต์ | หมายเหตุ |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇲🇽 | Mexican Spanish | `es-MX` | ✅ | ✅ | ✅ | — | รูปแบบ Tú ระดับภาษาเป็นกันเอง |
| 🇨🇦 | Canadian French | `fr-CA` | ✅ | ✅ | ✅ | — | สำนวน Québécois |

---

## ภาษาพื้นเมืองและภาษาที่มีทรัพยากรน้อย

ภาษาเหล่านี้ไม่ได้รับการรองรับโดยบริการ MT เชิงพาณิชย์ rosetta มีเครื่องมือสำหรับชุมชนภาษาในการสร้างวิธีการแปลของตนเองภายใต้ [หลักการ OCAP](https://mtevalarena.org/docs/community/low-resource-languages)

| | ภาษา | รหัส | Google | LLM | Coached | สคริปต์ | สถานะ |
|---|----------|------|:------:|:---:|:-------:|--------|--------|
| 🪶 | Plains Cree | `crk` | ❌ | ✅ | ✅ | 🔤 SRO→Syllabics | 🚧 อยู่ระหว่างการพัฒนา |
| 🌄 | Quechua | `qu` | ✅ | ✅ | — | — | Runasimi ปัจจัยแสดงประจักษ์พยาน (Evidential suffixes) |

:::info Plains Cree อยู่ระหว่างการพัฒนาอย่างต่อเนื่อง
ระดับภาษา, โครงสร้างพื้นฐานการสอน (coaching infrastructure), ตัวแปลงสคริปต์ และชุดทดสอบประเมินผลสำหรับ Plains Cree สามารถใช้งานได้แล้ว แต่ไปป์ไลน์การแปล **ยังไม่เปิดตัว** เรากำลังทำงานร่วมกับชุมชนภาษาภายใต้ [หลักการ OCAP](https://mtevalarena.org/docs/community/low-resource-languages) เพื่อให้มั่นใจในคุณภาพก่อนการเปิดตัว ดูรายละเอียดทั้งหมดได้ที่ [สนับสนุนภาษาที่มีทรัพยากรน้อย](https://mtevalarena.org/docs/community/low-resource-languages) — และวิธีที่คุณสามารถมีส่วนร่วม
:::

:::tip การเพิ่มภาษาที่มีทรัพยากรน้อยเพิ่มเติม
ระบบปลั๊กอินวิธีการแปลของ rosetta ได้รับการออกแบบมาเพื่อสิ่งนี้ ชุมชนภาษาสามารถสร้างวิธีการแปลแบบกำหนดเอง โฮสต์ไว้ภายใต้การควบคุมของตนเอง และให้บริการผ่าน [วิธี API](/docs/guides/serving-a-method) ได้ [Method Leaderboard](/leaderboard) จะติดตามคะแนนสำหรับคู่ภาษาใดๆ — สร้างวิธีการแปล รันชุดทดสอบ และคว้าคะแนนสูงสุด
:::

---

## ภาษาประดิษฐ์

ภาษาประดิษฐ์ (Conlangs) ได้รับการรองรับผ่านระดับภาษาของ LLM และตัวแปลงสคริปต์ที่เป็นตัวเลือกเสริม ภาษาเหล่านี้ใช้โครงสร้างพื้นฐานเดียวกับภาษาจริง — ทั้งเกณฑ์คุณภาพ (quality gate), ระบบการสอน (coaching system) และไปป์ไลน์การแปลงสคริปต์ทำงานเหมือนกันทุกประการ

| | ภาษา | รหัส | Google | LLM | สคริปต์ | หมายเหตุ |
|---|----------|------|:------:|:---:|--------|-------|
| 🖖 | Klingon | `tlh` | ❌ | ✅ | 🔤 Romanization→pIqaD | ต้องใช้ฟอนต์ PUA คำศัพท์ของ Marc Okrand |
| 🧝 | Sindarin (Tolkien Elvish) | `x-elvish-s` | ❌ | ✅ | 🔤 Latin→Tengwar | ต้องใช้ฟอนต์ CSUR PUA |
| 🏴‍☠️ | Pirate English | `x-pirate` | ❌ | ✅ | — | เฉพาะระดับภาษาเท่านั้น คำอุปมาเกี่ยวกับการเดินเรือ |
| 🦸 | Kryptonian | `x-kryptonian` | ❌ | ✅ | 🔤 Latin→Kryptonian | ต้องใช้ฟอนต์ PUA |
| 🎭 | Shakespearean English | `x-shakespeare` | ❌ | ✅ | — | เฉพาะระดับภาษาเท่านั้น รูปแบบ Thee/thou, -eth/-est |
| 🐸 | Yoda-speak | `x-yoda` | ❌ | ✅ | — | เฉพาะระดับภาษาเท่านั้น ลำดับคำแบบ OSV |

ดู [ภาษาประดิษฐ์ สคริปต์ และอักขรวิธี](/docs/guides/conlangs-scripts-orthography) สำหรับข้อกำหนดของฟอนต์ PUA, ข้อจำกัดของ Unicode และวิธีเพิ่มภาษาของคุณเอง

---

## พรีเซ็ตภาษา

วิซาร์ด `init` รองรับชื่อพรีเซ็ตสำหรับการตั้งค่าอย่างรวดเร็ว คุณสามารถผสมพรีเซ็ตกับรหัสภาษาแต่ละตัวได้

| พรีเซ็ต | ขยายเป็น |
|--------|-----------|
| `european` | fr, de, es, it, pt, nl |
| `asian` | ja, zh, ko |
| `global` | fr, es, de, ja, zh, ko, pt, ar |
| `nordic` | da, fi, nb, sv |

```bash
# Mix presets with individual codes
i18n-rosetta init
# → Target languages: european, ja
# → Resolves to: fr, de, es, it, pt, nl, ja
```

---

## การเพิ่มภาษาใดๆ

rosetta สามารถแปลเป็น **ภาษาใดๆ ที่ LLM ของคุณรู้จัก** — ตารางด้านบนเป็นเพียงรายการภาษาที่มีพรีเซ็ตระดับภาษาในตัว หากต้องการเพิ่มภาษาที่ไม่อยู่ในรายการ ให้ใส่รหัส BCP-47 ในการกำหนดค่าของคุณ:

```json
{
  "languages": {
    "sw": {},
    "am": {
      "register": "Formal Amharic. Professional register with Geʽez script."
    }
  }
}
```

LLM จะแปลโดยใช้ความรู้ที่ได้รับการฝึกฝนมาสำหรับภาษานั้นๆ การตั้งค่า `register` จะช่วยให้คุณสามารถควบคุมน้ำเสียง ความสุภาพ และรูปแบบอักขรวิธีได้ ดูรายละเอียดที่ [การกำหนดค่า](/docs/getting-started/configuration)

---

## Language Cards

แต่ละภาษาที่มีมาให้ในตัวจะมี **Language Card** — การกำหนดค่า JSON แบบมีโครงสร้างที่แบ่งออกเป็นสองระดับ (tiers) เพื่อประสิทธิภาพ:

### สถาปัตยกรรมแบบสองระดับ

| ระดับ | ไดเรกทอรี | การโหลด | วัตถุประสงค์ |
|------|-----------|--------|--------|
| **Runtime** | `lib/data/language-cards/` | โหลดทันทีที่ `import` | เอนจินการแปล: ระดับภาษา, ความสุภาพ, กฎ, การรองรับวิธีการแปล |
| **Reference** | `lib/data/language-reference/` | โหลดเมื่อต้องการ (Lazily) | เอกสารสำหรับนักพัฒนา: ความท้าทายทางภาษาศาสตร์, ข้อมูลสารานุกรม, ทรัพยากร NLP |

ระดับ Runtime จะมีขนาดเล็ก (~2 KB/การ์ด) เพื่อให้การนำเข้า rosetta ไม่ต้องโหลดข้อมูลเอกสารขนาดหลายเมกะไบต์ ระดับ Reference จะพร้อมใช้งานผ่าน `getLanguageReference(code)` สำหรับเครื่องมือต่างๆ, เว็บไซต์ และชุดทดสอบประเมินผล

### ฟิลด์ของการ์ด Runtime

| ฟิลด์ | ข้อมูลที่บรรจุ |
|-------|------------------|
| **`nativeName`** | ชื่อเรียกภาษาของตนเอง (Endonym) ในสคริปต์ของภาษานั้น (เช่น ქართული, Runasimi) |
| **Formality system** | การแบ่งแยกระดับความสุภาพ (T-V distinction), ระดับการพูด, keigo, คำลงท้าย ฯลฯ |
| **Register presets** | พรีเซ็ต Prompt ของ LLM ที่ตั้งชื่อไว้เฉพาะสำหรับลักษณะของภาษานั้นๆ |
| **Method support** | API การแปลใดบ้างที่รองรับภาษานี้ |
| **Gender guidance** | กฎเพศทางไวยากรณ์และเคล็ดลับการเขียนที่ครอบคลุมความหลากหลาย |
| **Script/direction** | รหัสสคริปต์ ISO 15924 และทิศทาง RTL/LTR |
| **Rules** | การจัดรูปแบบตัวอักษร (เครื่องหมายคำพูด, การเว้นวรรค), การใช้ตัวพิมพ์ใหญ่, หมวดหมู่พหูพจน์ |
| **Eval datasets** | เกณฑ์มาตรฐาน (benchmarks) ใดบ้างที่ครอบคลุมภาษานี้ |
| **`glottocode`** | ตัวระบุ Glottolog มาตรฐานสำหรับการอ้างอิงข้าม |
| **`humanReviewed`** | การ์ดนี้ได้รับการตรวจสอบโดยเจ้าของภาษาหรือไม่ |

### ฟิลด์ของการ์ด Reference

| ฟิลด์ | ข้อมูลที่บรรจุ |
|-------|------------------|
| **Linguistic challenges** | ข้อควรระวังเฉพาะของ MT (เช่น evidentiality, เครื่องหมายวรรณยุกต์, การเติมคำติดต่อ) |
| **Encyclopedic** | ตระกูลภาษา, การจัดหมวดหมู่, จำนวนผู้พูด, ภูมิภาค |
| **Resources** | เครื่องมือ NLP, คลังข้อมูลคู่ขนาน (parallel corpora), โมเดลที่ฝึกฝนล่วงหน้า (pre-trained models) |

### การสร้างโครงร่าง Language Card ใหม่

ใช้ตัวสร้าง (generator) เพื่อสร้างโครงร่างทั้งสองระดับจากแหล่งข้อมูลที่เชื่อถือได้ (IANA, CLDR, Glottolog):

```bash
# Preview what would be generated
node scripts/generate-language-card.mjs sw --dry-run

# Generate both runtime + reference cards
node scripts/generate-language-card.mjs sw
```

ตัวสร้างจะเติมข้อมูลเมตาอัตโนมัติ (รหัส, สคริปต์, ทิศทาง, พหูพจน์, เครื่องหมายคำพูด, การรองรับวิธีการแปล, ตระกูลภาษา) และทำเครื่องหมายฟิลด์ที่ต้องใช้การพิจารณาทางภาษาศาสตร์เป็น TODO เพื่อให้มนุษย์เป็นผู้คัดสรร

### การใช้คีย์พรีเซ็ต

แทนที่จะเขียนข้อความระดับภาษาแบบเต็ม คุณสามารถใช้ชื่อคีย์พรีเซ็ตได้:

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "polite"
  }
}
```

Rosetta จะแปลงคีย์เป็น Prompt ระดับภาษาแบบเต็ม รัน `npx i18n-rosetta init` เพื่อดูพรีเซ็ตที่มีให้ใช้งานสำหรับแต่ละภาษา

### ตัวอย่างพรีเซ็ต

| ภาษา | พรีเซ็ต | ค่าเริ่มต้น |
|----------|---------|--------|
| French | `formal-vous`, `casual-tu` | `formal-vous` |
| Korean | `polite-haeyo`, `formal-hapsyo`, `casual-hae` | `polite-haeyo` |
| Japanese | `polite`, `formal-keigo`, `casual` | `polite` |
| German | `formal-Sie`, `casual-du` | `formal-Sie` |
| Thai | `neutral-professional`, `polite-male`, `polite-female` | `neutral-professional` |
| Spanish | `neutral-professional`, `formal-usted`, `casual-tuteo` | `neutral-professional` |

ดู [การร่วมสมทบ Language Card](https://github.com/gamedaysuits/i18n-rosetta) สำหรับข้อกำหนดแบบเต็ม รวมถึงการตรวจสอบความถูกต้องของฟิลด์และรายการตรวจสอบ PR

---

## ดูเพิ่มเติม

- [การกำหนดค่า](/docs/getting-started/configuration) — ข้อมูลอ้างอิงการกำหนดค่าแบบเต็ม รวมถึงการตั้งค่าภาษา
- [วิธีการแปล](/docs/guides/translation-methods) — วิธีการทำงานของแต่ละวิธี
- [ตัวแปลงสคริปต์](/docs/concepts/script-converters) — ไปป์ไลน์การแปลงสคริปต์แบบ Deterministic
- [ภาษาประดิษฐ์ สคริปต์ และอักขรวิธี](/docs/guides/conlangs-scripts-orthography) — ฟอนต์ PUA, Unicode, การเพิ่มภาษาประดิษฐ์
- [สนับสนุนภาษาที่มีทรัพยากรน้อย](https://mtevalarena.org/docs/community/low-resource-languages) — การสร้างวิธีการแปลสำหรับภาษาที่ขาดแคลนทรัพยากร