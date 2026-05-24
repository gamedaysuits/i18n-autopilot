---
sidebar_position: 3
title: "Datasets de Avaliação"
---
# Datasets de Avaliação

Datasets são os alvos fixos contra os quais o harness é executado. Cada dataset é um arquivo JSON contendo pares origem→destino com referências padrão-ouro (gold-standard). O harness pontua as saídas do modelo em relação a essas referências — ele nunca as modifica.

:::danger NÃO TREINE com dados de avaliação

⚠️ **Estes datasets são apenas para avaliação.** Métodos treinados, ajustados (fine-tuned), estimulados com few-shot (few-shot-prompted) ou de outra forma expostos a dados de avaliação produzirão pontuações artificialmente infladas e serão **desclassificados do leaderboard.**

Use corpora separados para treinamento. Os conjuntos de avaliação devem permanecer invisíveis para o seu modelo durante o desenvolvimento.
:::

---

## Formato do Dataset

Todo dataset segue o mesmo schema JSON:

```json
{
  "dataset": {
    "id": "dataset-slug",
    "version": "1.0",
    "language_pair": "EN→CRK",
    "description": "Human-readable description of the dataset",
    "source_language": "en",
    "target_language": "crk",
    "created": "2025-05-01",
    "license": "CC-BY-NC-4.0",
    "provenance": ["gold_standard", "textbook"]
  },
  "entries": [
    {
      "index": 0,
      "source_text": "Hello",
      "target_expected": "tânisi",
      "difficulty": "easy",
      "provenance": "gold_standard",
      "notes": "Common greeting, SRO orthography"
    }
  ]
}
```

### Bloco `dataset` de Nível Superior

| Campo | Tipo | Descrição |
|-------|------|-------------|
| `id` | `string` | Identificador único do dataset (usado em run cards e no leaderboard) |
| `version` | `string` | Versão semântica. Incrementar isso invalida comparações anteriores de run cards |
| `language_pair` | `string` | Rótulo de exibição (ex., `EN→CRK`) |
| `description` | `string` | Resumo legível por humanos |
| `source_language` | `string` | Código BCP 47 do idioma de origem |
| `target_language` | `string` | Código BCP 47 do idioma de destino |
| `created` | `string` | Data de criação em ISO 8601 |
| `license` | `string` | Identificador de licença SPDX |
| `provenance` | `string[]` | Lista de tags de proveniência usadas nas entradas |

### Campos de Entrada

| Campo | Tipo | Descrição |
|-------|------|-------------|
| `index` | `number` | Índice de entrada baseado em zero. Deve ser único e sequencial |
| `source_text` | `string` | O texto de origem para traduzir |
| `target_expected` | `string` | A tradução de referência padrão-ouro |
| `difficulty` | `string` | Nível de dificuldade: `easy`, `medium`, `hard` |
| `provenance` | `string` | Origem desta entrada (ex., `gold_standard`, `textbook`, `elicited`) |
| `notes` | `string` | Contexto opcional para revisores humanos |

---

## Datasets Disponíveis

### EDTeKLA Development Set v1

O primeiro dataset de avaliação, construído para tradução de Inglês→Plains Cree (SRO). Criado pelo [grupo de pesquisa EdTeKLA](https://spaces.facsci.ualberta.ca/edtekla/) na Universidade de Alberta.

| Propriedade | Valor |
|----------|-------|
| **ID** | `edtekla-dev-v1` |
| **Versão** | `1.0` |
| **Par de idiomas** | EN → CRK (Plains Cree, ortografia SRO) |
| **Contagem de entradas** | 124 |
| **Distribuição de dificuldade** | Fácil, Médio, Difícil |
| **Proveniência** | `gold_standard` (verificado por falantes), `textbook` (materiais educacionais publicados) |
| **Licença** | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) |

**O que ele testa:**

- Saudações básicas e frases comuns
- Animação de substantivos e obviação
- Conjugação verbal entre pessoas e tempos
- Construções locativas
- Paradigmas possessivos
- Estruturas de frases complexas

:::tip Por que 124 entradas?
O dataset é deliberadamente pequeno e curado. Cada entrada foi verificada por falantes fluentes ou extraída de livros didáticos publicados do idioma Cree. Um dataset pequeno e de alta qualidade com padrões-ouro verificados é mais útil do que um grande e ruidoso — especialmente para um idioma com poucos recursos (low-resource), onde traduções "próximas o suficiente" são frequentemente inválidas morfologicamente.
:::

---

## Criando um Novo Dataset

Para criar um dataset para um novo par de idiomas ou domínio:

### 1. Estruture o JSON

Siga o schema do [Formato do Dataset](#dataset-format). Toda entrada deve ter `source_text`, `target_expected`, `difficulty` e `provenance`.

### 2. Atribua um ID único

Use um slug descritivo: `{project}-{split}-v{version}` (ex., `edtekla-dev-v1`, `quechua-test-v1`).

### 3. Verifique os padrões-ouro

Todo valor `target_expected` deve ser verificado por um falante fluente ou extraído de um recurso publicado e revisado por pares. Referências geradas por máquina anulam o propósito da avaliação.

### 4. Defina os níveis de dificuldade

Atribua a cada entrada um nível de dificuldade:

| Nível | Critérios |
|------|----------|
| `easy` | Frases curtas, vocabulário comum, morfologia simples |
| `medium` | Frases completas, complexidade morfológica moderada |
| `hard` | Gramática complexa, construções raras, conteúdo culturalmente específico |

### 5. Marque a proveniência

Cada entrada deve indicar de onde veio. Tags comuns:

- `gold_standard` — Verificado por falantes fluentes
- `textbook` — De materiais educacionais publicados
- `elicited` — Produzido por meio de sessões estruturadas de elicitação
- `corpus` — Extraído de um corpus paralelo

### 6. Valide o arquivo

Execute o harness contra o seu dataset com qualquer modelo para verificar se o JSON está bem formado e se todos os campos obrigatórios estão presentes:

```bash
python eval/baseline_experiment.py --dataset path/to/your-dataset.json
```

O harness apresentará erro em caso de campos ausentes, índices duplicados ou violações de schema.

### 7. Envie para inclusão

Abra um pull request no [repositório do eval harness](https://github.com/gamedaysuits/gds-mt-eval-harness) com o arquivo do seu dataset no diretório `data/`. Inclua a documentação da sua metodologia de verificação e fontes de proveniência.

---

## FLORES+ Devtest

Um benchmark multilíngue de ampla cobertura mantido pela [Open Language Data Initiative (OLDI)](https://huggingface.co/datasets/openlanguagedata/flores_plus). Usado para o benchmark de fronteira multimodelo do rosetta.

| Propriedade | Valor |
|----------|-------|
| **ID** | `flores-plus-devtest` |
| **Pares de idiomas** | EN → 39 idiomas (todos os idiomas naturais registrados no rosetta) |
| **Contagem de entradas** | 1.012 frases por idioma |
| **Licença** | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| **Fonte** | Originalmente Meta FLORES-200, agora mantido pela OLDI |
| **Localização** | Fixtures pré-extraídas em `test/benchmark/fixtures/` no repositório principal do rosetta |

:::danger Apenas para avaliação
O FLORES+ destina-se exclusivamente à avaliação. Os curadores solicitam explicitamente que ele **não seja usado como dados de treinamento**. Certifique-se de que seu conteúdo seja excluído de quaisquer corpora de treinamento.
:::

---

## Veja Também

- [Avaliação de MT](/docs/eval/) — visão geral do framework de avaliação e leaderboard
- [Eval Harness](/docs/eval/harness) — como executar avaliações contra esses datasets
- [Especificação do Run Card](/docs/eval/run-card) — o schema JSON para registrar resultados
- [Leaderboard de Métodos](/leaderboard) — pontuações de benchmark ao vivo
- [Projeto EdTeKLA](https://spaces.facsci.ualberta.ca/edtekla/) — o grupo de pesquisa da Universidade de Alberta por trás do dataset Cree