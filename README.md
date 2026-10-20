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

## Configuration de l'imprimante (ZDesigner ZD420 300 dpi ZPL)

- **Options** : portrait, largeur/hauteur = taille du type d'étiquette, zones non imprimables à 0.
- **Réglages avancés** : mode opératoire *Massicot* ; support *Transfert thermique* (papier + ruban) ou *Thermique direct* ; détection *Continu* (longueur automatique), *Détection Web* (étiquettes à espaces) ou *Marque* ; ajustements à 0 ; *Calibrer*.
- **Tramage** : essayer « Aucun ».
- **Chrome** : même papier, marges « Aucune », échelle 100 %.

## Étiquettes de disjoncteurs (feuille à découper)

- Mode « feuille » : ruban de **2 po verrouillé**, longueur **≥ 3 po** (zone minimale du ruban 3" × 2"), réparti en 2 à 6 sections égales
  (3 sections ≈ 0,667 po, 4 sections = 0,5 po) ou en hauteurs personnalisées ; traits de coupe pour les ciseaux.
- Chaque section : pastille d'ampérage, titre, ligne « pièce · usage · positions » et pastilles (tags).
- Lecture d'un panneau depuis un fichier JSON (format `GestionPanneauSiemens`) ou depuis l'API : voir [docs/api-panneaux.md](docs/api-panneaux.md).

## Étiquettes de gallons de peinture

- Gabarit fourni **Peinture — identification de gallon** (papier 2 po × 3 po, créé au besoin) : nom de la couleur, code (et nom anglais), marque et produit, fini, base, code produit, date de mélange, format, formule de teinte, pièces et surfaces, code-barres Code 128 du code couleur.
- Bouton **🎨 Registre de peinture (JSON)** de la liste d'impression : charge un registre exporté (`houses` → `rooms` → `surfaces`) depuis un fichier ou du texte collé.
  Une étiquette par peinture distincte (pièces regroupées) ou par pièce et surface ; filtres par type de surface et « en stock » ; code produit, base, format, date de mélange, formule et nom anglais sont retrouvés dans les notes.
