/* jshint esversion: 6 */
  import Map from 'ol/Map.js';
  import Overlay from 'ol/Overlay.js';
  import View from 'ol/View.js';
  import {toStringHDMS} from 'ol/coordinate.js';
  import {tile as tileStrategy} from 'ol/loadingstrategy.js';
  import {createXYZ} from 'ol/tilegrid.js';
  import { Vector as VectorLayer} from 'ol/layer.js';
  import VectorSource from 'ol/source/Vector.js';
  import TileLayer from 'ol/layer/Tile.js';
  import {fromLonLat, toLonLat} from 'ol/proj.js';
   import EsriJSON from 'ol/format/EsriJSON.js';
   import Feature from 'ol/Feature';
  import OSM from 'ol/source/OSM.js';
   import {defaults as defaultInteractions, Draw, Modify, Select} from 'ol/interaction.js';

  var  serviceUrl='https://192.168.11.169:6443/arcgis/rest/services/popup/FeatureServer/';
  let  layer='0';
     var esrijsonFormat = new EsriJSON();
      var tLayer = new TileLayer({
        source: new OSM()
      });
      var vectorSource = new VectorSource({
              loader: function(extent, resolution, projection) {
                var url = serviceUrl + layer + '/query/?f=json&' +
                    'returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry=' +
                    encodeURIComponent('{"xmin":' + extent[0] + ',"ymin":' +
                        extent[1] + ',"xmax":' + extent[2] + ',"ymax":' + extent[3] +
                        ',"spatialReference":{"wkid":102100}}') +
                    '&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*' +
                    '&outSR=102100';
                $.ajax({url: url, dataType: 'jsonp', success: function(response) {
                  if (response.error) {
                    alert(response.error.message + '\n' +
                        response.error.details.join('\n'));
                  } else {
                    // dataProjection will be read from document
                    var features = esrijsonFormat.readFeatures(response, {
                      featureProjection: projection
                    });
                    if (features.length > 0) {
                      vectorSource.addFeatures(features);
                    }
                  }
                }});
              },
              strategy: tileStrategy(createXYZ({
                tileSize: 512
              }))
            });
            var vector = new VectorLayer({
       source: vectorSource
     });
     var select = new Select();
  //   select.setActive('MODIFY');

      var map = new Map({
         interactions: defaultInteractions().extend([ select]),
        layers: [tLayer,vector],
        target: 'map',
        view: new View({
          center: [11584800.784215583, 3587340.222822758],
          zoom: 19
        })
      });

      var pos = fromLonLat([16.3725, 48.208889]);

      // Vienna marker
      var marker = new Overlay({
        position: pos,
        positioning: 'center-center',
        element: document.getElementById('marker'),
        stopEvent: false
      });
      map.addOverlay(marker);

      // Vienna label
      var vienna = new Overlay({
        position: pos,
        element: document.getElementById('vienna')
      });
      map.addOverlay(vienna);

      // Popup showing the position the user clicked
      var popup = new Overlay({
        element: document.getElementById('popup')
      });
      map.addOverlay(popup);
      select.on("select",function(e){
        if(e.selected.length !=0){
          let coordinate=e.mapBrowserEvent.coordinate;
          let properties=e.selected[0].getProperties();
          console.log(coordinate);
            var element = popup.getElement();
            $(element).popover('destroy');
            popup.setPosition(coordinate);
            $(element).popover({
              placement: 'top',
              animation: false,
              html: true,
              content: '<p></p><code>' + '<table>'+'<tr><td>id:</td><td>'+properties.OBJECTID+'</td></tr>'+'<tr><td>名称:</td><td>'+properties.NAME +'</td></tr>'+'<tr><td>地基面积:</td><td>'+properties["SDE.house_1.AREA"] +'</td></tr>'+'</table>' + '</code>'
            });
            $(element).popover('show');
        }
      });
