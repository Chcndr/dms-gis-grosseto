# DMS • GIS Grosseto (Pages)

- URL: https://chcndr.github.io/dms-gis-grosseto/
- **Integrazione completa con applicazioni DMS** tramite API REST

## Funzionalità Principali

### 🔗 Integrazione DMS
- **Connessione diretta** alla tua applicazione DMS
- **Aggiornamento in tempo reale** dei dati dei posteggi
- **API REST** per interoperabilità completa
- **Colori dinamici** basati sullo stato (verde=libero, rosso=occupato)

### 🗺️ Visualizzazione Mappa
- **180+ posteggi** distribuiti realisticamente nel centro storico di Grosseto
- **Mappa interattiva** basata su Leaflet.js con layer WMS del Comune
- **Popup informativi** con tutti i dettagli dei posteggi
- **Filtri dinamici** per mercato e stato

### 📊 Gestione Dati
- **Modalità DMS**: Dati in tempo reale dalla tua applicazione
- **Modalità Demo**: Dataset completo per testing
- **Statistiche avanzate**: Distribuzione per stato, mercato, categoria
- **Export/Import**: Compatibilità con formati standard

## Integrazione con la Tua Applicazione DMS

### 1. Configurazione Rapida

1. **Apri la mappa**: https://chcndr.github.io/dms-gis-grosseto/
2. **Clicca "Configura DMS"**
3. **Inserisci i dati**:
   - URL API della tua applicazione: `http://tua-app.com/api`
   - Token di autenticazione
4. **Test e connessione**
5. **Carica i tuoi dati!**

### 2. Formato Dati Richiesto

La tua applicazione DMS deve fornire i dati in questo formato:

```json
{
  "posteggi": [
    {
      "numero": "1",
      "titolare": "Mario Rossi",
      "stato": "occupato",
      "settore": "alimentare",
      "mercato": "Tripoli Giornaliero",
      "latitudine": 42.7639,
      "longitudine": 11.1093,
      "superficie": "15 mq",
      "piva": "12345678901"
    }
  ]
}
```

### 3. Endpoint Richiesti

- `GET /api/health` - Health check
- `GET /api/posteggi` - Elenco posteggi
- `PATCH /api/posteggi/{numero}` - Aggiornamento stato

**📖 Documentazione completa**: [API-INTEGRATION.md](./API-INTEGRATION.md)

## Stati e Colori

| Stato | Colore | Descrizione |
|-------|--------|-------------|
| **Libero** | 🟢 Verde | Posteggio disponibile |
| **Occupato** | 🔴 Rosso | Posteggio assegnato |
| **Riservato** | 🔵 Blu | Posteggio riservato |
| **Temporaneo** | 🟠 Arancione | Assegnazione temporanea |

## Uso

### Modalità DMS (Consigliata)
1. Configura la connessione alla tua applicazione DMS
2. I dati si aggiornano automaticamente ogni 30 secondi
3. Tutti i cambi di stato sono sincronizzati in tempo reale

### Modalità Demo
1. Clicca **"Imposta token"** e inserisci `demo`
2. Clicca **"Carica mappa"** per vedere 180 posteggi di esempio
3. Perfetto per testing e dimostrazioni

## Funzionalità Avanzate

### Filtri
- **Per mercato**: Tripoli Giornaliero, Esperanto Settimanale
- **Per stato**: Solo liberi, solo occupati, tutti

### Statistiche
- Distribuzione per stato con percentuali
- Conteggio per mercato
- Top categorie merceologiche

### Responsive Design
- **Desktop**: Interfaccia completa con tutti i controlli
- **Mobile**: Layout ottimizzato per dispositivi touch
- **Tablet**: Esperienza ibrida adattiva

## Struttura Tecnica

### File Principali
- `index.html` - Interfaccia utente
- `app.js` - Logica principale della mappa
- `api-integration.js` - **Modulo integrazione DMS**
- `style.css` - Stili responsive
- `posteggi_grosseto_completi.json` - Dataset demo
- `API-INTEGRATION.md` - **Documentazione integrazione**

### Tecnologie
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Mappe**: Leaflet.js con layer WMS
- **API**: REST con autenticazione Bearer token
- **Storage**: localStorage per configurazioni

## Sicurezza

### Token Management
- Token gestito solo in localStorage del browser
- Nessun token committato nel repository
- Supporto per scadenza e refresh automatico

### CORS e Autenticazione
- La tua applicazione DMS deve abilitare CORS per `https://chcndr.github.io`
- Autenticazione tramite Bearer token
- Rate limiting consigliato per proteggere le API

## Sviluppo e Personalizzazione

### Personalizzazione Colori
Modifica le variabili CSS in `style.css`:
```css
:root {
  --bg: #062c2d;        /* Sfondo principale */
  --fg: #eafff6;        /* Testo principale */
  --accent: #19d1b8;    /* Colore accent */
}
```

### Aggiunta Nuovi Stati
Modifica la funzione `pointToLayer` in `app.js`:
```javascript
case 'TuoNuovoStato':
  color = fillColor = '#colore'; // Tuo colore
  break;
```

### Campi Dati Aggiuntivi
Aggiungi campi nel popup modificando `onEachFeature` in `app.js`.

## Deployment

### GitHub Pages (Attuale)
- **URL**: https://chcndr.github.io/dms-gis-grosseto/
- **Aggiornamenti**: Automatici ad ogni commit su `main`
- **SSL**: Abilitato automaticamente

### Deployment Personalizzato
1. Scarica tutti i file del repository
2. Carica su qualsiasi web server
3. Configura HTTPS (consigliato)
4. Aggiorna le impostazioni CORS nella tua applicazione DMS

## Supporto e Manutenzione

### Aggiornamenti
- **Automatici**: GitHub Pages si aggiorna ad ogni modifica
- **Manuali**: Modifica i file e committa le modifiche
- **Versioning**: Usa i tag Git per le versioni stabili

### Monitoraggio
- **Uptime**: Monitoraggio automatico GitHub Pages
- **Errori**: Console browser per debugging
- **Performance**: Lighthouse per ottimizzazioni

### Backup
- **Codice**: Repository Git completo
- **Configurazioni**: Salvate in localStorage
- **Dati**: Gestiti dalla tua applicazione DMS

## Roadmap

### Prossime Funzionalità
- 🔄 **Sincronizzazione bidirezionale** (modifica stati dalla mappa)
- 📱 **App mobile** nativa
- 📊 **Dashboard analytics** avanzata
- 🔔 **Notifiche push** per cambi stato
- 🗂️ **Gestione documenti** allegati ai posteggi

### Integrazioni Future
- **Sistemi di pagamento** per concessioni
- **Calendario eventi** mercati
- **Gestione prenotazioni** online
- **Report automatici** per amministrazione

## Licenza

Progetto open source - Personalizzabile per le tue esigenze specifiche.

---

**🚀 Pronto per l'integrazione con la tua applicazione DMS!**

Per supporto tecnico, consulta la [documentazione API](./API-INTEGRATION.md) o i log della console del browser.

