// Fonction Vercel : lecture / écriture des types d'étiquettes et des modèles
// dans une base Redis (Upstash, via la Marketplace Vercel).
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = "zebrahd:data";
const MAX_BYTES = 800000;

async function redis(cmd) {
  const r = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || "HTTP " + r.status);
  return j.result;
}

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

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!URL_ || !TOKEN) return res.status(503).json({ error: "Base de données non configurée" });
  try {
    if (req.method === "GET") {
      const v = await redis(["GET", KEY]);
      return res.status(200).json(v ? JSON.parse(v) : { stocks: [], templates: [] });
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
          .map((t) => ({ id: String(t.id || "").slice(0, 40), name: t.name.slice(0, 120), stockId: String(t.stockId || ""), design: t.design })),
      };
      const str = JSON.stringify(data);
      if (str.length > MAX_BYTES) return res.status(413).json({ error: "Trop volumineux" });
      await redis(["SET", KEY, str]);
      return res.status(200).json({ ok: true });
    }
    res.setHeader("Allow", "GET, PUT");
    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: "Erreur base de données" });
  }
};
