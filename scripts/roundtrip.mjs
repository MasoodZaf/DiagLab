const B = "http://localhost:3100/api/workflow";
const actor = (role, displayName) => ({ id: role, tenantId: "tenant_lumen", role, displayName, capabilities: [] });
const PHLEB = actor("phlebotomist", "Bilal Ahmed");
const TECH = actor("technician", "Usman Tariq");
const PATH = actor("pathologist", "Dr. Mehak Ali");
const REC = actor("receptionist", "Sana Waheed");

async function post(path, body) {
  const r = await fetch(B + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, msg: j.message ?? JSON.stringify(j).slice(0, 140) };
}
async function patch(path, body) {
  const r = await fetch(B + path, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, msg: j.message ?? JSON.stringify(j).slice(0, 140) };
}
const mark = (r) => (r.ok ? "✅" : "🛑");

const snap = await (await fetch(`${B}/snapshot?tenant=lumen`)).json();
const s = snap.snapshot ?? snap;
const order = s.orders.find((o) => o.orderNumber === "LM-2026-5003");
const sam = s.samples.find((x) => x.orderId === order.id);
const inv = s.invoices.find((x) => x.orderId === order.id);
console.log(`new order ${order.orderNumber} | sample ${sam.barcode} (${sam.status}) | invoice ${inv.invoiceNumber} ${inv.currency} ${inv.totalAmount}\n`);

const trans = async (a, next) => {
  const r = await patch(`/samples/${sam.id}?tenant=lumen`, { actor: a, nextStatus: next });
  console.log(`  ${mark(r)} ${a.role} → ${next}: ${r.msg}`);
};

console.log("Sample state-machine round trips:");
await trans(PHLEB, "collected");
await trans(PHLEB, "in_transit");
await trans(TECH, "received");
await trans(TECH, "processing");
await trans(TECH, "completed");
await trans(PATH, "verified");

console.log("\nGuardrail — illegal transition (technician verified→released):");
await trans(TECH, "released");

console.log("\nBilling round trip:");
const pay = await post(`/invoices/${inv.id}/payments?tenant=lumen`, { actor: REC, amount: inv.totalAmount });
console.log(`  ${mark(pay)} ${pay.msg}`);

const final = await (await fetch(`${B}/snapshot?tenant=lumen`)).json();
const fs = final.snapshot ?? final;
const fsam = fs.samples.find((x) => x.id === sam.id);
const finv = fs.invoices.find((x) => x.id === inv.id);
console.log(`\nFinal: sample ${fsam.barcode}=${fsam.status} | invoice ${finv.invoiceNumber}=${finv.status} (paid ${finv.paidAmount}/${finv.totalAmount}) | audit events=${fs.auditLogs.length}`);
