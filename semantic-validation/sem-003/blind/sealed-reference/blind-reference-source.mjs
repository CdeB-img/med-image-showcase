import { P } from "../authoring/blind-authoring-source.mjs";

const r = (key, kind, description, turn, properties, criticality = "CRITICAL") => ({
  key, kind, description, turn, properties, criticality,
});
const x = (key, description, properties, failureClass, criticality = "CRITICAL") => ({
  key, description, properties, failureClass, criticality,
});
const o = (key, description, rationale) => ({ key, description, rationale });
const a = (key, description, interpretations, resolutionInformation) => ({
  key, description, interpretations, resolutionInformation,
});
const c = (status, decisionImpact, acceptableQuestionClasses) => ({
  status, decisionImpact, acceptableQuestionClasses,
});

export const referenceSpecs = {
  "LAA-CLOSURE-SEAL-ASSESSMENT": {
    required: [
      r("closure-objective", "EXPLICIT_CONCEPT", "Préserver l'objectif de vérification après implantation du dispositif.", 1, [P.P01]),
      r("ct-three-months", "TIMING", "Relier le scanner cardiaque à l'évaluation prévue à trois mois.", 2, [P.P01, P.P04]),
      r("leak-primary", "RELATION", "Conserver la fuite péri-dispositif comme mesure principale.", 2, [P.P02, P.P14]),
      r("tee-conditional", "POLARITY", "Conserver l'échographie transœsophagienne comme examen conditionnel uniquement si le scanner est non concluant.", 3, [P.P02, P.P03]),
      r("thrombus-exploratory", "OWNERSHIP", "Conserver le thrombus sur dispositif comme élément exploratoire, non principal.", 4, [P.P01, P.P11]),
      r("tee-schedule-unknown", "UNKNOWN", "Maintenir inconnu le calendrier de l'échographie conditionnelle.", 4, [P.P09, P.P13]),
    ],
    prohibited: [
      x("tee-systematic-comparator", "Transformer l'échographie en comparateur systématique du scanner.", [P.P03, P.P10], "POLARITY_OR_CAUSALITY_FAILURE"),
      x("thrombus-primary", "Promouvoir le thrombus exploratoire en mesure principale.", [P.P11], "OWNERSHIP_BOUNDARY_FAILURE"),
      x("invent-imaging-protocol", "Inventer un protocole ou des paramètres d'acquisition.", [P.P10], "UNSUPPORTED_INVENTION_FAILURE"),
    ],
    optional: [], ambiguities: [],
    clarification: c("OPTIONAL", "Le calendrier conditionnel n'empêche pas de préserver l'intention actuelle, mais affectera l'organisation temporelle.", ["Calendrier de l'échographie si le scanner est non concluant"]),
  },
  "PROSTHETIC-VALVE-INFECTION-CONTEXT": {
    required: [
      r("suspected-infection", "EXPLICIT_CONCEPT", "Conserver le contexte de suspicion d'infection sur prothèse valvulaire.", 1, [P.P01]),
      r("fdg-signal", "RELATION", "Relier la TEP-TDM au FDG à la description du signal autour de la prothèse.", 2, [P.P01, P.P02]),
      r("negative-cultures-possible", "POLARITY", "Conserver la possibilité d'hémocultures négatives sans en déduire l'absence d'infection.", 3, [P.P03, P.P09]),
      r("coexistence-not-proof", "POLARITY", "Préserver l'étude d'une association contextuelle sans faire du signal une preuve autonome ni une causalité.", 4, [P.P03, P.P06]),
      r("embolic-events-separate", "RELATION", "Conserver les événements emboliques comme dimension séparée.", 5, [P.P02, P.P14]),
      r("antibiotic-pet-delay-unknown", "UNKNOWN", "Maintenir ouvert le délai entre antibiothérapie et TEP-TDM.", 6, [P.P04, P.P09, P.P13]),
    ],
    prohibited: [
      x("pet-proves-infection", "Présenter le signal TEP ou un support spécialisé comme preuve suffisante et vérité du projet.", [P.P06, P.P08, P.P10], "EPISTEMIC_PROMOTION_FAILURE"),
      x("pet-causes-embolism", "Créer une relation causale entre signal métabolique et événements emboliques.", [P.P06], "POLARITY_OR_CAUSALITY_FAILURE"),
      x("negative-culture-excludes", "Transformer des hémocultures négatives en exclusion de l'infection.", [P.P03], "POLARITY_OR_CAUSALITY_FAILURE"),
    ],
    optional: [o("pattern-candidate", "Un profil de distribution du signal péri-prothétique peut rester un candidat contextuel à qualifier.", "Le contexte d'imagerie peut motiver ce candidat sans en faire une déclaration utilisateur ni une preuve autonome.")],
    ambiguities: [],
    clarification: c("REQUIRED", "Le délai après antibiothérapie affecte l'interprétation temporelle du signal.", ["Délai entre début des antibiotiques et TEP-TDM"]),
  },
  "AMYLOID-ECV-PURPOSE-GAP": {
    required: [
      r("treated-amyloid-context", "EXPLICIT_CONCEPT", "Conserver le contexte d'amylose cardiaque traitée.", 1, [P.P01]),
      r("ecv-measurement", "OTHER", "Conserver l'ECV myocardique comme mesure quantitative suivie, sans le confondre avec le phénomène ou son rôle.", 1, [P.P01, P.P14]),
      r("purpose-open", "AMBIGUITY", "Maintenir ouvertes les finalités concurrentes: charge amyloïde, réponse tissulaire ou reproductibilité.", 1, [P.P09, P.P13]),
      r("repeat-timing-unknown", "UNKNOWN", "Maintenir inconnu le calendrier de répétition.", 1, [P.P04, P.P09, P.P13]),
    ],
    prohibited: [
      x("ecv-equals-amyloid-burden", "Assimiler automatiquement l'ECV à la charge amyloïde.", [P.P10, P.P14], "CONCEPTUAL_PLAN_COLLAPSE"),
      x("choose-purpose", "Choisir silencieusement une finalité scientifique ou un calendrier.", [P.P09, P.P10], "MISSING_INFORMATION_FAILURE"),
    ],
    optional: [],
    ambiguities: [a("ecv-purpose", "La finalité scientifique de la mesure d'ECV n'est pas choisie.", ["marqueur de charge amyloïde", "réponse tissulaire au traitement", "reproductibilité de la mesure"], ["objectif scientifique prioritaire", "rôle attendu de la mesure"])],
    clarification: c("REQUIRED", "La finalité choisie change l'interprétation, le design et le rôle de la mesure.", ["Finalité scientifique de l'ECV", "Calendrier de répétition"]),
  },
  "TRANSPLANT-REJECTION-TIMING": {
    required: [
      r("transplant-surveillance", "EXPLICIT_CONCEPT", "Conserver le contexte de surveillance après greffe cardiaque.", 1, [P.P01]),
      r("mri-biopsy-comparison", "COMPARISON", "Mettre en regard IRM et biopsie sans les fusionner.", 1, [P.P02, P.P04, P.P14]),
      r("t2-measurement", "OTHER", "Conserver la relaxation T2 myocardique comme mesure quantitative IRM.", 2, [P.P01, P.P14]),
      r("histology-grade-distinct", "RELATION", "Conserver le grade histologique de biopsie comme plan distinct.", 3, [P.P02, P.P14]),
      r("nonconcurrent-exams", "TIMING", "Préserver que les examens ne sont pas toujours réalisés le même jour et que leur délai doit être enregistré.", 4, [P.P04]),
      r("t2-not-rejection", "POLARITY", "Conserver l'interdiction d'assimiler toute élévation de T2 à un rejet.", 5, [P.P03, P.P06]),
      r("time-window-open", "UNKNOWN", "Maintenir ouverte la fenêtre temporelle acceptable.", 7, [P.P04, P.P09, P.P13]),
    ],
    prohibited: [
      x("collapse-t2-biopsy", "Fusionner mesure T2 et grade histologique comme une même entité ou valeur.", [P.P14], "CONCEPTUAL_PLAN_COLLAPSE"),
      x("t2-proves-rejection", "Présenter une élévation T2 comme preuve automatique de rejet.", [P.P03, P.P06], "POLARITY_OR_CAUSALITY_FAILURE"),
      x("invent-window", "Inventer une fenêtre temporelle acceptable.", [P.P09, P.P10], "UNSUPPORTED_INVENTION_FAILURE"),
    ],
    optional: [], ambiguities: [],
    clarification: c("REQUIRED", "La fenêtre temporelle détermine l'interprétabilité de la mise en regard.", ["Fenêtre acceptable entre IRM et biopsie"]),
  },
  "HFPEF-EXERCISE-STATE": {
    required: [
      r("hfpef-dyspnea-context", "EXPLICIT_CONCEPT", "Conserver la dyspnée et la suspicion d'HFpEF comme contexte clinique.", 1, [P.P01]),
      r("exercise-state", "TIMING", "Comprendre que l'étude porte sur un état d'effort distinct du repos.", 1, [P.P04]),
      r("invasive-pressure-and-echo", "RELATION", "Conserver pression de remplissage invasive et échographie d'effort comme sources distinctes.", 2, [P.P01, P.P02, P.P14]),
      r("strain-measure-not-phenomenon", "OTHER", "Distinguer le strain atrial mesuré du phénomène de dyspnée.", 3, [P.P14]),
      r("within-person-comparison", "COMPARISON", "Conserver la comparaison repos-effort intra-sujet.", 4, [P.P02, P.P04]),
      r("exercise-type-unknown", "UNKNOWN", "Maintenir inconnu le type exact d'effort.", 5, [P.P09, P.P13]),
      r("no-causal-mechanism", "POLARITY", "Ne pas transformer la coexistence des mesures en mécanisme causal.", 6, [P.P03, P.P06]),
    ],
    prohibited: [
      x("strain-equals-dyspnea", "Confondre le strain atrial avec la dyspnée ou l'amélioration clinique.", [P.P14], "CONCEPTUAL_PLAN_COLLAPSE"),
      x("measurements-causal", "Créer une causalité entre pression, strain et symptômes.", [P.P06], "POLARITY_OR_CAUSALITY_FAILURE"),
      x("invent-exercise", "Choisir un protocole d'effort non fourni.", [P.P10], "UNSUPPORTED_INVENTION_FAILURE"),
    ],
    optional: [], ambiguities: [],
    clarification: c("REQUIRED", "Le type et la charge d'effort changent la comparaison et l'interprétation.", ["Type d'effort", "Charge ou niveau d'effort"]),
  },
  "POSTPARTUM-MYOCARDIAL-WORK-NONCAUSAL": {
    required: [
      r("postpartum-hypertension-context", "EXPLICIT_CONCEPT", "Conserver le contexte postpartum après grossesse compliquée d'hypertension.", 1, [P.P01]),
      r("myocardial-work-six-weeks", "TIMING", "Relier l'estimation échocardiographique du travail myocardique à six semaines.", 2, [P.P01, P.P04]),
      r("blood-pressure-same-time", "TIMING", "Conserver la pression artérielle mesurée au même temps.", 3, [P.P02, P.P04]),
      r("causal-claim-retracted", "CORRECTION", "Appliquer le retrait de l'interprétation causale et conserver seulement la relation descriptive.", 5, [P.P03, P.P05, P.P06]),
      r("six-month-visit-planned", "TIMING", "Conserver la seconde visite à six mois comme envisagée, non certaine.", 6, [P.P03, P.P04]),
      r("comparison-group-open", "UNKNOWN", "Maintenir inconnu le groupe de comparaison.", 7, [P.P09, P.P13]),
      r("treatment-context-unknown", "UNKNOWN", "Ne pas compléter les traitements antihypertenseurs s'ils ne sont pas documentés.", 8, [P.P09, P.P13]),
    ],
    prohibited: [
      x("retain-causal-claim", "Conserver comme active l'affirmation que l'hypertension explique les changements myocardiques.", [P.P05, P.P06], "POLARITY_OR_CAUSALITY_FAILURE"),
      x("invent-treatment-effect", "Déduire un effet thérapeutique ou un traitement non documenté.", [P.P10, P.P11], "UNSUPPORTED_INVENTION_FAILURE"),
      x("invent-comparator", "Choisir un groupe de comparaison non fourni.", [P.P09, P.P10], "MISSING_INFORMATION_FAILURE"),
    ],
    optional: [], ambiguities: [],
    clarification: c("REQUIRED", "Le groupe de comparaison modifie le design et la portée de la relation décrite.", ["Groupe de comparaison", "Disponibilité des traitements antihypertenseurs"]),
  },
  "EPILEPSY-DISCORDANT-REGION-ELLIPSIS": {
    required: [
      r("epileptogenic-network-purpose", "EXPLICIT_CONCEPT", "Conserver l'objectif de localisation du réseau épileptogène avant discussion chirurgicale.", 1, [P.P01]),
      r("pet-and-meg", "RELATION", "Conserver la TEP intercritique et la magnétoencéphalographie comme sources distinctes.", 2, [P.P01, P.P02, P.P14]),
      r("regional-discordance-possible", "AMBIGUITY", "Conserver la possibilité de régions différentes selon les deux sources.", 3, [P.P09]),
      r("concordant-primary-candidate", "OWNERSHIP", "Conserver la région concordante comme candidate principale, jamais comme foyer certain.", 4, [P.P03, P.P07, P.P11]),
      r("discordant-region-separate", "RELATION", "Rattacher l'ellipse du dernier tour à la région discordante et la conserver séparément.", 5, [P.P01, P.P02, P.P12]),
    ],
    prohibited: [
      x("candidate-certain-focus", "Promouvoir une région candidate ou soutenue par un owner spécialisé en foyer certain ou en décision chirurgicale.", [P.P07, P.P08, P.P11], "EPISTEMIC_PROMOTION_FAILURE"),
      x("merge-regions", "Fusionner régions concordante et discordante.", [P.P02, P.P09], "RELATION_SEMANTICS_FAILURE"),
      x("wrong-ellipsis-antecedent", "Rattacher l'ellipse à une modalité plutôt qu'à la région discordante.", [P.P02, P.P12], "RELATION_SEMANTICS_FAILURE"),
    ],
    optional: [o("discordance-review", "Une revue spécialisée de la discordance peut être proposée comme étape candidate.", "La discordance explicite justifie un candidat de revue, sans adopter une décision chirurgicale.")],
    ambiguities: [],
    clarification: c("OPTIONAL", "La décision chirurgicale n'est pas requise pour représenter l'intention; son owner doit rester humain.", ["Critères futurs d'adoption d'une région candidate"]),
  },
  "CORNEAL-NERVE-METHOD-MEASURE": {
    required: [
      r("post-surgery-context", "EXPLICIT_CONCEPT", "Conserver le contexte après chirurgie cornéenne.", 1, [P.P01]),
      r("confocal-method", "OTHER", "Conserver la microscopie confocale comme méthode d'observation.", 1, [P.P14]),
      r("nerve-density-measure", "OTHER", "Conserver la densité des fibres nerveuses comme mesure quantitative.", 1, [P.P01, P.P14]),
      r("regeneration-phenomenon", "OTHER", "Conserver la régénération nerveuse comme phénomène étudié distinct de la mesure.", 1, [P.P14]),
      r("timing-unknown", "UNKNOWN", "Maintenir inconnu le moment après chirurgie.", 1, [P.P04, P.P09, P.P13]),
    ],
    prohibited: [
      x("method-as-measure", "Confondre la microscopie confocale avec la valeur de densité.", [P.P14], "CONCEPTUAL_PLAN_COLLAPSE"),
      x("density-proves-regeneration", "Présenter la densité comme preuve complète du phénomène de régénération.", [P.P06, P.P14], "CONCEPTUAL_PLAN_COLLAPSE"),
      x("invent-time", "Inventer le moment de mesure.", [P.P09, P.P10], "UNSUPPORTED_INVENTION_FAILURE"),
    ],
    optional: [], ambiguities: [],
    clarification: c("REQUIRED", "Le moment postopératoire modifie l'interprétation de la mesure longitudinale.", ["Moment de mesure après chirurgie"]),
  },
  "BREAST-BPE-AMBIGUOUS-CHANGE": {
    required: [
      r("bpe-increase", "EXPLICIT_CONCEPT", "Conserver l'étude d'une augmentation du rehaussement parenchymateux de fond.", 1, [P.P01]),
      r("hormonal-change-context", "TIMING", "Relier les examens avant et après à une modification hormonale.", 2, [P.P02, P.P04]),
      r("two-comparison-axes", "AMBIGUITY", "Maintenir les deux sens possibles d'augmentation: évolution temporelle ou différence entre groupes.", 3, [P.P09, P.P13]),
      r("primary-axis-open", "UNKNOWN", "Conserver l'absence de choix de la comparaison principale.", 4, [P.P09, P.P13]),
    ],
    prohibited: [
      x("choose-longitudinal", "Choisir silencieusement l'axe longitudinal comme principal.", [P.P09, P.P10], "MISSING_INFORMATION_FAILURE"),
      x("choose-cross-sectional", "Choisir silencieusement l'axe inter-groupes comme principal.", [P.P09, P.P10], "MISSING_INFORMATION_FAILURE"),
      x("invent-risk-endpoint", "Inventer un endpoint de risque ou de diagnostic.", [P.P10, P.P11], "UNSUPPORTED_INVENTION_FAILURE"),
    ],
    optional: [],
    ambiguities: [a("increase-axis", "Le terme augmentation possède deux axes comparatifs scientifiquement distincts.", ["hausse intra-sujet dans le temps", "niveau plus élevé entre groupes"], ["question principale", "population de comparaison", "unité d'analyse"])],
    clarification: c("REQUIRED", "Le choix de l'axe détermine la relation, la temporalité et l'unité d'analyse.", ["Axe principal de comparaison"]),
  },
  "ORTHODONTIC-CBCT-OUTCOME-CORRECTION": {
    required: [
      r("cbct-baseline-end", "TIMING", "Conserver les CBCT du début et de la fin du traitement.", 1, [P.P01, P.P04]),
      r("root-resorption-historical-primary", "PROVENANCE", "Conserver la résorption radiculaire comme ancien choix principal dans l'historique uniquement.", 2, [P.P05, P.P12]),
      r("cortical-thickness-measure", "EXPLICIT_CONCEPT", "Conserver la mesure d'épaisseur de l'os cortical.", 3, [P.P01, P.P14]),
      r("cortical-primary-current", "CORRECTION", "Appliquer l'épaisseur corticale comme outcome principal courant.", 4, [P.P02, P.P05]),
      r("resorption-exploratory-current", "CORRECTION", "Appliquer la résorption radiculaire comme outcome exploratoire courant.", 4, [P.P02, P.P05]),
      r("acquisition-unknown", "UNKNOWN", "Maintenir inconnus les paramètres d'acquisition et la méthode de mesure.", 5, [P.P09, P.P13]),
    ],
    prohibited: [
      x("resorption-still-primary", "Conserver la résorption radiculaire comme outcome principal actif.", [P.P05], "EXPLICIT_FIDELITY_FAILURE"),
      x("two-primary-outcomes", "Maintenir simultanément les deux outcomes comme principaux.", [P.P02, P.P05], "RELATION_SEMANTICS_FAILURE"),
      x("invent-cbct-parameters", "Inventer des paramètres d'acquisition CBCT ou une méthode de mesure.", [P.P10, P.P11], "UNSUPPORTED_INVENTION_FAILURE"),
    ],
    optional: [], ambiguities: [],
    clarification: c("OPTIONAL", "Les paramètres sont nécessaires avant exécution, mais leur absence n'empêche pas de préserver la hiérarchie scientifique actuelle.", ["Méthode de mesure", "Paramètres d'acquisition"]),
  },
  "RARE-DISEASE-CONTROL-CHANGE": {
    required: [
      r("natural-history-registry", "EXPLICIT_CONCEPT", "Conserver l'étude d'histoire naturelle fondée sur un registre de maladie rare.", 1, [P.P01]),
      r("external-controls-historical", "PROVENANCE", "Conserver le comparateur externe comme choix initial puis exploratoire.", 2, [P.P05, P.P12]),
      r("unaligned-entry-dates", "UNKNOWN", "Conserver le non-alignement des dates d'entrée entre sources.", 3, [P.P04, P.P09]),
      r("within-patient-primary", "CORRECTION", "Appliquer la trajectoire intra-patient comme comparaison principale courante.", 6, [P.P02, P.P04, P.P05]),
      r("external-exploratory", "CORRECTION", "Appliquer les contrôles externes comme analyse exploratoire.", 7, [P.P02, P.P05]),
      r("time-zero-unknown", "UNKNOWN", "Maintenir inconnu le temps zéro de la trajectoire.", 8, [P.P04, P.P09, P.P13]),
      r("no-treatment-causality", "POLARITY", "Conserver l'interdiction d'ajouter une conclusion causale sur un traitement.", 9, [P.P03, P.P06]),
    ],
    prohibited: [
      x("external-primary", "Conserver les contrôles externes comme comparaison principale active.", [P.P05], "EXPLICIT_FIDELITY_FAILURE"),
      x("invent-time-zero", "Inventer le temps zéro.", [P.P09, P.P10], "MISSING_INFORMATION_FAILURE"),
      x("causal-treatment-effect", "Déduire un effet causal de traitement.", [P.P06, P.P10], "POLARITY_OR_CAUSALITY_FAILURE"),
    ],
    optional: [], ambiguities: [],
    clarification: c("REQUIRED", "Le temps zéro conditionne la trajectoire intra-patient devenue principale.", ["Définition du temps zéro"]),
  },
  "MICROBIOME-ANTIBIOTIC-CANDIDATES": {
    required: [
      r("microbiome-before-after", "COMPARISON", "Conserver la description du microbiome avant et après l'antibiothérapie.", 1, [P.P01, P.P02, P.P04]),
      r("sampling-times", "TIMING", "Relier les prélèvements au départ et après la fin du traitement.", 2, [P.P04]),
      r("diet-unreliable", "UNKNOWN", "Conserver le régime alimentaire comme information non fiable, sans le compléter.", 3, [P.P09, P.P13]),
      r("candidates-not-observed", "PROVENANCE", "Conserver fonctions microbiennes et groupes taxonomiques comme candidats optionnels, non comme observations.", 4, [P.P07, P.P12, P.P18]),
      r("no-global-causality", "POLARITY", "Conserver l'interdiction d'attribuer causalement tout changement à l'antibiotique.", 5, [P.P03, P.P06]),
    ],
    prohibited: [
      x("candidate-as-observation", "Présenter un candidat microbien ou un support Knowledge comme fait observé, déclaration utilisateur ou vérité Project.", [P.P07, P.P08, P.P10], "EPISTEMIC_PROMOTION_FAILURE"),
      x("diet-completed", "Inventer ou normaliser silencieusement le régime alimentaire.", [P.P09, P.P10], "UNSUPPORTED_INVENTION_FAILURE"),
      x("all-change-caused", "Attribuer causalement tout changement à l'antibiothérapie.", [P.P06], "POLARITY_OR_CAUSALITY_FAILURE"),
    ],
    optional: [
      o("functional-pathways", "Fonctions microbiennes pertinentes à proposer comme candidats non exhaustifs.", "La demande autorise explicitement des candidats fonctionnels sans les déclarer observés."),
      o("taxonomic-groups", "Groupes taxonomiques pertinents à proposer comme candidats non exhaustifs.", "La demande autorise explicitement des candidats taxonomiques sans fixer une liste."),
    ],
    ambiguities: [],
    clarification: c("OPTIONAL", "L'information alimentaire peut rester inconnue; elle doit être visible dans les limites de l'interprétation.", ["Disponibilité d'une information alimentaire exploitable"]),
  },
  "VACCINE-SINGLE-CELL-MULTIDIMENSIONAL": {
    required: [
      r("early-immune-response", "EXPLICIT_CONCEPT", "Conserver l'objectif de caractérisation de la réponse immunitaire précoce.", 1, [P.P01]),
      r("three-sampling-times", "TIMING", "Conserver un temps avant vaccination et deux temps après.", 2, [P.P04]),
      r("proportion-and-state", "RELATION", "Distinguer proportions cellulaires et états transcriptionnels.", 3, [P.P02, P.P14]),
      r("no-proportion-state-collapse", "POLARITY", "Conserver l'interdiction de confondre variation de proportion et changement d'état cellulaire.", 4, [P.P03, P.P14]),
      r("antibody-later", "TIMING", "Conserver la réponse d'anticorps comme mesure ultérieure.", 5, [P.P04]),
      r("relations-noncausal", "POLARITY", "Explorer les relations sans les transformer en mécanisme causal.", 6, [P.P03, P.P06]),
      r("batch-effect-candidate", "PROVENANCE", "Conserver les effets de lot comme candidat méthodologique à vérifier.", 7, [P.P07, P.P12, P.P18]),
      r("early-definition-open", "UNKNOWN", "Maintenir ouverte la définition opérationnelle de précoce.", 1, [P.P09, P.P13]),
    ],
    prohibited: [
      x("collapse-proportion-state", "Confondre proportion cellulaire et état transcriptionnel.", [P.P14], "CONCEPTUAL_PLAN_COLLAPSE"),
      x("batch-as-fact", "Présenter un effet de lot ou un support spécialisé comme explication acquise ou vérité Project.", [P.P07, P.P08, P.P10], "EPISTEMIC_PROMOTION_FAILURE"),
      x("causal-antibody-link", "Créer un mécanisme causal entre états précoces et réponse d'anticorps.", [P.P06], "POLARITY_OR_CAUSALITY_FAILURE"),
    ],
    optional: [
      o("batch-effect", "Effet de lot comme candidat méthodologique à tester.", "La source le nomme explicitement comme candidat, jamais comme explication acquise."),
      o("immune-programs", "Programmes immunitaires contextuels comme candidats non exhaustifs.", "Ils peuvent enrichir l'analyse s'ils restent candidats et justifiés."),
    ],
    ambiguities: [],
    clarification: c("REQUIRED", "La définition de précoce détermine les comparaisons temporelles et l'interprétation.", ["Fenêtre définissant la réponse précoce"]),
  },
  "WEARABLE-SLEEP-PHENOMENON-OBSERVABLE": {
    required: [
      r("sleep-improvement-phenomenon", "EXPLICIT_CONCEPT", "Conserver l'amélioration du sommeil comme phénomène général étudié.", 1, [P.P01, P.P14]),
      r("algorithm-estimated-duration", "OTHER", "Conserver la durée estimée par l'algorithme du bracelet comme propriété mesurée.", 2, [P.P01, P.P14]),
      r("duration-not-whole-phenomenon", "POLARITY", "Conserver que la durée estimée ne représente pas à elle seule l'amélioration globale.", 3, [P.P03, P.P14]),
      r("weekly-questionnaire", "EXPLICIT_CONCEPT", "Conserver le questionnaire hebdomadaire comme source distincte.", 4, [P.P01, P.P02]),
      r("primary-observable-open", "UNKNOWN", "Maintenir ouverte la propriété observable destinée à l'outcome principal.", 5, [P.P09, P.P13]),
      r("wear-adherence-unknown", "UNKNOWN", "Maintenir l'adhérence au port comme inconnue si elle n'est pas fournie.", 6, [P.P09, P.P13]),
    ],
    prohibited: [
      x("duration-equals-sleep-improvement", "Assimiler la durée estimée à l'amélioration globale du sommeil.", [P.P14], "CONCEPTUAL_PLAN_COLLAPSE"),
      x("choose-primary-observable", "Choisir automatiquement le bracelet ou le questionnaire comme outcome principal.", [P.P09, P.P11], "OWNERSHIP_BOUNDARY_FAILURE"),
      x("invent-adherence", "Inventer une adhérence au port du dispositif.", [P.P09, P.P10], "UNSUPPORTED_INVENTION_FAILURE"),
    ],
    optional: [], ambiguities: [],
    clarification: c("REQUIRED", "Le choix de la propriété observable principale change l'outcome et son owner d'adoption.", ["Propriété observable principale", "Disponibilité de l'adhérence au port"]),
  },
  "FOCUSED-ULTRASOUND-BBB-MRI": {
    required: [
      r("focused-ultrasound-intervention", "EXPLICIT_CONCEPT", "Conserver les ultrasons focalisés comme intervention visant l'ouverture de la barrière.", 1, [P.P01, P.P02]),
      r("mri-contrast-enhancement", "EXPLICIT_CONCEPT", "Conserver le rehaussement de contraste IRM juste après comme observation.", 1, [P.P01, P.P04]),
      r("enhancement-permeability-observable", "RELATION", "Conserver le rehaussement comme observable de perméabilité, distinct de l'intervention et du bénéfice.", 1, [P.P02, P.P14]),
      r("not-therapeutic-benefit", "POLARITY", "Conserver qu'il ne constitue pas la preuve d'un bénéfice thérapeutique.", 1, [P.P03, P.P06]),
      r("exact-window-unknown", "UNKNOWN", "Maintenir ouverte la fenêtre exacte après intervention.", 1, [P.P04, P.P09, P.P13]),
    ],
    prohibited: [
      x("enhancement-as-benefit", "Présenter le rehaussement comme preuve de bénéfice thérapeutique.", [P.P03, P.P06], "POLARITY_OR_CAUSALITY_FAILURE"),
      x("collapse-intervention-observable", "Confondre intervention, méthode d'imagerie et observable de perméabilité.", [P.P14], "CONCEPTUAL_PLAN_COLLAPSE"),
      x("invent-window", "Inventer la fenêtre d'imagerie ou des paramètres d'intervention.", [P.P09, P.P10], "UNSUPPORTED_INVENTION_FAILURE"),
    ],
    optional: [], ambiguities: [],
    clarification: c("REQUIRED", "La fenêtre exacte affecte la relation temporelle entre intervention et observable.", ["Fenêtre temporelle de l'IRM après ultrasons focalisés"]),
  },
};

export const parentageNotes = {
  "LAA-CLOSURE-SEAL-ASSESSMENT": { visible: ["SEM3-DEV-PLAQUE-INTERVENTION-CONTEXT", "SEM3-CAL-ATRIAL-FIBROSIS-ABLATION"], legacy: ["SEM-H13"], distinction: "Dispositif de fermeture, examen conditionnel et fuite péri-dispositif; ni revascularisation, ablation, embolisation ni volume perfusé." },
  "PROSTHETIC-VALVE-INFECTION-CONTEXT": { visible: ["SEM3-DEV-VALVE-HEMODYNAMICS-MULTIMODAL"], legacy: ["SEM-H17"], distinction: "Suspicion infectieuse, signal péri-prothétique, cultures négatives possibles et événements emboliques séparés; aucune hémodynamique valvulaire ni no-reflow." },
  "AMYLOID-ECV-PURPOSE-GAP": { visible: ["SEM3-DEV-CT-FUNCTIONAL-ESTIMATE-ROLE"], legacy: ["SEM-H07", "SEM-H27"], distinction: "Finalité scientifique indécise d'une mesure ECV dans l'amylose traitée; ni mapping natif comparé au strain, ni changement logiciel T1, ni estimation CT." },
  "TRANSPLANT-REJECTION-TIMING": { visible: ["SEM3-CAL-PULMONARY-HEMODYNAMICS-FOLLOWUP"], legacy: ["SEM-H19", "SEM-H23"], distinction: "Alignement temporel entre relaxation T2 myocardique et grade histologique de surveillance de greffe; ni radiomique prostate, ni test-retest ADC." },
  "HFPEF-EXERCISE-STATE": { visible: ["SEM3-CAL-PULMONARY-HEMODYNAMICS-FOLLOWUP"], legacy: ["SEM-H10", "SEM-H26"], distinction: "État repos-effort intra-sujet, pression de remplissage et strain atrial dans l'HFpEF; ni récupération énergétique musculaire, ni récupération d'oxygénation." },
  "POSTPARTUM-MYOCARDIAL-WORK-NONCAUSAL": { visible: ["SEM3-DEV-PERICARDIAL-FAT-NONCAUSAL"], legacy: ["SEM-H24"], distinction: "Correction d'une causalité postpartum entre pression artérielle et travail myocardique avec comparateur ouvert; ni graisse péricardique, ni placenta/fœtus." },
  "EPILEPSY-DISCORDANT-REGION-ELLIPSIS": { visible: ["SEM3-CAL-CONGENITAL-FLOW-ELLIPSIS"], legacy: ["SEM-H22"], distinction: "Ellipse rattachée à une région discordante entre TEP intercritique et MEG avant décision chirurgicale; ni flux congénital, ni pseudoprogression tumorale." },
  "CORNEAL-NERVE-METHOD-MEASURE": { visible: ["SEM3-DEV-INTESTINAL-MOTILITY-METHOD"], legacy: ["SEM-H16"], distinction: "Séparation méthode microscopique, densité nerveuse et régénération cornéenne; ni motilité intestinale, ni séquence osseuse ultracourte." },
  "BREAST-BPE-AMBIGUOUS-CHANGE": { visible: ["SEM3-DEV-BODY-COMPOSITION-AMBIGUITY", "SEM3-CAL-OVARIAN-ULTRASOUND-AMBIGUITY"], legacy: ["SEM-H02"], distinction: "Ambiguïté entre axe longitudinal et inter-groupes du rehaussement parenchymateux après changement hormonal; ni compartiment corporel, ni indication ovarienne, ni réponse T2* d'endométriose." },
  "ORTHODONTIC-CBCT-OUTCOME-CORRECTION": { visible: ["SEM3-DEV-TRIAL-IMAGING-OUTCOME-CORRECTION"], legacy: ["SEM-H16"], distinction: "Hiérarchie corrigée entre épaisseur corticale et résorption radiculaire dans un suivi orthodontique CBCT; ni essai traitement-contrôle, ni visibilité du cortex osseux." },
  "RARE-DISEASE-CONTROL-CHANGE": { visible: ["SEM3-DEV-OUTCOME-PRIORITY-CHANGE", "SEM3-CAL-TRIAL-COMPARATOR-DECISION"], legacy: ["SEM-H30"], distinction: "Changement de comparateur vers trajectoire intra-patient avec temps zéro inconnu dans un registre; ni hiérarchie d'outcomes, ni consentement multicentrique." },
  "MICROBIOME-ANTIBIOTIC-CANDIDATES": { visible: ["SEM3-DEV-TRANSLATIONAL-HYPOXIA-CANDIDATES"], legacy: ["SEM-H18"], distinction: "Candidats taxonomiques/fonctionnels non observés, régime non fiable et non-causalité antibiotique; ni hypoxie translationnelle, ni fibrose pulmonaire CT." },
  "VACCINE-SINGLE-CELL-MULTIDIMENSIONAL": { visible: ["SEM3-DEV-INFLAMMATION-MULTIDIMENSIONAL", "SEM3-CAL-ORGANOID-LIVE-SIGNAL-MEASUREMENT"], legacy: ["SEM-H12"], distinction: "Séparation proportions/états single-cell, temps vaccinaux, anticorps tardifs et effets de lot candidats; ni inflammation multimodale générique, ni organoïde, ni delta-radiomics." },
  "WEARABLE-SLEEP-PHENOMENON-OBSERVABLE": { visible: ["SEM3-CAL-CORTISOL-SAMPLING-SUMMARY"], legacy: ["SEM-H15"], distinction: "Séparation amélioration du sommeil, durée algorithmique, questionnaire et adhérence; ni prélèvement hormonal, ni complétude DICOM multicentrique." },
  "FOCUSED-ULTRASOUND-BBB-MRI": { visible: ["SEM3-DEV-PLAQUE-INTERVENTION-CONTEXT"], legacy: ["SEM-H13", "SEM-H25"], distinction: "Intervention par ultrasons focalisés et observable de perméabilité IRM sans bénéfice thérapeutique; ni plaque, embolisation cone-beam CT, ni agents K-edge." },
};
