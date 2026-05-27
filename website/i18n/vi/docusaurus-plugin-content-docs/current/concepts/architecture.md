---
sidebar_position: 1
title: "Kiến trúc"
---
# Kiến trúc

Hệ sinh thái dịch thuật Rosetta bao gồm ba công cụ độc lập hoạt động cùng nhau thông qua các hợp đồng được xác định rõ ràng. Không có công cụ nào phụ thuộc vào nhau tại thời điểm build (build time). Chúng giao tiếp thông qua một **định dạng plugin phương thức** chung và một **hợp đồng REST API**.

## Ba thành phần

```mermaid
graph TB
    subgraph Research["Eval Harness (Research)"]
        H["gds-mt-eval-harness\nPython / standalone"]
    end
    subgraph Production["i18n-rosetta (Developer Tool)"]
        R["i18n-rosetta\nNode.js / npm\nZero dependencies"]
    end
    subgraph Service["Rosetta Translate (Planned)"]
        T["Metered API service\nHosts IP-protected methods"]
    end
    H -->|"method.json\n+ coaching data"| R
    T -->|"REST API\nPOST /v1/translate"| R
    H -->|"Deploy methods"| T
```

### i18n-rosetta (dự án này)

Công cụ dành cho nhà phát triển mã nguồn mở. Dịch các tệp ngôn ngữ (locale) bằng cách sử dụng các phương thức có thể cắm (pluggable). Không có dependency, tùy chọn cấu hình, sẵn sàng sử dụng ngay.

**Các phương thức tích hợp sẵn:**
- `llm` → OpenRouter / bất kỳ LLM nào (hơn 200 mô hình)
- `llm-coached` → LLM + hướng dẫn ngữ pháp/từ điển
- `openai` → OpenAI API trực tiếp (GPT-4o, GPT-4o-mini)
- `anthropic` → Anthropic API trực tiếp (Claude Sonnet, Haiku, Opus)
- `gemini` → Google Gemini API trực tiếp (Flash, Pro — có gói miễn phí)
- `google-translate` → Google Cloud Translation API v2
- `deepl` → DeepL API có hỗ trợ bảng thuật ngữ (glossary)
- `microsoft-translator` → Azure Cognitive Services Translator
- `libretranslate` → LibreTranslate tự lưu trữ (AGPL, miễn phí)
- `api` → Đường ống mỏng (thin pipe) đến bất kỳ REST endpoint từ xa nào

### Eval Harness (dự án đồng hành)

Một công cụ nghiên cứu để phát triển, thử nghiệm và đánh giá chuẩn (benchmarking) các phương thức dịch thuật. Khi một phương thức đạt đến chất lượng có thể chấp nhận được, harness sẽ xuất ra một **plugin phương thức** — một tệp manifest `method.json` và các tệp dữ liệu hướng dẫn tùy chọn.

Harness không bao giờ chạy bên trong rosetta. Nó là một công cụ riêng biệt tạo ra đầu ra tĩnh (các tệp JSON). Rosetta chỉ đọc các tệp đó.

[→ Eval Harness trên GitHub](https://github.com/gamedaysuits/gds-mt-eval-harness)

### Rosetta Translate (dự kiến)

Một dịch vụ API tính phí theo mức sử dụng, lưu trữ các phương thức dịch thuật độc quyền ở phía máy chủ — các prompt, dữ liệu hướng dẫn và pipeline ngôn ngữ không bao giờ rời khỏi máy chủ.

## Cách chúng kết nối

### Eval Harness → i18n-rosetta (xuất một chiều)

```mermaid
flowchart LR
    A["Run benchmarks"] --> B["Export method.json"]
    B --> C["rosetta plugin install"]
    C --> D["Plugin saved to\n.rosetta/methods/"]
    D --> E["rosetta sync"]
```

**Hợp đồng**: [Đặc tả Plugin](/docs/reference/plugin-spec)

### Rosetta Translate → i18n-rosetta (API tại runtime)

```mermaid
flowchart LR
    A["rosetta sync"] --> B["APIMethod.translate()"]
    B --> C["POST /v1/translate"]
    C --> D["Server loads coaching data"]
    D --> E["Server calls LLM"]
    E --> F["Returns translations"]
```

`APIMethod` của Rosetta là một **đường ống thụ động (dumb pipe)**. Nó gửi các key đi và nhận lại các bản dịch. Nó không chứa logic dịch thuật và không có nội dung độc quyền nào.

## Những gì mỗi thành phần biết về các thành phần khác

| Công cụ | Biết về rosetta? | Biết về Rosetta Translate? | Biết về harness? |
|------|---------------------|-------------------------------|---------------------|
| **i18n-rosetta** | *(là rosetta)* | Có — phương thức `api` gọi nó | Không — chỉ đọc các bản xuất plugin |
| **Rosetta Translate** | Có — phục vụ các yêu cầu của nó | *(là Rosetta Translate)* | Không — nhận các phương thức đã triển khai |
| **Eval Harness** | Có — xuất định dạng plugin | Không — các phương thức được triển khai riêng biệt | *(là harness)* |

## Kịch bản người dùng

### Kịch bản 1: Miễn phí, không cần cấu hình (hầu hết người dùng)

```bash
export OPENROUTER_API_KEY=sk-...
npx i18n-rosetta sync
```

Sử dụng phương thức `llm` tích hợp sẵn. Không có plugin, không có Rosetta Translate, không có harness.

### Kịch bản 2: Cơ sở Google Translate

```bash
export GOOGLE_TRANSLATE_API_KEY=AIza...
npx i18n-rosetta sync
```

Sử dụng phương thức `google-translate` tích hợp sẵn. Không cần plugin.

### Kịch bản 3: Plugin mở với hướng dẫn đi kèm

```bash
rosetta plugin install ./french-formal-v1/
rosetta sync
```

Plugin có `type: "llm-coached"` → rosetta sử dụng khóa OpenRouter của riêng người dùng. Dữ liệu hướng dẫn nằm ở cục bộ (không gọi máy chủ).

### Kịch bản 4: Tự làm hướng dẫn (không plugin, không harness)

```json title="i18n-rosetta.config.json"
{
  "pairs": {
    "en:fr": { "method": "llm-coached" }
  }
}
```

Người dùng tự duy trì các quy tắc ngữ pháp và từ điển của riêng họ trong `.rosetta/coaching/fr.json`.

## Thẻ ngôn ngữ (Language Cards)

Mỗi ngôn ngữ trong rosetta được cấu hình thông qua một **Thẻ ngôn ngữ (Language Card)** — một tệp JSON chứa các preset về văn phong (register), quy tắc về độ trang trọng, cờ hỗ trợ phương thức và các quy ước về kiểu chữ (typography). Thẻ ngôn ngữ là cấu hình riêng cho từng ngôn ngữ giúp điều khiển quá trình dịch thuật theo văn phong.

```mermaid
graph LR
    subgraph Cards["Language Cards (lib/data/)"]
        RT["Runtime Tier<br/>language-cards/*.json<br/>~2 KB each"]
        RF["Reference Tier<br/>language-reference/*.json<br/>~3 KB each"]
    end
    RT -->|"Eager load at import"| R["i18n-rosetta<br/>translate()"]
    RF -->|"Lazy load on demand"| W["Website / Harness<br/>getLanguageReference()"]
```

Các thẻ được chia thành hai tầng để đảm bảo hiệu suất ở quy mô lớn (nhắm mục tiêu hơn 700 ngôn ngữ):

- **Tầng runtime** (`language-cards/`): Được tải ngay lập tức (loaded eagerly) — các trường mà công cụ dịch thuật cần (văn phong, độ trang trọng, hỗ trợ phương thức, quy tắc kiểu chữ).
- **Tầng tham chiếu** (`language-reference/`): Được tải theo yêu cầu (loaded lazily) — tài liệu dành cho nhà phát triển (các thách thức ngôn ngữ học, ngữ hệ, tài nguyên NLP).

Cả hai tầng đều được tạo ra từ các nguồn có thẩm quyền (IANA, CLDR, Glottolog) bằng cách sử dụng `scripts/generate-language-card.mjs`, sau đó được con người tinh chỉnh để đảm bảo độ chính xác về mặt ngôn ngữ.

## Nguyên tắc thiết kế

1. **Không có dependency vòng (circular dependencies).** Các cầu nối đều là một chiều.
2. **Rosetta là lõi gọn nhẹ.** Không có dependency, tùy chọn cấu hình. Các plugin và API là phần bổ sung.
3. **Bảo vệ sở hữu trí tuệ (IP) mang tính kiến trúc.** Các kỹ thuật độc quyền được giữ ở phía máy chủ. Gói npm không chứa bất kỳ thứ gì độc quyền.
4. **Định dạng plugin là hợp đồng.** Mọi thứ đều chảy qua `method.json`.
5. **Mỗi công cụ có một nhiệm vụ duy nhất.** Harness → phát triển phương thức. Rosetta Translate → lưu trữ phương thức. Rosetta → dịch tệp.

---

## Xem thêm

- [Các phương thức dịch thuật](/docs/guides/translation-methods) — cách hoạt động của từng phương thức tích hợp sẵn
- [Đặc tả Plugin](/docs/reference/plugin-spec) — định dạng manifest method.json
- [Eval Harness](https://mtevalarena.org/docs/specifications/harness) — công cụ nghiên cứu đồng hành
- [Phục vụ một phương thức qua API](/docs/guides/serving-a-method) — lưu trữ các pipeline dịch thuật tùy chỉnh
- [Hỗ trợ ngôn ngữ có tài nguyên thấp](https://mtevalarena.org/docs/community/low-resource-languages) — trường hợp sử dụng đã thúc đẩy kiến trúc này