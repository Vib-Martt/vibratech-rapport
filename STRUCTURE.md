> Version 19.11 : aperçu sans enregistrement dans js/apercu-pdf.js, accès aux pages du générateur dans js/pdf.js, Précédent masqué à l’étape Client dans js/etapes-rapport.js. Fenêtre et styles ajoutés à index.html et css/application.css. Instructions actuelles dans LISEZ-MOI.txt.

> Version 19.10 : organisation des onglets et du répertoire. Modifications dans index.html, css/application.css, js/clients.js, js/navigation.js, js/recherche-clients.js et retour au champ client depuis la validation dans js/rapports.js. Instructions actuelles dans LISEZ-MOI.txt.

> Version 19.9 : le bouton de navigation de la dernière étape déclenche maintenant l’action PDF existante. Changement dans js/etapes-rapport.js. Instructions actuelles dans LISEZ-MOI.txt.

> Version 19.8 : modification de la présentation des heures dans js/pdf.js et de l’impression dans js/rapports.js. Voir LISEZ-MOI.txt pour les instructions actuelles. Les notes ci-dessous décrivent les étapes précédentes.

> Mise à jour 19.7 : consulter LISEZ-MOI.txt pour le correctif, les tests actuels et la procédure d’essai. Les notes ci-dessous décrivent la première extraction 19.6. Depuis, cloud-sync.js, les actions de suppression dans rapports.js et clients.js, le numéro de version et le nom du cache ont été modifiés.

# Vibratech 19.7 — copie structurée avec correctif de synchronisation

Cette copie réorganise les fichiers de la version 19.6 fournie, sans changement volontaire du visuel ou des fonctions. L’archive d’origine reste intacte. Cette copie n’a pas été publiée.

## Où modifier quoi

| Fichier | Rôle |
| --- | --- |
| `index.html` | Structure des écrans et formulaires |
| `css/application.css` | Apparence, adaptation mobile et impression |
| `js/telephone.js` | Mise en forme des numéros de téléphone |
| `js/photos.js` | Photos, stockage IndexedDB et pages photos du PDF |
| `js/rapports.js` | Données des rapports, journées, heures, matériaux, signatures, historique et brouillons |
| `js/pdf.js` | Mise en page du PDF, production et téléchargement |
| `js/clients.js` | Répertoire clients, importation et exportation |
| `js/etapes-rapport.js` | Navigation entre les étapes du formulaire |
| `js/navigation.js` | Navigation entre les grandes sections |
| `js/recherche-clients.js` | Suggestions de clients pendant la saisie |
| `js/installation.js` | Enregistrement du service worker |
| `cloud-sync.js` | Synchronisation existante, conservée telle quelle |
| `service-worker.js` | Cache hors ligne, étendu aux nouveaux fichiers |
| `manifest.webmanifest` et `icons/` | Installation et icônes de l’application |

## Choix de cette première réorganisation

Les neuf blocs JavaScript intégrés au HTML ont été extraits sans modifier leur contenu. Les onze blocs de styles ont été regroupés en respectant leur ordre. Le HTML du corps de page reste identique, hormis les références aux scripts. Le nom du cache a changé pour permettre le chargement de cette structure lors d’une mise à jour.

Les scripts restent classiques et leur ordre de chargement est conservé : ils partagent encore des variables et des fonctions. Ne pas ajouter `async`, `defer` ou `type="module"` sans revoir leurs dépendances. Le noyau `rapports.js` reste regroupé pour cette étape ; isoler davantage les signatures, les journées et le stockage demandera une deuxième refonte avec des tests fonctionnels.

Les noms des données dans localStorage et IndexedDB n’ont pas changé. Sur une autre adresse ou dans un autre navigateur, les données locales existantes ne seront pas automatiquement présentes. Pour un essai indépendant, utiliser des données fictives et laisser la synchronisation déconnectée : elle reste configurée vers le service existant.

## Vérifications réalisées

- Contenu des neuf scripts extraits comparé exactement à l’original.
- Corps HTML vérifié après réinsertion des scripts d’origine.
- Synchronisation comparée octet par octet à l’original.
- Syntaxe des dix scripts chargés et du service worker vérifiée.
- Compatibilité syntaxique de leur portée commune vérifiée.
- Présence de tous les fichiers du cache vérifiée.
- Installation, activation et restitution hors ligne des scripts, du HTML et du CSS simulées avec succès.

Le navigateur et le serveur local de test n’ont pas pu démarrer dans l’environnement de travail. Ces vérifications ne remplacent donc pas une validation réelle du visuel, du PDF, de la synchronisation ou du fonctionnement hors ligne sur iPhone/Mac.

## Avant de remplacer la version utilisée

Tester cette copie sur une adresse d’essai indépendante, avec des données fictives : création d’un rapport, plusieurs journées, heures et matériaux, photos, signature, sauvegarde/rechargement, répertoire clients et PDF. Après une première ouverture en ligne, vérifier aussi la réouverture hors ligne. La synchronisation entre appareils reste à valider dans un cadre de test approprié.

Pour installer ensuite cette version, conserver tous les dossiers et envoyer l’ensemble du contenu du dossier, pas seulement `index.html`. L’application peut rester sur son hébergement habituel ; aucun outil de compilation supplémentaire n’est nécessaire.
