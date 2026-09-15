# Revue contradictoire finale

Revue réalisée dans cette tâche, sans sous-agent ni affirmation de revue humaine indépendante.

| Risque examiné | Preuve / résultat |
|---|---|
| Reset par nouvelle session ou nouveau Project | MULTI_SESSION_01/04/05 : cumul de A repris par B, identités Project distinctes ; refus commun lorsque la borne ne permet plus l’appel |
| Reset par nouveau recorder ou restart | MULTI_SESSION_06/07 et `qualification/restart-and-history-sealed.json` : reconstruction depuis les preuves, refus d’un appel déjà consommé et d’une sixième session dans un processus neuf |
| Course entre sessions | MULTI_SESSION_08/09 : verrou de campagne conservé jusqu’au règlement ; transport concurrent refusé, cumul repris à l’admission suivante |
| Course entre formats de campagne | Test concurrent historique/policy : au plus un transport pour une même session ; revendication immuable exclusive commune |
| Changement de policy après préparation/dépense | MULTI_SESSION_13 et test de préparation sans completion : rejet avant transport ; digest, identité et racine persistés |
| Limites contrôlées par le client | MULTI_SESSION_14 via métadonnées et vrai middleware local : le body falsifié ne remplace pas la policy serveur |
| Preuves absentes, corrompues ou partiellement relues | MULTI_SESSION_11/12, contrôle d’orphelins et cinq contre-exemples rouges conservés ; aucun rétablissement automatique |
| Coût inconnu, erreur transport/HTTP | Nouvelles sessions refusées après réponse sans usage, échec HTTP ou transport ; aucune réservation incertaine libérée |
| Mauvais rattachement entre ancienne et nouvelle campagne | Deux défauts démontrés dans `review-counterexamples-red.json`, corrigés par registre atomique et lecture des preuves historiques |
| Rejeu d’une autre session | Défaut de métadonnées contradictoires démontré dans le même reçu rouge ; scope et métadonnées désormais cohérents avant retour de réponse |
| Journal historique tronqué avant revendication | Défaut supplémentaire démontré dans `historical-orphan-red.json` ; ensemble des raw refs comparé aux fichiers physiques, refus si incomplet |
| Rejeu compté comme dépense | MULTI_SESSION_17 et dry-run : journal identique avant/après, aucun transport ; ancien live 01R rejoué en lecture seule |
| Compatibilité historique | MULTI_SESSION_15, tests B1–B8 et rejeu strict réel des cinq captures 01R ; defaults 1/6 inchangés |
| Fallback non protégé | Configuration invalide/partielle refusée, downgrade normal/historique d’une policy persistée refusé, autre API refusée par middleware existant |
| Arrondi de la borne absolue configurable | `hard-bound-rounding-red.json` : réservation supérieure au plafond de 0,25e-9 USD admise avant correction ; plafond désormais arrondi vers le bas, coûts vers le haut ; test de refus avant transport PASS |
| Portée du verrou et reprise impossible | Verrou filesystem par campagne ; crash/initialisation partielle restent fermés jusqu’à décision explicite, jamais de retry ni de réparation implicite |

Les cinq contre-exemples étaient des défauts de l’extension en cours, pas des observations de providers réels. Le défaut d’alias Node/browser du premier runner de dry-run appartenait uniquement à sa configuration d’exécution ; aucune correction produit ne lui a été attribuée.

Limites conservées : registre d’identité local à la racine privée configurée, contexte Project observé sans autorité scientifique, et aucune preuve de compréhension scientifique ou d’efficacité clinique ajoutée. Le dry-run ne remplace pas l’acquisition live à venir.
