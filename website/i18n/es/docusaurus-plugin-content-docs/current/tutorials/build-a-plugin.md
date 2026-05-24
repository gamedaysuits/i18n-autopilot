---
sidebar_position: 1
title: "Crear un plugin de traducción"
description: "Tutorial de principio a fin: desarrollar datos de entrenamiento, medir el rendimiento con el eval harness, exportar un plugin y desplegarlo con rosetta."
---
# Tutorial: Construir un plugin de traducción

Construya un método de traducción personalizado desde cero, evalúe su rendimiento e impleméntelo como un plugin de rosetta. Este es el flujo de trabajo completo para agregar un nuevo par de idiomas que ninguna API estándar admite.

**Qué construirá:** Un plugin de traducción guiada para francés formal con terminología obligatoria, reglas gramaticales y puntuaciones de benchmark.

**Tiempo:** 30–45 minutos

**Requisitos previos:**
- i18n-rosetta instalado (`npm install --save-dev i18n-rosetta`)
- Una clave de API de OpenRouter (`OPENROUTER_API_KEY`)
- Python 3.10+ (para el eval harness)

---

## Paso 1: Identificar el problema

Usted está traduciendo un dashboard de SaaS al francés. El método predeterminado `llm` produce traducciones correctas pero inconsistentes:

- A veces "dashboard" se convierte en "tableau de bord", otras veces en "panneau de contrôle"
- El tono alterna entre las formas `tu` y `vous`
- Los términos técnicos se anglican de manera inconsistente

Usted necesita **aplicación estricta de terminología** y **control de registro** que el prompt genérico del LLM no proporciona.

## Paso 2: Crear datos de guía

Cree un archivo de guía que codifique sus requisitos lingüísticos:

```bash
mkdir -p .rosetta/coaching
```

```json title=".rosetta/coaching/fr.json"
{
  "grammar_rules": [
    "Always use the 'vous' form for formal register",
    "French adjectives agree in gender and number with their noun",
    "Use the present tense for UI instructions, not the imperative",
    "Preserve sentence-final punctuation style from the source"
  ],
  "dictionary": {
    "dashboard": "tableau de bord",
    "deployment": "déploiement",
    "settings": "paramètres",
    "environment variable": "variable d'environnement",
    "webhook": "webhook",
    "API key": "clé API",
    "sign in": "se connecter",
    "sign out": "se déconnecter",
    "repository": "dépôt",
    "pull request": "demande de tirage"
  },
  "style_notes": "Formal technical French. Prefer native French terms over anglicisms where established equivalents exist. Keep UI labels concise — 3 words maximum where possible."
}
```

**Qué hace cada campo:**
- **`grammar_rules`** — Se inyecta en el system prompt del LLM como restricciones explícitas
- **`dictionary`** — Se compara con las claves de origen; cuando aparece un término del diccionario, se inyecta como "terminología requerida" en el prompt
- **`style_notes`** — Se adjunta al system prompt como guía de estilo general

## Paso 3: Configurar el par

Indíquele a rosetta que use `llm-coached` para el francés:

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "pairs": {
    "en:fr": {
      "method": "llm-coached",
      "model": "google/gemini-3.5-flash"
    }
  },
  "languages": {
    "fr": {
      "register": "Formal technical French (vous-form)",
      "name": "French"
    }
  }
}
```

## Paso 4: Probarlo

```bash
npx i18n-rosetta sync --dry
```

Revise la salida de la ejecución de prueba (dry-run). Verifique que:
- ✅ Los términos del diccionario se usen de manera consistente ("tableau de bord", no "panneau de contrôle")
- ✅ La forma `vous` se use en todo momento
- ✅ Los términos técnicos coincidan con su diccionario

Luego, ejecute la sincronización real:

```bash
npx i18n-rosetta sync
```

## Paso 5: Medir el rendimiento con el Eval Harness (Opcional)

Si desea puntuaciones de calidad (y las deseará, porque los plugins incluyen datos de benchmark), use el eval harness complementario.

### Instalar el Harness

```bash
git clone https://github.com/gamedaysuits/gds-mt-eval-harness.git
cd gds-mt-eval-harness
pip install -r requirements.txt
```

### Crear un corpus de referencia

Cree un archivo con cadenas de origen y traducciones correctas comprobadas:

```json title="corpus/french-formal.json"
[
  {
    "source": "Dashboard",
    "reference": "Tableau de bord"
  },
  {
    "source": "Sign in to your account",
    "reference": "Connectez-vous à votre compte"
  },
  {
    "source": "Your deployment is ready",
    "reference": "Votre déploiement est prêt"
  },
  {
    "source": "Environment variables",
    "reference": "Variables d'environnement"
  }
]
```

### Ejecutar el Benchmark

```bash
python harness.py eval \
  --corpus corpus/french-formal.json \
  --source en \
  --target fr \
  --method llm-coached \
  --model google/gemini-3.5-flash
```

El harness genera los siguientes resultados:
- **chrF++** — Puntuación F a nivel de caracteres (0–100). Por encima de 70 es un resultado sólido.
- **BLEU** — Superposición de N-gramas (0–100). Por encima de 40 es sólido para una traducción guiada.
- **Tasa de coincidencia exacta** — Proporción de traducciones que coinciden exactamente con la referencia.

### Exportar el plugin

Una vez que esté satisfecho con las puntuaciones:

```bash
python harness.py export \
  --name french-formal-v1 \
  --output ./french-formal-v1/
```

Esto crea:

```
french-formal-v1/
├── method.json          # Manifest with config + benchmarks
└── coaching/
    └── fr.json          # Your coaching data
```

## Paso 6: Instalar el plugin en Rosetta

```bash
npx i18n-rosetta plugin install ./french-formal-v1/
```

Esto copia el plugin a `.rosetta/methods/french-formal-v1/`.

Actualice su configuración para usarlo:

```json title="i18n-rosetta.config.json"
{
  "pairs": {
    "en:fr": {
      "methodPlugin": "french-formal-v1"
    }
  }
}
```

## Paso 7: Verificar

```bash
# Check plugin is installed and shows benchmark scores
npx i18n-rosetta status

# Run a sync with the plugin
npx i18n-rosetta sync

# Audit licensing status
npx i18n-rosetta provenance
```

La salida de `status` mostrará:

```
en → fr
  Method:    french-formal-v1 (llm-coached)
  Model:     google/gemini-3.5-flash
  Quality:   high
  chrF++:    74.2
  BLEU:      46.8
  Exact:     42%
```

## Qué ha construido

```mermaid
flowchart LR
    A["Coaching data\n(grammar + dictionary)"] --> B["Eval harness\n(benchmark)"]
    B --> C["method.json\n(export)"]
    C --> D["rosetta plugin install"]
    D --> E["rosetta sync\n(production)"]
```

Ahora usted tiene:
1. **Datos de guía** — Reglas gramaticales y terminología que garantizan la consistencia
2. **Puntuaciones de benchmark** — Calidad cuantificada que se incluye con el plugin
3. **Un plugin portátil** — `method.json` + datos de guía, instalable en cualquier máquina
4. **Implementación en producción** — Integrado en su pipeline de sincronización

## Próximos pasos

- **[Especificación del plugin](/docs/reference/plugin-spec)** — Referencia completa del formato del manifiesto
- **[Métodos de traducción](/docs/guides/translation-methods)** — Compare los cuatro métodos
- **[Idiomas de bajos recursos](/docs/guides/low-resource-languages)** — Aplique este patrón a idiomas sin cobertura de API
- **[Traducir 30 idiomas](/docs/tutorials/translate-30-languages)** — Escale su proyecto a una audiencia global