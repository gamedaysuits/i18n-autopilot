---
sidebar_position: 5
title: "Apoie um idioma de poucos recursos"
---
# Suporte a uma Língua de Poucos Recursos

:::info Status: Em Desenvolvimento Ativo
O suporte ao Plains Cree (nêhiyawêwin) está atualmente em desenvolvimento. As ferramentas, o harness de avaliação e o leaderboard descritos aqui são reais e podem ser usados hoje, mas o pipeline de tradução do Cree ainda não foi lançado. Quando for, isso servirá como base para outras línguas polissintéticas e de poucos recursos com infraestrutura FST.
:::

## O Problema Não Resolvido

O Google Tradutor suporta ~130 idiomas. Existem mais de 7.000 falados na Terra. Para milhares de línguas — incluindo muitas línguas indígenas com comunidades ativas de falantes — não existe nenhuma API de tradução comercial, nenhum grande corpus paralelo foi montado e nenhum modelo pré-treinado produz resultados confiáveis.

Esta não é uma lacuna que se fechará sozinha. Línguas de poucos recursos têm poucos recursos *porque* a economia da tradução automática (MT) comercial não chega até elas. Os falantes que mais precisam dessas ferramentas são as mesmas comunidades com menor probabilidade de tê-las construídas para eles.

**O rosetta foi construído para mudar isso.**

O [Leaderboard de Métodos](/leaderboard) é um desafio aberto: construa o melhor método de tradução para uma língua sub-representada, prove-o com uma avaliação reprodutível e conquiste a pontuação máxima. Qualquer pessoa no mundo pode contribuir — linguistas, pesquisadores de ML, trabalhadores comunitários de línguas, estudantes, entusiastas. O problema não está resolvido. A infraestrutura está aqui. O leaderboard está esperando.

---

## Por Que Isso é Difícil: Morfologia Polissintética

A maioria dos sistemas comerciais de MT foi projetada para idiomas como inglês, francês e chinês — línguas onde as palavras são relativamente curtas e as frases são construídas a partir de tokens discretos. Mas muitas línguas indígenas, incluindo o Plains Cree, são **polissintéticas**: uma única palavra pode codificar o que o inglês expressa como uma frase inteira.

### O exemplo do Cree

Considere a palavra em Plains Cree:

> **ê-kî-nitawi-kîskinwahamâkosiyân**
> *"quando eu fui para a escola"*

Isso é **uma palavra**. Ela codifica o tempo verbal (passado), a direção (indo para), a raiz (aprender), a voz (passiva/reflexiva) e a pessoa (primeira do singular). Um LLM treinado predominantemente em inglês não tem intuição para esse tipo de densidade morfológica.

Os desafios se acumulam:

| Desafio | O Que Significa |
|-----------|--------------|
| **Complexidade morfológica** | Uma única raiz verbal pode gerar milhares de formas flexionadas válidas por meio de prefixação, sufixação e circunfixação |
| **Distinção animado/inanimado** | Os substantivos são gramaticalmente animados ou inanimados — isso afeta a conjugação verbal, os demonstrativos e a pluralização. A classificação nem sempre segue a animação biológica (*askiy* "terra" é animado; *maskisin* "sapato" também é animado) |
| **Obviação** | As referências de terceira pessoa são classificadas por proximidade/saliência. A distinção entre "próximo" (proximate) e "obviativo" (obviative) não tem equivalente em inglês |
| **Dados de treinamento escassos** | Os LLMs viram muito pouco texto em Plains Cree. O que eles viram pode misturar dialetos (dialeto Y, dialeto TH) ou ortografias (SRO vs. silábicos) |
| **Nenhuma baseline comercial** | O Google Tradutor não retorna nada útil. Não há uma API pronta para uso para fins de comparação |

É por isso que a tradução de línguas polissintéticas continua sendo um **problema de pesquisa em aberto** — e por que um leaderboard pontuado e reprodutível é importante.

---

## Trabalhos Anteriores: Como as Pessoas Têm Abordado Isso

### O FST do ALTLab

O recurso computacional mais significativo para o Plains Cree é o **transdutor de estados finitos (FST)** desenvolvido pelo [Alberta Language Technology Lab (ALTLab)](https://altlab.artsrn.ualberta.ca/) da Universidade de Alberta, em colaboração com o [Giellatekno](https://giellatekno.uit.no/) da UiT A Universidade Ártica da Noruega.

O FST do ALTLab é um **analisador e gerador morfológico**: dada uma palavra flexionada em Cree, ele pode decompô-la em sua raiz e tags gramaticais, e dada uma raiz mais tags, ele pode gerar a forma flexionada correta. Isso é determinístico — sem rede neural, sem alucinação, sem probabilidade. Se o FST aceita uma palavra, essa palavra é morfologicamente válida.

É por isso que o leaderboard do rosetta rastreia a **Taxa de Aceitação do FST** (FST Acceptance Rate) como uma métrica. Um método de tradução que produz palavras que o FST rejeita está produzindo um Cree morfologicamente inválido — independentemente do que a pontuação chrF++ diga.

**Principais recursos do ALTLab:**
- [itwêwina](https://itwewina.altlab.app/) — um dicionário inteligente de Plains Cree–Inglês desenvolvido com FST
- [Morphodict](https://github.com/UAlbertaALTLab/morphodict) — plataforma de dicionário de código aberto com reconhecimento morfológico
- [crk-db](https://github.com/UAlbertaALTLab/crk-db) — banco de dados lexical do Plains Cree
- [21st Century Tools for Indigenous Languages](https://21c.tools/) — o contexto mais amplo do projeto

### Registros Morfológicos e FST Globais

O Plains Cree não é a única língua com infraestrutura FST de alta qualidade. Se você deseja desenvolver pipelines de tradução para outras línguas de poucos recursos ou morfologicamente complexas, pode aproveitar estes polos globais estabelecidos:

* **[GiellaLT / Giellatekno](https://giellalt.github.io/) (UiT A Universidade Ártica da Noruega):** O maior repositório de analisadores e geradores morfológicos FST de código aberto, cobrindo mais de 100 idiomas. As áreas de foco incluem as línguas Sami (`sme`, `smj`, `sma`, etc.), línguas urálicas (Komi, Erzya, Udmurt, etc.) e outras línguas minoritárias/indígenas. Eles hospedam corpora de texto processado público (`corpus-xxx`) em sua [Organização no GitHub](https://github.com/giellalt/).
* **[The Apertium Project](https://www.apertium.org/):** Uma plataforma de tradução automática baseada em regras de código aberto. O Apertium mantém analisadores morfológicos FST altamente otimizados (usando `lttoolbox` e `hfst`) e dicionários bilíngues para dezenas de idiomas, incluindo um grande conjunto de línguas túrquicas (Cazaque, Tártaro, Quirguiz, etc.) e línguas europeias minoritárias. Todos os recursos são públicos no [GitHub do Apertium](https://github.com/apertium).
* **[UniMorph (Universal Morphology)](https://unimorph.github.io/):** Um projeto colaborativo que fornece paradigmas morfológicos padronizados para mais de 150 idiomas. O conjunto de dados está hospedado no Hugging Face em [unimorph/universal_morphologies](https://huggingface.co/datasets/unimorph/universal_morphologies). Se um binário FST compilado não estiver disponível para um idioma, as tabelas do UniMorph podem ser usadas como um portão de consulta de banco de dados estático.
* **[National Research Council Canada (NRC)](https://nrc-digital-repository.canada.ca/):** Oferece ferramentas para línguas indígenas canadenses, incluindo o analisador morfológico FST Inuktitut **Uqailaut** e o enorme **Nunavut Hansard Parallel Corpus** (1,3 milhão de pares de frases alinhadas em Inglês-Inuktitut).

### O Corpus EdTeKLA

O [grupo de pesquisa EdTeKLA](https://spaces.facsci.ualberta.ca/edtekla/) (também na UAlberta) montou um corpus da língua Plains Cree a partir de materiais educacionais, transcrições de áudio e fontes da comunidade. O conjunto de dados de avaliação do rosetta [EDTeKLA Dev v1](/docs/eval/datasets) é derivado deste trabalho, licenciado sob [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/).

### Outras abordagens que as pessoas tentaram ou poderiam tentar

O leaderboard é agnóstico em relação ao método. Aqui estão as estratégias que foram exploradas ou propostas para MT de poucos recursos, qualquer uma das quais poderia ser enviada:

| Abordagem | Como Funciona | Prós | Contras |
|----------|-------------|------|------|
| **Prompting de LLM com coaching** | Injeta regras gramaticais, dicionários e pares de exemplos no prompt do sistema | Rápido para iterar, sem necessidade de treinamento | Teto de qualidade limitado pelo conhecimento base do LLM |
| **Prompting few-shot** | Inclui traduções verificadas como exemplos em contexto | Bom para manter um estilo consistente | Janela de contexto pequena; os exemplos NÃO devem vir dos dados de avaliação |
| **Pipeline com gate FST** | LLM gera → FST valida → rejeita e tenta novamente a morfologia inválida | Garante validade morfológica | Requer infraestrutura FST; loops de repetição adicionam latência e custo |
| **Consulta a dicionário + LLM** | Força termos conhecidos de um dicionário bilíngue, deixa o LLM lidar com o resto | Reduz alucinações para termos conhecidos | A cobertura do dicionário é sempre incompleta |
| **Modelo com fine-tuning** | Faz fine-tuning de um modelo aberto (Llama, Mistral) em texto paralelo — apenas não nos dados de avaliação | Potencialmente a mais alta qualidade | Requer corpus paralelo (escasso); caro; risco de overfitting |
| **Modelos encadeados** | Modelo A gera tradução bruta → Modelo B pós-edita → Modelo C pontua | Pode combinar os pontos fortes de especialistas | Complexo; lento; caro |
| **Híbrido baseado em regras + LLM** | Usa regras linguísticas para padrões conhecidos, LLM para todo o resto | Preciso onde as regras se aplicam | Requer profunda especialização linguística |
| **Aumento por retrotradução** | Gera dados paralelos sintéticos traduzindo Cree→Inglês e, em seguida, treinando no sentido inverso | Expande os dados de treinamento de forma barata | Amplifica os erros existentes do modelo |
| **Abordagem evolutiva** | Gera traduções candidatas, pontua-as, sofre mutação nos melhores desempenhos, repete | Pode descobrir soluções inovadoras; paralelizável | Computacionalmente caro; precisa de uma boa função de aptidão (fitness) |
| **Tradução parcial** | Traduz manualmente uma amostra representativa, prova que seu método corresponde ao seu estilo nela e, em seguida, traduz automaticamente o restante | Combina qualidade humana com escala de máquina | Requer esforço humano inicial |
| **JSON manual / correção de exames** | Cria manualmente um arquivo JSON de conjunto de dados para testar as respostas dos alunos em um exame de idioma ou avalia um lote de traduções humanas em relação a um padrão ouro | Zero ML necessário; funciona para educação e QA | Não escala para necessidades contínuas de tradução |

### É apenas JSON

O harness recebe JSON como entrada e gera JSON pontuado como saída. O [formato do conjunto de dados](/docs/eval/datasets) é simples:

```json
{
  "entries": [
    { "index": 0, "source_text": "Hello", "target_expected": "tânisi" },
    { "index": 1, "source_text": "Thank you", "target_expected": "kinanâskomitin" }
  ]
}
```

Você pode construir isso manualmente. Você pode exportar de uma planilha. Você pode gerar a partir de um corpus. Um professor de idiomas poderia usá-lo para pontuar as traduções dos alunos. Uma agência de tradução poderia usá-lo para avaliar freelancers. Um laboratório de pesquisa poderia usá-lo para comparar arquiteturas de modelos. O harness não se importa de onde o JSON veio — ele apenas o pontua.

E como o framework de implantação em produção usa a mesma interface de plugin, um método que pontua bem no harness é implantado no seu site com uma alteração de configuração. **Prove e use.**

As possibilidades são genuinamente infinitas. **Se você tem uma ideia, construa-a, execute o harness e envie suas pontuações.**

---

## Como o rosetta se Encaixa

O rosetta fornece a camada de infraestrutura — você traz o método.

### O sistema de coaching

O método `llm-coached` do rosetta permite que você injete conhecimento linguístico diretamente no prompt do LLM:

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

Os dados de coaching são injetados em cada prompt do LLM para o par `en:crk`, dando ao modelo um contexto linguístico estruturado que ele não teria de outra forma. Consulte [Dados de Coaching](/docs/concepts/coaching-data) para a especificação completa.

### Registros

O registro faz parte do prompt do sistema que direciona o tom, a formalidade e as convenções ortográficas. O rosetta vem com um registro para Plains Cree:

```
nêhiyawêwin (Plains Cree). Use SRO (Standard Roman Orthography) as the working
script. Output will be converted to Syllabics via deterministic converter.
Professional register appropriate for educational and community contexts.
```

Você pode substituir isso em sua configuração para experimentar diferentes estratégias de prompting:

```json title="i18n-rosetta.config.json"
{
  "languages": {
    "crk": {
      "register": "Casual Plains Cree (Y-dialect). Use SRO. Prefer everyday vocabulary over formal or archaic terms. Address the reader directly."
    }
  }
}
```

Diferentes registros produzem diferentes estilos de tradução — e diferentes pontuações no leaderboard. Cada envio registra o registro exato e o prompt do sistema usado (como um hash SHA-256 no [run card](/docs/eval/run-card)), para que os experimentos sejam reprodutíveis.

### Conversão de script

O Plains Cree é escrito em dois sistemas de escrita (scripts): **Ortografia Romana Padrão (SRO)** e **Silábicos Aborígenes Canadenses**. O pipeline do rosetta:

1. O LLM traduz para SRO (baseado no latim, com o qual os LLMs lidam melhor)
2. O gate de qualidade valida a saída SRO
3. Um conversor determinístico transforma SRO → Silábicos
4. O texto convertido é gravado no disco

O conversor lida com todos os diacríticos SRO (ê, î, ô, â para vogais longas) e os mapeia para os caracteres silábicos corretos. Consulte [Conversores de Script](/docs/concepts/script-converters) para obter detalhes técnicos.

### O loop de avaliação

O [harness de avaliação](/docs/eval/harness) executa seu método contra o conjunto de dados de avaliação e produz um [run card](/docs/eval/run-card) pontuado:

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

A flag `--condition` é um rótulo que você escolhe. Ela aparece no leaderboard para que as pessoas possam ver qual estratégia de prompt você usou. O harness registra o prompt completo do sistema no run card, para que sua abordagem exata seja reprodutível.

:::tip Experimente livremente, envie o seu melhor
O harness foi projetado para iteração rápida. Execute dezenas de experimentos com diferentes modelos, dados de coaching, registros e condições. Envie para o leaderboard apenas quando tiver algo do qual se orgulhe.
:::

---

## Princípios OCAP

O rosetta foi projetado para apoiar a soberania de dados indígenas. Os [princípios OCAP](https://fnigc.ca/ocap-training/) (Propriedade, Controle, Acesso, Posse) orientam como abordamos a tecnologia de idiomas para comunidades indígenas:

| Princípio | Como o rosetta o apoia |
|-----------|------------------------|
| **Propriedade** | As comunidades linguísticas são donas de seus dados linguísticos. O rosetta nunca envia telemetria ("phones home") nem transmite dados para nossos servidores |
| **Controle** | O [método de API](/docs/guides/serving-a-method) permite que as comunidades hospedem seu próprio pipeline de tradução — nós fornecemos a interface, elas controlam a implementação |
| **Acesso** | As comunidades decidem quem pode usar seu método. A API pode ser restrita por autenticação |
| **Posse** | Todos os dados de tradução permanecem no sistema de arquivos do seu projeto. O [sistema de proveniência](/docs/concepts/security) rastreia de onde veio cada tradução |

A arquitetura de plugins significa que uma comunidade pode construir um método que incorpora conhecimento sagrado ou restrito internamente, expor apenas a API de tradução e manter controle total sobre seus recursos linguísticos.

---

## A Visão: O Que Vem a Seguir

O Plains Cree é o primeiro alvo. Assim que o pipeline for validado e a comunidade estiver satisfeita com a qualidade, a mesma arquitetura se estenderá a outras línguas polissintéticas com infraestrutura FST:

- **Outras línguas algonquinas**: Woods Cree, Swampy Cree, Ojibwe, Blackfoot
- **Línguas inuítes**: Inuktitut, Inuinnaqtun (que também usam escritas silábicas)
- **Outras famílias linguísticas**: qualquer idioma com um analisador FST pode usar o pipeline com gate FST

O leaderboard tem escopo por par de idiomas. À medida que novos conjuntos de dados de avaliação são contribuídos por comunidades linguísticas, novas trilhas do leaderboard são abertas automaticamente.

**Este é um convite aberto.** Se você trabalha com uma língua de poucos recursos — como pesquisador, membro da comunidade, estudante ou apenas alguém que se importa — o rosetta oferece as ferramentas para construir algo real, medi-lo honestamente e compartilhá-lo com o mundo. O [Leaderboard de Métodos](/leaderboard) está esperando pelo seu envio.

---

## Veja Também

- **[Leaderboard de Métodos](/leaderboard)** — envie suas pontuações e veja como os métodos se comparam
- **[Avaliação de MT](/docs/eval/)** — o que faz um bom método, o que é desqualificado
- **[Harness de Avaliação](/docs/eval/harness)** — como executar experimentos
- **[Conjuntos de Dados de Avaliação](/docs/eval/datasets)** — EDTeKLA Dev v1 e FLORES+
- **[Dados de Coaching](/docs/concepts/coaching-data)** — como estruturar o conhecimento linguístico para o LLM
- **[Conversores de Script](/docs/concepts/script-converters)** — o pipeline SRO→Silábicos
- **[Servindo um Método via API](/docs/guides/serving-a-method)** — hospedagem de tradução controlada pela comunidade
- **[ALTLab](https://altlab.artsrn.ualberta.ca/)** — o Alberta Language Technology Lab
- **[EdTeKLA](https://spaces.facsci.ualberta.ca/edtekla/)** — o grupo de pesquisa Educational Technology, Knowledge & Language
- **[Dicionário itwêwina](https://itwewina.altlab.app/)** — dicionário Plains Cree–Inglês desenvolvido com FST