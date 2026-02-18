/**
 * Instagram Graph API – dohvaća fotografije s Instagram Business/Creator računa.
 * Zahtijeva: Instagram Business ili Creator račun + Meta Developer app + access token.
 *
 * Postavi INSTAGRAM_ACCESS_TOKEN u .env.local
 */

export interface InstagramMedia {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  permalink?: string;
}

export interface InstagramApiResponse {
  data: InstagramMedia[];
  paging?: { cursors?: { after?: string }; next?: string };
}

/** Dohvati do 12 najnovijih medija s Instagrama (cache 1h) */
export async function fetchInstagramFeed(): Promise<string[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token?.trim()) {
    return [];
  }

  const url = new URL("https://graph.instagram.com/v24.0/me/media");
  url.searchParams.set("fields", "id,media_type,media_url,permalink");
  url.searchParams.set("limit", "12");
  url.searchParams.set("access_token", token);

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 }, // cache 1 sat (rate limit: 200 req/h)
    });

    if (!res.ok) {
      console.warn("[Instagram] API error:", res.status, await res.text());
      return [];
    }

    const json = (await res.json()) as InstagramApiResponse;
    const items = json.data ?? [];
    const imageUrls: string[] = [];

    for (const item of items) {
      if (imageUrls.length >= 9) break;

      if (item.media_type === "IMAGE" && item.media_url) {
        imageUrls.push(item.media_url);
      } else if (item.media_type === "CAROUSEL_ALBUM") {
        // Prva slika iz carousela
        const childUrl = `https://graph.instagram.com/v24.0/${item.id}/children?fields=media_url&access_token=${token}`;
        const childRes = await fetch(childUrl, { next: { revalidate: 3600 } });
        if (childRes.ok) {
          const childJson = (await childRes.json()) as { data?: { media_url?: string }[] };
          const first = childJson.data?.[0]?.media_url;
          if (first) imageUrls.push(first);
        }
      }
    }

    return imageUrls;
  } catch (err) {
    console.warn("[Instagram] Fetch error:", err);
    return [];
  }
}
