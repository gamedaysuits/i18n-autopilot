---
sidebar_position: 5
title: "Hỗ trợ ngôn ngữ thiếu tài nguyên"
---
# Hỗ trợ Ngôn ngữ Ít tài nguyên

:::info Trạng thái: Đang được Phát triển Tích cực
Hỗ trợ cho tiếng Plains Cree (nêhiyawêwin) hiện đang được phát triển. Các công cụ, bộ khung đánh giá (evaluation harness) và bảng xếp hạng (leaderboard) được mô tả ở đây là có thật và có thể sử dụng ngay hôm nay, nhưng pipeline dịch thuật tiếng Cree vẫn chưa được phát hành. Khi được phát hành, đây sẽ đóng vai trò là bản thiết kế (blueprint) cho các ngôn ngữ đa tổng hợp (polysynthetic) và ít tài nguyên khác có hạ tầng FST.
:::

## Vấn đề Chưa được Giải quyết

Google Translate hỗ trợ khoảng 130 ngôn ngữ. Có hơn 7.000 ngôn ngữ được nói trên Trái Đất. Đối với hàng ngàn ngôn ngữ — bao gồm nhiều ngôn ngữ Bản địa với các cộng đồng người nói đang hoạt động — không có API dịch thuật thương mại nào tồn tại, không có ngữ liệu song song (parallel corpus) lớn nào được thu thập và không có mô hình tiền huấn luyện (pretrained model) nào tạo ra đầu ra đáng tin cậy.

Đây không phải là một khoảng trống sẽ tự động được thu hẹp. Các ngôn ngữ ít tài nguyên bị thiếu tài nguyên *bởi vì* tính kinh tế của dịch máy (MT) thương mại không tiếp cận được chúng. Những người nói cần các công cụ này nhất lại chính là những cộng đồng ít có khả năng được xây dựng công cụ cho họ nhất.

**rosetta được xây dựng để thay đổi điều đó.**

[Method Leaderboard](/leaderboard) là một thử thách mở: hãy xây dựng phương pháp dịch thuật tốt nhất cho một ngôn ngữ chưa được phục vụ đầy đủ, chứng minh nó bằng các đánh giá có thể tái tạo (reproducible evaluation) và giành lấy điểm số cao nhất. Bất kỳ ai trên thế giới đều có thể đóng góp — các nhà ngôn ngữ học, nhà nghiên cứu ML, nhân viên ngôn ngữ cộng đồng, sinh viên, người có sở thích. Vấn đề vẫn chưa được giải quyết. Cơ sở hạ tầng đã có sẵn. Bảng xếp hạng đang chờ đợi bạn.

---

## Tại sao Điều này lại Khó: Hình thái học Đa tổng hợp (Polysynthetic Morphology)

Hầu hết các hệ thống MT thương mại được thiết kế cho các ngôn ngữ như tiếng Anh, tiếng Pháp và tiếng Trung — những ngôn ngữ mà các từ tương đối ngắn và câu được xây dựng từ các token rời rạc. Nhưng nhiều ngôn ngữ Bản địa, bao gồm cả tiếng Plains Cree, là ngôn ngữ **đa tổng hợp (polysynthetic)**: một từ duy nhất có thể mã hóa những gì tiếng Anh diễn đạt bằng cả một câu.

### Ví dụ về tiếng Cree

Hãy xem xét từ tiếng Plains Cree sau:

> **ê-kî-nitawi-kîskinwahamâkosiyân**
> *"khi tôi đi học"*

Đó là **một từ**. Nó mã hóa thì (quá khứ), hướng (đi đến), gốc từ (học), thể (bị động/phản thân) và ngôi (ngôi thứ nhất số ít). Một LLM được huấn luyện chủ yếu bằng tiếng Anh không có trực giác về loại mật độ hình thái học này.

Các thách thức chồng chất:

| Thách thức | Ý nghĩa |
|-----------|--------------|
| **Độ phức tạp hình thái học** | Một gốc động từ duy nhất có thể tạo ra hàng ngàn dạng biến tố (inflected forms) hợp lệ thông qua tiền tố, hậu tố và chu vi tố (circumfixation) |
| **Sự phân biệt động vật/bất động vật (Animate/inanimate)** | Danh từ về mặt ngữ pháp là động vật hoặc bất động vật — điều này ảnh hưởng đến cách chia động từ, đại từ chỉ định và cách tạo số nhiều. Việc phân loại không phải lúc nào cũng tuân theo tính động vật sinh học (*askiy* "trái đất" là động vật; *maskisin* "chiếc giày" cũng là động vật) |
| **Sự chuyển hướng (Obviation)** | Các tham chiếu ngôi thứ ba được xếp hạng theo mức độ gần gũi/nổi bật. Sự phân biệt "proximate" (gần) và "obviative" (xa) không có khái niệm tương đương trong tiếng Anh |
| **Dữ liệu huấn luyện thưa thớt** | Các LLM đã thấy rất ít văn bản tiếng Plains Cree. Những gì chúng thấy có thể bị trộn lẫn giữa các phương ngữ (phương ngữ Y, phương ngữ TH) hoặc các hệ thống chính tả (SRO so với syllabics) |
| **Không có cơ sở (baseline) thương mại** | Google Translate không trả về kết quả nào hữu ích. Không có API có sẵn nào để so sánh |

Đó là lý do tại sao việc dịch các ngôn ngữ đa tổng hợp vẫn là một **bài toán nghiên cứu mở** — và tại sao một bảng xếp hạng có chấm điểm, có thể tái tạo lại quan trọng.

---

## Các Nghiên cứu Trước đây: Cách Mọi người Tiếp cận Vấn đề Này

### ALTLab FST

Tài nguyên tính toán quan trọng nhất đối với tiếng Plains Cree là **finite-state transducer (FST)** được phát triển bởi [Alberta Language Technology Lab (ALTLab)](https://altlab.artsrn.ualberta.ca/) tại Đại học Alberta, hợp tác với [Giellatekno](https://giellatekno.uit.no/) tại UiT Đại học Bắc Cực của Na Uy.

ALTLab FST là một **bộ phân tích và tạo hình thái học**: khi nhận một từ tiếng Cree đã biến tố, nó có thể phân tách từ đó thành gốc từ và các thẻ ngữ pháp, và khi nhận một gốc từ cộng với các thẻ, nó có thể tạo ra dạng biến tố chính xác. Quá trình này mang tính tất định (deterministic) — không có mạng nơ-ron, không có ảo giác (hallucination), không có xác suất. Nếu FST chấp nhận một từ, từ đó hợp lệ về mặt hình thái học.

Đó là lý do tại sao bảng xếp hạng rosetta theo dõi **Tỷ lệ Chấp nhận của FST (FST Acceptance Rate)** như một số liệu đo lường. Một phương pháp dịch thuật tạo ra các từ bị FST từ chối tức là đang tạo ra tiếng Cree không hợp lệ về mặt hình thái — bất kể điểm số chrF++ là bao nhiêu.

**Các tài nguyên chính của ALTLab:**
- [itwêwina](https://itwewina.altlab.app/) — từ điển thông minh tiếng Plains Cree–Anh được hỗ trợ bởi FST
- [Morphodict](https://github.com/UAlbertaALTLab/morphodict) — nền tảng từ điển nhận thức hình thái học mã nguồn mở
- [crk-db](https://github.com/UAlbertaALTLab/crk-db) — cơ sở dữ liệu từ vựng tiếng Plains Cree
- [21st Century Tools for Indigenous Languages](https://21c.tools/) — bối cảnh dự án rộng lớn hơn

### Các Cơ sở Dữ liệu Hình thái học & FST Toàn cầu

Plains Cree không phải là ngôn ngữ duy nhất có hạ tầng FST chất lượng cao. Nếu bạn muốn phát triển các pipeline dịch thuật cho các ngôn ngữ ít tài nguyên hoặc phức tạp về hình thái khác, bạn có thể tận dụng các trung tâm toàn cầu đã được thiết lập này:

* **[GiellaLT / Giellatekno](https://giellalt.github.io/) (UiT Đại học Bắc Cực của Na Uy):** Kho lưu trữ lớn nhất về các bộ phân tích và tạo hình thái học FST mã nguồn mở, bao phủ hơn 100 ngôn ngữ. Các lĩnh vực trọng tâm bao gồm các ngôn ngữ Sámi (`sme`, `smj`, `sma`, v.v.), các ngôn ngữ Uralic (Komi, Erzya, Udmurt, v.v.) và các ngôn ngữ thiểu số/bản địa khác. Họ lưu trữ các kho ngữ liệu văn bản đã xử lý công khai (`corpus-xxx`) trong [GitHub Organization](https://github.com/giellalt/) của họ.
* **[The Apertium Project](https://www.apertium.org/):** Nền tảng dịch máy dựa trên quy tắc mã nguồn mở. Apertium duy trì các bộ phân tích hình thái học FST được tối ưu hóa cao (sử dụng `lttoolbox` và `hfst`) cùng từ điển song ngữ cho hàng chục ngôn ngữ, bao gồm một bộ lớn các ngôn ngữ Turkic (Kazakh, Tatar, Kyrgyz, v.v.) và các ngôn ngữ thiểu số ở Châu Âu. Tất cả tài nguyên đều công khai trên [GitHub của Apertium](https://github.com/apertium).
* **[UniMorph (Universal Morphology)](https://unimorph.github.io/):** Một dự án hợp tác cung cấp các hệ biến hóa hình thái học tiêu chuẩn hóa cho hơn 150 ngôn ngữ. Tập dữ liệu được lưu trữ trên Hugging Face tại [unimorph/universal_morphologies](https://huggingface.co/datasets/unimorph/universal_morphologies). Nếu một tệp nhị phân FST đã biên dịch không có sẵn cho một ngôn ngữ, các bảng UniMorph có thể được sử dụng như một cổng tra cứu cơ sở dữ liệu tĩnh.
* **[National Research Council Canada (NRC)](https://nrc-digital-repository.canada.ca/):** Cung cấp các công cụ cho các ngôn ngữ Bản địa Canada, bao gồm bộ phân tích hình thái học FST tiếng Inuktitut **Uqailaut** và **Nunavut Hansard Parallel Corpus** khổng lồ (1,3 triệu cặp câu tiếng Anh-Inuktitut được căn chỉnh).

### Ngữ liệu EdTeKLA

[Nhóm nghiên cứu EdTeKLA](https://spaces.facsci.ualberta.ca/edtekla/) (cũng tại UAlberta) đã thu thập một kho ngữ liệu tiếng Plains Cree từ các tài liệu giáo dục, bản chép lời âm thanh và các nguồn cộng đồng. Tập dữ liệu đánh giá rosetta [EDTeKLA Dev v1](/docs/eval/datasets) được bắt nguồn từ công trình này, cấp phép theo [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).

### Các phương pháp khác mà mọi người đã thử hoặc có thể thử

Bảng xếp hạng không phụ thuộc vào phương pháp (method-agnostic). Dưới đây là các chiến lược đã được khám phá hoặc đề xuất cho MT ít tài nguyên, bất kỳ chiến lược nào trong số này đều có thể được gửi lên:

| Phương pháp | Cách hoạt động | Ưu điểm | Nhược điểm |
|----------|-------------|------|------|
| **Coached LLM prompting** | Tiêm các quy tắc ngữ pháp, từ điển và các cặp ví dụ vào system prompt | Lặp lại nhanh chóng, không cần huấn luyện | Giới hạn chất lượng bị phụ thuộc vào kiến thức cơ sở của LLM |
| **Few-shot prompting** | Bao gồm các bản dịch đã được xác minh làm ví dụ trong ngữ cảnh (in-context) | Tốt cho văn phong nhất quán | Cửa sổ ngữ cảnh nhỏ; các ví dụ KHÔNG ĐƯỢC lấy từ dữ liệu đánh giá |
| **FST-gated pipeline** | LLM tạo ra → FST xác thực → từ chối và thử lại hình thái không hợp lệ | Đảm bảo tính hợp lệ về mặt hình thái học | Yêu cầu hạ tầng FST; các vòng lặp thử lại làm tăng độ trễ và chi phí |
| **Tra cứu từ điển + LLM** | Bắt buộc sử dụng các thuật ngữ đã biết từ từ điển song ngữ, để LLM xử lý phần còn lại | Giảm thiểu ảo giác đối với các thuật ngữ đã biết | Độ bao phủ của từ điển luôn không đầy đủ |
| **Mô hình Fine-tune** | Tinh chỉnh một mô hình mở (Llama, Mistral) trên văn bản song song — chỉ là không trên dữ liệu đánh giá | Tiềm năng chất lượng cao nhất | Yêu cầu ngữ liệu song song (khan hiếm); tốn kém; rủi ro quá khớp (overfitting) |
| **Các mô hình chuỗi (Chained models)** | Mô hình A tạo bản dịch thô → Mô hình B hậu kiểm (post-edit) → Mô hình C chấm điểm | Có thể kết hợp thế mạnh của các chuyên gia | Phức tạp; chậm; tốn kém |
| **Lai ghép Rule-based + LLM** | Sử dụng các quy tắc ngôn ngữ cho các mẫu đã biết, LLM cho mọi thứ khác | Chính xác ở những nơi áp dụng quy tắc | Yêu cầu chuyên môn sâu về ngôn ngữ học |
| **Tăng cường dịch ngược (Back-translation augmentation)** | Tạo dữ liệu song song tổng hợp bằng cách dịch Cree→Anh, sau đó huấn luyện theo chiều ngược lại | Mở rộng dữ liệu huấn luyện với chi phí thấp | Khuếch đại các lỗi hiện có của mô hình |
| **Phương pháp tiến hóa (Evolutionary approach)** | Tạo các bản dịch ứng viên, chấm điểm chúng, đột biến các bản dịch tốt nhất, lặp lại | Có thể khám phá các giải pháp mới; có thể song song hóa | Tốn kém về mặt tính toán; cần một hàm thích nghi (fitness function) tốt |
| **Dịch một phần (Partial translation)** | Dịch thủ công một mẫu đại diện, chứng minh phương pháp của bạn khớp với văn phong của bạn trên đó, sau đó tự động dịch phần lớn còn lại | Kết hợp chất lượng của con người với quy mô của máy móc | Yêu cầu nỗ lực ban đầu của con người |
| **Chấm điểm JSON / bài thi thủ công** | Tạo thủ công tệp JSON tập dữ liệu để kiểm tra câu trả lời của học sinh trong bài kiểm tra ngôn ngữ, hoặc chấm điểm một loạt bản dịch của con người so với tiêu chuẩn vàng | Không yêu cầu ML; hoạt động tốt cho giáo dục và QA | Không mở rộng được cho các nhu cầu dịch thuật liên tục |

### Nó chỉ là JSON

Bộ khung đánh giá nhận đầu vào là JSON và trả về điểm số dưới dạng JSON. [Định dạng tập dữ liệu](/docs/eval/datasets) rất đơn giản:

```json
{
  "entries": [
    { "index": 0, "source_text": "Hello", "target_expected": "tânisi" },
    { "index": 1, "source_text": "Thank you", "target_expected": "kinanâskomitin" }
  ]
}
```

Bạn có thể tạo tệp này bằng tay. Bạn có thể xuất nó từ một bảng tính. Bạn có thể tạo nó từ một kho ngữ liệu. Một giáo viên ngôn ngữ có thể sử dụng nó để chấm điểm các bản dịch của học sinh. Một công ty dịch thuật có thể sử dụng nó để đánh giá các freelancer. Một phòng thí nghiệm nghiên cứu có thể sử dụng nó để so sánh các kiến trúc mô hình. Bộ khung đánh giá không quan tâm JSON đến từ đâu — nó chỉ chấm điểm.

Và bởi vì framework triển khai sản xuất sử dụng cùng một giao diện plugin, một phương pháp đạt điểm cao trong bộ khung đánh giá có thể được triển khai lên trang web của bạn chỉ với một thay đổi cấu hình. **Hãy chứng minh và sử dụng nó.**

Các khả năng thực sự là vô tận. **Nếu bạn có một ý tưởng, hãy xây dựng nó, chạy bộ khung đánh giá và gửi điểm số của bạn.**

---

## Cách rosetta Phù hợp với Bức tranh này

rosetta cung cấp lớp cơ sở hạ tầng — bạn mang đến phương pháp.

### Hệ thống huấn luyện (Coaching system)

Phương pháp `llm-coached` của rosetta cho phép bạn tiêm kiến thức ngôn ngữ học trực tiếp vào LLM prompt:

```json title=".rosetta/coaching/crk.json"
{
  "grammar_rules": [
    "Plains Cree is polysynthetic — a single word can express what English needs a full sentence for",
    "Animate/inanimate noun distinction affects verb conjugation, demonstratives, and pluralization",
    "Use SRO (Standard Roman Orthography) as the working script — syllabic conversion is handled by the deterministic converter",
    "Obviation: when two third-person referents appear, the less salient one takes obviative marking (-a suffix on nouns, -iyiwa on verbs)"
  ],
  "dictionary": {
    "home": "kīwēwin",
    "settings": "isi-nākatohkēwin",
    "search": "nānātawāpahtam",
    "welcome": "tānisi",
    "dashboard": "kīskinwahamākēwin-māsinahikan"
  },
  "style_notes": "Use formal register appropriate for educational and community contexts. Preserve English technical terms in parentheses when no Cree equivalent exists or is widely accepted."
}
```

Dữ liệu huấn luyện (coaching data) được tiêm vào mọi LLM prompt cho cặp `en:crk`, cung cấp cho mô hình ngữ cảnh ngôn ngữ có cấu trúc mà bình thường nó không có. Xem [Coaching Data](/docs/concepts/coaching-data) để biết toàn bộ thông số kỹ thuật.

### Các Register (Văn phong)

Register là một phần của system prompt giúp điều hướng giọng điệu, mức độ trang trọng và các quy ước chính tả. rosetta đi kèm với một register tiếng Plains Cree:

```
nêhiyawêwin (Plains Cree). Use SRO (Standard Roman Orthography) as the working
script. Output will be converted to Syllabics via deterministic converter.
Professional register appropriate for educational and community contexts.
```

Bạn có thể ghi đè điều này trong cấu hình của mình để thử nghiệm với các chiến lược prompting khác nhau:

```json title="i18n-rosetta.config.json"
{
  "languages": {
    "crk": {
      "register": "Casual Plains Cree (Y-dialect). Use SRO. Prefer everyday vocabulary over formal or archaic terms. Address the reader directly."
    }
  }
}
```

Các register khác nhau tạo ra các văn phong dịch thuật khác nhau — và các điểm số khác nhau trên bảng xếp hạng. Mỗi lượt gửi sẽ ghi lại chính xác register và system prompt được sử dụng (dưới dạng mã băm SHA-256 trong [run card](/docs/eval/run-card)), vì vậy các thử nghiệm đều có thể tái tạo được.

### Chuyển đổi hệ thống chữ viết (Script conversion)

Tiếng Plains Cree được viết bằng hai hệ thống chữ viết: **Standard Roman Orthography (SRO)** và **Canadian Aboriginal Syllabics**. Pipeline của rosetta:

1. LLM dịch sang SRO (dựa trên chữ Latinh, thứ mà các LLM xử lý tốt hơn)
2. Cổng chất lượng (Quality gate) xác thực đầu ra SRO
3. Trình chuyển đổi tất định (Deterministic converter) biến đổi SRO → Syllabics
4. Văn bản đã chuyển đổi được ghi vào ổ đĩa

Trình chuyển đổi xử lý tất cả các dấu phụ SRO (ê, î, ô, â cho các nguyên âm dài) và ánh xạ chúng tới các ký tự syllabic chính xác. Xem [Script Converters](/docs/concepts/script-converters) để biết chi tiết kỹ thuật.

### Vòng lặp đánh giá

[Bộ khung đánh giá](/docs/eval/harness) chạy phương pháp của bạn đối chiếu với tập dữ liệu đánh giá và tạo ra một [run card](/docs/eval/run-card) có chấm điểm:

```bash
# Clone the harness
git clone https://github.com/gamedaysuits/gds-mt-eval-harness.git
cd gds-mt-eval-harness
pip install -e .

# Run a baseline experiment
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --model google/gemini-2.5-pro \
  --condition coached-v7

# Run with FST validation (if you have an FST binary)
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --fst-analyzer ./bin/crk-analyzer \
  --condition fst-gated-v1
```

Cờ `--condition` là một nhãn do bạn chọn. Nó xuất hiện trên bảng xếp hạng để mọi người có thể xem bạn đã sử dụng chiến lược prompt nào. Bộ khung đánh giá ghi lại toàn bộ system prompt trong run card, vì vậy cách tiếp cận chính xác của bạn có thể được tái tạo.

:::tip Thử nghiệm tự do, gửi kết quả tốt nhất của bạn
Bộ khung đánh giá được thiết kế để lặp lại nhanh chóng. Hãy chạy hàng chục thử nghiệm với các mô hình, dữ liệu huấn luyện, register và điều kiện khác nhau. Chỉ gửi lên bảng xếp hạng khi bạn có một kết quả mà bạn tự hào.
:::

---

## Các Nguyên tắc OCAP

rosetta được thiết kế để hỗ trợ chủ quyền dữ liệu của người Bản địa. Các [nguyên tắc OCAP](https://fnigc.ca/ocap-training/) (Quyền sở hữu, Quyền kiểm soát, Quyền truy cập, Quyền chiếm hữu) hướng dẫn cách chúng tôi tiếp cận công nghệ ngôn ngữ cho các cộng đồng Bản địa:

| Nguyên tắc | Cách rosetta hỗ trợ |
|-----------|------------------------|
| **Quyền sở hữu (Ownership)** | Các cộng đồng ngôn ngữ sở hữu dữ liệu ngôn ngữ của họ. rosetta không bao giờ tự động gửi dữ liệu về hệ thống (phone home) hoặc truyền dữ liệu đến máy chủ của chúng tôi |
| **Quyền kiểm soát (Control)** | [Phương pháp API](/docs/guides/serving-a-method) cho phép các cộng đồng tự lưu trữ pipeline dịch thuật của riêng họ — chúng tôi cung cấp giao diện, họ kiểm soát việc triển khai |
| **Quyền truy cập (Access)** | Các cộng đồng quyết định ai có thể sử dụng phương pháp của họ. API có thể được bảo vệ bằng xác thực |
| **Quyền chiếm hữu (Possession)** | Tất cả dữ liệu dịch thuật đều nằm trong hệ thống tệp của dự án của bạn. [Hệ thống xuất xứ (provenance system)](/docs/concepts/security) theo dõi nguồn gốc của mọi bản dịch |

Kiến trúc plugin có nghĩa là một cộng đồng có thể xây dựng một phương pháp kết hợp các kiến thức thiêng liêng hoặc bị hạn chế ở nội bộ, chỉ hiển thị API dịch thuật và duy trì toàn quyền kiểm soát đối với các tài nguyên ngôn ngữ của họ.

---

## Tầm nhìn: Điều gì Tiếp theo

Plains Cree là mục tiêu đầu tiên. Khi pipeline được xác thực và cộng đồng hài lòng với chất lượng, kiến trúc tương tự sẽ mở rộng sang các ngôn ngữ đa tổng hợp khác có hạ tầng FST:

- **Các ngôn ngữ Algonquian khác**: Woods Cree, Swampy Cree, Ojibwe, Blackfoot
- **Các ngôn ngữ Inuit**: Inuktitut, Inuinnaqtun (cũng sử dụng hệ thống chữ viết syllabic)
- **Các ngữ hệ khác**: bất kỳ ngôn ngữ nào có bộ phân tích FST đều có thể sử dụng pipeline FST-gated

Bảng xếp hạng được giới hạn theo cặp ngôn ngữ. Khi các tập dữ liệu đánh giá mới được đóng góp bởi các cộng đồng ngôn ngữ, các hạng mục bảng xếp hạng mới sẽ tự động mở ra.

**Đây là một lời mời mở.** Nếu bạn làm việc với một ngôn ngữ ít tài nguyên — với tư cách là một nhà nghiên cứu, một thành viên cộng đồng, một sinh viên hoặc chỉ là một người quan tâm — rosetta cung cấp cho bạn các công cụ để xây dựng một thứ gì đó thực tế, đo lường nó một cách trung thực và chia sẻ nó với thế giới. [Method Leaderboard](/leaderboard) đang chờ đợi lượt gửi của bạn.

---

## Xem thêm

- **[Method Leaderboard](/leaderboard)** — gửi điểm số của bạn và xem cách các phương pháp so sánh với nhau
- **[MT Evaluation](/docs/eval/)** — điều gì tạo nên một phương pháp tốt, điều gì khiến nó bị loại
- **[Eval Harness](/docs/eval/harness)** — cách chạy các thử nghiệm
- **[Evaluation Datasets](/docs/eval/datasets)** — EDTeKLA Dev v1 và FLORES+
- **[Coaching Data](/docs/concepts/coaching-data)** — cách cấu trúc kiến thức ngôn ngữ học cho LLM
- **[Script Converters](/docs/concepts/script-converters)** — pipeline SRO→Syllabics
- **[Serving a Method via API](/docs/guides/serving-a-method)** — lưu trữ dịch thuật do cộng đồng kiểm soát
- **[ALTLab](https://altlab.artsrn.ualberta.ca/)** — Alberta Language Technology Lab
- **[EdTeKLA](https://spaces.facsci.ualberta.ca/edtekla/)** — nhóm nghiên cứu Educational Technology, Knowledge & Language
- **[itwêwina dictionary](https://itwewina.altlab.app/)** — từ điển tiếng Plains Cree–Anh được hỗ trợ bởi FST