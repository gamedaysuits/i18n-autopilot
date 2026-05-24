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
| **源文本回显** | 模型返回了原始英文输入 | `[GATE] source-echo` |
| **幻觉循环** | 重复的三元组模式（例如 `"Qo' Qo' Qo'"`） | `[GATE] hallucination` |
| **长度膨胀** | 输出明显长于源文本 | `[GATE] length` |
| **书写系统合规性** | 目标语言区域的书写系统错误 | `[GATE] script` |

### 空/空白

拒绝空字符串、仅含空白字符或 `null` 的翻译。这可以捕获模型在处理困难键值时返回空内容的情况。

### 源文本回显

检测模型是否返回了英文源文本而不是进行翻译。这在短字符串和提示词不够明确时很常见。

### 幻觉循环

分析输出中的三元组（3 字符）模式。如果任何三元组相对于输出长度的重复次数超过阈值，则拒绝该翻译。这可以捕获类似 `"Qo' Qo' Qo' Qo' Qo'"` 的退化输出。

### 长度膨胀

拒绝输出长度超过 `maxLengthRatio × source length`（默认：4 倍）的翻译。这可以捕获模型产生幻觉，对简短输入生成大段文本的情况。

可通过配置文件中的 `maxLengthRatio` 进行配置。

### 书写系统合规性

对于配置了 `script` 字段的语言区域（例如平原克里语音节文字的 `"script": "cans"`），验证输出是否包含适合目标书写系统的非 ASCII 字符。如果阿拉伯语、中日韩 (CJK) 或音节文字语言区域的输出仅包含拉丁字母，则会被拒绝。

## 失败时会发生什么

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

重试预算上限由 `maxRetries` 决定（默认：3，可按语言配置）。这可以防止在持续失败的键上消耗过多的 token。

耗尽重试次数后，有问题的键会被记录并跳过。它们将在下一次 `sync` 运行时重新尝试。

## 提示词缓存

系统消息（语域、语法规则、样式说明）与用户消息（要翻译的键）是分开的。这种分离是刻意为之的：

- 对于特定的语言区域，系统消息**在所有批次中都是相同的**
- Anthropic 和 Google 等提供商会缓存重复的系统消息
- 结果：第一个批次支付全额 token 成本，后续批次仅支付用户消息的成本

这可以显著降低包含大量批次的项目 token 成本。

---

## 另请参阅

- [Sync 工作原理](/docs/concepts/how-sync-works) — 质量门禁在流水线中的位置
- [翻译方法](/docs/guides/translation-methods) — 输入到门禁的方法
- [书写系统转换器](/docs/concepts/script-converters) — 门禁后的书写系统转换
- [辅导数据](/docs/concepts/coaching-data) — 在上游提高翻译质量
- [CLI 参考 — sync](/docs/reference/cli#sync) — 包含重试行为的 sync 标志