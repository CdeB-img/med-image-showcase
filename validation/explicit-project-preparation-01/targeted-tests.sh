#!/bin/sh
set -eu
# Exact historical fixtures stay private and untracked; never generate substitutes.
first=validation/noxia-drci-release-closure-from-astra-01/DEMONSTRATOR_DOCUMENT_EVIDENCE.json
second=validation/noxia-drci-last-deterministic-document-cleanup-01/PACK_PROVISIONAL.json
linked_first=0
linked_second=0
cleanup() {
  [ "$linked_first" = 0 ] || rm "$first"
  [ "$linked_second" = 0 ] || rm "$second"
}
trap cleanup EXIT HUP INT TERM
root=${NOXIA_HISTORICAL_WORKSPACE:-/Users/charles/Documents/Projets/NOXIA/noxia-dev}
if [ ! -f "$first" ]; then
  test -f "$root/$first" || { echo "HISTORICAL_DOC_EVIDENCE_UNAVAILABLE"; exit 1; }
  mkdir -p "$(dirname "$first")"
  ln -s "$root/$first" "$first"
  linked_first=1
fi
if [ ! -f "$second" ]; then
  test -f "$root/$second" || { echo "HISTORICAL_DOC_PACK_UNAVAILABLE"; exit 1; }
  mkdir -p "$(dirname "$second")"
  ln -s "$root/$second" "$second"
  linked_second=1
fi
node_modules/.bin/vitest run \
 src/features/protocol-designer/functional-reset/__tests__/explicit-project-preparation.test.tsx \
 src/features/protocol-designer/functional-reset/__tests__/project-preparation-lifecycle.test.ts \
 src/features/protocol-designer/functional-reset/__tests__/continuous-project-build.test.tsx \
 src/features/protocol-designer/functional-reset/__tests__/pending-natural-confirmation.test.tsx \
 src/features/protocol-designer/functional-reset/__tests__/conversation-confirmation-receipt.test.ts \
 src/features/protocol-designer/functional-reset/__tests__/working-draft-adoptable-review.test.ts \
 src/features/protocol-designer/functional-reset/__tests__/working-draft-source-binding.test.ts \
 src/features/protocol-designer/functional-reset/__tests__/working-draft-provider-contract.test.ts \
 src/features/protocol-designer/functional-reset/__tests__/durable-provider-trace02-capture.test.ts \
 src/features/protocol-designer/functional-reset/__tests__/project-persistence-oai-02.test.ts \
 src/features/protocol-designer/__tests__/durable-working-draft-recovery.test.ts \
 src/features/protocol-designer/__tests__/durable-provider-failure-capture.test.ts \
 src/features/protocol-designer/__tests__/durable-public-handler.test.ts \
 src/features/protocol-designer/__tests__/project-snapshot-resolver.test.ts \
 src/features/protocol-designer/__tests__/azure-working-draft-operation-cap.test.ts \
 src/features/research-project-construction/__tests__/decisions-versioning-change.test.ts \
 src/features/research-project-construction/__tests__/human-review-relation-projection.test.ts \
 src/features/document-projection/__tests__/drci-draft-pack.test.tsx \
 src/features/document-projection/__tests__/drci-renderer-domain-independence.test.ts \
 --reporter=default --reporter=json --outputFile=validation/explicit-project-preparation-01/consolidated.json
