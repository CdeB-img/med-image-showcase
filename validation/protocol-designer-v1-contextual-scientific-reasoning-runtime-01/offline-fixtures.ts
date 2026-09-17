// LOCAL_SYNTHETIC semantic outputs. No live scientific quality claim.
import { validatePersistentProjectDelta, contributionFromPersistentDelta, type ProductBridgeRequest } from '../../src/features/protocol-designer/product-bridge';
import { prepareStandardContextualReasoningRequest } from '../../src/features/scientific-thinking/contextual-reasoning-input';
import { acceptContextualReasoningContribution, type ContextualReasoningProviderOutput, type ContextualReasoningRequest } from '../../src/features/scientific-thinking/contextual-reasoning';
import { buildPreProjectScientificThinkingIntervention } from '../../src/features/protocol-designer/functional-reset/scientific-thinking-standard';
import { buildPreProjectNavigationDecision, realizePreProjectNavigationDecision } from '../../src/features/query-navigation/pre-project-navigation';
import { routeProductEntry } from '../../src/features/protocol-designer/functional-reset/product-entry-routing';
import type { ScientificInterpretationTurn } from '../../src/features/scientific-interpretation/contracts';
export const CASES = [
 {id:'A-IDM',text:"je veux faire une étude de l'infarctus a l'irm",explicit:[['CONDITION','infarctus'],['IMAGING_MODALITY','irm']], dimensions:[['IMAGING','fonction myocardique'],['IMAGING','timing de l’IRM'],['IMAGING','caractérisation myocardique'],['SCIENTIFIC_THINKING','âge et sexe pour décrire la cohorte'],['SCIENTIFIC_THINKING','antécédents cardiovasculaires pertinents'],['SCIENTIFIC_THINKING','contexte thérapeutique et reperfusion'],['SCIENTIFIC_THINKING','biomarqueurs biologiques selon le contexte aigu']]},
 {id:'B-AVC',text:'je veux étudier un AVC aigu en imagerie',explicit:[['CONDITION','AVC aigu'],['IMAGING_MODALITY','imagerie']],dimensions:[['IMAGING','temporalité de l’imagerie par rapport au début clinique'],['IMAGING','atteinte tissulaire et perfusion selon la finalité'],['SCIENTIFIC_THINKING','état neurologique initial et prise en charge']]},
 {id:'C-FIBROSIS',text:'je veux étudier la fibrose myocardique chez des patients diabétiques',explicit:[['PHENOMENON','fibrose myocardique'],['POPULATION','patients diabétiques']],dimensions:[['SCIENTIFIC_THINKING','propriété tissulaire à caractériser'],['SCIENTIFIC_THINKING','contexte métabolique et facteurs de confusion'],['SCIENTIFIC_THINKING','définition de la population diabétique']]},
 {id:'D-THROMBUS',text:'je veux comparer IRM et échographie pour le thrombus après IDM',explicit:[['IMAGING_MODALITY','IRM'],['IMAGING_MODALITY','échographie'],['PHENOMENON','thrombus'],['CONDITION','IDM']],dimensions:[['IMAGING','comparabilité du timing et des conditions de lecture'],['IMAGING','définition de la cible diagnostique et référence'],['STUDY_DESIGN','comparaison appariée ou indépendante à discuter']]},
 {id:'E-CEC',text:'je voudrais voir si la CEC laisse des dommages sur le coeur',explicit:[['EXPOSURE','CEC'],['PHENOMENON','dommages sur le coeur']],dimensions:[['SCIENTIFIC_THINKING','état cardiaque initial et temporalité'],['SCIENTIFIC_THINKING','nature du dommage et moyens d’observation à discuter'],['STUDY_DESIGN','séparation des effets de la prise en charge et de l’exposition']]},
 {id:'F-COHORT',text:'je veux étudier les hospitalisations dans une cohorte observationnelle d’adultes',explicit:[['PHENOMENON','hospitalisations'],['POPULATION','adultes']],dimensions:[['STUDY_DESIGN','définition et ascertainment des événements'],['STUDY_DESIGN','durée de suivi et données manquantes'],['SCIENTIFIC_THINKING','facteurs de confusion et caractéristiques initiales']]},
] as const;
export const turn = (text:string,id='u1'):ScientificInterpretationTurn=>({turnId:id,role:'USER',content:text,createdAt:'2026-09-17T10:00:00Z'});
export const wire = (text:string, explicit:readonly (readonly string[])[]) => ({changes:explicit.map(([proposedType,content],i)=>({operation:'ADD',candidateRef:'fixture:'+i,proposedType,content,sourceText:text,polarity:'AFFIRMED',epistemicStatus:'EXPLICIT_USER_STATED',epistemicState:'KNOWN',assertionKind:'USER_STATED',evidenceRefs:[]})),relations:[],temporalQualifications:[],expectedVariableOccasions:[]});
export const makeContext = (text=CASES[0].text as string, explicit:readonly (readonly string[])[]=CASES[0].explicit, prior:ScientificInterpretationTurn[]=[])=>{
 const current=turn(text,prior.length?'u2':'u1'); const conversation={conversationId:'offline:ctx',language:'fr' as const,turns:[...prior,current]};
 const checked=validatePersistentProjectDelta(wire(text,explicit),text,null,conversation);
 if(!checked.validation.valid)throw new Error(JSON.stringify(checked.validation));
 const contribution=contributionFromPersistentDelta({candidate:checked.candidate!,conversation,currentProject:null,createdAt:current.createdAt!})!;
 const prepared=prepareStandardContextualReasoningRequest({contribution,turns:conversation.turns,sessionId:'offline:session'})!;
 return {text,current,conversation,contribution,checked,...prepared};
};
export const semanticFixture = (request:ContextualReasoningRequest, dims:readonly (readonly string[])[]=CASES[0].dimensions):ContextualReasoningProviderOutput=>({
 contract:'SCIENTIFIC_THINKING_CONTEXTUAL_PROPOSALS_1',requestRef:request.requestRef,contextDigest:request.contextDigest,
 candidates:dims.map(([owner,dimension],i)=>({ref:'p:'+i,owner:owner as 'IMAGING'|'SCIENTIFIC_THINKING'|'STUDY_DESIGN',dimension,
 scientificRole:'Dimension à discuter, sans rôle Project',rationale:'Piste contextualisée locale/synthétique ; non étayée documentairement.',
 stage:i===3?'REPORTING':'DESIGN',force:i===3?'NEAR_NECESSARY':'HIGH_VALUE_CONTEXTUAL',relevance:'HIGH',dependencyImpact:i<3?'BRANCH_STRUCTURING':'LOCAL',
 applicability:'APPLICABLE',basis:'GENERAL_EXPERT_REASONING',triggerRefs:[request.sourceTurnRef],requiredResourceRefs:[],requiredIntentRefs:[],conflictFactRefs:[],requiresNewCollection:false,statementRefs:[],conceptRef:null,value:null,projectRole:null})),
 facts:[],questions:[{ref:'q:finality',text:'Souhaitez-vous caractériser un état, comparer des prises en charge ou étudier une évolution ?',rationale:'Finalité encore à préciser.',decisionImpact:'Change les branches mesure, design et analyse.',dimensionRefs:['p:0'],affectedBranches:['FINALITY','MEASUREMENT','DESIGN'],asksAboutFactRefs:[]}],projectWriteAuthorized:false,candidateIsAdopted:false,
});
export const realize = (context:ReturnType<typeof makeContext>,output=semanticFixture(context.request))=>{
 const receipt=acceptContextualReasoningContribution({request:context.request,output,production:{provider:'LOCAL_SYNTHETIC',model:'NO_PROVIDER',responseId:null,mode:'LOCAL_SYNTHETIC'}});
 const st=buildPreProjectScientificThinkingIntervention({contribution:context.contribution,sessionId:'offline:session',sourceJourney:'DESIGN_STUDY',reasoning:receipt,conversationTurns:context.conversation.turns})!;
 const routing=routeProductEntry({raw:context.text,sourceTurnRef:context.current.turnId,routedAt:'2026-09-17T10:00:01Z'});
 const decision=buildPreProjectNavigationDecision({routing,scientificContributions:st.navigationContributions,contextualUnderstanding:st.contextualUnderstanding,sourceText:context.text});
 return {receipt,st,decision,visible:realizePreProjectNavigationDecision({decision}).assistantReply};
};
export const bridgeRequest = (text=CASES[0].text as string):ProductBridgeRequest=>{
 const t=turn(text); const routing=routeProductEntry({raw:text,sourceTurnRef:t.turnId,routedAt:t.createdAt!});
 return {apiVersion:'1.0.0',conversation:{conversationId:'offline:bridge',language:'fr',turns:[t]},currentProject:null,evaluatePersistentDelta:true,preProjectNavigation:buildPreProjectNavigationDecision({routing})};
};
