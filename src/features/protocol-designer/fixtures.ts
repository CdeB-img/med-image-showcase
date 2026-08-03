import type { DemonstratorScenario, IntentChoice } from "./types";

export const INTENT_CHOICES: IntentChoice[] = [
  { id: "understand", label: "Comprendre", explanation: "Clarifier les construits et leurs dépendances." },
  { id: "compare", label: "Comparer", explanation: "Mettre en regard des options sans les classer automatiquement." },
  { id: "quantify", label: "Quantifier ou suivre", explanation: "Examiner les conditions d’une mesure interprétable." },
  { id: "hypothesis", label: "Examiner une hypothèse", explanation: "Rendre explicites hypothèses, objections et inconnues." },
  { id: "reproduce", label: "Reproduire une étude", explanation: "Identifier les dépendances de comparabilité et de traçabilité." },
];

export const DEMONSTRATOR_SCENARIOS: DemonstratorScenario[] = [
  {
    id: "spectral",
    shortLabel: "Imagerie spectrale",
    title: "Caractériser une mesure en imagerie spectrale",
    intent: "Je souhaite comparer la portée de mesures spectrales pour une étude quantitative.",
    program: { id: "NXP-000001", title: "Spectral Imaging & Quantitative CT", version: "1.1" },
    reasoningBook: { id: "RB-003", title: "Spectral Imaging & Quantitative CT", version: "1.0" },
    comprehension:
      "La question porte sur la comparabilité d’une mesure reconstruite, pas sur la seule disponibilité d’une image ou d’une carte.",
    constructs: [
      "Mesure directement observée ou grandeur dérivée",
      "Dépendance à l’architecture d’acquisition et de reconstruction",
      "Calibration, identifiabilité et répétabilité",
    ],
    hypotheses: [
      "La grandeur étudiée est définie de façon identique entre les systèmes comparés.",
      "La chaîne de calibration permet une comparaison quantitative défendable.",
      "Les paramètres de reconstruction sont suffisamment documentés pour qualifier la mesure.",
    ],
    missingInformation: [
      { id: "spectral-definition", label: "Définition opérationnelle de la grandeur", why: "Sans définition commune, deux sorties de même nom peuvent représenter des construits différents.", critical: true },
      { id: "spectral-calibration", label: "État de calibration et contrôles qualité", why: "La stabilité métrologique conditionne l’interprétation quantitative.", critical: true },
      { id: "spectral-reconstruction", label: "Version et paramètres de reconstruction", why: "Ils peuvent modifier la valeur, le bruit et la résolution de la mesure.", critical: false },
    ],
    strategies: [
      { id: "spectral-internal", title: "Comparaison interne contrôlée", benefit: "Réduit l’hétérogénéité technique et facilite la traçabilité.", tradeoff: "Portée externe limitée.", condition: "Même chaîne et mêmes contrôles documentés." },
      { id: "spectral-multisystem", title: "Comparaison multi-systèmes qualifiée", benefit: "Explore la transférabilité entre architectures.", tradeoff: "Charge de calibration et risque de non-identifiabilité plus élevés.", condition: "Phantoms, versions et transformations explicitement harmonisés." },
    ],
    evidence: [
      { label: "Distinction mesure / grandeur dérivée", locator: "RB-003 v1.0, §7–14", contribution: "Qualifie le construit et sa dépendance au modèle." },
      { label: "Métrologie et reproductibilité", locator: "RB-003 v1.0, §51–57", contribution: "Qualifie les exigences de calibration et de comparabilité." },
    ],
    limitations: [
      "Les sorties portant le même nom ne sont pas nécessairement interchangeables.",
      "Une carte d’iode ne constitue pas à elle seule une mesure directe de perfusion.",
      "Le démonstrateur n’évalue ni données ni paramètres réels.",
    ],
    controversy: "La transférabilité des mesures entre architectures et constructeurs ne peut pas être présumée universelle.",
    openQuestion: "Quel niveau de calibration externe rendrait la comparaison suffisamment robuste pour l’objectif déclaré ?",
  },
  {
    id: "cardiac",
    shortLabel: "IRM cardiaque",
    title: "Structurer une question quantitative en IRM cardiaque",
    intent: "Je souhaite étudier un biomarqueur d’IRM cardiaque dans un cadre multicentrique.",
    program: { id: "NXP-000002", title: "Cardiac MRI & Quantitative Myocardial Imaging", version: "1.2" },
    reasoningBook: { id: "RB-004", title: "Cardiac MRI & Quantitative Myocardial Imaging", version: "1.1" },
    comprehension:
      "La question vise la défendabilité d’un biomarqueur dans une chaîne d’acquisition, d’analyse et de contrôle qualité explicite.",
    constructs: [
      "Fonction, mouvement et déformation myocardique",
      "Caractérisation tissulaire relative ou quantitative",
      "Qualité, harmonisation et répétabilité multicentrique",
    ],
    hypotheses: [
      "Le biomarqueur choisi correspond directement à l’objectif scientifique déclaré.",
      "Les dépendances aux séquences, logiciels et moments de mesure sont maîtrisées.",
      "Les cas non évaluables peuvent être reconnus avant l’interprétation.",
    ],
    missingInformation: [
      { id: "cardiac-endpoint", label: "Objectif et endpoint précisément définis", why: "Le choix du biomarqueur dépend du construit que l’étude veut tester.", critical: true },
      { id: "cardiac-sequence", label: "Séquence, timing et version logicielle", why: "Ces dépendances peuvent déplacer les valeurs et leur comparabilité.", critical: true },
      { id: "cardiac-quality", label: "Règles de qualité et de non-évaluabilité", why: "Une valeur calculée n’est pas nécessairement interprétable.", critical: false },
    ],
    strategies: [
      { id: "cardiac-focused", title: "Biomarqueur principal ciblé", benefit: "Question plus lisible et charge de mesure limitée.", tradeoff: "Couverture mécanistique plus étroite.", condition: "Endpoint principal et règle d’analyse préspécifiés." },
      { id: "cardiac-multiparametric", title: "Lecture multiparamétrique", benefit: "Met en regard fonction et caractérisation tissulaire.", tradeoff: "Complexité, multiplicité et dépendances techniques accrues.", condition: "Hiérarchie des mesures et gestion des résultats discordants explicites." },
    ],
    evidence: [
      { label: "Dépendances des biomarqueurs cardiaques", locator: "RB-004 v1.1, §17–36", contribution: "Qualifie les familles de mesures et leurs conditions." },
      { label: "Qualité, harmonisation et répétabilité", locator: "RB-004 v1.1, §44–49", contribution: "Qualifie la comparabilité et les états non évaluables." },
    ],
    limitations: [
      "Le rehaussement tardif est une lecture relative et dépendante du contexte.",
      "Les valeurs de mapping dépendent de la séquence, du champ et de la chaîne logicielle.",
      "Aucun seuil clinique ni ordre de séquences n’est produit ici.",
    ],
    controversy: "La généralisation de seuils et de valeurs de référence entre centres reste conditionnée par l’harmonisation.",
    openQuestion: "Quelle part de la variabilité observée relève de la biologie, de l’acquisition ou de l’analyse ?",
  },
  {
    id: "neuro",
    shortLabel: "Neuro-perfusion",
    title: "Raisonner sur perfusion, oxygénation et métabolisme cérébral",
    intent: "Je souhaite comparer des biomarqueurs de perfusion et de métabolisme cérébral.",
    program: { id: "NXP-000003", title: "Neuro Perfusion & Metabolism", version: "1.1" },
    reasoningBook: { id: "RB-005", title: "Neuro Perfusion & Metabolism", version: "1.0" },
    comprehension:
      "La question distingue les grandeurs hémodynamiques, l’oxygénation et le métabolisme, ainsi que les hypothèses propres à chaque modalité.",
    constructs: [
      "CBF, CBV, MTT, TTP et Tmax : grandeurs distinctes",
      "OEF et CMRO₂ : extraction d’oxygène et métabolisme",
      "Délai collatéral, état systémique et couplage neurovasculaire",
    ],
    hypotheses: [
      "Le biomarqueur sélectionné représente le construit physiologique visé.",
      "Le délai et la dispersion sont séparés d’une véritable altération du débit.",
      "La modalité et le modèle permettent la comparaison envisagée.",
    ],
    missingInformation: [
      { id: "neuro-construct", label: "Construit physiologique prioritaire", why: "Débit, volume, délai, extraction et métabolisme ne sont pas substituables.", critical: true },
      { id: "neuro-modality", label: "Modalité, modèle et méthode d’estimation", why: "CTP, DSC, DCE, ASL et PET reposent sur des hypothèses différentes.", critical: true },
      { id: "neuro-systemic", label: "Contexte systémique et circulation collatérale", why: "Ils peuvent modifier l’interprétation des cartes de délai et de perfusion.", critical: false },
    ],
    strategies: [
      { id: "neuro-hemodynamic", title: "Lecture hémodynamique ciblée", benefit: "Clarifie débit, volume et délai avec un modèle explicite.", tradeoff: "Ne décrit pas directement l’extraction d’oxygène ni le métabolisme.", condition: "Modèle, AIF et effets de délai qualifiés." },
      { id: "neuro-integrated", title: "Lecture physiologique intégrée", benefit: "Met en relation perfusion, oxygénation et métabolisme.", tradeoff: "Plus de modèles, de modalités et d’incertitudes cumulées.", condition: "Temporalité, recalage et hypothèses intermodalités documentés." },
    ],
    evidence: [
      { label: "Grandeurs hémodynamiques et modèles", locator: "RB-005 v1.0, §7–44", contribution: "Qualifie les distinctions entre débit, volume et délais." },
      { label: "OEF, CMRO₂ et différences de modalité", locator: "RB-005 v1.0, §45–69", contribution: "Qualifie l’interprétation physiologique et les hypothèses." },
    ],
    limitations: [
      "Tmax et TTP ne sont pas des synonymes de débit cérébral.",
      "Les seuils de pénombre ou de core dépendent du contexte, du logiciel et de la population.",
      "Le démonstrateur ne formule aucune recommandation clinique ou de thrombectomie.",
    ],
    controversy: "La robustesse des seuils et des cartes dépend des méthodes, des délais collatéraux et de la transférabilité entre populations.",
    openQuestion: "Comment séparer une altération métabolique d’un effet de délai, de modèle ou de condition systémique ?",
  },
];

export const scenarioById = (id: string | null) => DEMONSTRATOR_SCENARIOS.find((scenario) => scenario.id === id);
