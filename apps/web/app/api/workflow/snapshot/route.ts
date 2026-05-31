import { NextResponse } from "next/server";
import { store } from "../../../../lib/server/store";

export async function GET(request: Request) {
  const tenant = new URL(request.url).searchParams.get("tenant") ?? "lumen";
  return NextResponse.json({ snapshot: await store.getSnapshot(tenant) });
}
