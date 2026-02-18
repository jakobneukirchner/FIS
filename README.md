# Browserbasiertes Fahrgastinformationssystem (DB-orientiert)

Statische Vanilla-JS Web-App mit drei Ansichten über Query-Parameter:

- `/` Fahrgastanzeige im DB-orientierten 3-Bereichs-Layout
- `/?driver` Fahrersteuerung für Route/Halt/Verspätung/Ansagen
- `/?config` visueller Editor für `config.json`

## Start lokal

```bash
python3 -m http.server 8080
```

Dann öffnen:
- `http://localhost:8080/`
- `http://localhost:8080/?driver`
- `http://localhost:8080/?config`

## Datenmodell

- `config.json` enthält Linien, Routen, Halte und Ansage-Templates.
- Laufzeitzustand (`activeRouteId`, `activeStopIndex`, `delayMinutes`, `activeAnnouncement`) wird in `localStorage` gespeichert.

## Netlify

- Reines Static Hosting ohne spezielle Redirect-Logik.
- Die Ansichtswahl erfolgt per Query-Parameter auf `index.html`.

## DB-API-Erweiterung

In `main.js` sind Kommentare für eine spätere Anbindung an DB Timetables/OpenData vorgesehen.


## Mehr Einstellungen in der Fahreransicht

Die Fahreransicht bietet zusätzlich:
- Direktsprung auf einen beliebigen Halt
- Direkte Eingabe der Verspätung in Minuten
- Betriebseinstellungen: Auslastung, Servicehinweis, Simulationsintervall und Simulation an/aus
- Runtime-Reset für schnellen Demo-Neustart
