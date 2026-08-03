# Rapport de provenance — préparation scientifique Fabry C-KNOW candidate

## Nature de l’artefact

Ce répertoire contient une préparation scientifique candidate subordonnée au Reasoning Book PD-002. Il ne constitue ni une nouvelle référence normative, ni un Reasoning Book, ni un prompt, ni un Decision Engine, ni un protocole. Il n’est importé par aucun code produit et ne possède aucune projection publique.

Statuts contractuels : `CANDIDATE_NOT_ACTIVATED`, `HUMAN_REVIEW_REQUIRED`, `NOT_ACTIVATED`.

## Localisation et frontière fonctionnelle

La localisation `scientific-candidates/protocol-designer/fabry-candidate/` est imposée par la frontière P0 actuelle, qui interdit encore tout contenu scientifique sous la feature produit. Elle reste distincte du chemin futur envisagé par PD-007. L’absence d’import d’exécution, de route, de registre actif et de script produit maintient une séparation visible avec la future passe P2.

## Documents consultés, dans l’ordre imposé

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`
2. `output/documents/noxia-la-charte-fondatrice-edition-editoriale.docx`
3. `output/documents/noxia-protocol-designer-scientific-product-manifesto-edition-editoriale.docx`
4. `docs/pd-003-research-object-model.md`
5. `docs/pd-009-decision-engine-architecture.md`
6. `docs/pd-007-protocol-designer-implementation-readiness.md`
7. `docs/pd-011-evaluation-framework.md`
8. `docs/scientific-assertion-layer.md`
9. `docs/scientific-knowledge-graph-web.md`
10. `output/documents/noxia-protocol-designer-reasoning-book-pd-002-fabry.docx`
11. `docs/p4-scientific-corpus.md`
12. `docs/p4r-scientific-consolidation.md`
13. `docs/p5-scientific-multidomain.md`

Leur empreinte SHA-256 est conservée dans `manifest.json`. Les cinq sources d’autorité dont la non-modification est une condition de mission sont également figées dans `validation-baseline.json`.

## Méthode de structuration

- La narration PD-002 a servi de source interne, jamais de logique exécutable.
- Les assertions sont atomiques, versionnées et rattachées à un domaine.
- Les niveaux A–D sont copiés comme libellés du Reasoning Book, sans conversion en qualité normalisée, maturité ou statut de conclusion.
- Chaque référence bibliographique conserve le namespace `PD002:REF-Rxx`.
- Chaque lien de preuve qualifie explicitement sa stance.
- Les interprétations multi-sources sont marquées `DERIVES`.
- Le lien `MENTIONS` présent dans le paquet reste exclu du compte des soutiens.
- Les localisateurs disponibles dans PD-002 sont conservés ; l’absence de passage primaire précis est déclarée.
- Aucune publication externe, recherche web ou correction scientifique du document maître n’a été ajoutée.

## Périmètre retenu

Le paquet couvre uniquement les quatre construits, les phénomènes associés nécessaires, les phénotypes préhypertrophique, hypertrophique, cicatriciel et mixte, les rôles bornés de LGE, ECV, T1, T2, ciné, strain et marqueurs circulants utiles, les conditions critiques de mesure, les limites, controverses, objectifs et hypothèses nécessaires, les six règles SCI candidates, la matrice D0–D16 et les conditions FAB-01 à FAB-05.

## Périmètre exclu

Sont exclus : tout protocole ou paramétrage d’acquisition, les doses, la prescription, l’activation, l’interface, les prompts, le moteur de décision, les transitions, les arrêts exécutables, l’évaluation au titre de PD-011, la publication, l’Editorial Engine et les domaines scientifiques sans nécessité directe pour la tranche. PD-008 est cité uniquement ici comme frontière d’absence de dépendance ; aucun fichier, identifiant, import ou contrat du paquet n’en dépend.

## Anomalies et insuffisances conservées

1. Les entrées bibliographiques de PD-002 ne fournissent généralement pas de section, page, tableau ou paragraphe primaire précis. Tous ces cas sont marqués `MISSING_IN_REASONING_BOOK`.
2. Le niveau de preuve de certaines règles méthodologiques n’est pas coté A–D dans PD-002 ; le champ le déclare sans inventer de niveau.
3. L’importance de la fibrose diffuse précoce, le mécanisme inflammatoire exact, la médiation microvasculaire, les trajectoires individuelles par variant et la différence minimale de changement restent incertains.
4. La transportabilité locale des valeurs T1 et ECV n’est pas établie.
5. Aucune revue scientifique humaine n’est enregistrée.

## Digest

Le digest exclut le manifeste afin d’éviter une auto-référence. Le validateur trie les fichiers JSON de données par chemin, canonicalise récursivement les clés, puis calcule une empreinte SHA-256 sur la concaténation déterministe. Le même contenu produit donc le même digest.

## Revue et activation

La validation locale vérifie la structure et les interdictions de la mission. Elle ne constitue pas une revue scientifique humaine. La checklist est volontairement non cochée et le paquet demeure non autoritatif et non activé.
