import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const map = JSON.parse(fs.readFileSync(path.join(__dirname, "url-map.json"), "utf8"));

function replaceAll(str) {
  let out = str;
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const url of keys) {
    const local = map[url];
    out = out.split(url).join(local);
  }
  return out;
}

for (const name of ["index.html", "projects.json"]) {
  const p = path.join(root, name);
  let s = fs.readFileSync(p, "utf8");
  s = replaceAll(s);
  fs.writeFileSync(p, s);
  console.log("Updated", name);
}
