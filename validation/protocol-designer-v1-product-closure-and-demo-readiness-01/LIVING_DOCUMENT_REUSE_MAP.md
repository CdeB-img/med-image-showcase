# Extension du mandat courant — document vivant

Mandat reçu pendant CP9, après la première qualification du corridor statique. Il interdit désormais DEMO_READY=YES pour le seul export de Project. Même mission, même branche, corrections et preuves conservées ; aucun appel externe autorisé par cette extension.

## Réutilisation observée avant implémentation

- Knowledge : executeKnowledgeRequest, normalisation des RuntimeSource / RuntimeAssertion, RuntimeEvidenceLink (SUPPORTS/REFUTES/QUALIFIES…), qualification d’applicabilité, corpus P4R/P5 et RC01. Les candidats externes et metadata-only restent distincts des assertions admises.
- Sources : bibliographie P4R/P5 déjà conservée, DOI/PMID/auteurs/dates disponibles en amont ; leur projection RuntimeSource actuelle omet certains champs. Aucune bibliothèque associée à chaque session Standard.
- Recherche externe : PubMed, plan minimisé, consentement et cache existent. Cette mission utilise exclusivement le corpus local ; une référence absente reste non résolue. Aucun appel réseau, aucune référence générée.
- DOC/TMP : StudyTemplateInstance, sections, source Project exacte, priorProjectionId, historique immutable, diffProjections et export HTML existent. Absence de révision conversationnelle sourcée et de bibliothèque visible.
- PD-003 V2 : Project propriétaire des décisions particulières ; Knowledge propriétaire des assertions ; TMP/DOC propriétaires de structure/forme. PD-005 R35/R37/R38/R39 : justification et rédaction fidèles après structuration, sans adoption implicite.
- Editorial Engine générique : pilote de surfaces et navigation, aucun besoin de lui transférer un rôle scientifique.

## Implémentation bornée retenue

1. Projection persistée des sources et preuves Knowledge par Project, avec événements d’intérêt utilisateur orthogonaux au statut scientifique. Identités amont réutilisées, mentions non résolues conservées sans bibliographie inventée.
2. Extension du consommateur TMP/DOC pour contexte et références sourcés. Chaque assertion documentaire conserve ses liens de preuve et sa portée ; le retrait d’un support déclenche une révision des assertions dépendantes.
3. Commandes documentaires dans Standard : portée section/source/version explicite, transformation bornée, diff et provenance. Toute modification de décision scientifique revient au chemin natif Project/Human Review ; ambiguïté = clarification, sans rewrite.
4. Versions documentaires immuables dans le portefeuille existant. Génération, révision et restauration produisent des versions distinctes, liées au Project exact. Sources et conversations incluses dans la sauvegarde locale complète.
5. Qualification navigateur A–G et nouveaux gates séparés. Les limites de rédaction, résolution ou couverture effectivement constatées déterminent PASS/PARTIAL/FAIL ; aucun PASS global déduit d’un simple mécanisme d’édition.

Le premier full suite pré-extension : 4323 PASS, 7 FAIL, 12 pending, 1 todo. Les échecs sont conservés : 3 tests de substitution de runtime affectés par une réutilisation trop large (corrigée en excluant les runtimes injectés), 3 attentes/fixtures devenues incompatibles avec le contrat multi-projets, 1 fixture à identité Project incohérente. Requalification ciblée puis complète requise.
