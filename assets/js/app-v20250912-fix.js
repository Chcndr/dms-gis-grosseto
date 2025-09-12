// ======================= DMS • GIS Grosseto (clone 1:1) - VERSIONE RETTANGOLI COMPATTI =======================
let map, posteggiLayer, currentFeatures = [];
const TODAY = new Date().toISOString().slice(0,10);

/* ======= PROIEZIONI ======= */
proj4.defs('EPSG:3003',
  '+proj=tmerc +lat_0=0 +lon_0=9 +k=0.9996 +x_0=1500000 +y_0=0 +ellps=intl +units=m +no_defs');

const P3003_to_WGS84 = (xy) => {
  const [lon, lat] = proj4('EPSG:3003','WGS84',[xy[0], xy[1]]); // x=easting, y=northing
  return [lat, lon]; // Leaflet usa [lat, lon]
};

/* ======= UTIL ======= */
// PCA 2D "povera" per stimare l'angolo di una fila (per mercato)
function stimaAngoloGruppo(pointsXY) {
  // centra i punti
  const n = pointsXY.length;
  if (n < 2) return 0; // fallback
  const meanX = pointsXY.reduce((s,p)=>s+p[0],0)/n;
  const meanY = pointsXY.reduce((s,p)=>s+p[1],0)/n;
  let Sxx=0,Syy=0,Sxy=0;
  for (const [x,y] of pointsXY){
    const dx=x-meanX, dy=y-meanY;
    Sxx+=dx*dx; Syy+=dy*dy; Sxy+=dx*dy;
  }
  // primo autovettore della matrice di covarianza
  const theta = 0.5*Math.atan2(2*Sxy, (Sxx - Syy)); // rad
  return theta; // in radianti
}

// mappa area → dimensioni tipiche (metri). Personalizzabile.
function dimsDaAreaMq(a){
  const A = +a || 20; // default 20 m²
  if (A<=12) return {w:3, d:4};      // 3x4
  if (A<=15) return {w:3, d:5};      // 3x5
  if (A<=20) return {w:4, d:5};      // 4x5
  if (A<=24) return {w:4, d:6};      // 4x6
  if (A<=30) return {w:5, d:6};      // 5x6
  return {w:4, d:8};                 // fallback 4x8
}

// calcola 4 vertici del rettangolo (EPSG:3003) centrato in (x,y)
function rettangoloXY(x, y, w, d, thetaRad){
  const hw=w/2, hd=d/2;
  // vertici locali (in metri) prima della rotazione
  const corners = [
    [-hw, -hd], [ hw, -hd],
    [ hw,  hd], [-hw,  hd]
  ];
  const ct=Math.cos(thetaRad), st=Math.sin(thetaRad);
  return corners.map(([cx,cy])=>{
    const rx = x + (cx*ct - cy*st);
    const ry = y + (cx*st + cy*ct);
    return [rx, ry];
  });
}

/* ======= CARICAMENTO DATI ======= */
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
    
    // Renderizza tutti i posteggi con rettangoli compatti
    renderPosteggiCompatti(geo, map);
    
    // Aggiorna statistiche
    updateStats();
    
    console.log(`✅ Caricati ${geo.features.length} posteggi con rettangoli compatti`);
    
  } catch (error) {
    console.error('❌ Errore caricamento dati:', error);
    alert('Errore nel caricamento dei dati dei posteggi');
  }
}

/* ======= RENDER COMPATTO ======= */
function renderPosteggiCompatti(geo, map) {
  // Rimuovi layer precedenti
  if (posteggiLayer) {
    map.removeLayer(posteggiLayer);
  }
  
  // raggruppa per mercato (properties.nome_mer)
  const gruppi = new Map();
  for(const f of geo.features){
    const p = f.properties||{};
    const g = p.nome_mer || 'Mercato';
    if(!gruppi.has(g)) gruppi.set(g, []);
    // coordinate in EPSG:3003 dal GeoJSON
    const [x,y] = f.geometry.coordinates;
    gruppi.get(g).push({x,y,props:p,feature:f});
  }

  // Crea nuovo layer group
  posteggiLayer = L.layerGroup().addTo(map);

  // pane sopra le tile
  const pane = map.createPane('posteggi_pane');
  pane.style.zIndex = 520; // sopra i marker standard

  for (const [nomeMercato, arr] of gruppi){
    // stima angolo di fila per il mercato
    const theta = stimaAngoloGruppo(arr.map(o=>[o.x,o.y]));
    
    for (const o of arr){
      const {w,d} = dimsDaAreaMq(o.props.superficie_posteggio);
      const xy = rettangoloXY(o.x, o.y, w, d, theta);

      // converti ciascun vertice in WGS84 per Leaflet
      const latlngs = xy.map(P3003_to_WGS84);

      // Determina colore in base allo stato
      const stato = o.props.stato || 'libero';
      let color, fillColor;
      if (stato.toLowerCase().includes('occupato')) {
        color = '#d32f2f';
        fillColor = '#f44336';
      } else {
        color = '#1f8f4a';
        fillColor = '#4caf50';
      }

      // Crea poligono
      const polygon = L.polygon(latlngs, {
        pane:'posteggi_pane',
        color: color,
        weight: 2,
        fill: true,
        fillColor: fillColor,
        fillOpacity: 0.7
      });

      // Popup con informazioni
      const numero = o.props.numero || o.props.numero_posteggio || 'N/A';
      const mercato = o.props.nome_mer || 'N/A';
      const settore = o.props.settore_merceologico || 'N/A';
      const superficie = o.props.superficie_posteggio || 'N/A';
      const titolare = o.props.titolare || '';
      const codice = o.props.codice_posteggio || '';

      const popupContent = `
        <div class="popup-posteggio">
          <h3>${mercato} • #${numero} ${codice ? '(' + codice + ')' : ''}</h3>
          <p><strong>Stato:</strong> ${stato}</p>
          <p><strong>Periodo:</strong> ${mercato.includes('Giornaliero') ? 'Giornaliero' : 'Settimanale'}</p>
          <p><strong>Superficie:</strong> ${superficie} m²</p>
          <p><strong>Merceologia:</strong> ${settore}</p>
          ${titolare ? `<p><strong>Titolare:</strong> ${titolare}</p>` : ''}
          <div class="popup-actions">
            <button onclick="spuntaPresenza('${numero}')" id="btn-presenza-${numero}" 
                    class="${isPresenzaSpuntata(numero) ? 'spuntato' : ''}">
              ${isPresenzaSpuntata(numero) ? '✅ Presenza spuntata' : 'Spunta presenza'}
            </button>
            <button onclick="mostraDettagli('${numero}')">Dettagli</button>
          </div>
        </div>
      `;

      polygon.bindPopup(popupContent);
      posteggiLayer.addLayer(polygon);

      // etichetta numero posteggio
      if (numero && numero !== 'N/A') {
        const marker = L.marker(P3003_to_WGS84([o.x,o.y]), {
          pane:'posteggi_pane',
          icon: L.divIcon({
            className:'posteggio-label',
            html:`<div style="
              color:#fff; font-weight:700; font-size:11px;
              background:#0b6f3a; border:1px solid #0b6f3a;
              padding:1px 4px; border-radius:4px; text-align:center;
              min-width:20px;">${numero}</div>`
          })
        });
        posteggiLayer.addLayer(marker);
      }
    }
  }
}

/* ======= FUNZIONI DMS ======= */
function isPresenzaSpuntata(numero) {
  const presenze = JSON.parse(localStorage.getItem('presenze_' + TODAY) || '{}');
  return presenze[numero] === true;
}

function spuntaPresenza(numero) {
  const presenze = JSON.parse(localStorage.getItem('presenze_' + TODAY) || '{}');
  presenze[numero] = !presenze[numero];
  localStorage.setItem('presenze_' + TODAY, JSON.stringify(presenze));
  
  // Aggiorna il bottone
  const btn = document.getElementById(`btn-presenza-${numero}`);
  if (btn) {
    if (presenze[numero]) {
      btn.textContent = '✅ Presenza spuntata';
      btn.classList.add('spuntato');
    } else {
      btn.textContent = 'Spunta presenza';
      btn.classList.remove('spuntato');
    }
  }
}

function mostraDettagli(numero) {
  const posteggio = currentFeatures.find(f => 
    (f.properties.numero || f.properties.numero_posteggio) == numero
  );
  
  if (posteggio) {
    const p = posteggio.properties;
    alert(`Dettagli Posteggio #${numero}:\n\n` +
          `Mercato: ${p.nome_mer || 'N/A'}\n` +
          `Stato: ${p.stato || 'N/A'}\n` +
          `Superficie: ${p.superficie_posteggio || 'N/A'} m²\n` +
          `Settore: ${p.settore_merceologico || 'N/A'}\n` +
          `Titolare: ${p.titolare || 'Non assegnato'}\n` +
          `Codice: ${p.codice_posteggio || 'N/A'}`);
  }
}

function exportCSV() {
  const presenze = JSON.parse(localStorage.getItem('presenze_' + TODAY) || '{}');
  const csv = ['Numero,Mercato,Stato,Presenza,Data'];
  
  currentFeatures.forEach(f => {
    const p = f.properties;
    const numero = p.numero || p.numero_posteggio || 'N/A';
    const presenza = presenze[numero] ? 'Presente' : 'Non verificato';
    csv.push(`${numero},"${p.nome_mer || 'N/A'}","${p.stato || 'N/A'}","${presenza}","${TODAY}"`);
  });
  
  const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `presenze_mercati_${TODAY}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ======= STATISTICHE ======= */
function updateStats() {
  if (!currentFeatures.length) return;
  
  const stats = {
    totale: currentFeatures.length,
    liberi: 0,
    occupati: 0,
    riservati: 0,
    temporanei: 0
  };
  
  currentFeatures.forEach(f => {
    const stato = (f.properties.stato || 'libero').toLowerCase();
    if (stato.includes('libero')) stats.liberi++;
    else if (stato.includes('occupato')) stats.occupati++;
    else if (stato.includes('riservato')) stats.riservati++;
    else if (stato.includes('temporaneo')) stats.temporanei++;
  });
  
  const tasso = Math.round((stats.occupati / stats.totale) * 100);
  
  // Aggiorna sidebar
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    const statsHtml = `
      <h3>Elenco Posteggi</h3>
      <div class="stats">
        <p><strong>Totale posteggi:</strong> ${stats.totale}</p>
        <p><strong>Liberi:</strong> ${stats.liberi}</p>
        <p><strong>Occupati:</strong> ${stats.occupati}</p>
        <p><strong>Riservati:</strong> ${stats.riservati}</p>
        <p><strong>Temporanei:</strong> ${stats.temporanei}</p>
        <p><strong>Tasso occupazione:</strong> ${tasso}%</p>
      </div>
      <div class="posteggi-list">
        ${currentFeatures.map(f => {
          const p = f.properties;
          const numero = p.numero || p.numero_posteggio || 'N/A';
          const stato = p.stato || 'libero';
          const statoClass = stato.toLowerCase().includes('occupato') ? 'occupato' : 'libero';
          return `
            <div class="posteggio-item ${statoClass}">
              <h4>Posteggio #${numero} <span class="stato">${stato}</span></h4>
              <p><strong>Mercato:</strong> ${p.nome_mer || 'N/A'}</p>
              <p><strong>Settore:</strong> ${p.settore_merceologico || 'N/A'}</p>
              <p><strong>Superficie:</strong> ${p.superficie_posteggio || 'N/A'} m²</p>
              ${p.titolare ? `<p><strong>Titolare:</strong> ${p.titolare}</p>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
    sidebar.innerHTML = statsHtml;
  }
}

/* ======= INIZIALIZZAZIONE ======= */
document.addEventListener('DOMContentLoaded', function() {
  // Inizializza mappa
  map = L.map('map').setView([42.7606, 11.1097], 16);
  
  // Tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap, © Comune di Grosseto'
  }).addTo(map);
  
  // Controlli coordinate
  map.on('mousemove', function(e) {
    const coords = document.querySelector('.coordinate-display');
    if (coords) {
      // Converti WGS84 -> EPSG:3003 per mostrare coordinate originali
      const [x, y] = proj4('WGS84', 'EPSG:3003', [e.latlng.lng, e.latlng.lat]);
      coords.textContent = `X: ${x.toFixed(2)}, Y: ${y.toFixed(2)} [EPSG:3003]`;
    }
  });
  
  // Carica dati reali
  loadPosteggiReali();
  
  // Event listeners per bottoni
  document.getElementById('btnExportCSV')?.addEventListener('click', exportCSV);
});

