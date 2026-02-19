import { getTheme, saveTheme } from "@/lib/theme";
import type { ThemeConfig } from "@/lib/theme";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-static";

export async function GET() {
  try {
    const theme = await getTheme();
    return Response.json(theme);
  } catch (error) {
    console.error("Theme fetch error:", error);
    return Response.json(
      { error: "Failed to fetch theme" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function PUT(request: Request) {
  const rateLimitRes = checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;
  if (process.env.NODE_ENV !== "development") {
    return Response.json(
      { error: "Only available in development mode" },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as ThemeConfig;
    await saveTheme(body);
    return Response.json(body);
  } catch (error) {
    console.error("Theme save error:", error);
    return Response.json(
      { error: "Failed to save theme" },
      { status: 500 }
    );
  }
}
