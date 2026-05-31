import { NextResponse } from "next/server";
import { statusFromError, store } from "../../../../lib/server/store";

// Pathologist drafts a report for an order whose results are in.
export async function POST(request: Request) {
  try {
    const tenant = new URL(request.url).searchParams.get("tenant") ?? "lumen";
    const body = await request.json();
    return NextResponse.json(await store.createDraftReport(tenant, body.orderId, body.actor));
  } catch (error) {
    return NextResponse.json({ message: statusFromError(error) }, { status: 400 });
  }
}
