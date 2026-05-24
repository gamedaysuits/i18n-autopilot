---
sidebar_position: 6
title: "脚本转换器"
---
# 文字转换器

文字转换器是确定性的、无需 LLM 的翻译后置钩子（post-translation hooks），用于将文本从一种书写系统转换为另一种书写系统。它们实现了“一次翻译，多种文字渲染”的工作流——你先翻译成工作文字（通常是拉丁字母），然后自动转换为显示文字。

## 为什么需要文字转换器？

有些语言的同一种口语会使用多种书写系统：

- **Plains Cree**（平原克里语）：使用 SRO（拉丁字母）进行编辑 → 使用音节文字（ᓀᐦᐃᔭᐍᐏᐣ）进行显示
- **Serbian**（塞尔维亚语）：国际通用拉丁字母 → 国内使用西里尔字母
- **Klingon**（克林贡语）：使用罗马音进行输入 → 使用 pIqaD (  ) 进行显示

直接翻译成非拉丁文字会带来一些问题：LLM 会产生字符幻觉，JSON 文件变得难以进行版本控制，且 diff 工具无法比较更改。文字转换器通过将翻译保留在对版本控制友好的文字中，并在同步时进行确定性转换，从而解决了这个问题。

## 可用的转换器

Rosetta 内置了五个文字转换器：

| Locale | 从 | 到 | 类型 | 是否需要字体？ |
|--------|------|----|------|----------------|
| `crk` | SRO（标准罗马正字法） | 克里语音节文字 | 确定性 | 否 — 原生 Unicode |
| `sr` | 拉丁字母 | 西里尔字母 | 确定性 | 否 — 原生 Unicode |
| `tlh` | 罗马化拼写 | pIqaD | 确定性 | 是 — PUA U+F8D0–F8FF |
| `x-elvish-s` | 拉丁字母 | Tengwar（贝尔兰模式） | 确定性 | 是 — PUA U+E000–E07F |
| `x-kryptonian` | 拉丁字母 | Kryptonian | 基于字体的密码 | 是 — PUA U+E100–E119 |

### 确定性转换与基于字体的转换

- **确定性转换器**（克里语、塞尔维亚语、克林贡语、Tengwar）使用语言学规则执行真实的字符到字符映射。输出包含实际的 Unicode 字符。
- **基于字体的转换器**（Kryptonian）是 1:1 的替换密码，其输出为 Unicode PUA 字符，只有在加载特定字体时才能正确渲染。

## 工作原理

文字转换器在翻译**之后**作为后处理步骤运行。其流水线如下：

```
Source (English) → LLM Translation → Working Script → Script Converter → Display Script
```

以 Plains Cree（平原克里语）为例：
```
"Welcome" → LLM → "tānisi" (SRO) → Converter → "ᑖᓂᓯ" (Syllabics)
```

### 贪婪的从左到右匹配

所有转换器都使用相同的算法：在每个字符位置，首先尝试可能的最长匹配，然后逐渐尝试较短的匹配。不匹配任何模式的字符（空格、标点符号、数字）将保持不变直接通过。

这能正确处理二合字母和三合字母：
- Klingon：`tlh` → 单个 pIqaD 字符（而不是 `t` + `l` + `h`）
- Serbian：`nj` → `њ`（而不是 `н` + `ј`）
- Cree：`twê` → 单个音节字符（而不是 `t` + `w` + `ê`）

## 使用文字转换器

当 locale 代码与已注册的转换器匹配时，文字转换器会自动激活。无需配置——只需设置你的目标 locale：

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

当 rosetta 同步 `en:crk` 语言对时，翻译首先以 SRO 生成，然后在写入 `crk.json` 之前自动转换为音节文字。

### 检查转换器状态

```bash
npx i18n-rosetta status
```

状态输出会显示哪些语言对激活了文字转换器，以及它们执行了什么转换。

## Web 字体要求

有三个转换器会输出 Unicode 私用区（PUA）字符，这些字符需要自定义的 Web 字体：

### Klingon (pIqaD)

安装兼容 CSUR 的 pIqaD 字体（例如 "pIqaD qolqoS" 或 "Klingon pIqaD HaSta"）：

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

安装兼容 CSUR 的 Tengwar 字体（例如 "Tengwar Formal CSUR"、"Tengwar Annatar"）：

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

安装映射到 PUA 码位 U+E100–E119 的 Kryptonian 字体：

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

:::tip Kryptonian 的替代方案
由于 Kryptonian 是纯粹的 A-Z 密码，你可以完全跳过文字转换器，通过 CSS 将字体直接应用于拉丁文本。这对于 Web 部署通常更简单——只需提供 Kryptonian 字体并在相关元素上设置 `font-family` 即可。
:::

## 添加自定义转换器

要为新语言添加转换器，请编辑 `lib/scripts.js`：

1. **创建转换映射** —— 一个包含 `[from, to]` 键值对的有序数组，最长的序列排在前面
2. **创建转换器函数** —— 一个贪婪的从左到右扫描器（使用 `sroToSyllabics` 作为模板）
3. **注册转换器** —— 在 `SCRIPT_CONVERTERS` 对象中将其注册，使用 locale 代码作为键
4. **添加 `script` 字段** —— 添加到 `registers.js` 中该语言的注册条目里

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

## 另请参阅

- [人造语言、文字与正字法](/docs/guides/conlangs-scripts-orthography) — PUA 字体、Unicode、添加新转换器
- [质量门禁](/docs/concepts/quality-gate) — 在文字转换前运行的验证
- [支持的语言](/docs/reference/supported-languages) — 哪些语言具有文字转换器
- [支持低资源语言](/docs/guides/low-resource-languages) — 上下文中的 SRO→音节文字
- [实战指南：FST 门禁流水线](/docs/tutorials/fst-gated-pipeline) — 多阶段流水线中的文字转换