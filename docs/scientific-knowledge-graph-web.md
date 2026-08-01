# Scientific Knowledge Graph documentaire — P3M-Web

## Périmètre

P3M-Web concerne exclusivement le socle de connaissance scientifique et éditoriale du site public Noxia. Le graphe prépare des projections vers les pages de concepts, synthèses de littérature, fiches techniques, comparaisons, glossaires, FAQ, arbres de navigation, données structurées, SEO et pages « état des connaissances ».

Le rapport d’audit destructif P3 reste l’entrée officielle. Il n’est ni régénéré ni remplacé par cette migration.

Les protocoles, équipements, workflows, Core Labs, études, datasets et algorithmes ne sont représentés ici que comme sujets documentaires sourcés. Aucun objet ne pilote un examen, un PACS, une affectation, un viewer, une cohorte interne, un entraînement, un contrôle qualité métier ou une recommandation clinique.

## Architecture

Le modèle sépare huit niveaux :

1. `ConceptIdentity` conserve l’identité stable d’un sujet.
2. `EntityRevision` conserve une représentation versionnée, avec les inconnues explicites.
3. `ScientificAssertionIdentity` identifie une proposition scientifique indépendamment de sa rédaction ou de son statut.
4. `ScientificAssertionRevision` porte une conclusion typée et contextualisée.
5. `SourceIdentity` et `SourceRevision` décrivent les documents, versions et localisateurs.
6. `EvidenceLink` relie une révision de source à une révision d’assertion sans confondre mention, soutien, réfutation ou qualification.
7. `ApplicabilityContext` exprime les conditions de population, modalité, séquence, méthode, constructeur, modèle, champ et logiciel.
8. La synthèse structurée dérive une vue déterministe des assertions, preuves, contradictions, limites, consensus explicites, questions ouvertes et données manquantes.

Une relation historique `PART_OF`, `USES`, `DOCUMENTS` ou `SUPPORTS` n’est jamais promue automatiquement en vérité scientifique.

## Identités et révisions

Les 118 `entityId` historiques sont préservés comme `stableId`. Chaque concept reçoit une révision initiale distincte. Les identifiants de relations v2 utilisent les deux identités namespacées complètes, le type de relation, la version d’algorithme et un discriminateur optionnel. La table `relation-id-migrations.json` conserve les 93 correspondances et le résolveur accepte anciens et nouveaux identifiants.

Les périodes de validité, successions, corrections et rétractions sont portées par les révisions concernées. Une valeur absente reste `null`, `UNKNOWN`, `UNRESOLVED`, `UNSOURCED` ou `NOT_APPLICABLE`.

## Assertions et preuves

Les conclusions peuvent viser une entité, une valeur littérale, une quantité, une applicabilité, une compatibilité documentaire, une recommandation citée ou une négation. L’objet entité n’est pas obligatoire pour une valeur, une formule ou un énoncé normatif.

Les dimensions `EvidenceSourceType`, `EvidenceQuality`, `ScientificMaturity` et `DocumentStatus` restent indépendantes. Le type documentaire ne détermine jamais automatiquement la qualité. Les liens de preuve acceptent `SUPPORTS`, `REFUTES`, `QUALIFIES`, `MENTIONS`, `DERIVES`, `CORRECTS`, `RETRACTS` et `UNRESOLVED_EVIDENCE_LINK`.

La migration historique crée zéro assertion et zéro lien de preuve : le dépôt ne contient pas encore de localisateurs et de revues suffisants pour promouvoir honnêtement les relations existantes.

## Contextes scientifiques

Les dimensions acceptent une valeur exacte, `ANY_OF`, `ALL_OF`, une exclusion, une plage, une condition, un état inconnu ou non applicable. Le modèle sait donc représenter une assertion limitée à une population, une pathologie, une modalité, une séquence, une méthode, un champ, un constructeur, un modèle, une version logicielle, un protocole décrit, une étude ou une temporalité.

L’existence de la capacité de représentation ne signifie jamais que les données sont présentes. Les cas IRM/ECV et CT/ECV sont modélisables, mais les méthodes, champs, plateformes et preuves absents restent déclarés comme lacunes.

## Mesures et biomarqueurs

Les contrats documentaires distinguent définition de mesure, méthode, observation, mesure dérivée, seuil et plage de référence. Ils peuvent porter quantité, unité, formule, entrées, séquence, protocole décrit, temporalité, incertitude, précision, répétabilité, reproductibilité, biais, normalisation, statut qualité et sources.

Les 13 profils historiques sont préservés. Les tableaux vides de preuves ou de limitations ne sont plus interprétés comme une complétude. Toute requalification entre biomarqueur, mesure, méthode, finding, endpoint ou propriété biologique reste différée lorsqu’elle n’est pas démontrée.

## Objets documentaires légers

- `ProtocolConcept` et `ProtocolDescriptionRevision` décrivent des paramètres publiés, variantes et différences multicentriques ; ils n’exécutent ni fallback ni configuration d’examen.
- `Manufacturer`, `ProductFamily`, `EquipmentModel`, `EquipmentGeneration`, `SoftwarePlatform`, `SoftwareVersion` et `CapabilityStatement` décrivent des plateformes et limites sourcées ; aucune instance installée ou licence produit n’existe.
- `WorkflowConcept`, `WorkflowDescriptionRevision`, `CoreLabConcept` et `CoreLabDescriptionRevision` décrivent des étapes, rôles, méthodes et contrôles publiés ; aucune transition applicative, affectation ou adjudication exécutable n’existe.
- `Study`, `Dataset` et `Algorithm` décrivent des cohortes, versions et métriques publiées ; aucune gestion de données internes, consentement projet, entraînement ou modèle déployé n’existe.
- `RecommendationDocument` conserve texte, émetteur, population, grade, date et source ; il ne devient pas une règle clinique.

## Terminologies et standards

`ConceptDesignation` conserve les libellés préférés, synonymes, abréviations, traductions, anciens noms et acronymes contextualisés. Une chaîne peut désigner plusieurs concepts ; langue, locale, type et contexte servent à la résolution. Les identifiants DICOM, SNOMED CT, RadLex, LOINC, MeSH et ICD restent optionnels et ne sont ajoutés qu’avec une source.

DICOM est représentable comme standard, partie, édition, profil, SOP Class, syntaxe de transfert et déclaration documentaire de conformité. L’ancien raccourci `Format COMPATIBLE_WITH Standard` est conservé dans l’historique mais exclu de la projection active.

## Complétude et projections

La complétude est évaluée séparément pour `CATALOG`, `EDITORIAL`, `SCIENTIFIC`, `COMPARISON`, `GLOSSARY`, `NAVIGATION`, `SEO` et `KNOWLEDGE_STATE`. Une fiche peut être exploitable dans le catalogue tout en étant insuffisante pour une synthèse scientifique.

Le schéma est prêt pour les projections web, mais les projections scientifiques publiques restent bloquées jusqu’à l’ajout d’assertions revues, de sources précises et d’une validation éditoriale. Aucun texte, consensus, méta-analyse, balise SEO ou page n’est généré par la migration.

## Synthèses structurées

Le moteur retourne les assertions applicables, favorables et défavorables, qualifications, sources, dimensions de preuve, contextes, limitations, contradictions, consensus soumis à une règle explicite, questions ouvertes, historique, confiance globale et données manquantes. Il produit une synthèse structurée de littérature, jamais une méta-analyse statistique sans effets, variances, populations et méthode adaptée.

## Rollback

Le snapshot v1, les registres historiques et tous les anciens identifiants restent lisibles. Pour revenir logiquement à l’état précédent, il suffit de cesser de consommer la projection v2-web et de relire le snapshot ou les registres v1 ; aucune réécriture inverse n’est nécessaire.
