import { logicalDigest, uniqueSorted } from "./canonical";
import { isApplicable } from "./applicability";
import type { RuntimeAssertion } from "./types";

export type AssertionResolution = {
  applicableAssertions: RuntimeAssertion[];
  excludedAssertions: RuntimeAssertion[];
  candidateAssertions: RuntimeAssertion[];
  duplicateGroups: Array<{ groupId: string; assertionIds: string[] }>;
  digest: string;
};

export const resolveAssertions = (assertions: RuntimeAssertion[]): AssertionResolution => {
  const currentByRevision = new Map<string, RuntimeAssertion>();
  for (const assertion of assertions.sort((left, right) => `${left.stableId}:${left.revision}:${left.providerId}`.localeCompare(`${right.stableId}:${right.revision}:${right.providerId}`))) {
    const key = `${assertion.providerId}:${assertion.revision}`;
    if (!currentByRevision.has(key)) currentByRevision.set(key, assertion);
  }
  const values = [...currentByRevision.values()];
  const candidateAssertions = values.filter((item) => item.status === "ASSERTION_CANDIDATE");
  const effective = values.filter((item) => item.status !== "ASSERTION_CANDIDATE");
  const applicableAssertions = effective.filter((item) => isApplicable(item.applicability));
  const excludedAssertions = effective.filter((item) => !isApplicable(item.applicability));
  const grouped = new Map<string, RuntimeAssertion[]>();
  for (const assertion of values) {
    const key = logicalDigest({ atomicContent: assertion.atomicContent, context: assertion.context });
    grouped.set(key, [...(grouped.get(key) ?? []), assertion]);
  }
  const duplicateGroups = [...grouped.entries()].filter(([, group]) => group.length > 1).map(([groupId, group]) => ({ groupId, assertionIds: uniqueSorted(group.map((item) => item.revision)) }));
  const material = { applicable: applicableAssertions.map((item) => item.revision), excluded: excludedAssertions.map((item) => item.revision), candidates: candidateAssertions.map((item) => item.revision), duplicateGroups };
  return { applicableAssertions, excludedAssertions, candidateAssertions, duplicateGroups, digest: logicalDigest(material) };
};

