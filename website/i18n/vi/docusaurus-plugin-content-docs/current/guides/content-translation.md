---
sidebar_position: 5
title: "Dịch nội dung"
---
# Dịch nội dung (Hugo Markdown)

Rosetta dịch các tệp Hugo Markdown — cả các trường front matter và nội dung phần thân — với sự bảo vệ toàn diện cho các khối mã, shortcodes và các thành phần có cấu trúc.

## Thiết lập

Thiết lập `contentDir` trong cấu hình của bạn để bật tính năng dịch nội dung Markdown:

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./i18n",
  "contentDir": "./content"
}
```

```bash
npx i18n-rosetta sync    # translates both string files and content files
```

## Những gì được dịch

### Front Matter

Cả dấu phân cách YAML (`---`) và TOML (`+++`) đều được hỗ trợ. Theo mặc định, các trường sau sẽ được dịch:

- `title`
- `description`
- `summary`
- `subtitle`
- `caption`
- `linkTitle`

Tất cả các trường khác (`date`, `draft`, `tags`, `weight`, `slug`, v.v.) được giữ nguyên. Tùy chỉnh bằng `translatableFields` trong cấu hình của bạn.

### Nội dung phần thân

Toàn bộ phần thân Markdown được dịch với tính năng bảo vệ khối — các thành phần có cấu trúc được che chắn bằng các placeholder Unicode sentinel trước khi dịch và được khôi phục lại sau đó.

## Bảo vệ khối

Các thành phần này sẽ được giữ nguyên khi dịch:

| Thành phần | Ví dụ | Mức độ bảo vệ |
|---------|---------|-----------|
| Khối mã | ``````` ```js ... ``` ``````` | Che chắn toàn bộ khối |
| Mã nội tuyến | `` `variable` `` | Được che chắn |
| Hugo shortcodes | `{{< figure >}}`, `{{% note %}}` | Che chắn toàn bộ khối |
| HTML thô | `<div>`, `<table>` | Được che chắn |
| Liên kết (URLs) | `[text](https://...)` | Giữ nguyên URL, dịch văn bản |
| Nội suy | `{{ .Count }}` | Được che chắn |

## Quy ước đặt tên tệp

Tuân theo mẫu dịch-theo-tên-tệp (translation-by-filename) của Hugo:

```
my-post.md      → my-post.fr.md
my-post.en.md   → my-post.fr.md  (strips source suffix)
```

## Hành vi bỏ qua

Các tệp đã dịch hiện có **không bao giờ bị ghi đè**. Nếu `my-post.fr.md` đã tồn tại, nó sẽ bị bỏ qua. Xóa tệp đích để buộc dịch lại.

## Phương thức chỉ dành cho Markdown

:::warning Google Translate và Markdown
Google Translate **không nhận biết được** các khối mã, shortcodes hoặc các biến nội suy. Nó sẽ làm hỏng nội dung Markdown có cấu trúc. Hãy sử dụng các phương thức LLM (`llm` hoặc `llm-coached`) để dịch nội dung — chúng che chắn rõ ràng các thành phần có cấu trúc.
:::

Khi việc dịch nội dung chuyển dự phòng từ Google Translate sang một phương thức LLM, rosetta sẽ ghi lại một cảnh báo để giải thích lý do.