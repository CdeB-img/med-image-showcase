# I04 — PYDANTIC_COMMON_CONTRACT — COMMON_TRANSCRIPT T1

## INPUT

Message utilisateur courant VERBATIM :

> Tous les centres ont cine et T1 natif. Non, le T2 n'est pas disponible partout.

Conversation précédente VERBATIM :

> I04:T0 | USER : Je veux détecter l'atteinte cardiaque précoce dans Fabry avant la fibrose visible. On a plusieurs centres et tout le monde n'a pas les mêmes séquences.

## NATIVE OUTPUT

Artefact : `experiments/semantic-engine-comparison/results/common-contract-ablation-02/native-outputs/common-transcript-i04-t1-pydantic-common-contract.json`

```json
{
  "configurationId": "PYDANTIC_COMMON_CONTRACT",
  "failureClass": "STRUCTURED_CONTRACT_FAILURE",
  "nativeRawOutputAvailable": false,
  "pairedFirstOutput": true,
  "providerRequestNumber": 60,
  "reason": "CommonScientificState rejected: an explicitUserStatements element lacked required turn provenance and sourceText.",
  "round": "T1",
  "scenarioId": "I04",
  "status": "FAILED"
}
```

## STRUCTURED CONTRACT STATUS

- provider status : `FAILED_OR_OUTPUT_REJECTED`
- parsing status : `STRUCTURED_CONTRACT_FAILURE`
- structured contract conformance : `FAIL`
- scientific semantic evaluability : `NOT_ASSESSABLE_OUTPUT_NOT_PERSISTED`
- evaluation mode : `NONE`
- native raw output persisted : `false`
- exact error : CommonScientificState rejected: an explicitUserStatements element lacked required turn provenance and sourceText.

## SCIENTIFIC INTERPRETATION

Aucune interprétation scientifique n’est produite : la sortie native exploitable n’a pas été persistée. Cet état n’est pas compté comme un échec de compréhension scientifique.

## MISSING STRUCTURAL GUARANTEES

- COMMON_SCIENTIFIC_STATE_NOT_AVAILABLE
- NATIVE_RAW_OUTPUT_NOT_PERSISTED

_Vue locale déterministe. Aucun appel LLM d’interprétation sémantique post-hoc._
