import { getPlansData, savePlans } from "@/lib/plans";
import { checkRateLimit } from "@/lib/rateLimit";
import { requireDevApiResponse } from "@/lib/apiDevOnly";

export const dynamic = "force-static";

export async function GET() {
  try {
    const data = await getPlansData();
    return Response.json(data);
  } catch (error) {
    console.error("Plans fetch error:", error);
    return Response.json(
      { error: "Failed to fetch plans" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function PUT(request: Request) {
  const rateLimitRes = checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;
  const devBlock = requireDevApiResponse();
  if (devBlock) return devBlock;

  try {
    const body = await request.json();
    const data = await savePlans(body);
    return Response.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save";
    console.error("Plans save error:", error);
    return Response.json({ error: message }, { status: 400 });
  }
}
