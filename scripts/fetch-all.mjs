import fs from "fs";
import https from "https";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const urls = JSON.parse(fs.readFileSync(path.join(__dirname, "_urls.json"), "utf8"));
const outDir = path.join(root, "assets", "img");

function fileNameFromUrl(u) {
  try {
    const p = new URL(u).pathname;
    const base = path.basename(p);
    const clean = base.replace(/[^a-zA-Z0-9._-]/g, "_");
    return clean || "image.bin";
  } catch {
    return "image.bin";
  }
}

function fetchBuf(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    lib
      .get(url, { headers: { "User-Agent": "baird.github.io-asset-migration" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = new URL(res.headers.location, url).href;
          res.resume();
          return fetchBuf(next).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error("HTTP " + res.statusCode + " " + url));
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const map = {};
  const used = new Set();
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    let fname = fileNameFromUrl(url);
    let n = 0;
    let finalName = fname;
    while (used.has(finalName)) {
      n++;
      const ext = path.extname(fname) || "";
      const stem = ext ? fname.slice(0, -ext.length) : fname;
      finalName = stem + "-" + n + ext;
    }
    fname = finalName;
    used.add(fname);
    const finalDest = path.join(outDir, fname);
    process.stdout.write("[" + (i + 1) + "/" + urls.length + "] " + fname + " ... ");
    try {
      const buf = await fetchBuf(url);
      fs.writeFileSync(finalDest, buf);
      map[url] = "assets/img/" + fname.replace(/\\/g, "/");
      console.log(buf.length + " bytes");
    } catch (e) {
      console.log("FAIL", e.message);
      throw e;
    }
  }
  fs.writeFileSync(path.join(__dirname, "url-map.json"), JSON.stringify(map, null, 2));
  console.log("Wrote scripts/url-map.json and", urls.length, "files under assets/img/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
