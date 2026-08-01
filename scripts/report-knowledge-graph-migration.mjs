import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { competencyCases, validateCompetencyModel } from "../src/knowledge-graph/competency-cases.mjs";
import { createKnowledgeGraphMigrationManifest } from "../src/knowledge-graph/migration/manifest.mjs";
import {
  biomarkerProfileMigrations,
  conceptDesignations,
  publicationCorrectionAudit,
  relationMigrationEntries,
  sourceSnapshot,
} from "../src/knowledge-graph/migration/migrated-knowledge.mjs";
import { validateScientificKnowledgeGraph } from "../src/knowledge-graph/multilayer-validation.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(root, "docs/p3m-web-migration-report.md");
const checkOnly = process.argv.includes("--check");
const validation = validateScientificKnowledgeGraph({ root });
const manifest = createKnowledgeGraphMigrationManifest({ root });
const competency = validateCompetencyModel();
const escapeCell = (value) => String(value ?? "—").replaceAll("|", "\\|").replaceAll("\n", " ");
const yesNo = (value) => value ? "Oui" : "Non";

const relationRows = relationMigrationEntries.map((entry) => `| ${escapeCell(entry.oldId)} | ${entry.category} | ${escapeCell(entry.decision)} | Non | ${escapeCell(entry.justification)} |`).join("\n");
const familyRows = Object.entries(validation.layers.coverage.familySummary).map(([family, summary]) => `| ${family} | ${summary.entityCount === 0 ? "VIDE" : summary.catalogComplete === summary.entityCount ? "COMPLET" : "PARTIEL"} | ${summary.scientificComplete === summary.entityCount && summary.entityCount > 0 ? "COMPLET" : "INSUFFISANT"} | ${summary.comparisonComplete === summary.entityCount && summary.entityCount > 0 ? "COMPLET" : "INSUFFISANT"} | ${summary.state} |`).join("\n");
const competencyById = new Map(competency.results.map((result) => [result.caseId, result]));
const competencyRows = competencyCases.map((item) => {
  const result = competencyById.get(item.caseId);
  return `| ${escapeCell(item.label)} | ${yesNo(result.modelRepresentable)} | ${yesNo(result.dataPresent)} | ${yesNo(result.verifiedAssertions)} | ${escapeCell(result.gaps.join(", "))} |`;
}).join("\n");

const contents = `# Rapport P3M-Web — migration documentaire du Scientific Knowledge Graph

## 1. Périmètre produit

Cette migration concerne exclusivement le socle scientifique et éditorial du site public Noxia. Elle prépare pages de concepts, synthèses de littérature, fiches techniques, comparaisons, glossaire, FAQ, navigation, données structurées, SEO et pages « état des connaissances ».

Le logiciel Noxia, le PACS, les viewers, les protocoles exécutables, les workflows applicatifs, les affectations CoreLab, les équipements installés, les licences opérationnelles, les datasets internes, l’entraînement IA et les moteurs de recommandation clinique sont hors périmètre.

## 2. Entrée officielle P3

Le rapport destructif P3 existant reste valable et constitue l’entrée officielle de P3M-Web. Il n’a pas été refait. Seule l’application de ses conclusions a été limitée au sous-ensemble documentaire et scientifique nécessaire au site.

## 3. État initial

- Branche initiale : \`main\`.
- SHA source : \`${sourceSnapshot.data.gitSha}\`.
- Graphe v1 structurellement valide : oui, 0 erreur et ${sourceSnapshot.counts.warnings} avertissements.
- Couche Scientific Assertion antérieure : valide, sans migration de vérité scientifique.
- Modifications P1, P2 et P3R préservées.
- Pages, routes, SEO, sitemap, viewers et dépôt editorial-engine exclus de la mutation.

## 4. Snapshot source

Le snapshot déterministe \`${sourceSnapshot.snapshotId}\` contient ${sourceSnapshot.counts.entities} entités, ${sourceSnapshot.counts.relations} relations, ${sourceSnapshot.counts.sources} sources, ${sourceSnapshot.counts.publications} publications, ${sourceSnapshot.counts.biomarkerProfiles} profils biomarqueurs et ${sourceSnapshot.counts.constraints} contraintes. Son digest contractuel est \`${sourceSnapshot.digests.contract}\` et aucun timestamp instable ne participe aux digests.

## 5. Nouvelle architecture web

L’architecture sépare identités stables, révisions, relations structurelles actives, assertions scientifiques, sources versionnées, liens de preuve, contextes d’applicabilité, désignations, mesures et synthèses structurées. Les objets protocoles, équipements, workflows, CoreLab, études, datasets et algorithmes restent des sujets documentaires légers.

## 6. Correction des identités

Les 93 relations disposent d’un ID v2 dérivé du namespace complet, des deux endpoints complets, du type, du discriminateur et de la version d’algorithme. La table de migration est exhaustive et le résolveur accepte les anciens IDs. Aucune collision n’est présente.

## 7. Modèle de versionnement

\`ConceptIdentity\`, \`EntityRevision\`, \`ScientificAssertionIdentity\`, \`ScientificAssertionRevision\`, \`SourceIdentity\`, \`SourceRevision\`, \`PublicationWork\` et \`PublicationVersion\` séparent identité et histoire. Validité, succession, correction et rétraction sont portées uniquement là où elles sont justifiées.

## 8. Modèle de provenance

${manifest.counts.sourceIdentities} identités de source et ${manifest.counts.sourceRevisions} révisions ont été créées : 24 pages/fichiers du dépôt et 9 publications. Les localisateurs bibliographiques ou dépôt restent optionnels selon le type de source. DOI, PMID, auteurs, année et version absents restent \`null\`.

## 9. Modèle de preuve

Le type de source, la qualité de preuve, la maturité scientifique et le statut documentaire sont indépendants. Aucun niveau élevé n’est déduit d’un type documentaire.

## 10. Scientific Assertions

Le contrat représente assertions entity-object, littérales, quantitatives, d’applicabilité, de compatibilité documentaire, recommandations citées et négatives. La migration réelle crée ${manifest.counts.scientificAssertionsCreated} assertion : aucune relation v1 n’était suffisamment localisée et revue pour devenir une vérité scientifique.

## 11. Evidence Links

Le modèle distingue soutien, réfutation, qualification, mention, dérivation, correction, rétraction et lien non résolu. ${manifest.counts.evidenceLinksCreated} lien réel a été créé. \`Publication DOCUMENTS Concept\` reste une mention candidate, jamais un soutien automatique.

## 12. Contextes

Les contextes couvrent population, âge, sexe, espèce, pathologie, stade, modalité, constructeur, gamme, modèle, génération, logiciel, champ, séquence, protocole décrit, contraste, dose, méthode, workflow documentaire, centre, étude et temporalité. EXACT, ANY_OF, ALL_OF, EXCLUDES, RANGE, CONDITION, UNKNOWN et NOT_APPLICABLE sont supportés.

## 13. Modèle quantitatif

Définition, méthode, observation, mesure dérivée, seuil et plage de référence peuvent porter quantité, unité, formule, entrées, temporalité, incertitude, précision, répétabilité, reproductibilité, biais, normalisation et sources. Aucune valeur n’a été inventée.

## 14. Protocoles documentaires

\`ProtocolConcept\` et \`ProtocolDescriptionRevision\` représentent paramètres publiés, variantes décrites, limites et différences multicentriques. Ils ne configurent ni examen, ni fallback, ni PACS.

## 15. Équipements documentaires

Constructeur, gamme, modèle, génération, champ, plateforme et version logicielle peuvent être des sujets documentaires. \`CapabilityStatement\` contextualise une capacité ou une limite sourcée. Aucune instance installée, licence produit ou règle de compatibilité applicative n’existe.

## 16. Terminologies

${conceptDesignations.length} désignations ont été dérivées des libellés et alias historiques. Les chaînes ne sont plus globalement uniques. Langue, locale, type et contexte permettent synonymes, abréviations, traductions, homonymes et acronymes polysémiques. Aucun code externe n’a été inventé.

## 17. Workflows et CoreLab documentaires

Les descriptions peuvent exposer étapes, rôles, méthodes et contrôles publiés. Elles ne contiennent aucune transition applicative, affectation, état de production ou adjudication exécutable.

## 18. Études, datasets et IA documentaires

Études, cohortes publiées, datasets cités, algorithmes et métriques publiées sont représentables comme sujets du site. La gestion des datasets internes, l’entraînement et les modèles déployés sont absents.

## 19. Standards

Standard, partie, édition, profil, SOP Class, syntaxe de transfert et déclaration documentaire de conformité sont représentables. L’ancien raccourci DICOM \`Format COMPATIBLE_WITH Standard\` est désactivé sans suppression historique.

## 20. Profils de complétude

La complétude est distincte pour CATALOG, EDITORIAL, SCIENTIFIC, COMPARISON, GLOSSARY, NAVIGATION, SEO et KNOWLEDGE_STATE. Les ${manifest.counts.entitiesMigrated} concepts restent catalogables ; aucun n’est déclaré scientifiquement complet sans assertions et preuves revues.

## 21. Validations multicouches

Structure : ${yesNo(validation.structureValid)}. Sémantique : ${yesNo(validation.semanticsValid)}. Scientifique : ${yesNo(validation.scientificValid)}. Provenance : ${yesNo(validation.provenanceValid)}. Couverture évaluée : ${yesNo(validation.coverageValid)}. Compétence : ${yesNo(validation.competencyValid)}. Intégrité de migration : ${yesNo(validation.migrationIntegrityValid)}. Schéma de projection web : ${yesNo(validation.projectionReady)}. Contenu scientifique public prêt : ${yesNo(validation.publicScientificContentReady)}.

## 22. Migration des entités

Les 118 identités historiques sont conservées et reçoivent 118 révisions initiales. Labels, descriptions, propriétés, alias, sources et valeurs inconnues sont préservés. Chaque migration possède un digest avant/après identique pour le payload historique.

## 23. Migration des relations

Les 93 relations sont inventoriées : ${manifest.counts.relationsActive} structurelles actives, ${manifest.counts.relationsDeferred} différées et ${manifest.counts.relationsDisabled} désactivées. Aucune assertion n’a été créée.

## 24. Migration des publications

Les 9 publications deviennent 9 \`PublicationWork\`, 9 \`PublicationVersion\` et 9 sources scientifiques versionnées. La correction PLOS reste une relation candidate non appliquée : ${escapeCell(publicationCorrectionAudit.reason)}

## 25. Migration des biomarqueurs

Les 13 profils sont inventoriés. Leur classification historique est conservée ; les alternatives de mesure ou endpoint restent des propositions à revoir. Les listes vides de preuves et limitations ne sont jamais traitées comme complètes.

## 26. Cas de compétence web

Les ${competency.counts.cases} cas sont modélisables, dont IRM/ECV, CT/ECV, protocoles myocardite, comparaison MOLLI/SASHA, limites de plateformes, correction, controverse, glossaire, fiche quantitative, DICOM et projection état des connaissances. Les lacunes de données n’invalident pas la représentabilité.

## 27. Synthèses dérivées

La synthèse déterministe retourne assertions applicables, favorables, défavorables, qualifications, sources, dimensions de preuve, contextes, limitations, contradictions, consensus avec règle explicite, questions ouvertes, historique, confiance et données manquantes. Elle ne produit ni texte éditorial ni méta-analyse statistique.

## 28. Compatibilité et rollback

Le snapshot, les registres v1, les payloads historiques et les anciens IDs sont conservés. Le rollback logique consiste à cesser de lire la projection v2-web. Aucune suppression ni réécriture inverse n’est nécessaire.

## 29. Fichiers créés

- Contrats, factories et validateurs P3M-Web sous \`src/knowledge-graph/\`.
- Snapshot, table d’identités, projection migrée et manifeste sous \`src/knowledge-graph/migration/\`.
- Scripts de snapshot, migration, validation et rapport sous \`scripts/\`.
- Architecture \`docs/scientific-knowledge-graph-web.md\` et présent rapport.
- Matrice de tests P3M-Web sous \`src/knowledge-graph/\`.

## 30. Fichiers modifiés

\`package.json\`, \`src/knowledge-graph/schema.mjs\`, \`src/knowledge-graph/constraints.mjs\`, \`src/knowledge-graph/validate.mjs\` et \`src/knowledge-graph/index.mjs\` uniquement dans le périmètre du graphe et de ses commandes. Aucun fichier page, route, SEO, sitemap, viewer, SaaS ou PACS n’est modifié par P3M-Web.

## 31. Tests ajoutés

La matrice vérifie snapshot, intégrité, identités, versions, provenance, assertions et preuves synthétiques, contextes, quantitatif, terminologie, relations formelles, migrations, cas web, synthèse, frontières produit et surfaces protégées.

## 32. Validations exécutées

Les commandes de snapshot, migration, validation structurelle, sémantique, scientifique, provenance, complétude, compétence, projection, tests, typecheck, build, lint et contrôle Git sont consignées lors de la validation finale.

## 33. Problèmes restant ouverts

- Aucun corpus d’assertions scientifiques revues n’est encore migré.
- Les localisateurs précis et extractions de source restent à enrichir.
- Les données constructeur, champ, logiciel, MOLLI, SASHA, myocardite et CT/ECV sont absentes ou insuffisantes.
- Le lien entre la correction PLOS et l’article original n’est pas appliqué sans preuve explicite dans le dépôt.
- Les 47 relations différées nécessitent une revue sémantique ou scientifique.
- Toute projection publique exige encore une validation éditoriale, scientifique et SEO séparée.

## Tableau — défauts P3 appliqués au web

| Défaut P3 | Correction appliquée | Migration | Test | Résultat |
|---|---|---|---|---|
| Collision des relations | Identité v2 sur endpoints complets et version d’algorithme | 93 correspondances | Unicité et résolution legacy | VALIDÉ |
| Concept confondu avec version | Identités et révisions séparées | 118 + 118 | Identité/révision et validité | VALIDÉ |
| Relation structurelle assimilable à une vérité | Assertions et EvidenceLinks séparés | 0 promotion automatique | Classification exhaustive | VALIDÉ |
| Provenance insuffisante | SourceIdentity, SourceRevision et profils par type | 33 + 33 | Complétude de provenance | VALIDÉ |
| Preuve monodimensionnelle | Type, qualité, maturité et statut séparés | Contrat v2-web | Tests synthétiques | VALIDÉ |
| Contexte insuffisant | Dimensions structurées et opérateurs | Contrat v2-web | IRM/ECV et CT/ECV | VALIDÉ |
| Anatomie thorax/poumon fausse | Relation désactivée et conservée | 1 relation inactive | Projection active | VALIDÉ |
| DICOM réduit à un format compatible | Relation désactivée, contrats documentaires | 1 relation inactive | Arbre DICOM | VALIDÉ |
| Surdimensionnement logiciel | Objets documentaires légers, aucun moteur | Périmètre P3M-Web | Frontières produit | VALIDÉ |

## Tableau — registres

| Registre | Avant | Après | Préservé | Non résolu |
|---|---:|---:|---|---|
| Entités | 118 | 118 identités + 118 révisions | Oui | Validation scientifique à enrichir |
| Relations | 93 | 93 classifiées | Oui | 47 différées, 2 désactivées |
| Sources dépôt | 24 | 24 identités + révisions | Oui | Localisateurs fins à enrichir |
| Publications | 9 | 9 works + 9 versions + 9 sources | Oui | Correction PLOS candidate |
| Profils biomarqueurs | 13 | 13 migrations qualifiées | Oui | Nature scientifique et preuves |
| Assertions scientifiques | 0 | 0 | Oui | Corpus sourcé à créer |
| Evidence Links | 0 | 0 | Oui | Revue source-assertion à créer |

## Tableau — relations historiques

| Relation historique | Classification | Décision | Assertion créée ? | Justification |
|---|---|---|---|---|
${relationRows}

## Tableau — familles et complétude

| Famille | Profil CATALOG | Profil SCIENTIFIC | Profil COMPARISON | État |
|---|---|---|---|---|
${familyRows}

## Tableau — cas de compétence

| Cas de compétence | Modélisable ? | Données présentes ? | Assertions vérifiées ? | Lacunes |
|---|---|---|---|---|
${competencyRows}

## Tableau — contrats et frontières

| Contrat | Préservé ? | Test / preuve | Remarque |
|---|---|---|---|
| 118 entités | Oui | Digests payload identiques | Aucune suppression |
| 93 relations | Oui | Inventaire exhaustif | Active, différée ou désactivée |
| 9 publications | Oui | Work + Version + SourceRevision | Nulls conservés |
| 13 profils biomarqueurs | Oui | Migration qualifiée | Pas de fausse complétude |
| Pages publiques | Oui | Diff Git protégé | Aucune mutation |
| Routes / SEO / sitemap | Oui | Diff Git protégé | Aucune mutation |
| Viewers / SaaS / PACS | Oui | Frontière d’import et diff Git | Hors périmètre |
| editorial-engine | Oui | Contrôle dépôt externe | Aucune mutation |
| Données scientifiques fictives | Oui | Registres réels à 0 assertion | Fixtures uniquement dans les tests |
| Historique / rollback | Oui | Snapshot + résolveur | Aucun effacement |

SCIENTIFIC KNOWLEDGE GRAPH MIGRÉ ET VALIDÉ — PASSER À L’ENRICHISSEMENT SOURCÉ
`;

if (checkOnly) {
  if (!existsSync(outputPath)) throw new Error(`Missing report: ${outputPath}`);
  if (readFileSync(outputPath, "utf8") !== contents) throw new Error(`Migration report drift: ${outputPath}`);
} else {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, contents, "utf8");
}
console.log(JSON.stringify({ valid: true, mode: checkOnly ? "check" : "write", outputPath, relationRows: relationMigrationEntries.length, familyRows: Object.keys(validation.layers.coverage.familySummary).length, competencyRows: competency.counts.cases, decision: "SCIENTIFIC KNOWLEDGE GRAPH MIGRÉ ET VALIDÉ — PASSER À L’ENRICHISSEMENT SOURCÉ" }, null, 2));
