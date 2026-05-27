---
sidebar_position: 3
title: "质量门禁"
---
# 质量门禁

每次翻译在写入磁盘之前，都会通过一个确定性的验证门禁。质量门禁会捕获常见的机器翻译失败模式——没有静默降级，也不会有垃圾数据写入你的本地化文件。

## 验证检查

| 检查项 | 捕获内容 | 门禁标签 |
|-------|----------------|-----------|
| **空/空白** | 模型返回空字符串或空白字符 | `[GATE] empty` |
| **源文回显** | 模型返回了原始英文输入 | `[GATE] source-echo` |
| **幻觉循环** | 重复的三元组模式（例如，`"Qo' Qo' Qo'"`） | `[GATE] hallucination` |
| **长度膨胀** | 输出内容比源文长得多 | `[GATE] length` |
| **书写系统合规性** | 目标语言环境的书写系统错误 | `[GATE] script` |
| **ICU 复数类别** | 缺少该语言环境所需的复数形式 | `[GATE] icu-plural` |

### 空/空白

拒绝空字符串、仅包含空白字符或 `null` 的翻译。这可以捕获模型在遇到困难的键时返回空内容的情况。

### 源文回显

检测模型是否返回了英文源文而不是进行翻译。这在短字符串和提示词不够明确时很常见。

### 幻觉循环

分析输出中的三元组（3 字符）模式。如果任何三元组的重复次数相对于输出长度超过了阈值，该翻译将被拒绝。这可以捕获像 `"Qo' Qo' Qo' Qo' Qo'"` 这样的退化输出。

### 长度膨胀

拒绝输出长度超过 `maxLengthRatio × source length`（默认：4 倍）的翻译。这可以捕获模型产生幻觉，为简短输入生成大段文字的情况。

可以通过你配置文件中的 `maxLengthRatio` 进行配置。

### 书写系统合规性

对于配置了 `script` 字段的语言环境（例如，平原克里语音节文字的 `"script": "cans"`），验证输出是否包含适合目标书写系统的非 ASCII 字符。如果阿拉伯语、中日韩语（CJK）或音节文字的语言环境仅输出拉丁字符，则会被拒绝。

## 失败时的处理方式

1. 失败的翻译会被记录到 stderr，带有 `[GATE]` 前缀、键名、原因以及值的预览
2. 该键**不会**被写入本地化文件
3. 触发重试级联（见下文）

```
[GATE] hero.title: source-echo — "Welcome to our platform"
[GATE] nav.about: hallucination — "À À À À À À À À"
```

## 重试级联

当一个批次失败（JSON 解析错误或被质量门禁拒绝）时，rosetta 会使用逐渐减小的批次进行重试：

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the 2 problem keys
```

重试预算上限由 `maxRetries` 决定（默认：3，可按语言配置）。这可以防止在持续失败的键上失控地消耗 token。

耗尽重试次数后，有问题的键会被记录并跳过。它们将在下一次运行 `sync` 时被重试。

## 提示词缓存

系统消息（语域、语法规则、样式说明）与用户消息（要翻译的键）是分开的。这种分离是有意为之的：

- 对于给定的语言环境，系统消息在**所有批次中都是相同的**
- Anthropic 和 Google 等提供商会缓存重复的系统消息
- 结果：第一个批次支付全额 token 成本，后续批次仅需为用户消息付费

对于包含大量批次的项目，这可以显著降低 token 成本。

## ICU MessageFormat 验证

`integrity` 命令会根据 CLDR 复数规则验证 ICU MessageFormat 的复数模式。如果你的源文件使用了如下 ICU 语法：

```json
"items": "{count, plural, one {# item} other {# items}}"
```

Rosetta 会验证翻译版本是否包含了目标语言环境所需的所有复数类别。例如，阿拉伯语需要六个类别（`zero`、`one`、`two`、`few`、`many`、`other`）——而不仅仅是 `one` 和 `other`。

运行 `i18n-rosetta integrity` 以检查所有语言环境的复数完整性。

## 术语强制执行

对于带有词典的辅导语言对（coached pairs），rosetta 会在翻译后运行术语检查。在通过质量门禁后，它会验证 LLM 是否实际使用了词典中要求的术语。

```
[TERM] en→fr: 2 term violation(s)
  • hero.title: "dashboard" → expected "tableau de bord" but got "panneau de contrôle"
```

术语违规属于**警告，而非阻塞性错误**。翻译结果仍会被写入磁盘。这是有意为之的——LLM 可能有充分的理由（如上下文、语法）选择替代词，如果因术语不匹配而阻塞流程，将会弊大于利。

要修复违规问题，请更新辅导词典或手动编辑本地化文件。

---

## 另请参阅

- [同步工作原理](/docs/concepts/how-sync-works) — 质量门禁在流水线中的位置
- [翻译方法](/docs/guides/translation-methods) — 输入到门禁的方法
- [书写系统转换器](/docs/concepts/script-converters) — 门禁后的书写系统转换
- [辅导数据](/docs/concepts/coaching-data) — 在上游提高翻译质量
- [翻译记忆库](/docs/concepts/translation-memory) — 缓存已验证的翻译
- [CLI 参考 — sync](/docs/reference/cli#sync) — 包含重试行为的同步标志
- [CLI 参考 — integrity](/docs/reference/cli#integrity) — ICU 复数审计