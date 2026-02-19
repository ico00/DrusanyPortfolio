import exifr from "exifr";
import { hasValidImageSignature } from "@/lib/imageValidation";
import {
  formatDateForInput,
  getExifExtras,
  getExifDescription,
  getKeywords,
} from "@/lib/exif";
import { checkRateLimit } from "@/lib/rateLimit";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export async function POST(request: Request) {
  const rateLimitRes = checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;
  if (process.env.NODE_ENV !== "development") {
    return new Response(
      JSON.stringify({ error: "EXIF preview only available in development" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: "Invalid file type" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return new Response(
        JSON.stringify({
          error: `File too large. Maximum size: ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasValidImageSignature(buffer)) {
      return new Response(
        JSON.stringify({
          error: "Invalid file: not a valid image (magic bytes check failed)",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    let date: string | null = null;
    let description = "";
    let keywords = "";

    let camera: string | null = null;
    let lens: string | null = null;
    let exposure: string | null = null;
    let aperture: string | null = null;
    let iso: number | null = null;

    try {
      const exif = await exifr.parse(buffer, {
        userComment: true,
        makerNote: true,
        xmp: true,
        iptc: true,
        mergeOutput: true,
      });
      const exifDate =
        exif?.DateTimeOriginal ?? exif?.CreateDate ?? exif?.DateTime ?? exif?.ModifyDate;
      if (exifDate) {
        date = formatDateForInput(exifDate);
      }
      if (exif) {
        description = getExifDescription(exif as Record<string, unknown>);
        keywords = getKeywords(exif as Record<string, unknown>);
        const extras = getExifExtras(exif as Record<string, unknown>);
        camera = extras.camera;
        lens = extras.lens;
        exposure = extras.exposure;
        aperture = extras.aperture;
        iso = extras.iso;
      }
    } catch {
      // EXIF parse failed
    }

    return Response.json({
      date,
      description,
      keywords,
      camera,
      lens,
      exposure,
      aperture,
      iso,
    });
  } catch (error) {
    console.error("EXIF preview error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "EXIF read failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
