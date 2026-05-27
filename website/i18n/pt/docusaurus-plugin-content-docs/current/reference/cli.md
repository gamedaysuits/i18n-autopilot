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
i18n-rosetta fonts <sub>       Download web fonts for PUA script converters
i18n-rosetta tm <sub>          Manage Translation Memory cache (stats, clear)
i18n-rosetta xliff <sub>       Export/import XLIFF 1.2 for professional review
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
--dry, --dry-run        Preview changes without writing files
--concurrency <n>       Max parallel API calls for content translation (default: 12)
--force-content         Re-translate all content files (clears content lock)
--force-keys <keys>     Comma-separated dot-notation keys to force re-translate
--no-tm                 Skip Translation Memory cache for this sync run
--locale <code>         Target locale (xliff export, tm clear)
```

---

## init

Assistente de configuração interativo que cria o `i18n-rosetta.config.json`. Orienta sobre a localidade de origem, idiomas de destino, formato de arquivo e modelo de tradução.

```bash
i18n-rosetta init                          # interactive wizard
i18n-rosetta init --yes                    # skip wizard, use defaults
i18n-rosetta init --yes --langs fr,de,ja   # quick setup with specific languages
i18n-rosetta init --source en --dir ./i18n # overrides with defaults
```

**Opção `--langs`**: Lista de códigos de idiomas de destino separados por vírgula. Ignora o prompt de idioma e aplica as predefinições de registro padrão para cada idioma. Combine com `--yes` para uma configuração totalmente não interativa.

**Predefinições de idioma**: Quando solicitado pelos idiomas de destino, você pode digitar os nomes das predefinições:
- `european` → fr, de, es, it, pt, nl
- `asian` → ja, zh, ko
- `global` → fr, es, de, ja, zh, ko, pt, ar
- `nordic` → da, fi, nb, sv

Misture predefinições e códigos individuais: `european, ja` → fr, de, es, it, pt, nl, ja

---

## sync

Traduz chaves ausentes, desatualizadas e de fallback em todos os arquivos de localidade.

```bash
i18n-rosetta sync                                   # translate everything
i18n-rosetta sync --dry-run                         # preview only
i18n-rosetta sync --force-keys "hero.title"         # force re-translate
i18n-rosetta sync --force-keys "a.title,a.subtitle" # multiple keys
i18n-rosetta sync --force-content                   # re-translate all Markdown/MDX
i18n-rosetta sync --content-dir ./content           # include Hugo Markdown
i18n-rosetta sync --method google-translate          # force Google Translate
i18n-rosetta sync --concurrency 20                  # 20 parallel API calls
i18n-rosetta sync --fallback                         # write [EN] prefixes on failure
i18n-rosetta sync --no-tm                            # skip cache, fresh API calls
```

**Memória de Tradução (Translation Memory)**: Por padrão, o `sync` carrega o `.rosetta/tm.json` e fornece traduções em cache para valores de origem inalterados. Use `--no-tm` para ignorar o cache (útil ao trocar de provedor de tradução ou depurar a qualidade). Consulte [Memória de Tradução](/docs/concepts/translation-memory).

**Detecção de alterações**: O rosetta armazena hashes SHA-256 no `.i18n-rosetta.lock`. Quando os valores de origem mudam, o próximo sync traduz automaticamente essas chaves novamente. Faça o commit do arquivo de lock para que todos os desenvolvedores compartilhem a mesma base.

**Paralelismo**: A tradução de conteúdo (Markdown, MDX, postagens de blog) é executada em um pool de itens de trabalho plano com concorrência configurável. O padrão é de 12 chamadas de API paralelas. Substitua com `--concurrency` ou o campo de configuração `concurrency`. A tradução de chaves JSON é executada sequencialmente por localidade (rápido o suficiente para que o paralelismo não adicione nenhum benefício).

---

## watch

Sincronização automática quando o arquivo de localidade de origem é alterado. É executado até ser interrompido com `Ctrl+C`.

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
- Arquivos com conteúdo voltado para o usuário, mas sem importação de framework i18n
- Chaves mortas (dead keys) — chaves de localidade que nenhum arquivo de origem faz referência
- Pontuação de cobertura — porcentagem de strings que passam pelo i18n

**Exclusões**: Crie o `.rosettaignore` na raiz do seu projeto (padrões glob, como `.gitignore`).

---

## wrap

Envolve automaticamente strings hardcoded detectadas pelo `lint` em chamadas `t()`. Cria backups automáticos antes de modificar os arquivos.

```bash
i18n-rosetta wrap                    # auto-wrap with backup
i18n-rosetta wrap --dry              # preview wrapping changes
i18n-rosetta wrap --undo             # restore from .rosetta-backup/
```

**Garantias de segurança:**
1. Verificação de git-clean (ignorada em dry-run)
2. Backup automático para `.rosetta-backup/`
3. Visualização de diff antes de cada gravação de arquivo
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
| `jsonld` | Schema de idioma JSON-LD WebSite |

---

## integrity

Detecta corrupção e desvios (drift) nos arquivos de localidade traduzidos.

```bash
i18n-rosetta integrity               # exits 1 if issues found
i18n-rosetta integrity --warn-only   # non-blocking
```

**O que ele verifica:**
- Corrupção de placeholders (ex.: `{name}` presente na origem, mas ausente no destino)
- Problemas de codificação (mojibake, Unicode inválido)
- Cópias não traduzidas (valor de destino idêntico à origem)
- Chaves órfãs (chaves no destino que não existem na origem)
- Integridade da categoria de plural do ICU MessageFormat (ex.: o árabe precisa de 6 categorias)

---

## tm

Gerencia o cache da Memória de Tradução (`.rosetta/tm.json`). A TM armazena traduções anteriores e as fornece em sincronizações subsequentes em vez de chamar a API.

```bash
i18n-rosetta tm stats                  # show cache statistics
i18n-rosetta tm clear                  # clear cache (with confirmation)
i18n-rosetta tm clear --yes            # clear without confirmation
i18n-rosetta tm clear --locale fr      # clear only French entries
```

| Subcomando | Saída |
|------------|-------|
| `stats` | Contagem de entradas, tamanho do arquivo, detalhamento por localidade |
| `clear` | Exclui o arquivo de cache (completo ou por localidade) |

| Opção | Efeito |
|-------|--------|
| `--locale <code>` | Limpa apenas as entradas de uma localidade |
| `--yes` | Ignora o prompt de confirmação |

Consulte [Memória de Tradução](/docs/concepts/translation-memory) para saber como a TM funciona e quando limpá-la.

---

## xliff

Exporta e importa arquivos XLIFF 1.2 para revisão por tradutores profissionais. O XLIFF é o formato de troca universal suportado por ferramentas CAT como memoQ, SDL Trados e Phrase.

```bash
i18n-rosetta xliff export --locale fr                   # export French XLIFF
i18n-rosetta xliff export --locale ja --out ./review/   # custom output path
i18n-rosetta xliff import .rosetta/xliff/fr.xliff       # import reviewed file
i18n-rosetta xliff import ./reviewed.xliff --dry        # preview import
```

| Subcomando | Saída |
|------------|-------|
| `export` | Gera `.xliff` a partir dos arquivos de localidade de origem + destino |
| `import` | Mescla as traduções revisadas do `.xliff` nos arquivos de localidade |

| Opção | Efeito |
|-------|--------|
| `--locale <code>` | Localidade de destino para exportação (obrigatório) |
| `--out <path>` | Caminho ou diretório de saída personalizado |
| `--dry` | Visualiza a importação sem gravar |

Consulte [Trabalhando com Tradutores Profissionais](/docs/guides/professional-translators) para ver o fluxo de trabalho completo.

---

## status

Mostra a configuração de pares, plugins instalados, níveis de qualidade e pontuações de benchmark.

```bash
i18n-rosetta status
```

---

## provenance

Audita o licenciamento de recursos de tradução para todos os plugins instalados.

```bash
i18n-rosetta provenance
```

---

## plugin

Gerencia plugins de métodos de tradução. Os plugins são receitas de tradução pré-empacotadas instaladas em `.rosetta/methods/`.

```bash
i18n-rosetta plugin list                      # show installed plugins
i18n-rosetta plugin install ./my-method/      # install from local directory
i18n-rosetta plugin remove crk-coached-v1     # remove a plugin
```

Consulte [Especificação de Plugin](/docs/reference/plugin-spec) para ver o formato do manifesto do plugin.

---

## fonts

Baixa e gerencia web fonts PUA para conversores de scripts de idiomas construídos (conlangs). Idiomas que usam caracteres da Área de Uso Privado (Private Use Area - Klingon, Sindarin, Kryptoniano) precisam de web fonts personalizadas para renderizar seus scripts. Este comando faz o download delas a partir de repositórios open-source verificados.

```bash
i18n-rosetta fonts list                           # show needed fonts
i18n-rosetta fonts install                        # download all needed fonts
i18n-rosetta fonts install --css                  # also generate CSS snippet
i18n-rosetta fonts install --dir ./public/fonts   # custom output directory
```

| Subcomando | Saída |
|------------|-------|
| `list` | Mostra quais fontes PUA são necessárias e seu status de instalação |
| `install` | Baixa as fontes para os idiomas configurados |

| Opção | Efeito |
|-------|--------|
| `--dir <path>` | Substitui o diretório de saída das fontes (detectado automaticamente pelo tipo de projeto) |
| `--css` | Gera um snippet `conlang-fonts.css` junto com as fontes |
| `--config <path>` | Caminho para o arquivo de configuração (usado para detectar quais idiomas precisam de fontes) |

**Detecção automática:** O diretório de saída é inferido a partir da estrutura do seu projeto:
- **Docusaurus** → `static/fonts/` ou `website/static/fonts/`
- **Hugo** → `static/fonts/`
- **Padrão** → `public/fonts/`

**Conversores Unicode nativos** (`crk` → Silabário Cree, `sr` → Cirílico Sérvio) NÃO exigem instalação de fontes.

Consulte [Conlangs, Scripts e Ortografia](/docs/guides/conlangs-scripts-orthography) para obter todos os detalhes sobre fontes PUA.

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
| **Audit** | `audit` | Etapa de build | Falha o deploy se alguma localidade estiver incompleta |

---

## Veja Também

- [Configuração](/docs/getting-started/configuration) — referência do arquivo de configuração
- [Métodos de Tradução](/docs/guides/translation-methods) — seleção de método por par
- [Memória de Tradução](/docs/concepts/translation-memory) — cache e economia de custos
- [Trabalhando com Tradutores Profissionais](/docs/guides/professional-translators) — fluxo de trabalho XLIFF
- [Especificação de Plugin](/docs/reference/plugin-spec) — formato do manifesto do plugin
- [Guia de CI/CD](/docs/guides/ci-cd) — automatização de comandos da CLI no seu pipeline
- [Como o Sync Funciona](/docs/concepts/how-sync-works) — entendendo o pipeline de sincronização
- [Quality Gate](/docs/concepts/quality-gate) — como as traduções são validadas