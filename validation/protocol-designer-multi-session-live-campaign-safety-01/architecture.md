# Attribution et contrat retenu

- Politique/budget : `api/protocol-designer-canary-policy.ts`. Defaults historiques 1/6 inchangés. Nouvelle policy explicite, digest canonique, 1–5 sessions, soft positif <=3, hard positif <=10, soft<=hard et modèles qualifiés uniquement. Aucune configuration navigateur.
- Admission/persistence : `api/protocol-designer-provider-replay.ts`. Réutilisation du verrou de campagne et du journal REQUEST_PREPARED/COMPLETED, unique vérité budgétaire. Reconstruction complète à chaque admission. Aucune seconde comptabilité par session.
- Identité : fichier policy immuable et registre privé de rattachement campagne/racine et session/campagne/conversation. Le registre ne contient aucun coût. Les appels conservent aussi le Project courant lorsqu’il est fourni ; son absence reste explicite. Aucun nouvel owner scientifique ni changement de sémantique Project.
- Activation : `vite.config.ts`, policy JSON serveur explicite avec identité/digest/date stables. Mode normal et canaries historiques restent distincts. Aucun secret ou policy issu du body navigateur.
- Rejeu : filtre et vérification explicites campaign/session, y compris pour deux payloads identiques. Rejeu en lecture seule.

La racine privée configurée est la frontière de confiance locale : aucun mécanisme purement local ne peut détecter la destruction coordonnée de tous ses fichiers et de son registre. Une suppression/troncature partielle, une identité manquante, une initialisation interrompue ou une préparation incomplète ferment le gate, sans réparation automatique. Déplacer/changer la racine d’une campagne exige une opération explicite hors de cette extension ; les identités canoniques de racine sont vérifiées.

Le registre est commun aux campagnes de cette racine privée. Le verrou de campagne couvre réservation, transport, capture et règlement. Un concurrent est refusé sans émission ; une nouvelle admission explicite ne peut lire le cumul qu’après la fin de la précédente. Aucun retry automatique.
