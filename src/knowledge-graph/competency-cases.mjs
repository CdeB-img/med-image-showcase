import { entities } from "./catalog.mjs";
import { scientificModelContracts } from "./scientific-model-factories.mjs";
import { contextDimensionNames, evidenceLinkTypes } from "./scientific-model-schema.mjs";

const entityIds = new Set(entities.map((entity) => entity.entityId));
const hasEntity = (family, slug) => entityIds.has(`noxia:radiology:${family.toLowerCase()}:${slug}`);

const competency = ({ caseId, label, publicSiteUse, requiredContracts, requiredContextDimensions = [], requiredEvidenceLinkTypes = [], repositoryPresence, gaps }) => Object.freeze({
  caseId,
  label,
  publicSiteUse,
  fixturePolicy: "SYNTHETIC_REPRESENTABILITY_FIXTURE_ONLY",
  executableProductBehavior: false,
  requiredContracts: Object.freeze(requiredContracts),
  requiredContextDimensions: Object.freeze(requiredContextDimensions),
  requiredEvidenceLinkTypes: Object.freeze(requiredEvidenceLinkTypes),
  repositoryPresence: Object.freeze(repositoryPresence),
  gaps: Object.freeze(gaps),
});

export const competencyCases = Object.freeze([
  competency({
    caseId: "ecv-publication-query-3t",
    label: "Quelles publications portent sur l’ECV en IRM 3 T ?",
    publicSiteUse: "LITERATURE_SYNTHESIS",
    requiredContracts: ["ScientificAssertionRevision", "SourceRevision", "ApplicabilityContext", "EvidenceLink"],
    requiredContextDimensions: ["modality", "fieldStrength", "measurementMethod", "disease", "equipmentModel", "softwareVersion"],
    requiredEvidenceLinkTypes: ["SUPPORTS", "REFUTES", "QUALIFIES", "MENTIONS"],
    repositoryPresence: { mri: hasEntity("Modality", "irm"), ecv: hasEntity("Biomarker", "ecv"), fieldStrength: false, reviewedEvidence: false },
    gaps: ["FIELD_STRENGTH_DATA_ABSENT", "REVIEWED_EVIDENCE_ABSENT"],
  }),
  competency({
    caseId: "ct-ecv-publication-query",
    label: "Quelles publications décrivent l’ECV en CT, avec quelles méthodes et limites ?",
    publicSiteUse: "LITERATURE_SYNTHESIS",
    requiredContracts: ["ScientificAssertionRevision", "MeasurementDefinition", "MeasurementMethod", "SourceRevision", "ApplicabilityContext", "EvidenceLink"],
    requiredContextDimensions: ["modality", "measurementMethod", "protocol", "temporality", "equipmentModel", "softwareVersion"],
    requiredEvidenceLinkTypes: ["SUPPORTS", "REFUTES", "QUALIFIES", "MENTIONS"],
    repositoryPresence: { ct: hasEntity("Modality", "ct"), ecv: hasEntity("Biomarker", "ecv"), ctEcvMethod: false, reviewedEvidence: false },
    gaps: ["CT_ECV_METHOD_DATA_ABSENT", "REVIEWED_EVIDENCE_ABSENT"],
  }),
  competency({
    caseId: "myocarditis-protocol-descriptions",
    label: "Quels protocoles sont décrits pour la myocardite ?",
    publicSiteUse: "DOCUMENTARY_PROTOCOL_PAGE",
    requiredContracts: ["ProtocolConcept", "ProtocolDescriptionRevision", "ApplicabilityContext", "EvidenceLink"],
    requiredContextDimensions: ["disease", "modality", "protocol", "sequence"],
    requiredEvidenceLinkTypes: ["MENTIONS", "SUPPORTS", "QUALIFIES"],
    repositoryPresence: { myocarditis: false, protocolConcepts: false, reviewedEvidence: false },
    gaps: ["MYOCARDITIS_ABSENT", "DOCUMENTED_PROTOCOL_ABSENT", "REVIEWED_EVIDENCE_ABSENT"],
  }),
  competency({
    caseId: "molli-sasha-comparison",
    label: "Quelles différences sont rapportées entre MOLLI et SASHA ?",
    publicSiteUse: "TECHNIQUE_COMPARISON",
    requiredContracts: ["MeasurementMethod", "ScientificAssertionRevision", "ApplicabilityContext", "EvidenceLink"],
    requiredContextDimensions: ["sequence", "measurementMethod", "fieldStrength", "manufacturer", "softwareVersion"],
    requiredEvidenceLinkTypes: ["SUPPORTS", "REFUTES", "QUALIFIES"],
    repositoryPresence: { t1Mapping: hasEntity("Sequence", "t1-mapping"), molli: false, sasha: false, reviewedComparison: false },
    gaps: ["MOLLI_ABSENT", "SASHA_ABSENT", "REVIEWED_COMPARISON_ABSENT"],
  }),
  competency({
    caseId: "platform-limitations",
    label: "Quelles limites sont associées aux différentes plateformes ?",
    publicSiteUse: "TECHNICAL_FACT_SHEET",
    requiredContracts: ["Manufacturer", "EquipmentModel", "SoftwareVersion", "CapabilityStatement", "ScientificAssertionRevision", "EvidenceLink"],
    requiredContextDimensions: ["manufacturer", "productFamily", "equipmentModel", "softwareVersion"],
    requiredEvidenceLinkTypes: ["SUPPORTS", "QUALIFIES", "REFUTES"],
    repositoryPresence: { manufacturers: false, equipmentModels: false, softwareVersions: false, sourcedLimitations: false },
    gaps: ["MANUFACTURER_DATA_ABSENT", "EQUIPMENT_DATA_ABSENT", "SOURCED_LIMITATIONS_ABSENT"],
  }),
  competency({
    caseId: "corrected-publication-history",
    label: "Afficher une publication corrigée dans l’historique des connaissances",
    publicSiteUse: "KNOWLEDGE_HISTORY",
    requiredContracts: ["PublicationWork", "PublicationVersion", "SourceRevision", "EvidenceLink"],
    requiredEvidenceLinkTypes: ["CORRECTS", "RETRACTS", "MENTIONS"],
    repositoryPresence: { correctionPublication: hasEntity("Publication", "pone-0167668"), possibleOriginal: hasEntity("Publication", "pone-0161855"), explicitCorrectsLocator: false },
    gaps: ["EXPLICIT_CORRECTION_LOCATOR_ABSENT"],
  }),
  competency({
    caseId: "controversy-two-publications",
    label: "Présenter deux publications contradictoires sans effacer le désaccord",
    publicSiteUse: "CONTROVERSY_SUMMARY",
    requiredContracts: ["ScientificAssertionRevision", "SourceRevision", "EvidenceLink"],
    requiredEvidenceLinkTypes: ["SUPPORTS", "REFUTES", "QUALIFIES"],
    repositoryPresence: { publications: entities.filter((entity) => entity.entityType === "Publication").length, contradictoryEvidence: false },
    gaps: ["REVIEWED_ASSERTIONS_ABSENT", "CONTRADICTORY_EVIDENCE_ABSENT"],
  }),
  competency({
    caseId: "multilingual-polysemous-glossary",
    label: "Glossaire multilingue avec acronymes polysémiques",
    publicSiteUse: "GLOSSARY",
    requiredContracts: ["ConceptIdentity", "EntityRevision", "ConceptDesignation", "ExternalIdentifier"],
    repositoryPresence: { designations: true, sourcedLanguages: false, externalCodes: false },
    gaps: ["DESIGNATION_LANGUAGES_UNKNOWN", "EXTERNAL_CODES_ABSENT"],
  }),
  competency({
    caseId: "quantitative-biomarker-fact-sheet",
    label: "Fiche biomarqueur avec méthode, unité, limites et plages sourcées",
    publicSiteUse: "BIOMARKER_FACT_SHEET",
    requiredContracts: ["MeasurementDefinition", "MeasurementMethod", "ThresholdDefinition", "ReferenceRange", "ScientificAssertionRevision", "EvidenceLink"],
    requiredContextDimensions: ["population", "modality", "sequence", "measurementMethod", "temporality"],
    repositoryPresence: { biomarkers: entities.filter((entity) => entity.entityType === "Biomarker").length, sourcedUnits: false, sourcedThresholds: false, reviewedEvidence: false },
    gaps: ["SOURCED_UNITS_ABSENT", "SOURCED_THRESHOLDS_ABSENT", "REVIEWED_EVIDENCE_ABSENT"],
  }),
  competency({
    caseId: "dicom-documentary-tree",
    label: "Arbre documentaire DICOM : standard, partie, profil, SOP Class et conformité",
    publicSiteUse: "DOCUMENTARY_NAVIGATION_TREE",
    requiredContracts: ["Standard", "StandardPart", "StandardEdition", "Profile", "SOPClass", "TransferSyntax", "ConformanceStatement"],
    repositoryPresence: { dicomStandard: hasEntity("Standard", "dicom"), dicomFormat: hasEntity("Format", "dicom"), standardParts: false, conformanceDocuments: false },
    gaps: ["DICOM_EDITION_ABSENT", "STANDARD_PARTS_ABSENT", "CONFORMANCE_DOCUMENTS_ABSENT"],
  }),
  competency({
    caseId: "knowledge-state-seo-projection",
    label: "Projection déterministe vers état des connaissances, FAQ, navigation et données structurées",
    publicSiteUse: "PUBLIC_SITE_PROJECTION",
    requiredContracts: ["ScientificAssertionRevision", "EvidenceLink", "ApplicabilityContext", "ConceptDesignation"],
    requiredContextDimensions: ["population", "disease", "modality", "measurementMethod", "temporality"],
    requiredEvidenceLinkTypes: ["SUPPORTS", "REFUTES", "QUALIFIES", "MENTIONS"],
    repositoryPresence: { structuralGraph: true, reviewedAssertions: false, publicationApproval: false },
    gaps: ["REVIEWED_ASSERTIONS_ABSENT", "PUBLICATION_APPROVAL_ABSENT"],
  }),
]);

export const validateCompetencyModel = (cases = competencyCases) => {
  const results = cases.map((item) => {
    const missingContracts = item.requiredContracts.filter((contractName) => !scientificModelContracts[contractName]);
    const missingContextDimensions = item.requiredContextDimensions.filter((dimension) => !contextDimensionNames.includes(dimension));
    const missingEvidenceLinkTypes = item.requiredEvidenceLinkTypes.filter((linkType) => !evidenceLinkTypes.includes(linkType));
    return Object.freeze({
      caseId: item.caseId,
      publicSiteUse: item.publicSiteUse,
      modelRepresentable: missingContracts.length === 0 && missingContextDimensions.length === 0 && missingEvidenceLinkTypes.length === 0,
      missingContracts,
      missingContextDimensions,
      missingEvidenceLinkTypes,
      dataPresent: Object.values(item.repositoryPresence).every((value) => value === true || (typeof value === "number" && value > 0)),
      verifiedAssertions: item.repositoryPresence.reviewedEvidence === true || item.repositoryPresence.reviewedAssertions === true || item.repositoryPresence.contradictoryEvidence === true,
      gaps: [...item.gaps],
      executableProductBehavior: false,
    });
  });
  return { valid: results.every((result) => result.modelRepresentable && result.executableProductBehavior === false), results, counts: { cases: results.length, representable: results.filter((result) => result.modelRepresentable).length, dataComplete: results.filter((result) => result.dataPresent).length } };
};
