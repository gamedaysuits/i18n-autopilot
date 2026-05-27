---
sidebar_position: 6
title: "疑难解答"
---
# 故障排除

i18n-rosetta 的常见问题与解决方案。

## API 与身份验证

### "OPENROUTER_API_KEY not found"

Rosetta 需要 API 密钥来进行 LLM 翻译。请将其设置为环境变量：

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
```

或者在 `.env` 文件中（如果你的项目加载 `.env` 文件）：

```
OPENROUTER_API_KEY=sk-or-v1-...
```

:::tip
如果你只有 Google Translate API 密钥，rosetta 会自动检测并使用 Google Translate 作为默认方法。无需更改配置。
:::

### 来自 OpenRouter 的 "401 Unauthorized"

你的 API 密钥无效或已过期。请在 [openrouter.ai/keys](https://openrouter.ai/keys) 进行验证。

### "429 Too Many Requests" / 速率限制

Rosetta 在内部使用指数退避算法处理速率限制。如果你经常触发速率限制：

1. 在配置中**减小批处理大小**：
   ```json
   { "batchSize": 15 }
   ```
2. **使用具有更高速率限制的模型**（例如，`google/gemini-3.5-flash` 的限制非常宽松）
3. 对于大批量的语言对，**使用更便宜/更快捷的方法** —— Google Translate 没有速率限制：
   ```json
   { "pairs": { "en:it": { "method": "google-translate" } } }
   ```

### 找不到模型 / 404 错误

直接 LLM 提供商（`openai`、`anthropic`、`gemini`）会在首次使用时验证你的模型字符串。如果你看到以下警告：

**"looks like an OpenRouter path"** — 你正在直接提供商处使用 OpenRouter 格式的模型（`google/gemini-3.5-flash`）。直接提供商使用纯模型名称：

```diff
- { "method": "gemini", "model": "google/gemini-3.5-flash" }
+ { "method": "gemini", "model": "gemini-2.5-flash" }
```

或者切换到 `llm` 方法以使用 OpenRouter：
```json
{ "method": "llm", "model": "google/gemini-3.5-flash" }
```

**"is an Anthropic/OpenAI/Gemini model"** — 你将模型发送给了错误的提供商：

```diff
- { "method": "gemini", "model": "claude-sonnet-4-6" }
+ { "method": "anthropic", "model": "claude-sonnet-4-6" }
```

**"not found in available models"** — 该模型可能已被弃用或拼写错误。Rosetta 会获取提供商的实时模型列表并提供替代建议。请查看提供商的文档以获取当前支持的模型名称。

:::tip 模型可能会被弃用
提供商会定期下线模型名称。如果在提供商更新后翻译突然失败，请检查 `[WARN]` 输出 —— 它会向你显示当前的替代方案。
:::

## 翻译质量

### 翻译结果与源语言相同

质量门禁（quality gate）会捕获此问题。如果翻译结果与英文原文完全相同，它将被拒绝并重试。如果问题仍然存在：

1. **检查模型** —— 某些模型在特定的语言对上表现不佳
2. **添加语域说明** —— 明确告诉模型要生成哪种语言：
   ```json
   {
     "languages": {
       "ja": { "name": "Japanese", "register": "Polite/formal Japanese" }
     }
   }
   ```
3. **尝试不同的模型** —— 从 `gpt-4o-mini` 切换到 `gpt-4o` 或 `google/gemini-2.5-pro`

### 输出的字符集错误（例如，日文输出了拉丁字母）

质量门禁的字符集规范检查会捕获大多数此类情况。如果问题仍然存在：

- 验证区域设置代码是否正确（是 `ja`，而不是 `jp`）
- 在 `register` 字段中添加明确的字符集说明：
  ```json
  { "register": "Japanese using hiragana, katakana, and kanji" }
  ```

### 输出中出现幻觉模式

重复的三元组模式（例如 "hello hello hello"）会被幻觉循环检测器捕获。如果输出出现乱码但通过了检测器：

1. **减小批处理大小** —— 较小的批次能产生更集中的输出
2. **使用更强大的模型** —— 较大的模型在非拉丁字符集上产生幻觉的概率更低
3. **添加辅导数据** —— 字典术语可以为翻译提供锚点

## 文件与格式问题

### "No locale files found"

Rosetta 会自动检测区域设置文件。如果找不到：

1. **检查 `localesDir`** —— 必须指向包含区域设置文件的目录：
   ```json
   { "localesDir": "./locales" }
   ```
2. **检查文件命名** —— 文件必须按区域设置代码命名：`en.json`、`fr.json` 等。
3. **检查格式** —— 支持的格式：JSON、嵌套 JSON、YAML、TOML

### 锁定文件冲突

如果 `.i18n-rosetta.lock` 陷入异常状态：

```bash
# Reset the lock file (next sync will retranslate everything)
rm .i18n-rosetta.lock
npx i18n-rosetta sync
```

:::warning
删除锁定文件意味着下一次同步将重新翻译所有键，而不仅仅是更改过的键。对于大型项目，这会带来较高的 API 成本。
:::

### 重新翻译特定键

如果个别翻译有误，并且你想在不删除锁定文件的情况下强制重新翻译它们：

```bash
# Re-translate a single key
npx i18n-rosetta sync --force-keys "hero.title"

# Re-translate multiple keys
npx i18n-rosetta sync --force-keys "nav.home,nav.about,footer.copyright"
```

`--force-keys` 标志会覆盖这些特定键的锁定文件哈希检查，强制重新翻译而不影响任何其他键。

### 内容翻译破坏了代码块

这本不应该发生 —— 代码块在翻译前会受到保护。如果确实发生了：

1. 验证代码块是否使用了标准的代码围栏（三个反引号）
2. 检查源 Markdown 中是否有未闭合的代码块
3. 提交 Issue —— 这是哨兵保护系统（sentinel shielding system）中的一个 bug

## CLI 问题

### `--watch` 无法检测到更改

文件监听使用的是 Node.js 原生的 `fs.watch`。已知问题：

- **网络驱动器** —— `fs.watch` 在 NFS/SMB 挂载上无法可靠工作
- **Docker 卷** —— 使用轮询模式或在容器内运行 rosetta
- **大型目录** —— 监听器会递归监控 `localesDir`；过深的目录树可能会超出操作系统的限制

### `npx` 运行的是旧版本

```bash
# Clear the npx cache
npx --yes i18n-rosetta@latest sync
```

或者全局安装：

```bash
npm install -g i18n-rosetta
i18n-rosetta sync
```

## 性能

### 多语言同步速度慢

Rosetta 默认按顺序翻译语言对。要加快多语言同步速度：

1. **对于大批量的语言对使用 Google Translate** —— 它比 LLM 翻译快 10-50 倍
2. **增加批处理大小**（最高 50，默认为 30）：
   ```json
   { "batchSize": 50 }
   ```
3. **使用更快的模型** —— `gpt-4o-mini` 比 `gpt-4o` 快得多

### API 成本高

- **检查批处理大小** —— 批次越大 = API 调用越少 = 成本越低
- **使用翻译记忆库（TM）** —— TM 默认开启。运行 `i18n-rosetta tm stats` 以验证其是否正常工作。如果在多次同步后看到条目数为 0，可能是你的 `.rosetta/` 目录权限有问题
- **使用提示词缓存（Prompt Caching）** —— Rosetta 会拆分系统/用户消息，以便在 Anthropic 和 Google 模型上命中缓存
- **对于第二梯队（Tier 2）语言使用 Google Translate** —— 请参阅 [翻译 30 种语言](/docs/tutorials/translate-30-languages) 教程

### 切换提供商后出现过时的翻译

如果你从一种翻译方法切换到另一种（例如，从 `llm` 切换到 `deepl`），对于源文本未更改的键，TM 缓存可能仍会提供来自先前方法的旧翻译。缓存键包含方法名称，因此大多数情况会自动处理。但是，如果你在同一种方法内更改了 `model`：

```bash
# Force fresh translations for all keys
i18n-rosetta sync --no-tm

# Or clear the cache entirely and re-sync
i18n-rosetta tm clear --yes
i18n-rosetta sync
```

有关缓存键设计的详细信息，请参阅 [翻译记忆库](/docs/concepts/translation-memory)。

## 仍然遇到问题？

- **[GitHub Issues](https://github.com/gamedaysuits/i18n-rosetta/issues)** —— 搜索现有问题或提交新问题
- **[架构文档](/docs/concepts/architecture)** —— 了解系统设计
- **[质量门禁](/docs/concepts/quality-gate)** —— 验证机制的底层原理