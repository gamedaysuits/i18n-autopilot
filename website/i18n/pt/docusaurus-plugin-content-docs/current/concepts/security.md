---
sidebar_position: 4
title: "Segurança"
---
# Segurança e Proteção

O Rosetta foi projetado para ser seguro em ambientes adversários — onde os dados de localidade (locale) podem vir de fontes não confiáveis, onde nomes de arquivos manipulados podem escapar dos limites do diretório e onde a saída do LLM pode conter qualquer coisa.

## Modelo de Ameaças

| Ameaça | Vetor de Ataque | Mitigação |
|--------|--------------|-----------|
| **Prototype pollution** | Chaves JSON manipuladas (`__proto__`, `constructor`) | Rejeitadas no momento do parse |
| **Path traversal** | Códigos de localidade como `../../etc/passwd` | Gravações de arquivos validadas para os diretórios configurados |
| **Corrupção de blocos de código** | LLM traduz dentro dos blocos de código | Proteção por sentinelas Unicode |
| **Chaves alucinadas** | LLM retorna chaves que não foram enviadas | Validação de resposta — apenas chaves aceitas são gravadas |
| **Gasto descontrolado de tokens** | Loops infinitos de repetição | Orçamento limitado via `maxRetries` |

## Proteção contra Prototype Pollution

Todas as chaves de localidade são validadas contra uma lista de bloqueio (blocklist) antes do processamento:

- `__proto__`
- `constructor`
- `prototype`

Qualquer chave que corresponda a esses padrões é rejeitada com um erro. Isso impede que invasores usem arquivos de localidade manipulados para modificar os protótipos de objetos JavaScript.

## Contenção de Caminhos

Ao gravar arquivos de localidade, o rosetta valida se o caminho de saída permanece dentro dos diretórios configurados (`localesDir`, `contentDir`). Os códigos de localidade são sanitizados — um código como `../../secrets` não pode gravar fora do diretório esperado.

## Proteção de Blocos

Durante a tradução de conteúdo Markdown, elementos estruturados são substituídos por marcadores sentinelas Unicode antes que o texto seja enviado ao LLM:

1. **Blocos de código** (delimitados e inline) → sentinela
2. **Shortcodes do Hugo** (`{{< >}}`, `{{% %}}`) → sentinela  
3. **HTML bruto** → sentinela
4. **Variáveis de interpolação** (`{{ .Count }}`) → sentinela

Após a tradução, as sentinelas são substituídas pelo conteúdo original. O LLM nunca vê blocos de código, shortcodes ou HTML — portanto, não pode corrompê-los.

## Validação de Resposta

Quando o LLM retorna uma resposta JSON, o rosetta valida se:
- Apenas as chaves que foram enviadas no lote aparecem na resposta
- Nenhuma chave extra foi injetada
- A resposta é analisada (parsed) como um JSON válido

Chaves alucinadas são descartadas silenciosamente. Isso impede que a saída do LLM injete traduções inesperadas nos seus arquivos de localidade.

## Quality Gate

Cada tradução é validada por meio de cinco verificações determinísticas antes de ser gravada no disco. Consulte [Quality Gate](/docs/concepts/quality-gate) para obter detalhes.

## Exponential Backoff

As chamadas de API usam exponential backoff com jitter em respostas 429 (limite de taxa) e 5xx (erro de servidor). Três tentativas com atraso crescente evitam sobrecarregar a API durante interrupções.

## Timeout de Requisição

Toda requisição de API tem um timeout de 30 segundos via `AbortController`. Isso impede que o processo de sincronização trave indefinidamente em uma conexão inativa.

## Falhas de Tradução Explícitas (Fail-Loud)

Quando a API está indisponível ou uma tradução falha, o rosetta lança um erro explícito com orientações acionáveis em vez de gravar lixo silenciosamente. Nenhum marcador com o prefixo `[EN]` é gravado durante a sincronização.

```
[ERR] Content sync for fr: no API key available.
  Set OPENROUTER_API_KEY in .env.local to translate content.
```

A falha de um arquivo não interrompe toda a sincronização — o erro é registrado e o pipeline continua para o próximo arquivo, para que você obtenha o máximo de progresso por execução.

## Verificação Pós-Sincronização

Após a conclusão de todas as traduções, o rosetta relê os arquivos de localidade gravados no disco e executa uma etapa de verificação. Isso captura a lacuna entre a sincronização relatar sucesso e as traduções estarem de fato incorretas:

- **Paridade de chaves** — todas as chaves de origem estão presentes em cada destino
- **Marcadores `[EN]`** — marcadores de fallback legados de execuções anteriores
- **Traduções vazias** — valores em branco que passaram despercebidos
- **Conformidade de script** — localidades não latinas com traduções apenas em ASCII
- **Preservação de marcadores** — marcadores ICU correspondem à origem

Ignore com `--no-verify` ou execute de forma independente com `npx i18n-rosetta verify`.

## Testes

As propriedades de segurança são verificadas pela suíte de testes adversários:

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