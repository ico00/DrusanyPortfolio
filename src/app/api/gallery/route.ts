import { getGallery } from "@/lib/getGallery";

export const dynamic = "force-static";

export async function GET() {
  try {
    const gallery = await getGallery();
    return Response.json(gallery);
  } catch (error) {
    console.error("Gallery fetch error:", error);
    return Response.json(
      { error: "Failed to fetch gallery" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
