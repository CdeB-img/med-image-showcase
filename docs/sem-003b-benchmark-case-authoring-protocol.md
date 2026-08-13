# SEM-003B — Benchmark Case Authoring Protocol

## Protocole contrôlé de création des cas Development et Calibration

| Champ | Valeur |
|---|---|
| Identifiant | `SEM-003B` |
| Version | `1.0` |
| Statut | `OFFICIAL — CONTROLLED_AUTHORING_PROTOCOL` |
| Niveau documentaire | `NIVEAU_3 — compagnon opérationnel subordonné` |
| Source maîtresse | `docs/sem-003b-benchmark-case-authoring-protocol.md` |
| Autorité supérieure | `docs/sem-003-independent-scientific-understanding-benchmark-architecture.md` |
| Autorités coordonnées | SEM-002 ; PD-003 V2 ; OBS-001 ; PD-009 ; PD-011 |
| Contrats machine | `semantic-validation/sem-003/authoring/` |
| Périmètre | authoring Development et préparation Calibration uniquement |
| Décision | `SEM003B_AUTHORING_PROTOCOL_READY` |

---

## 1. Responsabilité et frontières

Ce protocole permet à un auteur humain de produire un `Case` et son `Acceptance Envelope` sans inventer de format local et sans réduire la compréhension scientifique à un Gold JSON unique.

Il possède :

- l’ordre d’authoring ;
- les champs du contrat ;
- la checklist de qualité ;
- la gate de passage vers `CALIBRATION_VISIBLE` ;
- les règles de parenté et d’exposition ;
- la validation structurelle et contractuelle.

Il ne possède jamais :

- la vérité scientifique ;
- les objets ou relations PD-003 ;
- les qualifications OBS ;
- une décision Project ;
- la décision de poser une clarification au runtime, qui appartient à PD-009 ;
- les métriques admises, seuils, répétitions, portes ou décisions, qui appartiennent à PD-011 ;
- un évaluateur scientifique automatique ;
- un blind set ;
- une modification ou une exécution de SEM.

Le `Case` et l’`Acceptance Envelope` sont des objets du benchmark seulement. Leur présence dans un fichier JSON n’en fait ni un modèle métier, ni un corpus scientifique, ni une fixture runtime SEM.

## 2. Livrable minimal d’un auteur

Chaque cas est constitué d’une paire versionnée :

1. `<slug>.case.json` conforme à `semantic-validation/sem-003/authoring/case.schema.json` ;
2. `<slug>.envelope.json` conforme à `semantic-validation/sem-003/authoring/acceptance-envelope.schema.json`.

Les deux fichiers se référencent mutuellement. Toute révision modifiant la demande, les obligations, les interdictions, les propriétés ou la référence crée une nouvelle version ; elle ne réécrit jamais la version utilisée dans une campagne close.

## 3. `Case Contract`

### 3.1 Identité

| Champ | Usage |
|---|---|
| `caseId` | identifiant stable, unique, sans sémantique scientifique cachée |
| `version` | version du cas |
| `title` | titre court destiné au registre |
| `createdAt` | date de création reconstructible |
| `authorRole` | fonction de l’auteur, sans inventer une revue humaine |
| `reviewStatus` | état de la revue documentaire |

### 3.2 Source

| Champ | Usage |
|---|---|
| `sourceRequest` | formulation exacte évaluée |
| `language` | langue et variante utiles |
| `conversationTurns` | tours ordonnés lorsqu’une correction, ellipse ou dépendance conversationnelle existe |
| `sourceContext` | contexte réellement fourni, borné |
| `provenance` | origine, auteur, date, source et inspirations exposées |

### 3.3 Périmètre scientifique

| Champ | Usage |
|---|---|
| `domain` | domaine borné du cas |
| `scenarioCategory` | catégorie SEM-002 principale |
| `secondaryCategories` | catégories secondaires réellement nécessaires |
| `difficultyTarget` | difficulté visée, indépendante de la longueur du JSON |
| `intentionallyMissingInformation` | absences intentionnelles, jamais omissions accidentelles |

### 3.4 Exposition et parenté

Le Case enregistre `exposureStatus`, `exposureHistory`, `parentageStatus`, `parentageAssessment`, `contaminationReview`, `eligibleForCalibration` et `eligibleForBlindQualification`.

SEM-003B autorise uniquement :

- `DESIGN_ONLY` ;
- `DEVELOPMENT_VISIBLE` ;
- `CALIBRATION_VISIBLE`.

`BLIND_SEALED` et `QUALIFICATION_EXECUTED` sont interdits. Tout cas Development ou Calibration est définitivement inéligible à une future qualification aveugle. `eligibleForBlindQualification` reste donc `false` dans ce contrat.

### 3.5 Référence

Le Case déclare :

- `acceptanceEnvelopeId` ;
- les propriétés SEM-002 applicables ;
- les compétences d’adjudication nécessaires.

Cette liste doit être identique à la liste des propriétés portée par l’Acceptance Envelope.

## 4. `Acceptance Envelope Contract`

### 4.1 `REQUIRED`

Chaque obligation contient un identifiant, une clé sémantique, un type, une description, une justification, un localisateur source, une criticité et les propriétés SEM-002 concernées.

`REQUIRED` contient uniquement ce qui doit être présent ou reconstructible pour préserver le sens : explicite, relation, comparaison, timing, polarité, correction, provenance, ownership, unknown ou ambiguïté nécessaire. Il ne force jamais une topologie unique.

Un élément auparavant optionnel ne peut devenir requis qu’avec `sourceClassification = PROMOTED_FROM_OPTIONAL` et une justification explicite révisée par les experts.

### 4.2 `PROHIBITED`

Chaque interdiction précise sa criticité, sa propriété SEM-002 et sa `failureClass`. Elle doit représenter une erreur défendable : invention, promotion, causalité ajoutée, ambiguïté supprimée, décision Project fabriquée, collapse de plans ou perte de provenance.

Une préférence de style, de longueur, d’ordre de champs ou de syntaxe n’est pas une interdiction scientifique.

### 4.3 `ACCEPTABLE_SEMANTIC_VARIANTS`

Une variante décrit une structure possible et les obligations qu’elle préserve. Elle ne devient acceptable que par décision de la référence experte. Le validateur vérifie uniquement que les obligations référencées existent.

### 4.4 `OPTIONAL_RELEVANT`

Un candidat optionnel :

- est plausible dans le contexte selon la référence experte ;
- conserve une étiquette d’inférence, hypothèse, option ou candidat contextuel ;
- n’est jamais bloquant par sa seule absence ;
- n’épuise pas l’espace des candidats possibles ;
- ne devient jamais automatiquement une décision Project.

### 4.5 `ADMISSIBLE_AMBIGUITIES`

Chaque ambiguïté indique au moins deux interprétations concurrentes et les informations susceptibles de les départager. Tant que ces informations manquent, l’ambiguïté doit rester ouverte.

### 4.6 `EXPECTED_CLARIFICATION`

La clarification est `REQUIRED`, `OPTIONAL` ou `NOT_EXPECTED`. Sa justification expose l’impact décisionnel et des classes de questions recevables. La formulation littérale n’est jamais imposée.

Une question est requise seulement si sa réponse peut modifier un objet, une décision, une branche, une interprétation, un risque, une limite ou une projection au sens de PD-009.

### 4.7 `OWNERSHIP_BOUNDARIES`

Chaque frontière nomme l’owner source, l’owner cible, la contribution permise, la promotion interdite et la nécessité éventuelle d’une décision humaine. Le benchmark ne crée aucun owner métier.

### 4.8 `PROPERTIES` et `ADJUDICATION`

Chaque propriété reprend exactement l’identifiant, la famille, le mode d’évaluation, le caractère absolu et la non-compensabilité définis par SEM-002. La criticité est contextualisée au cas.

L’adjudication nomme les expertises nécessaires, les désaccords possibles et les points nécessitant un jugement humain. Une référence impossible à stabiliser est rejetée ou conservée comme exploratoire ; elle n’est pas forcée.

## 5. Workflow humain court

| Étape | Action | Sortie attendue |
|---:|---|---|
| 1 — `CREATE_CASE` | attribuer ID, version, titre et objectif | Case `DESIGN_ONLY` |
| 2 — `DECLARE_PROVENANCE` | enregistrer source, auteur, inspirations et exposition | provenance reconstructible |
| 3 — `DECLARE_EXPLICIT_OBLIGATIONS` | isoler explicites, relations, timing, polarité et corrections | `REQUIRED` sourcé |
| 4 — `DECLARE_UNKNOWN_AND_AMBIGUITIES` | distinguer absence intentionnelle, unknown et ambiguïté | inconnues visibles |
| 5 — `DEFINE_PROHIBITED` | relier chaque erreur à une propriété et une failure class | interdictions défendables |
| 6 — `DEFINE_OPTIONAL_CONTEXT` | déclarer candidats utiles non obligatoires | `OPTIONAL_RELEVANT` non exhaustif |
| 7 — `DEFINE_ACCEPTABLE_VARIANTS` | décrire des topologies différentes préservant le même vecteur | variantes à adjuger |
| 8 — `DEFINE_CLARIFICATION_EXPECTATION` | qualifier la valeur décisionnelle d’une clarification | besoin ou absence justifié |
| 9 — `MAP_SEM002_PROPERTIES` | mapper uniquement les propriétés réellement testées | Case et enveloppe cohérents |
| 10 — `SCIENTIFIC_REVIEW` | revoir le fond, les obligations et les interdictions | référence scientifique recevable |
| 11 — `METHODOLOGICAL_REVIEW` | revoir équivalence, statuts, ownership et évaluabilité | contrat méthodologique recevable |
| 12 — `CONTAMINATION_REVIEW` | comparer parenté, sources, concepts et structures | statut d’exposition justifié |
| 13 — `FREEZE_VISIBLE_CASE_VERSION` | figer la paire et son historique | `DEVELOPMENT_VISIBLE` ou gate Calibration |

Pour une simple itération de rédaction, rester `DESIGN_ONLY`. Une révision après gel crée une nouvelle version et un nouvel événement ; elle ne modifie pas silencieusement l’ancienne.

## 6. Gate `CALIBRATION_VISIBLE`

Un cas peut passer de `DESIGN_ONLY` à `CALIBRATION_VISIBLE` uniquement si une revue explicite confirme :

- référence suffisamment stable pour calibrer une mesure ;
- propriétés applicables définies et cohérentes ;
- cas jamais utilisé pour réparer SEM ;
- parenté avec Development, Calibration et H01–H30 contrôlée ;
- contamination documentée ;
- adjudication réalisable ;
- source et état de connaissance reconstructibles ;
- aucun statut ou droit blind revendiqué ;
- `eligibleForCalibration = true` et `eligibleForBlindQualification = false` ;
- approbation documentaire `APPROVED_FOR_CALIBRATION`.

Cette gate n’effectue aucune calibration et ne constitue ni qualification ni PASS.

## 7. Authoring Quality Checklist

Un « non » à une exigence critique rejette le cas jusqu’à correction.

### Scientific purpose

- [ ] La capacité testée est identifiable et les propriétés SEM-002 sont déclarées.
- [ ] La difficulté vient du raisonnement scientifique, non d’un format artificiel.
- [ ] Les capacités combinées restent départageables ou leur combinaison est justifiée.

### Source

- [ ] La demande est naturelle, réaliste et exactement conservée.
- [ ] Le contexte fourni et les absences intentionnelles sont délimités.
- [ ] Aucune connaissance nécessaire au jugement n’est cachée par accident.
- [ ] Provenance, auteur, date et inspirations sont enregistrés.

### Required

- [ ] Chaque obligation est indispensable au sens, sourcée et typée.
- [ ] Aucun enrichissement simplement souhaitable n’est requis.
- [ ] Aucune topologie structurelle unique n’est forcée.
- [ ] Objet, relation, rôle, polarité, timing et statut épistémique restent distincts.

### Prohibited

- [ ] Chaque interdiction correspond à une erreur scientifiquement défendable.
- [ ] Chaque interdiction est reliée à une propriété et une failure class.
- [ ] Aucune préférence stylistique n’est transformée en erreur.
- [ ] Les promotions interdites et leurs owners sont explicites.

### Optional relevant

- [ ] L’absence isolée d’un candidat reste non bloquante.
- [ ] Sa présence exige le bon statut épistémique et une justification.
- [ ] L’enveloppe est explicitement non exhaustive.
- [ ] Un candidat pertinent non prélisté peut être adjugé.

### Ambiguity, unknown and clarification

- [ ] Les inconnues et ambiguïtés légitimes restent visibles.
- [ ] Leur résolution silencieuse est interdite.
- [ ] Les informations susceptibles de les résoudre sont nommées.
- [ ] Toute clarification requise a une valeur décisionnelle ; aucune phrase exacte n’est imposée.
- [ ] L’absence de question reste recevable si l’information n’est pas bloquante.

### Semantic variants

- [ ] Les variantes préservent sens, polarité, provenance, ownership et statut épistémique.
- [ ] Un détail supplémentaire ne crée aucun engagement nouveau.
- [ ] L’équivalence est expliquée par le vecteur d’obligations, pas par la ressemblance du JSON.

### Ownership

- [ ] SEM n’adopte aucune décision Project.
- [ ] Knowledge ne devient pas Project truth.
- [ ] ST, OBS, IMG, PRJ et VAL conservent leurs responsabilités.
- [ ] Le benchmark ne crée aucun ownership métier.

### Exposure, contamination and adjudication

- [ ] Statut, historique d’exposition et parenté sont cohérents.
- [ ] Les similarités avec Development, Calibration et H01–H30 sont examinées.
- [ ] Tout cas exposé est explicitement inéligible au blind.
- [ ] Les compétences nécessaires sont identifiées et les désaccords légitimes peuvent rester ouverts.
- [ ] Une référence experte insuffisante entraîne le rejet, pas une réponse forcée.

## 8. Validation déterministe

Exécuter :

```text
npm run validate:sem003-authoring
npm run test:sem003-authoring
```

Le validateur contrôle uniquement : schémas, types, IDs, unicité, références croisées, propriétés SEM-002 déclarées, catégories, provenance, exposition, transitions autorisées, classifications absolues/statistiques, contradictions structurelles manifestes et présence de l’adjudication.

Il ne décide jamais : vérité d’une relation, pertinence scientifique d’un candidat, équivalence sémantique, clarification optimale, résolution d’une ambiguïté, place réelle dans `REQUIRED`/`OPTIONAL_RELEVANT`, mérite d’un PASS ou exactitude d’un expert.

## 9. Fixtures de validation du protocole

Le répertoire `semantic-validation/sem-003/authoring/examples/` contient exactement trois paires synthétiques :

| Case | Difficultés illustrées | Statut |
|---|---|---|
| `SEM3-EX-UNDER-SPECIFIED` | sous-spécification, comparaison/timing, ambiguïté, clarification | `DEVELOPMENT_VISIBLE` |
| `SEM3-EX-METHOD-MEASUREMENT` | méthode/image/mesure, ownership, option, équivalence A/B et erreur C | `DEVELOPMENT_VISIBLE` |
| `SEM3-EX-CORRECTION-NONCAUSAL` | correction multi-tour, non-causalité, timing, provenance, enrichissement optionnel | `DEVELOPMENT_VISIBLE` |

Toutes déclarent :

- `purpose = AUTHORING_PROTOCOL_VALIDATION_ONLY` ;
- `eligibleForCalibration = false` ;
- `eligibleForBlindQualification = false`.

Elles ne constituent ni Development Set officiel, ni Calibration Set, ni benchmark, ni Holdout. Le validateur ne juge pas les dispositions A/B/C de la seconde fixture ; il vérifie seulement que le contrat sait les transporter.

## 10. Préparation de la qualification de l’évaluateur

De futurs cas Calibration devront permettre de mesurer si l’évaluateur :

- détecte une violation Safety/Fidelity ;
- accepte des représentations réellement équivalentes ;
- rejette une structure proche mais scientifiquement fausse ;
- distingue `OPTIONAL_RELEVANT` de `REQUIRED` ;
- conserve une ambiguïté légitime ;
- distingue inférence contextuelle et déclaration utilisateur ;
- distingue support Knowledge et adoption Project ;
- reconnaît une clarification à forte valeur sans imposer sa phrase exacte.

Le validateur structurel SEM-003B n’est pas cet évaluateur.

## 11. Parenté, contamination et anti-overfitting

Les statuts de parenté sont : `PARENTAGE_CLEAR`, `PARENTAGE_REVIEW_REQUIRED`, `RELATED_VISIBLE_CASE`, `CONTAMINATED_FOR_BLIND_USE`. Ils appartiennent uniquement au benchmark.

1. H01–H30 restent historiques/non-régression.
2. Aucun exemple SEM-002 ou SEM-003 exposé ne devient aveugle.
3. Aucun cas Development ou Calibration ne devient Blind.
4. Paraphrase, traduction ou variation superficielle ne créent pas un nouveau cas indépendant.
5. Les catégories peuvent être communes entre jeux, pas les contenus discriminants.
6. Aucune correction de SEM ne dérive d’un cas aveugle avant clôture et exposition.
7. Toute exposition aveugle future est irréversible.
8. Un cas utilisé pour réparer SEM devient Non-Regression.
9. Une référence n’est jamais modifiée après observation pour rendre la sortie acceptable.
10. Une insuffisance de référence est enregistrée comme problème du benchmark.
11. Aucun résultat isolé ne prouve une généralisation.
12. Aucun meilleur run ne sera sélectionné.
13. Des configurations différentes ne forment jamais une même campagne.
14. L’évaluateur sera versionné et qualifié avant usage aveugle.
15. Un doute raisonnable sur l’indépendance interdit l’usage aveugle jusqu’à revue.

## 12. Frontière Calibration

SEM-003B prépare l’authoring de cas Calibration. Il ne calibre rien.

Une future mission PD-011 devra calibrer : nombre de runs ; variabilité des propriétés de compréhension et d’enrichissement ; qualité de l’évaluateur ; accord inter-évaluateurs ; `NOT_EVALUABLE` ; `SAFE_FAIL_CLOSED` ; métriques informatives ; seuils continus ; sensibilité décisive ; invariance non décisive.

Aucune valeur, pondération, taille, intervalle obligatoire, règle PASS/FAIL ou score composite n’est fixé ici.

## 13. Décisions ouvertes classées

### A. Avant Development/Calibration réels

- politique applicable aux cas issus de données réelles, confidentialité et droits d’usage ;
- registre effectif d’identités et de versions ;
- nomination réelle des reviewers et déclaration de leurs conflits ;
- emplacement gouverné des futurs cas réels, distinct des fixtures de démonstration.

### B. Avant calibration formelle

- métriques exactes et méthode de calcul ;
- qualification de l’évaluateur ;
- plan statistique et nombre de runs ;
- accord inter-évaluateurs ;
- traitement final des non-évaluables et fail-closed ;
- seuils continus préspécifiés sous PD-011.

### C. Avant blind set

- stockage séparé et dépositaire ;
- contrôle d’accès, chiffrement et gestion des clés ;
- injection, scellement, digests et reprise après incident ;
- politique d’exposition et séparation organisationnelle ;
- construction indépendante et contrôle final de contamination.

Le groupe C ne bloque ni l’admission de SEM-003, ni la clôture de SEM-003B.

## 14. Règles d’évolution

Le protocole évolue lorsqu’un champ d’authoring, une gate visible, une règle de parenté, une transition d’exposition, une checklist ou la frontière du validateur change. Une évolution des métriques, seuils, répétitions, portes ou décisions appartient d’abord à PD-011 ; une évolution d’objet ou d’ownership appartient d’abord à PD-003/OBS/PD-009 selon le domaine.

Il ne doit jamais évoluer pour faire réussir une sortie, intégrer un cas particulier, copier un blind set, refléter un prompt/provider, fixer un seuil après observation ou transformer une limitation runtime en principe.

## 15. Décision

`SEM003B_AUTHORING_PROTOCOL_READY`

Le protocole est utilisable pour commencer l’authoring gouverné de futurs cas Development et préparer de futurs cas Calibration. Il ne crée aucun jeu officiel, ne qualifie aucun évaluateur et n’ouvre aucune campagne.
