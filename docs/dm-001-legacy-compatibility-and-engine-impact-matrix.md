# DM-001 — Legacy Compatibility and Engine Impact Matrix

| Champ | Valeur |
|---|---|
| Version | 1.0 |
| Statut | `OFFICIAL — LEGACY_IMPACT_COMPANION` |
| Niveau | `NIVEAU_3 — compagnon subordonné` |
| Autorité | `docs/dm-001-study-data-management-architecture.md` |

## 1. Principe de compatibilité

DM-001 autorise la lecture et la qualification documentaire d’artefacts antérieurs. Il n’autorise aucune migration, conversion automatique, mutation de données, adaptation moteur ou activation produit. Un artefact legacy conserve son identité, sa version, son owner, ses inconnues et ses limites.

Les libellés, colonnes, formulaires, fichiers, feuilles, variables composites, statuts locaux et workflows historiques ne sont pas promus en objets canoniques par ressemblance. Tout mapping reste explicite, versionné, contextualisé et réversible.

## 2. Matrice de lecture legacy

| Artefact legacy | Lecture autorisée | Mapping candidat | Refus obligatoire |
|---|---|---|---|
| champ CRF/eCRF | label, instruction, format, occasion, source | référence vers CanonicalVariable/ExpectedVariableOccasion | créer une Variable par nom de champ |
| colonne dataset | nom, type, unité, codelist, source | projection d’une VariableOccurrence ou métadonnée opérationnelle | colonne = identité canonique |
| variable composite | composants et règle historique | plusieurs Variables/occurrences ou structure qualifiée après arbitrage | promotion atomique sans preuve |
| valeur vide | valeur et contexte disponibles | missingness factuel si raison prouvée | déduire `NOT_COLLECTED` depuis `null` seul |
| statut local | définition/source/version | mapping vers axes CDM | équivalence lexicale non démontrée |
| correction en place | versions, audit et sources disponibles | DataCorrectionRecord reconstruit si preuve suffisante | inventer l’avant manquant |
| fichier « final/locked » | contenu, métadonnées, registres | snapshot/lock seulement avec décision probante | nom de fichier = lock/release |
| export historique | règles, variables, occurrences, date, usage | DatasetRelease candidat avec limites | source canonique ou usage autorisé présumé |
| règle locale/industrielle | contexte, owner, version | pattern candidat | règle générale ou actuelle |
| mapping CDISC/FHIR/OMOP | source/version/contexte de mapping | TerminologyMapping/projection candidate | standard déclaré implémenté ou conforme |

## 3. Contradictions historiques conservées

- RDE-001 attribue historiquement à Data Management la « définition des données ». DM-001 limite cette responsabilité aux spécifications opérationnelles ; le Project et CDM conservent identité et représentation.
- PRJ-001 produit des requirements Data et des Variables candidates, mais aucun eCRF/Data Dictionary final. DM-001 ne les transforme pas rétroactivement.
- TMP-001 expose des documents Data Management `FUTURE`; DOC-001B ne rend que `PROTOCOL`. DM-001 n’invente aucune projection produite.
- VAL-000 est diagnostique et expérimental sur ses checkpoints aval ; il n’existe aucun validator DM qualifié.
- DOC-000B-R1 et DOC-000D documentent des pratiques candidates, locales ou historiques. Leurs versions, seuils, systèmes et obligations ne deviennent pas normatifs.

## 4. Matrice d’impact des capacités

| Capacité/document | Autorité conservée | Impact conceptuel DM-001 | État réel après admission | Gate future |
|---|---|---|---|---|
| PD-003 V2 | objets, relations, ownerships | aucun nouvel objet racine ; artefacts subordonnés | inchangé | arbitrage avant toute nouvelle racine/relation |
| OBS-001 | propriétés, mesure, critères/limites | DM applique/transporte, ne définit pas | inchangé | handoff de critères versionnés |
| CDM-001 | représentation canonique Study Data | DM produit opérations et traces conformes | inchangé | contrat exécutable séparé avant runtime |
| Research Project / PRJ | besoins, variables, occasions, décisions | fournit le paquet de collecte ; reçoit Contributions | aucun moteur DM branché | readiness et écriture Project explicites |
| RDE-001/002 | orchestration cible | DM devient capacité spécialisée de cycle de vie | cible documentaire seulement | mission d’orchestration distincte |
| Imaging/Laboratory/Core Lab | méthodes, qualité et résultats domaine | handoff source/méthode/QC/limites | aucun adapter DM | contrat domaine et tests |
| REG-000/001 | corpus candidat/résolution | requirements transportées sans promotion | aucune règle DM actuelle admise | vérification de source primaire courante |
| TMP-001 | structure documentaire | DMP/eCRF/Data Dictionary/plans restent définitions futures | `FUTURE`/non rendus | nouvelle ProjectionDefinition sans modifier le moteur générique |
| DOC-001/001B | projection éditoriale | futur consommateur des artefacts DM | aucune projection DM rendue | intégration déclarative distincte |
| DOC-002 | patterns documentaires | patterns candidats contextualisés | inchangé | aucune promotion automatique |
| VAL-000 | diagnostic read-only | futur checkpoint sur artefacts DM | aucun validator DM qualifié | architecture/qualification distinctes sous PD-011 |
| Biostatistics | analyse | reçoit releases, qualité et missingness factuel | absente | BIOSTATISTICS-001 avant tout AnalysisSpecification/runtime |
| Hybrid runtime / SEM | interprétation scientifique | aucun impact | fermé/inchangé | aucune réouverture par DM-001 |

## 5. Impacts interdits

DM-001 n’autorise pas : modification de code produit ; nouveau runtime ; base ou schéma ; EDC/eCRF ; migration V1 ; import réel ; données patient ; adaptation de SEM ; appel provider ; activation de standards externes ; création de Biostatistics ; génération documentaire ; campagne PD-011.

## 6. Conditions d’une future implémentation

Une future tranche doit au minimum : choisir un périmètre sans changer DM-001 ; produire des contrats techniques séparés ; démontrer mapping PD-003/OBS/CDM ; préserver raw, versions et lineage ; tester idempotence, corrections, lock/release et rollback ; maintenir Biostatistics séparée ; utiliser des fixtures synthétiques ; qualifier ses validators ; documenter l’état réellement implémenté sans le promouvoir en norme.

## 7. Dette et limitations

Aucun inventaire exhaustif de formats legacy n’est réalisé. Aucun mapping concret, donnée, migration, stockage, standard ou moteur n’est validé. Les matrices expriment compatibilité conceptuelle et impacts attendus, jamais conformité d’un consumer actuel.
