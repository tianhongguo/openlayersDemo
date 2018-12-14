 import Map from 'ol/Map.js';
      import View from 'ol/View.js';
      import EsriJSON from 'ol/format/EsriJSON.js';
      import {defaults as defaultInteractions, Draw, Modify, Select} from 'ol/interaction.js';
      import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer.js';
      import {tile as tileStrategy} from 'ol/loadingstrategy.js';
      import {fromLonLat} from 'ol/proj.js';
      import VectorSource from 'ol/source/Vector.js';
      import XYZ from 'ol/source/XYZ.js';
      import {createXYZ} from 'ol/tilegrid.js';
	  import Overlay from 'ol/Overlay';

      var serviceUrl = 'https://192.168.11.169:6443/arcgis/rest/services/demo1/FeatureServer/';
      var layer = '0';

      var esrijsonFormat = new EsriJSON();

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

      var raster = new TileLayer({
        source: new XYZ({
          attributions: 'Tiles © <a href="https://services.arcgisonline.com/ArcGIS/' +
              'rest/services/World_Topo_Map/MapServer">ArcGIS</a>',
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/' +
              'World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
        })
      });

      var draw = new Draw({
        source: vectorSource,
        type: 'Polygon'
      });

      var select = new Select();
      select.setActive(false);
      var selected = select.getFeatures();

      var modify = new Modify({
        features: selected
      });
      modify.setActive(false);

      var map = new Map({
        interactions: defaultInteractions().extend([draw, select, modify]),
        layers: [raster, vector],
        target: document.getElementById('map'),
        view: new View({
          center: fromLonLat([-122.619, 45.512]),
          zoom: 12
        })
      });

      var typeSelect = document.getElementById('type');


      /**
       * Let user change the interaction type.
       */
      typeSelect.onchange = function() {
        draw.setActive(typeSelect.value === 'DRAW');
        select.setActive(typeSelect.value === 'MODIFY');
        modify.setActive(typeSelect.value === 'MODIFY');
      };

      var dirty = {};

      selected.on('add', function(evt) {
        var feature = evt.element;
        feature.on('change', function(evt) {
          dirty[evt.target.getId()] = true;
        });
      });

      selected.on('remove', function(evt) {
        var feature = evt.element;
        var fid = feature.getId();
        if (dirty[fid] === true) {
          var payload = '[' + esrijsonFormat.writeFeature(feature, {
            featureProjection: map.getView().getProjection()
          }) + ']';
          var url = serviceUrl + layer + '/updateFeatures';
          $.post(url, {f: 'json', features: payload}).done(function(data) {
            var result = JSON.parse(data);
            if (result.updateResults && result.updateResults.length > 0) {
              if (result.updateResults[0].success !== true) {
                var error = result.updateResults[0].error;
                alert(error.description + ' (' + error.code + ')');
              } else {
                delete dirty[fid];
              }
            }
          });
        }
      });

      draw.on('drawend', function(evt) {
        var feature = evt.feature;
        var payload = '[' + esrijsonFormat.writeFeature(feature, {
          featureProjection: map.getView().getProjection()
        }) + ']';
        var url = serviceUrl + layer + '/addFeatures';
        $.post(url, {f: 'json', features: payload}).done(function(data) {
          var result = JSON.parse(data);
          if (result.addResults && result.addResults.length > 0) {
            if (result.addResults[0].success === true) {
              feature.setId(result.addResults[0]['objectId']);
              vectorSource.clear();
            } else {
              var error = result.addResults[0].error;
              alert(error.description + ' (' + error.code + ')');
            }
          }
        });
      });
