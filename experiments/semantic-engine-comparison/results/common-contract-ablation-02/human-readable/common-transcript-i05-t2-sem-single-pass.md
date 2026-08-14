# I05 — SEM_SINGLE_PASS — COMMON_TRANSCRIPT T2

## INPUT

Message utilisateur courant VERBATIM :

> Pour ceux qui n'ont pas la seconde IRM, on ne peut pas calculer le delta ADC, mais je veux garder les analyses baseline-only si elles restent valides.

Conversation précédente VERBATIM :

> I05:T0 | USER : On a une IRM avant et après radiochimiothérapie. Je veux savoir si ça change et si ça prédit la récidive. Ceux qui n'ont pas la seconde, on en fait quoi ?
> I05:R1 | USER : Je me suis mal exprimé : la récidive n'est pas le critère principal, c'est la réponse pathologique. La récidive sera exploratoire.

## NATIVE OUTPUT

Artefact : `experiments/semantic-engine-comparison/results/common-contract-ablation-02/native-outputs/common-transcript-i05-t2-sem-single-pass.json`

```json
{
  "configurationId": "SEM_SINGLE_PASS",
  "failureClass": "SHARED_FIRST_RECONSTRUCTION_INVALID_STRUCTURED_OUTPUT",
  "nativeRawOutputAvailable": false,
  "pairedFirstReconstruction": true,
  "providerRequestNumbers": [
    79,
    80,
    81
  ],
  "reason": "The shared SEM first reconstruction remained invalid before either ablation branch could canonicalize it.",
  "round": "T2",
  "scenarioId": "I05",
  "semanticCriticExecuted": false,
  "status": "FAILED"
}
```

## STRUCTURED CONTRACT STATUS

- provider status : `FAILED_OR_OUTPUT_REJECTED`
- parsing status : `SHARED_FIRST_RECONSTRUCTION_INVALID_STRUCTURED_OUTPUT`
- structured contract conformance : `FAIL`
- scientific semantic evaluability : `NOT_ASSESSABLE_OUTPUT_NOT_PERSISTED`
- evaluation mode : `NONE`
- native raw output persisted : `false`
- exact error : The shared SEM first reconstruction remained invalid before either ablation branch could canonicalize it.

## SCIENTIFIC INTERPRETATION

Aucune interprétation scientifique n’est produite : la sortie native exploitable n’a pas été persistée. Cet état n’est pas compté comme un échec de compréhension scientifique.

## MISSING STRUCTURAL GUARANTEES

- COMMON_SCIENTIFIC_STATE_NOT_AVAILABLE
- NATIVE_RAW_OUTPUT_NOT_PERSISTED

_Vue locale déterministe. Aucun appel LLM d’interprétation sémantique post-hoc._
