# DOC-001 — Document Projection & Composition Engine

## Architecture déclarative V1

**Nature :** documentation technique d’implémentation  
**Version du moteur :** 1.0.0  
**État observé :** implémenté avec limitations explicites  
**Dépôt :** `noxia-dev`  
**Commit de base observé :** `984f562`  
**Autorité :** aucune. Ce document décrit l’implémentation ; il ne remplace ni PD-003, ni RDE-001/RDE-002, ni le SOURCE-OF-TRUTH-INDEX.

## 1. Finalité

Le Document Projection Engine transforme une version gelée et explicitement autorisée d’un Research Project en une projection documentaire traçable. La projection reste une vue en lecture seule. Elle ne devient jamais :

- la vérité du projet ;
- une nouvelle source scientifique ;
- une décision humaine ;
- un protocole clinique exécutable ;
- une validation PD-011 ;
- une autorisation réglementaire ou publique.

Le Research Project reste l’unique source structurante. Chaque projection sœur doit relire cette même source ; aucune projection ne peut servir de vérité à une autre.

## 2. Architecture déclarative

Le moteur ne connaît ni le Protocol, ni un nombre de sections, ni un identifiant de section particulier. Son flux est générique :

1. une `ProjectionDefinition` déclare une famille de projection ;
2. ses `SectionDefinition` déclarent les sélections, engagements, dépendances et règles de statut ;
3. le `ProjectionPlanner` choisit une définition et vérifie le contrat d’entrée ;
4. le `SectionPlanner` interprète chaque définition sans branche métier ;
5. le `CompositionEngine` agrège les plans de section et les décisions humaines ;
6. l’Editorial Composition Engine transforme les faits sourcés en blocs éditoriaux déterministes ;
7. le Renderer produit une représentation passive Markdown ou HTML.

La définition Protocol présente dans `src/features/document-projection/contracts.ts` contient actuellement seize sections. Ce nombre est une propriété de cette configuration V1, pas un invariant du moteur. Aucun planner, compositeur, historique, diff ou renderer ne suppose seize sections.

L’extensibilité est démontrée par un test qui ajoute une projection `TEST_SUMMARY` avec une seule section en fournissant uniquement une nouvelle `ProjectionDefinition`. Aucun changement du moteur n’est requis. Les familles Synopsis, Funding, Publication et autres restent déclarées au catalogue mais refusées tant qu’elles ne possèdent pas de définition implémentée.

## 3. Contrats déclaratifs

### 3.1 ProjectionDefinition

Une définition de projection porte :

- une identité stable ;
- un type libre de projection ;
- un titre ;
- une version de définition ;
- une collection ordonnée de `SectionDefinition`.

Le type de projection n’est pas une union fermée. Une nouvelle famille peut être admise par ajout de configuration. Le registre par défaut ne contient qu’une définition implémentée : `PROTOCOL`.

### 3.2 SectionDefinition

Une définition de section porte uniquement des données interprétables :

- chemins d’objets sources ;
- objets requis et optionnels ;
- dépendances ;
- moteur spécialisé attendu, le cas échéant ;
- règle d’applicabilité ;
- règles déclaratives de faits, inconnues, limitations et contradictions ;
- règle d’engagement éditorial ;
- portes de décision humaine liées ;
- règle de générabilité et messages de décision.

Les sélections utilisent un DSL borné de chemins, patrons textuels, prédicats et politiques d’engagement. Le `SectionPlanner` interprète ce DSL. Il n’existe aucun `switch` sur les identifiants de section.

### 3.3 Niveaux d’engagement éditorial

Chaque fait transporté reste qualifié :

- `CONFIRMED` : information confirmée dans la source ;
- `ADOPTED` : objet ou décision adopté ;
- `CANDIDATE` : proposition non promue ;
- `REQUIREMENT` : exigence à traiter ;
- `UNKNOWN` : information inconnue ou partielle ;
- `LIMITATION` : frontière ou limite ;
- `CONTRADICTION` : contradiction conservée ;
- `REJECTED` : élément rejeté conservé comme tel.

Le compositeur ne peut pas augmenter ce niveau d’engagement.

## 4. Applicabilité et générabilité

L’applicabilité reste un axe indépendant :

- `APPLICABLE` ;
- `CONDITIONALLY_APPLICABLE` ;
- `NOT_APPLICABLE` ;
- `APPLICABILITY_UNKNOWN`.

Le statut de section distingue :

- `GENERATABLE` : les objets requis permettent la composition déclarée ;
- `PARTIALLY_GENERATABLE` : des objets sources défendables existent, mais des inconnues, décisions, limites ou revues spécialisées restent ouvertes ;
- `BLOCKED` : une contradiction ou une condition source explicitement bloquante interdit la complétude ;
- `NOT_GENERATABLE` : les objets sources minimaux sont absents ;
- `NOT_APPLICABLE` : la source qualifie explicitement la section comme non applicable.

L’absence d’un moteur spécialisé n’impose pas à elle seule `NOT_GENERATABLE`. Si le Research Project contient des exigences d’analyse ou de Data Management, ces sections sont `PARTIALLY_GENERATABLE` : les exigences sont projetées, tandis que le modèle statistique, le dimensionnement, le CRF, la Data Dictionary ou les procédures restent absents. Sans objet source défendable, elles deviennent `NOT_GENERATABLE`.

Une section `NOT_APPLICABLE` est neutre pour la readiness globale. Elle ne rend pas une projection partielle par sa seule non-applicabilité.

## 5. Composition éditoriale

Le moteur éditorial interne est déterministe. Il transforme uniquement les `EditorialFact` issus du plan de composition en blocs : paragraphe, liste, notice ou état vide. Chaque bloc conserve :

- son engagement ;
- ses références de provenance ;
- son identifiant déterministe.

Le texte est une formulation bornée de valeurs déjà présentes. Le moteur n’appelle aucun modèle linguistique et ne produit aucun fait scientifique, valeur numérique, protocole d’acquisition, réponse réglementaire ou décision.

Le manifeste de l’Editorial Engine externe a été utilisé comme frontière philosophique : vérité détenue par le produit, politiques explicites, déterminisme, plan distinct de l’action, absence de connaissance métier. Le paquet externe actuel gouverne surtout registre, routage, publication, navigation et artefacts éditoriaux ; il n’a pas été modifié ni détourné pour la composition documentaire scientifique.

## 6. Versionnement, historique et diff

Une projection porte séparément :

- l’identité et la version du projet source ;
- le digest du projet ;
- la version de la définition ;
- les versions du moteur, des patrons et de la politique de composition ;
- son propre identifiant, sa version et son digest.

Le rejeu du même projet avec la même définition, les mêmes politiques et le même profil retourne la projection existante. Un changement de version ou de digest du projet produit une version mineure de projection. Un changement technique de définition/patron/politique produit une version corrective.

L’historique ne mute pas les anciennes projections. Il conserve les instances et porte leur qualification historique séparément (`SUPERSEDED`, `ARCHIVED`, `INVALIDATED`, etc.). Le diff compare les sections par identité, contenu, statut, applicabilité et provenance ; il classe chaque section `ADDED`, `REMOVED`, `MODIFIED` ou `UNCHANGED`.

## 7. Renderers

Les renderers sont passifs :

- Markdown ;
- HTML autonome, échappé et `noindex`.

Ils affichent toujours statuts, applicabilité, règles de décision, inconnues, limitations, contradictions, décisions humaines et provenance. Ils ne modifient ni le projet ni la projection. Aucun DOCX, PDF ou ODT n’est produit.

## 8. Surface DOCUMENT

Le démonstrateur expose un quatrième parcours `DOCUMENT` après autorisation du handoff PRJ-001. La surface montre :

- le Protocol courant ;
- les statuts et applicabilités par section ;
- les inconnues, limitations et contradictions ;
- les décisions humaines ;
- la provenance ;
- l’historique disponible ;
- la comparaison structurelle entre versions ;
- les exports Markdown et HTML.

La surface ne possède aucun éditeur de contenu. Toute correction doit retourner vers le Research Project ou être portée par un futur objet de contribution/commentaire distinct.

## 9. Invariants techniques

- La source doit être `FROZEN_BY_HUMAN`.
- Le handoff doit être `AUTHORIZED`.
- Un Research Project refusé n’est pas composable.
- La sérialisation de la source avant et après projection doit être identique.
- Une définition doit avoir des identifiants et ordres de section uniques.
- Une projection sans définition est refusée explicitement.
- Toute absence reste une absence.
- Toute contradiction reste visible.
- Toute décision humaine reste attribuable.
- Toute provenance disponible reste transportée.
- Aucun renderer ne décide ni ne complète.

## 10. Limites V1

- Seule la `ProjectionDefinition` Protocol est enregistrée par défaut.
- Les autres familles sont déclarées mais non implémentées.
- Les moteurs Biostatistics, Data Management, Safety, Regulatory, Operations et Economics ne sont pas simulés.
- L’historique UI vit dans la session montée du démonstrateur ; le contrat d’historique du moteur est complet, mais aucune persistance documentaire dédiée n’est ajoutée en V1.
- Aucun sous-système de commentaire n’est créé ; la séparation est contractuelle et visible.
- Les deux présents documents sont des preuves techniques de niveau implémentation. Le SOURCE-OF-TRUTH-INDEX n’est pas modifié dans cette mission, conformément à l’interdiction de modifier les autorités.

