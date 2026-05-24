---
sidebar_position: 7
title: "So sánh"
---
# So sánh Rosetta

i18n-rosetta thuộc một danh mục khác so với hầu hết các công cụ localization (địa phương hóa). Dưới đây là một so sánh khách quan.

## Bức tranh tổng quan

Hầu hết các công cụ localization thuộc một trong ba danh mục sau:

| Danh mục | Ví dụ | Mô hình |
|----------|----------|-------|
| **Nền tảng Cloud TMS** | Crowdin, Phrase, Locize, Tolgee | Bảng điều khiển SaaS + người dịch + đăng ký hàng tháng |
| **Công cụ trích xuất Key** | i18next-scanner, FormatJS CLI | Quét mã nguồn để tìm các lệnh gọi hàm dịch |
| **Engine dịch CLI** | **i18n-rosetta** | Chạy trong dự án của bạn, dịch file trực tiếp, không cần tài khoản cloud |

Rosetta là một **Engine dịch CLI** — nó dịch trực tiếp các file locale của bạn bằng cách sử dụng các backend có thể cấu hình (LLMs, Google Translate, custom plugins). Không có bảng điều khiển cloud, không có quy trình làm việc cho người dịch, không có phí hàng tháng.

---

## So sánh tính năng

| Tính năng | i18n-rosetta | Crowdin | Phrase | Locize |
|---------|:------------:|:-------:|:------:|:------:|
| **Chạy cục bộ (không cần tài khoản cloud)** | ✅ | ❌ | ❌ | ❌ |
| **Không có dependencies** | ✅ | ❌ | ❌ | ❌ |
| **Cấu hình phương thức cho từng cặp ngôn ngữ** | ✅ | ❌ | ❌ | ❌ |
| **Tùy chỉnh văn phong ngôn ngữ (registers)** | ✅ | ❌ | ❌ | ❌ |
| **Nhận biết nội dung (bảo vệ các khối code)** | ✅ | ❌ | ❌ | ❌ |
| **Chuyển đổi ngôn ngữ nhân tạo (Conlang) & hệ thống chữ viết (script)** | ✅ | ❌ | ❌ | ❌ |
| **Kiến trúc plugin** | ✅ | ❌ | ❌ | ❌ |
| **Dịch Markdown / nội dung** | ✅ | ✅ | ✅ | ❌ |
| **Quy trình cho người dịch** | ❌ | ✅ | ✅ | ✅ |
| **Bộ nhớ dịch (Translation memory)** | ❌ | ✅ | ✅ | ✅ |
| **Chỉnh sửa theo ngữ cảnh (trực quan)** | ❌ | ✅ | ✅ | ✅ |
| **Cộng tác nhóm** | ❌ | ✅ | ✅ | ✅ |
| **Hỗ trợ định dạng file** | JSON, TOML, YAML, MD | 50+ | 40+ | JSON |
| **Giá cả** | Miễn phí (trả phí cho LLM của bạn) | Từ $0/tháng | Từ $0/tháng | Từ $0/tháng |

---

## Khi nào nên sử dụng Rosetta

**Rosetta là lựa chọn phù hợp khi:**

- Bạn muốn tích hợp machine translation (dịch máy) vào build pipeline của mình — chứ không phải một quy trình riêng biệt
- Bạn cần kiểm soát phương thức cho từng ngôn ngữ (dùng LLM cho một số ngôn ngữ, Google Translate cho ngôn ngữ khác, và custom plugins cho phần còn lại)
- Bạn đang dịch sang các ngôn ngữ không được API hỗ trợ (ngôn ngữ bản địa, ngôn ngữ có nguy cơ tuyệt chủng, ngôn ngữ nhân tạo)
- Bạn muốn đầu ra hệ thống chữ viết mang tính tất định (Cree Syllabics, Klingon pIqaD, Tengwar)
- Bạn không muốn bị phụ thuộc vào nhà cung cấp (vendor lock-in) và không muốn phụ thuộc vào cloud
- Bạn là một lập trình viên độc lập hoặc một nhóm nhỏ không cần quy trình làm việc cho người dịch

**Một Cloud TMS sẽ phù hợp hơn khi:**

- Bạn có các dịch giả chuyên nghiệp đánh giá từng chuỗi văn bản
- Bạn cần quản lý translation memory và thuật ngữ (glossary) trên nhiều dự án
- Bạn cần chỉnh sửa trực quan theo ngữ cảnh (xem trước bản dịch ngay trong UI của bạn)
- Bạn có một nhóm lớn với nhu cầu kiểm soát truy cập dựa trên vai trò (role-based access control)
- Bạn cần hỗ trợ hơn 50 định dạng file

---

## Những điều Rosetta làm được mà không công cụ nào khác có

### 1. Tùy chỉnh văn phong (Custom Registers)

Mỗi cặp ngôn ngữ đều có các hướng dẫn về giọng điệu phù hợp với văn hóa dành cho LLM:

```json
{
  "de": {
    "register": "Standard professional register. Use Sie-form for formal address."
  },
  "tl": {
    "register": "Educated Manila Taglish. Use Tagalog as the primary language but keep technical terms in English."
  },
  "tlh": {
    "register": "Warrior's honor. OVS grammar. Use Marc Okrand vocabulary."
  }
}
```

Không có công cụ nào khác đi kèm với 47 văn phong ngôn ngữ được cấu hình sẵn, hoặc cho phép bạn tự định nghĩa văn phong tùy chỉnh cho từng dự án.

### 2. Trình chuyển đổi chữ viết tất định (Deterministic Script Converters)

Rosetta tích hợp sẵn năm trình chuyển đổi chữ viết chạy dưới dạng các post-translation hooks (hook sau khi dịch) — không cần đến LLM:

| Locale | Chuyển đổi | Ví dụ |
|--------|-----------|---------|
| `crk` | SRO → Cree Syllabics | `nêhiyawêwin` → `ᓀᐦᐃᔭᐍᐏᐣ` |
| `sr` | Latin → Cyrillic | `Beograd` → `Београд` |
| `tlh` | Romanization → pIqaD | `tlhIngan Hol` → (Ký tự pIqaD) |
| `x-elvish-s` | Latin → Tengwar | Sindarin → Tengwar (Chế độ Beleriand) |
| `x-kryptonian` | Latin → Kryptonian | Thay thế mật mã (yêu cầu font chữ) |

Đây là các trình chuyển đổi hoàn toàn dựa trên bảng tra cứu (lookup-table) — mang tính tất định, có thể kiểm toán và không có rủi ro ảo giác (hallucination) từ LLM.

### 3. Bảo vệ nhận biết nội dung (Content-Aware Shielding)

Khi dịch Markdown hoặc nội dung đa phương tiện (rich content), Rosetta sẽ bảo vệ:

- Các khối code (` ``` `)
- Code nội tuyến (inline code) (`` ` ` ``)
- Các shortcode của Hugo (`{{</* */>}}`, `{{%/* */%}}`)
- Các biến nội suy (interpolation variables) (`{{ .Count }}`, `{name}`, `{{t('key')}}`)
- Các khối HTML thô

Những thành phần này được thay thế bằng các token giám sát (sentinel tokens) Unicode trước khi dịch và được khôi phục lại sau đó. LLM sẽ không bao giờ nhìn thấy code, shortcode hay các biến của bạn.

### 4. Plugin phương thức được huấn luyện (Coached Method Plugins)

Đối với các ngôn ngữ không được API hỗ trợ, bạn có thể xây dựng một phương thức dịch được huấn luyện:

1. Viết dữ liệu huấn luyện ngôn ngữ (quy tắc ngữ pháp, từ vựng, ví dụ)
2. Đóng gói nó thành một plugin
3. Đánh giá hiệu suất (benchmark) so với các bản dịch tham chiếu bằng [eval harness](https://github.com/gamedaysuits/gds-mt-eval-harness)
4. Cài đặt nó vào dự án của bạn với `i18n-rosetta plugin install`

Đây là cách rosetta xử lý tiếng Plains Cree — và cũng là cách bạn có thể xử lý bất kỳ ngôn ngữ nào, kể cả những ngôn ngữ chưa tồn tại.

---

## Tóm lại

Rosetta không phải là công cụ thay thế cho Crowdin. Nó là một công cụ khác dành cho một quy trình làm việc khác. Nếu bạn cần người dịch, hãy sử dụng TMS. Nếu bạn cần một CLI có thể dịch các file của mình chỉ bằng một lệnh và cho phép bạn kiểm soát các phương thức, mô hình và văn phong cho từng ngôn ngữ — hãy sử dụng rosetta.