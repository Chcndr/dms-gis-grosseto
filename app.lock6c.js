(()=>{const BUILD=window.DMS_BUILD||'lock6c';
const log=(...a)=>console.log('🎯 DMS-GIS • '+BUILD,'•',...a);
const banner=m=>{const n=document.createElement('div');n.className='dms-banner';n.textContent=m;document.body.appendChild(n);setTimeout(()=>n.remove(),4000);}
const ready=f=>document.readyState!=='loading'?f():document.addEventListener('DOMContentLoaded',f);
async function waitForLibs(){const ok=()=>window.L&&window.turf;const t0=Date.now();while(!ok()){await new Promise(r=>setTimeout(r,60));if(Date.now()-t0>4000) throw new Error('libs not loaded');}}
function norm(f){const c=f.geometry.coordinates;if(Math.abs(c[0])<=90&&Math.abs(c[1])>90) f.geometry.coordinates=[c[1],c[0]];return f;}
ready(async()=>{try{
  await waitForLibs();
  const mapEl=document.getElementById('map')||document.querySelector('#mappa,.map,.leaflet-map,[data-map]');
  if(!mapEl) throw new Error('map element not found');
  const map=L.map(mapEl).setView([42.7628,11.1090],15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OSM'}).addTo(map);
  const url='./dati_reali_posteggi_grosseto.json?v=lock6c';
  const gj=await fetch(url,{cache:'no-store'}).then(r=>r.json());
  const feats=gj.features.map(norm);
  const by=(k)=>feats.filter(f=>(f.properties.mercato||'').toLowerCase().includes(k));
  const trip=by('tripoli giornaliero'), esper=by('esperanto settimanale');
  const toPoly=(arr)=>{ if(arr.length<3) return null;
    const fc={type:'FeatureCollection',features:arr.map(p=>({type:'Feature',geometry:{type:'Point',coordinates:p.geometry.coordinates}}))};
    let poly=turf.concave(fc,{maxEdge:0.2,units:'kilometers'}); if(!poly) poly=turf.convex(fc); return poly; };
  const draw=(arr,opt,label)=>{arr.forEach(f=>L.circleMarker([f.geometry.coordinates[1],f.geometry.coordinates[0]],{radius:3,opacity:.15,fillOpacity:.15}).addTo(map));
    const poly=toPoly(arr); if(!poly) return;
    const ring=poly.geometry.coordinates[0].map(([x,y])=>[y,x]);
    const ply=L.polygon(ring,{color:opt.color,weight:2,fillOpacity:.08}).addTo(map);
    const c=turf.centroid(poly).geometry.coordinates;
    L.circleMarker([c[1],c[0]],{radius:6,className:'hub-dot'}).addTo(map)
      .bindTooltip(label,{permanent:true,direction:'top',className:'hub-label'});
    return ply.getBounds(); };
  const b1=draw(trip,{color:'#0FA3A3'},'Tripoli (175)');
  const b2=draw(esper,{color:'#C8F560'},'Esperanto (5)');
  const B=L.latLngBounds([]); if(b1) B.extend(b1); if(b2) B.extend(b2); if(B.isValid()) map.fitBounds(B.pad(.15));
  log('OK • points=',feats.length,'tripoli=',trip.length,'esper=',esper.length);
}catch(e){console.error(e);banner('DMS-GIS: avvio ridotto. Vedi console.');}});})();

