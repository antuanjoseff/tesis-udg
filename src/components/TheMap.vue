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
import { shallowRef, onMounted, onUnmounted, markRaw } from "vue";
import { mapData } from "src/assets/geojson.js";

export default {
  name: "TheMap",
  setup() {
    const mapContainer = shallowRef(null);
    const map = shallowRef(null);

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
          // style: 'https://geoserveis.icgc.cat/contextmaps/icgc_mapa_estandard.json',
          // style: 'style-tesis.json',
          style: "limits.json",
          center: [initialState.lng, initialState.lat],
          zoom: initialState.zoom,
        })
      );
      map.value.addControl(new NavigationControl());

      map.value.once("load", () => {
        // This code runs once the base style has finished loading.
        const name_expr = ["get", "name"];
        map.value.addSource("countries", {
          type: "geojson",
          data: "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson",
        });
        map.value.addLayer({
          id: "countries-polygon",
          type: "fill",
          source: "countries",
          layout: {},
          paint: {
            // "fill-color": [
            //   "to-color",
            //   ["at", ["get", "labelrank"], ["literal", COUNTRY_PALETTE]],
            // ],
            "fill-color":
              // use the `level` style variable to determine the color
              [
                "case",
                ["==", name_expr, "Spain"],
                "green",
                ["==", name_expr, "France"],
                "yellow",
                ["==", name_expr, "Italy"],
                "red",
                // Default value
                "#" + Math.floor(Math.random() * 16777215).toString(16),
              ],
            "fill-opacity": 0.8,
          },
        });
      });

      map.value.on("load", () => {
        // Add an image to use as a custom marker
        map.value.loadImage(
          "https://maplibre.org/maplibre-gl-js/docs/assets/osgeo-logo.png",
          (error, image) => {
            if (error) throw error;
            map.value.addImage("custom-marker", image);
            // Add a GeoJSON source with 15 points
            map.value.addSource("tesis", {
              type: "geojson",
              data: mapData,
              // 'cluster': true,
              // 'clusterRadius': 80
            });

            // Add a symbol layer
            map.value.addLayer({
              id: "tesis",
              type: "symbol",
              source: "tesis",
              layout: {
                "icon-image": "custom-marker",
                // get the year from the source's "year" property
                "text-field": ["get", "year"],
                "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
                "text-offset": [0, 1.25],
                "text-anchor": "top",
              },
            });
          }
        );
      });

      // Create a popup, but don't add it to the map yet.
      const popup = new Popup({
        closeButton: false,
        closeOnClick: false,
      });

      map.value.on("mousemove", "tesis", (e) => {
        popup.setLngLat(e.lngLat);
      });

      map.value.on("mousemove", "countries-polygon", (e) => {
        map.value.getCanvas().style.cursor = "pointer";
        console.log(e.features[0].properties.name)
      })

      map.value.on("mouseenter", "tesis", (e) => {
        // Change the cursor style as a UI indicator.
        map.value.getCanvas().style.cursor = "pointer";

        const coordinates = e.features[0].geometry.coordinates.slice();
        const description = e.features[0].properties.name;
        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        // while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        //     coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        // }

        // Populate the popup and set its coordinates
        // based on the feature found.
        popup.setLngLat(e.lngLat).setHTML(description).addTo(map.value);
      });

      map.value.on("mouseleave", "tesis", () => {
        map.value.getCanvas().style.cursor = "";
        popup.remove();
      });
    }),
      onUnmounted(() => {
        map.value?.remove();
      });

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
