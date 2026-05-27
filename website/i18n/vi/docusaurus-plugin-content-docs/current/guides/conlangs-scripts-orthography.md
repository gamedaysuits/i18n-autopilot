---
sidebar_position: 3
title: "Ngôn ngữ nhân tạo, Chữ viết & Chính tả"
---
# Ngôn ngữ nhân tạo, Chữ viết & Chính tả

rosetta hỗ trợ tối đa cho các ngôn ngữ nhân tạo (constructed languages) thông qua các register (văn phong) của LLM và các bộ chuyển đổi chữ viết tất định (deterministic script converters). Hướng dẫn này bao gồm cách thức hoạt động của tính năng hỗ trợ ngôn ngữ nhân tạo, các phông chữ bạn cần và cách thêm ngôn ngữ của riêng bạn.

:::tip Tại sao ngôn ngữ nhân tạo lại quan trọng
Ngôn ngữ nhân tạo không chỉ là sự mới lạ — chúng vận hành trên cùng một cơ sở hạ tầng được sử dụng cho các ngôn ngữ thực tế ít được hỗ trợ. Quality gate (cổng kiểm tra chất lượng), hệ thống coaching (huấn luyện) và luồng chuyển đổi chữ viết hoạt động giống hệt nhau đối với tiếng Klingon và tiếng Plains Cree. Nếu luồng xử lý ngôn ngữ nhân tạo của bạn hoạt động tốt, thì luồng xử lý ngôn ngữ tài nguyên thấp của bạn cũng vậy.
:::

---

## Các ngôn ngữ nhân tạo được hỗ trợ

| Ngôn ngữ | Mã | Bộ chuyển đổi chữ viết | Phông chữ yêu cầu |
|----------|------|:----------------:|:-------------:|
| Klingon | `tlh` | ✅ Romanization → pIqaD | Phông chữ PUA (VD: pIqaD qolqoS) |
| Sindarin (Tiếng Elf của Tolkien) | `x-elvish-s` | ✅ Latin → Tengwar | Phông chữ CSUR PUA |
| Kryptonian | `x-kryptonian` | ✅ Latin → Kryptonian | Phông chữ PUA |
| Tiếng Anh Hải tặc | `x-pirate` | ❌ chỉ dùng register | Không |
| Tiếng Anh Shakespeare | `x-shakespeare` | ❌ chỉ dùng register | Không |
| Tiếng Yoda | `x-yoda` | ❌ chỉ dùng register | Không |

Các mã ngôn ngữ nhân tạo sử dụng tiền tố `x-` theo quy ước sử dụng riêng tư (private-use) của BCP-47, ngoại trừ tiếng Klingon (`tlh`) đã được SIL International gán mã [ISO 639-3](https://iso639-3.sil.org/code/tlh).

---

## Yêu cầu về Unicode, PUA và Phông chữ

### Vùng sử dụng riêng tư (Private Use Area)

Klingon (pIqaD), Sindarin (Tengwar) và Kryptonian sử dụng các ký tự thuộc **Vùng sử dụng riêng tư (Private Use Area - PUA)** của Unicode. PUA là dải U+E000–U+F8FF — các điểm mã (codepoints) này **không có gán tiêu chuẩn**. [ConScript Unicode Registry (CSUR)](https://www.evertype.com/standards/csur/) duy trì các ánh xạ được cộng đồng thống nhất cho các chữ viết hư cấu, nhưng chúng không phải là một phần của tiêu chuẩn Unicode.

Điều này có ý nghĩa gì trong thực tế:

- Văn bản PUA sẽ hiển thị dưới dạng **các ô trống** (□□□) nếu không được tải đúng phông chữ
- Các phông chữ khác nhau có thể ánh xạ các glyph (ký tự hình ảnh) khác nhau vào cùng một điểm mã PUA
- rosetta KHÔNG đi kèm các phông chữ PUA — bạn phải tự tải chúng
- Các phông chữ hệ thống sẽ không bao giờ hiển thị được các ký tự này

### Các dải PUA theo Chữ viết

| Chữ viết | Dải PUA | Tham chiếu CSUR |
|--------|-----------|---------------|
| Klingon (pIqaD) | U+F8D0–U+F8FF | [CSUR Klingon](https://www.evertype.com/standards/csur/klingon.html) |
| Tengwar (Tiếng Elf) | U+E000–U+E07F | [CSUR Tengwar](https://www.evertype.com/standards/csur/tengwar.html) |
| Kryptonian | Thay đổi tùy phông chữ | Không có tiêu chuẩn CSUR |

### Tải Phông chữ Web PUA

rosetta bao gồm một lệnh tích hợp sẵn để tải xuống và quản lý các phông chữ web PUA:

```bash
# See which fonts are needed for your configured languages
i18n-rosetta fonts list

# Download all needed fonts (auto-detects project type for output directory)
i18n-rosetta fonts install

# Also generate a CSS snippet with @font-face declarations
i18n-rosetta fonts install --css
```

Lệnh `fonts install` tải xuống từ các kho lưu trữ mã nguồn mở đã được xác minh:

| Phông chữ | Chữ viết | Giấy phép | Nguồn |
|------|--------|---------|--------|
| pIqaD qolqoS | Klingon | SIL Open Font License 1.1 | [GitHub](https://github.com/dadap/pIqaD-fonts) |
| FreeMonoTengwar | Tengwar | GNU GPL v3 (với ngoại lệ phông chữ) | [SourceForge](https://sourceforge.net/projects/freetengwar/) |
| *(người dùng cung cấp)* | Kryptonian | Thay đổi | Không có phông chữ PUA mã nguồn mở |

Thư mục đầu ra được tự động phát hiện từ cấu trúc dự án của bạn (Docusaurus → `static/fonts/`, Hugo → `static/fonts/`, mặc định → `public/fonts/`). Ghi đè bằng `--dir`.

Nếu bạn muốn quản lý phông chữ theo cách thủ công, hãy thêm các quy tắc `@font-face` vào CSS của bạn:

```css
@font-face {
  font-family: 'pIqaD';
  src: url('/fonts/pIqaDqolqoS.ttf') format('truetype');
  font-display: swap;
  unicode-range: U+F8D0-F8FF;
}

/* Apply to Klingon text elements */
[lang="tlh"], [data-script="piqad"] {
  font-family: 'pIqaD', sans-serif;
}
```

:::warning Hỗ trợ Unicode KHÔNG được đảm bảo
Unicode Consortium đã [từ chối rõ ràng](https://www.unicode.org/faq/private_use.html) việc mã hóa các chữ viết hư cấu vào tiêu chuẩn. Các phép gán PUA do cộng đồng duy trì và có thể xung đột giữa các bản triển khai phông chữ khác nhau. Hãy luôn chỉ định chính xác phông chữ mà dự án của bạn sử dụng và kiểm tra khả năng hiển thị trên nhiều trình duyệt.
:::

---

## Bộ chuyển đổi chữ viết

### Cách thức hoạt động

Tính năng chuyển đổi chữ viết của rosetta là một **hook hậu dịch thuật (post-translation hook)**:

1. LLM dịch văn bản sang một **chữ viết làm việc (working script)** (thường là Latin hoặc SRO)
2. [Quality gate](/docs/concepts/quality-gate) xác thực đầu ra
3. Bộ chuyển đổi tất định biến đổi văn bản đã xác thực thành **chữ viết hiển thị (display script)**
4. Văn bản đã chuyển đổi được ghi vào ổ đĩa

Cách tiếp cận hai bước này hiệu quả vì các LLM tạo ra đầu ra tốt hơn khi làm việc với các chữ viết hệ Latin. Bộ chuyển đổi tất định đảm bảo đầu ra chữ viết chính xác mà không cần phụ thuộc vào kiến thức về chữ viết (thường không đáng tin cậy) của mô hình.

### Cả năm bộ chuyển đổi

rosetta đi kèm với năm bộ chuyển đổi chữ viết tích hợp sẵn:

#### Plains Cree: SRO → Âm tiết (`crk`)

Từ Chính tả La tinh Tiêu chuẩn (Standard Roman Orthography) sang Chữ âm tiết của Thổ dân Canada (Canadian Aboriginal Syllabics).

```
Input:  "tawâw"
Output: "ᑕᐚᐤ"
```

Các nguyên âm dài sử dụng dấu macron/mũ: ê, î, ô, â. Bộ chuyển đổi xử lý tất cả các dấu phụ SRO và ánh xạ chúng tới các ký tự âm tiết chính xác. Xem [Hỗ trợ Ngôn ngữ Tài nguyên thấp](https://mtevalarena.org/docs/community/low-resource-languages) để biết toàn bộ luồng xử lý tiếng Cree.

#### Tiếng Serbia: Latin → Cyrillic (`sr`)

Chuyển đổi tất định từ hệ chữ Latin sang Cyrillic cho tiếng Serbia.

```
Input:  "zdravo"
Output: "здраво"
```

Bộ chuyển đổi này xử lý toàn bộ ánh xạ bảng chữ cái tiếng Serbia bao gồm cả các chữ ghép (lj → љ, nj → њ, dž → џ).

#### Klingon: Romanization → pIqaD (`tlh`)

Hệ thống Latin hóa của Marc Okrand sang các ký tự pIqaD PUA.

```
Input:  "Qapla'"    (romanized Klingon)
Output: [pIqaD PUA] (requires pIqaD font to render)
```

#### Sindarin: Latin → Tengwar (`x-elvish-s`)

Ánh xạ Tengwar chế độ Sindarin của Tolkien.

```
Input:  "elen síla"  (Latin Sindarin)
Output: [Tengwar PUA] (requires Tengwar font to render)
```

#### Kryptonian: Latin → Kryptonian (`x-kryptonian`)

Ánh xạ chữ viết Kryptonian theo từ vựng của người hâm mộ.

```
Input:  "Kal-El"
Output: [Kryptonian PUA] (requires Kryptonian font to render)
```

### Kích hoạt Bộ chuyển đổi

Thiết lập trường `scripts` trong cấu hình ngôn ngữ của bạn. Đối với các bộ chuyển đổi tích hợp sẵn, trường này được tự động phát hiện từ mã ngôn ngữ:

```json
{
  "languages": {
    "sr": { "scripts": "sr" },
    "crk": {}
  }
}
```

Plains Cree (`crk`) tự động phát hiện — bạn không cần phải thiết lập `scripts` một cách rõ ràng.

---

## Ngôn ngữ đa chữ viết

Một số ngôn ngữ thực tế sử dụng nhiều chữ viết đang hoạt động:

| Ngôn ngữ | Chữ viết | Cách tiếp cận của rosetta |
|----------|---------|-----------------|
| Tiếng Serbia | Latin + Cyrillic | Bộ chuyển đổi chữ viết (`sr`) — dịch bằng chữ Latin, chuyển đổi sang Cyrillic |
| Tiếng Trung | Giản thể + Phồn thể | Các mã locale riêng biệt (`zh` so với `zh-TW`) với các register khác nhau |

Đối với các ngôn ngữ mà cả hai chữ viết đều phục vụ cùng một đối tượng (tiếng Serbia), hãy sử dụng bộ chuyển đổi chữ viết. Đối với các ngôn ngữ mà các chữ viết phục vụ các đối tượng khác nhau (Tiếng Trung Giản thể cho Trung Quốc đại lục, Phồn thể cho Đài Loan/Hồng Kông), hãy sử dụng các mã locale riêng biệt.

---

## Ghi chú về Chính tả

Register không chỉ là giọng điệu — chúng mang **các hướng dẫn chính tả** để định hướng LLM tuân theo các quy ước viết chính xác.

### Các hình thức xưng hô trang trọng

Các register tích hợp sẵn của rosetta bao gồm cách xưng hô trang trọng phù hợp với văn hóa cho từng ngôn ngữ:

| Ngôn ngữ | Hình thức trang trọng | Hướng dẫn Register |
|----------|------------|---------------------|
| Tiếng Đức | Sie | `Use Sie-form for formal address` |
| Tiếng Pháp | vous | `Use vous-form` |
| Tiếng Nga | вы | `Professional register with вы-form` |
| Tiếng Thổ Nhĩ Kỳ | siz | `Professional register with siz-form` |
| Tiếng Hàn | 합쇼체 | `Formal Korean (합쇼체)` |
| Tiếng Nhật | です/ます | `Polite professional register (です/ます form)` |
| Tiếng Ba Lan | Pan/Pani | `Professional register with Pan/Pani form` |

### Cách viết bao hàm giới tính

Mỗi thẻ ngôn ngữ có một trường `gender.inclusiveGuidance` với lời khuyên dành riêng cho ngôn ngữ đó. Trường này được đưa vào prompt dịch thuật của LLM tách biệt với preset (cài đặt sẵn) của register, do đó nó áp dụng nhất quán bất kể người dùng chọn preset trang trọng nào:

- **Tiếng Pháp**: Écriture inclusive (viết bao hàm) với ký hiệu dấu chấm giữa (VD: "Connecté·e")
- **Tiếng Đức**: Ký hiệu Doppelpunkt (dấu hai chấm) (VD: "Benutzer:innen")
- **Tiếng Tây Ban Nha**: Ưu tiên cấu trúc lại theo hướng trung lập về giới tính; sử dụng ký hiệu dấu gạch chéo (VD: "usuario/a") như một phương án dự phòng

Đối với các ngôn ngữ không có hướng dẫn cụ thể trong thẻ của chúng (VD: tiếng Hàn, ngôn ngữ nhân tạo), hệ thống sẽ chuyển về quy tắc chung: *"ưu tiên các hình thức trung lập về giới tính hoặc tùy chọn mang tính bao hàm nhất có thể."*

### Yêu cầu về chữ viết RTL (Phải sang Trái)

Các register của tiếng Ả Rập, tiếng Do Thái, tiếng Ba Tư và tiếng Urdu đều lưu ý các yêu cầu viết từ phải sang trái: `Ensure text reads naturally in RTL layout contexts.`

### Ghi đè bất kỳ Register nào

Mỗi register là một giá trị cấu hình — hãy ghi đè nó để phù hợp với giọng điệu dự án của bạn:

```json
{
  "languages": {
    "fr": {
      "register": "Casual French. Use tu-form. Conversational blog tone. Gender-neutral when possible."
    },
    "de": {
      "register": "Informal German. Use du-form. Tech startup voice."
    }
  }
}
```

Xem [Cấu hình](/docs/getting-started/configuration) để biết toàn bộ tham chiếu cấu hình.

---

## Thêm một Ngôn ngữ nhân tạo mới

### Từng bước thực hiện

1. **Chọn một mã sử dụng riêng tư BCP-47**: Sử dụng tiền tố `x-` (VD: `x-dothraki`, `x-valyrian`).

2. **Thêm vào cấu hình của bạn**:

```json
{
  "languages": {
    "x-dothraki": {
      "register": "Dothraki language. Use David J. Peterson's vocabulary from the Living Language Dothraki textbook. Harsh, direct tone. No articles, no verb 'to be'."
    }
  }
}
```

3. **(Tùy chọn) Thêm một bộ chuyển đổi chữ viết**: Nếu ngôn ngữ nhân tạo của bạn sử dụng chữ viết hiển thị không phải hệ Latin, hãy thêm một bộ chuyển đổi trong `lib/scripts.js` và đăng ký nó trong `SCRIPT_CONVERTERS`.

4. **Kiểm tra**: Chạy `i18n-rosetta sync --dry` để xem trước các bản dịch mà không ghi ra tệp.

5. **Kiểm tra quality gate**: [Quality gate](/docs/concepts/quality-gate) có thể cần được tinh chỉnh cho ngôn ngữ nhân tạo của bạn — đặc biệt là bước kiểm tra `requireNonLatin` nếu ngôn ngữ nhân tạo của bạn sử dụng các ký tự PUA.

:::note Chất lượng ngôn ngữ nhân tạo phụ thuộc vào kiến thức của LLM
LLM chỉ có thể dịch sang một ngôn ngữ nhân tạo mà nó đã thấy trong dữ liệu huấn luyện. Các ngôn ngữ nhân tạo được ghi chép đầy đủ (Klingon, Sindarin, Dothraki) sẽ hoạt động tốt. Các ngôn ngữ nhân tạo ít người biết hoặc mới được phát minh có thể tạo ra kết quả không nhất quán. Hãy sử dụng [dữ liệu huấn luyện (coaching data)](/docs/concepts/coaching-data) để cải thiện chất lượng.
:::

---

## Xem thêm

- [Các ngôn ngữ được hỗ trợ](/docs/reference/supported-languages) — bảng ngôn ngữ đầy đủ với các phương pháp khả dụng
- [Bộ chuyển đổi chữ viết](/docs/concepts/script-converters) — chi tiết kỹ thuật của luồng chuyển đổi
- [Phương pháp dịch thuật](/docs/guides/translation-methods) — cách thức hoạt động của từng phương pháp dịch
- [Cấu hình](/docs/getting-started/configuration) — tham chiếu cấu hình bao gồm thiết lập ngôn ngữ và register
- [Hỗ trợ Ngôn ngữ Tài nguyên thấp](https://mtevalarena.org/docs/community/low-resource-languages) — cùng một cơ sở hạ tầng được áp dụng cho các ngôn ngữ thực tế ít được hỗ trợ