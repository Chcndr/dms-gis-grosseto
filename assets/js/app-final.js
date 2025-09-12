/* DMS–GIS Grosseto • "logica semplice" come la prima versione,
   ma con DATI REALI auto-caricati e rettangoli corretti in METRI.
   Requisiti inclusi in index.html: leaflet 1.9.x + proj4 2.11.x
*/

(() => {
  // ====== CONFIG ======
  const CONFIG = {
    // JSON locale servito da GitHub Pages (mettilo qui: /assets/data/…)
    JSON_URL: './assets/data/dati_reali_posteggi_grosseto.json',
    // Fallback CDN (tag/commit reale se vuoi bloccare la versione)
    JSON_CDN: 'https://cdn.jsdelivr.net/gh/Chcndr/dms-gis-grosseto@main/assets/data/dati_reali_posteggi_grosseto.json',
    // Zoom & tiles (nitidezza)
    TILE_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    MAX_NATIVE: 19, MAX_ZOOM: 22
  };

  // ====== PROIEZIONI ======
  // EPSG:3003 (Monte Mario / Italy zone 1) → necessario per Grosseto
  if (!proj4.defs['EPSG:3003']) {
    proj4.defs('EPSG:3003',
      '+proj=tmerc +lat_0=0 +lon_0=9 +k=0.9996 +x_0=1500000 +y_0=0 +ellps=intl +units=m +no_defs ' +
      '+towgs84=-225,-65,9,0,0,0,0'
    );
  }
  if (!proj4.defs['EPSG:3857']) {
    proj4.defs('EPSG:3857',
      '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0 +y_0=0 +k=1.0 +units=m +no_defs'
    );
  }

  const to3857 = (xy3003) => proj4('EPSG:3003', 'EPSG:3857', xy3003);  // metri → metri
  const to4326 = (xy)     => proj4('EPSG:3857', 'WGS84', xy);          // metri → gradi

  // ====== MAPPA (come la prima versione, semplice e pulita) ======
  const map = L.map('map', { zoomControl: true, preferCanvas: true });
  const tiles = L.tileLayer(CONFIG.TILE_URL, {
    maxNativeZoom: CONFIG.MAX_NATIVE,
    maxZoom: CONFIG.MAX_ZOOM,
    detectRetina: true,
    updateWhenZooming: true,
    updateInterval: 50,
    crossOrigin: true,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  // Layer per mercati (come l'originale "piccolo")
  const LAYERS = {
    'Tripoli Giornaliero': L.layerGroup().addTo(map),
    'Esperanto Settimanale-Giovedì': L.layerGroup().addTo(map),
    '__altri__': L.layerGroup().addTo(map)
  };

  // ====== CARICAMENTO DATI (JSON → normalizza) ======
  async function fetchJsonSmart() {
    // 1) locale
    try {
      const r = await fetch(CONFIG.JSON_URL + '?v=' + Date.now(), { cache: 'no-store' });
      if (r.ok) return r.json();
    } catch {}
    // 2) cdn
    const r2 = await fetch(CONFIG.JSON_CDN + '?v=' + Date.now(), { cache: 'no-store' });
    if (!r2.ok) throw new Error('Dati non accessibili');
    return r2.json();
  }

  function normalize(geo) {
    // Supporta FeatureCollection (preferito)
    const out = [];
    if (geo && geo.type === 'FeatureCollection' && Array.isArray(geo.features)) {
      geo.features.forEach(f => {
        const p = f.properties || {};
        const g = f.geometry || {};
        let x = null, y = null;

        // Caso 1: point in EPSG:3003 (x,y)
        if (g.type === 'Point' && Array.isArray(g.coordinates)) {
          x = +g.coordinates[0]; y = +g.coordinates[1];
        }
        // Caso 2: dati "piatti" (fallback)
        if ((x == null || y == null) && p.E != null && p.N != null) {
          x = +p.E; y = +p.N;
        }

        if (x == null || y == null) return;

        out.push({
          E: x, N: y,                                   // EPSG:3003
          mercato: p.nome_mer || 'Mercato',
          numero:  p.numero != null ? String(p.numero).trim() : '',
          cod:     p.codice_interno || p.cod_int || '',
          stato:   p.stato || '',
          area:    p.superficie_posteggio ? +p.superficie_posteggio : null,
          w:       p.larghezza_m ? +p.larghezza_m : null,
          h:       p.profondita_m ? +p.profondita_m : null,
          rot:     p.rotazione_deg ? +p.rotazione_deg : null
        });
      });
    }
    return out;
  }

  // ====== GEOMETRIA RETTANGOLI (in metri, come si deve) ======
  function rectFromCenterMeters(cx, cy, w, h, angDeg) {
    const hx = (w ?? 4) / 2, hy = (h ?? 3) / 2;  // fallback realistici
    const a  = (angDeg || 0) * Math.PI / 180;
    const c  = Math.cos(a), s = Math.sin(a);
    // 4 vertici in 3857
    const pts = [
      [+hx, +hy], [-hx, +hy], [-hx, -hy], [+hx, -hy]
    ].map(([dx, dy]) => [cx + (dx*c - dy*s), cy + (dx*s + dy*c)]);
    pts.push(pts[0]);
    return pts;
  }

  // Angolo "di fila" robusto per mercato: mediana verso il vicino
  function angleByMarket(points3857) {
    if (points3857.length < 2) return 0;
    const ang = [];
    for (let i=0;i<points3857.length;i++) {
      const [xi, yi] = points3857[i];
      let bestD = Infinity, jBest = -1;
      for (let j=0;j<points3857.length;j++) {
        if (j===i) continue;
        const [xj,yj] = points3857[j];
        const dx = xj-xi, dy = yj-yi;
        const d2 = dx*dx + dy*dy;
        if (d2 < bestD) { bestD=d2; jBest=j; }
      }
      if (jBest>=0) {
        const [xj,yj] = points3857[jBest];
        ang.push(Math.atan2(yj-yi, xj-xi) * 180/Math.PI);
      }
    }
    ang.sort((a,b)=>a-b);
    const median = ang[Math.floor(ang.length/2)];
    return Number.isFinite(median) ? median : 0;
  }

  // Dimensioni da area (m²) se w/h mancano (come "prima logica")
  function dimsFromArea(area) {
    const a = +area || 20;
    if (a<=12) return {w:3,d:4};
    if (a<=15) return {w:3,d:5};
    if (a<=20) return {w:4,d:5};
    if (a<=24) return {w:4,d:6};
    if (a<=30) return {w:5,d:6};
    return {w:4,d:8};
  }

  function styleByState(stato) {
    const s = String(stato||'').toLowerCase();
    if (s.includes('occ') || s.includes('assegn')) return { color:'#e25252', fillColor:'#ff8d8d' };
    if (s.includes('riserv'))                         return { color:'#f2c94c', fillColor:'#ffe18a' };
    return { color:'#2eb88a', fillColor:'#7ae3ba' }; // libero
  }

  // ====== DISEGNO =========
  function drawAll(records) {
    // group by mercato
    const groups = new Map();
    for (const r of records) {
      const g = r.mercato || '__altri__';
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(r);
    }

    const allBounds = L.latLngBounds();

    groups.forEach((arr, mercato) => {
      const layer = LAYERS[mercato] || LAYERS['__altri__'];

      // centri in 3857 per angolo robusto
      const centers3857 = arr.map(r => to3857([r.E, r.N]));
      const ang = angleByMarket(centers3857);

      arr.forEach((r, idx) => {
        const [x, y] = centers3857[idx];
        const dims  = (r.w && r.h) ? {w:r.w, d:r.h} : dimsFromArea(r.area);
        const angUse = (r.rot != null) ? r.rot : ang;

        const poly3857 = rectFromCenterMeters(x, y, dims.w, dims.d, angUse);
        const poly4326 = poly3857.map(to4326).map(([lon,lat]) => [lat,lon]);

        const st = styleByState(r.stato);
        const poly = L.polygon(poly4326, {
          color: st.color, fillColor: st.fillColor, fillOpacity: 0.85, weight: 1
        }).addTo(layer);

        const center4326 = to4326([x, y]); // [lon,lat]
        const label = L.marker([center4326[1], center4326[0]], {
          icon: L.divIcon({
            className: 'posteggio-label',
            html: `<div style="color:#fff;font-weight:700;font-size:11px;background:#0b6f3a;border:1px solid #0b6f3a;padding:1px 4px;border-radius:4px;">${r.numero||''}</div>`,
          }),
          interactive: false
        }).addTo(layer);

        const html = `
          <div style="min-width:240px">
            <div><b>${mercato}</b> — <b>#${r.numero||'—'}</b> <small>(${r.cod||''})</small></div>
            <div>Stato: ${r.stato||'—'} • Superficie: ${r.area??'—'} m²</div>
          </div>`;
        poly.bindPopup(html);

        allBounds.extend(poly.getBounds());
      });
    });

    if (allBounds.isValid()) map.fitBounds(allBounds.pad(0.15));
  }

  // ====== AVVIO ======
  (async function run() {
    try {
      const raw = await fetchJsonSmart();
      const recs = normalize(raw);
      if (!recs.length) throw new Error('Dataset vuoto');
      drawAll(recs);
      console.info(`DMS-GIS: OK • records=${recs.length}`);
    } catch (e) {
      console.error('DMS-GIS errore dati:', e);
      const badge = document.createElement('div');
      badge.textContent = 'Dati non disponibili';
      badge.style.cssText = 'position:fixed;left:8px;bottom:8px;background:#c00;color:#fff;padding:4px 8px;border-radius:6px;font:12px system-ui;z-index:9999';
      document.body.appendChild(badge);
    }
  })();

})();

