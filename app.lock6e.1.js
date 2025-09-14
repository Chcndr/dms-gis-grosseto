(function(){
  const BADGE = '🎯 DMS-GIS • lock6e';
  function waitForLibs(cb){
    const ok = () => (window.L && window.turf);
    if (ok()) return cb();
    const t = setInterval(()=>{ if(ok()){ clearInterval(t); cb(); }}, 60);
    setTimeout(()=>clearInterval(t), 8000);
  }
  waitForLibs(init);
  
  function init(){
    try{
      // stop eventuale restore UI
      try{ localStorage.removeItem('dms-gis-ui'); }catch(e){}
      
      const mapEl = document.getElementById('map') || document.querySelector('#map');
      if(!mapEl) return console.error(BADGE,'no #map');
      
      // Inizializza mappa
      const map = L.map(mapEl).setView([42.7628, 11.1090], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      
      // Carica dati JSON
      const url = './dati_reali_posteggi_grosseto.json?v=lock6e';
      fetch(url, {cache: 'no-store'})
        .then(r => r.json())
        .then(gj => {
          const allPts = gj.features.map(f => {
            // Normalizza coordinate se necessario
            const c = f.geometry.coordinates;
            if(Math.abs(c[0]) <= 90 && Math.abs(c[1]) > 90) {
              f.geometry.coordinates = [c[1], c[0]];
            }
            return f;
          });
          
          // Filtro mercati
          const ptsTripoli = allPts.filter(f => /Tripoli/i.test(f.properties.mercato || ''));
          const ptsEsper = allPts.filter(f => /Esperanto/i.test(f.properties.mercato || ''));
          
          // Funzione per creare hull concavo più stretto
          function createHull(points) {
            if(points.length < 3) return null;
            const fc = turf.featureCollection(points);
            const opt = {maxEdge: 0.18, units: 'kilometers'}; // ~180 m
            let hull = turf.concave(fc, opt);
            if(!hull) hull = turf.convex(fc);
            return hull;
          }
          
          // Crea hull per entrambe le aree
          const hullT = createHull(ptsTripoli);
          const hullE = createHull(ptsEsper);
          
          // Disegna poligoni e punti
          function drawArea(points, hull, color, label) {
            if(!hull) return null;
            
            // Disegna punti posteggi (piccoli e trasparenti)
            points.forEach(f => {
              const coords = f.geometry.coordinates;
              L.circleMarker([coords[1], coords[0]], {
                radius: 3,
                opacity: 0.15,
                fillOpacity: 0.15,
                color: color
              }).addTo(map).bindPopup(`
                <strong>Posteggio ${f.properties.numero || 'N/A'}</strong><br>
                Titolare: ${f.properties.titolare || 'N/A'}<br>
                P.IVA: ${f.properties.piva || 'N/A'}<br>
                Mercato: ${f.properties.mercato || 'N/A'}<br>
                Superficie: ${f.properties.superficie || 'N/A'} mq
              `);
            });
            
            // Disegna poligono area
            const ring = hull.geometry.coordinates[0].map(([x, y]) => [y, x]);
            const polygon = L.polygon(ring, {
              color: color,
              weight: 2,
              fillOpacity: 0.08
            }).addTo(map);
            
            // Marker centrale con label
            const centroid = turf.centroid(hull).geometry.coordinates;
            L.circleMarker([centroid[1], centroid[0]], {
              radius: 6,
              className: 'hub-dot',
              color: color,
              fillColor: color,
              fillOpacity: 0.8
            }).addTo(map).bindTooltip(label, {
              permanent: true,
              direction: 'top',
              className: 'hub-label'
            });
            
            return polygon.getBounds();
          }
          
          // Disegna le due aree
          const b1 = drawArea(ptsTripoli, hullT, '#0FA3A3', 'Tripoli (175)');
          const b2 = drawArea(ptsEsper, hullE, '#C8F560', 'Esperanto (5)');
          
          // Fit mappa alle aree
          const bounds = L.latLngBounds([]);
          if(b1) bounds.extend(b1);
          if(b2) bounds.extend(b2);
          if(bounds.isValid()) {
            map.fitBounds(bounds.pad(0.15));
          }
          
          // Invalidate size dopo un breve delay
          setTimeout(() => { 
            try{ map.invalidateSize(); }catch(e){} 
          }, 150);
          
          console.log(BADGE, 'OK', 'points=', allPts.length, 'tripoli=', ptsTripoli.length, 'esper=', ptsEsper.length);
        })
        .catch(err => {
          console.error(BADGE, 'fetch error:', err);
        });
        
    }catch(err){ 
      console.error('LOCK6e init error', err); 
    }
  }
})();

