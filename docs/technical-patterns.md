# Tehnički paterni – step by step

Ovaj dokument opisuje kako implementirati uobičajene funkcionalnosti u projektu. **Prvo pročitaj ovaj dokument** prije implementacije – prati postojeće komponente.

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
- Parsiraj HTML (DOMParser u browseru, linkedom na serveru)
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

**Korak 5:** SSR – na serveru koristi `linkedom` za parsiranje (DOMParser nije dostupan u Node.js).

---

## 2. Admin Dashboard – stacked bar chart za blog kategorije

Graf "Images by category in blog" prikazuje glavne kategorije na X-osi, podkategorije (npr. Atletika, Nogomet) kao segmenti unutar stupca.

**Korak 1:** Koristi `getBlogCategoryStackedChartData(posts, getImageCount)` iz `blogCategories.ts` – vraća `{ data, segmentKeys, segmentLabels }`.

**Korak 2:** Recharts BarChart s više `<Bar>` komponenti – svaka ima `stackId="blog"`, `dataKey` = segment slug.

**Korak 3:** Tooltip formatter koristi `segmentLabels` za čitljive nazive.

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

---

## 4. Česte greške

- **useEffect + DOM manipulacija** za wrapanje slika u ProseContent – re-render briše wrappere
- **Zaboraviti `data-cursor-aperture` na img** – kad je miš iznad slike, `target` je img; bez atributa na img, `closest()` ne pronalazi wrapper
- **Dodavati atribute naknadno** – struktura mora biti u HTML-u/JSX-u od početka

---

## 5. Arhitektura

Detaljniji opis projekta: **`architecture.md`** u rootu.
