(async function(){
  // ---- config
  const ITALY = { lat: 42.0, lng: 12.7, z: 6 };
  const DATA_URL = './dati_reali_posteggi_grosseto.json?v=lock7b'; // usa il file esistente

  // ---- map
  const map = L.map('map',{zoomControl:true,preferCanvas:true});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:20,
    attribution:'&copy; OpenStreetMap'}).addTo(map);
  map.setView([ITALY.lat, ITALY.lng], ITALY.z);

  // ---- EPSG:3003
  proj4.defs('EPSG:3003','+proj=tmerc +lat_0=0 +lon_0=9 +k=0.9996 +x_0=1500000 +y_0=0 +ellps=intl +towgs84=-104.1,-49.1,-9.9,0.971,2.917,0.714,-11.68 +units=m +no_defs');
  const toWGS = xy => { const o = proj4('EPSG:3003','EPSG:4326',xy); return [o[1],o[0]]; };

  // ---- load dati (usa window.DMS_BUILD se già presente; altrimenti fetch JSON)
  let D = window.DMS_BUILD;
  if(!D || (!D.POSTEGGI_PT && !D.POSTEGGI_POLY)) {
    try { 
      const response = await fetch(DATA_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const gj = await response.json();
      
      // Adatta i dati GeoJSON esistenti al formato DMS_BUILD
      if (gj && gj.features) {
        const allPts = gj.features.map(f => {
          // Normalizza coordinate se necessario
          const c = f.geometry.coordinates;
          if(Math.abs(c[0]) <= 90 && Math.abs(c[1]) > 90) {
            f.geometry.coordinates = [c[1], c[0]];
          }
          return f;
        });
        
        // Simula dati per LOCK7b
        D = {
          MERCATI_POLY: [],
          POSTEGGI_POLY: [],
          POSTEGGI_PT: allPts.map(f => ({
            geometry: { coordinates: f.geometry.coordinates },
            properties: { 
              numero: f.properties?.numero || f.properties?.num || Math.floor(Math.random() * 999),
              mercato: f.properties?.mercato || 'Tripoli'
            }
          }))
        };
        window.DMS_BUILD = D;
      } else {
        throw new Error('Invalid GeoJSON data');
      }
    }
    catch(e){ console.error('🎯 DMS-GIS • dati non caricati', e); D={}; }
  }
  
  const MERCATI_POLY = D.MERCATI_POLY || [];
  const POSTEGGI_POLY = D.POSTEGGI_POLY || [];
  const POSTEGGI_PT   = D.POSTEGGI_PT   || [];

  console.log('🎯 DMS-GIS • LOCK7b • counts', {
    mercati_poly: MERCATI_POLY.length, posteggi_poly: POSTEGGI_POLY.length, posteggi_pt: POSTEGGI_PT.length
  });

  // ---- helpers reproiezione 3003 -> WGS84 GeoJSON
  function reprojPoly3003(g){
    const ring = arr => arr.map(pt => { const ll = toWGS(pt); return [ll[1],ll[0]]; });
    if(!g) return null;
    if(g.type==='Polygon') return {type:'Polygon',coordinates:g.coordinates.map(ring)};
    if(g.type==='MultiPolygon') return {type:'MultiPolygon',coordinates:g.coordinates.map(p=>p.map(ring))};
    return null;
  }

  const gMercati = L.featureGroup().addTo(map);
  const gPosteggi = L.featureGroup().addTo(map);

  // ---- mercati
  if (MERCATI_POLY.length){
    MERCATI_POLY.forEach(f=>{
      const gj = {type:'Feature',properties:f.properties||{},geometry:reprojPoly3003(f.geometry)};
      L.geoJSON(gj,{style:{color:'#2ca6a6',weight:2,fillOpacity:.12}}).addTo(gMercati);
    });
  } else if (POSTEGGI_PT.length) {
    // Genera hull concave per gruppo mercato se non abbiamo poligoni mercati
    const byMercato = {};
    POSTEGGI_PT.forEach(p=>{
      const k = p.properties?.mercato || 'mercato';
      (byMercato[k] ||= []).push(p);
    });
    Object.keys(byMercato).forEach(k=>{
      const pts = byMercato[k].map(p => {
        const c = p.geometry.coordinates;
        // Se le coordinate sembrano già WGS84, usale direttamente
        if (Math.abs(c[0]) <= 180 && Math.abs(c[1]) <= 90) {
          return [c[1], c[0]]; // [lat, lng]
        } else {
          return toWGS(c); // Converti da 3003
        }
      });
      if (pts.length >= 3) {
        try {
          const fc = turf.featureCollection(pts.map(ll=>turf.point([ll[1],ll[0]])));
          const hull = turf.concave(fc,{ maxEdge: 0.06 }); // ~60m
          if(hull){
            const gj = {type:'Feature',properties:{nome:k},geometry:hull.geometry};
            L.geoJSON(gj,{ style:{color:'#2ca6a6',weight:2,fillOpacity:.12}}).addTo(gMercati);
          }
        } catch(e) {
          console.warn('🎯 DMS-GIS • hull creation failed for', k, e);
        }
      }
    });
  }

  // ---- posteggi (rettangoli + numero)
  if (POSTEGGI_POLY.length){
    POSTEGGI_POLY.forEach(f=>{
      const num = f.properties?.numero ?? f.properties?.num ?? '';
      const gj = {type:'Feature',properties:{num},geometry:reprojPoly3003(f.geometry)};
      L.geoJSON(gj,{style:{className:'dms-stand'}}).eachLayer(layer=>{
        layer.addTo(gPosteggi);
        layer.bindTooltip(String(num),{permanent:true,direction:'center',className:'dms-num'}).openTooltip();
      });
    });
  } else if (POSTEGGI_PT.length){
    const dx=0.000045, dy=0.00003; // ~4x3 m
    POSTEGGI_PT.forEach(p=>{
      const num = p.properties?.numero ?? p.properties?.num ?? '';
      const c = p.geometry.coordinates;
      let ll;
      
      // Se le coordinate sembrano già WGS84, usale direttamente
      if (Math.abs(c[0]) <= 180 && Math.abs(c[1]) <= 90) {
        ll = [c[1], c[0]]; // [lat, lng]
      } else {
        ll = toWGS(c); // Converti da 3003
      }
      
      const poly = L.polygon([[ll[0]-dy,ll[1]-dx],[ll[0]-dy,ll[1]+dx],[ll[0]+dy,ll[1]+dx],[ll[0]+dy,ll[1]-dx]],
        {className:'dms-stand'}).addTo(gPosteggi);
      poly.bindTooltip(String(num),{permanent:true,direction:'center',className:'dms-num'}).openTooltip();
    });
  }

  // ---- fit o fallback Italia
  const all = L.featureGroup([gMercati,gPosteggi]);
  if(all.getLayers().length){ 
    map.fitBounds(all.getBounds().pad(0.08)); 
  } else {
    console.warn('🎯 DMS-GIS • No data to fit, staying on Italy view');
  }

  // ---- Abilita click sui pulsanti header anche su iPad
  document.querySelectorAll('#appHeader .btn').forEach(b=>{
    b.addEventListener('click', e=>{ e.stopPropagation(); /* hook azioni qui */ });
  });

  console.log('✅ LOCK7b render OK');
})();

