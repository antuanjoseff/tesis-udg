import {
    clusters as clustersProperties,
    countries as countriesProperties,
    uncluster as unclusteredProperties,
  } from "src/lib/paintProperties.js";

import {
  getBbox,
  getCountryGeometry,
} from "src/lib/utils.js"

const filterData = async (filter) => {
    filter = filter.toLowerCase();

    var schema = {
      type: "FeatureCollection",
      features: [],
    };
    var centroids = schema;
    var countries = schema;
    var filterFeatures;
    var filteredCountries = [];
    filterFeatures = centroidsData.features.filter((e) => {
      if (e.properties.abstract) {
        return e.properties.abstract.some((s) => {
          return s[0].toLowerCase().includes(filter);
        });
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
  };

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


  const resetFilter = (code) => {
    map.value.getSource("clusters").setData(centroidsData);
    map.value.getSource("countries").setData(countriesData);
    appStore.setCountryNames(thesisData.countryNames);
  };

  export {
    filterData,
    addLayersToMap,
    flyToCountry,
    resetFilter
  }