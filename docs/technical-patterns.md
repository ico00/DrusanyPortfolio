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

**Korak 2:** U `processProseHtml` ([`src/lib/processProseHtml.ts`](src/lib/processProseHtml.ts)):
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

**Korak 6:** Širina slike – ProseContent čita `data-display-width` (full|50|25) ili `data-preview-width`/`width` za ručni resize. Wrapper dobiva odgovarajuće CSS (50%, 25% ili max-width u px). Blog editor koristi custom schema (`blogBlockNoteSchema`) s Image blockom koji ima `displayWidth` prop – ImageSizeSelect i hover toolbar omogućuju odabir Full/50%/25%. **Full-width slike** – slike bez displayWidth 50/25 imaju `width: 100%` i `max-width: 100%` (bez breakouta – sprječava preljev); u `globals.css` sekcija "Prose – full-width slike". **BlockNote struktura** – `bn-file-block-content-wrapper` ima inline width (npr. 512px); `processProseHtml` postavlja `width: 100%` i `max-width: 100%` na taj wrapper za full-width slike (SSR-safe: ne koristiti `instanceof HTMLElement`).

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
| Obrada proze (slike, TOC, blockquote, YouTube) | processProseHtml | `src/lib/processProseHtml.ts` |
| TOC članka (h1–h6) | BlogPostToc, BlogPostLayoutClient | `src/components/blog/BlogPostToc.tsx`, `BlogPostLayoutClient.tsx` |
| Custom cursor | CustomCursor | `src/components/CustomCursor.tsx` |
| Stacked chart (blog kategorije) | AdminDashboard | `src/components/AdminDashboard.tsx` |
| Chart podaci | getBlogCategoryStackedChartData | `src/data/blogCategories.ts` |
| Sanitizer (whitelist atributa) | sanitizeProseHtml | `src/lib/sanitize.ts` |
| Centralizirane util funkcije | transliterateCroatian, sanitizeFilename, sanitizeFolderName | `src/lib/utils.ts` |
| Portfolio kategorije (slug + label) | PORTFOLIO_CATEGORIES | `src/data/portfolioCategories.ts` |
| Portfolio kategorije + Lucide ikone | PORTFOLIO_CATEGORIES_WITH_ICONS | `src/data/portfolioCategoryIcons.tsx` |
| Masonry broj stupaca (resize) | useColumnCount(`"gallery"` \| `"press"`) | `src/hooks/useColumnCount.ts` |
| Dev-only API guard | requireDevApiResponse | `src/lib/apiDevOnly.ts` |
| Format datuma (blog, portfolio, admin) | formatBlogDate, formatPortfolioDateLong, … | `src/lib/formatDate.ts` |
| Provjera postojanja datoteke | fileExists | `src/lib/fileUtils.ts` (samo server) |
| Blog sidebar widgeti (stilovi, hover rub) | BLOG_WIDGET_UI (`rowHover`, `itemInactive`, `inputWrapper`) | `src/data/blogWidgetUI.ts` |
| Blog widget konfiguracija (JSON) | getBlogWidgets, blogWidgets.json | `src/lib/blogWidgets.ts`, `src/data/blogWidgets.json` |
| Admin: blog widgeti + planovi | BlogWidgetsAdmin (grid Title stupac na `md+`), `/api/blog-widgets`, `/api/plans` | `BlogWidgetsAdmin.tsx`, `api/blog-widgets/route.ts`, `api/plans/route.ts`, `lib/blogWidgets.ts`, `lib/plans.ts` |
| Admin stringovi (blog widgeti) | `ADMIN_UI.adminWidgets` | `src/data/adminUI.ts` |
| Admin blog forma – metadata red | AdminBlog (Datum, vrijeme, Status, Autor teksta, Autor fotografija, Featured u jednom redu) | `src/components/AdminBlog.tsx` |
| Blog widget komponente | SearchWidget, CategoriesWidget, FeaturedPostsWidget, PlansWidget, GoogleMapsWidget | `src/components/blog/` |
| Accordion (grid-rows) | CategoriesWidget (kategorije s podkategorijama), AdminSidebar | `src/components/blog/CategoriesWidget.tsx` |
| Block type select (slash `/` i proširenja tipova) | BlockTypeSelectWithCursor, `getSlashMenuItems` | `src/components/BlockTypeSelectWithCursor.tsx`, `BlockNoteEditor.tsx` |
| Formatting toolbar na vrhu bloka | BlockTopFormattingToolbarController | `src/components/BlockTopFormattingToolbarController.tsx` |
| Link toolbar (FormattingToolbar) | CustomCreateLinkButton | `src/components/CustomCreateLinkButton.tsx` |
| Custom Image block (displayWidth) | blocknoteImageSchema | `src/lib/blocknoteImageSchema.tsx` |
| YouTube video blok (embed po širini stranice) | blocknoteYouTubeSchema | `src/lib/blocknoteYouTubeSchema.tsx` |
| File Panel (Upload + Media + Embed) | BlogFilePanel, BlogUploadTab | `src/components/blocknote/BlogFilePanel.tsx`, `BlogUploadTab.tsx` |
| Media tab (odabir postojeće slike) | MediaLibraryTab | `src/components/blocknote/MediaLibraryTab.tsx` |
| Theme grupe, accordion, elementi | ThemeAdmin | `src/components/ThemeAdmin.tsx` |
| Prose linkovi (hover) | globals.css | `.prose a`, `.prose-invert a` |
| LCP optimizacija (blog thumbnail) | blog/[slug]/page.tsx | `src/app/(with-footer)/blog/[slug]/page.tsx` |
| Traka napretka čitanja (post) | BlogReadingProgress + `data-blog-reading-article` na `<article>` | `src/components/blog/BlogReadingProgress.tsx` |
| Header (forceLightMode za blog) | Header | `src/components/Header.tsx` |
| Blog lista po kategoriji (OG/share) | `blog/kategorija/[slug]/page.tsx` | `src/app/(with-footer)/blog/kategorija/[slug]/page.tsx` |
| Put kategorije za linkove | `blogCategoryListPath`, `getAllBlogCategorySlugs`, `getCategorySlugFromBlogPathname` | `src/data/blogCategories.ts` |
| Paginacija bloga s kategorijom | Pagination (`categorySlug`) | `src/components/blog/Pagination.tsx` |

---

## 3.1 LCP optimizacija (blog post thumbnail)

Kad radiš s glavnom slikom (LCP element) na blog post stranici:

**Korak 1:** Glavna slika (thumbnail) – `loading="eager"`, `fetchPriority="high"`, `sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"`.

**Korak 2:** Preload – `preload()` iz `react-dom` pozovi prije returna (server komponenta); dodaje `<link rel="preload" as="image" fetchpriority="high">` u head.

**Korak 3:** Galerijske slike (ispod sadržaja) – `loading="lazy"` (BlogGallery već ima).

**Referentna komponenta:** `src/app/(with-footer)/blog/[slug]/page.tsx`

---

## 3.2 Favicon

- **Lokacija:** `public/favicon.ico` – pri buildu se kopira u root `out/`
- **Metadata:** `layout.tsx` – `icons: { icon: "/favicon.ico?v=2" }`; query parametar `?v=N` za cache busting kad mijenjaš favicon
- **Promjena:** Zamijeni `public/favicon.ico`, povećaj verziju u layout.tsx (npr. `?v=3`), rebuild

---

## 3.3 Prose linkovi – hover (postovi, stranice)

Linkovi unutar `.prose` i `.prose-invert` (blog postovi, About, Contact) imaju hover efekt u `globals.css`:

- **Deblja donja linija:** `text-decoration-thickness: 3px`
- **Svjetlo plava boja:** `sky-400` (svijetla tema), `sky-300` (tamna tema)

**Lokacija:** `src/app/globals.css` – sekcija "Prose – linkovi".

---

## 4. Blog sidebar widgeti

Dizajn: **jedinstveni panel** – bijela pozadina (`bg-white`), tamna slova (`text-zinc-900`), svi widgeti u jednom `rounded-2xl` bloku, odvojeni `border-t border-zinc-200`.

**Korak 1:** Koristi `BLOG_WIDGET_UI` iz `src/data/blogWidgetUI.ts` – svi stilovi su centralizirani kao u `ADMIN_UI`.

**Korak 2:** Widget komponente ne koriste vlastite kartice – renderiraju samo sadržaj; `BlogSidebar` ih wrappa u sekcije unutar panela.

**Korak 3:** Referentne komponente: BlogSidebar, SearchWidget, CategoriesWidget, FeaturedPostsWidget, PlansWidget, GoogleMapsWidget.

### 4.0.1 BLOG_WIDGET_UI – lijeva crta na hoveru

Javni blog sidebar koristi **`BLOG_WIDGET_UI`** (`src/data/blogWidgetUI.ts`): **`rowHover`** (`border-l-2 border-transparent`, `hover:border-zinc-300`) na redovima linkova; **`itemInactive` / `itemActive`** – aktivna stavka s `border-l-2`; **`inputWrapper`** – isti obrazac na `hover` / `focus-within` za default SearchWidget. **CategoriesWidget** – naslov akordeona također koristi `rowHover`. **Minimalni** SearchWidget (`variant="minimal"`) kombinira `rowHover` s donjom crtom.

### 4.1 CategoriesWidget – accordion za kategorije s podkategorijama

Kategorije koje imaju podkategorije (Sport, Gradovi – iz `BLOG_CATEGORIES` u `blogCategories.ts`) prikazuju se kao accordion: roditelj s chevronom za expand/collapse, podkategorije uvučene ispod. Kategorije bez podkategorija ostaju obični linkovi. **Pattern:** `grid-rows-[1fr]` / `grid-rows-[0fr]` za animaciju (kao AdminSidebar). Podkategorije se sortiraju abecedno po labelu. Kad je aktivna podkategorija ili roditelj, accordion se automatski otvara.

**Accordion strelica:** Chevron (`ChevronDown`) je na **desnoj strani** retka (između naziva i broja postova), s rotacijom: `-rotate-90` kad je zatvoreno, `rotate-0` kad je otvoreno (animacija 200ms). Raspored retka: `[Naziv kategorije] ... [▼ strelica] [(broj)]`. Stil (`itemActive`/`itemInactive`) je na cijelom retku (`div`), ne samo na linku — tako da se debljina selekcije podudara s običnim kategorijama.

**Referentna komponenta:** `src/components/blog/CategoriesWidget.tsx`

### 4.2 PlansWidget – planirani snimanja

Widget "Planovi" prikazuje listu snimanja koja se planiraju. Podaci u `src/data/plans.json`: `{ "plans": [ { "date": "YYYY-MM-DD", "name": "Naziv snimanja" } ] }`. `getPlans()` iz `@/lib/plans` učitava i sortira po datumu (ascending). Prikaz: datum (formatBlogDate) pa naziv. Redoslijed u sidebaru: u `blogWidgets.json` stavka `type: "plans"`. **Admin:** `/admin?tab=widgets` → red *Plans* → *Edit planned events* → uređivanje + *Save plans* (`PUT /api/plans`, dev only); `parsePlansPayload` / `savePlans` u `lib/plans.ts`.

### 4.3 FeaturedPostsWidget – istaknuti članci (max 3)

Istaknuti članci su ograničeni na **maksimalno 3**. Validacija na više mjesta: AdminBlog (forma – checkbox disabled kad je 3, lista – gumb za dodavanje 4. skriven, save/create – provjera prije slanja), API (`PUT` i `POST` – vraća 400 ako prekorači). Pri pokušaju dodavanja 4. prikazuje se toast s porukom `ADMIN_UI.blog.maxFeaturedReached`. **Linkovi** – `/blog/${post.slug}` (čisti URL bez `.html`).

**Referentne datoteke:** `src/components/blog/FeaturedPostsWidget.tsx`, `src/components/AdminBlog.tsx`, `src/app/api/blog/route.ts`, `src/data/adminUI.ts`

### 4.4 SearchWidget – iOS Safari zoom

iOS Safari automatski zumira input kad je font manji od 16px. Search input mora imati `text-base` (16px), ne `text-sm`. Bez toga korisnik na mobilu dobiva nepoželjni zoom pri fokusu.

**Referentna komponenta:** `src/components/blog/SearchWidget.tsx`

### 4.5 Blog layout – naslov i poravnanje

- **Blog lista** – bez naslova (h1) na vrhu stranice – previše praznog prostora na mobilu; `BlogListLayout` ne prima `title` prop.
- **Blog post** – naslov članka poravnat s sidebarom; uklonjen `pt-5` s headera u `blog/[slug]/page.tsx`.

**Referentne komponente:** `src/components/blog/BlogListLayout.tsx`, `src/app/(with-footer)/blog/[slug]/page.tsx`

### 4.6 Header na blogu – forceLightMode (hydration fix)

Nakon klika na kategoriju u CategoriesWidget i punog refresha (Ctrl+R), `usePathname()` može tijekom hydration vratiti pogrešnu vrijednost – header bi mislio da je na home stranici i prikazivao transparentan stil; pri skrolanju bi se pojavila tamna verzija umjesto svijetle.

**Rješenje:** Proslijediti `forceLightMode` iz server komponente. BlogListLayout i blog/[slug]/page.tsx koriste `<Header forceLightMode />` – header tada ne ovisi o `usePathname()` i uvijek prikazuje svijetli stil (bijela pozadina, tamni tekst).

**Kad dodaješ novu stranicu s Headerom:** Ako je stranica na bijeloj pozadini (kao blog) i nema hero moda, proslijedi `forceLightMode` da izbjegneš hydration probleme.

**Referentne datoteke:** `src/components/Header.tsx`, `src/components/blog/BlogListLayout.tsx`, `src/app/(with-footer)/blog/[slug]/page.tsx`

### 4.7 Blog galerija – potvrda pri brisanju slike

Pri brisanju slike iz blog galerije (SortableGalleryItem ili bulk delete) prikazuje se **custom modal** umjesto native `confirm()`. State `deleteImageConfirmModal` s `count` i `onConfirm` callbackom; modal koristi `ADMIN_UI.modal`, `ADMIN_UI.buttons.secondary` (Odustani), `ADMIN_UI.buttons.danger` (Obriši). Poruke u `adminUI.ts`: `deleteImageConfirm`, `deleteImagesConfirm(n)`, `deleteImageModal.cancel`, `deleteImageModal.confirm`.

**Referentna komponenta:** `src/components/AdminBlog.tsx`

### 4.8 Blog post – autor teksta i fotografija

Svaki post ima dva opcionalna polja: `authorText` (autor teksta) i `authorPhoto` (autor fotografija). Oba su u `BlogPost` interfaceu (`src/lib/blog.ts`) i spremaju se u `blog.json`. Default za oba: **"Ivica Drusany"**.

**Admin forma:** Dva input polja u metadata redu (Datum, Vrijeme, Status, **Autor teksta**, **Autor fotografija**, Featured). Placeholder: "Ivica Drusany". Kad su prazna, ne spremaju se u JSON (čist blog.json za postojeće postove).

**Prikaz na blogu (blog post + BlogList):**
- **Isti autori** (oba prazna ili isti tekst) → kompaktno: `📝 📷 Tekst i fotografije: Ivica Drusany`
- **Različiti autori** → odvojeno: `📝 Tekst: Pero Perić` i `📷 Fotografije: Ivica Drusany`

**Backward compatible** – postovi bez `authorText`/`authorPhoto` automatski prikazuju default "Ivica Drusany".

**Referentne datoteke:** `src/lib/blog.ts` (BlogPost interface), `src/components/AdminBlog.tsx` (forma; `openCreate` mora uključivati `authorText`/`authorPhoto` u početni objekt forme), `src/app/api/blog/route.ts` (POST/PUT), `src/app/(with-footer)/blog/[slug]/page.tsx` (prikaz), `src/components/BlogList.tsx` (lista)

### 4.9 Blog – lista po kategoriji (`/blog/kategorija/[slug]`) i dijeljenje (Open Graph)

**Problem:** URL `blog.html?kategorija=slug` dijeli isti statički HTML kao `/blog` – u `<head>` nema posebnog `og:image` po kategoriji; društvene mreže prikazuju generički blog.

**Rješenje:** Za svaku kategoriju (roditelj + podkategorije iz `getBlogCategoryOptions()`) generira se statička stranica **`/blog/kategorija/[slug]`** (`generateStaticParams`, `dynamicParams: false`).

**Metadata (`generateMetadata`):** Naslov `{label kategorije} | {blog SEO title}`; opis iz `pages.json` blog SEO ili fallback; **canonical** `/blog/kategorija/slug`; **`og:image` / Twitter** – apsolutni URL **thumbnaila najnovijeg objavljenog posta** u toj kategoriji (`postHasCategory`), ako nema thumbnaila – prva slika iz `gallery`.

**UI:** `BlogListLayout` prima opcionalno `initialCategorySlug`; `BlogList` spaja `?kategorija=` iz URL-a s tim slugom (path-URL i dalje filtrira isto). **Linkovi** na filter kategorije koriste **`blogCategoryListPath(slug)`** → `/blog/kategorija/slug` (CategoriesWidget, BlogList, blog post stranica). **CategoriesWidget** – aktivna stavka: `searchParams.get("kategorija")` **ili** `getCategorySlugFromBlogPathname(pathname)`.

**SearchWidget:** `router.replace` koristi **puni `pathname`** (ne skraćivanje na `/blog`) da pretraga na `/blog/kategorija/foo` ostane na toj ruti s `?q=`.

**Paginacija:** Prop `categorySlug` – stranica 1 → `/blog/kategorija/slug` (i eventualno `?q=`); stranice 2+ → `/blog/page/N?kategorija=…` (+ `q`).

**Sitemap:** `getAllBlogCategorySlugs()` – sve kategorijske stranice u `sitemap.ts`.

**Apache (`public/.htaccess`):** Pravilo **prije** pravila za pojedinačni post – `RewriteRule ^blog/kategorija/([^/]+)$ blog/kategorija/$1.html` uz `RewriteCond` da datoteka postoji.

**Backward compatible:** Stari `?kategorija=` i dalje radi na klijentu; za **preview pri dijeljenju** preporučen je čisti URL `/blog/kategorija/slug`.

**Referentne datoteke:** `blog/kategorija/[slug]/page.tsx`, `BlogListLayout.tsx`, `BlogList.tsx`, `Pagination.tsx`, `SearchWidget.tsx`, `CategoriesWidget.tsx`, `blog/[slug]/page.tsx`, `sitemap.ts`, `public/.htaccess`

---

## 5. BlockNote / TipTap

Kad radiš s linkovima u BlockNote editoru:

- **Link se otvara pri kliku** – korisnik ne može uređivati tekst unutar linka. Rješenje: `TiptapLink.configure({ openOnClick: false })` u `_tiptapOptions` (BlockNote schema).
- **editLoading** – pri otvaranju uređivanja prikaži loader dok se body ne učitava; sprječava popover crash (`reference.element` undefined, `isConnected`).
- **contentReady pri mountu editora** – u `BlockNoteEditor.tsx` state `contentReady` postavlja se na `true` tek nakon što `setTimeout(0)` završi `replaceBlocks` (ili odmah ako nema HTML sadržaja). `mounted` (formatting toolbar / FilePanel) ovisi o `contentReady`, ne samo o `requestAnimationFrame` – inače race: toolbar se montira prije nego što je DOM sinkroniziran s učitanim blokovima → Floating UI `Cannot read properties of undefined (reading 'isConnected')`.
- **FormattingToolbar.Button** – zahtijeva obavezan `label` prop (BlockNote 0.46+).
- **CustomCreateLinkButton** – `checkLinkInSchema` vraća `boolean` (ne type predicate – custom shema nije kompatibilna s default tipovima); za `anchor?.target === "_blank"` koristiti `anchor ? anchor.target === "_blank" : true` (ne `?? true` – boolean nije nullish).
- **blocknoteImageSchema** – `createImageBlockConfig({})` zahtijeva objekat (ne prazan poziv); `displayWidth` u `parseImageWithDisplayWidth` mora biti literal tip `"full" | "50" | "25"` (type assertion ako dolazi iz `getAttribute`).
- **blocksToFullHTML** – koristiti umjesto `blocksToHTMLLossy` za spremanje sadržaja. Lossy može gubiti slike pri konverziji u standardni HTML. Full je lossless. **Prored u prose:** Full HTML proizvodi `bn-block-group` / `bn-block-outer` strukturu – `.prose > * + *` ne primjenjuje se jer je jedini direktni child `bn-block-group`. U `globals.css` treba pravilo `.prose .bn-block-group > .bn-block-outer { margin-bottom: 1.5em }` za razmak između blokova pri renderiranju.

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

### 5.2 Slash menu (`/`) – YouTube video

Blok "YouTube video" omogućuje ubacivanje YouTube videa po punoj širini stranice. Dostupan je na dva načina: Block style dropdown i slash menu (`/youtube`, `/video`, `/embed`).

**Dodavanje u Block Type Select:** U `BlockTypeSelectWithCursor.tsx` – `blockTypeSelectItemsWithCodeBlock` – dodaj stavku `type: "youtubeEmbed"` s ikonom `RiYoutubeFill`. U `BlockNoteEditor.tsx` – `getCustomSlashMenuItems` – dodaj stavku za slash menu.

**Implementacija:**
- `src/lib/blocknoteYouTubeSchema.tsx` – blok s propom `url`; parsira YouTube link (watch, youtu.be, embed) u video ID; `toExternalHTML` vraća `figure.prose-youtube-wrapper` s iframe
- Sanitizer (`src/lib/sanitize.ts`) – dozvoljava `iframe` samo za `youtube.com/embed` URL
- ProseContent – wrapa postojeće YouTube iframe-ove u `.prose-youtube-wrapper`; CSS u `globals.css` za full-width breakout (YouTube; slike u blogu koriste 100% širine bez breakouta)

**Referentne datoteke:** `blocknoteYouTubeSchema.tsx`, `sanitize.ts`, `ProseContent.tsx`, `globals.css`

### 5.3 File Panel – tab "Media" (odabir postojeće slike)

U blog editoru, kad odabereš sliku (Image), File Panel ima tri taba: **Upload**, **Media**, **Embed**.

- **Upload** – upload nove datoteke (ako je `uploadFile` proslijeđen)
- **Media** – odabir postojeće slike iz biblioteke (`/api/media` – portfolio, blog, stranice)
- **Embed** – unos URL-a

Implementacija: `BlogFilePanel` (Upload + Media + Embed) koristi se umjesto default FilePanel kad je blog schema. `MediaLibraryTab` dohvaća `/api/media`, prikazuje grid s pretragom, klik ažurira blok.

**Referentne datoteke:** `src/components/blocknote/BlogFilePanel.tsx`, `src/components/blocknote/MediaLibraryTab.tsx`

### 5.3.1 File Panel – Upload tab (`BlogUploadTab`)

- **`BlogFilePanel`** koristi **`BlogUploadTab`** umjesto default **`UploadTab`** iz `@blocknote/react`.
- **Drag-and-drop:** zona s `preventDefault` na `dragover`; brojač na `dragenter`/`dragleave`; `drop` uz prvu datoteku; `fileMatchesAccept` usklađuje s `accept` sheme bloka.
- **Tekst (EN):** *Drag and drop file here or Choose file*; klik na gumb poziva nativni picker preko `dropzoneRef` + `querySelector('input[type="file"]')` (BlockNote `FileInput` u tipovima ne izlaže `ref`).
- **Stil nativnog file inputa:** `globals.css` – `.bn-panel input[type="file"].bn-file-input` – `::file-selector-button` i `::-webkit-file-upload-button` (margin, rub, pozadina gumba) da se „Choose file“ i „No file chosen“ vizualno odvoje.

**Referentne datoteke:** `src/components/blocknote/BlogUploadTab.tsx`, `src/components/blocknote/BlogFilePanel.tsx`, `src/app/globals.css`

### 5.4 Formatting toolbar na vrhu bloka

Formatting toolbar (Bold, Italic, link, …) pojavljuje se **na vrhu bloka** i kad je samo **kursor u tekstualnom bloku**, i kad je **označen tekst** (BlockNoteov extension inače prikazuje samo uz selekciju). Koristi se block start (`$from.start()`) za poziciju. Na **code / slika / YouTube / file / video / audio** blokovima se ne prikazuje dok je selekcija prazna.

**Komponenta:** **BlockTopFormattingToolbarController** – u `CustomFormattingToolbar` umjesto default `FormattingToolbarController`.

**Tip bloka:** Nema plutajuće „Block style“ trake; tipovi blokova umetaju se preko **slash menija** (`/`). Proširenja (npr. code block, YouTube) – `blockTypeSelectItemsWithCodeBlock` u `BlockTypeSelectWithCursor.tsx` i stavke u `getSlashMenuItems` u `BlockNoteEditor.tsx`.

**Referentne datoteke:** `src/components/BlockTopFormattingToolbarController.tsx`, `src/components/CustomFormattingToolbar.tsx`, `src/components/BlockNoteEditor.tsx`

**Uklonjeno:** plutajuća **FloatingBlockTypeBar** („Block style:“ na kursoru) – više nije u `BlockNoteEditor.tsx`; tip bloka isključivo **slash** (`/`) i proširenja u `getSlashMenuItems`.

### 5.4.1 Admin – tooltipovi formatting toolbar gumba

BlockNote/shadcn koriste Radix **`[data-slot="tooltip-content"]`** (portal na `body`). U admin tamnoj temi (`document.documentElement` **`data-theme="dark"`** iz `AdminClient`) u **`globals.css`** pravilo **`[data-theme="dark"] [data-slot="tooltip-content"]`** postavlja crnu pozadinu, svijetli tekst, rub i blagu sjenu; strelica (`svg` zadnji child) `fill` usklađen s pozadinom.

### 5.5 Okvir blokova u editoru

Svaki blok u BlockNote editoru ima lagani tanki okvir. Stilovi u `globals.css`:

```css
.blocknote-editor-wrapper .bn-block-group > .bn-block-outer {
  margin-bottom: 1.5rem;
  border: 1px solid rgb(63 63 70); /* zinc-600 */
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
}
```

**Lokacija:** `src/app/globals.css` – sekcija "BlockNote – razmak između blokova, lagani tanki okvir"

### 5.6 Trailing blok (zadnji prazan blok)

Zadnji prazan blok u editoru **nije moguće obrisati** – namjerno ponašanje (ProseMirror TrailingNode). Služi kao entry point za dodavanje novog sadržaja. Pri spremanju prazni blokovi se obično ne šalju u HTML.

### 5.7 BlockNote side menu (+ i ⋮⋮) – patch za klikabilnost

BlockNote side menu (gumb + za dodavanje bloka, točkice za drag handle) nestaje kad miš ide prema njemu jer ProseMirror gubi hover nad blokom. **Patch** u `patches/@blocknote+core+0.46.2.patch` modificira `SideMenuExtension`: prije skrivanja menija provjerava `document.elementFromPoint(x, y)?.closest(".bn-side-menu")` – ako je miš nad menijem, meni ostaje vidljiv i klikabilan. **patch-package** primjenjuje patch pri `npm install` (postinstall). Ako nadogradiš BlockNote, ponovno pokreni `npx patch-package @blocknote/core` nakon ručne izmjene u `node_modules`.

**Referentne datoteke:** `patches/@blocknote+core+0.46.2.patch`, `package.json` (postinstall)

### 5.8 Zaštita od gubitka slika pri spremanju

- **blocksToFullHTML** – BlockNoteEditor koristi lossless konverziju (već u 5).
- **Backup** – `saveBlogBody` stvara `[slug].html.backup` prije overwrite-a; `.backup` u `.gitignore`.
- **Validacija** – PUT `/api/blog` uspoređuje broj slika u starom vs novom body-ju; ako novi ima manje, vraća **409** (`images_removed`, `removedCount`, `removedUrls`); AdminBlog prikazuje confirm, retry s `forceSave: true`.

### 5.9 Promjena datuma ili slug-a – automatsko usklađivanje

Kad u adminu promijeniš datum ili slug posta i spremiš, `blogCleanup` automatski:

1. **Preimenuje folder** – `public/uploads/blog/[stari-datum]-[stari-slug]/` → `[novi-datum]-[novi-slug]/`
2. **Ažurira blog.json** – thumbnail, gallery, galleryMetadata
3. **Ažurira blogExif.json** – putanje za EXIF
4. **Ažurira HTML sadržaj** – zamjena starih putanja u `img src`, `data-url` itd.
5. **Briše stari HTML** – samo kad se slug mijenja (stari `[slug].html`)

**Admin:** DatePicker – promjena datuma automatski ažurira slug (format yymmdd-naslov). Slug se šalje na API s novim datumom, pa cleanup radi s ispravnim vrijednostima.

**Referentna datoteka:** `src/lib/blogCleanup.ts` – `cleanupBlogOrphanFiles`

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
| pageTitle | `.theme-page-title` | BlogListLayout, buduće stranice |
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
- **Header na blogu bez forceLightMode** – nakon refresha na `/blog?kategorija=...` `usePathname()` može vratiti pogrešnu vrijednost tijekom hydration; header bi prikazao transparentan/tamni stil. Koristi `<Header forceLightMode />` u BlogListLayout i blog/[slug]/page.tsx
- **JSX prop s duplim `{`** – npr. `authorMobile={{ sameAuthor ? (` – parser tumači unutarnji `{` kao objekt. Ispravno: `authorMobile={sameAuthor ? (` (jedan par vitičastih za cijeli izraz).
- **AdminBlog `setForm` / TypeScript** – ako `BlogPost` forma dobije nova polja (`authorText`, `authorPhoto`), svi kodovi koji postavljaju cijeli objekt forme (`openCreate`, `openEdit`) moraju ih uključiti; inače build pada na `SetStateAction`.

---

## 8. Arhitektura

Detaljniji opis projekta: **`docs/architecture.md`**.

---

## 9. Statički export na shared hostingu (Apache)

Kad se projekt deploya na klasični shared hosting (Apache + cPanel/FTP) s `output: "export"`:

- **.htaccess** – koristi se `.htaccess` iz `public/.htaccess` koji se pri buildu kopira u root `out/`:

```apache
DirectorySlash Off
Options -Indexes -MultiViews
DirectoryIndex index.html

<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /

# /blog → blog.html (301)
RewriteRule ^blog/?$ /blog.html [L,R=301]

# RSC/prefetch segmenti (slug.html.txt → slug.txt, slug.html/__next.* → slug/__next.*)
RewriteRule ^blog/(.+)\.html\.txt$ blog/$1.txt [L]
RewriteRule ^([^/]+)\.html\.txt$ $1.txt [L]
RewriteRule ^blog/(.+)\.html/(__next\..+)$ blog/$1/$2 [L]
RewriteRule ^index\.html/(__next\..+)$ /$1 [L]
RewriteRule ^([^/]+)\.html/(__next\..+)$ $1/$2 [L]

# Blog lista po kategoriji: /blog/kategorija/slug → blog/kategorija/slug.html
RewriteCond %{DOCUMENT_ROOT}/blog/kategorija/$1.html -f
RewriteRule ^blog/kategorija/([^/]+)$ blog/kategorija/$1.html [L]

# Blog post: /blog/slug → blog/slug.html (eksplicitno — blog/slug/ direktorij postoji)
RewriteCond %{DOCUMENT_ROOT}/blog/$1.html -f
RewriteRule ^blog/([^/]+)$ blog/$1.html [L]

# Stari /blog/slug.html → 301 na čisti URL (samo originalni zahtjev, ne interni rewrite)
RewriteCond %{THE_REQUEST} \s/blog/[^\s]+\.html
RewriteCond %{DOCUMENT_ROOT}/blog/$1.html -f
RewriteRule ^blog/(.+)\.html$ /blog/$1 [L,R=301]

# Portfolio kategorije
RewriteRule ^(concerts|sport|animals|interiors|zagreb|food-drink)/?$ $1.html [L]

# Fallback: /path → path.html (ako nije datoteka NI direktorij)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME}.html -f
RewriteRule ^(.*)$ $1.html [L]
</IfModule>
```

- **Blog post URL‑ovi** – čisti URL-ovi (bez `.html`):
  - lista: `/blog`
  - post: `/blog/${post.slug}` (bez `.html`)
  - `generateStaticParams` vraća čisti slug (npr. `251228-advent-2025`); Next generira `blog/slug.html` (datoteka) i `blog/slug/` (direktorij sa segmentima za prefetch) — nema sukoba
  - **Važno:** Na disku postoji i datoteka `blog/slug.html` i direktorij `blog/slug/` (sa `__next` segment datotekama za prefetch). Apache bez eksplicitnog pravila vidi direktorij i ne servira `.html` datoteku — zato je potrebno pravilo #2 (`^blog/([^/]+)$`) koje eksplicitno servira `.html`.
  - Stari `/blog/slug.html` URL-ovi (bookmarkovi, Google indeks) dobivaju **301 redirect** na čisti oblik; `%{THE_REQUEST}` osigurava da se redirect primjenjuje samo na originalni zahtjev, ne na interni rewrite (inače bi nastala petlja)
  - Fallback pravilo (#4) ima `!-d` uvjet jer bez njega Apache bi pokušao servirati direktorij umjesto dodati `.html`
  - referentne komponente: `BlogList`, `FeaturedPostsWidget`, `CustomCreateLinkButton` – svi koriste `/blog/${slug}` (bez `.html`)
- **Mobile blog layout (full‑bleed)** – na mobilnom:
  - featured slike i tamni blok ispod njih (naslov + datum) na listi bloga idu **od ruba do ruba** (`-mx-6 w-[calc(100%+3rem)]`, unutarnji sadržaj ima `px-6`);
  - isto za featured sliku i tekstualni dio posta na stranici `blog/[slug]/page.tsx`.
  - **Blog post mobilna specifika:** search widget isti razmak kao blog lista (`py-24`); autor ispod featured slike; kategorija kao **Link** na **`/blog/kategorija/{slug}`** (`blogCategoryListPath`) – filter i OG-friendly URL.
  - referentne komponente: `BlogList`, `blog/[slug]/page.tsx`.

### 9.1 Deploy (rsync over SSH)

**Trenutno stanje (ožujak 2026):** rsync over SSH – jedan korak, samo promijenjene datoteke. Workflow: uređuješ u adminu → spremiš → `./scripts/deploy-static.sh` → gotovo.

- **Repozitoriji:**
  - `DrusanyPortfolio` – izvorni kod (ovaj projekt).
  - `drusany-static` – odvojeni repo koji sadrži **samo statički output** (`out/` bez `uploads`).
- **Skripta za deploy:** `scripts/deploy-static.sh`
  - iz root projekta poziv: `./scripts/deploy-static.sh`
  - radi:
    - `npm run build`
    - kopira `out/` u `../drusany-static` (uključujući `.htaccess`)
    - briše `uploads` iz `drusany-static`
    - generira `.cpanel.yml`
    - `git add`, `git commit`, `git push` na `drusany-static`
    - **SSH cleanup** – briše legacy `blog/*.html/` direktorije na serveru (ako postoje) prije rsync-a; koristi jednostavnu `for` petlju (ne process substitution `< <(find ...)` — `/dev/fd` ne postoji na shared hostingu)
    - **rsync over SSH** (ako su `SSH_HOST`, `SSH_USER` u `.env`) – `--delete` uklanja stare datoteke; `--exclude uploads` štiti fotografije; prenosi samo promijenjene datoteke direktno u `public_html`
- **deploy-uploads.sh** – rsync samo `public/uploads/`; `--delete` po defaultu (`UPLOADS_DELETE=1`) briše sa servera fotografije kojih lokalno nema; `UPLOADS_DELETE=0 npm run deploy:uploads` za upload bez brisanja
- **cPanel Git™ Version Control:**
  - klonirani repo `drusany-static` koristi `.cpanel.yml` (skripta ga generira pri svakom deployu)
  - **Važno:** `cp -R *` ne kopira dotfileove – `.htaccess` mora biti eksplicitno u tasku
  - Skripta piše čisti YAML (ne RTF – TextEdit u Rich Text modu kvari datoteku)

```yaml
deployment:
  tasks:
    - export DEPLOYPATH=/home/<USER>/public_html
    - /bin/cp -f .htaccess $DEPLOYPATH/ 2>/dev/null || true
    - /bin/cp -R * $DEPLOYPATH
```

- **Postavka rsync (jednokratno):**
  1. U cPanelu: Security → SSH Access – omogući SSH, zapiši port (često nije 22, npr. 21098).
  2. Na serveru: instaliraj rsync ako nije (`yum install rsync` ili slično – hosting obično ima).
  3. U `.env` dodaj:
     ```
     SSH_HOST=drusany.com
     SSH_USER=drusanyc
     SSH_PATH=/home/drusanyc/public_html
     SSH_PORT=21098
     ```
  4. Testiraj: `ssh -p 21098 drusanyc@drusany.com` (ili lozinka ili SSH ključ).
- **Deploy rutina:** Uređuješ u adminu → Save → `./scripts/deploy-static.sh` → gotovo. Skripta radi build, push i rsync.
- **Alternativa (ako nemaš SSH):** FTP deploy (`FTP_HOST`, `FTP_USER`, `FTP_PASS`) ili cPanel Deploy HEAD Commit (može biti nestabilan).
- **uploads/** (fotografije): `./scripts/deploy-uploads.sh` ili `npm run deploy:uploads` – rsync/FTP samo `public/uploads/`, šalje samo promijenjene datoteke (provjera po veličini). Koristi iste varijable kao deploy-static (SSH_* ili FTP_*).

### 9.2 Brzi start dev (dev-and-open)

Skripta `./scripts/dev-and-open.sh` ili `npm run dev:open`: otvara novi Terminal prozor s `npm run dev`, čeka da server odgovori (max 30 s), zatim otvara Google Chrome s 2 taba – `http://localhost:3000` i `http://localhost:3000/admin`. Korisno za brzi pokretanje razvoja bez ručnog otvaranja preglednika.

---

## 10. Hydration i Suspense (useSearchParams)

Komponente koje koriste `useSearchParams()` (`BlogList`, `SearchWidget`, `CategoriesWidget`) moraju biti unutar `Suspense` granice. Sa `output: "export"`, Next.js na serveru može renderirati Suspense fallback za te komponente, dok klijent renderira pravi sadržaj.

**Pravilo:** Koristiti **jedan `Suspense`** oko cijelog bloka sadržaja koji sadrži više komponenti s `useSearchParams()`, a ne zasebni Suspense za svaku. Višestruki Suspense blokovi unutar istog kontejnera stvaraju strukturalne razlike između serverskog i klijentskog DOM-a → hydration mismatch.

**Primjer (BlogListLayout):**

```tsx
<div className="mx-auto max-w-7xl px-6 py-24">
  <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-zinc-50" />}>
    <div className="mb-6 lg:hidden">
      <SearchWidget variant="minimal" />
    </div>
    <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
      <main className="min-w-0 flex-1">
        <BlogList posts={posts} ... />
      </main>
      <aside>
        <BlogSidebar posts={posts} />
      </aside>
    </div>
  </Suspense>
</div>
```

**Na blog post stranici** (`blog/[slug]/page.tsx`): `BlogSidebar` se prosljeđuje kao prop `sidebar` u `BlogPostLayoutClient` i omotava u `Suspense`.

**Referentne datoteke:** `BlogListLayout.tsx`, `blog/[slug]/page.tsx`, `BlogPostLayoutClient.tsx`
