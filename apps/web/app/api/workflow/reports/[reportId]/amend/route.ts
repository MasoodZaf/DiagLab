import { NextResponse } from "next/server";
import { statusFromError, store } from "../../../../../../lib/server/store";

type RouteContext = {
  params: Promise<{
    reportId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const tenant = new URL(request.url).searchParams.get("tenant") ?? "lumen";
    const { reportId } = await context.params;
    const body = await request.json();
    return NextResponse.json(await store.amendReport(tenant, reportId, body.note, body.actor));
  } catch (error) {
    return NextResponse.json({ message: statusFromError(error) }, { status: 400 });
  }
}
