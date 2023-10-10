<template>
  <div class="map-wrap">
    <a href="https://www.maptiler.com" class="watermark"
      ><img
        src="https://api.maptiler.com/resources/logo.svg"
        alt="MapTiler logo"
    /></a>
    <div class="map" ref="mapContainer"></div>
    <toggle-layer @toggleLayerType="toggleLayerType" />
    <search-country @countrySelected="countrySelected" />
  </div>
</template>

<script>
import { useAppStore } from "../stores/appStore.js";
import ToggleLayer from "components/ToggleLayer.vue";
import SearchCountry from "components/SearchCountry.vue";
import { Map, Popup, NavigationControl, LngLatBounds } from "maplibre-gl";
import { shallowRef, onMounted, onUnmounted, markRaw, computed } from "vue";
import { addLayersToMap, flyToCountry } from "src/lib/maplib.js";
import { organizeTesisData, getData, addThesisDataTo } from "src/lib/utils.js";

export default {
  name: "TheMap",
  components: { ToggleLayer, SearchCountry },
  setup() {
    const mapContainer = shallowRef(null);
    const map = shallowRef(null);
    let popup;
    let debounceTimer;
    let hoveredStateId = null;
    let centroidsData,
      countriesData,
      thesisData,
      countriesWithThesis,
      originalData;
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
        map.value.setLayoutProperty(
          "unclustered-count",
          "visibility",
          "visible"
        );
        map.value.setLayoutProperty(
          "unclustered-point",
          "visibility",
          "visible"
        );
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
          style: "mapa_base_cat.json",
          center: [initialState.lng, initialState.lat],
          zoom: initialState.zoom,
          maxZoom: 4,
        })
      );
      const nav = new NavigationControl();
      map.value.addControl(nav, "top-left");

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
          ? "/tesis_api.json"
          : "//sigserver4.udg.edu/tesis/spa/tesis_totals.json";

        var centroidsUrl = "/centroids.json";
        var countriesUrl =
          "//d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_countries.geojson";

        originalData = await getData(thesisUrl);
        centroidsData = await getData(centroidsUrl);
        countriesData = await getData(countriesUrl);

        thesisData = organizeTesisData(originalData);
        countriesWithThesis = thesisData.paisos;
        appStore.setProgrames(thesisData.programes.sort());
        appStore.setCountryNames(thesisData.countryNames.sort());

        countriesData = addThesisDataTo(countriesData, countriesWithThesis);
        centroidsData = addThesisDataTo(centroidsData, countriesWithThesis);

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
            sum: ["+", ["get", "tesis"]],
          },
        });
        addLayersToMap(map, isClustered);
      });

      // Create a popup, but don't add it to the map yet.
      popup = new Popup({
        closeButton: false,
        closeOnClick: false,
      });

      map.value.on("click", "countries", (e) => {
        openCountryGraph(e);
      });

      map.value.on("click", "clusters", (e) => {
        const features = map.value.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        });
        const clusterId = features[0].properties.cluster_id;
        map.value
          .getSource("clusters")
          .getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;

            map.value.easeTo({
              center: features[0].geometry.coordinates,
              zoom,
            });
          });
      });

      map.value.on("click", "unclustered-point", (e) => {
        openCountryGraph(e);
      });

      const openCountryGraph = (e) => {
        const selected = e.features[0];
        const code = selected.properties.iso_a3;
        const info = countriesWithThesis[code];
        const nTesis = selected.properties.tesis;

        // flyToCountry(map, countriesData, code);
        appStore.setSelectedCountry({ code, info, nTesis });
        appStore.setCountryModalVisibility(true);
      };

      map.value.on("mousemove", "unclustered-point", () => {
        map.value.getCanvas().style.cursor = "pointer";
      });

      map.value.on("mouseleave", "unclustered-point", () => {
        map.value.getCanvas().style.cursor = "";
      });

      map.value.on("mousemove", "clusters", () => {
        map.value.getCanvas().style.cursor = "pointer";
      });

      map.value.on("mouseleave", "clusters", () => {
        map.value.getCanvas().style.cursor = "";
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

    const debounce = (param) => {
      window.clearTimeout(debounceTimer);
      map.value.getCanvas().style.cursor = "pointer";
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
      // var content = `
      //   <div class="popupTitle">
      //     <div class="name">  ${features[0].properties.name} </div>
      //     <div class="total">${features[0].properties.tesis}</div>
      //   </div>`;
      // const details = formatPopup(features[0].properties.abstract);
      // content += details;
      // if (features[0].properties.tesis) {
      //   popup.setLngLat(lngLat).setHTML(content).addTo(map.value);
      // } else {
      //   popup.remove();
      // }
    }
    const countrySelected = (code) => {
      if (code.length) {
        flyToCountry(map, countriesData, code);
      }
    };

    const handleFilter = (filter) => {
      filter = filter.toLowerCase();
      var schema = {
        type: "FeatureCollection",
        features: [],
      };
      var centroids = schema;
      var countries = schema;
      var filterFeatures;
      var filteredCountries = [];
      var nTesis = 0;
      // Get only countries with specifi programs and update tesis property
      const cloned = JSON.parse(JSON.stringify(centroidsData));
      filterFeatures = cloned.features.filter((e) => {
        if (e.properties.abstract) {
          const idx = e.properties.abstract.findIndex((s) => {
            return s[0].toLowerCase().includes(filter);
          });
          if (idx !== -1) {
            nTesis = e.properties.abstract[idx][1];
            e.properties.tesis = nTesis;
            // Features passes filtering
            return true;
          }
          // Features does not pass filtering
          return false;
        }
      });

      centroids.features = filterFeatures;
      map.value.getSource("clusters").setData(centroids);

      filterFeatures = countriesData.features.filter((e) => {
        if (e.properties.abstract) {
          return e.properties.abstract.some((s) => {
            if (s[0].toLowerCase().includes(filter)) {
              if (!filteredCountries.includes(e.properties.iso_a3)) {
                filteredCountries.push(e.properties.iso_a3);
              }
            }
            return s[0].toLowerCase().includes(filter);
          });
        }
      });

      countries.features = filterFeatures;
      map.value.getSource("countries").setData(countries);

      // Update countryNames from filtered thesis
      var filteredCountryNames = thesisData.countryNames.filter((f) => {
        return filteredCountries.includes(f.value);
      });
      appStore.setCountryNames(filteredCountryNames);
      console.log(countries.features);
      console.log(countriesData.features);
    };

    const handleResetFilter = () => {
      map.value.getSource("clusters").setData(centroidsData);
      map.value.getSource("countries").setData(countriesData);
      appStore.setCountryNames(thesisData.countryNames);
    };

    return {
      map,
      mapContainer,
      handleFilter,
      toggleLayerType,
      countrySelected,
      handleResetFilter,
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
