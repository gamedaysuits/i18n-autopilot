---
sidebar_position: 4
title: "Giao diện phương thức"
---
# Giao diện Method dùng chung

Eval harness và i18n-rosetta chia sẻ một khái niệm chung về **phương thức dịch** (translation method). Một method là bất kỳ quy trình nào nhận văn bản nguồn và tạo ra văn bản dịch — cho dù đó là một lệnh gọi LLM trực tiếp, một pipeline nhiều giai đoạn, một API của bên thứ ba hay một người dịch.

## Kiến trúc

```
Method Plugin (v2 Spec)
├── manifest.json         ← Shared metadata (name, version, supported pairs)
├── method_card.json      ← Leaderboard description (what, not how)
├── translate.py          ← Python entry point (for eval harness)
└── translate.js          ← Node.js entry point (for i18n-rosetta CLI)
```

## Hai hệ thống, Một giao diện

| | Eval Harness | i18n-rosetta |
|---|---|---|
| **Ngôn ngữ** | Python | Node.js |
| **Điểm đầu vào** | `translate.py` | `translate.js` |
| **Giao diện** | Giao thức `TranslationProcess` | Cấu hình `methodPlugin` |
| **Mục đích** | Đánh giá hàng loạt có chấm điểm | Bản địa hóa trực tiếp trong dev/CI |
| **Đầu ra** | Run card kèm các chỉ số | Các tệp locale đã dịch |

Một method hỗ trợ cả hai hệ thống sẽ cung cấp hai điểm đầu vào — một cho mỗi language runtime. **Method card** chính là cầu nối: nó mô tả method theo một định dạng mà cả hai hệ thống đều hiểu được.

## Method Card

Một method card mô tả một phương thức dịch là *gì* mà không tiết lộ các chi tiết độc quyền như toàn bộ system prompt. Nó trả lời các câu hỏi:

- Đây là class method nào? (raw LLM, coached LLM, pipeline, API, v.v.)
- Nó sử dụng những công cụ nào? (FST analyzer, từ điển, v.v.)
- Việc triển khai có phải là mã nguồn mở không?
- Nó hỗ trợ những cặp ngôn ngữ nào?

Xem [Method Card Spec](https://github.com/gamedaysuits/gds-mt-eval-harness/blob/main/docs/method-card-spec.md) để biết toàn bộ JSON schema.

### Ví dụ

```json
{
  "method_id": "fst-gated-v8",
  "name": "FST-Gated Coached Translation v8",
  "class": "pipeline",
  "description": "LLM translation with morphological validation. Failed words are retried with FST feedback.",
  "author": "Curtis Forbes",
  "tools_used": ["HFST morphological analyzer", "Wolvengrey dictionary"],
  "open_source": false,
  "supported_pairs": ["eng>crk"]
}
```

### Các Method Class

| Class | Mô tả |
|-------|-------------|
| `raw-llm` | Gọi LLM trực tiếp với hướng dẫn tối thiểu |
| `coached-llm` | LLM với prompt có cấu trúc, ví dụ, các ràng buộc |
| `pipeline` | Pipeline nhiều giai đoạn với các thành phần tất định |
| `custom-plugin` | Tiến trình bên ngoài triển khai giao thức `TranslationProcess` |
| `api` | API dịch của bên thứ ba (Google Translate, DeepL, v.v.) |
| `human` | Dịch thuật bởi con người (để thiết lập baseline) |

## Eval Harness: Giao thức TranslationProcess

Eval harness sử dụng structural typing của Python (`Protocol`) cho các plugin. Bất kỳ class nào có method signature phù hợp đều hoạt động — không yêu cầu kế thừa:

```python
class MyMethod:
    async def translate(self, entries: list[dict], config: RunConfig) -> list[dict]:
        results = []
        for entry in entries:
            translation = await self.do_translation(entry["source"])
            results.append({
                "id": entry["id"],
                "predicted": translation,
                "latency_s": 0.5,
                "usage": {"prompt_tokens": 0, "completion_tokens": 0},
                "error": None,
                "tool_calls": [],
                "tool_call_count": 0,
                "metadata": {},
            })
        return results
```

Xem [Plugin Protocol](https://github.com/gamedaysuits/gds-mt-eval-harness/blob/main/docs/plugin-protocol.md) để biết tài liệu đầy đủ bao gồm các ví dụ về wrapper cho các method không dùng Python.

## i18n-rosetta: Cấu hình methodPlugin

Trong rosetta, các method được đăng ký theo từng cặp ngôn ngữ trong `i18n-rosetta.config.json`:

```json
{
  "version": 3,
  "pairs": {
    "en:crk": {
      "methodPlugin": "crk-coached-v1"
    }
  }
}
```

Xem [Plugin Spec](/docs/reference/plugin-spec) để biết giao diện phía rosetta.

## Tích hợp Leaderboard

Khi một method card được đính kèm vào một run (thông qua `--method-card`), nó sẽ được nhúng vào run card và hiển thị trên leaderboard:

```bash
# Run with method card attached
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --method-card method_card.json \
  --submit
```

Leaderboard hiển thị:
- **Class badge** — chỉ báo trực quan (ví dụ: "pipeline", "coached-llm")
- **Tên method** — từ method card
- **Công cụ được sử dụng** — được liệt kê từ method card
- **Chỉ báo mã nguồn mở**

Khi không có method card nào được đính kèm, leaderboard sẽ hiển thị cấu hình gốc của harness (model, condition, temperature, tools enabled).

:::danger KHÔNG HUẤN LUYỆN trên dữ liệu đánh giá
Các method có quá trình phát triển bao gồm việc tiếp xúc với tập dữ liệu đánh giá — dưới dạng dữ liệu huấn luyện, ví dụ few-shot, mục từ điển hoặc tài liệu tinh chỉnh prompt (prompt tuning) — sẽ bị **loại** khỏi leaderboard. Xem [MT Evaluation](/docs/eval/) để biết điều gì phân biệt một method tốt với một method tồi.
:::

---

## Xem thêm

- [MT Evaluation](/docs/eval/) — tổng quan, giá trị của leaderboard và hướng dẫn về method tốt/tồi
- [Eval Harness](/docs/eval/harness) — cách chạy đánh giá
- [Evaluation Datasets](/docs/eval/datasets) — các tập dữ liệu có sẵn (EDTeKLA, FLORES+)
- [Run Card Specification](/docs/eval/run-card) — JSON schema của run card
- [Plugin Spec](/docs/reference/plugin-spec) — giao diện plugin phía rosetta
- [Method Leaderboard](/leaderboard) — điểm chuẩn (benchmark) trực tiếp