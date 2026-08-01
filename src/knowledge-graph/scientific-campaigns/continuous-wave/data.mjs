import { sha256Digest } from "../../migration/stable-json.mjs";
import { createStructuredLiteratureSynthesis } from "../../structured-synthesis.mjs";
import { campaignDefinitionIdForNode } from "../../knowledge-catalog/campaign-contracts.mjs";

export const CONTINUOUS_WAVE_VERSION = "1.0.0";
export const CONTINUOUS_WAVE_AT = "2026-08-01T00:00:00.000Z";
export const CONTINUOUS_WAVE_REVIEWER = "noxia-scientific-campaign-engine";
export const CONTINUOUS_WAVE_REVIEW_TYPE = "automatedScientificReview";
export const CONTINUOUS_WAVE_ADAPTER_ID = "noxia:scientific-campaign-adapter:catalog-domain-package:v1";

export const CONTINUOUS_WAVE_LIMITS = Object.freeze({
  campaigns: 5,
  assertions: 200,
  evidenceLinks: 500,
  retainedNewSources: 60,
});

export const CONTINUOUS_WAVE_PUBLICATION_GUARDS = Object.freeze({
  route: null,
  canonical: null,
  indexable: false,
  inSitemap: false,
  rendered: false,
  publicNavigation: false,
  publicPublication: false,
  internalOnly: true,
});

const freeze = (value) => Object.freeze(value);
const unique = (values = []) => [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
const nodeIdForDomain = (domainId) => `noxia:knowledge-catalog:domain:${domainId}`;
const campaignIdForDomain = (domainId) => campaignDefinitionIdForNode(nodeIdForDomain(domainId));

const sourceRows = [
  // Segmentation
  ["segmentation", "38347141", "PMC11182665", "10.1038/s41592-023-02151-z", "Metrics reloaded: recommendations for image analysis validation.", ["Maier-Hein L", "Reinke A", "Godau P", "Tizabi MD", "Buettner F", "Christodoulou E", "Glocker B", "Isensee F", "Kleesiek J", "Kozubek M", "Reyes M", "Riegler MA", "Wiesenfarth M", "Kavur AE", "Sudre CH", "Baumgartner M", "Eisenmann M", "Heckmann-Nötzel D", "Rädsch T", "Acion L", "Antonelli M", "Arbel T", "Bakas S", "Benis A", "Blaschko MB", "Cardoso MJ", "Cheplygina V", "Cimini BA", "Collins GS", "Farahani K", "Ferrer L", "Galdran A", "van Ginneken B", "Haase R", "Hashimoto DA", "Hoffman MM", "Huisman M", "Jannin P", "Kahn CE", "Kainmueller D", "Kainz B", "Karargyris A", "Karthikesalingam A", "Kofler F", "Kopp-Schneider A", "Kreshuk A", "Kurc T", "Landman BA", "Litjens G", "Madani A", "Maier-Hein K", "Martel AL", "Mattson P", "Meijering E", "Menze B", "Moons KGM", "Müller H", "Nichyporuk B", "Nickel F", "Petersen J", "Rajpoot N", "Rieke N", "Saez-Rodriguez J", "Sánchez CI", "Shetty S", "van Smeden M", "Summers RM", "Taha AA", "Tiulpin A", "Tsaftaris SA", "Van Calster B", "Varoquaux G", "Jäger PF"], "Nature methods", "2024-02-01", "21", "2", "195-212", "CONSENSUS_RECOMMENDATIONS"],
  ["segmentation", "26263899", "PMC4533825", "10.1186/s12880-015-0068-x", "Metrics for evaluating 3D medical image segmentation: analysis, selection, and tool.", ["Taha AA", "Hanbury A"], "BMC medical imaging", "2015-08-12", "15", null, "29", "METHOD_ANALYSIS"],
  ["segmentation", "15250643", "PMC1283110", "10.1109/TMI.2004.828354", "Simultaneous truth and performance level estimation (STAPLE): an algorithm for the validation of image segmentation.", ["Warfield SK", "Zou KH", "Wells WM"], "IEEE transactions on medical imaging", "2004-07-01", "23", "7", "903-21", "METHOD_VALIDATION"],
  ["segmentation", "35840566", "PMC9287542", "10.1038/s41467-022-30695-9", "The Medical Segmentation Decathlon.", ["Antonelli M", "Reinke A", "Bakas S", "Farahani K", "Kopp-Schneider A", "Landman BA", "Litjens G", "Menze B", "Ronneberger O", "Summers RM", "van Ginneken B", "Bilello M", "Bilic P", "Christ PF", "Do RKG", "Gollub MJ", "Heckers SH", "Huisman H", "Jarnagin WR", "McHugo MK", "Napel S", "Pernicka JSG", "Rhode K", "Tobon-Gomez C", "Vorontsov E", "Meakin JA", "Ourselin S", "Wiesenfarth M", "Arbeláez P", "Bae B", "Chen S", "Daza L", "Feng J", "He B", "Isensee F", "Ji Y", "Jia F", "Kim I", "Maier-Hein K", "Merhof D", "Pai A", "Park B", "Perslev M", "Rezaiifar R", "Rippel O", "Sarasua I", "Shen W", "Son J", "Wachinger C", "Wang L", "Wang Y", "Xia Y", "Xu D", "Xu Z", "Zheng Y", "Simpson AL", "Maier-Hein L", "Cardoso MJ"], "Nature communications", "2022-07-15", "13", "1", "4128", "MULTITASK_BENCHMARK"],
  ["segmentation", "37008654", "PMC10062409", "10.1109/access.2023.3249759", "Assessing Inter-Annotator Agreement for Medical Image Segmentation.", ["Yang F", "Zamzmi G", "Angara S", "Rajaraman S", "Aquilina A", "Xue Z", "Jaeger S", "Papagiannakis E", "Antani SK"], "IEEE access : practical innovations, open solutions", "2023-01-01", "11", null, "21300-21312", "METHOD_STUDY"],

  // T2 mapping (the SCMR/EACVI consensus PMID 28992817 is reused from P4R)
  ["t2-mapping", "35600490", "PMC9120534", "10.3389/fcvm.2022.876475", "The Road Toward Reproducibility of Parametric Mapping of the Heart: A Technical Review.", ["Ogier AC", "Bustin A", "Cochet H", "Schwitter J", "van Heeswijk RB"], "Frontiers in cardiovascular medicine", "2022-05-06", "9", null, "876475", "TECHNICAL_REVIEW"],
  ["t2-mapping", "32460852", "PMC7254724", "10.1186/s12968-020-00619-x", "Cardiac T2 mapping: robustness and homogeneity of standardized in-line analysis.", ["Wiesmueller M", "Wuest W", "Heiss R", "Treutlein C", "Uder M", "May MS"], "Journal of cardiovascular magnetic resonance", "2020-05-28", "22", "1", "39", "TECHNICAL_VALIDATION"],
  ["t2-mapping", "36935515", "PMC10026458", "10.1186/s12968-023-00926-z", "Developing a medical device-grade T2 phantom optimized for myocardial T2 mapping by cardiovascular magnetic resonance.", ["Topriceanu CC", "Fornasiero M", "Seo H", "Webber M", "Keenan KE", "Stupic KF", "Bruehl R", "Ittermann B", "Price K", "McGrath L", "Pang W", "Hughes AD", "Nezafat R", "Kellman P", "Pierce I", "Moon JC", "Captur G"], "Journal of cardiovascular magnetic resonance", "2023-03-20", "25", "1", "19", "PHANTOM_VALIDATION"],
  ["t2-mapping", "35659266", "PMC9167641", "10.1186/s12968-022-00866-0", "T2 mapping in myocardial disease: a comprehensive review.", ["O'Brien AT", "Gil KE", "Varghese J", "Simonetti OP", "Zareba KM"], "Journal of cardiovascular magnetic resonance", "2022-06-06", "24", "1", "33", "TECHNICAL_CLINICAL_REVIEW"],

  // Quality control (the QIBA ADC profile PMID 39377680 is reused from P5)
  ["quality-control", "26267831", "PMC4666097", "10.1148/radiol.2015142202", "Metrology Standards for Quantitative Imaging Biomarkers.", ["Sullivan DC", "Obuchowski NA", "Kessler LG", "Raunig DL", "Gatsonis C", "Huang EP", "Kondratovich M", "McShane LM", "Reeves AP", "Barboriak DP", "Guimaraes AR", "Wahl RL", "RSNA-QIBA Metrology Working Group"], "Radiology", "2015-12-01", "277", "3", "813-25", "METROLOGY_STANDARD"],
  ["quality-control", "24919831", "PMC5574197", "10.1177/0962280214537344", "Quantitative imaging biomarkers: a review of statistical methods for technical performance assessment.", ["Raunig DL", "McShane LM", "Pennello G", "Gatsonis C", "Carson PL", "Voyvodic JT", "Wahl RL", "Kurland BF", "Schwarz AJ", "Gönen M", "Zahlmann G", "Kondratovich MV", "O'Donnell K", "Petrick N", "Cole PE", "Garra B", "Sullivan DC", "QIBA Technical Performance Working Group"], "Statistical methods in medical research", "2015-02-01", "24", "1", "27-67", "METROLOGY_METHOD_REVIEW"],
  ["quality-control", "39656118", "PMC11694077", "10.1148/radiol.232555", "The QIBA Profile for Dynamic Susceptibility Contrast MRI Quantitative Imaging Biomarkers for Assessing Gliomas.", ["Shiroishi MS", "Erickson BJ", "Hu LS", "Barboriak DP", "Becerra L", "Bell LC", "Boss MA", "Boxerman JL", "Cen S", "Cimino L", "Fan Z", "Keenan KE", "Kirsch JE", "Ameli N", "Nazemi S", "Quarles CC", "Rosen MA", "Rodriguez L", "Schmainda KM", "Zahlmann G", "Zhou Y", "Obuchowski N", "Wu O", "RSNA QIBA Dynamic Susceptibility Contrast MRI Biomarker Committee"], "Radiology", "2024-12-01", "313", "3", "e232555", "QIBA_PROFILE"],
  ["quality-control", "34455593", "PMC8882689", "10.1002/mp.15195", "Challenges in ensuring the generalizability of image quantitation methods for MRI.", ["Keenan KE", "Delfino JG", "Jordanova KV", "Poorman ME", "Chirra P", "Chaudhari AS", "Baessler B", "Winfield J", "Viswanath SE", "deSouza NM"], "Medical physics", "2022-04-01", "49", "4", "2820-2835", "TECHNICAL_REVIEW"],

  // Neuro-oncology (the QIBA DSC profile above is shared with quality control)
  ["neuro-oncology", "37774317", "PMC10860967", "10.1200/JCO.23.01059", "RANO 2.0: Update to the Response Assessment in Neuro-Oncology Criteria for High- and Low-Grade Gliomas in Adults.", ["Wen PY", "van den Bent M", "Youssef G", "Cloughesy TF", "Ellingson BM", "Weller M", "Galanis E", "Barboriak DP", "de Groot J", "Gilbert MR", "Huang R", "Lassman AB", "Mehta M", "Molinaro AM", "Preusser M", "Rahman R", "Shankar LK", "Stupp R", "Villanueva-Meyer JE", "Wick W", "Macdonald DR", "Reardon DA", "Vogelbaum MA", "Chang SM"], "Journal of clinical oncology", "2023-11-20", "41", "33", "5187-5199", "CONSENSUS_CRITERIA"],
  ["neuro-oncology", "26250565", "PMC4588759", "10.1093/neuonc/nov095", "Consensus recommendations for a standardized Brain Tumor Imaging Protocol in clinical trials.", ["Ellingson BM", "Bendszus M", "Boxerman J", "Barboriak D", "Erickson BJ", "Smits M", "Nelson SJ", "Gerstner E", "Alexander B", "Goldmacher G", "Wick W", "Vogelbaum M", "Weller M", "Galanis E", "Kalpathy-Cramer J", "Shankar L", "Jacobs P", "Pope WB", "Yang D", "Chung C", "Knopp MV", "Cha S", "van den Bent MJ", "Chang S", "Yung WK", "Cloughesy TF", "Wen PY", "Gilbert MR", "Jumpstarting Brain Tumor Drug Development Coalition Imaging Standardization Steering Committee"], "Neuro-oncology", "2015-09-01", "17", "9", "1188-98", "CONSENSUS_PROTOCOL"],
  ["neuro-oncology", "32516388", "PMC7523451", "10.1093/neuonc/noaa141", "Consensus recommendations for a dynamic susceptibility contrast MRI protocol for use in high-grade gliomas.", ["Boxerman JL", "Quarles CC", "Hu LS", "Erickson BJ", "Gerstner ER", "Smits M", "Kaufmann TJ", "Barboriak DP", "Huang RH", "Wick W", "Weller M", "Galanis E", "Kalpathy-Cramer J", "Shankar L", "Jacobs P", "Chung C", "van den Bent MJ", "Chang S", "Al Yung WK", "Cloughesy TF", "Wen PY", "Gilbert MR", "Rosen BR", "Ellingson BM", "Schmainda KM", "Jumpstarting Brain Tumor Drug Development Coalition Imaging Standardization Steering Committee"], "Neuro-oncology", "2020-09-29", "22", "9", "1262-1275", "CONSENSUS_PROTOCOL"],
  ["neuro-oncology", "30519867", "PMC6351513", "10.1007/s00259-018-4207-9", "Joint EANM/EANO/RANO practice guidelines/SNMMI procedure standards for imaging of gliomas using PET with radiolabelled amino acids and [18F]FDG: version 1.0.", ["Law I", "Albert NL", "Arbizu J", "Boellaard R", "Drzezga A", "Galldiks N", "la Fougère C", "Langen KJ", "Lopci E", "Lowe V", "McConathy J", "Quick HH", "Sattler B", "Schuster DM", "Tonn JC", "Weller M"], "European journal of nuclear medicine and molecular imaging", "2019-03-01", "46", "3", "540-557", "JOINT_SOCIETY_GUIDELINE"],

  // OEF / CMRO2
  ["oef-cmro2", "32634594", "PMC7592419", "10.1016/j.neuroimage.2020.117136", "Quantification of brain oxygen extraction and metabolism with [15O]-gas PET: A technical review in the era of PET/MRI.", ["Fan AP", "An H", "Moradi F", "Rosenberg J", "Ishii Y", "Nariai T", "Okazawa H", "Zaharchuk G"], "NeuroImage", "2020-10-15", "220", null, "117136", "TECHNICAL_REVIEW"],
  ["oef-cmro2", "20700768", "PMC3128261", "10.1007/s11307-010-0382-1", "Day-to-day test-retest variability of CBF, CMRO2, and OEF measurements using dynamic 15O PET studies.", ["Bremmer JP", "van Berckel BN", "Persoon S", "Kappelle LJ", "Lammertsma AA", "Kloet R", "Luurtsema G", "Rijbroek A", "Klijn CJ", "Boellaard R"], "Molecular imaging and biology", "2011-08-01", "13", "4", "759-68", "TEST_RETEST_STUDY"],
  ["oef-cmro2", "32643207", "PMC9973312", "10.1002/mrm.28410", "Validation of T2-based oxygen extraction fraction measurement with 15O positron emission tomography.", ["Jiang D", "Deng S", "Franklin CG", "O'Boyle M", "Zhang W", "Heyl BL", "Pan L", "Jerabek PA", "Fox PT", "Lu H"], "Magnetic resonance in medicine", "2021-01-01", "85", "1", "290-297", "CROSS_MODALITY_VALIDATION"],
  ["oef-cmro2", "33243071", "PMC8221765", "10.1177/0271678X20973951", "Cerebral oxygen extraction fraction (OEF): Comparison of challenge-free gradient echo QSM+qBOLD (QQ) with 15O PET in healthy adults.", ["Cho J", "Lee J", "An H", "Goyal MS", "Su Y", "Wang Y"], "Journal of cerebral blood flow and metabolism", "2021-07-01", "41", "7", "1658-1668", "CROSS_MODALITY_VALIDATION"],
  ["oef-cmro2", "22517498", "PMC3404231", "10.1002/mrm.24295", "Test-retest reproducibility of a rapid method to measure brain oxygen metabolism.", ["Liu P", "Xu F", "Lu H"], "Magnetic resonance in medicine", "2013-03-01", "69", "3", "675-81", "TEST_RETEST_STUDY"],
];

const sourceRecord = ([domainId, pmid, pmcid, doi, title, authors, journal, publishedAt, volume, issue, pages, sourceType]) => {
  const stableId = `noxia:scientific-source:pubmed:${pmid}`;
  const revisionId = `${stableId}:revision:1`;
  const material = { domainId, pmid, pmcid, doi, title, authors, journal, publishedAt, volume, issue, pages, sourceType };
  return freeze({
    recordType: "SourceRevision",
    stableId,
    revisionId,
    revisionNumber: 1,
    domainId,
    pmid,
    pmcid,
    doi,
    title,
    authors: freeze(authors),
    journal,
    publishedAt,
    volume,
    issue,
    pages,
    language: "en",
    sourceType,
    documentStatus: "CURRENT",
    fullTextAvailability: "OFFICIAL_FULL_TEXT",
    abstractOnly: false,
    officialMetadataUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    officialFullTextUrl: `https://pmc.ncbi.nlm.nih.gov/articles/${pmcid}/`,
    metadataAuthority: "NCBI_PUBMED_ESUMMARY_V2",
    authorsCompleteness: "COMPLETE_FROM_PUBMED",
    retrievedAt: CONTINUOUS_WAVE_AT,
    contentDigest: null,
    contentDigestStatus: "OFFICIAL_URL_AND_PRECISE_LOCATOR_RETAINED",
    digest: sha256Digest(material),
  });
};

export const continuousWaveSourceRevisions = freeze(sourceRows.map(sourceRecord).sort((a, b) => a.revisionId.localeCompare(b.revisionId)));

export const CONTINUOUS_WAVE_REUSED_SOURCES = freeze({
  "28992817": freeze({
    stableId: "noxia:radiology:source:pubmed:28992817",
    revisionId: "noxia:radiology:source:pubmed:28992817:revision:2",
    domainId: "t2-mapping",
    pmid: "28992817",
    pmcid: "PMC5633041",
    publishedAt: "2017-10-09",
    sourceType: "CONSENSUS",
    fullTextAvailability: "PMC_FULL_TEXT",
  }),
  "39377680": freeze({
    stableId: "noxia:scientific-source:pubmed:39377680",
    revisionId: "noxia:scientific-source:pubmed:39377680:revision:1",
    domainId: "quality-control",
    pmid: "39377680",
    pmcid: "PMC11537247",
    publishedAt: "2024-10-01",
    sourceType: "QIBA_PROFILE",
    fullTextAvailability: "OFFICIAL_FULL_TEXT",
  }),
});

const sourceByPmid = new Map([
  ...continuousWaveSourceRevisions.map((source) => [source.pmid, source]),
  ...Object.entries(CONTINUOUS_WAVE_REUSED_SOURCES),
]);

export const continuousWaveInternalSourceAudit = freeze([
  freeze({ path: "src/knowledge-graph/catalog.mjs", type: "HISTORICAL_KNOWLEDGE_INVENTORY", decision: "CONCEPT_DISCOVERY_ONLY_NOT_EVIDENCE" }),
  freeze({ path: "src/knowledge-graph/scientific-multidomain/generality.mjs", type: "CATALOG_ROADMAP", decision: "CAMPAIGN_PLANNING_SIGNAL_ONLY" }),
  freeze({ path: "src/pages/SegmentationIRM.tsx", type: "PUBLIC_PAGE", decision: "VOCABULARY_INVENTORY_ONLY_NOT_SCIENTIFIC_EVIDENCE" }),
  freeze({ path: "src/pages/IRMImagerieQuantitative.tsx", type: "PUBLIC_PAGE", decision: "VOCABULARY_INVENTORY_ONLY_NOT_SCIENTIFIC_EVIDENCE" }),
  freeze({ path: "src/pages/MethodologieImagerieQuantitative.tsx", type: "PUBLIC_PAGE", decision: "VOCABULARY_INVENTORY_ONLY_NOT_SCIENTIFIC_EVIDENCE" }),
  freeze({ path: "src/pages/OEFImagerie.tsx", type: "PUBLIC_PAGE", decision: "VOCABULARY_INVENTORY_ONLY_NOT_SCIENTIFIC_EVIDENCE" }),
  freeze({ path: "src/pages/CMRO2Imagerie.tsx", type: "PUBLIC_PAGE", decision: "VOCABULARY_INVENTORY_ONLY_NOT_SCIENTIFIC_EVIDENCE" }),
]);

export const continuousWaveRejectedSources = freeze([
  freeze({ domainId: "segmentation", sourceRef: "INTERNAL_PUBLIC_PAGE:src/pages/SegmentationIRM.tsx", reason: "PUBLIC_MARKETING_CONTENT_IS_NOT_PRIMARY_SCIENTIFIC_EVIDENCE" }),
  freeze({ domainId: "t2-mapping", sourceRef: "INTERNAL_PUBLIC_PAGE:src/pages/IRMImagerieQuantitative.tsx", reason: "PUBLIC_PAGE_DOES_NOT_PROVIDE_LOCALIZED_PRIMARY_EVIDENCE" }),
  freeze({ domainId: "quality-control", sourceRef: "INTERNAL_PUBLIC_PAGE:src/pages/MethodologieImagerieQuantitative.tsx", reason: "PUBLIC_PAGE_IS_NOT_A_METROLOGY_STANDARD" }),
  freeze({ domainId: "neuro-oncology", sourceRef: "INTERNAL_VIEWER:src/components/NeuroOncoViewer.tsx", reason: "PRODUCT_VISUALIZATION_IS_NOT_SCIENTIFIC_EVIDENCE" }),
  freeze({ domainId: "oef-cmro2", sourceRef: "INTERNAL_PUBLIC_PAGE:src/pages/OEFImagerie.tsx", reason: "PUBLIC_PAGE_IS_VOCABULARY_INVENTORY_ONLY" }),
]);

const conceptDefinitions = Object.freeze({
  segmentation: [
    ["medical-image-segmentation", "Segmentation d'image médicale", "SoftwareMethod", "Délimitation ou attribution de classes à des régions d'une image médicale.", "35840566", ["medical image segmentation"]],
    ["overlap-metric", "Métrique de recouvrement", "QualityMetric", "Famille de métriques comparant le recouvrement de segmentations sans représenter à elle seule toutes les propriétés de forme ou de distance.", "26263899", ["overlap metric"]],
    ["dice-similarity-coefficient", "Coefficient de similarité de Dice", "QualityMetric", "Métrique de recouvrement utilisée pour comparer deux segmentations.", "38347141", ["Dice", "DSC"]],
    ["boundary-metric", "Métrique de frontière", "QualityMetric", "Métrique évaluant des propriétés spatiales de contour ou de distance entre segmentations.", "38347141", ["boundary metric", "distance metric"]],
    ["reference-annotation", "Annotation de référence", "Observation", "Annotation utilisée comme référence explicite pour l'évaluation d'une segmentation, avec ses incertitudes et sa provenance.", "37008654", ["reference segmentation"]],
    ["staple-consensus", "Estimation consensuelle STAPLE", "SoftwareMethod", "Estimation probabiliste d'une segmentation de référence et des performances des segmentations d'entrée.", "15250643", ["STAPLE"]],
    ["inter-annotator-agreement", "Accord inter-annotateurs", "QualityMetric", "Accord observé entre plusieurs annotations indépendantes d'une même cible de segmentation.", "37008654", ["inter-annotator agreement"]],
    ["task-generalizability", "Généralisabilité entre tâches", "QualityAttribute", "Capacité documentée d'une méthode à conserver des performances sur des tâches ou jeux de données distincts de son contexte initial.", "35840566", ["cross-task generalizability"]],
  ],
  "t2-mapping": [
    ["myocardial-t2-mapping", "Mapping T2 myocardique", "MeasurementMethod", "Méthode quantitative produisant une carte de T2 myocardique à partir de plusieurs pondérations T2.", "35659266", ["myocardial T2 mapping"]],
    ["myocardial-t2", "T2 myocardique", "Biomarker", "Temps de relaxation transverse myocardique mesuré dans un contexte de méthode, de champ et de séquence documenté.", "35659266", ["myocardial T2"]],
    ["t2-prepared-bssfp", "T2-prepared bSSFP", "SequenceFamily", "Famille d'acquisition bright-blood combinant une préparation T2 et une lecture bSSFP.", "28992817", ["T2-prep bSSFP"]],
    ["t2-prepared-gre", "T2-prepared GRE", "SequenceFamily", "Famille d'acquisition combinant une préparation T2 et une lecture en écho de gradient.", "28992817", ["T2-prep GRE"]],
    ["grase-t2-mapping", "GraSE T2 mapping", "SequenceFamily", "Famille hybride gradient-and-spin-echo utilisée pour le mapping T2 myocardique.", "35659266", ["GraSE"]],
    ["t2-mapping-phantom", "Fantôme de mapping T2", "QualityControlObject", "Objet physique stable conçu pour l'assurance qualité longitudinale du mapping T2.", "36935515", ["T2 phantom"]],
    ["local-t2-reference-range", "Référence T2 locale", "MeasurementDefinition", "Référence issue d'une méthode, d'un champ, d'un scanner et d'une population locale documentés.", "28992817", ["local T2 reference"]],
    ["motion-misregistration", "Mauvais recalage lié au mouvement", "Limitation", "Désalignement entre images sources de pondérations différentes pouvant altérer une carte T2.", "35659266", ["motion misregistration"]],
    ["t2-interscanner-reproducibility", "Reproductibilité interscanner du T2", "QualityMetric", "Variabilité des mesures T2 entre scanners dans les conditions définies par une étude.", "32460852", ["T2 interscanner reproducibility"]],
  ],
  "quality-control": [
    ["quantitative-imaging-biomarker", "Biomarqueur quantitatif d'imagerie", "Biomarker", "Caractéristique mesurée quantitativement à partir d'une image selon une procédure définie.", "26267831", ["QIB"]],
    ["technical-performance", "Performance technique", "QualityAttribute", "Performance d'un mesurage d'imagerie sous des conditions explicitement définies.", "24919831", ["technical performance"]],
    ["measurement-bias", "Biais de mesure", "QualityMetric", "Différence entre l'espérance des mesures et une valeur vraie ou de référence qualifiée.", "26267831", ["bias"]],
    ["measurement-precision", "Précision de mesure", "QualityMetric", "Variabilité de mesures répétées autour de leur valeur attendue dans des conditions spécifiées.", "26267831", ["precision"]],
    ["measurement-repeatability", "Répétabilité", "QualityMetric", "Variabilité de mesures répétées sous des conditions identiques ou presque identiques.", "24919831", ["repeatability"]],
    ["measurement-reproducibility", "Reproductibilité", "QualityMetric", "Variabilité de mesures répétées lorsque des conditions pertinentes varient.", "24919831", ["reproducibility"]],
    ["measurement-agreement", "Accord entre mesures", "QualityMetric", "Proximité entre mesures dont l'évaluation ne peut pas être remplacée par la seule corrélation.", "26267831", ["agreement"]],
    ["quantitative-imaging-quality-assurance", "Assurance qualité de l'imagerie quantitative", "QualityMethod", "Surveillance documentée de la stabilité, du biais et de la variabilité d'une chaîne de mesure d'imagerie.", "34455593", ["quantitative imaging QA"]],
    ["reference-phantom", "Fantôme de référence", "QualityControlObject", "Objet physique ou numérique possédant des propriétés qualifiées pour l'évaluation d'une procédure de mesure.", "26267831", ["reference phantom"]],
  ],
  "neuro-oncology": [
    ["adult-glioma", "Gliome de l'adulte", "Disease", "Tumeur gliale de l'adulte couverte par des critères et protocoles documentaires de neuro-oncologie.", "37774317", ["adult glioma"]],
    ["rano-2", "RANO 2.0", "Guideline", "Critères actualisés de réponse et de progression pour les gliomes de haut et bas grade chez l'adulte.", "37774317", ["RANO 2.0"]],
    ["pseudoprogression", "Pseudoprogression", "Finding", "Modification d'imagerie post-thérapeutique pouvant simuler une progression tumorale sans progression confirmée.", "37774317", ["pseudoprogression"]],
    ["brain-tumor-imaging-protocol", "Brain Tumor Imaging Protocol", "Standard", "Protocole IRM consensuel visant des acquisitions comparables dans les essais de tumeurs cérébrales.", "26250565", ["BTIP"]],
    ["dsc-mri", "IRM de perfusion DSC", "AcquisitionMethod", "Acquisition par contraste de susceptibilité dynamique utilisée pour estimer des paramètres de perfusion cérébrale.", "32516388", ["DSC-MRI"]],
    ["relative-cerebral-blood-volume", "Volume sanguin cérébral relatif", "DerivedMeasurement", "Mesure relative de perfusion dérivée d'une acquisition DSC et d'un traitement documenté.", "39656118", ["rCBV"]],
    ["dsc-leakage-correction", "Correction de fuite DSC", "MeasurementMethod", "Correction post-traitement des effets de fuite du produit de contraste dans les courbes DSC.", "32516388", ["leakage correction"]],
    ["amino-acid-pet-glioma", "TEP aux acides aminés des gliomes", "AcquisitionMethod", "Imagerie TEP des gliomes utilisant un radiotraceur d'acide aminé documenté.", "30519867", ["amino acid PET"]],
    ["fdg-pet-glioma", "TEP-FDG des gliomes", "AcquisitionMethod", "Imagerie TEP-FDG appliquée aux gliomes dans des contextes documentés.", "30519867", ["FDG PET"]],
  ],
  "oef-cmro2": [
    ["cerebral-oef", "Fraction d'extraction cérébrale de l'oxygène", "DerivedMeasurement", "Fraction de l'oxygène artériel extraite par le tissu cérébral selon une méthode définie.", "32634594", ["OEF"]],
    ["cerebral-cmro2", "Débit métabolique cérébral de consommation d'oxygène", "DerivedMeasurement", "Consommation cérébrale d'oxygène rapportée à une masse de tissu et au temps selon une méthode définie.", "32634594", ["CMRO2"]],
    ["oxygen-15-pet", "TEP à l'oxygène-15", "MeasurementMethod", "Famille de méthodes TEP utilisant des traceurs à l'oxygène-15 pour quantifier l'oxygénation et le métabolisme cérébral.", "32634594", ["15O PET"]],
    ["trust-mri", "TRUST MRI", "MeasurementMethod", "Méthode IRM T2-relaxation-under-spin-tagging estimant l'oxygénation veineuse et l'OEF globale.", "32643207", ["T2-relaxation-under-spin-tagging"]],
    ["qsm-qbold-oef", "QSM+qBOLD OEF", "MeasurementMethod", "Méthode combinant cartographie quantitative de susceptibilité et modèle qBOLD pour estimer l'OEF.", "33243071", ["QQ-OEF", "QSM+qBOLD"]],
    ["cerebral-blood-flow", "Débit sanguin cérébral", "DerivedMeasurement", "Débit sanguin cérébral utilisé comme entrée de certaines estimations de l'OEF ou du CMRO2.", "32634594", ["CBF"]],
    ["cerebral-blood-volume", "Volume sanguin cérébral", "DerivedMeasurement", "Volume sanguin cérébral utilisé dans certaines corrections ou modélisations TEP de l'oxygénation.", "32634594", ["CBV"]],
    ["arterial-input-function", "Fonction d'entrée artérielle", "ModelInput", "Courbe d'activité artérielle utilisée par les modèles cinétiques TEP quantitatifs.", "32634594", ["AIF"]],
    ["oxygen-metabolism-test-retest", "Répétabilité du métabolisme cérébral de l'oxygène", "QualityMetric", "Variabilité test-retest des mesures d'OEF, de CBF ou de CMRO2 dans les conditions d'une étude.", "20700768", ["oxygen metabolism test-retest"]],
  ],
});

const createConcept = (domainId, [key, preferredLabel, ontologicalClass, description, pmid, aliases]) => {
  const source = sourceByPmid.get(pmid);
  const stableId = `noxia:radiology:scientific-concept:${domainId}:${key}`;
  const revisionId = `${stableId}:revision:1`;
  const material = { stableId, preferredLabel, ontologicalClass, description, sourceRevisionId: source.revisionId };
  return freeze({
    recordType: "ScientificConceptRevision",
    stableId,
    revisionId,
    revisionNumber: 1,
    campaignId: campaignIdForDomain(domainId),
    domainId,
    key,
    ontologicalClass,
    roles: freeze([ontologicalClass]),
    preferredLabel,
    designations: freeze(unique([preferredLabel, ...aliases]).map((value) => freeze({ language: /[À-ÿ]/.test(value) ? "fr" : "en", value, status: "PREFERRED_OR_ACCEPTED", sourceRefs: freeze([source.revisionId]) }))),
    description,
    sourceRefs: freeze([source.revisionId]),
    status: "ACTIVE",
    completeness: freeze({ catalogReady: true, scientificReady: true, provenanceReady: true, unknownFields: freeze([]) }),
    digest: sha256Digest(material),
  });
};

export const continuousWaveConcepts = freeze(Object.entries(conceptDefinitions)
  .flatMap(([domainId, definitions]) => definitions.map((definition) => createConcept(domainId, definition)))
  .sort((a, b) => a.stableId.localeCompare(b.stableId)));

const conceptByDomainKey = new Map(continuousWaveConcepts.map((concept) => [`${concept.domainId}:${concept.key}`, concept]));

const A = (key, subject, predicate, object, statement, pmid, locator, options = {}) => ({
  key,
  subject,
  predicate,
  object,
  statement,
  pmid,
  locator,
  relationType: options.relationType ?? "SUPPORTS",
  assertionType: options.assertionType ?? "EntityObjectAssertion",
  extractionType: options.extractionType ?? "DIRECT_STATEMENT",
  interpretationLevel: options.interpretationLevel ?? "DIRECT_STATEMENT",
  polarity: options.polarity ?? "POSITIVE",
  maturity: options.maturity ?? "PEER_REVIEWED_RESULT",
  confidence: options.confidence ?? "HIGH",
  modality: options.modality ?? "NOT_APPLICABLE",
  population: options.population ?? "NOT_APPLICABLE",
  limitations: options.limitations ?? [],
  contextDimensions: options.contextDimensions ?? [],
});

const assertionDefinitions = Object.freeze({
  segmentation: [
    A("problem-fingerprint-guides-metrics", "medical-image-segmentation", "REQUIRES_METRIC_SELECTION_FROM", "task-specific-problem-fingerprint", "Validation metrics should be selected from the properties and pitfalls of the specific image-analysis problem rather than from a universal default metric.", "38347141", "PMC11182665 — Metrics Reloaded Framework — BioC offset 5984", { extractionType: "RECOMMENDATION_TEXT", maturity: "CONSENSUS_RECOMMENDATION" }),
    A("multiple-complementary-metrics", "medical-image-segmentation", "SHOULD_BE_EVALUATED_WITH", "multiple-complementary-metrics", "A complex segmentation task generally requires several complementary metrics because one metric cannot represent every relevant validation property.", "38347141", "PMC11182665 — Cross-domain metric recommendation — BioC offset 11954", { extractionType: "RECOMMENDATION_TEXT", maturity: "CONSENSUS_RECOMMENDATION" }),
    A("dice-limited-small-structures", "dice-similarity-coefficient", "HAS_LIMITATION", "small-structure-sensitivity", "Dice-based overlap assessment has documented limitations for small structures and should be qualified by object size and complementary spatial information.", "38347141", "PMC11182665 — Metric pitfalls — BioC offset 28133", { relationType: "QUALIFIES", extractionType: "LIMITATION", polarity: "QUALIFIED", limitations: ["SMALL_STRUCTURE_SENSITIVITY", "SHAPE_INFORMATION_LIMITED"] }),
    A("hierarchical-aggregation-required", "medical-image-segmentation", "REQUIRES", "hierarchy-aware-aggregation", "Per-image metric values should be aggregated while respecting nested data structures such as multiple images per patient or patients per institution.", "38347141", "PMC11182665 — Metric aggregation — BioC offset 28788", { extractionType: "RECOMMENDATION_TEXT", maturity: "CONSENSUS_RECOMMENDATION" }),
    A("zero-overlap-distance-information", "overlap-metric", "DOES_NOT_RETAIN", "spatial-distance-at-zero-overlap", "When two segmentations have no overlap, overlap metrics return the same zero value regardless of their separation, whereas distance metrics retain spatial information.", "26263899", "PMC4533825 — Effects of overlap on correlation — BioC offset 65969", { relationType: "QUALIFIES", extractionType: "LIMITATION", polarity: "QUALIFIED", limitations: ["ZERO_OVERLAP_SPATIAL_INFORMATION_LOST"] }),
    A("metric-selection-follows-segmentation-properties", "medical-image-segmentation", "REQUIRES_CONSIDERATION_OF", "segmentation-properties", "Metric selection should account for the properties of the segmentations under evaluation and the sensitivities of candidate metrics.", "26263899", "PMC4533825 — Metric selection — BioC offset 86390", { extractionType: "METHOD_DESCRIPTION" }),
    A("staple-probabilistic-reference", "staple-consensus", "ESTIMATES", "reference-annotation", "STAPLE estimates a probabilistic reference segmentation from a collection of input segmentations rather than asserting an error-free ground truth.", "15250643", "PMC1283110 — Abstract", { extractionType: "METHOD_DESCRIPTION", maturity: "METHOD_VALIDATION", limitations: ["PROBABILISTIC_REFERENCE_NOT_ERROR_FREE_TRUTH"] }),
    A("staple-input-performance", "staple-consensus", "ESTIMATES", "input-segmentation-performance", "STAPLE jointly estimates a performance level for each input segmentation while estimating the probabilistic reference.", "15250643", "PMC1283110 — Abstract", { extractionType: "METHOD_DESCRIPTION", maturity: "METHOD_VALIDATION" }),
    A("single-task-performance-not-generalization", "task-generalizability", "IS_NOT_ESTABLISHED_BY", "single-task-performance", "Strong performance on one segmentation problem does not by itself establish generalization to an unseen task.", "35840566", "PMC9287542 — Introduction — BioC offset 3115", { assertionType: "NegativeAssertion", relationType: "QUALIFIES", extractionType: "LIMITATION", polarity: "NEGATIVE", limitations: ["SINGLE_TASK_EVIDENCE"] }),
    A("benchmark-heterogeneity-and-rater-limit", "task-generalizability", "IS_QUALIFIED_BY", "benchmark-design", "Benchmark interpretation depends on source heterogeneity, acquisition protocols and annotation design; a single-rater reference remains a documented limitation.", "35840566", "PMC9287542 — Discussion, challenge data set — BioC offset 21744", { relationType: "QUALIFIES", extractionType: "LIMITATION", polarity: "QUALIFIED", limitations: ["HETEROGENEOUS_PROTOCOLS", "SINGLE_RATER_REFERENCE"] }),
    A("agreement-assessment-needed", "inter-annotator-agreement", "SHOULD_BE_ASSESSED_FOR", "reference-annotation", "Agreement between annotators should be assessed because annotation subjectivity and variability affect the stability and reproducibility of segmentation evaluation.", "37008654", "PMC10062409 — Introduction — BioC offset 3744", { extractionType: "METHOD_DESCRIPTION" }),
    A("consensus-plus-metrics-characterizes-variability", "inter-annotator-agreement", "CAN_BE_CHARACTERIZED_BY", "consensus-and-performance-metrics", "A consensus reference estimate combined with overlap and classification metrics can characterize variation among multiple annotations.", "37008654", "PMC10062409 — Related work, STAPLE consensus — BioC offset 8986", { extractionType: "METHOD_DESCRIPTION", limitations: ["METRIC_SET_REMAINS_TASK_DEPENDENT"] }),
  ],

  "t2-mapping": [
    A("local-reference-primary", "myocardial-t2", "REQUIRES_INTERPRETATION_WITH", "local-t2-reference-range", "Myocardial T2 values should primarily be interpreted against locally established references for the implemented method and context.", "28992817", "PMC5633041 — Reference ranges — BioC offset 9841", { extractionType: "RECOMMENDATION_TEXT", maturity: "CURRENT_CONSENSUS", modality: "MR" }),
    A("no-report-without-local-reference", "myocardial-t2", "SHOULD_NOT_BE_REPORTED_QUANTITATIVELY_WITHOUT", "local-t2-reference-range", "The consensus advises against quantitative clinical reporting of myocardial T2 when an appropriate local reference has not been established.", "28992817", "PMC5633041 — Reference ranges — BioC offset 10269", { assertionType: "NegativeAssertion", extractionType: "RECOMMENDATION_TEXT", polarity: "NEGATIVE", maturity: "CURRENT_CONSENSUS", modality: "MR" }),
    A("recommended-source-images", "myocardial-t2-mapping", "RECOMMENDS", "t2-prepared-bssfp", "The SCMR/EACVI consensus recommends T2-prepared bSSFP or GRE acquisitions with at least three source images for myocardial T2 mapping.", "28992817", "PMC5633041 — T2 mapping acquisition — BioC offset 14619", { extractionType: "RECOMMENDATION_TEXT", maturity: "CURRENT_CONSENSUS", modality: "MR" }),
    A("reproducibility-not-repeatability", "t2-interscanner-reproducibility", "IS_DISTINCT_FROM", "repeatability", "Reproducibility evaluates variability across teams or measurement setups and is distinct from repeatability under unchanged conditions.", "35600490", "PMC9120534 — Metrology terminology — BioC offset 5051", { extractionType: "METHOD_DESCRIPTION", modality: "MR" }),
    A("accuracy-not-precision", "myocardial-t2", "REQUIRES_DISTINGUISHING", "accuracy-and-precision", "Accuracy and precision describe different measurement properties and should not be treated as interchangeable in cardiac mapping validation.", "35600490", "PMC9120534 — Metrology terminology — BioC offset 5895", { extractionType: "METHOD_DESCRIPTION", modality: "MR" }),
    A("three-t-bssfp-artifacts", "t2-prepared-bssfp", "HAS_LIMITATION_AT", "field-strength-3-t", "At 3 T, T2-prepared bSSFP is more susceptible to field-related artifacts; GRE readout may improve robustness at a documented precision cost.", "35600490", "PMC9120534 — T2 mapping technical comparison — BioC offset 26980", { relationType: "QUALIFIES", extractionType: "LIMITATION", polarity: "QUALIFIED", modality: "MR", limitations: ["B0_B1_ARTIFACTS_AT_3T", "GRE_PRECISION_TRADEOFF"], contextDimensions: [{ dimension: "fieldStrength", operator: "EXACT", value: "3 T" }] }),
    A("identical-scanner-reproducibility", "t2-interscanner-reproducibility", "WAS_HIGH_UNDER", "identical-hardware-software-protocol", "A healthy-volunteer study found high interscanner reproducibility across three identical 1.5 T systems using the same hardware, software and standardized protocol.", "32460852", "PMC7254724 — Abstract, Results — BioC offset 1258", { extractionType: "NUMERIC_RESULT", maturity: "SINGLE_CENTER_TECHNICAL_RESULT", modality: "MR", population: "30_HEALTHY_SUBJECTS", contextDimensions: [{ dimension: "fieldStrength", operator: "EXACT", value: "1.5 T" }, { dimension: "scanner", operator: "CONDITION", value: "THREE_IDENTICAL_SYSTEMS" }] }),
    A("regional-t2-variation", "myocardial-t2", "VARIES_BY", "myocardial-region-and-level", "In the same standardized study, T2 differed by myocardial segment, region, level and axis, including higher values in apical segments.", "32460852", "PMC7254724 — Abstract, Results — BioC offset 1258", { relationType: "QUALIFIES", extractionType: "NUMERIC_RESULT", polarity: "QUALIFIED", maturity: "SINGLE_CENTER_TECHNICAL_RESULT", modality: "MR", population: "30_HEALTHY_SUBJECTS", limitations: ["REGIONAL_REFERENCE_DEPENDENCE"] }),
    A("phantom-short-term-cov", "t2-mapping-phantom", "HAD_SHORT_TERM_COV_BELOW", { value: 1, unit: "%" }, "In two final phantom prototypes, repeated T2 mapping at 1.5 T and 3 T produced tube-level short-term coefficients of variation below 1% under the study conditions.", "36935515", "PMC10026458 — Results, short-term reproducibility — BioC offset 28487", { assertionType: "QuantitativeAssertion", extractionType: "NUMERIC_RESULT", maturity: "PHANTOM_VALIDATION_RESULT", modality: "MR", population: "PHANTOM", contextDimensions: [{ dimension: "fieldStrength", operator: "ANY_OF", value: ["1.5 T", "3 T"] }] }),
    A("phantom-long-term-cov", "t2-mapping-phantom", "HAD_TWELVE_MONTH_T2_COV_BELOW", { value: 1.25, unit: "%" }, "For one phantom reassessed after twelve months, bSSFP T2 mapping coefficients of variation across nine tubes remained below 1.25% at both field strengths.", "36935515", "PMC10026458 — Results, long-term reproducibility — BioC offset 30620", { assertionType: "QuantitativeAssertion", extractionType: "NUMERIC_RESULT", maturity: "PHANTOM_VALIDATION_RESULT", modality: "MR", population: "ONE_PHANTOM", limitations: ["SINGLE_PHANTOM_LONG_TERM_STABILITY"], contextDimensions: [{ dimension: "fieldStrength", operator: "ANY_OF", value: ["1.5 T", "3 T"] }, { dimension: "time", operator: "EXACT", value: "12 months" }] }),
    A("mapping-requires-coregistration-fit", "myocardial-t2-mapping", "REQUIRES", "source-image-coregistration-and-fit", "A T2 map is formed from multiple T2-weighted source images using co-registration and pixel-wise model fitting.", "35659266", "PMC9167641 — T2 mapping methodology — BioC offset 5841", { extractionType: "METHOD_DESCRIPTION", modality: "MR" }),
    A("motion-causes-misregistration", "motion-misregistration", "LIMITS", "myocardial-t2-mapping", "Inconsistent breath-holding can misregister source images, and in-plane correction cannot resolve through-plane displacement.", "35659266", "PMC9167641 — Technical limitations — BioC offset 12612", { relationType: "QUALIFIES", extractionType: "LIMITATION", polarity: "QUALIFIED", modality: "MR", limitations: ["BREATH_HOLD_VARIABILITY", "THROUGH_PLANE_MOTION"] }),
  ],

  "quality-control": [
    A("ground-truth-terminology-ambiguous", "reference-phantom", "DOES_NOT_ESTABLISH", "error-free-ground-truth", "Metrology does not support treating a single measurement as error-free truth; reference methods and values retain measurement uncertainty.", "26267831", "PMC4666097 — Truth and Reference Values", { assertionType: "NegativeAssertion", relationType: "QUALIFIES", extractionType: "LIMITATION", polarity: "NEGATIVE", maturity: "METROLOGY_STANDARD" }),
    A("bias-needs-reference", "measurement-bias", "REQUIRES", "true-or-qualified-reference-value", "Bias can only be estimated against a true or explicitly qualified reference value; in vivo absence of such a value must remain a limitation.", "26267831", "PMC4666097 — Bias", { extractionType: "METHOD_DESCRIPTION", maturity: "METROLOGY_STANDARD", limitations: ["REFERENCE_VALUE_MAY_BE_UNAVAILABLE_IN_VIVO"] }),
    A("accuracy-needs-components", "technical-performance", "REQUIRES_EXPLICIT_DESCRIPTION_OF", "bias-and-precision", "When the term accuracy is used for quantitative measurement, its bias and precision components should be described because accuracy has no single unambiguous aggregate definition.", "26267831", "PMC4666097 — Truth and Reference Values", { relationType: "QUALIFIES", extractionType: "METHOD_DESCRIPTION", polarity: "QUALIFIED", maturity: "METROLOGY_STANDARD" }),
    A("correlation-not-agreement", "measurement-agreement", "IS_NOT_ESTABLISHED_BY", "correlation-alone", "Correlation alone is insufficient to establish agreement or technical interchangeability between two measurement procedures.", "26267831", "PMC4666097 — Study Design Considerations", { assertionType: "NegativeAssertion", relationType: "QUALIFIES", extractionType: "LIMITATION", polarity: "NEGATIVE", maturity: "METROLOGY_STANDARD" }),
    A("repeatability-conditions", "measurement-repeatability", "APPLIES_UNDER", "identical-or-nearly-identical-conditions", "Repeatability describes variability when repeated measurements are acquired under identical or nearly identical conditions.", "24919831", "PMC5574197 — Introduction — BioC offset 4281", { extractionType: "METHOD_DESCRIPTION", maturity: "METROLOGY_METHOD_REVIEW" }),
    A("reproducibility-conditions", "measurement-reproducibility", "APPLIES_WHEN", "measurement-conditions-vary", "Reproducibility describes variability under real-world changes in factors such as instruments, sites or other measurement conditions.", "24919831", "PMC5574197 — Introduction — BioC offset 5324", { extractionType: "METHOD_DESCRIPTION", maturity: "METROLOGY_METHOD_REVIEW" }),
    A("dsc-reproducibility-barrier", "measurement-reproducibility", "IS_A_DOCUMENTED_BARRIER_FOR", "longitudinal-dsc-quantification", "The QIBA DSC profile identifies reproducibility across patients, devices and software as a barrier to routine and trial use of longitudinal DSC quantification in glioma.", "39656118", "PMC11694077 — Abstract", { relationType: "QUALIFIES", extractionType: "LIMITATION", polarity: "QUALIFIED", maturity: "QIBA_PROFILE", modality: "MR", limitations: ["CROSS_DEVICE_REPRODUCIBILITY", "CROSS_SOFTWARE_REPRODUCIBILITY"] }),
    A("claims-require-applicability", "technical-performance", "REQUIRES", "explicit-applicability-conditions", "A quantitative imaging performance claim must specify the conditions and strata under which it is intended to hold.", "24919831", "PMC5574197 — Study claim and strata — BioC offsets 16556 and 17516", { extractionType: "METHOD_DESCRIPTION", maturity: "METROLOGY_METHOD_REVIEW" }),
    A("estimates-require-uncertainty", "technical-performance", "REQUIRES_REPORTING_OF", "confidence-bounds", "Estimated quantitative imaging performance parameters should be accompanied by confidence bounds or another explicit expression of uncertainty.", "24919831", "PMC5574197 — Statistical design — BioC offset 18447", { extractionType: "RECOMMENDATION_TEXT", maturity: "METROLOGY_METHOD_REVIEW" }),
    A("qc-not-one-time", "quantitative-imaging-quality-assurance", "MUST_ACCOUNT_FOR", "system-drift-and-upgrades", "Measurement variance is not a one-time characterization because hardware, software and analysis pipelines can drift or change over time.", "34455593", "PMC8882689 — Evaluating repeatability and reproducibility — BioC offset 8855", { extractionType: "LIMITATION", maturity: "TECHNICAL_REVIEW", limitations: ["SYSTEM_DRIFT", "HARDWARE_CHANGE", "SOFTWARE_CHANGE"] }),
    A("acquisition-analysis-both-affect", "measurement-reproducibility", "DEPENDS_ON", "acquisition-and-analysis-pipeline", "Repeatability and reproducibility of image quantitation depend on both acquisition methods and the analysis pipeline.", "34455593", "PMC8882689 — Introduction — BioC offset 6179", { extractionType: "METHOD_DESCRIPTION", maturity: "TECHNICAL_REVIEW" }),
    A("adc-claims-conditional", "technical-performance", "IS_CONDITIONAL_ON", "profile-conformant-acquisition-and-processing", "QIBA ADC repeatability claims apply only when acquisition and processing conform to the profile's documented conditions.", "39377680", "PMC11537247 — Conditions for the ADC Profile Claims to Be Valid — BioC offset 12705", { relationType: "QUALIFIES", extractionType: "RECOMMENDATION_TEXT", polarity: "QUALIFIED", maturity: "QIBA_PROFILE", modality: "MR", limitations: ["PROFILE_CONFORMANCE_REQUIRED"] }),
  ],

  "neuro-oncology": [
    A("post-radiotherapy-baseline", "rano-2", "RECOMMENDS_BASELINE", "post-radiotherapy-mri", "For newly diagnosed adult glioma trials, RANO 2.0 uses the post-radiotherapy MRI rather than the postsurgical MRI as the baseline for subsequent comparison.", "37774317", "PMC10860967 — Abstract, Results", { extractionType: "RECOMMENDATION_TEXT", maturity: "CURRENT_CONSENSUS", modality: "MR", population: "NEWLY_DIAGNOSED_ADULT_GLIOMA" }),
    A("early-progression-confirmation", "rano-2", "REQUIRES_CONFIRMATION_OF", "progression-within-twelve-weeks", "Because pseudoprogression is frequent during the first 12 weeks after radiotherapy, RANO 2.0 requires repeat MRI confirmation or unequivocal histopathology before defining progression in that interval.", "37774317", "PMC10860967 — Abstract, Results", { extractionType: "RECOMMENDATION_TEXT", maturity: "CURRENT_CONSENSUS", modality: "MR", population: "NEWLY_DIAGNOSED_ADULT_GLIOMA", contextDimensions: [{ dimension: "timeAfterRadiotherapy", operator: "RANGE", value: { min: 0, max: 12, unit: "weeks" } }] }),
    A("confirmation-not-always-mandatory", "rano-2", "DOES_NOT_REQUIRE_ROUTINELY", "progression-confirmation-after-early-window", "RANO 2.0 does not make confirmation scans mandatory after the early post-radiotherapy window or for recurrent-tumor treatment assessment, unless a treatment has a high pseudoprogression likelihood.", "37774317", "PMC10860967 — Abstract, Results", { assertionType: "NegativeAssertion", relationType: "QUALIFIES", extractionType: "RECOMMENDATION_TEXT", polarity: "QUALIFIED", maturity: "CURRENT_CONSENSUS", modality: "MR", limitations: ["TREATMENT_SPECIFIC_PSEUDOPROGRESSION_EXCEPTION"] }),
    A("two-dimensional-primary-measurement", "rano-2", "USES_PRIMARY_MEASUREMENT", "maximum-cross-sectional-area", "RANO 2.0 retains maximum cross-sectional tumor area as the primary measurement while allowing volumetric measurement as an option.", "37774317", "PMC10860967 — Abstract, Results", { extractionType: "RECOMMENDATION_TEXT", maturity: "CURRENT_CONSENSUS", modality: "MR" }),
    A("nonenhancing-disease-context", "rano-2", "DOES_NOT_EVALUATE_ROUTINELY", "nonenhancing-disease-in-idh-wildtype-glioblastoma", "For IDH-wild-type glioblastoma, RANO 2.0 excludes routine nonenhancing-disease assessment except in the context of antiangiogenic therapy.", "37774317", "PMC10860967 — Abstract, Results", { assertionType: "NegativeAssertion", relationType: "QUALIFIES", extractionType: "RECOMMENDATION_TEXT", polarity: "QUALIFIED", maturity: "CURRENT_CONSENSUS", modality: "MR", population: "IDH_WILDTYPE_GLIoblastoma", limitations: ["ANTIANGIOGENIC_THERAPY_EXCEPTION"] }),
    A("btip-minimum-sequences", "brain-tumor-imaging-protocol", "RECOMMENDS", "minimum-multisequence-mri", "The BTIP consensus defines a minimum trial protocol including matched pre- and post-contrast 3D T1-weighted imaging, T2-weighted imaging, FLAIR and diffusion-weighted imaging.", "26250565", "PMC4588759 — Abstract", { extractionType: "RECOMMENDATION_TEXT", maturity: "CONSENSUS_PROTOCOL", modality: "MR" }),
    A("btip-field-ranges", "brain-tumor-imaging-protocol", "SPECIFIES_PARAMETERS_FOR", "field-strength-1-5-and-3-t", "The BTIP consensus provides recommended acquisition-parameter ranges for both 1.5 T and 3 T MRI systems.", "26250565", "PMC4588759 — Abstract", { extractionType: "RECOMMENDATION_TEXT", maturity: "CONSENSUS_PROTOCOL", modality: "MR", contextDimensions: [{ dimension: "fieldStrength", operator: "ANY_OF", value: ["1.5 T", "3 T"] }] }),
    A("leakage-correction-required", "dsc-leakage-correction", "IS_NEEDED_FOR", "relative-cerebral-blood-volume", "Model-based leakage correction is needed for accurate DSC-derived rCBV when the blood-brain barrier is disrupted.", "32516388", "PMC7523451 — Post-Processing Leakage Correction", { extractionType: "RECOMMENDATION_TEXT", maturity: "CONSENSUS_PROTOCOL", modality: "MR", limitations: ["BLOOD_BRAIN_BARRIER_DISRUPTION"] }),
    A("preload-correction-synergy", "dsc-leakage-correction", "IS_COMPLEMENTED_BY", "contrast-preload", "Contrast preload and model-based post-processing leakage correction have complementary effects on DSC rCBV accuracy.", "32516388", "PMC7523451 — Post-Processing Leakage Correction", { extractionType: "METHOD_DESCRIPTION", maturity: "CONSENSUS_PROTOCOL", modality: "MR" }),
    A("implementation-affects-rcbv", "relative-cerebral-blood-volume", "VARIES_WITH", "post-processing-implementation", "Different implementations of DSC leakage correction can yield different rCBV performance, motivating reference benchmarks for post-processing tools.", "32516388", "PMC7523451 — Post-Processing Leakage Correction", { relationType: "QUALIFIES", extractionType: "LIMITATION", polarity: "QUALIFIED", maturity: "CONSENSUS_PROTOCOL", modality: "MR", limitations: ["SOFTWARE_IMPLEMENTATION_VARIABILITY", "BENCHMARK_REQUIRED"] }),
    A("qiba-measured-qib", "relative-cerebral-blood-volume", "IS_OPERATIONALIZED_BY", "tissue-normalized-auc", "The QIBA DSC profile treats tissue-normalized area under the contrast concentration-time curve as its measured quantitative imaging biomarker for longitudinal rCBV assessment.", "39656118", "PMC11694077 — Abstract", { relationType: "QUALIFIES", extractionType: "METHOD_DESCRIPTION", polarity: "QUALIFIED", maturity: "QIBA_PROFILE", modality: "MR", limitations: ["MEASURED_QIB_IS_NORMALIZED_AUC"] }),
    A("fdg-more-limited-than-amino-acid-pet", "fdg-pet-glioma", "HAS_MORE_LIMITED_ROLE_THAN", "amino-acid-pet-glioma", "FDG PET has a more limited role than amino-acid PET in glioma imaging because normal gray matter has high physiologic FDG uptake and inflammatory lesions can show variable uptake.", "30519867", "PMC6351513 — Introduction — BioC offset 11143", { relationType: "QUALIFIES", extractionType: "LIMITATION", polarity: "QUALIFIED", modality: "PET", maturity: "JOINT_SOCIETY_GUIDELINE", limitations: ["HIGH_NORMAL_GRAY_MATTER_FDG_UPTAKE", "INFLAMMATORY_UPTAKE"] }),
  ],

  "oef-cmro2": [
    A("pet-reference-method-varies", "oxygen-15-pet", "IS_REFERENCE_METHOD_WITH", "methodological-variability", "Oxygen-15 gas PET is treated as a reference method for OEF and CMRO2, but tracer delivery, scanner, reconstruction and kinetic modelling choices vary across studies.", "32634594", "PMC7592419 — Introduction — BioC offset 2189", { relationType: "QUALIFIES", extractionType: "LIMITATION", polarity: "QUALIFIED", modality: "PET", maturity: "TECHNICAL_REVIEW", limitations: ["TRACER_DELIVERY_VARIABILITY", "RECONSTRUCTION_VARIABILITY", "MODEL_VARIABILITY"] }),
    A("three-scan-quantification", "oxygen-15-pet", "GENERALLY_REQUIRES", "three-tracer-scans", "Full PET quantification of cerebral OEF and CMRO2 generally uses separate oxygen-15 acquisitions for oxygen metabolism, blood flow and blood volume.", "32634594", "PMC7592419 — Cerebral blood flow and cerebral blood volume — BioC offset 9434", { extractionType: "METHOD_DESCRIPTION", modality: "PET", maturity: "TECHNICAL_REVIEW" }),
    A("cbf-input-for-oef", "cerebral-oef", "REQUIRES_INPUT", "cerebral-blood-flow", "A cerebral blood-flow map is an input to quantitative oxygen-15 PET OEF estimation in the reviewed steady-state and bolus models.", "32634594", "PMC7592419 — Cerebral blood flow — BioC offset 10639", { extractionType: "METHOD_DESCRIPTION", modality: "PET", maturity: "TECHNICAL_REVIEW" }),
    A("interscan-physiology-propagates", "cerebral-cmro2", "IS_SENSITIVE_TO", "interscan-physiological-change", "Physiological change between sequential oxygen-15 acquisitions can propagate error into the final CMRO2 estimate.", "32634594", "PMC7592419 — Multitracer timing — BioC offset 13678", { relationType: "QUALIFIES", extractionType: "LIMITATION", polarity: "QUALIFIED", modality: "PET", maturity: "TECHNICAL_REVIEW", limitations: ["INTERSCAN_PHYSIOLOGICAL_CHANGE"] }),
    A("pet-output-units", "oxygen-15-pet", "PRODUCES", "oef-percent-and-cmro2-rate", "The reviewed oxygen-15 PET procedures report OEF in percent and CMRO2 as millilitres of oxygen per 100 grams of tissue per minute.", "32634594", "PMC7592419 — Kinetic-model outputs — BioC offset 24100", { assertionType: "LiteralValueAssertion", extractionType: "METHOD_DESCRIPTION", modality: "PET", maturity: "TECHNICAL_REVIEW" }),
    A("pet-oef-day-to-day-cov", "cerebral-oef", "HAD_WHOLE_BRAIN_TEST_RETEST_COV", { value: 9.3, unit: "%" }, "In seven healthy volunteers with complete dynamic oxygen-15 PET test-retest studies, the whole-brain day-to-day OEF coefficient of variation was 9.3%.", "20700768", "PMC3128261 — Abstract, Results — BioC offset 595", { assertionType: "QuantitativeAssertion", extractionType: "NUMERIC_RESULT", modality: "PET", maturity: "SMALL_TEST_RETEST_STUDY", population: "7_HEALTHY_VOLUNTEERS", limitations: ["SMALL_HEALTHY_VOLUNTEER_SAMPLE"] }),
    A("pet-cmro2-day-to-day-cov", "cerebral-cmro2", "HAD_WHOLE_BRAIN_TEST_RETEST_COV", { value: 5.3, unit: "%" }, "In the same seven volunteers, the whole-brain day-to-day CMRO2 coefficient of variation was 5.3%.", "20700768", "PMC3128261 — Abstract, Results — BioC offset 595", { assertionType: "QuantitativeAssertion", extractionType: "NUMERIC_RESULT", modality: "PET", maturity: "SMALL_TEST_RETEST_STUDY", population: "7_HEALTHY_VOLUNTEERS", limitations: ["SMALL_HEALTHY_VOLUNTEER_SAMPLE"] }),
    A("trust-pet-agreement", "trust-mri", "SHOWED_AGREEMENT_WITH", "oxygen-15-pet", "In sixteen healthy adults, whole-brain TRUST OEF showed no mean difference from oxygen-15 PET and strong agreement in the reported comparison.", "32643207", "PMC9973312 — Results — BioC offsets 13209 and 13561", { extractionType: "NUMERIC_RESULT", modality: "MR_PET", maturity: "SMALL_CROSS_MODALITY_VALIDATION", population: "16_HEALTHY_ADULTS", limitations: ["WHOLE_BRAIN_HEALTHY_ADULT_VALIDATION"] }),
    A("trust-pet-reproducibility", "trust-mri", "HAD_COMPARABLE_TEST_RETEST_TO", "oxygen-15-pet", "In the ten-subject test-retest subset, TRUST and oxygen-15 PET whole-brain OEF coefficients of variation did not differ statistically.", "32643207", "PMC9973312 — Results — BioC offset 13886", { extractionType: "NUMERIC_RESULT", modality: "MR_PET", maturity: "SMALL_CROSS_MODALITY_VALIDATION", population: "10_HEALTHY_ADULTS", limitations: ["SMALL_TEST_RETEST_SUBSET", "WHOLE_BRAIN_ONLY"] }),
    A("qq-pet-regional-validation", "qsm-qbold-oef", "WAS_COMPARED_WITH", "oxygen-15-pet", "In ten healthy adults, QSM+qBOLD and oxygen-15 PET produced similar average whole-brain OEF values, while the reported limits of agreement remained explicit.", "33243071", "PMC8221765 — Abstract and Results", { relationType: "QUALIFIES", extractionType: "NUMERIC_RESULT", polarity: "QUALIFIED", modality: "MR_PET", maturity: "SMALL_CROSS_MODALITY_VALIDATION", population: "10_HEALTHY_ADULTS", limitations: ["SMALL_HEALTHY_SAMPLE", "LIMITS_OF_AGREEMENT_REMAIN_MATERIAL"] }),
    A("rapid-mri-cmro2-inputs", "cerebral-cmro2", "CAN_BE_ESTIMATED_FROM", "trust-oef-phase-contrast-cbf-and-oximetry", "The documented rapid MRI method estimates global CMRO2 by combining TRUST-derived venous oxygenation, phase-contrast cerebral blood flow and pulse oximetry.", "22517498", "PMC3404231 — Framework of the CMRO2 measurement — BioC offsets 3001 and 5056", { extractionType: "METHOD_DESCRIPTION", modality: "MR", maturity: "METHOD_STUDY" }),
    A("rapid-mri-global-only", "cerebral-cmro2", "HAS_LIMITATION", "lack-of-regional-resolution", "The rapid MRI CMRO2 method provides global measurements and does not provide regional CMRO2 information for focal or heterogeneous disease.", "22517498", "PMC3404231 — Discussion, limitations — BioC offset 21475", { relationType: "QUALIFIES", extractionType: "LIMITATION", polarity: "QUALIFIED", modality: "MR", maturity: "METHOD_STUDY", limitations: ["GLOBAL_MEASUREMENT_ONLY", "NO_REGIONAL_CMRO2"] }),
  ],
});

const contextFor = (domainId, definition) => freeze({
  contextId: `noxia:radiology:scientific-context:continuous-wave:${domainId}:${definition.key}`,
  dimensions: freeze([
    {
      dimension: "modality",
      operator: definition.modality.includes("_") ? "ANY_OF" : definition.modality === "NOT_APPLICABLE" ? "NOT_APPLICABLE" : "EXACT",
      value: definition.modality.includes("_") ? definition.modality.split("_") : definition.modality === "NOT_APPLICABLE" ? null : definition.modality,
    },
    { dimension: "population", operator: definition.population === "NOT_APPLICABLE" ? "NOT_APPLICABLE" : "EXACT", value: definition.population === "NOT_APPLICABLE" ? null : definition.population },
    { dimension: "manufacturer", operator: "UNKNOWN", value: null },
    { dimension: "software", operator: "UNKNOWN", value: null },
    ...definition.contextDimensions,
  ]),
});

const resolveConcept = (domainId, key) => conceptByDomainKey.get(`${domainId}:${key}`) ?? null;

const createAssertion = (domainId, definition) => {
  const source = sourceByPmid.get(definition.pmid);
  const subject = resolveConcept(domainId, definition.subject);
  const objectConcept = typeof definition.object === "string" ? resolveConcept(domainId, definition.object) : null;
  if (!source || !subject) throw new Error(`CONTINUOUS_WAVE_ASSERTION_REFERENCE_MISSING:${domainId}:${definition.key}`);
  const stableId = `noxia:radiology:scientific-assertion:continuous-wave:${domainId}:${definition.key}`;
  const revisionId = `${stableId}:revision:1`;
  const context = contextFor(domainId, definition);
  const qualified = definition.relationType === "QUALIFIES" || ["QUALIFIED", "NEGATIVE"].includes(definition.polarity);
  const material = { stableId, subjectEntityId: subject.stableId, predicate: definition.predicate, object: objectConcept?.stableId ?? definition.object, sourceRevisionId: source.revisionId, context };
  return freeze({
    recordType: "ScientificAssertionRevision",
    stableId,
    revisionId,
    revisionNumber: 1,
    campaignId: campaignIdForDomain(domainId),
    domainId,
    key: definition.key,
    assertionType: definition.assertionType,
    subjectEntityId: subject.stableId,
    predicate: definition.predicate,
    objectEntityId: objectConcept?.stableId ?? null,
    literalValue: objectConcept ? null : definition.object,
    statement: freeze({ language: "en", text: definition.statement, atomicConclusionCount: 1 }),
    context,
    modality: definition.modality,
    facets: freeze({
      concepts: freeze(unique([definition.subject, objectConcept ? definition.object : null])),
      modalities: freeze(definition.modality === "NOT_APPLICABLE" ? [] : definition.modality.split("_")),
      pathologies: freeze([definition.subject, objectConcept ? definition.object : null].filter((key) => ["adult-glioma", "pseudoprogression"].includes(key))),
      techniques: freeze([definition.subject, objectConcept ? definition.object : null].filter((key) => /mapping|mri|pet|staple|protocol|correction|segmentation|phantom/.test(key ?? ""))),
      measurements: freeze([definition.subject, objectConcept ? definition.object : null].filter((key) => /t2|oef|cmro2|blood-flow|blood-volume|bias|precision|repeatability|reproducibility|agreement|dice/.test(key ?? ""))),
      limitations: freeze(definition.limitations),
      manufacturers: freeze([]),
      software: freeze([]),
    }),
    temporalScope: source.publishedAt,
    polarity: definition.polarity,
    confidence: definition.confidence,
    evidenceQuality: freeze({
      relevance: "DIRECTLY_RELEVANT",
      methodologicalQuality: source.sourceType,
      fullTextAvailability: source.fullTextAvailability,
      contextualPrecision: definition.contextDimensions.length || definition.population !== "NOT_APPLICABLE" ? "SPECIFIED" : "LIMITED",
    }),
    scientificMaturity: definition.maturity,
    status: "SOURCE_LOCALIZED",
    reviewState: qualified ? "QUALIFIED" : "REVIEWED",
    reviewType: CONTINUOUS_WAVE_REVIEW_TYPE,
    reviewer: CONTINUOUS_WAVE_REVIEWER,
    automatedReviewDecision: qualified ? "AUTOMATED_REVIEW_QUALIFIED" : "AUTOMATED_REVIEW_PASSED",
    humanReviewed: false,
    scientificHumanReview: null,
    sourceRefs: freeze([source.revisionId]),
    limitations: freeze(definition.limitations),
    digest: sha256Digest(material),
  });
};

export const continuousWaveAssertionRevisions = freeze(Object.entries(assertionDefinitions)
  .flatMap(([domainId, definitions]) => definitions.map((definition) => createAssertion(domainId, definition)))
  .sort((a, b) => a.revisionId.localeCompare(b.revisionId)));

const assertionByDomainKey = new Map(continuousWaveAssertionRevisions.map((assertion) => [`${assertion.domainId}:${assertion.key}`, assertion]));

const createEvidenceLink = (domainId, definition) => {
  const assertion = assertionByDomainKey.get(`${domainId}:${definition.key}`);
  const source = sourceByPmid.get(definition.pmid);
  const evidenceLinkId = `noxia:radiology:evidence-link:continuous-wave:${domainId}:${definition.key}`;
  const material = { evidenceLinkId, sourceRevisionId: source.revisionId, assertionRevisionId: assertion.revisionId, relationType: definition.relationType, locator: definition.locator };
  return freeze({
    recordType: "EvidenceLink",
    evidenceLinkId,
    campaignId: campaignIdForDomain(domainId),
    domainId,
    sourceRevisionId: source.revisionId,
    assertionRevisionId: assertion.revisionId,
    relationType: definition.relationType,
    locator: definition.locator,
    extraction: freeze({
      extractionId: `noxia:radiology:extraction:continuous-wave:${domainId}:${definition.key}`,
      sourceRevisionId: source.revisionId,
      assertionDerived: assertion.revisionId,
      section: definition.locator.split(" — ").slice(1).join(" — "),
      page: null,
      paragraph: /BioC offset/.test(definition.locator) ? definition.locator.match(/BioC offset[s]? ([\d ]+(?:and [\d ]+)*)/)?.[1] ?? "LOCATED_SECTION" : "LOCATED_SECTION",
      tableOrFigure: /Table|Figure/.test(definition.locator) ? definition.locator : null,
      passage: definition.statement,
      passageKind: "ANALYTICAL_SUMMARY_NOT_VERBATIM_SOURCE_TEXT",
      consultedAt: CONTINUOUS_WAVE_AT,
      analyticalSummary: definition.statement,
      extractionType: definition.extractionType,
      interpretationLevel: definition.interpretationLevel,
      directAuthorStatement: definition.interpretationLevel !== "DERIVED_INTERPRETATION",
      derivationSteps: freeze([]),
    }),
    applicability: assertion.context,
    evidenceQuality: assertion.evidenceQuality,
    confidence: definition.confidence,
    reviewerStatus: assertion.automatedReviewDecision,
    reviewType: CONTINUOUS_WAVE_REVIEW_TYPE,
    reviewer: CONTINUOUS_WAVE_REVIEWER,
    scientificHumanReview: null,
    limitations: freeze(definition.limitations),
    date: CONTINUOUS_WAVE_AT,
    digest: sha256Digest(material),
  });
};

export const continuousWaveEvidenceLinks = freeze(Object.entries(assertionDefinitions)
  .flatMap(([domainId, definitions]) => definitions.map((definition) => createEvidenceLink(domainId, definition)))
  .sort((a, b) => a.evidenceLinkId.localeCompare(b.evidenceLinkId)));

const evidenceByAssertion = Map.groupBy(continuousWaveEvidenceLinks, (link) => link.assertionRevisionId);

export const continuousWaveReviewDecisions = freeze(continuousWaveAssertionRevisions.map((assertion) => {
  const links = evidenceByAssertion.get(assertion.revisionId) ?? [];
  return freeze({
    recordType: "AutomatedScientificReviewDecision",
    decisionId: `noxia:radiology:assertion-review:continuous-wave:${assertion.domainId}:${assertion.key}`,
    assertionRevisionId: assertion.revisionId,
    reviewer: CONTINUOUS_WAVE_REVIEWER,
    date: CONTINUOUS_WAVE_AT,
    decision: assertion.automatedReviewDecision,
    justification: assertion.reviewState === "QUALIFIED"
      ? "The localized source supports a bounded, negative, or limiting statement and the qualification remains explicit."
      : "Atomicity, source identity, locator, applicability and EvidenceLink passed deterministic automated review.",
    sourceRevisionIds: freeze(links.map((link) => link.sourceRevisionId).sort()),
    evidenceLinkIds: freeze(links.map((link) => link.evidenceLinkId).sort()),
    scope: "DOCUMENTARY_SCIENTIFIC_CORPUS_INTERNAL_ONLY",
    reservations: freeze(unique(links.flatMap((link) => link.limitations))),
    reviewType: CONTINUOUS_WAVE_REVIEW_TYPE,
    automatedStructuralReview: true,
    automatedScientificReview: true,
    scientificHumanReview: null,
    previousStatus: "EXTRACTED",
    newStatus: assertion.status,
  });
}).sort((a, b) => a.decisionId.localeCompare(b.decisionId)));

const assertionIds = (domainId, keys) => freeze(keys.map((key) => assertionByDomainKey.get(`${domainId}:${key}`).revisionId).sort());

export const continuousWaveContextDifferences = freeze([
  freeze({ recordType: "ScientificContextDifference", contradictionId: "noxia:radiology:context-difference:continuous-wave:segmentation:overlap-boundary", campaignId: campaignIdForDomain("segmentation"), domainId: "segmentation", assertionRevisionIds: assertionIds("segmentation", ["dice-limited-small-structures", "zero-overlap-distance-information"]), classification: "METHOD_DIFFERENCE", rationale: "Overlap and boundary metrics answer different validation questions; their different behavior is complementary rather than a contradiction.", resolutionApplied: false, contextsPreserved: freeze(["OVERLAP", "SPATIAL_DISTANCE"]) }),
  freeze({ recordType: "ScientificContextDifference", contradictionId: "noxia:radiology:context-difference:continuous-wave:t2-mapping:regional-reproducibility", campaignId: campaignIdForDomain("t2-mapping"), domainId: "t2-mapping", assertionRevisionIds: assertionIds("t2-mapping", ["identical-scanner-reproducibility", "regional-t2-variation"]), classification: "CONTEXT_DIFFERENCE", rationale: "High reproducibility across identical systems does not remove systematic regional or segmental differences.", resolutionApplied: false, contextsPreserved: freeze(["IDENTICAL_SYSTEMS", "MYOCARDIAL_REGION"]) }),
  freeze({ recordType: "ScientificContextDifference", contradictionId: "noxia:radiology:context-difference:continuous-wave:quality-control:correlation-agreement", campaignId: campaignIdForDomain("quality-control"), domainId: "quality-control", assertionRevisionIds: assertionIds("quality-control", ["correlation-not-agreement", "reproducibility-conditions"]), classification: "DEFINITION_DIFFERENCE", rationale: "Correlation, agreement and reproducibility are retained as distinct metrology constructs.", resolutionApplied: false, contextsPreserved: freeze(["ASSOCIATION", "AGREEMENT", "REPRODUCIBILITY"]) }),
  freeze({ recordType: "ScientificContextDifference", contradictionId: "noxia:radiology:context-difference:continuous-wave:neuro-oncology:progression-confirmation", campaignId: campaignIdForDomain("neuro-oncology"), domainId: "neuro-oncology", assertionRevisionIds: assertionIds("neuro-oncology", ["early-progression-confirmation", "confirmation-not-always-mandatory"]), classification: "TEMPORAL_DIFFERENCE", rationale: "Progression-confirmation rules differ by time after radiotherapy and recurrent-disease context.", resolutionApplied: false, contextsPreserved: freeze(["FIRST_12_WEEKS_POST_RADIOTHERAPY", "LATER_OR_RECURRENT_SETTING"]) }),
  freeze({ recordType: "ScientificContextDifference", contradictionId: "noxia:radiology:context-difference:continuous-wave:oef-cmro2:pet-mri-methods", campaignId: campaignIdForDomain("oef-cmro2"), domainId: "oef-cmro2", assertionRevisionIds: assertionIds("oef-cmro2", ["pet-reference-method-varies", "trust-pet-agreement", "qq-pet-regional-validation"]), classification: "METHOD_DIFFERENCE", rationale: "PET reference-method status and limited healthy-volunteer MRI validation are compatible but not interchangeable evidence.", resolutionApplied: false, contextsPreserved: freeze(["OXYGEN_15_PET", "TRUST_WHOLE_BRAIN", "QSM_QBOLD_REGIONAL"]) }),
]);

const retainedPmidsByDomain = Object.freeze({
  segmentation: ["38347141", "26263899", "15250643", "35840566", "37008654"],
  "t2-mapping": ["28992817", "35600490", "32460852", "36935515", "35659266"],
  "quality-control": ["26267831", "24919831", "39377680", "39656118", "34455593"],
  "neuro-oncology": ["37774317", "26250565", "32516388", "39656118", "30519867"],
  "oef-cmro2": ["32634594", "20700768", "32643207", "33243071", "22517498"],
});

const gapsByDomain = Object.freeze({
  segmentation: freeze(["TASK_SPECIFIC_METRIC_SELECTION_REMAINS_REQUIRED", "HUMAN_SCIENTIFIC_REVIEW_NOT_PERFORMED"]),
  "t2-mapping": freeze(["CROSS_VENDOR_GENERALIZATION_NOT_ESTABLISHED_BY_IDENTICAL_SCANNER_STUDY", "LOCAL_REFERENCE_RANGES_REMAIN_SITE_SPECIFIC", "HUMAN_SCIENTIFIC_REVIEW_NOT_PERFORMED"]),
  "quality-control": freeze(["QIB_SPECIFIC_CONFORMANCE_REQUIREMENTS_REMAIN_PROFILE_DEPENDENT", "HUMAN_SCIENTIFIC_REVIEW_NOT_PERFORMED"]),
  "neuro-oncology": freeze(["CRITERIA_APPLICABILITY_REMAINS_TRIAL_AND_TREATMENT_SPECIFIC", "DSC_IMPLEMENTATION_VARIABILITY_REMAINS", "HUMAN_SCIENTIFIC_REVIEW_NOT_PERFORMED"]),
  "oef-cmro2": freeze(["MRI_VALIDATION_SAMPLES_ARE_SMALL_AND_PRIMARILY_HEALTHY", "REGIONAL_CMRO2_VALIDATION_REMAINS_INCOMPLETE", "HUMAN_SCIENTIFIC_REVIEW_NOT_PERFORMED"]),
});

const createSynthesis = (domainId) => {
  const assertions = continuousWaveAssertionRevisions.filter((assertion) => assertion.domainId === domainId);
  const evidence = continuousWaveEvidenceLinks.filter((link) => link.domainId === domainId);
  const retainedSources = retainedPmidsByDomain[domainId].map((pmid) => sourceByPmid.get(pmid));
  const concepts = continuousWaveConcepts.filter((concept) => concept.domainId === domainId);
  const base = createStructuredLiteratureSynthesis({
    query: { domainId, subjectEntityIds: concepts.map((concept) => concept.stableId) },
    assertionRevisions: assertions,
    evidenceLinks: evidence,
    sourceRevisions: retainedSources,
  });
  const differences = continuousWaveContextDifferences.filter((item) => item.domainId === domainId);
  const missingData = freeze(unique([...(base.missingData ?? []), ...gapsByDomain[domainId]]));
  const material = { domainId, baseDigest: sha256Digest(base), missingData, contextDifferenceIds: differences.map((item) => item.contradictionId) };
  return freeze({
    ...base,
    recordType: "ScientificSynthesis",
    synthesisId: `noxia:radiology:scientific-synthesis:continuous-wave:${domainId}:state-of-knowledge`,
    key: `${domainId}-state-of-knowledge`,
    domainId,
    label: `${domainId} — état interne des connaissances`,
    concepts: freeze(concepts.map((concept) => concept.key)),
    contradictions: freeze(differences),
    convergence: freeze({ state: "CONTEXT_DEPENDENT_CONVERGENCE", rule: "Only assertions with compatible methods, populations and applicability contexts are grouped; source count alone never establishes consensus.", publicationMajorityUsed: false }),
    openQuestions: missingData,
    missingData,
    excludedSources: freeze(continuousWaveRejectedSources.filter((source) => source.domainId === domainId)),
    prose: null,
    generatedEditorialText: false,
    statisticalMetaAnalysisPerformed: false,
    deterministicDigest: sha256Digest(material),
  });
};

export const continuousWaveScientificSyntheses = freeze(Object.keys(assertionDefinitions).map(createSynthesis).sort((a, b) => a.domainId.localeCompare(b.domainId)));

export const continuousWaveInternalProjections = freeze(continuousWaveScientificSyntheses.map((synthesis) => {
  const material = { synthesisDigest: synthesis.deterministicDigest, guards: CONTINUOUS_WAVE_PUBLICATION_GUARDS };
  return freeze({
    recordType: "InternalScientificProjection",
    projectionId: `noxia:radiology:scientific-projection:continuous-wave:${synthesis.domainId}:state-of-knowledge`,
    key: `${synthesis.domainId}-internal-state-of-knowledge`,
    domainId: synthesis.domainId,
    label: `${synthesis.domainId} — projection scientifique interne`,
    fixtureType: "INTERNAL_SCIENTIFIC_PROJECTION",
    concepts: synthesis.concepts,
    definitions: freeze(synthesis.applicableAssertions.filter((assertion) => /IS_|ESTIMATES|PRODUCES|REQUIRES|USES/.test(assertion.predicate))),
    assertions: synthesis.applicableAssertions,
    evidenceLinks: synthesis.evidence,
    sources: synthesis.sources,
    contexts: synthesis.contexts,
    limitations: synthesis.limitations,
    contradictions: synthesis.contradictions,
    convergence: synthesis.convergence,
    questionsOpen: synthesis.openQuestions,
    history: synthesis.history,
    confidence: synthesis.overallConfidence,
    gaps: synthesis.missingData,
    prose: null,
    ...CONTINUOUS_WAVE_PUBLICATION_GUARDS,
    deterministicDigest: sha256Digest(material),
  });
}).sort((a, b) => a.domainId.localeCompare(b.domainId)));

const byDomain = (items, domainId) => items.filter((item) => item.domainId === domainId);

export const continuousWaveDomainPackages = freeze(Object.fromEntries(Object.keys(assertionDefinitions).sort().map((domainId) => {
  const retainedSources = retainedPmidsByDomain[domainId].map((pmid) => sourceByPmid.get(pmid));
  const newSources = retainedSources.filter((source) => continuousWaveSourceRevisions.some((item) => item.revisionId === source.revisionId));
  const concepts = byDomain(continuousWaveConcepts, domainId);
  const assertions = byDomain(continuousWaveAssertionRevisions, domainId);
  const evidenceLinks = byDomain(continuousWaveEvidenceLinks, domainId);
  const contextDifferences = byDomain(continuousWaveContextDifferences, domainId);
  const syntheses = byDomain(continuousWaveScientificSyntheses, domainId);
  const projections = byDomain(continuousWaveInternalProjections, domainId);
  const reviews = assertions.map((assertion) => continuousWaveReviewDecisions.find((review) => review.assertionRevisionId === assertion.revisionId));
  const packageMaterial = {
    domainId,
    retainedSourceRevisionIds: retainedSources.map((source) => source.revisionId),
    newSourceRevisionIds: newSources.map((source) => source.revisionId),
    conceptRevisionIds: concepts.map((item) => item.revisionId),
    assertionRevisionIds: assertions.map((item) => item.revisionId),
    evidenceLinkIds: evidenceLinks.map((item) => item.evidenceLinkId),
    synthesisIds: syntheses.map((item) => item.synthesisId),
    projectionIds: projections.map((item) => item.projectionId),
    gaps: gapsByDomain[domainId],
  };
  return [nodeIdForDomain(domainId), freeze({
    domainId,
    nodeId: nodeIdForDomain(domainId),
    campaignDefinitionId: campaignIdForDomain(domainId),
    retainedSources: freeze(retainedSources),
    newSources: freeze(newSources),
    rejectedSources: freeze(continuousWaveRejectedSources.filter((source) => source.domainId === domainId)),
    concepts: freeze(concepts),
    assertions: freeze(assertions),
    evidenceLinks: freeze(evidenceLinks),
    contextDifferences: freeze(contextDifferences),
    syntheses: freeze(syntheses),
    projections: freeze(projections),
    reviews: freeze(reviews),
    gaps: gapsByDomain[domainId],
    packageDigest: sha256Digest(packageMaterial),
  })];
})));

export const continuousWaveDataSummary = freeze({
  domainPackages: Object.keys(continuousWaveDomainPackages).length,
  newSources: continuousWaveSourceRevisions.length,
  retainedSourceAssociations: Object.values(continuousWaveDomainPackages).reduce((sum, item) => sum + item.retainedSources.length, 0),
  concepts: continuousWaveConcepts.length,
  assertions: continuousWaveAssertionRevisions.length,
  evidenceLinks: continuousWaveEvidenceLinks.length,
  reviews: continuousWaveReviewDecisions.length,
  contextDifferences: continuousWaveContextDifferences.length,
  syntheses: continuousWaveScientificSyntheses.length,
  internalProjections: continuousWaveInternalProjections.length,
  rejectedSources: continuousWaveRejectedSources.length,
});

if (continuousWaveDataSummary.assertions !== 60 || continuousWaveDataSummary.evidenceLinks !== 60) {
  throw new Error(`CONTINUOUS_WAVE_DATA_COUNT_INVALID:${continuousWaveDataSummary.assertions}:${continuousWaveDataSummary.evidenceLinks}`);
}
