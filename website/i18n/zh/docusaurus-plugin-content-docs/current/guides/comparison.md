---
sidebar_position: 7
title: "对比"
---
# Rosetta 对比分析

i18n-rosetta 与大多数本地化工具属于不同的类别。以下是一份客观的对比。

## 市场现状

大多数本地化工具可以分为以下三类：

| 类别 | 示例 | 模式 |
|----------|----------|-------|
| **云端 TMS 平台** | Crowdin, Phrase, Locize, Tolgee | SaaS 仪表板 + 人工翻译 + 包月订阅 |
| **键值提取工具** | i18next-scanner, FormatJS CLI | 扫描源代码中的翻译函数调用 |
| **CLI 翻译引擎** | **i18n-rosetta** | 在你的项目中运行，直接翻译文件，无需云端账号 |

Rosetta 是一款 **CLI 翻译引擎** —— 它使用可配置的后端（LLMs、Google Translate、自定义插件）直接翻译你的语言环境文件。没有云端仪表板，没有人工翻译工作流，也没有月费。

---

## 功能对比

| 功能 | i18n-rosetta | Crowdin | Phrase | Locize |
|---------|:------------:|:-------:|:------:|:------:|
| **本地运行（无需云端账号）** | ✅ | ❌ | ❌ | ❌ |
| **零依赖** | ✅ | ❌ | ❌ | ❌ |
| **按语言对配置方法** | ✅ | ❌ | ❌ | ❌ |
| **自定义语言语域（Registers）** | ✅ | ❌ | ❌ | ❌ |
| **内容感知（屏蔽代码块）** | ✅ | ❌ | ❌ | ❌ |
| **人造语言与文字转换** | ✅ | ❌ | ❌ | ❌ |
| **插件架构** | ✅ | ❌ | ❌ | ❌ |
| **Markdown / 内容翻译** | ✅ | ✅ | ✅ | ❌ |
| **翻译记忆库** | ✅ | ✅ | ✅ | ✅ |
| **XLIFF 导出/导入** | ✅ | ✅ | ✅ | ❌ |
| **ICU 复数验证** | ✅ | ✅ | ✅ | ❌ |
| **术语强制执行** | ✅ | ✅ | ✅ | ❌ |
| **人工翻译工作流** | 基于 XLIFF | ✅ | ✅ | ✅ |
| **上下文编辑（可视化）** | ❌ | ✅ | ✅ | ✅ |
| **团队协作** | ❌ | ✅ | ✅ | ✅ |
| **文件格式支持** | JSON, TOML, YAML, MD, XLIFF | 50+ | 40+ | JSON |
| **定价** | 免费（支付你的 LLM 费用） | $0/月起 | $0/月起 | $0/月起 |

---

## 何时使用 Rosetta

**在以下情况下，Rosetta 是一个好选择：**

- 你希望将机器翻译集成到构建流水线中，而不是作为一个独立的工作流
- 你需要针对每种语言控制翻译方法（部分使用 LLMs，部分使用 Google Translate，其余使用自定义插件）
- 你需要翻译成没有 API 支持的语言（原住民语言、濒危语言、人造语言）
- 你需要确定性的文字输出（Cree Syllabics、Klingon pIqaD、Tengwar）
- 你希望零供应商锁定和零云端依赖
- 你是独立开发者或小型团队，不需要完整的 TMS 仪表板
- 你希望在没有云端订阅的情况下，通过 XLIFF 将内容移交给专业翻译人员

**在以下情况下，云端 TMS 是更好的选择：**

- 你有专业的人工翻译人员审查每个字符串（Rosetta 的 XLIFF 工作流比完整的 TMS 更简单）
- 你需要跨项目的翻译记忆库和术语表管理
- 你需要上下文可视化编辑（在你的 UI 中预览翻译）
- 你有一个大型团队，需要基于角色的访问控制
- 你需要支持 50 种以上的文件格式

---

## Rosetta 的独有功能

### 1. 自定义语域

每个语言对都会为 LLM 提供符合文化背景的语气指令：

```json
{
  "de": {
    "register": "Standard professional register. Use Sie-form for formal address."
  },
  "tl": {
    "register": "Educated Manila Taglish. Use Tagalog as the primary language but keep technical terms in English."
  },
  "tlh": {
    "register": "Warrior's honor. OVS grammar. Use Marc Okrand vocabulary."
  }
}
```

没有其他工具内置了 47 种预配置的语言语域，或者允许你为每个项目定义自定义语域。

### 2. 确定性文字转换器

Rosetta 内置了五个文字转换器，作为翻译后的钩子（hooks）运行——无需使用 LLM：

| 语言环境 | 转换 | 示例 |
|--------|-----------|---------|
| `crk` | SRO → Cree Syllabics | `nêhiyawêwin` → `ᓀᐦᐃᔭᐍᐏᐣ` |
| `sr` | Latin → Cyrillic | `Beograd` → `Београд` |
| `tlh` | 罗马音 → pIqaD | `tlhIngan Hol` → (pIqaD 字符) |
| `x-elvish-s` | Latin → Tengwar | Sindarin → Tengwar (Mode of Beleriand) |
| `x-kryptonian` | Latin → Kryptonian | 密码替换（需要字体） |

这些是纯粹的查找表转换器——具有确定性、可审计，且零 LLM 幻觉风险。

### 3. 内容感知屏蔽

在翻译 Markdown 或富文本内容时，Rosetta 会屏蔽以下内容：

- 围栏代码块 (` ``` `)
- 行内代码 (`` ` ` ``)
- Hugo 简码 (`{{</* */>}}`, `{{%/* */%}}`)
- 插值变量 (`{{ .Count }}`, `{name}`, `{{t('key')}}`)
- 原始 HTML 块

这些内容在翻译前会被替换为 Unicode 标记符（sentinel tokens），并在翻译后恢复。LLM 永远不会看到你的代码、简码或变量。

### 4. 指导式方法插件

对于没有 API 支持的语言，你可以构建一个指导式翻译方法：

1. 编写语言指导数据（语法规则、词汇、示例）
2. 将其打包为插件
3. 使用 [eval harness](https://github.com/gamedaysuits/gds-mt-eval-harness) 将其与参考翻译进行基准测试
4. 使用 `i18n-rosetta plugin install` 将其安装到你的项目中

这就是 Rosetta 处理 Plains Cree 的方式——你也可以用这种方式处理任何语言，包括那些尚未存在的语言。

---

## 总结

Rosetta 并不是 Crowdin 的替代品。它是为不同工作流设计的不同工具。如果你需要人工翻译，请使用 TMS。如果你需要一个只需一条命令即可翻译文件，并能针对每种语言控制翻译方法、模型和语域的 CLI 工具——请使用 Rosetta。