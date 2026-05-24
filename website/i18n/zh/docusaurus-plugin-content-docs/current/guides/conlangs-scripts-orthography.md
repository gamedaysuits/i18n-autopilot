---
sidebar_position: 3
title: "人造语言、文字与正字法"
---
# 人造语言、书写系统与正字法

rosetta 通过 LLM register 和确定性的书写系统转换器 (script converter) 为人造语言 (constructed languages, 简称 conlang) 提供一流支持。本指南将介绍 conlang 支持的工作原理、所需的字体以及如何添加你自己的 conlang。

:::tip 为什么 conlang 很重要
Conlang 不仅仅是新奇事物——它们使用的是与真实的资源匮乏语言完全相同的基础设施。quality gate、coaching system 和书写系统转换流水线在 Klingon 和 Plains Cree 上的工作方式完全相同。如果你的 conlang 流水线能正常工作，那么你的低资源语言流水线也一样能行。
:::

---

## 支持的人造语言

| 语言 | 代码 | 书写系统转换器 | 所需字体 |
|----------|------|:----------------:|:-------------:|
| Klingon | `tlh` | ✅ 罗马化 → pIqaD | PUA 字体 (例如 pIqaD qolqoS) |
| Sindarin (Tolkien Elvish) | `x-elvish-s` | ✅ 拉丁字母 → Tengwar | CSUR PUA 字体 |
| Kryptonian | `x-kryptonian` | ✅ 拉丁字母 → Kryptonian | PUA 字体 |
| 海盗英语 (Pirate English) | `x-pirate` | ❌ 仅 register | 无 |
| 莎士比亚英语 (Shakespearean English) | `x-shakespeare` | ❌ 仅 register | 无 |
| 尤达语 (Yoda-speak) | `x-yoda` | ❌ 仅 register | 无 |

根据 BCP-47 私人使用约定，conlang 代码使用 `x-` 前缀，但 Klingon (`tlh`) 除外，它拥有由 SIL International 分配的 [ISO 639-3](https://iso639-3.sil.org/code/tlh) 代码。

---

## Unicode、PUA 与字体要求

### 私人使用区 (Private Use Area)

Klingon (pIqaD)、Sindarin (Tengwar) 和 Kryptonian 使用 Unicode **私人使用区 (PUA)** 字符。PUA 的范围是 U+E000–U+F8FF——这些码位**没有标准分配**。[ConScript Unicode Registry (CSUR)](https://www.evertype.com/standards/csur/) 维护了社区公认的虚构书写系统映射，但这些并不属于 Unicode 标准的一部分。

在实践中，这意味着：

- 如果没有加载正确的字体，PUA 文本将渲染为**空方块** (□□□)
- 不同的字体可能会将不同的字形映射到相同的 PUA 码位
- rosetta 不捆绑 PUA 字体——你必须自行加载
- 系统字体永远无法渲染这些字符

### 各书写系统的 PUA 范围

| 书写系统 | PUA 范围 | CSUR 参考 |
|--------|-----------|---------------|
| Klingon (pIqaD) | U+F8D0–U+F8FF | [CSUR Klingon](https://www.evertype.com/standards/csur/klingon.html) |
| Tengwar (Elvish) | U+E000–U+E07F | [CSUR Tengwar](https://www.evertype.com/standards/csur/tengwar.html) |
| Kryptonian | 因字体而异 | 无 CSUR 标准 |

### 加载 PUA Web 字体

要在你的 Web 应用中显示基于 PUA 的 conlang 文本，请通过 CSS 加载相应的字体：

```css
/* Load a Klingon PUA font */
@font-face {
  font-family: 'pIqaD';
  src: url('/fonts/piqad.woff2') format('woff2');
  unicode-range: U+F8D0-U+F8FF;
}

/* Apply to Klingon text elements */
[lang="tlh"] {
  font-family: 'pIqaD', sans-serif;
}
```

:::warning 不保证 Unicode 支持
Unicode 联盟已[明确拒绝](https://www.unicode.org/faq/private_use.html)在标准中对虚构书写系统进行编码。PUA 分配由社区维护，并且在不同的字体实现之间可能会发生冲突。请务必指定你项目中使用的确切字体，并在各浏览器中测试渲染效果。
:::

---

## 书写系统转换器 (Script Converters)

### 工作原理

rosetta 的书写系统转换是一个**翻译后钩子 (post-translation hook)**：

1. LLM 将文本翻译为**工作书写系统**（通常是拉丁字母或 SRO）
2. [quality gate](/docs/concepts/quality-gate) 验证输出结果
3. 确定性转换器将验证后的文本转换为**显示书写系统**
4. 转换后的文本被写入磁盘

这种两步法之所以有效，是因为 LLM 在处理基于拉丁字母的书写系统时能生成更好的输出。确定性转换器保证了正确的书写系统输出，而无需依赖模型（通常不可靠的）书写系统知识。

### 全部五种转换器

rosetta 内置了五种书写系统转换器：

#### Plains Cree: SRO → 音节文字 (`crk`)

从标准罗马正字法 (SRO) 转换为加拿大原住民音节文字。

```
Input:  "tawâw"
Output: "ᑕᐚᐤ"
```

长元音使用长音符号/扬抑符：ê, î, ô, â。转换器会处理所有 SRO 变音符号，并将它们映射到正确的音节字符。有关完整的 Cree 流水线，请参阅[支持低资源语言](/docs/guides/low-resource-languages)。

#### 塞尔维亚语 (Serbian): 拉丁字母 → 西里尔字母 (`sr`)

针对塞尔维亚语的确定性拉丁字母到西里尔字母转换。

```
Input:  "zdravo"
Output: "здраво"
```

这处理了完整的塞尔维亚语字母映射，包括二合字母 (lj → љ, nj → њ, dž → џ)。

#### Klingon: 罗马化 → pIqaD (`tlh`)

从 Marc Okrand 的罗马化系统转换为 pIqaD PUA 字符。

```
Input:  "Qapla'"    (romanized Klingon)
Output: [pIqaD PUA] (requires pIqaD font to render)
```

#### Sindarin: 拉丁字母 → Tengwar (`x-elvish-s`)

托尔金的 Sindarin 模式 Tengwar 映射。

```
Input:  "elen síla"  (Latin Sindarin)
Output: [Tengwar PUA] (requires Tengwar font to render)
```

#### Kryptonian: 拉丁字母 → Kryptonian (`x-kryptonian`)

粉丝词典的 Kryptonian 书写系统映射。

```
Input:  "Kal-El"
Output: [Kryptonian PUA] (requires Kryptonian font to render)
```

### 触发转换器

在你的语言配置中设置 `scripts` 字段。对于内置转换器，系统会根据语言代码自动检测：

```json
{
  "languages": {
    "sr": { "scripts": "sr" },
    "crk": {}
  }
}
```

Plains Cree (`crk`) 会自动检测——你不需要显式设置 `scripts`。

---

## 多书写系统语言

一些真实的语言使用多种活跃的书写系统：

| 语言 | 书写系统 | rosetta 处理方式 |
|----------|---------|-----------------|
| 塞尔维亚语 (Serbian) | 拉丁字母 + 西里尔字母 | 书写系统转换器 (`sr`) ——用拉丁字母翻译，转换为西里尔字母 |
| 中文 (Chinese) | 简体 + 繁体 | 独立的区域代码（`zh` 与 `zh-TW`），使用不同的 register |

对于两种书写系统服务于同一受众的语言（如塞尔维亚语），请使用书写系统转换器。对于书写系统服务于不同受众的语言（如中国大陆的简体中文，台湾/香港的繁体中文），请使用独立的区域代码。

---

## 正字法说明

Register 不仅仅是语气——它们还带有**正字法指令**，用于引导 LLM 遵循正确的书写规范。

### 正式称呼形式

rosetta 的内置 register 包含了每种语言在文化上合适的正式称呼：

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

每个语言卡片都有一个 `gender.inclusiveGuidance` 字段，包含特定语言的建议。这与 register 预设分开注入到 LLM 翻译提示词中，因此无论用户选择哪种正式程度预设，它都能一致地应用：

- **法语**：使用间隔号的包容性书写 (Écriture inclusive)（例如 "Connecté·e"）
- **德语**：冒号表示法 (Doppelpunkt)（例如 "Benutzer:innen"）
- **西班牙语**：首选性别中立的重构表达；斜杠表示法（例如 "usuario/a"）作为备选

对于卡片中没有具体指导的语言（例如韩语、conlang），系统会回退到通用规则：*“首选性别中立形式或可用的最具包容性的选项。”*

### RTL (从右到左) 书写系统要求

阿拉伯语、希伯来语、波斯语和乌尔都语的 register 均注明了从右到左 (RTL) 的要求：`Ensure text reads naturally in RTL layout contexts.`

### 覆盖任意 Register

每个 register 都是一个配置值——你可以覆盖它以匹配你项目的语气：

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

有关完整的配置参考，请参阅[配置](/docs/getting-started/configuration)。

---

## 添加新的 Conlang

### 逐步指南

1. **选择一个 BCP-47 私人使用代码**：使用 `x-` 前缀（例如 `x-dothraki`, `x-valyrian`）。

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

3. **（可选）添加书写系统转换器**：如果你的 conlang 使用非拉丁字母的显示书写系统，请在 `lib/scripts.js` 中添加一个转换器，并在 `SCRIPT_CONVERTERS` 中注册它。

4. **测试**：运行 `i18n-rosetta sync --dry` 以预览翻译结果，而不写入文件。

5. **检查 quality gate**：[quality gate](/docs/concepts/quality-gate) 可能需要针对你的 conlang 进行调整——特别是当你的 conlang 使用 PUA 字符时，需要注意 `requireNonLatin` 检查。

:::note Conlang 的质量取决于 LLM 的知识
LLM 只能翻译成它在训练数据中见过的 conlang。记录详尽的 conlang（如 Klingon、Sindarin、Dothraki）效果很好。冷门或新发明的 conlang 可能会产生不一致的结果。请使用 [coaching data](/docs/concepts/coaching-data) 来提高质量。
:::

---

## 另请参阅

- [支持的语言](/docs/reference/supported-languages) —— 包含方法可用性的完整语言表
- [书写系统转换器](/docs/concepts/script-converters) —— 转换流水线的技术细节
- [翻译方法](/docs/guides/translation-methods) —— 每种翻译方法的工作原理
- [配置](/docs/getting-started/configuration) —— 包含语言和 register 设置的配置参考
- [支持低资源语言](/docs/guides/low-resource-languages) —— 应用于真实的资源匮乏语言的相同基础设施