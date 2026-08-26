# W1-QUAL-02H1M — Campaign E manual evidence collection report

Nature : `LEVEL_3_IMPLEMENTATION_EVIDENCE` — non normative.

## Decision

`W1_QUAL_02H1M_HUMAN_REVIEW_PACKET_READY_WITH_TECHNICAL_LIMITATIONS`

Cette décision signifie uniquement que sept sorties gelées sont disponibles pour une adjudication scientifique humaine. Elle ne constitue ni un `SCIENTIFIC_PASS`, ni une qualification ST, ni une clôture de Wave 1.

## Baseline

- Branch : `protocol-designer-canonical-ingestion`
- HEAD initial et origin : `bef96f99c0a1bd407d0731c077932dd88adf4aab`
- main et origin/main : `9be06edca1a7500ab7a43d065e94241e91d67bec`
- ST : `SCIENTIFIC_THINKING@1.2.2`, runtime byte-identical aux hashes du freeze
- Artefacts historiques non suivis : 53, préservés

## Autorités consultées

L'ordre obligatoire a été respecté : Source-of-Truth Index, Charte fondatrice, Scientific Product Manifesto V2, Editorial Engine Architecture Manifesto. Les preuves W1-QUAL-02H1, W1-QUAL-02H1R, le freeze Campaign E, les registres gelés et le roadmap courant ont ensuite été lus comme preuves Level 3, sans promotion normative.

## État historique conservé

- Campaign : `W1-QUAL-02H-ST-2026-08-26-E`
- Freeze : `ke1-d1c4ff40aa84e28c`
- `W1_QUAL_02H1_HUMAN_REVIEW_PACKET_NOT_READY`
- `W1_QUAL_02H1R_STOPPED_AFTER_SECOND_CHECKER_DEFECT`
- Le premier cas reste `TECHNICALLY_NON_ADJUDICABLE`; aucune sortie n'a été fabriquée et aucun rerun n'a eu lieu.
- Le K-edge conserve exactement la sortie `ke1-e8b1eb3cc7f26720`; aucun rerun H1M n'a eu lieu.

## Décision de programme

`AUTOMATED_SCIENTIFIC_CHECKER_AS_HUMAN_PACKET_GATE = ABANDONED_BY_HUMAN_PROGRAM_DECISION`

Deux défauts successifs du seul checker ont bloqué la collecte sans démontrer un défaut scientifique ST. Les observations déterministes restent diagnostiques lorsqu'elles sont directement fiables, mais aucun agrégat du checker ne détermine désormais si la sortie peut être lue par l'humain.

## Exécutions bornées

- Six cas gelés jamais exécutés ont chacun reçu exactement une invocation ST locale.
- Nouvelles invocations ST : 6
- Rerolls : 0
- Réparations post-observation : 0
- Erreurs runtime : 0
- Sorties disponibles pour revue humaine : 7 (K-edge historique + six nouvelles)
- Cas techniquement non adjudicable : 1

Digests des sept sorties :

- `ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01` → `ke1-e8b1eb3cc7f26720`
- `ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01` → `ke1-bffb3f6ff40a6c5b`
- `ST02H1-E-ICI-EXPOSURE-UNKNOWN-01` → `ke1-5928ccff0a0f79d3`
- `ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01` → `ke1-eb4439319e05c35d`
- `ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01` → `ke1-1228b0c5beca52b9`
- `ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01` → `ke1-76016753ef5723c7`
- `ST02H1-E-GM-WM-CBF-ASSOCIATION-01` → `ke1-b154ccf0e922caec`

## Observations techniques directement fiables

Pour les six nouvelles exécutions : version ST inchangée 6/6, un OwnerResult présent 6/6, TRACE disponible 6/6, persistance observable 6/6, Project writes = 0 sur 6/6, adoption automatique = 0 sur 6/6. Aucun scénario stale n'était applicable dans Campaign E.

## Limites techniques

`CHECKER_LIMITATION = SOURCE_EVIDENCE_REFS_AND_LINEAGE_INTEGRITY_NOT_RELIABLE_FOR_CAMPAIGN_E`

- `SOURCE_EVIDENCE_REFS = TECHNICALLY_UNRELIABLE_FOR_CAMPAIGN_E`
- `LINEAGE_INTEGRITY = TECHNICALLY_UNRELIABLE_FOR_CAMPAIGN_E`
- Aucun PASS/FAIL agrégé du checker n'est utilisé comme gate du packet.
- `NEW_CHECKER_REPAIR = NO`

## Contrôle des coûts

- `EXTERNAL_LLM_API_CALLS = 0`
- `OPENAI_API_CALLS = 0`
- `CHATGPT_API_CALLS = 0`
- `GEMINI_CALLS = 0`
- `OTHER_LLM_PROVIDER_CALLS = 0`
- `NETWORK_CALLS = 0`

## État humain et scientifique

- `HUMAN_SCIENTIFIC_ADJUDICATION_REQUIRED = YES`
- `HUMAN_REVIEWABLE_CASES = 7`
- `TECHNICALLY_NON_ADJUDICABLE_CASES = 1`
- `HUMAN_ADJUDICATION_COMPLETED = 0`
- `HUMAN_ADJUDICATION_PENDING = 7`
- `SCIENTIFIC_PASS = NO`
- `SCIENTIFIC_THINKING_CHARACTERIZATION = PENDING_HUMAN_ADJUDICATION_POST_REPAIR`

## Wave

- `W1_ARCHITECTURAL_CONVERGENCE_READY = YES`
- `W1_OBSERVABILITY_READY = YES`
- `W1_INDIVIDUAL_OWNER_CHARACTERIZATION_READY = NO`
- `W1_CONTROLLED_LOOP_CHARACTERIZATION_READY = NO`
- `WAVE_1_COMPLETE = NO`
- `WAVE_2_AUTHORIZED = NO`

## Next

`NEXT_AUTHORIZED_MISSION = NONE_PENDING_MANUAL_ST_CASE_ADJUDICATION`
