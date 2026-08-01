# Rapport P3M-Web — migration documentaire du Scientific Knowledge Graph

## 1. Périmètre produit

Cette migration concerne exclusivement le socle scientifique et éditorial du site public Noxia. Elle prépare pages de concepts, synthèses de littérature, fiches techniques, comparaisons, glossaire, FAQ, navigation, données structurées, SEO et pages « état des connaissances ».

Le logiciel Noxia, le PACS, les viewers, les protocoles exécutables, les workflows applicatifs, les affectations CoreLab, les équipements installés, les licences opérationnelles, les datasets internes, l’entraînement IA et les moteurs de recommandation clinique sont hors périmètre.

## 2. Entrée officielle P3

Le rapport destructif P3 existant reste valable et constitue l’entrée officielle de P3M-Web. Il n’a pas été refait. Seule l’application de ses conclusions a été limitée au sous-ensemble documentaire et scientifique nécessaire au site.

## 3. État initial

- Branche initiale : `main`.
- SHA source : `857e94b6df88289b59de149fe8f77e84dbee9492`.
- Graphe v1 structurellement valide : oui, 0 erreur et 5 avertissements.
- Couche Scientific Assertion antérieure : valide, sans migration de vérité scientifique.
- Modifications P1, P2 et P3R préservées.
- Pages, routes, SEO, sitemap, viewers et dépôt editorial-engine exclus de la mutation.

## 4. Snapshot source

Le snapshot déterministe `knowledge-graph:1.0.0:451117f9f5439dd2c15381c5e6844167072de474ab27b8d88eb8815b29e7bc9e` contient 118 entités, 93 relations, 24 sources, 9 publications, 13 profils biomarqueurs et 13 contraintes. Son digest contractuel est `451117f9f5439dd2c15381c5e6844167072de474ab27b8d88eb8815b29e7bc9e` et aucun timestamp instable ne participe aux digests.

## 5. Nouvelle architecture web

L’architecture sépare identités stables, révisions, relations structurelles actives, assertions scientifiques, sources versionnées, liens de preuve, contextes d’applicabilité, désignations, mesures et synthèses structurées. Les objets protocoles, équipements, workflows, CoreLab, études, datasets et algorithmes restent des sujets documentaires légers.

## 6. Correction des identités

Les 93 relations disposent d’un ID v2 dérivé du namespace complet, des deux endpoints complets, du type, du discriminateur et de la version d’algorithme. La table de migration est exhaustive et le résolveur accepte les anciens IDs. Aucune collision n’est présente.

## 7. Modèle de versionnement

`ConceptIdentity`, `EntityRevision`, `ScientificAssertionIdentity`, `ScientificAssertionRevision`, `SourceIdentity`, `SourceRevision`, `PublicationWork` et `PublicationVersion` séparent identité et histoire. Validité, succession, correction et rétraction sont portées uniquement là où elles sont justifiées.

## 8. Modèle de provenance

33 identités de source et 33 révisions ont été créées : 24 pages/fichiers du dépôt et 9 publications. Les localisateurs bibliographiques ou dépôt restent optionnels selon le type de source. DOI, PMID, auteurs, année et version absents restent `null`.

## 9. Modèle de preuve

Le type de source, la qualité de preuve, la maturité scientifique et le statut documentaire sont indépendants. Aucun niveau élevé n’est déduit d’un type documentaire.

## 10. Scientific Assertions

Le contrat représente assertions entity-object, littérales, quantitatives, d’applicabilité, de compatibilité documentaire, recommandations citées et négatives. La migration réelle crée 0 assertion : aucune relation v1 n’était suffisamment localisée et revue pour devenir une vérité scientifique.

## 11. Evidence Links

Le modèle distingue soutien, réfutation, qualification, mention, dérivation, correction, rétraction et lien non résolu. 0 lien réel a été créé. `Publication DOCUMENTS Concept` reste une mention candidate, jamais un soutien automatique.

## 12. Contextes

Les contextes couvrent population, âge, sexe, espèce, pathologie, stade, modalité, constructeur, gamme, modèle, génération, logiciel, champ, séquence, protocole décrit, contraste, dose, méthode, workflow documentaire, centre, étude et temporalité. EXACT, ANY_OF, ALL_OF, EXCLUDES, RANGE, CONDITION, UNKNOWN et NOT_APPLICABLE sont supportés.

## 13. Modèle quantitatif

Définition, méthode, observation, mesure dérivée, seuil et plage de référence peuvent porter quantité, unité, formule, entrées, temporalité, incertitude, précision, répétabilité, reproductibilité, biais, normalisation et sources. Aucune valeur n’a été inventée.

## 14. Protocoles documentaires

`ProtocolConcept` et `ProtocolDescriptionRevision` représentent paramètres publiés, variantes décrites, limites et différences multicentriques. Ils ne configurent ni examen, ni fallback, ni PACS.

## 15. Équipements documentaires

Constructeur, gamme, modèle, génération, champ, plateforme et version logicielle peuvent être des sujets documentaires. `CapabilityStatement` contextualise une capacité ou une limite sourcée. Aucune instance installée, licence produit ou règle de compatibilité applicative n’existe.

## 16. Terminologies

134 désignations ont été dérivées des libellés et alias historiques. Les chaînes ne sont plus globalement uniques. Langue, locale, type et contexte permettent synonymes, abréviations, traductions, homonymes et acronymes polysémiques. Aucun code externe n’a été inventé.

## 17. Workflows et CoreLab documentaires

Les descriptions peuvent exposer étapes, rôles, méthodes et contrôles publiés. Elles ne contiennent aucune transition applicative, affectation, état de production ou adjudication exécutable.

## 18. Études, datasets et IA documentaires

Études, cohortes publiées, datasets cités, algorithmes et métriques publiées sont représentables comme sujets du site. La gestion des datasets internes, l’entraînement et les modèles déployés sont absents.

## 19. Standards

Standard, partie, édition, profil, SOP Class, syntaxe de transfert et déclaration documentaire de conformité sont représentables. L’ancien raccourci DICOM `Format COMPATIBLE_WITH Standard` est désactivé sans suppression historique.

## 20. Profils de complétude

La complétude est distincte pour CATALOG, EDITORIAL, SCIENTIFIC, COMPARISON, GLOSSARY, NAVIGATION, SEO et KNOWLEDGE_STATE. Les 118 concepts restent catalogables ; aucun n’est déclaré scientifiquement complet sans assertions et preuves revues.

## 21. Validations multicouches

Structure : Oui. Sémantique : Oui. Scientifique : Oui. Provenance : Oui. Couverture évaluée : Oui. Compétence : Oui. Intégrité de migration : Oui. Schéma de projection web : Oui. Contenu scientifique public prêt : Non.

## 22. Migration des entités

Les 118 identités historiques sont conservées et reçoivent 118 révisions initiales. Labels, descriptions, propriétés, alias, sources et valeurs inconnues sont préservés. Chaque migration possède un digest avant/après identique pour le payload historique.

## 23. Migration des relations

Les 93 relations sont inventoriées : 44 structurelles actives, 47 différées et 2 désactivées. Aucune assertion n’a été créée.

## 24. Migration des publications

Les 9 publications deviennent 9 `PublicationWork`, 9 `PublicationVersion` et 9 sources scientifiques versionnées. La correction PLOS reste une relation candidate non appliquée : CORRECTS requires an explicit source locator demonstrating both document identities.

## 25. Migration des biomarqueurs

Les 13 profils sont inventoriés. Leur classification historique est conservée ; les alternatives de mesure ou endpoint restent des propositions à revoir. Les listes vides de preuves et limitations ne sont jamais traitées comme complètes.

## 26. Cas de compétence web

Les 11 cas sont modélisables, dont IRM/ECV, CT/ECV, protocoles myocardite, comparaison MOLLI/SASHA, limites de plateformes, correction, controverse, glossaire, fiche quantitative, DICOM et projection état des connaissances. Les lacunes de données n’invalident pas la représentabilité.

## 27. Synthèses dérivées

La synthèse déterministe retourne assertions applicables, favorables, défavorables, qualifications, sources, dimensions de preuve, contextes, limitations, contradictions, consensus avec règle explicite, questions ouvertes, historique, confiance et données manquantes. Elle ne produit ni texte éditorial ni méta-analyse statistique.

## 28. Compatibilité et rollback

Le snapshot, les registres v1, les payloads historiques et les anciens IDs sont conservés. Le rollback logique consiste à cesser de lire la projection v2-web. Aucune suppression ni réécriture inverse n’est nécessaire.

## 29. Fichiers créés

- Contrats, factories et validateurs P3M-Web sous `src/knowledge-graph/`.
- Snapshot, table d’identités, projection migrée et manifeste sous `src/knowledge-graph/migration/`.
- Scripts de snapshot, migration, validation et rapport sous `scripts/`.
- Architecture `docs/scientific-knowledge-graph-web.md` et présent rapport.
- Matrice de tests P3M-Web sous `src/knowledge-graph/`.

## 30. Fichiers modifiés

`package.json`, `src/knowledge-graph/schema.mjs`, `src/knowledge-graph/constraints.mjs`, `src/knowledge-graph/validate.mjs` et `src/knowledge-graph/index.mjs` uniquement dans le périmètre du graphe et de ses commandes. Aucun fichier page, route, SEO, sitemap, viewer, SaaS ou PACS n’est modifié par P3M-Web.

## 31. Tests ajoutés

La matrice vérifie snapshot, intégrité, identités, versions, provenance, assertions et preuves synthétiques, contextes, quantitatif, terminologie, relations formelles, migrations, cas web, synthèse, frontières produit et surfaces protégées.

## 32. Validations exécutées

Les commandes de snapshot, migration, validation structurelle, sémantique, scientifique, provenance, complétude, compétence, projection, tests, typecheck, build, lint et contrôle Git sont consignées lors de la validation finale.

## 33. Problèmes restant ouverts

- Aucun corpus d’assertions scientifiques revues n’est encore migré.
- Les localisateurs précis et extractions de source restent à enrichir.
- Les données constructeur, champ, logiciel, MOLLI, SASHA, myocardite et CT/ECV sont absentes ou insuffisantes.
- Le lien entre la correction PLOS et l’article original n’est pas appliqué sans preuve explicite dans le dépôt.
- Les 47 relations différées nécessitent une revue sémantique ou scientifique.
- Toute projection publique exige encore une validation éditoriale, scientifique et SEO séparée.

## Tableau — défauts P3 appliqués au web

| Défaut P3 | Correction appliquée | Migration | Test | Résultat |
|---|---|---|---|---|
| Collision des relations | Identité v2 sur endpoints complets et version d’algorithme | 93 correspondances | Unicité et résolution legacy | VALIDÉ |
| Concept confondu avec version | Identités et révisions séparées | 118 + 118 | Identité/révision et validité | VALIDÉ |
| Relation structurelle assimilable à une vérité | Assertions et EvidenceLinks séparés | 0 promotion automatique | Classification exhaustive | VALIDÉ |
| Provenance insuffisante | SourceIdentity, SourceRevision et profils par type | 33 + 33 | Complétude de provenance | VALIDÉ |
| Preuve monodimensionnelle | Type, qualité, maturité et statut séparés | Contrat v2-web | Tests synthétiques | VALIDÉ |
| Contexte insuffisant | Dimensions structurées et opérateurs | Contrat v2-web | IRM/ECV et CT/ECV | VALIDÉ |
| Anatomie thorax/poumon fausse | Relation désactivée et conservée | 1 relation inactive | Projection active | VALIDÉ |
| DICOM réduit à un format compatible | Relation désactivée, contrats documentaires | 1 relation inactive | Arbre DICOM | VALIDÉ |
| Surdimensionnement logiciel | Objets documentaires légers, aucun moteur | Périmètre P3M-Web | Frontières produit | VALIDÉ |

## Tableau — registres

| Registre | Avant | Après | Préservé | Non résolu |
|---|---:|---:|---|---|
| Entités | 118 | 118 identités + 118 révisions | Oui | Validation scientifique à enrichir |
| Relations | 93 | 93 classifiées | Oui | 47 différées, 2 désactivées |
| Sources dépôt | 24 | 24 identités + révisions | Oui | Localisateurs fins à enrichir |
| Publications | 9 | 9 works + 9 versions + 9 sources | Oui | Correction PLOS candidate |
| Profils biomarqueurs | 13 | 13 migrations qualifiées | Oui | Nature scientifique et preuves |
| Assertions scientifiques | 0 | 0 | Oui | Corpus sourcé à créer |
| Evidence Links | 0 | 0 | Oui | Revue source-assertion à créer |

## Tableau — relations historiques

| Relation historique | Classification | Décision | Assertion créée ? | Justification |
|---|---|---|---|---|
| noxia:radiology:relation:applies_to:biorxiv-2024-12-12:acute-ischemic-stroke | EVIDENCE_MENTION | PRESERVED_AS_MENTION_CANDIDATE_WITHOUT_EVIDENCE_LINK | Non | The repository establishes a documentary mention only; no assertion revision exists to receive an EvidenceLink. |
| noxia:radiology:relation:applies_to:cbf:brain | SCIENTIFIC_CANDIDATE | DEFERRED_PENDING_SOURCE_LEVEL_ASSERTION_REVIEW | Non | The edge may contain scientific meaning but lacks a reviewed assertion, context and evidence locator. |
| noxia:radiology:relation:applies_to:cbv:brain | SCIENTIFIC_CANDIDATE | DEFERRED_PENDING_SOURCE_LEVEL_ASSERTION_REVIEW | Non | The edge may contain scientific meaning but lacks a reviewed assertion, context and evidence locator. |
| noxia:radiology:relation:applies_to:cmro2:brain | SCIENTIFIC_CANDIDATE | DEFERRED_PENDING_SOURCE_LEVEL_ASSERTION_REVIEW | Non | The edge may contain scientific meaning but lacks a reviewed assertion, context and evidence locator. |
| noxia:radiology:relation:applies_to:ecv:heart | SCIENTIFIC_CANDIDATE | DEFERRED_PENDING_SOURCE_LEVEL_ASSERTION_REVIEW | Non | The edge may contain scientific meaning but lacks a reviewed assertion, context and evidence locator. |
| noxia:radiology:relation:applies_to:oef:brain | SCIENTIFIC_CANDIDATE | DEFERRED_PENDING_SOURCE_LEVEL_ASSERTION_REVIEW | Non | The edge may contain scientific meaning but lacks a reviewed assertion, context and evidence locator. |
| noxia:radiology:relation:applies_to:pone-0245684:stemi | EVIDENCE_MENTION | PRESERVED_AS_MENTION_CANDIDATE_WITHOUT_EVIDENCE_LINK | Non | The repository establishes a documentary mention only; no assertion revision exists to receive an EvidenceLink. |
| noxia:radiology:relation:applies_to:stroke-124-047311:acute-ischemic-stroke | EVIDENCE_MENTION | PRESERVED_AS_MENTION_CANDIDATE_WITHOUT_EVIDENCE_LINK | Non | The repository establishes a documentary mention only; no assertion revision exists to receive an EvidenceLink. |
| noxia:radiology:relation:applies_to:t1:heart | SCIENTIFIC_CANDIDATE | DEFERRED_PENDING_SOURCE_LEVEL_ASSERTION_REVIEW | Non | The edge may contain scientific meaning but lacks a reviewed assertion, context and evidence locator. |
| noxia:radiology:relation:applies_to:t2:heart | SCIENTIFIC_CANDIDATE | DEFERRED_PENDING_SOURCE_LEVEL_ASSERTION_REVIEW | Non | The edge may contain scientific meaning but lacks a reviewed assertion, context and evidence locator. |
| noxia:radiology:relation:applies_to:tmax:brain | SCIENTIFIC_CANDIDATE | DEFERRED_PENDING_SOURCE_LEVEL_ASSERTION_REVIEW | Non | The edge may contain scientific meaning but lacks a reviewed assertion, context and evidence locator. |
| noxia:radiology:relation:compatible_with:dicom:dicom | SEMANTICALLY_INCORRECT | REPLACED_BY_UNPOPULATED_STANDARD_CONTRACT | Non | DICOM cannot be reduced to a format-to-standard compatibility edge; the old edge is preserved but excluded from the active projection. |
| noxia:radiology:relation:derived_from:cbf:cbf | SCIENTIFIC_CANDIDATE | DEFERRED_PENDING_SOURCE_LEVEL_ASSERTION_REVIEW | Non | The edge may contain scientific meaning but lacks a reviewed assertion, context and evidence locator. |
| noxia:radiology:relation:derived_from:cmro2:cmro2 | SCIENTIFIC_CANDIDATE | DEFERRED_PENDING_SOURCE_LEVEL_ASSERTION_REVIEW | Non | The edge may contain scientific meaning but lacks a reviewed assertion, context and evidence locator. |
| noxia:radiology:relation:derived_from:ecv:ecv | SCIENTIFIC_CANDIDATE | DEFERRED_PENDING_SOURCE_LEVEL_ASSERTION_REVIEW | Non | The edge may contain scientific meaning but lacks a reviewed assertion, context and evidence locator. |
| noxia:radiology:relation:derived_from:oef:oef | SCIENTIFIC_CANDIDATE | DEFERRED_PENDING_SOURCE_LEVEL_ASSERTION_REVIEW | Non | The edge may contain scientific meaning but lacks a reviewed assertion, context and evidence locator. |
| noxia:radiology:relation:derived_from:tmax:tmax | SCIENTIFIC_CANDIDATE | DEFERRED_PENDING_SOURCE_LEVEL_ASSERTION_REVIEW | Non | The edge may contain scientific meaning but lacks a reviewed assertion, context and evidence locator. |
| noxia:radiology:relation:documents:biorxiv-2024-12-12:cmro2 | EVIDENCE_MENTION | PRESERVED_AS_MENTION_CANDIDATE_WITHOUT_EVIDENCE_LINK | Non | The repository establishes a documentary mention only; no assertion revision exists to receive an EvidenceLink. |
| noxia:radiology:relation:documents:pone-0245684:mvo | EVIDENCE_MENTION | PRESERVED_AS_MENTION_CANDIDATE_WITHOUT_EVIDENCE_LINK | Non | The repository establishes a documentary mention only; no assertion revision exists to receive an EvidenceLink. |
| noxia:radiology:relation:documents:pone-0245684:myocardial-hemorrhage | EVIDENCE_MENTION | PRESERVED_AS_MENTION_CANDIDATE_WITHOUT_EVIDENCE_LINK | Non | The repository establishes a documentary mention only; no assertion revision exists to receive an EvidenceLink. |
| noxia:radiology:relation:documents:stroke-124-047311:oef | EVIDENCE_MENTION | PRESERVED_AS_MENTION_CANDIDATE_WITHOUT_EVIDENCE_LINK | Non | The repository establishes a documentary mention only; no assertion revision exists to receive an EvidenceLink. |
| noxia:radiology:relation:has_feature:perfusion-segmentation:mask-overlay | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:has_feature:quality-control:quality-control | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:has_feature:quality-control:windowing | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:has_feature:registration:registration-comparison | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:has_feature:slice:slice-navigation | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:implemented_by:cardiac:cardiac-quantification-demo | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:implemented_by:ct-scan:ct-quantification-demo | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:implemented_by:dicom-to-nifti:dicom-audit | WORKFLOW_AMBIGUOUS | DEFERRED_FOR_WORKFLOW_ORDERING_REVIEW | Non | The historical edge may encode ordering or implementation; WorkflowStep and WorkflowTransition semantics cannot be inferred safely. |
| noxia:radiology:relation:implemented_by:neuro-onco:neuro-oncology-segmentation | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:implemented_by:noxia-cardiac-mri:corelab-cardiac-mri | UNRESOLVED | DEFERRED_PENDING_WORKFLOW_VERSION | Non | The implementation target must be attached to a versioned workflow, not inferred from a concept-level edge. |
| noxia:radiology:relation:implemented_by:perfusion-segmentation:perfusion-segmentation-demo | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:implemented_by:recalage:multimodal-registration | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:measures:late-gadolinium-enhancement:lge-quantification | SCIENTIFIC_CANDIDATE | DEFERRED_PENDING_SOURCE_LEVEL_ASSERTION_REVIEW | Non | The edge may contain scientific meaning but lacks a reviewed assertion, context and evidence locator. |
| noxia:radiology:relation:measures:perfusion-ct:cbf | SCIENTIFIC_CANDIDATE | DEFERRED_PENDING_SOURCE_LEVEL_ASSERTION_REVIEW | Non | The edge may contain scientific meaning but lacks a reviewed assertion, context and evidence locator. |
| noxia:radiology:relation:measures:perfusion-ct:cbv | SCIENTIFIC_CANDIDATE | DEFERRED_PENDING_SOURCE_LEVEL_ASSERTION_REVIEW | Non | The edge may contain scientific meaning but lacks a reviewed assertion, context and evidence locator. |
| noxia:radiology:relation:measures:perfusion-ct:tmax | SCIENTIFIC_CANDIDATE | DEFERRED_PENDING_SOURCE_LEVEL_ASSERTION_REVIEW | Non | The edge may contain scientific meaning but lacks a reviewed assertion, context and evidence locator. |
| noxia:radiology:relation:measures:t1-mapping:t1 | SCIENTIFIC_CANDIDATE | DEFERRED_PENDING_SOURCE_LEVEL_ASSERTION_REVIEW | Non | The edge may contain scientific meaning but lacks a reviewed assertion, context and evidence locator. |
| noxia:radiology:relation:measures:t2-mapping:t2 | SCIENTIFIC_CANDIDATE | DEFERRED_PENDING_SOURCE_LEVEL_ASSERTION_REVIEW | Non | The edge may contain scientific meaning but lacks a reviewed assertion, context and evidence locator. |
| noxia:radiology:relation:part_of:brain:nervous | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:part_of:cardiac-cine:cardiac-cine | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:part_of:cerebral:brain | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:part_of:diffusion-mri:diffusion | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:part_of:heart:cardiovascular | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:part_of:late-gadolinium-enhancement:late-enhancement | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:part_of:lung:respiratory | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:part_of:myocardium:heart | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:part_of:perfusion-ct:perfusion | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:part_of:t1-mapping:cardiac-mapping | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:part_of:t2-mapping:cardiac-mapping | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:part_of:thoracic:lung | SEMANTICALLY_INCORRECT | DISABLED_FROM_ACTIVE_PROJECTION | Non | A thoracic region is not a component of the lung; the historical statement is retained for audit and requires a sourced anatomical remodel. |
| noxia:radiology:relation:produces:perfusion-segmentation-demo:cbf | SCIENTIFIC_CANDIDATE | DEFERRED_PENDING_SOURCE_LEVEL_ASSERTION_REVIEW | Non | The edge may contain scientific meaning but lacks a reviewed assertion, context and evidence locator. |
| noxia:radiology:relation:produces:perfusion-segmentation-demo:tmax | SCIENTIFIC_CANDIDATE | DEFERRED_PENDING_SOURCE_LEVEL_ASSERTION_REVIEW | Non | The edge may contain scientific meaning but lacks a reviewed assertion, context and evidence locator. |
| noxia:radiology:relation:references:cbf:cbf | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:references:cbv:cbv | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:references:cmro2:cmro2 | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:references:core-lab:noxia-cardiac-mri | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:references:dicom-tags:dicom | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:references:eacvi-biomarker-reproducibility:ecv | EVIDENCE_MENTION | PRESERVED_AS_MENTION_CANDIDATE_WITHOUT_EVIDENCE_LINK | Non | The repository establishes a documentary mention only; no assertion revision exists to receive an EvidenceLink. |
| noxia:radiology:relation:references:ecv:ecv | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:references:late-enhancement:late-gadolinium-enhancement | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:references:mtt:mtt | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:references:oef:oef | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:references:scmr-cardiac-mri-standardisation:cardiac-mapping | EVIDENCE_MENTION | PRESERVED_AS_MENTION_CANDIDATE_WITHOUT_EVIDENCE_LINK | Non | The repository establishes a documentary mention only; no assertion revision exists to receive an EvidenceLink. |
| noxia:radiology:relation:related_to:covert-mi:covert-mi | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:supports:cardiac:cardiac-quantification-demo | UNRESOLVED | DEFERRED_OVERLOADED_SUPPORTS_SEMANTICS | Non | SUPPORTS is overloaded in the historical graph and cannot be treated as scientific support without a source-to-assertion EvidenceLink. |
| noxia:radiology:relation:supports:corelab:noxia-cardiac-mri | UNRESOLVED | DEFERRED_OVERLOADED_SUPPORTS_SEMANTICS | Non | SUPPORTS is overloaded in the historical graph and cannot be treated as scientific support without a source-to-assertion EvidenceLink. |
| noxia:radiology:relation:supports:ct-scan:ct-quantification-demo | UNRESOLVED | DEFERRED_OVERLOADED_SUPPORTS_SEMANTICS | Non | SUPPORTS is overloaded in the historical graph and cannot be treated as scientific support without a source-to-assertion EvidenceLink. |
| noxia:radiology:relation:supports:dicom-audit:dicom-audit | UNRESOLVED | DEFERRED_OVERLOADED_SUPPORTS_SEMANTICS | Non | SUPPORTS is overloaded in the historical graph and cannot be treated as scientific support without a source-to-assertion EvidenceLink. |
| noxia:radiology:relation:supports:mimi:noxia-cardiac-mri | EVIDENCE_MENTION | PRESERVED_AS_MENTION_CANDIDATE_WITHOUT_EVIDENCE_LINK | Non | SUPPORTS is overloaded in the historical graph and cannot be treated as scientific support without a source-to-assertion EvidenceLink. |
| noxia:radiology:relation:supports:multicentric-harmonization:multicentric-harmonization | UNRESOLVED | DEFERRED_OVERLOADED_SUPPORTS_SEMANTICS | Non | SUPPORTS is overloaded in the historical graph and cannot be treated as scientific support without a source-to-assertion EvidenceLink. |
| noxia:radiology:relation:supports:multicentric-harmonization:multicentric-quantification | UNRESOLVED | DEFERRED_OVERLOADED_SUPPORTS_SEMANTICS | Non | SUPPORTS is overloaded in the historical graph and cannot be treated as scientific support without a source-to-assertion EvidenceLink. |
| noxia:radiology:relation:supports:neuro-oncology:neuro-oncology-segmentation | UNRESOLVED | DEFERRED_OVERLOADED_SUPPORTS_SEMANTICS | Non | SUPPORTS is overloaded in the historical graph and cannot be treated as scientific support without a source-to-assertion EvidenceLink. |
| noxia:radiology:relation:supports:perfusion-segmentation:perfusion-segmentation-demo | UNRESOLVED | DEFERRED_OVERLOADED_SUPPORTS_SEMANTICS | Non | SUPPORTS is overloaded in the historical graph and cannot be treated as scientific support without a source-to-assertion EvidenceLink. |
| noxia:radiology:relation:supports:quality-control:quality-control | UNRESOLVED | DEFERRED_OVERLOADED_SUPPORTS_SEMANTICS | Non | SUPPORTS is overloaded in the historical graph and cannot be treated as scientific support without a source-to-assertion EvidenceLink. |
| noxia:radiology:relation:supports:quantitative-engineering:quantitative-imaging | UNRESOLVED | DEFERRED_OVERLOADED_SUPPORTS_SEMANTICS | Non | SUPPORTS is overloaded in the historical graph and cannot be treated as scientific support without a source-to-assertion EvidenceLink. |
| noxia:radiology:relation:supports:registration:multimodal-registration | UNRESOLVED | DEFERRED_OVERLOADED_SUPPORTS_SEMANTICS | Non | SUPPORTS is overloaded in the historical graph and cannot be treated as scientific support without a source-to-assertion EvidenceLink. |
| noxia:radiology:relation:supports:rhu-marvelous:noxia-cardiac-mri | EVIDENCE_MENTION | PRESERVED_AS_MENTION_CANDIDATE_WITHOUT_EVIDENCE_LINK | Non | SUPPORTS is overloaded in the historical graph and cannot be treated as scientific support without a source-to-assertion EvidenceLink. |
| noxia:radiology:relation:uses:cardiac-cine:irm | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:uses:corelab-cardiac-mri:dicom-audit | WORKFLOW_AMBIGUOUS | DEFERRED_FOR_WORKFLOW_ORDERING_REVIEW | Non | The historical edge may encode ordering or implementation; WorkflowStep and WorkflowTransition semantics cannot be inferred safely. |
| noxia:radiology:relation:uses:ct-quantification-demo:simpleitk | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:uses:dicom-anonymization:dicom | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:uses:dicom-audit:dicom | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:uses:diffusion-mri:irm | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:uses:late-gadolinium-enhancement:irm | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:uses:multimodal-registration:antspy | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:uses:multimodal-registration:elastix | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:uses:perfusion-ct:ct | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:uses:perfusion-segmentation-demo:nibabel | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:uses:perfusion-segmentation-demo:python | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:uses:quantitative-imaging:quality-control | WORKFLOW_AMBIGUOUS | DEFERRED_FOR_WORKFLOW_ORDERING_REVIEW | Non | The historical edge may encode ordering or implementation; WorkflowStep and WorkflowTransition semantics cannot be inferred safely. |
| noxia:radiology:relation:uses:t1-mapping:irm | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |
| noxia:radiology:relation:uses:t2-mapping:irm | STRUCTURAL_SAFE | MIGRATED_TO_ACTIVE_STRUCTURAL_PROJECTION | Non | The edge retains non-scientific structural, lexical or explicitly operational semantics and keeps its historical source references. |

## Tableau — familles et complétude

| Famille | Profil CATALOG | Profil SCIENTIFIC | Profil COMPARISON | État |
|---|---|---|---|---|
| Modality | COMPLET | INSUFFISANT | INSUFFISANT | CATALOG_READY |
| Manufacturer | VIDE | INSUFFISANT | INSUFFISANT | EMPTY |
| Equipment | VIDE | INSUFFISANT | INSUFFISANT | EMPTY |
| EquipmentGeneration | VIDE | INSUFFISANT | INSUFFISANT | EMPTY |
| SoftwareVersion | VIDE | INSUFFISANT | INSUFFISANT | EMPTY |
| BodySystem | COMPLET | INSUFFISANT | INSUFFISANT | CATALOG_READY |
| Organ | COMPLET | INSUFFISANT | INSUFFISANT | CATALOG_READY |
| Region | COMPLET | INSUFFISANT | INSUFFISANT | CATALOG_READY |
| Disease | COMPLET | INSUFFISANT | INSUFFISANT | CATALOG_READY |
| ClinicalQuestion | COMPLET | INSUFFISANT | INSUFFISANT | CATALOG_READY |
| Protocol | VIDE | INSUFFISANT | INSUFFISANT | EMPTY |
| Sequence | COMPLET | INSUFFISANT | INSUFFISANT | CATALOG_READY |
| SequenceFamily | COMPLET | INSUFFISANT | INSUFFISANT | CATALOG_READY |
| Biomarker | COMPLET | INSUFFISANT | INSUFFISANT | CATALOG_READY |
| Measurement | COMPLET | INSUFFISANT | INSUFFISANT | CATALOG_READY |
| Workflow | COMPLET | INSUFFISANT | INSUFFISANT | CATALOG_READY |
| Viewer | COMPLET | INSUFFISANT | INSUFFISANT | CATALOG_READY |
| Pipeline | COMPLET | INSUFFISANT | INSUFFISANT | CATALOG_READY |
| Publication | COMPLET | INSUFFISANT | INSUFFISANT | CATALOG_READY |
| Guideline | COMPLET | INSUFFISANT | INSUFFISANT | CATALOG_READY |
| Recommendation | COMPLET | INSUFFISANT | INSUFFISANT | CATALOG_READY |
| CoreLab | COMPLET | INSUFFISANT | INSUFFISANT | CATALOG_READY |
| Study | COMPLET | INSUFFISANT | INSUFFISANT | CATALOG_READY |
| ResearchProject | COMPLET | INSUFFISANT | INSUFFISANT | CATALOG_READY |
| Dataset | VIDE | INSUFFISANT | INSUFFISANT | EMPTY |
| Format | COMPLET | INSUFFISANT | INSUFFISANT | CATALOG_READY |
| Standard | COMPLET | INSUFFISANT | INSUFFISANT | CATALOG_READY |
| Terminology | COMPLET | INSUFFISANT | INSUFFISANT | CATALOG_READY |
| Definition | COMPLET | INSUFFISANT | INSUFFISANT | CATALOG_READY |
| Synonym | COMPLET | INSUFFISANT | INSUFFISANT | CATALOG_READY |
| Abbreviation | COMPLET | INSUFFISANT | INSUFFISANT | CATALOG_READY |
| Tool | COMPLET | INSUFFISANT | INSUFFISANT | CATALOG_READY |
| Service | COMPLET | INSUFFISANT | INSUFFISANT | CATALOG_READY |
| Feature | COMPLET | INSUFFISANT | INSUFFISANT | CATALOG_READY |

## Tableau — cas de compétence

| Cas de compétence | Modélisable ? | Données présentes ? | Assertions vérifiées ? | Lacunes |
|---|---|---|---|---|
| Quelles publications portent sur l’ECV en IRM 3 T ? | Oui | Non | Non | FIELD_STRENGTH_DATA_ABSENT, REVIEWED_EVIDENCE_ABSENT |
| Quelles publications décrivent l’ECV en CT, avec quelles méthodes et limites ? | Oui | Non | Non | CT_ECV_METHOD_DATA_ABSENT, REVIEWED_EVIDENCE_ABSENT |
| Quels protocoles sont décrits pour la myocardite ? | Oui | Non | Non | MYOCARDITIS_ABSENT, DOCUMENTED_PROTOCOL_ABSENT, REVIEWED_EVIDENCE_ABSENT |
| Quelles différences sont rapportées entre MOLLI et SASHA ? | Oui | Non | Non | MOLLI_ABSENT, SASHA_ABSENT, REVIEWED_COMPARISON_ABSENT |
| Quelles limites sont associées aux différentes plateformes ? | Oui | Non | Non | MANUFACTURER_DATA_ABSENT, EQUIPMENT_DATA_ABSENT, SOURCED_LIMITATIONS_ABSENT |
| Afficher une publication corrigée dans l’historique des connaissances | Oui | Non | Non | EXPLICIT_CORRECTION_LOCATOR_ABSENT |
| Présenter deux publications contradictoires sans effacer le désaccord | Oui | Non | Non | REVIEWED_ASSERTIONS_ABSENT, CONTRADICTORY_EVIDENCE_ABSENT |
| Glossaire multilingue avec acronymes polysémiques | Oui | Non | Non | DESIGNATION_LANGUAGES_UNKNOWN, EXTERNAL_CODES_ABSENT |
| Fiche biomarqueur avec méthode, unité, limites et plages sourcées | Oui | Non | Non | SOURCED_UNITS_ABSENT, SOURCED_THRESHOLDS_ABSENT, REVIEWED_EVIDENCE_ABSENT |
| Arbre documentaire DICOM : standard, partie, profil, SOP Class et conformité | Oui | Non | Non | DICOM_EDITION_ABSENT, STANDARD_PARTS_ABSENT, CONFORMANCE_DOCUMENTS_ABSENT |
| Projection déterministe vers état des connaissances, FAQ, navigation et données structurées | Oui | Non | Non | REVIEWED_ASSERTIONS_ABSENT, PUBLICATION_APPROVAL_ABSENT |

## Tableau — contrats et frontières

| Contrat | Préservé ? | Test / preuve | Remarque |
|---|---|---|---|
| 118 entités | Oui | Digests payload identiques | Aucune suppression |
| 93 relations | Oui | Inventaire exhaustif | Active, différée ou désactivée |
| 9 publications | Oui | Work + Version + SourceRevision | Nulls conservés |
| 13 profils biomarqueurs | Oui | Migration qualifiée | Pas de fausse complétude |
| Pages publiques | Oui | Diff Git protégé | Aucune mutation |
| Routes / SEO / sitemap | Oui | Diff Git protégé | Aucune mutation |
| Viewers / SaaS / PACS | Oui | Frontière d’import et diff Git | Hors périmètre |
| editorial-engine | Oui | Contrôle dépôt externe | Aucune mutation |
| Données scientifiques fictives | Oui | Registres réels à 0 assertion | Fixtures uniquement dans les tests |
| Historique / rollback | Oui | Snapshot + résolveur | Aucun effacement |

SCIENTIFIC KNOWLEDGE GRAPH MIGRÉ ET VALIDÉ — PASSER À L’ENRICHISSEMENT SOURCÉ
