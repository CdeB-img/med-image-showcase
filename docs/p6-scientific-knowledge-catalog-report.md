# P6 — Scientific Knowledge Catalog

> Registre interne de pilotage. Il ne contient aucune connaissance scientifique, aucune prose publique et aucune autorisation de publication.

## 1. État Git initial

Branche `main`, HEAD `857e94b6df88289b59de149fe8f77e84dbee9492`. Les travaux cohérents P1–P5 sont préservés. Aucun commit, push ou déploiement n'a été effectué.

## 2. Périmètre vérifiable

Le catalogue est exhaustif dans le périmètre `REPOSITORY_OBSERVED_AND_EXPLICITLY_PLANNED` : 118 identités historiques, 42 concepts P4R, 60 concepts P5, cinq domaines enrichis et dix domaines explicitement planifiés. Il ne prétend pas constituer une taxonomie universelle de toute la radiologie.

## 3. Résumé

KnowledgeNodes : 235. Concepts : 220. Domaines : 15. Sources référencées : 87. Assertions existantes reliées : 155. EvidenceLinks existants reliés : 192.

Profondeur maximale : 2. Densité dirigée : 0.002219. Nœuds complets : 80. Nœuds incomplets : 155.

Projections virtuelles estimées : 1357, dont 1086 opportunités de pages. Ces nombres sont des capacités calculées, pas un plan de publication ni des pages générées.

### Répartition par type

| Type | Nœuds |
| --- | --- |
| Abbreviation | 6 |
| AcquisitionCondition | 1 |
| AcquisitionInput | 1 |
| AcquisitionMethod | 8 |
| AcquisitionParameter | 2 |
| Biomarker | 13 |
| BodySystem | 3 |
| ClinicalQuestion | 3 |
| Confounder | 6 |
| ContrastAgentClass | 3 |
| CoreLab | 1 |
| Definition | 1 |
| DerivedMeasurement | 10 |
| Disease | 9 |
| Domain | 15 |
| Feature | 5 |
| Finding | 8 |
| Format | 3 |
| Guideline | 1 |
| Limitation | 1 |
| Measurement | 5 |
| MeasurementDefinition | 3 |
| MeasurementMethod | 5 |
| Modality | 2 |
| ModelComponent | 1 |
| ModelInput | 1 |
| Observation | 9 |
| Organ | 3 |
| ParametricMap | 3 |
| PhysicalPhenomenon | 1 |
| Pipeline | 6 |
| Publication | 9 |
| QualityAttribute | 7 |
| QualityControlObject | 1 |
| QualityMethod | 1 |
| QualityMetric | 2 |
| Recommendation | 1 |
| ReconstructionMethod | 3 |
| ReconstructionOutput | 2 |
| Region | 3 |
| ResearchProject | 6 |
| Sequence | 6 |
| SequenceFamily | 9 |
| Service | 4 |
| SoftwareMethod | 1 |
| Standard | 2 |
| Study | 3 |
| Synonym | 2 |
| TechnicalContext | 3 |
| Technology | 3 |
| TechnologyImplementation | 5 |
| Terminology | 1 |
| Tool | 8 |
| Viewer | 8 |
| Workflow | 6 |

### Répartition par statut

| Statut | Nœuds |
| --- | --- |
| DISCOVERING | 10 |
| MODELING | 125 |
| PROJECTED | 99 |
| READY | 1 |

### Répartition par priorité

| Priorité | Nœuds |
| --- | --- |
| HIGH | 58 |
| LOW | 112 |
| MEDIUM | 65 |

## 4. KnowledgeNodes

| KnowledgeNode | Type | Priorité | Statut | Couverture | Assertions | Sources |
| --- | --- | --- | --- | --- | --- | --- |
| Perfusion cérébrale | Domain | HIGH (96) | PROJECTED | PARTIAL (0.7407) | 24 | 10 |
| Diffusion et ADC | Domain | HIGH (96) | PROJECTED | PARTIAL (0.7407) | 24 | 9 |
| ECV et mapping T1 myocardique | Domain | HIGH (96) | PROJECTED | COMPLETE (1) | 58 | 27 |
| Imagerie hépatique | Domain | HIGH (68) | DISCOVERING | NONE (0) | 0 | 0 |
| Caractérisation tissulaire myocardique | Domain | HIGH (96) | PROJECTED | PARTIAL (0.7407) | 25 | 9 |
| Neuro-oncologie | Domain | HIGH (68) | DISCOVERING | NONE (0) | 0 | 0 |
| Médecine nucléaire | Domain | HIGH (63) | DISCOVERING | NONE (0) | 0 | 0 |
| OEF et CMRO2 | Domain | HIGH (65) | DISCOVERING | NONE (0) | 0 | 0 |
| Applications du CT à comptage photonique | Domain | HIGH (63) | DISCOVERING | NONE (0) | 0 | 0 |
| Contrôle qualité en imagerie | Domain | HIGH (69) | DISCOVERING | NONE (0) | 0 | 0 |
| Radiomique | Domain | HIGH (64) | DISCOVERING | NONE (0) | 0 | 0 |
| Recalage d'images | Domain | HIGH (64) | DISCOVERING | NONE (0) | 0 | 0 |
| Segmentation en imagerie | Domain | HIGH (70) | DISCOVERING | NONE (0) | 0 | 0 |
| CT spectral | Domain | HIGH (96) | PROJECTED | PARTIAL (0.7407) | 24 | 10 |
| Mapping T2 | Domain | HIGH (70) | DISCOVERING | NONE (0) | 0 | 0 |
| CBF — abbreviation record | Abbreviation | LOW (22) | MODELING | PARTIAL (0.6667) | 0 | 1 |
| CBV — abbreviation record | Abbreviation | LOW (22) | MODELING | PARTIAL (0.6667) | 0 | 1 |
| CMRO2 — abbreviation record | Abbreviation | LOW (22) | MODELING | PARTIAL (0.6667) | 0 | 1 |
| ECV — abbreviation record | Abbreviation | LOW (22) | MODELING | PARTIAL (0.6667) | 0 | 1 |
| MTT — abbreviation record | Abbreviation | LOW (22) | MODELING | PARTIAL (0.6667) | 0 | 1 |
| OEF — abbreviation record | Abbreviation | LOW (22) | MODELING | PARTIAL (0.6667) | 0 | 1 |
| Modified Look-Locker inversion recovery | AcquisitionMethod | HIGH (76) | PROJECTED | HIGH (0.9583) | 9 | 4 |
| Saturation recovery single-shot acquisition | AcquisitionMethod | HIGH (68) | PROJECTED | HIGH (0.9583) | 6 | 4 |
| Shortened Modified Look-Locker inversion recovery | AcquisitionMethod | MEDIUM (45) | PROJECTED | PARTIAL (0.5972) | 1 | 2 |
| Coefficient de diffusion apparent | Biomarker | MEDIUM (43) | MODELING | LOW (0.0556) | 0 | 1 |
| Débit sanguin cérébral | Biomarker | MEDIUM (45) | MODELING | LOW (0.0556) | 0 | 1 |
| Volume sanguin cérébral | Biomarker | MEDIUM (45) | MODELING | LOW (0.0556) | 0 | 1 |
| Consommation cérébrale d'oxygène | Biomarker | MEDIUM (45) | MODELING | LOW (0.0556) | 0 | 1 |
| Volume extracellulaire | Biomarker | HIGH (92) | PROJECTED | COMPLETE (1) | 35 | 21 |
| Rehaussement tardif — quantification | Biomarker | MEDIUM (43) | MODELING | LOW (0.0556) | 0 | 1 |
| Temps de transit moyen | Biomarker | MEDIUM (45) | MODELING | LOW (0.0556) | 0 | 1 |
| Obstruction microvasculaire | Biomarker | MEDIUM (43) | MODELING | LOW (0.0556) | 0 | 1 |
| Hémorragie intramyocardique | Biomarker | MEDIUM (43) | MODELING | LOW (0.0556) | 0 | 1 |
| Fraction d'extraction d'oxygène | Biomarker | MEDIUM (45) | MODELING | LOW (0.0556) | 0 | 1 |
| T1 natif | Biomarker | HIGH (86) | PROJECTED | HIGH (0.8889) | 9 | 8 |
| T2 mapping | Biomarker | MEDIUM (43) | MODELING | LOW (0.0556) | 0 | 1 |
| Temps au maximum | Biomarker | MEDIUM (43) | MODELING | LOW (0.0556) | 0 | 1 |
| Système cardiovasculaire | BodySystem | LOW (28) | MODELING | LOW (0.0556) | 0 | 1 |
| Système nerveux | BodySystem | LOW (28) | MODELING | LOW (0.0556) | 0 | 1 |
| Système respiratoire | BodySystem | LOW (28) | MODELING | LOW (0.0556) | 0 | 1 |
| Caractérisation tissulaire cardiaque | ClinicalQuestion | LOW (27) | MODELING | LOW (0.0556) | 0 | 1 |
| Quantification multicentrique | ClinicalQuestion | LOW (27) | MODELING | LOW (0.0556) | 0 | 1 |
| Quantification de la perfusion neurovasculaire | ClinicalQuestion | LOW (27) | MODELING | LOW (0.0556) | 0 | 1 |
| Cardiac and respiratory motion | Confounder | MEDIUM (43) | PROJECTED | PARTIAL (0.6667) | 1 | 2 |
| Heart-rate dependence | Confounder | MEDIUM (43) | PROJECTED | PARTIAL (0.7222) | 1 | 3 |
| Mapping-method dependence | Confounder | HIGH (57) | PROJECTED | HIGH (0.8333) | 2 | 4 |
| Off-resonance | Confounder | LOW (34) | PROJECTED | PARTIAL (0.6111) | 1 | 1 |
| Partial-volume effect | Confounder | LOW (34) | PROJECTED | PARTIAL (0.6111) | 1 | 1 |
| Gadolinium-based contrast agent | ContrastAgentClass | HIGH (66) | PROJECTED | HIGH (0.8889) | 12 | 7 |
| Iodinated contrast agent | ContrastAgentClass | HIGH (59) | PROJECTED | HIGH (0.8333) | 7 | 4 |
| Core Lab IRM cardiovasculaire multicentrique | CoreLab | LOW (27) | MODELING | LOW (0.0556) | 0 | 1 |
| Définition opérationnelle de biomarqueur quantitatif | Definition | LOW (26) | MODELING | PARTIAL (0.6667) | 0 | 1 |
| CT myocardial extracellular volume fraction | DerivedMeasurement | HIGH (87) | PROJECTED | HIGH (0.8148) | 8 | 5 |
| CMR myocardial extracellular volume fraction | DerivedMeasurement | HIGH (92) | PROJECTED | HIGH (0.963) | 20 | 14 |
| AVC ischémique aigu | Disease | MEDIUM (43) | MODELING | LOW (0.0556) | 0 | 1 |
| Acute myocardial infarction | Disease | HIGH (59) | PROJECTED | HIGH (0.7917) | 2 | 2 |
| Acute myocarditis | Disease | HIGH (82) | PROJECTED | HIGH (0.8333) | 6 | 4 |
| Lésion tumorale cérébrale | Disease | MEDIUM (43) | MODELING | LOW (0.0556) | 0 | 1 |
| Infarctus du myocarde avec sus-décalage du segment ST | Disease | MEDIUM (43) | MODELING | LOW (0.0556) | 0 | 1 |
| Systemic light-chain amyloidosis | Disease | HIGH (59) | PROJECTED | HIGH (0.7917) | 2 | 2 |
| Superposition de masques | Feature | LOW (28) | MODELING | LOW (0.0556) | 0 | 1 |
| Contrôle qualité visuel | Feature | LOW (28) | MODELING | LOW (0.0556) | 0 | 1 |
| Comparaison de recalage | Feature | LOW (28) | MODELING | LOW (0.0556) | 0 | 1 |
| Navigation de coupes | Feature | LOW (28) | MODELING | LOW (0.0556) | 0 | 1 |
| Fenêtrage | Feature | LOW (28) | MODELING | LOW (0.0556) | 0 | 1 |
| Diffuse myocardial fibrosis | Finding | HIGH (57) | PROJECTED | HIGH (0.7778) | 2 | 2 |
| DICOM — format | Format | LOW (31) | MODELING | PARTIAL (0.6667) | 0 | 1 |
| DICOM SEG | Format | LOW (27) | MODELING | PARTIAL (0.6667) | 0 | 1 |
| NIfTI | Format | LOW (27) | MODELING | PARTIAL (0.6667) | 0 | 1 |
| SCMR Guidelines — Standardisation IRM cardiaque | Guideline | LOW (26) | MODELING | LOW (0.0556) | 0 | 1 |
| Change in longitudinal relaxation rate | MeasurementDefinition | MEDIUM (42) | PROJECTED | PARTIAL (0.7222) | 1 | 2 |
| Hematocrit | MeasurementDefinition | HIGH (68) | PROJECTED | HIGH (0.8333) | 5 | 6 |
| Longitudinal relaxation rate | MeasurementDefinition | MEDIUM (37) | MODELING | LOW (0.1111) | 0 | 2 |
| Myocardial T1 mapping | MeasurementMethod | HIGH (82) | PROJECTED | COMPLETE (1) | 43 | 20 |
| Synthetic hematocrit | MeasurementMethod | HIGH (56) | PROJECTED | HIGH (0.75) | 3 | 2 |
| Mesure CBF | Measurement | MEDIUM (43) | MODELING | LOW (0.0556) | 0 | 1 |
| Mesure CMRO2 | Measurement | MEDIUM (43) | MODELING | LOW (0.0556) | 0 | 1 |
| Mesure ECV | Measurement | MEDIUM (43) | MODELING | LOW (0.0556) | 0 | 1 |
| Mesure OEF | Measurement | MEDIUM (43) | MODELING | LOW (0.0556) | 0 | 1 |
| Mesure Tmax | Measurement | MEDIUM (43) | MODELING | LOW (0.0556) | 0 | 1 |
| CT | Modality | HIGH (91) | PROJECTED | COMPLETE (1) | 47 | 24 |
| IRM | Modality | HIGH (91) | PROJECTED | COMPLETE (1) | 108 | 43 |
| Delayed blood CT attenuation | Observation | LOW (33) | MODELING | LOW (0.0556) | 0 | 1 |
| Delayed myocardial CT attenuation | Observation | LOW (33) | MODELING | LOW (0.0556) | 0 | 1 |
| Iodine density change | Observation | MEDIUM (39) | PROJECTED | PARTIAL (0.6429) | 1 | 1 |
| Native blood T1 | Observation | MEDIUM (46) | PROJECTED | HIGH (0.7619) | 2 | 2 |
| Native myocardial T1 | Observation | HIGH (66) | PROJECTED | HIGH (0.7619) | 3 | 4 |
| Post-contrast blood T1 | Observation | MEDIUM (46) | PROJECTED | HIGH (0.7619) | 2 | 2 |
| Post-contrast myocardial T1 | Observation | MEDIUM (52) | PROJECTED | HIGH (0.7619) | 2 | 2 |
| Pre-contrast blood CT attenuation | Observation | LOW (33) | MODELING | LOW (0.0556) | 0 | 1 |
| Pre-contrast myocardial CT attenuation | Observation | LOW (33) | MODELING | LOW (0.0556) | 0 | 1 |
| Cerveau | Organ | LOW (29) | MODELING | LOW (0.0556) | 0 | 1 |
| Cœur | Organ | LOW (29) | MODELING | LOW (0.0556) | 0 | 1 |
| Poumon | Organ | LOW (27) | MODELING | LOW (0.0556) | 0 | 1 |
| Pipeline de démonstration de quantification cardiaque | Pipeline | LOW (28) | MODELING | LOW (0.0556) | 0 | 1 |
| Pipeline de démonstration de quantification CT | Pipeline | LOW (30) | MODELING | LOW (0.0556) | 0 | 1 |
| Pipeline de conversion DICOM vers NIfTI | Pipeline | LOW (27) | MODELING | LOW (0.0556) | 0 | 1 |
| Pipeline de recalage multimodal | Pipeline | LOW (31) | MODELING | LOW (0.0556) | 0 | 1 |
| Pipeline de segmentation neuro-oncologique | Pipeline | LOW (28) | MODELING | LOW (0.0556) | 0 | 1 |
| Pipeline de démonstration de segmentation de perfusion | Pipeline | LOW (31) | MODELING | LOW (0.0556) | 0 | 1 |
| Collaterals influence oxygen metabolism on admission MRI in acute ischemic stroke | Publication | LOW (26) | MODELING | PARTIAL (0.6667) | 0 | 1 |
| COVERT-MI — publication record | Publication | LOW (27) | MODELING | PARTIAL (0.6667) | 0 | 1 |
| Inflammation biomarkers & penumbra mismatch in acute ischemic stroke | Publication | LOW (26) | MODELING | PARTIAL (0.6667) | 0 | 1 |
| Belle L et al. Circ Cardiovasc Interv. 2016;9(3):e003388. | Publication | LOW (26) | MODELING | PARTIAL (0.6667) | 0 | 1 |
| Shear-Wave Elastography Assessments of Quadriceps Stiffness Changes prior to, during and after Prolonged Exercise: A Longitudinal Study during an Extreme Mountain Ultra-Marathon | Publication | LOW (26) | MODELING | PARTIAL (0.6667) | 0 | 1 |
| Correction: Shear-Wave Elastography Assessments of Quadriceps Stiffness Changes prior to, during and after Prolonged Exercise | Publication | LOW (26) | MODELING | PARTIAL (0.6667) | 0 | 1 |
| Association of myocardial hemorrhage and persistent microvascular obstruction with circulating inflammatory biomarkers in STEMI patients | Publication | LOW (26) | MODELING | PARTIAL (0.6667) | 0 | 1 |
| Serum Soluble Tumor Necrosis Factor Receptors 1 and 2 Are Early Prognosis Markers After ST-Segment Elevation Myocardial Infarction | Publication | LOW (26) | MODELING | PARTIAL (0.6667) | 0 | 1 |
| Oxygen Extraction Fraction Mapping on Admission Magnetic Resonance Imaging May Predict Recovery of Hyperacute Ischemic Brain Lesions After Successful Thrombectomy: A Retrospective Observational Study | Publication | LOW (26) | MODELING | PARTIAL (0.6667) | 0 | 1 |
| Interreader reproducibility | QualityAttribute | LOW (28) | MODELING | LOW (0.0556) | 0 | 1 |
| Interscanner reproducibility | QualityAttribute | LOW (33) | PROJECTED | PARTIAL (0.7222) | 1 | 1 |
| Intersite reproducibility | QualityAttribute | MEDIUM (38) | PROJECTED | HIGH (0.7778) | 1 | 2 |
| Measurement accuracy | QualityAttribute | MEDIUM (48) | PROJECTED | HIGH (0.8889) | 3 | 2 |
| Measurement precision | QualityAttribute | MEDIUM (45) | PROJECTED | HIGH (0.8889) | 3 | 2 |
| Repeatability | QualityAttribute | MEDIUM (43) | PROJECTED | HIGH (0.7778) | 1 | 2 |
| Reproducibility | QualityAttribute | MEDIUM (38) | PROJECTED | HIGH (0.7778) | 1 | 2 |
| Recommandations EACVI sur la reproductibilité des biomarqueurs | Recommendation | LOW (26) | MODELING | LOW (0.0556) | 0 | 1 |
| Région cérébrale | Region | LOW (27) | MODELING | LOW (0.0556) | 0 | 1 |
| Myocarde | Region | LOW (27) | MODELING | LOW (0.0556) | 0 | 1 |
| Région thoracique | Region | LOW (26) | MODELING | LOW (0.0556) | 0 | 1 |
| IRM cardiaque | ResearchProject | LOW (28) | MODELING | LOW (0.0556) | 0 | 1 |
| Analyse CT quantitative | ResearchProject | LOW (28) | MODELING | LOW (0.0556) | 0 | 1 |
| Neuro-oncologie IRM | ResearchProject | LOW (28) | MODELING | LOW (0.0556) | 0 | 1 |
| Perfusion cérébrale CT/IRM | ResearchProject | LOW (28) | MODELING | LOW (0.0556) | 0 | 1 |
| Recalage IRM / CT | ResearchProject | LOW (28) | MODELING | LOW (0.0556) | 0 | 1 |
| Outils sur mesure | ResearchProject | LOW (27) | MODELING | LOW (0.0556) | 0 | 1 |
| Fonction d'entrée artérielle | ModelInput | LOW (34) | PROJECTED | PARTIAL (0.5556) | 1 | 1 |
| Débit sanguin cérébral | DerivedMeasurement | HIGH (78) | PROJECTED | PARTIAL (0.7407) | 6 | 3 |
| Volume sanguin cérébral | DerivedMeasurement | HIGH (62) | PROJECTED | PARTIAL (0.7407) | 3 | 2 |
| Bolus de contraste | AcquisitionInput | MEDIUM (46) | PROJECTED | PARTIAL (0.7222) | 2 | 3 |
| Perfusion cérébrale CT | AcquisitionMethod | MEDIUM (50) | PROJECTED | PARTIAL (0.7083) | 4 | 2 |
| Déconvolution de perfusion | ReconstructionMethod | HIGH (58) | PROJECTED | PARTIAL (0.7143) | 7 | 2 |
| Segmentation de core ischémique | Finding | HIGH (68) | PROJECTED | PARTIAL (0.7407) | 2 | 4 |
| Volume lésionnel de perfusion | DerivedMeasurement | MEDIUM (54) | PROJECTED | PARTIAL (0.5926) | 1 | 2 |
| Perfusion IRM DSC | AcquisitionMethod | MEDIUM (37) | PROJECTED | PARTIAL (0.5417) | 1 | 1 |
| Temps de transit moyen | DerivedMeasurement | HIGH (65) | PROJECTED | PARTIAL (0.7407) | 3 | 2 |
| Segmentation de pénombre | Finding | HIGH (62) | PROJECTED | PARTIAL (0.6852) | 1 | 3 |
| Carte paramétrique de perfusion | ParametricMap | MEDIUM (50) | PROJECTED | PARTIAL (0.7143) | 2 | 3 |
| Logiciel de post-traitement de perfusion | SoftwareMethod | HIGH (69) | PROJECTED | HIGH (0.7619) | 8 | 6 |
| Fonction résidu | ModelComponent | LOW (28) | MODELING | LOW (0.0556) | 0 | 1 |
| Tmax | DerivedMeasurement | HIGH (64) | PROJECTED | PARTIAL (0.7037) | 3 | 2 |
| Accident vasculaire cérébral ischémique aigu | Disease | HIGH (58) | PROJECTED | PARTIAL (0.6528) | 4 | 1 |
| Carte ADC | ParametricMap | MEDIUM (42) | PROJECTED | PARTIAL (0.6587) | 1 | 2 |
| Répétabilité ADC | QualityMetric | MEDIUM (44) | PROJECTED | PARTIAL (0.6111) | 1 | 2 |
| Reproductibilité ADC | QualityMetric | HIGH (62) | PROJECTED | HIGH (0.7778) | 5 | 4 |
| Valeur ADC | DerivedMeasurement | HIGH (89) | PROJECTED | PARTIAL (0.7407) | 15 | 8 |
| Valeur b | AcquisitionParameter | HIGH (56) | PROJECTED | PARTIAL (0.7222) | 4 | 4 |
| Diffusion moléculaire | PhysicalPhenomenon | LOW (33) | READY | LOW (0.1667) | 1 | 1 |
| Fantôme de diffusion | QualityControlObject | MEDIUM (39) | PROJECTED | PARTIAL (0.6032) | 1 | 2 |
| Restriction de diffusion | Finding | MEDIUM (54) | PROJECTED | PARTIAL (0.6481) | 2 | 1 |
| Pondération en diffusion | AcquisitionParameter | LOW (28) | MODELING | LOW (0.0556) | 0 | 1 |
| Imagerie pondérée en diffusion | AcquisitionMethod | HIGH (63) | PROJECTED | HIGH (0.75) | 5 | 5 |
| Non-linéarité des gradients | Limitation | MEDIUM (37) | PROJECTED | PARTIAL (0.7222) | 2 | 1 |
| Contribution de perfusion aux faibles valeurs b | Confounder | MEDIUM (35) | PROJECTED | PARTIAL (0.5556) | 1 | 1 |
| Calcul ADC mono-exponentiel | MeasurementMethod | MEDIUM (40) | PROJECTED | PARTIAL (0.5417) | 1 | 1 |
| Profil QIBA ADC | Standard | MEDIUM (43) | PROJECTED | PARTIAL (0.6587) | 1 | 2 |
| LGE sang noir | AcquisitionMethod | MEDIUM (37) | PROJECTED | PARTIAL (0.5417) | 1 | 1 |
| Contraste gadoliné | ContrastAgentClass | LOW (33) | PROJECTED | PARTIAL (0.5556) | 1 | 1 |
| Hémorragie intramyocardique | Finding | HIGH (83) | PROJECTED | PARTIAL (0.7407) | 7 | 5 |
| Inversion-récupération | SequenceFamily | MEDIUM (39) | PROJECTED | PARTIAL (0.537) | 1 | 1 |
| Acquisition de rehaussement tardif | AcquisitionMethod | MEDIUM (41) | PROJECTED | PARTIAL (0.6528) | 2 | 1 |
| Rehaussement tardif myocardique | Finding | HIGH (69) | PROJECTED | PARTIAL (0.7037) | 3 | 3 |
| Motif de rehaussement tardif | Finding | MEDIUM (51) | PROJECTED | PARTIAL (0.537) | 1 | 1 |
| Quantification du LGE | MeasurementMethod | HIGH (64) | PROJECTED | HIGH (0.75) | 8 | 3 |
| Obstruction microvasculaire | Finding | HIGH (73) | PROJECTED | PARTIAL (0.7407) | 5 | 3 |
| Infarctus du myocarde | Disease | HIGH (70) | PROJECTED | PARTIAL (0.7083) | 5 | 3 |
| Annulation myocardique | AcquisitionCondition | LOW (33) | PROJECTED | PARTIAL (0.5556) | 1 | 1 |
| Myocardite | Disease | MEDIUM (51) | PROJECTED | PARTIAL (0.5833) | 1 | 1 |
| PSIR | ReconstructionMethod | MEDIUM (35) | PROJECTED | PARTIAL (0.5476) | 1 | 1 |
| T2* myocardique | MeasurementMethod | MEDIUM (40) | PROJECTED | PARTIAL (0.5417) | 1 | 1 |
| Séquence T2 sensible aux produits sanguins | SequenceFamily | MEDIUM (38) | PROJECTED | PARTIAL (0.537) | 1 | 1 |
| CT double énergie | Technology | HIGH (59) | PROJECTED | PARTIAL (0.7037) | 2 | 2 |
| Détecteur double couche | TechnologyImplementation | MEDIUM (45) | PROJECTED | PARTIAL (0.7083) | 2 | 2 |
| Double énergie bi-source | TechnologyImplementation | MEDIUM (37) | PROJECTED | PARTIAL (0.5417) | 1 | 1 |
| Numéro atomique effectif | DerivedMeasurement | MEDIUM (46) | MODELING | LOW (0.0556) | 0 | 1 |
| Concentration iodée | DerivedMeasurement | HIGH (80) | PROJECTED | PARTIAL (0.7407) | 8 | 6 |
| Carte d'iode | ParametricMap | MEDIUM (47) | PROJECTED | HIGH (0.7619) | 3 | 2 |
| Décomposition de matériaux | ReconstructionMethod | MEDIUM (39) | PROJECTED | PARTIAL (0.7063) | 2 | 1 |
| CT à comptage photonique | Technology | HIGH (62) | PROJECTED | PARTIAL (0.7037) | 3 | 2 |
| Commutation rapide de kVp | TechnologyImplementation | MEDIUM (41) | PROJECTED | PARTIAL (0.6528) | 2 | 1 |
| Double énergie séquentielle | TechnologyImplementation | LOW (31) | MODELING | LOW (0.0556) | 0 | 1 |
| Calibration spectrale | QualityMethod | MEDIUM (39) | PROJECTED | PARTIAL (0.6587) | 1 | 2 |
| CT spectral | Technology | MEDIUM (51) | PROJECTED | PARTIAL (0.537) | 1 | 1 |
| Filtre divisé | TechnologyImplementation | LOW (31) | MODELING | LOW (0.0556) | 0 | 1 |
| Image monoénergétique virtuelle | ReconstructionOutput | MEDIUM (40) | PROJECTED | PARTIAL (0.6667) | 4 | 1 |
| Image virtuelle sans contraste | ReconstructionOutput | LOW (33) | PROJECTED | PARTIAL (0.5556) | 1 | 1 |
| Inversion-recovery T1 mapping | SequenceFamily | MEDIUM (53) | PROJECTED | HIGH (0.7778) | 2 | 3 |
| Saturation-recovery T1 mapping | SequenceFamily | MEDIUM (53) | PROJECTED | HIGH (0.7778) | 2 | 3 |
| Ciné cardiaque — séquence | Sequence | LOW (33) | MODELING | LOW (0.0556) | 0 | 1 |
| Diffusion — séquence | Sequence | LOW (33) | MODELING | LOW (0.0556) | 0 | 1 |
| Late Gadolinium Enhancement — séquence | Sequence | LOW (34) | MODELING | LOW (0.0556) | 0 | 1 |
| CT perfusion — acquisition | Sequence | LOW (33) | MODELING | LOW (0.0556) | 0 | 1 |
| T1 mapping — séquence | Sequence | LOW (33) | MODELING | LOW (0.0556) | 0 | 1 |
| T2 mapping — séquence | Sequence | LOW (33) | MODELING | LOW (0.0556) | 0 | 1 |
| Famille ciné cardiaque | SequenceFamily | LOW (32) | MODELING | LOW (0.0556) | 0 | 1 |
| Famille de mapping cardiaque | SequenceFamily | LOW (34) | MODELING | LOW (0.0556) | 0 | 1 |
| Famille de diffusion | SequenceFamily | LOW (32) | MODELING | LOW (0.0556) | 0 | 1 |
| Famille de rehaussement tardif | SequenceFamily | LOW (32) | MODELING | LOW (0.0556) | 0 | 1 |
| Famille de perfusion | SequenceFamily | LOW (32) | MODELING | LOW (0.0556) | 0 | 1 |
| Service Core Lab IRM / CT | Service | LOW (27) | MODELING | LOW (0.0556) | 0 | 1 |
| Service d'audit DICOM | Service | LOW (27) | MODELING | LOW (0.0556) | 0 | 1 |
| Service d'harmonisation multicentrique | Service | LOW (27) | MODELING | LOW (0.0556) | 0 | 1 |
| Service d'ingénierie quantitative | Service | LOW (27) | MODELING | LOW (0.0556) | 0 | 1 |
| DICOM — standard reference | Standard | LOW (31) | MODELING | LOW (0.0556) | 0 | 1 |
| COVERT-MI — étude | Study | LOW (28) | MODELING | LOW (0.0556) | 0 | 1 |
| MIMI | Study | LOW (27) | MODELING | LOW (0.0556) | 0 | 1 |
| RHU MARVELOUS | Study | LOW (27) | MODELING | LOW (0.0556) | 0 | 1 |
| CoreLab / Core Lab | Synonym | LOW (22) | MODELING | PARTIAL (0.6667) | 0 | 1 |
| Late Gadolinium Enhancement / rehaussement tardif | Synonym | LOW (22) | MODELING | PARTIAL (0.6667) | 0 | 1 |
| 1.5 T magnetic field strength | TechnicalContext | HIGH (63) | PROJECTED | HIGH (0.9444) | 6 | 5 |
| 3 T magnetic field strength | TechnicalContext | HIGH (66) | PROJECTED | HIGH (0.9444) | 7 | 6 |
| Post-contrast acquisition delay | TechnicalContext | HIGH (63) | PROJECTED | HIGH (0.9444) | 4 | 5 |
| Tags DICOM | Terminology | LOW (27) | MODELING | PARTIAL (0.6667) | 0 | 1 |
| ANTsPy | Tool | LOW (28) | MODELING | LOW (0.0556) | 0 | 1 |
| Elastix | Tool | LOW (28) | MODELING | LOW (0.0556) | 0 | 1 |
| Matplotlib | Tool | LOW (27) | MODELING | LOW (0.0556) | 0 | 1 |
| NiBabel | Tool | LOW (28) | MODELING | LOW (0.0556) | 0 | 1 |
| NumPy | Tool | LOW (27) | MODELING | LOW (0.0556) | 0 | 1 |
| Python | Tool | LOW (28) | MODELING | LOW (0.0556) | 0 | 1 |
| React | Tool | LOW (27) | MODELING | LOW (0.0556) | 0 | 1 |
| SimpleITK | Tool | LOW (28) | MODELING | LOW (0.0556) | 0 | 1 |
| CardiacViewer | Viewer | LOW (29) | MODELING | LOW (0.0556) | 0 | 1 |
| CTScanViewer | Viewer | LOW (29) | MODELING | LOW (0.0556) | 0 | 1 |
| NeuroOncoViewer | Viewer | LOW (29) | MODELING | LOW (0.0556) | 0 | 1 |
| PerfusionSegmentationViewer | Viewer | LOW (30) | MODELING | LOW (0.0556) | 0 | 1 |
| QCViewer | Viewer | LOW (31) | MODELING | LOW (0.0556) | 0 | 1 |
| RegistrationViewer | Viewer | LOW (30) | MODELING | LOW (0.0556) | 0 | 1 |
| SliceViewer | Viewer | LOW (30) | MODELING | LOW (0.0556) | 0 | 1 |
| OutilsViewer | Viewer | LOW (29) | MODELING | LOW (0.0556) | 0 | 1 |
| Workflow Core Lab IRM cardiaque | Workflow | LOW (29) | MODELING | LOW (0.0556) | 0 | 1 |
| Anonymisation DICOM | Workflow | LOW (30) | MODELING | LOW (0.0556) | 0 | 1 |
| Audit DICOM | Workflow | LOW (30) | MODELING | LOW (0.0556) | 0 | 1 |
| Harmonisation multicentrique | Workflow | LOW (29) | MODELING | LOW (0.0556) | 0 | 1 |
| Contrôle qualité | Workflow | LOW (29) | MODELING | LOW (0.0556) | 0 | 1 |
| Chaîne d'imagerie quantitative | Workflow | LOW (29) | MODELING | LOW (0.0556) | 0 | 1 |

## 5. Graphe et projections virtuelles

| KnowledgeNode | Parents | Enfants | Relations | Projections |
| --- | --- | --- | --- | --- |
| Perfusion cérébrale | 0 | 17 | 0 | Glossary, Guide, FAQ, Comparison, StateOfKnowledge, ScientificSummary, Reference, Documentation, API |
| Diffusion et ADC | 0 | 16 | 0 | Glossary, Guide, FAQ, Comparison, StateOfKnowledge, ScientificSummary, Reference, Documentation, API |
| ECV et mapping T1 myocardique | 0 | 46 | 0 | Glossary, Guide, FAQ, Comparison, StateOfKnowledge, ScientificSummary, Reference, Documentation, API |
| Imagerie hépatique | 0 | 0 | 0 | API |
| Caractérisation tissulaire myocardique | 0 | 16 | 0 | Glossary, Guide, FAQ, Comparison, StateOfKnowledge, ScientificSummary, Reference, Documentation, API |
| Neuro-oncologie | 0 | 0 | 0 | API |
| Médecine nucléaire | 0 | 0 | 0 | API |
| OEF et CMRO2 | 0 | 0 | 0 | API |
| Applications du CT à comptage photonique | 0 | 0 | 0 | API |
| Contrôle qualité en imagerie | 0 | 0 | 0 | API |
| Radiomique | 0 | 0 | 0 | API |
| Recalage d'images | 0 | 0 | 0 | API |
| Segmentation en imagerie | 0 | 0 | 0 | API |
| CT spectral | 0 | 16 | 0 | Glossary, Guide, FAQ, Comparison, StateOfKnowledge, ScientificSummary, Reference, Documentation, API |
| Mapping T2 | 0 | 0 | 0 | API |
| CBF — abbreviation record | 0 | 0 | 1 | Glossary, Reference, API |
| CBV — abbreviation record | 0 | 0 | 1 | Glossary, Reference, API |
| CMRO2 — abbreviation record | 0 | 0 | 1 | Glossary, Reference, API |
| ECV — abbreviation record | 0 | 0 | 1 | Glossary, Reference, API |
| MTT — abbreviation record | 0 | 0 | 1 | Glossary, Reference, API |
| OEF — abbreviation record | 0 | 0 | 1 | Glossary, Reference, API |
| Modified Look-Locker inversion recovery | 1 | 0 | 11 | Glossary, Guide, FAQ, Comparison, ScientificSummary, Tutorial, Reference, API |
| Saturation recovery single-shot acquisition | 1 | 0 | 7 | Glossary, Guide, FAQ, Comparison, ScientificSummary, Tutorial, Reference, API |
| Shortened Modified Look-Locker inversion recovery | 1 | 0 | 4 | Glossary, Guide, FAQ, Comparison, ScientificSummary, Tutorial, Reference, API |
| Coefficient de diffusion apparent | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| Débit sanguin cérébral | 0 | 0 | 1 | Glossary, Guide, Comparison, Reference, API |
| Volume sanguin cérébral | 0 | 0 | 1 | Glossary, Guide, Comparison, Reference, API |
| Consommation cérébrale d'oxygène | 0 | 0 | 1 | Glossary, Guide, Comparison, Reference, API |
| Volume extracellulaire | 1 | 0 | 12 | Glossary, Guide, FAQ, Comparison, StateOfKnowledge, ScientificSummary, Reference, ViewerOverlay, API |
| Rehaussement tardif — quantification | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| Temps de transit moyen | 0 | 0 | 1 | Glossary, Guide, Comparison, Reference, API |
| Obstruction microvasculaire | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| Hémorragie intramyocardique | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| Fraction d'extraction d'oxygène | 0 | 0 | 1 | Glossary, Guide, Comparison, Reference, API |
| T1 natif | 1 | 0 | 7 | Glossary, Guide, FAQ, Comparison, StateOfKnowledge, ScientificSummary, Reference, ViewerOverlay, API |
| T2 mapping | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| Temps au maximum | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| Système cardiovasculaire | 0 | 1 | 0 | Glossary, Guide, Reference, API |
| Système nerveux | 0 | 1 | 0 | Glossary, Guide, Reference, API |
| Système respiratoire | 0 | 1 | 0 | Glossary, Guide, Reference, API |
| Caractérisation tissulaire cardiaque | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| Quantification multicentrique | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| Quantification de la perfusion neurovasculaire | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| Cardiac and respiratory motion | 1 | 0 | 5 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Heart-rate dependence | 1 | 0 | 2 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Mapping-method dependence | 1 | 0 | 7 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Off-resonance | 1 | 0 | 2 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Partial-volume effect | 1 | 0 | 2 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Gadolinium-based contrast agent | 1 | 0 | 4 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Iodinated contrast agent | 1 | 0 | 1 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Core Lab IRM cardiovasculaire multicentrique | 0 | 0 | 1 | Glossary, Guide, Reference, API |
| Définition opérationnelle de biomarqueur quantitatif | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| CT myocardial extracellular volume fraction | 1 | 0 | 8 | Glossary, Guide, FAQ, Comparison, StateOfKnowledge, ScientificSummary, Reference, ViewerOverlay, API |
| CMR myocardial extracellular volume fraction | 1 | 0 | 24 | Glossary, Guide, FAQ, Comparison, StateOfKnowledge, ScientificSummary, Reference, ViewerOverlay, API |
| AVC ischémique aigu | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| Acute myocardial infarction | 1 | 0 | 2 | Glossary, Guide, FAQ, StateOfKnowledge, ScientificSummary, Reference, CaseStudy, API |
| Acute myocarditis | 1 | 0 | 7 | Glossary, Guide, FAQ, StateOfKnowledge, ScientificSummary, Reference, CaseStudy, API |
| Lésion tumorale cérébrale | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| Infarctus du myocarde avec sus-décalage du segment ST | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| Systemic light-chain amyloidosis | 1 | 0 | 2 | Glossary, Guide, FAQ, StateOfKnowledge, ScientificSummary, Reference, CaseStudy, API |
| Superposition de masques | 0 | 0 | 1 | Glossary, Guide, Reference, Documentation, API |
| Contrôle qualité visuel | 0 | 0 | 1 | Glossary, Guide, Reference, Documentation, API |
| Comparaison de recalage | 0 | 0 | 1 | Glossary, Guide, Reference, Documentation, API |
| Navigation de coupes | 0 | 0 | 1 | Glossary, Guide, Reference, Documentation, API |
| Fenêtrage | 0 | 0 | 1 | Glossary, Guide, Reference, Documentation, API |
| Diffuse myocardial fibrosis | 1 | 0 | 2 | Glossary, Guide, FAQ, StateOfKnowledge, ScientificSummary, Reference, CaseStudy, ViewerOverlay, API |
| DICOM — format | 0 | 0 | 3 | Glossary, Guide, Reference, Documentation, API |
| DICOM SEG | 0 | 0 | 0 | Glossary, Guide, Reference, Documentation, API |
| NIfTI | 0 | 0 | 0 | Glossary, Guide, Reference, Documentation, API |
| SCMR Guidelines — Standardisation IRM cardiaque | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| Change in longitudinal relaxation rate | 1 | 0 | 1 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Hematocrit | 1 | 0 | 7 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Longitudinal relaxation rate | 1 | 0 | 0 | Glossary, Guide, Reference, API |
| Myocardial T1 mapping | 1 | 0 | 25 | Glossary, Guide, FAQ, Comparison, ScientificSummary, Tutorial, Reference, API |
| Synthetic hematocrit | 1 | 0 | 6 | Glossary, Guide, FAQ, Comparison, ScientificSummary, Tutorial, Reference, API |
| Mesure CBF | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| Mesure CMRO2 | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| Mesure ECV | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| Mesure OEF | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| Mesure Tmax | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| CT | 3 | 0 | 23 | Glossary, Guide, FAQ, Comparison, StateOfKnowledge, ScientificSummary, Reference, API |
| IRM | 4 | 0 | 52 | Glossary, Guide, FAQ, Comparison, StateOfKnowledge, ScientificSummary, Reference, API |
| Delayed blood CT attenuation | 1 | 0 | 0 | Glossary, Guide, Reference, API |
| Delayed myocardial CT attenuation | 1 | 0 | 0 | Glossary, Guide, Reference, API |
| Iodine density change | 1 | 0 | 1 | Glossary, Guide, FAQ, ScientificSummary, Reference, ViewerOverlay, API |
| Native blood T1 | 1 | 0 | 1 | Glossary, Guide, FAQ, ScientificSummary, Reference, ViewerOverlay, API |
| Native myocardial T1 | 1 | 0 | 8 | Glossary, Guide, FAQ, ScientificSummary, Reference, ViewerOverlay, API |
| Post-contrast blood T1 | 1 | 0 | 1 | Glossary, Guide, FAQ, ScientificSummary, Reference, ViewerOverlay, API |
| Post-contrast myocardial T1 | 1 | 0 | 6 | Glossary, Guide, FAQ, ScientificSummary, Reference, ViewerOverlay, API |
| Pre-contrast blood CT attenuation | 1 | 0 | 0 | Glossary, Guide, Reference, API |
| Pre-contrast myocardial CT attenuation | 1 | 0 | 0 | Glossary, Guide, Reference, API |
| Cerveau | 1 | 1 | 0 | Glossary, Guide, Reference, API |
| Cœur | 1 | 1 | 0 | Glossary, Guide, Reference, API |
| Poumon | 1 | 0 | 0 | Glossary, Guide, Reference, API |
| Pipeline de démonstration de quantification cardiaque | 0 | 0 | 1 | Glossary, Guide, Reference, Documentation, API |
| Pipeline de démonstration de quantification CT | 0 | 0 | 2 | Glossary, Guide, Reference, Documentation, API |
| Pipeline de conversion DICOM vers NIfTI | 0 | 0 | 0 | Glossary, Guide, Reference, Documentation, API |
| Pipeline de recalage multimodal | 0 | 0 | 3 | Glossary, Guide, Reference, Documentation, API |
| Pipeline de segmentation neuro-oncologique | 0 | 0 | 1 | Glossary, Guide, Reference, Documentation, API |
| Pipeline de démonstration de segmentation de perfusion | 0 | 0 | 3 | Glossary, Guide, Reference, Documentation, API |
| Collaterals influence oxygen metabolism on admission MRI in acute ischemic stroke | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| COVERT-MI — publication record | 0 | 0 | 1 | Glossary, Guide, Reference, API |
| Inflammation biomarkers & penumbra mismatch in acute ischemic stroke | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| Belle L et al. Circ Cardiovasc Interv. 2016;9(3):e003388. | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| Shear-Wave Elastography Assessments of Quadriceps Stiffness Changes prior to, during and after Prolonged Exercise: A Longitudinal Study during an Extreme Mountain Ultra-Marathon | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| Correction: Shear-Wave Elastography Assessments of Quadriceps Stiffness Changes prior to, during and after Prolonged Exercise | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| Association of myocardial hemorrhage and persistent microvascular obstruction with circulating inflammatory biomarkers in STEMI patients | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| Serum Soluble Tumor Necrosis Factor Receptors 1 and 2 Are Early Prognosis Markers After ST-Segment Elevation Myocardial Infarction | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| Oxygen Extraction Fraction Mapping on Admission Magnetic Resonance Imaging May Predict Recovery of Hyperacute Ischemic Brain Lesions After Successful Thrombectomy: A Retrospective Observational Study | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| Interreader reproducibility | 1 | 0 | 0 | Glossary, Guide, Reference, API |
| Interscanner reproducibility | 1 | 0 | 1 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Intersite reproducibility | 1 | 0 | 1 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Measurement accuracy | 1 | 0 | 5 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Measurement precision | 1 | 0 | 3 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Repeatability | 1 | 0 | 5 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Reproducibility | 1 | 0 | 1 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Recommandations EACVI sur la reproductibilité des biomarqueurs | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| Région cérébrale | 1 | 0 | 0 | Glossary, Guide, Reference, API |
| Myocarde | 1 | 0 | 0 | Glossary, Guide, Reference, API |
| Région thoracique | 0 | 0 | 0 | Glossary, Guide, Reference, API |
| IRM cardiaque | 0 | 0 | 1 | Glossary, Guide, Reference, CaseStudy, API |
| Analyse CT quantitative | 0 | 0 | 1 | Glossary, Guide, Reference, CaseStudy, API |
| Neuro-oncologie IRM | 0 | 0 | 1 | Glossary, Guide, Reference, CaseStudy, API |
| Perfusion cérébrale CT/IRM | 0 | 0 | 1 | Glossary, Guide, Reference, CaseStudy, API |
| Recalage IRM / CT | 0 | 0 | 1 | Glossary, Guide, Reference, CaseStudy, API |
| Outils sur mesure | 0 | 0 | 0 | Glossary, Guide, Reference, CaseStudy, API |
| Fonction d'entrée artérielle | 1 | 0 | 2 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Débit sanguin cérébral | 1 | 0 | 7 | Glossary, Guide, FAQ, Comparison, StateOfKnowledge, ScientificSummary, Reference, ViewerOverlay, API |
| Volume sanguin cérébral | 1 | 0 | 3 | Glossary, Guide, FAQ, Comparison, StateOfKnowledge, ScientificSummary, Reference, ViewerOverlay, API |
| Bolus de contraste | 1 | 0 | 2 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Perfusion cérébrale CT | 1 | 0 | 3 | Glossary, Guide, FAQ, Comparison, ScientificSummary, Tutorial, Reference, API |
| Déconvolution de perfusion | 1 | 0 | 6 | Glossary, Guide, FAQ, ScientificSummary, Tutorial, Reference, API |
| Segmentation de core ischémique | 1 | 0 | 3 | Glossary, Guide, FAQ, StateOfKnowledge, ScientificSummary, Reference, CaseStudy, ViewerOverlay, API |
| Volume lésionnel de perfusion | 1 | 0 | 1 | Glossary, Guide, FAQ, Comparison, StateOfKnowledge, ScientificSummary, Reference, ViewerOverlay, API |
| Perfusion IRM DSC | 1 | 0 | 2 | Glossary, Guide, FAQ, Comparison, ScientificSummary, Tutorial, Reference, API |
| Temps de transit moyen | 1 | 0 | 5 | Glossary, Guide, FAQ, Comparison, StateOfKnowledge, ScientificSummary, Reference, ViewerOverlay, API |
| Segmentation de pénombre | 1 | 0 | 2 | Glossary, Guide, FAQ, StateOfKnowledge, ScientificSummary, Reference, CaseStudy, ViewerOverlay, API |
| Carte paramétrique de perfusion | 1 | 0 | 4 | Glossary, Guide, FAQ, ScientificSummary, Reference, ViewerOverlay, API |
| Logiciel de post-traitement de perfusion | 1 | 0 | 6 | Glossary, Guide, FAQ, ScientificSummary, Tutorial, Reference, API |
| Fonction résidu | 1 | 0 | 0 | Glossary, Guide, Reference, API |
| Tmax | 1 | 0 | 4 | Glossary, Guide, FAQ, Comparison, StateOfKnowledge, ScientificSummary, Reference, ViewerOverlay, API |
| Accident vasculaire cérébral ischémique aigu | 1 | 0 | 2 | Glossary, Guide, FAQ, StateOfKnowledge, ScientificSummary, Reference, CaseStudy, API |
| Carte ADC | 1 | 0 | 3 | Glossary, Guide, FAQ, ScientificSummary, Reference, ViewerOverlay, API |
| Répétabilité ADC | 1 | 0 | 3 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Reproductibilité ADC | 1 | 0 | 3 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Valeur ADC | 1 | 0 | 8 | Glossary, Guide, FAQ, Comparison, StateOfKnowledge, ScientificSummary, Reference, ViewerOverlay, API |
| Valeur b | 1 | 0 | 3 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Diffusion moléculaire | 1 | 0 | 1 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Fantôme de diffusion | 1 | 0 | 1 | Glossary, Guide, FAQ, ScientificSummary, Reference, ViewerOverlay, API |
| Restriction de diffusion | 1 | 0 | 2 | Glossary, Guide, FAQ, StateOfKnowledge, ScientificSummary, Reference, CaseStudy, ViewerOverlay, API |
| Pondération en diffusion | 1 | 0 | 0 | Glossary, Guide, Reference, API |
| Imagerie pondérée en diffusion | 1 | 0 | 4 | Glossary, Guide, FAQ, Comparison, ScientificSummary, Tutorial, Reference, API |
| Non-linéarité des gradients | 1 | 0 | 2 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Contribution de perfusion aux faibles valeurs b | 1 | 0 | 3 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Calcul ADC mono-exponentiel | 1 | 0 | 1 | Glossary, Guide, FAQ, Comparison, ScientificSummary, Tutorial, Reference, API |
| Profil QIBA ADC | 1 | 0 | 1 | Glossary, Guide, FAQ, ScientificSummary, Reference, Documentation, API |
| LGE sang noir | 1 | 0 | 2 | Glossary, Guide, FAQ, Comparison, ScientificSummary, Tutorial, Reference, API |
| Contraste gadoliné | 1 | 0 | 1 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Hémorragie intramyocardique | 1 | 0 | 5 | Glossary, Guide, FAQ, StateOfKnowledge, ScientificSummary, Reference, CaseStudy, ViewerOverlay, API |
| Inversion-récupération | 1 | 0 | 2 | Glossary, Guide, FAQ, Comparison, ScientificSummary, Tutorial, Reference, ProtocolDocumentation, API |
| Acquisition de rehaussement tardif | 1 | 0 | 3 | Glossary, Guide, FAQ, Comparison, ScientificSummary, Tutorial, Reference, API |
| Rehaussement tardif myocardique | 1 | 0 | 4 | Glossary, Guide, FAQ, StateOfKnowledge, ScientificSummary, Reference, CaseStudy, ViewerOverlay, API |
| Motif de rehaussement tardif | 1 | 0 | 1 | Glossary, Guide, FAQ, StateOfKnowledge, ScientificSummary, Reference, CaseStudy, ViewerOverlay, API |
| Quantification du LGE | 1 | 0 | 2 | Glossary, Guide, FAQ, Comparison, ScientificSummary, Tutorial, Reference, API |
| Obstruction microvasculaire | 1 | 0 | 4 | Glossary, Guide, FAQ, StateOfKnowledge, ScientificSummary, Reference, CaseStudy, ViewerOverlay, API |
| Infarctus du myocarde | 1 | 0 | 2 | Glossary, Guide, FAQ, StateOfKnowledge, ScientificSummary, Reference, CaseStudy, API |
| Annulation myocardique | 1 | 0 | 1 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Myocardite | 1 | 0 | 1 | Glossary, Guide, FAQ, StateOfKnowledge, ScientificSummary, Reference, CaseStudy, API |
| PSIR | 1 | 0 | 1 | Glossary, Guide, FAQ, ScientificSummary, Tutorial, Reference, API |
| T2* myocardique | 1 | 0 | 1 | Glossary, Guide, FAQ, Comparison, ScientificSummary, Tutorial, Reference, API |
| Séquence T2 sensible aux produits sanguins | 1 | 0 | 1 | Glossary, Guide, FAQ, Comparison, ScientificSummary, Tutorial, Reference, ProtocolDocumentation, API |
| CT double énergie | 1 | 0 | 2 | Glossary, Guide, FAQ, Comparison, StateOfKnowledge, ScientificSummary, Reference, Documentation, API |
| Détecteur double couche | 1 | 0 | 2 | Glossary, Guide, FAQ, Comparison, ScientificSummary, Reference, Documentation, API |
| Double énergie bi-source | 1 | 0 | 2 | Glossary, Guide, FAQ, Comparison, ScientificSummary, Reference, Documentation, API |
| Numéro atomique effectif | 1 | 0 | 0 | Glossary, Guide, Reference, API |
| Concentration iodée | 1 | 0 | 3 | Glossary, Guide, FAQ, Comparison, StateOfKnowledge, ScientificSummary, Reference, ViewerOverlay, API |
| Carte d'iode | 1 | 0 | 3 | Glossary, Guide, FAQ, ScientificSummary, Reference, ViewerOverlay, API |
| Décomposition de matériaux | 1 | 0 | 2 | Glossary, Guide, FAQ, ScientificSummary, Tutorial, Reference, API |
| CT à comptage photonique | 1 | 0 | 2 | Glossary, Guide, FAQ, Comparison, StateOfKnowledge, ScientificSummary, Reference, Documentation, API |
| Commutation rapide de kVp | 1 | 0 | 3 | Glossary, Guide, FAQ, Comparison, ScientificSummary, Reference, Documentation, API |
| Double énergie séquentielle | 1 | 0 | 0 | Glossary, Guide, Reference, Documentation, API |
| Calibration spectrale | 1 | 0 | 2 | Glossary, Guide, FAQ, ScientificSummary, Tutorial, Reference, API |
| CT spectral | 1 | 0 | 1 | Glossary, Guide, FAQ, Comparison, StateOfKnowledge, ScientificSummary, Reference, Documentation, API |
| Filtre divisé | 1 | 0 | 0 | Glossary, Guide, Reference, Documentation, API |
| Image monoénergétique virtuelle | 1 | 0 | 1 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Image virtuelle sans contraste | 1 | 0 | 1 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Inversion-recovery T1 mapping | 1 | 0 | 4 | Glossary, Guide, FAQ, Comparison, ScientificSummary, Tutorial, Reference, ProtocolDocumentation, API |
| Saturation-recovery T1 mapping | 1 | 0 | 4 | Glossary, Guide, FAQ, Comparison, ScientificSummary, Tutorial, Reference, ProtocolDocumentation, API |
| Ciné cardiaque — séquence | 1 | 0 | 1 | Glossary, Guide, Comparison, Tutorial, Reference, ProtocolDocumentation, API |
| Diffusion — séquence | 1 | 0 | 1 | Glossary, Guide, Comparison, Tutorial, Reference, ProtocolDocumentation, API |
| Late Gadolinium Enhancement — séquence | 1 | 0 | 2 | Glossary, Guide, Comparison, Tutorial, Reference, ProtocolDocumentation, API |
| CT perfusion — acquisition | 1 | 0 | 1 | Glossary, Guide, Comparison, Tutorial, Reference, ProtocolDocumentation, API |
| T1 mapping — séquence | 1 | 0 | 1 | Glossary, Guide, Comparison, Tutorial, Reference, ProtocolDocumentation, API |
| T2 mapping — séquence | 1 | 0 | 1 | Glossary, Guide, Comparison, Tutorial, Reference, ProtocolDocumentation, API |
| Famille ciné cardiaque | 0 | 1 | 0 | Glossary, Guide, Tutorial, Reference, ProtocolDocumentation, API |
| Famille de mapping cardiaque | 0 | 2 | 0 | Glossary, Guide, Tutorial, Reference, ProtocolDocumentation, API |
| Famille de diffusion | 0 | 1 | 0 | Glossary, Guide, Tutorial, Reference, ProtocolDocumentation, API |
| Famille de rehaussement tardif | 0 | 1 | 0 | Glossary, Guide, Tutorial, Reference, ProtocolDocumentation, API |
| Famille de perfusion | 0 | 1 | 0 | Glossary, Guide, Tutorial, Reference, ProtocolDocumentation, API |
| Service Core Lab IRM / CT | 0 | 0 | 0 | Glossary, Guide, Reference, Documentation, API |
| Service d'audit DICOM | 0 | 0 | 0 | Glossary, Guide, Reference, Documentation, API |
| Service d'harmonisation multicentrique | 0 | 0 | 0 | Glossary, Guide, Reference, Documentation, API |
| Service d'ingénierie quantitative | 0 | 0 | 0 | Glossary, Guide, Reference, Documentation, API |
| DICOM — standard reference | 0 | 0 | 0 | Glossary, Guide, Reference, Documentation, API |
| COVERT-MI — étude | 0 | 0 | 1 | Glossary, Guide, Reference, CaseStudy, API |
| MIMI | 0 | 0 | 0 | Glossary, Guide, Reference, CaseStudy, API |
| RHU MARVELOUS | 0 | 0 | 0 | Glossary, Guide, Reference, CaseStudy, API |
| CoreLab / Core Lab | 0 | 0 | 1 | Glossary, Reference, API |
| Late Gadolinium Enhancement / rehaussement tardif | 0 | 0 | 1 | Glossary, Reference, API |
| 1.5 T magnetic field strength | 1 | 0 | 5 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| 3 T magnetic field strength | 1 | 0 | 6 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Post-contrast acquisition delay | 1 | 0 | 8 | Glossary, Guide, FAQ, ScientificSummary, Reference, API |
| Tags DICOM | 0 | 0 | 1 | Glossary, Guide, Reference, API |
| ANTsPy | 0 | 0 | 1 | Glossary, Guide, Reference, Documentation, API |
| Elastix | 0 | 0 | 1 | Glossary, Guide, Reference, Documentation, API |
| Matplotlib | 0 | 0 | 0 | Glossary, Guide, Reference, Documentation, API |
| NiBabel | 0 | 0 | 1 | Glossary, Guide, Reference, Documentation, API |
| NumPy | 0 | 0 | 0 | Glossary, Guide, Reference, Documentation, API |
| Python | 0 | 0 | 1 | Glossary, Guide, Reference, Documentation, API |
| React | 0 | 0 | 0 | Glossary, Guide, Reference, Documentation, API |
| SimpleITK | 0 | 0 | 1 | Glossary, Guide, Reference, Documentation, API |
| CardiacViewer | 0 | 0 | 0 | Glossary, Guide, Reference, ViewerOverlay, Documentation, API |
| CTScanViewer | 0 | 0 | 0 | Glossary, Guide, Reference, ViewerOverlay, Documentation, API |
| NeuroOncoViewer | 0 | 0 | 0 | Glossary, Guide, Reference, ViewerOverlay, Documentation, API |
| PerfusionSegmentationViewer | 0 | 0 | 1 | Glossary, Guide, Reference, ViewerOverlay, Documentation, API |
| QCViewer | 0 | 0 | 2 | Glossary, Guide, Reference, ViewerOverlay, Documentation, API |
| RegistrationViewer | 0 | 0 | 1 | Glossary, Guide, Reference, ViewerOverlay, Documentation, API |
| SliceViewer | 0 | 0 | 1 | Glossary, Guide, Reference, ViewerOverlay, Documentation, API |
| OutilsViewer | 0 | 0 | 0 | Glossary, Guide, Reference, ViewerOverlay, Documentation, API |
| Workflow Core Lab IRM cardiaque | 0 | 0 | 0 | Glossary, Guide, Reference, ProtocolDocumentation, Documentation, API |
| Anonymisation DICOM | 0 | 0 | 1 | Glossary, Guide, Reference, ProtocolDocumentation, Documentation, API |
| Audit DICOM | 0 | 0 | 1 | Glossary, Guide, Reference, ProtocolDocumentation, Documentation, API |
| Harmonisation multicentrique | 0 | 0 | 0 | Glossary, Guide, Reference, ProtocolDocumentation, Documentation, API |
| Contrôle qualité | 0 | 0 | 0 | Glossary, Guide, Reference, ProtocolDocumentation, Documentation, API |
| Chaîne d'imagerie quantitative | 0 | 0 | 0 | Glossary, Guide, Reference, ProtocolDocumentation, Documentation, API |

Le graphe conserve les appartenances multiples. Les relations hiérarchiques proviennent uniquement des relations structurelles actives et des appartenances de domaine observées dans les corpus. Les dépendances scientifiques ne sont pas réinventées dans le catalogue.

## 6. Couverture

Couverture scientifique moyenne : 0.5298. Couverture éditoriale structurée moyenne : 0.5149. Contradictions conservées : 5. Questions ouvertes : 13. Synthèses existantes : 22. Projections internes existantes : 20.

## 7. Campagnes automatiques

| Campagne | Nœuds sélectionnés | Justification |
| --- | --- | --- |
| noxia:scientific-campaign:hepatic-imaging:01 | Imagerie hépatique | hepatic-imaging: sources -5, assertions -12 |
| noxia:scientific-campaign:neuro-oncology:01 | Neuro-oncologie | neuro-oncology: sources -5, assertions -12 |
| noxia:scientific-campaign:nuclear-medicine:01 | Médecine nucléaire | nuclear-medicine: sources -5, assertions -12 |
| noxia:scientific-campaign:oef-cmro2:01 | OEF et CMRO2 | oef-cmro2: sources -5, assertions -12 |
| noxia:scientific-campaign:photon-counting-ct-applications:01 | Applications du CT à comptage photonique | photon-counting-ct-applications: sources -5, assertions -12 |
| noxia:scientific-campaign:quality-control:01 | Contrôle qualité en imagerie | quality-control: sources -5, assertions -12 |
| noxia:scientific-campaign:radiomics:01 | Radiomique | radiomics: sources -5, assertions -12 |
| noxia:scientific-campaign:registration:01 | Recalage d'images | registration: sources -5, assertions -12 |
| noxia:scientific-campaign:segmentation:01 | Segmentation en imagerie | segmentation: sources -5, assertions -12 |
| noxia:scientific-campaign:t2-mapping:01 | Mapping T2 | t2-mapping: sources -5, assertions -12 |

Le moteur a sélectionné 10 nœuds dans 10 campagnes. Les critères sont cumulatifs : priorité HIGH, statut non prêt/non terminal, couverture source insuffisante et couverture assertion insuffisante.

## 8. Extensibilité et cycle de vie

Opérations disponibles : import, export, merge, split, rename, deprecate, archive, migrate. Les opérations conservent l'identité, la version et la traçabilité ; l'archivage utilise le statut OBSOLETE sans suppression physique.

## 9. Contrats

| Contrat | Préservé ? | Test | Remarque |
| --- | --- | --- | --- |
| P5 baseline preserved | true | validate:scientific-multidomain | No corpus, assertion or EvidenceLink was changed. |
| Catalogue contains planning metadata only | true | catalog scope validator | Knowledge remains in the Scientific Knowledge Graph. |
| DAG without artificial single hierarchy | true | max depth 2; multi-parent nodes retained | Only explicit PART_OF/IS_A and domain membership are hierarchical. |
| Metrics and priorities calculated | true | coverage, projection and priority recomputation | No manual override is accepted. |
| Campaigns selected automatically | true | 10 deterministic campaigns | No prompt-selected domain and no publication. |
| Public surfaces unchanged | true | protected-surface inspection | Pages, routes, SEO, sitemap, viewers, PACS and Supabase remain untouched. |
| editorial-engine unchanged | true | 335fbbea8d138901f0cdf4f5e2d3b96144880e8b | Separate repository remains unchanged. |

## 10. Fichiers

Créés : `src/knowledge-graph/knowledge-catalog/constants.mjs`, `src/knowledge-graph/knowledge-catalog/coverage-engine.mjs`, `src/knowledge-graph/knowledge-catalog/projection-engine.mjs`, `src/knowledge-graph/knowledge-catalog/priority-engine.mjs`, `src/knowledge-graph/knowledge-catalog/campaign-engine.mjs`, `src/knowledge-graph/knowledge-catalog/knowledge-node-registry.mjs`, `src/knowledge-graph/knowledge-catalog/catalog-builder.mjs`, `src/knowledge-graph/knowledge-catalog/governance.mjs`, `src/knowledge-graph/knowledge-catalog/validators.mjs`, `src/knowledge-graph/knowledge-catalog/report.mjs`, `src/knowledge-graph/knowledge-catalog/index.mjs`, `src/knowledge-graph/knowledge-catalog/knowledge-catalog.json`, `src/knowledge-graph/knowledge-catalog/knowledge-catalog.test.mjs`, `scripts/generate-knowledge-catalog.mjs`, `scripts/validate-knowledge-catalog.mjs`, `scripts/report-knowledge-catalog.mjs`, `scripts/plan-scientific-campaigns.mjs`, `scripts/generate-p6-knowledge-catalog-report.mjs`, `docs/p6-scientific-knowledge-catalog.md`, `docs/p6-scientific-knowledge-catalog-report.md`.

Modifiés : `package.json`, `src/knowledge-graph/index.mjs`.

## 11. Validation

Validation P6 : PASS. Digest déterministe : `503cd942c65888a4dd684f4cae8445940869152f7ce9fbdecab37f2e13e38bb5`.
