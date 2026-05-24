---
sidebar_position: 1
title: "Referência da CLI"
---
# Referência da CLI

## Comandos

```
i18n-rosetta init              Interactive setup wizard (--yes for quick defaults)
i18n-rosetta sync              Translate & sync all locale files
i18n-rosetta watch             Auto-sync when the source file changes
i18n-rosetta audit             List all untranslated [EN] fallback values
i18n-rosetta lint              Scan source code for hardcoded strings
i18n-rosetta wrap              Auto-wrap hardcoded strings in t() calls (with undo)
i18n-rosetta seo <sub>         Generate hreflang, sitemap.xml, or JSON-LD schema
i18n-rosetta integrity         Audit locale files for format/encoding issues
i18n-rosetta status            Show pair configuration, plugins, and quality tiers
i18n-rosetta provenance        Audit translation resource licensing
i18n-rosetta plugin <sub>      Manage method plugins (install, remove, list)
```

Execute `i18n-rosetta <command> --help` para obter ajuda detalhada sobre qualquer comando.

## Opções Globais

```
--help, -h              Show help (global or per-command)
--version, -v           Print version and exit
--yes, -y               Skip interactive prompts, use defaults
--config <path>         Custom config file path
--dir <path>            Override locales directory
--content-dir <path>    Hugo/Docusaurus content directory for Markdown translation
--source <code>         Override source locale (default: en)
--model <model>         Override translation model
--method <method>       Translation method: llm, google-translate (default: from config)
--format <fmt>          Locale file format: json, toml, yaml, or auto
--dry                   Preview changes without writing files
```

---

## init

Assistente de configuração interativo que cria o `i18n-rosetta.config.json`. Orienta sobre o locale de origem, idiomas de destino, formato de arquivo e modelo de tradução.

```bash
i18n-rosetta init                          # interactive wizard
i18n-rosetta init --yes                    # skip wizard, use defaults
i18n-rosetta init --yes --langs fr,de,ja   # quick setup with specific languages
i18n-rosetta init --source en --dir ./i18n # overrides with defaults
```

**Opção `--langs`**: Lista de códigos de idiomas de destino separados por vírgula. Ignora o prompt de idioma e aplica as predefinições de registro padrão para cada idioma. Combine com `--yes` para uma configuração totalmente não interativa.

**Predefinições de idioma**: Quando solicitado a informar os idiomas de destino, você pode digitar os nomes das predefinições:
- `european` → fr, de, es, it, pt, nl
- `asian` → ja, zh, ko
- `global` → fr, es, de, ja, zh, ko, pt, ar
- `nordic` → da, fi, nb, sv

Misture predefinições e códigos individuais: `european, ja` → fr, de, es, it, pt, nl, ja

---

## sync

Traduz chaves ausentes, desatualizadas e de fallback em todos os arquivos de locale.

```bash
i18n-rosetta sync                                   # translate everything
i18n-rosetta sync --dry                             # preview only
i18n-rosetta sync --force-keys "hero.title"         # force re-translate
i18n-rosetta sync --force-keys "a.title,a.subtitle" # multiple keys
i18n-rosetta sync --content-dir ./content           # include Hugo Markdown
i18n-rosetta sync --method google-translate          # force Google Translate
i18n-rosetta sync --fallback                         # write [EN] prefixes on failure
```

**Detecção de alterações**: o rosetta armazena hashes SHA-256 no `.i18n-rosetta.lock`. Quando os valores de origem mudam, o próximo sync traduz automaticamente essas chaves novamente. Faça o commit do arquivo de lock para que todos os desenvolvedores compartilhem a mesma base.

---

## watch

Sincronização automática quando o arquivo de locale de origem é alterado. É executado até ser interrompido com `Ctrl+C`.

```bash
i18n-rosetta watch
```

---

## audit

Lista todos os valores de fallback não traduzidos com o prefixo `[EN]`. Sai com o código 1 se algum for encontrado — use como um gate de CI para falhar builds com traduções incompletas.

```bash
i18n-rosetta audit
```

---

## lint

Verifica o código-fonte em busca de strings hardcoded voltadas para o usuário que deveriam usar chamadas de tradução i18n. Detecta automaticamente o seu framework (next-intl, react-i18next, vue-i18n, Hugo).

```bash
i18n-rosetta lint                    # exits 1 if issues found
i18n-rosetta lint --warn-only        # always exits 0
i18n-rosetta lint --src ./app        # custom source directory
i18n-rosetta lint --min-length 4     # minimum string length to flag
```

**O que ele detecta:**
- Strings hardcoded em texto JSX, `placeholder`, `alt`, `aria-label`, `title`
- Arquivos com conteúdo voltado para o usuário, mas sem importação do framework i18n
- Chaves mortas — chaves de locale que nenhum arquivo de origem faz referência
- Pontuação de cobertura — porcentagem de strings que passam pelo i18n

**Exclusões**: Crie o `.rosettaignore` na raiz do seu projeto (padrões glob, como `.gitignore`).

---

## wrap

Envolve automaticamente as strings hardcoded detectadas pelo `lint` em chamadas `t()`. Cria backups automáticos antes de modificar os arquivos.

```bash
i18n-rosetta wrap                    # auto-wrap with backup
i18n-rosetta wrap --dry              # preview wrapping changes
i18n-rosetta wrap --undo             # restore from .rosetta-backup/
```

**Garantias de segurança:**
1. Verificação de repositório Git limpo (ignorado no dry-run)
2. Backup automático para `.rosetta-backup/`
3. Visualização do diff antes de cada gravação de arquivo
4. Suporte a `--undo` para restaurar a partir do backup

---

## seo

Gera artefatos de SEO para sites multilíngues.

```bash
i18n-rosetta seo hreflang                                        # print hreflang tags
i18n-rosetta seo sitemap --base-url https://example.com --out sitemap.xml
i18n-rosetta seo jsonld --base-url https://example.com           # JSON-LD schema
```

| Subcomando | Saída |
|------------|-------|
| `hreflang` | Tags `<link rel="alternate" hreflang>` |
| `sitemap` | `sitemap.xml` multilíngue |
| `jsonld` | JSON-LD WebSite language schema |

---

## integrity

Detecta corrupção e desvios nos arquivos de locale traduzidos.

```bash
i18n-rosetta integrity               # exits 1 if issues found
i18n-rosetta integrity --warn-only   # non-blocking
```

**O que ele verifica:**
- Corrupção de placeholders (ex.: `{name}` presente na origem, mas ausente no destino)
- Problemas de codificação (mojibake, Unicode inválido)
- Cópias não traduzidas (valor de destino idêntico ao de origem)
- Chaves órfãs (chaves no destino que não existem na origem)

---

## status

Mostra a configuração de pares, plugins instalados, níveis de qualidade e pontuações de benchmark.

```bash
i18n-rosetta status
```

---

## provenance

Audita o licenciamento dos recursos de tradução para todos os plugins instalados.

```bash
i18n-rosetta provenance
```

---

## plugin

Gerencia os plugins de métodos de tradução. Plugins são receitas de tradução pré-empacotadas instaladas no `.rosetta/methods/`.

```bash
i18n-rosetta plugin list                      # show installed plugins
i18n-rosetta plugin install ./my-method/      # install from local directory
i18n-rosetta plugin remove crk-coached-v1     # remove a plugin
```

Consulte a [Especificação de Plugins](/docs/reference/plugin-spec) para ver o formato do manifesto do plugin.

---

## Pipeline de Três Camadas

Use `lint`, `sync` e `audit` juntos para um i18n à prova de falhas:

```json title="package.json"
{
  "scripts": {
    "i18n:lint": "i18n-rosetta lint",
    "i18n:sync": "i18n-rosetta sync",
    "i18n:audit": "i18n-rosetta audit"
  }
}
```

| Camada | Comando | Quando | Propósito |
|--------|---------|--------|-----------|
| **Lint** | `lint` | Pre-commit | Bloqueia commits com strings hardcoded |
| **Sync** | `sync` | Post-commit / CI | Traduz chaves ausentes e alteradas |
| **Audit** | `audit` | Etapa de build | Falha o deploy se algum locale estiver incompleto |

---

## Veja Também

- [Configuração](/docs/getting-started/configuration) — referência do arquivo de configuração
- [Métodos de Tradução](/docs/guides/translation-methods) — seleção de método por par
- [Especificação de Plugins](/docs/reference/plugin-spec) — formato do manifesto do plugin
- [Guia de CI/CD](/docs/guides/ci-cd) — automatizando comandos da CLI no seu pipeline
- [Como o Sync Funciona](/docs/concepts/how-sync-works) — entendendo o pipeline de sincronização
- [Quality Gate](/docs/concepts/quality-gate) — como as traduções são validadas