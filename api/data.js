// Fonction Vercel : lecture / écriture des types d'étiquettes et des modèles
// dans une base Firebase Realtime Database (gratuite, via l'API REST).
// Variable d'environnement requise : FIREBASE_DB_URL
//   ex. https://mon-projet-default-rtdb.firebaseio.com
// Optionnelle : FIREBASE_DB_SECRET (secret de la base, si les règles ne sont pas publiques)
const DB = (process.env.FIREBASE_DB_URL || "").trim().replace(/\/+$/, "");
const SECRET = process.env.FIREBASE_DB_SECRET || "";
const MAX_BYTES = 800000;

const dbUrl = () => DB + "/zebrahd.json" + (SECRET ? "?auth=" + encodeURIComponent(SECRET) : "");

function cleanStock(x) {
  if (!x || typeof x.name !== "string" || !(+x.w > 0) || !(+x.h > 0)) return null;
  return {
    id: String(x.id || "").slice(0, 40),
    name: x.name.slice(0, 120),
    w: +x.w,
    h: +x.h,
    u: x.u === "mm" ? "mm" : "in",
    color: /^#[0-9a-f]{6}$/i.test(x.color) ? x.color : "#ffffff",
    adh: x.adh !== false,
  };
}

function cleanDesign(d) {
  if (!d || typeof d !== "object") return {};
  if (Array.isArray(d.images)) {
    d.images = d.images
      .filter((im) => im && typeof im.src === "string" && /^data:image\/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+\/=]+$/.test(im.src))
      .map((im) => ({ ...im, x: +im.x || 0, y: +im.y || 0, w: +im.w || 10, iw: +im.iw || 1, ih: +im.ih || 1, rot: +im.rot || 0, id: String(im.id || "") }));
  }
  return d;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!/^https:\/\//.test(DB)) return res.status(503).json({ error: "Base de données non configurée" });
  try {
    if (req.method === "GET") {
      const r = await fetch(dbUrl());
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      // Les données sont stockées sous forme de texte JSON (évite que Firebase déforme les tableaux vides).
      return res.status(200).json(j && typeof j.data === "string" ? JSON.parse(j.data) : { stocks: [], templates: [], lists: [] });
    }
    if (req.method === "PUT") {
      let b = req.body;
      if (typeof b === "string") b = JSON.parse(b);
      if (!b || !Array.isArray(b.stocks) || !Array.isArray(b.templates)) {
        return res.status(400).json({ error: "Format invalide" });
      }
      const data = {
        stocks: b.stocks.slice(0, 200).map(cleanStock).filter((s) => s && s.id),
        templates: b.templates
          .slice(0, 500)
          .filter((t) => t && typeof t.name === "string" && t.design && typeof t.design === "object")
          .map((t) => ({ id: String(t.id || "").slice(0, 40), name: t.name.slice(0, 120), folder: String(t.folder || "").slice(0, 60), stockId: String(t.stockId || ""), design: cleanDesign(t.design) })),
      };
      if (Array.isArray(b.lists)) {
        data.lists = b.lists
          .slice(0, 200)
          .filter((l) => l && typeof l.name === "string" && Array.isArray(l.items))
          .map((l) => ({
            id: String(l.id || "").slice(0, 40),
            name: l.name.slice(0, 120),
            items: l.items
              .slice(0, 200)
              .filter((i) => i && i.design && typeof i.design === "object")
              .map((i) => ({
                id: String(i.id || "").slice(0, 40),
                tplId: i.tplId ? String(i.tplId).slice(0, 40) : null,
                name: String(i.name || "").slice(0, 120),
                stockId: String(i.stockId || ""),
                design: cleanDesign(i.design),
                copies: Math.max(1, Math.min(500, +i.copies || 1)),
              })),
          }));
      }
      const str = JSON.stringify(data);
      if (str.length > MAX_BYTES) return res.status(413).json({ error: "Trop volumineux" });
      const r = await fetch(dbUrl(), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: str }),
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return res.status(200).json({ ok: true });
    }
    res.setHeader("Allow", "GET, PUT");
    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: "Erreur base de données" });
  }
};
