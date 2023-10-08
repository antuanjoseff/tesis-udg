import {
    clusters as clustersProperties,
    countries as countriesProperties,
    uncluster as unclusteredProperties,
  } from "src/lib/paintProperties.js";

import {
  getBbox,
  getCountryGeometry,
} from "src/lib/utils.js"

  function addLayersToMap(map, isClustered) {
    // COUNTRIES
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
      id: "unclustered-point",
      type: "circle",
      source: "clusters",
      layout: {
        visibility: "none",
      },
      filter: [">", ["get", "tesis"], 0],
      paint: unclusteredProperties,
    });

    map.value.addLayer({
      id: "unclustered-count",
      type: "symbol",
      source: "clusters",
      layout: {
        "text-field": ["get", "tesis"],
        "text-font": ["FiraSans-Bold"],
        "text-size": 14,
        visibility: "none",
      },      
      filter: [">", ["get", "tesis"], 0],
      paint: {
        "text-color": "#fff",
      },
    });

    // CLUSTERED
    map.value.addLayer({
      id: "clusters",
      type: "circle",
      source: "clusters",
      filter: [">", ["get", "sum"], 0],
      layout: {
        visibility: "none",
      },      
      paint: clustersProperties,
    });

    map.value.addLayer({
      id: "clustered-count",
      type: "symbol",
      source: "clusters",
      filter: [">", ["get", "sum"], 0],
      layout: {
        // 'text-field': '{point_count_abbreviated}',
        "text-field": ["get", "sum"],
        "text-font": ["FiraSans-Bold"],
        "text-size": 14,
        "visibility": "none",
      },
      paint: {
        "text-color": "#fff",
      },
    });

    // BODERS
    map.value.addLayer({
      id: "boundaries",
      type: "line",
      source: "countries",
      layout: {},
      // properties
      paint: {
        "line-color": "rgba(129, 66, 84, 1)",
        "line-width": [
          "case",
          ["==", ["to-number", ["get", "tesis"]], 0],
          0,
          ["boolean", ["feature-state", "hover"], false],
          2,
          0,
        ],
      },
    });
  }

  const flyToCountry = (map, countriesData, code) => {
    const countryGeom = getCountryGeometry(countriesData, code.toUpperCase());
    const bounds = getBbox(countryGeom);
    map.value.fitBounds(bounds, {
      padding: 20,
    });
  };


    export {
      addLayersToMap,
      flyToCountry,
    }