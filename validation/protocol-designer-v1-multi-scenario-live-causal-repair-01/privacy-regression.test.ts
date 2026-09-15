import {expect,it} from 'vitest';
import {detectSensitiveData} from '../../src/features/protocol-designer/intake/privacy';
import {routeProductEntry} from '../../src/features/protocol-designer/functional-reset/product-entry-routing';
const accepted = [
 'une étude sur un panel de patient pour voir les lésions', 'un dossier fictif pour une étude scientifique',
 'une population de patients sans identité', 'Le patient présente une inflammation dans ce scénario synthétique.',
 'Groupe 1234, bras A, dose 1000 mg pendant 2026 jours', 'Numéro scientifique NX-PERIPH-01, molécule fictive',
 'Étudier le patient avant et après chirurgie', 'dossier scientifique', 'patient pour une IRM',
 'patient sous traitement', 'patient dans un groupe', 'dossier de recherche',
];
it.each(accepted)('accepts non-identifying scientific text: %s', text => expect(detectSensitiveData(text)).toEqual([]));
const blocked: [string,string][] = [
 ['patient Jean Dupont','IDENTIFIABLE_CASE'], ['Mme Jeanne Dupont','IDENTIFIABLE_CASE'],
 ['dossier n° 12345678','PATIENT_IDENTIFIER'], ['dossier: ABCD','PATIENT_IDENTIFIER'],
 ['dossier AB1234','PATIENT_IDENTIFIER'], ['patient id 12345678','PATIENT_IDENTIFIER'],
 ['patient # ABCD','PATIENT_IDENTIFIER'], ['patient AB1234','PATIENT_IDENTIFIER'],
 ['id patient ABCD','PATIENT_IDENTIFIER'], ['IPP: 12345678','PATIENT_IDENTIFIER'],
 ['MRN 12345678','PATIENT_IDENTIFIER'], ['hospital id ABCD','PATIENT_IDENTIFIER'],
 ['identifiant patient AB1234','PATIENT_IDENTIFIER'], ['patient numéro ABCD','PATIENT_IDENTIFIER'],
 ['patient - AB1234','PATIENT_IDENTIFIER'], ['dossier - 12345678','PATIENT_IDENTIFIER'], ['patient=AB1234','PATIENT_IDENTIFIER'], ['14 rue des Lilas','POSTAL_ADDRESS'],
 ['jean.dupont@example.org','EMAIL'], ['06 12 34 56 78','PHONE'],
 ['né le 14/09/1970','DATE_OF_BIRTH'],
];
it.each(blocked)('continues blocking %s', (text,code) => {
 for(const prefix of ['', 'Dossier fictif : ', 'Toutes les données sont synthétiques : ']){
  const raw=prefix+text;
  expect(detectSensitiveData(raw)).toContainEqual({code});
  expect(routeProductEntry({raw,sourceTurnRef:'privacy-test',routedAt:'2026-09-15T12:00:00Z'}).domainGate).toBe('OUT_OF_SCOPE');
 }
});
it('preserves compact identifiers across case and delimiters', () => {
 for(const marker of ['IPP','mrn','Id patient','hospital ID','patient id','dossier numéro'])
 for(const delimiter of [' ',': ',' # ',' = '])
 for(const value of ['ABCD','123456','Ab12-34'])
 expect(detectSensitiveData(`${marker}${delimiter}${value}`)).toContainEqual({code:'PATIENT_IDENTIFIER'});
});
