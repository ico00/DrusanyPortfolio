import lockfile from "proper-lockfile";

/**
 * Izvršava async funkciju s file lockom.
 * Sprječava race condition pri simultanom read-modify-write na JSON datotekama.
 */
export async function withLock<T>(
  filePath: string,
  fn: () => Promise<T>
): Promise<T> {
  const release = await lockfile.lock(filePath, {
    retries: { retries: 10, minTimeout: 50, maxTimeout: 500 },
  });
  try {
    return await fn();
  } finally {
    await release();
  }
}
