# Tehnički paterni – step by step

Ovaj dokument opisuje kako implementirati uobičajene funkcionalnosti u projektu. **Prvo pročitaj ovaj dokument** prije implementacije – prati postojeće komponente.

---

## Kako započeti novi zadatak

Na početku svakog zadatka koristi ovaj checklist:

1. **Pročitaj** `technical-patterns.md` – posebno odjeljak vezan uz zadatak (slike, BlockNote, chart, itd.)
2. **Pronađi** referentnu komponentu u tablici (sekcija 3) – koristi je kao model
3. **Ne koristi** `useEffect` + DOM manipulaciju za slike – struktura mora biti u renderu od početka
4. **Ne mijenjaj** više od traženog – ako korisnik traži promjenu boje, ne diraj okvir bloka niti dropdown pozadinu
5. **Provjeri** sanitizer whitelist kad dodaješ nove atribute na slike (npr. `data-display-width`)
6. **Koristi centralizirane funkcije** – za upload/sanitizaciju koristi `utils.ts` (sanitizeFilename, sanitizeFolderName) i `fileUtils.ts` (fileExists); za slug koristi `slug.ts`

**Kratka fraza za početak zadatka (možeš kopirati):**
> „Prije implementacije pročitaj `docs/technical-patterns.md` i `docs/architecture.md`. Prati postojeće komponente – ne izmišljaj nove pristupe.“

---

## 1. Slike s lightboxom i aperture cursorom

Kada dodaješ slike koje trebaju lightbox i aperture cursor (ikonu objektiva na hover), **prati pattern iz BlogGallery i Gallery**. Struktura mora biti u renderu od početka – ne dodavati naknadno u `useEffect`.

### 1.1 React komponente (BlogGallery, Gallery)

**Korak 1:** Wrapper je `<button>` s atributima:

```tsx
<button
  type="button"
  data-cursor-hover
  data-cursor-aperture
  onClick={() => openLightbox(index)}
  className="group relative block w-full overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-white"
>
  <img src={...} alt={...} className="..." />
</button>
```

**Korak 2:** `data-cursor-hover` i `data-cursor-aperture` – CustomCursor ih traži; aperture ikona se prikazuje samo preko elemenata s tim atributima.

**Korak 3:** Lightbox – state za `lightboxIndex`, Framer Motion AnimatePresence, prev/next strelice, Escape za zatvaranje.

### 1.2 HTML iz stringa (ProseContent)

Kad slike dolaze iz HTML stringa (`dangerouslySetInnerHTML`), **ne koristi useEffect** za wrapanje. React će pri re-renderu ponovno postaviti `innerHTML` i obrisati tvoje wrappere.

**Korak 1:** Obradi HTML **prije** renderiranja – u `useMemo`:

```ts
const { processedHtml, imageUrls } = useMemo(
  () => processProseHtml(html),
  [html]
);
```

**Korak 2:** U `processProseHtml`:
- Parsiraj HTML s **linkedom** (i na serveru i na klijentu – isti parser = nema hydration mismatch)
- Za svaku sliku: stvori `<button>` wrapper, dodaj `data-cursor-hover`, `data-cursor-aperture`, `data-index`
- Dodaj `data-cursor-aperture` i na samu `<img>` (da `target.closest()` uvijek pronađe element)
- Vrati `doc.body.innerHTML` kao processed HTML

**Korak 3:** Renderiraj obrađeni HTML:

```tsx
<div
  dangerouslySetInnerHTML={{ __html: processedHtml }}
  onClick={handleContainerClick}
/>
```

**Korak 4:** Event delegation za klik – `handleContainerClick` provjerava `e.target.closest(".prose-img-wrapper[data-index]")` i otvara lightbox po `data-index`.

**Korak 5:** Koristi `linkedom` uvijek – radi i na serveru i u browseru, a isti parser osigurava identičan output i izbjegava hydration mismatch.

**Korak 6:** Širina slike – ProseContent čita `data-display-width` (full|50|25) ili `data-preview-width`/`width` za ručni resize. Wrapper dobiva odgovarajuće CSS (50%, 25% ili max-width u px). Blog editor koristi custom schema (`blogBlockNoteSchema`) s Image blockom koji ima `displayWidth` prop – ImageSizeSelect floating toolbar omogućuje odabir Full/50%/25%.

---

## 2. Admin Dashboard – stacked bar chart za blog kategorije

Graf "Images by category in blog" prikazuje glavne kategorije na X-osi, podkategorije (npr. Atletika, Nogomet) kao segmenti unutar stupca.

**Korak 1:** Koristi `getBlogCategoryStackedChartData(posts, getImageCount)` iz `blogCategories.ts` – vraća `{ data, segmentKeys, segmentLabels }`.

**Korak 2:** Recharts BarChart s više `<Bar>` komponenti – svaka ima `stackId="blog"`, `dataKey` = segment slug.

**Korak 3:** Tooltip formatter koristi `segmentLabels` za čitljive nazive. Recharts formatter prima `value` i `name` kao `number | undefined` i `string | undefined` – ne tipizirati eksplicitno; koristiti `value ?? 0` i `name ?? ""` u returnu.

---

## 3. Referentne komponente

| Funkcionalnost | Komponenta | Lokacija |
|----------------|------------|----------|
| Slike + lightbox + aperture (React) | BlogGallery | `src/components/BlogGallery.tsx` |
| Slike + lightbox + aperture (React) | Gallery | `src/components/Gallery.tsx` |
| Slike + lightbox + aperture (HTML string) | ProseContent | `src/components/ProseContent.tsx` |
| Custom cursor | CustomCursor | `src/components/CustomCursor.tsx` |
| Stacked chart (blog kategorije) | AdminDashboard | `src/components/AdminDashboard.tsx` |
| Chart podaci | getBlogCategoryStackedChartData | `src/data/blogCategories.ts` |
| Sanitizer (whitelist atributa) | sanitizeProseHtml | `src/lib/sanitize.ts` |
| Centralizirane util funkcije | transliterateCroatian, sanitizeFilename, sanitizeFolderName | `src/lib/utils.ts` |
| Provjera postojanja datoteke | fileExists | `src/lib/fileUtils.ts` (samo server) |
| Blog sidebar widgeti (stilovi) | BLOG_WIDGET_UI | `src/data/blogWidgetUI.ts` |
| Blog widget komponente | SearchWidget, CategoriesWidget, FeaturedPostsWidget, GoogleMapsWidget | `src/components/blog/` |
| Block type select popup (dodavanje blokova) | BlockTypeSelectWithCursor | `src/components/BlockTypeSelectWithCursor.tsx` |
| Link toolbar (FormattingToolbar) | CustomCreateLinkButton | `src/components/CustomCreateLinkButton.tsx` |
| Custom Image block (displayWidth) | blocknoteImageSchema | `src/lib/blocknoteImageSchema.tsx` |
| Theme grupe, accordion, elementi | ThemeAdmin | `src/components/ThemeAdmin.tsx` |

---

## 4. Blog sidebar widgeti

Dizajn: **jedinstveni panel** – bijela pozadina (`bg-white`), tamna slova (`text-zinc-900`), svi widgeti u jednom `rounded-2xl` bloku, odvojeni `border-t border-zinc-200`.

**Korak 1:** Koristi `BLOG_WIDGET_UI` iz `src/data/blogWidgetUI.ts` – svi stilovi su centralizirani kao u `ADMIN_UI`.

**Korak 2:** Widget komponente ne koriste vlastite kartice – renderiraju samo sadržaj; `BlogSidebar` ih wrappa u sekcije unutar panela.

**Korak 3:** Referentne komponente: BlogSidebar, SearchWidget, CategoriesWidget, FeaturedPostsWidget, GoogleMapsWidget.

---

## 5. BlockNote / TipTap

Kad radiš s linkovima u BlockNote editoru:

- **Link se otvara pri kliku** – korisnik ne može uređivati tekst unutar linka. Rješenje: `TiptapLink.configure({ openOnClick: false })` u `_tiptapOptions` (BlockNote schema).
- **editLoading** – pri otvaranju uređivanja prikaži loader dok se body ne učitava; sprječava popover crash (`reference.element` undefined, `isConnected`).
- **FormattingToolbar.Button** – zahtijeva obavezan `label` prop (BlockNote 0.46+).
- **CustomCreateLinkButton** – `checkLinkInSchema` vraća `boolean` (ne type predicate – custom shema nije kompatibilna s default tipovima); za `anchor?.target === "_blank"` koristiti `anchor ? anchor.target === "_blank" : true` (ne `?? true` – boolean nije nullish).
- **blocknoteImageSchema** – `createImageBlockConfig({})` zahtijeva objekat (ne prazan poziv); `displayWidth` u `parseImageWithDisplayWidth` mora biti literal tip `"full" | "50" | "25"` (type assertion ako dolazi iz `getAttribute`).

### 5.1 Dodavanje blokova u popup za stil bloka (Block Type Select)

BlockNote `blockTypeSelectItems` ne uključuje sve blokove (npr. codeBlock). Popup koji se pojavljuje kad klikneš na tekst koristi `BlockTypeSelectWithCursor` i proširenu listu u `blockTypeSelectItemsWithCodeBlock`.

**Kako brzo dodati novi blok:**

1. U `src/components/BlockTypeSelectWithCursor.tsx` – u funkciji `blockTypeSelectItemsWithCodeBlock` dodaj novu stavku u niz:

```ts
const newBlockItem: BlockTypeSelectItem = {
  name: dict?.slash_menu?.ime_bloka?.title ?? "Fallback naslov",
  type: "imeTipaBloka",  // npr. "table", "image", "divider"
  props: { /* potrebni props ako ima */ },
  icon: RiNekaIkona,
};
```

2. **Pozicija** – umetni gdje želiš (npr. nakon quote: `insertAt = quoteIdx + 1`) ili pushaj na kraj: `[...base, newBlockItem]`.

3. **Dictionary** – BlockNote ima prijevode u `slash_menu` (vidi `@blocknote/core` locales); ako postoji, koristi `dict.slash_menu.ime_bloka.title`.

4. **Ikona** – iz `react-icons/ri` (npr. `RiCodeBlock`, `RiTable`, `RiImage2Fill`, `RiSeparator`).

5. **Schema** – blok mora postojati u shemi editora (`defaultBlockSpecs` ili custom schema); inače ga `editorHasBlockWithType` filtrira i neće se prikazati.

**Referentna komponenta:** `BlockTypeSelectWithCursor.tsx` – primjer: codeBlock stavka.

---

## 6. Theme

### 6.1 Dodavanje novog fonta

Kad želiš dodati novi font u Theme izbornik (Admin → Theme):

**Korak 1:** U `src/app/layout.tsx` – import iz `next/font/google` i registracija CSS varijable:

```tsx
import { Lora } from "next/font/google";

const lora = Lora({ variable: "--font-lora", subsets: ["latin"] });

// U body className dodaj: ${lora.variable}
```

**Korak 2:** U `src/data/themeFonts.ts` – dodaj novi zapis u `THEME_FONTS`:

```ts
{
  id: "lora",
  label: "Lora",
  cssVar: "var(--font-lora), serif",
  previewFamily: "var(--font-lora), serif",
},
```

**Korak 3:** `theme.json` – postojeći elementi mogu ostati; novi font će biti dostupan u dropdownu.

**Referentne datoteke:** `src/data/themeFonts.ts`, `src/app/layout.tsx`

### 6.2 Grupne kontrole i accordion

- **ThemeAdmin** ima grupne kontrole – Blog Headings (headingH1–6, blogPostTitle, blogListCardTitle, widgetTitle) i Blog Body (body, quote, code, caption). Promjena grupe mijenja sve povezane elemente odjednom.
- **Accordion** – sve sekcije (Blog Headings, Blog Body, Hero & Navigation, Headings individual, Body & Text, Other) su u accordionu, zatvorene po defaultu.
- **widgetTitle** – koristi `!important` u globals.css jer button/h3 mogu imati reset stilova; klasa `.theme-widget-title`.

### 6.3 Theme elementi (blog)

| Element | CSS klasa | Komponenta |
|---------|-----------|------------|
| blogPostTitle | `.theme-blog-post-title` | `blog/[slug]/page.tsx` |
| blogListCardTitle | `.theme-blog-list-card-title` | BlogList |
| blogListCardMetadata | `.theme-blog-list-card-metadata` | BlogList |
| widgetTitle | `.theme-widget-title` | blogWidgetUI.ts (Search, Categories, Featured, Maps) |

---

## 7. Česte greške

- **Recharts Tooltip formatter** – `value` i `name` mogu biti `undefined`; ne tipizirati eksplicitno kao `number`/`string`; koristiti `value ?? 0`, `name ?? ""` u returnu
- **BlockNote FormattingToolbar.Button** – prop `label` je obavezan (BlockNote 0.46+)
- **blocknoteImageSchema** – `createImageBlockConfig()` zahtijeva argument; koristiti `createImageBlockConfig({})`; `displayWidth` iz parse-a mora biti literal `"full"|"50"|"25"` (type assertion)
- **theme.ts dinamički ključevi** – kad dodaješ `headingH1`–`headingH6` u merged, cast: `(merged as unknown as Record<string, ThemeElement>)[key] = ...`
- **useEffect + DOM manipulacija** za wrapanje slika u ProseContent – re-render briše wrappere
- **Zaboraviti `data-cursor-aperture` na img** – kad je miš iznad slike, `target` je img; bez atributa na img, `closest()` ne pronalazi wrapper
- **Dodavati atribute naknadno** – struktura mora biti u HTML-u/JSX-u od početka
- **createPortal + MutationObserver** u Reactu – rizik beskonačne petlje i blokade aplikacije; koristi sigurniji pristup (npr. `position: fixed` + `getBoundingClientRect`)
- **Mijenjanje više od traženog** – ako korisnik traži npr. promjenu boje slova, ne diraj okvir bloka, dropdown pozadinu niti formatting toolbar
- **Zaboraviti whitelist u sanitizeru** – kad dodaješ nove atribute na slike (npr. `data-display-width`), odmah ih dodaj u `PROSE_ALLOWED_ATTRIBUTES` i `transformTags` u `src/lib/sanitize.ts`

---

## 8. Arhitektura

Detaljniji opis projekta: **`docs/architecture.md`**.

---

## 9. Statčki export na shared hostingu (Apache)

Kad se projekt deploya na klasični shared hosting (Apache + cPanel/FTP) s `output: "export"`:

- **.htaccess** – koristi se `.htaccess` iz `public/.htaccess` koji se pri buildu kopira u root `out/`:

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

- **Blog post URL‑ovi** – zbog ograničenja hostinga pojedinačni postovi koriste eksplicitne `.html` linkove:
  - lista: `/blog`
  - post: `/blog/${post.slug}.html`
  - referentne komponente: `BlogList` i `FeaturedPostsWidget`.
- **Mobile blog layout (full‑bleed)** – na mobilnom:
  - featured slike i tamni blok ispod njih (naslov + datum) na listi bloga idu **od ruba do ruba** (`-mx-6 w-[calc(100%+3rem)]`, unutarnji sadržaj ima `px-6`);
  - isto za featured sliku i tekstualni dio posta na stranici `blog/[slug]/page.tsx`.
  - referentne komponente: `BlogList` i `blog/[slug]/page.tsx`.
