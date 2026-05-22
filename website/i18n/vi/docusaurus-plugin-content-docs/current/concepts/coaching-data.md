---
sidebar_position: 5
title: "Dữ liệu huấn luyện"
---
# Dữ liệu Coaching

Dữ liệu Coaching là cơ chế của rosetta để dạy các LLM về những ngôn ngữ mà chúng chưa được đào tạo. Bằng cách cung cấp các quy tắc ngữ pháp, từ điển và ghi chú về văn phong cùng với mỗi yêu cầu dịch thuật, bạn biến một LLM đa dụng thành một trình biên dịch nhận thức được ngữ cảnh cho bất kỳ ngôn ngữ nào — bao gồm cả những ngôn ngữ hiện không có hỗ trợ MT nào.

## Cách thức Hoạt động

Khi bạn thiết lập phương thức của một cặp ngôn ngữ thành `llm-coached`, rosetta sẽ tải một tệp coaching từ `.rosetta/coaching/<locale>.json` và chèn nội dung của nó vào mọi prompt của LLM như một phần của system message. LLM sẽ thấy các quy tắc ngôn ngữ của bạn cùng với yêu cầu dịch thuật, từ đó tạo ra kết quả tuân theo ngữ pháp và thuật ngữ của bạn thay vì phỏng đoán.

```
┌──────────────────────────────────────────────────────┐
│ System Message (cached across batches)               │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Base translation rules                           │ │
│ │ + Register instructions                          │ │
│ │ + Grammar rules (from coaching data)             │ │
│ │ + Dictionary entries (from coaching data)         │ │
│ │ + Style notes (from coaching data)               │ │
│ └──────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────┤
│ User Message (per batch)                             │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Keys to translate (JSON)                         │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

Vì dữ liệu coaching là một phần của system message, nó được hưởng lợi từ tính năng **prompt caching** — các nhà cung cấp như Anthropic và Google sẽ lưu trữ bộ nhớ đệm cho các tiền tố hệ thống lặp lại, do đó bạn chỉ phải trả phí cho ngữ cảnh coaching một lần cho mỗi phiên, chứ không phải một lần cho mỗi lô.

## Định dạng Tệp Coaching

Tạo một tệp JSON cho mỗi locale trong `.rosetta/coaching/`:

```json title=".rosetta/coaching/crk.json"
{
  "grammar_rules": [
    "Plains Cree is polysynthetic — a single word can express what English needs a full sentence for",
    "Animate/inanimate noun distinction affects verb conjugation",
    "Use SRO (Standard Roman Orthography) unless script converter handles conversion",
    "Verb stems are modified by prefixes and suffixes to indicate person, number, tense, and evidentiality"
  ],
  "dictionary": {
    "home": "kīwēwin",
    "settings": "isi-nākatohkēwin",
    "search": "nānātawāpahtam",
    "welcome": "tānisi",
    "submit": "ispīhci",
    "cancel": "pōni"
  },
  "style_notes": "Use formal register. Preserve English technical terms in parentheses when no Cree equivalent exists. Avoid loanwords when a descriptive Cree expression exists."
}
```

### Các trường dữ liệu

| Trường | Loại | Bắt buộc | Mô tả |
|-------|------|----------|-------------|
| `grammar_rules` | `string[]` | Không | Mảng các quy tắc ngữ pháp được chèn vào system prompt. Mỗi quy tắc nên là một chỉ thị ngắn gọn, có tính thực thi mà LLM có thể tuân theo. |
| `dictionary` | `object` | Không | Bản đồ key-value của thuật ngữ tiếng Anh → thuật ngữ ngôn ngữ đích. Được sử dụng cho từ vựng chuyên ngành mà LLM có thể không biết. |
| `style_notes` | `string` | Không | Các hướng dẫn về văn phong ở dạng tự do (register, tone, các quy ước về tính trang trọng). |

Tất cả các trường đều là tùy chọn — bạn có thể bắt đầu chỉ với một từ điển và thêm các quy tắc ngữ pháp trong quá trình tinh chỉnh.

## Hành vi Dự phòng (Fallback)

Nếu một cặp ngôn ngữ được cấu hình cho `llm-coached` nhưng không có tệp coaching nào tồn tại cho locale đó, rosetta sẽ **chuyển về phương thức `llm` tiêu chuẩn** kèm theo một cảnh báo trên console:

```
[INFO] No coaching data for "crk" at .rosetta/coaching/crk.json
       Falling back to standard LLM method. Create coaching data for better results.
```

Điều này có nghĩa là bạn có thể thiết lập `"defaultMethod": "llm-coached"` trên toàn cầu một cách an toàn — các ngôn ngữ có dữ liệu coaching sẽ sử dụng nó, và phần còn lại sẽ nhận được bản dịch LLM tiêu chuẩn mà không gặp lỗi.

## Khi nào nên sử dụng Coaching

| Kịch bản | Phương thức được Đề xuất |
|----------|-------------------|
| Ngôn ngữ Tier 1 (Tiếng Pháp, Tiếng Tây Ban Nha, Tiếng Đức) | `llm` hoặc `google-translate` — Các LLM đã biết rất rõ những ngôn ngữ này |
| Ngôn ngữ Tier 2 (Tiếng Hàn, Tiếng Thổ Nhĩ Kỳ, Tiếng Thái) | `llm` kèm theo register — Các LLM xử lý những ngôn ngữ này khá tốt khi có hướng dẫn về văn phong |
| Ngôn ngữ Tier 3 (Tiếng Plains Cree, Tiếng Yoruba, Tiếng Quechua) | `llm-coached` — Các LLM cần các quy tắc ngữ pháp và từ điển |
| Ngôn ngữ nhân tạo (Conlangs) (Tiếng Klingon, Tiếng Sindarin, Tiếng Krypton) | `llm-coached` — Các LLM có một số dữ liệu đào tạo nhưng cần được hiệu chỉnh |

## Xây dựng Dữ liệu Coaching Chất lượng

### Các quy tắc Ngữ pháp

Hãy viết các quy tắc dưới dạng **chỉ thị**, không phải là mô tả. LLM tuân theo các chỉ thị tốt hơn là diễn giải lý thuyết ngôn ngữ học.

```json
// ❌ Descriptive (the LLM learns nothing actionable)
"Plains Cree has animate and inanimate noun classes"

// ✅ Instructive (the LLM knows what to do)
"When translating nouns, check whether the Cree equivalent is animate (NA) or inanimate (NI) — this affects which verb conjugation to use"
```

### Từ điển

Tập trung vào **các thuật ngữ chuyên ngành** mà LLM có thể dịch sai hoặc tự bịa ra. Đừng bận tâm đến những từ thông dụng mà LLM đã xử lý tốt — hãy tập trung vào các thuật ngữ dành riêng cho UI của ứng dụng của bạn.

### Ghi chú về Văn phong

Hãy cụ thể về register, tính trang trọng và các quy ước:

```json
"style_notes": "Use formal register (vous-form in French). Preserve brand names untranslated. UI labels should be imperative mood ('Save', not 'Saves'). Maximum 40 characters for button text."
```

## Kiểm thử các Bản dịch có Coaching

Sử dụng [MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness) để đánh giá chuẩn các bản dịch có coaching của bạn so với một kho ngữ liệu tham chiếu:

```bash
# Install the harness
pip install mt-eval-harness

# Run coached translations against your test corpus
mt-eval run --corpus data/crk-corpus.json --model google/gemini-2.5-pro

# Score the results
mt-eval test eval/logs/run_*.json
```

Công cụ này cung cấp cho bạn các điểm số chrF++, BLEU và exact match. Hãy tạo nhiều phiên bản tệp coaching và so sánh — các số liệu khách quan luôn tốt hơn việc đánh giá chủ quan.

## Xem thêm

- [Ngôn ngữ Ít Tài nguyên (Low-Resource Languages)](/docs/guides/low-resource-languages) — hướng dẫn toàn diện để xây dựng một pipeline dịch thuật từ đầu
- [Các Phương thức Dịch thuật (Translation Methods)](/docs/guides/translation-methods) — so sánh tất cả các phương thức hiện có
- [Xây dựng một Plugin (Build a Plugin)](/docs/tutorials/build-a-plugin) — đóng gói một phương thức có coaching thành một plugin có thể tái sử dụng