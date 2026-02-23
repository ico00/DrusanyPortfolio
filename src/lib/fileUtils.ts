import { access } from "fs/promises";

/** Provjeri postoji li datoteka na putanji. Samo za server (API rute). */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
