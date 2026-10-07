# Réconciliation Studio V1 — primitive bornée

Note d'implémentation, non nouvelle autorité. DOC possède le delta documentaire,
la préservation et l'identité de future finalisation. Scientific Thinking possède
l'évaluation scientifique via le handoff SPINE existant. PRJ conserve seul
l'adoption ; QRY/conversation conserve la clarification. Aucun moteur, stockage,
endpoint, migration, bouton ou appel fournisseur n'est ajouté.

## Entrées exactes et frontières

`readSavedStudioReconciliationRequest` utilise GET de la Working Revision et les
lecteurs de corps archivés existants. SHA-256/bytes, identité native, liaison
Project et projection/handoff sont vérifiés avant toute comparaison.

`STUDIO_RECONCILIATION_V1` fige : revisionId/saveSequence/contentDigest,
logicalDocumentRef/nativeDocumentRef, baseGenerationId/body SHA-256, Project de
base, snapshot canonique du Project courant, identités/digests scientifiques et
préparations natives. Le delta compare exclusivement les nodes natifs : titre,
intitulé de section et texte de bloc. ADDED/REMOVED désignent un emplacement
textuel vide/non vide, pas l'insertion/suppression d'un node protégé.
FACT/CITE, ordre, anchors et provenance restent protégés par le contrat actuel.

Un consommateur doit relire le dernier SAVE et recapturer le Project/état
scientifique **avant** la finalisation, puis appeler
`assertStudioReconciliationCurrent`. La validation d'une copie ancienne n'est
pas une transaction contre une modification concurrente. Le futur dispatch
devra maintenir cette vérification à sa frontière d'exécution existante.

## Évaluation, non adoption

`prepareStudioScientificHandoff` produit un
`PROJECT_SPINE_02_SPECIALIZED_OWNER_HANDOFF`, owner `SCIENTIFIC_THINKING`,
capability `SCIENTIFIC_THINKING_PROPOSAL`, payload `StudioScientificContribution`
avec origin STUDIO, avant/après, anchors et bindings. Aucun faux transcript.

L'intégration scientifique fournit un résultat natif via le port explicitement
injecté `StudioScientificAssessmentPort`. Sans résultat lié aux entrées exactes,
la primitive échoue fermée. **Cette mission n'implémente ni classifieur automatique
de texte libre, ni exécution provider de ce port.** Les tests contrôlent les
résultats scientifiques et qualifient leurs frontières, pas leur qualité clinique.

Mapping : DOCUMENT_ONLY → changement documentaire ; PROJECT_CHANGE → contribution
scientifique non adoptée ; AMBIGUOUS → interprétations matériellement incompatibles.
Les inconnues ordinaires ne créent pas de blocage. Une ambiguïté requiert question,
au moins deux interprétations/conséquences distinctes et liens au Project courant.
Le plan conserve ces données pour QRY, sans autre moteur de questions.

Une couverture COMPLETE est une assertion **sémantique du propriétaire** liée au
delta et au snapshot exacts, avec versions natives actuelles/decisions adoptées.
Les refs/digests seuls ne prouvent rien. PARTIAL/UNKNOWN ne permettent pas de
certifier l'absence de recomposition. Aucune mise à jour de Project ou statut
UNASSESSED de la révision sauvegardée n'est réalisée par cette primitive.

## Working Draft conditionnel

- Sans delta et sans état scientifique pending : aucun traitement scientifique,
  Working Draft ou intent de version.
- DOCUMENT_ONLY et état couvert : réutilisation du Project, aucun Working Draft.
- Science déjà couverte par le Project adopté et le receipt exact : idem.
- Science non adoptée : chemin existant de préparation/décision PRJ uniquement.
  Une préparation READY_FOR_REVIEW/PENDING validée par le propriétaire natif peut
  être réutilisée si son Project est exact et qu'aucun tour ultérieur ne reste
  pending. Un nouveau delta Studio ne peut pas prétendre être couvert par un
  checkpoint conversationnel antérieur.
- Mixte : seule la contribution scientifique non couverte entre dans cette
  préparation ; les éditions documentaires restent séparées.
- Ambiguïté matérielle : clarification d'abord, aucune préparation déclenchée.

La primitive produit une décision de routage ; elle ne lance jamais Working
Draft. Aucune dépendance « nouvelle version = recomposition complète » n'est
introduite ; une future recomposition impact-aware reste possible.

## Préservation et identité de version future

REPLAY_EDITORIAL exige anchor/node, texte avant et contexte de section natif
identiques sur une cible vérifiée liée au Project courant. Le titre a son contexte
structurel propre. Les anchors positionnels DRCI ne sont pas des identités de merge
entre générations. Une section scientifiquement modifiée/inconnue produit
REQUIRES_RECONCILIATION ; aucune édition n'est perdue. Le plan conserve avant/après,
digests, reason, provenance, assessment et Project cible. Aucun merge général.

`replayStudioEditorialPlan` revalide toutes les preuves avant de retourner une
copie éditable. Il ne modifie ni base native archivée, ni pack, ni Project.
La copie n'est pas un document généré et doit encore passer l'assemblage/validation
DOC existants lors d'une future finalisation.

`STUDIO_FINALIZATION_IDENTITY_V1` lie source génération/SHA, revision/save/digest,
plan, logicalDocumentRef, Project cible et intent COMPLETE_PACK avec digest de
contrat documentaire. NO_CHANGE ne crée aucun intent. Un plan non READY est refusé.
L'identité est sérialisable pour le propriétaire de recovery existant ; elle ne
prétend pas être un commit durable ni une allocation d'ordinal.

La récupération utilise exclusivement le receipt de l'exact requestId et
l'identité/SHA de la future assembly native validée. Un G2 déjà existant sur le
même Project ne satisfait pas cet intent, même si un client relabelle son receipt.
Aucune recherche approximative « génération de ce Project » n'est utilisée.

Le futur résultat reste un pack complet DRCI. La réutilisation de siblings devra
prouver bindings/contrats exacts, puis revalider le pack entier. Cette mission ne
réutilise/committe aucun sibling, n'ajoute aucune génération par document et ne
modifie pas l'admission courante par Project digest. L'action finale et son
branchement durable restent la mission suivante.

## Qualification

Fixture native Studio existante, science infarctus/colchicine/placebo/IRM et
Project V1/V2, G1/G2 archivés par le double SQL du propriétaire courant. Les
qualifications temporelles figurent aussi dans le texte documentaire synthétique.
Tests : éditorial, monocentrique→multicentrique non adopté, science déjà adoptée,
mixte, collision, ambiguïté, idempotence, staleness, exact receipt vs ancien G2,
no-op, provenance, corruptions et checkpoints natifs. Aucun provider ni DB réelle.
