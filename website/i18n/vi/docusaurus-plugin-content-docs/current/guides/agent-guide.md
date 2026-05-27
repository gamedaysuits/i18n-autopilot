---
sidebar_position: 9
title: "Hướng dẫn dành cho Agent: Sử dụng i18n-rosetta"
description: "Cách các AI agent có thể cài đặt, cấu hình và chạy i18n-rosetta để dịch các locale file."
---
# Hướng dẫn dành cho Agent: Sử dụng i18n-rosetta

i18n-rosetta là một công cụ CLI giúp dịch các tệp ngôn ngữ (locale files) của ứng dụng chỉ với một câu lệnh. Hướng dẫn này dành cho các AI agent (hoặc lập trình viên làm việc cùng AI agent) muốn nhanh chóng đi từ con số không đến khi có được các tệp ngôn ngữ đã được dịch hoàn chỉnh.

:::tip Đã quen thuộc với công cụ này?
Nếu bạn chỉ cần xem các câu lệnh, hãy chuyển tới [Tài liệu tham khảo CLI](/docs/reference/cli). Nếu bạn muốn xây dựng và đánh giá hiệu suất (benchmark) một phương pháp dịch thuật, hãy xem [Hướng dẫn dành cho Agent trên Arena](https://mtevalarena.org/docs/getting-started/agent-guide).
:::

---

## Thiết lập môi trường

```bash
# No global install needed — npx runs it directly
npx i18n-rosetta sync
```

**Yêu cầu:**
- Node.js 18+
- Một API key từ nhà cung cấp dịch vụ dịch thuật của bạn

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

## Lần đồng bộ đầu tiên

Rosetta tự động phát hiện các tệp ngôn ngữ của bạn, định dạng của chúng (JSON, TOML, YAML, PO) và các ngôn ngữ đích:

```bash
npx i18n-rosetta sync
```

**Điều gì sẽ xảy ra:**
1. Tải `i18n-rosetta.config.json` (hoặc tự động phát hiện các cài đặt)
2. Quét tệp ngôn ngữ nguồn của bạn, làm phẳng (flatten) các key lồng nhau
3. So sánh với `.i18n-rosetta.lock` (mã băm SHA-256 của các giá trị đã dịch trước đó)
4. Kiểm tra `.rosetta/tm.json` để tìm các bản dịch đã lưu cache (Translation Memory)
5. Chỉ dịch các **key bị thay đổi, bị thiếu hoặc đã cũ** thông qua phương pháp được cấu hình
6. Chạy cổng kiểm tra chất lượng (quality gate với 5 bước kiểm tra) trên mỗi bản dịch
7. Ghi các bản dịch đạt yêu cầu vào tệp ngôn ngữ đích
8. Cập nhật lock file và bộ nhớ cache TM

Trong một lần chạy lại thông thường sau khi thay đổi một key, bước 4 sẽ lấy 142 key từ cache và bước 5 chỉ dịch 1 key. Đây là lý do tại sao các lần đồng bộ tiếp theo diễn ra nhanh chóng và tiết kiệm chi phí.

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
| `batchSize` | Số lượng key mỗi lần gọi API | 30 (LLM), 128 (Google) |
| `concurrency` | Số lượng lệnh gọi API song song để dịch nội dung | 12 |

Tài liệu tham khảo đầy đủ: [Cấu hình](/docs/getting-started/configuration)

---

## Các phương pháp dịch thuật

| Phương pháp | Khi nào nên dùng | Chi phí | API key cần thiết |
|--------|------------|------|---------------|
| **`llm`** | Đa mục đích, tốt cho các ngôn ngữ có nguồn tài nguyên phong phú | Theo token (tùy thuộc mô hình) | `OPENROUTER_API_KEY` |
| **`llm-coached`** | Khi bạn có các quy tắc ngữ pháp/từ điển cho ngôn ngữ đích | Theo token + ngữ cảnh coaching | `OPENROUTER_API_KEY` |
| **`google-translate`** | Các ngôn ngữ có tài nguyên phong phú mà GT hoạt động tốt | $20/triệu ký tự | `GOOGLE_TRANSLATE_API_KEY` |
| **`api`** | Pipeline tùy chỉnh được lưu trữ phía sau một HTTP endpoint | Do máy chủ quyết định | Không có (endpoint xử lý xác thực) |
| **`plugin`** | Phương pháp đóng gói sẵn được cài đặt cục bộ | Thay đổi | Thay đổi |

Chi tiết: [Các phương pháp dịch thuật](/docs/guides/translation-methods)

---

## Dữ liệu Coaching

Đối với các cặp `llm-coached`, dữ liệu coaching sẽ định hướng cho LLM bằng các kiến thức ngôn ngữ rõ ràng. Tạo một tệp coaching:

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

Cổng kiểm tra chất lượng (quality gate) sẽ xác minh xem các thuật ngữ trong từ điển có thực sự xuất hiện trong kết quả đầu ra hay không — các vi phạm sẽ được ghi lại dưới dạng cảnh báo `[TERM]`.

Chi tiết: [Dữ liệu Coaching](/docs/concepts/coaching-data)

---

## Cổng kiểm tra chất lượng (Quality Gate)

Mỗi bản dịch đều phải vượt qua năm bước kiểm tra tự động trước khi được ghi vào ổ đĩa:

| Kiểm tra | Lỗi phát hiện | Ví dụ |
|-------|----------------|---------|
| **Trống/rỗng (Empty/blank)** | Mô hình không trả về gì cả | `""` |
| **Lặp lại nguồn (Source echo)** | Mô hình trả về nguyên văn đầu vào tiếng Anh | `"Welcome"` cho tiếng Nhật |
| **Vòng lặp ảo giác (Hallucination loop)** | Lặp lại các trigram | `"Qo' Qo' Qo' Qo'"` |
| **Độ dài tăng bất thường (Length inflation)** | Đầu ra dài gấp 4 lần trở lên so với nguồn | Nguồn 10 ký tự → Đầu ra 50 ký tự |
| **Tuân thủ hệ thống chữ viết (Script compliance)** | Sai hệ thống chữ viết cho ngôn ngữ đó | Văn bản chữ Latinh cho ngôn ngữ tiếng Ả Rập |

Các lỗi thất bại được ghi lại với tiền tố `[GATE]`. Không có cơ chế dự phòng ngầm (silent fallbacks) — nếu một bản dịch thất bại, nó sẽ được báo cáo chứ không tự động được chấp nhận.

Chi tiết: [Cổng kiểm tra chất lượng](/docs/concepts/quality-gate)

---

## Bộ nhớ dịch thuật (Translation Memory)

Rosetta lưu cache các bản dịch trong `.rosetta/tm.json`, được định danh bằng văn bản nguồn + ngôn ngữ + phương pháp. Trong các lần đồng bộ tiếp theo, các key không thay đổi sẽ được lấy từ cache — không cần gọi API, không tốn phí.

```
[TM] 142 key(s) served from cache
Translating 3 key(s) to French (llm)... [OK]
```

Để bỏ qua cache cho một lần chạy: `npx i18n-rosetta sync --no-tm`

Chi tiết: [Bộ nhớ dịch thuật](/docs/concepts/translation-memory)

---

## Các tệp được tạo ra

Rosetta tạo ra một số tệp trong dự án của bạn. Hãy nắm rõ chúng là gì để bạn không vô tình xóa hoặc commit nhầm:

| Tệp | Mục đích | Git? |
|------|---------|------|
| `.i18n-rosetta.lock` | Mã băm SHA-256 của các giá trị nguồn đã dịch (phát hiện thay đổi) | **Có** — hãy commit tệp này |
| `.i18n-rosetta-content.lock` | Tương tự, nhưng dành cho các tệp nội dung Markdown/MDX | **Có** — hãy commit tệp này |
| `.rosetta/tm.json` | Bộ nhớ cache Translation Memory | **Có** — hãy commit tệp này (giúp tiết kiệm chi phí API cho nhóm) |
| `.rosetta/coaching/` | Thư mục dữ liệu coaching | **Có** — đây là kiến thức ngôn ngữ của bạn |
| `i18n-rosetta.config.json` | Cấu hình dự án | **Có** — hãy commit tệp này |

---

## Các mẫu sử dụng phổ biến

**Dịch một cặp ngôn ngữ:**
```bash
npx i18n-rosetta sync --pair en-fr
```

**Dịch tất cả các cặp ngôn ngữ đã cấu hình:**
```bash
npx i18n-rosetta sync
```
Rosetta xử lý các cặp ngôn ngữ một cách tuần tự. Với bộ nhớ cache TM, chỉ những key bị thay đổi mới gọi đến API.

**Chế độ nội dung (Markdown/MDX cho Docusaurus, Hugo, v.v.):**
```bash
npx i18n-rosetta sync --content
```
Dịch các tài liệu, bài đăng blog và tệp nội dung song song với các tệp JSON ngôn ngữ. Sử dụng cơ chế đồng thời song song (mặc định: 12 lệnh gọi API cùng lúc).

**Chạy thử (xem trước mà không ghi tệp):**
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

**Kiểm tra các fallback chưa được dịch:**
```bash
npx i18n-rosetta audit
```
Liệt kê tất cả các giá trị fallback `[EN]` cần được dịch.

---

## Khắc phục sự cố

| Vấn đề | Cách khắc phục |
|---------|-----|
| `OPENROUTER_API_KEY not set` | Export key đó hoặc thêm nó vào `.env` ở thư mục gốc dự án của bạn |
| `No locale files found` | Thiết lập `localesDir` trong cấu hình, hoặc đảm bảo các tệp ngôn ngữ của bạn tuân theo chuẩn đặt tên (`en.json`, `fr.json`) |
| `[GATE] Script compliance failed` | Ngôn ngữ đích của bạn nhận được văn bản chữ Latinh thay vì hệ thống chữ viết mong đợi — hãy thử một mô hình khác hoặc thêm dữ liệu coaching |
| `[GATE] Source echo` | Mô hình trả về tiếng Anh không thay đổi — dữ liệu coaching hoặc một mô hình khác thường sẽ khắc phục được lỗi này |
| Tất cả các bản dịch đều được lưu cache | Chạy với `--no-tm` để bỏ qua cache, hoặc `--force-keys` cho các key cụ thể |
| Xung đột lock file | `.i18n-rosetta.lock` sử dụng mã băm SHA-256 — các xung đột khi merge có thể được giải quyết an toàn bằng cách giữ lại một trong hai phiên bản, sau đó chạy lại lệnh đồng bộ |

---

## Bước tiếp theo

- [Bắt đầu nhanh](/docs/getting-started/quick-start) — hướng dẫn chi tiết từng bước để bắt đầu
- [Tài liệu tham khảo CLI](/docs/reference/cli) — mọi câu lệnh và flag
- [Cách thức hoạt động](/docs/how-it-works) — giải thích về quy trình đồng bộ
- [Cầu nối Eval Harness](/docs/guides/bridge) — cách rosetta kết nối với Arena
- **Bạn muốn xây dựng phương pháp dịch thuật của riêng mình?** Hãy xem [Hướng dẫn dành cho Agent trên Arena](https://mtevalarena.org/docs/getting-started/agent-guide) — xây dựng một phương pháp, chứng minh nó hiệu quả và giành giải thưởng.