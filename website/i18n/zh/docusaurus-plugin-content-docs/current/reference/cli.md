---
sidebar_position: 1
title: "CLI 参考"
---
# CLI 参考

## 命令

```
i18n-rosetta init              Interactive setup wizard (--yes for quick defaults)
i18n-rosetta sync              Translate & sync all locale files
i18n-rosetta watch             Auto-sync when the source file changes
i18n-rosetta audit             List all untranslated [EN] fallback values
i18n-rosetta lint              Scan source code for hardcoded strings
i18n-rosetta wrap              Auto-wrap hardcoded strings in t() calls (with undo)
i18n-rosetta seo <sub>         Generate hreflang, sitemap.xml, or JSON-LD schema
i18n-rosetta integrity         Audit locale files for format/encoding issues
i18n-rosetta status            Show pair configuration, plugins, and quality tiers
i18n-rosetta provenance        Audit translation resource licensing
i18n-rosetta plugin <sub>      Manage method plugins (install, remove, list)
```

运行 `i18n-rosetta <command> --help` 获取任何命令的详细帮助。

## 全局选项

```
--help, -h              Show help (global or per-command)
--version, -v           Print version and exit
--yes, -y               Skip interactive prompts, use defaults
--config <path>         Custom config file path
--dir <path>            Override locales directory
--content-dir <path>    Hugo/Docusaurus content directory for Markdown translation
--source <code>         Override source locale (default: en)
--model <model>         Override translation model
--method <method>       Translation method: llm, google-translate (default: from config)
--format <fmt>          Locale file format: json, toml, yaml, or auto
--dry                   Preview changes without writing files
```

---

## init

交互式设置向导，用于创建 `i18n-rosetta.config.json`。引导你完成源语言、目标语言、文件格式和翻译模型的配置。

```bash
i18n-rosetta init                          # interactive wizard
i18n-rosetta init --yes                    # skip wizard, use defaults
i18n-rosetta init --yes --langs fr,de,ja   # quick setup with specific languages
i18n-rosetta init --source en --dir ./i18n # overrides with defaults
```

**`--langs` 选项**：以逗号分隔的目标语言代码列表。跳过语言提示，并为每种语言应用默认的语域预设。与 `--yes` 结合使用可实现完全非交互式设置。

**语言预设**：当提示输入目标语言时，你可以输入预设名称：
- `european` → fr, de, es, it, pt, nl
- `asian` → ja, zh, ko
- `global` → fr, es, de, ja, zh, ko, pt, ar
- `nordic` → da, fi, nb, sv

混合使用预设和单独的代码：`european, ja` → fr, de, es, it, pt, nl, ja

---

## sync

在所有语言环境文件中翻译缺失、过时和回退的键。

```bash
i18n-rosetta sync                                   # translate everything
i18n-rosetta sync --dry                             # preview only
i18n-rosetta sync --force-keys "hero.title"         # force re-translate
i18n-rosetta sync --force-keys "a.title,a.subtitle" # multiple keys
i18n-rosetta sync --content-dir ./content           # include Hugo Markdown
i18n-rosetta sync --method google-translate          # force Google Translate
i18n-rosetta sync --fallback                         # write [EN] prefixes on failure
```

**变更检测**：rosetta 在 `.i18n-rosetta.lock` 中存储 SHA-256 哈希值。当源值发生变化时，下一次 sync 会自动重新翻译这些键。请提交 lock 文件，以便所有开发者共享基准。

---

## watch

当源语言环境文件发生变化时自动同步。持续运行直到被 `Ctrl+C` 中断。

```bash
i18n-rosetta watch
```

---

## audit

列出所有未翻译的带有 `[EN]` 前缀的回退值。如果发现任何未翻译的值，则以状态码 1 退出 —— 可用作 CI 门禁，在翻译不完整时使构建失败。

```bash
i18n-rosetta audit
```

---

## lint

扫描源代码中应使用 i18n 翻译调用的硬编码面向用户的字符串。自动检测你的框架（next-intl、react-i18next、vue-i18n、Hugo）。

```bash
i18n-rosetta lint                    # exits 1 if issues found
i18n-rosetta lint --warn-only        # always exits 0
i18n-rosetta lint --src ./app        # custom source directory
i18n-rosetta lint --min-length 4     # minimum string length to flag
```

**检测内容：**
- JSX 文本、`placeholder`、`alt`、`aria-label`、`title` 中的硬编码字符串
- 包含面向用户的内容但未导入 i18n 框架的文件
- 死键 —— 没有任何源文件引用的语言环境键
- 覆盖率得分 —— 通过 i18n 处理的字符串百分比

**排除项**：在项目根目录中创建 `.rosettaignore`（使用 glob 模式，例如 `.gitignore`）。

---

## wrap

自动将 `lint` 检测到的硬编码字符串包装在 `t()` 调用中。在修改文件前会自动创建备份。

```bash
i18n-rosetta wrap                    # auto-wrap with backup
i18n-rosetta wrap --dry              # preview wrapping changes
i18n-rosetta wrap --undo             # restore from .rosetta-backup/
```

**安全门禁：**
1. Git 干净状态检查（在 dry-run 模式下跳过）
2. 自动备份到 `.rosetta-backup/`
3. 每次写入文件前的差异 (Diff) 预览
4. 支持使用 `--undo` 从备份中恢复

---

## seo

为多语言网站生成 SEO 产物。

```bash
i18n-rosetta seo hreflang                                        # print hreflang tags
i18n-rosetta seo sitemap --base-url https://example.com --out sitemap.xml
i18n-rosetta seo jsonld --base-url https://example.com           # JSON-LD schema
```

| 子命令 | 输出 |
|------------|--------|
| `hreflang` | `<link rel="alternate" hreflang>` 标签 |
| `sitemap` | 多语言 `sitemap.xml` |
| `jsonld` | JSON-LD WebSite 语言 schema |

---

## integrity

检测已翻译的语言环境文件中的损坏和偏差。

```bash
i18n-rosetta integrity               # exits 1 if issues found
i18n-rosetta integrity --warn-only   # non-blocking
```

**检查内容：**
- 占位符损坏（例如，源文件中存在 `{name}` 但目标文件中缺失）
- 编码问题（乱码、无效的 Unicode）
- 未翻译的副本（目标值与源值完全相同）
- 孤立键（目标文件中存在但源文件中不存在的键）

---

## status

显示语言对配置、已安装的插件、质量层级和基准分数。

```bash
i18n-rosetta status
```

---

## provenance

审计所有已安装插件的翻译资源许可。

```bash
i18n-rosetta provenance
```

---

## plugin

管理翻译方法插件。插件是预打包的翻译方案，安装在 `.rosetta/methods/` 中。

```bash
i18n-rosetta plugin list                      # show installed plugins
i18n-rosetta plugin install ./my-method/      # install from local directory
i18n-rosetta plugin remove crk-coached-v1     # remove a plugin
```

有关插件清单格式，请参阅 [插件规范](/docs/reference/plugin-spec)。

---

## 三层流水线

结合使用 `lint`、`sync` 和 `audit`，实现极其可靠的 i18n：

```json title="package.json"
{
  "scripts": {
    "i18n:lint": "i18n-rosetta lint",
    "i18n:sync": "i18n-rosetta sync",
    "i18n:audit": "i18n-rosetta audit"
  }
}
```

| 层级 | 命令 | 触发时机 | 目的 |
|-------|---------|------|---------|
| **Lint** | `lint` | Pre-commit | 阻止包含硬编码字符串的提交 |
| **Sync** | `sync` | Post-commit / CI | 翻译缺失和更改的键 |
| **Audit** | `audit` | 构建阶段 | 如果任何语言环境不完整，则使部署失败 |

---

## 另请参阅

- [配置](/docs/getting-started/configuration) — 配置文件参考
- [翻译方法](/docs/guides/translation-methods) — 每对语言的方法选择
- [插件规范](/docs/reference/plugin-spec) — 插件清单格式
- [CI/CD 指南](/docs/guides/ci-cd) — 在流水线中自动化 CLI 命令
- [Sync 工作原理](/docs/concepts/how-sync-works) — 了解同步流水线
- [质量门禁](/docs/concepts/quality-gate) — 翻译如何被验证