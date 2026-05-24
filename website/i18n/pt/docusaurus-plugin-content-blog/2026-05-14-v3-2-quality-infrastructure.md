---
slug: v3-2-quality-infrastructure
title: "v3.2.0: Infraestrutura de Qualidade de Nível Industrial"
authors: [curtisforbes]
tags: [release]
date: 2026-05-14
---
A v3.2.0 é a release de qualidade. 702 testes, 163 suítes de testes, tolerância zero para falhas silenciosas.

<!-- truncate -->

## O que mudou

### Quality Gate (5 verificações)

Toda tradução agora passa por cinco verificações de validação determinísticas antes de ser gravada em disco:

1. **Vazio/em branco** — O modelo não retornou nada
2. **Eco da origem** — O modelo retornou a entrada em inglês
3. **Loop de alucinação** — Padrões de trigramas repetidos
4. **Inflação de tamanho** — Saída 4x+ mais longa que a origem
5. **Conformidade de script** — Script incorreto para a localidade

Nenhuma tradução é gravada sem passar por todas as cinco verificações. As traduções que falham são registradas em log e tentadas novamente.

### Cascata de retries

Quando um lote falha, o rosetta tenta novamente com lotes progressivamente menores:

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the problem keys
```

### Fortalecimento de segurança

- **Proteção contra prototype pollution** — Chaves `__proto__`, `constructor` rejeitadas em tempo de parse
- **Proteção contra path traversal** — Códigos de localidade manipulados não conseguem gravar fora dos diretórios configurados
- **Validação de resposta** — Apenas as chaves que foram enviadas são aceitas de volta

### Infraestrutura de testes

| Suíte | Testes | O que cobre |
|-------|-------|---------------|
| Core (8 suítes) | 280+ | Config, sync, CLI, watch, audit, pairs, format, init |
| Red team | 89 | Entradas adversariais, ataques de codificação |
| Contrato | 120 | Contratos de integração de API |
| Performance | 36 | Otimização de lote, regressão de throughput |
| Cobertura | 702 no total | Pipeline completo |

### Cache de prompt

As mensagens do sistema agora são separadas das mensagens do usuário, permitindo hits de cache de prompt em provedores como Anthropic e Google. Isso reduz significativamente os custos de tokens para sincronizações de múltiplos lotes.

Consulte a [documentação do Quality Gate](/docs/concepts/quality-gate) e a [documentação de Segurança](/docs/concepts/security) para ver todos os detalhes técnicos.