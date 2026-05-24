---
sidebar_position: 7
title: "Soberanía de datos"
description: "Principios OCAP, CARE y de Soberanía de Datos Maorí para la traducción de lenguas indígenas. Por qué el consentimiento de la comunidad debe ser previo a la implementación."
---
# Soberanía de datos

La traducción automática para lenguas indígenas plantea preguntas que no existen para el francés o el japonés. ¿A quién pertenecen los datos de entrenamiento? ¿Quién controla cómo habla un modelo de lenguaje? ¿Quién decide si una traducción es lo suficientemente buena para publicarse?

**La respuesta siempre es la comunidad.**

rosetta está construida para respaldar esto. El método `api` mantiene todos los recursos lingüísticos del lado del servidor bajo el control de la comunidad. El sistema de plugins separa el método de la herramienta. Pero la herramienta no puede imponer la ética; esta página explica los principios que usted debe seguir.

---

## Principios OCAP®

**OCAP** (Propiedad, Control, Acceso, Posesión) es un conjunto de principios desarrollados por el [First Nations Information Governance Centre](https://fnigc.ca/ocap-training/) (FNIGC) que establecen cómo deben recopilarse, protegerse, usarse y compartirse los datos de las Primeras Naciones.

| Principio | Qué significa para la traducción |
|-----------|------------------------------|
| **Propiedad** | La comunidad es dueña de sus datos lingüísticos: diccionarios, gramáticas, textos paralelos, archivos de entrenamiento y cualquier traducción producida a partir de ellos. |
| **Control** | La comunidad controla cómo se usan sus datos lingüísticos, quién tiene acceso y qué métodos de traducción son aceptables. |
| **Acceso** | Los miembros de la comunidad tienen derecho a acceder y administrar sus propios recursos lingüísticos, independientemente de dónde estén almacenados. |
| **Posesión** | Los datos físicos (archivos de entrenamiento, diccionarios, pesos del modelo) deben residir en una infraestructura que la comunidad controle, no en una nube de terceros. |

### Qué significa OCAP en la práctica

- **No publique traducciones** de una lengua indígena sin la autorización explícita de la comunidad.
- **No entrene modelos** con datos lingüísticos proporcionados por la comunidad sin un acuerdo de intercambio de datos.
- **No extraiga (scrape)** recursos lingüísticos de la comunidad de sitios web, redes sociales o materiales educativos.
- **Use el método `api`** para que los prompts, los datos de entrenamiento y los diccionarios permanezcan en servidores controlados por la comunidad. El método `api` de rosetta es una "tubería tonta" (dumb pipe): envía claves y recibe traducciones. Toda la propiedad intelectual (IP) lingüística permanece del lado del servidor.
- **Documente la procedencia**: el campo `provenance` en el [manifiesto del plugin](/docs/reference/plugin-spec) debe enumerar cada recurso utilizado, su licencia y su origen.

:::warning OCAP® es una marca registrada
OCAP® es una marca registrada del First Nations Information Governance Centre. Se aplica específicamente a las Primeras Naciones en Canadá. Los principios tienen una relevancia más amplia, pero la marca registrada y la autoridad de gobernanza pertenecen al FNIGC.
:::

---

## Principios CARE

Los **Principios CARE para la Gobernanza de Datos Indígenas** fueron desarrollados por la [Global Indigenous Data Alliance](https://www.gida-global.org/care) (GIDA) como complemento a los principios de datos FAIR. FAIR establece que los datos deben ser Encontrables (Findable), Accesibles, Interoperables y Reutilizables. CARE establece que eso no es suficiente: la gobernanza de datos también debe centrarse en los derechos indígenas.

| Principio | Aplicación |
|-----------|------------|
| **Beneficio Colectivo** | Las herramientas de traducción deben beneficiar primero a la comunidad lingüística. Las puntuaciones en la tabla de clasificación (leaderboard) son un medio para mejorar los métodos, no para extraer valor comercial de las lenguas de la comunidad. |
| **Autoridad para Controlar** | Las comunidades tienen la autoridad para gobernar cómo se recopilan, usan y comparten sus datos lingüísticos. Una puntuación alta en la tabla de clasificación no otorga permiso para publicar traducciones. |
| **Responsabilidad** | Los investigadores y desarrolladores que trabajan con datos de lenguas indígenas tienen la responsabilidad de construir relaciones, obtener consentimiento y compartir los beneficios. |
| **Ética** | Los derechos y el bienestar de los pueblos indígenas deben ser la principal preocupación. Los métodos de traducción deben desarrollarse *con* las comunidades, no *sobre* ellas. |

---

## Te Mana Raraunga — Soberanía de Datos Maoríes

**Te Mana Raraunga** es la [Red de Soberanía de Datos Maoríes](https://www.temanararaunga.maori.nz/) (Māori Data Sovereignty Network). Afirma que los datos maoríes, incluidos los datos lingüísticos, son un taonga (tesoro) sujeto a los principios del Tratado de Waitangi y al tikanga Māori (derecho consuetudinario maorí).

Principios clave:

| Principio | Significado |
|-----------|---------|
| **Rangatiratanga** (Autoridad) | Los maoríes tienen el derecho inherente de ejercer autoridad sobre sus datos, incluidos los datos lingüísticos. |
| **Whakapapa** (Relaciones) | Los datos tienen orígenes y conexiones. Los datos lingüísticos conllevan las relaciones y el conocimiento de las personas que los crearon. |
| **Whanaungatanga** (Obligaciones) | Quienes poseen o procesan datos maoríes tienen obligaciones recíprocas con las comunidades de donde provienen. |
| **Kotahitanga** (Beneficio colectivo) | Los datos maoríes deben usarse para el beneficio colectivo de los maoríes. |
| **Manaakitanga** (Reciprocidad) | El uso de datos maoríes debe implicar cuidado, respeto y reciprocidad. |
| **Kaitiakitanga** (Tutela) | Los guardianes de los datos tienen el deber de proteger los datos y garantizar que se utilicen de manera adecuada. |

Estos principios se aplican al te reo Māori (el idioma maorí) y a cualquier trabajo computacional que involucre datos lingüísticos maoríes.

---

## Qué significa esto para los usuarios de rosetta

### Para idiomas estándar (francés, japonés, español...)

Use rosetta normalmente. Estos idiomas tienen corpus grandes y disponibles públicamente, API de traducción establecidas y no presentan problemas de soberanía. Traduzca, sincronice y publique como desee.

### Para lenguas indígenas y de bajos recursos

La situación es fundamentalmente diferente:

1. **Obtenga consentimiento primero.** Antes de construir un método de traducción para una lengua indígena, establezca una relación con la comunidad. Un método construido sin la participación de la comunidad, sin importar cuán técnicamente impresionante sea, no debe publicarse ni distribuirse.

2. **Use el método `api`.** Aloje el pipeline de traducción en una infraestructura controlada por la comunidad. El método `api` en rosetta está diseñado para esto: envía claves y recibe traducciones sin exponer los prompts, diccionarios o datos de entrenamiento que hacen que el método funcione.

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

3. **Documente todo.** Use el campo `provenance` en el manifiesto de su plugin para enumerar cada recurso, su licencia y si fue proporcionado con el consentimiento de la comunidad.

4. **Las puntuaciones no son licencias.** Una puntuación alta en la tabla de clasificación demuestra que un método funciona bien técnicamente. No otorga permiso para publicar traducciones, distribuir el plugin o comercializar el método. La comunidad decide.

5. **Comparta el método, no los datos.** Si desarrolla una técnica que funciona bien (por ejemplo, "FST-gated LLM with coached prompts"), comparta la *arquitectura* y el *enfoque* en la tabla de clasificación. La comunidad conserva el control sobre los datos lingüísticos que hacen que funcione para su idioma específico.

---

## El método `api` y la soberanía

El [método de traducción](/docs/guides/translation-methods) `api` existe específicamente para respaldar la soberanía de los datos. Esta es la razón:

| Aspecto | Otros métodos | Método `api` |
|--------|--------------|-------------|
| **Dónde residen los prompts** | En los archivos de configuración de rosetta (visibles para todos los desarrolladores) | En el servidor de la comunidad (privado) |
| **Dónde residen los datos de entrenamiento** | En el directorio `.rosetta/coaching/` (confirmado en git) | En el servidor de la comunidad (privado) |
| **Dónde residen los diccionarios** | En el directorio del plugin (distribuido con el plugin) | En el servidor de la comunidad (privado) |
| **Quién controla el pipeline** | Quien ejecute `rosetta sync` | La comunidad que opera la API |
| **Qué ve rosetta** | Todo | Claves de entrada, traducciones de salida |

El método `api` es una elección arquitectónica deliberada. Es una "tubería tonta" porque la propiedad intelectual (el conocimiento lingüístico, las reglas gramaticales, los ejemplos de entrenamiento cuidadosamente seleccionados) pertenece a la comunidad, no a la herramienta.

Consulte [Servir un método a través de una API](/docs/guides/serving-a-method) para obtener detalles de implementación.

---

## Lecturas adicionales

- [First Nations Information Governance Centre — OCAP®](https://fnigc.ca/ocap-training/)
- [Global Indigenous Data Alliance — Principios CARE](https://www.gida-global.org/care)
- [Te Mana Raraunga — Red de Soberanía de Datos Maoríes](https://www.temanararaunga.maori.nz/)
- [USIDSN — Red de Soberanía de Datos Indígenas de los Estados Unidos](https://usindigenousdata.org/)

---

## Ver también

- [Apoyar un idioma de bajos recursos](/docs/guides/low-resource-languages): la guía técnica con contexto OCAP
- [Métodos de traducción](/docs/guides/translation-methods): el método `api` y cómo protege la propiedad intelectual
- [Servir un método a través de una API](/docs/guides/serving-a-method): alojamiento de un pipeline controlado por la comunidad
- [Especificación de plugins](/docs/reference/plugin-spec): el campo `provenance` para la atribución de recursos
- [Recetario: Pipeline FST-Gated](/docs/tutorials/fst-gated-pipeline): construcción de un pipeline que una comunidad puede autoalojar