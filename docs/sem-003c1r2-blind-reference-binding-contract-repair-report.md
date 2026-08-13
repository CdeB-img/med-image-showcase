# SEM-003C1R2 — Blind Reference Binding Contract Repair

**Statut :** OFFICIAL

**Niveau documentaire :** NIVEAU_3

**Version :** 1.0

**Date :** 2026-08-14

**Décision :** `SEM003C1R2_BLIND_REFERENCE_BINDING_READY`

## Diagnostic

Le préflight a été arrêté avant tout appel provider et avant tout run Blind. L'Evaluator 1.2.0 portait le purpose de qualification Blind mais son contrat d'entrée exigeait encore un `BENCHMARK_AUTHORING_CASE` Development/Calibration et limitait l'identité du Case aux préfixes visibles. Le package SEM-003C conserve légitimement `SEM003C_BLIND_BENCHMARK_CASE`, `BLIND_QUALIFICATION_AUTHORING` et `BLIND_SEALED`.

**Classification :** `BLIND_REFERENCE_BINDING_CONTRACT_INCOMPLETE`.

## Réparation minimale

L'Evaluator passe de 1.2.0 à 1.3.0, configuration digest `0d0f48cf1859d3747fd17eeaf75d51a59e6a5d5a48a096beab67cbe32d94665b`.

Le binding exige désormais conjointement :

- `benchmarkSet = BLIND` ;
- Case `SEM003C_BLIND_BENCHMARK_CASE` ;
- purpose Case `BLIND_QUALIFICATION_AUTHORING` ;
- exposition `BLIND_SEALED` et éligibilité Blind vraie ;
- enveloppe `SEM003C_BLIND_ACCEPTANCE_ENVELOPE` ;
- candidate purpose `SCIENTIFIC_UNDERSTANDING_EVALUATOR_BLIND_QUALIFICATION` ;
- candidate source `FUTURE_SEM_RUNTIME_OUTPUT`.

L'identité du Case est validée par un format générique. Aucune règle ne reconnaît un préfixe de campagne ou un Case particulier. Les références Blind ne sont pas converties en faux objets Development/Calibration.

## Preuves

- 10/10 tests R2 sur références synthétiques non issues des quinze Cases Blind ;
- 10/10 tests C1R, 10/10 tests Evaluator Development et validateur Evaluator PASS ;
- B4R 13/13 et B4 Restart 7/7 ;
- SEM-003C1 freeze PASS, validation 17/17 et tests comparatifs 10/10 ;
- 41 fixtures Development byte-identical, digest `b50a7f795fea663d911edf7f6334e8dc9ab2ba4334ceceee1a2f57f7a8f3e420` ;
- P01–P18 inchangées, registry digest `f0db9a687df425fd844c80580914bb91b3c5382663307fa9aea696015c876a70` ;
- failure classes et dispositions inchangées, digest `a5e45a03676b049c8a6478c66dfbd218fcd29954e48e38cc74ab850b6a950e2b` ;
- six baselines, adapters, prompts, schemas comparatifs, quinze Blind Cases et Acceptance Envelopes inchangés.

Le nouveau binding est `semantic-validation/sem-003/evaluator/registry/sem003c1r2-comparative-evaluator-binding.json`. Le gel est `semantic-validation/sem-003/evaluator/registry/evaluator-post-c1r2-freeze-manifest.json`.

## Limites et STOP

Aucun contenu scientifique de référence scellée, aucune sortie Blind et aucun résultat de baseline n'a été consulté. Nombre de runs : 0/90. Appels provider : 0. La réparation ne modifie ni SEM, ni les règles Level 1/Level 2, ni les propriétés, failure classes, dispositions ou seuils.

La campagne SEM-003D-COMP n'est pas lancée dans cet état de worktree. Elle pourra démarrer dans une mission ultérieure, à partir du nouveau gel committé et d'un worktree propre.
