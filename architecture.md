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

### 3.2 Original Images: `public/uploads/`

- Slike se spremaju u podfoldere po kategoriji: `public/uploads/full/[category]/` i `public/uploads/thumbs/[category]/`
- Format: WebP (Sharp resize)
- Naziv datoteke: sanitizirani originalni naziv (lowercase, razmaci→crte, bez specijalnih znakova); ako postoji kolizija, dodaje se kratki random suffix ili broj
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
- **Category-first flow:** Korisnik prvo odabere kategoriju; bez odabira upload je onemogućen
- **Galerija filtrirana po kategoriji:** Prikazuje se samo galerija odabrane kategorije (ne opća galerija sa svim slikama)
- Upload novih slika (file input) – slike idu u odabranu kategoriju
- **EXIF preview:** Pri odabiru datoteke poziv na `/api/exif-preview` – automatsko popunjavanje naslova i datuma snimanja iz EXIF-a
- Forma za metapodatke: title, capture date, venue (samo za Concerts), sport (samo za Sport), keywords (iz EXIF-a), hero checkbox (kategorija se uzima iz odabira gore; alt = title automatski)
- **CategorySelect:** Custom izbornik s ikonama (Concerts, Sport, Animals, Interiors, Zagreb, Food & Drink) + opcija "Other (custom)"
- **Edit modal:** Uređivanje opisa postojećih slika (title, category, date, alt, venue, sport, slug, keywords, camera, lens, exposure, aperture, ISO); datum/vrijeme u 24h formatu; **slug as you type** – polje za slug se automatski ažurira dok pišeš title, mijenjaš venue ili datum (koristi `generateSlug` iz `@/lib/slug`)
- **VenueSelect:** Dropdown za venue (samo za Concerts) – Arena Zagreb, Cibona, Dom sportova, KD Vatroslav Lisinski, KSET, Misc, Šalata, Tvornica kulture
- **SportSelect:** Dropdown za vrstu sporta (samo za Sport) – Athletics, Auto-Moto, Basketball, Fencing, Football, Handball, Martial Arts (poredan abecedno)
- **Hero toggle:** Postavljanje/uklanjanje hero slike po kategoriji (samo ručno); hero slika u galeriji istaknuta amber obrubom
- **Delete:** Brisanje slike (uklanja iz JSON-a i diska)
- **Drag-and-drop sortiranje:** Fotografije u galeriji mogu se povući za promjenu redoslijeda; novi redoslijed se sprema putem `/api/reorder`

**Zaštita:** Komponenta provjerava `process.env.NODE_ENV` i prikazuje poruku ako je production.

### 4.3 API Routes (dev only)

Svi API endpointi provjeravaju `process.env.NODE_ENV !== 'production'` i vraćaju 403 u produkciji.

#### `/api/upload` (POST)

**Lokacija:** `src/app/api/upload/route.ts`

**Tijek:**
1. Prima `FormData` (file, title, category, alt, capturedAt, isHero, venue, sport, keywords, slug)
2. Kreira podfoldere `full/[category]/` i `thumbs/[category]/` (category se sanitizira)
3. Naziv datoteke: originalni naziv sanitiziran (lowercase, razmaci→crte); ako postoji kolizija, dodaje se suffix
4. Sharp: resize na 2048px (full) i 600px (thumb), WebP
5. **exifr:** Čita EXIF (makerNote: true, xmp: true, iptc: true) – datum, naslov, keywords (IPTC/XMP), camera, lens, exposure, aperture, ISO
6. Ako forma šalje `capturedAt`, koristi ga; inače EXIF datum
7. **Slug:** Generira iz title+venue+year putem `generateSlug` (iz `@/lib/slug`); provjera jedinstvenosti unutar kategorije; pri overwrite zadržava postojeći
8. Generira UUID, sprema u `gallery.json` s putanjama `/uploads/full/[category]/filename.webp`
9. Vraća `{ success, id, src, thumb, image }`

#### `/api/exif-preview` (POST)

**Lokacija:** `src/app/api/exif-preview/route.ts`

- Prima `FormData` s datotekom
- **exifr:** Parsira cijeli EXIF (makerNote: true, xmp: true, iptc: true) – datum, naslov, keywords (dc:subject, Keywords, IPTC), camera, lens, exposure, aperture, ISO
- Vraća `{ date, description, keywords, camera, lens, exposure, aperture, iso }` za auto-fill u admin formi

#### `/api/update` (POST)

**Lokacija:** `src/app/api/update/route.ts`

- Prima `{ id, title?, alt?, category?, capturedAt?, venue?, sport?, keywords?, slug?, camera?, lens?, exposure?, aperture?, iso? }`
- Ažurira zapis u `gallery.json` po ID-u
- **Auto-slug:** Kad se mijenjaju `title`, `venue` ili `capturedAt`, slug se automatski regenerira iz novih vrijednosti (koristi `generateSlug` iz `@/lib/slug`); provjera jedinstvenosti unutar kategorije (suffix `-2`, `-3` ako postoji kolizija); ako se mijenja samo slug (bez title/venue/datuma), ostaje ručno postavljeni slug

#### `/api/delete` (POST)

**Lokacija:** `src/app/api/delete/route.ts`

- Prima `{ id }`
- Briše sliku iz `gallery.json` i fajlove iz `public/uploads/` (koristi punu putanju iz `src`/`thumb` – radi za staru i novu strukturu foldera)

#### `/api/reorder` (POST)

**Lokacija:** `src/app/api/reorder/route.ts`

- Prima `{ category, order: string[] }` – array ID-eva slika u željenom redoslijedu
- Ažurira polje `order` za svaku sliku u kategoriji (0, 1, 2, …)
- Koristi se nakon drag-and-drop u admin galeriji

#### `/api/hero` (POST)

**Lokacija:** `src/app/api/hero/route.ts`

- Prima `{ id, isHero }`
- Postavlja/uklanja `isHero` za sliku u kategoriji (samo jedna hero po kategoriji)

#### `/api/gallery` (GET)

**Lokacija:** `src/app/api/gallery/route.ts`

- Vraća `{ images }` iz `gallery.json` (koristi `getGallery` za sortiranje po `order` pa `capturedAt`); `getGallery` generira slug za slike bez njega (title+venue+year, jedinstvenost)

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
- **Tipografija:** Veliki fontovi (clamp za responsivnost), serif za naslove, sans za body
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

### 6.4 Animations (Framer Motion)

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
- API routes aktivne: `/api/upload`, `/api/exif-preview`, `/api/update`, `/api/delete`, `/api/hero`, `/api/gallery`
- Hot reload za brze promjene

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
│   │   │   ├── delete/route.ts
│   │   │   ├── exif-preview/route.ts
│   │   │   ├── gallery/route.ts
│   │   │   ├── hero/route.ts
│   │   │   ├── reorder/route.ts
│   │   │   ├── update/route.ts
│   │   │   └── upload/route.ts
│   │   ├── about/page.tsx
│   │   ├── blog/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── layout.tsx       # CustomCursor u body
│   │   ├── page.tsx       # Home (HeroSlider ili Gallery)
│   │   └── globals.css
│   ├── components/
│   │   ├── AdminClient.tsx    # Admin UI (upload, edit, hero, delete)
│   │   ├── CategorySelect.tsx # Custom category dropdown
│   │   ├── VenueSelect.tsx    # Venue dropdown (Concerts)
│   │   ├── SportSelect.tsx    # Sport type dropdown (Sport)
│   │   ├── CustomCursor.tsx   # Custom cursor (dot + aperture, desktop only)
│   │   ├── Gallery.tsx        # Balanced masonry (shortest column) + lightbox; useColumnCount, imageColumns
│   │   ├── Header.tsx        # Logo (inline SVG), Nav + Portfolio dropdown, aktivna stranica
│   │   ├── HeroSlider.tsx    # 6 category slides, auto-play 4s, wheel/swipe/strelicama lijevo-desno
│   │   └── HomeContent.tsx   # Conditional Hero/Gallery; overflow hidden na hero
│   ├── lib/
│   │   ├── getGallery.ts   # Čitanje gallery.json, sortiranje po order (pa capturedAt desc), generiranje slug
│   │   └── slug.ts         # slugify, generateSlug (title+venue+year) – zajednički za upload, update i AdminClient
│   └── data/
│       └── gallery.json    # Flat-file baza
├── out/                   # Generirano pri build (gitignore)
├── next.config.ts
├── package.json
└── architecture.md
```

---

## 8.1 Home Page & Navigation

### Home (`/`)

- **Bez `?category`:** HeroSlider – 6 slideova (Concerts, Sport, Animals, Interiors, Zagreb, Food & Drink), 100vh, wheel/swipe/strelicama lijevo-desno, **auto-play svake 4 sekunde**, Framer Motion; `overflow: hidden` na html/body da wheel mijenja slideove
- **Stranica galerije:** `min-h-screen` na bijelom divu – nema crnog prostora kad ima malo slika
- **S `?category=concerts`:** Masonry galerija filtrirana po kategoriji; venue filter (samo dvorane s barem jednom slikom); **Search** (expandable na hover, filter as you type)
- **S `?category=sport`:** Isto s sport filterom (Football, Basketball, Handball, itd. – samo vrste s barem jednom slikom)
- **Filtriranje:** Client-side preko `gallery.json` – `images.filter(img => category === img.category)`; za Concerts i `?venue=slug`; za Sport i `?sport=slug`
- Hero slika: **samo ručno odabrana** (`isHero: true`) – nema fallback na prvu/najnoviju sliku; ako nema hero, prikazuje se placeholder s nazivom kategorije

### Gallery & Lightbox

- **Masonry grid:** Balanced left-to-right – slike u stupac s najmanjom visinom (shortest column); aspect ratio iz `width`/`height` u gallery.json; stupci približno jednake visine, minimalne praznine; `useColumnCount` za responsivne stupce (1–4); slike s thumb putanjama, klik otvara lightbox
- **Venue filter (Concerts):** Samo dvorane s barem jednom slikom; label "Venue:"; linkovi s podcrtom, `text-xs`
- **Sport filter (Sport):** Samo vrste sporta s barem jednom slikom; label "Sport:"; isti stil kao venue
- **Search:** Ikona povećala (32px), expandable na hover; filter as you type (title, alt, keywords, venue, sport, category); kad pretraga nema rezultata – prazan grid (bez poruke "No images")
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

### Custom Cursor (desktop only)

- **CustomCursor.tsx** u layoutu; aktivno samo kad `(hover: hover)` (touch uređaji isključeni)
- **Dot:** Bijela točka (10px), `mix-blend-mode: difference`; vidljiva uvijek; **trenutno praćenje** (bez kašnjenja, direktni state)
- **Aperture ikona:** Prikazuje se samo preko fotografija (`data-cursor-aperture` na galeriji, hero slideru, lightboxu); scale 1.5 na hover nad klikabilnim elementima; **spring animacija** (stiffness 400) – glatko prati miš
- **globals.css:** `body.custom-cursor-active * { cursor: none }`

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
- Ako se ikad doda server-side admin u produkciji, obavezno: autentikacija, rate limiting, validacija file tipova
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
| **Admin** | `/admin` + 6 API routes (dev only) |
| **Admin features** | Category-first flow, galerija filtrirana po kategoriji, Upload, EXIF preview, CategorySelect, VenueSelect, SportSelect, Edit modal (**slug as you type** – title/venue/datum → auto-slug u realnom vremenu), Hero toggle, Delete, **drag-and-drop sortiranje** (redoslijed se sprema) |
| **Home** | HeroSlider (6 slides, auto-play 4s, strelice lijevo-desno, "View Gallery", title @ venue) ili masonry Gallery po `?category`; hero samo ručno odabrana |
| **Header** | Logo (inline SVG), poravnanje lijevo, aktivna stranica (border-b/border-l) |
| **Custom Cursor** | Dot (trenutno) + aperture (spring, samo preko fotografija), mix-blend-difference, desktop only |
| **Gallery** | Balanced masonry (shortest column, heights array, aspect ratio); stupci približno jednake visine; useColumnCount (1–4 stupaca), Search (expandable), venue filter (Concerts), sport filter (Sport), ImageCard hover (title @ venue ili Sport // title, datum); Interiors, Animals bez opisa/datuma |
| **Lightbox** | Fit-to-screen, numeracija + X na vrhu, caption + EXIF u jednom okviru (crna prozirna pozadina), EXIF toggle (ikona kamere), copyright popup na desni klik, URL sync `?image=slug` |
| **Filtriranje** | Client-side preko JSON-a (`?category=slug`, `?venue=slug` za Concerts, `?sport=slug` za Sport); search filter as you type (title, alt, keywords, venue, sport, category); direktni linkovi `?image=slug` |
| **Export** | `output: 'export'`, `images.unoptimized: true` |
| **Output** | `out/` folder |
| **Design** | Minimalist, velika tipografija, masonry/full-bleed, fade-in |
| **Jezik** | Engleski (UI, metadata, datumi) |
