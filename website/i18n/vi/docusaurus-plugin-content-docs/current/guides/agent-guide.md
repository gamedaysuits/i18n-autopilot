---
sidebar_position: 9
title: "Hướng dẫn cho Agent: Sử dụng i18n-rosetta"
description: "Cách các AI agent có thể cài đặt, cấu hình và chạy i18n-rosetta để dịch các tệp locale."
---
# Hướng dẫn dành cho Agent: Sử dụng i18n-rosetta

i18n-rosetta là một công cụ CLI giúp dịch các tệp ngôn ngữ của ứng dụng chỉ với một lệnh. Hướng dẫn này dành cho các AI agent (hoặc các nhà phát triển làm việc với AI agent) muốn nhanh chóng đi từ con số không đến khi có các tệp ngôn ngữ đã được dịch hoàn chỉnh.

:::tip Đã quen thuộc?
Nếu bạn chỉ cần các câu lệnh, hãy chuyển đến [Tài liệu tham khảo CLI](/docs/reference/cli). Nếu bạn muốn xây dựng và đánh giá (benchmark) một phương pháp dịch, hãy xem [Hướng dẫn dành cho Agent của Arena](https://mtevalarena.org/docs/getting-started/agent-guide).
:::

---

## Thiết lập Môi trường

```bash
# No global install needed — npx runs it directly
npx i18n-rosetta sync
```

**Yêu cầu:**
- Node.js 18+
- Một API key cho nhà cung cấp dịch vụ dịch thuật của bạn

**Thiết lập API key** — rosetta cần ít nhất một key tùy thuộc vào phương pháp bạn sử dụng:

```bash
# Option 1: export (session only)
export OPENROUTER_API_KEY="sk-or-..."        # for llm / llm-coached methods
export GOOGLE_TRANSLATE_API_KEY="AIza..."    # for google-translate method

# Option 2: .env file in your project root (persistent, gitignored)
echo 'OPENROUTER_API_KEY=sk-or-...' > .env
```

Rosetta tự động đọc `.env`. Nhận OpenRouter key tại [openrouter.ai/keys](https://openrouter.ai/keys).

---

## Đồng bộ lần đầu

Rosetta tự động phát hiện các tệp ngôn ngữ của bạn, định dạng của chúng (JSON, TOML, YAML, PO) và các ngôn ngữ đích:

```bash
npx i18n-rosetta sync
```

**Điều gì sẽ xảy ra:**
1. Tải `i18n-rosetta.config.json` (hoặc tự động phát hiện các cài đặt)
2. Quét tệp ngôn ngữ nguồn của bạn, làm phẳng (flatten) các key lồng nhau
3. So sánh với `.i18n-rosetta.lock` (mã băm SHA-256 của các giá trị đã dịch trước đó)
4. Kiểm tra `.rosetta/tm.json` để tìm các bản dịch đã lưu trong bộ nhớ cache (Translation Memory)
5. Chỉ dịch **các key đã thay đổi, bị thiếu hoặc đã cũ** thông qua phương pháp được cấu hình
6. Chạy cổng kiểm soát chất lượng (quality gate với 5 bước kiểm tra) trên mỗi bản dịch
7. Ghi các bản dịch đạt yêu cầu vào tệp ngôn ngữ đích
8. Cập nhật tệp lock và bộ nhớ cache TM

Trong một lần chạy lại thông thường sau khi thay đổi một key, bước 4 sẽ lấy 142 key từ bộ nhớ cache và bước 5 chỉ dịch 1 key. Đây là lý do tại sao các lần đồng bộ tiếp theo diễn ra nhanh chóng và tiết kiệm chi phí.

---

## Cấu hình

Tạo `i18n-rosetta.config.json` trong thư mục gốc dự án của bạn:

```json
{
  "inputLocale": "en",
  "pairs": {
    "en-fr": { "method": "llm-coached" },
    "en-ja": { "method": "google-translate" },
    "en-crk": { "method": "api", "endpoint": "http://localhost:3000/translate" }
  }
}
```

Các trường quan trọng:

| Trường | Mục đích | Mặc định |
|-------|---------|---------|
| `inputLocale` | Ngôn ngữ nguồn | `en` |
| `pairs` | Ánh xạ nguồn→đích kèm cấu hình phương pháp | (bắt buộc) |
| `localesDir` | Nơi lưu trữ các tệp ngôn ngữ | (tự động phát hiện) |
| `model` | Mô hình LLM cho các phương pháp `llm`/`llm-coached` | `google/gemini-2.5-flash` |
| `batchSize` | Số key trên mỗi lệnh gọi API | 80 (LLM), 128 (Google) |
| `jsonConcurrency` | Dịch song song các ngôn ngữ cho các key JSON | 200 |
| `contentConcurrency` | Các lệnh gọi API song song để dịch nội dung | 48 |

Tài liệu tham khảo đầy đủ: [Cấu hình](/docs/getting-started/configuration)

---

## Các phương pháp dịch

| Phương pháp | Khi nào nên dùng | Chi phí | API key cần thiết |
|--------|------------|------|---------------|
| **`llm`** | Đa mục đích, tốt cho các ngôn ngữ có nhiều tài nguyên | Theo token (tùy mô hình) | `OPENROUTER_API_KEY` |
| **`llm-coached`** | Khi bạn có các quy tắc ngữ pháp/từ điển cho ngôn ngữ đích | Theo token + ngữ cảnh huấn luyện (coaching) | `OPENROUTER_API_KEY` |
| **`google-translate`** | Các ngôn ngữ nhiều tài nguyên mà GT hoạt động tốt | $20/triệu ký tự | `GOOGLE_TRANSLATE_API_KEY` |
| **`api`** | Pipeline tùy chỉnh được lưu trữ phía sau một HTTP endpoint | Do máy chủ quyết định | Không (endpoint xử lý xác thực) |
| **`plugin`** | Phương pháp đóng gói sẵn được cài đặt cục bộ | Thay đổi | Thay đổi |

Chi tiết: [Các phương pháp dịch](/docs/guides/translation-methods)

---

## Dữ liệu huấn luyện (Coaching Data)

Đối với các cặp `llm-coached`, dữ liệu huấn luyện sẽ điều hướng LLM bằng các kiến thức ngôn ngữ rõ ràng. Hãy tạo một tệp huấn luyện:

```json title="coaching/fr.json"
{
  "grammar_rules": [
    "Use formal register (vous) for all UI text",
    "Adjectives agree in gender and number with the noun"
  ],
  "dictionary": {
    "dashboard": "tableau de bord",
    "settings": "paramètres"
  },
  "style_notes": "Prefer active voice. Avoid anglicisms."
}
```

Tham chiếu nó trong cấu hình cặp ngôn ngữ của bạn:

```json
"en-fr": { "method": "llm-coached", "coachingFile": "coaching/fr.json" }
```

Cổng kiểm soát chất lượng sẽ xác minh rằng các thuật ngữ trong từ điển thực sự xuất hiện ở đầu ra — các vi phạm sẽ được ghi lại dưới dạng cảnh báo `[TERM]`.

Chi tiết: [Dữ liệu huấn luyện](/docs/concepts/coaching-data)

---

## Cổng kiểm soát chất lượng (Quality Gate)

Mỗi bản dịch đều phải vượt qua năm bước kiểm tra tự động trước khi được ghi vào ổ đĩa:

| Kiểm tra | Lỗi phát hiện được | Ví dụ |
|-------|----------------|---------|
| **Trống/rỗng (Empty/blank)** | Mô hình không trả về gì | `""` |
| **Lặp lại nguồn (Source echo)** | Mô hình trả về đầu vào tiếng Anh không thay đổi | `"Welcome"` cho tiếng Nhật |
| **Vòng lặp ảo giác (Hallucination loop)** | Lặp lại các trigram | `"Qo' Qo' Qo' Qo'"` |
| **Độ dài tăng bất thường (Length inflation)** | Đầu ra dài gấp 4 lần trở lên so với nguồn | Nguồn 10 ký tự → Đầu ra 50 ký tự |
| **Tuân thủ hệ chữ viết (Script compliance)** | Sai hệ chữ viết cho ngôn ngữ | Văn bản Latinh cho ngôn ngữ tiếng Ả Rập |

Các lỗi thất bại được ghi lại với tiền tố `[GATE]`. Không có cơ chế dự phòng ngầm (silent fallback) — nếu một bản dịch thất bại, nó sẽ được báo cáo chứ không được âm thầm chấp nhận.

Chi tiết: [Cổng kiểm soát chất lượng](/docs/concepts/quality-gate)

---

## Bộ nhớ dịch thuật (Translation Memory)

Rosetta lưu trữ các bản dịch trong `.rosetta/tm.json`, được định danh bằng văn bản nguồn + ngôn ngữ + phương pháp. Trong các lần đồng bộ tiếp theo, các key không thay đổi sẽ được lấy từ bộ nhớ cache — không cần gọi API, không tốn chi phí.

```
[TM] 142 key(s) served from cache
Translating 3 key(s) to French (llm)... [OK]
```

Để bỏ qua bộ nhớ cache cho một lần chạy: `npx i18n-rosetta sync --no-tm`

Chi tiết: [Bộ nhớ dịch thuật](/docs/concepts/translation-memory)

---

## Các tệp được tạo

Rosetta tạo ra một số tệp trong dự án của bạn. Hãy nắm rõ chúng là gì để bạn không vô tình xóa hoặc commit nhầm:

| Tệp | Mục đích | Git? |
|------|---------|------|
| `.i18n-rosetta.lock` | Mã băm SHA-256 của các giá trị nguồn đã dịch (phát hiện thay đổi) | **Có** — hãy commit tệp này |
| `.i18n-rosetta-content.lock` | Tương tự, nhưng dành cho các tệp nội dung Markdown/MDX | **Có** — hãy commit tệp này |
| `.rosetta/tm.json` | Bộ nhớ cache của Translation Memory | **Có** — hãy commit tệp này (tiết kiệm chi phí API cho nhóm) |
| `.rosetta/coaching/` | Thư mục dữ liệu huấn luyện | **Có** — đây là kiến thức ngôn ngữ của bạn |
| `i18n-rosetta.config.json` | Cấu hình dự án | **Có** — hãy commit tệp này |

---

## Các mẫu sử dụng phổ biến

**Dịch một cặp ngôn ngữ:**
```bash
npx i18n-rosetta sync --pair en-fr
```

**Dịch tất cả các cặp đã cấu hình:**
```bash
npx i18n-rosetta sync
```
Rosetta dịch tất cả các ngôn ngữ song song. Với bộ nhớ cache TM, chỉ những key bị thay đổi mới gọi đến API.

**Chế độ nội dung (Markdown/MDX cho Docusaurus, Hugo, v.v.):**
```bash
npx i18n-rosetta sync --content
```
Dịch tài liệu, bài viết blog và các tệp nội dung song song với JSON ngôn ngữ. Sử dụng tính năng xử lý đồng thời (mặc định: 48 lệnh gọi API cùng lúc). Có thể tinh chỉnh bằng `--content-concurrency`.

**Chạy thử (xem trước mà không ghi):**
```bash
npx i18n-rosetta sync --dry-run
```

**Bắt buộc dịch lại các key cụ thể:**
```bash
npx i18n-rosetta sync --force-keys "hero.title,nav.about"
```

**Bắt buộc dịch lại tất cả các tệp nội dung:**
```bash
npx i18n-rosetta sync --force-content
```

**Kiểm tra trạng thái dịch thuật:**
```bash
npx i18n-rosetta status
```
Hiển thị mức độ bao phủ, các cấp độ chất lượng và thông tin plugin cho từng cặp ngôn ngữ.

**Kiểm tra các giá trị dự phòng (fallback) chưa được dịch:**
```bash
npx i18n-rosetta audit
```
Liệt kê tất cả các giá trị dự phòng `[EN]` cần được dịch.

---

## Khắc phục sự cố

| Vấn đề | Cách khắc phục |
|---------|-----|
| `OPENROUTER_API_KEY not set` | Export key hoặc thêm nó vào `.env` trong thư mục gốc dự án của bạn |
| `No locale files found` | Thiết lập `localesDir` trong cấu hình, hoặc đảm bảo các tệp ngôn ngữ của bạn khớp với cách đặt tên chuẩn (`en.json`, `fr.json`) |
| `[GATE] Script compliance failed` | Ngôn ngữ đích của bạn nhận được văn bản Latinh thay vì hệ chữ viết mong đợi — hãy thử một mô hình khác hoặc thêm dữ liệu huấn luyện |
| `[GATE] Source echo` | Mô hình trả về tiếng Anh không thay đổi — dữ liệu huấn luyện hoặc một mô hình khác thường sẽ khắc phục được lỗi này |
| Tất cả các bản dịch đều được lưu trong cache | Chạy với `--no-tm` để bỏ qua bộ nhớ cache, hoặc `--force-keys` cho các key cụ thể |
| Xung đột tệp lock | `.i18n-rosetta.lock` sử dụng mã băm SHA-256 — các xung đột khi merge có thể được giải quyết an toàn bằng cách giữ lại một trong hai phiên bản, sau đó chạy lại quá trình đồng bộ |

---

## Bước tiếp theo

- [Bắt đầu nhanh](/docs/getting-started/quick-start) — hướng dẫn chi tiết để bắt đầu
- [Tài liệu tham khảo CLI](/docs/reference/cli) — mọi câu lệnh và cờ (flag)
- [Cách thức hoạt động](/docs/how-it-works) — giải thích về quy trình đồng bộ
- [Cầu nối Eval Harness](/docs/guides/bridge) — cách rosetta kết nối với Arena
- **Bạn muốn xây dựng phương pháp dịch của riêng mình?** Hãy xem [Hướng dẫn dành cho Agent của Arena](https://mtevalarena.org/docs/getting-started/agent-guide) — xây dựng một phương pháp, chứng minh nó hoạt động hiệu quả và giành giải thưởng.