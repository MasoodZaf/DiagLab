import { NextResponse } from "next/server";
import { statusFromError, workflowStore } from "../../../../../../lib/server/workflow-store";

type RouteContext = {
  params: Promise<{
    invoiceId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const tenant = new URL(request.url).searchParams.get("tenant") ?? "lumen";
    const { invoiceId } = await context.params;
    const body = await request.json();
    return NextResponse.json(workflowStore.recordInvoicePayment(tenant, invoiceId, Number(body.amount), body.actor));
  } catch (error) {
    return NextResponse.json({ message: statusFromError(error) }, { status: 400 });
  }
}
