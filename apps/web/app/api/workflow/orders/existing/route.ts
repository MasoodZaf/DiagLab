import { NextResponse } from "next/server";
import { statusFromError, store } from "../../../../../lib/server/store";

// Receptionist raises a new order for an already-registered patient.
export async function POST(request: Request) {
  try {
    const tenant = new URL(request.url).searchParams.get("tenant") ?? "lumen";
    const body = await request.json();
    return NextResponse.json(
      await store.createOrderForExistingPatient(tenant, {
        actor: body.actor,
        patientId: body.patientId,
        tests: body.tests,
        totalAmount: body.totalAmount,
        homeCollection: Boolean(body.homeCollection)
      })
    );
  } catch (error) {
    return NextResponse.json({ message: statusFromError(error) }, { status: 400 });
  }
}
