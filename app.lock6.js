/* DMS-GIS • build=lock6 */
/* Rettangoli ruotati via PCA + clip dentro area mercato + 2 marker centrali */

(function(){
  const V = 'lock6';

  // Mappa base (Leaflet già incluso dal sito)
  const map = L.map('map', {
    zoomControl: true,
    attributionControl: true
  }).setView([42.7629, 11.1096], 16);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 20, minZoom: 12
  }).addTo(map);

  // Proiezioni per calcoli in metri (usiamo 3857 per semplicità robusta)
  try{ proj4.defs('EPSG:3857', '+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs'); }catch(e){}

  const toMeters = (lat, lng) => {
    const p = proj4('EPSG:4326','EPSG:3857',[lng,lat]); // [x,y] metri
    return {x:p[0], y:p[1]};
  };
  const toLatLng = (x,y) => {
    const p = proj4('EPSG:3857','EPSG:4326',[x,y]);
    return [p[1], p[0]];
  };

  // PCA 2D su array di punti [{x,y},...]
  function pcaAngle(points){
    const n = points.length;
    if(n<2) return 0;
    let mx=0,my=0;
    for(const p of points){ mx+=p.x; my+=p.y; }
    mx/=n; my/=n;
    let Sxx=0,Syy=0,Sxy=0;
    for(const p of points){
      const dx=p.x-mx, dy=p.y-my;
      Sxx+=dx*dx; Syy+=dy*dy; Sxy+=dx*dy;
    }
    // angolo del primo autovettore
    const theta = 0.5*Math.atan2(2*Sxy, (Sxx - Syy));
    return theta; // radianti
  }

  // rettangolo ruotato di area A (m2) con larghezza fissa W (m)
  function makeRotRect(centerLL, theta, areaM2, widthM){
    const heightM = Math.max(1, areaM2/Math.max(1,widthM));
    const c = toMeters(centerLL.lat, centerLL.lng);
    const cos = Math.cos(theta), sin = Math.sin(theta);
    const hw = widthM/2, hh = heightM/2;

    const corners = [
      {x: -hh, y: -hw}, // usiamo asse X=lungo (theta), Y=trasversale
      {x:  hh, y: -hw},
      {x:  hh, y:  hw},
      {x: -hh, y:  hw}
    ].map(p=>{
      const X = p.x*cos - p.y*sin;
      const Y = p.x*sin + p.y*cos;
      return toLatLng(c.x+X, c.y+Y);
    });
    corners.push(corners[0]);
    return L.polygon(corners, {weight:1, color:'#2e7d32', fillColor:'#43a047', fillOpacity:.65});
  }

  // marker centrali (uno per mercato)
  function addCenterMarker(poly, label){
    const center = turf.center(poly).geometry.coordinates; // [lng,lat]
    return L.marker([center[1], center[0]])
      .bindTooltip(label, {permanent:true, direction:'center', className:'dms-hub'})
      .addTo(map);
  }

  // stile area mercato
  const areaStyle = { color:'#2e7d32', weight:2, fillColor:'#a5d6a7', fillOpacity:.25 };

  // carica JSON reale
  fetch('./dati_reali_posteggi_grosseto.json?v='+V)
  .then(r=>r.json())
  .then(geo=>{
    const features = geo.features || [];
    if(!features.length) throw new Error('JSON vuoto');

    // separa per mercato
    const tripoli = features.filter(f => (f.properties.mercato||'').toLowerCase().includes('tripoli'));
    const esperanto = features.filter(f => (f.properties.mercato||'').toLowerCase().includes('esperanto'));

    // helper: punti -> hull (se fallisce usa buffer)
    function marketHull(list){
      const pts = { type:'FeatureCollection', features:list.map(f=>({
        type:'Feature', geometry:f.geometry
      }))};
      let hull = turf.convex(pts);
      if(!hull){
        const center = turf.center(pts);
        hull = turf.buffer(center, 0.08, {units:'kilometers'}); // fallback ~80m
      }
      return hull;
    }

    // costruisci aree mercato
    const hullTripoli = marketHull(tripoli);
    const hullEsperanto = marketHull(esperanto);

    const layerTripoli = L.geoJSON(hullTripoli, {style:areaStyle}).addTo(map);
    const layerEsperanto = L.geoJSON(hullEsperanto, {style:areaStyle}).addTo(map);

    addCenterMarker(hullTripoli, 'Tripoli (175)');
    addCenterMarker(hullEsperanto, 'Esperanto (5)');

    // PCA per orientare i rettangoli (per mercato)
    function marketTheta(list){
      const pts = list.map(f=>{
        const [lng,lat] = f.geometry.coordinates;
        return toMeters(lat,lng);
      });
      return pcaAngle(pts);
    }
    const thetaTripoli   = marketTheta(tripoli);
    const thetaEsperanto = marketTheta(esperanto);

    // crea rettangoli e clip dentro area
    let rectCount = 0;

    function addRects(list, theta, marketHull){
      const hullLayer = marketHull; // geojson
      for(const f of list){
        // parse area m² (es. "20 mq")
        const aTxt = (f.properties.superficie||'').toString().replace(',', '.');
        const areaM2 = parseFloat(aTxt) || 20;
        const widthM = 2.5; // larghezza standard banco
        const [lng,lat] = f.geometry.coordinates;
        const rect = makeRotRect({lat,lng}, theta, areaM2, widthM);

        // clip geometrico con turf
        const rectGeo = turf.polygon([ rect.getLatLngs()[0].map(ll=>[ll.lng,ll.lat]) ]);
        let inter = null;
        try{ inter = turf.intersect(hullLayer, rectGeo); }catch(_){}
        if(!inter){ continue; } // se fuori, salta

        L.geoJSON(inter, {
          style:{color:'#1b5e20', weight:1, fillColor:'#66bb6a', fillOpacity:.8}
        })
        .bindPopup(`
          <b>Posteggio #${f.properties.numero||''}</b><br/>
          Stato: ${f.properties.stato||''}<br/>
          Settore: ${f.properties.settore||''}<br/>
          Superficie: ${f.properties.superficie||''}<br/>
          Titolare: ${f.properties.titolare||''}<br/>
          P.IVA: ${f.properties.piva||f.properties.p_iva||''}
        `).addTo(map);

        rectCount++;
      }
    }

    addRects(tripoli,   thetaTripoli,   hullTripoli);
    addRects(esperanto, thetaEsperanto, hullEsperanto);

    // fit alla somma delle aree
    const group = L.featureGroup([layerTripoli, layerEsperanto]);
    map.fitBounds(group.getBounds().pad(0.15));

    console.log(`🎯 DMS-GIS • build=${V} • rettangoli=${rectCount} • EPSG:3003→WGS84 via 3857 calcoli`);
  })
  .catch(err=>{
    console.error('DMS-GIS error', err);
    alert('Errore di avvio mappa (LOCK6). Controlla console.');
  });
})();

