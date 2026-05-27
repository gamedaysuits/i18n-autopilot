---
sidebar_position: 2
title: "Démarrage rapide"
---
# Démarrage rapide

Traduisez votre premier fichier de localisation en 60 secondes.

## 1. Configurez vos fichiers de localisation

Créez un fichier de localisation source. Rosetta prend en charge JSON, TOML et YAML :

```json title="locales/en.json"
{
  "hero": {
    "title": "Welcome to our platform",
    "subtitle": "Build something amazing"
  },
  "nav": {
    "home": "Home",
    "about": "About",
    "contact": "Contact"
  }
}
```

## 2. Définissez votre clé API

Choisissez un fournisseur et définissez la clé :

```bash
# Option A: OpenRouter (200+ models, recommended)
export OPENROUTER_API_KEY=sk-or-v1-...

# Option B: Gemini (free tier — zero cost to start)
export GEMINI_API_KEY=AI...
```

Obtenez une clé Gemini gratuite sur [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Obtenez une clé OpenRouter sur [openrouter.ai](https://openrouter.ai).

## 3. Exécutez la synchronisation

```bash
npx i18n-rosetta sync
```

:::tip Vous utilisez Gemini ?
Si vous avez choisi l'Option B (Gemini), ajoutez `--method gemini` :
```bash
npx i18n-rosetta sync --method gemini
```
:::

Rosetta va :
1. Détecter automatiquement `locales/en.json` comme source
2. Trouver (ou demander) les langues cibles
3. Traduire toutes les clés
4. Écrire `locales/fr.json`, `locales/ja.json`, etc.
5. Créer `.i18n-rosetta.lock` pour suivre ce qui a été traduit

## 4. Vérifiez les résultats

```bash
cat locales/fr.json
```

```json
{
  "hero": {
    "title": "Bienvenue sur notre plateforme",
    "subtitle": "Construisez quelque chose d'incroyable"
  },
  "nav": {
    "home": "Accueil",
    "about": "À propos",
    "contact": "Contact"
  }
}
```

## Que se passe-t-il ensuite ?

Lorsque vous modifiez une chaîne source, rosetta détecte le changement via le suivi de hachage SHA-256 et ne retraduit que cette clé lors de la prochaine synchronisation :

```json title="locales/en.json (updated)"
{
  "hero": {
    "title": "Welcome to Acme Platform",  // ← changed
    "subtitle": "Build something amazing"  // ← unchanged, skipped
  }
}
```

```bash
npx i18n-rosetta sync
# Only "hero.title" is re-translated across all locales
```

La clé inchangée (`hero.subtitle`) est fournie par le cache de la **Mémoire de traduction** de rosetta — aucun appel API, aucun coût. Le cache est généré automatiquement lors de chaque synchronisation et stocké dans `.rosetta/tm.json`.

## Facultatif : Créez un fichier de configuration

Pour plus de contrôle, générez un fichier de configuration :

```bash
npx i18n-rosetta init                         # guided wizard
npx i18n-rosetta init --yes --langs fr,de,ja  # quick setup with specific targets
```

L'assistant guidé vous accompagne à travers les **préréglages de registre** de chaque langue — des instructions de ton et de formalité préconfigurées et adaptées à son système linguistique. Le français dispose de préréglages T-V (vouvoiement contre tutoiement), le coréen possède des niveaux de discours (해요체 contre 합쇼체 contre 해체), le japonais offre des options de keigo (です/ます contre 丁寧語).

Ou créez une configuration manuellement avec des clés de préréglage :

```json title="i18n-rosetta.config.json"
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "languages": {
    "fr": "casual-tu",
    "ko": "polite-haeyo",
    "ja": "polite"
  },
  "model": "google/gemini-2.5-flash"
}
```

Exécutez `npx i18n-rosetta init` pour parcourir les préréglages disponibles pour chaque langue.

## Facultatif : Mode Watch

Traduisez automatiquement lorsque votre fichier source est modifié :

```bash
npx i18n-rosetta watch
```

## Étapes suivantes

- **[Configuration](/docs/getting-started/configuration)** — Référence complète de la configuration
- **[Méthodes de traduction](/docs/guides/translation-methods)** — Choisissez la méthode appropriée par paire
- **[Mémoire de traduction](/docs/concepts/translation-memory)** — Comment la mise en cache vous fait économiser de l'argent lors des réexécutions
- **[Travailler avec des traducteurs professionnels](/docs/guides/professional-translators)** — Exportez en XLIFF pour une révision humaine
- **[Intégration de frameworks](/docs/guides/framework-integration)** — Hugo, next-intl, react-i18next
- **[CI/CD](/docs/guides/ci-cd)** — Automatisez les traductions dans votre pipeline
- **[Dépannage](/docs/guides/troubleshooting)** — Problèmes courants et solutions