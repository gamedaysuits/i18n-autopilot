---
slug: v3-2-quality-infrastructure
title: "v3.2.0：工业级质量基础设施"
authors: [curtisforbes]
tags: [release]
date: 2026-05-14
---
v3.2.0 是主打质量的版本。包含 702 个测试，163 个测试套件，对静默失败零容忍。

<!-- truncate -->

## 更新内容

### 质量门禁（5 项检查）

现在，每条翻译在写入磁盘之前，都会经过五项确定性的验证检查：

1. **空/空白** — 模型未返回任何内容
2. **源文本回显** — 模型返回了输入的英文
3. **幻觉循环** — 重复的 trigram 模式
4. **长度膨胀** — 输出比源文本长 4 倍以上
5. **书写系统合规性** — 语言环境的书写系统错误

只有通过全部五项检查的翻译才会被写入。失败的翻译会被记录日志并重试。

### 级联重试

当某个批次失败时，rosetta 会以逐渐减小的批次大小进行重试：

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the problem keys
```

### 安全加固

- **原型污染防护** — 在解析时拒绝 `__proto__`、`constructor` 键
- **路径遍历防护** — 精心构造的 locale 代码无法写入配置目录之外的位置
- **响应验证** — 仅接受已发送的键的返回结果

### 测试基础设施

| 测试套件 | 测试数量 | 覆盖范围 |
|-------|-------|---------------|
| 核心（8 个套件） | 280+ | Config、sync、CLI、watch、audit、pairs、format、init |
| 红队 | 89 | 对抗性输入、编码攻击 |
| 契约 | 120 | API 集成契约 |
| 性能 | 36 | 批处理优化、吞吐量回归 |
| 覆盖率 | 总计 702 | 完整流水线 |

### 提示词缓存

系统消息现在与用户消息分离，从而在 Anthropic 和 Google 等提供商上实现提示词缓存命中。这显著降低了多批次同步的 token 成本。

有关完整的技术细节，请参阅[质量门禁文档](/docs/concepts/quality-gate)和[安全文档](/docs/concepts/security)。