# Scientific Territory Model

## Responsabilité

Le `Scientific Territory Model` définit le champ scientifique que Noxia souhaite couvrir. Il est placé en amont du `Scientific Knowledge Catalog` sans le remplacer :

```text
Scientific Territory
  -> Scientific Knowledge Catalog
    -> Campaigns
      -> Scientific Knowledge Graph
        -> Editorial Projections
```

Le Territory Model répond à « que voulons-nous couvrir ? ». Le catalogue répond à « que couvrons-nous effectivement, avec quelles sources, assertions, preuves et projections ? ».

Le modèle ne contient donc ni source scientifique, ni assertion, ni EvidenceLink. Il ne sélectionne et n'exécute aucune campagne. Sa comparaison avec P9 est une projection en lecture seule figée par les digests du catalogue.

## Granularité

Sept niveaux sont définis :

1. `TERRITORY` : axe majeur et durable ;
2. `DOMAIN` : famille scientifique cohérente ;
3. `SUBDOMAIN` : subdivision autonome ;
4. `KNOWLEDGE_AREA` : espace délimité dans lequel le catalogue peut créer des nœuds ;
5. `SCIENTIFIC_CONCEPT` ;
6. `SPECIALIZED_CONCEPT` ;
7. `ATOMIC_CONCEPT`.

L'énumération est exhaustive jusqu'au niveau `KNOWLEDGE_AREA`. Les trois derniers niveaux restent ouverts et appartiennent au Scientific Knowledge Catalog. Ce choix empêche le Territory Model de devenir un second Knowledge Graph.

## Axes couverts

Les dix territoires explicites sont :

- modalités et acquisition ;
- anatomie, organes et spécialités ;
- pathologies et applications cliniques ;
- mesures, biomarqueurs et quantification ;
- physique, instrumentation et technologies ;
- traitement d'image, informatique scientifique et IA ;
- qualité, sécurité, standards et gouvernance ;
- informatique d'imagerie et workflows documentaires ;
- radiologie interventionnelle et guidage par l'image ;
- recherche, preuves, éducation et services.

La structuration s'aligne sur des référentiels institutionnels de périmètre : le curriculum de radiologie de l'ESR, les familles de paramètres et standards de l'ACR, les parties du standard DICOM et les profils du domaine Radiology d'IHE. Ces références ont servi à contrôler la couverture structurelle ; elles ne sont pas enregistrées comme sources scientifiques et ne soutiennent aucune assertion.

## Appartenances multiples

La hiérarchie principale est un DAG strict jusqu'au niveau Knowledge Area. Les appartenances transverses sont enregistrées séparément avec `ALSO_BELONGS_TO`. Ainsi, une mesure telle que l'espace extracellulaire peut appartenir simultanément aux axes quantification, IRM et imagerie cardiaque sans duplication d'identité ni parent artificiel unique.

Les dimensions transverses — constructeurs, champ, énergie, contraste, reconstruction, quantification, métrologie, reproductibilité, interopérabilité, terminologie, population, logiciels, provenance, IA, sécurité ou durabilité — ne sont la propriété d'aucun domaine clinique.

## Couverture et catalogue

Les états du territoire sont :

- `COVERED` ;
- `PARTIALLY_COVERED` ;
- `NOT_COVERED` ;
- `PLANNED` ;
- `OUT_OF_SCOPE`.

Ils sont calculés dans le livrable à partir d'identités exactes du catalogue P9. Un domaine du catalogue peut être rattaché à plusieurs branches du territoire. Cette multiplicité est attendue et ne constitue pas un doublon.

Les domaines P9 `quality-control`, `radiomics`, `registration` et `segmentation` restent des `Domain` dans le catalogue. Le Territory Model observe aussi leur rôle transverse. Cette différence n'est ni corrigée ni migrée automatiquement.

## Frontières

Le cœur inclus couvre l'imagerie humaine diagnostique, quantitative, interventionnelle et moléculaire, ainsi que la physique, la qualité, la sécurité, les standards, l'informatique et l'IA documentaires.

Les protocoles, workflows, équipements, constructeurs et Core Labs ne sont admis que comme objets documentaires. Sont notamment exclus :

- parc installé et licences ;
- logique PACS ou viewer opérationnelle ;
- workflows applicatifs et affectations CoreLab ;
- datasets internes et entraînement IA ;
- moteur de recommandation clinique ;
- imagerie vétérinaire ou industrielle ;
- anatomopathologie, génomique et microscopie autonomes.

Radiothérapie, histopathologie, génomique, microscopie et théranostique sont des zones adjacentes conditionnelles : seules leurs interfaces démontrables avec l'imagerie sont admises.

## Projections

Le modèle associe uniquement des capacités virtuelles : glossaire, guide, FAQ, état des connaissances, comparaison, tutoriel, référence, documentation, cas d'étude, arbre documentaire, workflow documentaire, comparateur et API.

`CaseStudy`, `DecisionTree` et `AIAssistant` exigent une gouvernance séparée. Aucun arbre ne peut devenir une recommandation clinique automatisée et aucune capacité ne constitue une autorisation de publication.

## Roadmap

La roadmap ordonne des familles : fondations, cœur clinique, quantification, calcul/IA, interventionnel et futur. Elle ne sélectionne aucun KnowledgeNode. Le Scientific Knowledge Catalog conserve seul le droit de produire un manifeste à partir des priorités, dépendances et lacunes observées.

Un nouveau domaine doit suivre cette séquence :

1. décision de frontière et révision du Territory Model ;
2. création ou alignement du KnowledgeNode dans le catalogue ;
3. calcul de couverture et de priorité par le catalogue ;
4. sélection automatique par le Campaign Planner ;
5. enrichissement du Scientific Knowledge Graph ;
6. projection interne, puis readiness éditoriale séparée.

## Estimations

Les estimations sont des fourchettes déterministes fondées sur le nombre de nœuds structurels explicites. Elles n'utilisent ni volume de recherche, ni quantité supposée de publications, ni résultats scientifiques inventés.

Elles servent à dimensionner le programme, pas à imposer un quota de KnowledgeNodes ou de pages.

## Commandes

```text
npm run build:scientific-territory
npm run build:scientific-territory:check
npm run validate:scientific-territory
npm run report:scientific-territory
```

Ces commandes lisent le Scientific Knowledge Catalog mais ne le modifient jamais.
