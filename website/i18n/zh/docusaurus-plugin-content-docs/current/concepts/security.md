---
sidebar_position: 4
title: "安全"
---
# 安全与防护

Rosetta 的设计旨在在对抗性环境中保持安全 —— 在这里，本地化数据可能来自不受信任的源，精心构造的文件名可能会突破目录边界，且 LLM 的输出可能包含任何内容。

## 威胁模型

| 威胁 | 攻击向量 | 缓解措施 |
|--------|--------------|-----------|
| **原型污染** | 精心构造的 JSON 键 (`__proto__`, `constructor`) | 在解析时拒绝 |
| **路径遍历** | 类似 `../../etc/passwd` 的区域代码 | 验证文件写入是否在配置的目录内 |
| **代码块损坏** | LLM 翻译了代码块内部的内容 | Unicode 哨兵屏蔽 |
| **幻觉键** | LLM 返回了未发送的键 | 响应验证 —— 仅写入允许的键 |
| **Token 消耗失控** | 无限重试循环 | 通过 `maxRetries` 限制预算 |

## 原型污染防护

在处理之前，所有本地化键都会根据阻止列表进行验证：

- `__proto__`
- `constructor`
- `prototype`

任何匹配这些模式的键都会被拒绝并报错。这可以防止攻击者使用精心构造的本地化文件来修改 JavaScript 对象原型。

## 路径限制

在写入本地化文件时，rosetta 会验证输出路径是否保持在配置的目录 (`localesDir`, `contentDir`) 内。区域代码会被清理 —— 像 `../../secrets` 这样的代码无法写入预期目录之外。

## 块保护

在 Markdown 内容翻译期间，结构化元素会在文本发送给 LLM 之前被替换为 Unicode 哨兵占位符：

1. **代码块**（代码围栏和行内代码）→ 哨兵
2. **Hugo shortcodes** (`{{< >}}`, `{{% %}}`) → 哨兵  
3. **原生 HTML** → 哨兵
4. **插值变量** (`{{ .Count }}`) → 哨兵

翻译完成后，哨兵会被替换回原始内容。LLM 永远不会看到代码块、shortcodes 或 HTML —— 因此它无法损坏这些内容。

## 响应验证

当 LLM 返回 JSON 响应时，rosetta 会验证：
- 响应中只出现批处理中发送的键
- 没有注入额外的键
- 响应可解析为有效的 JSON

幻觉键会被静默丢弃。这可以防止 LLM 输出将意外的翻译注入到你的本地化文件中。

## 质量门禁

在写入磁盘之前，每条翻译都会经过五项确定性检查的验证。详情请参阅 [质量门禁](/docs/concepts/quality-gate)。

## 指数退避

API 调用在遇到 429（速率限制）和 5xx（服务器错误）响应时，会使用带有抖动 (jitter) 的指数退避策略。通过增加延迟进行三次重试，可防止在服务中断期间对 API 造成过载请求。

## 请求超时

每个 API 请求都通过 `AbortController` 设置了 30 秒的超时时间。这可以防止同步过程在失效的连接上无限期挂起。

## 回退模式

当 API 不可用时，`--fallback` 会写入带有 `[EN]` 前缀的占位符，而不是真实的翻译：

```bash
npx i18n-rosetta sync --fallback
```

```json
{
  "hero.title": "[EN] Welcome to our platform"
}
```

这些占位符会在下次使用有效的 API 密钥同步时被自动检测并重新翻译。它们永远不会被视为“已翻译” —— `audit` 会将它们标记出来。

## 测试

安全属性由对抗性测试套件进行验证：

```bash
npm run test:redteam    # prototype pollution, path traversal, encoding attacks
```

---

## 另请参阅

- [架构](/docs/concepts/architecture) —— 三部分生态系统如何连接
- [CLI 参考 —— integrity](/docs/reference/cli#integrity) —— 完整性检查命令
- [CLI 参考 —— provenance](/docs/reference/cli#provenance) —— 来源审计命令
- [插件规范](/docs/reference/plugin-spec) —— 插件清单中的来源字段
- [质量门禁](/docs/concepts/quality-gate) —— 翻译级别的安全检查