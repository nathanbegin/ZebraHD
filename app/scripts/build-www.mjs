// Prépare le dossier www/ de l'application Android à partir de la version mobile du dépôt.
import { mkdirSync, rmSync, copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, "..");
const root = join(app, "..");
const www = join(app, "www");
rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });

// Client Bluetooth natif (plugin Capacitor) empaqueté en un seul fichier.
await build({ entryPoints: [join(app, "src", "native-ble.js")], bundle: true, format: "iife", minify: true, outfile: join(www, "native-ble.js"), logLevel: "warning" });

// mobile.html : même page que le site, avec le client Bluetooth natif chargé avant le script principal.
let html = readFileSync(join(root, "mobile.html"), "utf8");
const marker = '<script>\n"use strict";';
if (!html.includes(marker)) throw new Error("Point d'insertion introuvable dans mobile.html");
html = html.replace(marker, '<script src="native-ble.js"></script>\n' + marker);
writeFileSync(join(www, "index.html"), html);
for (const f of ["logo.png", "icon-192.png", "icon-512.png", "manifest.webmanifest"]) copyFileSync(join(root, f), join(www, f));
// version.json : numéro de version + date de construction + commit (affichés dans Imprimante > À propos).
const ver = JSON.parse(readFileSync(join(root, "version.json"), "utf8"));
let commit = (process.env.GITHUB_SHA || "").slice(0, 7);
if (!commit) { try { commit = execSync("git rev-parse --short HEAD", { cwd: root }).toString().trim(); } catch { commit = ""; } }
writeFileSync(join(www, "version.json"), JSON.stringify({ ...ver, build: new Date().toISOString(), commit }, null, 2));
console.log("www/ prêt — version " + ver.version + " (" + ver.code + ")" + (commit ? " · " + commit : ""));
