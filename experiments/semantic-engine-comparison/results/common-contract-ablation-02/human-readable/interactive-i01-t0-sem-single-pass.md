# I01 — SEM_SINGLE_PASS — INTERACTIVE T0

## INPUT

Message utilisateur courant VERBATIM :

> Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.

Conversation précédente VERBATIM :

> —

## NATIVE OUTPUT

Artefact : `experiments/semantic-engine-comparison/results/common-contract-ablation-02/native-outputs/interactive-i01-t0-sem-single-pass.json`

```json
{
  "failureClass": "SEM_PROVIDER_OR_STRUCTURED_CONTRACT_FAILURE",
  "nativeRawOutputAvailable": false,
  "noAdditionalSemanticRetry": true,
  "reason": "RuntimeError: SemanticProviderError: SEMANTIC_PROVIDER_TIMEOUT\n    at GeminiScientificSemanticProvider.generate (/Users/charles/Documents/Projets/NOXIA/noxia-dev/src/features/scientific-semantic-reconstruction/provider.ts:706:15)\n    at processTicksAndRejections (node:internal/process/task_queues:103:5)\n    at GeminiScientificSemanticProvider.reconstruct (/Users/charles/Documents/Projets/NOXIA/noxia-dev/src/features/scientific-semantic-reconstruction/provider.ts:767:31)\n    at main (/Users/charles/Documents/Projets/NOXIA/noxia-dev/experiments/semantic-engine-comparison/common_contract_ablation_02/sem_pair_runner.ts:305:28)\n",
  "status": "FAILED"
}
```

## STRUCTURED CONTRACT STATUS

- provider status : `FAILED_OR_OUTPUT_REJECTED`
- parsing status : `SEM_PROVIDER_OR_STRUCTURED_CONTRACT_FAILURE`
- structured contract conformance : `FAIL`
- scientific semantic evaluability : `NOT_ASSESSABLE_OUTPUT_NOT_PERSISTED`
- evaluation mode : `NONE`
- native raw output persisted : `false`
- exact error : RuntimeError: SemanticProviderError: SEMANTIC_PROVIDER_TIMEOUT
    at GeminiScientificSemanticProvider.generate (/Users/charles/Documents/Projets/NOXIA/noxia-dev/src/features/scientific-semantic-reconstruction/provider.ts:706:15)
    at processTicksAndRejections (node:internal/process/task_queues:103:5)
    at GeminiScientificSemanticProvider.reconstruct (/Users/charles/Documents/Projets/NOXIA/noxia-dev/src/features/scientific-semantic-reconstruction/provider.ts:767:31)
    at main (/Users/charles/Documents/Projets/NOXIA/noxia-dev/experiments/semantic-engine-comparison/common_contract_ablation_02/sem_pair_runner.ts:305:28)


## SCIENTIFIC INTERPRETATION

Aucune interprétation scientifique n’est produite : la sortie native exploitable n’a pas été persistée. Cet état n’est pas compté comme un échec de compréhension scientifique.

## MISSING STRUCTURAL GUARANTEES

- COMMON_SCIENTIFIC_STATE_NOT_AVAILABLE
- NATIVE_RAW_OUTPUT_NOT_PERSISTED

_Vue locale déterministe. Aucun appel LLM d’interprétation sémantique post-hoc._
