---
sidebar_position: 4
title: "安全"
---
# 安全与防护

Rosetta 的设计旨在确保在对抗性环境中的安全性——在这种环境中，本地化数据可能来自不受信任的来源，精心构造的文件名可能会逃逸目录边界，而且 LLM 的输出可能包含任何内容。

## 威胁模型

| 威胁 | 攻击向量 | 缓解措施 |
|--------|--------------|-----------|
| **原型污染** | 精心构造的 JSON 键 (`__proto__`, `constructor`) | 在解析时拒绝 |
| **路径遍历** | 类似 `../../etc/passwd` 的语言代码 | 验证文件写入是否在配置的目录内 |
| **代码块损坏** | LLM 翻译了代码块内部的内容 | Unicode 哨兵屏蔽 |
| **幻觉键名** | LLM 返回了未发送的键 | 响应验证——仅写入被接受的键 |
| **Token 消耗失控** | 无限重试循环 | 通过 `maxRetries` 限制预算 |

## 原型污染防护

在处理之前，所有本地化键都会根据黑名单进行验证：

- `__proto__`
- `constructor`
- `prototype`

任何匹配这些模式的键都会被拒绝并报错。这可以防止攻击者利用精心构造的本地化文件来修改 JavaScript 对象原型。

## 路径限制

在写入本地化文件时，rosetta 会验证输出路径是否保持在配置的目录 (`localesDir`, `contentDir`) 内。语言代码会被净化——像 `../../secrets` 这样的代码无法写入预期目录之外。

## 块保护

在 Markdown 内容翻译期间，结构化元素会在文本发送给 LLM 之前被替换为 Unicode 哨兵占位符：

1. **代码块**（围栏代码块和行内代码）→ 哨兵
2. **Hugo 短代码** (`{{< >}}`, `{{% %}}`) → 哨兵  
3. **原生 HTML** → 哨兵
4. **插值变量** (`{{ .Count }}`) → 哨兵

翻译完成后，哨兵会被替换回原始内容。LLM 永远不会看到代码块、短代码或 HTML——因此它无法损坏它们。

## 响应验证

当 LLM 返回 JSON 响应时，rosetta 会验证：
- 响应中只出现批处理中发送的键
- 没有注入额外的键
- 响应可被解析为有效的 JSON

幻觉产生的键会被静默丢弃。这可以防止 LLM 输出将意外的翻译注入到你的本地化文件中。

## 质量门禁

每条翻译在写入磁盘之前，都会经过五项确定性检查的验证。详情请参阅[质量门禁](/docs/concepts/quality-gate)。

## 指数退避

API 调用在遇到 429（速率限制）和 5xx（服务器错误）响应时，会使用带有抖动的指数退避算法。通过逐渐增加延迟的三次重试，可以防止在服务中断期间频繁冲击 API。

## 请求超时

每个 API 请求都通过 `AbortController` 设置了 30 秒的超时时间。这可以防止同步过程在死连接上无限期挂起。

## 显式报错的翻译失败

当 API 不可用或翻译失败时，rosetta 会抛出带有可操作指南的显式错误，而不是静默写入垃圾数据。在同步过程中，绝不会写入带有 `[EN]` 前缀的占位符。

```
[ERR] Content sync for fr: no API key available.
  Set OPENROUTER_API_KEY in .env.local to translate content.
```

单个文件的失败不会停止整个同步过程——错误会被记录，流水线会继续处理下一个文件，从而让你在每次运行中获得最大进度。

## 同步后验证

在所有翻译完成后，rosetta 会从磁盘重新读取已写入的本地化文件并运行验证。这能捕获同步报告成功但翻译实际错误之间的偏差：

- **键一致性**——所有源键都存在于每个目标文件中
- **`[EN]` 标记**——来自先前运行的旧版回退标记
- **空翻译**——漏网的空值
- **字符合规性**——非拉丁语系本地化文件中仅包含 ASCII 的翻译
- **占位符保留**——ICU 占位符与源文件匹配

使用 `--no-verify` 跳过，或使用 `npx i18n-rosetta verify` 独立运行。

## 测试

安全属性由对抗性测试套件进行验证：

```bash
npm run test:redteam    # prototype pollution, path traversal, encoding attacks
```

---

## 另请参阅

- [架构](/docs/concepts/architecture)——三件套生态系统如何连接
- [CLI 参考 — integrity](/docs/reference/cli#integrity)——完整性检查命令
- [CLI 参考 — provenance](/docs/reference/cli#provenance)——来源审计命令
- [插件规范](/docs/reference/plugin-spec)——插件清单中的来源字段
- [质量门禁](/docs/concepts/quality-gate)——翻译级别的安全检查