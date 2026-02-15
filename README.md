# Drusany Portfolio

Statični fotografski portfolio izgrađen na Next.js – galerija s masonry layoutom, kategorijama, lightboxom i lokalnim admin panelom za upravljanje sadržajem.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)

## ✨ Značajke

- **Galerija** – Balanced masonry layout (stupci približno jednake visine), filtriranje po kategorijama (Concerts, Sport, Animals, Interiors, Zagreb, Food & Drink)
- **Lightbox** – Puni prikaz slike, EXIF podaci (camera, lens, aperture…), navigacija strelicama ili swipeom
- **Hero slider** – Početna stranica s 6 slideova po kategorijama, auto-play
- **Pretraga** – Filter as you type (naslov, venue, sport, keywords)
- **Direktni linkovi** – URL slug po slici (npr. `/?category=concerts&image=depeche-mode-arena-zagreb-2013`)
- **Admin panel** – Samo u development modu: upload, uređivanje metapodataka, EXIF preview, drag-and-drop sortiranje, hero odabir

## 🛠 Tech stack

| Tehnologija | Namjena |
|-------------|---------|
| Next.js 16 | App Router, statični export |
| Tailwind CSS 4 | Styling |
| Framer Motion | Animacije |
| Sharp | Image processing (WebP, resize) |
| exifr | EXIF metadata (datum, naslov, camera, lens…) |

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
- **Admin panel** – [http://localhost:3000/admin](http://localhost:3000/admin) – dostupan **samo u dev modu**

## 📜 Dostupne naredbe

| Naredba | Opis |
|---------|------|
| `npm run dev` | Pokreće development server na portu 3000 |
| `npm run build` | Generira statični output u folder `out/` |
| `npm run preview` | Servira `out/` folder lokalno (za testiranje produkcijskog builda) |
| `npm run lint` | Pokreće ESLint |

## 📁 Struktura projekta

```
DrusanyPortfolio/
├── public/uploads/       # Slike (full 2048px + thumbs 600px, WebP)
├── src/
│   ├── app/              # Stranice i API rute
│   │   ├── admin/        # Admin panel (dev only)
│   │   └── api/          # Upload, update, delete, reorder, hero, gallery
│   ├── components/       # Gallery, Header, AdminClient, CategorySelect…
│   ├── data/
│   │   └── gallery.json  # Metapodaci o slikama
│   └── lib/              # getGallery, slug utils
└── out/                  # Statični output (generira se pri build)
```

## 🖼 Admin panel

Admin je dostupan **samo kada pokreneš `npm run dev`** – u produkcijskom buildu se ne uključuje.

**Funkcionalnosti:**
- Odabir kategorije → upload slika u tu kategoriju
- EXIF preview – automatsko popunjavanje naslova i datuma pri odabiru datoteke
- Uređivanje opisa (title, venue, sport, slug, keywords, camera, lens…)
- Slug se automatski generira iz naslova/venue/datuma – vidiš ga **as you type**
- Drag-and-drop za promjenu redoslijeda slika
- Hero odabir – koja slika se prikazuje na početnoj za svaku kategoriju
- Brisanje slika

## 🌐 Deployment

Projekt se builda u čisto statični output (`out/`). Može se deployati na:

- **Vercel** – `npm run build`, output directory: `out`
- **Netlify** – build command: `npm run build`, publish directory: `out`
- **GitHub Pages** – GitHub Action koji pokreće build i pusha `out/` u `gh-pages`
- **Vlastiti server** – upload sadržaja iz `out/` na web server

## 📖 Dokumentacija

Detaljna arhitektura, API rute, design sustav i konvencije su opisani u **[architecture.md](./architecture.md)**.

## 📄 Licenca

Privatni projekt – sva prava zadržana.
