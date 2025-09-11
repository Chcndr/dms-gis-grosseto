# DMS • GIS Grosseto (Pages)

- URL: https://chcndr.github.io/dms-gis-grosseto/
- Il TOKEN GIS **non** è committato: l'utente lo incolla a runtime (localStorage).

## Uso
1) Click **Imposta token** e incolla il token fornito.
2) Seleziona il mercato e premi **Carica mappa**.
3) Clicca su posteggi/pin per dettaglio (ambulante/posteggio/categoria).

> Nota: l'host GIS deve abilitare **CORS** verso `https://chcndr.github.io`.

## Funzionalità

### Visualizzazione Mappa
- Mappa interattiva basata su Leaflet.js
- Layer WMS del Comune di Grosseto come sfondo
- Visualizzazione posteggi con marker colorati (verde = occupato, rosso = libero)

### Gestione Dati
- **Modalità Demo**: Usa dati simulati quando il token non è impostato o è "demo"
- **Modalità Produzione**: Tenta di connettersi al servizio WFS reale quando disponibile
- Fallback automatico ai dati simulati se il WFS non è accessibile

### Sicurezza
- Token gestito solo in localStorage del browser
- Nessun token committato nel repository
- Gestione sicura delle chiamate API

## Struttura Tecnica

### File Principali
- `index.html` - Pagina principale dell'applicazione
- `app.js` - Logica JavaScript per mappa e gestione dati
- `style.css` - Stili CSS con tema DMS
- `404.html` - Fallback per routing SPA
- `README.md` - Documentazione

### Configurazione
- **API_BASE**: Endpoint del servizio GIS di Grosseto
- **PROP**: Mappatura delle proprietà dei dati GeoJSON
- **DEMO_DATA**: Dati simulati per testing e demo

## Sviluppo Futuro

### Integrazione Dati Reali
Quando il servizio WFS sarà disponibile:
1. Aggiornare `API_BASE` con l'endpoint corretto
2. Modificare `PROP` per mappare le proprietà reali
3. Rimuovere `DEMO_DATA` e la logica di fallback

### Funzionalità Aggiuntive
- Filtri per categoria/stato posteggi
- Ricerca per numero posteggio
- Export dati in formato CSV/Excel
- Integrazione con sistema DMS principale

## Note Tecniche
- Compatibile con tutti i browser moderni
- Responsive design per desktop e mobile
- Performance ottimizzate con Leaflet.js
- Gestione errori robusta per chiamate API

