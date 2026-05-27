---
sidebar_position: 3
title: "Langues construites, écritures et orthographe"
---
# Langues construites, scripts et orthographe

rosetta offre une prise en charge de premier ordre des langues construites via des registres LLM et des convertisseurs de scripts déterministes. Ce guide explique le fonctionnement de la prise en charge des langues construites, les polices dont vous avez besoin et la manière d'ajouter les vôtres.

:::tip Pourquoi les langues construites sont importantes
Les langues construites ne sont pas qu'une simple nouveauté : elles exploitent exactement la même infrastructure que celle utilisée pour les langues réelles sous-représentées. Le portail de qualité, le système d'entraînement et le pipeline de conversion de scripts fonctionnent de manière identique pour le klingon et le cri des plaines. Si votre pipeline de langues construites fonctionne, votre pipeline de langues à faibles ressources fonctionnera également.
:::

---

## Langues construites prises en charge

| Langue | Code | Convertisseur de script | Police requise |
|----------|------|:----------------:|:-------------:|
| Klingon | `tlh` | ✅ Romanisation → pIqaD | Police PUA (par ex., pIqaD qolqoS) |
| Sindarin (Elfique de Tolkien) | `x-elvish-s` | ✅ Latin → Tengwar | Police CSUR PUA |
| Kryptonien | `x-kryptonian` | ✅ Latin → Kryptonien | Police PUA |
| Anglais pirate | `x-pirate` | ❌ registre uniquement | Aucune |
| Anglais shakespearien | `x-shakespeare` | ❌ registre uniquement | Aucune |
| Parler Yoda | `x-yoda` | ❌ registre uniquement | Aucune |

Les codes des langues construites utilisent le préfixe `x-` conformément à la convention d'usage privé BCP-47, à l'exception du klingon (`tlh`) qui possède un code [ISO 639-3](https://iso639-3.sil.org/code/tlh) attribué par SIL International.

---

## Exigences relatives à Unicode, PUA et aux polices

### La zone à usage privé (PUA)

Le klingon (pIqaD), le sindarin (Tengwar) et le kryptonien utilisent les caractères de la **zone à usage privé (PUA)** d'Unicode. La PUA correspond à la plage U+E000–U+F8FF — ces points de code n'ont **aucune assignation standard**. Le [ConScript Unicode Registry (CSUR)](https://www.evertype.com/standards/csur/) maintient des mappages convenus par la communauté pour les scripts fictifs, mais ceux-ci ne font pas partie de la norme Unicode.

Ce que cela signifie en pratique :

- Le texte PUA s'affiche sous forme de **cases vides** (□□□) si la police correcte n'est pas chargée
- Différentes polices peuvent associer différents glyphes aux mêmes points de code PUA
- rosetta n'inclut PAS de polices PUA — vous devez les charger vous-même
- Les polices système ne rendront jamais ces caractères

### Plages PUA par script

| Script | Plage PUA | Référence CSUR |
|--------|-----------|---------------|
| Klingon (pIqaD) | U+F8D0–U+F8FF | [CSUR Klingon](https://www.evertype.com/standards/csur/klingon.html) |
| Tengwar (Elfique) | U+E000–U+E07F | [CSUR Tengwar](https://www.evertype.com/standards/csur/tengwar.html) |
| Kryptonien | Varie selon la police | Aucune norme CSUR |

### Chargement des polices Web PUA

rosetta inclut une commande intégrée pour télécharger et gérer les polices Web PUA :

```bash
# See which fonts are needed for your configured languages
i18n-rosetta fonts list

# Download all needed fonts (auto-detects project type for output directory)
i18n-rosetta fonts install

# Also generate a CSS snippet with @font-face declarations
i18n-rosetta fonts install --css
```

La commande `fonts install` effectue des téléchargements depuis des dépôts open source vérifiés :

| Police | Script | Licence | Source |
|------|--------|---------|--------|
| pIqaD qolqoS | Klingon | SIL Open Font License 1.1 | [GitHub](https://github.com/dadap/pIqaD-fonts) |
| FreeMonoTengwar | Tengwar | GNU GPL v3 (avec exception pour les polices) | [SourceForge](https://sourceforge.net/projects/freetengwar/) |
| *(fournie par l'utilisateur)* | Kryptonien | Varie | Aucune police PUA open source disponible |

Le répertoire de sortie est détecté automatiquement à partir de la structure de votre projet (Docusaurus → `static/fonts/`, Hugo → `static/fonts/`, par défaut → `public/fonts/`). Vous pouvez le remplacer avec `--dir`.

Si vous préférez gérer les polices manuellement, ajoutez des règles `@font-face` dans votre CSS :

```css
@font-face {
  font-family: 'pIqaD';
  src: url('/fonts/pIqaDqolqoS.ttf') format('truetype');
  font-display: swap;
  unicode-range: U+F8D0-F8FF;
}

/* Apply to Klingon text elements */
[lang="tlh"], [data-script="piqad"] {
  font-family: 'pIqaD', sans-serif;
}
```

:::warning La prise en charge d'Unicode n'est PAS garantie
Le Consortium Unicode a [explicitement refusé](https://www.unicode.org/faq/private_use.html) d'encoder les scripts fictifs dans la norme. Les assignations PUA sont maintenues par la communauté et peuvent entrer en conflit selon les implémentations de polices. Spécifiez toujours la police exacte utilisée par votre projet et testez le rendu sur différents navigateurs.
:::

---

## Convertisseurs de scripts

### Comment ils fonctionnent

La conversion de scripts de rosetta est un **hook post-traduction** :

1. Le LLM traduit le texte dans un **script de travail** (généralement latin ou SRO)
2. Le [portail de qualité](/docs/concepts/quality-gate) valide la sortie
3. Le convertisseur déterministe transforme le texte validé en **script d'affichage**
4. Le texte converti est écrit sur le disque

Cette approche en deux étapes fonctionne car les LLM produisent de meilleurs résultats lorsqu'ils travaillent avec des scripts basés sur l'alphabet latin. Le convertisseur déterministe garantit une sortie de script correcte sans dépendre des connaissances (souvent peu fiables) du modèle en matière de scripts.

### Les cinq convertisseurs

rosetta est fourni avec cinq convertisseurs de scripts intégrés :

#### Cri des plaines : SRO → Syllabaire (`crk`)

De l'orthographe romaine standard (SRO) au syllabaire autochtone canadien.

```
Input:  "tawâw"
Output: "ᑕᐚᐤ"
```

Les voyelles longues utilisent un macron/circonflexe : ê, î, ô, â. Le convertisseur gère tous les signes diacritiques SRO et les associe aux caractères syllabiques corrects. Consultez la section [Prendre en charge une langue à faibles ressources](https://mtevalarena.org/docs/community/low-resource-languages) pour le pipeline complet du cri.

#### Serbe : Latin → Cyrillique (`sr`)

Conversion déterministe du latin au cyrillique pour le serbe.

```
Input:  "zdravo"
Output: "здраво"
```

Cela gère le mappage complet de l'alphabet serbe, y compris les digrammes (lj → љ, nj → њ, dž → џ).

#### Klingon : Romanisation → pIqaD (`tlh`)

Du système de romanisation de Marc Okrand vers les caractères PUA pIqaD.

```
Input:  "Qapla'"    (romanized Klingon)
Output: [pIqaD PUA] (requires pIqaD font to render)
```

#### Sindarin : Latin → Tengwar (`x-elvish-s`)

Mappage Tengwar du mode sindarin de Tolkien.

```
Input:  "elen síla"  (Latin Sindarin)
Output: [Tengwar PUA] (requires Tengwar font to render)
```

#### Kryptonien : Latin → Kryptonien (`x-kryptonian`)

Mappage du script kryptonien issu du lexique des fans.

```
Input:  "Kal-El"
Output: [Kryptonian PUA] (requires Kryptonian font to render)
```

### Déclenchement d'un convertisseur

Définissez le champ `scripts` dans la configuration de votre langue. Pour les convertisseurs intégrés, cela est détecté automatiquement à partir du code de la langue :

```json
{
  "languages": {
    "sr": { "scripts": "sr" },
    "crk": {}
  }
}
```

Le cri des plaines (`crk`) est détecté automatiquement — vous n'avez pas besoin de définir `scripts` explicitement.

---

## Langues multi-scripts

Certaines langues réelles utilisent plusieurs scripts actifs :

| Langue | Scripts | Approche de rosetta |
|----------|---------|-----------------|
| Serbe | Latin + Cyrillique | Convertisseur de script (`sr`) — traduire en latin, convertir en cyrillique |
| Chinois | Simplifié + Traditionnel | Codes de paramètres régionaux distincts (`zh` contre `zh-TW`) avec des registres distincts |

Pour les langues dont les deux scripts s'adressent au même public (serbe), utilisez un convertisseur de script. Pour les langues dont les scripts s'adressent à des publics différents (chinois simplifié pour la Chine continentale, traditionnel pour Taïwan/Hong Kong), utilisez des codes de paramètres régionaux distincts.

---

## Notes sur l'orthographe

Les registres ne se limitent pas au ton : ils comportent des **instructions orthographiques** qui orientent le LLM vers des conventions d'écriture correctes.

### Formules de politesse formelles

Les registres intégrés de rosetta incluent la formule de politesse formelle culturellement appropriée pour chaque langue :

| Langue | Forme formelle | Instruction de registre |
|----------|------------|---------------------|
| Allemand | Sie | `Use Sie-form for formal address` |
| Français | vous | `Use vous-form` |
| Russe | вы | `Professional register with вы-form` |
| Turc | siz | `Professional register with siz-form` |
| Coréen | 합쇼체 | `Formal Korean (합쇼체)` |
| Japonais | です/ます | `Polite professional register (です/ます form)` |
| Polonais | Pan/Pani | `Professional register with Pan/Pani form` |

### Écriture inclusive

Chaque fiche de langue possède un champ `gender.inclusiveGuidance` contenant des conseils spécifiques à la langue. Celui-ci est injecté dans l'invite de traduction du LLM séparément du préréglage du registre, de sorte qu'il s'applique de manière cohérente, quel que soit le préréglage de formalité choisi par l'utilisateur :

- **Français** : Écriture inclusive avec notation par point médian (par ex., « Connecté·e »)
- **Allemand** : Notation avec deux-points (par ex., « Benutzer:innen »)
- **Espagnol** : Restructuration neutre privilégiée ; notation avec barre oblique (par ex., « usuario/a ») comme solution de repli

Pour les langues ne disposant pas de directives spécifiques dans leur fiche (par ex., coréen, langues construites), le système se rabat sur une règle générique : *"privilégier les formes neutres ou l'option la plus inclusive disponible."*

### Exigences relatives aux scripts RTL (de droite à gauche)

Les registres de l'arabe, de l'hébreu, du persan et de l'ourdou mentionnent tous les exigences d'écriture de droite à gauche : `Ensure text reads naturally in RTL layout contexts.`

### Remplacement de tout registre

Chaque registre est une valeur de configuration — remplacez-la pour l'adapter à la voix de votre projet :

```json
{
  "languages": {
    "fr": {
      "register": "Casual French. Use tu-form. Conversational blog tone. Gender-neutral when possible."
    },
    "de": {
      "register": "Informal German. Use du-form. Tech startup voice."
    }
  }
}
```

Consultez la section [Configuration](/docs/getting-started/configuration) pour la référence complète de la configuration.

---

## Ajout d'une nouvelle langue construite

### Étape par étape

1. **Choisissez un code d'usage privé BCP-47** : Utilisez le préfixe `x-` (par ex., `x-dothraki`, `x-valyrian`).

2. **Ajoutez-le à votre configuration** :

```json
{
  "languages": {
    "x-dothraki": {
      "register": "Dothraki language. Use David J. Peterson's vocabulary from the Living Language Dothraki textbook. Harsh, direct tone. No articles, no verb 'to be'."
    }
  }
}
```

3. **(Facultatif) Ajoutez un convertisseur de script** : Si votre langue construite utilise un script d'affichage non latin, ajoutez un convertisseur dans `lib/scripts.js` et enregistrez-le dans `SCRIPT_CONVERTERS`.

4. **Testez** : Exécutez `i18n-rosetta sync --dry` pour prévisualiser les traductions sans écrire de fichiers.

5. **Vérifiez le portail de qualité** : Le [portail de qualité](/docs/concepts/quality-gate) peut nécessiter des ajustements pour votre langue construite — en particulier la vérification `requireNonLatin` si votre langue construite utilise des caractères PUA.

:::note La qualité des langues construites dépend des connaissances du LLM
Le LLM ne peut traduire que dans une langue construite qu'il a rencontrée dans ses données d'entraînement. Les langues construites bien documentées (klingon, sindarin, dothraki) fonctionnent bien. Les langues construites obscures ou récemment inventées peuvent produire des résultats incohérents. Utilisez des [données d'entraînement](/docs/concepts/coaching-data) pour améliorer la qualité.
:::

---

## Voir aussi

- [Langues prises en charge](/docs/reference/supported-languages) — tableau complet des langues avec la disponibilité des méthodes
- [Convertisseurs de scripts](/docs/concepts/script-converters) — détails techniques du pipeline de conversion
- [Méthodes de traduction](/docs/guides/translation-methods) — fonctionnement de chaque méthode de traduction
- [Configuration](/docs/getting-started/configuration) — référence de configuration incluant la configuration de la langue et du registre
- [Prendre en charge une langue à faibles ressources](https://mtevalarena.org/docs/community/low-resource-languages) — la même infrastructure appliquée aux langues réelles sous-représentées