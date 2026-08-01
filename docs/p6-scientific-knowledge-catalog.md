# P6 — Scientific Knowledge Catalog

Le Scientific Knowledge Catalog est la couche interne de pilotage des futurs enrichissements scientifiques Noxia. Il référence les concepts, leurs relations de catalogue, leur couverture, leurs capacités de projection virtuelles et leurs priorités. Il ne duplique ni les assertions, ni les preuves, ni les synthèses du Scientific Knowledge Graph.

## Frontière

Le périmètre est exhaustif dans ce que le dépôt permet de démontrer : identités historiques P3M-Web, concepts P4R et P5, domaines enrichis et dix vagues futures explicitement décidées dans P5. Le catalogue ne prétend pas décrire tout le savoir radiologique mondial. Un nouveau domaine doit d'abord devenir un `KnowledgeNode` avant tout enrichissement ou projection.

P6 ne crée aucune assertion, source scientifique, page, route, donnée SEO ou autorisation de publication.

Le module de gouvernance rejette explicitement tout enrichissement dont le `nodeId` n'existe pas dans le catalogue. Une projection doit en plus déclarer une capacité connue et disponible pour le nœud. L'autorisation obtenue reste strictement interne et ne vaut jamais autorisation de publication.

## KnowledgeNode

Chaque nœud possède une identité stable, un `nodeType`, des désignations, un état unique, des relations explicites, une couverture multidimensionnelle, une priorité calculée, des capacités de projection virtuelles et des dates de revue. Les appartenances multiples sont conservées ; le catalogue est un DAG et non un arbre imposé.

Les champs `parents`, `children` et `related` organisent le territoire. Les champs `prerequisites`, `dependencies`, `relatedDomains`, `successors`, `replacements`, `supersededBy` et `blockingNodes` rendent les dépendances explicites. Une liste vide signifie qu'aucune dépendance de catalogue n'est démontrée ; elle ne doit pas être remplie par inférence scientifique.

## Moteurs dérivés

- Le coverage engine calcule séparément les couvertures source, assertion, scientifique, éditoriale et de projection.
- Le projection engine évalue les quatorze capacités demandées, conserve les blocages et n'émet aucun artefact.
- Le priority engine expose ses sept composantes, ses poids et l'origine du signal d'intérêt utilisateur. Aucun override manuel n'est accepté.
- Le campaign engine sélectionne uniquement les nœuds HIGH non prêts, avec couvertures source et assertion insuffisantes. Il ne choisit aucun domaine à partir d'un prompt et ne publie rien.

## Cycle de vie

Le registre supporte import, export, fusion, split, renommage, dépréciation, archivage et migration. La fusion et le split conservent les anciennes identités comme `DEPRECATED`. L'archivage marque `OBSOLETE` et conserve l'enregistrement. Toutes les opérations acceptent une date explicite pour rester déterministes.

## Commandes

- `npm run build:knowledge-catalog`
- `npm run build:knowledge-catalog:check`
- `npm run validate:knowledge-catalog`
- `npm run report:knowledge-catalog`
- `npm run plan:scientific-campaigns`
- `npm run generate:knowledge-catalog-report`

Ces commandes sont locales, déterministes, sans secrets et sans mutation d'une surface publique.
