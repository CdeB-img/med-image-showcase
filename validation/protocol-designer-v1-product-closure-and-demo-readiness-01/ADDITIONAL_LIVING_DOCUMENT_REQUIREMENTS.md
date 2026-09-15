Ajout important à la mission V1 en cours.

Ne pas démarrer une nouvelle mission et ne pas interrompre les corrections déjà engagées. Intégrer cette exigence à `V1_PRODUCT_CLOSURE_AND_DEMO_READINESS`.

Le document V1 ne doit pas être seulement une projection statique du Research Project.

La cible produit est un **document scientifique vivant, sourcé, versionné et modifiable conversationnellement**, sur lequel le chercheur peut continuer à travailler avec NOXIA comme avec un rédacteur scientifique compétent.

===============================================================================
1. PRINCIPE
===============================================================================

Le corridor cible devient :

CONVERSATION
→ RESEARCH PROJECT CANONIQUE
+
SCIENTIFIC KNOWLEDGE / EVIDENCE / SOURCES
+
DOMAIN OWNER CONTRIBUTIONS
→ DOCUMENT SCIENTIFIQUE
↕
CONVERSATION DOCUMENTAIRE
→ NOUVELLE VERSION DOCUMENTAIRE

Le Research Project reste canonique pour les décisions scientifiques propres à l'étude.

Les sources et connaissances restent gouvernées par leurs propriétaires scientifiques/evidence appropriés.

Le document reste une projection versionnée.

L'Editorial Engine ne devient pas propriétaire de la science.

Reuse-first obligatoire : inspecter avant toute nouvelle abstraction les capacités déjà présentes pour Knowledge, Evidence, Scientific Assertions, External Evidence/Search, sources, DOC, TMP, Project, versioning et provenance.

===============================================================================
2. MODIFICATION CONVERSATIONNELLE DU DOCUMENT
===============================================================================

Le chercheur doit pouvoir demander naturellement, par exemple :

- « développe davantage l'introduction »
- « raccourcis cette partie »
- « commence plutôt par l'enjeu de santé publique »
- « traite l'introduction sous l'angle de Bob et al. 2016 »
- « il manque Martin et al. 2021 dans l'introduction »
- « ajoute cette publication »
- « cette phrase est trop affirmative »
- « retire Dupont 2018 »
- « privilégie les études prospectives dans cette partie »
- « compare ces deux articles »
- « pourquoi n'as-tu pas utilisé cette référence ? »
- « reviens à la version précédente »
- « montre-moi ce qui a changé »

NOXIA doit résoudre :

DOCUMENT
SECTION
INTENT
SOURCE(S)
REQUESTED_TRANSFORMATION
SCIENTIFIC_IMPACT

et modifier uniquement la portée nécessaire lorsque cela est possible.

Une modification de l'introduction ne doit pas réécrire silencieusement les endpoints, la population ou la méthodologie.

===============================================================================
3. DISTINGUER ÉDITION DOCUMENTAIRE ET DÉCISION SCIENTIFIQUE
===============================================================================

Ne jamais traiter toutes les demandes comme de simples rewrites.

Exemples purement documentaires :

« raccourcis l'introduction »
« mets davantage l'accent sur la littérature mécanistique »
« cite cette revue dans le contexte »

→ modification de la projection documentaire seulement.

Exemples susceptibles de modifier le Research Project :

« finalement l'ECV devient notre critère principal »
« excluons les AVC récents »
« remplaçons l'IRM par le scanner »
« considérons cette méthode comme gold standard »

→ router vers les propriétaires scientifiques / Human Review appropriés.

Une demande rédactionnelle ne doit jamais permettre de contourner l'adoption scientifique humaine.

Ajouter des tests explicites de cette frontière.

===============================================================================
4. SOURCES DU PROJET
===============================================================================

Un chercheur doit retrouver les sources qui ont participé à sa réflexion.

Créer ou réutiliser un registre/bibliothèque de sources du Project, sans confondre préférence utilisateur et qualité scientifique.

Pour chaque source, conserver autant que possible :

- identité bibliographique ;
- titre ;
- auteurs ;
- année ;
- DOI ;
- PMID / PubMed si disponible ;
- URL fiable si disponible ;
- provenance :
  - USER_MENTIONED
  - USER_PROVIDED
  - USER_UPLOADED
  - NOXIA_RETRIEVED
  - EXISTING_CORPUS
- rôle scientifique/documentaire :
  - BACKGROUND
  - EPIDEMIOLOGY
  - MECHANISM
  - METHOD
  - ENDPOINT
  - CONTRADICTORY_EVIDENCE
  - etc.
- scientific/evidence status selon les modèles existants ;
- user relevance :
  - EXPLICIT_INTEREST
  - INFERRED_INTEREST
  - NONE
- sections/document versions utilisant la source ;
- assertions soutenues lorsque cette relation est connue.

Ne pas inventer DOI, PMID ou URL.

===============================================================================
5. INTÉRÊT UTILISATEUR POUR UNE SOURCE
===============================================================================

L'intérêt du chercheur pour une publication est un signal documentaire important mais ne constitue jamais une preuve de qualité scientifique.

Deux axes doivent rester séparés :

SCIENTIFIC_WEIGHT
≠
USER_RELEVANCE

Si le chercheur :

- cite spontanément un papier ;
- revient plusieurs fois dessus ;
- demande son interprétation ;
- construit explicitement son raisonnement à partir de celui-ci ;
- demande qu'il soit utilisé dans une section ;

alors cette source doit rester visible et son intérêt pour le chercheur doit être conservé avec provenance.

Ne pas inférer un intérêt fort à partir d'une simple mention accidentelle.

Si une meilleure preuve existe, NOXIA doit la privilégier scientifiquement.

Mais lorsque c'est compatible avec l'état des preuves, le document doit permettre au chercheur de retrouver les articles qui ont structuré sa réflexion.

Exemple :

un papier historique apprécié de l'utilisateur peut être utilisé pour le rationnel ou l'histoire du concept, tandis qu'une étude plus robuste/récente soutient l'affirmation principale.

NOXIA doit être capable d'expliquer ce choix.

===============================================================================
6. BIBLIOTHÈQUE VISIBLE DANS LE WORKSPACE
===============================================================================

Le workspace V1 doit rendre les sources du projet consultables.

Une UX simple suffit.

Au minimum distinguer conceptuellement :

- Sources apportées ou mentionnées par vous
- Sources utilisées dans les documents
- Sources suggérées / retrouvées par NOXIA

Pour chaque source, afficher lorsque disponible :

- référence courte ;
- titre ;
- auteurs / année ;
- DOI ;
- lien PubMed ou autre lien fiable ;
- où elle est utilisée dans le document.

Ne pas transformer cette exigence en chantier de gestion bibliographique complet.

L'objectif V1 est confiance, traçabilité et accès.

===============================================================================
7. SOURCE-AWARE DOCUMENT REVISION
===============================================================================

Une instruction comme :

« traite l'introduction sous l'angle de Bob et al. 2016 »

ne doit pas produire un simple changement stylistique.

Le système doit :

1. résoudre la source ;
2. déterminer ce qu'elle soutient réellement ;
3. identifier les assertions pertinentes ;
4. vérifier sa compatibilité avec les autres preuves ;
5. réorienter la section demandée ;
6. conserver les meilleures preuves nécessaires ;
7. mettre à jour les citations ;
8. mettre à jour la bibliographie ;
9. créer une nouvelle version documentaire ;
10. conserver provenance et diff.

De même :

« il manque Martin et al. 2021 »

doit conduire à la résolution/intégration de la source via les mécanismes existants autorisés, puis à une révision de la section si la source est réellement pertinente.

Ne jamais ajouter une citation décorative qui ne soutient pas le texte.

===============================================================================
8. RETRAIT D'UNE SOURCE
===============================================================================

Cas obligatoire de qualification :

« retire Dupont 2018 ».

Si Dupont 2018 est la seule preuve supportant une assertion :

NOXIA ne doit pas simplement supprimer la référence tout en conservant l'affirmation inchangée.

Il doit :

- identifier la dépendance ;
- trouver une autre preuve qualifiée si elle existe ;
- sinon reformuler ou retirer l'affirmation ;
- ou signaler explicitement que l'affirmation ne serait plus suffisamment soutenue.

===============================================================================
9. VERSIONING ET DIFF
===============================================================================

Les modifications documentaires doivent être versionnées.

Conserver au minimum :

DocumentVersion N
→ instruction utilisateur
→ sources ajoutées/retirées
→ sections modifiées
→ ProjectVersion source
→ provenance scientifique
→ timestamp
→ parent DocumentVersion

Le chercheur doit pouvoir :

- voir la version courante ;
- comprendre ce qui a changé ;
- retrouver une version précédente ;
- distinguer changement documentaire et changement scientifique du Project.

Une modification documentaire ne doit pas réécrire rétroactivement les anciennes versions.

===============================================================================
10. CONTENU SCIENTIFIQUE DU PROTOCOLE
===============================================================================

Cette capacité conversationnelle doit ensuite servir à produire un véritable protocole scientifique, et non une simple liste de champs.

Pour `DEMO_READY=YES`, le protocole doit pouvoir comporter, lorsque pertinent et suffisamment soutenu :

1. Synopsis
2. Contexte et justification scientifique
   - pathologie/problème ;
   - importance clinique ou de santé publique ;
   - données épidémiologiques pertinentes ;
   - état des connaissances ;
   - mécanismes ;
   - état des méthodes ;
   - limites de la littérature ;
   - lacune scientifique ;
   - justification de l'étude.
3. Question scientifique
4. Objectifs
5. Hypothèses
6. Design et justification
7. Population / inclusion / exclusion
8. Intervention / exposition / comparateurs
9. Critères de jugement et mesures
10. Procédures et temporalité
11. Imagerie lorsque applicable
12. Méthodologie statistique lorsqu'elle est définie
13. Limites méthodologiques
14. Éléments réglementaires pertinents
15. Références bibliographiques

Les affirmations générales doivent provenir de sources/preuves traçables.

Ne jamais inventer une prévalence, une performance, une recommandation ou une référence.

===============================================================================
11. SÉPARER DOCUMENT UTILISATEUR ET TRACE TECHNIQUE
===============================================================================

Conserver toute la provenance nécessaire.

Mais séparer :

RESEARCHER_DOCUMENT

de :

TECHNICAL_TRACE / AUDIT / PROVENANCE

Les longues listes DKP/TMP/RC01, diagnostics internes, détails des owners et limitations d'implémentation ne doivent pas constituer le corps du protocole présenté à un chercheur.

===============================================================================
12. TESTS NAVIGATEUR V1 OBLIGATOIRES
===============================================================================

Sur un Project suffisamment développé, démontrer en navigateur réel :

A.
générer un protocole avec contexte scientifique et références.

B.
demander :
« développe l'introduction en mettant davantage l'accent sur [source connue] ».

→ source correctement utilisée ;
→ introduction modifiée ;
→ autres sections stables sauf dépendances nécessaires ;
→ nouvelle version.

C.
demander d'ajouter une deuxième source pertinente.

→ source retrouvable dans la bibliothèque ;
→ citation ajoutée ;
→ bibliographie mise à jour.

D.
retirer une source qui soutient une assertion.

→ aucune assertion orpheline silencieuse.

E.
faire une demande qui ressemble à une édition mais modifie réellement la science.

→ routage vers Project/Human Review ;
→ aucune modification scientifique silencieuse du document.

F.
recharger / fermer / rouvrir.

→ Project, bibliothèque de sources et versions documentaires conservés.

G.
demander :
« qu'est-ce qui a changé depuis la version précédente ? »

→ diff intelligible.

===============================================================================
13. GATES V1
===============================================================================

Ajouter ou qualifier explicitement :

DYNAMIC_DOCUMENT_REVISION =
PASS / PARTIAL / FAIL

DOCUMENT_VS_PROJECT_INTENT_DISCRIMINATION =
PASS / PARTIAL / FAIL

PROJECT_SOURCE_LIBRARY =
PASS / PARTIAL / FAIL

USER_SOURCE_RELEVANCE_PRESERVED =
PASS / PARTIAL / FAIL

SCIENTIFIC_WEIGHT_SEPARATE_FROM_USER_PREFERENCE =
PASS / FAIL

SOURCE_RESOLUTION =
PASS / PARTIAL / FAIL

SOURCE_AWARE_REVISION =
PASS / PARTIAL / FAIL

CITATION_ASSERTION_CONSISTENCY =
PASS / PARTIAL / FAIL

DOCUMENT_VERSIONING =
PASS / PARTIAL / FAIL

DOCUMENT_DIFF =
PASS / PARTIAL / FAIL

DOCUMENT_SCIENTIFIC_NARRATIVE =
PASS / PARTIAL / FAIL

DOCUMENT_EVIDENCE_GROUNDED =
PASS / PARTIAL / FAIL

DOCUMENT_REFERENCES =
PASS / PARTIAL / FAIL

DOCUMENT_RESEARCHER_USABILITY =
PASS / PARTIAL / FAIL

`DEMO_READY=YES` est interdit si le produit sait seulement exporter une projection statique du Project.

===============================================================================
14. CONTRAINTES
===============================================================================

- reuse-first ;
- aucun nouveau moteur/router/owner sans nécessité démontrée ;
- ne pas déplacer de science dans Editorial Engine ;
- ne pas modifier silencieusement les autorités ;
- ne pas utiliser un corpus BLIND/SEALED pour guider la réparation ;
- ne pas inventer de références ;
- pas de push ;
- pas de déploiement ;
- aucun appel provider supplémentaire non autorisé par le mandat courant ;
- préserver les corrections déjà engagées et le worktree.

Continuer ensuite la mission de qualification V1 normalement.