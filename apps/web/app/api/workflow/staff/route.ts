import { NextResponse } from "next/server";
import { statusFromError, store } from "../../../../lib/server/store";

// Lab Admin adds a team member (any operational role).
export async function POST(request: Request) {
  try {
    const tenant = new URL(request.url).searchParams.get("tenant") ?? "lumen";
    const body = await request.json();
    return NextResponse.json(
      await store.addStaff(tenant, {
        actor: body.actor,
        name: body.name,
        role: body.role,
        outletId: body.outletId,
        phone: body.phone,
        email: body.email
      })
    );
  } catch (error) {
    return NextResponse.json({ message: statusFromError(error) }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const tenant = new URL(request.url).searchParams.get("tenant") ?? "lumen";
  return NextResponse.json({ staff: await store.listStaff(tenant) });
}
