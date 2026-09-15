# Cartographie ciblée des capacités narratives existantes

État observé à `5c7e176a964bb4f0b3a6e8211d22d7d0ad6deb87`, avant modification produit. Les autorités scientifiques restent Knowledge/Evidence et les owners spécialisés ; DOC réalise une projection sans écrire dans le Research Project.

| Besoin | État | Réutilisation et déficit causal |
|---|---|---|
| Assertions scientifiques atomiques | EXISTS_AND_REUSABLE | Statut, polarité, contexte, limites, localisateur et EvidenceLinks existent. Les métadonnées de maturité/qualité du corpus ne sont pas conservées par l'adapter runtime. |
| Applicabilité au contexte | PARTIAL | États KE déterministes existants ; l'acquisition documentaire actuelle demande volontairement du contexte général et ne transmet pas une qualification Project assez complète. |
| Sources et identité bibliographique | EXISTS_AND_REUSABLE | Identité, révision, auteurs, année, DOI/PMID, URL et statut sont conservés dans la bibliothèque Project. |
| Priorité scientifique explicable | PARTIAL | KE-001 définit un ordre lexicographique ; le produit n'applique actuellement aucun niveau comparatif et sélectionne les assertions documentaires par ordre d'arrivée. |
| Préférence utilisateur séparée | EXISTS_AND_REUSABLE | Intérêt, historique et origine sont séparés de `scientificWeight`; cette séparation doit rester stricte. |
| Contradictions et controverses | PARTIAL | Les positions existent dans Knowledge et la bibliothèque ; la projection les exclut silencieusement au lieu de les exposer comme divergence non résolue. |
| Synthèse narrative | MISSING | La section courante ajoute une phrase d'avertissement puis concatène des assertions proches de leur forme atomique. Aucun arc problème → connaissances → limites → lacune → justification. |
| Contexte spécifique au Project | PARTIAL | Le Project et son snapshot canonique sont disponibles à la génération DOC, mais la composition narrative n'en reçoit pas la question, population, méthode et objectif sous une forme dédiée. |
| Citations et bibliographie | EXISTS_AND_REUSABLE | Liens assertion–source validés, citations visibles, références non décoratives, retrait de l'unique support et localisateurs conservés. |
| Versionnement, diff et restauration | EXISTS_AND_REUSABLE | Révision bornée à la section, nouvelle version, parent, immutabilité, diff lisible et restauration non destructive. |
| Commandes développer/raccourcir | PARTIAL | Opérations présentes mais agissent sur une liste d'assertions ; la perte sémantique de la justification n'est pas contrôlée. |
| Focalisation sur une source | PARTIAL | Ajout/focus existent ; la formulation mandatée « mets davantage en avant » n'est pas reconnue et aucune priorité scientifique explicable n'encadre le focus. |
| Explication « pourquoi cette source » | PARTIAL | Réponse actuelle compte les assertions soutenues, sans expliquer applicabilité, directness, limites ni distinction avec l'intérêt utilisateur. |
| Généralité inter-domaines | PARTIAL | P5 et un scénario neuro existent ; aucune composition narrative générique n'est qualifiée au-delà du corridor ECV actuel. |

Décision de réutilisation : enrichir les objets runtime avec les qualifications déjà présentes dans les corpus, construire une composition DOC déterministe à partir du Project et des preuves applicables, puis étendre les commandes existantes. Aucun nouveau router, owner, moteur scientifique ou score numérique.
