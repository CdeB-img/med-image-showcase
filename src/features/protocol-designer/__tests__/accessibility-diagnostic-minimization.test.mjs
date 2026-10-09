import {describe,expect,it} from 'vitest';
import {projectAccessibilityDiagnostics} from '../../../../validation/final-preview-user-test/accessibility-diagnostics.mjs';

describe('bounded accessibility diagnostics, not document retention', () => {
  it('preserves useful control and failure observations without any scientific text or credential', () => {
    const privateBody='PRIVATE_SCIENTIFIC_PARAGRAPH_123';
    const proof='PRIVATE_ACCESS_PROOF_456';
    const result=projectAccessibilityDiagnostics(`1 bouton Documents\n2 bouton Retour aux documents\n3 bouton Enregistrer\n4 zone de saisie de texte (settable) Value: ${privateBody}\n5 texte ${proof}\n6 bouton d'activation/de désactivation Comparer, Value: 1\n7 texte ✓ Enregistré`);
    expect(result.controls.Documents).toBe(1);
    expect(result.studioOpen).toBe(true);expect(result.compareActive).toBe(true);
    expect(result.saveConfirmed).toBe(true);expect(result.editableControlCount).toBe(1);
    expect(JSON.stringify(result)).not.toContain(privateBody);expect(JSON.stringify(result)).not.toContain(proof);
  });
  it('does not treat private labels or textbox values as exact UI controls', () => {
    const result=projectAccessibilityDiagnostics('1 bouton Enregistrer PRIVATE_BODY\n2 zone de saisie de texte Value: Documents\n3 texte PRIVATE_TITLE');
    expect(result.controls.Enregistrer).toBeNull();expect(result.controls.Documents).toBeNull();
    expect(JSON.stringify(result)).not.toContain('PRIVATE');
  });
  it('returns explicit failure observations, never false success', () => {
    const result=projectAccessibilityDiagnostics('1 texte Historique non chargé. Les versions archivées restent conservées.\n2 texte La liste des brouillons n’a pas pu être chargée.');
    expect(result.historyFailed).toBe(true);expect(result.revisionListFailed).toBe(true);expect(result.saveConfirmed).toBe(false);
  });
});
