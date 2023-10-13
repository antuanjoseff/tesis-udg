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
      @resetCountrySearch="resetCountrySearch" 
    />
    <filter-box
      @filteredProgram="handleFilterProgram"
      @resetProgram="handleResetFilteredProgram"
    ></filter-box>
  </div>
  <template>
    <div ref="filterButton" id="control-filter-container">
      <button
        id="geocode-button"
        class="maplibregl-ctrl"
        @click="toggleFilter"
      >F</button>
    </div>    
  </template>

</template>

<script>
import { useAppStore } from "../stores/appStore.js";
import ToggleLayer from "components/ToggleLayer.vue";
import SearchCountry from "components/SearchCountry.vue";
import FilterBox from "components/FilterBox.vue";
import { Map, Popup, NavigationControl, LngLatBounds } from "maplibre-gl";
import { ref, shallowRef, onMounted, onUnmounted, markRaw, computed } from "vue";
import { addLayersToMap, flyToCountry } from "src/lib/maplib.js";
import {
  formatPopup,
  organizeThesisData,
  getData,
  addThesisDataTo,
} from "src/lib/utils.js";

export default {
  name: "TheMap",
  components: { ToggleLayer, SearchCountry, FilterBox },
  emits: ["toggle-filter"],
  setup(props, context) {
    const mapContainer = shallowRef(null);
    const map = shallowRef(null);
    const filterButton = ref()
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

    const toggleLayerType = () => {
      appStore.setClustered(!appStore.isClustered);
      if (isClustered.value) {
        map.value.setLayoutProperty("countries", "visibility", "none");
        map.value.setLayoutProperty("clusters", "visibility", "visible");
        map.value.setLayoutProperty("clustered-count", "visibility", "visible");
        map.value.setLayoutProperty(
          "unclustered",
          "visibility",
          "visible"
        );
      } else {
        map.value.setLayoutProperty("clusters", "visibility", "none");
        map.value.setLayoutProperty("clustered-count", "visibility", "none");
        map.value.setLayoutProperty("unclustered", "visibility", "none");
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

      const clickFilterButton = (e) => {
        console.log(e)
      }
      class GeocodeControl {
        onAdd(map) {

          // const template = document.createElement("template");
          // template.innerHTML = filterButton.value.innerHTML
          return filterButton.value
        }
      }


      map.value.once("load", async () => {
        const geocodeControl = new GeocodeControl();
        map.value.addControl(geocodeControl, "top-left");

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
        countriesData = await getData(countriesUrl);

        const noName = appStore.getLRnoName
        thesisData = organizeThesisData(originalData, noName);
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

      map.value.on("click", "unclustered", (e) => {
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

    const handleFilterProgram = (filteredProgram) => {
      let filteredCountriesData = JSON.parse(JSON.stringify(countriesData))
      let filteredCentroidsData = JSON.parse(JSON.stringify(centroidsData))
      
      filteredCountriesData.features.forEach((country, idx) => {
        filteredCountriesData.features[idx].properties.tesis = getThesisByProgramAndCountry(
          country.properties.iso_a3, filteredProgram
        )
      })

      filteredCentroidsData.features.forEach((country, idx) => {
        filteredCentroidsData.features[idx].properties.tesis = getThesisByProgramAndCountry(
          country.properties.iso_a3, filteredProgram
        )
      })

      map.value.getSource("countries").setData(filteredCountriesData);
      map.value.getSource("clusters").setData(filteredCentroidsData);      
      const programa = thesisData.programes.find((p) => {
        return p.name === filteredProgram
      })
      
      if (programa) {
        appStore.setResearchLines(programa.researchLines.sort((a, b) => {
          return a >= b ? 1 : -1
        }))
      }
    };

    const getThesisByProgramAndCountry = ((iso_a3, program) => {
      if (Object.keys(thesisData.paisos).includes(iso_a3)) {
        let idx = -1
        idx = thesisData.paisos[iso_a3].programs.findIndex((f) => {
          return (f.name === program) 
        })
        if (idx !== -1){
          return thesisData.paisos[iso_a3].programs[idx].count
        } else {
          return 0
        }

      } else {
        return 0
      }
    })

    const handleResetFilteredProgram = () => {
      map.value.getSource("clusters").setData(centroidsData);
      map.value.getSource("countries").setData(countriesData);
      appStore.setCountryNames(thesisData.countryNames);
    };

    const resetCountrySearch = () => {
      countriesData.features.forEach((element) => {
        map.value.setFeatureState(
          { source: "countries", id: element.id },
          { hover: false }
        );
      })
    };

    const toggleFilter = (e) => {
      context.emit('toggle-filter')
    };

    const filteredLine = (researchLine) => {
      console.log(researchLine)
    };

    return {
      map,
      filterButton,
      toggleFilter,
      mapContainer,
      handleFilterProgram,
      toggleLayerType,
      countrySelected,
      handleResetFilteredProgram,
      resetCountrySearch,
      filteredLine
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
