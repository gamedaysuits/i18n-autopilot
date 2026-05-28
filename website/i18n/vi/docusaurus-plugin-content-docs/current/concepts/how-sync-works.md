---
sidebar_position: 2
title: "Cách Đồng bộ hóa hoạt động"
---
# Cách hoạt động của Sync

Lệnh `sync` là hoạt động cốt lõi của rosetta. Dưới đây là những gì diễn ra khi bạn chạy `npx i18n-rosetta sync`.

## Tổng quan về Pipeline

```mermaid
flowchart TD
    A["Load config\n+ resolve pairs"] --> B["Scan source locale\n(flatten nested keys)"]
    B --> C["Load lock file\n(.i18n-rosetta.lock)"]
    C --> D["Diff: find missing\nand stale keys"]
    D --> TM{"TM lookup"}
    TM -->|Hits| TC["Serve from cache"]
    TM -->|Misses| E{"Keys to translate?"}
    E -->|No| F["Done ✓"]
    E -->|Yes| G["Batch keys\n(default 80/batch)"]
    G --> H["Translate batch\n(method-specific)"]
    H --> I["Quality gate\n(validate each key)"]
    I --> TERM["Terminology check\n(coached pairs)"]
    TERM --> J{"All pass?"}
    J -->|Yes| K["Write to locale file"]
    J -->|Failures| L["Retry cascade:\nfull → half → individual"]
    L --> H
    TC --> I
    K --> TMS["Store new entries\nin TM"]
    TMS --> M["Update lock file\n(SHA-256 hashes)"]
    M --> N["Next pair"]
```

## Từng bước thực hiện

### 1. Phân giải cấu hình

Rosetta tải `i18n-rosetta.config.json` (hoặc tự động phát hiện các cài đặt). Nó sẽ phân giải:
- Locale nguồn và các locale đích
- Đồ thị cặp (các tổ hợp nguồn→đích nào cần xử lý)
- Các cài đặt về phương thức, model và chất lượng cho từng cặp

Trước khi quét các file, rosetta in ra một header khởi động:

```
i18n-rosetta v3.3.1

[INFO] Detected format: json (auto)
[INFO] Detected framework: Hugo
```

- **Banner phiên bản**: Hiển thị phiên bản đã cài đặt để phục vụ việc debug và báo lỗi.
- **Phát hiện định dạng**: Báo cáo định dạng file và cho biết nó được tự động phát hiện `(auto)` hay được cấu hình rõ ràng `(config)`. Hỗ trợ `json`, `toml`, và `yaml`.
- **Phát hiện framework**: Khi `contentDir` được thiết lập, nó sẽ xác định framework (`Hugo`) để xác nhận tính năng đồng bộ nội dung (content sync) đang hoạt động.

### 2. Quét nguồn

File locale nguồn được tải và làm phẳng (flatten) thành một map dạng key→value:

```json
// Input (nested)
{ "hero": { "title": "Welcome", "subtitle": "Build" } }

// Flattened
{ "hero.title": "Welcome", "hero.subtitle": "Build" }
```

### 3. Phát hiện thay đổi

Rosetta đọc `.i18n-rosetta.lock`, nơi lưu trữ các mã băm SHA-256 của các giá trị nguồn đã được dịch trước đó. Với mỗi key, nó sẽ kiểm tra:

| Điều kiện | Hành động |
|-----------|--------|
| Key bị thiếu ở đích | **Dịch** |
| Hash nguồn đã thay đổi kể từ lần đồng bộ trước | **Dịch lại** (cũ) |
| Giá trị đích bắt đầu bằng `[EN]` | **Dịch lại** (dấu hiệu fallback cũ) |
| Hash nguồn không đổi, key đã tồn tại | **Bỏ qua** |

Đây là lý do tại sao rosetta chỉ dịch những gì đã thay đổi — nó không dịch lại toàn bộ file của bạn trong mỗi lần đồng bộ.

### 4. Chia lô (Batching)

Các key được nhóm thành các lô (mặc định: 80 key/lô đối với LLM, 128 đối với Google Translate). Việc chia lô giúp giảm số vòng gọi API trong khi vẫn giữ cho các prompt ở mức dễ quản lý.

Trong quá trình dịch, rosetta hiển thị một thanh tiến trình nội tuyến (inline progress bar) cập nhật sau khi mỗi lô hoàn thành:

```
[INFO] fr.json — 2,847 missing
     ████████████████░░░░░░░░░░░░░░░░ 1,440/2,847 keys
```

Thanh tiến trình được render bằng ký tự carriage return `\r` để cập nhật tại chỗ — không bị cuộn trang. Bị ẩn đi trong các chế độ `--quiet` và `--json`.

### 4b. Bộ nhớ dịch (Translation Memory)

Trước khi chia lô, rosetta kiểm tra bộ nhớ cache của Translation Memory (`.rosetta/tm.json`). Các key có văn bản nguồn + locale + phương thức khớp với một bản dịch trước đó sẽ được phục vụ ngay lập tức từ cache — không cần gọi API.

```
  [TM] 142 key(s) served from cache
  Translating 3 key(s) to French (llm)... [OK]
```

TM là cơ chế tiết kiệm chi phí chính. Việc chạy lại sync sau khi thay đổi một key duy nhất sẽ chỉ dịch key đó, không phải toàn bộ file. Xem [Translation Memory](/docs/concepts/translation-memory) để biết thêm chi tiết.

Để bỏ qua cache cho một lần chạy: `i18n-rosetta sync --no-tm`

### 5. Dịch thuật

Mỗi lô được gửi đến phương thức dịch đã cấu hình:

- **`llm`**: Prompt có cấu trúc gửi đến OpenRouter kèm theo các hướng dẫn về văn phong (register) và giới tính
- **`llm-coached`**: Tương tự, nhưng được tiêm thêm các quy tắc ngữ pháp, từ điển và ghi chú về văn phong
- **`google-translate`**: Yêu cầu theo lô của Google Cloud Translation API v2
- **`api`**: HTTP POST đến một endpoint từ xa

System message (văn phong, hướng dẫn giới tính, quy tắc) là giống hệt nhau giữa các lô cho một locale nhất định, cho phép **prompt caching** — các nhà cung cấp như Anthropic và Google sẽ cache các system message lặp lại, giúp giảm chi phí token.

### 6. Cổng chất lượng (Quality Gate)

Mọi bản dịch đều được xác thực trước khi ghi vào ổ đĩa. Có 5 bước kiểm tra được chạy:

| Kiểm tra | Lỗi phát hiện được | Ví dụ |
|-------|----------------|---------|
| **Trống/rỗng** | Model không trả về gì | `""` |
| **Lặp lại nguồn** | Model trả về đầu vào tiếng Anh | `"Welcome"` cho tiếng Nhật |
| **Vòng lặp ảo giác** | Các trigram bị lặp lại | `"Qo' Qo' Qo' Qo'"` |
| **Phình to độ dài** | Đầu ra dài hơn 4 lần so với nguồn | Nguồn 10 ký tự → Đầu ra 50 ký tự |
| **Tuân thủ hệ chữ viết** | Sai hệ chữ viết cho locale | Văn bản Latinh cho locale tiếng Ả Rập |

Các lỗi thất bại được log lại với tiền tố `[GATE]`. Không có fallback ngầm.

Xem [Quality Gate](/docs/concepts/quality-gate) để biết thêm chi tiết.

### 6b. Xác minh thuật ngữ

Đối với các cặp được huấn luyện (coached) có từ điển, rosetta kiểm tra xem LLM có thực sự sử dụng thuật ngữ được yêu cầu sau khi dịch hay không. Các vi phạm được log lại dưới dạng cảnh báo `[TERM]`:

```
[TERM] en→fr: 2 term violation(s)
  • "dashboard" → expected "tableau de bord" but got "panneau"
```

Đây chỉ là các cảnh báo, không phải lỗi chặn (blocking errors) — bản dịch vẫn được ghi lại.

### 7. Chuỗi thử lại (Retry Cascade)

Khi gặp lỗi phân tích cú pháp JSON hoặc lỗi ở cấp độ lô, rosetta sẽ thử lại với các lô nhỏ dần:

```
Full batch (80 keys) → Failed
  └→ Half batch (40 keys) → 1 failure
      └→ Individual keys (1 each) → Isolates the problem key
```

Ngân sách thử lại được giới hạn bởi `maxRetries` (mặc định: 3) để ngăn chặn việc tiêu tốn token mất kiểm soát.

### 8. Ghi và Khóa (Write & Lock)

Các bản dịch đạt yêu cầu được ghi vào file locale đích, giữ nguyên cấu trúc lồng nhau ban đầu. File lock được cập nhật với các mã băm SHA-256 mới.

### 9. Xác minh

Sau khi tất cả các cặp được xử lý, rosetta đọc lại các file locale đã ghi từ ổ đĩa và chạy một bước xác minh (trừ khi `--no-verify` được thiết lập). Điều này giúp bắt được khoảng hở giữa việc sync báo cáo thành công và các key thực tế bị sai:

- **Tính chẵn lẻ của key (Key parity)** — tất cả các key nguồn đều có mặt trong mỗi đích
- **Các dấu hiệu fallback `[EN]`** — các dấu hiệu cũ từ những lần chạy trước
- **Bản dịch trống** — các giá trị rỗng bị lọt qua
- **Tuân thủ hệ chữ viết** — các locale phi Latinh nhưng có bản dịch chỉ chứa ASCII
- **Bảo toàn placeholder** — các placeholder ICU khớp với nguồn
- **Vấn đề mã hóa** — các dấu BOM, ký tự vô hình

Tính năng này cũng có sẵn dưới dạng một lệnh `i18n-rosetta verify` độc lập dành cho các cổng CI.

## Dịch nội dung (Giai đoạn 2)

Đối với các dự án Docusaurus và Hugo, `sync` chạy giai đoạn thứ hai sau khi dịch key JSON. Giai đoạn này dịch các file Markdown và MDX (tài liệu, bài viết blog, hướng dẫn) bằng cách sử dụng cùng các phương thức và cổng chất lượng.

### Cách hoạt động

1. Rosetta khám phá tất cả các file nội dung nguồn (`.md`, `.mdx`) bằng cách duyệt qua thư mục content/docs
2. Với mỗi cặp file × locale, nó kiểm tra một file lock nội dung riêng biệt (`.i18n-rosetta-content.lock`) để tìm các thay đổi của mã băm SHA-256
3. Các file bị thay đổi hoặc bị thiếu được thu thập vào một pool work-item phẳng
4. Pool này được xử lý với **tính đồng thời song song** (mặc định: 12 lệnh gọi API cùng lúc)

```
Phase 2: content (79 translations to process, 341 skipped, concurrency: 12)

    [1/79] (1%)  docs/concepts/security.md → ja [RE-TRANSLATE] (~3328s left)
    [2/79] (3%)  docs/concepts/security.md → th [RE-TRANSLATE] (~1821s left)
    ...
    [79/79] (100%) blog/v3-2-quality.md → de [OK]

  [OK] Created 79 content file(s), 341 unchanged
```

### Tính song song

Cả Giai đoạn 1 (key JSON) và Giai đoạn 2 (nội dung) hiện đều chạy song song:

- **Giai đoạn 1**: Tất cả các bản dịch locale được kích hoạt đồng thời (mặc định: 50 locale cùng lúc). Trong mỗi locale, các lô API cũng chạy song song (4 lô đồng thời). Một lần sync 12 locale với 120 key sẽ hoàn thành trong ~1 phút thay vì ~15 phút.
- **Giai đoạn 2**: Tất cả các tổ hợp file×locale được dịch dưới dạng một pool phẳng (mặc định: 12 lệnh gọi API cùng lúc). Các file khác nhau và các locale khác nhau được dịch đồng thời.

Kiểm soát tính song song bằng `--json-concurrency`, `--content-concurrency`, hoặc `--concurrency` (thiết lập cả hai):

```bash
# Faster JSON sync (more parallel locale translations)
npx i18n-rosetta sync --json-concurrency 30

# Faster content sync (more parallel API calls)
npx i18n-rosetta sync --content-concurrency 20

# Slower (gentler on rate limits)
npx i18n-rosetta sync --concurrency 4
```

### Bảo vệ nội dung

Trong quá trình dịch, rosetta che chắn các nội dung không thể dịch:

- **Khối code (Code blocks)** (được rào lại và thụt lề) được thay thế bằng các placeholder
- Các trường **Frontmatter** không nằm trong danh sách `translatableFields` được giữ nguyên
- **Liên kết (Links)**, đường dẫn hình ảnh và các thẻ HTML được bảo vệ
- **Shortcode** và các biến nội suy (ví dụ: `{count}`, `{{.Params.title}}`) được che chắn

Sau khi dịch, tất cả các placeholder được khôi phục và xác thực. Nếu có bất kỳ placeholder nào bị thiếu hoặc hỏng, bản dịch sẽ bị từ chối và thử lại.

## Thành công một phần

Một lô thất bại không làm chặn các lô còn lại. Nếu 9 trong số 10 lô thành công, 9 lô đó sẽ được ghi lại. Lô thất bại sẽ được log lại và bạn có thể chạy lại `sync` để thử lại.

## Chạy thử (Dry Run)

Xem trước những gì sẽ thay đổi mà không ghi bất kỳ file nào:

```bash
npx i18n-rosetta sync --dry-run
```

## Bắt buộc dịch lại

Bắt buộc dịch lại các key cụ thể ngay cả khi không có thay đổi:

```bash
npx i18n-rosetta sync --force-keys "hero.title,nav.about"
```

## Ước tính chi phí

Trước khi dịch, rosetta tạo ra một **báo cáo chi phí trước khi sync** hiển thị chi phí ước tính cho từng cặp. Quá trình này chạy tự động trong mỗi lần `sync` — bạn sẽ thấy nó trước khi bất kỳ lệnh gọi API nào được thực hiện.

```
╔══════════════════════════════════════════════════════════╗
║  Cost Estimate                                          ║
╠════════════╦═══════╦════════════╦════════════════════════╣
║ Pair       ║ Keys  ║ Est. Cost  ║ Method                 ║
╠════════════╬═══════╬════════════╬════════════════════════╣
║ en → fr    ║   142 ║ $0.07      ║ google-translate       ║
║ en → ja    ║    38 ║   —        ║ llm (model-dependent)  ║
║ en → crk   ║    38 ║   —        ║ llm-coached            ║
╚════════════╩═══════╩════════════╩════════════════════════╝
```

### Những gì được ước tính

Mỗi phương thức dịch cung cấp ước tính chi phí riêng:

| Phương thức | Cơ sở chi phí | Độ chính xác |
|--------|-----------|-----------|
| `google-translate` | Mức giá công bố của Google ($20/triệu ký tự) | Chính xác |
| `llm` | Thay đổi theo model OpenRouter | Phụ thuộc vào model — xem [Bảng giá OpenRouter](https://openrouter.ai/models) |
| `llm-coached` | Giống như `llm` cộng thêm token ngữ cảnh huấn luyện | Phụ thuộc vào model |
| `api` | Do server quyết định | Không xác định — không thể ước tính nếu không truy vấn endpoint |

Khi một phương thức không thể xác định chi phí (các phương thức LLM, API từ xa), rosetta sẽ báo cáo `—` thay vì đoán. Sử dụng `--dry` để xem ước tính chi phí mà không thực sự tiến hành dịch.

---

## Xem thêm

- [Tham chiếu CLI — sync](/docs/reference/cli#sync) — các cờ và tùy chọn của lệnh
- [Translation Memory](/docs/concepts/translation-memory) — caching và tiết kiệm chi phí
- [Quality Gate](/docs/concepts/quality-gate) — cách các bản dịch được xác thực
- [Phương thức dịch](/docs/guides/translation-methods) — cách hoạt động của từng phương thức
- [Làm việc với Dịch giả chuyên nghiệp](/docs/guides/professional-translators) — quy trình làm việc với XLIFF
- [Cấu hình](/docs/getting-started/configuration) — tham chiếu cấu hình
- [Hướng dẫn CI/CD](/docs/guides/ci-cd) — tự động hóa quá trình sync trong pipeline của bạn