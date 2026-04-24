import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const ipRequestLog = new Map<string, number[]>();

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return req.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const recent = (ipRequestLog.get(ip) || []).filter((ts) => ts > cutoff);
  recent.push(now);
  ipRequestLog.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX_REQUESTS;
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const bridgeUrl = process.env.NEXT_PUBLIC_BRIDGE_URL;
  const apiKey = process.env.BRIDGE_API_KEY;
  const allowedOrigin = process.env.ALLOWED_ORIGIN;

  if (!bridgeUrl || !apiKey) {
    return NextResponse.json(
      { error: "Bridge server not configured." },
      { status: 500 }
    );
  }

  const origin = req.headers.get("origin");
  if (allowedOrigin && origin && origin !== allowedOrigin) {
    return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  }

  if (isRateLimited(getClientIp(req))) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  let message: string;
  try {
    const body = await req.json();
    message = body.message;
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Invalid message." }, { status: 400 });
    }
    if (message.length > 4000) {
      return NextResponse.json(
        { error: "Message exceeds 4000 characters." },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  let bridgeResponse: Response;
  try {
    bridgeResponse = await fetch(`${bridgeUrl}/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ message }),
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    return NextResponse.json(
      { error: "Cannot reach Gary's home base." },
      { status: 503 }
    );
  }

  if (!bridgeResponse.ok) {
    return NextResponse.json(
      { error: `Bridge error: ${bridgeResponse.status}` },
      { status: bridgeResponse.status }
    );
  }

  if (!bridgeResponse.body) {
    return NextResponse.json({ error: "Empty response from bridge." }, { status: 502 });
  }

  // Pipe the SSE stream straight through to the client
  return new Response(bridgeResponse.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
