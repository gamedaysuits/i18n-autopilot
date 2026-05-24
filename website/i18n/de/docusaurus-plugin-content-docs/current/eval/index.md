---
sidebar_position: 1
title: "MT-Evaluierung"
---
# MT-Evaluierung

rosetta enthält ein Evaluierungs-Framework für maschinelle Übersetzung, das für das **reproduzierbare Benchmarking** von Übersetzungsmethoden entwickelt wurde — insbesondere für ressourcenarme und indigene Sprachen, für die keine standardmäßigen MT-Benchmarks existieren und bei denen Qualitätsbehauptungen schwer zu überprüfen sind.

---

## Die Bestenliste

Das Herzstück ist die **[Methoden-Bestenliste](/leaderboard)** — eine Live-Anzeigetafel mit Supabase-Anbindung, auf der Forscher und Community-Mitglieder Übersetzungsmethoden mit einer per Fingerabdruck versehenen, reproduzierbaren Evaluierung einreichen und vergleichen können.

Jede Einreichung umfasst:

- **Pipeline mit Fingerabdruck** — an einen spezifischen Git-Commit und Konfigurations-Hash gebunden, sodass die Ergebnisse exakt auf den Code zurückgeführt werden können, der sie erzeugt hat
- **Versionierter Datensatz** — mit Inhalts-Hash versehen und versioniert; Bewertungen sind nur innerhalb derselben Datensatzversion vergleichbar
- **Standardisierte Metriken** — alle Bewertungen werden durch die gemeinsame Evaluierungsumgebung berechnet, wodurch Implementierungsunterschiede eliminiert werden
- **Vertrauensstufen** — selbst bewertet (self-benchmarked), GDS-verifiziert oder durch die Community validiert
- **Kostenverfolgung** — API-Kosten pro Einreichung, sodass Kompromisse zwischen Kosten und Qualität transparent sind

Die Bestenliste erfasst derzeit drei Metriken:

| Metrik | Typ | Was sie misst |
|--------|------|------------------|
| **chrF++** | Zeichen-n-Gramm-F-Score | Primäre Qualitätsmetrik — korreliert gut mit menschlicher Beurteilung, insbesondere bei morphologisch reichen Sprachen |
| **Exact Match** | Anteil perfekter Übereinstimmungen | Strikte Genauigkeit — wie oft entspricht die Übersetzung exakt dem Goldstandard? |
| **FST Acceptance** | Morphologische Durchlassrate | Für Methoden mit Finite-State-Transducer-Verifizierung — welcher Anteil der Ausgaben ist morphologisch gültig? |

**[→ Zur Bestenliste](/leaderboard)**

---

## Verfügbare Datensätze

### EDTeKLA Development Set v1

Der erste Evaluierungsdatensatz, erstellt für die Übersetzung von Englisch→Plains Cree (SRO). Entwickelt von der [EdTeKLA-Forschungsgruppe](https://spaces.facsci.ualberta.ca/edtekla/) an der University of Alberta.

| Eigenschaft | Wert |
|----------|-------|
| **ID** | `edtekla-dev-v1` |
| **Sprachpaar** | EN → CRK (Plains Cree, SRO-Orthografie) |
| **Anzahl der Einträge** | 124 |
| **Lizenz** | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) |
| **Herkunft** | `gold_standard` (von Sprechern verifiziert), `textbook` (veröffentlichte Lehrmaterialien) |

### FLORES+ Devtest

Ein breit angelegter mehrsprachiger Benchmark, der von der [Open Language Data Initiative (OLDI)](https://huggingface.co/datasets/openlanguagedata/flores_plus) gepflegt wird.

| Eigenschaft | Wert |
|----------|-------|
| **Sprachpaare** | EN → 39 Sprachen (alle in rosetta registrierten Sprachen) |
| **Anzahl der Einträge** | 1.012 Sätze pro Sprache |
| **Lizenz** | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |
| **Quelle** | Ursprünglich Meta FLORES-200, jetzt von OLDI gepflegt |
| **Speicherort** | Vorab extrahierte Fixtures unter `test/benchmark/fixtures/` im Haupt-Repository von rosetta |

Siehe [Evaluierungsdatensätze](/docs/eval/datasets) für das vollständige Datensatzschema, die Schwierigkeitsstufen und Anleitungen zur Erstellung eigener Datensätze.

:::danger NICHT mit Evaluierungsdaten TRAINIEREN

**Diese Datensätze dienen ausschließlich der Evaluierung.** Methoden, die mit Evaluierungsdaten trainiert, feingetunt, per Few-Shot-Prompting angesteuert oder anderweitig diesen ausgesetzt wurden, erzeugen künstlich überhöhte Bewertungen und werden **von der Bestenliste disqualifiziert.**

Dies ist kein Vorschlag — es ist die wichtigste Regel für die Integrität der Evaluierung. Verwenden Sie separate Korpora für das Training. Evaluierungsdatensätze müssen für Ihr Modell während der Entwicklung unsichtbar bleiben.

Wenn Sie Coaching-Daten oder Few-Shot-Beispiele verwenden, müssen diese aus **völlig separaten Quellen** stammen. Im Zweifelsfall sollten Sie diese nicht einbeziehen.
:::

:::warning LLM-Nicht-Determinismus

LLM-Ausgaben sind nicht-deterministisch. Die Bewertungen stellen punktuelle Messungen unter spezifischen Modellversionen und API-Konfigurationen dar. Modellanbieter können Gewichte, Dekodierungsstrategien oder Sicherheitsfilter jederzeit aktualisieren, was zu Abweichungen der Bewertungen (Score Drift) zwischen den Durchläufen führen kann. Die Bestenliste zeichnet für jede Einreichung den genauen Modell-Slug und den Zeitstempel auf.
:::

---

## Was eine gute Methode ausmacht

Nicht alle Methoden sind gleichwertig. Hier erfahren Sie, was rigorose Arbeit von künstlich überhöhten Bewertungen unterscheidet.

### Merkmale einer starken Methode

- **Saubere Trennung von Trainings- und Evaluierungsdaten** — Ihre Methode hat den Evaluierungsdatensatz während der Entwicklung, des Tunings, des Prompt-Engineerings oder der Auswahl von Few-Shot-Beispielen nie gesehen
- **Reproduzierbar** — jemand anderes kann Ihr Repository klonen, die Evaluierungsumgebung ausführen und dieselben Bewertungen erhalten (innerhalb der Grenzen des LLM-Nicht-Determinismus)
- **Dokumentiert** — Ihre [Methodenkarte](/docs/eval/methods) beschreibt, was Ihre Methode tut, welche Werkzeuge sie verwendet und wo ihre Grenzen liegen
- **Ehrlich bezüglich des Anwendungsbereichs** — wenn Ihre Methode nur für ein Sprachpaar funktioniert, geben Sie dies an; wenn sie bei bestimmten morphologischen Mustern an Leistung verliert, dokumentieren Sie dies
- **Community-bewusst** — bei indigenen Sprachen respektiert Ihre Methode die Datensouveränität. Sie haben sich mit den Sprachgemeinschaften beraten oder ausschließlich offen lizenzierte Daten verwendet

### Warnsignale (was zur Disqualifikation führt)

| Warnsignal | Warum es ein Problem ist |
|----------|--------------------|
| Training mit Evaluierungsdaten | Verfehlt den Zweck der Evaluierung völlig. Überhöhte Bewertungen führen alle in die Irre. |
| Rosinenpickerei (Cherry-Picking) bei Ergebnissen | 10 Durchläufe ausführen und den besten einreichen, ohne die anderen offenzulegen |
| Nicht offengelegte Nachbearbeitung | Manuelles Korrigieren der Ausgaben vor der Bewertung |
| Kontaminierte Coaching-Daten | Verwendung von Beispielen aus dem Evaluierungsdatensatz als Few-Shot-Prompts oder Wörterbucheinträge |
| Behauptung der kommerziellen Marktreife ohne Herkunftsnachweis | Wenn Ihre Methode CC BY-NC-SA-Daten verwendet, ist sie nicht kommerziell nutzbar |

### Qualitätsstufen in der Bestenliste

Die Bestenliste unterstützt drei Vertrauensstufen:

| Stufe | Bedeutung | Wie man sie erreicht |
|------|---------|---------------|
| **Selbst bewertet** | Sie haben die Evaluierungsumgebung selbst ausgeführt und die Ergebnisse eingereicht | Eröffnen Sie einen PR mit Ihrer Run Card |
| **GDS-verifiziert** | Die rosetta-Maintainer haben Ihre Ergebnisse reproduziert | Reichen Sie Ihre Methode als installierbares Plugin ein |
| **Durch die Community validiert** | Unabhängige Community-Mitglieder haben die Ergebnisse reproduziert | Demnächst verfügbar |

---

## So reichen Sie ein

1. **Erstellen Sie Ihre Methode** — siehe [Erstellen einer Methode](/docs/eval/methods) für die Methodenschnittstelle
2. **Führen Sie die Evaluierungsumgebung aus** — siehe [Evaluierungsumgebung (Eval Harness)](/docs/eval/harness) für Einrichtung und Nutzung
3. **Generieren Sie eine Run Card** — die Evaluierungsumgebung erstellt eine JSON-Run-Card mit Ihren Bewertungen, dem Fingerabdruck und den Metadaten
4. **Eröffnen Sie einen PR** — reichen Sie Ihre Run Card im [Repository der Evaluierungsumgebung](https://github.com/gamedaysuits/gds-mt-eval-harness) ein
5. **Erscheinen Sie auf der Bestenliste** — sobald der PR gemergt wurde, erscheinen Ihre Ergebnisse auf der [Methoden-Bestenliste](/leaderboard)

---

## Zukünftige Entwicklungen

- **FLORES+-Modellvergleichsläufe** — systematische Evaluierung von Frontier-Modellen (GPT-5.5, Claude Opus 4.7, Gemini 3.1 Pro usw.) über alle 39 rosetta-Sprachen hinweg
- **Weitere Sprachpaare** — Quechua, Inuktitut und andere ressourcenarme Sprachen, sobald von der Community verifizierte Datensätze verfügbar werden
- **Datensatz-Import** — Werkzeuge zur Konvertierung externer Evaluierungsdatensätze (WMT, Tatoeba usw.) in das rosetta-Evaluierungsformat
- **Automatisierte erneute Durchläufe** — Erkennung von Modellversionsänderungen und erneute Ausführung von Benchmarks, um Abweichungen der Bewertungen (Score Drift) zu verfolgen

---

## Siehe auch

- **[Methoden-Bestenliste](/leaderboard)** — Live-Bewertungen und Einreichungen
- **[Evaluierungsumgebung (Eval Harness)](/docs/eval/harness)** — wie man Evaluierungen durchführt
- **[Evaluierungsdatensätze](/docs/eval/datasets)** — Datensatzformat und verfügbare Datensätze
- **[Erstellen einer Methode](/docs/eval/methods)** — die Spezifikation der Methodenschnittstelle
- **[Run-Card-Spezifikation](/docs/eval/run-card)** — das JSON-Schema der Run Card
- **[Unterstützung einer ressourcenarmen Sprache](/docs/guides/low-resource-languages)** — der breitere Kontext, warum dieses Framework existiert