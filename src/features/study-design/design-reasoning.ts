export type LegacyStudyDesignFamily =
  | "CROSS_SECTIONAL_OBSERVATIONAL"
  | "PROSPECTIVE_LONGITUDINAL_COHORT"
  | "RETROSPECTIVE_LONGITUDINAL_COHORT"
  | "PROSPECTIVE_PROGNOSTIC_COHORT"
  | "METHODOLOGICAL_VALIDATION"
  | "COMPARATIVE_OBSERVATIONAL";

export type LegacyStudyDesignReasoningSeed = {
  family: LegacyStudyDesignFamily;
  label: string;
  whyItAnswersQuestion: string;
  estimandPurpose: string;
  limitations: string[];
  biases: string[];
  constraints: string[];
  sourceSignals: string[];
};

export type StudyDesignSignals = {
  validation: boolean;
  prognostic: boolean;
  longitudinal: boolean;
  retrospective: boolean;
  prospective: boolean;
  comparative: boolean;
  interventionExplicit: boolean;
};

const includesAny = (text: string, patterns: RegExp[]) => patterns.some((pattern) => pattern.test(text));

export const detectStudyDesignSignals = (text: string, hasAvailableData = false): StudyDesignSignals => ({
  validation: includesAny(text, [/validat/, /concord/, /compar\w* (deux|2) (méthod|mesur)/, /deux méthodes/, /reproductib/, /répétabil/]),
  prognostic: includesAny(text, [/pronosti/, /prédi\w*/, /événement futur/, /survie/, /risque de survenue/]),
  longitudinal: includesAny(text, [/longitudinal/, /évolution/, /suivi/, /progression/, /variation/, /répét\w* mesure/]),
  retrospective: includesAny(text, [/rétrospect/, /données existantes/, /base existante/, /déjà acquises/]) || hasAvailableData,
  prospective: includesAny(text, [/prospecti/, /recrut/, /à venir/, /futur/]),
  comparative: includesAny(text, [/compar/, /versus| vs /, /groupe/, /exposé/, /intervention/]),
  interventionExplicit: includesAny(text, [/interventionnelle?/, /randomis/, /essai contrôlé/, /traitement assigné/]),
});

/**
 * Pure extraction of the bounded PRJ design-family reasoning. It deliberately
 * returns seeds only: PRJ keeps its own candidate identity and Study Design
 * builds its native contribution contract separately.
 */
export const buildLegacyStudyDesignReasoningSeeds = (input: {
  text: string;
  hasAvailableData: boolean;
}): LegacyStudyDesignReasoningSeed[] => {
  const candidates: LegacyStudyDesignReasoningSeed[] = [];
  const add = (
    family: LegacyStudyDesignFamily,
    label: string,
    whyItAnswersQuestion: string,
    estimandPurpose: string,
    limitations: string[],
    biases: string[],
    constraints: string[],
    sourceSignals: string[],
  ) => {
    if (!candidates.some((candidate) => candidate.family === family)) {
      candidates.push({ family, label, whyItAnswersQuestion, estimandPurpose, limitations, biases, constraints, sourceSignals });
    }
  };
  const signals = detectStudyDesignSignals(input.text, input.hasAvailableData);

  if (signals.validation) add("METHODOLOGICAL_VALIDATION", "Validation méthodologique comparative", "La Question porte sur la comparabilité, la concordance ou la reproductibilité de méthodes de mesure.", "Estimer l’accord, les différences et la répétabilité entre méthodes sans revendiquer un effet pronostique.", ["La méthode de référence et les conditions de répétition restent à décider."], ["Biais de mesure", "Effet d’ordre ou d’apprentissage"], ["Réalisation des méthodes dans des conditions comparables"], ["relation méthodologique détectée"]);
  if (signals.prognostic) add("PROSPECTIVE_PROGNOSTIC_COHORT", "Cohorte pronostique prospective", "Le biomarqueur ou l’exposition doit précéder un événement futur distinct.", "Estimer une association ou une capacité prédictive entre une mesure initiale et un outcome futur.", ["Durée et modalités du suivi restent à documenter.", "La causalité n’est pas établie par le seul caractère prospectif."], ["Attrition", "Confusion pronostique"], ["Outcome futur définissable", "Suivi et adjudication à organiser"], ["finalité pronostique détectée"]);
  if (signals.longitudinal && !signals.prognostic) add("PROSPECTIVE_LONGITUDINAL_COHORT", "Cohorte longitudinale prospective", "La Question examine une évolution au cours du temps ou une variation intra-sujet.", "Estimer un changement et sa variabilité dans une Population définie.", ["Fenêtre scientifique et fréquence des mesures restent à justifier."], ["Attrition", "Effet de maturation ou de temporalité"], ["Mesures répétées comparables"], ["évolution temporelle détectée"]);
  if (signals.retrospective && (signals.longitudinal || signals.prognostic || signals.comparative)) add("RETROSPECTIVE_LONGITUDINAL_COHORT", "Cohorte rétrospective à partir de données existantes", "Des données existantes peuvent instruire une trajectoire ou une association sans recrutement immédiat.", "Explorer la relation avec les données effectivement disponibles et leur temporalité réelle.", ["Qualité, exhaustivité et calendrier des données ne sont pas contrôlés prospectivement."], ["Biais de sélection", "Biais d’information"], ["Provenance et qualité des données existantes à vérifier"], ["données existantes déclarées"]);
  if (signals.comparative && !signals.validation) add("COMPARATIVE_OBSERVATIONAL", "Étude observationnelle comparative", "La Question comporte des groupes, expositions ou stratégies à comparer sans intervention automatiquement imposée.", "Estimer une différence ou association entre groupes scientifiquement justifiés.", ["La comparabilité initiale et la confusion doivent être examinées."], ["Biais de sélection", "Confusion"], ["Définition défendable des groupes"], ["comparaison déclarée"]);
  if (!candidates.length || (!signals.longitudinal && !signals.prognostic && !signals.validation && !signals.retrospective)) add("CROSS_SECTIONAL_OBSERVATIONAL", "Étude observationnelle transversale minimale", "Une mesure unique peut suffire à décrire ou examiner l’association demandée lorsque la Question n’impose ni suivi ni intervention.", "Décrire la distribution ou une association au temps scientifique retenu.", ["Aucune évolution temporelle ou relation pronostique ne peut être établie."], ["Biais de sélection", "Biais de mesure"], ["Population et mesure définissables au même temps"], ["absence de nécessité temporelle démontrée"]);
  return candidates.sort((left, right) => left.family.localeCompare(right.family));
};
