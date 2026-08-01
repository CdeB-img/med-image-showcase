# Intégration pilote editorial-engine — NOXIA

## Périmètre et état initial

NOXIA est une application React 18 servie par Vite 5, avec `react-router-dom` côté client : c'est une SPA, sans SSR ni SSG. Les pages publiques sont déclarées dans `src/App.tsx`, le sitemap public statique est `public/sitemap.xml`, et les métadonnées (Helmet, canonical et JSON-LD) sont portées par les composants de page. Les viewers restent dans `src/components/` et ne font pas partie de cette intégration.

Le pilote ne publie rien, ne crée aucune route et ne modifie ni le sitemap public ni les pages existantes. Il représente huit routes déjà existantes comme fixtures internes, avec `noindex, nofollow` pour tout rendu de prévisualisation.

| Couche | Responsabilité | Localisation | Dépendances interdites |
|---|---|---|---|
| Moteur | Registre, graphe, routage, navigation, sitemap et JSON-LD déterministes | `../../editorial-engine/packages/core` | NOXIA, React, services SaaS, identité produit |
| Adaptateur | Politiques NOXIA, CTA, exclusions, renderer et stockage sans écriture | `src/editorial/adapter.mjs` | données d'un autre produit, appels réseau |
| Registre pilote | Objets métier, sources et projections | `src/editorial/catalog.mjs` | corpus externe non vérifié |
| Rendu interne | Vue modèle et composants de démonstration React | `src/editorial/renderer.mjs`, `EditorialPilotTemplates.tsx` | routage applicatif, viewers |
| Validation | Contrats, sources locales, routes et publication désactivée | `src/editorial/validate.mjs`, `scripts/validate-editorial-pilot.mjs` | écriture du sitemap public, déploiement |

## Frontière et dépendance

NOXIA consomme `@editorial-engine/core` par une dépendance locale `file:../../editorial-engine/packages/core`. Le core ne possède aucun import vers NOXIA. L'adaptateur porte `productId`, origine, locale, éditeur, politique auteur, routes privées et réservées, canonical, robots, sitemap, publication, navigation, données structurées, CTA, renderer, stockage et observabilité statique.

## Objets et sources du pilote

| Objet pilote | Type | Source | Niveau de preuve | Projection éditoriale |
|---|---|---|---|---|
| IRM | modalité | page IRM quantitative | INTERNAL_SOURCE | hub IRM |
| CT | modalité | page CT perfusion | INTERNAL_SOURCE | guide CT perfusion |
| Cœur | anatomie | page ECV | INTERNAL_SOURCE | guide ECV |
| Cerveau | anatomie | page CT perfusion | INTERNAL_SOURCE | guide CT perfusion |
| Rehaussement tardif | famille de séquence | IRM et projets | INTERNAL_SOURCE | hub IRM |
| Mapping T1/T2 | famille de séquence | page ECV | INTERNAL_SOURCE | guide ECV |
| ECV | biomarqueur | page ECV | INTERNAL_SOURCE | guide ECV |
| CBF | biomarqueur | page CT perfusion | INTERNAL_SOURCE | guide CT perfusion, outil QC |
| Workflow Core Lab | workflow | page Core Lab | INTERNAL_SOURCE | workflow Core Lab |
| QC Viewer | outil | composant existant et projets | INTERNAL_SOURCE | outil QC |
| Prestation d'imagerie quantitative | prestation | page prestations | INTERNAL_SOURCE | page prestation |
| Référence scientifique NOXIA 2024 | publication | références existantes avec DOI | PEER_REVIEWED | page références |

Les relations sont dirigées, typées (`APPLIES_TO`, `USES`, `MEASURES`, `SUPPORTS`, `PRODUCES`, `IMPLEMENTED_BY`, `DOCUMENTS`, `PART_OF`) et déclarées soit `sourced`, soit `structural`.

## Projections, routes et artefacts

| Route | Existante ou pilote | Statut | Canonical | Sitemap public |
|---|---|---|---|---|
| `/irm-imagerie-quantitative` | existante | fixture interne non publiable | route actuelle | inchangé |
| `/ecv-mapping-t1-t2-irm-cardiaque` | existante | fixture interne non publiable | route actuelle | inchangé |
| `/corelab-essais-cliniques` | existante | fixture interne non publiable | route actuelle | inchangé |
| `/ct-perfusion-quantitative-avc` | existante | fixture interne non publiable | route actuelle | inchangé |
| `/analyse-dicom` | existante | fixture interne non publiable | route actuelle | inchangé |
| `/projet/perfusion-segmentation` | existante | fixture interne non publiable | route actuelle | inchangé |
| `/prestations-imagerie-medicale` | existante | fixture interne non publiable | route actuelle | inchangé |
| `/references-publications` | existante | fixture interne non publiable | route actuelle | inchangé |

Le moteur produit une navigation stable, un graphe et un JSON-LD de test. Son sitemap de production est vide pour le pilote. `buildPilotTestSitemap()` fournit séparément les huit URLs pour validation ; aucun fichier sous `public/` n'est écrit.

## Écart moteur et roadmap

| Limite du moteur | Besoin NOXIA | Solution adaptateur | Évolution générique requise ? |
|---|---|---|---|
| Aucune limitante | Routes existantes à tester sans publication | `publicationStatus: existing-route-only`, sitemap de test séparé | Non |

La suite fondée sur ce pilote est :

1. étendre le modèle par anatomie, pathologies, protocoles, séquences, biomarqueurs, équipements et références réellement sourcées ;
2. étendre les projections par hubs, guides, arbres décisionnels, glossaire et prestations sans générer en masse ;
3. étudier ensuite les produits déclaratifs (dictionnaire, protocoles, aide au choix, graphe de connaissance, interfaces viewers/PACS) sans les implémenter dans cette passe.

| Contrat | Préservé ? | Test / preuve | Remarque |
|---|---|---|---|
| Routes publiques | Oui | cibles vérifiées contre `App.tsx` et projets | aucune route ajoutée |
| Sitemap public | Oui | moteur principal : 0 URL pilote | `public/sitemap.xml` non modifié |
| Canonicals | Oui | validation par origine et chemin existant | format des routes actuelles |
| Viewers | Oui | diff Git limité, aucun import du renderer | composants non modifiés |
| SaaS | Oui | adapter sans import Supabase, Stripe ou Auth | aucune intégration applicative |
| Publication et déploiement | Oui | politique non éligible, pas d'appel réseau | aucun effet de bord |
