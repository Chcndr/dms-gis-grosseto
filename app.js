// Sistema GIS Mercati Grosseto - Versione Completa
// Basato sul sistema originale g3w-suite

// Configurazione globale
let map;
let posteggiLayer;
let currentPosteggi = [];
let isRightSidebarOpen = false;

// Dati posteggi completi (180 posteggi)
const POSTEGGI_DATA = [];

// Genera 180 posteggi realistici
function generatePosteggiData() {
    const settori = ["Alimentare", "Abbigliamento", "Casalinghi", "Vario", "Fiori e Piante", "Libri e Cartoleria", "Calzature", "Pelletteria"];
    const nomi = ["Mario Rossi", "Giuseppe Verdi", "Anna Bianchi", "Marco Neri", "Lucia Gialli", "Franco Blu", "Carla Verde", "Stefano Rossi", "Elena Bianchi", "Paolo Grigi", "Sara Viola", "Andrea Rossi", "Giulia Bianchi", "Roberto Verdi", "Francesca Neri"];
    
    // Coordinate base per distribuzione realistica nel centro di Grosseto
    const baseCoords = [
        [11.1093, 42.7639], // Centro storico
        [11.1105, 42.7645], // Via Mazzini
        [11.1088, 42.7635], // Piazza Dante
        [11.1110, 42.7650], // Via Cavour
        [11.1085, 42.7632], // Corso Carducci
        [11.1100, 42.7648], // Via Roma
        [11.1090, 42.7642], // Via Garibaldi
        [11.1108, 42.7638]  // Piazza del Duomo
    ];
    
    for (let i = 1; i <= 180; i++) {
        const baseCoord = baseCoords[Math.floor(Math.random() * baseCoords.length)];
        const offsetLng = (Math.random() - 0.5) * 0.003; // Variazione longitudine
        const offsetLat = (Math.random() - 0.5) * 0.002; // Variazione latitudine
        
        const isOccupato = Math.random() > 0.35; // 65% occupati
        const mercato = i <= 175 ? "Tripoli Giornaliero" : "Esperanto Settimanale-Giovedì";
        const codInt = mercato === "Tripoli Giornaliero" ? `TG${i.toString().padStart(3, '0')}` : `ES${(i-175).toString().padStart(3, '0')}`;
        
        POSTEGGI_DATA.push({
            "type": "Feature",
            "properties": {
                "numero": i.toString(),
                "titolare": isOccupato ? nomi[Math.floor(Math.random() * nomi.length)] : "",
                "stato": isOccupato ? "Occupato" : "Libero",
                "settore": settori[Math.floor(Math.random() * settori.length)],
                "superficie": (Math.floor(Math.random() * 4) * 4 + 12).toString(), // 12, 16, 20, 24
                "mercato": mercato,
                "cod_int": codInt
            },
            "geometry": {
                "type": "Point",
                "coordinates": [
                    baseCoord[0] + offsetLng,
                    baseCoord[1] + offsetLat
                ]
            }
        });
    }
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inizializzazione sistema GIS Grosseto...');
    
    // Genera posteggi
    generatePosteggiData();
    console.log(`📊 Generati ${POSTEGGI_DATA.length} posteggi totali`);
    
    // Inizializza mappa
    initializeMap();
    
    // Carica posteggi automaticamente
    loadPosteggi();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('✅ Sistema inizializzato correttamente');
});

// Inizializzazione mappa
function initializeMap() {
    // Coordinate centro Grosseto
    const grossetoCenter = [42.7639, 11.1093];
    
    // Crea mappa
    map = L.map('map', {
        center: grossetoCenter,
        zoom: 18,
        zoomControl: false
    });
    
    // Layer base OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap, © Comune di Grosseto',
        maxZoom: 20
    }).addTo(map);
    
    // Event listeners mappa
    map.on('mousemove', updateCoordinates);
    map.on('zoomend', updateScale);
    
    console.log('🗺️ Mappa inizializzata');
}

// Caricamento posteggi
function loadPosteggi() {
    console.log('📍 Caricamento posteggi...');
    
    // Rimuovi layer esistente
    if (posteggiLayer) {
        map.removeLayer(posteggiLayer);
    }
    
    // Crea nuovo layer
    posteggiLayer = L.layerGroup();
    currentPosteggi = [];
    
    // Filtra posteggi in base ai layer attivi
    const esperantoActive = document.getElementById('layerEsperanto').checked;
    const tripoliActive = document.getElementById('layerTripoli').checked;
    
    POSTEGGI_DATA.forEach(posteggio => {
        const mercato = posteggio.properties.mercato;
        
        // Controlla se il layer è attivo
        if ((mercato === "Esperanto Settimanale-Giovedì" && !esperantoActive) ||
            (mercato === "Tripoli Giornaliero" && !tripoliActive)) {
            return;
        }
        
        // Crea marker rettangolare
        const coords = [posteggio.geometry.coordinates[1], posteggio.geometry.coordinates[0]];
        const stato = posteggio.properties.stato;
        const superficie = parseInt(posteggio.properties.superficie);
        
        // Colore in base allo stato
        let color;
        switch (stato) {
            case 'Libero': color = '#28a745'; break;
            case 'Occupato': color = '#dc3545'; break;
            case 'Riservato': color = '#007bff'; break;
            case 'Temporaneo': color = '#fd7e14'; break;
            default: color = '#6c757d';
        }
        
        // Dimensioni proporzionali alla superficie
        const width = Math.sqrt(superficie) * 3;
        const height = width * 0.6;
        
        // Crea rettangolo
        const bounds = [
            [coords[0] - height/100000, coords[1] - width/100000],
            [coords[0] + height/100000, coords[1] + width/100000]
        ];
        
        const rectangle = L.rectangle(bounds, {
            color: '#ffffff',
            fillColor: color,
            fillOpacity: 0.8,
            weight: 2,
            opacity: 1
        });
        
        // Popup
        const popupContent = `
            <div class="posteggio-popup">
                <h4>Posteggio #${posteggio.properties.numero}</h4>
                <p><strong>Mercato:</strong> ${posteggio.properties.mercato}</p>
                <p><strong>Stato:</strong> <span class="stato-${stato.toLowerCase()}">${stato}</span></p>
                <p><strong>Settore:</strong> ${posteggio.properties.settore}</p>
                <p><strong>Superficie:</strong> ${posteggio.properties.superficie} mq</p>
                ${posteggio.properties.titolare ? `<p><strong>Titolare:</strong> ${posteggio.properties.titolare}</p>` : ''}
                <p><strong>Codice:</strong> ${posteggio.properties.cod_int}</p>
            </div>
        `;
        
        rectangle.bindPopup(popupContent);
        
        // Aggiungi al layer
        posteggiLayer.addLayer(rectangle);
        currentPosteggi.push(posteggio);
    });
    
    // Aggiungi layer alla mappa
    posteggiLayer.addTo(map);
    
    // Aggiorna statistiche
    updateStatistics();
    
    // Popola sidebar
    populatePosteggiList();
    
    console.log(`✅ Caricati ${currentPosteggi.length} posteggi`);
}

// Aggiornamento statistiche
function updateStatistics() {
    const liberi = currentPosteggi.filter(p => p.properties.stato === 'Libero').length;
    const occupati = currentPosteggi.filter(p => p.properties.stato === 'Occupato').length;
    const riservati = currentPosteggi.filter(p => p.properties.stato === 'Riservato').length;
    const temporanei = currentPosteggi.filter(p => p.properties.stato === 'Temporaneo').length;
    
    const statsHtml = `
        <div class="stat-item">
            <span>Totale posteggi:</span>
            <span><strong>${currentPosteggi.length}</strong></span>
        </div>
        <div class="stat-item">
            <span>Liberi:</span>
            <span style="color: #28a745;"><strong>${liberi}</strong></span>
        </div>
        <div class="stat-item">
            <span>Occupati:</span>
            <span style="color: #dc3545;"><strong>${occupati}</strong></span>
        </div>
        <div class="stat-item">
            <span>Riservati:</span>
            <span style="color: #007bff;"><strong>${riservati}</strong></span>
        </div>
        <div class="stat-item">
            <span>Temporanei:</span>
            <span style="color: #fd7e14;"><strong>${temporanei}</strong></span>
        </div>
        <div class="stat-item">
            <span>Tasso occupazione:</span>
            <span><strong>${Math.round((occupati / currentPosteggi.length) * 100)}%</strong></span>
        </div>
    `;
    
    const statsContainer = document.getElementById('sidebarStats');
    if (statsContainer) {
        statsContainer.innerHTML = statsHtml;
    }
}

// Popolamento lista posteggi
function populatePosteggiList() {
    const listContainer = document.getElementById('posteggiList');
    if (!listContainer) return;
    
    const filterInput = document.getElementById('filterInput');
    const statusFilter = document.getElementById('statusFilter');
    
    let filteredPosteggi = currentPosteggi;
    
    // Applica filtri
    if (filterInput && filterInput.value) {
        const searchTerm = filterInput.value.toLowerCase();
        filteredPosteggi = filteredPosteggi.filter(p => 
            p.properties.numero.includes(searchTerm) ||
            p.properties.titolare.toLowerCase().includes(searchTerm)
        );
    }
    
    if (statusFilter && statusFilter.value) {
        filteredPosteggi = filteredPosteggi.filter(p => 
            p.properties.stato === statusFilter.value
        );
    }
    
    // Genera HTML
    const listHtml = filteredPosteggi.map(posteggio => `
        <div class="posteggio-item" onclick="focusPosteggio('${posteggio.properties.numero}')">
            <div class="posteggio-header">
                <span class="posteggio-numero">Posteggio #${posteggio.properties.numero}</span>
                <span class="posteggio-stato ${posteggio.properties.stato.toLowerCase()}">${posteggio.properties.stato}</span>
            </div>
            <div class="posteggio-details">
                <div><strong>Mercato:</strong> ${posteggio.properties.mercato}</div>
                <div><strong>Settore:</strong> ${posteggio.properties.settore}</div>
                <div><strong>Superficie:</strong> ${posteggio.properties.superficie} mq</div>
                ${posteggio.properties.titolare ? `<div><strong>Titolare:</strong> ${posteggio.properties.titolare}</div>` : ''}
            </div>
        </div>
    `).join('');
    
    listContainer.innerHTML = listHtml;
}

// Focus su posteggio specifico
function focusPosteggio(numero) {
    const posteggio = currentPosteggi.find(p => p.properties.numero === numero);
    if (posteggio) {
        const coords = [posteggio.geometry.coordinates[1], posteggio.geometry.coordinates[0]];
        map.setView(coords, 20);
        
        // Trova e apri popup
        posteggiLayer.eachLayer(layer => {
            if (layer.getBounds && layer.getBounds().contains(coords)) {
                layer.openPopup();
            }
        });
    }
}

// Setup event listeners
function setupEventListeners() {
    // Controlli zoom
    document.getElementById('zoomIn').addEventListener('click', () => {
        map.zoomIn();
    });
    
    document.getElementById('zoomOut').addEventListener('click', () => {
        map.zoomOut();
    });
    
    // Layer controls
    document.getElementById('layerEsperanto').addEventListener('change', loadPosteggi);
    document.getElementById('layerTripoli').addEventListener('change', loadPosteggi);
    
    // Ricerca
    document.getElementById('btnSearch').addEventListener('click', performSearch);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    
    // Filtri sidebar
    const filterInput = document.getElementById('filterInput');
    const statusFilter = document.getElementById('statusFilter');
    
    if (filterInput) {
        filterInput.addEventListener('input', populatePosteggiList);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', populatePosteggiList);
    }
    
    // Ricerca indirizzi
    document.getElementById('btnAddressSearch').addEventListener('click', searchAddress);
    document.getElementById('addressInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchAddress();
    });
    
    // Header buttons
    document.getElementById('btnConfigDMS').addEventListener('click', configureDMS);
    document.getElementById('btnStats').addEventListener('click', showStatistics);
}

// Ricerca posteggi
function performSearch() {
    const searchType = document.getElementById('searchType').value;
    const searchValue = document.getElementById('searchInput').value;
    
    if (!searchValue) return;
    
    const results = currentPosteggi.filter(posteggio => {
        switch (searchType) {
            case 'numero':
                return posteggio.properties.numero.includes(searchValue);
            case 'titolare':
                return posteggio.properties.titolare.toLowerCase().includes(searchValue.toLowerCase());
            case 'mercato':
                return posteggio.properties.mercato.toLowerCase().includes(searchValue.toLowerCase());
            default:
                return false;
        }
    });
    
    if (results.length > 0) {
        const firstResult = results[0];
        focusPosteggio(firstResult.properties.numero);
        
        // Mostra risultati nella sidebar
        if (!isRightSidebarOpen) {
            toggleRightSidebar();
        }
    } else {
        alert('Nessun risultato trovato');
    }
}

// Ricerca indirizzi
function searchAddress() {
    const address = document.getElementById('addressInput').value;
    if (!address) return;
    
    // Geocoding semplificato per Grosseto
    const grossetoAddresses = {
        'piazza dante': [42.7639, 11.1093],
        'via mazzini': [42.7645, 11.1105],
        'corso carducci': [42.7632, 11.1085],
        'via cavour': [42.7650, 11.1110]
    };
    
    const normalizedAddress = address.toLowerCase();
    const coords = grossetoAddresses[normalizedAddress];
    
    if (coords) {
        map.setView(coords, 18);
    } else {
        alert('Indirizzo non trovato');
    }
}

// Toggle sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebarLeft');
    sidebar.classList.toggle('collapsed');
}

function toggleRightSidebar() {
    const sidebar = document.getElementById('sidebarRight');
    sidebar.classList.toggle('open');
    isRightSidebarOpen = !isRightSidebarOpen;
}

// Aggiornamento coordinate
function updateCoordinates(e) {
    const coords = document.getElementById('coordinates');
    if (coords) {
        // Converti in EPSG:3003 (approssimativo)
        const x = Math.round(e.latlng.lng * 100000);
        const y = Math.round(e.latlng.lat * 100000);
        coords.textContent = `X: ${x}, Y: ${y} [EPSG:3003]`;
    }
}

// Aggiornamento scala
function updateScale() {
    const scale = document.getElementById('scale');
    if (scale) {
        const zoom = map.getZoom();
        const scaleValue = Math.round(591657527.591555 / Math.pow(2, zoom));
        scale.textContent = `1:${scaleValue}`;
    }
}

// API DMS Integration
function configureDMS() {
    const dmsUrl = prompt('Inserisci URL del tuo sistema DMS:');
    if (dmsUrl) {
        localStorage.setItem('dms_url', dmsUrl);
        alert('Configurazione DMS salvata!');
    }
}

function showStatistics() {
    if (!isRightSidebarOpen) {
        toggleRightSidebar();
    }
}

// Export per debugging
window.GIS_DEBUG = {
    map: () => map,
    posteggi: () => currentPosteggi,
    reload: loadPosteggi
};

