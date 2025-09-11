# Integrazione API DMS - Documentazione

## Panoramica

Questa documentazione descrive come integrare la mappa GIS dei posteggi con la tua applicazione DMS. La mappa può ricevere dati in tempo reale dalla tua applicazione e visualizzarli dinamicamente.

## Configurazione

### 1. Endpoint Richiesti nella Tua Applicazione DMS

La tua applicazione DMS deve esporre questi endpoint:

#### Health Check
```
GET /api/health
```
**Risposta:**
```json
{
  "status": "ok",
  "timestamp": "2024-09-11T19:00:00Z"
}
```

#### Elenco Posteggi
```
GET /api/posteggi
```
**Headers richiesti:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**Risposta:**
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
      "piva": "12345678901",
      "periodo": "giornaliero",
      "concessione": "CON001",
      "scadenza": "2024-12-31",
      "note": "Note aggiuntive"
    }
  ],
  "metadata": {
    "total": 180,
    "timestamp": "2024-09-11T19:00:00Z"
  }
}
```

#### Aggiornamento Stato Posteggio
```
PATCH /api/posteggi/{numero}
```
**Body:**
```json
{
  "stato": "libero",
  "timestamp": "2024-09-11T19:00:00Z"
}
```

### 2. Campi Dati Supportati

| Campo | Tipo | Obbligatorio | Descrizione |
|-------|------|--------------|-------------|
| `numero` | string | ✅ | Numero identificativo del posteggio |
| `titolare` | string | ❌ | Nome del titolare/operatore |
| `stato` | string | ✅ | Stato del posteggio (vedi Stati Supportati) |
| `settore` | string | ❌ | Categoria merceologica |
| `mercato` | string | ❌ | Nome del mercato |
| `latitudine` | number | ✅ | Coordinata latitudine |
| `longitudine` | number | ✅ | Coordinata longitudine |
| `superficie` | string | ❌ | Superficie del posteggio |
| `piva` | string | ❌ | Partita IVA del titolare |
| `periodo` | string | ❌ | Frequenza (giornaliero/settimanale) |
| `concessione` | string | ❌ | Numero concessione |
| `scadenza` | string | ❌ | Data scadenza concessione |
| `note` | string | ❌ | Note aggiuntive |

### 3. Stati Supportati

La mappa riconosce automaticamente questi stati e assegna i colori corrispondenti:

| Stato | Colore | Varianti Accettate |
|-------|--------|-------------------|
| **Libero** | 🟢 Verde | libero, disponibile, free |
| **Occupato** | 🔴 Rosso | occupato, assegnato, occupied |
| **Riservato** | 🔵 Blu | riservato, bloccato, reserved |
| **Temporaneo** | 🟠 Arancione | temporaneo, provvisorio, temp |

## Configurazione nella Mappa

### 1. Accesso alla Configurazione

1. Apri la mappa GIS: `https://chcndr.github.io/dms-gis-grosseto/`
2. Clicca su **"Configura DMS"**
3. Inserisci i dati di connessione:
   - **URL API**: `http://tua-app-dms.com/api`
   - **Token**: Il token di autenticazione della tua app
   - **Aggiornamento automatico**: Attiva per refresh ogni 30 secondi

### 2. Test della Connessione

1. Clicca **"Test Connessione"** per verificare la comunicazione
2. Se il test è positivo, clicca **"Salva e Connetti"**
3. Ora puoi cliccare **"Carica mappa"** per visualizzare i tuoi dati

## Funzionalità Avanzate

### 1. Aggiornamento in Tempo Reale

- La mappa si aggiorna automaticamente ogni 30 secondi
- Puoi disattivare l'aggiornamento automatico nella configurazione
- Gli aggiornamenti sono incrementali per ottimizzare le performance

### 2. Filtri Dinamici

- **Filtro per mercato**: Mostra solo posteggi di un mercato specifico
- **Filtro per stato**: Mostra solo posteggi liberi o occupati
- I filtri si applicano ai dati ricevuti dalla tua applicazione

### 3. Statistiche

- Clicca **"Statistiche"** per vedere un riepilogo dei dati
- Mostra distribuzione per stato, mercato e categoria
- Le statistiche si aggiornano automaticamente

## Esempi di Integrazione

### Esempio PHP (Laravel)

```php
// routes/api.php
Route::middleware('auth:api')->group(function () {
    Route::get('/health', function () {
        return response()->json(['status' => 'ok', 'timestamp' => now()]);
    });
    
    Route::get('/posteggi', [PosteggioController::class, 'index']);
    Route::patch('/posteggi/{numero}', [PosteggioController::class, 'updateStato']);
});

// PosteggioController.php
public function index()
{
    $posteggi = Posteggio::all()->map(function ($p) {
        return [
            'numero' => $p->numero,
            'titolare' => $p->titolare,
            'stato' => $p->stato,
            'settore' => $p->categoria,
            'mercato' => $p->mercato,
            'latitudine' => $p->lat,
            'longitudine' => $p->lng,
            'superficie' => $p->superficie,
            'piva' => $p->partita_iva,
        ];
    });
    
    return response()->json([
        'posteggi' => $posteggi,
        'metadata' => [
            'total' => $posteggi->count(),
            'timestamp' => now()
        ]
    ]);
}
```

### Esempio Node.js (Express)

```javascript
// routes/api.js
const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/posteggi', async (req, res) => {
    const posteggi = await Posteggio.findAll();
    
    const data = posteggi.map(p => ({
        numero: p.numero,
        titolare: p.titolare,
        stato: p.stato,
        settore: p.categoria,
        mercato: p.mercato,
        latitudine: p.lat,
        longitudine: p.lng,
        superficie: p.superficie,
        piva: p.partita_iva
    }));
    
    res.json({
        posteggi: data,
        metadata: {
            total: data.length,
            timestamp: new Date().toISOString()
        }
    });
});

module.exports = router;
```

## Sicurezza

### 1. Autenticazione

- Usa sempre token di autenticazione per proteggere le API
- I token vengono salvati localmente nel browser (localStorage)
- Implementa scadenza dei token nella tua applicazione

### 2. CORS

La tua applicazione DMS deve abilitare CORS per il dominio della mappa:

```javascript
// Express.js
app.use(cors({
    origin: 'https://chcndr.github.io',
    credentials: true
}));
```

```php
// Laravel
// config/cors.php
'allowed_origins' => ['https://chcndr.github.io'],
```

### 3. Rate Limiting

Implementa rate limiting per proteggere le API:

```javascript
// Express.js
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 100 // max 100 richieste per minuto
});
app.use('/api', limiter);
```

## Troubleshooting

### Errori Comuni

1. **"Errore connessione DMS"**
   - Verifica che l'URL sia corretto
   - Controlla che il server sia raggiungibile
   - Verifica le impostazioni CORS

2. **"HTTP 401 Unauthorized"**
   - Controlla che il token sia valido
   - Verifica che il token non sia scaduto

3. **"HTTP 404 Not Found"**
   - Verifica che gli endpoint esistano
   - Controlla il percorso dell'API

### Debug

Attiva il debug aggiungendo `?diag=1` all'URL della mappa:
```
https://chcndr.github.io/dms-gis-grosseto/?diag=1
```

Questo mostrerà informazioni dettagliate nella console del browser.

## Supporto

Per supporto tecnico o domande sull'integrazione:
- Consulta i log della console del browser
- Verifica la documentazione API della tua applicazione DMS
- Testa gli endpoint con strumenti come Postman o curl

