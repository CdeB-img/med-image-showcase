# P7 — Exécution scientifique pilotée par le catalogue

## Portée

P7 exécute exactement la première campagne non exécutée produite par le moteur P6. Le domaine n'est ni fourni à la commande, ni choisi dans ce document. Le snapshot P6, dont le digest est `503cd942c65888a4dd684f4cae8445940869152f7ce9fbdecab37f2e13e38bb5`, reste reconstructible par `createScientificKnowledgeCatalog({ includeCampaignExecutions: false })`.

La première entrée de cette file déterministe est `noxia:scientific-campaign:hepatic-imaging:01`. Son KnowledgeNode ne possède ni dépendance ni blocage. La trace conserve la campagne complète, sa justification, les objectifs de couverture et son digest de sélection.

## Extension du socle existant

Cette passe n'ajoute pas de nouvelle architecture scientifique. Les données de campagne réutilisent les contrats P4R/P5 :

- SourceIdentity et SourceRevision ;
- concept documenté et révision ;
- assertion atomique ;
- EvidenceLink et extraction localisée ;
- contexte d'applicabilité ;
- revue automatisée sans validation humaine fictive ;
- différence contextuelle ;
- synthèse structurée déterministe ;
- projection interne gardée ;
- couverture et readiness calculées par P6.

Le catalogue courant inclut un registre minimal de l'exécution. Les campagnes restantes sont toujours reconstruites par le moteur officiel à partir des KnowledgeNodes recalculés. L'imagerie hépatique n'est plus candidate car ses objectifs de source et d'assertion sont atteints et son statut est `PROJECTED`. Aucune campagne suivante n'est exécutée.

## Politique documentaire

La campagne retient uniquement cinq publications disposant d'un texte intégral officiel PMC. Les localisateurs désignent une section et, lorsque c'est pertinent, un paragraphe ou une partie de résultats. Les champs `passage` sont des résumés analytiques internes, explicitement marqués comme non verbatim.

Le document sur la PDFF de 2012 reste qualifié comme position d'auteurs. Il n'est pas promu en consensus officiel. Les recommandations ESGAR/SAR sur le fer ne s'appliquent qu'aux assertions et contextes qu'elles couvrent. Les différences 1,5 T/3 T et PDFF/fraction graisseuse de signal sont classées comme différences de contexte ou de définition, pas comme contradictions artificielles.

Les effets constructeur et logiciel restent `UNKNOWN` lorsque les passages retenus ne les documentent pas. Les insuffisances de reproductibilité intersite ou interconstructeur demeurent des lacunes.

## Déterminisme et traçabilité

`execute:scientific-campaign` produit deux artefacts mécaniques :

- le Scientific Knowledge Catalog recalculé ;
- la trace immuable avant/sélection/exécution/après.

Le mode `--check` ne modifie aucun fichier et échoue si l'un de ces artefacts est absent ou périmé. La trace possède des digests séparés pour le catalogue avant, la sélection, le résultat scientifique, le catalogue après et la transition complète.

## Commandes

- `npm run execute:scientific-campaign`
- `npm run execute:scientific-campaign:check`
- `npm run validate:scientific-campaign`
- `npm run report:scientific-campaign`
- `npm run generate:scientific-campaign-report`
- `npm run generate:scientific-campaign-report:check`

Ces commandes ne publient rien, ne créent aucune route et n'appellent aucun service SaaS.

## Garde de publication

Les synthèses et projections produites sont strictement internes : route et canonical nuls, non indexables, hors sitemap, non rendues, absentes de la navigation et sans prose publique. `seoReady` et `publicPublicationReady` restent faux même lorsque les dimensions scientifiques, de provenance, de synthèse et de projection interne deviennent prêtes.

