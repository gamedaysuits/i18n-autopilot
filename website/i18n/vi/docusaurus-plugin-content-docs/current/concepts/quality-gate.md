---
sidebar_position: 3
title: "Quality Gate"
---
# Quality Gate

Mỗi bản dịch đều phải đi qua một cổng xác thực tất định trước khi được ghi vào ổ đĩa. Quality gate sẽ bắt các lỗi dịch máy phổ biến — không có các fallback ngầm, không có dữ liệu rác nào bị ghi vào các file locale của bạn.

## Các bước kiểm tra xác thực

| Kiểm tra | Lỗi phát hiện | Nhãn Gate |
|-------|----------------|-----------|
| **Trống/khoảng trắng** | Model trả về chuỗi rỗng hoặc khoảng trắng | `[GATE] empty` |
| **Lặp lại bản gốc** | Model trả về nguyên bản đầu vào tiếng Anh | `[GATE] source-echo` |
| **Vòng lặp ảo giác** | Các mẫu trigram lặp lại (ví dụ: `"Qo' Qo' Qo'"`) | `[GATE] hallucination` |
| **Độ dài tăng bất thường** | Đầu ra dài hơn đáng kể so với bản gốc | `[GATE] length` |
| **Tuân thủ hệ chữ viết** | Sai hệ chữ viết (script) cho locale đích | `[GATE] script` |

### Trống/Khoảng trắng

Từ chối các bản dịch là chuỗi rỗng, chỉ chứa khoảng trắng, hoặc `null`. Bước này giúp bắt lỗi các model không trả về gì cả đối với các key khó.

### Lặp lại bản gốc

Phát hiện khi model trả về văn bản gốc tiếng Anh thay vì dịch nó. Thường gặp với các chuỗi ngắn và các prompt không được chỉ định rõ ràng.

### Vòng lặp ảo giác

Phân tích các mẫu trigram (3 ký tự) trong đầu ra. Nếu bất kỳ trigram nào lặp lại nhiều hơn một số lần ngưỡng nhất định so với độ dài đầu ra, bản dịch sẽ bị từ chối. Bước này giúp bắt các đầu ra bị thoái hóa như `"Qo' Qo' Qo' Qo' Qo'"`.

### Độ dài tăng bất thường

Từ chối các bản dịch có độ dài đầu ra vượt quá `maxLengthRatio × source length` (mặc định: 4×). Bước này giúp bắt các lỗi ảo giác của model khi tạo ra cả một đoạn văn bản dài cho một đầu vào ngắn.

Có thể cấu hình thông qua `maxLengthRatio` trong config của bạn.

### Tuân thủ hệ chữ viết

Đối với các locale có cấu hình trường `script` (ví dụ: `"script": "cans"` cho Plains Cree Syllabics), xác thực rằng đầu ra chứa các ký tự non-ASCII phù hợp với hệ chữ viết đích. Đầu ra chỉ có chữ Latinh cho locale tiếng Ả Rập, CJK hoặc Syllabics sẽ bị từ chối.

## Điều gì xảy ra khi thất bại

1. Bản dịch thất bại được log vào stderr với tiền tố `[GATE]`, tên key, lý do và bản xem trước của giá trị
2. Key này sẽ **không** được ghi vào file locale
3. Quá trình thử lại theo tầng (retry cascade) sẽ được kích hoạt (xem bên dưới)

```
[GATE] hero.title: source-echo — "Welcome to our platform"
[GATE] nav.about: hallucination — "À À À À À À À À"
```

## Thử lại theo tầng

Khi một batch thất bại (lỗi phân tích cú pháp JSON hoặc bị từ chối bởi quality gate), rosetta sẽ thử lại với các batch nhỏ dần:

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the 2 problem keys
```

Ngân sách thử lại được giới hạn bởi `maxRetries` (mặc định: 3, có thể cấu hình cho từng ngôn ngữ). Điều này ngăn chặn việc tiêu tốn token mất kiểm soát đối với các key liên tục thất bại.

Sau khi dùng hết số lần thử lại, các key có vấn đề sẽ được log lại và bỏ qua. Chúng sẽ được thử lại trong lần chạy `sync` tiếp theo.

## Caching Prompt

System message (ngữ điệu, quy tắc ngữ pháp, ghi chú văn phong) được tách biệt khỏi user message (các key cần dịch). Việc tách biệt này là có chủ ý:

- System message **giống hệt nhau giữa các batch** cho một locale nhất định
- Các nhà cung cấp như Anthropic và Google sẽ cache các system message lặp lại
- Kết quả: batch đầu tiên trả toàn bộ chi phí token, các batch tiếp theo chỉ phải trả cho user message

Điều này có thể giảm đáng kể chi phí token cho các dự án có nhiều batch.

---

## Xem thêm

- [Cách Sync hoạt động](/docs/concepts/how-sync-works) — vị trí của quality gate trong pipeline
- [Các phương pháp dịch](/docs/guides/translation-methods) — các phương pháp đưa dữ liệu vào gate
- [Trình chuyển đổi hệ chữ viết](/docs/concepts/script-converters) — chuyển đổi hệ chữ viết sau khi qua gate
- [Dữ liệu huấn luyện](/docs/concepts/coaching-data) — cải thiện chất lượng bản dịch từ đầu nguồn
- [Tham chiếu CLI — sync](/docs/reference/cli#sync) — các cờ sync bao gồm hành vi thử lại