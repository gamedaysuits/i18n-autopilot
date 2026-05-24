---
sidebar_position: 4
title: "Ngôn ngữ được hỗ trợ"
---
# Ngôn ngữ được hỗ trợ

rosetta đi kèm với các **Language Cards** — các tệp tham chiếu có cấu trúc cho hơn 42 ngôn ngữ. Mỗi thẻ chứa các preset (cài đặt sẵn) về ngữ điệu, siêu dữ liệu của hệ thống mức độ trang trọng, cờ hỗ trợ phương thức và thông tin về hệ thống chữ viết. Bất kỳ ngôn ngữ nào mà LLM của bạn biết đều có thể được thêm vào chỉ bằng một dòng cấu hình — đây là những ngôn ngữ có các ngữ điệu đã được tinh chỉnh và sẵn sàng cho môi trường production.

---

## Phương thức dịch

Mỗi ngôn ngữ có thể sử dụng một hoặc nhiều phương thức dịch sau:

| Biểu tượng | Phương thức | Cách hoạt động | Chi phí |
|------|--------|-------------|------|
| 🟢 | **Google Translate** | Tiêu chuẩn Neural MT. Hơn 130 ngôn ngữ. Chỉ hỗ trợ chuỗi key-value — không thể dịch nội dung Markdown một cách an toàn. | ~$20/1M ký tự |
| 🔵 | **LLM (OpenRouter)** | Bất kỳ ngôn ngữ nào mô hình biết. Prompt được điều hướng theo ngữ điệu. Xử lý cả nội dung key-value và Markdown. | Tùy thuộc vào mô hình |
| 🟣 | **LLM-Coached** | LLM + từ điển ngữ pháp + dữ liệu huấn luyện (coaching data) được đưa vào prompt. Tốt nhất cho các ngôn ngữ có hình thái phức tạp. | Tùy thuộc vào mô hình |
| 🟠 | **API (Plugin)** | Các pipeline dịch thuật do cộng đồng lưu trữ và phục vụ qua HTTP. [Tương thích với OCAP](/docs/guides/low-resource-languages). | Tùy thuộc vào nhà cung cấp |

Thiết lập `GOOGLE_TRANSLATE_API_KEY` cho Google Translate, hoặc `OPENROUTER_API_KEY` cho các phương thức LLM. Xem [Phương thức dịch](/docs/guides/translation-methods) để biết thông tin chi tiết.

---

## Ngôn ngữ ưu tiên

Đây là các locale được yêu cầu phổ biến nhất cho các ứng dụng web và di động, được liệt kê theo thứ tự ưu tiên khả năng tiếp cận (accessibility-first) mà rosetta đề xuất.

| Cờ | Ngôn ngữ | Mã | Google | LLM | Coached | Chữ viết | Ghi chú |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇸🇦 | Tiếng Ả Rập | `ar` | ✅ | ✅ | ✅ | — | RTL. Tiếng Ả Rập Chuẩn Hiện đại (فصحى). |
| 🇵🇭 | Tiếng Philippines (Taglish) | `tl` | ✅ | ✅ | ✅ | — | Chuyển đổi mã (Code-switching): Tiếng Tagalog là chính, thuật ngữ kỹ thuật bằng tiếng Anh. |
| 🇫🇷 | Tiếng Pháp | `fr` | ✅ | ✅ | ✅ | — | Dạng Vous. Bao hàm giới tính (Connecté·e). |
| 🇪🇸 | Tiếng Tây Ban Nha | `es` | ✅ | ✅ | ✅ | — | Tiếng Mỹ Latinh trung lập. |
| 🇩🇪 | Tiếng Đức | `de` | ✅ | ✅ | ✅ | — | Dạng Sie. Bao hàm giới tính (Benutzer:innen). |
| 🇯🇵 | Tiếng Nhật | `ja` | ✅ | ✅ | ✅ | — | です/ます cho phần thân văn bản, する cho nhãn UI. |
| 🇨🇳 | Tiếng Trung (Giản thể) | `zh` | ✅ | ✅ | ✅ | — | 简体中文. |
| 🇮🇹 | Tiếng Ý | `it` | ✅ | ✅ | ✅ | — | Dạng Lei. |
| 🇧🇷 | Tiếng Bồ Đào Nha (BR) | `pt` | ✅ | ✅ | ✅ | — | Tiếng Bồ Đào Nha Brazil. |
| 🇰🇷 | Tiếng Hàn | `ko` | ✅ | ✅ | ✅ | — | Ngữ điệu lịch sự 해요체. |

## Các ngôn ngữ chính trên thế giới

| Cờ | Ngôn ngữ | Mã | Google | LLM | Coached | Chữ viết | Ghi chú |
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
| 🇷🇸 | Tiếng Serbia | `sr` | ✅ | ✅ | ✅ | 🔤 Latin→Cyrillic | Trình chuyển đổi chữ viết tất định. |
| 🇸🇪 | Tiếng Thụy Điển | `sv` | ✅ | ✅ | ✅ | — | |
| 🇰🇪 | Tiếng Swahili | `sw` | ✅ | ✅ | ✅ | — | |
| 🇹🇭 | Tiếng Thái | `th` | ✅ | ✅ | ✅ | — | Trợ từ lịch sự ครับ/ค่ะ. |
| 🇹🇷 | Tiếng Thổ Nhĩ Kỳ | `tr` | ✅ | ✅ | ✅ | — | Dạng Siz. |
| 🇺🇦 | Tiếng Ukraina | `uk` | ✅ | ✅ | ✅ | — | Dạng Ви. |
| 🇵🇰 | Tiếng Urdu | `ur` | ✅ | ✅ | ✅ | — | RTL. Dạng آپ. |
| 🇻🇳 | Tiếng Việt | `vi` | ✅ | ✅ | ✅ | — | |
| 🇹🇼 | Tiếng Trung (Phồn thể) | `zh-TW` | ✅ | ✅ | ✅ | — | 繁體中文. |

## Biến thể theo khu vực

| Cờ | Ngôn ngữ | Mã | Google | LLM | Coached | Chữ viết | Ghi chú |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇲🇽 | Tiếng Tây Ban Nha (Mexico) | `es-MX` | ✅ | ✅ | ✅ | — | Dạng Tú. Ngữ điệu ấm áp. |
| 🇨🇦 | Tiếng Pháp (Canada) | `fr-CA` | ✅ | ✅ | ✅ | — | Thành ngữ Québécois. |

---

## Ngôn ngữ bản địa & Ngôn ngữ ít tài nguyên

Các ngôn ngữ này không được hỗ trợ bởi các dịch vụ MT thương mại. rosetta cung cấp công cụ để các cộng đồng ngôn ngữ tự xây dựng phương thức dịch của riêng họ theo [các nguyên tắc OCAP](/docs/guides/low-resource-languages).

| | Ngôn ngữ | Mã | Google | LLM | Coached | Chữ viết | Trạng thái |
|---|----------|------|:------:|:---:|:-------:|--------|--------|
| 🪶 | Tiếng Plains Cree | `crk` | ❌ | ✅ | ✅ | 🔤 SRO→Syllabics | 🚧 Đang phát triển |

:::info Tiếng Plains Cree đang được tích cực phát triển
Ngữ điệu, cơ sở hạ tầng huấn luyện, trình chuyển đổi chữ viết và bộ công cụ đánh giá cho tiếng Plains Cree đều đã hoạt động, nhưng pipeline dịch thuật **vẫn chưa được phát hành**. Chúng tôi đang làm việc với các cộng đồng ngôn ngữ theo [các nguyên tắc OCAP](/docs/guides/low-resource-languages) để đảm bảo chất lượng trước khi phát hành. Xem [Hỗ trợ ngôn ngữ ít tài nguyên](/docs/guides/low-resource-languages) để biết toàn bộ câu chuyện — và cách bạn có thể đóng góp.
:::

:::tip Thêm nhiều ngôn ngữ ít tài nguyên hơn
Hệ thống plugin phương thức của rosetta được thiết kế cho mục đích này. Một cộng đồng ngôn ngữ có thể xây dựng một phương thức dịch tùy chỉnh, tự lưu trữ và kiểm soát nó, đồng thời phục vụ nó thông qua [phương thức API](/docs/guides/serving-a-method). [Bảng xếp hạng phương thức](/leaderboard) theo dõi điểm số cho bất kỳ cặp ngôn ngữ nào — hãy xây dựng một phương thức, chạy bộ công cụ đánh giá và giành lấy điểm số cao nhất.
:::

---

## Ngôn ngữ nhân tạo (Constructed Languages)

Các ngôn ngữ nhân tạo (Conlang) được hỗ trợ thông qua các ngữ điệu LLM và các trình chuyển đổi chữ viết tùy chọn. Chúng sử dụng cùng một cơ sở hạ tầng như các ngôn ngữ thực — cổng kiểm soát chất lượng, hệ thống huấn luyện và pipeline chuyển đổi chữ viết hoạt động hoàn toàn giống nhau.

| | Ngôn ngữ | Mã | Google | LLM | Chữ viết | Ghi chú |
|---|----------|------|:------:|:---:|--------|-------|
| 🖖 | Tiếng Klingon | `tlh` | ❌ | ✅ | 🔤 Romanization→pIqaD | Yêu cầu font PUA. Từ vựng của Marc Okrand. |
| 🧝 | Tiếng Sindarin (Tiếng Tiên của Tolkien) | `x-elvish-s` | ❌ | ✅ | 🔤 Latin→Tengwar | Yêu cầu font CSUR PUA. |
| 🏴‍☠️ | Tiếng Anh Cướp biển | `x-pirate` | ❌ | ✅ | — | Chỉ có ngữ điệu. Các phép ẩn dụ hàng hải. |
| 🦸 | Tiếng Krypton | `x-kryptonian` | ❌ | ✅ | 🔤 Latin→Kryptonian | Yêu cầu font PUA. |
| 🎭 | Tiếng Anh Shakespeare | `x-shakespeare` | ❌ | ✅ | — | Chỉ có ngữ điệu. Các dạng Thee/thou, -eth/-est. |
| 🐸 | Tiếng Yoda | `x-yoda` | ❌ | ✅ | — | Chỉ có ngữ điệu. Trật tự từ OSV. |

Xem [Ngôn ngữ nhân tạo, Chữ viết & Chính tả](/docs/guides/conlangs-scripts-orthography) để biết các yêu cầu về font PUA, giới hạn Unicode và cách thêm ngôn ngữ của riêng bạn.

---

## Preset ngôn ngữ

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

rosetta có thể dịch sang **bất kỳ ngôn ngữ nào mà LLM của bạn biết** — bảng trên chỉ liệt kê các ngôn ngữ có sẵn preset ngữ điệu. Để thêm một ngôn ngữ không có trong danh sách, hãy đưa mã BCP-47 của ngôn ngữ đó vào cấu hình của bạn:

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

LLM sẽ dịch bằng cách sử dụng kiến thức đã được huấn luyện về ngôn ngữ đó. Việc thiết lập `register` cho phép bạn kiểm soát giọng văn, mức độ trang trọng và các quy ước chính tả. Xem [Cấu hình](/docs/getting-started/configuration) để biết thêm chi tiết.

---

## Language Cards

Mỗi ngôn ngữ được tích hợp sẵn đều có một **Language Card** — một tệp JSON trong `lib/data/language-cards/` chứa:

| Trường | Nội dung |
|-------|------------------|
| **Hệ thống mức độ trang trọng (Formality system)** | Phân biệt T-V, các cấp độ giao tiếp, kính ngữ (keigo), trợ từ, v.v. |
| **Preset ngữ điệu (Register presets)** | Các preset được đặt tên dành riêng cho đặc trưng của ngôn ngữ |
| **Hỗ trợ phương thức (Method support)** | Các API dịch thuật nào hỗ trợ ngôn ngữ này |
| **Hướng dẫn về giới tính (Gender guidance)** | Các quy tắc về giới tính ngữ pháp và mẹo viết bao hàm giới tính |
| **Chữ viết/hướng (Script/direction)** | Mã chữ viết ISO 15924 và RTL/LTR |
| **Tập dữ liệu đánh giá (Eval datasets)** | Các benchmark nào bao gồm ngôn ngữ này |

### Sử dụng khóa Preset

Thay vì viết toàn bộ văn bản ngữ điệu, bạn có thể sử dụng tên khóa preset:

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "polite"
  }
}
```

Rosetta sẽ phân giải khóa này thành prompt ngữ điệu đầy đủ. Chạy `npx i18n-rosetta init` để xem các preset có sẵn cho từng ngôn ngữ.

### Ví dụ về Preset

| Ngôn ngữ | Preset | Mặc định |
|----------|---------|--------|
| Tiếng Pháp | `formal-vous`, `casual-tu` | `formal-vous` |
| Tiếng Hàn | `polite-haeyo`, `formal-hapsyo`, `casual-hae` | `polite-haeyo` |
| Tiếng Nhật | `polite`, `formal-keigo`, `casual` | `polite` |
| Tiếng Đức | `formal-Sie`, `casual-du` | `formal-Sie` |
| Tiếng Thái | `neutral-professional`, `polite-male`, `polite-female` | `neutral-professional` |
| Tiếng Tây Ban Nha | `neutral-professional`, `formal-usted`, `casual-tuteo` | `neutral-professional` |

Xem [Đóng góp một Language Card](https://github.com/nicholasgriffintn/i18n-rosetta/blob/main/docs/planning/LANGUAGE_CARD_SPEC.md) để biết cách thêm hoặc cải thiện các preset.

---

## Xem thêm

- [Cấu hình](/docs/getting-started/configuration) — tài liệu tham khảo cấu hình đầy đủ bao gồm thiết lập ngôn ngữ
- [Phương thức dịch](/docs/guides/translation-methods) — cách hoạt động của từng phương thức
- [Trình chuyển đổi chữ viết](/docs/concepts/script-converters) — pipeline chuyển đổi chữ viết tất định
- [Ngôn ngữ nhân tạo, Chữ viết & Chính tả](/docs/guides/conlangs-scripts-orthography) — font PUA, Unicode, cách thêm ngôn ngữ nhân tạo
- [Hỗ trợ ngôn ngữ ít tài nguyên](/docs/guides/low-resource-languages) — xây dựng phương thức cho các ngôn ngữ chưa được hỗ trợ đầy đủ