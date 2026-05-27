---
sidebar_position: 4
title: "Ngôn ngữ được hỗ trợ"
---
# Các ngôn ngữ được hỗ trợ

rosetta đi kèm với các **Language Card** — các tệp cấu hình có cấu trúc cho 50 ngôn ngữ. Mỗi thẻ chứa các preset (cài đặt sẵn) về văn phong, siêu dữ liệu về hệ thống mức độ trang trọng, cờ hỗ trợ phương thức, quy tắc trình bày và thông tin hệ thống chữ viết. Bất kỳ ngôn ngữ nào mà LLM của bạn biết đều có thể được thêm vào chỉ bằng một dòng cấu hình — đây là những ngôn ngữ có các văn phong đã được tinh chỉnh, sẵn sàng cho môi trường production.

---

## Các phương thức dịch thuật

Mỗi ngôn ngữ có thể sử dụng một hoặc nhiều phương thức dịch thuật sau:

| Biểu tượng | Phương thức | Cách hoạt động | Chi phí |
|------|--------|-------------|------|
| 🟢 | **Google Translate** | Neural MT cơ sở. Hơn 130 ngôn ngữ. Chỉ dành cho chuỗi key-value — không thể dịch nội dung Markdown một cách an toàn. | ~$20/1 triệu ký tự |
| 🔵 | **LLM (OpenRouter)** | Bất kỳ ngôn ngữ nào mô hình biết. Prompt được điều hướng theo văn phong. Xử lý cả nội dung key-value và Markdown. | Tùy theo mô hình |
| 🟣 | **LLM-Coached** | LLM + từ điển ngữ pháp + dữ liệu huấn luyện (coaching data) được đưa vào prompt. Tốt nhất cho các ngôn ngữ có hình thái phức tạp. | Tùy theo mô hình |
| 🟠 | **API (Plugin)** | Các pipeline dịch thuật do cộng đồng lưu trữ, phục vụ qua HTTP. [Tương thích OCAP](https://mtevalarena.org/docs/community/low-resource-languages). | Tùy theo nhà cung cấp |

Thiết lập `GOOGLE_TRANSLATE_API_KEY` cho Google Translate, hoặc `OPENROUTER_API_KEY` cho các phương thức LLM. Xem [Các phương thức dịch thuật](/docs/guides/translation-methods) để biết thông tin chi tiết.

---

## Các ngôn ngữ ưu tiên

Đây là các locale được yêu cầu nhiều nhất cho các ứng dụng web và di động, được liệt kê theo thứ tự ưu tiên khả năng tiếp cận (accessibility-first) mà rosetta đề xuất.

| Cờ | Ngôn ngữ | Mã | Google | LLM | Coached | Hệ thống chữ viết | Ghi chú |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇸🇦 | Tiếng Ả Rập | `ar` | ✅ | ✅ | ✅ | — | RTL. Tiếng Ả Rập chuẩn hiện đại (فصحى). |
| 🇵🇭 | Tiếng Philippines (Taglish) | `tl` | ✅ | ✅ | ✅ | — | Chuyển mã (Code-switching): Tiếng Tagalog là chính, thuật ngữ kỹ thuật bằng tiếng Anh. |
| 🇫🇷 | Tiếng Pháp | `fr` | ✅ | ✅ | ✅ | — | Dạng Vous. Bao hàm giới tính (Connecté·e). |
| 🇪🇸 | Tiếng Tây Ban Nha | `es` | ✅ | ✅ | ✅ | — | Tiếng Mỹ Latinh trung lập. |
| 🇩🇪 | Tiếng Đức | `de` | ✅ | ✅ | ✅ | — | Dạng Sie. Bao hàm giới tính (Benutzer:innen). |
| 🇯🇵 | Tiếng Nhật | `ja` | ✅ | ✅ | ✅ | — | です/ます cho văn bản nội dung, する cho nhãn UI. |
| 🇨🇳 | Tiếng Trung (Giản thể) | `zh` | ✅ | ✅ | ✅ | — | 简体中文. |
| 🇮🇹 | Tiếng Ý | `it` | ✅ | ✅ | ✅ | — | Dạng Lei. |
| 🇧🇷 | Tiếng Bồ Đào Nha (BR) | `pt` | ✅ | ✅ | ✅ | — | Tiếng Bồ Đào Nha Brazil. |
| 🇰🇷 | Tiếng Hàn | `ko` | ✅ | ✅ | ✅ | — | Văn phong lịch sự 해요체. |

## Các ngôn ngữ phổ biến trên thế giới

| Cờ | Ngôn ngữ | Mã | Google | LLM | Coached | Hệ thống chữ viết | Ghi chú |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇧🇩 | Tiếng Bengal | `bn` | ✅ | ✅ | ✅ | — | Ưu tiên শুদ্ধ ভাষা. |
| 🇧🇬 | Tiếng Bulgaria | `bg` | ✅ | ✅ | ✅ | — | |
| 🇨🇿 | Tiếng Séc | `cs` | ✅ | ✅ | ✅ | — | Vykání (dạng vy). |
| 🇩🇰 | Tiếng Đan Mạch | `da` | ✅ | ✅ | ✅ | — | |
| 🇬🇷 | Tiếng Hy Lạp | `el` | ✅ | ✅ | ✅ | — | Δημοτική hiện đại. |
| 🇮🇷 | Tiếng Ba Tư | `fa` | ✅ | ✅ | ✅ | — | RTL. |
| 🇫🇮 | Tiếng Phần Lan | `fi` | ✅ | ✅ | ✅ | — | Không có giới tính ngữ pháp. |
| 🇮🇱 | Tiếng Do Thái | `he` | ✅ | ✅ | ✅ | — | RTL. |
| 🇮🇳 | Tiếng Hindi | `hi` | ✅ | ✅ | ✅ | — | शुद्ध हिन्दी. Hạn chế tối đa từ mượn tiếng Anh. |
| 🇭🇺 | Tiếng Hungary | `hu` | ✅ | ✅ | ✅ | — | Dạng Ön. |
| 🇮🇩 | Tiếng Indonesia | `id` | ✅ | ✅ | ✅ | — | |
| 🇲🇾 | Tiếng Mã Lai | `ms` | ✅ | ✅ | ✅ | — | |
| 🇳🇱 | Tiếng Hà Lan | `nl` | ✅ | ✅ | ✅ | — | Dạng U. |
| 🇳🇴 | Tiếng Na Uy | `nb` | ✅ | ✅ | ✅ | — | Bokmål. |
| 🇵🇱 | Tiếng Ba Lan | `pl` | ✅ | ✅ | ✅ | — | Dạng Pan/Pani. |
| 🇵🇹 | Tiếng Bồ Đào Nha (EU) | `pt-PT` | ✅ | ✅ | ✅ | — | Tiếng Bồ Đào Nha Châu Âu. |
| 🇷🇴 | Tiếng Romania | `ro` | ✅ | ✅ | ✅ | — | |
| 🇷🇺 | Tiếng Nga | `ru` | ✅ | ✅ | ✅ | — | Dạng Вы. |
| 🇸🇰 | Tiếng Slovak | `sk` | ✅ | ✅ | ✅ | — | Vykanie (dạng vy). |
| 🇷🇸 | Tiếng Serbia | `sr` | ✅ | ✅ | ✅ | 🔤 Latin→Cyrillic | Trình chuyển đổi hệ thống chữ viết tất định (deterministic). |
| 🇸🇪 | Tiếng Thụy Điển | `sv` | ✅ | ✅ | ✅ | — | |
| 🇰🇪 | Tiếng Swahili | `sw` | ✅ | ✅ | ✅ | — | |
| 🇹🇭 | Tiếng Thái | `th` | ✅ | ✅ | ✅ | — | Trợ từ lịch sự ครับ/ค่ะ. |
| 🇹🇷 | Tiếng Thổ Nhĩ Kỳ | `tr` | ✅ | ✅ | ✅ | — | Dạng Siz. |
| 🇺🇦 | Tiếng Ukraina | `uk` | ✅ | ✅ | ✅ | — | Dạng Ви. |
| 🇵🇰 | Tiếng Urdu | `ur` | ✅ | ✅ | ✅ | — | RTL. Dạng آپ. |
| 🇻🇳 | Tiếng Việt | `vi` | ✅ | ✅ | ✅ | — | |
| 🇹🇼 | Tiếng Trung (Phồn thể) | `zh-TW` | ✅ | ✅ | ✅ | — | 繁體中文. |
| 🇬🇪 | Tiếng Gruzia | `ka` | ✅ | ✅ | — | — | ქართული. Ngữ hệ Kartvelian. |
| 🇳🇬 | Tiếng Yoruba | `yo` | ✅ | ✅ | — | — | Èdè Yorùbá. Ngôn ngữ thanh điệu (3 thanh). |

## Các biến thể khu vực

| Cờ | Ngôn ngữ | Mã | Google | LLM | Coached | Hệ thống chữ viết | Ghi chú |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇲🇽 | Tiếng Tây Ban Nha (Mexico) | `es-MX` | ✅ | ✅ | ✅ | — | Dạng Tú. Văn phong gần gũi. |
| 🇨🇦 | Tiếng Pháp (Canada) | `fr-CA` | ✅ | ✅ | ✅ | — | Thành ngữ Québécois. |

---

## Ngôn ngữ bản địa & Ngôn ngữ ít tài nguyên

Các ngôn ngữ này không được hỗ trợ bởi các dịch vụ MT thương mại. rosetta cung cấp công cụ để các cộng đồng ngôn ngữ tự xây dựng phương thức dịch của riêng họ theo [các nguyên tắc OCAP](https://mtevalarena.org/docs/community/low-resource-languages).

| | Ngôn ngữ | Mã | Google | LLM | Coached | Hệ thống chữ viết | Trạng thái |
|---|----------|------|:------:|:---:|:-------:|--------|--------|
| 🪶 | Tiếng Cree Đồng bằng | `crk` | ❌ | ✅ | ✅ | 🔤 SRO→Syllabics | 🚧 Đang phát triển |
| 🌄 | Tiếng Quechua | `qu` | ✅ | ✅ | — | — | Runasimi. Hậu tố hiển ngôn (Evidential suffixes). |

:::info Tiếng Cree Đồng bằng đang được tích cực phát triển
Văn phong, cơ sở hạ tầng huấn luyện (coaching), trình chuyển đổi hệ thống chữ viết và bộ khung đánh giá (evaluation harness) cho tiếng Cree Đồng bằng đều đã hoạt động, nhưng pipeline dịch thuật **vẫn chưa được phát hành**. Chúng tôi đang làm việc với các cộng đồng ngôn ngữ theo [các nguyên tắc OCAP](https://mtevalarena.org/docs/community/low-resource-languages) để đảm bảo chất lượng trước khi phát hành. Xem [Hỗ trợ ngôn ngữ ít tài nguyên](https://mtevalarena.org/docs/community/low-resource-languages) để biết toàn bộ câu chuyện — và cách bạn có thể đóng góp.
:::

:::tip Thêm các ngôn ngữ ít tài nguyên khác
Hệ thống plugin phương thức của rosetta được thiết kế cho việc này. Một cộng đồng ngôn ngữ có thể xây dựng một phương thức dịch tùy chỉnh, tự lưu trữ và kiểm soát, đồng thời phục vụ nó thông qua [phương thức API](/docs/guides/serving-a-method). [Bảng xếp hạng phương thức](/leaderboard) theo dõi điểm số cho bất kỳ cặp ngôn ngữ nào — hãy xây dựng một phương thức, chạy bộ khung đánh giá và giành lấy điểm số cao nhất.
:::

---

## Ngôn ngữ nhân tạo (Conlangs)

Các ngôn ngữ nhân tạo (Conlangs) được hỗ trợ thông qua các văn phong LLM và các trình chuyển đổi hệ thống chữ viết tùy chọn. Chúng sử dụng cùng một cơ sở hạ tầng như các ngôn ngữ thực — cổng kiểm soát chất lượng (quality gate), hệ thống huấn luyện và pipeline chuyển đổi hệ thống chữ viết hoạt động hoàn toàn giống nhau.

| | Ngôn ngữ | Mã | Google | LLM | Hệ thống chữ viết | Ghi chú |
|---|----------|------|:------:|:---:|--------|-------|
| 🖖 | Tiếng Klingon | `tlh` | ❌ | ✅ | 🔤 Romanization→pIqaD | Yêu cầu font PUA. Từ vựng của Marc Okrand. |
| 🧝 | Tiếng Sindarin (Tiếng Tiên của Tolkien) | `x-elvish-s` | ❌ | ✅ | 🔤 Latin→Tengwar | Yêu cầu font CSUR PUA. |
| 🏴‍☠️ | Tiếng Anh Cướp biển | `x-pirate` | ❌ | ✅ | — | Chỉ có văn phong. Các phép ẩn dụ hàng hải. |
| 🦸 | Tiếng Krypton | `x-kryptonian` | ❌ | ✅ | 🔤 Latin→Kryptonian | Yêu cầu font PUA. |
| 🎭 | Tiếng Anh Shakespeare | `x-shakespeare` | ❌ | ✅ | — | Chỉ có văn phong. Dạng Thee/thou, -eth/-est. |
| 🐸 | Tiếng Yoda | `x-yoda` | ❌ | ✅ | — | Chỉ có văn phong. Trật tự từ OSV. |

Xem [Ngôn ngữ nhân tạo, Hệ thống chữ viết & Chính tả](/docs/guides/conlangs-scripts-orthography) để biết các yêu cầu về font PUA, giới hạn Unicode và cách thêm ngôn ngữ của riêng bạn.

---

## Các preset ngôn ngữ

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

rosetta có thể dịch sang **bất kỳ ngôn ngữ nào mà LLM của bạn biết** — bảng trên chỉ liệt kê các ngôn ngữ có sẵn preset văn phong. Để thêm một ngôn ngữ không có trong danh sách, hãy đưa mã BCP-47 của nó vào cấu hình của bạn:

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

LLM sẽ dịch bằng cách sử dụng kiến thức đã được huấn luyện về ngôn ngữ đó. Việc thiết lập `register` cho phép bạn kiểm soát âm điệu, mức độ trang trọng và các quy ước chính tả. Xem [Cấu hình](/docs/getting-started/configuration) để biết chi tiết.

---

## Language Card

Mỗi ngôn ngữ tích hợp sẵn đều có một **Language Card** — cấu hình JSON có cấu trúc được chia thành hai tầng (tier) để tối ưu hiệu suất:

### Kiến trúc hai tầng

| Tầng | Thư mục | Tải (Loaded) | Mục đích |
|------|-----------|--------|--------|
| **Runtime** | `lib/data/language-cards/` | Tải sớm (Eagerly) tại `import` | Engine dịch thuật: văn phong, mức độ trang trọng, quy tắc, hỗ trợ phương thức |
| **Reference** | `lib/data/language-reference/` | Tải lười (Lazily) khi có yêu cầu | Tài liệu cho nhà phát triển: các thách thức ngôn ngữ học, dữ liệu bách khoa, tài nguyên NLP |

Tầng runtime được giữ ở mức nhỏ (~2 KB/thẻ) để việc import rosetta không tải hàng megabyte dữ liệu tài liệu. Tầng reference có sẵn thông qua `getLanguageReference(code)` dành cho các công cụ, trang web và bộ khung đánh giá.

### Các trường của thẻ Runtime

| Trường | Nội dung |
|-------|------------------|
| **`nativeName`** | Tên tự gọi (Endonym) — tên của ngôn ngữ do chính người bản ngữ gọi, viết bằng hệ thống chữ viết của ngôn ngữ đó (ví dụ: ქართული, Runasimi) |
| **Hệ thống mức độ trang trọng** | Phân biệt T-V, các cấp độ giao tiếp, kính ngữ (keigo), trợ từ, v.v. |
| **Các preset văn phong** | Các preset prompt LLM được đặt tên dành riêng cho đặc điểm của ngôn ngữ đó |
| **Hỗ trợ phương thức** | Các API dịch thuật nào hỗ trợ ngôn ngữ này |
| **Hướng dẫn về giới tính** | Các quy tắc về giới tính ngữ pháp và mẹo viết bao hàm giới tính |
| **Hệ thống chữ viết/hướng viết** | Mã hệ thống chữ viết ISO 15924 và RTL/LTR |
| **Quy tắc** | Quy tắc trình bày (dấu ngoặc kép, khoảng trắng), viết hoa, các dạng số nhiều |
| **Tập dữ liệu đánh giá** | Các benchmark nào bao gồm ngôn ngữ này |
| **`glottocode`** | Định danh Glottolog chuẩn để tham chiếu chéo |
| **`humanReviewed`** | Thẻ đã được người bản ngữ đánh giá hay chưa |

### Các trường của thẻ Reference

| Trường | Nội dung |
|-------|------------------|
| **Các thách thức ngôn ngữ học** | Các cạm bẫy đặc thù của MT (ví dụ: tính hiển ngôn, dấu thanh điệu, tính chắp dính) |
| **Bách khoa** | Ngữ hệ, phân loại, số lượng người nói, khu vực |
| **Tài nguyên** | Các công cụ NLP, kho ngữ liệu song song, các mô hình đã được huấn luyện trước (pre-trained models) |

### Tạo khung (Scaffolding) cho một Language Card mới

Sử dụng trình tạo (generator) để tạo khung cho cả hai tầng từ các nguồn dữ liệu có thẩm quyền (IANA, CLDR, Glottolog):

```bash
# Preview what would be generated
node scripts/generate-language-card.mjs sw --dry-run

# Generate both runtime + reference cards
node scripts/generate-language-card.mjs sw
```

Trình tạo sẽ tự động điền siêu dữ liệu (mã, hệ thống chữ viết, hướng viết, số nhiều, dấu ngoặc kép, hỗ trợ phương thức, ngữ hệ) và đánh dấu các trường đánh giá ngôn ngữ học là TODO để con người tinh chỉnh.

### Sử dụng các khóa Preset

Thay vì viết toàn bộ văn bản cho văn phong, bạn có thể sử dụng tên khóa preset:

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "polite"
  }
}
```

Rosetta sẽ phân giải khóa thành prompt văn phong đầy đủ. Chạy `npx i18n-rosetta init` để xem các preset có sẵn cho từng ngôn ngữ.

### Các Preset ví dụ

| Ngôn ngữ | Các Preset | Mặc định |
|----------|---------|--------|
| Tiếng Pháp | `formal-vous`, `casual-tu` | `formal-vous` |
| Tiếng Hàn | `polite-haeyo`, `formal-hapsyo`, `casual-hae` | `polite-haeyo` |
| Tiếng Nhật | `polite`, `formal-keigo`, `casual` | `polite` |
| Tiếng Đức | `formal-Sie`, `casual-du` | `formal-Sie` |
| Tiếng Thái | `neutral-professional`, `polite-male`, `polite-female` | `neutral-professional` |
| Tiếng Tây Ban Nha | `neutral-professional`, `formal-usted`, `casual-tuteo` | `neutral-professional` |

Xem [Đóng góp một Language Card](https://github.com/gamedaysuits/i18n-rosetta) để biết thông số kỹ thuật đầy đủ, bao gồm xác thực trường và danh sách kiểm tra PR.

---

## Xem thêm

- [Cấu hình](/docs/getting-started/configuration) — tài liệu tham khảo cấu hình đầy đủ bao gồm thiết lập ngôn ngữ
- [Các phương thức dịch thuật](/docs/guides/translation-methods) — cách hoạt động của từng phương thức
- [Trình chuyển đổi hệ thống chữ viết](/docs/concepts/script-converters) — pipeline chuyển đổi hệ thống chữ viết tất định
- [Ngôn ngữ nhân tạo, Hệ thống chữ viết & Chính tả](/docs/guides/conlangs-scripts-orthography) — font PUA, Unicode, cách thêm các ngôn ngữ nhân tạo
- [Hỗ trợ ngôn ngữ ít tài nguyên](https://mtevalarena.org/docs/community/low-resource-languages) — xây dựng các phương thức cho các ngôn ngữ chưa được hỗ trợ tốt