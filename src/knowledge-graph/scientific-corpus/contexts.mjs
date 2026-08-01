import { createApplicabilityContext, createContextDimension } from "../scientific-model-factories.mjs";
import { conceptBySlug, historicalConceptIds } from "./concepts.mjs";
import { sourceByKey } from "./sources.mjs";

const ref = (key) => sourceByKey[key].revisionId;
const exact = (dimension, value, sourceKeys) => createContextDimension({ dimension, operator: "EXACT", value, sourceRefs: sourceKeys.map(ref) });
const anyOf = (dimension, values, sourceKeys) => createContextDimension({ dimension, operator: "ANY_OF", values, sourceRefs: sourceKeys.map(ref) });
const range = (dimension, min, max, unit, sourceKeys) => createContextDimension({ dimension, operator: "RANGE", range: { min, max }, unit, sourceRefs: sourceKeys.map(ref) });
const condition = (dimension, value, sourceKeys) => createContextDimension({ dimension, operator: "CONDITION", condition: value, sourceRefs: sourceKeys.map(ref) });

const context = (slug, label, sourceKeys, dimensions, exclusions = []) => createApplicabilityContext({
  contextId: `noxia:radiology:context:ecv-t1:${slug}`,
  combination: "ALL_OF",
  dimensions,
  exclusions,
  status: "ACTIVE",
  label,
  sourceRefs: sourceKeys.map(ref).sort(),
});

export const applicabilityContexts = Object.freeze({
  mrGeneral: context("mr-general", "CMR myocardial T1 mapping and ECV", ["messroghli-2017-consensus"], [
    exact("species", "HUMAN", ["messroghli-2017-consensus"]),
    exact("modality", historicalConceptIds.mr, ["messroghli-2017-consensus"]),
    exact("clinicalDomain", "CARDIAC", ["messroghli-2017-consensus"]),
  ]),
  mr15T: context("mr-1-5-t", "CMR at 1.5 T", ["piechnik-2010-shmolli", "dabir-2014-multicenter"], [
    exact("modality", historicalConceptIds.mr, ["piechnik-2010-shmolli", "dabir-2014-multicenter"]),
    exact("fieldStrength", conceptBySlug["field-strength-1-5-t"], ["piechnik-2010-shmolli", "dabir-2014-multicenter"]),
  ]),
  mr3T: context("mr-3-t", "CMR at 3 T", ["piechnik-2010-shmolli", "dabir-2014-multicenter", "shang-2018-synthetic-hct"], [
    exact("modality", historicalConceptIds.mr, ["piechnik-2010-shmolli", "dabir-2014-multicenter", "shang-2018-synthetic-hct"]),
    exact("fieldStrength", conceptBySlug["field-strength-3-t"], ["piechnik-2010-shmolli", "dabir-2014-multicenter", "shang-2018-synthetic-hct"]),
  ]),
  mrMolli: context("mr-molli", "CMR MOLLI acquisition", ["messroghli-2004-molli", "roujol-2014-comparison"], [
    exact("modality", historicalConceptIds.mr, ["messroghli-2004-molli", "roujol-2014-comparison"]),
    exact("measurementMethod", conceptBySlug["myocardial-t1-mapping"], ["messroghli-2004-molli", "roujol-2014-comparison"]),
    exact("sequence", conceptBySlug.molli, ["messroghli-2004-molli", "roujol-2014-comparison"]),
  ]),
  mrShMolli: context("mr-shmolli", "CMR ShMOLLI acquisition", ["piechnik-2010-shmolli", "roujol-2014-comparison"], [
    exact("modality", historicalConceptIds.mr, ["piechnik-2010-shmolli", "roujol-2014-comparison"]),
    exact("measurementMethod", conceptBySlug["myocardial-t1-mapping"], ["piechnik-2010-shmolli", "roujol-2014-comparison"]),
    exact("sequence", conceptBySlug.shmolli, ["piechnik-2010-shmolli", "roujol-2014-comparison"]),
    anyOf("fieldStrength", [conceptBySlug["field-strength-1-5-t"], conceptBySlug["field-strength-3-t"]], ["piechnik-2010-shmolli"]),
  ]),
  mrSasha: context("mr-sasha", "CMR SASHA acquisition", ["chow-2014-sasha", "roujol-2014-comparison"], [
    exact("modality", historicalConceptIds.mr, ["chow-2014-sasha", "roujol-2014-comparison"]),
    exact("measurementMethod", conceptBySlug["myocardial-t1-mapping"], ["chow-2014-sasha", "roujol-2014-comparison"]),
    exact("sequence", conceptBySlug.sasha, ["chow-2014-sasha", "roujol-2014-comparison"]),
  ]),
  mrMolliSashaComparison: context("mr-molli-sasha-comparison", "Head-to-head MOLLI and SASHA comparison", ["roujol-2014-comparison"], [
    exact("modality", historicalConceptIds.mr, ["roujol-2014-comparison"]),
    anyOf("sequence", [conceptBySlug.molli, conceptBySlug.sasha], ["roujol-2014-comparison"]),
    exact("population", "HEALTHY_VOLUNTEERS", ["roujol-2014-comparison"]),
    exact("study", "ROUJOL_2014_HEAD_TO_HEAD", ["roujol-2014-comparison"]),
  ]),
  mrEcv: context("mr-ecv", "CMR myocardial ECV", ["kellman-2012-ecv", "messroghli-2017-consensus"], [
    exact("modality", historicalConceptIds.mr, ["kellman-2012-ecv", "messroghli-2017-consensus"]),
    exact("measurementMethod", conceptBySlug["myocardial-t1-mapping"], ["kellman-2012-ecv", "messroghli-2017-consensus"]),
    exact("contrastAgent", conceptBySlug["gadolinium-based-contrast-agent"], ["kellman-2012-ecv", "messroghli-2017-consensus"]),
  ]),
  myocarditisMr: context("myocarditis-mr", "Suspected myocarditis assessed by CMR", ["ferreira-2018-myocarditis", "nadjiri-2017-myocarditis", "lundin-2019-timing"], [
    exact("species", "HUMAN", ["ferreira-2018-myocarditis", "nadjiri-2017-myocarditis", "lundin-2019-timing"]),
    exact("disease", conceptBySlug["acute-myocarditis"], ["ferreira-2018-myocarditis", "nadjiri-2017-myocarditis", "lundin-2019-timing"]),
    exact("modality", historicalConceptIds.mr, ["ferreira-2018-myocarditis", "nadjiri-2017-myocarditis", "lundin-2019-timing"]),
  ]),
  myocarditisTiming: context("myocarditis-mr-timing", "Myocarditis CMR at early versus late post-contrast timing", ["lundin-2019-timing"], [
    exact("disease", conceptBySlug["acute-myocarditis"], ["lundin-2019-timing"]),
    exact("modality", historicalConceptIds.mr, ["lundin-2019-timing"]),
    anyOf("temporality", ["3_MINUTES_POST_CONTRAST", "21_MINUTES_POST_CONTRAST"], ["lundin-2019-timing"]),
  ]),
  acuteMiMr: context("acute-mi-mr", "Acute myocardial infarction assessed by CMR", ["kidambi-2017-mi", "kellman-2012-ecv"], [
    exact("species", "HUMAN", ["kidambi-2017-mi", "kellman-2012-ecv"]),
    exact("disease", conceptBySlug["acute-myocardial-infarction"], ["kidambi-2017-mi", "kellman-2012-ecv"]),
    exact("modality", historicalConceptIds.mr, ["kidambi-2017-mi", "kellman-2012-ecv"]),
  ]),
  amyloidMr: context("al-amyloidosis-mr", "Systemic AL amyloidosis assessed by CMR", ["banypersad-2015-amyloid"], [
    exact("species", "HUMAN", ["banypersad-2015-amyloid"]),
    exact("disease", conceptBySlug["systemic-al-amyloidosis"], ["banypersad-2015-amyloid"]),
    exact("modality", historicalConceptIds.mr, ["banypersad-2015-amyloid"]),
  ]),
  multicenterMolli: context("multicenter-molli", "Uniform multicenter MOLLI reference cohort", ["dabir-2014-multicenter"], [
    exact("species", "HUMAN", ["dabir-2014-multicenter"]),
    exact("population", "HEALTHY_VOLUNTEERS", ["dabir-2014-multicenter"]),
    exact("modality", historicalConceptIds.mr, ["dabir-2014-multicenter"]),
    exact("sequence", conceptBySlug.molli, ["dabir-2014-multicenter"]),
    anyOf("fieldStrength", [conceptBySlug["field-strength-1-5-t"], conceptBySlug["field-strength-3-t"]], ["dabir-2014-multicenter"]),
    condition("center", "MULTIPLE_CENTERS_WITH_UNIFORM_PROTOCOL_AND_CORE_LAB", ["dabir-2014-multicenter"]),
  ]),
  t1mesPhantom: context("t1mes-phantom", "T1MES multinational phantom program", ["captur-2020-t1mes"], [
    exact("population", "PHANTOM_NOT_HUMAN", ["captur-2020-t1mes"]),
    exact("modality", historicalConceptIds.mr, ["captur-2020-t1mes"]),
    anyOf("fieldStrength", [conceptBySlug["field-strength-1-5-t"], conceptBySlug["field-strength-3-t"]], ["captur-2020-t1mes"]),
    condition("center", "MULTINATIONAL_MULTISITE", ["captur-2020-t1mes"]),
  ]),
  ctEcvBolus: context("ct-ecv-bolus", "Bolus CT myocardial ECV", ["nacif-2012-ct", "cundari-2023-ct-method"], [
    exact("species", "HUMAN", ["nacif-2012-ct", "cundari-2023-ct-method"]),
    exact("modality", historicalConceptIds.ct, ["nacif-2012-ct", "cundari-2023-ct-method"]),
    exact("contrastAgent", conceptBySlug["iodinated-contrast-agent"], ["nacif-2012-ct", "cundari-2023-ct-method"]),
    range("temporality", 3, 10, "minute", ["cundari-2023-ct-method"]),
  ]),
  ctEcvEquilibrium: context("ct-ecv-equilibrium", "Equilibrium contrast-enhanced CT myocardial ECV", ["bandula-2013-ct"], [
    exact("species", "HUMAN", ["bandula-2013-ct"]),
    exact("disease", "SEVERE_AORTIC_STENOSIS", ["bandula-2013-ct"]),
    exact("modality", historicalConceptIds.ct, ["bandula-2013-ct"]),
    exact("contrastAgent", conceptBySlug["iodinated-contrast-agent"], ["bandula-2013-ct"]),
    condition("protocol", "EQUILIBRIUM_IODINE_INFUSION", ["bandula-2013-ct"]),
  ]),
  syntheticHctLocal: context("synthetic-hct-local", "Locally calibrated synthetic hematocrit", ["kammerlander-2018-synthetic-hct"], [
    exact("modality", historicalConceptIds.mr, ["kammerlander-2018-synthetic-hct"]),
    exact("measurementMethod", conceptBySlug["synthetic-hematocrit"], ["kammerlander-2018-synthetic-hct"]),
    condition("center", "SINGLE_CENTER_LOCALLY_DERIVED_MODEL", ["kammerlander-2018-synthetic-hct"]),
  ]),
  syntheticHct3T: context("synthetic-hct-3-t", "Synthetic hematocrit at 3 T", ["shang-2018-synthetic-hct"], [
    exact("modality", historicalConceptIds.mr, ["shang-2018-synthetic-hct"]),
    exact("measurementMethod", conceptBySlug["synthetic-hematocrit"], ["shang-2018-synthetic-hct"]),
    exact("fieldStrength", conceptBySlug["field-strength-3-t"], ["shang-2018-synthetic-hct"]),
    condition("center", "SINGLE_CENTER_3T_MODEL", ["shang-2018-synthetic-hct"]),
  ]),
});

export const scientificApplicabilityContexts = Object.freeze(Object.values(applicabilityContexts).sort((a, b) => a.contextId.localeCompare(b.contextId)));
