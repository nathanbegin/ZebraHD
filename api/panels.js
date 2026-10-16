// API des panneaux électriques : permet à un site externe (ex. gestion-panneau-siemens)
// de téléverser ses circuits, que l'application d'étiquettes vient ensuite lire pour les imprimer.
//
//   GET    /api/panels            → liste des panneaux  [{id,name,count,updatedAt}]
//   GET    /api/panels?id=XXX     → un panneau complet  {id,name,circuits,…}
//   POST   /api/panels            → téléverse / remplace un panneau (clé requise)
//   DELETE /api/panels?id=XXX     → supprime un panneau (clé requise)
//
// Variables d'environnement Vercel :
//   FIREBASE_DB_URL          (déjà utilisée par /api/data)
//   PANELS_API_KEY           clé secrète exigée pour POST / DELETE (en-tête  x-api-key  ou  Authorization: Bearer …)
//   PANELS_ALLOWED_ORIGINS   (optionnel) origines autorisées pour CORS, séparées par des virgules
//                            défaut : https://gestion-panneau-siemens.vercel.app
const crypto = require("crypto");
const { normalizePanel, slug } = require("./_panel.js");

const DB = (process.env.FIREBASE_DB_URL || "").trim().replace(/\/+$/, "");
const SECRET = process.env.FIREBASE_DB_SECRET || "";
const KEY = process.env.PANELS_API_KEY || "";
const ORIGINS = (process.env.PANELS_ALLOWED_ORIGINS || "https://gestion-panneau-siemens.vercel.app")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const MAX_BYTES = 400000;

const dbUrl = (id) => DB + "/zebrahd_panels" + (id ? "/" + encodeURIComponent(id) : "") + ".json" + (SECRET ? "?auth=" + encodeURIComponent(SECRET) : "");

function keyOk(req) {
  if (!KEY) return false;
  const h = req.headers || {};
  let given = h["x-api-key"] || "";
  const auth = h["authorization"] || "";
  if (!given && /^Bearer\s+/i.test(auth)) given = auth.replace(/^Bearer\s+/i, "");
  const a = Buffer.from(String(given));
  const b = Buffer.from(KEY);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function queryId(req) {
  if (req.query && req.query.id) return String(req.query.id);
  try {
    return new URL(req.url, "http://x").searchParams.get("id") || "";
  } catch (e) {
    return "";
  }
}

module.exports = async (req, res) => {
  const origin = req.headers && req.headers.origin;
  if (origin && ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (!/^https:\/\//.test(DB)) return res.status(503).json({ error: "Base de données non configurée" });

  try {
    if (req.method === "GET") {
      const id = queryId(req);
      if (id) {
        const r = await fetch(dbUrl(slug(id)));
        if (!r.ok) throw new Error("HTTP " + r.status);
        const j = await r.json();
        if (!j || typeof j.data !== "string") return res.status(404).json({ error: "Panneau introuvable" });
        return res.status(200).json({ id: slug(id), updatedAt: j.updatedAt || 0, ...JSON.parse(j.data) });
      }
      const r = await fetch(dbUrl());
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = (await r.json()) || {};
      const list = Object.keys(j)
        .map((k) => ({ id: k, name: j[k].name || k, count: j[k].count || 0, updatedAt: j[k].updatedAt || 0 }))
        .sort((x, y) => y.updatedAt - x.updatedAt);
      return res.status(200).json(list);
    }

    if (req.method === "POST" || req.method === "PUT") {
      if (!KEY) return res.status(503).json({ error: "PANELS_API_KEY non configurée sur le serveur" });
      if (!keyOk(req)) return res.status(401).json({ error: "Clé API invalide" });
      let b = req.body;
      if (typeof b === "string") b = JSON.parse(b);
      const p = normalizePanel(b);
      if (!p || !p.circuits.length) return res.status(400).json({ error: "Format invalide : « circuits » (tableau non vide) requis" });
      const id = slug((b && !Array.isArray(b) && b.id) || p.name);
      const data = JSON.stringify(p);
      if (data.length > MAX_BYTES) return res.status(413).json({ error: "Trop volumineux" });
      const rec = { name: p.name, count: p.circuits.length, updatedAt: Date.now(), data };
      const r = await fetch(dbUrl(id), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rec) });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return res.status(200).json({ ok: true, id, name: p.name, count: p.circuits.length, updatedAt: rec.updatedAt });
    }

    if (req.method === "DELETE") {
      if (!KEY) return res.status(503).json({ error: "PANELS_API_KEY non configurée sur le serveur" });
      if (!keyOk(req)) return res.status(401).json({ error: "Clé API invalide" });
      const id = queryId(req);
      if (!id) return res.status(400).json({ error: "Paramètre id requis" });
      const r = await fetch(dbUrl(slug(id)), { method: "DELETE" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return res.status(200).json({ ok: true, id: slug(id) });
    }

    res.setHeader("Allow", "GET, POST, PUT, DELETE, OPTIONS");
    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: "Erreur base de données" });
  }
};
