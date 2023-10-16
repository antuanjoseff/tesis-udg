<template>
  <div class="map-wrap">
    <div class="map" ref="mapContainer"></div>
    <toggle-layer @toggleLayerType="toggleLayerType" />
    <search-country
      @countrySelected="countrySelected"
      @resetCountrySearch="resetCountrySearch"
    />
    <filter-box
      @filterSet="handleFilter"
      @filterReset="handleResetFilter"
    ></filter-box>
  </div>

  <!-- RELOAD TEMPLATE -->
  <template>
    <div ref="reloadButton" id="control-reload-container">
      <button class="maplibregl-ctrl reload-ctrl" @click="reloadPage"></button>
    </div>
  </template>

  <!-- FILTER TEMPLATE -->
  <template>
    <div ref="filterButton" id="control-filter-container">
      <button
        id="filter-button"
        class="maplibregl-ctrl filter-ctrl"
        @click="toggleFilter"
      >
        F
      </button>
    </div>
  </template>
</template>

<script>
import { useAppStore } from "../stores/appStore.js";
import ToggleLayer from "components/ToggleLayer.vue";
import SearchCountry from "components/SearchCountry.vue";
import FilterBox from "components/FilterBox.vue";
import { Map, Popup, NavigationControl, FullscreenControl } from "maplibre-gl";
import {
  ref,
  shallowRef,
  onMounted,
  onUnmounted,
  markRaw,
  computed,
} from "vue";
import { addLayersToMap, flyToCountry } from "src/lib/maplib.js";
import { organizeThesisData, getData, addThesisDataTo } from "src/lib/utils.js";

export default {
  name: "TheMap",
  components: { ToggleLayer, SearchCountry, FilterBox },
  emits: ["toggle-filter"],
  setup(props, context) {
    const mapContainer = shallowRef(null);
    const map = shallowRef(null);
    const reloadButton = ref();
    const filterButton = ref();
    let popup;
    let debounceTimer = 50;
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

    const filteredProgram = computed(() => {
      return appStore.getFilteredProgram;
    });

    const toggleLayerType = () => {
      appStore.setClustered(!appStore.isClustered);
      if (isClustered.value) {
        map.value.setLayoutProperty("countries", "visibility", "none");
        map.value.setLayoutProperty("clusters", "visibility", "visible");
        map.value.setLayoutProperty("clustered-count", "visibility", "visible");
        map.value.setLayoutProperty("unclustered", "visibility", "visible");
        // map.value.setLayoutProperty( "unclustered-count", "visibility", "visible");
      } else {
        map.value.setLayoutProperty("countries", "visibility", "visible");
        map.value.setLayoutProperty("clusters", "visibility", "none");
        map.value.setLayoutProperty("clustered-count", "visibility", "none");
        map.value.setLayoutProperty("unclustered", "visibility", "none");
        // map.value.setLayoutProperty("unclustered-count", "visibility", "none");
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

      // DEFINE MARKER
      var marker_url = process.env.DEV
        ? "/marker.png"
        : "//sigserver4.udg.edu/tesis/spa/marker.png";

      map.value.loadImage(marker_url, (error, image) => {
        if (error) {
          throw error;
        }
        map.value.addImage("marker", image);
      });

      class CustomControl {
        constructor(refTemplate) {
          this.template = refTemplate;
        }
        onAdd(map) {
          return this.template.value;
        }
        onRemove(map) {}
      }

      map.value.once("load", async () => {
        const reloadControl = new CustomControl(reloadButton);
        map.value.addControl(reloadControl, "top-left");

        map.value.addControl(new FullscreenControl(), "top-left");

        const filterControl = new CustomControl(filterButton);
        map.value.addControl(filterControl, "top-left");

        // This code runs once the base style has finished loading.
        const name_expr = ["get", "name"];
        var thesisUrl = process.env.DEV
          ? "/tesis_api.json"
          : "//sigserver4.udg.edu/tesis/spa/tesis_api.json";

        var centroidsUrl = process.env.DEV
          ? "/centroids.json"
          : "//sigserver4.udg.edu/tesis/spa/centroids.json";

        var countriesUrl = process.env.DEV
          ? "/countries.json"
          : "//sigserver4.udg.edu/tesis/spa/countries.json";

        originalData = await getData(thesisUrl);
        centroidsData = await getData(centroidsUrl);

        const noName = appStore.getLRnoName;
        thesisData = organizeThesisData(originalData, noName);
        countriesWithThesis = thesisData.paisos;
        const keys = Object.keys(countriesWithThesis);

        // Remove centroids with no thesis to avoid cluster centroids with 0 thesis
        const features = centroidsData.features.filter((centroid) => {
          return keys.includes(centroid.properties.iso_a3.toUpperCase());
        });

        centroidsData.features = features;
        countriesData = await getData(countriesUrl);

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
          // clusterProperties: {
          //   sum: ["+", ["get", "tesis"]],
          // },
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
        openModal(e);
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

      map.value.on("click", "unclustered", (e) => {
        openModal(e);
      });

      const openModal = (e) => {
        const selected = e.features[0];
        const code = selected.properties.iso_a3;
        const info = countriesWithThesis[code];
        const nTesis = selected.properties.tesis;

        // flyToCountry(map, countriesData, code);
        appStore.setSelectedCountry({ code, info, nTesis });
        if (filteredProgram.value === "") {
          appStore.setProgramModalVisibility(true);
        } else {
          appStore.setLRModalVisibility(true);
        }
      };

      map.value.on("mousemove", "unclustered", () => {
        map.value.getCanvas().style.cursor = "pointer";
      });

      map.value.on("mouseleave", "unclustered", () => {
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
        popup.remove();
        window.clearTimeout(debounceTimer);
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
      const code = features[0].properties.iso_a3;
      const country = thesisData.countryNames.find((c) => {
        return c.value == code;
      });
      var content = `
        <div class="popupTitle">
          <div class="name">  ${country.label} </div>
          <div class="total">${features[0].properties.tesis} <span>tesis</span></div>
        </div>`;

      if (features[0].properties.tesis) {
        popup.setLngLat(lngLat).setHTML(content).addTo(map.value);
      } else {
        popup.remove();
      }
    }
    const countrySelected = (code) => {
      if (code.length) {
        flyToCountry(map, countriesData, code);
      }
    };

    const handleFilter = (filter) => {
      let filteredCountryKeys = [];
      let filteredCountriesData = JSON.parse(JSON.stringify(countriesData));
      let filteredCentroidsData = JSON.parse(JSON.stringify(centroidsData));

      filteredCountriesData.features.forEach((country, idx) => {
        const nTesis = getThesisByProgramAndCountry(
          country.properties.iso_a3,
          filter
        );
        filteredCountriesData.features[idx].properties.tesis = nTesis;
        if (nTesis) {
          const countryCode =
            filteredCountriesData.features[idx].properties.iso_a3;
          if (!filteredCountryKeys.includes(countryCode)) {
            filteredCountryKeys.push(countryCode);
          }
        }
      });

      filteredCentroidsData.features.forEach((country, idx) => {
        filteredCentroidsData.features[idx].properties.tesis =
          getThesisByProgramAndCountry(country.properties.iso_a3, filter);
      });

      const features = filteredCentroidsData.features.filter((feature) => {
        return filteredCountryKeys.includes(feature.properties.iso_a3);
      });

      filteredCentroidsData.features = features;

      map.value.getSource("countries").setData(filteredCountriesData);
      map.value.getSource("clusters").setData(filteredCentroidsData);

      const researchLines = getProgramResearchLines(filter.program);
      appStore.setResearchLines(researchLines);
    };

    const getProgramResearchLines = (program) => {
      const idx = thesisData.programes.findIndex((p) => {
        return p.name === program;
      });

      if (idx !== -1) {
        return thesisData.programes[idx].researchLines;
      } else {
        return [];
      }
    };

    const getThesisByProgramAndCountry = (iso_a3, filter) => {
      if (Object.keys(thesisData.paisos).includes(iso_a3)) {
        let idP = -1;
        let idRL = -1;
        idP = thesisData.paisos[iso_a3].programs.findIndex((f) => {
          return f.name === filter.program;
        });

        if (idP !== -1) {
          if (filter.researchLine === "") {
            return thesisData.paisos[iso_a3].programs[idP].count;
          } else {
            idRL = thesisData.paisos[iso_a3].programs[
              idP
            ].researchLines.findIndex((rl) => {
              return rl.name === filter.researchLine;
            });
            if (idRL !== -1) {
              return thesisData.paisos[iso_a3].programs[idP].researchLines[idRL]
                .count;
            } else {
              return 0;
            }
          }
        } else {
          return 0;
        }
      } else {
        return 0;
      }
    };

    const handleResetFilter = (filter) => {
      if (filter.program === "") {
        map.value.getSource("clusters").setData(centroidsData);
        map.value.getSource("countries").setData(countriesData);
        appStore.setCountryNames(thesisData.countryNames);
      } else {
        handleFilter(filter);
      }
    };

    const resetCountrySearch = () => {
      countriesData.features.forEach((element) => {
        map.value.setFeatureState(
          { source: "countries", id: element.id },
          { hover: false }
        );
      });
    };

    const toggleFilter = (e) => {
      context.emit("toggle-filter");
    };

    const reloadPage = (researchLine) => {
      location.reload();
    };

    return {
      map,
      filterButton,
      reloadButton,
      reloadPage,
      toggleFilter,
      mapContainer,
      handleFilter,
      toggleLayerType,
      countrySelected,
      handleResetFilter,
      resetCountrySearch,
    };
  },
};
</script>

<style>
/* POPUP STYLE */

.maplibregl-popup-tip {
  display: none;
}

.popupTitle {
  margin: unset;
  border: unset;
  display: flex;
  flex-direction: column;
}

.popupTitle div:first-child {
  padding-right: unset;
  padding-bottom: 10px;
}

.popupTitle .name,
.popupTitle .total {
  text-align: left;
}

.map .popupTitle .total span {
  text-transform: capitalize;
}

.map .maplibregl-popup-content {
  background: #000;
  color: white;
}

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

#filter-container {
  display: inline-flex;
  margin: 20px;
}

.reload-ctrl,
.filter-ctrl {
  margin: 0 2px 0 0;
  padding: 4px 8px;
}

.maplibregl-ctrl-compass {
  display: none !important;
}

.map .maplibregl-ctrl.reload-ctrl,
.map .maplibregl-ctrl.filter-ctrl,
.map .maplibregl-ctrl-group button {
  width: 40px;
  height: 40px;
}
.map .maplibregl-ctrl.reload-ctrl {
  background-image: url("assets/icons/refresh.svg");
}

.map .maplibregl-ctrl button.maplibregl-ctrl-zoom-in .maplibregl-ctrl-icon {
  background-image: url("assets/icons/zoomin.svg");
}

.map .maplibregl-ctrl button.maplibregl-ctrl-zoom-out .maplibregl-ctrl-icon {
  background-image: url("assets/icons/zoomout.svg");
}

.map .maplibregl-ctrl button.maplibregl-ctrl-fullscreen .maplibregl-ctrl-icon {
  background-image: url("assets/icons/full-screen.svg");
}

.map .maplibregl-ctrl button.maplibregl-ctrl-shrink .maplibregl-ctrl-icon {
  background-image: url("assets/icons/full-screen-selected.svg");
}

.map .maplibregl-ctrl.filter-ctrl {
  background-image: url("assets/icons/filters.svg");
}
</style>
