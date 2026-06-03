# Stickelberger Projektmanagement GmbH — Website

Moderne, mehrseitige Website für die **Stickelberger Projektmanagement GmbH** (Bau-Projektmanagement, Planung & Örtliche Bauaufsicht, Mödling).

**Live-Vorschau:** https://juhasz2aron22-prog.github.io/stickelberger-web/

## Seiten

- `index.html` — Startseite (Hero, Leistungen, Referenzen, Scroll-Bild)
- `ueber-uns.html` — Über uns / Werte / Geschichte
- `leistungen.html` — Planung · Örtliche Bauaufsicht · Projektsteuerung
- `referenzen.html` — Projektgalerien mit Lightbox + Kategorie-Filter
- `kontakt.html` — Kontakt, Formular, Anfahrt
- `impressum.html` · `datenschutz.html` — Rechtstexte (ECG/MedienG, DSGVO)
- `404.html` — Fehlerseite

## Technik

Reine statische Website — **kein Build-Schritt, kein Framework nötig**.

- HTML + CSS (`css/`) + Vanilla JS (`js/`)
- Animationen: GSAP + Lenis (sanftes Scrollen); Bilder-Lightbox selbst gebaut
- Schriften **selbst gehostet** (`assets/fonts/`) — keine Google-Fonts-Aufrufe (DSGVO-freundlich)
- Bilder unter `assets/` (optimiert) und `assets/projects/` (Galerien)
- SEO: JSON-LD, Open Graph, `sitemap.xml`, `robots.txt`, Canonical-Tags

## Lokal ansehen

Einfach `index.html` im Browser öffnen — oder ein kleiner lokaler Server:

```bash
npx serve .
```

## Offene Punkte vor dem Live-Gang

- **Datenschutz:** Name/Anschrift des konkreten Hosting-Providers ergänzen.
- **Kontaktformular:** öffnet derzeit das E-Mail-Programm (mailto); für direkten Versand ist ein Formular-Backend nötig.
