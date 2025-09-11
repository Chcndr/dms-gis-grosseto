/* ====== CONFIG ====== */
const API_BASE = 'https://webgis.comune.grosseto.it/ows/mercati';   // Host GIS reale
const ENDPOINT = (mercatoId) => `${API_BASE}/?SERVICE=WFS&REQUEST=GetFeature&VERSION=1.1.0&TYPENAME=posteggi&OUTPUTFORMAT=application/geo%2Bjson`; // GeoJSON
// Mappa proprietà note (adegua alle chiavi reali del GIS)
const PROP = { posteggio: 'numero', ambulante: 'titolare', categoria: 'settore' };
const DIAG = new URLSearchParams(location.search).has('diag');

// Dati simulati per demo (da rimuovere quando WFS sarà disponibile)
const DEMO_DATA = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "numero": "1",
        "titolare": "Mario Rossi",
        "settore": "Alimentare",
        "stato": "Occupato",
        "mercato": "Grosseto Centrale"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.1143, 42.7606]
      }
    },
    {
      "type": "Feature", 
      "properties": {
        "numero": "2",
        "titolare": "",
        "settore": "Abbigliamento",
        "stato": "Libero",
        "mercato": "Grosseto Centrale"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.1150, 42.7610]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "3", 
        "titolare": "Giuseppe Verdi",
        "settore": "Casalinghi",
        "stato": "Occupato",
        "mercato": "Grosseto Centrale"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.1140, 42.7615]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "4",
        "titolare": "",
        "settore": "Vario", 
        "stato": "Libero",
        "mercato": "Grosseto Centrale"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.1155, 42.7600]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "5",
        "titolare": "Anna Bianchi",
        "settore": "Fiori e Piante",
        "stato": "Occupato", 
        "mercato": "Grosseto Centrale"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.1135, 42.7608]
      }
    }
  ]
};

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
    
    // Per ora usa dati simulati (rimuovere quando WFS sarà disponibile)
    if(!token || token === 'demo') {
      toast('Usando dati simulati (WFS non disponibile)', true);
      gj = DEMO_DATA;
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
        console.warn('WFS non disponibile, uso dati simulati:', err);
        toast('WFS non disponibile, usando dati simulati', true);
        gj = DEMO_DATA;
      }
    }
    
    if(layer){ layer.remove(); }
    layer = L.geoJSON(gj, {
      style: f => ({ color:'#19d1b8', weight: f.geometry.type==='Polygon'?1:0, fillOpacity:0.08 }),
      pointToLayer: (feat, latlng)=> {
        const isOccupato = feat.properties.stato === 'Occupato';
        return L.circleMarker(latlng, {
          radius: 8, 
          color: isOccupato ? '#19d1b8' : '#ff6b6b',
          fillColor: isOccupato ? '#19d1b8' : '#ff6b6b',
          fillOpacity: 0.7,
          weight: 2
        });
      },
      onEachFeature: (feat, lyr)=>{
        const p = feat.properties || {};
        const html = `
          <div style="min-width: 200px;">
            <strong>Posteggio:</strong> ${p[PROP.posteggio] ?? '-'}<br/>
            <strong>Ambulante:</strong> ${p[PROP.ambulante] || 'Libero'}<br/>
            <strong>Categoria:</strong> ${p[PROP.categoria] ?? '-'}<br/>
            <strong>Stato:</strong> <span style="color: ${p.stato === 'Occupato' ? '#19d1b8' : '#ff6b6b'}">${p.stato || 'N/A'}</span>
          </div>
        `;
        lyr.bindPopup(html);
      }
    }).addTo(map);
    try{ map.fitBounds(layer.getBounds(), {padding:[20,20]}); }catch{}
    toast(`Caricati ${gj.features?.length || 0} posteggi`, true);
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

