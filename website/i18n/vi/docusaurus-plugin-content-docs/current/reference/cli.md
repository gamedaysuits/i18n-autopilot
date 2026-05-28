---
sidebar_position: 1
title: "Tài liệu tham khảo CLI"
---
# Tài liệu tham khảo CLI

## Các lệnh

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

Chạy `i18n-rosetta <command> --help` để xem trợ giúp chi tiết cho bất kỳ lệnh nào.

## Các tùy chọn toàn cục

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

Trình hướng dẫn thiết lập tương tác giúp tạo `i18n-rosetta.config.json`. Hướng dẫn bạn chọn ngôn ngữ nguồn, các ngôn ngữ đích, định dạng tệp và mô hình dịch thuật.

```bash
i18n-rosetta init                          # interactive wizard
i18n-rosetta init --yes                    # skip wizard, use defaults
i18n-rosetta init --yes --langs fr,de,ja   # quick setup with specific languages
i18n-rosetta init --source en --dir ./i18n # overrides with defaults
```

**Tùy chọn `--langs`**: Danh sách các mã ngôn ngữ đích phân tách bằng dấu phẩy. Bỏ qua lời nhắc chọn ngôn ngữ và áp dụng các cài đặt sẵn về văn phong (register) mặc định cho từng ngôn ngữ. Kết hợp với `--yes` để thiết lập hoàn toàn không tương tác.

**Các cài đặt ngôn ngữ sẵn (Language presets)**: Khi được nhắc chọn ngôn ngữ đích, bạn có thể nhập tên của các cài đặt sẵn:
- `european` → fr, de, es, it, pt, nl
- `asian` → ja, zh, ko
- `global` → fr, es, de, ja, zh, ko, pt, ar
- `nordic` → da, fi, nb, sv

Kết hợp các cài đặt sẵn và mã ngôn ngữ riêng lẻ: `european, ja` → fr, de, es, it, pt, nl, ja

---

## sync

Dịch các khóa (keys) bị thiếu và đã cũ trên tất cả các tệp ngôn ngữ (locale files). Chạy xác minh sau đồng bộ (post-sync verification) theo mặc định.

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

**Bộ nhớ dịch thuật (Translation Memory)**: Theo mặc định, `sync` sẽ tải `.rosetta/tm.json` và cung cấp các bản dịch đã lưu trong bộ nhớ cache cho các giá trị nguồn không thay đổi. Sử dụng `--no-tm` để bỏ qua bộ nhớ cache (hữu ích khi chuyển đổi nhà cung cấp dịch thuật hoặc gỡ lỗi chất lượng). Xem [Bộ nhớ dịch thuật](/docs/concepts/translation-memory).

**Phát hiện thay đổi**: rosetta lưu trữ các mã băm SHA-256 trong `.i18n-rosetta.lock`. Khi các giá trị nguồn thay đổi, lần đồng bộ tiếp theo sẽ tự động dịch lại các khóa đó. Hãy commit tệp lock này để tất cả các lập trình viên cùng chia sẻ một baseline chung.

**Xử lý song song (Parallelism)**: Cả việc dịch khóa JSON và dịch nội dung đều chạy song song. Các ngôn ngữ JSON được dịch đồng thời (mặc định: 50 ngôn ngữ đồng thời), với các lô (batches) trong mỗi ngôn ngữ cũng được chạy song song (4 lô đồng thời). Việc dịch nội dung (Markdown, MDX, bài viết blog) chạy trong một pool công việc phẳng (mặc định: 12 lệnh gọi API đồng thời). Ghi đè bằng `--json-concurrency`, `--content-concurrency`, hoặc `--concurrency` (thiết lập cho cả hai).

**Đầu ra (Output)**: Sync hiển thị banner phiên bản, phát hiện định dạng/framework, ước tính chi phí và thanh tiến trình cho từng ngôn ngữ:

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

Các thanh tiến trình cập nhật tại chỗ sau mỗi lô (~80 khóa). Sử dụng `--quiet` để chỉ hiển thị lỗi/cảnh báo, hoặc `--json` để xuất định dạng NDJSON cho máy đọc. Cả hai tùy chọn này đều ẩn thanh tiến trình và banner.

---

## watch

Tự động đồng bộ khi tệp ngôn ngữ nguồn thay đổi. Chạy liên tục cho đến khi bị ngắt bằng `Ctrl+C`.

```bash
i18n-rosetta watch
```

---

## audit

Liệt kê tất cả các giá trị dự phòng (fallback values) chưa được dịch có tiền tố `[EN]` từ các lần chạy trước. Thoát với mã 1 nếu tìm thấy bất kỳ giá trị nào — sử dụng như một cổng CI (CI gate) để đánh lỗi các bản build có bản dịch chưa hoàn chỉnh.

```bash
i18n-rosetta audit
```

---

## verify

Đọc lại tất cả các tệp ngôn ngữ từ ổ đĩa và xác minh xem các bản dịch có thực sự tồn tại và chính xác hay không. Đây là cùng một quy trình xác minh chạy tự động ở cuối mỗi lệnh `sync` (trừ khi truyền vào `--no-verify`).

```bash
i18n-rosetta verify                    # verify all locale files
i18n-rosetta verify --warn-only        # non-blocking
i18n-rosetta verify && echo "All good" # CI gate
```

**Những gì được kiểm tra:**
- Sự đồng đều của khóa (Key parity) — tất cả các khóa nguồn đều có mặt trong mỗi ngôn ngữ đích
- Các điểm đánh dấu dự phòng `[EN]` từ các lần chạy trước
- Các bản dịch trống
- Tuân thủ hệ chữ viết (Script compliance) — các ngôn ngữ phi Latinh phải có bản dịch phi ASCII
- Bảo toàn placeholder — các placeholder ICU khớp với nguồn
- Các vấn đề về mã hóa — dấu BOM, các ký tự ẩn
- Lặp lại nguồn (Source echoes) — các giá trị giống hệt với nguồn (cảnh báo)

---

## lint

Quét mã nguồn để tìm các chuỗi văn bản hiển thị cho người dùng được hardcode mà lẽ ra nên sử dụng các lệnh gọi dịch thuật i18n. Tự động phát hiện framework của bạn (next-intl, react-i18next, vue-i18n, Hugo).

```bash
i18n-rosetta lint                    # exits 1 if issues found
i18n-rosetta lint --warn-only        # always exits 0
i18n-rosetta lint --src ./app        # custom source directory
i18n-rosetta lint --min-length 4     # minimum string length to flag
```

**Những gì được phát hiện:**
- Các chuỗi hardcode trong văn bản JSX, `placeholder`, `alt`, `aria-label`, `title`
- Các tệp có nội dung hiển thị cho người dùng nhưng không import framework i18n
- Khóa chết (Dead keys) — các khóa ngôn ngữ không được tệp mã nguồn nào tham chiếu đến
- Điểm bao phủ (Coverage score) — tỷ lệ phần trăm các chuỗi đi qua i18n

**Loại trừ (Exclusions)**: Tạo `.rosettaignore` trong thư mục gốc dự án của bạn (sử dụng glob patterns, ví dụ như `.gitignore`).

---

## wrap

Tự động bọc (auto-wrap) các chuỗi hardcode được phát hiện bởi `lint` vào trong các lệnh gọi `t()`. Tự động tạo bản sao lưu trước khi sửa đổi tệp.

```bash
i18n-rosetta wrap                    # auto-wrap with backup
i18n-rosetta wrap --dry              # preview wrapping changes
i18n-rosetta wrap --undo             # restore from .rosetta-backup/
```

**Các chốt an toàn (Safety gates):**
1. Kiểm tra Git-clean (bỏ qua trong chế độ dry-run)
2. Tự động sao lưu vào `.rosetta-backup/`
3. Xem trước khác biệt (Diff preview) trước khi ghi từng tệp
4. Hỗ trợ `--undo` để khôi phục từ bản sao lưu

---

## seo

Tạo các tài nguyên SEO cho các trang web đa ngôn ngữ.

```bash
i18n-rosetta seo hreflang                                        # print hreflang tags
i18n-rosetta seo sitemap --base-url https://example.com --out sitemap.xml
i18n-rosetta seo jsonld --base-url https://example.com           # JSON-LD schema
```

| Lệnh phụ (Subcommand) | Đầu ra (Output) |
|------------|--------|
| `hreflang` | Các thẻ `<link rel="alternate" hreflang>` |
| `sitemap` | `sitemap.xml` đa ngôn ngữ |
| `jsonld` | Lược đồ ngôn ngữ JSON-LD WebSite |

---

## integrity

Phát hiện sự hỏng hóc và sai lệch trong các tệp ngôn ngữ đã dịch.

```bash
i18n-rosetta integrity               # exits 1 if issues found
i18n-rosetta integrity --warn-only   # non-blocking
```

**Những gì được kiểm tra:**
- Hỏng placeholder (ví dụ: `{name}` có trong nguồn nhưng thiếu trong đích)
- Các vấn đề về mã hóa (lỗi hiển thị mojibake, Unicode không hợp lệ)
- Các bản sao chưa dịch (giá trị đích giống hệt nguồn)
- Khóa mồ côi (Orphaned keys) (các khóa ở đích không tồn tại trong nguồn)
- Tính đầy đủ của danh mục số nhiều trong ICU MessageFormat (ví dụ: tiếng Ả Rập cần 6 danh mục)

---

## tm

Quản lý bộ nhớ cache của Bộ nhớ dịch thuật (Translation Memory - `.rosetta/tm.json`). TM lưu trữ các bản dịch trước đó và cung cấp chúng trong các lần đồng bộ tiếp theo thay vì gọi API.

```bash
i18n-rosetta tm stats                  # show cache statistics
i18n-rosetta tm clear                  # clear cache (with confirmation)
i18n-rosetta tm clear --yes            # clear without confirmation
i18n-rosetta tm clear --locale fr      # clear only French entries
```

| Lệnh phụ (Subcommand) | Đầu ra (Output) |
|------------|--------|
| `stats` | Số lượng mục, kích thước tệp, phân tích chi tiết theo từng ngôn ngữ |
| `clear` | Xóa tệp cache (toàn bộ hoặc theo từng ngôn ngữ) |

| Tùy chọn (Option) | Hiệu ứng (Effect) |
|--------|--------|
| `--locale <code>` | Chỉ xóa các mục của một ngôn ngữ |
| `--yes` | Bỏ qua lời nhắc xác nhận |

Xem [Bộ nhớ dịch thuật](/docs/concepts/translation-memory) để biết cách TM hoạt động và khi nào cần xóa nó.

---

## xliff

Xuất và nhập các tệp XLIFF 1.2 để các dịch giả chuyên nghiệp đánh giá. XLIFF là định dạng trao đổi phổ quát được hỗ trợ bởi các công cụ CAT như memoQ, SDL Trados và Phrase.

```bash
i18n-rosetta xliff export --locale fr                   # export French XLIFF
i18n-rosetta xliff export --locale ja --out ./review/   # custom output path
i18n-rosetta xliff import .rosetta/xliff/fr.xliff       # import reviewed file
i18n-rosetta xliff import ./reviewed.xliff --dry        # preview import
```

| Lệnh phụ (Subcommand) | Đầu ra (Output) |
|------------|--------|
| `export` | Tạo `.xliff` từ các tệp ngôn ngữ nguồn + đích |
| `import` | Hợp nhất các bản dịch `.xliff` đã được đánh giá vào các tệp ngôn ngữ |

| Tùy chọn (Option) | Hiệu ứng (Effect) |
|--------|--------|
| `--locale <code>` | Ngôn ngữ đích để xuất (bắt buộc) |
| `--out <path>` | Đường dẫn hoặc thư mục đầu ra tùy chỉnh |
| `--dry` | Xem trước quá trình nhập mà không ghi tệp |

Xem [Làm việc với Dịch giả Chuyên nghiệp](/docs/guides/professional-translators) để biết toàn bộ quy trình làm việc.

---

## status

Hiển thị cấu hình cặp ngôn ngữ, các plugin đã cài đặt, các cấp độ chất lượng và điểm chuẩn (benchmark scores).

```bash
i18n-rosetta status
```

---

## provenance

Kiểm tra giấy phép tài nguyên dịch thuật cho tất cả các plugin đã cài đặt.

```bash
i18n-rosetta provenance
```

---

## plugin

Quản lý các plugin phương thức dịch thuật. Plugin là các công thức dịch thuật được đóng gói sẵn, cài đặt vào `.rosetta/methods/`.

```bash
i18n-rosetta plugin list                      # show installed plugins
i18n-rosetta plugin install ./my-method/      # install from local directory
i18n-rosetta plugin remove crk-coached-v1     # remove a plugin
```

Xem [Đặc tả Plugin](/docs/reference/plugin-spec) để biết định dạng manifest của plugin.

---

## fonts

Tải xuống và quản lý các phông chữ web PUA cho các bộ chuyển đổi hệ chữ viết của ngôn ngữ nhân tạo (constructed language). Các ngôn ngữ sử dụng các ký tự trong Vùng sử dụng riêng (Private Use Area) (như Klingon, Sindarin, Kryptonian) cần các phông chữ web tùy chỉnh để hiển thị hệ chữ viết của chúng. Lệnh này tải chúng xuống từ các kho lưu trữ mã nguồn mở đã được xác minh.

```bash
i18n-rosetta fonts list                           # show needed fonts
i18n-rosetta fonts install                        # download all needed fonts
i18n-rosetta fonts install --css                  # also generate CSS snippet
i18n-rosetta fonts install --dir ./public/fonts   # custom output directory
```

| Lệnh phụ (Subcommand) | Đầu ra (Output) |
|------------|--------|
| `list` | Hiển thị các phông chữ PUA nào cần thiết và trạng thái cài đặt của chúng |
| `install` | Tải xuống phông chữ cho các ngôn ngữ đã cấu hình |

| Tùy chọn (Option) | Hiệu ứng (Effect) |
|--------|--------|
| `--dir <path>` | Ghi đè thư mục đầu ra của phông chữ (tự động phát hiện từ loại dự án) |
| `--css` | Tạo một đoạn mã `conlang-fonts.css` cùng với các phông chữ |
| `--config <path>` | Đường dẫn đến tệp cấu hình (dùng để phát hiện ngôn ngữ nào cần phông chữ) |

**Tự động phát hiện:** Thư mục đầu ra được suy luận từ cấu trúc dự án của bạn:
- **Docusaurus** → `static/fonts/` hoặc `website/static/fonts/`
- **Hugo** → `static/fonts/`
- **Mặc định** → `public/fonts/`

**Các bộ chuyển đổi Unicode gốc** (`crk` → Cree Syllabics, `sr` → Serbian Cyrillic) KHÔNG yêu cầu cài đặt phông chữ.

Xem [Ngôn ngữ nhân tạo, Hệ chữ viết & Chính tả](/docs/guides/conlangs-scripts-orthography) để biết đầy đủ chi tiết về phông chữ PUA.

## Pipeline ba lớp

Sử dụng kết hợp `lint`, `sync` và `audit` để có hệ thống i18n chống lỗi hoàn hảo:

```json title="package.json"
{
  "scripts": {
    "i18n:lint": "i18n-rosetta lint",
    "i18n:sync": "i18n-rosetta sync",
    "i18n:audit": "i18n-rosetta audit"
  }
}
```

| Lớp (Layer) | Lệnh (Command) | Khi nào (When) | Mục đích (Purpose) |
|-------|---------|------|---------|
| **Lint** | `lint` | Pre-commit | Chặn các commit chứa chuỗi hardcode |
| **Sync** | `sync` | Post-commit / CI | Dịch các khóa bị thiếu và đã thay đổi |
| **Verify** | `verify` | Post-sync / CI | Xác nhận các bản dịch đã tồn tại và chính xác |
| **Audit** | `audit` | Bước Build | Đánh lỗi triển khai nếu bất kỳ ngôn ngữ nào có điểm đánh dấu `[EN]` |

---

## Xem thêm

- [Cấu hình](/docs/getting-started/configuration) — tài liệu tham khảo tệp cấu hình
- [Các phương thức dịch thuật](/docs/guides/translation-methods) — lựa chọn phương thức cho từng cặp ngôn ngữ
- [Bộ nhớ dịch thuật](/docs/concepts/translation-memory) — bộ nhớ đệm và tiết kiệm chi phí
- [Làm việc với Dịch giả Chuyên nghiệp](/docs/guides/professional-translators) — quy trình làm việc XLIFF
- [Đặc tả Plugin](/docs/reference/plugin-spec) — định dạng manifest của plugin
- [Hướng dẫn CI/CD](/docs/guides/ci-cd) — tự động hóa các lệnh CLI trong pipeline của bạn
- [Cách Sync hoạt động](/docs/concepts/how-sync-works) — hiểu về pipeline đồng bộ
- [Cổng chất lượng (Quality Gate)](/docs/concepts/quality-gate) — cách các bản dịch được xác thực