import fs from "node:fs";
import path from "node:path";
import {
  DECISION_ROOT,
  FIXTURE_ROOT,
  PRECOMMITMENT_ROOT,
  buildFrozenArtifacts,
  decisionFileName,
  fixtureFileName,
  assertJsonEquals,
  writeJson,
} from "./protocol.mjs";

const CHECK_ONLY = process.argv.includes("--check");
const frozen = buildFrozenArtifacts();

const apply = CHECK_ONLY ? assertJsonEquals : writeJson;

for (const { candidate } of frozen.fixtures) {
  apply(path.resolve(FIXTURE_ROOT, fixtureFileName(candidate)), candidate);
}
for (const decision of frozen.decisions) {
  apply(path.resolve(DECISION_ROOT, decisionFileName(decision)), decision);
}
apply(
  path.resolve(PRECOMMITMENT_ROOT, "fixture-expectation-manifest.json"),
  frozen.expectationManifest,
);
apply(
  path.resolve(PRECOMMITMENT_ROOT, "measurement-protocol.json"),
  frozen.measurementProtocol,
);
apply(
  path.resolve(PRECOMMITMENT_ROOT, "calibration-freeze-manifest.json"),
  frozen.baselineManifest,
);

if (!CHECK_ONLY) {
  for (const directory of [FIXTURE_ROOT, DECISION_ROOT]) {
    const expected = new Set(
      directory === FIXTURE_ROOT
        ? frozen.fixtures.map(({ candidate }) => fixtureFileName(candidate))
        : frozen.decisions.map((decision) => decisionFileName(decision)),
    );
    for (const file of fs.readdirSync(directory)) {
      if (file.endsWith(".json") && !expected.has(file)) {
        throw new Error(`Unexpected pre-existing calibration artifact: ${file}`);
      }
    }
  }
}

process.stdout.write(
  `SEM-003B4 precommitment ${CHECK_ONLY ? "verified" : "frozen"}: ${frozen.fixtures.length} Calibration fixtures, ${frozen.decisions.length} simulated decision records, 0 evaluator executions\n`,
);
