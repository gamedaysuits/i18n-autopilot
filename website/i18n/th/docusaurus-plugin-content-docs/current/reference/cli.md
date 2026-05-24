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
i18n-rosetta status            Show pair configuration, plugins, and quality tiers
i18n-rosetta provenance        Audit translation resource licensing
i18n-rosetta plugin <sub>      Manage method plugins (install, remove, list)
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
--dry                   Preview changes without writing files
```

---

## init

วิซาร์ดการตั้งค่าแบบอินเทอร์แอกทีฟที่จะสร้าง `i18n-rosetta.config.json` โดยจะแนะนำคุณเกี่ยวกับการตั้งค่าภาษาต้นทาง ภาษาปลายทาง รูปแบบไฟล์ และโมเดลการแปล

```bash
i18n-rosetta init                          # interactive wizard
i18n-rosetta init --yes                    # skip wizard, use defaults
i18n-rosetta init --yes --langs fr,de,ja   # quick setup with specific languages
i18n-rosetta init --source en --dir ./i18n # overrides with defaults
```

**ตัวเลือก `--langs`**: รายการรหัสภาษาปลายทางที่คั่นด้วยเครื่องหมายจุลภาค ข้ามการถามภาษาและใช้ค่าพรีเซ็ตระดับภาษา (register presets) เริ่มต้นสำหรับแต่ละภาษา รวมกับ `--yes` เพื่อการตั้งค่าแบบไม่อินเทอร์แอกทีฟอย่างสมบูรณ์

**พรีเซ็ตภาษา**: เมื่อระบบถามถึงภาษาปลายทาง คุณสามารถพิมพ์ชื่อพรีเซ็ตได้:
- `european` → fr, de, es, it, pt, nl
- `asian` → ja, zh, ko
- `global` → fr, es, de, ja, zh, ko, pt, ar
- `nordic` → da, fi, nb, sv

ผสมพรีเซ็ตและรหัสภาษาแต่ละรายการ: `european, ja` → fr, de, es, it, pt, nl, ja

---

## sync

แปลคีย์ที่ขาดหายไป คีย์ที่เก่าเกินไป (stale) และคีย์สำรอง (fallback) ในไฟล์ภาษาทั้งหมด

```bash
i18n-rosetta sync                                   # translate everything
i18n-rosetta sync --dry                             # preview only
i18n-rosetta sync --force-keys "hero.title"         # force re-translate
i18n-rosetta sync --force-keys "a.title,a.subtitle" # multiple keys
i18n-rosetta sync --content-dir ./content           # include Hugo Markdown
i18n-rosetta sync --method google-translate          # force Google Translate
i18n-rosetta sync --fallback                         # write [EN] prefixes on failure
```

**การตรวจจับการเปลี่ยนแปลง**: rosetta จะจัดเก็บแฮช SHA-256 ไว้ใน `.i18n-rosetta.lock` เมื่อค่าต้นทางมีการเปลี่ยนแปลง การซิงค์ครั้งถัดไปจะแปลคีย์เหล่านั้นใหม่โดยอัตโนมัติ โปรดคอมมิตไฟล์ล็อก (lock file) เพื่อให้นักพัฒนาทุกคนใช้บรรทัดฐาน (baseline) เดียวกัน

---

## watch

ซิงค์อัตโนมัติเมื่อไฟล์ภาษาต้นทางมีการเปลี่ยนแปลง โดยจะทำงานไปเรื่อยๆ จนกว่าจะถูกขัดจังหวะด้วย `Ctrl+C`

```bash
i18n-rosetta watch
```

---

## audit

แสดงรายการค่าสำรองที่ขึ้นต้นด้วย `[EN]` ซึ่งยังไม่ได้รับการแปลทั้งหมด โดยจะออกด้วยรหัส 1 (exit code 1) หากพบรายการใดๆ — ใช้เป็น CI gate เพื่อให้การบิลด์ล้มเหลวหากมีการแปลที่ไม่สมบูรณ์

```bash
i18n-rosetta audit
```

---

## lint

สแกนซอร์สโค้ดเพื่อหาสตริงที่แสดงผลต่อผู้ใช้ซึ่งถูกฮาร์ดโค้ดไว้ (hardcoded) และควรใช้การเรียกการแปล i18n โดยจะตรวจจับเฟรมเวิร์กของคุณโดยอัตโนมัติ (next-intl, react-i18next, vue-i18n, Hugo)

```bash
i18n-rosetta lint                    # exits 1 if issues found
i18n-rosetta lint --warn-only        # always exits 0
i18n-rosetta lint --src ./app        # custom source directory
i18n-rosetta lint --min-length 4     # minimum string length to flag
```

**สิ่งที่ตรวจจับได้:**
- สตริงที่ถูกฮาร์ดโค้ดในข้อความ JSX, `placeholder`, `alt`, `aria-label`, `title`
- ไฟล์ที่มีเนื้อหาแสดงผลต่อผู้ใช้แต่ไม่มีการอิมพอร์ตเฟรมเวิร์ก i18n
- คีย์ที่ไม่ได้ใช้งาน (Dead keys) — คีย์ภาษาที่ไม่มีการอ้างอิงในไฟล์ซอร์สโค้ดใดๆ
- คะแนนความครอบคลุม (Coverage score) — เปอร์เซ็นต์ของสตริงที่ผ่านระบบ i18n

**ข้อยกเว้น**: สร้าง `.rosettaignore` ในรูทโปรเจกต์ของคุณ (รูปแบบ glob เช่น `.gitignore`)

---

## wrap

ครอบสตริงที่ถูกฮาร์ดโค้ดซึ่งตรวจพบโดย `lint` ให้อยู่ในการเรียก `t()` โดยอัตโนมัติ โดยจะสร้างข้อมูลสำรองอัตโนมัติก่อนแก้ไขไฟล์

```bash
i18n-rosetta wrap                    # auto-wrap with backup
i18n-rosetta wrap --dry              # preview wrapping changes
i18n-rosetta wrap --undo             # restore from .rosetta-backup/
```

**มาตรการด้านความปลอดภัย (Safety gates):**
1. การตรวจสอบ Git-clean (ข้ามไปในโหมด dry-run)
2. การสำรองข้อมูลอัตโนมัติไปยัง `.rosetta-backup/`
3. การแสดงตัวอย่างความแตกต่าง (Diff preview) ก่อนเขียนแต่ละไฟล์
4. รองรับ `--undo` เพื่อกู้คืนจากข้อมูลสำรอง

---

## seo

สร้างอาร์ติแฟกต์ SEO สำหรับเว็บไซต์หลายภาษา

```bash
i18n-rosetta seo hreflang                                        # print hreflang tags
i18n-rosetta seo sitemap --base-url https://example.com --out sitemap.xml
i18n-rosetta seo jsonld --base-url https://example.com           # JSON-LD schema
```

| คำสั่งย่อย | ผลลัพธ์ |
|------------|--------|
| `hreflang` | แท็ก `<link rel="alternate" hreflang>` |
| `sitemap` | `sitemap.xml` แบบหลายภาษา |
| `jsonld` | สคีมาภาษา JSON-LD WebSite |

---

## integrity

ตรวจจับความเสียหายและการคลาดเคลื่อน (drift) ในไฟล์ภาษาที่แปลแล้ว

```bash
i18n-rosetta integrity               # exits 1 if issues found
i18n-rosetta integrity --warn-only   # non-blocking
```

**สิ่งที่ตรวจสอบ:**
- ความเสียหายของเพลซโฮลเดอร์ (เช่น มี `{name}` ในต้นทางแต่หายไปในปลายทาง)
- ปัญหาการเข้ารหัส (mojibake, Unicode ที่ไม่ถูกต้อง)
- สำเนาที่ยังไม่ได้แปล (ค่าปลายทางเหมือนกับต้นทางทุกประการ)
- คีย์กำพร้า (Orphaned keys) (คีย์ในปลายทางที่ไม่มีอยู่ในต้นทาง)

---

## status

แสดงการกำหนดค่าคู่ภาษา ปลั๊กอินที่ติดตั้ง ระดับคุณภาพ และคะแนนเกณฑ์มาตรฐาน (benchmark scores)

```bash
i18n-rosetta status
```

---

## provenance

ตรวจสอบสิทธิ์การใช้งานทรัพยากรการแปลสำหรับปลั๊กอินที่ติดตั้งทั้งหมด

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

ดู [Plugin Specification](/docs/reference/plugin-spec) สำหรับรูปแบบของปลั๊กอินแมนิเฟสต์ (plugin manifest)

---

## ไปป์ไลน์สามชั้น (Three-Layer Pipeline)

ใช้ `lint`, `sync` และ `audit` ร่วมกันเพื่อระบบ i18n ที่ไร้ข้อผิดพลาด:

```json title="package.json"
{
  "scripts": {
    "i18n:lint": "i18n-rosetta lint",
    "i18n:sync": "i18n-rosetta sync",
    "i18n:audit": "i18n-rosetta audit"
  }
}
```

| ชั้น | คำสั่ง | เมื่อใด | วัตถุประสงค์ |
|-------|---------|------|---------|
| **Lint** | `lint` | ก่อนคอมมิต (Pre-commit) | บล็อกการคอมมิตที่มีสตริงแบบฮาร์ดโค้ด |
| **Sync** | `sync` | หลังคอมมิต (Post-commit) / CI | แปลคีย์ที่ขาดหายไปและมีการเปลี่ยนแปลง |
| **Audit** | `audit` | ขั้นตอนการบิลด์ (Build step) | ทำให้การปรับใช้ (deployment) ล้มเหลวหากมีภาษาใดไม่สมบูรณ์ |

---

## ดูเพิ่มเติม

- [Configuration](/docs/getting-started/configuration) — ข้อมูลอ้างอิงไฟล์คอนฟิก
- [Translation Methods](/docs/guides/translation-methods) — การเลือกวิธีการสำหรับแต่ละคู่ภาษา
- [Plugin Specification](/docs/reference/plugin-spec) — รูปแบบของปลั๊กอินแมนิเฟสต์
- [CI/CD Guide](/docs/guides/ci-cd) — การทำให้คำสั่ง CLI ทำงานอัตโนมัติในไปป์ไลน์ของคุณ
- [How Sync Works](/docs/concepts/how-sync-works) — ทำความเข้าใจไปป์ไลน์การซิงค์
- [Quality Gate](/docs/concepts/quality-gate) — วิธีการตรวจสอบความถูกต้องของการแปล