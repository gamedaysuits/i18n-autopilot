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

Rosetta xử lý giới hạn tỷ lệ nội bộ bằng kỹ thuật exponential backoff (lùi bước theo cấp số nhân). Nếu bạn liên tục chạm ngưỡng giới hạn tỷ lệ:

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

**"looks like an OpenRouter path"** — Bạn đang sử dụng model theo định dạng của OpenRouter (`google/gemini-3.5-flash`) với một nhà cung cấp trực tiếp. Các nhà cung cấp trực tiếp chỉ sử dụng tên model gốc:

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

**"not found in available models"** — Model này có thể đã bị ngừng hỗ trợ hoặc viết sai chính tả. Rosetta sẽ lấy danh sách model trực tiếp từ nhà cung cấp và đề xuất các lựa chọn thay thế. Hãy kiểm tra tài liệu của nhà cung cấp để biết tên model hiện tại.

:::tip Việc ngừng hỗ trợ model thường xuyên xảy ra
Các nhà cung cấp thường xuyên loại bỏ các tên model cũ. Nếu quá trình dịch đột ngột thất bại sau một bản cập nhật của nhà cung cấp, hãy kiểm tra đầu ra `[WARN]` — nó sẽ hiển thị cho bạn các lựa chọn thay thế hiện tại.
:::

## Chất lượng bản dịch

### Bản dịch lặp lại ngôn ngữ nguồn

Cổng kiểm soát chất lượng (quality gate) sẽ bắt lỗi này. Nếu bản dịch giống hệt với bản gốc tiếng Anh, nó sẽ bị từ chối và thử lại. Nếu tình trạng này vẫn tiếp diễn:

1. **Kiểm tra model** — Một số model hoạt động kém với các cặp ngôn ngữ cụ thể
2. **Thêm hướng dẫn về văn phong (register)** — Cho model biết cần tạo ra ngôn ngữ nào:
   ```json
   {
     "languages": {
       "ja": { "name": "Japanese", "register": "Polite/formal Japanese" }
     }
   }
   ```
3. **Thử một model khác** — Chuyển từ `gpt-4o-mini` sang `gpt-4o` hoặc `google/gemini-2.5-pro`

### Đầu ra sai hệ chữ viết (ví dụ: văn bản Latinh cho tiếng Nhật)

Tính năng kiểm tra tuân thủ hệ chữ viết của cổng kiểm soát chất lượng sẽ bắt được hầu hết các trường hợp. Nếu tình trạng này vẫn tiếp diễn:

- Xác minh mã ngôn ngữ (locale code) đã chính xác (`ja`, không phải `jp`)
- Thêm hướng dẫn rõ ràng về hệ chữ viết trong trường `register`:
  ```json
  { "register": "Japanese using hiragana, katakana, and kanji" }
  ```

### Các mẫu ảo giác (hallucination) trong đầu ra

Các mẫu trigram lặp lại (ví dụ: "hello hello hello") sẽ bị phát hiện bởi bộ dò vòng lặp ảo giác. Nếu đầu ra bị cắt xén nhưng vẫn vượt qua được bộ dò:

1. **Giảm kích thước lô** — Các lô nhỏ hơn sẽ tạo ra đầu ra tập trung hơn
2. **Sử dụng model mạnh hơn** — Các model lớn hơn ít bị ảo giác hơn đối với các hệ chữ viết phi Latinh
3. **Thêm dữ liệu huấn luyện (coaching data)** — Các thuật ngữ từ điển sẽ làm điểm tựa cho bản dịch

## Các vấn đề về Tệp & Định dạng

### "No locale files found"

Rosetta tự động phát hiện các tệp ngôn ngữ. Nếu nó không thể tìm thấy chúng:

1. **Kiểm tra `localesDir`** — Phải trỏ đến thư mục chứa các tệp ngôn ngữ:
   ```json
   { "localesDir": "./locales" }
   ```
2. **Kiểm tra cách đặt tên tệp** — Các tệp phải được đặt tên theo mã ngôn ngữ: `en.json`, `fr.json`, v.v.
3. **Kiểm tra định dạng** — Các định dạng được hỗ trợ: JSON, nested JSON, YAML, TOML

### Xung đột tệp lock

Nếu `.i18n-rosetta.lock` rơi vào trạng thái lỗi:

```bash
# Reset the lock file (next sync will retranslate everything)
rm .i18n-rosetta.lock
npx i18n-rosetta sync
```

:::warning
Việc xóa tệp lock đồng nghĩa với việc lần đồng bộ tiếp theo sẽ dịch lại tất cả các key, không chỉ những key đã thay đổi. Điều này sẽ ảnh hưởng đến chi phí API đối với các dự án lớn.
:::

### Dịch lại các key cụ thể

Nếu các bản dịch riêng lẻ bị sai và bạn muốn buộc chúng phải được dịch lại mà không cần xóa tệp lock:

```bash
# Re-translate a single key
npx i18n-rosetta sync --force-keys "hero.title"

# Re-translate multiple keys
npx i18n-rosetta sync --force-keys "nav.home,nav.about,footer.copyright"
```

Cờ `--force-keys` sẽ ghi đè việc kiểm tra mã băm của tệp lock đối với các key cụ thể đó, buộc dịch lại mà không ảnh hưởng đến bất kỳ key nào khác.

### Dịch nội dung làm hỏng các khối mã (code blocks)

Điều này không nên xảy ra — các khối mã đã được bảo vệ trước khi dịch. Nếu nó xảy ra:

1. Xác minh khối mã sử dụng rào chắn tiêu chuẩn (ba dấu ngoặc ngược)
2. Kiểm tra xem có khối mã nào chưa được đóng trong Markdown nguồn hay không
3. Mở một issue — đây là lỗi trong hệ thống bảo vệ sentinel

## Các vấn đề về CLI

### `--watch` không phát hiện thay đổi

Tính năng theo dõi tệp sử dụng `fs.watch` gốc của Node.js. Các vấn đề đã biết:

- **Ổ đĩa mạng** — `fs.watch` không hoạt động ổn định trên các ổ đĩa NFS/SMB
- **Docker volumes** — Sử dụng chế độ polling hoặc chạy rosetta bên trong container
- **Thư mục lớn** — Trình theo dõi giám sát `localesDir` một cách đệ quy; các cây thư mục quá sâu có thể vượt quá giới hạn của hệ điều hành

### `npx` chạy phiên bản cũ

```bash
# Clear the npx cache
npx --yes i18n-rosetta@latest sync
```

Hoặc cài đặt global:

```bash
npm install -g i18n-rosetta
i18n-rosetta sync
```

## Hiệu suất

### Đồng bộ chậm đối với nhiều ngôn ngữ

Rosetta dịch các cặp ngôn ngữ theo tuần tự theo mặc định. Để tăng tốc độ đồng bộ đa ngôn ngữ:

1. **Sử dụng Google Translate cho các cặp ngôn ngữ có khối lượng lớn** — Nó nhanh hơn 10–50 lần so với dịch bằng LLM
2. **Tăng kích thước lô** (tối đa 50, mặc định là 30):
   ```json
   { "batchSize": 50 }
   ```
3. **Sử dụng model nhanh** — `gpt-4o-mini` nhanh hơn đáng kể so với `gpt-4o`

### Chi phí API cao

- **Kiểm tra kích thước lô** — Lô lớn hơn = ít lệnh gọi API hơn = chi phí thấp hơn
- **Sử dụng Translation Memory (Bộ nhớ dịch)** — TM được bật theo mặc định. Chạy `i18n-rosetta tm stats` để xác minh nó đang hoạt động. Nếu bạn thấy 0 mục nhập sau nhiều lần đồng bộ, có thể có vấn đề với quyền thư mục `.rosetta/` của bạn
- **Sử dụng prompt caching (bộ nhớ đệm prompt)** — Rosetta tách các tin nhắn system/user để tăng tỷ lệ trúng bộ nhớ đệm (cache hits) trên các model của Anthropic và Google
- **Sử dụng Google Translate cho các ngôn ngữ Cấp 2 (Tier 2)** — Xem hướng dẫn [Translate 30 Languages](/docs/tutorials/translate-30-languages)

### Bản dịch cũ (stale) sau khi chuyển đổi nhà cung cấp

Nếu bạn chuyển từ phương thức dịch này sang phương thức dịch khác (ví dụ: `llm` sang `deepl`), bộ nhớ đệm TM có thể vẫn cung cấp các bản dịch cũ từ phương thức trước đó cho các key có văn bản nguồn chưa thay đổi. Khóa bộ nhớ đệm (cache key) bao gồm tên phương thức, vì vậy hầu hết các trường hợp đều được xử lý tự động. Nhưng nếu bạn đã thay đổi `model` trong cùng một phương thức:

```bash
# Force fresh translations for all keys
i18n-rosetta sync --no-tm

# Or clear the cache entirely and re-sync
i18n-rosetta tm clear --yes
i18n-rosetta sync
```

Xem [Translation Memory](/docs/concepts/translation-memory) để biết chi tiết về thiết kế khóa bộ nhớ đệm.

## Vẫn gặp khó khăn?

- **[GitHub Issues](https://github.com/gamedaysuits/i18n-rosetta/issues)** — Tìm kiếm các vấn đề hiện có hoặc mở một issue mới
- **[Architecture Docs](/docs/concepts/architecture)** — Tìm hiểu về thiết kế hệ thống
- **[Quality Gate](/docs/concepts/quality-gate)** — Cách thức hoạt động của quá trình xác thực ở hậu trường