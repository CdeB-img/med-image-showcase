# PRE-INTEGRATED-CONNECTION-VALIDATION-REPAIR-01 — rapport d’implémentation

Date de qualification : 2026-09-04

Baseline : `710ca64df394b0a8a9c0f2943f30cb89cc8e364d`

Branche : `protocol-designer-canonical-ingestion`

## Portée et limites

La tranche ferme uniquement les six blockers PIRGR01-G01 à G06. Elle ne réalise aucune campagne scientifique, aucun appel provider, aucune adoption Project et aucune extension documentaire. Les neuf rapports historiques non suivis restent hors commit. DOC-002 et TMP-001 ne sont pas modifiés.

## Gate 1 — registries et validateurs courants

- Le pointeur courant DOC-002 cible explicitement `1.1.0` et son digest `5772b9254ada64c020c0fe1cc72e9bf07bf6d687eabcb9e89163d48fd3429687`.
- La révision historique `1.0.0` conserve son digest `bf56e74d84f346438303798359cabe8d0adb5622594e02b8cfa46f52517dbcf0`.
- Le validateur vérifie désormais identité, version et digest de chaque révision puis la cohérence du pointeur courant.
- Le registre des études liées dérive son cardinal du contenu courant, vérifie l’unicité et conserve explicitement les dix identités historiques et les deux admissions ultérieures.
- Les métadonnées du provider sont dérivées des 101 sources courantes, dont 7 locales/indexées, sans promouvoir les états `METADATA_ONLY`, `CONTENT_ACCESSIBLE_NOT_STORED` ou `LOCAL_DOCUMENT_AVAILABLE` en contenu interrogeable.

Validateurs observés : RC01 `PASS` (101 sources, 7 copies locales, 12 ensembles liés) ; Owner Knowledge Coverage `PASS` (72 besoins, 101 sources, 12 ensembles liés).

## Gate 2 — QRY → Knowledge → owner

Le contrat `QRY001_KNOWLEDGE_PREREQUISITE@1.0.0` lie une action QRY existante au Project exact, à un besoin documentaire exact et à un owner/capability déjà sélectionné. Le connecteur Standard :

- exécute KE-001 en `INTERNAL_ONLY` ;
- déduplique sur l’identité stable de la requête ;
- retient le `KnowledgeResult` dans le ledger owner existant ;
- produit le handoff immuable existant pour les huit owners courants ;
- refuse un binding stale ou un résultat sans candidat ancré ;
- n’injecte pas le Reference Corpus globalement.

Dans les branches courantes OBS et REG, le prérequis documentaire est attaché seulement après la sélection QRY de l’action correspondante. Le handoff est ensuite consommé dans la même continuation Standard. Aucun owner ne lit directement les fichiers RC01.

## Gate 3 — OBS 1.1.0

Le premier raccord réparé est l’adaptateur Project/Standard → OBS. Il consomme uniquement des objets, rôles et relations Project structurés : aucune variable large n’est transformée implicitement en propriété observable ou définition de mesure.

Le contrat OBS 1.1.0 représente désormais, sans les résoudre : validité du construit/contenu/critère, accord-biais-précision, répétabilité/reproductibilité, performance de classification, calibration, erreur/incertitude, sensibilité aux conditions d’acquisition, robustesse/harmonisation/comparabilité, qualité et besoin de référence. Chaque qualification reste `REQUIRES_QUALIFICATION`, sans méthode analytique ni conclusion scientifique.

Le handoff Knowledge conserve sources, snapshots, ancres, limitations, incertitudes et gaps. Les réalisations spécialisées restent à Imaging ; les méthodes d’estimation restent à Biostatistics. Aucun résultat OBS n’est adopté ni écrit dans Project avant décision humaine.

## Gate 4 — QRY → REG-001

REG-001 est réutilisé sans REG-002. La sélection QRY repose uniquement sur des faits Project structurés : design interventionnel, produit médicament/dispositif/IVD, objet réglementaire ou juridiction. Un projet observationnel sans signal réglementaire ne déclenche pas REG.

L’adaptateur `REG001_CURRENT_KNOWLEDGE_EVIDENCE_ADAPTER@1.0.0` projette les références Knowledge courantes avec juridiction, classe de source, temporalité, applicabilité, limitations et incertitude. Il crée une qualification `UNKNOWN` à résoudre, jamais une Requirement. REG-000 reste l’entrée legacy admise de REG-001 avec provenance distincte. Une guidance FDA n’est pas promue en exigence française.

## Gate 5 — VAL courant

Le profil historique `SCIENTIFIC_OWNER_CHAIN_FIDELITY@0.1.0` reste inchangé pour le replay historique. Le nouveau profil `CURRENT_OWNER_STACK_FIDELITY@1.0.0` utilise le moteur VAL-001 existant et reconnaît : Knowledge, Scientific Thinking, Study Design, OBS, Imaging, Biostatistics, CDM, Data Management et REG.

Les attentes owner sont conditionnelles à l’action gouvernée ; l’absence d’un owner non applicable n’est pas un défaut. Les diagnostics déterministes couvrent notamment binding Project stale, owner requis absent, séquence/dépendance impossible, transfert d’ownership, écriture Project, adoption owner, perte de limitation, augmentation de certitude, promotion metadata-only, structure OBS courante, promotion REG non supportée et incohérences Project/TMP/DOC/TRACE. Le profil courant ne contient pas `OBSERVABILITY_QUALIFICATION:NOT_IMPLEMENTED`.

VAL ne répare rien, ne modifie ni Project ni TRACE et ne juge ni la qualité scientifique, ni le meilleur design, ni la conformité réglementaire.

## Témoins structurels

- A — observationnel longitudinal Imaging : chemin QRY/Imaging, handoff Knowledge borné, ledger/TRACE, non-mutation et corridor documentaire couverts par les suites ciblées.
- B — interventionnel analytique : REG, Study Design et Biostatistics sont atteignables comme actions QRY séparées ; aucune boucle globale ni adoption automatique.
- C — validation de mesure : `Project → QRY → Knowledge → OBS`, puis handoffs explicites Imaging/Biostatistics et frontière humaine.
- D — multicentrique Imaging : Knowledge et Imaging sont atteignables ; l’harmonisation reste conceptuelle et aucune exécution Imaging Level 3 n’est créée.

Ces témoins prouvent la reachability structurelle, pas une réponse scientifique ni une orchestration optimale de campagne.

## Qualification

- Tests gates ciblés : 8 fichiers, 172 tests, `PASS`.
- Corridor Functional Reset élargi : 73 fichiers, 845 tests `PASS`, 1 `TODO_NOT_TESTABLE`.
- Engines/contrats affectés : 65 fichiers actifs `PASS`, 1 fichier skipped ; 1 334 tests `PASS`, 7 skipped.
- TypeScript complet : `PASS`.
- Lint du périmètre affecté : `PASS`.
- Build production : `PASS` ; avertissements préexistants Browserslist/CSS/chunk-size non réparés dans cette tranche.
- Artifacts TMP générés : `STUDY_TEMPLATE_ARTIFACTS_CURRENT:13`.
- `git diff --check` : `PASS`.
- Suite complète finale, après indexation de l’allowlist afin d’inclure les deux nouveaux fichiers de tests : 235 fichiers, 3 578 tests `PASS`, 12 skipped, 1 todo, 1 échec historique `p-web-02-contract.test.tsx` inchangé ; nouvelle régression : 0.

## Frontières conservées

`QRY` reste propriétaire du WHAT/next action. `Knowledge` qualifie la preuve. Chaque owner réalise son raisonnement de domaine. `Research Project` reste source de vérité et seule une décision humaine autorisée peut adopter. `TRACE` enregistre ; `VAL` diagnostique. Aucun provider, push, déploiement ou test live n’a été exécuté.

Décision attendue après qualification finale : `PRE_INTEGRATED_STACK_READY_FOR_FROZEN_CAMPAIGN`.
