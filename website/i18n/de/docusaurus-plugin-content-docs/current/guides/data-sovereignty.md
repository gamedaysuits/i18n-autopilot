---
sidebar_position: 7
title: "Datensouveränität"
description: "Prinzipien von OCAP, CARE und Māori Data Sovereignty für die Übersetzung indigener Sprachen. Warum die Zustimmung der Gemeinschaft vor dem Einsatz erfolgen muss."
---
# Datensouveränität

Maschinelle Übersetzung für indigene Sprachen wirft Fragen auf, die bei Französisch oder Japanisch nicht existieren. Wem gehören die Trainingsdaten? Wer kontrolliert, wie ein Sprachmodell spricht? Wer entscheidet, ob eine Übersetzung gut genug ist, um veröffentlicht zu werden?

**Die Antwort lautet immer: die Gemeinschaft.**

rosetta wurde entwickelt, um dies zu unterstützen. Die `api`-Methode hält alle linguistischen Ressourcen serverseitig unter der Kontrolle der Gemeinschaft. Das Plugin-System trennt die Methode vom Werkzeug. Aber das Werkzeug kann keine Ethik erzwingen — diese Seite erklärt die Prinzipien, die Sie befolgen sollten.

---

## OCAP®-Prinzipien

**OCAP** (Ownership, Control, Access, Possession) ist ein vom [First Nations Information Governance Centre](https://fnigc.ca/ocap-training/) (FNIGC) entwickeltes Regelwerk, das festlegt, wie Daten der First Nations erhoben, geschützt, genutzt und geteilt werden sollen.

| Prinzip | Was dies für die Übersetzung bedeutet |
|-----------|------------------------------|
| **Ownership** (Eigentum) | Die Gemeinschaft ist Eigentümerin ihrer linguistischen Daten — Wörterbücher, Grammatiken, Paralleltexte, Coaching-Dateien und aller daraus erstellten Übersetzungen. |
| **Control** (Kontrolle) | Die Gemeinschaft kontrolliert, wie ihre Sprachdaten verwendet werden, wer Zugang hat und welche Übersetzungsmethoden akzeptabel sind. |
| **Access** (Zugang) | Mitglieder der Gemeinschaft haben das Recht, auf ihre eigenen Sprachressourcen zuzugreifen und diese zu verwalten, unabhängig davon, wo sie gespeichert sind. |
| **Possession** (Besitz) | Die physischen Daten (Coaching-Dateien, Wörterbücher, Modellgewichte) müssen sich auf einer Infrastruktur befinden, die von der Gemeinschaft kontrolliert wird — nicht in der Cloud eines Drittanbieters. |

### Was OCAP in der Praxis bedeutet

- **Veröffentlichen Sie keine Übersetzungen** einer indigenen Sprache ohne ausdrückliche Genehmigung der Gemeinschaft.
- **Trainieren Sie keine Modelle** mit von der Gemeinschaft bereitgestellten linguistischen Daten ohne eine Datenaustauschvereinbarung.
- **Greifen Sie Sprachressourcen der Gemeinschaft nicht automatisiert ab** (Scraping) von Websites, sozialen Medien oder Bildungsmaterialien.
- **Verwenden Sie die `api`-Methode**, damit Prompts, Coaching-Daten und Wörterbücher auf Servern bleiben, die von der Gemeinschaft kontrolliert werden. Die `api`-Methode von rosetta ist ein reiner Datenkanal (Dumb Pipe) — sie sendet Schlüssel hinaus und erhält Übersetzungen zurück. Das gesamte linguistische geistige Eigentum (IP) verbleibt serverseitig.
- **Dokumentieren Sie die Herkunft** — das Feld `provenance` im [Plugin-Manifest](/docs/reference/plugin-spec) sollte jede verwendete Ressource, ihre Lizenz und ihre Herkunft auflisten.

:::warning OCAP® ist eine eingetragene Marke
OCAP® ist eine eingetragene Marke des First Nations Information Governance Centre. Sie gilt spezifisch für First Nations in Kanada. Die Prinzipien haben eine breitere Relevanz, aber die Marke und die Governance-Autorität gehören dem FNIGC.
:::

---

## CARE-Prinzipien

Die **CARE-Prinzipien für indigene Daten-Governance** wurden von der [Global Indigenous Data Alliance](https://www.gida-global.org/care) (GIDA) als Ergänzung zu den FAIR-Datenprinzipien entwickelt. FAIR besagt, dass Daten auffindbar (Findable), zugänglich (Accessible), interoperabel (Interoperable) und wiederverwendbar (Reusable) sein sollten. CARE besagt, dass dies nicht ausreicht — die Daten-Governance muss auch indigene Rechte in den Mittelpunkt stellen.

| Prinzip | Anwendung |
|-----------|------------|
| **Collective Benefit** (Kollektiver Nutzen) | Übersetzungswerkzeuge sollten in erster Linie der Sprachgemeinschaft zugutekommen. Ergebnisse auf der Rangliste sind ein Mittel zur Verbesserung von Methoden, nicht zur Abschöpfung kommerziellen Wertes aus den Sprachen der Gemeinschaft. |
| **Authority to Control** (Kontrollbefugnis) | Gemeinschaften haben die Befugnis zu bestimmen, wie ihre Sprachdaten erhoben, verwendet und geteilt werden. Ein hohes Ergebnis auf der Rangliste erteilt keine Erlaubnis zur Veröffentlichung von Übersetzungen. |
| **Responsibility** (Verantwortung) | Forscher und Entwickler, die mit indigenen Sprachdaten arbeiten, tragen die Verantwortung, Beziehungen aufzubauen, Zustimmungen einzuholen und den Nutzen zu teilen. |
| **Ethics** (Ethik) | Die Rechte und das Wohlergehen indigener Völker müssen das primäre Anliegen sein. Übersetzungsmethoden sollten *mit* den Gemeinschaften entwickelt werden, nicht *über* sie. |

---

## Te Mana Raraunga — Māori-Datensouveränität

**Te Mana Raraunga** ist das [Māori Data Sovereignty Network](https://www.temanararaunga.maori.nz/). Es macht geltend, dass Māori-Daten — einschließlich Sprachdaten — ein Taonga (Schatz) sind, das den Prinzipien des Vertrags von Waitangi und dem Tikanga Māori (Māori-Gewohnheitsrecht) unterliegt.

Wichtige Prinzipien:

| Prinzip | Bedeutung |
|-----------|---------|
| **Rangatiratanga** (Autorität) | Māori haben ein inhärentes Recht, Autorität über ihre Daten, einschließlich Sprachdaten, auszuüben. |
| **Whakapapa** (Beziehungen) | Daten haben Ursprünge und Verbindungen. Sprachdaten tragen die Beziehungen und das Wissen der Menschen in sich, die sie geschaffen haben. |
| **Whanaungatanga** (Verpflichtungen) | Diejenigen, die Māori-Daten aufbewahren oder verarbeiten, haben gegenseitige Verpflichtungen gegenüber den Gemeinschaften, aus denen sie stammen. |
| **Kotahitanga** (Kollektiver Nutzen) | Māori-Daten sollten zum kollektiven Nutzen der Māori verwendet werden. |
| **Manaakitanga** (Gegenseitigkeit) | Die Nutzung von Māori-Daten sollte mit Sorgfalt, Respekt und Gegenseitigkeit einhergehen. |
| **Kaitiakitanga** (Wächterschaft) | Datenwächter haben die Pflicht, die Daten zu schützen und sicherzustellen, dass sie angemessen verwendet werden. |

Diese Prinzipien gelten für Te Reo Māori (die Māori-Sprache) und für jegliche computergestützte Arbeit, die Māori-Sprachdaten einbezieht.

---

## Was dies für Benutzer von rosetta bedeutet

### Für Standardsprachen (Französisch, Japanisch, Spanisch...)

Verwenden Sie rosetta wie gewohnt. Diese Sprachen verfügen über große, öffentlich zugängliche Korpora, etablierte Übersetzungs-APIs und keine Souveränitätsbedenken. Übersetzen, synchronisieren und veröffentlichen Sie nach Belieben.

### Für indigene und ressourcenarme Sprachen

Die Situation ist grundlegend anders:

1. **Holen Sie zuerst die Zustimmung ein.** Bevor Sie eine Übersetzungsmethode für eine indigene Sprache entwickeln, bauen Sie eine Beziehung zur Gemeinschaft auf. Eine Methode, die ohne Beteiligung der Gemeinschaft entwickelt wurde — egal wie technisch beeindruckend sie ist —, sollte nicht veröffentlicht oder verbreitet werden.

2. **Verwenden Sie die `api`-Methode.** Betreiben Sie die Übersetzungs-Pipeline auf einer von der Gemeinschaft kontrollierten Infrastruktur. Die `api`-Methode in rosetta ist genau dafür konzipiert: Sie sendet Schlüssel und erhält Übersetzungen zurück, ohne die Prompts, Wörterbücher oder Coaching-Daten preiszugeben, die die Methode funktionsfähig machen.

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

3. **Dokumentieren Sie alles.** Verwenden Sie das Feld `provenance` in Ihrem Plugin-Manifest, um jede Ressource, ihre Lizenz und die Information auflisten, ob sie mit Zustimmung der Gemeinschaft bereitgestellt wurde.

4. **Ergebnisse sind keine Lizenzen.** Ein hohes Ergebnis auf der Rangliste beweist, dass eine Methode technisch gut funktioniert. Es erteilt keine Erlaubnis, Übersetzungen zu veröffentlichen, das Plugin zu verbreiten oder die Methode zu kommerzialisieren. Die Gemeinschaft entscheidet.

5. **Teilen Sie die Methode, nicht die Daten.** Wenn Sie eine Technik entwickeln, die gut funktioniert (z. B. „FST-gated LLM mit gecoachten Prompts“), teilen Sie die *Architektur* und den *Ansatz* auf der Rangliste. Die Gemeinschaft behält die Kontrolle über die linguistischen Daten, die dafür sorgen, dass sie für ihre spezifische Sprache funktioniert.

---

## Die `api`-Methode und Souveränität

Die `api`-[Übersetzungsmethode](/docs/guides/translation-methods) existiert speziell zur Unterstützung der Datensouveränität. Hier ist der Grund dafür:

| Aspekt | Andere Methoden | `api`-Methode |
|--------|--------------|-------------|
| **Wo sich Prompts befinden** | In den Konfigurationsdateien von rosetta (für alle Entwickler sichtbar) | Auf dem Server der Gemeinschaft (privat) |
| **Wo sich Coaching-Daten befinden** | Im Verzeichnis `.rosetta/coaching/` (in Git versioniert) | Auf dem Server der Gemeinschaft (privat) |
| **Wo sich Wörterbücher befinden** | Im Plugin-Verzeichnis (wird mit dem Plugin verteilt) | Auf dem Server der Gemeinschaft (privat) |
| **Wer die Pipeline kontrolliert** | Wer auch immer `rosetta sync` ausführt | Die Gemeinschaft, die die API betreibt |
| **Was rosetta sieht** | Alles | Schlüssel hinein, Übersetzungen heraus |

Die `api`-Methode ist eine bewusste architektonische Entscheidung. Sie ist ein reiner Datenkanal, weil das geistige Eigentum — das linguistische Wissen, die Grammatikregeln, die sorgfältig kuratierten Coaching-Beispiele — der Gemeinschaft gehört, nicht dem Werkzeug.

Siehe [Bereitstellen einer Methode über eine API](/docs/guides/serving-a-method) für Implementierungsdetails.

---

## Weiterführende Literatur

- [First Nations Information Governance Centre — OCAP®](https://fnigc.ca/ocap-training/)
- [Global Indigenous Data Alliance — CARE-Prinzipien](https://www.gida-global.org/care)
- [Te Mana Raraunga — Māori Data Sovereignty Network](https://www.temanararaunga.maori.nz/)
- [USIDSN — United States Indigenous Data Sovereignty Network](https://usindigenousdata.org/)

---

## Siehe auch

- [Unterstützung einer ressourcenarmen Sprache](/docs/guides/low-resource-languages) — der technische Leitfaden mit OCAP-Kontext
- [Übersetzungsmethoden](/docs/guides/translation-methods) — die `api`-Methode und wie sie geistiges Eigentum schützt
- [Bereitstellen einer Methode über eine API](/docs/guides/serving-a-method) — Hosting einer von der Gemeinschaft kontrollierten Pipeline
- [Plugin-Spezifikation](/docs/reference/plugin-spec) — das Feld `provenance` zur Ressourcenzuordnung
- [Kochbuch: FST-Gated Pipeline](/docs/tutorials/fst-gated-pipeline) — Aufbau einer Pipeline, die eine Gemeinschaft selbst betreiben kann