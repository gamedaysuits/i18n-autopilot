---
sidebar_position: 3
title: "Quality Gate"
---
# Quality Gate

Mỗi bản dịch đều đi qua một cổng xác thực tất định trước khi được ghi vào ổ đĩa. Quality Gate này sẽ bắt các lỗi dịch máy phổ biến — không có lỗi ngầm, không có dữ liệu rác nào được ghi vào các tệp locale của bạn.

## Các bước kiểm tra xác thực

| Kiểm tra | Lỗi phát hiện | Nhãn cổng |
|-------|----------------|-----------|
| **Trống/khoảng trắng** | Mô hình trả về chuỗi rỗng hoặc khoảng trắng | `[GATE] empty` |
| **Lặp lại bản gốc** | Mô hình trả về đầu vào tiếng Anh gốc | `[GATE] source-echo` |
| **Vòng lặp ảo giác** | Các mẫu trigram lặp lại (ví dụ: `"Qo' Qo' Qo'"`) | `[GATE] hallucination` |
| **Độ dài tăng bất thường** | Đầu ra dài hơn đáng kể so với bản gốc | `[GATE] length` |
| **Tuân thủ hệ thống chữ viết** | Sai hệ thống chữ viết cho locale đích | `[GATE] script` |
| **Danh mục số nhiều ICU** | Thiếu các dạng số nhiều bắt buộc cho locale | `[GATE] icu-plural` |

### Trống/Khoảng trắng

Từ chối các bản dịch là chuỗi rỗng, chỉ có khoảng trắng, hoặc `null`. Bước này giúp bắt các mô hình không trả về gì đối với các key khó.

### Lặp lại bản gốc

Phát hiện khi mô hình trả về văn bản gốc tiếng Anh thay vì dịch nó. Thường gặp với các chuỗi ngắn và các prompt không được chỉ định rõ ràng.

### Vòng lặp ảo giác

Phân tích các mẫu trigram (3 ký tự) trong đầu ra. Nếu bất kỳ trigram nào lặp lại nhiều hơn một số lần ngưỡng so với độ dài đầu ra, bản dịch sẽ bị từ chối. Bước này giúp bắt các đầu ra bị thoái hóa như `"Qo' Qo' Qo' Qo' Qo'"`.

### Độ dài tăng bất thường

Từ chối các bản dịch có độ dài đầu ra vượt quá `maxLengthRatio × source length` (mặc định: 4×). Bước này giúp bắt các ảo giác của mô hình khi tạo ra những đoạn văn bản dài ngoằng cho một đầu vào ngắn.

Có thể cấu hình thông qua `maxLengthRatio` trong cấu hình của bạn.

### Tuân thủ hệ thống chữ viết

Đối với các locale có trường `script` được cấu hình (ví dụ: `"script": "cans"` cho Plains Cree Syllabics), xác thực rằng đầu ra chứa các ký tự non-ASCII phù hợp với hệ thống chữ viết đích. Đầu ra chỉ có chữ Latinh cho locale tiếng Ả Rập, CJK hoặc Syllabics sẽ bị từ chối.

## Điều gì xảy ra khi thất bại

1. Bản dịch thất bại được ghi log vào stderr với tiền tố `[GATE]`, tên key, lý do và bản xem trước của giá trị
2. Key này **không** được ghi vào tệp locale
3. Chuỗi thử lại (retry cascade) sẽ được kích hoạt (xem bên dưới)

```
[GATE] hero.title: source-echo — "Welcome to our platform"
[GATE] nav.about: hallucination — "À À À À À À À À"
```

## Chuỗi thử lại (Retry Cascade)

Khi một batch thất bại (lỗi phân tích cú pháp JSON hoặc bị từ chối bởi Quality Gate), rosetta sẽ thử lại với các batch nhỏ dần:

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the 2 problem keys
```

Ngân sách thử lại được giới hạn bởi `maxRetries` (mặc định: 3, có thể cấu hình theo từng ngôn ngữ). Điều này ngăn chặn việc tiêu tốn token mất kiểm soát cho các key liên tục thất bại.

Sau khi dùng hết số lần thử lại, các key có vấn đề sẽ được ghi log và bỏ qua. Chúng sẽ được thử lại trong lần chạy `sync` tiếp theo.

## Lưu bộ nhớ đệm Prompt (Prompt Caching)

System message (văn phong, quy tắc ngữ pháp, ghi chú kiểu dáng) được tách khỏi user message (các key cần dịch). Việc tách biệt này là có chủ ý:

- System message **giống hệt nhau giữa các batch** cho một locale nhất định
- Các nhà cung cấp như Anthropic và Google sẽ lưu bộ nhớ đệm các system message lặp lại
- Kết quả: batch đầu tiên trả toàn bộ chi phí token, các batch tiếp theo chỉ trả phí cho user message

Điều này có thể giảm đáng kể chi phí token cho các dự án có nhiều batch.

## Xác thực ICU MessageFormat

Lệnh `integrity` xác thực các mẫu số nhiều của ICU MessageFormat dựa trên các quy tắc số nhiều của CLDR. Nếu tệp nguồn của bạn sử dụng cú pháp ICU như:

```json
"items": "{count, plural, one {# item} other {# items}}"
```

Rosetta xác minh rằng các phiên bản đã dịch bao gồm tất cả các danh mục số nhiều bắt buộc cho locale đích. Ví dụ: tiếng Ả Rập yêu cầu sáu danh mục (`zero`, `one`, `two`, `few`, `many`, `other`) — không chỉ `one` và `other`.

Chạy `i18n-rosetta integrity` để kiểm tra tính đầy đủ của số nhiều trên tất cả các locale.

## Thực thi thuật ngữ

Đối với các cặp ngôn ngữ được huấn luyện (coached pairs) có từ điển, rosetta sẽ chạy kiểm tra thuật ngữ sau khi dịch. Sau khi vượt qua Quality Gate, hệ thống sẽ xác minh xem LLM có thực sự sử dụng các thuật ngữ từ điển được yêu cầu hay không.

```
[TERM] en→fr: 2 term violation(s)
  • hero.title: "dashboard" → expected "tableau de bord" but got "panneau de contrôle"
```

Các vi phạm thuật ngữ là **cảnh báo, không phải lỗi chặn (blocking errors)**. Bản dịch vẫn được ghi vào ổ đĩa. Điều này là có chủ ý — LLM có thể có những lý do hợp lệ để chọn một từ thay thế (ngữ cảnh, ngữ pháp) và việc chặn do không khớp thuật ngữ sẽ gây hại nhiều hơn lợi.

Để khắc phục các vi phạm, hãy cập nhật từ điển huấn luyện hoặc chỉnh sửa thủ công tệp locale.

---

## Xem thêm

- [Cách Sync hoạt động](/docs/concepts/how-sync-works) — vị trí của Quality Gate trong pipeline
- [Phương pháp dịch](/docs/guides/translation-methods) — các phương pháp đưa dữ liệu vào cổng
- [Trình chuyển đổi hệ thống chữ viết](/docs/concepts/script-converters) — chuyển đổi hệ thống chữ viết sau khi qua cổng
- [Dữ liệu huấn luyện](/docs/concepts/coaching-data) — cải thiện chất lượng dịch thuật từ đầu nguồn
- [Bộ nhớ dịch thuật](/docs/concepts/translation-memory) — lưu bộ nhớ đệm các bản dịch đã được xác thực
- [Tham chiếu CLI — sync](/docs/reference/cli#sync) — các cờ sync bao gồm hành vi thử lại
- [Tham chiếu CLI — integrity](/docs/reference/cli#integrity) — kiểm tra số nhiều ICU