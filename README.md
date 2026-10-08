# ZebraHD

Application web (un seul fichier, fonctionne hors ligne) pour imprimer des étiquettes de prix et des codes-barres sur imprimante Zebra.

- Ouvrir `etiquettes.html` dans Chrome ou Edge.
- Gestion de types d'étiquettes (dimensions, couleur).
- Texte en Arial, codes-barres Code 128 / Code 39 / EAN-13 / UPC-A.
- Séries séquentielles (préfixe, numéro, suffixe) et texte personnalisable sous le code.
- Impression : choisir l'imprimante Zebra, le papier de la même taille que l'étiquette, marges « Aucune », échelle 100 %.

## Base de données (optionnel, Firebase)

Les types d'étiquettes et les modèles sont partagés entre les ordinateurs via Firebase Realtime Database (offre gratuite) :

1. Sur console.firebase.google.com : créer un projet, puis **Build → Realtime Database → Create Database**.
2. Onglet **Rules** : remplacer par `{ "rules": { "zebrahd": { ".read": true, ".write": true } } }` puis Publish.
3. Copier l'adresse de la base (ex. `https://mon-projet-default-rtdb.firebaseio.com`).
4. Dans Vercel (projet → Settings → Environment Variables) : ajouter `FIREBASE_DB_URL` avec cette adresse, puis redéployer.
5. L'indicateur « ☁ Synchronisé » apparaît dans la carte Modèles. Sans base, l'application reste en mode local.

La fonction serveur est dans `api/data.js`. Aucune protection d'accès : toute personne ayant le lien peut modifier la liste.
