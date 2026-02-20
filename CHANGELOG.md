# Changelog

## [Unreleased]

### GearSection – redizajn

- **Grupiranje po kategorijama:** Cameras, Lenses, Accessories s naslovima i ikonama (Camera, Focus, Zap)
- **Kartice:** Border, pozadina, naslov ispod slike; `object-contain` za uređenički prikaz; hover efekti
- **Lightbox uklonjen** – slike se više ne otvaraju u lightboxu
- **Animacije:** Fade-in pri skrolanju (`whileInView`)

### Admin Dashboard – razdvajanje portfolio / blog

- **Summary kartice:** Portfolio (slike), Blog (slike), Portfolio Categories, Blog Categories, Static pages, Blog posts
- **Charts:** "Images by category in portfolio" (bar), "Images by category in blog" (bar) – pie chart zamijenjen
- **imagesByBlogCategory:** Broj slika po blog kategoriji (thumbnail + galerija); koristi `postHasCategory` za filtriranje

### Custom Cursor – optimizacija odziva

- **Dot (glavni kursor):** Trenutni odziv – `useMotionValue` za x/y umjesto state; ažurira se direktno u `mousemove` bez React re-rendera. `setIsVisible(true)` samo pri prvom pomicanju (ref), ne na svaki move.
- **Aperture ikona:** Spring parametri (stiffness 500, damping 28) – namjerno kašnjenje za glatko praćenje; dot mora biti trenutan, aperture može kasniti.
