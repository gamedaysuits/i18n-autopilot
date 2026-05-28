---
sidebar_position: 4
title: "Bảo mật"
---
# Bảo mật & An toàn

Rosetta được thiết kế để đảm bảo an toàn trong các môi trường thù địch — nơi dữ liệu locale có thể đến từ các nguồn không đáng tin cậy, nơi các tên tệp được tạo ra có chủ đích có thể thoát khỏi ranh giới thư mục và nơi đầu ra của LLM có thể chứa bất kỳ thứ gì.

## Mô hình Mối đe dọa

| Mối đe dọa | Vector Tấn công | Biện pháp giảm nhẹ |
|--------|--------------|-----------|
| **Prototype pollution** | Các khóa JSON được tạo có chủ đích (`__proto__`, `constructor`) | Bị từ chối tại thời điểm phân tích cú pháp |
| **Path traversal** | Các mã locale như `../../etc/passwd` | Quá trình ghi tệp được xác thực vào các thư mục đã cấu hình |
| **Hỏng khối mã** | LLM dịch bên trong các rào mã (code fences) | Che chắn bằng Unicode sentinel |
| **Khóa ảo giác (Hallucinated keys)** | LLM trả về các khóa không được gửi đi | Xác thực phản hồi — chỉ các khóa được chấp nhận mới được ghi |
| **Tiêu tốn token mất kiểm soát** | Các vòng lặp thử lại (retry) vô hạn | Giới hạn ngân sách thông qua `maxRetries` |

## Bảo vệ khỏi Prototype Pollution

Tất cả các khóa locale đều được xác thực dựa trên một danh sách chặn (blocklist) trước khi xử lý:

- `__proto__`
- `constructor`
- `prototype`

Bất kỳ khóa nào khớp với các mẫu này đều bị từ chối kèm theo lỗi. Điều này ngăn chặn những kẻ tấn công sử dụng các tệp locale được tạo có chủ đích để sửa đổi các prototype của đối tượng JavaScript.

## Kiểm soát Đường dẫn

Khi ghi các tệp locale, rosetta xác thực rằng đường dẫn đầu ra nằm trong các thư mục đã được cấu hình (`localesDir`, `contentDir`). Các mã locale được làm sạch (sanitized) — một mã như `../../secrets` không thể ghi ra bên ngoài thư mục dự kiến.

## Bảo vệ Khối

Trong quá trình dịch nội dung Markdown, các phần tử có cấu trúc được thay thế bằng các trình giữ chỗ Unicode sentinel trước khi văn bản được gửi đến LLM:

1. **Khối mã** (dạng rào và nội tuyến) → sentinel
2. **Hugo shortcodes** (`{{< >}}`, `{{% %}}`) → sentinel  
3. **HTML thô** → sentinel
4. **Biến nội suy** (`{{ .Count }}`) → sentinel

Sau khi dịch, các sentinel được thay thế lại bằng nội dung gốc. LLM không bao giờ nhìn thấy các khối mã, shortcodes hoặc HTML — do đó nó không thể làm hỏng chúng.

## Xác thực Phản hồi

Khi LLM trả về một phản hồi JSON, rosetta sẽ xác thực rằng:
- Chỉ các khóa đã được gửi trong batch mới xuất hiện trong phản hồi
- Không có khóa thừa nào được chèn vào
- Phản hồi được phân tích cú pháp thành JSON hợp lệ

Các khóa ảo giác (hallucinated keys) sẽ bị loại bỏ một cách âm thầm. Điều này ngăn chặn đầu ra của LLM chèn các bản dịch không mong muốn vào các tệp locale của bạn.

## Cổng Chất lượng (Quality Gate)

Mỗi bản dịch đều được xác thực thông qua năm bước kiểm tra tất định (deterministic checks) trước khi được ghi vào ổ đĩa. Xem chi tiết tại [Quality Gate](/docs/concepts/quality-gate).

## Lùi bước Cấp số nhân (Exponential Backoff)

Các lệnh gọi API sử dụng kỹ thuật lùi bước cấp số nhân (exponential backoff) kèm theo jitter đối với các phản hồi 429 (giới hạn tỷ lệ) và 5xx (lỗi máy chủ). Ba lần thử lại với độ trễ tăng dần giúp ngăn chặn việc gửi yêu cầu ồ ạt đến API trong thời gian ngừng hoạt động.

## Thời gian chờ Yêu cầu (Request Timeout)

Mỗi yêu cầu API có thời gian chờ là 30 giây thông qua `AbortController`. Điều này ngăn quá trình đồng bộ hóa bị treo vô thời hạn trên một kết nối đã chết.

## Báo lỗi Rõ ràng khi Dịch thất bại (Fail-Loud)

Khi API không khả dụng hoặc quá trình dịch thất bại, rosetta sẽ đưa ra một thông báo lỗi rõ ràng kèm theo hướng dẫn xử lý thay vì âm thầm ghi ra dữ liệu rác. Không có trình giữ chỗ nào có tiền tố `[EN]` được ghi trong quá trình đồng bộ hóa.

```
[ERR] Content sync for fr: no API key available.
  Set OPENROUTER_API_KEY in .env.local to translate content.
```

Sự cố của một tệp không làm dừng toàn bộ quá trình đồng bộ hóa — lỗi sẽ được ghi lại và luồng xử lý (pipeline) tiếp tục với tệp tiếp theo, nhờ đó bạn đạt được tiến độ tối đa cho mỗi lần chạy.

## Xác minh Sau Đồng bộ (Post-Sync Verification)

Sau khi tất cả các bản dịch hoàn tất, rosetta sẽ đọc lại các tệp locale đã ghi từ ổ đĩa và chạy một bước xác minh. Điều này giúp phát hiện khoảng cách giữa việc đồng bộ báo cáo thành công và thực tế là các bản dịch bị sai:

- **Tính đồng nhất của khóa (Key parity)** — tất cả các khóa nguồn đều hiện diện trong mỗi mục tiêu
- **Các điểm đánh dấu `[EN]`** — các điểm đánh dấu dự phòng cũ từ những lần chạy trước
- **Bản dịch trống** — các giá trị rỗng bị lọt qua
- **Tuân thủ hệ chữ viết (Script compliance)** — các locale phi Latinh nhưng lại có bản dịch chỉ chứa ASCII
- **Bảo toàn trình giữ chỗ** — các trình giữ chỗ ICU khớp với nguồn

Bỏ qua bằng `--no-verify` hoặc chạy độc lập bằng `npx i18n-rosetta verify`.

## Kiểm thử (Testing)

Các thuộc tính bảo mật được xác minh bởi bộ kiểm thử thù địch (adversarial test suite):

```bash
npm run test:redteam    # prototype pollution, path traversal, encoding attacks
```

---

## Xem thêm

- [Kiến trúc (Architecture)](/docs/concepts/architecture) — cách hệ sinh thái ba phần kết nối với nhau
- [Tham chiếu CLI — integrity](/docs/reference/cli#integrity) — lệnh kiểm tra tính toàn vẹn
- [Tham chiếu CLI — provenance](/docs/reference/cli#provenance) — lệnh kiểm toán nguồn gốc
- [Đặc tả Plugin (Plugin Specification)](/docs/reference/plugin-spec) — các trường nguồn gốc trong tệp kê khai (manifest) của plugin
- [Cổng Chất lượng (Quality Gate)](/docs/concepts/quality-gate) — các bước kiểm tra an toàn ở cấp độ bản dịch