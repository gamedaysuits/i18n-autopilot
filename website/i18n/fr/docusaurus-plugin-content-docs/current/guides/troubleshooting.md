---
sidebar_position: 6
title: "Dépannage"
---
# Dépannage

Problèmes courants et solutions pour i18n-rosetta.

## API et Authentification

### "OPENROUTER_API_KEY not found"

Rosetta nécessite une clé API pour la traduction par LLM. Définissez-la comme variable d'environnement :

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
```

Ou dans un fichier `.env` (si votre projet charge les fichiers `.env`) :

```
OPENROUTER_API_KEY=sk-or-v1-...
```

:::tip
Si vous ne disposez que d'une clé API Google Translate, rosetta la détecte automatiquement et utilise Google Translate comme méthode par défaut. Aucune modification de configuration n'est nécessaire.
:::

### "401 Unauthorized" provenant d'OpenRouter

Votre clé API est invalide ou a expiré. Veuillez la vérifier sur [openrouter.ai/keys](https://openrouter.ai/keys).

### "429 Too Many Requests" / Limitation de débit (Rate Limiting)

Rosetta gère les limites de débit en interne avec un recul exponentiel (exponential backoff). Si vous atteignez constamment les limites de débit :

1. **Réduisez la taille des lots (batch size)** dans votre configuration :
   ```json
   { "batchSize": 15 }
   ```
2. **Utilisez un modèle avec des limites de débit plus élevées** (par exemple, `google/gemini-3.5-flash` possède des limites généreuses).
3. **Utilisez une méthode plus économique/rapide** pour les paires à fort volume — Google Translate n'a pas de limite de débit :
   ```json
   { "pairs": { "en:it": { "method": "google-translate" } } }
   ```

### Modèle introuvable / Erreurs 404

Les fournisseurs directs de LLM (`openai`, `anthropic`, `gemini`) valident votre chaîne de modèle lors de la première utilisation. Si vous voyez un avertissement :

**"looks like an OpenRouter path"** — Vous utilisez un modèle au format OpenRouter (`google/gemini-3.5-flash`) avec un fournisseur direct. Les fournisseurs directs utilisent des noms de modèles simples :

```diff
- { "method": "gemini", "model": "google/gemini-3.5-flash" }
+ { "method": "gemini", "model": "gemini-2.5-flash" }
```

Ou passez à la méthode `llm` pour utiliser OpenRouter :
```json
{ "method": "llm", "model": "google/gemini-3.5-flash" }
```

**"is an Anthropic/OpenAI/Gemini model"** — Vous envoyez un modèle au mauvais fournisseur :

```diff
- { "method": "gemini", "model": "claude-sonnet-4-6" }
+ { "method": "anthropic", "model": "claude-sonnet-4-6" }
```

**"not found in available models"** — Le modèle est peut-être obsolète ou mal orthographié. Rosetta récupère la liste des modèles en direct du fournisseur et suggère des alternatives. Consultez la documentation du fournisseur pour connaître les noms de modèles actuels.

:::tip L'obsolescence des modèles est fréquente
Les fournisseurs retirent régulièrement des noms de modèles. Si les traductions échouent soudainement après une mise à jour du fournisseur, vérifiez la sortie `[WARN]` — elle vous indiquera les alternatives actuelles.
:::

## Qualité de la traduction

### Les traductions font écho à la langue source

La barrière de qualité (quality gate) détecte cela. Si une traduction est identique à la source anglaise, elle est rejetée et réessayée. Si le problème persiste :

1. **Vérifiez le modèle** — Certains modèles sont peu performants pour des paires de langues spécifiques.
2. **Ajoutez des instructions de registre** — Indiquez au modèle quelle langue produire :
   ```json
   {
     "languages": {
       "ja": { "name": "Japanese", "register": "Polite/formal Japanese" }
     }
   }
   ```
3. **Essayez un modèle différent** — Passez de `gpt-4o-mini` à `gpt-4o` ou `google/gemini-2.5-pro`.

### Sortie de script incorrecte (par exemple, texte latin pour le japonais)

La vérification de conformité des scripts de la barrière de qualité détecte la plupart des cas. Si le problème persiste :

- Vérifiez que le code de la langue (locale) est correct (`ja`, et non `jp`).
- Ajoutez des instructions de script explicites dans le champ `register` :
  ```json
  { "register": "Japanese using hiragana, katakana, and kanji" }
  ```

### Modèles d'hallucination dans la sortie

Les motifs de trigrammes répétés (par exemple, "bonjour bonjour bonjour") sont détectés par le détecteur de boucles d'hallucination. Si la sortie est tronquée ou incohérente mais passe le détecteur :

1. **Réduisez la taille des lots** — Des lots plus petits produisent des résultats plus ciblés.
2. **Utilisez un modèle plus puissant** — Les modèles plus grands hallucinent moins sur les scripts non latins.
3. **Ajoutez des données d'accompagnement (coaching data)** — Les termes du dictionnaire ancrent la traduction.

## Problèmes de fichiers et de formats

### "No locale files found"

Rosetta détecte automatiquement les fichiers de langue. S'il ne peut pas les trouver :

1. **Vérifiez `localesDir`** — Doit pointer vers le répertoire contenant les fichiers de langue :
   ```json
   { "localesDir": "./locales" }
   ```
2. **Vérifiez le nommage des fichiers** — Les fichiers doivent être nommés selon le code de la langue : `en.json`, `fr.json`, etc.
3. **Vérifiez le format** — Formats pris en charge : JSON, JSON imbriqué, YAML, TOML.

### Conflits de fichiers de verrouillage (Lock file)

Si `.i18n-rosetta.lock` se retrouve dans un mauvais état :

```bash
# Reset the lock file (next sync will retranslate everything)
rm .i18n-rosetta.lock
npx i18n-rosetta sync
```

:::warning
La suppression du fichier de verrouillage signifie que la prochaine synchronisation retraduira toutes les clés, et non seulement celles qui ont été modifiées. Cela a des implications sur les coûts d'API pour les grands projets.
:::

### Retraduction de clés spécifiques

Si des traductions individuelles sont incorrectes et que vous souhaitez forcer leur retraduction sans supprimer le fichier de verrouillage :

```bash
# Re-translate a single key
npx i18n-rosetta sync --force-keys "hero.title"

# Re-translate multiple keys
npx i18n-rosetta sync --force-keys "nav.home,nav.about,footer.copyright"
```

L'indicateur `--force-keys` annule la vérification du hachage du fichier de verrouillage pour ces clés spécifiques, forçant ainsi la retraduction sans affecter les autres clés.

### La traduction du contenu corrompt les blocs de code

Cela ne devrait pas se produire — les blocs de code sont protégés avant la traduction. Si cela se produit :

1. Vérifiez que le bloc de code utilise un encadrement standard (trois accents graves / backticks).
2. Vérifiez s'il y a des blocs de code non fermés dans le Markdown source.
3. Signalez un problème (issue) — il s'agit d'un bogue dans le système de protection des sentinelles.

## Problèmes liés à la CLI

### `--watch` ne détecte pas les modifications

La surveillance des fichiers utilise la fonction native `fs.watch` de Node.js. Problèmes connus :

- **Lecteurs réseau** — `fs.watch` ne fonctionne pas de manière fiable sur les montages NFS/SMB.
- **Volumes Docker** — Utilisez le mode d'interrogation (polling) ou exécutez rosetta à l'intérieur du conteneur.
- **Grands répertoires** — Le système de surveillance surveille `localesDir` de manière récursive ; des arborescences très profondes peuvent dépasser les limites du système d'exploitation.

### `npx` exécute une ancienne version

```bash
# Clear the npx cache
npx --yes i18n-rosetta@latest sync
```

Ou installez-le globalement :

```bash
npm install -g i18n-rosetta
i18n-rosetta sync
```

## Performances

### La synchronisation est lente pour de nombreuses langues

Rosetta traduit toutes les langues en parallèle par défaut. Si la synchronisation est toujours lente :

1. **Utilisez Google Translate pour les paires à fort volume** — C'est 10 à 50 fois plus rapide que la traduction par LLM.
2. **Augmentez la taille des lots** (la valeur par défaut est 80) :
   ```json
   { "batchSize": 120 }
   ```
3. **Ajustez la simultanéité (concurrency)** — Le parallélisme des fichiers de langue JSON est défini par défaut sur 200 et celui du contenu sur 48. Si votre fournisseur d'API prend en charge des limites de débit plus élevées :
   ```bash
   npx i18n-rosetta sync --json-concurrency 80 --content-concurrency 20
   ```
4. **Utilisez un modèle rapide** — `gpt-4o-mini` est considérablement plus rapide que `gpt-4o`.

### Coûts d'API élevés

- **Vérifiez la taille des lots** — Des lots plus importants = moins d'appels d'API = des coûts réduits.
- **Utilisez la mémoire de traduction (Translation Memory)** — La MT est activée par défaut. Exécutez `i18n-rosetta tm stats` pour vérifier qu'elle fonctionne. Si vous voyez 0 entrée après plusieurs synchronisations, il peut y avoir un problème avec les autorisations de votre répertoire `.rosetta/`.
- **Utilisez la mise en cache des invites (prompt caching)** — Rosetta sépare les messages système/utilisateur pour obtenir des correspondances en cache sur les modèles Anthropic et Google.
- **Utilisez Google Translate pour les langues de niveau 2** — Consultez le guide pratique [Traduire 30 langues](/docs/tutorials/translate-30-languages).

### Traductions obsolètes après un changement de fournisseur

Si vous passez d'une méthode de traduction à une autre (par exemple, de `llm` à `deepl`), le cache de la MT peut toujours fournir d'anciennes traductions de la méthode précédente pour les clés dont le texte source n'a pas changé. La clé de cache inclut le nom de la méthode, la plupart des cas sont donc gérés automatiquement. Toutefois, si vous avez modifié `model` au sein de la même méthode :

```bash
# Force fresh translations for all keys
i18n-rosetta sync --no-tm

# Or clear the cache entirely and re-sync
i18n-rosetta tm clear --yes
i18n-rosetta sync
```

Consultez la section [Mémoire de traduction](/docs/concepts/translation-memory) pour obtenir des détails sur la conception des clés de cache.

## Toujours bloqué ?

- **[Problèmes GitHub (Issues)](https://github.com/gamedaysuits/i18n-rosetta/issues)** — Recherchez des problèmes existants ou signalez-en un nouveau.
- **[Documentation sur l'architecture](/docs/concepts/architecture)** — Comprendre la conception du système.
- **[Barrière de qualité (Quality Gate)](/docs/concepts/quality-gate)** — Comment fonctionne la validation en arrière-plan.