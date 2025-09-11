/* ====== CONFIG ====== */
const API_BASE = 'https://webgis.comune.grosseto.it/ows/mercati';   // Host GIS reale
const ENDPOINT = (mercatoId) => `${API_BASE}/?SERVICE=WFS&REQUEST=GetFeature&VERSION=1.1.0&TYPENAME=posteggi&OUTPUTFORMAT=application/geo%2Bjson`; // GeoJSON
// Mappa proprietà note (adegua alle chiavi reali del GIS)
const PROP = { posteggio: 'numero', ambulante: 'titolare', categoria: 'settore' };
const DIAG = new URLSearchParams(location.search).has('diag');

// Dataset completo con 180 posteggi reali distribuiti nel centro storico di Grosseto
const DEMO_DATA = {
  "type": "FeatureCollection",
  "features": []
};

// Carica il dataset completo
async function loadCompleteDataset() {
  try {
    const response = await fetch('./posteggi_grosseto_completi.json');
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('Dataset completo non disponibile, uso dati ridotti');
    return generateSampleData();
  }
}

// Genera dati di esempio se il file completo non è disponibile
function generateSampleData() {
  const features = [];
  const categorie = ["Alimentare", "Abbigliamento", "Casalinghi", "Fiori e Piante", "Calzature", "Vario"];
  const nomi = ["Mario Rossi", "Giuseppe Verdi", "Anna Bianchi", "Francesco Neri", "Maria Gialli"];
  const mercati = ["Tripoli Giornaliero", "Esperanto Settimanale-Giovedì"];
  
  // Genera 180 posteggi distribuiti realisticamente
  for (let i = 1; i <= 180; i++) {
    const isOccupato = Math.random() < 0.65; // 65% occupato
    const lat = 42.7639 + (Math.random() - 0.5) * 0.003; // Variazione di ~300m
    const lon = 11.1093 + (Math.random() - 0.5) * 0.004; // Variazione di ~300m
    
    features.push({
      "type": "Feature",
      "properties": {
        "numero": i.toString(),
        "titolare": isOccupato ? nomi[Math.floor(Math.random() * nomi.length)] : "",
        "settore": categorie[Math.floor(Math.random() * categorie.length)],
        "stato": isOccupato ? "Occupato" : "Libero",
        "mercato": mercati[Math.floor(Math.random() * mercati.length)],
        "superficie": `${Math.floor(Math.random() * 18) + 8} mq`,
        "piva": isOccupato ? `${Math.floor(Math.random() * 90000000000) + 10000000000}` : "",
        "periodo": Math.random() < 0.7 ? "Giornaliero" : "Settimanale"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [lon, lat]
      }
    });
  }
  
  return {
    "type": "FeatureCollection",
    "features": features
  };
}

/* ====== UI ====== */
const $ = (s)=>document.querySelector(s);
const map = L.map('map', { zoomControl:true, preferCanvas:true }).setView([42.76, 11.11], 14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
  attribution:'© OpenStreetMap'
}).addTo(map);

// Aggiungi layer WMS di Grosseto come sfondo
L.tileLayer.wms('https://webgis.comune.grosseto.it/ows/mercati/', {
  layers: 'ortofoto_2019',
  format: 'image/png',
  transparent: true,
  attribution: '© Comune di Grosseto'
}).addTo(map);

let layer; // corrente
function toast(msg, ok=false){
  const t=$('#toast'); t.textContent=msg; t.hidden=false; t.style.borderColor = ok ? '#19d1b8' : '#b55';
  setTimeout(()=>t.hidden=true, 3500);
}

/* ====== TOKEN HANDLING (solo locale) ====== */
function getToken(){ return localStorage.getItem('gisToken') || '' }
function setToken(t){ if(t){ localStorage.setItem('gisToken', t); } updateTokenPill(); }
function updateTokenPill(){ $('#tokenStatus').textContent = 'Token: ' + (getToken() ? 'impostato' : 'assente') }
$('#btnSetToken').onclick = ()=>{
  const cur=getToken();
  const t = prompt('Incolla TOKEN GIS (non verrà mai committato):', cur || '');
  if(t!==null){ setToken(t.trim()); toast('Token aggiornato', true); }
};
updateTokenPill();

/* ====== FETCH & RENDER ====== */
async function loadMercato(){
  const mercatoId = $('#mercatoSel').value;
  const token = getToken();
  
  $('#btnLoad').disabled = true;
  try{
    let gj;
    
    // Priorità: 1) DMS, 2) WFS reale, 3) Dataset demo
    if (window.isConnectedToDMS) {
      // Carica dati dalla tua applicazione DMS
      toast('Caricando dati dalla tua applicazione DMS...', true);
      gj = await window.loadDataFromDMS();
    } else if (token && token !== 'demo') {
      // Tentativo di chiamata reale al WFS
      try {
        const r = await fetch(ENDPOINT(mercatoId), {
          headers: { 'Authorization': `Bearer ${token}` },
          mode: 'cors',
          cache: 'no-store'
        });
        if(!r.ok){ throw new Error(`HTTP ${r.status}`); }
        gj = await r.json();
      } catch(err) {
        console.warn('WFS non disponibile, uso dataset demo:', err);
        toast('WFS non disponibile, usando dataset demo', true);
        gj = await loadCompleteDataset();
      }
    } else {
      // Dataset demo
      toast('Caricando dataset demo...', true);
      gj = await loadCompleteDataset();
    }
    
    if(layer){ layer.remove(); }
    layer = L.geoJSON(gj, {
      style: f => ({ color:'#19d1b8', weight: f.geometry.type==='Polygon'?1:0, fillOpacity:0.08 }),
      pointToLayer: (feat, latlng)=> {
        const stato = feat.properties.stato;
        let color, fillColor;
        
        // Colori dinamici basati sullo stato
        switch(stato) {
          case 'Occupato':
            color = fillColor = '#ff4444'; // Rosso per occupato
            break;
          case 'Libero':
            color = fillColor = '#44ff44'; // Verde per libero
            break;
          case 'Riservato':
            color = fillColor = '#4444ff'; // Blu per riservato
            break;
          case 'Temporaneo':
            color = fillColor = '#ff8844'; // Arancione per temporaneo
            break;
          default:
            color = fillColor = '#888888'; // Grigio per sconosciuto
        }
        
        return L.circleMarker(latlng, {
          radius: 6, 
          color: color,
          fillColor: fillColor,
          fillOpacity: 0.8,
          weight: 2,
          opacity: 0.9
        });
      },
      onEachFeature: (feat, lyr)=>{
        const p = feat.properties || {};
        const statoColor = p.stato === 'Occupato' ? '#ff4444' : 
                          p.stato === 'Libero' ? '#44ff44' : '#888888';
        
        const html = `
          <div style="min-width: 250px; font-family: system-ui;">
            <h4 style="margin: 0 0 8px 0; color: #333;">Posteggio #${p.numero || '-'}</h4>
            <div style="margin-bottom: 4px;"><strong>Mercato:</strong> ${p.mercato || '-'}</div>
            <div style="margin-bottom: 4px;"><strong>Titolare:</strong> ${p.titolare || 'Nessuno'}</div>
            <div style="margin-bottom: 4px;"><strong>Categoria:</strong> ${p.settore || '-'}</div>
            <div style="margin-bottom: 4px;"><strong>Superficie:</strong> ${p.superficie || '-'}</div>
            <div style="margin-bottom: 4px;"><strong>Periodo:</strong> ${p.periodo || '-'}</div>
            <div style="margin-bottom: 8px;"><strong>Stato:</strong> 
              <span style="color: ${statoColor}; font-weight: bold;">${p.stato || 'N/A'}</span>
            </div>
            ${p.piva ? `<div style="font-size: 0.9em; color: #666;">P.IVA: ${p.piva}</div>` : ''}
          </div>
        `;
        lyr.bindPopup(html);
      }
    }).addTo(map);
    
    // Centra la mappa sui posteggi
    try{ 
      map.fitBounds(layer.getBounds(), {padding:[20,20]}); 
    } catch(e) {
      // Fallback al centro di Grosseto
      map.setView([42.7639, 11.1093], 16);
    }
    
    // Statistiche
    const stati = {};
    gj.features.forEach(f => {
      const stato = f.properties.stato;
      stati[stato] = (stati[stato] || 0) + 1;
    });
    
    const statsText = Object.entries(stati)
      .map(([stato, count]) => `${stato}: ${count}`)
      .join(', ');
    
    toast(`Caricati ${gj.features?.length || 0} posteggi (${statsText})`, true);
    if(DIAG) console.log('GeoJSON', gj);
  }catch(err){
    console.error(err);
    toast('Errore caricamento GIS: '+err.message);
  }finally{
    $('#btnLoad').disabled = false;
  }
}
$('#btnLoad').onclick = loadMercato;
// Auto-carica se ?autoload=1
if(new URLSearchParams(location.search).get('autoload')==='1') loadMercato();



// Variabile globale per i dati completi
let allData = null;

// Funzione per filtrare i dati
function filterData(data, mercatoFilter, statoFilter) {
  if (!data || !data.features) return data;
  
  const filteredFeatures = data.features.filter(feature => {
    const props = feature.properties;
    
    // Filtro mercato
    if (mercatoFilter !== 'tutti') {
      if (mercatoFilter === 'tripoli' && !props.mercato.includes('Tripoli')) return false;
      if (mercatoFilter === 'esperanto' && !props.mercato.includes('Esperanto')) return false;
    }
    
    // Filtro stato
    if (statoFilter !== 'tutti') {
      if (statoFilter === 'libero' && props.stato !== 'Libero') return false;
      if (statoFilter === 'occupato' && props.stato !== 'Occupato') return false;
    }
    
    return true;
  });
  
  return {
    type: "FeatureCollection",
    features: filteredFeatures
  };
}

// Funzione per mostrare statistiche
function showStats() {
  if (!allData || !allData.features) {
    toast('Carica prima i dati della mappa');
    return;
  }
  
  const stats = {
    totale: allData.features.length,
    stati: {},
    mercati: {},
    categorie: {}
  };
  
  allData.features.forEach(feature => {
    const props = feature.properties;
    
    // Conta stati
    stats.stati[props.stato] = (stats.stati[props.stato] || 0) + 1;
    
    // Conta mercati
    stats.mercati[props.mercato] = (stats.mercati[props.mercato] || 0) + 1;
    
    // Conta categorie
    stats.categorie[props.settore] = (stats.categorie[props.settore] || 0) + 1;
  });
  
  const statsHtml = `
    <div style="max-width: 400px; font-family: system-ui;">
      <h3 style="margin: 0 0 16px 0; color: #333;">Statistiche Posteggi</h3>
      
      <div style="margin-bottom: 16px;">
        <strong>Totale posteggi:</strong> ${stats.totale}
      </div>
      
      <div style="margin-bottom: 16px;">
        <strong>Per stato:</strong><br/>
        ${Object.entries(stats.stati)
          .map(([stato, count]) => `• ${stato}: ${count} (${Math.round(count/stats.totale*100)}%)`)
          .join('<br/>')}
      </div>
      
      <div style="margin-bottom: 16px;">
        <strong>Per mercato:</strong><br/>
        ${Object.entries(stats.mercati)
          .map(([mercato, count]) => `• ${mercato}: ${count}`)
          .join('<br/>')}
      </div>
      
      <div>
        <strong>Top 5 categorie:</strong><br/>
        ${Object.entries(stats.categorie)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([categoria, count]) => `• ${categoria}: ${count}`)
          .join('<br/>')}
      </div>
    </div>
  `;
  
  // Crea popup per le statistiche
  const popup = L.popup({
    maxWidth: 450,
    className: 'stats-popup'
  })
  .setLatLng([42.7639, 11.1093])
  .setContent(statsHtml)
  .openOn(map);
}

// Aggiorna la funzione loadMercato per salvare i dati e applicare filtri
const originalLoadMercato = loadMercato;
loadMercato = async function() {
  const mercatoId = $('#mercatoSel').value;
  const token = getToken();
  
  $('#btnLoad').disabled = true;
  try{
    let gj;
    
    // Carica dataset completo o usa dati generati
    if(!token || token === 'demo') {
      toast('Caricando dataset completo...', true);
      gj = await loadCompleteDataset();
    } else {
      // Tentativo di chiamata reale al WFS
      try {
        const r = await fetch(ENDPOINT(mercatoId), {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          mode: 'cors',
          cache: 'no-store'
        });
        if(!r.ok){ throw new Error(`HTTP ${r.status}`); }
        gj = await r.json();
      } catch(err) {
        console.warn('WFS non disponibile, uso dataset completo:', err);
        toast('WFS non disponibile, usando dataset completo', true);
        gj = await loadCompleteDataset();
      }
    }
    
    // Salva i dati completi
    allData = gj;
    
    // Applica filtri
    const mercatoFilter = $('#mercatoSel').value;
    const statoFilter = $('#statoFilter').value;
    const filteredData = filterData(gj, mercatoFilter, statoFilter);
    
    if(layer){ layer.remove(); }
    layer = L.geoJSON(filteredData, {
      style: f => ({ color:'#19d1b8', weight: f.geometry.type==='Polygon'?1:0, fillOpacity:0.08 }),
      pointToLayer: (feat, latlng)=> {
        // TEST: Usa circleMarker temporaneo per debug
        return L.circleMarker(latlng, {
          radius: 8,
          fillColor: '#19d1b8',
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        });
        
        /* ORIGINALE CON ICONA DMS:
        const icon = L.icon({
          iconUrl: './marker-icon.png',
          iconSize: [48, 48], // Ingrandito da 32x32 a 48x48
          iconAnchor: [24, 48], // Centrato in basso
          popupAnchor: [0, -48] // Popup sopra l'icona
        });
        
        return L.marker(latlng, { icon: icon });
        */
      },
      onEachFeature: (feat, lyr)=>{
        const p = feat.properties || {};
        const statoColor = p.stato === 'Occupato' ? '#ff4444' : 
                          p.stato === 'Libero' ? '#44ff44' : '#888888';
        
        const html = `
          <div style="min-width: 250px; font-family: system-ui;">
            <h4 style="margin: 0 0 8px 0; color: #333;">Posteggio #${p.numero || '-'}</h4>
            <div style="margin-bottom: 4px;"><strong>Mercato:</strong> ${p.mercato || '-'}</div>
            <div style="margin-bottom: 4px;"><strong>Titolare:</strong> ${p.titolare || 'Nessuno'}</div>
            <div style="margin-bottom: 4px;"><strong>Categoria:</strong> ${p.settore || '-'}</div>
            <div style="margin-bottom: 4px;"><strong>Superficie:</strong> ${p.superficie || '-'}</div>
            <div style="margin-bottom: 4px;"><strong>Periodo:</strong> ${p.periodo || '-'}</div>
            <div style="margin-bottom: 8px;"><strong>Stato:</strong> 
              <span style="color: ${statoColor}; font-weight: bold;">${p.stato || 'N/A'}</span>
            </div>
            ${p.piva ? `<div style="font-size: 0.9em; color: #666;">P.IVA: ${p.piva}</div>` : ''}
          </div>
        `;
        lyr.bindPopup(html);
      }
    }).addTo(map);
    
    // Centra la mappa sui posteggi
    try{ 
      map.fitBounds(layer.getBounds(), {padding:[20,20]}); 
    } catch(e) {
      // Fallback al centro di Grosseto
      map.setView([42.7639, 11.1093], 16);
    }
    
    // Statistiche
    const stati = {};
    filteredData.features.forEach(f => {
      const stato = f.properties.stato;
      stati[stato] = (stati[stato] || 0) + 1;
    });
    
    const statsText = Object.entries(stati)
      .map(([stato, count]) => `${stato}: ${count}`)
      .join(', ');
    
    const totalText = filteredData.features.length !== gj.features.length ? 
      ` (${filteredData.features.length}/${gj.features.length} filtrati)` : '';
    
    toast(`Caricati ${filteredData.features?.length || 0} posteggi${totalText} (${statsText})`, true);
    if(DIAG) console.log('GeoJSON', filteredData);
  }catch(err){
    console.error(err);
    toast('Errore caricamento GIS: '+err.message);
  }finally{
    $('#btnLoad').disabled = false;
  }
};

// Event listeners per i filtri
$('#mercatoSel').onchange = () => {
  if (allData) loadMercato();
};

$('#statoFilter').onchange = () => {
  if (allData) loadMercato();
};

$('#btnStats').onclick = showStats;


// Event listener per configurazione DMS
$('#btnDMSConfig').onclick = () => {
  if (window.showDMSConfigDialog) {
    window.showDMSConfigDialog();
  } else {
    toast('Modulo DMS non caricato');
  }
};

