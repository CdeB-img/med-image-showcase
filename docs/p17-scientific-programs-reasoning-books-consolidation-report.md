# P17 — Rapport de consolidation documentaire des Scientific Programs et Reasoning Books

**Statut :** INTERNAL_AUDIT_REPORT — OFFICIAL

**Niveau documentaire :** NIVEAU_3 — rapport d’audit et de consolidation

**Version :** 1.0

**Date d’arrêt :** 3 août 2026

**Mandat :** `P17-MANDATE-CONSOLIDATION-20260803`

**Périmètre contrôlé :** PD-012, PD-013, RB-003, RB-004 et SOURCE-OF-TRUTH-INDEX

**Décision documentaire associée :** `ASSET-REVISION-DECISION-RB-004-20260803`

**Principe de clôture :** corriger uniquement les incohérences documentaires démontrées, sans créer de Programme, Reasoning Book, connaissance scientifique, corpus, implémentation ou code

---

## Nature de la mission et règle de lecture

P17 est une mission de **consolidation documentaire**, pas une mission scientifique, produit ou technique. Le présent rapport établit ce qui a été vérifié, les écarts constatés, la correction autorisée et les limites de la conclusion. Il ne remplace aucune autorité de niveau 0, 1 ou 2.

Les résultats sont classés selon les quatre catégories imposées :

- `ERROR` : incohérence active démontrée qui doit être corrigée dans le périmètre autorisé ;
- `WARNING` : limite ou risque réel qui ne justifie pas une modification des documents gouvernés par P17 ;
- `INFORMATION` : constat utile, sans non-conformité ;
- `HISTORICAL_STATE` : état antérieur exact, conservé et non réécrit.

### Distinction des six plans de vérité

| Plan | Éléments examinés | Conclusion P17 |
|---|---|---|
| Principes établis | Charte fondatrice et Scientific Product Manifesto | Identité stable, responsabilité humaine, science avant technologie, connaissance partagée, explicitation des limites et conservation de l’historique sont préservées. |
| Références normatives | Product Specification, PD-003, PD-004, PD-009, PD-011, PD-012, PD-013, Territory Model, Catalog et Knowledge Graph | Les responsabilités spécialisées restent séparées. PD-012 gouverne l’architecture des Programmes ; PD-013 gouverne leurs inscriptions et leur état effectif. |
| Corpus scientifiques | RB-003 et RB-004 | Deux corpus officiels de niveau 2 sont présents. Leur admission documentaire ne constitue ni une recommandation, ni un protocole, ni une validation PD-011. |
| Cible | Registre, portefeuille, relations, ownership, navigation, évaluation et projections décrits par les normes | La cible reste normative. P17 ne déduit aucune capacité actuelle de sa seule description. |
| État réellement observé | Fichiers du dépôt, inscriptions PD-013, sources bibliographiques et validations exécutées au 3 août 2026 | Trois Programmes officiels, deux Reasoning Books officiels, un candidat RB-005 non créé, zéro relation canonique inter-Programme et zéro dépendance inter-Programme. |
| Hypothèses | Futures relations, futurs Reasoning Books et autres entrées prospectives des roadmaps | Elles restent prospectives, non identitaires et sans effet d’autorité tant qu’une admission distincte n’a pas eu lieu. |

---

## 1. Contrats vérifiés

### 1.1 Autorités et ordre de lecture

La lecture a commencé par le SOURCE-OF-TRUTH-INDEX, puis a suivi l’ordre d’autorité applicable à la mission : Charte fondatrice, Scientific Product Manifesto, Product Specification, PD-003, PD-004, PD-009, PD-011, PD-012, PD-013, RB-003, RB-004, Scientific Territory Model, Scientific Knowledge Catalog et Scientific Knowledge Graph.

Les responsabilités suivantes ont été vérifiées sans les fusionner :

- la Charte et le Manifesto portent les principes durables ;
- la Product Specification décrit la cible produit et ne prouve pas son implémentation ;
- PD-003 gouverne les objets, identités, relations, Mandats et Événements ;
- PD-004 gouverne l’expérience utilisateur, sans effet sur les identités du registre ;
- PD-009 gouverne la navigation scientifique, pas l’admission documentaire ;
- PD-011 gouverne l’évaluation et le droit de revendiquer un PASS, dont aucun n’est établi par P17 ;
- PD-012 gouverne la définition, le type, l’ownership, les relations, le portefeuille, le cycle de vie et le versionnement des Programmes ;
- PD-013 gouverne les identités réellement inscrites, leur état, leurs décisions et leur historique ;
- les Reasoning Books restent des corpus scientifiques de niveau 2 sous un Program Owner unique ;
- le Territory Model délimite le périmètre souhaité ; le Catalog décrit la couverture et la file ; le Knowledge Graph porte les objets de connaissance partagés.

### 1.2 Identités, numérotation et traçabilité du registre

Les contrôles d’unicité et de continuité donnent :

| Élément | Résultat courant | Conclusion |
|---|---:|---|
| ProgramID officiels | 3 | `NXP-000001`, `NXP-000002` et `NXP-000003`, uniques ; leur valeur numérique n’encode pas la chronologie d’admission. |
| Program Owners | 3 | Un Owner canonique par Programme ; aucun nom de personne n’est utilisé comme Program Owner. |
| Registry Events | 6 | `NXP-REG-EVENT-20260803-0001` à `…0006`, uniques et ordonnés. |
| Admission ou revision Decisions | 6 | Trois admissions de Programmes, deux admissions d’actifs et une révision d’actif, toutes reliées à un Mandat et à un Event. |
| Change Logs | 6 | Deux évolutions pour `NXP-000001`, trois pour `NXP-000002`, une pour `NXP-000003`. |
| Mandats | 6 | Références uniques ; les deux libellés historiques liés à « PD-016 » restent désambiguïsés par leurs identifiants complets. |
| Ownership Registries | 3 | Un dossier d’ownership par Programme ; aucun transfert ou partage implicite. |

PD-012 comporte une numérotation continue de ses sections normatives. PD-013 conserve une structure continue de 0 à 20 ; ses états 1.0 à 1.6 sont séparés du contrat normatif, qui reste en version 1.0.

### 1.3 Scientific Visions, roadmaps et portefeuilles

Chaque Programme officiel possède une Vision, une Roadmap, des Territory Links, un portefeuille et un Ownership Registry cohérents avec son type et ses frontières.

- `NXP-000001` : RB-003 est officiel ; les huit autres orientations de roadmap restent des hypothèses non numérotées et non réservées.
- `NXP-000002` : RB-004 est officiel ; les anciens libellés RB-005 à RB-012 de la roadmap cardiaque restent des libellés prospectifs historiques, explicitement non identitaires et non réservants.
- `NXP-000003` : RB-005 est le seul candidat suffisamment défini, mais demeure `PLANNED_CANDIDATE_NOT_CREATED` ; sept autres entrées restent sans identifiant et sans réservation.

Il n’existe aucun Reasoning Book officiel orphelin et aucun rattachement au mauvais Program Owner.

### 1.4 Relations, dépendances et cycles

Les relations canoniques effectives et les dépendances inter-Programmes sont toutes deux vides. Le graphe effectif contient donc zéro cycle et zéro duplication de relation.

Les relations envisagées vers des domaines ou Programmes non enregistrés restent des vues prospectives qualifiées `NOT_REGISTERED`. Elles ne sont pas promues en relations canoniques et ne contreviennent donc pas à l’interdiction de viser un Programme inexistant.

### 1.5 Territory Links

Les liens ont été comparés au modèle territorial structuré courant :

| Programme | Territory Links | Uniques dans le Programme | Liens morts |
|---|---:|---:|---:|
| `NXP-000002` | 13 | 13 | 0 |
| `NXP-000001` | 18 | 18 | 0 |
| `NXP-000003` | 35 | 35 | 0 |
| **Total des références de portefeuille** | **66** | **66 dans leur Programme** | **0** |

Six nœuds sont référencés par plusieurs Programmes. Ce recouvrement est cohérent avec l’appartenance multiple permise par le Territory Model : il s’agit de références partagées, non de doublons d’identité ou d’ownership.

### 1.6 Reasoning Books et références scientifiques

Les deux DOCX maîtres et leurs PDF dérivés ont été contrôlés.

| Contrôle | RB-003 | RB-004 après correction |
|---|---:|---:|
| Sections numérotées | 78, continues | 78, continues |
| Références déclarées | 61 | 43 |
| Références citées dans le corps | 61/61 | 43/43 |
| Objets PubMed vérifiés | 61 | 41 |
| Autres objets officiels vérifiés | 0 | 2 : NCBI Bookshelf et DOI officiel |
| Hyperliens de références concordants | 61/61 | 43/43 |
| Pages du PDF dérivé | 37 | 40 |
| Findings d’accessibilité documentaires | 0 | 0 |

Au total, 104 références ont été contrôlées : 102 notices PubMed et deux objets officiels hors PubMed. Après correction de R30 dans RB-004, les DOI, PMID et PMCID déclarés concordent avec les notices officielles consultées au 3 août 2026. La concordance bibliographique ne vaut ni revue scientifique humaine, ni nouvelle évaluation du niveau de preuve.

Les identifiants internes sont complets et sans doublon : RB-003 conserve O1–O18, H1–H20, D0–D18, RF01–RF20 et R01–R61 ; RB-004 conserve CMR-C01–CMR-C18, CMR-O01–CMR-O18, CMR-H01–CMR-H18, CMR-D00–CMR-D18, CMR-RF01–CMR-RF24, KG-CMR-01–KG-CMR-20 et R01–R43.

### 1.7 Formats, accessibilité et cohérence maître/dérivé

Les deux DOCX sont des archives valides. Les PDF sont lisibles, paginés, étiquetés et portent les métadonnées de titre attendues. Les 77 pages ont été inspectées visuellement : aucune coupure, superposition, page manquante ou débordement n’a été détecté. Le PDF de RB-004 a été régénéré depuis le DOCX maître révisé ; il ne devient pas une seconde source de vérité.

---

## 2. Écarts détectés

| Classe | Localisation | Constat | Effet | Décision |
|---|---|---|---|---|
| `ERROR` | RB-004, référence R30 | Le PMID `42241965` et le DOI `10.1016/j.jocmr.2025.101912` étaient corrects, mais RB-004 indiquait `PMCID: N/A` alors que la notice officielle expose `PMC13265417`. | Traçabilité bibliographique incomplète ; aucune conclusion scientifique affectée. | Corriger le PMCID, réviser RB-004 en 1.1 et réconcilier son portefeuille dans PD-013. |
| `WARNING` | Validation globale du Scientific Knowledge Catalog | Les contrôles internes du Catalog, du graphe, des contrats, campagnes et dépendances sont valides, mais le contrôle global reste en échec parce que le dépôt externe `editorial-engine` comporte des modifications non consolidées. | Limite de validation externe ; aucun défaut démontré dans les Programmes ou Reasoning Books de P17. | Ne pas modifier le dépôt externe ni affaiblir le contrôle. Conserver l’avertissement. |
| `INFORMATION` | Territory Links | Six nœuds territoriaux sont partagés entre plusieurs Programmes. | Recouvrement thématique attendu ; aucun doublon interne, ownership ou relation implicite. | Conserver les références partagées. |
| `INFORMATION` | Scientific Knowledge Graph | Le graphe valide ses contrats actuels, mais conserve des lacunes de couverture et une revue scientifique humaine encore requise avant toute projection publique. | État de couverture et de gouvernance, pas incohérence de registre. | Ne pas revendiquer de publication, de readiness publique ou de PASS PD-011. |
| `HISTORICAL_STATE` | PD-013, états 1.1 à 1.5 | RB-003 et RB-004 apparaissent comme candidats dans leurs pré-états, puis comme actifs officiels après leurs décisions d’admission. | Trace exacte de leur cycle de vie. | Préserver sans réécriture. |
| `HISTORICAL_STATE` | Roadmap de `NXP-000002` | Les libellés RB-005 à RB-012 précèdent l’identité candidate RB-005 de `NXP-000003`. | Collision lexicale apparente seulement : les anciens libellés sont déclarés non identitaires et non réservants. | Préserver et maintenir la qualification explicite. |
| `HISTORICAL_STATE` | Mandats PD-014, PD-015 et PD-016 | Ces libellés existent dans les traces d’opérations, sans documents autonomes correspondants dans le dépôt. | Aucun contenu normatif autonome ne peut en être déduit. | Conserver les MandateRef uniques et l’absence documentaire explicite. |

Un seul `ERROR` actif a donc été démontré. Aucune autre contradiction n’a été résolue implicitement ou requalifiée en correction.

---

## 3. Corrections réalisées

### 3.1 RB-004

- R30 : `PMCID: N/A` remplacé par `PMCID: PMC13265417`.
- Version documentaire : 1.0 vers 1.1.
- PDF dérivé : régénéré depuis le DOCX maître.

Justification : la correction restaure un identifiant bibliographique officiel devenu disponible. Elle ne modifie ni la source citée, ni le DOI, ni le PMID, ni le rôle de la référence, ni les construits, hypothèses, décisions, limites ou conclusions de RB-004.

### 3.2 PD-013

- État officiel du registre : 1.5 vers 1.6 ; contrat normatif maintenu en version 1.0.
- RB-004 : version 1.0 vers 1.1, statut `OFFICIAL` inchangé.
- `NXP-000002` : version mineure 1.1 vers 1.2, afin de tracer l’évolution compatible de son portefeuille conformément à PD-012 §10.3.
- Ajout de `P17-MANDATE-CONSOLIDATION-20260803`.
- Ajout de `ASSET-REVISION-DECISION-RB-004-20260803`.
- Ajout de `NXP-REG-EVENT-20260803-0006`.
- Ajout de `CHANGE-NXP-000002-0003`.

Justification : l’état du registre doit référencer la version courante de l’actif possédé. Une version majeure du Programme serait injustifiée, car Vision, type, frontières, relations, responsabilités et ownership restent inchangés.

### 3.3 SOURCE-OF-TRUTH-INDEX

- Version : 1.16 vers 1.17.
- Références courantes de PD-013, RB-004 et `NXP-000002` alignées sur l’état 1.6.
- Admission du présent rapport P17 comme artefact de niveau 3.
- Comptes : 61 artefacts gouvernés et 62 artefacts index inclus.

Justification : l’index doit refléter l’autorité, la version et l’édition courantes, ainsi que l’existence du nouveau rapport d’audit. Il ne porte aucune conclusion scientifique autonome.

---

## 4. Corrections refusées

Les actions suivantes ont été explicitement refusées parce qu’elles ne corrigeraient pas une incohérence démontrée ou dépasseraient le mandat :

- supprimer, réécrire ou renuméroter les états 1.1 à 1.5 de PD-013 ;
- renommer rétroactivement les entrées RB-005 à RB-012 de la roadmap cardiaque ;
- créer un Programme, un Reasoning Book ou un identifiant pour une entrée prospective ;
- transformer une relation prospective en relation canonique ;
- créer une relation vers un Programme `NOT_REGISTERED` ;
- déduire une relation ou un ownership de la seule présence de Territory Links partagés ;
- transférer à un Programme les nœuds existants du Catalog ou du Knowledge Graph ;
- créer des documents autonomes PD-014, PD-015 ou PD-016 pour combler leur absence ;
- modifier PD-012, dont aucun défaut normatif n’a été démontré ;
- modifier le contenu scientifique, les décisions ou les niveaux de preuve de RB-003 ou RB-004 ;
- modifier le dépôt externe `editorial-engine` pour rendre un contrôle global artificiellement vert ;
- créer une implémentation, une représentation exécutable, un protocole ou du code ;
- revendiquer un PASS PD-011, une activation produit, une validation scientifique humaine ou un droit de publication.

Chaque refus protège la séparation entre correction documentaire, évolution scientifique, implémentation et publication.

---

## 5. Historique conservé

Les pré-états et transitions restent lisibles et immuables :

1. état 1.0 : registre initial vide ;
2. état 1.1 : admission de `NXP-000002`, RB-004 candidat non créé ;
3. état 1.2 : admission de `NXP-000001`, RB-003 et RB-004 candidats non créés ;
4. état 1.3 : admission de RB-003 version 1.0, `NXP-000001` version 1.1 ;
5. état 1.4 : admission de RB-004 version 1.0, `NXP-000002` version 1.1 ;
6. état 1.5 : admission de `NXP-000003` version 1.0 et référence candidate RB-005 non créée ;
7. état 1.6 : révision bibliographique de RB-004 en 1.1 et `NXP-000002` en 1.2.

Les versions 1.0 de RB-004 et 1.1 de `NXP-000002` restent des états historiques vrais. L’événement `…0006` ne corrige, ne remplace ni n’annule l’événement d’admission `…0004` ; il enregistre une évolution ultérieure.

Les roadmaps demeurent des projections documentaires tant que leurs actifs n’ont pas été admis. Le candidat RB-005 de `NXP-000003` n’est pas créé et ne devient pas un corpus par sa seule présence dans PD-013.

---

## 6. État final

Après correction et réconciliation :

- PD-012 reste `REFERENCE_NORMATIVE` version 1.0, inchangé ;
- PD-013 reste sous contrat version 1.0 et passe à l’état officiel 1.6 ;
- trois Scientific Programs sont `OFFICIAL` ;
- deux Reasoning Books sont `OFFICIAL` : RB-003 version 1.0 et RB-004 version 1.1 ;
- RB-005 reste `PLANNED_CANDIDATE_NOT_CREATED` ;
- chaque actif officiel possède un Program Owner unique ;
- zéro Reasoning Book officiel est orphelin ;
- zéro relation canonique effective et zéro dépendance inter-Programme sont enregistrées ;
- les 66 Territory Links existent et sont uniques dans leur Programme ;
- les 104 références des deux Reasoning Books sont bibliographiquement concordantes après correction ;
- les DOCX maîtres et PDF dérivés sont lisibles, accessibles et visuellement cohérents ;
- le SOURCE-OF-TRUTH-INDEX version 1.17 gouverne 61 artefacts, soit 62 artefacts index inclus ;
- aucune connaissance scientifique, aucun corpus, Programme, Reasoning Book, protocole, code ou déploiement n’a été créé ;
- aucun PASS PD-011, aucune publication et aucune activation produit ne sont revendiqués.

La base documentaire est cohérente dans le périmètre P17. Le `WARNING` externe relatif à l’état du dépôt `editorial-engine` reste visible et empêche de présenter la validation globale du Catalog comme entièrement verte ; il ne remet pas en cause la clôture documentaire des Scientific Programs et Reasoning Books contrôlés.

---

## 7. Tableau de préservation des contrats

| Contract | Préservé ? | Corrigé ? | Remarque |
|---|---|---|---|
| Charte fondatrice | Oui | Non | Principes de responsabilité, d’historicité et de science avant technologie préservés. |
| Scientific Product Manifesto | Oui | Non | Un moteur scientifique partagé ; aucun silo de connaissance créé. |
| Product Specification | Oui | Non | Cible produit non confondue avec l’état implémenté. |
| PD-003 — Research Object Model | Oui | Non | Identités, Mandats, Decisions, Events et séparation Program Owner/responsable humain préservés. |
| PD-004 — UX Manifesto | Oui | Non | Hors modification ; limites et incertitudes restent explicitement visibles dans le rapport. |
| PD-009 — Decision Engine | Oui | Non | Aucune navigation ou décision scientifique automatisée créée. |
| PD-011 — Evaluation Framework | Oui | Non | Aucun PASS ou droit de publication déduit. |
| PD-012 — Scientific Program Architecture | Oui | Non | Version 1.0 inchangée ; versionnement mineur appliqué au portefeuille de `NXP-000002`. |
| PD-013 — Scientific Program Registry | Oui | Oui | Contrat 1.0 préservé ; état courant réconcilié de 1.5 à 1.6. |
| RB-003 | Oui | Non | Version 1.0 ; 61 références concordantes ; Owner `NXP-000001`. |
| RB-004 | Oui | Oui | Révision 1.1 limitée au PMCID de R30 ; contenu scientifique inchangé. |
| Scientific Territory Model | Oui | Non | 66 liens de portefeuille valides ; appartenances multiples conservées. |
| Scientific Knowledge Catalog | Oui | Non | Aucun ownership ou contenu transféré ; avertissement externe conservé. |
| Scientific Knowledge Graph | Oui | Non | Aucun nœud, assertion, preuve ou projection créé. |
| SOURCE-OF-TRUTH-INDEX | Oui | Oui | Version 1.17 ; état courant et comptes réconciliés. |

---

## 8. Tableau des Scientific Programs

| Programme | Owner | Roadmap | Portfolio | Statut |
|---|---|---|---|---|
| `NXP-000002 — Cardiac MRI & Quantitative Cardiac Imaging` | `NXP-000002` | RB-004 réalisé ; RB-005 à RB-012 conservés comme libellés historiques non identitaires et non réservants | RB-004 `OFFICIAL`, version 1.1 | `OFFICIAL`, Programme version 1.2 |
| `NXP-000001 — Spectral Imaging` | `NXP-000001` | RB-003 réalisé ; huit orientations futures sans identifiant réservé | RB-003 `OFFICIAL`, version 1.0 | `OFFICIAL`, Programme version 1.1 |
| `NXP-000003 — Neuro Perfusion & Metabolism` | `NXP-000003` | RB-005 candidat non créé ; sept entrées sans identifiant | Aucun corpus officiel ; une référence candidate RB-005 | `OFFICIAL`, Programme version 1.0 |

---

## 9. Tableau des Reasoning Books

| Reasoning Book | Programme | Statut | Version | Conforme ? |
|---|---|---|---|---|
| RB-003 — Reasoning Book 03 — Spectral Imaging | `NXP-000001` | `OFFICIAL` | 1.0 | Oui — structure, ownership, références et éditions conformes. |
| RB-004 — Reasoning Book 04 — Cardiac MRI & Quantitative Cardiac Imaging | `NXP-000002` | `OFFICIAL` | 1.1 | Oui — conforme après correction bibliographique bornée de R30 et régénération du PDF. |
| Référence candidate RB-005 — Neuro Perfusion Foundations | `NXP-000003` | `PLANNED_CANDIDATE_NOT_CREATED` | Sans objet | Oui comme état prospectif — aucun Reasoning Book ou corpus n’est créé. |

---

## Décision de clôture

**Décision : `PASS_DOCUMENTAIRE_P17_WITH_EXTERNAL_WARNING`.**

Le périmètre P17 est consolidé : l’unique `ERROR` démontré est corrigé et tracé, les états historiques sont conservés, les frontières d’autorité restent intactes et les limites externes demeurent explicites. Cette décision vaut uniquement clôture documentaire de la mission P17. Elle ne vaut ni PASS scientifique PD-011, ni revue humaine des corpus, ni autorisation de publication, ni preuve d’implémentation.
