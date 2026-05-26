---
sidebar_position: 1
slug: /
title: "Giới thiệu"
---
# i18n-rosetta

Một framework quốc tế hóa hoàn toàn có thể tùy chỉnh. Một lệnh duy nhất để dịch các file locale của bạn. Một cấu hình kiểm soát mọi phương thức, model và cặp ngôn ngữ. Và nếu các phương thức tích hợp sẵn là chưa đủ — hãy tự xây dựng phương thức của riêng bạn, chứng minh nó hoạt động và triển khai nó.

```bash
npx i18n-rosetta sync
```

rosetta tự động phát hiện các file locale, định dạng và ngôn ngữ đích của bạn. Nó dịch những gì còn thiếu, bỏ qua những gì đã hoàn thành, xác thực mọi kết quả và ghi ra output sạch sẽ. Đó mới chỉ là vạch xuất phát.

---

## Tại sao không tự viết script?

Bạn có thể viết một vòng lặp nhanh gọi Google Translate cho từng key. Hầu hết các lập trình viên đều làm vậy — chỉ mất khoảng 30 dòng code. Nhưng đây là lúc nó bộc lộ vấn đề:

- **Không có change detection.** Cập nhật một chuỗi tiếng Anh — bản dịch vẫn cũ kỹ mãi mãi. rosetta theo dõi mọi giá trị nguồn bằng mã băm SHA-256 và chỉ dịch lại những gì đã thay đổi.
- **Không có batching.** Một lệnh gọi API cho mỗi key có nghĩa là 200 key = 200 round trip. rosetta thực hiện batching một cách thông minh (có thể cấu hình, mặc định 30 key/batch cho LLM, 128 cho Google).
- **Không có quality gate.** Dịch máy có thể bị hallucinate, lặp lại nguyên văn bản gốc (source echo), hoặc xuất ra sai hệ thống chữ viết (script). rosetta xác thực mọi bản dịch trước khi ghi — lỗi sai script, length inflation (tăng độ dài bất thường) và source echo đều bị phát hiện và loại bỏ.
- **Không nhận biết định dạng.** Bị hardcode với JSON? rosetta xử lý JSON, TOML, YAML và Hugo Markdown (frontmatter + body) với khả năng tự động phát hiện.
- **Không kiểm soát phương thức.** Mọi cặp ngôn ngữ đều dùng chung một phương thức. rosetta cho phép bạn dùng Google Translate cho tiếng Pháp, một LLM cho tiếng Nhật và một pipeline tùy chỉnh do cộng đồng lưu trữ cho tiếng Cree — trong cùng một file cấu hình.

rosetta chính là phiên bản production của đoạn script đó.

---

## Điều gì làm nên sự khác biệt

### Mỗi phương thức là một plugin

Phương thức dịch có thể **cấu hình cho từng cặp ngôn ngữ**. Kết hợp Google Translate, các LLM, coached prompt và các API tùy chỉnh trong cùng một dự án:

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

Tiếng Pháp dùng Google Translate (nhanh, rẻ). Tiếng Nhật dùng một LLM cao cấp (tinh tế). Tiếng Plains Cree dùng một coached plugin với các quy tắc ngữ pháp, từ điển và morphological validation. Cùng một lệnh `sync`. Cùng một quality gate. Cùng một CLI.

### Hãy chứng minh điều đó

Bạn nghĩ phương thức của mình có thể dịch từ tiếng Anh sang tiếng Tây Ban Nha? Tiếng Thổ Nhĩ Kỳ sang tiếng Azerbaijan? Tiếng Anh sang tiếng Cree?

**Hãy chứng minh điều đó.** Công cụ đi kèm [eval harness](https://mtevalarena.org/docs/specifications/harness) sẽ benchmark bất kỳ phương thức dịch nào với điểm số có thể tái tạo và được fingerprinted. Bảng xếp hạng ([leaderboard](/leaderboard)) theo dõi mọi bài nộp.

Eval harness và production CLI dùng chung một giao diện plugin. Một phương thức đạt điểm cao trong harness có thể được sử dụng trong production — nếu cộng đồng sử dụng ngôn ngữ đó đồng ý. Đối với các ngôn ngữ bản địa và ngôn ngữ ít tài nguyên (low-resource languages), sự đồng ý đó rất quan trọng. Xem [Chủ quyền Dữ liệu](https://mtevalarena.org/docs/sovereignty/data-sovereignty).

```bash
# Benchmark your method (in the eval harness repo)
cd gds-mt-eval-harness
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json --submit

# Use it locally
npx i18n-rosetta sync
```

Cùng một plugin. Chỉ cần cắm vào và kiểm thử.

### Bộ công cụ hoàn chỉnh

rosetta không chỉ là `sync`. Nó là một i18n pipeline hoàn chỉnh:

| Lệnh | Chức năng |
|---------|-------------|
| `sync` | Dịch các key bị thiếu, cũ và fallback |
| `watch` | Tự động đồng bộ khi file nguồn của bạn thay đổi |
| `lint` | Quét mã nguồn để tìm các chuỗi bị hardcode |
| `wrap` | Tự động bọc các chuỗi bị hardcode vào các lệnh gọi `t()` |
| `audit` | Liệt kê tất cả các giá trị fallback `[EN]` chưa được dịch |
| `integrity` | Phát hiện lỗi hỏng placeholder và các vấn đề về encoding |
| `seo` | Tạo các thẻ hreflang, sitemap và JSON-LD |
| `status` | Hiển thị cấu hình cặp ngôn ngữ, plugin và điểm benchmark |
| `provenance` | Kiểm toán giấy phép tài nguyên dịch thuật |
| `plugin` | Cài đặt, gỡ bỏ và liệt kê các plugin phương thức |

Ba trong số này — `lint`, `sync`, `audit` — tạo thành một CI pipeline giúp bắt các chuỗi bị hardcode, dịch chúng và đánh fail bản build nếu có bất kỳ locale nào chưa hoàn chỉnh.

---

## Đấu trường (The Arena)

[Method Leaderboard](/leaderboard) chính là bảng điểm. Mọi bài nộp đều được fingerprinted với một Git commit, được gắn phiên bản với một tập dữ liệu cụ thể và được chấm điểm bởi cùng một harness. Bất kỳ ai cũng có thể nộp bài.

**Bạn có thể chứng minh điều gì?** Harness nhận đầu vào là JSON. Các plugin nhận đầu vào là JSON. Bất kỳ phương thức nào tạo ra JSON đều có thể được kiểm thử:

| Phương pháp tiếp cận | Ví dụ |
|----------|---------|
| **Coached LLM** | Đưa các quy tắc ngữ pháp và từ điển vào prompt của một frontier model |
| **Fine-tuned model** | Huấn luyện một open model trên văn bản song ngữ — chỉ cần không dùng evaluation data |
| **FST-gated pipeline** | LLM tạo văn bản → finite-state transducer xác thực hình thái (morphology) → retry |
| **Chained models** | Model A tạo bản nháp → Model B post-edit → Model C chấm điểm |
| **Dictionary + LLM** | Bắt buộc dùng các thuật ngữ đã biết từ từ điển, để LLM xử lý phần còn lại |
| **Evolutionary** | Tạo các ứng viên, chấm điểm, mutate (đột biến) ứng viên tốt nhất, lặp lại |
| **Partial translation** | Dịch tay một mẫu, chứng minh LLM của bạn khớp với mẫu đó, tự động dịch phần còn lại |

Fine-tune các model. Triển khai các thuật toán tiến hóa (evolutionary algorithms). Kiểm tra câu trả lời của học sinh trong các bài thi ngôn ngữ. Xây dựng các lookup table. Kết nối ba model lại với nhau. Miễn là phương thức của bạn tạo ra JSON, harness sẽ chấm điểm nó và framework sẽ chạy nó.

:::danger Quy tắc duy nhất
**Không huấn luyện trên evaluation data.** Các phương thức tiếp xúc với tập dữ liệu benchmark sẽ bị loại. Fine-tune trên bất kỳ dữ liệu nào bạn muốn. Chỉ cần không phải là test set.
:::

Đây là một lời mời mở. Nếu bạn làm việc với một ngôn ngữ ít tài nguyên — với tư cách là một nhà nghiên cứu, một thành viên cộng đồng, một sinh viên hoặc chỉ là một người quan tâm — hãy xây dựng một phương thức, chạy harness và giành lấy điểm số cao nhất. Bài toán vẫn chưa có lời giải. Cơ sở hạ tầng đã sẵn sàng ở đây.

**[→ Xem bảng xếp hạng](/leaderboard)**

---

## Các bước tiếp theo

**Bắt đầu:**
- [Cài đặt](/docs/getting-started/installation) — Thiết lập trong 2 phút
- [Bắt đầu nhanh](/docs/getting-started/quick-start) — Chạy lần đồng bộ đầu tiên của bạn
- [Ngôn ngữ được hỗ trợ](/docs/reference/supported-languages) — Những gì có sẵn ngay khi cài đặt

**Tùy chỉnh thiết lập của bạn:**
- [Các phương thức dịch](/docs/guides/translation-methods) — Chọn phương thức phù hợp cho từng cặp ngôn ngữ
- [Cấu hình](/docs/getting-started/configuration) — Tài liệu tham khảo cấu hình đầy đủ
- [Trang web đa ngôn ngữ Hugo](/docs/tutorials/hugo-multilingual-site) — Dịch nội dung Markdown

**Tìm hiểu sâu hơn:**
- [Chủ quyền Dữ liệu](https://mtevalarena.org/docs/sovereignty/data-sovereignty) — Các nguyên tắc OCAP, CARE và Chủ quyền Dữ liệu của người Māori
- [Hỗ trợ ngôn ngữ ít tài nguyên](https://mtevalarena.org/docs/community/low-resource-languages) — Thử thách khởi nguồn cho tất cả
- [Cookbook: FST-Gated Pipeline](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — Xây dựng một decomposition pipeline
- [Đánh giá MT](https://mtevalarena.org/docs/leaderboard/rules) — Cách thức hoạt động của harness và leaderboard
- [Method Leaderboard](/leaderboard) — Điểm số trực tiếp và các bài nộp