---
sidebar_position: 7
title: "Soberania de Dados"
description: "Princípios OCAP, CARE e Māori Data Sovereignty para a tradução de línguas indígenas. Por que o consentimento da comunidade vem antes da implantação."
---
# Soberania de Dados

A tradução automática para línguas indígenas levanta questões que não existem para o francês ou o japonês. A quem pertencem os dados de treinamento? Quem controla como um modelo de linguagem fala? Quem decide se uma tradução é boa o suficiente para ser publicada?

**A resposta é sempre a comunidade.**

O rosetta foi construído para apoiar isso. O método `api` mantém todos os recursos linguísticos no lado do servidor sob o controle da comunidade. O sistema de plugins separa o método da ferramenta. Mas a ferramenta não pode impor a ética — esta página explica os princípios que você deve seguir.

---

## Princípios OCAP®

**OCAP** (Propriedade, Controle, Acesso, Posse - do inglês *Ownership, Control, Access, Possession*) é um conjunto de princípios desenvolvido pelo [First Nations Information Governance Centre](https://fnigc.ca/ocap-training/) (FNIGC) que estabelece como os dados das Primeiras Nações devem ser coletados, protegidos, usados e compartilhados.

| Princípio | O que significa para a tradução |
|-----------|------------------------------|
| **Propriedade** | A comunidade é proprietária de seus dados linguísticos — dicionários, gramáticas, textos paralelos, arquivos de treinamento (*coaching*) e quaisquer traduções produzidas a partir deles. |
| **Controle** | A comunidade controla como seus dados de idioma são usados, quem tem acesso e quais métodos de tradução são aceitáveis. |
| **Acesso** | Os membros da comunidade têm o direito de acessar e gerenciar seus próprios recursos de idioma, independentemente de onde estejam armazenados. |
| **Posse** | Os dados físicos (arquivos de treinamento, dicionários, pesos do modelo) devem residir em uma infraestrutura que a comunidade controla — não em uma nuvem de terceiros. |

### O que o OCAP significa na prática

- **Não publique traduções** de uma língua indígena sem a autorização explícita da comunidade.
- **Não treine modelos** com dados linguísticos fornecidos pela comunidade sem um acordo de compartilhamento de dados.
- **Não faça extração de dados (scrape)** de recursos de idiomas da comunidade em sites, mídias sociais ou materiais educacionais.
- **Use o método `api`** para que os prompts, dados de treinamento e dicionários permaneçam em servidores controlados pela comunidade. O método `api` do rosetta é um "canal burro" (*dumb pipe*) — ele envia chaves e recebe traduções de volta. Toda a PI (Propriedade Intelectual) linguística permanece no lado do servidor.
- **Documente a proveniência** — o campo `provenance` no [manifesto do plugin](/docs/reference/plugin-spec) deve listar todos os recursos usados, sua licença e sua origem.

:::warning OCAP® é uma marca registrada
OCAP® é uma marca registrada do First Nations Information Governance Centre. Aplica-se especificamente às Primeiras Nações no Canadá. Os princípios têm relevância mais ampla, mas a marca registrada e a autoridade de governança pertencem ao FNIGC.
:::

---

## Princípios CARE

Os **Princípios CARE para a Governança de Dados Indígenas** foram desenvolvidos pela [Global Indigenous Data Alliance](https://www.gida-global.org/care) (GIDA) como um complemento aos princípios de dados FAIR. FAIR diz que os dados devem ser Localizáveis (*Findable*), Acessíveis (*Accessible*), Interoperáveis (*Interoperable*) e Reutilizáveis (*Reusable*). CARE diz que isso não é suficiente — a governança de dados também deve centrar-se nos direitos indígenas.

| Princípio | Aplicação |
|-----------|------------|
| **Benefício Coletivo** | As ferramentas de tradução devem beneficiar primeiro a comunidade linguística. As pontuações no placar de líderes (*leaderboard*) são um meio de melhorar os métodos, não de extrair valor comercial dos idiomas da comunidade. |
| **Autoridade para Controlar** | As comunidades têm a autoridade para governar como seus dados de idioma são coletados, usados e compartilhados. Uma pontuação alta no placar de líderes não concede permissão para publicar traduções. |
| **Responsabilidade** | Pesquisadores e desenvolvedores que trabalham com dados de línguas indígenas têm a responsabilidade de construir relacionamentos, obter consentimento e compartilhar benefícios. |
| **Ética** | Os direitos e o bem-estar dos povos indígenas devem ser a preocupação principal. Os métodos de tradução devem ser desenvolvidos *com* as comunidades, não *sobre* elas. |

---

## Te Mana Raraunga — Soberania de Dados Māori

**Te Mana Raraunga** é a [Rede de Soberania de Dados Māori](https://www.temanararaunga.maori.nz/). Ela afirma que os dados Māori — incluindo dados de idioma — são um *taonga* (tesouro) sujeito aos princípios do Tratado de Waitangi e do *tikanga Māori* (direito consuetudinário Māori).

Princípios fundamentais:

| Princípio | Significado |
|-----------|---------|
| **Rangatiratanga** (Autoridade) | Os Māori têm o direito inerente de exercer autoridade sobre seus dados, incluindo dados de idioma. |
| **Whakapapa** (Relacionamentos) | Os dados têm origens e conexões. Os dados de idioma carregam os relacionamentos e o conhecimento das pessoas que os criaram. |
| **Whanaungatanga** (Obrigações) | Aqueles que mantêm ou processam dados Māori têm obrigações recíprocas com as comunidades de onde eles vêm. |
| **Kotahitanga** (Benefício coletivo) | Os dados Māori devem ser usados para o benefício coletivo dos Māori. |
| **Manaakitanga** (Reciprocidade) | O uso de dados Māori deve envolver cuidado, respeito e reciprocidade. |
| **Kaitiakitanga** (Tutela/Guarda) | Os guardiões dos dados têm o dever de proteger os dados e garantir que sejam usados adequadamente. |

Esses princípios se aplicam ao *te reo Māori* (a língua Māori) e a qualquer trabalho computacional envolvendo dados da língua Māori.

---

## O que isso significa para os usuários do rosetta

### Para idiomas padrão (francês, japonês, espanhol...)

Use o rosetta normalmente. Esses idiomas têm grandes corpora disponíveis publicamente, APIs de tradução estabelecidas e nenhuma preocupação com soberania. Traduza, sincronize e publique como desejar.

### Para línguas indígenas e de poucos recursos

A situação é fundamentalmente diferente:

1. **Obtenha consentimento primeiro.** Antes de construir um método de tradução para uma língua indígena, estabeleça um relacionamento com a comunidade. Um método construído sem o envolvimento da comunidade — por mais impressionante que seja tecnicamente — não deve ser publicado ou distribuído.

2. **Use o método `api`.** Hospede o pipeline de tradução em uma infraestrutura controlada pela comunidade. O método `api` no rosetta foi projetado para isso: ele envia chaves e recebe traduções de volta sem expor os prompts, dicionários ou dados de treinamento que fazem o método funcionar.

    ```json title="Community-controlled setup"
    {
      "pairs": {
        "en:crk": {
          "method": "api",
          "endpoint": "https://api.community-server.example/translate"
        }
      }
    }
    ```

3. **Documente tudo.** Use o campo `provenance` no manifesto do seu plugin para listar todos os recursos, sua licença e se foram fornecidos com o consentimento da comunidade.

4. **Pontuações não são licenças.** Uma pontuação alta no placar de líderes prova que um método funciona bem tecnicamente. Isso não concede permissão para publicar traduções, distribuir o plugin ou comercializar o método. A comunidade decide.

5. **Compartilhe o método, não os dados.** Se você desenvolver uma técnica que funcione bem (por exemplo, "LLM com FST-gated e prompts treinados"), compartilhe a *arquitetura* e a *abordagem* no placar de líderes. A comunidade mantém o controle sobre os dados linguísticos que fazem com que funcione para seu idioma específico.

---

## O Método `api` e a Soberania

O [método de tradução](/docs/guides/translation-methods) `api` existe especificamente para apoiar a soberania de dados. Eis o porquê:

| Aspecto | Outros Métodos | Método `api` |
|--------|--------------|-------------|
| **Onde os prompts ficam** | Nos arquivos de configuração do rosetta (visíveis para todos os desenvolvedores) | No servidor da comunidade (privado) |
| **Onde os dados de treinamento ficam** | No diretório `.rosetta/coaching/` (commitados no git) | No servidor da comunidade (privado) |
| **Onde os dicionários ficam** | No diretório do plugin (distribuídos com o plugin) | No servidor da comunidade (privado) |
| **Quem controla o pipeline** | Quem executa o `rosetta sync` | A comunidade que opera a API |
| **O que o rosetta vê** | Tudo | Chaves entrando, traduções saindo |

O método `api` é uma escolha arquitetônica deliberada. É um "canal burro" porque a PI — o conhecimento linguístico, as regras gramaticais, os exemplos de treinamento cuidadosamente selecionados — pertence à comunidade, não à ferramenta.

Consulte [Servindo um Método via API](/docs/guides/serving-a-method) para obter detalhes de implementação.

---

## Leitura Adicional

- [First Nations Information Governance Centre — OCAP®](https://fnigc.ca/ocap-training/)
- [Global Indigenous Data Alliance — Princípios CARE](https://www.gida-global.org/care)
- [Te Mana Raraunga — Rede de Soberania de Dados Māori](https://www.temanararaunga.maori.nz/)
- [USIDSN — Rede de Soberania de Dados Indígenas dos Estados Unidos](https://usindigenousdata.org/)

---

## Veja Também

- [Apoiar um Idioma de Poucos Recursos](/docs/guides/low-resource-languages) — o guia técnico com o contexto do OCAP
- [Métodos de Tradução](/docs/guides/translation-methods) — o método `api` e como ele protege a PI
- [Servindo um Método via API](/docs/guides/serving-a-method) — hospedando um pipeline controlado pela comunidade
- [Especificação de Plugin](/docs/reference/plugin-spec) — o campo `provenance` para atribuição de recursos
- [Cookbook: Pipeline FST-Gated](/docs/tutorials/fst-gated-pipeline) — construindo um pipeline que uma comunidade pode auto-hospedar