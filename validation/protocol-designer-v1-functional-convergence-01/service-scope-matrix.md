# C04 — Attribution préalable des 83 demandes

CP3 établi après CP2, avant les modifications C04. Corpus inchangé. Zéro provider réel.

La portée V1 retient les neuf conversations cliniques/imagerie A01–A04, B01–B04 et F01. Les six autres scénarios restent des stress tests génériques. La Product Specification vise initialement l’imagerie ; PD-003 v2, cas K, admet explicitement une étude clinique/biologique sans Imaging. La présente mission demande cette qualification clinique. Aucun engagement d’expertise universelle n’est déduit du corpus de stress.

Les classes ci-dessous réutilisent les capacités et actes existants ; ce tableau est un artefact d’évaluation, pas une ontologie produit. Chaque ligne JSON conserve la demande entière, le Project C02 courant avec identité/version/digest, la réponse observée et sa preuve.

## Causes groupées et propriétaires

1. QRY : ASSISTED_PROPOSAL filtre les capacités mais ignore le service demandé ; la priorité de complétude favorise QUESTION/ST. OBS manque au filtre. Le texte utilisateur n’atteint pas la sélection du scope.
2. Owner purpose : ST peut produire des hypothèses correctes en dehors du service demandé. Study Design possède des familles de plan, OBS des déclarations/qualifications de mesure, BIO quatre familles analytiques bornées, Imaging des stratégies sourcées. Ces capacités ne prouvent ni catalogue d’instruments validés ni méthode d’accord qualifiée.
3. QRY/Knowledge : EXPLAIN exige une candidate courante ou tombe sur un RESPOND sans contenu requis ; plusieurs actes DISCUSS aboutissent à l’accusé vide. Knowledge possède des connaissances internes bornées, dont l’absence doit être exprimée sur la question et le Project, sans questions génériques déconnectées.
4. Référence : explication d’une option présentée, lecture du Project et demande générale de connaissance sont confondues. Un référent ancien peut être expliqué avec son statut historique ; il ne devient pas une candidate actuelle.
5. Freshness : les résultats et projections doivent rester liés à l’identité/version/digest actuels. Les écarts de version causés par C02 ne sont pas attribués à un cache sans preuve.
6. Document : la reconnaissance trop étroite des commandes laisse passer les demandes longues de projection courante dans DISCUSS. La commande de document n’adopte aucune contrainte nouvelle.

Aucune responsabilité nouvelle n’est démontrée. Les limites de couverture locale doivent devenir des besoins d’information et abstentions exploitables chez les owners existants. Si celles-ci empêchent effectivement une progression V1, le verdict restera non qualifié et nécessitera arbitrage.

## Matrice

| Demande | Gate | Service attendu (contrat existant) | Owner principal / composition | Cause observée |
|---|---|---|---|---|
| A01-T05 | V1 | STUDY_DESIGN_COHERENCE — Options de population et recrutement, contraintes conservées | STUDY_DESIGN, RESEARCH_PROJECT, KNOWLEDGE, BIOSTATISTICS | NATIVE_OUTPUT_SCOPE_MISMATCH |
| A01-T06 | V1 | UNDERSTAND — Explication/compromis de design et faisabilité ; information externe signalée si absente | STUDY_DESIGN, RESEARCH_PROJECT, KNOWLEDGE, BIOSTATISTICS | LOCAL_KNOWLEDGE_NO_APPLICABLE_CONTENT |
| A01-T10 | V1 | EXPLAIN_REFERENCED_CONTENT — Justification de la proposition précisément visée, ou clarification de sa disponibilité | QUERY_NAVIGATION, RESEARCH_PROJECT, OWNER_OF_EXACT_REFERENCED_PROPOSAL | UPSTREAM_EMPTY_HOW |
| A01-T13 | V1 | IMAGING_STUDY_DESIGN — Alternatives compatibles avec la temporalité IRM corrigée | IMAGING, OBSERVABILITY_MEASUREMENT, KNOWLEDGE | NATIVE_OUTPUT_SCOPE_MISMATCH |
| A02-T02 | V1 | ACKNOWLEDGE_USER_DIRECTION — Statut d’illustration, intuition, limite ou commentaire rédactionnel ; aucune adoption | QUERY_NAVIGATION, RESEARCH_PROJECT, OWNER_OF_EXACT_REFERENCED_PROPOSAL | UPSTREAM_EMPTY_HOW |
| A02-T04 | V1 | SCIENTIFIC_THINKING_PROPOSAL — Question/hypothèses et alternatives scientifiques dans le cadre adopté | SCIENTIFIC_THINKING, KNOWLEDGE | ACTUALLY_RESPONDS_BOUNDED_GENERIC_HYPOTHESES |
| A02-T05 | V1 | EXPLAIN_REFERENCED_CONTENT — Justification de la proposition précisément visée, ou clarification de sa disponibilité | QUERY_NAVIGATION, RESEARCH_PROJECT, OWNER_OF_EXACT_REFERENCED_PROPOSAL | UPSTREAM_EMPTY_HOW |
| A02-T10 | V1 | ACKNOWLEDGE_USER_DIRECTION — Statut d’illustration, intuition, limite ou commentaire rédactionnel ; aucune adoption | QUERY_NAVIGATION, RESEARCH_PROJECT, OWNER_OF_EXACT_REFERENCED_PROPOSAL | UPSTREAM_EMPTY_HOW |
| A02-T12 | V1 | EXPLAIN_REFERENCED_CONTENT — Lecture exacte des décisions courantes/historiques, objets et délais explicités | RESEARCH_PROJECT, QUERY_NAVIGATION, DOCUMENT_PROJECTION | LOCAL_WRONG_OWNER_OR_REFERENT |
| A02-T14 | V1 | REGENERATE_PROTOCOL — Projection documentaire liée à la version courante, inconnues conservées | RESEARCH_PROJECT, QUERY_NAVIGATION, DOCUMENT_PROJECTION | UPSTREAM_EMPTY_HOW |
| A02-T15 | V1 | SCIENTIFIC_THINKING_PROPOSAL — Question/hypothèses et alternatives scientifiques dans le cadre adopté | SCIENTIFIC_THINKING, KNOWLEDGE | UPSTREAM_EMPTY_HOW |
| A03-T02 | V1 | SCIENTIFIC_THINKING_PROPOSAL — Question/hypothèses et alternatives scientifiques dans le cadre adopté | SCIENTIFIC_THINKING, KNOWLEDGE | NATIVE_CAPABILITY_LIMIT_NO_REQUESTED_OPTIONS |
| A03-T04 | V1 | UNDERSTAND — Explication/compromis de design et faisabilité ; information externe signalée si absente | STUDY_DESIGN, RESEARCH_PROJECT, KNOWLEDGE, BIOSTATISTICS | LOCAL_KNOWLEDGE_NO_APPLICABLE_CONTENT |
| A03-T05 | V1 | ACKNOWLEDGE_USER_DIRECTION — Statut d’illustration, intuition, limite ou commentaire rédactionnel ; aucune adoption | QUERY_NAVIGATION, RESEARCH_PROJECT, OWNER_OF_EXACT_REFERENCED_PROPOSAL | UPSTREAM_EMPTY_HOW |
| A03-T11 | V1 | EXPLAIN_REFERENCED_CONTENT — Lecture exacte des décisions courantes/historiques, objets et délais explicités | RESEARCH_PROJECT, QUERY_NAVIGATION, DOCUMENT_PROJECTION | UPSTREAM_EMPTY_HOW |
| A03-T13 | V1 | SCIENTIFIC_THINKING_PROPOSAL — Question/hypothèses et alternatives scientifiques dans le cadre adopté | SCIENTIFIC_THINKING, KNOWLEDGE | NATIVE_CAPABILITY_LIMIT_NO_REQUESTED_OPTIONS |
| A03-T14 | V1 | SCIENTIFIC_THINKING_PROPOSAL — Question/hypothèses et alternatives scientifiques dans le cadre adopté | SCIENTIFIC_THINKING, KNOWLEDGE | NATIVE_CAPABILITY_LIMIT_NO_REQUESTED_OPTIONS |
| A04-T04 | V1 | BIOSTATISTICS_PLANNING — Mesures d’accord pour observations appariées, choix non adopté | BIOSTATISTICS, OBSERVABILITY_MEASUREMENT, STUDY_DESIGN, KNOWLEDGE | NATIVE_OUTPUT_SCOPE_MISMATCH |
| A04-T05 | V1 | UNDERSTAND — Concepts et compromis de mesure/critère sans sélectionner la méthode | OBSERVABILITY_MEASUREMENT, BIOSTATISTICS, IMAGING, KNOWLEDGE | UPSTREAM_EMPTY_HOW |
| A04-T07 | V1 | ACKNOWLEDGE_USER_DIRECTION — Statut d’illustration, intuition, limite ou commentaire rédactionnel ; aucune adoption | QUERY_NAVIGATION, RESEARCH_PROJECT, OWNER_OF_EXACT_REFERENCED_PROPOSAL | UPSTREAM_EMPTY_HOW |
| A04-T08 | V1 | STUDY_DESIGN_COHERENCE — Alternatives méthodologiques et limites du plan courant | STUDY_DESIGN, RESEARCH_PROJECT, KNOWLEDGE, BIOSTATISTICS | NATIVE_OUTPUT_SCOPE_MISMATCH |
| A04-T12 | V1 | EXPLAIN_REFERENCED_CONTENT — Lecture exacte des décisions courantes/historiques, objets et délais explicités | RESEARCH_PROJECT, QUERY_NAVIGATION, DOCUMENT_PROJECTION | UPSTREAM_EMPTY_HOW |
| A04-T15 | V1 | STUDY_DESIGN_COHERENCE — Alternatives méthodologiques et limites du plan courant | STUDY_DESIGN, RESEARCH_PROJECT, KNOWLEDGE, BIOSTATISTICS | NATIVE_CAPABILITY_LIMIT_NO_REQUESTED_OPTIONS |
| B01-T04 | V1 | SCIENTIFIC_THINKING_PROPOSAL — Question/hypothèses et alternatives scientifiques dans le cadre adopté | SCIENTIFIC_THINKING, KNOWLEDGE | ACTUALLY_RESPONDS_BOUNDED_GENERIC_HYPOTHESES |
| B01-T06 | V1 | UNDERSTAND — Précision, confusion, unités et structure analytique | BIOSTATISTICS, OBSERVABILITY_MEASUREMENT, STUDY_DESIGN, KNOWLEDGE | UPSTREAM_EMPTY_HOW |
| B01-T09 | V1 | UNDERSTAND — Explication/compromis de design et faisabilité ; information externe signalée si absente | STUDY_DESIGN, RESEARCH_PROJECT, KNOWLEDGE, BIOSTATISTICS | LOCAL_KNOWLEDGE_NO_APPLICABLE_CONTENT |
| B01-T14 | V1 | REGENERATE_PROTOCOL — Projection documentaire liée à la version courante, inconnues conservées | RESEARCH_PROJECT, QUERY_NAVIGATION, DOCUMENT_PROJECTION | UPSTREAM_EMPTY_HOW |
| B01-T15 | V1 | BIOSTATISTICS_PLANNING — Alternatives d’analyse respectant plan, unités et temporalité | BIOSTATISTICS, OBSERVABILITY_MEASUREMENT, STUDY_DESIGN, KNOWLEDGE | CURRENT_PROJECT_CONTENT_BEHIND_GOLD_AND_SCOPE_MISMATCH |
| B02-T02 | V1 | ACKNOWLEDGE_USER_DIRECTION — Statut d’illustration, intuition, limite ou commentaire rédactionnel ; aucune adoption | QUERY_NAVIGATION, RESEARCH_PROJECT, OWNER_OF_EXACT_REFERENCED_PROPOSAL | UPSTREAM_EMPTY_HOW |
| B02-T03 | V1 | BIOSTATISTICS_PLANNING — Alternatives d’analyse respectant plan, unités et temporalité | BIOSTATISTICS, OBSERVABILITY_MEASUREMENT, STUDY_DESIGN, KNOWLEDGE | NATIVE_CAPABILITY_LIMIT_NO_REQUESTED_OPTIONS |
| B02-T05 | V1 | UNDERSTAND — Précision, confusion, unités et structure analytique | BIOSTATISTICS, OBSERVABILITY_MEASUREMENT, STUDY_DESIGN, KNOWLEDGE | LOCAL_WRONG_OWNER_OR_REFERENT |
| B02-T08 | V1 | ACKNOWLEDGE_USER_DIRECTION — Statut d’illustration, intuition, limite ou commentaire rédactionnel ; aucune adoption | QUERY_NAVIGATION, RESEARCH_PROJECT, OWNER_OF_EXACT_REFERENCED_PROPOSAL | UPSTREAM_EMPTY_HOW |
| B02-T10 | V1 | BIOSTATISTICS_PLANNING — Alternatives d’analyse respectant plan, unités et temporalité | BIOSTATISTICS, OBSERVABILITY_MEASUREMENT, STUDY_DESIGN, KNOWLEDGE | NATIVE_CAPABILITY_LIMIT_NO_REQUESTED_OPTIONS |
| B02-T12 | V1 | EXPLAIN_REFERENCED_CONTENT — Lecture exacte des décisions courantes/historiques, objets et délais explicités | RESEARCH_PROJECT, QUERY_NAVIGATION, DOCUMENT_PROJECTION | UPSTREAM_EMPTY_HOW |
| B03-T02 | V1 | SCIENTIFIC_THINKING_PROPOSAL — Question/hypothèses et alternatives scientifiques dans le cadre adopté | SCIENTIFIC_THINKING, KNOWLEDGE | ACTUALLY_RESPONDS_BOUNDED_GENERIC_HYPOTHESES |
| B03-T03 | V1 | UNDERSTAND — Explication/compromis de design et faisabilité ; information externe signalée si absente | STUDY_DESIGN, RESEARCH_PROJECT, KNOWLEDGE, BIOSTATISTICS | UPSTREAM_EMPTY_HOW |
| B03-T05 | V1 | ACKNOWLEDGE_USER_DIRECTION — Statut d’illustration, intuition, limite ou commentaire rédactionnel ; aucune adoption | QUERY_NAVIGATION, RESEARCH_PROJECT, OWNER_OF_EXACT_REFERENCED_PROPOSAL | UPSTREAM_EMPTY_HOW |
| B03-T08 | V1 | OBSERVABILITY_QUALIFICATION — Définition/instrument de mesure : options ou besoins de qualification | OBSERVABILITY_MEASUREMENT, BIOSTATISTICS, IMAGING, KNOWLEDGE | UPSTREAM_EMPTY_HOW |
| B03-T09 | V1 | EXPLAIN_REFERENCED_CONTENT — Justification de la proposition précisément visée, ou clarification de sa disponibilité | QUERY_NAVIGATION, RESEARCH_PROJECT, OWNER_OF_EXACT_REFERENCED_PROPOSAL | UPSTREAM_EMPTY_HOW |
| B04-T04 | V1 | BIOSTATISTICS_PLANNING — Alternatives d’analyse respectant plan, unités et temporalité | BIOSTATISTICS, OBSERVABILITY_MEASUREMENT, STUDY_DESIGN, KNOWLEDGE | NATIVE_CAPABILITY_LIMIT_NO_REQUESTED_OPTIONS |
| B04-T05 | V1 | UNDERSTAND — Concepts et compromis de mesure/critère sans sélectionner la méthode | OBSERVABILITY_MEASUREMENT, BIOSTATISTICS, IMAGING, KNOWLEDGE | UPSTREAM_EMPTY_HOW |
| B04-T08 | V1 | UNDERSTAND — Concepts et compromis de mesure/critère sans sélectionner la méthode | OBSERVABILITY_MEASUREMENT, BIOSTATISTICS, IMAGING, KNOWLEDGE | UPSTREAM_EMPTY_HOW |
| B04-T10 | V1 | SCIENTIFIC_THINKING_PROPOSAL — Question/hypothèses et alternatives scientifiques dans le cadre adopté | SCIENTIFIC_THINKING, KNOWLEDGE | NATIVE_CAPABILITY_LIMIT_NO_REQUESTED_OPTIONS |
| B04-T15 | V1 | EXPLAIN_REFERENCED_CONTENT — Lecture exacte des décisions courantes/historiques, objets et délais explicités | RESEARCH_PROJECT, QUERY_NAVIGATION, DOCUMENT_PROJECTION | UPSTREAM_EMPTY_HOW |
| C01-T05 | Stress | SCIENTIFIC_THINKING_PROPOSAL — Question/hypothèses et alternatives scientifiques dans le cadre adopté | SCIENTIFIC_THINKING, KNOWLEDGE | ACTUALLY_RESPONDS_BOUNDED_GENERIC_HYPOTHESES |
| C01-T06 | Stress | EXPLAIN_REFERENCED_CONTENT — Justification de la proposition précisément visée, ou clarification de sa disponibilité | QUERY_NAVIGATION, RESEARCH_PROJECT, OWNER_OF_EXACT_REFERENCED_PROPOSAL | UPSTREAM_EMPTY_HOW |
| C01-T08 | Stress | ACKNOWLEDGE_USER_DIRECTION — Statut d’illustration, intuition, limite ou commentaire rédactionnel ; aucune adoption | QUERY_NAVIGATION, RESEARCH_PROJECT, OWNER_OF_EXACT_REFERENCED_PROPOSAL | UPSTREAM_EMPTY_HOW |
| C01-T09 | Stress | STUDY_DESIGN_COHERENCE — Alternatives méthodologiques et limites du plan courant | STUDY_DESIGN, RESEARCH_PROJECT, KNOWLEDGE, BIOSTATISTICS | NATIVE_OUTPUT_SCOPE_MISMATCH |
| C01-T12 | Stress | UNDERSTAND — Précision, confusion, unités et structure analytique | BIOSTATISTICS, OBSERVABILITY_MEASUREMENT, STUDY_DESIGN, KNOWLEDGE | UPSTREAM_EMPTY_HOW |
| C01-T14 | Stress | REGENERATE_PROTOCOL — Projection documentaire liée à la version courante, inconnues conservées | RESEARCH_PROJECT, QUERY_NAVIGATION, DOCUMENT_PROJECTION | UPSTREAM_EMPTY_HOW |
| C02-T03 | Stress | UNDERSTAND — Explication/compromis de design et faisabilité ; information externe signalée si absente | STUDY_DESIGN, RESEARCH_PROJECT, KNOWLEDGE, BIOSTATISTICS | UPSTREAM_EMPTY_HOW |
| C02-T09 | Stress | UNDERSTAND — Précision, confusion, unités et structure analytique | BIOSTATISTICS, OBSERVABILITY_MEASUREMENT, STUDY_DESIGN, KNOWLEDGE | UPSTREAM_EMPTY_HOW |
| C02-T13 | Stress | STUDY_DESIGN_COHERENCE — Alternatives méthodologiques et limites du plan courant | STUDY_DESIGN, RESEARCH_PROJECT, KNOWLEDGE, BIOSTATISTICS | SCOPED_HYPOTHESES_WITH_MISSING_REQUEST_CONSTRAINTS |
| C03-T02 | Stress | ACKNOWLEDGE_USER_DIRECTION — Statut d’illustration, intuition, limite ou commentaire rédactionnel ; aucune adoption | QUERY_NAVIGATION, RESEARCH_PROJECT, OWNER_OF_EXACT_REFERENCED_PROPOSAL | UPSTREAM_EMPTY_HOW |
| C03-T04 | Stress | SCIENTIFIC_THINKING_PROPOSAL — Question/hypothèses et alternatives scientifiques dans le cadre adopté | SCIENTIFIC_THINKING, KNOWLEDGE | ACTUALLY_RESPONDS_BOUNDED_GENERIC_HYPOTHESES |
| C03-T06 | Stress | UNDERSTAND — Concepts et compromis de mesure/critère sans sélectionner la méthode | OBSERVABILITY_MEASUREMENT, BIOSTATISTICS, IMAGING, KNOWLEDGE | LOCAL_KNOWLEDGE_NO_APPLICABLE_CONTENT |
| C03-T10 | Stress | ACKNOWLEDGE_USER_DIRECTION — Statut d’illustration, intuition, limite ou commentaire rédactionnel ; aucune adoption | QUERY_NAVIGATION, RESEARCH_PROJECT, OWNER_OF_EXACT_REFERENCED_PROPOSAL | UPSTREAM_EMPTY_HOW |
| C03-T14 | Stress | REGENERATE_PROTOCOL — Projection documentaire liée à la version courante, inconnues conservées | RESEARCH_PROJECT, QUERY_NAVIGATION, DOCUMENT_PROJECTION | UPSTREAM_EMPTY_HOW |
| D01-T03 | Stress | STUDY_DESIGN_COHERENCE — Alternatives méthodologiques et limites du plan courant | STUDY_DESIGN, RESEARCH_PROJECT, KNOWLEDGE, BIOSTATISTICS | UPSTREAM_EMPTY_HOW |
| D01-T04 | Stress | EXPLAIN_REFERENCED_CONTENT — Justification de la proposition précisément visée, ou clarification de sa disponibilité | QUERY_NAVIGATION, RESEARCH_PROJECT, OWNER_OF_EXACT_REFERENCED_PROPOSAL | LOCAL_WRONG_OWNER_OR_REFERENT |
| D01-T05 | Stress | STUDY_DESIGN_COHERENCE — Alternatives méthodologiques et limites du plan courant | STUDY_DESIGN, RESEARCH_PROJECT, KNOWLEDGE, BIOSTATISTICS | UPSTREAM_EMPTY_HOW |
| D01-T10 | Stress | ACKNOWLEDGE_USER_DIRECTION — Statut d’illustration, intuition, limite ou commentaire rédactionnel ; aucune adoption | QUERY_NAVIGATION, RESEARCH_PROJECT, OWNER_OF_EXACT_REFERENCED_PROPOSAL | UPSTREAM_EMPTY_HOW |
| D01-T13 | Stress | EXPLAIN_REFERENCED_CONTENT — Justification de la proposition précisément visée, ou clarification de sa disponibilité | QUERY_NAVIGATION, RESEARCH_PROJECT, OWNER_OF_EXACT_REFERENCED_PROPOSAL | LOCAL_WRONG_OWNER_OR_REFERENT |
| D01-T15 | Stress | SCIENTIFIC_THINKING_PROPOSAL — Question/hypothèses et alternatives scientifiques dans le cadre adopté | SCIENTIFIC_THINKING, KNOWLEDGE | UPSTREAM_EMPTY_HOW |
| E01-T02 | Stress | SCIENTIFIC_THINKING_PROPOSAL — Question/hypothèses et alternatives scientifiques dans le cadre adopté | SCIENTIFIC_THINKING, KNOWLEDGE | ACTUALLY_RESPONDS_BOUNDED_GENERIC_HYPOTHESES |
| E01-T04 | Stress | UNDERSTAND — Concepts et compromis de mesure/critère sans sélectionner la méthode | OBSERVABILITY_MEASUREMENT, BIOSTATISTICS, IMAGING, KNOWLEDGE | UPSTREAM_EMPTY_HOW |
| E01-T05 | Stress | ACKNOWLEDGE_USER_DIRECTION — Statut d’illustration, intuition, limite ou commentaire rédactionnel ; aucune adoption | QUERY_NAVIGATION, RESEARCH_PROJECT, OWNER_OF_EXACT_REFERENCED_PROPOSAL | UPSTREAM_EMPTY_HOW |
| E01-T08 | Stress | STUDY_DESIGN_COHERENCE — Alternatives méthodologiques et limites du plan courant | STUDY_DESIGN, RESEARCH_PROJECT, KNOWLEDGE, BIOSTATISTICS | NATIVE_OUTPUT_SCOPE_MISMATCH |
| E01-T09 | Stress | EXPLAIN_REFERENCED_CONTENT — Justification de la proposition précisément visée, ou clarification de sa disponibilité | QUERY_NAVIGATION, RESEARCH_PROJECT, OWNER_OF_EXACT_REFERENCED_PROPOSAL | LOCAL_WRONG_OWNER_OR_REFERENT |
| E01-T15 | Stress | REGENERATE_PROTOCOL — Projection documentaire liée à la version courante, inconnues conservées | RESEARCH_PROJECT, QUERY_NAVIGATION, DOCUMENT_PROJECTION | UPSTREAM_EMPTY_HOW |
| F01-T02 | V1 | ACKNOWLEDGE_USER_DIRECTION — Statut d’illustration, intuition, limite ou commentaire rédactionnel ; aucune adoption | QUERY_NAVIGATION, RESEARCH_PROJECT, OWNER_OF_EXACT_REFERENCED_PROPOSAL | UPSTREAM_EMPTY_HOW |
| F01-T04 | V1 | CLARIFY_CANDIDATE_REFERENCE — Référent réellement ambigu : demander un libellé sans deviner | QUERY_NAVIGATION, RESEARCH_PROJECT, OWNER_OF_EXACT_REFERENCED_PROPOSAL | UPSTREAM_EMPTY_HOW |
| F01-T06 | V1 | OBSERVABILITY_QUALIFICATION — Définition/instrument de mesure : options ou besoins de qualification | OBSERVABILITY_MEASUREMENT, BIOSTATISTICS, IMAGING, KNOWLEDGE | NATIVE_CAPABILITY_LIMIT_NO_REQUESTED_OPTIONS |
| F01-T07 | V1 | CLARIFY_CANDIDATE_REFERENCE — Référent réellement ambigu : demander un libellé sans deviner | QUERY_NAVIGATION, RESEARCH_PROJECT, OWNER_OF_EXACT_REFERENCED_PROPOSAL | UPSTREAM_EMPTY_HOW |
| F01-T12 | V1 | ACKNOWLEDGE_USER_DIRECTION — Statut d’illustration, intuition, limite ou commentaire rédactionnel ; aucune adoption | QUERY_NAVIGATION, RESEARCH_PROJECT, OWNER_OF_EXACT_REFERENCED_PROPOSAL | LOCAL_WRONG_OWNER_OR_REFERENT |
| F01-T13 | V1 | UNDERSTAND — Portée d’une hypothèse causale et limites d’interprétation | SCIENTIFIC_THINKING, KNOWLEDGE | UPSTREAM_EMPTY_HOW |
| F01-T15 | V1 | OBSERVABILITY_QUALIFICATION — Définition/instrument de mesure : options ou besoins de qualification | OBSERVABILITY_MEASUREMENT, BIOSTATISTICS, IMAGING, KNOWLEDGE | NATIVE_CAPABILITY_LIMIT_NO_REQUESTED_OPTIONS |
| F02-T02 | Stress | SCIENTIFIC_THINKING_PROPOSAL — Question/hypothèses et alternatives scientifiques dans le cadre adopté | SCIENTIFIC_THINKING, KNOWLEDGE | SCOPED_HYPOTHESES_WITH_MISSING_REQUEST_CONSTRAINTS |
| F02-T03 | Stress | EXPLAIN_REFERENCED_CONTENT — Justification de la proposition précisément visée, ou clarification de sa disponibilité | QUERY_NAVIGATION, RESEARCH_PROJECT, OWNER_OF_EXACT_REFERENCED_PROPOSAL | LOCAL_WRONG_OWNER_OR_REFERENT |
| F02-T04 | Stress | SCIENTIFIC_THINKING_PROPOSAL — Question/hypothèses et alternatives scientifiques dans le cadre adopté | SCIENTIFIC_THINKING, KNOWLEDGE | NATIVE_CAPABILITY_LIMIT_NO_REQUESTED_OPTIONS |
| F02-T08 | Stress | ACKNOWLEDGE_USER_DIRECTION — Statut d’illustration, intuition, limite ou commentaire rédactionnel ; aucune adoption | QUERY_NAVIGATION, RESEARCH_PROJECT, OWNER_OF_EXACT_REFERENCED_PROPOSAL | UPSTREAM_EMPTY_HOW |
| F02-T09 | Stress | EXPLAIN_REFERENCED_CONTENT — Lecture exacte des décisions courantes/historiques, objets et délais explicités | RESEARCH_PROJECT, QUERY_NAVIGATION, DOCUMENT_PROJECTION | UPSTREAM_EMPTY_HOW |
| F02-T15 | Stress | SCIENTIFIC_THINKING_PROPOSAL — Question/hypothèses et alternatives scientifiques dans le cadre adopté | SCIENTIFIC_THINKING, KNOWLEDGE | CURRENT_PROJECT_CONTENT_BEHIND_GOLD_AND_SCOPE_MISMATCH |
