# Changelog

Sve značajne promjene u projektu dokumentirane su u ovom fajlu.

---

## [Unreleased] – 2026-02-19

### Dodano

#### Blog status (draft / published)
- Polje `status?: "draft" | "published"` u `BlogPost` interface (`src/lib/blog.ts`)
- Funkcija `getPublishedPosts()` – filtrira samo objavljene postove (`status !== "draft"`)
- Draft postovi se ne prikazuju na javnom blogu, u sitemap-u ni u `generateStaticParams`
- **AdminBlog:** Custom `StatusSelect` dropdown u formi (Draft / Objavljeno); default za novi članak: Draft
- Badge u listi blogova: Draft (amber) ili Objavljeno (zeleno)
- API `/api/blog` – POST i PUT podržavaju `status`
- Postovi bez `status` tretiraju se kao objavljeni (backward compatibility)

#### Filter bar u listi blogova (Admin)
- **Status filter** – Svi / Draft / Objavljeno
- **Kategorija filter** – višestruki odabir (OR logika); custom `FilterMultiSelect`
- **Mjesec filter** – odabir mjeseca (dinamički iz datuma postova, hrvatski nazivi)
- **Sort** – Najnovije / Najstarije
- Nove komponente: `FilterSelect`, `FilterMultiSelect`, `StatusSelect`

#### Content health – ikone i vizual
- **AdminDashboard:** Content health sekcija obogaćena ikonama
- Naslov: Activity ikona (umjesto Cross)
- Metrike s ikonama: Camera (EXIF), Tag (slug), ImageOff (featured image), Search (SEO)
- Svaka metrika u zasebnom chips-u s pozadinom; brojevi bold; problematične metrike (> 0) amber highlight

### Promijenjeno
- `getBlogWithBodies()` i `getBlogPost()` koriste samo published postove
- Sitemap uključuje samo objavljene blog postove
