const COMPARISON_EXPRESSION = /\b(?:compar(?:e|es|ons|ez|ent|er|ant|é(?:e|es|s)?|atif(?:s|ve|ves)?|aison(?:s)?|able(?:s)?|abilit[ée](?:s)?)|diff[ée]rences?|similitudes?|distinctions?|versus|vs\.?)\b/iu;

/** Linguistic signal only: this does not establish a scientific relation. */
export const hasExplicitComparisonRequest = (value: string) => COMPARISON_EXPRESSION.test(value.normalize("NFKC"));
