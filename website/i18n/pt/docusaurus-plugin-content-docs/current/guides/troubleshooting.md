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

### "429 Too Many Requests" / Limitação de Taxa

O Rosetta lida com os limites de taxa internamente com recuo exponencial (exponential backoff). Se você atingir os limites de taxa consistentemente:

1. **Reduza o tamanho do lote** na sua configuração:
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

**"not found in available models"** — O modelo pode ter sido descontinuado ou digitado incorretamente. O Rosetta busca a lista de modelos ativos do provedor e sugere alternativas. Verifique a documentação do provedor para ver os nomes de modelos atuais.

:::tip A descontinuação de modelos acontece
Os provedores retiram nomes de modelos regularmente. Se as traduções falharem repentinamente após uma atualização do provedor, verifique a saída do `[WARN]` — ela mostrará as alternativas atuais.
:::

## Qualidade da Tradução

### Traduções repetem o idioma de origem

O quality gate detecta isso. Se uma tradução for idêntica à origem em inglês, ela será rejeitada e tentada novamente. Se o problema persistir:

1. **Verifique o modelo** — Alguns modelos têm um desempenho ruim para pares de idiomas específicos
2. **Adicione instruções de registro** — Diga ao modelo qual idioma produzir:
   ```json
   {
     "languages": {
       "ja": { "name": "Japanese", "register": "Polite/formal Japanese" }
     }
   }
   ```
3. **Tente um modelo diferente** — Mude do `gpt-4o-mini` para o `gpt-4o` ou `google/gemini-2.5-pro`

### Saída de script incorreta (ex: texto latino para japonês)

A verificação de conformidade de script do quality gate detecta a maioria dos casos. Se o problema persistir:

- Verifique se o código de localidade está correto (`ja`, e não `jp`)
- Adicione instruções explícitas de script no campo `register`:
  ```json
  { "register": "Japanese using hiragana, katakana, and kanji" }
  ```

### Padrões de alucinação na saída

Padrões de trigramas repetidos (ex: "olá olá olá") são detectados pelo detector de loop de alucinação. Se a saída estiver confusa, mas passar pelo detector:

1. **Reduza o tamanho do lote** — Lotes menores produzem saídas mais focadas
2. **Use um modelo mais forte** — Modelos maiores alucinam menos em scripts não latinos
3. **Adicione dados de orientação (coaching data)** — Termos de dicionário ancoram a tradução

## Problemas de Arquivo e Formato

### "No locale files found"

O Rosetta detecta automaticamente os arquivos de localidade. Se não conseguir encontrá-los:

1. **Verifique `localesDir`** — Deve apontar para o diretório que contém os arquivos de localidade:
   ```json
   { "localesDir": "./locales" }
   ```
2. **Verifique a nomenclatura dos arquivos** — Os arquivos devem ser nomeados pelo código de localidade: `en.json`, `fr.json`, etc.
3. **Verifique o formato** — Formatos suportados: JSON, JSON aninhado, YAML, TOML

### Conflitos no arquivo de bloqueio (lock file)

Se o `.i18n-rosetta.lock` entrar em um estado ruim:

```bash
# Reset the lock file (next sync will retranslate everything)
rm .i18n-rosetta.lock
npx i18n-rosetta sync
```

:::warning
Excluir o arquivo de bloqueio significa que a próxima sincronização retraduzirá todas as chaves, não apenas as alteradas. Isso tem implicações de custo de API para projetos grandes.
:::

### Retraduzindo chaves específicas

Se traduções individuais estiverem erradas e você quiser forçar a retradução delas sem excluir o arquivo de bloqueio:

```bash
# Re-translate a single key
npx i18n-rosetta sync --force-keys "hero.title"

# Re-translate multiple keys
npx i18n-rosetta sync --force-keys "nav.home,nav.about,footer.copyright"
```

A flag `--force-keys` substitui a verificação de hash do arquivo de bloqueio para essas chaves específicas, forçando a retradução sem afetar nenhuma outra chave.

### A tradução de conteúdo corrompe blocos de código

Isso não deveria acontecer — os blocos de código são protegidos antes da tradução. Se isso ocorrer:

1. Verifique se o bloco de código usa a formatação padrão (três crases)
2. Verifique se há blocos de código não fechados no Markdown de origem
3. Abra uma issue — este é um bug no sistema de proteção de sentinela (sentinel shielding)

## Problemas na CLI

### `--watch` não detecta alterações

A observação de arquivos usa o `fs.watch` nativo do Node.js. Problemas conhecidos:

- **Unidades de rede** — O `fs.watch` não funciona de forma confiável em montagens NFS/SMB
- **Volumes Docker** — Use o modo de polling ou execute o rosetta dentro do contêiner
- **Diretórios grandes** — O observador monitora o `localesDir` recursivamente; árvores muito profundas podem exceder os limites do sistema operacional

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

O Rosetta traduz os pares sequencialmente por padrão. Para acelerar as sincronizações em vários idiomas:

1. **Use o Google Translate para pares de alto volume** — É de 10 a 50 vezes mais rápido que a tradução via LLM
2. **Aumente o tamanho do lote** (até 50, o padrão é 30):
   ```json
   { "batchSize": 50 }
   ```
3. **Use um modelo rápido** — O `gpt-4o-mini` é significativamente mais rápido que o `gpt-4o`

### Altos custos de API

- **Verifique os tamanhos dos lotes** — Lotes maiores = menos chamadas de API = menor custo
- **Use o cache de prompts** — O Rosetta divide as mensagens do sistema/usuário para acertos de cache (cache hits) nos modelos da Anthropic e do Google
- **Use o Google Translate para idiomas Tier 2** — Consulte o guia [Traduzir 30 Idiomas](/docs/tutorials/translate-30-languages)

## Ainda com problemas?

- **[GitHub Issues](https://github.com/gamedaysuits/i18n-rosetta/issues)** — Pesquise problemas existentes ou abra um novo
- **[Documentação de Arquitetura](/docs/concepts/architecture)** — Entenda o design do sistema
- **[Quality Gate](/docs/concepts/quality-gate)** — Como a validação funciona nos bastidores