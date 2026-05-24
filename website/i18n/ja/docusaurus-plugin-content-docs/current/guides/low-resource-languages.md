---
sidebar_position: 5
title: "低リソース言語をサポート"
---
# 低資源言語のサポート

:::info ステータス: アクティブな開発中
Plains Cree (nêhiyawêwin) のサポートは現在開発中です。ここで説明されているツール、評価ハーネス、およびリーダーボードは実在し、現在使用可能ですが、Cree の翻訳パイプラインはまだリリースされていません。リリースされた際には、これが FST インフラストラクチャを持つ他の複統合的 (polysynthetic) な言語や低資源言語のブループリントとして機能します。
:::

## 未解決の問題

Google Translate は約130の言語をサポートしています。地球上では7,000以上の言語が話されています。活発な話者コミュニティを持つ多くの先住民言語を含む何千もの言語において、商用の翻訳 API は存在せず、大規模な対訳コーパスも構築されておらず、信頼できる出力を生成する事前学習済みモデルもありません。

これは自然に埋まるギャップではありません。低資源言語が低資源である*理由*は、商用 MT (機械翻訳) の経済圏がそこに及ばないからです。これらのツールを最も必要としている話者たちは、自分たちのためにツールが構築される可能性が最も低いコミュニティでもあります。

**rosetta はそれを変えるために構築されました。**

[Method Leaderboard](/leaderboard) はオープンな課題です。十分なサービスを受けていない言語のために最高の翻訳メソッドを構築し、再現可能な評価でそれを証明し、トップスコアを獲得してください。言語学者、ML 研究者、コミュニティの言語ワーカー、学生、趣味で活動する人など、世界中の誰もが貢献できます。問題は未解決です。インフラストラクチャはここにあります。リーダーボードが待っています。

---

## なぜこれが難しいのか: 複統合的な形態論

ほとんどの商用 MT システムは、英語、フランス語、中国語などの言語向けに設計されています。これらの言語は単語が比較的短く、文は個別のトークンから構築されます。しかし、Plains Cree を含む多くの先住民言語は**複統合的 (polysynthetic)** です。つまり、英語では文全体として表現される内容を、1つの単語にエンコードすることができます。

### Cree の例

Plains Cree の単語を考えてみましょう:

> **ê-kî-nitawi-kîskinwahamâkosiyân**
> *"私が学校に行ったとき"*

これは**1つの単語**です。これには、時制 (過去)、方向 (〜へ行く)、語根 (学ぶ)、態 (受動態/再帰態)、および人称 (一人称単数) がエンコードされています。主に英語でトレーニングされた LLM は、このような形態論的な密度に対する直感を持っていません。

課題はさらに重なります:

| 課題 | 意味 |
|-----------|--------------|
| **形態論的な複雑さ (Morphological complexity)** | 1つの動詞の語根から、接頭辞、接尾辞、接周辞を通じて何千もの有効な活用形が生成される可能性があります |
| **有生/無生の区別 (Animate/inanimate distinction)** | 名詞は文法的に有生 (animate) または無生 (inanimate) に分類されます。これは動詞の活用、指示代名詞、および複数形に影響を与えます。この分類は必ずしも生物学的な有生性に従うわけではありません (*askiy* 「地球」は有生であり、*maskisin* 「靴」も有生です) |
| **近接/忌避 (Obviation)** | 三人称の言及は、近接性/顕著性によってランク付けされます。「近接 (proximate)」と「忌避 (obviative)」の区別は、英語には相当するものがありません |
| **スパースなトレーニングデータ (Sparse training data)** | LLM は Plains Cree のテキストをほとんど見たことがありません。見たことがあるものも、方言 (Y方言、TH方言) や正書法 (SRO と音節文字) が混ざっている可能性があります |
| **商用ベースラインの欠如 (No commercial baseline)** | Google Translate は有用な結果を返しません。比較対象となる既存の API はありません |

これが、複統合的言語の翻訳が依然として**オープンな研究課題**である理由であり、スコア化された再現可能なリーダーボードが重要である理由です。

---

## 先行技術: 人々はこれにどうアプローチしてきたか

### ALTLab FST

Plains Cree にとって最も重要な計算リソースは、アルバータ大学の [Alberta Language Technology Lab (ALTLab)](https://altlab.artsrn.ualberta.ca/) が、ノルウェー北極大学 (UiT) の [Giellatekno](https://giellatekno.uit.no/) と協力して開発した**有限状態トランスデューサー (FST: finite-state transducer)** です。

ALTLab FST は**形態素解析器および生成器 (morphological analyzer and generator)** です。活用された Cree の単語が与えられると、それを語根と文法タグに分解でき、語根とタグが与えられると、正しい活用形を生成できます。これは決定論的であり、ニューラルネットワークも、ハルシネーションも、確率も関係ありません。FST が単語を受け入れた場合、その単語は形態論的に有効です。

これが、rosetta のリーダーボードが指標として **FST Acceptance Rate (FST 受容率)** を追跡している理由です。FST が拒否する単語を生成する翻訳メソッドは、chrF++ スコアがどうであれ、形態論的に無効な Cree を生成していることになります。

**主要な ALTLab リソース:**
- [itwêwina](https://itwewina.altlab.app/) — FST を搭載したインテリジェントな Plains Cree–英語辞典
- [Morphodict](https://github.com/UAlbertaALTLab/morphodict) — オープンソースの形態論を考慮した辞書プラットフォーム
- [crk-db](https://github.com/UAlbertaALTLab/crk-db) — Plains Cree 語彙データベース
- [21st Century Tools for Indigenous Languages](https://21c.tools/) — より広範なプロジェクトのコンテキスト

### グローバル FST および形態論レジストリ

高品質な FST インフラストラクチャを持つ言語は Plains Cree だけではありません。他の低資源言語や形態論的に複雑な言語の翻訳パイプラインを開発したい場合は、以下の確立されたグローバルハブを活用できます:

* **[GiellaLT / Giellatekno](https://giellalt.github.io/) (ノルウェー北極大学 UiT):** 100以上の言語をカバーする、オープンソースの FST 形態素解析器および生成器の最大のリポジトリです。重点分野には、サーミ語 (`sme`、`smj`、`sma` など)、ウラル語族 (コミ語、エルジャ語、ウドムルト語など)、およびその他の少数民族/先住民言語が含まれます。彼らは [GitHub Organization](https://github.com/giellalt/) で公開の処理済みテキストコーパス (`corpus-xxx`) をホストしています。
* **[The Apertium Project](https://www.apertium.org/):** オープンソースのルールベース機械翻訳プラットフォームです。Apertium は、数十の言語 (カザフ語、タタール語、キルギス語などのテュルク諸語の大規模なスイートや、ヨーロッパの少数言語を含む) 向けに、高度に最適化された FST 形態素解析器 (`lttoolbox` および `hfst` を使用) と対訳辞書を維持しています。すべてのリソースは [Apertium の GitHub](https://github.com/apertium) で公開されています。
* **[UniMorph (Universal Morphology)](https://unimorph.github.io/):** 150以上の言語に標準化された形態論パラダイムを提供する共同プロジェクトです。データセットは Hugging Face の [unimorph/universal_morphologies](https://huggingface.co/datasets/unimorph/universal_morphologies) でホストされています。ある言語のコンパイル済み FST バイナリが利用できない場合、UniMorph のテーブルを静的なデータベース検索ゲートとして使用できます。
* **[National Research Council Canada (NRC)](https://nrc-digital-repository.canada.ca/):** カナダの先住民言語向けのツールを提供しています。これには、イヌクティトゥット語の **Uqailaut** FST 形態素解析器や、大規模な **Nunavut Hansard Parallel Corpus** (130万の英語-イヌクティトゥット語の対訳文ペア) が含まれます。

### EdTeKLA コーパス

[EdTeKLA research group](https://spaces.facsci.ualberta.ca/edtekla/) (同じくアルバータ大学) は、教材、音声の書き起こし、コミュニティのソースから Plains Cree の言語コーパスを構築しました。rosetta の評価データセット [EDTeKLA Dev v1](/docs/eval/datasets) はこの作業から派生したものであり、[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) でライセンスされています。

### 人々が試した、または試すことができるその他のアプローチ

リーダーボードはメソッドに依存しません。低資源 MT のために探求または提案されている戦略を以下に示します。これらのいずれも提出可能です:

| アプローチ | 仕組み | メリット | デメリット |
|----------|-------------|------|------|
| **Coached LLM prompting** | 文法規則、辞書、および例文ペアをシステムプロンプトに注入する | 反復が速く、トレーニングが不要 | 品質の上限が LLM の基礎知識に制限される |
| **Few-shot prompting** | 検証済みの翻訳をコンテキスト内の例として含める | 一貫したスタイルに有効 | コンテキストウィンドウが小さい。例は評価データから取得してはならない |
| **FST-gated pipeline** | LLM が生成 → FST が検証 → 無効な形態論を拒否して再試行する | 形態論的な有効性を保証する | FST インフラストラクチャが必要。再試行ループによりレイテンシとコストが増加する |
| **Dictionary lookup + LLM** | 対訳辞書から既知の用語を強制し、残りを LLM に処理させる | 既知の用語のハルシネーションを減らす | 辞書の網羅性は常に不完全である |
| **Fine-tuned model** | オープンモデル (Llama、Mistral) を対訳テキストでファインチューニングする (ただし評価データは使用しない) | 最高の品質になる可能性がある | 対訳コーパスが必要 (希少)。高コスト。過学習のリスクがある |
| **Chained models** | モデル A が大まかな翻訳を生成 → モデル B がポストエディット → モデル C がスコアリングする | 専門的な強みを組み合わせることができる | 複雑。遅い。高コスト |
| **Rule-based + LLM hybrid** | 既知のパターンには言語学的ルールを使用し、それ以外には LLM を使用する | ルールが適用される箇所では正確 | 深い言語学的専門知識が必要 |
| **Back-translation augmentation** | Cree→英語に翻訳して合成対訳データを生成し、その逆でトレーニングする | トレーニングデータを安価に拡張できる | 既存のモデルのエラーを増幅させる |
| **Evolutionary approach** | 翻訳候補を生成し、スコアリングし、最も成績の良いものを変異させ、繰り返す | 斬新な解決策を発見できる。並列化可能 | 計算コストが高い。優れた適応度関数が必要 |
| **Partial translation** | 代表的なサンプルを手動で翻訳し、メソッドがそのスタイルに一致することを証明してから、残りの大部分を自動翻訳する | 人間の品質と機械のスケールを組み合わせる | 初期段階で人間の労力が必要 |
| **Manual JSON / exam grading** | データセットの JSON ファイルを手作業で作成して語学試験の学生の回答をテストするか、人間の翻訳のバッチをゴールドスタンダードに対して採点する | ML は一切不要。教育や QA に有効 | 継続的な翻訳ニーズにはスケールしない |

### 単なる JSON です

ハーネスは JSON を入力として受け取り、スコア化された JSON を出力します。[データセットのフォーマット](/docs/eval/datasets) はシンプルです:

```json
{
  "entries": [
    { "index": 0, "source_text": "Hello", "target_expected": "tânisi" },
    { "index": 1, "source_text": "Thank you", "target_expected": "kinanâskomitin" }
  ]
}
```

これを手作業で構築することもできます。スプレッドシートからエクスポートすることもできます。コーパスから生成することもできます。語学教師が学生の翻訳を採点するために使用することもできます。翻訳エージェンシーがフリーランサーをベンチマークするために使用することもできます。研究室がモデルのアーキテクチャを比較するために使用することもできます。ハーネスは JSON がどこから来たかを気にしません。ただスコアリングするだけです。

また、本番環境のデプロイメントフレームワークは同じプラグインインターフェースを使用するため、ハーネスで高スコアを出したメソッドは、設定を1つ変更するだけで Web サイトにデプロイできます。**証明して、使用してください。**

可能性は本当に無限です。**アイデアがある場合は、それを構築し、ハーネスを実行して、スコアを提出してください。**

---

## rosetta の役割

rosetta はインフラストラクチャ層を提供します。メソッドはあなたが用意します。

### コーチングシステム

rosetta の `llm-coached` メソッドを使用すると、言語学的知識を LLM のプロンプトに直接注入できます:

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

コーチングデータは `en:crk` ペアのすべての LLM プロンプトに注入され、他の方法では得られない構造化された言語学的コンテキストをモデルに提供します。完全な仕様については、[Coaching Data](/docs/concepts/coaching-data) を参照してください。

### レジスター

レジスターは、トーン、フォーマルさ、および正書法の規則を制御するシステムプロンプトの一部です。rosetta には、Plains Cree のレジスターが1つ同梱されています:

```
nêhiyawêwin (Plains Cree). Use SRO (Standard Roman Orthography) as the working
script. Output will be converted to Syllabics via deterministic converter.
Professional register appropriate for educational and community contexts.
```

設定でこれをオーバーライドして、さまざまなプロンプト戦略を試すことができます:

```json title="i18n-rosetta.config.json"
{
  "languages": {
    "crk": {
      "register": "Casual Plains Cree (Y-dialect). Use SRO. Prefer everyday vocabulary over formal or archaic terms. Address the reader directly."
    }
  }
}
```

異なるレジスターは異なる翻訳スタイルを生み出し、リーダーボードのスコアも異なります。各提出物には、使用された正確なレジスターとシステムプロンプトが ([run card](/docs/eval/run-card) に SHA-256 ハッシュとして) 記録されるため、実験は再現可能です。

### 文字スクリプトの変換

Plains Cree は、**標準ローマ字正書法 (SRO: Standard Roman Orthography)** と**カナダ先住民音節文字 (Canadian Aboriginal Syllabics)** の2つの文字スクリプトで書かれています。rosetta のパイプラインは以下の通りです:

1. LLM が SRO (ラテン文字ベースであり、LLM がより適切に処理できる) に翻訳する
2. 品質ゲートが SRO の出力を検証する
3. 決定論的コンバーターが SRO → 音節文字に変換する
4. 変換されたテキストがディスクに書き込まれる

コンバーターはすべての SRO の発音区別符号 (長母音の ê、î、ô、â) を処理し、それらを正しい音節文字にマッピングします。技術的な詳細については、[Script Converters](/docs/concepts/script-converters) を参照してください。

### 評価ループ

[eval harness](/docs/eval/harness) は、評価データセットに対してメソッドを実行し、スコア化された [run card](/docs/eval/run-card) を生成します:

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

`--condition` フラグは、あなたが選択するラベルです。これはリーダーボードに表示されるため、どのようなプロンプト戦略を使用したかを他の人が確認できます。ハーネスは run card に完全なシステムプロンプトを記録するため、あなたの正確なアプローチは再現可能です。

:::tip 自由に実験し、最高の結果を提出する
ハーネスは迅速な反復のために設計されています。さまざまなモデル、コーチングデータ、レジスター、および条件で何十もの実験を実行してください。自信のある結果が得られた場合にのみ、リーダーボードに提出してください。
:::

---

## OCAP 原則

rosetta は、先住民のデータ主権をサポートするように設計されています。[OCAP 原則](https://fnigc.ca/ocap-training/) (Ownership: 所有、Control: 管理、Access: アクセス、Possession: 保持) は、私たちが先住民コミュニティ向けの言語テクノロジーにどのようにアプローチするかを導くものです:

| 原則 | rosetta のサポート方法 |
|-----------|------------------------|
| **Ownership (所有)** | 言語コミュニティは自らの言語データを所有します。rosetta が外部に通信したり、私たちのサーバーにデータを送信したりすることは決してありません |
| **Control (管理)** | [API method](/docs/guides/serving-a-method) により、コミュニティは独自の翻訳パイプラインをホストできます。私たちはインターフェースを提供し、コミュニティが実装を管理します |
| **Access (アクセス)** | コミュニティは、誰がそのメソッドを使用できるかを決定します。API は認証によって制限することができます |
| **Possession (保持)** | すべての翻訳データはプロジェクトのファイルシステム内に留まります。[provenance system](/docs/concepts/security) は、すべての翻訳がどこから来たかを追跡します |

プラグインアーキテクチャにより、コミュニティは神聖な知識や制限された知識を内部に組み込んだメソッドを構築し、翻訳 API のみを公開して、言語リソースを完全に管理し続けることができます。

---

## ビジョン: 次に来るもの

Plains Cree が最初のターゲットです。パイプラインが検証され、コミュニティが品質に満足すれば、同じアーキテクチャが FST インフラストラクチャを持つ他の複統合的言語にも拡張されます:

- **その他のアルゴンキン語族**: Woods Cree、Swampy Cree、Ojibwe、Blackfoot
- **イヌイット語族**: Inuktitut、Inuinnaqtun (これらも音節文字を使用します)
- **その他の語族**: FST 解析器を持つ言語であれば、FST ゲートパイプラインを使用できます

リーダーボードは言語ペアごとにスコープされています。言語コミュニティによって新しい評価データセットが提供されると、新しいリーダーボードのトラックが自動的に開かれます。

**これはオープンな招待状です。** 研究者、コミュニティメンバー、学生、あるいは単に関心のある人として低資源言語に携わっているなら、rosetta は本物を構築し、それを誠実に測定し、世界と共有するためのツールを提供します。[Method Leaderboard](/leaderboard) はあなたの提出を待っています。

---

## 関連項目

- **[Method Leaderboard](/leaderboard)** — スコアを提出し、メソッドの比較を確認する
- **[MT Evaluation](/docs/eval/)** — 優れたメソッドの条件、失格になる条件
- **[Eval Harness](/docs/eval/harness)** — 実験の実行方法
- **[Evaluation Datasets](/docs/eval/datasets)** — EDTeKLA Dev v1 および FLORES+
- **[Coaching Data](/docs/concepts/coaching-data)** — LLM 向けに言語学的知識を構造化する方法
- **[Script Converters](/docs/concepts/script-converters)** — SRO→音節文字のパイプライン
- **[Serving a Method via API](/docs/guides/serving-a-method)** — コミュニティ管理の翻訳をホストする
- **[ALTLab](https://altlab.artsrn.ualberta.ca/)** — Alberta Language Technology Lab
- **[EdTeKLA](https://spaces.facsci.ualberta.ca/edtekla/)** — Educational Technology, Knowledge & Language 研究グループ
- **[itwêwina dictionary](https://itwewina.altlab.app/)** — FST を搭載した Plains Cree–英語辞典