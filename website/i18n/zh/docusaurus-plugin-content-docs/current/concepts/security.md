---
sidebar_position: 4
title: "安全"
---
# 安全与防护

Rosetta 旨在在对抗性环境中保持安全 —— 在这种环境中，locale 数据可能来自不可信的来源，精心构造的文件名可能会逃逸目录边界，而且 LLM 的输出可能包含任何内容。

## 威胁模型

| 威胁 | 攻击向量 | 缓解措施 |
|--------|--------------|-----------|
| **Prototype pollution** | 精心构造的 JSON 键 (`__proto__`, `constructor`) | 在解析时拒绝 |
| **Path traversal** | 类似 `../../etc/passwd` 的 locale 代码 | 验证文件写入是否在配置的目录内 |
| **代码块损坏** | LLM 翻译了代码块内部的内容 | Unicode sentinel 屏蔽 |
| **幻觉键** | LLM 返回了未发送的键 | 响应验证 —— 仅写入被接受的键 |
| **Token 消耗失控** | 无限重试循环 | 通过 `maxRetries` 限制预算 |

## Prototype pollution 防护

所有 locale 键在处理前都会根据黑名单进行验证：

- `__proto__`
- `constructor`
- `prototype`

任何匹配这些模式的键都会被拒绝并报错。这可以防止攻击者使用精心构造的 locale 文件来修改 JavaScript 对象原型。

## 路径限制

在写入 locale 文件时，rosetta 会验证输出路径是否保持在配置的目录 (`localesDir`, `contentDir`) 内。Locale 代码会被净化 —— 像 `../../secrets` 这样的代码无法写入预期目录之外。

## 块保护

在 Markdown 内容翻译期间，结构化元素会在文本发送给 LLM 之前被替换为 Unicode sentinel 占位符：

1. **代码块** (围栏代码和行内代码) → sentinel
2. **Hugo shortcodes** (`{{< >}}`, `{{% %}}`) → sentinel  
3. **原生 HTML** → sentinel
4. **插值变量** (`{{ .Count }}`) → sentinel

翻译完成后，sentinel 会被替换回原始内容。LLM 永远不会看到代码块、shortcodes 或 HTML —— 因此它无法损坏它们。

## 响应验证

当 LLM 返回 JSON 响应时，rosetta 会验证：
- 只有在批处理中发送的键才会出现在响应中
- 没有注入额外的键
- 响应可以解析为有效的 JSON

幻觉键会被静默丢弃。这可以防止 LLM 输出将意外的翻译注入到你的 locale 文件中。

## Quality Gate

每条翻译在写入磁盘之前都会通过五项确定性检查进行验证。详情请参阅 [Quality Gate](/docs/concepts/quality-gate)。

## 指数退避

API 调用在遇到 429 (速率限制) 和 5xx (服务器错误) 响应时，会使用带有抖动 (jitter) 的指数退避。三次延迟递增的重试可防止在服务中断期间对 API 造成过度冲击。

## 请求超时

每个 API 请求都通过 `AbortController` 设置了 30 秒的超时时间。这可以防止同步过程在死连接上无限期挂起。

## 降级模式

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

安全特性由对抗性测试套件进行验证：

```bash
npm run test:redteam    # prototype pollution, path traversal, encoding attacks
```

---

## 另请参阅

- [架构](/docs/concepts/architecture) —— 三个部分的生态系统如何连接
- [CLI 参考 —— integrity](/docs/reference/cli#integrity) —— 完整性检查命令
- [CLI 参考 —— provenance](/docs/reference/cli#provenance) —— 来源审计命令
- [插件规范](/docs/reference/plugin-spec) —— 插件清单中的来源字段
- [Quality Gate](/docs/concepts/quality-gate) —— 翻译级别的安全检查