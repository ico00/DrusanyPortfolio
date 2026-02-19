# Blog widgeti – konfiguracija

Widgete bloga uređuješ u datoteci `blogWidgets.json`.

## Kategorije
- `enabled: true/false` – uključi/isključi widget
- `title` – naslov widgeta

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
