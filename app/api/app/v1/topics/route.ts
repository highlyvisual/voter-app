import { NextResponse } from "next/server";
import { TOPICS, TOPIC_SHORT } from "@/lib/types";
import type { TopicsResponse } from "@/lib/appApi";

// Phone app, contract v1: the topic list in the website's order (lib/types.ts TOPICS). The order is the website's fixed
// order, not a ranking; ordering by a household's profile is an open question for Romily (round five).
export function GET() {
  const body: TopicsResponse = { ok: true, topics: TOPICS.map(([id, name]) => ({ id, name, short: TOPIC_SHORT[id] ?? name })) };
  return NextResponse.json(body, { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } });
}
