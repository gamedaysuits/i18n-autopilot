---
sidebar_position: 5
title: "Eine ressourcenarme Sprache unterstützen"
---
# Unterstützung einer Low-Resource-Sprache

:::info Status: In aktiver Entwicklung
Die Unterstützung für Plains Cree (nêhiyawêwin) befindet sich derzeit in der Entwicklung. Die hier beschriebenen Werkzeuge, die Evaluierungsumgebung und das Leaderboard sind real und heute bereits nutzbar, aber die Übersetzungs-Pipeline für Cree wurde noch nicht veröffentlicht. Sobald dies geschieht, wird dies als Blaupause für andere polysynthetische und ressourcenarme Sprachen mit FST-Infrastruktur dienen.
:::

## Das ungelöste Problem

Google Translate unterstützt etwa 130 Sprachen. Auf der Erde werden über 7.000 gesprochen. Für Tausende von Sprachen – darunter viele indigene Sprachen mit aktiven Sprechergemeinschaften – existiert keine kommerzielle Übersetzungs-API, es wurde kein großes paralleles Korpus zusammengestellt und kein vortrainiertes Modell liefert zuverlässige Ergebnisse.

Dies ist keine Lücke, die sich von selbst schließen wird. Ressourcenarme Sprachen sind ressourcenarm, *weil* die wirtschaftlichen Rahmenbedingungen der kommerziellen maschinellen Übersetzung (MT) sie nicht erreichen. Die Sprecher, die diese Werkzeuge am dringendsten benötigen, sind genau die Gemeinschaften, für die sie am unwahrscheinlichsten entwickelt werden.

**rosetta wurde entwickelt, um das zu ändern.**

Das [Method Leaderboard](/leaderboard) ist eine offene Herausforderung: Entwickeln Sie die beste Übersetzungsmethode für eine unterversorgte Sprache, beweisen Sie dies durch eine reproduzierbare Evaluierung und sichern Sie sich die höchste Punktzahl. Jeder auf der Welt kann einen Beitrag leisten – Linguisten, ML-Forscher, Spracharbeiter aus den Gemeinschaften, Studenten, Hobbyisten. Das Problem ist ungelöst. Die Infrastruktur ist vorhanden. Das Leaderboard wartet.

---

## Warum dies schwierig ist: Polysynthetische Morphologie

Die meisten kommerziellen MT-Systeme wurden für Sprachen wie Englisch, Französisch und Chinesisch entwickelt – Sprachen, in denen Wörter relativ kurz sind und Sätze aus diskreten Token gebildet werden. Viele indigene Sprachen, einschließlich Plains Cree, sind jedoch **polysynthetisch**: Ein einziges Wort kann das kodieren, was im Englischen als ganzer Satz ausgedrückt wird.

### Das Cree-Beispiel

Betrachten Sie das Plains-Cree-Wort:

> **ê-kî-nitawi-kîskinwahamâkosiyân**
> *"als ich zur Schule ging"*

Das ist **ein Wort**. Es kodiert Tempus (Vergangenheit), Richtung (hingehen), die Wurzel (lernen), Genus Verbi (Passiv/Reflexiv) und Person (erste Person Singular). Ein LLM, das überwiegend mit Englisch trainiert wurde, hat keine Intuition für diese Art von morphologischer Dichte.

Die Herausforderungen summieren sich:

| Herausforderung | Was das bedeutet |
|-----------|--------------|
| **Morphologische Komplexität** | Eine einzige Verbwurzel kann durch Präfigierung, Suffigierung und Zirkumfigierung Tausende von gültigen flektierten Formen erzeugen |
| **Belebt/Unbelebt-Unterscheidung** | Substantive sind grammatikalisch belebt oder unbelebt – dies beeinflusst die Verbkonjugation, Demonstrativpronomen und die Pluralbildung. Die Klassifizierung folgt nicht immer der biologischen Belebtheit (*askiy* "Erde" ist belebt; *maskisin* "Schuh" ist ebenfalls belebt) |
| **Obviation** | Referenzen in der dritten Person werden nach Nähe/Salienz geordnet. Die Unterscheidung zwischen "proximat" und "obviativ" hat keine Entsprechung im Englischen |
| **Spärliche Trainingsdaten** | LLMs haben sehr wenig Text in Plains Cree gesehen. Was sie gesehen haben, könnte Dialekte (Y-Dialekt, TH-Dialekt) oder Orthografien (SRO vs. Silbenschrift) vermischen |
| **Keine kommerzielle Baseline** | Google Translate liefert nichts Brauchbares. Es gibt keine Standard-API, mit der man vergleichen könnte |

Aus diesem Grund bleibt die Übersetzung polysynthetischer Sprachen ein **offenes Forschungsproblem** – und deshalb ist ein bewertetes, reproduzierbares Leaderboard wichtig.

---

## Stand der Technik: Wie man sich diesem Problem genähert hat

### Der ALTLab FST

Die bedeutendste computerlinguistische Ressource für Plains Cree ist der **Endliche Automat (Finite-State Transducer, FST)**, der vom [Alberta Language Technology Lab (ALTLab)](https://altlab.artsrn.ualberta.ca/) an der University of Alberta in Zusammenarbeit mit [Giellatekno](https://giellatekno.uit.no/) an der UiT The Arctic University of Norway entwickelt wurde.

Der ALTLab FST ist ein **morphologischer Analysator und Generator**: Wenn ihm ein flektiertes Cree-Wort übergeben wird, kann er es in seine Wurzel und grammatikalischen Tags zerlegen, und wenn ihm eine Wurzel plus Tags übergeben wird, kann er die korrekte flektierte Form generieren. Dies ist deterministisch – kein neuronales Netzwerk, keine Halluzination, keine Wahrscheinlichkeit. Wenn der FST ein Wort akzeptiert, ist dieses Wort morphologisch gültig.

Deshalb erfasst das rosetta-Leaderboard die **FST-Akzeptanzrate** als Metrik. Eine Übersetzungsmethode, die Wörter erzeugt, die der FST ablehnt, produziert morphologisch ungültiges Cree – unabhängig davon, was der chrF++-Wert aussagt.

**Wichtige ALTLab-Ressourcen:**
- [itwêwina](https://itwewina.altlab.app/) — ein intelligentes Plains Cree–Englisch-Wörterbuch, das vom FST angetrieben wird
- [Morphodict](https://github.com/UAlbertaALTLab/morphodict) — eine quelloffene, morphologisch bewusste Wörterbuchplattform
- [crk-db](https://github.com/UAlbertaALTLab/crk-db) — lexikalische Datenbank für Plains Cree
- [21st Century Tools for Indigenous Languages](https://21c.tools/) — der breitere Projektkontext

### Globale FST- & morphologische Register

Plains Cree ist nicht die einzige Sprache mit einer hochwertigen FST-Infrastruktur. Wenn Sie Übersetzungs-Pipelines für andere ressourcenarme oder morphologisch komplexe Sprachen entwickeln möchten, können Sie auf diese etablierten globalen Zentren zurückgreifen:

* **[GiellaLT / Giellatekno](https://giellalt.github.io/) (UiT The Arctic University of Norway):** Das größte Repository für quelloffene morphologische FST-Analysatoren und -Generatoren, das über 100 Sprachen abdeckt. Zu den Schwerpunkten gehören samische Sprachen (`sme`, `smj`, `sma`, usw.), uralische Sprachen (Komi, Ersja, Udmurtisch, usw.) und andere Minderheiten-/indigene Sprachen. Sie hosten öffentliche, verarbeitete Textkorpora (`corpus-xxx`) in ihrer [GitHub-Organisation](https://github.com/giellalt/).
* **[The Apertium Project](https://www.apertium.org/):** Eine quelloffene, regelbasierte Plattform für maschinelle Übersetzung. Apertium pflegt hochoptimierte morphologische FST-Analysatoren (unter Verwendung von `lttoolbox` und `hfst`) sowie zweisprachige Wörterbücher für Dutzende von Sprachen, darunter eine große Auswahl an Turksprachen (Kasachisch, Tatarisch, Kirgisisch, usw.) und europäischen Minderheitensprachen. Alle Ressourcen sind öffentlich auf dem [GitHub von Apertium](https://github.com/apertium) zugänglich.
* **[UniMorph (Universal Morphology)](https://unimorph.github.io/):** Ein Gemeinschaftsprojekt, das standardisierte morphologische Paradigmen für über 150 Sprachen bereitstellt. Der Datensatz wird auf Hugging Face unter [unimorph/universal_morphologies](https://huggingface.co/datasets/unimorph/universal_morphologies) gehostet. Wenn für eine Sprache keine kompilierte FST-Binärdatei verfügbar ist, können UniMorph-Tabellen als statisches Datenbank-Lookup-Gate verwendet werden.
* **[National Research Council Canada (NRC)](https://nrc-digital-repository.canada.ca/):** Bietet Werkzeuge für kanadische indigene Sprachen an, darunter den morphologischen FST-Analysator **Uqailaut** für Inuktitut und das massive **Nunavut Hansard Parallel Corpus** (1,3 Millionen abgeglichene Englisch-Inuktitut-Satzpaare).

### Das EdTeKLA-Korpus

Die [EdTeKLA-Forschungsgruppe](https://spaces.facsci.ualberta.ca/edtekla/) (ebenfalls an der UAlberta) hat ein Plains-Cree-Sprachkorpus aus Lehrmaterialien, Audiotranskriptionen und Quellen der Gemeinschaft zusammengestellt. Der rosetta-Evaluierungsdatensatz [EDTeKLA Dev v1](/docs/eval/datasets) ist aus dieser Arbeit abgeleitet und unter [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) lizenziert.

### Andere Ansätze, die ausprobiert wurden oder ausprobiert werden könnten

Das Leaderboard ist methodenagnostisch. Hier sind Strategien, die für ressourcenarme MT untersucht oder vorgeschlagen wurden und von denen jede eingereicht werden könnte:

| Ansatz | Wie es funktioniert | Vorteile | Nachteile |
|----------|-------------|------|------|
| **Gecoachtes LLM-Prompting** | Injizieren von Grammatikregeln, Wörterbüchern und Beispielpaaren in den System-Prompt | Schnelle Iteration, kein Training erforderlich | Qualitätsgrenze durch das Basiswissen des LLMs limitiert |
| **Few-Shot-Prompting** | Einbeziehung verifizierter Übersetzungen als In-Context-Beispiele | Gut für einen konsistenten Stil | Kleines Kontextfenster; Beispiele dürfen NICHT aus den Evaluierungsdaten stammen |
| **FST-gesteuerte Pipeline** | LLM generiert → FST validiert → lehnt ab und wiederholt bei ungültiger Morphologie | Garantiert morphologische Gültigkeit | Erfordert FST-Infrastruktur; Wiederholungsschleifen erhöhen Latenz und Kosten |
| **Wörterbuch-Lookup + LLM** | Erzwingt bekannte Begriffe aus einem zweisprachigen Wörterbuch, lässt das LLM den Rest erledigen | Reduziert Halluzinationen bei bekannten Begriffen | Wörterbuchabdeckung ist immer unvollständig |
| **Feinabgestimmtes Modell (Fine-Tuning)** | Feinabstimmung eines offenen Modells (Llama, Mistral) mit parallelem Text – nur nicht mit den Evaluierungsdaten | Potenziell höchste Qualität | Erfordert paralleles Korpus (selten); teuer; Risiko der Überanpassung (Overfitting) |
| **Verkettete Modelle (Chained Models)** | Modell A generiert Rohübersetzung → Modell B übernimmt Post-Editing → Modell C bewertet | Kann die Stärken von Spezialisten kombinieren | Komplex; langsam; teuer |
| **Regelbasiert + LLM-Hybrid** | Verwendet linguistische Regeln für bekannte Muster, LLM für alles andere | Präzise dort, wo Regeln greifen | Erfordert tiefgreifende linguistische Expertise |
| **Rückübersetzungs-Augmentierung** | Generiert synthetische parallele Daten durch Übersetzung von Cree→Englisch und anschließendes Training in umgekehrter Richtung | Erweitert Trainingsdaten kostengünstig | Verstärkt bestehende Modellfehler |
| **Evolutionärer Ansatz** | Generiert Übersetzungs-Kandidaten, bewertet sie, mutiert die besten und wiederholt den Vorgang | Kann neuartige Lösungen entdecken; parallelisierbar | Rechenintensiv; benötigt eine gute Fitnessfunktion |
| **Partielle Übersetzung** | Manuelle Übersetzung einer repräsentativen Stichprobe, Nachweis, dass die Methode den Stil trifft, dann automatische Übersetzung des restlichen Volumens | Kombiniert menschliche Qualität mit maschineller Skalierung | Erfordert anfänglichen menschlichen Aufwand |
| **Manuelles JSON / Prüfungsbewertung** | Manuelle Erstellung einer Datensatz-JSON-Datei, um Schülerantworten in einer Sprachprüfung zu testen, oder Bewertung einer Reihe menschlicher Übersetzungen anhand eines Goldstandards | Kein ML erforderlich; funktioniert für Bildung und Qualitätssicherung | Skaliert nicht für fortlaufenden Übersetzungsbedarf |

### Es ist nur JSON

Die Evaluierungsumgebung nimmt JSON auf und gibt bewertetes JSON aus. Das [Datensatzformat](/docs/eval/datasets) ist einfach:

```json
{
  "entries": [
    { "index": 0, "source_text": "Hello", "target_expected": "tânisi" },
    { "index": 1, "source_text": "Thank you", "target_expected": "kinanâskomitin" }
  ]
}
```

Sie können dies von Hand erstellen. Sie können es aus einer Tabellenkalkulation exportieren. Sie können es aus einem Korpus generieren. Ein Sprachlehrer könnte es verwenden, um die Übersetzungen von Schülern zu bewerten. Eine Übersetzungsagentur könnte es nutzen, um Freiberufler zu benchmarken. Ein Forschungslabor könnte es verwenden, um Modellarchitekturen zu vergleichen. Der Evaluierungsumgebung ist es egal, woher das JSON stammt – sie bewertet es einfach.

Und da das Framework für die Produktivumgebung dieselbe Plugin-Schnittstelle verwendet, kann eine Methode, die in der Evaluierungsumgebung gut abschneidet, mit einer einzigen Konfigurationsänderung auf Ihrer Website bereitgestellt werden. **Beweisen Sie es und nutzen Sie es.**

Die Möglichkeiten sind wirklich endlos. **Wenn Sie eine Idee haben, setzen Sie sie um, führen Sie die Evaluierungsumgebung aus und reichen Sie Ihre Ergebnisse ein.**

---

## Wie rosetta ins Bild passt

rosetta stellt die Infrastrukturschicht bereit – Sie bringen die Methode mit.

### Das Coaching-System

Die `llm-coached`-Methode von rosetta ermöglicht es Ihnen, linguistisches Wissen direkt in den LLM-Prompt zu injizieren:

```json title=".rosetta/coaching/crk.json"
{
  "grammar_rules": [
    "Plains Cree is polysynthetic — a single word can express what English needs a full sentence for",
    "Animate/inanimate noun distinction affects verb conjugation, demonstratives, and pluralization",
    "Use SRO (Standard Roman Orthography) as the working script — syllabic conversion is handled by the deterministic converter",
    "Obviation: when two third-person referents appear, the less salient one takes obviative marking (-a suffix on nouns, -iyiwa on verbs)"
  ],
  "dictionary": {
    "home": "kīwēwin",
    "settings": "isi-nākatohkēwin",
    "search": "nānātawāpahtam",
    "welcome": "tānisi",
    "dashboard": "kīskinwahamākēwin-māsinahikan"
  },
  "style_notes": "Use formal register appropriate for educational and community contexts. Preserve English technical terms in parentheses when no Cree equivalent exists or is widely accepted."
}
```

Die Coaching-Daten werden in jeden LLM-Prompt für das `en:crk`-Paar injiziert, wodurch das Modell einen strukturierten linguistischen Kontext erhält, den es sonst nicht hätte. Siehe [Coaching-Daten](/docs/concepts/coaching-data) für die vollständige Spezifikation.

### Register

Das Register ist Teil des System-Prompts, der Tonfall, Formalität und orthografische Konventionen steuert. rosetta wird mit einem Plains-Cree-Register ausgeliefert:

```
nêhiyawêwin (Plains Cree). Use SRO (Standard Roman Orthography) as the working
script. Output will be converted to Syllabics via deterministic converter.
Professional register appropriate for educational and community contexts.
```

Sie können dies in Ihrer Konfiguration überschreiben, um mit verschiedenen Prompting-Strategien zu experimentieren:

```json title="i18n-rosetta.config.json"
{
  "languages": {
    "crk": {
      "register": "Casual Plains Cree (Y-dialect). Use SRO. Prefer everyday vocabulary over formal or archaic terms. Address the reader directly."
    }
  }
}
```

Unterschiedliche Register erzeugen unterschiedliche Übersetzungsstile – und unterschiedliche Punktzahlen auf dem Leaderboard. Jede Einreichung zeichnet das genaue Register und den verwendeten System-Prompt auf (als SHA-256-Hash in der [Run Card](/docs/eval/run-card)), sodass Experimente reproduzierbar sind.

### Schriftkonvertierung

Plains Cree wird in zwei Schriften geschrieben: **Standard Roman Orthography (SRO)** und **Canadian Aboriginal Syllabics** (kanadische indigene Silbenschrift). Die Pipeline von rosetta:

1. LLM übersetzt in SRO (lateinbasiert, womit LLMs besser umgehen können)
2. Quality Gate validiert die SRO-Ausgabe
3. Deterministischer Konverter transformiert SRO → Silbenschrift
4. Konvertierter Text wird auf die Festplatte geschrieben

Der Konverter verarbeitet alle SRO-Diakritika (ê, î, ô, â für lange Vokale) und ordnet sie den korrekten Silbenzeichen zu. Siehe [Schriftkonverter](/docs/concepts/script-converters) für technische Details.

### Die Evaluierungsschleife

Die [Evaluierungsumgebung](/docs/eval/harness) führt Ihre Methode gegen den Evaluierungsdatensatz aus und erstellt eine bewertete [Run Card](/docs/eval/run-card):

```bash
# Clone the harness
git clone https://github.com/gamedaysuits/gds-mt-eval-harness.git
cd gds-mt-eval-harness
pip install -e .

# Run a baseline experiment
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --model google/gemini-2.5-pro \
  --condition coached-v7

# Run with FST validation (if you have an FST binary)
python eval/baseline_experiment.py \
  --dataset data/edtekla-dev-v1.json \
  --fst-analyzer ./bin/crk-analyzer \
  --condition fst-gated-v1
```

Das `--condition`-Flag ist ein Label, das Sie wählen. Es erscheint auf dem Leaderboard, damit andere sehen können, welche Prompt-Strategie Sie verwendet haben. Die Evaluierungsumgebung zeichnet den vollständigen System-Prompt in der Run Card auf, sodass Ihr genauer Ansatz reproduzierbar ist.

:::tip Experimentieren Sie frei, reichen Sie Ihr Bestes ein
Die Evaluierungsumgebung ist für schnelle Iterationen konzipiert. Führen Sie Dutzende von Experimenten mit verschiedenen Modellen, Coaching-Daten, Registern und Bedingungen durch. Reichen Sie nur dann beim Leaderboard ein, wenn Sie etwas haben, auf das Sie stolz sind.
:::

---

## OCAP-Prinzipien

rosetta wurde entwickelt, um die indigene Datensouveränität zu unterstützen. Die [OCAP-Prinzipien](https://fnigc.ca/ocap-training/) (Ownership, Control, Access, Possession – Eigentum, Kontrolle, Zugang, Besitz) leiten unseren Ansatz für Sprachtechnologie für indigene Gemeinschaften:

| Prinzip | Wie rosetta es unterstützt |
|-----------|------------------------|
| **Eigentum (Ownership)** | Sprachgemeinschaften besitzen ihre linguistischen Daten. rosetta sendet niemals Daten nach Hause oder überträgt sie an unsere Server |
| **Kontrolle (Control)** | Die [API-Methode](/docs/guides/serving-a-method) ermöglicht es Gemeinschaften, ihre eigene Übersetzungs-Pipeline zu hosten – wir stellen die Schnittstelle bereit, sie kontrollieren die Implementierung |
| **Zugang (Access)** | Die Gemeinschaften entscheiden, wer ihre Methode nutzen darf. Die API kann durch Authentifizierung geschützt werden |
| **Besitz (Possession)** | Alle Übersetzungsdaten verbleiben im Dateisystem Ihres Projekts. Das [Provenienzsystem](/docs/concepts/security) verfolgt, woher jede Übersetzung stammt |

Die Plugin-Architektur bedeutet, dass eine Gemeinschaft eine Methode entwickeln kann, die heiliges oder eingeschränktes Wissen intern einbezieht, nur die Übersetzungs-API offenlegt und die volle Kontrolle über ihre linguistischen Ressourcen behält.

---

## Die Vision: Was als Nächstes kommt

Plains Cree ist das erste Ziel. Sobald die Pipeline validiert ist und die Gemeinschaft mit der Qualität zufrieden ist, kann dieselbe Architektur auf andere polysynthetische Sprachen mit FST-Infrastruktur ausgeweitet werden:

- **Andere Algonkin-Sprachen**: Woods Cree, Swampy Cree, Ojibwe, Blackfoot
- **Inuit-Sprachen**: Inuktitut, Inuinnaqtun (die ebenfalls Silbenschriften verwenden)
- **Andere Sprachfamilien**: Jede Sprache mit einem FST-Analysator kann die FST-gesteuerte Pipeline nutzen

Das Leaderboard ist auf Sprachpaare ausgerichtet. Wenn Sprachgemeinschaften neue Evaluierungsdatensätze beisteuern, werden automatisch neue Leaderboard-Kategorien eröffnet.

**Dies ist eine offene Einladung.** Wenn Sie mit einer ressourcenarmen Sprache arbeiten – als Forscher, Mitglied einer Gemeinschaft, Student oder einfach als jemand, dem das Thema am Herzen liegt – gibt Ihnen rosetta die Werkzeuge an die Hand, um etwas Reales zu erschaffen, es ehrlich zu messen und es mit der Welt zu teilen. Das [Method Leaderboard](/leaderboard) wartet auf Ihre Einreichung.

---

## Siehe auch

- **[Method Leaderboard](/leaderboard)** — reichen Sie Ihre Ergebnisse ein und sehen Sie, wie Methoden im Vergleich abschneiden
- **[MT-Evaluierung](/docs/eval/)** — was eine gute Methode ausmacht, was disqualifiziert wird
- **[Evaluierungsumgebung](/docs/eval/harness)** — wie man Experimente durchführt
- **[Evaluierungsdatensätze](/docs/eval/datasets)** — EDTeKLA Dev v1 und FLORES+
- **[Coaching-Daten](/docs/concepts/coaching-data)** — wie man linguistisches Wissen für das LLM strukturiert
- **[Schriftkonverter](/docs/concepts/script-converters)** — die SRO→Silbenschrift-Pipeline
- **[Bereitstellung einer Methode via API](/docs/guides/serving-a-method)** — Hosting von gemeinschaftskontrollierter Übersetzung
- **[ALTLab](https://altlab.artsrn.ualberta.ca/)** — das Alberta Language Technology Lab
- **[EdTeKLA](https://spaces.facsci.ualberta.ca/edtekla/)** — die Forschungsgruppe Educational Technology, Knowledge & Language
- **[itwêwina-Wörterbuch](https://itwewina.altlab.app/)** — FST-gestütztes Plains Cree–Englisch-Wörterbuch