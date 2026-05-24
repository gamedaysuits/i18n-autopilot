---
slug: v3-2-quality-infrastructure
title: "v3.2.0: Infraestructura de calidad de grado industrial"
authors: [curtisforbes]
tags: [release]
date: 2026-05-14
---
v3.2.0 es la versión de calidad. 702 pruebas, 163 suites de pruebas, tolerancia cero para fallas silenciosas.

<!-- truncate -->

## Qué cambió

### Quality Gate (5 verificaciones)

Ahora, cada traducción pasa por cinco verificaciones de validación deterministas antes de escribirse en el disco:

1. **Vacío/en blanco** — El modelo no devolvió nada
2. **Eco de origen** — El modelo devolvió la entrada en inglés
3. **Bucle de alucinación** — Patrones de trigramas repetidos
4. **Inflación de longitud** — Salida 4 veces o más larga que el origen
5. **Cumplimiento de escritura** — Sistema de escritura incorrecto para la configuración regional

Ninguna traducción se escribe sin pasar las cinco verificaciones. Las traducciones fallidas se registran y se vuelven a intentar.

### Cascada de reintentos

Cuando un lote falla, rosetta vuelve a intentar con lotes progresivamente más pequeños:

```
Full batch (30 keys) → parse error
  └→ Half batch (15 keys) → 2 failures
      └→ Individual keys (1 each) → isolates the problem keys
```

### Reforzamiento de seguridad

- **Protección contra contaminación de prototipos** — Las claves `__proto__`, `constructor` se rechazan en el momento del análisis
- **Protección contra salto de directorio** — Los códigos de configuración regional manipulados no pueden escribir fuera de los directorios configurados
- **Validación de respuesta** — Solo se aceptan de vuelta las claves que se enviaron

### Infraestructura de pruebas

| Suite | Pruebas | Qué cubre |
|-------|-------|---------------|
| Core (8 suites) | 280+ | Config, sync, CLI, watch, audit, pairs, format, init |
| Red team | 89 | Entradas adversarias, ataques de codificación |
| Contract | 120 | Contratos de integración de API |
| Performance | 36 | Optimización de lotes, regresión de rendimiento |
| Coverage | 702 en total | Pipeline completo |

### Caché de prompts

Los mensajes del sistema ahora están separados de los mensajes del usuario, lo que permite aciertos de caché de prompts en proveedores como Anthropic y Google. Esto reduce significativamente los costos de tokens para sincronizaciones de múltiples lotes.

Consulte la [documentación de Quality Gate](/docs/concepts/quality-gate) y la [documentación de seguridad](/docs/concepts/security) para conocer todos los detalles técnicos.