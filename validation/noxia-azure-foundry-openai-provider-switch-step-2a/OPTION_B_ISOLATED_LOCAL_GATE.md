# OPTION B — qualification locale sur base isolée

Date : 2026-09-23. Preuve technique locale uniquement ; aucun déploiement ni appel provider réel dans cette reprise.

## Isolation du journal durable

- Production : Neon `aged-art-41980988`, hôte `ep-nameless-dew-b13ga6ek-pooler.c-5.eu-central-1.aws.neon.tech`.
- Qualification : Neon `lingering-haze-73971206`, hôte `ep-aged-dust-b2o37gm4-pooler.c-6.eu-central-1.aws.neon.tech`, connexion Vercel Development uniquement sous le préfixe `NOXIA_DURABLE_QUALIFICATION`.
- Les variables Vercel Production et Preview sont identiques avant/après les tests ; le préfixe de qualification y est absent.
- Le préflight du runner vérifie à nouveau les trois environnements, le rôle explicite `qualification/test`, les deux identités Neon, puis ouvre la base de qualification en lecture seule avant toute migration ou `TRUNCATE`. Il refuse tout écart.
- Les compteurs Production lus avant/après sont inchangés : 2 sessions, 5 admissions, 4 opérations, 1 rate bucket. Le runner ne dispose que de l'URL de qualification pour ses écritures. Les tables de qualification reviennent à zéro après chaque suite.
- Aucun credential n'est conservé dans le dépôt. Le fichier local ignoré `.env.durable-qualification.local` ne contient que `NOXIA_DURABLE_DATABASE_ROLE=qualification/test` et le chemin du CLI Vercel ; les credentials sont tirés temporairement de Vercel Development puis effacés.

## Gates exécutés

- Garde de préflight : 8/8 tests hors base, plus une vérification réelle en lecture seule.
- Journal durable partagé : 10/10 tests sur la seule base de qualification.
- Comptage exact et Azure sur journal durable : 14/14 tests sur la seule base de qualification, dont réservation avant dispatch, égalité, divergence fail-closed, modèle retourné divergent, usage manquant, replay du comptage et concurrence.
- Configuration/transport/runtime public ciblés : 69/69 tests avec providers simulés.
- TypeScript, lint des fichiers affectés, build et `git diff --check` : PASS.
- Hard cap public : 6 USD inchangé. Mapping limité aux couples GPT-5.6 qualifiés ; GPT-6 non testé et non admis.
- Production : `OPENAI_PROVIDER` absent, donc chemin OpenAI par défaut. Aucun changement de variables ni de déploiement Production.

L'équivalence OpenAI pre-count / Azure post-usage est celle des quatre classes de payload GPT-5.6 observées dans `CROSS_PROVIDER_QUALIFICATION_REPORT.md`. Cette reprise ne la généralise pas à de nouveaux modèles ni à de nouveaux payloads. Le smoke Preview initialement prévu est exclu par le mandat actualisé ; aucune qualification live du produit intégré n'est revendiquée ici.

`PROVIDER_CALLS = 0` ; `PRODUCTION_DB_WRITES_BY_THIS_RUN = 0` ; `PUSH = NO` ; `DEPLOY = NO`.
