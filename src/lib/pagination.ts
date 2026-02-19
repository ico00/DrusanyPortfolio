/**
 * Blog pagination helpers – single source of truth for pagination logic.
 * Used by /blog (page 1) and /blog/page/[page].
 */

export const POSTS_PER_PAGE = 6;

export interface SortablePost {
  date: string;
  time?: string;
}

/** Sort key: date + time (HH:mm), newest first. Deterministic. */
function sortKey(post: SortablePost): string {
  return post.date + (post.time || "00:00");
}

/** Sort posts newest → oldest by date + time. Deterministic. */
export function sortPostsByDate<T extends SortablePost>(posts: T[]): T[] {
  return [...posts].sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
}

/** Total number of pages for a given post count. */
export function getTotalPages(totalPosts: number): number {
  if (totalPosts <= 0) return 1;
  return Math.ceil(totalPosts / POSTS_PER_PAGE);
}

/** Get posts for a specific page (1-based). Returns slice after sorting. */
export function getPostsForPage<T extends SortablePost>(
  posts: T[],
  page: number
): T[] {
  const sorted = sortPostsByDate(posts);
  const start = (page - 1) * POSTS_PER_PAGE;
  return sorted.slice(start, start + POSTS_PER_PAGE);
}

/**
 * Normalize page param from route (string) to valid page number or null.
 * Returns null for: 0, negative, non-numeric, or NaN.
 */
export function normalizePageParam(param: string | undefined): number | null {
  if (param == null || param === "") return null;
  const n = parseInt(param, 10);
  if (isNaN(n) || n < 1) return null;
  return n;
}
