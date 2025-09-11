/* ====== INTEGRAZIONE API DMS ====== */

// Configurazione API DMS
const DMS_CONFIG = {
  // URL base della tua applicazione DMS (da configurare)
  apiBaseUrl: localStorage.getItem('dms_api_url') || 'http://localhost:8080/api',
  
  // Token di autenticazione (da configurare)
  authToken: localStorage.getItem('dms_auth_token') || '',
  
  // Intervallo di aggiornamento automatico (millisecondi)
  refreshInterval: 30000, // 30 secondi
  
  // Endpoint per i dati dei posteggi
  endpoints: {
    posteggi: '/posteggi',
    mercati: '/mercati',
    stati: '/stati'
  }
};

// Variabili globali per l'integrazione
let refreshTimer = null;
let isConnectedToDMS = false;

/* ====== FUNZIONI API ====== */

// Connessione alla tua applicazione DMS
async function connectToDMS(apiUrl, authToken) {
  try {
    // Salva configurazione
    DMS_CONFIG.apiBaseUrl = apiUrl;
    DMS_CONFIG.authToken = authToken;
    localStorage.setItem('dms_api_url', apiUrl);
    localStorage.setItem('dms_auth_token', authToken);
    
    // Test connessione
    const response = await fetch(`${apiUrl}/health`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      isConnectedToDMS = true;
      toast('Connesso alla tua applicazione DMS!', true);
      return true;
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    isConnectedToDMS = false;
    toast(`Errore connessione DMS: ${error.message}`);
    return false;
  }
}

// Carica dati dei posteggi dalla tua applicazione DMS
async function loadDataFromDMS() {
  if (!isConnectedToDMS) {
    throw new Error('Non connesso alla tua applicazione DMS');
  }
  
  try {
    const response = await fetch(`${DMS_CONFIG.apiBaseUrl}${DMS_CONFIG.endpoints.posteggi}`, {
      headers: {
        'Authorization': `Bearer ${DMS_CONFIG.authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    // Converte i dati DMS nel formato GeoJSON
    return convertDMSToGeoJSON(data);
    
  } catch (error) {
    console.error('Errore caricamento dati DMS:', error);
    throw error;
  }
}

// Converte i dati dalla tua applicazione DMS in formato GeoJSON
function convertDMSToGeoJSON(dmsData) {
  const features = [];
  
  // Assume che i tuoi dati abbiano questa struttura:
  // { posteggi: [...] } oppure direttamente [...]
  const posteggi = dmsData.posteggi || dmsData;
  
  posteggi.forEach(posteggio => {
    // Mappa i campi della tua applicazione DMS
    const feature = {
      type: "Feature",
      properties: {
        numero: posteggio.numero || posteggio.id,
        titolare: posteggio.titolare || posteggio.operatore || posteggio.nome_titolare,
        settore: posteggio.settore || posteggio.categoria || posteggio.merceologia,
        stato: normalizeStato(posteggio.stato),
        mercato: posteggio.mercato || posteggio.nome_mercato,
        superficie: posteggio.superficie || posteggio.dimensioni,
        piva: posteggio.piva || posteggio.partita_iva,
        periodo: posteggio.periodo || posteggio.frequenza,
        concessione: posteggio.concessione || posteggio.numero_concessione,
        scadenza: posteggio.scadenza || posteggio.data_scadenza,
        note: posteggio.note || posteggio.osservazioni,
        
        // Campi aggiuntivi dalla tua applicazione
        ...posteggio.extra_fields
      },
      geometry: {
        type: "Point",
        coordinates: [
          posteggio.longitudine || posteggio.lng || posteggio.lon,
          posteggio.latitudine || posteggio.lat
        ]
      }
    };
    
    features.push(feature);
  });
  
  return {
    type: "FeatureCollection",
    features: features,
    metadata: {
      source: "DMS",
      timestamp: new Date().toISOString(),
      total: features.length
    }
  };
}

// Normalizza i valori di stato dalla tua applicazione
function normalizeStato(stato) {
  if (!stato) return 'Sconosciuto';
  
  const statoLower = stato.toLowerCase();
  
  // Mappa i possibili valori dalla tua applicazione
  if (statoLower.includes('occup') || statoLower.includes('assegn')) return 'Occupato';
  if (statoLower.includes('liber') || statoLower.includes('dispon')) return 'Libero';
  if (statoLower.includes('riserv') || statoLower.includes('blocca')) return 'Riservato';
  if (statoLower.includes('temp') || statoLower.includes('provv')) return 'Temporaneo';
  
  return stato; // Mantieni il valore originale se non riconosciuto
}

// Aggiornamento automatico dei dati
function startAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
  
  refreshTimer = setInterval(async () => {
    if (isConnectedToDMS) {
      try {
        await loadMercato(); // Ricarica la mappa
        console.log('Dati aggiornati automaticamente dalla tua applicazione DMS');
      } catch (error) {
        console.error('Errore aggiornamento automatico:', error);
      }
    }
  }, DMS_CONFIG.refreshInterval);
}

function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}

// Invia aggiornamento di stato alla tua applicazione DMS
async function updatePosteggioStateToDMS(numeroPosteggio, nuovoStato) {
  if (!isConnectedToDMS) {
    throw new Error('Non connesso alla tua applicazione DMS');
  }
  
  try {
    const response = await fetch(`${DMS_CONFIG.apiBaseUrl}${DMS_CONFIG.endpoints.posteggi}/${numeroPosteggio}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${DMS_CONFIG.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        stato: nuovoStato,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Errore aggiornamento stato:', error);
    throw error;
  }
}

/* ====== INTERFACCIA CONFIGURAZIONE ====== */

// Mostra dialog di configurazione DMS
function showDMSConfigDialog() {
  const currentApiUrl = DMS_CONFIG.apiBaseUrl;
  const currentToken = DMS_CONFIG.authToken;
  
  const html = `
    <div style="font-family: system-ui; max-width: 400px;">
      <h3 style="margin: 0 0 16px 0; color: #333;">Configurazione DMS</h3>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; font-weight: bold;">URL API della tua applicazione DMS:</label>
        <input type="text" id="dmsApiUrl" value="${currentApiUrl}" 
               style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"
               placeholder="http://localhost:8080/api">
      </div>
      
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 4px; font-weight: bold;">Token di autenticazione:</label>
        <input type="password" id="dmsAuthToken" value="${currentToken}"
               style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"
               placeholder="Il tuo token di autenticazione">
      </div>
      
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 4px;">
          <input type="checkbox" id="autoRefresh" ${refreshTimer ? 'checked' : ''}> 
          Aggiornamento automatico ogni 30 secondi
        </label>
      </div>
      
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button onclick="testDMSConnection()" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px;">
          Test Connessione
        </button>
        <button onclick="saveDMSConfig()" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px;">
          Salva e Connetti
        </button>
      </div>
      
      <div style="margin-top: 16px; padding: 12px; background: #f8f9fa; border-radius: 4px; font-size: 14px;">
        <strong>Formato dati richiesto:</strong><br/>
        La tua applicazione DMS deve fornire i dati in formato JSON con i campi: numero, titolare, stato, categoria, latitudine, longitudine, mercato.
      </div>
    </div>
  `;
  
  const popup = L.popup({
    maxWidth: 450,
    className: 'dms-config-popup'
  })
  .setLatLng([42.7639, 11.1093])
  .setContent(html)
  .openOn(map);
}

// Test connessione DMS
async function testDMSConnection() {
  const apiUrl = document.getElementById('dmsApiUrl').value;
  const authToken = document.getElementById('dmsAuthToken').value;
  
  if (!apiUrl) {
    toast('Inserisci l\'URL della tua applicazione DMS');
    return;
  }
  
  const success = await connectToDMS(apiUrl, authToken);
  if (success) {
    toast('Connessione riuscita!', true);
  }
}

// Salva configurazione DMS
async function saveDMSConfig() {
  const apiUrl = document.getElementById('dmsApiUrl').value;
  const authToken = document.getElementById('dmsAuthToken').value;
  const autoRefresh = document.getElementById('autoRefresh').checked;
  
  if (!apiUrl) {
    toast('Inserisci l\'URL della tua applicazione DMS');
    return;
  }
  
  const success = await connectToDMS(apiUrl, authToken);
  if (success) {
    if (autoRefresh) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
    
    map.closePopup();
    toast('Configurazione salvata! Ora puoi caricare i dati dalla tua applicazione DMS.', true);
  }
}

// Esporta le funzioni per l'uso globale
window.connectToDMS = connectToDMS;
window.loadDataFromDMS = loadDataFromDMS;
window.showDMSConfigDialog = showDMSConfigDialog;
window.testDMSConnection = testDMSConnection;
window.saveDMSConfig = saveDMSConfig;
window.updatePosteggioStateToDMS = updatePosteggioStateToDMS;

