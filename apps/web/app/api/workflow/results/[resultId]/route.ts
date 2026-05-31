import { NextResponse } from "next/server";
import { statusFromError, store } from "../../../../../lib/server/store";

type RouteContext = {
  params: Promise<{ resultId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const tenant = new URL(request.url).searchParams.get("tenant") ?? "lumen";
    const { resultId } = await context.params;
    const body = await request.json();
    return NextResponse.json(await store.validateResult(tenant, resultId, body.actor));
  } catch (error) {
    return NextResponse.json({ message: statusFromError(error) }, { status: 400 });
  }
}
