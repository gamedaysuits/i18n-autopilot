---
sidebar_position: 7
title: "Chủ quyền dữ liệu"
description: "Các nguyên tắc OCAP, CARE và Chủ quyền dữ liệu Māori trong dịch thuật ngôn ngữ bản địa. Tại sao cần có sự đồng thuận của cộng đồng trước khi triển khai."
---
# Chủ quyền Dữ liệu

Dịch máy cho các ngôn ngữ bản địa đặt ra những câu hỏi không tồn tại đối với tiếng Pháp hoặc tiếng Nhật. Ai sở hữu dữ liệu huấn luyện? Ai kiểm soát cách một mô hình ngôn ngữ giao tiếp? Ai quyết định xem một bản dịch đã đủ tốt để xuất bản hay chưa?

**Câu trả lời luôn là cộng đồng.**

rosetta được xây dựng để hỗ trợ điều này. Phương thức `api` giữ tất cả các tài nguyên ngôn ngữ ở phía máy chủ dưới sự kiểm soát của cộng đồng. Hệ thống plugin tách biệt phương thức khỏi công cụ. Nhưng công cụ không thể bắt buộc thực thi đạo đức — trang này giải thích các nguyên tắc bạn nên tuân theo.

---

## Các nguyên tắc OCAP®

**OCAP** (Sở hữu, Kiểm soát, Truy cập, Chiếm hữu) là một bộ nguyên tắc được phát triển bởi [First Nations Information Governance Centre](https://fnigc.ca/ocap-training/) (FNIGC) nhằm thiết lập cách thức dữ liệu của các Quốc gia Thứ nhất (First Nations) nên được thu thập, bảo vệ, sử dụng và chia sẻ.

| Nguyên tắc | Ý nghĩa đối với việc dịch thuật |
|-----------|------------------------------|
| **Sở hữu (Ownership)** | Cộng đồng sở hữu dữ liệu ngôn ngữ của mình — từ điển, ngữ pháp, văn bản song ngữ, tệp huấn luyện và bất kỳ bản dịch nào được tạo ra từ chúng. |
| **Kiểm soát (Control)** | Cộng đồng kiểm soát cách dữ liệu ngôn ngữ của họ được sử dụng, ai có quyền truy cập và những phương thức dịch thuật nào được chấp nhận. |
| **Truy cập (Access)** | Các thành viên cộng đồng có quyền truy cập và quản lý tài nguyên ngôn ngữ của chính họ bất kể chúng được lưu trữ ở đâu. |
| **Chiếm hữu (Possession)** | Dữ liệu vật lý (tệp huấn luyện, từ điển, trọng số mô hình) phải nằm trên cơ sở hạ tầng mà cộng đồng kiểm soát — không phải trên đám mây của bên thứ ba. |

### Ý nghĩa thực tiễn của OCAP

- **Không xuất bản các bản dịch** của một ngôn ngữ bản địa mà không có sự cho phép rõ ràng từ cộng đồng.
- **Không huấn luyện các mô hình** trên dữ liệu ngôn ngữ do cộng đồng cung cấp mà không có thỏa thuận chia sẻ dữ liệu.
- **Không cào (scrape)** tài nguyên ngôn ngữ của cộng đồng từ các trang web, mạng xã hội hoặc tài liệu giáo dục.
- **Sử dụng phương thức `api`** để các prompt, dữ liệu huấn luyện và từ điển được giữ lại trên các máy chủ do cộng đồng kiểm soát. Phương thức `api` của rosetta là một "đường ống thụ động" — nó gửi các key đi và nhận lại các bản dịch. Tất cả tài sản trí tuệ (IP) ngôn ngữ đều nằm ở phía máy chủ.
- **Ghi chép nguồn gốc** — trường `provenance` trong [plugin manifest](/docs/reference/plugin-spec) nên liệt kê mọi tài nguyên được sử dụng, giấy phép và nguồn gốc của nó.

:::warning OCAP® là một nhãn hiệu đã đăng ký
OCAP® là một nhãn hiệu đã đăng ký của First Nations Information Governance Centre. Nó áp dụng cụ thể cho các Quốc gia Thứ nhất ở Canada. Các nguyên tắc này có ý nghĩa rộng hơn, nhưng nhãn hiệu và thẩm quyền quản trị thuộc về FNIGC.
:::

---

## Các nguyên tắc CARE

**Các nguyên tắc CARE về Quản trị Dữ liệu Bản địa** được phát triển bởi [Global Indigenous Data Alliance](https://www.gida-global.org/care) (GIDA) như một phần bổ sung cho các nguyên tắc dữ liệu FAIR. FAIR cho rằng dữ liệu nên có thể Tìm thấy (Findable), Truy cập được (Accessible), Tương tác được (Interoperable) và Tái sử dụng được (Reusable). CARE cho rằng như vậy là chưa đủ — quản trị dữ liệu cũng phải đặt quyền lợi của người bản địa làm trung tâm.

| Nguyên tắc | Ứng dụng |
|-----------|------------|
| **Lợi ích tập thể (Collective Benefit)** | Các công cụ dịch thuật trước tiên phải mang lại lợi ích cho cộng đồng ngôn ngữ. Điểm số trên bảng xếp hạng (leaderboard) là phương tiện để cải thiện các phương thức, không phải để trích xuất giá trị thương mại từ các ngôn ngữ của cộng đồng. |
| **Thẩm quyền kiểm soát (Authority to Control)** | Các cộng đồng có thẩm quyền quản lý cách dữ liệu ngôn ngữ của họ được thu thập, sử dụng và chia sẻ. Điểm số cao trên bảng xếp hạng không đồng nghĩa với việc được cấp phép xuất bản các bản dịch. |
| **Trách nhiệm (Responsibility)** | Các nhà nghiên cứu và nhà phát triển làm việc với dữ liệu ngôn ngữ bản địa có trách nhiệm xây dựng các mối quan hệ, xin phép và chia sẻ lợi ích. |
| **Đạo đức (Ethics)** | Quyền lợi và sự an sinh của người bản địa phải là mối quan tâm hàng đầu. Các phương thức dịch thuật nên được phát triển *cùng với* cộng đồng, chứ không phải *về* họ. |

---

## Te Mana Raraunga — Chủ quyền Dữ liệu Māori

**Te Mana Raraunga** là [Mạng lưới Chủ quyền Dữ liệu Māori](https://www.temanararaunga.maori.nz/). Mạng lưới này khẳng định rằng dữ liệu của người Māori — bao gồm cả dữ liệu ngôn ngữ — là một taonga (kho báu) tuân theo các nguyên tắc của Hiệp ước Waitangi và tikanga Māori (luật tục của người Māori).

Các nguyên tắc chính:

| Nguyên tắc | Ý nghĩa |
|-----------|---------|
| **Rangatiratanga** (Thẩm quyền) | Người Māori có quyền vốn có trong việc thực thi thẩm quyền đối với dữ liệu của họ, bao gồm cả dữ liệu ngôn ngữ. |
| **Whakapapa** (Mối quan hệ) | Dữ liệu có nguồn gốc và các mối liên kết. Dữ liệu ngôn ngữ mang theo các mối quan hệ và kiến thức của những người đã tạo ra nó. |
| **Whanaungatanga** (Nghĩa vụ) | Những người nắm giữ hoặc xử lý dữ liệu của người Māori có nghĩa vụ tương hỗ đối với các cộng đồng nơi dữ liệu đó xuất phát. |
| **Kotahitanga** (Lợi ích tập thể) | Dữ liệu của người Māori nên được sử dụng vì lợi ích tập thể của người Māori. |
| **Manaakitanga** (Sự tương hỗ) | Việc sử dụng dữ liệu của người Māori cần bao hàm sự quan tâm, tôn trọng và tương hỗ. |
| **Kaitiakitanga** (Quyền giám hộ) | Những người giám hộ dữ liệu có nhiệm vụ bảo vệ dữ liệu và đảm bảo nó được sử dụng một cách phù hợp. |

Các nguyên tắc này áp dụng cho te reo Māori (ngôn ngữ Māori) và cho bất kỳ công việc tính toán nào liên quan đến dữ liệu ngôn ngữ Māori.

---

## Điều này có ý nghĩa gì đối với người dùng rosetta

### Đối với các ngôn ngữ tiêu chuẩn (Tiếng Pháp, Tiếng Nhật, Tiếng Tây Ban Nha...)

Hãy sử dụng rosetta bình thường. Những ngôn ngữ này có các kho ngữ liệu lớn, công khai, các API dịch thuật đã được thiết lập và không có các lo ngại về chủ quyền. Bạn có thể dịch, đồng bộ hóa và xuất bản tùy ý.

### Đối với các ngôn ngữ bản địa và ngôn ngữ ít tài nguyên

Tình hình về cơ bản là khác biệt:

1. **Xin phép trước.** Trước khi xây dựng một phương thức dịch thuật cho một ngôn ngữ bản địa, hãy thiết lập mối quan hệ với cộng đồng. Một phương thức được xây dựng mà không có sự tham gia của cộng đồng — cho dù ấn tượng về mặt kỹ thuật đến đâu — cũng không nên được xuất bản hoặc phân phối.

2. **Sử dụng phương thức `api`.** Lưu trữ pipeline dịch thuật trên cơ sở hạ tầng do cộng đồng kiểm soát. Phương thức `api` trong rosetta được thiết kế cho việc này: nó gửi các key và nhận lại các bản dịch mà không làm lộ các prompt, từ điển hoặc dữ liệu huấn luyện giúp phương thức này hoạt động.

    ```json title="Community-controlled setup"
    {
      "pairs": {
        "en:crk": {
          "method": "api",
          "endpoint": "https://api.community-server.example/translate"
        }
      }
    }
    ```

3. **Ghi chép lại mọi thứ.** Sử dụng trường `provenance` trong plugin manifest của bạn để liệt kê mọi tài nguyên, giấy phép của nó và liệu nó có được cung cấp với sự đồng ý của cộng đồng hay không.

4. **Điểm số không phải là giấy phép.** Điểm số cao trên bảng xếp hạng chứng minh rằng một phương thức hoạt động tốt về mặt kỹ thuật. Nó không cấp quyền xuất bản các bản dịch, phân phối plugin hoặc thương mại hóa phương thức. Cộng đồng mới là người quyết định.

5. **Chia sẻ phương thức, không chia sẻ dữ liệu.** Nếu bạn phát triển một kỹ thuật hoạt động tốt (ví dụ: "FST-gated LLM with coached prompts"), hãy chia sẻ *kiến trúc* và *cách tiếp cận* trên bảng xếp hạng. Cộng đồng vẫn giữ quyền kiểm soát đối với dữ liệu ngôn ngữ giúp nó hoạt động cho ngôn ngữ cụ thể của họ.

---

## Phương thức `api` và Chủ quyền

[Phương thức dịch thuật](/docs/guides/translation-methods) `api` tồn tại đặc biệt để hỗ trợ chủ quyền dữ liệu. Đây là lý do:

| Khía cạnh | Các phương thức khác | Phương thức `api` |
|--------|--------------|-------------|
| **Nơi lưu trữ prompt** | Trong các tệp cấu hình của rosetta (hiển thị với tất cả các nhà phát triển) | Trên máy chủ của cộng đồng (riêng tư) |
| **Nơi lưu trữ dữ liệu huấn luyện** | Trong thư mục `.rosetta/coaching/` (được commit lên git) | Trên máy chủ của cộng đồng (riêng tư) |
| **Nơi lưu trữ từ điển** | Trong thư mục plugin (được phân phối cùng plugin) | Trên máy chủ của cộng đồng (riêng tư) |
| **Ai kiểm soát pipeline** | Bất kỳ ai chạy `rosetta sync` | Cộng đồng vận hành API |
| **Những gì rosetta thấy** | Mọi thứ | Key đi vào, bản dịch đi ra |

Phương thức `api` là một lựa chọn kiến trúc có chủ ý. Nó là một "đường ống thụ động" vì tài sản trí tuệ (IP) — kiến thức ngôn ngữ, các quy tắc ngữ pháp, các ví dụ huấn luyện được tuyển chọn cẩn thận — thuộc về cộng đồng, không phải thuộc về công cụ.

Xem [Cung cấp một Phương thức qua API](/docs/guides/serving-a-method) để biết chi tiết triển khai.

---

## Đọc thêm

- [First Nations Information Governance Centre — OCAP®](https://fnigc.ca/ocap-training/)
- [Global Indigenous Data Alliance — Các nguyên tắc CARE](https://www.gida-global.org/care)
- [Te Mana Raraunga — Mạng lưới Chủ quyền Dữ liệu Māori](https://www.temanararaunga.maori.nz/)
- [USIDSN — Mạng lưới Chủ quyền Dữ liệu Bản địa Hoa Kỳ](https://usindigenousdata.org/)

---

## Xem thêm

- [Hỗ trợ một Ngôn ngữ Ít tài nguyên](/docs/guides/low-resource-languages) — hướng dẫn kỹ thuật với bối cảnh OCAP
- [Các phương thức Dịch thuật](/docs/guides/translation-methods) — phương thức `api` và cách nó bảo vệ IP
- [Cung cấp một Phương thức qua API](/docs/guides/serving-a-method) — lưu trữ một pipeline do cộng đồng kiểm soát
- [Đặc tả Plugin](/docs/reference/plugin-spec) — trường `provenance` để ghi nhận tài nguyên
- [Cookbook: FST-Gated Pipeline](/docs/tutorials/fst-gated-pipeline) — xây dựng một pipeline mà cộng đồng có thể tự lưu trữ