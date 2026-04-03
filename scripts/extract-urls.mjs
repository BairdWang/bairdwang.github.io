import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const pj = fs.readFileSync(path.join(root, "projects.json"), "utf8");
const re = /https:\/\/cdn\.myportfolio\.com[^"\s)]+/g;
const set = new Set();
for (const m of html.matchAll(re)) set.add(m[0]);
for (const m of pj.matchAll(re)) set.add(m[0]);
const urls = [...set].sort();
fs.writeFileSync(path.join(__dirname, "_urls.json"), JSON.stringify(urls, null, 2));
console.log("unique URLs:", urls.length);
