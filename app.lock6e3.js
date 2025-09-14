(function(){
  const BADGE = '🎯 DMS-GIS • lock6e2';
  
  function waitForLibs(cb){
    const ok = () => (window.L && window.turf);
    if (ok()) return cb();
    const t = setInterval(()=>{ if(ok()){ clearInterval(t); cb(); }}, 60);
    setTimeout(()=>clearInterval(t), 8000);
  }
  
  waitForLibs(init);
  
  function init(){
    try{
      // Stop eventuale restore UI
      try{ localStorage.removeItem('dms-gis-ui'); }catch(e){}
      
      const mapEl = document.getElementById('map') || document.querySelector('#map');
      if(!mapEl) {
        console.error(BADGE, 'no #map element found');
        return;
      }
      
      // Inizializza mappa con fallback robusto su Grosseto
      const map = L.map(mapEl).setView([42.76, 11.11], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      
      // Carica dati JSON con cache busting
      const url = './dati_reali_posteggi_grosseto.json?v=lock6e2';
      fetch(url, {cache: 'no-store'})
        .then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then(gj => {
          if (!gj || !gj.features) {
            console.warn(BADGE, 'invalid GeoJSON data');
            return;
          }
          
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
          
          // Funzione per creare hull concavo più realistico
          function createHull(points) {
            if(points.length < 3) return null;
            try {
              const fc = turf.featureCollection(points);
              // Parametri più stretti per hull più realistici
              const opt = {maxEdge: 0.06, units: 'kilometers'}; // ~60 m
              let hull = turf.concave(fc, opt);
              if(!hull) hull = turf.convex(fc);
              return hull;
            } catch(e) {
              console.warn(BADGE, 'hull creation failed:', e);
              return null;
            }
          }
          
          // Crea hull per entrambe le aree
          const hullT = createHull(ptsTripoli);
          const hullE = createHull(ptsEsper);
          
          // Disegna area con posteggi visibili
          function drawArea(points, hull, color, label) {
            if(!hull) return null;
            
            // Disegna punti posteggi (visibili con numeri)
            points.forEach((f, idx) => {
              const coords = f.geometry.coordinates;
              const marker = L.circleMarker([coords[1], coords[0]], {
                radius: 4,
                opacity: 0.8,
                fillOpacity: 0.6,
                color: color,
                fillColor: color
              }).addTo(map);
              
              // Tooltip con numero posteggio
              const numero = f.properties.numero || (idx + 1);
              marker.bindTooltip(`${numero}`, {
                permanent: false,
                direction: 'top',
                className: 'posteggio-tooltip'
              });
              
              // Popup con dettagli
              marker.bindPopup(`
                <strong>Posteggio ${numero}</strong><br>
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
              fillOpacity: 0.1
            }).addTo(map);
            
            // Marker centrale con etichetta
            const centroid = turf.centroid(hull).geometry.coordinates;
            L.circleMarker([centroid[1], centroid[0]], {
              radius: 8,
              className: 'hub-dot',
              color: color,
              fillColor: color,
              fillOpacity: 0.9,
              weight: 2
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
          
          // Fit mappa alle aree con fallback
          const bounds = L.latLngBounds([]);
          if(b1) bounds.extend(b1);
          if(b2) bounds.extend(b2);
          
          if(bounds.isValid()) {
            map.fitBounds(bounds.pad(0.15));
          } else {
            // Fallback su Grosseto se non ci sono bounds validi
            map.setView([42.76, 11.11], 15);
          }
          
          // Invalidate size dopo un breve delay
          setTimeout(() => { 
            try{ map.invalidateSize(); }catch(e){} 
          }, 200);
          
          console.log(BADGE, 'OK', 'points=', allPts.length, 'tripoli=', ptsTripoli.length, 'esper=', ptsEsper.length);
        })
        .catch(err => {
          console.error(BADGE, 'fetch error:', err);
          // Banner non bloccante invece di alert
          const banner = document.createElement('div');
          banner.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);background:#ff6b6b;color:white;padding:8px 16px;border-radius:4px;z-index:9999;font-size:14px;';
          banner.textContent = 'Errore caricamento dati GIS';
          document.body.appendChild(banner);
          setTimeout(() => banner.remove(), 5000);
        });
        
    }catch(err){ 
      console.error(BADGE, 'init error:', err); 
    }
  }
})();

