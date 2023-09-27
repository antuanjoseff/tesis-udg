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
import { Map, Popup, NavigationControl } from "maplibre-gl";
import { shallowRef, onMounted, onUnmounted, markRaw, handleError } from "vue";
import { mapData } from "src/assets/geojson.js";
import { api } from "src/boot/axios";
import { getRandomColor } from "src/lib/utils.js";

export default {
  name: "TheMap",
  setup() {
    const mapContainer = shallowRef(null);
    const map = shallowRef(null);
    let popup;

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
      let hoveredStateId = null;

      map.value = markRaw(
        new Map({
          container: mapContainer.value,
          style: "limits.json",
          center: [initialState.lng, initialState.lat],
          zoom: initialState.zoom,
        })
      );
      map.value.addControl(new NavigationControl());

      var countriesData, tesisData;
      map.value.once("load", () => {
        // This code runs once the base style has finished loading.
        const name_expr = ["get", "name"];
        var tesisUrl = process.env.DEV
          ? "/tesis_totals.json"
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
                tesisData = resp.data;
                countriesData.features.forEach((element, idx) => {
                  countriesData.features[idx].properties["tesis"] = tesisData[
                    element.properties.adm0_a3_is
                  ]
                    ? tesisData[element.properties.adm0_a3_is]
                    : 0;
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

      map.value.on("mousemove", "countries-polygon", debounce);

      map.value.on("mouseleave", "countries-polygon", (e) => {
        map.value.getCanvas().style.cursor = "";
        popup.remove();
        console.log("mouse out");
        map.value.setFilter("countries-polygon", null);
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
        filter: [">", ["get", "tesis"], 0],
        paint: {
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
          "fill-opacity": 0.8,
        },
      });
    }

    // let throttleTimer;

    // const throttle = (param) => {
    //   if (throttleTimer) return;
    //   throttleTimer = true;
    //   setTimeout(
    //     (features, lngLat) => {
    //       console.log(features);
    //       handleMouseMove(features, lngLat);
    //       throttleTimer = false;
    //     },
    //     250,
    //     param.features,
    //     param.lngLat
    //   );
    // };

    let debounceTimer;

    const debounce = (param) => {
      window.clearTimeout(debounceTimer);
      debounceTimer = setTimeout(
        (features, lngLat) => {
          handleMouseMove(features, lngLat);
        },
        100,
        param.features,
        param.lngLat
      );
    };

    function handleMouseMove(features, lngLat) {
      var color1 = getRandomColor();
      var color2 = getRandomColor();
      var color3 = getRandomColor();
      var color4 = getRandomColor();
      var color5 = getRandomColor();
      var color6 = getRandomColor();

      var randomColors = [
        "case",
        [">", ["to-number", ["get", "tesis"]], 1000],
        color1,
        [">", ["to-number", ["get", "tesis"]], 30],
        color2,
        [">=", ["to-number", ["get", "tesis"]], 5],
        color3,
        [">=", ["to-number", ["get", "tesis"]], 4],
        color4,
        [">=", ["to-number", ["get", "tesis"]], 2],
        color5,
        ["==", ["to-number", ["get", "tesis"]], 1],
        color6,
        "#fff0",
      ];

      map.value.getCanvas().style.cursor = "pointer";
      var content =
        features[0].properties.name + ": " + features[0].properties.tesis;

      if (features[0].properties.tesis) {
        map.value.setFilter("countries-polygon", [
          "==",
          "tesis",
          features[0].properties.tesis,
        ]);
      }

      if (features[0].properties.tesis > 50) {
        map.value.setPaintProperty("countries-polygon", "fill-color", [
          "case",
          [">", ["to-number", ["get", "tesis"]], 1000],
          "violet",
          [">", ["to-number", ["get", "tesis"]], 30],
          "red",
          [">=", ["to-number", ["get", "tesis"]], 5],
          "orange",
          [">=", ["to-number", ["get", "tesis"]], 4],
          "yellow",
          [">=", ["to-number", ["get", "tesis"]], 2],
          "green",
          [">=", ["to-number", ["get", "tesis"]], 1],
          "blue",
          "#fff0",
        ]);
      } else {
        map.value.setPaintProperty(
          "countries-polygon",
          "fill-color",
          randomColors
        );
      }

      if (features[0].properties.tesis) {
        popup.setLngLat(lngLat).setHTML(content).addTo(map.value);
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
