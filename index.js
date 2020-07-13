import 'ol/ol.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import {fromLonLat} from 'ol/proj';
import {Vector as VectorSource, OSM} from 'ol/source';
import {Vector as VectorLayer} from 'ol/layer';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import {Icon, Style, Circle, Stroke, Fill} from 'ol/style';
import Overlay from 'ol/Overlay.js';
import WMTSCapabilities from 'ol/format/WMTSCapabilities';
import WMTS, {optionsFromCapabilities} from 'ol/source/WMTS';

// getting HTML elements of popup window
let container = document.getElementById('popup');
let content = document.getElementById('popup-content');
let closer = document.getElementById('popup-closer');

// setting Schubert & Franzke Background map using WMTS

let parser = new WMTSCapabilities();
 
fetch('https://www.wels.gv.at/wmts/1.0.0/WMTSCapabilities.xml')
  .then(function(response) {
    return response.text();
  })
  .then(function(text) {
    let result = parser.read(text);
    let options = optionsFromCapabilities(result, {
      layer: 'wels',
      matrixSet: 'wels_web_mercator'
    });

    // adding basemaps
    let osm = new TileLayer({ source: new OSM() });
    let wmts = new TileLayer({ source: new WMTS((options)) });

    // creating map
    let map = new Map({
      target: 'map',
      layers: [ osm, wmts ],
      view: new View({
        // transform center coordinates from WGS84 to Web Mercator projection
        center: fromLonLat([14.0282, 48.1635]),
        zoom: 13
      })
    });
    fetch('https://admin.map2web.eu/api/?key=44ce13e8d517e0f931492a8c8f641259b14f6c21&folder=7344')
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      let pharmacies = data.Wels.folder.items;
      pharmacies.forEach(element => {
        // creating marker for each pharmacy using their coordinates from json file
        let marker = new Feature({
          geometry: new Point(element.geometry.coordinates),
          id: element.id
        });
        // adding id attribute of every pharmacy store to every marker
        marker.setId(element.id);

        // creating marker style
        let markerStyle = new Style({
          image: new Icon( ({
            anchor: [0.5, 46],
            anchorXUnits: 'fraction',
            anchorYUnits: 'pixels',
            src: 'marker.png'
          }))
        });
        marker.setStyle(markerStyle);
    
        // adding markers to vector source and then source to the layer
        let vectorSource = new VectorSource({
            features: [marker]
          });
        let vectorLayer = new VectorLayer({
            source: vectorSource,
            style: markerStyle
        });
        map.addLayer(vectorLayer);
    });
    })

    // creating popup overlay and adding to map
    let popup = new Overlay({
      element: document.getElementById('popup')
    });
    map.addOverlay(popup);

    // when clicked closer (X) on popup window it closes
    closer.addEventListener('click', function() {
      popup.setPosition(undefined);
      closer.blur();
    });

    map.addEventListener('click', function(evt){
      // detecting features that intersect a pixel on the view and execute a callback with each intersecting feature
      let feature = map.forEachFeatureAtPixel(evt.pixel,
        function(feature) {
          return feature;
        });
      if (feature) {
        // getting feature coordinates (coordinates of pharmacy that's been clicked)
        let coordinates = feature.getGeometry().getCoordinates();
        // setting popup window above the clicked pharmacy
        popup.setPosition(coordinates);
        // getting name, info and other attributes of each pharmacy object, using AJAX
        // object id in url is got from feature's (marker's) id attribute set earlier
        // each click on marker sends single GET request for the corresponding object (pharmacy) 
         let pharmacies = data.Wels.folder.items;
          pharmacies.forEach(element => {
            // creating marker for each pharmacy using their coordinates from json file
            let marker = new Feature({
              geometry: new Point(element.geometry.coordinates),
              id: element.id
            });
            // adding id attribute of every pharmacy store to every marker
            marker.setId(element.id);

            // creating marker style
            let markerStyle = new Style({
              image: new Icon( ({
                anchor: [0.5, 46],
                anchorXUnits: 'fraction',
                anchorYUnits: 'pixels',
                src: 'marker.png'
              }))
            });
            marker.setStyle(markerStyle);
        
            // adding markers to vector source and then source to the layer
            let vectorSource = new VectorSource({
                features: [marker]
              });
            let vectorLayer = new VectorLayer({
                source: vectorSource,
                style: markerStyle
            });
            map.addLayer(vectorLayer);
        });
        fetch(`https://admin.map2web.eu/api/?key=44ce13e8d517e0f931492a8c8f641259b14f6c21&object=${feature.id_}`)
        .then(function(response) {
          return response.json();
        })
        .then(function(data) {
          let object = data.Wels.object;
            content.innerHTML = `<p><b>${object.name}</b></p>
              <p>Telefon: ${object.contact.tel1}</p>
              <p>${object.info}</p>`;
        })
       
     
      }
    });
  });