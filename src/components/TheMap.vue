<template>
  <div class="map-wrap">
    <a href="https://www.maptiler.com" class="watermark"
      ><img
        src="https://api.maptiler.com/resources/logo.svg"
        alt="MapTiler logo"
    /></a>
    <div class="map" ref="mapContainer"></div>
    <toggle-layer @toggleLayerType="toggleLayerType" />
    <search-country
      @countrySelected="countrySelected"
    />
  </div>
</template>

<script>
import { useAppStore } from "../stores/appStore.js";
import ToggleLayer from "components/ToggleLayer.vue";
import SearchCountry from "components/SearchCountry.vue";
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
  uncluster as unclusteredProperties,
} from "src/lib/paintProperties.js";

export default {
  name: "TheMap",
  components: { ToggleLayer, SearchCountry },
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
        map.value.setLayoutProperty("clustered-count", "visibility", "visible");
        map.value.setLayoutProperty("unclustered-count", "visibility", "visible");
        map.value.setLayoutProperty("unclustered-point", "visibility", "visible");
      } else {
        map.value.setLayoutProperty("clusters", "visibility", "none");
        map.value.setLayoutProperty("clustered-count", "visibility", "none");
        map.value.setLayoutProperty("unclustered-count", "visibility", "none");
        map.value.setLayoutProperty("unclustered-point", "visibility", "none");
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
      const nav = new NavigationControl()
      map.value.addControl(nav, 'top-left');

      class GeocodeControl {
        onAdd(map) {
          const template = document.createElement("template");
          template.innerHTML = `
            <div id="geocode-container">
              <input id="geocode-input" class="maplibregl-ctrl" type="text" placeholder="Enter an address or place e.g. 1 York St" size="50" />
              <button id="geocode-button" class="maplibregl-ctrl">Geocode</button>
            </div>
          `;

          return template.content;
        }
      }

      // const geocodeControl = new GeocodeControl();
      // map.value.addControl(geocodeControl, "top-right");

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
        appStore.setCountryNames(thesisData.countryNames.sort());

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
          clusterProperties: {
            sum: ["+", ["get", "tesis"]],
          },
        });

        map.value.addSource("clusters", {
          type: "geojson",
          data: centroidsData,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
          clusterProperties: {
            'sum': ['+', ["get", "tesis"]]
          }
          
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
        flyToCountry(code)
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

      // UNCLUSTERED
      map.value.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'clusters',
          filter: ['>', ['get', 'tesis'], 0],
          paint: unclusteredProperties
      })

      map.value.addLayer({
          id: 'unclustered-count',
          type: 'symbol',
          source: 'clusters',
          filter: ['>', ['get', 'tesis'], 0],
          layout: {
            'text-field': ["get", "tesis"],
            "text-font": ["FiraSans-Bold"],
            'text-size': 14,
          },
          paint: {
            'text-color': '#fff'
          }
      });      

      // CLUSTERED
      map.value.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'clusters',
          filter: ['>', ['get', 'sum'], 0],
          paint: clustersProperties
      });

      map.value.addLayer({
          id: 'clustered-count',
          type: 'symbol',
          source: 'clusters',
          filter: ['>', ['get', 'sum'], 0],
          layout: {
            // 'text-field': '{point_count_abbreviated}',
            "text-field": ["get", "sum"],
            "text-font": ["FiraSans-Bold"],
            'text-size': 14,
          },
          paint: {
            'text-color': '#fff'
          }
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

    const flyToCountry = (code) => {
        const countryGeom = getCountryGeometry(countriesData, code.toUpperCase());
        const bounds = getBbox(countryGeom);
        map.value.fitBounds(bounds, {
          padding: 20,
        });
    }

    const countrySelected = (code) => {
      if (code.length) {
        flyToCountry(code)
      }
    }

    return {
      map,
      mapContainer,
      filterData,
      toggleLayerType,
      countrySelected
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

#geocode-container {
  display: inline-flex;
  margin: 20px;
}
#geocode-input,
#geocode-button {
  font-size: 16px;
  margin: 0 2px 0 0;
  padding: 4px 8px;
}
#geocode-input {
  width: 300px;
}
</style>
