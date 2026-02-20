# Changelog

## [Unreleased]

### Custom Cursor – optimizacija odziva

- **Dot (glavni kursor):** Trenutni odziv – `useMotionValue` za x/y umjesto state; ažurira se direktno u `mousemove` bez React re-rendera. `setIsVisible(true)` samo pri prvom pomicanju (ref), ne na svaki move.
- **Aperture ikona:** Spring parametri (stiffness 500, damping 28) – namjerno kašnjenje za glatko praćenje; dot mora biti trenutan, aperture može kasniti.
