---
sidebar_position: 1
slug: /
title: "Giới thiệu"
---
# i18n-rosetta

Một framework quốc tế hóa (internationalization) hoàn toàn có thể tùy chỉnh. Một lệnh duy nhất để dịch các file ngôn ngữ (locale files) của bạn. Một cấu hình kiểm soát mọi phương pháp, mô hình và cặp ngôn ngữ. Và nếu các phương pháp có sẵn là chưa đủ — hãy tự xây dựng phương pháp của bạn, chứng minh nó hoạt động hiệu quả và triển khai nó.

```bash
npx i18n-rosetta sync
```

rosetta tự động phát hiện các file ngôn ngữ, định dạng và ngôn ngữ đích của bạn. Nó dịch những gì còn thiếu, bỏ qua những gì đã hoàn thành, xác thực mọi kết quả và ghi ra output sạch sẽ. Đó mới chỉ là vạch xuất phát.

---

## Tại sao không tự viết script?

Bạn có thể viết một vòng lặp nhanh gọi Google Translate cho từng key. Hầu hết các lập trình viên đều làm vậy — chỉ mất khoảng 30 dòng code. Nhưng đây là lúc nó bộc lộ điểm yếu:

- **Không phát hiện thay đổi.** Cập nhật một chuỗi tiếng Anh — bản dịch cũ vẫn nằm đó mãi mãi. rosetta theo dõi mọi giá trị nguồn bằng mã băm SHA-256 và chỉ dịch lại những gì đã thay đổi.
- **Không gom nhóm (batching).** Một lệnh gọi API cho mỗi key nghĩa là 200 keys = 200 vòng lặp. rosetta gom nhóm một cách thông minh (có thể cấu hình, mặc định 80 keys/batch cho LLM, 128 cho Google).
- **Không có bộ nhớ đệm (caching).** Mỗi lần đồng bộ là dịch lại toàn bộ. Translation Memory của rosetta lưu trữ các bản dịch theo văn bản nguồn + ngôn ngữ + phương pháp — chạy lại đồng bộ sau khi thay đổi một key sẽ chỉ dịch duy nhất key đó, chứ không phải toàn bộ file.
- **Không kiểm soát chất lượng.** Dịch máy có thể bị ảo giác (hallucinate), lặp lại nguyên văn bản nguồn hoặc xuất ra sai hệ chữ viết. rosetta xác thực mọi bản dịch trước khi ghi lại — lỗi sai hệ chữ viết, độ dài tăng bất thường và lặp lại văn bản nguồn đều bị phát hiện và loại bỏ.
- **Không nhận diện định dạng.** Bị hardcode cứng vào JSON? rosetta xử lý JSON, TOML, YAML và Hugo Markdown (frontmatter + body) với khả năng tự động phát hiện.
- **Không kiểm soát phương pháp.** Mọi cặp ngôn ngữ đều dùng chung một phương pháp. rosetta cho phép bạn dùng Google Translate cho tiếng Pháp, một LLM cho tiếng Nhật và một pipeline tùy chỉnh do cộng đồng host cho tiếng Cree — tất cả trong cùng một file cấu hình.

rosetta chính là phiên bản production của đoạn script đó.

---

## Điều gì làm nên sự khác biệt

### Mỗi phương pháp là một plugin

Phương pháp dịch có thể được **cấu hình riêng cho từng cặp ngôn ngữ**. Kết hợp Google Translate, các LLM, coached prompts và các API tùy chỉnh trong cùng một dự án:

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "google-translate" },
    "en:ja": { "method": "llm", "model": "google/gemini-2.5-pro" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

Tiếng Pháp dùng Google Translate (nhanh, rẻ). Tiếng Nhật dùng một LLM cao cấp (tinh tế). Tiếng Plains Cree dùng một coached plugin với các quy tắc ngữ pháp, từ điển và xác thực hình thái học. Cùng một lệnh `sync`. Cùng một bộ kiểm soát chất lượng. Cùng một CLI.

### Chứng minh đi

Bạn nghĩ phương pháp của mình có thể dịch từ tiếng Anh sang tiếng Tây Ban Nha? Tiếng Thổ Nhĩ Kỳ sang tiếng Azerbaijan? Tiếng Anh sang tiếng Cree?

**Chứng minh đi.** Công cụ đi kèm [eval harness](https://mtevalarena.org/docs/specifications/harness) sẽ benchmark bất kỳ phương pháp dịch nào với hệ thống chấm điểm có thể tái tạo và được gắn dấu vân tay (fingerprinted). Bảng xếp hạng ([leaderboard](/leaderboard)) theo dõi mọi lượt gửi.

Eval harness và production CLI dùng chung một giao diện plugin. Một phương pháp đạt điểm cao trong harness có thể được sử dụng trong production — nếu cộng đồng sử dụng ngôn ngữ đó đồng ý. Đối với các ngôn ngữ bản địa và ngôn ngữ có ít tài nguyên (low-resource languages), sự đồng thuận đó rất quan trọng. Xem [Chủ quyền Dữ liệu (Data Sovereignty)](https://mtevalarena.org/docs/sovereignty/data-sovereignty).

```bash
# Benchmark your method (in the eval harness repo)
cd gds-mt-eval-harness
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json --submit

# Use it locally
npx i18n-rosetta sync
```

Cùng một plugin. Chỉ việc cắm vào và test.

### Bộ công cụ hoàn chỉnh

rosetta không chỉ là `sync`. Nó là một pipeline i18n hoàn chỉnh:

| Lệnh | Chức năng |
|---------|-------------|
| `sync` | Dịch các key còn thiếu và đã cũ (kèm xác minh sau đồng bộ) |
| `watch` | Tự động đồng bộ khi file nguồn của bạn thay đổi |
| `lint` | Quét mã nguồn để tìm các chuỗi bị hardcode |
| `wrap` | Tự động bọc các chuỗi hardcode vào trong các lệnh gọi `t()` |
| `audit` | Liệt kê tất cả các marker dự phòng `[EN]` từ những lần chạy trước |
| `verify` | Xác minh các bản dịch đã có mặt và chính xác (CI gate) |
| `integrity` | Phát hiện lỗi hỏng placeholder, vấn đề mã hóa và tính toàn vẹn của ICU plural |
| `seo` | Tạo thẻ hreflang, sitemaps và schema JSON-LD |
| `status` | Hiển thị cấu hình cặp ngôn ngữ, các plugin và điểm benchmark |
| `provenance` | Kiểm tra giấy phép của các tài nguyên dịch thuật |
| `plugin` | Cài đặt, gỡ bỏ và liệt kê các plugin phương pháp |
| `fonts` | Tải web fonts cho các bộ chuyển đổi hệ chữ viết PUA |
| `tm` | Quản lý bộ nhớ đệm Translation Memory (thống kê, xóa, theo từng ngôn ngữ) |
| `xliff` | Xuất/nhập XLIFF 1.2 để các dịch giả chuyên nghiệp đánh giá |

Bốn lệnh trong số này — `lint`, `sync`, `verify`, `audit` — tạo thành một pipeline CI giúp bắt các chuỗi hardcode, dịch chúng, xác minh tính chính xác và đánh rớt (fail) bản build nếu có bất kỳ ngôn ngữ nào chưa hoàn thiện.

---

## Đấu trường (The Arena)

[Bảng xếp hạng phương pháp (Method Leaderboard)](/leaderboard) chính là bảng điểm. Mọi lượt gửi đều được gắn dấu vân tay với một Git commit, được gắn phiên bản theo một tập dữ liệu cụ thể và được chấm điểm bởi cùng một harness. Bất kỳ ai cũng có thể gửi.

**Bạn có thể chứng minh điều gì?** Harness nhận đầu vào là JSON. Các plugin nhận JSON. Bất kỳ phương pháp nào tạo ra JSON đều có thể được kiểm thử:

| Cách tiếp cận | Ví dụ |
|----------|---------|
| **Coached LLM** | Đưa các quy tắc ngữ pháp và từ điển vào prompt của một mô hình tiên tiến (frontier model) |
| **Mô hình Fine-tuned** | Huấn luyện một mô hình mở trên văn bản song ngữ — chỉ cần không dùng dữ liệu đánh giá (eval data) |
| **Pipeline FST-gated** | LLM tạo văn bản → finite-state transducer xác thực hình thái học → thử lại |
| **Chuỗi mô hình (Chained models)** | Mô hình A viết nháp → Mô hình B hậu biên tập → Mô hình C chấm điểm |
| **Từ điển + LLM** | Ép buộc dùng các thuật ngữ đã biết từ từ điển, để LLM xử lý phần còn lại |
| **Tiến hóa (Evolutionary)** | Tạo các ứng viên, chấm điểm, đột biến ứng viên tốt nhất, lặp lại |
| **Dịch một phần** | Dịch thủ công một mẫu, chứng minh LLM của bạn khớp với mẫu đó, tự động dịch phần còn lại |

Fine-tune các mô hình. Triển khai các thuật toán tiến hóa. Kiểm tra câu trả lời của học sinh trong các bài thi ngôn ngữ. Xây dựng các bảng tra cứu (lookup tables). Nối ba mô hình lại với nhau. Miễn là phương pháp của bạn tạo ra JSON, harness sẽ chấm điểm và framework sẽ chạy nó.

:::danger Quy tắc duy nhất
**Không huấn luyện trên dữ liệu đánh giá.** Các phương pháp tiếp xúc với tập dữ liệu benchmark sẽ bị loại. Bạn có thể fine-tune trên bất cứ thứ gì bạn muốn. Chỉ là không được dùng tập kiểm thử (test set).
:::

Đây là một lời mời mở. Nếu bạn làm việc với một ngôn ngữ ít tài nguyên — với tư cách là một nhà nghiên cứu, một thành viên cộng đồng, một sinh viên, hoặc chỉ là một người quan tâm — hãy xây dựng một phương pháp, chạy harness và giành lấy điểm số cao nhất. Bài toán này vẫn chưa có lời giải. Cơ sở hạ tầng đã có sẵn ở đây.

**[→ Xem bảng xếp hạng](/leaderboard)**

---

## Các bước tiếp theo

**Bắt đầu:**
- [Cài đặt](/docs/getting-started/installation) — Thiết lập trong 2 phút
- [Bắt đầu nhanh](/docs/getting-started/quick-start) — Chạy lần đồng bộ đầu tiên của bạn
- [Ngôn ngữ được hỗ trợ](/docs/reference/supported-languages) — Những ngôn ngữ có sẵn ngay khi cài đặt

**Tùy chỉnh thiết lập của bạn:**
- [Phương pháp dịch](/docs/guides/translation-methods) — Chọn phương pháp phù hợp cho từng cặp ngôn ngữ
- [Translation Memory](/docs/concepts/translation-memory) — Cách bộ nhớ đệm giúp bạn tiết kiệm tiền
- [Cấu hình](/docs/getting-started/configuration) — Tài liệu tham khảo cấu hình đầy đủ
- [Trang web đa ngôn ngữ Hugo](/docs/tutorials/hugo-multilingual-site) — Dịch nội dung Markdown

**Tìm hiểu sâu hơn:**
- [Làm việc với dịch giả chuyên nghiệp](/docs/guides/professional-translators) — Quy trình xuất/nhập XLIFF
- [Chủ quyền Dữ liệu](https://mtevalarena.org/docs/sovereignty/data-sovereignty) — Các nguyên tắc OCAP, CARE và Chủ quyền Dữ liệu Māori
- [Hỗ trợ ngôn ngữ ít tài nguyên](https://mtevalarena.org/docs/community/low-resource-languages) — Thử thách khởi nguồn cho tất cả
- [Cookbook: Pipeline FST-Gated](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — Xây dựng một pipeline phân rã (decomposition pipeline)
- [Đánh giá MT (Dịch máy)](https://mtevalarena.org/docs/leaderboard/rules) — Cách harness và bảng xếp hạng hoạt động
- [Bảng xếp hạng phương pháp](/leaderboard) — Điểm số trực tiếp và các lượt gửi