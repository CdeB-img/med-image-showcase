# Protocol Designer — historique P0 et démonstrateur P-WEB-02

## Statut

- Référentiel PD-007 : `READY_FOR_IMPLEMENTATION`
- Protocol Designer : `DEMONSTRATOR_IMPLEMENTED`
- Évaluation scientifique : `NOT_EVALUATED_UNDER_PD011`
- Pilote réel : `NOT_READY_FOR_REAL_PILOT`

La frontière P0 a été préservée jusqu’à l’autorisation P-WEB-02 du 3 août 2026. P-WEB-02 autorise désormais une interface locale déterministe, limitée à trois projections documentaires. La fixture Fabry P0 reste inchangée et n’est jamais importée par le démonstrateur.

Les contrats P0 ne sont ni supprimés ni assouplis : leur objet demeure le candidat Fabry, qui reste strictement technique, non implémenté, non routé, non indexé et dépourvu de sortie scientifique. Les tests historiques sont conservés avec ce périmètre explicite afin que l’autorisation P-WEB-02 ne soit pas interprétée comme une activation du candidat.

Ce fichier est une note locale d’implémentation. Il n’est pas un document normatif et ne modifie pas la gouvernance documentaire de NOXIA.

## Autorités

- PD-003 est l’unique autorité sur les objets métier et leurs relations.
- PD-007 est l’autorité sur la tranche verticale et l’ordre des passes P0 à P9.
- PD-009 est l’unique autorité sur la navigation scientifique et la sélection de la prochaine action.
- PD-011 est l’unique autorité sur l’évaluation scientifique et sur tout PASS de publication.
- Les rôles PD-005 fournissent des capacités d’exécution. Aucun rôle PD-005 ne possède la prochaine action scientifique.

Les gates PD-007 sont des évaluations dérivées. `Gate` et `Stop` ne doivent jamais devenir des objets métier concurrents de PD-003. Un statut de gate PD-007 ne doit jamais être présenté comme un PASS PD-011.

## Frontière P0 historique

Avant P-WEB-02, ce répertoire ne devait contenir que :

- la présente note de frontière ;
- des fixtures techniques sans vérité scientifique exécutable ;
- des tests de frontière.

Il ne doit contenir aucun code de production, appel réseau, interface, route, moteur de navigation, objet métier, paquet de connaissances, recommandation, protocole, ordre de séquences, preuve scientifique ni résultat préencodé.

La fixture Fabry P0 conserve uniquement un identifiant technique, l’intention exacte du cas vertical et le statut `NOT_IMPLEMENTED`. Elle ne constitue pas et ne simule pas un paquet `C-KNOW`.

## Surfaces protégées

P0 ne modifie pas :

- les routes et pages publiques ;
- l’Explorateur scientifique ;
- `sitemap.xml`, `robots.txt`, `llms.txt` et les métadonnées SEO ;
- l’intégration locale de l’Editorial Engine ni le dépôt externe `editorial-engine` ;
- le PACS, DICOM, PixelData et les viewers ;
- les Reasoning Books ;
- PD-003, PD-004, PD-005, PD-007, PD-009, PD-011 et le SOURCE-OF-TRUTH-INDEX ;
- la publication et le déploiement.

La non-activation de Fabry est désormais garantie par l’absence d’import de sa fixture, par les tests de non-régression et par l’absence de scénario Fabry dans les trois projections admises.

## Frontière P-WEB-02

Le démonstrateur :

- utilise uniquement des fixtures locales dérivées des RB-003 v1.0, RB-004 v1.1 et RB-005 v1.0 ;
- n’accède à aucun réseau, service scientifique, document dynamique ou graphe de connaissances ;
- ne génère aucun protocole, seuil clinique, ordre de séquences ou recommandation ;
- ne prend aucune décision automatique ;
- conserve l’état dans la session du navigateur et l’efface sur confirmation explicite ;
- distingue l’admission documentaire de toute validation scientifique PD-011 ou activation produit.

## Ordre cible gouverné par PD-007

1. P1 — noyau métier V1 ;
2. P2 — paquet Fabry gouverné ;
3. P3 — navigation PD-009, état et gates dérivés ;
4. P4 — exécution des rôles par contrats ;
5. P5 — première démonstration visible ;
6. P6 — science, biomarqueurs et options ;
7. P7 — décision, revue et rapport ;
8. P8 — version, trace et impact ;
9. P9 — admission interne de la tranche, sans revendication de PASS PD-011.

Cet ordre reste une cible de travail. Le démonstrateur P-WEB-02 ne prétend pas implémenter le moteur scientifique complet de ces passes.

## Validation reproductible

Depuis la racine du dépôt :

```sh
npm run typecheck
npm test
npm run build
```

Baseline P0 observée le 2 août 2026 sur `main`, révision `bdf670d519c70422ca037a8344aba0fde3393986` :

- typecheck : réussite ;
- tests : 496 réussites sur 499 ;
- build : réussite ;
- trois échecs de tests préexistants vérifient uniquement que le dépôt externe `editorial-engine` est propre, alors qu’il comportait déjà 30 fichiers suivis modifiés et 12 fichiers non suivis ;
- ces trois échecs externes ne doivent pas être corrigés depuis ce périmètre.
