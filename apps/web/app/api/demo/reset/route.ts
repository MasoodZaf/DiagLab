import { NextResponse } from "next/server";
import { workflowStore } from "../../../../lib/server/workflow-store";

// Demo-only: clears persisted workflow state so all surfaces reseed clean.
// Not a real data-management endpoint — exists so the demo never gets stuck.
export async function POST() {
  workflowStore.reset();
  return NextResponse.json({ ok: true });
}
