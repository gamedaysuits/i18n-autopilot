---
sidebar_position: 1
title: "ข้อมูลอ้างอิง CLI"
---
# ข้อมูลอ้างอิง CLI

## คำสั่ง

```
i18n-rosetta init              Interactive setup wizard (--yes for quick defaults)
i18n-rosetta sync              Translate & sync all locale files
i18n-rosetta watch             Auto-sync when the source file changes
i18n-rosetta audit             List all untranslated [EN] fallback values
i18n-rosetta lint              Scan source code for hardcoded strings
i18n-rosetta wrap              Auto-wrap hardcoded strings in t() calls (with undo)
i18n-rosetta seo <sub>         Generate hreflang, sitemap.xml, or JSON-LD schema
i18n-rosetta integrity         Audit locale files for format/encoding issues
i18n-rosetta verify            Verify translations are present and correct (CI gate)
i18n-rosetta status            Show pair configuration, plugins, and quality tiers
i18n-rosetta provenance        Audit translation resource licensing
i18n-rosetta plugin <sub>      Manage method plugins (install, remove, list)
i18n-rosetta fonts <sub>       Download web fonts for PUA script converters
i18n-rosetta tm <sub>          Manage Translation Memory cache (stats, clear)
i18n-rosetta xliff <sub>       Export/import XLIFF 1.2 for professional review
```

เรียกใช้ `i18n-rosetta <command> --help` เพื่อดูความช่วยเหลือโดยละเอียดสำหรับคำสั่งใดๆ

## ตัวเลือกส่วนกลาง

```
--help, -h              Show help (global or per-command)
--version, -v           Print version and exit
--yes, -y               Skip interactive prompts, use defaults
--config <path>         Custom config file path
--dir <path>            Override locales directory
--content-dir <path>    Hugo/Docusaurus content directory for Markdown translation
--source <code>         Override source locale (default: en)
--model <model>         Override translation model
--method <method>       Translation method: llm, google-translate (default: from config)
--format <fmt>          Locale file format: json, toml, yaml, or auto
--dry, --dry-run        Preview changes without writing files
--concurrency <n>       Max parallel API calls (sets both JSON and content, default: 12)
--json-concurrency <n>  Max parallel locale translations for JSON keys (default: 50)
--content-concurrency <n> Max parallel API calls for content translation (default: 12)
--force-content         Re-translate all content files (clears content lock)
--force-keys <keys>     Comma-separated dot-notation keys to force re-translate
--no-tm                 Skip Translation Memory cache for this sync run
--no-verify             Skip post-sync verification pass
--locale <code>         Target locale (xliff export, tm clear)
--quiet                 Errors and warnings only — suppress banner, progress bar, and info lines
--json                  Machine-readable NDJSON output — one JSON object per event
```

---

## init

วิซาร์ดการตั้งค่าแบบอินเทอร์แอกทีฟที่จะสร้าง `i18n-rosetta.config.json` โดยจะแนะนำคุณตลอดขั้นตอนการกำหนดภาษาต้นทาง ภาษาปลายทาง รูปแบบไฟล์ และโมเดลการแปล

```bash
i18n-rosetta init                          # interactive wizard
i18n-rosetta init --yes                    # skip wizard, use defaults
i18n-rosetta init --yes --langs fr,de,ja   # quick setup with specific languages
i18n-rosetta init --source en --dir ./i18n # overrides with defaults
```

**ตัวเลือก `--langs`**: รายการรหัสภาษาปลายทางที่คั่นด้วยเครื่องหมายจุลภาค (comma) ซึ่งจะข้ามพรอมต์ถามภาษาและใช้พรีเซ็ตระดับภาษา (register) เริ่มต้นสำหรับแต่ละภาษา นำไปใช้ร่วมกับ `--yes` เพื่อการตั้งค่าแบบไม่ต้องโต้ตอบ (non-interactive) โดยสมบูรณ์

**พรีเซ็ตภาษา**: เมื่อได้รับพรอมต์ให้ระบุภาษาปลายทาง คุณสามารถพิมพ์ชื่อพรีเซ็ตได้ดังนี้:
- `european` → fr, de, es, it, pt, nl
- `asian` → ja, zh, ko
- `global` → fr, es, de, ja, zh, ko, pt, ar
- `nordic` → da, fi, nb, sv

ผสมพรีเซ็ตและรหัสภาษาแต่ละตัวเข้าด้วยกัน: `european, ja` → fr, de, es, it, pt, nl, ja

---

## sync

แปลคีย์ที่ขาดหายไปและคีย์ที่ล้าสมัยในไฟล์ locale ทั้งหมด โดยจะเรียกใช้การตรวจสอบความถูกต้องหลังการซิงค์ (post-sync verification) เป็นค่าเริ่มต้น

```bash
i18n-rosetta sync                                   # translate everything
i18n-rosetta sync --dry-run                         # preview only
i18n-rosetta sync --force-keys "hero.title"         # force re-translate
i18n-rosetta sync --force-keys "a.title,a.subtitle" # multiple keys
i18n-rosetta sync --force-content                   # re-translate all Markdown/MDX
i18n-rosetta sync --content-dir ./content           # include Hugo Markdown
i18n-rosetta sync --method google-translate          # force Google Translate
i18n-rosetta sync --concurrency 20                  # 20 parallel API calls (both phases)
i18n-rosetta sync --json-concurrency 30              # 30 parallel locale translations (JSON)
i18n-rosetta sync --content-concurrency 8            # 8 parallel content translations
i18n-rosetta sync --no-verify                        # skip post-sync verification
i18n-rosetta sync --no-tm                            # skip cache, fresh API calls
```

**Translation Memory**: ตามค่าเริ่มต้น `sync` จะโหลด `.rosetta/tm.json` และให้บริการคำแปลที่แคชไว้สำหรับค่าต้นทางที่ไม่มีการเปลี่ยนแปลง ใช้ `--no-tm` เพื่อข้ามการใช้แคช (มีประโยชน์เมื่อเปลี่ยนผู้ให้บริการการแปลหรือเมื่อต้องการดีบักคุณภาพ) ดู [Translation Memory](/docs/concepts/translation-memory)

**การตรวจจับการเปลี่ยนแปลง**: rosetta จะจัดเก็บแฮช SHA-256 ไว้ใน `.i18n-rosetta.lock` เมื่อค่าต้นทางมีการเปลี่ยนแปลง การซิงค์ครั้งถัดไปจะแปลคีย์เหล่านั้นใหม่โดยอัตโนมัติ โปรดคอมมิตไฟล์ lock เพื่อให้นักพัฒนาทุกคนใช้บรรทัดฐาน (baseline) เดียวกัน

**การทำงานแบบขนาน (Parallelism)**: ทั้งการแปลคีย์ JSON และการแปลเนื้อหาจะทำงานแบบขนานกัน locale ของ JSON จะถูกแปลพร้อมกัน (ค่าเริ่มต้น: 50 locale พร้อมกัน) โดยชุดข้อมูล (batches) ภายในแต่ละ locale จะทำงานแบบขนานด้วยเช่นกัน (4 ชุดข้อมูลพร้อมกัน) การแปลเนื้อหา (Markdown, MDX, โพสต์บล็อก) จะทำงานในพูลรายการงานแบบแบน (flat work-item pool) (ค่าเริ่มต้น: การเรียก API 12 รายการพร้อมกัน) สามารถลบล้างค่าได้ด้วย `--json-concurrency`, `--content-concurrency` หรือ `--concurrency` (ตั้งค่าทั้งสองอย่าง)

**ผลลัพธ์ (Output)**: การซิงค์จะแสดงแบนเนอร์เวอร์ชัน การตรวจจับรูปแบบ/เฟรมเวิร์ก การประเมินค่าใช้จ่าย และแถบความคืบหน้าของแต่ละ locale:

```
i18n-rosetta v3.3.1

[INFO] Detected format: json (auto)
[INFO] Source: en.json (2,847 keys)
[INFO] Pairs: es-MX:llm, fr:deepl

[INFO] es-MX.json — 2,847 missing
     ████████████████████████████████ 2,847/2,847 keys
[INFO] fr.json — 2,847 missing
     ████████████████████████████████ 2,847/2,847 keys
[OK] Synced 5,694 keys total.
```

แถบความคืบหน้าจะอัปเดตในตำแหน่งเดิมหลังจากเสร็จสิ้นแต่ละชุดข้อมูล (~80 คีย์) ใช้ `--quiet` สำหรับแสดงเฉพาะข้อผิดพลาด/คำเตือน หรือ `--json` สำหรับผลลัพธ์ NDJSON ที่เครื่องสามารถอ่านได้ ทั้งสองตัวเลือกนี้จะซ่อนแถบความคืบหน้าและแบนเนอร์

---

## watch

ซิงค์อัตโนมัติเมื่อไฟล์ locale ต้นทางมีการเปลี่ยนแปลง โดยจะทำงานไปเรื่อยๆ จนกว่าจะถูกขัดจังหวะด้วย `Ctrl+C`

```bash
i18n-rosetta watch
```

---

## audit

แสดงรายการค่า fallback ที่ขึ้นต้นด้วย `[EN]` ซึ่งยังไม่ได้รับการแปลจากการทำงานครั้งก่อนหน้าทั้งหมด จะออกด้วยรหัส 1 (exit code 1) หากพบค่าดังกล่าว — ใช้เป็น CI gate เพื่อให้บิลด์ล้มเหลวหากมีการแปลที่ไม่สมบูรณ์

```bash
i18n-rosetta audit
```

---

## verify

อ่านไฟล์ locale ทั้งหมดจากดิสก์อีกครั้ง และตรวจสอบว่ามีคำแปลอยู่จริงและถูกต้อง นี่คือการตรวจสอบความถูกต้องแบบเดียวกับที่ทำงานโดยอัตโนมัติเมื่อสิ้นสุดทุกๆ `sync` (เว้นแต่จะมีการส่งผ่าน `--no-verify`)

```bash
i18n-rosetta verify                    # verify all locale files
i18n-rosetta verify --warn-only        # non-blocking
i18n-rosetta verify && echo "All good" # CI gate
```

**สิ่งที่ตรวจสอบ:**
- ความเท่าเทียมกันของคีย์ (Key parity) — คีย์ต้นทางทั้งหมดต้องมีอยู่ในแต่ละภาษาปลายทาง
- เครื่องหมาย fallback `[EN]` จากการทำงานครั้งก่อนหน้า
- คำแปลที่ว่างเปล่า
- ความสอดคล้องของสคริปต์ (Script compliance) — locale ที่ไม่ใช่ภาษาละตินควรมีคำแปลที่ไม่ใช่ ASCII
- การคงไว้ซึ่งตัวแทนที่ (Placeholder preservation) — ตัวแทนที่ ICU ต้องตรงกับต้นทาง
- ปัญหาการเข้ารหัส (Encoding issues) — เครื่องหมาย BOM, อักขระที่มองไม่เห็น
- การสะท้อนกลับของต้นทาง (Source echoes) — ค่าที่เหมือนกับต้นทางทุกประการ (คำเตือน)

---

## lint

สแกนซอร์สโค้ดเพื่อหาสตริงที่แสดงต่อผู้ใช้ซึ่งถูกฮาร์ดโค้ดไว้ (hardcoded) และควรใช้การเรียกการแปล i18n ตรวจจับเฟรมเวิร์กของคุณโดยอัตโนมัติ (next-intl, react-i18next, vue-i18n, Hugo)

```bash
i18n-rosetta lint                    # exits 1 if issues found
i18n-rosetta lint --warn-only        # always exits 0
i18n-rosetta lint --src ./app        # custom source directory
i18n-rosetta lint --min-length 4     # minimum string length to flag
```

**สิ่งที่ตรวจจับ:**
- สตริงที่ถูกฮาร์ดโค้ดในข้อความ JSX, `placeholder`, `alt`, `aria-label`, `title`
- ไฟล์ที่มีเนื้อหาแสดงต่อผู้ใช้แต่ไม่มีการอิมพอร์ตเฟรมเวิร์ก i18n
- คีย์ที่ไม่ได้ใช้งาน (Dead keys) — คีย์ locale ที่ไม่มีซอร์สไฟล์ใดอ้างอิงถึง
- คะแนนความครอบคลุม (Coverage score) — เปอร์เซ็นต์ของสตริงที่ผ่านกระบวนการ i18n

**ข้อยกเว้น**: สร้าง `.rosettaignore` ในรูทโปรเจ็กต์ของคุณ (รูปแบบ glob เช่น `.gitignore`)

---

## wrap

ห่อหุ้ม (wrap) สตริงที่ถูกฮาร์ดโค้ดซึ่งตรวจพบโดย `lint` ด้วยการเรียก `t()` โดยอัตโนมัติ สร้างการสำรองข้อมูลอัตโนมัติก่อนที่จะแก้ไขไฟล์

```bash
i18n-rosetta wrap                    # auto-wrap with backup
i18n-rosetta wrap --dry              # preview wrapping changes
i18n-rosetta wrap --undo             # restore from .rosetta-backup/
```

**ด่านความปลอดภัย (Safety gates):**
1. การตรวจสอบ Git-clean (ข้ามในโหมด dry-run)
2. การสำรองข้อมูลอัตโนมัติไปยัง `.rosetta-backup/`
3. การแสดงตัวอย่างความแตกต่าง (Diff preview) ก่อนเขียนแต่ละไฟล์
4. รองรับ `--undo` เพื่อกู้คืนจากการสำรองข้อมูล

---

## seo

สร้างอาร์ติแฟกต์ SEO สำหรับเว็บไซต์หลายภาษา

```bash
i18n-rosetta seo hreflang                                        # print hreflang tags
i18n-rosetta seo sitemap --base-url https://example.com --out sitemap.xml
i18n-rosetta seo jsonld --base-url https://example.com           # JSON-LD schema
```

| คำสั่งย่อย (Subcommand) | ผลลัพธ์ (Output) |
|------------|--------|
| `hreflang` | แท็ก `<link rel="alternate" hreflang>` |
| `sitemap` | `sitemap.xml` แบบหลายภาษา |
| `jsonld` | สคีมาภาษา JSON-LD WebSite |

---

## integrity

ตรวจจับความเสียหายและการเบี่ยงเบน (drift) ในไฟล์ locale ที่แปลแล้ว

```bash
i18n-rosetta integrity               # exits 1 if issues found
i18n-rosetta integrity --warn-only   # non-blocking
```

**สิ่งที่ตรวจสอบ:**
- ความเสียหายของตัวแทนที่ (เช่น มี `{name}` ในต้นทางแต่ขาดหายไปในปลายทาง)
- ปัญหาการเข้ารหัส (mojibake, Unicode ที่ไม่ถูกต้อง)
- สำเนาที่ยังไม่ได้แปล (ค่าปลายทางเหมือนกับต้นทางทุกประการ)
- คีย์กำพร้า (Orphaned keys) (คีย์ในปลายทางที่ไม่มีอยู่ในต้นทาง)
- ความสมบูรณ์ของหมวดหมู่พหูพจน์ ICU MessageFormat (เช่น ภาษาอาหรับต้องการ 6 หมวดหมู่)

---

## tm

จัดการแคช Translation Memory (`.rosetta/tm.json`) TM จะจัดเก็บคำแปลก่อนหน้าและให้บริการสำหรับการซิงค์ในครั้งถัดไปแทนการเรียก API

```bash
i18n-rosetta tm stats                  # show cache statistics
i18n-rosetta tm clear                  # clear cache (with confirmation)
i18n-rosetta tm clear --yes            # clear without confirmation
i18n-rosetta tm clear --locale fr      # clear only French entries
```

| คำสั่งย่อย (Subcommand) | ผลลัพธ์ (Output) |
|------------|--------|
| `stats` | จำนวนรายการ, ขนาดไฟล์, การแจกแจงตาม locale |
| `clear` | ลบไฟล์แคช (ทั้งหมดหรือตาม locale) |

| ตัวเลือก (Option) | ผลลัพธ์ (Effect) |
|--------|--------|
| `--locale <code>` | ล้างเฉพาะรายการสำหรับหนึ่ง locale |
| `--yes` | ข้ามพรอมต์ยืนยัน |

ดู [Translation Memory](/docs/concepts/translation-memory) สำหรับวิธีการทำงานของ TM และเวลาที่ควรล้างข้อมูล

---

## xliff

ส่งออกและนำเข้าไฟล์ XLIFF 1.2 สำหรับการตรวจสอบโดยนักแปลมืออาชีพ XLIFF เป็นรูปแบบการแลกเปลี่ยนสากลที่รองรับโดยเครื่องมือ CAT เช่น memoQ, SDL Trados และ Phrase

```bash
i18n-rosetta xliff export --locale fr                   # export French XLIFF
i18n-rosetta xliff export --locale ja --out ./review/   # custom output path
i18n-rosetta xliff import .rosetta/xliff/fr.xliff       # import reviewed file
i18n-rosetta xliff import ./reviewed.xliff --dry        # preview import
```

| คำสั่งย่อย (Subcommand) | ผลลัพธ์ (Output) |
|------------|--------|
| `export` | สร้าง `.xliff` จากไฟล์ locale ต้นทาง + ปลายทาง |
| `import` | ผสานคำแปล `.xliff` ที่ตรวจสอบแล้วลงในไฟล์ locale |

| ตัวเลือก (Option) | ผลลัพธ์ (Effect) |
|--------|--------|
| `--locale <code>` | locale ปลายทางสำหรับการส่งออก (จำเป็น) |
| `--out <path>` | พาธหรือไดเรกทอรีผลลัพธ์แบบกำหนดเอง |
| `--dry` | ดูตัวอย่างการนำเข้าโดยไม่เขียนไฟล์ |

ดู [การทำงานร่วมกับนักแปลมืออาชีพ](/docs/guides/professional-translators) สำหรับเวิร์กโฟลว์ฉบับเต็ม

---

## status

แสดงการกำหนดค่าคู่ภาษา ปลั๊กอินที่ติดตั้ง ระดับคุณภาพ และคะแนนเกณฑ์มาตรฐาน (benchmark scores)

```bash
i18n-rosetta status
```

---

## provenance

ตรวจสอบการอนุญาตให้ใช้สิทธิ์ทรัพยากรการแปลสำหรับปลั๊กอินที่ติดตั้งทั้งหมด

```bash
i18n-rosetta provenance
```

---

## plugin

จัดการปลั๊กอินวิธีการแปล ปลั๊กอินคือสูตรการแปลที่จัดทำไว้ล่วงหน้าซึ่งติดตั้งไว้ที่ `.rosetta/methods/`

```bash
i18n-rosetta plugin list                      # show installed plugins
i18n-rosetta plugin install ./my-method/      # install from local directory
i18n-rosetta plugin remove crk-coached-v1     # remove a plugin
```

ดู [ข้อกำหนดปลั๊กอิน](/docs/reference/plugin-spec) สำหรับรูปแบบ manifest ของปลั๊กอิน

---

## fonts

ดาวน์โหลดและจัดการเว็บฟอนต์ PUA สำหรับตัวแปลงสคริปต์ภาษาประดิษฐ์ (constructed language) ภาษาที่ใช้อักขระ Private Use Area (เช่น Klingon, Sindarin, Kryptonian) จำเป็นต้องใช้เว็บฟอนต์แบบกำหนดเองเพื่อแสดงผลสคริปต์ คำสั่งนี้จะดาวน์โหลดฟอนต์เหล่านั้นจากที่เก็บข้อมูลโอเพนซอร์สที่ได้รับการยืนยันแล้ว

```bash
i18n-rosetta fonts list                           # show needed fonts
i18n-rosetta fonts install                        # download all needed fonts
i18n-rosetta fonts install --css                  # also generate CSS snippet
i18n-rosetta fonts install --dir ./public/fonts   # custom output directory
```

| คำสั่งย่อย (Subcommand) | ผลลัพธ์ (Output) |
|------------|--------|
| `list` | แสดงว่าจำเป็นต้องใช้ฟอนต์ PUA ใดบ้างและสถานะการติดตั้ง |
| `install` | ดาวน์โหลดฟอนต์สำหรับภาษาที่กำหนดค่าไว้ |

| ตัวเลือก (Option) | ผลลัพธ์ (Effect) |
|--------|--------|
| `--dir <path>` | ลบล้างไดเรกทอรีผลลัพธ์ของฟอนต์ (ตรวจจับอัตโนมัติจากประเภทโปรเจ็กต์) |
| `--css` | สร้างสนิปเปต `conlang-fonts.css` ควบคู่ไปกับฟอนต์ |
| `--config <path>` | พาธไปยังไฟล์กำหนดค่า (ใช้เพื่อตรวจจับว่าภาษาใดต้องการฟอนต์) |

**การตรวจจับอัตโนมัติ:** ไดเรกทอรีผลลัพธ์จะถูกอนุมานจากโครงสร้างโปรเจ็กต์ของคุณ:
- **Docusaurus** → `static/fonts/` หรือ `website/static/fonts/`
- **Hugo** → `static/fonts/`
- **ค่าเริ่มต้น** → `public/fonts/`

**ตัวแปลง Unicode ดั้งเดิม** (`crk` → Cree Syllabics, `sr` → Serbian Cyrillic) ไม่จำเป็นต้องติดตั้งฟอนต์

ดู [ภาษาประดิษฐ์ สคริปต์ และอักขรวิธี](/docs/guides/conlangs-scripts-orthography) สำหรับรายละเอียดฟอนต์ PUA ฉบับเต็ม

## ไปป์ไลน์สามชั้น (Three-Layer Pipeline)

ใช้ `lint`, `sync` และ `audit` ร่วมกันเพื่อระบบ i18n ที่ไร้ช่องโหว่:

```json title="package.json"
{
  "scripts": {
    "i18n:lint": "i18n-rosetta lint",
    "i18n:sync": "i18n-rosetta sync",
    "i18n:audit": "i18n-rosetta audit"
  }
}
```

| ชั้น (Layer) | คำสั่ง (Command) | เมื่อใด (When) | วัตถุประสงค์ (Purpose) |
|-------|---------|------|---------|
| **Lint** | `lint` | Pre-commit | บล็อกการคอมมิตที่มีสตริงแบบฮาร์ดโค้ด |
| **Sync** | `sync` | Post-commit / CI | แปลคีย์ที่ขาดหายไปและคีย์ที่มีการเปลี่ยนแปลง |
| **Verify** | `verify` | Post-sync / CI | ยืนยันว่ามีคำแปลอยู่จริงและถูกต้อง |
| **Audit** | `audit` | ขั้นตอนการบิลด์ (Build step) | ทำให้การปรับใช้ (deployment) ล้มเหลวหาก locale ใดมีเครื่องหมาย `[EN]` |

---

## ดูเพิ่มเติม

- [การกำหนดค่า](/docs/getting-started/configuration) — ข้อมูลอ้างอิงไฟล์กำหนดค่า
- [วิธีการแปล](/docs/guides/translation-methods) — การเลือกวิธีการสำหรับแต่ละคู่ภาษา
- [Translation Memory](/docs/concepts/translation-memory) — การแคชและการประหยัดค่าใช้จ่าย
- [การทำงานร่วมกับนักแปลมืออาชีพ](/docs/guides/professional-translators) — เวิร์กโฟลว์ XLIFF
- [ข้อกำหนดปลั๊กอิน](/docs/reference/plugin-spec) — รูปแบบ manifest ของปลั๊กอิน
- [คู่มือ CI/CD](/docs/guides/ci-cd) — การทำงานอัตโนมัติของคำสั่ง CLI ในไปป์ไลน์ของคุณ
- [การซิงค์ทำงานอย่างไร](/docs/concepts/how-sync-works) — ทำความเข้าใจไปป์ไลน์การซิงค์
- [Quality Gate](/docs/concepts/quality-gate) — วิธีการตรวจสอบความถูกต้องของคำแปล