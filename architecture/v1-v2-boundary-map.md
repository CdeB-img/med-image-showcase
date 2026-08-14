# V1_TO_V2_MIGRATION_BOUNDARIES

## Post-Hybrid Scientific Core boundary map

| Champ | Valeur |
|---|---|
| Statut | `TRANSITION_MAP — NON_NORMATIVE — NON_ADMITTED` |
| Date d'observation | 2026-08-14 |
| Autorité conceptuelle | `docs/pd-003-v2-research-object-model.md` |
| État produit observé | lecteurs et objets V1/legacy-compatible |
| Migration automatique autorisée | `NON` |

Cette carte ne redéfinit pas PD-003 V2. Elle indique où les objets actuels doivent être arrêtés, adaptés, qualifiés ou soumis à décision avant de franchir une frontière V2.

## 1. Règle d'architecture

```text
Legacy V1 object or Hybrid candidate
              |
              v
      explicit contribution envelope
              |
              +-> unresolved / ambiguous / unsupported -> preserve and review
              |
              +-> specialized owner review (OBS, Knowledge, ST, Imaging)
              |
              v
      Human Decision Envelope
              |
              v
      Research Project V2 adoption
```

La migration est une décision et une transformation traçable, pas un renommage de types. Toute frontière conserve : owner, version, provenance, inconnues, ambiguïtés, contradictions, limites, décisions et identité de la source.

## 2. Ontologies à ne pas confondre

| Source V1 ou candidate | Cible V2 possible | Mapping | Owner de la qualification | Interdiction |
|---|---|---|---|---|
| `ScientificSemanticModel` | aucune racine V2 directe | `NO_DIRECT_MAPPING` | Scientific Interpretation pour la contribution; Project pour adoption | traiter le modèle sémantique comme Research Project |
| `CandidateScientificState` expérimental | enveloppe de contribution vers plusieurs objets V2 | `CONTRIBUTION_ONLY` | owner spécialisé puis Human Decision | importer le JSON comme modèle métier canonique |
| `BIOMARKER` legacy | `ObservableProperty` + éventuelle `MeasurementDefinition` + `BiomarkerRole` | `SPLIT_REQUIRED` | OBS | mapper un mot « biomarker » vers un objet unique |
| `METHOD` / `MODALITY` legacy | `MeasurementDefinition` ou spécialisation de méthode selon domaine | `DOMAIN_REVIEW_REQUIRED` | OBS/Imaging | confondre méthode, image quantitative et valeur mesurée |
| image quantitative candidate (map/image) | produit d'une MeasurementDefinition ou artefact d'imagerie, selon contrat spécialisé | `SPECIALIZATION_REQUIRED` | Imaging/OBS | la convertir en BiomarkerRole ou en mesure sans preuve |
| valeur mesurée / measurement candidate | valeur ou besoin de mesure ; éventuellement `VariableOccurrence` seulement après observation réelle | `CONTEXT_REQUIRED` | OBS/CDM/Data Management | créer une occurrence depuis une intention conversationnelle |
| `ENDPOINT` / `OUTCOME` legacy | critère/role de projet et `CanonicalVariable` potentielle après adoption | `PROJECT_DECISION_REQUIRED` | Research Project | promouvoir principal/secondaire automatiquement |
| hypothèse ou mécanisme ST V1 | `ScientificModel` candidat | `CANDIDATE_MAPPING` | Scientific Thinking puis Research Project | déclarer le modèle adopté sans décision |
| `PHENOMENON` Imaging V1 | phénomène dans un ScientificModel et propriétés observables associées | `MODEL_AND_OBSERVABILITY_REVIEW` | ST/OBS/Imaging | effondrer phénomène et observable |
| `ProjectVariable` V1 | `CanonicalVariable` | `EXPLICIT_MIGRATION_REQUIRED` | Research Project/CDM | identité par nom, code externe ou champ source |
| timing/visit V1 | `TemporalAnchor` + `ExpectedVariableOccasion` selon contexte | `COMPOSITION_REQUIRED` | Research Project/CDM | fabriquer une `VariableOccurrence` |
| source/data collection V1 | `StudyDataSource` subresource + `DataNeed` | `STRUCTURAL_REFACTOR_REQUIRED` | Research Project/Data Management | traiter StudyDataSource comme racine autonome si PD-003 ne le prévoit pas |
| besoin d'information | `DataNeed` | `CANDIDATE_THEN_ADOPT` | Research Project | transformer tout unknown en variable |
| contrainte d'analyse V1 | `AnalysisSpecification` candidate | `EXPLICIT_MIGRATION_REQUIRED` | Biostatistics/Research Project | confondre spécification, exécution et résultat |
| résultat d'analyse | `AnalysisResult` uniquement après exécution qualifiée | `NO_CONVERSATION_CREATION` | Biostatistics/Data Management | inférer un résultat depuis une demande ou une hypothèse |
| code/terminologie externe | `TerminologyMapping` relation | `RELATION_NOT_IDENTITY` | owner de l'objet + terminology governance | remplacer l'identité canonique par le code externe |
| état SEM `ACCEPTED` | aucune adoption V2 automatique | `HUMAN_DECISION_REQUIRED` | Human Decision + Research Project | équivalence `ACCEPTED == ADOPTED` |

## 3. Frontières de migration

### `B1 — Conversation -> Candidate Scientific State`

| Aspect | Contrat de transition |
|---|---|
| Entrée | conversation visible, contexte autorisé, état candidat précédent référencé |
| Sortie | propositions structurées, relations, statuts épistémiques, source spans, inconnues, ambiguïtés, corrections, demandes de clarification |
| Owner | Scientific Interpretation capability pour la fidélité de représentation ; utilisateur reste source de ses déclarations |
| V2 créé | aucun objet adopté |
| Autorisé | classifier comme candidat, inférence, unknown ou ambiguity ; produire des liens de contribution |
| Interdit | adopter, choisir un rôle principal, créer une occurrence, écrire Project/Knowledge/OBS |

### `B2 — Candidate State -> Knowledge request/support`

| Aspect | Contrat de transition |
|---|---|
| Entrée | inconnue ou proposition nécessitant support, contexte minimal et provenance |
| Sortie | KnowledgeResult avec assertions, preuves, limites, contradictions, applicability et identité |
| Owner | Knowledge |
| V2 créé | aucun objet Project par le seul retour Knowledge |
| Autorisé | lier un support à une proposition ; maintenir `SUPPORTED`, `CONTRADICTED`, `UNKNOWN` selon contrat |
| Interdit | attribuer la connaissance à l'utilisateur, adopter une décision ou masquer l'incertitude |

### `B3 — Candidate/Scientific Model -> OBS`

| Aspect | Contrat de transition |
|---|---|
| Entrée | ScientificModel adopté ou candidat explicitement marqué, propriétés candidates, méthodes, mesures, rôles et preuves |
| Sortie | paquet OBS versionné séparant ObservableProperty, MeasurementDefinition, valeur/mesure, BiomarkerRole, unknowns et limites |
| Owner | OBS pour la sémantique d'observation/mesure ; Research Project pour l'usage adopté |
| V2 créé | objets spécialisés seulement selon contrat OBS et état déclaré ; pas d'adoption implicite |
| Autorisé | signaler split, ambiguity ou information manquante |
| Interdit | mapper `BIOMARKER` en bloc, déduire endpoint ou variable principale, sélectionner une modalité |

### `B4 — Candidate -> Scientific Thinking`

| Aspect | Contrat de transition |
|---|---|
| Entrée | question, concepts, relations, Knowledge support, ambiguïtés et décisions ouvertes |
| Sortie | ScientificModel/hypothèses candidats avec alternatives et provenance |
| Owner | Scientific Thinking pour la formulation ; Research Project pour l'adoption |
| V2 créé | ScientificModel candidat, si le contrat futur le permet |
| Autorisé | expliciter mécanismes, modèles concurrents et conséquences testables |
| Interdit | choisir une vérité, effacer un modèle concurrent, adopter sans acteur/mandat |

### `B5 — Scientific Thinking/OBS -> Imaging`

| Aspect | Contrat de transition |
|---|---|
| Entrée | ScientificModel, ObservableProperties, besoins de mesure, contraintes et décisions Project |
| Sortie | stratégie d'imagerie candidate, MeasurementDefinitions spécialisées, analyse et limites |
| Owner | Imaging pour la conception spécialisée ; OBS pour la sémantique de mesure ; Project pour sélection |
| V2 créé | contributions/handoff spécialisés, pas Project final |
| Autorisé | comparer stratégies et documenter faisabilité/inconnues |
| Interdit | paramètres constructeur exécutables sans contrat, rôle de biomarqueur implicite, adoption automatique |

### `B6 — Human Decision Envelope -> Research Project V2`

| Aspect | Contrat de transition |
|---|---|
| Entrée | contribution mappée, findings, preuves, alternatives, actor, mandate, status, timestamp et targets |
| Sortie | version Project mise à jour ou rejet documenté du handoff |
| Owner | Research Project |
| V2 créé | uniquement les objets et relations explicitement adoptés et validés |
| Autorisé | adopter, rejeter, différer, rouvrir ; journaliser changements et dépendances |
| Interdit | écriture partielle silencieuse, défauts remplacés par null/default, support Knowledge copié comme décision |

### `B7 — Research Project -> projections/consumers`

| Aspect | Contrat de transition |
|---|---|
| Entrée | version Project, objets V2, décisions, inconnues, provenance et readiness |
| Sortie | handoffs spécialisés et projections dérivées |
| Owner | Project/source domain pour le contenu ; consumer pour sa transformation bornée |
| V2 créé | selon contrat du consumer, jamais par le renderer seul |
| Autorisé | lire, transformer, diagnostiquer et projeter avec source refs |
| Interdit | corriger Project silencieusement, inventer une valeur, masquer `NOT_GENERATABLE` ou `BLOCKED` |

## 4. État des composants face à PD-003 V2

| Composant | Objets actuels observés | Dépendance V2 cible | État de migration | Première rupture probable |
|---|---|---|---|---|
| Structured Interpreter | Semantic elements/relations ou Candidate State expérimental | contribution envelope multi-owner | `NOT_STARTED_PRODUCT` | contrat expérimental importé comme canonique |
| Research Project | V1 project, ProjectVariable, objectives, hypotheses, decisions | ResearchProject V2, CanonicalVariable, DataNeed, AnalysisSpecification, TemporalAnchor | `REALIGNMENT_REQUIRED` | mapping implicite des variables et rôles |
| Knowledge | V1 assertions/results/context packages | support traçable vers ScientificModel et autres objets | `ADAPTER_REQUIRED` | evidence devenue Project decision |
| OBS | documents/contrats, pas runtime | ScientificModel, ObservableProperty, MeasurementDefinition, BiomarkerRole | `NORMATIVE_READY_RUNTIME_DEFERRED` | absence de runtime ou objets prématurés |
| Scientific Thinking | V1 observations, intuitions, hypotheses, objectives | ScientificModel et relations | `ADAPTATION_REQUIRED` | duplication d'un modèle scientifique concurrent |
| Imaging | V1 phenomenon/biomarker/modality/acquisition graph | ScientificModel + OBS + measurement specialization | `MANDATORY_ADAPTATION` | biomarker/method/measure collapse |
| Validation | generic source/target validation artefacts | V2-aware invariants and handoffs | `V2_QUALIFICATION_REQUIRED` | diagnostic incomplet sur split objects |
| Document Projection | V1 Project/readiness/template inputs | projections from versioned V2 Project | `ADAPTER_REQUIRED` | sections rendues depuis objets legacy incomplets |
| Template Engine | definitions/sections/relations | configuration only; consumes V2 readiness indirectly | `LIMITED_MAPPING` | template présenté comme owner |
| Regulatory | context/requirements/results | mappings to Project decisions and document requirements | `LIMITED_MAPPING` | applicability promoted without decision |
| QRY | boundary contract only | unknowns, decisions, dependency graph from V2 Project | `RUNTIME_DEFERRED` | question generation before state stabilization |
| Adaptive Workspace | V1 local session and specialized views | projection of living V2 Project | `REDESIGN_AFTER_CONTRACTS` | UI state diverges from Project |

Les états ci-dessus suivent les matrices PD-003 V2 existantes. Ils ne constituent pas une nouvelle admission.

## 5. Contribution envelope minimale

Le futur adaptateur ne doit pas produire directement des objets adoptés. Une enveloppe de contribution, dont les noms définitifs devront être arbitrés par l'autorité du contrat produit, doit au minimum porter :

- identité et version de la source ;
- runtime, provider/model, prompt/schema et digests applicables ;
- source spans et références au brut ;
- objet ou concept source V1/candidat ;
- type(s) V2 proposé(s), jamais implicites ;
- statut de mapping : exact, split required, composition required, ambiguous, unsupported ou deferred ;
- owner de qualification requis ;
- relations et polarités ;
- statut épistémique ;
- inconnues, ambiguïtés, contradictions et limites ;
- findings Audit/VAL liés sans les fusionner ;
- Human Decision Envelope associé ;
- disposition Project et trace de version.

Cette liste est une exigence de frontière de transition, pas un nouveau type PD-003.

## 6. V1 compatibility boundary

La coexistence transitoire doit appliquer quatre règles :

1. les objets V1 restent lisibles sous leur identité/version d'origine ;
2. un adapter V1 ne doit jamais annoncer une conformité V2 qu'il ne possède pas ;
3. les champs nouveaux non dérivables restent inconnus ou `MAPPING_INCOMPLETE`, jamais complétés par défaut ;
4. toute mutation durable se fait dans l'owner V2, puis les vues V1 éventuelles deviennent des projections de compatibilité en lecture.

### Compatibilité autorisée

- afficher ou tester un artefact V1 inchangé ;
- référencer son digest dans une nouvelle trace ;
- projeter un sous-ensemble explicitement mappé ;
- maintenir un facade aval pendant la migration ;
- comparer V1 et V2 sur des obligations scientifiques.

### Compatibilité interdite

- réécrire rétroactivement un artefact V1 avec une identité V2 ;
- déclarer une conversion totale à partir d'un mapping lexical ;
- transformer `null`/absence en choix ;
- déduire une VariableOccurrence d'une variable prévue ;
- utiliser l'acceptation SEM comme mandat d'adoption ;
- garder deux sources de vérité Project concurrentes.

## 7. Ruptures par consumer

| Consumer | Dépendance V1 à retirer | Nouvelle frontière | Condition de cutover |
|---|---|---|---|
| Protocol Designer intake | `ScientificSemanticModel` accepted + semanticSnapshot legacy | Candidate session + contribution envelope + compatibility identity | open/resume/history et provenance testés |
| Scientific Thinking | `semanticModelRef`, population/intervention/outcome lists | context package + ScientificModel candidates | alternatives, ownership and decisions preserved |
| Imaging | ST V1 graph with PHENOMENON/BIOMARKER/MODALITY | ST/OBS handoff | method/image/measurement/role split validated |
| Research Project | ValidatedIntent/ST/Imaging V1 inputs | Human-reviewed V2 contribution | no write without actor/mandate; rollback tested |
| Knowledge | SEM element types and route | independent KnowledgeRequest | support linkage and no promotion tested |
| Validation | generic artefact views without all V2 splits | V2-aware source/target adapters | new invariants and PD-011 protocol available |
| Documents | V1 project/readiness | versioned V2 Project projection | all section statuses truthful and traceable |
| QRY | no runtime/current state interface | explicit state/unknown/decision query boundary | answered-question history and STOP/FINISH policy qualified |
| Workspace | local SEM/session state | Project projection + Candidate review surface | UI cannot mutate owner state directly |

## 8. Decision points before implementation

| Decision | Why unresolved | Owner required |
|---|---|---|
| product identity of Candidate Scientific State | experimental model must not become a competing business model by accident | PD-003/Product architecture governance |
| split rules for legacy semantic types | several V1 types map to compositions or roles | OBS/ST/Imaging/Project owners |
| mapping state vocabulary | must align with existing contracts and validation | Product architecture + VAL |
| Human Decision targets | contribution, individual object, relation and package need explicit granularity | Research Project governance |
| compatibility duration | downstream migration order is not yet validated | Product/engineering governance |
| Project write transaction | atomicity, partial rejection and rollback are not specified here | Research Project owner |
| QRY timing | needs stable Candidate/Project boundary | PD-009 owner |
| PD-011 qualification design | must evaluate semantic obligations without exact-topology overfit | Evaluation governance |

## 9. Validation obligations for a future migration

The future implementation must demonstrate, at minimum:

- every V1 source object is preserved or has an explicit disposition;
- no one-to-one mapping is used where PD-003 V2 requires split/composition;
- provenance and raw evidence remain reconstructible;
- rejected, superseded, unknown, ambiguous and contradictory states survive;
- no `VariableOccurrence` or `AnalysisResult` is created from prospective conversation state;
- no Knowledge/OBS/ST/Imaging contribution becomes Project state without Human Decision;
- Project writes are atomic, versioned and reversible according to the future contract;
- legacy readers either continue behind a tested facade or are explicitly retired;
- VAL detects lost decisions and ownership violations;
- qualification compares scientific obligations and invariants, not exact JSON identity.

## 10. Current terminal state

| Boundary | Status |
|---|---|
| V1 inventory | `OBSERVED` |
| V2 target authority | `AVAILABLE` |
| conceptual boundary map | `DEFINED_WITH_LIMITATIONS` |
| product contribution contract | `NOT_ADMITTED` |
| adapter implementation | `NOT_STARTED` |
| Project V2 write | `NOT_AUTHORIZED` |
| migration qualification | `NOT_STARTED` |

No code migration or Project mutation is authorized by this map.
