(function(){
  // ---- Map init
  const ITALY = { lat: 42.0, lng: 12.7, z: 6 }; // vista iniziale Italia (no globo)
  const map = L.map('map', { zoomControl: true, preferCanvas: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom: 20, attribution:'&copy; OpenStreetMap'
  }).addTo(map);
  map.setView([ITALY.lat, ITALY.lng], ITALY.z);

  // ---- Proiezione EPSG:3003 (dal WebGIS: +proj=tmerc ... +towgs84=...)
  proj4.defs('EPSG:3003',
    '+proj=tmerc +lat_0=0 +lon_0=9 +k=0.9996 +x_0=1500000 +y_0=0 '
    +'+ellps=intl +towgs84=-104.1,-49.1,-9.9,0.971,2.917,0.714,-11.68 '
    +'+units=m +no_defs');
  const toWGS = (xy) => {
    const out = proj4('EPSG:3003','EPSG:4326', xy); // [lon,lat]
    return [out[1], out[0]]; // Leaflet => [lat,lon]
  };

  // ---- Helper: reproietta Polygon/MultiPolygon EPSG:3003 -> GeoJSON WGS84
  function reprojPoly3003(geom){
    const type = geom.type;
    const tr = coords => coords.map(ring => ring.map(pt => toWGS(pt)));
    if(type==='Polygon') return { type, coordinates: tr(geom.coordinates).map(r=>r.map(p=>[p[1],p[0]])) };
    if(type==='MultiPolygon') return { type,
      coordinates: geom.coordinates.map(poly => tr(poly).map(r=>r.map(p=>[p[1],p[0]]))) };
    return null;
  }
  // Nota: sopra invertiamo due volte per sicurezza; Leaflet usa [lat,lng] ma GeoJSON è [lng,lat].

  // ---- Sorgenti dati (fallback robusto)
  const DATA = window.DMS_BUILD || {};
  const mercati = DATA.MERCATI || [];              // punti o poligoni 3003
  const posteggiPoly = DATA.POSTEGGI_POLY || [];   // poligoni 3003 con numero
  const posteggiPt  = DATA.POSTEGGI_PT  || [];     // centri 3003 (se mancano i poly)

  const gMercati = L.featureGroup().addTo(map);
  const gPosteggi = L.featureGroup().addTo(map);

  // ---- Disegna aree mercato (se abbiamo i poligoni, altrimenti concave dai posteggi)
  function drawMercati(){
    if (DATA.MERCATI_POLY?.length){
      DATA.MERCATI_POLY.forEach(f=>{
        const gj = { type:'Feature', properties:f.properties||{}, geometry: reprojPoly3003(f.geometry) };
        L.geoJSON(gj,{ style:{color:'#2ca6a6',weight:2,fillOpacity:.12}}).addTo(gMercati);
      });
    } else if (posteggiPt.length){
      // genera hull concava per gruppo mercato
      const byMercato = {};
      posteggiPt.forEach(p=>{
        const k = p.properties?.mercato || 'mercato';
        (byMercato[k] ||= []).push(p);
      });
      Object.keys(byMercato).forEach(k=>{
        const pts = byMercato[k].map(p=>toWGS(p.geometry.coordinates)); // [lat,lng]
        const fc = turf.featureCollection(pts.map(ll=>turf.point([ll[1],ll[0]])));
        const hull = turf.concave(fc,{ maxEdge: 0.06 }); // ~60m
        if(hull){
          const gj = {type:'Feature',properties:{nome:k},geometry:hull.geometry};
          L.geoJSON(gj,{ style:{color:'#2ca6a6',weight:2,fillOpacity:.12}}).addTo(gMercati);
        }
      });
    }
  }

  // ---- Disegna posteggi come rettangoli + numero sempre visibile
  function drawPosteggi(){
    if (posteggiPoly.length){
      posteggiPoly.forEach(f=>{
        const num = f.properties?.numero || f.properties?.num || '';
        const gj = { type:'Feature', properties:{num}, geometry: reprojPoly3003(f.geometry) };
        L.geoJSON(gj,{
          style:()=>({ className:'dms-stand' })
        }).eachLayer(layer=>{
          const c = layer.getBounds().getCenter();
          layer.bindTooltip(String(num), { permanent:true, direction:'center', className:'dms-num' })
               .openTooltip(c);
          layer.addTo(gPosteggi);
        });
      });
    } else if (posteggiPt.length){
      // fallback: genera rettangolini 4x3 m intorno al centro (orientamento non noto)
      posteggiPt.forEach(p=>{
        const num = p.properties?.numero || p.properties?.num || '';
        const ll  = toWGS(p.geometry.coordinates); // [lat,lng]
        const m  = L.latLng(ll[0], ll[1]);
        const dx = 0.000045, dy = 0.00003; // ~4x3m in gradi (approssimazione locale)
        const poly = L.polygon([
           [m.lat-dy, m.lng-dx],[m.lat-dy, m.lng+dx],
           [m.lat+dy, m.lng+dx],[m.lat+dy, m.lng-dx]
        ],{ className:'dms-stand' }).addTo(gPosteggi);
        poly.bindTooltip(String(num), { permanent:true, direction:'center', className:'dms-num' })
            .openTooltip(m);
      });
    }
  }

  // ---- Carica dati JSON esistenti e li adatta per LOCK7
  fetch('./dati_reali_posteggi_grosseto.json?v=lock7', {cache: 'no-store'})
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(gj => {
      if (!gj || !gj.features) {
        console.warn('🎯 DMS-GIS • LOCK7 • invalid GeoJSON data');
        return;
      }
      
      // Adatta i dati esistenti per LOCK7
      const allPts = gj.features.map(f => {
        // Normalizza coordinate se necessario
        const c = f.geometry.coordinates;
        if(Math.abs(c[0]) <= 90 && Math.abs(c[1]) > 90) {
          f.geometry.coordinates = [c[1], c[0]];
        }
        return f;
      });
      
      // Simula dati per test LOCK7
      window.DMS_BUILD = {
        POSTEGGI_PT: allPts.map(f => ({
          geometry: { coordinates: f.geometry.coordinates },
          properties: { 
            numero: f.properties?.numero || Math.floor(Math.random() * 999),
            mercato: f.properties?.mercato || 'Tripoli'
          }
        }))
      };
      
      drawMercati();
      drawPosteggi();
      
      // ---- Primo fit: dopo il draw, centra su dati; fallback Italia
      const all = L.featureGroup([gMercati,gPosteggi]);
      if (all.getLayers().length){
        map.fitBounds(all.getBounds().pad(0.08), { animate: true });
      } else {
        map.setView([ITALY.lat, ITALY.lng], ITALY.z);
      }
    })
    .catch(e => {
      console.error('🎯 DMS-GIS • LOCK7 • data load error:', e);
      // Fallback: disegna comunque con dati vuoti
      drawMercati();
      drawPosteggi();
      map.setView([ITALY.lat, ITALY.lng], ITALY.z);
    });

  // ---- Abilita click sui pulsanti header anche su iPad
  document.querySelectorAll('#appHeader .btn').forEach(b=>{
    b.addEventListener('click', e=>{ e.stopPropagation(); /* hook azioni qui */ });
  });

  console.log('🎯 DMS-GIS • LOCK7 • init OK');
})();

