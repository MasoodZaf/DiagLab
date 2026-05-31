import { NextResponse } from "next/server";
import { statusFromError, store } from "../../../../lib/server/store";

// Technician enters a new analyzer result for a sample (raises a critical alert
// automatically when flagged critical).
export async function POST(request: Request) {
  try {
    const tenant = new URL(request.url).searchParams.get("tenant") ?? "lumen";
    const body = await request.json();
    return NextResponse.json(
      await store.enterResult(tenant, {
        actor: body.actor,
        sampleId: body.sampleId,
        testName: body.testName,
        value: body.value,
        referenceRange: body.referenceRange,
        abnormal: Boolean(body.abnormal),
        critical: Boolean(body.critical)
      })
    );
  } catch (error) {
    return NextResponse.json({ message: statusFromError(error) }, { status: 400 });
  }
}
