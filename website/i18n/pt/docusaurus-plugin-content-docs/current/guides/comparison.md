---
sidebar_position: 7
title: "Comparação"
---
# Como o Rosetta se Compara

O i18n-rosetta ocupa uma categoria diferente da maioria das ferramentas de localização. Aqui está uma comparação honesta.

## O Cenário

A maioria das ferramentas de localização se enquadra em uma destas três categorias:

| Categoria | Exemplos | Modelo |
|----------|----------|-------|
| **Plataformas TMS em Nuvem** | Crowdin, Phrase, Locize, Tolgee | Dashboard SaaS + tradutores humanos + assinatura mensal |
| **Ferramentas de Extração de Chaves** | i18next-scanner, FormatJS CLI | Varredura do código-fonte em busca de chamadas de função de tradução |
| **Motores de Tradução CLI** | **i18n-rosetta** | Roda no seu projeto, traduz arquivos diretamente, sem conta na nuvem |

O Rosetta é um **motor de tradução CLI** — ele traduz seus arquivos de locale diretamente usando backends configuráveis (LLMs, Google Translate, plugins personalizados). Sem dashboard na nuvem, sem fluxo de trabalho com tradutores humanos, sem mensalidade.

---

## Comparação de Recursos

| Recurso | i18n-rosetta | Crowdin | Phrase | Locize |
|---------|:------------:|:-------:|:------:|:------:|
| **Roda localmente (sem conta na nuvem)** | ✅ | ❌ | ❌ | ❌ |
| **Zero dependências** | ✅ | ❌ | ❌ | ❌ |
| **Configuração de método por par de idiomas** | ✅ | ❌ | ❌ | ❌ |
| **Registros de idioma personalizados** | ✅ | ❌ | ❌ | ❌ |
| **Sensível ao conteúdo (protege blocos de código)** | ✅ | ❌ | ❌ | ❌ |
| **Conversão de conlangs e scripts** | ✅ | ❌ | ❌ | ❌ |
| **Arquitetura de plugins** | ✅ | ❌ | ❌ | ❌ |
| **Tradução de Markdown / conteúdo** | ✅ | ✅ | ✅ | ❌ |
| **Fluxo de trabalho com tradutor humano** | ❌ | ✅ | ✅ | ✅ |
| **Memória de tradução** | ❌ | ✅ | ✅ | ✅ |
| **Edição em contexto (visual)** | ❌ | ✅ | ✅ | ✅ |
| **Colaboração em equipe** | ❌ | ✅ | ✅ | ✅ |
| **Suporte a formatos de arquivo** | JSON, TOML, YAML, MD | 50+ | 40+ | JSON |
| **Preço** | Gratuito (pague seu LLM) | A partir de $0/mês | A partir de $0/mês | A partir de $0/mês |

---

## Quando Usar o Rosetta

**O Rosetta é uma boa escolha quando:**

- Você quer tradução automática integrada ao seu pipeline de build — e não um fluxo de trabalho separado
- Você precisa de controle de método por idioma (LLM para alguns, Google Translate para outros, plugins personalizados para o resto)
- Você está traduzindo para idiomas sem cobertura de API (indígenas, em risco de extinção, artificiais)
- Você quer uma saída de script determinística (Cree Syllabics, Klingon pIqaD, Tengwar)
- Você quer zero vendor lock-in e zero dependências de nuvem
- Você é um desenvolvedor solo ou uma equipe pequena que não precisa de um fluxo de trabalho com tradutores humanos

**Um TMS em nuvem é uma escolha melhor quando:**

- Você tem tradutores humanos profissionais revisando cada string
- Você precisa de memória de tradução e gerenciamento de glossário em vários projetos
- Você precisa de edição visual em contexto (pré-visualizar traduções dentro da sua UI)
- Você tem uma equipe grande com necessidades de controle de acesso baseado em funções
- Você precisa de suporte a mais de 50 formatos de arquivo

---

## O Que o Rosetta Faz Que Ninguém Mais Faz

### 1. Registros Personalizados

Cada par de idiomas recebe instruções de tom culturalmente apropriadas para o LLM:

```json
{
  "de": {
    "register": "Standard professional register. Use Sie-form for formal address."
  },
  "tl": {
    "register": "Educated Manila Taglish. Use Tagalog as the primary language but keep technical terms in English."
  },
  "tlh": {
    "register": "Warrior's honor. OVS grammar. Use Marc Okrand vocabulary."
  }
}
```

Nenhuma outra ferramenta vem com 47 registros de idioma pré-configurados, ou permite que você defina registros personalizados por projeto.

### 2. Conversores de Script Determinísticos

O Rosetta vem com cinco conversores de script integrados que rodam como hooks pós-tradução — sem necessidade de LLM:

| Locale | Conversão | Exemplo |
|--------|-----------|---------|
| `crk` | SRO → Cree Syllabics | `nêhiyawêwin` → `ᓀᐦᐃᔭᐍᐏᐣ` |
| `sr` | Latino → Cirílico | `Beograd` → `Београд` |
| `tlh` | Romanização → pIqaD | `tlhIngan Hol` → (glifos pIqaD) |
| `x-elvish-s` | Latino → Tengwar | Sindarin → Tengwar (Mode of Beleriand) |
| `x-kryptonian` | Latino → Kryptonian | Substituição de cifra (requer fonte) |

Estes são conversores puros baseados em tabelas de consulta (lookup-table) — determinísticos, auditáveis e com risco zero de alucinação do LLM.

### 3. Proteção Sensível ao Conteúdo

Ao traduzir Markdown ou conteúdo rico, o Rosetta protege:

- Blocos de código delimitados (` ``` `)
- Código inline (`` ` ` ``)
- Shortcodes do Hugo (`{{</* */>}}`, `{{%/* */%}}`)
- Variáveis de interpolação (`{{ .Count }}`, `{name}`, `{{t('key')}}`)
- Blocos de HTML bruto

Eles são substituídos por tokens sentinela Unicode antes da tradução e restaurados depois. O LLM nunca vê seu código, seus shortcodes ou suas variáveis.

### 4. Plugins de Método Orientado

Para idiomas sem cobertura de API, você pode criar um método de tradução orientado (coached):

1. Escrever dados de orientação linguística (regras gramaticais, vocabulário, exemplos)
2. Empacotar como um plugin
3. Fazer o benchmark contra traduções de referência usando o [eval harness](https://github.com/gamedaysuits/gds-mt-eval-harness)
4. Instalar no seu projeto com `i18n-rosetta plugin install`

É assim que o rosetta lida com o Plains Cree — e como você pode lidar com qualquer idioma, incluindo os que ainda não existem.

---

## Conclusão

O Rosetta não é um substituto para o Crowdin. É uma ferramenta diferente para um fluxo de trabalho diferente. Se você precisa de tradutores humanos, use um TMS. Se você precisa de uma CLI que traduza seus arquivos com um único comando e ofereça controle por idioma sobre métodos, modelos e registros — use o rosetta.