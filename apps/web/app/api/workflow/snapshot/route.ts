import { NextResponse } from "next/server";
import { workflowStore } from "../../../../lib/server/workflow-store";

export function GET(request: Request) {
  const tenant = new URL(request.url).searchParams.get("tenant") ?? "lumen";
  return NextResponse.json({ snapshot: workflowStore.getSnapshot(tenant) });
}
