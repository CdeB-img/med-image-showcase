# NOXIA Protocol Designer

## Manuel UX officiel

**Identifiant :** PD-004  
**Version :** 1.0  
**Date :** 2 août 2026  
**Statut :** Référence UX officielle  
**Portée :** Protocol Designer, ses vues de travail et ses livrables  

> Le Protocol Designer ne doit pas donner une réponse plus vite. Il doit permettre de construire, comprendre, discuter et transmettre un meilleur raisonnement scientifique.

## Statut et autorité du document

Ce manuel traduit la Charte fondatrice de NOXIA et le *Scientific Product Manifesto* du Protocol Designer en règles d'expérience utilisateur vérifiables. Il constitue la référence normative pour la conception, la rédaction, le prototypage, le développement, la recette et l'évolution du Protocol Designer.

Une interface, un composant ou un parcours qui contredit ce manuel n'est pas conforme, même s'il est techniquement correct, visuellement séduisant ou demandé ponctuellement. Une exception ne peut être admise que si elle est documentée selon la procédure de gouvernance décrite en fin de manuel.

Le document couvre :

- les interfaces de cadrage, de dialogue et de construction d'une stratégie ;
- les vues de synthèse, de comparaison, de preuve, de limites et de revue ;
- les projections débutant, standard, expert, méthodologiste et Core Lab ;
- les usages sur ordinateur, tablette et mobile ;
- les rapports, exports et états de reprise qui prolongent l'expérience interactive.

Il ne définit pas :

- le contenu scientifique lui-même ;
- les règles de calcul du moteur scientifique ;
- une procédure de décision clinique ;
- une validation réglementaire, méthodologique ou institutionnelle automatique ;
- l'identité visuelle détaillée, qui relève du design system tant qu'elle respecte les présentes règles.

## Vocabulaire normatif

- **DOIT / NE DOIT PAS** : exigence obligatoire.
- **DEVRAIT / NE DEVRAIT PAS** : règle attendue ; toute dérogation doit être justifiée.
- **PEUT** : possibilité autorisée, non obligatoire.
- **Décision** : choix humain explicite qui modifie la stratégie scientifique.
- **Proposition** : option argumentée par NOXIA, que l'utilisateur reste libre d'accepter, d'adapter ou de refuser.
- **Preuve** : élément documentaire relié à une proposition ou à une conclusion, avec son contexte et ses limites.
- **Limite** : condition qui réduit la validité, la faisabilité, l'interprétabilité ou la reproductibilité d'une proposition.
- **Blocage** : état dans lequel une progression honnête exige une information, une décision ou une expertise humaine supplémentaire.
- **Projection** : présentation différente d'une même stratégie scientifique selon le rôle, le contexte et le niveau d'accompagnement.

## Les invariants non négociables

1. L'intention scientifique précède toujours la solution technique.
2. Le raisonnement scientifique reste unique ; seules ses projections changent.
3. Le chercheur reste décisionnaire et responsable de son projet.
4. Le contexte fait partie de toute connaissance affichée.
5. Une information absente n'est jamais remplacée silencieusement par une hypothèse.
6. Une proposition sans justification, limite ni provenance n'est pas publiable dans l'interface.
7. L'incertitude est une information scientifique, pas un défaut cosmétique.
8. La qualité et la reproductibilité sont préparées dès la conception du protocole.
9. L'interface sert le raisonnement ; elle ne le met jamais en scène comme une prouesse d'intelligence artificielle.
10. Le système doit savoir s'arrêter et demander une revue humaine.

## Architecture mentale canonique

Le parcours de référence est :

**Intention -> Compréhension -> Hypothèses -> Informations manquantes -> Stratégie -> Revue critique -> Rapport**

Ce parcours définit une dépendance logique, pas un tunnel irréversible. Une fois une étape visitée, l'utilisateur peut la rouvrir. Toute modification en amont doit rendre visibles ses conséquences en aval.

Le rapport est la vue consolidée du raisonnement. Le dialogue n'est qu'un moyen d'acquérir et de préciser l'information ; il ne doit jamais devenir l'unique mémoire ni l'unique navigation du projet.

# Partie I - Contrat fondamental de l'expérience

## UX-01 - Commencer par l'intention, jamais par la technique

**Règle.** Le premier écran DOIT demander ce que l'utilisateur cherche à comprendre, démontrer, comparer, suivre, prédire, valider ou reproduire. Il NE DOIT PAS commencer par une modalité, une séquence, un biomarqueur ou un constructeur.

**Justification.** Une modalité ou une séquence appartient déjà à la solution. Commencer par elle enferme le raisonnement dans une réponse prématurée et risque de rendre invisibles des alternatives plus pertinentes.

**Contrôle.** Un utilisateur doit pouvoir initier un projet sans connaître le vocabulaire technique de l'imagerie.

## UX-02 - Comprendre avant de proposer

**Règle.** Aucune stratégie ne DOIT être présentée comme recommandée tant que la question, la population, l'objectif, les contraintes décisives et les principales inconnues ne sont pas suffisamment explicites. Une première proposition exploratoire DOIT être étiquetée comme telle.

**Justification.** Une recommandation sortie de son contexte peut être scientifiquement correcte en général et inadaptée au projet réel.

**Contrôle.** Toute proposition affiche les éléments du contexte qui la conditionnent et les informations encore manquantes.

## UX-03 - Construire une stratégie unique

**Règle.** NOXIA DOIT conserver une seule stratégie scientifique canonique par version de projet. Les vues débutant, expert, méthodologiste et Core Lab DOIVENT être des projections de cette stratégie, jamais des protocoles parallèles reconstruits séparément.

**Justification.** Des versions indépendantes produiraient des contradictions, des mises à jour divergentes et une perte de traçabilité.

**Contrôle.** Une modification de fond apparaît dans toutes les projections concernées sans ressaisie.

## UX-04 - Maintenir l'utilisateur comme décisionnaire

**Règle.** Les verbes de l'interface DOIVENT distinguer clairement ce que NOXIA propose de ce que l'utilisateur décide. Le système NE DOIT PAS employer « protocole validé », « décision optimale » ou « choix certain » lorsqu'aucune validation humaine correspondante n'a eu lieu.

**Justification.** NOXIA accompagne un raisonnement ; il ne transfère ni la responsabilité scientifique ni l'autorité institutionnelle à l'interface.

**Contrôle.** Toute décision structurante possède un auteur humain, une date et, lorsqu'elle est requise, un statut de revue.

## UX-05 - Rendre chaque proposition reconstructible

**Règle.** Toute proposition qui modifie la stratégie DOIT permettre de répondre à cinq questions : quoi, pourquoi, dans quel contexte, pourquoi pas l'alternative principale, et avec quelles limites.

**Justification.** Une proposition utile doit pouvoir être discutée en réunion, justifiée dans un protocole et comprise plus tard sans reconstituer le dialogue initial.

**Contrôle.** Ces cinq réponses sont accessibles depuis l'objet de décision, sans recherche dans un historique de conversation.

## UX-06 - Ne jamais mettre l'intelligence artificielle au centre

**Règle.** L'interface NE DOIT PAS valoriser la génération, les animations de « réflexion », le personnage conversationnel ou le caractère automatique du système. Elle DOIT valoriser la question, les décisions, les preuves, les limites et les conséquences.

**Justification.** La confiance doit venir de la qualité du raisonnement et de sa traçabilité, pas d'une impression de puissance technologique.

**Contrôle.** Une capture d'écran principale du produit reste compréhensible sans vocabulaire lié à l'IA.

# Partie II - Affichage et nombre maximal de choix

## Budget officiel de choix

| Situation | Maximum visible | Traitement au-delà du maximum |
|---|---:|---|
| Points d'entrée initiaux | 5 | Regrouper par intention ou orienter vers « Autre objectif » |
| Options mutuellement exclusives dans une décision | 5 | Rechercher, filtrer ou regrouper avant de choisir |
| Propositions mises en avant par NOXIA | 3 | Classer les autres en alternatives conditionnelles |
| Réponses rapides à une question | 4 + « Autre / Je ne sais pas » | Passer à une sélection recherchable ou à une saisie guidée |
| Actions principales dans une zone | 1 | Transformer les autres en actions secondaires |
| Sections de navigation principales | 7 | Utiliser une navigation locale ou un inspecteur contextuel |
| Alertes urgentes simultanées | 3 | Trier les autres dans le registre des points à revoir |

Ces plafonds sont des règles de présentation, pas des limites scientifiques. Une option pertinente ne doit jamais être supprimée pour respecter un budget d'interface ; elle doit être rendue accessible autrement.

## UX-07 - Une seule question principale à la fois

**Règle.** La zone de travail active DOIT porter une seule question décisionnelle principale. Les questions dépendantes PEUVENT être annoncées, mais NE DOIVENT PAS concurrencer visuellement la réponse attendue.

**Justification.** Le raisonnement reste complexe, mais l'action immédiate doit être évidente. Plusieurs questions de poids égal augmentent les réponses incomplètes et les incohérences.

**Contrôle.** Le titre de la zone active peut être formulé comme une question unique.

## UX-08 - Une action principale par zone

**Règle.** Chaque zone décisionnelle DOIT avoir au plus une action principale visuellement dominante. « Continuer », « Enregistrer » et « Valider ce choix » ne doivent pas apparaître simultanément comme actions équivalentes.

**Justification.** Une hiérarchie d'action claire réduit les erreurs de progression et rend explicite la conséquence du prochain geste.

**Contrôle.** Les actions secondaires restent disponibles, mais leur poids visuel est inférieur et leur libellé décrit leur effet.

## UX-09 - Limiter les options visibles, jamais la connaissance disponible

**Règle.** Une décision DOIT afficher au maximum cinq options mutuellement exclusives. NOXIA DEVRAIT n'en mettre en avant que trois : la proposition principale et au plus deux alternatives raisonnables. Les autres restent accessibles par recherche, regroupement ou expansion.

**Justification.** Le classement aide à décider ; une longue liste non structurée oblige l'utilisateur à effectuer lui-même un tri que le moteur devrait expliciter.

**Contrôle.** Chaque regroupement indique le nombre d'options masquées et le critère de classement.

## UX-10 - Donner à chaque choix une conséquence lisible

**Règle.** Le libellé d'un choix DOIT décrire l'option ; son sous-libellé DOIT indiquer ce qu'elle change dans le projet. Les libellés génériques comme « Option A », « Standard » ou « Recommandé » ne suffisent pas seuls.

**Justification.** L'utilisateur choisit un effet méthodologique, pas un bouton. Montrer la conséquence favorise une décision éclairée.

**Contrôle.** Avant sélection, l'utilisateur peut comparer au minimum bénéfice, coût ou renoncement principal de chaque option.

## UX-11 - Ordonner sans fabriquer de certitude

**Règle.** Lorsque NOXIA classe des options, il DOIT afficher la raison du classement. Une option « recommandée » DOIT préciser le contexte qui la rend préférable. Le classement NE DOIT PAS être présenté comme universel.

**Justification.** Un ordre non expliqué ressemble à une décision automatique et masque les hypothèses qui le produisent.

**Contrôle.** Le critère d'ordre est visible et modifiable lorsqu'il dépend d'une préférence humaine, par exemple durée, précision ou faisabilité multicentrique.

## UX-12 - Préserver un résumé stable du projet

**Règle.** La question reformulée, la population, l'objectif principal, le stade du parcours et les blocages majeurs DOIVENT rester accessibles depuis toute vue de travail. Ils ne doivent pas occuper plus d'un niveau de lecture par défaut.

**Justification.** Ces éléments forment le contexte minimal nécessaire pour interpréter correctement toute proposition locale.

**Contrôle.** Sur petit écran, ce résumé devient un panneau repliable clairement identifié ; il ne disparaît pas.

## UX-13 - Séparer décision, justification et détail

**Règle.** Une carte de décision DOIT présenter dans cet ordre : conclusion ou choix attendu, effet sur le projet, statut d'incertitude, justification courte, puis accès aux preuves et détails techniques.

**Justification.** Mélanger toutes les profondeurs transforme la traçabilité en surcharge et masque l'action utile.

**Contrôle.** La décision reste compréhensible sans ouvrir le détail, mais aucune justification ou limite n'est inaccessible.

## UX-14 - Ne jamais coder un sens par la couleur seule

**Règle.** Toute couleur de statut DOIT être accompagnée d'un libellé et, si utile, d'une forme ou d'une icône. Le rouge est réservé aux blocages, risques critiques ou échecs ; il ne sert pas à marquer un simple désaccord scientifique.

**Justification.** La couleur seule exclut certains utilisateurs et simplifie abusivement des états scientifiques nuancés.

**Contrôle.** L'interface reste interprétable en niveaux de gris et par lecteur d'écran.

# Partie III - Progressive disclosure

## Les quatre profondeurs officielles

| Niveau | Question à laquelle il répond | Contenu type | Ouverture par défaut |
|---|---|---|---|
| 0 - Orientation | « Que dois-je regarder ou décider ? » | Conclusion, action, blocage, effet principal | Toujours ouvert |
| 1 - Compréhension | « Pourquoi et avec quelle conséquence ? » | Justification courte, compromis, alternative principale | Ouvert en standard et débutant |
| 2 - Exécution | « Comment l'appliquer correctement ? » | Paramètres, contrôles, dépendances, procédure | Ouvert selon rôle et contexte |
| 3 - Traçabilité | « Sur quelles preuves et quelles versions ? » | Sources, extraits localisés, provenance, historique | Fermé mais accessible en un geste |

## UX-15 - Révéler selon l'utilité, pas selon la quantité disponible

**Règle.** Une information DOIT apparaître lorsqu'elle devient nécessaire pour comprendre, décider, exécuter ou vérifier. Son existence dans le modèle de données ne justifie jamais son affichage immédiat.

**Justification.** La charge cognitive provient moins du volume total que du volume présenté avant d'avoir une fonction dans le raisonnement.

**Contrôle.** Chaque bloc visible peut être relié à une tâche actuelle de l'utilisateur.

## UX-16 - Respecter les quatre profondeurs

**Règle.** Les composants de décision, de preuve, de limite et de protocole DOIVENT utiliser les quatre profondeurs officielles. Un niveau profond PEUT être ouvert par défaut selon la projection, mais la structure et le contenu scientifique restent identiques.

**Justification.** Une profondeur stable permet de changer de niveau d'accompagnement sans produire plusieurs vérités ni désorienter l'utilisateur.

**Contrôle.** Le passage débutant-expert modifie l'ouverture et la densité, pas les identifiants ni le sens des objets.

## UX-17 - Ne jamais replier une information bloquante

**Règle.** Une contradiction active, une limite critique, une donnée obligatoire manquante ou une raison d'arrêt NE DOIT PAS être cachée dans un accordéon fermé, une info-bulle ou un onglet non sélectionné.

**Justification.** Le dévoilement progressif sert à organiser le détail, pas à atténuer un risque qui conditionne la validité du projet.

**Contrôle.** Tout blocage est visible au niveau 0 avec un accès direct à sa résolution.

## UX-18 - Laisser l'utilisateur approfondir et revenir

**Règle.** Chaque élément synthétique DEVRAIT permettre d'ouvrir le niveau suivant sans perdre le contexte, puis de revenir au point d'origine. Les états d'ouverture PEUVENT être mémorisés dans le projet ou la session lorsqu'ils reflètent une préférence utile.

**Justification.** L'utilisateur doit pouvoir vérifier une affirmation sans abandonner la décision qu'il était en train de prendre.

**Contrôle.** La fermeture d'un détail restaure le focus et la position de lecture.

# Partie IV - Navigation et continuité du raisonnement

## UX-19 - Utiliser le parcours canonique comme carte, pas comme prison

**Règle.** Les sept étapes canoniques DOIVENT être visibles comme une carte de progression. Avant leur première complétion, les dépendances critiques peuvent limiter certains sauts. Après visite, les étapes doivent rester réouvrables.

**Justification.** Le raisonnement possède un ordre logique, mais la recherche est itérative. Un tunnel strict empêcherait de réviser honnêtement une hypothèse.

**Contrôle.** Un retour en amont ne crée jamais un nouveau projet ni une copie implicite.

## UX-20 - Afficher l'état, pas un faux pourcentage

**Règle.** La navigation DOIT indiquer pour chaque étape : non commencée, en cours, suffisamment renseignée, à revoir ou bloquée. Un pourcentage d'avancement NE DOIT PAS être utilisé si sa signification scientifique n'est pas définie.

**Justification.** « 80 % terminé » peut donner une impression de certitude sans révéler qu'une seule inconnue critique empêche toute conclusion.

**Contrôle.** Un état « à revoir » expose la modification qui l'a déclenché.

## UX-21 - Le retour ne doit jamais effacer

**Règle.** « Retour », le fil d'Ariane, un changement d'étape ou la fermeture d'un panneau NE DOIVENT PAS supprimer une saisie. Les données sont enregistrées automatiquement ou un état non enregistré est annoncé explicitement.

**Justification.** La peur de perdre son travail dissuade l'exploration et favorise des décisions conservées par inertie.

**Contrôle.** Une fermeture accidentelle permet la reprise au dernier état cohérent.

## UX-22 - Propager les changements avec un différentiel

**Règle.** Lorsqu'une décision amont change, NOXIA DOIT identifier les éléments aval affectés, les marquer « à revoir » et montrer ce qui a changé. Il NE DOIT PAS réécrire silencieusement une décision humaine.

**Justification.** Une stratégie est un réseau de dépendances. Une mise à jour invisible détruit la traçabilité ; l'absence de propagation crée des incohérences.

**Contrôle.** Le différentiel distingue ajouté, retiré, modifié et inchangé, avec la cause.

## UX-23 - Ne pas utiliser le transcript comme navigation principale

**Règle.** L'historique dialogué PEUT rester consultable, mais les décisions, hypothèses, preuves et limites DOIVENT être retrouvables dans des vues structurées. Aucune information importante ne doit exister uniquement dans un message ancien.

**Justification.** Un transcript est chronologique ; un projet scientifique est relationnel et doit pouvoir être relu par thème, décision et version.

**Contrôle.** Un nouvel intervenant peut comprendre l'état du projet sans lire toute la conversation.

## UX-24 - Rendre la reprise explicite

**Règle.** Au retour dans un projet, l'interface DOIT montrer le dernier point travaillé, les changements intervenus depuis, les décisions ouvertes et la prochaine action raisonnable. Elle NE DOIT PAS relancer automatiquement le dialogue comme si la session était continue.

**Justification.** Le temps entre deux sessions modifie la mémoire humaine et parfois les connaissances ou la composition de l'équipe.

**Contrôle.** La reprise distingue « continuer », « revoir les changements » et « ouvrir le rapport ».

## UX-25 - Réserver les fenêtres modales aux interruptions nécessaires

**Règle.** Une fenêtre modale NE DOIT être utilisée que pour une action brève qui exige une réponse avant de poursuivre : confirmation destructive, conflit de version, décision bloquante ou authentification. Les preuves, paramètres et explications ordinaires utilisent un panneau ou une page.

**Justification.** Les modales interrompent la lecture, réduisent l'espace et compliquent la comparaison.

**Contrôle.** Toute modale possède un titre explicite, une action principale, une sortie sûre, une gestion complète du focus et aucune chaîne de modales.

# Partie V - Gestion de l'incertitude

## Les deux grammaires officielles

**État d'une information :** connue, supposée, manquante, contradictoire.  
**Statut d'une conclusion :** établie, probable, contextuelle, controversée, insuffisamment documentée.

Ces grammaires répondent à deux questions différentes. La première décrit ce que le projet fournit ; la seconde décrit la solidité de ce que NOXIA conclut.

## UX-26 - Qualifier toute information structurante

**Règle.** Toute donnée qui conditionne une recommandation DOIT pouvoir être qualifiée comme connue, supposée, manquante ou contradictoire. Une valeur supposée DOIT mentionner son origine et rester modifiable.

**Justification.** Une hypothèse non signalée se transforme rapidement en faux fait et contamine les décisions dépendantes.

**Contrôle.** Les rapports et exports conservent cette qualification.

## UX-27 - Employer cinq statuts de conclusion, sans synonymes ambigus

**Règle.** Les conclusions scientifiques DOIVENT utiliser les cinq statuts officiels. L'interface NE DOIT PAS inventer des synonymes comme « fiable », « sûr », « moyen » ou « validé » sans définition supplémentaire.

**Justification.** Un vocabulaire stable rend les conclusions comparables et évite que le ton rédactionnel modifie la perception de la preuve.

**Contrôle.** Chaque statut possède une définition accessible et identique dans toutes les vues.

## UX-28 - Ne pas afficher de pourcentage de confiance non calibré

**Règle.** NOXIA NE DOIT PAS afficher un score de confiance numérique s'il n'est pas calibré, validé pour l'usage présenté et compréhensible par l'utilisateur. Les statuts qualitatifs officiels sont la représentation par défaut.

**Justification.** Un nombre précis peut donner une illusion de mesure et être interprété comme une probabilité clinique ou une garantie scientifique.

**Contrôle.** Tout score autorisé documente sa définition, son domaine, sa validation et ses limites.

## UX-29 - Donner une forme actionnable à l'incertitude

**Règle.** Une incertitude DOIT afficher : ce qui est incertain, pourquoi, ce que cela empêche ou fragilise, ce qui pourrait la réduire, et qui peut agir. Si rien ne peut la réduire, cette impossibilité doit être dite.

**Justification.** Une étiquette seule informe sans aider. L'incertitude devient utile lorsqu'elle guide une décision, une collecte ou une revue.

**Contrôle.** Chaque incertitude active mène soit à une action, soit à une acceptation argumentée, soit à un arrêt.

## UX-30 - Toujours offrir « Je ne sais pas »

**Règle.** Toute question à laquelle l'utilisateur peut légitimement ne pas savoir répondre DOIT proposer « Je ne sais pas », « À confirmer » ou une formulation équivalente. Cette réponse NE DOIT PAS être traitée comme une faute.

**Justification.** Forcer un choix transforme une inconnue honnête en donnée fausse et dégrade tout le raisonnement aval.

**Contrôle.** La conséquence de l'inconnue est expliquée et la question peut être assignée ou reprise plus tard.

## UX-31 - Savoir s'arrêter

**Règle.** NOXIA DOIT interrompre la production d'une recommandation lorsque les preuves sont trop faibles, le contexte sort du domaine documenté, une contradiction critique persiste ou une expertise humaine est indispensable. L'arrêt DOIT être explicatif et orienter vers la prochaine revue utile.

**Justification.** Une réponse coûte que coûte est moins utile qu'une limite honnête et peut donner une fausse légitimité au projet.

**Contrôle.** L'état d'arrêt nomme la cause, l'étendue affectée, les informations conservées et la condition de reprise.

# Partie VI - Visualisation des preuves

## Anatomie canonique d'une preuve

Une preuve n'est jamais une simple référence. La vue complète comprend :

1. la proposition ou conclusion soutenue ;
2. le lien logique entre la source et cette proposition ;
3. le type de preuve et son statut documentaire ;
4. la population, la modalité, la méthode et le contexte pertinents ;
5. le degré d'applicabilité au projet courant ;
6. les résultats ou messages utiles, sans extrapolation ;
7. les limites, désaccords et dépendances ;
8. la source, le localisateur, la version et la date de vérification.

## UX-32 - Attacher la preuve à la proposition

**Règle.** Toute preuve DOIT être accessible depuis la proposition qu'elle soutient ou nuance. Une bibliographie globale PEUT compléter cette vue, mais NE DOIT PAS être l'unique accès aux sources.

**Justification.** La proximité rend le raisonnement vérifiable et évite de confondre présence d'une référence et justification réelle d'une décision.

**Contrôle.** Depuis une décision, l'utilisateur atteint ses preuves en un geste et revient sans perdre son contexte.

## UX-33 - Montrer la chaîne d'argumentation avant la citation

**Règle.** Le premier niveau de preuve DOIT expliquer en langage clair ce que la source apporte à la décision. Le titre, les auteurs ou le DOI seuls ne constituent pas une justification.

**Justification.** Une citation renseigne l'origine ; elle n'explique ni la portée ni l'applicabilité de l'élément cité.

**Contrôle.** Chaque relation preuve-proposition possède un résumé analytique et, lorsque disponible, un localisateur vérifiable.

## UX-34 - Ne jamais confondre volume et force de preuve

**Règle.** Le nombre de publications NE DOIT PAS être utilisé seul comme indicateur de solidité. La visualisation DOIT distinguer au minimum type de preuve, directivité, cohérence, applicabilité et actualité.

**Justification.** Plusieurs études faibles ou indirectes peuvent être moins convaincantes qu'une recommandation robuste et directement applicable.

**Contrôle.** Les compteurs bibliographiques restent secondaires par rapport à la qualification de la preuve.

## UX-35 - Visualiser les désaccords sans élire artificiellement un vainqueur

**Règle.** Lorsque plusieurs positions coexistent, la vue DOIT les comparer selon les mêmes critères : arguments, preuves, contextes, limites et conséquences. Elle NE DOIT PAS fusionner les divergences dans une moyenne ou une formulation vague.

**Justification.** La controverse est parfois le résultat scientifique le plus important pour choisir une stratégie et préparer une discussion humaine.

**Contrôle.** L'utilisateur peut identifier ce qui ferait préférer une position dans son contexte.

## UX-36 - Conserver provenance, version et fraîcheur

**Règle.** Toute preuve structurante DOIT afficher sa source, son statut, sa version ou date pertinente et la date de dernière vérification. Une source remplacée, corrigée, rétractée ou devenue non applicable DOIT être signalée sans effacer son rôle historique.

**Justification.** Une recommandation correcte à une date peut devenir incomplète ; la traçabilité doit permettre de comprendre les décisions anciennes et de revoir les décisions actuelles.

**Contrôle.** Une mise à jour documentaire peut générer une liste des décisions potentiellement affectées.

# Partie VII - Affichage des limites

## UX-37 - Afficher la limite au plus près de ce qu'elle limite

**Règle.** Une limite locale DOIT apparaître dans la carte, la comparaison ou la section concernée. Elle ne doit pas être reléguée uniquement dans une annexe générale.

**Justification.** Une limite lue loin de la décision arrive trop tard pour influencer le choix.

**Contrôle.** Toute proposition structurante peut afficher ses limites sans quitter la vue de décision.

## UX-38 - Maintenir un registre transversal des limites

**Règle.** Le projet DOIT posséder un registre consolidé des limites scientifiques, techniques, opérationnelles, humaines et documentaires. Chaque limite indique les objets affectés, sa criticité et son état de traitement.

**Justification.** Les limites locales doivent aussi pouvoir être relues ensemble afin de détecter une accumulation de risques ou un angle mort transversal.

**Contrôle.** Le registre ne duplique pas les limites ; il les référence depuis leur objet source.

## UX-39 - Montrer conséquence, mitigation et résidu

**Règle.** Une limite DOIT préciser sa conséquence possible, la mitigation envisagée et le risque qui subsiste après mitigation. Une mitigation ne DOIT PAS faire disparaître la limite d'origine.

**Justification.** « Risque traité » peut être trompeur : la méthode réduit souvent un risque sans l'annuler.

**Contrôle.** Le rapport final distingue limite initiale, mesure prise et risque résiduel.

## UX-40 - Ne pas permettre de masquer une limite critique

**Règle.** Une limite critique NE DOIT PAS pouvoir être supprimée, rendue silencieuse ni fermée définitivement. Elle PEUT être reconnue par un utilisateur autorisé avec une justification, mais reste visible avant revue et export.

**Justification.** La reconnaissance documente une décision humaine ; elle ne transforme pas la limite en absence de risque.

**Contrôle.** L'accusé de lecture comporte auteur, date, justification et version de projet.

# Partie VIII - Erreurs, contradictions et récupération

## Taxonomie officielle

- **Saisie invalide** : format ou valeur inexploitable.
- **Information manquante** : donnée absente mais potentiellement récupérable.
- **Contradiction** : deux informations ou décisions incompatibles.
- **Insuffisance scientifique** : preuve ou domaine de validité insuffisant.
- **Conflit de version ou de droits** : l'action ne peut pas être appliquée à l'état courant.
- **Défaillance technique** : service, calcul, enregistrement ou chargement indisponible.

## UX-41 - Nommer correctement la nature du problème

**Règle.** L'interface DOIT distinguer erreur de saisie, inconnue, contradiction, insuffisance scientifique et défaillance technique. Elle NE DOIT PAS présenter un désaccord scientifique ou une information absente comme une « erreur utilisateur ».

**Justification.** La qualification détermine le bon remède et préserve une relation pédagogique non punitive.

**Contrôle.** Le message et son style visuel correspondent à la taxonomie officielle.

## UX-42 - Utiliser une anatomie de message constante

**Règle.** Tout message bloquant DOIT expliquer : ce qui s'est passé, ce qui est affecté, ce qui a été conservé, et comment continuer. Le code technique PEUT être proposé dans un détail copiable, jamais comme message principal.

**Justification.** Un message utile réduit l'incertitude opérationnelle et permet la récupération sans assistance externe.

**Contrôle.** Aucun message bloquant ne se limite à « Une erreur est survenue ».

## UX-43 - Préserver le travail et offrir une récupération

**Règle.** Une erreur NE DOIT PAS effacer une saisie valide. L'interface DOIT proposer selon le cas corriger, réessayer, annuler, restaurer ou contacter un responsable avec le contexte conservé.

**Justification.** La perte de travail altère la confiance et pousse l'utilisateur à éviter les explorations ou corrections nécessaires.

**Contrôle.** Les scénarios de panne sont testés avec des données partielles et une reprise de session.

## UX-44 - Corriger de façon pédagogique

**Règle.** Lorsqu'une stratégie paraît fragile, NOXIA DOIT expliquer le risque, l'hypothèse en cause, les alternatives et les preuves pertinentes. Il NE DOIT PAS se limiter à « Faux », « Non conforme » ou « Mauvais choix ».

**Justification.** Le succès du Protocol Designer se mesure à la compréhension acquise, pas au nombre de corrections imposées.

**Contrôle.** Après lecture, l'utilisateur peut expliquer pourquoi la stratégie est fragile et décider de la suite.

## UX-45 - Encadrer les actions destructives

**Règle.** La suppression d'une décision, d'une version, d'une preuve ou d'un projet DOIT nommer exactement l'objet, les dépendances affectées et la possibilité de récupération. Les suppressions importantes exigent une confirmation distincte de l'action ordinaire.

**Justification.** Les objets sont interdépendants ; une suppression apparemment locale peut modifier le rapport et la reproductibilité.

**Contrôle.** Lorsque possible, la suppression est réversible ou passe par un archivage.

# Partie IX - Responsive, accessibilité et performance perçue

## Comportement responsive officiel

| Largeur utile | Organisation attendue | Priorité |
|---|---|---|
| 320 à 767 px | Une colonne ; résumé et preuves en panneaux ; actions persistantes non superposées | Comprendre, répondre, signaler, reprendre |
| 768 à 1199 px | Une colonne large ou deux zones temporaires ; inspecteur escamotable | Construire et relire sans perte de contexte |
| 1200 à 1599 px | Zone de travail + inspecteur contextuel ; navigation latérale possible | Décider, comparer, justifier |
| 1600 px et plus | Largeur de lecture plafonnée ; espace supplémentaire pour comparaison ou Core Lab | Densité utile, jamais étirement du texte |

Ces seuils définissent des comportements de référence. Les composants doivent aussi s'adapter à leur conteneur, au zoom et à la taille réelle du texte.

## UX-46 - Préserver les capacités essentielles sur tous les écrans

**Règle.** Aucune décision essentielle, limite critique, preuve ou fonction de reprise NE DOIT devenir inaccessible sur mobile ou tablette. Une vue dense PEUT devenir séquentielle, mais son sens et ses actions restent disponibles.

**Justification.** Le mobile sert souvent à relire, répondre ou lever un blocage ; une expérience amputée peut retarder ou déformer une décision.

**Contrôle.** Les scénarios principaux sont réalisables à partir de 320 px sans basculer en « site pour ordinateur ».

## UX-47 - Éviter le défilement horizontal

**Règle.** Le contenu courant NE DOIT PAS exiger de défilement horizontal. Les matrices scientifiques réellement tabulaires PEUVENT le permettre si une vue linéaire équivalente, des en-têtes persistants et un repère de position sont fournis.

**Justification.** Le défilement bidimensionnel fait perdre les relations entre libellés, valeurs et limites, surtout à fort zoom.

**Contrôle.** À 400 % de zoom, le contenu principal se réorganise sans perte d'information ni d'action.

## UX-48 - Viser WCAG 2.2 niveau AA

**Règle.** Le Protocol Designer DOIT viser WCAG 2.2 niveau AA : navigation clavier complète, ordre de focus logique, focus visible et non masqué, alternatives textuelles, structure sémantique, contrastes suffisants, annonces d'état et libellés explicites. Les composants interactifs suivent les modèles WAI-ARIA APG lorsque le HTML natif ne suffit pas.

**Justification.** L'accessibilité est une condition de fiabilité, d'autonomie et de relecture collective ; elle améliore aussi l'usage au clavier, au zoom et dans des environnements contraints.

**Contrôle.** La recette combine tests automatiques et parcours manuels clavier, lecteur d'écran, zoom et contraste.

## UX-49 - Dimensionner pour la précision

**Règle.** Les cibles tactiles principales DEVRAIENT mesurer au moins 44 x 44 pixels CSS, avec un espacement qui évite les activations voisines. Toute interaction par glisser-déposer DOIT avoir une alternative par clic ou clavier.

**Justification.** Les usages mobiles, le stress, la fatigue et les interfaces denses augmentent le risque d'action involontaire.

**Contrôle.** Les actions critiques ne reposent jamais sur une icône minuscule, un survol ou un geste seul.

## UX-50 - Rendre l'attente compréhensible et maîtrisable

**Règle.** Toute action doit recevoir un accusé visuel immédiat. Une opération perceptiblement longue DOIT indiquer son objet et sa progression ou son état ; si elle peut durer, elle DEVRAIT être annulable et permettre de quitter la vue sans perdre le travail.

**Justification.** Une attente silencieuse pousse à répéter l'action, crée des doublons et rend impossible de distinguer calcul, panne et blocage.

**Contrôle.** Les états chargement, succès partiel, échec et reprise sont conçus avant l'implémentation du scénario heureux.

# Partie X - Débutant, expert et niveaux d'accompagnement

## Principe commun

Le niveau d'accompagnement n'est jamais une note de compétence. Il dépend du domaine, de la modalité, du rôle, de l'expérience récente, du temps disponible et de la tâche. Un expert en IRM cardiaque peut être débutant en perfusion cérébrale ; un manipulateur expérimenté peut découvrir une pathologie.

## UX-51 - Adapter la projection, jamais la vérité scientifique

**Règle.** Le changement de niveau DOIT modifier vocabulaire, densité, ordre d'ouverture, exemples et outils d'action rapide. Il NE DOIT PAS retirer une limite, transformer une incertitude ni produire une recommandation différente.

**Justification.** L'accessibilité pédagogique exige une forme adaptée, pas plusieurs versions du raisonnement.

**Contrôle.** Deux projections d'une même version partagent les mêmes identifiants de décisions, preuves et limites.

## UX-52 - Concevoir le mode débutant pour apprendre en agissant

**Règle.** La projection débutant DOIT expliquer pourquoi une question est posée, définir les termes au moment utile, proposer des exemples contextualisés, offrir « Je ne sais pas » et montrer les conséquences d'un choix. Elle NE DOIT PAS commencer par un glossaire massif ni simplifier au point de devenir fausse.

**Justification.** L'apprentissage est plus efficace lorsqu'il résout une difficulté réelle du projet et reste relié à une décision concrète.

**Contrôle.** Un utilisateur débutant peut reformuler le choix et son principal risque avant de continuer.

## UX-53 - Concevoir le mode expert pour la vitesse de revue

**Règle.** La projection expert DOIT proposer une densité plus forte, des raccourcis clavier, la comparaison, la revue par lot, l'accès direct aux paramètres, preuves et limites, ainsi que des valeurs récentes réutilisables avec confirmation. Elle NE DOIT PAS imposer les explications pédagogiques ouvertes par défaut.

**Justification.** L'expert a besoin de réduire les gestes répétitifs tout en conservant la capacité de vérifier et de contester le raisonnement.

**Contrôle.** Les raccourcis accélèrent l'action mais aucune décision critique ne dépend exclusivement d'eux.

## UX-54 - Permettre de changer de niveau à tout moment

**Règle.** L'utilisateur DOIT pouvoir modifier son niveau d'accompagnement sans recommencer le projet. Le changement PEUT être global ou limité à une section et DOIT être réversible.

**Justification.** Le besoin d'explication varie au cours d'un même projet et selon le sujet abordé.

**Contrôle.** Le changement conserve réponses, position et historique ; il ne déclenche aucune décision scientifique.

## Matrice de projection

| Projection | Ouverture par défaut | Éléments mis en avant | Actions accélérées |
|---|---|---|---|
| Débutant | Niveaux 0 et 1 | Définitions, exemples, plans de coupe, pièges, contrôles | Aide guidée, « Je ne sais pas », vérification de compréhension |
| Standard | Niveau 0, niveau 1 sélectif | Choix, justifications, compromis, prochaines étapes | Parcours adaptatif |
| Expert | Niveau 0 dense, niveaux 2 et 3 proches | Protocoles, paramètres, contraintes, limites, preuves | Clavier, comparaison, revue par lot |
| Méthodologiste | Niveaux 0 et 2 | Hypothèses, critères de jugement, biais, puissance, statistiques | Matrices de cohérence et différentiel |
| Core Lab | Niveaux 0 et 2, registre transversal | Harmonisation, acceptabilité, reproductibilité, déviations, qualité | Comparaison multicentrique, revue et traçabilité |

# Partie XI - Projection Core Lab

## UX-55 - Organiser le Core Lab autour de la stratégie commune

**Règle.** La vue Core Lab DOIT partir de la question scientifique, des critères de jugement et de la stratégie centrale avant de présenter les centres, séquences ou écarts. Elle NE DOIT PAS devenir un inventaire d'acquisitions déconnecté du projet.

**Justification.** Une acquisition n'est acceptable qu'au regard du phénomène, du biomarqueur et de l'analyse qu'elle doit servir.

**Contrôle.** Chaque exigence d'acquisition ou de lecture remonte à un objectif ou à un risque identifié.

## UX-56 - Définir la qualité avant l'acquisition

**Règle.** Les critères d'acceptation, contrôles immédiats, causes de rejet, conditions de reprise et responsabilités DOIVENT être visibles avant le déploiement du protocole. Ils ne doivent pas apparaître seulement dans une vue de contrôle finale.

**Justification.** Une donnée non exploitable est souvent la conséquence d'une exigence non définie ou non transmise au moment de l'acquisition.

**Contrôle.** Un centre peut produire une fiche d'exécution et de contrôle avant le premier examen.

## UX-57 - Comparer les centres selon une matrice explicite

**Règle.** La comparaison multicentrique DOIT relier, pour chaque exigence : valeur cible, plage acceptable, valeur locale, compatibilité, conséquence, mitigation, responsable et statut. Elle DOIT distinguer ce qui doit être identique de ce qui peut varier.

**Justification.** Harmoniser ne signifie pas uniformiser. Rendre les tolérances explicites évite à la fois les variations incontrôlées et les contraintes inutiles.

**Contrôle.** Toute incompatibilité mène à une décision documentée : adapter, compenser, exclure, tester ou demander une revue.

## UX-58 - Faire des déviations des objets de premier rang

**Règle.** Une déviation DOIT conserver l'exigence d'origine, la valeur observée, la cause, l'impact, la décision, l'auteur, la date et le statut. Elle NE DOIT PAS être automatiquement normalisée, effacée ou confondue avec une correction technique.

**Justification.** Les déviations constituent une information essentielle pour l'interprétation, la reproductibilité et l'audit.

**Contrôle.** Le rapport permet de distinguer protocole prévu, protocole exécuté et conséquence analytique.

## UX-59 - Prioriser les points Core Lab par possibilité d'action

**Règle.** La vue opérationnelle DOIT classer les points en : bloquant, action requise avant acquisition, à surveiller, informatif. Elle affiche au plus trois urgences à la fois, puis donne accès à la file complète triée.

**Justification.** Un tableau de bord qui montre tout avec la même intensité masque les problèmes encore évitables.

**Contrôle.** Chaque urgence possède un responsable, une échéance ou une condition de résolution.

## UX-60 - Distinguer proposition, revue et approbation humaines

**Règle.** La vue Core Lab DOIT distinguer : proposition NOXIA, décision de l'équipe, revue du Core Lab et approbation institutionnelle éventuelle. Une modification matérielle DOIT signaler les revues devenues à reconfirmer.

**Justification.** La traçabilité des responsabilités empêche qu'une proposition logicielle soit confondue avec une validation scientifique ou réglementaire.

**Contrôle.** Chaque statut de revue indique portée, auteur, date, version et éventuelles réserves.

## UX-61 - Versionner le paquet de reproductibilité

**Règle.** La projection Core Lab DOIT pouvoir exporter un paquet versionné comprenant stratégie, critères d'acceptation, paramètres critiques, contrôles, procédures de lecture, déviations, limites, preuves et décisions humaines. L'export doit identifier les éléments non résolus.

**Justification.** Un protocole seul ne suffit pas à reproduire ni à auditer la méthode réellement retenue.

**Contrôle.** Un export peut être relié sans ambiguïté à une version du projet et à son historique de décisions.

# Partie XII - Rédaction, composants et microcopie

## UX-62 - Écrire comme un méthodologiste, pas comme une machine

**Règle.** La rédaction DOIT être précise, directe, calme et respectueuse. Elle privilégie « Cette stratégie fragilise... parce que... » à « Vous avez tort » et « Les données disponibles ne permettent pas de conclure » à une formulation vague ou rassurante.

**Justification.** Le ton doit soutenir la discussion scientifique, y compris lorsqu'il signale un risque ou un arrêt.

**Contrôle.** Les messages restent compréhensibles hors de leur composant et n'utilisent pas de jargon sans définition.

## UX-63 - Donner des libellés autonomes aux actions

**Règle.** Les boutons et liens DOIVENT nommer leur résultat : « Comparer les stratégies », « Ajouter cette hypothèse », « Demander une revue Core Lab ». Les libellés « Oui », « OK », « Suite » et « Confirmer » sont réservés aux contextes où l'objet reste explicitement visible.

**Justification.** Un libellé autonome améliore la compréhension, l'accessibilité et la vérification avant une action importante.

**Contrôle.** Lu seul par un lecteur d'écran, le libellé reste non ambigu.

## UX-64 - Utiliser le bon composant pour la bonne relation

**Règle.** Les onglets servent à des vues sœurs d'un même objet, les accordéons à des profondeurs repliables, les étapes à une séquence, les tableaux à des comparaisons répétées et les cartes à des objets autonomes. Un composant NE DOIT PAS être choisi pour son apparence seule.

**Justification.** Une sémantique stable rend l'interface prévisible et améliore la navigation au clavier et avec les technologies d'assistance.

**Contrôle.** Le type de relation entre contenus peut justifier le composant retenu.

# Partie XIII - Gouvernance et qualité UX

## UX-65 - Tester la compréhension, pas seulement la complétion

**Règle.** Une évaluation UX DOIT mesurer si l'utilisateur comprend la question reformulée, les raisons d'un choix, l'incertitude, la principale limite et la prochaine action. Le temps de tâche et le taux de complétion ne suffisent pas.

**Justification.** Un protocole terminé rapidement peut rester scientifiquement fragile ou mal compris.

**Contrôle.** Les tests incluent des questions de reformulation et des scénarios de contradiction, d'inconnue et d'arrêt.

## UX-66 - Tester chaque projection avec son public réel

**Règle.** Toute évolution structurante DOIT être évaluée avec au minimum un utilisateur du parcours standard et, selon la portée, des représentants débutant, expert, méthodologiste et Core Lab. Un expert ne peut pas valider seul l'expérience débutant, ni l'inverse.

**Justification.** Les projections répondent à des tâches et à des densités différentes, même lorsqu'elles reposent sur le même raisonnement.

**Contrôle.** Le dossier de décision UX nomme les profils testés, les tâches, les incompréhensions et les changements retenus.

## UX-67 - Concevoir les états non heureux avant la recette

**Règle.** Chaque fonctionnalité DOIT spécifier dès sa conception : vide, chargement, donnée partielle, inconnue, contradiction, limite critique, perte de connexion, conflit de version, refus de droit, succès partiel et arrêt scientifique.

**Justification.** Dans un outil méthodologique, les états incomplets et contradictoires sont normaux ; les traiter tardivement produit des impasses ou des messages génériques.

**Contrôle.** Aucun composant n'est déclaré terminé sur le seul scénario idéal.

## UX-68 - Documenter toute exception

**Règle.** Une dérogation à une règle DOIT indiquer : règle concernée, besoin réel, alternatives étudiées, risque accepté, propriétaire, périmètre, date de revue et condition d'expiration. Une préférence esthétique ou une contrainte de calendrier ne suffit pas seule.

**Justification.** Sans procédure, les exceptions ponctuelles deviennent des incohérences durables et affaiblissent la référence commune.

**Contrôle.** Les exceptions expirées réouvrent automatiquement la décision de conception.

## UX-69 - Maintenir une source de vérité UX unique

**Règle.** Ce manuel, le design system, les composants et les critères de recette DOIVENT être reliés. Une règle comportementale ne doit pas être dupliquée avec des formulations divergentes dans plusieurs documents.

**Justification.** Une référence officielle n'est utile que si elle peut orienter de façon cohérente conception, implémentation et validation.

**Contrôle.** Chaque composant structurant référence les règles UX qu'il implémente et les tests qui les vérifient.

## UX-70 - Faire primer les invariants lors d'un arbitrage

**Règle.** En cas de conflit, l'ordre de priorité est : sécurité et honnêteté scientifique ; compréhension ; traçabilité et réversibilité ; accessibilité ; efficacité ; cohérence visuelle ; nouveauté technique.

**Justification.** Cet ordre empêche qu'un gain de vitesse ou d'esthétique masque une limite, dégrade une décision ou exclue un utilisateur.

**Contrôle.** Toute décision contestée peut être expliquée à partir de cet ordre.

## Anti-patterns interdits

- produire immédiatement un protocole à partir d'une phrase ambiguë ;
- présenter plus de cinq choix équivalents sans classement ni regroupement ;
- utiliser un pourcentage de confiance non calibré ;
- cacher une limite critique derrière « En savoir plus » ;
- utiliser la quantité de références comme preuve de solidité ;
- réécrire silencieusement une décision après un changement amont ;
- faire du transcript la seule mémoire du projet ;
- afficher « protocole validé » sans revue humaine correspondante ;
- supprimer une donnée parce qu'elle est contradictoire ;
- employer une couleur seule pour une criticité ;
- réserver une fonction essentielle à l'ordinateur ;
- faire dépendre une action d'un survol, d'un glisser-déposer ou d'une icône sans libellé accessible ;
- présenter le mode débutant comme une version scientifiquement appauvrie ;
- transformer la vue Core Lab en simple tableau de séquences ou de centres ;
- optimiser le nombre de clics au détriment de la compréhension.

## Définition de fini UX

Une fonctionnalité du Protocol Designer n'est UX-complète que si :

- son besoin scientifique est formulé ;
- sa place dans le parcours canonique est explicite ;
- la question et l'action principale sont uniques ;
- les budgets de choix sont respectés ;
- les quatre profondeurs sont définies ;
- les preuves, limites, inconnues et contradictions sont traitées ;
- les conséquences d'un changement amont sont visibles ;
- les états non heureux et la reprise sont conçus ;
- les projections concernées restent cohérentes ;
- l'usage clavier, lecteur d'écran, zoom et mobile est vérifié ;
- les microcopies françaises sont finalisées et homogènes ;
- les tests évaluent la compréhension, pas seulement la complétion ;
- toute dérogation est documentée et datée.

## Références de mise en œuvre

- *NOXIA - La Charte fondatrice*, version 1.0, référence officielle.
- *NOXIA Protocol Designer - Scientific Product Manifesto*, version 1.0.
- W3C, [*Web Content Accessibility Guidelines (WCAG) 2.2*](https://www.w3.org/TR/WCAG22/).
- W3C WAI, [*ARIA Authoring Practices Guide*](https://www.w3.org/WAI/ARIA/apg/).

## Clause finale

Le Protocol Designer doit toujours permettre à un chercheur de répondre à trois questions :

1. Qu'est-ce que le système a compris de mon projet ?
2. Pourquoi cette stratégie est-elle proposée, avec quelles preuves et quelles limites ?
3. Qu'est-ce qui relève encore de ma décision ou d'une revue humaine ?

Si l'interface ne rend pas ces réponses évidentes, elle n'est pas conforme à ce manuel.
