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

// Configuration de la feuille de disjoncteurs enregistrée dans un modèle ou une ligne de liste.
function cleanSheet(s) {
  if (!s || typeof s !== "object") return undefined;
  return {
    on: !!s.on,
    n: Math.max(1, Math.min(8, +s.n || 3)),
    heights: str(s.heights, 80),
    len: Math.max(3, Math.min(40, +s.len || 3)),
    badge: ["amps", "id", "both"].includes(s.badge) ? s.badge : "amps",
    chips: s.chips !== false,
    slots: s.slots !== false,
    room: s.room !== false,
    usage: s.usage !== false,
    cuts: s.cuts !== false,
    circuits: Array.isArray(s.circuits) ? s.circuits.slice(0, 400).map(cleanCircuit).filter(Boolean) : [],
  };
}

module.exports = { cleanCircuit, normalizePanel, slug, cleanSheet, str };
