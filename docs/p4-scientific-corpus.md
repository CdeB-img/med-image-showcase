# P4 — Architecture du corpus scientifique ECV et mapping T1

Document interne. Il décrit un corpus de validation du Knowledge Graph et ne constitue ni une page publique, ni un avis clinique, ni une recommandation destinée aux patients ou aux professionnels.

## Périmètre

P4 couvre le mapping T1 myocardique, l'ECV myocardique en IRM, une branche CT-ECV distincte, des méthodes d'acquisition sélectionnées, des facteurs techniques, la reproductibilité et quelques applications cliniques documentées. Il ne couvre pas le logiciel métier Noxia, le PACS, les viewers, des protocoles exécutables, les équipements installés, le Core Lab opérationnel, Supabase, l'entraînement IA ou un moteur de recommandation.

Les 118 concepts et 93 relations de P3M-Web restent préservés. P4 ajoute des identités scientifiques nécessaires au corpus sans requalifier silencieusement les concepts historiques ambigus.

## Stratégie documentaire

Le dépôt a été audité en premier. Ses pages contiennent des pistes éditoriales et bibliographiques, mais leurs affirmations sans localisateur scientifique précis ne sont pas utilisées comme preuve primaire.

Les sources externes sont sélectionnées dans cet ordre : recommandations ou consensus officiels, documents de standardisation, revues systématiques, études multicentriques, validations techniques et études cliniques originales. Une source n'est retenue que si elle alimente au moins une assertion ou une relation documentaire précisément localisée.

### Critères d'inclusion

- identité bibliographique vérifiable ;
- DOI ou PMID lorsqu'il existe ;
- résultat, méthode, limite ou recommandation exploitable ;
- localisateur suffisamment précis ;
- pertinence directe pour ECV, T1 mapping, une méthode, un contexte ou le cycle de vie documentaire audité ;
- distinction possible entre déclaration directe, résultat numérique, méthode, limite, recommandation et interprétation.

### Critères d'exclusion

- page commerciale, blog, forum, Wikipédia ou contenu généré par IA ;
- résumé sans méthode exploitable ;
- revue secondaire redondante sans assertion unique nécessaire ;
- méta-analyse dont l'intégration pousserait le corpus à importer des seuils groupés non contextualisés ;
- source sans assertion exploitable ;
- résultat hors périmètre logiciel ou produit.

## Provenance

Une `SourceIdentity` porte l'identité stable du document. Une `SourceRevision` porte sa version, son statut, sa date, ses identifiants, son URL, sa date de consultation, son digest bibliographique et une qualité multidimensionnelle. Le digest ne prétend pas être l'empreinte du texte intégral lorsqu'il ne couvre que les métadonnées bibliographiques.

Chaque `EvidenceLink` relie une révision de source à une révision d'assertion. Il conserve le type de relation, un localisateur, un résumé analytique bref, le contexte d'applicabilité, la qualité de preuve, l'extraction et le type de revue. `MENTIONS` n'est jamais converti en `SUPPORTS`.

## Extraction et granularité

Une assertion contient une seule conclusion principale. Les extractions sont classées comme `DIRECT_STATEMENT`, `NUMERIC_RESULT`, `METHOD_DESCRIPTION`, `LIMITATION`, `RECOMMENDATION_TEXT`, `AUTHOR_INTERPRETATION` ou `DERIVED_INTERPRETATION`.

Une interprétation dérivée est explicitement signalée et n'est pas présentée comme une phrase directe des auteurs. Le corpus conserve des résumés analytiques courts plutôt que de longs extraits protégés.

## Modèle quantitatif ECV

La branche IRM représente séparément :

- T1 myocardique natif ;
- T1 myocardique post-contraste ;
- T1 sanguin natif ;
- T1 sanguin post-contraste ;
- R1 et variation de R1 ;
- hématocrite ;
- agent extracellulaire à base de gadolinium ;
- méthode de mapping et contexte d'acquisition.

La branche CT single-energy représente les atténuations myocardiques et sanguines avant et après contraste iodé. La branche CT spectral utilise des densités iodées. Ces branches n'utilisent pas la formule IRM et ne partagent aucun seuil implicite avec elle.

Aucune valeur normale, plage de référence ou limite diagnostique n'est créée dans P4.

## Catégories ontologiques

P4 distingue `SequenceFamily`, `AcquisitionMethod`, `MeasurementMethod`, `MeasurementDefinition`, `Observation`, `DerivedMeasurement`, `Biomarker`, `Finding` et `Disease`. Les identités historiques T1 mapping, T1, ECV, LGE, MVO et hémorragie intramyocardique ne sont pas réécrites. Une proposition de classe est conservée comme décision différée lorsqu'une migration sûre dépasse le corpus pilote.

## Consensus, convergence et contradictions

Le moteur ne compte pas les publications pour fabriquer un consensus. `CURRENT_CONSENSUS` exige une source officielle sélectionnée, une date et une version connues, un contexte compatible et l'absence, dans le corpus sélectionné, d'une réfutation officielle équivalente plus récente.

Les autres états sont `CONVERGENCE`, `PARTIAL_CONVERGENCE`, `CONTEXT_DEPENDENT_CONVERGENCE`, `CONTRADICTION`, `INSUFFICIENT_EVIDENCE`, `OPEN_QUESTION`, `HISTORICAL_POSITION` et `SUPERSEDED_POSITION`.

La divergence sur l'hématocrite synthétique est conservée : une cohorte locale rapporte un accord, tandis qu'une cohorte 3 T rapporte des erreurs de classification. Les contextes empêchent une résolution artificielle.

## Moteur de requête

Les filtres couvrent concept, modalité, maladie, méthode, séquence, champ magnétique, constructeur, modèle, logiciel, population, type de source, qualité de preuve, maturité, polarité, statut documentaire et période.

Un filtre constructeur, modèle ou logiciel ne produit aucun résultat si la source ne rapporte pas ce contexte. La réponse sépare les assertions applicables, les assertions hors contexte, les sources primaires, les sources secondaires, les contradictions et les données absentes. Les sorties sont déterministes et n'emploient aucune approximation.

## Readiness

Sept états sont calculés indépendamment :

- `catalogReady` ;
- `scientificReady` ;
- `provenanceReady` ;
- `synthesisReady` ;
- `editorialProjectionReady` ;
- `seoReady` ;
- `publicPublicationReady`.

Chaque état possède ses propres champs requis, conditions, erreurs bloquantes, avertissements et justification. Aucun score global n'est utilisé. Dans P4, les projections internes peuvent être scientificReady et synthesisReady, mais aucune n'est editorialProjectionReady, seoReady ou publicPublicationReady.

## Revue

Le processus technique utilise l'identité `noxia-scientific-corpus-builder` et le type `automatedStructuralReview`. Il vérifie la forme, l'atomicité, l'identité de la source, le localisateur et les gardes de publication.

Il ne constitue pas une `scientificHumanReview`. Aucune assertion n'est automatiquement déclarée `VERIFIED`. Les décisions de revue conservent le statut précédent, le nouveau statut, la justification, la portée et les réserves.

## Projections internes

Douze fixtures structurées vérifient l'exploitabilité : ECV, T1 mapping, MOLLI, SASHA, CT-ECV, états des connaissances ECV, myocardite et infarctus, comparaisons MOLLI/SASHA et IRM/CT, limites techniques et reproductibilité.

Chaque fixture dérive uniquement du graphe. Elle a une route et un canonical nuls, n'est ni rendue, ni indexable, ni présente dans le sitemap ou la navigation, et ne contient aucune prose publique.

## Limites

- aucune revue scientifique humaine ;
- auteurs conservés sous forme de citations abrégées vérifiées, non comme listes complètes ;
- certaines extractions limitées au résumé structuré PubMed ;
- reproductibilité CT-ECV intersite absente ;
- effets de constructeur, modèle et version logicielle non généralisables à partir du corpus ;
- applications cliniques sélectives ;
- absence volontaire de seuils universels ;
- aucune méta-analyse statistique réalisée.

## Généralisation

Les contrats d'identité, version, assertion, preuve, contexte, mesure, requête, synthèse, readiness et projection sont génériques. Les formules, entrées et confondants restent propres à la modalité et au biomarqueur.

Les futurs domaines — perfusion cérébrale, diffusion, ADC, Tmax, CBF, CBV, OEF, CMRO2, LGE, T2 mapping, MVO, hémorragie intramyocardique et CT spectral — doivent réutiliser les contrats sans importer les formules ou hypothèses ECV/T1. Ils ne sont pas enrichis pendant P4.
