---
sidebar_position: 4
title: "Idiomas Suportados"
---
# Idiomas Suportados

O rosetta vem com **Language Cards** — arquivos de referência estruturados para mais de 42 idiomas. Cada cartão contém predefinições de registro, metadados do sistema de formalidade, sinalizadores de suporte a métodos e informações de script. Qualquer idioma que o seu LLM conheça pode ser adicionado com uma única linha de configuração — estes são os que possuem registros curados e prontos para produção.

---

## Métodos de Tradução

Cada idioma pode usar um ou mais destes métodos de tradução:

| Ícone | Método | Como Funciona | Custo |
|------|--------|-------------|------|
| 🟢 | **Google Translate** | Linha de base de MT neural. Mais de 130 idiomas. Apenas strings de chave-valor — não pode traduzir conteúdo Markdown com segurança. | ~$20/1M de caracteres |
| 🔵 | **LLM (OpenRouter)** | Qualquer idioma que o modelo conheça. Prompts direcionados por registro. Lida com chave-valor + conteúdo Markdown. | Varia de acordo com o modelo |
| 🟣 | **LLM-Coached** | LLM + dicionários de gramática + dados de treinamento (coaching) injetados nos prompts. Melhor para idiomas morfologicamente complexos. | Varia de acordo com o modelo |
| 🟠 | **API (Plugin)** | Pipelines de tradução hospedados pela comunidade e servidos via HTTP. [Compatível com OCAP](https://mtevalarena.org/docs/community/low-resource-languages). | Varia de acordo com o provedor |

Defina `GOOGLE_TRANSLATE_API_KEY` para o Google Translate, ou `OPENROUTER_API_KEY` para métodos LLM. Consulte [Métodos de Tradução](/docs/guides/translation-methods) para obter todos os detalhes.

---

## Idiomas Prioritários

Estes são os locais (locales) mais solicitados para aplicativos web e móveis, listados na ordem recomendada pelo rosetta, priorizando a acessibilidade.

| Bandeira | Idioma | Código | Google | LLM | Coached | Script | Notas |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇸🇦 | Árabe | `ar` | ✅ | ✅ | ✅ | — | RTL. Árabe Padrão Moderno (فصحى). |
| 🇵🇭 | Filipino (Taglish) | `tl` | ✅ | ✅ | ✅ | — | Alternância de código (Code-switching): Tagalo como principal, termos técnicos em inglês. |
| 🇫🇷 | Francês | `fr` | ✅ | ✅ | ✅ | — | Forma "Vous". Inclusivo de gênero (Connecté·e). |
| 🇪🇸 | Espanhol | `es` | ✅ | ✅ | ✅ | — | Latino-americano neutro. |
| 🇩🇪 | Alemão | `de` | ✅ | ✅ | ✅ | — | Forma "Sie". Inclusivo de gênero (Benutzer:innen). |
| 🇯🇵 | Japonês | `ja` | ✅ | ✅ | ✅ | — | です/ます para o corpo do texto, する para rótulos de UI. |
| 🇨🇳 | Chinês (Simplificado) | `zh` | ✅ | ✅ | ✅ | — | 简体中文. |
| 🇮🇹 | Italiano | `it` | ✅ | ✅ | ✅ | — | Forma "Lei". |
| 🇧🇷 | Português (BR) | `pt` | ✅ | ✅ | ✅ | — | Português do Brasil. |
| 🇰🇷 | Coreano | `ko` | ✅ | ✅ | ✅ | — | Registro polido 해요체. |

## Principais Idiomas do Mundo

| Bandeira | Idioma | Código | Google | LLM | Coached | Script | Notas |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇧🇩 | Bengali | `bn` | ✅ | ✅ | ✅ | — | Preferência por শুদ্ধ ভাষা. |
| 🇧🇬 | Búlgaro | `bg` | ✅ | ✅ | ✅ | — | |
| 🇨🇿 | Tcheco | `cs` | ✅ | ✅ | ✅ | — | Vykání (forma "vy"). |
| 🇩🇰 | Dinamarquês | `da` | ✅ | ✅ | ✅ | — | |
| 🇬🇷 | Grego | `el` | ✅ | ✅ | ✅ | — | Δημοτική moderno. |
| 🇮🇷 | Persa | `fa` | ✅ | ✅ | ✅ | — | RTL. |
| 🇫🇮 | Finlandês | `fi` | ✅ | ✅ | ✅ | — | Sem gênero gramatical. |
| 🇮🇱 | Hebraico | `he` | ✅ | ✅ | ✅ | — | RTL. |
| 🇮🇳 | Hindi | `hi` | ✅ | ✅ | ✅ | — | शुद्ध हिन्दी. Mínimo de estrangeirismos do inglês. |
| 🇭🇺 | Húngaro | `hu` | ✅ | ✅ | ✅ | — | Forma "Ön". |
| 🇮🇩 | Indonésio | `id` | ✅ | ✅ | ✅ | — | |
| 🇲🇾 | Malaio | `ms` | ✅ | ✅ | ✅ | — | |
| 🇳🇱 | Holandês | `nl` | ✅ | ✅ | ✅ | — | Forma "U". |
| 🇳🇴 | Norueguês | `nb` | ✅ | ✅ | ✅ | — | Bokmål. |
| 🇵🇱 | Polonês | `pl` | ✅ | ✅ | ✅ | — | Forma "Pan/Pani". |
| 🇵🇹 | Português (EU) | `pt-PT` | ✅ | ✅ | ✅ | — | Português de Portugal. |
| 🇷🇴 | Romeno | `ro` | ✅ | ✅ | ✅ | — | |
| 🇷🇺 | Russo | `ru` | ✅ | ✅ | ✅ | — | Forma "Вы". |
| 🇸🇰 | Eslovaco | `sk` | ✅ | ✅ | ✅ | — | Vykanie (forma "vy"). |
| 🇷🇸 | Sérvio | `sr` | ✅ | ✅ | ✅ | 🔤 Latino→Cirílico | Conversor de script determinístico. |
| 🇸🇪 | Sueco | `sv` | ✅ | ✅ | ✅ | — | |
| 🇰🇪 | Suaíli | `sw` | ✅ | ✅ | ✅ | — | |
| 🇹🇭 | Tailandês | `th` | ✅ | ✅ | ✅ | — | Partículas de polidez ครับ/ค่ะ. |
| 🇹🇷 | Turco | `tr` | ✅ | ✅ | ✅ | — | Forma "Siz". |
| 🇺🇦 | Ucraniano | `uk` | ✅ | ✅ | ✅ | — | Forma "Ви". |
| 🇵🇰 | Urdu | `ur` | ✅ | ✅ | ✅ | — | RTL. Forma آپ. |
| 🇻🇳 | Vietnamita | `vi` | ✅ | ✅ | ✅ | — | |
| 🇹🇼 | Chinês (Tradicional) | `zh-TW` | ✅ | ✅ | ✅ | — | 繁體中文. |

## Variantes Regionais

| Bandeira | Idioma | Código | Google | LLM | Coached | Script | Notas |
|------|----------|------|:------:|:---:|:-------:|--------|-------|
| 🇲🇽 | Espanhol Mexicano | `es-MX` | ✅ | ✅ | ✅ | — | Forma "Tú". Registro caloroso. |
| 🇨🇦 | Francês Canadense | `fr-CA` | ✅ | ✅ | ✅ | — | Expressões do Québécois. |

---

## Idiomas Indígenas e de Baixo Recurso

Estes idiomas não são suportados por serviços comerciais de MT. O rosetta fornece as ferramentas para que as comunidades linguísticas construam seus próprios métodos sob os [princípios OCAP](https://mtevalarena.org/docs/community/low-resource-languages).

| | Idioma | Código | Google | LLM | Coached | Script | Status |
|---|----------|------|:------:|:---:|:-------:|--------|--------|
| 🪶 | Plains Cree | `crk` | ❌ | ✅ | ✅ | 🔤 SRO→Silábico | 🚧 Em desenvolvimento |

:::info O Plains Cree está em desenvolvimento ativo
O registro, a infraestrutura de coaching, o conversor de script e o ambiente de avaliação para o Plains Cree são todos funcionais, mas o pipeline de tradução **ainda não foi lançado**. Estamos trabalhando com as comunidades linguísticas sob os [princípios OCAP](https://mtevalarena.org/docs/community/low-resource-languages) para garantir a qualidade antes do lançamento. Consulte [Apoie um Idioma de Baixo Recurso](https://mtevalarena.org/docs/community/low-resource-languages) para ver a história completa — e como você pode contribuir.
:::

:::tip Adicionando mais idiomas de baixo recurso
O sistema de plugins de métodos do rosetta foi projetado para isso. Uma comunidade linguística pode construir um método de tradução personalizado, hospedá-lo sob seu próprio controle e servi-lo por meio do [método API](/docs/guides/serving-a-method). O [Method Leaderboard](/leaderboard) rastreia as pontuações para qualquer par de idiomas — construa um método, execute o ambiente de avaliação e conquiste a pontuação mais alta.
:::

---

## Idiomas Construídos (Conlangs)

Conlangs são suportados por meio de registros LLM e conversores de script opcionais. Eles usam a mesma infraestrutura dos idiomas reais — o portão de qualidade, o sistema de coaching e o pipeline de conversão de script funcionam de forma idêntica.

| | Idioma | Código | Google | LLM | Script | Notas |
|---|----------|------|:------:|:---:|--------|-------|
| 🖖 | Klingon | `tlh` | ❌ | ✅ | 🔤 Romanização→pIqaD | Fonte PUA necessária. Vocabulário de Marc Okrand. |
| 🧝 | Sindarin (Élfico de Tolkien) | `x-elvish-s` | ❌ | ✅ | 🔤 Latino→Tengwar | Fonte CSUR PUA necessária. |
| 🏴‍☠️ | Inglês Pirata | `x-pirate` | ❌ | ✅ | — | Apenas registro. Metáforas náuticas. |
| 🦸 | Kryptoniano | `x-kryptonian` | ❌ | ✅ | 🔤 Latino→Kryptoniano | Fonte PUA necessária. |
| 🎭 | Inglês Shakespeariano | `x-shakespeare` | ❌ | ✅ | — | Apenas registro. Formas thee/thou, -eth/-est. |
| 🐸 | Idioma do Yoda | `x-yoda` | ❌ | ✅ | — | Apenas registro. Ordem de palavras OSV. |

Consulte [Conlangs, Scripts e Ortografia](/docs/guides/conlangs-scripts-orthography) para requisitos de fontes PUA, limitações do Unicode e como adicionar o seu próprio.

---

## Predefinições de Idioma

O assistente `init` suporta nomes predefinidos para configuração rápida. Você pode misturar predefinições com códigos individuais.

| Predefinição | Expande Para |
|--------|-----------|
| `european` | fr, de, es, it, pt, nl |
| `asian` | ja, zh, ko |
| `global` | fr, es, de, ja, zh, ko, pt, ar |
| `nordic` | da, fi, nb, sv |

```bash
# Mix presets with individual codes
i18n-rosetta init
# → Target languages: european, ja
# → Resolves to: fr, de, es, it, pt, nl, ja
```

---

## Adicionando Qualquer Idioma

O rosetta pode traduzir para **qualquer idioma que o seu LLM conheça** — a tabela acima apenas lista os idiomas com predefinições de registro integradas. Para adicionar um idioma não listado, inclua seu código BCP-47 na sua configuração:

```json
{
  "languages": {
    "sw": {},
    "am": {
      "register": "Formal Amharic. Professional register with Geʽez script."
    }
  }
}
```

O LLM traduzirá usando seu conhecimento de treinamento do idioma. Definir um `register` oferece controle sobre o tom, a formalidade e as convenções ortográficas. Consulte [Configuração](/docs/getting-started/configuration) para obter detalhes.

---

## Language Cards

Cada idioma integrado possui um **Language Card** — um arquivo JSON em `lib/data/language-cards/` contendo:

| Campo | O Que Contém |
|-------|------------------|
| **Sistema de formalidade** | Distinção T-V, níveis de fala, keigo, partículas, etc. |
| **Predefinições de registro** | Predefinições nomeadas específicas para o caráter do idioma |
| **Suporte a métodos** | Quais APIs de tradução suportam este idioma |
| **Orientação de gênero** | Regras de gênero gramatical e dicas de escrita inclusiva |
| **Script/direção** | Código de script ISO 15924 e RTL/LTR |
| **Conjuntos de dados de avaliação** | Quais benchmarks cobrem este idioma |

### Usando Chaves Predefinidas

Em vez de escrever o texto completo do registro, você pode usar um nome de chave predefinida:

```json
{
  "languages": {
    "fr": "casual-tu",
    "ko": "formal-hapsyo",
    "ja": "polite"
  }
}
```

O rosetta resolve a chave para o prompt de registro completo. Execute `npx i18n-rosetta init` para ver as predefinições disponíveis para cada idioma.

### Exemplos de Predefinições

| Idioma | Predefinições | Padrão |
|----------|---------|--------|
| Francês | `formal-vous`, `casual-tu` | `formal-vous` |
| Coreano | `polite-haeyo`, `formal-hapsyo`, `casual-hae` | `polite-haeyo` |
| Japonês | `polite`, `formal-keigo`, `casual` | `polite` |
| Alemão | `formal-Sie`, `casual-du` | `formal-Sie` |
| Tailandês | `neutral-professional`, `polite-male`, `polite-female` | `neutral-professional` |
| Espanhol | `neutral-professional`, `formal-usted`, `casual-tuteo` | `neutral-professional` |

Consulte [Contribuindo com um Language Card](https://github.com/nicholasgriffintn/i18n-rosetta/blob/main/docs/planning/LANGUAGE_CARD_SPEC.md) para saber como adicionar ou melhorar predefinições.

---

## Veja Também

- [Configuração](/docs/getting-started/configuration) — referência completa de configuração, incluindo a definição de idiomas
- [Métodos de Tradução](/docs/guides/translation-methods) — como cada método funciona
- [Conversores de Script](/docs/concepts/script-converters) — pipeline de conversão de script determinístico
- [Conlangs, Scripts e Ortografia](/docs/guides/conlangs-scripts-orthography) — fontes PUA, Unicode, adição de conlangs
- [Apoie um Idioma de Baixo Recurso](https://mtevalarena.org/docs/community/low-resource-languages) — construção de métodos para idiomas sub-representados