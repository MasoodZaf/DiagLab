const ORIGIN = "http://localhost:3200";
const seeds = [
  "/",
  "/login",
  "/login?lang=ar",
  "/ops?tenant=lumen&role=super_admin",
  "/ops?tenant=lumen&role=receptionist",
  "/ops?tenant=cedar&role=super_admin&lang=ar",
  "/patient?tenant=lumen",
  "/patient?tenant=cedar&lang=ar",
  "/admin?tenant=lumen&role=super_admin",
  "/admin?tenant=lumen&role=receptionist"
];

const visited = new Map(); // url -> status
const queue = [...seeds];
const MAX = 400;

function normalize(href, baseUrl) {
  try {
    if (!href) return null;
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return null;
    const u = new URL(href, baseUrl);
    if (u.origin !== ORIGIN) return null; // skip external
    // keep path + query, drop hash
    return u.pathname + u.search;
  } catch {
    return null;
  }
}

function extractHrefs(html) {
  const hrefs = [];
  const re = /href="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) hrefs.push(m[1].replace(/&amp;/g, "&"));
  return hrefs;
}

let count = 0;
const broken = [];

while (queue.length && count < MAX) {
  const path = queue.shift();
  if (visited.has(path)) continue;
  count++;
  let status = 0;
  let html = "";
  try {
    const res = await fetch(ORIGIN + path, { redirect: "manual" });
    status = res.status;
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("text/html")) html = await res.text();
  } catch (e) {
    status = -1;
  }
  visited.set(path, status);
  if (status < 200 || status >= 400) broken.push({ path, status });
  for (const href of extractHrefs(html)) {
    const n = normalize(href, ORIGIN + path);
    if (n && !visited.has(n) && !queue.includes(n)) queue.push(n);
  }
}

const all = [...visited.entries()].sort();
console.log(`Crawled ${all.length} unique URLs (cap ${MAX}).\n`);
const byStatus = {};
for (const [, s] of all) byStatus[s] = (byStatus[s] || 0) + 1;
console.log("Status summary:", JSON.stringify(byStatus));
console.log("");
if (broken.length === 0) {
  console.log("✅ No broken links — every internal link returned 2xx/3xx.");
} else {
  console.log(`🛑 ${broken.length} problem link(s):`);
  for (const b of broken) console.log(`  [${b.status}] ${b.path}`);
}
console.log("\n--- All crawled paths ---");
for (const [p, s] of all) console.log(`  ${s}  ${p}`);
