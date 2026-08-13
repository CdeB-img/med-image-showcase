# PD-003 V2 — Engine Impact Matrix

## Analyse normative des impacts sur les moteurs et futures briques

| Champ | Valeur |
|---|---|
| Document | Annexe normative de PD-003 V2 |
| Version | 2.0 |
| État | OFFICIAL — analyse d'impact, sans implémentation |
| Date d'analyse | 12 août 2026 |
| Source de vérité | `docs/pd-003-v2-research-object-model.md` |

## 1. Règle de lecture

Cette matrice distingue quatre plans : autorité normative actuelle ; état documentaire ou implémenté constaté ; cible imposée par PD-003 V2 ; preuve requise avant déclaration de conformité.

`COMPATIBLE_IN_PRINCIPLE` signifie que la mission et les frontières du moteur restent valides. Ce statut ne signifie ni implémentation V2, ni test réussi, ni activation, ni publication. Aucun moteur n'est modifié par cette admission.

## 2. Matrice des moteurs et capacités

| Moteur / capacité | Autorité consultée | État réellement constaté avant adaptation V2 | Impact V2 obligatoire | Owner de l'adaptation | Gate de conformité | Non-régression à préserver | Statut d'impact |
|---|---|---|---|---|---|---|---|
| Knowledge | Scientific Knowledge Catalog ; Scientific Assertion Layer ; Scientific Knowledge Graph | Concepts, assertions, preuves, relations, validité et provenance déjà séparés ; aucun ScientificModel canonique admis comme remplacement de Knowledge | exposer des paquets référencés par `REFERENCES_KNOWLEDGE`; préserver contradictions et alternatives ; ne pas absorber ScientificModel, ObservableProperty ou choix Project | Knowledge | identités/version/provenance préservées ; aucun fait créé par consommation | Knowledge reste source de concepts et assertions, pas de décision projet | `COMPATIBLE_IN_PRINCIPLE` |
| Scientific Thinking | RDE-001 ; PD-009 | Produit raisonnement, options, incertitudes et enveloppes de décision ; structures historiquement compatibles V1 | pouvoir proposer ScientificModels, DataNeeds et objections sans les adopter ; distinguer hypothèse, modèle et décision ; référencer les objets V2 | Scientific Thinking | action attendue et décideur explicites ; aucun objet adopté sans décision | recommandation ≠ décision ; contribution ≠ vérité | `COMPATIBLE_IN_PRINCIPLE_ADAPTATION_REQUIRED` |
| Scientific Evolution | RDE-002 | Suit évolutions, contradictions et impacts | inclure `SUPERSEDES`, versions, mappings V1/V2 et impacts sur occurrences/résultats ; ne pas réécrire l'histoire | Scientific Evolution | chaîne de supersession acyclique et impact documenté | événement d'évolution ≠ mutation silencieuse | `COMPATIBLE_IN_PRINCIPLE_ADAPTATION_REQUIRED` |
| Imaging Study Designer | RDE-003 ; IMG-001 ; IMG-001B | Architecture spécialisée admise autour de Phénomène–Biomarqueur–Modalité, définitions d'acquisition et handoffs projet | remplacer la chaîne ambiguë par ScientificModel/ObservableProperty/MeasurementDefinition/BiomarkerRole/DataNeed ; garder Modalité, Acquisition, QC et Lecture comme spécialisations du domaine ; produire un handoff sans choisir à la place du projet | Imaging avec OBS et ResearchProject | cas A et étude sans imagerie ; absence d'imagerie obligatoire par défaut ; mapping legacy explicite | owner spécialisé Imaging conservé ; aucune recommandation clinique | `COMPATIBLE_WITH_MANDATORY_MODEL_ADAPTATION` |
| Research Project Construction | PRJ-001 | Construction de projet, contributions et décisions humaines déjà séparées ; vocabulaire V1 | adopter ScientificModels et BiomarkerRoles contextualisés ; posséder DataNeeds et CanonicalVariables ; recevoir handoffs ; conserver Human Decision Envelope | ResearchProject | même identité canonique projetée en CRF/Data Dictionary/SAP ; décisions humaines traçables | Dossier/ResearchProject et historique des décisions préservés | `COMPATIBLE_IN_PRINCIPLE_ADAPTATION_REQUIRED` |
| Regulatory Intelligence | REG-001 | Résolution de requirements avec statut, applicabilité, sources et limites ; pas d'autorité scientifique globale | référencer les objets V2 concernés ; distinguer requirement, contrainte, TerminologyMapping et décision Project ; ne pas promouvoir une résolution réglementaire en vérité scientifique | REG | applicabilité datée et sourcée ; owner scientifique inchangé | REG ne devient owner ni d'une mesure ni d'une variable | `COMPATIBLE_IN_PRINCIPLE` |
| Study Template | TMP-001 | Composition logique de structure, sans rendre le document final ; dépend de définitions amont | accepter CanonicalVariables, DataNeeds, occasions temporelles et profils comme références ; ne pas créer d'occurrences ou de sens scientifique | TMP avec ResearchProject | structure reproductible et identités conservées | template ≠ projet ; structure ≠ données ; TMP ≠ DOC | `COMPATIBLE_IN_PRINCIPLE_ADAPTATION_REQUIRED` |
| Document Pattern | DOC-002 | Définit patterns et contrats documentaires, sans être source scientifique | prévoir les nouveaux objets, statuts, limites, preuves, mappings et badges legacy ; ne pas masquer non-évaluabilité ou incertitude | DOC-002 | couverture des objets V2 nécessaires ; règles d'omission explicites | pattern ≠ contenu ; affichage ≠ statut métier | `COMPATIBLE_IN_PRINCIPLE_ADAPTATION_REQUIRED` |
| Document Engine | DOC-001B, consultation externe en lecture seule | Projection/rendu documentaire ; état développé hors checkout courant ; aucune conformité V2 prouvée dans cette mission | projeter identités/version/owner/provenance ; montrer limites, legacy et mappings ; conserver liens vers source | DOC | golden documents V1/V2 ; reproductibilité ; aucune information critique perdue | document ≠ source de vérité ; dérivé ≠ maître | `NOT_YET_QUALIFIED_FOR_V2` |
| Validation Engine | VAL-000, consultation externe en lecture seule ; PD-011 | Qualification/diagnostics sous gates ; aucune campagne V2 effectuée | vérifier 28 invariants V2, crosswalk 68/68, 12 cas, owners, relations, statuts d'absence et non-promotion | VAL | framework PD-011, jeux de référence gelés, seuils et décision formelle | diagnostic ≠ correction ; OFFICIAL documentaire ≠ PASS scientifique | `NOT_YET_QUALIFIED_FOR_V2` |
| Semantic / Research Design Model | SEM-001 / SKM-000 / PD-003R1 comme travaux candidats consultés | Travaux exploratoires ont motivé les séparations ; ils ne sont pas l'autorité normative finale | réaligner leurs catégories sur les classifications admises ; ne pas importer automatiquement les structures candidates ; préserver campagne/configuration si évaluée | owner SEM / gouvernance concernée | crosswalk explicite entre structures candidates et PD-003 V2 ; nouvelle évaluation si configuration change | candidat ≠ norme ; résultat incomplet ≠ preuve | `REALIGNMENT_REQUIRED` |
| Protocol Designer UX | PD-004 | UX officielle fondée sur preuve, incertitude, progressive disclosure et décision humaine ; vocabulaire antérieur à l'admission V2 | rendre visibles couche, owner, statut, preuve, limite, version et mapping ; proposer vues débutant/expert sans supprimer la complexité ; afficher DataNeed non couvert | Product/UX sous PD-004 | tests des cas A-L, accessibilité, aucune option critique masquée | simplification d'affichage ≠ simplification métier | `COMPATIBLE_IN_PRINCIPLE_ADAPTATION_REQUIRED` |
| Prompt Library / rôles | PD-005 | Contrats de rôles et garde-fous, sans prompts détaillés comme norme métier | ajouter les objets V2 aux entrées/sorties autorisées ; interdire les promotions automatiques et exiger UNKNOWN/NEW_MAPPING_REQUIRED | gouvernance PD-005 | tests des frontières de rôle et de refus | prompt ≠ décision ; rôle moteur ≠ owner métier | `COMPATIBLE_IN_PRINCIPLE_ADAPTATION_REQUIRED` |
| Decision Engine | PD-009 | Next action, options et enveloppe de décision humaine ; owner des transitions, pas des objets scientifiques | reconnaître décisions d'adoption/mapping/supersession ; ne pas décider un BiomarkerRole, une variable ou une interprétation sans humain mandaté | Decision Engine | actor/mandate/rationale/evidence/alternatives/uncertainty complets | next action ≠ contenu scientifique ; recommandation ≠ adoption | `COMPATIBLE_IN_PRINCIPLE_ADAPTATION_REQUIRED` |
| Evaluation Framework | PD-011 | Autorité des évaluations et gates | définir campagnes V2 distinctes, critères par couche et tests de compatibilité legacy ; ne pas réutiliser un PASS V1 | Evaluation governance | protocole gelé, résultats complets, limites et décision formelle | conformité documentaire ≠ qualification scientifique/produit | `COMPATIBLE_IN_PRINCIPLE_ADAPTATION_REQUIRED` |

### 2.1 Matrice de décision d'adaptation

| Engine | Current contract | V2 impact | Breaking? | Adapter needed? | Normative dependency | Implementation required? | Evaluation required? |
|---|---|---|---|---|---|---|---|
| SEM | reconstruction/campagnes sémantiques sous identité propre | réaligner catégories et mappings sur PD-003 V2 | oui pour toute écriture V2 ; non pour replay gelé | oui | PD-003 V2, PD-011 | oui avant revendication V2 | oui, nouvelle campagne si configuration change |
| Knowledge | concepts, assertions, preuves, relations et provenance | fournir références sans devenir Models/OBS/Project | non pour Knowledge ; oui pour nouveaux handoffs | oui | Catalog, Assertion Layer, Knowledge Graph, PD-003 V2 | oui pour handoff V2 | oui |
| Scientific Thinking | options, raisonnement et décision humaine | proposer Models/DataNeeds sans adoption implicite | oui pour sorties V1 ambiguës | oui | RDE-001, PD-009, PD-003 V2 | oui | oui |
| Imaging | chaîne Phénomène–Biomarqueur–Modalité spécialisée | adopter ObservableProperty/MeasurementDefinition/BiomarkerRole/DataNeed | oui sémantiquement | oui, obligatoire | RDE-003, OBS futur, PD-003 V2 | oui | oui |
| Research Project | agrégat projet, contributions, décisions | posséder modèles adoptés, DataNeeds, CanonicalVariables | oui pour writers et projections | oui | PRJ-001, PD-009, PD-003 V2 | oui | oui |
| REG | résolution de requirements et applicabilité | référencer objets V2, garder l'owner réglementaire borné | non pour mission ; oui pour mappings V2 | oui, limité | REG-001, PD-003 V2 | oui pour conformité V2 | oui |
| DOC-002 | patterns documentaires | couvrir nouveaux objets, axes et états legacy | non pour patterns historiques ; oui pour patterns V2 | oui | DOC-002, PD-004, PD-003 V2 | oui | oui |
| TMP | composition de structure | référencer identités V2 sans créer de contenu | oui pour templates V2 | oui | TMP-001, DOC-002, PD-003 V2 | oui | oui |
| DOC | projection/rendu | rendre versions, owners, provenance, limites et legacy | oui pour documents déclarés V2 | oui | DOC-001B, PD-004, PD-003 V2 | oui | oui |
| VAL | diagnostics/qualification | évaluer 28 invariants, 68 mappings et cas A-L | oui pour une campagne V2 | oui | VAL-000, PD-011, PD-003 V2 | oui | oui, constitutif |
| future OBS | non admis/non implémenté | gouverner ObservableProperty, MeasurementDefinition, BiomarkerRole | nouvelle brique | non applicable avant spécification | Manifesto V2, PD-003 V2 | non dans cette mission ; ultérieurement oui | oui |
| future CDM | non admis/non implémenté | représenter VariableOccurrence, sources, temps, provenance, lignage | nouvelle brique | non applicable avant spécification | Manifesto V2, PD-003 V2, OBS selon dépendance | non dans cette mission ; ultérieurement oui | oui |
| future Data Management | responsabilités à formaliser | structure, transformations, qualité, gel et lignage V2 | oui pour contrats V2 | oui | CDM futur, PD-003 V2 | oui après norme dédiée | oui |
| future Biostatistics | responsabilités à formaliser | séparer specification/execution/result/interpretation | oui pour contrats V2 | oui | CDM futur, PD-003 V2, PD-011 | oui après norme dédiée | oui |

`Breaking?` qualifie la rupture du contrat de consommation/écriture V2, pas la validité historique du moteur. Un adapter n'est pas une migration de données et ne peut pas être déclaré présent sans preuve d'implémentation.

## 3. Futures briques explicitement impactées

| Future brique | Entrées normatives PD-003 V2 | Responsabilité cible | Interdictions | Livrable préalable à l'implémentation | État |
|---|---|---|---|---|---|
| OBS-001 | ScientificModel référencé, ObservableProperty, MeasurementDefinition, BiomarkerRole, preuves, limites, gaps | gouverner observabilité et définition de mesure ; produire des rôles candidats | créer une CanonicalVariable Project ; déclarer un rôle valide par mesurabilité seule ; choisir une modalité avant le besoin | spécification normative OBS-001, taxonomies de statuts, ownership détaillé, cas de mesure multimodale | `AUTHORIZED_TO_SPECIFY_NOT_TO_IMPLEMENT` |
| CDM-001 | DataNeed, CanonicalVariable, TemporalAnchor, ExpectedVariableOccasion, VariableOccurrence, StudyDataSource, Biospecimen, TerminologyMapping | définir représentation canonique des données et lignage sans changer le sens scientifique | assimiler champ/colonne à variable ; aplatir missingness ; réétiqueter les occurrences historiques | spécification normative CDM-001, règles d'identité/version, mapping legacy, jeux d'exemples | `AUTHORIZED_TO_SPECIFY_NOT_TO_IMPLEMENT` |
| Data Management | CanonicalVariables, occasions, sources, occurrences, statuts, transformations, provenance | collecte, conservation, qualité, gel et traçabilité | devenir owner d'un DataNeed ou d'une définition scientifique ; confondre absent/invalide/négatif | manuel de gouvernance, contrôles, dictionnaire de statuts, responsabilités site/source | `NORMATIVE_WORK_REQUIRED` |
| Biostatistics | Question, hypothèse, DataNeeds, CanonicalVariables, occurrences gelées, AnalysisSpecification, AnalysisResult | spécifier/exécuter les analyses et qualifier résultats/incertitudes | modifier les variables ; décider le rôle biomarqueur ; produire l'interprétation humaine implicitement | architecture normative Analyse, contrats de gel, résultats complexes, décisions d'interprétation | `NORMATIVE_WORK_REQUIRED` |

## 4. Impacts par objet V2

| Objet / construction | Producteurs légitimes | Consommateurs principaux | Adaptation minimale commune |
|---|---|---|---|
| ScientificModel | gouvernance Models, contribution Knowledge/ST | OBS, Project, domaines, Biostatistics | référence versionnée, alternatives, statut, adoption séparée |
| ObservableProperty | OBS | définitions de mesure, rôles, Project | ne pas l'assimiler au phénomène ou au biomarqueur |
| MeasurementDefinition | OBS/domaines | Project, acquisitions, variables | conditions, unités, méthode, limites, version |
| BiomarkerRole | OBS/gouvernance, adoption Project | design, analyses, documents | contexte complet et preuve ; pas de type Biomarqueur courant |
| DataNeed | Project | variables, sources, acquisitions, analyses | motivation et couverture explicites ; gaps visibles |
| CanonicalVariable | Project | TMP, DOC, CDM, Data Management, Biostatistics | même identité dans toutes les projections |
| VariableOccurrence | systèmes sous mandat / Data Management | analyses, contrôle, documents autorisés | variable/version, temps, sujet, source, statut, lignage |
| Biospecimen | domaine Biobanking | mesures, occurrences, analyses | identité matérielle, chaîne de garde et dérivations |
| AnalysisResult | domaine analytique | humain, Project, DOC, VAL | exécution/intrants/incertitude ; aucune conclusion automatique |
| TerminologyMapping | owner identité + terminologie | échanges, REG, DOC, VAL | standard/version/équivalence/contexte/exclusions |

## 5. Gates transversaux de conformité V2

Un moteur ne peut être déclaré conforme PD-003 V2 que si les preuves suivantes sont admises :

1. inventaire des objets lus, créés, modifiés et projetés ;
2. version et owner visibles pour chaque objet ;
3. traitement explicite des 68 objets V1 et du type Biomarqueur legacy ;
4. prise en charge ou refus explicite des 7 nouveaux objets racines ;
5. respect des classifications ROLE, RELATION, VALUE_OBJECT et SUBRESOURCE ;
6. test des 20 relations structurantes et des contraintes de graphe pertinentes ;
7. test des douze cas A à L ;
8. distinction absence, non-collecte, non-applicabilité, non-évaluabilité, invalidité et résultat négatif ;
9. preuve de non-promotion entre chaque couche ;
10. preuve de compatibilité V1 en lecture et d'absence de migration silencieuse ;
11. validation sous PD-011 avec configuration, corpus et décision gelés ;
12. décision humaine d'activation distincte de l'admission documentaire.

## 6. Ordre d'adaptation recommandé par dépendance normative

1. Spécifier OBS-001 à partir des objets admis, sans implémentation implicite.
2. Spécifier CDM-001 et les frontières Data Management.
3. Spécifier l'architecture Analyse/Biostatistics séparant spécification, exécution, résultat et interprétation.
4. Mettre à jour les contrats des moteurs consommateurs et leurs projections.
5. Définir une campagne PD-011 V2 indépendante.
6. N'autoriser une migration ou activation qu'après admission des spécifications et qualification complète.

Cet ordre est justifié par la dépendance : les consommateurs ne peuvent être qualifiés avant la définition des objets dont ils doivent préserver le sens.

## 7. Limites et décisions non prises

- Aucun code, schéma, type produit, API, runtime, interface ou donnée n'a été inspecté ou modifié comme preuve d'implémentation V2.
- Les statuts ci-dessus sont des conclusions d'impact documentaire, non des résultats de test.
- L'owner organisationnel final de Scientific Models et les contrats complets OBS/CDM/Analysis restent à admettre.
- Aucune configuration de campagne existante ne doit être réutilisée après changement sémantique sans nouvelle identité d'évaluation.

`PD003_V2_ENGINE_IMPACT_ANALYSIS_COMPLETE_WITH_LIMITATIONS`
