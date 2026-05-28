---
sidebar_position: 4
title: "Ngôn ngữ được hỗ trợ"
---
# Các ngôn ngữ được hỗ trợ

rosetta đi kèm với các **Language Card** (Thẻ ngôn ngữ) — các tệp cấu hình có cấu trúc cho 50 ngôn ngữ. Mỗi thẻ chứa các preset (cài đặt sẵn) về register (văn phong), siêu dữ liệu về hệ thống formality (độ trang trọng), các cờ hỗ trợ phương thức, quy tắc typography (đánh máy) và thông tin về script (chữ viết). Bất kỳ ngôn ngữ nào mà LLM của bạn biết đều có thể được thêm vào chỉ bằng một dòng cấu hình — đây là những ngôn ngữ có các register đã được tinh chỉnh và sẵn sàng cho môi trường production.

---

## Các phương thức dịch

Mỗi ngôn ngữ có thể sử dụng một hoặc nhiều phương thức dịch sau:

| Biểu tượng | Phương thức | Cách hoạt động | Chi phí |
|------|--------|-------------|------|
| 🟢 | **Google Translate** | Neural MT cơ bản. Hơn 130 ngôn ngữ. Chỉ hỗ trợ chuỗi key-value — không thể dịch an toàn nội dung Markdown. | ~$20/1M ký tự |
| 🔵 | **LLM (OpenRouter)** | Bất kỳ ngôn ngữ nào mô hình biết. Prompt được điều hướng theo register. Xử lý cả key-value và nội dung Markdown. | Tùy thuộc vào mô hình |
| 🟣 | **LLM-Coached** | LLM + từ điển ngữ pháp + dữ liệu huấn luyện (coaching data) được đưa vào prompt. Tốt nhất cho các ngôn ngữ có hình thái phức tạp. | Tùy thuộc vào mô hình |
| 🟠 | **API (Plugin)** | Các pipeline dịch thuật do cộng đồng lưu trữ và phục vụ qua HTTP. [Tương thích với OCAP](https://mtevalarena.org/docs/community/low-resource-languages). | Tùy thuộc vào nhà cung cấp |

Thiết lập `GOOGLE_TRANSLATE_API_KEY` cho Google Translate, hoặc `OPENROUTER_API_KEY` cho các phương thức LLM. Xem [Các phương thức dịch](/docs/guides/translation-methods) để biết thông tin chi tiết.

---

## Các ngôn ngữ ưu tiên

Đây là các locale (ngôn ngữ/khu vực) được yêu cầu nhiều nhất cho các ứng dụng web và di động, được liệt kê theo thứ tự ưu tiên khả năng tiếp cận (accessibility-first) mà rosetta khuyên dùng.

| Cờ | Ngôn ngữ | Mã | Google | LLM | Coached | Script | Ghi chú |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇸🇦 | Arabic (Tiếng Ả Rập) | `ar` | ✅ | ✅ | ✅ | — | RTL. Modern Standard Arabic (فصحى). |
| 🇵🇭 | Filipino (Taglish) | `tl` / `fil` | ✅ | ✅ | ✅ | — | Sử dụng `fil` trong cấu hình Docusaurus. rosetta có thể phân giải cả hai. |
| 🇫🇷 | French (Tiếng Pháp) | `fr` | ✅ | ✅ | ✅ | — | Dạng Vous. Bao hàm giới tính (Connecté·e). |
| 🇪🇸 | Spanish (Tiếng Tây Ban Nha) | `es` | ✅ | ✅ | ✅ | — | Tiếng Tây Ban Nha Mỹ Latinh trung lập. |
| 🇩🇪 | German (Tiếng Đức) | `de` | ✅ | ✅ | ✅ | — | Dạng Sie. Bao hàm giới tính (Benutzer:innen). |
| 🇯🇵 | Japanese (Tiếng Nhật) | `ja` | ✅ | ✅ | ✅ | — | です/ます cho văn bản nội dung, する cho nhãn UI. |
| 🇨🇳 | Chinese (Simplified) (Tiếng Trung Giản thể) | `zh` | ✅ | ✅ | ✅ | — | 简体中文. |
| 🇮🇹 | Italian (Tiếng Ý) | `it` | ✅ | ✅ | ✅ | — | Dạng Lei. |
| 🇧🇷 | Portuguese (BR) (Tiếng Bồ Đào Nha - Brazil) | `pt` | ✅ | ✅ | ✅ | — | Tiếng Bồ Đào Nha Brazil. |
| 🇰🇷 | Korean (Tiếng Hàn) | `ko` | ✅ | ✅ | ✅ | — | Văn phong lịch sự 해요체. |

## Các ngôn ngữ chính trên thế giới

| Cờ | Ngôn ngữ | Mã | Google | LLM | Coached | Script | Ghi chú |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇧🇩 | Bengali | `bn` | ✅ | ✅ | ✅ | — | Ưu tiên শুদ্ধ ভাষা. |
| 🇧🇬 | Bulgarian | `bg` | ✅ | ✅ | ✅ | — | |
| 🇨🇿 | Czech | `cs` | ✅ | ✅ | ✅ | — | Vykání (dạng vy). |
| 🇩🇰 | Danish | `da` | ✅ | ✅ | ✅ | — | |
| 🇬🇷 | Greek | `el` | ✅ | ✅ | ✅ | — | Δημοτική hiện đại. |
| 🇮🇷 | Persian | `fa` | ✅ | ✅ | ✅ | — | RTL. |
| 🇫🇮 | Finnish | `fi` | ✅ | ✅ | ✅ | — | Không có giống ngữ pháp. |
| 🇮🇱 | Hebrew | `he` | ✅ | ✅ | ✅ | — | RTL. |
| 🇮🇳 | Hindi | `hi` | ✅ | ✅ | ✅ | — | शुद्ध हिन्दी. Hạn chế tối đa từ mượn tiếng Anh. |
| 🇭🇺 | Hungarian | `hu` | ✅ | ✅ | ✅ | — | Dạng Ön. |
| 🇮🇩 | Indonesian | `id` | ✅ | ✅ | ✅ | — | |
| 🇲🇾 | Malay | `ms` | ✅ | ✅ | ✅ | — | |
| 🇳🇱 | Dutch | `nl` | ✅ | ✅ | ✅ | — | Dạng U. |
| 🇳🇴 | Norwegian | `nb` | ✅ | ✅ | ✅ | — | Bokmål. |
| 🇵🇱 | Polish | `pl` | ✅ | ✅ | ✅ | — | Dạng Pan/Pani. |
| 🇵🇹 | Portuguese (EU) | `pt-PT` | ✅ | ✅ | ✅ | — | Tiếng Bồ Đào Nha Châu Âu. |
| 🇷🇴 | Romanian | `ro` | ✅ | ✅ | ✅ | — | |
| 🇷🇺 | Russian | `ru` | ✅ | ✅ | ✅ | — | Dạng Вы. |
| 🇸🇰 | Slovak | `sk` | ✅ | ✅ | ✅ | — | Vykanie (dạng vy). |
| 🇷🇸 | Serbian | `sr` | ✅ | ✅ | ✅ | 🔤 Latin→Cyrillic | Trình chuyển đổi script tất định (deterministic). |
| 🇸🇪 | Swedish | `sv` | ✅ | ✅ | ✅ | — | |
| 🇰🇪 | Swahili | `sw` | ✅ | ✅ | ✅ | — | |
| 🇹🇭 | Thai | `th` | ✅ | ✅ | ✅ | — | Trợ từ lịch sự ครับ/ค่ะ. |
| 🇹🇷 | Turkish | `tr` | ✅ | ✅ | ✅ | — | Dạng Siz. |
| 🇺🇦 | Ukrainian | `uk` | ✅ | ✅ | ✅ | — | Dạng Ви. |
| 🇵🇰 | Urdu | `ur` | ✅ | ✅ | ✅ | — | RTL. Dạng آپ. |
| 🇻🇳 | Vietnamese | `vi` | ✅ | ✅ | ✅ | — | |
| 🇹🇼 | Chinese (Traditional) | `zh-TW` | ✅ | ✅ | ✅ | — | 繁體中文. |
| 🇬🇪 | Georgian | `ka` | ✅ | ✅ | — | — | ქართული. Ngữ hệ Kartvelian. |
| 🇳🇬 | Yoruba | `yo` | ✅ | ✅ | — | — | Èdè Yorùbá. Ngôn ngữ thanh điệu (3 thanh). |

## Các biến thể theo khu vực

| Cờ | Ngôn ngữ | Mã | Google | LLM | Coached | Script | Ghi chú |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇲🇽 | Mexican Spanish | `es-MX` | ✅ | ✅ | ✅ | — | Dạng Tú. Văn phong ấm áp. |
| 🇨🇦 | Canadian French | `fr-CA` | ✅ | ✅ | ✅ | — | Thành ngữ Québécois. |

---

## Các ngôn ngữ bản địa & ít tài nguyên

Các ngôn ngữ này không được hỗ trợ bởi các dịch vụ MT thương mại. rosetta cung cấp công cụ để các cộng đồng ngôn ngữ tự xây dựng phương thức dịch của riêng họ theo [các nguyên tắc OCAP](https://mtevalarena.org/docs/community/low-resource-languages).

| | Ngôn ngữ | Mã | Google | LLM | Coached | Script | Trạng thái |
|---|----------|------|:------:|:---:|:-------:|--------|--------|
| 🪶 | Plains Cree | `crk` | ❌ | ✅ | ✅ | 🔤 SRO→Syllabics | 🚧 Đang phát triển |
| 🌄 | Quechua | `qu` | ✅ | ✅ | — | — | Runasimi. Hậu tố hiển ngôn (Evidential suffixes). |

:::info Plains Cree đang được tích cực phát triển
Register, cơ sở hạ tầng coaching, trình chuyển đổi script và bộ công cụ đánh giá (evaluation harness) cho Plains Cree đều đã hoạt động, nhưng pipeline dịch thuật **vẫn chưa được phát hành**. Chúng tôi đang làm việc với các cộng đồng ngôn ngữ theo [các nguyên tắc OCAP](https://mtevalarena.org/docs/community/low-resource-languages) để đảm bảo chất lượng trước khi phát hành. Xem [Hỗ trợ ngôn ngữ ít tài nguyên](https://mtevalarena.org/docs/community/low-resource-languages) để biết toàn bộ câu chuyện — và cách bạn có thể đóng góp.
:::

:::tip Thêm các ngôn ngữ ít tài nguyên khác
Hệ thống plugin phương thức của rosetta được thiết kế cho việc này. Một cộng đồng ngôn ngữ có thể xây dựng một phương thức dịch tùy chỉnh, lưu trữ dưới sự kiểm soát của riêng họ và phục vụ nó thông qua [phương thức API](/docs/guides/serving-a-method). [Bảng xếp hạng phương thức](/leaderboard) theo dõi điểm số cho bất kỳ cặp ngôn ngữ nào — hãy xây dựng một phương thức, chạy bộ công cụ đánh giá và giành lấy điểm số cao nhất.
:::

---

## Ngôn ngữ nhân tạo (Constructed Languages)

Các conlang (ngôn ngữ nhân tạo) được hỗ trợ thông qua các register của LLM và các trình chuyển đổi script tùy chọn. Chúng sử dụng cùng một cơ sở hạ tầng như các ngôn ngữ thực — quality gate (cổng kiểm soát chất lượng), hệ thống coaching và pipeline chuyển đổi script hoạt động hoàn toàn giống nhau.

| | Ngôn ngữ | Mã | Google | LLM | Script | Ghi chú |
|---|----------|------|:------:|:---:|--------|-------|
| 🖖 | Klingon | `tlh` | ❌ | ✅ | 🔤 Romanization→pIqaD | Yêu cầu font PUA. Từ vựng Marc Okrand. |
| 🧝 | Sindarin (Tolkien Elvish) | `x-elvish-s` | ❌ | ✅ | 🔤 Latin→Tengwar | Yêu cầu font CSUR PUA. |
| 🏴‍☠️ | Pirate English | `x-pirate` | ❌ | ✅ | — | Chỉ có register. Ẩn dụ hàng hải. |
| 🦸 | Kryptonian | `x-kryptonian` | ❌ | ✅ | 🔤 Latin→Kryptonian | Yêu cầu font PUA. |
| 🎭 | Shakespearean English | `x-shakespeare` | ❌ | ✅ | — | Chỉ có register. Dạng Thee/thou, -eth/-est. |
| 🐸 | Yoda-speak | `x-yoda` | ❌ | ✅ | — | Chỉ có register. Trật tự từ OSV. |

Xem [Conlangs, Scripts & Orthography](/docs/guides/conlangs-scripts-orthography) để biết các yêu cầu về font PUA, giới hạn Unicode và cách thêm ngôn ngữ của riêng bạn.

---

## Các Preset ngôn ngữ

Trình hướng dẫn `init` hỗ trợ các tên preset để thiết lập nhanh. Bạn có thể kết hợp các preset với các mã ngôn ngữ riêng lẻ.

| Preset | Mở rộng thành |
|--------|-----------|
| `european` | fr, de, es, it, pt, nl |
| `asian` | ja, zh, ko |
| `global` | fr, es, de, ja, zh, ko, pt, ar |
| `nordic` | da, fi, nb, sv |

```bash
# Mix presets with individual codes
i18n-rosetta init
# → Target languages: european, ja
# → Resolves to: fr, de, es, it, pt, nl, ja
```

---

## Thêm bất kỳ ngôn ngữ nào

rosetta có thể dịch sang **bất kỳ ngôn ngữ nào mà LLM của bạn biết** — bảng trên chỉ liệt kê các ngôn ngữ có sẵn các preset về register. Để thêm một ngôn ngữ không có trong danh sách, hãy đưa mã BCP-47 của nó vào cấu hình của bạn:

```json
{
  "languages": {
    "sw": {},
    "am": {
      "register": "Formal Amharic. Professional register with Geʽez script."
    }
  }
}
```

LLM sẽ dịch bằng cách sử dụng kiến thức đã được huấn luyện về ngôn ngữ đó. Việc thiết lập `register` cho phép bạn kiểm soát giọng điệu, độ trang trọng và các quy ước chính tả. Xem [Cấu hình](/docs/getting-started/configuration) để biết chi tiết.

---

## Language Card (Thẻ ngôn ngữ)

Mỗi ngôn ngữ tích hợp sẵn đều có một **Language Card** — cấu hình JSON có cấu trúc được chia thành hai tầng (tier) để tối ưu hiệu suất:

### Kiến trúc hai tầng

| Tầng | Thư mục | Tải lúc | Mục đích |
|------|-----------|--------|--------|
| **Runtime** | `lib/data/language-cards/` | Tải ngay (Eagerly) tại `import` | Engine dịch thuật: register, độ trang trọng, quy tắc, hỗ trợ phương thức |
| **Reference** | `lib/data/language-reference/` | Tải trễ (Lazily) khi cần | Tài liệu cho nhà phát triển: thách thức ngôn ngữ học, dữ liệu bách khoa, tài nguyên NLP |

Tầng runtime được giữ ở kích thước nhỏ (~2 KB/thẻ) để việc import rosetta không phải tải hàng megabyte dữ liệu tài liệu. Tầng reference có sẵn thông qua `getLanguageReference(code)` dành cho các công cụ, trang web và bộ công cụ đánh giá.

### Các trường của thẻ Runtime

| Trường | Nội dung |
|-------|------------------|
| **`nativeName`** | Tên tự gọi (Endonym) — tên của ngôn ngữ do chính người bản xứ gọi, viết bằng script của ngôn ngữ đó (ví dụ: ქართული, Runasimi) |
| **Hệ thống formality** | Phân biệt T-V, các cấp độ giao tiếp, keigo, trợ từ, v.v. |
| **Các preset register** | Các preset prompt LLM được đặt tên, đặc trưng cho tính chất của ngôn ngữ |
| **Hỗ trợ phương thức** | Các API dịch thuật nào hỗ trợ ngôn ngữ này |
| **Hướng dẫn về giới tính** | Các quy tắc giống ngữ pháp và mẹo viết bao hàm giới tính (inclusive writing) |
| **Script/hướng viết** | Mã script ISO 15924 và RTL/LTR |
| **Quy tắc** | Typography (dấu ngoặc kép, khoảng trắng), viết hoa, các danh mục số nhiều |
| **Tập dữ liệu đánh giá** | Các benchmark nào bao gồm ngôn ngữ này |
| **`glottocode`** | Định danh Glottolog chuẩn để tham chiếu chéo |
| **`humanReviewed`** | Thẻ đã được người bản xứ đánh giá hay chưa |

### Các trường của thẻ Reference

| Trường | Nội dung |
|-------|------------------|
| **Thách thức ngôn ngữ học** | Các cạm bẫy đặc thù của MT (ví dụ: tính hiển ngôn, dấu thanh điệu, tính chắp dính) |
| **Dữ liệu bách khoa** | Ngữ hệ, phân loại, số lượng người nói, khu vực |
| **Tài nguyên** | Các công cụ NLP, ngữ liệu song song, các mô hình đã được huấn luyện trước |

### Tạo khung (Scaffolding) cho một Language Card mới

Sử dụng trình tạo (generator) để tạo khung cho cả hai tầng từ các nguồn dữ liệu có thẩm quyền (IANA, CLDR, Glottolog):

```bash
# Preview what would be generated
node scripts/generate-language-card.mjs sw --dry-run

# Generate both runtime + reference cards
node scripts/generate-language-card.mjs sw
```

Trình tạo sẽ tự động điền các siêu dữ liệu (mã, script, hướng viết, số nhiều, dấu ngoặc kép, hỗ trợ phương thức, ngữ hệ) và đánh dấu các trường đánh giá ngôn ngữ học là TODO để con người tinh chỉnh.

### Sử dụng các khóa Preset

Thay vì viết toàn bộ văn bản register, bạn có thể sử dụng tên khóa preset:

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "polite"
  }
}
```

Rosetta sẽ phân giải khóa thành prompt register đầy đủ. Chạy `npx i18n-rosetta init` để xem các preset có sẵn cho từng ngôn ngữ.

### Ví dụ về các Preset

| Ngôn ngữ | Các Preset | Mặc định |
|----------|---------|--------|
| French | `formal-vous`, `casual-tu` | `formal-vous` |
| Korean | `polite-haeyo`, `formal-hapsyo`, `casual-hae` | `polite-haeyo` |
| Japanese | `polite`, `formal-keigo`, `casual` | `polite` |
| German | `formal-Sie`, `casual-du` | `formal-Sie` |
| Thai | `neutral-professional`, `polite-male`, `polite-female` | `neutral-professional` |
| Spanish | `neutral-professional`, `formal-usted`, `casual-tuteo` | `neutral-professional` |

Xem [Đóng góp một Language Card](https://github.com/gamedaysuits/i18n-rosetta) để biết toàn bộ đặc tả, bao gồm xác thực trường và danh sách kiểm tra PR.

---

## Xem thêm

- [Cấu hình](/docs/getting-started/configuration) — tham chiếu cấu hình đầy đủ bao gồm thiết lập ngôn ngữ
- [Các phương thức dịch](/docs/guides/translation-methods) — cách hoạt động của từng phương thức
- [Trình chuyển đổi Script](/docs/concepts/script-converters) — pipeline chuyển đổi script tất định
- [Conlangs, Scripts & Orthography](/docs/guides/conlangs-scripts-orthography) — font PUA, Unicode, cách thêm conlang
- [Hỗ trợ ngôn ngữ ít tài nguyên](https://mtevalarena.org/docs/community/low-resource-languages) — xây dựng các phương thức cho các ngôn ngữ chưa được hỗ trợ tốt