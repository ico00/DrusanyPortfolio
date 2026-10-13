"use client";

import { useCallback, useRef, useState } from "react";
import { Rocket, UploadCloud, Loader2, CheckCircle2, XCircle, Terminal } from "lucide-react";

type Target = "uploads" | "static";

const TARGETS: Record<
  Target,
  { label: string; description: string; icon: typeof UploadCloud; confirm?: string }
> = {
  uploads: {
    label: "Upload images",
    description: "rsync public/uploads/ to server",
    icon: UploadCloud,
  },
  static: {
    label: "Deploy site",
    description: "build + git push + rsync to production",
    icon: Rocket,
    confirm: "This builds the site, pushes to the drusany-static repo, and deploys to the production server. Continue?",
  },
};

export default function DeployPanel() {
  const [running, setRunning] = useState<Target | null>(null);
  const [log, setLog] = useState("");
  const [result, setResult] = useState<{ target: Target; ok: boolean } | null>(null);
  const [open, setOpen] = useState(false);
  const logRef = useRef<HTMLPreElement>(null);

  const run = useCallback(async (target: Target) => {
    const cfg = TARGETS[target];
    if (cfg.confirm && !confirm(cfg.confirm)) return;

    setRunning(target);
    setResult(null);
    setLog("");
    setOpen(true);

    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });

      if (!res.body) throw new Error("No response from server");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let exitCode: number | null = null;

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const markerMatch = buffer.match(/__DEPLOY_EXIT_CODE__:(-?\d+)/);
        if (markerMatch) {
          exitCode = Number(markerMatch[1]);
          buffer = buffer.replace(/__DEPLOY_EXIT_CODE__:-?\d+\n?/, "");
        }

        setLog(buffer);
        requestAnimationFrame(() => {
          logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
        });
      }

      setResult({ target, ok: exitCode === 0 });
    } catch (err) {
      setLog((prev) => prev + `\n❌ ${err instanceof Error ? err.message : "Error"}\n`);
      setResult({ target, ok: false });
    } finally {
      setRunning(null);
    }
  }, []);

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-200">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-700">
          <Rocket className="h-4 w-4 text-zinc-300" strokeWidth={2.5} />
        </span>
        Deploy
      </h3>
      <div className="flex flex-wrap gap-3">
        {(Object.entries(TARGETS) as [Target, (typeof TARGETS)[Target]][]).map(([key, cfg]) => {
          const Icon = cfg.icon;
          const isRunning = running === key;
          return (
            <button
              key={key}
              type="button"
              disabled={running !== null}
              onClick={() => run(key)}
              className="flex items-center gap-2 rounded-lg bg-zinc-700/50 px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
              title={cfg.description}
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <Icon className="h-4 w-4 shrink-0" />
              )}
              <span>
                {cfg.label}
                <span className="ml-1 text-xs text-zinc-500">({cfg.description})</span>
              </span>
            </button>
          );
        })}
      </div>

      {open && (
        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-700 bg-black">
          <div className="flex items-center justify-between border-b border-zinc-700 bg-zinc-900 px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Terminal className="h-3.5 w-3.5" />
              {running ? `${TARGETS[running].label} — running…` : "Log"}
            </div>
            <div className="flex items-center gap-3">
              {result && (
                <span
                  className={`flex items-center gap-1 text-xs font-medium ${
                    result.ok ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {result.ok ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Done
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5" /> Error
                    </>
                  )}
                </span>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={running !== null}
                className="text-xs text-zinc-500 hover:text-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
          <pre
            ref={logRef}
            className="max-h-80 overflow-auto whitespace-pre-wrap p-3 font-mono text-xs text-zinc-300"
          >
            {log || "…"}
          </pre>
        </div>
      )}
    </div>
  );
}
