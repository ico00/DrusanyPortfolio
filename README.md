# Drusany Portfolio

Statični fotografski portfolio izgrađen na Next.js – galerija s masonry layoutom, kategorijama, lightboxom i lokalnim admin panelom za upravljanje sadržajem.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)

## ✨ Značajke

- **Custom cursor** – Dot (trenutni odziv, useMotionValue) + aperture ikona (spring kašnjenje) preko fotografija; mix-blend-difference; samo na desktopu
- **Galerija** – Balanced masonry layout (stupci približno jednake visine), filtriranje po kategorijama (Concerts, Sport, Animals, Interiors, Zagreb, Food & Drink)
- **SEO** – **sitemap.xml** i **robots.txt** generirani pri buildu; sitemap uključuje sve stranice, blog postove i paginaciju
- **Sigurnost i pouzdanost** – Path traversal zaštita, ograničenje uploada (20 MB), magic bytes provjera, HTML sanitizacija (rel="noopener noreferrer" na vanjskim linkovima), rate limiting, file locking za JSON; pri promjeni blog slug-a/datuma automatsko preimenovanje foldera i ažuriranje putanja
- **Lightbox** – Puni prikaz slike, EXIF podaci (camera, lens, aperture…), navigacija strelicama ili swipeom
- **Hero slider** – Početna stranica s 6 slideova po kategorijama, auto-play
- **Pretraga** – Debounced (200ms portfolio, 300ms blog) – trenutni odziv pri tipkanju; filter (naslov, venue, sport, keywords)
- **Direktni linkovi** – URL slug po slici (npr. `/?category=concerts&image=depeche-mode-arena-zagreb-2013`)
- **About** – Split layout (lijevo slika s citatom, desno sadržaj); sekcije About, Press, **Gear** (grupirano po kategorijama: Cameras, Lenses, Accessories; kartice bez lightboxa); fiksni nav na dnu s aktivnim linkom koji prati scroll; **dekorativni navodnik** na blockquote citatima
- **Contact** – Isti layout kao About; kontakt forma (Formspree) – name, email, subject, message; fallback na mailto
- **Blog** – Lista postova (migrirano iz WordPressa – `npm run blog:import:all`); metapodaci (Tekst i fotografije, Datum objave, Kategorija) i ikonama; **status** (draft / published) – draft postovi se ne prikazuju javno; **sidebar** s pretragom (debounced 300ms), kategorijama (**accordion** za Sport, Gradovi – podkategorije abecedno sortirane), **istaknutim člancima** (featured, max 3), **planovima** (planirani snimanja – datum + naziv iz plans.json) i Google Maps; **glatka animacija** pri promjeni filtera kategorija; pojedinačni post s naslovom na vrhu, featured slikom, sadržajem (slike 100% širine stupca; **YouTube video blok** – zalijepi link, embed po širini; overflow-x-hidden sprječava preljev) i masonry galerijom (lightbox, aperture cursor, EXIF); **LCP optimizacija** – featured slika s loading eager, fetchPriority high i preload; galerije loading lazy; **progresivno učitavanje** galerije – za postove s 100+ slika prikazuje se prva grupa, zatim učitavanje pri skrolanju; format datuma dd. mm. yyyy.; BlockNote WYSIWYG editor s **uploadom slika** u sadržaj, **YouTube video blok** (Block style / slash `/youtube` – zalijepi link), **Media tab** za odabir postojeće slike; **Footer** (copyright); **ScrollToTop** gumb – pozicioniran desno od ruba sadržaja članka; **mobilna verzija** – autor (ikona + ime) ispod featured slike, kategorija kao link/filter; **linkovi u sadržaju** – hover: deblja linija, svjetlo plava boja
- **Theme** – Prilagodba fonta, veličine i boje po elementu (title, heading, headingOnDark, **blogPostTitle**, **blogListCardTitle**, **blogListCardMetadata**, **widgetTitle**, body, quote, code, nav, caption) putem Admin → Theme; **grupne kontrole** (Blog Headings, Blog Body); **accordion** sekcije; live preview; fontovi u `themeFonts.ts` (sans, serif, mono, Shantell Sans, Red Hat Display)
- **Admin panel** – Samo u development modu: **Dashboard** (kartice: Portfolio, Blog, Portfolio Categories, Blog Categories, Static pages, Blog posts; bar charti "Images by category in portfolio" i "Images by category in blog"; Content health); galerija (upload, edit, hero, sortiranje) s **custom DateTimePicker**; About/Contact (quote, Formspree endpoint); Blog s **DatePicker**, **upload slika u sadržaj** (BlockNote `/image` – Upload, **Media** tab za odabir postojeće slike, Embed), **resize** slika; **BlockNote editor** – Block style i Formatting toolbar **na vrhu bloka** (ne kod kursora), **okvir blokova** (lagani tanki border, padding); **Media** – agregirani prikaz svih slika (portfolio, blog, stranice), filter, search as you type, paginacija, lightbox, Download/Copy URL/Detach/Delete, **multiple selection** (bulk akcije); **Theme** – prilagodba fonta, veličine i boje po elementu (title, heading, body, quote, nav, caption) s live previewom; **sidebar accordion**; **toast** poruke (success/error)

## 🛠 Tech stack

| Tehnologija | Namjena |
|-------------|---------|
| Next.js 16 | App Router, statični export |
| Tailwind CSS 4 | Styling |
| BlockNote | Rich text editor (About, Contact, Blog) |
| react-day-picker | Custom datum/vrijeme picker u adminu |
| Recharts | Dashboard grafikoni (bar charts) |
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
| `npm run dev:open` | Otvara Terminal s dev serverom i Chrome s localhost:3000 + /admin |
| `npm run deploy:static` | Deploy: build, push na drusany-static, rsync na server |
| `npm run deploy:uploads` | Deploy samo uploads: rsync/FTP public/uploads/ (samo promijenjene datoteke) |
| `npm run lint` | Pokreće ESLint |
| `node scripts/populate-blog-exif.mjs` | Popunjava blogExif.json EXIF podacima iz postojećih blog galerijskih slika |
| `npm run blog:import` | Import 1 posta iz WordPress SQL dumpa (provjera) |
| `npm run blog:import:all` | Import svih postova iz WordPressa (stari blog) |
| `npm run blog:cleanup-categories` | Uklanja kategorije iz postova koje više ne postoje |
| `curl localhost:3000/api/health` | Health check (dev) – provjerava JSON datoteke i kritične resurse; u buildu prerenderira se u `out/api/health` |

## 📁 Struktura projekta

```
DrusanyPortfolio/
├── public/
│   ├── favicon.ico       # Favicon (metadata.icons u layout.tsx)
│   └── uploads/          # Slike (full 2048px + thumbs 600px, WebP)
├── src/
│   ├── app/              # Stranice i API rute
│   │   ├── admin/        # Admin panel (dev only): layout, page, blog/ (lista, edit/[id], new)
│   │   ├── api/          # upload, update, delete, reorder, hero, gallery, gallery/generate-slugs, media, media-delete, media-detach, content-health, health, pages, blog, blog-upload, blog-delete-file, theme
│   │   ├── about/        # About stranica
│   │   ├── contact/      # Contact stranica
│   │   ├── blog/         # Blog lista + [slug] pojedinačni post
│   │   ├── sitemap.ts    # Generira sitemap.xml pri buildu
│   │   └── robots.ts     # Generira robots.txt pri buildu
│   ├── components/       # Gallery, Header, AdminClient, AdminMedia, BlockNoteEditor, blocknote/ (BlogFilePanel, FilePanelScrollLock, MediaLibraryTab), BlockTopFormattingToolbarController, FloatingBlockTypeBar, AdminPages, AdminBlog, BlogGallery, BlogList…
│   ├── contexts/        # UnsavedChangesContext (admin)
│   ├── data/
│   │   ├── adminUI.ts       # Centralizirani UI stringovi za admin
│   │   ├── gallery.json    # Metapodaci o slikama
│   │   ├── pages.json       # About (title, html, quote), Contact (title, html, email, formspreeEndpoint)
│   │   ├── gear.json        # Fotografska oprema (About)
│   │   ├── press.json       # Objavljene fotografije (About)
│   │   ├── blog.json        # Blog postovi (slug yymmdd-naslov, title, date, categories, thumbnail, gallery)
│   │   ├── blogExif.json    # EXIF za blog galerijske slike (populate-blog-exif.mjs)
│   │   ├── blogWidgets.json # Konfiguracija blog sidebara (search, categories, featured-posts, plans, maps)
│   │   ├── plans.json       # Planirani snimanja za PlansWidget (date, name)
│   │   ├── theme.json       # Theme konfiguracija (font, fontSize, color po elementu)
│   │   └── themeFonts.ts   # Konfiguracija fontova za Theme (dodavanje novih fontova)
│   └── lib/              # getGallery, pages, gear, press, plans, blog, blogWidgets, theme, slug, exif, sanitize, utils, fileUtils, imageValidation, jsonLock, blogCleanup, rateLimit; blocknoteImageSchema, blocknoteYouTubeSchema
├── .env.example          # NEXT_PUBLIC_SITE_URL, RATE_LIMIT_* (opcionalno)
├── scripts/
│   ├── deploy-static.sh            # Deploy: build, kopira u drusany-static, push, rsync over SSH (samo promijenjene datoteke)
│   ├── deploy-uploads.sh           # Deploy uploads: rsync/FTP samo public/uploads/ (samo promijenjene datoteke)
│   ├── dev-and-open.sh             # Otvara Terminal s npm run dev i Chrome s localhost:3000 + /admin
│   ├── populate-blog-exif.mjs      # Popunjava blogExif.json iz postojećih slika
│   ├── import-wordpress-blog.mjs   # Import starih postova iz WordPress SQL dumpa (blog:import, blog:import:all)
│   └── cleanup-blog-categories.mjs # Čišćenje kategorija (blog:cleanup-categories)
├── patches/              # patch-package – patchevi za npm pakete (npr. @blocknote/core za side menu)
└── out/                  # Statični output (generira se pri build)
```

## 🖼 Admin panel

Admin je dostupan **samo kada pokreneš `npm run dev`** – u produkcijskom buildu se ne uključuje.

**Funkcionalnosti:**
- **Dashboard:** Kartice (Portfolio, Blog, Portfolio Categories, Blog Categories, Static pages, Blog posts); bar charti "Images by category in portfolio" i "Images by category in blog"; **Content health** – metrike s ikonama (Camera, Tag, ImageOff, Search); slike bez EXIF-a, slike bez slug-a, blog postovi bez featured slike (klik otvara galeriju s filterom ili Blog)
- **Sigurnost:** Rate limiting (200 req/min po IP – bulk upload), path traversal zaštita, ograničenje uploada 20 MB, magic bytes provjera, HTML sanitizacija (iframe samo youtube.com/embed); file locking za JSON; pri promjeni blog slug-a/datuma automatsko preimenovanje foldera i ažuriranje putanja (blog.json, blogExif, HTML sadržaj)
- **Galerija:** Sidebar accordion; odabir kategorije → upload slika; EXIF preview (datum fallback); **custom DateTimePicker** (datum + vrijeme); uređivanje opisa (title, venue, sport, slug, keywords…); slug **as you type**; drag-and-drop sortiranje; hero odabir; brisanje; **Content health** – gumb "Generiraj slugove" kad je filter no-slug; **toast** poruke
- **Pages:** About – citat na slici, naslov, BlockNote sadržaj; Contact – Formspree endpoint, email (fallback), naslov, uvodni tekst (BlockNote)
- **Blog:** Kreiranje i uređivanje blog postova – **status** (draft / published, custom StatusSelect); title, slug (format `yymmdd-naslov`), **custom DatePicker** za datum – **promjena datuma automatski ažurira slug**; **Category** (višestruki odabir, abecedno), thumbnail, sadržaj (BlockNote s **uploadom slika** – `/image` → Upload/**Media**/Embed, resize ručice; **Block style** i Formatting toolbar **na vrhu bloka**; okvir blokova; debounced body updates za fluidniji editor), galerija (drag-and-drop, bulk delete); **filter bar** u listi – **Search** (pretraga po naslovu, slug-u, kategorijama; URL `?q=...`; debounce 300ms), Status, Category (višestruki odabir), Mjesec, Sort; lista skrivena kad je forma otvorena; **formOnly** (`/admin/blog/edit/[id]`, `/admin/blog/new`) učitava samo jedan post – brže; **promjena datuma/slug-a** – automatsko preimenovanje foldera, ažuriranje putanja u blog.json, blogExif, HTML sadržaju; **zaštita od gubitka slika** – blocksToFullHTML (lossless), backup prije save (`[slug].html.backup`), validacija prije save (409 ako bi nestale slike, confirm dialog); **SEO** – meta description placeholder (Fotografije + event + lokacija + godina + što se vidi); brisanje slika iz galerije briše i fizičke datoteke s diska
- **Media:** Agregirani prikaz svih slika (portfolio, blog, stranice) – filter po tipu, search as you type, paginacija (25/stranica, Go to page), lightbox u punoj rezoluciji; akcije: Download, Copy URL, Detach (odvajanje od stranice – datoteka ostaje), Delete; **multiple selection** – bulk Delete, Download, Copy URLs, Detach; Media link dostupan i na `/admin/blog` ruti
- **Theme:** Prilagodba tipografije – **grupne kontrole** (Blog Headings – headingH1–6, blogPostTitle, blogListCardTitle, widgetTitle; Blog Body – body, quote, code, caption); **accordion** sekcije zatvorene po defaultu; elementi: Hero naslov, Naslov na tamnoj pozadini, blog naslovi i metadata, Body, Citat, Code, Navigacija, Caption; custom dropdown; live preview; za statički export: uređivanje u dev modu, zatim `npm run build`; novi fontovi u `themeFonts.ts` i `layout.tsx`

**Contact forma:** Za slanje poruka koristi se [Formspree](https://formspree.io) – kreiraj besplatni form u adminu unesi endpoint. Ako nije postavljen, koristi se mailto.

## 🌐 Deployment

Projekt se builda u čisto statični output (`out/`). Može se deployati na:

- **Vercel** – `npm run build`, output directory: `out`
- **Netlify** – build command: `npm run build`, publish directory: `out`
- **GitHub Pages** – GitHub Action koji pokreće build i pusha `out/` u `gh-pages`
- **Vlastiti server** – upload sadržaja iz `out/` na web server

### Legacy shared hosting (Apache + FTP/cPanel)

- `next.config.ts` koristi `output: "export"` → cijeli site je čisti statični HTML u `out/`.
- Na klasičnom Apache hostingu (`public_html`) koristi se `.htaccess` u rootu (dolazi iz `public/.htaccess`):

```apache
DirectoryIndex index.html

<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /

# Izričita pravila: ruta bez .html -> odgovarajući .html (radi refresha)
# Samo glavne stranice; blog postovi (/blog/slug) koriste eksplicitne .html linkove u kodu
RewriteRule ^about/?$ about.html [L]
RewriteRule ^blog/?$ blog.html [L]
RewriteRule ^contact/?$ contact.html [L]
RewriteRule ^admin/?$ admin.html [L]
</IfModule>
```

- Pojedinačni blog postovi se na takvom hostingu otvaraju preko URL‑ova s ekstenzijom, npr.
  - lista: `/blog`
  - post: `/blog/260110-sport-metadata-generator.html`
  - ovo izbjegava ovisnost o naprednijim rewrite pravilima i osigurava da **refresh radi ispravno** i na ograničenim konfiguracijama.

#### Deploy na shared hostingu (rsync over SSH)

- **Workflow:** Uređuješ u adminu → Save → `./scripts/deploy-static.sh` → gotovo.
- Skripta `scripts/deploy-static.sh`: build, kopira u `drusany-static`, push na GitHub, **rsync** na server (samo promijenjene datoteke).
- **Postavka (jednokratno):** U cPanelu omogući SSH (Security → SSH Access), zapiši port. U `.env` dodaj:
  ```
  SSH_HOST=drusany.com
  SSH_USER=drusanyc
  SSH_PATH=/home/drusanyc/public_html
  SSH_PORT=21098
  ```
- Alternativa: FTP deploy (`FTP_HOST`, `FTP_USER`, `FTP_PASS`) ili cPanel Deploy HEAD Commit.
- **Uploads (slike):** `./scripts/deploy-uploads.sh` ili `npm run deploy:uploads` – rsync/FTP samo `public/uploads/`, šalje samo promijenjene datoteke (istovjetno deploy-static.sh, ali samo za uploads).

## 📖 Dokumentacija

Detaljna arhitektura, API rute, design sustav i konvencije su opisani u **[architecture.md](./architecture.md)**.

**Konfiguracija:** Kopiraj `.env.example` u `.env` i postavi `NEXT_PUBLIC_SITE_URL` (za Open Graph, canonical linkove, sitemap, robots.txt). Canonical URL = `NEXT_PUBLIC_SITE_URL` + path (npr. `https://drusany.com/blog/251228-advent-2025`). Opcionalno: `RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_WINDOW_MS` za rate limiting.

**Favicon:** `public/favicon.ico` – zamijeni datoteku i povećaj verziju u `layout.tsx` (`icons: { icon: "/favicon.ico?v=3" }`) za cache busting.

## 📄 Licenca

Privatni projekt – sva prava zadržana.
