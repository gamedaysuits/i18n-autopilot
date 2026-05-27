# 集成指南

i18n-rosetta 与流行框架集成的分步设置。

---

## API 密钥设置

在与任何框架集成之前，你需要一个翻译 API 密钥。Rosetta 支持两个提供商：

### 选项 A：OpenRouter（推荐）

[OpenRouter](https://openrouter.ai) 为 200 多种 LLM 模型提供统一的 API。提供免费额度。

```bash
# Sign up at https://openrouter.ai, then:
export OPENROUTER_API_KEY=sk-or-v1-...

# Or add to .env.local:
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

最适合：内容密集的项目、Markdown 翻译以及需要内容感知屏蔽（代码块、短代码、插值变量）的项目。

### 选项 B：Google Translate

```bash
export GOOGLE_TRANSLATE_API_KEY=...
```

最适合：大量的键值对字符串（130 多种语言）。**不推荐**用于 Markdown 内容 —— Google Translate 无法识别代码块、短代码或插值变量。

要明确指定使用 Google Translate：

```bash
i18n-rosetta sync --method google-translate
```

> **提示**：如果仅设置了 `GOOGLE_TRANSLATE_API_KEY`（没有 OpenRouter 密钥），rosetta 会自动切换到 Google Translate。

---

## Hugo (TOML / YAML / Markdown)

### 项目结构

Hugo 使用 `i18n/` 进行字符串翻译，使用 `content/` 处理页面内容：

```
my-hugo-site/
├── i18n/
│   ├── en.toml             ← source of truth
│   ├── fr.toml
│   └── ja.toml
├── content/
│   ├── posts/
│   │   ├── hello.md        ← source (English)
│   │   ├── hello.fr.md
│   │   └── hello.ja.md
│   └── about.md
└── .env.local
```

### 设置

```bash
npm install --save-dev i18n-rosetta
```

```bash
# .env.local
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

创建 `i18n-rosetta.config.json`：

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./i18n",
  "contentDir": "./content",
  "format": "auto",
  "languages": ["fr", "de", "ja", "es", "ko", "zh"]
}
```

```bash
i18n-rosetta sync           # sync i18n string files + content files
i18n-rosetta sync --dry     # preview changes without writing
```

### 内容翻译详情

**Front matter**：支持 YAML (`---`) 和 TOML (`+++`) 分隔符。默认翻译 `title`、`description`、`summary`、`subtitle`、`caption` 和 `linkTitle`。所有其他字段（date、draft、tags、weight、slug 等）均会保留。可以在配置中使用 `translatableFields` 进行自定义。

**区块保护**：代码块、Hugo 短代码 (`{{< >}}`, `{{% %}}`)、内联代码和原始 HTML 会使用 Unicode 哨兵占位符自动屏蔽。它们会原样保留，不被修改。

**文件名约定**：遵循 Hugo 的按文件名翻译模式：
- `my-post.md` → `my-post.fr.md`
- `my-post.en.md` → `my-post.fr.md`（去除源语言后缀）

**跳过已有文件**：永远不会覆盖已存在的翻译文件。删除目标文件即可强制重新翻译。

### 复数形式

TOML 和 YAML 语言环境支持 CLDR 复数形式：

```toml
[items]
one = "{{ .Count }} item"
other = "{{ .Count }} items"
```

在内部表示为 `items.one` 和 `items.other` 以进行差异比较，然后在写入时重新序列化为正确的分段格式。

---

## next-intl (JSON)

### 项目结构

```
my-app/
├── messages/
│   └── en.json        ← source of truth
├── src/
│   ├── i18n/
│   │   ├── routing.ts
│   │   └── request.ts
│   └── middleware.ts
└── .env.local
```

### 设置

```bash
npm install --save-dev i18n-rosetta
```

创建 `i18n-rosetta.config.json`：

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./messages",
  "languages": ["fr", "de", "ja", "es", "ko", "zh", "pt", "ar"]
}
```

```bash
npx i18n-rosetta sync
```

创建 `messages/fr.json`、`messages/ja.json` 等 —— 完全翻译，并保留你的嵌套键结构。next-intl 会自动识别它们。

### 开发工作流

```json
{
  "scripts": {
    "dev": "i18n-rosetta watch & next dev",
    "i18n:sync": "i18n-rosetta sync",
    "i18n:audit": "i18n-rosetta audit"
  }
}
```

---

## react-i18next (JSON)

### 扁平文件结构（推荐）

```
locales/
├── en.json
├── fr.json
└── ja.json
```

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "languages": ["fr", "de", "ja"]
}
```

### 嵌套目录结构

如果你使用 `{locale}/{namespace}.json` 结构，请创建一个同步脚本来执行扁平化 → 翻译 → 反扁平化操作。有关详细信息，请参阅 [react-i18next 文档](https://react.i18next.com/)。