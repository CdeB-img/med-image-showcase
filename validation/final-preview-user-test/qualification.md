# Préparation du candidat Preview intégré

Statut : qualification hors ligne achevée ; validation navigateur et interprétation LLM réelle distinctes.

## Lignée et périmètre

- Branche isolée : `codex/final-preview-integrated`, créée depuis `e80a8a17f96c69ec4d531252b24d72b094cc29a4`.
- Correctif DOC `e87432ae1f6b3950a8aa3306c7e0e4f01587fa4a` récupéré depuis la lignée `ec7beedb650aca7aa60a28409144e76e58514f6b` par cherry-pick `7581143433f09645e9df440aadaa65469b92aa37`. Patch-id identique : `786e3a75536ac8fb11e7082367c51aa94aef02a0`.
- Les propriétaires de compatibilité PostgreSQL 18 et du runtime sans DDL implicite sont déjà présents dans la base sémantique. Les branches sources, main et le tag golden ne sont pas modifiés.

## Premier défaut causal de sauvegarde

La reproduction déterministe Open → Edit → Save → Reload → Restore échouait sur `PROJECT_SNAPSHOT_SESSION_MISMATCH` : la résolution du snapshot pour la sauvegarde exigeait encore l'adresse réseau d'origine, malgré la preuve de session exacte.

Le propriétaire d'autorisation accepte maintenant le contexte **serveur uniquement** `DOCUMENT_REVISION_SAVE`, utilisé exclusivement pour sauvegarder une Working Revision déjà existante et nativement liée. Session, Project, version/digest, preuve exacte, archive source vérifiée, ancres et concurrence restent obligatoires. Le client ne peut pas choisir ce contexte. Création, abandon, finalisation, mutation PRJ, admission/génération DOC et opérations fournisseur restent dans leur autorité réseau actuelle.

Les tests couvrent changement d'adresse, preuve absente/étrangère, mauvais binding, source corrompue, révision absente, ancres falsifiées, concurrence et refus d'un contexte fourni par HTTP. Aucun élargissement de scope documentaire ou scientifique.

## Qualification vérifiée

| Campagne | Résultat |
| --- | --- |
| Mobilité des saves + minimisation des diagnostics | 22/22 PASS |
| Full canonique | 6221 PASS / 0 FAIL |
| Stabilité | 169/169 PASS |
| Sentinelles | 309/309 PASS |
| Typecheck / lint / build / diff-check | PASS |

13 skips, 1 todo et les 7 avertissements lint préexistants sont conservés. La première exécution full a détecté une fixture partagée qui rejetait le nouveau contexte serveur même à IP inchangée ; elle a été alignée sur le contrat natif sans retirer d'assertion. Les essais initiaux et les 42 sorties synthétiques sont conservés avec manifeste SHA-256 dans `/private/tmp/noxia-final-preview.Wv8dSF`.

## Preview PostgreSQL

Vérification en lecture seule : cible Preview distincte de Production, empreinte sanitizée `11f5efa36bd11789`. Les cinq empreintes de tables natives correspondent au candidat. Les deux contraintes `doc_working_revision_native_binding_required` et `doc_studio_intent_native_binding_required` sont présentes, validées et appliquées.

**Aucune migration nécessaire dans cette mission, aucun DDL exécuté.** L'installation additive préparée reste non exécutée ; elle exige, si nécessaire ultérieurement, backup récupérable vérifié et autorisation Preview explicite. Aucun backup n'est revendiqué comme vérifié ici.

## Diagnostics et validations restantes

La projection d'accessibilité conserve contrôles, compteurs et états, jamais les valeurs éditables, paragraphes, titres privés ou preuves. Utilisation obligatoire de `emit:false` pour les lectures AX et aucun fallback brut. Cela ne retire pas rétroactivement les sorties historiques déjà émises.

La validation réelle de save/restauration exige l'autorisation exacte de révision et, pour une nouvelle origine, de transfert de cette seule session. Le scénario doit append/save/reload/restore/save, conserver les historiques et vérifier Project, archives, intents et ledger inchangés. Aucun provider ni nouvelle génération.

L'interprétation LLM réelle reste **NOT_RUN**. Le plan séparé propose trois opérations maximum, sans retry, avec borne financière et autorisation distinctes. Aucun résultat simulé ne vaut PASS_REAL.
