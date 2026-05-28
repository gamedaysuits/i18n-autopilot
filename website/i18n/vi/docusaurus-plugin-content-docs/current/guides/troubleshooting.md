---
sidebar_position: 6
title: "Khắc phục sự cố"
---
# Khắc phục sự cố

Các vấn đề thường gặp và giải pháp cho i18n-rosetta.

## API & Xác thực

### "OPENROUTER_API_KEY not found"

Rosetta yêu cầu một khóa API để dịch bằng LLM. Hãy thiết lập nó dưới dạng biến môi trường:

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
```

Hoặc trong tệp `.env` (nếu dự án của bạn tải các tệp `.env`):

```
OPENROUTER_API_KEY=sk-or-v1-...
```

:::tip
Nếu bạn chỉ có khóa API của Google Translate, rosetta sẽ tự động phát hiện và sử dụng Google Translate làm phương thức mặc định. Không cần thay đổi cấu hình.
:::

### Lỗi "401 Unauthorized" từ OpenRouter

Khóa API của bạn không hợp lệ hoặc đã hết hạn. Hãy xác minh nó tại [openrouter.ai/keys](https://openrouter.ai/keys).

### "429 Too Many Requests" / Giới hạn tỷ lệ (Rate Limiting)

Rosetta xử lý các giới hạn tỷ lệ nội bộ bằng phương pháp exponential backoff (lùi bước theo cấp số nhân). Nếu bạn liên tục gặp phải giới hạn tỷ lệ:

1. **Giảm kích thước lô (batch size)** trong cấu hình của bạn:
   ```json
   { "batchSize": 15 }
   ```
2. **Sử dụng mô hình có giới hạn tỷ lệ cao hơn** (ví dụ: `google/gemini-3.5-flash` có giới hạn rất rộng rãi)
3. **Sử dụng phương thức rẻ hơn/nhanh hơn** cho các cặp ngôn ngữ có khối lượng lớn — Google Translate không có giới hạn tỷ lệ:
   ```json
   { "pairs": { "en:it": { "method": "google-translate" } } }
   ```

### Không tìm thấy mô hình / Lỗi 404

Các nhà cung cấp LLM trực tiếp (`openai`, `anthropic`, `gemini`) sẽ xác thực chuỗi mô hình của bạn trong lần sử dụng đầu tiên. Nếu bạn thấy cảnh báo:

**"looks like an OpenRouter path"** — Bạn đang sử dụng mô hình định dạng OpenRouter (`google/gemini-3.5-flash`) với một nhà cung cấp trực tiếp. Các nhà cung cấp trực tiếp sử dụng tên mô hình trần (bare model names):

```diff
- { "method": "gemini", "model": "google/gemini-3.5-flash" }
+ { "method": "gemini", "model": "gemini-2.5-flash" }
```

Hoặc chuyển sang phương thức `llm` để sử dụng OpenRouter:
```json
{ "method": "llm", "model": "google/gemini-3.5-flash" }
```

**"is an Anthropic/OpenAI/Gemini model"** — Bạn đang gửi mô hình đến sai nhà cung cấp:

```diff
- { "method": "gemini", "model": "claude-sonnet-4-6" }
+ { "method": "anthropic", "model": "claude-sonnet-4-6" }
```

**"not found in available models"** — Mô hình có thể đã bị ngừng hỗ trợ hoặc viết sai chính tả. Rosetta sẽ lấy danh sách mô hình trực tiếp của nhà cung cấp và đề xuất các lựa chọn thay thế. Hãy kiểm tra tài liệu của nhà cung cấp để biết tên mô hình hiện tại.

:::tip Việc ngừng hỗ trợ mô hình thường xuyên xảy ra
Các nhà cung cấp thường xuyên ngừng sử dụng các tên mô hình cũ. Nếu quá trình dịch đột ngột thất bại sau bản cập nhật của nhà cung cấp, hãy kiểm tra đầu ra của `[WARN]` — nó sẽ hiển thị cho bạn các lựa chọn thay thế hiện tại.
:::

## Chất lượng bản dịch

### Bản dịch lặp lại ngôn ngữ nguồn

Quality gate (cổng kiểm tra chất lượng) sẽ bắt lỗi này. Nếu bản dịch giống hệt với nguồn tiếng Anh, nó sẽ bị từ chối và thử lại. Nếu tình trạng này vẫn tiếp diễn:

1. **Kiểm tra mô hình** — Một số mô hình hoạt động kém đối với các cặp ngôn ngữ cụ thể
2. **Thêm hướng dẫn về văn phong (register)** — Cho mô hình biết ngôn ngữ cần tạo ra:
   ```json
   {
     "languages": {
       "ja": { "name": "Japanese", "register": "Polite/formal Japanese" }
     }
   }
   ```
3. **Thử một mô hình khác** — Chuyển từ `gpt-4o-mini` sang `gpt-4o` hoặc `google/gemini-2.5-pro`

### Đầu ra sai hệ chữ viết (ví dụ: văn bản Latinh cho tiếng Nhật)

Kiểm tra tuân thủ hệ chữ viết của quality gate sẽ bắt được hầu hết các trường hợp. Nếu tình trạng này vẫn tiếp diễn:

- Xác minh mã ngôn ngữ (locale code) đã chính xác (`ja`, không phải `jp`)
- Thêm hướng dẫn hệ chữ viết rõ ràng trong trường `register`:
  ```json
  { "register": "Japanese using hiragana, katakana, and kanji" }
  ```

### Các mẫu ảo giác (hallucination) trong đầu ra

Các mẫu trigram lặp lại (ví dụ: "hello hello hello") sẽ bị bắt bởi bộ phát hiện vòng lặp ảo giác. Nếu đầu ra bị cắt xén nhưng vẫn vượt qua được bộ phát hiện:

1. **Giảm kích thước lô** — Các lô nhỏ hơn sẽ tạo ra đầu ra tập trung hơn
2. **Sử dụng mô hình mạnh hơn** — Các mô hình lớn hơn ít bị ảo giác hơn đối với các hệ chữ viết phi Latinh
3. **Thêm dữ liệu huấn luyện (coaching data)** — Các thuật ngữ từ điển sẽ làm mỏ neo cho bản dịch

## Vấn đề về tệp & định dạng

### "No locale files found" (Không tìm thấy tệp ngôn ngữ)

Rosetta tự động phát hiện các tệp ngôn ngữ. Nếu nó không thể tìm thấy chúng:

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
Việc xóa tệp khóa đồng nghĩa với việc lần đồng bộ tiếp theo sẽ dịch lại tất cả các khóa, không chỉ những khóa đã thay đổi. Điều này sẽ ảnh hưởng đến chi phí API đối với các dự án lớn.
:::

### Dịch lại các khóa cụ thể

Nếu các bản dịch riêng lẻ bị sai và bạn muốn buộc chúng phải được dịch lại mà không xóa tệp khóa:

```bash
# Re-translate a single key
npx i18n-rosetta sync --force-keys "hero.title"

# Re-translate multiple keys
npx i18n-rosetta sync --force-keys "nav.home,nav.about,footer.copyright"
```

Cờ `--force-keys` sẽ ghi đè kiểm tra mã băm (hash) của tệp khóa đối với các khóa cụ thể đó, buộc dịch lại mà không ảnh hưởng đến bất kỳ khóa nào khác.

### Dịch nội dung làm hỏng các khối mã (code blocks)

Điều này không nên xảy ra — các khối mã đã được bảo vệ trước khi dịch. Nếu nó xảy ra:

1. Xác minh khối mã sử dụng rào chắn tiêu chuẩn (ba dấu ngoặc kép ngược - triple backticks)
2. Kiểm tra các khối mã chưa đóng trong Markdown nguồn
3. Báo cáo sự cố (File an issue) — đây là một lỗi trong hệ thống bảo vệ sentinel

## Vấn đề về CLI

### `--watch` không phát hiện các thay đổi

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

### Đồng bộ hóa chậm đối với nhiều ngôn ngữ

Rosetta mặc định dịch tất cả các ngôn ngữ song song. Nếu quá trình đồng bộ hóa vẫn chậm:

1. **Sử dụng Google Translate cho các cặp ngôn ngữ có khối lượng lớn** — Nó nhanh hơn 10–50 lần so với dịch bằng LLM
2. **Tăng kích thước lô** (mặc định là 80):
   ```json
   { "batchSize": 120 }
   ```
3. **Điều chỉnh tính đồng thời (concurrency)** — Tính song song của ngôn ngữ JSON mặc định là 200 và nội dung là 48. Nếu nhà cung cấp API của bạn hỗ trợ giới hạn tỷ lệ cao hơn:
   ```bash
   npx i18n-rosetta sync --json-concurrency 80 --content-concurrency 20
   ```
4. **Sử dụng mô hình nhanh** — `gpt-4o-mini` nhanh hơn đáng kể so với `gpt-4o`

### Chi phí API cao

- **Kiểm tra kích thước lô** — Lô lớn hơn = ít lệnh gọi API hơn = chi phí thấp hơn
- **Sử dụng Bộ nhớ Dịch thuật (Translation Memory - TM)** — TM được bật theo mặc định. Chạy `i18n-rosetta tm stats` để xác minh nó đang hoạt động. Nếu bạn thấy 0 mục nhập sau nhiều lần đồng bộ hóa, có thể có vấn đề với quyền truy cập thư mục `.rosetta/` của bạn
- **Sử dụng bộ nhớ đệm prompt (prompt caching)** — Rosetta chia tách các tin nhắn hệ thống/người dùng để tăng tỷ lệ trúng bộ nhớ đệm (cache hits) trên các mô hình của Anthropic và Google
- **Sử dụng Google Translate cho các ngôn ngữ Cấp 2 (Tier 2)** — Xem hướng dẫn [Dịch 30 ngôn ngữ](/docs/tutorials/translate-30-languages)

### Bản dịch cũ (stale) sau khi chuyển đổi nhà cung cấp

Nếu bạn chuyển từ phương thức dịch này sang phương thức dịch khác (ví dụ: `llm` sang `deepl`), bộ nhớ đệm TM có thể vẫn cung cấp các bản dịch cũ từ phương thức trước đó cho các khóa có văn bản nguồn chưa thay đổi. Khóa bộ nhớ đệm bao gồm tên phương thức, vì vậy hầu hết các trường hợp đều được xử lý tự động. Nhưng nếu bạn đã thay đổi `model` trong cùng một phương thức:

```bash
# Force fresh translations for all keys
i18n-rosetta sync --no-tm

# Or clear the cache entirely and re-sync
i18n-rosetta tm clear --yes
i18n-rosetta sync
```

Xem [Bộ nhớ Dịch thuật](/docs/concepts/translation-memory) để biết chi tiết về thiết kế khóa bộ nhớ đệm.

## Vẫn gặp khó khăn?

- **[GitHub Issues](https://github.com/gamedaysuits/i18n-rosetta/issues)** — Tìm kiếm các sự cố hiện có hoặc báo cáo một sự cố mới
- **[Tài liệu Kiến trúc](/docs/concepts/architecture)** — Hiểu về thiết kế hệ thống
- **[Quality Gate](/docs/concepts/quality-gate)** — Cách thức hoạt động của quá trình xác thực ở hậu trường