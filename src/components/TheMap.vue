<template>
  <div class="map-wrap">
    <a href="https://www.maptiler.com" class="watermark"
      ><img
        src="https://api.maptiler.com/resources/logo.svg"
        alt="MapTiler logo"
    /></a>
    <div class="map" ref="mapContainer"></div>
  </div>
</template>

<script>
import { Map, Popup, NavigationControl, LngLatBounds } from "maplibre-gl";
import { shallowRef, onMounted, onUnmounted, markRaw, handleError } from "vue";
import { api } from "src/boot/axios";
import { getRandomColor,
         getBbox,
         getCountryGeometry,
         getCountryAbstract,
         organizeTesisData,
         formatPopup
       } from "src/lib/utils.js";

export default {
  name: "TheMap",
  setup() {
    const mapContainer = shallowRef(null);
    const map = shallowRef(null);
    let popup;
    let debounceTimer;
    let hoveredStateId = null;
    let countriesData, tesisData;

    const COUNTRY_PALETTE = [
      "#f0d27e",
      "#789d23",
      "#c06e51",
      "#b3e467",
      "#84241a",
      "#d9c0c7",
    ];

    onMounted(() => {
      //   const apiKey = 'YOUR_MAPTILER_API_KEY_HERE';

      // const initialState = { lng: -70.11617, lat: 43.6844, zoom: 14 };
      const initialState = { lng: 2.813179, lat: 41.98211, zoom: 2 };

      map.value = markRaw(
        new Map({
          container: mapContainer.value,
          style: "limits.json",
          center: [initialState.lng, initialState.lat],
          zoom: initialState.zoom,
          maxZoom: 4,
        })
      );
      map.value.addControl(new NavigationControl());

      map.value.once("load", () => {
        // This code runs once the base style has finished loading.
        const name_expr = ["get", "name"];
        var tesisUrl = process.env.DEV
          ? "/tesis_llista.json"
          : "//sigserver4.udg.edu/tesis/spa/tesis_totals.json";

        api
          .get(
            "//d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson"
          )
          .then((response) => {
            countriesData = response.data;
            api
              .get(tesisUrl)
              .then((resp) => {
                tesisData = organizeTesisData(resp.data, 'TECNOLOGIA');
                countriesData.features.forEach((element, idx) => {
                  var code = element.properties.adm0_a3_is
                  countriesData.features[idx]["id"] = idx;
                  if (code in tesisData) {
                    countriesData.features[idx].properties["tesis"] = tesisData[code].total
                    countriesData.features[idx].properties["abstract"] = tesisData[code].abstract
                  } 
                });
                addCountriesLayer(countriesData);
              })
              .catch(() => {});
          })
          .catch(() => {});
      });

      // Create a popup, but don't add it to the map yet.
      popup = new Popup({
        closeButton: false,
        closeOnClick: false,
      });

      map.value.on("click", "countries-polygon", (e) => {
        const code = e.features[0].properties.adm0_a3;
        const countryGeom = getCountryGeometry(countriesData, code);
        const bounds = getBbox(countryGeom);
        map.value.fitBounds(bounds, {
          padding: 20,
        });
      });

      map.value.on("mousemove", "countries-polygon", debounce);

      map.value.on("mouseleave", "countries-polygon", (e) => {
        map.value.getCanvas().style.cursor = "";
        if (hoveredStateId) {
          map.value.setFeatureState(
            { source: "countries", id: hoveredStateId },
            { hover: false }
          );
        }
        hoveredStateId = null;
        // popup.remove();
        window.clearTimeout(debounceTimer);
        // map.value.setFilter("countries-polygon", null);
      });
    }),
      onUnmounted(() => {
        map.value?.remove();
      });

    function addCountriesLayer(data) {
      map.value.addSource("countries", {
        type: "geojson",
        data: data,
      });

      map.value.addLayer({
        id: "countries-polygon",
        type: "fill",
        source: "countries",
        layout: {},
        // filter: [">", ["get", "tesis"], 0],
        paint: {
          'fill-opacity': [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            0.9,
            0.7
          ],
          "fill-color": [
            "case",
            [">", ["to-number", ["get", "tesis"]], 1000],
            "#bd0026",
            [">", ["to-number", ["get", "tesis"]], 30],
            "#f03b20",
            [">=", ["to-number", ["get", "tesis"]], 5],
            "#fd8d3c",
            [">=", ["to-number", ["get", "tesis"]], 4],
            "#feb24c",
            [">=", ["to-number", ["get", "tesis"]], 2],
            "#fed976",
            [">=", ["to-number", ["get", "tesis"]], 1],
            "#ffffb2",
            "#fff0",
          ],
        },
      });
      // Add polygons outline as new layer
      map.value.addLayer({
        id: "countries-boundaries",
        type: "line",
        source: "countries",
        layout: {},
        paint: {
          'line-color': '#000',
          'line-width': [
            "case",
            ["==", ["to-number", ["get", "tesis"]], 0], 0,
            ["boolean", ["feature-state", "hover"], false],
            2,
            1
          ],
        }
      })      
    }

    const debounce = (param) => {
      window.clearTimeout(debounceTimer);
      debounceTimer = setTimeout(
        (features, lngLat) => {
          handleMouseMove(features, lngLat);
        },
        10,
        param.features,
        param.lngLat
      );
      if (param.features.length > 0) {
        if (hoveredStateId) {
          map.value.setFeatureState(
            { source: "countries", id: hoveredStateId },
            { hover: false }
          );
        }
        hoveredStateId = param.features[0].id;
        map.value.setFeatureState(
          { source: "countries", id: hoveredStateId },
          { hover: true }
        );
      }
    };

    function handleMouseMove(features, lngLat) {
      map.value.getCanvas().style.cursor = "pointer";

      var content = `
        <div class="popupTitle">
          <div class="name">  ${features[0].properties.name} </div> 
          <div class="total">${features[0].properties.tesis}</div>
        </div>`

      const details = formatPopup(features[0].properties.abstract)
      content += details

      // var color1 = getRandomColor();
      // var color2 = getRandomColor();
      // var color3 = getRandomColor();
      // var color4 = getRandomColor();
      // var color5 = getRandomColor();
      // var color6 = getRandomColor();

      // var randomColors = [
      //   "case",
      //   [">", ["to-number", ["get", "tesis"]], 100],
      //   color1,
      //   [">", ["to-number", ["get", "tesis"]], 50],
      //   color2,
      //   [">=", ["to-number", ["get", "tesis"]], 10],
      //   color3,
      //   [">=", ["to-number", ["get", "tesis"]], 5],
      //   color4,
      //   [">=", ["to-number", ["get", "tesis"]], 0],
      //   color5,
      //   // ["==", ["to-number", ["get", "tesis"]], 1],
      //   // color6,
      //   "#fff0",
      // ];
      // if (features[0].properties.tesis > 50) {
      //   map.value.setPaintProperty("countries-polygon", "fill-color", [
      //     "case",
      //     [">", ["to-number", ["get", "tesis"]], 1000],
      //     "violet",
      //     [">", ["to-number", ["get", "tesis"]], 30],
      //     "red",
      //     [">=", ["to-number", ["get", "tesis"]], 5],
      //     "orange",
      //     [">=", ["to-number", ["get", "tesis"]], 4],
      //     "yellow",
      //     [">=", ["to-number", ["get", "tesis"]], 2],
      //     "green",
      //     [">=", ["to-number", ["get", "tesis"]], 1],
      //     "blue",
      //     "#fff0",
      //   ]);
      // } else {
      //   map.value.setPaintProperty(
      //     "countries-polygon",
      //     "fill-color",
      //     randomColors
      //   );
      // }

      if (features[0].properties.tesis) {
        popup.setLngLat(lngLat).setHTML(content).addTo(map.value);
      } else {
        popup.remove();
      }
    }

    return {
      map,
      mapContainer,
    };
  },
};
</script>

<style scoped>
.map-wrap {
  position: relative;
  width: 100%;
  height: 100vh;
  /* height: calc(100vh - 77px); */
}

.map {
  position: absolute;
  width: 100%;
  height: 100%;
}

.watermark {
  position: absolute;
  left: 10px;
  bottom: 10px;
  z-index: 999;
}

</style>
