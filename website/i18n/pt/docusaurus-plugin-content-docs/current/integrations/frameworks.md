# Guias de Integração

Configuração passo a passo do i18n-rosetta com frameworks populares.

---

## Configuração da Chave de API

Antes de integrar com qualquer framework, você precisa de uma chave de API de tradução. O Rosetta suporta dois provedores:

### Opção A: OpenRouter (recomendado)

O [OpenRouter](https://openrouter.ai) fornece uma API unificada para mais de 200 modelos LLM. Plano gratuito disponível.

```bash
# Sign up at https://openrouter.ai, then:
export OPENROUTER_API_KEY=sk-or-v1-...

# Or add to .env.local:
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Melhor para: projetos com muito conteúdo, tradução de Markdown e projetos que precisam de proteção sensível ao conteúdo (blocos de código, shortcodes, variáveis de interpolação).

### Opção B: Google Translate

```bash
export GOOGLE_TRANSLATE_API_KEY=...
```

Melhor para: alto volume de pares de strings chave-valor (mais de 130 idiomas). **Não recomendado** para conteúdo em Markdown — o Google Translate não tem conhecimento de blocos de código, shortcodes ou variáveis de interpolação.

Para usar o Google Translate explicitamente:

```bash
i18n-rosetta sync --method google-translate
```

> **Dica**: Se apenas `GOOGLE_TRANSLATE_API_KEY` estiver configurado (sem chave do OpenRouter), o rosetta muda para o Google Translate automaticamente.

---

## Hugo (TOML / YAML / Markdown)

### Estrutura do projeto

O Hugo usa `i18n/` para traduções de strings e `content/` para o conteúdo da página:

```
my-hugo-site/
├── i18n/
│   ├── en.toml             ← source of truth
│   ├── fr.toml
│   └── ja.toml
├── content/
│   ├── posts/
│   │   ├── hello.md        ← source (English)
│   │   ├── hello.fr.md
│   │   └── hello.ja.md
│   └── about.md
└── .env.local
```

### Configuração

```bash
npm install --save-dev i18n-rosetta
```

```bash
# .env.local
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Crie `i18n-rosetta.config.json`:

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./i18n",
  "contentDir": "./content",
  "format": "auto",
  "languages": ["fr", "de", "ja", "es", "ko", "zh"]
}
```

```bash
i18n-rosetta sync           # sync i18n string files + content files
i18n-rosetta sync --dry     # preview changes without writing
```

### Detalhes da tradução de conteúdo

**Front matter**: Suporta delimitadores YAML (`---`) e TOML (`+++`). Traduz `title`, `description`, `summary`, `subtitle`, `caption` e `linkTitle` por padrão. Todos os outros campos (date, draft, tags, weight, slug, etc.) são preservados. Personalize com `translatableFields` na sua configuração.

**Proteção de blocos**: Blocos de código, shortcodes do Hugo (`{{< >}}`, `{{% %}}`), código inline e HTML bruto são protegidos automaticamente usando placeholders de sentinela Unicode. Eles passam intactos.

**Convenção de nomenclatura de arquivos**: Segue o padrão de tradução por nome de arquivo do Hugo:
- `my-post.md` → `my-post.fr.md`
- `my-post.en.md` → `my-post.fr.md` (remove o sufixo de origem)

**Ignorar existentes**: Arquivos traduzidos existentes nunca são sobrescritos. Exclua um arquivo de destino para forçar uma nova tradução.

### Formas plurais

Os locales em TOML e YAML suportam formas plurais do CLDR:

```toml
[items]
one = "{{ .Count }} item"
other = "{{ .Count }} items"
```

Representados internamente como `items.one` e `items.other` para comparação (diffing), e depois re-serializados para o formato seccionado correto na gravação.

---

## next-intl (JSON)

### Estrutura do projeto

```
my-app/
├── messages/
│   └── en.json        ← source of truth
├── src/
│   ├── i18n/
│   │   ├── routing.ts
│   │   └── request.ts
│   └── middleware.ts
└── .env.local
```

### Configuração

```bash
npm install --save-dev i18n-rosetta
```

Crie `i18n-rosetta.config.json`:

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./messages",
  "languages": ["fr", "de", "ja", "es", "ko", "zh", "pt", "ar"]
}
```

```bash
npx i18n-rosetta sync
```

Cria `messages/fr.json`, `messages/ja.json`, etc. — totalmente traduzidos, preservando sua estrutura de chaves aninhadas. O next-intl os reconhece automaticamente.

### Fluxo de desenvolvimento

```json
{
  "scripts": {
    "dev": "i18n-rosetta watch & next dev",
    "i18n:sync": "i18n-rosetta sync",
    "i18n:audit": "i18n-rosetta audit"
  }
}
```

---

## react-i18next (JSON)

### Estrutura de arquivos plana (recomendado)

```
locales/
├── en.json
├── fr.json
└── ja.json
```

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "languages": ["fr", "de", "ja"]
}
```

### Estrutura de diretórios aninhada

Se você usa a estrutura `{locale}/{namespace}.json`, crie um script de sincronização para achatar (flatten) → traduzir → desachatar (unflatten). Consulte a [documentação do react-i18next](https://react.i18next.com/) para mais detalhes.