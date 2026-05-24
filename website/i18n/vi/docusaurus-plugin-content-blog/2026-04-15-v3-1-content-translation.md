---
slug: v3-1-content-translation
title: "v3.1.0: Dịch nội dung Hugo Markdown"
authors: [curtisforbes]
tags: [release]
date: 2026-04-15
---
v3.1.0 bổ sung tính năng dịch toàn bộ nội dung Hugo Markdown — các trường front matter và nội dung phần thân, với khả năng bảo vệ tự động cho các khối mã, shortcode và các biến nội suy.

<!-- truncate -->

## Dịch thuật nhận biết nội dung

Khi dịch Markdown, bạn không thể chỉ gửi tệp thô cho một LLM. Các khối mã sẽ bị dịch. Các shortcode sẽ bị hỏng. Các biến mẫu Hugo sẽ bị xáo trộn.

Rosetta v3.1.0 giải quyết vấn đề này bằng **cơ chế bảo vệ Unicode sentinel**:

1. Trước khi dịch, các khối có cấu trúc (khối mã, shortcode, mã nội tuyến, HTML) được thay thế bằng các token sentinel duy nhất
2. LLM chỉ nhận được văn bản có thể dịch
3. Sau khi dịch, các sentinel được khôi phục lại với nội dung gốc

LLM không bao giờ nhìn thấy các khối mã của bạn. Nó không thể làm hỏng chúng.

## Hỗ trợ Front Matter

Cả dấu phân cách front matter YAML (`---`) và TOML (`+++`) đều được hỗ trợ. Theo mặc định, `title`, `description`, `summary`, `subtitle`, `caption`, và `linkTitle` sẽ được dịch. Tất cả các trường khác (date, draft, tags, weight) đều được giữ nguyên.

## Thiết lập

```json title="i18n-rosetta.config.json"
{
  "contentDir": "./content"
}
```

```bash
npx i18n-rosetta sync   # now translates content too
```

Xem [Hướng dẫn dịch nội dung](/docs/guides/content-translation) để biết thêm chi tiết.