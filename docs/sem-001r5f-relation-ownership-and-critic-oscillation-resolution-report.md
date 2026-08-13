# SEM-001R5F — Relation Ownership and Critic Oscillation Resolution

## Statut

- Mission : audit d'ownership, réparation générique bornée et requalification homogène de SEM legacy.
- Baseline : `main` à `21298ec1fa481dc8487cc7c8034ed3b766e58e6d` ; worktree initial propre.
- Configuration parente : `SEM_LEGACY_R5E`, digest `ke1-63fa5c00c7be4ab4`, `PROPOSED_NOT_ACTIVATED`.
- Frontière : SEM reste legacy ; aucun PASS PD-003 V2 n'est revendiqué.
- Dernier état fonctionnel validé avant le STOP : `654b95c` (`SEM_LEGACY_R5P` activé pour le Holdout).
- État fonctionnel validé après fermeture strictement locale de la régression : `0bb4177`, sans nouvelle configuration ni campagne.

## 1. Autorités et preuve terminale examinées

Autorités consultées dans l'ordre imposé : index de gouvernance NOXIA, Charte fondatrice, Scientific Product Manifesto V2, Architecture Manifesto de l'Editorial Engine, PD-003 V2, compatibilité legacy, matrice d'impact moteurs, puis matrices spécialisées d'ownership et de relations.

La preuve R5E confirme :

- la Semantic Relation `rel-elem-3` relie l'élément résultat à l'élément temporel ;
- l'inventory relation `rel-3` cite les mêmes fragments dans l'ordre inverse ;
- le premier critic inverse la Semantic Relation pour suivre l'inventory ;
- le second critic rétablit la direction scientifique sans corriger l'inventory ;
- les deux cycles s'épuisent sur `CRITIC_MAX_CYCLES_EXHAUSTED`.

## 2. Audit d'ownership avant patch

| Structure | Rôle | Source de vérité ? | Owner | Mutable par critic ? | Dérivée de |
|---|---|---|---|---|---|
| Semantic Relation | Arête typée du graphe reconstruit ; porte endpoints, direction, type et polarité consommés par le modèle canonique | Oui pour la direction et le type du graphe SEM legacy | Reconstruction sémantique, puis owner SEM de la relation typée | Oui, par proposition `UPSERT_RELATION` validée et appliquée déterministiquement | Fragments et construction relationnelle explicités par l'utilisateur, avec références d'inventory |
| Inventory Relation | Preuve source de la construction relationnelle, ancrage de provenance et de coverage ; conserve identifiant, extrait exact, fragments et polarité déclarée | Oui pour l'ancrage source ; non pour imposer une direction canonique concurrente | Inventaire de reconstruction pour la provenance ; son orientation d'endpoints est subordonnée à la Semantic Relation typée | Oui pour réparer/compléter la provenance ; son orientation ne peut pas contredire l'owner sémantique | Message utilisateur ; orientation alignée sur la Semantic Relation lorsque les mêmes endpoints sont identifiables |
| Critic | Audit adversarial ; détecte, qualifie et propose des réparations bornées | n/a | Critic SEM pour le diagnostic ; l'applicateur déterministe possède la mutation effective | n/a | Messages, candidat, coverage, taxonomie et integrity report |
| Integrity Report | Validation déterministe de la source, des endpoints, de la polarité et des rôles/directions | n/a | Validateur d'intégrité SEM, en lecture seule | n/a | Candidat de reconstruction et messages utilisateur |
| Canonicalizer | Transforme les Semantic Elements/Relations typés en identités canoniques stables ; conserve les IDs d'inventory comme provenance | Oui pour la représentation canonique produite, pas pour le choix scientifique amont | Canonicalizer SEM | Non | Semantic Relation typée ; l'inventory ne fournit pas sa direction finale |

### Décision pré-patch

`RELATION_OWNERSHIP_ALREADY_DEFINED_IMPLEMENTATION_VIOLATION`

Le contrat exécutable distingue déjà les responsabilités : le canonicalizer construit exclusivement la relation canonique depuis la Semantic Relation typée et n'utilise l'inventory que comme référence de provenance et de couverture. L'implémentation viole ce contrat parce qu'elle autorise une orientation d'inventory concurrente et accepte des réparations partielles capables de faire alterner les deux représentations.

Architecture retenue : **Option A — Semantic Relation propriétaire de la direction**, avec conservation de l'inventory comme preuve source. L'orientation des endpoints d'inventory devient une projection déterministe de la relation typée lorsque la correspondance directe ou inversée des mêmes fragments est démontrée. Les relations symétriques et les couples actifs/passifs explicitement inverses restent inchangés. L'integrity report demeure un détecteur read-only et le critic demeure proposeur ; aucune normalisation lexicale ou taxonomique globale n'est autorisée.

## 3. Réparation

### A. Réparations structurelles démontrées stables

- L'ownership de direction est désormais univoque : la Semantic Relation porte la direction ; l'inventory conserve la provenance et s'aligne lorsqu'une correspondance directe ou inverse est démontrée.
- Les tests génériques de direction, non-oscillation, provenance, inverse légitime et relations non temporelles restent PASS.
- H29 a été requalifié PASS sous plusieurs configurations homogènes, dont R5P. Cela démontre la fermeture de son défaut initial d'ownership, mais ne qualifie pas le Holdout complet.
- Les Gold Frames, seuils, prompts, schémas, provider et modèle n'ont pas été modifiés pour obtenir ces résultats.

### B. Réparations ayant surtout amélioré certaines formes de sortie provider

Les réparations successives ont normalisé ou conservé : résultat contextuel, relation de remplacement, réémission exacte d'état antérieur, extrait relationnel exact, topologie de remplacement unique, identités canoniques antérieures, transition unaire, provenance fonctionnelle, topologie composite, fragments fonctionnels, répétition et provenance explicite historique. Elles ont amélioré des cas déterminés, mais aucune n'a produit une stabilité globale inter-campagnes.

### C. Inversions de statut sans modification du Gold

Dans la table suivante, `C` signifie pipeline `COMPLETE`, `C*` pipeline `COMPLETE` avec blocker post-canonique, et `F` pipeline `FAILED`. Ces états ne sont pas des PASS scientifiques isolés.

| Case | R5L | R5M | R5N | R5P | Premier étage divergent en R5P | Même intention sémantique préservée ? | Décision critic R5P | Décision guard déterministe R5P |
|---|---:|---:|---:|---:|---|---|---|---|
| H01 | F | C* | F | C* | `POST_CANONICAL_HOLDOUT_EVALUATION` | Entrée/Gold oui ; biomarqueur perdu en sortie | `ACCEPT` | `COMPLETE`, puis blocker métrique |
| H02 | C | C | C | F | `BASE_CRITIC_OR_ACCEPTANCE_GUARD` | Oui au niveau des objets ; construction fonctionnelle non convergente | `ACCEPT` | `INCOMPLETE` |
| H05 | C* | F | C | F | `BASE_CRITIC_OR_ACCEPTANCE_GUARD` | Partiellement ; relation directe non stabilisée | `REVISE → REVISE` | `INCOMPLETE` après deux cycles |
| H07 | C | C* | F | C* | `POST_CANONICAL_HOLDOUT_EVALUATION` | Entrée/Gold oui ; outcome perdu en sortie | `REVISE → ACCEPT` | `COMPLETE`, puis blocker métrique |
| H12 | C* | C* | C | F | `BASE_CRITIC_OR_ACCEPTANCE_GUARD` | Partiellement ; type puis relation non convergents | `REVISE → REVISE` | `INCOMPLETE` après deux cycles |
| H20 | C* | C | C | F | `BASE_CRITIC_OR_ACCEPTANCE_GUARD` | Oui ; désaccord de polarité relationnelle | `ACCEPT` | `INCOMPLETE` |
| H23 | F | C | F | C | Aucun en R5P | Oui | `ACCEPT` | `COMPLETE` |
| H24 | F | F | C* | F | `BASE_CRITIC_OR_ACCEPTANCE_GUARD` | Oui ; hub relationnel non reconnu pareillement | `ACCEPT` | `INCOMPLETE` |

Sur les 26 cas évaluables et les trois transitions R5L→R5M→R5N→R5P : 25 inversions sur 78 opportunités, soit 32,1 %. Elles comprennent 12 transitions `COMPLETE→FAILED` et 13 `FAILED→COMPLETE`, concernant 14 cas distincts.

### D. Variabilité attribuable au provider

- 322 départs de requêtes provider ont été consommés de R5F à R5P : 63 pour les requalifications H29 et 259 pour les quatre Holdouts complets R5L/R5M/R5N/R5P.
- 25 départs ont été des régénérations après sortie structurée invalide : 15 sur H29 et 10 sur les Holdouts complets.
- Aucun retry transitoire ni échec de capacité n'est observé sur ces quatre Holdouts complets.
- Les sorties changent malgré une demande et un Gold constants. Comme les configurations ont également évolué, ces inversions ne peuvent pas être attribuées au seul provider ; elles démontrent au minimum une sensibilité conjointe provider/règles.

### E. Divergences critic / guards déterministes

R5P termine 21/26 cas évaluables. Cinq cas échouent avant canonicalisation : H02, H05, H12, H20 et H24. H02, H20 et H24 reçoivent `ACCEPT` du critic alors qu'un guard déterministe reste `INCOMPLETE`. H05 et H12 reçoivent deux décisions `REVISE` sans atteindre un état déterministement complet. Les métriques officielles restent donc `NOT_CALCULATED`.

### F. Nouvelles règles ajoutées depuis R5F

Douze réparations génériques ont été commitées : ownership de direction, résultat/remplacement, déduplication d'état antérieur, extraits relationnels, topologie de remplacement, identités antérieures, transitions unaires, provenance fonctionnelle, topologie composite, couverture fonctionnelle/répétition, carry-forward explicite et grounding collectif de spokes/hubs. Elles sont accompagnées de 28 nouveaux tests, portant la suite SEM de 277 à 305 tests.

Au moment du premier STOP, la douzième proposition était présente dans le worktree et non validée :

| Fichier / hunk | Origine | Objectif | État au premier STOP |
|---|---|---|---|
| `relation-ownership.ts` — export du détecteur de spokes collectifs | diagnostic R5P H02/H05 | partager une définition unique du grounding collectif | non commité |
| `provider.ts` — préservation d'une provenance collective | diagnostic R5P H02/H05 | éviter de remplacer des spokes exacts par une relation déterministe concurrente | non commité |
| `coverage.ts` — hubs fonctionnels liés, spokes collectifs, cohérence active/passive | diagnostic R5P H02/H05/H12/H24 | faire converger les guards sur une même topologie générique | non commité |
| `relation-ownership.ts` — alignement de polarité sur l'inventory | diagnostic R5P H20 | résoudre un mismatch de polarité | invalide : propriétaire incorrect |

La première validation a produit `303/304 PASS`. Le test en régression était `r3-competence-repair.test.ts`, cas générique « does not turn a conditional relation into an affirmed forbidden proposition ». La cause était locale : l'inventory `AFFIRMED` écrasait une Semantic Relation correctement `CONDITIONAL`. Le hunk fautif a été retiré ; la Semantic Relation reste propriétaire de sa polarité. Un test générique dédié a été ajouté. Les autres hunks, inchangés, sont validés et committés dans `ad3bfc4`; le garde de polarité est committé dans `0bb4177`.

Validations finales strictement locales : tests ciblés `51/51 PASS`, suite SEM `305/305 PASS`, typecheck PASS, build PASS et `git diff --check` PASS.

### G. Risque de benchmark/holdout overfitting

Le risque est élevé : 11 configurations R5F→R5P, 12 réparations commitées, plusieurs relectures du même H29 et quatre exécutions complètes du même Holdout ont créé une boucle d'adaptation sur des cas désormais connus. La fréquence d'inversion de 32,1 % interdit d'interpréter un succès isolé comme une qualification. La poursuite exige un arbitrage architectural sur la séparation entre reconstruction probabiliste, critic et décisions déterministes, puis un nouveau protocole de preuve indépendant.

## 4. Configuration R5F et requalification

- Configurations créées : R5F, R5G, R5H, R5I, R5J, R5K, R5L, R5M, R5N, R5O et R5P, soit 11 configurations.
- Configuration terminale effectivement exécutée : `SEM_LEGACY_R5P`, digest `ke1-2ac79d2f15fe20bb`.
- H29 R5P : PASS homogène ; 4 opérations / 4 départs provider / 0 retry / 0 incident structuré.
- Holdout R5P : 30/30 terminaux ; 21/26 évaluables `COMPLETE` ; 5 `FAILED` ; 4 `UNRESOLVED_BY_LEGACY_MODEL` ; métriques officielles non calculées.
- Browser, downstream, push et déploiement : non exécutés.

## 5. Décision finale

`SEM_R5_QUALIFICATION_STRATEGY_REQUIRES_ARCHITECTURAL_REVIEW`

Le STOP gèle R5P et l'investigation courante. Aucun R5Q, aucun nouvel appel LLM et aucune nouvelle réparation ne sont autorisés dans cette mission.
