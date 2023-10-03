<template>
  <div class="map-wrap">
    <a href="https://www.maptiler.com" class="watermark"
      ><img
        src="https://api.maptiler.com/resources/logo.svg"
        alt="MapTiler logo"
    /></a>
    <div class="map" ref="mapContainer"></div>
    <toggle-layer @toggleLayerType="toggleLayerType" />
  </div>
</template>

<script>
import { useAppStore } from "../stores/appStore.js";
import ToggleLayer from "components/ToggleLayer.vue";
import { Map, Popup, NavigationControl, LngLatBounds } from "maplibre-gl";
import { shallowRef, onMounted, onUnmounted, markRaw, computed } from "vue";
import {
  getRandomColor,
  getBbox,
  getCountryGeometry,
  getCountryAbstract,
  organizeTesisData,
  formatPopup,
  getData,
  addThesisDataTo,
} from "src/lib/utils.js";
import {
  clusters as clustersProperties,
  countries as countriesProperties,
} from "src/lib/paintProperties.js";

export default {
  name: "TheMap",
  components: { ToggleLayer },
  setup() {
    const mapContainer = shallowRef(null);
    const map = shallowRef(null);
    let popup;
    let debounceTimer;
    let hoveredStateId = null;
    let centroidsData, countriesData, thesisData, thesisCountries, originalData;
    const appStore = useAppStore();

    const isClustered = computed(() => {
      return appStore.isClustered;
    });

    const toggleLayerType = () => {
      appStore.setClustered(!appStore.isClustered);
      if (isClustered.value) {
        map.value.setLayoutProperty("countries", "visibility", "none");
        map.value.setLayoutProperty("clusters", "visibility", "visible");
        map.value.setLayoutProperty("clusters-count", "visibility", "visible");
      } else {
        map.value.setLayoutProperty("clusters", "visibility", "none");
        map.value.setLayoutProperty("clusters-count", "visibility", "none");
        map.value.setLayoutProperty("countries", "visibility", "visible");
      }
    };

    onMounted(() => {
      //   const apiKey = 'YOUR_MAPTILER_API_KEY_HERE';

      // const initialState = { lng: -70.11617, lat: 43.6844, zoom: 14 };
      const initialState = { lng: 2.813179, lat: 41.98211, zoom: 2 };

      const homePosition = {
        center: [144, -37],
      };

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

      map.value.once("load", async () => {
        // This code runs once the base style has finished loading.
        const name_expr = ["get", "name"];
        var thesisUrl = process.env.DEV
          ? "/tesis_llista.json"
          : "//sigserver4.udg.edu/tesis/spa/tesis_totals.json";

        var centroidsUrl = "/centroids.json";
        var countriesUrl =
          "//d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson";

        originalData = await getData(thesisUrl);
        centroidsData = await getData(centroidsUrl);
        countriesData = await getData(countriesUrl);

        thesisData = organizeTesisData(originalData);
        thesisCountries = thesisData.paisos;
        appStore.setProgrames(thesisData.programes.sort());

        countriesData = addThesisDataTo(countriesData, thesisCountries);
        centroidsData = addThesisDataTo(centroidsData, thesisCountries);

        // Sort data to first draw bigger circles
        countriesData.features.sort((a, b) => {
          if (a.properties.tesis === b.properties.tesis) {
            return 0;
          } else {
            return a.properties.tesis < b.properties.tesis ? 1 : -1;
          }
        });

        // Add sources (countries & boundaries)
        map.value.addSource("countries", {
          type: "geojson",
          data: countriesData,
        });

        map.value.addSource("clusters", {
          type: "geojson",
          data: centroidsData,
        });

        addLayersToMap();
      });

      // Create a popup, but don't add it to the map yet.
      popup = new Popup({
        closeButton: false,
        closeOnClick: false,
      });

      map.value.on("click", "countries", (e) => {
        const code = e.features[0].properties.adm0_a3;
        const countryGeom = getCountryGeometry(countriesData, code);
        const bounds = getBbox(countryGeom);
        map.value.fitBounds(bounds, {
          padding: 20,
        });
      });

      map.value.on("mousemove", "countries", debounce);

      map.value.on("mouseleave", "countries", (e) => {
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
        // map.value.setFilter("countries", null);
      });
    }),
      onUnmounted(() => {
        map.value?.remove();
      });
    const filterData = async (filter) => {
      const thesisData = organizeTesisData(originalData, filter);
      thesisCountries = thesisData.paisos;
      countriesData.features.forEach((element, idx) => {
        var code = element.properties.iso_a3;
        countriesData.features[idx]["id"] = idx;
        if (code in thesisCountries) {
          countriesData.features[idx].properties["tesis"] =
            thesisCountries[code].total;
          countriesData.features[idx].properties["abstract"] =
            thesisCountries[code].abstract;
        } else {
          countriesData.features[idx].properties["tesis"] = 0;
          countriesData.features[idx].properties["abstract"] = null;
        }
      });

      map.value.getSource("countries").setData(countriesData);
    };

    function addLayersToMap() {
      // Add countries boundaries
      map.value.addLayer({
        id: "boundaries",
        type: "line",
        source: "countries",
        layout: {},
        // properties
        paint: {
          "line-color": "#000",
          "line-width": [
            "case",
            ["==", ["to-number", ["get", "tesis"]], 0],
            0,
            ["boolean", ["feature-state", "hover"], false],
            2,
            1,
          ],
        },
      });

      map.value.addLayer({
        id: "countries",
        type: "fill",
        source: "countries",
        layout: {
          visibility: isClustered.value ? "none" : "visible",
        },
        filter: [">", ["get", "tesis"], 0],
        paint: countriesProperties,
      });

      map.value.addLayer({
        id: "clusters",
        type: "circle",
        source: "clusters",
        layout: {
          visibility: isClustered.value ? "visible" : "none",
        },
        filter: [">", ["get", "tesis"], 0],
        paint: clustersProperties,
      });

      map.value.addLayer({
        id: "clusters-count",
        type: "symbol",
        source: "clusters",
        filter: [">", ["get", "tesis"], 0],
        layout: {
          visibility: isClustered.value ? "visible" : "none",
          "text-field": ["get", "tesis"],
          "text-font": ["FiraSans-Bold"],
          "text-size": 15,
          "text-overlap": "always",
        },
        paint: {
          "text-color": "#fff",
        },
      });
    }

    const debounce = (param) => {
      // window.clearTimeout(debounceTimer);
      // debounceTimer = setTimeout(
      //   (features, lngLat) => {
      //     handleMouseMove(features, lngLat);
      //   },
      //   10,
      //   param.features,
      //   param.lngLat
      // );
      // if (param.features.length > 0) {
      //   if (hoveredStateId) {
      //     map.value.setFeatureState(
      //       { source: "countries", id: hoveredStateId },
      //       { hover: false }
      //     );
      //   }
      //   hoveredStateId = param.features[0].id;
      //   map.value.setFeatureState(
      //     { source: "countries", id: hoveredStateId },
      //     { hover: true }
      //   );
      // }
    };

    function handleMouseMove(features, lngLat) {
      map.value.getCanvas().style.cursor = "pointer";

      var content = `
        <div class="popupTitle">
          <div class="name">  ${features[0].properties.name} </div>
          <div class="total">${features[0].properties.tesis}</div>
        </div>`;

      const details = formatPopup(features[0].properties.abstract);
      content += details;

      if (features[0].properties.tesis) {
        popup.setLngLat(lngLat).setHTML(content).addTo(map.value);
      } else {
        popup.remove();
      }
    }

    return {
      map,
      mapContainer,
      filterData,
      toggleLayerType,
    };
  },
};
</script>

<style scoped>
.map-wrap {
  position: relative;
  width: 100%;
  height: 100vh;
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
