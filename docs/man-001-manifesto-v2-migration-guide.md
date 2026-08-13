# MAN-001 — Migration Guide V1 → V2

**Statut :** OFFICIAL — guide de transition constitutionnelle  
**Niveau :** NIVEAU_3 — document d’accompagnement, sans autorité concurrente  
**Version :** 1.0  
**Date :** 12 août 2026  
**Autorité supérieure :** Scientific Product Manifesto V2.0  
**Portée :** transition documentaire et conceptuelle ; aucune migration de données ou de moteur

## 1. Décision de migration

La V2 remplace la V1 comme constitution scientifique spécialisée à sa date d’adoption. La V1 reste conservée, consultable et applicable à l’interprétation des artefacts historiquement produits sous son autorité.

Cette migration est une **migration de cadre conceptuel**, non une conversion automatique. Elle autorise des travaux normatifs ultérieurs ; elle n’admet aucun objet PD-003, n’altère aucun moteur et ne transforme aucun artefact legacy.

## 2. Changement central

La chaîne V1 :

> Phénomène biologique → Biomarqueur → Modalité ou Séquence

devient en V2 :

> Knowledge → Scientific Models → Observable Properties → Measurement Definitions → Biomarker Roles → Research Project → Canonical Variables → Variable Occurrences → Analyses → Documents.

Les flèches V2 représentent des handoffs de références et de responsabilités. Elles ne représentent ni une promotion automatique, ni une chaîne d’ownership.

## 3. Règles de compatibilité historique

1. Aucun artefact V1 n’est réécrit pour donner l’impression qu’il distinguait déjà Observable Property et Biomarker Role.
2. Un Biomarqueur V1 reste interprétable comme un composé legacy pouvant réunir observable, rôle et parfois méthode.
3. Aucun Biomarqueur V1 n’est scindé automatiquement.
4. Une scission future exige un mapping explicite, une version, une provenance, un auteur, un domaine et un statut de revue.
5. Une Variable V1 n’est interprétée comme définition que si son contenu permet cette lecture sans perte.
6. Une valeur mêlée à une définition n’est isolée que si sa provenance est démontrée.
7. Des Variables V1 portant des temps différents ne sont jamais fusionnées automatiquement.
8. Le terme Observation est qualifié par son contexte ; toute ambiguïté non résolue reste visible.
9. Les identités Imaging, Knowledge, Project, REG, TMP, DOC et VAL existantes sont conservées.
10. Toute conversion interdit l’augmentation de preuve, la suppression d’une contradiction ou la création d’une décision implicite.

## 4. Statuts de transition

| Statut | Signification |
|---|---|
| `V1_HISTORICAL` | artefact conservé et interprété selon V1 |
| `V1_COMPOSITE_LEGACY` | concept V1 réunissant plusieurs responsabilités désormais séparées |
| `MAPPING_REQUIRED` | correspondance future nécessaire, aucune conversion admise |
| `V2_CONCEPTUAL_ONLY` | principe adopté par le manifeste mais absent de PD-003 |
| `V2_NORMATIVE_READY` | future référence métier admise et indexée |
| `V2_IMPLEMENTATION_PENDING` | contrat normatif présent, implémentation absente |
| `V2_EVALUATION_PENDING` | implémentation présente, qualification requise |
| `V2_QUALIFIED` | conformité démontrée dans un périmètre explicitement évalué |

La présente mission atteint uniquement `V2_CONCEPTUAL_ONLY` pour les nouveaux concepts.

## 5. Séquence de transition obligatoire

### Phase 0 — Préserver V1

- conserver le DOCX maître et le PDF V1 sans modification ;
- conserver leur version, leur date et leur période d’autorité ;
- conserver les décisions, rapports et implémentations historiques qui les référencent.

### Phase 1 — Adopter la constitution V2

- produire le DOCX maître V2 et son PDF dérivé ;
- produire les cinq documents d’accompagnement MAN-001 ;
- enregistrer l’adoption, la supersession et les limites dans le SOURCE-OF-TRUTH-INDEX.

### Phase 2 — Faire évoluer le modèle métier

Mission séparée obligatoire :

- réviser PD-003 en version majeure ;
- arbitrer les objets, rôles et relations ;
- réaliser un crosswalk exhaustif des objets courants ;
- définir les cycles, versions, owners et invariants ;
- mettre à jour l’index dans la même décision.

Tant que cette phase n’est pas achevée, PD-003 courant reste l’autorité métier.

### Phase 3 — Définir OBS et CDM

Deux missions normatives distinctes doivent :

- définir OBS sans recopier Knowledge ni absorber Imaging ;
- définir CDM sans posséder la vérité scientifique ;
- qualifier le terme Observation ;
- séparer définition de Variable et Variable Occurrence ;
- traiter les sources, temps, Biospecimens et résultats analytiques.

### Phase 4 — Adapter les moteurs existants

Chaque owner produit une analyse de conformité locale, une nouvelle version si nécessaire, des adaptateurs temporaires explicites et des tests de non-régression. Aucun moteur aval ne modifie l’amont.

### Phase 5 — Migrer les artefacts si autorisé

Une migration réelle exige : inventaire, politique de mapping, dry-run, conflits visibles, rollback, conservation historique et décision humaine. Elle ne peut être déduite du présent guide.

### Phase 6 — Évaluer

Les implémentations V2 devront démontrer : exactitude, fidélité des handoffs, conservation des inconnues et contradictions, identité canonique, provenance, compréhension des projections et absence de promotion automatique. Un résultat technique ne vaut pas PASS PD-011.

## 6. Conversions interdites

| Conversion implicite | Motif du refus |
|---|---|
| assertion Knowledge → Scientific Model adopté | supprime alternatives et décision humaine |
| Phénomène → Observable Property | confond ce qui est expliqué et ce qui est approché |
| Observable Property → Biomarker Role | la mesurabilité ne prouve pas la validité d’indicateur |
| Measurement Definition → méthode choisie | le Project doit décider |
| Data Need → Canonical Variable | plusieurs opérationnalisations peuvent exister |
| Canonical Variable → Variable Occurrence | une définition ne produit pas une valeur |
| routine care → study mandated | la consommation ne change pas le mandat d’origine |
| Biospecimen → Variable | la ressource matérielle n’est pas une propriété mesurée |
| résultat → interprétation | le contexte et l’humain restent nécessaires |
| code externe → identité NOXIA | le mapping ne remplace pas le modèle interne |
| document → source de vérité | une projection reste passive |

## 7. Stratégie des adaptateurs temporaires

Un adaptateur legacy peut exposer une chaîne V1 sous V2 uniquement s’il :

- la marque `V1_COMPOSITE_LEGACY` ;
- conserve l’identifiant et la version sources ;
- ne crée aucun nouvel objet V2 ;
- n’infère pas la séparation Observable Property–Biomarker Role ;
- transporte les limites et ambiguïtés ;
- refuse toute promotion automatique ;
- possède une date de retrait et un owner.

## 8. Critères de sortie de migration

La transition ne peut être déclarée achevée que lorsque :

1. PD-003 révisé est admis ;
2. OBS et CDM possèdent leurs contrats normatifs ;
3. les owners Data Management et Biostatistics sont explicites ;
4. les artefacts legacy sont inventoriés et mappés ou maintenus comme legacy ;
5. les moteurs consommateurs sont versionnés ;
6. les handoffs sont validés sans perte de sens ;
7. les projections restent fidèles ;
8. les évaluations requises sont terminées ;
9. l’index décrit la réalité documentaire ;
10. aucune ambiguïté bloquante n’est masquée.

## 9. Limites

- Aucun mapping réel n’est produit.
- Aucun objet V1 n’est converti.
- Aucun moteur n’est modifié.
- Aucun statut d’implémentation ou de qualification V2 n’est revendiqué.
- Le calendrier et les owners des phases ultérieures exigent des décisions séparées.

