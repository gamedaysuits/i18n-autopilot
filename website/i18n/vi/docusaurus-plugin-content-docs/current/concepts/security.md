---
sidebar_position: 4
title: "Bảo mật"
---
# Bảo mật & An toàn

Rosetta được thiết kế để đảm bảo an toàn trong các môi trường thù địch — nơi dữ liệu locale có thể đến từ các nguồn không đáng tin cậy, nơi các tên tệp được tạo ra có chủ đích có thể vượt ra khỏi ranh giới thư mục và nơi đầu ra của LLM có thể chứa bất kỳ thứ gì.

## Mô hình Mối đe dọa

| Mối đe dọa | Vector Tấn công | Biện pháp giảm nhẹ |
|--------|--------------|-----------|
| **Prototype pollution** | Các khóa JSON được tạo có chủ đích (`__proto__`, `constructor`) | Bị từ chối tại thời điểm phân tích cú pháp |
| **Path traversal** | Các mã locale như `../../etc/passwd` | Việc ghi tệp được xác thực vào các thư mục đã cấu hình |
| **Làm hỏng code block** | LLM dịch bên trong các khối mã (code fences) | Che chắn bằng Unicode sentinel |
| **Khóa ảo giác (Hallucinated keys)** | LLM trả về các khóa không được gửi đi | Xác thực phản hồi — chỉ các khóa được chấp nhận mới được ghi |
| **Tiêu tốn token mất kiểm soát** | Các vòng lặp thử lại vô hạn | Giới hạn ngân sách thông qua `maxRetries` |

## Bảo vệ chống Prototype Pollution

Tất cả các khóa locale đều được xác thực dựa trên một danh sách chặn (blocklist) trước khi xử lý:

- `__proto__`
- `constructor`
- `prototype`

Bất kỳ khóa nào khớp với các mẫu này đều bị từ chối và báo lỗi. Điều này ngăn chặn những kẻ tấn công sử dụng các tệp locale được tạo có chủ đích để sửa đổi các prototype của đối tượng JavaScript.

## Giới hạn Đường dẫn (Path Containment)

Khi ghi các tệp locale, rosetta xác thực rằng đường dẫn đầu ra nằm trong các thư mục đã được cấu hình (`localesDir`, `contentDir`). Các mã locale được làm sạch (sanitized) — một mã như `../../secrets` không thể ghi ra bên ngoài thư mục dự kiến.

## Bảo vệ Khối (Block Protection)

Trong quá trình dịch nội dung Markdown, các phần tử có cấu trúc được thay thế bằng các placeholder Unicode sentinel trước khi văn bản được gửi đến LLM:

1. **Code blocks** (dạng khối và nội tuyến) → sentinel
2. **Hugo shortcodes** (`{{< >}}`, `{{% %}}`) → sentinel  
3. **Raw HTML** → sentinel
4. **Biến nội suy (Interpolation variables)** (`{{ .Count }}`) → sentinel

Sau khi dịch, các sentinel được thay thế lại bằng nội dung gốc. LLM không bao giờ nhìn thấy các code block, shortcode hoặc HTML — do đó nó không thể làm hỏng chúng.

## Xác thực Phản hồi

Khi LLM trả về phản hồi JSON, rosetta sẽ xác thực rằng:
- Chỉ các khóa đã được gửi trong batch mới xuất hiện trong phản hồi
- Không có khóa thừa nào được tiêm (inject) vào
- Phản hồi được phân tích cú pháp thành JSON hợp lệ

Các khóa ảo giác (hallucinated keys) sẽ bị loại bỏ một cách âm thầm. Điều này ngăn chặn đầu ra của LLM tiêm các bản dịch không mong muốn vào các tệp locale của bạn.

## Cổng Chất lượng (Quality Gate)

Mỗi bản dịch đều được xác thực thông qua năm bước kiểm tra tất định (deterministic checks) trước khi được ghi vào ổ đĩa. Xem [Quality Gate](/docs/concepts/quality-gate) để biết thêm chi tiết.

## Exponential Backoff

Các lệnh gọi API sử dụng exponential backoff với jitter đối với các phản hồi 429 (giới hạn tỷ lệ) và 5xx (lỗi máy chủ). Ba lần thử lại với độ trễ tăng dần giúp ngăn chặn việc gửi yêu cầu ồ ạt (hammering) đến API trong thời gian ngừng hoạt động.

## Thời gian chờ Yêu cầu (Request Timeout)

Mỗi yêu cầu API có thời gian chờ (timeout) là 30 giây thông qua `AbortController`. Điều này ngăn chặn quá trình đồng bộ hóa bị treo vô thời hạn trên một kết nối đã chết.

## Chế độ Dự phòng (Fallback Mode)

Khi API không khả dụng, `--fallback` sẽ ghi các placeholder có tiền tố `[EN]` thay vì các bản dịch thực sự:

```bash
npx i18n-rosetta sync --fallback
```

```json
{
  "hero.title": "[EN] Welcome to our platform"
}
```

Các placeholder này được tự động phát hiện và dịch lại trong lần đồng bộ hóa tiếp theo bằng một khóa API hợp lệ. Chúng không bao giờ được coi là "đã dịch" — `audit` sẽ gắn cờ (flag) chúng.

## Kiểm thử

Các thuộc tính bảo mật được xác minh bởi bộ kiểm thử thù địch (adversarial test suite):

```bash
npm run test:redteam    # prototype pollution, path traversal, encoding attacks
```

---

## Xem thêm

- [Kiến trúc](/docs/concepts/architecture) — cách hệ sinh thái ba phần kết nối với nhau
- [Tham chiếu CLI — integrity](/docs/reference/cli#integrity) — lệnh kiểm tra tính toàn vẹn
- [Tham chiếu CLI — provenance](/docs/reference/cli#provenance) — lệnh kiểm toán nguồn gốc (provenance)
- [Đặc tả Plugin](/docs/reference/plugin-spec) — các trường nguồn gốc trong manifest của plugin
- [Quality Gate](/docs/concepts/quality-gate) — các kiểm tra an toàn ở cấp độ bản dịch