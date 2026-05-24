---
sidebar_position: 4
title: "Segurança"
---
# Segurança e Proteção

O Rosetta foi projetado para ser seguro em ambientes hostis — onde os dados de locale podem vir de fontes não confiáveis, onde nomes de arquivos manipulados podem escapar dos limites do diretório e onde a saída do LLM pode conter qualquer coisa.

## Modelo de Ameaças

| Ameaça | Vetor de Ataque | Mitigação |
|--------|--------------|-----------|
| **Prototype pollution** | Chaves JSON manipuladas (`__proto__`, `constructor`) | Rejeitado no momento do parse |
| **Path traversal** | Códigos de locale como `../../etc/passwd` | Gravações de arquivos validadas para os diretórios configurados |
| **Corrupção de blocos de código** | LLM traduz dentro dos code fences | Proteção por sentinela Unicode |
| **Chaves alucinadas** | LLM retorna chaves que não foram enviadas | Validação de resposta — apenas chaves aceitas são gravadas |
| **Gasto descontrolado de tokens** | Loops infinitos de repetição (retry) | Orçamento limitado via `maxRetries` |

## Proteção contra Prototype Pollution

Todas as chaves de locale são validadas contra uma blocklist antes do processamento:

- `__proto__`
- `constructor`
- `prototype`

Qualquer chave que corresponda a esses padrões é rejeitada com um erro. Isso impede que invasores usem arquivos de locale manipulados para modificar os protótipos de objetos JavaScript.

## Contenção de Caminho

Ao gravar arquivos de locale, o rosetta valida se o caminho de saída permanece dentro dos diretórios configurados (`localesDir`, `contentDir`). Os códigos de locale são sanitizados — um código como `../../secrets` não pode gravar fora do diretório esperado.

## Proteção de Blocos

Durante a tradução de conteúdo Markdown, os elementos estruturados são substituídos por placeholders de sentinela Unicode antes que o texto seja enviado ao LLM:

1. **Blocos de código** (fenced e inline) → sentinela
2. **Shortcodes do Hugo** (`{{< >}}`, `{{% %}}`) → sentinela  
3. **HTML bruto** → sentinela
4. **Variáveis de interpolação** (`{{ .Count }}`) → sentinela

Após a tradução, as sentinelas são substituídas pelo conteúdo original. O LLM nunca vê os blocos de código, shortcodes ou HTML — ele não pode corrompê-los.

## Validação de Resposta

Quando o LLM retorna uma resposta JSON, o rosetta valida se:
- Apenas as chaves que foram enviadas no lote (batch) aparecem na resposta
- Nenhuma chave extra foi injetada
- A resposta é processada (parsed) como um JSON válido

Chaves alucinadas são descartadas silenciosamente. Isso impede que a saída do LLM injete traduções inesperadas em seus arquivos de locale.

## Quality Gate

Cada tradução é validada por meio de cinco verificações determinísticas antes de ser gravada no disco. Consulte [Quality Gate](/docs/concepts/quality-gate) para obter detalhes.

## Backoff Exponencial

As chamadas de API usam backoff exponencial com jitter em respostas 429 (rate limit) e 5xx (erro de servidor). Três tentativas (retries) com atraso crescente evitam sobrecarregar a API durante interrupções.

## Timeout de Requisição

Toda requisição de API tem um timeout de 30 segundos via `AbortController`. Isso impede que o processo de sincronização (sync) trave indefinidamente em uma conexão inativa.

## Modo de Fallback

Quando a API está indisponível, o `--fallback` grava placeholders com o prefixo `[EN]` em vez de traduções reais:

```bash
npx i18n-rosetta sync --fallback
```

```json
{
  "hero.title": "[EN] Welcome to our platform"
}
```

Esses placeholders são detectados automaticamente e retraduzidos na próxima sincronização com uma chave de API válida. Eles nunca são tratados como "traduzidos" — o `audit` os sinalizará.

## Testes

As propriedades de segurança são verificadas pela suíte de testes adversariais:

```bash
npm run test:redteam    # prototype pollution, path traversal, encoding attacks
```

---

## Veja Também

- [Arquitetura](/docs/concepts/architecture) — como o ecossistema de três partes se conecta
- [Referência da CLI — integrity](/docs/reference/cli#integrity) — comando de verificação de integridade
- [Referência da CLI — provenance](/docs/reference/cli#provenance) — comando de auditoria de proveniência
- [Especificação de Plugin](/docs/reference/plugin-spec) — campos de proveniência em manifestos de plugins
- [Quality Gate](/docs/concepts/quality-gate) — verificações de segurança em nível de tradução