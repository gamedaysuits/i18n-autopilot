---
sidebar_position: 2
title: "Eval Harness v2.0"
---
# Eval Harness v2.0

Harness này chạy các thử nghiệm dịch thuật và tạo ra các run card. Nó xử lý việc xây dựng prompt, gọi API, chấm điểm và tuần tự hóa kết quả — bạn chỉ cần cung cấp dataset và model.

## Cài đặt

**Yêu cầu:** Python 3.10+

```bash
pip install sacrebleu aiohttp
```

Clone repository của harness:

```bash
git clone https://github.com/gamedaysuits/gds-mt-eval-harness.git
cd gds-mt-eval-harness
```

## Cách sử dụng

```bash
python eval/baseline_experiment.py --dataset path/to/dataset.json
```

Lệnh này chạy mọi mục trong dataset qua model đã cấu hình, chấm điểm các kết quả đầu ra và ghi một file JSON run card vào thư mục `results/`.

## Các cờ CLI

| Cờ | Bắt buộc | Mặc định | Mô tả |
|------|----------|---------|-------------|
| `--dataset` | ✅ | — | Đường dẫn đến file JSON của dataset đánh giá |
| `--model` | — | `openai/gpt-4o` | Slug của model OpenRouter (ví dụ: `google/gemini-2.5-pro`) |
| `--condition` | — | `baseline` | Nhãn thử nghiệm. Dùng để phân biệt các chiến lược prompt (ví dụ: `coached`, `few-shot`, `dictionary-augmented`) |
| `--temperature` | — | `0.3` | Nhiệt độ lấy mẫu. Thấp hơn = mang tính xác định cao hơn |
| `--batch-size` | — | `5` | Số lượng mục trên mỗi batch API đồng thời |
| `--fst-analyzer` | — | `null` | Đường dẫn đến file thực thi của FST analyzer. Khi được cung cấp, mỗi đầu ra sẽ được kiểm tra về mức độ chấp nhận hình thái học |
| `--submit` | — | `false` | Gửi run card lên API của leaderboard sau khi quá trình chạy hoàn tất |

### Ví dụ

```bash
# Run with defaults (GPT-4o, baseline condition)
python eval/baseline_experiment.py --dataset data/edtekla-dev-v1.json

# Coached experiment with Gemini, lower temperature
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --model google/gemini-2.5-pro \
  --condition coached-v3 \
  --temperature 0.1

# Run with FST validation and auto-submit
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --fst-analyzer ./bin/crk-analyzer \
  --submit
```

---

## Schema của Run Card

Mỗi thử nghiệm tạo ra một **run card** — một tài liệu JSON độc lập. Cấu trúc cấp cao nhất:

```json
{
  "run_id": "uuid-v4",
  "harness_version": "2.0",
  "model_slug": "openai/gpt-4o",
  "model_id": "gpt-4o-2024-08-06",
  "condition": "baseline",
  "timestamp": "2025-05-20T03:22:41Z",
  "elapsed_seconds": 142.7,
  "dataset": { ... },
  "config": { ... },
  "system_prompt_sha256": "abc123...",
  "system_prompt_used": "You are a translator...",
  "fingerprint": { ... },
  "scores": { ... },
  "totals": { ... },
  "environment": { ... },
  "results": [ ... ],
  "run_card_hash": "sha256-of-entire-card"
}
```

Xem [Đặc tả Run Card](/docs/eval/run-card) để biết toàn bộ schema với mọi trường đã được tài liệu hóa.

### Các khối chính

**`dataset`** — Xác định dataset nào đã được sử dụng, bao gồm cả mã băm (hash) nội dung của nó để kết quả được gắn với một phiên bản cụ thể:

```json
{
  "id": "edtekla-dev-v1",
  "version": "1.0",
  "language_pair": "EN→CRK",
  "sha256": "...",
  "entry_count": 124
}
```

**`scores`** — Các chỉ số tổng hợp cho lần chạy:

```json
{
  "total": 124,
  "exact_matches": 12,
  "exact_match_rate": 0.0968,
  "fst_accepted": 87,
  "fst_acceptance_rate": 0.7016,
  "chrf_plus_plus": 42.31,
  "errors": 0,
  "avg_latency_seconds": 1.15,
  "median_latency_seconds": 1.02,
  "p95_latency_seconds": 2.34,
  "by_difficulty": { ... },
  "by_provenance": { ... }
}
```

**`totals`** — Theo dõi việc sử dụng token và chi phí:

```json
{
  "prompt_tokens": 48200,
  "completion_tokens": 3100,
  "reasoning_tokens": 0,
  "cached_tokens": 12000,
  "total_cost_usd": 0.42,
  "cost_per_entry_usd": 0.0034,
  "reasoning_ratio": 0.0
}
```

---

## Fingerprint so với Run Card Hash

Harness tạo ra hai mã băm (hash) riêng biệt. Chúng phục vụ các mục đích khác nhau:

### Fingerprint

**Fingerprint** trả lời cho câu hỏi: *"Lần chạy này có thể được tái tạo không?"*

Nó băm sự kết hợp của các đầu vào xác định cấu hình thử nghiệm — không phải các đầu ra:

- SHA-256 của dataset
- Slug của model
- Nhãn điều kiện
- SHA-256 của system prompt
- Temperature
- Phiên bản của harness

Hai lần chạy có fingerprint giống hệt nhau tức là đã sử dụng cùng một thiết lập. Kết quả của chúng có thể so sánh được với nhau (ngoại trừ tính không xác định của API).

### Run Card Hash

**Run card hash** trả lời cho câu hỏi: *"File kết quả cụ thể này có bị giả mạo không?"*

Đó là mã băm SHA-256 của toàn bộ file JSON run card (ngoại trừ chính trường `run_card_hash`). Nếu bất kỳ trường nào thay đổi — một điểm số, một mốc thời gian, một đầu ra duy nhất — mã băm sẽ bị phá vỡ.

:::info Khi nào nên dùng loại nào
Sử dụng **fingerprint** để nhóm các lần chạy có thể so sánh (cùng một thử nghiệm, các lần thực thi khác nhau). Sử dụng **run card hash** để xác minh tính toàn vẹn của một file kết quả cụ thể.
:::

---

## Gửi lên Leaderboard

### Gửi tự động

Truyền `--submit` để tải run card lên khi hoàn tất:

```bash
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --submit
```

### Gửi thủ công

Các run card được lưu dưới dạng file JSON trong `results/`. Bạn có thể gửi bất kỳ file run card nào thông qua giao diện người dùng của leaderboard tại [/leaderboard](/leaderboard), hoặc thông qua API:

```bash
curl -X POST https://i18n-rosetta.com/api/leaderboard/submit \
  -H "Content-Type: application/json" \
  -d @results/your-run-card.json
```

:::warning Xác thực của Leaderboard
Leaderboard xác thực các run card được gửi dựa trên registry của dataset. Các bài gửi tham chiếu đến các dataset không xác định, hoặc có `run_card_hash` bị hỏng, sẽ bị từ chối.
:::

:::danger KHÔNG HUẤN LUYỆN trên dữ liệu đánh giá
Nếu phương pháp của bạn đã tiếp xúc với dataset đánh giá trong quá trình phát triển — dưới dạng dữ liệu huấn luyện, ví dụ few-shot, mục từ điển, hoặc tài liệu prompt engineering — bài gửi của bạn sẽ bị **loại**. Xem [Đánh giá MT](/docs/eval/) để biết điều gì tạo nên một phương pháp tốt so với phương pháp tồi.
:::

---

## Xem thêm

- [Đánh giá MT](/docs/eval/) — tổng quan, đề xuất giá trị của leaderboard, và hướng dẫn về phương pháp tốt/tồi
- [Các Dataset đánh giá](/docs/eval/datasets) — định dạng dataset, EDTeKLA, FLORES+
- [Đặc tả Run Card](/docs/eval/run-card) — toàn bộ schema JSON
- [Xây dựng một Phương pháp](/docs/eval/methods) — interface của phương pháp để tạo ra các phương pháp có thể đánh giá được
- [Leaderboard Phương pháp](/leaderboard) — điểm số benchmark trực tiếp