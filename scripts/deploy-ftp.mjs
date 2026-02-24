#!/usr/bin/env node
/**
 * FTP deploy – uploada samo PROMIJENJENE datoteke iz out/ na server.
 * Koristi basic-ftp (Node.js) – nema potrebe za lftp/brew.
 *
 * Varijable okoline: FTP_HOST, FTP_USER, FTP_PASS, FTP_REMOTE_PATH (default: /public_html)
 */

import { Client } from "basic-ftp";
import { readdir, stat } from "fs/promises";
import { join, relative } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PROJECT_DIR = join(__dirname, "..");
const LOCAL_DIR = join(PROJECT_DIR, "out");

const EXCLUDE = new Set(["uploads", ".DS_Store"]);

async function* walkDir(dir, base = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    const rel = relative(base, full);
    if (EXCLUDE.has(e.name)) continue;
    if (e.isDirectory()) {
      yield* walkDir(full, base);
    } else {
      yield { local: full, remote: rel };
    }
  }
}

/** Rekurzivno listaj remote datoteke: path -> size */
async function listRemoteRecursive(client, prefix = "") {
  const map = new Map();
  try {
    const entries = await client.list(prefix || undefined);
    for (const e of entries) {
      if (e.name === "." || e.name === "..") continue;
      const fullPath = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.isDirectory) {
        const sub = await listRemoteRecursive(client, fullPath);
        for (const [k, v] of sub) map.set(k, v);
      } else if (e.isFile) {
        map.set(fullPath, e.size);
      }
    }
  } catch (err) {
    // Dir ne postoji (prvi deploy) – vrati praznu mapu
  }
  return map;
}

async function main() {
  const host = process.env.FTP_HOST;
  const user = process.env.FTP_USER;
  const pass = process.env.FTP_PASS;
  const remotePath = process.env.FTP_REMOTE_PATH || "/public_html";

  if (!host || !user || !pass) {
    console.error("Postavi FTP_HOST, FTP_USER, FTP_PASS u .env");
    process.exit(1);
  }

  const client = new Client(120000);
  client.ftp.verbose = false;

  try {
    await client.access({
      host,
      user,
      password: pass,
      secure: false,
    });

    await client.ensureDir(remotePath);
    await client.cd(remotePath);

    process.stdout.write("  Učitavam popis remote datoteka...");
    const remoteFiles = await listRemoteRecursive(client);
    console.log(`\r  Remote: ${remoteFiles.size} datoteka.`);

    let uploaded = 0;
    let skipped = 0;
    for await (const { local, remote } of walkDir(LOCAL_DIR)) {
      const st = await stat(local);
      const remoteSize = remoteFiles.get(remote);
      if (remoteSize !== undefined && remoteSize === st.size) {
        skipped++;
        continue;
      }

      const remoteDir = remote.includes("/") ? remote.slice(0, remote.lastIndexOf("/")) : ".";
      const remoteFile = remote.includes("/") ? remote.slice(remote.lastIndexOf("/") + 1) : remote;
      await client.cd(remotePath);
      if (remoteDir !== ".") await client.ensureDir(remoteDir);
      await client.uploadFrom(local, remoteFile);
      uploaded++;
      if (uploaded % 100 === 0) process.stdout.write(`\r  ${uploaded} uploadano, ${skipped} preskočeno...`);
    }
    console.log(`\r  ${uploaded} uploadano, ${skipped} preskočeno (bez promjena).`);
  } finally {
    client.close();
  }
}

main().catch((err) => {
  console.error("FTP greška:", err.message);
  process.exit(1);
});
