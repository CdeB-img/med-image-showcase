# P10 — Contrat de production scientifique territoriale

## Responsabilités

La chaîne officielle reste strictement ordonnée :

1. le Scientific Territory Model définit le périmètre à couvrir ;
2. le Scientific Knowledge Catalog décrit l'état réel et calcule la file ;
3. une Scientific Campaign exécute un lot atomique issu de cette file ;
4. le Scientific Knowledge Graph reçoit uniquement les objets validés ;
5. les Scientific Projections restent des dérivations internes tant qu'une autorisation distincte ne permet pas une publication.

Le Territory Model ne stocke aucune connaissance scientifique, le catalogue ne crée aucune assertion, une campagne ne modifie pas le territoire et une projection n'invente aucune donnée absente du graphe.

## Paquets préparatoires

Un paquet préparatoire est non autoritatif. Il est chargé derrière un digest figé, inventorié sans mutation, puis chaque objet reçoit une décision traçable. Les données brutes non sélectionnées ne sont pas recopiées dans le registre officiel. Seuls leurs identifiants, types, rattachements, digests et décisions sont conservés.

Décisions possibles : acceptation, correction explicite, report pour source, contexte ou territoire insuffisant, ou rejet motivé. Un paquet de domaine sert à construire un manifeste ; il n'est jamais intégré comme objet scientifique.

## Sélection

Le domaine exécuté est le premier candidat éligible du classement déterministe. Le calcul combine la priorité du catalogue, la couverture, la provenance disponible, la cohérence des candidats, le rattachement territorial, les dépendances, la valeur de généralisation, le risque et le coût. Aucun domaine n'est choisi manuellement.

La disponibilité d'un paquet préparé ne suffit pas. Le domaine sélectionné doit encore franchir une vérification officielle de ses sources et localisateurs avant la simulation.

## Exécution atomique

Le manifeste de campagne est immuable. L'adaptateur prépare en mémoire les identités, révisions, assertions, EvidenceLinks, décisions de revue, synthèses et projections. Deux simulations successives doivent être structurellement identiques.

L'écriture scientifique s'effectue ensuite en un seul commit logique. Un échec avant ce commit ne laisse aucun objet partiel. Le fichier `execution-bundle.json` est la trace versionnée de l'exécution ; `knowledge-catalog.json` est une projection déterministe régénérable.

## Revue scientifique

Les niveaux suivants restent distincts :

- `automatedStructuralReview` ;
- `automatedProvenanceReview` ;
- `automatedConsistencyReview` ;
- `scientificHumanReview`.

Une revue automatique ne vaut jamais revue humaine. Une assertion peut être conservée dans le corpus interne avec une provenance et un état honnêtes, mais cela n'autorise ni recommandation clinique ni publication.

Les résumés analytiques ne sont pas du texte source verbatim. Le système distingue le sens directement exprimé par la source, la paraphrase analytique et une interprétation dérivée.

## Couverture et readiness

La couverture suit les états explicites `UNCOVERED`, `DISCOVERING`, `SOURCED`, `ASSERTED`, `EVIDENCED`, `SYNTHESIZED`, `PROJECTED`, `EDITORIAL_READY` et `PUBLIC_READY`.

La readiness reste multidimensionnelle : scientifique, provenance, couverture, synthèse, projection, éditoriale et publique. Aucun score agrégé opaque ne remplace ces dimensions. `PUBLIC_READY` exige une procédure distincte et ne peut jamais être obtenu automatiquement par une campagne scientifique.

## Replay et rollback

Une exécution terminée est rejouée depuis le snapshot initial et sa trace. Le catalogue, la couverture, la readiness et les digests doivent converger.

Le rollback logique permet de reconstruire le catalogue antérieur tout en préservant le manifeste et la trace. P10 ne réalise qu'un rollback en simulation : la campagne valide reste intégrée.

## Frontières protégées

L'adaptateur scientifique n'a aucune capacité de création de page, route, canonical, robots, sitemap, navigation ou rendu public. Il ne modifie ni viewer, PACS, Supabase, Auth, Stripe, logiciel métier ou `editorial-engine`.

La campagne suivante demeure uniquement dans la file. Une nouvelle passe explicite est nécessaire pour l'exécuter.
