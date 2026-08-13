# PD-003 V2 — Ownership Matrix

## Matrice normative des autorités, contributions, consommations et non-promotions

| Champ | Valeur |
|---|---|
| Document | Annexe normative de PD-003 V2 |
| Version | 2.0 |
| État | OFFICIAL — avec limitations explicites |
| Date d'effet documentaire | 12 août 2026 |
| Source de vérité | `docs/pd-003-v2-research-object-model.md` |

## 1. Objet de la matrice

Cette matrice attribue un **owner sémantique** à chaque famille d'objets. L'owner décide la définition, les invariants, le cycle de vie et les changements de sens. Un contributeur peut proposer ou enrichir. Un consommateur peut référencer ou projeter. Aucun de ces actes ne transfère l'ownership.

Cette séparation est nécessaire pour éviter quatre confusions : connaissance générale et choix de projet ; définition de mesure et valeur observée ; variable canonique et occurrence ; calcul et interprétation humaine.

## 2. Règles transversales d'ownership

1. **Une identité a un owner sémantique unique à un instant donné.** Plusieurs owners concurrents rendraient la définition non déterministe.
2. **Une contribution ne vaut pas adoption.** Toute proposition conserve auteur, mandat, date, statut et décision humaine attendue.
3. **Une référence ne vaut pas copie.** Le consommateur conserve l'identité canonique et la version référencée.
4. **Une projection ne vaut pas promotion.** Un affichage, un document, un template ou un rapport ne devient jamais la source de vérité de l'objet projeté.
5. **Un handoff transmet un paquet typé, pas l'ownership.** Le destinataire peut adopter un nouvel objet dont il est owner ; il ne réécrit pas l'objet amont.
6. **La provenance technique ne remplace pas l'autorité scientifique.** Le système producteur d'une valeur n'est pas l'owner de la définition scientifique de la variable.
7. **Toute décision scientifique engageante reste humaine.** Un moteur peut produire options, diagnostics, preuves ou résultats ; il ne fabrique ni adoption, ni exclusion, ni interprétation engageante.
8. **Une correction crée une nouvelle version ou une supersession traçable.** L'écrasement détruirait la reproductibilité.

## 3. Objets et constructions introduits ou requalifiés en V2

| Construction | Classe V2 | Owner sémantique | Contributeurs autorisés | Consommateurs principaux | Handoff canonique | Promotion interdite |
|---|---|---|---|---|---|---|
| ScientificModel | OBJECT | Gouvernance Scientific Models ; adoption contextuelle par ResearchProject | Knowledge, Scientific Thinking, experts humains | OBS, Imaging, ResearchProject, Biostatistics | modèle versionné + assertions + alternatives + limites | hypothèse, graphe Knowledge ou texte généré → modèle adopté |
| ObservableProperty | OBJECT | OBS, sous gouvernance scientifique transversale | Knowledge, domaines de mesure, experts | MeasurementDefinition, BiomarkerRole, ResearchProject | propriété + domaine de validité + gaps | phénomène, phénotype ou donnée disponible → propriété validée |
| MeasurementDefinition | OBJECT | OBS ; spécialisation par le domaine compétent | Imaging, biologie, clinique, laboratoire, dispositifs | DataNeed, CanonicalVariable, acquisition, lecture | définition + méthode + unité + conditions + limites | modalité disponible → définition valide ; définition → choix de projet |
| BiomarkerRole | ROLE | Gouvernance scientifique du rôle ; décision d'adoption par ResearchProject | OBS, Knowledge, experts, domaines | ResearchProject, Study Design, analyses | rôle contextualisé + preuves + limites + statut | propriété mesurable → biomarqueur ; biomarqueur V1 → rôle V2 automatique |
| DataNeed | OBJECT | ResearchProject / Study Design | Scientific Thinking, OBS, domaines, Data Management | variables, acquisitions, sources, analyses | besoin motivé + couverture attendue + refus | information disponible → besoin scientifique ; source → besoin |
| CanonicalVariable | SPECIALIZATION de Variable | ResearchProject / Study Design | Data Management, Biostatistics, OBS, domaines | CRF, data dictionary, SAP, documents | identité canonique + définition + DataNeed + temporalité | champ CRF ou colonne → variable canonique |
| TemporalAnchor | VALUE_OBJECT | Owner de l'objet qui le porte, selon vocabulaire temporel gouverné | Study Design, domaines | occasions, occurrences, analyses | ancre + référentiel + tolérance + fuseau/calendrier si pertinent | date brute → sens temporel |
| ExpectedVariableOccasion | RELATION / SUBRESOURCE | ResearchProject / Study Design | Data Management, domaines | CRF, contrôles, analyses | variable + ancre + fenêtre + caractère attendu | visite générique → occasion de chaque variable |
| VariableOccurrence | OBJECT | ResearchProject pour le sens ; système source pour la production ; futur CDM pour représentation canonique, provenance et lignage ; Data Management pour conservation, transformation et qualité | sites, dispositifs, laboratoires, dérivations autorisées | analyses, contrôle qualité, documents autorisés | valeur/statut + sujet/unité + variable/version + occasion + source + lignage | valeur → définition ; présence → validité ; absence → valeur négative |
| StudyDataSource | SUBRESOURCE | ResearchProject pour l'usage ; owner externe conservé pour la source | Data Management, sites, systèmes | occurrences, contrôles, analyses | référence externe + période/version + mandat + provenance + accès | source référencée → objet NOXIA autonome ; accès → autorité |
| Biospecimen | OBJECT | Domaine Biospecimen / Biobanking ; ResearchProject adopte l'usage | sites, laboratoires, Data Management | MeasurementDefinition, occurrences, analyses | identité matérielle + sujet + type + prélèvement + conservation + chaîne de garde | mesure → échantillon ; aliquote → prélèvement sans relation explicite |
| AnalysisSpecification | SPECIALIZATION d'Analyse | Biostatistics ou domaine analytique compétent ; adoption humaine par ResearchProject | Scientific Thinking, Data Management, domaines | AnalysisExecution, documents, validation | question + entrées + méthode + populations + sorties + règles | texte SAP → spécification admise ; exécution → modification de la spécification |
| AnalysisExecution | SUBRESOURCE | Processus analytique sous mandat de l'AnalysisSpecification | systèmes de calcul, analystes | AnalysisResult, audit | version de spécification + entrées figées + environnement + logs | succès technique → validité scientifique |
| AnalysisResult | OBJECT | Domaine analytique compétent ; ResearchProject adopte l'usage interprétatif | AnalysisExecution, analystes | interprétation, documents, validation | résultat + exécution + entrées + incertitude + limites | sortie de calcul → décision ou interprétation |
| ScientificInterpretation | COMPOSITION contrôlée | Décideur humain mandaté | résultats, règles d'interprétation, preuves, Scientific Thinking | ResearchProject, documents, validation | résultat + règle + justification + décision humaine | résultat, seuil ou recommandation moteur → conclusion humaine |
| TerminologyMapping | RELATION | Owner de l'identité NOXIA, avec gouvernance terminologique | domaines, Data Management, REG | échanges, documents, validation | source/version + cible/version + équivalence + contexte + exclusions | même libellé → équivalence ; code externe → identité NOXIA |

## 4. Continuités V1 par famille

| Famille V1/V2 | Owner conservé ou clarifié | Contributions | Règle de handoff | Non-promotion structurante |
|---|---|---|---|---|
| Projet : ResearchProject, Acteur, Mandat, Situation, Intention, Contexte, Stratégie, Version, Contribution | ResearchProject et gouvernance humaine du projet | moteurs spécialisés, acteurs mandatés | les contributions restent signées et statutées | contribution → décision ; contexte → vérité générale |
| Cadrage scientifique : Question, Objectif, Hypothèse | Scientific Thinking pour la construction ; ResearchProject pour l'adoption | Knowledge, domaines, humains | options et objections précèdent l'adoption | hypothèse → ScientificModel ; recommandation → décision |
| Domaine : Pathologie, Anatomie, Population, Phénotype, Phénomène biologique | Knowledge pour les concepts ; ResearchProject pour l'usage contextuel | programmes scientifiques, experts | références versionnées et domaines de validité | concept général → fait du projet ; phénomène → ObservableProperty |
| Design : Plan d'étude, Groupe, Visite/temps, Intervention/exposition | ResearchProject / Study Design | Scientific Thinking, Data Management, domaines | design adopté transmis comme contraintes explicites | schéma suggéré → plan adopté ; visite → occurrence |
| Mesure : Biomarqueur legacy, Variable, Endpoint | rôle biomarqueur V2 gouverné séparément ; variables/endpoints par ResearchProject | OBS, Data Management, Biostatistics | mapping explicite des identités V1 | biomarqueur V1 → propriété/rôle ; endpoint → résultat |
| Imagerie et mesure spécialisée : Modalité, Acquisition, Séquence/technique, Paramètre critique, Condition, Protocole d'imagerie, Site/environnement, Contrainte, Harmonisation, QC, Lecture | Imaging ou domaine de mesure compétent, dans les limites de RDE-003 | OBS, ResearchProject, sites | MeasurementDefinition en amont ; choix de projet en aval | modalité → preuve ; acquisition → valeur ; lecture → interprétation automatique |
| Analyse : Analyse, Dimensionnement, Règle d'interprétation | Biostatistics ou domaine analytique ; décision humaine pour l'interprétation | Data Management, Scientific Thinking, experts | spécification, exécution, résultat et interprétation restent séparés | résultat → conclusion ; faisabilité → validité |
| Adaptation : Information projet, Besoin d'information, Échange, Option, Recommandation, Décision, Justification, Trade-off, Dépendance, Incertitude, Risque, Biais, Limite, Contradiction, Alerte, Revue, Impact, Événement d'évolution | ResearchProject ; owners spécialisés conservent leurs diagnostics | tous moteurs dans leur mandat | enveloppe de décision humaine obligatoire | recommandation → action ; diagnostic → mutation silencieuse |
| Knowledge : Connaissance, Relation scientifique, Domaine de validité, Source, Preuve, Synthèse, Controverse, État effectif, Règle méthodologique | Knowledge | programmes, experts, littérature qualifiée | paquet de connaissance versionné, daté et sourcé | contenu trouvé → preuve admise ; synthèse → résultat de projet |
| Projection : Profil, Projection, Rapport scientifique | owner de l'objet source ; DOC/DOC-002 possèdent seulement la projection | tous domaines via contrats | projection référencée, reproductible et datée | document → source de vérité ; omission d'affichage → absence métier |

## 5. Handoffs obligatoires

| Émetteur | Destinataire | Paquet minimal | Décision du destinataire | Ce qui reste chez l'émetteur |
|---|---|---|---|---|
| Knowledge | Scientific Models | assertions, relations, preuves, controverses, domaines, dates | composer/proposer un modèle | assertions et preuves canoniques |
| Scientific Models | OBS | propriétés candidates, mécanismes, alternatives, limites | définir/qualifier observabilité et mesure | structure explicative du modèle |
| OBS | ResearchProject | ObservableProperties, MeasurementDefinitions, BiomarkerRoles candidats, preuves, limites | retenir/rejeter/contextualiser des rôles et besoins | définitions générales de propriété et mesure |
| Scientific Thinking | ResearchProject | options, objections, incertitudes, justification, action attendue | décision humaine explicite | historique de raisonnement |
| ResearchProject | Imaging / domaines | DataNeeds, CanonicalVariables, temporalité, population, contraintes | proposer une opérationnalisation spécialisée | finalité et définitions du projet |
| Domaines de mesure | ResearchProject | MeasurementDefinitions applicables, faisabilité, limites, coûts/risques connus | adopter/refuser l'opérationnalisation | connaissance et règles du domaine |
| ResearchProject | Data Management / CDM futur | CanonicalVariables, occasions, sources prévues, statuts attendus, transformations admises | définir représentation et contrôles | sens scientifique des variables |
| Data Management | Biostatistics | occurrences gelées, statuts, lignage, versions, population de données | exécuter une spécification adoptée | conservation, qualité et traçabilité des données |
| Biostatistics / domaine | ResearchProject | AnalysisResults, incertitudes, diagnostics, limites | interpréter et décider humainement | spécification et traçabilité des calculs |
| Tous owners | DOC / VAL | objets versionnés, projections autorisées, règles, preuves et limites | rendre ou diagnostiquer | identités et décisions sources |

## 6. Matrice des droits conceptuels

Légende : **O** owner ; **C** contributeur ; **R** lecteur/consommateur ; **D** décideur humain ; **—** aucun droit implicite.

| Domaine | Knowledge | Models | OBS | ResearchProject | Domaine spécialisé | CDM / Data Management | Biostatistics | DOC/TMP | VAL | Humain mandaté |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Assertion/preuve | O | R | R | R | C | R | R | R | R | D |
| ScientificModel général | C | O | R | R | C | R | R | R | R | D |
| Adoption d'un modèle au projet | R | C | C | O | C | R | R | R | R | D |
| ObservableProperty | C | C | O | R | C | R | R | R | R | D |
| MeasurementDefinition | R | C | O | R | O spécialisé | C | C | R | R | D |
| BiomarkerRole général | C | C | O | R | C | R | C | R | R | D |
| BiomarkerRole du projet | R | C | C | O | C | R | C | R | R | D |
| DataNeed | R | C | C | O | C | C | C | R | R | D |
| CanonicalVariable | R | R | C | O | C | C | C | R | R | D |
| VariableOccurrence | — | — | R | O sens | C production | O conservation | R | R autorisé | R | D correction |
| AnalysisSpecification | R | C | C | O adoption | O spécialisé | C | O statistique | R | R | D |
| AnalysisResult | R | R | R | O usage | O spécialisé | C | O statistique | R | R | D |
| ScientificInterpretation | R | C | C | O | C | R | C | R | R | D |
| Projection documentaire | R | R | R | R | R | R | R | O | C | D publication |
| Diagnostic de validité | R | R | R | R | R | R | R | R | O | D disposition |

## 7. Limites d'admission

- L'instance organisationnelle définitive de gouvernance des Scientific Models reste à nommer ; la fonction d'ownership est néanmoins normative.
- OBS-001, CDM-001, Data Management et Biostatistics n'ont pas encore traduit cette matrice en contrats spécialisés admis.
- `StudyDataSource` reste une sous-ressource tant qu'un lifecycle autonome et un owner NOXIA transversal ne sont pas démontrés.
- Cette matrice ne confère aucun droit d'accès aux données, aucune qualification réglementaire et aucun mandat clinique.

`PD003_V2_OWNERSHIP_MATRIX_ADMITTED_WITH_LIMITATIONS`
