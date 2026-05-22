---
sidebar_position: 3
title: "Quality Gate"
---
# Quality Gate

Mỗi bản dịch đều đi qua một cổng xác thực tất định trước khi được ghi vào đĩa. Quality gate sẽ bắt các lỗi dịch máy phổ biến — không có sự cố ngầm nào bị bỏ qua, không có dữ liệu rác nào được ghi vào các tệp locale của bạn.

## Các bước kiểm tra xác thực

| Kiểm tra | Lỗi phát hiện | Nhãn cổng |
|-------|----------------|-----------|
| **Trống/khoảng trắng** | Mô hình trả về chuỗi trống hoặc khoảng trắng | `[GATE] empty` |
| **Lặp lại bản gốc** | Mô hình trả về nguyên bản đầu vào tiếng Anh | `[GATE] source-echo` |
| **Vòng lặp ảo giác** | Các mẫu trigram lặp lại (ví dụ: `"Qo' Qo' Qo'"`) | `[GATE] hallucination` |
| **Độ dài tăng bất thường** | Đầu ra dài hơn đáng kể so với bản gốc | `[GATE] length` |
| **Tuân thủ hệ thống chữ viết** | Sai hệ thống chữ viết cho locale đích | `[GATE] script` |

### Trống/Khoảng trắng

Từ chối các bản dịch là chuỗi trống, chỉ chứa khoảng trắng hoặc `null`. Bước này giúp phát hiện các mô hình không trả về kết quả cho các key khó.

### Lặp lại bản gốc

Phát hiện khi mô hình trả về văn bản gốc tiếng Anh thay vì dịch nó. Lỗi này thường gặp với các chuỗi ngắn và các prompt không được chỉ định rõ ràng.

### Vòng lặp ảo giác

Phân tích các mẫu trigram (3 ký tự) trong đầu ra. Nếu bất kỳ trigram nào lặp lại nhiều hơn một số lần ngưỡng nhất định so với độ dài đầu ra, bản dịch sẽ bị từ chối. Bước này giúp phát hiện các đầu ra bị thoái hóa như `"Qo' Qo' Qo' Qo' Qo'"`.

### Độ dài tăng bất thường

Từ chối các bản dịch có độ dài đầu ra vượt quá `maxLengthRatio × source length` (mặc định: 4×). Bước này giúp phát hiện các ảo giác của mô hình khi tạo ra những đoạn văn bản dài dòng cho một đầu vào ngắn.

Có thể cấu hình thông qua `maxLengthRatio` trong tệp config của bạn.

### Tuân thủ hệ thống chữ viết

Đối với các locale có trường `script` được cấu hình (ví dụ: `"script": "cans"` cho Plains Cree Syllabics), bước này xác thực rằng đầu ra chứa các ký tự phi ASCII phù hợp với hệ thống chữ viết đích. Đầu ra chỉ có chữ Latinh cho locale Ả Rập, CJK hoặc Syllabics sẽ bị từ chối.

## Điều gì xảy ra khi thất bại

1. Bản dịch thất bại được ghi vào stderr với tiền tố `[GATE]`, tên key, lý do và bản xem trước của giá trị
2. Key **không** được ghi vào tệp locale
3. Retry cascade (chuỗi thử lại) sẽ được kích hoạt (xem bên dưới)

```
[GATE] hero.title: source-echo — "Welcome to our platform"
[GATE] nav.about: hallucination — "À À À À À À À À"
```

## Retry Cascade

Khi một batch thất bại (lỗi phân tích cú pháp JSON hoặc bị từ chối bởi quality gate), rosetta sẽ thử lại với các batch nhỏ dần:

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the 2 problem keys
```

Ngân sách thử lại được giới hạn bởi `maxRetries` (mặc định: 3, có thể cấu hình cho từng ngôn ngữ). Điều này ngăn chặn việc tiêu tốn token mất kiểm soát cho các key liên tục thất bại.

Sau khi sử dụng hết số lần thử lại, các key có vấn đề sẽ được ghi nhật ký và bỏ qua. Chúng sẽ được thử lại trong lần chạy `sync` tiếp theo.

## Prompt Caching

System message (văn phong, quy tắc ngữ pháp, ghi chú kiểu dáng) được tách biệt khỏi user message (các key cần dịch). Sự phân tách này là có chủ ý:

- System message là **giống hệt nhau trên tất cả các batch** đối với một locale nhất định
- Các nhà cung cấp như Anthropic và Google sẽ lưu cache các system message lặp lại
- Kết quả: batch đầu tiên trả toàn bộ chi phí token, các batch tiếp theo chỉ trả phí cho user message

Điều này có thể làm giảm đáng kể chi phí token cho các dự án có nhiều batch.