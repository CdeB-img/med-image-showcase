import { sha256Digest } from "../migration/stable-json.mjs";
import { P5_RETRIEVED_AT } from "./constants.mjs";

const rows = [
  // Diffusion / ADC
  ["diffusion-adc", "33836457", null, "10.1016/j.jns.2021.117435", "Diffusion weighted imaging in acute ischemic stroke: A review of its interpretation pitfalls and advanced diffusion imaging application.", "Nagaraja N", "Journal of the neurological sciences", "2021-06-15", "425", null, "117435", "REVIEW"],
  ["diffusion-adc", "26892827", "PMC4983499", "10.1002/jmri.25196", "Diffusion-weighted imaging outside the brain: Consensus statement from an ISMRM-sponsored workshop.", "Taouli B; Beer AJ; Chenevert T; Collins D; Lehman C; Matos C; Padhani AR; Rosenkrantz AB; Shukla-Dave A; Sigmund E; Tanenbaum L; Thoeny H; Thomassin-Naggara I; Barbieri S; Corcuera-Solano I; Orton M; Partridge SC; Koh DM", "Journal of magnetic resonance imaging : JMRI", "2016-09-01", "44", "3", "521-540", "CONSENSUS"],
  ["diffusion-adc", "28956113", "PMC5811587", "10.1007/s00330-017-4972-z", "Implementing diffusion-weighted MRI for body imaging in prospective multicentre trials: current considerations and future perspectives.", "deSouza NM; Winfield JM; Waterton JC; Weller A; Papoutsaki MV; Doran SJ; Collins DJ; Fournier L; Sullivan D; Chenevert T; Jackson A; Boss M; Trattnig S; Liu Y", "European radiology", "2018-03-01", "28", "3", "1118-1131", "MULTICENTER_METHOD_REVIEW"],
  ["diffusion-adc", "23023785", "PMC3548033", "10.1002/jmri.23825", "Multi-system repeatability and reproducibility of apparent diffusion coefficient measurement using an ice-water phantom.", "Malyarenko D; Galbán CJ; Londy FJ; Meyer CR; Johnson TD; Rehemtulla A; Ross BD; Chenevert TL", "Journal of magnetic resonance imaging : JMRI", "2013-05-01", "37", "5", "1238-1246", "MULTISYSTEM_VALIDATION"],
  ["diffusion-adc", "25802212", "PMC4403968", "10.1002/nbm.3269", "Multi-centre reproducibility of diffusion MRI parameters for clinical sequences in the brain.", "Grech-Sollars M; Hales PW; Miyazaki K; Raschke F; Rodriguez D; Wilson M; Gill SK; Banks T; Saunders DE; Clayden JD; Gwilliam MN; Barrick TR; Morgan PS; Davies NP; Rossiter J; Auer DP; Grundy R; Leach MO; Howe FA; Peet AC; Clark CA", "NMR in biomedicine", "2015-04-01", "28", "4", "468-485", "MULTICENTER_STUDY"],
  ["diffusion-adc", "39377680", "PMC11537247", "10.1148/radiol.233055", "The QIBA Profile for Diffusion-Weighted MRI: Apparent Diffusion Coefficient as a Quantitative Imaging Biomarker.", "Boss MA; Malyarenko D; Partridge S; Obuchowski N; Shukla-Dave A; Winfield JM; Fuller CD; Miller K; Mishra V; Ohliger M; Wilmes LJ; Attariwala R; Andrews T; deSouza NM; Margolis DJ; Chenevert TL", "Radiology", "2024-10-01", "313", "1", "e233055", "QIBA_PROFILE"],
  ["diffusion-adc", "38535004", "PMC10969680", "10.3390/diagnostics14060583", "Whole Process of Standardization of Diffusion-Weighted Imaging: Phantom Validation and Clinical Application According to the QIBA Profile.", "Choi SJ; Kim KW; Ko Y; Cho YC; Jang JS; Ahn H; Kim DW; Kim MY", "Diagnostics (Basel, Switzerland)", "2024-03-09", "14", "6", null, "TECHNICAL_VALIDATION"],
  ["diffusion-adc", "19186405", "PMC2631136", "10.1593/neo.81328", "Diffusion-weighted magnetic resonance imaging as a cancer biomarker: consensus and recommendations.", "Padhani AR; Liu G; Koh DM; Chenevert TL; Thoeny HC; Takahara T; Dzik-Jurasz A; Ross BD; Van Cauteren M; Collins D; Hammoud DA; Rustin GJ; Taouli B; Choyke PL", "Neoplasia (New York, N.Y.)", "2009-02-01", "11", "2", "102-125", "CONSENSUS"],
  ["diffusion-adc", "37437609", "PMC11197850", "10.1016/j.radonc.2023.109803", "Recommendations for improved reproducibility of ADC derivation on behalf of the Elekta MRI-linac consortium image analysis working group.", "Bisgaard ALH; Keesman R; van Lier ALHMW; Coolens C; van Houdt PJ; Tree A; Wetscherek A; Romesser PB; Tyagi N; Lo Russo M; Habrich J; Vesprini D; Lau AZ; Mook S; Chung P; Kerkmeijer LGW; Gouw ZAR; Lorenzen EL; van der Heide UA; Schytte T; Brink C; Mahmood F", "Radiotherapy and oncology", "2023-09-01", "186", null, "109803", "RECOMMENDATION"],

  // Cerebral perfusion
  ["cerebral-perfusion", "31019604", "PMC6479142", "10.5114/pjr.2019.83182", "The effect of software post-processing applications on identification of the penumbra and core within the ischaemic region in perfusion computed tomography.", "Gleń A; Chrzan R; Urbanik A", "Polish journal of radiology", "2019-02-15", "84", null, "e118-e125", "METHOD_COMPARISON"],
  ["cerebral-perfusion", "21785096", null, "10.2214/AJR.10.6058", "The relative effect of vendor variability in CT perfusion results: a method comparison study.", "Zussman BM; Boghosian G; Gorniak RJ; Olszewski ME; Read KM; Siddiqui KM; Flanders AE", "AJR. American journal of roentgenology", "2011-08-01", "197", "2", "468-473", "METHOD_COMPARISON"],
  ["cerebral-perfusion", "36010624", "PMC9406974", "10.3390/cells11162547", "Comparison of Two Software Packages for Perfusion Imaging: Ischemic Core and Penumbra Estimation and Patient Triage in Acute Ischemic Stroke.", "Zhou X; Nan Y; Ju J; Zhou J; Xiao H; Wang S", "Cells", "2022-08-16", "11", "16", null, "METHOD_COMPARISON"],
  ["cerebral-perfusion", "37021148", "PMC10069177", "10.1177/23969873221135915", "Comparative analysis of core and perfusion lesion volumes between commercially available computed tomography perfusion software.", "Suomalainen OP; Martinez-Majander N; Sibolt G; Bäcklund K; Järveläinen J; Korvenoja A; Tiainen M; Forss N; Curtze S", "European stroke journal", "2023-03-01", "8", "1", "259-267", "METHOD_COMPARISON"],
  ["cerebral-perfusion", "31203208", null, "10.1136/neurintsurg-2019-014822", "Comparison of three commonly used CT perfusion software packages in patients with acute ischemic stroke.", "Koopman MS; Berkhemer OA; Geuskens RREG; Emmer BJ; van Walderveen MAA; Jenniskens SFM; van Zwam WH; van Oostenbrugge RJ; van der Lugt A; Dippel DWJ; Beenen LF; Roos YBWEM; Marquering HA; Majoie CBLM; MR CLEAN Trial Investigators", "Journal of neurointerventional surgery", "2019-12-01", "11", "12", "1249-1256", "MULTICENTER_METHOD_COMPARISON"],
  ["cerebral-perfusion", "23264345", null, "10.1148/radiol.12120971", "Perfusion CT in acute stroke: a comprehensive analysis of infarct and penumbra.", "Bivard A; Levi C; Spratt N; Parsons M", "Radiology", "2013-05-01", "267", "2", "543-550", "VALIDATION_STUDY"],
  ["cerebral-perfusion", "30346227", "PMC6727131", "10.1177/0271678X18805590", "CT perfusion in acute stroke: Practical guidance for implementation in clinical practice.", "Christensen S; Lansberg MG", "Journal of cerebral blood flow and metabolism", "2019-09-01", "39", "9", "1664-1668", "PRACTICE_GUIDANCE"],
  ["cerebral-perfusion", "38052882", "PMC10698076", "10.1038/s41598-023-48700-6", "CT perfusion stroke lesion threshold calibration between deconvolution algorithms.", "Chung KJ; De Sarno D; Lee TY", "Scientific reports", "2023-12-05", "13", "1", "21458", "CALIBRATION_STUDY"],
  ["cerebral-perfusion", "25907520", "PMC5074767", "10.3174/ajnr.A4341", "ASFNR recommendations for clinical performance of MR dynamic susceptibility contrast perfusion imaging of the brain.", "Welker K; Boxerman J; Kalnin A; Kaufmann T; Shiroishi M; Wintermark M; American Society of Functional Neuroradiology MR Perfusion Standards and Practice Subcommittee of the ASFNR Clinical Practice Committee", "AJNR. American journal of neuroradiology", "2015-06-01", "36", "6", "E41-E51", "RECOMMENDATION"],
  ["cerebral-perfusion", "21640299", "PMC3135980", "10.1016/j.nic.2011.02.007", "MR perfusion imaging in acute ischemic stroke.", "Copen WA; Schaefer PW; Wu O", "Neuroimaging clinics of North America", "2011-05-01", "21", "2", "259-283, x", "REVIEW"],

  // Myocardial tissue characterization
  ["myocardial-tissue-characterization", "30231886", "PMC6147157", "10.1186/s12968-018-0484-5", "Society for Cardiovascular Magnetic Resonance (SCMR) expert consensus for CMR imaging endpoints in clinical research: part I - analytical validation and clinical qualification.", "Puntmann VO; Valbuena S; Hinojar R; Petersen SE; Greenwood JP; Kramer CM; Kwong RY; McCann GP; Berry C; Nagel E; SCMR Clinical Trial Writing Group", "Journal of cardiovascular magnetic resonance", "2018-09-20", "20", "1", "67", "CONSENSUS"],
  ["myocardial-tissue-characterization", "23021401", "PMC3514126", "10.1186/1532-429X-14-68", "CMR of microvascular obstruction and hemorrhage in myocardial infarction.", "Wu KC", "Journal of cardiovascular magnetic resonance", "2012-09-29", "14", "1", "68", "REVIEW"],
  ["myocardial-tissue-characterization", "25212800", "PMC4301583", "10.1016/j.jcmg.2014.06.012", "Effect of microvascular obstruction and intramyocardial hemorrhage by CMR on LV remodeling and outcomes after myocardial infarction: a systematic review and meta-analysis.", "Hamirani YS; Wong A; Kramer CM; Salerno M", "JACC. Cardiovascular imaging", "2014-09-01", "7", "9", "940-952", "SYSTEMATIC_REVIEW_META_ANALYSIS"],
  ["myocardial-tissue-characterization", "29712696", "PMC5933067", "10.1161/CIRCULATIONAHA.117.030693", "Cardiovascular Magnetic Resonance in Acute ST-Segment-Elevation Myocardial Infarction: Recent Advances, Controversies, and Future Directions.", "Bulluck H; Dharmakumar R; Arai AE; Berry C; Hausenloy DJ", "Circulation", "2018-05-01", "137", "18", "1949-1964", "REVIEW"],
  ["myocardial-tissue-characterization", "25759823", "PMC4336749", "10.1155/2015/859073", "Intramyocardial hemorrhage: an enigma for cardiac MRI?", "Calvieri C; Masselli G; Monti R; Spreca M; Gualdi GF; Fedele F", "BioMed research international", "2015-01-01", "2015", null, "859073", "REVIEW"],
  ["myocardial-tissue-characterization", "21329899", null, "10.1016/j.jcmg.2010.11.015", "Evaluation of techniques for the quantification of myocardial scar of differing etiology using cardiac magnetic resonance.", "Flett AS; Hasleton J; Cook C; Hausenloy D; Quarta G; Ariti C; Muthurangu V; Moon JC", "JACC. Cardiovascular imaging", "2011-02-01", "4", "2", "150-156", "METHOD_COMPARISON"],
  ["myocardial-tissue-characterization", "25315701", "PMC4189726", "10.1186/s12968-014-0085-x", "Accuracy and reproducibility of semi-automated late gadolinium enhancement quantification techniques in patients with hypertrophic cardiomyopathy.", "Mikami Y; Kolman L; Joncas SX; Stirrat J; Scholl D; Rajchl M; Lydell CP; Weeks SG; Howarth AG; White JA", "Journal of cardiovascular magnetic resonance", "2014-10-07", "16", "1", "85", "METHOD_VALIDATION"],
  ["myocardial-tissue-characterization", "30813942", "PMC6393997", "10.1186/s12968-019-0520-0", "Comparison of myocardial fibrosis quantification methods by cardiovascular magnetic resonance imaging for risk stratification of patients with suspected myocarditis.", "Gräni C; Eichhorn C; Bière L; Kaneko K; Murthy VL; Agarwal V; Aghayev A; Steigner M; Blankstein R; Jerosch-Herold M; Kwong RY", "Journal of cardiovascular magnetic resonance", "2019-02-28", "21", "1", "14", "METHOD_COMPARISON"],
  ["myocardial-tissue-characterization", "29162123", "PMC5696884", "10.1186/s12968-017-0407-x", "Prospective comparison of novel dark blood late gadolinium enhancement with conventional bright blood imaging for the detection of scar.", "Francis R; Kellman P; Kotecha T; Baggiano A; Norrington K; Martinez-Naharro A; Nordin S; Knight DS; Rakhit RD; Lockie T; Hawkins PN; Moon JC; Hausenloy DJ; Xue H; Hansen MS; Fontana M", "Journal of cardiovascular magnetic resonance", "2017-11-21", "19", "1", "91", "PROSPECTIVE_METHOD_COMPARISON"],

  // Spectral CT
  ["spectral-ct", "29185902", null, "10.1148/radiol.2017170896", "Intermanufacturer Comparison of Dual-Energy CT Iodine Quantification and Monochromatic Attenuation: A Phantom Study.", "Jacobsen MC; Schellingerhout D; Wood CA; Tamm EP; Godoy MC; Sun J; Cody DD", "Radiology", "2018-04-01", "287", "1", "224-234", "INTERPLATFORM_PHANTOM_STUDY"],
  ["spectral-ct", "30276672", null, "10.1007/s00330-018-5736-0", "How accurate and precise are CT based measurements of iodine concentration? A comparison of the minimum detectable concentration difference among single source and dual source dual energy CT in a phantom study.", "Euler A; Solomon J; Mazurowski MA; Samei E; Nelson RC", "European radiology", "2019-04-01", "29", "4", "2069-2078", "PHANTOM_STUDY"],
  ["spectral-ct", "28168368", "PMC5544802", "10.1007/s00330-017-4752-9", "Accuracy of iodine quantification using dual energy CT in latest generation dual source and dual layer CT.", "Pelgrim GJ; van Hamersvelt RW; Willemink MJ; Schmidt BT; Flohr T; Schilham A; Milles J; Oudkerk M; Leiner T; Vliegenthart R", "European radiology", "2017-09-01", "27", "9", "3904-3912", "INTERPLATFORM_PHANTOM_STUDY"],
  ["spectral-ct", "38189979", null, "10.1007/s00330-023-10560-z", "Intra-patient variability of iodine quantification across different dual-energy CT platforms: assessment of normalization techniques.", "Lennartz S; Cao J; Pisuchpen N; Srinivas-Rao S; Locascio JJ; Parakh A; Hahn PF; Mileto A; Sahani D; Kambadakone A", "European radiology", "2024-08-01", "34", "8", "5131-5141", "INTERPLATFORM_CLINICAL_STUDY"],
  ["spectral-ct", "31237496", "PMC6694721", "10.1148/radiol.2019182870", "Dual-Energy CT: Lower Limits of Iodine Detection and Quantification.", "Jacobsen MC; Cressman ENK; Tamm EP; Baluya DL; Duan X; Cody DD; Schellingerhout D; Layman RR", "Radiology", "2019-08-01", "292", "2", "414-419", "PHANTOM_STUDY"],
  ["spectral-ct", "34668387", null, "10.2214/AJR.21.26714", "A Method for Reducing Variability Across Dual-Energy CT Manufacturers in Quantification of Low Iodine Content Levels.", "Cai LM; Hippe DS; Zamora DA; Cao J; Parakh A; Kambadakone AR; Xiao JM; Wang SS; Toia GV; Gunn ML; Wang CL; Mileto A", "AJR. American journal of roentgenology", "2022-04-01", "218", "4", "746-755", "INTERPLATFORM_METHOD_STUDY"],
  ["spectral-ct", "33411614", "PMC7853765", "10.1148/rg.2021200102", "Dual-Energy CT Images: Pearls and Pitfalls.", "Parakh A; Lennartz S; An C; Rajiah P; Yeh BM; Simeone FJ; Sahani DV; Kambadakone AR", "Radiographics", "2021-01-01", "41", "1", "98-119", "TECHNICAL_REVIEW"],
  ["spectral-ct", "30919651", "PMC6592074", "10.1259/bjr.20180546", "Dual energy computed tomography virtual monoenergetic imaging: technique and clinical applications.", "D'Angelo T; Cicero G; Mazziotti S; Ascenti G; Albrecht MH; Martin SS; Othman AE; Vogl TJ; Wichmann JL", "The British journal of radiology", "2019-06-01", "92", "1098", "20180546", "TECHNICAL_REVIEW"],
  ["spectral-ct", "36828369", "PMC9964233", "10.3390/tomography9010017", "Pros and Cons of Dual-Energy CT Systems: \"One Does Not Fit All\".", "Borges AP; Antunes C; Curvo-Semedo L", "Tomography", "2023-01-27", "9", "1", "195-216", "TECHNICAL_REVIEW"],
  ["spectral-ct", "36047540", "PMC9434736", "10.3348/kjr.2022.0377", "Photon-Counting Detector CT: Key Points Radiologists Should Know.", "Esquivel A; Ferrero A; Mileto A; Baffour F; Horst K; Rajiah PS; Inoue A; Leng S; McCollough C; Fletcher JG", "Korean journal of radiology", "2022-09-01", "23", "9", "854-865", "TECHNICAL_REVIEW"],
];

const sourceRecord = ([domainId, pmid, pmcid, doi, title, authors, journal, publishedAt, volume, issue, pages, sourceType]) => {
  const stableId = `noxia:scientific-source:pubmed:${pmid}`;
  const revisionId = `${stableId}:revision:1`;
  const fullTextAvailability = pmcid ? "OFFICIAL_FULL_TEXT" : "ABSTRACT_ONLY";
  const material = { domainId, pmid, pmcid, doi, title, authors, journal, publishedAt, volume, issue, pages, sourceType, fullTextAvailability };
  return Object.freeze({
    stableId,
    revisionId,
    revisionNumber: 1,
    domainId,
    pmid,
    pmcid,
    doi,
    title,
    authors: Object.freeze(authors.split("; ")),
    journal,
    publishedAt,
    volume,
    issue,
    pages,
    language: "en",
    sourceType,
    documentStatus: "CURRENT",
    fullTextAvailability,
    abstractOnly: !pmcid,
    officialMetadataUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    officialFullTextUrl: pmcid ? `https://pmc.ncbi.nlm.nih.gov/articles/${pmcid}/` : null,
    metadataAuthority: "NCBI_PUBMED_ESUMMARY_V2",
    authorsCompleteness: "COMPLETE_FROM_PUBMED",
    retrievedAt: P5_RETRIEVED_AT,
    digest: sha256Digest(material),
  });
};

export const multidomainSourceRevisions = Object.freeze(rows.map(sourceRecord).sort((a, b) => a.revisionId.localeCompare(b.revisionId)));
export const multidomainSourceIdentities = Object.freeze(multidomainSourceRevisions.map(({ stableId, pmid, doi, title }) => Object.freeze({ stableId, pmid, doi, title })));
export const sourceByPmid = Object.freeze(Object.fromEntries(multidomainSourceRevisions.map((source) => [source.pmid, source])));

export const internalMultidomainSourceAudit = Object.freeze([
  { path: "src/knowledge-graph/catalog.mjs", type: "HISTORICAL_CONCEPT_CATALOG", domains: ["diffusion-adc", "cerebral-perfusion", "myocardial-tissue-characterization", "spectral-ct"], exploitation: "INVENTORY_ONLY_NOT_EVIDENCE" },
  { path: "src/pages/IRMImagerieQuantitative.tsx", type: "PUBLIC_PAGE", domains: ["diffusion-adc", "myocardial-tissue-characterization"], exploitation: "VOCABULARY_INVENTORY_ONLY" },
  { path: "src/pages/PerfusionCerebrale.tsx", type: "PUBLIC_PAGE", domains: ["cerebral-perfusion"], exploitation: "VOCABULARY_INVENTORY_ONLY" },
  { path: "src/pages/PerfusionHemodynamiqueNeuro.tsx", type: "PUBLIC_PAGE", domains: ["cerebral-perfusion"], exploitation: "VOCABULARY_INVENTORY_ONLY" },
  { path: "src/pages/CTPerfusionQuantitative.tsx", type: "PUBLIC_PAGE", domains: ["cerebral-perfusion"], exploitation: "VOCABULARY_INVENTORY_ONLY" },
  { path: "src/pages/BiomarqueursIRMCardiaqueEssais.tsx", type: "PUBLIC_PAGE", domains: ["myocardial-tissue-characterization"], exploitation: "VOCABULARY_INVENTORY_ONLY" },
  { path: "src/pages/ScannerSpectralPrincipe.tsx", type: "PUBLIC_PAGE", domains: ["spectral-ct"], exploitation: "VOCABULARY_INVENTORY_ONLY" },
  { path: "src/pages/ScannerDoubleEnergie.tsx", type: "PUBLIC_PAGE", domains: ["spectral-ct"], exploitation: "VOCABULARY_INVENTORY_ONLY" },
  { path: "src/pages/ScannerComptagePhoton.tsx", type: "PUBLIC_PAGE", domains: ["spectral-ct"], exploitation: "VOCABULARY_INVENTORY_ONLY" },
  { path: "src/pages/ReferencesPublications.tsx", type: "PUBLIC_REFERENCE_PAGE", domains: ["diffusion-adc", "cerebral-perfusion", "myocardial-tissue-characterization", "spectral-ct"], exploitation: "REFERENCE_INVENTORY_REQUIRES_PRIMARY_VERIFICATION" },
]);

export const rejectedMultidomainSources = Object.freeze([
  { domainId: "diffusion-adc", sourceRef: "PMC12314170", title: "Multi-institution longitudinal apparent diffusion coefficient measurements in a diffusion weighted imaging phantom at room temperature", reason: "OVERLAPS_RETAINED_QIBA_AND_PHANTOM_EVIDENCE" },
  { domainId: "diffusion-adc", sourceRef: "PMC5968828", title: "Apparent Diffusion Coefficient Is Highly Reproducible on Preclinical Imaging Systems", reason: "PRECLINICAL_NONHUMAN_SCOPE" },
  { domainId: "cerebral-perfusion", sourceRef: "PMID:41327069", title: null, reason: "ABSTRACT_ONLY_AND_OVERLAPS_SOFTWARE_COMPARISONS" },
  { domainId: "cerebral-perfusion", sourceRef: "PMID:40234640", title: null, reason: "OVERLAPS_RETAINED_SOFTWARE_COMPARISONS" },
  { domainId: "cerebral-perfusion", sourceRef: "PMID:37179549", title: "Comparison of two computed tomography perfusion post-processing software to assess infarct volume in patients with acute ischemic stroke", reason: "OVERLAPS_RETAINED_SOFTWARE_COMPARISONS" },
  { domainId: "cerebral-perfusion", sourceRef: "PMID:38081878", title: null, reason: "ALTERNATE_ACQUISITION_OUTSIDE_P5_CORE" },
  { domainId: "myocardial-tissue-characterization", sourceRef: "PMID:36424508", title: null, reason: "DISEASE_SPECIFIC_OVERLAP" },
  { domainId: "myocardial-tissue-characterization", sourceRef: "PMID:33219845", title: null, reason: "ALGORITHM_SPECIFIC_OVERLAP" },
  { domainId: "myocardial-tissue-characterization", sourceRef: "PMID:38822240", title: null, reason: "ALGORITHM_SPECIFIC_OVERLAP" },
  { domainId: "myocardial-tissue-characterization", sourceRef: "PMID:39274260", title: null, reason: "DISEASE_SPECIFIC_OVERLAP" },
  { domainId: "spectral-ct", sourceRef: "PMID:39072220", title: null, reason: "FIRST_GENERATION_PLATFORM_SPECIFIC_OVERLAP" },
  { domainId: "spectral-ct", sourceRef: "PMID:29624708", title: null, reason: "RADIOTHERAPY_APPLICATION_OUTSIDE_P5_CORE" },
  { domainId: "spectral-ct", sourceRef: "PMID:29446082", title: null, reason: "SINGLE_SYSTEM_QC_NARROWER_THAN_RETAINED_INTERPLATFORM_EVIDENCE" },
  { domainId: "spectral-ct", sourceRef: "PMID:33506433", title: null, reason: "DISEASE_SPECIFIC_VNC_APPLICATION_OUTSIDE_P5_CORE" },
]);

const byDomain = (items, domainId) => items.filter((item) => item.domainId === domainId);
export const multidomainSourceSummary = Object.freeze({
  externalExamined: multidomainSourceRevisions.length + rejectedMultidomainSources.length,
  retained: multidomainSourceRevisions.length,
  rejected: rejectedMultidomainSources.length,
  fullText: multidomainSourceRevisions.filter((source) => !source.abstractOnly).length,
  abstractOnly: multidomainSourceRevisions.filter((source) => source.abstractOnly).length,
  internalInventoryItems: internalMultidomainSourceAudit.length,
  byDomain: Object.freeze(Object.fromEntries(["diffusion-adc", "cerebral-perfusion", "myocardial-tissue-characterization", "spectral-ct"].map((domainId) => [domainId, Object.freeze({
    examined: byDomain(multidomainSourceRevisions, domainId).length + byDomain(rejectedMultidomainSources, domainId).length,
    retained: byDomain(multidomainSourceRevisions, domainId).length,
    rejected: byDomain(rejectedMultidomainSources, domainId).length,
    fullText: byDomain(multidomainSourceRevisions, domainId).filter((source) => !source.abstractOnly).length,
    abstractOnly: byDomain(multidomainSourceRevisions, domainId).filter((source) => source.abstractOnly).length,
  })]))),
});

