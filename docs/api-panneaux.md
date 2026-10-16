# API des panneaux électriques

Permet à un site externe (ex. `gestion-panneau-siemens`) de **téléverser** les circuits d'un panneau.
L'application d'étiquettes les **lit ensuite** (bouton « 🔌 Disjoncteurs ») pour générer les feuilles à imprimer.

## Configuration (Vercel → projet de l'application d'étiquettes → Settings → Environment Variables)

| Variable | Rôle |
|---|---|
| `FIREBASE_DB_URL` | déjà configurée (base partagée) |
| `PANELS_API_KEY` | **clé secrète** exigée pour envoyer / supprimer un panneau. Valeur longue et aléatoire, par ex. `openssl rand -hex 24` |
| `PANELS_ALLOWED_ORIGINS` | (optionnel) origines autorisées pour CORS, séparées par des virgules. Défaut : `https://gestion-panneau-siemens.vercel.app` |

Sans `PANELS_API_KEY`, l'écriture répond `503` (la lecture reste possible). Redéployer après avoir ajouté la variable.

## Routes

| Méthode | URL | Clé | Rôle |
|---|---|---|---|
| `GET` | `/api/panels` | non | liste `[{id, name, count, updatedAt}]` |
| `GET` | `/api/panels?id=siemens-eq` | non | panneau complet |
| `POST` (ou `PUT`) | `/api/panels` | **oui** | téléverse / remplace un panneau |
| `DELETE` | `/api/panels?id=siemens-eq` | **oui** | supprime un panneau |

La clé se transmet par l'en-tête `x-api-key: …` (ou `Authorization: Bearer …`).
L'identifiant du panneau vient de `id` s'il est fourni, sinon du nom du panneau (`"Siemens EQ"` → `siemens-eq`).

## Corps du POST

Le JSON exporté par le site (schéma 2) est accepté tel quel :

```json
{
  "schema": 2, "panel": "Siemens EQ", "mainAmps": 200, "visiblePositions": 32,
  "circuits": [
    { "id": "15-17", "amps": 30, "room": "Rez-de-chaussée", "usage": "Électroménager",
      "label": "Sécheuse", "slots": ["15A","15B","17A","17B"], "status": "Identifié",
      "tags": { "devices": ["Sécheuse"], "functions": ["Électroménager"], "locations": ["Rez-de-chaussée"] } }
  ]
}
```

Champs utilisés pour l'étiquette : `amps` (pastille), `label` (titre), `room` · `usage` · `slots` (ligne secondaire), `tags.locations` / `functions` / `devices` (pastilles).
Un tableau de circuits seul est aussi accepté. Limites : 400 circuits, 400 Ko.

## Exemples

```bash
curl -X POST https://VOTRE-APPLICATION/api/panels \
  -H "Content-Type: application/json" -H "x-api-key: $PANELS_API_KEY" \
  --data-binary @GestionPanneauSiemens-2026-10-15-2303.json
```

Depuis le navigateur du site (CORS autorisé pour l'origine configurée) :

```js
const r = await fetch("https://VOTRE-APPLICATION/api/panels", {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-api-key": CLE },
  body: JSON.stringify(exportJson),
});
const { id } = await r.json();
window.open("https://VOTRE-APPLICATION/etiquettes.html#panel=" + id); // ouvre l'import déjà chargé
```

⚠ Une clé placée dans du code exécuté dans le navigateur est visible de tous les visiteurs du site.
Préférer une petite fonction serveur sur le site (clé dans ses variables d'environnement) :

```js
// api/envoyer-etiquettes.js  (projet gestion-panneau-siemens)
module.exports = async (req, res) => {
  const r = await fetch(process.env.ETIQUETTES_URL + "/api/panels", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.ETIQUETTES_API_KEY },
    body: JSON.stringify(req.body),
  });
  res.status(r.status).json(await r.json());
};
```

## Remarque : protection Vercel

Si le projet est protégé par « Vercel Authentication », les appels d'un autre site reçoivent une page de connexion
au lieu de la réponse de l'API. Utiliser le domaine de production personnalisé, ou désactiver la protection pour ce projet.

## Lecture directe privée par UID (nouveau)
Dans « 🔌 Disjoncteurs », renseigner l'UID `siemens-eq` et la clé privée de connexion à GestionPanneauSiemens, puis cliquer « Charger en direct ». Le navigateur envoie temporairement ces valeurs au proxy ZebraHD `POST /api/panel-live`, qui appelle `GET https://gestion-panneau-siemens.vercel.app/api/panel-live?id=siemens-eq` avec `Authorization: Bearer <clé privée du panneau>`. Le serveur du panneau lit les circuits sauvegardés dans Neon; aucune copie Firebase n'est créée dans ce parcours. La clé n'est ni mémorisée ni placée dans le lien.

Cette lecture exige une authentification : connaître l'UID seul ne suffit pas. Vérifier la protection Vercel entre serveurs : si le domaine du panneau est protégé par Vercel Authentication, utiliser un domaine personnalisé autorisé pour cette route, sans ouvrir publiquement les données. Les anciens `GET /api/panels` de ZebraHD restent publics et fournissent les copies déjà téléversées via l'ancien parcours.

## Correctif Firebase (2026-10-15)
L'API conserve maintenant les panneaux sous `zebrahd/panels/{id}` dans Firebase Realtime Database, afin de respecter les règles d'accès documentées pour le nœud `zebrahd`. Un refus Firebase renvoie une erreur spécifique plutôt que le message générique « Erreur base de données ». Les panneaux anciens éventuellement stockés dans `zebrahd_panels` ne sont pas migrés automatiquement. Les routes de copie `GET /api/panels` restent sans authentification; la lecture directe privée par UID utilise la route séparée `api/panel-live`.
