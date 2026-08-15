export const QRY001_CLOSURE_SCENARIO_FAMILIES = [
  "A_KNOWN_INFORMATION",
  "B_BLOCKING_UNKNOWN",
  "C_PREREQUISITE_ORDERING",
  "D_MULTIPLE_NON_DOMINATED_ACTIONS",
  "E_HUMAN_PREFERENCE",
  "F_DEFER",
  "G_DECLINE",
  "H_CANNOT_ANSWER",
  "I_STALE_QUESTION",
  "J_STALE_RESPONSE",
  "K_VAL_HUMAN_REVIEW",
  "L_PENDING_SEMANTIC_REVIEW",
  "M_TECHNICAL_NOT_EVALUABLE",
  "N_READINESS_CHANGE",
  "O_NOT_GENERATABLE",
  "P_REALIZED_TIME_DEFERRED",
  "Q_NO_USEFUL_ACTION",
  "R_SUFFICIENT_CURRENT_STEP",
  "S_REFUSAL",
  "T_MULTI_CYCLE_NO_LOOP",
  "U_RELOAD_RECONSTRUCTION",
  "V_BRANCH_AWARE_MEMORY",
] as const;

const gate = (number: number, requirement: string, evidenceRefs: string[]) => ({
  gateId: `QRY-CLOSE-C${String(number).padStart(2, "0")}`,
  requirement,
  evidenceRefs,
});

export const QRY001_CLOSURE_GATES = [
  gate(1, "Parts 2 and 3 are committed", ["18279c4b", "9a04ad00"]),
  gate(2, "PD-009 remains the sole navigation-policy owner", ["QRY2-PD009-C01"]),
  gate(3, "Project remains source of truth", ["QRY2-CTX-C01", "QRY3-RESP-C02"]),
  gate(4, "Navigation Context is read-only", ["QRY2-CTX-C01"]),
  gate(5, "Navigation Needs retain their sources", ["QRY2-CTX-C05"]),
  gate(6, "Action candidates are explainable", ["QRY2-ACT-C08", "QRY2-ACT-C09"]),
  gate(7, "Eligibility is deterministic", ["QRY2-DET-C01"]),
  gate(8, "Information value follows PD-009", ["QRY2-PD009-C02", "QRY2-PD009-C03"]),
  gate(9, "No arbitrary score exists", ["QRY2-PD009-C05"]),
  gate(10, "No arbitrary tie-break exists", ["QRY2-SEL-C07"]),
  gate(11, "Non-dominated options are retained", ["QRY2-PD009-C06"]),
  gate(12, "Human preference is not auto-resolved", ["QRY2-PD009-C07", "QRY3-HUM-C05"]),
  gate(13, "Known information is not requested again", ["QRY2-ELI-C07", "QRY3-MEM-C04"]),
  gate(14, "Premature questions are excluded", ["QRY2-ELI-C02"]),
  gate(15, "System gaps are not asked to researchers", ["QRY2-PD009-C13", "QRY4-UI-C10"]),
  gate(16, "Realized-time deferred work is not immediate", ["QRY2-ELI-C03"]),
  gate(17, "VAL NOT_EVALUABLE is preserved", ["QRY3-VAL-C07", "QRY4-UI-C11"]),
  gate(18, "Pending semantic review is not auto-resolved", ["QRY3-VAL-C01"]),
  gate(19, "Human Review is routed to the human boundary", ["QRY3-VAL-C03", "QRY4-UI-C09"]),
  gate(20, "Selected is not resolved", ["QRY3-LIFE-C01"]),
  gate(21, "Response is not Project truth", ["QRY3-RESP-C02"]),
  gate(22, "Free text routes to Scientific Interpretation", ["QRY3-RESP-C03"]),
  gate(23, "Human Decision remains human-owned", ["QRY3-HUM-C01", "QRY3-HUM-C08"]),
  gate(24, "QRY performs zero Project writes", ["QRY4-BND-C01"]),
  gate(25, "QRY performs zero VAL writes", ["QRY4-BND-C03", "QRY4-BND-C04"]),
  gate(26, "QRY performs zero provider calls", ["QRY4-BND-C12"]),
  gate(27, "Deduplication is structural", ["QRY3-MEM-C01", "QRY3-MEM-C02"]),
  gate(28, "No fuzzy decision matching is used", ["QRY3-MEM-C10"]),
  gate(29, "Defer lifecycle is operational", ["QRY3-LIFE-C04", "QRY4-UI-C07"]),
  gate(30, "Decline and cannot-answer do not loop", ["QRY3-MEM-C06", "QRY4-UI-C08"]),
  gate(31, "Stale action is detected", ["QRY3-FRESH-C03"]),
  gate(32, "Stale response is not promoted", ["QRY3-RESP-C09"]),
  gate(33, "Project change triggers reevaluation", ["QRY3-FRESH-C05"]),
  gate(34, "VAL change triggers reevaluation", ["QRY3-TRACE-C07"]),
  gate(35, "Branch-aware identity is retained", ["QRY3-MEM-C08"]),
  gate(36, "Navigation preference is not scientific truth", ["QRY3-HUM-C05"]),
  gate(37, "Stop is not Project complete", ["QRY2-SEL-C08"]),
  gate(38, "Current-step sufficiency is not PD-011 PASS", ["QRY2-SEL-C09", "QRY4-BND-C11"]),
  gate(39, "Protocol refusal is not bypassed", ["QRY2-PD009-C12"]),
  gate(40, "End-to-end trace is reconstructible", ["QRY3-TRACE-C01", "QRY4-CLOSE-E2E"]),
  gate(41, "Replay is deterministic", ["QRY3-TRACE-C08", "QRY4-CLOSE-REPLAY"]),
  gate(42, "Minimal product surface is functional", ["QRY4-UI-C01", "QRY4-UI-C15"]),
  gate(43, "No second decision engine is active", ["QRY4-BND-C10"]),
  gate(44, "UX-001 is not implemented", ["QRY4-BND-C10"]),
  gate(45, "No regression attributable to QRY remains", ["QRY001_FINAL_VALIDATION"]),
] as const;

export const countImplicitDuplicatePresentations = (events: readonly { eventType: string; actionRef: string; evidenceRefs: readonly string[] }[]) => {
  const presented = new Set<string>();
  const explicitResume = new Set<string>();
  let duplicateCount = 0;
  events.forEach((event) => {
    if (event.eventType === "ACTION_REOPENED" && event.evidenceRefs.length > 0) explicitResume.add(event.actionRef);
    if (event.eventType !== "ACTION_PRESENTED") return;
    if (presented.has(event.actionRef) && !explicitResume.delete(event.actionRef)) duplicateCount += 1;
    presented.add(event.actionRef);
  });
  return duplicateCount;
};

export const QRY001_CLOSURE_CAMPAIGN_BOUNDARY = {
  evidenceStatus: "VISIBLE_SYNTHETIC_CONTRACT_FIXTURES",
  qualificationStatus: "NOT_PD011_QUALIFICATION",
  providerCalls: 0,
  projectWrites: 0,
  validationWrites: 0,
  humanDecisionsCreated: 0,
  blindDataUsed: false,
} as const;
