---
sidebar_position: 1
title: "Đánh giá MT"
---
# Đánh giá MT

rosetta bao gồm một framework đánh giá dịch máy được thiết kế cho việc **đánh giá chuẩn có thể tái tạo (reproducible benchmarking)** các phương pháp dịch thuật — đặc biệt là đối với các ngôn ngữ bản địa và ít tài nguyên, nơi các tiêu chuẩn MT thông thường không tồn tại và các tuyên bố về chất lượng rất khó để xác minh.

---

## Bảng xếp hạng

Điểm nhấn chính là **[Bảng xếp hạng Phương pháp](/leaderboard)** — một bảng điểm trực tiếp, được hỗ trợ bởi Supabase, nơi các nhà nghiên cứu và thành viên cộng đồng gửi và so sánh các phương pháp dịch thuật với các đánh giá có thể tái tạo và được gắn dấu vân tay (fingerprinted).

Mỗi lượt gửi bao gồm:

- **Pipeline được gắn dấu vân tay (Fingerprinted pipeline)** — gắn liền với một Git commit và mã băm cấu hình (config hash) cụ thể, vì vậy các kết quả có thể truy xuất ngược lại chính xác đoạn mã đã tạo ra chúng
- **Tập dữ liệu được phiên bản hóa** — được băm nội dung (content-hashed) và phiên bản hóa; các điểm số chỉ có thể so sánh trong cùng một phiên bản tập dữ liệu
- **Các số đo tiêu chuẩn hóa** — tất cả việc tính điểm đều được thực hiện bởi một công cụ đánh giá (harness) dùng chung, loại bỏ các khác biệt trong quá trình triển khai
- **Cấp độ tin cậy** — tự đánh giá (self-benchmarked), GDS Verified, hoặc Community Validated
- **Theo dõi chi phí** — chi phí API cho mỗi lượt gửi, nhờ đó sự đánh đổi giữa chi phí và chất lượng trở nên minh bạch

Bảng xếp hạng hiện đang theo dõi ba số đo:

| Số đo | Loại | Đo lường điều gì |
|--------|------|------------------|
| **chrF++** | Character n-gram F-score | Số đo chất lượng chính — tương quan tốt với đánh giá của con người, đặc biệt đối với các ngôn ngữ phong phú về hình thái |
| **Exact Match** | Tỷ lệ khớp hoàn hảo | Độ chính xác nghiêm ngặt — bao nhiêu lần bản dịch khớp chính xác với tiêu chuẩn vàng (gold standard)? |
| **FST Acceptance** | Tỷ lệ vượt qua cổng hình thái | Dành cho các phương pháp có xác minh finite-state transducer — tỷ lệ đầu ra hợp lệ về mặt hình thái là bao nhiêu? |

**[→ Xem bảng xếp hạng](/leaderboard)**

---

## Các tập dữ liệu hiện có

### EDTeKLA Development Set v1

Tập dữ liệu đánh giá đầu tiên, được xây dựng cho bản dịch Tiếng Anh→Plains Cree (SRO). Được tạo bởi [nhóm nghiên cứu EdTeKLA](https://spaces.facsci.ualberta.ca/edtekla/) tại Đại học Alberta.

| Thuộc tính | Giá trị |
|----------|-------|
| **ID** | `edtekla-dev-v1` |
| **Cặp ngôn ngữ** | EN → CRK (Plains Cree, chính tả SRO) |
| **Số lượng mục** | 124 |
| **Giấy phép** | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) |
| **Nguồn gốc** | `gold_standard` (được xác minh bởi người bản ngữ), `textbook` (tài liệu giáo dục đã xuất bản) |

### FLORES+ Devtest

Một tiêu chuẩn đa ngôn ngữ có độ bao phủ rộng được duy trì bởi [Open Language Data Initiative (OLDI)](https://huggingface.co/datasets/openlanguagedata/flores_plus).

| Thuộc tính | Giá trị |
|----------|-------|
| **Các cặp ngôn ngữ** | EN → 39 ngôn ngữ (tất cả các ngôn ngữ đã đăng ký trên rosetta) |
| **Số lượng mục** | 1.012 câu mỗi ngôn ngữ |
| **Giấy phép** | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| **Nguồn** | Ban đầu là Meta FLORES-200, hiện do OLDI duy trì |
| **Vị trí** | Các fixture được trích xuất sẵn tại `test/benchmark/fixtures/` trong repo chính của rosetta |

Xem [Các tập dữ liệu đánh giá](/docs/eval/datasets) để biết lược đồ tập dữ liệu đầy đủ, các cấp độ khó và cách tạo tập dữ liệu của riêng bạn.

:::danger KHÔNG HUẤN LUYỆN trên dữ liệu đánh giá

**Các tập dữ liệu này chỉ dành cho đánh giá.** Các phương pháp được huấn luyện, tinh chỉnh (fine-tuned), few-shot-prompted, hoặc tiếp xúc với dữ liệu đánh giá theo bất kỳ cách nào khác sẽ tạo ra điểm số bị thổi phồng một cách giả tạo và sẽ bị **loại khỏi bảng xếp hạng.**

Đây không phải là một lời khuyên — đây là quy tắc quan trọng nhất về tính toàn vẹn của việc đánh giá. Hãy sử dụng các kho ngữ liệu (corpora) riêng biệt để huấn luyện. Các tập đánh giá phải hoàn toàn không được mô hình của bạn nhìn thấy trong quá trình phát triển.

Nếu bạn đang sử dụng dữ liệu huấn luyện (coaching data) hoặc các ví dụ few-shot, chúng phải đến từ **các nguồn hoàn toàn riêng biệt**. Nếu có nghi ngờ, đừng đưa nó vào.
:::

:::warning Tính không tất định của LLM

Đầu ra của LLM là không tất định (non-deterministic). Điểm số thể hiện các phép đo tại một thời điểm cụ thể dưới các phiên bản mô hình và cấu hình API nhất định. Các nhà cung cấp mô hình có thể cập nhật trọng số, chiến lược giải mã (decoding strategies) hoặc bộ lọc an toàn bất kỳ lúc nào, điều này có thể gây ra sự sai lệch điểm số giữa các lần chạy. Bảng xếp hạng ghi lại chính xác model slug và dấu thời gian (timestamp) cho mỗi lượt gửi.
:::

---

## Điều gì tạo nên một phương pháp tốt

Không phải tất cả các phương pháp đều được tạo ra như nhau. Dưới đây là những điểm phân biệt giữa một công việc nghiêm túc và những điểm số bị thổi phồng.

### Đặc điểm của một phương pháp mạnh

- **Tách biệt rõ ràng giữa dữ liệu huấn luyện và đánh giá** — phương pháp của bạn chưa bao giờ nhìn thấy tập đánh giá trong quá trình phát triển, tinh chỉnh, kỹ thuật prompt (prompt engineering) hoặc chọn ví dụ few-shot
- **Có thể tái tạo** — người khác có thể clone repo của bạn, chạy công cụ đánh giá (harness) và nhận được cùng một điểm số (trong giới hạn tính không tất định của LLM)
- **Được ghi chép tài liệu đầy đủ** — [thẻ phương pháp (method card)](/docs/eval/methods) của bạn mô tả những gì phương pháp của bạn thực hiện, các công cụ nó sử dụng và những hạn chế của nó
- **Trung thực về phạm vi** — nếu phương pháp của bạn chỉ hoạt động cho một cặp ngôn ngữ, hãy nói rõ; nếu nó bị giảm chất lượng trên một số mẫu hình thái nhất định, hãy ghi chép lại điều đó
- **Có ý thức cộng đồng** — đối với các ngôn ngữ bản địa, phương pháp của bạn tôn trọng chủ quyền dữ liệu. Bạn đã tham khảo ý kiến của các cộng đồng ngôn ngữ hoặc chỉ sử dụng dữ liệu được cấp phép mở

### Cờ đỏ (những gì sẽ bị loại)

| Cờ đỏ | Tại sao đó là vấn đề |
|----------|--------------------|
| Huấn luyện trên dữ liệu đánh giá | Làm mất hoàn toàn mục đích của việc đánh giá. Điểm số bị thổi phồng gây hiểu lầm cho mọi người. |
| Lựa chọn kết quả có lợi (Cherry-picking) | Chạy 10 lần và gửi kết quả tốt nhất mà không tiết lộ các lần chạy khác |
| Xử lý hậu kỳ không được tiết lộ | Sửa thủ công các đầu ra trước khi tính điểm |
| Dữ liệu huấn luyện bị ô nhiễm | Sử dụng các ví dụ của tập đánh giá làm few-shot prompt hoặc các mục từ điển |
| Tuyên bố sẵn sàng thương mại mà không có nguồn gốc | Nếu phương pháp của bạn sử dụng dữ liệu CC BY-NC-SA, nó chưa sẵn sàng cho thương mại |

### Các cấp độ chất lượng trong bảng xếp hạng

Bảng xếp hạng hỗ trợ ba cấp độ tin cậy:

| Cấp độ | Ý nghĩa | Cách đạt được |
|------|---------|---------------|
| **Self-benchmarked** | Bạn tự chạy công cụ đánh giá và gửi kết quả | Mở một PR với run card của bạn |
| **GDS Verified** | Các maintainer của rosetta đã tái tạo lại kết quả của bạn | Gửi phương pháp của bạn dưới dạng một plugin có thể cài đặt |
| **Community Validated** | Các thành viên cộng đồng độc lập đã tái tạo lại kết quả | Sắp ra mắt |

---

## Cách gửi

1. **Xây dựng phương pháp của bạn** — xem [Xây dựng một Phương pháp](/docs/eval/methods) để biết giao diện phương pháp
2. **Chạy công cụ đánh giá** — xem [Eval Harness](/docs/eval/harness) để biết cách thiết lập và sử dụng
3. **Tạo run card** — công cụ đánh giá sẽ tạo ra một run card JSON chứa điểm số, dấu vân tay và siêu dữ liệu (metadata) của bạn
4. **Mở một PR** — gửi run card của bạn tới [kho lưu trữ eval harness](https://github.com/gamedaysuits/gds-mt-eval-harness)
5. **Xuất hiện trên bảng xếp hạng** — sau khi được merge, kết quả của bạn sẽ xuất hiện trên [Bảng xếp hạng Phương pháp](/leaderboard)

---

## Định hướng tương lai

- **Các lần chạy so sánh mô hình FLORES+** — đánh giá có hệ thống các mô hình tiên tiến (GPT-5.5, Claude Opus 4.7, Gemini 3.1 Pro, v.v.) trên tất cả 39 ngôn ngữ của rosetta
- **Thêm nhiều cặp ngôn ngữ** — Quechua, Inuktitut và các ngôn ngữ ít tài nguyên khác khi các tập dữ liệu được cộng đồng xác minh trở nên khả dụng
- **Nhập tập dữ liệu** — công cụ để chuyển đổi các tập dữ liệu đánh giá bên ngoài (WMT, Tatoeba, v.v.) sang định dạng đánh giá của rosetta
- **Tự động chạy lại** — phát hiện các thay đổi phiên bản mô hình và chạy lại các điểm chuẩn để theo dõi sự sai lệch điểm số

---

## Xem thêm

- **[Bảng xếp hạng Phương pháp](/leaderboard)** — điểm số trực tiếp và các lượt gửi
- **[Eval Harness](/docs/eval/harness)** — cách chạy các đánh giá
- **[Các tập dữ liệu đánh giá](/docs/eval/datasets)** — định dạng tập dữ liệu và các tập dữ liệu hiện có
- **[Xây dựng một Phương pháp](/docs/eval/methods)** — đặc tả giao diện phương pháp
- **[Đặc tả Run Card](/docs/eval/run-card)** — lược đồ JSON của run card
- **[Hỗ trợ một ngôn ngữ ít tài nguyên](/docs/guides/low-resource-languages)** — bối cảnh rộng hơn về lý do tại sao framework này tồn tại