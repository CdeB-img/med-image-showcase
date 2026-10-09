# Qualification réelle sémantique — plan borné, non exécuté

Statut : PROPOSED / NOT_AUTHORIZED. Trois opérations nouvelles maximum, une par cas ; aucun retry/reroll, Working Draft, DOC ou génération. Réutiliser l’appel conversationnel ST existant. Ces textes sont des exemples d’épreuve, jamais des règles lexicales.

## Fixtures et oracle à figer avant tout dispatch

Réutiliser les builders natifs du test `native-semantic-human-decision.test.tsx` : candidat réellement présenté par QRY, trois scopes séparables, références canoniques complètes, session synthétique indépendante par cas. Ne pas utiliser ni modifier le Project réel à préserver.

| Cas | Contribution utilisateur proposée | Oracle obligatoire |
| --- | --- | --- |
| 1 — accord entier inédit | « Le périmètre exposé correspond à ma décision définitive. » | ACCEPT ; référent unique courant ; toutes et seulement les refs effectivement présentées ; aucune décision inférée. |
| 2 — acte mixte, accord partiel et correction | « La population me convient ; remplacez M12 par M3 et expliquez l’analyse. » | PARTIAL_ACCEPT + CORRECTION + CONTINUE_OR_EXPLAIN ; seule population autorisée à adoption ; calendrier antérieur non adopté, remplacement candidat/non adopté ; périmètres séparables validés. |
| 3 — confirmation conditionnelle non adoptante | « Ne retenez pas encore ces choix. Je donnerai mon accord si le comité valide ce calendrier ; poursuivons l’explication. » | Aucun assentiment adoptant ; CONDITION/REFUS/CONTINUATION interprétés selon le contexte natif ; aucune mutation PRJ. |

Avant exécution : figer la présentation native, son digest, Project/source, USER, refs et dépendances, payload exact et configuration. Les résultats doivent être évalués contre cet oracle avant de regarder la réponse fournisseur. Trois cas ne qualifient pas toute la compétence sémantique du modèle.

## Borne financière

- Modèle Preview proposé : `gpt-6.1-sol`, transport existant Azure Responses, effort et plafond natifs inchangés, `service_tier=default`, output ≤ 8000 tokens, text-only/stateless/tool-free.
- Gate supplémentaire de campagne : payload HTTP complet sérialisé ≤ 80000 octets UTF-8. Ce n’est pas une modification du plafond mémoire produit. Si la requête native dépasse cette borne : STOP, pas de troncature ni réécriture de science.
- Propriétaire réutilisé : `boundPublicProviderCall`, politique `AZURE_LOCAL_O200K_UTF8_ENVELOPE_V1`. La borne locale n’est pas un compte certifié fournisseur. Exiger une borne d’entrée ≤ 168192 tokens ; sinon STOP.
- Borne tarifaire Standard publiée : classe d’entrée maximale cache write 2,50 USD/M ; sortie 10 USD/M. Aucun crédit pour cache hit. Entrée sous le seuil long-context de 272000 tokens. Sources consultées le 10 octobre 2026 : [modèle officiel](https://developers.openai.com/api/docs/models/gpt-6.1-sol), [pricing officiel](https://developers.openai.com/api/docs/pricing).
- Borne de politique par opération : `(168192 × 2,50 + 8000 × 10) / 1000000 = 0,50048 USD` ; avec marge régionale de 10 % : `0,550528 USD`.
- Trois opérations : `1,651584 USD`, arrondi conservateur de campagne `1,66 USD`. Plafond d’autorisation proposé : **1,70 USD**, sans augmenter les budgets produit existants.
- Le tarif effectif Azure du déploiement et ses éventuelles majorations doivent être confirmés avant tout dispatch ; la page OpenAI seule ne prouve pas la facture Azure. Tarif/configuration inconnus ou plus chers que cette enveloppe : dispatch interdit jusqu’à nouvelle borne et autorisation.
- Avant chaque appel : dépense cumulée conservatrice + borne prochaine opération ≤ min(plafond campagne autorisé, budget existant disponible). Les soft/hard-stops, admissions, interdictions de retry et état UNKNOWN restent prioritaires. Un soft-stop peut réduire la campagne à moins de trois opérations.

## Exécution ultérieure

Autorisation distincte requise : exact candidat/déploiement, sessions synthétiques, destination fournisseur effective, maximum trois opérations, plafond financier et cas figés. Aucun appel n’est autorisé par le présent plan.

Arrêter au premier échec causal ; garder uniquement identités/digests, actes, refs, codes natifs, usage/coût et mesures de latence. Ne pas lancer une réparation/requalification payante automatique. Zéro appel supplémentaire requis par la seule interprétation sémantique ne signifie pas coût marginal identique.
