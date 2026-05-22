---
sidebar_position: 5
title: "Dados de Coaching"
---
# Coaching Data

O Coaching Data é o mecanismo do rosetta para ensinar aos LLMs sobre idiomas nos quais eles não foram treinados. Ao fornecer regras gramaticais, dicionários e notas de estilo junto com cada solicitação de tradução, você transforma um LLM de uso geral em um tradutor sensível ao contexto para qualquer idioma — incluindo idiomas com zero suporte de MT existente.

## Como Funciona

Quando você define o método de um par como `llm-coached`, o rosetta carrega um arquivo de coaching de `.rosetta/coaching/<locale>.json` e injeta seu conteúdo em cada prompt do LLM como parte da system message. O LLM vê suas regras linguísticas junto com a solicitação de tradução, produzindo um resultado que segue sua gramática e terminologia em vez de adivinhar.

```
┌──────────────────────────────────────────────────────┐
│ System Message (cached across batches)               │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Base translation rules                           │ │
│ │ + Register instructions                          │ │
│ │ + Grammar rules (from coaching data)             │ │
│ │ + Dictionary entries (from coaching data)         │ │
│ │ + Style notes (from coaching data)               │ │
│ └──────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────┤
│ User Message (per batch)                             │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Keys to translate (JSON)                         │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

Como o Coaching Data faz parte da system message, ele se beneficia do **prompt caching** — provedores como Anthropic e Google fazem cache de prefixos de sistema repetidos, de modo que você só paga pelo contexto de coaching uma vez por sessão, e não uma vez por lote.

## Formato do Arquivo de Coaching

Crie um arquivo JSON por localidade em `.rosetta/coaching/`:

```json title=".rosetta/coaching/crk.json"
{
  "grammar_rules": [
    "Plains Cree is polysynthetic — a single word can express what English needs a full sentence for",
    "Animate/inanimate noun distinction affects verb conjugation",
    "Use SRO (Standard Roman Orthography) unless script converter handles conversion",
    "Verb stems are modified by prefixes and suffixes to indicate person, number, tense, and evidentiality"
  ],
  "dictionary": {
    "home": "kīwēwin",
    "settings": "isi-nākatohkēwin",
    "search": "nānātawāpahtam",
    "welcome": "tānisi",
    "submit": "ispīhci",
    "cancel": "pōni"
  },
  "style_notes": "Use formal register. Preserve English technical terms in parentheses when no Cree equivalent exists. Avoid loanwords when a descriptive Cree expression exists."
}
```

### Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|----------|-------------|
| `grammar_rules` | `string[]` | Não | Array de regras gramaticais injetadas no system prompt. Cada regra deve ser uma instrução concisa e acionável que o LLM possa seguir. |
| `dictionary` | `object` | Não | Mapa de chave-valor de termo em inglês → termo no idioma de destino. Usado para vocabulário específico de domínio que o LLM não conheceria. |
| `style_notes` | `string` | Não | Instruções de estilo em formato livre (registro, tom, convenções de formalidade). |

Todos os campos são opcionais — você pode começar apenas com um dicionário e adicionar regras gramaticais à medida que refina.

## Comportamento de Fallback

Se um par estiver configurado para `llm-coached`, mas não existir nenhum arquivo de coaching para essa localidade, o rosetta **faz o fallback para o método `llm` padrão** com um aviso no console:

```
[INFO] No coaching data for "crk" at .rosetta/coaching/crk.json
       Falling back to standard LLM method. Create coaching data for better results.
```

Isso significa que você pode definir `"defaultMethod": "llm-coached"` globalmente com segurança — os idiomas com Coaching Data o utilizarão, e o restante receberá a tradução padrão do LLM sem erros.

## Quando Usar Coaching

| Cenário | Método Recomendado |
|----------|-------------------|
| Idiomas Tier 1 (Francês, Espanhol, Alemão) | `llm` ou `google-translate` — Os LLMs já os conhecem bem |
| Idiomas Tier 2 (Coreano, Turco, Tailandês) | `llm` com um registro — Os LLMs lidam com eles adequadamente com orientação de estilo |
| Idiomas Tier 3 (Cree das Planícies, Iorubá, Quíchua) | `llm-coached` — Os LLMs precisam de regras gramaticais e dicionários |
| Conlangs (Klingon, Sindarin, Kryptoniano) | `llm-coached` — Os LLMs têm alguns dados de treinamento, mas precisam de correções |

## Construindo um Bom Coaching Data

### Regras Gramaticais

Escreva as regras como **instruções**, não como descrições. O LLM segue instruções melhor do que interpreta teoria linguística.

```json
// ❌ Descriptive (the LLM learns nothing actionable)
"Plains Cree has animate and inanimate noun classes"

// ✅ Instructive (the LLM knows what to do)
"When translating nouns, check whether the Cree equivalent is animate (NA) or inanimate (NI) — this affects which verb conjugation to use"
```

### Dicionários

Concentre-se em **termos específicos de domínio** que o LLM erraria ou inventaria. Não se preocupe com palavras comuns com as quais o LLM já lida — concentre-se nos termos específicos da UI da sua aplicação.

### Notas de Estilo

Seja específico sobre registro, formalidade e convenções:

```json
"style_notes": "Use formal register (vous-form in French). Preserve brand names untranslated. UI labels should be imperative mood ('Save', not 'Saves'). Maximum 40 characters for button text."
```

## Testando Traduções com Coaching

Use o [MT Eval Harness](https://github.com/gamedaysuits/gds-mt-eval-harness) para fazer o benchmark de suas traduções com coaching em relação a um corpus de referência:

```bash
# Install the harness
pip install mt-eval-harness

# Run coached translations against your test corpus
mt-eval run --corpus data/crk-corpus.json --model google/gemini-2.5-pro

# Score the results
mt-eval test eval/logs/run_*.json
```

Isso fornece a você as pontuações chrF++, BLEU e exact match. Crie várias versões do arquivo de coaching e compare — métricas objetivas superam a revisão subjetiva.

## Veja Também

- [Idiomas de Baixo Recurso](/docs/guides/low-resource-languages) — passo a passo completo para construir um pipeline de tradução do zero
- [Métodos de Tradução](/docs/guides/translation-methods) — comparação de todos os métodos disponíveis
- [Construir um Plugin](/docs/tutorials/build-a-plugin) — empacotar um método com coaching como um plugin reutilizável