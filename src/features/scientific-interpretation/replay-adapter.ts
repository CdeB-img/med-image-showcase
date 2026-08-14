import { applyDeterministicAudit } from "./audit";
import { mapHybridStateToContribution, type HybridParsedState } from "./hybrid-adapter";
import { ScientificInterpretationTechnicalError, type AuthorizedScientificInterpretationContext, type ScientificInterpretationConversation, type ScientificInterpretationRuntime } from "./contracts";

export type ScientificInterpretationReplayRecord = {
  replayId: string;
  conversationId: string;
  state: HybridParsedState;
  rawOutputRef: string;
  rawOutputDigest: string;
  provider: string | null;
  model: string | null;
  promptDigest: string | null;
  schemaDigest: string | null;
  configurationDigest: string | null;
  runtimeId: string;
  runtimeVersion: string;
};

export class FixtureReplayScientificInterpretationAdapter implements ScientificInterpretationRuntime {
  readonly runtimeId = "FIXTURE_REPLAY_ADAPTER";
  readonly runtimeVersion = "1.0.0";

  constructor(private readonly records: ReadonlyMap<string, ScientificInterpretationReplayRecord>) {}

  async interpret(conversation: ScientificInterpretationConversation, _previousState = null, authorizedContext?: AuthorizedScientificInterpretationContext) {
    const replay = this.records.get(conversation.conversationId);
    if (!replay) throw new ScientificInterpretationTechnicalError("CONTRIBUTION_MAPPING_FAILURE", `REPLAY_RECORD_NOT_FOUND:${conversation.conversationId}`);
    const contribution = mapHybridStateToContribution({
      state: replay.state,
      execution: {
        operationId: replay.replayId,
        provider: replay.provider,
        model: replay.model,
        promptDigest: replay.promptDigest,
        schemaDigest: replay.schemaDigest,
        configurationDigest: replay.configurationDigest,
        runtimeId: replay.runtimeId,
        runtimeVersion: replay.runtimeVersion,
      },
      rawOutputRef: replay.rawOutputRef,
      rawOutputDigest: replay.rawOutputDigest,
      conversation,
      authorizedContext,
    });
    return applyDeterministicAudit(contribution);
  }
}
