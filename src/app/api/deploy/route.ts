import { spawn } from "child_process";
import path from "path";
import { checkRateLimit } from "@/lib/rateLimit";
import { requireDevApiResponse } from "@/lib/apiDevOnly";

const SCRIPTS: Record<string, string> = {
  uploads: "deploy-uploads.sh",
  static: "deploy-static.sh",
};

const EXIT_MARKER = "__DEPLOY_EXIT_CODE__";

export async function POST(request: Request) {
  const rateLimitRes = checkRateLimit(request);
  if (rateLimitRes) return rateLimitRes;
  const devBlock = requireDevApiResponse();
  if (devBlock) return devBlock;

  const body = (await request.json().catch(() => null)) as { target?: string } | null;
  const target = body?.target;

  if (!target || !(target in SCRIPTS)) {
    return Response.json(
      { error: "Invalid target. Use 'uploads' or 'static'." },
      { status: 400 }
    );
  }

  const scriptPath = path.join(process.cwd(), "scripts", SCRIPTS[target]);

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      // NODE_ENV=development iz next dev procesa ne smije procuriti u "npm run
      // build" unutar deploy-static.sh – to miješa dev/prod React bundle i
      // ruši export ("Cannot read properties of null (reading 'useContext')").
      const child = spawn(scriptPath, [], {
        cwd: process.cwd(),
        env: { ...process.env, NODE_ENV: "production" },
      });

      child.stdout.on("data", (chunk) => controller.enqueue(encoder.encode(chunk.toString())));
      child.stderr.on("data", (chunk) => controller.enqueue(encoder.encode(chunk.toString())));

      child.on("error", (err) => {
        controller.enqueue(encoder.encode(`\n❌ Failed to start script: ${err.message}\n`));
        controller.enqueue(encoder.encode(`\n${EXIT_MARKER}:1\n`));
        controller.close();
      });

      child.on("close", (code) => {
        controller.enqueue(encoder.encode(`\n${EXIT_MARKER}:${code ?? 1}\n`));
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
