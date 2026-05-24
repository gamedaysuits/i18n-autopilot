---
sidebar_position: 3
title: "Tập dữ liệu đánh giá"
---
# Tập dữ liệu đánh giá

Các tập dữ liệu là những mục tiêu cố định mà harness chạy kiểm thử. Mỗi tập dữ liệu là một tệp JSON chứa các cặp nguồn→đích với các bản tham chiếu tiêu chuẩn vàng (gold-standard references). Harness chấm điểm các đầu ra của mô hình dựa trên các bản tham chiếu này — nó không bao giờ sửa đổi chúng.

:::danger KHÔNG HUẤN LUYỆN trên dữ liệu đánh giá

⚠️ **Các tập dữ liệu này chỉ dành cho đánh giá.** Các phương pháp được huấn luyện, tinh chỉnh (fine-tuned), few-shot-prompted, hoặc tiếp xúc với dữ liệu đánh giá bằng cách khác sẽ tạo ra điểm số cao giả tạo và sẽ bị **loại khỏi bảng xếp hạng.**

Hãy sử dụng các kho ngữ liệu (corpora) riêng biệt để huấn luyện. Các tập đánh giá phải được giữ kín, không cho mô hình của bạn thấy trong quá trình phát triển.
:::

---

## Định dạng tập dữ liệu

Mọi tập dữ liệu đều tuân theo cùng một lược đồ JSON:

```json
{
  "dataset": {
    "id": "dataset-slug",
    "version": "1.0",
    "language_pair": "EN→CRK",
    "description": "Human-readable description of the dataset",
    "source_language": "en",
    "target_language": "crk",
    "created": "2025-05-01",
    "license": "CC-BY-NC-4.0",
    "provenance": ["gold_standard", "textbook"]
  },
  "entries": [
    {
      "index": 0,
      "source_text": "Hello",
      "target_expected": "tânisi",
      "difficulty": "easy",
      "provenance": "gold_standard",
      "notes": "Common greeting, SRO orthography"
    }
  ]
}
```

### Khối `dataset` cấp cao nhất

| Trường | Loại | Mô tả |
|-------|------|-------------|
| `id` | `string` | Định danh tập dữ liệu duy nhất (được sử dụng trong run card và bảng xếp hạng) |
| `version` | `string` | Phiên bản ngữ nghĩa (Semantic version). Việc tăng giá trị này sẽ làm vô hiệu hóa các so sánh run card trước đó |
| `language_pair` | `string` | Nhãn hiển thị (ví dụ: `EN→CRK`) |
| `description` | `string` | Bản tóm tắt con người có thể đọc được |
| `source_language` | `string` | Mã ngôn ngữ nguồn BCP 47 |
| `target_language` | `string` | Mã ngôn ngữ đích BCP 47 |
| `created` | `string` | Ngày tạo theo chuẩn ISO 8601 |
| `license` | `string` | Định danh giấy phép SPDX |
| `provenance` | `string[]` | Danh sách các thẻ nguồn gốc (provenance tags) được sử dụng trên các mục |

### Các trường của mục (Entry Fields)

| Trường | Loại | Mô tả |
|-------|------|-------------|
| `index` | `number` | Chỉ mục của mục bắt đầu từ 0. Phải là duy nhất và tuần tự |
| `source_text` | `string` | Văn bản nguồn cần dịch |
| `target_expected` | `string` | Bản dịch tham chiếu tiêu chuẩn vàng |
| `difficulty` | `string` | Cấp độ khó: `easy`, `medium`, `hard` |
| `provenance` | `string` | Nguồn gốc của mục này (ví dụ: `gold_standard`, `textbook`, `elicited`) |
| `notes` | `string` | Ngữ cảnh tùy chọn dành cho người đánh giá |

---

## Các tập dữ liệu hiện có

### EDTeKLA Development Set v1

Tập dữ liệu đánh giá đầu tiên, được xây dựng cho bản dịch tiếng Anh→Plains Cree (SRO). Được tạo bởi [nhóm nghiên cứu EdTeKLA](https://spaces.facsci.ualberta.ca/edtekla/) tại Đại học Alberta.

| Thuộc tính | Giá trị |
|----------|-------|
| **ID** | `edtekla-dev-v1` |
| **Phiên bản** | `1.0` |
| **Cặp ngôn ngữ** | EN → CRK (Plains Cree, chính tả SRO) |
| **Số lượng mục** | 124 |
| **Phân bổ độ khó** | Dễ, Trung bình, Khó |
| **Nguồn gốc** | `gold_standard` (được xác minh bởi người bản ngữ), `textbook` (tài liệu giáo dục đã xuất bản) |
| **Giấy phép** | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) |

**Những gì được kiểm thử:**

- Các câu chào hỏi cơ bản và cụm từ thông dụng
- Tính động của danh từ (noun animacy) và sự chuyển hướng (obviation)
- Chia động từ theo các ngôi và thì
- Cấu trúc vị trí (locative constructions)
- Hệ biến hóa sở hữu (possessive paradigms)
- Cấu trúc câu phức tạp

:::tip Tại sao lại là 124 mục?
Tập dữ liệu này cố tình được làm nhỏ và được chọn lọc kỹ lưỡng. Mỗi mục đều được xác minh bởi những người nói trôi chảy hoặc lấy từ các sách giáo khoa tiếng Cree đã xuất bản. Một tập dữ liệu nhỏ, chất lượng cao với các tiêu chuẩn vàng đã được xác minh sẽ hữu ích hơn một tập dữ liệu lớn, nhiều nhiễu — đặc biệt là đối với một ngôn ngữ ít tài nguyên, nơi các bản dịch "gần đúng" thường không hợp lệ về mặt hình thái học.
:::

---

## Tạo một tập dữ liệu mới

Để tạo một tập dữ liệu cho một cặp ngôn ngữ hoặc miền mới:

### 1. Cấu trúc JSON

Tuân theo lược đồ [Định dạng tập dữ liệu](#dataset-format). Mọi mục đều phải có `source_text`, `target_expected`, `difficulty`, và `provenance`.

### 2. Gán một ID duy nhất

Sử dụng một slug mô tả: `{project}-{split}-v{version}` (ví dụ: `edtekla-dev-v1`, `quechua-test-v1`).

### 3. Xác minh các tiêu chuẩn vàng

Mọi giá trị `target_expected` đều phải được xác minh bởi một người nói trôi chảy hoặc lấy từ một nguồn tài nguyên đã xuất bản, được bình duyệt (peer-reviewed). Các bản tham chiếu do máy tạo ra sẽ làm mất đi mục đích của việc đánh giá.

### 4. Thiết lập các cấp độ khó

Gán cho mỗi mục một mức độ khó:

| Cấp độ | Tiêu chí |
|------|----------|
| `easy` | Các cụm từ ngắn, từ vựng thông dụng, hình thái học đơn giản |
| `medium` | Câu hoàn chỉnh, độ phức tạp hình thái học vừa phải |
| `hard` | Ngữ pháp phức tạp, cấu trúc hiếm gặp, nội dung đặc thù về văn hóa |

### 5. Gắn thẻ nguồn gốc

Mỗi mục nên chỉ ra nguồn gốc của nó. Các thẻ phổ biến:

- `gold_standard` — Được xác minh bởi người nói trôi chảy
- `textbook` — Từ các tài liệu giáo dục đã xuất bản
- `elicited` — Được tạo ra thông qua các phiên khơi gợi (elicitation sessions) có cấu trúc
- `corpus` — Được trích xuất từ một kho ngữ liệu song song

### 6. Xác thực tệp

Chạy harness trên tập dữ liệu của bạn với bất kỳ mô hình nào để xác minh JSON được định dạng đúng và tất cả các trường bắt buộc đều có mặt:

```bash
python eval/baseline_experiment.py --dataset path/to/your-dataset.json
```

Harness sẽ báo lỗi nếu thiếu trường, trùng lặp chỉ mục hoặc vi phạm lược đồ.

### 7. Gửi yêu cầu để được đưa vào

Mở một pull request tới [kho lưu trữ eval harness](https://github.com/gamedaysuits/gds-mt-eval-harness) với tệp tập dữ liệu của bạn trong thư mục `data/`. Hãy bao gồm tài liệu về phương pháp xác minh và các nguồn gốc của bạn.

---

## FLORES+ Devtest

Một tiêu chuẩn đánh giá (benchmark) đa ngôn ngữ có độ bao phủ rộng được duy trì bởi [Open Language Data Initiative (OLDI)](https://huggingface.co/datasets/openlanguagedata/flores_plus). Được sử dụng cho tiêu chuẩn đánh giá ranh giới đa mô hình (multi-model frontier benchmark) của rosetta.

| Thuộc tính | Giá trị |
|----------|-------|
| **ID** | `flores-plus-devtest` |
| **Các cặp ngôn ngữ** | EN → 39 ngôn ngữ (tất cả các ngôn ngữ tự nhiên đã đăng ký của rosetta) |
| **Số lượng mục** | 1.012 câu cho mỗi ngôn ngữ |
| **Giấy phép** | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| **Nguồn** | Ban đầu là Meta FLORES-200, hiện do OLDI duy trì |
| **Vị trí** | Các fixture được trích xuất sẵn tại `test/benchmark/fixtures/` trong kho lưu trữ rosetta chính |

:::danger Chỉ dành cho đánh giá
FLORES+ chỉ dành riêng cho mục đích đánh giá. Các nhà quản lý yêu cầu rõ ràng rằng nó **không được sử dụng làm dữ liệu huấn luyện**. Hãy đảm bảo nội dung của nó được loại trừ khỏi bất kỳ kho ngữ liệu huấn luyện nào.
:::

---

## Xem thêm

- [Đánh giá MT](/docs/eval/) — tổng quan về khung đánh giá và bảng xếp hạng
- [Eval Harness](/docs/eval/harness) — cách chạy đánh giá trên các tập dữ liệu này
- [Đặc tả Run Card](/docs/eval/run-card) — lược đồ JSON để ghi lại kết quả
- [Bảng xếp hạng phương pháp](/leaderboard) — điểm số benchmark trực tiếp
- [Dự án EdTeKLA](https://spaces.facsci.ualberta.ca/edtekla/) — nhóm nghiên cứu của Đại học Alberta đứng sau tập dữ liệu tiếng Cree