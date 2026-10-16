// Utilitaires partagés (le préfixe « _ » empêche Vercel d'exposer ce fichier comme route).
const str = (v, n) => String(v == null ? "" : v).slice(0, n);
const arr = (v, n, m) => (Array.isArray(v) ? v.slice(0, n).map((x) => str(x, m).trim()).filter(Boolean) : []);

// Normalise un circuit (format « GestionPanneauSiemens », schéma 2).
function cleanCircuit(c) {
  if (!c || typeof c !== "object") return null;
  const t = c.tags && typeof c.tags === "object" ? c.tags : {};
  const out = {
    id: str(c.id, 30),
    amps: Math.max(0, Math.min(9999, +c.amps || 0)),
    room: str(c.room, 60),
    usage: str(c.usage, 60),
    label: str(c.label || c.originalLabel, 200),
    status: str(c.status, 30),
    notes: str(c.notes, 400),
    exceptions: str(c.exceptions, 300),
    slots: arr(c.slots, 12, 10),
    tags: { devices: arr(t.devices, 20, 60), functions: arr(t.functions, 20, 60), locations: arr(t.locations, 20, 60) },
  };
  return out.id || out.label ? out : null;
}

// Accepte {panel, circuits:[…]} ou directement un tableau de circuits.
function normalizePanel(b) {
  const list = Array.isArray(b) ? b : b && b.circuits;
  if (!Array.isArray(list)) return null;
  const circuits = list.slice(0, 400).map(cleanCircuit).filter(Boolean);
  const o = Array.isArray(b) ? {} : b;
  return {
    name: str(o.panel || o.name || "Panneau", 80).trim() || "Panneau",
    mainAmps: Math.max(0, +o.mainAmps || 0),
    visiblePositions: Math.max(0, +o.visiblePositions || 0),
    circuits,
  };
}

function slug(s) {
  const t = String(s || "panneau")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return t || "panneau";
}

// Surcharges propres à un circuit (contenu individuel de l'étiquette).
function cleanCircuitOv(o) {
  if (!o || typeof o !== "object") return undefined;
  const r = {};
  const pick = (v, list) => (list.includes(v) ? v : undefined);
  r.badge = pick(o.badge, ["amps", "id", "both", "text", "none"]);
  r.badgeR = pick(o.badgeR, ["same", "amps", "id", "both", "text", "none"]);
  r.pos = pick(o.pos, ["left", "right", "both", "none"]);
  ["badgeText", "badgeTextR"].forEach((k) => { if (typeof o[k] === "string") r[k] = o[k].slice(0, 12); });
  ["title", "sub"].forEach((k) => { if (typeof o[k] === "string") r[k] = o[k].slice(0, 200); });
  if (typeof o.chips === "boolean") r.chips = o.chips;
  if (Array.isArray(o.hideTags)) { const h = o.hideTags.slice(0, 40).map((x) => str(x, 60).trim()).filter(Boolean); if (h.length) r.hideTags = h; }
  Object.keys(r).forEach((k) => r[k] === undefined && delete r[k]);
  return Object.keys(r).length ? r : undefined;
}

// Configuration de la feuille de disjoncteurs enregistrée dans un modèle ou une ligne de liste.
function cleanSheet(s) {
  if (!s || typeof s !== "object") return undefined;
  return {
    on: !!s.on,
    n: Math.max(1, Math.min(8, +s.n || 3)),
    heights: str(s.heights, 80),
    len: Math.max(3, Math.min(40, +s.len || 3)),
    gap: Math.max(0, Math.min(8, Math.round((+s.gap || 0) * 10) / 10)),
    badge: ["amps", "id", "both"].includes(s.badge) ? s.badge : "amps",
    badgePos: ["left", "right", "both", "none"].includes(s.badgePos) ? s.badgePos : "left",
    badgeR: ["same", "amps", "id", "both"].includes(s.badgeR) ? s.badgeR : "same",
    frame: ["round", "square", "none"].includes(s.frame) ? s.frame : "round",
    tall: s.tall !== false,
    hideTags: Array.isArray(s.hideTags) ? s.hideTags.slice(0, 60).map((x) => str(x, 60).trim()).filter(Boolean) : undefined,
    hs: Array.isArray(s.hs) ? s.hs.slice(0, 12).map(Number).filter((n) => n > 0 && n <= 3) : undefined,
    chips: s.chips !== false,
    slots: s.slots !== false,
    room: s.room !== false,
    usage: s.usage !== false,
    cuts: s.cuts !== false,
    circuits: Array.isArray(s.circuits)
      ? s.circuits.slice(0, 400).map((c) => { const x = cleanCircuit(c); if (!x) return null; const ov = cleanCircuitOv(c && c.ov); if (ov) x.ov = ov; if (c && Number.isFinite(+c.ord)) x.ord = Math.max(0, Math.min(9999, Math.floor(+c.ord))); return x; }).filter(Boolean)
      : [],
  };
}

module.exports = { cleanCircuit, normalizePanel, slug, cleanSheet, str };
