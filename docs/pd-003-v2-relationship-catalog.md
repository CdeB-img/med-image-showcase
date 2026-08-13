# PD-003 V2 — Relationship Catalog

## Catalogue normatif des relations métier

| Champ | Valeur |
|---|---|
| Document | Annexe normative de PD-003 V2 |
| Version | 2.0 |
| État | OFFICIAL — avec limitations explicites |
| Date d'effet documentaire | 12 août 2026 |
| Source de vérité | `docs/pd-003-v2-research-object-model.md` |

## 1. Statut d'une relation

Une relation est une assertion métier typée entre deux identités. Elle n'est ni une phrase libre, ni une proximité graphique, ni une clé de stockage. Elle peut être versionnée, contestée, limitée à un contexte, soutenue par des preuves et remplacée sans effacer son histoire.

Chaque instance de relation doit conserver au minimum :

- son type et son identité locale ou canonique ;
- les identités et versions de ses extrémités ;
- l'owner de l'assertion relationnelle ;
- le contexte, la période de validité et le domaine d'applicabilité ;
- le statut épistémique et le statut d'adoption dans le projet, lorsqu'ils s'appliquent ;
- la provenance, les preuves, contradictions, limites et décisions associées ;
- la relation de supersession lorsqu'une version la remplace.

La cardinalité ci-dessous est conceptuelle. Elle exprime ce que le modèle autorise ; elle ne prescrit aucune base de données ni implémentation.

## 2. Relations structurantes V2

| Relation | Source | Cible | Cardinalité conceptuelle | Owner de l'assertion | Justification et invariant |
|---|---|---|---|---|---|
| `REFERENCES_KNOWLEDGE` | ScientificModel, ResearchProject, AnalysisSpecification ou autre objet scientifique | Connaissance, Source, Preuve, Synthèse, Controverse, État effectif | N:N | owner de l'objet source, sous règles Knowledge | Une construction doit citer la connaissance qu'elle utilise sans s'en déclarer owner. Référencer ne vaut ni valider ni adopter. |
| `COMPOSES` | ScientificModel ou composition explicitement gouvernée | composant du modèle, sous-modèle ou proposition | 1:N ; un composant peut appartenir à plusieurs compositions versionnées | gouvernance Scientific Models | Rend la structure explicite. Une simple proximité ou cooccurrence ne compose rien. |
| `MODELS` | ScientificModel | Phénomène biologique, mécanisme, état, transition ou système cible | N:N | gouvernance Scientific Models | Sépare représentation scientifique et réalité visée. Un modèle ne prouve pas l'existence ni la causalité de sa cible. |
| `OBSERVABLE_BY` | Phénomène biologique, Phénotype ou composant de ScientificModel | ObservableProperty | N:N | OBS avec contribution Knowledge/Models | Établit ce qui peut renseigner une cible. Elle ne garantit ni mesure disponible ni validité biomarqueur. |
| `MEASURED_BY` | ObservableProperty | MeasurementDefinition | N:N | OBS ou domaine de mesure compétent | Une propriété peut avoir plusieurs définitions de mesure non interchangeables ; une mesure ne vaut que dans ses conditions. |
| `HAS_BIOMARKER_ROLE` | ObservableProperty | BiomarkerRole | 1:N contextualisé | gouvernance du rôle, adoption par ResearchProject | Évite de réifier « biomarqueur » comme substance universelle. Le rôle dépend du phénomène, usage, population, temps et mesure. |
| `INDICATES` | BiomarkerRole | phénomène, état, risque, réponse ou autre cible scientifique | N:N contextualisé | gouvernance du rôle | L'indication est une hypothèse qualifiée par preuves et limites, jamais une causalité ni une validité universelle implicite. |
| `MOTIVATES_DATA_NEED` | Question, Objectif, Hypothèse, ScientificModel adopté, Décision ou règle méthodologique | DataNeed | N:N | ResearchProject | Tout besoin de données doit avoir une raison scientifique traçable. La disponibilité d'une donnée ne suffit pas. |
| `COVERS_DATA_NEED` | CanonicalVariable, ensemble de variables, Biospecimen prévu ou source qualifiée | DataNeed | N:N, couverture partielle autorisée et explicitée | ResearchProject / Study Design | Rend visibles couverture partielle, redondance et gap. La présence d'un champ ne prouve pas la couverture. |
| `OPERATIONALIZES` | CanonicalVariable, Acquisition, procédure ou construction de design | MeasurementDefinition, ObservableProperty ou DataNeed | N:N contextualisé | ResearchProject avec owner du domaine | Relie définition générale et choix concret sans les fusionner. L'opérationnalisation exige une décision de projet. |
| `EXPECTED_AT` | CanonicalVariable ou Biospecimen attendu | ExpectedVariableOccasion / TemporalAnchor | 1:N | ResearchProject / Study Design | Distingue planification temporelle et réalisation. Une attente ne crée aucune valeur. |
| `REALIZES` | VariableOccurrence | CanonicalVariable | N:1 ; exactement une version canonique par occurrence | ResearchProject pour le sens ; producteur pour la réalisation | Toute valeur ou statut d'absence doit pointer la définition qui lui donne sens. Une occurrence ne redéfinit pas sa variable. |
| `DERIVED_FROM` | VariableOccurrence dérivée, AnalysisResult ou autre produit autorisé | VariableOccurrence, AnalysisResult, Biospecimen ou source amont | N:N acyclique dans une version de lignage | owner du produit dérivé | Rend le lignage reproductible. Une dérivation doit conserver méthode, version et intrants ; les cycles sont refusés. |
| `COLLECTED_FROM` | VariableOccurrence ou Biospecimen enfant | StudyDataSource, sujet, site, dispositif, prélèvement ou Biospecimen parent | N:1 ou N:N selon nature, qualifié | owner de la collecte / Data Management | Sépare origine matérielle, origine informationnelle et propriétaire. L'accès à une source ne prouve pas l'origine d'une valeur. |
| `PRODUCED_BY` | VariableOccurrence ou AnalysisResult | acquisition, lecture, laboratoire, AnalysisExecution, système ou acteur mandaté | N:1 principal, N:N contributions | owner du processus producteur | Rend le producteur explicite sans lui transférer le sens scientifique de l'objet produit. |
| `CONSUMED_BY_ANALYSIS` | CanonicalVariable, VariableOccurrence, population, modèle ou résultat intermédiaire | AnalysisSpecification / AnalysisExecution | N:N | owner de l'analyse | Distingue entrée prévue et entrée effectivement consommée, avec versions et gel. Une variable disponible n'est pas automatiquement analysée. |
| `PRODUCES_RESULT` | AnalysisExecution | AnalysisResult | 1:N | owner de l'analyse | Le résultat dépend d'une exécution identifiable. Une spécification seule ne produit aucun résultat. |
| `INTERPRETED_BY` | AnalysisResult, preuve ou ensemble de résultats | ScientificInterpretation composée d'une règle, justification et décision humaine | N:N | humain mandaté / ResearchProject | Empêche la promotion d'un calcul en conclusion. Toute interprétation engageante identifie le décideur et ses limites. |
| `MAPPED_TO_STANDARD` | identité NOXIA canonique | concept/code externe via TerminologyMapping | N:N versionné | owner de l'identité NOXIA avec gouvernance terminologique | Un mapping conserve standard, version, équivalence, contexte et exclusions. Même libellé ne signifie pas même identité. |
| `SUPERSEDES` | nouvelle version d'objet ou de relation | version antérieure | N:1 direct ; chaîne acyclique | owner de l'identité | Préserve l'histoire et indique le remplacement. Superséder n'efface pas et ne migre pas les occurrences silencieusement. |

## 3. Relations temporelles et de réalisation complémentaires

| Relation | Source → cible | Règle normative |
|---|---|---|
| `ANCHORED_TO` | TemporalAnchor → événement/référentiel | Le référentiel, la direction, l'unité et la tolérance sont explicites ; « J7 » isolé est insuffisant. |
| `OCCURRED_AT` | VariableOccurrence → temps observé | Le temps réellement observé reste distinct de l'occasion attendue. |
| `FULFILLS_OCCASION` | VariableOccurrence → ExpectedVariableOccasion | La réalisation peut être conforme, hors fenêtre, partielle, invalide, absente ou non évaluable. |
| `HAS_STATUS` | VariableOccurrence / AnalysisResult → état qualifié | Les axes épistémique, applicabilité, réalisation, cohérence, lignage et actualité ne sont pas aplatis. |
| `HAS_MISSINGNESS_REASON` | VariableOccurrence attendue sans valeur exploitable → raison | `NOT_COLLECTED`, `NOT_APPLICABLE`, `NOT_EVALUABLE`, `INVALID` et `UNKNOWN` restent distincts d'un résultat biologique négatif. |
| `USES_BIOSPECIMEN` | MeasurementDefinition / AnalysisExecution → Biospecimen | Le matériel exact et sa version/aliquote sont référencés ; un type d'échantillon ne remplace pas l'identité matérielle. |

## 4. Relations V1 conservées et clarifiées

Les relations V1 restent utilisables lorsqu'elles ne contredisent pas les invariants V2. Leur libellé naturel peut être conservé, mais leur contexte et leur provenance deviennent obligatoires lorsque leur interprétation pourrait varier.

| Famille | Relations conservées | Clarification V2 |
|---|---|---|
| Cadrage | donne lieu à ; formalise ; se décompose en ; poursuit ; teste ; motive ; conditionne | Une relation de cadrage ne vaut ni décision humaine ni preuve. `motive` peut alimenter `MOTIVATES_DATA_NEED`. |
| Domaine | porte sur ; inclut/exclut ; caractérise ; affecte ; survient dans | Concepts Knowledge et sélections Project restent distincts. |
| Design | définit ; répartit ; programme ; expose ; compare ; exige | `programme` est complété par `EXPECTED_AT` pour les variables ; la programmation ne crée pas d'occurrence. |
| Mesure | mesure ; constitue un endpoint ; opérationnalise | `mesure` est réinterprété par ObservableProperty/MeasurementDefinition ; `OPERATIONALIZES` ne fusionne pas les objets. |
| Imagerie et domaines | repose sur ; produit ; paramètre ; impose ; harmonise ; contrôle ; interprète | `produit` doit pointer la réalisation ou le résultat ; `interprète` ne contourne pas la décision humaine. |
| Analyse | consomme ; estime ; compare ; ajuste ; dérive ; applique une règle | Entrées prévues, entrées réelles, exécution, résultat et interprétation sont séparés. |
| Adaptation | informe ; requiert ; propose ; recommande ; décide ; justifie ; met en balance ; dépend ; expose ; contredit ; revoit ; impacte ; remplace | `recommande` ne devient jamais `décide`. `remplace` est matérialisé par `SUPERSEDES`. |
| Knowledge | affirme ; soutient ; contredit ; synthétise ; limite ; est valide dans ; dérive de | Les statuts et domaines de validité restent portés ; aucune assertion ne devient fait absolu par répétition. |
| Projection | projette ; rend ; omet selon profil ; dérive de | Toute projection pointe ses sources et sa date ; elle n'acquiert pas leur ownership. |

## 5. Relations legacy non créables en V2

| Relation V1 | Statut | Mapping V2 requis | Motif |
|---|---|---|---|
| Phénomène biologique `est approché par` Biomarqueur | `LEGACY_ONLY` | Phénomène `OBSERVABLE_BY` ObservableProperty ; ObservableProperty `HAS_BIOMARKER_ROLE` BiomarkerRole ; BiomarkerRole `INDICATES` cible | La relation V1 fusionne propriété observable et rôle contextuel. |
| Modalité `mesure` Biomarqueur | `LEGACY_ONLY` | ObservableProperty `MEASURED_BY` MeasurementDefinition, puis choix Project `OPERATIONALIZES` la définition | Une modalité n'est ni une propriété ni une validation de rôle. |
| Biomarqueur `est représenté par` Variable d'étude | `LEGACY_ONLY` | CanonicalVariable `OPERATIONALIZES` MeasurementDefinition/ObservableProperty et `COVERS_DATA_NEED` | La variable appartient au projet ; elle ne matérialise pas automatiquement un rôle biomarqueur. |
| Analyse `produit` interprétation | `LEGACY_ONLY` si directe | AnalysisExecution `PRODUCES_RESULT` AnalysisResult, puis résultat `INTERPRETED_BY` décision humaine composée | Un calcul ne produit pas seul une conclusion scientifique. |

Les instances historiques restent lisibles. Toute réécriture V2 exige une décision de mapping explicite ; l'absence de mapping est représentée par `NEW_MAPPING_REQUIRED`, jamais par une équivalence supposée.

## 6. Contraintes de graphe

1. `SUPERSEDES`, `DERIVED_FROM` et les chaînes de composition ne doivent pas former de cycle dans un même contexte/version.
2. Une VariableOccurrence possède exactement une relation `REALIZES` vers une version de CanonicalVariable ; une correction crée une occurrence ou version supersédante.
3. Un AnalysisResult possède au moins un `PRODUCED_BY` ou un chemin `AnalysisExecution PRODUCES_RESULT` vérifiable.
4. Une ScientificInterpretation engageante possède au moins un décideur humain mandaté, une justification et les résultats/preuves interprétés.
5. Une TerminologyMapping ne remplace jamais `sameIdentity`; elle exprime une équivalence qualifiée et révisable.
6. Un DataNeed non couvert reste visible. Une couverture partielle ne peut être promue en couverture complète.
7. Une relation dont le contexte, l'owner ou la provenance nécessaires manquent est `INCOMPLETE` ou `UNKNOWN`, non inférée silencieusement.
8. Un consommateur peut ajouter une relation dont il est owner ; il ne modifie pas l'assertion d'un autre owner.

## 7. Limites

- Les vocabulaires finaux de cardinalité, de statut et d'équivalence terminologique seront spécialisés par OBS-001, CDM-001 et les gouvernances de domaine.
- Ce catalogue n'est ni un schéma de stockage, ni une API, ni une migration de données.
- Les relations historiques non inventoriées ici restent régies par PD-003 V1 en lecture et doivent être arbitrées avant toute création V2 équivalente.

`PD003_V2_RELATIONSHIP_CATALOG_ADMITTED_WITH_LIMITATIONS`
