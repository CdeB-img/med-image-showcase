# P5 — Architecture scientifique multidomaine

## Périmètre

P5 étend le socle scientifique documentaire interne de Noxia à quatre domaines indépendants : diffusion/ADC, perfusion cérébrale, caractérisation myocardique LGE/MVO/hémorragie intramyocardique et CT spectral.

Cette couche ne produit aucun texte éditorial public. Elle ne crée ni route, ni canonical, ni donnée SEO, ni entrée de sitemap. Elle n'intervient pas dans le PACS, les viewers, Supabase, Auth, Stripe, les protocoles exécutables ou les workflows métier.

## Baseline de non-régression

Le snapshot P4R est importé comme une dépendance en lecture seule. Il fige les 27 sources, 58 assertions, 84 EvidenceLinks, 10 synthèses, 12 projections, 18 contrats génériques et 10 fixtures du pilote ECV/T1. P5 calcule un digest déterministe de cet ensemble et refuse toute perte ou modification implicite.

ECV/T1 demeure un domaine comparé aux quatre corpus P5. Il ne fournit aucune classe obligatoire, aucune formule, aucun hématocrite, aucun agent de contraste ou champ magnétique imposé aux nouveaux domaines.

## Frontières de domaines

Chaque domaine possède un manifeste versionné contenant son objectif, ses concepts centraux et frontières, ses modalités, les types de sources recherchées, ses exclusions, ses requêtes de compétence, ses synthèses, ses projections et ses extensions spécifiques.

| Domaine | Distinctions structurantes | Extensions propres |
| --- | --- | --- |
| diffusion-adc | phénomène, DWI, pondération, valeur b, carte ADC, valeur ADC, finding de restriction | contexte des valeurs b, non-linéarité des gradients, métrologie sur fantôme |
| cerebral-perfusion | acquisition CT/IRM, AIF, déconvolution, CBF, CBV, MTT, Tmax, carte, segmentation, volume | modèle de déconvolution, seuil contextualisé, logiciel et génération |
| myocardial-tissue-characterization | acquisition LGE, IR/PSIR, annulation, finding LGE, MVO, hémorragie, séquence sensible au fer | rôles finding/biomarqueur/endpoint, timing, méthode de quantification |
| spectral-ct | architectures double énergie, comptage photonique, décomposition, carte d'iode, VMI, VNC, mesure iodée | architecture de plateforme, base matériau, énergie virtuelle, calibration |

## Sources et provenance

Les pages et le catalogue existants de Noxia sont audités comme inventaire terminologique uniquement. Ils ne deviennent jamais des preuves scientifiques.

Les sources externes retenues proviennent de PubMed et, lorsque disponible, de PMC. Le registre conserve PMID, PMCID, DOI, titre, liste d'auteurs, journal, date, type documentaire, état du document, disponibilité du texte, URL officielle, date de consultation et digest.

Une source limitée au résumé reste `ABSTRACT_ONLY`. Ses liens de preuve sont limités à un localisateur dans le résumé PubMed. Cette restriction apparaît dans la revue automatisée, les synthèses et la readiness.

## Assertions, extractions et EvidenceLinks

Une assertion P5 porte une seule conclusion principale. Elle conserve une identité stable, une révision, un domaine, un sujet, un prédicat, un objet ou une valeur, un contexte, une polarité, une maturité, une qualité de preuve et une décision de revue automatisée.

Chaque assertion possède au moins un EvidenceLink autre que `MENTIONS`. Chaque lien contient une source révisée, un localisateur, une extraction analytique, un type d'extraction, une applicabilité, une confiance et un statut de revue. Les résumés analytiques ne reproduisent pas de longs passages protégés.

Une interprétation dérivée expose ses étapes et n'est jamais attribuée directement aux auteurs. Le registre utilise `noxia-scientific-review-engine` et `automatedScientificReview`. `scientificHumanReview` reste `null` : aucune validation humaine n'est revendiquée.

## Contextes et inconnues

Les dimensions pertinentes sont enregistrées sans les rendre obligatoires pour tous les domaines. Une dimension non pertinente vaut `NOT_APPLICABLE`. Une dimension pertinente mais non rapportée vaut `UNKNOWN`.

Les constructeurs, modèles, logiciels et plateformes n'apparaissent que lorsqu'une source les documente ou lorsque l'assertion porte explicitement sur une comparaison de plateformes. Leur absence n'est jamais comblée par inférence.

## Métrologie

Les contrats P4R distinguent quantité, unité, méthode, observation, mesure dérivée, seuil, répétabilité, reproductibilité, corrélation, accord, biais, précision et exactitude.

P5 représente une seule formule explicite : la relation du modèle de volume central `MTT = CBV / CBF`, sourcée et limitée à ce modèle. Les trois seuils de perfusion retenus sont rattachés à une étude de calibration, une population, une modalité, un algorithme, une finalité et une unité ; aucun n'est universel.

Les unités source-documentées sont conservées : ADC en `mm²/s`, valeur b en `s/mm²`, CBF en `mL/100 g/min`, CBV en `mL/100 g`, paramètres temporels en secondes, étendue myocardique selon le contexte d'étude, T2* en millisecondes, concentration iodée en `mg I/mL`, énergie virtuelle en `keV` et atténuation en `HU`.

## Contradictions et différences

Les quatre groupes de résultats divergents ne sont pas fusionnés :

- performances ADC sur fantôme versus variabilité in vivo : différence de contexte ;
- accord entre logiciels de perfusion : différence de méthode et de workflow ;
- précision, reproductibilité et biais des méthodes de quantification LGE : différence de méthode et de pathologie ;
- quantification iodée entre plateformes : différence de plateforme, taille, dose et normalisation.

Une corrélation ne devient pas un accord. Une association pronostique ne devient pas une causalité. Une capacité technique ne devient pas une amélioration clinique.

## Requêtes, synthèses et projections

Le moteur accepte des filtres composés sur le domaine, concept, modalité, pathologie, technique, mesure, finding, constructeur, méthode, contexte, polarité, source, qualité, maturité et statut documentaire. Il sépare les assertions applicables, les assertions hors contexte, les sources en texte intégral, les sources limitées au résumé, les différences conservées et les données manquantes.

Trois synthèses déterministes sont construites par domaine. Elles sont explicitement des synthèses structurées non statistiques, sans prose publique et sans consensus dérivé du nombre de publications.

Deux projections internes sont construites par domaine. Elles contiennent uniquement des objets du graphe et restent sans route, canonical, indexation, sitemap, rendu ou navigation publique.

## Readiness

Les sept dimensions sont calculées indépendamment : `catalogReady`, `scientificReady`, `provenanceReady`, `synthesisReady`, `editorialProjectionReady`, `seoReady` et `publicPublicationReady`.

Une projection peut être prête pour une future passe éditoriale interne tout en restant non publiable. P5 maintient `seoReady=false` et `publicPublicationReady=false` pour tous les domaines et toutes les projections.

## Validation de la méthode générique

Les 18 contrats P4R sont confirmés sur cinq domaines au total. Aucun changement de contrat générique n'est nécessaire. Treize extensions restent isolées dans leur domaine, leur modalité, leur famille de mesure, leur finding ou leur technologie.

Le test d'ablation d'ECV/T1 ne révèle aucune dépendance obligatoire : les corpus P5 fonctionnent sans formule ECV, hématocrite, séquence MOLLI/SASHA, myocarde, gadolinium ou champ magnétique imposé.

## Limites et vagues suivantes

P5 est un corpus substantiel de validation, pas un recensement exhaustif de toute la littérature. La couverture n'est pas convertie en pourcentage faute de dénominateur scientifique formel.

Les lacunes majeures conservées concernent les effets de champ et de reconstruction en diffusion, les versions logicielles et seuils en perfusion, l'absence de protocole uniforme pour l'hémorragie intramyocardique, et la reproductibilité clinique interplateforme du CT spectral.

Les prochaines vagues proposées couvrent OEF/CMRO2, T2 mapping, segmentation, contrôle qualité, recalage, applications PCCT, radiomics, neuro-oncologie, imagerie hépatique et médecine nucléaire. Aucun de ces domaines n'est enrichi pendant P5.

