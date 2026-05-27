---
sidebar_position: 3
title: "Conlangs, Escritas e Ortografia"
---
# Conlangs, Scripts e Ortografia

O rosetta tem suporte de primeira classe para línguas construídas (conlangs) por meio de registros de LLM e conversores de script determinísticos. Este guia aborda como o suporte a conlangs funciona, quais fontes você precisa e como adicionar as suas próprias.

:::tip Por que as conlangs são importantes
As conlangs não são apenas uma novidade — elas exercitam exatamente a mesma infraestrutura usada para línguas reais sub-representadas. O quality gate, o sistema de coaching e o pipeline de conversão de script funcionam de forma idêntica para o Klingon e o Cree das Planícies. Se o seu pipeline de conlang funciona, o seu pipeline de línguas com poucos recursos também funcionará.
:::

---

## Línguas Construídas Suportadas

| Idioma | Código | Conversor de Script | Fonte Necessária |
|----------|------|:----------------:|:-------------:|
| Klingon | `tlh` | ✅ Romanização → pIqaD | Fonte PUA (ex., pIqaD qolqoS) |
| Sindarin (Élfico de Tolkien) | `x-elvish-s` | ✅ Latim → Tengwar | Fonte PUA CSUR |
| Kryptoniano | `x-kryptonian` | ✅ Latim → Kryptoniano | Fonte PUA |
| Inglês Pirata | `x-pirate` | ❌ apenas registro | Nenhuma |
| Inglês Shakespeariano | `x-shakespeare` | ❌ apenas registro | Nenhuma |
| Idioma do Yoda | `x-yoda` | ❌ apenas registro | Nenhuma |

Os códigos de conlang usam o prefixo `x-` de acordo com a convenção de uso privado BCP-47, exceto o Klingon (`tlh`), que possui um código [ISO 639-3](https://iso639-3.sil.org/code/tlh) atribuído pela SIL International.

---

## Requisitos de Unicode, PUA e Fontes

### A Área de Uso Privado (PUA)

Klingon (pIqaD), Sindarin (Tengwar) e Kryptoniano usam caracteres da **Área de Uso Privado (PUA)** do Unicode. A PUA é o intervalo U+E000–U+F8FF — esses pontos de código **não têm atribuição padrão**. O [ConScript Unicode Registry (CSUR)](https://www.evertype.com/standards/csur/) mantém mapeamentos acordados pela comunidade para scripts fictícios, mas eles não fazem parte do padrão Unicode.

O que isso significa na prática:

- O texto PUA é renderizado como **caixas vazias** (□□□) sem a fonte correta carregada
- Fontes diferentes podem mapear glifos diferentes para os mesmos pontos de código PUA
- O rosetta NÃO inclui fontes PUA — você mesmo deve carregá-las
- As fontes do sistema nunca renderizarão esses caracteres

### Intervalos PUA por Script

| Script | Intervalo PUA | Referência CSUR |
|--------|-----------|---------------|
| Klingon (pIqaD) | U+F8D0–U+F8FF | [CSUR Klingon](https://www.evertype.com/standards/csur/klingon.html) |
| Tengwar (Élfico) | U+E000–U+E07F | [CSUR Tengwar](https://www.evertype.com/standards/csur/tengwar.html) |
| Kryptoniano | Varia de acordo com a fonte | Sem padrão CSUR |

### Carregando Web Fonts PUA

O rosetta inclui um comando integrado para baixar e gerenciar web fonts PUA:

```bash
# See which fonts are needed for your configured languages
i18n-rosetta fonts list

# Download all needed fonts (auto-detects project type for output directory)
i18n-rosetta fonts install

# Also generate a CSS snippet with @font-face declarations
i18n-rosetta fonts install --css
```

O comando `fonts install` faz o download de repositórios de código aberto verificados:

| Fonte | Script | Licença | Origem |
|------|--------|---------|--------|
| pIqaD qolqoS | Klingon | SIL Open Font License 1.1 | [GitHub](https://github.com/dadap/pIqaD-fonts) |
| FreeMonoTengwar | Tengwar | GNU GPL v3 (com exceção de fonte) | [SourceForge](https://sourceforge.net/projects/freetengwar/) |
| *(fornecida pelo usuário)* | Kryptoniano | Varia | Nenhuma fonte PUA de código aberto disponível |

O diretório de saída é detectado automaticamente a partir da estrutura do seu projeto (Docusaurus → `static/fonts/`, Hugo → `static/fonts/`, padrão → `public/fonts/`). Substitua com `--dir`.

Se você preferir gerenciar as fontes manualmente, adicione regras `@font-face` no seu CSS:

```css
@font-face {
  font-family: 'pIqaD';
  src: url('/fonts/pIqaDqolqoS.ttf') format('truetype');
  font-display: swap;
  unicode-range: U+F8D0-F8FF;
}

/* Apply to Klingon text elements */
[lang="tlh"], [data-script="piqad"] {
  font-family: 'pIqaD', sans-serif;
}
```

:::warning O suporte a Unicode NÃO é garantido
O Unicode Consortium [recusou explicitamente](https://www.unicode.org/faq/private_use.html) a codificação de scripts fictícios no padrão. As atribuições PUA são mantidas pela comunidade e podem entrar em conflito entre as implementações de fontes. Sempre especifique a fonte exata que o seu projeto usa e teste a renderização em diferentes navegadores.
:::

---

## Conversores de Script

### Como Eles Funcionam

A conversão de script do rosetta é um **hook pós-tradução**:

1. O LLM traduz o texto para um **script de trabalho** (geralmente Latim ou SRO)
2. O [quality gate](/docs/concepts/quality-gate) valida a saída
3. O conversor determinístico transforma o texto validado no **script de exibição**
4. O texto convertido é gravado no disco

Essa abordagem em duas etapas funciona porque os LLMs produzem resultados melhores ao trabalhar em scripts baseados no latim. O conversor determinístico garante a saída correta do script sem depender do conhecimento (muitas vezes não confiável) do modelo sobre o script.

### Todos os Cinco Conversores

O rosetta vem com cinco conversores de script integrados:

#### Cree das Planícies: SRO → Silábicos (`crk`)

Ortografia Romana Padrão (SRO) para Silábicos Aborígenes Canadenses.

```
Input:  "tawâw"
Output: "ᑕᐚᐤ"
```

Vogais longas usam mácron/circunflexo: ê, î, ô, â. O conversor lida com todos os diacríticos SRO e os mapeia para os caracteres silábicos corretos. Consulte [Support a Low-Resource Language](https://mtevalarena.org/docs/community/low-resource-languages) para ver o pipeline completo do Cree.

#### Sérvio: Latim → Cirílico (`sr`)

Conversão determinística de Latim para Cirílico para o Sérvio.

```
Input:  "zdravo"
Output: "здраво"
```

Isso lida com o mapeamento completo do alfabeto sérvio, incluindo dígrafos (lj → љ, nj → њ, dž → џ).

#### Klingon: Romanização → pIqaD (`tlh`)

Sistema de romanização de Marc Okrand para caracteres PUA pIqaD.

```
Input:  "Qapla'"    (romanized Klingon)
Output: [pIqaD PUA] (requires pIqaD font to render)
```

#### Sindarin: Latim → Tengwar (`x-elvish-s`)

Mapeamento Tengwar no modo Sindarin de Tolkien.

```
Input:  "elen síla"  (Latin Sindarin)
Output: [Tengwar PUA] (requires Tengwar font to render)
```

#### Kryptoniano: Latim → Kryptoniano (`x-kryptonian`)

Mapeamento do script Kryptoniano do léxico de fãs.

```
Input:  "Kal-El"
Output: [Kryptonian PUA] (requires Kryptonian font to render)
```

### Acionando um Conversor

Defina o campo `scripts` na configuração do seu idioma. Para conversores integrados, isso é detectado automaticamente a partir do código do idioma:

```json
{
  "languages": {
    "sr": { "scripts": "sr" },
    "crk": {}
  }
}
```

O Cree das Planícies (`crk`) é detectado automaticamente — você não precisa definir `scripts` explicitamente.

---

## Idiomas Multi-Script

Alguns idiomas reais usam vários scripts ativos:

| Idioma | Scripts | Abordagem do rosetta |
|----------|---------|-----------------|
| Sérvio | Latim + Cirílico | Conversor de script (`sr`) — traduz em Latim, converte para Cirílico |
| Chinês | Simplificado + Tradicional | Códigos de localidade separados (`zh` vs `zh-TW`) com registros distintos |

Para idiomas em que ambos os scripts atendem ao mesmo público (Sérvio), use um conversor de script. Para idiomas em que os scripts atendem a públicos diferentes (Chinês Simplificado para a China continental, Tradicional para Taiwan/HK), use códigos de localidade separados.

---

## Notas de Ortografia

Os registros não são apenas sobre o tom — eles carregam **instruções ortográficas** que orientam o LLM em direção às convenções de escrita corretas.

### Formas de Tratamento Formal

Os registros integrados do rosetta incluem o tratamento formal culturalmente apropriado para cada idioma:

| Idioma | Forma Formal | Instrução de Registro |
|----------|------------|---------------------|
| Alemão | Sie | `Use Sie-form for formal address` |
| Francês | vous | `Use vous-form` |
| Russo | вы | `Professional register with вы-form` |
| Turco | siz | `Professional register with siz-form` |
| Coreano | 합쇼체 | `Formal Korean (합쇼체)` |
| Japonês | です/ます | `Polite professional register (です/ます form)` |
| Polonês | Pan/Pani | `Professional register with Pan/Pani form` |

### Escrita Inclusiva de Gênero

Cada cartão de idioma tem um campo `gender.inclusiveGuidance` com conselhos específicos do idioma. Isso é injetado no prompt de tradução do LLM separadamente da predefinição de registro, para que se aplique de forma consistente, independentemente da predefinição de formalidade que o usuário escolher:

- **Francês**: Écriture inclusive com notação de ponto mediano (ex., "Connecté·e")
- **Alemão**: Notação Doppelpunkt (ex., "Benutzer:innen")
- **Espanhol**: Preferência por reestruturação neutra em termos de gênero; notação de barra (ex., "usuario/a") como alternativa

Para idiomas sem orientação específica em seu cartão (ex., Coreano, conlangs), o sistema recorre a uma regra genérica: *"prefira formas neutras em termos de gênero ou a opção mais inclusiva disponível."*

### Requisitos de Script RTL

Os registros de Árabe, Hebraico, Persa e Urdu observam os requisitos da direita para a esquerda (RTL): `Ensure text reads naturally in RTL layout contexts.`

### Substituindo Qualquer Registro

Todo registro é um valor de configuração — substitua-o para corresponder à voz do seu projeto:

```json
{
  "languages": {
    "fr": {
      "register": "Casual French. Use tu-form. Conversational blog tone. Gender-neutral when possible."
    },
    "de": {
      "register": "Informal German. Use du-form. Tech startup voice."
    }
  }
}
```

Consulte [Configuração](/docs/getting-started/configuration) para ver a referência completa de configuração.

---

## Adicionando uma Nova Conlang

### Passo a passo

1. **Escolha um código de uso privado BCP-47**: Use o prefixo `x-` (ex., `x-dothraki`, `x-valyrian`).

2. **Adicione à sua configuração**:

```json
{
  "languages": {
    "x-dothraki": {
      "register": "Dothraki language. Use David J. Peterson's vocabulary from the Living Language Dothraki textbook. Harsh, direct tone. No articles, no verb 'to be'."
    }
  }
}
```

3. **(Opcional) Adicione um conversor de script**: Se a sua conlang usar um script de exibição não latino, adicione um conversor em `lib/scripts.js` e registre-o em `SCRIPT_CONVERTERS`.

4. **Teste**: Execute `i18n-rosetta sync --dry` para visualizar as traduções sem gravar arquivos.

5. **Verifique o quality gate**: O [quality gate](/docs/concepts/quality-gate) pode precisar de ajustes para a sua conlang — particularmente a verificação `requireNonLatin` se a sua conlang usar caracteres PUA.

:::note A qualidade da conlang depende do conhecimento do LLM
O LLM só pode traduzir para uma conlang que ele tenha visto nos dados de treinamento. Conlangs bem documentadas (Klingon, Sindarin, Dothraki) funcionam bem. Conlangs obscuras ou recém-inventadas podem produzir resultados inconsistentes. Use [dados de coaching](/docs/concepts/coaching-data) para melhorar a qualidade.
:::

---

## Veja Também

- [Idiomas Suportados](/docs/reference/supported-languages) — tabela completa de idiomas com a disponibilidade de métodos
- [Conversores de Script](/docs/concepts/script-converters) — detalhes técnicos do pipeline de conversão
- [Métodos de Tradução](/docs/guides/translation-methods) — como cada método de tradução funciona
- [Configuração](/docs/getting-started/configuration) — referência de configuração, incluindo configuração de idioma e registro
- [Support a Low-Resource Language](https://mtevalarena.org/docs/community/low-resource-languages) — a mesma infraestrutura aplicada a idiomas reais sub-representados