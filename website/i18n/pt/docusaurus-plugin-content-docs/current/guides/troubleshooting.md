---
sidebar_position: 6
title: "Solução de problemas"
---
# Solução de problemas

Problemas comuns e soluções para o i18n-rosetta.

## API e Autenticação

### "OPENROUTER_API_KEY not found"

O Rosetta requer uma chave de API para tradução via LLM. Defina-a como uma variável de ambiente:

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
```

Ou em um arquivo `.env` (se o seu projeto carregar arquivos `.env`):

```
OPENROUTER_API_KEY=sk-or-v1-...
```

:::tip
Se você tiver apenas uma chave de API do Google Translate, o rosetta detecta automaticamente e usa o Google Translate como método padrão. Nenhuma alteração de configuração é necessária.
:::

### "401 Unauthorized" do OpenRouter

Sua chave de API é inválida ou expirou. Verifique-a em [openrouter.ai/keys](https://openrouter.ai/keys).

### "429 Too Many Requests" / Limite de Taxa (Rate Limiting)

O Rosetta lida com limites de taxa internamente usando recuo exponencial (exponential backoff). Se você atingir limites de taxa consistentemente:

1. **Reduza o tamanho do lote (batch size)** na sua configuração:
   ```json
   { "batchSize": 15 }
   ```
2. **Use um modelo com limites de taxa maiores** (por exemplo, `google/gemini-3.5-flash` tem limites generosos)
3. **Use um método mais barato/rápido** para pares de alto volume — o Google Translate não tem limites de taxa:
   ```json
   { "pairs": { "en:it": { "method": "google-translate" } } }
   ```

### Modelo não encontrado / Erros 404

Provedores diretos de LLM (`openai`, `anthropic`, `gemini`) validam a string do seu modelo no primeiro uso. Se você vir um aviso:

**"looks like an OpenRouter path"** — Você está usando um modelo no formato do OpenRouter (`google/gemini-3.5-flash`) com um provedor direto. Provedores diretos usam apenas os nomes dos modelos:

```diff
- { "method": "gemini", "model": "google/gemini-3.5-flash" }
+ { "method": "gemini", "model": "gemini-2.5-flash" }
```

Ou mude para o método `llm` para usar o OpenRouter:
```json
{ "method": "llm", "model": "google/gemini-3.5-flash" }
```

**"is an Anthropic/OpenAI/Gemini model"** — Você está enviando um modelo para o provedor errado:

```diff
- { "method": "gemini", "model": "claude-sonnet-4-6" }
+ { "method": "anthropic", "model": "claude-sonnet-4-6" }
```

**"not found in available models"** — O modelo pode ter sido descontinuado ou digitado incorretamente. O Rosetta busca a lista de modelos ativos do provedor e sugere alternativas. Verifique a documentação do provedor para os nomes de modelos atuais.

:::tip A descontinuação de modelos acontece
Os provedores retiram nomes de modelos regularmente. Se as traduções falharem repentinamente após uma atualização do provedor, verifique a saída do `[WARN]` — ela mostrará as alternativas atuais.
:::

## Qualidade da Tradução

### Traduções ecoam o idioma de origem

O quality gate detecta isso. Se uma tradução for idêntica à origem em inglês, ela será rejeitada e tentada novamente. Se o problema persistir:

1. **Verifique o modelo** — Alguns modelos têm desempenho ruim para pares de idiomas específicos
2. **Adicione instruções de registro** — Diga ao modelo qual idioma produzir:
   ```json
   {
     "languages": {
       "ja": { "name": "Japanese", "register": "Polite/formal Japanese" }
     }
   }
   ```
3. **Tente um modelo diferente** — Mude de `gpt-4o-mini` para `gpt-4o` ou `google/gemini-2.5-pro`

### Saída de script incorreta (ex: texto latino para japonês)

A verificação de conformidade de script do quality gate detecta a maioria dos casos. Se o problema persistir:

- Verifique se o código de localidade (locale) está correto (`ja`, não `jp`)
- Adicione instruções explícitas de script no campo `register`:
  ```json
  { "register": "Japanese using hiragana, katakana, and kanji" }
  ```

### Padrões de alucinação na saída

Padrões de trigramas repetidos (ex: "hello hello hello") são detectados pelo detector de loop de alucinação. Se a saída estiver distorcida, mas passar pelo detector:

1. **Reduza o tamanho do lote (batch size)** — Lotes menores produzem saídas mais focadas
2. **Use um modelo mais forte** — Modelos maiores alucinam menos em scripts não latinos
3. **Adicione dados de treinamento (coaching data)** — Termos de dicionário ancoram a tradução

## Problemas de Arquivo e Formato

### "No locale files found"

O Rosetta detecta automaticamente os arquivos de localidade. Se não conseguir encontrá-los:

1. **Verifique `localesDir`** — Deve apontar para o diretório que contém os arquivos de localidade:
   ```json
   { "localesDir": "./locales" }
   ```
2. **Verifique a nomenclatura dos arquivos** — Os arquivos devem ser nomeados pelo código de localidade: `en.json`, `fr.json`, etc.
3. **Verifique o formato** — Formatos suportados: JSON, JSON aninhado, YAML, TOML

### Conflitos no arquivo de lock

Se o `.i18n-rosetta.lock` entrar em um estado ruim:

```bash
# Reset the lock file (next sync will retranslate everything)
rm .i18n-rosetta.lock
npx i18n-rosetta sync
```

:::warning
Excluir o arquivo de lock significa que a próxima sincronização retraduzirá todas as chaves, não apenas as alteradas. Isso tem implicações de custo de API para projetos grandes.
:::

### Retraduzindo chaves específicas

Se traduções individuais estiverem erradas e você quiser forçá-las a serem retraduzidas sem excluir o arquivo de lock:

```bash
# Re-translate a single key
npx i18n-rosetta sync --force-keys "hero.title"

# Re-translate multiple keys
npx i18n-rosetta sync --force-keys "nav.home,nav.about,footer.copyright"
```

A flag `--force-keys` substitui a verificação de hash do arquivo de lock para essas chaves específicas, forçando a retradução sem afetar nenhuma outra chave.

### A tradução de conteúdo corrompe os blocos de código

Isso não deveria acontecer — os blocos de código são protegidos antes da tradução. Se acontecer:

1. Verifique se o bloco de código usa a marcação padrão (três crases)
2. Verifique se há blocos de código não fechados no Markdown de origem
3. Abra uma issue — isso é um bug no sistema de proteção sentinela

## Problemas na CLI

### `--watch` não detecta alterações

A observação de arquivos (file watching) usa o `fs.watch` nativo do Node.js. Problemas conhecidos:

- **Unidades de rede** — O `fs.watch` não funciona de forma confiável em montagens NFS/SMB
- **Volumes Docker** — Use o modo de sondagem (polling) ou execute o rosetta dentro do contêiner
- **Diretórios grandes** — O observador monitora `localesDir` recursivamente; árvores muito profundas podem exceder os limites do sistema operacional

### `npx` executa uma versão antiga

```bash
# Clear the npx cache
npx --yes i18n-rosetta@latest sync
```

Ou instale globalmente:

```bash
npm install -g i18n-rosetta
i18n-rosetta sync
```

## Desempenho

### A sincronização é lenta para muitos idiomas

O Rosetta traduz todas as localidades em paralelo por padrão. Se a sincronização ainda estiver lenta:

1. **Use o Google Translate para pares de alto volume** — É de 10 a 50 vezes mais rápido que a tradução via LLM
2. **Aumente o tamanho do lote** (o padrão é 80):
   ```json
   { "batchSize": 120 }
   ```
3. **Ajuste a concorrência** — O paralelismo de localidade JSON tem o padrão de 200 e o de conteúdo 48. Se o seu provedor de API suportar limites de taxa mais altos:
   ```bash
   npx i18n-rosetta sync --json-concurrency 80 --content-concurrency 20
   ```
4. **Use um modelo rápido** — `gpt-4o-mini` é significativamente mais rápido que `gpt-4o`

### Altos custos de API

- **Verifique os tamanhos dos lotes** — Lotes maiores = menos chamadas de API = menor custo
- **Use a Memória de Tradução (Translation Memory)** — A TM está ativada por padrão. Execute `i18n-rosetta tm stats` para verificar se está funcionando. Se você vir 0 entradas após várias sincronizações, pode haver algo errado com as permissões do seu diretório `.rosetta/`
- **Use o cache de prompt** — O Rosetta divide as mensagens de sistema/usuário para acertos de cache (cache hits) nos modelos da Anthropic e do Google
- **Use o Google Translate para idiomas Tier 2** — Veja o guia [Translate 30 Languages](/docs/tutorials/translate-30-languages)

### Traduções desatualizadas após trocar de provedor

Se você mudar de um método de tradução para outro (por exemplo, de `llm` para `deepl`), o cache da TM ainda pode fornecer traduções antigas do método anterior para chaves cujo texto de origem não foi alterado. A chave de cache inclui o nome do método, então a maioria dos casos é tratada automaticamente. Mas se você alterou `model` dentro do mesmo método:

```bash
# Force fresh translations for all keys
i18n-rosetta sync --no-tm

# Or clear the cache entirely and re-sync
i18n-rosetta tm clear --yes
i18n-rosetta sync
```

Consulte [Translation Memory](/docs/concepts/translation-memory) para obter detalhes sobre o design da chave de cache.

## Ainda com problemas?

- **[GitHub Issues](https://github.com/gamedaysuits/i18n-rosetta/issues)** — Pesquise issues existentes ou abra uma nova
- **[Architecture Docs](/docs/concepts/architecture)** — Entenda o design do sistema
- **[Quality Gate](/docs/concepts/quality-gate)** — Como a validação funciona nos bastidores