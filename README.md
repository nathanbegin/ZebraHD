# ZebraHD

Application web (un seul fichier, fonctionne hors ligne) pour imprimer des étiquettes de prix et des codes-barres sur imprimante Zebra.

- Ouvrir `etiquettes.html` dans Chrome ou Edge.
- Gestion de types d'étiquettes (dimensions, couleur).
- Texte en Arial, codes-barres Code 128 / Code 39 / EAN-13 / UPC-A.
- Séries séquentielles (préfixe, numéro, suffixe) et texte personnalisable sous le code.
- Impression : choisir l'imprimante Zebra, le papier de la même taille que l'étiquette, marges « Aucune », échelle 100 %.

## Base de données (optionnel, Vercel)

Les types d'étiquettes et les modèles sont partagés entre les ordinateurs via une base Redis (Upstash) :

1. Dans le projet Vercel : **Storage → Create Database / Marketplace → Upstash Redis**, puis le connecter au projet.
2. Redéployer. Les variables `KV_REST_API_URL` et `KV_REST_API_TOKEN` sont ajoutées automatiquement.
3. L'indicateur « ☁ Synchronisé » apparaît dans la carte Modèles. Sans base, l'application reste en mode local (données dans le navigateur).

La fonction serveur est dans `api/data.js`. Il n'y a aucune protection d'accès : toute personne ayant le lien peut modifier la liste.
