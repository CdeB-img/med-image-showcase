# P11 — Production scientifique continue pilotée par territoire

## Portée

P11 prolonge le mécanisme atomique validé en P10 sans créer une nouvelle couche d'architecture. Le Scientific Territory Model reste immuable. Le Scientific Knowledge Catalog reste la source de vérité de la file, de la priorité, de la couverture et de la readiness. Les campagnes sont exécutées séquentiellement et aucune donnée du paquet préparatoire n'est promue sans requalification.

P11 ne crée aucune page, route, canonical, entrée de sitemap, navigation ou autre artefact public. Il ne modifie ni le produit Noxia, ni les viewers, le PACS, Supabase, Auth, Stripe ou `editorial-engine`.

## Contrat séquentiel

Une itération suit ce contrat :

1. lire la file du catalogue courant ;
2. prendre sa première entrée disposant d'un paquet de candidats entièrement validé ;
3. créer un manifeste immuable ;
4. exécuter deux simulations et comparer leurs traces ;
5. appliquer exactement une transaction atomique ;
6. recalculer catalogue, couverture, readiness et file ;
7. rejouer le résultat depuis le corpus cumulatif ;
8. simuler le rollback vers l'état immédiatement précédent ;
9. ne poursuivre qu'après validation complète de l'itération.

Les campagnes ne sont jamais parallélisées. Un domaine exécuté n'est pas sélectionné à nouveau durant la même vague. La limite de cinq campagnes protège l'atomicité et le coût documentaire ; le minimum de trois n'est accepté que si chaque campagne est propre.

## Sources et extractions

Les quatre paquets P11 utilisent 20 associations à des publications, dont 17 nouvelles SourceRevisions et trois révisions déjà présentes. Les identités réutilisées ne sont pas dupliquées. Les métadonnées ont été contrôlées contre PubMed et les textes officiels PMC. Les commentaires éditoriaux liés à certains articles restent distincts des corrections et des rétractations.

Chaque EvidenceLink conserve un localisateur, une section et un résumé analytique. Le résumé n'est jamais marqué comme citation verbatim ni comme déclaration directe des auteurs. Une source rétractée est bloquée ; une source corrigée conserve la notice officielle.

## Revue et assertions

La revue automatisée distingue :

- `automatedStructuralReview` ;
- `automatedProvenanceReview` ;
- `automatedConsistencyReview` ;
- `scientificHumanReview`, toujours `null` pendant P11.

Les assertions demeurent atomiques. Les valeurs littérales sont typées `LiteralValueAssertion`. La formulation T2 relative aux artefacts bSSFP à 3 T a été resserrée afin de ne conserver qu'une conclusion principale ; le compromis GRE reste absent de cette assertion au lieu d'être amalgamé.

`SUPPORTS` exige un sens directement exprimé et localisé. `QUALIFIES` conserve les limites de méthode, population, champ, pipeline ou portée spatiale. Aucun lien `MENTIONS` n'est promu.

## Corpus cumulatif et catalogue

Le corpus territorial cumulatif contient la campagne P10 et les quatre campagnes P11. Le builder accepte désormais une collection versionnée de manifestes, exécutions, tentatives et résultats tout en reproduisant byte pour byte le catalogue P10 lorsqu'un corpus à campagne unique lui est fourni.

Le catalogue P11 porte la version `1.3.0`. Il ne stocke toujours pas la connaissance scientifique elle-même : il dérive ses métriques et sa file du graphe et des traces d'exécution officielles.

## Arrêt propre

Après OEF/CMRO2, la première entrée recalculée est la radiomique. Aucun paquet préparatoire validé ne fournit encore pour ce domaine les sources localisées, assertions atomiques et EvidenceLinks exigés. P11 s'arrête donc sans cinquième campagne et sans objet partiel.

La reprise devra commencer par une passe documentaire pilotée par cette entrée de file. Elle ne devra ni choisir manuellement un autre sujet, ni contourner le catalogue, ni inventer des candidats pour atteindre un quota de campagnes.

## Commandes

- `npm run audit:continuous-territorial-wave`
- `npm run plan:continuous-territorial-wave`
- `npm run simulate:continuous-territorial-wave`
- `npm run execute:continuous-territorial-wave`
- `npm run execute:continuous-territorial-wave:check`
- `npm run replay:continuous-territorial-wave`
- `npm run rollback:continuous-territorial-wave`
- `npm run validate:continuous-territorial-wave`
- `npm run report:continuous-territorial-wave`
- `npm run generate:p11-scientific-production-report`
- `npm run generate:p11-scientific-production-report:check`

Toutes sont déterministes, non interactives, sans secret et sans publication web.

