# PD-003 V2 — Research Object Model — Rapport d'admission

| Champ | Valeur |
|---|---|
| Nature | rapport officiel d'admission normative |
| Niveau | `NIVEAU_3 — trace d'arbitrage et d'admission` |
| Version | 1.0 |
| Date | 12 août 2026 |
| Norme admise | `docs/pd-003-v2-research-object-model.md`, version 2.0 |
| Décision | `PD003_V2_RESEARCH_OBJECT_MODEL_ADMITTED_WITH_LIMITATIONS` |

## 1. Décision

PD-003 V2 est admis comme référence métier normative courante. PD-003 V1 est conservé intact comme référence historique remplacée. L'admission est assortie de limitations parce qu'aucun consumer n'est migré, qu'OBS/CDM n'existent pas encore comme architectures admises et que l'owner institutionnel des ScientificModels réutilisables reste à nommer.

Cette décision ne crée ni moteur, ni code, ni schéma de stockage, ni donnée, ni protocole, ni migration, ni PASS PD-011.

## 2. Autorités

La consultation a commencé par le SOURCE-OF-TRUTH-INDEX version 1.26, lu intégralement, puis : Charte fondatrice ; Scientific Product Manifesto V2 ; Editorial Engine Architecture Manifesto. Ont ensuite été consultés dans l'ordre prescrit : Manifesto V1 historique ; les cinq compagnons MAN-001 ; PD-003 V1 ; PD-004 ; PD-005 ; PD-009 ; PD-011 ; RDE-001 ; RDE-002 ; RDE-003 ; KE-001 ; ST-001 ; IMG-001 ; IMG-001B ; PRJ-001 ; REG-001 ; DOC-002 ; TMP-001 ; DOC-001B ; VAL-000 ; SKM-000 ; PD-003R1.

Préséance appliquée : Charte → Manifesto V2 → PD-003 V2 → autorités spécialisées dans leur domaine → corpus → preuves d'implémentation. SKM-000 et PD-003R1 restent des candidats historiques ; ils ont instruit l'arbitrage mais n'ont pas déterminé la décision.

## 3. Baseline

- dépôt : `noxia-dev` ;
- branche : `sem-001r-closure` ;
- HEAD : `8b30a632b038790adac1503c9cb44a8193f8fd90` ;
- worktree déjà modifié avant PD-003 V2, notamment par MAN-001 et une campagne SEM protégée ;
- PD-003 V1 et les moteurs existants n'ont pas été modifiés ;
- DOC-001B et VAL-000 ont été consultés dans le worktree externe `noxia-val000`, en lecture seule ;
- aucun commit, push ou déploiement.

La présence de changements concurrents interdit d'attribuer le statut global du worktree à cette mission. Les fichiers PD-003 V2 et la modification bornée de l'index constituent son périmètre documentaire.

## 4. Raison de la V2

PD-003 V1 protégeait déjà la distinction Phénomène–Biomarqueur–Variable, mais `Biomarqueur`, `Variable d'étude`, `Visite ou temps d'observation` et `Analyse` combinaient plusieurs responsabilités dont les owners, cycles et provenances divergent.

Le Manifesto V2 a constitutionnellement séparé ScientificModel, ObservableProperty, MeasurementDefinition, BiomarkerRole, DataNeed, CanonicalVariable, VariableOccurrence, temps/sources, Biospecimen, AnalysisSpecification, exécution, résultat et interprétation. PD-003 devait évoluer pour rendre cette constitution opposable sans dupliquer les objets V1 encore valides.

## 5. Changements constitutionnels consommés

La V2 consomme six décisions de fond :

1. Knowledge n'est pas un ScientificModel ;
2. ObservableProperty n'est ni Phénomène ni BiomarkerRole ;
3. MeasurementDefinition n'est ni choix de Project ni valeur ;
4. Biomarker devient un rôle contextualisé ;
5. CanonicalVariable est une définition de Project et VariableOccurrence sa réalisation ;
6. AnalysisSpecification, exécution, résultat et interprétation restent distincts.

Restent inchangés : science avant technologie, intention avant solution, contexte, preuves, incertitude, humain décisionnaire, provenance, projections passives et philosophie Core Lab.

## 6. Objets V1

Les 68 types V1 ont été inventoriés exactement. Soixante-sept conservent une continuité sous un statut `UNCHANGED`, `CLARIFIED` ou `SPECIALIZED`. `Biomarqueur` V1 devient `LEGACY_ONLY / SUPERSEDED` pour les nouvelles créations ; ses instances historiques restent lisibles.

Aucun objet V1 n'est supprimé, réécrit ou remappé automatiquement. Le crosswalk exhaustif porte définition V1, disposition V2, owner, migration, compatibilité, supersession et impact.

## 7. Scientific Model

`ScientificModel` est admis comme `OBJECT`. Son autonomie est démontrée par une identité et une version propres, la comparaison de modèles concurrents, la réutilisation entre Projects, un lifecycle distinct et des impacts spécifiques.

Knowledge possède les unités et preuves ; Scientific Thinking propose les compositions ; l'acteur scientifique mandaté adopte leur usage dans un Project. L'owner institutionnel hors Project reste une limitation ouverte.

## 8. Observable Property

`ObservableProperty` est admise comme `OBJECT` et comme terme canonique constitutionnel. Elle représente ce qui peut être approché empiriquement, sans être le Phénomène, la méthode, le rôle biomarqueur, la Variable ou la valeur.

Son owner cible est OBS. Knowledge conserve la définition scientifique référencée ; les domaines de mesure contribuent aux conditions d'observabilité.

## 9. Measurement Definition

`MeasurementDefinition` est admise comme `OBJECT`. Elle porte principe de mesure, propriété ciblée, formes de résultat, conditions, performances documentées, qualité, facteurs de confusion, limites et version.

Modalité, Séquence/technique, Acquisition et Procédure de lecture restent des spécialisations ou réalisations de domaine selon leur contrat ; aucune modalité disponible ne devient automatiquement une méthode retenue.

## 10. Biomarker Role

`BiomarkerRole` est admis comme `ROLE` qualifié et versionné, non comme objet racine. Il relie ObservableProperty, cible, usage, population, temps, MeasurementDefinition, domaine, preuves, limites et statut Project.

Le type V1 `Biomarqueur` est conservé en lecture legacy. Aucun split automatique n'est autorisé, car il inventerait la propriété, la cible ou le contexte qui n'ont pas été représentés séparément.

## 11. Data Need

`DataNeed` est admis comme `OBJECT` dont l'identité est bornée au ResearchProject. Son lifecycle et ses impacts justifient cette autonomie locale.

Il reste distinct de `Besoin d'information`, qui sert le dialogue de conception, et d'un Knowledge gap. Un DataNeed ne crée jamais une CanonicalVariable ou une collecte automatiquement.

## 12. Canonical Variable

`CanonicalVariable` spécialise `Variable d'étude` sans créer une seconde lignée. Elle possède une identité unique de Project à travers CRF, dictionnaire, SAP, jeux d'analyse, exports et documents.

Elle existe avant toute valeur et conserve ObservableProperty ou autre caractéristique, MeasurementDefinition, source prévue, temps attendu, unité/domaine, qualité, missingness, usages analytiques, provenance et version.

## 13. Temporalité

La V2 sépare Visit, TemporalAnchor, ExpectedVariableOccasion, AcquisitionTime, CollectionTime, TransformationTime et AnalysisTime.

Visit reste un objet spécialisé ; TemporalAnchor est un value object ; l'occasion attendue est relation/sous-ressource. Une répétition ne duplique pas la Variable si le sens reste identique.

## 14. Variable Occurrence

`VariableOccurrence` est admise comme `OBJECT`. Elle représente valeur, catégorie, tentative, absence qualifiée ou dérivation pour une unité et une occasion.

Le système source possède la valeur primaire ; Data Management/CDM possède sa représentation canonique ; les spécialistes possèdent les règles de production. Une occurrence ne modifie jamais sa Variable et conserve méthode, source, qualité, correction et lignage.

## 15. Missingness/status

Le modèle abandonne tout enum unique mélangeant états. Les axes épistémique, applicabilité, réalisation, cohérence, lignage et actualité sont orthogonaux.

`MISSING`, `NOT_COLLECTED`, `NOT_APPLICABLE`, `NOT_EVALUABLE`, `INVALID` et biologiquement négatif restent distincts. Les états PD-009/KE-001 V1 disposent d'un mapping de compatibilité sans perte.

## 16. Sources

Une source est qualifiée selon mandat de production, contexte de provenance, domaine/méthode et lignage. `StudyDataSource` est un `SUBRESOURCE`, car son identité NOXIA et son lifecycle autonome ne sont pas encore démontrés ; l'identité externe est seulement référencée.

Une donnée issue du soin courant ne devient jamais `STUDY_MANDATED` par sélection, copie, transformation ou analyse.

## 17. Biospecimen

`Biospecimen` est admis comme `OBJECT` : identité matérielle, unité source, custody, transformations, parenté, qualité, disponibilité et restrictions possèdent un lifecycle distinct.

Il n'est ni Variable, ni source scientifique, ni occurrence de propriété. Sa collecte ne sélectionne aucune analyse.

## 18. Analysis

Le type V1 `Analyse` devient `AnalysisSpecification` lorsqu'il décrit une spécification. `AnalysisExecution` est une sous-ressource versionnée reliée aux entrées réelles et contrôles.

Les owners restent spécialisés : Imaging pour lecture/mesure d'image, Data Management pour transformations et lignage, Biostatistics pour inférence et dimensionnement, humain mandaté pour interprétation et décisions.

## 19. Analysis Result

`AnalysisResult` est admis comme `OBJECT` sous critère d'autonomie. Un résultat complexe avec structure, incertitude et diagnostics possède cette identité ; un scalaire dérivé pré-spécifié reste VariableOccurrence.

Le choix évite à la fois l'objet universel obligatoire et la compression destructrice de résultats complexes dans une variable dérivée.

## 20. Standards externes

`TerminologyMapping` est une `RELATION` versionnée. Il conserve standard/version, cible, équivalence, contexte, exclusions, provenance, revue et alternatives.

Un standard externe facilite l'échange mais ne remplace ni l'identité NOXIA ni le raisonnement scientifique. Une correspondance partielle ne devient jamais exacte.

## 21. Canonical Identity

L'identité suit la continuité sémantique, non le libellé. Alias, traduction, format et mapping compatibles conservent l'identité. Un changement de sens crée une nouvelle identité reliée ; un changement compatible crée une version.

Toute version utilisée par une Décision, une exécution ou une Projection est immuable et rejouable.

## 22. Ownership

L'ownership est défini pour chaque famille et chaque nouvel objet. Contribuer, adopter, représenter, analyser et projeter ne sont jamais synonymes de posséder.

Les owners non encore institutionnalisés sont déclarés cibles : ScientificModel governance, OBS, CDM/Data, Biospecimen domain et Biostatistics. Leur absence d'implémentation n'annule pas la frontière normative.

## 23. Handoffs

Chaque handoff conserve identités, versions, rôles, contexte, statut, provenance, décisions, inconnues, contradictions, limites et dépendances. Il transmet le minimum suffisant et reste read-only pour l'émetteur.

Les handoffs Knowledge→Model→OBS→Project→Data→Analysis→Project→TMP/DOC sont explicités sans pipeline obligatoire.

## 24. Non-promotion

Sont interdites : assertion→modèle adopté ; observabilité→validité biomarqueur ; MeasurementDefinition→méthode choisie ; DataNeed→Variable ; Variable→Occurrence ; résultat→interprétation ; interprétation→Décision ; pattern→règle ; Requirement candidate→obligation ; projection→vérité.

Toute promotion engageante exige l'owner, une justification, les preuves et la Décision humaine applicables.

## 25. Relations

Vingt relations structurantes V2 sont admises, dont `REFERENCES_KNOWLEDGE`, `MODELS`, `MEASURED_BY`, `HAS_BIOMARKER_ROLE`, `MOTIVATES_DATA_NEED`, `COVERS_DATA_NEED`, `OPERATIONALIZES`, `EXPECTED_AT`, `REALIZES`, `DERIVED_FROM`, `PRODUCES_RESULT` et `MAPPED_TO_STANDARD`.

Les relations V1 incompatibles restent legacy et nécessitent une décomposition vérifiée. Aucune relation n'est une simple clé technique : chacune porte contexte, statut, provenance, période et owner.

## 26. Versionnement

PD-003 V2 est une version majeure. Les objets et relations versionnés sont immuables après usage. `SUPERSEDES` conserve l'original ; aucune suppression historique n'est autorisée.

Une migration réelle est une mission séparée avec mapping approuvé, rollback, contrôles de non-duplication et preuves de conservation.

## 27. Douze cas conceptuels

Les cas A à L couvrent exactement : infarctus + XA ; infarctus + IRM ; comparaison XA/IRM ; échocardiographie de soin courant réutilisée ; troponine répétée T0/H6/H12/H24 ; ObservableProperty sans rôle biomarqueur ; une ObservableProperty avec deux BiomarkerRoles ; fécothèque sans analyse sélectionnée ; Variable CRF utilisée en Biostatistics avec identité inchangée ; Variable dérivée depuis plusieurs Variables sources ; étude sans Imaging ; donnée absente, non évaluable ou invalide.

Chaque cas explicite objets créés, objets non créés, relations, owners, décisions nécessaires, provenance et éléments restant `UNKNOWN`. Aucun protocole, paramètre clinique ou recommandation n'est produit.

## 28. Crosswalk V1/V2

Le crosswalk couvre exactement 68 lignes numérotées et associe pour chacune identité, définition V1, disposition V2, owner, migration, compatibilité, supersession, mapping et impact.

Les contrôles empêchent doublon `Variable`/`CanonicalVariable`, confusion `Besoin d'information`/`DataNeed`, promotion de `Biomarqueur` legacy et fusion de `Analyse` avec exécution/résultat/interprétation.

## 29. Legacy

PD-003 V1 reste physiquement et sémantiquement intact. Toute instance est interprétée avec la version normative qui l'a créée. Les readers V2 peuvent exposer une vue legacy mais ne doivent ni inventer les nouveaux objets ni augmenter la certitude.

Les relations V1 non décomposables portent `NEW_MAPPING_REQUIRED`; l'ambiguïté reste visible.

## 30. Impacts moteurs

La matrice couvre SEM, Knowledge, Scientific Thinking, Imaging, Research Project, REG, DOC-002, TMP, DOC, VAL, futurs OBS/CDM, Data Management et Biostatistics.

L'admission modifie leur cible normative, pas leur état implémenté. Chaque consumer reste un reader V1 jusqu'à migration et non-régression séparées.

## 31. Impacts OBS

Les objets nécessaires à OBS sont admis : ObservableProperty, MeasurementDefinition et BiomarkerRole. OBS-001 peut désormais commencer par une architecture normative séparée.

OBS ne pourra ni contenir des données individuelles, ni choisir les Variables du Project, ni posséder tous les domaines de mesure, ni transformer la mesurabilité en validité biomarqueur.

## 32. Impacts CDM

Les préconditions conceptuelles CDM sont suffisamment normées : DataNeed, CanonicalVariable, VariableOccurrence, temporalité, sources multi-axes, Biospecimen, missingness, provenance et ownership.

CDM-001 peut commencer comme architecture normative séparée. Il devra représenter sans raisonner, préserver les systèmes sources et garder Results/Interpretation distincts.

## 33. Impacts Data Management

Data Management reçoit l'ownership de structure, intégrité, qualité, sources, transformations, corrections et lignage. Il ne possède ni ScientificModel, ni rôle biomarqueur, ni Critère adopté, ni choix d'inférence.

Son premier contrat devra préserver l'identité CanonicalVariable de bout en bout et rendre toute VariableOccurrence reconstructible.

## 34. Impacts Biostatistics

Biostatistics consomme Questions, Hypothèses, Critères, Variables, temps, Occurrences, missingness et décisions. Il possède estimands, modèles, populations d'analyse, covariables, sensibilités et dimensionnement.

Il ne peut redéfinir une Variable, corriger une provenance, décider un BiomarkerRole ou produire une interprétation humaine implicite.

## 35. Gouvernance

Le document principal est une norme de niveau 1. Le présent rapport et les cinq autres annexes sont des compagnons de niveau 3 subordonnés. Le SOURCE-OF-TRUTH-INDEX est mis à jour atomiquement.

Toute évolution ultérieure doit modifier seulement l'autorité compétente, conserver l'historique et documenter les contradictions. Aucun document candidat, rapport d'implémentation ou standard externe ne peut modifier PD-003 V2 implicitement.

## 36. Index

L'index passe à la version 1.27, enregistre PD-003 V2 comme courant, PD-003 V1 comme historique, les six compagnons d'admission, les sources maîtresses, conditions d'évolution et règles de consultation. Les comptes passent de 81 à 88 artefacts gouvernés, et de 82 à 89 index inclus.

Les huit chemins inexacts des rapports ST/IMG/PRJ/REG/SYS inventoriés hors corpus sont corrigés factuellement sans admission de ces rapports. Cette dérive de routage est déclarée, pas masquée.

## 37. Limitations

1. Aucun consumer n'est migré ou évalué sous V2.
2. ScientificModel n'a pas encore d'owner institutionnel ou de registre admis.
3. OBS et CDM restent à concevoir ; leurs taxonomies détaillées sont ouvertes.
4. StudyDataSource reste une sous-ressource.
5. AnalysisResult exige encore une spécialisation Biostatistics/CDM.
6. La taxonomie Biospecimen reste minimale.
7. Les normes consommatrices portent encore des chaînes lexicales V1.
8. Les rapports DOC-001B et VAL-000 sont dans un worktree distinct et ne sont pas admis par cette opération.
9. Aucun PASS PD-011, migration de données, implémentation ou validation scientifique n'est revendiqué.

## 38. Prochaine étape

Deux missions normatives peuvent désormais démarrer séparément : OBS-001 pour le modèle d'observabilité et de mesure ; CDM-001 pour la représentation canonique des données d'étude. Avant toute implémentation, chacune devra établir son ownership, son crosswalk PD-003 V2, ses invariants et ses cas de non-régression.

La migration des consumers existants devra ensuite être planifiée par tranches, avec lecteurs legacy, validation VAL, rollback et absence de mutation silencieuse.

`PD003_V2_RESEARCH_OBJECT_MODEL_ADMITTED_WITH_LIMITATIONS`
