# NOXIA — P1-BEHAVIOR-01C
## Generic Biospecimen / Material-Collection Project Projection — B15 closure report

Date : 2026-08-31

Mission : `P1-BEHAVIOR-01C`

Baseline : branche `protocol-designer-canonical-ingestion`, HEAD `bc850a772c4b21e960ceb5c435a22e6cf5217a7f`.

## A. Périmètre et frontière

La mission ferme uniquement B15. Elle ajoute une catégorie de projection Project générique pour les prélèvements et échantillons sans créer d’objet canonique, de vérité Project, de propriétaire scientifique ou de migration Biospecimen PD-003 V2.

Invariants conservés :

- type runtime courant : `ACQUISITION` ;
- rôle scientifique gouverné : `SAMPLE_COLLECTION` ;
- section visible : `BIOSPECIMENS` ;
- promotion canonique Biospecimen : non effectuée ;
- B11 : inchangé, `NOT_TESTABLE` ;
- appels provider, replay live, push et déploiement : aucun.

Les neuf rapports d’implémentation hérités et non suivis restent inchangés et hors du commit.

## B. Routage normatif

Les autorités applicables ont été routées via `SOURCE-OF-TRUTH-INDEX` : Scientific Product Manifesto V2, PD-003 V2 et sa matrice d’ownership, contrat PRJ contribution/projection courant et PD-004 pour le vocabulaire visible.

Constats normatifs appliqués :

- Biospecimen est un objet canonique PD-003 V2 distinct d’une Variable et d’une VariableOccurrence ;
- une collecte d’échantillon n’implique ni imagerie ni analyse ;
- une projection peut adapter le vocabulaire visible sans modifier l’identité, la vérité, le statut ou la provenance ;
- le sous-ensemble runtime courant ne sait pas consommer un type canonique `BIOSPECIMEN`.

Aucune autorité n’a été modifiée.

## C. Modèle Project avant et après

Avant :

`QUESTION`, `POPULATION`, `DESIGN`, `INTERVENTION`, `COMPARATOR`, `IMAGING`, `MEASUREMENTS`, `TEMPORALITY`, `ANALYSIS`.

Après :

`QUESTION`, `POPULATION`, `DESIGN`, `INTERVENTION`, `COMPARATOR`, `IMAGING`, `BIOSPECIMENS`, `MEASUREMENTS`, `TEMPORALITY`, `ANALYSIS`.

La nouvelle section est une catégorie de projection humaine. Son libellé Standard est `Prélèvements / échantillons`. Elle ne constitue ni un nouvel objet PD-003 ni une implémentation du cycle de vie Biospecimen.

## D. Cause et propriétaire réel

Le classificateur de contribution PRJ considérait le type technique large `ACQUISITION` avant le rôle sémantique plus spécifique. `ACQUISITION + SAMPLE_COLLECTION` aboutissait donc à `IMAGING`.

Le propriétaire réel est la frontière existante de contribution et projection canonique du Research Project, et non React, Gemini, QRY ou le document.

La règle générique corrigée est :

```text
rôle sémantique gouverné spécifique
→ section de projection spécialisée compatible

type technique large courant
→ fallback existant
```

Elle ne dépend d’aucun terme médical ou matériau présent dans le texte libre.

## E. Implémentation bornée

Un vocabulaire de sections partagé centralise :

- les identifiants et leur ordre ;
- les libellés visibles ;
- la résolution du rôle gouverné `SAMPLE_COLLECTION` vers `BIOSPECIMENS`.

Ce resolver est consommé par la contribution PRJ, la construction de candidat canonique et le rechargement via l’adaptateur de consommation. Il prend priorité sur le fallback `ACQUISITION → IMAGING`.

Le provider contract accepte `SAMPLE_COLLECTION` et bloque les couples structurés incohérents entre ce rôle et la section `BIOSPECIMENS`. Le prompt expose ce contrat de structure sans créer de dispatch lexical ni de détails de collecte inventés.

La projection Human Review, le Project vivant, l’adoption, le rechargement et le panneau Standard utilisent la même section. Une section renseignée reste `PARTIAL` : information connue ne signifie pas collection complètement spécifiée. Une section vide reste facultative pour la préparation documentaire et n’introduit pas un besoin documentaire universel.

Le support runtime complet demeure absent : aucun `specimenId`, custody, stockage, aliquot, relation parent/enfant, traitement, disponibilité, consentement ou cycle de vie Biospecimen n’est ajouté.

## F. Matrice C15 synthétique

| Cas | Entrée structurée | Résultat |
| --- | --- | --- |
| C15-A | `ACQUISITION + REFERENCE_STANDARD` | fallback existant `IMAGING` |
| C15-B | `ACQUISITION + SAMPLE_COLLECTION` | `BIOSPECIMENS`, jamais `IMAGING` |
| C15-C | type canonique `BIOSPECIMEN` | `NOT_IMPLEMENTED`; aucune prise en charge simulée |
| C15-D | `ACQUISITION` sans rôle spécialisé | fallback existant `IMAGING` |
| C15-E | étude non-imagerie | aucun contenu Imaging ou Biospecimen automatique |

Des assertions complémentaires couvrent Human Review, adoption, état canonique courant, panneau Project Standard et validation du contrat provider.

## G. Qualification

### Contrat comportemental et tests B15

- contrat P1-BEHAVIOR-01A + nouvelle matrice B15 : `26 PASS / 1 TODO` ;
- contrat B01–B20 : `19 PASS / 0 FAIL / 1 NOT_TESTABLE` ;
- B15 : `PASS` sans modification de l’attendu gelé ;
- B11 : `NOT_TESTABLE`, inchangé.

### Régressions ciblées

- PRJ contribution/projection, Human Review, Project consumer, bridge, Standard, Gen-01 et Unit-1 : `9 fichiers / 71 tests PASS` ;
- correction mécanique du test nominal de 9 vers 10 sections, requalifiée avec le contrat et B15 : `3 fichiers / 29 tests PASS / 1 TODO`.

### Statique et build

- TypeScript : `PASS` ;
- lint du périmètre final : `PASS` ;
- build production : `PASS` ;
- avertissements seulement : données Browserslist héritées, annotation PURE tierce, syntaxe CSS héritée et taille de chunks.

### Suite canonique complète — exécution unique

Résultat brut de l’unique exécution :

- fichiers : `202 PASS / 2 FAIL / 2 SKIP` ;
- tests : `3362 PASS / 2 FAIL / 12 SKIP / 1 TODO` ;
- échec historique inchangé : `p-web-02-contract.test.tsx` ;
- second échec : assertion nominale héritée exigeant exactement 9 sections.

Cette seconde assertion a été synchronisée mécaniquement avec le nouveau modèle à 10 sections puis requalifiée par le test ciblé, sans seconde exécution complète. L’état final démontré par combinaison de l’exécution complète et de cette requalification ciblée est donc :

- fichiers : `203 PASS / 1 FAIL historique / 2 SKIP` ;
- tests : `3363 PASS / 1 FAIL historique / 12 SKIP / 1 TODO` ;
- nouvelles régressions : `0`.

## H. Git

Le code, les tests et ce rapport forment un seul commit local. Son SHA est rapporté extérieurement, un commit ne pouvant contenir son propre identifiant final.

Aucun push et aucun déploiement ne sont effectués.

## I. Décision

```text
P1_BEHAVIOR_01C_B15_CLOSED_B11_ONLY_EXPLICIT_GAP

FULL_PD003_BIOSPECIMEN_RUNTIME_SUPPORT = NO
CASE_SPECIFIC_RUNTIME_LOGIC_ADDED = NO
GENERALIZATION_GLOBALLY_PROVEN = NO

P1_COMPLETE = NO
P1_EXIT_GATE = NOT_SATISFIED
WAVE_2_AUTHORIZED = NO
```
