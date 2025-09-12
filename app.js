// =====================  DMS • GIS Grosseto (clone 1:1) - VERSIONE RETTANGOLI CORRETTI  =====================
let map, posteggiLayer, currentFeatures = [];
const TODAY = new Date().toISOString().slice(0,10);

// --- UTIL FUNCTIONS -------------------------------------------------------------

// converti punto [E,N] EPSG:3003 -> [lat, lon] WGS84 (ordine Leaflet)
function from3003toLatLng(E, N) {
  const [lon, lat] = proj4('EPSG:3003', 'WGS84', [E, N]);
  return L.latLng(lat, lon);
}

// metri -> gradi locali, con correzione cos(lat)
function meterOffsetsToDeg(latDeg, dx_m, dy_m) {
  const lat = latDeg * Math.PI / 180;
  const dLat = dy_m / 111320;                               // m per 1° lat
  const dLon = dx_m / (111320 * Math.cos(lat));             // m per 1° lon
  return [dLat, dLon];
}

// genera poligono rettangolo centrato su (lat,lon) con w,h (m) e rotazione° (0=est-ovest)
function makeRect(lat, lon, w_m, h_m, rotDeg=0) {
  const th = rotDeg * Math.PI / 180;
  const hw = w_m / 2, hh = h_m / 2;
  const corners = [
    [-hw, -hh], [ hw, -hh], [ hw,  hh], [ -hw,  hh]   // in metri, attorno all'origine
  ].map(([x, y]) => {
    // rotazione metrica
    const xr =  x*Math.cos(th) - y*Math.sin(th);
    const yr =  x*Math.sin(th) + y*Math.cos(th);
    const [dLat, dLon] = meterOffsetsToDeg(lat, xr, yr);
    return [lat + dLat, lon + dLon];
  });
  corners.push(corners[0]); // chiudi poligono
  return corners;
}

// --- RENDER FUNCTIONS -----------------------------------------------------------

// Esempio di feature: { E, N, larghezza_m, profondita_m, rotazione_deg, ... }
function renderPosteggio(feat) {
  const p = feat.properties;
  
  // 1) centro dal 3003
  const [E, N] = feat.geometry.coordinates; // coordinate EPSG:3003
  const center = from3003toLatLng(E, N);

  // 2) rettangolo in metri -> poligono Leaflet
  const W = Number(p.superficie_posteggio || 20) / 4; // stima larghezza da superficie
  const H = Number(p.superficie_posteggio || 20) / 5; // stima profondità da superficie
  const A = Number(p.rotazione_deg || p.angle || 0);

  const polyLatLngs = makeRect(center.lat, center.lng, W, H, A);

  // 3) stile in base allo stato
  const styleByStato = (stato) => {
    const S = (stato||'').toLowerCase();
    if (S.includes('occup')) return { color:'#E65454', fillColor:'#E65454', weight: 2, fillOpacity: 0.7 };   // rosso
    if (S.includes('riserv')) return { color:'#F2C94C', fillColor:'#F2C94C', weight: 2, fillOpacity: 0.7 }; // giallo
    return { color:'#2EB88A', fillColor:'#2EB88A', weight: 2, fillOpacity: 0.7 };                           // verde = libero
  };

  // 4) crea poligono
  const polygon = L.polygon(polyLatLngs, styleByStato(p.stato));

  // 5) popup
  const presKey = `presenza:${TODAY}:${p.id}`;
  const presente = localStorage.getItem(presKey) === '1';
  const html = `
    <div class="popup">
      <div class="h6" style="margin:0 0 6px 0;"><b>${p.nome_mer}</b> • #${p.numero} <small>(${p.codice_interno||''})</small></div>
      <div><b>Stato:</b> ${p.stato||'-'} &nbsp;|&nbsp; <b>Periodo:</b> ${p.periodo_esercizio||'-'}</div>
      <div><b>Superficie:</b> ${p.superficie_posteggio||'-'} m² &nbsp;|&nbsp; <b>Merceologia:</b> ${p.merceologia_riserva||'-'}</div>
      <hr style="border:none;border-top:1px solid #9AB8B3;margin:6px 0;">
      <div class="btn-row">
        <button class="btn-presenza" data-id="${p.id}" style="background:${presente?'#0FA3A3':'#072C2E'};border:1px solid #0FA3A3;color:#D5F0E6;padding:6px 10px;border-radius:8px;">
          ${presente ? '✅ Presenza spuntata' : 'Spunta presenza'}
        </button>
        <button class="btn-dettagli" data-id="${p.id}" style="margin-left:6px;border:1px solid #9AB8B3;color:#D5F0E6;background:#072C2E;padding:6px 10px;border-radius:8px;">
          Dettagli
        </button>
      </div>
    </div>
  `;
  
  polygon.bindPopup(html);
  
  // 6) hover effects
  polygon.on('mouseover', () => {
    polygon.setStyle({ weight: 3, fillOpacity: 0.9 });
  });
  polygon.on('mouseout', () => {
    polygon.setStyle({ weight: 2, fillOpacity: 0.7 });
  });

  return polygon;
}

// chiamata principale (dopo aver caricato il JSON "geo")
function renderTuttiIPosteggi(geo, map) {
  if (posteggiLayer) posteggiLayer.remove();
  
  posteggiLayer = L.layerGroup().addTo(map);
  
  geo.features.forEach(feat => {
    const polygon = renderPosteggio(feat);
    posteggiLayer.addLayer(polygon);
  });
  
  // Fit bounds
  const latlngs = geo.features.map(f => {
    const [E, N] = f.geometry.coordinates;
    const center = from3003toLatLng(E, N);
    return [center.lat, center.lng];
  });
  map.fitBounds(L.latLngBounds(latlngs), { padding:[20,20] });
  
  return posteggiLayer;
}

// --- MAIN FUNCTIONS -----------------------------------------------------------

function initMap() {
  map = L.map('map', { zoomControl: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
    attribution: '© OSM, © Comune di Grosseto' 
  }).addTo(map);
  loadPosteggiReali();
}

async function loadPosteggiReali() {
  // Path assoluto dal root della Pages (user/repo)
  const REPO_BASE = '/dms-gis-grosseto/';
  const DATA_URL  = REPO_BASE + 'assets/data/dati_reali_posteggi_grosseto.json';
  const BUST      = Date.now();

  try {
    const resp = await fetch(DATA_URL + '?v=' + BUST, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    });

    let geo;
    if (resp.ok) {
      geo = await resp.json();
    } else {
      // Fallback a raw.githubusercontent.com
      const raw = `https://raw.githubusercontent.com/Chcndr/dms-gis-grosseto/main/assets/data/dati_reali_posteggi_grosseto.json?nocache=${BUST}`;
      const r2  = await fetch(raw, { cache: 'no-store' });
      geo = await r2.json();
    }

    // Salva i dati per uso globale
    currentFeatures = geo.features;
    
    // Renderizza tutti i posteggi
    renderTuttiIPosteggi(geo, map);
    
    // Aggiorna statistiche
    updateStats();
    
    console.log(`✅ Caricati ${geo.features.length} posteggi con rettangoli corretti`);
    
  } catch (error) {
    console.error('❌ Errore caricamento dati:', error);
    alert('Errore nel caricamento dei dati dei posteggi');
  }
}

// --- EVENT HANDLERS -----------------------------------------------------------

function updateStats() {
  if (!currentFeatures) return;
  
  const totale = currentFeatures.length;
  const occupati = currentFeatures.filter(f => f.properties.stato?.toLowerCase().includes('occup')).length;
  const liberi = currentFeatures.filter(f => f.properties.stato?.toLowerCase().includes('liber')).length;
  const riservati = currentFeatures.filter(f => f.properties.stato?.toLowerCase().includes('riserv')).length;
  
  // Aggiorna sidebar se esiste
  const statsEl = document.querySelector('.stats-container');
  if (statsEl) {
    statsEl.innerHTML = `
      <h4>Statistiche Posteggi</h4>
      <div>Totale: <strong>${totale}</strong></div>
      <div>Liberi: <strong style="color:#2EB88A">${liberi}</strong></div>
      <div>Occupati: <strong style="color:#E65454">${occupati}</strong></div>
      <div>Riservati: <strong style="color:#F2C94C">${riservati}</strong></div>
      <div>Tasso occupazione: <strong>${Math.round(occupati/totale*100)}%</strong></div>
    `;
  }
}

// Event listeners per popup buttons
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('btn-presenza')) {
    const id = e.target.dataset.id;
    const presKey = `presenza:${TODAY}:${id}`;
    const presente = localStorage.getItem(presKey) === '1';
    
    if (presente) {
      localStorage.removeItem(presKey);
      e.target.textContent = 'Spunta presenza';
      e.target.style.background = '#072C2E';
    } else {
      localStorage.setItem(presKey, '1');
      e.target.textContent = '✅ Presenza spuntata';
      e.target.style.background = '#0FA3A3';
    }
  }
  
  if (e.target.classList.contains('btn-dettagli')) {
    const id = e.target.dataset.id;
    const feat = currentFeatures.find(f => f.properties.id == id);
    if (feat) {
      const p = feat.properties;
      alert(`DETTAGLI POSTEGGIO #${p.numero}
      
Mercato: ${p.nome_mer}
Codice: ${p.codice_interno}
Stato: ${p.stato}
Superficie: ${p.superficie_posteggio} m²
Merceologia: ${p.merceologia_riserva}
Periodo: ${p.periodo_esercizio}

Coordinate EPSG:3003: ${feat.geometry.coordinates.join(', ')}`);
    }
  }
});

// Export CSV
function exportCSV() {
  if (!currentFeatures) return;
  
  const headers = ['Numero', 'Mercato', 'Stato', 'Superficie', 'Merceologia', 'Presenza'];
  const rows = currentFeatures.map(f => {
    const p = f.properties;
    const presKey = `presenza:${TODAY}:${p.id}`;
    const presente = localStorage.getItem(presKey) === '1' ? 'SÌ' : 'NO';
    return [
      p.numero || '',
      p.nome_mer || '',
      p.stato || '',
      p.superficie_posteggio || '',
      p.merceologia_riserva || '',
      presente
    ];
  });
  
  const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `posteggi_grosseto_${TODAY}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// --- INITIALIZATION -----------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  initMap();
  
  // Event listeners per bottoni header
  document.getElementById('btnConfigDMS')?.addEventListener('click', () => {
    alert('Configurazione DMS - Funzionalità in sviluppo');
  });
  
  document.getElementById('btnStats')?.addEventListener('click', () => {
    updateStats();
    alert('Statistiche aggiornate!');
  });
  
  document.getElementById('btnExportCSV')?.addEventListener('click', exportCSV);
  
  console.log('🚀 DMS GIS Grosseto inizializzato con rettangoli corretti');
});

