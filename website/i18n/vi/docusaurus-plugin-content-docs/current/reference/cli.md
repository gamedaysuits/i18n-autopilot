---
sidebar_position: 1
title: "Tài liệu tham khảo CLI"
---
# Tham chiếu CLI

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

Chạy `i18n-rosetta <command> --help` để xem trợ giúp chi tiết về bất kỳ lệnh nào.

## Tùy chọn toàn cục

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
--concurrency <n>       Max parallel API calls (sets both JSON and content, default: 48)
--json-concurrency <n>  Max parallel locale translations for JSON keys (default: 200)
--content-concurrency <n> Max parallel API calls for content translation (default: 48)
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

Trình hướng dẫn thiết lập tương tác giúp tạo `i18n-rosetta.config.json`. Hướng dẫn bạn chọn ngôn ngữ nguồn, ngôn ngữ đích, định dạng tệp và mô hình dịch thuật.

```bash
i18n-rosetta init                          # interactive wizard
i18n-rosetta init --yes                    # skip wizard, use defaults
i18n-rosetta init --yes --langs fr,de,ja   # quick setup with specific languages
i18n-rosetta init --source en --dir ./i18n # overrides with defaults
```

**Tùy chọn `--langs`**: Danh sách các mã ngôn ngữ đích phân tách bằng dấu phẩy. Bỏ qua lời nhắc chọn ngôn ngữ và áp dụng các cài đặt trước (preset) về văn phong mặc định cho từng ngôn ngữ. Kết hợp với `--yes` để thiết lập hoàn toàn không tương tác.

**Cài đặt trước ngôn ngữ**: Khi được nhắc chọn ngôn ngữ đích, bạn có thể nhập tên các cài đặt trước:
- `european` → fr, de, es, it, pt, nl
- `asian` → ja, zh, ko
- `global` → fr, es, de, ja, zh, ko, pt, ar
- `nordic` → da, fi, nb, sv

Kết hợp các cài đặt trước và mã ngôn ngữ riêng lẻ: `european, ja` → fr, de, es, it, pt, nl, ja

---

## sync

Dịch các khóa (key) bị thiếu và cũ trên tất cả các tệp ngôn ngữ (locale). Chạy xác minh sau đồng bộ theo mặc định.

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

**Translation Memory (Bộ nhớ dịch)**: Theo mặc định, `sync` tải `.rosetta/tm.json` và cung cấp các bản dịch được lưu trong bộ nhớ cache cho các giá trị nguồn không thay đổi. Sử dụng `--no-tm` để bỏ qua bộ nhớ cache (hữu ích khi chuyển đổi nhà cung cấp dịch vụ dịch thuật hoặc gỡ lỗi chất lượng). Xem [Translation Memory](/docs/concepts/translation-memory).

**Phát hiện thay đổi**: rosetta lưu trữ các mã băm SHA-256 trong `.i18n-rosetta.lock`. Khi các giá trị nguồn thay đổi, lần đồng bộ tiếp theo sẽ tự động dịch lại các khóa đó. Hãy commit tệp lock này để tất cả các nhà phát triển cùng chia sẻ một cơ sở (baseline) chung.

**Xử lý song song**: Cả quá trình dịch khóa JSON và dịch nội dung đều chạy song song. Các ngôn ngữ JSON được dịch đồng thời (mặc định: 200 ngôn ngữ đồng thời), với các lô (batch) trong mỗi ngôn ngữ cũng được chạy song song (4 lô đồng thời). Quá trình dịch nội dung (Markdown, MDX, bài đăng blog) chạy trong một nhóm mục công việc phẳng (mặc định: 48 lệnh gọi API đồng thời). Ghi đè bằng `--json-concurrency`, `--content-concurrency`, hoặc `--concurrency` (thiết lập cả hai).

**Đầu ra**: Lệnh sync hiển thị banner phiên bản, phát hiện định dạng/framework, ước tính chi phí và thanh tiến trình cho từng ngôn ngữ:

```
i18n-rosetta v3.3.2

[INFO] Detected format: json (auto)
[INFO] Source: en.json (2,847 keys)
[INFO] Pairs: es-MX:llm, fr:deepl

[INFO] es-MX.json — 2,847 missing
     ████████████████████████████████ 2,847/2,847 keys
[INFO] fr.json — 2,847 missing
     ████████████████████████████████ 2,847/2,847 keys
[OK] Synced 5,694 keys total.
```

Các thanh tiến trình cập nhật tại chỗ sau mỗi lô (~80 khóa). Sử dụng `--quiet` để chỉ hiển thị lỗi/cảnh báo, hoặc `--json` để xuất đầu ra NDJSON cho máy đọc. Cả hai tùy chọn này đều ẩn thanh tiến trình và banner.

---

## watch

Tự động đồng bộ khi tệp ngôn ngữ nguồn thay đổi. Chạy liên tục cho đến khi bị ngắt bằng `Ctrl+C`.

```bash
i18n-rosetta watch
```

---

## audit

Liệt kê tất cả các giá trị dự phòng (fallback) chưa được dịch có tiền tố `[EN]` từ các lần chạy trước. Thoát với mã 1 nếu tìm thấy bất kỳ giá trị nào — sử dụng như một cổng CI để đánh rớt (fail) các bản dựng có bản dịch chưa hoàn chỉnh.

```bash
i18n-rosetta audit
```

---

## verify

Đọc lại tất cả các tệp ngôn ngữ từ đĩa và xác minh các bản dịch thực sự tồn tại và chính xác. Đây là cùng một quá trình xác minh chạy tự động ở cuối mỗi lệnh `sync` (trừ khi truyền vào `--no-verify`).

```bash
i18n-rosetta verify                    # verify all locale files
i18n-rosetta verify --warn-only        # non-blocking
i18n-rosetta verify && echo "All good" # CI gate
```

**Những gì được kiểm tra:**
- Sự tương đương của khóa — tất cả các khóa nguồn đều có mặt trong từng ngôn ngữ đích
- Các điểm đánh dấu dự phòng `[EN]` từ các lần chạy trước
- Bản dịch trống
- Tuân thủ hệ thống chữ viết — các ngôn ngữ phi Latinh phải có bản dịch phi ASCII
- Bảo toàn trình giữ chỗ (placeholder) — các trình giữ chỗ ICU khớp với nguồn
- Vấn đề mã hóa — dấu BOM, ký tự ẩn
- Lặp lại nguồn — các giá trị giống hệt với nguồn (cảnh báo)

---

## lint

Quét mã nguồn để tìm các chuỗi hiển thị cho người dùng được mã hóa cứng (hardcode) mà lẽ ra nên sử dụng các lệnh gọi dịch i18n. Tự động phát hiện framework của bạn (next-intl, react-i18next, vue-i18n, Hugo).

```bash
i18n-rosetta lint                    # exits 1 if issues found
i18n-rosetta lint --warn-only        # always exits 0
i18n-rosetta lint --src ./app        # custom source directory
i18n-rosetta lint --min-length 4     # minimum string length to flag
```

**Những gì được phát hiện:**
- Chuỗi mã hóa cứng trong văn bản JSX, `placeholder`, `alt`, `aria-label`, `title`
- Các tệp có nội dung hiển thị cho người dùng nhưng không import framework i18n
- Khóa chết — các khóa ngôn ngữ không được tệp mã nguồn nào tham chiếu đến
- Điểm độ phủ — tỷ lệ phần trăm các chuỗi đi qua i18n

**Ngoại trừ**: Tạo `.rosettaignore` trong thư mục gốc của dự án (các mẫu glob, ví dụ như `.gitignore`).

---

## wrap

Tự động bọc các chuỗi mã hóa cứng được `lint` phát hiện vào trong các lệnh gọi `t()`. Tự động tạo bản sao lưu trước khi sửa đổi tệp.

```bash
i18n-rosetta wrap                    # auto-wrap with backup
i18n-rosetta wrap --dry              # preview wrapping changes
i18n-rosetta wrap --undo             # restore from .rosetta-backup/
```

**Các chốt an toàn:**
1. Kiểm tra trạng thái Git sạch (bỏ qua trong chế độ chạy thử - dry-run)
2. Tự động sao lưu vào `.rosetta-backup/`
3. Xem trước các thay đổi (diff) trước khi ghi từng tệp
4. Hỗ trợ `--undo` để khôi phục từ bản sao lưu

---

## seo

Tạo các thành phần SEO cho các trang web đa ngôn ngữ.

```bash
i18n-rosetta seo hreflang                                        # print hreflang tags
i18n-rosetta seo sitemap --base-url https://example.com --out sitemap.xml
i18n-rosetta seo jsonld --base-url https://example.com           # JSON-LD schema
```

| Lệnh phụ (Subcommand) | Đầu ra (Output) |
|------------|--------|
| `hreflang` | Các thẻ `<link rel="alternate" hreflang>` |
| `sitemap` | `sitemap.xml` đa ngôn ngữ |
| `jsonld` | Schema ngôn ngữ JSON-LD WebSite |

---

## integrity

Phát hiện sự hỏng hóc và sai lệch trong các tệp ngôn ngữ đã dịch.

```bash
i18n-rosetta integrity               # exits 1 if issues found
i18n-rosetta integrity --warn-only   # non-blocking
```

**Những gì được kiểm tra:**
- Hỏng trình giữ chỗ (ví dụ: `{name}` có trong nguồn nhưng thiếu ở đích)
- Vấn đề mã hóa (lỗi hiển thị ký tự mojibake, Unicode không hợp lệ)
- Bản sao chưa dịch (giá trị đích giống hệt nguồn)
- Khóa mồ côi (các khóa ở đích không tồn tại trong nguồn)
- Tính đầy đủ của danh mục số nhiều ICU MessageFormat (ví dụ: tiếng Ả Rập cần 6 danh mục)

---

## tm

Quản lý bộ nhớ cache Translation Memory (`.rosetta/tm.json`). TM lưu trữ các bản dịch trước đó và cung cấp chúng trong các lần đồng bộ tiếp theo thay vì gọi API.

```bash
i18n-rosetta tm stats                  # show cache statistics
i18n-rosetta tm clear                  # clear cache (with confirmation)
i18n-rosetta tm clear --yes            # clear without confirmation
i18n-rosetta tm clear --locale fr      # clear only French entries
```

| Lệnh phụ | Đầu ra |
|------------|--------|
| `stats` | Số lượng mục nhập, kích thước tệp, phân tích chi tiết theo từng ngôn ngữ |
| `clear` | Xóa tệp cache (toàn bộ hoặc theo từng ngôn ngữ) |

| Tùy chọn | Tác dụng |
|--------|--------|
| `--locale <code>` | Chỉ xóa các mục nhập cho một ngôn ngữ |
| `--yes` | Bỏ qua lời nhắc xác nhận |

Xem [Translation Memory](/docs/concepts/translation-memory) để biết cách TM hoạt động và khi nào cần xóa nó.

---

## xliff

Xuất và nhập các tệp XLIFF 1.2 để các dịch giả chuyên nghiệp đánh giá. XLIFF là định dạng trao đổi phổ quát được hỗ trợ bởi các công cụ CAT như memoQ, SDL Trados và Phrase.

```bash
i18n-rosetta xliff export --locale fr                   # export French XLIFF
i18n-rosetta xliff export --locale ja --out ./review/   # custom output path
i18n-rosetta xliff import .rosetta/xliff/fr.xliff       # import reviewed file
i18n-rosetta xliff import ./reviewed.xliff --dry        # preview import
```

| Lệnh phụ | Đầu ra |
|------------|--------|
| `export` | Tạo `.xliff` từ các tệp ngôn ngữ nguồn + đích |
| `import` | Hợp nhất các bản dịch `.xliff` đã được đánh giá vào các tệp ngôn ngữ |

| Tùy chọn | Tác dụng |
|--------|--------|
| `--locale <code>` | Ngôn ngữ đích để xuất (bắt buộc) |
| `--out <path>` | Đường dẫn hoặc thư mục đầu ra tùy chỉnh |
| `--dry` | Xem trước quá trình nhập mà không ghi tệp |

Xem [Làm việc với Dịch giả Chuyên nghiệp](/docs/guides/professional-translators) để biết toàn bộ quy trình làm việc.

---

## status

Hiển thị cấu hình cặp ngôn ngữ, các plugin đã cài đặt, các cấp độ chất lượng và điểm chuẩn (benchmark).

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

Quản lý các plugin phương thức dịch. Plugin là các công thức dịch được đóng gói sẵn và cài đặt vào `.rosetta/methods/`.

```bash
i18n-rosetta plugin list                      # show installed plugins
i18n-rosetta plugin install ./my-method/      # install from local directory
i18n-rosetta plugin remove crk-coached-v1     # remove a plugin
```

Xem [Đặc tả Plugin](/docs/reference/plugin-spec) để biết định dạng manifest của plugin.

---

## fonts

Tải xuống và quản lý các phông chữ web PUA cho các bộ chuyển đổi hệ thống chữ viết của ngôn ngữ nhân tạo. Các ngôn ngữ sử dụng ký tự Private Use Area (Klingon, Sindarin, Kryptonian) cần các phông chữ web tùy chỉnh để hiển thị chữ viết của chúng. Lệnh này tải chúng xuống từ các kho lưu trữ mã nguồn mở đã được xác minh.

```bash
i18n-rosetta fonts list                           # show needed fonts
i18n-rosetta fonts install                        # download all needed fonts
i18n-rosetta fonts install --css                  # also generate CSS snippet
i18n-rosetta fonts install --dir ./public/fonts   # custom output directory
```

| Lệnh phụ | Đầu ra |
|------------|--------|
| `list` | Hiển thị các phông chữ PUA nào cần thiết và trạng thái cài đặt của chúng |
| `install` | Tải xuống phông chữ cho các ngôn ngữ đã định cấu hình |

| Tùy chọn | Tác dụng |
|--------|--------|
| `--dir <path>` | Ghi đè thư mục đầu ra của phông chữ (tự động phát hiện từ loại dự án) |
| `--css` | Tạo một đoạn mã `conlang-fonts.css` cùng với các phông chữ |
| `--config <path>` | Đường dẫn đến tệp cấu hình (dùng để phát hiện ngôn ngữ nào cần phông chữ) |

**Tự động phát hiện:** Thư mục đầu ra được suy luận từ cấu trúc dự án của bạn:
- **Docusaurus** → `static/fonts/` hoặc `website/static/fonts/`
- **Hugo** → `static/fonts/`
- **Mặc định** → `public/fonts/`

**Các bộ chuyển đổi Unicode gốc** (`crk` → Cree Syllabics, `sr` → Serbian Cyrillic) KHÔNG yêu cầu cài đặt phông chữ.

Xem [Ngôn ngữ nhân tạo, Hệ thống chữ viết & Chính tả](/docs/guides/conlangs-scripts-orthography) để biết chi tiết đầy đủ về phông chữ PUA.

## Luồng xử lý ba lớp

Sử dụng kết hợp `lint`, `sync` và `audit` để có hệ thống i18n hoàn hảo:

```json title="package.json"
{
  "scripts": {
    "i18n:lint": "i18n-rosetta lint",
    "i18n:sync": "i18n-rosetta sync",
    "i18n:audit": "i18n-rosetta audit"
  }
}
```

| Lớp (Layer) | Lệnh | Khi nào | Mục đích |
|-------|---------|------|---------|
| **Lint** | `lint` | Pre-commit | Chặn các commit chứa chuỗi mã hóa cứng |
| **Sync** | `sync` | Post-commit / CI | Dịch các khóa bị thiếu và đã thay đổi |
| **Verify** | `verify` | Post-sync / CI | Xác nhận các bản dịch tồn tại và chính xác |
| **Audit** | `audit` | Bước Build | Đánh rớt (fail) quá trình triển khai nếu có bất kỳ ngôn ngữ nào chứa điểm đánh dấu `[EN]` |

---

## Xem thêm

- [Cấu hình](/docs/getting-started/configuration) — tham chiếu tệp cấu hình
- [Phương thức dịch](/docs/guides/translation-methods) — lựa chọn phương thức cho từng cặp ngôn ngữ
- [Translation Memory](/docs/concepts/translation-memory) — lưu cache và tiết kiệm chi phí
- [Làm việc với Dịch giả Chuyên nghiệp](/docs/guides/professional-translators) — quy trình làm việc XLIFF
- [Đặc tả Plugin](/docs/reference/plugin-spec) — định dạng manifest của plugin
- [Hướng dẫn CI/CD](/docs/guides/ci-cd) — tự động hóa các lệnh CLI trong luồng xử lý của bạn
- [Cách Sync hoạt động](/docs/concepts/how-sync-works) — hiểu về luồng xử lý đồng bộ
- [Cổng Chất lượng](/docs/concepts/quality-gate) — cách các bản dịch được xác thực