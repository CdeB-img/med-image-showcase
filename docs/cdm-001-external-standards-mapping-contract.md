# CDM-001 — External Standards Mapping Contract

| Champ | Valeur |
|---|---|
| Version | 1.0 |
| Statut | `OFFICIAL — EXTERNAL_MAPPING_COMPANION` |
| Niveau | `NIVEAU_3 — compagnon subordonné` |
| Autorité | CDM-001 ; PD-003 V2 TerminologyMapping |

## 1. Principe

Le modèle NOXIA précède l’échange : identité canonique interne → TerminologyMapping versionné → projection/format externe. Aucun standard, code, ressource, table ou fichier ne remplace l’identité, le sens, l’owner ou le lignage NOXIA.

Cette annexe n’implémente ni CDISC, FHIR, OMOP, LOINC, SNOMED CT, MedDRA, UCUM, ODM, DICOM, NIfTI, XML, JSON, CSV ou Parquet.

## 2. Contrat de mapping

| Élément | Exigence |
|---|---|
| noxiaId / version / type | identité source exacte |
| externalStandard / version | standard et release exacts |
| target concept/code/structure | cible localisée |
| mapping relation | exact, narrower, broader, related, partial, unmapped ou autre relation gouvernée |
| context / applicability | population, usage, domain, time, projection |
| exclusions / losses | sens non transporté et conséquences |
| transformationRef | règle/version si conversion structurelle ou d’unité |
| provenance | auteur/source/localisateur/date |
| review status | candidate, reviewed, adopted, refused, superseded selon gouvernance |
| alternatives | mappings concurrents conservés |
| supersession | ancienne version immuable |

Une égalité de nom ou code ne prouve jamais une équivalence exacte. Une correspondance partielle ne peut être renforcée pour satisfaire un export.

## 3. Standards conceptuellement examinés

| Standard/famille | Usage permis | Garde |
|---|---|---|
| LOINC | mapping de concepts/mesures Laboratory ou autres applicables | MD et contexte restent NOXIA |
| SNOMED CT | concepts cliniques/contextuels | code ≠ Variable |
| MedDRA | qualification terminologique d’événements/termes applicables | ne crée pas événement observé |
| UCUM | représentation d’unité | sémantique et valeur/unité originales conservées |
| CDISC CT | controlled terminology d’une projection | version et domaine explicites |
| CDISC SDTM-like | projection d’occurrences/source | pas source de vérité |
| CDISC ADaM-like | projection analytique/derived | variable ADaM ≠ nouvelle CanonicalVariable automatique |
| FHIR | échange de ressources/observations | resource structure ne dicte pas CDM |
| OMOP | projection vers modèle/vocabulaire | concept_id ne remplace pas NOXIA id |
| DICOM/NIfTI/SEG/SR | source/format Imaging | format ≠ modèle scientifique |

## 4. Imports et routine care

Une observation externe importée conserve source system/object/version, contexte routine care ou autre mandat, code/standard/version, méthode disponible, temps, valeur/unité originales, quality, restrictions, mapping et provenance. L’import ne prouve ni applicabilité, ni comparabilité, ni adoption Project.

Laboratory result, Imaging result, diagnosis/context, medication/exposure et repeated measurement utilisent leurs objets/relations NOXIA, puis un mapping. Aucun type externe n’est promu en objet canonique caché.

## 5. CDISC projection et lineage

Une projection collection/SDTM-like/ADaM-like conserve : CanonicalVariable id/version ; occurrences sources ; time/unit/source/method ; transformation/derivation lineage ; domain/variable externes ; terminology version ; mapping type ; limitations ; provenance ; freeze/version de projection.

Une variable analytique externe est : alias de projection si même sens ; nouvelle CanonicalVariable après décision Project si donnée unitaire réutilisable différente ; AnalysisResult si résultat inférentiel. Le format ne décide jamais.

## 6. Corrections et lifecycle

Une correction de mapping crée une nouvelle révision, conserve l’ancienne, nomme la cause et analyse l’impact sur imports, exports, datasets, analyses et documents. Un retrait d’un code ne réétiquette pas rétroactivement les occurrences historiques.

## 7. Refus et limitations

Sont refusés : design NOXIA calqué sur un standard ; code externe comme primary identity ; mapping lexical automatique ; loss non déclaré ; version de standard absente ; export qui modifie missingness, unité, méthode ou source. Aucun test de conformité externe n’est réalisé.
