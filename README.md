# Browserbasiertes Fahrgastinformationssystem (DB-orientiert)

Statische Vanilla-JS Web-App mit drei Ansichten:

- `/` Fahrgastanzeige im DB-orientierten 3-Bereichs-Layout
- `/driver` Fahrersteuerung für Route/Halt/Verspätung/Ansagen
- `/config` visueller Editor für `config.json`

## Start lokal

```bash
python3 -m http.server 8080
```

Dann öffnen:
- `http://localhost:8080/`
- `http://localhost:8080/driver`
- `http://localhost:8080/config`

## Datenmodell

- `config.json` enthält Linien, Routen, Halte und Ansage-Templates.
- Laufzeitzustand (`activeRouteId`, `activeStopIndex`, `delayMinutes`, `activeAnnouncement`) wird in `localStorage` gespeichert.

## Netlify

- Reines Static Hosting.
- `netlify.toml` mappt Pfade `/driver` und `/config` auf die HTML-Dateien.

## DB-API-Erweiterung

In `main.js` sind Kommentare für eine spätere Anbindung an DB Timetables/OpenData vorgesehen.
