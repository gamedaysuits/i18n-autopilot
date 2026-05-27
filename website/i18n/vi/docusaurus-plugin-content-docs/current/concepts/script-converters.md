---
sidebar_position: 6
title: "Trình chuyển đổi Script"
---
# Script Converters

Script converters là các hook hậu dịch thuật (post-translation hooks) mang tính tất định, không sử dụng LLM, giúp chuyển đổi văn bản từ một hệ thống chữ viết này sang một hệ thống chữ viết khác. Chúng cho phép quy trình làm việc "dịch một lần, hiển thị bằng nhiều chữ viết" — bạn dịch sang một chữ viết làm việc (thường là chữ Latinh), sau đó tự động chuyển đổi sang chữ viết hiển thị.

## Tại sao cần Script Converters?

Một số ngôn ngữ sử dụng nhiều hệ thống chữ viết cho cùng một ngôn ngữ nói:

- **Plains Cree**: SRO (Latinh) để chỉnh sửa → Syllabics (ᓀᐦᐃᔭᐍᐏᐣ) để hiển thị
- **Serbian**: Latinh cho sử dụng quốc tế → Cyrillic cho sử dụng trong nước
- **Klingon**: Romanization (Latinh hóa) để gõ phím → pIqaD (  ) để hiển thị

Việc dịch trực tiếp sang các chữ viết không phải Latinh gây ra nhiều vấn đề: LLM có thể bị ảo giác (hallucinate) ký tự, các tệp JSON trở nên khó kiểm soát phiên bản (version-control) và các công cụ diff không thể so sánh các thay đổi. Script converters giải quyết vấn đề này bằng cách giữ các bản dịch ở một chữ viết thân thiện với việc kiểm soát phiên bản và chuyển đổi một cách tất định tại thời điểm đồng bộ (sync time).

## Các trình chuyển đổi có sẵn

Rosetta được tích hợp sẵn năm script converters:

| Locale | Từ | Sang | Loại | Yêu cầu Font? |
|--------|------|----|------|----------------|
| `crk` | SRO (Standard Roman Orthography) | Cree Syllabics | Tất định (Deterministic) | Không — Unicode gốc |
| `sr` | Latinh | Cyrillic | Tất định (Deterministic) | Không — Unicode gốc |
| `tlh` | Romanization | pIqaD | Tất định (Deterministic) | Có — PUA U+F8D0–F8FF |
| `x-elvish-s` | Latinh | Tengwar (Mode of Beleriand) | Tất định (Deterministic) | Có — PUA U+E000–E07F |
| `x-kryptonian` | Latinh | Kryptonian | Mật mã dựa trên font (Font-based cipher) | Có — PUA U+E100–E119 |

### Tất định (Deterministic) so với Dựa trên Font (Font-Based)

- **Deterministic converters** (Cree, Serbian, Klingon, Tengwar) thực hiện ánh xạ ký tự-sang-ký tự thực sự bằng cách sử dụng các quy tắc ngôn ngữ học. Đầu ra chứa các ký tự Unicode thực tế.
- **Font-based converters** (Kryptonian) là các mật mã thay thế 1:1, trong đó đầu ra là các ký tự Unicode PUA chỉ hiển thị chính xác khi một font chữ cụ thể được tải.

## Cách thức hoạt động

Script converters chạy **sau** quá trình dịch thuật như một bước hậu xử lý (post-processing). Quy trình (pipeline) như sau:

```
Source (English) → LLM Translation → Working Script → Script Converter → Display Script
```

Ví dụ, với Plains Cree:
```
"Welcome" → LLM → "tānisi" (SRO) → Converter → "ᑖᓂᓯ" (Syllabics)
```

### Khớp tham lam từ trái sang phải (Greedy Left-to-Right Matching)

Tất cả các trình chuyển đổi đều sử dụng chung một thuật toán: tại mỗi vị trí ký tự, thử khớp với chuỗi dài nhất có thể trước, sau đó là các chuỗi ngắn dần. Các ký tự không khớp với bất kỳ mẫu nào (khoảng trắng, dấu câu, số) sẽ được giữ nguyên.

Điều này xử lý chính xác các chữ ghép đôi (digraphs) và chữ ghép ba (trigraphs):
- Klingon: `tlh` → một ký tự pIqaD duy nhất (không phải `t` + `l` + `h`)
- Serbian: `nj` → `њ` (không phải `н` + `ј`)
- Cree: `twê` → một âm tiết duy nhất (không phải `t` + `w` + `ê`)

## Sử dụng Script Converters

Script converters tự động kích hoạt khi mã locale khớp với một trình chuyển đổi đã đăng ký. Không cần cấu hình — bạn chỉ cần thiết lập locale mục tiêu:

```json title="i18n-rosetta.config.json"
{
  "pairs": {
    "en:crk": {
      "method": "llm-coached",
      "model": "google/gemini-2.5-pro"
    }
  }
}
```

Khi rosetta đồng bộ cặp `en:crk`, các bản dịch trước tiên được tạo ra bằng SRO, sau đó tự động chuyển đổi sang Syllabics trước khi ghi vào `crk.json`.

### Kiểm tra trạng thái Converter

```bash
npx i18n-rosetta status
```

Đầu ra trạng thái hiển thị các cặp nào có script converters đang hoạt động và quá trình chuyển đổi mà chúng thực hiện.

## Yêu cầu về Web Font

Ba trình chuyển đổi xuất ra các ký tự Unicode Private Use Area (PUA) yêu cầu các web font tùy chỉnh:

### Klingon (pIqaD)

Cài đặt một font pIqaD tương thích với CSUR (ví dụ: "pIqaD qolqoS" hoặc "Klingon pIqaD HaSta"):

```css
@font-face {
  font-family: 'pIqaD';
  src: url('/fonts/pIqaD.woff2') format('woff2');
  unicode-range: U+F8D0-F8FF;
}

:lang(tlh) {
  font-family: 'pIqaD', sans-serif;
}
```

### Tengwar (Sindarin)

Cài đặt một font Tengwar tương thích với CSUR (ví dụ: "Tengwar Formal CSUR", "Tengwar Annatar"):

```css
@font-face {
  font-family: 'Tengwar';
  src: url('/fonts/tengwar-formal-csur.woff2') format('woff2');
  unicode-range: U+E000-E07F;
}

:lang(x-elvish-s) {
  font-family: 'Tengwar', serif;
}
```

### Kryptonian

Cài đặt một font Kryptonian được ánh xạ tới các codepoint PUA U+E100–E119:

```css
@font-face {
  font-family: 'Kryptonian';
  src: url('/fonts/kryptonian.woff2') format('woff2');
  unicode-range: U+E100-E119;
}

:lang(x-kryptonian) {
  font-family: 'Kryptonian', sans-serif;
}
```

:::tip Cách tiếp cận thay thế cho Kryptonian
Vì Kryptonian là một mật mã A-Z thuần túy, bạn có thể bỏ qua hoàn toàn script converter và áp dụng font chữ cho văn bản Latinh thông qua CSS. Cách này thường đơn giản hơn cho các triển khai web — chỉ cần cung cấp font Kryptonian và thiết lập `font-family` trên các phần tử liên quan.
:::

## Thêm một Custom Converter

Để thêm một trình chuyển đổi cho một ngôn ngữ mới, hãy chỉnh sửa `lib/scripts.js`:

1. **Tạo bản đồ chuyển đổi (conversion map)** — một mảng có thứ tự của các cặp `[from, to]`, các chuỗi dài nhất xếp trước
2. **Tạo hàm chuyển đổi (converter function)** — một bộ quét tham lam từ trái sang phải (sử dụng `sroToSyllabics` làm mẫu)
3. **Đăng ký nó** trong đối tượng `SCRIPT_CONVERTERS` với mã locale làm khóa (key)
4. **Thêm trường `script`** vào mục đăng ký của ngôn ngữ trong `registers.js`

```javascript
// Example: adding a converter for Cherokee (chr)
const LATIN_TO_CHEROKEE_MAP = [
  ['ga', 'Ꭶ'], ['ka', 'Ꭷ'], ['ge', 'Ꭸ'], // ...
];

function latinToCherokee(text) {
  // Same greedy left-to-right pattern as other converters
}

SCRIPT_CONVERTERS['chr'] = {
  from: 'Latin',
  to: 'Cherokee Syllabary',
  type: 'deterministic',
  converter: latinToCherokee,
};
```

---

## Xem thêm

- [Conlangs, Chữ viết & Chính tả](/docs/guides/conlangs-scripts-orthography) — Font PUA, Unicode, thêm các trình chuyển đổi mới
- [Quality Gate](/docs/concepts/quality-gate) — xác thực chạy trước khi chuyển đổi chữ viết
- [Ngôn ngữ được hỗ trợ](/docs/reference/supported-languages) — những ngôn ngữ nào có script converters
- [Hỗ trợ Ngôn ngữ ít tài nguyên](https://mtevalarena.org/docs/community/low-resource-languages) — SRO→Syllabics trong ngữ cảnh
- [Cookbook: FST-Gated Pipeline](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — chuyển đổi chữ viết trong một quy trình nhiều giai đoạn