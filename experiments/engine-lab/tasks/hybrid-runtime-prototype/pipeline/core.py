from __future__ import annotations

import copy
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from adapters.protocols import ScientificInterpreterAdapter, SemanticAdjudicatorAdapter, SemanticAuditorAdapter
from contracts.models import (
    AdjudicationOutput,
    AuditFinding,
    CandidateScientificState,
    ConsolidatedCandidateState,
    ContextInput,
    ConversationTurn,
    RuntimeIdentity,
)
from pipeline.projection import build_candidate_state
from pipeline.storage import atomic_write_json, file_digest, logical_digest, read_json
from pipeline.triggers import adjudication_trigger, semantic_audit_trigger


PIPELINE_VERSION = "0.1.0-experimental"


@dataclass(frozen=True)
class PipelineResult:
    primary: CandidateScientificState
    deterministicFindings: list[AuditFinding]
    semanticFindings: list[AuditFinding]
    adjudication: AdjudicationOutput | None
    consolidated: ConsolidatedCandidateState
    auditLTriggered: bool
    adjudicatorTriggered: bool
    providerCalls: int
    latencyMs: int


class HybridRuntimePipeline:
    """Role-oriented orchestration. It does not know experimental scenario identifiers."""

    def __init__(
        self,
        *,
        primary: ScientificInterpreterAdapter,
        deterministicAuditor: SemanticAuditorAdapter,
        semanticAuditor: SemanticAuditorAdapter,
        adjudicator: SemanticAdjudicatorAdapter,
        resultRoot: Path,
    ):
        self.primary = primary
        self.deterministicAuditor = deterministicAuditor
        self.semanticAuditor = semanticAuditor
        self.adjudicator = adjudicator
        self.resultRoot = resultRoot

    def _paths(self, scenario: str, turn: str) -> dict[str, Path]:
        stem = f"{scenario.lower()}-{turn.lower()}"
        return {
            "candidate": self.resultRoot / "candidate-states" / f"{stem}.json",
            "deterministic": self.resultRoot / "deterministic-findings" / f"{stem}.json",
            "semantic": self.resultRoot / "semantic-audit-findings" / f"{stem}.json",
            "adjudication": self.resultRoot / "adjudication-records" / f"{stem}.json",
            "consolidated": self.resultRoot / "consolidated-states" / f"{stem}.json",
        }

    @staticmethod
    def _unsafe_project_adoption(candidate: CandidateScientificState) -> bool:
        return "PROJECT_ADOPTED" in candidate.model_dump_json().upper()

    def _consolidate(
        self,
        *,
        primary: CandidateScientificState,
        previousState: CandidateScientificState | None,
        deterministic: list[AuditFinding],
        semantic: list[AuditFinding],
        adjudication: AdjudicationOutput | None,
        auditRequiredButUnavailable: bool,
        adjudicatorFailed: bool,
        providerCalls: int,
        latencyMs: int,
    ) -> ConsolidatedCandidateState:
        unresolved = [
            finding.findingId
            for finding in [*deterministic, *semantic]
            if finding.status in {"OPEN", "ACKNOWLEDGED"}
            and finding.findingId not in set(
                resolution_finding
                for resolution in (adjudication.resolutions if adjudication else [])
                for resolution_finding in resolution.findingIds
            )
        ]
        resolutions = adjudication.resolutions if adjudication else []
        candidate: CandidateScientificState | None = primary.model_copy(deep=True)
        disposition = "CANDIDATE_ACCEPTABLE"

        if adjudicatorFailed:
            candidate = None
            disposition = "FAIL_CLOSED"
        elif auditRequiredButUnavailable:
            disposition = "NOT_EVALUABLE"
        elif adjudication:
            disposition = adjudication.disposition
            unresolved = list(adjudication.unresolvedFindingIds)
            if adjudication.consolidatedInterpretation is not None and disposition not in {"FAIL_CLOSED", "NOT_EVALUABLE"}:
                identity = RuntimeIdentity(
                    runtimeId="HYBRID_CONSOLIDATOR",
                    runtimeVersion=PIPELINE_VERSION,
                    provider="LOCAL_PLUS_CONDITIONAL_ADJUDICATOR",
                    model="gemini-3.5-flash-lite",
                    promptDigest=getattr(self.adjudicator, "promptDigest", "NOT_EXPOSED"),
                    schemaDigest=getattr(self.adjudicator, "schemaDigest", "NOT_EXPOSED"),
                    configurationDigest=getattr(self.adjudicator, "configurationDigest", "NOT_EXPOSED"),
                )
                candidate = build_candidate_state(
                    conversationId=primary.identity.conversationId,
                    turns=primary.source.turns,
                    previousState=previousState,
                    interpretation=adjudication.consolidatedInterpretation,
                    rawOutputRef=primary.source.rawOutputRef,
                    rawDigest=file_digest(Path(primary.source.rawOutputRef)),
                    runtimeIdentity=identity,
                    contextInputs=primary.contextInputs,
                )
                candidate.auditStatus = "COMPLETE"
                candidate.adjudicationStatus = "COMPLETE"
            elif disposition in {"FAIL_CLOSED", "NOT_EVALUABLE"}:
                candidate = None
        elif unresolved:
            disposition = "CANDIDATE_ACCEPTABLE_WITH_OPEN_DECISIONS"
        elif primary.clarificationNeeds:
            disposition = "NEEDS_CLARIFICATION"

        if candidate and self._unsafe_project_adoption(candidate):
            candidate = None
            disposition = "FAIL_CLOSED"
        open_decisions = candidate.openDecisions if candidate else primary.openDecisions
        clarification = candidate.clarificationNeeds if candidate else primary.clarificationNeeds
        return ConsolidatedCandidateState(
            consolidatedStateId=f"HCCS-{logical_digest({
                'primary': primary.identity.stateId,
                'deterministic': [item.findingId for item in deterministic],
                'semantic': [item.findingId for item in semantic],
                'resolutions': [item.resolutionId for item in resolutions],
                'disposition': disposition,
            })[:24]}",
            primaryCandidateStateId=primary.identity.stateId,
            rawOutputRef=primary.source.rawOutputRef,
            disposition=disposition,
            candidateState=candidate,
            deterministicFindingIds=[item.findingId for item in deterministic],
            semanticAuditFindingIds=[item.findingId for item in semantic],
            adjudicationResolutions=resolutions,
            unresolvedFindingIds=unresolved,
            openDecisions=open_decisions,
            clarificationNeeds=clarification,
            providerCalls=providerCalls,
            latencyMs=latencyMs,
        )

    def run_state(
        self,
        *,
        scenario: str,
        turn: str,
        conversationId: str,
        turns: list[ConversationTurn],
        previousState: CandidateScientificState | None,
        contextInputs: list[ContextInput],
        experimentalFinalState: bool,
    ) -> PipelineResult:
        paths = self._paths(scenario, turn)
        started = time.perf_counter()
        provider_calls = 0
        latency = 0

        if paths["candidate"].exists():
            record = read_json(paths["candidate"])
            primary = CandidateScientificState.model_validate(record["candidateState"])
            primary_calls = int(record["primaryProviderCalls"])
            primary_latency = int(record["primaryLatencyMs"])
        else:
            primary_result = self.primary.interpret(
                conversationId=conversationId,
                turns=turns,
                previousCandidateState=previousState,
                contextInputs=contextInputs,
                rawDirectory=self.resultRoot / "raw",
                scenario=scenario,
                turn=turn,
            )
            primary = primary_result.candidate
            primary_calls = primary_result.providerCalls
            primary_latency = primary_result.latencyMs
            atomic_write_json(paths["candidate"], {
                "experimentId": "HYBRID-RUNTIME-PROTOTYPE-01",
                "scenario": scenario,
                "turn": turn,
                "ablation": "P0_PYDANTIC_DIRECT",
                "primaryOutputIdentity": primary.identity.stateId,
                "rawOutputRef": primary.source.rawOutputRef,
                "primaryProviderCalls": primary_calls,
                "primaryLatencyMs": primary_latency,
                "candidateState": primary.model_dump(mode="json"),
            })
        provider_calls += primary_calls
        latency += primary_latency

        if paths["deterministic"].exists():
            record = read_json(paths["deterministic"])
            deterministic = [AuditFinding.model_validate(item) for item in record["findings"]]
        else:
            before = primary.model_dump(mode="json")
            deterministic = self.deterministicAuditor.audit(
                turns=turns,
                previousState=previousState,
                candidateState=primary,
                confirmedDecisionIds=[],
            )
            if primary.model_dump(mode="json") != before:
                raise RuntimeError("SEM_AUDIT_D_MUTATED_PRIMARY_CANDIDATE")
            atomic_write_json(paths["deterministic"], {
                "experimentId": "HYBRID-RUNTIME-PROTOTYPE-01",
                "scenario": scenario,
                "turn": turn,
                "ablation": "P1_PYDANTIC_PLUS_AUDIT_D",
                "primaryOutputIdentity": primary.identity.stateId,
                "candidateMutated": False,
                "findings": [item.model_dump(mode="json") for item in deterministic],
            })

        audit_triggered, audit_reasons = semantic_audit_trigger(
            primary,
            deterministic,
            experimentalFinalState=experimentalFinalState,
        )
        semantic: list[AuditFinding] = []
        audit_unavailable = False
        if paths["semantic"].exists():
            record = read_json(paths["semantic"])
            semantic = [AuditFinding.model_validate(item) for item in record["findings"]]
            audit_calls = int(record.get("providerCalls", 0))
            audit_latency = int(record.get("latencyMs", 0))
            audit_unavailable = bool(record.get("technicalFailure"))
        elif audit_triggered:
            audit_started = time.perf_counter()
            before = primary.model_dump(mode="json")
            if hasattr(self.semanticAuditor, "audit_with_metadata"):
                output = self.semanticAuditor.audit_with_metadata(
                    turns=turns,
                    previousState=previousState,
                    candidateState=primary,
                    confirmedDecisionIds=[],
                    deterministicFindings=deterministic,
                    rawDirectory=self.resultRoot / "raw",
                    scenario=scenario,
                    turn=turn,
                )
                semantic = output.findings
                audit_calls = 1
                audit_unavailable = not output.success
                raw_ref = output.rawOutputRef
                final_disposition = output.finalDisposition
            else:
                semantic = self.semanticAuditor.audit(
                    turns=turns,
                    previousState=previousState,
                    candidateState=primary,
                    confirmedDecisionIds=[],
                    deterministicFindings=deterministic,
                )
                audit_calls = 0
                raw_ref = None
                final_disposition = "LOCAL_TEST_ADAPTER"
            if primary.model_dump(mode="json") != before:
                raise RuntimeError("SEM_AUDIT_L_MUTATED_PRIMARY_CANDIDATE")
            audit_latency = round((time.perf_counter() - audit_started) * 1000)
            atomic_write_json(paths["semantic"], {
                "experimentId": "HYBRID-RUNTIME-PROTOTYPE-01",
                "scenario": scenario,
                "turn": turn,
                "ablation": "P2_PYDANTIC_PLUS_AUDIT_D_PLUS_AUDIT_L",
                "primaryOutputIdentity": primary.identity.stateId,
                "triggered": True,
                "triggerReasons": audit_reasons,
                "candidateMutated": False,
                "rawOutputRef": raw_ref,
                "providerCalls": audit_calls,
                "latencyMs": audit_latency,
                "technicalFailure": audit_unavailable,
                "finalDisposition": final_disposition,
                "findings": [item.model_dump(mode="json") for item in semantic],
            })
        else:
            audit_calls = 0
            audit_latency = 0
            atomic_write_json(paths["semantic"], {
                "experimentId": "HYBRID-RUNTIME-PROTOTYPE-01",
                "scenario": scenario,
                "turn": turn,
                "ablation": "P2_PYDANTIC_PLUS_AUDIT_D_PLUS_AUDIT_L",
                "primaryOutputIdentity": primary.identity.stateId,
                "triggered": False,
                "triggerReasons": [],
                "candidateMutated": False,
                "rawOutputRef": None,
                "providerCalls": 0,
                "latencyMs": 0,
                "technicalFailure": False,
                "finalDisposition": "NOT_REQUIRED",
                "findings": [],
            })
        provider_calls += audit_calls
        latency += audit_latency

        adjudicator_triggered, adjudicator_reasons = adjudication_trigger(primary, deterministic, semantic)
        adjudication: AdjudicationOutput | None = None
        adjudicator_failed = False
        if paths["adjudication"].exists():
            record = read_json(paths["adjudication"])
            adjudication = AdjudicationOutput.model_validate(record["output"]) if record.get("output") else None
            adjudicator_calls = int(record.get("providerCalls", 0))
            adjudicator_latency = int(record.get("latencyMs", 0))
            adjudicator_failed = bool(record.get("technicalFailure"))
        elif adjudicator_triggered and not audit_unavailable:
            adjudication, raw_ref, adjudicator_latency, adjudicator_calls = self.adjudicator.adjudicate(
                turns=turns,
                previousState=previousState,
                primaryCandidate=primary,
                deterministicFindings=deterministic,
                semanticAuditFindings=semantic,
                rawDirectory=self.resultRoot / "raw",
                scenario=scenario,
                turn=turn,
            )
            adjudicator_failed = adjudication.disposition == "FAIL_CLOSED" and adjudication.consolidatedInterpretation is None
            atomic_write_json(paths["adjudication"], {
                "experimentId": "HYBRID-RUNTIME-PROTOTYPE-01",
                "scenario": scenario,
                "turn": turn,
                "ablation": "P3_FULL_HYBRID_CANDIDATE",
                "primaryOutputIdentity": primary.identity.stateId,
                "triggered": True,
                "triggerReasons": adjudicator_reasons,
                "rawOutputRef": raw_ref,
                "providerCalls": adjudicator_calls,
                "latencyMs": adjudicator_latency,
                "technicalFailure": adjudicator_failed,
                "output": adjudication.model_dump(mode="json"),
            })
        else:
            adjudicator_calls = 0
            adjudicator_latency = 0
            atomic_write_json(paths["adjudication"], {
                "experimentId": "HYBRID-RUNTIME-PROTOTYPE-01",
                "scenario": scenario,
                "turn": turn,
                "ablation": "P3_FULL_HYBRID_CANDIDATE",
                "primaryOutputIdentity": primary.identity.stateId,
                "triggered": False,
                "triggerReasons": adjudicator_reasons,
                "rawOutputRef": None,
                "providerCalls": 0,
                "latencyMs": 0,
                "technicalFailure": audit_unavailable,
                "output": None,
            })
        provider_calls += adjudicator_calls
        latency += adjudicator_latency

        consolidated = self._consolidate(
            primary=primary,
            previousState=previousState,
            deterministic=deterministic,
            semantic=semantic,
            adjudication=adjudication,
            auditRequiredButUnavailable=audit_triggered and audit_unavailable,
            adjudicatorFailed=adjudicator_failed,
            providerCalls=provider_calls,
            latencyMs=latency,
        )
        atomic_write_json(paths["consolidated"], {
            "experimentId": "HYBRID-RUNTIME-PROTOTYPE-01",
            "scenario": scenario,
            "turn": turn,
            "primaryOutputIdentity": primary.identity.stateId,
            "p0CandidateStateId": primary.identity.stateId,
            "p1CandidateStateId": primary.identity.stateId,
            "p2CandidateStateId": primary.identity.stateId,
            "p3PrimaryCandidateStateId": primary.identity.stateId,
            "consolidated": consolidated.model_dump(mode="json"),
        })
        return PipelineResult(
            primary=primary,
            deterministicFindings=deterministic,
            semanticFindings=semantic,
            adjudication=adjudication,
            consolidated=consolidated,
            auditLTriggered=audit_triggered,
            adjudicatorTriggered=adjudicator_triggered,
            providerCalls=provider_calls,
            latencyMs=round((time.perf_counter() - started) * 1000),
        )
