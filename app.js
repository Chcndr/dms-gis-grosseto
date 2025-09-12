// =====================  DMS • GIS Grosseto (clone 1:1)  =====================

let map, posteggiLayer, currentFeatures = [];
const TODAY = new Date().toISOString().slice(0,10);

// EPSG:3003 (Gauss-Boaga Ovest) -> WGS84 con Proj4
const CRS_3003 = '+proj=tmerc +lat_0=0 +lon_0=9 +k=0.9996 +x_0=1500000 +y_0=0 +ellps=intl +towgs84=-225,-65,9,0,0,0,0 +units=m +no_defs';

function initMap() {
  map = L.map('map', { zoomControl: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(map);
  loadPosteggiReali();
}

async function loadPosteggiReali() {
  // Path assoluto dal root della Pages (user/repo)
  const REPO_BASE = '/dms-gis-grosseto/';
  const DATA_URL  = REPO_BASE + 'assets/data/dati_reali_posteggi_grosseto.json';
  const BUST      = (window.DMS_COMMIT || Date.now());

  const resp = await fetch(DATA_URL + '?v=' + BUST, {
    cache: 'no-store',
    headers: { 'Accept': 'application/json' }
  });

  let geo;
  try {
    geo = await resp.json();
  } catch (e) {
    const raw = `https://raw.githubusercontent.com/Chcndr/dms-gis-grosseto/main/assets/data/dati_reali_posteggi_grosseto.json?nocache=${BUST}`;
    const r2  = await fetch(raw, { cache: 'no-store' });
    geo = await r2.json();
  }

  const feats = geo.features.map(f => {
    const p = f.properties || {};
    const [x3003, y3003] = f.geometry.coordinates;
    const [lon, lat] = proj4(CRS_3003, 'WGS84', [x3003, y3003]); // -> [lon, lat]
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lon, lat] },
      properties: {
        id: p.id,
        numero: p.numero,
        nome_mer: p.nome_mer,                 // es. "Tripoli Giornaliero"
        cod_int: p.cod_int,                   // es. "TG"
        codice_interno: p.codice_interno,     // es. "TG125"
        superficie_posteggio: p.superficie_posteggio,
        merceologia_riserva: p.merceologia_riserva,
        periodo_esercizio: p.periodo_esercizio, // "Giornaliero"/"Settimanale"
        stato: p.stato                        // "Libero"/"Occupato"/"Riserva"
      }
    };
  });

  currentFeatures = feats;

  const styleByStato = (stato) => {
    const S = (stato||'').toLowerCase();
    if (S.includes('occup')) return { color:'#E65454', fillColor:'#E65454' };   // rosso
    if (S.includes('riserv')) return { color:'#F2C94C', fillColor:'#F2C94C' }; // giallo
    return { color:'#2EB88A', fillColor:'#2EB88A' };                           // verde = libero
  };

  if (posteggiLayer) posteggiLayer.remove();

  posteggiLayer = L.geoJSON(feats, {
    pointToLayer: (feat, latlng) => L.circleMarker(latlng, {
      radius: 7, weight: 1.5, opacity: 1, fillOpacity: 0.8,
      ...styleByStato(feat.properties.stato)
    }),
    onEachFeature: (feat, layer) => {
      const p = feat.properties;
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
      layer.bindPopup(html);
      layer.on('mouseover', () => layer.setStyle({ radius: 9, weight: 2.5 }));
      layer.on('mouseout',  () => layer.setStyle({ radius: 7, weight: 1.5 }));
    }
  }).addTo(map);

  const latlngs = feats.map(f => [f.geometry.coordinates[1], f.geometry.coordinates[0]]);
  map.fitBounds(L.latLngBounds(latlngs), { padding:[20,20] });

  map.on('popupopen', (e) => {
    const el = e.popup.getElement();
    const btnP = el.querySelector('.btn-presenza');
    const btnD = el.querySelector('.btn-dettagli');
    if (btnP) {
      btnP.onclick = () => {
        const id = btnP.getAttribute('data-id');
        const key = `presenza:${TODAY}:${id}`;
        const was = localStorage.getItem(key) === '1';
        localStorage.setItem(key, was ? '0' : '1');
        btnP.textContent = was ? 'Spunta presenza' : '✅ Presenza spuntata';
        btnP.style.background = was ? '#072C2E' : '#0FA3A3';
      };
    }
    if (btnD) {
      btnD.onclick = () => {
        const id = btnD.getAttribute('data-id');
        const f = currentFeatures.find(x => String(x.properties.id) === String(id));
        if (!f) return;
        const p = f.properties;
        alert(
          `Mercato: ${p.nome_mer}\nPosteggio: #${p.numero}\nCod.Int.: ${p.codice_interno}\n`+
          `Periodo: ${p.periodo_esercizio}\nSuperficie: ${p.superficie_posteggio} m²\nMerceologia: ${p.merceologia_riserva}\nStato: ${p.stato}`
        );
      };
    }
  });
}

// Export presenze del giorno in CSV (per ingest DMS)
function exportPresenzeCSV() {
  const marked = currentFeatures
    .filter(f => localStorage.getItem(`presenza:${TODAY}:${f.properties.id}`) === '1')
    .map(f => ({
      data: TODAY,
      id: f.properties.id,
      mercato: f.properties.nome_mer,
      numero: f.properties.numero,
      codice_interno: f.properties.codice_interno,
      stato: f.properties.stato,
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0]
    }));

  const header = Object.keys(marked[0] || {data:'',id:'',mercato:'',numero:'',codice_interno:'',stato:'',lat:'',lon:''}).join(',');
  const csv = [header].concat(marked.map(o => Object.values(o).join(','))).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `presenze_${TODAY}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
}

window.addEventListener('load', initMap);

// =====================  /fine blocco  =====================

