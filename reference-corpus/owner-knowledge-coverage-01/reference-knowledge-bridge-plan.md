# REFERENCE_KNOWLEDGE_BRIDGE_01 — plan minimal, non implémenté

## 1. Décision

Le raccordement minimal doit étendre le corridor Knowledge existant. Il ne doit créer ni store documentaire parallèle, ni accès PDF direct par owner, ni corpus scientifique implicite.

Première divergence exacte :

```text
reference-corpus/reference-corpus-01/reference-corpus.json
  X aucun provider/adapter enregistré
src/features/knowledge-engine/provider-registry.ts
```

Classification : `REGISTRY_NOT_RUNTIME_VISIBLE`.

Cette divergence précède quatre limites aval déjà observées : documents non ingérés ; absence d’index de retrieval RC01 ; absence d’ancres documentaires RC01 ; contrats KnowledgeRequest/KnowledgeResult absents pour plusieurs owners. La résoudre seule rendrait le registre visible, mais pas encore scientifiquement consommable.

## 2. Réutilisation obligatoire

Réutiliser :

- `KNOWLEDGE_PROVIDER_REGISTRY` et le contrat commun d’adapter ;
- `KnowledgeRequest`, `QueryPlan`, `KnowledgeResult`, `KnowledgeGap` et la trace Knowledge ;
- les identités/digests, `RuntimeSource`, `RuntimeEvidenceLink`, la gestion des révisions et les statuts d’applicabilité ;
- le calcul de couverture, l’absence honnête et les codes `MISSING_SOURCE_ACCESS` / `MISSING_REVIEW_OR_ACTIVATION` ;
- le corridor QRY → Knowledge pour l’autorisation et la valeur de l’information ;
- les projections KnowledgeResult déjà consommées par Scientific Thinking et Imaging ;
- la discipline de minimisation/confidentialité de la recherche externe.

Ne pas détourner :

- `GovernedDocumentaryStatement`, actuellement réservé aux blocs contrôlés des Reasoning Books, pour faire passer toute référence externe pour un contenu gouverné NOXIA ;
- le provider PubMed, spécialisé dans la découverte bibliographique et les extraits de résumé, pour des lois, standards, guides, templates ou documents d’étude ;
- REG-000 comme store Knowledge général ; il reste le corpus spécialisé du resolver REG ;
- `owner-knowledge-coverage.json` comme vérité scientifique. Il s’agit d’un index d’audit et d’un candidat de routage, non d’une assertion.

## 3. Contrats additifs minimaux

### 3.1 Provider RC01

Ajouter un provider read-only `reference-corpus-01` dans le registry Knowledge avec :

- version = digest du registre et de son schéma ;
- type de contenu = références documentaires externes ;
- capacités initiales = `SOURCE_METADATA`, `DOCUMENT_SECTION`, `REFERENCE_STATEMENT_CANDIDATE` ;
- disponibilité distincte par source : metadata-only, local document available, remote access only, unavailable ;
- aucune assertion effective implicite ;
- aucune autorité NOXIA créée.

Si le type de provider courant ne peut représenter ces états sans confusion, faire une extension additive du contrat. Ne pas classer le provider comme `STRUCTURED_CORPUS` effectif par simple commodité.

### 3.2 Représentation documentaire

Créer une représentation immuable par document effectivement accessible :

```text
ReferenceDocumentSnapshot
  sourceId
  sourceRevision/version
  representationDigest
  retrievedAt
  contentAccessState
  licence/copyright state
  jurisdiction
  publication/effective dates
  supersedes/supersededBy
  regulatoryApplicability
  sections[]
    sectionId
    heading/path
    page/paragraph locator
    exactContentDigest
```

La première qualification peut être bornée aux cinq PDF FDA déjà stockés et autorisés. Les 53 références remote-only restent metadata-only ou `MISSING_SOURCE_ACCESS` jusqu’à récupération autorisée et digestée. Aucun téléchargement opportuniste.

### 3.3 Unité de restitution

Une section accessible peut produire :

- un `ReferenceDocumentaryCandidate` pour contexte/guidance/pratique ; ou
- un `AssertionCandidate` seulement si proposition, portée et passage exact sont localisés et qualifiés.

Conserver obligatoirement source class, support type, jurisdiction, version, temporal state, applicability, localisateur et limitations. Le résultat ne devient ni `OFFICIAL_EFFECTIVE`, ni Project truth, ni décision d’owner par sa seule présence dans RC01.

### 3.4 Index de retrieval

Construire un index déterministe séparant :

- besoin d’owner / type de question ;
- domaine et concepts ;
- type de support attendu ;
- juridiction et date d’effet ;
- sources candidates exactes ;
- documents/sections réellement accessibles.

`owner-knowledge-coverage.json` peut fournir les associations candidates `NEED_ID -> SOURCE_ID`, après validation. Un titre ne suffit jamais à sélectionner une section ni à soutenir une conclusion.

### 3.5 Applicabilité

Étendre additivement le contexte/source runtime pour préserver au minimum juridiction, classification de recherche/produit, date de résolution, état courant/historique et applicability conditions. Le filtre actuel ne couvre explicitement que contradiction, modalité, intervention et pathologie ; il est insuffisant pour les références réglementaires/versionnées.

Les règles :

- version remplacée disponible pour replay mais non préférée silencieusement ;
- futur texte adopté non encore effectif distinct du texte effectif ;
- FDA utilisable comme guidance comparative, jamais comme obligation française ;
- practice artifact utilisable comme pattern candidat, jamais comme preuve de validité ;
- source remote-only sans passage accessible = aucune assertion positive.

### 3.6 Handoffs owners

Étendre le corridor owner par owner, sans nouveau moteur :

```text
owner information need
  -> QRY selects REQUEST_KNOWLEDGE / purpose / guards
  -> KnowledgeRequest with exact owner consumer and Project snapshot refs
  -> Reference provider retrieval
  -> KnowledgeResult with candidates, coverage, gaps and provenance
  -> existing owner input gains a read-only KnowledgeResult dependency
  -> owner reasons; human adopts
```

Scientific Thinking et Imaging réutilisent leur projection `KnowledgeResult` actuelle. Study Design, OBS, Biostatistics, CDM et Data Management nécessitent une extension additive de leurs contrats d’entrée et du registre de consumers. REG reste d’abord le consumer de REG-000 ; une référence RC01 ne remplace jamais une Requirement REG-000 sans admission réglementaire distincte.

## 4. Ordre d’implémentation borné

1. Enregistrer le provider/adapter RC01 en mode metadata-only, avec tests de non-promotion et de gaps.
2. Ajouter les snapshots/ancres des cinq PDF locaux, sans extraction de règle dans les engines.
3. Ajouter l’index déterministe besoin/source/section et les filtres juridiction/version/applicabilité.
4. Qualifier une restitution candidate via `KnowledgeResult`, d’abord vers Scientific Thinking et Imaging déjà compatibles.
5. Ajouter les handoffs read-only aux autres owners un par un, sans Project write.
6. Vérifier TRACE, stale/replay, absence de mutation produit et refus des sources remplacées/inaccessibles.

## 5. Gates

La mission future doit échouer fermée si l’un des invariants suivants n’est pas démontré :

- une source externe est promue comme autorité NOXIA ;
- un document entier est exposé sans licence/accès compatible ;
- un owner lit un PDF hors Knowledge ;
- une conclusion n’a pas d’ancre exacte ;
- la juridiction, version, date d’effet ou supersession est perdue ;
- un practice pattern est présenté comme validité scientifique ;
- un résultat Knowledge écrit ou adopte dans Project ;
- un owner transforme une candidate en décision sans Human Decision.

## 6. Portée exclue

Ce plan n’autorise ni acquisition web, ni nouveau corpus, ni admission d’assertion, ni modification d’engine owner, ni test provider, ni câblage runtime dans `OWNER-KNOWLEDGE-COVERAGE-01`.
