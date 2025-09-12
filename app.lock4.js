// DMS GIS Grosseto - LOCK4 (rettangoli compatti PCA + area contenitore + 2 marker)
const VERSION = 'lock4';
const JSON_URL = 'dati_reali_posteggi_grosseto.json?v=' + VERSION;
const MARKETS_URL = 'data/markets.json?v=' + VERSION;
const IS_PAGES = location.hostname.endsWith('github.io');

console.info('🎯 DMS-GIS • build=%s • initializing...', VERSION);

// Definizione proiezione EPSG:3003 (Monte Mario Italy zone 1)
proj4.defs("EPSG:3003", "+proj=tmerc +lat_0=0 +lon_0=9 +k=0.9996 +x_0=1500000 +y_0=0 +ellps=intl +towgs84=-104.1,-49.1,-9.9,0.971,-2.917,0.714,-11.68 +units=m +no_defs");

// Inizializzazione mappa
const map = L.map('map', { 
    zoomControl: true,
    preferCanvas: true
}).setView([42.76, 11.11], 17);

// Tile layer con ottimizzazioni
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    detectRetina: true,
    maxZoom: 20,
    attribution: '© OpenStreetMap, © Comune di Grosseto'
}).addTo(map);

// Layer groups
const stallsLayer = L.layerGroup().addTo(map);
const marketsLayer = L.layerGroup().addTo(map);

// Variabili globali
let allStalls = [];
let marketsData = {};
let stallsGeoJSON = null;

// Funzione per convertire coordinate EPSG:3003 -> WGS84
function convertCoordinates(x, y) {
    return proj4('EPSG:3003', 'EPSG:4326', [x, y]);
}

// Funzione PCA per calcolare orientamento principale
function calculatePCA(points) {
    if (points.length < 2) return 0;
    
    // Calcola centroide
    const centroid = points.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]);
    centroid[0] /= points.length;
    centroid[1] /= points.length;
    
    // Matrice di covarianza
    let cxx = 0, cxy = 0, cyy = 0;
    points.forEach(p => {
        const dx = p[0] - centroid[0];
        const dy = p[1] - centroid[1];
        cxx += dx * dx;
        cxy += dx * dy;
        cyy += dy * dy;
    });
    
    // Autovettore principale
    const trace = cxx + cyy;
    const det = cxx * cyy - cxy * cxy;
    const lambda1 = (trace + Math.sqrt(trace * trace - 4 * det)) / 2;
    
    if (Math.abs(cxy) < 1e-10) {
        return cxx > cyy ? 0 : Math.PI / 2;
    }
    
    return Math.atan2(lambda1 - cxx, cxy);
}

// Funzione per creare rettangolo ruotato
function createRotatedRectangle(center, width, height, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const hw = width / 2;
    const hh = height / 2;
    
    const corners = [
        [-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh], [-hw, -hh]
    ];
    
    return corners.map(([x, y]) => [
        center[1] + (x * cos - y * sin) * 0.00001, // lat
        center[0] + (x * sin + y * cos) * 0.00001  // lng
    ]);
}

// Stile per posteggi
function getStallStyle(feature) {
    const stato = feature.properties.stato || 'libero';
    return {
        fillColor: stato === 'occupato' ? '#e74c3c' : '#27ae60',
        weight: 1,
        opacity: 0.8,
        color: '#2c3e50',
        fillOpacity: 0.7
    };
}

// Popup per posteggi
function onEachFeature(feature, layer) {
    if (feature.properties) {
        const props = feature.properties;
        const popup = `
            <div class="dms-area">
                <strong>Posteggio #${props.numero}</strong><br>
                <strong>Stato:</strong> ${props.stato || 'libero'}<br>
                <strong>Mercato:</strong> ${props.mercato}<br>
                <strong>Settore:</strong> ${props.settore || 'Abbigliamento'}<br>
                <strong>Superficie:</strong> ${props.superficie || '14'} mq<br>
                <strong>Titolare:</strong> ${props.titolare}<br>
                <strong>P.IVA:</strong> ${props.piva || 'N/A'}
            </div>
        `;
        layer.bindPopup(popup);
    }
}

// Caricamento dati mercati
async function loadMarketsData() {
    try {
        const response = await fetch(MARKETS_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        marketsData = await response.json();
        
        // Crea poligoni area mercato
        Object.entries(marketsData).forEach(([name, data]) => {
            const polygon = L.polygon(data.area, {
                color: '#4fd1c7',
                weight: 2,
                fillOpacity: 0.1,
                className: 'dms-hub'
            }).addTo(marketsLayer);
            
            polygon.bindPopup(`<div class="dms-area"><strong>${name}</strong><br>Area contenitore mercato</div>`);
        });
        
    } catch (error) {
        console.error('Errore caricamento mercati:', error);
    }
}

// Caricamento dati posteggi
async function loadStallsData() {
    try {
        const response = await fetch(JSON_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        allStalls = data.features || [];
        
        console.info('🎯 DMS-GIS • build=%s • rettangoli=%d', VERSION, allStalls.length);
        
        // Calcola statistiche
        updateStats();
        
        // Processa posteggi per mercato
        const stallsByMarket = {};
        allStalls.forEach(stall => {
            const mercato = stall.properties.mercato;
            if (!stallsByMarket[mercato]) stallsByMarket[mercato] = [];
            stallsByMarket[mercato].push(stall);
        });
        
        // Crea rettangoli ruotati per ogni mercato
        Object.entries(stallsByMarket).forEach(([marketName, stalls]) => {
            const marketData = marketsData[marketName];
            if (!marketData) return;
            
            // Converti coordinate EPSG:3003 -> WGS84
            const wgsStalls = stalls.map(stall => {
                const [x, y] = stall.geometry.coordinates;
                const [lng, lat] = convertCoordinates(x, y);
                return {
                    ...stall,
                    geometry: { ...stall.geometry, coordinates: [lng, lat] }
                };
            });
            
            // Calcola PCA per orientamento
            const points = wgsStalls.map(s => s.geometry.coordinates);
            const angle = calculatePCA(points);
            
            // Crea rettangoli ruotati
            const rectangles = wgsStalls.map(stall => {
                const [lng, lat] = stall.geometry.coordinates;
                const superficie = parseFloat(stall.properties.superficie) || 14;
                const width = Math.sqrt(superficie) * 2;
                const height = Math.sqrt(superficie) * 1.5;
                
                const rectCoords = createRotatedRectangle([lng, lat], width, height, angle);
                
                // Clip dentro area mercato usando turf
                const rect = turf.polygon([rectCoords]);
                const area = turf.polygon([marketData.area.map(p => [p[1], p[0]])]);
                
                try {
                    const clipped = turf.intersect(rect, area);
                    if (clipped) {
                        return {
                            ...stall,
                            geometry: clipped.geometry
                        };
                    }
                } catch (e) {
                    // Fallback: usa rettangolo originale
                }
                
                return {
                    ...stall,
                    geometry: { type: 'Polygon', coordinates: [rectCoords] }
                };
            });
            
            // Aggiungi rettangoli alla mappa
            rectangles.forEach(rect => {
                const layer = L.geoJSON(rect, {
                    style: getStallStyle,
                    onEachFeature: onEachFeature
                }).addTo(stallsLayer);
            });
            
            // Aggiungi marker centrale
            const count = stalls.length;
            const marker = L.marker(marketData.centroid, {
                icon: L.divIcon({
                    className: 'dms-area',
                    html: `<strong>${marketName.split(' ')[0]}<br>${count}</strong>`,
                    iconSize: [60, 40]
                })
            }).addTo(marketsLayer);
            
            marker.bindPopup(`
                <div class="dms-area">
                    <strong>${marketName}</strong><br>
                    Posteggi: ${count}<br>
                    Liberi: ${stalls.filter(s => s.properties.stato !== 'occupato').length}<br>
                    Occupati: ${stalls.filter(s => s.properties.stato === 'occupato').length}
                </div>
            `);
        });
        
        // Fit bounds alla mappa
        if (stallsLayer.getLayers().length > 0) {
            const group = new L.featureGroup([stallsLayer, marketsLayer]);
            map.fitBounds(group.getBounds(), { padding: [20, 20] });
        }
        
    } catch (error) {
        console.error('Errore caricamento posteggi:', error);
    }
}

// Aggiorna statistiche
function updateStats() {
    const liberi = allStalls.filter(s => s.properties.stato !== 'occupato').length;
    const occupati = allStalls.length - liberi;
    
    const statsEl = document.querySelector('.coordinate-display');
    if (statsEl) {
        statsEl.innerHTML = `
            <div>Posteggi: ${allStalls.length} | Liberi: ${liberi} | Occupati: ${occupati}</div>
        `;
    }
}

// Ricerca posteggi
function searchStalls() {
    const searchType = document.getElementById('searchType').value;
    const searchValue = document.getElementById('searchValue').value.toLowerCase().trim();
    
    if (!searchValue) return;
    
    const found = allStalls.find(stall => {
        const props = stall.properties;
        switch (searchType) {
            case 'Numero Posteggio':
                return props.numero && props.numero.toString() === searchValue;
            case 'Titolare':
                return props.titolare && props.titolare.toLowerCase().includes(searchValue);
            case 'Mercato':
                return props.mercato && props.mercato.toLowerCase().includes(searchValue);
            default:
                return false;
        }
    });
    
    if (found) {
        const [x, y] = found.geometry.coordinates;
        const [lng, lat] = convertCoordinates(x, y);
        map.setView([lat, lng], 19);
        
        // Evidenzia posteggio trovato
        setTimeout(() => {
            stallsLayer.eachLayer(layer => {
                if (layer.feature && layer.feature.properties.numero === found.properties.numero) {
                    layer.openPopup();
                }
            });
        }, 500);
    } else {
        alert('Posteggio non trovato');
    }
}

// Toggle layer
function toggleLayer(layerName, checkbox) {
    if (layerName === 'Posteggi Mercati') {
        if (checkbox.checked) {
            map.addLayer(stallsLayer);
        } else {
            map.removeLayer(stallsLayer);
        }
    } else if (layerName === 'Mercati') {
        if (checkbox.checked) {
            map.addLayer(marketsLayer);
        } else {
            map.removeLayer(marketsLayer);
        }
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Carica dati
    await loadMarketsData();
    await loadStallsData();
    
    // Setup ricerca
    const searchBtn = document.querySelector('.search-group button');
    if (searchBtn) {
        searchBtn.onclick = searchStalls;
    }
    
    // Setup toggle layers
    document.querySelectorAll('.layer-item input[type="checkbox"]').forEach(checkbox => {
        const label = checkbox.nextElementSibling;
        if (label) {
            checkbox.onchange = () => toggleLayer(label.textContent.trim(), checkbox);
        }
    });
    
    // Coordinate display
    map.on('mousemove', (e) => {
        const { lat, lng } = e.latlng;
        const [x, y] = proj4('EPSG:4326', 'EPSG:3003', [lng, lat]);
        
        const coordEl = document.querySelector('.coordinate-display');
        if (coordEl) {
            coordEl.innerHTML = `
                <div>X: ${x.toFixed(2)}, Y: ${y.toFixed(2)} [EPSG:3003]</div>
                <div>Posteggi: ${allStalls.length} | Build: ${VERSION}</div>
            `;
        }
    });
});

