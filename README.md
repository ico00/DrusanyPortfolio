# Drusany Portfolio

Statični fotografski portfolio izgrađen na Next.js – galerija s masonry layoutom, kategorijama, lightboxom i lokalnim admin panelom za upravljanje sadržajem.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)

## ✨ Značajke

- **Custom cursor** – Dot (trenutni odziv, useMotionValue) + aperture ikona (spring kašnjenje) preko fotografija; mix-blend-difference; samo na desktopu
- **Galerija** – Balanced masonry layout (stupci približno jednake visine), filtriranje po kategorijama (Concerts, Sport, Animals, Interiors, Zagreb, Food & Drink)
- **SEO** – **sitemap.xml** i **robots.txt** generirani pri buildu; sitemap uključuje sve stranice, blog postove i paginaciju
- **Sigurnost i pouzdanost** – Path traversal zaštita, ograničenje uploada (20 MB), magic bytes provjera, HTML sanitizacija, rate limiting, file locking za JSON, čišćenje orphan datoteka pri promjeni blog slug-a
- **Lightbox** – Puni prikaz slike, EXIF podaci (camera, lens, aperture…), navigacija strelicama ili swipeom
- **Hero slider** – Početna stranica s 6 slideova po kategorijama, auto-play
- **Pretraga** – Filter as you type (naslov, venue, sport, keywords)
- **Direktni linkovi** – URL slug po slici (npr. `/?category=concerts&image=depeche-mode-arena-zagreb-2013`)
- **About** – Split layout (lijevo slika s citatom, desno sadržaj); sekcije About, Press, Gear; fiksni nav na dnu s aktivnim linkom koji prati scroll; **dekorativni navodnik** na blockquote citatima
- **Contact** – Isti layout kao About; kontakt forma (Formspree) – name, email, subject, message; fallback na mailto
- **Blog** – Lista postova s metapodacima (Tekst i fotografije, Datum objave, Kategorija) i ikonama; **status** (draft / published) – draft postovi se ne prikazuju javno; **sidebar** s pretragom (filter-as-you-type), kategorijama, **istaknutim člancima** (featured) i Google Maps; **glatka animacija** pri promjeni filtera kategorija; pojedinačni post s naslovom na vrhu, featured slikom, sadržajem (slike s poravnanjem, vizual kao galerija) i masonry galerijom (lightbox, aperture cursor, EXIF); **progresivno učitavanje** galerije – za postove s 100+ slika prikazuje se prva grupa, zatim učitavanje pri skrolanju; format datuma dd. mm. yyyy.; BlockNote WYSIWYG editor s **uploadom slika** u sadržaj; **Footer** (copyright); **ScrollToTop** gumb – pozicioniran desno od ruba sadržaja članka
- **Theme** – Prilagodba fonta, veličine i boje po elementu (title, heading, **headingOnDark** – naslov na tamnoj pozadini za About/Contact, body, quote, nav, caption) putem Admin → Theme; live preview; centralna konfiguracija fontova u `themeFonts.ts` (lako dodavanje novih)
- **Admin panel** – Samo u development modu: **Dashboard** (grafikoni – Recharts); galerija (upload, edit, hero, sortiranje) s **custom DateTimePicker**; About/Contact (quote, Formspree endpoint); Blog s **DatePicker**, **upload slika u sadržaj** (BlockNote `/image`), **resize** slika; **Media** – agregirani prikaz svih slika (portfolio, blog, stranice), filter, search as you type, paginacija, lightbox, Download/Copy URL/Detach/Delete, **multiple selection** (bulk akcije); **Theme** – prilagodba fonta, veličine i boje po elementu (title, heading, body, quote, nav, caption) s live previewom; **sidebar accordion**; **toast** poruke (success/error)

## 🛠 Tech stack

| Tehnologija | Namjena |
|-------------|---------|
| Next.js 16 | App Router, statični export |
| Tailwind CSS 4 | Styling |
| BlockNote | Rich text editor (About, Contact, Blog) |
| react-day-picker | Custom datum/vrijeme picker u adminu |
| Recharts | Dashboard grafikoni (bar, pie) |
| Formspree | Contact form submissions (optional, fallback: mailto) |
| Framer Motion | Animacije |
| Sharp | Image processing (WebP, resize) |
| exifr | EXIF metadata (datum fallback: DateTimeOriginal→CreateDate→DateTime→ModifyDate, naslov, camera, lens…) |
| sanitize-html | HTML sanitizacija pri čitanju sadržaja |
| proper-lockfile | File locking za JSON (gallery, blog, pages) |

## 📋 Preduvjeti

- **Node.js** 18+ (preporučeno 20+)
- **npm** ili **pnpm** ili **yarn**

## 🚀 Brzi start

### 1. Kloniraj repozitorij

```bash
git clone https://github.com/ico00/DrusanyPortfolio.git
cd DrusanyPortfolio
```

### 2. Instaliraj ovisnosti

```bash
npm install
```

### 3. Pokreni development server

```bash
npm run dev
```

Otvori [http://localhost:3000](http://localhost:3000) u pregledniku.

- **Početna stranica** – Hero slider s kategorijama
- **Galerija** – Dodaj `?category=concerts` (ili sport, animals, interiors, zagreb, food-drink) u URL
- **About** – `/about` (split layout, Press, Gear sekcije)
- **Contact** – `/contact` (split layout, Formspree forma)
- **Blog** – `/blog`
- **Admin panel** – [http://localhost:3000/admin](http://localhost:3000/admin) – dostupan **samo u dev modu**

## 📜 Dostupne naredbe

| Naredba | Opis |
|---------|------|
| `npm run dev` | Pokreće development server na portu 3000 |
| `npm run build` | Generira statični output u folder `out/` |
| `npm run preview` | Servira `out/` folder lokalno (za testiranje produkcijskog builda) |
| `npm run lint` | Pokreće ESLint |
| `node scripts/populate-blog-exif.mjs` | Popunjava blogExif.json EXIF podacima iz postojećih blog galerijskih slika |
| `curl localhost:3000/api/health` | Health check (dev) – provjerava JSON datoteke i kritične resurse; u buildu prerenderira se u `out/api/health` |

## 📁 Struktura projekta

```
DrusanyPortfolio/
├── public/uploads/       # Slike (full 2048px + thumbs 600px, WebP)
├── src/
│   ├── app/              # Stranice i API rute
│   │   ├── admin/        # Admin panel (dev only): layout, page, blog/ (lista, edit/[id], new)
│   │   ├── api/          # upload, update, delete, reorder, hero, gallery, gallery/generate-slugs, media, media-delete, media-detach, content-health, health, pages, blog, blog-upload, blog-delete-file, theme
│   │   ├── about/        # About stranica
│   │   ├── contact/      # Contact stranica
│   │   ├── blog/         # Blog lista + [slug] pojedinačni post
│   │   ├── sitemap.ts    # Generira sitemap.xml pri buildu
│   │   └── robots.ts     # Generira robots.txt pri buildu
│   ├── components/       # Gallery, Header, AdminClient, AdminMedia, BlockNoteEditor, AdminPages, AdminBlog, BlogGallery, BlogList…
│   ├── contexts/        # UnsavedChangesContext (admin)
│   ├── data/
│   │   ├── adminUI.ts       # Centralizirani UI stringovi za admin
│   │   ├── gallery.json    # Metapodaci o slikama
│   │   ├── pages.json       # About (title, html, quote), Contact (title, html, email, formspreeEndpoint)
│   │   ├── gear.json        # Fotografska oprema (About)
│   │   ├── press.json       # Objavljene fotografije (About)
│   │   ├── blog.json        # Blog postovi (slug yymmdd-naslov, title, date, categories, thumbnail, gallery)
│   │   ├── blogExif.json    # EXIF za blog galerijske slike (populate-blog-exif.mjs)
│   │   ├── blogWidgets.json # Konfiguracija blog sidebara (search, categories, featured-posts, maps)
│   │   ├── theme.json       # Theme konfiguracija (font, fontSize, color po elementu)
│   │   └── themeFonts.ts   # Konfiguracija fontova za Theme (dodavanje novih fontova)
│   └── lib/              # getGallery, pages, gear, press, blog, blogWidgets, theme, slug, exif, sanitize, imageValidation, jsonLock, blogCleanup, rateLimit
├── .env.example          # NEXT_PUBLIC_SITE_URL, RATE_LIMIT_* (opcionalno)
├── scripts/
│   └── populate-blog-exif.mjs  # Popunjava blogExif.json iz postojećih slika (node scripts/populate-blog-exif.mjs)
└── out/                  # Statični output (generira se pri build)
```

## 🖼 Admin panel

Admin je dostupan **samo kada pokreneš `npm run dev`** – u produkcijskom buildu se ne uključuje.

**Funkcionalnosti:**
- **Dashboard:** Pregled sadržaja – bar/pie grafikoni (Recharts); **Content health** – metrike s ikonama (Camera, Tag, ImageOff, Search); slike bez EXIF-a, slike bez slug-a, blog postovi bez featured slike (klik otvara galeriju s filterom ili Blog)
- **Sigurnost:** Rate limiting (200 req/min po IP – bulk upload), path traversal zaštita, ograničenje uploada 20 MB, magic bytes provjera, HTML sanitizacija; file locking za JSON; čišćenje orphan datoteka pri promjeni blog slug-a
- **Galerija:** Sidebar accordion; odabir kategorije → upload slika; EXIF preview (datum fallback); **custom DateTimePicker** (datum + vrijeme); uređivanje opisa (title, venue, sport, slug, keywords…); slug **as you type**; drag-and-drop sortiranje; hero odabir; brisanje; **Content health** – gumb "Generiraj slugove" kad je filter no-slug; **toast** poruke
- **Pages:** About – citat na slici, naslov, BlockNote sadržaj; Contact – Formspree endpoint, email (fallback), naslov, uvodni tekst (BlockNote)
- **Blog:** Kreiranje i uređivanje blog postova – **status** (draft / published, custom StatusSelect); title, slug (format `yymmdd-naslov`), **custom DatePicker** za datum, kategorije (višestruki odabir, abecedno), thumbnail, sadržaj (BlockNote s **uploadom slika** – `/image` → Upload/Embed, resize ručice), galerija (drag-and-drop, bulk delete); **filter bar** u listi – Status, Kategorija (višestruki odabir), Mjesec, Sort; **SEO** – meta description placeholder (Fotografije + event + lokacija + godina + što se vidi); brisanje slika iz galerije briše i fizičke datoteke s diska
- **Media:** Agregirani prikaz svih slika (portfolio, blog, stranice) – filter po tipu, search as you type, paginacija (25/stranica, Go to page), lightbox u punoj rezoluciji; akcije: Download, Copy URL, Detach (odvajanje od stranice – datoteka ostaje), Delete; **multiple selection** – bulk Delete, Download, Copy URLs, Detach; Media link dostupan i na `/admin/blog` ruti
- **Theme:** Prilagodba tipografije – font (Sans/Serif/Mono), veličina i boja za svaki element (Hero naslov, Naslovi, **Naslov na tamnoj pozadini** – About/Contact, Body, Citat, Navigacija, Caption); custom dropdown; live preview s adaptivnom pozadinom; za statički export: uređivanje u dev modu, zatim `npm run build`; novi fontovi se dodaju u `themeFonts.ts` i `layout.tsx`

**Contact forma:** Za slanje poruka koristi se [Formspree](https://formspree.io) – kreiraj besplatni form u adminu unesi endpoint. Ako nije postavljen, koristi se mailto.

## 🌐 Deployment

Projekt se builda u čisto statični output (`out/`). Može se deployati na:

- **Vercel** – `npm run build`, output directory: `out`
- **Netlify** – build command: `npm run build`, publish directory: `out`
- **GitHub Pages** – GitHub Action koji pokreće build i pusha `out/` u `gh-pages`
- **Vlastiti server** – upload sadržaja iz `out/` na web server

## 📖 Dokumentacija

Detaljna arhitektura, API rute, design sustav i konvencije su opisani u **[architecture.md](./architecture.md)**.

**Konfiguracija:** Kopiraj `.env.example` u `.env` i postavi `NEXT_PUBLIC_SITE_URL` (za Open Graph, canonical linkove, sitemap, robots.txt). Canonical URL = `NEXT_PUBLIC_SITE_URL` + path (npr. `https://drusany.com/blog/251228-advent-2025`). Opcionalno: `RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_WINDOW_MS` za rate limiting.

## 📄 Licenca

Privatni projekt – sva prava zadržana.
