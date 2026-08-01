# P4R — Contrat de consolidation scientifique

P4R consolide le corpus pilote ECV/T1 sans le transformer en ontologie universelle. ECV/T1 sert uniquement à valider les contrats de source, extraction, assertion, preuve, contexte, mesure, contradiction, synthèse, revue et readiness.

## Frontière

P4R reste limité au socle scientifique documentaire du site Noxia. Il ne crée aucune page, route, métadonnée SEO, entrée de sitemap, interface, fonction PACS, objet Supabase ou logique du logiciel métier. Les projections restent internes, sans prose, sans canonical et non indexables.

## Stratégie de révision

Le snapshot P4 est conservé comme révision 1. P4R crée des révisions 2 liées par `supersedesRevisionId` pour les 27 sources et les 58 assertions. Les 84 EvidenceLinks disposent d’une matrice avant/après. Aucune donnée P4 n’est supprimée.

Les métadonnées bibliographiques viennent des notices officielles PubMed. Le texte intégral est distingué de l’abstract : PMC et les pages officielles JACC vérifiées sont `FULL_TEXT`, tandis que six sources restent `ABSTRACT_ONLY`. Une assertion fondée sur un abstract reste strictement limitée à ce qui y figure.

## Revue automatisée

`noxia-scientific-review-engine` applique une `automatedScientificReview` déterministe. Elle contrôle l’atomicité, les identités, les localisateurs, le type d’extraction, la relation de preuve, le contexte, la polarité et les garde-fous contre l’extrapolation.

Elle ne constitue pas une revue humaine. `scientificHumanReview` reste `null`. Les décisions autorisées sont :

- `AUTOMATED_REVIEW_PASSED` ;
- `AUTOMATED_REVIEW_QUALIFIED` ;
- `AUTOMATED_REVIEW_CONTESTED` ;
- `AUTOMATED_REVIEW_INSUFFICIENT_SOURCE` ;
- `AUTOMATED_REVIEW_REJECTED`.

## Ontologie multi-rôle

Une identité historique peut conserver sa classe éditoriale tout en recevant un rôle contextuel différent dans une mesure ou une synthèse. T1 mapping, T1 et ECV utilisent ce mécanisme. Les concepts hors pilote ne sont pas reclassifiés sans corpus propre.

## Généricité

Les invariants génériques excluent les formules ECV, l’hématocrite, MOLLI, SASHA, le gadolinium, le myocarde et le timing post-contraste. Dix fixtures synthétiques isolées testent ADC, Tmax, LGE, segmentation, DICOM, CT spectral, cycle de vie documentaire, contradiction, unité CT et concept sans formule.

Les fixtures utilisent le namespace `fixture:` et ne rejoignent jamais les registres réels.

## Readiness

Les sept dimensions restent indépendantes. Une projection peut devenir éligible à une future structuration éditoriale interne après revue automatisée, même sans revue humaine. Cette éligibilité ne rend ni `seoReady` ni `publicPublicationReady` vrais. Une publication exigera une décision distincte.

## Protocole d’enrichissement

Le protocole générique accepte un `domainId` et exécute 18 étapes : périmètre, audit, recherche, sélection, concepts, ontologie, mesures, extraction, assertions, EvidenceLinks, contextes, limites, contradictions, synthèses, requêtes, readiness, généricité et validation finale.

