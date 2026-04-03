/**
 * Regenerates home.contact + home.work from index.html markup and merges
 * optional projects.json overrides into projects from existing site-data.json.
 * Run: node scripts/assemble-site-data.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const siteDataPath = path.join(root, "site-data.json");

function extractHomeWork(html) {
  const items = [];
  const re =
    /data-project="([^"]+)"[\s\S]*?src="([^"]+)"[\s\S]*?alt="([^"]*)"[\s\S]*?<p class="caption">([^<]*)<\/p>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    items.push({
      id: m[1],
      thumb: m[2],
      alt: m[3] || "",
      caption: m[4].trim()
    });
  }
  return items;
}

function extractContact(html) {
  const ledeRe = /<p class="contact-lede">\s*([\s\S]*?)\s*<\/p>/;
  const emailRe = /id="contact-email-text">([^<]+)</;
  const lm = html.match(ledeRe);
  const em = html.match(emailRe);
  return {
    lede: lm ? lm[1].trim() : "",
    email: em ? em[1].trim() : ""
  };
}

let pj = {};
try {
  pj = JSON.parse(fs.readFileSync(path.join(root, "projects.json"), "utf8"));
} catch {
  /* optional */
}

if (!fs.existsSync(siteDataPath)) {
  console.error("Missing site-data.json — copy from repo or restore backup.");
  process.exit(1);
}

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const existing = JSON.parse(fs.readFileSync(siteDataPath, "utf8"));
const projects = { ...existing.projects };

for (const k of Object.keys(pj)) {
  if (!projects[k]) projects[k] = {};
  projects[k] = { ...projects[k], ...pj[k] };
}

const siteData = {
  version: existing.version || 1,
  site: existing.site || { headerName: "Baird Wang" },
  home: {
    contact: extractContact(html),
    work: extractHomeWork(html).length ? extractHomeWork(html) : existing.home.work
  },
  projects
};

fs.writeFileSync(siteDataPath, JSON.stringify(siteData, null, 2));
console.log("Updated site-data.json (home from index if work triggers found; projects merged).");
