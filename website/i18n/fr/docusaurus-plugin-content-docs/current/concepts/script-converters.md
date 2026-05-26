---
sidebar_position: 6
title: "Convertisseurs de scripts"
---
# Convertisseurs de scripts

Les convertisseurs de scripts sont des hooks de post-traduction déterministes et sans LLM qui convertissent le texte d'un système d'écriture à un autre. Ils permettent un flux de travail de type « traduire une fois, afficher dans plusieurs scripts » — vous traduisez dans un script de travail (généralement latin), puis convertissez automatiquement vers le script d'affichage.

## Pourquoi des convertisseurs de scripts ?

Certaines langues utilisent plusieurs scripts pour la même langue parlée :

- **Plains Cree** : SRO (latin) pour l'édition → Syllabique (ᓀᐦᐃᔭᐍᐏᐣ) pour l'affichage
- **Serbe** : latin pour un usage international → cyrillique pour un usage national
- **Klingon** : romanisation pour la saisie → pIqaD (  ) pour l'affichage

Traduire directement vers des scripts non latins crée des problèmes : les LLM hallucinent des caractères, les fichiers JSON deviennent difficiles à gérer en contrôle de version, et les outils de diff ne peuvent pas comparer les modifications. Les convertisseurs de scripts résolvent ce problème en conservant les traductions dans un script adapté au contrôle de version et en les convertissant de manière déterministe au moment de la synchronisation.

## Convertisseurs disponibles

Rosetta est fourni avec cinq convertisseurs de scripts intégrés :

| Locale | De | Vers | Type | Police requise ? |
|--------|------|----|------|----------------|
| `crk` | SRO (Standard Roman Orthography) | Syllabique cri | Déterministe | Non — Unicode natif |
| `sr` | Latin | Cyrillique | Déterministe | Non — Unicode natif |
| `tlh` | Romanisation | pIqaD | Déterministe | Oui — PUA U+F8D0–F8FF |
| `x-elvish-s` | Latin | Tengwar (Mode de Beleriand) | Déterministe | Oui — PUA U+E000–E07F |
| `x-kryptonian` | Latin | Kryptonian | Chiffrement basé sur la police | Oui — PUA U+E100–E119 |

### Déterministe vs Basé sur la police

- **Les convertisseurs déterministes** (Cree, Serbe, Klingon, Tengwar) effectuent un véritable mappage caractère par caractère en utilisant des règles linguistiques. La sortie contient de vrais caractères Unicode.
- **Les convertisseurs basés sur la police** (Kryptonian) sont des chiffrements de substitution 1:1 où la sortie est constituée de caractères Unicode PUA qui ne s'affichent correctement qu'avec une police spécifique chargée.

## Comment ils fonctionnent

Les convertisseurs de scripts s'exécutent **après** la traduction, en tant qu'étape de post-traitement. Le pipeline est le suivant :

```
Source (English) → LLM Translation → Working Script → Script Converter → Display Script
```

Par exemple, pour le Plains Cree :
```
"Welcome" → LLM → "tānisi" (SRO) → Converter → "ᑖᓂᓯ" (Syllabics)
```

### Correspondance gloutonne de gauche à droite

Tous les convertisseurs utilisent le même algorithme : à chaque position de caractère, ils essaient d'abord la correspondance la plus longue possible, puis des correspondances progressivement plus courtes. Les caractères qui ne correspondent à aucun modèle (espaces, ponctuation, chiffres) sont transmis sans modification.

Cela gère correctement les digrammes et les trigrammes :
- Klingon : `tlh` → un seul caractère pIqaD (et non `t` + `l` + `h`)
- Serbe : `nj` → `њ` (et non `н` + `ј`)
- Cree : `twê` → un seul caractère syllabique (et non `t` + `w` + `ê`)

## Utilisation des convertisseurs de scripts

Les convertisseurs de scripts s'activent automatiquement lorsque le code de la locale correspond à un convertisseur enregistré. Aucune configuration n'est nécessaire — il vous suffit de définir votre locale cible :

```json title="i18n-rosetta.config.json"
{
  "pairs": {
    "en:crk": {
      "method": "llm-coached",
      "model": "google/gemini-2.5-pro"
    }
  }
}
```

Lorsque rosetta synchronise la paire `en:crk`, les traductions sont d'abord produites en SRO, puis automatiquement converties en caractères syllabiques avant d'être écrites dans `crk.json`.

### Vérification de l'état du convertisseur

```bash
npx i18n-rosetta status
```

La sortie d'état indique quelles paires ont des convertisseurs de scripts actifs et quelle conversion ils effectuent.

## Exigences relatives aux polices Web

Trois convertisseurs génèrent des caractères de la zone à usage privé (PUA) d'Unicode qui nécessitent des polices Web personnalisées :

### Klingon (pIqaD)

Installez une police pIqaD compatible CSUR (par exemple, « pIqaD qolqoS » ou « Klingon pIqaD HaSta ») :

```css
@font-face {
  font-family: 'pIqaD';
  src: url('/fonts/pIqaD.woff2') format('woff2');
  unicode-range: U+F8D0-F8FF;
}

:lang(tlh) {
  font-family: 'pIqaD', sans-serif;
}
```

### Tengwar (Sindarin)

Installez une police Tengwar compatible CSUR (par exemple, « Tengwar Formal CSUR », « Tengwar Annatar ») :

```css
@font-face {
  font-family: 'Tengwar';
  src: url('/fonts/tengwar-formal-csur.woff2') format('woff2');
  unicode-range: U+E000-E07F;
}

:lang(x-elvish-s) {
  font-family: 'Tengwar', serif;
}
```

### Kryptonian

Installez une police Kryptonian mappée sur les points de code PUA U+E100–E119 :

```css
@font-face {
  font-family: 'Kryptonian';
  src: url('/fonts/kryptonian.woff2') format('woff2');
  unicode-range: U+E100-E119;
}

:lang(x-kryptonian) {
  font-family: 'Kryptonian', sans-serif;
}
```

:::tip Approche alternative pour le Kryptonian
Étant donné que le Kryptonian est un pur chiffrement de A à Z, vous pouvez ignorer entièrement le convertisseur de scripts et appliquer la police au texte latin via CSS. Cela est souvent plus simple pour les déploiements Web — il suffit de servir la police Kryptonian et de définir `font-family` sur les éléments pertinents.
:::

## Ajout d'un convertisseur personnalisé

Pour ajouter un convertisseur pour une nouvelle langue, modifiez `lib/scripts.js` :

1. **Créez la carte de conversion** — un tableau ordonné de paires `[from, to]`, les séquences les plus longues en premier
2. **Créez la fonction du convertisseur** — un analyseur glouton de gauche à droite (utilisez `sroToSyllabics` comme modèle)
3. **Enregistrez-le** dans l'objet `SCRIPT_CONVERTERS` avec le code de la locale comme clé
4. **Ajoutez le champ `script`** à l'entrée de registre de la langue dans `registers.js`

```javascript
// Example: adding a converter for Cherokee (chr)
const LATIN_TO_CHEROKEE_MAP = [
  ['ga', 'Ꭶ'], ['ka', 'Ꭷ'], ['ge', 'Ꭸ'], // ...
];

function latinToCherokee(text) {
  // Same greedy left-to-right pattern as other converters
}

SCRIPT_CONVERTERS['chr'] = {
  from: 'Latin',
  to: 'Cherokee Syllabary',
  type: 'deterministic',
  converter: latinToCherokee,
};
```

---

## Voir aussi

- [Langues construites, scripts et orthographe](/docs/guides/conlangs-scripts-orthography) — Polices PUA, Unicode, ajout de nouveaux convertisseurs
- [Porte de qualité](/docs/concepts/quality-gate) — validation qui s'exécute avant la conversion de scripts
- [Langues prises en charge](/docs/reference/supported-languages) — quelles langues disposent de convertisseurs de scripts
- [Prendre en charge une langue à faibles ressources](https://mtevalarena.org/docs/community/low-resource-languages) — SRO→Syllabique en contexte
- [Livre de recettes : Pipeline contrôlé par FST](https://mtevalarena.org/docs/tutorials/fst-gated-pipeline) — conversion de scripts dans un pipeline à plusieurs étapes