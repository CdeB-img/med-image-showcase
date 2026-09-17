import { logicalDigest } from "../knowledge-engine/canonical.js";
import type { ResearchProjectOwnerProjection } from "../research-project-construction/contribution-owner-boundary.js";
import { presentResearchProjectAssertion } from "../research-project-construction/contribution-owner-boundary.js";
import type { StudyDeliverablePortfolio, StudyDeliverableArtifact } from "./study-deliverable-portfolio.js";
import { DRCI_DOCUMENT_KINDS, isDrciDraftPackCurrent, polishDrciEditorialText, type DrciDraftPack } from "./drci-draft-contract.js";
export * from "./drci-draft-contract.js";
const escapeHtml = (value: string) => value.replace(/[&<>"']/gu, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);
export const drciDraftPackFiles = (pack: DrciDraftPack) => pack.documents.map(doc => {
  const facts = new Map(pack.sourceFacts.map(item => [item.ref, item]));
  const statedFact = (ref: string) => { const fact = facts.get(ref); return fact ? presentResearchProjectAssertion(fact.content, fact.polarity) : "[Source indisponible]"; };
  const substituted = (value: string) => {
    // Legacy FACT citations are provenance, not a second scientific sentence.
    // A standalone fact projection still supplies its original adopted text.
    const refs = [...value.matchAll(/\[\[FACT:([^\]]+)\]\]/gu)].map(match => match[1]);
    const prose = value.replace(/\[\[FACT:[^\]]+\]\]/gu, "").replace(/[ \t]{2,}/gu, " ").replace(/\s+([.,;])/gu, "$1").trim();
    return prose.replace(/[\s.,;]/gu, "") ? prose : refs.map(statedFact).join(" ");
  };
  const repeated = new Set<string>();
  const sections = doc.sections.map(section => ({ ...section, title: polishDrciEditorialText(section.title),
    paragraphs: section.paragraphs.map(value => polishDrciEditorialText(substituted(value))).filter(value => {
      if (repeated.has(value)) return false;
      repeated.add(value); return true;
    }) }));
  const current = pack.sourceFacts.filter(fact => fact.epistemicState === "KNOWN"
    && (fact.polarity === undefined || fact.polarity === "AFFIRMED"));
  const criteria = current.filter(fact => fact.type === "ELIGIBILITY_CRITERION");
  const consent = criteria.filter(fact => /consentement.*requis/iu.test(fact.content));
  const evaluability = current.filter(fact => fact.type === "PROJECT_INFORMATION" && /cartes.*interprétables/iu.test(fact.content));
  const analytical = current.filter(fact => fact.type === "PROJECT_INFORMATION" && /LGE.*analyse principale/iu.test(fact.content));
  const mri = current.filter(fact => fact.type === "VISIT" && /IRM/iu.test(fact.content));
  if (doc.kind === "CRF") {
    if (criteria.length) sections.push({ title: "Présélection / éligibilité", sourceRefs: criteria.map(fact => fact.ref), paragraphs: [
      "Vérifier les critères courants avec le formulaire interne de présélection et consigner l’issue avec son motif. Une incertitude nécessite une confirmation ; elle ne vaut pas éligibilité automatique.",
    ] });
    if (consent.length) sections.push({ title: "Consentement", sourceRefs: consent.map(fact => fact.ref), paragraphs: [
      "Vérifier le recueil du consentement avant les procédures de recherche. Ce dictionnaire et la présélection ne constituent pas un formulaire de consentement. Version, date et traçabilité du formulaire relèvent du circuit institutionnel à préciser.",
    ] });
    const safety = criteria.filter(fact => /contre-indication.*IRM.*contraste/iu.test(fact.content));
    if (safety.length) sections.push({ title: "Sécurité IRM / éligibilité au contraste", sourceRefs: safety.map(fact => fact.ref), paragraphs: [
      "Faire confirmer médicalement l’absence de contre-indication à l’IRM ou au contraste. La checklist finale rassemble les paramètres de sécurité à arrêter avant utilisation ; aucun seuil ni décision médicale automatisée n’est ajouté.",
    ] });
    if (analytical.length || evaluability.length) sections.push({ title: "Éligibilité à l’analyse", sourceRefs: [...analytical, ...evaluability].map(fact => fact.ref), paragraphs: [
      "Vérifier l’évaluabilité du critère de jugement principal et les exclusions analytiques adoptées. Consigner le motif sans supprimer la fiche du participant ni ses données sources. Distinguer donnée manquante, non-évaluabilité et exclusion analytique.",
    ] });
    sections.push({ title: "Clôture du recueil", sourceRefs: [], paragraphs: [
      "Vérifier les modules applicables, le lien site/laboratoire/imagerie, les calculs dérivés et les motifs d’absence ou d’exclusion. La clôture du recueil est un état administratif ; elle ne signifie ni inclusion dans l’analyse ni validation scientifique.",
    ] });
  }
  if (doc.kind === "RECRUITMENT") {
    for (const section of sections) {
      if (/information.*candidat/iu.test(section.title)) section.title = "A. Information destinée aux candidats";
      if (/formulaire.*(?:papier|présélection)/iu.test(section.title)) section.title = "B. Formulaire interne de présélection";
    }
    for (const section of sections) section.paragraphs = section.paragraphs.map(paragraph => paragraph.replace(
      /Initiales ou code de présélection\s*:/gu, "Code de présélection [règle institutionnelle à définir] :"));
    const lower = criteria.map(fact => fact.content.match(/^Âge minimal\s*:\s*(\d+) ans/iu)?.[1]).find(Boolean);
    const upper = criteria.map(fact => fact.content.match(/^Âge maximal\s*:\s*(\d+) ans/iu)?.[1]).find(Boolean);
    const exclusions = criteria.filter(fact => /^Exclusion /iu.test(fact.content));
    const conditional = criteria.filter(fact => /admissibles seulement si/iu.test(fact.content));
    if (exclusions.length) sections.push({ title: "Règles internes de décision", sourceRefs: criteria.map(fact => fact.ref), paragraphs: [
      ...(lower && upper ? [`Âge hors de ${lower}–${upper} ans : non éligible. Âge incertain : à confirmer.`] : []),
      ...exclusions.map(fact => `${fact.content.replace(/^Exclusion en cas (?:de\s+|d[’'])|^Exclusion des\s+/iu, "").replace(/\.$/u, "")} : si Oui → non éligible ; si Non → poursuivre les autres vérifications ; si incertain → à confirmer.`),
      ...conditional.map(fact => `${fact.content} Si une condition n’est pas satisfaite → non éligible ; si une information manque → à confirmer.`),
      "Potentiellement éligible : tous les critères applicables sont satisfaits et aucune exclusion n’est présente. Une incertitude reste à confirmer par l’investigateur. Ce résultat ne remplace ni la vérification médicale ni le consentement.",
    ] });
  }
  const unknownFacts = pack.sourceFacts.filter(item => item.epistemicState === "UNKNOWN");
  const authoredCompletion = sections.find(section => /à (?:définir|compléter) avant gel/iu.test(section.title)
    && unknownFacts.every(fact => section.sourceRefs.includes(fact.ref)));
  // Deduplication compares open topics only; it cannot modify their source state.
  const topicWords = (value: string) => new Set(value.normalize("NFD").replace(/[\u0300-\u036f]/gu, "").toLowerCase()
    .replace(/procedure de pa\b/gu, "procedure de pression arterielle")
    .replace(/\b(?:l|le|la|les|de|du|des|d|et|a|au|aux|en|reste|restent|restant|definir|preciser|completer|avant|gel|protocole|technique|analyse)\b/gu, " ")
    .split(/[^a-z0-9]+/u).filter(word => word.length > 1));
  const covers = (listed: string, value: string) => {
    const a = topicWords(listed), b = topicWords(value);
    const shared = [...b].filter(word => a.has(word)).length;
    return listed === value || shared >= 2 && shared === b.size;
  };
  const notes = authoredCompletion?.paragraphs ?? doc.missingElements;
  const missing: string[] = [];
  for (const note of notes) {
    const clean = polishDrciEditorialText(note)
      .replace(/tolérance temporelle post-contraste/giu, "tolérance du délai post-contraste")
      .replace(/modalités de lecture et critères documentaires de qualité/giu, "modalités exactes de lecture IRM et critères documentaires de qualité");
    const category = clean.match(/^(Technique|Analyse|Institution)\s*:\s*/iu)?.[0] ?? "";
    const body = clean.slice(category.length);
    const pieces = category ? body.split(body.includes(";") ? /\s*;\s*/u : /^Technique\s*:/iu.test(category) ? /\s*,\s*/u : /$^/u) : [body];
    for (const piece of pieces.filter(Boolean)) {
      const item = `${category}${piece}`;
      if (!missing.some(value => covers(value, item) && covers(item, value))) missing.push(item);
    }
  }
  for (const fact of unknownFacts) if (!missing.some(value => covers(value, fact.content))) {
    for (let i = missing.length - 1; i >= 0; i--) if (covers(fact.content, missing[i])) missing.splice(i, 1);
    missing.push(statedFact(fact.ref));
  }
  const contentSections = sections.filter(section => section !== authoredCompletion);
  const completionTitle = doc.kind === "RECRUITMENT" ? "C. Checklist interne avant mise en service"
    : authoredCompletion?.title ?? "À définir avant gel du protocole";
  const checklist = new Map<string, string[]>();
  for (const item of missing) {
    const category = item.match(/^(Technique|Analyse|Institution)\s*:\s*/iu);
    const group = category?.[1] ?? "Autres éléments à arrêter";
    const subject = item.slice(category?.[0].length ?? 0).replace(/^(?:L[’']|La\s+|Les\s+)/u, "")
      .replace(/^agent et la dose/iu, "agent et dose")
      .replace(/\s+(?:reste|restent)\s+à\s+(?:définir|préciser|compléter)[.!]?$/iu, "");
    const label = subject.charAt(0).toLocaleUpperCase("fr") + subject.slice(1);
    checklist.set(group, [...(checklist.get(group) ?? []), label]);
  }
  const checklistNotice = "Chaque entrée ci-dessous correspond à un élément à arrêter avant utilisation. Aucun choix n’est présumé acquis.";
  const checklistHtml = [...checklist].map(([group, items]) => `<h3>${escapeHtml(group)}</h3><ul>${items.map(value => `<li>☐ ${escapeHtml(value)}</li>`).join("")}</ul>`).join("");
  const originLabels = { PARTICIPANT_REPORTED: "Déclaration du participant", SITE_RECORDED: "Recueil clinique du site", LAB_RESULT: "Résultat laboratoire",
    IMAGING_DERIVED: "Mesure quantitative d’imagerie", IMAGING_READER_RECORDED: "Qualification du lecteur IRM", SYSTEM_DERIVED: "Calcul dérivé", UNSPECIFIED: "Origine à préciser" };
  const dictionary = doc.kind === "CRF" ? pack.crfRows.map(row => ({
    title: `${row.variableId ? `${row.variableId} — ` : ""}${row.label ?? facts.get(row.variableRef)?.content ?? "[Variable manquante]"}`,
    module: row.domain, origin: originLabels[row.dataOrigin], required: row.required,
    fields: Object.entries({ "Module": row.domain, "Visite / moment": row.visit ?? "À préciser", "Définition": row.definition,
      "Type de données": ({ PROPOSED_FOR_REVIEW: "À définir", ADOPTED_PROJECT: "À préciser", UNSPECIFIED: "À définir" } as Record<string, string>)[row.entryType] ?? row.entryType,
      ...(row.unit ? { "Unité": row.unit } : {}), ...(row.categories ? { "Modalités": row.categories } : {}),
      "Origine": originLabels[row.dataOrigin], "Source": row.source, "Obligation": row.required,
      ...(row.condition === null ? {} : { "Condition": row.condition ?? "À préciser" }),
      ...(row.derivedFrom?.length ? { "Entrées du calcul": row.derivedFrom.join(", ") } : {}),
      ...(row.derivation ? { "Dérivation": row.derivation } : {}), "Contrôles": row.controls.join(" ; ") || "Contrôles à préciser",
      ...(row.analysisImpact === null ? {} : { "Impact analytique": row.analysisImpact ?? "À préciser" }),
      "Spécification": ({ ADOPTED_PROJECT: "Confirmée dans l’étude", DERIVED_FROM_PROJECT: "Déduite des décisions de l’étude", PROPOSED_FOR_REVIEW: "Proposition à confirmer", UNSPECIFIED: "À définir" })[row.specificationStatus] }),
  })) : [];
  // Collection controls are documentary fields, separate from canonical variables.
  // No response is prefilled and no patient/participant state is created here.
  const processFields: { title: string; module: string; fields: [string, string][] }[] = [];
  const process = (id: string, label: string, module: string, values: Record<string, string>) => {
    processFields.push({ title: `${id} — ${label}`, module, fields: Object.entries({
      "Module": module, ...values, "Spécification": "Contrôle du recueil ; hors inventaire scientifique canonique",
    }) });
  };
  if (doc.kind === "CRF") {
    if (criteria.length) {
      process("SCREENING_STATUS", "Issue de la présélection", "Présélection / éligibilité", {
        "Visite / moment": "Avant inclusion", "Définition": "Issue documentée de la vérification des critères adoptés.", "Type de données": "Catégoriel",
        "Modalités": "POTENTIALLY_ELIGIBLE — potentiellement éligible ; NOT_ELIGIBLE — non éligible ; TO_CONFIRM — à confirmer",
        "Origine": originLabels.SITE_RECORDED, "Source": "Formulaire interne de présélection", "Obligation": "Oui : à l’issue de la présélection",
        "Contrôles": "Toute incertitude conduit à TO_CONFIRM ; seuls les critères adoptés déterminent l’issue.",
        "Impact analytique": "Aucun : ne vaut ni inclusion ni appartenance à la population analysable.",
      });
      process("SCREENING_REASON", "Motif ou point à confirmer", "Présélection / éligibilité", {
        "Visite / moment": "Avant inclusion", "Définition": "Motif de non-éligibilité ou vérification nécessaire.", "Type de données": "Texte",
        "Origine": originLabels.SITE_RECORDED, "Source": "Formulaire interne de présélection", "Obligation": "Conditionnelle",
        "Condition": "SCREENING_STATUS = NOT_ELIGIBLE ou TO_CONFIRM", "Contrôles": "Motif concordant avec l’issue ; aucun critère nouveau.",
      });
    }
    if (consent.length) process("CONSENT_CONFIRMED", "Consentement vérifié", "Consentement", {
      "Visite / moment": "Avant les procédures de recherche", "Définition": "Confirmation du recueil du consentement selon le circuit institutionnel.",
      "Type de données": "Booléen", "Modalités": "yes — oui ; no — non", "Origine": originLabels.SITE_RECORDED,
      "Source": "Vérification du dossier de consentement", "Obligation": "Oui : avant toute procédure de recherche",
      "Contrôles": "Oui uniquement après vérification ; version/date et traçabilité institutionnelles à préciser.",
    });
    if (mri.length) process("MRI_PERFORMED", "IRM réalisée", "Acquisition IRM", {
      "Visite / moment": "Visite IRM prévue", "Définition": "Réalisation effective de l’examen ; ne préjuge pas de son évaluabilité.",
      "Type de données": "Booléen", "Modalités": "yes — oui ; no — non", "Origine": originLabels.SITE_RECORDED,
      "Source": "Compte rendu de réalisation de la visite", "Obligation": "Oui : lorsque l’issue de la visite est connue",
      "Contrôles": "Ne pas confondre examen réalisé et critère de jugement évaluable. Documenter toute non-réalisation.",
    });
    if (evaluability.length) process("ECV_EVALUABLE", "ECV évaluable", "Qualité / évaluabilité", {
      "Visite / moment": "Après contrôle des acquisitions et du résultat laboratoire", "Définition": "Évaluabilité selon les conditions adoptées, sans seuil supplémentaire.",
      "Type de données": "Booléen", "Modalités": "yes — oui ; no — non", "Origine": originLabels.IMAGING_READER_RECORDED,
      "Source": "Contrôle d’évaluabilité documenté et données sources", "Obligation": "Oui : après examen des éléments nécessaires",
      "Entrées du calcul": "T1 pré/post appariables ; hématocrite disponible ; cartes interprétables",
      "Contrôles": "Oui seulement si toutes les conditions adoptées sont vérifiées. Non-évaluabilité motivée ; une vérification en attente reste vide.",
      "Impact analytique": "Condition nécessaire à la population analysable principale.",
    });
    if (analytical.length && evaluability.length) {
      process("PRIMARY_ANALYSIS_ELIGIBLE", "Admissible à l’analyse principale", "Éligibilité à l’analyse", {
        "Visite / moment": "Après contrôle d’évaluabilité et lecture du LGE", "Définition": "Appartenance à la population analysable principale selon les décisions adoptées.",
        "Type de données": "Booléen", "Modalités": "yes — oui ; no — non", "Origine": originLabels.SITE_RECORDED,
        "Source": "Vérification du dossier inclus, de l’évaluabilité et de la lecture IRM", "Obligation": "Oui : une fois les contrôles nécessaires terminés",
        "Entrées du calcul": "Participant inclus ; ECV_EVALUABLE ; présence de LGE focal",
        "Dérivation": "Oui pour un participant inclus si ECV_EVALUABLE = yes et absence de LGE focal. Non si ECV non évaluable ou LGE focal. En attente si un contrôle nécessaire n’est pas terminé.",
        "Contrôles": "Ne pas coder une incertitude comme non. Conserver le participant et ses données en cas d’exclusion analytique.",
      });
      process("PRIMARY_ANALYSIS_EXCLUSION_REASON", "Motif de non-admissibilité analytique", "Éligibilité à l’analyse", {
        "Visite / moment": "Contrôle de la population analysable", "Définition": "Motif observé de non-admissibilité à l’analyse principale.", "Type de données": "Texte",
        "Origine": originLabels.SITE_RECORDED, "Source": "Contrôle d’évaluabilité et lecture IRM", "Obligation": "Conditionnelle",
        "Condition": "PRIMARY_ANALYSIS_ELIGIBLE = no", "Contrôles": "Distinguer LGE focal, non-évaluabilité et motif de non-réalisation ; ne supprimer aucune fiche.",
      });
    }
    process("STUDY_COMPLETION_STATUS", "Clôture du recueil individuel", "Clôture du recueil", {
      "Visite / moment": "Vérification finale du recueil", "Définition": "État administratif simple des données applicables et de leurs motifs d’absence.",
      "Type de données": "Catégoriel", "Modalités": "TO_COMPLETE — à compléter ; COLLECTION_COMPLETE — recueil vérifié",
      "Origine": originLabels.SITE_RECORDED, "Source": "Vérification finale par l’équipe", "Obligation": "Oui : à la clôture du recueil",
      "Contrôles": "Recueil vérifié si les éléments applicables, calculs et motifs sont documentés. Circuit et responsabilités institutionnels à préciser.",
      "Impact analytique": "Aucun : n’impose pas que le participant soit analysable et ne vaut pas validation scientifique.",
    });
  }
  const headers = ["Variable", "Module", "Origine", "Obligation"];
  const rows = dictionary.map(item => [item.title, item.module, item.origin, item.required]);
  const fieldHtml = (item: { title: string; fields: [string, string][] }, control: boolean) => `<article class="${control ? "process-field" : "scientific-field"}"><h3>${escapeHtml(item.title)}</h3>${control ? "<p class=field-kind>Contrôle du recueil</p>" : ""}<dl>${item.fields.map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`).join("")}</dl></article>`;
  const fieldMarkdown = (item: { title: string; fields: [string, string][] }) => [`### ${item.title}`, ...item.fields.map(([label, value]) => `- **${label}** : ${value}`)];
  const processModules = new Set(processFields.map(field => field.module));
  const introduction = doc.kind === "CRF" ? contentSections.filter(section => !processModules.has(section.title)
    && section.title !== "Sécurité IRM / éligibilité au contraste" && section.title !== "Éligibilité à l’analyse") : contentSections;
  const order = ["Présélection / éligibilité", "Consentement", "Démographie", "Anthropométrie", "Antécédents cardiovasculaires", "PA / HTA", "Diabète", "Tabac", "Sécurité IRM / éligibilité au contraste", "Laboratoire", "Acquisition IRM", "Lecture IRM", "Dérivation ECV", "Qualité / évaluabilité", "Éligibilité à l’analyse", "Clôture du recueil"];
  const modules = doc.kind === "CRF" ? [...new Set([...dictionary.map(item => item.module), ...processModules,
    ...contentSections.filter(section => !introduction.includes(section)).map(section => section.title)])]
    .sort((a, b) => (order.indexOf(a) < 0 ? order.length : order.indexOf(a)) - (order.indexOf(b) < 0 ? order.length : order.indexOf(b))) : [];
  const readability = "Les rubriques sans objet sont omises : unité, modalités prédéfinies, condition, entrées/calcul de dérivation et impact supplémentaire. Une saisie directe ne comporte pas de formule. Toute spécification inconnue reste indiquée à préciser. Les champs de contrôle ci-dessous sont distincts des variables scientifiques canoniques ; aucune réponse n’est préremplie et un contrôle en attente reste vide.";
  const dictionaryHtml = modules.map(module => `<section><h2>${escapeHtml(module)}</h2>${contentSections.filter(section => section.title === module).flatMap(section => section.paragraphs).map(value => `<p>${escapeHtml(value)}</p>`).join("")}${dictionary.filter(item => item.module === module).map(item => fieldHtml(item, false)).join("")}${processFields.filter(item => item.module === module).map(item => fieldHtml(item, true)).join("")}</section>`).join("");
  const title = polishDrciEditorialText(doc.title);
  const markdown = [`# ${title}`, "Version de travail pour revue humaine — validation scientifique et institutionnelle requise.",
    ...introduction.flatMap(section => [`## ${section.title}`, ...section.paragraphs]),
    ...(dictionary.length || processFields.length ? ["## Dictionnaire de collecte", readability,
      ...modules.flatMap(module => [`## ${module}`, ...contentSections.filter(section => section.title === module).flatMap(section => section.paragraphs),
        ...dictionary.filter(item => item.module === module).flatMap(fieldMarkdown), ...processFields.filter(item => item.module === module).flatMap(fieldMarkdown)])] : []),
    `## ${completionTitle}`, checklistNotice,
    ...(missing.length ? [...checklist].flatMap(([group, items]) => [`### ${group}`, ...items.map(value => `- ☐ ${value}`)])
      : ["Revue scientifique, réglementaire et institutionnelle requise."])].join("\n\n");
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>body{font:15px/1.6 Georgia,serif;color:#192c3a;max-width:960px;margin:32px auto;padding:0 24px}h1,h2,h3,dt{font-family:Arial,sans-serif}h1{line-height:1.2}h2{margin-top:1.7em}.dictionary-guide,.field-kind{font:12px/1.5 Arial,sans-serif;color:#455b6c}.internal-information{border-top:2px solid #c8d1d8;padding-top:12px}.open-checklist ul{list-style:none;padding-left:0}.open-checklist li{margin-bottom:8px}p{white-space:pre-line}table{border-collapse:collapse;font:12px/1.45 Arial,sans-serif;width:100%}td,th{border:1px solid #ccc;padding:8px;text-align:left;vertical-align:top}article{border-top:1px solid #c8d1d8;padding:12px 0;break-inside:avoid}dl{display:grid;grid-template-columns:165px 1fr;gap:6px 16px;font:13px/1.5 Arial,sans-serif}dt{font-weight:bold}dd{margin:0;overflow-wrap:anywhere}@media(max-width:600px){dl{grid-template-columns:1fr;gap:4px}dd{margin-bottom:8px}table{font-size:10px}}@media print{.internal-information{break-before:page}.open-checklist.internal-information{break-before:auto}body{margin:0;font-size:11pt;padding:0}h2,h3{break-after:avoid}article{break-inside:avoid}table{font-size:9pt}}</style></head><body><h1>${escapeHtml(title)}</h1><p>Version de travail pour revue humaine — validation scientifique et institutionnelle requise.</p>${introduction.map(section => `<section class="${doc.kind === "RECRUITMENT" ? /^A\. Information destinée aux candidats$/u.test(section.title) ? "candidate-information" : "internal-information" : "document-section"}"><h2>${escapeHtml(section.title)}</h2>${section.paragraphs.map(value => `<p>${escapeHtml(value)}</p>`).join("")}</section>`).join("")}${rows.length || processFields.length ? `<h2>Dictionnaire de collecte</h2><p class="dictionary-guide">${escapeHtml(readability)}</p><h3>Inventaire scientifique — ${rows.length} variables canoniques</h3><table><thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(value => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`).join("")}</tbody></table>${dictionaryHtml}` : ""}<section class="open-checklist${doc.kind === "RECRUITMENT" ? " internal-information" : ""}"><h2>${escapeHtml(completionTitle)}</h2><p>${escapeHtml(checklistNotice)}</p>${checklistHtml}</section></body></html>`;
  return { kind: doc.kind, title, markdown, html };
});

export const projectDrciDraftPackPortfolio = (portfolio: StudyDeliverablePortfolio, pack: DrciDraftPack, project: ResearchProjectOwnerProjection): StudyDeliverablePortfolio => {
  const current = isDrciDraftPackCurrent(pack, project);
  const documents = drciDraftPackFiles(pack).map((doc): StudyDeliverableArtifact => ({ artifactId: `drci-document:${logicalDigest([pack.packDigest, doc.kind])}`,
    artifactVersion: "1.0.0", kind: doc.kind, sourceProject: pack.project, name: doc.title, status: current ? "PARTIAL" : "STALE", preview: current ? "Version rédigée pour revue humaine" : "À actualiser — version antérieure du projet",
    files: [{ fileName: `${doc.kind.toLowerCase()}.html`, format: "HTML", mimeType: "text/html;charset=utf-8", content: doc.html },
      { fileName: `${doc.kind.toLowerCase()}.md`, format: "MARKDOWN", mimeType: "text/markdown;charset=utf-8", content: doc.markdown }],
    sourceObjectRefs: pack.sourceFacts.map(item => item.ref), canonicalVariableRefs: pack.crfRows.map(row => row.variableRef),
    missingDecisions: pack.documents.find(item => item.kind === doc.kind)!.missingElements,
    limitations: [current ? "Rédaction candidate, revue humaine requise" : "STALE", "Ni autorisation d'exécution ni validation réglementaire"] }));
  const artifacts = [...documents, ...portfolio.artifacts.filter(item => !DRCI_DOCUMENT_KINDS.includes(item.kind as typeof DRCI_DOCUMENT_KINDS[number]))];
  const portfolioId = `study-deliverable-portfolio:${logicalDigest([portfolio.portfolioId, pack.packDigest, current])}`;
  return { ...portfolio, portfolioId, artifacts, manifest: { ...portfolio.manifest, portfolioId, artifacts: artifacts.map(item => ({ artifactId: item.artifactId,
    artifactVersion: item.artifactVersion, kind: item.kind, sourceProject: item.sourceProject, status: item.status, files: item.files.map(file => ({ fileName: file.fileName, format: file.format, mimeType: file.mimeType })),
    sourceObjectRefs: item.sourceObjectRefs, canonicalVariableRefs: item.canonicalVariableRefs })) } };
};
