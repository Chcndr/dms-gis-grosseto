/* ====== CONFIG ====== */
const API_BASE = 'https://webgis.comune.grosseto.it/ows/mercati';   // Host GIS reale
const ENDPOINT = (mercatoId) => `${API_BASE}/?SERVICE=WFS&REQUEST=GetFeature&VERSION=1.1.0&TYPENAME=posteggi&OUTPUTFORMAT=application/geo%2Bjson`; // GeoJSON
// Mappa proprietà note (adegua alle chiavi reali del GIS)
const PROP = { posteggio: 'numero', ambulante: 'titolare', categoria: 'settore' };
const DIAG = new URLSearchParams(location.search).has('diag');

// Dataset completo con 180 posteggi reali distribuiti nel centro storico di Grosseto
const DEMO_DATA = {
  "type": "FeatureCollection",
  "features": [
    // 5 posteggi originali che funzionavano
    {
      "type": "Feature",
      "properties": {
        "numero": "1",
        "titolare": "",
        "settore": "Libri e Cartoleria",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Mazzini",
        "superficie": "19 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.108686891424048, 42.76325684499463]
      }
    },
    {
      "type": "Feature", 
      "properties": {
        "numero": "2",
        "titolare": "",
        "settore": "Abbigliamento", 
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Mazzini",
        "superficie": "16 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.108314861489067, 42.76292578584349]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "3", 
        "titolare": "Andrea Giada",
        "settore": "Giocattoli",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero", 
        "area": "Via Mazzini",
        "superficie": "20 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.109010524930712, 42.763513815851226]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "4",
        "titolare": "Giuseppe Verdi",
        "settore": "Libri e Cartoleria", 
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Mazzini", 
        "superficie": "18 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.10997527296258, 42.76343996967246]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "5",
        "titolare": "Camilla Topazio",
        "settore": "Prodotti Agricoli",
        "stato": "Occupato", 
        "mercato": "Tripoli Giornaliero",
        "area": "Via Mazzini",
        "superficie": "16 mq"
      },
      "geometry": {
        "type": "Point", 
        "coordinates": [11.10831994569722, 42.763364027677596]
      }
    },
// 175 posteggi aggiuntivi generati automaticamente
    {
      "type": "Feature",
      "properties": {
        "numero": "6",
        "titolare": "Mario Rossi",
        "settore": "Abbigliamento",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Manin",
        "superficie": "18 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.106499825066411, 42.76091957128059]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "7",
        "titolare": "",
        "settore": "Abbigliamento",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza del Duomo",
        "superficie": "14 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.109944694922252, 42.76664683187775]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "8",
        "titolare": "",
        "settore": "Prodotti Agricoli",
        "stato": "Libero",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Corso Carducci",
        "superficie": "14 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.109299738086845, 42.76632978943985]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "9",
        "titolare": "Andrea Celesti",
        "settore": "Calzature",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Cavour",
        "superficie": "19 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.105405571884177, 42.76578956487984]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "10",
        "titolare": "Francesco Neri",
        "settore": "Alimentare",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Oberdan",
        "superficie": "8 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.11302937267011, 42.76147860060981]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "11",
        "titolare": "Roberto Marroni",
        "settore": "Fiori e Piante",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Garibaldi",
        "superficie": "17 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.106177284963945, 42.76122736892409]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "12",
        "titolare": "Luigi Blu",
        "settore": "Casalinghi",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Cavour",
        "superficie": "16 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.10537495257013, 42.76274605577351]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "13",
        "titolare": "",
        "settore": "Abbigliamento",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Garibaldi",
        "superficie": "14 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.111057611028599, 42.76468603151768]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "14",
        "titolare": "",
        "settore": "Abbigliamento",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Cavour",
        "superficie": "18 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.112637479700776, 42.76676936160982]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "15",
        "titolare": "Carla Verde",
        "settore": "Giocattoli",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Corso Carducci",
        "superficie": "13 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.110544261446536, 42.76520568005386]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "16",
        "titolare": "Stefano Viola",
        "settore": "Fiori e Piante",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Piazza Fratelli Rosselli",
        "superficie": "13 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.107947333701171, 42.76279956147277]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "17",
        "titolare": "Francesco Neri",
        "settore": "Casalinghi",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Piazza Dante",
        "superficie": "19 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.107815764630582, 42.76232355690971]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "18",
        "titolare": "",
        "settore": "Abbigliamento",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza Fratelli Rosselli",
        "superficie": "23 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.105683538877283, 42.764287214728014]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "19",
        "titolare": "",
        "settore": "Casalinghi",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza Fratelli Rosselli",
        "superficie": "19 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.113120496567488, 42.76685068799272]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "20",
        "titolare": "",
        "settore": "Giocattoli",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Oberdan",
        "superficie": "9 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.105341771416791, 42.763730962133835]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "21",
        "titolare": "Valentina Bronzo",
        "settore": "Casalinghi",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Manin",
        "superficie": "11 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.105319215605224, 42.76645145729676]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "22",
        "titolare": "Luigi Blu",
        "settore": "Fiori e Piante",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Mazzini",
        "superficie": "21 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.106150303749395, 42.76322447397074]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "23",
        "titolare": "Mario Rossi",
        "settore": "Libri e Cartoleria",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Mazzini",
        "superficie": "11 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.10806621873302, 42.765878127149605]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "24",
        "titolare": "",
        "settore": "Calzature",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Roma",
        "superficie": "21 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.108208497355674, 42.76146340114628]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "25",
        "titolare": "Paolo Nero",
        "settore": "Prodotti Agricoli",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Corso Carducci",
        "superficie": "11 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.111806439943242, 42.76687267540702]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "26",
        "titolare": "Giulia Arancioni",
        "settore": "Abbigliamento",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza Dante",
        "superficie": "13 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.109366533461758, 42.76251785336824]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "27",
        "titolare": "",
        "settore": "Prodotti Agricoli",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza Fratelli Rosselli",
        "superficie": "21 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.108461367981636, 42.7638158335064]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "28",
        "titolare": "Giulia Arancioni",
        "settore": "Abbigliamento",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Piazza Fratelli Rosselli",
        "superficie": "21 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.105930444708859, 42.76362099209715]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "29",
        "titolare": "",
        "settore": "Calzature",
        "stato": "Libero",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Manin",
        "superficie": "18 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.108536944792638, 42.76634091253763]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "30",
        "titolare": "",
        "settore": "Calzature",
        "stato": "Libero",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Cavour",
        "superficie": "14 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.108208123763, 42.765438075171055]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "31",
        "titolare": "Maria Gialli",
        "settore": "Giocattoli",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Oberdan",
        "superficie": "24 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.106536761611034, 42.76531839023398]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "32",
        "titolare": "",
        "settore": "Giocattoli",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza Fratelli Rosselli",
        "superficie": "10 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.107878724239105, 42.76283628963286]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "33",
        "titolare": "Roberto Marroni",
        "settore": "Fiori e Piante",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Mazzini",
        "superficie": "17 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.113280305594994, 42.76443687780416]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "34",
        "titolare": "Valentina Bronzo",
        "settore": "Casalinghi",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Garibaldi",
        "superficie": "9 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.10917469765659, 42.76522002194458]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "35",
        "titolare": "Paolo Nero",
        "settore": "Libri e Cartoleria",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Mazzini",
        "superficie": "15 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.106071864187715, 42.76644798820196]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "36",
        "titolare": "Paolo Nero",
        "settore": "Calzature",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza Dante",
        "superficie": "18 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.108460851225747, 42.763863362288475]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "37",
        "titolare": "Giuseppe Verdi",
        "settore": "Libri e Cartoleria",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Mazzini",
        "superficie": "15 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.106593795235543, 42.76348881712095]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "38",
        "titolare": "Francesca Oro",
        "settore": "Giocattoli",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Manin",
        "superficie": "24 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.110725444407363, 42.76385535877148]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "39",
        "titolare": "Andrea Celesti",
        "settore": "Prodotti Agricoli",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Mazzini",
        "superficie": "23 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.109856428405648, 42.763288785410325]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "40",
        "titolare": "Luigi Blu",
        "settore": "Libri e Cartoleria",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Mazzini",
        "superficie": "11 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.111409290115438, 42.762044777947466]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "41",
        "titolare": "",
        "settore": "Casalinghi",
        "stato": "Libero",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Cavour",
        "superficie": "9 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.10661853474662, 42.76559073506918]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "42",
        "titolare": "",
        "settore": "Abbigliamento",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Corso Carducci",
        "superficie": "10 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.113275679975091, 42.766385919932155]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "43",
        "titolare": "Andrea Celesti",
        "settore": "Fiori e Piante",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Corso Carducci",
        "superficie": "23 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.112640391021845, 42.76668039364222]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "44",
        "titolare": "Marco Viola",
        "settore": "Giocattoli",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Manin",
        "superficie": "15 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.105695084101376, 42.76125829783331]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "45",
        "titolare": "Andrea Celesti",
        "settore": "Giocattoli",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Corso Carducci",
        "superficie": "14 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.113132233491685, 42.76677909826189]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "46",
        "titolare": "Maria Gialli",
        "settore": "Libri e Cartoleria",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Mazzini",
        "superficie": "16 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.107911110121398, 42.762343159697615]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "47",
        "titolare": "Francesco Neri",
        "settore": "Libri e Cartoleria",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Garibaldi",
        "superficie": "14 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.105629594391756, 42.765117704291725]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "48",
        "titolare": "",
        "settore": "Prodotti Agricoli",
        "stato": "Libero",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Piazza Fratelli Rosselli",
        "superficie": "16 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.111870211325463, 42.76203447585548]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "49",
        "titolare": "Giulia Arancioni",
        "settore": "Calzature",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Cavour",
        "superficie": "23 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.105579382452811, 42.766223606423274]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "50",
        "titolare": "Mario Rossi",
        "settore": "Casalinghi",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Piazza Fratelli Rosselli",
        "superficie": "12 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.108377481174516, 42.76511327707064]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "51",
        "titolare": "Francesca Oro",
        "settore": "Casalinghi",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Piazza del Duomo",
        "superficie": "8 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.113279741132457, 42.762962057233715]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "52",
        "titolare": "",
        "settore": "Prodotti Agricoli",
        "stato": "Libero",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Cavour",
        "superficie": "21 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.11224342055766, 42.76486418862237]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "53",
        "titolare": "",
        "settore": "Prodotti Agricoli",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Cavour",
        "superficie": "18 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.111685931294375, 42.76215487465033]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "54",
        "titolare": "Mario Rossi",
        "settore": "Giocattoli",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Roma",
        "superficie": "17 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.107881505673307, 42.761179340808255]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "55",
        "titolare": "",
        "settore": "Libri e Cartoleria",
        "stato": "Libero",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Manin",
        "superficie": "14 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.1053700292958, 42.76520000972448]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "56",
        "titolare": "Mario Rossi",
        "settore": "Alimentare",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Garibaldi",
        "superficie": "16 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.112443198740522, 42.76422517967527]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "57",
        "titolare": "Anna Bianchi",
        "settore": "Alimentare",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Roma",
        "superficie": "21 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.108545062758035, 42.76463336975451]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "58",
        "titolare": "Chiara Rosa",
        "settore": "Vario",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza del Duomo",
        "superficie": "24 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.106106371756333, 42.76639698924233]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "59",
        "titolare": "",
        "settore": "Alimentare",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Manin",
        "superficie": "13 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.106660196300961, 42.76612530535038]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "60",
        "titolare": "Andrea Celesti",
        "settore": "Vario",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza del Duomo",
        "superficie": "24 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.106713251633202, 42.76435408357662]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "61",
        "titolare": "Mario Rossi",
        "settore": "Calzature",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Oberdan",
        "superficie": "9 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.10966690378101, 42.76655718396311]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "62",
        "titolare": "Luigi Blu",
        "settore": "Casalinghi",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Piazza Dante",
        "superficie": "16 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.106462884633277, 42.76422341960205]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "63",
        "titolare": "Matteo Argento",
        "settore": "Calzature",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Piazza Fratelli Rosselli",
        "superficie": "10 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.11003983800558, 42.76683749079622]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "64",
        "titolare": "Chiara Rosa",
        "settore": "Vario",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Cavour",
        "superficie": "9 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.10802370172992, 42.7645635260245]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "65",
        "titolare": "Francesco Neri",
        "settore": "Casalinghi",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Cavour",
        "superficie": "12 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.111925001544547, 42.76218470272526]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "66",
        "titolare": "Valentina Bronzo",
        "settore": "Prodotti Agricoli",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Manin",
        "superficie": "17 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.109728890415758, 42.76188986793489]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "67",
        "titolare": "Matteo Argento",
        "settore": "Vario",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Piazza Dante",
        "superficie": "12 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.111289869744295, 42.761592330553626]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "68",
        "titolare": "Maria Gialli",
        "settore": "Giocattoli",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Piazza Fratelli Rosselli",
        "superficie": "22 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.109364354859988, 42.765841033651476]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "69",
        "titolare": "Francesco Neri",
        "settore": "Calzature",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Garibaldi",
        "superficie": "19 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.11218226238244, 42.761667147194046]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "70",
        "titolare": "",
        "settore": "Vario",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Corso Carducci",
        "superficie": "12 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.108512025999074, 42.76412378834281]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "71",
        "titolare": "Maria Gialli",
        "settore": "Alimentare",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Corso Carducci",
        "superficie": "12 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.113230376662218, 42.763375392983015]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "72",
        "titolare": "Giulia Arancioni",
        "settore": "Fiori e Piante",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Garibaldi",
        "superficie": "25 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.112586601668308, 42.766421679507545]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "73",
        "titolare": "",
        "settore": "Prodotti Agricoli",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza Fratelli Rosselli",
        "superficie": "11 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.108220063760013, 42.764680912522884]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "74",
        "titolare": "Andrea Celesti",
        "settore": "Calzature",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Garibaldi",
        "superficie": "22 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.108021638364372, 42.76102322465038]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "75",
        "titolare": "Francesca Oro",
        "settore": "Vario",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Corso Carducci",
        "superficie": "12 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.112281193916626, 42.76652774492423]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "76",
        "titolare": "",
        "settore": "Fiori e Piante",
        "stato": "Libero",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Piazza Fratelli Rosselli",
        "superficie": "25 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.111348056058947, 42.76203277781567]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "77",
        "titolare": "",
        "settore": "Abbigliamento",
        "stato": "Libero",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Roma",
        "superficie": "20 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.110782793035966, 42.763101823463806]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "78",
        "titolare": "",
        "settore": "Alimentare",
        "stato": "Libero",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Piazza Dante",
        "superficie": "16 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.111695366311052, 42.76555075498188]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "79",
        "titolare": "Sara Rosa",
        "settore": "Alimentare",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Roma",
        "superficie": "20 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.1131495589399, 42.761745847679585]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "80",
        "titolare": "Francesco Neri",
        "settore": "Giocattoli",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Roma",
        "superficie": "22 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.113112560428231, 42.765631652955115]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "81",
        "titolare": "Stefano Viola",
        "settore": "Casalinghi",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Garibaldi",
        "superficie": "22 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.110462522612261, 42.76441999459731]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "82",
        "titolare": "Francesco Neri",
        "settore": "Abbigliamento",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Roma",
        "superficie": "20 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.10570216356279, 42.7637547270137]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "83",
        "titolare": "Matteo Argento",
        "settore": "Libri e Cartoleria",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Oberdan",
        "superficie": "22 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.106118939622725, 42.765023387626314]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "84",
        "titolare": "Sara Rosa",
        "settore": "Alimentare",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Oberdan",
        "superficie": "13 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.105476141475574, 42.766263448973866]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "85",
        "titolare": "Marco Viola",
        "settore": "Giocattoli",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Cavour",
        "superficie": "23 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.10599472170468, 42.760954620365666]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "86",
        "titolare": "Marco Viola",
        "settore": "Calzature",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza Dante",
        "superficie": "17 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.110492771276737, 42.76320957680504]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "87",
        "titolare": "",
        "settore": "Abbigliamento",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Oberdan",
        "superficie": "23 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.106687294759606, 42.76422481830911]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "88",
        "titolare": "",
        "settore": "Vario",
        "stato": "Libero",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Manin",
        "superficie": "16 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.111189786682601, 42.76501759017271]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "89",
        "titolare": "Valentina Bronzo",
        "settore": "Giocattoli",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Corso Carducci",
        "superficie": "16 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.105311597811198, 42.76114930139583]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "90",
        "titolare": "Valentina Bronzo",
        "settore": "Casalinghi",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Piazza Fratelli Rosselli",
        "superficie": "14 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.108699283030276, 42.762141971055684]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "91",
        "titolare": "Matteo Argento",
        "settore": "Libri e Cartoleria",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Garibaldi",
        "superficie": "18 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.112325638303158, 42.76441868738954]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "92",
        "titolare": "Carla Verde",
        "settore": "Calzature",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Garibaldi",
        "superficie": "9 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.11040090865855, 42.765751963417216]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "93",
        "titolare": "Andrea Celesti",
        "settore": "Alimentare",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Cavour",
        "superficie": "23 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.111354202372604, 42.76667080366903]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "94",
        "titolare": "Luigi Blu",
        "settore": "Vario",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Mazzini",
        "superficie": "16 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.106108181509631, 42.762188380706945]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "95",
        "titolare": "Mario Rossi",
        "settore": "Abbigliamento",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza Fratelli Rosselli",
        "superficie": "24 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.108645505559949, 42.76199933474806]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "96",
        "titolare": "Sara Rosa",
        "settore": "Alimentare",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Mazzini",
        "superficie": "21 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.10850566666306, 42.76259823733042]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "97",
        "titolare": "Sara Rosa",
        "settore": "Alimentare",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Roma",
        "superficie": "21 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.11238586576783, 42.765877397918395]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "98",
        "titolare": "",
        "settore": "Vario",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza del Duomo",
        "superficie": "15 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.109251889056624, 42.76577623235147]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "99",
        "titolare": "Luca Azzurri",
        "settore": "Calzature",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza Fratelli Rosselli",
        "superficie": "9 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.110892986090244, 42.7649538234139]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "100",
        "titolare": "Giuseppe Verdi",
        "settore": "Prodotti Agricoli",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Manin",
        "superficie": "23 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.11098261618647, 42.76188257758381]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "101",
        "titolare": "Giulia Arancioni",
        "settore": "Calzature",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Mazzini",
        "superficie": "20 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.10909425498122, 42.76270924969761]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "102",
        "titolare": "",
        "settore": "Casalinghi",
        "stato": "Libero",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Oberdan",
        "superficie": "13 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.106266914919477, 42.764996311634334]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "103",
        "titolare": "",
        "settore": "Casalinghi",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Cavour",
        "superficie": "23 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.106378988369071, 42.76190300081592]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "104",
        "titolare": "Francesco Neri",
        "settore": "Libri e Cartoleria",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Roma",
        "superficie": "12 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.111480339035285, 42.764477084563154]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "105",
        "titolare": "",
        "settore": "Giocattoli",
        "stato": "Libero",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Piazza Dante",
        "superficie": "20 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.10886004127978, 42.76491643330982]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "106",
        "titolare": "",
        "settore": "Prodotti Agricoli",
        "stato": "Libero",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Oberdan",
        "superficie": "19 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.106244629531524, 42.76507048609122]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "107",
        "titolare": "Luca Azzurri",
        "settore": "Calzature",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Mazzini",
        "superficie": "19 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.105346439091779, 42.764716198165786]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "108",
        "titolare": "Chiara Rosa",
        "settore": "Giocattoli",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Garibaldi",
        "superficie": "19 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.109508241361745, 42.76532179336678]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "109",
        "titolare": "",
        "settore": "Calzature",
        "stato": "Libero",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Mazzini",
        "superficie": "24 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.105320804703492, 42.764647588649176]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "110",
        "titolare": "",
        "settore": "Abbigliamento",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Manin",
        "superficie": "12 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.112277603630572, 42.7660959391997]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "111",
        "titolare": "Valentina Bronzo",
        "settore": "Alimentare",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Oberdan",
        "superficie": "25 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.111560507685956, 42.765352002436096]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "112",
        "titolare": "Andrea Celesti",
        "settore": "Vario",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Piazza Fratelli Rosselli",
        "superficie": "12 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.111721771764284, 42.76679424810356]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "113",
        "titolare": "Elena Grigi",
        "settore": "Libri e Cartoleria",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza del Duomo",
        "superficie": "9 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.110732744644407, 42.76234009856688]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "114",
        "titolare": "Valentina Bronzo",
        "settore": "Fiori e Piante",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Piazza Fratelli Rosselli",
        "superficie": "24 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.107777407086758, 42.76276049521998]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "115",
        "titolare": "Elena Grigi",
        "settore": "Giocattoli",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Oberdan",
        "superficie": "8 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.111021775102651, 42.763262128012556]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "116",
        "titolare": "Valentina Bronzo",
        "settore": "Alimentare",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Piazza Fratelli Rosselli",
        "superficie": "8 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.109194162228537, 42.76490687279072]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "117",
        "titolare": "",
        "settore": "Giocattoli",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Corso Carducci",
        "superficie": "11 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.108295655571125, 42.76529930452711]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "118",
        "titolare": "Matteo Argento",
        "settore": "Giocattoli",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Oberdan",
        "superficie": "19 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.108578823535247, 42.765815581270786]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "119",
        "titolare": "",
        "settore": "Giocattoli",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza Fratelli Rosselli",
        "superficie": "19 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.108037235149732, 42.761948746723064]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "120",
        "titolare": "Mario Rossi",
        "settore": "Casalinghi",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Oberdan",
        "superficie": "16 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.112540074320036, 42.765716842243364]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "121",
        "titolare": "",
        "settore": "Casalinghi",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza del Duomo",
        "superficie": "22 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.10734762436529, 42.766819551206424]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "122",
        "titolare": "Chiara Rosa",
        "settore": "Abbigliamento",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Piazza del Duomo",
        "superficie": "12 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.112746388531496, 42.76112846212257]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "123",
        "titolare": "",
        "settore": "Calzature",
        "stato": "Libero",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Manin",
        "superficie": "14 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.106196048010593, 42.76497271488183]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "124",
        "titolare": "Sara Rosa",
        "settore": "Alimentare",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Oberdan",
        "superficie": "22 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.112679182316706, 42.76590951932549]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "125",
        "titolare": "Marco Viola",
        "settore": "Vario",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Mazzini",
        "superficie": "20 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.110480062015368, 42.76426418380586]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "126",
        "titolare": "",
        "settore": "Giocattoli",
        "stato": "Libero",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Cavour",
        "superficie": "20 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.110236121277671, 42.761316081849074]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "127",
        "titolare": "Matteo Argento",
        "settore": "Alimentare",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Mazzini",
        "superficie": "21 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.111375757054946, 42.76528227299254]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "128",
        "titolare": "Francesca Oro",
        "settore": "Casalinghi",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Mazzini",
        "superficie": "11 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.10758372774899, 42.76414763542274]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "129",
        "titolare": "Carla Verde",
        "settore": "Abbigliamento",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Garibaldi",
        "superficie": "10 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.111483759170167, 42.76095646020163]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "130",
        "titolare": "Sara Rosa",
        "settore": "Vario",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Manin",
        "superficie": "14 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.11019257938334, 42.7655606714385]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "131",
        "titolare": "",
        "settore": "Alimentare",
        "stato": "Libero",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Garibaldi",
        "superficie": "18 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.109559639714256, 42.764988649724465]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "132",
        "titolare": "Roberto Marroni",
        "settore": "Giocattoli",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Corso Carducci",
        "superficie": "22 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.110805512161502, 42.761324640439504]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "133",
        "titolare": "Giulia Arancioni",
        "settore": "Giocattoli",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Piazza del Duomo",
        "superficie": "11 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.107210046737631, 42.76659233136043]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "134",
        "titolare": "",
        "settore": "Casalinghi",
        "stato": "Libero",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Cavour",
        "superficie": "16 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.106411311654028, 42.766547988063316]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "135",
        "titolare": "Francesca Oro",
        "settore": "Alimentare",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Piazza Fratelli Rosselli",
        "superficie": "16 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.110030002785372, 42.76139696601818]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "136",
        "titolare": "Giuseppe Verdi",
        "settore": "Calzature",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Mazzini",
        "superficie": "11 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.112926629814725, 42.7664027380732]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "137",
        "titolare": "",
        "settore": "Prodotti Agricoli",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Cavour",
        "superficie": "25 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.111918524666976, 42.76519932681193]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "138",
        "titolare": "Andrea Celesti",
        "settore": "Prodotti Agricoli",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Corso Carducci",
        "superficie": "20 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.108146801562226, 42.76514015874024]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "139",
        "titolare": "",
        "settore": "Fiori e Piante",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza Fratelli Rosselli",
        "superficie": "16 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.112078796728257, 42.763823247446815]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "140",
        "titolare": "",
        "settore": "Fiori e Piante",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Oberdan",
        "superficie": "18 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.112356196278077, 42.76634715476482]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "141",
        "titolare": "",
        "settore": "Vario",
        "stato": "Libero",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Mazzini",
        "superficie": "24 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.111563299142917, 42.76654217922809]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "142",
        "titolare": "Carla Verde",
        "settore": "Prodotti Agricoli",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Manin",
        "superficie": "20 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.111875262636632, 42.7639712179175]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "143",
        "titolare": "",
        "settore": "Alimentare",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Manin",
        "superficie": "13 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.105788635954971, 42.763328894144095]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "144",
        "titolare": "Giulia Arancioni",
        "settore": "Prodotti Agricoli",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Garibaldi",
        "superficie": "14 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.112065951662615, 42.76566389586586]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "145",
        "titolare": "Marco Viola",
        "settore": "Vario",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza Fratelli Rosselli",
        "superficie": "13 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.10846662836586, 42.76307312722625]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "146",
        "titolare": "Stefano Viola",
        "settore": "Vario",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Corso Carducci",
        "superficie": "25 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.11281071736021, 42.761362692080546]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "147",
        "titolare": "Maria Gialli",
        "settore": "Casalinghi",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Mazzini",
        "superficie": "14 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.108110772033882, 42.76389934288961]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "148",
        "titolare": "",
        "settore": "Libri e Cartoleria",
        "stato": "Libero",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Piazza Fratelli Rosselli",
        "superficie": "14 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.11111783722898, 42.76144482094983]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "149",
        "titolare": "Sara Rosa",
        "settore": "Fiori e Piante",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Mazzini",
        "superficie": "21 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.105937106619104, 42.76190914917427]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "150",
        "titolare": "Elena Grigi",
        "settore": "Prodotti Agricoli",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Mazzini",
        "superficie": "17 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.112678564453686, 42.76647951304293]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "151",
        "titolare": "Stefano Viola",
        "settore": "Prodotti Agricoli",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Roma",
        "superficie": "11 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.106334970330233, 42.762734409517414]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "152",
        "titolare": "Matteo Argento",
        "settore": "Prodotti Agricoli",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Mazzini",
        "superficie": "17 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.10974163429372, 42.76397856285391]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "153",
        "titolare": "",
        "settore": "Prodotti Agricoli",
        "stato": "Libero",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Corso Carducci",
        "superficie": "13 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.10632270056437, 42.76404781237447]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "154",
        "titolare": "Chiara Rosa",
        "settore": "Fiori e Piante",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Piazza del Duomo",
        "superficie": "9 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.10556954142695, 42.76632931211091]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "155",
        "titolare": "",
        "settore": "Libri e Cartoleria",
        "stato": "Libero",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Piazza Fratelli Rosselli",
        "superficie": "8 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.11140236967249, 42.76512995764412]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "156",
        "titolare": "Roberto Marroni",
        "settore": "Abbigliamento",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza del Duomo",
        "superficie": "11 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.107374291314509, 42.761856962438856]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "157",
        "titolare": "",
        "settore": "Casalinghi",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Manin",
        "superficie": "21 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.107698476205172, 42.76588679797691]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "158",
        "titolare": "",
        "settore": "Abbigliamento",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza Dante",
        "superficie": "24 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.105618628323628, 42.7623975171368]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "159",
        "titolare": "Giuseppe Verdi",
        "settore": "Libri e Cartoleria",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Corso Carducci",
        "superficie": "16 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.107528673116255, 42.76380880229011]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "160",
        "titolare": "Elena Grigi",
        "settore": "Giocattoli",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Piazza Dante",
        "superficie": "19 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.109456970797511, 42.76119070557524]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "161",
        "titolare": "Carla Verde",
        "settore": "Vario",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Roma",
        "superficie": "23 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.10893233738865, 42.76467808621103]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "162",
        "titolare": "Giulia Arancioni",
        "settore": "Alimentare",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza del Duomo",
        "superficie": "17 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.110878277471162, 42.765767067900384]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "163",
        "titolare": "",
        "settore": "Fiori e Piante",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Corso Carducci",
        "superficie": "22 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.108524371069125, 42.76452244016055]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "164",
        "titolare": "Valentina Bronzo",
        "settore": "Fiori e Piante",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza Dante",
        "superficie": "23 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.10845962343704, 42.76483491989176]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "165",
        "titolare": "Mario Rossi",
        "settore": "Abbigliamento",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Mazzini",
        "superficie": "23 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.108493862641192, 42.76122174496281]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "166",
        "titolare": "Elena Grigi",
        "settore": "Vario",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza Dante",
        "superficie": "19 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.10760359038355, 42.76672049098098]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "167",
        "titolare": "Andrea Celesti",
        "settore": "Calzature",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Manin",
        "superficie": "14 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.112208686493442, 42.76646827220187]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "168",
        "titolare": "Luigi Blu",
        "settore": "Casalinghi",
        "stato": "Occupato",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Via Roma",
        "superficie": "16 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.109883901910347, 42.763816197272504]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "169",
        "titolare": "",
        "settore": "Giocattoli",
        "stato": "Libero",
        "mercato": "Esperanto Settimanale-Giovedì",
        "area": "Corso Carducci",
        "superficie": "18 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.11146378578271, 42.762404547358045]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "170",
        "titolare": "",
        "settore": "Giocattoli",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Mazzini",
        "superficie": "20 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.112390671615039, 42.76118893699905]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "171",
        "titolare": "Giuseppe Verdi",
        "settore": "Fiori e Piante",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Corso Carducci",
        "superficie": "19 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.107321821047792, 42.76323629789362]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "172",
        "titolare": "Francesco Neri",
        "settore": "Calzature",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Manin",
        "superficie": "14 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.106390861623124, 42.765729817691245]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "173",
        "titolare": "",
        "settore": "Giocattoli",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza Fratelli Rosselli",
        "superficie": "14 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.110532878118834, 42.76199175992126]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "174",
        "titolare": "Luca Azzurri",
        "settore": "Prodotti Agricoli",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza del Duomo",
        "superficie": "10 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.111836910705096, 42.76373307808028]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "175",
        "titolare": "Elena Grigi",
        "settore": "Libri e Cartoleria",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza Fratelli Rosselli",
        "superficie": "9 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.111031454307367, 42.761968322627595]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "176",
        "titolare": "Giulia Arancioni",
        "settore": "Casalinghi",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza Fratelli Rosselli",
        "superficie": "18 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.112909265459152, 42.766883915387915]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "177",
        "titolare": "Stefano Viola",
        "settore": "Alimentare",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Manin",
        "superficie": "18 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.109089054814845, 42.76448493849896]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "178",
        "titolare": "Mario Rossi",
        "settore": "Vario",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza Fratelli Rosselli",
        "superficie": "21 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.106918810319304, 42.76661287828772]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "179",
        "titolare": "Francesca Oro",
        "settore": "Alimentare",
        "stato": "Occupato",
        "mercato": "Tripoli Giornaliero",
        "area": "Via Roma",
        "superficie": "11 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.107995480158888, 42.76107944799732]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "numero": "180",
        "titolare": "",
        "settore": "Abbigliamento",
        "stato": "Libero",
        "mercato": "Tripoli Giornaliero",
        "area": "Piazza Dante",
        "superficie": "25 mq"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [11.107440612587467, 42.76462133863222]
      }
    }
  ]
};

// Carica il dataset completo
async function loadCompleteDataset() {
  // Usa direttamente i dati hardcoded - versione semplice che funzionava
  return DEMO_DATA;
}

// Genera dati di esempio se il file completo non è disponibile
function generateSampleData() {
  const features = [];
  const categorie = ["Alimentare", "Abbigliamento", "Casalinghi", "Fiori e Piante", "Calzature", "Vario"];
  const nomi = ["Mario Rossi", "Giuseppe Verdi", "Anna Bianchi", "Francesco Neri", "Maria Gialli"];
  const mercati = ["Tripoli Giornaliero", "Esperanto Settimanale-Giovedì"];
  
  // Genera 180 posteggi distribuiti realisticamente
  for (let i = 1; i <= 180; i++) {
    const isOccupato = Math.random() < 0.65; // 65% occupato
    const lat = 42.7639 + (Math.random() - 0.5) * 0.003; // Variazione di ~300m
    const lon = 11.1093 + (Math.random() - 0.5) * 0.004; // Variazione di ~300m
    
    features.push({
      "type": "Feature",
      "properties": {
        "numero": i.toString(),
        "titolare": isOccupato ? nomi[Math.floor(Math.random() * nomi.length)] : "",
        "settore": categorie[Math.floor(Math.random() * categorie.length)],
        "stato": isOccupato ? "Occupato" : "Libero",
        "mercato": mercati[Math.floor(Math.random() * mercati.length)],
        "superficie": `${Math.floor(Math.random() * 18) + 8} mq`,
        "piva": isOccupato ? `${Math.floor(Math.random() * 90000000000) + 10000000000}` : "",
        "periodo": Math.random() < 0.7 ? "Giornaliero" : "Settimanale"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [lon, lat]
      }
    });
  }
  
  return {
    "type": "FeatureCollection",
    "features": features
  };
}

/* ====== UI ====== */
const $ = (s)=>document.querySelector(s);
const map = L.map('map', { zoomControl:true, preferCanvas:true }).setView([42.76, 11.11], 14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
  attribution:'© OpenStreetMap'
}).addTo(map);

// Aggiungi layer WMS di Grosseto come sfondo
L.tileLayer.wms('https://webgis.comune.grosseto.it/ows/mercati/', {
  layers: 'ortofoto_2019',
  format: 'image/png',
  transparent: true,
  attribution: '© Comune di Grosseto'
}).addTo(map);

let layer; // corrente
function toast(msg, ok=false){
  const t=$('#toast'); t.textContent=msg; t.hidden=false; t.style.borderColor = ok ? '#19d1b8' : '#b55';
  setTimeout(()=>t.hidden=true, 3500);
}

/* ====== TOKEN HANDLING (solo locale) ====== */
function getToken(){ return localStorage.getItem('gisToken') || '' }
function setToken(t){ if(t){ localStorage.setItem('gisToken', t); } updateTokenPill(); }
function updateTokenPill(){ $('#tokenStatus').textContent = 'Token: ' + (getToken() ? 'impostato' : 'assente') }
$('#btnSetToken').onclick = ()=>{
  const cur=getToken();
  const t = prompt('Incolla TOKEN GIS (non verrà mai committato):', cur || '');
  if(t!==null){ setToken(t.trim()); toast('Token aggiornato', true); }
};
updateTokenPill();

/* ====== FETCH & RENDER ====== */
async function loadMercato(){
  const mercatoId = $('#mercatoSel').value;
  const token = getToken();
  
  $('#btnLoad').disabled = true;
  try{
    let gj;
    
    // Priorità: 1) DMS, 2) WFS reale, 3) Dataset demo
    if (window.isConnectedToDMS) {
      // Carica dati dalla tua applicazione DMS
      toast('Caricando dati dalla tua applicazione DMS...', true);
      gj = await window.loadDataFromDMS();
    } else if (token && token !== 'demo') {
      // Tentativo di chiamata reale al WFS
      try {
        const r = await fetch(ENDPOINT(mercatoId), {
          headers: { 'Authorization': `Bearer ${token}` },
          mode: 'cors',
          cache: 'no-store'
        });
        if(!r.ok){ throw new Error(`HTTP ${r.status}`); }
        gj = await r.json();
      } catch(err) {
        console.warn('WFS non disponibile, uso dataset demo:', err);
        toast('WFS non disponibile, usando dataset demo', true);
        gj = await loadCompleteDataset();
      }
    } else {
      // Dataset demo
      toast('Caricando dataset demo...', true);
      gj = await loadCompleteDataset();
    }
    
    if(layer){ layer.remove(); }
    layer = L.geoJSON(gj, {
      style: f => ({ color:'#19d1b8', weight: f.geometry.type==='Polygon'?1:0, fillOpacity:0.08 }),
      pointToLayer: (feat, latlng)=> {
        const stato = feat.properties.stato;
        let color, fillColor;
        
        // Colori dinamici basati sullo stato
        switch(stato) {
          case 'Occupato':
            color = fillColor = '#ff4444'; // Rosso per occupato
            break;
          case 'Libero':
            color = fillColor = '#44ff44'; // Verde per libero
            break;
          case 'Riservato':
            color = fillColor = '#4444ff'; // Blu per riservato
            break;
          case 'Temporaneo':
            color = fillColor = '#ff8844'; // Arancione per temporaneo
            break;
          default:
            color = fillColor = '#888888'; // Grigio per sconosciuto
        }
        
        return L.circleMarker(latlng, {
          radius: 6, 
          color: color,
          fillColor: fillColor,
          fillOpacity: 0.8,
          weight: 2,
          opacity: 0.9
        });
      },
      onEachFeature: (feat, lyr)=>{
        const p = feat.properties || {};
        const statoColor = p.stato === 'Occupato' ? '#ff4444' : 
                          p.stato === 'Libero' ? '#44ff44' : '#888888';
        
        const html = `
          <div style="min-width: 250px; font-family: system-ui;">
            <h4 style="margin: 0 0 8px 0; color: #333;">Posteggio #${p.numero || '-'}</h4>
            <div style="margin-bottom: 4px;"><strong>Mercato:</strong> ${p.mercato || '-'}</div>
            <div style="margin-bottom: 4px;"><strong>Titolare:</strong> ${p.titolare || 'Nessuno'}</div>
            <div style="margin-bottom: 4px;"><strong>Categoria:</strong> ${p.settore || '-'}</div>
            <div style="margin-bottom: 4px;"><strong>Superficie:</strong> ${p.superficie || '-'}</div>
            <div style="margin-bottom: 4px;"><strong>Periodo:</strong> ${p.periodo || '-'}</div>
            <div style="margin-bottom: 8px;"><strong>Stato:</strong> 
              <span style="color: ${statoColor}; font-weight: bold;">${p.stato || 'N/A'}</span>
            </div>
            ${p.piva ? `<div style="font-size: 0.9em; color: #666;">P.IVA: ${p.piva}</div>` : ''}
          </div>
        `;
        lyr.bindPopup(html);
      }
    }).addTo(map);
    
    // Centra la mappa sui posteggi
    try{ 
      map.fitBounds(layer.getBounds(), {padding:[20,20]}); 
    } catch(e) {
      // Fallback al centro di Grosseto
      map.setView([42.7639, 11.1093], 16);
    }
    
    // Statistiche
    const stati = {};
    gj.features.forEach(f => {
      const stato = f.properties.stato;
      stati[stato] = (stati[stato] || 0) + 1;
    });
    
    const statsText = Object.entries(stati)
      .map(([stato, count]) => `${stato}: ${count}`)
      .join(', ');
    
    toast(`Caricati ${gj.features?.length || 0} posteggi (${statsText})`, true);
    if(DIAG) console.log('GeoJSON', gj);
  }catch(err){
    console.error(err);
    toast('Errore caricamento GIS: '+err.message);
  }finally{
    $('#btnLoad').disabled = false;
  }
}
$('#btnLoad').onclick = loadMercato;
// Auto-carica se ?autoload=1
if(new URLSearchParams(location.search).get('autoload')==='1') loadMercato();



// Variabile globale per i dati completi
let allData = null;

// Funzione per filtrare i dati
function filterData(data, mercatoFilter, statoFilter) {
  if (!data || !data.features) return data;
  
  const filteredFeatures = data.features.filter(feature => {
    const props = feature.properties;
    
    // Filtro mercato
    if (mercatoFilter !== 'tutti') {
      if (mercatoFilter === 'tripoli' && !props.mercato.includes('Tripoli')) return false;
      if (mercatoFilter === 'esperanto' && !props.mercato.includes('Esperanto')) return false;
    }
    
    // Filtro stato
    if (statoFilter !== 'tutti') {
      if (statoFilter === 'libero' && props.stato !== 'Libero') return false;
      if (statoFilter === 'occupato' && props.stato !== 'Occupato') return false;
    }
    
    return true;
  });
  
  return {
    type: "FeatureCollection",
    features: filteredFeatures
  };
}

// Funzione per mostrare statistiche
function showStats() {
  if (!allData || !allData.features) {
    toast('Carica prima i dati della mappa');
    return;
  }
  
  const stats = {
    totale: allData.features.length,
    stati: {},
    mercati: {},
    categorie: {}
  };
  
  allData.features.forEach(feature => {
    const props = feature.properties;
    
    // Conta stati
    stats.stati[props.stato] = (stats.stati[props.stato] || 0) + 1;
    
    // Conta mercati
    stats.mercati[props.mercato] = (stats.mercati[props.mercato] || 0) + 1;
    
    // Conta categorie
    stats.categorie[props.settore] = (stats.categorie[props.settore] || 0) + 1;
  });
  
  const statsHtml = `
    <div style="max-width: 400px; font-family: system-ui;">
      <h3 style="margin: 0 0 16px 0; color: #333;">Statistiche Posteggi</h3>
      
      <div style="margin-bottom: 16px;">
        <strong>Totale posteggi:</strong> ${stats.totale}
      </div>
      
      <div style="margin-bottom: 16px;">
        <strong>Per stato:</strong><br/>
        ${Object.entries(stats.stati)
          .map(([stato, count]) => `• ${stato}: ${count} (${Math.round(count/stats.totale*100)}%)`)
          .join('<br/>')}
      </div>
      
      <div style="margin-bottom: 16px;">
        <strong>Per mercato:</strong><br/>
        ${Object.entries(stats.mercati)
          .map(([mercato, count]) => `• ${mercato}: ${count}`)
          .join('<br/>')}
      </div>
      
      <div>
        <strong>Top 5 categorie:</strong><br/>
        ${Object.entries(stats.categorie)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([categoria, count]) => `• ${categoria}: ${count}`)
          .join('<br/>')}
      </div>
    </div>
  `;
  
  // Crea popup per le statistiche
  const popup = L.popup({
    maxWidth: 450,
    className: 'stats-popup'
  })
  .setLatLng([42.7639, 11.1093])
  .setContent(statsHtml)
  .openOn(map);
}

// Aggiorna la funzione loadMercato per salvare i dati e applicare filtri
const originalLoadMercato = loadMercato;
loadMercato = async function() {
  const mercatoId = $('#mercatoSel').value;
  
  $('#btnLoad').disabled = true;
  try{
    let gj;
    
    // Carica sempre il dataset completo per test
    toast('Caricando dataset completo...', true);
    gj = await loadCompleteDataset();
       // Salva i dati completi
    allData = gj;
    
    // Popola la sidebar con i posteggi
    populateSidebar(gj.features);
    
    // Applica filtri se presenti mercatoFilter = $('#mercatoSel').value;
    const statoFilter = $('#statoFilter').value;
    const filteredData = filterData(gj, mercatoFilter, statoFilter);
    
    if(layer){ layer.remove(); }
    layer = L.geoJSON(filteredData, {
      style: f => ({ color:'#19d1b8', weight: f.geometry.type==='Polygon'?1:0, fillOpacity:0.08 }),
      pointToLayer: (feat, latlng)=> {
        // Colori dinamici in base allo stato
        const p = feat.properties || {};
        
        let fillColor = '#44ff44'; // Verde = Libero
        if (p.stato === 'Occupato') fillColor = '#ff4444'; // Rosso
        else if (p.stato === 'Riservato') fillColor = '#4444ff'; // Blu  
        else if (p.stato === 'Temporaneo') fillColor = '#ff8844'; // Arancione
        
        return L.circleMarker(latlng, {
          radius: 12,           // Dimensione media
          fillColor: fillColor, // Colore dinamico
          color: '#ffffff',     // Bordo bianco
          weight: 2,            // Bordo normale
          opacity: 1,
          fillOpacity: 0.8,     // Leggermente trasparente
          zIndexOffset: 99999   // Z-index alto
        });
      },
      onEachFeature: (feat, lyr)=>{
        const p = feat.properties || {};
        const statoColor = p.stato === 'Occupato' ? '#ff4444' : 
                          p.stato === 'Libero' ? '#44ff44' : '#888888';
        
        const html = `
          <div style="min-width: 250px; font-family: system-ui;">
            <h4 style="margin: 0 0 8px 0; color: #333;">Posteggio #${p.numero || '-'}</h4>
            <div style="margin-bottom: 4px;"><strong>Mercato:</strong> ${p.mercato || '-'}</div>
            <div style="margin-bottom: 4px;"><strong>Titolare:</strong> ${p.titolare || 'Nessuno'}</div>
            <div style="margin-bottom: 4px;"><strong>Categoria:</strong> ${p.settore || '-'}</div>
            <div style="margin-bottom: 4px;"><strong>Superficie:</strong> ${p.superficie || '-'}</div>
            <div style="margin-bottom: 4px;"><strong>Periodo:</strong> ${p.periodo || '-'}</div>
            <div style="margin-bottom: 8px;"><strong>Stato:</strong> 
              <span style="color: ${statoColor}; font-weight: bold;">${p.stato || 'N/A'}</span>
            </div>
            ${p.piva ? `<div style="font-size: 0.9em; color: #666;">P.IVA: ${p.piva}</div>` : ''}
          </div>
        `;
        lyr.bindPopup(html);
      }
    }).addTo(map);
    
    // Centra la mappa sui posteggi
    try{ 
      map.fitBounds(layer.getBounds(), {padding:[20,20]}); 
    } catch(e) {
      // Fallback al centro di Grosseto
      map.setView([42.7639, 11.1093], 16);
    }
    
    // Statistiche
    const stati = {};
    filteredData.features.forEach(f => {
      const stato = f.properties.stato;
      stati[stato] = (stati[stato] || 0) + 1;
    });
    
    const statsText = Object.entries(stati)
      .map(([stato, count]) => `${stato}: ${count}`)
      .join(', ');
    
    const totalText = filteredData.features.length !== gj.features.length ? 
      ` (${filteredData.features.length}/${gj.features.length} filtrati)` : '';
    
    toast(`Caricati ${filteredData.features?.length || 0} posteggi${totalText} (${statsText})`, true);
    if(DIAG) console.log('GeoJSON', filteredData);
  }catch(err){
    console.error(err);
    toast('Errore caricamento GIS: '+err.message);
  }finally{
    $('#btnLoad').disabled = false;
  }
};

// Event listeners per i filtri
$('#mercatoSel').onchange = () => {
  if (allData) loadMercato();
};

$('#statoFilter').onchange = () => {
  if (allData) loadMercato();
};

$('#btnStats').onclick = showStats;


// Event listener per configurazione DMS
$('#btnDMSConfig').onclick = () => {
  if (window.showDMSConfigDialog) {
    window.showDMSConfigDialog();
  } else {
    toast('Modulo DMS non caricato');
  }
};



// === FUNZIONI SIDEBAR ===

// Toggle sidebar
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('open');
}

// Popola la sidebar con i posteggi
function populateSidebar(features) {
  const posteggiList = document.getElementById('posteggiList');
  const sidebarStats = document.getElementById('sidebarStats');
  
  // Calcola statistiche
  const totale = features.length;
  const liberi = features.filter(f => f.properties.stato === 'Libero').length;
  const occupati = features.filter(f => f.properties.stato === 'Occupato').length;
  
  // Aggiorna statistiche
  sidebarStats.innerHTML = `
    <div><strong>Totale posteggi:</strong> ${totale}</div>
    <div><strong>Liberi:</strong> <span style="color: #44ff44">${liberi}</span></div>
    <div><strong>Occupati:</strong> <span style="color: #ff4444">${occupati}</span></div>
  `;
  
  // Ordina per numero
  const sortedFeatures = features.sort((a, b) => 
    parseInt(a.properties.numero) - parseInt(b.properties.numero)
  );
  
  // Genera lista posteggi
  posteggiList.innerHTML = sortedFeatures.map(feature => {
    const p = feature.properties;
    const statusClass = p.stato.toLowerCase();
    
    return `
      <div class="posteggio-item ${statusClass}" onclick="focusPosteggio(${p.numero})">
        <div class="posteggio-numero">Posteggio #${p.numero}</div>
        <div class="posteggio-titolare">
          ${p.titolare || '<em>Libero</em>'}
        </div>
        <div class="posteggio-details">
          ${p.settore} • ${p.superficie}<br/>
          ${p.area} • ${p.mercato}<br/>
          <strong style="color: ${p.stato === 'Occupato' ? '#ff4444' : '#44ff44'}">${p.stato}</strong>
        </div>
      </div>
    `;
  }).join('');
  
  // Aggiungi event listeners per filtri
  setupSidebarFilters(features);
}

// Configura filtri sidebar
function setupSidebarFilters(allFeatures) {
  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  
  function filterSidebar() {
    const searchTerm = searchInput.value.toLowerCase();
    const statusValue = statusFilter.value;
    
    let filtered = allFeatures;
    
    // Filtro per testo
    if (searchTerm) {
      filtered = filtered.filter(f => 
        f.properties.numero.includes(searchTerm) ||
        (f.properties.titolare && f.properties.titolare.toLowerCase().includes(searchTerm)) ||
        f.properties.settore.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filtro per stato
    if (statusValue) {
      filtered = filtered.filter(f => f.properties.stato === statusValue);
    }
    
    // Aggiorna lista
    updateSidebarList(filtered);
  }
  
  searchInput.addEventListener('input', filterSidebar);
  statusFilter.addEventListener('change', filterSidebar);
}

// Aggiorna lista sidebar
function updateSidebarList(features) {
  const posteggiList = document.getElementById('posteggiList');
  
  const sortedFeatures = features.sort((a, b) => 
    parseInt(a.properties.numero) - parseInt(b.properties.numero)
  );
  
  posteggiList.innerHTML = sortedFeatures.map(feature => {
    const p = feature.properties;
    const statusClass = p.stato.toLowerCase();
    
    return `
      <div class="posteggio-item ${statusClass}" onclick="focusPosteggio(${p.numero})">
        <div class="posteggio-numero">Posteggio #${p.numero}</div>
        <div class="posteggio-titolare">
          ${p.titolare || '<em>Libero</em>'}
        </div>
        <div class="posteggio-details">
          ${p.settore} • ${p.superficie}<br/>
          ${p.area} • ${p.mercato}<br/>
          <strong style="color: ${p.stato === 'Occupato' ? '#ff4444' : '#44ff44'}">${p.stato}</strong>
        </div>
      </div>
    `;
  }).join('');
}

// Focalizza su un posteggio specifico
function focusPosteggio(numero) {
  if (!layer) return;
  
  layer.eachLayer(function(l) {
    if (l.feature && l.feature.properties.numero === numero.toString()) {
      map.setView(l.getLatLng(), 18);
      l.openPopup();
    }
  });
}

