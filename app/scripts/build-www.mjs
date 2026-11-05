// Prépare le dossier www/ de l'application Android à partir de la version mobile du dépôt.
import { cpSync, mkdirSync, rmSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const www = join(dirname(fileURLToPath(import.meta.url)), "..", "www");
rmSync(www, { recursive: true, force: true });
mkdirSync(www, { recursive: true });
copyFileSync(join(root, "mobile.html"), join(www, "index.html"));
for (const f of ["logo.png", "icon-192.png", "icon-512.png", "manifest.webmanifest"]) copyFileSync(join(root, f), join(www, f));
console.log("www/ prêt");
