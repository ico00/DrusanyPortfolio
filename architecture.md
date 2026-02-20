# Architecture: Static Next.js Photography Portfolio

## 1. Overview

Ovaj dokument opisuje arhitekturu statičnog fotografskog portfolija izgrađenog na Next.js App Routeru. Cilj je proizvesti čisto statični HTML/JS/CSS output pogodan za hosting na bilo kojem statičnom hostingu (Vercel, Netlify, GitHub Pages, vlastiti server).

---

## 2. Tech Stack

| Tehnologija | Verzija | Namjena |
|-------------|---------|---------|
| **Next.js** | 16.x | App Router, SSG, API routes (samo dev) |
| **Tailwind CSS** | 4.x | Utility-first styling |
| **Framer Motion** | 12+ | Animacije, fade-in transitions |
| **Lucide Icons** | latest | Ikone za UI (hamburger, strelice, social) |
| **Sharp** | 0.34+ | Image processing (resize, WebP) |
| **exifr** | 7.x | EXIF metadata extraction (datum, naslov, camera, lens, exposure, aperture, ISO) |
| **sanitize-html** | 2.x | HTML sanitizacija pri čitanju sadržaja (getPages, getBlogPost) |
| **proper-lockfile** | 4.x | File locking za JSON (gallery, blog, pages) – read-modify-write |
| **BlockNote** | 0.46.x | Block-based rich text editor (About, Contact, Blog) – shadcn UI |
| **react-day-picker** | 9.x | Custom kalendar za datum/vrijeme u adminu |
| **Recharts** | 3.x | Dashboard grafikoni (bar, pie) |

### Instalacija

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir
npm install framer-motion lucide-react sharp exifr
```

---

## 3. Storage Strategy

### 3.1 Flat-File Database: `src/data/gallery.json`

Sve metapodatke o slikama čuvamo u jednom JSON fajlu. Struktura:

```json
{
  "images": [
    {
      "id": "uuid-v4",
      "src": "/uploads/full/concerts/filename.webp",
      "thumb": "/uploads/thumbs/concerts/filename.webp",
      "alt": "Image description",
      "title": "Title",
      "category": "concerts",
      "width": 2048,
      "height": 1365,
      "capturedAt": "2013-05-23T10:30:00.000Z",
      "createdAt": "2026-02-13T10:00:00.000Z",
      "isHero": true,
      "venue": "arena-zagreb",
      "keywords": "concert, live, depeche mode",
      "slug": "depeche-mode-arena-zagreb-2013",
      "camera": "Canon EOS 5D Mark II",
      "lens": "EF 24-70mm f/2.8",
      "exposure": "1/200",
      "aperture": "f/2.8",
      "iso": 1600
    }
  ]
}
```

- **id**: Jedinstveni identifikator (UUID)
- **src/thumb**: Relativne putanje (full 2048px, thumb 600px WebP)
- **alt/title**: SEO i pristupačnost
- **category**: Za filtriranje (concerts, sport, animals, interiors, zagreb, food-drink)
- **width/height**: Za layout (masonry/aspect ratio)
- **capturedAt**: Datum snimanja iz EXIF-a ili forme
- **createdAt**: Datum uploada
- **isHero**: Hero slika za kategoriju (prikaz na početnoj) – **samo ručno odabrana**, nema fallback na prvu/najnoviju sliku
- **venue**: Dvorana za Concerts (arena-zagreb, cibona, dom-sportova, kd-vatroslav-lisinski, kset, misc, salata, tvornica-kulture)
- **sport**: Vrsta sporta za Sport (athletics, auto-moto, basketball, fencing, football, handball, martial arts) – filter u galeriji kao venue za Concerts; SportSelect u adminu poredan abecedno
- **keywords**: Ključne riječi (comma-separated) – izvlače se iz EXIF IPTC/XMP (dc:subject, Keywords), mogu se uređivati; koriste se u search filteru
- **slug**: URL slug za direktne linkove (npr. `depeche-mode-arena-zagreb-2013`) – generira se pri uploadu iz title+venue+year, jedinstven unutar kategorije; pri editiranju title/venue/capturedAt automatski se regenerira (API); u Edit modalu **as you type** – slug polje se ažurira u realnom vremenu dok pišeš; moguće ručno dotjerivanje; URL `/?category=X&image=slug` otvara lightbox s tom slikom
- **order**: Redoslijed unutar kategorije (manji = ranije); postavlja se drag-and-drop u adminu; undefined = sortiraj po datumu
- **camera, lens, exposure, aperture, iso**: EXIF opcije (aparata, objektiva, ekspozicije, blende, ISO) – izvlače se pri uploadu, mogu se uređivati

### 3.2 Pages: `src/data/pages.json`

Sadržaj About i Contact stranica. Struktura:

```json
{
  "about": {
    "title": "About me",
    "html": "<p>...</p><blockquote>...</blockquote>",
    "quote": "Optional quote overlay on left image"
  },
  "contact": {
    "title": "Contact",
    "html": "<p>Intro text above form...</p>",
    "email": "hello@example.com",
    "formspreeEndpoint": "https://formspree.io/f/xxxxx"
  }
}
```

- **title**: Naslov stranice (prikazuje se kao h1)
- **html**: HTML sadržaj iz BlockNote editora (paragrafi, naslovi, citati, liste, tablice)
- **about.quote**: Opcionalno – citat koji se prikazuje u donjem lijevom kutu slike na About stranici
- **contact.email**: Fallback email za mailto ako Formspree nije postavljen
- **contact.formspreeEndpoint**: Formspree URL (npr. `https://formspree.io/f/xxxxx`) – poruke se šalju na Formspree; ako prazno, koristi se mailto
- Migracija: ako `title` nedostaje, izvlači se iz prvog `<h1>` u HTML-u

### 3.3 Blog: `src/data/blog.json`

Blog postovi. Struktura: `{ "posts": [ { "id", "slug", "title", "date", "time", "categories", "thumbnail", "thumbnailFocus", "gallery", "status" } ] }`. **Status:** `"draft" | "published"` – draft postovi se ne prikazuju javno; `getPublishedPosts()` filtrira; postovi bez `status` tretiraju se kao objavljeni. **Slug format:** `yymmdd-naslov` (npr. `251228-advent-2025`) – generira se putem `generateBlogSlug` iz `@/lib/slug`. Sadržaj (`body`) je u `src/data/blog/[slug].html`. Galerija: niz URL-ova (`/uploads/blog/[datum]-[slug]/gallery/...`). **Slike u sadržaju:** `/uploads/blog/[datum]-[slug]/content/*.webp` – uploadane iz BlockNote editora. Pri čitanju posta (`getBlogPost`) galerija se obogaćuje dimenzijama (Sharp metadata) za masonry layout – `galleryImages: { src, width, height }[]`. **Pretraga:** `getBlogWithBodies()` učitava body i generira `bodySearchText` (plain text bez HTML-a) za pretragu po sadržaju članka; koristi samo published postove.

### 3.3.1 Blog Widgets: `src/data/blogWidgets.json`

Konfiguracija sidebara na blog stranici. Struktura: `{ "widgets": [ { "id", "type", "enabled", "title", ... } ] }`. Tipovi: **search** (filter-as-you-type), **categories** (kategorije s linkovima), **featured-posts** (istaknuti članci – postovi s `featured: true`, do 3), **maps** (locations s embedUrl iz Google My Maps – `mid=` parametar). *Instagram widget uklonjen.*

### 3.3.2 Blog EXIF: `src/data/blogExif.json`

EXIF metapodaci za slike u blog galerijama. Struktura: `{ "/uploads/blog/.../gallery/filename.webp": { camera, lens, exposure, aperture, iso } }`. Koristi se u BlogGallery za prikaz EXIF-a u lightboxu. **Novi uploadi** – EXIF se automatski sprema pri uploadu putem `/api/blog-upload`. **Postojeće slike** – skripta `scripts/populate-blog-exif.mjs` (exifr) popunjava iz originalnih datoteka; pokreni `node scripts/populate-blog-exif.mjs`.

### 3.4 SEO Engine

Per-Page SEO modul upravljan iz Admin panela. Svaki post i stranica imaju `seo` objekt s poljima: **metaTitle**, **metaDescription**, **keywords**.

**JSON Schema:**
- **pages.json:** Svaka stranica (about, contact) ima `seo: { metaTitle?, metaDescription?, keywords? }`
- **blog.json:** Svaki post ima `seo: { metaTitle?, metaDescription?, keywords? }`

**Admin UI (AdminBlog, AdminPages):**
- Sekcija "SEO Settings" s inputima za metaTitle, metaDescription, keywords
- metaDescription: brojač znakova; upozorenje ako pređe 160 (preporučeno za Google rezultate)
- metaTitle: ako ostane prazno, koristi se naslov posta/stranice

**Next.js Metadata:**
- `generateMetadata({ params })` u `src/app/blog/[slug]/page.tsx` – čita blog.json, pronalazi post po slug-u, vraća title i description za `<head>`
- `generateMetadata()` u `src/app/about/page.tsx` i `src/app/contact/page.tsx` – čita pages.json, vraća title i description
- **Open Graph:** Blog postovi koriste thumbnail posta (`post.thumbnail`) kao OG sliku pri dijeljenju na društvenim mrežama; `metadataBase` u layout.tsx omogućuje relativne putanje (NEXT_PUBLIC_SITE_URL)
- **Canonical URL:** Generira se iz `NEXT_PUBLIC_SITE_URL` + path (npr. `https://drusany.com/blog/251228-advent-2025`). Svaka stranica postavlja `alternates.canonical` s relativnom putanjom; Next.js koristi `metadataBase` za rezoluciju u puni URL.

**Sitemap i robots.txt:**
- **sitemap.ts** (`src/app/sitemap.ts`) – programatski generira `sitemap.xml` pri buildu; uključuje: statične stranice (/ , /about, /contact, /blog), blog paginaciju (/blog/page/2, …), sve blog postove (/blog/[slug]); `lastModified` za postove iz datuma objave; `changeFrequency` i `priority` po tipu stranice; koristi `NEXT_PUBLIC_SITE_URL` (fallback: https://drusany.com)
- **robots.ts** (`src/app/robots.ts`) – generira `robots.txt`; allow: /; disallow: /admin, /api/; sitemap: `{NEXT_PUBLIC_SITE_URL}/sitemap.xml`
- Pri statičnom exportu (`output: 'export'`) Next.js generira `out/sitemap.xml` i `out/robots.txt`; serviraju se na `/sitemap.xml` i `/robots.txt`

### 3.5 Gear: `src/data/gear.json`

Fotografska oprema (About stranica). Struktura:

```json
{
  "items": [
    {
      "id": "1",
      "src": "/uploads/gear/canon-5d.webp",
      "alt": "Canon EOS 5D Mark IV",
      "title": "Canon EOS 5D Mark IV",
      "category": "cameras",
      "width": 1200,
      "height": 800
    }
  ]
}
```

- **title**: Naziv opreme (npr. "Canon EOS 5D Mark IV")
- **category**: Opcionalno – kamere, objektivi, itd.
- **width/height**: Za originalni aspect ratio – dodaj s `npm run gear:dimensions`

### 3.6 Press: `src/data/press.json`

Objavljene fotografije u medijima (About stranica). Struktura:

```json
{
  "items": [
    {
      "id": "1",
      "src": "/uploads/press/novine-2024.webp",
      "alt": "Opis slike",
      "caption": "Sportske novosti, 15.3.2024",
      "link": "https://optional-link-to-article.com"
    }
  ]
}
```

- **src**: Putanja do slike (npr. `/uploads/press/` ili bilo koja postojeća slika)
- **caption**: Ime medija / naslov objave (opcionalno)
- **link**: URL članka (opcionalno) – ako postoji, slika je klikabilna

### 3.7 Theme: `src/data/theme.json`

Konfiguracija tipografije i boja za elemente stranice. Struktura:

```json
{
  "title": { "fontFamily": "serif", "fontSize": "clamp(2rem, 5vw, 4rem)", "color": "#ffffff" },
  "heading": { "fontFamily": "serif", "fontSize": "1.5rem", "color": "#18181b" },
  "headingOnDark": { "fontFamily": "serif", "fontSize": "clamp(1.75rem, 4vw, 3rem)", "color": "#ffffff" },
  "body": { "fontFamily": "sans", "fontSize": "1rem", "color": "#3f3f46" },
  "quote": { "fontFamily": "serif", "fontSize": "1.125rem", "color": "#e4e4e7" },
  "nav": { "fontFamily": "sans", "fontSize": "0.875rem", "color": "rgba(255,255,255,0.9)" },
  "caption": { "fontFamily": "sans", "fontSize": "0.75rem", "color": "#71717a" }
}
```

- **fontFamily:** sans (Geist), serif (Playfair), mono (JetBrains) – definirani u `src/data/themeFonts.ts`
- **fontSize:** CSS vrijednost (npr. `1rem`, `clamp(2rem, 5vw, 4rem)`)
- **color:** Hex ili rgba
- **ThemeStyles** (layout) injektira CSS varijable u `:root`; prose i utility klase (`.theme-title`, `.theme-heading`, `.theme-nav`, `.theme-caption`) koriste te varijable
- **Dodavanje novih fontova:** 1) `layout.tsx` – import iz `next/font/google`, dodaj `.variable` u body; 2) `themeFonts.ts` – dodaj zapis u `THEME_FONTS`

### 3.8 Original Images: `public/uploads/`

- Slike se spremaju u podfoldere po kategoriji: `public/uploads/full/[category]/` i `public/uploads/thumbs/[category]/`
- Press slike: `public/uploads/press/` (ručno dodavanje)
- Gear slike: `public/uploads/gear/` (ručno dodavanje)
- Blog: `public/uploads/blog/[YYYY-MM-DD]-[slug]/` – featured.webp, gallery/*.webp, **content/*.webp** (slike iz BlockNote sadržaja); originalni nazivi datoteka (sanitizeFilename)
- Format: WebP (Sharp resize)
- Naziv datoteke: sanitizirani originalni naziv (lowercase, razmaci→crte, bez specijalnih znakova); ako postoji kolizija, dodaje se kratki random suffix ili broj
- **Validacija:** Magic bytes provjera (JPEG/PNG/GIF/WebP) prije obrade; ograničenje veličine 20 MB
- Pri static exportu, cijeli `public/` folder se kopira u `out/`

```
public/
└── uploads/
    ├── full/              # 2048px max, WebP
    │   ├── concerts/
    │   │   └── depeche-mode-arena.webp
    │   ├── sport/
    │   └── ...
    └── thumbs/            # 600px max, WebP
        ├── concerts/
        └── ...
```

---

## 4. Local Admin Flow

### 4.1 Uvjet: Samo Development Mode

Admin ruta i API endpoint su dostupni **samo** kada:

```ts
process.env.NODE_ENV !== 'production'
```

U produkcijskom buildu (`npm run build`) admin ruta se ne uključuje u output.

### 4.2 Admin Route: `/admin`

**Lokacija:** `src/app/admin/page.tsx` + `src/components/AdminClient.tsx`

**Funkcionalnost:**
- **Sidebar accordion:** Samo jedan podmeni (Gallery ili Pages) može biti otvoren; animacija otvaranja/zatvaranja (grid-template-rows)
- **Theme tab:** Ispod Blog – Customize Theme (font, veličina, boja za title, heading, **headingOnDark** – naslov na tamnoj pozadini za About/Contact, body, quote, nav, caption); custom dropdown (kao CategorySelect); live preview s adaptivnom pozadinom (svijetla/tamna prema boji teksta); spremanje putem `/api/theme`; za statički export: uređivanje samo u dev modu, zatim `npm run build`
- **Category-first flow:** Korisnik prvo odabere kategoriju; bez odabira upload je onemogućen
- **Galerija filtrirana po kategoriji:** Prikazuje se samo galerija odabrane kategorije (ne opća galerija sa svim slikama)
- Upload novih slika (file input) – slike idu u odabranu kategoriju
- **EXIF preview:** Pri odabiru datoteke poziv na `/api/exif-preview` – automatsko popunjavanje naslova i datuma snimanja iz EXIF-a
- Forma za metapodatke: title, **custom DateTimePicker** za capture date (kalendar + sat/minut), venue (samo za Concerts), sport (samo za Sport), keywords (iz EXIF-a), hero checkbox (kategorija se uzima iz odabira gore; alt = title automatski)
- **CategorySelect:** Custom izbornik s ikonama (Concerts, Sport, Animals, Interiors, Zagreb, Food & Drink) + opcija "Other (custom)"
- **Edit modal:** Uređivanje opisa postojećih slika (title, category, date, alt, venue, sport, slug, keywords, camera, lens, exposure, aperture, ISO); **custom DateTimePicker** (react-day-picker) – datum + vrijeme u 24h formatu; **slug as you type** – polje za slug se automatski ažurira dok pišeš title, mijenjaš venue ili datum (koristi `generateSlug` iz `@/lib/slug`)
- **VenueSelect:** Dropdown za venue (samo za Concerts) – Arena Zagreb, Cibona, Dom sportova, KD Vatroslav Lisinski, KSET, Misc, Šalata, Tvornica kulture
- **SportSelect:** Dropdown za vrstu sporta (samo za Sport) – Athletics, Auto-Moto, Basketball, Fencing, Football, Handball, Martial Arts (poredan abecedno)
- **Hero toggle:** Postavljanje/uklanjanje hero slike po kategoriji (samo ručno); hero slika u galeriji istaknuta amber obrubom
- **Generiraj slugove:** Kad je Content health filter "no-slug" aktivan, gumb "Generiraj slugove" poziva `/api/gallery/generate-slugs` – bulk generira slug za sve slike bez njega
- **Delete:** Brisanje slike (uklanja iz JSON-a i diska)
- **Drag-and-drop sortiranje:** Fotografije u galeriji mogu se povući za promjenu redoslijeda; novi redoslijed se sprema putem `/api/reorder`

### 4.3 Admin Media

**Lokacija:** `src/components/AdminMedia.tsx`, `src/app/api/media/route.ts`, `src/app/api/media-delete/route.ts`, `src/app/api/media-detach/route.ts`

**Funkcionalnost:**
- **Agregirani prikaz slika** – `/api/media` agregira sve slike iz galerije (portfolio), bloga (thumbnail, galerija, sadržaj) i stranica (About, Contact); prikazuje filename, thumb, upload date, usages (gdje se slika koristi)
- **Filter i pretraga** – Filter po tipu (All, Portfolio, Blog, Page); search filter as you type (filename, URL, usages)
- **Prikaz** – List view (tablica) i Grid view; paginacija 25 po stranici s "Go to page" inputom
- **Lightbox** – Klik na thumb otvara lightbox u punoj rezoluciji (isti izgled kao na blogu/portfoliju – Framer Motion, gradient overlay, prev/next strelice)
- **Akcije po slici** – Download, Copy URL, Detach (dropdown za odabir usage-a), Delete (samo za `/uploads/`)
- **Detach** – Odvajanje slike od stranice (kao WordPress) – datoteka ostaje na disku; podržano: portfolio (uklanja iz gallery.json), blog (thumbnail, galerija, sadržaj), stranice (uklanja img tag iz HTML-a)
- **Multiple selection** – Checkbox po retku/kartici; bulk akcije: Delete selected, Download selected, Copy URLs, Detach selected (odvaja sve odabrane od svih njihovih usages)
- **Admin layout** – Media link dostupan i na `/admin/blog` ruti (AdminBlogLayoutInner sidebar); `/admin?tab=media` otvara Media tab

### 4.4 Admin Pages & Blog (BlockNote editor)

**Lokacija:** `src/components/AdminPages.tsx`, `src/components/AdminBlog.tsx`, `src/components/BlockNoteEditor.tsx`

**AdminPages (About / Contact):**
- Tabovi "About" i "Contact" u adminu
- **About:** Polje "Citat na slici" (quote); naslov; BlockNote editor za sadržaj
- **Contact:** Polje "Formspree endpoint" (preporučeno); polje "Email" (fallback za mailto); naslov; BlockNote editor za uvodni tekst iznad forme
- BlockNote editor – blokovi (paragraf, naslov H1–H6, citat, lista, tablica, slika); side menu (⋮⋮ +), slash menu (`/`), formatiranje teksta (označi → toolbar)
- **Razmak između blokova:** `space-y-14` između form sekcija; BlockNote blokovi imaju `margin-bottom: 1.5rem` (globals.css)
- Spremanje putem `/api/pages`

**AdminBlog:**
- Lista postova s **thumbnail** u popisu, **format datuma** `dd. mm. yyyy.` i **vrijeme u 24h**; **badge** za status (Draft / Objavljeno) i SEO
- **Filter bar:** Status (Svi / Draft / Objavljeno), Kategorija (višestruki odabir, OR logika), Mjesec (dinamički iz datuma postova, hrvatski nazivi), Sort (Najnovije / Najstarije); custom dropdowni (`FilterSelect`, `FilterMultiSelect`)
- Polja: **status** (Draft / Objavljeno, custom `StatusSelect`; default za novi: Draft), title, slug (format `yymmdd-naslov`), **custom DatePicker** za datum, kategorije (višestruki odabir, **abecedno sortirane**), thumbnail (opcionalno), **sadržaj (BlockNote)** – iznad galerije, galerija (drag-and-drop, bulk delete, select all)
- **editLoading:** Pri otvaranju uređivanja prikazuje se loader dok se body ne učitava – sprječava BlockNote popover crash (`reference.element` undefined)
- Upload galerije: originalni nazivi datoteka; duplicate modal (Prepiši, Dodaj kao _2, Odustani); brisanje slika iz galerije briše i fizičke datoteke s diska (`/api/blog-delete-file`)
- Spremanje putem `/api/blog`

**Admin toast:** Usklađen vizual (emerald success, red error, Check/AlertCircle ikone) – galerija, Pages, Blog

**BlockNote editor (BlockNoteEditor.tsx):**
- **BlockNote** (@blocknote/shadcn) – block-based WYSIWYG, sprema HTML
- **Statična traka stila bloka (StaticBlockTypeBar):** Prikazuje trenutni stil bloka na temelju pozicije kursora (bez označavanja teksta); dropdown za promjenu tipa (Paragraph, Heading 1–6, Quote, itd.)
- **Tamna tema:** `data-theme="dark"` na html kad je admin otvoren; zinc/amber paleta
- **Fontovi u editoru = fontovi na stranici:** font-sans (body), font-serif (naslovi) – WYSIWYG
- **Formatting Toolbar:** Neprozirna pozadina (zinc-800), svijetli tekst; dropdowni (Stil bloka, izbornici) također neprozirni
- **File/Image panel (`/image`):** Neprozirna pozadina (`.bn-panel`, `.bn-panel-popover`) – kao ostali izbornici; **Upload tab** – ako se proslijedi `uploadFile` prop (AdminBlog kada ima slug i datum), slike se uploadaju u `content/` putem `/api/blog-upload` type `content`; **Embed tab** – unos URL-a
- **Resize ručice:** Slike imaju drag-handles (lijevo/desno) za promjenu širine; vidljive u dark modu (svijetla pozadina); default širina uploadanih slika: 512px (`previewWidth`)

### 4.5 API Routes (dev only)

Svi API endpointi provjeravaju `process.env.NODE_ENV !== 'production'` i vraćaju 403 u produkciji.

#### `/api/upload` (POST)

**Lokacija:** `src/app/api/upload/route.ts`

**Tijek:**
1. **Rate limit** provjera (200 req/min po IP – bulk upload 100+ slika)
2. Prima `FormData` (file, title, category, alt, capturedAt, isHero, venue, sport, keywords, slug)
3. Provjera veličine (max 20 MB), magic bytes (JPEG/PNG/GIF/WebP)
4. Kreira podfoldere `full/[category]/` i `thumbs/[category]/` (category se sanitizira)
5. Naziv datoteke: originalni naziv sanitiziran (lowercase, razmaci→crte); ako postoji kolizija, dodaje se suffix
6. Sharp: resize na 2048px (full) i 600px (thumb), WebP
7. **exifr:** Čita EXIF (makerNote: true, xmp: true, iptc: true) – datum (DateTimeOriginal, fallback: CreateDate, DateTime, ModifyDate), naslov, keywords (IPTC/XMP), camera, lens, exposure, aperture, ISO – koristi zajednički modul `@/lib/exif`
8. Ako forma šalje `capturedAt`, koristi ga; inače EXIF datum
9. **Slug:** Generira iz title+venue+year putem `generateSlug` (iz `@/lib/slug`); provjera jedinstvenosti unutar kategorije; pri overwrite zadržava postojeći
10. **File locking** (`withLock`) prije read-modify-write u `gallery.json`
11. Generira UUID, sprema u `gallery.json` s putanjama `/uploads/full/[category]/filename.webp`
12. Vraća `{ success, id, src, thumb, image }`

#### `/api/exif-preview` (POST)

**Lokacija:** `src/app/api/exif-preview/route.ts`

- **Rate limit** provjera
- Prima `FormData` s datotekom; provjera veličine (20 MB), magic bytes
- **exifr:** Parsira cijeli EXIF – koristi `@/lib/exif` (formatDateForInput, getExifDescription, getKeywords, getExifExtras)
- Vraća `{ date, description, keywords, camera, lens, exposure, aperture, iso }` za auto-fill u admin formi

#### `/api/update` (POST)

**Lokacija:** `src/app/api/update/route.ts`

- **Rate limit** provjera; **file locking** (`withLock`) za `gallery.json`
- Prima `{ id, title?, alt?, category?, capturedAt?, venue?, sport?, keywords?, slug?, camera?, lens?, exposure?, aperture?, iso? }`
- Ažurira zapis u `gallery.json` po ID-u
- **Auto-slug:** Kad se mijenjaju `title`, `venue` ili `capturedAt`, slug se automatski regenerira iz novih vrijednosti (koristi `generateSlug` iz `@/lib/slug`); provjera jedinstvenosti unutar kategorije (suffix `-2`, `-3` ako postoji kolizija); ako se mijenja samo slug (bez title/venue/datuma), ostaje ručno postavljeni slug

#### `/api/delete` (POST)

**Lokacija:** `src/app/api/delete/route.ts`

- **Rate limit** provjera; **file locking** (`withLock`) za `gallery.json`
- Prima `{ id }`
- Briše sliku iz `gallery.json` i fajlove iz `public/uploads/` (koristi punu putanju iz `src`/`thumb` – radi za staru i novu strukturu foldera)

#### `/api/reorder` (POST)

**Lokacija:** `src/app/api/reorder/route.ts`

- **Rate limit** provjera; **file locking** (`withLock`)
- Prima `{ category, order: string[] }` – array ID-eva slika u željenom redoslijedu
- Ažurira polje `order` za svaku sliku u kategoriji (0, 1, 2, …)
- Koristi se nakon drag-and-drop u admin galeriji

#### `/api/hero` (POST)

**Lokacija:** `src/app/api/hero/route.ts`

- **Rate limit** provjera; **file locking** (`withLock`)
- Prima `{ id, isHero }`
- Postavlja/uklanja `isHero` za sliku u kategoriji (samo jedna hero po kategoriji)

#### `/api/gallery` (GET)

**Lokacija:** `src/app/api/gallery/route.ts`

- Vraća `{ images }` iz `gallery.json` (koristi `getGallery` za sortiranje po `order` pa `capturedAt`); `getGallery` generira slug za slike bez njega (title+venue+year, jedinstvenost)

#### `/api/pages` (GET, PUT)

**Lokacija:** `src/app/api/pages/route.ts`

- **GET:** Vraća `{ about, contact }` iz `pages.json`; `getPages` koristi `sanitizeProseHtml` za HTML sadržaj
- **PUT:** **Rate limit** provjera; **file locking** (`withLock`); prima `{ about?, contact? }`, sprema putem `savePages`

#### `/api/blog` (GET, POST, PUT, DELETE)

**Lokacija:** `src/app/api/blog/route.ts`

- **GET:** Vraća blog postove iz `blog.json`; `getBlogPost` koristi `sanitizeProseHtml` pri čitanju body-a
- **POST/PUT/DELETE:** **Rate limit** provjera; **file locking** (`withLock`) za `blog.json`
- **POST:** Prima novi post; slug se generira putem `normalizeBlogSlug` (format `yymmdd-naslov`)
- **PUT:** Ažuriranje posta; pri promjeni slug-a/datuma – `blogCleanup` premješta uploads folder, briše orphan datoteke
- **DELETE:** Briše post; `deleteBlogPostFiles` briše `[slug].html` i `public/uploads/blog/[date]-[slug]/`

#### `/api/blog-upload` (POST)

**Lokacija:** `src/app/api/blog-upload/route.ts`

- **Rate limit** provjera; provjera veličine (20 MB), magic bytes; koristi `@/lib/exif` za EXIF
- Prima FormData (file, slug, date, type: featured | gallery | **content**)
- Featured: `featured.webp` u `public/uploads/blog/[date]-[slug]/`
- Gallery: originalni naziv datoteke (sanitizeFilename); duplicate → 409 s opcijama (overwrite, addWithSuffix)
- **Content:** Slike iz BlockNote sadržaja – `content/*.webp` u istom folderu; Sharp resize 2048px, WebP

#### `/api/blog-delete-file` (POST)

**Lokacija:** `src/app/api/blog-delete-file/route.ts`

- **Rate limit** provjera
- Prima `{ url }` – putanja `/uploads/blog/...`; **path traversal zaštita** – provjera da rezolvirana putanja ostane unutar `public/uploads/blog/`; briše fizičku datoteku s diska kad se slika ukloni iz galerije

#### `/api/gallery/generate-slugs` (POST)

**Lokacija:** `src/app/api/gallery/generate-slugs/route.ts`

- **Rate limit** provjera; **file locking** (`withLock`)
- Generira slug za sve slike u galeriji koje nemaju slug (koristi `ensureSlug` iz `getGallery`)
- Dostupno samo u development modu
- Vraća `{ success, updated, total }`; koristi se iz Admin galerije kad je filter "no-slug" aktivan – gumb "Generiraj slugove"

#### `/api/media` (GET)

**Lokacija:** `src/app/api/media/route.ts`

- Agregira sve slike iz gallery.json, blog.json (+ HTML sadržaj), pages.json
- Vraća `{ items: MediaItem[] }` – svaki item ima `url`, `thumb`, `filename`, `usages[]`, `uploadDate`
- `uploadDate`: iz `createdAt` (gallery) ili `mtime` datoteke na disku
- `force-static` (kompatibilno s `output: export`)

#### `/api/media-delete` (POST)

**Lokacija:** `src/app/api/media-delete/route.ts`

- **Rate limit** provjera; samo development
- Prima `{ url }` – putanja mora biti unutar `public/uploads/`
- Briše datoteku s diska; ne ažurira reference u gallery/blog/pages

#### `/api/media-detach` (POST)

**Lokacija:** `src/app/api/media-detach/route.ts`

- **Rate limit** provjera; samo development
- Prima `{ url, usage: { type, label, context } }`
- **Portfolio:** Uklanja unos iz `gallery.json` (match po src/thumb)
- **Blog:** Uklanja iz `post.thumbnail`, `post.gallery` ili HTML sadržaja (regex uklanja img tag)
- **Page:** Uklanja img tag iz About/Contact HTML-a u `pages.json`
- Datoteka ostaje na disku

#### `/api/content-health` (GET)

**Lokacija:** `src/app/api/content-health/route.ts`

- Vraća statistiku sadržaja: `imagesWithoutExif`, `imagesWithoutSlug`, `blogPostsWithoutFeaturedImage`, `imageIdsWithoutExif`, `imageIdsWithoutSlug`
- Koristi se u Admin Dashboard za Content health sekciju – klik na filter otvara galeriju s odgovarajućim filterom ili prelazi na Blog

#### `/api/health` (GET)

**Lokacija:** `src/app/api/health/route.ts`

- Health check za CI/CD – provjerava čitljivost JSON datoteka i postojanje kritičnih resursa
- **Provjere:** `gallery.json`, `blog.json`, `pages.json`, `theme.json` (čitljivi, valjana struktura); `public/uploads/` (postoji); za svaki blog post – `src/data/blog/[slug].html` postoji
- **Odgovor:** 200 ako sve OK, 503 ako nešto ne valja; JSON `{ status: "ok"|"degraded", checks: {...} }`
- Prerenderira se pri buildu (`force-static`) – uključen u statični export; koristan za CI pipeline

#### `/api/theme` (GET, PUT)

**Lokacija:** `src/app/api/theme/route.ts`

- **GET:** Vraća theme konfiguraciju iz `theme.json` (font, fontSize, color po elementu)
- **PUT:** **Rate limit** provjera; prima `ThemeConfig`, sprema u `theme.json`; dostupno samo u development modu

---

## 5. Static Export Configuration

### 5.1 `next.config.ts`

```ts
const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};
```

- **output: 'export'** – Generira statični folder `out/` umjesto Node.js servera
- **images.unoptimized: true** – Isključuje Next.js Image Optimization API (zahtijeva server). Slike se serviraju direktno iz `/uploads/`

### 5.2 Ograničenja Static Exporta

- Nema API routes u produkcijskom buildu
- Nema server-side rendering (SSR) – samo SSG
- `next/image` ne optimizira slike – koristiti `img` ili `next/image` s `unoptimized`
- Dinamičke rute zahtijevaju `generateStaticParams` ako postoje

---

## 6. Design System

### 6.1 Estetika: High-End Minimalist

- **Boje:** Neutralna paleta (bijela, crna, siva), možda jedan akcent
- **Tipografija:** Veliki fontovi (clamp za responsivnost), serif za naslove, sans za body; **Theme customization** – font, veličina i boja po elementu (title, heading, body, quote, nav, caption) putem Admin → Theme
- **Prostor:** Generozan whitespace, minimalan UI
- **Kontrast:** Jaka čitljivost, suptilni hover efekti

### 6.2 Typography Scale

```css
/* Primjer Tailwind konfiguracije */
fontSize: {
  'display': ['clamp(3rem, 8vw, 6rem)', { lineHeight: '1.1' }],
  'heading': ['clamp(1.5rem, 4vw, 2.5rem)', { lineHeight: '1.2' }],
  'body': ['clamp(1rem, 2vw, 1.125rem)', { lineHeight: '1.6' }],
}
```

### 6.3 Image Grid

**Balanced Left-to-Right Masonry (implementirano)**

- **Balansirana raspodjela** – slike se dodaju u stupac s najmanjom trenutnom visinom (shortest column first); rezultat: stupci približno jednake visine, minimalne praznine
- **useColumnCount hook:** Određuje broj stupaca prema viewportu (1 col &lt;640px, 2 cols 640–768px, 3 cols 768–1024px, 4 cols ≥1024px)
- **imageColumns algoritam:** Niz `heights` (jedan po stupcu, inicijalno 0). Za svaku sliku: `aspectRatio = height/width`; slika ide u stupac s `Math.min(...heights)`; `heights[shortestIdx] += aspectRatio`
- **Redoslijed:** Slike se obrađuju sekvencijalno iz `filteredImages` – prve idu u prazne stupce (1, 2, 3, 4 u prvom redu), zatim se popunjavaju rupe; redoslijed se prirodno održava
- **Layout:** `display: grid` s `grid-template-columns: repeat(columnCount, 1fr)`; svaki stupac je `flex flex-col` s `gap-2 sm:gap-4`

### 6.4 Theme Customization

- **theme.json:** Font, fontSize i color za svaki element (title, heading, **headingOnDark**, body, quote, nav, caption)
- **headingOnDark:** Naslov na tamnoj pozadini – za About i Contact stranice (h1); prilagodljiv font, veličina i boja; `.theme-heading-on-dark` u globals.css
- **themeFonts.ts:** Centralna konfiguracija fontova – `THEME_FONTS` (id, label, cssVar, previewFamily); `FONT_MAP` za CSS; `FONT_OPTIONS` za admin dropdown
- **ThemeStyles:** Async server komponenta u layoutu – učitava theme, injektira `body { --theme-*-font, --theme-*-size, --theme-*-color }` (body selector za ispravno nasljeđivanje font varijabli)
- **globals.css:** Prose h1–h6, p, li, blockquote koriste `var(--theme-heading-font)`, `var(--theme-body-font)` itd.; utility klase `.theme-title`, `.theme-heading`, `.theme-heading-on-dark`, `.theme-nav`, `.theme-caption` za elemente izvan prose
- **Dodavanje fonta:** 1) `layout.tsx` – import iz `next/font/google`, dodaj variable u body; 2) `themeFonts.ts` – novi zapis u `THEME_FONTS`

### 6.5 Prose Content (About, Contact, Blog)

Sadržaj stranica renderira se s Tailwind `prose` klasama. U `globals.css`:

- **Razmak između blokova:** `margin-top: 1.5em` za sve susjedne blokove (paragrafi, citati, naslovi) – lakše čitanje
- **Blockquote (citat):** Lijevi border 4px, padding, italic; **dekorativni zaobljeni navodnik** (U+201C) u pozadini – stvarni HTML element (`.quote-decor`) injektiran putem **ProseContent** komponente (radi u Safariju); tamna varijanta za prose-invert
- **Tablica:** Granice, padding, header pozadina; tamna varijanta za prose-invert

**Stranice:**
- **ProseContent:** Client komponenta koja renderira HTML (dangerouslySetInnerHTML); injektira `.quote-decor` span u svaki blockquote – Safari kompatibilno; **wrapa slike** u `div.prose-img-wrapper` – vizual kao BlogGallery/PressSection (zaobljeni uglovi, sjena, hover scale 1.03); **poravnanje** – `data-text-alignment` (BlockNote) za center/left/right
- **About / Contact:** `ProseContent` s `prose prose-invert prose-lg`, naslov (h1) odvojen, svijetli tekst na tamnoj pozadini; About i Contact imaju split layout (left image + right content)
- **Blog:** `ProseContent` s `prose prose-zinc prose-headings:font-serif`, bijela pozadina; **formatBlogDate** – datum u formatu `dd. mm. yyyy.`; **Footer** – copyright (© year, All rights reserved / Sva prava pridržana ovisno o stranici)

**BlockNote editor (admin):** Razmak između blokova – `.blocknote-editor-wrapper .bn-block-group > .bn-block-outer { margin-bottom: 1.5rem }` u globals.css; quote blok s dekorativnim navodnikom (CSS ::before)

### 6.6 Animations (Framer Motion)

- **Fade-in na load:** `initial={{ opacity: 0 }}` → `animate={{ opacity: 1 }}` – bez y-offseta
- **Stagger children:** Kratki stagger (0.02s) za grid items
- **AnimatePresence:** `mode="sync"` – svaki stupac ima vlastiti AnimatePresence za exit animacije

---

## 7. Build Process

### 7.1 Skripte u `package.json`

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

### 7.2 Lokalni razvoj i upravljanje

```bash
npm run dev
```

- Pokreće dev server na `http://localhost:3000`
- Admin panel dostupan na `/admin`
- API routes aktivne: `/api/upload`, `/api/exif-preview`, `/api/update`, `/api/delete`, `/api/hero`, `/api/reorder`, `/api/gallery`, `/api/gallery/generate-slugs`, `/api/media`, `/api/media-delete`, `/api/media-detach`, `/api/content-health`, `/api/health`, `/api/pages`, `/api/blog`, `/api/theme`
- Hot reload za brze promjene

### 7.2.1 Skripte za održavanje

- **populate-blog-exif.mjs:** `node scripts/populate-blog-exif.mjs` – popunjava `blogExif.json` EXIF podacima iz postojećih blog galerijskih slika (exifr); za nove slike EXIF se automatski sprema pri uploadu

### 7.5 Preview statičnog builda

```bash
npm run preview
```

- Servira `out/` folder (npx serve out) za lokalni pregled produkcijskog builda

### 7.3 Produkcijski build

```bash
npm run build
```

- Generira statični output u `out/`
- Struktura: `out/index.html`, `out/uploads/`, `out/_next/`, itd.
- Cijeli `out/` folder se može deployati na bilo koji statični hosting

### 7.4 Deployment

- **Vercel / Netlify:** Povezivanje repozitorija, build command: `npm run build`, output directory: `out`
- **GitHub Pages:** GitHub Action koji pokreće `npm run build` i pusha `out/` u `gh-pages` branch
- **Vlastiti server:** Upload `out/` na web server (nginx, Apache) kao statični sadržaj

---

## 8. Projektna struktura

```
DrusanyPortfolio/
├── public/
│   ├── drusany-logo.svg   # Logo (inline u Header.tsx)
│   └── uploads/
│       ├── full/          # 2048px WebP, podfolderi po kategoriji
│       │   ├── concerts/
│       │   └── ...
│       └── thumbs/        # 600px WebP, ista struktura
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── page.tsx   # Admin panel (dev only)
│   │   ├── api/
│   │   │   ├── blog/route.ts
│   │   │   ├── blog-delete-file/route.ts
│   │   │   ├── media/route.ts
│   │   │   ├── media-delete/route.ts
│   │   │   ├── media-detach/route.ts
│   │   │   ├── blog-upload/route.ts
│   │   │   ├── delete/route.ts
│   │   │   ├── exif-preview/route.ts
│   │   │   ├── gallery/route.ts
│   │   │   ├── hero/route.ts
│   │   │   ├── pages/route.ts
│   │   │   ├── content-health/route.ts
│   │   │   ├── health/route.ts
│   │   │   ├── gallery/generate-slugs/route.ts
│   │   │   ├── reorder/route.ts
│   │   │   ├── theme/route.ts
│   │   │   ├── update/route.ts
│   │   │   └── upload/route.ts
│   │   ├── about/page.tsx
│   │   ├── blog/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── layout.tsx       # CustomCursor, ThemeStyles, Footer u body
│   │   ├── page.tsx       # Home (HeroSlider ili Gallery)
│   │   ├── robots.ts       # Generira robots.txt (allow /, disallow /admin, /api/, sitemap)
│   │   ├── sitemap.ts      # Generira sitemap.xml (stranice, blog, paginacija)
│   │   └── globals.css
│   ├── components/
│   │   ├── blog/
│   │   │   ├── BlogSidebar.tsx       # Sidebar s widgetima (search, categories, featured-posts, maps)
│   │   │   ├── ScrollToTop.tsx       # Gumb "Vrati se na vrh" – pozicioniran desno od ruba sadržaja članka
│   │   │   ├── SearchWidget.tsx      # Filter-as-you-type po naslovu, slug-u, kategorijama, sadržaju
│   │   │   ├── CategoriesWidget.tsx  # Kategorije s linkovima
│   │   │   ├── FeaturedPostsWidget.tsx # Istaknuti članci (featured postovi, do 3)
│   │   │   └── GoogleMapsWidget.tsx  # Embed karte iz Google My Maps
│   │   ├── AboutImage.tsx        # Slika za About/Contact (fill, object-cover)
│   │   ├── AboutNav.tsx          # Fiksni nav na dnu About (About, Press, Gear); aktivni link prati scroll
│   │   ├── ContactForm.tsx       # Kontakt forma (Formspree); name, email, subject, message
│   │   ├── PressSection.tsx      # About – objavljene fotografije (masonry)
│   │   ├── GearSection.tsx       # About – fotografska oprema (masonry)
│   │   ├── AdminClient.tsx       # Admin UI (Dashboard, Gallery, Pages, Blog, Media, Theme)
│   │   ├── AdminMedia.tsx       # Media library (agregirani prikaz, filter, search, paginacija, detach, bulk)
│   │   ├── AdminDashboard.tsx    # Dashboard (bar/pie grafikoni – Recharts; Content health s ikonama – Camera, Tag, ImageOff, Search; tooltip stilizacija)
│   │   ├── AdminPages.tsx        # About/Contact editor (BlockNote, quote, FormspreeEndpoint)
│   │   ├── AdminBlog.tsx         # Blog post editor (BlockNote, galerija, bulk delete)
│   │   ├── BlogGallery.tsx       # Blog galerija (masonry, lightbox, aperture cursor)
│   │   ├── BlogList.tsx          # Lista blog postova (metapodaci, filtriranje)
│   │   ├── BlockNoteEditor.tsx   # BlockNote WYSIWYG (HTML)
│   │   ├── BlockNoteEditorDynamic.tsx  # Dynamic import, ssr: false
│   │   ├── StaticBlockTypeBar.tsx # Traka stila bloka (cursor position)
│   │   ├── DateTimePicker.tsx    # Datum + vrijeme (react-day-picker, tamna tema)
│   │   ├── DatePicker.tsx        # Samo datum (Blog)
│   │   ├── AdminDateDropdown.tsx # Custom dropdown mjesec/godina (admin)
│   │   ├── ProseContent.tsx      # Renderiranje HTML-a s .quote-decor u blockquote
│   │   ├── CategorySelect.tsx    # Custom category dropdown
│   │   ├── VenueSelect.tsx       # Venue dropdown (Concerts)
│   │   ├── SportSelect.tsx       # Sport type dropdown (Sport)
│   │   ├── Footer.tsx           # Copyright (© year, All rights reserved / Sva prava pridržana)
│   │   ├── ThemeAdmin.tsx        # Theme customization (font, size, color po elementu; custom dropdown)
│   │   ├── ThemeStyles.tsx      # Injektira theme CSS varijable u :root
│   │   ├── CustomCursor.tsx   # Custom cursor (dot + aperture, desktop only)
│   │   ├── Gallery.tsx        # Balanced masonry (shortest column) + lightbox; useColumnCount, imageColumns
│   │   ├── Header.tsx        # Logo (inline SVG), Nav + Portfolio dropdown, Search (kad galerija), aktivna stranica, hover efekti
│   │   ├── HeroSlider.tsx    # 6 category slides, auto-play 4s, wheel/swipe/strelicama lijevo-desno
│   │   └── HomeContent.tsx   # Conditional Hero/Gallery; overflow hidden na hero
│   ├── lib/
│   │   ├── blogWidgets.ts   # getBlogWidgets – čitanje blogWidgets.json
│   │   ├── blogCleanup.ts  # Čišćenje orphan datoteka pri promjeni slug-a/datuma; brisanje posta
│   │   ├── exif.ts         # Zajednički EXIF modul (formatExposure, formatAperture, getExifExtras, getExifDescription, getKeywords, dateToISO, formatDateForInput)
│   │   ├── getGallery.ts   # Čitanje gallery.json, sortiranje po order (pa capturedAt desc), generiranje slug
│   │   ├── gear.ts         # getGear – čitanje gear.json
│   │   ├── imageValidation.ts # Magic bytes provjera (JPEG/PNG/GIF/WebP)
│   │   ├── jsonLock.ts     # File locking (proper-lockfile) za gallery, blog, pages
│   │   ├── pages.ts        # getPages, savePages – About/Contact; sanitizeProseHtml pri čitanju
│   │   ├── press.ts        # getPress – čitanje press.json
│   │   ├── blog.ts         # getBlog, getBlogPost – čitanje blog.json, sanitizeProseHtml za body, enrichBlogGallery (Sharp)
│   │   ├── rateLimit.ts    # Rate limiting (60 req/min po IP) za admin API
│   │   ├── sanitize.ts     # sanitizeProseHtml – HTML sanitizacija (sanitize-html)
│   │   ├── slug.ts         # slugify, generateSlug (title+venue+year), generateBlogSlug, isValidBlogSlug, normalizeBlogSlug (yymmdd-naslov)
│   │   └── theme.ts        # getTheme, saveTheme, themeToCssVariables – čitanje/spremanje theme.json
│   └── data/
│       ├── gallery.json    # Flat-file baza slika
│       ├── pages.json      # About (title, html, quote), Contact (title, html, email, formspreeEndpoint)
│       ├── gear.json       # Fotografska oprema (About)
│       ├── press.json      # Objavljene fotografije (About)
│       ├── blog.json       # Blog postovi
│       ├── blogExif.json   # EXIF za blog galerijske slike (camera, lens, exposure, aperture, iso)
│       └── blogWidgets.json # Konfiguracija blog sidebara (search, categories, featured-posts, maps)
├── scripts/
│   └── populate-blog-exif.mjs  # Popunjava blogExif.json iz postojećih slika (exifr)
├── out/                   # Generirano pri build (gitignore)
├── next.config.ts
├── package.json
└── architecture.md
```

---

## 8.1 Home Page & Navigation

### Home (`/`)

- **Bez `?category`:** HeroSlider – 6 slideova (Concerts, Sport, Animals, Interiors, Zagreb, Food & Drink), 100vh, wheel/swipe/strelicama lijevo-desno, **auto-play svake 4 sekunde**, Framer Motion; `overflow: hidden` na html/body da wheel mijenja slideove
- **Stranica galerije:** `min-h-screen` na bijelom divu – nema crnog prostora kad ima malo slika; `window.scrollTo(0, 0)` pri prelasku na galeriju da se vrh (filter) odmah vidi
- **S `?category=concerts`:** Masonry galerija filtrirana po kategoriji; venue filter (samo dvorane s barem jednom slikom); **Search** u headeru (expandable na hover, filter as you type, placeholder "Search in gallery...")
- **S `?category=sport`:** Isto s sport filterom (Football, Basketball, Handball, itd. – samo vrste s barem jednom slikom)
- **Filtriranje:** Client-side preko `gallery.json` – `images.filter(img => category === img.category)`; za Concerts i `?venue=slug`; za Sport i `?sport=slug`
- Hero slika: **samo ručno odabrana** (`isHero: true`) – nema fallback na prvu/najnoviju sliku; ako nema hero, prikazuje se placeholder s nazivom kategorije

### Gallery & Lightbox

- **Masonry grid:** Balanced left-to-right – slike u stupac s najmanjom visinom (shortest column); aspect ratio iz `width`/`height` u gallery.json; stupci približno jednake visine, minimalne praznine; `useColumnCount` za responsivne stupce (1–4); slike s thumb putanjama, klik otvara lightbox
- **Scroll na učitavanju:** Pri navigaciji na galeriju (`?category` + `#gallery`) stranica se eksplicitno skrola na vrh (`window.scrollTo(0, 0)`) – u HomeContent i Gallery (setTimeout 0) – kako bi Venue/Sport filter bio odmah vidljiv; `id="gallery"` na wrapperu koji uključuje filter bar i grid
- **Venue filter (Concerts):** Samo dvorane s barem jednom slikom; label "Venue:"; linkovi s podcrtom, `text-xs`; hover efekt (donja crta)
- **Sport filter (Sport):** Samo vrste sporta s barem jednom slikom; label "Sport:"; isti stil kao venue; hover efekt (donja crta)
- **Search:** U headeru, desno od Contact linka (dio navigacije); vidljiv samo kad je otvorena galerija (`?category`); ikona povećala, expandable na hover; filter as you type (title, alt, keywords, venue, sport, category); placeholder "Search in gallery..."; URL parametar `q`; kad pretraga nema rezultata – prazan grid (bez poruke "No images")
- **ImageCard hover:** Scale 1.03 (700ms), tamni overlay (500ms), caption: **title @ venue** (Concerts) ili **Sport // title** (Sport) u jednom redu, datum ispod (manji font); glatke tranzicije; **Interiors, Animals:** bez opisa i datuma
- **Lightbox:** Slika fit-to-screen (max 2048px, max 100vh); numeracija (1/10) i X gumb na vrhu u istoj liniji; donji caption u okviru s crnom prozirnom pozadinom: **title @ venue, date** (14px) ili **Sport // title, date**; EXIF (camera, lens, exposure, aperture, ISO) – ikona kamere za toggle, prikaz u istom okviru kad uključeno (10px); **Interiors, Animals:** bez opisa i datuma; URL se ažurira s `?image=slug` (useEffect, ne setState callback)
- **Copyright zaštita:** Desni klik onemogućen (`onContextMenu` preventDefault); pri pokušaju prikazuje se popup s copyright porukom
- **Navigacija:** Strelicama (prev/next), swipe na mobilnom, Escape za zatvaranje

### Header

- **Logo:** Inline SVG komponenta `DrusanyLogo` (iz `public/drusany-logo.svg`), poravnat na lijevo (`preserveAspectRatio="xMinYMid meet"`), eksplicitna boja (#ffffff hero / #18181b kategorije)
- **Layout:** Bez `mx-auto` – sadržaj poravnat na lijevo; smanjen lijevi padding (`pl-4`)
- **Pozadina:** Na stranici s kategorijom uvijek bijela pozadina (`bg-white/95`); na hero-u transparent, pri scrollu tamna
- **Linkovi:** Home, Portfolio (dropdown kategorija), About, Blog, Contact
- **HeroSlider:** "View Gallery" link (ne "View Project"); prikaz **title @ venue** ako postoji
- **Aktivna stranica:** `usePathname` + `useSearchParams` za određivanje trenutne lokacije; crta ispod (`border-b`) aktivnog linka na desktopu; crta lijevo (`border-l-2`) u Portfolio dropdownu i mobilnom izborniku
- **Hover efekti:** Donja crta na hover za sve nav linkove (Home, Portfolio, About, Blog, Contact), filtere (Venue, Sport, Type) i mobilni izbornik; `inline-block`, eksplicitne boje (`border-zinc-900` / `border-white`), `transition-[color,border-color]` – Safari kompatibilnost (izbjegava `border-current` i `border-transparent` koji ne rade pouzdano)

### Custom Cursor (desktop only)

- **CustomCursor.tsx** u layoutu; aktivno samo kad `(hover: hover)` (touch uređaji isključeni)
- **Dot:** Bijela točka (10px), `mix-blend-mode: difference`; **trenutni odziv** – `useMotionValue` za x/y, ažurira se direktno u `mousemove` bez React re-rendera; `setIsVisible` samo pri prvom pomicanju (ref), ne na svaki move
- **Aperture ikona:** Prikazuje se samo preko fotografija (`data-cursor-aperture` na galeriji, hero slideru, lightboxu, **blog galeriji**); scale 1.5 na hover nad klikabilnim elementima; **spring animacija** (stiffness 500, damping 28) – namjerno kašnjenje, glatko prati miš
- **globals.css:** `body.custom-cursor-active * { cursor: none }`

### About, Contact, Blog stranice

- **About (`/about`):** Split layout – lijevo fiksna slika (40% širine na desktopu) s opcionalnim citatom u donjem lijevom kutu; desno scrollabilni sadržaj (Back, naslov, prose HTML, PressSection, GearSection); **AboutNav** fiksno na dnu – linkovi About, Press, Gear s aktivnim stanjem (crta ispod); scroll na vrh pri učitavanju; aktivni link prati scroll (listener na main + window)
- **Contact (`/contact`):** Isti layout kao About – lijevo slika, desno sadržaj; sadrži Back, naslov, uvodni prose (iz pages.json), **ContactForm** (name, email, subject, message); Formspree za slanje; fallback na mailto ako Formspree nije postavljen; success/error stanja
- **Blog (`/blog`):** Lista postova – kartice s naslovom, metapodacima (Tekst i fotografije: Ivica Drusany, Datum objave, Kategorija) i slikom ispod; bez overlayja na slikama; **BlogSidebar** s desne strane – SearchWidget (filter-as-you-type po naslovu, slug-u, kategorijama, sadržaju), CategoriesWidget, **FeaturedPostsWidget** (istaknuti članci, do 3), GoogleMapsWidget (embed iz Google My Maps); **pretraga** po `q` parametru; sortiranje od najnovijeg; **filtiranje kategorija** – glatka fade animacija (AnimatePresence) pri promjeni filtera; `scroll={false}` na linkovima da stranica ne skrola na vrh; `/blog/[slug]` – pojedinačni post: naslov i metapodaci na vrhu, featured slika ispod, prose body (slike s poravnanjem, vizual kao galerija), galerija na dnu (EXIF iz blogExif.json); bijela pozadina; **Footer** na dnu stranice; **ScrollToTop** gumb – pozicioniran desno od ruba sadržaja članka (`lg:right-[max(27rem,calc(50vw-14.5rem))]`)
- **Blog metapodaci:** Ikone (PenLine, Camera, Calendar, Tag); redak „Tekst i fotografije: Ivica Drusany“, „Datum objave: dd. mm. yyyy.“, „Kategorija:“ s linkovima (donja crta, border-b); razmak između blokova: inline `marginRight: "3rem"` (Safari kompatibilnost)
- **Blog galerija:** Ista logika kao portfolio – masonry (shortest column), dimenzije iz Sharp metadata; lightbox (prev/next, swipe, Escape); aperture cursor na thumbovima i lightboxu; brisanje slika iz admina briše i fizičke datoteke; **progresivno učitavanje** – galerije s više od 24 slike prikazuju prvu grupu, zatim učitavaju sljedeće pri skrolanju (Intersection Observer); indikator napretka (npr. 24/100); lightbox i dalje radi s cijelom listom

### Kategorije

Fiksna lista u `CategorySelect` i `Header`: concerts, sport, animals, interiors, zagreb, food-drink. Mogućnost custom kategorije putem "Other (custom)".

### EXIF tijek

- **Pri uploadu:** exifr parsira datoteku (makerNote, xmp, iptc), izvlači datum, naslov, keywords (IPTC/XMP), camera, lens, exposure, aperture, ISO → spremljeno u `gallery.json`
- **Pri prikazu:** Nema EXIF parsiranja – podaci dolaze iz `gallery.json`; slike su statični WebP fajlovi
- **exif-preview:** Samo pri odabiru datoteke u admin formi (predpregled prije uploada)

---

## 8.2 Internationalization

- Sav UI tekst na engleskom (Admin, Gallery, About, Contact, metadata)
- Datumi: `toLocaleDateString("en-US", ...)`

---

## 9. Sigurnosne napomene

- Admin i API su **samo u developmentu** – u produkciji ne postoje
- **Path traversal zaštita** – `blog-delete-file` provjerava da rezolvirana putanja ostane unutar `public/uploads/blog/`; `media-delete` unutar `public/uploads/`
- **Ograničenje uploada** – 20 MB po datoteci (upload, blog-upload, exif-preview)
- **Magic bytes provjera** – `imageValidation.ts` provjerava file signature (JPEG/PNG/GIF/WebP) prije obrade
- **HTML sanitizacija** – `sanitizeProseHtml` (sanitize-html) pri čitanju u `getPages`, `getBlogPost`
- **Rate limiting** – `src/lib/rateLimit.ts`: in-memory limiter (200 req/min po IP, `RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_WINDOW_MS`); primijenjen na sve admin API rute; povećan s 60 na 200 radi bulk uploada. Za produkciju s više instanci zamijeniti s Redis (npr. @upstash/ratelimit)
- **File locking** – `jsonLock.ts` (proper-lockfile) za `gallery.json`, `blog.json`, `pages.json` – sprječava race condition
- Ako se ikad doda server-side admin u produkciji, obavezno: autentikacija
- `gallery.json` i `public/uploads/` trebaju biti u git repozitoriju ako želite verzionirati sadržaj (ili .gitignore ako koristite eksterni CMS za produkciju)

---

## 10. Sažetak

| Aspekt | Rješenje |
|--------|----------|
| **Framework** | Next.js 16 App Router |
| **Styling** | Tailwind CSS 4 |
| **Animacije** | Framer Motion |
| **Ikone** | Lucide Icons |
| **Image processing** | Sharp (WebP, 2048px + 600px thumbs) |
| **EXIF** | exifr (datum, naslov, keywords, camera, lens, exposure, aperture, ISO) – čita se samo pri uploadu |
| **Podaci** | `src/data/gallery.json` |
| **Slike** | `public/uploads/full/[category]/` + `thumbs/[category]/` (WebP, originalni nazivi) |
| **Admin** | `/admin` + API routes (dev only): upload, exif-preview, update, delete, hero, reorder, gallery, **media**, **media-delete**, **media-detach**, pages, blog, theme; rate limiting, file locking |
| **Sigurnost** | Path traversal fix, 20 MB limit, magic bytes, HTML sanitizacija, rate limiting |
| **Pouzdanost** | File locking (JSON), čišćenje orphan datoteka (blog slug), HTTP 500 pri greškama |
| **Admin features** | Sidebar accordion (Gallery/Pages); Category-first flow; Upload; EXIF preview (datum fallback: DateTimeOriginal→CreateDate→DateTime→ModifyDate); **custom DateTimePicker** (datum+vrijeme); **DatePicker** (Blog); **AdminDateDropdown** (mjesec/godina); CategorySelect, VenueSelect, SportSelect; Edit modal (**slug as you type**); Hero toggle; Delete; **drag-and-drop sortiranje**; **AdminPages** (About/Contact), **AdminBlog** – **status** (draft/published, StatusSelect), **filter bar** (Status, Kategorija multi, Mjesec, Sort), BlockNote editor s StaticBlockTypeBar, **upload slika u sadržaj** (content/), **editLoading** (sprječava popover crash); **BlogCategorySelect** (abecedno); **FilterSelect**, **FilterMultiSelect**; **AdminMedia** – agregirani prikaz slika (portfolio, blog, stranice), filter, search as you type, paginacija (25/stranica, Go to page), lightbox, Download/Copy URL/Detach/Delete, **multiple selection** (bulk Delete, Download, Copy URLs, Detach); **Theme** – Customize Theme (font, veličina, boja za title, heading, **headingOnDark**, body, quote, nav, caption); custom dropdown; live preview; **toast** (emerald/red, Check/AlertCircle); **Dashboard** (Recharts bar/pie, tooltip stilizacija); **Content health** – metrike s ikonama (Camera, Tag, ImageOff, Search), chips layout; klik otvara galeriju s filterom ili Blog; Media link u sidebaru i na `/admin/blog` ruti; `?tab=media` u URL-u za direktan pristup |
| **Home** | HeroSlider (6 slides, auto-play 4s, strelice lijevo-desno, "View Gallery", title @ venue) ili masonry Gallery po `?category`; hero samo ručno odabrana |
| **Header** | Logo (inline SVG), poravnanje lijevo, Search u nav (kad galerija, expandable hover), aktivna stranica (border-b/border-l), hover efekti (Safari: inline-block, eksplicitne boje) |
| **Custom Cursor** | Dot (useMotionValue, trenutni odziv) + aperture (useSpring, kašnjenje), mix-blend-difference, desktop only |
| **Gallery** | Balanced masonry (shortest column, heights array, aspect ratio); stupci približno jednake visine; useColumnCount (1–4 stupaca), venue filter (Concerts), sport filter (Sport), hover efekti na filterima; scroll na vrh pri učitavanju; ImageCard hover (title @ venue ili Sport // title, datum); Interiors, Animals bez opisa/datuma |
| **Lightbox** | Fit-to-screen, numeracija + X na vrhu, caption + EXIF u jednom okviru (crna prozirna pozadina), EXIF toggle (ikona kamere), copyright popup na desni klik, URL sync `?image=slug` |
| **Filtriranje** | Client-side preko JSON-a (`?category=slug`, `?venue=slug` za Concerts, `?sport=slug` za Sport); search filter as you type (title, alt, keywords, venue, sport, category); direktni linkovi `?image=slug` |
| **Pages & Blog** | `pages.json` (About: title, html, quote; Contact: title, html, email, formspreeEndpoint); `gear.json`, `press.json`; **ProseContent** (HTML + .quote-decor u blockquote; **sanitizeProseHtml** pri čitanju; **wrapa slike** u prose-img-wrapper – zaobljeni uglovi, sjena, hover scale; data-text-alignment za poravnanje); About split layout (image + content), AboutNav, ContactForm (Formspree); BlockNote editor; prose blockquote s dekorativnim navodnikom, tablica; **Blog:** slug `yymmdd-naslov` (validacija); **BlogSidebar** (SearchWidget, CategoriesWidget, FeaturedPostsWidget, GoogleMapsWidget); pretraga po naslovu/slug-u/kategorijama/sadržaju; **filtiranje kategorija** – glatka fade animacija (AnimatePresence), scroll: false; kategorije (višestruki odabir), masonry galerija (Sharp dimenzije), **progresivno učitavanje** (24 slike po grupi, Intersection Observer); lightbox, aperture cursor, metapodaci (Tekst i fotografije, Datum objave, Kategorija) s ikonama, format datuma dd. mm. yyyy.; **BlockNote slike u sadržaju** – upload (content/), resize handles, poravnanje; blog-delete-file za brisanje fajlova s diska; **blogCleanup** pri promjeni slug-a/datuma; **ScrollToTop** – pozicija desno od ruba sadržaja članka |
| **Export** | `output: 'export'`, `images.unoptimized: true` |
| **Output** | `out/` folder |
| **SEO** | **sitemap.xml**, **robots.txt** – generirani pri buildu (`sitemap.ts`, `robots.ts`); sitemap uključuje sve stranice, blog postove i paginaciju; robots allow /, disallow /admin, /api/; koristi NEXT_PUBLIC_SITE_URL |
| **Design** | Minimalist, velika tipografija, masonry/full-bleed, fade-in |
| **Jezik** | Engleski (UI, metadata, datumi) |
