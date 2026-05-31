import { NextResponse } from "next/server";
import { statusFromError, store } from "../../../../lib/server/store";

// Demo-only: wipes workflow + org state and re-seeds clean from the fixtures.
// Not a real data-management endpoint — exists so the demo never gets stuck.
export async function POST() {
  try {
    await store.reset();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, message: statusFromError(error) }, { status: 500 });
  }
}
