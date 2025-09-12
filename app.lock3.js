// DMS GIS Grosseto - Hotfix lock3 (no CDN, layer Leaflet veri)
const VERSION = 'lock3';
const JSON_URL = 'dati_reali_posteggi_grosseto.json?v=' + VERSION;  // relativo alla root Pages
const IS_PAGES = location.hostname.endsWith('github.io');

console.info('🎯 DMS-GIS • build=%s • data=%s', VERSION, JSON_URL);

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
const stallsLayer = L.featureGroup().addTo(map);
const mercatiLayer = L.featureGroup().addTo(map);
let stallsGeoJSON = null;

// Variabili globali
let allStalls = [];
let statsData = { total: 0, occupied: 0, free: 0, reserved: 0, temp: 0 };

// Stili per i posteggi
const getStallStyle = (properties) => {
    const stato = properties?.stato?.toLowerCase() || 'libero';
    let color = '#2bb673'; // verde per libero
    
    if (stato.includes('occupato')) color = '#c05252'; // rosso per occupato
    else if (stato.includes('riservato')) color = '#f39c12'; // arancione per riservato
    else if (stato.includes('temporaneo')) color = '#9b59b6'; // viola per temporaneo
    
    return {
        color: color,
        weight: 2,
        fillOpacity: 0.7,
        fillColor: color
    };
};

// Popup per ogni posteggio
function onEachFeature(feature, layer) {
    const p = feature.properties || {};
    const popup = `
        <div class="popup-content">
            <h4>Posteggio #${p.numero || '-'}</h4>
            <p><strong>Stato:</strong> ${p.stato || '—'}</p>
            <p><strong>Mercato:</strong> ${p.mercato || '—'}</p>
            <p><strong>Settore:</strong> ${p.settore || '—'}</p>
            <p><strong>Superficie:</strong> ${p.superficie || '—'}</p>
            <p><strong>Titolare:</strong> ${p.titolare || '—'}</p>
            <p><strong>P.IVA:</strong> ${p.piva || '—'}</p>
        </div>
    `;
    layer.bindPopup(popup);
}

// Caricamento e processamento dati
async function loadStallsData() {
    try {
        console.info('🎯 DMS-GIS • loading data from:', JSON_URL);
        
        const response = await fetch(JSON_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        allStalls = data.features || [];
        
        console.info('🎯 DMS-GIS • OK • records=%d • EPSG:3003→WGS84', allStalls.length);
        
        // Calcola statistiche
        updateStats();
        
        // Crea layer GeoJSON
        stallsGeoJSON = L.geoJSON(data, {
            style: getStallStyle,
            onEachFeature: onEachFeature
        }).addTo(stallsLayer);
        
        // Fit bounds alla mappa
        if (stallsLayer.getLayers().length > 0) {
            map.fitBounds(stallsLayer.getBounds(), { padding: [20, 20] });
        }
        
        // Aggiorna UI
        updateStallsList();
        
    } catch (error) {
        console.error('🎯 DMS-GIS • ERROR loading data:', error);
        showError('Errore nel caricamento dei dati: ' + error.message);
    }
}

// Aggiornamento statistiche
function updateStats() {
    statsData = { total: 0, occupied: 0, free: 0, reserved: 0, temp: 0 };
    
    allStalls.forEach(feature => {
        const stato = feature.properties?.stato?.toLowerCase() || 'libero';
        statsData.total++;
        
        if (stato.includes('occupato')) statsData.occupied++;
        else if (stato.includes('riservato')) statsData.reserved++;
        else if (stato.includes('temporaneo')) statsData.temp++;
        else statsData.free++;
    });
    
    // Aggiorna DOM
    const statsEl = document.getElementById('stallsStats');
    if (statsEl) {
        const occupancyRate = statsData.total > 0 ? Math.round((statsData.occupied / statsData.total) * 100) : 0;
        statsEl.innerHTML = `
            <h4>Elenco Posteggi</h4>
            <p>Totale posteggi: <strong>${statsData.total}</strong></p>
            <p>Liberi: <strong>${statsData.free}</strong></p>
            <p>Occupati: <strong>${statsData.occupied}</strong></p>
            <p>Riservati: <strong>${statsData.reserved}</strong></p>
            <p>Temporanei: <strong>${statsData.temp}</strong></p>
            <p>Tasso occupazione: <strong>${occupancyRate}%</strong></p>
        `;
    }
}

// Aggiornamento lista posteggi
function updateStallsList() {
    const listEl = document.getElementById('stallsList');
    if (!listEl) return;
    
    let html = '';
    allStalls.slice(0, 50).forEach(feature => { // Mostra solo primi 50 per performance
        const p = feature.properties || {};
        const stato = p.stato || 'Libero';
        const statusClass = stato.toLowerCase().includes('occupato') ? 'occupied' : 'free';
        
        html += `
            <div class="stall-item ${statusClass}" data-numero="${p.numero}">
                <h5>Posteggio #${p.numero || '-'} <span class="status">${stato}</span></h5>
                <p><strong>Mercato:</strong> ${p.mercato || '—'}</p>
                <p><strong>Settore:</strong> ${p.settore || '—'}</p>
                <p><strong>Superficie:</strong> ${p.superficie || '—'}</p>
                ${p.titolare ? `<p><strong>Titolare:</strong> ${p.titolare}</p>` : ''}
            </div>
        `;
    });
    
    listEl.innerHTML = html;
    
    // Aggiungi click handlers
    listEl.querySelectorAll('.stall-item').forEach(item => {
        item.addEventListener('click', () => {
            const numero = item.dataset.numero;
            searchStallByNumber(numero);
        });
    });
}

// Ricerca posteggio per numero
function searchStallByNumber(numero) {
    if (!stallsGeoJSON) return;
    
    let found = null;
    stallsGeoJSON.eachLayer(layer => {
        if (String(layer.feature?.properties?.numero) === String(numero)) {
            found = layer;
        }
    });
    
    if (found) {
        map.fitBounds(found.getBounds(), { padding: [50, 50] });
        found.openPopup();
        
        // Highlight temporaneo
        const originalStyle = found.options.style || getStallStyle(found.feature.properties);
        found.setStyle({ ...originalStyle, weight: 4, color: '#ff0000' });
        setTimeout(() => {
            found.setStyle(originalStyle);
        }, 2000);
    }
}

// Toggle layer
function toggleLayer(layerName, checkbox) {
    switch(layerName) {
        case 'posteggi':
            if (checkbox.checked) {
                map.addLayer(stallsLayer);
            } else {
                map.removeLayer(stallsLayer);
            }
            break;
        case 'mercati':
            if (checkbox.checked) {
                map.addLayer(mercatiLayer);
            } else {
                map.removeLayer(mercatiLayer);
            }
            break;
    }
}

// Gestione errori
function showError(message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
    errorEl.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        background: #c05252; color: white; padding: 15px 20px;
        border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(errorEl);
    
    setTimeout(() => {
        errorEl.remove();
    }, 5000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Toggle posteggi
    const togglePosteggi = document.querySelector('input[type="checkbox"][id*="posteggi"], input[type="checkbox"][id*="Posteggi"]');
    if (togglePosteggi) {
        togglePosteggi.addEventListener('change', (e) => {
            toggleLayer('posteggi', e.target);
        });
    }
    
    // Toggle mercati
    const toggleMercati = document.querySelector('input[type="checkbox"][id*="mercati"], input[type="checkbox"][id*="Mercati"]');
    if (toggleMercati) {
        toggleMercati.addEventListener('change', (e) => {
            toggleLayer('mercati', e.target);
        });
    }
    
    // Search - cerca per selettore più generico
    const searchBtn = document.querySelector('button[id*="search"], button[id*="Search"], button[id*="cerca"], button[id*="Cerca"]');
    const searchInput = document.querySelector('input[placeholder*="valore"], input[placeholder*="numero"], input[placeholder*="Numero"]');
    
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query) {
                searchStallByNumber(query);
            }
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
    }
    
    // Disabilita funzioni di scrittura su GitHub Pages
    if (IS_PAGES) {
        document.querySelectorAll('.needs-write').forEach(el => el.remove());
        console.info('🎯 DMS-GIS • Pages mode: write functions disabled');
    }
    
    // Carica dati
    loadStallsData();
});

// Sidebar toggle
function toggleSidebar() {
    const sidebar = document.getElementById('sidebarLeft');
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
    }
}

// Coordinate display
map.on('mousemove', (e) => {
    const coordsEl = document.querySelector('.leaflet-control-coordinates');
    if (coordsEl) {
        const { lat, lng } = e.latlng;
        // Converti in EPSG:3003
        const projected = proj4('EPSG:4326', 'EPSG:3003', [lng, lat]);
        coordsEl.innerHTML = `X: ${projected[0].toFixed(2)}, Y: ${projected[1].toFixed(2)} [EPSG:3003]`;
    }
});

// Aggiungi controllo coordinate
const coordsControl = L.control({ position: 'bottomleft' });
coordsControl.onAdd = function() {
    const div = L.DomUtil.create('div', 'leaflet-control-coordinates');
    div.style.cssText = 'background: rgba(255,255,255,0.8); padding: 5px; border-radius: 3px; font-size: 12px;';
    div.innerHTML = 'X: -, Y: - [EPSG:3003]';
    return div;
};
coordsControl.addTo(map);

console.info('🎯 DMS-GIS • initialization complete');

