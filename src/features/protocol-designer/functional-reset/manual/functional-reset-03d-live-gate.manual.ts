import { loadEnv } from "vite";
import { handleScientificInterpretation } from "../../../../../api/scientific-interpretation";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import type { ScientificInterpretationContributionEnvelope } from "@/features/scientific-interpretation";
import { classifyFunctionalResetQueryDeferralScope } from "../query-deferral";

const TARGET_PROVIDER_OPERATIONS = 5;
const MAX_PROVIDER_ATTEMPTS = 15;
const workspace = process.cwd();

Object.assign(process.env, loadEnv("development", workspace, ""));
process.env.SCIENTIFIC_INTERPRETATION_MODE = "HYBRID_ACTIVE_WITH_LEGACY_FALLBACK";
process.env.SCIENTIFIC_INTERPRETATION_EVIDENCE_DIR ??= "/private/tmp/noxia-fr03d-live-gate-evidence";

const scenarios = [
  {
    id: "LIVE-03D-01",
    turns: [
      { turnId: "live-01-q", role: "NOXIA", content: "À quels moments ou dans quelles fenêtres les mesures doivent-elles être réalisées ?" },
      { turnId: "live-01-u", role: "USER", content: "J5-J7" },
    ],
    interactionContext: {
      interactionRef: "qry-presentation:live-01",
      sourceActionRef: "qry-action:live-01",
      owner: "QUERY_NAVIGATION",
      purpose: "À quels moments ou dans quelles fenêtres les mesures doivent-elles être réalisées ?",
      expectedResponseKind: "QRY_INFORMATION_RESPONSE",
      targetRefs: ["project-section:TEMPORALITY"],
      informationNeedRefs: ["project-need:TEMPORALITY:MEASUREMENT_TIMING"],
      projectRef: "project:live-01",
      projectVersion: "project:live-01:version:1",
      projectDigest: "digest:live-01",
    },
  },
  {
    id: "LIVE-03D-02",
    turns: [{ turnId: "live-02-u", role: "USER", content: "Je voudrais inclure des adultes de 18 à 80 ans avec un infarctus récent, datant de moins de 7 jours." }],
  },
  {
    id: "LIVE-03D-03",
    turns: [{ turnId: "live-03-u", role: "USER", content: "Je prévois une IRM initiale entre J5 et J7 puis un contrôle à 3 mois." }],
  },
  {
    id: "LIVE-03D-04",
    turns: [
      { turnId: "live-04-q", role: "NOXIA", content: "À quels moments ou dans quelles fenêtres les mesures doivent-elles être réalisées ?" },
      { turnId: "live-04-u", role: "USER", content: "Je voudrais inclure des adultes de 18 à 80 ans avec un infarctus récent, datant de moins de 7 jours. Je n’ai pas encore défini les autres critères d’inclusion ni les exclusions." },
    ],
    interactionContext: {
      interactionRef: "qry-presentation:live-04",
      sourceActionRef: "qry-action:live-04",
      owner: "QUERY_NAVIGATION",
      purpose: "À quels moments ou dans quelles fenêtres les mesures doivent-elles être réalisées ?",
      expectedResponseKind: "QRY_INFORMATION_RESPONSE",
      targetRefs: ["project-section:TEMPORALITY"],
      informationNeedRefs: ["project-need:TEMPORALITY:MEASUREMENT_TIMING"],
      projectRef: "project:live-04",
      projectVersion: "project:live-04:version:1",
      projectDigest: "digest:live-04",
    },
  },
  {
    id: "LIVE-03D-05",
    turns: [{ turnId: "live-05-u", role: "USER", content: "Je veux faire un projet sur les plaques carotidiennes au CT avec un médicament contre placebo, évaluation de la population d'origine à J0 ensuite rando, prise du produit, et évaluation à M1 pour voir si réduction significative entre les groupes." }],
  },
] as const;

type LiveResult = {
  id: string;
  statusCode: number;
  technicalStatus: unknown;
  fallbackUsed: unknown;
  runtimeVersion: unknown;
  rawOutputRef: unknown;
  keys: string[];
  changes: Array<{ section: string; semanticKey: string; presentation: string }>;
  objects: Array<{ type: string; role: string; content: string }>;
  unknowns: string[];
  deferralScope: ReturnType<typeof classifyFunctionalResetQueryDeferralScope>;
  failures: string[];
};

const includesFolded = (values: string[], pattern: RegExp) => values.some((value) => pattern.test(value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("fr-FR")));

const semanticFailures = (result: Omit<LiveResult, "failures">) => {
  const failures: string[] = [];
  const hasKey = (key: string) => result.keys.includes(key);
  const sectionContents = (section: string) => result.changes.filter((change) => change.section === section).map((change) => change.presentation);
  const object = (type: RegExp, content: RegExp) => result.objects.some((value) => type.test(value.type) && content.test(value.content));
  if (result.statusCode !== 200 || result.technicalStatus !== "AVAILABLE" || result.fallbackUsed !== false) failures.push("nominal hybrid response without fallback required");
  if (result.id === "LIVE-03D-01") {
    if (result.keys.length !== 1 || !hasKey("TEMPORALITY:MEASURE:WINDOW")) failures.push("short answer must yield exactly one temporal window");
  }
  if (result.id === "LIVE-03D-02" || result.id === "LIVE-03D-04") {
    if (!hasKey("POPULATION:ELIGIBILITY:AGE:MIN") || !hasKey("POPULATION:ELIGIBILITY:AGE:MAX")) failures.push("both explicit age bounds required");
    if (!includesFolded(sectionContents("POPULATION"), /age minimal : 18 ans/) || !includesFolded(sectionContents("POPULATION"), /age maximal : 80 ans/)) failures.push("age bound values must remain 18 and 80");
    if (result.keys.filter((key) => key === "POPULATION:ELIGIBILITY:EVENT_WINDOW:LT:7:DAY").length !== 1) failures.push("one canonical event eligibility window required");
  }
  if (result.id === "LIVE-03D-03") {
    if (!hasKey("TEMPORALITY:IRM:INITIAL") || !hasKey("TEMPORALITY:IRM:FOLLOW_UP")) failures.push("initial and follow-up MRI occurrences required");
    if (!includesFolded(sectionContents("TEMPORALITY"), /3 (?:mois|months?)/)) failures.push("three-month follow-up value required");
  }
  if (result.id === "LIVE-03D-04") {
    if (!includesFolded(result.unknowns, /inclusion/) || !includesFolded(result.unknowns, /exclusion/)) failures.push("explicit inclusion and exclusion unknowns required");
    if (includesFolded(result.unknowns, /temporel|temporal|moment|timing/)) failures.push("unanswered temporal QRY must not be invented as unknown");
    const targets = result.deferralScope?.targets ?? [];
    if (JSON.stringify(targets) !== JSON.stringify([{ sectionId: "POPULATION", facetIds: ["EXCLUSION", "INCLUSION"] }])) failures.push("deferral scope must contain only explicit population unknowns");
  }
  if (result.id === "LIVE-03D-05") {
    if (!object(/STUDY_DESIGN|DESIGN/i, /randomis|rando/i)) failures.push("randomization design object required");
    if (!object(/ANALYSIS/i, /réduction significative/i)) failures.push("significant reduction must be analysis intent");
    if (object(/BIOMARKER|MEASURED_VARIABLE|MEASUREMENT|ENDPOINT|OUTCOME/i, /réduction significative/i)) failures.push("significant reduction must not be promoted as a measurement");
    if (!hasKey("TEMPORALITY:CT:INITIAL") || !hasKey("TEMPORALITY:CT:FOLLOW_UP")) failures.push("J0 and M1 must be distinct baseline/follow-up occurrences");
    if (!includesFolded(sectionContents("TEMPORALITY"), /j0/) || !includesFolded(sectionContents("TEMPORALITY"), /m1/)) failures.push("J0 and M1 values required");
    if (includesFolded(sectionContents("POPULATION"), /population d origine|population d'origine/)) failures.push("baseline wording must not become a population criterion");
    if (!includesFolded(result.unknowns, /dependent measure|dependance mesuree|mesure precise|quantitative variable|variable|biomarker|biomarqueur|endpoint/)) failures.push("unspecified dependent measure must remain unknown");
  }
  return failures;
};

const results: LiveResult[] = [];

for (const scenario of scenarios) {
  let statusCode = 0;
  let responseBody: unknown = null;
  await handleScientificInterpretation({
    method: "POST",
    headers: { "content-type": "application/json" },
    socket: { remoteAddress: scenario.id },
    body: {
      apiVersion: "1.0.0",
      conversation: {
        conversationId: `conversation:${scenario.id}`,
        language: "fr",
        turns: scenario.turns,
        ...("interactionContext" in scenario ? { interactionContext: scenario.interactionContext } : {}),
      },
      previousContribution: null,
    },
  }, {
    status(code: number) { statusCode = code; return this; },
    setHeader() {},
    json(value: unknown) { responseBody = value; },
  });

  const record = responseBody as Record<string, unknown> | null;
  const contribution = record?.contribution as ScientificInterpretationContributionEnvelope | undefined;
  const candidate = contribution ? prepareResearchProjectContributionCandidate(contribution, null) : null;
  const changes = candidate?.changeSet.changes.filter((change) => change.operation !== "NO_CHANGE").map((change) => ({
    section: change.targetSectionId,
    semanticKey: change.semanticKey,
    presentation: change.presentation,
  })) ?? [];
  const userTurn = scenario.turns.at(-1)!;
  const deferralScope = contribution ? classifyFunctionalResetQueryDeferralScope({ contribution, sourceTurnId: userTurn.turnId, rawResponse: userTurn.content }) : null;
  const baseResult: Omit<LiveResult, "failures"> = {
    id: scenario.id,
    statusCode,
    technicalStatus: record?.technicalStatus,
    fallbackUsed: record?.fallbackUsed,
    runtimeVersion: contribution?.identity.runtimeVersion,
    rawOutputRef: contribution?.source.rawOutputRef,
    keys: changes.map((change) => change.semanticKey),
    changes,
    objects: contribution?.scientificContent.candidateObjects.map((value) => ({ type: value.proposedType ?? "", role: value.studyRole ?? "", content: value.content })) ?? [],
    unknowns: contribution ? [
      ...contribution.scientificContent.unknowns,
      ...contribution.scientificContent.missingInformation,
    ].map((value) => value.content) : [],
    deferralScope,
  };
  const result = { ...baseResult, failures: semanticFailures(baseResult) };
  results.push(result);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

const passed = results.filter((result) => result.failures.length === 0).length;
process.stdout.write(`${JSON.stringify({ gate: "FUNCTIONAL_RESET_03D_LIVE", targetProviderOperations: TARGET_PROVIDER_OPERATIONS, maxProviderAttempts: MAX_PROVIDER_ATTEMPTS, passed, total: results.length, decision: passed === results.length ? "PASS" : "FAIL" })}\n`);
if (passed !== results.length) process.exitCode = 1;
