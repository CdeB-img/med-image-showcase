# Audit SEO et autorite editoriale - etat initial

Date de travail : 2026-07-12  
Perimetre : audit local du depot. Aucune source externe, statistique Search Console ou reference bibliographique n'est inferee dans ce document.

## Methode

L'inventaire ci-dessous provient des routes declarees dans `src/App.tsx`, des composants de page, du sitemap, de `robots.txt`, du menu et des donnees de projets. Il sert de ligne de base avant les lots de modifications. Les routes de redirection ne sont pas des pages canoniques et ne doivent pas figurer dans le sitemap.

## Inventaire des routes canoniques

| Route | Fichier | Intention principale | Cluster | Page pilier | Risque de cannibalisation | Action retenue |
|---|---|---|---|---|---|---|
| `/` | `src/pages/Index.tsx` | Positionnement consultant / imagerie quantitative | Offre et identite | Oui, racine | Faible | Clarifier l'offre sans concurrencer les pages d'expertise |
| `/expertise` | `src/pages/Expertise.tsx` | Orienter vers les domaines d'expertise | Offre et identite | Oui, hub global | Faible | Conserver comme hub, renforcer les transitions vers les hubs thematiques |
| `/prestations-imagerie-medicale` | `src/pages/Prestations.tsx` | Cadrer une mission de conseil / Core Lab | Offre et identite | Oui, conversion | Faible | Relier chaque prestation a une preuve ou une expertise |
| `/projets` | `src/pages/Projects.tsx` | Presenter les demonstrations et cas de travail | Projets | Oui, hub projets | Faible | Relier chaque projet a son domaine methodologique |
| `/projet/perfusion-segmentation` | `src/pages/ProjectDetail.tsx` | Demonstration de segmentation perfusionnelle | Projets / neuro | Satellite | Faible | Ajouter contexte, limites et liens neuro explicites |
| `/projet/neuro-onco` | `src/pages/ProjectDetail.tsx` | Demonstration neuro-oncologique | Projets / traitement image | Satellite | Faible | Ajouter contexte, limites et liens segmentation / recalage |
| `/projet/recalage` | `src/pages/ProjectDetail.tsx` | Demonstration de recalage | Projets / traitement image | Satellite | Faible | Relier a recalage multimodal et DICOM |
| `/projet/cardiac` | `src/pages/ProjectDetail.tsx` | Demonstration IRM cardiaque | Projets / IRM cardiaque | Satellite | Faible | Relier a ECV, biomarqueurs et Core Lab |
| `/projet/ct-scan` | `src/pages/ProjectDetail.tsx` | Demonstration CT | Projets / CT | Satellite | Moyen avec CT quantitatif | Preciser le cas et le rattachement CT sans viser le meme besoin |
| `/projet/outils` | `src/pages/ProjectDetail.tsx` | Demonstration d'outils metier | Projets / ingenierie | Satellite | Faible | Documenter statut de demonstration et liens ingenierie |
| `/contact` | `src/pages/Contact.tsx` | Demande de contact qualifiee | Offre et identite | Conversion | Faible | Preserver une entree directe et les signaux de cadrage |
| `/a-propos` | `src/pages/APropos.tsx` | Identifier l'auteur et le parcours | Offre et identite | Oui, preuve | Faible | Consolider les preuves publiques sans en faire un CV exhaustif |
| `/references-publications` | `src/pages/ReferencesPublications.tsx` | Rassembler publications et contributions | Offre et identite | Preuve | Faible | Verifier l'attribution, les DOI et les roles publies |
| `/quantification-tissulaire` | `src/pages/QuantificationTissulaire.tsx` | Hub de biomarqueurs tissulaires IRM / CT | IRM cardiaque et CT quantitatif | Oui | Moyen avec IRM/CT quantitative | Stabiliser son role de hub transversal, non concurrent d'une modalite |
| `/irm-imagerie-quantitative` | `src/pages/IRMImagerieQuantitative.tsx` | Hub IRM quantitative cardio-neuro | IRM quantitative | Oui | Moyen avec quantification tissulaire | Distinguer acquisition / mesure IRM des pages de biomarqueurs specialises |
| `/ct-imagerie-quantitative` | `src/pages/CTImagerieQuantitative.tsx` | Hub CT quantitatif multicentrique | CT quantitatif | Oui | Moyen avec quantification CT | Distinguer cadre global CT de la page de mesures et de calibration |
| `/quantification-ct` | `src/pages/QuantificationCT.tsx` | Mesures HU, calibration et quantification CT | CT quantitatif | Satellite | Moyen avec CT quantitative | Ancrer sur la mesure physique et renvoyer au hub CT |
| `/ct-quantitatif-avance-imagerie-spectrale` | `src/pages/CTQuantitatifAvance.tsx` | Hub CT spectral avance | CT spectral | Oui | Moyen avec principe spectral | Conserver l'angle avance / validation et piloter les satellites |
| `/scanner-double-energie` | `src/pages/ScannerDoubleEnergie.tsx` | Comparer double energie et CT conventionnel | CT spectral | Satellite | Faible | Cibler DECT et renvoyer au hub spectral |
| `/scanner-comptage-photon` | `src/pages/ScannerComptagePhoton.tsx` | Expliquer le SPCCT et ses usages | CT spectral | Satellite | Faible | Cibler SPCCT, K-edge et quantification sans concurrencer le hub |
| `/scanner-spectral-principe` | `src/pages/ScannerSpectralPrincipe.tsx` | Expliquer les principes physiques du spectral | CT spectral | Satellite | Moyen avec CT spectral avance | Rester sur la pedagogie physique et renvoyer au hub |
| `/ct-perfusion-quantitative-avc` | `src/pages/CTPerfusionQuantitative.tsx` | CT perfusion en AVC et endpoints | Neuro-imagerie quantitative | Satellite | Faible | Relier au hub perfusion cerebrale et aux limites de modele |
| `/perfusion-cerebrale` | `src/pages/PerfusionCerebrale.tsx` | Hub hemodynamique IRM / CT | Neuro-imagerie quantitative | Oui | Moyen avec perfusion hemodynamique | Distinguer le hub modalites du detail des cartes hemodynamiques |
| `/perfusion-hemodynamique-neuro-imagerie` | `src/pages/PerfusionHemodynamiqueNeuro.tsx` | CBF, CBV, Tmax et cartes de perfusion | Neuro-imagerie quantitative | Satellite | Moyen avec perfusion cerebrale | Ancrer sur les mesures et leurs conditions de validite |
| `/metabolisme-cerebral` | `src/pages/MetabolismeCerebral.tsx` | Hub OEF, CMRO2 et viabilite | Neuro-imagerie quantitative | Oui | Moyen avec perfusion metabolique | Distinguer hub physiopathologique et pipeline specifique |
| `/perfusion-metabolique-neuro-imagerie` | `src/pages/PerfusionMetaboliqueNeuro.tsx` | Pipeline OEF / CMRO2 en AVC | Neuro-imagerie quantitative | Satellite | Moyen avec metabolisme cerebral | Ancrer sur l'interpretation combinee et les limites du pipeline |
| `/cmro2-imagerie-cerebrale` | `src/pages/CMRO2Imagerie.tsx` | Definir et interpreter le CMRO2 | Neuro-imagerie quantitative | Satellite | Faible | Cibler CMRO2 et renvoyer vers OEF / metabolisme |
| `/oef-imagerie-cerebrale` | `src/pages/OEFImagerie.tsx` | Definir et interpreter l'OEF | Neuro-imagerie quantitative | Satellite | Faible | Cibler OEF et renvoyer vers CMRO2 / metabolisme |
| `/corelab-essais-cliniques` | `src/pages/CorelabEC.tsx` | Core Lab et endpoints d'essais | Core Lab et recherche clinique | Oui | Faible | Conserver comme pilier d'organisation et de decision d'essai |
| `/biomarqueurs-irm-cardiaque-essais-cliniques` | `src/pages/BiomarqueursIRMCardiaqueEssais.tsx` | Endpoints cardiaques en essai | IRM cardiaque / Core Lab | Satellite | Faible | Rattacher explicitement au Core Lab et a l'IRM cardiaque |
| `/ecv-mapping-t1-t2-irm-cardiaque` | `src/pages/ECVMappingCardiaque.tsx` | ECV et mapping tissulaire cardiaque | IRM cardiaque | Satellite | Faible | Cibler ECV/T1/T2 et faire remonter vers Core Lab / IRM |
| `/methodologie-imagerie-quantitative` | `src/pages/MethodologieImagerieQuantitative.tsx` | Cadre de standardisation et validation | Methodologie / Core Lab | Oui | Moyen avec ingenierie quantitative | Distinguer principes de validation et implementation de pipeline |
| `/ingenierie-imagerie-quantitative` | `src/pages/IngenierieImagerieQuantitative.tsx` | Conception de pipelines robustes | Ingenierie et traitement d'image | Oui | Moyen avec methodologie | Centrer sur l'implementation, le versioning et les livrables |
| `/analyse-dicom` | `src/pages/AnalyseDICOM.tsx` | Audit et preparation DICOM | Ingenierie et traitement d'image | Satellite | Faible | Rattacher aux pipelines et au QA amont |
| `/bases-multicentriques` | `src/pages/BasesMulticentriques.tsx` | Harmonisation de bases | Core Lab et recherche clinique | Satellite | Faible | Rattacher aux contraintes multicentriques et endpoints |
| `/recalage-multimodal` | `src/pages/RecalageMultimodal.tsx` | Alignement geometrique multimodal | Ingenierie et traitement d'image | Satellite | Faible | Rattacher a l'analyse DICOM, au QA et aux projets concernes |
| `/segmentation-irm` | `src/pages/SegmentationIRM.tsx` | Segmentation IRM cardio-neuro | IRM quantitative | Satellite | Faible | Rattacher a l'IRM, au Core Lab et aux contraintes de mesure |

## Routes non canoniques a conserver uniquement comme redirections

| Route | Cible canonique | Statut attendu |
|---|---|---|
| `/corelabirm` | `/corelab-essais-cliniques` | Redirection historique, exclue du sitemap |
| `/cmro2` | `/cmro2-imagerie-cerebrale` | Redirection courte, exclue du sitemap |
| `/oef` | `/oef-imagerie-cerebrale` | Redirection courte, exclue du sitemap |
| `/perfusion-hemodynamique` | `/perfusion-hemodynamique-neuro-imagerie` | Redirection courte, exclue du sitemap |
| `/perfusion-metabolique-neuro-imagerie/CMRO2Imagerie` | `/cmro2-imagerie-cerebrale` | URL historique avec casse, exclue du sitemap |
| `/perfusion-metabolique-neuro-imagerie/OEFImagerie` | `/oef-imagerie-cerebrale` | URL historique avec casse, exclue du sitemap |

## Etat des clusters

| Cluster | Pilier | Satellites principaux | Etat initial |
|---|---|---|---|
| CT spectral | `/ct-quantitatif-avance-imagerie-spectrale` | double energie, SPCCT, principe spectral | Hierarchie claire. Vigilance sur la distinction principe / applications / validation. |
| CT quantitatif | `/ct-imagerie-quantitative` | quantification CT, CT perfusion, spectral | Deux pages proches (`ct-imagerie-quantitative` et `quantification-ct`) doivent garder une intention distincte. |
| Neuro-imagerie quantitative | `/perfusion-cerebrale`, `/metabolisme-cerebral` | perfusion hemodynamique, perfusion metabolique, OEF, CMRO2, CT perfusion | Deux hubs complementaires. Le maillage doit toujours separer hemodynamique et metabolisme. |
| IRM cardiaque | `/irm-imagerie-quantitative` et `/corelab-essais-cliniques` | ECV/T1/T2, biomarqueurs cardiaques, segmentation | Bon noyau. A expliciter entre expertise IRM et lecture centralisee d'essai. |
| Core Lab / multicentrique | `/corelab-essais-cliniques`, `/methodologie-imagerie-quantitative` | bases multicentriques, DICOM, ingenierie | Roles voisins mais defensables : essais / principes / implementation. |
| Ingenierie et traitement d'image | `/ingenierie-imagerie-quantitative` | DICOM, recalage, segmentation | Structure claire, liaison projets a renforcer. |
| Offre et identite | `/`, `/expertise`, `/prestations-imagerie-medicale` | projets, a propos, contact, references | Pages de conversion et de preuve presentes; coherence a verifier au premier ecran. |

## Inventaire technique initial

- Toutes les pages canoniques declarees dans `src/App.tsx` ont un emplacement correspondant dans `public/sitemap.xml` a verifier automatiquement au lot 1.
- Les pages utilisent majoritairement `Helmet`, un canonical et un `BreadcrumbList` local. Les H1 sont le plus souvent rendus par `ExpertiseHero`, ce qui doit etre inclus dans les tests plutot que cherche uniquement dans le JSX de chaque page.
- `GlobalEntitySchema.tsx` porte deja `Organization`, `Person` et `WebSite`, avec ORCID, LinkedIn et affiliations deja publiees. Ces donnees doivent etre centralisees dans une source unique sans changer les informations factuelles.
- Les FAQ visibles sont utiles sur plusieurs pages. En revanche, le schema `FAQPage` est present de facon quasi systematique : le lot 1 doit supprimer seulement les occurrences redondantes ou purement SEO, jamais la FAQ visible par defaut.
- Le sitemap ne doit contenir que les URLs canoniques minuscules. Les redirections historiques ci-dessus restent necessaires pour eviter les 404 mais ne sont pas indexables.
- `robots.txt` autorise l'exploration et declare le sitemap. Aucune balise `noindex` globale n'est visible dans la configuration initiale.

## Maillage initial observe

- Les hubs historiques (`/irm-imagerie-quantitative`, `/ct-imagerie-quantitative`, `/methodologie-imagerie-quantitative`) recoivent beaucoup de liens internes.
- Les nouveaux hubs `/quantification-tissulaire`, `/perfusion-cerebrale` et `/metabolisme-cerebral` recoivent nettement moins de liens internes : leur role de pilier doit etre renforce par des liens contextuels, sans ajouter de listes identiques partout.
- Les satellites CT spectral sont correctement relies au pilier. Il faut verifier que chaque projet CT renvoie aussi vers l'expertise CT pertinente.
- Les pages projet partagent un composant de detail. Ce composant doit construire des liens adaptes au projet, plutot qu'une meme liste generique pour tous les projets.

## Risques et actions priorises

1. **Infrastructure de preuve et de coherence** : centraliser l'identite, verifier canonical/sitemap/routes et creer un audit local automatise.
2. **Cannibalisation CT** : rendre explicite la difference entre `CT quantitatif` (hub modalite) et `Quantification CT` (mesure, HU, calibration).
3. **Double hub neuro** : garder `/perfusion-cerebrale` pour les mesures hemodynamiques et `/metabolisme-cerebral` pour l'interpretation OEF/CMRO2; chaque satellite doit remonter vers le bon hub.
4. **FAQPage** : retirer le balisage non necessaire apres verification page par page, en preservant les questions visibles de valeur.
5. **Projets** : renforcer probleme, methode, contribution, limites et statut de demonstration uniquement a partir des donnees deja presentes.
6. **Images** : inventaire des `alt`, dimensions et legende a automatiser. Les visuels existants doivent etre decrits comme demonstrations ou donnees anonymisees lorsqu'il y a lieu.

## Actions non realisees a ce stade

- Aucun title, meta description, H1, JSON-LD, lien interne ou contenu de page n'a ete modifie.
- Aucune reference scientifique, DOI, publication, collaboration, qualification ou chiffre n'a ete ajoute sans source locale verifiable.
- Aucun changement de route ou de redirection n'a ete effectue.

## Prochaine etape : lot 1

1. Creer la source unique `siteIdentity` a partir des donnees deja publiees.
2. Ajouter des helpers pour canonical, breadcrumb et JSON-LD strictement adaptes aux contenus.
3. Creer un audit local des routes, metas, H1, liens internes, canonicals, sitemap et schemas.
4. Corriger uniquement les anomalies techniques effectivement detectees.

## Journal d'execution

### Lot 1 - infrastructure et donnees structurees

- Ajout de `src/config/siteIdentity.ts` : nom, URL, email, logo existant, ORCID et LinkedIn deja publics.
- Ajout de `src/lib/structuredData.ts` : references `Organization` / `Person`, `WebSite` et `BreadcrumbList` reutilisables.
- `GlobalEntitySchema` utilise maintenant cette source unique. Les affiliations institutionnelles non qualifiees comme actuelles ont ete retirees du JSON-LD global : elles restent a documenter dans le contenu lorsqu'elles sont utiles, sans etre presentees comme affiliations presentes.
- `Footer`, `Contact` et `A propos` reutilisent les donnees centrales pertinentes.
- Ajout de `scripts/audit-seo-pages.mjs` et de `src/__tests__/seo-pages-contract.test.ts`.
- Retrait de l'emission automatique du schema `FAQPage` sur 26 pages. Les FAQ visibles sont conservees.
- Resultat local apres lot : 37 pages canoniques, 6 redirections historiques, 0 erreur et 0 avertissement dans l'audit SEO local.

### Lot 2 - identite, accueil et prestations

- Le premier ecran de l'accueil precise maintenant le role : consultant en imagerie quantitative, IRM/CT, Core Lab, biomarqueurs et pipelines multicentriques.
- Les CTA de l'accueil orientent vers les prestations et l'expertise, avant les demonstrations.
- Les paragraphes institutionnels ajoutent des liens contextuels vers Core Lab, methodologie et ingenierie.
- Les quatre offres de la page Prestations renvoient vers les pages de preuve correspondantes : Core Lab, DICOM, bases multicentriques et ingenierie.
- La page References & publications emploie des intitules francais coherents dans le fil d'Ariane et le hero.

### Lot 3 - cluster CT spectral

- Creation de `AuthorExpertiseBlock` et premiere utilisation sur le pilier CT spectral avance. Le bloc identifie le parcours publie sans revendiquer de relecture clinique, de certification ou de validation tierce.
- `/ct-quantitatif-avance-imagerie-spectrale` precise desormais le niveau de decision : comparaison entre lots, centres ou bras d'etude, avec domaine de validite a documenter.
- `/scanner-double-energie` explicite son statut clinique et renvoie contextuellement vers le principe spectral.
- Les sections sans bibliographie nommee ont ete renommees en exigences ou conditions de validation sur CT spectral, DECT et principe spectral. Aucune reference generique n'est presentee comme source citee.
- `/ct-imagerie-quantitative` renvoie dans son texte vers la mesure HU et le pilier spectral. Un lien errone depuis `Quantification CT` vers une page IRM a ete corrige vers `/ct-perfusion-quantitative-avc`.

### Lot 4 - cluster neuro-imagerie quantitative

- Les hubs `/perfusion-cerebrale` et `/metabolisme-cerebral` sont conserves comme points d'entree distincts : le premier organise les mesures hemodynamiques, le second la lecture OEF/CMRO2 et la viabilite tissulaire.
- Les pages OEF et CMRO2 remontent maintenant, dans leur texte, vers le hub `metabolisme-cerebral`; la page CT perfusion remonte vers `perfusion-cerebrale`.
- La formulation ambiguë « extraction, transport et consommation » a ete remplacee par la verification explicite d'une compatibilite physiopathologique entre OEF, CMRO2, CBF et Tmax.
- Les blocs qui citaient des essais ou un consensus sans reference locale complete sur `perfusion-metabolique-neuro-imagerie` sont devenus des reperes de lecture et des conditions de validite. Les FAQ visibles et les contenus methodologiques utiles sont conserves.
- Aucune promesse de decision clinique automatique n'est ajoutee : les textes rappellent le contexte de protocole, de modele et de controle qualite.

### Lot 5 - cluster IRM quantitative et cardiaque

- La page pilier IRM quantitative renvoie explicitement vers le hub `quantification-tissulaire`, puis vers Core Lab et la methodologie. Son title est rendu plus prudent : « biomarqueurs robustes » remplace « biomarqueurs valides ».
- ECV/T1/T2, biomarqueurs IRM cardiaque et segmentation remontent maintenant contextuellement vers la quantification tissulaire, sans modifier les titres ECV deja exposes dans les resultats de recherche.
- Un seul repere d'expertise a ete ajoute sur le pilier IRM; il relie le parcours publie, les publications et le cadre Core Lab sans pretendre a une relecture medicale independante.
- Les libelles de references generiques presentes sur certaines pages cardiaques restent a documenter avec des citations completes avant d'etre presentes comme des sources. Aucun DOI, consensus ou resultat n'a ete ajoute sans verification locale.

### Lot 6 - Core Lab, multicentrique et ingenierie

- La page Core Lab est centree sur la transformation d'un signal en endpoint d'etude defendable, avec une distinction explicite entre lecture, mesure, controle qualite et decisions de protocole.
- Le pilier Core Lab utilise un repere d'expertise unique et relie les contributions publiees sans affirmer de validation clinique independante.
- Methodologie quantitative definit les regles; ingenierie quantitative les implemente dans un pipeline versionne; analyse DICOM, bases multicentriques et recalage remontent maintenant contextuellement vers ces deux niveaux.
- Les encadres « References & standards utiles » non assortis de citations completes sont devenus des points de conformite, de protocole ou de validation a documenter. Les contenus utiles sont conserves, sans presenter de source non verifiee comme une reference bibliographique complete.

### Lot 7 - projets, preuves et contributions

- Chaque fiche projet comprend maintenant un contexte, une contribution methodologique, des limites, un statut de demonstration et des liens explicites vers les pages d'expertise correspondantes.
- Les projets ont des titles distincts et francophones, adaptes a leur demonstration, sans transformer les prototypes en produits cliniques ou en dispositifs medicaux.
- La page Projets conserve son ouverture par volet, mais les cartes et detail de projet sont maintenant plus explicites sur le fait qu'il s'agit de demonstrations de travail.
- Les apercus de projet ont un texte alternatif descriptif et un chargement differe.
- Une entree bibliographique non verifiable localement a ete retiree. COVERT-MI a ete reclassee des publications signees vers les contributions Core Lab, ce qui aligne le rendu visible et le schema ItemList sur le role publie.

## Etat technique apres lots 1 a 7

- Audit local : 37 routes canoniques, 6 redirections historiques, 37 URLs de sitemap, 0 erreur, 0 avertissement.
- Les titles, descriptions et canonicals sont uniques dans le perimetre analyse; chaque page canonique a un seul canonical et un renderer H1.
- Tous les scripts JSON-LD de pages sont serialises avec `JSON.stringify`; le test local protege cette convention et l'absence d'emission automatique de FAQPage.
- Les liens declares dans les pages et les liens contextuels definis par les projets sont verifies contre les routes publiques ou redirections connues.
- Les avertissements React Router observes dans Vitest concernent les futurs flags v7 et n'empechent ni le rendu ni le build.

## Actions a confirmer manuellement

- Completer toute section qui se presente comme une reference scientifique uniquement avec des citations bibliographiques completes et verifiables. Les listes generiques ont ete requalifiees, mais les references deja publiees doivent rester verifiees avant ajout de DOI ou d'URL.
- Confirmer les volumes, dates, intitulés d'etudes et formulations de contribution presentes sur A propos et References & publications avant toute communication externe ou annonce LinkedIn.
- Verifier dans Google Search Console les pages a forte impression avant toute modification de title additionnelle, notamment ECV, perfusion hemodynamique et Core Lab.

## Accessibilite et images

- Les apercus de projets utilisent maintenant un texte alternatif descriptif et un chargement differe. Les groupes de projets conservent une image decorative avec `alt=""`, car le titre et le descriptif adjacent portent deja l'information.
- Les images de viewers sont des demonstrations: leurs textes alternatifs indiquent leur nature et leur modalite, sans les presenter comme une preuve clinique. Les images de superposition purement decoratives sont masquées aux lecteurs d'ecran.
- Les conteneurs d'images principales utilisent un ratio CSS explicite, ce qui limite les deplacements de mise en page. Le portrait A propos conserve une taille fixe.
- Les donnees source des viewers et les droits de diffusion de chaque figure restent a verifier manuellement avant toute reutilisation externe.

## Tableau de synthese

| Domaine | Modifie ? | Fichiers principaux | Validation |
|---|---:|---|---|
| Titles et metas | Oui | Pages IRM, CT spectral et projets | Audit local: titles et metas uniques, longueurs cibles respectees |
| Maillage interne | Oui | Hubs CT, neuro, IRM, Core Lab, projets | Liens declares verifies contre les routes connues |
| JSON-LD | Oui | GlobalEntitySchema, structuredData, pages principales | Canonicals, BreadcrumbList et JSON.stringify verifies |
| Auteur/expertise | Oui | siteIdentity, AuthorExpertiseBlock, A propos | Identite publique centralisee, sans fausse relecture |
| References | Oui | ReferencesPublications, A propos, Core Lab | Contributions distinguees des publications signees |
| Sitemap/canonical | Oui | sitemap, App, audit script | 37 URLs canoniques et 6 redirections historiques |
| Accessibilite images | Oui | Projects, ProjectCard, viewers | Alt descriptifs, decoratifs marques, lazy loading cible |
| Cannibalisation | Oui | Hubs CT, neuro, IRM, methodologie | Roles de pages documentes dans l'inventaire |

## Validation finale

- `npm run audit:seo` : 37 pages canoniques, 6 redirections historiques, 0 erreur, 0 avertissement.
- `npm run typecheck` : succes.
- `npm test -- --run` : 16 tests reussis.
- `npm run build` : succes.
- `npm run lint` : 0 erreur; 7 avertissements Fast Refresh preexistants dans des composants UI generes.
- La verification visuelle automatisee sur serveur local n'a pas pu etre executee dans cette session, car la cible localhost est bloquee par la politique du navigateur integre. Aucun contournement n'a ete tente.
