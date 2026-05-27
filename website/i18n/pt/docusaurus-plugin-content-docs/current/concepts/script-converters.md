---
sidebar_position: 6
title: "Conversores de Script"
---
# Conversores de Script

Os conversores de script são hooks pós-tradução determinísticos e sem LLM que convertem texto de um sistema de escrita para outro. Eles permitem um fluxo de trabalho "traduza uma vez, renderize em vários scripts" — você traduz para um script de trabalho (geralmente latino) e, em seguida, converte para o script de exibição automaticamente.

## Por que Conversores de Script?

Alguns idiomas usam vários scripts para o mesmo idioma falado:

- **Plains Cree**: SRO (Latino) para edição → Syllabics (ᓀᐦᐃᔭᐍᐏᐣ) para exibição
- **Serbian**: Latino para uso internacional → Cirílico para uso doméstico
- **Klingon**: Romanização para digitação → pIqaD (  ) para exibição

Traduzir diretamente para scripts não latinos cria problemas: os LLMs alucinam caracteres, os arquivos JSON tornam-se difíceis de controlar a versão e as ferramentas de diff não conseguem comparar as alterações. Os conversores de script resolvem isso mantendo as traduções em um script amigável ao controle de versão e convertendo-as de forma determinística no momento da sincronização.

## Conversores Disponíveis

O Rosetta vem com cinco conversores de script integrados:

| Locale | De | Para | Tipo | Fonte Necessária? |
|--------|------|----|------|----------------|
| `crk` | SRO (Standard Roman Orthography) | Cree Syllabics | Determinístico | Não — Unicode nativo |
| `sr` | Latino | Cirílico | Determinístico | Não — Unicode nativo |
| `tlh` | Romanização | pIqaD | Determinístico | Sim — PUA U+F8D0–F8FF |
| `x-elvish-s` | Latino | Tengwar (Mode of Beleriand) | Determinístico | Sim — PUA U+E000–E07F |
| `x-kryptonian` | Latino | Kryptonian | Cifra baseada em fonte | Sim — PUA U+E100–E119 |

### Determinístico vs. Baseado em Fonte

- **Conversores determinísticos** (Cree, Serbian, Klingon, Tengwar) realizam o mapeamento real de caractere para caractere usando regras linguísticas. A saída contém caracteres Unicode reais.
- **Conversores baseados em fonte** (Kryptonian) são cifras de substituição 1:1 onde a saída são caracteres Unicode PUA que só são renderizados corretamente com uma fonte específica carregada.

## Como Eles Funcionam

Os conversores de script são executados **após** a tradução como uma etapa de pós-processamento. O pipeline é:

```
Source (English) → LLM Translation → Working Script → Script Converter → Display Script
```

Por exemplo, Plains Cree:
```
"Welcome" → LLM → "tānisi" (SRO) → Converter → "ᑖᓂᓯ" (Syllabics)
```

### Correspondência Gulosa da Esquerda para a Direita

Todos os conversores usam o mesmo algoritmo: em cada posição de caractere, tente a correspondência mais longa possível primeiro e, em seguida, correspondências progressivamente mais curtas. Caracteres que não correspondem a nenhum padrão (espaços, pontuação, números) passam inalterados.

Isso lida com dígrafos e trígrafos corretamente:
- Klingon: `tlh` → único caractere pIqaD (não `t` + `l` + `h`)
- Serbian: `nj` → `њ` (não `н` + `ј`)
- Cree: `twê` → único silábico (não `t` + `w` + `ê`)

## Usando Conversores de Script

Os conversores de script são ativados automaticamente quando o código de locale corresponde a um conversor registrado. Nenhuma configuração é necessária — basta definir seu locale de destino:

```json title="i18n-rosetta.config.json"
{
  "pairs": {
    "en:crk": {
      "method": "llm-coached",
      "model": "google/gemini-2.5-pro"
    }
  }
}
```

Quando o rosetta sincroniza o par `en:crk`, as traduções são produzidas primeiro em SRO e, em seguida, convertidas automaticamente para Syllabics antes de gravar em `crk.json`.

### Verificando o Status do Conversor

```bash
npx i18n-rosetta status
```

A saída de status mostra quais pares têm conversores de script ativos e qual conversão eles realizam.

## Requisitos de Web Fonts

Três conversores geram caracteres da Área de Uso Privado (PUA) do Unicode que exigem web fonts personalizadas:

### Klingon (pIqaD)

Instale uma fonte pIqaD compatível com CSUR (por exemplo, "pIqaD qolqoS" ou "Klingon pIqaD HaSta"):

```css
@font-face {
  font-family: 'pIqaD';
  src: url('/fonts/pIqaD.woff2') format('woff2');
  unicode-range: U+F8D0-F8FF;
}

:lang(tlh) {
  font-family: 'pIqaD', sans-serif;
}
```

### Tengwar (Sindarin)

Instale uma fonte Tengwar compatível com CSUR (por exemplo, "Tengwar Formal CSUR", "Tengwar Annatar"):

```css
@font-face {
  font-family: 'Tengwar';
  src: url('/fonts/tengwar-formal-csur.woff2') format('woff2');
  unicode-range: U+E000-E07F;
}

:lang(x-elvish-s) {
  font-family: 'Tengwar', serif;
}
```

### Kryptonian

Instale uma fonte Kryptonian mapeada para os codepoints PUA U+E100–E119:

```css
@font-face {
  font-family: 'Kryptonian';
  src: url('/fonts/kryptonian.woff2') format('woff2');
  unicode-range: U+E100-E119;
}

:lang(x-kryptonian) {
  font-family: 'Kryptonian', sans-serif;
}
```

:::tip Abordagem alternativa para Kryptonian
Como Kryptonian é uma cifra A-Z pura, você pode ignorar totalmente o conversor de script e aplicar a fonte ao texto latino via CSS. Isso geralmente é mais simples para implantações web — basta servir a fonte Kryptonian e definir `font-family` nos elementos relevantes.
:::

## Adicionando um Conversor Personalizado

Para adicionar um conversor para um novo idioma, edite `lib/scripts.js`:

1. **Crie o mapa de conversão** — um array ordenado de pares `[from, to]`, com as sequências mais longas primeiro
2. **Crie a função do conversor** — um scanner guloso da esquerda para a direita (use `sroToSyllabics` como modelo)
3. **Registre-o** no objeto `SCRIPT_CONVERTERS` com o código de locale como chave
4. **Adicione o campo `script`** à entrada de registro do idioma em `registers.js`

```javascript
// Example: adding a converter for Cherokee (chr)
const LATIN_TO_CHEROKEE_MAP = [
  ['ga', 'Ꭶ'], ['ka', 'Ꭷ'], ['ge', 'Ꭸ'], // ...
];

function latinToCherokee(text) {
  // Same greedy left-to-right pattern as other converters
}

SCRIPT_CONVERTERS['chr'] = {
  from: 'Latin',
  to: 'Cherokee Syllabary',
  type: 'deterministic',
  converter: latinToCherokee,
};
```

---

## Veja Também

- [Conlangs, Scripts e Ortografia](/docs/guides/conlangs-scripts-orthography) — Fontes PUA, Unicode, adição de novos conversores
- [Quality Gate](/docs/concepts/quality-gate) — validação executada antes da conversão de script
- [Idiomas Suportados](/docs/reference/supported-languages) — quais idiomas possuem conversores de script
- [Apoie um Idioma de Baixos Recursos](https://mtevalarena.org/docs/community/low-resource-languages) — SRO→Syllabics no contexto
- [Cookbook: Pipeline com FST-Gated](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — conversão de script em um pipeline de vários estágios