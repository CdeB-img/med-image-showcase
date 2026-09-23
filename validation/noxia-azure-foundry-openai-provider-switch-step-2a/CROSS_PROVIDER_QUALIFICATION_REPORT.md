# Qualification X/Y — comptage OpenAI avant génération Azure

Date : 2026-09-22
Décision : `CROSS_PROVIDER_INPUT_COUNT_EQUIVALENCE = QUALIFIED_FOR_OBSERVED_CURRENT_PAYLOAD_CLASSES`
Adoption runtime : `NOT_PERFORMED`

## Résultat utile

| Classe courante | Modèle/déploiement demandé | Modèle Azure retourné | Digest du payload de génération | OpenAI precount | Azure usage input | Delta |
|---|---|---|---|---:|---:|---:|
| Conversation texte | `gpt-5.6-sol` | `gpt-5.6-sol` | `44d551b5ef920b3d3fe6a104df39b2079c62e6edf36fcd063bea2f49a7c66f06` | 2076 | 2076 | 0 |
| Projection langue JSON Schema | `gpt-5.6-terra` | `gpt-5.6-terra` | `ddd65c1d1c9b283ef5c2034e264d1ddd2c00c40f33f490762f8486d9e287e402` | 1448 | 1448 | 0 |
| Working Draft JSON Schema | `gpt-5.6-sol` | `gpt-5.6-sol` | `e1f62fd3b23d74c0582c0e4bb79758c38b6e16263da4f66c2fb76de4f2bd3098` | 5593 | 5593 | 0 |
| Projection DOC native JSON Object courante | `gpt-5.6-terra` | `gpt-5.6-terra` | `813da95a3154a4cc9f9647d115cefbbc5f453cd7d52869688b46e47171bc8b33` | 19956 | 19956 | 0 |

Pour chaque ligne, le digest du matériau transmis au précomptage OpenAI était identique au digest du sous-ensemble `model + instructions + input + reasoning + text` de la requête de génération Azure. Les seules différences de transport étaient l'endpoint et l'authentification. `store=false`, `service_tier=default` et `max_output_tokens=64` ont été conservés pour les générations de qualification.

## Essai historique exclu de la conclusion courante

`DOCUMENT_JSON_OBJECT_SOL` a reçu `HTTP 400` au précomptage OpenAI ; aucune génération Azure n'a suivi. Ce payload gelé provenait d'un diagnostic antérieur au correctif JSON-mode et ne correspond plus au payload DOC courant : le mot `json` figurait seulement dans `instructions`, pas dans `input`. Le code courant ajoute explicitement l'instruction JSON à `input`, et le test de non-régression documente cette exigence.

- digest historique rejeté : `50b1a87711ead27b724de1f1431bd93369980f6ae19a919dda78550c48fb6345` ;
- requête OpenAI : `HTTP 400` ;
- génération Azure : `0` ;
- classification : `HISTORICAL_PRE_FIX_PAYLOAD_NOT_CURRENT_RUNTIME_CLASS` ;
- aucun retry du même payload.

La documentation OpenAI expose `text` parmi les paramètres de `POST /responses/input_tokens` et décrit ce champ comme supportant du texte simple ou des données JSON structurées : <https://developers.openai.com/api/reference/typescript/resources/responses/subresources/input_tokens/methods/count>.

## Appels et garde financier

- comptages OpenAI : `5` (`4` réussis, `1` rejeté avant génération) ;
- générations Azure : `4` ;
- requêtes provider totales : `9` ;
- retries/rerolls : `0` ;
- hard cap : `6 USD`, inchangé ;
- committed upper bound cumulé : `0.095951 USD` ;
- measured cost reconstitué : `0 USD` ;
- réservations conservées : `0.095951 USD`.

Les réponses Azure étaient volontairement `incomplete/max_output_tokens` à 64 tokens. Le contrat de settlement existant ne libère donc pas leurs réservations. `0 USD` n'est pas une affirmation de gratuité : le coût exact n'est pas réglable par le contrat courant pour ces réponses incomplètes, et le montant réservé reste engagé.

La clé Azure fournie directement a servi uniquement au dernier couple courant. Elle n'a été ni écrite dans le repository, ni inscrite dans les preuves, ni reproduite dans ce rapport. Les réponses scientifiques n'ont pas été conservées ; seules les métadonnées, usages, digests et identifiants de requête figurent dans les résultats JSON.

## Contrat minimal proposé — non adopté

1. Le runtime construit une seule représentation canonique du payload de génération après résolution du modèle/déploiement Azure.
2. Le journal durable enregistre `generationPayloadDigest`, `inputMaterialDigest`, modèle/déploiement demandé, provider de comptage et provider de génération.
3. `countProvider=openai` appelle `/v1/responses/input_tokens` avec exactement `model`, `instructions`, `input`, `reasoning`, `text` du payload Azure final. Aucun tokenizer local ni estimation de secours.
4. Admission, création de l'opération et réservation restent atomiques sous les owners actuels. Aucun verrou SQL ne couvre l'appel provider.
5. `generationProvider=azure` utilise le payload canonique inchangé, hors endpoint et authentification.
6. Après dispatch, le runtime compare obligatoirement `azure.response.usage.input_tokens` au precount persistant.
7. En cas de différence : état durable `ACCOUNTING_INPUT_TOKEN_DIVERGENCE`, conservation de la réservation maximale, aucune nouvelle admission/retry pour l'opération, arrêt fail-closed et revue humaine.
8. Une réponse completed est réglée une seule fois avec le settlement existant. Une réponse incomplete/unknown conserve sa réservation selon le contrat actuel.
9. Toute modification du mapping de modèle, du modèle Azure retourné, de la forme du payload ou du pricing snapshot invalide la qualification correspondante et impose une requalification ciblée.

## Propriétaires minimaux

- Construction de la requête exacte de comptage : `server/protocol-designer-provider-replay.ts`, `openAIInputCountRequest`.
- Résolution endpoint/modèle : `server/protocol-designer-openai-provider-config.ts`.
- Borne, admission et settlement : `server/protocol-designer-canary-policy.ts`.
- Persistance atomique, idempotence et récupération : `server/protocol-designer-durable-guard.ts`.
- Payload DOC courant : `api/protocol-designer-openai-extraction-provider.ts` et `src/features/document-projection/drci-draft-contract.ts`.

La modification minimale consiste à permettre au journal durable de porter deux provenances distinctes (`countProvider=openai`, `generationProvider=azure`) autour du même payload canonique et à imposer le contrôle post-dispatch. Aucun nouveau moteur, router, tokenizer ou garde financier n'est requis.

## Clôture de l'expérimentation

- Preview technique active : `NO` ; les quatre déploiements temporaires, y compris les trois builds échoués, ont été supprimés.
- Production modifiée : `NO`.
- Runtime cross-provider adopté : `NO`.
- Commit/push : `NO`.

Preuves brutes :

- `CROSS_PROVIDER_QUALIFICATION_RESULT.json` — campagne initiale, trois égalités et arrêt fail-closed sur l'artefact historique ;
- `CROSS_PROVIDER_DOCUMENT_FOLLOWUP_RESULT.json` — payload DOC courant, égalité exacte ;
- `CROSS_PROVIDER_DOCUMENT_FOLLOWUP_PLAN.json` — report cumulatif des réservations et limites de l'essai courant.
