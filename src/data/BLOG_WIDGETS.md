# Blog widgeti – konfiguracija

Widgete bloga uređuješ u datoteci `blogWidgets.json`.

## Kategorije
- `enabled: true/false` – uključi/isključi widget
- `title` – naslov widgeta

## Instagram
- `username` – tvoj Instagram username (bez @)
- `profileUrl` – puna poveznica na profil
- `images` – niz URL-ova slika (opcionalno). Ako je prazan, slike se dohvaćaju automatski putem Instagram Graph API-ja.

**Automatski preview (kao WordPress plugin):**
1. Pretvori Instagram račun u **Business** ili **Creator** (besplatno u postavkama)
2. Kreiraj Meta Developer app na [developers.facebook.com](https://developers.facebook.com)
3. Dodaj Instagram proizvod u app, poveži račun i generiraj **User Token**
4. U `.env.local` dodaj: `INSTAGRAM_ACCESS_TOKEN=tvoj_token`
5. Restart dev servera

Ako token nije postavljen ili API ne radi, možeš ručno dodati slike u `images` (lokalne putanje ili URL-ovi).

## Google Maps – lokacije
- `locations` – niz lokacija. Svaka lokacija ima:
  - `id` – jedinstveni ID (npr. `zagreb`, `split`)
  - `name` – naziv za prikaz (npr. „Zagreb“, „Split“)
  - `embedUrl` – embed URL s Google Mapsa

### Kako dobiti embed URL
1. Otvori Google Maps i pronađi lokaciju
2. Klikni „Dijeli“ → „Ugradi kartu“
3. Kopiraj URL iz `src="..."` atributa iframea

### Dodavanje nove lokacije
Dodaj novi objekt u niz `locations`:

```json
{
  "id": "split",
  "name": "Split",
  "embedUrl": "https://www.google.com/maps/embed?pb=..."
}
```

### Uklanjanje lokacije
Obriši cijeli objekt iz niza `locations`.

### Isključivanje widgeta
Postavi `enabled: false` za maps widget ili obriši sve lokacije iz `locations` (prazan niz).
