/** Diagnostic-only projection. Never retain AX text, editable values, document
 * titles, private paragraph text, console input/output or access proofs.
 * Obtain AX with emit:false. Do not capture a Studio/document screenshot.
 * An unknown UI label stays unknown: do not dump raw state as a fallback. */
export const projectAccessibilityDiagnostics = snapshot => {
  if (typeof snapshot !== 'string') throw new TypeError('ACCESSIBILITY_SNAPSHOT_REQUIRED');
  const labels = ['Conception', 'Documents', 'Retour aux documents', 'Enregistrer'];
  const controls = Object.fromEntries(labels.map(label => {
    const line = snapshot.split('\n').find(value => value.trim().match(/^\d+ bouton /u)
      && value.trim().replace(/^\d+ bouton /u, '') === label);
    return [label, line ? Number(line.trim().match(/^\d+/u)[0]) : null];
  }));
  return {
    controls,
    studioOpen: controls['Retour aux documents'] !== null,
    documentsOpen: /\bcontainer Portefeuille documentaire$/mu.test(snapshot),
    compareActive: /bouton d'activation\/de désactivation Comparer, Value: 1$/mu.test(snapshot),
    saveConfirmed: /texte ✓ Enregistré$/mu.test(snapshot),
    historyFailed: snapshot.includes('Historique non chargé. Les versions archivées restent conservées.'),
    revisionListFailed: snapshot.includes('La liste des brouillons n’a pas pu être chargée.'),
    editableControlCount: snapshot.split('\n').filter(line => /^\s*\d+ zone de saisie de texte\b/u.test(line)).length,
  };
};
