---
slug: v3-2-quality-infrastructure
title: "v3.2.0: Hạ tầng chất lượng cấp độ công nghiệp"
authors: [curtisforbes]
tags: [release]
date: 2026-05-14
---
v3.2.0 là bản phát hành tập trung vào chất lượng. 702 bài kiểm tra, 163 bộ kiểm tra, không khoan nhượng với các lỗi ngầm.

<!-- truncate -->

## Những thay đổi

### Quality Gate (5 bước kiểm tra)

Mỗi bản dịch giờ đây sẽ đi qua năm bước kiểm tra xác thực tất định trước khi được ghi vào ổ đĩa:

1. **Empty/blank** — Model không trả về gì cả
2. **Source echo** — Model trả về đầu vào tiếng Anh
3. **Hallucination loop** — Các mẫu trigram lặp lại
4. **Length inflation** — Đầu ra dài gấp 4 lần trở lên so với bản gốc
5. **Script compliance** — Sai hệ thống chữ viết (script) cho locale

Không có bản dịch nào được ghi lại nếu không vượt qua cả năm bước kiểm tra. Các bản dịch thất bại sẽ được ghi log và thử lại.

### Retry Cascade

Khi một batch thất bại, rosetta sẽ thử lại với các batch nhỏ dần:

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the problem keys
```

### Tăng cường bảo mật

- **Prototype pollution guard** — Các key `__proto__`, `constructor` bị từ chối tại thời điểm phân tích cú pháp (parse time)
- **Path traversal guard** — Các mã locale bị thao túng không thể ghi ra ngoài các thư mục đã cấu hình
- **Response validation** — Chỉ những key đã được gửi đi mới được chấp nhận trả về

### Cơ sở hạ tầng kiểm tra

| Bộ kiểm tra | Số bài kiểm tra | Nội dung bao phủ |
|-------|-------|---------------|
| Core (8 bộ) | 280+ | Config, sync, CLI, watch, audit, pairs, format, init |
| Red team | 89 | Các đầu vào đối kháng, tấn công mã hóa |
| Contract | 120 | Các hợp đồng tích hợp API |
| Performance | 36 | Tối ưu hóa batch, suy giảm thông lượng |
| Coverage | Tổng cộng 702 | Toàn bộ pipeline |

### Prompt Caching

Các system message hiện đã được tách khỏi user message, cho phép tận dụng prompt cache trên các nhà cung cấp như Anthropic và Google. Điều này giúp giảm đáng kể chi phí token cho các quá trình đồng bộ đa batch.

Xem [tài liệu về Quality Gate](/docs/concepts/quality-gate) và [tài liệu về Bảo mật](/docs/concepts/security) để biết đầy đủ chi tiết kỹ thuật.