---
sidebar_position: 4
title: "支持的语言"
---
# 支持的语言

rosetta 附带 **Language Cards** —— 适用于 50 种语言的结构化配置文件。每张卡片包含语域预设 (register presets)、正式程度系统元数据、方法支持标志、排版规则和书写系统 (script) 信息。你的 LLM 掌握的任何语言都可以通过一行配置添加 —— 这些是经过精心整理、可用于生产环境的语域。

---

## 翻译方法

每种语言可以使用以下一种或多种翻译方法：

| 图标 | 方法 | 工作原理 | 成本 |
|------|--------|-------------|------|
| 🟢 | **Google Translate** | 神经机器翻译 (Neural MT) 基准。支持 130 多种语言。仅支持键值对字符串 —— 无法安全地翻译 Markdown 内容。 | 约 $20/100万字符 |
| 🔵 | **LLM (OpenRouter)** | 模型掌握的任何语言。由语域引导的提示词。支持处理键值对和 Markdown 内容。 | 因模型而异 |
| 🟣 | **LLM-Coached** | LLM + 语法词典 + 注入到提示词中的辅导数据。最适合形态复杂的语言。 | 因模型而异 |
| 🟠 | **API (Plugin)** | 通过 HTTP 提供的社区托管翻译流水线。[兼容 OCAP](https://mtevalarena.org/docs/community/low-resource-languages)。 | 因提供商而异 |

将 Google Translate 设置为 `GOOGLE_TRANSLATE_API_KEY`，或将 LLM 方法设置为 `OPENROUTER_API_KEY`。有关完整详细信息，请参阅 [翻译方法](/docs/guides/translation-methods)。

---

## 优先语言

这些是 Web 和移动应用程序中最常用的语言区域，按照 rosetta 推荐的无障碍优先顺序排列。

| 国旗 | 语言 | 代码 | Google | LLM | Coached | 书写系统 | 备注 |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇸🇦 | 阿拉伯语 | `ar` | ✅ | ✅ | ✅ | — | RTL。现代标准阿拉伯语 (فصحى)。 |
| 🇵🇭 | 菲律宾语 (Taglish) | `tl` | ✅ | ✅ | ✅ | — | 语码转换：以他加禄语为主，技术术语使用英语。 |
| 🇫🇷 | 法语 | `fr` | ✅ | ✅ | ✅ | — | Vous 形式。性别包容 (Connecté·e)。 |
| 🇪🇸 | 西班牙语 | `es` | ✅ | ✅ | ✅ | — | 中立拉美西班牙语。 |
| 🇩🇪 | 德语 | `de` | ✅ | ✅ | ✅ | — | Sie 形式。性别包容 (Benutzer:innen)。 |
| 🇯🇵 | 日语 | `ja` | ✅ | ✅ | ✅ | — | 正文使用 です/ます，UI 标签使用 する。 |
| 🇨🇳 | 中文 (简体) | `zh` | ✅ | ✅ | ✅ | — | 简体中文。 |
| 🇮🇹 | 意大利语 | `it` | ✅ | ✅ | ✅ | — | Lei 形式。 |
| 🇧🇷 | 葡萄牙语 (巴西) | `pt` | ✅ | ✅ | ✅ | — | 巴西葡萄牙语。 |
| 🇰🇷 | 韩语 | `ko` | ✅ | ✅ | ✅ | — | 해요체 敬语语域。 |

## 主要世界语言

| 国旗 | 语言 | 代码 | Google | LLM | Coached | 书写系统 | 备注 |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇧🇩 | 孟加拉语 | `bn` | ✅ | ✅ | ✅ | — | 偏好 শুদ্ধ ভাষা。 |
| 🇧🇬 | 保加利亚语 | `bg` | ✅ | ✅ | ✅ | — | |
| 🇨🇿 | 捷克语 | `cs` | ✅ | ✅ | ✅ | — | Vykání (vy 形式)。 |
| 🇩🇰 | 丹麦语 | `da` | ✅ | ✅ | ✅ | — | |
| 🇬🇷 | 希腊语 | `el` | ✅ | ✅ | ✅ | — | 现代 Δημοτική。 |
| 🇮🇷 | 波斯语 | `fa` | ✅ | ✅ | ✅ | — | RTL。 |
| 🇫🇮 | 芬兰语 | `fi` | ✅ | ✅ | ✅ | — | 无语法性别。 |
| 🇮🇱 | 希伯来语 | `he` | ✅ | ✅ | ✅ | — | RTL。 |
| 🇮🇳 | 印地语 | `hi` | ✅ | ✅ | ✅ | — | शुद्ध हिन्दी。尽量减少英语外来词。 |
| 🇭🇺 | 匈牙利语 | `hu` | ✅ | ✅ | ✅ | — | Ön 形式。 |
| 🇮🇩 | 印尼语 | `id` | ✅ | ✅ | ✅ | — | |
| 🇲🇾 | 马来语 | `ms` | ✅ | ✅ | ✅ | — | |
| 🇳🇱 | 荷兰语 | `nl` | ✅ | ✅ | ✅ | — | U 形式。 |
| 🇳🇴 | 挪威语 | `nb` | ✅ | ✅ | ✅ | — | 书面挪威语 (Bokmål)。 |
| 🇵🇱 | 波兰语 | `pl` | ✅ | ✅ | ✅ | — | Pan/Pani 形式。 |
| 🇵🇹 | 葡萄牙语 (欧洲) | `pt-PT` | ✅ | ✅ | ✅ | — | 欧洲葡萄牙语。 |
| 🇷🇴 | 罗马尼亚语 | `ro` | ✅ | ✅ | ✅ | — | |
| 🇷🇺 | 俄语 | `ru` | ✅ | ✅ | ✅ | — | Вы 形式。 |
| 🇸🇰 | 斯洛伐克语 | `sk` | ✅ | ✅ | ✅ | — | Vykanie (vy 形式)。 |
| 🇷🇸 | 塞尔维亚语 | `sr` | ✅ | ✅ | ✅ | 🔤 Latin→Cyrillic | 确定性书写系统转换器。 |
| 🇸🇪 | 瑞典语 | `sv` | ✅ | ✅ | ✅ | — | |
| 🇰🇪 | 斯瓦希里语 | `sw` | ✅ | ✅ | ✅ | — | |
| 🇹🇭 | 泰语 | `th` | ✅ | ✅ | ✅ | — | ครับ/ค่ะ 敬语助词。 |
| 🇹🇷 | 土耳其语 | `tr` | ✅ | ✅ | ✅ | — | Siz 形式。 |
| 🇺🇦 | 乌克兰语 | `uk` | ✅ | ✅ | ✅ | — | Ви 形式。 |
| 🇵🇰 | 乌尔都语 | `ur` | ✅ | ✅ | ✅ | — | RTL。آپ 形式。 |
| 🇻🇳 | 越南语 | `vi` | ✅ | ✅ | ✅ | — | |
| 🇹🇼 | 中文 (繁体) | `zh-TW` | ✅ | ✅ | ✅ | — | 繁體中文。 |
| 🇬🇪 | 格鲁吉亚语 | `ka` | ✅ | ✅ | — | — | ქართული。南高加索语系。 |
| 🇳🇬 | 约鲁巴语 | `yo` | ✅ | ✅ | — | — | Èdè Yorùbá。声调语言 (3 个声调)。 |

## 地区变体

| 国旗 | 语言 | 代码 | Google | LLM | Coached | 书写系统 | 备注 |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇲🇽 | 墨西哥西班牙语 | `es-MX` | ✅ | ✅ | ✅ | — | Tú 形式。温暖语域。 |
| 🇨🇦 | 加拿大法语 | `fr-CA` | ✅ | ✅ | ✅ | — | 魁北克习语。 |

---

## 原住民与低资源语言

商业机器翻译服务不支持这些语言。rosetta 为语言社区提供了在 [OCAP 原则](https://mtevalarena.org/docs/community/low-resource-languages) 下构建自有翻译方法的工具。

| | 语言 | 代码 | Google | LLM | Coached | 书写系统 | 状态 |
|---|----------|------|:------:|:---:|:-------:|--------|--------|
| 🪶 | 平原克里语 | `crk` | ❌ | ✅ | ✅ | 🔤 SRO→Syllabics | 🚧 开发中 |
| 🌄 | 克丘亚语 | `qu` | ✅ | ✅ | — | — | Runasimi。传信后缀。 |

:::info 平原克里语正在积极开发中
平原克里语的语域、辅导基础设施、书写系统转换器和评估工具均已可用，但翻译流水线**尚未发布**。我们正在 [OCAP 原则](https://mtevalarena.org/docs/community/low-resource-languages) 下与语言社区合作，以确保发布前的质量。有关完整背景以及如何参与贡献，请参阅 [支持低资源语言](https://mtevalarena.org/docs/community/low-resource-languages)。
:::

:::tip 添加更多低资源语言
rosetta 的方法插件系统正是为此设计的。语言社区可以构建自定义翻译方法，在自己的控制下进行托管，并通过 [API 方法](/docs/guides/serving-a-method) 提供服务。[方法排行榜](/leaderboard) 跟踪任何语言对的得分 —— 构建方法，运行评估工具，并争取最高分。
:::

---

## 人造语言

人造语言 (Conlangs) 通过 LLM 语域和可选的书写系统转换器提供支持。它们使用与真实语言相同的基础设施 —— 质量关卡、辅导系统和书写系统转换流水线的工作方式完全相同。

| | 语言 | 代码 | Google | LLM | 书写系统 | 备注 |
|---|----------|------|:------:|:---:|--------|-------|
| 🖖 | 克林贡语 | `tlh` | ❌ | ✅ | 🔤 Romanization→pIqaD | 需要 PUA 字体。Marc Okrand 词汇。 |
| 🧝 | 辛达林语 (托尔金精灵语) | `x-elvish-s` | ❌ | ✅ | 🔤 Latin→Tengwar | 需要 CSUR PUA 字体。 |
| 🏴‍☠️ | 海盗英语 | `x-pirate` | ❌ | ✅ | — | 仅语域。航海隐喻。 |
| 🦸 | 氪星语 | `x-kryptonian` | ❌ | ✅ | 🔤 Latin→Kryptonian | 需要 PUA 字体。 |
| 🎭 | 莎士比亚英语 | `x-shakespeare` | ❌ | ✅ | — | 仅语域。Thee/thou，-eth/-est 形式。 |
| 🐸 | 尤达语 | `x-yoda` | ❌ | ✅ | — | 仅语域。OSV 语序。 |

有关 PUA 字体要求、Unicode 限制以及如何添加自定义语言的信息，请参阅 [人造语言、书写系统与正字法](/docs/guides/conlangs-scripts-orthography)。

---

## 语言预设

`init` 向导支持使用预设名称进行快速设置。你可以将预设与单独的语言代码混合使用。

| 预设 | 扩展为 |
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

## 添加任何语言

rosetta 可以翻译成 **你的 LLM 掌握的任何语言** —— 上表仅列出了带有内置语域预设的语言。要添加未列出的语言，请在配置中包含其 BCP-47 代码：

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

LLM 将利用其对该语言的训练知识进行翻译。设置 `register` 可以让你控制语气、正式程度和正字法约定。有关详细信息，请参阅 [配置](/docs/getting-started/configuration)。

---

## Language Cards

每种内置语言都有一个 **Language Card** —— 为了性能而分为两层的结构化 JSON 配置：

### 双层架构

| 层级 | 目录 | 加载方式 | 用途 |
|------|-----------|--------|--------|
| **Runtime (运行时)** | `lib/data/language-cards/` | 在 `import` 预先加载 | 翻译引擎：语域、正式程度、规则、方法支持 |
| **Reference (参考)** | `lib/data/language-reference/` | 按需延迟加载 | 开发者文档：语言学挑战、百科数据、NLP 资源 |

运行时层保持较小体积（每张卡片约 2 KB），因此导入 rosetta 时不会加载数兆字节的文档数据。参考层可通过 `getLanguageReference(code)` 供工具、网站和评估工具使用。

### 运行时卡片字段

| 字段 | 包含内容 |
|-------|------------------|
| **`nativeName`** | 自称 (Endonym) —— 该语言用自身书写系统表示的名称（例如：ქართული、Runasimi） |
| **Formality system (正式程度系统)** | T-V 区分、敬语级别、keigo、助词等 |
| **Register presets (语域预设)** | 针对该语言特性的命名 LLM 提示词预设 |
| **Method support (方法支持)** | 哪些翻译 API 支持该语言 |
| **Gender guidance (性别指南)** | 语法性别规则和包容性写作提示 |
| **Script/direction (书写系统/方向)** | ISO 15924 书写系统代码和 RTL/LTR |
| **Rules (规则)** | 排版（引号、间距）、大写、复数类别 |
| **Eval datasets (评估数据集)** | 哪些基准测试涵盖该语言 |
| **`glottocode`** | 用于交叉引用的规范 Glottolog 标识符 |
| **`humanReviewed`** | 该卡片是否经过母语者审查 |

### 参考卡片字段

| 字段 | 包含内容 |
|-------|------------------|
| **Linguistic challenges (语言学挑战)** | 机器翻译特定的陷阱（例如：传信性、声调变音符号、黏着语特性） |
| **Encyclopedic (百科信息)** | 语系、分类、使用者数量、地区 |
| **Resources (资源)** | NLP 工具、平行语料库、预训练模型 |

### 搭建新的 Language Card

使用生成器从权威数据源（IANA、CLDR、Glottolog）搭建这两层架构：

```bash
# Preview what would be generated
node scripts/generate-language-card.mjs sw --dry-run

# Generate both runtime + reference cards
node scripts/generate-language-card.mjs sw
```

生成器会自动填充元数据（代码、书写系统、方向、复数、引号、方法支持、语系），并将语言学判断字段标记为 TODO，以便人工整理。

### 使用预设键

你可以使用预设键名，而无需编写完整的语域文本：

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "polite"
  }
}
```

Rosetta 会将该键解析为完整的语域提示词。运行 `npx i18n-rosetta init` 查看每种语言可用的预设。

### 预设示例

| 语言 | 预设 | 默认值 |
|----------|---------|--------|
| 法语 | `formal-vous`, `casual-tu` | `formal-vous` |
| 韩语 | `polite-haeyo`, `formal-hapsyo`, `casual-hae` | `polite-haeyo` |
| 日语 | `polite`, `formal-keigo`, `casual` | `polite` |
| 德语 | `formal-Sie`, `casual-du` | `formal-Sie` |
| 泰语 | `neutral-professional`, `polite-male`, `polite-female` | `neutral-professional` |
| 西班牙语 | `neutral-professional`, `formal-usted`, `casual-tuteo` | `neutral-professional` |

有关完整规范（包括字段验证和 PR 检查清单），请参阅 [贡献 Language Card](https://github.com/gamedaysuits/i18n-rosetta)。

---

## 另请参阅

- [配置](/docs/getting-started/configuration) —— 包含语言设置的完整配置参考
- [翻译方法](/docs/guides/translation-methods) —— 每种方法的工作原理
- [书写系统转换器](/docs/concepts/script-converters) —— 确定性书写系统转换流水线
- [人造语言、书写系统与正字法](/docs/guides/conlangs-scripts-orthography) —— PUA 字体、Unicode、添加人造语言
- [支持低资源语言](https://mtevalarena.org/docs/community/low-resource-languages) —— 为服务不足的语言构建翻译方法