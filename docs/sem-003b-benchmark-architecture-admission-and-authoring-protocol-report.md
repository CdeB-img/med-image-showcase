# SEM-003B — Benchmark Architecture Admission + Development / Calibration Authoring Protocol

## Rapport d’admission et de clôture documentaire

| Champ | Valeur |
|---|---|
| Version | `1.0` |
| Statut | `OFFICIAL` |
| Niveau documentaire | `NIVEAU_3 — rapport de mission` |
| Source maîtresse | `docs/sem-003b-benchmark-architecture-admission-and-authoring-protocol-report.md` |
| Date | 13 août 2026 |
| Dépôt | `noxia-dev` |
| Branche observée | `main` |
| Commit de départ | `4b4097e76a7903e4741adffd5791e740800432ac` |
| Index après opération | version `1.32`, `OFFICIAL` |
| Décision | `SEM003_ADMITTED_AUTHORING_PROTOCOL_READY` |

---

## 1. Résultat

L’architecture SEM-003 version 1.0 est admise avec le statut `ADMITTED_WITH_LIMITATIONS`. Elle est compatible avec les autorités consultées et ne crée aucun conflit normatif actif.

Le protocole SEM-003B version 1.0 est `OFFICIAL — CONTROLLED_AUTHORING_PROTOCOL`. Il permet de créer des cas `DEVELOPMENT_VISIBLE` et de préparer des cas `CALIBRATION_VISIBLE` au moyen d’un `Case Contract`, d’un `Acceptance Envelope Contract`, d’un workflow humain, d’une checklist et d’un validateur strictement structurel et contractuel.

Cette décision n’est ni une qualification de SEM, ni un PASS scientifique, ni une admission d’un benchmark concret.

## 2. Audit de compatibilité

| Contrat | Conclusion | Preuve appliquée |
|---|---|---|
| Charte fondatrice | Compatible | science avant production, absence non remplacée, incertitude visible et décision humaine préservées |
| Scientific Product Manifesto V2 | Compatible | vérité scientifique séparée de la décision Project, provenance et limites visibles |
| Editorial Engine — Architecture Manifesto | Compatible | benchmark consommateur indépendant ; aucune responsabilité générique du moteur éditorial redéfinie |
| SEM-002 | Compatible | 12 propriétés Safety/Fidelity absolues, 5 propriétés Scientific Understanding statistiques et 1 propriété Contextual Enrichment statistique reprises sans mutation |
| PD-003 V2 | Compatible | Case et Acceptance Envelope restent des objets de benchmark ; aucune catégorie métier, relation ou ownership canonique créé |
| OBS-001 | Compatible | méthode, observable, mesure et rôle biomarqueur restent sous l’autorité OBS ; aucune valeur scientifique ajoutée |
| PD-005 | Compatible | aucun prompt, rôle IA ou permission runtime modifié |
| PD-009 | Compatible | la valeur décisionnelle d’une clarification reste propriétaire du Decision Engine |
| PD-011 | Compatible | métriques admises, répétitions, seuils, portes et décisions restent réservés au protocole d’évaluation |
| Rapports SEM historiques | Preuves seulement | variabilité et risque de sur-ajustement utilisés comme justification historique, jamais comme norme |

### Réconciliation documentaire

La version de conception de SEM-003 traitait initialement les paramètres futurs — nombre de runs, seuils, qualification de l’évaluateur et protection physique du blind — comme des questions encore ouvertes avant les phases ultérieures. Ces limites ne sont pas des conflits empêchant l’admission de l’architecture : PD-011 exige précisément qu’elles soient calibrées ou préspécifiées plus tard. La formulation a donc été classée comme limitation d’usage, sans inventer de valeur ni modifier les autorités.

L’ancienne mention selon laquelle l’index resterait inchangé a été corrigée : l’admission est enregistrée atomiquement dans la version 1.32 du `SOURCE-OF-TRUTH-INDEX`.

## 3. Livrables

| Livrable | Statut et portée |
|---|---|
| `docs/sem-003-independent-scientific-understanding-benchmark-architecture.md` | SEM-003 v1.0, `ADMITTED_WITH_LIMITATIONS`, NIVEAU_1 |
| `docs/sem-003b-benchmark-case-authoring-protocol.md` | protocole v1.0, `OFFICIAL`, NIVEAU_3 |
| `semantic-validation/sem-003/authoring/case.schema.json` | contrat machine non normatif du Case |
| `semantic-validation/sem-003/authoring/acceptance-envelope.schema.json` | contrat machine non normatif de l’Acceptance Envelope |
| `semantic-validation/sem-003/authoring/validator.mjs` | validation déterministe structurelle et contractuelle uniquement |
| `semantic-validation/sem-003/authoring/validator.test.mjs` | tests positifs et négatifs du contrat |
| `semantic-validation/sem-003/authoring/examples/` | trois paires synthétiques `DEVELOPMENT_VISIBLE`, validation-only et définitivement non aveugles |
| `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md` | version 1.32 ; 112 artefacts gouvernés, 113 index inclus |

Les schémas, le validateur, les tests et les exemples machine ne sont pas des documents normatifs et ne sont pas comptés parmi les 112 artefacts gouvernés.

## 4. Validations

| Validation | Résultat |
|---|---|
| Schémas JSON lisibles et compilables | `PASS` — JSON Schema draft-07, compilation Ajv réussie |
| Trois paires Case/Envelope structurellement valides | `PASS` — 3 Case et 3 Acceptance Envelopes |
| Tests positifs et négatifs du validateur | `PASS` — 15/15 |
| Cohérence des 18 propriétés SEM-002 | `PASS` — 18/18, familles et caractère absolu/statistique conservés |
| Cohérence documentaire et liens locaux | `PASS` — aucune référence locale manquante dans les trois livrables maîtres |
| Typecheck | `PASS` |
| Build | `PASS` — avertissements Vite non bloquants, sans changement fonctionnel du produit |
| `git diff --check` | `PASS` |
| Absence de modification fonctionnelle SEM | `PASS` — aucun fichier SEM fonctionnel modifié |

## 5. Limites conservées

### A — authoring

- la qualité scientifique d’une référence reste un jugement humain ;
- les rôles exacts et l’accord expert doivent être tracés sans inventer une revue ;
- la gate Calibration exige une revue distincte et ne résulte jamais du seul validateur ;
- la parenté sémantique et la contamination ne sont pas décidées automatiquement.

### B — calibration

- aucune valeur de `N`, aucun seuil, score ou agrégateur n’est fixé ;
- les métriques conceptuelles doivent être admises et calibrées sous PD-011 ;
- l’évaluateur et la procédure d’équivalence restent à qualifier ;
- aucun résultat Calibration ne constitue une preuve finale.

### C — qualification aveugle

- aucun cas `BLIND_SEALED`, Gold final ou package aveugle n’est créé ;
- le stockage, le propriétaire du package, l’injection et la séparation organisationnelle restent à arbitrer ;
- H01–H30 et les exemples présents restent exposés et inéligibles à une preuve indépendante ;
- aucune exécution, campagne, photographie baseline ou décision de qualification n’est autorisée par SEM-003B.

## 6. Frontières d’exécution

La mission n’a modifié aucun fichier fonctionnel SEM, prompt, provider, critic, schéma runtime, canonicalizer, coverage, evaluator, routing, Gold ou seuil. Elle n’a lancé aucun appel LLM, aucun Holdout, H29, browser, downstream ou campagne SEM.

Décision finale :

`SEM003_ADMITTED_AUTHORING_PROTOCOL_READY`
