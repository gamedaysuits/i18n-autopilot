---
sidebar_position: 7
title: "Souveraineté des données"
description: "Les principes OCAP, CARE et Māori Data Sovereignty pour la traduction des langues autochtones. Pourquoi le consentement communautaire doit précéder le déploiement."
---
# Souveraineté des données

La traduction automatique pour les langues autochtones soulève des questions qui n'existent pas pour le français ou le japonais. À qui appartiennent les données d'entraînement ? Qui contrôle la façon dont un modèle de langage s'exprime ? Qui décide si une traduction est d'une qualité suffisante pour être publiée ?

**La réponse est toujours la communauté.**

rosetta est conçu pour soutenir ce principe. La méthode `api` conserve toutes les ressources linguistiques côté serveur sous le contrôle de la communauté. Le système de plugins sépare la méthode de l'outil. Cependant, l'outil ne peut pas imposer l'éthique — cette page explique les principes que vous devez suivre.

---

## Principes OCAP®

Les principes **OCAP** (Ownership, Control, Access, Possession - Propriété, Contrôle, Accès, Possession) constituent un ensemble de principes élaborés par le [First Nations Information Governance Centre](https://fnigc.ca/ocap-training/) (FNIGC) qui établissent la manière dont les données des Premières Nations doivent être collectées, protégées, utilisées et partagées.

| Principe | Ce que cela signifie pour la traduction |
|-----------|------------------------------|
| **Ownership** (Propriété) | La communauté possède ses données linguistiques — dictionnaires, grammaires, textes parallèles, fichiers d'accompagnement (coaching files) et toute traduction qui en découle. |
| **Control** (Contrôle) | La communauté contrôle la façon dont ses données linguistiques sont utilisées, qui y a accès et quelles méthodes de traduction sont acceptables. |
| **Access** (Accès) | Les membres de la communauté ont le droit d'accéder à leurs propres ressources linguistiques et de les gérer, quel que soit l'endroit où elles sont stockées. |
| **Possession** | Les données physiques (fichiers d'accompagnement, dictionnaires, poids des modèles) doivent résider sur une infrastructure contrôlée par la communauté — et non sur un cloud tiers. |

### Ce que l'OCAP signifie dans la pratique

- **Ne publiez pas de traductions** d'une langue autochtone sans l'autorisation explicite de la communauté.
- **N'entraînez pas de modèles** sur des données linguistiques fournies par la communauté sans un accord de partage de données.
- **Ne faites pas de scraping** des ressources linguistiques de la communauté à partir de sites web, de réseaux sociaux ou de supports pédagogiques.
- **Utilisez la méthode `api`** afin que les prompts, les données d'accompagnement et les dictionnaires restent sur des serveurs contrôlés par la communauté. La méthode `api` de rosetta est un « tuyau stupide » (dumb pipe) — elle envoie des clés et récupère des traductions. Toute la propriété intellectuelle (IP) linguistique reste côté serveur.
- **Documentez la provenance** — le champ `provenance` dans le [manifeste du plugin](/docs/reference/plugin-spec) doit lister chaque ressource utilisée, sa licence et son origine.

:::warning OCAP® est une marque déposée
OCAP® est une marque déposée du First Nations Information Governance Centre. Elle s'applique spécifiquement aux Premières Nations du Canada. Ces principes ont une pertinence plus large, mais la marque et l'autorité de gouvernance appartiennent au FNIGC.
:::

---

## Principes CARE

Les **Principes CARE pour la gouvernance des données autochtones** ont été élaborés par la [Global Indigenous Data Alliance](https://www.gida-global.org/care) (GIDA) en complément des principes de données FAIR. FAIR stipule que les données doivent être Faciles à trouver (Findable), Accessibles, Interopérables et Réutilisables. CARE affirme que cela ne suffit pas — la gouvernance des données doit également centrer les droits des autochtones.

| Principe | Application |
|-----------|------------|
| **Collective Benefit** (Bénéfice collectif) | Les outils de traduction doivent avant tout profiter à la communauté linguistique. Les scores dans les classements (leaderboards) sont un moyen d'améliorer les méthodes, et non d'extraire une valeur commerciale des langues communautaires. |
| **Authority to Control** (Autorité de contrôle) | Les communautés ont l'autorité de gouverner la façon dont leurs données linguistiques sont collectées, utilisées et partagées. Un score élevé dans un classement n'accorde pas la permission de publier des traductions. |
| **Responsibility** (Responsabilité) | Les chercheurs et les développeurs travaillant avec des données linguistiques autochtones ont la responsabilité de nouer des relations, d'obtenir un consentement et de partager les bénéfices. |
| **Ethics** (Éthique) | Les droits et le bien-être des peuples autochtones doivent être la préoccupation principale. Les méthodes de traduction doivent être développées *avec* les communautés, et non *sur* elles. |

---

## Te Mana Raraunga — Souveraineté des données maories

**Te Mana Raraunga** est le [Māori Data Sovereignty Network](https://www.temanararaunga.maori.nz/) (Réseau de souveraineté des données maories). Il affirme que les données maories — y compris les données linguistiques — sont un taonga (trésor) soumis aux principes du Traité de Waitangi et au tikanga Māori (droit coutumier maori).

Principes clés :

| Principe | Signification |
|-----------|---------|
| **Rangatiratanga** (Autorité) | Les Maoris ont un droit inhérent d'exercer une autorité sur leurs données, y compris les données linguistiques. |
| **Whakapapa** (Relations) | Les données ont des origines et des connexions. Les données linguistiques portent les relations et les connaissances des personnes qui les ont créées. |
| **Whanaungatanga** (Obligations) | Ceux qui détiennent ou traitent des données maories ont des obligations réciproques envers les communautés dont elles proviennent. |
| **Kotahitanga** (Bénéfice collectif) | Les données maories doivent être utilisées pour le bénéfice collectif des Maoris. |
| **Manaakitanga** (Réciprocité) | L'utilisation des données maories doit impliquer soin, respect et réciprocité. |
| **Kaitiakitanga** (Garde/Tutelle) | Les gardiens des données ont le devoir de protéger les données et de s'assurer qu'elles sont utilisées de manière appropriée. |

Ces principes s'appliquent au te reo Māori (la langue maorie) et à tout travail informatique impliquant des données linguistiques maories.

---

## Ce que cela signifie pour les utilisateurs de rosetta

### Pour les langues standards (français, japonais, espagnol...)

Utilisez rosetta normalement. Ces langues disposent de vastes corpus accessibles au public, d'API de traduction établies et ne posent aucun problème de souveraineté. Traduisez, synchronisez et publiez comme vous le souhaitez.

### Pour les langues autochtones et à faibles ressources

La situation est fondamentalement différente :

1. **Obtenez d'abord le consentement.** Avant de développer une méthode de traduction pour une langue autochtone, établissez une relation avec la communauté. Une méthode conçue sans l'implication de la communauté — aussi impressionnante soit-elle sur le plan technique — ne doit pas être publiée ni distribuée.

2. **Utilisez la méthode `api`.** Hébergez le pipeline de traduction sur une infrastructure contrôlée par la communauté. La méthode `api` dans rosetta est conçue pour cela : elle envoie des clés et récupère des traductions sans exposer les prompts, les dictionnaires ou les données d'accompagnement qui font fonctionner la méthode.

    ```json title="Community-controlled setup"
    {
      "pairs": {
        "en:crk": {
          "method": "api",
          "endpoint": "https://api.community-server.example/translate"
        }
      }
    }
    ```

3. **Documentez tout.** Utilisez le champ `provenance` dans le manifeste de votre plugin pour lister chaque ressource, sa licence et indiquer si elle a été fournie avec le consentement de la communauté.

4. **Les scores ne sont pas des licences.** Un score élevé dans le classement prouve qu'une méthode fonctionne bien techniquement. Il n'accorde pas la permission de publier des traductions, de distribuer le plugin ou de commercialiser la méthode. C'est la communauté qui décide.

5. **Partagez la méthode, pas les données.** Si vous développez une technique performante (par exemple, « LLM contrôlé par FST avec prompts accompagnés »), partagez l'*architecture* et l'*approche* dans le classement. La communauté conserve le contrôle sur les données linguistiques qui la font fonctionner pour sa langue spécifique.

---

## La méthode `api` et la souveraineté

La [méthode de traduction](/docs/guides/translation-methods) `api` existe spécifiquement pour soutenir la souveraineté des données. Voici pourquoi :

| Aspect | Autres méthodes | Méthode `api` |
|--------|--------------|-------------|
| **Où résident les prompts** | Dans les fichiers de configuration de rosetta (visibles par tous les développeurs) | Sur le serveur de la communauté (privé) |
| **Où résident les données d'accompagnement** | Dans le répertoire `.rosetta/coaching/` (commit dans git) | Sur le serveur de la communauté (privé) |
| **Où résident les dictionnaires** | Dans le répertoire du plugin (distribués avec le plugin) | Sur le serveur de la communauté (privé) |
| **Qui contrôle le pipeline** | Quiconque exécute `rosetta sync` | La communauté qui gère l'API |
| **Ce que rosetta voit** | Tout | Clés en entrée, traductions en sortie |

La méthode `api` est un choix architectural délibéré. Il s'agit d'un « tuyau stupide » car la propriété intellectuelle — les connaissances linguistiques, les règles de grammaire, les exemples d'accompagnement soigneusement sélectionnés — appartient à la communauté, et non à l'outil.

Consultez [Servir une méthode via API](/docs/guides/serving-a-method) pour les détails d'implémentation.

---

## Lectures complémentaires

- [First Nations Information Governance Centre — OCAP®](https://fnigc.ca/ocap-training/)
- [Global Indigenous Data Alliance — Principes CARE](https://www.gida-global.org/care)
- [Te Mana Raraunga — Māori Data Sovereignty Network](https://www.temanararaunga.maori.nz/)
- [USIDSN — United States Indigenous Data Sovereignty Network](https://usindigenousdata.org/)

---

## Voir aussi

- [Soutenir une langue à faibles ressources](/docs/guides/low-resource-languages) — le guide technique avec le contexte OCAP
- [Méthodes de traduction](/docs/guides/translation-methods) — la méthode `api` et comment elle protège la propriété intellectuelle
- [Servir une méthode via API](/docs/guides/serving-a-method) — héberger un pipeline contrôlé par la communauté
- [Spécification du plugin](/docs/reference/plugin-spec) — le champ `provenance` pour l'attribution des ressources
- [Livre de recettes : Pipeline contrôlé par FST](/docs/tutorials/fst-gated-pipeline) — construire un pipeline qu'une communauté peut auto-héberger