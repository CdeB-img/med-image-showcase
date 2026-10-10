import { templateDigest, containsTemplateToken, uniqueSorted } from "./canonical.js";
import { logicalDigest } from "../knowledge-engine/canonical.js";
import type { ProjectContextSnapshot } from "../research-project-construction/canonical-project-backbone.js";

/** Structural evidence only. No external protocol prose or regulatory clause is
 * copied. Dates refer to the retrieved source, not to a claim of current law. */
export const PROTOCOL_STRUCTURE_SOURCES = [
  { sourceId: "WHO_ERC_FORMAT", title: "Recommended format for a research protocol", institution: "WHO ERC",
    url: "https://www.who.int/groups/research-ethics-review-committee/recommended-format-for-a-research-protocol",
    category: "STRUCTURAL_GUIDELINE", versionDate: null, retrievedAt: "2026-10-09", verification: "PUBLIC_CONTENT_RETRIEVED",
    studyCategory: "Human research supported by WHO", structure: ["rationale", "design", "methods", "analysis", "quality", "ethics", "dissemination"],
    uniqueSections: ["anticipated difficulties", "project management"], rights: "UNKNOWN — structural observation only; no reproduced prose",
    limitations: "WHO review context, not an automatic French requirement; recommendations do not supply absent study decisions." },
  { sourceId: "NIH_PROTOCOL_INDEX", title: "Protocol Templates for Clinical Trials", institution: "NIH",
    url: "https://www.grants.nih.gov/policy-and-compliance/policy-topics/clinical-trials/protocol-template",
    category: "OFFICIAL_TEMPLATE", versionDate: "2024-08-16", retrievedAt: "2026-10-09", verification: "PUBLIC_INDEX_RETRIEVED_TEMPLATE_BODY_NOT_IMPORTED",
    studyCategory: "Phase 2/3 IND/IDE and behavioral/social research", structure: ["common protocol organization"],
    uniqueSections: ["separate template scope for IND/IDE and behavioral/social research"], rights: "UNKNOWN — no template text imported",
    limitations: "Recommended, not required by this NIH page; neither a universal clinical template nor French regulatory authority." },
  { sourceId: "SPIRIT_2025", title: "SPIRIT 2025 statement: Updated guideline for protocols of randomised trials", institution: "Chan et al., PLOS Medicine",
    url: "https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1004589",
    category: "STRUCTURAL_GUIDELINE", versionDate: "2025-04-28", retrievedAt: "2026-10-09", verification: "PUBLIC_CONTENT_RETRIEVED",
    studyCategory: "Randomised trials, principally two-group parallel design", structure: ["trial methods", "interventions/comparators", "harms", "analysis", "open science"],
    uniqueSections: ["allocation", "blinding", "patient/public involvement", "access to protocol and analysis plan"], rights: "CC BY — Chan et al. 2025; attribution retained; original NOXIA wording",
    limitations: "Reporting guidance, not certification of study design quality and not a mandate to randomise an observational study." },
  { sourceId: "RSNA_QIBA_STRUCTURE", title: "QIBA for Radiologists", institution: "RSNA QIBA",
    url: "https://qibawiki.rsna.org/index.php/QIBA_for_Radiologists", category: "HISTORICAL_REFERENCE",
    versionDate: "2019-10-15", retrievedAt: "2026-10-09", verification: "PUBLIC_CONTENT_RETRIEVED",
    studyCategory: "Quantitative imaging", structure: ["acquisition chain", "measurement reproducibility", "quality assurance"],
    uniqueSections: ["roles along imaging workflow", "profile conformance evidence"], rights: "UNKNOWN — general structural observation only",
    limitations: "No modality-specific performance claim, acquisition parameter or conformance mark is transferred to a NOXIA study." },
  { sourceId: "CHUSE_DRCI_INDEX", title: "Commission scientifique DRCI — procédure de soumission", institution: "CHU Saint-Étienne",
    url: "https://www.chu-st-etienne.fr/Professionnels/Recherche/Presentation_DRCI/Pro_Com_Scient_DRCI.asp",
    category: "INSTITUTIONAL_TEMPLATE", versionDate: null, retrievedAt: "2026-10-09", verification: "PUBLIC_INDEX_RETRIEVED_TEMPLATE_BODY_NOT_IMPORTED",
    studyCategory: "CHU-sponsored research", structure: ["protocol", "associated investigators/services", "supporting documents"],
    uniqueSections: ["local sponsor review"], rights: "UNKNOWN — no institutional clauses, contacts, logos or signatures imported",
    limitations: "A local submission page, not general law. Historical 2018–2019 private templates were not reread or silently declared current." },
] as const;

type Section = Readonly<{ sectionId: string; title: string; purpose: string; sourceIds: readonly string[] }>;
const section = (sectionId: string, title: string, purpose: string, sourceIds: readonly string[] = ["WHO_ERC_FORMAT"]): Section => ({ sectionId, title, purpose, sourceIds });
const COMMON_CORE = [
  section("IDENTITY", "Identification et maîtrise des versions", "Identité, portée de travail et responsabilités réellement connues ; aucun promoteur ou visa inventé."),
  section("RATIONALE", "Question, contexte et justification", "Question adoptée, lacune, preuves disponibles et limites ; bibliographie à vérifier si absente."),
  section("OBJECTIVES", "Objectifs et critères de jugement", "Hiérarchie adoptée, définition des mesures et inconnues ; aucune hypothèse directionnelle ajoutée."),
  section("DESIGN", "Plan d’étude et population", "Design, unité d’étude, sélection et critères réellement retenus ; ne pas confondre association et évolution individuelle."),
  section("PATHWAY", "Parcours des participants et recueil", "Recrutement, occasions de mesure et procédures adoptées ; calendrier non décidé conservé ouvert."),
  section("MEASURES", "Mesures, variables et évaluabilité", "Définitions, origines, dérivations et conditions d’évaluabilité issues des owners scientifiques/CDM."),
  section("ANALYSIS", "Analyse et dimensionnement", "Estimations, analyses, données manquantes et dimensionnement décidés ; aucune méthode, puissance ou seuil par défaut."),
  section("DATA", "Gestion des données et traçabilité", "Origines, codage, contrôles et accès définis ; aucun système institutionnel supposé."),
  section("QUALITY", "Qualité, biais et reproductibilité", "Limites pertinentes et procédures qualifiées ; distinguer besoin de contrôle et procédure adoptée."),
  section("SAFETY", "Sécurité et découvertes incidentes", "Risques et voies d’escalade réellement connus ; détails non fixés explicitement ouverts."),
  section("ETHICS", "Éthique et exigences applicables", "Restituer uniquement les exigences qualifiées par REG et les décisions adoptées ; aucune classification légale par le profil."),
  section("FEASIBILITY", "Organisation et faisabilité", "Responsabilités, ressources et contraintes connues ; ne pas inventer budget ni échéances."),
  section("DISSEMINATION", "Diffusion et références", "Politique retenue et références vérifiées, sans simuler de publication ou certification."),
  section("OPEN", "À définir avant gel du protocole", "Regrouper les inconnues techniques, scientifiques et institutionnelles sans les résoudre."),
];
const SUPPLEMENTS = {
  OBSERVATIONAL: [section("OBSERVATION", "Expositions, comparaisons et sélection", "Distinguer exposition observée, confusion et sélection ; aucune causalité ou groupe témoin ajouté.")],
  COHORT: [section("COHORT_ORIGIN", "Origine et suivi de la cohorte", "Origine temporelle, mesures répétées, pertes de suivi et fenêtres effectivement retenues ; pas de durée par défaut.")],
  INTERVENTIONAL: [section("INTERVENTIONS", "Interventions et comparateurs", "Modalités retenues, observance et co-interventions ; distinguer inconnu et non applicable.", ["SPIRIT_2025", "NIH_PROTOCOL_INDEX"]),
    section("ALLOCATION", "Allocation et connaissance des groupes, si applicables", "Décrire uniquement les mécanismes adoptés ; ne pas imposer randomisation, aveugle ou placebo.", ["SPIRIT_2025"]),
    section("HARMS", "Surveillance de l’intervention", "Recueil des événements et règles de suivi décidées ; aucune règle d’arrêt ou comité inventé.", ["SPIRIT_2025"])],
  IMAGING: [section("ACQUISITION", "Acquisition et chaîne d’imagerie", "Modalité, couverture, appariements et chronologie retenus ; séquences et doses ouvertes restent ouvertes.", ["RSNA_QIBA_STRUCTURE"]),
    section("READING", "Lecture, analyse et qualité des images", "Rôles, segmentation, contrôle et répétabilité décidés ; aucune conformité QIBA ou performance chiffrée revendiquée.", ["RSNA_QIBA_STRUCTURE"])],
} as const;

/** Original conditional TMP structure. It reads the existing governed Project
 * snapshot through TMP's normalizer; it never qualifies regulatory status. */
export const composeProtocolWritingProfile = (project: Readonly<ProjectContextSnapshot>) => {
  const { snapshotDigest, ...materialSnapshot } = project;
  if (project.owner !== "RESEARCH_PROJECT" || !project.readOnly || logicalDigest(materialSnapshot) !== snapshotDigest)
    throw new Error("TMP_PROTOCOL_PROFILE_BINDING_MISMATCH");
  // Epistemic qualification and Project adoption are independent axes. An
  // explicitly adopted assumption may guide structure without becoming KNOWN.
  // Unbound assumptions, unknowns and withheld/negated inputs cannot activate it.
  const eligible = project.objects.filter(object => (!object.polarity || object.polarity === "AFFIRMED") &&
    (object.epistemicState === "KNOWN" || object.epistemicState === "ASSUMED" &&
      project.decisionLedger.some(decision => object.decisionRefs.includes(decision.humanDecisionRef) &&
        decision.objectRefs.includes(object.stableId))));
  const designs = eligible.filter(object => object.type === "STUDY_DESIGN");
  const texts = designs.flatMap(object => [object.content, object.scientificRole ?? ""]);
  const imaging = eligible.filter(object => ["IMAGING_MODALITY", "ACQUISITION"].includes(object.type));
  // Reuse TMP's token normalizer on explicit adopted design objects only. This
  // chooses writing sections, not a new design or a regulatory qualification.
  const selected = [
    ...(containsTemplateToken(texts, ["observational", "observationnelle", "observationnel", "cohort", "cohorte"]) ? ["OBSERVATIONAL" as const] : []),
    ...(containsTemplateToken(texts, ["cohort", "cohorte"]) ? ["COHORT" as const] : []),
    ...(containsTemplateToken(texts, ["interventional", "interventionnelle", "interventionnel"]) ? ["INTERVENTIONAL" as const] : []),
    ...(imaging.length ? ["IMAGING" as const] : []),
  ];
  const sections = [...COMMON_CORE, ...selected.flatMap(id => SUPPLEMENTS[id])];
  const material = { contract: "TMP_ORIGINAL_PROTOCOL_WRITING_PROFILE_V1", version: "1.0.0", owner: "TMP-001",
    project: { projectId: project.sourceProjectRef, projectVersion: project.sourceProjectVersion, projectDigest: project.sourceProjectDigest },
    sourceSnapshotDigest: project.snapshotDigest, profiles: ["COMMON_CORE", ...selected], sections,
    sourceIds: uniqueSorted(sections.flatMap(value => value.sourceIds)),
    basisRefs: uniqueSorted([...designs, ...imaging].map(value => value.versionRef)),
    boundary: "ORIGINAL_STRUCTURE_ONLY_NOT_SCIENTIFIC_OR_REGULATORY_AUTHORITY" } as const;
  return { ...material, profileDigest: templateDigest(material) };
};
