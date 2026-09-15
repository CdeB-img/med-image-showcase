# Capacités observées avant modification produit

Baseline : `86739f3d864af68c57fff8045606a19eb0cb0eea`, branche `protocol-designer-canonical-ingestion`, fichiers suivis propres. Inspection directe du code courant, avant la première modification produit de cette mission. « Product reachable » signifie ici un chemin d'interface réellement câblé ; la qualification navigateur de la mission reste à faire et sera rapportée séparément. Aucun résultat historique n'est utilisé comme preuve d'exécution courante.

| Capacité | Classification initiale | Preuve actuelle / écart |
|---|---|---|
| CAP-01 Nouveau Research Project | IMPLEMENTED_AND_PRODUCT_REACHABLE | ProtocolDesignerDemo → ProtocolDesignerWorkspace → revue et confirmation native ; identité canonique créée après décision, pas au premier message. |
| CAP-02 Plusieurs Projects | ABSENT | Une seule session conservée sous FUNCTIONAL_RESET_STORAGE_KEY ; Recommencer supprime cette clé. |
| CAP-03 Liste / workspace | ABSENT | Surface Standard et panneau Project présents ; aucune liste des sessions/projets ouvrables. |
| CAP-04 Persistance durable | PARTIAL | session.ts persist/load via localStorage, au-delà du state React ; portée une session, erreurs d'écriture non rendues et lecture invalide remplacée silencieusement. |
| CAP-05 Fermer / rouvrir | PARTIAL | Reload de l'unique session ; pas d'action de fermeture conservatrice puis sélection parmi des Projects. |
| CAP-06 Conversation réhydratée | IMPLEMENTED_AND_PRODUCT_REACHABLE | runtimeTurns, entries, contributions, décisions, ledgers et interactions sérialisés/réhydratés dans session.ts. Validation multi-projets à faire. |
| CAP-07 Versions / supersession | IMPLEMENTED_AND_PRODUCT_REACHABLE | canonical-project-backbone, décisions natives, versions Project ; portefeuille DOC conserve projections et priorProjectionId. |
| CAP-08 Génération documentaire | IMPLEMENTED_AND_PRODUCT_REACHABLE | requestProtocolProjection → refreshFunctionalResetDocumentPortfolio → TMP → projectDocumentFromStudyTemplate. Pas de fixture dans ce chemin. |
| CAP-09 Document depuis Project courant | IMPLEMENTED_AND_PRODUCT_REACHABLE | Version/digest Project dans requestFor et source DOC ; refresh marque le document stale après adoption. |
| CAP-10 Placeholders administratifs | ABSENT | Inconnues scientifiques et « À préciser » existent ; aucune liste de champs administratifs ni instantané administratif du document. |
| CAP-11 Formulaire administratif | ABSENT | Aucun formulaire associé à la session Standard. |
| CAP-12 Profil réutilisable | ABSENT | Pas de profil utilisateur/organisation dans ce corridor ; pas de backend d'identité réutilisable trouvé dans l'application. |
| CAP-13 Profil vs rôles Project | PARTIAL | projectAuthority.actorRef/mandateRef existent pour la décision, avec DEMO_SESSION_NOT_AUTHENTICATED. Aucun rôle administratif investigateur/promoteur ni organisation réutilisable. |
| CAP-14 Régénération | PARTIAL | Génération après changement scientifique adoptée câblée ; aucune dépendance administrative, aucun formulaire pour la modifier. |
| CAP-15 DRAFT_WITH_PLACEHOLDERS | ABSENT | Readiness documentaire existante PARTIAL / READY_FOR_REVIEW ; pas de statut de complétude administrative orthogonal. |
| CAP-16 Final/submission-ready | PARTIAL | READY_FOR_REVIEW existe ; aucune approbation scientifique/réglementaire finale démontrée. Ne pas assimiler une complétion administrative à une autorisation de soumission. |
| CAP-17 Export | IMPLEMENTED_AND_PRODUCT_REACHABLE | ProtocolPreview → downloadProjection → renderProjection HTML → Blob téléchargeable. Markdown disponible dans vue détaillée. |
| CAP-18 Standard end-to-end | PARTIAL | Science/revue/Project/protocole câblés ; liste, rôles, complétion, navigation multi-projets manquants. |
| CAP-19 Navigation | PARTIAL | Conversation ↔ aperçu ↔ livrables ; absence de liste de projets et de formulaire administratif. |
| CAP-20 Recovery refresh | PARTIAL | Rechargement local de la session ; corruption/quota/conflits d'écriture non explicitement qualifiés. |

## Réutilisation retenue avant implémentation

1. Conserver le composant Standard et ses owners ; compléter sa frontière de persistance avec une clé par session, en conservant la clé historique pour la première session. Une session préparatoire peut porter un titre temporaire sans fabriquer un Research Project adopté.
2. Réutiliser la sérialisation/réhydratation existante ; conserver intégralement Project, décisions, versions, conversation, documents et historique. La liste se déduit des sessions persistées, sans base scientifique parallèle.
3. Profil local réutilisable séparé ; rôles administratifs propres à chaque projet, références d'acteur explicites et copie volontaire du profil. Les métadonnées ne passent pas dans le texte scientifique ni les requêtes providers et ne modifient pas les décisions historiques.
4. Réutiliser la famille PROTOCOL / SHORT_PROTOCOL_DRAFT et sa chaîne Project → TMP → DOC. Ajouter un instantané administratif versionné à la projection, une complétude administrative séparée de la readiness scientifique et une invalidation quand cet instantané change.
5. Réutiliser aperçu HTML, export et priorProjectionId ; améliorer la présentation du document exporté. L'Editorial Engine générique reste inchangé ; les rôles et libellés NOXIA appartiennent au consommateur.

Persistance locale pour cette démonstration, sans authentification complète, partage inter-appareils, paiement ou infrastructure SaaS. Limites à rendre visibles : stockage de ce navigateur, absence d'authentification/autorisation de soumission et S5 scientifique PARTIAL connu. Aucun corpus BLIND/SEALED utilisé.
