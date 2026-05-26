---
sidebar_position: 2
title: "Dịch 30 ngôn ngữ"
description: "Cẩm nang: mở rộng quy mô dự án từ 3 lên 30 ngôn ngữ thông qua việc kết hợp phương pháp theo từng cặp, xử lý hàng loạt và tích hợp CI."
---
# Cookbook: Dịch 30 ngôn ngữ

Mở rộng quy mô dự án từ một vài khu vực sang phạm vi toàn cầu. Cookbook này hướng dẫn chi tiết về việc lựa chọn phương pháp, tối ưu hóa chi phí và tích hợp CI cho một đợt triển khai đa ngôn ngữ thực tế.

**Kịch bản:** Bạn có một ứng dụng SaaS với `en`, `fr`, `es`. Bạn cần thêm 27 ngôn ngữ nữa qua ba cấp độ yêu cầu chất lượng.

---

## Bước 1: Phân loại ngôn ngữ của bạn

Không phải tất cả 30 ngôn ngữ đều cần cùng một cách tiếp cận. Hãy nhóm chúng theo chất lượng của phương pháp có sẵn:

| Cấp độ | Ngôn ngữ | Phương pháp | Lý do |
|------|-----------|--------|-----|
| **Cấp độ 1 — Cao cấp** | `ja`, `ko`, `zh`, `de`, `pt` | `llm` (GPT-4o) | Thị trường giá trị cao, ngữ pháp nhiều sắc thái |
| **Cấp độ 2 — Tiêu chuẩn** | `it`, `nl`, `pl`, `sv`, `da`, `fi`, `no`, `cs`, `ro`, `hu`, `el`, `tr`, `id`, `ms`, `th`, `vi`, `uk`, `bg` | `google-translate` | Khối lượng lớn, được Google hỗ trợ tốt |
| **Cấp độ 3 — Có hướng dẫn** | `crk`, `oj`, `mi`, `haw` | `llm-coached` + plugins | Ít tài nguyên, yêu cầu tuân thủ thuật ngữ |

## Bước 2: Cấu hình theo từng cặp

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "defaultMethod": "google-translate",
  "model": "google/gemini-3.5-flash",
  "languages": {
    "ja": { "name": "Japanese", "register": "Polite/formal" },
    "ko": { "name": "Korean", "register": "Formal" },
    "zh": { "name": "Simplified Chinese", "register": "Neutral" },
    "de": { "name": "German", "register": "Formal (Sie)" },
    "pt": { "name": "Brazilian Portuguese", "register": "Informal" },
    "crk": { "name": "Plains Cree (SRO)", "register": "Neutral" }
  },
  "pairs": {
    "en:ja": { "method": "llm", "model": "openai/gpt-4o" },
    "en:ko": { "method": "llm", "model": "openai/gpt-4o" },
    "en:zh": { "method": "llm", "model": "openai/gpt-4o" },
    "en:de": { "method": "llm", "model": "openai/gpt-4o" },
    "en:pt": { "method": "llm", "model": "openai/gpt-4o" },
    "en:crk": { "methodPlugin": "crk-coached-v1" }
  }
}
```

**Lưu ý:** Các ngôn ngữ không được liệt kê trong `pairs` sẽ kế thừa `defaultMethod: "google-translate"`. Bạn không cần phải liệt kê toàn bộ 30 ngôn ngữ.

:::info
Hỗ trợ `crk` đang được phát triển — xem [Hỗ trợ ngôn ngữ ít tài nguyên](https://mtevalarena.org/docs/community/low-resource-languages) để biết trạng thái và hướng dẫn đóng góp.
:::

## Bước 3: Thiết lập API Keys

Bạn sẽ cần cả hai API key cho cấu hình này:

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
export GOOGLE_TRANSLATE_API_KEY="AIza..."
```

## Bước 4: Chạy thử (Dry Run) trước

Luôn xem trước khi dịch 30 ngôn ngữ:

```bash
npx i18n-rosetta sync --dry
```

Xem lại kết quả đầu ra. Nó sẽ hiển thị:
- Cặp nào sử dụng phương pháp nào
- Có bao nhiêu key mới/đã thay đổi cho mỗi khu vực (locale)
- Ước tính số lượt gọi API theo từng cấp độ

## Bước 5: Chạy đồng bộ (Sync)

```bash
npx i18n-rosetta sync
```

Rosetta xử lý từng cặp một cách độc lập. Các cặp Cấp độ 2 sử dụng Google Translate sẽ rất nhanh. Các cặp LLM Cấp độ 1 sẽ chậm hơn nhưng chất lượng cao hơn. Các cặp có hướng dẫn Cấp độ 3 sử dụng dữ liệu hướng dẫn (coaching data) của plugin.

### Cập nhật tăng dần

Sau lần đồng bộ đầu tiên, các lần chạy tiếp theo chỉ dịch các key **đã thay đổi hoặc mới**:

```bash
# Only keys that changed since last sync
npx i18n-rosetta sync
```

Tệp khóa (`.i18n-rosetta.lock`) theo dõi những gì đã được dịch, vì vậy bạn không bao giờ phải dịch lại các nội dung đã ổn định.

## Bước 6: Kiểm tra chất lượng

Kiểm tra trạng thái của tất cả các cặp ngôn ngữ:

```bash
npx i18n-rosetta status
```

Lệnh này xuất ra một bảng hiển thị phương pháp, model, cấp độ chất lượng của từng cặp, và liệu có sẵn dữ liệu hướng dẫn hoặc điểm chuẩn (benchmark scores) hay không.

## Bước 7: Tích hợp CI

Thêm vào workflow GitHub Actions của bạn để các bản dịch luôn được cập nhật trên mỗi lần push:

```yaml title=".github/workflows/i18n-sync.yml"
name: Sync Translations
on:
  push:
    paths:
      - 'locales/en/**'

jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npm ci

      - name: Sync translations
        run: npx i18n-rosetta sync
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
          GOOGLE_TRANSLATE_API_KEY: ${{ secrets.GOOGLE_TRANSLATE_API_KEY }}

      - name: Commit updated translations
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add locales/
          git diff --staged --quiet || git commit -m "chore(i18n): sync translations"
          git push
```

## Ước tính chi phí

Đối với một dự án có 500 source keys trên 30 ngôn ngữ:

| Cấp độ | Ngôn ngữ | Phương pháp | Chi phí ước tính |
|------|-----------|--------|-----------------|
| Cấp độ 1 (5 ngôn ngữ) | ja, ko, zh, de, pt | GPT-4o | ~$2.50/lần đồng bộ toàn bộ |
| Cấp độ 2 (18 ngôn ngữ) | it, nl, pl, v.v. | Google Translate | ~$0.90/lần đồng bộ toàn bộ |
| Cấp độ 3 (4 ngôn ngữ) | crk, oj, mi, haw | GPT-4o-mini có hướng dẫn | ~$0.40/lần đồng bộ toàn bộ |
| **Tổng cộng** | **30 ngôn ngữ** | **Hỗn hợp** | **~$3.80/lần đồng bộ toàn bộ** |

Các lần đồng bộ tăng dần (5–20 key thay đổi) chỉ tốn một phần nhỏ chi phí so với đồng bộ toàn bộ.

## Xem thêm

- [Phương pháp dịch](/docs/guides/translation-methods) — Cách mỗi phương pháp dịch hoạt động và khi nào nên sử dụng
- [Đặc tả Plugin](/docs/reference/plugin-spec) — Tạo dữ liệu hướng dẫn cho bất kỳ ngôn ngữ Cấp độ 3 nào của bạn
- [Hướng dẫn CI/CD](/docs/guides/ci-cd) — Các pattern CI nâng cao bao gồm các bản build xem trước cho PR
- [Cổng chất lượng (Quality Gate)](/docs/concepts/quality-gate) — Cách Rosetta xác thực mọi bản dịch trước khi ghi lại
- [Ngôn ngữ được hỗ trợ](/docs/reference/supported-languages) — Danh sách đầy đủ các mã ngôn ngữ và khả năng tương thích của phương pháp
- [Hỗ trợ ngôn ngữ ít tài nguyên](https://mtevalarena.org/docs/community/low-resource-languages) — Thêm dữ liệu hướng dẫn cho các ngôn ngữ không có độ phủ MT (Dịch máy) rộng rãi