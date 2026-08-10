# REG-000 — Regulatory & Funding Knowledge Corpus

## Rapport de construction v1.0

**Date de construction et de vérification :** 10 août 2026

**Source maîtresse :** `regulatory-funding-corpus/reg-000/reg-000.corpus.json`

**Schéma :** `regulatory-funding-corpus/reg-000/reg-000.schema.json`

**Niveau demandé :** NIVEAU_2

**État réellement produit :** NIVEAU_2_CANDIDATE — CANDIDATE_NOT_ADMITTED

## 1. Nature exacte de la mission

REG-000 est un corpus autonome de connaissances réglementaires, de financement, méthodologiques et institutionnelles. Il référence les autorités externes sans s'y substituer, conserve la version et la temporalité des sources, qualifie l'intensité normative, explicite l'applicabilité et rend les exigences interrogeables avec leur provenance.

La mission n'est ni la création d'un moteur, ni la modification du Research Project, ni une consultation juridique, ni la production d'un protocole. Le corpus n'adopte aucune décision engageante et ne déduit aucune qualification juridique silencieuse.

## 2. Gouvernance documentaire suivie

Le `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md` a été lu intégralement en premier. Les documents disponibles ont ensuite été consultés dans l'ordre imposé : Charte fondatrice, Scientific Product Manifesto, Product Specification, PD-003, PD-004, PD-005, PD-009, PD-011, RDE-001, RDE-002, RDE-003, KE-001, DOC-001, SYS-001 et SYS-001B.

Les documents DOC-000A, DOC-000B, DOC-000B-R1 et DOC-000C, pourtant imposés comme entrées, sont absents du checkout et de l'historique Git inspecté. Aucun contenu ni principe d'autorité ne leur a été inventé.

Deux contradictions sont conservées explicitement :

1. la mission demande un corpus officiel NIVEAU_2 ;
2. la mission interdit toute modification d'une autorité existante, alors que la section 12 du SOURCE-OF-TRUTH-INDEX impose une admission atomique dans l'index pour tout nouveau corpus officiel de niveau 2.

La contradiction n'est pas résolue silencieusement : REG-000 est construit comme candidat complet, mais n'est pas déclaré officiel et le SOURCE-OF-TRUTH-INDEX n'est pas modifié.

## 3. Séparation des plans d'autorité

### Principes établis

- les décisions humaines restent engageantes ;
- une source externe officielle reste l'autorité de fond ;
- l'inconnu n'est jamais converti en obligation ;
- la temporalité, la provenance, les limites et les contradictions restent visibles ;
- un guide méthodologique ou éditorial n'est pas une norme réglementaire par sa seule publication.

### Références normatives

Les références normatives sont les textes juridiques, réglementaires et obligations de programme émis par les autorités compétentes : Code de la santé publique, règlement européen 536/2014, pages réglementaires CNIL, règles de campagne DGOS, appel RHU de l'ANR, politique NIH et règles américaines applicables.

### Corpus scientifique et méthodologique

ICH E6(R3), SPIRIT, CONSORT, STROBE, RECORD, TRIPOD, STARD et PRISMA sont enregistrés comme guides méthodologiques ou de reporting. Ils restent non réglementaires sauf incorporation explicite par une loi, une autorité, un contrat, un financeur ou une politique éditoriale applicable.

### Cible

La cible est un corpus NIVEAU_2 officiel, versionné, interrogeable et testable, utilisable ultérieurement par les fonctions de raisonnement réglementaire et de financement sans devenir lui-même un moteur.

### État réellement implémenté

- un maître JSON autonome ;
- un schéma JSON déclaratif ;
- 18 types d'objet du contrat minimum ;
- 16 autorités ;
- 8 profils d'exigences ;
- 24 sources officielles ;
- 24 exigences atomiques et 24 révisions initiales ;
- 24 conditions, 24 éléments de preuve et 24 enregistrements de vérification ;
- 4 programmes ou candidats de programme, dont 2 éditions historiques décomposées ;
- 10 règles d'applicabilité sur cinq axes ;
- 8 requêtes de compétence avec provenance ;
- 16 tests automatisés.

### Hypothèses conservées

- une qualification humaine est nécessaire pour établir une catégorie RIPH, une route CNIL, le champ du règlement européen, le statut américain d'« applicable clinical trial » ou l'édition de financement applicable ;
- les éditions futures de financement sont inconnues tant qu'un appel primaire précis n'a pas été admis ;
- les exigences non couvertes par le corpus ne sont ni absentes en droit, ni non applicables : elles restent hors périmètre ou inconnues.

## 4. Architecture du corpus

Le corpus sépare les identités stables des versions et des preuves :

- `Authority` identifie l'émetteur externe ;
- `RequirementSource` conserve le document primaire et son enveloppe temporelle ;
- `Requirement` exprime une exigence atomique ;
- `RequirementRevision` trace sa version ;
- `RequirementCondition` porte la condition ou l'exclusion ;
- `RequirementEvidence` relie l'exigence à un emplacement vérifiable ;
- `FundingProgram` est distinct de `ProgramEdition` ;
- les exigences de soumission, document, section, champ, annexe, approbation et revue restent séparées ;
- `ApplicabilityRule` exprime les cinq axes et les relations ;
- `VerificationRecord` démontre la vérification du statut affiché.

Les statuts temporels sont strictement : `CURRENT`, `UPCOMING`, `SUPERSEDED`, `ARCHIVED`, `UNKNOWN_CURRENTNESS`.

Les qualifications documentaires sont strictement : `MANDATORY`, `CONDITIONAL_MANDATORY`, `RECOMMENDED`, `OPTIONAL`, `NOT_APPLICABLE`, `PROHIBITED_IF_EXPLICIT`, `UNKNOWN`, `SUPERSEDED`. Toute qualification `UNKNOWN` porte la raison `UNKNOWN_REQUIRES_QUALIFICATION`.

## 5. Sources primaires et couverture

| Domaine | Autorités et sources primaires | Qualification dans REG-000 |
|---|---|---|
| France — RIPH | [L1121-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000046125746/), [L1121-4](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006072665/LEGISCTA000006170998/), [L1123-6](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000037504414/), [R1123-20](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006072665/LEGISCTA000006196869/) | obligations légales ou réglementaires actuelles, vérifiées le 10 août 2026 |
| France — données de santé | [MR-001](https://www.cnil.fr/fr/methodologie-de-reference-mr-001-recherches-sante-avec-recueil-du-consentement), [MR-003](https://www.cnil.fr/fr/methodologie-de-reference-mr-003-recherches-dans-le-domaine-de-la-sante-sans-recueil-du-consentement), [mise à jour CNIL 2026](https://www.cnil.fr/fr/recherche-en-sante-la-cnil-met-jour-et-elargit-le-champ-des-methodologies-de-reference-001-et-003) | obligations conditionnelles selon périmètre et conformité, version 2026 |
| Union européenne | [Règlement 536/2014](https://eur-lex.europa.eu/eli/reg/2014/536/oj?locale=fr), [Commission européenne](https://health.ec.europa.eu/medicinal-products/clinical-trials_en), [EMA/CTIS](https://www.ema.europa.eu/en/human-regulatory-overview/research-development/clinical-trials-human-medicines/clinical-trials-information-system) | essais cliniques de médicaments dans le champ applicable ; CTIS actuel |
| DGOS — PHRC-N | [Innovarc 2025-2026](https://sante.gouv.fr/systeme-de-sante/innovation-et-recherche/l-innovation-et-la-recherche-clinique/appels-a-projets/innovarc), [note DGOS/RI1/2025/90](https://sante.gouv.fr/IMG/pdf/2025_90.pdf) | édition historique archivée, non transposable aux campagnes futures |
| ANR — RHU | [Appel RHU vague 6, 2023](https://anr.fr/fileadmin/aap/2023/france2030-aap-RHU-V6-2023.pdf) | édition historique archivée, pièces et annexes vérifiées sur le PDF officiel |
| Méthode et reporting | [ICH E6(R3)](https://database.ich.org/sites/default/files/ICH_E6%28R3%29_Step4_FinalGuideline_2025_0106.pdf), [SPIRIT/CONSORT 2025](https://www.consort-spirit.org/published-statements), [EQUATOR](https://www.equator-network.org/), [PRISMA 2020](https://www.prisma-statement.org/prisma-2020) | guides méthodologiques ou de reporting, sans promotion normative automatique |
| États-Unis | [FDAAA 801 / 42 CFR Part 11](https://clinicaltrials.gov/policy/fdaaa-801-final-rule), [politique NIH](https://grants.nih.gov/policy-and-compliance/policy-topics/clinical-trials/reporting/nih-policy) | obligation légale ou de financeur, selon qualification américaine |
| Institutionnel | [ECRIN RED](https://red.ecrin.org/en/about) | aide informationnelle de découverte ; revérification primaire obligatoire |

Les blogs, forums, LinkedIn, cabinets de conseil, présentations personnelles et sources secondaires lorsqu'une source primaire existe sont exclus.

## 6. Mappings exploitables

### Par type d'étude

| Type ou qualification | Exigences reliées |
|---|---|
| Recherche impliquant la personne humaine en France | qualification RIPH, avis CPP, protocole CPP, modèle de consentement ou d'opposition |
| RIPH 1 | exigences communes RIPH et autorisation préalable de l'autorité compétente |
| RIPH 3 | exigences communes RIPH, transmission prévue à l'autorité compétente et absence d'opposition ; pas d'extension de l'autorisation RIPH 1 |
| Essai clinique de médicament UE/EEE | règlement 536/2014, CTIS, dossier initial de l'annexe I |
| Recherche avec données personnelles de santé en France | qualification MR-001/MR-003, conformité, déclaration ou autorisation, annexes 2026 selon applicabilité |
| Protocole d'essai randomisé | SPIRIT 2025 comme guide de documentation |
| Rapport d'essai randomisé | CONSORT 2025 comme guide de reporting |
| Étude observationnelle ou données courantes | STROBE ou RECORD selon le type de données et de rapport |
| Modèle prédictif, diagnostic, revue systématique | TRIPOD, STARD ou PRISMA selon le livrable |
| Essai américain applicable ou financé NIH | obligations ClinicalTrials.gov légales ou de financeur selon qualification distincte |

### Par organisme

| Organisme ou autorité | Objets reliés |
|---|---|
| CPP | avis favorable pour RIPH 1/2/3, dossier et protocole |
| ANSM / autorité compétente | autorisation préalable RIPH 1 dans le noyau français ; route européenne à qualifier séparément pour les essais de médicaments |
| CNIL | MR-001, MR-003, conformité, déclaration ou autorisation et annexes de la version 2026 |
| Commission européenne / EMA | règlement européen, transition CTIS et environnement de soumission |
| DGOS | édition PHRC-N 2025-2026 et ses stades archivés |
| ANR | édition RHU V6 2023 et son dossier archivé |
| ICH / groupes de guidelines / EQUATOR | guides de méthode et de reporting seulement |
| NIH / ClinicalTrials.gov | exigences américaines de financeur, d'enregistrement et de résultats selon périmètre |
| ECRIN | découverte informationnelle, suivie d'une vérification des autorités primaires |

### Par programme

| Programme et édition | État | Exigences décomposées |
|---|---|---|
| PHRC-N 2025-2026 | `ARCHIVED` | stade 1 : lettre d'intention et pièces listées ; stade 2 : dossier complet, protocole, budget, attestations et annexes |
| RHU V6 2023 | `ARCHIVED` | document scientifique, document administratif et financier, lettres d'engagement et trois annexes obligatoires |
| NIH-funded clinical trial | politique actuelle à qualifier au projet | enregistrement et résultats selon la politique NIH |
| Horizon Europe candidat | `UNKNOWN` | aucune exigence projetée sans appel et édition primaires qualifiés |

### Par document

| Document ou annexe | Qualification contextualisée |
|---|---|
| Protocole de recherche — dossier CPP | `MANDATORY` pour le dossier RIPH modélisé |
| Protocole de recherche — PHRC-N 2025-2026 stade 1 | `NOT_APPLICABLE` comme pièce de dépôt de ce stade précis |
| Protocole de recherche — PHRC-N 2025-2026 stade 2 | `MANDATORY` |
| Document scientifique RHU V6 | `MANDATORY` |
| Document administratif et financier RHU V6 | `MANDATORY` |
| Lettres d'engagement RHU V6 | `MANDATORY` |
| Annexes RHU concept, méthodologie et impact | `MANDATORY`, avec limites de pages conservées |
| Annexes CNIL sécurité et contrôle qualité | `CONDITIONAL_MANDATORY` selon la route MR 2026 |
| Guide SPIRIT pour un protocole randomisé | `RECOMMENDED`, sauf incorporation explicite démontrée |
| Document d'une édition de financement non qualifiée | `UNKNOWN` avec `UNKNOWN_REQUIRES_QUALIFICATION` |

## 7. Applicabilité

Chaque règle expose simultanément :

1. le cadre réglementaire ;
2. le design scientifique ;
3. le programme de financement et son édition ;
4. les sources de données ;
5. la nature du projet.

Elle conserve les relations `appliesIf`, `doesNotApplyIf`, `requires`, `dependsOn`, `conflictsWith`, `supersedes`, `jurisdiction` et `effectivePeriod`. Si les éléments de qualification sont incomplets, le résultat est `UNKNOWN_REQUIRES_QUALIFICATION`, jamais une obligation supposée.

## 8. Réponses aux requêtes de compétence

### Un PHRC exige-t-il un protocole ?

La réponse dépend du stade et de l'édition. Pour PHRC-N 2025-2026, le protocole n'était pas une pièce du dépôt de stade 1 ; il était obligatoire au stade 2 du dossier complet. La campagne est clôturée. Provenance : portail Innovarc et note DGOS/RI1/2025/90.

### Quelles annexes pour RHU ?

Pour RHU V6 2023, trois annexes étaient obligatoires :

- concept, données préliminaires et publications, cinq pages maximum ;
- méthodologie des études précliniques et essais cliniques prévus, une page maximum par essai clinique et réunion dans une annexe ;
- impact, propriété intellectuelle et principes de partage du retour, trois pages maximum.

L'édition est clôturée. Provenance : appel RHU V6 officiel, section 3.2 point 2 et section 5.1.

### RIPH 1 contre RIPH 3

Les deux catégories requièrent un avis favorable du CPP et un dossier comprenant un protocole. La RIPH 1 requiert l'autorisation préalable de l'autorité compétente et un consentement libre, éclairé et écrit. L'article L1121-4 ne pose pas cette autorisation préalable pour la RIPH 3 ; l'avis et un résumé sont transmis à l'autorité compétente, et la participation est exclue en cas d'opposition. La qualification finale de la catégorie reste humaine.

### CNIL, ANSM, CPP et DGOS

- CNIL : la route dépend des données traitées, du périmètre MR et de la conformité intégrale ; une non-conformité ne peut être convertie en déclaration.
- ANSM : dans le noyau français modélisé, l'autorisation préalable dérive de la RIPH 1 ; les essais de médicaments relevant du règlement européen requièrent une qualification CTIS distincte.
- CPP : avis favorable pour les trois catégories RIPH et protocole daté dans le dossier.
- DGOS : seule la campagne PHRC-N 2025-2026 est décomposée ; ses règles archivées ne définissent aucune campagne future.
- standards : guides de méthode ou de reporting seulement, sauf incorporation explicite démontrée.

Toutes ces réponses sont matérialisées comme `competencyQueries`, avec identifiants d'exigence et de source résolubles.

## 9. Temporalité et politique de revérification

Chaque source conserve `publishedAt`, `effectiveFrom`, `effectiveUntil`, `verifiedAt`, `sourceRevision`, `programEdition`, `supersedes`, `supersededBy` et `status`.

Le statut `CURRENT` n'est attribué qu'avec un `VerificationRecord` daté contrôlant l'autorité primaire et l'état d'effet. Les campagnes PHRC-N 2025-2026 et RHU V6 2023 sont `ARCHIVED` et disposent d'une vérification historique distincte.

Cadence cible :

- textes légaux et réglementaires actuels : tous les 30 jours et avant tout usage engageant ;
- appels ouverts : chaque semaine, puis quotidiennement pendant la dernière semaine ;
- guides méthodologiques et sources institutionnelles : trimestriellement ;
- toute notification d'une autorité : revérification événementielle immédiate.

Cette cadence est une cible de gouvernance. Aucun mécanisme automatique de veille n'est créé dans cette mission.

## 10. Validations exécutées

- parsing JSON du maître et du schéma : réussi ;
- validation du maître contre le schéma JSON : réussie ;
- test REG-000 ciblé : 16 tests réussis ;
- complétude des 18 types d'objet : réussie ;
- intégrité des références Authority/Source/Condition/Evidence/Requirement : réussie ;
- contrôle de provenance de chaque statut `CURRENT` : réussi ;
- contrôle des domaines officiels et des sources interdites : réussi ;
- contrôle de non-promotion des guides méthodologiques : réussi ;
- requêtes PHRC, RHU, RIPH, CNIL, ANSM, CPP, DGOS et standards : réussies ;
- typecheck global : réussi ;
- lint global : réussi avec 7 avertissements préexistants `react-refresh/only-export-components`, sans erreur ;
- build de production : réussi avec avertissements non bloquants de dépendances et de taille de chunk ;
- suite complète : 952 tests réussis sur 955 ; trois contrôles historiques échouent uniquement parce que le dépôt externe protégé `editorial-engine` était déjà non propre avant REG-000 ;
- `git diff --check` : propre ; chacun des quatre nouveaux fichiers a aussi été contrôlé individuellement avec le mode `--no-index --check`, sans erreur d'espace.

## 11. Non-régression et périmètre des modifications

Seuls les fichiers du corpus REG-000, son test dédié et ce rapport sont créés. Aucun moteur, renderer, Research Project, Knowledge Engine, corpus scientifique, manifeste, document d'autorité ou index n'est modifié.

Aucun commit, push ou déploiement n'est effectué.

## 12. Limitations

- Le corpus v1 est un noyau gouverné, pas un inventaire exhaustif du droit de la recherche.
- Les dispositifs médicaux, diagnostics in vitro, études de performance, routes non médicamenteuses et détails nationaux de toutes les parties II CTIS ne sont pas intégralement décomposés.
- Les campagnes futures DGOS, ANR, France 2030, Horizon Europe et NIH ne sont pas qualifiées.
- ECRIN RED est une aide de découverte, jamais une autorité juridique.
- L'absence des documents DOC-000 empêche de démontrer la conformité à leur contenu supposé.
- L'absence d'autorisation de modifier le SOURCE-OF-TRUTH-INDEX suspend l'admission officielle NIVEAU_2.

## 13. Décision

REGULATORY_FUNDING_CORPUS_V1_BUILT_WITH_LIMITATIONS
