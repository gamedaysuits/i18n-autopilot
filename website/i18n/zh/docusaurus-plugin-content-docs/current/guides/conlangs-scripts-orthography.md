---
sidebar_position: 3
title: "人造语言、文字与正字法"
---
# 人造语言、文字与正字法

rosetta 通过 LLM register 和确定性的 script converter 为构造语言 (conlang) 提供了一流的支持。本指南介绍了 conlang 支持的工作原理、你需要的字体以及如何添加你自己的 conlang。

:::tip 为什么 conlang 很重要
conlang 不仅仅是新奇事物 —— 它们使用了与真实的资源匮乏语言完全相同的基础架构。quality gate、coaching system 和 script conversion pipeline 对于克林贡语 (Klingon) 和平原克里语 (Plains Cree) 的工作方式是完全相同的。如果你的 conlang pipeline 能够正常工作，那么你的低资源语言 pipeline 也一样可以。
:::

---

## 支持的构造语言 (Conlang)

| 语言 | 代码 | Script Converter | 所需字体 |
|----------|------|:----------------:|:-------------:|
| 克林贡语 (Klingon) | `tlh` | ✅ 罗马化 → pIqaD | PUA 字体 (例如 pIqaD qolqoS) |
| 辛达林语 (托尔金精灵语) | `x-elvish-s` | ✅ 拉丁字母 → Tengwar | CSUR PUA 字体 |
| 氪星语 (Kryptonian) | `x-kryptonian` | ✅ 拉丁字母 → 氪星文 | PUA 字体 |
| 海盗英语 (Pirate English) | `x-pirate` | ❌ 仅 register | 无 |
| 莎士比亚英语 | `x-shakespeare` | ❌ 仅 register | 无 |
| 尤达语 (Yoda-speak) | `x-yoda` | ❌ 仅 register | 无 |

根据 BCP-47 私有使用约定，conlang 代码使用 `x-` 前缀，但克林贡语 (`tlh`) 除外，它拥有由 SIL International 分配的 [ISO 639-3](https://iso639-3.sil.org/code/tlh) 代码。

---

## Unicode、PUA 与字体要求

### 私有使用区 (PUA)

克林贡语 (pIqaD)、辛达林语 (Tengwar) 和氪星语使用 Unicode **私有使用区 (PUA)** 字符。PUA 的范围是 U+E000–U+F8FF —— 这些码位**没有标准分配**。[ConScript Unicode Registry (CSUR)](https://www.evertype.com/standards/csur/) 维护了社区公认的虚构文字映射，但它们并不属于 Unicode 标准的一部分。

在实际应用中，这意味着：

- 如果没有加载正确的字体，PUA 文本将渲染为**空方块** (□□□)
- 不同的字体可能会将不同的字形映射到相同的 PUA 码位
- rosetta 不捆绑 PUA 字体 —— 你必须自己加载它们
- 系统字体永远不会渲染这些字符

### 各文字的 PUA 范围

| 文字 | PUA 范围 | CSUR 参考 |
|--------|-----------|---------------|
| 克林贡语 (pIqaD) | U+F8D0–U+F8FF | [CSUR Klingon](https://www.evertype.com/standards/csur/klingon.html) |
| Tengwar (精灵语) | U+E000–U+E07F | [CSUR Tengwar](https://www.evertype.com/standards/csur/tengwar.html) |
| 氪星语 | 因字体而异 | 无 CSUR 标准 |

### 加载 PUA Web 字体

rosetta 包含一个内置命令，用于下载和管理 PUA Web 字体：

```bash
# See which fonts are needed for your configured languages
i18n-rosetta fonts list

# Download all needed fonts (auto-detects project type for output directory)
i18n-rosetta fonts install

# Also generate a CSS snippet with @font-face declarations
i18n-rosetta fonts install --css
```

`fonts install` 命令会从经过验证的开源仓库进行下载：

| 字体 | 文字 | 许可证 | 来源 |
|------|--------|---------|--------|
| pIqaD qolqoS | 克林贡语 | SIL Open Font License 1.1 | [GitHub](https://github.com/dadap/pIqaD-fonts) |
| FreeMonoTengwar | Tengwar | GNU GPL v3 (带字体例外) | [SourceForge](https://sourceforge.net/projects/freetengwar/) |
| *(用户提供)* | 氪星语 | 各异 | 无可用的开源 PUA 字体 |

输出目录会根据你的项目结构自动检测（Docusaurus → `static/fonts/`，Hugo → `static/fonts/`，默认 → `public/fonts/`）。可以使用 `--dir` 进行覆盖。

如果你更喜欢手动管理字体，请在你的 CSS 中添加 `@font-face` 规则：

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

:::warning 不保证 Unicode 支持
Unicode 联盟已[明确拒绝](https://www.unicode.org/faq/private_use.html)在标准中对虚构文字进行编码。PUA 分配由社区维护，并且在不同的字体实现之间可能会发生冲突。请务必指定你的项目所使用的确切字体，并在各浏览器中测试渲染效果。
:::

---

## Script Converters

### 工作原理

rosetta 的 script conversion 是一个**翻译后钩子 (post-translation hook)**：

1. LLM 将文本翻译为**工作文字 (working script)**（通常是拉丁字母或 SRO）
2. [quality gate](/docs/concepts/quality-gate) 验证输出结果
3. 确定性转换器将验证后的文本转换为**显示文字 (display script)**
4. 转换后的文本被写入磁盘

这种两步法之所以有效，是因为 LLM 在处理基于拉丁字母的文字时能产生更好的输出。确定性转换器保证了正确的文字输出，而无需依赖模型（通常不可靠的）文字知识。

### 全部五个 Converter

rosetta 附带五个内置的 script converter：

#### 平原克里语：SRO → 音节文字 (`crk`)

标准罗马正字法 (SRO) 到加拿大原住民音节文字。

```
Input:  "tawâw"
Output: "ᑕᐚᐤ"
```

长元音使用长音符号/扬抑符：ê, î, ô, â。该 converter 处理所有 SRO 变音符号，并将它们映射到正确的音节字符。有关完整的克里语 pipeline，请参阅 [支持低资源语言](https://mtevalarena.org/docs/community/low-resource-languages)。

#### 塞尔维亚语：拉丁字母 → 西里尔字母 (`sr`)

用于塞尔维亚语的确定性拉丁字母到西里尔字母转换。

```
Input:  "zdravo"
Output: "здраво"
```

这处理了完整的塞尔维亚语字母映射，包括二合字母（lj → љ, nj → њ, dž → џ）。

#### 克林贡语：罗马化 → pIqaD (`tlh`)

Marc Okrand 的罗马化系统到 pIqaD PUA 字符的转换。

```
Input:  "Qapla'"    (romanized Klingon)
Output: [pIqaD PUA] (requires pIqaD font to render)
```

#### 辛达林语：拉丁字母 → Tengwar (`x-elvish-s`)

托尔金的辛达林语模式 Tengwar 映射。

```
Input:  "elen síla"  (Latin Sindarin)
Output: [Tengwar PUA] (requires Tengwar font to render)
```

#### 氪星语：拉丁字母 → 氪星文 (`x-kryptonian`)

粉丝词典的氪星文字映射。

```
Input:  "Kal-El"
Output: [Kryptonian PUA] (requires Kryptonian font to render)
```

### 触发 Converter

在你的语言配置中设置 `scripts` 字段。对于内置的 converter，这会根据语言代码自动检测：

```json
{
  "languages": {
    "sr": { "scripts": "sr" },
    "crk": {}
  }
}
```

平原克里语 (`crk`) 会自动检测 —— 你不需要显式设置 `scripts`。

---

## 多文字语言

一些真实的语言使用多种活跃的文字系统：

| 语言 | 文字 | rosetta 方法 |
|----------|---------|-----------------|
| 塞尔维亚语 | 拉丁字母 + 西里尔字母 | Script converter (`sr`) —— 翻译为拉丁字母，转换为西里尔字母 |
| 中文 | 简体 + 繁体 | 独立的 locale 代码（`zh` 与 `zh-TW`），使用不同的 register |

对于两种文字服务于同一受众的语言（如塞尔维亚语），请使用 script converter。对于文字服务于不同受众的语言（如中国大陆的简体中文，台湾/香港的繁体中文），请使用独立的 locale 代码。

---

## 正字法说明

Register 不仅仅是语气 —— 它们带有**正字法指令**，可引导 LLM 遵循正确的书写规范。

### 正式称呼形式

rosetta 的内置 register 包含了每种语言中符合文化习惯的正式称呼：

| 语言 | 正式形式 | Register 指令 |
|----------|------------|---------------------|
| 德语 | Sie | `Use Sie-form for formal address` |
| 法语 | vous | `Use vous-form` |
| 俄语 | вы | `Professional register with вы-form` |
| 土耳其语 | siz | `Professional register with siz-form` |
| 韩语 | 합쇼체 | `Formal Korean (합쇼체)` |
| 日语 | です/ます | `Polite professional register (です/ます form)` |
| 波兰语 | Pan/Pani | `Professional register with Pan/Pani form` |

### 性别包容性书写

每个语言卡片都有一个 `gender.inclusiveGuidance` 字段，包含特定语言的建议。这会与 register 预设分开注入到 LLM 翻译提示词中，因此无论用户选择哪种正式程度预设，它都会一致地应用：

- **法语**：使用间隔号表示的包容性书写 (Écriture inclusive)（例如 "Connecté·e"）
- **德语**：冒号表示法 (Doppelpunkt)（例如 "Benutzer:innen"）
- **西班牙语**：首选性别中立的重构表达；斜杠表示法（例如 "usuario/a"）作为后备方案

对于卡片中没有具体指导的语言（例如韩语、conlang），系统会回退到通用规则：*“首选性别中立的形式或可用的最具包容性的选项。”*

### RTL (从右到左) 文字要求

阿拉伯语、希伯来语、波斯语和乌尔都语的 register 都注明了从右到左 (RTL) 的要求：`Ensure text reads naturally in RTL layout contexts.`

### 覆盖任意 Register

每个 register 都是一个配置值 —— 覆盖它以匹配你项目的语气：

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

有关完整的配置参考，请参阅 [配置](/docs/getting-started/configuration)。

---

## 添加新的 Conlang

### 步骤指南

1. **选择一个 BCP-47 私有使用代码**：使用 `x-` 前缀（例如 `x-dothraki`，`x-valyrian`）。

2. **添加到你的配置中**：

```json
{
  "languages": {
    "x-dothraki": {
      "register": "Dothraki language. Use David J. Peterson's vocabulary from the Living Language Dothraki textbook. Harsh, direct tone. No articles, no verb 'to be'."
    }
  }
}
```

3. **(可选) 添加 script converter**：如果你的 conlang 使用非拉丁显示文字，请在 `lib/scripts.js` 中添加一个 converter，并在 `SCRIPT_CONVERTERS` 中注册它。

4. **测试**：运行 `i18n-rosetta sync --dry` 以预览翻译，而无需写入文件。

5. **检查 quality gate**：[quality gate](/docs/concepts/quality-gate) 可能需要针对你的 conlang 进行调整 —— 特别是当你的 conlang 使用 PUA 字符时，需要注意 `requireNonLatin` 检查。

:::note Conlang 的质量取决于 LLM 的知识储备
LLM 只能翻译成它在训练数据中见过的 conlang。记录详尽的 conlang（如克林贡语、辛达林语、多斯拉克语）效果很好。冷门或新发明的 conlang 可能会产生不一致的结果。请使用 [coaching data](/docs/concepts/coaching-data) 来提高质量。
:::

---

## 另请参阅

- [支持的语言](/docs/reference/supported-languages) —— 包含方法可用性的完整语言表
- [Script Converters](/docs/concepts/script-converters) —— 转换 pipeline 的技术细节
- [翻译方法](/docs/guides/translation-methods) —— 每种翻译方法的工作原理
- [配置](/docs/getting-started/configuration) —— 包含语言和 register 设置的配置参考
- [支持低资源语言](https://mtevalarena.org/docs/community/low-resource-languages) —— 应用于真实资源匮乏语言的相同基础架构