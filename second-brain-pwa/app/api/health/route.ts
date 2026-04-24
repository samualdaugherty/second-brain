import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function parseAllowedOrigins(): string[] {
  const list = process.env.ALLOWED_ORIGINS;
  if (list) {
    return list
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  const single = process.env.ALLOWED_ORIGIN;
  return single ? [single] : [];
}

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  }

  const bridgeUrl = process.env.NEXT_PUBLIC_BRIDGE_URL;
  const apiKey = process.env.BRIDGE_API_KEY;
  const allowedOrigins = parseAllowedOrigins();

  if (!bridgeUrl || !apiKey) {
    return NextResponse.json({ status: "unconfigured" }, { status: 500 });
  }

  // Optional temporary hardening until auth is added.
  // If ALLOWED_ORIGIN is set, browser requests from other origins are blocked.
  const origin = req.headers.get("origin");
  if (allowedOrigins.length > 0 && origin && !allowedOrigins.includes(origin)) {
    return NextResponse.json({ status: "forbidden" }, { status: 403 });
  }

  try {
    const res = await fetch(`${bridgeUrl}/health`, {
      headers: { "x-api-key": apiKey },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      return NextResponse.json({ status: "ok" });
    }
    return NextResponse.json({ status: "error" }, { status: res.status });
  } catch {
    return NextResponse.json({ status: "offline" }, { status: 503 });
  }
}
