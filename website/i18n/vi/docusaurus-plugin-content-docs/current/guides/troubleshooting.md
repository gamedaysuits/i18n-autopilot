---
sidebar_position: 6
title: "Khắc phục sự cố"
---
# Khắc phục sự cố

Các vấn đề thường gặp và giải pháp cho i18n-rosetta.

## API & Xác thực

### "OPENROUTER_API_KEY not found"

Rosetta yêu cầu API key để dịch bằng LLM. Hãy thiết lập nó dưới dạng biến môi trường:

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
```

Hoặc trong tệp `.env` (nếu dự án của bạn tải các tệp `.env`):

```
OPENROUTER_API_KEY=sk-or-v1-...
```

:::tip
Nếu bạn chỉ có API key của Google Translate, rosetta sẽ tự động phát hiện và sử dụng Google Translate làm phương thức mặc định. Không cần thay đổi cấu hình.
:::

### "401 Unauthorized" từ OpenRouter

API key của bạn không hợp lệ hoặc đã hết hạn. Hãy xác minh nó tại [openrouter.ai/keys](https://openrouter.ai/keys).

### "429 Too Many Requests" / Giới hạn tỷ lệ (Rate Limiting)

Rosetta xử lý các giới hạn tỷ lệ nội bộ bằng phương pháp exponential backoff (thử lại với thời gian chờ tăng dần). Nếu bạn liên tục gặp phải giới hạn tỷ lệ:

1. **Giảm kích thước lô (batch size)** trong cấu hình của bạn:
   ```json
   { "batchSize": 15 }
   ```
2. **Sử dụng model có giới hạn tỷ lệ cao hơn** (ví dụ: `google/gemini-3.5-flash` có giới hạn rất rộng rãi)
3. **Sử dụng phương thức rẻ hơn/nhanh hơn** cho các cặp ngôn ngữ có khối lượng lớn — Google Translate không có giới hạn tỷ lệ:
   ```json
   { "pairs": { "en:it": { "method": "google-translate" } } }
   ```

### Không tìm thấy Model / Lỗi 404

Các nhà cung cấp LLM trực tiếp (`openai`, `anthropic`, `gemini`) sẽ xác thực chuỗi model của bạn trong lần sử dụng đầu tiên. Nếu bạn thấy cảnh báo:

**"looks like an OpenRouter path"** — Bạn đang sử dụng model định dạng OpenRouter (`google/gemini-3.5-flash`) với một nhà cung cấp trực tiếp. Các nhà cung cấp trực tiếp sử dụng tên model trần (bare model names):

```diff
- { "method": "gemini", "model": "google/gemini-3.5-flash" }
+ { "method": "gemini", "model": "gemini-2.5-flash" }
```

Hoặc chuyển sang phương thức `llm` để sử dụng OpenRouter:
```json
{ "method": "llm", "model": "google/gemini-3.5-flash" }
```

**"is an Anthropic/OpenAI/Gemini model"** — Bạn đang gửi model đến sai nhà cung cấp:

```diff
- { "method": "gemini", "model": "claude-sonnet-4-6" }
+ { "method": "anthropic", "model": "claude-sonnet-4-6" }
```

**"not found in available models"** — Model có thể đã bị ngừng hỗ trợ hoặc viết sai chính tả. Rosetta sẽ lấy danh sách model trực tiếp của nhà cung cấp và đề xuất các lựa chọn thay thế. Hãy kiểm tra tài liệu của nhà cung cấp để biết tên model hiện tại.

:::tip Việc ngừng hỗ trợ model thường xuyên xảy ra
Các nhà cung cấp thường xuyên loại bỏ các tên model cũ. Nếu quá trình dịch đột ngột thất bại sau một bản cập nhật của nhà cung cấp, hãy kiểm tra đầu ra `[WARN]` — nó sẽ hiển thị cho bạn các lựa chọn thay thế hiện tại.
:::

## Chất lượng bản dịch

### Bản dịch lặp lại ngôn ngữ nguồn

Cổng chất lượng (quality gate) sẽ bắt lỗi này. Nếu bản dịch giống hệt với nguồn tiếng Anh, nó sẽ bị từ chối và thử lại. Nếu tình trạng này vẫn tiếp diễn:

1. **Kiểm tra model** — Một số model hoạt động kém đối với các cặp ngôn ngữ cụ thể
2. **Thêm hướng dẫn về văn phong (register instructions)** — Cho model biết cần tạo ra ngôn ngữ nào:
   ```json
   {
     "languages": {
       "ja": { "name": "Japanese", "register": "Polite/formal Japanese" }
     }
   }
   ```
3. **Thử một model khác** — Chuyển từ `gpt-4o-mini` sang `gpt-4o` hoặc `google/gemini-2.5-pro`

### Đầu ra sai hệ chữ viết (ví dụ: văn bản Latinh cho tiếng Nhật)

Kiểm tra tuân thủ hệ chữ viết của cổng chất lượng sẽ bắt được hầu hết các trường hợp. Nếu tình trạng này vẫn tiếp diễn:

- Xác minh mã ngôn ngữ (locale code) đã chính xác (`ja`, không phải `jp`)
- Thêm hướng dẫn rõ ràng về hệ chữ viết trong trường `register`:
  ```json
  { "register": "Japanese using hiragana, katakana, and kanji" }
  ```

### Các mẫu ảo giác (hallucination) trong đầu ra

Các mẫu lặp lại 3 từ (ví dụ: "hello hello hello") sẽ bị bộ phát hiện vòng lặp ảo giác bắt giữ. Nếu đầu ra bị cắt xén nhưng vẫn vượt qua được bộ phát hiện:

1. **Giảm kích thước lô** — Các lô nhỏ hơn sẽ tạo ra đầu ra tập trung hơn
2. **Sử dụng model mạnh hơn** — Các model lớn hơn ít bị ảo giác hơn trên các hệ chữ viết phi Latinh
3. **Thêm dữ liệu huấn luyện (coaching data)** — Các thuật ngữ từ điển sẽ làm mỏ neo cho bản dịch

## Vấn đề về Tệp & Định dạng

### "No locale files found"

Rosetta tự động phát hiện các tệp ngôn ngữ (locale files). Nếu nó không thể tìm thấy chúng:

1. **Kiểm tra `localesDir`** — Phải trỏ đến thư mục chứa các tệp ngôn ngữ:
   ```json
   { "localesDir": "./locales" }
   ```
2. **Kiểm tra cách đặt tên tệp** — Các tệp phải được đặt tên theo mã ngôn ngữ: `en.json`, `fr.json`, v.v.
3. **Kiểm tra định dạng** — Các định dạng được hỗ trợ: JSON, nested JSON, YAML, TOML

### Xung đột tệp khóa (Lock file)

Nếu `.i18n-rosetta.lock` rơi vào trạng thái lỗi:

```bash
# Reset the lock file (next sync will retranslate everything)
rm .i18n-rosetta.lock
npx i18n-rosetta sync
```

:::warning
Việc xóa tệp khóa đồng nghĩa với việc lần đồng bộ tiếp theo sẽ dịch lại tất cả các key, không chỉ những key đã thay đổi. Điều này sẽ ảnh hưởng đến chi phí API đối với các dự án lớn.
:::

### Dịch lại các key cụ thể

Nếu các bản dịch riêng lẻ bị sai và bạn muốn buộc chúng phải được dịch lại mà không cần xóa tệp khóa:

```bash
# Re-translate a single key
npx i18n-rosetta sync --force-keys "hero.title"

# Re-translate multiple keys
npx i18n-rosetta sync --force-keys "nav.home,nav.about,footer.copyright"
```

Cờ `--force-keys` sẽ ghi đè kiểm tra mã băm (hash) của tệp khóa đối với các key cụ thể đó, buộc dịch lại mà không ảnh hưởng đến bất kỳ key nào khác.

### Dịch nội dung làm hỏng các khối mã (code blocks)

Điều này không nên xảy ra — các khối mã đã được bảo vệ trước khi dịch. Nếu nó xảy ra:

1. Xác minh khối mã sử dụng rào chắn tiêu chuẩn (ba dấu ngoặc kép ngược - triple backticks)
2. Kiểm tra các khối mã chưa được đóng trong Markdown nguồn
3. Báo cáo sự cố (File an issue) — đây là một lỗi trong hệ thống bảo vệ sentinel

## Vấn đề về CLI

### `--watch` không phát hiện thay đổi

Tính năng theo dõi tệp sử dụng `fs.watch` gốc của Node.js. Các vấn đề đã biết:

- **Ổ đĩa mạng** — `fs.watch` không hoạt động ổn định trên các ổ đĩa gắn kết NFS/SMB
- **Docker volumes** — Sử dụng chế độ thăm dò (polling mode) hoặc chạy rosetta bên trong container
- **Thư mục lớn** — Trình theo dõi giám sát `localesDir` một cách đệ quy; các cây thư mục quá sâu có thể vượt quá giới hạn của hệ điều hành

### `npx` chạy phiên bản cũ

```bash
# Clear the npx cache
npx --yes i18n-rosetta@latest sync
```

Hoặc cài đặt toàn cục (globally):

```bash
npm install -g i18n-rosetta
i18n-rosetta sync
```

## Hiệu suất

### Đồng bộ chậm khi có nhiều ngôn ngữ

Theo mặc định, Rosetta dịch các cặp ngôn ngữ một cách tuần tự. Để tăng tốc độ đồng bộ đa ngôn ngữ:

1. **Sử dụng Google Translate cho các cặp ngôn ngữ có khối lượng lớn** — Nó nhanh hơn 10–50 lần so với dịch bằng LLM
2. **Tăng kích thước lô** (tối đa 50, mặc định là 30):
   ```json
   { "batchSize": 50 }
   ```
3. **Sử dụng model nhanh** — `gpt-4o-mini` nhanh hơn đáng kể so với `gpt-4o`

### Chi phí API cao

- **Kiểm tra kích thước lô** — Lô lớn hơn = ít lệnh gọi API hơn = chi phí thấp hơn
- **Sử dụng bộ nhớ đệm prompt (prompt caching)** — Rosetta chia nhỏ các tin nhắn của hệ thống/người dùng để tăng tỷ lệ trúng bộ nhớ đệm (cache hits) trên các model của Anthropic và Google
- **Sử dụng Google Translate cho các ngôn ngữ Cấp 2 (Tier 2)** — Xem cẩm nang [Dịch 30 ngôn ngữ](/docs/tutorials/translate-30-languages)

## Vẫn gặp khó khăn?

- **[GitHub Issues](https://github.com/gamedaysuits/i18n-rosetta/issues)** — Tìm kiếm các vấn đề hiện có hoặc báo cáo một vấn đề mới
- **[Tài liệu Kiến trúc](/docs/concepts/architecture)** — Hiểu về thiết kế hệ thống
- **[Cổng chất lượng](/docs/concepts/quality-gate)** — Cách thức hoạt động của quá trình xác thực bên dưới hệ thống