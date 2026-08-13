# SEM-003C1 — Comparative semantic baselines

This directory contains the pre-observation freeze of the comparative scientific-understanding baselines. It is experimental infrastructure, not a new NOXIA product contract and not a modification of SEM.

The frozen competitors are:

- current NOXIA SEM (`SEM_LEGACY_R5P`);
- Instructor + Pydantic;
- PydanticAI;
- DSPy without optimizer or demonstrations;
- LangExtract with a schema and no examples;
- Outlines with its native Gemini adapter.

Every LLM-backed baseline is precommitted to Google Gemini `gemini-3.5-flash-lite` with provider-default sampling (`temperature = null` / omitted). SEM keeps its native reconstruction/critic/deterministic pipeline. The other structured-output baselines share the same scientific instruction and output contract; framework-specific glue is deliberately minimal. LangExtract keeps its own extraction-shaped native output.

The comparison pipeline is:

`NATIVE_OUTPUT -> NORMALIZED_CANDIDATE_SEMANTIC_REPRESENTATION -> SEM003_EVALUATOR_1.1.0`

Normalization is lossless and reference-blind. It may rename fields, preserve source evidence and generate stable transport identifiers; it must not add a concept, relation, inference, ambiguity, unknown, candidate or clarification absent from the native output. Binding to requirement/prohibition identifiers occurs only inside the trusted evaluator side after authorized reference mounting.

No blind input or sealed reference is read by the freeze or validation tools. This mission creates no result. `results/` must contain only its policy README until the common blind campaign begins.

## Commands that do not call an LLM

```text
experiments/.venv/bin/python experiments/semantic-engine-comparison/tools/freeze.py --check
experiments/.venv/bin/python experiments/semantic-engine-comparison/tools/validate.py
experiments/.venv/bin/python -m unittest discover -s experiments/semantic-engine-comparison/tests -p 'test_*.py'
```

The individual baseline modules contain execution entry points for the future common campaign. They are not invoked by any SEM-003C1 command.
