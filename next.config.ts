import type { NextConfig } from "next";

// Filtriranje Turbopack upozorenja za "Overly broad patterns" – path.join u blog.ts
// za public/uploads/blog/ poklapa 10k+ datoteka; to su runtime putanje, ne bundliranje
const originalStderrWrite = process.stderr.write.bind(process.stderr);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
process.stderr.write = ((chunk: any, encoding?: any, callback?: any) => {
  const str = typeof chunk === "string" ? chunk : chunk?.toString?.() ?? "";
  if (str.includes("Overly broad patterns") && str.includes("uploads/blog")) {
    if (typeof callback === "function") callback();
    return true;
  }
  return originalStderrWrite(chunk, encoding, callback);
}) as typeof process.stderr.write;

const nextConfig: NextConfig = {
  devIndicators: false,
  output: "export",
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["exifr"],
};

export default nextConfig;
