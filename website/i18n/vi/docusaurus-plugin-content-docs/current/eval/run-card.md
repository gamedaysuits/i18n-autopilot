---
sidebar_position: 4
title: "Đặc tả Run Card"
---
# Đặc tả Run Card

Run card là bản ghi hoàn chỉnh của một lần chạy đánh giá duy nhất. Nó chứa mọi thứ cần thiết để hiểu, tái tạo và xác minh thử nghiệm: cấu hình, điểm số, kết quả riêng lẻ, mức sử dụng token và siêu dữ liệu môi trường.

**Phiên bản schema:** 2.0

---

## Các trường cấp cao nhất

| Trường | Loại | Mô tả |
|-------|------|-------------|
| `run_id` | `string` | UUID v4 được tạo khi bắt đầu chạy |
| `harness_version` | `string` | Phiên bản semantic của harness đã tạo ra thẻ này (ví dụ: `2.0`) |
| `model_slug` | `string` | Slug mô hình OpenRouter được sử dụng cho lần chạy (ví dụ: `openai/gpt-4o`) |
| `model_id` | `string` | Định danh mô hình đã được phân giải do API trả về (ví dụ: `gpt-4o-2024-08-06`) |
| `condition` | `string` | Nhãn thử nghiệm (ví dụ: `baseline`, `coached-v3`, `few-shot`) |
| `timestamp` | `string` | Dấu thời gian ISO 8601 UTC khi lần chạy bắt đầu |
| `elapsed_seconds` | `number` | Thời lượng thực tế (wall-clock) của toàn bộ lần chạy |

```json
{
  "run_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "harness_version": "2.0",
  "model_slug": "openai/gpt-4o",
  "model_id": "gpt-4o-2024-08-06",
  "condition": "baseline",
  "timestamp": "2025-05-20T03:22:41Z",
  "elapsed_seconds": 142.7
}
```

---

## `dataset`

Xác định tập dữ liệu đánh giá và ghim nó vào một phiên bản nội dung cụ thể thông qua SHA-256.

| Trường | Loại | Mô tả |
|-------|------|-------------|
| `id` | `string` | Định danh tập dữ liệu (ví dụ: `edtekla-dev-v1`) |
| `version` | `string` | Chuỗi phiên bản tập dữ liệu |
| `language_pair` | `string` | Nhãn hiển thị (ví dụ: `EN→CRK`) |
| `sha256` | `string` | Mã băm SHA-256 của nội dung tệp tập dữ liệu. Đảm bảo dữ liệu chính xác được sử dụng |
| `entry_count` | `number` | Số lượng mục trong tập dữ liệu |

```json
{
  "dataset": {
    "id": "edtekla-dev-v1",
    "version": "1.0",
    "language_pair": "EN→CRK",
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "entry_count": 124
  }
}
```

---

## `config`

Cấu hình API và batching được sử dụng cho lần chạy này.

| Trường | Loại | Mô tả |
|-------|------|-------------|
| `api_provider` | `string` | Tên nhà cung cấp API (ví dụ: `openrouter`) |
| `temperature` | `number` | Nhiệt độ lấy mẫu |
| `max_tokens` | `number` | Số token tối đa cho mỗi lần hoàn thành |
| `batch_size` | `number` | Số mục trên mỗi batch đồng thời |
| `concurrency` | `number` | Số yêu cầu API song song tối đa |

```json
{
  "config": {
    "api_provider": "openrouter",
    "temperature": 0.3,
    "max_tokens": 1024,
    "batch_size": 5,
    "concurrency": 3
  }
}
```

---

## `system_prompt_sha256` / `system_prompt_used`

| Trường | Loại | Mô tả |
|-------|------|-------------|
| `system_prompt_sha256` | `string` | Mã băm SHA-256 của system prompt. Được bao gồm trong fingerprint |
| `system_prompt_used` | `string` | Toàn bộ văn bản system prompt được gửi đến mô hình |

Mã băm của prompt là một phần của [fingerprint](#fingerprint) — hai lần chạy với các prompt khác nhau sẽ có các fingerprint khác nhau ngay cả khi tất cả các cài đặt khác đều khớp.

---

## `fingerprint`

Một định danh khả năng tái tạo. Hai lần chạy có fingerprint giống hệt nhau đã sử dụng cùng một thiết lập thử nghiệm.

| Trường | Loại | Mô tả |
|-------|------|-------------|
| `hash` | `string` | Mã băm SHA-256 của các thành phần đã được sắp xếp |
| `components` | `object` | Các giá trị đầu vào đã được băm |

### Các thành phần của Fingerprint

| Thành phần | Mô tả |
|-----------|-------------|
| `dataset_sha256` | Mã băm của tệp tập dữ liệu |
| `model_slug` | Mô hình được sử dụng |
| `condition` | Nhãn điều kiện thử nghiệm |
| `system_prompt_sha256` | Mã băm của system prompt |
| `temperature` | Nhiệt độ lấy mẫu |
| `harness_version` | Phiên bản harness |

```json
{
  "fingerprint": {
    "hash": "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    "components": {
      "dataset_sha256": "e3b0c44298fc1c14...",
      "model_slug": "openai/gpt-4o",
      "condition": "baseline",
      "system_prompt_sha256": "abc123...",
      "temperature": 0.3,
      "harness_version": "2.0"
    }
  }
}
```

:::info Fingerprint ≠ Run Card Hash
Fingerprint xác định *cấu hình thử nghiệm*. `run_card_hash` xác minh *tính toàn vẹn của tệp kết quả*. Xem chi tiết tại [Fingerprint so với Run Card Hash](/docs/eval/harness#fingerprint-vs-run-card-hash).
:::

---

## `scores`

Các số liệu tổng hợp cho toàn bộ lần chạy.

### Điểm số cấp cao nhất

| Trường | Loại | Mô tả |
|-------|------|-------------|
| `total` | `number` | Tổng số mục được đánh giá |
| `exact_matches` | `number` | Các mục có đầu ra khớp chính xác với tiêu chuẩn vàng |
| `exact_match_rate` | `number` | `exact_matches / total` (0.0–1.0) |
| `fst_accepted` | `number` | Các mục mà FST analyzer đã chấp nhận đầu ra |
| `fst_acceptance_rate` | `number` | `fst_accepted / total` (0.0–1.0). `null` nếu không có FST analyzer nào được sử dụng |
| `chrf_plus_plus` | `number` | Điểm chrF++ cấp độ ngữ liệu (0–100) |
| `errors` | `number` | Các mục bị lỗi (lỗi API, hết thời gian chờ, v.v.) |
| `avg_latency_seconds` | `number` | Thời gian phản hồi trung bình trên tất cả các mục |
| `median_latency_seconds` | `number` | Thời gian phản hồi trung vị |
| `p95_latency_seconds` | `number` | Thời gian phản hồi ở phân vị thứ 95 |

### `by_difficulty`

Điểm số được phân tích theo cấp độ khó. Mỗi khóa (`easy`, `medium`, `hard`) chứa các trường số liệu giống như điểm số cấp cao nhất.

```json
{
  "by_difficulty": {
    "easy": {
      "total": 42,
      "exact_matches": 8,
      "exact_match_rate": 0.1905,
      "chrf_plus_plus": 51.2,
      "fst_accepted": 35,
      "fst_acceptance_rate": 0.8333
    },
    "medium": { ... },
    "hard": { ... }
  }
}
```

### `by_provenance`

Điểm số được phân tích theo nguồn gốc của mục. Mỗi khóa (ví dụ: `gold_standard`, `textbook`) chứa các trường số liệu tương tự.

```json
{
  "by_provenance": {
    "gold_standard": {
      "total": 80,
      "exact_matches": 10,
      "exact_match_rate": 0.125,
      "chrf_plus_plus": 44.8
    },
    "textbook": { ... }
  }
}
```

---

## `totals`

Theo dõi mức sử dụng token và chi phí cho toàn bộ lần chạy.

| Trường | Loại | Mô tả |
|-------|------|-------------|
| `prompt_tokens` | `number` | Tổng số token đầu vào trên tất cả các lệnh gọi API |
| `completion_tokens` | `number` | Tổng số token đầu ra |
| `reasoning_tokens` | `number` | Số token được sử dụng cho suy luận chuỗi suy nghĩ (phụ thuộc vào mô hình, bằng 0 đối với hầu hết các mô hình) |
| `cached_tokens` | `number` | Số token được phục vụ từ bộ nhớ cache prompt của nhà cung cấp |
| `total_cost_usd` | `number` | Tổng chi phí tính bằng USD (theo báo cáo của API) |
| `cost_per_entry_usd` | `number` | `total_cost_usd / entry_count` |
| `reasoning_ratio` | `number` | `reasoning_tokens / completion_tokens` (0.0–1.0) |

```json
{
  "totals": {
    "prompt_tokens": 48200,
    "completion_tokens": 3100,
    "reasoning_tokens": 0,
    "cached_tokens": 12000,
    "total_cost_usd": 0.42,
    "cost_per_entry_usd": 0.0034,
    "reasoning_ratio": 0.0
  }
}
```

---

## `environment`

Siêu dữ liệu môi trường runtime để đảm bảo khả năng tái tạo.

| Trường | Loại | Mô tả |
|-------|------|-------------|
| `harness_version` | `string` | Phiên bản harness (phản ánh `harness_version` ở cấp cao nhất) |
| `harness_git_commit` | `string` | Git commit SHA của harness tại thời điểm chạy |
| `python_version` | `string` | Phiên bản trình thông dịch Python |
| `sacrebleu_version` | `string` | Phiên bản thư viện sacrebleu (được sử dụng để tính điểm chrF++) |
| `os` | `string` | Định danh hệ điều hành |

```json
{
  "environment": {
    "harness_version": "2.0",
    "harness_git_commit": "a1b2c3d",
    "python_version": "3.11.9",
    "sacrebleu_version": "2.4.0",
    "os": "macOS-14.5-arm64"
  }
}
```

---

## `results[]`

Mảng kết quả cho mỗi mục. Một đối tượng cho mỗi mục tập dữ liệu, theo thứ tự chỉ mục.

| Trường | Loại | Mô tả |
|-------|------|-------------|
| `entry_index` | `number` | Chỉ mục của mục này trong tập dữ liệu (khớp với `entries[].index`) |
| `source_text` | `string` | Văn bản nguồn đã được dịch |
| `target_expected` | `string` | Tham chiếu tiêu chuẩn vàng từ tập dữ liệu |
| `target_output` | `string` | Đầu ra thực tế của mô hình |
| `exact_match` | `boolean` | Liệu `target_output === target_expected` |
| `entry_chrf` | `number` | Điểm chrF++ cấp độ câu cho mục này (0–100) |
| `fst_accepted` | `boolean \| null` | Liệu FST analyzer có chấp nhận đầu ra hay không. `null` nếu không có analyzer nào được cấu hình |
| `fst_analysis` | `string[]` | Các chuỗi phân tích FST cho đầu ra (mảng trống nếu không được phân tích hoặc bị từ chối) |
| `difficulty` | `string` | Cấp độ khó từ tập dữ liệu (`easy`, `medium`, `hard`) |
| `provenance` | `string` | Thẻ nguồn gốc từ tập dữ liệu |
| `latency_seconds` | `number` | Thời gian phản hồi cho mục riêng lẻ này |
| `usage` | `object` | Mức sử dụng token cho mỗi mục: `{ prompt_tokens, completion_tokens, reasoning_tokens }` |
| `error` | `string \| null` | Thông báo lỗi nếu mục này thất bại. `null` khi thành công |

```json
{
  "results": [
    {
      "entry_index": 0,
      "source_text": "Hello",
      "target_expected": "tânisi",
      "target_output": "tânisi",
      "exact_match": true,
      "entry_chrf": 100.0,
      "fst_accepted": true,
      "fst_analysis": ["tânisi+V+AI+Ind+2Sg"],
      "difficulty": "easy",
      "provenance": "gold_standard",
      "latency_seconds": 0.82,
      "usage": {
        "prompt_tokens": 385,
        "completion_tokens": 12,
        "reasoning_tokens": 0
      },
      "error": null
    }
  ]
}
```

---

## `run_card_hash`

| Trường | Loại | Mô tả |
|-------|------|-------------|
| `run_card_hash` | `string` | Mã băm SHA-256 của toàn bộ JSON run card, với chính trường `run_card_hash` được đặt thành `""` trong quá trình băm |

Đây là con dấu phát hiện giả mạo. Bảng xếp hạng (leaderboard) sẽ tính toán lại mã băm này khi gửi và từ chối các thẻ không khớp.

**Cách tính mã băm:**

1. Tuần tự hóa (Serialize) run card thành JSON với `run_card_hash` được đặt thành `""`
2. Tính toán mã băm SHA-256 của chuỗi đã được tuần tự hóa
3. Đặt `run_card_hash` thành chuỗi hex digest thu được

```python
import hashlib, json

card["run_card_hash"] = ""
card_json = json.dumps(card, sort_keys=True, ensure_ascii=False)
card["run_card_hash"] = hashlib.sha256(card_json.encode()).hexdigest()
```

---

## Xem thêm

- [Đánh giá MT](/docs/eval/) — tổng quan, giá trị bảng xếp hạng và hướng dẫn phương pháp tốt/xấu
- [Eval Harness](/docs/eval/harness) — cách chạy đánh giá và tạo run card
- [Tập dữ liệu đánh giá](/docs/eval/datasets) — định dạng tập dữ liệu, EDTeKLA, FLORES+
- [Xây dựng phương pháp](/docs/eval/methods) — giao diện phương pháp và đặc tả method card
- [Bảng xếp hạng phương pháp](/leaderboard) — điểm chuẩn (benchmark) trực tiếp