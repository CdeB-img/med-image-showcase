# TARGETED-REFERENCE-CORPUS-01R — implementation report

## A. Baseline and scope

- Repository: `/Users/charles/Documents/Projets/NOXIA/noxia-dev`
- Branch: `protocol-designer-canonical-ingestion`
- Baseline HEAD: `82de4a8128044bba01a303180f06bea552cb63f6`
- Verified remote integration/main baseline: `b6aed0e2d3002d45cfce04c321f93e9faf917c01`
- Initial tracked/staged changes: `0 / 0`
- Preserved untracked reports: `9`
- Product/provider boundary: no live product test; no Gemini/OpenAI call; no engine, owner, Project or QRY runtime change.

The seven prior P1 targets were retained unchanged as the acquisition plan: current ANSM/CTIS material; imaging/Core Lab operational material; linked Protocol/CRF/dictionary/DMP/SAP artifacts; precision/observational/cluster/diagnostic dimensioning; observational/diagnostic design and measurement validity; EU/French safety and device pathways; French sponsor operational artifacts. Funding remains deferred P2.

## B. Accepted expansion

`RC01` increased from 58 to 89 sources. The 31 additions comprise:

- seven EU/French regulatory records (`RC01-A-023`–`A-029`);
- four targeted methodological records (`RC01-B-035`–`B-038`);
- five imaging/monitoring/data-management/French operational records (`RC01-C-043`–`C-047`);
- fifteen platform-trial artifacts (`RC01-E-059`–`E-073`).

Only two new binaries passed the rights and identity gate:

- CTR Q&A version 7.2, 161 pages, SHA-256 `f18321ee8540d42448d79e697589f755fe942beee927cc40e6b14fc4a1d6931f`;
- FDA diagnostic-test statistical guidance, 39 pages, SHA-256 `4a5c66b8a05cdd71d0abc68d528c0f225a5382be9908a6517749ed030551bd0b`.

The three inspected MDCG binaries were not retained: official EC hosting did not establish that the Commission-owned-content licence applied to documents explicitly described as non-Commission documents. ANSM, ECRIN, ANRS, NCI/IROC and sponsor/platform artifacts also remain metadata-only where file-level reuse rights were absent or restricted.

## C. Content availability and bridge index

The existing generator was reused unchanged. The deterministic index increased:

- indexable sources: 5 → 7;
- indexed sections: 84 → 118 (`+34`);
- need/source/section mappings: 64 → 85;
- serialized index size: 96,575 → 134,469 bytes.

New anchored coverage includes CTR submission/modification/safety needs and diagnostic-design, measurement-validity and dimensioning needs. Metadata-only sources remain source snapshots and never emit content assertions.

## D. Platform trial subset

The explicit non-normative set contains five methodologically diverse platforms and fifteen linked artifacts:

1. STEP — master/domain/resource lineage; imaging-rich stroke platform.
2. REMAP-CAP — core/SAP/regional-operational layers.
3. PRINCIPLE — community platform with arm/amendment/result lineage.
4. PRACTICAL — registry-embedded master/domain platform.
5. I-SPY 2 / 2.2 — biomarker-adaptive platform with serial MRI and an imaging-data collection.

For each platform the registry preserves the requested trial identity, sponsor, condition, master protocol identity, design, platform features, arm/cohort model, shared-control status, adaptive features, documents and versions, amendments, publications, imaging component, provenance, linkage evidence/confidence, copyright and local-content status. All fifteen platform artifacts are metadata-only. No practice rule was admitted.

## E. Gap reclassification

The current reclassification is recorded in `targeted-gap-reclassification-01r.json` with exact need, owner, source, section anchor where available, support type, jurisdiction and limitations.

| Prior target | Result | Residual boundary |
|---|---|---|
| ANSM / CTIS | `STRONGLY_IMPROVED` | ANSM currentness and complete bundle remain human-qualified |
| Imaging / Core Lab | `PARTIALLY_IMPROVED` | no complete rights-clear charter/Core Lab/reader-adjudication package |
| Linked operational chain | `PARTIALLY_IMPROVED` | zero complete Protocol→CRF→dictionary→DMP→SAP chain |
| Biostatistics dimensioning | `CLOSED_FOR_CURRENT_SCOPE` | longitudinal/small-population depth and executable mechanics remain separate |
| Observational/design/validity | `STRONGLY_IMPROVED` | cross-domain and IVD/software-specific depth remains partial |
| EU/French safety and devices | `STRONGLY_IMPROVED` | IVD/software-AI routes remain incomplete |
| French operations | `PARTIALLY_IMPROVED` | no complete versioned French sponsor QA/DM/monitoring manual set |

No residual P0 documentary gap remains after the pre-existing bridge baseline. Nine P1 documentary gap identities remain explicit and bounded; no global-coverage claim is made.

## F. Validation evidence

- RC01 integrity validator: PASS — 89 unique sources, 7 local copies, 10 linked sets, 26 linked artifacts, 5 platform trials.
- Owner coverage/relationship validator: PASS — 72 needs and exact coverage of all 10 linked sets.
- Deterministic index regeneration/check: PASS — 7 sources, 118 indexed sections, 85 need/source links.
- Bridge/reference targeted tests: PASS — 3 files, 38 tests.
- URL check: 87 unique official URLs; 72 PASS, 15 REVIEW due official-site abuse protection/403/405/network behavior, 0 FAIL.
- Binary integrity: PASS — original bytes retained, exact SHA-256, no duplicate digest.
- Visual PDF identity inspection: PASS for both retained documents; no OCR required.
- External authority promotion: NONE.
- Practice-pattern extraction: candidate recording only; no rule or runtime behavior.

The inherited pre-bridge `knowledge-runtime-reachability.json` remains a historical audit at SHA `76a5d919…`; it is not used as current-state evidence. Current reachability is established by the existing bridge at baseline `82de4a81…` and the passing runtime-consumption tests.

## G. Boundaries and next action

- `ENGINE_RUNTIME_FILES_CHANGED = 0`
- `BRIDGE_RUNTIME_FILES_CHANGED = 0`
- The only file below `src/` is the existing bridge test updated for the expanded registry and new anchored/platform cases.
- `PLATFORM_TRIAL_IMAGING_TRANSPOSITION = PLANNED_NOT_EXECUTED`
- Future benchmark target: functionally equivalent or better document set with scientific coherence, appropriate commitment/underspecification, cross-document consistency, versionability, traceability and professional credibility.
- Next action: `PRACTICE_PATTERN_EXTRACTION_01` — not executed here.

`P1_COMPLETE = NO`

`P1_EXIT_GATE = NOT_SATISFIED`

`WAVE_2_AUTHORIZED = NO`
