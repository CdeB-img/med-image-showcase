# Activation explicite du contrat serveur

Le mode normal ne reçoit aucune nouvelle politique. Sans policy JSON, un canary conserve le contrat historique mono-session, soft 1 USD et hard 6 USD.

Pour une campagne distincte, le serveur doit recevoir ensemble :

- `PROTOCOL_DESIGNER_LIVE_CANARY=SINGLE_ATTEMPT_FAIL_CLOSED` ;
- `PROTOCOL_DESIGNER_CANARY_ID` : identité de la nouvelle campagne ;
- `PROTOCOL_DESIGNER_CAMPAIGN_POLICY` : JSON complet créé par `createCanaryCampaignPolicy`, avec la même identité, `maxSessions`, `measuredSoftStopUsd`, `absoluteHardBoundUsd`, `singleAttemptPolicy`, `allowedProviderModels`, date UTC canonique `createdAt` et `policyDigest`.

Le helper valide un maximum de cinq sessions, un soft positif au plus égal à 3 USD et un hard positif au plus égal à 10 USD, avec soft<=hard. Les modèles doivent provenir du contrat déjà qualifié. Le digest fourni doit être exact ; aucune configuration partielle ou invalide ne revient silencieusement au mode normal. Le body du navigateur ne fournit jamais cette policy.

La configuration utilisée pour la simulation est dans `dry-run-sealed/receipt.json` : `synthetic-qualified-multisession`, cinq sessions, 3/10, avec date et digest explicites. Ce reçu ne sert pas de configuration live. Aucun environnement utilisateur ni paramètre de lancement persistant n’a été installé ou modifié.

Le serveur existant dérive la racine `canary-<campaignId>` dans le stockage privé configuré. La policy est persistée avant la première préparation et contrôlée lors de chaque admission. Les identités de campagne/racine et session/campagne/conversation sont conservées dans `.campaign-identities`, voisin des racines de campagne, sans compteur budgétaire. Le journal global préparé/complété est la seule source du cumul.

Les preuves historiques restent en place. Lorsqu’un enregistreur historique canonique est réutilisé, une revendication d’identité privée peut être créée à côté de sa racine pour empêcher une course avec un nouveau contrat ; ni ses anciens records, ni ses plafonds, ni son régime mono-session ne sont réécrits. Les preuves anciennes sans registre sont inspectées avec contrôle des références et des fichiers bruts avant une nouvelle revendication de session.

Un concurrent est refusé tant que le verrou de campagne est détenu. Aucun retry n’est déclenché. Après une interruption avec préparation non réglée, capture manquante ou identité ambiguë, l’admission reste fermée. Aucun journal n’est réparé automatiquement.

La portée est celle d’un stockage expérimental local privé. Le déplacement de la racine, la suppression coordonnée de toutes les preuves et du registre, l’authentification du propriétaire humain, le billing général et une protection multi-hôte sont hors qualification.

Pour rejouer une nouvelle campagne, fournir explicitement `{ campaignId, sessionId }` à `readProtocolDesignerReplayRefs` et à `createProtocolDesignerReplayFetch`. Une référence d’une autre session, même pour un payload identique, est refusée ; aucune écriture ni transport réel ne découle du rejeu.

Les scripts de cette mission se lancent uniquement sous le garde `offline-guard.cjs`. Le runner de dry-run utilise `--config vitest.config.ts` afin de conserver les modules Node natifs ; la configuration front-end Vite redirige `node:crypto` vers le shim navigateur et ne convient pas à ce runner serveur.

Toute acquisition réelle nécessite un nouveau mandat explicite et un préflight de la nouvelle baseline. Cette mission n’autorise aucun appel réel, push ou déploiement.
