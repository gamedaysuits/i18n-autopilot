# Guides d'intégration

Configuration étape par étape d'i18n-rosetta avec les frameworks populaires.

---

## Configuration de la clé API

Avant de procéder à l'intégration avec un framework, vous avez besoin d'une clé API de traduction. Rosetta prend en charge deux fournisseurs :

### Option A : OpenRouter (recommandé)

[OpenRouter](https://openrouter.ai) fournit une API unifiée pour plus de 200 modèles LLM. Un niveau gratuit est disponible.

```bash
# Sign up at https://openrouter.ai, then:
export OPENROUTER_API_KEY=sk-or-v1-...

# Or add to .env.local:
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Idéal pour : les projets riches en contenu, la traduction de Markdown et les projets nécessitant une protection sensible au contenu (blocs de code, shortcodes, variables d'interpolation).

### Option B : Google Translate

```bash
export GOOGLE_TRANSLATE_API_KEY=...
```

Idéal pour : les paires de chaînes clé-valeur à haut volume (plus de 130 langues). **Non recommandé** pour le contenu Markdown — Google Translate n'a aucune connaissance des blocs de code, des shortcodes ou des variables d'interpolation.

Pour utiliser Google Translate de manière explicite :

```bash
i18n-rosetta sync --method google-translate
```

> **Astuce** : Si seule `GOOGLE_TRANSLATE_API_KEY` est définie (aucune clé OpenRouter), rosetta bascule automatiquement vers Google Translate.

---

## Hugo (TOML / YAML / Markdown)

### Structure du projet

Hugo utilise `i18n/` pour les traductions de chaînes et `content/` pour le contenu des pages :

```
my-hugo-site/
├── i18n/
│   ├── en.toml             ← source of truth
│   ├── fr.toml
│   └── ja.toml
├── content/
│   ├── posts/
│   │   ├── hello.md        ← source (English)
│   │   ├── hello.fr.md
│   │   └── hello.ja.md
│   └── about.md
└── .env.local
```

### Configuration

```bash
npm install --save-dev i18n-rosetta
```

```bash
# .env.local
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Créez `i18n-rosetta.config.json` :

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./i18n",
  "contentDir": "./content",
  "format": "auto",
  "languages": ["fr", "de", "ja", "es", "ko", "zh"]
}
```

```bash
i18n-rosetta sync           # sync i18n string files + content files
i18n-rosetta sync --dry     # preview changes without writing
```

### Détails de la traduction du contenu

**Front matter** : Prend en charge les délimiteurs YAML (`---`) et TOML (`+++`). Traduit `title`, `description`, `summary`, `subtitle`, `caption` et `linkTitle` par défaut. Tous les autres champs (date, draft, tags, weight, slug, etc.) sont préservés. Personnalisez avec `translatableFields` dans votre configuration.

**Protection des blocs** : Les blocs de code, les shortcodes Hugo (`{{< >}}`, `{{% %}}`), le code en ligne et le HTML brut sont automatiquement protégés à l'aide d'espaces réservés sentinelles Unicode. Ils sont transmis sans aucune modification.

**Convention de nommage des fichiers** : Suit le modèle de traduction par nom de fichier de Hugo :
- `my-post.md` → `my-post.fr.md`
- `my-post.en.md` → `my-post.fr.md` (supprime le suffixe source)

**Ignorer l'existant** : Les fichiers traduits existants ne sont jamais écrasés. Supprimez un fichier cible pour forcer une nouvelle traduction.

### Formes plurielles

Les paramètres régionaux TOML et YAML prennent en charge les formes plurielles CLDR :

```toml
[items]
one = "{{ .Count }} item"
other = "{{ .Count }} items"
```

Représentées en interne par `items.one` et `items.other` pour la comparaison (diffing), puis resérialisées dans le format sectionné correct lors de l'écriture.

---

## next-intl (JSON)

### Structure du projet

```
my-app/
├── messages/
│   └── en.json        ← source of truth
├── src/
│   ├── i18n/
│   │   ├── routing.ts
│   │   └── request.ts
│   └── middleware.ts
└── .env.local
```

### Configuration

```bash
npm install --save-dev i18n-rosetta
```

Créez `i18n-rosetta.config.json` :

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./messages",
  "languages": ["fr", "de", "ja", "es", "ko", "zh", "pt", "ar"]
}
```

```bash
npx i18n-rosetta sync
```

Crée `messages/fr.json`, `messages/ja.json`, etc. — entièrement traduits, en préservant votre structure de clés imbriquées. next-intl les détecte automatiquement.

### Flux de travail de développement

```json
{
  "scripts": {
    "dev": "i18n-rosetta watch & next dev",
    "i18n:sync": "i18n-rosetta sync",
    "i18n:audit": "i18n-rosetta audit"
  }
}
```

---

## react-i18next (JSON)

### Structure de fichiers plats (recommandé)

```
locales/
├── en.json
├── fr.json
└── ja.json
```

```json
{
  "version": 3,
  "inputLocale": "en",
  "localesDir": "./locales",
  "languages": ["fr", "de", "ja"]
}
```

### Structure de répertoires imbriqués

Si vous utilisez la structure `{locale}/{namespace}.json`, créez un script de synchronisation pour aplatir → traduire → désaplatir. Consultez la [documentation de react-i18next](https://react.i18next.com/) pour plus de détails.