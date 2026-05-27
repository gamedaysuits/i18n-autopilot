---
sidebar_position: 7
title: "Dành cho Doanh nghiệp"
description: "Cách các tổ chức có thể chuẩn hóa quy trình dịch thuật bằng các phương pháp đã được kiểm chứng trên bảng xếp hạng, plugin tùy chỉnh và triển khai chỉ với một câu lệnh."
---
# i18n-rosetta cho Doanh nghiệp

Nhóm của bạn thường xuyên dịch thuật nội dung. Bạn có một loạt các tệp ngôn ngữ (locale), một pipeline CI, và một quy trình có lẽ liên quan đến việc ai đó chạy Google Translate thủ công, sao chép kết quả vào JSON, và hy vọng mọi thứ ổn thỏa. Hoặc bạn đang trả phí cho một nền tảng TMS nơi bạn bị khóa chặt vào công cụ dịch thuật của một nhà cung cấp duy nhất.

Có một cách tốt hơn.

## Điểm nổi bật

1. **Chọn phương pháp tốt nhất cho từng ngôn ngữ** — không phải bất cứ thứ gì nhà cung cấp của bạn mặc định
2. **Triển khai chỉ với một lệnh** — `npx i18n-rosetta sync` dịch mọi ngôn ngữ, mọi định dạng, mọi lúc
3. **Thay đổi phương pháp mà không cần sửa mã** — chỉ là thay đổi cấu hình, không phải di chuyển hệ thống (migration)
4. **Làm chủ pipeline của bạn** — không bị khóa chặt vào nhà cung cấp, không có trang tổng quan hàng tháng, không cần tài khoản

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "pairs": {
    "en:fr": { "method": "deepl" },
    "en:ja": { "method": "llm", "model": "google/gemini-2.5-pro" },
    "en:de": { "method": "google-translate" },
    "en:ko": { "method": "llm", "register": "polite-haeyo" },
    "en:crk": { "methodPlugin": "crk-coached-v3" }
  }
}
```

Tiếng Pháp dùng DeepL (nhóm của bạn thích sự trôi chảy theo kiểu châu Âu của nó). Tiếng Nhật dùng một LLM tiên tiến. Tiếng Đức dùng Google Translate (nhanh, rẻ, đủ tốt). Tiếng Hàn dùng một LLM với văn phong trang trọng. Tiếng Plains Cree dùng một plugin được huấn luyện bởi cộng đồng có điểm số cao nhất trên bảng xếp hạng.

**Cùng một lệnh. Cùng một pipeline CI. Các phương pháp khác nhau cho từng cặp ngôn ngữ. Một tệp cấu hình duy nhất.**

## Quy trình Bảng xếp hạng → Triển khai

:::tip Sắp ra mắt: `rosetta leaderboard` CLI
Quy trình được mô tả dưới đây là sự tích hợp theo kế hoạch giữa bảng xếp hạng [MT Eval Arena](https://mtevalarena.org) và i18n-rosetta CLI. Cơ sở hạ tầng đã có sẵn ở cả hai phía — cầu nối đang được phát triển.
:::

[MT Eval Arena](https://mtevalarena.org) là nơi các phương pháp dịch thuật được đo lường hiệu suất (benchmark) với hệ thống chấm điểm có thể tái tạo và được gắn dấu vân tay (fingerprinted). Mỗi phương pháp nhận được một điểm tổng hợp qua nhiều chỉ số (chrF++, khớp chính xác, chấp nhận FST, chấm điểm ngữ nghĩa). Bảng xếp hạng theo dõi mọi lượt gửi.

Quy trình dự kiến:

```bash
# Browse the leaderboard from your terminal
npx i18n-rosetta leaderboard --pair en:crk

# Output:
# ┌──────┬───────────────────────┬────────────┬──────────┬───────────┐
# │ Rank │ Method                │ Model      │ chrF++   │ Composite │
# ├──────┼───────────────────────┼────────────┼──────────┼───────────┤
# │  1   │ crk-coached-v3        │ gemini-2.5 │ 43.2     │ 0.67      │
# │  2   │ fst-gated-pipeline    │ gpt-4o     │ 41.8     │ 0.63      │
# │  3   │ prompt-baseline       │ claude-4   │ 38.1     │ 0.55      │
# └──────┴───────────────────────┴────────────┴──────────┴───────────┘

# Install the top-scoring method as a plugin
npx i18n-rosetta plugin install crk-coached-v3

# Use it
npx i18n-rosetta sync
```

**Bạn không cần xây dựng phương pháp. Bạn không cần huấn luyện mô hình. Bạn chỉ cần chọn phương pháp chiến thắng và triển khai nó.** Nếu một phương pháp tốt hơn xuất hiện trên bảng xếp hạng vào tháng tới, bạn có thể thay đổi nó chỉ bằng một lệnh.

## Những gì hiện có

Cầu nối từ bảng xếp hạng đến CLI đang được phát triển. Dưới đây là những gì đang hoạt động ngay lúc này:

### Các phương pháp tích hợp sẵn (không cần plugin)

| Phương pháp | Tốt nhất cho | Chi phí |
|--------|----------|------|
| `llm` (mặc định) | Tập trung vào chất lượng, mọi ngôn ngữ | Trả theo token qua OpenRouter |
| `gemini` | Chất lượng + gói miễn phí | Miễn phí (có giới hạn), sau đó trả theo token |
| `google-translate` | Tốc độ + số lượng lớn | $20/triệu ký tự |
| `deepl` | Các ngôn ngữ châu Âu | $25/triệu ký tự |
| `llm-coached` | Các ngôn ngữ có dữ liệu huấn luyện | Trả theo token qua OpenRouter |
| `api` | Các phương pháp tùy chỉnh/do cộng đồng lưu trữ | Tự lưu trữ (Self-hosted) |

### Các phương pháp dùng plugin (cài đặt riêng)

Các plugin tùy chỉnh có thể bao bọc bất kỳ logic dịch thuật nào — một mô hình đã được tinh chỉnh (fine-tuned), một pipeline có cổng FST, một API cộng đồng, hoặc bất kỳ thứ gì khác tạo ra JSON. Xem [Xây dựng một Plugin](/docs/tutorials/build-a-plugin).

## Quy trình cho Doanh nghiệp

### 1. Đánh giá chất lượng hiện tại của bạn

```bash
# See what you're getting today
npx i18n-rosetta status

# Output shows: method per pair, cache hit rate, quality gate stats
```

### 2. Chạy eval harness trên các ứng viên

[Eval harness](https://mtevalarena.org/docs/specifications/harness) cho phép bạn đo lường hiệu suất (benchmark) nhiều phương pháp trên cùng một tập dữ liệu. Chạy quét toàn bộ, so sánh điểm số, chọn ra những phương pháp chiến thắng:

```bash
# In the eval harness repo
python -m mt_eval_harness.run \
  --methods coached-v3 baseline prompt-tuned \
  --dataset data/your-corpus.json
```

### 3. Cấu hình các phương pháp chiến thắng cho từng cặp ngôn ngữ

Cập nhật cấu hình của bạn để sử dụng phương pháp tốt nhất cho từng cặp ngôn ngữ. Các ngôn ngữ khác nhau có các phương pháp tốt nhất khác nhau — đó chính là điểm mấu chốt.

### 4. Tích hợp vào CI/CD

```bash
# In your CI pipeline
npx i18n-rosetta lint        # Catch hardcoded strings
npx i18n-rosetta sync        # Translate what changed
npx i18n-rosetta audit       # Fail if any locale is incomplete
npx i18n-rosetta integrity   # Validate placeholder consistency
```

Ba lệnh. Không cần dịch thủ công. Pipeline sẽ bắt các chuỗi được mã hóa cứng (hardcoded strings), dịch chúng bằng các phương pháp bạn đã chọn, và đánh lỗi bản dựng (fail the build) nếu có bất kỳ thứ gì bị thiếu hoặc hỏng.

### 5. Đánh giá chuyên môn (tùy chọn)

Đối với nội dung quan trọng, hãy xuất ra định dạng XLIFF để con người đánh giá:

```bash
npx i18n-rosetta xliff export --locale ja --output translations.xliff
# → Send to your translation agency
# → Import corrections back:
npx i18n-rosetta xliff import translations.xliff
```

Dịch máy phần lớn nội dung. Con người đánh giá các luồng quan trọng. Chỉ trả tiền cho thời gian của con người ở những nơi thực sự cần thiết.

## Mô hình Chi phí

rosetta **không có phí cấp phép, không có gói đăng ký hàng tháng, không tính phí theo người dùng**. Đây là một công cụ CLI mã nguồn mở. Bạn chỉ trả tiền cho các lệnh gọi API dịch thuật:

| Khối lượng | Google Translate | LLM (Gemini Flash) | LLM (GPT-4o) |
|--------|-----------------|---------------------|---------------|
| 1.000 key × 5 ngôn ngữ | ~$0.50 | ~$0.30 (gói miễn phí) | ~$2.00 |
| 10.000 key × 15 ngôn ngữ | ~$15 | ~$8 | ~$60 |
| 50.000 key × 30 ngôn ngữ | ~$75 | ~$40 | ~$300 |

Translation Memory (Bộ nhớ Dịch thuật) có nghĩa là bạn chỉ trả tiền cho **các key đã thay đổi** trong những lần đồng bộ tiếp theo. Nếu bạn cập nhật 10 chuỗi trong số 10.000 chuỗi, bạn chỉ trả tiền cho 10 bản dịch, không phải 10.000.

## So sánh với các nền tảng TMS

| | rosetta | Crowdin / Phrase / Locize |
|---|---|---|
| **Định giá** | Miễn phí (mã nguồn mở) + Chi phí API | $50–$500/tháng + theo người dùng |
| **Khóa chặt vào nhà cung cấp** | Không có — đổi nhà cung cấp trong cấu hình | Cao — dữ liệu nằm trên đám mây của họ |
| **Lựa chọn phương pháp** | Bất kỳ nhà cung cấp, bất kỳ mô hình nào, theo từng cặp | Bất cứ thứ gì họ cung cấp |
| **CI/CD** | Hỗ trợ hạng nhất (`lint → sync → audit`) | Plugin/webhook |
| **Các phương pháp tùy chỉnh** | Hệ thống plugin, plugin cộng đồng | Không hỗ trợ |
| **Kiểm soát chất lượng (Quality gate)** | Tích hợp sẵn (sai bảng chữ cái, lặp lại nguyên văn, độ dài) | Khác nhau |
| **Tự lưu trữ (Self-hosted)** | Có (LibreTranslate, API tùy chỉnh) | Không |

Xem [bảng so sánh đầy đủ](/docs/guides/comparison) để biết thêm chi tiết.

## Đọc thêm

- **[Bắt đầu nhanh](/docs/getting-started/quick-start)** — chạy lần đồng bộ đầu tiên của bạn trong 60 giây
- **[Các phương pháp dịch thuật](/docs/guides/translation-methods)** — danh sách đầy đủ các phương pháp kèm cây quyết định
- **[Tích hợp CI/CD](/docs/guides/ci-cd)** — tự động hóa trong pipeline của bạn
- **[Làm việc với các dịch giả chuyên nghiệp](/docs/guides/professional-translators)** — xuất/nhập XLIFF
- **[MT Eval Arena](https://mtevalarena.org)** — đo lường hiệu suất và bảng xếp hạng
- **[Tài liệu tham khảo về Cấu hình](/docs/getting-started/configuration)** — mọi tùy chọn cấu hình