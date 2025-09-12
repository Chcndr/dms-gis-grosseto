/* DMS-GIS • build=lock5a
 * - controlli duplicati rimossi (solo Leaflet default)
 * - aree mercato (concave hull) Tripoli/Esperanto
 * - 2 marker centrali (no pin blu diffusi)
 * - rettangoli per posteggi ruotati via PCA per mercato
 * - clip rettangoli dentro area mercato
 * - ricerca per numero posteggio (input sidebar)
 */

(function(){
  const build = 'lock5a';

  // ---- mappa base
  const map = L.map('map', { zoomControl: true }).setView([42.7639, 11.1136], 16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 20, attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  // ---- layer group
  const gAree   = L.layerGroup().addTo(map);
  const gRect   = L.layerGroup().addTo(map);
  const gMarker = L.layerGroup().addTo(map);

  // ---- EPSG:3003
  proj4.defs('EPSG:3003',
    '+proj=tmerc +lat_0=0 +lon_0=9 +k=0.9996 +x_0=1500000 +y_0=0 +ellps=intl +towgs84=-104.1,-49.1,-9.9,0.971,-2.917,0.714,-11.68 +units=m +no_defs');

  const pj3003_to_4326 = (x,y)=>{
    const [lon,lat] = proj4('EPSG:3003','WGS84',[x,y]);
    return [lat,lon];
  };

  // ---- util
  const num = x => Number(String(x).replace(',','.'));

  // PCA 2D su array di [x,y]
  function pcaAngle(points){
    const n=points.length; if(n<2) return 0;
    let mx=0,my=0; points.forEach(p=>{mx+=p[0]; my+=p[1];}); mx/=n; my/=n;
    let sxx=0,syy=0,sxy=0;
    points.forEach(p=>{
      const dx=p[0]-mx, dy=p[1]-my;
      sxx+=dx*dx; syy+=dy*dy; sxy+=dx*dy;
    });
    const theta=0.5*Math.atan2(2*sxy, (sxx - syy));
    return theta; // rad
  }

  // Rettangolo centrato/ruotato (metri) -> geojson polygon (WGS84)
  function rectPoly(center3003, w=3, h=6, angleRad=0){
    const cx=center3003[0], cy=center3003[1];
    const dx=w/2, dy=h/2;
    const pts = [
      [-dx,-dy],[+dx,-dy],[+dx,+dy],[-dx,+dy],[-dx,-dy]
    ].map(([x,y])=>{
      const xr =  x*Math.cos(angleRad) - y*Math.sin(angleRad);
      const yr =  x*Math.sin(angleRad) + y*Math.cos(angleRad);
      const wx = cx + xr, wy = cy + yr;
      const [lat,lon] = pj3003_to_4326(wx,wy);
      return [lon,lat];
    });
    return turf.polygon([pts]);
  }

  // Concave hull di un insieme di punti (fallback convex)
  function hullFeature(points){
    const fc = turf.featureCollection(points.map(p=>turf.point(p)));
    let hull = turf.concave(fc,{maxEdge:0.5}); // km
    if(!hull) hull = turf.convex(fc);
    return hull;
  }

  // Colori
  const col = {
    areaFill: '#2ca58d55',
    areaLine: '#2ca58d',
    ok: '#39d98a',
    ko: '#ff6b6b',
    rectFill: '#1f6f78aa',
    labelBg: '#0b3b3e'
  };

  // ---- carica dati
  const JSON_URL = './dati_reali_posteggi_grosseto.json?v=lock5a';
  fetch(JSON_URL).then(r=>r.json()).then(data=>{
    // mappa campi robusta
    const rows = data.map(r=>{
      return {
        id: r.id || r.ID || r.numero || r.posteggio || r.num || '',
        mercato: (r.mercato || r.Mercato || '').toString(),
        stato:   (r.stato || r.Stato || '').toString(),
        settore: r.settore || r.Settore || '',
        sup:     num(r.superficie || r.Superficie || r.mq || 18),
        x:       num(r.x || r.X || r.x3003 || r.e || r.E),
        y:       num(r.y || r.Y || r.y3003 || r.n || r.N),
        tit:     r.titolare || r.Titolare || '',
        piva:    r.piva || r.PIVA || r.p_iva || ''
      };
    }).filter(r=>!isNaN(r.x) && !isNaN(r.y));

    // gruppi per mercato (nomi normalizzati)
    const groups = {};
    rows.forEach(r=>{
      const key = /esper/i.test(r.mercato) ? 'ESPERANTO' : 'TRIPOLI';
      (groups[key] ||= []).push(r);
    });

    // per ciascun mercato: PCA -> angolo, hull -> area, marker centrale
    Object.entries(groups).forEach(([k,arr])=>{
      // PCA su coordinate 3003
      const pts3003 = arr.map(r=>[r.x,r.y]);
      const theta = pcaAngle(pts3003); // rad

      // punti WGS84 per hull
      const ptsWgs = arr.map(r=>{
        const [lat,lon]=pj3003_to_4326(r.x,r.y);
        return [lon,lat];
      });

      const area = hullFeature(ptsWgs);
      if(area){
        L.geoJSON(area,{
          style:{ color: col.areaLine, weight:2, fillColor: col.areaFill, fillOpacity:0.6, dashArray:'4 3' }
        }).addTo(gAree);

        // centro area -> marker
        const c = turf.centerOfMass(area).geometry.coordinates; // [lon,lat]
        const pretty = k==='TRIPOLI' ? 'Tripoli (175)' : 'Esperanto (5)';
        L.marker([c[1],c[0]],{
          icon: L.divIcon({
            className:'dms-center',
            html:`<div style="background:#0f4a4e;color:#fff;padding:6px 10px;border-radius:10px;border:1px solid #2ca58d;box-shadow:0 2px 8px rgba(0,0,0,.25);font-weight:600">${pretty}</div>`
          })
        }).addTo(gMarker);
      }

      // Rettangoli ruotati + clip dentro area
      const areaPoly = area ? turf.polygon(area.geometry.coordinates) : null;
      arr.forEach(r=>{
        const w = 3.5;                         // metri (larghezza banco)
        const h = Math.max(4.5, r.sup/ w);     // lunghezza stimata da mq
        const poly = rectPoly([r.x,r.y], w, h, theta);
        const clipped = areaPoly ? turf.intersect(poly, areaPoly) : poly;

        if(clipped){
          const layer = L.geoJSON(clipped,{
            style: {
              color: '#dfe8e6',
              weight: 1,
              fillColor: col.rectFill,
              fillOpacity: .8
            }
          }).addTo(gRect);

          // etichetta numero
          const center = turf.centerOfMass(clipped).geometry.coordinates; // [lon,lat]
          L.marker([center[1],center[0]],{
            interactive:false,
            icon: L.divIcon({
              className:'dms-num',
              html:`<div style="background:${col.labelBg};color:#f3e8c9;border:1px solid #355e5e;padding:1px 4px;border-radius:6px;font-size:11px;line-height:1">${r.id}</div>`
            })
          }).addTo(gRect);

          // popup dati reali
          layer.bindPopup(`
            <b>Posteggio #${r.id}</b><br/>
            <b>Stato:</b> ${r.stato || '-'}<br/>
            <b>Mercato:</b> ${r.mercato || (k==='TRIPOLI'?'Tripoli Giornaliero':'Esperanto Settimanale')}<br/>
            <b>Settore:</b> ${r.settore || '-'}<br/>
            <b>Superficie:</b> ${r.sup||'-'} mq<br/>
            <b>Titolare:</b> ${r.tit || '-'}<br/>
            <b>P.IVA:</b> ${r.piva || '-'}
          `);
        }
      });
    });

    // ---- ricerca per numero (sidebar)
    const input = document.querySelector('#ric_num_posteggio input, #ric_num_posteggio'); // robusto
    const btn   = document.querySelector('#ricerca_btn, #ric_num_btn, .search-btn');
    const goSearch = ()=>{
      if(!input) return;
      const val = String(input.value||'').trim();
      if(!val) return;
      let found=null;
      gRect.eachLayer(l=>{
        if(found) return;
        const gj = l.toGeoJSON && l.toGeoJSON();
        if(!gj || gj.type!=='Feature') return;
        const html = l.getPopup && l.getPopup()?.getContent?.() || '';
        if(html.includes(`Posteggio #${val}`)) found=l;
      });
      if(found){
        const b = found.getBounds ? found.getBounds() : null;
        if(b) map.fitBounds(b.pad(0.8));
        found.openPopup && found.openPopup();
      }
    };
    if(btn) btn.addEventListener('click', goSearch);
    if(input) input.addEventListener('keydown', e=>{ if(e.key==='Enter') goSearch(); });

    // ---- badge console
    console.log(`🎯 DMS-GIS • build=${build} • rettangoli=${rows.length} • EPSG:3003→WGS84`);
  })
  .catch(err=>{
    console.error('DMS-GIS • ERRORE caricamento dati:', err);
  });

})();

