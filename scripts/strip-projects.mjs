import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
let html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const start = html.indexOf("      var PROJECTS = {");
const endMarker = "      var pageRoot = document.getElementById(\"page-root\");";
const end = html.indexOf(endMarker);
if (start < 0 || end < 0 || end <= start) throw new Error("markers not found");
html = html.slice(0, start) + html.slice(end);
fs.writeFileSync(path.join(root, "index.html"), html);
console.log("Stripped PROJECTS block");
