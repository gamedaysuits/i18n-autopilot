---
sidebar_position: 4
title: "Interface do Método"
---
# Interface de Método Compartilhada

O eval harness e o i18n-rosetta compartilham um conceito comum de **método de tradução**. Um método é qualquer procedimento que recebe um texto de origem e produz um texto traduzido — seja uma chamada direta de LLM, um pipeline de vários estágios, uma API de terceiros ou um tradutor humano.

## Arquitetura

```
Method Plugin (v2 Spec)
├── manifest.json         ← Shared metadata (name, version, supported pairs)
├── method_card.json      ← Leaderboard description (what, not how)
├── translate.py          ← Python entry point (for eval harness)
└── translate.js          ← Node.js entry point (for i18n-rosetta CLI)
```

## Dois Sistemas, Uma Interface

| | Eval Harness | i18n-rosetta |
|---|---|---|
| **Linguagem** | Python | Node.js |
| **Ponto de entrada** | `translate.py` | `translate.js` |
| **Interface** | Protocolo `TranslationProcess` | Configuração `methodPlugin` |
| **Propósito** | Avaliação em lote com pontuação | Localização em tempo real em dev/CI |
| **Saída** | Cartão de execução com métricas | Arquivos de localidade traduzidos |

Um método que suporta ambos os sistemas fornece dois pontos de entrada — um para cada runtime de linguagem. O **cartão de método** é a ponte: ele descreve o método em um formato que ambos os sistemas entendem.

## Cartão de Método

Um cartão de método descreve *o que* é um método de tradução sem revelar detalhes proprietários, como o prompt completo do sistema. Ele responde:

- Qual é a classe deste método? (LLM bruto, LLM guiado, pipeline, API, etc.)
- Quais ferramentas ele usa? (Analisador FST, dicionário, etc.)
- A implementação é de código aberto?
- Quais pares de idiomas ele suporta?

Consulte a [Especificação do Cartão de Método](https://github.com/gamedaysuits/gds-mt-eval-harness/blob/main/docs/method-card-spec.md) para ver o esquema JSON completo.

### Exemplo

```json
{
  "method_id": "fst-gated-v8",
  "name": "FST-Gated Coached Translation v8",
  "class": "pipeline",
  "description": "LLM translation with morphological validation. Failed words are retried with FST feedback.",
  "author": "Curtis Forbes",
  "tools_used": ["HFST morphological analyzer", "Wolvengrey dictionary"],
  "open_source": false,
  "supported_pairs": ["eng>crk"]
}
```

### Classes de Método

| Classe | Descrição |
|-------|-------------|
| `raw-llm` | Chamada direta de LLM com instrução mínima |
| `coached-llm` | LLM com prompt estruturado, exemplos, restrições |
| `pipeline` | Pipeline de vários estágios com componentes determinísticos |
| `custom-plugin` | Processo externo implementando o protocolo `TranslationProcess` |
| `api` | API de tradução de terceiros (Google Translate, DeepL, etc.) |
| `human` | Tradução humana (para estabelecer linhas de base) |

## Eval Harness: Protocolo TranslationProcess

O eval harness usa a tipagem estrutural do Python (`Protocol`) para plugins. Qualquer classe com a assinatura de método correta funciona — nenhuma herança é necessária:

```python
class MyMethod:
    async def translate(self, entries: list[dict], config: RunConfig) -> list[dict]:
        results = []
        for entry in entries:
            translation = await self.do_translation(entry["source"])
            results.append({
                "id": entry["id"],
                "predicted": translation,
                "latency_s": 0.5,
                "usage": {"prompt_tokens": 0, "completion_tokens": 0},
                "error": None,
                "tool_calls": [],
                "tool_call_count": 0,
                "metadata": {},
            })
        return results
```

Consulte o [Protocolo de Plugin](https://github.com/gamedaysuits/gds-mt-eval-harness/blob/main/docs/plugin-protocol.md) para a documentação completa, incluindo exemplos de wrappers para métodos que não são em Python.

## i18n-rosetta: Configuração methodPlugin

No rosetta, os métodos são registrados por par de idiomas em `i18n-rosetta.config.json`:

```json
{
  "version": 3,
  "pairs": {
    "en:crk": {
      "methodPlugin": "crk-coached-v1"
    }
  }
}
```

Consulte a [Especificação de Plugin](/docs/reference/plugin-spec) para a interface do lado do rosetta.

## Integração com o Leaderboard

Quando um cartão de método é anexado a uma execução (via `--method-card`), ele é incorporado ao cartão de execução e exibido no leaderboard:

```bash
# Run with method card attached
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --method-card method_card.json \
  --submit
```

O leaderboard mostra:
- **Selo de classe** — indicador visual (ex.: "pipeline", "coached-llm")
- **Nome do método** — do cartão de método
- **Ferramentas usadas** — listadas a partir do cartão de método
- **Indicador de código aberto**

Quando nenhum cartão de método é anexado, o leaderboard mostra a configuração nativa do harness (modelo, condição, temperatura, ferramentas habilitadas).

:::danger NÃO TREINE com dados de avaliação
Métodos cujo processo de desenvolvimento incluiu exposição ao conjunto de dados de avaliação — como dados de treinamento, exemplos few-shot, entradas de dicionário ou material de ajuste de prompt — serão **desqualificados** do leaderboard. Consulte [Avaliação de MT](/docs/eval/) para saber o que distingue um método bom de um ruim.
:::

---

## Veja Também

- [Avaliação de MT](/docs/eval/) — visão geral, valor do leaderboard e orientações sobre métodos bons/ruins
- [Eval Harness](/docs/eval/harness) — como executar avaliações
- [Conjuntos de Dados de Avaliação](/docs/eval/datasets) — conjuntos de dados disponíveis (EDTeKLA, FLORES+)
- [Especificação do Cartão de Execução](/docs/eval/run-card) — o esquema JSON do cartão de execução
- [Especificação de Plugin](/docs/reference/plugin-spec) — interface de plugin do lado do rosetta
- [Leaderboard de Métodos](/leaderboard) — pontuações de benchmark em tempo real