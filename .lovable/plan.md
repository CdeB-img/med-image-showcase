

# Portfolio Imagerie Médicale - Prestataire Indépendant

## Vue d'ensemble
Un site portfolio professionnel au design sombre/tech qui met en valeur vos compétences en imagerie médicale, avec un visualiseur interactif permettant de faire défiler les coupes et comparer vos productions aux images natives.

---

## Page d'accueil

### Section Hero
- Titre accrocheur présentant votre activité (prestation en imagerie médicale)
- Courte phrase d'accroche sur votre expertise
- Bouton d'appel à l'action vers les projets

### Section Compétences (optionnel)
- Icônes/badges des technologies maîtrisées (Python, outils de traitement d'images, etc.)
- Modalités d'imagerie avec lesquelles vous travaillez

---

## Galerie de Projets

### Grille de projets (4-6 projets)
- Cartes visuelles avec :
  - Miniature de l'image médicale
  - Titre du projet
  - Badges : modalité (Scanner, IRM...) + type d'analyse (Segmentation, Reconstruction 3D...)
  - Clic pour accéder au détail

---

## Page Détail d'un Projet

### Informations du projet
- **Titre et description détaillée** du travail réalisé
- **Modalité d'imagerie** (Scanner, IRM, etc.)
- **Type d'analyse/traitement** effectué
- **Outils/Technologies** utilisés (Python, librairies, logiciels)

### Visualiseur de coupes interactif

**Mode côte à côte :**
- Deux panneaux synchronisés : images natives | votre production
- Slider unique pour faire défiler les coupes (les deux vues restent synchronisées)
- Indicateur de numéro de coupe

**Mode avant/après superposé :**
- Vue unique avec slider de comparaison (drag gauche/droite pour révéler avant ou après)
- Bouton pour basculer entre les deux modes de visualisation

### Navigation
- Flèches pour projet précédent/suivant
- Retour à la galerie

---

## Aspects techniques

### Gestion des images
- Les coupes sont stockées en séries d'images PNG/JPG (converties depuis NIfTI)
- Chargement optimisé avec préchargement des images adjacentes
- Design responsive (adapté mobile/tablette)

### Design sombre/tech
- Fond noir/gris foncé pour mettre en valeur les images médicales
- Accents de couleur subtils (bleu ou cyan tech)
- Typographie moderne et lisible

### Version initiale (statique)
- Contenu des projets codé directement dans l'application
- Possibilité d'ajouter un backend plus tard pour gérer les projets dynamiquement

