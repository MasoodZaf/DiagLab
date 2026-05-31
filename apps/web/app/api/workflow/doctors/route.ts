import { NextResponse } from "next/server";
import { statusFromError, store } from "../../../../lib/server/store";

// Lab Admin adds a consultant to the reporting panel.
export async function POST(request: Request) {
  try {
    const tenant = new URL(request.url).searchParams.get("tenant") ?? "lumen";
    const body = await request.json();
    return NextResponse.json(
      await store.addDoctor(tenant, {
        actor: body.actor,
        name: body.name,
        specialty: body.specialty,
        qualification: body.qualification,
        outletIds: body.outletIds
      })
    );
  } catch (error) {
    return NextResponse.json({ message: statusFromError(error) }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const tenant = new URL(request.url).searchParams.get("tenant") ?? "lumen";
  return NextResponse.json({ doctors: await store.listDoctors(tenant) });
}
