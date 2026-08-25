/* eslint-disable @typescript-eslint/no-explicit-any -- renderer projects immutable machine evidence for human review */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../../..");
const OUT = resolve(ROOT, "validation/w1-qual-01h1-st");
const DOCS = resolve(ROOT, "docs/implementation");
const read = <T>(name: string) => JSON.parse(readFileSync(resolve(OUT, name), "utf8")) as T;
const cases = read<any>("case-registry.json").cases as any[];
const envelopes = read<any>("human-review-envelope-registry.json").entries as any[];
const inputs = read<any>("frozen-input-registry.json").packs as any[];
const freeze = read<any>("campaign-freeze.json");
const parentage = read<any>("parentage-audit.json");
const execution = read<any>("execution-results.json");
const checks = read<any>("deterministic-checks.json");
const terminals = read<any>("terminal-outcomes.json");
const replays = read<any>("determinism-replays.json");
const trace = read<any>("trace-index.json");
const manifest = read<any>("campaign-manifest.json");

const frozenCheckerDiagnosis = [
  {
    control: "PROJECT_QUESTION_DRIFT",
    affectedCases: 11,
    observed: "validatedReformulation conserve exactement la question ; originalExpression conserve contractuellement question + purpose.",
    frozenExpectation: "originalExpression et validatedReformulation tous deux égaux à la question seule.",
    attribution: "DETERMINISTIC_CHECKER_EXPECTATION_MISMATCH",
  },
  {
    control: "TRACE_INCOMPLETE",
    affectedCases: 11,
    observed: "La séquence nominale contient RESULT_PERSISTED, l'événement défini par le schéma TRACE courant.",
    frozenExpectation: "OWNER_RESULT_PERSISTED, nom absent du schéma TRACE courant.",
    attribution: "DETERMINISTIC_CHECKER_EVENT_NAME_MISMATCH",
  },
  {
    control: "CONTRADICTION_LOSS",
    affectedCases: 3,
    observed: "La contradiction est conservée dans la forme typée conflictId:state:explanation.",
    frozenExpectation: "Égalité de tableau avec l'explication nue, sans préfixe typé.",
    attribution: "DETERMINISTIC_CHECKER_REPRESENTATION_MISMATCH",
  },
];

const bullets = (items: string[], empty = "Aucun élément déclaré.") => items.length ? items.map((item) => `- ${item}`).join("\n") : `- ${empty}`;
const candidateList = (items: any[], renderItem: (item: any) => string, empty: string) => items?.length ? items.map((item) => `- ${renderItem(item)}`).join("\n") : `- ${empty}`;
const humanAnswerTable = (questions: any[]) => [
  "| ID | Question de revue | Réponse H1 |",
  "|---|---|---|",
  ...questions.map((item) => `| ${item.id} | ${item.prompt} | \`PENDING\` |`),
].join("\n");
const deterministicTable = (globalControls: Record<string, string>) => [
  "| Contrôle déterministe | Résultat |",
  "|---|---|",
  ...Object.entries(globalControls).map(([name, outcome]) => `| \`${name}\` | \`${outcome}\` |`),
].join("\n");

const packetSections = cases.map((caseItem, index) => {
  const envelope = envelopes.find((item) => item.caseId === caseItem.caseId)?.envelope;
  const result = execution.results.find((item: any) => item.caseId === caseItem.caseId);
  const pack = inputs.find((item) => item.sourceCase === caseItem.caseId);
  const output = result.stOutput;
  const stale = caseItem.expectedExecution === "PRE_OWNER_REJECTION_EXPECTED";
  const models = output?.scientificModels ?? [];
  return `## ${index + 1}. ${caseItem.title}

**Cas :** \`${caseItem.caseId}\`

**Domaine :** ${caseItem.domain}

**Famille :** \`${caseItem.family}\`

**Résumé :** ${caseItem.summary}

### Entrée scientifique gelée

**Question Project**

> ${caseItem.question}

**Assertions pertinentes**

${bullets(caseItem.relevantAssertions)}

**Sources et références**

${bullets(caseItem.sourceRefs, "Aucune source applicable dans le pack figé.")}

**Références de preuve**

${bullets(caseItem.evidenceRefs, "Aucune preuve applicable dans le pack figé.")}

**Gaps**

${bullets(caseItem.gaps)}

**Limitations**

${bullets(caseItem.limitations)}

**Contradictions**

${bullets(caseItem.contradictions)}

${stale ? `### Comportement fail-closed attendu et observé

| Élément | Valeur |
|---|---|
| Expected behavior | \`fail closed before ST\` |
| Observed | \`${result.error}\` |
| ST invoked | \`NO\` |
| OwnerResult | \`NONE_EXPECTED\` |

Le reviewer n'a aucune hypothèse ST à juger pour ce cas. Le rejet technique et sa reproductibilité seront enregistrés en H2 sans inventer de sortie scientifique.
` : `### Sortie Scientific Thinking 1.2.1

**Questions candidates**

${candidateList(output?.questions, (item) => `${item.text} — ${item.testability}, support ${item.support}, revue ${item.reviewState}`, "Aucune question candidate.")}

**Objectifs candidats**

${candidateList(output?.objectives, (item) => `${item.text} — ${item.level}, support ${item.support}, revue ${item.reviewState}`, "Aucun objectif candidat.")}

**Hypothèses candidates**

${candidateList(output?.hypotheses, (item) => `${item.text} — ${item.kind}, ${item.falsifiability}, support ${item.support}, revue ${item.reviewState}`, "Aucune hypothèse candidate.")}

**Alternatives**

${bullets(output?.alternatives ?? [])}

**Scientific Models**

${candidateList(models, (item) => item.text ?? JSON.stringify(item), "Aucun ScientificModel autonome produit par ce runtime.")}

**Mécanismes candidats**

${candidateList(output?.mechanisms, (item) => `${item.text} — ${item.status}, support ${item.support}`, "Aucun mécanisme candidat.")}

**Reasoning gaps et inconnues**

${bullets([...(output?.reasoningIssues ?? []), ...(output?.unknowns ?? []), ...(output?.knowledgeRequest?.gapCodes ?? [])])}

**Limitations transmises**

${bullets([...(output?.handoff?.limitations ?? []), ...(result.ownerResultMetadata?.limitations ?? [])])}
`}
### Contrôles déterministes

${deterministicTable(result.deterministic.globalControls)}

| Trace technique | Valeur |
|---|---|
| runId | \`${result.runId}\` |
| result digest | \`${result.resultDigest ?? "NONE_EXPECTED"}\` |
| Project tuple | \`${pack.projectBinding.projectId}@${pack.projectBinding.projectVersion}#${pack.projectBinding.projectDigest}\` |
| Knowledge ref | \`${pack.knowledgeResultBinding.ownerResultRef}#${pack.knowledgeResultBinding.resultDigest}\` |
| TRACE events | ${result.trace.eventCount}; complète = \`${result.trace.complete ? "YES" : "NO"}\` |
| first divergent technical stage | \`${result.firstDivergentTechnicalStage ?? "NONE"}\` |
| Project writes | \`${result.projectWrites}\` |

Ces contrôles attestent uniquement des invariants techniques et de sécurité. Ils ne jugent pas la pertinence scientifique des candidats.

### HumanReviewEnvelope pré-écrit

**Ce que ST devrait traiter**

${bullets(envelope.whatSTShouldAddress)}

**Informations critiques à préserver**

${bullets(envelope.criticalInformationToPreserve)}

**Comportements scientifiquement interdits**

${bullets(envelope.scientificallyForbiddenBehaviors)}

**Types de réponse acceptables**

${bullets(envelope.acceptableKindsOfResponse)}

**Unknowns connus**

${bullets(envelope.knownUnknowns)}

**Contradictions connues**

${bullets(envelope.knownContradictions)}

**Limitations connues**

${bullets(envelope.knownLimitations)}

**Références**

${bullets(envelope.referenceRefs)}

### Questions pour la revue humaine H2

${humanAnswerTable(envelope.humanReviewQuestions)}

**Commentaire du reviewer :** \`PENDING\`

---`;
}).join("\n\n");

const packet = `# W1-QUAL-01H1 — Scientific Thinking Human Review Packet

\`LEVEL_3_IMPLEMENTATION_EVIDENCE — NON_NORMATIVE\`

## Décision de préparation

\`${manifest.finalDecision}\`

**STATUT FAIL-CLOSED : ce document n'est pas admis pour l'adjudication H2.**

Ce document de diagnostic est destiné à Charles. Il présente 12 cas indépendants, leurs inputs Project + Knowledge gelés, la sortie unique de Scientific Thinking \`1.2.1\`, les traces techniques et les critères écrits avant observation. Le checker déterministe gelé a produit 25 échecs sur 11 cas ; conformément au contrat sans reroll ni repair, le paquet n'est pas déclaré prêt. Il ne contient aucune adjudication scientifique automatique.

\`SCIENTIFIC_THINKING_CHARACTERIZED = NO\`

\`HUMAN_ADJUDICATION_COMPLETED = 0\`

\`HUMAN_ADJUDICATION_PENDING = ${cases.length}\`

## Comment utiliser ce document

Ce document permet d'inspecter les preuves produites, mais les champs H1–H8 doivent rester \`PENDING\` tant qu'une décision humaine de programme n'a pas statué sur le paquet non prêt. Pour chaque cas, la question, le Knowledge pack abrégé et la sortie ST sont conservés sans les transformer en verdict.

Les contrôles déterministes attestent uniquement leurs résultats enregistrés. Leurs trois incompatibilités d'attente sont documentées en annexe ; elles ne peuvent pas être corrigées après exposition. Elles ne prouvent ni un défaut ST, ni un Scientific PASS.

## Vue d'ensemble

| Cas | Domaine | Famille | Terminal technique | Revue humaine |
|---|---|---|---|---|
${cases.map((item) => {
  const result = execution.results.find((candidate: any) => candidate.caseId === item.caseId);
  return `| \`${item.caseId}\` | ${item.domain} | \`${item.family}\` | \`${result.terminalOutcome}\` | \`PENDING\` |`;
}).join("\n")}

${packetSections}

## Annexe — limites du paquet

- Le manifest conclut \`W1_QUAL_01H1_REVIEW_PACKET_NOT_READY\` : H2 n'est pas exécutable sur cette preuve sans nouvelle décision humaine de programme.
- Le checker gelé produit 11 faux échecs de question, 11 faux échecs de nom d'événement TRACE et 3 faux échecs de représentation de contradiction ; aucun correctif ni rerun n'a été appliqué.
- Les cas sont synthétiques et bornés ; ils ne démontrent pas une utilité clinique réelle ni une transportabilité externe.
- Les références sont limitées au corpus NOXIA local admis et aux contrats applicables ; aucune recherche externe n'a été réalisée.
- Le paquet ne constitue ni une référence experte PD-011 complète, ni une validation aveugle, ni une qualification.
- La décision finale sur chaque cas et sur la caractérisation ST appartiendra uniquement à une future mission humaine explicitement autorisée.
`;

const report = `# W1-QUAL-01H1 — ST Bounded Human Recharacterization Review Packet Preparation

\`LEVEL_3_IMPLEMENTATION_EVIDENCE — NON_NORMATIVE\`

## 1. Decision

\`${manifest.finalDecision}\`

H1 a produit une campagne reconstructible, mais le paquet de revue humaine n'est pas prêt : le checker gelé a signalé 25 échecs sur 11 cas. H1 ne caractérise pas Scientific Thinking, ne prononce aucun Scientific PASS et n'exécute pas H2.

\`SCIENTIFIC_THINKING_CHARACTERIZATION = NOT_ADJUDICATED\`

## 2. Human program decision

\`AUTOMATED_ST_CHARACTERIZATION_HARNESS = NOT_MATURE_FOR_SCIENTIFIC_ADJUDICATION\`

\`FURTHER_AUTOMATED_HARNESS_REPAIR = STOPPED_BY_HUMAN_PROGRAM_DECISION\`

Campaigns A, B et C restent des preuves exposées invalides. Leurs cas et contrôleurs servent seulement à l'audit de parenté et à la conservation historique.

## 3. Baseline and authority boundary

| Élément | Valeur |
|---|---|
| Branche | \`protocol-designer-canonical-ingestion\` |
| HEAD initial | \`ccc6b37dce77c76209cbe556d6ae327c9267dd9d\` |
| HEAD au freeze | \`${freeze.gitHead}\` |
| Main / origin main | \`9be06edca1a7500ab7a43d065e94241e91d67bec\` |
| ST | \`${freeze.stVersion}\` |
| ST runtime modified | \`NO\` |
| TRACE ledger | \`${freeze.traceVersion.ledger}\` |
| Checker | \`${freeze.deterministicChecker.version}\` / \`${freeze.deterministicChecker.digest}\` |

Les autorités ont été consultées dans l'ordre obligatoire : Source-of-Truth Index ; Charte fondatrice ; Scientific Product Manifesto V2 ; Editorial Engine Architecture Manifesto ; roadmap. Les références spécialisées appliquées sont PD-003 V2, Ownership Matrix, Relationship Catalog, PD-005, PD-009, PD-011, RDE-001, RDE-002 et KE-001. W1-QUAL-01, W1-ST-REPAIR-01, W1-QUAL-01R/R1/R2 et W1-TRACE-01 sont utilisés uniquement comme preuves Level 3.

Aucune contradiction normative réelle n'a été trouvée. Le mandat humain remplace la transition R3 sans modifier une norme scientifique.

## 4. Method

1. Douze cas entièrement nouveaux ont été écrits et comparés aux corpus exposés.
2. Un HumanReviewEnvelope non-Gold a été écrit pour chaque cas avant observation.
3. Chaque cas a reçu un ProjectContextSnapshot et un KnowledgeResult synthétique, typé, versionné, digéré et gelé.
4. Campaign ID, HEAD, ST, registres, parentage, TRACE et checker ont été gelés avant la première invocation.
5. Chaque cas a été exécuté une fois, sans reroll ni repair ; l'échec du gate final est conservé.
6. Trois cas pré-sélectionnés ont été rejoués uniquement pour le déterminisme.
7. Les contrôles automatiques sont limités aux invariants objectifs ; les dimensions scientifiques restent \`HUMAN_REVIEW_REQUIRED\`.

## 5. Independence and parentage

| Cas | Statut | Matériau le plus proche | Raison de distinction |
|---|---|---|---|
${parentage.cases.map((item: any) => `| \`${item.caseId}\` | \`${item.status}\` | ${item.nearestExposedMaterial.join("; ")} | ${item.distinctnessRationale} |`).join("\n")}

Comptes : ${parentage.counts.novel} \`NOVEL\`, ${parentage.counts.relatedButDistinct} \`RELATED_BUT_DISTINCT\`, 0 \`TOO_CLOSE\`, 0 \`EXACT_OR_NEAR_DUPLICATE\`. Aucun cas exclu n'a été réintroduit comme preuve indépendante.

## 6. Freeze

| Élément gelé | Digest / version |
|---|---|
| Campaign | \`${freeze.campaignId}\` |
| Freeze digest | \`${freeze.freezeDigest}\` |
| Case registry | \`${freeze.registryDigests.caseRegistry}\` |
| HumanReviewEnvelope registry | \`${freeze.registryDigests.humanReviewEnvelopeRegistry}\` |
| Frozen input registry | \`${freeze.registryDigests.frozenInputRegistry}\` |
| Parentage audit | \`${freeze.registryDigests.parentageAudit}\` |
| ST engine | \`${freeze.stRuntime.engine.sha256}\` |
| ST types | \`${freeze.stRuntime.types.sha256}\` |
| Product ST runtime | \`${freeze.stRuntime.productRuntime.sha256}\` |

Après exposition, aucun cas, envelope, input, checker ou runtime ST n'a été modifié.

## 7. Execution and TRACE

| Mesure | Compte exact |
|---|---:|
| Cas | ${cases.length} |
| Primary runs | ${execution.primaryExecutions} |
| OwnerResults produits | ${terminals.counts.ownerResultsProduced} |
| Rejets pré-owner attendus | ${terminals.counts.expectedPreOwnerRejections} |
| Échecs techniques selon le gate gelé | ${terminals.counts.unexpectedFailures} |
| Primary TRACE déclarées complètes par le checker gelé | ${trace.counts.completePrimaryRuns}/${trace.counts.primaryRuns} |
| Replays pré-sélectionnés | ${replays.counts.selected} |
| Replays stables | ${replays.counts.stable} |
| Rerolls | ${execution.rerolls} |
| Repairs | ${execution.repairs} |
| LLM/provider/network calls | 0 / 0 / 0 |
| Project writes | ${manifest.projectWrites} |

Les 11 exécutions nominales ont chacune conservé la séquence \`RUN_STARTED → HANDOFF_STARTED → HANDOFF_ACCEPTED → OWNER_INVOCATION_STARTED → OWNER_INVOCATION_COMPLETED → RESULT_PERSISTED → RUN_COMPLETED\`. Le cas stale a conservé la séquence fail-closed attendue. Le checker gelé cherchait toutefois \`OWNER_RESULT_PERSISTED\`, nom absent du schéma courant, et n'a donc reconnu qu'une trace sur douze. Aucun raisonnement privé n'est enregistré.

## 8. Deterministic structural and safety checks

| Contrôle global | PASS | FAIL | N/A | Verdict technique |
|---|---:|---:|---:|---|
${Object.entries(checks.globalSummary).map(([name, value]: [string, any]) => `| \`${name}\` | ${value.pass} | ${value.fail} | ${value.notApplicable} | \`${value.verdict}\` |`).join("\n")}

Contrôles élémentaires : ${checks.counts.checks} au total ; ${checks.counts.pass} PASS ; ${checks.counts.fail} FAIL ; ${checks.counts.notApplicable} NOT_APPLICABLE.

Ces résultats ne constituent pas un Scientific PASS. La qualité des hypothèses, des mécanismes, des omissions et des alternatives reste PENDING jusqu'à une éventuelle mission humaine explicitement autorisée.

### Premier étage divergent observé

| Contrôle | Cas affectés | Observation | Attente gelée | Attribution |
|---|---:|---|---|---|
${frozenCheckerDiagnosis.map((item) => `| \`${item.control}\` | ${item.affectedCases} | ${item.observed} | ${item.frozenExpectation} | \`${item.attribution}\` |`).join("\n")}

Les 25 échecs sont entièrement expliqués par ces trois attentes incompatibles du checker gelé. Cela n'établit aucun nouveau défaut du runtime ST. Cela invalide néanmoins le gate H1, car le checker ne peut être modifié après exposition et aucun rerun n'est autorisé.

## 9. Human review status

\`HUMAN_REVIEW_CASES = ${cases.length}\`

\`HUMAN_ADJUDICATION_COMPLETED = 0\`

\`HUMAN_ADJUDICATION_PENDING = ${cases.length}\`

Le template machine conserve H1–H8 à \`PENDING\` pour chaque cas. Aucune disposition finale n'est calculée ici. H2 ne doit pas recevoir ces cas tant qu'une décision humaine de programme n'a pas traité le statut \`NOT_READY\`.

## 10. Limitations

- corpus synthétique de 12 cas, non populationnel ;
- aucune validation aveugle ou comparaison humaine PD-011 ;
- références locales bornées et aucune recherche externe ;
- aucun benchmark de sensibilité, spécificité ou performance scientifique ;
- la revue d'un seul humain en H2, si retenue, devra être explicitement bornée et ne deviendra pas une validation universelle ;
- la caractérisation contrôlée de la boucle assemblée reste non réalisée.

## 11. Program status

\`W1_ARCHITECTURAL_CONVERGENCE_READY = YES\`

\`W1_OBSERVABILITY_READY = YES\`

\`W1_INDIVIDUAL_OWNER_CHARACTERIZATION_READY = NO\`

\`W1_CONTROLLED_LOOP_CHARACTERIZATION_READY = NO\`

\`WAVE_1_COMPLETE = NO\`

\`WAVE_2_AUTHORIZED = NO\`

\`NEXT_AUTHORIZED_MISSION = NONE_PENDING_EXPLICIT_HUMAN_PROGRAM_DECISION\`

\`W1-QUAL-01H2_ST_HUMAN_ADJUDICATION_CLOSURE = NOT_AUTHORIZED_FROM_THIS_FAILED_GATE\`

H2 n'est pas exécutée par H1. Le mandat initial visait H2 après un paquet prêt ; cette condition n'est pas satisfaite. Une nouvelle décision humaine de programme est nécessaire, sans correction rétroactive du checker ni rerun de Campaign D.

## 12. Verification record

| Vérification | Résultat exact |
|---|---|
| Validation statique des artefacts H1 | 12/12 fichiers machine requis présents ; digests registres, outputs, checker, authoring et trois fichiers runtime conformes au freeze ; 11/11 assertions composites PASS |
| Exécution H1 gelée | 12 primary runs ; 11 OwnerResults ; 1 rejet stale attendu ; gate final FAIL avec 25 échecs gelés |
| Replays H1 | 3/3 stables ; 0 divergent |
| Tests ST + product handoff + TRACE | 9/9 fichiers PASS ; 133/133 tests PASS |
| Typecheck application | PASS |
| Typecheck API / server + Node ESM handler load | PASS / PASS / PASS |
| Lint ciblé | 5/5 fichiers TypeScript H1 sans erreur |
| Build Vite | PASS ; avertissements non bloquants préexistants sur Browserslist, annotations PURE, syntaxe CSS et taille des chunks |
| Secret scan ciblé | 0 correspondance |

Le gate H1 rouge n'est pas masqué par les suites techniques vertes. Aucun test technique ne constitue une adjudication scientifique.
`;

writeFileSync(resolve(DOCS, "w1-qual-01h1-st-human-review-packet.md"), packet, "utf8");
writeFileSync(resolve(DOCS, "w1-qual-01h1-st-bounded-human-recharacterization-report.md"), report, "utf8");

console.log(JSON.stringify({
  packet: "docs/implementation/w1-qual-01h1-st-human-review-packet.md",
  report: "docs/implementation/w1-qual-01h1-st-bounded-human-recharacterization-report.md",
  cases: cases.length,
  pending: cases.length,
}, null, 2));
