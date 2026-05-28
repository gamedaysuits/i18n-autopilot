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
i18n-rosetta verify            Verify translations are present and correct (CI gate)
i18n-rosetta status            Show pair configuration, plugins, and quality tiers
i18n-rosetta provenance        Audit translation resource licensing
i18n-rosetta plugin <sub>      Manage method plugins (install, remove, list)
i18n-rosetta fonts <sub>       Download web fonts for PUA script converters
i18n-rosetta tm <sub>          Manage Translation Memory cache (stats, clear)
i18n-rosetta xliff <sub>       Export/import XLIFF 1.2 for professional review
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
--dry, --dry-run        Preview changes without writing files
--concurrency <n>       Max parallel API calls (sets both JSON and content, default: 12)
--json-concurrency <n>  Max parallel locale translations for JSON keys (default: 50)
--content-concurrency <n> Max parallel API calls for content translation (default: 12)
--force-content         Re-translate all content files (clears content lock)
--force-keys <keys>     Comma-separated dot-notation keys to force re-translate
--no-tm                 Skip Translation Memory cache for this sync run
--no-verify             Skip post-sync verification pass
--locale <code>         Target locale (xliff export, tm clear)
--quiet                 Errors and warnings only — suppress banner, progress bar, and info lines
--json                  Machine-readable NDJSON output — one JSON object per event
```

---

## init

交互式设置向导，用于创建 `i18n-rosetta.config.json`。引导你完成源语言、目标语言、文件格式和翻译模型的设置。

```bash
i18n-rosetta init                          # interactive wizard
i18n-rosetta init --yes                    # skip wizard, use defaults
i18n-rosetta init --yes --langs fr,de,ja   # quick setup with specific languages
i18n-rosetta init --source en --dir ./i18n # overrides with defaults
```

**`--langs` 选项**：逗号分隔的目标语言代码列表。跳过语言提示并为每种语言应用默认的语域预设。与 `--yes` 结合使用可实现完全非交互式设置。

**语言预设**：当提示输入目标语言时，你可以输入预设名称：
- `european` → fr, de, es, it, pt, nl
- `asian` → ja, zh, ko
- `global` → fr, es, de, ja, zh, ko, pt, ar
- `nordic` → da, fi, nb, sv

混合使用预设和单独的代码：`european, ja` → fr, de, es, it, pt, nl, ja

---

## sync

翻译所有语言环境文件中缺失和过时的键。默认在同步后运行验证。

```bash
i18n-rosetta sync                                   # translate everything
i18n-rosetta sync --dry-run                         # preview only
i18n-rosetta sync --force-keys "hero.title"         # force re-translate
i18n-rosetta sync --force-keys "a.title,a.subtitle" # multiple keys
i18n-rosetta sync --force-content                   # re-translate all Markdown/MDX
i18n-rosetta sync --content-dir ./content           # include Hugo Markdown
i18n-rosetta sync --method google-translate          # force Google Translate
i18n-rosetta sync --concurrency 20                  # 20 parallel API calls (both phases)
i18n-rosetta sync --json-concurrency 30              # 30 parallel locale translations (JSON)
i18n-rosetta sync --content-concurrency 8            # 8 parallel content translations
i18n-rosetta sync --no-verify                        # skip post-sync verification
i18n-rosetta sync --no-tm                            # skip cache, fresh API calls
```

**翻译记忆库 (Translation Memory)**：默认情况下，`sync` 会加载 `.rosetta/tm.json` 并为未更改的源值提供缓存的翻译。使用 `--no-tm` 绕过缓存（在切换翻译提供商或调试质量时很有用）。请参阅 [翻译记忆库](/docs/concepts/translation-memory)。

**更改检测**：rosetta 在 `.i18n-rosetta.lock` 中存储 SHA-256 哈希值。当源值发生更改时，下一次同步会自动重新翻译这些键。请提交锁定文件，以便所有开发者共享基线。

**并行处理**：JSON 键翻译和内容翻译均并行运行。JSON 语言环境会同时进行翻译（默认：50 个并发语言环境），每个语言环境内的批次也会并行处理（4 个并发批次）。内容翻译（Markdown、MDX、博客文章）在扁平的工作项池中运行（默认：12 个并发 API 调用）。可使用 `--json-concurrency`、`--content-concurrency` 或 `--concurrency`（同时设置两者）进行覆盖。

**输出**：同步操作会显示版本横幅、格式/框架检测、成本估算以及每个语言环境的进度条：

```
i18n-rosetta v3.3.1

[INFO] Detected format: json (auto)
[INFO] Source: en.json (2,847 keys)
[INFO] Pairs: es-MX:llm, fr:deepl

[INFO] es-MX.json — 2,847 missing
     ████████████████████████████████ 2,847/2,847 keys
[INFO] fr.json — 2,847 missing
     ████████████████████████████████ 2,847/2,847 keys
[OK] Synced 5,694 keys total.
```

进度条在每个批次（约 80 个键）后就地更新。使用 `--quiet` 仅显示错误/警告，或使用 `--json` 获取机器可读的 NDJSON 输出。两者都会抑制进度条和横幅的显示。

---

## watch

当源语言环境文件更改时自动同步。持续运行直到被 `Ctrl+C` 中断。

```bash
i18n-rosetta watch
```

---

## audit

列出之前运行中所有未翻译的带有 `[EN]` 前缀的回退值。如果发现任何此类值，则以代码 1 退出——可作为 CI 门控，在翻译不完整时使构建失败。

```bash
i18n-rosetta audit
```

---

## verify

从磁盘重新读取所有语言环境文件，并验证翻译是否确实存在且正确。这与每次 `sync` 结束时自动运行的验证相同（除非传递了 `--no-verify`）。

```bash
i18n-rosetta verify                    # verify all locale files
i18n-rosetta verify --warn-only        # non-blocking
i18n-rosetta verify && echo "All good" # CI gate
```

**检查内容：**
- 键一致性——所有源键都存在于每个目标中
- 之前运行留下的 `[EN]` 回退标记
- 空翻译
- 脚本合规性——非拉丁语系语言环境应具有非 ASCII 翻译
- 占位符保留——ICU 占位符与源匹配
- 编码问题——BOM 标记、不可见字符
- 源回显——与源完全相同的值（警告）

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
- 死键——没有源文件引用的语言环境键
- 覆盖率得分——通过 i18n 处理的字符串百分比

**排除项**：在项目根目录中创建 `.rosettaignore`（glob 模式，如 `.gitignore`）。

---

## wrap

自动将 `lint` 检测到的硬编码字符串包装在 `t()` 调用中。在修改文件之前自动创建备份。

```bash
i18n-rosetta wrap                    # auto-wrap with backup
i18n-rosetta wrap --dry              # preview wrapping changes
i18n-rosetta wrap --undo             # restore from .rosetta-backup/
```

**安全门控：**
1. Git 干净状态检查（在试运行中跳过）
2. 自动备份到 `.rosetta-backup/`
3. 每次写入文件前的差异预览
4. 支持 `--undo` 从备份恢复

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

检测已翻译语言环境文件中的损坏和偏差。

```bash
i18n-rosetta integrity               # exits 1 if issues found
i18n-rosetta integrity --warn-only   # non-blocking
```

**检查内容：**
- 占位符损坏（例如，源中存在 `{name}` 但在目标中缺失）
- 编码问题（乱码、无效的 Unicode）
- 未翻译的副本（目标值与源完全相同）
- 孤立键（存在于目标中但不存在于源中的键）
- ICU MessageFormat 复数类别完整性（例如，阿拉伯语需要 6 个类别）

---

## tm

管理翻译记忆库缓存 (`.rosetta/tm.json`)。TM 存储以前的翻译，并在后续同步时提供这些翻译，而不是调用 API。

```bash
i18n-rosetta tm stats                  # show cache statistics
i18n-rosetta tm clear                  # clear cache (with confirmation)
i18n-rosetta tm clear --yes            # clear without confirmation
i18n-rosetta tm clear --locale fr      # clear only French entries
```

| 子命令 | 输出 |
|------------|--------|
| `stats` | 条目数量、文件大小、按语言环境细分 |
| `clear` | 删除缓存文件（全部或按语言环境） |

| 选项 | 效果 |
|--------|--------|
| `--locale <code>` | 仅清除一个语言环境的条目 |
| `--yes` | 跳过确认提示 |

有关 TM 的工作原理以及何时清除它的信息，请参阅 [翻译记忆库](/docs/concepts/translation-memory)。

---

## xliff

导出和导入 XLIFF 1.2 文件以供专业译员审校。XLIFF 是 memoQ、SDL Trados 和 Phrase 等 CAT 工具支持的通用交换格式。

```bash
i18n-rosetta xliff export --locale fr                   # export French XLIFF
i18n-rosetta xliff export --locale ja --out ./review/   # custom output path
i18n-rosetta xliff import .rosetta/xliff/fr.xliff       # import reviewed file
i18n-rosetta xliff import ./reviewed.xliff --dry        # preview import
```

| 子命令 | 输出 |
|------------|--------|
| `export` | 从源 + 目标语言环境文件生成 `.xliff` |
| `import` | 将已审校的 `.xliff` 翻译合并到语言环境文件中 |

| 选项 | 效果 |
|--------|--------|
| `--locale <code>` | 导出的目标语言环境（必填） |
| `--out <path>` | 自定义输出路径或目录 |
| `--dry` | 预览导入而不写入 |

有关完整工作流，请参阅 [与专业译员合作](/docs/guides/professional-translators)。

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

管理翻译方法插件。插件是安装到 `.rosetta/methods/` 的预打包翻译方案。

```bash
i18n-rosetta plugin list                      # show installed plugins
i18n-rosetta plugin install ./my-method/      # install from local directory
i18n-rosetta plugin remove crk-coached-v1     # remove a plugin
```

有关插件清单格式，请参阅 [插件规范](/docs/reference/plugin-spec)。

---

## fonts

为人造语言脚本转换器下载并管理 PUA Web 字体。使用私有使用区 (Private Use Area) 字符的语言（克林贡语、辛达林语、氪星语）需要自定义 Web 字体来渲染其脚本。此命令从经过验证的开源仓库下载它们。

```bash
i18n-rosetta fonts list                           # show needed fonts
i18n-rosetta fonts install                        # download all needed fonts
i18n-rosetta fonts install --css                  # also generate CSS snippet
i18n-rosetta fonts install --dir ./public/fonts   # custom output directory
```

| 子命令 | 输出 |
|------------|--------|
| `list` | 显示需要哪些 PUA 字体及其安装状态 |
| `install` | 为已配置的语言下载字体 |

| 选项 | 效果 |
|--------|--------|
| `--dir <path>` | 覆盖字体输出目录（根据项目类型自动检测） |
| `--css` | 在字体旁边生成 `conlang-fonts.css` 代码片段 |
| `--config <path>` | 配置文件路径（用于检测哪些语言需要字体） |

**自动检测：** 输出目录根据你的项目结构推断：
- **Docusaurus** → `static/fonts/` 或 `website/static/fonts/`
- **Hugo** → `static/fonts/`
- **默认** → `public/fonts/`

**原生 Unicode 转换器**（`crk` → 克里音节文字，`sr` → 塞尔维亚西里尔文）不需要安装字体。

有关 PUA 字体的完整详细信息，请参阅 [人造语言、脚本与正字法](/docs/guides/conlangs-scripts-orthography)。

## 三层流水线

将 `lint`、`sync` 和 `audit` 结合使用，实现无懈可击的 i18n：

```json title="package.json"
{
  "scripts": {
    "i18n:lint": "i18n-rosetta lint",
    "i18n:sync": "i18n-rosetta sync",
    "i18n:audit": "i18n-rosetta audit"
  }
}
```

| 层级 | 命令 | 时机 | 目的 |
|-------|---------|------|---------|
| **Lint** | `lint` | 提交前 (Pre-commit) | 阻止包含硬编码字符串的提交 |
| **Sync** | `sync` | 提交后 / CI | 翻译缺失和更改的键 |
| **Verify** | `verify` | 同步后 / CI | 确认翻译存在且正确 |
| **Audit** | `audit` | 构建步骤 | 如果任何语言环境具有 `[EN]` 标记，则使部署失败 |

---

## 另请参阅

- [配置](/docs/getting-started/configuration) — 配置文件参考
- [翻译方法](/docs/guides/translation-methods) — 每个语言对的方法选择
- [翻译记忆库](/docs/concepts/translation-memory) — 缓存和节省成本
- [与专业译员合作](/docs/guides/professional-translators) — XLIFF 工作流
- [插件规范](/docs/reference/plugin-spec) — 插件清单格式
- [CI/CD 指南](/docs/guides/ci-cd) — 在流水线中自动化 CLI 命令
- [同步工作原理](/docs/concepts/how-sync-works) — 了解同步流水线
- [质量门控](/docs/concepts/quality-gate) — 如何验证翻译