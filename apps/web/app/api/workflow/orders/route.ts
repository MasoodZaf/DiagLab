import { NextResponse } from "next/server";
import { statusFromError, workflowStore } from "../../../../lib/server/workflow-store";

export async function POST(request: Request) {
  try {
    const tenant = new URL(request.url).searchParams.get("tenant") ?? "lumen";
    const body = await request.json();
    return NextResponse.json(
      workflowStore.registerPatientAndOrder(tenant, {
        actor: body.actor,
        fullName: body.fullName,
        phone: body.phone,
        nationalId: body.nationalId,
        tests: body.tests,
        totalAmount: body.totalAmount,
        homeCollection: body.homeCollection
      })
    );
  } catch (error) {
    return NextResponse.json({ message: statusFromError(error) }, { status: 400 });
  }
}
