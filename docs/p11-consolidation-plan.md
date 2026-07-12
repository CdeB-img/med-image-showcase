# P11 - Consolidation SEO, UX et autorite

## Cadre

Cette passe est volontairement limitee a la coherence editoriale, a la lisibilite et au maillage contextuel. Elle n'altère ni les URLs, ni les canonical, ni les titles, ni les meta descriptions, ni les H1, ni le JSON-LD, ni les fils d'Ariane, ni les structures de hubs existantes.

Les pages `/a-propos` et `/references-publications` sont gelees et exclues de toute modification.

## Perimetre retenu avant edition

| Fichier | Nature de la correction | Impact SEO | Impact UX | Impact maillage |
|---|---|---:|---:|---:|
| `src/components/Header.tsx` | Uniformiser le libelle visible `Core Lab`. | Faible | Moyen | Nul |
| `src/components/Footer.tsx` | Uniformiser le libelle visible `Core Lab`. | Faible | Moyen | Nul |
| `src/pages/Index.tsx` | Uniformiser les libelles visibles `Core Lab`, sans modifier les metas. | Faible | Moyen | Nul |
| `src/pages/Prestations.tsx` | Uniformiser les libelles visibles `Core Lab`, sans modifier les metas ni le JSON-LD. | Faible | Moyen | Nul |
| `src/pages/Contact.tsx` | Uniformiser les libelles visibles `Core Lab`. | Faible | Moyen | Nul |
| `src/pages/Expertise.tsx` | Employer `inter-constructeurs` et harmoniser le titre visible de FAQ. | Faible | Moyen | Nul |
| `src/pages/CorelabEC.tsx` | Harmoniser le titre visible de FAQ avec le nom de l'offre. | Faible | Moyen | Nul |
| `src/pages/AnalyseDICOM.tsx` | Ajouter un lien contextuel montant vers la methodologie. | Moyen | Faible | Moyen |
| `src/pages/RecalageMultimodal.tsx` | Ajouter un lien contextuel montant vers la methodologie. | Moyen | Faible | Moyen |
| `src/pages/QuantificationCT.tsx` | Ajouter un lien contextuel vers le hub CT quantitatif. | Moyen | Faible | Moyen |
| `src/pages/CMRO2Imagerie.tsx` | Corriger les accents de titres visibles et le format du titre FAQ. | Faible | Moyen | Nul |
| `src/pages/OEFImagerie.tsx` | Corriger les accents de titres visibles et le format du titre FAQ. | Faible | Moyen | Nul |
| `src/pages/QuantificationTissulaire.tsx` | Corriger les accents de titres visibles et `Pages associées`. | Faible | Moyen | Nul |
| `src/pages/CTPerfusionQuantitative.tsx` | Harmoniser le separateur du titre FAQ. | Faible | Faible | Nul |
| `src/pages/ECVMappingCardiaque.tsx` | Harmoniser le separateur du titre FAQ. | Faible | Faible | Nul |
| `src/pages/MethodologieImagerieQuantitative.tsx` | Harmoniser le separateur du titre FAQ. | Faible | Faible | Nul |
| `src/pages/BasesMulticentriques.tsx` | Harmoniser le separateur du titre FAQ. | Faible | Faible | Nul |

## Controle sans modification

- Les clusters CT spectral, neuro-imagerie et IRM cardiaque ont deja un lien montant vers leur hub et des liens descendants utiles.
- Les pages projet utilisent leurs relations explicites definies dans `src/data/projects.ts`; aucune liste de liens generique ne sera ajoutee.
- Les cartes, blocs `Pages associées`, heroes et CTA des pages deja homogenisees ne sont pas refondus: les differences restantes repondent a la nature informative, methodologique ou commerciale de chaque page.
- Aucun lien ne sera retire sans motif de pertinence explicite.

## Validation apres consolidation

| Controle | Resultat |
|---|---|
| `npm run audit:seo` | 37 pages, 0 erreur, 0 avertissement |
| `npm run typecheck` | Succes |
| `npm test -- --run` | 16 tests reussis |
| `npm run build` | Succes |
