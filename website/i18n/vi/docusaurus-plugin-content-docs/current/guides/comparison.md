---
sidebar_position: 7
title: "So sánh"
---
# So sánh Rosetta

i18n-rosetta thuộc một danh mục khác so với hầu hết các công cụ bản địa hóa. Dưới đây là một so sánh khách quan.

## Bức tranh tổng quan

Hầu hết các công cụ bản địa hóa thuộc một trong ba danh mục sau:

| Danh mục | Ví dụ | Mô hình |
|----------|----------|-------|
| **Nền tảng TMS đám mây** | Crowdin, Phrase, Locize, Tolgee | Bảng điều khiển SaaS + người dịch + đăng ký hàng tháng |
| **Công cụ trích xuất khóa** | i18next-scanner, FormatJS CLI | Quét mã nguồn để tìm các lệnh gọi hàm dịch |
| **Công cụ dịch CLI** | **i18n-rosetta** | Chạy trong dự án của bạn, dịch tệp trực tiếp, không cần tài khoản đám mây |

Rosetta là một **công cụ dịch CLI** — nó dịch trực tiếp các tệp ngôn ngữ của bạn bằng cách sử dụng các backend có thể cấu hình (LLM, Google Translate, plugin tùy chỉnh). Không có bảng điều khiển đám mây, không có quy trình làm việc cho người dịch, không có phí hàng tháng.

---

## So sánh tính năng

| Tính năng | i18n-rosetta | Crowdin | Phrase | Locize |
|---------|:------------:|:-------:|:------:|:------:|
| **Chạy cục bộ (không cần tài khoản đám mây)** | ✅ | ❌ | ❌ | ❌ |
| **Không có dependency** | ✅ | ❌ | ❌ | ❌ |
| **Cấu hình phương thức theo từng cặp ngôn ngữ** | ✅ | ❌ | ❌ | ❌ |
| **Văn phong ngôn ngữ tùy chỉnh** | ✅ | ❌ | ❌ | ❌ |
| **Nhận biết nội dung (bảo vệ các khối mã)** | ✅ | ❌ | ❌ | ❌ |
| **Chuyển đổi ngôn ngữ nhân tạo & hệ thống chữ viết** | ✅ | ❌ | ❌ | ❌ |
| **Kiến trúc plugin** | ✅ | ❌ | ❌ | ❌ |
| **Dịch Markdown / nội dung** | ✅ | ✅ | ✅ | ❌ |
| **Bộ nhớ dịch (Translation Memory)** | ✅ | ✅ | ✅ | ✅ |
| **Xuất/nhập XLIFF** | ✅ | ✅ | ✅ | ❌ |
| **Xác thực số nhiều ICU** | ✅ | ✅ | ✅ | ❌ |
| **Thực thi thuật ngữ** | ✅ | ✅ | ✅ | ❌ |
| **Quy trình làm việc cho người dịch** | Dựa trên XLIFF | ✅ | ✅ | ✅ |
| **Chỉnh sửa theo ngữ cảnh (trực quan)** | ❌ | ✅ | ✅ | ✅ |
| **Cộng tác nhóm** | ❌ | ✅ | ✅ | ✅ |
| **Hỗ trợ định dạng tệp** | JSON, TOML, YAML, MD, XLIFF | 50+ | 40+ | JSON |
| **Giá cả** | Miễn phí (trả phí cho LLM của bạn) | Từ $0/tháng | Từ $0/tháng | Từ $0/tháng |

---

## Khi nào nên sử dụng Rosetta

**Rosetta là lựa chọn phù hợp khi:**

- Bạn muốn tích hợp dịch máy vào quy trình build của mình — không phải là một quy trình làm việc riêng biệt
- Bạn cần kiểm soát phương thức cho từng ngôn ngữ (LLM cho một số ngôn ngữ, Google Translate cho các ngôn ngữ khác, plugin tùy chỉnh cho phần còn lại)
- Bạn đang dịch sang các ngôn ngữ không được API hỗ trợ (ngôn ngữ bản địa, ngôn ngữ có nguy cơ tuyệt chủng, ngôn ngữ nhân tạo)
- Bạn muốn đầu ra hệ thống chữ viết có tính xác định (Cree Syllabics, Klingon pIqaD, Tengwar)
- Bạn không muốn bị phụ thuộc vào nhà cung cấp (vendor lock-in) và không phụ thuộc vào đám mây
- Bạn là nhà phát triển độc lập hoặc nhóm nhỏ không cần một bảng điều khiển TMS đầy đủ
- Bạn muốn bàn giao tệp XLIFF cho các dịch giả chuyên nghiệp mà không cần đăng ký dịch vụ đám mây

**Một TMS đám mây sẽ phù hợp hơn khi:**

- Bạn có các dịch giả chuyên nghiệp đánh giá từng chuỗi văn bản (quy trình XLIFF của rosetta đơn giản hơn một TMS đầy đủ)
- Bạn cần quản lý bộ nhớ dịch và thuật ngữ xuyên suốt nhiều dự án
- Bạn cần chỉnh sửa trực quan theo ngữ cảnh (xem trước bản dịch ngay trong giao diện người dùng của bạn)
- Bạn có một nhóm lớn với nhu cầu kiểm soát truy cập dựa trên vai trò
- Bạn cần hỗ trợ hơn 50 định dạng tệp

---

## Những gì Rosetta làm được mà không công cụ nào khác có

### 1. Văn phong tùy chỉnh

Mỗi cặp ngôn ngữ đều nhận được các hướng dẫn về giọng điệu phù hợp với văn hóa dành cho LLM:

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

Không có công cụ nào khác đi kèm với 47 văn phong ngôn ngữ được cấu hình sẵn, hoặc cho phép bạn xác định các văn phong tùy chỉnh cho từng dự án.

### 2. Trình chuyển đổi hệ thống chữ viết có tính xác định

Rosetta đi kèm với năm trình chuyển đổi hệ thống chữ viết tích hợp sẵn, chạy dưới dạng các hook sau khi dịch — không cần LLM:

| Ngôn ngữ (Locale) | Chuyển đổi | Ví dụ |
|--------|-----------|---------|
| `crk` | SRO → Cree Syllabics | `nêhiyawêwin` → `ᓀᐦᐃᔭᐍᐏᐣ` |
| `sr` | Latin → Cyrillic | `Beograd` → `Београд` |
| `tlh` | Romanization → pIqaD | `tlhIngan Hol` → (ký tự pIqaD) |
| `x-elvish-s` | Latin → Tengwar | Sindarin → Tengwar (Chế độ Beleriand) |
| `x-kryptonian` | Latin → Kryptonian | Thay thế mật mã (yêu cầu phông chữ) |

Đây là các trình chuyển đổi hoàn toàn dựa trên bảng tra cứu — có tính xác định, có thể kiểm toán và không có rủi ro ảo giác từ LLM.

### 3. Bảo vệ nhận biết nội dung

Khi dịch Markdown hoặc nội dung đa phương tiện (rich content), Rosetta sẽ bảo vệ:

- Các khối mã (fenced code blocks) (` ``` `)
- Mã nội tuyến (`` ` ` ``)
- Các shortcode của Hugo (`{{</* */>}}`, `{{%/* */%}}`)
- Các biến nội suy (`{{ .Count }}`, `{name}`, `{{t('key')}}`)
- Các khối HTML thô

Chúng được thay thế bằng các token giám sát (sentinel token) Unicode trước khi dịch và được khôi phục lại sau đó. LLM sẽ không bao giờ nhìn thấy mã, shortcode hoặc các biến của bạn.

### 4. Các plugin phương thức được huấn luyện

Đối với các ngôn ngữ không được API hỗ trợ, bạn có thể xây dựng một phương thức dịch được huấn luyện:

1. Viết dữ liệu huấn luyện ngôn ngữ (quy tắc ngữ pháp, từ vựng, ví dụ)
2. Đóng gói nó thành một plugin
3. Đánh giá chuẩn (benchmark) nó với các bản dịch tham chiếu bằng cách sử dụng [eval harness](https://github.com/gamedaysuits/gds-mt-eval-harness)
4. Cài đặt nó vào dự án của bạn bằng `i18n-rosetta plugin install`

Đây là cách rosetta xử lý tiếng Plains Cree — và là cách bạn có thể xử lý bất kỳ ngôn ngữ nào, kể cả những ngôn ngữ chưa tồn tại.

---

## Điểm mấu chốt

Rosetta không phải là sự thay thế cho Crowdin. Nó là một công cụ khác dành cho một quy trình làm việc khác. Nếu bạn cần người dịch, hãy sử dụng TMS. Nếu bạn cần một CLI dịch các tệp của bạn chỉ bằng một lệnh và cung cấp cho bạn quyền kiểm soát theo từng ngôn ngữ đối với các phương thức, mô hình và văn phong — hãy sử dụng rosetta.