# MAN-001 — Compatibility Matrix

**Statut :** OFFICIAL — matrice de compatibilité V1/V2
**Niveau :** NIVEAU_3 — document d’accompagnement
**Version :** 1.0
**Date :** 12 août 2026

## 1. Légende

| Statut | Sens |
|---|---|
| `COMPATIBLE_UNCHANGED` | responsabilité actuelle conforme sans changement de principe |
| `COMPATIBLE_WITH_CLARIFICATION` | responsabilité compatible ; vocabulaire ou handoff à préciser ultérieurement |
| `ADAPTATION_REQUIRED_AFTER_PD003` | évolution d’implémentation interdite avant la norme métier |
| `FUTURE_NORMATIVE_WORK_REQUIRED` | brique non admise ; contrat à créer |
| `HISTORICAL_ONLY` | version ou projection conservée pour l’histoire |
| `NOT_EVIDENCE_OF_IMPLEMENTATION` | document ou constitution ne prouve aucune capacité |

## 2. Matrice des constitutions et références

| Surface | Statut V2 | Motif | Action actuelle | Action future |
|---|---|---|---|---|
| Charte fondatrice | `COMPATIBLE_UNCHANGED` | utilité avant abstraction, humain, contexte et traçabilité préservés | aucune | aucune |
| Manifeste V1 | `HISTORICAL_ONLY` | supersédé sans réécriture | conserver DOCX/PDF | utiliser pour replay historique |
| Manifeste V2 | `NOT_EVIDENCE_OF_IMPLEMENTATION` | constitution adoptée | enregistrer et publier comme source documentaire contrôlée | appliquer par références spécialisées |
| Product Specification | `COMPATIBLE_WITH_CLARIFICATION` | cible produit générale inchangée | aucune | analyser les parcours lors d’une révision autorisée |
| PD-003 | `ADAPTATION_REQUIRED_AFTER_PD003` | vocabulaire courant ne porte pas toutes les séparations V2 | aucune modification MAN-001 | produire une version majeure séparée |
| PD-004 | `COMPATIBLE_UNCHANGED` | progressive disclosure, preuves, limites et humain compatibles | aucune | enrichir les patterns si nécessaire |
| PD-005 | `COMPATIBLE_WITH_CLARIFICATION` | rôles IA subordonnés et refus compatibles | aucune | mettre à jour les contrats après PD-003 |
| PD-009 | `COMPATIBLE_WITH_CLARIFICATION` | décision, impact et arrêt compatibles | aucune | consommer les objets V2 admis |
| PD-011 | `COMPATIBLE_WITH_CLARIFICATION` | évaluation et non-régression compatibles | aucune | ajouter cas et métriques V2 |
| RDE-001 | `COMPATIBLE_WITH_CLARIFICATION` | moteur coordonné et owners spécialisés déjà séparés | aucune | mettre à jour la composition après les normes |
| RDE-002 | `COMPATIBLE_WITH_CLARIFICATION` | transitions, événements et replay compatibles | aucune | ajouter les nouveaux handoffs |
| RDE-003 | `ADAPTATION_REQUIRED_AFTER_PD003` | chaîne Imaging V1 condensée | aucune | distinguer observable, méthode et rôle biomarqueur |
| KE-001 | `COMPATIBLE_UNCHANGED` | Knowledge ne possède ni Project ni décision | aucune | exposer des références aux futurs plans |

## 3. Matrice des moteurs et surfaces implémentées

| Composant | État documenté | Compatibilité V2 | Préservation | Dette future |
|---|---|---|---|---|
| Knowledge Engine | architecture normative, implémentations bornées séparées | `COMPATIBLE_UNCHANGED` | concepts, preuves, gaps, contradictions | handoff vers Model/OBS |
| Scientific Thinking | V1 implémentée avec limitations | `COMPATIBLE_WITH_CLARIFICATION` | Questions, Hypothèses, mécanismes candidats, décision humaine | future contribution Scientific Model |
| Imaging Study Designer | V1 implémentée avec limitations | `ADAPTATION_REQUIRED_AFTER_PD003` | chaîne actuelle comme projection legacy | séparer Property/Definition/Role |
| IMG Project handoff | clôture bornée | `COMPATIBLE_WITH_CLARIFICATION` | provenance et autorisation humaine | nouveaux champs après norme |
| Research Project | construction V1 documentée | `ADAPTATION_REQUIRED_AFTER_PD003` | Project source de vérité, Variables candidates | Data Needs, Variables canoniques, temps |
| REG-001 | qualification avec limitations | `COMPATIBLE_UNCHANGED` | owner réglementaire, inconnues | consommer faits V2 bornés |
| TMP-001 | composition logique documentée | `COMPATIBLE_UNCHANGED` | structure passive | nouvelles références de sections |
| DOC-002 | patterns documentaires | `COMPATIBLE_UNCHANGED` | patterns, aucun fond scientifique | patterns V2 éventuels |
| DOC-001B / projection | projection passive documentée | `COMPATIBLE_UNCHANGED` | Project reste source de vérité | rendre les séparations V2 |
| VAL-000 | architecture diagnostique avec limitations | `COMPATIBLE_WITH_CLARIFICATION` | aucune correction automatique | nouveaux checkpoints V2 |
| SEM-001/R1/R2/R3 | rapports présents, décisions NOT_READY | `HISTORICAL_ONLY` pour MAN-001 | ne pas transformer leur taxonomie en autorité | réévaluer après normes, sans admission ici |

## 4. Matrice des briques futures

| Brique | Statut | Précondition | Owner constitutionnel | Refus absolu |
|---|---|---|---|---|
| Scientific Model | `FUTURE_NORMATIVE_WORK_REQUIRED` | PD-003 majeur | gouvernance modèle + décision Project | Knowledge Graph parallèle |
| OBS-001 | `FUTURE_NORMATIVE_WORK_REQUIRED` | manifeste V2 + PD-003 | domaine OBS, contributions spécialisées | données individuelles ou choix Project |
| CDM-001 | `FUTURE_NORMATIVE_WORK_REQUIRED` | Variable/Occurrence admises | Data/CDM pour représentation | vérité scientifique ou analyse choisie |
| Data Management | `FUTURE_NORMATIVE_WORK_REQUIRED` | CDM et ownership | Data Management | modifier le sens scientifique |
| Biostatistics | `FUTURE_NORMATIVE_WORK_REQUIRED` | Variables et Occurrences | Biostatistics | redéfinir les objets amont |

## 5. Compatibilité des objets clés

| Objet V1 | Lecture V2 | Compatibilité | Conversion automatique |
|---|---|---|---|
| Phénomène biologique | phénomène ou état référencé dans un modèle | conservé | interdite vers observable |
| Biomarqueur | composé legacy ou futur Biomarker Role | historique conditionnelle | interdite |
| Modalité | famille spécialisée de moyens de mesure | conservée | aucune promotion |
| Séquence/Acquisition | spécialisation de méthode et acte de production | conservée | mapping futur explicite |
| Variable d’étude | future Canonical Variable si la définition le permet | clarification | interdite si valeur mêlée |
| Visite/temps d’observation | repère temporel du projet | clarification | aucune valeur créée |
| Analyse | type générique à owners spécialisés | conservée | résultat séparé |
| Projection | représentation passive | conservée | aucune nouvelle identité |

## 6. Conclusion de compatibilité

La non-régression est satisfaite au niveau constitutionnel : aucun owner existant n’est supprimé, aucune preuve n’est déplacée, aucune décision humaine n’est automatisée et aucune projection n’acquiert d’autorité. Les adaptations nécessaires restent explicitement différées jusqu’aux évolutions normatives et évaluations correspondantes.
