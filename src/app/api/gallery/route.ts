import { getGallery } from "@/lib/getGallery";

export const dynamic = "force-static";

export async function GET() {
  try {
    const gallery = await getGallery();
    return Response.json(gallery);
  } catch (error) {
    console.error("Gallery fetch error:", error);
    return Response.json(
      { images: [] },
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}
