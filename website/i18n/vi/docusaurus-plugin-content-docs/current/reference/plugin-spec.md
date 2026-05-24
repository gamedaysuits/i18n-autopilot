---
sidebar_position: 2
title: "Đặc tả Plugin"
---
# Đặc tả Method Plugin

> **Phiên bản**: 1.1  
> **Đối tượng**: Các nhà phát triển plugin  
> **Canonical Schema**: [`schemas/rosetta-plugin.schema.json`](https://github.com/gamedaysuits/i18n-rosetta/blob/main/schemas/rosetta-plugin.schema.json)

## Tổng quan

i18n-rosetta sử dụng một **pluggable method system**. Mỗi cặp ngôn ngữ có thể sử dụng một translation method khác nhau (LLM, coached, script-converter, v.v.). Các method được đăng ký trong `lib/translate.js` và được phân giải cho từng cặp thông qua `lib/pairs.js`.

Nhiệm vụ của eval harness là **phát triển, kiểm thử và xuất** các translation method. Nhiệm vụ của i18n-rosetta là **tiếp nhận và thực thi** chúng. Harness không bao giờ chạy bên trong rosetta.

### Luồng dữ liệu

```mermaid
flowchart LR
    A["Evaluation Harness\n(Python / standalone)"] -->|"method.json\n+ coaching data"| B["i18n-rosetta\n(Node.js / npm)"]
```

---

## Định dạng Method Plugin

Một method plugin là một tệp JSON duy nhất (`method.json`) kèm theo các tệp coaching data tùy chọn.

### `method.json` — Bắt buộc

```json
{
  "name": "french-formal-v1",
  "type": "llm-coached",
  "version": "1.0.0",
  "description": "Formally-tuned French with terminology enforcement and grammar coaching",
  "author": "Plugin Author",

  "config": {
    "model": "google/gemini-3.5-flash",
    "register": "formal",
    "batchSize": 30,
    "temperature": 0.2
  },

  "locales": ["fr"],

  "benchmarks": {
    "fr": {
      "date": "2026-05-11T00:00:00Z",
      "corpus_size": 500,
      "exact_match_rate": 0.42,
      "corpus_chrf": 72.3,
      "corpus_bleu": 45.1,
      "model": "google/gemini-3.5-flash",
      "harness_version": "1.0.0"
    }
  },

  "provenance": {
    "resources": [],
    "commercialReady": false,
    "flags": ["license-unclear"]
  },

  "coaching": {
    "dir": "coaching"
  }
}
```

### Tham chiếu các trường

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|-------|------|----------|-------------|
| `name` | string | ✅ | Định danh method duy nhất (kebab-case) |
| `type` | string | ✅ | Loại method của Rosetta: `llm`, `llm-coached`, `api`, `google-translate`, `deepl`, `microsoft-translator`, `libretranslate`, `openai`, `anthropic`, `gemini` |
| `version` | string | ✅ | Phiên bản Semver (ví dụ: `1.0.0`) |
| `locales` | string[] | ✅ | Các mã locale mà method này nhắm tới (tối thiểu 1) |
| `description` | string | — | Mô tả chi tiết cho người đọc |
| `author` | string | — | Người đã phát triển/kiểm thử method này |
| `config.model` | string | — | Định danh model OpenRouter |
| `config.register` | string | — | Register/tone của ngôn ngữ đích |
| `config.batchSize` | number | — | Số lượng key trên mỗi API batch (1–200, mặc định: 30) |
| `config.temperature` | number | — | LLM temperature (0.0–2.0, mặc định: 0.3) |
| `benchmarks` | object | — | Kết quả benchmark theo từng locale |
| `provenance` | object | — | Cấp phép (Licensing) và các resource dependency |
| `coaching.dir` | string | — | Đường dẫn tương đối đến thư mục coaching data |

### Object Benchmark (theo từng locale)

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|-------|------|----------|-------------|
| `date` | string | ✅ | Timestamp ISO 8601 của lần chạy benchmark |
| `corpus_size` | number | ✅ | Số lượng entry được đánh giá |
| `exact_match_rate` | number | ✅ | 0.0–1.0, tỷ lệ exact match (khớp chính xác) |
| `corpus_chrf` | number | — | Điểm chrF++ (0–100) |
| `corpus_bleu` | number | — | Điểm BLEU (0–100) |
| `model` | string | ✅ | Model được sử dụng trong quá trình eval |
| `harness_version` | string | ✅ | Phiên bản của evaluation harness được sử dụng |

:::info Các metric nào được hiển thị?
Lệnh `rosetta status` hiển thị **chrF++** và **exact match rate** từ khối benchmark. `corpus_bleu` được chấp nhận trong manifest nhưng hiện tại không được hiển thị hoặc sử dụng bởi bất kỳ lệnh rosetta nào. [Method Leaderboard](/leaderboard) theo dõi chrF++, exact match và FST acceptance rate.
:::

---

### Object Provenance

Khối provenance truyền đạt trạng thái cấp phép (licensing) của các resource được đóng gói kèm theo plugin.

| Trường | Kiểu dữ liệu | Mặc định | Mô tả |
|-------|------|---------|-------------|
| `resources` | object[] | `[]` | Danh sách các resource được đóng gói kèm theo `name`, `license` và `type` |
| `commercialReady` | boolean | `false` | Plugin đã được phê duyệt để phân phối thương mại hay chưa |
| `flags` | string[] | `["license-unclear"]` | Các cờ trạng thái (status flags) máy có thể đọc được |

**Trạng thái mặc định** — các plugin được xuất ra sẽ đi kèm với `commercialReady: false` và `flags: ["license-unclear"]`.

**Trạng thái đã phê duyệt (Cleared state)** — khi việc cấp phép đã được xác minh: thiết lập `commercialReady: true` và xóa các cờ.

---

## Định dạng Coaching Data

Nếu `type` là `llm-coached`, plugin nên bao gồm các tệp coaching data trong thư mục con `coaching/`.

### `coaching/<locale>.json`

```json
{
  "grammar_rules": [
    "French adjectives agree in gender and number with the noun they modify",
    "Use 'vous' for formal contexts, 'tu' for informal"
  ],
  "dictionary": {
    "dashboard": "tableau de bord",
    "deployment": "déploiement",
    "settings": "paramètres"
  },
  "style_notes": "Prefer active voice. Avoid anglicisms where a native French term exists."
}
```

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|-------|------|----------|-------------|
| `grammar_rules` | string[] | — | Các rule được chèn vào mọi LLM prompt cho locale này |
| `dictionary` | object | — | Bản đồ thuật ngữ → bản dịch. Các thuật ngữ khớp sẽ được chèn vào dưới dạng thuật ngữ bắt buộc (required terminology). |
| `style_notes` | string | — | Các hướng dẫn văn phong tự do (freeform) được nối thêm vào prompt |

---

## Cấu trúc thư mục

```
french-formal-v1/
  method.json                 # Method manifest with benchmarks
  coaching/
    fr.json                   # Coaching data for French
```

Đối với các method đa locale (multi-locale):

```
european-formal-v2/
  method.json                 # locales: ["fr", "de", "es", "it"]
  coaching/
    fr.json
    de.json
    es.json
    it.json
```

---

## Cách Rosetta sử dụng Plugin

### Cài đặt

```bash
i18n-rosetta plugin install ./french-formal-v1/
```

Lưu vào `.rosetta/methods/french-formal-v1/`.

### Cấu hình

```json title="i18n-rosetta.config.json"
{
  "pairs": {
    "en:fr": {
      "methodPlugin": "french-formal-v1"
    }
  }
}
```

:::info Ngữ nghĩa gộp (Merge semantics)
Plugin định nghĩa *method nào* sẽ được sử dụng (`type`). Cấu hình cặp (pair config) tinh chỉnh *cách* chạy method đó (`model`, `register`, `batchSize`). Nếu cặp thiết lập `model`, nó sẽ ghi đè giá trị mặc định của plugin.
:::

### Runtime (Lúc chạy)

1. Rosetta đọc `method.json` từ `.rosetta/methods/french-formal-v1/`
2. Trường `type` của plugin thiết lập translation method (ví dụ: `llm-coached`)
3. Tải coaching data từ thư mục `coaching/` của plugin
4. Sử dụng khối `config` để điền các khoảng trống trong model/register/temperature
5. Khối `benchmarks` được hiển thị trong output của `rosetta status`
6. Khối `provenance` được kiểm tra bởi `rosetta provenance` để tìm các cờ cấp phép (licensing flags)

---

## Xác thực Schema

Các plugin manifest được xác thực tại thời điểm cài đặt dựa trên [`schemas/rosetta-plugin.schema.json`](https://github.com/gamedaysuits/i18n-rosetta/blob/main/schemas/rosetta-plugin.schema.json).

Tham chiếu schema trong `method.json` của bạn để IDE tự động hoàn thành (autocompletion):

```json
{
  "$schema": "./node_modules/i18n-rosetta/schemas/rosetta-plugin.schema.json",
  "name": "my-method-v1"
}
```

---

## Những gì KHÔNG ĐƯỢC bao gồm

- ❌ Không chứa mã Python hoặc các dependency của harness
- ❌ Không chứa dữ liệu corpus thô hoặc nhật ký chạy (run logs)
- ❌ Không chứa API key hoặc thông tin xác thực (credentials)
- ❌ Không chứa cấu hình harness
- ❌ Không chứa các prompt template nội bộ (chúng nằm trong các implementation method của rosetta)

Plugin **chỉ chứa dữ liệu (data only)**: cấu hình, nội dung coaching và kết quả benchmark.

---

## Xem thêm

- [Translation Methods](/docs/guides/translation-methods) — cách hoạt động của từng method tích hợp sẵn
- [Configuration](/docs/getting-started/configuration) — cấu hình theo từng cặp và từng ngôn ngữ
- [Serving a Method via API](/docs/guides/serving-a-method) — lưu trữ các method dưới dạng dịch vụ HTTP
- [Cookbook: FST-Gated Pipeline](/docs/tutorials/fst-gated-pipeline) — xây dựng và đóng gói một pipeline
- [MT Evaluation](/docs/eval/) — benchmark các method để gửi lên leaderboard
- [Support a Low-Resource Language](/docs/guides/low-resource-languages) — use case dành cho các plugin cộng đồng