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
i18n-rosetta status            Show pair configuration, plugins, and quality tiers
i18n-rosetta provenance        Audit translation resource licensing
i18n-rosetta plugin <sub>      Manage method plugins (install, remove, list)
```

Chạy `i18n-rosetta <command> --help` để xem trợ giúp chi tiết về bất kỳ lệnh nào.

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
--dry                   Preview changes without writing files
```

---

## init

Trình hướng dẫn thiết lập tương tác giúp tạo `i18n-rosetta.config.json`. Hướng dẫn bạn qua các bước chọn ngôn ngữ nguồn, ngôn ngữ đích, định dạng tệp và mô hình dịch thuật.

```bash
i18n-rosetta init                          # interactive wizard
i18n-rosetta init --yes                    # skip wizard, use defaults
i18n-rosetta init --yes --langs fr,de,ja   # quick setup with specific languages
i18n-rosetta init --source en --dir ./i18n # overrides with defaults
```

**Tùy chọn `--langs`**: Danh sách các mã ngôn ngữ đích được phân tách bằng dấu phẩy. Bỏ qua lời nhắc chọn ngôn ngữ và áp dụng các cài đặt sẵn về văn phong (register presets) mặc định cho từng ngôn ngữ. Kết hợp với `--yes` để thiết lập hoàn toàn không tương tác.

**Cài đặt sẵn ngôn ngữ**: Khi được nhắc chọn ngôn ngữ đích, bạn có thể nhập tên các cài đặt sẵn (preset):
- `european` → fr, de, es, it, pt, nl
- `asian` → ja, zh, ko
- `global` → fr, es, de, ja, zh, ko, pt, ar
- `nordic` → da, fi, nb, sv

Kết hợp các cài đặt sẵn và mã ngôn ngữ riêng lẻ: `european, ja` → fr, de, es, it, pt, nl, ja

---

## sync

Dịch các khóa (key) bị thiếu, đã cũ và khóa dự phòng (fallback) trên tất cả các tệp ngôn ngữ.

```bash
i18n-rosetta sync                                   # translate everything
i18n-rosetta sync --dry                             # preview only
i18n-rosetta sync --force-keys "hero.title"         # force re-translate
i18n-rosetta sync --force-keys "a.title,a.subtitle" # multiple keys
i18n-rosetta sync --content-dir ./content           # include Hugo Markdown
i18n-rosetta sync --method google-translate          # force Google Translate
i18n-rosetta sync --fallback                         # write [EN] prefixes on failure
```

**Phát hiện thay đổi**: rosetta lưu trữ các mã băm SHA-256 trong `.i18n-rosetta.lock`. Khi các giá trị nguồn thay đổi, lần đồng bộ tiếp theo sẽ tự động dịch lại các khóa đó. Hãy commit tệp lock này để tất cả các nhà phát triển cùng chia sẻ một cơ sở chung (baseline).

---

## watch

Tự động đồng bộ khi tệp ngôn ngữ nguồn thay đổi. Chạy liên tục cho đến khi bị ngắt bằng `Ctrl+C`.

```bash
i18n-rosetta watch
```

---

## audit

Liệt kê tất cả các giá trị dự phòng chưa được dịch có tiền tố `[EN]`. Thoát với mã 1 nếu tìm thấy bất kỳ giá trị nào — sử dụng như một cổng kiểm tra CI để đánh rớt các bản build có bản dịch chưa hoàn chỉnh.

```bash
i18n-rosetta audit
```

---

## lint

Quét mã nguồn để tìm các chuỗi văn bản hiển thị cho người dùng được hardcode (viết cứng) mà lẽ ra nên sử dụng các lệnh gọi dịch thuật i18n. Tự động phát hiện framework của bạn (next-intl, react-i18next, vue-i18n, Hugo).

```bash
i18n-rosetta lint                    # exits 1 if issues found
i18n-rosetta lint --warn-only        # always exits 0
i18n-rosetta lint --src ./app        # custom source directory
i18n-rosetta lint --min-length 4     # minimum string length to flag
```

**Những gì lệnh này phát hiện:**
- Các chuỗi hardcode trong văn bản JSX, `placeholder`, `alt`, `aria-label`, `title`
- Các tệp có nội dung hiển thị cho người dùng nhưng không import framework i18n
- Các khóa chết (dead keys) — các khóa ngôn ngữ không được tệp mã nguồn nào tham chiếu đến
- Điểm bao phủ (Coverage score) — tỷ lệ phần trăm các chuỗi đã được xử lý qua i18n

**Loại trừ**: Tạo `.rosettaignore` trong thư mục gốc của dự án (sử dụng glob pattern, ví dụ như `.gitignore`).

---

## wrap

Tự động bọc các chuỗi hardcode được phát hiện bởi `lint` vào trong các lệnh gọi `t()`. Tự động tạo bản sao lưu trước khi sửa đổi tệp.

```bash
i18n-rosetta wrap                    # auto-wrap with backup
i18n-rosetta wrap --dry              # preview wrapping changes
i18n-rosetta wrap --undo             # restore from .rosetta-backup/
```

**Các chốt an toàn:**
1. Kiểm tra trạng thái Git sạch (Git-clean check) (bỏ qua trong chế độ dry-run)
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

| Lệnh phụ | Đầu ra |
|------------|--------|
| `hreflang` | Các thẻ `<link rel="alternate" hreflang>` |
| `sitemap` | `sitemap.xml` đa ngôn ngữ |
| `jsonld` | Lược đồ ngôn ngữ JSON-LD WebSite |

---

## integrity

Phát hiện lỗi hỏng và sự sai lệch (drift) trong các tệp ngôn ngữ đã dịch.

```bash
i18n-rosetta integrity               # exits 1 if issues found
i18n-rosetta integrity --warn-only   # non-blocking
```

**Những gì lệnh này kiểm tra:**
- Lỗi hỏng placeholder (ví dụ: `{name}` có trong bản nguồn nhưng bị thiếu ở bản đích)
- Lỗi bảng mã (mojibake, Unicode không hợp lệ)
- Các bản sao chưa được dịch (giá trị đích giống hệt giá trị nguồn)
- Các khóa mồ côi (các khóa ở bản đích không tồn tại trong bản nguồn)

---

## status

Hiển thị cấu hình cặp ngôn ngữ, các plugin đã cài đặt, các cấp độ chất lượng (quality tiers) và điểm chuẩn (benchmark scores).

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

## Pipeline ba lớp

Sử dụng kết hợp `lint`, `sync` và `audit` để có hệ thống i18n vững chắc:

```json title="package.json"
{
  "scripts": {
    "i18n:lint": "i18n-rosetta lint",
    "i18n:sync": "i18n-rosetta sync",
    "i18n:audit": "i18n-rosetta audit"
  }
}
```

| Lớp | Lệnh | Khi nào | Mục đích |
|-------|---------|------|---------|
| **Lint** | `lint` | Pre-commit | Chặn các commit chứa chuỗi hardcode |
| **Sync** | `sync` | Post-commit / CI | Dịch các khóa bị thiếu và đã thay đổi |
| **Audit** | `audit` | Bước Build | Đánh rớt quá trình triển khai nếu có bất kỳ ngôn ngữ nào chưa hoàn chỉnh |

---

## Xem thêm

- [Cấu hình](/docs/getting-started/configuration) — tham chiếu tệp cấu hình
- [Phương thức dịch thuật](/docs/guides/translation-methods) — lựa chọn phương thức cho từng cặp ngôn ngữ
- [Đặc tả Plugin](/docs/reference/plugin-spec) — định dạng manifest của plugin
- [Hướng dẫn CI/CD](/docs/guides/ci-cd) — tự động hóa các lệnh CLI trong pipeline của bạn
- [Cách thức hoạt động của Sync](/docs/concepts/how-sync-works) — tìm hiểu về pipeline đồng bộ
- [Cổng chất lượng](/docs/concepts/quality-gate) — cách các bản dịch được xác thực