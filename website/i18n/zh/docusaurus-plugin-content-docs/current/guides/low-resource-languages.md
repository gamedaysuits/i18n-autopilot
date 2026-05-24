---
sidebar_position: 5
title: "支持低资源语言"
---
# 支持低资源语言

:::info 状态：积极开发中
Plains Cree (nêhiyawêwin) 的支持目前正在开发中。这里描述的工具、评估工具 (evaluation harness) 和排行榜现已真实可用，但 Cree 翻译管道尚未发布。发布后，这将作为其他具备 FST 基础设施的多式综合语 (polysynthetic languages) 和低资源语言的蓝图。
:::

## 尚未解决的问题

Google Translate 支持约 130 种语言。而地球上有超过 7,000 种口语。对于数千种语言——包括许多拥有活跃使用者社区的原住民语言——目前不存在商业翻译 API，没有收集到大型平行语料库 (parallel corpus)，也没有预训练模型能生成可靠的输出。

这种差距不会自行消失。低资源语言之所以缺乏资源，*是因为*商业机器翻译 (MT) 的经济效益无法覆盖它们。最需要这些工具的使用者，往往正是最不可能有人为他们开发这些工具的社区。

**rosetta 的诞生正是为了改变这一现状。**

[Method Leaderboard](/leaderboard) 是一项公开挑战：为服务不足的语言构建最佳翻译方法，通过可复现的评估来证明它，并夺取最高分。世界上的任何人都可以做出贡献——语言学家、ML 研究人员、社区语言工作者、学生、爱好者。问题尚未解决。基础设施已经就绪。排行榜正虚位以待。

---

## 为什么这很困难：多式综合构词法 (Polysynthetic Morphology)

大多数商业 MT 系统是为英语、法语和中文等语言设计的——这些语言的单词相对较短，句子由离散的 token 构建。但许多原住民语言（包括 Plains Cree）是**多式综合语 (polysynthetic)**：一个单词就能编码英语中需要一整句话才能表达的信息。

### Cree 示例

以这个 Plains Cree 单词为例：

> **ê-kî-nitawi-kîskinwahamâkosiyân**
> *"when I went to school" (我去上学的时候)*

这只是**一个单词**。它编码了时态（过去时）、方向（去）、词根（学习）、语态（被动/反身）和人称（第一人称单数）。主要基于英语训练的 LLM 对这种构词密度毫无直觉。

挑战接踵而至：

| 挑战 | 含义 |
|-----------|--------------|
| **构词复杂性 (Morphological complexity)** | 单个动词词根可以通过前缀、后缀和环缀生成数千种有效的屈折形式 |
| **有生/无生区别 (Animate/inanimate distinction)** | 名词在语法上分为有生 (animate) 或无生 (inanimate)——这会影响动词变位、指示代词和复数形式。这种分类并不总是遵循生物学上的有生性（*askiy* "地球" 是有生的；*maskisin* "鞋子" 也是有生的） |
| **旁指 (Obviation)** | 第三人称指代按接近度/显著性排序。"就近 (proximate)" 和 "旁指 (obviative)" 的区别在英语中没有对应概念 |
| **训练数据稀疏** | LLM 见过的 Plains Cree 文本极少。它们见过的文本可能混合了不同的方言（Y 方言、TH 方言）或正字法（SRO 与音节文字） |
| **无商业基准** | Google Translate 无法返回任何有用的内容。没有现成的 API 可供对比 |

这就是为什么多式综合语的翻译仍然是一个**开放的研究问题**——也是为什么一个可评分、可复现的排行榜如此重要。

---

## 现有技术：人们如何应对这一问题

### ALTLab FST

Plains Cree 最重要的计算资源是**有限状态转换器 (FST)**，由阿尔伯塔大学的 [Alberta Language Technology Lab (ALTLab)](https://altlab.artsrn.ualberta.ca/) 与挪威北极圈大学 (UiT) 的 [Giellatekno](https://giellatekno.uit.no/) 合作开发。

ALTLab FST 是一个**形态分析器和生成器**：给定一个屈折变化的 Cree 单词，它可以将其分解为词根和语法标签；给定词根加标签，它可以生成正确的屈折形式。这是确定性的——没有神经网络，没有幻觉，没有概率。如果 FST 接受一个单词，那么该单词在形态上就是有效的。

这就是为什么 rosetta 排行榜将 **FST 接受率 (FST Acceptance Rate)** 作为一个指标。如果一种翻译方法生成的单词被 FST 拒绝，那么它生成的 Cree 在形态上就是无效的——无论 chrF++ 分数有多高。

**主要 ALTLab 资源：**
- [itwêwina](https://itwewina.altlab.app/) — 由 FST 驱动的智能 Plains Cree-英语词典
- [Morphodict](https://github.com/UAlbertaALTLab/morphodict) — 开源的形态感知词典平台
- [crk-db](https://github.com/UAlbertaALTLab/crk-db) — Plains Cree 词汇数据库
- [21st Century Tools for Indigenous Languages](https://21c.tools/) — 更广泛的项目背景

### 全球 FST 与形态学注册表

Plains Cree 并不是唯一拥有高质量 FST 基础设施的语言。如果你想为其他低资源或形态复杂的语言开发翻译管道，可以利用这些成熟的全球中心：

* **[GiellaLT / Giellatekno](https://giellalt.github.io/) (挪威北极圈大学 UiT)：** 最大的开源 FST 形态分析器和生成器代码库，涵盖 100 多种语言。重点领域包括 Sámi 语言（`sme`、`smj`、`sma` 等）、乌拉尔语系（Komi、Erzya、Udmurt 等）以及其他少数民族/原住民语言。他们在 [GitHub 组织](https://github.com/giellalt/) 中托管了公开的处理过的文本语料库 (`corpus-xxx`)。
* **[The Apertium Project](https://www.apertium.org/)：** 一个开源的基于规则的机器翻译平台。Apertium 为数十种语言维护高度优化的 FST 形态分析器（使用 `lttoolbox` 和 `hfst`）以及双语词典，包括大量突厥语族语言（Kazakh、Tatar、Kyrgyz 等）和欧洲少数民族语言。所有资源均在 [Apertium 的 GitHub](https://github.com/apertium) 上公开。
* **[UniMorph (Universal Morphology)](https://unimorph.github.io/)：** 一个为 150 多种语言提供标准化形态范式的协作项目。数据集托管在 Hugging Face 的 [unimorph/universal_morphologies](https://huggingface.co/datasets/unimorph/universal_morphologies) 上。如果某语言没有编译好的 FST 二进制文件，可以使用 UniMorph 表作为静态数据库查找网关。
* **[加拿大国家研究委员会 (NRC)](https://nrc-digital-repository.canada.ca/)：** 提供加拿大原住民语言工具，包括 **Uqailaut** Inuktitut FST 形态分析器和庞大的 **Nunavut Hansard Parallel Corpus**（130 万对齐的英语-Inuktitut 句子对）。

### EdTeKLA 语料库

[EdTeKLA 研究组](https://spaces.facsci.ualberta.ca/edtekla/)（同样位于阿尔伯塔大学）从教育材料、音频转录和社区资源中收集整理了一个 Plains Cree 语料库。rosetta 评估数据集 [EDTeKLA Dev v1](/docs/eval/datasets) 衍生自这项工作，采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 许可。

### 人们尝试过或可以尝试的其他方法

排行榜与具体方法无关 (method-agnostic)。以下是针对低资源 MT 探索或提出的一些策略，你可以提交其中的任何一种：

| 方法 | 工作原理 | 优点 | 缺点 |
|----------|-------------|------|------|
| **Coached LLM prompting (辅导式 LLM 提示)** | 将语法规则、词典和示例对注入系统提示词中 | 迭代快，无需训练 | 质量上限受限于 LLM 的基础知识 |
| **Few-shot prompting (少样本提示)** | 包含经过验证的翻译作为上下文示例 | 有利于保持风格一致 | 上下文窗口小；示例**绝不能**来自评估数据 |
| **FST-gated pipeline (FST 门控管道)** | LLM 生成 → FST 验证 → 拒绝并重试无效形态 | 保证形态有效性 | 需要 FST 基础设施；重试循环会增加延迟和成本 |
| **Dictionary lookup + LLM (词典查找 + LLM)** | 强制使用双语词典中的已知术语，让 LLM 处理其余部分 | 减少已知术语的幻觉 | 词典覆盖率永远是不完整的 |
| **Fine-tuned model (微调模型)** | 在平行文本上微调开源模型（Llama、Mistral）——但不能使用评估数据 | 潜力最高，质量最好 | 需要平行语料库（稀缺）；成本高；有过度拟合风险 |
| **Chained models (链式模型)** | 模型 A 生成粗略翻译 → 模型 B 译后编辑 → 模型 C 评分 | 可以结合专家的优势 | 复杂；缓慢；成本高 |
| **Rule-based + LLM hybrid (基于规则 + LLM 混合)** | 对已知模式使用语言学规则，其余部分使用 LLM | 在规则适用处非常精确 | 需要深厚的语言学专业知识 |
| **Back-translation augmentation (回译增强)** | 通过将 Cree 翻译为英语生成合成平行数据，然后反向训练 | 低成本扩展训练数据 | 会放大现有的模型错误 |
| **Evolutionary approach (演化方法)** | 生成候选翻译，对其评分，对表现最好的进行变异，重复此过程 | 能够发现新颖的解决方案；可并行化 | 计算成本高；需要良好的适应度函数 |
| **Partial translation (部分翻译)** | 手动翻译具有代表性的样本，证明你的方法在风格上与之匹配，然后自动翻译剩余的大部分内容 | 结合了人类质量和机器规模 | 需要初期的人力投入 |
| **Manual JSON / exam grading (手动 JSON / 考试评分)** | 手工制作数据集 JSON 文件以测试语言考试中的学生答案，或根据黄金标准对一批人工翻译进行评分 | 零 ML 需求；适用于教育和 QA | 无法扩展以满足持续的翻译需求 |

### 它只是 JSON

评估工具接收 JSON 输入并输出 JSON 评分。[数据集格式](/docs/eval/datasets)非常简单：

```json
{
  "entries": [
    { "index": 0, "source_text": "Hello", "target_expected": "tânisi" },
    { "index": 1, "source_text": "Thank you", "target_expected": "kinanâskomitin" }
  ]
}
```

你可以手动构建它。你可以从电子表格导出它。你可以从语料库生成它。语言教师可以用它来给学生的翻译评分。翻译机构可以用它来对自由职业者进行基准测试。研究实验室可以用它来比较模型架构。评估工具不在乎 JSON 从何而来——它只负责评分。

而且，由于生产部署框架采用相同的插件接口，在评估工具中得分高的方法只需修改一次配置即可部署到你的网站。**证明它，然后使用它。**

可能性真的是无限的。**如果你有想法，就去构建它，运行评估工具，并提交你的分数。**

---

## rosetta 的作用

rosetta 提供基础设施层——你只需提供方法。

### 辅导系统 (Coaching system)

rosetta 的 `llm-coached` 方法允许你将语言学知识直接注入到 LLM 提示词中：

```json title=".rosetta/coaching/crk.json"
{
  "grammar_rules": [
    "Plains Cree is polysynthetic — a single word can express what English needs a full sentence for",
    "Animate/inanimate noun distinction affects verb conjugation, demonstratives, and pluralization",
    "Use SRO (Standard Roman Orthography) as the working script — syllabic conversion is handled by the deterministic converter",
    "Obviation: when two third-person referents appear, the less salient one takes obviative marking (-a suffix on nouns, -iyiwa on verbs)"
  ],
  "dictionary": {
    "home": "kīwēwin",
    "settings": "isi-nākatohkēwin",
    "search": "nānātawāpahtam",
    "welcome": "tānisi",
    "dashboard": "kīskinwahamākēwin-māsinahikan"
  },
  "style_notes": "Use formal register appropriate for educational and community contexts. Preserve English technical terms in parentheses when no Cree equivalent exists or is widely accepted."
}
```

辅导数据会被注入到 `en:crk` 语言对的每个 LLM 提示词中，为模型提供它原本不具备的结构化语言学上下文。有关完整规范，请参阅 [辅导数据 (Coaching Data)](/docs/concepts/coaching-data)。

### 语域 (Registers)

语域是系统提示词的一部分，用于引导语气、正式程度和正字法约定。rosetta 附带了一个 Plains Cree 语域：

```
nêhiyawêwin (Plains Cree). Use SRO (Standard Roman Orthography) as the working
script. Output will be converted to Syllabics via deterministic converter.
Professional register appropriate for educational and community contexts.
```

你可以在配置中覆盖它，以尝试不同的提示策略：

```json title="i18n-rosetta.config.json"
{
  "languages": {
    "crk": {
      "register": "Casual Plains Cree (Y-dialect). Use SRO. Prefer everyday vocabulary over formal or archaic terms. Address the reader directly."
    }
  }
}
```

不同的语域会产生不同的翻译风格——并在排行榜上获得不同的分数。每次提交都会记录所使用的确切语域和系统提示词（作为 SHA-256 哈希值记录在 [运行卡片 (run card)](/docs/eval/run-card) 中），因此实验是可复现的。

### 脚本转换

Plains Cree 使用两种文字书写：**标准罗马正字法 (SRO)** 和 **加拿大原住民音节文字 (Canadian Aboriginal Syllabics)**。rosetta 的处理管道如下：

1. LLM 翻译为 SRO（基于拉丁字母，LLM 处理得更好）
2. 质量网关验证 SRO 输出
3. 确定性转换器将 SRO 转换为音节文字
4. 转换后的文本写入磁盘

转换器处理所有 SRO 变音符号（长元音 ê、î、ô、â）并将它们映射到正确的音节字符。有关技术细节，请参阅 [脚本转换器 (Script Converters)](/docs/concepts/script-converters)。

### 评估循环

[评估工具 (eval harness)](/docs/eval/harness) 针对评估数据集运行你的方法，并生成带有评分的 [运行卡片 (run card)](/docs/eval/run-card)：

```bash
# Clone the harness
git clone https://github.com/gamedaysuits/gds-mt-eval-harness.git
cd gds-mt-eval-harness
pip install -e .

# Run a baseline experiment
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --model google/gemini-2.5-pro \
  --condition coached-v7

# Run with FST validation (if you have an FST binary)
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --fst-analyzer ./bin/crk-analyzer \
  --condition fst-gated-v1
```

`--condition` 标志是你选择的标签。它会显示在排行榜上，以便人们了解你使用的提示策略。评估工具会在运行卡片中记录完整的系统提示词，因此你的确切方法是可复现的。

:::tip 自由实验，提交最佳结果
评估工具专为快速迭代而设计。你可以使用不同的模型、辅导数据、语域和条件运行数十次实验。只有当你获得了引以为豪的结果时，再提交到排行榜。
:::

---

## OCAP 原则

rosetta 旨在支持原住民数据主权。[OCAP 原则](https://fnigc.ca/ocap-training/)（所有权、控制权、访问权、占有权）指导我们如何为原住民社区提供语言技术：

| 原则 | rosetta 如何支持 |
|-----------|------------------------|
| **所有权 (Ownership)** | 语言社区拥有其语言数据。rosetta 从不向外发送数据或将数据传输到我们的服务器 |
| **控制权 (Control)** | [API 方法](/docs/guides/serving-a-method) 允许社区托管自己的翻译管道——我们提供接口，他们控制实现 |
| **访问权 (Access)** | 社区决定谁可以使用他们的方法。API 可以通过身份验证进行限制 |
| **占有权 (Possession)** | 所有翻译数据都保留在你的项目文件系统中。[来源系统 (provenance system)](/docs/concepts/security) 会追踪每条翻译的来源 |

插件架构意味着社区可以构建一种在内部整合神圣或受限知识的方法，仅公开翻译 API，并保持对其语言资源的完全控制。

---

## 愿景：下一步是什么

Plains Cree 是首个目标。一旦管道得到验证且社区对质量感到满意，相同的架构将扩展到其他具备 FST 基础设施的多式综合语：

- **其他阿尔冈昆语族语言**：Woods Cree、Swampy Cree、Ojibwe、Blackfoot
- **因纽特语族语言**：Inuktitut、Inuinnaqtun（同样使用音节文字）
- **其他语系**：任何具有 FST 分析器的语言都可以使用 FST 门控管道

排行榜以语言对为范围。随着语言社区贡献新的评估数据集，新的排行榜赛道将自动开启。

**这是一份公开邀请。** 如果你从事低资源语言相关工作——无论是作为研究人员、社区成员、学生，还是仅仅出于关心——rosetta 都能为你提供工具，让你构建真实可用的东西，诚实地进行衡量，并与世界分享。[Method Leaderboard](/leaderboard) 期待你的提交。

---

## 另请参阅

- **[Method Leaderboard](/leaderboard)** — 提交你的分数并查看各方法的比较
- **[MT 评估 (MT Evaluation)](/docs/eval/)** — 什么是好方法，什么会被取消资格
- **[评估工具 (Eval Harness)](/docs/eval/harness)** — 如何运行实验
- **[评估数据集 (Evaluation Datasets)](/docs/eval/datasets)** — EDTeKLA Dev v1 和 FLORES+
- **[辅导数据 (Coaching Data)](/docs/concepts/coaching-data)** — 如何为 LLM 构建结构化语言学知识
- **[脚本转换器 (Script Converters)](/docs/concepts/script-converters)** — SRO 到音节文字的管道
- **[通过 API 提供方法 (Serving a Method via API)](/docs/guides/serving-a-method)** — 托管社区控制的翻译
- **[ALTLab](https://altlab.artsrn.ualberta.ca/)** — 阿尔伯塔语言技术实验室
- **[EdTeKLA](https://spaces.facsci.ualberta.ca/edtekla/)** — 教育技术、知识与语言研究组
- **[itwêwina 词典](https://itwewina.altlab.app/)** — 由 FST 驱动的 Plains Cree-英语词典